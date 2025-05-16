const axios = require("axios");
const sendMessage = require("../../../page/src/sendMessage");
const sendTypingIndicator = require("../../../page/src/sendTypingIndicator");
const sendAttachment = require("../../../page/src/sendAttachment");

// Store user data temporarily
const userData = new Map();

// Collage API URL
const COLLAGE_API_URL = "https://jihyocollage.onrender.com/api/create-collage";

module.exports.config = {
  name: "igstalk",
  author: "PageBot",
  version: "1.0",
  description: "Fetch Instagram profile, stories, and posts",
  category: "social",
  cooldown: 5 ,
  usePrefix: true,
  adminOnly: false
};

module.exports.run = async function({ event, args }) {
  try {
    // Initialize API functions with event
    const sendMsg = sendMessage(event);
    const typingIndicator = sendTypingIndicator(event);
    const sendAttach = sendAttachment(event);

    // Check if command was used correctly
    if (!args || args.length === 0) {
      await sendMsg(`Please provide an Instagram username.\nExample: ${module.exports.config.name} username`, event.sender.id);
      return;
    }

    const username = args[0].trim();
    console.log(`[IGStalk] Starting request for username: ${username}`);

    // Show typing indicator
    await typingIndicator(true, event.sender.id);

    // Initial processing message
    await sendMsg(`🔍 Searching for Instagram profile: @${username}...`, event.sender.id);

    console.log(`[IGStalk] Fetching data from local API for ${username}`);
    const { data } = await axios.get(`https://finalig-4r3d.onrender.com/api/instagram/${username}`);
    console.log('[IGStalk] Received data from local API');

    if (!data.profile) {
      console.log(`[IGStalk] No profile found for ${username}`);
      await sendMsg(`No profile found for "${username}".`, event.sender.id);
      return;
    }

    const { profile, stories, posts } = data;

    // Store the data for later use
    userData.set(event.sender.id, { stories, posts });

    // Send profile info
    const profileInfo = `
📷 Instagram Profile: @${profile.username}
👤 Name: ${profile.full_name}
📝 Bio: ${profile.bio || 'No bio'}
👥 Followers: ${profile.followers.toLocaleString()}
🫂 Following: ${profile.following.toLocaleString()}
📮 Posts: ${profile.posts_count.toLocaleString()}
🔒 Private: ${profile.is_private ? 'Yes' : 'No'}
    `.trim();

    console.log('[IGStalk] Sending profile info');
    await sendMsg(profileInfo, event.sender.id);

    // Create media template with buttons
    const form = {
      recipient: { id: event.sender.id },
      message: {
        attachment: {
          type: 'template',
          payload: {
            template_type: 'generic',
            elements: [
              {
                title: `@${profile.username}'s Instagram`,
                subtitle: 'What would you like to view?',
                image_url: profile.profile_pic,
                buttons: [
                  {
                    type: 'postback',
                    title: '📖 Stories',
                    payload: `igstalk_stories_${username}`
                  },
                  {
                    type: 'postback',
                    title: '📮 Posts',
                    payload: `igstalk_posts_${username}`
                  }
                ]
              }
            ]
          }
        }
      },
      messaging_type: "RESPONSE"
    };

    // Send the template using axios
    await axios.post(
      `https://graph.facebook.com/v22.0/me/messages`,
      form,
      {
        params: {
          access_token: PAGE_ACCESS_TOKEN
        }
      }
    );

    // Stop typing indicator
    await typingIndicator(false, event.sender.id);

  } catch (error) {
    console.error('[IGStalk] Error:', error);
    let errorMsg = 'Failed to fetch Instagram data.';
    if (error.response?.status === 404) {
      errorMsg = `User @${args[0]} not found or private.`;
    }
    const sendMsg = sendMessage(event);
    await sendMsg(errorMsg, event.sender.id);
  }
};

