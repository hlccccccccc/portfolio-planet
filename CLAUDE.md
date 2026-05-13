# CLAUDE.md — portfolio-planet

This is Hugo van Stalle's portfolio website. It's an Outer Wilds-themed 3D scene where the user looks at a small planet with a campfire in the middle, surrounded by objects representing his work and life sections. The site lives at hugovanstalle.work.

**Read this entire file at the start of every session before writing any code.**

---

## Concept

The home page is a 3D scene: a small planet (top half visible only), campfire in the center, silhouetted pine trees around it, deep navy night sky with stars. Around the campfire are 10 interactive objects:

- **Right side, 6 work items** representing case studies
- **Left side, 4 section items** representing About, Career, Playground, Contact

The user can click-drag to rotate the planet within ±30° on the Y axis. They never see the bottom of the planet. Hovering an object scales it slightly, ramps up emissive glow, and shows a 3D billboard label. Clicking an object drifts the camera toward it (~800ms GSAP tween) and overlays a frosted-glass route panel with the content.

The Canvas is mounted **once in the root layout and never unmounts**. Routes are DOM siblings that overlay it.

## Routes

```
/                              Home (campfire scene)
/work/muba-app                 Muba app (mascot dumbbell)
/work/muba-website             Muba website (signpost)
/work/brevo-onboarding         Brevo onboarding (lantern with logo)
/work/brevo-benchmark          Brevo omnichannel benchmark (lava lamp blobs)
/work/paper                    Research paper (journal + magnifying glass)
/work/portfolio                This portfolio (mini-planet)
/about                         About me (pinned photo)
/career                        Career + CV (logbook)
/playground                    Playground (wooden chest)
/contact                       Contact (mailbox)
```

## Stack — pinned versions

Do not upgrade these without asking. Major versions of three.js, R3F, and drei have breaking changes that cascade.

```json
{
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "react-router-dom": "^7.0.0",
  "three": "^0.167.0",
  "@react-three/fiber": "^9.0.0",
  "@react-three/drei": "^10.0.0",
  "@react-three/postprocessing": "^3.0.0",
  "postprocessing": "^6.36.0",
  "zustand": "^5.0.0",
  "gsap": "^3.12.5",
  "@react-spring/three": "^9.7.0",
  "maath": "^0.10.8",
  "leva": "^0.10.0",
  "r3f-perf": "^7.2.0",
  "detect-gpu": "^5.0.0"
}
```

**Build:** Vite 6, React 18, TypeScript strict mode. Package manager is **pnpm**. Node 22 LTS (see `.nvmrc`).

## Folder structure

```
src/
├── components/
│   ├── scene/                 Everything inside <Canvas>
│   │   ├── Planet.tsx
│   │   ├── Campfire.tsx
│   │   ├── Trees.tsx
│   │   ├── Stars.tsx
│   │   ├── Items/             One file per object
│   │   └── Camera.tsx
│   ├── ui/                    DOM siblings (overlays, buttons, modal)
│   │   ├── RouteOverlay.tsx
│   │   ├── AudioToggle.tsx
│   │   └── SkipLink.tsx
│   ├── materials/             One file per material
│   ├── effects/               Post-processing chain
│   └── layout/                Root layout with persistent Canvas
├── shaders/
│   ├── SHADERS.md             Catalog with source + license + modifications
│   └── lygia/                 Git submodule
├── store/
│   ├── useSceneStore.ts       Hovered/active items, camera target
│   └── useUIStore.ts          Audio on/off, reduced motion, etc.
├── hooks/
├── pages/                     One file per route
├── assets/                    Off-limits to Claude. Hugo owns this.
│   ├── textures/
│   ├── models/
│   └── audio/
└── references/                Mood-board PNGs for prompts
```

**Hugo owns `assets/`. Do not generate, modify, or guess at files in this folder. If a texture or model is missing, stop and ask.**

## Coordinate system and scene constants

- **Y is up.** 1 unit = 1 meter.
- **Planet radius: R = 10.** Centered at origin. Hard-coded, do not parameterize.
- **Camera default position:** `[0, 4, 18]` looking at `[0, 6, 0]`. FOV 50°, near 0.1, far 1500.
- **Camera rotation constraint:** azimuth ±30° (≈ ±0.52 rad), polar angle locked.
- **Items are placed in spherical coordinates on the planet surface**, then offset outward by their height. Tilt each item slightly inward (toward camera) so it stays readable through the rotation arc.

