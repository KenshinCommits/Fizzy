import type { Lead, LeadEvent } from './types';
import { processLeadEvent, applyInactivityDecay } from './engine';

function logStep(step: string, lead: Lead, scoreChange?: any) {
  console.log(`\n=== ${step} ===`);
  if (scoreChange) {
    console.log(`Score Change Ledger: [${scoreChange.reasonCode}] ${scoreChange.reasonLabel} | Delta: ${scoreChange.delta > 0 ? '+' : ''}${scoreChange.delta}`);
  }
  console.log(`Lead State:`);
  console.log(`  Stage: ${lead.stage}`);
  console.log(`  Score: ${lead.score}`);
  console.log(`  Win Probability: ${lead.winProbability * 100}%`);
  console.log(`  Expected Deal Value: $${lead.expectedDealValue}`);
  if (lead.nba) {
    console.log(`  Next Best Action: [${lead.nba.urgency}] ${lead.nba.action}`);
  }
}

async function runSample() {
  console.log("Starting AczenCRM2 Lead Processing Engine Test...");

  let lead: Lead = {
    id: 'lead_123',
    score: 10,
    stage: 'NEW',
    estimatedDealSize: 1000,
    winProbability: 0.1,
    expectedDealValue: 100,
    lastActiveAt: new Date().toISOString(),
  };

  console.log(`Initial Lead State: Score=${lead.score}, Stage=${lead.stage}`);

  // Event 1: Page viewed
  let event: LeadEvent = {
    id: 'evt_1',
    type: 'page_viewed',
    timestamp: new Date().toISOString(),
  };
  let result = processLeadEvent(lead, event);
  lead = result.updatedLead;
  logStep('Event: Page Viewed', lead, result.scoreChange);

  // Event 2: High value cart created
  event = {
    id: 'evt_2',
    type: 'high_value_cart_created',
    timestamp: new Date().toISOString(),
  };
  result = processLeadEvent(lead, event);
  lead = result.updatedLead;
  logStep('Event: High Value Cart Created', lead, result.scoreChange);

  // Apply decay (simulate 48 hours inactivity)
  console.log('\n--- Simulating 48h Inactivity ---');
  let decayResult = applyInactivityDecay(lead, 48);
  if (decayResult.scoreChange) {
    lead = decayResult.updatedLead;
    logStep('Decay Applied', lead, decayResult.scoreChange);
  }

  // Event 3: Cart abandoned
  event = {
    id: 'evt_3',
    type: 'cart_abandoned',
    timestamp: new Date().toISOString(),
  };
  result = processLeadEvent(lead, event);
  lead = result.updatedLead;
  logStep('Event: Cart Abandoned', lead, result.scoreChange);

  // Event 4: Wholesale quote requested
  event = {
    id: 'evt_4',
    type: 'wholesale_quote_requested',
    timestamp: new Date().toISOString(),
  };
  result = processLeadEvent(lead, event);
  lead = result.updatedLead;
  logStep('Event: Wholesale Quote Requested', lead, result.scoreChange);

}

runSample();
