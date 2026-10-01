"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

import styles from "./Product3D.module.css";

type Product = { id: string; name: string; tone?: string };

export function Product3D({ product }: { product: Product }) {
  const host = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!host.current) return;
    const element = host.current;
    let disposed = false;
    let labelTexture: THREE.CanvasTexture | null = null;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      setFailed(true);
      return;
    }
    setFailed(false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    element.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(33, 1, 0.1, 100);
    camera.position.set(0, 1.05, 6.7);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.enableDamping = true;
    controls.autoRotate = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    controls.autoRotateSpeed = 0.6;
    controls.target.set(0, 0.05, 0);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x839d9f, 3));
    const key = new THREE.DirectionalLight(0xffffff, 5);
    key.position.set(3, 5, 5);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xace2e1, 3);
    fill.position.set(-4, 2, 0);
    scene.add(fill);

    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1024;
    const context = canvas.getContext("2d");
    if (context) {
      context.fillStyle = product.tone || "#159bd7";
      context.fillRect(0, 0, 1024, 1024);
      context.strokeStyle = "#ffffff30";
      context.lineWidth = 2;
      for (let index = 0; index < 8; index++) {
        context.beginPath();
        context.arc(750, 750, 80 + index * 45, 0, Math.PI * 2);
        context.stroke();
      }
      context.textAlign = "center";
      context.fillStyle = "#fffdf9";
      context.font = "900 italic 170px Arial";
      context.fillText("fizzi", 512, 470);
      context.font = "bold 34px Arial";
      context.fillText(product.name.toUpperCase(), 512, 670);
      context.font = "18px Arial";
      context.fillText("SPARKLING · REFRESHING · 330 ml", 512, 835);
      labelTexture = new THREE.CanvasTexture(canvas);
      labelTexture.colorSpace = THREE.SRGBColorSpace;
    }

    new GLTFLoader().load("/models/fizzi-can.glb", (gltf) => {
      if (disposed) return;
      const model = gltf.scene;
      model.rotation.z = -0.09;
      model.traverse((object) => {
        if (object instanceof THREE.Mesh && object.name === "Can_Body") object.material.color.set(product.tone || "#159bd7");
      });
      const label = new THREE.Mesh(
        new THREE.CylinderGeometry(0.512, 0.512, 1.94, 96, 1, true),
        new THREE.MeshStandardMaterial({ map: labelTexture ?? undefined, metalness: 0.22, roughness: 0.4 }),
      );
      label.rotation.y = Math.PI;
      model.add(label);
      scene.add(model);
    }, undefined, () => setFailed(true));

    const resize = () => {
      const width = element.clientWidth;
      const height = element.clientHeight;
      renderer.setSize(width, height);
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    resize();
    renderer.setAnimationLoop(() => { controls.update(); renderer.render(scene, camera); });
    return () => {
      disposed = true;
      observer.disconnect();
      renderer.setAnimationLoop(null);
      controls.dispose();
      labelTexture?.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [product.id, product.name, product.tone]);

  return <div className={styles.viewer}><div ref={host} className={styles.canvas} />{failed && <div className={styles.fallback} style={{ background: product.tone || "#159bd7" }}><b>fizzi</b><span>{product.name}</span></div>}<span className={styles.caption}>3D · drag to explore</span></div>;
}
