const sendMessage = require("../../../page/src/sendMessage");
const sendTypingIndicator = require("../../../page/src/sendTypingIndicator");
const axios = require("axios");
const FormData = require("form-data");

module.exports.config = {
    name: "bratvid",
    author: "PageBot",
    version: "1.0",
    description: "Generate brat videos with custom text",
    category: "fun",
    cooldown: 5,
    usePrefix: true,
    adminOnly: false
};

module.exports.run = async function({ event }) {
    try {
        // Initialize API functions with event
        const sendMsg = sendMessage(event);
        const typingIndicator = sendTypingIndicator(event);

        // Get the text from the command
        const text = event.message.text.split(" ").slice(1).join(" ");

        if (!text) {
            await sendMsg("❌ Please provide some text. Usage: /bratvid <text>", event.sender.id);
            return;
        }

        // Show typing indicator
        await typingIndicator(true, event.sender.id);
        await sendMsg("Generating bratvid please wait...", event.sender.id);

        // Make API request to generate brat video
        const response = await axios.get(`https://brat.caliphdev.com/api/brat/animate?text=${encodeURIComponent(text)}`, {
            responseType: 'arraybuffer'
        });
        
        if (!response.data) {
            throw new Error("No video data received from API");
        }

        // Create form data for the GIF
        const formData = new FormData();
        formData.append('message', JSON.stringify({
            attachment: {
                type: 'image',
                payload: {
                    is_reusable: true
                }
            }
        }));
        formData.append('filedata', Buffer.from(response.data), {
            filename: 'bratvid.gif',
            contentType: 'image/gif'
        });

        // Upload the GIF to Facebook
        const uploadResponse = await axios.post(
            `https://graph.facebook.com/v22.0/me/message_attachments`,
            formData,
            {
                params: {
                    access_token: PAGE_ACCESS_TOKEN
                },
                headers: {
                    ...formData.getHeaders()
                }
            }
        );

        const attachmentId = uploadResponse.data.attachment_id;

        // Send the GIF using the attachment ID with download button
        const form = {
            recipient: { id: event.sender.id },
            message: {
                attachment: {
                    type: 'template',
                    payload: {
                        template_type: 'media',
                        elements: [
                            {
                                media_type: 'image',
                                attachment_id: attachmentId,
                                buttons: [
                                    {
                                        type: 'web_url',
                                        url: `https://brat.caliphdev.com/api/brat/animate?text=${encodeURIComponent(text)}`,
                                        title: '📥 Download GIF'
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
        console.error("[Bratvid] Error:", error);
        const sendMsg = sendMessage(event);
        await sendMsg("❌ Sorry, there was an error generating your brat video. Please try again.", event.sender.id);
    }
}; 
