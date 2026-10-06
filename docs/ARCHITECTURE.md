# Architecture

How the app is put together, and how to extend it without breaking its
boundaries. For _why_ individual choices were made see `DECISIONS.md`; for
_what to do next_ see `STATUS.md`.

## 1. Layers

```
┌─────────────────────────────────────────────────────────────────────┐
│ app/ (routes)        thin server components that render a *View     │
├─────────────────────────────────────────────────────────────────────┤
│ components/          React UI. Reads stores + context, calls lib/.  │
│   anatomy/           3D canvas + viewer overlays                    │
│   quiz/ progress/    quiz setup/run/summary, progress page          │
│   home/ layout/ ui/  home, top strip, primitives (Button, Segmented) │
├─────────────────────────────────────────────────────────────────────┤
│ store/ (zustand)     small, single-purpose client state stores      │
│ hooks/               glue: store + context → convenient values      │
├─────────────────────────────────────────────────────────────────────┤
│ lib/                 PURE TypeScript domain logic — no React.       │
│   anatomy/           registry, model adapter, names, search,        │
│                      visibility, dataset validation                 │
│   anatomy/three/     three.js helpers (materials, scene index,      │
│                      camera framing) — no React either              │
│   quiz/ progress/    quiz engine, scheduler, stats, persistence     │
│   study/             study scopes                                   │
│   i18n/              UI string dictionaries (he, en)                │
├─────────────────────────────────────────────────────────────────────┤
│ data/anatomy/        datasets: structures + mesh map (+ GLB in      │
│                      public/models)                                 │
│ types/               shared domain types                            │
└─────────────────────────────────────────────────────────────────────┘
```

Rules:

- `lib/` never imports from `components/`, `store/` or `hooks/`. It is unit
  tested in Node with no DOM.
- Components don't contain domain rules (scoring, search ranking, visibility);
  they call `lib/`.
- `app/` pages stay thin: metadata + a client `*View` component.

## 2. The model boundary (most important invariant)

```
GLB file ──► GLTFLoader ──► three.js scene
                               │  node names (raw, model-specific)
                               ▼
              AnatomyModelAdapter  (lib/anatomy/modelAdapter.ts)
              + dataset meshMap.json  (raw name → structure id)
                               │  structure ids ("biceps-brachii-left")
                               ▼
        registry · search · viewer state · quiz · progress · UI
```

Only `modelAdapter.ts`, `meshNames.ts`, `three/sceneIndex.ts` and the dataset's
`meshMap.json` know raw node names (plus the attachment patch names in
`attachments.json`, used only by `AttachmentPatches.tsx`). Everything else speaks structure ids. That
is what makes the model swappable.

Name resolution details (`three/sceneIndex.ts`): the original glTF name from
`userData.name` is used (GLTFLoader sanitizes `.`/`:` out of `object.name`),
Blender's `.001` suffixes are ignored, and if a mesh itself isn't mapped its
ancestors are tried (multi-primitive meshes load as a group of meshes).

## 3. Data model (`types/anatomy.ts`)

- `AnatomicalStructure` — id, `names` (`en` required, `la`/`he` optional, each
  a `Term { text, verified, source? }`), per-language `aliases`, `system`,
  `region`, optional `side` + `bilateralGroupId`, optional `details` (each
  field a list of `LocalizedText`), tags, provenance.
- Display names are composed at runtime (`lib/anatomy/names.ts`): base name +
  localized side label, in the user's preferred term language with English
  fallback.
- Parts: a structure with `parentId` is a part of a whole (a head of a
  muscle; a chamber of the heart, a lobe of a lung, a gyrus of a cerebral
  lobe — organ wholes come from the export's `ORGAN_GROUPS`, with
  `groupSide` for wholes that aren't the part's own side). `meshMap` maps every mesh to its **whole** structure;
  `partMeshMap` (optional) additionally maps part meshes to the part.
  `registry.structures` / `bySystem` list **wholes only** (legend counts,
  region views and `showOnly` never see parts); `registry.all` adds the parts
  — what can be studied (quiz scopes, progress, distractors); `registry.get`, search and the
  info panel include parts; `partsOf` / `wholeOf` relate them. The scene index
  tags meshes with `userData.partId`, `getStructureVisibility(..., partId)`
  applies hide/isolate of either the part or the whole, selection/hover match
  either id, and clicks pick the part only when `viewerStore.pickParts` is on
  (off on quiz start via `showOnly`).
