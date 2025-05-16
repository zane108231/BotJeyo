module.exports.config = {
    name: 'AI Model Selection',
    author: 'Jihyo Woon',
    version: '1.0',
    description: 'Handles AI model selection and responses',
    selfListen: false,
};

const axios = require('axios');
const sendMessage = require("../../../page/src/sendMessage");
const sendTypingIndicator = require("../../../page/src/sendTypingIndicator");

// Store user preferences
const userPreferences = new Map();

// Export userPreferences for use in other modules
module.exports.userPreferences = userPreferences;

// API URLs for different AI models
const AI_MODELS = {
    MODEL1: {
        name: "Luzia",
        description: "Chat with Luzia a friendly Ai",
        apiUrl: "https://betadash-api-swordslush-production.up.railway.app/luzia",
        paramName: "chat",
        payload: "AI_MODEL_1",
        responseKey: "response"
    },
    MODEL2: {
        name: "Qwen 2.5-72B",
        description: "Powered by Qwen 2.5-72B",
        apiUrl: "https://betadash-api-swordslush-production.up.railway.app/qwen",
        paramName: "ask",
        payload: "AI_MODEL_2",
        responseKey: "response"
    },
    MODEL3: {
        name: "BlackBox Pro",
        description: "Powered by BlackBox Pro",
        apiUrl: "https://betadash-api-swordslush-production.up.railway.app/blackbox-pro",
        paramName: "ask",
        payload: "AI_MODEL_3",
        responseKey: "Response"
    },
    MODEL4: {
        name: "GPT-4",
        description: "Powered by OpenAI GPT-4",
        apiUrl: "https://betadash-api-swordslush-production.up.railway.app/gpt4",
        paramName: "ask",
        payload: "AI_MODEL_4",
        responseKey: "content"
    },
    MODEL5: {
        name: "DeepSeek V3",
        description: "Powered by DeepSeek V3",
        apiUrl: "https://betadash-api-swordslush-production.up.railway.app/Deepseek-V3",
        paramName: "ask",
        payload: "AI_MODEL_5",
        responseKey: "response"
    },
    MODEL6: {
        name: "Meta AI",
        description: "Powered by Meta",
        apiUrl: "https://betadash-api-swordslush-production.up.railway.app/Llama90b",
        paramName: "ask",
        payload: "AI_MODEL_6",
        responseKey: "response"
    },
    MODEL7: {
        name: "Panda AI",
        description: "Powered by Panda",
        apiUrl: "https://betadash-api-swordslush-production.up.railway.app/panda",
        paramName: "ask",
        payload: "AI_MODEL_7",
        responseKey: "response"
    },
    MODEL8: {
        name: "Phi",
        description: "Powered by Microsoft",
        apiUrl: "https://betadash-api-swordslush-production.up.railway.app/phi",
        paramName: "ask",
        payload: "AI_MODEL_8",
        responseKey: "response"
    },
    MODEL9: {
        name: "Goody",
        description: "The world's AI responsible Ai model",
        apiUrl: "https://betadash-api-swordslush-production.up.railway.app/goody",
        paramName: "ask",
        payload: "AI_MODEL_9",
        responseKey: "response"
    },
    MODEL10: {
        name: "Giz",
        description: "Giz Ai trained by google.",
        apiUrl: "https://betadash-api-swordslush-production.up.railway.app/giz",
        paramName: "ask",
        payload: "AI_MODEL_10",
        responseKey: "output"
    }
};

// Export AI_MODELS for use in other modules
module.exports.AI_MODELS = AI_MODELS;

// Store conversation context
const conversations = new Map();

