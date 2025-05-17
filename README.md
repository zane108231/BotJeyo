# PageBot - Facebook Messenger Bot Framework

## Table of Contents
1. [Overview](#overview)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Development Guide](#development-guide)
5. [Adding New Features](#adding-new-features)
6. [Cooldown System](#cooldown-system)
7. [Event Handling](#event-handling)
8. [Command System](#command-system)
9. [Utility Functions](#utility-functions)
10. [Best Practices](#best-practices)
11. [Troubleshooting](#troubleshooting)

## Overview
PageBot is a modular Facebook Messenger bot framework designed for easy extensibility and maintenance. The framework follows a clean architecture pattern with clear separation of concerns between different components.

## Project Structure
```
├── modules/
│   ├── scripts/
│   │   ├── commands/     # Command implementations
│   │   ├── events/       # Event handlers
│   │   ├── utils/        # Utility functions
│   │   └── data/         # Data storage
│   └── utils.js          # Global utilities
├── page/
│   ├── src/             # Core bot functionality
│   └── state.js         # State management
├── docs/                # Documentation
├── logs/               # Log files
└── config.json         # Configuration
```

## Core Components

### 1. Command System
Commands are implemented in `modules/scripts/commands/`. Each command file should:
- Export a `config` object with metadata
- Implement a `run` function for command execution
- Use the cooldown system for rate limiting
- Handle errors appropriately

Example command structure:
```javascript
module.exports.config = {
    name: "Command Name",
    author: "Author",
    version: "1.0",
    description: "Description"
};

module.exports.run = async function({ event, args }) {
    // Command implementation
};
```

### 2. Event System
Events are handled in `modules/scripts/events/`. Each event handler should:
- Export a `config` object
- Implement `run` for message events
- Implement `onPostback` for postback events
- Use the cooldown system
- Handle typing indicators properly

Example event handler:
```javascript
module.exports.config = {
    name: "Event Handler",
    author: "Author",
    version: "1.0",
    description: "Description"
};

module.exports.run = async function({ event }) {
    // Handle message events
};

module.exports.onPostback = async function({ event }) {
    // Handle postback events
};
```

### 3. Cooldown System
The cooldown system is managed by `cooldownManager.js` and provides:
- Command cooldowns
- Postback cooldowns
- Lock/unlock mechanisms
- User-specific cooldowns

Usage:
```javascript
const cooldownManager = require("../utils/cooldownManager");

// Check cooldown
const { canExecute, message } = cooldownManager.checkCommandCooldown(userId, command);
if (!canExecute) {
    return message;
}

// Set cooldown
cooldownManager.setCommandCooldown(userId, command, duration);
```

## Development Guide

### Adding New Commands
1. Create a new file in `modules/scripts/commands/`
2. Implement the required structure
3. Use the cooldown system
4. Add error handling
5. Test thoroughly

### Adding New Event Handlers
1. Create a new file in `modules/scripts/events/`
2. Implement required functions
3. Use typing indicators
4. Handle errors
5. Test with different event types

### Best Practices
1. Always use the cooldown system
2. Implement proper error handling
3. Use typing indicators for long operations
4. Clean up resources in finally blocks
5. Log important events and errors
6. Use async/await properly
7. Handle all possible edge cases

## Utility Functions

### Message Sending
```javascript
const sendMessage = require("../../../page/src/sendMessage");
const sendTypingIndicator = require("../../../page/src/sendTypingIndicator");
const sendAttachment = require("../../../page/src/sendAttachment");

// Usage
const sendMsg = sendMessage(event);
const typingIndicator = sendTypingIndicator(event);
const sendAttach = sendAttachment(event);

await sendMsg("Message", userId);
await typingIndicator(true, userId);
await sendAttach('type', url, userId);
```

### State Management
```javascript
const stateManager = require("../utils/stateManager");

// Store data
stateManager.setUserData(userId, data);

// Retrieve data
const data = stateManager.getUserData(userId);
```

## Troubleshooting

### Common Issues
1. **Cooldown Errors**
   - Check if cooldown is properly set
   - Verify user ID is correct
   - Check for proper lock/unlock

2. **Event Handling Issues**
   - Verify event type
   - Check payload format
   - Ensure proper error handling

3. **Message Sending Problems**
   - Check message format
   - Verify user ID
   - Handle rate limits

### Debugging
1. Use console.log for debugging
2. Check logs directory
3. Verify event payloads
4. Test with different user IDs

## Contributing
1. Follow the established patterns
2. Add proper documentation
3. Include error handling
4. Test thoroughly
5. Use the cooldown system
6. Follow best practices

## License
See LICENSE.md for details.

---

<div align="center">
  <h3>Try my Bot!</h3>
  <p>Try Peko, a Facebook Pagebot assistant.<br>Just click the image below to start chatting!</p>
  <a href="https://m.me/pekoai" target="_blank">
    <img src="https://i.ibb.co/qkTCVv9/circle.png" alt="Peko Bot" width="80"/>
  </a>
</div>

---

### License

Pagebot is released under the [MIT License](LICENSE), making it free to use, modify, and distribute under the terms of this open-source license.

*Created on November 8, 2024*  