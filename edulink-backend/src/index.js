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

const app = express();
const server = http.createServer(app);

// --- Socket.IO ---
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

setIO(io);
socketHandler.init(io);

// --- Security ---
app.use(helmet());
app.use(cors({
  origin: env.CORS_ORIGINS,
  credentials: true,
}));
app.use(generalLimiter);

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

module.exports = app;
