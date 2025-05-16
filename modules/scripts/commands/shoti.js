const axios = require("axios");
const sendMessage = require("../../../page/src/sendMessage");
const sendTypingIndicator = require("../../../page/src/sendTypingIndicator");

module.exports.config = {
  name: "shoti",
  author: "PageBot",
  version: "1.0",
  description: "Get a random Shoti video",
  category: "entertainment",
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

    // Let user know we're working
    await sendMsg("⏳ Fetching a random Shoti video, please wait...", event.sender.id);

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
      },
      messaging_type: "RESPONSE"
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

    // Stop typing indicator
    await typingIndicator(false, event.sender.id);

  } catch (error) {
    console.error('❌ Error fetching video:', error);
    const sendMsg = sendMessage(event);
    await sendMsg("❌ Error: Could not fetch video.", event.sender.id);
  }
}; 