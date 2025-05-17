# Cooldown System Documentation

## Overview
The cooldown system is a centralized way to manage command and postback cooldowns in the bot. It prevents users from spamming commands and buttons, and ensures proper execution of actions.

## Structure
The cooldown system consists of:
1. `CooldownManager` (modules/scripts/utils/cooldownManager.js) - Main manager class
2. State management (page/state.js) - Stores cooldown and lock states
3. Integration with handlers (page/handler.js) - Uses the cooldown system

## How to Use

### 1. For Commands
When creating a new command, you can specify a cooldown in the command's config:

```javascript
module.exports.config = {
    name: "example",
    author: "Your Name",
    version: "1.0",
    description: "Example command",
    cooldown: 5, // Cooldown in seconds
    usePrefix: true
};
```

The cooldown system will automatically handle:
- Checking if the command is on cooldown
- Preventing concurrent execution
- Setting cooldowns after execution

### 2. For Postback Buttons
When creating a new event handler with postback buttons:

```javascript
const cooldownManager = require("../utils/cooldownManager");

module.exports.onPostback = async function({ event }) {
    const sendMsg = sendMessage(event);
    
    try {
        // Check if user can execute postback
        const { canExecute, message } = await cooldownManager.checkPostbackCooldown(
            event.sender.id, 
            event.postback.payload
        );
        
        if (!canExecute) {
            await sendMsg(message, event.sender.id);
            return;
        }

        // Lock postback execution
        cooldownManager.lockPostback(event.sender.id, event.postback.payload);

        try {
            // Your postback handling code here
            
            // Set cooldown (in seconds)
            cooldownManager.setPostbackCooldown(event.sender.id, event.postback.payload, 10);
        } finally {
            // Always unlock the postback
            cooldownManager.unlockPostback(event.sender.id);
        }
    } catch (error) {
        console.error('[YourHandler] Error:', error);
        await sendMsg("❌ An error occurred.", event.sender.id);
    }
};
```

### 3. Available Methods

#### Command Methods
```javascript
// Check if command is on cooldown
const { onCooldown, remainingTime } = cooldownManager.checkCommandCooldown(
    userId,
    commandName,
    cooldownTime,
    isAdmin
);

// Update command cooldown
cooldownManager.updateCommandCooldown(userId, commandName, isAdmin);

// Check if command is locked
const { canExecute, message } = cooldownManager.checkCommandLock(userId, commandName);

// Lock command execution
cooldownManager.lockCommand(userId, commandName);

// Unlock command execution
cooldownManager.unlockCommand(userId);
```

#### Postback Methods
```javascript
// Check if postback can be executed
const { canExecute, message } = cooldownManager.checkPostbackCooldown(userId, postbackType);

// Set postback cooldown
cooldownManager.setPostbackCooldown(userId, postbackType, cooldownSeconds);

// Lock postback execution
cooldownManager.lockPostback(userId, postbackType);

// Unlock postback execution
cooldownManager.unlockPostback(userId);
```

## Best Practices

1. **Always Use Try-Finally**
   ```javascript
   try {
       // Your code
   } finally {
       cooldownManager.unlockPostback(userId);
   }
   ```

2. **Set Appropriate Cooldowns**
   - Commands: 1-5 seconds for simple commands
   - Postbacks: 3-10 seconds depending on complexity
   - Resource-intensive operations: 15-30 seconds

3. **Handle Errors Properly**
   ```javascript
   try {
       // Your code
   } catch (error) {
       console.error('[YourHandler] Error:', error);
       await sendMsg("❌ An error occurred.", event.sender.id);
   } finally {
       cooldownManager.unlockPostback(userId);
   }
   ```

4. **Check Cooldowns Early**
   - Check cooldowns before starting any operation
   - Provide clear feedback to users

## Example: Creating a New Postback Handler

```javascript
const cooldownManager = require("../utils/cooldownManager");
const sendMessage = require("../../../page/src/sendMessage");

module.exports.config = {
    name: "Your Handler",
    author: "Your Name",
    version: "1.0",
    description: "Handles your postback events"
};

module.exports.onPostback = async function({ event }) {
    const sendMsg = sendMessage(event);
    
    try {
        // Only handle specific postback
        if (event.postback.payload !== 'your_payload') return;

        // Check cooldown
        const { canExecute, message } = await cooldownManager.checkPostbackCooldown(
            event.sender.id, 
            event.postback.payload
        );
        
        if (!canExecute) {
            await sendMsg(message, event.sender.id);
            return;
        }

        // Lock execution
        cooldownManager.lockPostback(event.sender.id, event.postback.payload);

        try {
            // Your postback handling code here
            
            // Set cooldown
            cooldownManager.setPostbackCooldown(event.sender.id, event.postback.payload, 5);
        } finally {
            // Always unlock
            cooldownManager.unlockPostback(event.sender.id);
        }
    } catch (error) {
        console.error('[YourHandler] Error:', error);
        await sendMsg("❌ An error occurred.", event.sender.id);
    }
};
```

## Debugging

The cooldown system includes detailed logging. You can track:
- When cooldowns are set
- When locks are applied/removed
- Remaining cooldown times
- Lock states

Check your console for messages like:
```
[CooldownManager] User 123456 is locked with postback: shoti
[CooldownManager] Set cooldown for user 123456, postback shoti: 10s
[CooldownManager] Unlocked postback shoti for user 123456
``` 