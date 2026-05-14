const jwt = require('jsonwebtoken');
const env = require('./env');

// Map of userId → Set of socket IDs
const userSockets = new Map();

function init(io) {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication required'));

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const uid = socket.userId;
    if (!userSockets.has(uid)) userSockets.set(uid, new Set());
    userSockets.get(uid).add(socket.id);

    console.log(`[WS] User ${uid.slice(0, 8)} connected (${userSockets.get(uid).size} sockets)`);

    // Join a personal room for targeted events
    socket.join(`user:${uid}`);

    socket.on('disconnect', () => {
      const socks = userSockets.get(uid);
      if (socks) {
        socks.delete(socket.id);
        if (socks.size === 0) userSockets.delete(uid);
      }
      console.log(`[WS] User ${uid.slice(0, 8)} disconnected`);
    });
  });

  return io;
}

// Emit to a specific user (all their sockets)
function emitToUser(userId, event, data) {
  const io = require('./io').getIO();
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
}

// Check if a user is online
function isUserOnline(userId) {
  return userSockets.has(userId) && userSockets.get(userId).size > 0;
}

// Get online count
function getOnlineCount() {
  return userSockets.size;
}

module.exports = { init, emitToUser, isUserOnline, getOnlineCount };
