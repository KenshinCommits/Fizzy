# FIZZY Project Status & Implementation Roadmap

> **Current Branch**: `LandingPage`  
> **Status Date**: September 30, 2026  
> **Stack**: Next.js 14 App Router, Three.js, React Three Fiber (`@react-three/fiber` & `@react-three/drei`), GSAP (ScrollTrigger & ScrollToPlugin), Tailwind CSS, Vite (Admin), Express + MongoDB (Backend)

---

## 1. Executive Summary

FIZZY is an end-to-end modern beverage brand platform consisting of:
1. **Interactive 3D Landing Page** (`src/`): A scroll-driven, cinematic WebGL/GSAP showcase with realistic 3D can physics, fluid liquid ribbon simulations, and an interactive pinned storefront carousel.
2. **Operations & CRM Admin Panel** (`admin/`): A Vite + React dashboard wired to live MongoDB for managing customers, orders, inventory, sales analytics, and CRM workflows.
3. **AI Sales & Customer Backend** (`backend/`): An Express + TypeScript + MongoDB API powering cart sessions, checkout pipelines, product catalog management, and AI customer agents.

---

## 2. Architecture & Monorepo Topology

```
AczenCRM2/
├── src/                          # Next.js 14 App Router Landing Page
│   ├── app/                      # Page routes & layout (Main canvas View.Port)
│   ├── components/               # 3D CanScene, FluidRibbon, FloatingCan, ViewCanvas
│   ├── slices/                   # Prismic & Custom Animation Slices
│   │   ├── Hero/                 # 3D Can hero entrance & typography
│   │   ├── SkyDive/              # Pinned watermelon dive & can skydiving
│   │   ├── Carousel/             # Pinned 4-flavor storefront carousel & drawers
│   │   ├── AlternatingText/      # Pinned 3D can bundle with alternating features
│   │   └── BigText/              # Continuous marquee brand statement
│   └── styles/                   # Global fonts and styles
├── admin/                        # Isolated Vite + React Admin CRM Dashboard
│   ├── src/pages/                # Dashboard, Customers, Orders, Inventory, Settings
│   └── src/services/             # API client connected to backend
├── backend/                      # Express + TypeScript + MongoDB REST API
│   ├── src/controllers/          # Orders, customers, carts, products, AI agents
│   ├── src/models/               # Mongoose schemas (Customer, Order, Product, Cart)
│   └── src/routes/               # Modular Express API endpoints
└── public/                       # 3D GLTF models, HDR environment maps, can textures
```

---

## 3. Slice-by-Slice Landing Page Status

| Slice | Visual / Functional Goal | Status | Key Technologies & Details |
|---|---|---|---|
| **Hero** | Initial brand impression, floating 3D cans, header wordmark, CTA | **Completed** | Three.js, `@react-three/fiber`, GSAP stagger intro. |
| **SkyDive** | Watermelon explosion into FIZZY can dive across 2000px pinned scroll | **Completed** | Pinned ScrollTrigger (`+=2000`), R3F `<View>`, scrubbed trajectory and rotation. |
| **Carousel** | Pinned storefront experience scrolling through 4 flavors with 3D can roll | **Completed / Fixed** | Pinned ScrollTrigger (`+=2400`), entrance snap (`top 80%`), `FluidRibbon`, `CanScene3D`, slide-out cart & story drawers. |
| **AlternatingText**| Alternating prebiotic & natural ingredient highlights with 3D can bundle | **Completed** | Pinned ScrollTrigger (`+=1731`), R3F `<View>`, staggered scroll text. |
| **BigText** | High-energy bold typography marquee banner | **Completed** | Responsive CSS/GSAP marquee. |

---

## 4. Carousel Deep-Dive & Recent Fixes

The Carousel section (`src/slices/Carousel/`) recently underwent major architectural improvements:

### Key Requirements Implemented
1. **Viewport Snapping**: 
   - An entrance ScrollTrigger snaps the section into perfect alignment (`top top`) when scrolled past `top 80%`, preventing awkward mid-page positioning.
2. **Pinned Scroll Experience**:
   - The stage (`.story-stage`) is pinned for `+=2400px` of vertical scroll.
   - Normal downward scrolling scrubs seamlessly forward through the 4 flavors:
     1. **Watermelon Crush** (`#e44d4d`)
     2. **Yuzu Citrus Fizz** (`#f3cc36`)
     3. **Berry Wave** (`#9255ad`)
     4. **Mango Splash** (`#f47b20`)
   - Normal upward scrolling scrubs backwards symmetrically.
   - After the 4th flavor, the pin releases cleanly into `AlternatingText`.
3. **Synchronized Controls**:
   - Navigation arrows, pagination dots, touch swipes, and keyboard arrow keys calculate the exact scroll position within the pinned range and smoothly scroll to it using GSAP's `ScrollToPlugin`.
4. **Visual Cleanup**:
   - Removed all distracting floating fruit overlay images and redundant particle loops, keeping focus on the 3D can cylinder roll physics, dynamic typography, and fluid diagonal ribbon wave.
5. **ScrollTrigger Pin Spacer Coordination**:
   - Because `SkyDive` uses an asynchronous R3F `<View>` that adds a 2000px pin spacer, `Carousel` incorporates `ScrollTrigger.sort()` and a delayed refresh to guarantee accurate start/end coordinates (4637px–7037px on desktop).
   - Removed `overflow: hidden` from `.story-container` to prevent ScrollTrigger pin spacer clipping.

---

## 5. Admin Dashboard (`admin/`) & Backend API (`backend/`) Status

### Admin Dashboard
- **Port**: `5173` (Vite dev server)
- **Status**: Complete & operational.
- **Features**:
  - Live analytics overview (Total Revenue, Orders, Active Customers, Low Stock Alerts).
  - Customer directory with profile cards and purchase histories.
  - Real-time order fulfillment pipeline and status toggle.
  - Inventory management with stock levels and reorder triggers.

### Backend API & Database
- **Port**: `5000` (Node/Express)
- **Database**: MongoDB (configured via `MONGODB_URI` in `.env`).
- **Endpoints**:
  - `GET /api/health`: Health check and DB status.
  - `GET /api/products`: Full product catalog including pricing, nutritional info, stock.
  - `POST /api/cart`: Session-based shopping cart management.
  - `POST /api/orders`: Order creation and status tracking.
  - `POST /api/agent/chat`: AI Sales & Customer Support conversational agent.

---

## 6. Verification & Health Checks

- **TypeScript Compilation**:
  - Root Next.js: `npx tsc --noEmit` $\rightarrow$ **0 errors (PASS)**.
- **Active Ports & Running Processes**:
  - Port `3000`: Next.js development server (Active).
  - Port `5000`: Backend API (Available).
  - Port `5173`: Admin Vite dev server (Available).
- **Browser Automation Verification**:
  - Chrome DevTools MCP verified pinned ScrollTrigger states on `http://localhost:3000/`.
  - Desktop and mobile viewports verified for responsive layout and touch gestures.

---

## 7. Immediate Next Steps / Roadmap

1. **Cart Checkout Handshake**:
   - Connect the Carousel slide-out basket (`fizzy-basket-v1`) to the backend `/api/orders` endpoint for live customer order placement.
2. **Production Asset Optimization**:
   - Ensure GLTF cans and HDR environment maps use compressed KTX2/WebP formats for ultra-fast initial loads on low-bandwidth networks.
3. **End-to-End Automated Test Suite**:
   - Add Cypress or Playwright tests for cross-slice pinned scroll choreography.
