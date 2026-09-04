import * as THREE from 'three';
import { softSprite } from './sprite';

/**
 * Engine plume.
 *
 * A CPU-stepped particle pool written into one BufferGeometry. Particles are
 * emitted in the rocket's local space and immediately handed to world space, so
 * the exhaust is left behind in the world as the stack climbs — which is what
 * makes the ascent read as motion rather than as a rocket sitting still with a
 * flame attached.
 *
 * Colour ramps white-hot → gold → pink, which lands in the flyer palette while
 * still reading as combustion.
 */

export interface Plume {
  object: THREE.Points;
  update(dt: number, thrust: number, origin: THREE.Vector3, up: THREE.Vector3): void;
  dispose(): void;
}

const HOT = new THREE.Color('#fff6e2');
const MID = new THREE.Color('#fad26e');
const COOL = new THREE.Color('#fc4884');

export function createPlume(count: number): Plume {
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const size = new Float32Array(count);
  const alpha = new Float32Array(count);

  // Parallel CPU-side state; never uploaded.
  const vel = new Float32Array(count * 3);
  const life = new Float32Array(count);
  const maxLife = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    life[i] = 0;
    alpha[i] = 0;
    pos[i * 3 + 1] = -99999; // park unused particles far offscreen
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  geo.setAttribute('aAlpha', new THREE.BufferAttribute(alpha, 1));

  const mat = new THREE.ShaderMaterial({
    uniforms: { uMap: { value: softSprite() } },
    vertexShader: /* glsl */ `
      attribute float aSize;
      attribute float aAlpha;
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        vColor = color;
        vAlpha = aAlpha;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = aSize * (300.0 / -mv.z);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D uMap;
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        float a = texture2D(uMap, gl_PointCoord).a;
        if (a < 0.01) discard;
        gl_FragColor = vec4(vColor, a * vAlpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true,
  });

  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;

  const pAttr = geo.getAttribute('position') as THREE.BufferAttribute;
  const cAttr = geo.getAttribute('color') as THREE.BufferAttribute;
  const sAttr = geo.getAttribute('aSize') as THREE.BufferAttribute;
  const aAttr = geo.getAttribute('aAlpha') as THREE.BufferAttribute;

  let cursor = 0;
  let carry = 0;
  const tmp = new THREE.Color();

  return {
    object: points,
    update(dt, thrust, origin, up) {
      // --- Emit -------------------------------------------------------------
      // Rate scales with thrust; carry the fractional remainder so low thrust
      // still emits smoothly instead of stuttering.
      carry += count * 2.4 * thrust * dt;
      const emit = Math.min(carry | 0, count);
      carry -= emit;

      for (let n = 0; n < emit; n++) {
        const i = cursor;
        cursor = (cursor + 1) % count;
        const j = i * 3;

        // Cone spread around the downward axis (-up).
        const ang = Math.random() * Math.PI * 2;
        const rad = Math.pow(Math.random(), 0.6) * 0.55;
        pos[j] = origin.x + Math.cos(ang) * rad;
        pos[j + 1] = origin.y + (Math.random() - 0.5) * 0.2;
        pos[j + 2] = origin.z + Math.sin(ang) * rad;

        const speed = 19 + Math.random() * 30;
        vel[j] = -up.x * speed + Math.cos(ang) * (1.6 + Math.random() * 3.4);
        vel[j + 1] = -up.y * speed + (Math.random() - 0.5) * 2;
        vel[j + 2] = -up.z * speed + Math.sin(ang) * (1.6 + Math.random() * 3.4);

        maxLife[i] = 0.6 + Math.random() * 1.0;
        life[i] = maxLife[i];
        size[i] = 1.1 + Math.random() * 2.9;
      }

      // --- Step -------------------------------------------------------------
      for (let i = 0; i < count; i++) {
        if (life[i] <= 0) {
          if (alpha[i] !== 0) alpha[i] = 0;
          continue;
        }
        life[i] -= dt;
        const j = i * 3;

        if (life[i] <= 0) {
          alpha[i] = 0;
          pos[j + 1] = -99999;
          continue;
        }

        pos[j] += vel[j] * dt;
        pos[j + 1] += vel[j + 1] * dt;
        pos[j + 2] += vel[j + 2] * dt;

        // Drag: the plume slows and spreads as it dissipates.
        const drag = Math.exp(-dt * 2.1);
        vel[j] *= drag;
        vel[j + 1] *= drag;
        vel[j + 2] *= drag;

        const age = 1 - life[i] / maxLife[i];

        // white-hot → gold → pink
        if (age < 0.45) tmp.copy(HOT).lerp(MID, age / 0.45);
        else tmp.copy(MID).lerp(COOL, (age - 0.45) / 0.55);
        col[j] = tmp.r;
        col[j + 1] = tmp.g;
        col[j + 2] = tmp.b;

        // Fast fade-in, long fade-out.
        const fade = age < 0.08 ? age / 0.08 : Math.pow(1 - (age - 0.08) / 0.92, 1.7);
        alpha[i] = fade * 0.85;
        size[i] *= 1 + dt * 0.9;
      }

      pAttr.needsUpdate = true;
      cAttr.needsUpdate = true;
      sAttr.needsUpdate = true;
      aAttr.needsUpdate = true;
    },
    dispose() {
      geo.dispose();
      mat.dispose();
    },
  };
}
