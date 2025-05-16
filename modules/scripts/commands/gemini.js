const sendMessage = require("../../../page/src/sendMessage");
const sendTypingIndicator = require("../../../page/src/sendTypingIndicator");
const axios = require("axios");

module.exports = {
  config: {
    name: "gemini",
    usePrefix: true,
    cooldown: 5,
    adminOnly: false,
    description: "Interact with Gemini AI using Kaiz API",
    category: "ai",
    version: "1.0.0",
    author: "PageBot"
  },

  run: async function({ event, args }) {
    try {
      // Initialize API functions with event
      const sendMsg = sendMessage(event);
      const typingIndicator = sendTypingIndicator(event);

      // Check if there's a question
      if (!args.length) {
        return sendMsg("Please provide a question for Gemini AI.", event.sender.id);
      }

      // Show typing indicator
      await typingIndicator(true, event.sender.id);

      // Get the question from args
      const question = args.join(" ");

      // Make API request
      const response = await axios.get(`https://kaiz-apis.gleeze.com/api/gpt4o-mini?ask=${encodeURIComponent(question)}`);
      
      // Stop typing indicator
      await typingIndicator(false, event.sender.id);

      // Send the response
      if (response.data && response.data.response) {
        await sendMsg(response.data.response, event.sender.id);
      } else {
        throw new Error("Invalid response from API");
      }

    } catch (error) {
      console.error("Error in gemini command:", error);
      const sendMsg = sendMessage(event);
      await sendMsg("Sorry, I encountered an error while processing your request.", event.sender.id);
    }
  }
}; 