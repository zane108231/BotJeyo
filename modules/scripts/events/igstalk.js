const sendMessage = require("../../../page/src/sendMessage");
const sendTypingIndicator = require("../../../page/src/sendTypingIndicator");
const sendAttachment = require("../../../page/src/sendAttachment");
const igstalk = require("../commands/igstalk");

module.exports.config = {
  name: "IGStalk Postback Handler",
  author: "PageBot",
  version: "1.0",
  description: "Handles postback events for IGStalk command",
  selfListen: false
};

module.exports.onPostback = async function({ event }) {
  try {
    // Only handle postback events
    if (event.type !== 'postback') return;

    const payload = event.postback.payload;
    if (!payload.startsWith('igstalk_')) return;

    console.log('[IGStalk] Received postback:', payload);

    const sendMsg = sendMessage(event);
    const typingIndicator = sendTypingIndicator(event);
    const sendAttach = sendAttachment(event);

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

    await typingIndicator(false, event.sender.id);

  } catch (error) {
    console.error('[IGStalk] Postback Error:', error);
    const sendMsg = sendMessage(event);
    await sendMsg('❌ Error processing your request. Please try again.', event.sender.id);
  }
}; 
