import * as THREE from 'three';

/**
 * Procedural sprite textures.
 *
 * air.inc ships a single cloud.png and billboards it into every cloud bank in
 * the scene. We do the same thing with one soft radial dot — but generate it on
 * a canvas at runtime instead of downloading it, so the entire particle system
 * (stars, dust, exhaust plume) costs zero network bytes.
 */

let softCache: THREE.CanvasTexture | null = null;

/** Soft radial falloff — the one sprite every particle system uses. */
export function softSprite(size = 128): THREE.CanvasTexture {
  if (softCache) return softCache;

  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d')!;
  const r = size / 2;

  const g = ctx.createRadialGradient(r, r, 0, r, r, r);
  // A slightly super-linear falloff reads as a glow rather than a disc.
  g.addColorStop(0.0, 'rgba(255,255,255,1)');
  g.addColorStop(0.18, 'rgba(255,255,255,0.85)');
  g.addColorStop(0.42, 'rgba(255,255,255,0.32)');
  g.addColorStop(0.72, 'rgba(255,255,255,0.06)');
  g.addColorStop(1.0, 'rgba(255,255,255,0)');

  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  softCache = tex;
  return tex;
}

/**
 * Regolith height/albedo noise for the launch-pad ground. Value noise smoothed
 * over a few octaves — enough to break up a flat plane without shipping a map.
 */
export function regolithTexture(size = 256): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(size, size);

  const rand = (x: number, y: number) => {
    const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return n - Math.floor(n);
  };
  const smooth = (x: number, y: number, s: number) => {
    const xi = Math.floor(x / s);
    const yi = Math.floor(y / s);
    const xf = (x / s) % 1;
    const yf = (y / s) % 1;
    const u = xf * xf * (3 - 2 * xf);
    const v = yf * yf * (3 - 2 * yf);
    const a = rand(xi, yi);
    const b = rand(xi + 1, yi);
    const cc = rand(xi, yi + 1);
    const d = rand(xi + 1, yi + 1);
    return a * (1 - u) * (1 - v) + b * u * (1 - v) + cc * (1 - u) * v + d * u * v;
  };

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const n = smooth(x, y, 32) * 0.55 + smooth(x, y, 12) * 0.3 + smooth(x, y, 4) * 0.15;
      const v = 34 + Math.pow(n, 1.35) * 128;
      const i = (y * size + x) * 4;
      img.data[i] = v * 0.95;
      img.data[i + 1] = v * 0.97;
      img.data[i + 2] = v * 1.12; // faint blue cast to sit in the palette
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(26, 26);
  return tex;
}