- Attachments (origins/insertions): `AnatomyDataset.attachments` =
  `{ modelUrl, items: MuscleAttachment[] }` — one patch mesh per attachment
  in a separate GLB (`z-anatomy/attachments.glb`, exported by
  `export_attachments.py`), each with the muscle/part `structureId`, `kind`
  (`origin` | `insertion` | `attachment` = not confirmed) and the `boneId` it
  lies on. `lib/anatomy/attachments.ts` (pure): `attachmentsFor` (a muscle →
  its own + its parts' + its whole's patches; a bone → every patch on it)
  and `summarizeAttachments` (rows for the info panel).
  `KIND_UNDER_REVIEW` in `data/anatomy/z-anatomy/attachments.ts` demotes
  muscles whose source labels contradict standard anatomy to `attachment`.
- `AnatomyDataset` = `{ info, structures, meshMap, partMeshMap?, attachments? }`. The app runs on
  `data/anatomy/index.ts → activeDataset`, provided via
  `components/providers/AnatomyDataProvider.tsx` (registry, adapter, search
  are built once per dataset).
- Datasets: `data/anatomy/z-anatomy/` (active — real model; structures built
  at runtime by `build.ts` from the export `manifest.json` plus
  `manifest-open3d.json` — the Open3DModel extras, a sixth model file
  `extras.glb`; entries with `source: "Open3DModel"` get that source's
  licence and attribution) and
  `data/anatomy/demo/` (placeholder, used by tests). Curated names/Hebrew/
  details live once per concept in `data/anatomy/content/concepts.ts` and are
  attached with `withConcept()`. The Z-Anatomy dataset then applies **her
  course's names** (`z-anatomy/courseNames.json`, generated by
  `scripts/course/medintzfat/course_names.py`) with `withCourseName()` in
  `z-anatomy/index.ts`: course English/Hebrew names are displayed, the
  model's names stay searchable as aliases (`docs/COURSE_SOURCE.md`). Then
  `withSummaryNotes()` adds her own summary (`z-anatomy/summaryNotes.json`,
  from `scripts/course/summary/summary_notes.py`): `studyNotes` (Hebrew,
  shown by `StructureNotes` in the info panel) and her Hebrew names.
- `DETAIL_TAG` marks fine-grained structures (branches, inconstant ones):
  explorable, but skipped by built-in quiz scopes.
- `lib/anatomy/validateDataset.ts` enforces data invariants (kebab-case ids,
  side suffixes, consistent bilateral groups, mesh map consistency). It runs
  in unit tests and in `npm run anatomy:validate`.

## 4. State

| Store                      | Holds                                                                                                               | Persisted                                                    |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `store/viewerStore.ts`     | selection, hover, hidden ids, hidden systems, isolated id, camera command, selection lock, peel mode + peeled stack | no                                                           |
| `store/settingsStore.ts`   | UI locale, term-language preference                                                                                 | localStorage (`anatomy.settings`)                            |
| `store/sceneIndexStore.ts` | loaded model files (root + scene index each), merged structure id → meshes, `complete`                              | no (runtime objects)                                         |
| `store/quizStore.ts`       | the active `QuizRun` (state of the pure quiz engine)                                                                | no                                                           |
| `store/progressStore.ts`   | `ProgressData`: per-structure progress + session history                                                            | via `ProgressRepository` → localStorage (`anatomy.progress`) |

Conventions:

- Stores hold _state + intent-named actions_ (`hide`, `reveal`, `focus`), not
  setters for every field. Derived values are computed (e.g.
  `getStructureVisibility`) rather than stored.
- Camera moves are _commands_ with a nonce (`cameraCommand`), so repeating the
  same request is observable.
- Imperative three.js code subscribes to stores directly
  (`useViewerStore.subscribe`) instead of re-rendering React.
- Persisted stores use `skipHydration` and are rehydrated in a client effect
  (`SettingsProvider`) so the server render and the first client render match.

## 5. Rendering pipeline

```
viewerStore change
   │  (subscribe; only if selection/hover/visibility changed)
   ▼
AnatomyModel.apply()
   for each mapped mesh:
     visibility = getStructureVisibility(id, system, state)   ← lib, tested
     visual     = hidden | ghosted | selected | hovered | default
     MaterialStateController.apply(mesh, visual)               ← lib, tested
   invalidate()   (frameloop="demand": render one frame)
```

- `MaterialStateController` swaps in cloned variants shared per
  _(base material, state)_, never mutates originals, and restores/disposes
  everything on unmount.
