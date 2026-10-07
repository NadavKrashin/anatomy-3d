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
  a test guards it (since 2026-10-06 they ship in a separate file instead;
  see "Non-commercial models in their own file"); coverings that hide what's inside on first view (pleura,
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

## 2026-10-05 — Male/female model switch: researched, deferred by the user

(Built on 2026-10-06 as option 1 — see "Male/female switch: one body, female
organs fitted in" below.)

The user wants to switch easily between a male and a female model. Z-Anatomy
(and BodyParts3D, which it is built on) is **male only**. No open, full
female counterpart (skeleton + muscles + nerves + vessels + organs) exists.
The user asked to **document the options and leave it for later** — ask
which option before building.

**Best source found:** the Human Reference Atlas (HuBMAP) 3D reference
organs, **female set ("VH_F", Visible Human Female), CC BY 4.0** (compatible
with our CC BY-SA). Repo: `github.com/hubmapconsortium/ccf-3d-reference-object-library`
— reachable from cloud sessions via `git clone --filter=blob:none
--no-checkout` + `git checkout HEAD -- <file>` (the docs site
`hubmapconsortium.github.io` and `cdn.humanatlas.io` are blocked by the
network policy). Files are real GLBs (Maya/babylon export), e.g.
`VH_Female/v1.2/`: `VH_F_Uterus`, `VH_F_Vagina`, `VH_F_Ovary_L/R`,
`VH_F_Fallopian_Tube_L/R`, `VH_F_Ligaments_Uterus_Ovaries`, `VH_F_Pelvis`
(bony pelvis), `VH_F_Kidney_L/R`, `VH_F_Urinary_Bladder`, `VH_F_Ureter_L/R`,
`VH_F_Heart`, `VH_F_Lung`, `VH_F_Liver`, `VH_F_Spleen`, `VH_F_Skin`,
`VH_F_Vertebrae`, `VH_F_Spinal_Cord`, eye/knee muscles…; `v1.3/`:
`VH_F_mammary_gland_L/R`; `v1.4/`: larynx, trachea, bronchi, lung, blood
vasculature. Female skeleton/muscle coverage is partial (pelvis, vertebrae,
knee and eye muscles). For reference, the MIT-licensed
`github.com/slorksmo/Human-Atlas` combines this female set with the male
BodyParts3D skeleton (least-squares fit to shared anchors).

**Options presented to the user (none chosen yet):**

1. **Same body, female organs** (recommended): a male/female switch swaps
   the male reproductive organs for the Atlas's uterus, ovaries, fallopian
   tubes, vagina, uterine/ovarian ligaments and mammary glands (and could add
   kidneys, which Z-Anatomy can't ship). Everything else stays shared.
   Caveat: skeleton and proportions stay male (male-shaped pelvis).
2. **Also swap the female pelvis:** option 1 plus the Atlas's female bony
   pelvis replacing hip bones/sacrum in female mode. Caveat: hip/thigh
   muscles and attachment patches were modelled on the male pelvis, so they
   won't meet the female bones exactly.
3. **Separate female body:** load the Atlas's own female body (skin, organs,
   brain, female pelvis, few muscles). Caveat: most bones, muscles, nerves
   and vessels missing, so explore/peel/quiz cover far less than the male
   body.

**Implementation notes for later:** the Atlas uses its own coordinates
(Visible Human Female, millimetres) — fit a similarity transform from the
Atlas pelvis/vertebrae to Z-Anatomy's (hip bones, sacrum, lumbar vertebrae),
apply it to the organs in a Blender export script like `export_glb.py`, and
ship a sixth pack (e.g. `female.glb`). In the app: a `sex` setting in the
settings store; structures tagged `male`/`female` hidden by
`getStructureVisibility` when the other sex is chosen (or packs loaded per
sex); quiz scopes skip the hidden sex; THIRD_PARTY_ASSETS row with the HRA
attribution ("Human Reference Atlas, HuBMAP — CC BY 4.0").

## 2026-10-05 — Whole organs from the source hierarchy; parts are studyable

- **Need:** the source models the heart as chambers/valves, the lungs as
  lobes, the brain as gyri/lobules — there was no "heart" or "lung" to select.
- **Grouping:** Z-Anatomy's own group empties (`Heart.g`, `Right lung.g`,
  `Frontal lobe.g`, `Cerebellum.g`…) define the wholes; an explicit list in
  the export (`ORGAN_GROUPS`) chooses which groups are organs and whether the
  whole is midline (heart, cerebellum) or one per side (lungs, lobes). The
  existing part/whole mechanism (muscle parts) carries them unchanged. One
  level only; a two-level hierarchy (gyrus → lobe → hemisphere) was not
  worth the complexity yet.
