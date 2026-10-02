import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { softSprite } from './sprite';
import { createSteelMaterial } from './steel';
import type { Tier } from '../tiers';

/**
 * The Starship model.
 *
 * Source: "SpaceX Starship-With landing legs deployed" by AllThingsSpace,
 * CC-BY-4.0. Credit is rendered in the site footer — the licence requires it.
 *
 * The 30MB / 343k-triangle Sketchfab export is preprocessed by
 * scripts/optimize-model.mjs into two meshopt-compressed tiers (see that file
 * for why UVs and normals had to be stripped to unblock decimation):
 *
 *   starship_hi.glb  103k tris  265KB gz   tablet + desktop
 *   starship_lo.glb   41k tris  122KB gz   phone
 *
 * Meshopt rather than Draco on purpose: Draco compresses the mesh ~80KB
 * smaller but needs a 279KB wasm decoder, where meshopt's decoder is 29KB.
 * For a single model that trade is heavily net-negative.
 */

export interface Starship {
  group: THREE.Group;
  /** Engine plane in local space, for the plume to attach to. */
  enginePoint: THREE.Vector3;
  update(dt: number, progress: number): void;
  dispose(): void;
}

/** Height the vehicle is normalised to, in world units. */
const TARGET_HEIGHT = 15;

export async function loadStarship(
  tier: Tier,
  onProgress?: (f: number) => void,
  /** Reflection map for the steel hull (see ./steel). */
  envMap: THREE.Texture | null = null,
): Promise<Starship> {
  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);

  const url = `/models/starship_${tier.name === 'phone' ? 'lo' : 'hi'}.glb`;

  const gltf = await new Promise<{ scene: THREE.Group }>((resolve, reject) => {
    loader.load(
      url,
      (g) => resolve(g as unknown as { scene: THREE.Group }),
      (evt) => {
        if (onProgress && evt.total > 0) onProgress(evt.loaded / evt.total);
      },
      reject,
    );
  });

  const model = gltf.scene;
  const disposables: Array<{ dispose(): void }> = [];

  // --- Materials -----------------------------------------------------------
  // The source has 23 materials and zero textures — all flat PBR colours, most
  // of them near-black. Everything but the engines becomes polished stainless
  // steel, like the real vehicle on the pad; the engines stay dark.
  const steel = createSteelMaterial(envMap);
  const dark = new THREE.MeshStandardMaterial({
    color: '#38445e',
    metalness: 0.6,
    roughness: 0.35,
  });
  disposables.push(steel.material, dark);

  // Object-space bounds of the hull, so the shader's panel seams follow it.
  const hullBounds = new THREE.Box3();

  model.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;

    // Normals were stripped in preprocessing so the geometry could weld and
    // decimate. Recomputing here on welded, indexed geometry yields SMOOTH
    // normals — correct for a hull that is mostly cylinder and nosecone.
    mesh.geometry.computeVertexNormals();

    const name = (Array.isArray(mesh.material) ? mesh.material[0] : mesh.material)?.name ?? '';
    const n = name.toLowerCase();
    const isEngine = n.includes('engine') || n.includes('raptor');
    mesh.material = isEngine ? dark : steel.material;
    if (!isEngine) {
      mesh.geometry.computeBoundingBox();
      hullBounds.union(mesh.geometry.boundingBox!);
    }

    mesh.castShadow = false;
    mesh.receiveShadow = false;
    mesh.frustumCulled = false;
  });

  steel.setBounds(hullBounds);

  // --- Normalise -----------------------------------------------------------
  // The export bakes geometry into world coordinates with an arbitrary origin
  // and scale, so derive the transform from the actual bounds rather than
  // hard-coding numbers that would break if the model is ever re-exported.
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const scale = TARGET_HEIGHT / size.y;

  model.scale.setScalar(scale);
  // Centre on X/Z, and put the base of the vehicle at local y = 0 so it sits
  // on the pad and the plume can hang off the bottom.
  model.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);

  const group = new THREE.Group();
  group.add(model);

  // --- Engine glow ---------------------------------------------------------
  // Stands in for bloom, which the phone tier never runs.
  const glowMat = new THREE.SpriteMaterial({
    map: softSprite(),
    color: new THREE.Color('#ffd9a0'),
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    opacity: 0,
  });
  disposables.push(glowMat);
  const glow = new THREE.Sprite(glowMat);
  glow.scale.set(11, 13, 1);
  glow.position.y = -0.6;
  group.add(glow);

  const enginePoint = new THREE.Vector3(0, -0.15, 0);

  const smooth = (e0: number, e1: number, x: number) => {
    const k = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
    return k * k * (3 - 2 * k);
  };

  let t = 0;

  return {
    group,
    enginePoint,
    update(dt, progress) {
      t += dt;

      const ignite = smooth(0.015, 0.075, progress);
      const burn = 1 - 0.72 * smooth(0.4, 0.6, progress);
      const thrust = ignite * burn;

      glowMat.opacity = thrust * (0.72 + Math.sin(t * 26) * 0.09 + Math.sin(t * 9.3) * 0.06);
      const flick = 1 + Math.sin(t * 21) * 0.07;
      glow.scale.set(11 * flick * (0.6 + thrust * 0.4), 14 * flick * (0.6 + thrust * 0.4), 1);

      // Attitude is scroll-driven, so the vehicle holds its pose when the page
      // is still. (An earlier version used elapsed time here and span forever.)
      const turn = smooth(0.08, 0.58, progress);
      group.rotation.z = -turn * 0.22;
      group.rotation.y = -0.5 + smooth(0.03, 0.17, progress) * 0.61;

      // Engine vibration — time-based on purpose; it shouldn't freeze on pause.
      const shake = thrust * (1 - turn * 0.7) * 0.03;
      group.position.x = Math.sin(t * 34) * shake;
      group.position.z = Math.cos(t * 29) * shake;
    },
    dispose() {
      model.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.isMesh) m.geometry.dispose();
      });
      for (const d of disposables) d.dispose();
    },
  };
}
