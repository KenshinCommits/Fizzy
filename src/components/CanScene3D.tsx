"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { gsap } from "gsap";

interface CanScene3DProps {
  activeFlavor: number;
  canImages: string[];
  flavorColors: string[];
}

export default function CanScene3D({
  activeFlavor,
  canImages,
  flavorColors,
}: CanScene3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cansRef = useRef<THREE.Group[]>([]);
  const spinGroupsRef = useRef<THREE.Group[]>([]);
  const shadowsRef = useRef<THREE.Mesh[]>([]);
  const animFrameId = useRef<number | null>(null);
  const prevActiveRef = useRef(activeFlavor);
  const dragAngleRef = useRef({ value: 0 });
  const dragOriginXRef = useRef(0);
  const isDraggingRef = useRef(false);

  // Spacing between cans along the X-axis
  const CAN_SPACING = 5.6;
  const CAN_RADIUS = 0.75;
  const CAN_HEIGHT = 1.76;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    // Position camera to view can dead center with comfortable top and bottom padding
    camera.position.set(0, 0, 5.8);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    rendererRef.current = renderer;

    container.replaceChildren(renderer.domElement);

    // 2. Lighting setup (creating photorealistic metallic cylinder reflections)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(ambientLight);

    // Key light from top-left front
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
    keyLight.position.set(-3.5, 5, 5);
    scene.add(keyLight);

    // Specular shine light from right
    const rimLight = new THREE.DirectionalLight(0xffffff, 1.8);
    rimLight.position.set(4, 2, 3);
    scene.add(rimLight);

    // Soft fill from bottom front
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.9);
    fillLight.position.set(0, -3.5, 3);
    scene.add(fillLight);

    // Subtle colored top backlight
    const backLight = new THREE.DirectionalLight(0xffffff, 0.7);
    backLight.position.set(0, 4, -3);
    scene.add(backLight);

    // 3. Texture background color palette matching each flavor
    const CAN_BG_COLORS = [
      "#fef9da", // Watermelon Crush
      "#fdf9dc", // Yuzu Citrus Fizz
      "#fefad4", // Berry Wave
      "#fff8cc", // Mango Splash
    ];

    // 4. Create Ground Shadow texture
    const shadowCanvas = document.createElement("canvas");
    shadowCanvas.width = 256;
    shadowCanvas.height = 256;
    const sCtx = shadowCanvas.getContext("2d");
    if (sCtx) {
      const gradient = sCtx.createRadialGradient(128, 128, 0, 128, 128, 128);
      gradient.addColorStop(0, "rgba(0, 0, 0, 0.32)");
      gradient.addColorStop(0.4, "rgba(0, 0, 0, 0.16)");
      gradient.addColorStop(0.7, "rgba(0, 0, 0, 0.05)");
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
      sCtx.fillStyle = gradient;
      sCtx.fillRect(0, 0, 256, 256);
    }
    const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
    const shadowMaterial = new THREE.MeshBasicMaterial({
      map: shadowTexture,
      transparent: true,
      depthWrite: false,
    });

    // 5. Build the 4 3D Cans
    const textureLoader = new THREE.TextureLoader();
    cansRef.current = [];
    spinGroupsRef.current = [];
    shadowsRef.current = [];

    canImages.forEach((imgUrl, index) => {
      const canGroup = new THREE.Group();
      const spinGroup = new THREE.Group();

      const canBgColor = CAN_BG_COLORS[index % CAN_BG_COLORS.length] || "#fef9da";

      // Color-matched satin rim and lid materials matching the can texture background
      const canRimMaterial = new THREE.MeshStandardMaterial({
        color: canBgColor,
        metalness: 0.12,
        roughness: 0.32,
      });

      const canLidMaterial = new THREE.MeshStandardMaterial({
        color: canBgColor,
        metalness: 0.15,
        roughness: 0.38,
      });

      // Can body texture
      const texture = textureLoader.load(imgUrl);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = true;

      // Body cylinder: radius 0.75, height 1.76 (matching texture aspect ratio)
      const bodyGeometry = new THREE.CylinderGeometry(
        CAN_RADIUS,
        CAN_RADIUS,
        CAN_HEIGHT,
        64,
        1,
        true
      );

      // Wrapper texture maps seamlessly: U=0.5 faces forward, U=0 & U=1 meet at back seam
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.repeat.set(1, 1);
      texture.offset.set(0, 0);

      const bodyMaterial = new THREE.MeshStandardMaterial({
        map: texture,
        metalness: 0.14,
        roughness: 0.38,
      });

      const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
      bodyMesh.rotation.y = Math.PI / 2 + 0.95;
      spinGroup.add(bodyMesh);

      // Top taper (bevel inward to rim) - matches texture background
      const topTaperGeo = new THREE.CylinderGeometry(
        CAN_RADIUS * 0.88,
        CAN_RADIUS,
        0.20,
        64,
        1,
        true
      );
      const topTaper = new THREE.Mesh(topTaperGeo, canRimMaterial);
      topTaper.position.y = CAN_HEIGHT / 2 + 0.10;
      spinGroup.add(topTaper);

      // Top rim (torus ring) - matches texture background
      const topRimGeo = new THREE.TorusGeometry(CAN_RADIUS * 0.88, 0.032, 16, 64);
      const topRim = new THREE.Mesh(topRimGeo, canRimMaterial);
      topRim.rotation.x = Math.PI / 2;
      topRim.position.y = CAN_HEIGHT / 2 + 0.20;
      spinGroup.add(topRim);

      // Top lid disk - matches texture background
      const topLidGeo = new THREE.CircleGeometry(CAN_RADIUS * 0.86, 64);
      const topLid = new THREE.Mesh(topLidGeo, canLidMaterial);
      topLid.rotation.x = -Math.PI / 2;
      topLid.position.y = CAN_HEIGHT / 2 + 0.19;
      spinGroup.add(topLid);

      // Pull tab detail on top lid - matches texture background
      const tabGeo = new THREE.BoxGeometry(0.24, 0.015, 0.42);
      const tabMesh = new THREE.Mesh(tabGeo, canRimMaterial);
      tabMesh.position.set(0, CAN_HEIGHT / 2 + 0.205, 0.14);
      spinGroup.add(tabMesh);

      // Bottom taper (bevel inward to base) - matches texture background
      const botTaperGeo = new THREE.CylinderGeometry(
        CAN_RADIUS,
        CAN_RADIUS * 0.86,
        0.22,
        64,
        1,
        true
      );
      const botTaper = new THREE.Mesh(botTaperGeo, canRimMaterial);
      botTaper.position.y = -CAN_HEIGHT / 2 - 0.11;
      spinGroup.add(botTaper);

      // Bottom concave rim - matches texture background
      const botRimGeo = new THREE.TorusGeometry(CAN_RADIUS * 0.86, 0.032, 16, 64);
      const botRim = new THREE.Mesh(botRimGeo, canRimMaterial);
      botRim.rotation.x = Math.PI / 2;
      botRim.position.y = -CAN_HEIGHT / 2 - 0.22;
      spinGroup.add(botRim);

      canGroup.add(spinGroup);
      spinGroupsRef.current.push(spinGroup);

      // Position the can group along the horizontal track
      const initialOffset = (index - activeFlavor) * CAN_SPACING;
      canGroup.position.set(initialOffset, 0, 0);

      // Initial rotation: active is 0, offscreen cans are rotated along roll direction
      const rollAngle = -(initialOffset / CAN_RADIUS);
      canGroup.rotation.y = rollAngle;

      scene.add(canGroup);
      cansRef.current.push(canGroup);

      // Ground shadow plane below the can
      const shadowGeo = new THREE.PlaneGeometry(2.8, 1.2);
      const shadowMesh = new THREE.Mesh(shadowGeo, shadowMaterial);
      shadowMesh.rotation.x = -Math.PI / 2;
      shadowMesh.position.set(initialOffset, -CAN_HEIGHT / 2 - 0.28, 0);
      scene.add(shadowMesh);
      shadowsRef.current.push(shadowMesh);
    });

    // 6. Handle window resize
    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    const handlePointerDown = (event: PointerEvent) => {
      isDraggingRef.current = true;
      dragOriginXRef.current = event.clientX;
      container.setPointerCapture(event.pointerId);
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!isDraggingRef.current) return;
      const delta = (event.clientX - dragOriginXRef.current) * 0.012;
      dragAngleRef.current.value = Math.max(-1.3, Math.min(1.3, delta));

      cansRef.current.forEach((can, index) => {
        if (index !== activeFlavor) return;
        const targetX = (index - activeFlavor) * CAN_SPACING;
        const targetRoll = -(targetX / CAN_RADIUS) + dragAngleRef.current.value;
        gsap.to(can.rotation, {
          y: targetRoll,
          duration: 0.2,
          ease: "power2.out",
        });
      });
    };

    const handlePointerUp = () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;

      gsap.to(dragAngleRef.current, {
        value: 0,
        duration: 0.28,
        ease: "power2.out",
        onUpdate: () => {
          cansRef.current.forEach((can, index) => {
            if (index !== activeFlavor) return;
            const targetX = (index - activeFlavor) * CAN_SPACING;
            const targetRoll = -(targetX / CAN_RADIUS) + dragAngleRef.current.value;
            can.rotation.y = targetRoll;
          });
        },
      });
    };

    container.addEventListener("pointerdown", handlePointerDown);
    container.addEventListener("pointermove", handlePointerMove);
    container.addEventListener("pointerup", handlePointerUp);
    container.addEventListener("pointerleave", handlePointerUp);

    // 8. Animation render loop
    let clock = new THREE.Clock();

    const animate = () => {
      animFrameId.current = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      // Keep the active can front-facing while it floats.
      cansRef.current.forEach((can, i) => {
        const shadow = shadowsRef.current[i];
        if (Math.abs(can.position.x) < 0.8) {
          const floatOffset = Math.sin(time * 2.2) * 0.05;
          can.position.y = floatOffset;
          can.rotation.x = 0;
          can.rotation.z = 0;

          if (shadow) {
            shadow.position.y = -CAN_HEIGHT / 2 - 0.28 + floatOffset * 0.3;
            const shadowScale = 1 - floatOffset * 0.5;
            shadow.scale.set(shadowScale, shadowScale, 1);
          }
        }
      });

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
      window.removeEventListener("resize", handleResize);
      container.removeEventListener("pointerdown", handlePointerDown);
      container.removeEventListener("pointermove", handlePointerMove);
      container.removeEventListener("pointerup", handlePointerUp);
      container.removeEventListener("pointerleave", handlePointerUp);
      cansRef.current.forEach((can, i) => {
        gsap.killTweensOf(can.position);
        gsap.killTweensOf(can.rotation);
        const spinGroup = spinGroupsRef.current[i];
        if (spinGroup) gsap.killTweensOf(spinGroup.rotation);
        const shadow = shadowsRef.current[i];
        if (shadow) {
          gsap.killTweensOf(shadow.position);
          gsap.killTweensOf(shadow.material);
        }
      });
      renderer.dispose();
    };
  }, [canImages]);

  // Animate 3D Can Rolling when activeFlavor changes
  useEffect(() => {
    if (cansRef.current.length === 0) return;
    if (prevActiveRef.current === activeFlavor) return;

    cansRef.current.forEach((can, index) => {
      const shadow = shadowsRef.current[index];
      const spinGroup = spinGroupsRef.current[index];
      const targetX = (index - activeFlavor) * CAN_SPACING;
      const direction = activeFlavor > prevActiveRef.current ? 1 : -1;
      const targetRoll = -(targetX / CAN_RADIUS);

      const isCurrentActive = index === activeFlavor;
      const isPreviousActive = index === prevActiveRef.current;

      gsap.killTweensOf(can.position);
      gsap.killTweensOf(can.rotation);
      if (spinGroup) {
        gsap.killTweensOf(spinGroup.rotation);
        if (isCurrentActive) gsap.set(spinGroup.rotation, { y: 0 });
      }

      // Incoming active can starts just off the screen on the right/left and rolls into place.
      if (isCurrentActive) {
        gsap.set(can.position, { x: targetX + direction * CAN_SPACING * 1.25 });
        gsap.set(can.rotation, { y: targetRoll + direction * 1.5 });
      }

      // 3D Rolling Animation Timeline with GSAP
      gsap.to(can.position, {
        x: targetX,
        duration: 1.35,
        ease: "power2.inOut",
      });

      const dragAdjustment = isCurrentActive ? dragAngleRef.current.value : 0;

      // Finish the can's roll, then continuously turn its can assembly in place.
      const rotationTimeline = gsap.timeline();
      rotationTimeline.to(can.rotation, {
        y: targetRoll + dragAdjustment,
        duration: 1.35,
        ease: "power2.inOut",
      });
      if (isCurrentActive && spinGroup) {
        rotationTimeline.to(spinGroup.rotation, {
          y: `+=${Math.PI * 2}`,
          duration: 3.2,
          ease: "none",
          repeat: -1,
        });
      }

      // Shadow position & scale
      if (shadow) {
        gsap.killTweensOf(shadow.position);
        gsap.killTweensOf(shadow.material);
        gsap.to(shadow.position, {
          x: targetX,
          duration: 0.95,
          ease: "power2.inOut",
        });

        gsap.to(shadow.material, {
          opacity: isCurrentActive ? 1 : 0.2,
          duration: 0.8,
          ease: "power2.out",
        });
      }
    });

    prevActiveRef.current = activeFlavor;

    return () => {
      cansRef.current.forEach((can, i) => {
        gsap.killTweensOf(can.position);
        gsap.killTweensOf(can.rotation);
        const spinGroup = spinGroupsRef.current[i];
        if (spinGroup) gsap.killTweensOf(spinGroup.rotation);
        const shadow = shadowsRef.current[i];
        if (shadow) {
          gsap.killTweensOf(shadow.position);
          gsap.killTweensOf(shadow.material);
        }
      });
    };
  }, [activeFlavor]);

  return (
    <div
      ref={containerRef}
      className="can-3d-viewport"
    />
  );
}
