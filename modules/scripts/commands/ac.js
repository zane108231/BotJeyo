const sendMessage = require("../../../page/src/sendMessage");
const sendTypingIndicator = require("../../../page/src/sendTypingIndicator");
const config = require("../../../config.json");
const fs = require('fs');
const path = require('path');
const state = require("../../../page/state");

// Helper function to save config
function saveConfig() {
    fs.writeFileSync(path.join(__dirname, '../../../config.json'), JSON.stringify(config, null, 2));
}

// Store disabled commands and events
if (!state.disabledCommands) {
    state.disabledCommands = new Set();
}
if (!state.disabledEvents) {
    state.disabledEvents = new Set();
}

module.exports.config = {
    name: "ac",
    author: "PageBot",
    version: "1.0",
    description: "Advanced admin control commands for bot management",
    category: "admin",
    cooldown: 0,
    usePrefix: true,
    adminOnly: true
};

module.exports.run = async function({ event, args }) {
    try {
        const sendMsg = sendMessage(event);
        const typingIndicator = sendTypingIndicator(event);
        
        // Check if user is admin
        if (!config.ADMINS.includes(event.sender.id)) {
            return await sendMsg("❌ This command is only available to administrators.", event.sender.id);
        }

        await typingIndicator(true, event.sender.id);

        // If no arguments provided, show help
        if (!args[0]) {
            const helpMessage = `🔧 𝗔𝗗𝗠𝗜𝗡 𝗖𝗢𝗡𝗧𝗥𝗢𝗟 𝗣𝗔𝗡𝗘𝗟

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 𝗦𝗧𝗔𝗧𝗨𝗦 & 𝗠𝗢𝗡𝗜𝗧𝗢𝗥𝗜𝗡𝗚
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
/ac status - Show bot status
/ac stats - Show command usage statistics
/ac memory - Show detailed memory usage

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚙️ 𝗦𝗬𝗦𝗧𝗘𝗠 𝗖𝗢𝗡𝗧𝗥𝗢𝗟
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
/ac maintenance [on/off] - Toggle maintenance mode
/ac restart - Simulate bot restart
/ac prefix [new_prefix] - Change bot prefix
/ac log [on/off] - Toggle debug logging

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔒 𝗨𝗦𝗘𝗥 𝗠𝗔𝗡𝗔𝗚𝗘𝗠𝗘𝗡𝗧
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
/ac blacklist [add/remove] [userID] - Manage blacklist

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ 𝗖𝗢𝗠𝗠𝗔𝗡𝗗 𝗠𝗔𝗡𝗔𝗚𝗘𝗠𝗘𝗡𝗧
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
/ac cooldown [command] [seconds] - Set command cooldown
/ac cooldown -global [seconds] - Set cooldown for all commands
/ac disable [command] - Disable a command
/ac enable [command] - Enable a command
/ac reload [command] - Reload a command
/ac error [command] - Test error handling

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔄 𝗦𝗬𝗦𝗧𝗘𝗠 𝗠𝗔𝗜𝗡𝗧𝗘𝗡𝗔𝗡𝗖𝗘
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
/ac cache [clear] - Clear command cache
/ac event [enable/disable] [event] - Toggle event handlers

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📢 𝗕𝗥𝗢𝗔𝗗𝗖𝗔𝗦𝗧𝗜𝗡𝗚
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
/ac broadcast [message] - Broadcast message to all users

⚠️ All commands require admin privileges.`;
            
            await sendMsg(helpMessage, event.sender.id);
            return await typingIndicator(false, event.sender.id);
        }

        const command = args[0].toLowerCase();
        const subCommand = args[1]?.toLowerCase();

        switch (command) {
            case 'status':
                const statusMessage = `📊 𝗕𝗢𝗧 𝗦𝗧𝗔𝗧𝗨𝗦

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🟢 Maintenance Mode: ${config.maintenance ? 'ON' : 'OFF'}
👥 Active Users: ${state.activeUsers.size}
👥 Blacklisted Users: ${state.blacklist.size}
🔄 Last Restart: ${state.lastRestart || 'Never'}
📈 Total Commands Used: ${Array.from(state.commandUsage.values()).reduce((acc, set) => acc + set.size, 0)}
💾 Memory Usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB
❌ Disabled Commands: ${state.disabledCommands.size}`;
                await sendMsg(statusMessage, event.sender.id);
                break;

            case 'maintenance':
                if (!subCommand) {
                    await sendMsg("❌ Please specify 'on' or 'off'", event.sender.id);
                    return;
                }
                config.maintenance = subCommand === 'on';
                saveConfig();
                await sendMsg(`✅ Maintenance mode ${config.maintenance ? 'enabled' : 'disabled'}`, event.sender.id);
                break;

            case 'blacklist':
                if (!subCommand || !args[2]) {
                    await sendMsg("❌ Usage: /ac blacklist [add/remove] [userID]", event.sender.id);
                    return;
                }
                const userId = args[2];
                if (subCommand === 'add') {
                    state.blacklist.add(userId);
                    await sendMsg(`✅ User ${userId} added to blacklist`, event.sender.id);
                } else if (subCommand === 'remove') {
                    state.blacklist.delete(userId);
                    await sendMsg(`✅ User ${userId} removed from blacklist`, event.sender.id);
                }
                break;

            case 'stats':
                let statsMessage = "📊 𝗖𝗢𝗠𝗠𝗔𝗡𝗗 𝗨𝗦𝗔𝗚𝗘 𝗦𝗧𝗔𝗧𝗜𝗦𝗧𝗜𝗖𝗦\n\n";
                for (const [cmd, users] of state.commandUsage) {
                    statsMessage += `${cmd}: ${users.size} unique users\n`;
                }
                statsMessage += `\n👥 Total Active Users: ${state.activeUsers.size}`;
                await sendMsg(statsMessage, event.sender.id);
                break;

            case 'restart':
                state.lastRestart = new Date().toISOString();
                await sendMsg("🔄 Bot restart simulated. All temporary data has been reset.", event.sender.id);
                // Reset temporary data
                state.commandUsage.clear();
                state.activeUsers.clear();
                break;

            case 'broadcast':
                if (!subCommand) {
                    await sendMsg("❌ Please provide a message to broadcast", event.sender.id);
                    return;
                }
                const message = args.slice(1).join(' ');
                const broadcastMessage = `📢 Broadcast from Admin:\n\n${message}`;
                
                // Broadcast to all active users
                let successCount = 0;
                let failCount = 0;
                
                for (const userId of state.activeUsers) {
                    try {
                        await sendMsg(broadcastMessage, userId);
                        successCount++;
                    } catch (error) {
                        console.error(`Failed to send broadcast to ${userId}:`, error);
                        failCount++;
                    }
                }
                
                await sendMsg(`📢 Broadcast Results:\n✅ Successfully sent: ${successCount}\n❌ Failed: ${failCount}`, event.sender.id);
                break;

            case 'cooldown':
                if (!subCommand) {
                    await sendMsg("❌ Usage: /ac cooldown [command/-global] [seconds]", event.sender.id);
                    return;
                }
                
                if (subCommand === '-global') {
                    const globalCooldown = parseInt(args[2]);
                    if (isNaN(globalCooldown) || globalCooldown < 0) {
                        await sendMsg("❌ Invalid cooldown value", event.sender.id);
                        return;
                    }
                    
                    // Get all command files
                    const commandFiles = fs.readdirSync(__dirname)
                        .filter(file => file.endsWith('.js') && file !== 'ac.js');
                    
                    // Update cooldown for all commands
                    let updatedCount = 0;
                    for (const file of commandFiles) {
                        const cmdPath = path.join(__dirname, file);
                        const cmd = require(cmdPath);
                        if (cmd.config) {
                            // If cooldown is 0, restore default cooldown from file
                            if (globalCooldown === 0) {
                                const fileContent = fs.readFileSync(cmdPath, 'utf8');
                                const defaultCooldownMatch = fileContent.match(/cooldown:\s*(\d+)/);
                                if (defaultCooldownMatch) {
                                    cmd.config.cooldown = parseInt(defaultCooldownMatch[1]);
                                }
                            } else {
                                cmd.config.cooldown = globalCooldown;
                            }
                            updatedCount++;
                        }
                    }
                    
                    await sendMsg(`✅ Global cooldown ${globalCooldown === 0 ? 'restored to default' : `set to ${globalCooldown} seconds`} for ${updatedCount} commands`, event.sender.id);
                    return;
                }
                
                const cmdName = args[1];
                const cooldown = parseInt(args[2]);
                if (isNaN(cooldown) || cooldown < 0) {
                    await sendMsg("❌ Invalid cooldown value", event.sender.id);
                    return;
                }
                // Update command cooldown
                const cmdPath = path.join(__dirname, `${cmdName}.js`);
                if (fs.existsSync(cmdPath)) {
                    const cmd = require(cmdPath);
                    if (cooldown === 0) {
                        // Restore default cooldown from file
                        const fileContent = fs.readFileSync(cmdPath, 'utf8');
                        const defaultCooldownMatch = fileContent.match(/cooldown:\s*(\d+)/);
                        if (defaultCooldownMatch) {
                            cmd.config.cooldown = parseInt(defaultCooldownMatch[1]);
                        }
                        await sendMsg(`✅ Cooldown for ${cmdName} restored to default`, event.sender.id);
                    } else {
                        cmd.config.cooldown = cooldown;
                        await sendMsg(`✅ Cooldown for ${cmdName} set to ${cooldown} seconds`, event.sender.id);
                    }
                } else {
                    await sendMsg(`❌ Command ${cmdName} not found`, event.sender.id);
                }
                break;

            case 'disable':
            case 'enable':
                if (!subCommand) {
                    await sendMsg(`❌ Usage: /ac ${command} [command]`, event.sender.id);
                    return;
                }
                const targetCmd = args[1];
                const cmdFilePath = path.join(__dirname, `${targetCmd}.js`);
                if (fs.existsSync(cmdFilePath)) {
                    if (command === 'disable') {
                        state.disabledCommands.add(targetCmd);
                        await sendMsg(`✅ Command ${targetCmd} disabled`, event.sender.id);
                    } else {
                        state.disabledCommands.delete(targetCmd);
                        await sendMsg(`✅ Command ${targetCmd} enabled`, event.sender.id);
                    }
                } else {
                    await sendMsg(`❌ Command ${targetCmd} not found`, event.sender.id);
                }
                break;

            case 'event':
                if (!subCommand || !args[2]) {
                    await sendMsg("❌ Usage: /ac event [enable/disable] [event]", event.sender.id);
                    return;
                }
                const eventName = args[2];
                const eventPath = path.join(__dirname, '../events', `${eventName}.js`);
                if (fs.existsSync(eventPath)) {
                    if (subCommand === 'disable') {
                        state.disabledEvents.add(eventName);
                        await sendMsg(`✅ Event ${eventName} disabled`, event.sender.id);
                    } else if (subCommand === 'enable') {
                        state.disabledEvents.delete(eventName);
                        await sendMsg(`✅ Event ${eventName} enabled`, event.sender.id);
                    }
                } else {
                    await sendMsg(`❌ Event ${eventName} not found`, event.sender.id);
                }
                break;

            case 'prefix':
                if (!subCommand) {
                    await sendMsg("❌ Please provide a new prefix", event.sender.id);
                    return;
                }
                config.PREFIX = subCommand;
                saveConfig();
                await sendMsg(`✅ Bot prefix changed to: ${subCommand}`, event.sender.id);
                break;

            case 'log':
                if (!subCommand) {
                    await sendMsg("❌ Please specify 'on' or 'off'", event.sender.id);
                    return;
                }
                config.debugLogging = subCommand === 'on';
                saveConfig();
                await sendMsg(`✅ Debug logging ${config.debugLogging ? 'enabled' : 'disabled'}`, event.sender.id);
                break;

            case 'cache':
                if (subCommand === 'clear') {
                    // Clear require cache for commands
                    Object.keys(require.cache).forEach(key => {
                        if (key.includes('commands') || key.includes('events')) {
                            delete require.cache[key];
                        }
                    });
                    await sendMsg("✅ Command cache cleared", event.sender.id);
                }
                break;

            case 'reload':
                if (!subCommand) {
                    await sendMsg("❌ Please specify a command to reload", event.sender.id);
                    return;
                }
                const reloadCmd = args[1];
                const reloadPath = path.join(__dirname, `${reloadCmd}.js`);
                
                if (fs.existsSync(reloadPath)) {
                    try {
                        // Clear require cache for this file
                        delete require.cache[require.resolve(reloadPath)];
                        // Reload the command
                        require(reloadPath);
                        await sendMsg(`✅ Command ${reloadCmd} reloaded successfully!`, event.sender.id);
                    } catch (error) {
                        console.error(`Error reloading command ${reloadCmd}:`, error);
                        await sendMsg(`❌ Failed to reload command ${reloadCmd}. Check console for details.`, event.sender.id);
                    }
                } else {
                    await sendMsg(`❌ Command ${reloadCmd} not found`, event.sender.id);
                }
                break;

            case 'error':
                if (!subCommand) {
                    await sendMsg("❌ Please specify a command to test", event.sender.id);
                    return;
                }
                const testCmd = args[1];
                const testPath = path.join(__dirname, `${testCmd}.js`);
                if (fs.existsSync(testPath)) {
                    try {
                        const cmd = require(testPath);
                        await cmd.run({ event, args: ['test_error'] });
                    } catch (error) {
                        await sendMsg(`✅ Error handling test successful:\n${error.message}`, event.sender.id);
                    }
                } else {
                    await sendMsg(`❌ Command ${testCmd} not found`, event.sender.id);
                }
                break;

            case 'memory':
                const memoryUsage = process.memoryUsage();
                const memoryMessage = `💾 𝗠𝗘𝗠𝗢𝗥𝗬 𝗨𝗦𝗔𝗚𝗘

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Heap Total: ${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB
Heap Used: ${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB
RSS: ${Math.round(memoryUsage.rss / 1024 / 1024)}MB
External: ${Math.round(memoryUsage.external / 1024 / 1024)}MB
Array Buffers: ${Math.round(memoryUsage.arrayBuffers / 1024 / 1024)}MB`;
                await sendMsg(memoryMessage, event.sender.id);
                break;

            default:
                await sendMsg("❌ Unknown command. Use /ac for help.", event.sender.id);
        }

        await typingIndicator(false, event.sender.id);

    } catch (error) {
        console.error('[AC] Error:', error);
        const sendMsg = sendMessage(event);
        await sendMsg("❌ An error occurred while processing the command.", event.sender.id);
    }
}; 