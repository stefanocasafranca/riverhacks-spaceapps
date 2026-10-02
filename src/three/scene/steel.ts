import * as THREE from 'three';

/**
 * Polished stainless steel for the Starship hull — the look of the real
 * vehicle on the pad: a mirror-bright skin that reflects sky and ground,
 * broken into stacked ring panels with vertical weld seams and a slightly
 * different tone on every panel.
 *
 * Two pieces:
 *
 * 1. An environment map. A fully metallic surface has no colour of its own; it
 *    only shows what it reflects. Lit by the scene's directional lights alone
 *    it renders near-black. So we render a tiny gradient "world" (navy zenith,
 *    bright hazy horizon, warm sun, darker ground) once through PMREM and give
 *    it to the hull only — the planets and pad keep their current lighting.
 *
 * 2. Procedural panels. The model ships without UVs (stripped so it could be
 *    decimated, see scripts/optimize-model.mjs), so seams are computed in the
 *    fragment shader from object-space position: ring seams from height,
 *    staggered weld seams from the angle around the vehicle's axis. This is
 *    injected into MeshStandardMaterial with onBeforeCompile so it keeps all of
 *    three's PBR, fog and tone mapping.
 */

/** Rendered once at load; cheap enough for the phone tier (a 256px cube). */
export function createSteelEnvironment(renderer: THREE.WebGLRenderer): THREE.Texture {
  const envScene = new THREE.Scene();

  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(10, 48, 24),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        uSunDir: { value: new THREE.Vector3(-0.55, 0.42, 0.72).normalize() },
      },
      vertexShader: /* glsl */ `
        varying vec3 vDir;
        void main() {
          vDir = normalize(position);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uSunDir;
        varying vec3 vDir;
        void main() {
          float y = vDir.y;
          vec3 zenith  = vec3(0.03, 0.08, 0.24);
          vec3 sky     = vec3(0.20, 0.36, 0.78);
          vec3 horizon = vec3(1.05, 1.10, 1.18);
          vec3 ground  = vec3(0.30, 0.29, 0.28);
          vec3 deep    = vec3(0.04, 0.05, 0.07);

          vec3 col = y > 0.0
            ? mix(horizon, mix(sky, zenith, smoothstep(0.2, 0.85, y)), smoothstep(0.0, 0.22, y))
            : mix(horizon * 0.7, mix(ground, deep, smoothstep(0.08, 0.6, -y)), smoothstep(0.0, 0.05, -y));

          // A vertical cylinder reflects the world AROUND it, so the streaks
          // on the real hull come from azimuth: a bright sun side, a dark
          // far side, and a few tall bright features (buildings, haze) between.
          vec2 dxz = normalize(vDir.xz + 1e-5);
          vec2 sxz = normalize(uSunDir.xz);
          float facing = clamp(dot(dxz, sxz) * 0.5 + 0.5, 0.0, 1.0); // pow() of a tiny negative is NaN, and PMREM spreads NaN everywhere
          col *= 0.22 + 1.1 * pow(facing, 1.6);
          float az = atan(dxz.y, dxz.x);
          float strips = pow(max(sin(az * 3.0 + 0.7), 0.0), 18.0) + 0.7 * pow(max(sin(az * 5.0 - 1.3), 0.0), 30.0);
          col += vec3(1.6, 1.65, 1.75) * strips * (1.0 - smoothstep(-0.2, 0.6, abs(y - 0.05)));

          // Sun: a hot core plus a soft halo, matching the scene's key light.
          float s = max(dot(vDir, uSunDir), 0.0);
          col += vec3(1.0, 0.93, 0.82) * (pow(s, 600.0) * 40.0 + pow(s, 24.0) * 0.9);

          gl_FragColor = vec4(col, 1.0);
        }
      `,
    }),
  );
  envScene.add(sky);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const target = pmrem.fromScene(envScene, 0.02);
  pmrem.dispose();
  sky.geometry.dispose();
  (sky.material as THREE.Material).dispose();
  return target.texture;
}

export interface SteelMaterial {
  material: THREE.MeshStandardMaterial;
  /** Object-space bounds of the hull geometry, so seams line up with the vehicle. */
  setBounds(box: THREE.Box3): void;
}

export function createSteelMaterial(envMap: THREE.Texture | null): SteelMaterial {
  const material = new THREE.MeshStandardMaterial({
    color: '#e3e7ec',
    metalness: 1,
    roughness: 0.12,
    envMap,
    envMapIntensity: 1.1,
  });

  const uniforms = {
    uBoundsMin: { value: new THREE.Vector3() },
    uBoundsSize: { value: new THREE.Vector3(1, 1, 1) },
    // ~28 rings on the real 50m vehicle (1.8m stacks), 6 panels around each.
    uRings: { value: 28 },
    uPanels: { value: 6 },
  };

  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);

    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vObjPos;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvObjPos = position;');

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        /* glsl */ `#include <common>
        varying vec3 vObjPos;
        uniform vec3 uBoundsMin;
        uniform vec3 uBoundsSize;
        uniform float uRings;
        uniform float uPanels;

        float steelHash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }

        // x: seam mask (1 on a seam), y: per-panel random 0..1
        vec2 steelPanels() {
          vec3 n = (vObjPos - uBoundsMin) / uBoundsSize;
          float h = n.y * uRings;
          float ring = floor(h);

          vec2 c = (n.xz - 0.5) * uBoundsSize.xz;
          float a = (atan(c.y, c.x) / 6.2831853 + 0.5) * uPanels;
          // Stagger the vertical welds every other ring, like real stacks.
          a += mod(ring, 2.0) * 0.5;
          float col = floor(a);

          float fh = fract(h);
          float fa = fract(a);
          float wh = fwidth(h) * 1.2 + 0.012;
          float wa = fwidth(a) * 1.2 + 0.006;
          float ringSeam = 1.0 - smoothstep(0.0, wh, min(fh, 1.0 - fh));
          float weld = 1.0 - smoothstep(0.0, wa, min(fa, 1.0 - fa));
          return vec2(max(ringSeam, weld * 0.55), steelHash(vec2(ring, col)));
        }`,
      )
      .replace(
        '#include <color_fragment>',
        /* glsl */ `#include <color_fragment>
        vec2 steelP = steelPanels();
        // Each stack is rolled from a different sheet: tone varies a little.
        diffuseColor.rgb *= mix(0.9, 1.03, steelP.y);
        diffuseColor.rgb *= 1.0 - steelP.x * 0.3;`,
      )
      .replace(
        '#include <roughnessmap_fragment>',
        /* glsl */ `#include <roughnessmap_fragment>
        // Some panels are mirror-bright, some a touch hazier; seams are dull.
        roughnessFactor = clamp(roughnessFactor * mix(0.5, 1.5, steelP.y) + steelP.x * 0.25, 0.04, 1.0);`,
      );
  };
  // Shares one compiled program across every hull mesh.
  material.customProgramCacheKey = () => 'starship-steel';

  return {
    material,
    setBounds(box) {
      uniforms.uBoundsMin.value.copy(box.min);
      box.getSize(uniforms.uBoundsSize.value);
    },
  };
}
