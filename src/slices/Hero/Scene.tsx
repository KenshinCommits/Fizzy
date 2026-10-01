"use client";

import { useRef } from "react";
import { Environment, OrbitControls } from "@react-three/drei";
import { Group } from "three";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import FloatingCan from "@/components/FloatingCan";
import { useStore } from "@/hooks/useStore";

gsap.registerPlugin(useGSAP, ScrollTrigger);

type Props = {};

export default function Scene({}: Props) {
  const isReady = useStore((state) => state.isReady);

  const can1Ref = useRef<Group>(null);
  const can2Ref = useRef<Group>(null);
  const can3Ref = useRef<Group>(null);
  const can4Ref = useRef<Group>(null);

  const can1GroupRef = useRef<Group>(null);
  const can2GroupRef = useRef<Group>(null);

  const groupRef = useRef<Group>(null);

  const FLOAT_SPEED = 1.5;

  useGSAP(() => {
    if (
      !can1Ref.current ||
      !can2Ref.current ||
      !can3Ref.current ||
      !can4Ref.current ||
      !can1GroupRef.current ||
      !can2GroupRef.current ||
      !groupRef.current
    )
      return;

    isReady();

    // Set can starting location (Scale 1 on FloatingCan, controlled via GSAP)
    gsap.set(can1Ref.current.position, { x: -1.5, y: 0, z: 0 });
    gsap.set(can1Ref.current.rotation, { z: -0.5 });
    gsap.set(can1Ref.current.scale, { x: 2.5, y: 2.5, z: 2.5 });

    gsap.set(can2Ref.current.position, { x: 1.5, y: 0, z: 0 });
    gsap.set(can2Ref.current.rotation, { z: 0.5 });
    gsap.set(can2Ref.current.scale, { x: 2.5, y: 2.5, z: 2.5 });

    gsap.set(can3Ref.current.position, { x: -0.5, y: 6, z: 2 });
    gsap.set(can3Ref.current.scale, { x: 1.65, y: 1.65, z: 1.65 });

    gsap.set(can4Ref.current.position, { x: 0.5, y: 6, z: 2 });
    gsap.set(can4Ref.current.scale, { x: 1.65, y: 1.65, z: 1.65 });

    const introTl = gsap.timeline({
      defaults: {
        duration: 3,
        ease: "back.out(1.4)",
      },
    });

    if (window.scrollY < 20) {
      introTl
        .from(can1GroupRef.current.position, { y: -5, x: 1 }, 0)
        .from(can1GroupRef.current.rotation, { z: 3 }, 0)
        .from(can2GroupRef.current.position, { y: 5, x: 1 }, 0)
        .from(can2GroupRef.current.rotation, { z: 3 }, 0);
    }

    const scrollTl = gsap.timeline({
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "bottom bottom",
        scrub: 1.5,
      },
    });

    // 1. Cluster Phase (t = 0 to 3.0): 4 cans form a tight diamond cluster in center
    scrollTl
      // Can 1 (Watermelon) -> cluster bottom-left
      .to(can1Ref.current.position, { x: -0.32, y: -0.32, z: 0.2, duration: 3.0, ease: "power2.inOut" }, 0)
      .to(can1Ref.current.rotation, { x: 0.08, y: Math.PI * 0.4, z: 0.14, duration: 3.0, ease: "power2.inOut" }, 0)
      .to(can1Ref.current.scale, { x: 1.6, y: 1.6, z: 1.6, duration: 3.0, ease: "power2.inOut" }, 0)

      // Can 2 (Yuzu / Lemon Lime) -> cluster top-right
      .to(can2Ref.current.position, { x: 0.32, y: 0.32, z: -0.15, duration: 3.0, ease: "power2.inOut" }, 0)
      .to(can2Ref.current.rotation, { x: -0.08, y: -Math.PI * 0.4, z: -0.14, duration: 3.0, ease: "power2.inOut" }, 0)
      .to(can2Ref.current.scale, { x: 1.6, y: 1.6, z: 1.6, duration: 3.0, ease: "power2.inOut" }, 0)

      // Can 3 (Berry Wave / Grape) -> cluster top-left
      .to(can3Ref.current.position, { x: -0.28, y: 0.35, z: -0.12, duration: 3.0, ease: "power2.inOut" }, 0)
      .to(can3Ref.current.rotation, { x: 0.12, y: Math.PI * 0.3, z: -0.1, duration: 3.0, ease: "power2.inOut" }, 0)
      .to(can3Ref.current.scale, { x: 1.6, y: 1.6, z: 1.6, duration: 3.0, ease: "power2.inOut" }, 0)

      // Can 4 (Mango Splash) -> cluster bottom-right
      .to(can4Ref.current.position, { x: 0.28, y: -0.35, z: 0.18, duration: 3.0, ease: "power2.inOut" }, 0)
      .to(can4Ref.current.rotation, { x: -0.12, y: -Math.PI * 0.3, z: 0.15, duration: 3.0, ease: "power2.inOut" }, 0)
      .to(can4Ref.current.scale, { x: 1.6, y: 1.6, z: 1.6, duration: 3.0, ease: "power2.inOut" }, 0);

    // 2. Spread Phase (t = 4.2 to 6.8): Cans smoothly spread to 2 on left, 2 on right
    scrollTl
      // Left Pair: Can 1 & Can 3
      .to(can1Ref.current.position, { x: -1.35, y: -0.38, z: 0.1, duration: 2.6, ease: "power2.out" }, 4.2)
      .to(can1Ref.current.rotation, { x: 0.05, y: Math.PI * 0.8, z: 0.16, duration: 2.6, ease: "power2.out" }, 4.2)

      .to(can3Ref.current.position, { x: -1.05, y: 0.42, z: -0.2, duration: 2.6, ease: "power2.out" }, 4.2)
      .to(can3Ref.current.rotation, { x: -0.05, y: Math.PI * 0.6, z: -0.12, duration: 2.6, ease: "power2.out" }, 4.2)

      // Right Pair: Can 2 & Can 4
      .to(can2Ref.current.position, { x: 1.05, y: 0.42, z: -0.2, duration: 2.6, ease: "power2.out" }, 4.2)
      .to(can2Ref.current.rotation, { x: -0.05, y: -Math.PI * 0.6, z: 0.12, duration: 2.6, ease: "power2.out" }, 4.2)

      .to(can4Ref.current.position, { x: 1.35, y: -0.38, z: 0.1, duration: 2.6, ease: "power2.out" }, 4.2)
      .to(can4Ref.current.rotation, { x: 0.05, y: -Math.PI * 0.8, z: -0.16, duration: 2.6, ease: "power2.out" }, 4.2);

    // 3. Merge and Fade Out Phase (t = 7.8 to 10.0): Cans all merge back to center and scale down to 0 before exiting
    scrollTl
      .to([can1Ref.current.position, can2Ref.current.position, can3Ref.current.position, can4Ref.current.position], {
        x: 0,
        y: 0,
        z: -2.0,
        duration: 2.2,
        ease: "power2.in",
      }, 7.8)
      .to([can1Ref.current.scale, can2Ref.current.scale, can3Ref.current.scale, can4Ref.current.scale], {
        x: 0,
        y: 0,
        z: 0,
        duration: 2.2,
        ease: "power2.in",
      }, 7.8);
  });

  return (
    <group ref={groupRef}>
      <group ref={can1GroupRef}>
        <FloatingCan
          ref={can1Ref}
          flavor="watermelon"
          floatSpeed={FLOAT_SPEED}
          scale={1}
        />
      </group>
      <group ref={can2GroupRef}>
        <FloatingCan
          ref={can2Ref}
          flavor="lemonLime"
          floatSpeed={FLOAT_SPEED}
          scale={1}
        />
      </group>

      <FloatingCan ref={can3Ref} flavor="grape" floatSpeed={FLOAT_SPEED} scale={1} />

      <FloatingCan
        ref={can4Ref}
        flavor="mango"
        floatSpeed={FLOAT_SPEED}
        scale={1}
      />

      <Environment files="/hdr/lobby.hdr" environmentIntensity={1.5} />
    </group>
  );
}
