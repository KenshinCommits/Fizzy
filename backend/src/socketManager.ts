import { Server } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { logger } from './config/logger.js';
import { config } from './config/index.js';

let io: Server;

export const initializeSocket = (server: HTTPServer) => {
  io = new Server(server, {
    cors: {
      origin: (origin, callback) => callback(null, !origin || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) || origin === config.cors.origin),
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    socket.on('join_room', (roomId: string) => {
      socket.join(roomId);
      logger.info(`Socket ${socket.id} joined room ${roomId}`);
    });

    socket.on('leave_room', (roomId: string) => {
      socket.leave(roomId);
      logger.info(`Socket ${socket.id} left room ${roomId}`);
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  logger.info('Socket.IO initialized');
  return io;
};

export const emitEvent = (eventType: string, data: any) => {
  if (io) {
    io.emit(eventType, data);
    logger.debug(`Event emitted: ${eventType}`, data);
  }
};

export const emitToRoom = (roomId: string, eventType: string, data: any) => {
  if (io) {
    io.to(roomId).emit(eventType, data);
    logger.debug(`Event emitted to room ${roomId}: ${eventType}`, data);
  }
};

export const getIO = () => io;
