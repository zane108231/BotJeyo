# PageBot AI Implementation Guide

## Core Architecture Understanding

### 1. Command Structure
Every command in PageBot follows this exact structure:
```javascript
const axios = require("axios");
const sendMessage = require("../../../page/src/sendMessage");
const sendTypingIndicator = require("../../../page/src/sendTypingIndicator");
const sendAttachment = require("../../../page/src/sendAttachment");

module.exports.config = {
  name: "commandName",
  author: "PageBot",
  version: "1.0",
  description: "Command description",
  category: "category",
  cooldown: 5,
  usePrefix: true,
  adminOnly: false
};

module.exports.run = async function({ event, args }) {
  // Command implementation
};
```

### 2. Core API Functions
Always use these core functions from `page/src/`:
- `sendMessage(event)`: Returns a function to send text messages
- `sendTypingIndicator(event)`: Returns a function to show/hide typing indicator
- `sendAttachment(event)`: Returns a function to send media (images/videos)

Usage pattern:
```javascript
const sendMsg = sendMessage(event);
const typingIndicator = sendTypingIndicator(event);
const sendAttach = sendAttachment(event);

// Send message
await sendMsg("Message text", event.sender.id);

// Show/hide typing
await typingIndicator(true, event.sender.id);
await typingIndicator(false, event.sender.id);

// Send media
await sendAttach('video', videoUrl, event.sender.id);
await sendAttach('image', imageUrl, event.sender.id);
```

### 3. Event Object Structure
The `event` object contains:
```javascript
{
  sender: {
    id: "user_id"  // Always use this for sending messages
  },
  type: "message" | "postback" | "message_reply",
  message: {
    text: "message text",
    // other message properties
  },
  postback: {
    payload: "button_payload"
  }
}
```

### 4. Command Implementation Patterns

#### Basic Command Pattern
```javascript
module.exports.run = async function({ event, args }) {
  try {
    const sendMsg = sendMessage(event);
    const typingIndicator = sendTypingIndicator(event);

    // Show typing
    await typingIndicator(true, event.sender.id);

    // Command logic here
    await sendMsg("Response", event.sender.id);

    // Hide typing
    await typingIndicator(false, event.sender.id);
  } catch (error) {
    console.error('Error:', error);
    const sendMsg = sendMessage(event);
    await sendMsg("Error message", event.sender.id);
  }
};
```

#### Media Handling Pattern
```javascript
module.exports.run = async function({ event, args }) {
  try {
    const sendMsg = sendMessage(event);
    const typingIndicator = sendTypingIndicator(event);
    const sendAttach = sendAttachment(event);

    await typingIndicator(true, event.sender.id);
    
    // Send info message
    await sendMsg("Info message", event.sender.id);
    
    // Send media
    await sendAttach('video', mediaUrl, event.sender.id);
    
    await typingIndicator(false, event.sender.id);
  } catch (error) {
    console.error('Error:', error);
    const sendMsg = sendMessage(event);
    await sendMsg("Error message", event.sender.id);
  }
};
```

### 5. Button and Template Implementation

#### Generic Template
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

await axios.post(
  `https://graph.facebook.com/v22.0/me/messages`,
  form,
  {
    params: {
      access_token: PAGE_ACCESS_TOKEN
    }
  }
);
```

#### Media Template
```javascript
const form = {
  recipient: { id: event.sender.id },
  message: {
    attachment: {
      type: 'template',
      payload: {
        template_type: 'media',
        elements: [{
          media_type: 'video',
          attachment_id: attachmentId,
          buttons: [
            {
              type: 'web_url',
              url: 'url',
              title: 'Button'
            }
          ]
        }]
      }
    }
  },
  messaging_type: "RESPONSE"
};
```

### 6. Error Handling Best Practices

1. Always use try-catch blocks
2. Initialize sendMessage in catch block
3. Log errors with console.error
4. Send user-friendly error messages
5. Include error context in logs

```javascript
try {
  // Command logic
} catch (error) {
  console.error('❌ Error in command:', error);
  const sendMsg = sendMessage(event);
  await sendMsg("❌ Error: User-friendly message", event.sender.id);
}
```

### 7. User Experience Guidelines

1. Always show typing indicator during processing
2. Use emojis for better readability
3. Format numbers with toLocaleString()
4. Provide clear error messages
5. Include usage examples in help messages

### 8. Media Processing Guidelines

1. Validate URLs before processing
2. Check media types before sending
3. Use appropriate delays between media sends
4. Handle failed media sends gracefully
5. Provide fallback options

### 9. Command Categories

- entertainment: Fun and media-related commands
- social: Social media interaction commands
- utility: Utility and helper commands
- admin: Administrative commands

### 10. Configuration Options

```javascript
module.exports.config = {
  name: "commandName",      // Command name
  author: "PageBot",        // Author name
  version: "1.0",          // Version number
  description: "Description", // Command description
  category: "category",     // Command category
  cooldown: 5,             // Cooldown in seconds
  usePrefix: true,         // Whether command needs prefix
  adminOnly: false         // Whether only admins can use
};
```

## Implementation Checklist

When creating new commands, ensure:

1. ✅ Proper module structure
2. ✅ Correct API function imports
3. ✅ Typing indicator implementation
4. ✅ Error handling
5. ✅ User-friendly messages
6. ✅ Proper media handling
7. ✅ Button/template implementation if needed
8. ✅ Proper event object usage
9. ✅ Correct message targeting
10. ✅ Appropriate cooldown setting

## Common Pitfalls to Avoid

1. ❌ Not using typing indicators
2. ❌ Missing error handling
3. ❌ Incorrect event object usage
4. ❌ Not checking args before use
5. ❌ Missing proper message targeting
6. ❌ Not handling media errors
7. ❌ Missing proper API function initialization
8. ❌ Not following the command structure
9. ❌ Incorrect button/template structure
10. ❌ Not using proper message formatting

## Testing Guidelines

1. Test command with no arguments
2. Test with invalid arguments
3. Test with valid arguments
4. Test error handling
5. Test media sending
6. Test button functionality
7. Test typing indicators
8. Test cooldown functionality
9. Test admin-only restrictions
10. Test prefix requirements

This guide should help AIs understand and implement commands correctly in the PageBot framework. Always refer to this guide when creating new commands or modifying existing ones. 