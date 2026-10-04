# ANATOMY — Product & Engineering Spec

> "Learn the body by exploring it."

This is the canonical product brief. It is a condensed but complete version of the
original prompt, plus decisions made since (see §53 and `docs/DECISIONS.md`).

**Guiding question:** does this help a medical student reliably learn the
structures they need for their exam? When flashy graphics and learning UX
conflict, learning UX wins.

---

## 1. Product vision

A web-based anatomy learning platform for a medical student (Israel, Hebrew
speaking). Combines 3D spatial exploration, structure identification, active
recall, repeated practice and progress tracking. Closer to Complete Anatomy than
a Three.js demo, but **not** a Complete Anatomy clone.

Core loop: explore a 3D model → click structures to identify → search → hide /
isolate structures and systems → study regions → quiz → track weak structures →
(later) import a lecture/syllabus to create a study scope.

## 2. Modular 3D assets (critical)

The app must work with (A) a real anatomical GLB, (B) a small demo GLB of named
meshes, or (C) placeholder meshes. The dataset must be replaceable without
rewriting the viewer, quiz engine, UI or progress system. Never block
development on a perfect model.

## 3. Stack

Next.js (App Router) · React · strict TypeScript · Three.js · @react-three/fiber
· @react-three/drei · Zustand · Tailwind CSS · Lucide icons (shadcn/ui where
useful). Current stable versions, no alpha/beta. GLB/glTF 2.0 runtime format.
Vercel-deployable. No backend in Phase 1. Persist progress in
localStorage/IndexedDB behind a repository interface so Supabase/Postgres can
replace it later.

## 4. Code quality

Typed interfaces, separation of concerns, small focused components, predictable
state, ESLint, formatting, behavioural tests, descriptive names. Avoid giant
components, duplicated state, prop drilling, magic strings, `any`, unnecessary
abstractions, giant Zustand stores. Comment unusual 3D/math only.

## 5. Directory structure

Roughly: `src/app` (routes), `src/components/{anatomy,quiz,study,progress,ui}`,
`src/store`, `src/lib/{anatomy,quiz,progress}`, `src/data/anatomy`,
`src/types`, `public/models`, `scripts/anatomy`. Deviations are explained in
`docs/DECISIONS.md`.

## 6. Core data model

Normalized `AnatomicalStructure`: id, names, aliases, system, region, side,
meshNames, parentId, description, clinicalNote, function, origin, insertion,
innervation, bloodSupply, tags, source/license/attribution. Fields optional
where they don't apply (arteries have no origin/insertion). Must be
extensible. Systems: skeletal, muscular, nervous, cardiovascular, respiratory,
digestive, urinary, reproductive, lymphatic, endocrine, integumentary, other.
Regions: head, neck, thorax, abdomen, pelvis, back, upper-limb, lower-limb,
whole-body, other.

## 7. Model adapter (critical)

The app never depends on raw GLB node names. `GLB → ModelAdapter → structure
IDs → app`. `Biceps_Brachii_L.001` becomes `biceps-brachii-left`.

```ts
interface AnatomyModelAdapter {
  getStructures(): AnatomicalStructure[];
  getStructureForMesh(meshName: string): AnatomicalStructure | undefined;
  getMeshesForStructure(structureId: string): string[];
}
```

## 8. 3D viewer

Full-screen. Drag = orbit, scroll/pinch = zoom, right-drag/two-finger = pan,
double-click = focus, click blank = deselect. Desktop first, good on iPad
landscape, reasonable on phones. Neutral realistic lighting, light shadows.

## 9. Structure interaction

Hover: subtle highlight + pointer cursor, never permanently alters material.
Select: visible highlight, original material preserved, info panel populated,
stays selected while orbiting. No per-frame material creation; dispose cloned
materials.

## 10. Camera focus

Bounding box → center → distance from bounding sphere → smooth animation of
target and camera with padding. Never teleport. Premium feel.

## 11–13. Hide / isolate / systems

