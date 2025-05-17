const cooldownManager = require('./cooldownManager');

class StateManager {
  constructor() {
    this.executingCommands = new Map();
    this.cooldowns = new Map();
    this.commandUsage = new Map();
    this.userStates = new Map();
    this.activeSearches = new Map();
  }

  // Command execution tracking
  isExecutingCommand(userId) {
    return this.executingCommands.has(userId);
  }

  getExecutingCommand(userId) {
    return this.executingCommands.get(userId);
  }

  setExecutingCommand(userId, commandName) {
    this.executingCommands.set(userId, commandName);
  }

  clearExecutingCommand(userId) {
    this.executingCommands.delete(userId);
  }

  // Cooldown management
  getCooldown(userId, commandName) {
    const userCooldowns = this.cooldowns.get(userId) || new Map();
    return userCooldowns.get(commandName);
  }

  setCooldown(userId, commandName, duration) {
    if (!this.cooldowns.has(userId)) {
      this.cooldowns.set(userId, new Map());
    }
    this.cooldowns.get(userId).set(commandName, Date.now() + duration);
  }

  clearCooldown(userId, commandName) {
    const userCooldowns = this.cooldowns.get(userId);
    if (userCooldowns) {
      userCooldowns.delete(commandName);
      if (userCooldowns.size === 0) {
        this.cooldowns.delete(userId);
      }
    }
  }

  // Command usage tracking
  trackCommandUsage(commandName, userId) {
    if (!this.commandUsage.has(commandName)) {
      this.commandUsage.set(commandName, new Set());
    }
    this.commandUsage.get(commandName).add(userId);
  }

  getCommandUsage(commandName) {
    return this.commandUsage.get(commandName) || new Set();
  }

  // User state management
  getUserState(userId) {
    return this.userStates.get(userId) || {};
  }

  setUserState(userId, state) {
    this.userStates.set(userId, { ...this.getUserState(userId), ...state });
  }

  clearUserState(userId) {
    this.userStates.delete(userId);
  }

  // Active search management
  getActiveSearch(userId) {
    return this.activeSearches.get(userId);
  }

  setActiveSearch(userId, searchData) {
    this.activeSearches.set(userId, searchData);
  }

  clearActiveSearch(userId) {
    this.activeSearches.delete(userId);
  }

  // Cleanup methods
  cleanupUser(userId) {
    this.clearExecutingCommand(userId);
    this.cooldowns.delete(userId);
    this.clearUserState(userId);
    this.clearActiveSearch(userId);
  }

  cleanupAll() {
    this.executingCommands.clear();
    this.cooldowns.clear();
    this.commandUsage.clear();
    this.userStates.clear();
    this.activeSearches.clear();
  }
}

// Create singleton instance
const stateManager = new StateManager();
module.exports = stateManager;