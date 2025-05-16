const axios = require("axios");
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
function createSubtitle(author, likes, views) {
    const authorText = formatText(author || 'Unknown', 20);
    const likesText = formatText(formatNumber(likes), 10);
    const viewsText = formatText(formatNumber(views), 10);
    
    return [
        `👤 Author: ${authorText}`,
        `❤️ Likes: ${likesText}`,
        `👁️ Views: ${viewsText}`
    ].join('\n');
}

module.exports.config = {
    name: "tiksearch",
    author: "PageBot",
    version: "1.0",
    description: "Search TikTok videos",
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

        // Check if search query is provided
        if (!args.length) {
            return sendMsg("❌ Please provide a search query. Example: /tiksearch dance", event.sender.id);
        }

        // Show typing indicator
        await typingIndicator(true, event.sender.id);

        // Get search query from args
        const searchQuery = args.join(" ");

        // Make API request
        const response = await axios.get(`https://betadash-api-swordslush-production.up.railway.app/tiksearchv2?search=${encodeURIComponent(searchQuery)}&count=10`);
        
        // Stop typing indicator
        await typingIndicator(false, event.sender.id);

        if (response.data && response.data.data && response.data.data.length > 0) {
            // Create carousel elements from the videos
            const elements = response.data.data.map(video => ({
                title: video.title,
                subtitle: "Click to view video",
                image_url: video.cover,
                buttons: [
                    {
                        type: 'web_url',
                        url: video.video,
                        title: '🎥 Watch Video'
                    }
                ]
            }));

            // Send carousel template
            await api.graph({
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
            });
        } else {
            await sendMsg("❌ No videos found for your search query.", event.sender.id);
        }
    } catch (error) {
        console.error("[TikSearch] Error:", error);
        const sendMsg = sendMessage(event);
        await sendMsg("❌ Sorry, there was an error searching for TikTok videos.", event.sender.id);
    }
};

// Handle postback for video download
module.exports.onPostback = async function({ event }) {
    try {
        const sendMsg = sendMessage(event);
        const typingIndicator = sendTypingIndicator(event);
        const sendAttach = sendAttachment(event);

        if (event.postback.payload.startsWith('tiksearch_download_')) {
            const videoId = event.postback.payload.split('_')[2];
            
            // Show typing indicator
            await typingIndicator(true, event.sender.id);
            
            // Inform user
            await sendMsg("⏳ Downloading video, please wait...", event.sender.id);
            
            // Get video data from the API again
            const response = await axios.get(`https://jihyoapi-1.onrender.com/api/tiktok/search?keyword=${encodeURIComponent(videoId)}`);
            
            if (!Array.isArray(response.data) || response.data.length === 0) {
                return await sendMsg("❌ Video not found.", event.sender.id);
            }
            
            const video = response.data.find(v => v.id === videoId);
            if (!video) {
                return await sendMsg("❌ Video not found.", event.sender.id);
            }
            
            // Send video info
            const videoInfo = `🎬 𝗧𝗶𝘁𝗹𝗲: ${video.title}\n👤 𝗔𝘂𝘁𝗵𝗼𝗿: ${video.music_info?.author || 'Unknown'}\n❤️ 𝗟𝗶𝗸𝗲𝘀: ${formatNumber(video.stats.diggCount)}\n👁️ 𝗩𝗶𝗲𝘄𝘀: ${formatNumber(video.stats.playCount)}`;
            await sendMsg(videoInfo, event.sender.id);
            
            // Send the video
            await sendAttach('video', video.play, event.sender.id);
            
            // Stop typing indicator
            await typingIndicator(false, event.sender.id);
        }
    } catch (error) {
        console.error("[TikSearch] Download error:", error);
        const sendMsg = sendMessage(event);
        await sendMsg("❌ Error downloading video. Please try again.", event.sender.id);
    }
}; 