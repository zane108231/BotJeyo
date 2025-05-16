const config = require("./config.json");
const utils = require("./modules/utils");
const fs = require("fs").promises;
const path = require("path");

let messagesCache;
const messagesFilePath = "./page/data.json";
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB
const MAX_CACHE_ENTRIES = 1000;

async function initializeCache() {
  try {
    if (config.clearData) {
      messagesCache = {};
    } else {
      const data = await fs.readFile(messagesFilePath, "utf8");
      messagesCache = JSON.parse(data);
    }
  } catch (error) {
    console.error("Error initializing cache:", error);
    messagesCache = {};
  }
}

async function writeToFile() {
  try {
    const dataToWrite = JSON.stringify(messagesCache, null, 2);
    
    try {
      const stats = await fs.stat(messagesFilePath);
      if (stats.size > MAX_FILE_SIZE) {
        await pruneMessagesCache();
      }
    } catch (error) {
      // File doesn't exist yet, that's okay
    }

    await fs.writeFile(messagesFilePath, dataToWrite, "utf8");
  } catch (error) {
    console.error("Error writing to file:", error);
  }
}

async function pruneMessagesCache() {
  const keys = Object.keys(messagesCache);
  if (keys.length > MAX_CACHE_ENTRIES) {
    // Remove oldest 20% of entries when pruning
    const entriesToRemove = Math.floor(MAX_CACHE_ENTRIES * 0.2);
    const keysToRemove = keys.slice(0, entriesToRemove);
    keysToRemove.forEach(key => delete messagesCache[key]);
  }
}

// Initialize cache on startup
initializeCache();

module.exports.listen = async function (event) {
  try {
    if (event.object === "page") {
      for (const entry of event.entry) {
        for (const messagingEvent of entry.messaging) {
          messagingEvent.type = await utils.getEventType(messagingEvent);
          global.PAGE_ACCESS_TOKEN = config.PAGE_ACCESS_TOKEN;

          if (["message", "message_reply", "attachments", "message_reaction"].includes(messagingEvent.type)) {
            const mid = messagingEvent.message?.mid || messagingEvent.reaction?.mid;

            if (["message", "attachments", "message_reply"].includes(messagingEvent.type)) {
              const text = messagingEvent.message?.text;
              const attachments = messagingEvent.message?.attachments;

              if (mid && text) {
                messagesCache[mid] = { text };
              }

              if (mid && attachments) {
                if (!messagesCache[mid]) messagesCache[mid] = {};
                messagesCache[mid].attachments = attachments;
              }
            }

            if (messagingEvent.type === "message_reply") {
              const messageID = messagingEvent.message.reply_to?.mid;
              const cachedMessage = messageID ? messagesCache[messageID] : null;

              if (messagingEvent.message.reply_to) {
                messagingEvent.message.reply_to.text = cachedMessage?.text || null;
                messagingEvent.message.reply_to.attachments = cachedMessage?.attachments || null;
              }
            }

            if (messagingEvent.type === "message_reaction") {
              const cachedMessage = mid ? messagesCache[mid] : null;
              if (cachedMessage) {
                messagingEvent.reaction.text = cachedMessage.text || null;
                messagingEvent.reaction.attachments = cachedMessage.attachments || null;
              } else {
                messagingEvent.reaction.text = null;
                messagingEvent.reaction.attachments = null;
              }
            }
          }
          
          if (config.selfListen && messagingEvent?.message?.is_echo) continue;
          await writeToFile();
          utils.log(messagingEvent);

          require("./page/main")(messagingEvent);
        }
      }
    }
  } catch (error) {
    console.error("Error in webhook listener:", error);
  }
};