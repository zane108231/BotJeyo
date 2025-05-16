const sendMessage = require("../../../page/src/sendMessage");
const sendTypingIndicator = require("../../../page/src/sendTypingIndicator");

module.exports.config = {
  name: "getid",
  author: "PageBot",
  version: "1.0",
  description: "Get your Facebook user ID",
  category: "utility",
  cooldown: 0,
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

    // Get the sender's ID
    const userId = event.sender.id;
    
    // Create a message with the ID and instructions
    const message = `🔍 Your Facebook User ID: \`${userId}\`

To add this ID as an admin:
1. Copy the ID above
2. Open config.json
3. Add the ID to the ADMINS array like this:
   "ADMINS": [
     "${userId}"
   ]`;

    // Send the message
    await sendMsg(message, event.sender.id);

    // Stop typing indicator
    await typingIndicator(false, event.sender.id);

  } catch (error) {
    console.error('[GetID] Error:', error);
    const sendMsg = sendMessage(event);
    await sendMsg("❌ Error: Could not fetch your ID.", event.sender.id);
  }
}; 