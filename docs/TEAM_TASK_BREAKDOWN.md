# Team Task Breakdown — AczenCRM2

### Overview
This document outlines the operational ownership and functional responsibilities across the 5 project team members for the Autonomous Lead-to-Deal Intelligence System.

---

### Member Responsibilities

#### 1. Rithwik — Core Backend & Scoring Engine
* **Dynamic Recalculation Engine:** Write the atomic scoring service that updates lead scores (clamped between 0 and 100) whenever an event is received.
* **Explainability Ledger:** Generate human-readable reasons (e.g., `+15: Pricing page viewed`, `-5: Inactivity decay`) and store the delta audit logs.
* **Pipeline State Machine:** Implement stage transition logic (`New` $\rightarrow$ `Engaged` $\rightarrow$ `Qualified` $\rightarrow$ `Proposal` $\rightarrow$ `Won/Lost`) based on evidence triggers.
* **Next-Best-Action (NBA) & SLA Engine:** Compute recommended operational actions and track stall/inactivity timers.

#### 2. Sai — MongoDB Architecture & Autonomous Calling/Voice Agents
* **MongoDB Schema & Indexes:** Set up collections for `leads`, `lead_events`, `score_audit`, `pipeline_history`, and `call_logs`.
* **Real-time Streaming:** Implement MongoDB Change Streams (`watch()`) piped to WebSockets/SSE so data pushes live to the admin dashboard.
* **Deduplication & Data Hygiene:** Write queries to merge duplicate contacts/domains and quarantine disposable email signups.
* **Voice/Calling Agent Setup:** Connect a voice platform (e.g., Vapi, Bland AI, or Twilio) to place automated outbound calls for high-intent or stalled leads, parse call transcripts/sentiment, and emit `call_completed` events into Rithwik's ingestion pipeline.

#### 3. Agasthya — E-Commerce Storefront & Behavioral Telemetry
* **Storefront & Product Catalog:** Build or refine the customer-facing e-commerce store.
* **Behavior Tracking Pixel/Hooks:** Fire events to the backend on key shopper actions:
  * High-value product or pricing page views.
  * Cart additions and abandoned carts.
  * Checkout inquiry, quote requests, or contact forms.
* **Simulation Control Widget:** Build a demo toolbar on the site to simulate shopper actions on demand for live presentations.

#### 4. Vinay & Adithya — Admin Page & Dashboard UI (Frontend Pair)
* **Prioritized Lead Queue Table:** Real-time table sorting leads dynamically by score and SLA deadlines with animated score delta badges.
* **Lead Detail & Intelligence Drawer:** Slide-out panel showing the timeline of customer events, historical score change ledger, and voice call transcripts.
* **Kanban Pipeline Board:** Drag-and-drop pipeline board with automatic card movement when stage transitions occur in the backend.
* **Analytics & Calling Controls:** Recharts dashboards (funnel conversions, source quality) plus a "Trigger Voice Call Now" button with live call status indicators.
