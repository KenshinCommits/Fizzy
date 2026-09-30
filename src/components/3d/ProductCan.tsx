'use client';

import React, { useRef } from 'react';
import { useGLTF, Environment } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function ProductCan({ scrollRef }: { scrollRef?: React.MutableRefObject<number> }) {
  const { scene } = useGLTF('/FizzyCan.glb');
  const canRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (canRef.current) {
      // Basic idle rotation
      canRef.current.rotation.y += delta * 0.2;

      // In a more complex setup, we could tie the exact rotation/scale 
      // to scrollRef.current, but typically GSAP ScrollTrigger animating the camera
      // or object directly works better. We'll leave idle animation here.
    }
  });

  return (
    <group ref={canRef} dispose={null}>
      {/* Ambient and directional lights for glossy pop */}
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 10, 5]} intensity={2} color="#ffffff" />
      <directionalLight position={[-5, 5, -5]} intensity={1} color="#CAF4FF" />
      
      {/* Environment for glossy reflections */}
      <Environment preset="city" />

      {/* Center the can */}
      <primitive object={scene} scale={[2, 2, 2]} position={[0, -2, 0]} />
    </group>
  );
}

useGLTF.preload('/FizzyCan.glb');
