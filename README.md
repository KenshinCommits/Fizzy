# Fizzi — AI-Powered Craft Soda Brand Platform

Fizzi is a full-stack, production-grade platform for a fictional craft soda brand. It combines an immersive 3D animated storefront, an AI-powered voice sales agent, and a complete CRM admin dashboard — all connected through a shared REST API backend.

---

## Table of Contents

- [What Is This](#what-is-this)
- [How It Works](#how-it-works)
- [Project Structure](#project-structure)
- [Sub-Projects](#sub-projects)
  - [1. Storefront (Next.js)](#1-storefront-nextjs---port-3000)
  - [2. Admin CRM Dashboard (Vite + React)](#2-admin-crm-dashboard-vite--react---port-5173)
  - [3. Backend API (Node.js + Express)](#3-backend-api-nodejs--express---port-5000)
- [Languages & Technologies](#languages--technologies)
- [All Libraries Used](#all-libraries-used)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Lead Scoring System](#lead-scoring-system)
- [AI Voice Agent (Fulky)](#ai-voice-agent-fulky)
- [Authentication & Roles](#authentication--roles)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [Default Credentials](#default-credentials)

---

## What Is This

Fizzi is three interconnected applications running together:

| App | Description | Port |
|-----|-------------|------|
| **Storefront** | 3D animated Next.js shop with Prismic CMS, cart, login, and Fulky voice agent | 3000 |
| **Admin CRM** | Vite React SPA — customers, leads, pipeline, orders, analytics, team management | 5173 |
| **Backend API** | Express REST API with MongoDB, JWT auth, real-time Socket.IO, Retell AI, Twilio | 5000 |

The key differentiator is **Fulky** — an AI voice agent embedded in the storefront that uses [Retell AI](https://retellai.com) to have real-time voice conversations with shoppers, recommends products based on their browsing behavior, and feeds every interaction back into the CRM as scored lead events.

---

## How It Works

### End-to-End Customer Journey

```
Customer visits storefront (localhost:3000)
        │
        ▼
Browses products → events fire to POST /api/events
        │           (product_viewed, pricing_viewed, cart_updated…)
        ▼
Backend scores events → updates lead score in MongoDB
        │               (each event type has a configurable point value)
        ▼
Intent level calculated → low / medium / high / very_high
        │                  (based on cumulative score thresholds)
        ▼
Pipeline stage auto-advances → new → qualified → high_intent → …
        │
        ▼
Customer clicks "Ask Fulky" → FulkyVoiceAssistant component
        │
        ▼
POST /api/retell/v3/create-web-call (public, no auth needed)
        │   Backend proxies to Retell AI with agent_id
        │   Returns: access_token + call_id + transport + ice_servers
        ▼
Browser connects via WebRTC (gateway transport)
        │   RetellWebClient.startCall({ accessToken, transport, callId, iceServers })
        ▼
Fulky voice agent converses with customer
        │
        ▼
Retell webhook fires to POST /api/webhooks/retell
        │   Backend extracts intent, updates score, stores transcript
        ▼
Socket.IO broadcasts real-time update to Admin CRM
        │
        ▼
Admin sees customer profile update live in dashboard
```

### Admin Login Flow

```
Admin visits localhost:3000/login
        │
        ▼
Logs in with non-customer role (admin, sales_rep, etc.)
        │
        ▼
Backend issues JWT → frontend redirects to:
localhost:5173/?token=<jwt>#/dashboard
        │
        ▼
Admin CRM picks up ?token from URL, stores in localStorage
        │
        ▼
All subsequent admin API calls use Bearer token
```

---

## Project Structure

```
AczenCRM2-Ruthvik/
├── src/                          # Next.js storefront source
│   ├── app/
│   │   ├── page.tsx              # Landing page (Hero → SkyDive → Carousel → …)
│   │   ├── shop/page.tsx         # Shop page with product grid + Fulky
│   │   ├── login/page.tsx        # Auth page (login + signup)
│   │   └── api/                  # Next.js API routes
│   ├── components/
│   │   ├── FulkyVoiceAssistant.tsx   # AI voice widget
│   │   ├── FulkyAssistant.tsx        # Text chat variant
│   │   ├── SodaCan.tsx               # 3D can model
│   │   ├── ViewCanvas.tsx            # Global R3F canvas
│   │   ├── Header.tsx
│   │   └── Footer.tsx
│   ├── slices/
│   │   ├── Hero/                 # Floating 3D cans hero section
│   │   ├── SkyDive/              # Pinned scroll watermelon explode
│   │   ├── Carousel/             # Interactive 4-flavor storefront
│   │   ├── AlternatingText/      # Benefits + 3D can bundle
│   │   └── BigText/              # Horizontal marquee
│   ├── hooks/                    # Custom React hooks
│   ├── lib/
│   │   └── auth.ts               # JWT session helpers
│   └── types/                    # TypeScript type definitions
│
├── admin/                        # CRM Admin Dashboard (Vite SPA)
│   ├── src/
│   │   ├── App.tsx               # Main layout + navigation
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Customers.tsx
│   │   │   ├── Leads.tsx
│   │   │   ├── Pipeline.tsx
│   │   │   ├── Orders.tsx
│   │   │   ├── Products.tsx
│   │   │   ├── Analytics.tsx
│   │   │   ├── AgentAnalysis.tsx
│   │   │   ├── Intelligence.tsx
│   │   │   ├── AbandonedCarts.tsx
│   │   │   ├── Team.tsx
│   │   │   ├── Notifications.tsx
│   │   │   └── SettingsPage.tsx
│   │   ├── components/
│   │   │   ├── Charts.tsx        # Recharts wrappers
│   │   │   ├── CustomerProfile.tsx
│   │   │   └── ui.tsx            # Shared UI primitives
│   │   └── lib/
│   │       ├── api.ts            # All backend API calls + data mappers
│   │       └── store.tsx         # React Context global state
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── backend/                      # Express API
│   ├── src/
│   │   ├── app.ts                # Express setup, CORS, routes
│   │   ├── server.ts             # HTTP server + Socket.IO init
│   │   ├── config/
│   │   │   ├── index.ts          # Config from env vars
│   │   │   ├── database.ts       # MongoDB connection
│   │   │   └── logger.ts         # Winston logger
│   │   ├── models/               # Mongoose schemas
│   │   │   ├── User.ts
│   │   │   ├── Product.ts
│   │   │   ├── Order.ts
│   │   │   ├── Cart.ts
│   │   │   ├── Event.ts
│   │   │   ├── Lead.ts
│   │   │   ├── ScoreHistory.ts
│   │   │   ├── Conversation.ts
│   │   │   ├── AgentAction.ts
│   │   │   ├── Notification.ts
│   │   │   └── Settings.ts
│   │   ├── controllers/          # Route handlers
│   │   ├── services/             # Business logic
│   │   │   ├── behaviorService.ts
│   │   │   ├── scoringService.ts
│   │   │   ├── intentService.ts
│   │   │   ├── leadService.ts
│   │   │   ├── pipelineService.ts
│   │   │   └── nextActionService.ts
│   │   ├── routes/               # Express routers
│   │   ├── middleware/           # Auth, error handling
│   │   ├── integrations/
│   │   │   ├── retell/           # Retell AI SDK
│   │   │   └── twilio/           # Twilio SDK
│   │   ├── webhooks/             # Retell webhook handler
│   │   ├── realtime/             # Socket.IO manager
│   │   └── utils/                # Seed scripts, DB tools
│   ├── .env.example
│   └── package.json
│
├── public/                       # Static assets (can labels, images)
├── .env.local                    # Next.js environment variables
├── next.config.mjs               # Next.js config
├── tailwind.config.js            # Tailwind CSS config
├── slicemachine.config.json      # Prismic Slice Machine config
└── package.json                  # Root (storefront) dependencies
```

---

## Sub-Projects

### 1. Storefront (Next.js) — Port 3000

The public-facing website. An immersive, scroll-driven 3D experience built with Next.js 14 App Router.

**Key pages:**
- `/` — Landing page with 5 animated scroll sections
- `/shop` — Product grid, cart, and Fulky voice assistant
- `/login` — Login and signup (redirects admins to CRM, customers to shop)

**Landing page sections (in order):**
1. **Hero** — Floating 3D soda cans, brand headline, CTA
2. **SkyDive** — Pinned 2000px scroll: watermelon explodes, can dives through clouds
3. **Carousel** — Pinned 2400px storefront: 4 flavors (Watermelon, Yuzu, Berry, Mango) with side drawers for basket, menu, details, story
4. **AlternatingText** — Health benefits with 3D can bundle
5. **BigText** — Energetic horizontal marquee

**Fulky voice widget:**
- Lives at `/shop` in `FulkyVoiceAssistant.tsx`
- Calls `POST /api/retell/v3/create-web-call` (no auth required)
- Uses `RetellWebClient` from `retell-client-js-sdk`
- Connects via WebRTC gateway transport

---

### 2. Admin CRM Dashboard (Vite + React) — Port 5173

A full-featured CRM and intelligence platform. Accessible only after logging in with a staff role.

**Pages:**

| Page | What it shows |
|------|--------------|
| Dashboard | KPI cards, revenue chart, top customers, recent activity |
| Customers | Full customer table with lead score, intent, stage, last active |
| Agent Analysis | Voice call history, transcript viewer, score changes per call |
| Products | Product catalog, stock levels, pricing, CRUD |
| Orders | Order list with fulfillment status updates |
| Abandoned Carts | Carts left behind, recovery status, value |
| Leads | Lead list with source, stage, SLA, next action |
| Pipeline | Kanban drag-and-drop board across 9 pipeline stages |
| Activity | Event feed with impact scores |
| Lead Intelligence | ML-style intent breakdown and behavior patterns |
| AI Agent | Conversation logs, agent performance metrics |
| Analytics | Charts — revenue, conversion, traffic sources, product trends |
| Team | Salespeople, win rates, assignments |
| Notifications | System alerts and unread events |
| Settings | Store config, scoring rules, agent toggles |

**State management:** React Context (`StoreProvider` in `lib/store.tsx`) — loads all data in parallel on mount via `loadAppData()` in `lib/api.ts`.

---

### 3. Backend API (Node.js + Express) — Port 5000

The single source of truth for all data. Serves both the storefront and admin CRM.

**Core systems:**

| System | Description |
|--------|-------------|
| **Event Tracking** | 19 event types ingested from storefront in real-time |
| **Lead Scoring** | Each event type has a configurable point weight; scores update on every event |
| **Intent Detection** | Score thresholds map to low / medium / high / very_high |
| **Pipeline Automation** | Stage auto-advances based on score, event type, and business rules |
| **Next Best Action** | Recommends what salesperson should do next for each lead |
| **Retell AI** | Generates dynamic call context variables, proxies web-call creation, processes post-call webhooks |
| **Socket.IO** | Broadcasts live updates to admin dashboard |
| **Twilio** | SMS and voice call integration |

---

## Languages & Technologies

| Layer | Language | Runtime/Framework |
|-------|----------|-------------------|
| Storefront | TypeScript | Next.js 14 (App Router) |
| Admin CRM | TypeScript | Vite 5 + React 18 |
| Backend API | TypeScript | Node.js + Express 4 |
| Database | — | MongoDB (Mongoose ODM) |
| Styling (storefront) | CSS / Tailwind CSS 3 | PostCSS |
| Styling (admin) | CSS Modules | — |
| 3D Graphics | GLSL (shaders via Three.js) | Three.js + React Three Fiber |
| Animations | JavaScript | GSAP 3 + ScrollTrigger |
| CMS | — | Prismic (Slice Machine) |

---

## All Libraries Used

### Storefront (`package.json`)

| Library | Version | Purpose |
|---------|---------|---------|
| `next` | 14.2.35 | React framework, App Router, SSR |
| `react` | ^18.3.1 | UI library |
| `react-dom` | ^18.3.1 | DOM renderer |
| `three` | ^0.167.1 | 3D graphics engine |
| `@react-three/fiber` | ^8.17.6 | React renderer for Three.js |
| `@react-three/drei` | ^9.111.3 | Three.js helpers (View, Float, etc.) |
| `@types/three` | ^0.167.2 | TypeScript types for Three.js |
| `gsap` | ^3.12.5 | Animation engine (ScrollTrigger, ScrollTo) |
| `@gsap/react` | ^2.1.1 | React hooks for GSAP |
| `@prismicio/client` | ^7.11.0 | Prismic headless CMS client |
| `@prismicio/next` | ^1.6.0 | Next.js Prismic integration |
| `@prismicio/react` | ^2.8.0 | React components for Prismic |
| `retell-client-js-sdk` | ^3.0.1 | Browser SDK for Retell AI voice calls |
| `zustand` | ^4.5.5 | Lightweight state management |
| `clsx` | ^2.1.1 | Conditional className utility |
| `tailwindcss` | ^3.4.10 | Utility-first CSS framework |
| `typescript` | ^5.4.5 | Static typing |
| `concurrently` | ^8.2.2 | Run Next.js + Slice Machine in parallel |
| `prettier` | ^3.3.3 | Code formatter |

### Admin CRM (`admin/package.json`)

| Library | Version | Purpose |
|---------|---------|---------|
| `react` | ^18.2.0 | UI library |
| `react-dom` | ^18.2.0 | DOM renderer |
| `vite` | ^5.0.0 | Build tool and dev server |
| `@vitejs/plugin-react` | ^4.2.0 | Vite React plugin |
| `lucide-react` | ^0.344.0 | Icon library |
| `recharts` | ^2.12.0 | Chart library (Area, Bar, Line, Pie) |
| `three` | ^0.161.0 | 3D for product previews |
| `@react-three/fiber` | ^8.15.0 | React Three Fiber |
| `@react-three/drei` | ^9.99.0 | Three.js helpers |
| `@fontsource-variable/dm-sans` | ^5.0.0 | DM Sans variable font |
| `@fontsource-variable/manrope` | ^5.0.0 | Manrope variable font |
| `typescript` | ^5.3.0 | Static typing |

### Backend (`backend/package.json`)

| Library | Version | Purpose |
|---------|---------|---------|
| `express` | ^4.18.2 | HTTP server framework |
| `mongoose` | ^8.0.3 | MongoDB ODM |
| `jsonwebtoken` | ^9.0.2 | JWT generation and verification |
| `bcryptjs` | ^2.4.3 | Password hashing |
| `cors` | ^2.8.5 | Cross-origin resource sharing |
| `helmet` | ^7.1.0 | Security HTTP headers |
| `express-rate-limit` | ^7.1.5 | Rate limiting |
| `express-validator` | ^7.0.1 | Request validation |
| `zod` | ^3.22.4 | Schema validation |
| `socket.io` | ^4.6.1 | Real-time WebSocket communication |
| `axios` | ^1.6.5 | HTTP client (Retell API calls) |
| `twilio` | ^4.20.0 | Twilio SDK (SMS, voice) |
| `retell-sdk` | ^2.0.0 | Retell AI server-side SDK |
| `winston` | ^3.11.0 | Logging |
| `date-fns` | ^3.0.6 | Date utilities |
| `uuid` | ^9.0.1 | UUID generation |
| `dotenv` | ^16.3.1 | Environment variable loading |
| `tsx` | ^4.7.0 | TypeScript execution for dev |

---

## API Reference

### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | Public | Create account |
| POST | `/api/auth/login` | Public | Login, get JWT |
| GET | `/api/auth/me` | Bearer | Current user |
| POST | `/api/auth/logout` | Bearer | Logout |

### Events
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/events` | Public | Track a customer event |
| GET | `/api/events` | Bearer | List events |

### Products
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/products` | Public | List all products |
| GET | `/api/products/:id` | Public | Get single product |
| POST | `/api/products` | Admin | Create product |
| PATCH | `/api/products/:id` | Admin | Update product |
| DELETE | `/api/products/:id` | Admin | Delete product |

### AI Voice Agent (Retell)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/retell/v3/create-web-call` | **Public** | Create Retell web call session |
| GET | `/api/agent/context/:userId` | Bearer | Get dynamic context for agent |
| POST | `/api/agent/call` | Bearer | Initiate outbound call |
| GET | `/api/agent/conversations` | Bearer | List conversations |
| GET | `/api/agent/conversations/:id` | Bearer | Single conversation with transcript |

### Fulky Chat
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/fulky/sessions` | Bearer | Open chat session |
| GET | `/api/fulky/context` | Bearer | Get context for session |
| POST | `/api/fulky/messages` | Bearer | Send message |
| POST | `/api/fulky/sessions/:id/close` | Bearer | Close session |

### Admin CRM
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/admin/dashboard` | Admin | KPI metrics |
| GET | `/api/admin/customers` | Admin | All customers |
| GET | `/api/admin/customers/:id` | Admin | Customer detail |
| GET | `/api/admin/leads` | Admin | All leads |
| GET | `/api/admin/leads/:id` | Admin | Lead detail |
| PATCH | `/api/admin/leads/:id` | Admin | Update lead stage |
| GET | `/api/admin/orders` | Admin | All orders |
| PATCH | `/api/admin/orders/:id/status` | Admin | Update fulfillment |
| GET | `/api/admin/abandoned-carts` | Admin | Abandoned carts |
| GET | `/api/admin/score-history` | Admin | Score change log |
| GET | `/api/admin/salespeople` | Admin | Team members |
| GET | `/api/admin/scoring/rules` | Admin | Scoring rule config |
| PATCH | `/api/admin/scoring/rules` | Admin | Update rules |
| GET | `/api/admin/settings` | Admin | Store settings |
| GET | `/api/admin/analytics` | Admin | Analytics data |

### Cart & Orders
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/cart` | Bearer | Get current cart |
| POST | `/api/cart` | Bearer | Update cart |
| DELETE | `/api/cart` | Bearer | Clear cart |
| POST | `/api/orders` | Bearer | Place order |
| GET | `/api/orders` | Bearer | Order history |

### Webhooks
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/webhooks/retell` | HMAC | Retell post-call webhook |

---

## Database Schema

MongoDB collections (via Mongoose):

| Collection | Key Fields |
|-----------|-----------|
| `users` | email, password (hashed), firstName, lastName, role, customerType, isActive |
| `products` | name, slug, legacyProductId, category, price, stock, flavor, status, wholesaleAvailable |
| `orders` | userId, items[], total, fulfillmentStatus, paymentStatus, shippingAddress |
| `carts` | userId or sessionId, items[], subtotal, abandonedAt, recovered |
| `events` | userId, sessionId, eventType, productId, metadata, timestamp |
| `leads` | userId, pipelineStage, intentLevel, score, nextBestAction, assignedTo, lastActiveAt |
| `scorehistory` | userId, change, reason, timestamp |
| `conversations` | userId, callId, transcript[], scoreBefore, scoreAfter, outcome, durationSeconds |
| `agentactions` | userId, actionType, metadata, timestamp |
| `notifications` | type, message, read, createdAt |
| `settings` | key, value |

---

## Lead Scoring System

Every customer event updates their lead score in real time:

| Event | Points |
|-------|--------|
| Product viewed | +3 |
| Same product viewed again | +8 |
| Pricing page viewed | +10 |
| Wholesale pricing viewed | +15 |
| Wishlist item added | +5 |
| Cart created / updated | +15 |
| Checkout started | +20 |
| Purchase completed | +30 |
| Bulk quote submitted | +25 |
| Cart abandoned | -5 |

**Intent levels from score:**

| Score | Intent Level |
|-------|-------------|
| 0–39 | Low |
| 40–59 | Medium |
| 60–79 | High |
| 80+ | Very High |

**Pipeline stages (auto-advance):**

`new` → `qualified` → `high_intent` → `cart_abandoned` / `bulk_quote` → `call_scheduled` → `negotiation` → `closed_won` / `closed_lost`

---

## AI Voice Agent (Fulky)

Fulky is the voice agent embedded in the storefront shop page.

**Architecture:**

```
Browser (FulkyVoiceAssistant.tsx)
    │
    ├── POST /api/retell/v3/create-web-call
    │       Backend proxies to Retell API with RETELL_API_KEY + RETELL_AGENT_ID
    │       Returns: access_token, call_id, transport="gateway", ice_servers[]
    │
    └── RetellWebClient.startCall({
              accessToken,
              transport: "gateway",
              callId,
              iceServers
            })
              │
              └── WebRTC P2P audio connection via Retell's gateway
```

**Post-call processing (webhook):**
- Retell calls `POST /api/webhooks/retell`
- Backend extracts: intent, product interest, recommended action
- Updates: lead score, pipeline stage, conversation transcript
- Socket.IO: broadcasts changes to admin dashboard

**Retell dynamic variables sent per call:**

```json
{
  "customer_name": "Ruthvik",
  "customer_type": "d2c",
  "current_product": "Yuzu Citrus",
  "product_view_count": "4",
  "cart_value": "899",
  "lead_score": "82",
  "intent_level": "high",
  "next_best_action": "Start product conversation",
  "trigger_reason": "Repeated product views"
}
```

---

## Authentication & Roles

**JWT-based auth.** Tokens are issued on login and must be sent as `Authorization: Bearer <token>`.

| Role | Access |
|------|--------|
| `customer` | Storefront only (shop, cart, orders, Fulky) |
| `sales_rep` | Admin CRM read + lead/order actions |
| `sales_manager` | Admin CRM + team management |
| `admin` | Full admin CRM access |
| `super_admin` | Everything including settings and scoring rules |

**Login flow:**
- `customer` role → redirected to `/shop`
- Any other role → redirected to `http://localhost:5173/?token=<jwt>#/dashboard`

---

## Environment Variables

### Storefront (`.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_ADMIN_URL=http://localhost:5173
NEXT_PUBLIC_PRISMIC_ENVIRONMENT=fizzi
```

### Backend (`backend/.env`)
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=<your-mongodb-connection-string>
JWT_SECRET=<strong-random-secret>
JWT_EXPIRES_IN=7d

FRONTEND_URL=http://localhost:3000
ADMIN_FRONTEND_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:3000

RETELL_API_KEY=<from-retellai.com>
RETELL_AGENT_ID=<from-retellai.com>
RETELL_WEBHOOK_SECRET=<optional>

TWILIO_ACCOUNT_SID=<optional>
TWILIO_AUTH_TOKEN=<optional>
TWILIO_PHONE_NUMBER=<optional>

LOG_LEVEL=info
SESSION_SECRET=<strong-random-secret>
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas connection string)
- Retell AI account with an agent set up (for voice features)

### 1. Clone and install

```bash
git clone https://github.com/KenshinCommits/AczenCRM2.git
cd AczenCRM2-Ruthvik

# Install storefront dependencies
npm install

# Install admin dependencies
cd admin && npm install && cd ..

# Install backend dependencies
cd backend && npm install && cd ..
```

### 2. Configure environment

```bash
# Storefront
cp .env.local.example .env.local   # or create manually, see above

# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your MongoDB URI and Retell credentials
```

### 3. Seed the database

```bash
cd backend
npm run seed
```

This creates:
- Admin user: `admin@fizzi.com` / `admin123`
- 10 sample customers
- 5 Fizzi products (Watermelon Crush, Yuzu Citrus, Berry Wave, Mango Splash, Lemon Zest)
- 30 sample orders
- Events, leads, conversations

### 4. Start all three servers

Open three terminal windows:

```bash
# Terminal 1 — Backend API
cd backend
npm run dev        # http://localhost:5000

# Terminal 2 — Admin CRM
cd admin
npm run dev        # http://localhost:5173

# Terminal 3 — Storefront
npm run dev        # http://localhost:3000
```

### 5. Verify

- Storefront: http://localhost:3000
- Shop + Fulky: http://localhost:3000/shop
- Login: http://localhost:3000/login
- Admin CRM: http://localhost:5173 (log in through /login first)
- API health: http://localhost:5000/health

---

## Default Credentials

| Email | Password | Role | Access |
|-------|----------|------|--------|
| `admin@fizzi.com` | `admin123` | admin | Full admin CRM |

Register any new account to get `customer` role and access the shop.

---

## Real-time Events (Socket.IO)

The backend broadcasts these events to connected admin clients:

| Event | Trigger |
|-------|---------|
| `customer_online` | User logs in or visits |
| `product_viewed` | Any product view event |
| `cart_updated` | Cart add/remove/change |
| `cart_abandoned` | Cart abandoned detection |
| `lead_score_changed` | Any score update |
| `lead_stage_changed` | Pipeline stage transition |
| `agent_call_started` | Retell call begins |
| `agent_call_completed` | Retell call ends + analyzed |
| `order_created` | New order placed |

---

## Build for Production

```bash
# Storefront
npm run build
npm start

# Backend
cd backend
npm run build    # tsc compile to dist/
npm start        # node dist/server.js

# Admin
cd admin
npm run build    # Vite build to dist/
```

---

## License

MIT — built on top of the Fizzi tutorial course by Prismic.
