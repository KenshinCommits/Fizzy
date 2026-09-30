"use client";

import React, { forwardRef, useMemo } from 'react';
import { useGLTF, useTexture } from "@react-three/drei";
import * as THREE from "three";

useGLTF.preload("/FizzyCan.glb");

const flavorTextures = {
  lemonLime: "/labels/FizzyLemonTexture.png",
  grape: "/labels/FizzyGrapeTexture.png",
  blackCherry: "/labels/watermelon-crush.png", // We will replace these later, but for now map them so it builds
  strawberryLemonade: "/labels/watermelon-crush.png",
  watermelon: "/labels/watermelon-crush.png",
  mango: "/labels/FizzyMangoTexture.png"
};

export type SodaCanProps = {
  flavor?: keyof typeof flavorTextures;
  scale?: number;
};

export function SodaCan({
  flavor = "watermelon",
  scale = 2,
  ...props
}: SodaCanProps) {
  const { scene } = useGLTF("/FizzyCan.glb");
  const texture = useTexture(flavorTextures[flavor] || flavorTextures.watermelon);

  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.flipY = false;

    const uOffset = 0.5;

    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry = child.geometry.clone();
        child.geometry.computeBoundingBox();
        const bbox = child.geometry.boundingBox;
        if (!bbox) return;

        const minY = bbox.min.y;
        const maxY = bbox.max.y;
        const height = maxY - minY;

        const isBody = minY > -0.068 && maxY < 0.065 && height > 0.1;

        if (isBody) {
          const posAttr = child.geometry.attributes.position;
          const uvArray = new Float32Array(posAttr.count * 2);

          for (let i = 0; i < posAttr.count; i++) {
            const x = posAttr.getX(i);
            const y = posAttr.getY(i);
            const z = posAttr.getZ(i);

            let theta = Math.atan2(z, x);
            let u = (theta + Math.PI) / (2 * Math.PI);
            u = (u + uOffset) % 1.0;
            u = 1.0 - u;

            let v = 1.0 - ((y - minY) / height);

            uvArray[i * 2] = u;
            uvArray[i * 2 + 1] = v;
          }

          child.geometry.setAttribute('uv', new THREE.BufferAttribute(uvArray, 2));

          child.material = new THREE.MeshStandardMaterial({
            map: texture,
            roughness: 0.3,
            metalness: 0.1,
            transparent: true,
            alphaTest: 0.05
          });
        } else {
          if (child.material) {
            const mat = child.material.clone();
            mat.metalness = 0.9;
            mat.roughness = 0.2;
            child.material = mat;
          }
        }
      }
    });

    return clone;
  }, [scene, texture]);

  return (
    <group {...props} dispose={null} scale={scale} rotation={[0, -Math.PI, 0]}>
      <primitive object={clonedScene} scale={5} />
    </group>
  );
}
