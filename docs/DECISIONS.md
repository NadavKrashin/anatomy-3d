# Architecture decisions

Short log of choices that deviate from, or go beyond, `docs/SPEC.md`.

## Stack versions (October 2026)

Next.js 16.3 (App Router, Turbopack) · React 19.2 · TypeScript 5.9 (strict +
`noUncheckedIndexedAccess`) · three 0.186 · @react-three/fiber 9.8 ·
@react-three/drei 10.7 · zustand 5 · Tailwind CSS 4.3 · fuse.js 7 ·
lucide-react · Vitest 5 · Playwright 1.56 · gltf-transform 4.5.

## Language & terminology

- **UI is Hebrew/RTL by default**, English/LTR available in settings. Strings
  live in typed dictionaries (`src/lib/i18n/messages.*.ts`); the English
  dictionary is type-checked against the Hebrew one, so a missing string is a
  compile error. No i18n routing library — there is one user and no SEO need;
  locale is a persisted client setting.
- **Structure names are stored per term language** (`en` required, `la`,
  `he`), each with a `verified` flag. Which one is shown first is a user
  setting. **Default: English primary, Hebrew secondary.** Israeli anatomy
  teaching leans heavily on English/Latin terminology (lecture slides and most
  references), while Hebrew terms exist (Academy of the Hebrew Language anatomy
  dictionary) but are less consistently used. Once the course starts this is
  a one-click change in settings, or a one-line default change in
  `src/lib/anatomy/names.ts`.
- All terms start `verified: false`. Unverified Latin/Hebrew terms show a small
  "לא אומת" badge. See `docs/CONTENT_REVIEW.md`.
- Detailed content (function, origin, …) is English-only for now; the type
  allows a `he` translation per item, and the UI uses it when present.
- Side labels ("left"/"שמאל") are composed at display time, so paired
  structures share one base name. Latin uses `sin.`/`dext.` to avoid gender
  agreement.
- Search normalizes niqqud, final letters (ך→כ…), geresh/gershayim, maqaf,
  hyphens, case and a leading definite article (ה), on both the index and the
  query. Exact substring hits rank first, then fuzzy (typo-tolerant) hits.
- Keyboard shortcuts match `event.code`, not `event.key`, so they work on a
  Hebrew keyboard layout.

## Model / data boundary

- `AnatomyModelAdapter` (`src/lib/anatomy/modelAdapter.ts`) is the only code
  that sees raw node names; the mapping lives in `meshMap.json`, never in
  rendering code.
- GLTFLoader sanitizes node names (`Biceps_Brachii_L.001` → `Biceps_Brachii_L001`)
  but keeps the original in `userData.name`; the scene index uses the original,
  strips Blender `.001` suffixes, and walks up to ancestors (multi-primitive
  meshes become groups).
- `bilateralGroupId` links left/right instances, so a future quiz can accept
  either side when side isn't what's being tested.

## Rendering

- Materials are swapped imperatively from a store subscription, not via React
  props per mesh, so selection doesn't re-render React for thousands of meshes.
- Highlight/ghost variants are cloned once per _(base material, state)_ and
  shared; originals are restored and clones disposed on unmount.
- Ghosted (isolate mode) structures are transparent, don't write depth, and
  aren't clickable — clicks pass through them.
- `frameloop="demand"`: the canvas only renders when something changes.
- Camera: drei `CameraControls` (camera-controls) instead of OrbitControls — it
  has smooth `fitToSphere` transitions, damping and good touch gestures. Focus
  pads the bounding sphere ×1.8, and shifts the view (focal offset) so the
  structure lands in the area the info panel leaves uncovered — side panel on
  desktop/iPad, bottom sheet on phones. Reduced-motion users get instant moves.

## UI

- **Visual direction (2026-10-05): see `docs/DESIGN.md`.** The first UI
  (near-black, cyan accent, all-caps labels, boxed buttons) read as generic
  AI output. Redesigned after Anthropic's _frontend-design_ guidance around
  the anatomical-atlas subject: light "plate" ground, Frank Ruhl Libre +
  IBM Plex Sans Hebrew, surgical-teal accent (the hue the tissue palette
  lacks), legend instead of checkboxes, leader-line label on the selected
  structure, contents-page home, ruled lists instead of cards. Side names are
  written "Humerus (left)". The selected structure is mostly teal (a half
  blend with red tissue turned grey).
