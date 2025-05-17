// Shared state for the bot
const state = {
    activeUsers: new Set(),
    commandUsage: new Map(),
    lastRestart: null,
    blacklist: new Set(),
    // Command lock system
    executingCommands: new Map(), // Maps user ID to currently executing command
    // Cooldown system
    cooldowns: {}, // Maps user ID to command cooldowns
    // Postback cooldown system
    postbackCooldowns: new Map(), // Maps user ID to postback cooldowns
    activePostbacks: new Map() // Maps user ID to currently active postback
};

module.exports = state;