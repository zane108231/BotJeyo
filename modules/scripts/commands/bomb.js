const axios = require("axios");
const sendMessage = require("../../../page/src/sendMessage");
const sendTypingIndicator = require("../../../page/src/sendTypingIndicator");

module.exports.config = {
  name: "bomb",
  author: "PageBot",
  version: "1.0",
  description: "Send multiple messages in quick succession",
  category: "utility",
  cooldown: 5,
  usePrefix: true,
  adminOnly: false
};

module.exports.run = async function({ event, args }) {
  try {
    // Initialize API functions with event
    const sendMsg = sendMessage(event);
    const typingIndicator = sendTypingIndicator(event);

    // Show typing indicator
    await typingIndicator(true, event.sender.id);

    // Parse arguments
    const input = args.join(' ');
    const parts = input.split(' -');
    
    if (parts.length < 2) {
      await sendMsg("Please use the format: /bomb username message -count", event.sender.id);
      return;
    }

    const username = parts[0].split(' ')[0]; // Get username (first word)
    const message = parts[0].split(' ').slice(1).join(' '); // Get message (rest of the words)
    const count = parseInt(parts[1]) || 5; // Get count after the dash

    if (!username || !message) {
      await sendMsg("Please provide both username and message. Usage: /bomb username message -count", event.sender.id);
      return;
    }

    // Validate count
    if (count < 1 || count > 100) {
      await sendMsg("Please specify a count between 1 and 100.", event.sender.id);
      return;
    }

    // Let user know we're starting
    await sendMsg(`🚀 Starting message bomb to @${username} with ${count} messages...`, event.sender.id);

    // Call the API
    const response = await axios.get(`https://gwapongl.onrender.com/send-stream?username=${encodeURIComponent(username)}&question=${encodeURIComponent(message)}&count=${count}`);

    // Stop typing indicator
    await typingIndicator(false, event.sender.id);

    // Send completion message
    await sendMsg(`✅ Message bomb completed! Sent ${count} messages to @${username}`, event.sender.id);

  } catch (error) {
    console.error('Error in bomb command:', error);
    const sendMsg = sendMessage(event);
    await sendMsg("❌ Error: Could not send messages.", event.sender.id);
  }
}; 