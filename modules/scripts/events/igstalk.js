const sendMessage = require("../../../page/src/sendMessage");
const sendTypingIndicator = require("../../../page/src/sendTypingIndicator");
const sendAttachment = require("../../../page/src/sendAttachment");
const igstalk = require("../commands/igstalk");
const cooldownManager = require("../utils/cooldownManager");

module.exports.config = {
  name: "IGStalk Postback Handler",
  author: "PageBot",
  version: "1.0",
  description: "Handles postback events for IGStalk command",
  selfListen: false
};

// Add run function to handle regular messages
module.exports.run = async function({ event }) {
  // This is an event handler for postbacks only, so we don't need to do anything here
  return;
};

module.exports.onPostback = async function({ event }) {
  const sendMsg = sendMessage(event);
  const typingIndicator = sendTypingIndicator(event);
  const sendAttach = sendAttachment(event);

  try {
    // Only handle postback events
    if (event.type !== 'postback') return;

    const payload = event.postback.payload;
    if (!payload.startsWith('igstalk_')) return;

    console.log('[IGStalk] Received postback:', payload);

    // Check if user can execute postback
    const { canExecute, message } = cooldownManager.checkPostbackCooldown(event.sender.id, payload);
    if (!canExecute) {
      await sendMsg(message, event.sender.id);
      return;
    }

    // Lock postback execution
    cooldownManager.lockPostback(event.sender.id, payload);

    const [_, type, username] = payload.split('_');
    const userData = igstalk.userData.get(event.sender.id);

    if (!userData) {
      await sendMsg('❌ Session expired. Please use the command again.', event.sender.id);
      return;
    }

    await typingIndicator(true, event.sender.id);

    if (type === 'stories') {
      await igstalk.handleStories(userData.stories, event, sendMsg, sendAttach);
    } else if (type === 'posts') {
      await igstalk.handlePosts(userData.posts, event, sendMsg, sendAttach);
    }

    // Set cooldown (3 seconds)
    cooldownManager.setPostbackCooldown(event.sender.id, payload, 3);

  } catch (error) {
    console.error('[IGStalk] Postback Error:', error);
    await sendMsg('❌ Error processing your request. Please try again.', event.sender.id);
  } finally {
    // Stop typing indicator
    await typingIndicator(false, event.sender.id);
    // Unlock postback execution
    cooldownManager.unlockPostback(event.sender.id);
  }
}; 
