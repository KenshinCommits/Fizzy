import { Lead, PipelineStage, IntentLevel } from '../models/Lead.js';
import { logger } from '../config/logger.js';
import { Types } from 'mongoose';

export class PipelineService {
  async updateStage(leadId: Types.ObjectId, trigger: string): Promise<PipelineStage> {
    try {
      const lead = await Lead.findById(leadId);
      if (!lead) {
        logger.error('Lead not found for pipeline update:', leadId);
        return 'new';
      }

      const currentStage = lead.pipelineStage;
      let newStage: PipelineStage = currentStage;

      // Stage transition logic
      switch (trigger) {
        case 'high_intent':
          if (lead.intentLevel === 'high' || lead.intentLevel === 'very_high') {
            newStage = 'high_intent';
          } else if (lead.score >= 40 && currentStage === 'new') {
            newStage = 'qualified';
          }
          break;

        case 'cart_abandoned':
          if (lead.cartAbandoned && lead.cartValue >= 50) {
            newStage = 'cart_abandoned';
          }
          break;

        case 'bulk_quote':
          newStage = 'bulk_quote';
          break;

        case 'call_scheduled':
          newStage = 'call_scheduled';
          break;

        case 'negotiation':
          newStage = 'negotiation';
          break;

        case 'purchase':
          newStage = 'closed_won';
          break;

        case 'lost':
          newStage = 'closed_lost';
          break;

        case 'qualified':
          if (lead.score >= 30 && currentStage === 'new') {
            newStage = 'qualified';
          }
          break;
      }

      if (newStage !== currentStage) {
        lead.pipelineStage = newStage;
        await lead.save();
        logger.info(`Pipeline stage updated for lead ${leadId}: ${currentStage} -> ${newStage}`);
      }

      return newStage;
    } catch (error) {
      logger.error('Error updating pipeline stage:', error);
      return 'new';
    }
  }

  async autoUpdateStage(leadId: Types.ObjectId): Promise<void> {
    const lead = await Lead.findById(leadId);
    if (!lead) return;

    if (lead.cartAbandoned && lead.cartValue >= 50) {
      await this.updateStage(leadId, 'cart_abandoned');
    } else if (lead.intentLevel === 'high' || lead.intentLevel === 'very_high') {
      await this.updateStage(leadId, 'high_intent');
    } else if (lead.score >= 40 && lead.pipelineStage === 'new') {
      await this.updateStage(leadId, 'qualified');
    }
  }
}

export const pipelineService = new PipelineService();
