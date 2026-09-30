# AczenCRM2 — Autonomous Lead-to-Deal Intelligence System

> Next-generation autonomous CRM platform featuring dynamic lead scoring, real-time telemetry, automated pipeline state machine, voice agent integrations, behavioral analytics, and SLA monitoring.

---

## 📌 Table of Contents
1. [System Overview](#-system-overview)
2. [Architecture & Technology Stack](#-architecture--technology-stack)
3. [Team Task Breakdown](#-team-task-breakdown-5-members)
4. [Implementation Plan](#-implementation-plan)
5. [Getting Started](#-getting-started)
6. [Repository Structure](#-repository-structure)

---

## 🚀 System Overview

**AczenCRM2** is an end-to-end Autonomous Lead-to-Deal Intelligence System. It tracks customer behavior across e-commerce storefronts, ingests real-time behavioral telemetry, dynamically recalculates lead scores with explainable audit trails, automatically advances pipeline stages, detects fraud and SLA breaches, and integrates autonomous calling agents for high-intent lead engagement.

---

## 🛠 Architecture & Technology Stack

- **Frontend / Framework:** Next.js 15 (App Router), React, TypeScript, Tailwind CSS, shadcn/ui
- **State & Realtime Data:** TanStack Query, Supabase Realtime / MongoDB Change Streams & WebSockets
- **Database & Telemetry:** PostgreSQL (Supabase) / MongoDB (Lead & Event Storage)
- **Analytics & Data Vis:** Recharts
- **Voice & Telecom:** Integration hooks for Vapi, Bland AI, or Twilio
- **Automation Engine:** Dynamic scoring RPCs, pipeline state machines, SLA breach detectors

---

## 👥 Team Task Breakdown (5 Members)

### 1. Rithwik — Core Backend & Scoring Engine
- **Dynamic Recalculation Engine:** Write atomic scoring services updating lead scores (clamped between 0 and 100) upon event receipt.
- **Explainability Ledger:** Generate human-readable audit reasons (e.g., `+15: Pricing page viewed`, `-5: Inactivity decay`) with delta audit logging.
- **Pipeline State Machine:** Implement stage transition logic (`New` $\rightarrow$ `Engaged` $\rightarrow$ `Qualified` $\rightarrow$ `Proposal` $\rightarrow$ `Won/Lost`) based on evidence triggers.
- **Next-Best-Action (NBA) & SLA Engine:** Compute recommended operational actions and track stall/inactivity timers.

### 2. Sai — MongoDB Architecture & Autonomous Calling/Voice Agents
- **MongoDB Schema & Indexes:** Set up collections for `leads`, `lead_events`, `score_audit`, `pipeline_history`, and `call_logs`.
- **Real-time Streaming:** Implement MongoDB Change Streams (`watch()`) piped to WebSockets/SSE for live admin dashboard updates.
- **Deduplication & Data Hygiene:** Write queries to merge duplicate contacts/domains and quarantine disposable email signups.
- **Voice/Calling Agent Setup:** Connect voice platforms (Vapi, Bland AI, Twilio) for automated outbound calls, parse call transcripts/sentiment, and emit `call_completed` events into the ingestion pipeline.

### 3. Agasthya — E-Commerce Storefront & Behavioral Telemetry
- **Storefront & Product Catalog:** Build or refine the customer-facing e-commerce storefront.
- **Behavior Tracking Pixel/Hooks:** Fire backend events on shopper actions (high-value product/pricing page views, cart additions, abandoned carts, checkout inquiries, quote requests, contact forms).
- **Simulation Control Widget:** Build demo toolbar to simulate shopper actions on demand for live presentations.

### 4. Vinay & Adithya — Admin Page & Dashboard UI (Frontend Pair)
- **Prioritized Lead Queue Table:** Real-time table sorting leads dynamically by score and SLA deadlines with animated score delta badges.
- **Lead Detail & Intelligence Drawer:** Slide-out panel displaying timeline of customer events, historical score change ledger, and voice call transcripts.
- **Kanban Pipeline Board:** Drag-and-drop pipeline board with automatic card movement when stage transitions occur in the backend.
- **Analytics & Calling Controls:** Recharts dashboards (funnel conversions, source quality) plus a "Trigger Voice Call Now" button with live call status indicators.

---

## 📋 Implementation Plan: Autonomous Lead-to-Deal Intelligence System

> **Project Rule:** Build one phase at a time. Do not start the next phase until the current phase passes its verification checks.

### Phase 0 — Environment & Database Foundation
- **Tasks:**
  - Initialize Next.js 15 repository (App Router, TypeScript, Tailwind CSS, shadcn/ui).
  - Set up Supabase/MongoDB connection and environment variables.
  - Write initial migrations/schemas for core tables (`leads`, `lead_current`, `lead_events`, `score_changes`, `pipeline_transitions`, `sales_reps`).
  - Enable Realtime subscriptions / Change Streams.
- **Deliverable:** Functional Next.js skeleton connected to database with schema deployed and Realtime active.
- **Verify:** Querying database from Server Action returns successful connection; tables exist in database console.

### Phase 1 — Ingestion RPC & Dynamic Scoring Engine
- **Tasks:**
  - Implement atomic event ingestion (`ingest_lead_event(lead_id, event_type, metadata)`).
  - Evaluate score deltas (+40 demo, +15 pricing, -5 decay) clamped to $[0, 100]$.
  - Append explainable audit trail row to `score_changes`.
  - Update `lead_current` atomically.
  - Expose `POST /api/events` with Zod schema validation.
- **Deliverable:** Calling `POST /api/events` updates lead score and appends explainability record in a single transaction.
- **Verify:** Execute test payload `demo_requested`; confirm `lead_current.score` increases by 40 and audit contains exact reason.

### Phase 2 — Real-Time Priority Queue & Explainability UI
- **Tasks:**
  - Configure TanStack Query and Dashboard Shell with shadcn/ui.
  - Build **Prioritized Lead Queue Table** sorted descending by score and SLA urgency with Realtime invalidation.
  - Implement **Lead Detail Drawer** showing event timeline, score audit trail, and Next-Best-Action.
- **Deliverable:** Reactive priority dashboard updating live without page refresh.
- **Verify:** Post an event via API; verify lead reordering in dashboard within 300ms.

### Phase 3 — Simulation Control Harness
- **Tasks:**
  - Build Simulator Controller widget (Start, Pause, Reset, Interval slider).
  - Create seed generator with 50+ synthetic leads.
  - Implement simulation loop emitting randomized realistic events (`pricing_page_viewed`, `email_opened`, `call_completed`).
  - Add reset endpoint `POST /api/simulator/reset`.
- **Deliverable:** Interactive UI panel for live streaming demonstrations.
- **Verify:** Toggle "Start Simulation"; verify continuous event streaming, dynamic score movements, and queue re-ordering.

### Phase 4 — Pipeline State Machine & Opportunity Engine
- **Tasks:**
  - Extend ingestion logic with stage transition rules (`New` $\rightarrow$ `Engaged` $\rightarrow$ `Discovery` $\rightarrow$ `Proposal`).
  - Compute Dynamic Win Probability and Expected Value formulas.
  - Build **Kanban Pipeline Board** with optimistic drag-and-drop.
- **Deliverable:** Reactive Kanban board advancing stages automatically on event triggers with manual override.
- **Verify:** Ingest `meeting_booked` for `Engaged` lead; verify card moves to `Discovery`.

### Phase 5 — Assignment, SLA Breaches & Fraud Controls
- **Tasks:**
  - Implement dynamic lead routing (territory/tier, lowest load, highest conversion rate).
  - Monitor SLA breaches (score $\ge 70$, no activity in 4 hrs $\rightarrow$ `sla_breached = TRUE`, auto-reassign).
  - Detect duplicate/disposable email domains (`tempmail`, `mailinator`), rate limits, and domain deduplication.
  - Expose SLA countdown badges and fraud risk tags.
- **Deliverable:** Auto rep allocation, visual SLA alerts, auto-reassignment, and quarantine for fake leads.
- **Verify:** Submit duplicate or disposable email; verify lead flagged `fake_suspected` with score penalty.

### Phase 6 — Analytics & Production Readiness
- **Tasks:**
  - Build Recharts analytics dashboard (funnel conversions, source quality matrix, avg response time, score distribution).
  - Configure background jobs (`pg_cron`) for score decay and SLA monitoring.
  - Accessibility, mobile-responsiveness, error boundaries, and full test run.
- **Deliverable:** Production-ready autonomous CRM intelligence suite.
- **Verify:** Pass all test scenarios in `TESTING.md` end-to-end without errors.

---

## 🚫 Out of Scope for V1
- Native telephony/VoIP dialer integration (events simulated).
- Two-way Google/Outlook calendar OAuth sync.
- Real-time LLM-generated conversational voice agents.
- Complex multi-tenant enterprise billing systems.

---

## 📂 Documentation & Links
- [Team Task Breakdown](docs/TEAM_TASK_BREAKDOWN.md)
- [Full Implementation Plan](docs/IMPLEMENTATION_PLAN.md)

---
*AczenCRM2 Team Project*
