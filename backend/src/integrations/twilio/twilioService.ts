import twilio from 'twilio';
import { config } from '../../config/index.js';
import { logger } from '../../config/logger.js';

export class TwilioService {
  private client: any;

  constructor() {
    if (config.twilio.accountSid && config.twilio.authToken) {
      this.client = twilio(config.twilio.accountSid, config.twilio.authToken);
    }
  }

  async sendSMS(to: string, message: string) {
    try {
      if (!this.client) {
        throw new Error('Twilio not configured');
      }

      const result = await this.client.messages.create({
        from: config.twilio.phoneNumber,
        to,
        body: message
      });

      logger.info(`SMS sent to ${to}: ${result.sid}`);
      return result;
    } catch (error: any) {
      logger.error('Twilio SMS error:', error.message);
      throw new Error('Failed to send SMS');
    }
  }

  async makeCall(to: string, twimlUrl: string) {
    try {
      if (!this.client) {
        throw new Error('Twilio not configured');
      }

      const result = await this.client.calls.create({
        from: config.twilio.phoneNumber,
        to,
        url: twimlUrl
      });

      logger.info(`Call initiated to ${to}: ${result.sid}`);
      return result;
    } catch (error: any) {
      logger.error('Twilio call error:', error.message);
      throw new Error('Failed to make call');
    }
  }
}

export const twilioService = new TwilioService();
