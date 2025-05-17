# Cooldown System Documentation

## Overview
The cooldown system is a centralized mechanism for managing command and postback cooldowns across the bot. It prevents users from spamming commands and ensures proper handling of postback interactions.

## Architecture

### Core Components

1. **CooldownManager** (`modules/scripts/utils/cooldownManager.js`)
   - Central manager for all cooldown and lock operations
   - Handles both command and postback cooldowns
   - Manages execution locks to prevent simultaneous operations
   - Provides utility functions for cooldown checks and updates

2. **State Management** (`page/state.js`)
   - Stores shared state for cooldowns and locks
   - Maintains maps for:
     - `executingCommands`: Currently executing commands
     - `cooldowns`: Active cooldowns for commands and postbacks
     - `postbackLocks`: Locks for postback interactions

## Usage

### Command Cooldowns

```javascript
const { cooldownManager } = require('./utils/cooldownManager');

// Check if a command is on cooldown
const remainingTime = cooldownManager.checkCommandCooldown(userId, commandName);
if (remainingTime) {
    return `Please wait ${remainingTime} seconds before using this command again.`;
}

// Lock a command execution
if (!cooldownManager.lockCommand(userId, commandName)) {
    return 'This command is already being executed.';
}

try {
    // Execute command
    // ...
} finally {
    // Always unlock the command
    cooldownManager.unlockCommand(userId, commandName);
}

// Update command cooldown
cooldownManager.updateCommandCooldown(userId, commandName, cooldownTime);
```

### Postback Cooldowns

```javascript
const { cooldownManager } = require('./utils/cooldownManager');

// Check if a postback is on cooldown
const remainingTime = cooldownManager.checkPostbackCooldown(userId, postbackId);
if (remainingTime) {
    return `Please wait ${remainingTime} seconds before using this button again.`;
}

// Lock a postback interaction
if (!cooldownManager.lockPostback(userId, postbackId)) {
    return 'This button is already being processed.';
}

try {
    // Handle postback
    // ...
} finally {
    // Always unlock the postback
    cooldownManager.unlockPostback(userId, postbackId);
}

// Update postback cooldown
cooldownManager.updatePostbackCooldown(userId, postbackId, cooldownTime);
```

## Implementation Details

### Cooldown Types

1. **Command Cooldowns**
   - Prevents users from spamming commands
   - Cooldown duration is command-specific
   - Managed through `commandCooldowns` map

2. **Postback Cooldowns**
   - Prevents rapid clicking of interactive buttons
   - Cooldown duration is postback-specific
   - Managed through `postbackCooldowns` map

### Lock System

1. **Command Locks**
   - Prevents simultaneous execution of the same command
   - Managed through `executingCommands` map
   - Automatically released after command completion

2. **Postback Locks**
   - Prevents multiple simultaneous postback interactions
   - Managed through `postbackLocks` map
   - Automatically released after postback handling

## Best Practices

1. **Always Use Try-Finally**
   ```javascript
   try {
       // Command or postback handling
   } finally {
       // Always unlock
       cooldownManager.unlockCommand(userId, commandName);
       // or
       cooldownManager.unlockPostback(userId, postbackId);
   }
   ```

2. **Check Cooldowns First**
   - Always check cooldown before attempting to lock
   - Provide clear feedback to users about remaining cooldown time

3. **Use Appropriate Cooldown Times**
   - Commands: 5-60 seconds depending on command complexity
   - Postbacks: 2-5 seconds for interactive buttons

4. **Error Handling**
   - Always unlock commands/postbacks in finally block
   - Handle errors gracefully with user feedback
   - Log errors for debugging

## Migration Guide

If you're updating existing code to use the new cooldown system:

1. Remove any direct state management of cooldowns
2. Import the CooldownManager:
   ```javascript
   const { cooldownManager } = require('./utils/cooldownManager');
   ```
3. Replace direct state access with CooldownManager methods
4. Update error handling to use the new system

## Troubleshooting

Common issues and solutions:

1. **Command/Postback Stuck in Locked State**
   - Check if the finally block is properly unlocking
   - Verify error handling is not preventing unlock
   - Check for process crashes during execution

2. **Cooldown Not Working**
   - Verify cooldown time is being set correctly
   - Check if user ID is consistent
   - Ensure cooldown updates are being called

3. **Multiple Simultaneous Executions**
   - Verify lock checks are in place
   - Check if unlock is being called properly
   - Ensure proper error handling

## Future Improvements

1. **Persistence**
   - Add database storage for cooldowns
   - Implement cooldown recovery after bot restart

2. **Advanced Features**
   - Role-based cooldown adjustments
   - Dynamic cooldown times based on usage
   - Cooldown reset commands for admins

3. **Monitoring**
   - Add cooldown usage statistics
   - Implement cooldown abuse detection
   - Add admin dashboard for cooldown management 