- No shadcn/ui yet: the slice needed only a button, a dialog (native
  `<dialog>`), selects (native, best on iPad) and panels. shadcn can be added
  when real form-heavy UI (custom study lists) arrives.
- Route is `/explore` (spec sketched `/learn`) to match the "Explore" nav item.
- `/explore?region=upper-limb` starts with only that region visible — the home
  page's "What are you studying?" cards use it; full study scopes come later.
- `TermText` shows the "unverified" badge in the info panel only; lists
  (quiz options, progress rows, search, leader label) hide it to reduce noise.
- Quiz/explore scopes leave out the "other" region/system buckets.

## Quiz (Phase 5)

- **Engine is a pure reducer** (`lib/quiz/quizEngine.ts`): `startQuiz` +
  `quizReducer(run, action)` with `answer` / `reveal` / `next`. Time is passed
  in (`now`), never read inside. `store/quizStore.ts` only holds the current
  run; `hooks/useQuizRun.ts` wires it to the viewer.
- **Scoring:** the score is _first-try correct_ (honest recall). A find
  question solved after wrong clicks counts as "correct after retry" and is
  listed for review; a revealed answer or a wrong identify choice is "missed".
- **Find questions** allow retries; "Show answer" appears after 2 wrong clicks
  (`REVEAL_AFTER_WRONG_ATTEMPTS`). **Identify questions** are one-shot.
- **Clicks become answers via the selection:** in a find question, a change of
  `selectedStructureId` is dispatched as an answer — no special click plumbing
  in the 3D layer. During identify questions and after answering, the
  selection is locked (`viewerStore.selectionLocked` + `pick()`), so the
  highlighted target can't be clicked away.
- **Question generation:** only structures in the scope _and_ selectable in
  the loaded model (scene index) are asked. Distractors are chosen from all
  selectable structures, preferring same system + region, never the other side
  of the target or two sides of one pair. Seeded RNG (`lib/quiz/random.ts`).
- Correct answers auto-advance after 1.1 s; wrong/revealed wait for "Next" so
  the student can look. Camera returns to the scope overview before a find
  question that follows a focused one, and when the quiz ends.
- The quiz shows exactly its scope (`viewerStore.showOnly`).
- Quiz keys: `1–4` answer, `Enter` next, `R` reset camera, `Q` back to explore.

## Progress (Phase 6)

- `ProgressRepository` interface (`load`/`save` of one `ProgressData`
  document) with a localStorage implementation. Data is **validated with zod**
  on load; unreadable data is **copied to a backup key** (`anatomy.progress.corrupt.<ts>`)
  rather than discarded. `version` field for future migrations.
- `recordSession` is **idempotent** by session id.
- Review scheduler (`lib/progress/reviewScheduler.ts`): again → 10 min,
  hard → ×1.2 (≥1 day), good → 1 day then ×2.5 (≤60 days). Confidence = EMA
  (weight 0.4) of grade scores (again 0, hard 0.6, good 1). "Learned" =
  confidence ≥ 0.8.
- "Due for review" is offered as a quiz scope (`/quiz?scope=due`) on home,
  quiz setup and progress pages.

## Deferred

- No persistence of viewer state (hidden/isolated) across reloads — only
  settings and progress persist.
- No custom study lists yet ("Exam 1"); `StudyScope` already has a `custom`
  kind for them.
- No performance overlay yet; the demo model is ~23k triangles. Add
  instrumentation when the real model lands.

## Real model: Z-Anatomy upper limb (Phase 8, started 2026-10-05)

- **Source:** the FBX exports in the Z-Anatomy GitHub repo (per body system),
  converted headlessly with Blender's Python module (`bpy` 4.5 from PyPI — no
  Blender install). Licence approved by the user (CC BY-SA); NC-licensed
  sub-models (inner ear, kidney) excluded. Pipeline:
  `scripts/anatomy/z-anatomy/` (README there).
- **Scope:** whole skeleton for context + all upper-limb muscles, nerves and
  vessels (both sides), plus the pectoral/axillary/scapular structures that
  Z-Anatomy's "upper limb" collection omits but courses teach. Fasciae,
  sheaths, bursae, capsules excluded (they wrap and hide everything).
  Landmark/attachment patch meshes (`.j`, `.ol`, `.el` …) excluded for now —
  candidates for a future "origins & insertions" study mode.
