import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/fizzi',
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:5173',
    adminUrl: process.env.ADMIN_FRONTEND_URL || 'http://localhost:5173',
    publicApiUrl: process.env.PUBLIC_API_URL || 'http://localhost:5000'
  },
  retell: {
    apiKey: process.env.RETELL_API_KEY || '',
    agentId: process.env.RETELL_AGENT_ID || '',
    webhookSecret: process.env.RETELL_WEBHOOK_SECRET || ''
  },
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    phoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
    retellFromNumber: process.env.RETELL_FROM_NUMBER || ''
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173'
  },
  session: {
    secret: process.env.SESSION_SECRET || 'session-secret-change-me'
  }
};
