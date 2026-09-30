# FIZZY | Watermelon Crush Landing Page

A highly polished, immersive, scroll-driven Next.js 15 product landing page for **FIZZY Craft Soda**, featuring 3D product rendering, GSAP ScrollTrigger cinematography, and interactive Framer Motion elements.

## Tech Stack
- Next.js 15 (App Router)
- React
- TypeScript
- Tailwind CSS (v4)
- Framer Motion
- GSAP + ScrollTrigger
- Three.js / React Three Fiber / Drei
- Lenis (Smooth Scrolling)

## Quick Start
```bash
npm install
npm run dev
```

Visit `http://localhost:3000` to view the immersive experience.

## Features
- **Cinematic 3D Scroll Flow:** GSAP ScrollTrigger seamlessly maneuvers the 3D `FizzyCan.glb` through the camera's FOV as you scroll through the page.
- **Interactive Watermelon:** A custom mouse-following, spring-animated slice moment built with Framer Motion.
- **Performant Rendering:** Idle GSAP timelines bound to document scroll and off-thread smooth scrolling using Lenis.
