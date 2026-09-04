/**
 * Scroll → progress.
 *
 * Two deliberate mobile-first choices:
 *
 *  1. Lenis runs on pointer-fine devices only. On touch we read native scroll
 *     and never hijack it — momentum stays correct, and we don't burn battery
 *     re-implementing something the OS already does well.
 *
 *  2. Nothing here touches three.js. The scroll handler only writes a float;
 *     the render loop reads it and damps toward it. Doing 3D work inside a
 *     scroll callback is what makes these pages feel like they're dragging.
 */

export interface ScrollSource {
  /** Damped progress in [0,1], advanced by step(). */
  readonly value: number;
  /** Raw (undamped) progress in [0,1]. */
  readonly target: number;
  step(dt: number): void;
  destroy(): void;
}

export async function createScroll(): Promise<ScrollSource> {
  let target = 0;
  let value = 0;
  let lenis: { raf(t: number): void; destroy(): void } | null = null;
  let rafId = 0;

  const measure = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    target = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
  };

  const wantsSmooth =
    window.matchMedia('(pointer: fine)').matches &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (wantsSmooth) {
    const { default: Lenis } = await import('lenis');
    const instance = new Lenis({
      duration: 1.05,
      // Never sync touch — see note above.
      syncTouch: false,
      smoothWheel: true,
    });
    instance.on('scroll', measure);
    // Dev-only handle. Lenis owns scroll position once it's running, so
    // window.scrollTo gets reverted on the next frame — automated checks need
    // this to drive the page. Stripped from production builds.
    if (import.meta.env.DEV) {
      (window as unknown as Record<string, unknown>).__lenis = instance;
    }
    const raf = (time: number) => {
      instance.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);
    lenis = instance;
  } else {
    window.addEventListener('scroll', measure, { passive: true });
  }

  window.addEventListener('resize', measure, { passive: true });
  measure();

  return {
    get value() {
      return value;
    },
    get target() {
      return target;
    },
    step(dt: number) {
      // Frame-rate independent exponential damping. Keeps the camera from
      // snapping on a 120Hz phone and from lagging on a 30Hz one.
      const k = 1 - Math.exp(-dt * 6.5);
      value += (target - value) * k;
    },
    destroy() {
      if (rafId) cancelAnimationFrame(rafId);
      lenis?.destroy();
      window.removeEventListener('scroll', measure);
      window.removeEventListener('resize', measure);
    },
  };
}
