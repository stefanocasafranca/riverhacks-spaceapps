/**
 * Fidelity ladder.
 *
 * One scene, three budgets. Everything expensive is a number here rather than a
 * branch in the scene code, so the phone and the desktop run identical logic and
 * only the counts differ.
 */

export type TierName = 'phone' | 'tablet' | 'desktop';

export interface Tier {
  name: TierName;
  /** Hard ceiling on devicePixelRatio — the single biggest fill-rate lever. */
  dpr: number;
  stars: number;
  dust: number;
  plume: number;
  /** Which texture variant to request (matches the files in /public/textures). */
  planetTex: 512 | 1024 | 2048;
  /** Night-lights layer on Earth: a second 2048 texture isn't worth it on cellular. */
  nightLights: boolean;
  /** Sphere tessellation for planets. */
  planetSegments: number;
}

const TIERS: Record<TierName, Tier> = {
  phone: {
    name: 'phone',
    dpr: 1.5,
    stars: 3000,
    dust: 800,
    plume: 500,
    planetTex: 512,
    nightLights: false,
    planetSegments: 48,
  },
  tablet: {
    name: 'tablet',
    dpr: 1.75,
    stars: 6000,
    dust: 1500,
    plume: 900,
    planetTex: 1024,
    nightLights: true,
    planetSegments: 64,
  },
  desktop: {
    name: 'desktop',
    dpr: 2,
    stars: 12000,
    dust: 4000,
    plume: 2000,
    planetTex: 2048,
    nightLights: true,
    planetSegments: 96,
  },
};

export function detectTier(): Tier {
  const w = window.innerWidth;
  const nav = navigator as Navigator & { deviceMemory?: number };

  let name: TierName = w < 768 ? 'phone' : w < 1280 ? 'tablet' : 'desktop';

  // Screen size is a proxy for GPU budget, not a measurement of it. A weak
  // machine on a big monitor still needs the smaller budget, so step down when
  // the device reports little memory or few cores.
  const weak = (nav.deviceMemory ?? 8) <= 4 || (navigator.hardwareConcurrency ?? 8) <= 4;
  if (weak) name = name === 'desktop' ? 'tablet' : 'phone';

  return TIERS[name];
}
