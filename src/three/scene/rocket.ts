import * as THREE from 'three';
import { softSprite } from './sprite';

/**
 * The rocket, built entirely from primitives.
 *
 * An SLS-style stack — core, two boosters, nose cones, engine bells — lathed
 * from primitives rather than loaded. This is what buys us the "no GLB"
 * decision: the whole hero object is a few hundred bytes of vertex data
 * generated on device, versus a multi-megabyte download over cellular.
 *
 * Brand note: the core carries a cyan stripe rather than NASA's orange, so the
 * scene reads as RiverHacks rather than as a NASA replica.
 */

export interface Rocket {
  group: THREE.Group;
  /** World-space position of the engine plane, for the plume to attach to. */
  enginePoint: THREE.Vector3;
  update(dt: number, progress: number): void;
  dispose(): void;
}

const CORE_R = 0.92;
const CORE_H = 10.5;
const NOSE_H = 3.4;
const SRB_R = 0.5;
const SRB_H = 7.6;
const SRB_X = 1.47;

export function createRocket(): Rocket {
  const group = new THREE.Group();
  const disposables: Array<{ dispose(): void }> = [];

  const track = <T extends { dispose(): void }>(x: T): T => {
    disposables.push(x);
    return x;
  };

  const shell = track(
    new THREE.MeshStandardMaterial({
      color: '#f6f9ff',
      metalness: 0.12,
      roughness: 0.52,
    }),
  );
  const dark = track(
    new THREE.MeshStandardMaterial({ color: '#3d4a66', metalness: 0.45, roughness: 0.4 }),
  );
  const accent = track(
    new THREE.MeshStandardMaterial({
      color: '#24b4f0',
      metalness: 0.3,
      roughness: 0.3,
      emissive: new THREE.Color('#24b4f0'),
      emissiveIntensity: 0.35,
    }),
  );
  const nozzle = track(
    new THREE.MeshStandardMaterial({ color: '#232c42', metalness: 0.7, roughness: 0.32 }),
  );

  // --- Core stage -----------------------------------------------------------
  const core = new THREE.Mesh(
    track(new THREE.CylinderGeometry(CORE_R, CORE_R, CORE_H, 32, 1)),
    shell,
  );
  core.position.y = CORE_H / 2;
  group.add(core);

  // Cyan band near the top of the core
  const band = new THREE.Mesh(
    track(new THREE.CylinderGeometry(CORE_R * 1.012, CORE_R * 1.012, 0.62, 32, 1)),
    accent,
  );
  band.position.y = CORE_H - 1.5;
  group.add(band);

  // Dark intertank ring
  const ring = new THREE.Mesh(
    track(new THREE.CylinderGeometry(CORE_R * 1.01, CORE_R * 1.01, 0.9, 32, 1)),
    dark,
  );
  ring.position.y = CORE_H * 0.42;
  group.add(ring);

  // --- Nose cone ------------------------------------------------------------
  const nose = new THREE.Mesh(track(new THREE.ConeGeometry(CORE_R, NOSE_H, 32)), shell);
  nose.position.y = CORE_H + NOSE_H / 2;
  group.add(nose);

  const tip = new THREE.Mesh(track(new THREE.ConeGeometry(0.1, 0.7, 12)), dark);
  tip.position.y = CORE_H + NOSE_H + 0.28;
  group.add(tip);

  // --- Boosters -------------------------------------------------------------
  const srbGeo = track(new THREE.CylinderGeometry(SRB_R, SRB_R, SRB_H, 24, 1));
  const srbNoseGeo = track(new THREE.ConeGeometry(SRB_R, 1.7, 24));
  const srbBellGeo = track(new THREE.CylinderGeometry(SRB_R * 0.62, SRB_R * 0.92, 0.7, 20, 1, true));

  for (const sx of [-1, 1]) {
    const srb = new THREE.Mesh(srbGeo, shell);
    srb.position.set(sx * SRB_X, SRB_H / 2, 0);
    group.add(srb);

    const srbNose = new THREE.Mesh(srbNoseGeo, dark);
    srbNose.position.set(sx * SRB_X, SRB_H + 0.85, 0);
    group.add(srbNose);

    const bell = new THREE.Mesh(srbBellGeo, nozzle);
    bell.position.set(sx * SRB_X, -0.35, 0);
    group.add(bell);
  }

  // --- Main engine bells ----------------------------------------------------
  const bellGeo = track(new THREE.CylinderGeometry(0.24, 0.42, 0.85, 18, 1, true));
  for (const [bx, bz] of [
    [0.42, 0.42],
    [-0.42, 0.42],
    [0.42, -0.42],
    [-0.42, -0.42],
  ]) {
    const b = new THREE.Mesh(bellGeo, nozzle);
    b.position.set(bx, -0.42, bz);
    group.add(b);
  }

  // --- Engine glow ----------------------------------------------------------
  // A single additive sprite standing in for bloom. On the phone tier there is
  // no post-processing pass at all, so this is what sells the heat.
  const glowMat = track(
    new THREE.SpriteMaterial({
      map: softSprite(),
      color: new THREE.Color('#ffd9a0'),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      opacity: 0,
    }),
  );
  const glow = new THREE.Sprite(glowMat);
  glow.scale.set(9, 9, 1);
  glow.position.y = -1.1;
  group.add(glow);

  const enginePoint = new THREE.Vector3(0, -0.8, 0);

  const smooth = (e0: number, e1: number, x: number) => {
    const k = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
    return k * k * (3 - 2 * k);
  };

  let t = 0;
  return {
    group,
    enginePoint,
    update(dt, progress) {
      t += dt;

      // Ignition ramps over the first slice of the page. The engines throttle
      // down in vacuum but never fully cut — a dead rocket for the last 40% of
      // the page reads as broken, not as coasting.
      const ignite = smooth(0.015, 0.075, progress);
      const burn = 1 - 0.72 * smooth(0.4, 0.6, progress);
      const thrust = ignite * burn;

      glowMat.opacity = thrust * (0.72 + Math.sin(t * 26) * 0.09 + Math.sin(t * 9.3) * 0.06);
      const flick = 1 + Math.sin(t * 21) * 0.07;
      glow.scale.set(11 * flick * (0.6 + thrust * 0.4), 14 * flick * (0.6 + thrust * 0.4), 1);
      accent.emissiveIntensity = 0.25 + thrust * 0.5;

      // Attitude. Everything here is driven by SCROLL, not elapsed time, so the
      // stack holds its pose when the page is still.
      const turn = smooth(0.08, 0.58, progress);

      // Gravity turn: pitches over as it climbs.
      group.rotation.z = -turn * 0.22;

      // Roll program: one ~35-degree roll shortly after liftoff that settles
      // and then holds — what a real vehicle does to align its trajectory.
      // Previously this was `t * 0.09 * (...)`, an unbounded time-based yaw
      // that span the rocket like a turntable forever.
      //
      // Capped at 35 deg deliberately: at 90 the two boosters line up with the
      // view axis and hide behind the core, which makes the stack read as a
      // thin pencil instead of a heavy-lift vehicle.
      group.rotation.y = smooth(0.03, 0.17, progress) * 0.61;

      // Engine shake, strongest right after ignition. Time-based on purpose —
      // vibration should not freeze when scrolling stops.
      const shake = thrust * (1 - turn * 0.7) * 0.035;
      group.position.x = Math.sin(t * 34) * shake;
      group.position.z = Math.cos(t * 29) * shake;
    },
    dispose() {
      for (const d of disposables) d.dispose();
    },
  };
}
