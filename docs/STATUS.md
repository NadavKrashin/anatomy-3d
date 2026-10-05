# Project status — START HERE

> Living document. Every session updates it before finishing.
> Last updated: 2026-10-05 (session 2, design pass).

## Orientation (read in this order)

1. This file — where we are and what's next.
2. `docs/SPEC.md` — the product brief (sections are referenced as §N).
   `docs/DESIGN.md` — visual direction; read before touching UI.
3. `docs/ARCHITECTURE.md` — layers, boundaries, data flow, recipes.
4. `docs/CONTRIBUTING.md` — conventions and the definition of done.
5. `docs/DECISIONS.md` — why things are the way they are.

Verify a fresh checkout:

```bash
npm ci
npm run verify                 # format, types, lint, unit tests, data, build
npx next start -p 3100         # in the background, after verify (it builds)
npm run e2e:smoke              # real-browser explore + quiz flows, screenshots
```

Expected today: 135 unit/component tests, 21 e2e checks, all passing.

## Phase tracker (§48)

| Phase | Scope                                  | State                                       |
| ----- | -------------------------------------- | ------------------------------------------- |
| 0     | Project skeleton, tooling, CI          | ✅ done                                     |
| 1     | Functional 3D viewer                   | ✅ done                                     |
| 2     | Structure selection                    | ✅ done                                     |
| 3     | Metadata & search (he/en/la)           | ✅ done                                     |
| 4     | Hide / isolate / system visibility     | ✅ done                                     |
| 5     | Quiz engine + quiz UI (find, identify) | ✅ done                                     |
| 6     | Progress persistence + progress page   | ✅ done                                     |
| 7     | UI polish                              | ⏳                                          |
| 8     | Real model (Z-Anatomy)                 | ✅ upper limb + skeleton; more regions next |

## MVP v0 acceptance criteria (§45) — all met

- [x] 1 Open the app
- [x] 2 See a 3D model
- [x] 3 Rotate, zoom, pan
- [x] 4 Click an individual mesh
- [x] 5 See its name
- [x] 6 Search structures
- [x] 7 Focus camera on a search result
- [x] 8 Hide a selected structure
- [x] 9 Isolate a selected structure
- [x] 10 Toggle systems
- [x] 11 Start a quiz
- [x] 12 "Find the X"
- [x] 13 Click a structure
- [x] 14 Told right/wrong
- [x] 15 Complete a 10-question quiz
- [x] 16 See results
- [x] 17 Refresh the page
- [x] 18 Progress retained
- [x] (§53) Hebrew RTL UI; Hebrew search finds structures

All verified by `npm run e2e:smoke` (criteria 1–18) against a production build.

## What exists

- **Model:** real anatomy from Z-Anatomy (CC BY-SA) —
  `public/models/z-anatomy-upper-limb.glb` (4 MB, meshopt): whole skeleton +
  muscles, nerves and vessels of both upper limbs, incl. pectoral, axillary
  and scapular regions. 580 structures (367 upper limb); muscle heads merged
  into whole muscles. Pipeline: `scripts/anatomy/z-anatomy/README.md`.
- **Routes:** `/` home (region cards, start quiz, "N due for review"),
  `/explore` (`?region=<region>`, `?structure=<id>`), `/quiz`
  (`?scope=<id>`, e.g. `due`, `region:upper-limb`, `system:nervous`),
  `/progress`.
- **Design:** light atlas-plate theme, serif names, legend, leader-line
  label on the selected structure, contents-page home (`docs/DESIGN.md`).
- **Viewer:** selection with x-ray highlight (buried structures stay
  visible), hover, info panel, search (he/en/la), focus with panel-aware
  framing, hide, isolate, systems, shortcuts (`/ Esc F I H R Q ?`).
- **Quiz:** find (click in 3D; muscles auto-hidden for non-muscle targets),
  identify (multiple choice, plausible core distractors), mixed; scopes:
  whole body, regions, systems, due for review, review mistakes; built-in
  scopes skip `detail` structures (small branches).
- **Progress:** per-structure stats, spaced review schedule, `/progress`
  page; stored in localStorage.
- **Tooling:** `anatomy:inspect`, `anatomy:validate`, `anatomy:generate-demo`,
  Z-Anatomy export/optimize scripts, `e2e:smoke`, `e2e/perf-probe.ts`,
  `verify`; CI; SessionStart hook.

## Next steps (in order)

1. **Deploy to Vercel** so she can use it on the iPad and laptop (needs the
   user's Vercel account — ask). Progress is per-device (localStorage).
2. **Real-device check on iPad:** load time and frame rate with the 1.35M
   triangle model. If sluggish: simplify non-upper-limb bones
   (`optimize-glb.ts --simplify`), or split the GLB per system and lazy-load.
3. **More regions** as her course needs them (thorax viscera, lower limb,
   head & neck) — extend `export_glb.py`; consider one GLB per region.
4. **Hebrew names** for the most-studied upper-limb structures (muscles,
   nerves, arteries) — curated concepts + `docs/CONTENT_REVIEW.md`; ideally
   from her course's term list.
5. **Muscle heads as sub-structures** (biceps long/short head, triceps heads)
   via `parentId`, selectable in a "parts" mode.
6. Custom study lists (§27), progress export/import, first-run tutorial,
   origins/insertions mode (Z-Anatomy ships attachment patches).

## Known issues / limitations

- All medical terms are `verified: false`; Hebrew exists only for the
  curated concepts (~16); the rest of the 580 structures show English.
- Deep muscles can still be covered by superficial muscles in find
  questions about muscles (no per-layer peeling yet; x-ray only for the
  selected structure).
- Long structures (nerves) focus on their whole length, which frames most of
  the arm.
- Viewer state (hidden/isolated) is not persisted across reloads (by design).
- Progress lives in one browser's localStorage — no sync across devices yet.
- The e2e find-quiz helper answers by clicking the body centre and revealing;
  it verifies the flow, not answer accuracy.
- Not yet deployed. Untested on a real iPad.

## Session log

- **2026-10-04 · session 1** — Scaffolded app; domain layer; demo model
  tooling; explore vertical slice; quality pass (type-aware lint, RTL guard,
  component tests, dataset validator, CI, session hook); handoff docs; quiz
  engine + UI (find / identify / mixed, review mistakes, due scope);
  progress persistence + progress page. MVP v0 acceptance criteria all met.
- **2026-10-05 · session 2** — Replaced the placeholder model with real
  Z-Anatomy anatomy (upper limb + skeleton): headless Blender export,
  meshopt compression, runtime dataset builder with whole-muscle grouping,
  shared curated concepts, `detail` tag, x-ray selection highlight, quiz
  hides occluding muscles, attribution, docs.
- **2026-10-05 · session 2 (cont.)** — Design pass following Anthropic's
  frontend-design skill: `docs/DESIGN.md`, new tokens/fonts, quiet button
  primitives, legend, leader label, contents home, list-based quiz setup and
  progress, teal x-ray selection; e2e updated (21 checks).
