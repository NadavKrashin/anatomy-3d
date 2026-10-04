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
│   quiz/ progress/    (feature UIs)                                  │
│   home/ layout/ ui/  landing, top bar pieces, primitives            │
├─────────────────────────────────────────────────────────────────────┤
│ store/ (zustand)     small, single-purpose client state stores      │
│ hooks/               glue: store + context → convenient values      │
├─────────────────────────────────────────────────────────────────────┤
│ lib/                 PURE TypeScript domain logic — no React.       │
│   anatomy/           registry, model adapter, names, search,        │
│                      visibility, dataset validation                 │
│   anatomy/three/     three.js helpers (materials, scene index,      │
│                      camera framing) — no React either              │
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
`meshMap.json` know raw node names. Everything else speaks structure ids. That
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
- `AnatomyDataset` = `{ info, structures, meshMap }`. The app runs on
  `data/anatomy/index.ts → activeDataset`, provided via
  `components/providers/AnatomyDataProvider.tsx` (registry, adapter, search
  are built once per dataset).
- `lib/anatomy/validateDataset.ts` enforces data invariants (kebab-case ids,
  side suffixes, consistent bilateral groups, mesh map consistency). It runs
  in unit tests and in `npm run anatomy:validate`.

## 4. State

| Store                      | Holds                                                                     | Persisted                         |
| -------------------------- | ------------------------------------------------------------------------- | --------------------------------- |
| `store/viewerStore.ts`     | selection, hover, hidden ids, hidden systems, isolated id, camera command | no                                |
| `store/settingsStore.ts`   | UI locale, term-language preference                                       | localStorage (`anatomy.settings`) |
| `store/sceneIndexStore.ts` | structure id → three.js meshes of the loaded model                        | no (runtime objects)              |

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
- `AnatomyCanvas` is loaded with `next/dynamic({ ssr: false })`, wrapped in an
  error boundary with retry, a WebGL capability check and a loading overlay.

## 6. Internationalization & RTL

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

## 7. Testing strategy

| Level            | Where                                                                                 | Runs with                                   |
| ---------------- | ------------------------------------------------------------------------------------- | ------------------------------------------- |
| Pure logic       | `src/lib/**/*.test.ts`, `src/store/*.test.ts`                                         | `npm test` (node)                           |
| Data integrity   | `lib/anatomy/validateDataset.test.ts`                                                 | `npm test`                                  |
| Style invariants | `src/test/rtlLayout.test.ts`                                                          | `npm test`                                  |
| Components       | `src/components/**/*.test.tsx` (jsdom pragma, Testing Library, `renderWithProviders`) | `npm test`                                  |
| End-to-end       | `e2e/*.ts` (Playwright, real WebGL via SwiftShader)                                   | `npm run e2e:smoke` against a running build |

Test behaviour (what a student would observe or what a function returns), not
implementation details. Inject randomness and time (seeded RNG, `now`
parameters) so logic is deterministic.

## 8. Recipes

**Add a structure to a dataset** — add it to `data/anatomy/<ds>/structures.ts`
(names with `verified: false`, only facts you are sure of), map its mesh in
`meshMap.json`, add its Hebrew term to `docs/CONTENT_REVIEW.md`, run
`npm test && npm run anatomy:validate`.

**Add a dataset / real model** — see README "Swapping in a real model". Also
record licensing in `THIRD_PARTY_ASSETS.md` first.

**Add a UI string** — add the key to `messages.he.ts` (TypeScript will then
demand it in `messages.en.ts`), use via `useMessages()`.

**Add a viewer action** — add an intent-named action to `viewerStore`, test
it in `viewerStore.test.ts`; if it affects rendering, make sure
`affectsVisuals` in `AnatomyModel.tsx` covers the field.

**Add a page** — `app/<route>/page.tsx` (thin) + `components/<feature>/<Name>View.tsx`.
