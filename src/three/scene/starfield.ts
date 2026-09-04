import * as THREE from 'three';
import { softSprite } from './sprite';

/**
 * Starfield + drifting dust.
 *
 * Both are THREE.Points using the one procedural sprite. The starfield is
 * parented to nothing and simply recentred on the camera each frame, so it
 * behaves like a skybox at a fraction of the cost of six cubemap faces (which
 * is what air.inc pays for their sky).
 */

export interface Field {
  object: THREE.Points;
  update(camera: THREE.Camera, dt: number, progress: number): void;
  dispose(): void;
}

const STAR_TINTS = [
  new THREE.Color('#ffffff'),
  new THREE.Color('#cfe4ff'),
  new THREE.Color('#9fc6ff'),
  new THREE.Color('#ffe9c9'),
  new THREE.Color('#7fd4ff'),
];

export function createStars(count: number): Field {
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const size = new Float32Array(count);

  const R = 4200;
  const c = new THREE.Color();

  for (let i = 0; i < count; i++) {
    // Uniform on a sphere shell.
    const u = Math.random() * 2 - 1;
    const th = Math.random() * Math.PI * 2;
    const s = Math.sqrt(1 - u * u);
    const r = R * (0.82 + Math.random() * 0.18);
    pos[i * 3] = r * s * Math.cos(th);
    pos[i * 3 + 1] = r * u;
    pos[i * 3 + 2] = r * s * Math.sin(th);

    // Heavily skewed so most stars are faint and a few genuinely pop.
    const b = Math.pow(Math.random(), 2.6);
    c.copy(STAR_TINTS[(Math.random() * STAR_TINTS.length) | 0]).multiplyScalar(0.35 + b * 0.65);
    col[i * 3] = c.r;
    col[i * 3 + 1] = c.g;
    col[i * 3 + 2] = c.b;

    size[i] = 9 + b * 46;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));

  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uMap: { value: softSprite() },
      uOpacity: { value: 0 },
      uTime: { value: 0 },
    },
    vertexShader: /* glsl */ `
      attribute float aSize;
      varying vec3 vColor;
      varying float vTwinkle;
      uniform float uTime;
      void main() {
        vColor = color;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        // Cheap per-star twinkle from its own position as the phase seed.
        vTwinkle = 0.78 + 0.22 * sin(uTime * 1.7 + position.x * 0.01 + position.y * 0.017);
        gl_PointSize = aSize * vTwinkle * (300.0 / -mv.z);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D uMap;
      uniform float uOpacity;
      varying vec3 vColor;
      varying float vTwinkle;
      void main() {
        float a = texture2D(uMap, gl_PointCoord).a;
        if (a < 0.01) discard;
        gl_FragColor = vec4(vColor * vTwinkle, a * uOpacity);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true,
  });

  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  points.renderOrder = -10;

  let t = 0;
  return {
    object: points,
    update(camera, dt, progress) {
      t += dt;
      mat.uniforms.uTime.value = t;
      // Stars strengthen as we leave the atmosphere.
      const target = 0.25 + Math.min(1, progress / 0.34) * 0.75;
      const u = mat.uniforms.uOpacity;
      u.value += (target - u.value) * Math.min(1, dt * 3);
      points.position.copy(camera.position);
    },
    dispose() {
      geo.dispose();
      mat.dispose();
    },
  };
}

/**
 * Near-field dust. Wraps inside a box that follows the camera, which reads as
 * speed without ever needing to respawn or sort anything.
 */
export function createDust(count: number): Field {
  const HALF = 90;
  const pos = new Float32Array(count * 3);
  const size = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() * 2 - 1) * HALF;
    pos[i * 3 + 1] = (Math.random() * 2 - 1) * HALF;
    pos[i * 3 + 2] = (Math.random() * 2 - 1) * HALF;
    size[i] = 0.35 + Math.random() * 1.5;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));

  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uMap: { value: softSprite() },
      uOpacity: { value: 0 },
      uTint: { value: new THREE.Color('#8fc8ff') },
      uStretch: { value: 1 },
    },
    vertexShader: /* glsl */ `
      attribute float aSize;
      uniform float uStretch;
      varying float vFade;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        // Fade at the box edges so wrapping is never visible as a pop.
        float d = length(position) / 90.0;
        vFade = 1.0 - smoothstep(0.55, 1.0, d);
        gl_PointSize = aSize * uStretch * (300.0 / -mv.z);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D uMap;
      uniform float uOpacity;
      uniform vec3 uTint;
      varying float vFade;
      void main() {
        float a = texture2D(uMap, gl_PointCoord).a;
        if (a < 0.01) discard;
        gl_FragColor = vec4(uTint, a * uOpacity * vFade);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;

  const attr = geo.getAttribute('position') as THREE.BufferAttribute;
  const prev = new THREE.Vector3();
  let first = true;

  return {
    object: points,
    update(camera, dt, progress) {
      if (first) {
        prev.copy(camera.position);
        first = false;
      }
      // Move dust opposite to camera travel, then wrap into the box.
      const dx = camera.position.x - prev.x;
      const dy = camera.position.y - prev.y;
      const dz = camera.position.z - prev.z;
      prev.copy(camera.position);

      const arr = attr.array as Float32Array;
      const drift = dt * 3;
      for (let i = 0; i < count; i++) {
        const j = i * 3;
        let x = arr[j] - dx;
        let y = arr[j + 1] - dy - drift;
        let z = arr[j + 2] - dz;
        if (x > HALF) x -= HALF * 2;
        else if (x < -HALF) x += HALF * 2;
        if (y > HALF) y -= HALF * 2;
        else if (y < -HALF) y += HALF * 2;
        if (z > HALF) z -= HALF * 2;
        else if (z < -HALF) z += HALF * 2;
        arr[j] = x;
        arr[j + 1] = y;
        arr[j + 2] = z;
      }
      attr.needsUpdate = true;

      points.position.copy(camera.position);

      // Densest through the ascent and the deep-space transit, thin elsewhere.
      const ascent = 1 - Math.min(1, Math.abs(progress - 0.26) / 0.24);
      const transit = 1 - Math.min(1, Math.abs(progress - 0.72) / 0.26);
      const target = 0.05 + Math.max(ascent, transit) * 0.22;
      const u = mat.uniforms.uOpacity;
      u.value += (target - u.value) * Math.min(1, dt * 2.5);
      mat.uniforms.uStretch.value = 1 + ascent * 1.6;
    },
    dispose() {
      geo.dispose();
      mat.dispose();
    },
  };
}
