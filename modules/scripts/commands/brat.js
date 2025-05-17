const sendMessage = require("../../../page/src/sendMessage");
const sendTypingIndicator = require("../../../page/src/sendTypingIndicator");
const axios = require("axios");
const FormData = require("form-data");

module.exports.config = {
    name: "brat",
    author: "PageBot",
    version: "1.0",
    description: "Generate brat images with custom text",
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
            await sendMsg("❌ Please provide some text. Usage: /brat <text>", event.sender.id);
            return;
        }

        // Show typing indicator
        await typingIndicator(true, event.sender.id);
        await sendMsg("Generating brat please wait...", event.sender.id);

        // Make API request to generate brat image
        const response = await axios.get(`https://brat.caliphdev.com/api/brat?text=${encodeURIComponent(text)}`, {
            responseType: 'arraybuffer'
        });
        
        if (!response.data) {
            throw new Error("No image data received from API");
        }

        // Create form data for the image
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
            filename: 'brat.png',
            contentType: 'image/png'
        });

        // Upload the image to Facebook
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

        // Send the image using the attachment ID
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
                                attachment_id: attachmentId
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
        console.error("[Brat] Error:", error);
        const sendMsg = sendMessage(event);
        await sendMsg("❌ Sorry, there was an error generating your brat image. Please try again.", event.sender.id);
    }
}; 
