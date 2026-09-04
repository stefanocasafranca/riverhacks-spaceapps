/**
 * Capability gate + launch-sequence loading screen.
 *
 * three.js plus the Starship GLB is the only heavy thing on this page. The
 * content itself is complete and readable without either, so we decide whether
 * to download them at all BEFORE touching the import.
 *
 * When we do load them, the preloader turns the wait into something legible —
 * logos, a real progress bar, the title-partner credit — instead of a page that
 * pops into existence halfway through. Three rules keep that from becoming a
 * liability:
 *
 *   1. It is an overlay, never a gate. The full page is in the DOM underneath
 *      the whole time, so crawlers and assistive tech are unaffected.
 *   2. It has a hard timeout. If the network stalls, the site reveals anyway.
 *   3. It shows once per session. A repeat visit goes straight to the content.
 */

const MIN_VISIBLE_MS = 450; // below this it reads as a flash, not a loader
const MAX_TOTAL_MS = 6500; // hard ceiling, measured from NAVIGATION START
const SEEN_KEY = 'rh26:booted';

const startedAt = performance.now();

const el = {
  pre: document.getElementById('preloader'),
  bar: document.getElementById('pl-bar'),
  pct: document.getElementById('pl-pct'),
  canvas: document.getElementById('space-canvas') as HTMLCanvasElement | null,
};

let dismissed = false;

/*
 * Progress model.
 *
 * `target` is real, measured progress. `display` is what the bar shows, and it
 * eases toward the target while ALSO creeping forward on its own whenever the
 * target is stalled.
 *
 * The creep exists because there is a genuine silent gap in the middle of the
 * load: between "started fetching the three.js chunk" and "the GLB began
 * streaming" there is no event to measure, and a bar frozen at 6% for two
 * seconds is precisely the anxiety this screen is supposed to remove.
 *
 * It is capped at CREEP_MAX and decays as it approaches, so it can drift but
 * can never reach 100% on its own — only real completion does that.
 */
const CREEP_MAX = 0.9;
let target = 0;
let display = 0;
let rafId = 0;

function paint() {
  if (el.bar) el.bar.style.width = `${(display * 100).toFixed(1)}%`;
  if (el.pct) el.pct.textContent = String(Math.floor(display * 100));
}

function loop() {
  // Ease toward whatever we actually know.
  display += (Math.max(target, display) - display) * 0.12;
  // Then drift, slower the closer we get, so it always looks alive.
  if (display < CREEP_MAX) display += (CREEP_MAX - display) * 0.006;
  paint();
  if (!dismissed) rafId = requestAnimationFrame(loop);
}

function setProgress(f: number) {
  target = Math.max(target, Math.min(1, f));
}

function reveal() {
  if (dismissed) return;
  dismissed = true;

  const finish = () => {
    cancelAnimationFrame(rafId);
    target = 1;
    display = 1;
    paint();
    el.pre?.setAttribute('data-done', 'true');
    document.documentElement.classList.remove('is-loading');
    // The page was unscrollable while the overlay was up, so anything that
    // measured document height during that window (Lenis, our own scroll
    // reader) needs a nudge to re-measure now that it can scroll again.
    window.dispatchEvent(new Event('resize'));
    try {
      sessionStorage.setItem(SEEN_KEY, '1');
    } catch {
      /* private mode — just show the loader again next time */
    }
  };

  const elapsed = performance.now() - startedAt;
  if (elapsed < MIN_VISIBLE_MS) setTimeout(finish, MIN_VISIBLE_MS - elapsed);
  else finish();
}

/*
 * Give up waiting and show the site regardless of what the network is doing.
 *
 * Anchored to navigation start, not to when this script happened to execute.
 * performance.now() is already relative to timeOrigin, so subtracting it makes
 * the ceiling a promise about what the VISITOR experiences — otherwise the
 * HTML/CSS/JS download time is added on top of it and a 6.5s cap silently
 * becomes 8.7s on a slow link.
 */
setTimeout(reveal, Math.max(400, MAX_TOTAL_MS - performance.now()));

const decline = (reason: string) => {
  document.documentElement.dataset.webgl = reason;
  el.canvas?.remove();
  reveal();
};

function supportsWebGL2(): boolean {
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2');
    if (!gl) return false;
    // Release the probe context immediately — some mobile drivers cap the
    // number of live contexts and would refuse the real one.
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}

function shouldLoad(): string | true {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 'reduced-motion';

  const conn = (
    navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }
  ).connection;
  if (conn?.saveData) return 'save-data';
  if (conn?.effectiveType && /(^|-)2g$/.test(conn.effectiveType)) return 'slow-network';

  if (!supportsWebGL2()) return 'no-webgl2';

  return true;
}

function boot() {
  if (!el.canvas) return reveal();

  const verdict = shouldLoad();
  if (verdict !== true) return decline(verdict);

  setProgress(0.06);

  import('./index')
    .then(({ start }) => {
      setProgress(0.1);
      return start(el.canvas!, { onProgress: setProgress });
    })
    .then(reveal)
    .catch(() => {
      // A failed chunk, a lost context, a driver crash — any of them leave the
      // CSS starfield showing and the page fully usable.
      decline('failed');
    });
}

// Repeat visits in the same session skip the loading screen entirely; the
// assets are in the HTTP cache and a second wait would be pure friction.
let seen = false;
try {
  seen = sessionStorage.getItem(SEEN_KEY) === '1';
} catch {
  /* ignore */
}

if (seen || !el.pre) {
  el.pre?.setAttribute('data-done', 'true');
  document.documentElement.classList.remove('is-loading');
  dismissed = true;
  // Still load the scene — just without holding the page back for it.
  if (el.canvas) {
    const verdict = shouldLoad();
    if (verdict !== true) {
      document.documentElement.dataset.webgl = verdict;
      el.canvas.remove();
    } else if ('requestIdleCallback' in window) {
      requestIdleCallback(
        () =>
          import('./index')
            .then(({ start }) => start(el.canvas!))
            .catch(() => {
              document.documentElement.dataset.webgl = 'failed';
              el.canvas?.remove();
            }),
        { timeout: 2500 },
      );
    } else {
      setTimeout(
        () =>
          import('./index')
            .then(({ start }) => start(el.canvas!))
            .catch(() => {
              document.documentElement.dataset.webgl = 'failed';
              el.canvas?.remove();
            }),
        600,
      );
    }
  }
} else {
  document.documentElement.classList.add('is-loading');
  rafId = requestAnimationFrame(loop);
  boot();
}
