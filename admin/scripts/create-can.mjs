import * as THREE from "three";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { writeFileSync } from "node:fs";
globalThis.FileReader = class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((r) => {
      this.result = r;
      this.onloadend?.();
    });
  }
  readAsDataURL(blob) {
    blob.arrayBuffer().then((r) => {
      this.result =
        "data:" + blob.type + ";base64," + Buffer.from(r).toString("base64");
      this.onloadend?.();
    });
  }
};
const scene = new THREE.Scene();
const group = new THREE.Group();
group.name = "Fizzi_Beverage_Can";
const metal = new THREE.MeshStandardMaterial({
  color: 0xd9e1e2,
  metalness: 0.85,
  roughness: 0.24,
});
const body = new THREE.MeshStandardMaterial({
  color: 0x008dda,
  metalness: 0.3,
  roughness: 0.32,
});
const profile = [
  [0, -1.24],
  [0.4, -1.24],
  [0.45, -1.19],
  [0.46, -1.08],
  [0.5, -0.99],
  [0.51, -0.85],
  [0.51, 0.89],
  [0.49, 1.05],
  [0.445, 1.14],
  [0.445, 1.22],
  [0, 1.22],
].map(([r, y]) => new THREE.Vector2(r, y));
const shell = new THREE.Mesh(new THREE.LatheGeometry(profile, 96), body);
shell.name = "Can_Body";
group.add(shell);
for (const y of [-1.21, 1.22]) {
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.444, 0.025, 12, 96),
    metal,
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = y;
  ring.name = "Aluminium_Rim";
  group.add(ring);
}
const lid = new THREE.Mesh(
  new THREE.CylinderGeometry(0.444, 0.444, 0.018, 96),
  metal,
);
lid.position.y = 1.21;
lid.name = "Top_Lid";
group.add(lid);
const groove = new THREE.Mesh(
  new THREE.TorusGeometry(0.365, 0.006, 8, 72),
  new THREE.MeshStandardMaterial({
    color: 0x83949a,
    metalness: 0.9,
    roughness: 0.4,
  }),
);
groove.rotation.x = Math.PI / 2;
groove.position.y = 1.225;
group.add(groove);
const tab = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.029, 10, 32), metal);
tab.rotation.x = Math.PI / 2;
tab.scale.set(0.75, 1, 1.6);
tab.position.set(0, 1.24, -0.07);
tab.name = "Pull_Tab";
group.add(tab);
const opening = new THREE.Mesh(
  new THREE.CircleGeometry(0.11, 32),
  new THREE.MeshStandardMaterial({ color: 0x334955 }),
);
opening.rotation.x = -Math.PI / 2;
opening.position.set(0, 1.222, 0.18);
opening.scale.y = 1.35;
group.add(opening);
scene.add(group);
new GLTFExporter().parse(
  scene,
  (result) => {
    writeFileSync("public/models/fizzi-can.glb", Buffer.from(result));
    console.log("Created Blender-compatible fizzi-can.glb");
  },
  (error) => {
    console.error(error);
    process.exitCode = 1;
  },
  { binary: true },
);
