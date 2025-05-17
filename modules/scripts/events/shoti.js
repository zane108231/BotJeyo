const axios = require("axios");
const sendMessage = require("../../../page/src/sendMessage");
const sendTypingIndicator = require("../../../page/src/sendTypingIndicator");
const cooldownManager = require("../utils/cooldownManager");

module.exports.config = {
  name: "Shoti Event Handler",
  author: "PageBot",
  version: "1.0",
  description: "Handles postback events for Shoti command",
  selfListen: false
};

// Handle regular messages
module.exports.run = async function({ event }) {
  // This is an event handler for postbacks only, so we don't need to do anything here
  return;
};

// Handle postback events
module.exports.onPostback = async function({ event }) {
  try {
    // Only handle postback events
    if (!event.postback) return;

    const payload = event.postback.payload;
    if (payload !== 'shoti') return;

    console.log('[Shoti] Received postback:', payload);

    const sendMsg = sendMessage(event);
    const typingIndicator = sendTypingIndicator(event);

    // Check if user is already fetching a video
    if (cooldownManager.isUserActive(event.sender.id)) {
      await sendMsg("⏳ Please wait for your current video to finish loading before requesting another one.", event.sender.id);
      return;
    }

    // Check if user can execute postback
    const { canExecute, message } = cooldownManager.checkPostbackCooldown(event.sender.id, payload);
    if (!canExecute) {
      await sendMsg(message, event.sender.id);
      return;
    }

    // Lock user's activity
    cooldownManager.lockUser(event.sender.id);
    // Lock postback execution
    cooldownManager.lockPostback(event.sender.id, payload);

    try {
      // Show typing indicator
      await typingIndicator(true, event.sender.id);

      // Let user know we're working
      await sendMsg("⏳ Fetching another random Shoti video, please wait...", event.sender.id);

      // Call the API
      const { data } = await axios.get('https://betadash-shoti-yazky.vercel.app/shotizxx?apikey=shipazu');

      if (!data.shotiurl) {
        await sendMsg("❌ No video found.", event.sender.id);
        return;
      }

      const { title, username, nickname, region } = data;

      // Send the Shoti video info
      const infoMessage = `🎬 𝗧𝗶𝘁𝗹𝗲: ${title}\n👤 𝗨𝗦𝗲𝗿𝗻𝗮𝗺𝗲: ${username}\n💬 𝗡𝗶𝗰𝗸𝗻𝗮𝗺𝗲: ${nickname}\n📍 𝗥𝗲𝗴𝗶𝗼𝗻: ${region}`;
      await sendMsg(infoMessage, event.sender.id);

      // Step 1: Upload the video as an attachment
      const uploadResponse = await axios.post(
        `https://graph.facebook.com/v22.0/me/message_attachments`,
        {
          message: {
            attachment: {
              type: 'video',
              payload: {
                url: data.shotiurl,
                is_reusable: true
              }
            }
          }
        },
        {
          params: {
            access_token: PAGE_ACCESS_TOKEN
          }
        }
      );

      const attachmentId = uploadResponse.data.attachment_id;

      // Step 2: Send the media template with the attachment ID
      const form = {
        recipient: { id: event.sender.id },
        message: {
          attachment: {
            type: 'template',
            payload: {
              template_type: 'media',
              elements: [
                {
                  media_type: 'video',
                  attachment_id: attachmentId,
                  buttons: [
                    {
                      type: 'web_url',
                      url: data.shotiurl,
                      title: 'Download'
                    },
                    {
                      type: 'postback',
                      title: 'Get Another',
                      payload: 'shoti'
                    }
                  ]
                }
              ]
            }
          }
        }
      };

      // Send the template using axios
      await axios.post(
        `https://graph.facebook.com/v22.0/me/messages`,
        form,
        {
          params: {
            access_token: PAGE_ACCESS_TOKEN
          }
        }
      );

      // Set postback cooldown after successful execution
      cooldownManager.setPostbackCooldown(event.sender.id, payload, 10);

    } catch (error) {
      console.error('[Shoti] Error:', error);
      await sendMsg("❌ Error: Could not fetch video.", event.sender.id);
    } finally {
      // Stop typing indicator
      await typingIndicator(false, event.sender.id);
      // Unlock user's activity
      cooldownManager.unlockUser(event.sender.id);
      // Unlock postback execution
      cooldownManager.unlockPostback(event.sender.id);
    }

  } catch (error) {
    console.error('[Shoti] Postback Error:', error);
    const sendMsg = sendMessage(event);
    await sendMsg("❌ Error: Could not process your request.", event.sender.id);
    // Make sure to unlock everything if there was an error
    cooldownManager.unlockUser(event.sender.id);
    cooldownManager.unlockPostback(event.sender.id);
  }
}; 