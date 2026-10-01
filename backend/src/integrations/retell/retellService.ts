import axios from 'axios';
import { config } from '../../config/index.js';
import { logger } from '../../config/logger.js';

const RETELL_API_BASE = 'https://api.retellai.com/v2';

export class RetellService {
  private apiKey: string;
  private agentId: string;

  constructor() {
    this.apiKey = config.retell.apiKey;
    this.agentId = config.retell.agentId;
  }

  async initiateCall(phoneNumber: string, dynamicVariables: Record<string, any>) {
    try {
      if (!this.apiKey || !this.agentId) {
        throw new Error('Retell API key or Agent ID not configured');
      }

      const response = await axios.post(
        `${RETELL_API_BASE}/create-phone-call`,
        {
          agent_id: this.agentId,
          from_number: config.twilio.retellFromNumber,
          to_number: phoneNumber,
          override_agent_id: this.agentId,
          retell_llm_dynamic_variables: dynamicVariables
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      logger.info(`Retell call initiated to ${phoneNumber}`);
      return response.data;
    } catch (error: any) {
      logger.error('Retell initiate call error:', error.response?.data || error.message);
      throw new Error('Failed to initiate Retell call');
    }
  }

  async getCallDetails(callId: string) {
    try {
      const response = await axios.get(
        `${RETELL_API_BASE}/get-call/${callId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      return response.data;
    } catch (error: any) {
      logger.error('Retell get call error:', error.response?.data || error.message);
      throw new Error('Failed to get call details');
    }
  }

  async updateAgent(agentConfig: any) {
    try {
      const response = await axios.patch(
        `${RETELL_API_BASE}/update-agent/${this.agentId}`,
        agentConfig,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      logger.info('Retell agent updated');
      return response.data;
    } catch (error: any) {
      logger.error('Retell update agent error:', error.response?.data || error.message);
      throw new Error('Failed to update agent');
    }
  }
}

export const retellService = new RetellService();
