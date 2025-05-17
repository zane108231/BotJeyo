const os = require('os');
const process = require('process');
const sendMessage = require("../../../page/src/sendMessage");
const sendTypingIndicator = require("../../../page/src/sendTypingIndicator");
const cooldownManager = require("../utils/cooldownManager");

// Store bot start time
const startTime = Date.now();

// Helper function to format bytes to human readable
function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Helper function to format uptime
function formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    return `${days}d ${hours % 24}h ${minutes % 60}m ${seconds % 60}s`;
}

// Helper function to get CPU usage
function getCPUUsage() {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    for (const cpu of cpus) {
        for (const type in cpu.times) {
            totalTick += cpu.times[type];
        }
        totalIdle += cpu.times.idle;
    }

    return {
        idle: totalIdle / cpus.length,
        total: totalTick / cpus.length
    };
}

module.exports.config = {
    name: "status",
    author: "PageBot",
    version: "1.0",
    description: "Shows real-time bot statistics",
    category: "admin",
    cooldown: 5,
    usePrefix: true,
    adminOnly: true
};

module.exports.run = async function({ event }) {
    try {
        const sendMsg = sendMessage(event);
        const typingIndicator = sendTypingIndicator(event);

        // Show typing indicator
        await typingIndicator(true, event.sender.id);

        // Get system stats
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;
        const memoryUsage = process.memoryUsage();
        
        // Get CPU usage
        const startMeasure = getCPUUsage();
        await new Promise(resolve => setTimeout(resolve, 100));
        const endMeasure = getCPUUsage();
        const idleDifference = endMeasure.idle - startMeasure.idle;
        const totalDifference = endMeasure.total - startMeasure.total;
        const cpuUsage = 100 - Math.round(100 * idleDifference / totalDifference);

        // Get active commands and cooldowns
        const activeCommands = cooldownManager.getActiveCommands();
        const activeCooldowns = cooldownManager.getActiveCooldowns();

        // Format status message
        const statusMessage = [
            "🤖 𝗕𝗼𝘁 𝗦𝘁𝗮𝘁𝘂𝘀",
            "━━━━━━━━━━━━━━━",
            `⏰ 𝗨𝗽𝘁𝗶𝗺𝗲: ${formatUptime(Date.now() - startTime)}`,
            `💻 𝗖𝗣𝗨 𝗨𝘀𝗮𝗴𝗲: ${cpuUsage}%`,
            `📊 𝗥𝗔𝗠 𝗨𝘀𝗮𝗴𝗲:`,
            `   • 𝗧𝗼𝘁𝗮𝗹: ${formatBytes(totalMem)}`,
            `   • 𝗨𝘀𝗲𝗱: ${formatBytes(usedMem)} (${Math.round(usedMem/totalMem*100)}%)`,
            `   • 𝗙𝗿𝗲𝗲: ${formatBytes(freeMem)}`,
            `📝 𝗣𝗿𝗼𝗰𝗲𝘀𝘀 𝗠𝗲𝗺𝗼𝗿𝘆:`,
            `   • 𝗛𝗲𝗮𝗽: ${formatBytes(memoryUsage.heapUsed)}`,
            `   • 𝗥𝗦𝗦: ${formatBytes(memoryUsage.rss)}`,
            `   • 𝗘𝘅𝘁𝗲𝗿𝗻𝗮𝗹: ${formatBytes(memoryUsage.external)}`,
            "━━━━━━━━━━━━━━━",
            `🔄 𝗔𝗰𝘁𝗶𝘃𝗲 𝗖𝗼𝗺𝗺𝗮𝗻𝗱𝘀: ${activeCommands.length}`,
            `⏳ 𝗔𝗰𝘁𝗶𝘃𝗲 𝗖𝗼𝗼𝗹𝗱𝗼𝘄𝗻𝘀: ${activeCooldowns.length}`,
            "━━━━━━━━━━━━━━━"
        ].join('\n');

        // Send status message
        await sendMsg(statusMessage, event.sender.id);

        // Stop typing indicator
        await typingIndicator(false, event.sender.id);

    } catch (error) {
        console.error("[Status] Error:", error);
        const sendMsg = sendMessage(event);
        await sendMsg("❌ Error getting bot status.", event.sender.id);
    }
}; 