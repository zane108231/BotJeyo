module.exports.config = {
    name: 'Welcome Message',
    author: 'Jihyo Woon',
    version: '1.0',
    description: 'Handles the welcome message for new users',
    selfListen: false,
};

// Import AI models from aimodel.js
const aimodel = require('./aimodel');
const helpCommand = require('../commands/help');

// Track users who have seen the welcome message
const welcomedUsers = new Set();

module.exports.run = async function({ event }) {
    // Check if this is a message and user hasn't been welcomed
    if (event.type === 'message' && !welcomedUsers.has(event.sender.id)) {
        try {
            // Send welcome message with buttons
            await api.graph({
                recipient: {
                    id: event.sender.id
                },
                message: {
                    attachment: {
                        type: 'template',
                        payload: {
                            template_type: 'generic',
                            elements: [
                                {
                                    title: 'Hey there newbie!',
                                    subtitle: 'Thank you for using Pagebot. Leave a like on my repository and support my work.',
                                    image_url: 'https://i.ibb.co/dJzSv5Q/pagebot.jpg',
                                    buttons: [
                                        {
                                            type: 'web_url',
                                            url: 'https://www.facebook.com/WOON.me',
                                            title: '😁Check my Profile'
                                        },
                                        {
                                            type: 'postback',
                                            title: '🤖 Pick your AI',
                                            payload: 'START_CHAT'
                                        },
                                        {
                                            type: 'postback',
                                            title: '📚 View Commands',
                                            payload: 'HELP_PAYLOAD'
                                        }
                                    ]
                                }
                            ]
                        }
                    }
                },
                messaging_type: "RESPONSE"
            });
            
            // Mark user as welcomed
            welcomedUsers.add(event.sender.id);
            console.log('[Welcome] Welcome message sent to user:', event.sender.id);
        } catch (error) {
            console.error('[Welcome] Error sending welcome message:', error);
        }
    }
};

// Handle postback for starting chat
module.exports.onPostback = async function({ event }) {
    if (event.postback.payload === 'START_CHAT') {
        try {
            // Just pass the event to aimodel.js
            const aimodel = require('./aimodel');
            await aimodel.onPostback({ event });
            console.log('[Welcome] Model selection triggered for user:', event.sender.id);
        } catch (error) {
            console.error('[Welcome] Error triggering model selection:', error);
        }
    } else if (event.postback.payload === 'HELP_PAYLOAD') {
        try {
            // Execute help command directly
            await helpCommand.run({ event });
            console.log('[Welcome] Help command executed for user:', event.sender.id);
        } catch (error) {
            console.error('[Welcome] Error executing help command:', error);
        }
    }
}; 