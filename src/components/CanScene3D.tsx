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
  const shadowsRef = useRef<THREE.Mesh[]>([]);
  const mousePos = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
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

    // 3. Materials
    const metalSilverMaterial = new THREE.MeshStandardMaterial({
      color: 0xe6e6e6,
      metalness: 0.94,
      roughness: 0.20,
    });

    const lidTopMaterial = new THREE.MeshStandardMaterial({
      color: 0xd0d0d0,
      metalness: 0.90,
      roughness: 0.28,
    });

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
    shadowsRef.current = [];

    canImages.forEach((imgUrl, index) => {
      const canGroup = new THREE.Group();

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
      bodyMesh.rotation.y = Math.PI / 2 + 0.75;
      canGroup.add(bodyMesh);

      // Top taper (aluminum bevel inward to rim)
      const topTaperGeo = new THREE.CylinderGeometry(
        CAN_RADIUS * 0.88,
        CAN_RADIUS,
        0.20,
        64,
        1,
        true
      );
      const topTaper = new THREE.Mesh(topTaperGeo, metalSilverMaterial);
      topTaper.position.y = CAN_HEIGHT / 2 + 0.10;
      canGroup.add(topTaper);

      // Top silver rim (torus ring)
      const topRimGeo = new THREE.TorusGeometry(CAN_RADIUS * 0.88, 0.032, 16, 64);
      const topRim = new THREE.Mesh(topRimGeo, metalSilverMaterial);
      topRim.rotation.x = Math.PI / 2;
      topRim.position.y = CAN_HEIGHT / 2 + 0.20;
      canGroup.add(topRim);

      // Top aluminum lid disk
      const topLidGeo = new THREE.CircleGeometry(CAN_RADIUS * 0.86, 64);
      const topLid = new THREE.Mesh(topLidGeo, lidTopMaterial);
      topLid.rotation.x = -Math.PI / 2;
      topLid.position.y = CAN_HEIGHT / 2 + 0.19;
      canGroup.add(topLid);

      // Pull tab detail on top lid
      const tabGeo = new THREE.BoxGeometry(0.24, 0.015, 0.42);
      const tabMesh = new THREE.Mesh(tabGeo, metalSilverMaterial);
      tabMesh.position.set(0, CAN_HEIGHT / 2 + 0.205, 0.14);
      canGroup.add(tabMesh);

      // Bottom taper (aluminum bevel inward to base)
      const botTaperGeo = new THREE.CylinderGeometry(
        CAN_RADIUS,
        CAN_RADIUS * 0.86,
        0.22,
        64,
        1,
        true
      );
      const botTaper = new THREE.Mesh(botTaperGeo, metalSilverMaterial);
      botTaper.position.y = -CAN_HEIGHT / 2 - 0.11;
      canGroup.add(botTaper);

      // Bottom concave rim
      const botRimGeo = new THREE.TorusGeometry(CAN_RADIUS * 0.86, 0.032, 16, 64);
      const botRim = new THREE.Mesh(botRimGeo, metalSilverMaterial);
      botRim.rotation.x = Math.PI / 2;
      botRim.position.y = -CAN_HEIGHT / 2 - 0.22;
      canGroup.add(botRim);

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

    // 7. Mouse move tracking for 3D parallax tilt
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mousePos.current.targetX = x;
      mousePos.current.targetY = y;
    };
    window.addEventListener("mousemove", handleMouseMove);

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

      // Smooth mouse lerp
      mousePos.current.x += (mousePos.current.targetX - mousePos.current.x) * 0.08;
      mousePos.current.y += (mousePos.current.targetY - mousePos.current.y) * 0.08;

      // Ambient floating & mouse tilt on active can
      cansRef.current.forEach((can, i) => {
        const shadow = shadowsRef.current[i];
        if (Math.abs(can.position.x) < 0.8) {
          // Can is close to center: apply subtle breathing float and 3D mouse reaction
          const floatOffset = Math.sin(time * 2.2) * 0.05;
          can.position.y = floatOffset;
          can.rotation.x = -mousePos.current.y * 0.16;

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
      window.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("pointerdown", handlePointerDown);
      container.removeEventListener("pointermove", handlePointerMove);
      container.removeEventListener("pointerup", handlePointerUp);
      container.removeEventListener("pointerleave", handlePointerUp);
      renderer.dispose();
    };
  }, [canImages]);

  // Animate 3D Can Rolling when activeFlavor changes
  useEffect(() => {
    if (cansRef.current.length === 0) return;

    cansRef.current.forEach((can, index) => {
      const shadow = shadowsRef.current[index];
      const targetX = (index - activeFlavor) * CAN_SPACING;
      const direction = activeFlavor > prevActiveRef.current ? 1 : -1;
      // Physics roll: angle delta = - (deltaX / radius) * 1.15
      const targetRoll = -(targetX / CAN_RADIUS);

      // Determine roll tilt angle during movement (can leans into roll)
      const isCurrentActive = index === activeFlavor;
      const isPreviousActive = index === prevActiveRef.current;
      const rollLean = isCurrentActive || isPreviousActive
        ? (activeFlavor > prevActiveRef.current ? -0.22 : 0.22)
        : 0;

      // Incoming active can starts just off the screen on the right and rolls into place.
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

      const dragAdjustment = index === activeFlavor ? dragAngleRef.current.value : 0;

      // Roll rotation around Y-axis (cylinder spinning on floor) and user drag adjusts the active can.
      gsap.to(can.rotation, {
        y: targetRoll + dragAdjustment,
        duration: 1.35,
        ease: "power2.inOut",
      });

      // Subtle roll lean on Z-axis (settles back to 0)
      gsap.timeline()
        .to(can.rotation, {
          z: rollLean,
          duration: 0.45,
          ease: "power2.out",
        })
        .to(can.rotation, {
          z: 0,
          duration: 0.5,
          ease: "power2.inOut",
        });

      // Shadow position & scale
      if (shadow) {
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
  }, [activeFlavor]);

  return (
    <div
      ref={containerRef}
      className="can-3d-viewport"
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
        width: "100%",
        height: "100%",
        zIndex: 7,
        pointerEvents: "none",
      }}
    />
  );
}
