import http from 'http';
import app from './app.js';
import { config } from './config/index.js';
import { connectDatabase } from './config/database.js';
import { logger } from './config/logger.js';
import { initializeSocket } from './realtime/socketManager.js';
import { scoringService } from './services/scoringService.js';

const server = http.createServer(app);

// Initialize Socket.IO
initializeSocket(server);

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDatabase();
    
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
