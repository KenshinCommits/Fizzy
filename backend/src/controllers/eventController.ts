import { Request, Response } from 'express';
import { Event } from '../models/Event.js';
import { logger } from '../config/logger.js';
import { eventSchema } from '../validators/eventValidator.js';
import { Types } from 'mongoose';
import { scoringService } from '../services/scoringService.js';
import { leadService } from '../services/leadService.js';
import { emitEvent } from '../realtime/socketManager.js';

export class EventController {
  async createEvent(req: Request, res: Response) {
    try {
      const validatedData = eventSchema.parse(req.body);

      const eventData: any = {
        ...validatedData,
        timestamp: new Date(),
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      };

      if (validatedData.userId) {
        eventData.userId = new Types.ObjectId(validatedData.userId);
      }
      if (validatedData.productId) {
        eventData.productId = new Types.ObjectId(validatedData.productId);
      }
      if (validatedData.orderId) {
        eventData.orderId = new Types.ObjectId(validatedData.orderId);
      }

      const event = await Event.create(eventData);

      // Process scoring and lead update asynchronously
      if (eventData.userId) {
        setImmediate(async () => {
          try {
            const lead = await leadService.findOrCreateLead(eventData.userId);
            
            // Update score
            await scoringService.updateScore(
              eventData.userId,
              lead._id,
              validatedData.eventType,
              event._id,
              validatedData.metadata
            );

            // Update lead behavior
            await leadService.updateLeadBehavior(eventData.userId);

            // Emit real-time event
            emitEvent('event_created', {
              type: validatedData.eventType,
              userId: eventData.userId.toString(),
              productId: eventData.productId?.toString(),
              timestamp: event.timestamp
            });
          } catch (error) {
            logger.error('Error processing event:', error);
          }
        });
      }

      res.status(201).json({ 
        message: 'Event created',
        eventId: event._id 
      });
    } catch (error: any) {
      logger.error('Create event error:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to create event' });
    }
  }

  async getEvents(req: any, res: Response) {
    try {
      const { userId, eventType, limit = 100, skip = 0 } = req.query;

      const filter: any = {};
      if (userId) filter.userId = new Types.ObjectId(userId);
      if (eventType) filter.eventType = eventType;

      const events = await Event.find(filter)
        .sort({ timestamp: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(skip))
        .populate('userId', 'email firstName lastName')
        .populate('productId', 'name slug');

      const total = await Event.countDocuments(filter);

      res.json({ events, total, limit: parseInt(limit), skip: parseInt(skip) });
    } catch (error) {
      logger.error('Get events error:', error);
      res.status(500).json({ error: 'Failed to fetch events' });
    }
  }
}

export const eventController = new EventController();