// Debug logging function
function debugLog(message, data = null) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [AI Model Debug] ${message}`);
    if (data) {
        console.log(`[${timestamp}] [AI Model Debug] Data:`, JSON.stringify(data, null, 2));
    }
}

// Function to make API call
async function callAIModel(apiUrl, message) {
    try {
        debugLog(`Making API call to: ${apiUrl}`);
        
        // Extract just the message content without the role prefix
        const cleanMessage = message.split('\n').pop().replace(/^(User|Assistant):\s*/, '');
        
        // Find the model configuration
        const modelConfig = Object.values(AI_MODELS).find(model => model.apiUrl === apiUrl);
        if (!modelConfig) {
            throw new Error('Model configuration not found');
        }
        
        // Use the model's specific parameter name
        const response = await axios.get(`${apiUrl}?${modelConfig.paramName}=${encodeURIComponent(cleanMessage)}`);
        debugLog('API Response:', response.data);
        
        // Handle different response formats
        let answer;
        if (response.data.answer) {
            answer = response.data.answer;
        } else if (response.data.response) {
            answer = response.data.response;
        } else if (response.data.content) {
            answer = response.data.content;
        } else {
            throw new Error('Unexpected API response format');
        }
        
        return { answer };
    } catch (error) {
        debugLog('API Call Error:', error);
        throw error;
    }
}

module.exports.run = async function({ event }) {
    try {
        // Initialize API functions with event
        const sendMsg = sendMessage(event);
        const typingIndicator = sendTypingIndicator(event);

        // Get user's selected model
        const selectedModel = userPreferences.get(event.sender.id);
        
        if (!selectedModel) {
            // If no model selected, just return - don't show carousel here
            return;
        }

        // Get message text
        const message = event.message.text;

        // Ignore messages that start with command prefixes
        if (message.startsWith('/') || message.startsWith('!') || message.startsWith('-')) {
            return;
        }

        // Show typing indicator
        await typingIndicator(true, event.sender.id);

        // Make API request to selected model
        const response = await axios.get(`${selectedModel.apiUrl}?${selectedModel.paramName}=${encodeURIComponent(message)}`);
        
        // Stop typing indicator
        await typingIndicator(false, event.sender.id);

        // Get response using the model's specific response key
        const aiResponse = response.data[selectedModel.responseKey];
        
        if (aiResponse) {
            await sendMsg(aiResponse, event.sender.id);
        } else {
            console.error("[AI Model] Unexpected API response format:", response.data);
            throw new Error("Unexpected API response format");
        }
    } catch (error) {
        console.error("[AI Model] Error:", error);
        const sendMsg = sendMessage(event);
        await sendMsg("❌ Sorry, I encountered an error. Please try again.", event.sender.id);
    }
};

// Handle postback for model selection
module.exports.onPostback = async function({ event }) {
    try {
        const sendMsg = sendMessage(event);

        // Check if this is the "Pick your AI" button
        if (event.postback.payload === "START_CHAT") {
            // Show model selection carousel
            const elements = Object.values(AI_MODELS).map(model => ({
                title: model.name,
                subtitle: model.description,
                image_url: "https://i.ibb.co/dJzSv5Q/pagebot.jpg",
                buttons: [
                    {
                        type: "postback",
                        title: `🤖 Choose ${model.name}`,
                        payload: model.payload
                    }
                ]
            }));

            await api.graph({
                recipient: { id: event.sender.id },
                message: {
                    attachment: {
                        type: "template",
                        payload: {
                            template_type: "generic",
                            elements: elements
                        }
                    }
                },
                messaging_type: "RESPONSE"
            });
            return;
        }

        // Handle model selection
        const selectedModel = Object.values(AI_MODELS).find(model => model.payload === event.postback.payload);
        
        if (selectedModel) {
            // Store user's model selection
            userPreferences.set(event.sender.id, selectedModel);
            await sendMsg(`✅ You've selected ${selectedModel.name}. You can now chat with me!`, event.sender.id);
        }
    } catch (error) {
        console.error("[AI Model] Selection error:", error);
        const sendMsg = sendMessage(event);
        await sendMsg("❌ Error selecting AI model. Please try again.", event.sender.id);
    }
}; 