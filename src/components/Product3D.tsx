import { MoveHorizontal, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import type { Product } from "../data/models";
import { Can } from "./ui";
export default function Product3D({ product }: { product: Product }) {
  const ref = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const [retry, setRetry] = useState(0);
  const rotate = useRef<(delta: number) => void>(() => {});
  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      setFailed(true);
      return;
    }
    let disposed = false;
    setFailed(false);
    setReady(false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0, 0);
    host.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(33, 1, 0.1, 100);
    camera.position.set(0, 1.05, 6.7);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.minPolarAngle = Math.PI * 0.27;
    controls.maxPolarAngle = Math.PI * 0.7;
    controls.enableDamping = true;
    controls.autoRotate = !matchMedia("(prefers-reduced-motion: reduce)")
      .matches;
    controls.autoRotateSpeed = 0.6;
    controls.target.set(0, 0.05, 0);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x839d9f, 3));
    const key = new THREE.DirectionalLight(0xffffff, 5);
    key.position.set(3, 5, 5);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xace2e1, 3);
    fill.position.set(-4, 2, 0);
    scene.add(fill);
    let model: THREE.Object3D | null = null;
    let texture: THREE.CanvasTexture | null = null;
    const renderLabel = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 1024;
      canvas.height = 1024;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = product.tone;
      ctx.fillRect(0, 0, 1024, 1024);
      ctx.strokeStyle = "#ffffff30";
      ctx.lineWidth = 2;
      for (let i = 0; i < 8; i++) {
        ctx.beginPath();
        ctx.arc(750, 750, 80 + i * 45, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.textAlign = "center";
      ctx.fillStyle = "#FFFDF9";
      ctx.font = "900 italic 170px Arial";
      ctx.fillText("fizzi", 512, 470);
      ctx.font = "bold 24px Arial";
      ctx.fillText("GOOD TASTE. GREAT FEELING.", 512, 535);
      ctx.font = "bold 38px Arial";
      const words = product.name.toUpperCase().split(" ");
      ctx.fillText(words.slice(0, 2).join(" "), 512, 670);
      if (words.length > 2) ctx.fillText(words.slice(2).join(" "), 512, 715);
      ctx.font = "18px Arial";
      ctx.fillText("SPARKLING · REFRESHING · 250 ml", 512, 835);
      texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.flipY = true;
      return texture;
    };
    const disposeObject = (root: THREE.Object3D) =>
      root.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          const materials = Array.isArray(o.material)
            ? o.material
            : [o.material];
          materials.forEach((m) => m.dispose());
        }
      });
    new GLTFLoader().load(
      "/models/fizzi-can.glb",
      (gltf) => {
        if (disposed) {
          disposeObject(gltf.scene);
          return;
        }
        model = gltf.scene;
        model.rotation.z = -0.09;
        model.traverse((o) => {
          if (o instanceof THREE.Mesh && o.name === "Can_Body") {
            o.material.color.set(product.tone);
          }
        });
        const label = new THREE.Mesh(
          new THREE.CylinderGeometry(0.512, 0.512, 1.94, 96, 1, true),
          new THREE.MeshStandardMaterial({
            map: renderLabel(),
            metalness: 0.22,
            roughness: 0.4,
          }),
        );
        label.rotation.y = Math.PI;
        model.add(label);
        scene.add(model);
        setReady(true);
      },
      undefined,
      () => {
        if (!disposed) setFailed(true);
      },
    );
    rotate.current = (delta) => {
      controls.autoRotate = false;
      if (model) model.rotation.y += delta;
    };
    const resize = () => {
      const w = host.clientWidth,
        h = host.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / Math.max(1, h);
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();
    let visible = true;
    const visibility = new IntersectionObserver(
      ([e]) => (visible = e.isIntersecting),
    );
    visibility.observe(host);
    renderer.setAnimationLoop(() => {
      if (!visible || document.hidden) return;
      controls.update();
      renderer.render(scene, camera);
    });
    return () => {
      disposed = true;
      observer.disconnect();
      visibility.disconnect();
      renderer.setAnimationLoop(null);
      controls.dispose();
      if (model) disposeObject(model);
      texture?.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [product.id, product.tone, product.name, retry]);
  return (
    <div className="model-viewer">
      <span className="model-label">
        PACKAGING PREVIEW <b>3D</b>
      </span>
      <div
        className="model-canvas"
        ref={ref}
        role="img"
        aria-label={`Interactive 3D packaging model for ${product.name}`}
      />
      {(!ready || failed) && (
        <div className="model-fallback">
          <Can tone={product.tone} name={product.name} />
          {failed && (
            <button className="btn small" onClick={() => setRetry(retry + 1)}>
              <RotateCcw size={13} />
              Retry 3D preview
            </button>
          )}
        </div>
      )}
      <div className="model-controls">
        <button
          aria-label="Rotate product left"
          onClick={() => rotate.current(-0.4)}
        >
          ←
        </button>
        <span>
          <MoveHorizontal size={14} />
          {failed ? "Static preview" : "Drag to explore"}
        </span>
        <button
          aria-label="Rotate product right"
          onClick={() => rotate.current(0.4)}
        >
          →
        </button>
      </div>
      <small className="model-footnote">
        Concept packaging · local GLB asset
      </small>
    </div>
  );
}
