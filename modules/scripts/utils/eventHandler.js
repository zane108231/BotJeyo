const sendMessage = require("../../../page/src/sendMessage");
const sendTypingIndicator = require("../../../page/src/sendTypingIndicator");
const sendAttachment = require("../../../page/src/sendAttachment");

class EventHandler {
  constructor(config) {
    this.config = config;
    this.activeUsers = new Set();
  }

  // Check if user is already processing a request
  isUserActive(userId) {
    return this.activeUsers.has(userId);
  }

  // Add user to active set
  addActiveUser(userId) {
    this.activeUsers.add(userId);
  }

  // Remove user from active set
  removeActiveUser(userId) {
    this.activeUsers.delete(userId);
  }

  // Initialize API functions with event
  initApiFunctions(event) {
    return {
      sendMsg: sendMessage(event),
      typingIndicator: sendTypingIndicator(event),
      sendAttach: sendAttachment(event)
    };
  }

  // Show typing indicator and handle cleanup
  async withTypingIndicator(event, callback) {
    const { typingIndicator } = this.initApiFunctions(event);
    try {
      await typingIndicator(true, event.sender.id);
      await callback();
    } finally {
      await typingIndicator(false, event.sender.id);
    }
  }

  // Handle errors with proper cleanup
  async handleError(event, error, customMessage = null) {
    console.error(`[${this.config.name}] Error:`, error);
    const { sendMsg } = this.initApiFunctions(event);
    await sendMsg(customMessage || "❌ An error occurred. Please try again later.", event.sender.id);
  }

  // Base run method - override in subclasses
  async run({ event }) {
    // Override in subclasses
  }

  // Base postback method - override in subclasses
  async onPostback({ event }) {
    // Override in subclasses
  }
}

module.exports = EventHandler; 