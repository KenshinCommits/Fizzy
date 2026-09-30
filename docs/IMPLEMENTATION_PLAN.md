# Implementation Plan: Autonomous Lead-to-Deal Intelligence System

## Project Rule
Build one phase at a time. Do not start the next phase until the current phase passes its verification checks.

---

## Phase 0 — Environment & Database Foundation
**Tasks:**
- Initialize Next.js 15 repository (App Router, TypeScript, Tailwind CSS, shadcn/ui).
- Set up Supabase project and local environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).
- Write initial migration for core tables: `leads`, `lead_current`, `lead_events`, `score_changes`, `pipeline_transitions`, and `sales_reps`.
- Enable Supabase Realtime publication on `lead_current`, `score_changes`, and `lead_events`.
- Configure base server and client Supabase utilities in Next.js.

**Deliverable:**
- Functional Next.js skeleton connected to Supabase with schema deployed and Realtime active.

**Verify:**
- Querying Supabase from a Server Action returns successful connection; tables exist in Supabase Table Editor.

---

## Phase 1 — Ingestion RPC & Dynamic Scoring Engine
**Tasks:**
- Implement the atomic PostgreSQL function `ingest_lead_event(lead_id, event_type, metadata)`:
  - Validates and inserts raw event into `lead_events`.
  - Evaluates score deltas based on event type (e.g., $+40$ for demo, $+15$ for pricing, $-5$ decay).
  - Clamps score within $[0, 100]$.
  - Appends explainable audit trail row to `score_changes`.
  - Updates `lead_current` projection atomically.
- Create Next.js Route Handler `POST /api/events` with Zod schema validation to call `ingest_lead_event`.
- Write seed script creating 5 sample reps and 10 baseline leads.

**Deliverable:**
- Calling `POST /api/events` successfully updates lead score and appends explainability record in a single database transaction.

**Verify:**
- Execute test payload `demo_requested` against a lead; confirm `lead_current.score` increases by 40 and `score_changes` contains the exact reason string.

---

## Phase 2 — Real-Time Priority Queue & Explainability UI
**Tasks:**
- Set up TanStack Query in Next.js client wrapper.
- Build Dashboard Shell using shadcn/ui (Sidebar, Header, Status Badge).
- Implement **Prioritized Lead Queue Table**:
  - Displays leads sorted descending by `score` and SLA urgency.
  - Realtime subscription invalidates TanStack Query on changes to `lead_current`.
- Implement **Lead Detail Drawer**:
  - Displays chronological timeline from `lead_events`.
  - Displays audit trail from `score_changes` showing exact score deltas and rationale.
  - Displays current Next-Best-Action.

**Deliverable:**
- Working priority dashboard that live-updates without page refresh when events are posted to the database.

**Verify:**
- Post an event via curl/Postman; observe lead reordering in the dashboard table within 300 ms with delta tooltip visible.

---

## Phase 3 — Simulation Control Harness
**Tasks:**
- Build client-side Simulator Controller component (docked or drawer):
  - Controls: Start, Pause, Reset, Interval Slider (500 ms – 3000 ms).
  - Seed generator: Ingests 50+ synthetic leads across multiple tiers and channels.
- Implement simulation loop that sequentially emits randomized realistic events (`pricing_page_viewed`, `email_opened`, `call_completed`) targeting existing leads.
- Create reset endpoint `POST /api/simulator/reset` to wipe and re-seed test data.

**Deliverable:**
- Interactive UI panel allowing one-click demonstration of streaming real-time lead updates.

**Verify:**
- Toggle "Start Simulation"; dashboard displays continuous incoming events, dynamic score movements, and live queue re-ordering.

---

## Phase 4 — Pipeline State Machine & Opportunity Engine
**Tasks:**
- Extend `ingest_lead_event` logic with stage transition rules:
  - `New` $\rightarrow$ `Engaged` on outreach/reply.
  - `Engaged` $\rightarrow$ `Discovery` on `meeting_booked` or `call_completed`.
  - `Discovery` $\rightarrow$ `Proposal` on `pricing_page_viewed` or proposal generated.
  - Record audit entries in `pipeline_transitions`.
- Implement Dynamic Win Probability and Expected Value calculation formula.
- Build **Kanban Pipeline View**:
  - Stage columns (`New`, `Engaged`, `Discovery`, `Proposal`, `Won`, `Lost`).
  - Optimistic drag-and-drop updating stages via Server Actions with server validation rollback.

**Deliverable:**
- Fully reactive Kanban board automatically advancing stages based on event triggers, with manual override capabilities.

**Verify:**
- Ingest a `meeting_booked` event for an `Engaged` lead; verify the card automatically relocates to the `Discovery` column.

---

## Phase 5 — Assignment, SLA Breaches & Fraud Controls
**Tasks:**
- Implement dynamic routing logic in PostgreSQL:
  - Match lead territory/tier to sales rep with lowest active load and highest conversion rate.
- Add SLA breach monitoring:
  - If score $\ge 70$ and no rep activity in 4 hours, set `sla_breached = TRUE` and reassign to next available rep.
- Add duplicate/fraud detection:
  - Detect disposable email domains (`tempmail`, `mailinator`) and rate-limit bursts.
  - Deduplicate incoming records by corporate domain and email.
- Expose SLA countdown badges and fraud risk tags on lead cards.

**Deliverable:**
- Automatic rep allocation, visual SLA alerts, auto-reassignment on neglect, and quarantine for fake leads.

**Verify:**
- Submit duplicate lead or disposable email; verify lead is flagged as `fake_suspected` with negative score penalty and excluded from active queues.

---

## Phase 6 — Analytics & Production Readiness
**Tasks:**
- Implement Recharts analytics dashboard:
  - Pipeline funnel conversion rates.
  - Lead source quality matrix.
  - Average response time and SLA breach frequency.
  - Lead score distribution histogram.
- Set up Supabase `pg_cron` jobs for continuous background decay and SLA checks.
- Accessibility, mobile-responsive layout check, and error boundaries.
- Run complete `TESTING.md` test run.

**Deliverable:**
- Production-ready autonomous CRM intelligence suite deployed on Vercel and Supabase.

**Verify:**
- Pass all checklist scenarios in `TESTING.md` end-to-end without unhandled errors.

---

## Out of Scope for V1
- Native telephony/VoIP dialer integration (events are simulated).
- Two-way Google/Outlook calendar OAuth sync (relies on event ingestion endpoint).
- Real-time LLM-generated conversational voice agents.
- Complex multi-tenant enterprise billing systems.
