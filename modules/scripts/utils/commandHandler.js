const state = require("../../../page/state");
const config = require("../../../config.json");

// Helper function to check if user can execute command
async function canExecuteCommand(userId, commandName) {
    // If user is already executing a command
    if (state.executingCommands.has(userId)) {
        const currentCommand = state.executingCommands.get(userId);
        return {
            canExecute: false,
            message: `⏳ Please wait for your current command (${currentCommand}) to finish before using another command.`
        };
    }
    return { canExecute: true };
}

// Helper function to lock command execution
function lockCommand(userId, commandName) {
    state.executingCommands.set(userId, commandName);
}

// Helper function to unlock command execution
function unlockCommand(userId) {
    state.executingCommands.delete(userId);
}

// Helper function to check command cooldown
function checkCooldown(userId, commandName, cooldownTime, isAdmin) {
    // Initialize user's cooldown object if it doesn't exist
    if (!state.cooldowns[userId]) {
        state.cooldowns[userId] = {};
    }

    const lastUsed = state.cooldowns[userId][commandName] || 0;
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

// Helper function to update cooldown
function updateCooldown(userId, commandName, isAdmin) {
    if (!isAdmin) {
        // Initialize user's cooldown object if it doesn't exist
        if (!state.cooldowns[userId]) {
            state.cooldowns[userId] = {};
        }
        state.cooldowns[userId][commandName] = Date.now();
    }
}

// Helper function to track command usage
function trackCommandUsage(commandName, userId) {
    if (!state.commandUsage.has(commandName)) {
        state.commandUsage.set(commandName, new Set());
    }
    state.commandUsage.get(commandName).add(userId);
}

// Main function to execute command
async function executeCommand(command, event, args, isAdmin) {
    const commandName = command.config.name;
    const cooldownTime = command.config.cooldown || 0;

    // Check cooldown
    const { onCooldown, remainingTime } = checkCooldown(event.sender.id, commandName, cooldownTime, isAdmin);
    if (onCooldown) {
        return {
            success: false,
            message: `Please wait ${remainingTime} second(s) before using this command again.`
        };
    }

    // Check if user can execute command
    const { canExecute, message } = await canExecuteCommand(event.sender.id, commandName);
    if (!canExecute) {
        return { success: false, message };
    }

    // Lock command execution
    lockCommand(event.sender.id, commandName);

    try {
        // Update cooldown
        updateCooldown(event.sender.id, commandName, isAdmin);

        // Track command usage
        trackCommandUsage(commandName, event.sender.id);

        // Execute command
        await command.run({ event, args });
        return { success: true };
    } catch (error) {
        console.error(`Error executing ${commandName}:`, error);
        return { success: false, message: "An error occurred while executing the command." };
    } finally {
        // Unlock command execution
        unlockCommand(event.sender.id);
    }
}

module.exports = {
    canExecuteCommand,
    lockCommand,
    unlockCommand,
    checkCooldown,
    updateCooldown,
    trackCommandUsage,
    executeCommand
}; 