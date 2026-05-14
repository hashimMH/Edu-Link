const { AccessToken } = require('livekit-server-sdk');
const db = require('../config/database');
const livekitConfig = require('../config/livekit');
const ApiError = require('../utils/ApiError');

/**
 * Generate a LiveKit JWT token for a user to join a video room.
 *
 * Token includes:
 * - Room name (based on appointment/class ID)
 * - Participant identity (user ID + name)
 * - Role-based permissions (teacher can publish, student can publish)
 * - Metadata (display name, role)
 */
const livekitController = {
  /**
   * POST /api/livekit/token
   * Body: { roomName, participantName? }
   * Authenticated user gets a token scoped to that room.
   */
  async getToken(req, res, next) {
    try {
      // Validate LiveKit is configured
      if (!livekitConfig.apiKey || !livekitConfig.apiSecret || !livekitConfig.wsUrl) {
        throw ApiError.internal('LiveKit is not configured on the server');
      }

      const { roomName } = req.body;
      if (!roomName) {
        throw ApiError.badRequest('roomName is required');
      }

      const user = db.prepare(
        'SELECT first_name, last_name, role FROM users WHERE id = ?'
      ).get(req.user.id);

      if (!user) {
        throw ApiError.notFound('User not found');
      }

      const participantName = req.body.participantName ||
        `${user.first_name} ${user.last_name}`;
      const identity = `${req.user.id}__${participantName.replace(/\s+/g, '_')}`;

      // Create token with proper permissions
      const token = new AccessToken(
        livekitConfig.apiKey,
        livekitConfig.apiSecret,
        {
          identity,
          name: participantName,
          // Token expires in 6 hours (max lesson duration)
          ttl: '6h',
        }
      );

      // Everyone can publish audio/video (both teacher and student)
      token.addGrant({
        roomJoin: true,
        room: roomName,
        canPublish: true,
        canSubscribe: true,
        // Only teachers can publish data (screen share, chat)
        canPublishData: user.role === 'teacher',
      });

      // Attach metadata for display
      token.metadata = JSON.stringify({
        name: participantName,
        role: user.role,
        userId: req.user.id,
      });

      const jwt = await token.toJwt();

      res.json({
        success: true,
        data: {
          token: jwt,
          identity,
          roomName,
          wsUrl: livekitConfig.wsUrl,
          participantName,
          role: user.role,
        },
      });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = livekitController;
