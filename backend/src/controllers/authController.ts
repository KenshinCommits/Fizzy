import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Event } from '../models/Event.js';
import { config } from '../config/index.js';
import { logger } from '../config/logger.js';
import { registerSchema, loginSchema } from '../validators/authValidator.js';
import { leadService } from '../services/leadService.js';

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const validatedData = registerSchema.parse(req.body);

      const existingUser = await User.findOne({ email: validatedData.email });
      if (existingUser) {
        return res.status(409).json({ error: 'Email already registered' });
      }

      const user = await User.create({
        ...validatedData,
        role: 'customer',
        isActive: true
      });

      const token = jwt.sign({ userId: user._id.toString() }, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn
      } as jwt.SignOptions);

      // Create registration event
      await Event.create({
        userId: user._id,
        sessionId: req.body.sessionId || `session_${Date.now()}`,
        eventType: 'user_registered',
        source: 'web',
        timestamp: new Date()
      });

      // Create lead
      await leadService.findOrCreateLead(user._id);

      logger.info(`User registered: ${user.email}`);

      res.status(201).json({
        user: {
          id: user._id,
          name: `${user.firstName} ${user.lastName}`.trim(),
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          customerType: user.customerType,
          role: user.role
        },
        token
      });
    } catch (error: any) {
      logger.error('Registration error:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      res.status(500).json({ error: 'Registration failed' });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const validatedData = loginSchema.parse(req.body);

      const user = await User.findOne({ email: validatedData.email });
      if (!user || !user.isActive) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isPasswordValid = await user.comparePassword(validatedData.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign({ userId: user._id.toString() }, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn
      } as jwt.SignOptions);

      // Create login event
      await Event.create({
        userId: user._id,
        sessionId: req.body.sessionId || `session_${Date.now()}`,
        eventType: 'user_logged_in',
        source: 'web',
        timestamp: new Date()
      });

      logger.info(`User logged in: ${user.email}`);

      res.json({
        user: {
          id: user._id,
          name: `${user.firstName} ${user.lastName}`.trim(),
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          customerType: user.customerType,
          role: user.role
        },
        token
      });
    } catch (error: any) {
      logger.error('Login error:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      res.status(500).json({ error: 'Login failed' });
    }
  }

  async getCurrentUser(req: any, res: Response) {
    try {
      const user = await User.findById(req.user._id).select('-password');
      res.json({ user });
    } catch (error) {
      logger.error('Get current user error:', error);
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  }

  async logout(req: Request, res: Response) {
    res.json({ message: 'Logged out successfully' });
  }
}

export const authController = new AuthController();
