const sendMessage = require("../../../page/src/sendMessage");
const sendTypingIndicator = require("../../../page/src/sendTypingIndicator");
const axios = require("axios");

module.exports.config = {
    name: "imgur",
    author: "PageBot",
    version: "1.0",
    description: "Upload images to Imgur",
    category: "utility",
    cooldown: 5,
    usePrefix: true,
    adminOnly: false
};

module.exports.run = async function({ event }) {
    try {
        // Initialize API functions with event
        const sendMsg = sendMessage(event);
        const typingIndicator = sendTypingIndicator(event);

        // Check if this is a reply to a message
        if (event.type === "message_reply") {
            // Check if the replied message has an image attachment
            if (event.message.reply_to.attachments && event.message.reply_to.attachments[0].type === "image") {
                // Show typing indicator
                await typingIndicator(true, event.sender.id);

                // Get the image URL from the attachment
                const imageUrl = event.message.reply_to.attachments[0].payload.url;
                console.log("[Imgur] Image URL:", imageUrl);

                // Make API request to upload to Imgur
                const response = await axios.get(`https://betadash-api-swordslush-production.up.railway.app/imgurv2?imageUrl=${encodeURIComponent(imageUrl)}`);
                console.log("[Imgur] API Response:", response.data);

                // Stop typing indicator
                await typingIndicator(false, event.sender.id);

                // Check for different possible response formats
                let imgurLink;
                if (response.data && response.data.link) {
                    imgurLink = response.data.link;
                } else if (response.data && response.data.url) {
                    imgurLink = response.data.url;
                } else if (response.data && response.data.data && response.data.data.link) {
                    imgurLink = response.data.data.link;
                }

                if (imgurLink) {
                    await sendMsg(`✅ Here's your Imgur link:\n${imgurLink}`, event.sender.id);
                } else {
                    console.error("[Imgur] Unexpected API response format:", response.data);
                    throw new Error("Unexpected API response format");
                }
            } else {
                await sendMsg("❌ Please reply to an image with /imgur", event.sender.id);
            }
        } else {
            await sendMsg("❌ Please send an image first and reply to it with /imgur", event.sender.id);
        }
    } catch (error) {
        console.error("[Imgur] Error:", error);
        const sendMsg = sendMessage(event);
        await sendMsg("❌ Sorry, there was an error uploading your image to Imgur. Please try again.", event.sender.id);
    }
}; 