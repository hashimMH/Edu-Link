// LiveKit server SDK config
// Set LIVEKIT_API_KEY, LIVEKIT_API_SECRET, LIVEKIT_URL in your .env file
require('dotenv').config();

const livekitConfig = {
  apiKey: process.env.LIVEKIT_API_KEY || '',
  apiSecret: process.env.LIVEKIT_API_SECRET || '',
  wsUrl: process.env.LIVEKIT_URL || '',
};

// Validate config on load (warn, don't crash — so other endpoints still work)
if (!livekitConfig.apiKey || !livekitConfig.apiSecret || !livekitConfig.wsUrl) {
  console.warn('[LiveKit] Missing configuration. Set LIVEKIT_API_KEY, LIVEKIT_API_SECRET, LIVEKIT_URL in .env');
}

module.exports = livekitConfig;
