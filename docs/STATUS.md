# Project status — START HERE

> Living document. **Update it with every commit that changes the code, not
> just at the end of a session** — it must always match the code as it is.
> Last updated: 2026-10-08 (rename to Or's Anatomy, app icon, Miriam Libre titles, phone zoom/nav fix).

## Orientation (read in this order)

1. This file — where we are, what the user decided, what's next.
2. `docs/CONTRIBUTING.md` — conventions, lint rules, definition of done.
3. `docs/DESIGN.md` — visual direction and tokens. **Read before any UI change.**
4. `docs/ARCHITECTURE.md` — layers, boundaries, data flow, recipes.
5. `docs/SPEC.md` — the original product brief (§-numbered). DESIGN.md
   supersedes its visual sections.
6. `docs/DECISIONS.md` — why things are the way they are.
7. As needed: `docs/DEPLOYMENT.md`, `docs/CONTENT_REVIEW.md`,
   `THIRD_PARTY_ASSETS.md`, `scripts/anatomy/z-anatomy/README.md`,
   `docs/COURSE_SOURCE.md` (her course site: what was extracted, what may be
   committed), `docs/MODEL_SOURCES.md` (open 3D models to fill model gaps).

Project skills in `.claude/skills/` (`anatomy-workflow`, `anatomy-ui-style`,
`frontend-design`) load automatically in Claude Code and encode the same rules.

Verify a fresh checkout (exactly what CI runs, plus e2e):

```bash
npm ci
npm run verify                 # format check, typegen+tsc, lint, tests, data validation, build
npx next start -p 3100         # in the background (after verify, which builds)
npm run e2e:smoke              # real-browser explore + quiz flows, writes docs/screenshots/
```

Expected today: **211 unit/component tests, 42 e2e checks, all passing; CI green.**

## User decisions & preferences (do not re-ask)

| Date       | Decision                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2026-10-08 | **More quizzes from her summary** (user): quiz from her own descriptions (find or choose the name), her distinctions, and her summary's sections as scopes.                                                                                                                                                                                                                                                                    |
| 2026-10-04 | App is for the user's girlfriend, a medical student in **Israel**; the course hasn't started yet.                                                                                                                                                                                                                                                                                                                              |
| 2026-10-04 | **UI in Hebrew (RTL)** by default, English available. Term display defaults to **English primary, Hebrew secondary** (Latin also shown) — changeable in settings once her course's terminology is known.                                                                                                                                                                                                                       |
| 2026-10-04 | Devices: **iPad and laptop**. No personalisation/name in the UI.                                                                                                                                                                                                                                                                                                                                                               |
| 2026-10-04 | Quality bar: clean code, best practices, tests and linting; document thoroughly for future sessions.                                                                                                                                                                                                                                                                                                                           |
| 2026-10-05 | Real model: **Z-Anatomy approved; CC BY-SA licence accepted.** Upper limb first.                                                                                                                                                                                                                                                                                                                                               |
| 2026-10-05 | **Lower limb / other regions deferred** — "we will add everything later". Legs show bones only for now.                                                                                                                                                                                                                                                                                                                        |
| 2026-10-05 | **Redesign requested**: the first UI looked "blocky and AI-made". New direction in `docs/DESIGN.md` (light atlas style). Design plugins (`frontend-design`, `design-skills`) were suggested for install; `frontend-design` is vendored in `.claude/skills/`.                                                                                                                                                                   |
| 2026-10-05 | Next: **deploy the first version to Vercel** (user does the Vercel side — see `docs/DEPLOYMENT.md`).                                                                                                                                                                                                                                                                                                                           |
| 2026-10-05 | Next features chosen by the user: **muscle parts**, then **origins & insertions**.                                                                                                                                                                                                                                                                                                                                             |
| 2026-10-05 | **Whole body next**: add all remaining body parts. More quizzes, Hebrew names and study tools wait until the user has her course's study sources.                                                                                                                                                                                                                                                                              |
| 2026-10-06 | **Male/female switch: built as option 1** ("Male/female switch (Recommended)"): one body, a setting swaps the male reproductive organs for the Human Reference Atlas's female organs; skeleton stays male.                                                                                                                                                                                                                     |
| 2026-10-05 | Wants to **switch between a male and a female model** — **deferred** ("document the options, future addition"); built 2026-10-06 (row above). Options and research: `docs/DECISIONS.md` → "Male/female model switch".                                                                                                                                                                                                          |
| 2026-10-05 | Whole body merged (PR #4). Next: **select whole organs** (brain parts, lungs, heart… as wholes).                                                                                                                                                                                                                                                                                                                               |
| 2026-10-05 | **Peeling: tap to peel only.** The automatic peel button removed too much at once ("everything disappears"); the user chose a peel mode where each tap removes one structure.                                                                                                                                                                                                                                                  |
| 2026-10-05 | **Study source: https://medintzfat.com** (her course site, Bar-Ilan Tzfat; anatomy section `/anatomy/` — labs `lab1`…`lab9`, lectures `class*`, `lower-limb-part1`; public pages). Use it for Hebrew names, quizzes and study tools. Needs `medintzfat.com` in the cloud environment's allowed domains (blocked in session 2).                                                                                                 |
| 2026-10-05 | **Docs must be kept updated continuously** as work happens (every commit), not at the end of a session. Enforced by the docs-gate hook.                                                                                                                                                                                                                                                                                        |
| 2026-10-05 | **Deployed** by the user on Vercel: production URL **https://ors-anatomy.vercel.app** (production branch `main`).                                                                                                                                                                                                                                                                                                              |
| 2026-10-05 | Course-site notes can't be copied or reworded (site terms); the user shared **her own summary** (Word, her own words) to use for **descriptions and names**. Her text is shown verbatim; her Hebrew names win over the site's.                                                                                                                                                                                                 |
| 2026-10-07 | Priority 2 reviewed: **merge to `main`**, then **priority 3**, then **priority 4** (the kidney).                                                                                                                                                                                                                                                                                                                               |
| 2026-10-08 | Priority 3 reviewed (and the clearance-check fix that moved the ansa and left phrenic nerve): **merge to `main`**, then **priority 4** (the kidney).                                                                                                                                                                                                                                                                           |
| 2026-10-08 | Rename, icon, Miriam Libre titles and phone fixes: **merge everything to `main`**.                                                                                                                                                                                                                                                                                                                                             |
| 2026-10-08 | **Title font: Miriam Libre** (picked from the home page in nine fonts) for names, titles and the wordmark, Hebrew and English; she didn't like the serif Hebrew fonts.                                                                                                                                                                                                                                                         |
| 2026-10-08 | **App renamed "Or's Anatomy"** (Hebrew "האנטומיה של אור") — supersedes "no name in the UI" (2026-10-04) for the app name. Wants **a logo for the phone home screen**, a **Hebrew title font less like "David"** (Frank Ruhl's Hebrew), and the **phone fixed**: the page zoomed in and the nav buttons disappeared. She uses the app on her **phone** too, not only iPad/laptop.                                               |
| 2026-10-08 | Priority 4 reviewed (the Atlas kidney): **merge to `main`**. The scrotum's boxy shape is fine as it is — **don't reshape it** (asked after seeing it on her phone).                                                                                                                                                                                                                                                            |
| 2026-10-07 | **Replace the non-commercial kidney** with the Human Reference Atlas male kidney (CC BY 4.0), as **priority 4** (last) of `docs/HANDMADE_MODELS_PROMPT.md`, for the priority-2 session to do after priority 3. The inner ear stays non-commercial for now. Drag fix: **merge to `main`**.                                                                                                                                      |
| 2026-10-07 | Priority 2: **female external genitalia built to the bones** (clitoris under the symphysis, crura on the rami, bulbs and glands at the existing vaginal opening; a ≈ 70 mm vestibule accepted rather than re-fitting the Atlas organs); **infra-orbital nerve and nerve to vastus medialis split out** of Z-Anatomy's maxillary and femoral nerve meshes into their own structures (scripted step on the shipped nerves file). |
| 2026-10-07 | Priority 1 reviewed from the screenshots: **merge to `main`**, then **start priority 2** (items 12+ of `docs/HANDMADE_MODELS_PROMPT.md`).                                                                                                                                                                                                                                                                                      |
| 2026-10-07 | Hand-built structures: **priority 1 only** (items 1–11 of `docs/HANDMADE_MODELS_PROMPT.md`) first; **screenshots of each structure** to the user; **don't merge to `main` until the user says so**.                                                                                                                                                                                                                            |
| 2026-10-06 | Plan for the model: after BodyParts3D, merge to `main`, then a **full audit** (placement, duplicates, bugs, mismatches) with fixes, then **hand-build the last missing pieces** with another AI, from a prompt written here (`docs/HANDMADE_MODELS_PROMPT.md`).                                                                                                                                                                |
| 2026-10-06 | **Non-commercial (NC) models allowed** — the app will not be used commercially. Z-Anatomy's inner ear and kidney added first; NC models live in their own file behind one switch, with a "Going commercial" checklist (`THIRD_PARTY_ASSETS.md`) so going commercial stays easy.                                                                                                                                                |
| 2026-10-06 | **Fill model gaps from open 3D models**, starting with **Open3DModel** (CC BY-SA, same body as Z-Anatomy) — "Ok start". Others (Human Reference Atlas, BodyParts3D) in `docs/MODEL_SOURCES.md` order.                                                                                                                                                                                                                          |
| 2026-10-05 | **Structure names exactly as her course site writes them** ("that is what they are actually learning"). English and Hebrew names come from medintzfat.com; model names stay searchable. See `docs/COURSE_SOURCE.md` → "Course names".                                                                                                                                                                                          |

## Phase tracker (§48)

| Phase | Scope                                         | State                                                                                   |
| ----- | --------------------------------------------- | --------------------------------------------------------------------------------------- |
| 0     | Project skeleton, tooling, CI                 | ✅ done (CI fixed 2026-10-05: typecheck now runs `next typegen` first)                  |
| 1     | Functional 3D viewer                          | ✅ done                                                                                 |
| 2     | Structure selection                           | ✅ done                                                                                 |
| 3     | Metadata & search (he/en/la)                  | ✅ done                                                                                 |
| 4     | Hide / isolate / system visibility            | ✅ done                                                                                 |
| 5     | Quiz engine + quiz UI (find, identify, mixed) | ✅ done                                                                                 |
| 6     | Progress persistence + progress page          | ✅ done                                                                                 |
| 7     | UI polish                                     | 🚧 redesign done (`docs/DESIGN.md`); polish continues                                   |
| 8     | Real model (Z-Anatomy)                        | ✅ whole body (2026-10-05), five streamed model files + Open3DModel extras (2026-10-06) |

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
  endocrine, lymphoid), plus a sixth file
  `public/models/open3dmodel/extras.glb`: 206 meshes from **Open3DModel**
  (AnatomyTOOL, CC BY-SA, built on Z-Anatomy) that Z-Anatomy lacks —
  brachial plexus cords, roots of the median nerve, lumbar/sacral plexus,
  lumbosacral trunk, L1–S5 anterior rami, inferior gluteal nerve, psoas
  minor, articularis genus, palmaris brevis, pes anserinus, small limb
  arteries/veins/nerves and hand/foot ligaments (right-only upper-limb pieces
  mirrored to the left), and a seventh,
  `public/models/non-commercial/non-commercial.glb`: Z-Anatomy's inner ear
  (cochlea, vestibule), 4 meshes under a **non-commercial** licence, behind
  `INCLUDE_NON_COMMERCIAL` (`THIRD_PARTY_ASSETS.md` → "Going commercial").
  The kidneys are the **Human Reference Atlas**'s (male, CC BY 4.0, both
  bodies; `public/models/hra/kidney.glb`, 20 meshes: capsule, cortex,
  columns, pyramids, papillae, hilum, minor/major calyces, renal pelvis per
  side, and the renal veins' hilar ends — `scripts/anatomy/hra/README.md`),
  since 2026-10-08; Z-Anatomy's NC kidney is gone.
  An eighth file, `public/models/hra/female.glb`, holds the female organs
  (female body only, below); a ninth, `public/models/bodyparts3d/extras.glb`,
  23 small pieces from **BodyParts3D** (CC BY-SA 2.1 JP): small/anterior
  cardiac veins, right gastric, dorsal pancreatic, superior
  pancreaticoduodenal and gastro-omental arteries, gastric veins, a bronchial
  artery, frontal/lacrimal/supra-orbital nerves, levator veli palatini,
  semispinalis capitis, dorsal scapular arteries. Z-Anatomy's "Sigmoid
  colon" mesh is shown as the **Rectum** (it is; DECISIONS). A tenth file,
  `public/models/handmade/handmade.glb`, holds **hand-built** schematic
  structures no open model has (`scripts/anatomy/handmade/`, priorities 1
  and 2 of `docs/HANDMADE_MODELS_PROMPT.md`): phrenic, recurrent and
  superior laryngeal nerves, ansa cervicalis, the cervical plexus's
  cutaneous branches, superior thyroid/laryngeal, cystic and short gastric
  arteries, thoracic duct and cisterna chyli, perineal body and muscles
  (male and female versions), anal canal and internal anal sphincter;
  pericardiacophrenic vessels, subcostal and suboccipital nerves, lingual,
  posterior auricular and greater pancreatic arteries, male bulbourethral
  glands and cremaster, the female urethra and external genitalia. The
  infra-orbital nerve and the nerve to vastus medialis are cut out of
  Z-Anatomy's maxillary and femoral nerves (`split-meshes.ts`). Male body:
  2,968 mapped meshes → 3,042 structures (2,608 wholes); female body: 3,008
  mapped meshes → 3,090 structures (2,612 wholes) (counted with
  `datasetForSex`, 2026-10-07); ≈3.7M triangles, 20 MB in all (the
  hand-built file: 85 meshes, 0.40 MB); the
  skeleton loads first and frames the camera, the rest streams in
  ("Loading body systems n/9", n/10 in the female body). Credits: full on
  the home page, source names in the viewer. Left out: coverings (fasciae, meninges, pleura, greater omentum), liver segments.
  Pipelines: `scripts/anatomy/z-anatomy/README.md`,
  `scripts/anatomy/open3dmodel/README.md`. Placeholder demo model kept for
  tests.
- **Routes:** `/` contents-page home (regions list, start quiz, "N due for
  review"), `/explore` (`?region=<region>`, `?structure=<id>`), `/quiz`
  (`?scope=<id>`: `due`, `region:upper-limb`, `system:nervous`, …),
  `/progress`.
- **Names:** structures are named as her course site names them — 597 of
  1,687 with the course's English name, 71 with its Hebrew
  (`z-anatomy/courseNames.json`, generated by
  `scripts/course/medintzfat/course_names.py`); others keep Z-Anatomy names;
  replaced names stay searchable. `docs/COURSE_SOURCE.md` → "Course names".
- **Study notes:** her own anatomy summary → Hebrew notes for 827
  structures ("סיכום" at the top of the info panel; 14 of her 1,119 entries
  name nothing in the model: general terms — skin, tendon, ligament, bursa,
  bone marrow, cartilage, synovial membrane, retinacula, reference lines —
  the peritoneum, extraperitoneal fat, periorbita and the auricle) and 53 of
  her Hebrew names; notes about one body only (her male urethra segments,
  the pouches) show in that body only (`z-anatomy/summaryNotes.json`, from
  `scripts/course/summary/summary_notes.py`; the .docx is not in git).
- **Male/female body:** settings → Body switches between the male model
  and the same body with female organs from the **Human Reference Atlas**
  (HuBMAP, CC BY 4.0; `public/models/hra/female.glb`, 51 meshes, 1.1 MB,
  loaded only in the female body): uterus (fundus, body, lower segment,
  cervix, internal/external os, cornua), vagina, ovaries, uterine tubes
  (ampulla, isthmus, infundibulum, fimbriae), round/ovarian/suspensory/
  cardinal/uterosacral ligaments, the female bladder (trigone, ureteric
  orifices, neck) and breasts (nipple, areola, lobes, ducts, sinuses,
  Cooper's ligaments, fat). The male organs, testicular/penile vessels and
  male urethra are hidden in it. Fitted by ICP to our pelvis (median 4 mm),
  breasts placed on the chest (`scripts/anatomy/hra/README.md`).
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
  muscles attached to it; from Z-Anatomy patches — 681 for the whole body,
  lazy-loaded 1.9 MB model; unverified, 28 muscles shown as "not confirmed"
  — see CONTENT_REVIEW),
  shortcuts
  (`/ Esc F I H R P ⇧P Q ?`).
- **Quiz:** find (click in 3D; muscles auto-hidden for non-muscle targets,
  and bones too for organs/brain/heart;
  peel mode in find questions to clear what covers the target — a tap then
  peels instead of answering; peels reset per question and when the answer
  is revealed),
  identify (multiple choice, plausible core distractors), mixed, and **from
  her summary** (her own description of a structure, names masked: find it
  in the model — either side counts — or choose its name from four, no
  side shown; 480 structures/pairs have a usable description, plus her 13
  distinctions with their pair as the options); scopes by region / system /
  due / review mistakes and **her summary's sections** (her headings, in
  her order; supplements joined to their section; her distinctions first;
  listed right after the whole body in summary mode); built-in scopes skip
  `detail` structures (small branches), her sections keep them.
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
4. ~~Read her course site~~ — done (session 3): syllabus, per-lab structure
   lists (863-row semester-B checklist with past-exam ★, labs 1–2 from the
   lab pages), 815 Hebrew↔English term candidates and suggested structure
   ids are in `data/course/medintzfat/`; the 586 practice questions and page
   text are extracted **locally only** (`.course-cache/`, git-ignored)
   because the site's terms forbid copying. See `docs/COURSE_SOURCE.md`.
   4a. **Ask the user** how to use the questions: permission from the site
   (contact@dorpascal.com), link out to the site's quizzes, or write our own
   from the structure lists.
   4b. **Lab study lists in the app** — "Lab 7" / "past-exam structures"
   quiz scopes and explore lists from `lab-structures.json`; first review the
   suggested `structureId`s (299/863 matched) and map the rest by hand.
   4d. **Her summary** — done: notes + Hebrew names + quizzes from her
   descriptions, her distinctions and her sections (2026-10-08; merged to
   `main`, user's go). Unused: her
   ten open self-review questions (pathways — no auto-gradable answer in her
   text); 163 entries have
   no place in the model (female organs, layers, spaces, nerves/vessels no
   source has).
   4e. **Fill model gaps** (`docs/MODEL_SOURCES.md`): **Open3DModel done**
   (206 meshes, limbs + lumbosacral plexus); **Z-Anatomy's NC inner ear
   done** (user allowed NC; its NC kidney was replaced by the Atlas's,
   2026-10-08); **female organs done** (Human Reference
   Atlas, female body); **BodyParts3D pieces done** (23 small pieces; its
   rectum showed Z-Anatomy's "Sigmoid colon" is the rectum). The other NC
   sources were checked and none fills a gap (`docs/MODEL_SOURCES.md` →
   "Non-commercial sources"). **Hand-built structures, priority 1 done
   and merged to `main`** (2026-10-07, user's go after the screenshots):
   items 1–11 of `docs/HANDMADE_MODELS_PROMPT.md`; review fixes (right
   recurrent laryngeal hook, anal canal junction) on the priority-2 branch.
   **Priority 2 done and merged to `main`** (items 12–21; user's go,
   2026-10-07). **Priority 3 done and merged to `main`** (items 22–24;
   user's go, 2026-10-08). **Priority 4 done and merged to `main`** (item
   25: the Human Reference Atlas kidney replaces the NC kidney; user's go,
   2026-10-08). All four priorities of the brief are done.
   Reviewed after the merge (2026-10-08, below); her notes rerun with her
   .docx and now reach the new structures; the review's fixes merged to
   `main` (user's go, 2026-10-08). Then: her check of the courses
   (CONTENT_REVIEW → "Hand-built structures"). NC models go into the
   non-commercial file only. Open3DModel's
   retinacula, tendon sheaths and spaces (femoral/adductor canal) were left
   out as coverings — could come back as a toggleable layer. Phrenic nerve,
   cervical plexus, laryngeal nerves, thoracic duct have no open source yet.
   4c. ~~Names as the course writes them~~ — done (user decision): English
   for 581 structures, Hebrew for 71 (the course mostly uses English). Next:
   her review of the Hebrew table in CONTENT_REVIEW; add synonyms for any
   structure she finds still named differently (`synonyms.json`).
5. ~~Muscle heads as sub-structures~~ — done (52 parts); quizzing on parts
   is a possible follow-up.
   5b. ~~Male/female switch~~ — done (option 1, settings → Body). Possible
   follow-ups: female urethra, external genitalia (vulva, clitoris — no open
   model found), uterine/ovarian vessels (the Atlas has uterine vasculature),
   female pelvis bones (option 2).
6. When the user has her study sources: more quiz types (origins/insertions,
   parts), custom study lists (§27), progress export/import, first-run tutorial,
   ~~origins/insertions mode~~ (done; verify kinds + Hebrew terms per
   CONTENT_REVIEW).

## Known issues / limitations

- All medical terms are `verified: false`. Names follow her course site
  where it names the structure; ~990 structures the course never names keep
  Z-Anatomy English. Only 71 structures show Hebrew, because the course
  mostly uses English names (validator warnings, expected).
- Course names a paired structure by side ("Right coronary artery") → shown
  as "Coronary artery (right)"; the course form is a search alias. Course
  names that fit two structures ("Abductor digiti minimi", hand/foot) keep
  the model's names.
- Origins/insertions: source gaps — 7 muscles have no patches (e.g.
  palmaris longus, lumbricals, flexor carpi radialis); pronator quadratus and
  the short head of biceps have patches on the right side only; some
  muscles' origins are missing (rhomboids, deltoid parts' insertion is on the
  whole muscle). 7 patches carried the wrong side suffix and are placed by
  position instead.
- Organ wholes are one level deep (a gyrus belongs to its lobe; there is no
  "cerebral hemisphere" or "brain" whole); deep brain nuclei outside a lobe
  group stay on their own; a whole with a single part (insula) exists.
- Whole body: the source is a **male** model. The female body adds the
  Human Reference Atlas's female organs to it, but the skeleton, pelvis and
  muscles stay male; no female urethra, vulva/clitoris, perineal muscles or
  uterine/ovarian vessels; the peritoneal folds (broad ligament, pouches)
  are left out like other coverings (her notes on them go to the uterus);
  the inner ear is **non-commercial** (CC BY-NC-SA): the app must stay
  free and ad-free while it's in
  (`THIRD_PARTY_ASSETS.md` → "Going commercial"); pleura, greater
  omentum, meninges and fasciae left out so they don't hide everything; the
  liver is one mesh (segments omitted). Regions for organs and midline
  structures come from their height against skeletal landmarks (navigation
  aid).
- Not in any open model, so **built by hand** (2026-10-07, priority 1):
  phrenic, recurrent/superior laryngeal and cervical plexus nerves, ansa,
  superior thyroid/laryngeal, cystic, short gastric arteries, thoracic duct,
  perineal muscles, anal canal. They are **schematic** and fitted into a
  crowded model: where it leaves no room they lie against neighbours or sink
  a few mm into soft organs (listed per structure in
  `scripts/anatomy/handmade/README.md`); the cisterna chyli and anal canal
  are smaller than textbook size for the same reason. Priority 2 (merged)
  added items 12–21; the infra-orbital nerve and the nerve to vastus
  medialis turned out to be inside Z-Anatomy's maxillary and femoral nerve
  meshes and are now split out of them (`split-meshes.ts`). Priority 3
  (tensor tympani, stapedius, subcostal muscles, scrotum and its septum)
  is merged (2026-10-08); the tensor tympani hooks
  forward round the cochlea (≈ 40 mm belly, textbook ≈ 20 mm) because the
  model's auditory tube stops 10 mm short of the middle ear
  (`docs/DECISIONS.md`). Until priority 3 the clearance check missed
  points inside meshes with inverted or unreliable normals (≈ 1,700 of
  2,957): the left phrenic nerve and the ansa's superior roots shipped
  passing through neighbours; fixed and every structure rebuilt
  (`docs/DECISIONS.md` → "Clearance check"). Her summary notes reach the priority-1
  structures (rerun 2026-10-07 with her .docx: +21 entries — phrenic,
  laryngeal and cervical plexus nerves, ansa, thoracic duct, superior
  thyroid/laryngeal, cystic and short gastric arteries, perineal muscles,
  anal canal; Hebrew "תעלה אנאלית"); the priority-2 ones wait for the next
  rerun (synonyms/parents for her terms are in place).
  Audit (`scripts/anatomy/handmade/audit_handmade.py`): sides, regions and
  duplicates clean; the supraclavicular nerves' middle part (≈ 11 %) runs
  10–23 mm from the nearest mesh, in the roof of the posterior triangle,
  where the model has no skin or investing fascia to lie under; likewise the
  mons pubis (up to 16 mm in front of the pubis' muscles — a fat pad with
  no fat modelled) and the labia majora's lowest edges.
- `shapes.smooth(..., fixed=0)` smooths nothing (`Q[-0:]` resets the whole
  array): the relaxation's displacement smoothing and `fit_radius`'s
  radius smoothing are no-ops. Left as is so the reviewed courses don't
  move; fix it together with a full rebuild and review.
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
- **2026-10-05 · session 2 (cont.)** — Tap to peel merged to `main` via
  PR #6.
- **2026-10-05 · session 3** — Read her course site (medintzfat.com, now
  reachable): `scripts/course/medintzfat/extract.py` → syllabus, lab
  structure lists with past-exam marks, Hebrew term candidates and suggested
  structure ids (`data/course/medintzfat/`); questions and page text kept
  local (site terms forbid copying; repo is public). `docs/COURSE_SOURCE.md`.
- **2026-10-05 · session 3 (cont.)** — User: names exactly as on her course
  site. `course_names.py` matches model structures to course wordings
  (normalised spelling/abbreviations, synonyms, checklist wording first) →
  `courseNames.json`, applied by `withCourseName` (175 English names
  changed, 71 Hebrew names, earlier Hebrew kept as aliases).
- **2026-10-05 · session 3 (cont.)** — Course-site notes can't be reworded
  (terms); the user shared her own summary instead. `summary_notes.py` →
  `summaryNotes.json`; `withSummaryNotes` + `StructureNotes` ("סיכום" in the
  info panel); hand/foot resolved by her summary's region.
- **2026-10-06 · session 3 (cont.)** — User asked why so many summary
  entries didn't fit: reviewed all of them, added ~45 hand-checked synonyms
  (heart chambers, cranial nerves by short name, pituitary → hypophysis,
  eye → eyeball, …) → notes for 511 structures, 40 Hebrew names; the other
  592 are landmarks, layers, organ parts and structures the model lacks
  (COURSE_SOURCE → "Her summary").
- **2026-10-06 · session 3 (cont.)** — User: (1) put notes on a part onto
  the whole, (2) add missing nerves/vessels if the source has them.
  (1) `parents.json` (407 hand-assigned entries: landmark → bone, organ part
  → organ, region → its contents) → notes on 717 structures, 183 left.
  (2) The source lacks the phrenic nerve and most others, but the export's
  covering filter wrongly dropped 5 real structures (tensor fasciae latae,
  middle meningeal artery + accessory branch, meningeal branch of maxillary
  nerve, septum pellucidum): `NOT_COVERINGS` exception, muscles/nerves/
  vessels packs and attachments re-exported (+9 meshes, TFL origin patch).
- **2026-10-06 · session 3 (cont.)** — Pre-merge check (user: "double check
  for any other missed part or bug"): every source object compared with the
  export (only deliberate exclusions left); 21 pelvic veins were in
  **thorax** because Z-Anatomy's "Thorax" collection lists them → region by
  height for such vessels (manifest only; GLBs unchanged); her "Ribs" note
  no longer lands on costal cartilages/rib ligaments; "X major/minor"
  entries reach both muscles; notes on 708 structures. Merged to `main`.
- **2026-10-06 · session 3 (cont.)** — Researched open 3D models for the
  gaps (user request): `docs/MODEL_SOURCES.md` (licences and contents
  checked in the files; Open3DModel verified to share our coordinate frame).
- **2026-10-06 · session 3 (cont.)** — Open3DModel integrated (user: "Ok
  start"): `scripts/anatomy/open3dmodel/export_open3d.py` keeps the
  arteries/veins/nerves/muscles/ligaments of its upper-limb, lower-limb and
  hand files that Z-Anatomy lacks (name, box and place checks + a
  hand-reviewed `renames.json` `sameAs` list), mirrors right-only pieces,
  writes `extras.glb` + `manifest-open3d.json`; `index.ts` builds from both
  manifests, structures carry Open3DModel attribution. Course names and her
  notes re-run: 14 more course names, notes now reach psoas minor, lumbosacral
  trunk, sacral plexus, articularis genus, inferior gluteal nerve and the
  lateral/medial cords (176 entries left); fixed her genicular-artery note
  wrongly reaching the descending/middle genicular arteries.
- **2026-10-06 · session 3 (cont.)** — User: NC models are OK (the app is
  not commercial), "document this so … commercial would be easy".
  `export_glb.py --non-commercial-only` exports Z-Anatomy's inner ear and
  kidney (12 meshes) to `public/models/non-commercial/` + its own manifest;
  `MODEL_SOURCES` (build.ts) holds every source's licence with
  `commercialUse`; `INCLUDE_NON_COMMERCIAL` (index.ts) is the one switch;
  tests check NC meshes stay in their file and the switch removes them.
  Kidney-named structures placed by height (the intrarenal veins were in
  thorax). Credits: the viewer now shows source names (the full line got too
  long), the home page the full credits — now also Dundee's CC BY cranial
  nerves model, which Z-Anatomy includes. Course names: the course's
  "Vestibule" is the vaginal vestibule (`differentStructure` list), "Kidneys"
  no longer counted as singular. Her notes on the kidney, renal pelvis,
  cochlea, vestibule and their parts (cortex, medulla, capsule, canals…);
  Hebrew "כליה" (her singular).
  Going-commercial checklist also notes Z-Anatomy's unlicensed-looking
  "Brainder"/"White matter" (University of Washington) credits.
- **2026-10-06 · session 3 (cont.)** — Open3DModel extras and the
  non-commercial inner ear/kidney merged to `main` (user: "Yes"), so they
  reach production.
- **2026-10-06 · session 3 (cont.)** — Checked every NC source now allowed
  (Dundee, Indiana University, the cervical nerves paper, Open Anatomy):
  none adds anything — already in Z-Anatomy, not downloadable, one fused
  surface, or (cervical nerves) no model file published. Table in
  `docs/MODEL_SOURCES.md`.
- **2026-10-06 · session 3 (cont.)** — Male/female switch (user chose option
  1). `scripts/anatomy/hra/export_hra.py`: Human Reference Atlas female
  organs, ICP-fitted (similarity) from its pelvis to ours, then shifted so
  its bladder sits where ours is (27 mm back: a female pelvis is shallower);
  breasts on the midclavicular line at the 4th intercostal space, back
  surface laid on our chest wall; the overlapping uterine walls and the
  peritoneal folds left out → `female.glb` + `manifest-female.json`. App:
  `sex`/`meshSex`, `MALE_ONLY`, `datasetForSex` in the data provider,
  hidden unmapped meshes, settings → Body (`Segmented`; `SettingsFields`
  split from `SettingsMenu`). Her notes now reach the uterus, cervix, tubes,
  ovaries, vagina, breast, nipple and ligaments (+21 entries, 132 left);
  bladder notes stay on the bladder in both bodies; Hebrew רחם, צוואר הרחם,
  חצוצרה, שחלה, נרתיק, שד (her singulars). e2e: switch to female, uterus
  shown, no prostate.
- **2026-10-06 · session 3 (cont.)** — Male/female switch merged to `main`
  (user: "Yes").
- **2026-10-06 · session 3 (cont.)** — BodyParts3D pieces (user: "continue"):
  `scripts/anatomy/bodyparts3d/export_bp3d.py` fits 23 pieces Z-Anatomy
  lacks (global affine from 607 name-matched anchors, then local ICP,
  0.6–3.3 mm) → `bodyparts3d/extras.glb` + `manifest-bp3d.json`. Its rectum
  overlapped Z-Anatomy's "Sigmoid colon" — which is the rectum (midline,
  pelvic floor to S2–S3; the sigmoid loop is in "Descending colon"):
  relabelled in `build.ts` (`RELABEL`), not duplicated. Her notes: +13
  entries (rectum and its parts, cardiac veins, orbital nerves, gastric and
  pancreatic arteries…), 112 left.
- **2026-10-06 · session 3 (cont.)** — BodyParts3D pieces merged to `main`
  (user: push to main when done, then audit).
- **2026-10-06 · session 3 (cont.)** — **Full audit** (user request, before
  the hand-built pieces), on the shipped GLBs and the final dataset of both
  bodies (`scripts/anatomy/audit-extract.ts` + checks in DECISIONS →
  "Audit"). Fixed: 8 structures without geometry (Z-Anatomy guide lines —
  eyeball axes/equator/meridians, "-curve"/"-path" — and "Mucosa of
  stomach"): the export skips faceless meshes and `anatomy:validate` now
  only counts nodes with a mesh (it accepted empty nodes); the female GLB
  kept the Atlas's nesting (cervix → os…), now flat; left/right swapped on
  the lateral temporomandibular ligament (Z-Anatomy; `SWAPPED_SIDES`) and the
  round ligaments of the uterus (the Atlas); "Right testicular artery.r"
  escaped the male-only list (side written twice; `parseName` fixed) and
  showed in the female body; whole-spine ligaments and rotatores moved from
  neck to back; her rugae note pointed at the removed mucosa. Clean (rechecked after fixing the extractor, which first
  decoded quantized positions twice): no mutual duplicates (≥ 60 % of each
  of two meshes within 1.5 mm of the other — only companions like
  artery/vein pairs, S4/S5 rami and Z-Anatomy's layered eye and spinal-cord
  diagrams), nothing floating, no duplicate display names in either body,
  no other-body structures, course names all genuine matches; the whole
  erector spinae moved from neck to back (`WHOLE_REGION`). Switching body
  with a male-only structure selected closes the panel without errors.
  `scripts/anatomy/decode-glb.ts` writes shipped GLBs uncompressed for
  Blender. **Next (user):** hand-build the last missing structures with
  another AI from `docs/HANDMADE_MODELS_PROMPT.md`.
- **2026-10-06/07 · session 4 (in progress)** — Hand-built structures,
  priority 1 of `docs/HANDMADE_MODELS_PROMPT.md` (user: priority 1 only,
  screenshots of each, no merge to `main` until they say so). Branch
  `claude/handmade-structures`. Work so far: `scripts/anatomy/handmade/`
  (bpy): body cache of the decoded GLBs, landmark queries, clearance
  machinery (per-mesh BVH + generalized winding number, so open and nested
  meshes are handled; relaxation of spline control points; explicit,
  reported allowances where the model leaves no room), geometry (spline,
  parallel-transport tubes). Built and clearance-clean so far: phrenic nerves, recurrent and superior laryngeal nerves, superior thyroid and superior laryngeal arteries, ansa cervicalis, the four cutaneous branches of the cervical plexus, thoracic duct and cisterna chyli, cystic artery, short gastric arteries, perineal body and muscles, anal canal and internal anal sphincter (all 11 items). The first full build (all together) found only ansa ↔ phrenic contacts on scalenus anterior (now allowed as touch, both ways, for both roots and the omohyoid twig; the loop keeps clear; the superior root may touch stylohyoid and stylopharyngeus in its first 14 mm, where it leaves the hypoglossal). Wired into the app: `public/models/handmade/handmade.glb` (0.22 MB) + `manifest-handmade.json`, source `Handmade` (CC BY-SA 4.0), sex variants (`SEX_VARIANT` in `build.ts`); tests for ids, sources, regions and bodies; e2e: the phrenic nerve searchable and selectable in both bodies; course names re-run (42 of the 50 hand-built structures now carry her course's names; the other 8 — both roots and the muscular branches of the ansa, the superficial transverse perineal muscles — sit in combined checklist rows ("Ansa cervicalis (Superior Root & Inferior root)", "Superficial (& deep) transverse perineal m.") that the matcher gives to one structure, so they keep their anatomical names; `extract.py` re-run first, the site reachable: 344/863 checklist rows now matched). `npm run verify` and e2e green. Screenshots of every structure: `e2e/handmade-shots.ts` → `docs/screenshots/handmade/` (front + turned view, each focused with the panel's Focus button; `--missing` retakes only absent shots). The full build's clearance table (length, worst penetration, smallest gap, nearest neighbours, allowed sinking) is kept in `scripts/anatomy/handmade/clearance-report.txt`; a rebuild gave a byte-identical manifest (deterministic). CI green on the integration commit. Audit rerun with `handmade.glb` (`audit_handmade.py`, kept): sides, regions by height and mutual duplicates clean; only finding: the supraclavicular nerves cross the posterior triangle up to 23 mm from any mesh (no skin/fascia modelled there). Test added: the male bulbospongiosus mesh is not in the female body. Review of the shots found the perineum hard to judge in the app (the thighs hide it from below), so `plot_perineum.py` renders it from below in both bodies (`docs/screenshots/handmade/perineum-from-below.png`); that showed the male bulbospongiosus covering only 15 mm of the bulb with a gap to the perineal body and the two ischiocavernosus muscles unequal (29 / 46 mm): the coarse corpus meshes left most 3 mm vertex slabs empty. Sections now come from cutting the triangles (`Body.section`); the bulbospongiosus runs from the perineal body over the bulb (may press ≤ 1 mm into the crura, where they abut it) and the ischiocavernosus muscles are 55 / 57 mm (female 53 / 52 mm). Rebuilt: 52 meshes, 54,560 triangles, everything else unchanged. The review shots end every drag over an overlay: a drag released over the body selects what is under the pointer (an app bug, since fixed on `main`). All 60 review shots retaken that way (JPEG, 14 MB with the sheets; 30 structures × front + turned view; perineal muscles isolated, seen from front-below) and reviewed, plus contact sheets per region in `docs/screenshots/handmade/sheets/` (`contact_sheets.py`). `npm run verify` green (204 tests), `e2e:smoke` green (39 checks) on a fresh build.
- **2026-10-07 · session 4, priority 2 (in progress)** — Priority 1 merged
  to `main` (user's go). Branch `claude/handmade-priority-2`, items 12–21
  of the brief. Built and clearance-clean so far (`--only` runs; not yet in
  the shipped GLB): pericardiacophrenic artery and vein (both sides; from
  the internal thoracic vessels 15 mm below the artery's origin, then
  alongside the phrenic nerve — artery behind, vein in front, 1 mm off it —
  to the diaphragm; the phrenic nerve's family now includes them),
  subcostal nerve (both sides; T12–L1 foramen, under the 12th rib below the
  subcostal vessels, in front of quadratus lumborum, then between
  transversus abdominis and the internal oblique to the rectus' lateral
  border halfway between umbilicus and pubis; ≤ 2 mm into either layer,
  touches the external oblique where the internal one thins out at the
  back), greater pancreatic artery (from the splenic artery at the
  body–tail junction down the back of the gland into it). Fact found: the
  Atlas vagina lies 60 mm behind the symphysis, its lower end right above
  the perineal body (y 30–40 mm, z 806 mm), so the female vestibule built
  for item 13 will be longer than textbook. Head module
  (`structures_head.py`, WIP): posterior auricular arteries and suboccipital
  nerves clearance-clean; lingual arteries too (from the ECA at the hyoid
  horn's tip, a loop over it, along the horn, deep to hyoglossus, then the
  deep lingual artery lateral to genioglossus to near the tongue's tip;
  inside the model's single "Tongue" mesh, which encloses its muscles;
  ≤ 1.5 mm into hyoglossus/genioglossus where they abut). The infra-orbital
  nerve (item 16) is not hand-built: Z-Anatomy's "Maxillary nerve" mesh
  already runs on through the orbit floor to the face and fans out there;
  split out instead (below). Builder:
  `--skip <regex>` leaves structures out but still exports (the priority-1
  GLB is rebuilt with the priority-2 ones skipped until they are ready).
  Male pelvis (item 15): bulbourethral glands (9 × 8 × 7 mm, posterolateral
  to the membranous urethra, in the sphincter; ducts forward into the bulb
  to the urethra; ≤ 2 mm into the sphincter, prostate apex, bulb or
  crura); cremaster (C-shaped loops every ~7 mm round the cord — ductus
  deferens, testicular artery and vein — from 10 mm below the superficial
  ring to the testis, each open ≥ 100° towards what the cord rests on
  (adductor longus, pectineus), else at the back, a loop left out where
  even a half loop would cut into it; a lateral strip joins the lower
  ones). Also not hand-built: the nerve to vastus medialis (item 18) — the
  model's "Femoral nerve" mesh continues as it to vastus medialis
  (z ≈ 630–650 mm). Checked the rest: none of the other priority-2
  structures lies along an existing mesh. **Split** (user's choice):
  `scripts/anatomy/z-anatomy/split-meshes.ts` cuts `Infra-orbital nerve.l/.r`
  out of the maxillary nerve (in front of the infra-orbital artery's
  posterior end, i.e. the inferior orbital fissure) and `Nerve to vastus
medialis.l/.r` out of the femoral nerve (below the saphenous nerve's upper
  end, its division) in the shipped nerves file + manifest; no-op when rerun,
  every other mesh unchanged; each side's shared mirrored mesh copied first.
  Test: both are their own structures, in the head / lower limb.
  Female urethra (item 14): `Urethra (female)` (joins the male-only
  Urethra as one structure by name), Ø 6 mm along the course the female
  sphincters were built round, from 3 mm inside the Atlas bladder neck to
  in front of the vaginal opening (≈ 35 mm, nearly vertical: the Atlas
  vagina sits far back). Item 13 (female external genitalia) waits for
  the user: the Atlas vagina's lower end lies ≈ 60 mm behind the symphysis
  and ≈ 20 mm in front of the anus (the organs were shifted 27 mm back so
  the bladder sits on our ureters), so placing them by the bones gives a
  ≈ 70 mm vestibule, by the vagina a clitoris far from the symphysis —
  user: build to the bones (decisions table). Items 16 and 18 — user:
  split them out of the parent meshes.
  **Item 13 built** (to the bones): clitoris (group "Clitoris": crura along
  the ischiopubic rami, body from the angle 7 mm below the symphysis down
  and back to the glans; suspensory ligament from the symphysis' front);
  bulbs of the vestibule beside the vaginal orifice, tapering forward to
  the glans; greater vestibular glands at the bulbs' back ends with ducts to
  the vestibule; vaginal vestibule (roof, open round the orifices), labia
  minora and majora (fitted inside the thighs' medial surfaces), mons pubis
  (a pad in front of the pubis and the muscles there) — thin shells, the
  outer layer. The female ischiocavernosus and bulbospongiosus are refitted
  over the new crura and bulbs. `plot_perineum.py` shows them all.
- **2026-10-07 · review fixes to priority 1** (a second session measured
  the shipped paths against the brief): (1) the **right recurrent laryngeal
  nerve** passed round the subclavian artery's medial end beside the
  brachiocephalic bifurcation, with artery tissue above and below it; it
  now leaves the vagus above the artery and hooks round its first part 6 mm
  lateral to the bifurcation — in front, flat under the whole artery,
  behind — then medially behind the vagus to the groove (may sink ≤ 5 mm
  into the lung apex and its apical vessels, which rise round the artery
  with no cervical pleura; relaxed with 3 mm control points to keep the
  tight hook). Check (the reviewer's): the artery lies directly above all of
  its lowest 15 % of points and below none, its underside 2.3 mm above the
  lowest point; the left nerve passes the same check under the arch. (2) The
  **anal canal** started on the sphincter's axis 3 mm short of the rectum;
  it now starts inside the rectum's lower end (8 mm in front of that axis;
  1 mm into the wall and 2.5 mm up, so its start cap stays inside) and
  bends back into it (may press ≤ 1.5 mm into the external
  sphincter's front rim); the internal sphincter ends 14.5 mm below the
  ring's centre as before. Rebuilt with `--skip` for the unfinished
  priority-2 structures: only these three rows of the clearance report
  changed. Audit: unchanged (only the supraclavicular finding). Review shots
  retaken for both. `summaryNotes.json` untouched (the other session
  regenerates it).
- **2026-10-07 · priority 2 integrated** — Full build of priorities 1 + 2
  together: 85 meshes, 102,112 triangles, clearance-clean (one conflict
  found and allowed: the right lingual artery and the ansa's superior root
  meet where the hypoglossal crosses the artery's loop). `handmade.glb`
  0.40 MB. Priority-1 rows of the clearance report changed only in their
  neighbour lists (priority-2 parts beside them), except the thoracic duct
  (464 → 470 mm, still clean): the split re-encoded the nerves file with
  the same geometry (≤ 0.1 µm) but a new vertex order, which the
  relaxation is sensitive to. Tests: priority-2 ids, regions, bodies (male
  only, female only, the shared urethra); the old "urethra is male-only"
  assertion dropped. Course names rerun: 669/1,779 structures (+17); not
  matched by name: pericardiacophrenic artery/vein, labia, vaginal
  vestibule (her course words them as combined terms). For her summary
  notes (regenerated by the other session), `scripts/course/summary/`
  gets synonyms "Pericardiacophrenic Vessels", "Labia majora & minora",
  "Greater vestibular gland(s) (Bartholin)", "Bulb of the vestibule",
  "Bulbourethral gland(s)", "Cremaster m. & fascia" and the parent entry
  "Vulva and labia". Audit: sides, regions, duplicates clean; floating
  findings only for the skin-layer shells (above). Review shots for every
  priority-2 structure (front + turned; perineal ones isolated from
  front-below; female ones in the female body) taken on a fresh build and
  reviewed, contact sheets `priority-2*.jpg`, perineum plot redone;
  `e2e:smoke` green (39), CI green. Noted on review: the female urethra
  shows her existing urethra note, whose sub-entries are the male
  segments (her note on the shared structure; untouched).
- **2026-10-07 · session 3 (cont.)** — Review of hand-built priority 1 (user
  request): courses measured against the brief's relations in the shipped
  files — phrenic nerves, left recurrent laryngeal, thoracic duct, superior
  laryngeal, ansa, arteries and perineum correct; the **right recurrent
  laryngeal nerve skirts the medial end of the right subclavian artery
  instead of hooking under it**, and the anal canal starts 3 mm below the
  rectum — both passed to the priority-2 session. Her notes regenerated
  with her .docx so they reach the hand-built structures (+21 entries).
- **2026-10-07 · session 3 (cont.)** — Fixed: a drag that turned the body
  selected (or, in peel mode, peeled) the structure under the pointer on
  release — R3F fires `onClick` after a drag. `AnatomyModel.tsx` now ignores
  clicks and double-clicks whose press-to-release distance exceeds 6 px
  (`lib/anatomy/pointer.ts`, unit-tested; R3F already ignores clicks on empty
  space after 2 px, a little more lets a wobbly finger tap on the iPad still
  select). e2e: dragging across the body selects nothing.
- **2026-10-07 · session 3 (cont.)** — The drag fix: the bug reproduced on
  the old build (each drag selected the pectoralis major under the pointer);
  on the fix the new e2e check passes and a real click still selects; verify
  green (206 tests), CI green. The full `e2e:smoke` could not finish in
  today's fresh cloud container: a `page.screenshot` times out (60 s) at a
  random step — also on unchanged `main` (there at the quiz summary) — with
  only software rendering on 4 CPUs. If it recurs, rerun on another
  container before suspecting the code.
- **2026-10-07 · session 3 (cont.)** — User: the NC kidney goes too.
  Added as priority 4 (item 25) of `docs/HANDMADE_MODELS_PROMPT.md`, for
  the priority-2 session to do last: import `VH_M_Kidney_L/R` and
  `VH_M_Blood_Vasculature_Kidney` (HRA v1.2, CC BY 4.0) into their own file
  for both bodies, fitted to the old kidney, and drop the kidney from the
  non-commercial file. Drag fix merged to `main` (user's go).
- **2026-10-07 · priority-2 branch: `main` merged in** (drag fix, her notes
  for priority 1, priority 4 in the brief). Conflicts in STATUS/DECISIONS
  resolved keeping both sides. The full `e2e:smoke` then failed at the same
  step every time — the screenshot right after main's new drag check — and
  passed with that check removed, so it was not the container. Measured:
  `render()` returns in ~20 ms and rendering stops ≈ 1.6 s after a drag,
  but SwiftShader rasterizes in Chromium's GPU process at ≈ 5.5 s per
  whole-body frame, so each frame the drag causes queues GPU work the next
  screenshot must wait for; 2 × 10 pointer steps plus the camera's drag
  inertia (≈ 10 more frames) queued over a minute. Fixed: the e2e drags
  move in one step, that screenshot gets 150 s, and **drag inertia now
  respects reduced motion** (`CameraController.tsx`: no `smoothTime` /
  `draggingSmoothTime` when the user prefers reduced motion — programmatic
  moves were already instant). Not an app bug on real GPUs (a drag costs a
  few 16 ms frames). Main's earlier note of a timeout "at the quiz summary
  on unchanged main" was not reproduced here. `npm run verify` green (208),
  `e2e:smoke` green (40).
- **2026-10-07 · priority 3 (branch `claude/handmade-priority-3`)** — Built
  items 22–24: tensor tympani and stapedius (both sides), subcostal muscles
  (four slips a side), scrotum and its septum (male). Her terms ("Tensor
  tympani m.", "Pyramidal eminence & Stapedius m.", "Subcostal Muscles",
  "Scrotum", "Septum of scrotum") match by name — no synonyms/parents
  added; course names 674/1,784. Found and fixed a clearance-check bug:
  inside/outside was gated by raw face normals, which are inverted or
  meaningless for ≈ 1,700 meshes; the left phrenic nerve and the ansa's
  superior roots had shipped running through scalenus medius / the SCM and
  the IJV. Now the winding number decides where normals can't
  (`Body.facing`), and the final check always uses it; the superior root
  now descends medial to the IJV; the left phrenic's lung allowance is
  5.5 mm; the anal canal may sink ≤ 1.5 mm into the pararectal nodes. All
  93 meshes rebuilt clearance-clean (122,040 triangles, 0.46 MB); both
  recurrent nerves still pass the reviewer's hook test; audit: only skin
  layers float (the scrotum's floor ≤ 11 mm below the testes). `npm run
verify` green (209), `e2e:smoke` green (40); review shots for every new
  structure and for the ones the fix moved (ansa, left phrenic and
  pericardiacophrenic, anal canal); the scrotum, first an open pouch, is
  now a closed sack (it looked like a bucket); the ear muscles' shots zoom
  in (`zoom` in `e2e/handmade-shots.ts`).
- **2026-10-08 · priority 4 (branch `claude/handmade-priority-4`)** — The
  non-commercial kidney is replaced by the Human Reference Atlas male
  kidney (CC BY 4.0, both bodies): `scripts/anatomy/hra/export_hra_kidney.py`
  → `public/models/hra/kidney.glb` (20 meshes, 0.52 MB). Per side: fibrous
  capsule, cortex, columns, pyramids, papillae, hilum, minor/major calyces
  (from the Atlas's ureter files), renal pelvis (group "Kidney"), plus the
  renal vein's hilar end joined to Z-Anatomy's renal vein. Fitted by ICP to
  the old kidney, then turned out of liver/spleen/psoas/QL (the old one
  overlapped them by 3–8 %); right renal pelvis drawn onto the ureter (the
  model's ureter runs up inside psoas); all item-25 checks pass (hilum
  medial/forward, T12–L3, right 22 mm lower, pelvis/artery/vein ≤ 3 mm, no
  overlap). A selected kidney shows its pyramids and calyces through its
  surface: the app's x-ray selection (no depth test), as for any organ with
  parts. Non-commercial file re-exported
  (4 meshes, inner ear only; `export_glb.py` never exports the old kidney).
  Hand-built structures rebuilt against the new kidney (clean; the subcostal
  nerve's landmark is now the capsule). Course names 680/1,788. Her notes
  keep matching (`kidney`, `renal-pelvis`, `renal-vein`); `summary_notes.py`
  needs her .docx (not here) to reach the new parts. Lost: the old
  "intrarenal arteries/veins". `npm run verify` green (210), with
  `INCLUDE_NON_COMMERCIAL` true and false; `e2e:smoke` green (40); review
  shots of the kidney, capsule, cortex and right renal pelvis
  (`docs/screenshots/handmade/`).
- **2026-10-08 · review of priorities 2–4 on `main`** (user request:
  thorough review, fix what's found, her notes on everything). Checked:
  `npm run verify` on the merged `main` (210, green); code diffs (dataset
  wiring, kidney file in both bodies, reduced-motion drag inertia, the mesh
  splits, tests); the audit rerun over all 12 model files with the new ones
  (sides, regions by height, mutual duplicates: nothing new — the only new
  "duplicates" are kidney parts that touch by design: papillae in the minor
  calyces, pyramids beside columns); the kidney's fit measured (upper poles
  at T12, lower near L2/L3, right 20 mm lower, upper poles tilted medially
  and back, hilum medial and forward, adrenals on the upper poles, renal
  pelvis ↔ ureter, renal vein ↔ Z-Anatomy's, renal artery branches ↔
  capsule all ≤ 1 mm); priority-2/3 ends measured (pericardiacophrenic,
  lingual, posterior auricular, greater pancreatic arteries on their
  parents; suboccipital nerve among its muscles; ear muscles on malleus /
  stapes; bulbourethral glands in the sphincter; female urethra on the
  bladder; cremaster round the ductus) — all ≤ 2 mm, as the session
  reported; review shots and contact sheets looked at. **Bug found and
  fixed:** the female body's urethra showed her notes on the male urethra's
  segments (prostatic, membranous, penile), and the bladder/rectum showed
  the male pouch in the female body and the female one in the male body.
  Notes now carry a body (`parents.json` → `bodies`, `StudyNote.sex`) and
  `datasetForSex` drops the other body's; tests in `bodySex.test.ts` and
  `build.test.ts`. **Her notes** rerun with her .docx: 774 → 827
  structures, 49 → 53 Hebrew names, unmatched entries 61 → 14. Her combined
  entries now reach every part (the ansa's roots, the superior laryngeal
  nerve's branches, the deep transverse perineal muscle, compressor
  urethrae and the male external urethral sphincter, renal columns, minor
  and major calyces; her renal capsule note moves from the kidney to the
  new fibrous capsule), plus 9 synonyms and 45 part/region entries in
  `parents.json` (e.g. myometrium/endometrium → uterus, dartos → scrotum,
  oval window → stapes, greater omentum → stomach and transverse colon,
  pouches and fossae → the organs around them, retinacula → the tendons
  they hold, deltoid ligament → its four parts, thenar/hypothenar → their
  six muscles). `npm run verify` green (211), `e2e:smoke` green (40);
  checked in the app: the female urethra shows only her general note, the
  male one also the three segments; calyces and the ansa's roots show hers.
- **2026-10-08 · review fixes merged to `main`** (user's go):
  `claude/review-priorities-2-4` fast-forwarded.
- **2026-10-08 · Or's Anatomy** (branch `claude/rename-logo-mobile`) — app
  renamed ("האנטומיה של אור" / "Or's Anatomy": wordmark, page title, iOS
  home-screen title, `src/app/manifest.ts`). App icon: the app's own leader
  label (pin + line + "אור") in cream on the teal plate, rendered by
  `scripts/brand/render-icons.ts` to `src/app/icon.png`, `apple-icon.png`,
  `favicon.ico` and `public/icons/` (192/512, also maskable). Hebrew serif
  "Noto Serif Hebrew" (Frank Ruhl kept for Latin) — never took effect, see
  next entry. Phone fixes:
  form fields are 16px on touch screens and the viewport caps zoom at 1 (iOS
  zoomed into the 15px search box and stayed zoomed, pushing the top strip's
  buttons off screen), no double-tap zoom; phones had **no page links at all**
  (MainNav hidden below `lg`/`md`) → new `NavMenu` (☰) next to settings; the
  viewer shows the icon instead of the longer wordmark on phones, and its
  ☰/⚙ sit on a white capsule (bare icons were lost over the model).
  `verify` green (211), `e2e:smoke` green (42, incl. phone menu + 16px
  search); the first e2e run timed out once on the quiz-summary screenshot
  (60 s, software WebGL), the rerun passed. CI green.
- **2026-10-08 · title font** — the Noto change never showed (Next's font
  loader ships every subset, so Frank Ruhl still drew the Hebrew). The user
  picked **Miriam Libre** from real-page previews; it now sets all names,
  titles and the wordmark (`font-serif` renamed `font-title`), and the icon's
  "אור". DECISIONS.md → "Title font". `verify` green (211), `e2e:smoke` green (42); screenshots reviewed.
- **2026-10-08 · merged to `main`** (user's go): `claude/rename-logo-mobile`
  fast-forwarded.
- **2026-10-08 · quizzes from her summary** (user: "add more quizzes based
  on her docx"; branch `claude/summary-quizzes`). New quiz type "מהסיכום"
  (from the summary): her note about a structure is the question — find it
  in the model (either side counts; feedback names the side clicked) or
  choose its name from four (no sides shown, one-shot, then the camera
  shows where it is). Her names for the structure are masked in the clue
  (Hebrew prefixes included; 32 clues needed it); notes shorter than 20
  characters, shared and part-of notes aren't used (`lib/quiz/clues.ts`).
  Her 13 distinctions (6 of her 12 pairs, both halves, and the rotator cuff)
  are clues whose wrong options are the other half
  (`z-anatomy/summaryDistinctions.ts`, in CONTENT_REVIEW for her check).
  Scopes: her distinctions, then her sections in her order
  (`summarySections.json`, written by `summary_notes.py`; "השלמות X" joins
  "X"; sections under 5 structures dropped) — they work with every quiz
  type. Fixed on the way: the scope rows' hidden radios were positioned
  outside their row (now inside: `relative`); the question-type track
  becomes a rounded block instead of a stretched pill when it wraps on a
  phone. Tests: clues, generator, engine, scopes, panel; e2e: summary mode
  on her distinctions. `npm run verify` green (227), `e2e:smoke` green
  (44); screenshots reviewed (setup on desktop and phone, a describe and a
  find question, the answer shown in the model):
  `docs/screenshots/quiz-setup-from-summary.png`, `quiz-from-summary.png`.
- **2026-10-08 · summary quizzes merged to `main`** (user's go):
  `claude/summary-quizzes` fast-forwarded.