Hide selected (`hiddenStructureIds: Set<string>`), "Show all". Isolate selected
(others ghosted at low opacity), "Exit isolate". Non-destructive. Systems panel
with toggles per system; nested groups later.

## 14. Search

Instant fuzzy search ("biceps" → biceps brachii L/R, biceps femoris…).
Selecting a result: ensure system visible → unhide → select → focus → open info.
`/` focuses search, `Esc` closes/deselects.

## 15. Info panel

Name, system, region, function, origin, insertion, innervation, blood supply.
Actions: Focus, Isolate, Hide, Study this. **Never invent medical data** — absent
beats hallucinated.

## 16. UI

Modern, premium, medical, minimal, slightly futuristic, serious. Dark neutral
around the viewer. Desktop: systems panel (start side), viewer centre, info panel
(end side), top bar (logo, search, Explore/Quiz/Progress), small bottom toolbar.
Tablet/phone: drawers/sheets; the model stays the focus.

## 17. Explore mode — default. Rotate, inspect, select, search, hide, isolate, filter.

## 18–19. Quiz mode (most important learning feature)

A — **Find the structure**: "Find the radial nerve", click in 3D; correct →
success feedback, highlight, score, next; incorrect → feedback naming the wrong
structure, retry; "Show answer" only after several misses.
B — **Identify**: highlight a structure, multiple choice (plausible distractors).
Free text later.

## 20. Question generation — from a study scope (`{id, name, structureIds}`);

never ask about structures not in the loaded model, not selectable, or outside scope.

## 21. Quiz session state — explicit `QuizAttempt` / `QuizSession` types; engine

independent of React and unit tested.

## 22. Results — score, %, avg response time, structures to review; Review

mistakes / Quiz again / Return to explore.

## 23–25. Progress & review

Per-structure `StructureProgress` (seen, correct, incorrect, streaks, last
reviewed, confidence, next review). Progress screen: mastery, learned,
accuracy, weakest, recent, due. Clicking opens in viewer. Simple, transparent,
replaceable, unit-tested review scheduler (wrong → soon, struggled → moderate,
correct → later, repeated correct → growing interval).

## 26–27. Study scopes

Home: "What are you studying?" (Upper limb, Lower limb, Thorax, Abdomen,
Pelvis, Head & neck, Neuroanatomy, Whole body) driven by metadata. Custom
study lists ("Exam 1 — Upper Limb") persisted locally → Explore these / Quiz me.

## 28. Future: lecture import

PDF/slides/syllabus/text → candidate terms → resolved against the registry.
AI never invents structures; unmatched candidates are discarded or reviewed.
(Lectures will likely be Hebrew — match against all languages.)

## 29–30. Asset pipeline

`npm run anatomy:inspect <file.glb>` lists meshes, vertices, triangles,
materials, textures, file size, unnamed and duplicate names. Mesh→structure
mapping lives in data files, never in rendering code.

## 31. Z-Anatomy / BodyParts3D

Investigate. Before bundling any third-party asset: exact source, exact license,
ShareAlike, non-commercial restrictions, attribution → `THIRD_PARTY_ASSETS.md`.
Unclear license → don't bundle; document how to obtain it. App always works
with the demo model.

## 32. Performance

Smooth on a modern laptop and iPad-class device. Consider Draco/meshopt,
texture compression, lazy loading, splitting by system/region, sensible DPR,
avoiding React re-renders, no duplicated geometry, caching. Measure first.

## 33–34. Loading & errors

"Loading anatomy… 82%" progress; failure → message + Retry (+ load demo in dev).
Error boundaries so a broken canvas doesn't kill the app; WebGL-unavailable
fallback.

## 35–37. Responsiveness, accessibility, shortcuts

Priority: desktop → iPad landscape → tablet portrait → phone. Large touch
targets. Semantic buttons, ARIA, keyboard nav, focus rings, contrast,
reduced-motion camera, never rely on red/green alone. Shortcuts: `/` search,
`Esc` close/deselect, `F` focus, `I` isolate, `H` hide, `R` reset camera,
`Q` quiz; help panel; never fire while typing.

