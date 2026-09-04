/**
 * The camera spline.
 *
 * Scroll progress p ∈ [0,1] drives one continuous flight. The rocket is the
 * protagonist: it climbs a fixed vertical journey, and every camera keyframe is
 * expressed as an *offset from the rocket* rather than an absolute position, so
 * retiming the journey never desyncs the framing.
 *
 * Each keyframe carries a landscape and a portrait variant. We blend between
 * them by aspect ratio, which is what makes the rocket read full-height on a
 * phone instead of cropped — the mobile-first requirement that shaped this file.
 */

import type { Chapter } from '../data/event';

/** Total altitude the rocket travels across the whole page, in world units. */
export const JOURNEY = 3400;

/** Static world placements. Tuned visually — see the Playwright chapter shots. */
export const EARTH = { pos: [300, 470, -560] as const, radius: 340 };
export const MARS = { pos: [-330, 3140, -470] as const, radius: 265 };

export interface Key {
  chapter: Chapter;
  /** Scroll progress this keyframe sits at. */
  p: number;
  /** Camera offset from the rocket — landscape. */
  cam: readonly [number, number, number];
  /** Camera offset from the rocket — portrait (pulled back, less lateral). */
  camP: readonly [number, number, number];
  /** lookAt target, also relative to the rocket. */
  look: readonly [number, number, number];
  lookP: readonly [number, number, number];
  fov: number;
  fovP: number;
}

export const KEYS: Key[] = [
  {
    chapter: 'pad',
    p: 0.0,
    // On the pad. The camera must sit ABOVE the ground plane (y = -0.9) or the
    // single-sided CircleGeometry is backface-culled and the pad vanishes.
    // lookAt is offset left of the stack so the rocket composes into the right
    // third, clear of the headline column.
    cam: [7, 5, 30],
    camP: [4, 4.5, 34],
    look: [-13, 6.5, 0],
    lookP: [-7, 9.5, 0],
    fov: 48,
    fovP: 58,
  },
  {
    chapter: 'ascent',
    p: 0.18,
    // Chase position, off to one side so the plume reads against the sky.
    cam: [18, -5, 26],
    camP: [11, -4, 30],
    look: [-9, 2, 0],
    lookP: [-5.5, 4, 0],
    fov: 50,
    fovP: 60,
  },
  {
    chapter: 'orbit',
    p: 0.35,
    // Camera swings left and turns right/down so Earth fills the frame.
    cam: [-26, -3, 27],
    camP: [-16, -3, 38],
    look: [13, -15, -20],
    lookP: [9, -12, -16],
    fov: 52,
    fovP: 63,
  },
  {
    chapter: 'transit',
    p: 0.5,
    // Deep space: nothing but the rocket, stars, and dust.
    cam: [13, 4, 31],
    camP: [8, 3, 42],
    look: [-9, 1, 0],
    lookP: [-3.5, 2.5, 0],
    fov: 50,
    fovP: 60,
  },
  {
    chapter: 'mars',
    p: 0.76,
    // Camera swings right and turns left/down onto Mars, then idles.
    cam: [30, 8, 34],
    camP: [19, 6, 46],
    look: [-31, -14, -19],
    lookP: [-20, -11, -15],
    fov: 52,
    fovP: 63,
  },
  {
    // Hold at Mars for the whole sponsor/venue/footer run — a slow drift around
    // the planet rather than a fifth destination.
    chapter: 'mars',
    p: 1.0,
    cam: [37, 12, 39],
    camP: [24, 9, 52],
    look: [-36, -12, -18],
    lookP: [-23, -10, -14],
    fov: 50,
    fovP: 61,
  },
];

/** Cubic ease so the flight accelerates off the pad and settles at Mars. */
export function journeyEase(p: number): number {
  return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
}

/** Altitude of the rocket at progress p. */
export function rocketAltitude(p: number): number {
  return journeyEase(p) * JOURNEY;
}

/**
 * Portrait blend factor: 0 = wide landscape, 1 = tall portrait.
 * Crossfades over the aspect band where neither framing is clearly right.
 */
export function portraitMix(aspect: number): number {
  const t = (1.15 - aspect) / (1.15 - 0.72);
  return t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t);
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export interface Framing {
  cam: [number, number, number];
  look: [number, number, number];
  fov: number;
}

/**
 * Sample the spline at progress p for a given aspect ratio.
 *
 * Deliberately a piecewise Catmull-Rom on each component rather than a
 * THREE.CatmullRomCurve3: the fov and the portrait blend need the same
 * interpolation as the positions, and doing it by hand keeps them in lockstep.
 */
export function sampleFraming(p: number, aspect: number): Framing {
  const m = portraitMix(aspect);

  // Locate the segment.
  let i = 0;
  while (i < KEYS.length - 2 && p > KEYS[i + 1].p) i++;
  const a = KEYS[i];
  const b = KEYS[i + 1];
  const span = b.p - a.p;
  const raw = span > 0 ? (p - a.p) / span : 0;
  const t = raw < 0 ? 0 : raw > 1 ? 1 : raw;
  // Smoothstep within the segment so chapter boundaries don't show as a kink.
  const s = t * t * (3 - 2 * t);

  const axis = (k: Key, key: 'cam' | 'camP' | 'look' | 'lookP', j: number) => k[key][j];

  const blend = (k: Key, wide: 'cam' | 'look', tall: 'camP' | 'lookP', j: number) =>
    lerp(axis(k, wide, j), axis(k, tall, j), m);

  return {
    cam: [
      lerp(blend(a, 'cam', 'camP', 0), blend(b, 'cam', 'camP', 0), s),
      lerp(blend(a, 'cam', 'camP', 1), blend(b, 'cam', 'camP', 1), s),
      lerp(blend(a, 'cam', 'camP', 2), blend(b, 'cam', 'camP', 2), s),
    ],
    look: [
      lerp(blend(a, 'look', 'lookP', 0), blend(b, 'look', 'lookP', 0), s),
      lerp(blend(a, 'look', 'lookP', 1), blend(b, 'look', 'lookP', 1), s),
      lerp(blend(a, 'look', 'lookP', 2), blend(b, 'look', 'lookP', 2), s),
    ],
    fov: lerp(lerp(a.fov, a.fovP, m), lerp(b.fov, b.fovP, m), s),
  };
}
