const axios = require('axios');

class GraphAPI {
  constructor(pageAccessToken) {
    this.pageAccessToken = pageAccessToken;
    this.baseUrl = 'https://graph.facebook.com/v20.0';
  }

  async sendRequest(endpoint, payload) {
    try {
      const response = await axios.post(
        `${this.baseUrl}${endpoint}?access_token=${this.pageAccessToken}`,
        payload,
        { headers: { 'Content-Type': 'application/json' } }
      );
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data || error.message;
      console.error(`Graph API Error: ${errorMessage}`);
      throw errorMessage;
    }
  }

  // Message methods
  async sendMessage(recipientId, text) {
    const payload = {
      recipient: { id: recipientId },
      message: { text },
      messaging_type: "RESPONSE"
    };
    return this.sendRequest('/me/messages', payload);
  }

  async sendAttachment(recipientId, attachment) {
    const payload = {
      recipient: { id: recipientId },
      message: { attachment },
      messaging_type: "RESPONSE"
    };
    return this.sendRequest('/me/messages', payload);
  }

  async sendButton(recipientId, text, buttons) {
    const payload = {
      recipient: { id: recipientId },
      message: {
        attachment: {
          type: 'template',
          payload: {
            template_type: 'button',
            text,
            buttons
          }
        }
      },
      messaging_type: "RESPONSE"
    };
    return this.sendRequest('/me/messages', payload);
  }

  // Action methods
  async markAsSeen(recipientId, markAsSeen = true) {
    const payload = {
      recipient: { id: recipientId },
      sender_action: markAsSeen ? "mark_seen" : "mark_unread"
    };
    return this.sendRequest('/me/messages', payload);
  }

  async setTypingIndicator(recipientId, isTyping = true) {
    const payload = {
      recipient: { id: recipientId },
      sender_action: isTyping ? "typing_on" : "typing_off"
    };
    return this.sendRequest('/me/messages', payload);
  }

  async setMessageReaction(messageId, reaction) {
    const payload = {
      reaction
    };
    return this.sendRequest(`/${messageId}/reactions`, payload);
  }
}

module.exports = GraphAPI; 