const fs = require("fs");
const path = require("path");
const sendMessage = require("../../../page/src/sendMessage");

module.exports.config = {
  name: "help",
  author: "Jihyo Woon",
  version: "1.0",
  category: "Utility",
  description: "Sends a back greeting message and lists all commands and events.",
  adminOnly: false,
  usePrefix: true,
  cooldown: 5, // Cooldown time in seconds
};

module.exports.run = async function ({ event, args }) {
  try {
    // Check if this is a message or a help postback
    const isHelpPostback = event.type === "postback" && event.postback?.payload === "HELP_PAYLOAD";
    const isMessage = event.type === "message";

    if (isMessage || isHelpPostback) {
      const commandsPath = path.join(__dirname, "../commands");
      const eventsPath = path.join(__dirname, "../events");

      let message = "Here are the available commands and events:\n\n";

      // Load and log command details
      const commandFiles = fs
        .readdirSync(commandsPath)
        .filter((file) => file.endsWith(".js"));
      message += "Commands:\n";
      commandFiles.forEach((file) => {
        const command = require(path.join(commandsPath, file));
        if (command.config) {
          message += `/${command.config.name}\n`;
          message += `Author: ${command.config.author}\n`;
          message += `Description: ${command.config.description}\n\n`;
        }
      });

      // Load and log event details
      const eventFiles = fs
        .readdirSync(eventsPath)
        .filter((file) => file.endsWith(".js"));
      message += "Events:\n";
      eventFiles.forEach((file) => {
        const event = require(path.join(eventsPath, file));
        if (event.config) {
          message += `- ${event.config.name}\n`;
          message += `Author: ${event.config.author}\n`;
          message += `Description: ${event.config.description}\n\n`;
        }
      });

      message += "Feel free to use these commands and events as you wish.";
      
      // Send the message using sendMessage
      const sendMsg = sendMessage(event);
      await sendMsg(message, event.sender.id);
    }
  } catch (error) {
    console.error("Error in help command:", error);
    const sendMsg = sendMessage(event);
    await sendMsg("❌ An error occurred while fetching help information.", event.sender.id);
  }
};
