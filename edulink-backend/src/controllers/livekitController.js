const { AccessToken } = require('livekit-server-sdk');
const pool = require('../config/database');
const livekitConfig = require('../config/livekit');
const ApiError = require('../utils/ApiError');

const livekitController = {
  /** POST /api/livekit/token */
  async getToken(req, res, next) {
    try {
      if (!livekitConfig.apiKey || !livekitConfig.apiSecret || !livekitConfig.wsUrl) {
        throw ApiError.internal('LiveKit is not configured on the server');
      }

      const { roomName } = req.body;
      if (!roomName) throw ApiError.badRequest('roomName is required');

      const r = await pool.query(
        'SELECT first_name, last_name, role FROM users WHERE id = $1',
        [req.user.id]
      );
      const user = r.rows[0];

      if (!user) throw ApiError.notFound('User not found');

      const participantName = req.body.participantName || `${user.first_name} ${user.last_name}`;
      const identity = `${req.user.id}__${participantName.replace(/\s+/g, '_')}`;

      const token = new AccessToken(
        livekitConfig.apiKey,
        livekitConfig.apiSecret,
        { identity, name: participantName, ttl: '6h' }
      );

      token.addGrant({
        roomJoin: true,
        room: roomName,
        canPublish: true,
        canSubscribe: true,
        canPublishData: user.role === 'teacher',
      });

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
