import { Request, Response } from 'express';
import { Conversation } from '../models/Conversation.js';
import { Lead } from '../models/Lead.js';
import { logger } from '../config/logger.js';
import { scoringService } from '../services/scoringService.js';
import { pipelineService } from '../services/pipelineService.js';
import { emitEvent } from '../realtime/socketManager.js';

export class RetellWebhookController {
  async handleWebhook(req: Request, res: Response) {
    try {
      const { event, call } = req.body;

      logger.info('Retell webhook received:', { event, callId: call?.call_id });

      switch (event) {
        case 'call_started':
          await this.handleCallStarted(call);
          break;
        case 'call_ended':
          await this.handleCallEnded(call);
          break;
        case 'call_analyzed':
          await this.handleCallAnalyzed(call);
          break;
        default:
          logger.warn('Unknown Retell webhook event:', event);
      }

      res.json({ received: true });
    } catch (error) {
      logger.error('Retell webhook error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }

  private async handleCallStarted(call: any) {
    try {
      const conversation = await Conversation.findOne({ retellCallId: call.call_id });
      if (conversation) {
        conversation.status = 'active';
        await conversation.save();

        emitEvent('agent_call_started', {
          conversationId: conversation._id,
          userId: conversation.userId?.toString(),
          callId: call.call_id
        });
      }
    } catch (error) {
      logger.error('Error handling call started:', error);
    }
  }

  private async handleCallEnded(call: any) {
    try {
      const conversation = await Conversation.findOne({ retellCallId: call.call_id });
      if (conversation) {
        conversation.endedAt = new Date();
        conversation.durationSeconds = call.duration_seconds || 0;
        conversation.status = 'completed';
        conversation.transcript = call.transcript || [];
        // Store recording URL if Retell provides it
        if (call.recording_url) {
          conversation.recordingUrl = call.recording_url;
        }
        await conversation.save();

        emitEvent('agent_call_completed', {
          conversationId: conversation._id,
          userId: conversation.userId?.toString(),
          callId: call.call_id,
          duration: call.duration_seconds
        });
      }
    } catch (error) {
      logger.error('Error handling call ended:', error);
    }
  }

  private async handleCallAnalyzed(call: any) {
    try {
      const conversation = await Conversation.findOne({ retellCallId: call.call_id });
      if (!conversation || !conversation.userId) return;

      // Extract insights from call analysis
      const analysis = call.call_analysis || {};
      
      conversation.summary = analysis.summary || '';
      conversation.intentAfter = analysis.customer_intent || conversation.intentBefore;
      conversation.productInterest = analysis.products_mentioned || [];
      conversation.objections = analysis.objections || [];
      conversation.purchaseIntent = analysis.purchase_intent || false;
      conversation.recommendedAction = analysis.next_action || '';
      conversation.outcome = analysis.outcome || '';

      // Get lead
      const lead = await Lead.findOne({ userId: conversation.userId });
      if (lead) {
        conversation.leadId = lead._id;
        conversation.scoreBefore = lead.score;

        // Update score based on call outcome
        if (analysis.purchase_intent) {
          await scoringService.updateScore(
            conversation.userId,
            lead._id,
            'voice_agent_completed',
            undefined,
            { outcome: 'high_intent' }
          );
        }

        // Update pipeline
        if (analysis.outcome === 'scheduled') {
          await pipelineService.updateStage(lead._id, 'call_scheduled');
        } else if (analysis.outcome === 'qualified') {
          await pipelineService.updateStage(lead._id, 'qualified');
        }

        const updatedLead = await Lead.findById(lead._id);
        if (updatedLead) {
          conversation.scoreAfter = updatedLead.score;
        }
      }

      await conversation.save();

      logger.info(`Call analyzed: ${call.call_id}`);
    } catch (error) {
      logger.error('Error handling call analyzed:', error);
    }
  }
}

export const retellWebhookController = new RetellWebhookController();
