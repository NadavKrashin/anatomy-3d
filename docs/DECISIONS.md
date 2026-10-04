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

- No shadcn/ui yet: the slice needed only a button, a dialog (native
  `<dialog>`), selects (native, best on iPad) and panels. shadcn can be added
  when real form-heavy UI (custom study lists) arrives.
- Route is `/explore` (spec sketched `/learn`) to match the "Explore" nav item.
- `/explore?region=upper-limb` starts with only that region visible — the home
  page's "What are you studying?" cards use it; full study scopes come later.
- `TermText` shows the "unverified" badge in the info panel only; lists
  (quiz options, progress rows, search) hide it to reduce noise.

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
