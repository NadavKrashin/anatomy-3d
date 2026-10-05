# Project status — START HERE

> Living document. **Update it with every commit that changes the code, not
> just at the end of a session** — it must always match the code as it is.
> Last updated: 2026-10-05 (session 2, tap to peel).

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

Expected today: **171 unit/component tests, 35 e2e checks, all passing; CI green.**

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
| 2026-10-05 | Next features chosen by the user: **muscle parts**, then **origins & insertions**.                                                                                                                                                                           |
| 2026-10-05 | **Whole body next**: add all remaining body parts. More quizzes, Hebrew names and study tools wait until the user has her course's study sources.                                                                                                            |
| 2026-10-05 | Wants to **switch between a male and a female model** — **deferred** ("document the options, future addition"). Options and research: `docs/DECISIONS.md` → "Male/female model switch".                                                                      |
| 2026-10-05 | Whole body merged (PR #4). Next: **select whole organs** (brain parts, lungs, heart… as wholes).                                                                                                                                                             |
| 2026-10-05 | **Peeling: tap to peel only.** The automatic peel button removed too much at once ("everything disappears"); the user chose a peel mode where each tap removes one structure.                                                                                |
| 2026-10-05 | **Docs must be kept updated continuously** as work happens (every commit), not at the end of a session. Enforced by the docs-gate hook.                                                                                                                      |
| 2026-10-05 | **Deployed** by the user on Vercel: production URL **https://ors-anatomy.vercel.app** (production branch `main`).                                                                                                                                            |

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
| 8     | Real model (Z-Anatomy)                        | ✅ whole body (2026-10-05), five streamed model files                  |

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

- **Model:** Z-Anatomy (CC BY-SA), **whole body** in five files under
  `public/models/z-anatomy/` — skeleton (bones, cartilage, joints/ligaments),
  muscles, nerves (brain, spinal cord, nerves, eye), vessels (heart, arteries,
  veins), organs (respiratory, digestive, urinary, male reproductive,
  endocrine, lymphoid). 2,660 meshes → 2,583 whole structures (+52 muscle
  parts), ≈3.1M triangles, 15.8 MB; the skeleton loads first and frames the
  camera, the rest streams in ("Loading body systems n/5"). Left out: the
  non-commercial inner ear and kidney models, coverings (fasciae, meninges,
  pleura, greater omentum), liver segments. Pipeline:
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
  framing, hide, isolate, legend toggles, **tap to peel** (a peel mode:
  each tap removes just the tapped structure — whole or part — with a hint
  pill; "Restore (n)" undoes one tap at a time; P toggles, ⇧P restores, Esc
  leaves; off while isolating), **muscle parts** and **whole organs** (parts of muscles —
  heads of biceps/triceps, parts of deltoid… — and of organs — heart chambers
  and valves, lung lobes, brain gyri… — searchable and selectable; a tap picks
  the whole, the "Select parts" toggle picks parts; info panel links part ↔
  whole; parts are quizzable, with part-picking switched on for those
  questions), **origins & insertions** (select a
  muscle → its attachment patches on the bones, violet origin / amber
  insertion, with the bones named in the info panel; select a bone → the
  muscles attached to it; from Z-Anatomy patches — 679 for the whole body,
  lazy-loaded 1.9 MB model; unverified, 28 muscles shown as "not confirmed"
  — see CONTENT_REVIEW),
  shortcuts
  (`/ Esc F I H R P ⇧P Q ?`).
- **Quiz:** find (click in 3D; muscles auto-hidden for non-muscle targets,
  and bones too for organs/brain/heart;
  peel mode in find questions to clear what covers the target — a tap then
  peels instead of answering; peels reset per question and when the answer
  is revealed),
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

1. ~~Post-deploy check~~ — user reported production "looks good"
   (2026-10-05). Keep an eye out for iPad performance feedback.
2. **Real-device check on iPad** with the whole body (≈3.1M triangles, 16 MB
   in five files): load time, rotation smoothness, tap latency.
   If sluggish: lower `--simplify` for nerves/vessels, load packs on demand
   (e.g. only when their legend entry is on), or add a BVH for picking.
3. ~~Organ-level wholes~~ — done: heart, lungs, cerebral lobes, cerebellum,
   brainstem, diencephalon, spinal cord, eyeballs, colon, small intestine,
   pharynx, hypophysis, thymus, penis (`ORGAN_GROUPS` in the export). One
   level only (gyrus → lobe, not → hemisphere → brain).
4. **Hebrew names** (when the user has her course sources) — ideally from
   her course's term list; add to curated concepts + `docs/CONTENT_REVIEW.md`.
5. ~~Muscle heads as sub-structures~~ — done (52 parts); quizzing on parts
   is a possible follow-up.
   5b. **Male/female switch** — deferred by the user; options, source (Human
   Reference Atlas female set, CC BY 4.0) and how to fetch it are in
   `docs/DECISIONS.md` → "Male/female model switch". Ask which option before
   building.
6. When the user has her study sources: more quiz types (origins/insertions,
   parts), custom study lists (§27), progress export/import, first-run tutorial,
   ~~origins/insertions mode~~ (done; verify kinds + Hebrew terms per
   CONTENT_REVIEW).

## Known issues / limitations

- All medical terms are `verified: false`; Hebrew exists only for ~16 curated
  concepts; the other structures show English (validator warnings, expected).
- Origins/insertions: source gaps — 7 muscles have no patches (e.g.
  palmaris longus, lumbricals, flexor carpi radialis); pronator quadratus and
  the short head of biceps have patches on the right side only; some
  muscles' origins are missing (rhomboids, deltoid parts' insertion is on the
  whole muscle). 7 patches carried the wrong side suffix and are placed by
  position instead.
