const axios = require("axios");
const sendMessage = require("../../../page/src/sendMessage");
const sendTypingIndicator = require("../../../page/src/sendTypingIndicator");

module.exports.config = {
  name: "pinterest",
  author: "PageBot",
  version: "1.0",
  description: "Search Pinterest for images",
  category: "utility",
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

    // Get search query
    const searchQuery = args.join(' ');

    if (!searchQuery) {
      await sendMsg("Please provide a search query. Usage: /pinterest query", event.sender.id);
      return;
    }

    const { data } = await axios.get(`https://kaiz-apis.gleeze.com/api/pinterest?search=${encodeURIComponent(searchQuery)}`);

    if (!data.data || data.data.length === 0) {
      await sendMsg(`No images found for "${searchQuery}".`, event.sender.id);
      return;
    }

    // Get unique images by taking only the first occurrence of each URL
    const uniqueImages = [];
    const seen = new Set();
    
    for (const url of data.data) {
      if (!seen.has(url)) {
        seen.add(url);
        uniqueImages.push(url);
      }
    }

    // Split unique images into chunks of 10 (Facebook's limit for generic template)
    const chunks = [];
    for (let i = 0; i < uniqueImages.length; i += 10) {
      chunks.push(uniqueImages.slice(i, i + 10));
    }

    // Send initial message
    await sendMsg(`📸 Found ${data.count} images. Sending in ${chunks.length} carousel(s)...`, event.sender.id);

    // Send each chunk as a separate generic template
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      // Create generic template elements for each image in the chunk
      const elements = chunk.map(url => ({
        image_url: url,
        buttons: [
          {
            type: "web_url",
            url: url,
            title: "Download Photo",
            webview_height_ratio: "full"
          }
        ]
      }));

      // Create the generic template message
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

      // Add a small delay between carousels to prevent rate limiting
      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Stop typing indicator
    await typingIndicator(false, event.sender.id);

  } catch (error) {
    console.error('[Pinterest] Error:', error);
    const sendMsg = sendMessage(event);
    await sendMsg("❌ Error: Could not fetch Pinterest images.", event.sender.id);
  }
}; 