import http from 'http';
import app from './app.js';
import { config } from './config/index.js';
import { connectDatabase } from './config/database.js';
import { logger } from './config/logger.js';
import { initializeSocket } from './realtime/socketManager.js';
import { scoringService } from './services/scoringService.js';
import { User } from './models/User.js';

const server = http.createServer(app);

async function ensureDemoAdmin() {
  const email = config.demoAdmin.email.toLowerCase();
  const existing = await User.findOne({ email });
  if (existing) {
    if (existing.role !== 'super_admin' || existing.customerType !== 'b2b' || !existing.isActive) {
      existing.role = 'super_admin';
      existing.customerType = 'b2b';
      existing.isActive = true;
      await existing.save();
    }
    return;
  }

  await User.create({
    email,
    password: config.demoAdmin.password,
    firstName: 'Demo',
    lastName: 'Admin',
    role: 'super_admin',
    customerType: 'b2b',
    isActive: true,
  });
  logger.info('Demo admin account is ready');
}

// Initialize Socket.IO
initializeSocket(server);

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDatabase();
    await ensureDemoAdmin();
    
    // Initialize scoring service
    await scoringService.initialize();
    
    // Start listening
    server.listen(config.port, () => {
      logger.info(`🚀 Fizzi Backend running on port ${config.port}`);
      logger.info(`Environment: ${config.nodeEnv}`);
      logger.info(`Frontend URL: ${config.frontend.url}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

startServer();
