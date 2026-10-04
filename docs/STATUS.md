# Project status — START HERE

> Living document. Every session updates it before finishing.
> Last updated: 2026-10-04.

## Orientation (read in this order)

1. This file — where we are and what's next.
2. `docs/SPEC.md` — the product brief (sections are referenced as §N).
3. `docs/ARCHITECTURE.md` — layers, boundaries, data flow, recipes.
4. `docs/CONTRIBUTING.md` — conventions and the definition of done.
5. `docs/DECISIONS.md` — why things are the way they are.

Quick verify of a fresh checkout:

```bash
npm ci
npm run verify                 # format, types, lint, unit tests, data, build
npx next start -p 3100 &       # after verify (it builds)
npm run e2e:smoke              # real-browser flow + screenshots
```

## Phase tracker (§48)

| Phase | Scope                              | State          |
| ----- | ---------------------------------- | -------------- |
| 0     | Project skeleton, tooling, CI      | ✅ done        |
| 1     | Functional 3D viewer               | ✅ done        |
| 2     | Structure selection                | ✅ done        |
| 3     | Metadata & search (he/en/la)       | ✅ done        |
| 4     | Hide / isolate / system visibility | ✅ done        |
| 5     | Quiz engine                        | 🚧 in progress |
| 6     | Progress persistence               | ⏳ next        |
| 7     | UI polish                          | ⏳             |
| 8     | Real model adapter (Z-Anatomy)     | ⏳             |

## MVP v0 acceptance criteria (§45)

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
- [ ] 11 Start a quiz
- [ ] 12 "Find the X"
- [ ] 13 Click a structure
- [ ] 14 Told right/wrong
- [ ] 15 Complete a 10-question quiz
- [ ] 16 See results
- [ ] 17 Refresh the page
- [ ] 18 Progress retained
- [x] (§53) Hebrew RTL UI; Hebrew search finds structures

## What exists

- Routes: `/` (home, region cards), `/explore` (`?region=<region>`).
- Viewer: demo GLB (19 placeholder meshes), selection, hover, info panel,
  search, focus with panel-aware framing, hide, isolate, systems, shortcuts.
- Tooling: `anatomy:inspect`, `anatomy:validate`, `anatomy:generate-demo`,
  `e2e:smoke`, CI workflow (`.github/workflows/ci.yml`), SessionStart hook
  (`.claude/settings.json`) that installs deps.

## Next steps (in order)

1. **Quiz engine (Phase 5)** — `src/lib/quiz/`: study scopes, eligibility
   (in scope ∩ selectable in loaded model), question generation (seeded RNG,
   plausible distractors from same system/region), reducer-style session
   engine, session summary. All pure + unit tested.
2. **Progress (Phase 6)** — `src/lib/progress/`: per-structure progress,
   transparent review scheduler, versioned + validated localStorage
   repository behind an interface; `progressStore`.
3. **Quiz & progress UI** — `/quiz` (setup → run in the viewer → summary),
   `/progress` (mastery, weakest, due), deep link `/explore?structure=<id>`,
   enable nav items, `Q` shortcut. Extend e2e to cover criteria 11–18.
4. Deploy to Vercel so it's usable on the iPad.
5. Real model spike: export a small Z-Anatomy subset (upper limb) to GLB,
   inspect, map, validate; record licence.

## Known issues / limitations

- All medical terms are `verified: false`; Hebrew terms need review
  (`docs/CONTENT_REVIEW.md`). Detailed content is English-only.
- Demo model is placeholder geometry.
- Viewer state (hidden/isolated) is not persisted across reloads (by design
  for now).
- Not yet deployed.

## Session log

- **2026-10-04 · session 1** — scaffolded app, domain layer, demo model
  tooling, explore vertical slice, e2e smoke; quality pass (type-aware lint,
  RTL guard, component tests, dataset validator, CI, session hook) and these
  docs.
