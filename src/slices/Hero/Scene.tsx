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
  const duoGroupRef = useRef<Group>(null);

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
      !duoGroupRef.current ||
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

    gsap.set(can3Ref.current.position, { x: -0.28, y: 6, z: 2 });
    gsap.set(can3Ref.current.scale, { x: 0, y: 0, z: 0 });

    gsap.set(can4Ref.current.position, { x: 0.28, y: 6, z: 2 });
    gsap.set(can4Ref.current.scale, { x: 0, y: 0, z: 0 });

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

    // 1. Initial 2 Cans Rotate Around Text Phase (t = 0 to 3.0): Can 1 & Can 2 orbit 360° around the center text
    scrollTl.to(
      duoGroupRef.current.rotation,
      {
        y: Math.PI * 2,
        duration: 3.0,
        ease: "none",
      },
      0,
    );

    // 2. Enter 4-Cans Scene / Cluster Phase (t = 3.2 to 5.6): Cans 3 & 4 fly in from above; 4 cans cluster in center with Fizzy logo facing forward
    scrollTl
      // Can 1 (Watermelon) -> cluster bottom-left
      .to(can1Ref.current.position, { x: -0.32, y: -0.32, z: 0.2, duration: 2.4, ease: "power2.out" }, 3.2)
      .to(can1Ref.current.rotation, { x: 0.08, y: 0.1, z: 0.14, duration: 2.4, ease: "power2.out" }, 3.2)
      .to(can1Ref.current.scale, { x: 1.6, y: 1.6, z: 1.6, duration: 2.4, ease: "power2.out" }, 3.2)

      // Can 2 (Yuzu / Lemon Lime) -> cluster top-right
      .to(can2Ref.current.position, { x: 0.32, y: 0.32, z: -0.15, duration: 2.4, ease: "power2.out" }, 3.2)
      .to(can2Ref.current.rotation, { x: -0.08, y: -0.1, z: -0.14, duration: 2.4, ease: "power2.out" }, 3.2)
      .to(can2Ref.current.scale, { x: 1.6, y: 1.6, z: 1.6, duration: 2.4, ease: "power2.out" }, 3.2)

      // Can 3 (Berry Wave / Grape) -> flies in from above to cluster top-left
      .to(can3Ref.current.position, { x: -0.28, y: 0.35, z: -0.12, duration: 2.4, ease: "power2.out" }, 3.2)
      .to(can3Ref.current.rotation, { x: 0.12, y: 0.15, z: -0.1, duration: 2.4, ease: "power2.out" }, 3.2)
      .to(can3Ref.current.scale, { x: 1.6, y: 1.6, z: 1.6, duration: 2.4, ease: "power2.out" }, 3.2)

      // Can 4 (Mango Splash) -> flies in from above to cluster bottom-right
      .to(can4Ref.current.position, { x: 0.28, y: -0.35, z: 0.18, duration: 2.4, ease: "power2.out" }, 3.2)
      .to(can4Ref.current.rotation, { x: -0.12, y: -0.15, z: 0.15, duration: 2.4, ease: "power2.out" }, 3.2)
      .to(can4Ref.current.scale, { x: 1.6, y: 1.6, z: 1.6, duration: 2.4, ease: "power2.out" }, 3.2);

    // 3. Spread Phase (t = 6.0 to 8.8): Cans smoothly spread to 2 on left, 2 on right, Fizzy logo clearly facing forward
    scrollTl
      // Left Pair: Can 1 & Can 3
      .to(can1Ref.current.position, { x: -1.35, y: -0.38, z: 0.1, duration: 2.8, ease: "power2.out" }, 6.0)
      .to(can1Ref.current.rotation, { x: 0.05, y: 0.15, z: 0.12, duration: 2.8, ease: "power2.out" }, 6.0)

      .to(can3Ref.current.position, { x: -1.05, y: 0.42, z: -0.2, duration: 2.8, ease: "power2.out" }, 6.0)
      .to(can3Ref.current.rotation, { x: -0.05, y: 0.2, z: -0.1, duration: 2.8, ease: "power2.out" }, 6.0)

      // Right Pair: Can 2 & Can 4
      .to(can2Ref.current.position, { x: 1.05, y: 0.42, z: -0.2, duration: 2.8, ease: "power2.out" }, 6.0)
      .to(can2Ref.current.rotation, { x: -0.05, y: -0.2, z: 0.1, duration: 2.8, ease: "power2.out" }, 6.0)

      .to(can4Ref.current.position, { x: 1.35, y: -0.38, z: 0.1, duration: 2.8, ease: "power2.out" }, 6.0)
      .to(can4Ref.current.rotation, { x: 0.05, y: -0.15, z: -0.12, duration: 2.8, ease: "power2.out" }, 6.0);

    // 4. Merge Down and Fade Out Phase (t = 9.2 to 11.5): Cans merge together in center, plunge down through bottom, and fade out
    scrollTl
      .to([can1Ref.current.position, can2Ref.current.position, can3Ref.current.position, can4Ref.current.position], {
        x: 0,
        y: -5.5,
        z: -1.0,
        duration: 2.3,
        ease: "power2.in",
      }, 9.2)
      .to([can1Ref.current.rotation, can2Ref.current.rotation, can3Ref.current.rotation, can4Ref.current.rotation], {
        x: -0.4,
        duration: 2.3,
        ease: "power2.in",
      }, 9.2)
      .to([can1Ref.current.scale, can2Ref.current.scale, can3Ref.current.scale, can4Ref.current.scale], {
        x: 0,
        y: 0,
        z: 0,
        duration: 2.3,
        ease: "power2.in",
      }, 9.2);
  });

  return (
    <group ref={groupRef}>
      <group ref={duoGroupRef}>
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
