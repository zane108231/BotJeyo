const state = require("../../../page/state");

class CooldownManager {
    constructor() {
        this.state = state;
        this.cooldowns = new Map();
        this.postbackCooldowns = new Map();
        this.activePostbacks = new Map();
        this.executingCommands = new Map();
        this.activeUsers = new Map(); // Track active users
    }

    // Check if a user is currently active (fetching a video)
    isUserActive(userId) {
        return this.activeUsers.has(userId);
    }

    // Lock a user's activity
    lockUser(userId) {
        this.activeUsers.set(userId, Date.now());
    }

    // Unlock a user's activity
    unlockUser(userId) {
        this.activeUsers.delete(userId);
    }

    // Command cooldown methods
    checkCommandCooldown(userId, commandName, cooldownTime, isAdmin) {
        if (!this.state.cooldowns[userId]) {
            this.state.cooldowns[userId] = {};
        }

        const lastUsed = this.state.cooldowns[userId][commandName] || 0;
        const now = Date.now();

        if (cooldownTime > 0 && !isAdmin && now - lastUsed < cooldownTime * 1000) {
            const remainingTime = Math.ceil((cooldownTime * 1000 - (now - lastUsed)) / 1000);
            return {
                onCooldown: true,
                remainingTime
            };
        }
        return { onCooldown: false };
    }

    updateCommandCooldown(userId, commandName, isAdmin) {
        if (!isAdmin) {
            if (!this.state.cooldowns[userId]) {
                this.state.cooldowns[userId] = {};
            }
            this.state.cooldowns[userId][commandName] = Date.now();
        }
    }

    // Postback cooldown methods
    checkPostbackCooldown(userId, postbackType) {
        // Check if user is already executing a postback
        if (this.state.activePostbacks.has(userId)) {
            const currentPostback = this.state.activePostbacks.get(userId);
            console.log(`[CooldownManager] User ${userId} is locked with postback: ${currentPostback}`);
            return {
                canExecute: false,
                message: `⏳ Please wait for your current action (${currentPostback}) to finish before using another button.`
            };
        }

        // Check cooldown
        const userCooldowns = this.state.postbackCooldowns.get(userId);
        if (userCooldowns && userCooldowns.has(postbackType)) {
            const cooldownEnd = userCooldowns.get(postbackType);
            const now = Date.now();
            
            if (now < cooldownEnd) {
                const remainingTime = Math.ceil((cooldownEnd - now) / 1000);
                console.log(`[CooldownManager] User ${userId} is on cooldown for ${postbackType}, ${remainingTime}s remaining`);
                return {
                    canExecute: false,
                    message: `⏳ Please wait ${remainingTime} second(s) before using this button again.`
                };
            }
        }

        return { canExecute: true };
    }

    setPostbackCooldown(userId, postbackType, cooldownSeconds) {
        if (!this.state.postbackCooldowns.has(userId)) {
            this.state.postbackCooldowns.set(userId, new Map());
        }
        this.state.postbackCooldowns.get(userId).set(postbackType, Date.now() + (cooldownSeconds * 1000));
        console.log(`[CooldownManager] Set cooldown for user ${userId}, postback ${postbackType}: ${cooldownSeconds}s`);
    }

    lockPostback(userId, postbackType) {
        this.state.activePostbacks.set(userId, postbackType);
        console.log(`[CooldownManager] Locked postback ${postbackType} for user ${userId}`);
    }

    unlockPostback(userId) {
        const wasLocked = this.state.activePostbacks.has(userId);
        const postbackType = this.state.activePostbacks.get(userId);
        this.state.activePostbacks.delete(userId);
        console.log(`[CooldownManager] Unlocked postback ${postbackType} for user ${userId} (was locked: ${wasLocked})`);
    }

    // Command execution lock methods
    checkCommandLock(userId, commandName) {
        if (this.state.executingCommands.has(userId)) {
            const currentCommand = this.state.executingCommands.get(userId);
            return {
                canExecute: false,
                message: `⏳ Please wait for your current command (${currentCommand}) to finish before using another command.`
            };
        }
        return { canExecute: true };
    }

    lockCommand(userId, commandName) {
        this.state.executingCommands.set(userId, commandName);
    }

    unlockCommand(userId) {
        this.state.executingCommands.delete(userId);
    }

    getActiveCommands() {
        return Array.from(this.state.executingCommands.entries()).map(([userId, command]) => ({
            userId,
            command,
            timestamp: Date.now()
        }));
    }

    getActiveCooldowns() {
        const allCooldowns = [];
        for (const [userId, userCooldowns] of Object.entries(this.state.cooldowns)) {
            for (const [command, timestamp] of Object.entries(userCooldowns)) {
                allCooldowns.push({
                    userId,
                    command,
                    timestamp
                });
            }
        }
        return allCooldowns;
    }

    // Clean up expired cooldowns and locks
    cleanup() {
        const now = Date.now();
        
        // Clean up command cooldowns
        for (const [key, timestamp] of this.cooldowns) {
            if (now > timestamp) {
                this.cooldowns.delete(key);
            }
        }

        // Clean up postback cooldowns
        for (const [key, timestamp] of this.postbackCooldowns) {
            if (now > timestamp) {
                this.postbackCooldowns.delete(key);
            }
        }

        // Clean up active postbacks
        for (const [key, timestamp] of this.activePostbacks) {
            if (now > timestamp + 30000) { // 30 second timeout
                this.activePostbacks.delete(key);
            }
        }

        // Clean up executing commands
        for (const [key, timestamp] of this.executingCommands) {
            if (now > timestamp + 30000) { // 30 second timeout
                this.executingCommands.delete(key);
            }
        }

        // Clean up active users
        for (const [key, timestamp] of this.activeUsers) {
            if (now > timestamp + 30000) { // 30 second timeout
                this.activeUsers.delete(key);
            }
        }
    }
}

// Create a singleton instance
const cooldownManager = new CooldownManager();

// Start cleanup interval
setInterval(() => {
    cooldownManager.cleanup();
}, 60000); // Clean up every minute

module.exports = cooldownManager; 