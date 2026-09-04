import * as THREE from 'three';
import { detectTier } from './tiers';
import { createScroll } from './scroll';
import { rocketAltitude, sampleFraming } from './chapters';
import { createStars, createDust } from './scene/starfield';
import { createRocket } from './scene/rocket';
import { loadStarship, type Starship } from './scene/starship';
import { createPlume } from './scene/plume';
import { createPlanets } from './scene/planets';

/**
 * Scene orchestrator.
 *
 * Owns the renderer, the single animation loop, and the wiring between scroll
 * progress and everything that moves. Everything it drives lives in ./scene.
 */

export interface StartOptions {
  /** 0..1 real download progress, for the loading screen. */
  onProgress?: (fraction: number) => void;
}

export async function start(
  canvas: HTMLCanvasElement,
  opts: StartOptions = {},
): Promise<() => void> {
  const tier = detectTier();
  const report = opts.onProgress ?? (() => {});

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: tier.name !== 'phone',
    alpha: true,
    powerPreference: 'high-performance',
    // The page never reads pixels back; letting the driver discard the buffer
    // after present is meaningfully cheaper on mobile GPUs.
    preserveDrawingBuffer: false,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, tier.dpr));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.5, 12000);

  // --- Lighting -------------------------------------------------------------
  // One key (the sun), one cool fill so the shadow side isn't dead, and a dim
  // ambient floor. No shadow maps anywhere: nothing in this scene reads as
  // wrong without them, and they're the most expensive thing we could add.
  const sun = new THREE.DirectionalLight('#fff3e0', 3.9);
  sun.position.set(-0.55, 0.42, 0.72).normalize();
  scene.add(sun);

  const fill = new THREE.DirectionalLight('#4d8bd8', 1.35);
  fill.position.set(0.7, -0.25, -0.55).normalize();
  scene.add(fill);

  scene.add(new THREE.AmbientLight('#2b4066', 2.0));

  // Atmospheric haze, but only near the ground. Animating `far` out to a huge
  // value by the end of the ascent gives us a hazy horizon on the pad and a
  // perfectly clear vacuum afterwards, without ever toggling materials.
  const fog = new THREE.Fog(new THREE.Color('#061436'), 24, 430);
  scene.fog = fog;

  // --- Content --------------------------------------------------------------
  const stars = createStars(tier.stars);
  const dust = createDust(tier.dust);
  const plume = createPlume(tier.plume);
  const planets = createPlanets(tier);

  report(0.12);

  // The Starship GLB is the largest asset on the page, so it drives the bulk of
  // the loading bar. If it fails for any reason — offline, 404, decoder problem
  // — fall back to the procedural stack rather than a page with no vehicle.
  let vehicle: Starship | ReturnType<typeof createRocket>;
  try {
    vehicle = await loadStarship(tier, (f) => report(0.12 + f * 0.7));
  } catch {
    vehicle = createRocket();
  }
  report(0.85);

  scene.add(stars.object, dust.object, vehicle.group, plume.object, planets.group);

  const scroll = await createScroll();

  // --- Sizing ---------------------------------------------------------------
  // visualViewport, never 100vh. On iOS the layout viewport changes height as
  // the URL bar collapses; resizing the drawing buffer on every one of those
  // events causes a visible jump and a stall, so we only react to real width or
  // orientation changes and let the height ride.
  let lastW = 0;
  let lastH = 0;

  const resize = (force = false) => {
    const vv = window.visualViewport;
    const w = Math.round(vv?.width ?? window.innerWidth);
    const h = Math.round(vv?.height ?? window.innerHeight);
    // Ignore pure-height jitter under the URL-bar threshold.
    if (!force && w === lastW && Math.abs(h - lastH) < 120) return;
    lastW = w;
    lastH = h;
    renderer.setSize(w, h, false);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize(true);

  let resizeTimer = 0;
  const onResize = () => {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => resize(false), 120);
  };
  window.addEventListener('resize', onResize, { passive: true });
  window.visualViewport?.addEventListener('resize', onResize, { passive: true });
  window.addEventListener('orientationchange', () => resize(true), { passive: true });

  // --- Loop -----------------------------------------------------------------
  const camPos = new THREE.Vector3();
  const lookPos = new THREE.Vector3();
  const rocketPos = new THREE.Vector3();
  const engineWorld = new THREE.Vector3();
  const up = new THREE.Vector3();

  let last = performance.now();
  let painted = false;

  // Dev-only frame-cost probe. rAF deltas are decoupled from real render work
  // in headless Chrome, so automated perf checks need the actual time spent
  // inside the loop. Stripped from production builds.
  const DEV = import.meta.env.DEV;
  let frameAcc = 0;
  let frameN = 0;

  const tick = (now: number) => {
    const t0 = DEV ? performance.now() : 0;
    // Clamp dt so a backgrounded tab or a long GC pause doesn't teleport
    // everything on the next frame.
    const dt = Math.min((now - last) / 1000, 1 / 20);
    last = now;

    scroll.step(dt);
    const p = scroll.value;

    // Vehicle rides the journey; camera framing is relative to it.
    rocketPos.set(0, rocketAltitude(p), 0);
    vehicle.group.position.y = rocketPos.y;
    vehicle.update(dt, p);

    const framing = sampleFraming(p, camera.aspect);
    camPos.set(
      rocketPos.x + framing.cam[0],
      rocketPos.y + framing.cam[1],
      rocketPos.z + framing.cam[2],
    );
    lookPos.set(
      rocketPos.x + framing.look[0],
      rocketPos.y + framing.look[1],
      rocketPos.z + framing.look[2],
    );

    camera.position.copy(camPos);
    camera.lookAt(lookPos);
    if (Math.abs(camera.fov - framing.fov) > 0.01) {
      camera.fov = framing.fov;
      camera.updateProjectionMatrix();
    }

    // Plume emits from the engine plane in world space, along the stack's own
    // up axis, so it stays attached through the gravity turn and the roll.
    const ignite = Math.min(1, Math.max(0, (p - 0.015) / 0.06));
    const burn = 1 - 0.72 * Math.min(1, Math.max(0, (p - 0.4) / 0.2));
    engineWorld.copy(vehicle.enginePoint).applyMatrix4(vehicle.group.matrixWorld);
    up.set(0, 1, 0).applyQuaternion(vehicle.group.quaternion);
    plume.update(dt, ignite * burn, engineWorld, up);

    // Haze burns off through the early ascent.
    const clear = Math.min(1, Math.max(0, (p - 0.02) / 0.14));
    fog.far = 430 + clear * clear * 260000;

    stars.update(camera, dt, p);
    dust.update(camera, dt, p);
    planets.update(dt, p);

    renderer.render(scene, camera);

    if (DEV) {
      frameAcc += performance.now() - t0;
      frameN++;
      if (frameN >= 30) {
        (window as unknown as Record<string, unknown>).__frameMs = frameAcc / frameN;
        (window as unknown as Record<string, unknown>).__tier = tier.name;
        (window as unknown as Record<string, unknown>).__pose = {
          rotY: vehicle.group.rotation.y,
          rotZ: vehicle.group.rotation.z,
          altitude: vehicle.group.position.y,
          progress: p,
        };
        frameAcc = 0;
        frameN = 0;
      }
    }

    if (!painted) {
      painted = true;
      // Reveal only once a real frame exists — no black flash, and the CSS
      // starfield stays up until this moment.
      canvas.dataset.ready = 'true';
      document.getElementById('css-stars')?.style.setProperty('opacity', '0');
      document.documentElement.dataset.webgl = 'on';
      report(1);
    }
  };

  renderer.setAnimationLoop(tick);

  // Stop rendering entirely when the tab isn't visible.
  const onVisibility = () => {
    if (document.hidden) {
      renderer.setAnimationLoop(null);
    } else {
      last = performance.now();
      renderer.setAnimationLoop(tick);
    }
  };
  document.addEventListener('visibilitychange', onVisibility);

  // --- Teardown -------------------------------------------------------------
  return () => {
    renderer.setAnimationLoop(null);
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('resize', onResize);
    window.visualViewport?.removeEventListener('resize', onResize);
    scroll.destroy();
    stars.dispose();
    dust.dispose();
    vehicle.dispose();
    plume.dispose();
    planets.dispose();
    renderer.dispose();
  };
}