- **Studyable = wholes + parts** (`registry.all`). Without it, making heart
  chambers and gyri "parts" would have dropped them from quizzes. Find
  questions about a part switch on part-picking; distractors prefer sibling
  parts and never offer the target's own whole or parts. The legend and
  region views still count wholes.

## 2026-10-05 — Peeling becomes tap-to-peel (supersedes the view-based peel)

- **Why:** the user found the automatic peel too drastic — zoomed in on the
  chest of the whole-body model, one tap removed ~250 structures (every
  small vessel, nerve and node on the surface counts as "outermost"), lungs
  and heart included. She wants a controlled, hands-on dissection.
- **Options offered:** tap to peel; a gentler button (only the few biggest
  outer structures); peel only the centre of the view; fade-out. The user
  chose **tap to peel** only.
- **Now:** a peel mode toggle — each tap hides just the tapped structure (an
  undo stack restores one tap at a time). The view-based ID-pass code
  (`three/structureIdPass.ts`, `lib/anatomy/peel.ts`, `useLayerPeeling`) was
  removed rather than kept unused; see the 2026-10-05 "Layer peeling is
  view-based" entry and git history if a view-based peel is wanted again.
- Bones can be peeled too now (the user chooses each structure).

## 2026-10-05 — Course site: commit facts only, keep its content local

