const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const config = require('./src/config/env');
const healthRoutes = require('./src/routes/healthRoutes');
const authRoutes = require('./src/routes/authRoutes');
const appointmentRoutes = require('./src/routes/appointmentRoutes');
const { errorHandler, notFoundHandler } = require('./src/middleware/errorHandler');

const app = express();

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

// Fallback Handlers
app.use(notFoundHandler);
app.use(errorHandler);

// Start Server if executing directly
if (require.main === module) {
  const server = app.listen(config.port, () => {
    console.log(`==================================================`);
    console.log(`🚀 NeerajPharma Backend Server Running on Port ${config.port}`);
    console.log(`🌐 Environment: ${config.env}`);
    console.log(`🔗 Health Check: http://localhost:${config.port}${config.apiPrefix}/health`);
    console.log(`==================================================`);
  });

  process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection Error:', err);
  });
}

module.exports = app;