## 38–39. Demo model & metadata

Separately named placeholder meshes (`demo_humerus_left`, …), clearly labelled
"Development demo model — not anatomically accurate". 10–20 structures with
limited, accurate metadata.

## 40–41. Home & first run

Dashboard (continue studying, quick study scopes, recent progress) or a welcome
screen on first launch; 3–4 step skippable tutorial, persisted.

## 42. Design details

No heavy gradients, no neon, no giant rounded cards everywhere. Hierarchy:
anatomy imagery → structure name → educational info → secondary controls.
150–300 ms UI transitions, slightly longer camera moves.

## 43. Medical safety

Educational only, no diagnosis or treatment. Unobtrusive disclaimer: "For
educational purposes. Anatomy content should be verified against your
institution's required resources."

## 44. Testing

Unit: registry lookup, mesh→structure mapping, question generation, scoring,
progress updates, review scheduling, scope filtering. One E2E flow if practical
(load viewer → choose structure → quiz → answer → progress updates). Test
behaviour, not implementation.

## 45. MVP v0 acceptance criteria

1 open app · 2 see 3D model · 3 rotate/zoom/pan · 4 click a mesh · 5 see its
name · 6 search · 7 focus on result · 8 hide · 9 isolate · 10 toggle systems ·
11 start quiz · 12 "Find the X" · 13 click · 14 told right/wrong · 15 complete
10 questions · 16 see results · 17 refresh · 18 progress retained.
Plus (§53): UI renders correctly in Hebrew RTL; Hebrew search finds structures.

## 46. Not yet

Auth, payments, social, university accounts, professor dashboards,
multiplayer, AR/VR, native apps, CT/MRI/DICOM, cadaver imagery, AI tutor,
elaborate backend, subscriptions, analytics. Leave room, don't build.

## 47. Roadmap

2 real model · 3 better metadata · 4 custom study sets · 5 lecture PDF →
study set · 6 better spaced repetition · 7 cross-sections · 8 CT/MRI ·
9 AI tutor · 10 cloud accounts & sync.

## 48. Implementation phases

0 skeleton · 1 viewer · 2 selection · 3 metadata & search · 4 hide/isolate/
systems · 5 quiz engine · 6 progress persistence · 7 UI polish · 8 real model
adapter. After each phase: typecheck, lint, tests — no known errors left behind.

## 49–50. Working style

Make reasonable decisions without asking; ask only for architecture-changing,
paid, licensing-unclear, credential or data-destroying decisions. Never claim
something works without running it. Phase reports: Implemented / Verified /
Known limitations / Next.

## 53. Language & localization (added)

- The student studies in Israel. **UI language: Hebrew (RTL) by default**, with
  an English (LTR) toggle.
- Structure names are stored per term language: `en` (required), `la`, `he`.
  Each term carries a `verified` flag. Hebrew anatomical terms are never
  invented as fact: unverified terms are visibly marked, and the English term is
  always shown alongside.
- Which term is primary is a **user setting** (default: English primary,
  Hebrew secondary — Israeli anatomy teaching relies heavily on
  English/Latin terminology; changeable once the course starts).
- Search is language-aware: Hebrew final letters, niqqud, geresh/gershayim,
  hyphens and case are normalized; aliases per language.
- Quiz prompts follow the term preference; a translation drill
  (Hebrew ↔ English/Latin) is a planned quiz type.
- Layout uses logical CSS properties (`ms-`, `start-`, …) so it mirrors
  correctly; mixed-direction strings are isolated (`<bdi>` / `dir="auto"`).
- Reference for verifying Hebrew terms: Academy of the Hebrew Language
  anatomy dictionaries (terms.hebrew-academy.org.il) and the student's own
  course materials.
- Devices: iPad and laptop.
