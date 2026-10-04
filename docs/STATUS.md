# Project status — START HERE

> Living document. Every session updates it before finishing.
> Last updated: 2026-10-04 (session 1).

## Orientation (read in this order)

1. This file — where we are and what's next.
2. `docs/SPEC.md` — the product brief (sections are referenced as §N).
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

Expected today: 120 unit/component tests, 21 e2e checks, all passing.

## Phase tracker (§48)

| Phase | Scope                                  | State   |
| ----- | -------------------------------------- | ------- |
| 0     | Project skeleton, tooling, CI          | ✅ done |
| 1     | Functional 3D viewer                   | ✅ done |
| 2     | Structure selection                    | ✅ done |
| 3     | Metadata & search (he/en/la)           | ✅ done |
| 4     | Hide / isolate / system visibility     | ✅ done |
| 5     | Quiz engine + quiz UI (find, identify) | ✅ done |
| 6     | Progress persistence + progress page   | ✅ done |
| 7     | UI polish                              | ⏳ next |
| 8     | Real model adapter (Z-Anatomy)         | ⏳      |

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

- **Routes:** `/` home (region cards, start quiz, "N due for review"),
  `/explore` (`?region=<region>`, `?structure=<id>`), `/quiz`
  (`?scope=<id>`, e.g. `due`, `region:upper-limb`, `system:nervous`),
  `/progress`.
- **Viewer:** demo GLB (19 placeholder meshes), selection, hover, info panel,
  search (he/en/la), focus with panel-aware framing, hide, isolate, systems,
  shortcuts (`/ Esc F I H R Q ?`).
- **Quiz:** find (click in 3D, retries, show answer after 2 misses) and
  identify (multiple choice, one shot) and mixed; scopes: whole body, regions,
  systems, due for review, review mistakes; results with first-try score,
  average time, structures to review.
- **Progress:** per-structure stats, spaced review schedule, mastery /
  accuracy / weakest / recent / due on `/progress`; stored in localStorage.
- **Tooling:** `anatomy:inspect`, `anatomy:validate`, `anatomy:generate-demo`,
  `e2e:smoke`, `verify`; CI (`.github/workflows/ci.yml`); SessionStart hook
  (`.claude/settings.json`) that installs deps.

## Next steps (in order)

1. **Deploy to Vercel** so she can use it on the iPad and laptop (needs the
   user's Vercel account — ask). Note: progress is per-device (localStorage).
2. **Real model spike (Phase 8):** export a small Z-Anatomy subset (upper
   limb) to GLB; `anatomy:inspect`; write `data/anatomy/z-anatomy/`
   (`structures.ts`, `meshMap.json`); `anatomy:validate`; record the licence
   in `THIRD_PARTY_ASSETS.md` first. Measure performance; consider Draco/meshopt
   and splitting by region if large.
3. **Custom study lists (§27):** "Exam 1" lists built from search, persisted
   (add to `ProgressData` or a separate repository), usable as quiz/explore
   scopes (`StudyScope.kind === "custom"` already exists).
4. **Progress export/import** (JSON) — cheap insurance until cloud sync.
5. **UI polish (Phase 7):** first-run tutorial (§41), home dashboard with
   "continue studying" (§40), quiz: prioritize weak/due structures in
   question selection, translation drill (Hebrew ↔ English/Latin, §53).
6. Content: get the Hebrew terms reviewed (`docs/CONTENT_REVIEW.md`); add
   Hebrew translations of detail text where wanted.

## Known issues / limitations

- All medical terms are `verified: false`; Hebrew terms need review.
  Detailed content is English-only.
- Demo model is placeholder geometry; some demo structures (nerves, artery)
  exist on the left side only.
- Viewer state (hidden/isolated) is not persisted across reloads (by design).
- Progress lives in one browser's localStorage — no sync across devices yet.
- The e2e find-quiz helper answers by clicking the body centre and revealing;
  it verifies the flow, not answer accuracy.
- Not yet deployed.

## Session log

- **2026-10-04 · session 1** — Scaffolded app; domain layer; demo model
  tooling; explore vertical slice; quality pass (type-aware lint, RTL guard,
  component tests, dataset validator, CI, session hook); handoff docs; quiz
  engine + UI (find / identify / mixed, review mistakes, due scope);
  progress persistence + progress page. MVP v0 acceptance criteria all met.
