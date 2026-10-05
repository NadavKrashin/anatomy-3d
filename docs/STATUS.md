# Project status — START HERE

> Living document. **Update it with every commit that changes the code, not
> just at the end of a session** — it must always match the code as it is.
> Last updated: 2026-10-05 (session 2, docs-gate hook added).

## Orientation (read in this order)

1. This file — where we are, what the user decided, what's next.
2. `docs/CONTRIBUTING.md` — conventions, lint rules, definition of done.
3. `docs/DESIGN.md` — visual direction and tokens. **Read before any UI change.**
4. `docs/ARCHITECTURE.md` — layers, boundaries, data flow, recipes.
5. `docs/SPEC.md` — the original product brief (§-numbered). DESIGN.md
   supersedes its visual sections.
6. `docs/DECISIONS.md` — why things are the way they are.
7. As needed: `docs/DEPLOYMENT.md`, `docs/CONTENT_REVIEW.md`,
   `THIRD_PARTY_ASSETS.md`, `scripts/anatomy/z-anatomy/README.md`.

Project skills in `.claude/skills/` (`anatomy-workflow`, `anatomy-ui-style`,
`frontend-design`) load automatically in Claude Code and encode the same rules.

Verify a fresh checkout (exactly what CI runs, plus e2e):

```bash
npm ci
npm run verify                 # format check, typegen+tsc, lint, tests, data validation, build
npx next start -p 3100         # in the background (after verify, which builds)
npm run e2e:smoke              # real-browser explore + quiz flows, writes docs/screenshots/
```

Expected today: **135 unit/component tests, 21 e2e checks, all passing; CI green.**

## User decisions & preferences (do not re-ask)

| Date       | Decision                                                                                                                                                                                                                                                     |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2026-10-04 | App is for the user's girlfriend, a medical student in **Israel**; the course hasn't started yet.                                                                                                                                                            |
| 2026-10-04 | **UI in Hebrew (RTL)** by default, English available. Term display defaults to **English primary, Hebrew secondary** (Latin also shown) — changeable in settings once her course's terminology is known.                                                     |
| 2026-10-04 | Devices: **iPad and laptop**. No personalisation/name in the UI.                                                                                                                                                                                             |
| 2026-10-04 | Quality bar: clean code, best practices, tests and linting; document thoroughly for future sessions.                                                                                                                                                         |
| 2026-10-05 | Real model: **Z-Anatomy approved; CC BY-SA licence accepted.** Upper limb first.                                                                                                                                                                             |
| 2026-10-05 | **Lower limb / other regions deferred** — "we will add everything later". Legs show bones only for now.                                                                                                                                                      |
| 2026-10-05 | **Redesign requested**: the first UI looked "blocky and AI-made". New direction in `docs/DESIGN.md` (light atlas style). Design plugins (`frontend-design`, `design-skills`) were suggested for install; `frontend-design` is vendored in `.claude/skills/`. |
| 2026-10-05 | Next: **deploy the first version to Vercel** (user does the Vercel side — see `docs/DEPLOYMENT.md`).                                                                                                                                                         |
| 2026-10-05 | **Docs must be kept updated continuously** as work happens (every commit), not at the end of a session. Enforced by the docs-gate hook.                                                                                                                      |

## Phase tracker (§48)

| Phase | Scope                                         | State                                                                  |
| ----- | --------------------------------------------- | ---------------------------------------------------------------------- |
| 0     | Project skeleton, tooling, CI                 | ✅ done (CI fixed 2026-10-05: typecheck now runs `next typegen` first) |
| 1     | Functional 3D viewer                          | ✅ done                                                                |
| 2     | Structure selection                           | ✅ done                                                                |
| 3     | Metadata & search (he/en/la)                  | ✅ done                                                                |
| 4     | Hide / isolate / system visibility            | ✅ done                                                                |
| 5     | Quiz engine + quiz UI (find, identify, mixed) | ✅ done                                                                |
| 6     | Progress persistence + progress page          | ✅ done                                                                |
| 7     | UI polish                                     | 🚧 redesign done (`docs/DESIGN.md`); polish continues                  |
| 8     | Real model (Z-Anatomy)                        | ✅ upper limb + whole skeleton; other regions deferred by user         |

## MVP v0 acceptance criteria (§45) — all met

- [x] 1 Open the app · [x] 2 See a 3D model · [x] 3 Rotate, zoom, pan
- [x] 4 Click an individual mesh · [x] 5 See its name · [x] 6 Search
- [x] 7 Focus camera on a search result · [x] 8 Hide · [x] 9 Isolate
- [x] 10 Toggle systems · [x] 11 Start a quiz · [x] 12 "Find the X"
- [x] 13 Click a structure · [x] 14 Told right/wrong · [x] 15 Complete 10 questions
- [x] 16 See results · [x] 17 Refresh · [x] 18 Progress retained
- [x] (§53) Hebrew RTL UI; Hebrew search finds structures

All verified by `npm run e2e:smoke` against a production build.

## What exists

- **Model:** Z-Anatomy (CC BY-SA) — `public/models/z-anatomy-upper-limb.glb`
  (4 MB, meshopt): whole skeleton + muscles, nerves and vessels of both upper
  limbs incl. pectoral, axillary and scapular regions. 580 structures (367
  upper limb); muscle heads merged into whole muscles. Pipeline:
  `scripts/anatomy/z-anatomy/README.md`. Placeholder demo model kept for tests.
