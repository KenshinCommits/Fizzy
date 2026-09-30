export type PipelineStage = 
  | 'NEW'
  | 'ENGAGED'
  | 'QUALIFIED_CART'
  | 'QUOTE_REQUESTED'
  | 'CALL_SCHEDULED'
  | 'CLOSED_WON'
  | 'CLOSED_LOST'
  | 'STALLED';

export type EventType = 
  | 'page_viewed'
  | 'wholesale_catalog_viewed'
  | 'cart_created'
  | 'high_value_cart_created'
  | 'cart_abandoned'
  | 'wholesale_quote_requested'
  | 'email_opened'
  | 'email_replied'
  | 'call_connected_positive'
  | 'call_no_answer'
  | 'inactivity_decay';

export interface LeadEvent {
  id: string;
  type: EventType;
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface ScoreChange {
  id: string;
  leadId: string;
  previousScore: number;
  newScore: number;
  delta: number;
  reasonCode: EventType;
  reasonLabel: string;
  timestamp: string;
}

export type Urgency = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface NextBestAction {
  action: string;
  reason: string;
  urgency: Urgency;
}

export interface Lead {
  id: string;
  score: number;
  stage: PipelineStage;
  estimatedDealSize: number;
  winProbability: number;
  expectedDealValue: number;
  lastActiveAt: string;
  nba?: NextBestAction;
}
