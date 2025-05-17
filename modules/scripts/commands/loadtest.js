const loadTester = require('../utils/loadTester');

module.exports.config = {
    name: 'loadtest',
    author: 'System',
    version: '1.0',
    description: 'Simulates multiple users using the bot',
    usePrefix: true,
    category: 'Utility',
    adminOnly: false,
    cooldown: 0
};

module.exports.run = async function({ event }) {
    const { message, sender } = event;
    const args = message.text.split(' ');
    
    // Handle stop command
    if (args[1] === 'stop') {
        const result = await loadTester.stopLoadTest();
        return result;
    }
    
    // Default to 50 users if no number specified
    const numUsers = parseInt(args[1]) || 50;
    
    // Start load test with admin ID
    const result = await loadTester.startLoadTest(numUsers, 2000, sender.id);
    return result;
}; 