- **Size/perf:** 610 meshes, 771k vertices, 1.35M triangles → 18 MB raw →
  **4.0 MB** with meshopt + quantization (no simplification needed). Loads and
  indexes in ≈0.9 s locally; 40 hover moves over the densest arm area produce
  no long tasks, so no BVH yet (`e2e/perf-probe.ts` to re-measure).
  `optimize-glb.ts` never joins meshes — every structure must stay a node.
- **Materials:** one per tissue (bone, cartilage, teeth, muscle, ligament,
  nerve, artery, vein), decided from the anatomical _name_ (source material
  slots were unreliable — bones list cartilage first) and every face pointed
  at slot 0.
- **Structures are built at runtime** from the committed export manifest
  (`src/data/anatomy/z-anatomy/build.ts`, unit-tested) — no generated TS to
  keep in sync. Muscle parts are merged into whole muscles using Z-Anatomy's
  Group-Muscles collection (biceps = long + short head meshes); the
  "common flexor/extensor tendon" columns are not muscles and are skipped.
  Heads as separate sub-structures (`parentId`) are a later refinement.
- **Names:** Z-Anatomy's English (TA-based) names are used as-is; ids are
  kebab-case + side. Parenthesised names are inconstant structures (tag
  `inconstant`). Hebrew/Latin and medical details come from shared curated
  concepts (`src/data/anatomy/content/concepts.ts`), used by both datasets.
  ≈560 structures have no Hebrew name yet (validator warnings, not errors).
- **`detail` tag:** small branches, digital vessels, divisions, networks and
  inconstant structures. Searchable/explorable, but excluded from built-in
  quiz scopes and from identify-question distractors; custom scopes (review
  mistakes, due) keep them.
- **Buried structures:** the selected structure renders as an x-ray highlight
  (no depth test, drawn last, strong tint) so deep nerves/vessels are visible
  when chosen. Quiz questions about non-muscle targets hide the muscular
  system (`lib/quiz/questionView.ts`).
- **Demo dataset** stays for unit/component tests (stable ids) and as a
  template; the app runs on `activeDataset = zAnatomyUpperLimbDataset`.

## 2026-10-05 — Docs kept current by rule and by hook

- **Why:** the user asked that docs be updated continuously so any future
  session can pick up exactly where work stopped. Cloud sessions can end
  without warning, so "update docs at the end" loses information.
- **Rule:** every commit that changes code/data/tooling updates
  `docs/STATUS.md` and any other affected doc in the same commit (CLAUDE.md
  top banner, CONTRIBUTING "Keeping docs current", anatomy-workflow skill,
  SessionStart message).
- **Enforcement:** a Claude Code PreToolUse hook on Bash
  (`scripts/hooks/docs-gate.mjs`) blocks `git commit` when the staged or
  working-tree changes touch code paths but no doc paths. It checks the
  working tree too because `git add -A && git commit` arrives as a single
  command, before anything is staged. It cannot judge doc _quality_ — it
  only stops the "forgot entirely" case. `[docs: none]` in the message
  bypasses it for formatting/typo commits. Not a git hook, so humans and CI
  are unaffected; a git-level hook was rejected because it needs per-clone
  installation (husky etc.) for little gain in a single-author repo.

## 2026-10-05 — Layer peeling is view-based (GPU ID pass), not data-based

- **Need:** deep muscles are hidden under superficial ones, especially in
  "find" questions.
- **Options:** (a) anatomical layer numbers per muscle — Z-Anatomy has none,
  and inventing them breaks the "never invent medical facts" rule;
  (b) CPU raycasting a grid — slow on 1.35M triangles without a BVH;
  (c) render the scene once off-screen with per-mesh ID colours and read back
  which structures own front pixels. Chosen: **(c)** — exact for the current
  view, one cheap render, works for any model and any future region.
- **Rules:** bones are never peeled (they are the core); slivers under 3
  pixels stay; the selected structure is kept so you can dissect down around
  it; peels are a stack so "restore" undoes one step; quiz questions and
  revealed answers restore all layers (a peeled target would be invisible and
  peels would leak between questions).
- **Rejected:** tap-to-peel mode — hide (H / panel button) already covers
  removing one chosen structure.

## 2026-10-05 — Muscle parts are child structures; wholes stay the unit of study

