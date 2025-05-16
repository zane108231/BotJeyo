const config = require("../../../config.json");
const sendMessage = require("../../../page/src/sendMessage");
const sendTypingIndicator = require("../../../page/src/sendTypingIndicator");
const axios = require("axios");

module.exports.config = {
  name: "Feedback",
  author: "PageBot",
  version: "1.0",
  description: "Send feedback to bot admins",
  category: "utility",
  cooldown: 5,
  usePrefix: true,
  adminOnly: false
};

// Function to get user info from Messenger Platform API
async function getUserInfo(userId) {
  try {
    const response = await axios.get(
      `https://graph.facebook.com/v18.0/me/messages`,
      {
        params: {
          recipient: { id: userId },
          fields: 'name,first_name,last_name,profile_pic',
          access_token: config.PAGE_ACCESS_TOKEN
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('[Feedback] Error fetching user info:', error.message);
    return null;
  }
}

module.exports.run = async function({ event, args }) {
  try {
    const sendMsg = sendMessage(event);
    const typingIndicator = sendTypingIndicator(event);

    // Check if message is provided
    if (!args.length) {
      await sendMsg("❌ Please provide your feedback message.\nUsage: /feedback <message>");
      return;
    }

    const feedbackMessage = args.join(" ");
    const userID = event.sender.id;

    await typingIndicator(true);

    // Check if there are any admins configured
    if (!config.ADMINS || config.ADMINS.length === 0) {
      console.error('[Feedback] No admins configured in config.json');
      await sendMsg("❌ Error: No admins configured. Please contact the bot owner.");
      return;
    }

    console.log('[Feedback] Attempting to send feedback to admins:', config.ADMINS);

    let successCount = 0;
    let failCount = 0;

    // Send feedback to all admins
    for (const adminID of config.ADMINS) {
      try {
        await sendMsg(`📝 New Feedback from User ${userID}:\n\n${feedbackMessage}`, adminID);
        successCount++;
        console.log(`[Feedback] Successfully sent to admin ${adminID}`);
      } catch (error) {
        failCount++;
        console.error(`[Feedback] Failed to send to admin ${adminID}:`, error.message);
      }
    }

    await typingIndicator(false);

    // Send success/failure message to the user who sent the feedback
    try {
      if (successCount > 0) {
        await sendMsg("✅ Your feedback has been sent to the admins. Thank you!", userID);
      } else {
        await sendMsg("❌ Could not send feedback to any admins. Please try again later or contact the bot owner.", userID);
      }
    } catch (error) {
      // Silently handle error for user response - don't log it since it's not critical
      console.log('[Feedback] Note: Could not send confirmation message to user');
    }

  } catch (error) {
    console.error('[Feedback] Error:', error);
    try {
      const sendMsg = sendMessage(event);
      await sendMsg("❌ An error occurred while sending your feedback. Please try again later.", event.sender.id);
    } catch (e) {
      // Silently handle error for user response
      console.log('[Feedback] Note: Could not send error message to user');
    }
  }
};
