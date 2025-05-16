const axios = require("axios");
const yts = require("yt-search");
const sendMessage = require("../../../page/src/sendMessage");
const sendTypingIndicator = require("../../../page/src/sendTypingIndicator");
const sendAttachment = require("../../../page/src/sendAttachment");

// Helper function to format text with fixed width
function formatText(text, maxLength) {
    if (!text) return ' '.repeat(maxLength);
    if (text.length > maxLength) {
        return text.substring(0, maxLength - 3) + '...';
    }
    return text + ' '.repeat(maxLength - text.length);
}

// Helper function to format numbers
function formatNumber(num) {
    if (!num) return '0';
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

// Helper function to create consistent subtitle
function createSubtitle(channel, duration, views) {
    const channelText = formatText(channel || 'Unknown', 20);
    const durationText = formatText(duration || '0:00', 10);
    const viewsText = formatText(formatNumber(views), 10);
    
    return [
        `👤 Channel: ${channelText}`,
        `⏱️ Duration: ${durationText}`,
        `👁️ Views: ${viewsText}`
    ].join('\n');
}

module.exports.config = {
  name: "ytsearch",
  author: "PageBot",
  version: "1.0",
  description: "Search YouTube videos and download them",
  category: "search",
  cooldown: 5,
  usePrefix: true,
  adminOnly: false
};

module.exports.run = async function({ event, args }) {
  try {
    // Initialize API functions with event
    const sendMsg = sendMessage(event);
    const typingIndicator = sendTypingIndicator(event);

    // Check if search query was provided
    if (!args || args.length === 0) {
      await sendMsg("❌ Please provide a search query.\nExample: ytsearch <search query>", event.sender.id);
      return;
    }

    const query = args.join(" ").trim();

    // Show typing indicator
    await typingIndicator(true, event.sender.id);

    // Inform user we're searching
    await sendMsg(`🔍 Searching YouTube for: "${query}"`, event.sender.id);

    // Search YouTube
    const searchData = await yts(query);
    const videos = searchData.videos.slice(0, 10); // Get top 10 results

    if (!videos || videos.length === 0) {
      await sendMsg("❌ No results found for your search.", event.sender.id);
      return;
    }

    // Create carousel elements
    const elements = videos.map(video => {
      const title = formatText(video.title, 50);
      const subtitle = createSubtitle(
          video.author.name,
          video.duration,
          video.views
      );

      return {
        title: title,
        subtitle: subtitle,
        image_url: video.thumbnail,
        default_action: {
          type: 'web_url',
          url: video.url
        },
        buttons: [
          {
            type: 'web_url',
            title: '🎥 Watch Video',
            url: video.url
          },
          {
            type: 'postback',
            title: '⬇️ Download',
            payload: `ytsearch_download_${video.videoId}`
          }
        ]
      };
    });

    // Create the carousel template
    const form = {
      recipient: { id: event.sender.id },
      message: {
        attachment: {
          type: 'template',
          payload: {
            template_type: 'generic',
            elements: elements
          }
        }
      },
      messaging_type: "RESPONSE"
    };

    // Send the carousel using axios
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
    console.error('❌ Error in ytsearch command:', error);
    const sendMsg = sendMessage(event);
    await sendMsg("❌ Error: Could not perform the search. Please try again later.", event.sender.id);
  }
};

// Handle postback for video download
module.exports.onPostback = async function({ event }) {
  try {
    const sendMsg = sendMessage(event);
    const typingIndicator = sendTypingIndicator(event);
    const sendAttach = sendAttachment(event);

    if (event.postback.payload.startsWith('ytsearch_download_')) {
      const videoId = event.postback.payload.split('_')[2];
      
      // Show typing indicator
      await typingIndicator(true, event.sender.id);
      
      // Inform user
      await sendMsg("⏳ Downloading video, please wait...", event.sender.id);
      
      // Get video stream URL
      const streamUrl = `https://haji-mix-api.gleeze.com/api/autodl?url=https://www.youtube.com/watch?v=${videoId}&stream=true`;
      
      // Send the video
      await sendAttach('video', streamUrl, event.sender.id);
      
      // Stop typing indicator
      await typingIndicator(false, event.sender.id);
    }
  } catch (error) {
    console.error("[YTSearch] Download error:", error);
    const sendMsg = sendMessage(event);
    await sendMsg("❌ Error downloading video. Please try again.", event.sender.id);
  }
};

// Handle reply messages
module.exports.onReply = async function({ event, args }) {
  try {
    const sendMsg = sendMessage(event);
    const typingIndicator = sendTypingIndicator(event);
    const sendAttach = sendAttachment(event);

    // Get stored results for this user
    const videos = userSearches.get(event.sender.id);
    if (!videos) {
      await sendMsg("❌ No active search results found. Please search again.", event.sender.id);
      return;
    }

    // Parse selection
    const selection = parseInt(args[0]);
    if (isNaN(selection) || selection < 1 || selection > 5) {
      await sendMsg("❌ Please select a valid number between 1 and 5.", event.sender.id);
      return;
    }

    const selectedVideo = videos.videos[selection - 1];
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
    userSearches.delete(event.sender.id);

    // Stop typing indicator
    await typingIndicator(false, event.sender.id);

  } catch (error) {
    console.error('❌ Error in ytsearch reply:', error);
    const sendMsg = sendMessage(event);
    await sendMsg("❌ Error: Could not process the video. Please try again later.", event.sender.id);
  }
}; 