- Z-Anatomy models many muscles as parts (heads of biceps/triceps, parts of
  deltoid, trapezius, pectoralis major); until now they were merged into
  whole muscles. Each part is now also its own structure with `parentId`.
- `registry.structures` lists wholes only, so every existing consumer (quiz
  scopes, legend counts, progress, region filters, peeling) keeps working on
  whole muscles without changes; parts are reachable by id, search and the
  info panel. Alternative — mapping meshes to parts and deriving wholes
  everywhere — would have touched every consumer for little gain.
- Clicking picks wholes by default (what an intro course asks); a toolbar
  toggle switches to parts. Quizzes don't ask about parts yet and always
  start with part picking off, so a click on a head still answers "find the
  biceps".

## 2026-10-05 — Origins & insertions from Z-Anatomy patches, conservatively labelled

- **Source:** Z-Anatomy ships origin/insertion surface patches on the bones
  (names ".o…"/".e…", plus "Origin-…"/"End-…" materials). They were dropped
  from the main export; now exported separately (`export_attachments.py`)
  as `z-anatomy-upper-limb-attachments.glb` (227 patches, simplified 50%,
  0.8 MB) and loaded only when a muscle or bone with attachments is selected.
- **Kind:** origin/insertion only when the name suffix and the material agree;
  12 disagreeing patches become "attachment" (not confirmed).
- **Review demotion:** a check of every upper-limb muscle against standard
  descriptions found source labels that contradict them (serratus anterior,
  pectoralis minor, subclavius reversed; trapezius parts and latissimus
  scapular patch mislabelled; extensor carpi ulnaris, deep head of flexor
  pollicis brevis doubtful). Those muscles are shown as "not confirmed" —
  we withhold the claim, we never flip it (`KIND_UNDER_REVIEW`).
- **Side:** 7 patches have a wrong ".l/.r" suffix; the side comes from the
  patch's position (geometry, not a medical claim).
- **Display:** x-ray like the selection (attachments are nearly always under
  other muscles); violet/amber/slate are outside the tissue palette and the
  teal selection; the info panel names the bones (registry names, so Hebrew
  appears where curated) and, for a bone, the muscles attached to it.
- **Not shown in quizzes** (explore only), like the leader label.

## 2026-10-05 — Whole body: five streamed model files

- **Scope (user request):** every Z-Anatomy system — bones/cartilage/joints,
  muscles, brain/spinal cord/nerves/eye, heart/vessels, organs and lymphoid
  organs. Source ≈6.4M polygons; error-bounded simplification (0.5) gives
  ≈3.1M triangles, 15.8 MB.
- **Packaging:** one GLB per pack (skeleton, muscles, nerves, vessels,
  organs) instead of one 16 MB file: the skeleton (2.6 MB) shows the body
  quickly and frames the camera, the rest streams in. Alternatives: one file
  (slow first paint), per-region files (structures span regions, and the
  legend toggles systems). Picking without a BVH measured fine (ray-casting
  isn't the cost; rendering is), so no BVH yet.
- **Left out on purpose:** the non-commercial inner ear ("Internal ear"
  collection) and kidney model (kidneys, renal pelvis, intrarenal vessels) —
  a test guards it; coverings that hide what's inside on first view (pleura,
  greater omentum, meninges, plus the fasciae/sheaths/bursae/capsules
  already excluded); liver segments (they duplicate the liver mesh); helper
  objects.
- **Organ systems:** explicit name patterns in the export
  (`VISCERAL_SYSTEMS`) — the source groups viscera only loosely; an organ
  without a match stops the export.
- **Regions:** Z-Anatomy collections first; structures they don't place by the
  height of their centre against skeletal landmarks (mandible, manubrium,
  top of the diaphragm, top of the sacrum) — a navigation aid; left/right
  harmonised; whole muscles take their parts' majority region.
- **Source fixes:** missing side suffixes completed from position, one
  spelling difference between sides, a leading space; attachment patch sides
  from the nearest mesh of their own muscle.
- **Quizzes:** organ/brain/heart targets also hide bones; nuclei, tracts,
  fasciculi, sulci and lymph-node groups are `detail` (out of built-in
  quizzes).
- **Attachments:** all 679 patches; the muscle-by-muscle review was extended
  to the whole body (28 muscles shown as "not confirmed").