- **Routes:** `/` contents-page home (regions list, start quiz, "N due for
  review"), `/explore` (`?region=<region>`, `?structure=<id>`), `/quiz`
  (`?scope=<id>`: `due`, `region:upper-limb`, `system:nervous`, …),
  `/progress`.
- **Design:** light atlas-plate theme, Frank Ruhl Libre + IBM Plex Sans
  Hebrew, surgical-teal accent, colour legend, leader-line label on the
  selected structure, ruled lists (`docs/DESIGN.md`).
- **Viewer:** selection with teal x-ray highlight (buried structures stay
  visible), hover, info panel, search (he/en/la), focus with panel-aware
  framing, hide, isolate, legend toggles, shortcuts (`/ Esc F I H R Q ?`).
- **Quiz:** find (click in 3D; muscles auto-hidden for non-muscle targets),
  identify (multiple choice, plausible core distractors), mixed; scopes by
  region / system / due / review mistakes; built-in scopes skip `detail`
  structures (small branches).
- **Progress:** per-structure stats, spaced review schedule, `/progress`;
  localStorage (validated, corrupt data backed up).
- **Tooling:** `verify`, `e2e:smoke`, `e2e/perf-probe.ts`, `anatomy:inspect`,
  `anatomy:validate`, `anatomy:generate-demo`, Z-Anatomy export/optimize
  scripts; CI (`.github/workflows/ci.yml`); Claude Code hooks in
  `.claude/settings.json` — SessionStart (install deps, orientation message)
  and PreToolUse docs-gate (`scripts/hooks/docs-gate.mjs`: blocks code-only
  commits); project skills (`.claude/skills/`).

## Next steps (in order)

1. **Deploy to Vercel** — `main` is deployable (PR #1 merged 2026-10-05, CI
   green). Remaining: the user imports `NadavKrashin/anatomy-3d` in Vercel
   (Next.js preset, Node 22, no env vars — `docs/DEPLOYMENT.md`); a cloud
   session has no Vercel access. Then run the post-deploy checklist on the
   iPad and record the production URL here.
2. **Real-device check on iPad:** load time and frame rate with the 1.35M
   triangle model. If sluggish: simplify non-upper-limb bones
   (`optimize-glb.ts --simplify 0.5`), or split the GLB per system/region and
   lazy-load.
3. **More regions** when the user asks (lower limb ≈ +480k vertices, ≈ +3 MB;
   thorax viscera; head & neck) — extend `export_glb.py`; consider one GLB per
   region once more than two regions exist.
4. **Hebrew names** for the most-studied upper-limb structures — ideally from
   her course's term list; add to curated concepts + `docs/CONTENT_REVIEW.md`.
5. **Muscle heads as sub-structures** (biceps long/short, triceps heads) via
   `parentId`, selectable in a "parts" mode.
6. Custom study lists (§27), progress export/import, first-run tutorial,
   origins/insertions mode (Z-Anatomy ships attachment patches).

## Known issues / limitations

- All medical terms are `verified: false`; Hebrew exists only for ~16 curated
  concepts; the other structures show English (validator warnings, expected).
- Deep muscles can be covered by superficial ones in muscle "find" questions
  (no layer peeling yet; x-ray applies to the selected structure only).
- Long structures (nerves) are framed along their whole length.
- Viewer state (hidden/isolated) is not persisted across reloads (by design).
- Progress is per browser/device (localStorage) — no sync.
- The e2e find-quiz helper answers by clicking the body centre and revealing;
  it verifies the flow, not answer accuracy.
- `main` is deployable but the Vercel project isn't connected yet; untested on
  a real iPad.
- `npm audit` reports 5 high-severity advisories in dev dependencies
  (transitive, from the Next/ESLint toolchain at scaffold time); not shipped
  to the browser. Re-check with `npm audit` when upgrading.

## Session log

- **2026-10-04 · session 1** — Scaffolded app; domain layer; demo model
  tooling; explore vertical slice; quality pass (type-aware lint, RTL guard,
  component tests, dataset validator, CI, session hook); handoff docs; quiz
  engine + UI; progress persistence + page. MVP v0 criteria met.
- **2026-10-05 · session 2** — Real Z-Anatomy anatomy (upper limb +
  skeleton): headless Blender export, meshopt, runtime dataset builder,
  whole-muscle grouping, shared curated concepts, `detail` tag, x-ray
  selection, quiz hides occluding muscles, attribution.
- **2026-10-05 · session 2 (cont.)** — Redesign following Anthropic's
  frontend-design skill (`docs/DESIGN.md`): tokens/fonts, quiet primitives,
  legend, leader label, contents home, list-based quiz setup and progress.
- **2026-10-05 · session 2 (cont.)** — Pre-deployment audit: found CI had
  failed on every push (`LayoutProps` route types missing on a clean
  checkout) → `typecheck` now runs `next typegen` first, CI actions bumped to
  v5, verified from a fresh clone. Added `docs/DEPLOYMENT.md`, user-decisions
  log, project skills, SPEC supersession note, expanded CLAUDE.md.
- **2026-10-05 · session 2 (cont.)** — Continuous-docs rule (user request):
  prominent instruction in CLAUDE.md, CONTRIBUTING, anatomy-workflow skill and
  the SessionStart message; `scripts/hooks/docs-gate.mjs` PreToolUse hook blocks
  `git commit`s that change code without a doc (`[docs: none]` escape hatch).
- **2026-10-05 · session 2 (cont.)** — Opened and merged PR #1 into `main`
  (CI green) so Vercel can deploy production from `main`.