- Organ wholes are one level deep (a gyrus belongs to its lobe; there is no
  "cerebral hemisphere" or "brain" whole); deep brain nuclei outside a lobe
  group stay on their own; a whole with a single part (insula) exists.
- Whole body: the source is a **male** model (no female reproductive
  organs); no kidneys or inner ear (non-commercial licences); pleura, greater
  omentum, meninges and fasciae left out so they don't hide everything; the
  liver is one mesh (segments omitted). Regions for organs and midline
  structures come from their height against skeletal landmarks (navigation
  aid).
- On phones, a long name's leader label can run off the screen edge (user:
  fine as is, 2026-10-05).
- Long structures (nerves) are framed along their whole length.
- Viewer state (hidden/isolated) is not persisted across reloads (by design).
- Progress is per browser/device (localStorage) — no sync.
- The e2e find-quiz helper answers by clicking the body centre and revealing;
  it verifies the flow, not answer accuracy.
- Whole body not yet checked on a real iPad (the upper-limb version was);
  cloud sessions cannot reach `*.vercel.app` to test it.
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
- **2026-10-05 · session 2 (cont.)** — User connected the repo in Vercel and
  deployed: https://ors-anatomy.vercel.app. Recorded in STATUS/DEPLOYMENT.
- **2026-10-05 · session 2 (cont.)** — User checked production: "looks
  good". Awaiting the user's pick of the next feature.
- **2026-10-05 · session 2 (cont.)** — Layer peeling (user picked it as the
  next feature): off-screen structure-ID render finds what's outermost from
  the camera; Peel / Restore in the toolbar and in find questions; P / ⇧P.
  Also: toolbar labels no longer wrap on phones.
- **2026-10-05 · session 2 (cont.)** — Layer peeling merged to `main` via
  PR #2 (user asked); Vercel redeploys production from `main`.
- **2026-10-05 · session 2 (cont.)** — Muscle parts as child structures
  (`parentId`, `partMeshMap`); registry lists wholes only so scopes/counts/
  quizzes are unchanged; parts toggle + whole↔part navigation.
- **2026-10-05 · session 2 (cont.)** — Origins & insertions from
  Z-Anatomy's attachment patches: separate lazy-loaded GLB, kinds from
  suffix+material agreement, side from position, muscles whose labels
  contradict standard anatomy shown as unconfirmed; muscle ⇄ bone views in
  the info panel.
- **2026-10-05 · session 2 (cont.)** — Muscle parts + origins & insertions
  merged to `main` via PR #3 (user asked); Vercel redeploys production.
- **2026-10-05 · session 2 (cont.)** — Whole body (user request): export
  generalised to five packs (skeleton/muscles/nerves/vessels/organs) with
  organ systems, landmark regions, NC exclusions; app loads several model
  files (primary first, merged scene index, peeling across files, progress
  pill); quizzes hide bones for encased targets; detail tags for nuclei/
  tracts/nodes; attachments for every muscle with a whole-body review (28
  muscles "not confirmed").
- **2026-10-05 · session 2 (cont.)** — Researched a female model for a
  male/female switch; user deferred the feature — options documented in
  DECISIONS.
- **2026-10-05 · session 2 (cont.)** — Whole organs (user request): export
  groups organ pieces by Z-Anatomy's hierarchy (`ORGAN_GROUPS` → manifest
  `group`/`groupSide`); heart, lungs, brain lobes, cerebellum… are wholes
  with parts; parts now count as studyable (`registry.all`: quiz scopes,
  progress, distractors — siblings preferred, own whole/parts never);
  "Muscle parts" toggle renamed "Select parts".
- **2026-10-05 · session 2 (cont.)** — User checked the superior lateral
  brachial cutaneous nerve's loop shape: verified identical to the source
  and anatomically consistent (wraps the posterior border of the deltoid);
  not a bug. Whole organs merged to `main` via PR #5.
- **2026-10-05 · session 2 (cont.)** — Peeling reworked (user found the
  automatic peel too drastic — ~250 structures per tap when zoomed in on the
  chest): tap-to-peel mode replaces it; the view-based ID-pass peeling
  (`structureIdPass`, `peel.ts`, `useLayerPeeling`) was removed.
