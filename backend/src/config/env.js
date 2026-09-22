const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  apiPrefix: process.env.API_PREFIX || '/api',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET || 'fallback-secret-for-dev',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10),
  callTimeoutSeconds: parseInt(process.env.CALL_TIMEOUT_SECONDS || '30', 10),
  stunServer: process.env.STUN_SERVER || 'stun:stun.l.google.com:19302',
  turnServer: process.env.TURN_SERVER || '',
  turnUsername: process.env.TURN_USERNAME || '',
  turnPassword: process.env.TURN_PASSWORD || '',
};