## Conventions and hard rules

These are non-negotiable. Violating them produces real bugs.

1. **No `setState` inside `useFrame`.** Mutate refs. State changes inside the render loop cause re-render storms.
2. **No new `Vector3`/`Quaternion`/`Euler` allocations inside `useFrame` or `useMemo` callbacks.** Lift them to module scope or component-scope refs. Garbage pressure at 60 fps is real.
3. **`useMemo` every geometry and material** declared inside a component. Re-creating them on every render is the #1 R3F performance bug.
4. **Zustand selectors, not destructuring.** Use `useStore(s => s.x)` everywhere. Destructuring re-renders on any state change.
5. **`dpr={[1, 2]}`** clamped on the Canvas. Never uncapped.
6. **Toggle visibility with `visible` prop, not conditional unmount.** Recompiling materials on remount is brutal.
7. **Tween quaternions with `slerp()`, never Euler rotations.** Euler gimbal-locks at 90° pitch.
8. **Color management.** Color textures get `colorSpace = SRGBColorSpace` (drei's `useTexture` does this for `map`/`emissiveMap`). Normal/roughness/AO maps stay `LinearSRGBColorSpace`. Renderer is `gl={{ toneMapping: THREE.NoToneMapping }}` because the `<ToneMapping>` effect handles it at the end of the post chain.
9. **AgX tone mapping, not ACES.** ACES washes warm saturation. AgX keeps the Outer Wilds ember palette intact.
10. **EffectComposer needs `frameBufferType={HalfFloatType}`** for HDR bloom to actually bloom.
11. **Bloom selectivity** via `toneMapped={false}` and emissive color above 1.0 on meshes that should bloom (fire, lantern interior, hover-glowing items). Set `luminanceThreshold={1.0}` on Bloom.
12. **Don't use `<Html occlude>`** for more than a handful of markers — it raycasts every frame. We have 10 items max, so it's fine here, but never go higher.
13. **`useGLTF.preload()` OR `<Preload all />`, not both.** Drei bug #1985 causes shader-compile lag if you combine them.

## Shader policy

**Do not write GLSL from scratch.** Adapt shaders from Lygia, Shadertoy, Maxime Heckel's blog, or glsl-noise. Every shader file gets an entry in `src/shaders/SHADERS.md` with:

- Source URL
- License
- Modifications made
- Uniforms exposed

Wrap shaders with drei's `shaderMaterial` helper. Expose every uniform as a Leva control during development. Bake values to constants only when committed to production.

## Vibe coding workflow

1. **One goal per session.** "Make the campfire flicker correctly" not "build the whole campfire and the trees."
2. **Atomic prompts ≤50 lines of expected diff** for materials, shaders, single camera moves, single drei integrations.
3. **Feature prompts** for one component + its hook ("the ship-log HUD," "the codex 3D prop").
4. **Never ask for the whole scene in one shot** unless prototyping for trash.
5. **Screenshots beat descriptions.** Paste browser screenshots for any visual bug. Use the Chrome DevTools MCP plugin for autonomous screenshot loops.
6. **Leva controls every uniform during dev.** Tweak in browser, then ask to "bake values from Leva into constants."
7. **For 3D math / complex architecture, use Opus.** For everything else, default model.
8. **Commit at the end of every session.** No exceptions.

## Phase plan

The project ships in 8 phases. Each phase is a branch (`phase-N-name`), merged when working. **Do not start phase N+1 until phase N is committed, pushed, and previewed on the Cloudflare Pages URL.**

1. **Project rails.** Repo, pinned versions, this file, folder structure, Vite scaffold, empty routes, Cloudflare Pages preview deploy.
2. **Bare scene.** Persistent Canvas in root layout, perspective camera, navy background, placeholder sphere, procedural starfield.
3. **Planet + environment.** Hemisphere with hand-painted texture, fog, hemisphere light, sun, billboarded tree silhouettes.
4. **Campfire.** Logs, flame shader, point light, ember particles, flicker.
5. **Items, placeholder geometry.** All 10 objects as primitive boxes in correct positions with correct lean. Hover states (scale + emissive). Click handlers writing to Zustand. Drei `<Text>` billboard labels.
6. **Camera + routes.** Click-drag rotation (±30° constrained), camera drift on item click, frosted-glass route overlay, all 10 routes navigable.
7. **Object pass.** Replace placeholders with real objects. Bucket 1 first (signpost, mailbox, logbook, lantern, mini-planet), then Bucket 2 (dumbbell, chest, journal+magnifier), then Bucket 3 (blobs shader).
8. **Polish.** Post-processing chain (selective bloom, vignette, noise, AgX). Audio (off by default, localStorage toggle, positional from campfire). Mobile fallback ladder via detect-gpu. Accessibility (reduced-motion, `@react-three/a11y` wrappers, skip link). SEO meta + prerender. Real case study content.

## Audio

- **Off by default.** Browsers block autoplay anyway, and a recruiter opening this on a quiet train shouldn't get banjo.
- **Toggle in the bottom-left UI corner.** Persist choice in localStorage.
- **Positional audio from the campfire** via Three.js `PositionalAudio`. Fades as camera drifts toward route content.
- **Licensed track only.** Do not use Outer Wilds OST. Source from Musicbed, Artlist, Epidemic Sound, or commission. License doc in `assets/audio/LICENSE.md`.

## Performance budget

- **60 fps locked on desktop, 30 fps acceptable on mid-range mobile.**
- **LCP < 2.5s, INP < 200ms, CLS < 0.1.**
- **Draw calls ≤ 100, triangles ≤ 500k.**
- **Initial transfer < 1.5 MB, total lazy < 10 MB desktop / 4 MB mobile.**
- **Planet GLB < 2 MB after Meshopt + KTX2.**

## Mobile fallback ladder (Phase 8)

Gated by `@pmndrs/detect-gpu` tier output. Cache the tier in Zustand, don't re-detect.

- **Tier 0** (no WebGL, blocklisted GPU): static JPEG hero, full text fallback.
- **Tier 1** mobile: planet only, no shadows, no postprocessing, 1500 stars (not 5000), dpr `[1, 1.5]`, no HDRI.
- **Tier 2+**: full scene with bloom + vignette, no DoF.
- **Tier 3**: everything on.

Layer `navigator.hardwareConcurrency < 4` and `navigator.deviceMemory < 4` as secondary heuristics since detect-gpu's benchmark data hasn't updated since Dec 2025.

drei's `<PerformanceMonitor>` adapts at runtime: `onIncline` raises dpr, `onDecline` lowers it, `onFallback` disables shadows.

## Accessibility

- **`prefers-reduced-motion`:** disable camera autoplay, particle storms, scroll-driven swoops. Provide static fallback frame.
- **`@react-three/a11y`:** wrap each item in `<A11y role="button" description="...">`. Mount `<A11yAnnouncer />` once.
- **Drei `<Html>` markers as real `<button>`/`<a>`** so native focus works.
- **Skip link** as first focusable element: "Skip 3D scene" → hidden text version of project list (also serves SEO).
- **Pause control** for animations over 5 seconds (WCAG 2.2.2).
- **4.5:1 contrast** on overlay text via subtle scrim behind text.
- **No simulated camera roll + pitch combos.** No 5+ second auto-spinning. User-controlled rotation only.

## SEO

- **Prerender the homepage** with `vite-plugin-prerender`. Real `<h1>`, project list, JSON-LD `Person` schema in initial HTML.
- **Per-route meta** via `react-helmet-async` or equivalent.
- **Open Graph image** rendered server-side as a static PNG (a hero shot of the campfire scene).
- **Sitemap and robots.txt** generated at build.
- **Verify with `curl -A Googlebot https://hugovanstalle.work`** before each deploy.

## Things Hugo handles, not Claude

- All texture painting (Procreate / Figma)
- All photography (the pinned photo, any case study screenshots)
- All copywriting in case studies
- Choosing the audio track and confirming license
- Buying/configuring the domain
- Cloudflare Pages dashboard

## Things Claude should always do

- Read this file at the start of every session
- Use pinned versions; flag any upgrade requests
- Wire Leva controls for every visual constant during dev
- Commit at the end of every successful session with a clear message
- Stop and ask if a phase appears blocked rather than scope-creeping into the next phase
- Push back if Hugo asks for something that violates the hard rules above
