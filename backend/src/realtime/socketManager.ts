import { Server } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { logger } from '../config/logger.js';
import { config } from '../config/index.js';
import jwt from 'jsonwebtoken';
import { LiveClient } from 'retell-sdk/sdk/liveClient.js';

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
    let fulky: LiveClient | null = null;

    socket.on('fulky:start', async ({ token }: { token: string }) => {
      try {
        jwt.verify(token, config.jwt.secret);
        if (!config.retell.apiKey || !config.retell.agentId) throw new Error('Fulky voice is not configured on the server.');
        fulky?.close();
        fulky = new LiveClient(config.retell.apiKey, { agentId: config.retell.agentId, sampleRate: 16000 } as any);
        fulky.on('audio', (pcm: Uint8Array) => socket.emit('fulky:audio', pcm));
        fulky.on('close', () => socket.emit('fulky:state', 'ready'));
        await fulky.waitForReady();
        socket.emit('fulky:state', 'listening');
      } catch (error: any) {
        socket.emit('fulky:error', error.message || 'Fulky could not start the call.');
      }
    });
    socket.on('fulky:audio', (pcm: ArrayBuffer | Uint8Array) => fulky?.send(new Uint8Array(pcm)));
    socket.on('fulky:stop', () => { fulky?.close(); fulky = null; });

    socket.on('join_room', (roomId: string) => {
      socket.join(roomId);
      logger.info(`Socket ${socket.id} joined room ${roomId}`);
    });

    socket.on('leave_room', (roomId: string) => {
      socket.leave(roomId);
      logger.info(`Socket ${socket.id} left room ${roomId}`);
    });

    socket.on('disconnect', () => {
      fulky?.close();
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
