const os = require('os');
const process = require('process');

class SystemMonitor {
    constructor(interval = 5000) { // Default 5 second interval
        this.interval = interval;
        this.isRunning = false;
        this.startTime = Date.now();
        this.lastCPUUsage = this.getCPUUsage();
        this.lastCheck = Date.now();
        this.commandStats = new Map(); // Track command usage
        this.lastCommandTime = Date.now();
        this.memoryHistory = []; // Track memory history
        this.maxMemoryHistory = 10; // Keep last 10 readings
        this.peakMemory = {
            heap: 0,
            rss: 0,
            external: 0
        };
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    formatUptime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        return `${days}d ${hours % 24}h ${minutes % 60}m ${seconds % 60}s`;
    }

    getCPUUsage() {
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

    calculateCPUUsage() {
        const currentCPUUsage = this.getCPUUsage();
        const idleDifference = currentCPUUsage.idle - this.lastCPUUsage.idle;
        const totalDifference = currentCPUUsage.total - this.lastCPUUsage.total;
        const cpuUsage = 100 - Math.round(100 * idleDifference / totalDifference);
        
        this.lastCPUUsage = currentCPUUsage;
        return cpuUsage;
    }

    trackCommand(command) {
        const now = Date.now();
        if (!this.commandStats.has(command)) {
            this.commandStats.set(command, {
                count: 0,
                lastUsed: now,
                avgInterval: 0
            });
        }
        
        const stats = this.commandStats.get(command);
        stats.count++;
        stats.avgInterval = (stats.avgInterval * (stats.count - 1) + (now - stats.lastUsed)) / stats.count;
        stats.lastUsed = now;
    }

    updateMemoryHistory(memoryUsage) {
        // Update peak memory
        this.peakMemory.heap = Math.max(this.peakMemory.heap, memoryUsage.heapUsed);
        this.peakMemory.rss = Math.max(this.peakMemory.rss, memoryUsage.rss);
        this.peakMemory.external = Math.max(this.peakMemory.external, memoryUsage.external);

        // Add to history
        this.memoryHistory.push({
            timestamp: Date.now(),
            heap: memoryUsage.heapUsed,
            rss: memoryUsage.rss,
            external: memoryUsage.external
        });

        // Keep only last N readings
        if (this.memoryHistory.length > this.maxMemoryHistory) {
            this.memoryHistory.shift();
        }
    }

    calculateMemoryTrend() {
        if (this.memoryHistory.length < 2) return 'stable';
        
        const first = this.memoryHistory[0];
        const last = this.memoryHistory[this.memoryHistory.length - 1];
        const heapDiff = last.heap - first.heap;
        const rssDiff = last.rss - first.rss;
        
        if (heapDiff > 5 * 1024 * 1024 || rssDiff > 10 * 1024 * 1024) return 'increasing';
        if (heapDiff < -5 * 1024 * 1024 || rssDiff < -10 * 1024 * 1024) return 'decreasing';
        return 'stable';
    }

    logStats() {
        const now = Date.now();
        const timeDiff = now - this.lastCheck;
        this.lastCheck = now;

        // Get system stats
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;
        const memoryUsage = process.memoryUsage();
        const cpuUsage = this.calculateCPUUsage();

        // Update memory history
        this.updateMemoryHistory(memoryUsage);
        const memoryTrend = this.calculateMemoryTrend();

        // Sort commands by usage
        const sortedCommands = Array.from(this.commandStats.entries())
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, 5);

        // Clear console and print stats
        console.clear();
        console.log('\n╔════════════════════════════════════════════════════════════════╗');
        console.log('║                      🤖 BOT MONITOR                            ║');
        console.log('╠════════════════════════════════════════════════════════════════╣');
        console.log(`║ ⏰ Uptime: ${this.formatUptime(now - this.startTime)}`);
        console.log(`║ 💻 CPU Usage: ${cpuUsage}%`);
        console.log('║');
        console.log('║ 📝 BOT MEMORY USAGE:');
        console.log(`║    Current:`);
        console.log(`║      Heap:    ${this.formatBytes(memoryUsage.heapUsed)} (JS Objects)`);
        console.log(`║      RSS:     ${this.formatBytes(memoryUsage.rss)} (Total Process)`);
        console.log(`║      External: ${this.formatBytes(memoryUsage.external)} (C++ Objects)`);
        console.log(`║    Peak:`);
        console.log(`║      Heap:    ${this.formatBytes(this.peakMemory.heap)}`);
        console.log(`║      RSS:     ${this.formatBytes(this.peakMemory.rss)}`);
        console.log(`║    Trend: ${memoryTrend === 'increasing' ? '📈' : memoryTrend === 'decreasing' ? '📉' : '➡️'} ${memoryTrend}`);
        console.log('║');
        console.log('║ 📊 System Memory (Your Computer):');
        console.log(`║    Total: ${this.formatBytes(totalMem)}`);
        console.log(`║    Used:  ${this.formatBytes(usedMem)} (${Math.round(usedMem/totalMem*100)}%)`);
        console.log(`║    Free:  ${this.formatBytes(freeMem)}`);
        console.log('║');
        console.log('║ 🔥 Top Commands:');
        sortedCommands.forEach(([cmd, stats]) => {
            console.log(`║    ${cmd}: ${stats.count} uses (avg: ${(stats.avgInterval/1000).toFixed(1)}s)`);
        });
        console.log('║');
        console.log(`║ ⏱️  Check Interval: ${(timeDiff / 1000).toFixed(1)}s`);
        console.log('╚════════════════════════════════════════════════════════════════╝\n');
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastCheck = Date.now();
        this.lastCPUUsage = this.getCPUUsage();
        
        console.log(`[Monitor] Starting system monitoring (${this.interval}ms interval)`);
        
        this.intervalId = setInterval(() => {
            this.logStats();
        }, this.interval);
    }

    stop() {
        if (!this.isRunning) return;
        this.isRunning = false;
        clearInterval(this.intervalId);
        console.log('[Monitor] System monitoring stopped');
    }

    setInterval(ms) {
        this.interval = ms;
        if (this.isRunning) {
            this.stop();
            this.start();
        }
    }
}

// Create singleton instance
const monitor = new SystemMonitor();

module.exports = monitor; 