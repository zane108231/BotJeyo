const fs = require("fs");
const path = require("path");
const config = require("../config.json");
const { getTheme } = require("../website/web.js");
const state = require("./state");
const cooldownManager = require("../modules/scripts/utils/cooldownManager");

module.exports = async function (event) {
    const modulesPath = path.join(__dirname, "../modules/scripts/commands");
    const eventsPath = path.join(__dirname, "../modules/scripts/events");
    const commandFiles = fs.readdirSync(modulesPath).filter(file => file.endsWith(".js"));

    // Check if the sender is an admin
    const isAdmin = config.ADMINS.includes(event.sender.id);

    if (event?.message?.is_echo) {
        event.sender.id = event.recipient.id;
    }

    // Mark messages as seen if turned on
    if (config.markAsSeen) {
        api.markAsSeen(true, event.threadID).then().catch(err => console.error(err));
    }

    // Track active user
    state.activeUsers.add(event.sender.id);

    // Handle postbacks
    if (event.postback) {
        console.log("[Handler] Received postback:", event.postback);
        
        // Check if user can execute postback
        const { canExecute, message } = await cooldownManager.checkPostbackCooldown(event.sender.id, event.postback.payload);
        if (!canExecute) {
            await api.sendMessage(message, event.sender.id);
            return;
        }

        try {
            // Load all event modules
            const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith(".js"));
            let handled = false;

            // First try welcomemessage.js for START_CHAT and HELP_PAYLOAD
            if (event.postback.payload === 'START_CHAT' || event.postback.payload === 'HELP_PAYLOAD') {
                const welcomeModule = require("../modules/scripts/events/welcomemessage");
                if (welcomeModule.onPostback) {
                    try {
                        await welcomeModule.onPostback({ event });
                        handled = true;
                    } catch (error) {
                        console.error("Error handling postback in welcomemessage.js:", error);
                    }
                }
            }

            // If not handled by welcomemessage.js, try other event files
            if (!handled) {
                for (const file of eventFiles) {
                    const eventModulePath = path.join(eventsPath, file);
                    const ev = require(eventModulePath);

                    if (ev.onPostback) {
                        try {
                            await ev.onPostback({ event });
                        } catch (error) {
                            console.error(`Error handling postback in ${file}:`, error);
                        }
                    }
                }
            }

            // Set cooldown for the postback (default 3 seconds)
            cooldownManager.setPostbackCooldown(event.sender.id, event.postback.payload, 3);
        } catch (error) {
            console.error("[Handler] Postback error:", error);
            await api.sendMessage("❌ An error occurred while processing your request. Please try again.", event.sender.id);
        }
        return; // Exit after handling postback
    }

    // Extract command text and arguments from the event
    const messageText = event.message?.text || event.postback?.title || "";
    const [rawCommandName, ...args] = messageText.split(" ");

    // Check maintenance mode
    if (config.maintenance && !isAdmin) {
        api.sendMessage("🔧 The bot is currently under maintenance. Please try again later.", event.sender.id);
        return;
    }

    // Handle commands
    for (const file of commandFiles) {
        const commandPath = path.join(modulesPath, file);
        const command = require(commandPath);

        if (command && command.config && typeof command.config.name === "string") {
            let commandName;

            // Check if the command requires a prefix
            if (command.config.usePrefix) {
                if (rawCommandName.startsWith(config.PREFIX)) {
                    commandName = rawCommandName.slice(config.PREFIX.length).toLowerCase();
                } else {
                    continue; // Skip if the command requires prefix but it's not used
                }
            } else {
                commandName = rawCommandName.toLowerCase();

                // Notify the user that the command doesn't need a prefix if they used one
                if (rawCommandName.startsWith(config.PREFIX + command.config.name) && !command.config.usePrefix) {
                    api.sendMessage(`The "${command.config.name}" command does not require a prefix. Please try again without it.`, event.sender.id);
                    continue;
                }
            }

            // Check if the command is admin-only and if the sender is an admin
            if (commandName === command.config.name.toLowerCase() && command.config.adminOnly && !isAdmin) {
                api.sendMessage("You do not have permission to use this command.", event.sender.id);
                continue;
            }

            // Check if command is disabled
            if (state.disabledCommands && state.disabledCommands.has(commandName)) {
                return await api.sendMessage(`❌ Command ${commandName} is currently disabled by an administrator.`, event.sender.id);
            }

            if (command.config.name.toLowerCase() === commandName) {
                console.log(getTheme().gradient(`SYSTEM:`), `${command.config.name} command was executed!`);
                
                // Check command cooldown
                const { onCooldown, remainingTime } = cooldownManager.checkCommandCooldown(
                    event.sender.id, 
                    commandName, 
                    command.config.cooldown || 0,
                    isAdmin
                );

                if (onCooldown) {
                    await api.sendMessage(`Please wait ${remainingTime} second(s) before using this command again.`, event.sender.id);
                    return;
                }

                // Check if user can execute command
                const { canExecute, message } = await cooldownManager.checkCommandLock(event.sender.id, commandName);
                if (!canExecute) {
                    await api.sendMessage(message, event.sender.id);
                    return;
                }

                // Lock command execution
                cooldownManager.lockCommand(event.sender.id, commandName);

                try {
                    // Update cooldown
                    cooldownManager.updateCommandCooldown(event.sender.id, commandName, isAdmin);

                    // Execute command
                    await command.run({ event, args });
                } catch (error) {
                    console.error(`Error executing ${commandName}:`, error);
                    await api.sendMessage("An error occurred while executing the command.", event.sender.id);
                } finally {
                    // Unlock command execution
                    cooldownManager.unlockCommand(event.sender.id);
                }
                return; // Exit after handling command
            }
        } else {
            console.log(`Skipped command: ${file} - missing or invalid config.`);
        }
    }

    // Handle events
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith(".js"));
    for (const file of eventFiles) {
        const eventModulePath = path.join(eventsPath, file);
        const ev = require(eventModulePath);

        if (!ev.config?.selfListen && event.message?.is_echo) return;

        // Check if event is disabled
        const eventName = path.basename(file, '.js');
        if (state.disabledEvents && state.disabledEvents.has(eventName)) {
            continue;
        }

        try {
            await ev.run({ event, args });
        } catch (error) {
            console.error(`Error executing event handler ${file}:`, error);
        }
    }
};