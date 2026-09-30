import type { 
  Lead, 
  LeadEvent, 
  ScoreChange, 
  PipelineStage, 
  EventType, 
  NextBestAction 
} from './types';

// Deterministic Scoring Deltas
const SCORE_DELTAS: Record<EventType, number> = {
  page_viewed: 2,
  wholesale_catalog_viewed: 12,
  cart_created: 5,
  high_value_cart_created: 20,
  cart_abandoned: 10,
  wholesale_quote_requested: 40,
  email_opened: 3,
  email_replied: 15,
  call_connected_positive: 25,
  call_no_answer: -5,
  inactivity_decay: -10,
};

const REASON_LABELS: Record<EventType, string> = {
  page_viewed: 'General page viewed',
  wholesale_catalog_viewed: 'Wholesale catalog browsed',
  cart_created: 'Shopping cart created',
  high_value_cart_created: 'High value cart created (>= $150)',
  cart_abandoned: 'Shopping cart abandoned',
  wholesale_quote_requested: 'Wholesale bulk quote submitted',
  email_opened: 'Marketing email opened',
  email_replied: 'Sales email replied',
  call_connected_positive: 'Positive voice call connected',
  call_no_answer: 'Outbound call unanswered',
  inactivity_decay: 'Inactivity decay applied',
};

// Win Probability Map based on Stage
const WIN_PROBABILITIES: Partial<Record<PipelineStage, number>> = {
  NEW: 0.1,
  ENGAGED: 0.25,
  QUALIFIED_CART: 0.45,
  QUOTE_REQUESTED: 0.7,
  CALL_SCHEDULED: 0.85,
  CLOSED_WON: 1.0,
  CLOSED_LOST: 0.0,
  STALLED: 0.05,
};

// State Machine Hierarchy Map for progression logic
const STAGE_HIERARCHY: Record<PipelineStage, number> = {
  NEW: 0,
  ENGAGED: 1,
  QUALIFIED_CART: 2,
  QUOTE_REQUESTED: 3,
  CALL_SCHEDULED: 4,
  CLOSED_WON: 5,
  CLOSED_LOST: 5,
  STALLED: 5,
};

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, score));
}

function computeWinProbability(stage: PipelineStage): number {
  return WIN_PROBABILITIES[stage] ?? 0;
}

function calculateExpectedValue(estimatedDealSize: number, winProbability: number): number {
  return estimatedDealSize * winProbability;
}

function generateRandomId(): string {
  return Math.random().toString(36).substring(2, 9);
}

function generateNextBestAction(event: LeadEvent, stage: PipelineStage): NextBestAction | undefined {
  if (event.type === 'cart_abandoned') {
    return {
      action: 'Trigger Autonomous Recovery Voice Call',
      reason: 'High cart abandon flag triggered',
      urgency: 'HIGH',
    };
  }
  if (event.type === 'wholesale_quote_requested') {
    return {
      action: 'Assign to Wholesale Distribution Rep & Call within 15m',
      reason: 'Quote requested logic triggered',
      urgency: 'CRITICAL',
    };
  }
  if (event.type === 'inactivity_decay') {
    return {
      action: 'Send automated promotional discount SMS/Email',
      reason: 'Inactivity decay limit reached',
      urgency: 'LOW',
    };
  }
  return undefined;
}

function determineNextStage(currentStage: PipelineStage, newScore: number, event: LeadEvent): PipelineStage {
  let nextStage = currentStage;
  
  if (currentStage === 'CLOSED_WON' || currentStage === 'CLOSED_LOST') {
    return currentStage; // Terminal states
  }

  // Event-specific explicit advances (can skip stages if valid)
  if (event.type === 'wholesale_quote_requested') {
    nextStage = 'QUOTE_REQUESTED';
  } else if (event.type === 'high_value_cart_created' || event.type === 'cart_abandoned') {
    if (STAGE_HIERARCHY['QUALIFIED_CART'] > STAGE_HIERARCHY[nextStage]) {
      nextStage = 'QUALIFIED_CART';
    }
  } else if (newScore >= 20) {
    if (STAGE_HIERARCHY['ENGAGED'] > STAGE_HIERARCHY[nextStage]) {
      nextStage = 'ENGAGED';
    }
  }

  return nextStage;
}

export function processLeadEvent(currentLead: Lead, event: LeadEvent): { updatedLead: Lead, scoreChange: ScoreChange } {
  const previousScore = currentLead.score;
  const delta = SCORE_DELTAS[event.type] || 0;
  const rawScore = previousScore + delta;
  const newScore = clampScore(rawScore);

  const scoreChange: ScoreChange = {
    id: generateRandomId(),
    leadId: currentLead.id,
    previousScore,
    newScore,
    delta: newScore - previousScore,
    reasonCode: event.type,
    reasonLabel: REASON_LABELS[event.type],
    timestamp: event.timestamp,
  };

  const nextStage = determineNextStage(currentLead.stage, newScore, event);
  const winProbability = computeWinProbability(nextStage);
  const expectedDealValue = calculateExpectedValue(currentLead.estimatedDealSize, winProbability);

  const nba = generateNextBestAction(event, nextStage) || currentLead.nba;

  const updatedLead: Lead = {
    ...currentLead,
    score: newScore,
    stage: nextStage,
    winProbability,
    expectedDealValue,
    lastActiveAt: event.timestamp,
    nba,
  };

  return { updatedLead, scoreChange };
}

export function applyInactivityDecay(currentLead: Lead, hoursInactive: number): { updatedLead: Lead, scoreChange: ScoreChange | null } {
  // If stalled for > 72h
  let nextStage = currentLead.stage;
  let eventType: EventType | null = null;

  if (hoursInactive > 72 && currentLead.stage !== 'STALLED' && currentLead.stage !== 'CLOSED_WON' && currentLead.stage !== 'CLOSED_LOST') {
    nextStage = 'STALLED';
  }

  if (hoursInactive >= 48) {
    eventType = 'inactivity_decay';
  }

  if (!eventType && nextStage === currentLead.stage) {
    return { updatedLead: { ...currentLead }, scoreChange: null };
  }

  if (eventType === 'inactivity_decay') {
    const event: LeadEvent = {
      id: generateRandomId(),
      type: eventType,
      timestamp: new Date().toISOString(),
    };
    const { updatedLead, scoreChange } = processLeadEvent(currentLead, event);
    
    // Explicit stall override if needed
    if (nextStage === 'STALLED') {
      updatedLead.stage = 'STALLED';
      updatedLead.winProbability = computeWinProbability('STALLED');
      updatedLead.expectedDealValue = calculateExpectedValue(updatedLead.estimatedDealSize, updatedLead.winProbability);
    }
    return { updatedLead, scoreChange };
  }

  // Only stall transition without decay
  const winProbability = computeWinProbability(nextStage);
  const expectedDealValue = calculateExpectedValue(currentLead.estimatedDealSize, winProbability);

  return {
    updatedLead: {
      ...currentLead,
      stage: nextStage,
      winProbability,
      expectedDealValue,
    },
    scoreChange: null,
  };
}
