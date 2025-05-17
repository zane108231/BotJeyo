const axios = require('axios');

// API endpoints
const API_ENDPOINTS = {
  SHOTI: 'https://betadash-shoti-yazky.vercel.app/shotizxx',
  YOUTUBE_DL: 'https://haji-mix-api.gleeze.com/api/autodl',
  INSTAGRAM: 'https://finalig-4r3d.onrender.com/api/instagram',
  COLLAGE: 'https://jihyoapi-1.onrender.com/api/collage',
  TIKTOK: 'https://jihyoapi-1.onrender.com/api/tiktok/search',
  AI_MODELS: {
    LUZIA: 'https://betadash-api-swordslush-production.up.railway.app/luzia',
    QWEN: 'https://betadash-api-swordslush-production.up.railway.app/qwen',
    BLACKBOX: 'https://betadash-api-swordslush-production.up.railway.app/blackbox-pro',
    GPT4: 'https://betadash-api-swordslush-production.up.railway.app/gpt4',
    DEEPSEEK: 'https://betadash-api-swordslush-production.up.railway.app/Deepseek-V3',
    META: 'https://betadash-api-swordslush-production.up.railway.app/Llama90b',
    PANDA: 'https://betadash-api-swordslush-production.up.railway.app/panda',
    PHI: 'https://betadash-api-swordslush-production.up.railway.app/phi',
    GOODY: 'https://betadash-api-swordslush-production.up.railway.app/goody',
    GIZ: 'https://betadash-api-swordslush-production.up.railway.app/giz'
  }
};

// API keys
const API_KEYS = {
  SHOTI: 'shipazu'
};

class API {
  static async getShotiVideo() {
    const response = await axios.get(`${API_ENDPOINTS.SHOTI}?apikey=${API_KEYS.SHOTI}`);
    return response.data;
  }

  static async downloadYouTubeVideo(videoId) {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const response = await axios.get(`${API_ENDPOINTS.YOUTUBE_DL}?url=${encodeURIComponent(url)}&stream=true`);
    return response.data;
  }

  static async getInstagramProfile(username) {
    const response = await axios.get(`${API_ENDPOINTS.INSTAGRAM}/${username}`);
    return response.data;
  }

  static async createCollage(imageUrls) {
    const response = await axios.post(API_ENDPOINTS.COLLAGE, { urls: imageUrls });
    return response.data;
  }

  static async searchTikTok(keyword) {
    const response = await axios.get(`${API_ENDPOINTS.TIKTOK}?keyword=${encodeURIComponent(keyword)}`);
    return response.data;
  }

  static async callAIModel(modelName, message) {
    const endpoint = API_ENDPOINTS.AI_MODELS[modelName];
    if (!endpoint) {
      throw new Error(`Unknown AI model: ${modelName}`);
    }
    const response = await axios.get(`${endpoint}?ask=${encodeURIComponent(message)}`);
    return response.data;
  }
}

module.exports = API;