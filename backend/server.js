const http = require('http');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const config = require('./src/config/env');
const healthRoutes = require('./src/routes/healthRoutes');
const authRoutes = require('./src/routes/authRoutes');
const appointmentRoutes = require('./src/routes/appointmentRoutes');
const callRoutes = require('./src/routes/callRoutes');
const { errorHandler, notFoundHandler } = require('./src/middleware/errorHandler');
const { initSocketServer } = require('./src/sockets');

const app = express();
const server = http.createServer(app);

// Global Middlewares
app.use(cors({
  origin: config.clientUrl,
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (config.env !== 'test') {
  app.use(morgan('dev'));
}

// Mount Routes
app.use(config.apiPrefix, healthRoutes);
app.use(`${config.apiPrefix}/auth`, authRoutes);
app.use(`${config.apiPrefix}/appointments`, appointmentRoutes);
app.use(`${config.apiPrefix}/calls`, callRoutes);

// Fallback Handlers
app.use(notFoundHandler);
app.use(errorHandler);

// Initialize Socket.IO engine
const io = initSocketServer(server);

// Start Server if executing directly
if (require.main === module) {
  server.listen(config.port, () => {
    console.log(`==================================================`);
    console.log(`🚀 NeerajPharma Backend Server Running on Port ${config.port}`);
    console.log(`⚡ Socket.IO Engine Attached & Authenticated`);
    console.log(`🌐 Environment: ${config.env}`);
    console.log(`🔗 Health Check: http://localhost:${config.port}${config.apiPrefix}/health`);
    console.log(`==================================================`);
  });

  process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection Error:', err);
  });
}

module.exports = app;
module.exports.app = app;
module.exports.server = server;
module.exports.io = io;

