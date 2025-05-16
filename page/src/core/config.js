// Configuration management
const config = {
  pageAccessToken: process.env.PAGE_ACCESS_TOKEN,
  
  // Validate required configuration
  validate() {
    if (!this.pageAccessToken) {
      throw new Error('PAGE_ACCESS_TOKEN is required but not set');
    }
  }
};

module.exports = config; 