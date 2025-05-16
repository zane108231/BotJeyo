const sendMessage = require("../../../page/src/sendMessage");
const sendTypingIndicator = require("../../../page/src/sendTypingIndicator");
const sendAttachment = require("../../../page/src/sendAttachment");
const ytsearch = require("../commands/ytsearch");

module.exports.config = {
  name: "YTSearch Reply Handler",
  author: "PageBot",
  version: "1.0",
  description: "Handles reply messages for YTSearch command",
  selfListen: false
};

module.exports.run = async function({ event }) {
  try {
    // Only handle message_reply events
    if (event.type !== 'message_reply') {
      console.log('[YTSearch] Not a reply event:', event.type);
      return;
    }

    console.log('[YTSearch] Received reply:', event.message.text);

    const sendMsg = sendMessage(event);
    const typingIndicator = sendTypingIndicator(event);
    const sendAttach = sendAttachment(event);

    // Get stored results for this user
    const searchData = ytsearch.userSearches.get(event.sender.id);
    console.log('[YTSearch] Stored videos for user:', searchData ? searchData.videos.length : 0);
    
    if (!searchData || !searchData.videos) {
      await sendMsg("❌ No active search results found. Please search again.", event.sender.id);
      return;
    }

    // Parse selection - remove any non-numeric characters
    const selection = parseInt(event.message.text.replace(/[^0-9]/g, ''));
    console.log('[YTSearch] Parsed selection:', selection);
    
    if (isNaN(selection) || selection < 1 || selection > 5) {
      await sendMsg("❌ Please select a valid number between 1 and 5.", event.sender.id);
      return;
    }

    const selectedVideo = searchData.videos[selection - 1];
    if (!selectedVideo) {
      await sendMsg("❌ Invalid selection. Please try again.", event.sender.id);
      return;
    }

    // Show typing indicator
    await typingIndicator(true, event.sender.id);

    // Inform user we're processing
    await sendMsg(`⏳ Processing video: ${selectedVideo.title}`, event.sender.id);

    // Get video stream URL
    const streamUrl = `https://haji-mix-api.gleeze.com/api/autodl?url=${encodeURIComponent(selectedVideo.url)}&stream=true`;

    // Send video info
    const videoInfo = `🎥 𝗧𝗶𝘁𝗹𝗲: ${selectedVideo.title}\n👤 𝗖𝗵𝗮𝗻𝗻𝗲𝗹: ${selectedVideo.author.name}\n⏱️ 𝗗𝘂𝗿𝗮𝘁𝗶𝗼𝗻: ${selectedVideo.duration}\n🔗 𝗨𝗥𝗟: ${selectedVideo.url}`;
    await sendMsg(videoInfo, event.sender.id);

    // Send the video
    await sendAttach('video', streamUrl, event.sender.id);

    // Clear stored results
    ytsearch.userSearches.delete(event.sender.id);

    // Stop typing indicator
    await typingIndicator(false, event.sender.id);

  } catch (error) {
    console.error('[YTSearch] Reply Error:', error);
    const sendMsg = sendMessage(event);
    await sendMsg("❌ Error: Could not process the video. Please try again later.", event.sender.id);
  }
};

module.exports.config = {
  name: "YTSearch Postback Handler",
  author: "PageBot",
  version: "1.0",
  description: "Handles postback events for YTSearch command",
  selfListen: false
};

module.exports.run = async function({ event }) {
  try {
    // Only handle postback events
    if (event.type !== 'postback') return;

    const payload = event.postback.payload;
    if (!payload.startsWith('ytsearch_download_')) return;

    console.log('[YTSearch] Received postback:', payload);

    const sendMsg = sendMessage(event);
    const typingIndicator = sendTypingIndicator(event);
    const sendAttach = sendAttachment(event);

    // Extract video ID from payload
    const videoId = payload.replace('ytsearch_download_', '');
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

    // Show typing indicator
    await typingIndicator(true, event.sender.id);

    // Inform user we're processing
    await sendMsg(`⏳ Processing video...`, event.sender.id);

    // Get video stream URL
    const streamUrl = `https://haji-mix-api.gleeze.com/api/autodl?url=${encodeURIComponent(videoUrl)}&stream=true`;

    // Send the video
    await sendAttach('video', streamUrl, event.sender.id);

    // Stop typing indicator
    await typingIndicator(false, event.sender.id);

  } catch (error) {
    console.error('[YTSearch] Postback Error:', error);
    const sendMsg = sendMessage(event);
    await sendMsg("❌ Error: Could not process the video. Please try again later.", event.sender.id);
  }
}; 