<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# FIZZY / AczenCRM2 — Agent Handbook & Context

Welcome, Agent. This document provides the essential architectural context, codebase map, critical constraints, and operational guidelines for working on the **FIZZY** platform. Read this before making changes to avoid breaking 3D canvases, GSAP pin spacers, or subproject boundaries.

---

## 1. Project Overview & Multi-Project Topology

This repository (`AczenCRM2`) is an integrated platform for FIZZY, a modern craft soda and sparkling fruit beverage brand:

1. **Landing Page (`/` and `src/`)**:
   - Built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**.
   - Features rich 3D graphics (**Three.js**, `@react-three/fiber`, `@react-three/drei`) and scroll animations (**GSAP**, `ScrollTrigger`, `ScrollToPlugin`).
   - Slices: `Hero` $\rightarrow$ `SkyDive` $\rightarrow$ `Carousel` $\rightarrow$ `AlternatingText` $\rightarrow$ `BigText`.
   - Runs on **Port 3000** (`npm run dev`).

2. **Admin CRM Dashboard (`admin/`)**:
   - Built with **Vite**, **React**, **Tailwind CSS**, and **Lucide React**.
   - Manages customers, inventory, sales analytics, and order fulfillment.
   - Decoupled from Next.js with its own `package.json` and `tsconfig.json`.
   - Runs on **Port 5173** (`cd admin && npm run dev`).

3. **Backend API (`backend/`)**:
   - Built with **Node.js**, **Express**, **TypeScript**, and **MongoDB (Mongoose)**.
   - Handles customer accounts, cart sessions, checkout pipelines, product data, and AI sales agent chat.
   - Runs on **Port 5000** (`cd backend && npm run dev`).

---

## 2. Landing Page Architecture & Slice Sequence

The main landing page is defined in `src/app/page.tsx` and renders 5 consecutive sections:

### 1. Hero (`src/slices/Hero/`)
- Renders the floating 3D soda cans, high-impact brand headline, and introductory CTA.
- Uses `@react-three/drei`'s `<View>` to render into the global background canvas (`src/components/ViewCanvas.tsx`).

### 2. SkyDive (`src/slices/SkyDive/`)
- **Pinned experience**: Pins for `+=2000px` of vertical scroll.
- Watermelon explodes into 3D halves to reveal the FIZZY can, diving into the clouds as the user scrolls.
- Renders inside an asynchronous R3F `<View>`.

### 3. Carousel (`src/slices/Carousel/`)
- **Pinned storefront experience**:
  - Automatically snaps into viewport alignment (`top 80%` $\rightarrow$ `top top`).
  - Pins for `+=2400px` of scroll (`start: "top top"`, `end: "+=2400"`).
  - Normal vertical scroll scrubs forward and backward through 4 flavors:
    1. **Watermelon Crush** (`#e44d4d`)
    2. **Yuzu Citrus Fizz** (`#f3cc36`)
    3. **Berry Wave** (`#9255ad`)
    4. **Mango Splash** (`#f47b20`)
  - Features `CanScene3D` (Three.js cylinder roll physics), `FluidRibbon` (canvas liquid distortion wave), interactive arrows/pagination dots, and slide-out side drawers (`basket`, `menu`, `details`, `story`).
  - Scoped styling in `src/slices/Carousel/storefront.css`.

### 4. AlternatingText (`src/slices/AlternatingText/`)
- Pinned section showcasing health benefits and ingredients with a 3D can bundle in an R3F `<View>`.

### 5. BigText (`src/slices/BigText/`)
- Energetic horizontal marquee banner.

---

## 3. Critical Rules of Engagement for Agents

### Rule 1: Do Not Modify Unrelated Slices
When tasked with updating or fixing a specific slice (e.g., `Carousel`), do **not** touch or alter other slices (`Hero`, `SkyDive`, `AlternatingText`, `BigText`) or global layouts unless explicitly instructed.

### Rule 2: ScrollTrigger Pinning & Asynchronous R3F Views
- Slices like `SkyDive` and `AlternatingText` render their 3D scenes inside `@react-three/drei` `<View>` components that mount asynchronously *after* the initial DOM render.
- When `SkyDive` pins, it creates a 2000px `.pin-spacer` above subsequent elements.
- **Always call `ScrollTrigger.sort()` and `ScrollTrigger.refresh()`** whenever initializing or modifying pinned ScrollTriggers to ensure GSAP respects the true DOM order and pin spacers.
- In `Carousel/index.tsx`, a 200ms delayed sort/refresh is scheduled to guarantee preceding slices have registered their pin spacers.

### Rule 3: Container Overflow Rules
- **NEVER** add `overflow: hidden` to a container whose child is pinned by ScrollTrigger (such as `.story-container`), as this prevents the `.pin-spacer` height expansion and breaks page scrolling.
- Only apply `overflow: hidden` to the inner viewport-locked element (such as `.story-stage`).

### Rule 4: Decoupled Subproject Boundaries
- Root `tsconfig.json` explicitly excludes `backend` and `admin`. Do not remove these exclusions or import backend Node/Express modules into client Next.js components.
- Admin dependencies stay in `admin/package.json`; backend dependencies stay in `backend/package.json`.

### Rule 5: Styling Conventions
- `src/slices/Carousel/` uses its own scoped CSS in `src/slices/Carousel/storefront.css`. Do not add conflicting utility classes or global resets that override this storefront aesthetic.
- The rest of the site uses Tailwind CSS.

### Rule 6: Type Safety Verification
- Always execute `npx tsc --noEmit` from the root directory after editing TypeScript files. Ensure there are 0 errors.

---

## 4. Key State & Storage Contracts

- **Shopping Basket**: Saved to `window.localStorage` under the key `fizzy-basket-v1`. Array of `{ id: string, quantity: number }`.
- **Backend API URL**: Configured via `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:5000/api`).

---

## 5. Development Cheat Sheet

```bash
# 1. Landing Page (Next.js)
npm run dev                 # Starts Next.js on http://localhost:3000
npx tsc --noEmit           # Typecheck Next.js codebase

# 2. Admin Panel (Vite)
cd admin && npm run dev     # Starts Vite admin on http://localhost:5173

# 3. Backend (Express + MongoDB)
cd backend && npm run dev   # Starts API on http://localhost:5000
```