**Context.** The user named her course site (https://medintzfat.com/anatomy/)
as the study source. Its terms of use (https://medintzfat.com/terms/) allow
personal study use but forbid copying or embedding its content, in whole or
in part, and rewriting it as original. This repo is public and the app is
deployed publicly.

**Decision.** `scripts/course/medintzfat/extract.py` commits only facts to
`data/course/medintzfat/`: the syllabus (titles + URLs), structure names per
lab with the site's past-exam marks, Hebrew↔English term pairs and suggested
structure ids. The practice questions, explanations and page text go to the
git-ignored `.course-cache/` for personal study and as a reference while we
build. Nothing from the site ships in the app until the user picks one of
these: ask the site for permission, link out to it, or write our own
questions.

**Matching.** Suggested ids use a deliberately strict normalised exact-name
match: drop m./n./a./v., sort the words, singularise. A wrong id would
silently teach the wrong structure, so a miss is better. That is why only
~35% of rows match. The rest need a person.

## 2026-10-05 — Structure names follow her course site

**Context.** The user asked for "the names of every part to be exactly as
shown in this website since that is what they are actually learning". The
model's names are Z-Anatomy's TA-based English, e.g. "Biceps brachii
muscle", "Oesophagus", "Vagus nerve (X)". The course writes "Biceps
brachii", "Esophagus", "Vagus nerve".

**Decision.**

- A generated table, `z-anatomy/courseNames.json`, is applied on top of the
  built dataset (`withCourseName`). The model build and its ids stay
  untouched, so progress and links keep working. Displayed names change
  only.
- Course names are facts (names of structures), so they may be committed
  (see "commit facts only" above).
- Matching is automatic but conservative. Anything ambiguous keeps the
  model name, because a wrong name teaches the wrong structure. Synonyms
  and Hebrew are hand-picked lists with the page each comes from.
- **Sentence case** is used because the site itself mixes Title Case and
  sentence case. Abbreviation-only names are spelled out. The wording and
  spelling are the course's.
- Both sides of a paired structure must share one name (a dataset
  invariant used by quizzes and search). Side-specific course names
  ("Right coronary artery") become search aliases.
- Hebrew: the course hardly uses Hebrew names. Our earlier Hebrew (Academy
  forms such as עצב הגומד) is no longer shown for structures the course
  names only in English. It stays searchable.

## 2026-10-05 — Her own summary provides the study notes

**Context.** Descriptions were wanted for every part. The course site's
notes may not be copied or rewritten (its terms forbid both). The user then
shared her own summary, written in her own words, for the app to use.

**Decision.**

- Her text is shown **verbatim**, labelled "סיכום" ("Summary"), not mixed
  into the English textbook `details`. A `StudyNote[]` field on the
  structure keeps it separate, carries its language, and lets one entry
  cover several structures.
- Notes go first in the panel, because they are her own course material.
  "No verified information" is not shown when notes exist.
- Her Hebrew names beat the site's: she uses them. Only trivial forms are
  normalised: the definite article, and the plural for a one-sided
  structure. The rest is as written.
- The .docx stays out of git, but the generated JSON with her text is
  committed and deployed (the repo and app are public). The user shared it
  for the app.

## 2026-10-06 — Notes on a part of a structure go to the whole

**Context.** About 400 entries of her summary are about something the mesh
atlas has no separate piece for: a landmark on a bone, a lobe of an organ,
a canal or space and what runs through it, a heading such as "Rotator
cuff". The user chose to show these on the structure they belong to.

**Decision.**

- A hand-assigned map, `scripts/course/summary/parents.json` (term →
  structure ids or `re:` patterns). It is used only when the normal
  matching fails.
- Such notes are labelled with the entry's name (`shared`) and come after
  the structure's own notes.
- They give no Hebrew name: a landmark's name isn't the bone's.
- Unknown ids fail the script.

**Model gaps.** The phrenic nerve and the other missing nerves and vessels
are absent from Z-Anatomy itself, so there is nothing to export. The
export's covering filter was too broad. It now has a reviewed exception
list (`NOT_COVERINGS`) instead of looser patterns, so real coverings stay
excluded.

## 2026-10-06 — Regions: a source collection is not trusted below the diaphragm

Z-Anatomy's "Thorax" collection lists pelvic veins: the iliac, gluteal,
internal pudendal and lateral sacral veins, the testicular veins and the
deep dorsal vein of the penis. They showed under "thorax" in region scopes
and quizzes. The export now places a cardiovascular structure from that
collection by height when its centre is below the diaphragm's lowest point
(the crura). That line sits below the azygos vein and the lower ribs, which
correctly stay "thorax". Only 21 manifest regions changed; the model files
are identical.

## 2026-10-06 — Open3DModel pieces join the Z-Anatomy dataset as a sixth file

Open3DModel (AnatomyTOOL, CC BY-SA) is built on Z-Anatomy: same body and
same coordinates (bones within ~2 mm), so its extra limb pieces fit without
alignment. Integration choices:

- **One extra model file, one extra manifest**, built into the same dataset
  (not a second dataset): its structures behave like any other (regions,
  systems, search, quiz, notes), and only `build.ts` knows the source, to
  attach its licence and attribution. The viewer's attribution line names
  both sources.
- **Only what Z-Anatomy lacks.** A piece is dropped when Z-Anatomy has the
  same name (after normalising Open3DModel's wording and spelling), a mesh
  in the same box or the same place within the same tissue, or a reviewed
  `sameAs` pair. Checking by place catches renamed duplicates; the
  hand-reviewed list catches what geometry can't (a vein drawn differently).
  Two copies of one structure would split clicks and quiz answers.
- **Coverings stay out** (retinacula, tendon sheaths, fasciae, bursae, the
  canal/space overlays), for the same reason as in the main export.
- **Mirroring** right-only pieces is safe because Z-Anatomy is exactly
  symmetric (mirror error 0.0 mm on paired bones); otherwise the left arm
  would lack the brachial plexus cords.
- Numbered lumbricals/interossei and aggregate veins are skipped: Z-Anatomy
  has them under other cuts.

## 2026-10-06 — Non-commercial models in their own file, behind one switch

The user allowed models licensed for non-commercial use (the app is a free
study tool), and asked that going commercial later stay easy. First in:
Z-Anatomy's own inner ear (University of Dundee, CC BY-NC-SA 4.0) and kidney
(lissiecowley, CC BY-NC 4.0) — same body, no alignment.

- **A separate model file and manifest**, not merged into the packs: NC
  (and NC-SA) content can't be combined with CC BY-SA content into one
  adapted work, and a separate file can be dropped without re-exporting
  anything else.
- **`MODEL_SOURCES` in `build.ts`** lists every model source with its
  licence, credit and `commercialUse`; manifest entries name their `source`.
  Structures carry their own source's licence.
- **One switch, `INCLUDE_NON_COMMERCIAL`** (`z-anatomy/index.ts`): off, the
  dataset has no NC structures, model file or credits. A test builds both
  ways. The steps to go commercial are in `THIRD_PARTY_ASSETS.md` → "Going
  commercial" (also: the course site's terms and her summary are personal-use
  too).
- **Credits:** four sources made the viewer's credit line too long, so the
  viewer names the sources and the home page carries the full credit lines.

## 2026-10-06 — Male/female switch: one body, female organs fitted in

The user chose option 1 of the 2026-10-05 entry.

- **Source:** the Human Reference Atlas female organs (CC BY 4.0), from
  `hubmapconsortium/ccf-3d-reference-object-library` (`VH_Female/v1.2`,
  `v1.3`), whose organs and bony pelvis share one frame.
- **Fit:** a similarity transform (no shear, so organ shapes stay true)
  by trimmed ICP from the Atlas pelvis to Z-Anatomy's hip bones, sacrum and
  coccyx: median 4 mm. A female pelvis is shallower, so the fit left the
  bladder in the pubic symphysis and 3 cm from our ureters; the pelvic set
  is therefore shifted so its bladder sits on ours (27 mm back). Breasts:
  same scale, nipple at the 4th intercostal space on the midclavicular
  line, each vertex moved front/back so the back surface lies on our chest
  wall (pelvis-based placement put them inside the chest: torso
  proportions differ).
- **One bladder:** the female bladder's meshes become parts of the existing
  "Urinary bladder", whose own mesh is male-only. Ids, notes and quiz
  progress stay shared; the trigone etc. exist in the female body only.
  Hence sex per **mesh** (`meshSex`), not only per structure.
- **Filtering in one place:** `datasetForSex` produces the dataset of the
  chosen body and the data provider uses it for everything, so no
  component needs to know about sex. Alternative — tagging and checking in
  each consumer (legend, search, quiz scopes, viewer) — was more code and
  easy to miss somewhere.
- **Left out:** uterine anterior/posterior walls (they duplicate the body
  and fundus surfaces: z-fighting); broad ligament, mesosalpinx,
  mesovarium and uterovesical pouch (peritoneal coverings, as in the main
  export); the abdominal ostium (labelled at the uterine end).
- **Male-only in Z-Anatomy** (`MALE_ONLY`): penis, testis, epididymis,
  ductus deferens, ejaculatory duct, seminal gland, prostate, the male
  urethra (it runs through the penis), the bladder mesh, testicular and
  penile vessels. The ureters are kept (they end at the bladder).

## 2026-10-06 — Z-Anatomy's "Sigmoid colon" is the rectum

Adding BodyParts3D's rectum showed that 84% of it lies within 1 cm of
Z-Anatomy's "Sigmoid colon" mesh. That mesh is a midline tube in front of
the sacrum, from the pelvic floor (the anal sphincter) up to S2–S3: the
rectum's course. BodyParts3D, which Z-Anatomy is built from, has a rectum
file but no sigmoid colon file, and Z-Anatomy's "Descending colon" reaches
down to the midline, so the sigmoid loop is part of it.

- The app shows that mesh as **Rectum** (`RELABEL` in `z-anatomy/build.ts`),
  as a whole of its own (no longer a part of "Colon"); BodyParts3D's rectum
  is not added (it would duplicate it). Her rectum notes go on it; her
  sigmoid colon note goes on the descending colon.
- Listed in `docs/CONTENT_REVIEW.md` for her to confirm.

## 2026-10-06 — BodyParts3D pieces: global affine + local ICP

BodyParts3D (CC BY-SA 2.1 JP, Z-Anatomy's own source) fills small gaps:
cardiac veins, gastric/pancreatic arteries, orbital nerves, levator veli
palatini, semispinalis capitis, dorsal scapular arteries. It is in
millimetres in its own frame, and Z-Anatomy remodelled parts of it: one
global affine from 607 name-matched anchors is ~12 mm off. Each piece
therefore gets a local similarity correction by ICP on the anchors within
7 cm (0.6–3.3 mm median). Alternative — per-piece manual placement — was
slower and less reproducible.

## 2026-10-06 — Audit: what is checked and how to rerun it

Before the hand-built pieces the user asked for an all-round check. It runs
on what ships (the meshopt GLBs) and the dataset as each body sees it:

- `npx tsx scripts/anatomy/audit-extract.ts out.json public/models/…/*.glb`
  writes per mesh node its world box, centre and sampled vertices.
- Checks (scratch scripts, logic described here so they can be redone):
  mesh map ↔ GLB nodes with geometry (now also in `anatomy:validate`);
  side vs position (glTF +x = the body's left; near-midline organs like
  the right ventricle legitimately cross); region vs height bands from the
  mandible, manubrium and sacrum; duplicates = **mutual** coverage (≥ 60 %
  of each of two meshes' samples within 1.5 mm of the other — one-way
  proximity only finds neighbours) and floating pieces (nothing within
  10 mm); duplicate display names and other-body structures
  per body; course names sharing no word with the model name.
- Pitfall: gltf-transform's `getElement` already decodes quantized
  positions; dividing again collapses every mesh to a point (the first
  audit pass did this and its geometric results were redone).
- Fixes go to the source of each problem (export rules, `SWAPPED_SIDES`,
  `RELABEL`, the female export's mapping), never to the shipped files by
  hand.

## 2026-10-07 — Hand-built structures: procedural, from measured landmarks

No open model has the phrenic nerve, the laryngeal and cervical plexus
nerves, the thoracic duct, several small arteries or the perineal muscles
(`docs/MODEL_SOURCES.md`). The user chose to build them by hand from a
written brief (`docs/HANDMADE_MODELS_PROMPT.md`); priority 1 (items 1–11)
is built (`scripts/anatomy/handmade/`, README there).

- **Procedural, not sculpted:** one bpy script regenerates everything from
  the shipped meshes; nothing is edited by hand in a binary file, so a later
  model change only needs a rerun. Shapes are schematic (tubes, bands,
  sheets, rings), positions are not: every control point is a landmark
  measured on a named mesh plus a stated offset.
- **Relaxation with a check:** courses are pushed out of every mesh they
  must not touch and the script asserts the result (no penetration, ≥ 0.5 mm
  gap). Inside/outside uses the generalized winding number per mesh, because
  this model's meshes nest (the vagus inside the aortic arch), are open
  (vessel tubes) or double-walled (the diaphragm) — normals and ray parity
  gave false results on each of these.
- **Explicit allowances where the model leaves no room:** the lungs lie on
  the heart with no pleura or pericardium, the arch lies on the trachea, the
  stomach on the spleen, the sphincter ring is small. Rather than distort the
  existing meshes or bend a course out of its anatomical place, a structure
  may lie against named neighbours (`touch`) or sink into a named soft organ
  up to a stated depth (`squeeze`), reported per structure. Everything else
  is held to the strict check.
- **Licence:** the project's own work, made against a CC BY-SA model:
  CC BY-SA 4.0, `MODEL_SOURCES.Handmade`, credited like the other sources.
- **Sexes:** structures shared by both bodies have no `sex`; the female
  perineal muscles are female-only meshes of the same structures (parts of
  the external urethral sphincter and bulbospongiosus; a `" (female)"` mesh
  of the ischiocavernosus, which `build.ts` joins to the male one by name —
  `SEX_VARIANT`).
- **Not modelled yet:** female external genitalia and urethra (item 13–14),
  so the female muscles lie where those organs belong; priorities 2–3.

## 2026-10-07 — Split branches out of Z-Anatomy meshes

Two structures of the hand-built brief's priority 2 already exist, unnamed,
inside larger Z-Anatomy meshes: "Maxillary nerve" runs on through the
inferior orbital fissure along the orbit floor and fans out on the face (the
infra-orbital nerve), and "Femoral nerve" continues below its division down
the adductor canal into vastus medialis (the nerve to vastus medialis). A
hand-built copy would duplicate them. The user chose to split them out
(over adding her terms as synonyms of the parent nerves, which would select
the whole parent):

- `scripts/anatomy/z-anatomy/split-meshes.ts`, a step after
  `optimize-glb.ts`, moves each triangle by its centroid into a new node:
  in front of the infra-orbital artery's posterior end (it enters the orbit
  through the same fissure) → `Infra-orbital nerve`; below the saphenous
  nerve's upper end (the femoral nerve's division in the femoral triangle)
  → `Nerve to vastus medialis`. The cut positions come from those landmark
  meshes, not numbers. It updates the manifest and is a no-op when run
  again; every other mesh is unchanged (bounding boxes identical).
- Left and right share one mirrored mesh in the shipped file: each side's
  node gets its own copy before the split.
- The new structures are separate from their parents (selecting the
  maxillary nerve no longer includes the infra-orbital part).