// Function to handle stories
async function handleStories(stories, event, sendMsg, sendAttach) {
  if (stories?.count > 0) {
    console.log(`[IGStalk] Found ${stories.count} stories`);
    await sendMsg(`📖 Found ${stories.count} stories:`, event.sender.id);
    for (const story of stories.items) {
      const type = story.type === 'video' ? 'video' : 'image';
      console.log(`[IGStalk] Sending story (${type})`);
      await sendAttach(type, story.url, event.sender.id);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  } else {
    console.log('[IGStalk] No stories found');
    await sendMsg('No stories available.', event.sender.id);
  }
}

// Function to handle posts
async function handlePosts(posts, event, sendMsg, sendAttach) {
  if (posts?.count > 0) {
    console.log(`[IGStalk] Found ${posts.count} posts`);
    await sendMsg(`📮 Found ${posts.count} posts:`, event.sender.id);

    let processedCount = 0;
    const totalPosts = posts.items.length;

    for (const post of posts.items) {
      processedCount++;
      console.log(`[IGStalk] Processing post ${processedCount}/${totalPosts}`);
      
      if (processedCount % 10 === 0) {
        await sendMsg(`⏳ Processed ${processedCount}/${totalPosts} posts...`, event.sender.id);
      }

      if (post.is_carousel && post.media.length > 1) {
        console.log('[IGStalk] Handling carousel post');
        await handleCarouselPost(post, event, sendAttach);
      } else if (post.media.length > 0) {
        const media = post.media[0];
        console.log(`[IGStalk] Sending single ${media.type}`);
        await sendAttach(media.type === 'video' ? 'video' : 'image', media.url, event.sender.id);
      }

      const postInfo = `
📝 ${post.caption || 'No caption'}
❤️ ${post.like_count.toLocaleString()} likes | 💬 ${post.comment_count.toLocaleString()} comments
🕒 ${new Date(post.timestamp * 1000).toLocaleString()}
      `.trim();

      console.log('[IGStalk] Sending post info');
      await sendMsg(postInfo, event.sender.id);

      await new Promise(resolve => setTimeout(resolve, 1500));
    }
  } else {
    console.log('[IGStalk] No posts found');
    await sendMsg('No posts available.', event.sender.id);
  }
}

async function handleCarouselPost(post, event, sendAttach) {
  console.log(`[IGStalk] Starting carousel handling for post with ${post.media.length} items`);
  
  try {
    const videos = post.media.filter(media => media.type === 'video');
    const images = post.media.filter(media => media.type === 'image');
    
    console.log(`[IGStalk] Found ${videos.length} videos and ${images.length} images in carousel`);

    // Send videos first
    for (const video of videos) {
      console.log('[IGStalk] Sending video from carousel');
      await sendAttach('video', video.url, event.sender.id);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Handle images
    if (images.length > 0) {
      if (images.length > 1) {
        console.log('[IGStalk] Creating collage of images');
        try {
          // Create collage of all images
          const collageResponse = await axios.post(COLLAGE_API_URL, {
            urls: images.map(img => img.url)
          });

          if (collageResponse.data.success && collageResponse.data.collage_url) {
            console.log('[IGStalk] Sending collage');
            await sendAttach('image', collageResponse.data.collage_url, event.sender.id);
          } else {
            throw new Error('Collage API returned unsuccessful response');
          }
        } catch (collageError) {
          console.error('[IGStalk] Collage creation failed, falling back to individual images:', collageError);
          // Fallback to sending individual images
          for (const image of images) {
            await sendAttach('image', image.url, event.sender.id);
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      } else {
        // Single image case
        console.log('[IGStalk] Sending single image');
        await sendAttach('image', images[0].url, event.sender.id);
      }
    }

  } catch (error) {
    console.error('[IGStalk] Error handling carousel, full fallback:', error);
    
    // Full fallback - send each media item individually
    for (const media of post.media) {
      try {
        console.log(`[IGStalk] Fallback sending ${media.type}`);
        await sendAttach(media.type === 'video' ? 'video' : 'image', media.url, event.sender.id);
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (mediaError) {
        console.error('[IGStalk] Error sending media item:', mediaError);
      }
    }
  }
}

// Export the userData map and handler functions for use in the postback handler
module.exports.userData = userData;
module.exports.handleStories = handleStories;
module.exports.handlePosts = handlePosts; 