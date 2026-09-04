import * as THREE from 'three';
import { EARTH, MARS } from '../chapters';
import type { Tier } from '../tiers';
import { regolithTexture } from './sprite';

/**
 * Planets and the launch-pad ground.
 *
 * Textures are NASA Blue Marble (public domain) for Earth and a Solar System
 * Scope map (CC BY 4.0) for Mars, pre-encoded to WebP at three sizes so each
 * tier downloads only what it can use — 41KB total on a phone.
 *
 * Loading is fire-and-forget: the meshes exist immediately with a flat base
 * colour and the map swaps in when it arrives, so a slow connection delays
 * detail rather than the whole scene.
 */

export interface Planets {
  group: THREE.Group;
  update(dt: number, progress: number): void;
  dispose(): void;
}

export function createPlanets(tier: Tier): Planets {
  const group = new THREE.Group();
  const disposables: Array<{ dispose(): void }> = [];
  const loader = new THREE.TextureLoader();

  const load = (name: string, onto: THREE.MeshStandardMaterial, slot: 'map' | 'emissiveMap') => {
    loader.load(
      `/textures/${name}_${tier.planetTex}.webp`,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 4;
        onto[slot] = tex;
        onto.needsUpdate = true;
        disposables.push(tex);
      },
      undefined,
      () => {
        /* texture is decoration; a failure leaves the flat base colour */
      },
    );
  };

  const sphere = (radius: number, segments: number) => {
    const g = new THREE.SphereGeometry(radius, segments, segments / 2);
    disposables.push(g);
    return g;
  };

  // --- Earth ----------------------------------------------------------------
  const earthMat = new THREE.MeshStandardMaterial({
    color: '#20344f',
    roughness: 0.92,
    metalness: 0,
    transparent: true,
    opacity: 0,
    emissive: new THREE.Color('#ffd9a0'),
    emissiveIntensity: tier.nightLights ? 0.9 : 0,
  });
  disposables.push(earthMat);
  load('earth_day', earthMat, 'map');
  if (tier.nightLights) load('earth_night', earthMat, 'emissiveMap');

  const earth = new THREE.Mesh(sphere(EARTH.radius, tier.planetSegments), earthMat);
  earth.position.set(...EARTH.pos);
  earth.rotation.z = 0.41; // axial tilt
  group.add(earth);

  // Atmospheric rim. A back-side sphere with a fresnel-ish falloff — far
  // cheaper than a post-processed glow and it survives on the phone tier.
  const haloMat = new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color('#4aa8ff') }, uPower: { value: 3.2 }, uStrength: { value: 0.38 } },
    vertexShader: /* glsl */ `
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vView = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uPower;
      uniform float uStrength;
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        float f = pow(1.0 - abs(dot(vNormal, vView)), uPower);
        gl_FragColor = vec4(uColor, f * uStrength);
      }
    `,
    transparent: true,
    depthWrite: false,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
  });
  disposables.push(haloMat);
  const halo = new THREE.Mesh(sphere(EARTH.radius * 1.13, 48), haloMat);
  halo.position.copy(earth.position);
  group.add(halo);

  // --- Mars -----------------------------------------------------------------
  const marsMat = new THREE.MeshStandardMaterial({
    color: '#7a4630',
    roughness: 0.96,
    metalness: 0,
    transparent: true,
    opacity: 0,
  });
  disposables.push(marsMat);
  load('mars', marsMat, 'map');

  const mars = new THREE.Mesh(sphere(MARS.radius, tier.planetSegments), marsMat);
  mars.position.set(...MARS.pos);
  mars.rotation.z = 0.44;
  group.add(mars);

  const marsHaloMat = haloMat.clone();
  marsHaloMat.uniforms.uColor.value = new THREE.Color('#ff9a6a');
  marsHaloMat.uniforms.uPower.value = 3.6;
  marsHaloMat.uniforms.uStrength.value = 0.3;
  disposables.push(marsHaloMat);
  const marsHalo = new THREE.Mesh(sphere(MARS.radius * 1.1, 40), marsHaloMat);
  marsHalo.position.copy(mars.position);
  group.add(marsHalo);

  // --- Launch pad ground ----------------------------------------------------
  // Only relevant for the first chapter; faded out and hidden once we climb, so
  // it stops costing anything for the other 88% of the page.
  const groundTex = regolithTexture(tier.name === 'phone' ? 128 : 256);
  disposables.push(groundTex);
  const groundMat = new THREE.MeshStandardMaterial({
    map: groundTex,
    color: '#9aa3bd',
    roughness: 1,
    metalness: 0,
    transparent: true,
    opacity: 1,
    // Double-sided so a camera keyframe that dips below the pad doesn't make
    // the ground silently disappear.
    side: THREE.DoubleSide,
  });
  disposables.push(groundMat);
  const groundGeo = new THREE.CircleGeometry(1200, tier.name === 'phone' ? 48 : 96);
  disposables.push(groundGeo);
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.9;
  group.add(ground);

  const smoothstep = (e0: number, e1: number, x: number) => {
    const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
    return t * t * (3 - 2 * t);
  };

  const EARTH_HALO_STRENGTH = 0.38;
  const MARS_HALO_STRENGTH = 0.3;

  return {
    group,
    update(dt, progress) {
      earth.rotation.y += dt * 0.012;
      halo.rotation.y = earth.rotation.y;
      mars.rotation.y += dt * 0.014;

      // Per-chapter visibility. Earth now sits low enough on the journey that
      // it would otherwise hang in the launch-pad sky as a giant arc, so it
      // fades in with the ascent and back out once we're past it. Hiding both
      // planets outside their chapters also skips their draw calls entirely.
      const earthVis = smoothstep(0.1, 0.2, progress) * (1 - smoothstep(0.52, 0.64, progress));
      const marsVis = smoothstep(0.45, 0.63, progress);

      earthMat.opacity = earthVis;
      earth.visible = earthVis > 0.004;
      haloMat.uniforms.uStrength.value = EARTH_HALO_STRENGTH * earthVis;
      halo.visible = earth.visible;

      marsMat.opacity = marsVis;
      mars.visible = marsVis > 0.004;
      marsHaloMat.uniforms.uStrength.value = MARS_HALO_STRENGTH * marsVis;
      marsHalo.visible = mars.visible;

      // Ground fades out through the early ascent.
      const g = 1 - Math.min(1, Math.max(0, (progress - 0.035) / 0.075));
      groundMat.opacity = g;
      ground.visible = g > 0.002;
    },
    dispose() {
      for (const d of disposables) d.dispose();
    },
  };
}
