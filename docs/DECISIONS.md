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
- Quiz/Progress appear in the nav as disabled "soon" items.

## Deferred

- No persistence of viewer state (hidden/isolated) across reloads — only
  settings persist. Progress persistence arrives with the quiz.
- No performance overlay yet; the demo model is ~23k triangles. Add
  instrumentation when the real model lands.
