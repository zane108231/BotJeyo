const axios = require("axios");
const sendMessage = require("../../../page/src/sendMessage");
const sendTypingIndicator = require("../../../page/src/sendTypingIndicator");

module.exports.config = {
  name: "ascii",
  author: "PageBot",
  version: "1.0",
  description: "Convert text to ASCII art (vertical layout)",
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

    // Check if text was provided
    if (!args || args.length === 0) {
      await sendMsg("❌ Please provide text to convert to ASCII art.\nExample: ascii Hello World", event.sender.id);
      return;
    }

    // Get the text from args
    const text = args.join(" ").trim();

    // Show typing indicator
    await typingIndicator(true, event.sender.id);

    // Inform user we're processing
    await sendMsg("⏳ Converting your text to vertical ASCII art, please wait...", event.sender.id);

    // Call the ASCII art API with vertical layout
    const response = await axios.post('https://jihyoascii.onrender.com/api/text-to-ascii/vertical', {
      text: text
    });

    // Check if response is valid
    if (!response.data || !response.data.success || !response.data.ascii) {
      await sendMsg("❌ Error: Could not generate ASCII art.", event.sender.id);
      return;
    }

    // Send the ASCII art
    const asciiArt = response.data.ascii;
    await sendMsg(`🎨 Here's your vertical ASCII art:\n\n\`\`\`\n${asciiArt}\n\`\`\``, event.sender.id);

    // Stop typing indicator
    await typingIndicator(false, event.sender.id);

  } catch (error) {
    console.error('❌ Error in ascii command:', error);
    const sendMsg = sendMessage(event);
    await sendMsg("❌ Error: Could not generate ASCII art. Please try again later.", event.sender.id);
  }
}; 