const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const env = require('./config/env');
const routes = require('./routes');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimiter');
const logger = require('./utils/logger');
const { setIO } = require('./config/io');
const socketHandler = require('./config/socket');
const { serveUploads } = require('./controllers/uploadController');
const pool = require('./config/database');

const app = express();
const server = http.createServer(app);

// --- Socket.IO ---
const io = new Server(server, {
  cors: {
    origin: env.CORS_ORIGINS,
    methods: ['GET', 'POST'],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

setIO(io);
socketHandler.init(io);

// --- Security ---
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
      fontSrc: ["'self'", "https:", "data:"],
    },
  },
}));
app.use(cors({
  origin: env.CORS_ORIGINS,
  credentials: true,
}));
// Rate limiting applied to API routes below, not globally

// --- Body parsing ---
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// --- Logging ---
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// --- Trust proxy ---
app.set('trust proxy', 1);

// --- Serve uploaded files ---
serveUploads(app);

// --- Password reset page (public, no auth) ---
const resetPage = require('./controllers/resetPageController');
app.get('/reset-password', resetPage.show);
app.get('/reset-success', resetPage.successPage);
app.get('/forgot-password', resetPage.forgotPage);

// --- Favicon (suppress 404 noise) ---
app.get('/favicon.ico', (req, res) => res.status(204).end());

// --- Root health check ---
const { getFirebaseAdmin } = require('./config/firebase');
app.get('/', (req, res) => {
  const fb = getFirebaseAdmin();
  res.json({
    success: true,
    message: 'EduLink API Server',
    version: '1.0.0',
    firebase: !!fb,
  });
});

// --- Routes ---
app.use('/api', routes);

// --- Error handling ---
app.use(notFound);
app.use(errorHandler);

// --- Start ---
server.listen(env.PORT, () => {
  logger.info(`EduLink API running on port ${env.PORT} in ${env.NODE_ENV} mode`);
  logger.info(`WebSocket server ready`);
  logger.info(`CORS origins: ${env.CORS_ORIGINS.join(', ')}`);
});

// --- Request timeout (30s) ---
server.timeout = 30000;

// --- Graceful shutdown ---
function shutdown(signal) {
  logger.info(`${signal} received — shutting down gracefully...`);
  server.close(async () => {
    logger.info('HTTP server closed');
    io.close(async () => {
      logger.info('Socket.IO closed');
      await pool.end();
      logger.info('PostgreSQL pool closed');
      process.exit(0);
    });
  });
  // Force exit after 10s if graceful shutdown fails
  setTimeout(() => { logger.error('Forced shutdown after timeout'); process.exit(1); }, 10000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// --- Unhandled error handlers ---
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err.message);
  logger.error(err.stack);
  process.exit(1);
});

module.exports = app;
