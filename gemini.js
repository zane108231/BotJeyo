const axios = require("axios");
const sendMessage = require("../../../page/src/sendMessage");
const sendTypingIndicator = require("../../../page/src/sendTypingIndicator");

// Store conversation context
const conversations = new Map();

// List of command names to ignore (without prefixes)
const commandNames = [
  'pinterest',
  'shoti',
  'bomb',
  'gemini',
  'gpt',
  'payload'
];

module.exports.config = {
  name: "Gemini AI Handler",
  author: "PageBot",
  version: "1.0",
  description: "Handles continuous conversations with Gemini AI",
  selfListen: false
};

module.exports.run = async function({ event, args }) {
  try {
    // Initialize API functions with event
    const sendMsg = sendMessage(event);
    const typingIndicator = sendTypingIndicator(event);

    // Handle text messages
    if (event.type === "message" && event.message?.text) {
      const messageText = event.message.text.trim();
      
      // Ignore messages that start with command prefixes
      if (messageText.startsWith('-') || messageText.startsWith('!') || messageText.startsWith('/')) {
        return; // Exit early if it's a command
      }

      // Check if the message is just a command name
      const firstWord = messageText.split(' ')[0].toLowerCase();
      if (commandNames.includes(firstWord)) {
        return; // Exit early if it's a command name
      }

      // Show typing indicator
      await typingIndicator(true, event.sender.id);

      // Get or create conversation context for this user
      if (!conversations.has(event.sender.id)) {
        conversations.set(event.sender.id, {
          messages: [],
          lastInteraction: Date.now()
        });
      }

      const conversation = conversations.get(event.sender.id);
      
      // Add user's message to conversation history
      conversation.messages.push({
        role: "user",
        content: messageText
      });

      // Keep only last 10 messages for context
      if (conversation.messages.length > 10) {
        conversation.messages = conversation.messages.slice(-10);
      }

      // Create context from conversation history
      const context = conversation.messages
        .map(msg => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
        .join("\n");

      // Get response from Gemini API with context
      const response = await axios.get(`http://sgp1.hmvhostings.com:25721/gemini?question=${encodeURIComponent(context)}`);
      
      // Stop typing indicator
      await typingIndicator(false, event.sender.id);

      if (response.data && response.data.answer) {
        // Add bot's response to conversation history
        conversation.messages.push({
          role: "assistant",
          content: response.data.answer
        });

        // Update last interaction time
        conversation.lastInteraction = Date.now();

        // Format the response with the new style
        const formattedResponse = `✧ | 𝗚𝗘𝗠𝗜𝗡𝗜-𝗙𝗟𝗔𝗦𝗛 𝟭.𝟱
━━━━━━━━━━━━━
${response.data.answer}

━━━━━━━━━━━━━`;

        await sendMsg(formattedResponse, event.sender.id);
      }
    }

  } catch (error) {
    console.error("Error in Gemini AI Handler:", error);
    const sendMsg = sendMessage(event);
    await sendMsg("Sorry, I encountered an error while processing your request.", event.sender.id);
  }
}; 