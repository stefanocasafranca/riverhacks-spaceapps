# RiverHacks 2026 × NASA Space Apps Challenge

One-page site for RiverHacks 2026 — Austin Community College's official hackathon,
participating in the NASA International Space Apps Challenge as the Austin local event.

**Live:** https://riverhacks-spaceapps.org
**Event:** November 14–15, 2026 · ACC Rio Grande Campus, Austin TX
**Register:** https://luma.com/n9rvutt0

---

## What it is

The whole page scrolls through one continuous Three.js launch sequence — scroll is
altitude. A Starship lifts off a fogged pad, climbs through a starfield trailing
exhaust, passes Earth, coasts through deep space, and arrives at Mars. A single fixed
canvas sits behind the entire scrolling DOM; the camera spline is keyed to the real
measured positions of the content sections.

Built mobile-first. The 3D is strictly additive — the page is complete and readable
with JavaScript disabled.

## Stack

| | |
|---|---|
| Runtime / package manager | Bun |
| Framework | Astro (static output, no adapter) |
| Styling | Tailwind CSS v4 via `@tailwindcss/vite` |
| 3D | three.js + Lenis (smooth scroll, pointer-fine only) |
| Hosting | Cloudflare Pages via Wrangler |

## Commands

```bash
bun install
bun run dev             # dev server
bun run build           # production build to dist/
bun run preview         # serve the built output
bun run check           # astro check (typecheck)
bun run deploy:preview  # deploy to the preview branch
bun run deploy:prod     # deploy to production (riverhacks-spaceapps.org)
```

## Layout

```
src/
  data/event.ts        Single source of truth — every date, price, tier and
                       deadline on the page. Change copy here, not in components.
  components/          Section components, all rendering from event.ts
  layouts/Base.astro   Head, meta, OG, JSON-LD Event schema
  three/
    boot.ts            Capability gate + loading screen orchestration
    index.ts           Renderer, animation loop, scroll wiring
    chapters.ts        Camera spline — 6 keyframes, portrait + landscape variants
    tiers.ts           Fidelity ladder (phone / tablet / desktop)
    scene/             starship, plume, starfield, planets, procedural sprites
scripts/
  optimize-model.mjs   Sketchfab glTF -> shipped GLB pipeline (see below)
public/
  models/              starship_lo.glb (phone), starship_hi.glb (desktop)
  textures/            Planet maps at three resolutions
  brand/               Logo marks extracted from the event flyers
```

## Performance notes

Decisions here were measured, not assumed:

- **Critical path is ~16KB gzipped.** three.js is a lazy chunk that loads on
  `requestIdleCallback` after LCP and never blocks first paint.
- **Fidelity tiers** scale DPR cap, particle counts, texture resolution and mesh
  density by device. Frame work measured at **0.88ms median / 1.3ms worst under 6×
  CPU throttle** — under 8% of a 60fps budget.
- **The canvas sizes to `visualViewport`, never `100vh`**, and ignores sub-120px
  height changes, which is what stops iOS Safari's collapsing URL bar from making
  the scene jump on every scroll direction change.
- **Lenis runs on pointer-fine devices only.** Touch keeps native momentum scrolling.
- **Capability gate** skips downloading three.js entirely on `prefers-reduced-motion`,
  Save-Data, or missing WebGL2, leaving a CSS starfield.
- The loading screen is an **overlay, not a gate** — full content is in the DOM
  underneath — with a hard 6.5s ceiling measured from navigation start, and it shows
  once per session.

## The 3D model pipeline

`scripts/optimize-model.mjs` turns the 30MB / 343k-triangle Sketchfab export into
shippable GLBs. Two attributes had to be stripped first:

- `TEXCOORD_0` on every vertex, referenced by **no material** (the model has zero
  textures — Sketchfab emits UVs regardless)
- `NORMAL`, authored per-face

Both split vertices, and split vertices cannot be edge-collapsed, which is why the
simplifier refused to reduce anything. Dropping them lets `weld()` merge 808k → 189k
vertices, unblocking decimation. Normals are omitted from the output and recomputed
by three.js at load — on welded, indexed geometry that yields *smooth* normals, which
is correct for a hull that is mostly cylinder and nosecone.

Compressed with **meshopt, not Draco**: Draco produces a ~80KB smaller mesh but needs
a 279KB wasm decoder, where meshopt's is 29KB.

Result: **30MB → 166KB (phone) / 260KB (desktop).**

```bash
node scripts/optimize-model.mjs <source.gltf> <out.glb> <ratio>
node_modules/.bin/gltf-transform meshopt <out.glb> public/models/starship_hi.glb
```

## Credits

- Starship model — ["SpaceX Starship-With landing legs deployed"](https://sketchfab.com/3d-models/spacex-starship-with-landing-legs-deployed-168d98f7b4d747f88d301050ae645560)
  by [AllThingsSpace](https://sketchfab.com/sunnychen753), [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
- Mars surface map — [Solar System Scope](https://www.solarsystemscope.com/textures/), [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
- Earth imagery — NASA Visible Earth (Blue Marble), public domain
- Type — Archivo and Inter (SIL Open Font License)

Powered by [SerpApi](https://serpapi.com/).

## Contact

stefano.casafrancalaos@austincc.edu · gayathri.swa@gmail.com
