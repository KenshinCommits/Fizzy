'use client';

import React, { useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { ProductCan } from './ProductCan';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function SceneManager() {
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cameraRef.current) return;

    // Create a master timeline tied to the document scroll
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: document.body,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1, // Smooth scrubbing
      },
    });

    // We can define "keyframes" based on scroll percentages or specific sections.
    // Assuming 5 main sections: Hero, Story, Watermelon Crush, Flavours, Benefits.
    
    // 1. Initial State -> Story
    tl.to(cameraRef.current.position, {
      z: 10,
      y: 0,
      x: -4,
      ease: 'power1.inOut',
    }, 0);

    // 2. Story -> Watermelon Crush
    tl.to(cameraRef.current.position, {
      z: 6,
      y: 2,
      x: 0,
      ease: 'power1.inOut',
    }, 1);

    // 3. Watermelon Crush -> Flavours
    tl.to(cameraRef.current.position, {
      z: 12,
      y: 0,
      x: 5,
      ease: 'power1.inOut',
    }, 2);

    // 4. Flavours -> Benefits
    tl.to(cameraRef.current.position, {
      z: 8,
      y: -2,
      x: 0,
      ease: 'power1.inOut',
    }, 3);

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <div ref={containerRef} className="fixed top-0 left-0 w-full h-full pointer-events-none z-10">
      <Canvas dpr={[1, 2]}>
        <PerspectiveCamera makeDefault ref={cameraRef} position={[0, 0, 8]} fov={45} />
        <ProductCan />
      </Canvas>
    </div>
  );
}
