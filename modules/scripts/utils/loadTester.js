const config = require('../../../config.json');
const monitor = require('./monitor');
const commandHandler = require('./commandHandler');
const sendMessage = require("../../../page/src/sendMessage");
const fs = require('fs');
const path = require('path');

class LoadTester {
    constructor() {
        this.activeUsers = new Map();
        this.isRunning = false;
        this.commands = ['/help'];
        this.logMessageId = null;
        this.logUpdateInterval = 5000;
        this.wasMonitoring = false;
        this.lastCommandTimes = new Map();
        this.COOLDOWN_TIME = 5000;
        this.userNames = [
            "John", "Emma", "Michael", "Sophia", "William", "Olivia", "James", "Ava", "Benjamin", "Isabella",
            "Lucas", "Mia", "Henry", "Charlotte", "Alexander", "Amelia", "Daniel", "Harper", "Matthew", "Evelyn"
        ];
    }

    generateRandomUser(adminId) {
        // Generate a unique user ID that looks like a Facebook ID
        const userId = Math.floor(Math.random() * 1000000000000000).toString();
        // Pick a random name from our list
        const name = this.userNames[Math.floor(Math.random() * this.userNames.length)];
        // Generate a unique thread ID
        const threadId = Math.floor(Math.random() * 1000000000000000).toString();
        
        return {
            id: userId, // Unique user ID
            name: name,
            threadId: threadId,
            lastActive: Date.now(),
            commandCount: 0
        };
    }

    async updateLogs(adminId) {
        if (!this.isRunning) return;

        let totalCommands = 0;
        let totalResponses = 0;
        let totalErrors = 0;
        let logText = '📊 LOAD TEST STATS\n\n';
        
        this.activeUsers.forEach((stats, userId) => {
            const timeSinceLastCommand = ((Date.now() - stats.lastCommand) / 1000).toFixed(1);
            logText += `👤 ${stats.name} (${userId}):\n`;
            logText += `   Commands: ${stats.commands}\n`;
            logText += `   Responses: ${stats.responses}\n`;
            logText += `   Errors: ${stats.errors}\n`;
            logText += `   Last Command: ${timeSinceLastCommand}s ago\n\n`;
            
            totalCommands += stats.commands;
            totalResponses += stats.responses;
            totalErrors += stats.errors;
        });
        
        logText += '📈 OVERALL STATS:\n';
        logText += `Total Users: ${this.activeUsers.size}\n`;
        logText += `Total Commands: ${totalCommands}\n`;
        logText += `Total Responses: ${totalResponses}\n`;
        logText += `Total Errors: ${totalErrors}\n`;
        logText += `Success Rate: ${((totalResponses / totalCommands) * 100).toFixed(1)}%\n\n`;
        logText += 'Use /loadtest stop to end the test';

        const event = {
            sender: { id: adminId },
            recipient: { id: 'bot_id' }
        };

        await sendMessage(event)(logText, adminId);
    }

    canExecuteCommand(userId) {
        const lastCommandTime = this.lastCommandTimes.get(userId) || 0;
        const timeSinceLastCommand = Date.now() - lastCommandTime;
        return timeSinceLastCommand >= this.COOLDOWN_TIME;
    }

    async simulateUserCommand(user) {
        try {
            // Check cooldown
            if (!this.canExecuteCommand(user.id)) {
                return; // Skip this command if on cooldown
            }

            const command = '/help';
            
            // Create event with user's unique ID
            const event = {
                sender: { 
                    id: user.id,
                    name: user.name
                },
                message: {
                    text: command,
                    is_echo: false
                },
                threadID: user.threadId,
                type: 'message'
            };

            const [rawCommandName, ...args] = command.split(" ");
            const commandName = rawCommandName.slice(1).toLowerCase();

            const commandPath = path.join(__dirname, '../commands', `${commandName}.js`);
            if (!fs.existsSync(commandPath)) {
                throw new Error(`Command module not found: ${commandName}`);
            }

            const commandModule = require(commandPath);
            
            // Update last command time before execution
            this.lastCommandTimes.set(user.id, Date.now());
            
            const result = await commandHandler.handleCommand(event, commandModule, args, false);
            
            const stats = this.activeUsers.get(user.id) || { 
                name: user.name,
                commands: 0, 
                lastCommand: Date.now(),
                responses: 0,
                errors: 0
            };
            
            stats.commands++;
            stats.lastCommand = Date.now();
            
            if (result.success) {
                stats.responses++;
            } else {
                stats.errors++;
                console.error(`[LoadTest] Command execution failed for user ${user.name} (${user.id}):`, result.message);
            }
            
            this.activeUsers.set(user.id, stats);

        } catch (error) {
            console.error(`[LoadTest] Error simulating command for user ${user.name} (${user.id}):`, error.message);
            const stats = this.activeUsers.get(user.id) || { 
                name: user.name,
                commands: 0, 
                lastCommand: Date.now(),
                responses: 0,
                errors: 0
            };
            stats.errors++;
            this.activeUsers.set(user.id, stats);
        }
    }

    async startLoadTest(numUsers = 50, interval = 2000, adminId) {
        if (this.isRunning) {
            return {
                success: false,
                message: 'Load test already running'
            };
        }

        this.isRunning = true;
        this.logMessageId = null;
        this.lastCommandTimes.clear();
        this.activeUsers.clear();
        
        this.wasMonitoring = monitor.isRunning;
        if (this.wasMonitoring) {
            monitor.stop();
        }
        
        // Create simulated users with unique IDs
        const users = Array.from({ length: numUsers }, () => this.generateRandomUser(adminId));
        console.log(`[LoadTest] Created ${numUsers} simulated users`);
        
        this.intervalId = setInterval(() => {
            // Randomly select 10-20% of users to send commands
            const activeCount = Math.floor(numUsers * (0.1 + Math.random() * 0.1));
            const selectedUsers = users
                .sort(() => Math.random() - 0.5)
                .slice(0, activeCount);

            // Add random delay between 0-2 seconds for each command
            selectedUsers.forEach((user, index) => {
                setTimeout(() => {
                    this.simulateUserCommand(user);
                }, Math.random() * 2000);
            });
        }, interval);

        this.logIntervalId = setInterval(() => {
            this.updateLogs(adminId);
        }, this.logUpdateInterval);

        await this.updateLogs(adminId);

        return {
            success: true,
            message: `Started load test with ${numUsers} simulated users. Use /loadtest stop to end the test.`
        };
    }

    async stopLoadTest() {
        if (!this.isRunning) return;

        clearInterval(this.intervalId);
        clearInterval(this.logIntervalId);
        this.isRunning = false;
        this.activeUsers.clear();
        this.lastCommandTimes.clear();
        this.logMessageId = null;
        
        if (this.wasMonitoring) {
            monitor.start();
        }
        
        return {
            success: true,
            message: 'Load test stopped'
        };
    }
}

const loadTester = new LoadTester();

module.exports = loadTester; 