# PageBot Project Documentation

## Overview
PageBot is a Facebook Messenger bot framework that provides a structured way to handle commands, events, and interactions. The project is organized into modules and follows a specific architecture for handling different types of events and commands.

## Project Structure

```
PageBot/
├── config.json           # Bot configuration (PAGE_ACCESS_TOKEN, ADMINS, etc.)
├── modules/
│   └── scripts/
│       ├── commands/     # Command modules
│       └── events/       # Event handlers
├── page/
│   ├── handler.js        # Main command handler
│   ├── main.js          # Core bot initialization
│   └── src/             # Core API functions
└── webhook.js           # Webhook listener
```

## Core Components

### 1. Command System
Commands are user-triggered actions that require specific keywords or prefixes.

#### Command Structure
```javascript
module.exports.config = {
  name: "commandName",
  author: "Author",
  version: "1.0",
  description: "Command description",
  category: "category",
  cooldown: 5,           // Cooldown in seconds
  usePrefix: true,       // Whether command needs prefix
  adminOnly: false       // Whether only admins can use
};

module.exports.run = async function({ event, args }) {
  // Command implementation
};
```

### 2. Event System
Events handle background tasks and system actions without requiring specific user input.

#### Event Structure
```javascript
module.exports.config = {
  name: "Event Name",
  author: "Author",
  version: "1.0",
  description: "Event description",
  selfListen: false      // Whether to handle bot's own messages
};

module.exports.run = async function({ event }) {
  // Event handler implementation
};
```

### 3. Core API Functions
Located in `page/src/`, these are the main functions for interacting with Facebook's API:

- `sendMessage`: Send text messages
- `sendAttachment`: Send media (images, videos)
- `sendButton`: Send interactive buttons
- `sendTypingIndicator`: Show/hide typing indicator
- `markAsSeen`: Mark messages as seen
- `setMessageReaction`: Add reactions to messages
- `graph`: Direct Graph API calls

### 4. Event Types
The system handles various event types:
- `message`: Regular text messages
- `postback`: Button clicks
- `message_reply`: Reply to messages
- `attachments`: Media attachments
- `message_reaction`: Message reactions
- `mark_as_read`: Message read receipts
- `mark_as_delivered`: Message delivery receipts

## Key Concepts

### 1. Message Handling
Messages are processed through the webhook listener (`webhook.js`), which:
- Validates incoming events
- Caches message data
- Routes events to appropriate handlers
- Maintains message context for replies and reactions

### 2. Command Processing
Commands are processed in `handler.js`:
- Extracts command name and arguments
- Checks cooldowns
- Validates admin status
- Executes command if conditions are met

### 3. Event Processing
Events are processed automatically:
- System events (read receipts, typing indicators)
- User interactions (reactions, postbacks)
- Background tasks

### 4. Data Storage
The system uses:
- In-memory storage for temporary data (cooldowns, user sessions)
- File-based configuration
- No permanent database (stateless design)

## API Usage Examples

### Sending Messages
```javascript
const sendMsg = sendMessage(event);
await sendMsg("Hello!", event.sender.id);
```

### Sending Attachments
```javascript
const sendAttach = sendAttachment(event);
await sendAttach('image', imageUrl, event.sender.id);
```

### Sending Buttons
```javascript
const buttons = [
  {
    type: 'postback',
    title: 'Click Me',
    payload: 'BUTTON_1'
  },
  {
    type: 'web_url',
    title: 'Visit Website',
    url: 'https://example.com'
  }
];
await sendButton("Choose an option:", buttons, event.sender.id);
```

### Handling Postbacks
```javascript
if (event.type === 'postback') {
  const payload = event.postback.payload;
  // Handle postback
}
```

## Best Practices

1. **Error Handling**
   - Always use try-catch blocks
   - Provide user-friendly error messages
   - Log errors for debugging

2. **Cooldowns**
   - Implement cooldowns for resource-intensive commands
   - Use the built-in cooldown system

3. **Message Formatting**
   - Use emojis for better readability
   - Format numbers with `toLocaleString()`
   - Use template literals for complex messages

4. **Media Handling**
   - Check media types before sending
   - Implement fallbacks for failed media sends
   - Use appropriate delays between media sends

5. **Session Management**
   - Store temporary data in memory
   - Clear data when sessions expire
   - Handle expired sessions gracefully

## Common Patterns

### 1. Command with Cooldown
```javascript
module.exports.config = {
  name: "example",
  cooldown: 5,
  usePrefix: true
};

module.exports.run = async function({ event, args }) {
  const sendMsg = sendMessage(event);
  const typingIndicator = sendTypingIndicator(event);
  
  try {
    await typingIndicator(true, event.sender.id);
    // Command logic
    await typingIndicator(false, event.sender.id);
  } catch (error) {
    console.error('Error:', error);
    await sendMsg('An error occurred.', event.sender.id);
  }
};
```

### 2. Event Handler
```javascript
module.exports.config = {
  name: "example",
  selfListen: false
};

module.exports.run = async function({ event }) {
  if (event.type !== 'message') return;
  // Event handling logic
};
```

### 3. Media Template
```javascript
const form = {
  recipient: { id: event.sender.id },
  message: {
    attachment: {
      type: 'template',
      payload: {
        template_type: 'generic',
        elements: [{
          title: 'Title',
          subtitle: 'Subtitle',
          image_url: 'image_url',
          buttons: [
            {
              type: 'postback',
              title: 'Button',
              payload: 'PAYLOAD'
            }
          ]
        }]
      }
    }
  },
  messaging_type: "RESPONSE"
};
```

## Configuration

The `config.json` file contains essential settings:
```json
{
  "PAGE_ACCESS_TOKEN": "your_token",
  "ADMINS": ["admin_id1", "admin_id2"],
  "PREFIX": "!",
  "BOTNAME": "PageBot",
  "markAsSeen": true,
  "selfListen": false
}
```

## Security Considerations

1. **Access Control**
   - Use `adminOnly` for sensitive commands
   - Validate user permissions
   - Protect admin-only features

2. **API Security**
   - Keep PAGE_ACCESS_TOKEN secure
   - Validate webhook requests
   - Handle API rate limits

3. **Data Protection**
   - Don't store sensitive data
   - Clear temporary data
   - Handle user data responsibly

## Troubleshooting

Common issues and solutions:
1. **Command not working**
   - Check command name and prefix
   - Verify cooldown status
   - Check admin permissions

2. **Media not sending**
   - Verify media URLs
   - Check file size limits
   - Implement proper error handling

3. **Postbacks not working**
   - Verify payload format
   - Check event handler
   - Ensure proper button configuration

## Contributing

When adding new features:
1. Follow the existing code structure
2. Implement proper error handling
3. Add appropriate logging
4. Update documentation
5. Test thoroughly

## Conclusion

This framework provides a robust foundation for building Facebook Messenger bots. Understanding these concepts and patterns will help in creating reliable and maintainable bot applications. 