- Picking: `AnatomyModel` handles pointer events on the scene root and takes
  the first intersection whose mesh is `interactive` (visible and not ghosted).
- Camera: `CameraController` wraps drei `CameraControls`. Focus = fit a padded
  bounding sphere (`three/cameraFraming.ts`) + a focal offset that centres the
  structure in the area not covered by any element marked
  `data-viewer-obstruction` (the info panel).
- Selection: the selected structure uses a mostly-teal material drawn last
  without depth test (x-ray), so buried nerves/vessels stay visible.
  `SelectionLabel` (explore only — it would give away quiz answers) puts an
  atlas-style leader label at the selection's bounding-box centre via drei
  `<Html>`.
- Peeling (tap to peel): `viewerStore.peelMode` turns taps into peels —
  `pick(id)` calls `peelStructure(id)` instead of selecting (whole or part,
  per `pickParts`); each peel is pushed on `peeledLayers` (one id per entry)
  and hidden; `restoreLayer` pops one, `restoreAllLayers` / `showAll` /
  `showOnly` / quiz question changes clear them; isolating turns peel mode
  off. UI: `LayerControls` (toggle + restore; explore toolbar, quiz find
  questions) and `PeelModeHint` (pill over the canvas).
- Attachment patches (explore only, with the leader label):
  `AttachmentPatches` mounts once the selection has attachments, lazy-loads
  the patch GLB in its own Suspense, and shows the patches of the selection
  in `ATTACHMENT_COLORS` (violet origin, amber insertion, slate unconfirmed),
  x-ray like the selection (no depth test, drawn after it), unpickable.
  `viewerStore.showAttachments` toggles them; `StructureAttachments` is the
  info-panel key (bones per kind for a muscle, muscles per kind for a bone).
- Several model files: `AnatomyDatasetInfo.models` lists them (Z-Anatomy:
  skeleton, muscles, nerves, vessels, organs). `AnatomyScene` → `ModelFiles`
  mounts the first (primary) file, then — once it is indexed — the others,
  each in its own Suspense so files appear as they arrive. Every
  `AnatomyModel` applies its material/visibility state, then registers
  `{ root, index }` in `sceneIndexStore`, which merges `objectsByStructure`
  and sets `complete` when all files are in. The camera frames on the first
  registration only (the primary file is the whole skeleton), so streaming
  files never move it. Quizzes start on `complete`; deep links wait only for
  their structure (`useStructureLoaded`); `LoadingOverlay` shows a centred bar
  until the primary file, then a small "n/5" pill.
- `AnatomyCanvas` is loaded with `next/dynamic({ ssr: false })`, wrapped in an
  error boundary with retry, a WebGL capability check and a loading overlay.

## 6. Quiz & progress flow

```
/quiz  QuizView ── setup ──► QuizRunView (ViewerFrame + quiz panels)
                                 │
                       useQuizRun(config)
 scene index ready ─► eligibleStructures ─► generateQuiz ─► startQuiz ─► quizStore
                                 │
 click in 3D ─► viewerStore.pick ─► selectedStructureId ─► dispatch(answer)
 option button / keys 1–4 ─────────────────────────────► dispatch(answer)
                                 ▼
             quizReducer (pure) ─► new QuizRun ─► syncViewer: highlight, lock,
                                                  camera; auto-advance on correct
                                 │ phase "complete"
                                 ▼
          progressStore.recordSession ─► recordSession (pure) ─► repository.save
```

- `lib/quiz/` — `eligibility`, `questionGenerator`, `quizEngine`, `summary`,
  `random`. `lib/study/scopes.ts` — built-in scopes (whole body, regions,
  systems); `hooks/useStudyScopes.ts` adds the dynamic "due for review" scope.
- `lib/progress/` — `reviewScheduler`, `progressUpdates` (`applyAttempt`,
  `recordSession`), `progressStats` (overview, weakest, recent, due),
  `progressRepository` (interface) + `localProgressRepository`.
- Viewer pages share `components/anatomy/ViewerFrame.tsx` (canvas + top bar
  with a page-specific centre) and `ViewerPanel.tsx` (side card / bottom
  sheet, marked as a viewer obstruction). Regular pages use
  `components/layout/PageShell.tsx`.
- `CameraController` also applies a camera command issued just before it
  mounted (quiz start and deep links react to the same index update).

## 7. UI layer & style

