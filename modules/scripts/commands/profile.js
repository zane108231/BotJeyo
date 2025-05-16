const sendMessage = require("../../../page/src/sendMessage");
const sendTypingIndicator = require("../../../page/src/sendTypingIndicator");
const aimodel = require("../events/aimodel");

module.exports.config = {
    name: "profile",
    author: "Jihyo Woon",
    version: "1.0",
    description: "Shows user profile and AI model settings",
    category: "user",
    cooldown: 5,
    usePrefix: true,
    adminOnly: false
};

module.exports.run = async function({ event }) {
    try {
        // Initialize API functions with event
        const sendMsg = sendMessage(event);
        const typingIndicator = sendTypingIndicator(event);
        
        // Show typing indicator
        await typingIndicator(true, event.sender.id);
        
        // Get user's current model
        const userId = event.sender.id;
        let currentModel = "Not selected";
        
        // Check if user has a selected model
        const userModel = aimodel.userPreferences.get(userId);
        if (userModel && userModel.name) {
            currentModel = userModel.name;
        }
        
        // Create profile message
        const profileMessage = `👤 User Profile
━━━━━━━━━━━━━
🆔 User ID: ${userId}
🤖 Current AI: ${currentModel}

Click the button below to change your AI model.`;
        
        // Send profile with button
        const form = {
            recipient: { id: userId },
            message: {
                attachment: {
                    type: 'template',
                    payload: {
                        template_type: 'button',
                        text: profileMessage,
                        buttons: [
                            {
                                type: 'postback',
                                title: '🤖 Change AI Model',
                                payload: 'START_CHAT'
                            }
                        ]
                    }
                }
            },
            messaging_type: "RESPONSE"
        };

        await api.graph(form);
        
        // Stop typing indicator
        await typingIndicator(false, userId);
        
    } catch (error) {
        console.error('[Profile] Error:', error);
        const sendMsg = sendMessage(event);
        await sendMsg("❌ Sorry, there was an error showing your profile.", event.sender.id);
    }
}; 