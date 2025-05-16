const axios = require("axios");
const sendMessage = require("../../../page/src/sendMessage");
const sendTypingIndicator = require("../../../page/src/sendTypingIndicator");
const sendAttachment = require("../../../page/src/sendAttachment");

module.exports.config = {
  name: "tiktokdl",
  author: "PageBot",
  version: "1.0",
  description: "Download TikTok videos without watermark",
  category: "social",
  cooldown: 5,
  usePrefix: true,
  adminOnly: false
};

module.exports.run = async function({ event, args }) {
  try {
    // Initialize API functions with event
    const sendMsg = sendMessage(event);
    const typingIndicator = sendTypingIndicator(event);
    const sendAttach = sendAttachment(event);

    // Check if URL was provided
    if (!args || args.length === 0) {
      await sendMsg("❌ Please provide a TikTok URL.\nExample: tiktokdl <tiktok-url>", event.sender.id);
      return;
    }

    const tiktokUrl = args[0].trim();

    // Validate URL
    if (!tiktokUrl.includes('tiktok.com')) {
      await sendMsg("❌ Invalid TikTok URL. Please provide a valid TikTok video URL.", event.sender.id);
      return;
    }

    // Show typing indicator
    await typingIndicator(true, event.sender.id);

    // Inform user we're processing
    await sendMsg("⏳ Processing your TikTok video, please wait...", event.sender.id);

    // Call TikWM API
    const apiUrl = `https://www.tikwm.com/api/?url=${encodeURIComponent(tiktokUrl)}`;
    const { data } = await axios.get(apiUrl);

    // Check if response is valid
    if (!data || data.code !== 0 || !data.data) {
      await sendMsg("❌ Error: Could not fetch video information from TikTok.", event.sender.id);
      return;
    }

    const videoData = data.data;

    // Extract caption and author info
    const caption = videoData.title || 'No caption available';
    const authorUsername = videoData.author?.unique_id || 'unknown';
    const authorNickname = videoData.author?.nickname || 'Unknown User';

    // Prepare the message with caption and author info
    const infoMessage = `🎬 𝗖𝗮𝗽𝘁𝗶𝗼𝗻: ${caption}\n👤 𝗔𝘂𝘁𝗵𝗼𝗿: @${authorUsername} (${authorNickname})`;

    // Send the info message
    await sendMsg(infoMessage, event.sender.id);

    // Inform user we're sending the video
    await sendMsg("📤 Sending your TikTok video without watermark...", event.sender.id);

    // Send the video using sendAttachment
    await sendAttach('video', videoData.play, event.sender.id);

    // Stop typing indicator
    await typingIndicator(false, event.sender.id);

  } catch (error) {
    console.error('❌ Error in tiktokdl command:', error);
    const sendMsg = sendMessage(event);
    await sendMsg("❌ Error: Could not process the TikTok video. Please try again later.", event.sender.id);
  }
}; 