Visual rules: `docs/DESIGN.md` (and the `anatomy-ui-style` skill). Tokens are
Tailwind theme variables in `src/app/globals.css`. Shared primitives live in
`components/ui` (`Button`/`ButtonLink`, `IconButton`, `Segmented`, `Kbd`);
page shells in `components/layout` (`PageShell`, `PageHeader`, `Logo`,
`MainNav`, `SettingsMenu`) and `components/anatomy` (`ViewerFrame`,
`ViewerPanel`). Feature components compose these; they don't define new
colours or button styles.

## 8. Internationalization & RTL

- UI strings: `lib/i18n/messages.he.ts` defines the shape (`Messages`);
  `messages.en.ts` must satisfy it, so missing translations fail type-checking.
  Read them with `useMessages()`.
- `<html lang dir>` follows the locale (`SettingsProvider`).
- Layout uses logical Tailwind utilities only; `src/test/rtlLayout.test.ts`
  fails the build on physical `ml-`/`pr-`/`left-`/`text-right`… classes.
- Anatomical terms are rendered through `TermText` (`<bdi>` + `lang` + `dir`),
  which also shows the "unverified" badge.
- Search (`lib/anatomy/search.ts`) normalizes Hebrew (niqqud, final letters,
  geresh, maqaf, leading ה) and Latin diacritics on both sides.
- Keyboard shortcuts match `event.code` so they work on a Hebrew layout.

## 9. Testing strategy

| Level            | Where                                                                                                                                       | Runs with                                   |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| Pure logic       | `src/lib/**/*.test.ts`, `src/store/*.test.ts`                                                                                               | `npm test` (node)                           |
| Data integrity   | `lib/anatomy/validateDataset.test.ts`                                                                                                       | `npm test`                                  |
| Style invariants | `src/test/rtlLayout.test.ts`                                                                                                                | `npm test`                                  |
| Components       | `src/components/**/*.test.tsx` (jsdom pragma, Testing Library, `renderWithProviders`)                                                       | `npm test`                                  |
| End-to-end       | `e2e/smoke.ts` → `explore.flow.ts`, `quiz.flow.ts` (Playwright, real WebGL via SwiftShader; UI strings imported from the real dictionaries) | `npm run e2e:smoke` against a running build |

Test behaviour (what a student would observe or what a function returns), not
implementation details. Inject randomness and time (seeded RNG, `now`
parameters) so logic is deterministic.

## 10. Recipes

**Add a structure to a dataset** — add it to `data/anatomy/<ds>/structures.ts`
(names with `verified: false`, only facts you are sure of), map its mesh in
`meshMap.json`, add its Hebrew term to `docs/CONTENT_REVIEW.md`, run
`npm test && npm run anatomy:validate`.

**Add a dataset / real model** — see README "Swapping in a real model". Also
record licensing in `THIRD_PARTY_ASSETS.md` first. For Z-Anatomy regions,
extend `scripts/anatomy/z-anatomy/export_glb.py` (README in that folder).

**Add curated content (details) for a structure** — add or extend a concept
in `data/anatomy/content/concepts.ts`, map the dataset's English base name to
it (`CONCEPT_BY_NAME` in `z-anatomy/build.ts`).

**Change a structure's displayed name** — names follow her course site.
Add a course wording to `scripts/course/medintzfat/synonyms.json` or a
Hebrew name (with its course page) to `hebrew-names.json`, re-run
`course_names.py` (`docs/COURSE_SOURCE.md` → "Regenerate"), and list Hebrew
in `docs/CONTENT_REVIEW.md`. Don't hand-edit `courseNames.json`.

**Add a UI string** — add the key to `messages.he.ts` (TypeScript will then
demand it in `messages.en.ts`), use via `useMessages()`.

**Add a viewer action** — add an intent-named action to `viewerStore`, test
it in `viewerStore.test.ts`; if it affects rendering, make sure
`affectsVisuals` in `AnatomyModel.tsx` covers the field.

**Add a quiz question type** — extend `QuizQuestion` in `types/quiz.ts`,
generate it in `questionGenerator.ts`, handle it in `quizEngine.ts` (tests
first), render it in `QuizQuestionPanel.tsx`, and define its viewer behaviour
in `useQuizRun.ts` → `syncViewer`.

**Change persistence** — implement `ProgressRepository` (e.g. Supabase) and
pass it to `createProgressStore` in `store/progressStore.ts`.

**Add a page** — `app/<route>/page.tsx` (thin) + `components/<feature>/<Name>View.tsx`.
