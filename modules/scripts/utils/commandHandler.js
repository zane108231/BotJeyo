const state = require("../../../page/state");
const config = require("../../../config.json");
const cooldownManager = require("./cooldownManager");
const monitor = require('./monitor');
const loadTester = require('./loadTester');

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

// Track command usage
function trackCommandUsage(commandName, userId) {
    if (!state.commandUsage.has(commandName)) {
        state.commandUsage.set(commandName, new Set());
    }
    state.commandUsage.get(commandName).add(userId);
}

// Main function to execute command
async function executeCommand(event, command, commandName, isAdmin) {
    const cooldownTime = command.config.cooldown || 0;

    // Track command usage
    monitor.trackCommand(commandName);

    // Check cooldown
    const { onCooldown, remainingTime } = cooldownManager.checkCommandCooldown(
        event.sender.id,
        commandName,
        cooldownTime,
        isAdmin
    );

    if (onCooldown) {
        return {
            success: false,
            message: `Please wait ${remainingTime} seconds before using this command again.`
        };
    }

    // Check if command is already being executed
    const { canExecute, message } = await cooldownManager.checkCommandLock(event.sender.id, commandName);
    if (!canExecute) {
        return { success: false, message };
    }

    try {
        // Lock the command
        cooldownManager.lockCommand(event.sender.id, commandName);

        // Execute the command
        const result = await command.run({ event, args: event.message.text.split(" ").slice(1) });

        // Update cooldown
        cooldownManager.updateCommandCooldown(event.sender.id, commandName, isAdmin);

        return {
            success: true,
            result
        };
    } catch (error) {
        console.error(`Error executing command ${commandName}:`, error);
        return {
            success: false,
            message: "An error occurred while executing the command."
        };
    } finally {
        // Always unlock the command
        cooldownManager.unlockCommand(event.sender.id);
    }
}

async function handleCommand(event, command, args, isAdmin) {
    const { message, sender } = event;
    const commandText = message.text.toLowerCase();
    
    // Track command usage
    monitor.trackCommand(commandText);

    // Handle all commands through executeCommand
    return await executeCommand(event, command, command.config.name, isAdmin);
}

module.exports = {
    canExecuteCommand,
    lockCommand,
    unlockCommand,
    checkCooldown,
    updateCooldown,
    trackCommandUsage,
    executeCommand,
    handleCommand
}; 