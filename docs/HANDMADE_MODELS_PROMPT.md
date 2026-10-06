# Prompt: build the missing anatomical structures by hand

> Give this whole file to the AI session that will build the pieces. It is
> written to that session. It was produced on 2026-10-06 after a full audit
> of the model (`docs/STATUS.md` → session log). The anchor coordinates in the
> appendix were measured from the files the app ships.

---

## 1. Your role and the goal

You are working in the repository of **"Anatomy"**, a 3D anatomy study app
(Next.js 16 + React Three Fiber) for a Hebrew-speaking medical student in
Israel. Its body model combines Z-Anatomy, Open3DModel, BodyParts3D, the
Human Reference Atlas (female organs) and two non-commercial Z-Anatomy
models. Each one was fitted into a single body.

Some structures she has to learn exist in **no open 3D model**. Your job is
to **build them procedurally**, place them correctly in that body, and
integrate them into the app like every other source. Each structure is a
script-generated tube, sheet or solid that follows the structure's real
anatomical course between real landmarks of our model.

The result must be:

- **anatomically correct in course and relations**: schematic in shape,
  never in position;
- **reproducible**: one script regenerates everything; nothing is
  hand-edited in binary files;
- **integrated**: it shows in the viewer, search, legend, quizzes, her
  notes and the credits, in the right body (male/female);
- **verified**: tests, the dataset validator, the audit, e2e, screenshots
  you have looked at, and CI.

## 2. Read before doing anything

1. `CLAUDE.md` and `AGENTS.md`: the working rules. Keeping the docs current
   in **every** commit is enforced by a hook.
2. `docs/STATUS.md`: the current state and the user's decisions (don't
   re-ask them).
3. `docs/CONTRIBUTING.md` (definition of done) and `docs/ARCHITECTURE.md`
   ("Datasets" and "Male/female body").
4. `docs/DECISIONS.md`, at least these entries: "Open3DModel pieces join
   the Z-Anatomy dataset", "Non-commercial models in their own file",
   "Male/female switch: one body…", "BodyParts3D pieces: global affine +
   local ICP", "Z-Anatomy's sigmoid colon is the rectum", and "Audit: what
   is checked and how to rerun it".
5. The existing pipelines, as patterns to copy:
   - `scripts/anatomy/bodyparts3d/export_bp3d.py`: builds meshes from
     vertices with `bpy`, exports a GLB and writes a manifest;
   - `scripts/anatomy/hra/export_hra.py`: ray-cast depth maps against our
     chest wall, plus a place-on-surface method;
   - `scripts/anatomy/open3dmodel/export_open3d.py`: naming rules;
   - `scripts/anatomy/z-anatomy/optimize-glb.ts`: compression.
6. `src/data/anatomy/z-anatomy/build.ts`: `ManifestEntry`, `MODEL_SOURCES`,
   `MALE_ONLY`, `RELABEL`, `SWAPPED_SIDES`, `parseName`.
   `src/data/anatomy/z-anatomy/index.ts`: how manifests and model files are
   wired.
7. `THIRD_PARTY_ASSETS.md` and `docs/CONTENT_REVIEW.md`.

## 3. Hard rules

- **Do not invent anatomy.** Every course below is standard textbook
  anatomy (Gray's Anatomy for Students, Moore's Clinically Oriented
  Anatomy, Netter). If you are unsure of a relation, choose the textbook
  description and write it in the script's comment. Where variants exist,
  model the textbook-typical pattern and say so.
- **Every name you create** is English, Z-Anatomy style, with sides as a
  `.l` / `.r` suffix. A structure that is only on one side (thoracic duct)
  or that differs by side (the recurrent laryngeal nerves) uses a "Left " /
  "Right " prefix, which `parseName` pairs as the sides of one structure.
  Use the exact names in section 6: her notes are matched to them.
  Everything you add is `verified: false`, and every new name is listed in
  `docs/CONTENT_REVIEW.md` as a **schematic, hand-built** structure to check.
- **No Hebrew terms** unless they come from her course site or her summary
  (the scripts handle that).
- **Never duplicate** an existing structure. Section 6 lists what exists;
  search the manifests before adding anything else.
- **Keep everything flat**: one mesh object per structure part, no parent
  nodes (the validator and the viewer expect that). Mesh names must be at
  most 60 characters (Blender cuts names at 63).
- **Every mesh needs faces.** Faceless curves are dropped by the glTF
  exporter and become invisible structures.
- **Licence:** this is the project's own work, placed against a CC BY-SA
  model. Release it as **CC BY-SA 4.0**, with a `MODEL_SOURCES` entry and
  a `THIRD_PARTY_ASSETS.md` row (author: this project).
- **Sex:** female-only structures carry `"sex": "female"`. Male-only ones
  carry `"sex": "male"`, or their base name goes into `MALE_ONLY` (which
  is for Z-Anatomy's own meshes). Structures shared by both bodies carry
  no `sex`.
- Work on a `claude/<topic>` branch. Commit with a what-and-why message and
  docs in the same commit. **Do not merge to `main`** unless the user says
  so.

## 4. The coordinate frame and the body

- Work in **Blender world coordinates**, the frame every export script
  uses: **metres, Z up, +X = the body's LEFT, −Y = FRONT (anterior),
  +Y = back**. The body stands at the origin, feet near z = 0. The top of
  the head is about 1.75 m, the pubic symphysis z ≈ 0.844, the manubrium
  top z ≈ 1.404.
- The shipped glTF frame is y up, +z front, +x left. Blender's glTF
  importer converts it to the frame above. All appendix coordinates are in
  the **Blender frame, in millimetres**.
- The body is **male** (Z-Anatomy). In the female body (settings → Body)
  the male reproductive organs, male urethra, penile/testicular vessels
  and the male bladder mesh are hidden. The Human Reference Atlas female
  organs (uterus, vagina, ovaries, tubes, ligaments, female bladder parts,
  breasts) are shown instead. The skeleton stays male.
- Z-Anatomy is **exactly symmetric** (left/right mirror error 0.0 mm). A
  symmetric structure can be built on one side and mirrored (x → −x),
  renaming `.l` ↔ `.r`. Asymmetric structures (thoracic duct, recurrent
  laryngeal nerves, phrenic nerves in the thorax) are built separately.
- The pericardium, pleura, peritoneum, fasciae and carotid sheath are
  **not** in the model (left out as coverings). Where a course is "on the
  pericardium", run the structure about **4 mm outside the heart surface**.
  Where it is "in the carotid sheath", run it between the internal jugular
  vein and the common carotid artery.

### Getting the geometry into Blender

The shipped GLBs are meshopt-compressed, which Blender can't read. Decode
them first; they then import with exactly the coordinates the app shows:

```sh
for f in public/models/z-anatomy/*.glb public/models/open3dmodel/extras.glb \
         public/models/bodyparts3d/extras.glb public/models/hra/female.glb \
         public/models/non-commercial/non-commercial.glb; do
  npx tsx scripts/anatomy/decode-glb.ts "$f" "out/decoded/$(basename $(dirname $f))-$(basename $f)"
done
```

Blender as a Python module: Python 3.11 venv, `pip install "bpy==4.5.*"`.
See `scripts/anatomy/z-anatomy/README.md`.

**Traps already hit (don't repeat them):**

- Never name your script like a stdlib module (`inspect.py` crashes bpy).
- `import bmesh` only works after `import bpy`.
- glTF import splits vertices along normal seams: weld before decimating.
- In gltf-transform, `Accessor.getElement` already de-normalizes quantized
  positions; never divide again.
- Run bpy scripts from the repository root.

## 5. How to build: method and quality bar

Write **`scripts/anatomy/handmade/build_handmade.py`** (bpy) plus a
`README.md` next to it. For each structure:

1. **Landmarks from the meshes, not hard-coded numbers.** Load the decoded
   GLBs and compute each landmark from the named meshes. Examples:
   - "anterior tubercle of C4's left transverse process" = the vertex of
     `Vertebra C4` with the greatest x among those with y < 5 mm;
   - "anterior surface of the left scalenus anterior at height z" = a ray
     cast from the front at that height, hitting `Scalenus anterior
muscle.l`;
   - "lowest point of the arch under the left subclavian artery" = the
     minimum-z vertex of `Left subclavian artery` near its origin.

   Use the appendix only to sanity-check the landmarks you compute.

2. **Control points = landmark + small offsets** along named directions
   (anterior, lateral…). State each offset in a comment with its reason
   ("4 mm anterior to the scalenus anterior surface: the nerve lies on the
   muscle, under the prevertebral fascia").
3. **Path:** a centripetal Catmull-Rom spline through the control points,
   resampled every 2 mm.
4. **Nerves and vessels:** sweep a circle along the path, using
   parallel-transport frames (no twisting), with 10–12 radial segments and
   closed end caps. Taper at branches and endings. Branches start
   tangentially on the parent's surface.
5. **Muscles and sheets:** loft elliptical cross-sections between the
   attachment landmarks. Origins and insertions touch the bone or tendon
   surface (0–1 mm).
6. **Solid organs and glands** (bulbourethral glands, greater vestibular
   glands, cisterna chyli): smooth ellipsoids or lofts, sized as stated
   below.
7. **Clearance:** build a BVH of every existing mesh. Except at the
   structure's own origin, insertion or attachment, no vertex may lie inside
   another mesh. Keep at least 0.5 mm from neighbours it should not touch.
   The script **asserts** this and prints the worst offender per structure.
8. **Budget:** at most 150k triangles in total; after `optimize-glb.ts
--simplify 0.5` the file should be at most 1.5 MB. Use one material per
   tissue, with the same colours as `TISSUE_COLORS` in `export_glb.py`.
9. **Output:** `out/handmade.glb` and `out/manifest-handmade.json` (entries
   like the other manifests: `name`, `system`, `tissue`, `region`,
   `pack: "handmade"`, `vertices`, `source: "Handmade"`, plus `group`,
   `groupSide` and `sex` where they apply).

## 6. The structures to build

Diameters are typical adult values; use them as the tube diameter. "Her
terms" are the entries in her summary that should then match. If the name
alone doesn't match them, add them to `scripts/course/summary/synonyms.json`
(`terms`) or `parents.json`. Regions are `head | neck | thorax | abdomen |
pelvis | back | upper-limb | lower-limb`.

Already in the model (route next to them, never duplicate them): vagus
nerves; sympathetic trunks; hypoglossal and accessory nerves; scalenes;
SCM; infrahyoid muscles; carotids; jugular veins (internal and external);
subclavian and brachiocephalic vessels; aorta; SVC/IVC; azygos/hemi-azygos;
internal thoracic artery and veins; heart chambers; diaphragm; superior
thyroid, lingual and posterior auricular **veins**; facial and occipital
arteries; liver; gallbladder; bile duct; stomach; spleen; pancreas; splenic,
common/proper hepatic and gastroduodenal arteries; subcostal artery;
quadratus lumborum; abdominal oblique muscles; femoral nerve and artery;
saphenous nerve; vastus medialis; pelvic floor (pubococcygeus,
iliococcygeus, tendinous arch); external anal sphincter; penis (corpora,
glans), testes, ductus deferens, urethra (male); ossicles, tympanic
membrane, auditory tube, chorda tympani, facial nerve; infra-orbital artery;
maxillary nerve.

### Priority 1 — high-yield, build first

**1. Phrenic nerve**: `Phrenic nerve.l`, `Phrenic nerve.r`; nervous /
nerve; region thorax; Ø 2.5 mm. Her terms: "Phrenic nerve", "Phrenic
Nerve".

- **Origin:** anterior rami C3, C4, C5, mainly C4. Start with three short
  roots from the lateral edges of the C3–C5 vertebrae (anterior
  tubercles), joining at the lateral border of scalenus anterior at about
  the upper thyroid cartilage level (z ≈ 1.49).
- **Neck:** descends almost vertically on the **anterior surface of
  scalenus anterior**, running from its lateral to its medial border (it
  crosses the muscle obliquely). It lies deep to the SCM and the internal
  jugular vein, and posterior to the transverse cervical artery
  (`Transverse cervical artery`).
- **Root of the neck:** passes anterior to the subclavian artery
  (`Left/Right subclavian artery`) and **posterior to the subclavian vein**
  (`Left subclavian vein`; the right one is beside the brachiocephalic
  vein), medial to the origin of the internal thoracic artery, entering the
  thorax behind the sternoclavicular joint.
- **Right (thorax):** descends on the right side of the **right
  brachiocephalic vein**, then the **superior vena cava**, then the
  pericardium over the **right atrium** (≈ 4 mm outside `Right atrium`),
  anterior to the root of the right lung. It reaches the diaphragm beside
  the IVC (`Inferior vena cava (thoracic part)`) and ends in 3–4 short
  branches on and through the diaphragm's dome (`Diaphragm`).
- **Left (thorax):** crosses the **left side of the aortic arch**
  (`Aortic arch`), **anterior to the left vagus** (`Vagus nerve (X).l`).
  It then descends over the pericardium of the **left ventricle**
  (≈ 4 mm outside `Left ventricle`), anterior to the left lung root, and
  pierces the diaphragm near the heart's apex, lateral to the right one.
  It ends in 3–4 branches on the diaphragm.
- **Must not:** cross behind the subclavian artery, pass through the heart
  or lung, or touch the vagus except where they cross near the arch.

**2. Recurrent laryngeal nerves**: `Right recurrent laryngeal nerve`,
`Left recurrent laryngeal nerve`; nervous / nerve; region neck; Ø 1.5 mm.
Her term: "Recurrent laryngeal nerve".

- **Right:** leaves the right vagus where the vagus crosses **anterior to
  the right subclavian artery**. It hooks **below and behind the right
  subclavian artery**, then ascends obliquely in the **groove between the
  trachea and the oesophagus** (`Trachea`, `Oesophagus`). It enters the
  larynx deep to the inferior pharyngeal constrictor, just behind the
  cricothyroid joint (posterior to `Cricoid cartilage`, at its upper
  border). Its final part, as the inferior laryngeal nerve, ends at the
  posterior cricoarytenoid muscle (`Posterior crico-arytenoid muscle`).
- **Left:** leaves the left vagus on the **left of the aortic arch**,
  hooks **below the arch** just lateral to the ligamentum arteriosum
  (between the arch and the pulmonary trunk bifurcation; the ligament is
  not modelled), and passes behind the arch. It then ascends in the **left
  tracheo-oesophageal groove** to the larynx, symmetric to the right
  ending.
- **Must not:** pass through the aorta, trachea or oesophagus. It leaves
  the vagus tangentially, from its surface.

**3. Superior laryngeal nerve, with its two branches**: group `Superior
laryngeal nerve` (sided); parts `Superior laryngeal nerve.l/.r` (the trunk;
it shares the group's name, so it is the whole itself),
`Internal branch of superior laryngeal nerve.l/.r`, `External branch of
superior laryngeal nerve.l/.r`; nervous / nerve; region neck; Ø trunk 1.5,
branches 1 mm. Her term: "Superior laryngeal nerve (External & Internal
Br.)".

- **Trunk:** leaves the vagus at its **inferior (nodose) ganglion**, high
  in the neck at about C2 level (z ≈ 1.52–1.53, on `Vagus nerve (X)`).
  It descends medially, **deep (medial) to the internal and external
  carotid arteries**, and divides at the level of the hyoid's greater horn.
- **Internal branch:** runs forward and down to pierce the **thyrohyoid
  membrane**, between the hyoid and the upper border of the thyroid
  cartilage (`Hyoid bone`, `Thyroid cartilage`, deep to `Thyrohyoid
muscle`), together with the superior laryngeal artery (item 6). It ends
  inside, in the piriform recess area.
- **External branch:** descends on the **inferior pharyngeal constrictor**
  (`Inferior pharyngeal constrictor`), close to the superior thyroid artery
  (item 5), to the **cricothyroid muscle** (`Straight/Oblique part of
cricothyroid muscle`).

**4. Ansa cervicalis**: group `Ansa cervicalis` (sided); parts `Superior
root of ansa cervicalis.l/.r`, `Inferior root of ansa cervicalis.l/.r`,
`Ansa cervicalis.l/.r` (the loop, i.e. the whole itself); nervous / nerve;
region neck; Ø 1 mm. Her term: "Ansa cervicalis (Superior Root & Inferior
root)".

- **Superior root (C1 fibres):** leaves the **hypoglossal nerve**
  (`Hypoglossal nerve (XII)`) where that nerve curves forward around the
  **occipital artery** (`Occipital artery`). It descends **on the anterior
  surface of the carotid sheath**, in front of the internal and then the
  common carotid artery.
- **Inferior root (C2–C3):** comes from the cervical plexus behind the
  internal jugular vein, curves round the **lateral side of the internal
  jugular vein** and comes forward.
- **Loop:** the roots join **in front of the internal jugular vein and
  common carotid**, at about the **cricoid cartilage** level (z ≈ 1.46).
- **Branches:** short twigs to **sternohyoid, sternothyroid and both
  bellies of omohyoid** (`Sternohyoid muscle`, `Sternothyroid muscle`,
  `Omohyoid muscle`), ending on their deep surfaces. These can be parts
  named `Muscular branches of ansa cervicalis.l/.r`.

**5. Cutaneous branches of the cervical plexus**: `Lesser occipital
nerve.l/.r`, `Great auricular nerve.l/.r`, `Transverse cervical
nerve.l/.r`, `Supraclavicular nerves.l/.r`; nervous / nerve; region neck;
Ø 1.5 mm, the supraclavicular nerves 1 mm. Her terms: "Lesser occipital
nerve", "Great auricular nerve", "Transverse cervical nerve",
"Supraclavicular nerves".

- **All four emerge together** at the **nerve point of the neck (Erb's
  point)**: the **midpoint of the posterior border of the SCM**
  (`Sternocleidomastoid muscle`). They wind round that border and run
  **superficial to the SCM**, 1 mm outside its surface, in the superficial
  fascia.
- **Lesser occipital (C2):** ascends **along the posterior border of the
  SCM** to the scalp behind the ear (above and behind the mastoid).
- **Great auricular (C2, C3):** ascends **obliquely across the SCM**,
  roughly parallel to and behind the **external jugular vein**
  (`External jugular vein`). Towards the **angle of the mandible and the
  ear lobe** it splits into an anterior branch (over the parotid) and a
  posterior branch (over the mastoid).
- **Transverse cervical (C2, C3):** runs **horizontally forward across
  the SCM**, **deep to the external jugular vein**, to the front of the
  neck, splitting into upper and lower branches.
- **Supraclavicular (C3, C4):** descend as **three fans: medial,
  intermediate and lateral**. They cross superficial to the **clavicle**
  (`Clavicle`) onto the upper chest and the shoulder (over the acromion).

**6. Superior thyroid artery and superior laryngeal artery**: `Superior
thyroid artery.l/.r` and `Superior laryngeal artery.l/.r`; cardiovascular
/ artery; region neck; Ø 2.5 and 1 mm. Her terms: "Superior thyroid
artery", "Superior laryngeal artery".

- **Superior thyroid:** the **first branch of the external carotid**
  (`External carotid artery`), from its front just below the greater horn
  of the hyoid. It runs forward and **down to the upper pole of the
  thyroid lobe** (`Thyroid gland`), deep to the infrahyoid muscles, close
  to the external branch of the superior laryngeal nerve. It ends in
  anterior and posterior glandular branches on the gland.
- Our `Superior thyroid vein` runs the same course. Run the artery 2–3 mm
  deeper and higher, without touching the vein.
- **Superior laryngeal:** leaves the superior thyroid artery near its
  start and pierces the **thyrohyoid membrane** with the internal branch
  of the superior laryngeal nerve (item 3).

**7. Thoracic duct and cisterna chyli**: `Thoracic duct` (one, on the
midline) and `Cisterna chyli`; lymphatic / lymphatic (colour of
`lymphatic`); regions thorax and abdomen; duct Ø 4 mm (3–5 mm, may be
slightly beaded), cisterna a 20 × 8 × 6 mm spindle. Her term: "Thoracic
Duct".

- **Cisterna chyli:** a sac **anterior to the bodies of L1–L2**
  (`Vertebra L1`, z ≈ 1.07–1.13), **right of the abdominal aorta**,
  behind the **right crus of the diaphragm**.
- **Thoracic duct:** ascends from the cisterna through the **aortic
  hiatus** (T12, z ≈ 1.13–1.16). In the posterior mediastinum it runs
  **between the thoracic aorta (left) and the azygos vein (right)**, behind
  the oesophagus, on the front of the vertebral bodies.
- At **T4–T6** (z ≈ 1.25–1.30) it **crosses to the left**, then ascends
  **along the left edge of the oesophagus** into the neck.
- At **C7** (z ≈ 1.44–1.45) it **arches laterally**: forward, behind the
  carotid sheath and in front of the vertebral artery and sympathetic
  trunk.
- It **ends at the junction of the left internal jugular and left
  subclavian veins** (the left venous angle; `Internal jugular vein.l`
  meets `Left subclavian vein`).
- **Must not:** pass through the aorta, oesophagus, azygos or vertebrae.

**8. Cystic artery**: `Cystic artery`; cardiovascular / artery; region
abdomen; Ø 1.5 mm. Her term: "Cystic artery".

- Usually from the **right hepatic artery**, which is not in the model:
  start at the right end of `Proper hepatic artery`. It runs in the
  **hepatobiliary (Calot's) triangle**, between the cystic duct, the
  common hepatic duct and the liver, to the **neck of the gallbladder**
  (`Gallbladder`, its upper medial end). There it divides into a
  **superficial branch** (on the peritoneal surface) and a **deep branch**
  (between the gallbladder and the liver).
- Optionally also add the `Right hepatic artery` and `Left hepatic artery`
  (the proper hepatic artery's terminal branches into the porta hepatis),
  since they are missing too.

**9. Short gastric arteries**: `Short gastric arteries`, one structure of
4 vessels; cardiovascular / artery; region abdomen; Ø 1 mm. Her term:
"Short gastric artery".

- 4–5 small arteries from the **end of the splenic artery and its
  branches at the splenic hilum** (`Splenic artery`, its left end near
  `Spleen`). They run in the **gastrosplenic ligament** to the **fundus of
  the stomach, along the upper greater curvature** (`Stomach`, its upper
  left border).

**10. Perineal muscles and the perineal body**, built for **both bodies**,
sexes as marked; muscular / muscle; region pelvis. Her terms:
"Bulbospongiosus", "Bulbospongiosus m.", "Ischiocavernosus",
"Ischiocavernosus m.", "Superficial (& deep) transverse perineal m.",
"Compressor urethra m. & Sphincter urethrae".

Landmarks to compute: the **ischial tuberosities** (the lowest posterior
part of `Hip bone`), the **ischiopubic rami** (the hip bone's lower edge
from the tuberosity to the `Pubic symphysis`), the **perineal body** (a
midline point between the anal canal and the urogenital structures, about
12 mm in front of `External anal sphincter`), and in the male the **bulb
and crura** (the posterior ends of `Corpus spongiosum of penis` and `Corpus
cavernosum of penis`).

- `Perineal body` (both bodies): a 12 × 10 × 10 mm fibromuscular node at
  that point. Region pelvis, system "other", tissue ligament.
- `Superficial transverse perineal muscle.l/.r` (both bodies): a slender
  band from the **medial ischial tuberosity** to the **perineal body**.
- `Deep transverse perineal muscle.l/.r` (both bodies): a thin sheet just
  above the superficial one, from the **ischiopubic ramus** to the midline.
- `External urethral sphincter` (both bodies; male version `sex: "male"`,
  female `sex: "female"`, same name):
  - male: a ring around the **membranous urethra**, the part of `Urethra`
    just below the prostate (`Prostate`), above the bulb;
  - female: a ring around the female urethra (item 14), with the
    compressor urethrae and urethrovaginal sphincter fibres arching over
    it.
- `Bulbospongiosus muscle` (male, `sex: "male"`): two halves joined at a
  **midline raphe**, wrapping the **bulb of the penis** (the posterior end
  of `Corpus spongiosum of penis`), from the perineal body forward.
- `Bulbospongiosus muscle.l/.r` (female, `sex: "female"`): one on each
  side of the **vaginal orifice**, covering the **bulbs of the vestibule**
  (item 13), from the perineal body forward to the clitoris.
- `Ischiocavernosus muscle.l/.r` (both bodies): covering the **crus** (of
  the penis, from `Corpus cavernosum of penis`, or of the clitoris, item 13) along the **ischiopubic ramus**, from the ischial tuberosity forward.
- **Must not** intersect the external anal sphincter, the pelvic floor
  muscles or the hip bones.

**11. Anal canal and internal anal sphincter**: `Anal canal` (digestive /
digestive) and `Internal anal sphincter` (muscular / muscle); region
pelvis. Her terms: "Anal canal", "Anal columns".

- The anal canal is a 30–40 mm tube, Ø 15–20 mm, from the **anorectal
  junction**, where the rectum passes through the puborectalis sling
  (the lower end of the mesh "Sigmoid colon", which the app shows as
  **Rectum**), **down and back to the anus**. It runs inside the
  **external anal sphincter** (`External anal sphincter`).
- The internal anal sphincter is a 2–3 mm thick cuff, the thickened inner
  circular muscle, around the upper three quarters of the canal, inside
  the external sphincter.
- Optional: `Anal columns` as 6–10 small longitudinal ridges on the inner
  wall of the canal's upper half.

### Priority 2

**12. Pericardiacophrenic artery and vein**: `Pericardiacophrenic
artery.l/.r` (from `Internal thoracic artery`, near its origin) and
`Pericardiacophrenic vein.l/.r` (to the brachiocephalic or internal
thoracic vein). Both **accompany the phrenic nerve** to the diaphragm,
just beside it (1–2 mm). Cardiovascular; region thorax; Ø 1.2 mm. Her
term: "Pericardiacophrenic Vessels".

**13. Female external genitalia** (all `sex: "female"`; reproductive /
reproductive; region pelvis). Her terms: "Clitoris", "Glans clitoris",
"Crus of clitoris", "Suspensory ligament of clitoris", "Bulb of the
vestibule", "Greater vestibular gland(s) (Bartholin)", "Vaginal
vestibule", "Labia majora & minora", "Vulva and labia", "Mons pubis".

- `Clitoris` (group): parts `Glans of clitoris`, `Body of clitoris`,
  `Crus of clitoris.l/.r`.
  - The **crura** (each about 30 × 7 mm) run along the **ischiopubic
    rami** under the ischiocavernosus.
  - They join below the **pubic symphysis** into the body (about 20 mm),
    which bends down and forward to the **glans** (Ø about 5 mm), at the
    front of the vestibule.
- `Suspensory ligament of clitoris`: from the front of the **pubic
  symphysis** to the body of the clitoris.
- `Bulb of vestibule.l/.r`: elongated erectile masses, about 30 × 10 mm,
  **on each side of the vaginal orifice**, under the bulbospongiosus.
  Their front ends taper towards the glans.
- `Greater vestibular gland.l/.r`: pea-sized (Ø about 10 mm), at the
  **posterior ends of the bulbs** (5 and 7 o'clock on the vaginal
  orifice).
- `Vaginal vestibule`, `Labium minus.l/.r`, `Labium majus.l/.r`, `Mons
pubis`: thin skin-like surfaces (2–3 mm thick shells) around the
  vestibule, below `Vagina`'s lower end. They form the outermost layer:
  make them peelable surfaces and keep them thin.

**14. Female urethra**: `Urethra` with `sex: "female"` (the existing
`Urethra` is male-only). Urinary / urinary; region pelvis; 38–40 mm long,
Ø 6 mm. From the **neck of the female bladder** (`Neck of urinary bladder`,
in `female.glb`), **down and forward, anterior to the vagina** (embedded in
its front wall), behind the pubic symphysis. It ends at the **external
urethral orifice** in the vestibule, in front of the vaginal opening.

**15. Male: bulbourethral glands and cremaster** (`sex: "male"`).

- `Bulbourethral gland.l/.r`: pea-sized (Ø 8–10 mm), **posterolateral to
  the membranous urethra**, in the deep perineal pouch. Their ducts open
  into the spongy urethra. Her terms: "Bulbourethral gland(s)".
- `Cremaster muscle.l/.r`: thin loops of muscle **around the spermatic
  cord**, i.e. around `Ductus deferens` from the superficial inguinal ring
  (the medial end of `Inguinal ligament`) down to the `Testis`. Make it an
  open, loop-like sheet so the cord stays visible. Her terms: "Cremaster",
  "Cremaster m. & fascia".

**16. Infra-orbital nerve**: `Infra-orbital nerve.l/.r`; nervous / nerve;
region head; Ø 2 mm. It continues the **maxillary nerve** (`Maxillary
nerve`) through the **inferior orbital fissure** into the
**infra-orbital groove and canal** in the floor of the orbit. It exits at
the **infra-orbital foramen** below the orbit and fans into 3–4 short
branches (lower eyelid, nose, upper lip). It runs with the `Infra-orbital
artery` (1 mm beside it). Her term: "Infra-orbital nerve".

**17. Subcostal nerve**: `Subcostal nerve.l/.r`; nervous / nerve; region
abdomen; Ø 2 mm. The anterior ramus of **T12**, running **below the 12th
rib** (`Twelfth rib`) with the `Subcostal artery`. It passes **anterior to
quadratus lumborum** (`Quadratus lumborum muscle`) and behind the kidney,
then forward **between the transversus abdominis and the internal
oblique** (`Transversus abdominis muscle`, `Internal abdominal oblique
muscle`). Her term: "Subcostal nerve".

**18. Nerve to vastus medialis**: `Nerve to vastus medialis.l/.r`;
nervous / nerve; region lower-limb; Ø 1.5 mm. A branch of the **femoral
nerve** (`Femoral nerve`) in the femoral triangle. It descends **lateral to
the femoral artery** (`Femoral artery`) into the **adductor canal** and
enters **vastus medialis** (`Vastus medialis muscle`) from its medial
side. Her term: "Nerve to vastus medialis".

**19. Lingual artery and posterior auricular artery**: cardiovascular /
artery; Ø 2.5 and 1.5 mm. Her terms: "Lingual artery", "Posterior
auricular artery".

- `Lingual artery.l/.r` (region head): from the **external carotid at the
  tip of the hyoid's greater horn**, between the superior thyroid and
  facial arteries. It makes an **upward loop over the greater horn**, then
  runs forward **deep to hyoglossus** (`Hyoglossus muscle`; the hypoglossal
  nerve and lingual vein are superficial to it) into the tongue as the
  deep lingual artery.
- `Posterior auricular artery.l/.r` (region head): from the **back of the
  external carotid**, above the posterior belly of digastric. It ascends
  **between the auricle and the mastoid process**, next to the `Posterior
auricular vein`.

**20. Greater pancreatic artery**: `Greater pancreatic artery`;
cardiovascular / artery; region abdomen; Ø 1.5 mm. From the **middle of
the splenic artery**, entering the pancreas (`Pancreas`) at the junction
of its body and tail. Her term: "Greater pancreatic artery".

**21. Suboccipital nerve**: `Suboccipital nerve.l/.r`; nervous / nerve;
region back; Ø 1.5 mm. The **posterior ramus of C1**. It emerges between
the occipital bone and the **posterior arch of the atlas** (`Atlas (C1)`)
into the **suboccipital triangle**, among `Rectus posterior major capitis
muscle`, `Obliquus superior capitis muscle` and `Obliquus inferior capitis
muscle`, and sends short twigs to each. Her term: "Suboccipital nerve".

### Priority 3

**22. Tensor tympani and stapedius**: muscular / muscle; region head; mm
scale. Her terms: "Tensor tympani m.", "Pyramidal eminence & Stapedius
m.".

- `Tensor tympani muscle.l/.r`: in a canal **above the auditory tube**
  (`Auditory tube`). Its tendon turns laterally at the cochleariform
  process and inserts on the **handle of the malleus** (`Malleus`).
- `Stapedius muscle.l/.r`: from the pyramidal eminence on the posterior
  wall of the middle ear. Its tendon runs to the **neck of the stapes**
  (`Stapes`), next to the facial nerve (`Facial nerve (VII)`).

**23. Subcostal muscles**: `Subcostal muscles.l/.r`; muscular / muscle;
region thorax. Thin slips on the **inner surface of the posterior thoracic
wall**, near the angles of the lower ribs (about ribs 7–12), each crossing
1–2 ribs. Her term: "Subcostal Muscles".

**24. Scrotum** (`sex: "male"`): a thin shell (2 mm) around both testes
(`Testis`), with a midline septum (`Septum of scrotum`). It hides the
testes, so it must be peelable. Her terms: "Scrotum", "Septum of scrotum".

**Not in scope** (left out on purpose as coverings or spaces; her notes go
to their organs): fasciae (Camper's, Scarpa's, Colles', investing,
prevertebral, thoracolumbar, crural), peritoneum and its pouches and
recesses, retinacula, bursae, spaces and fossae (ischio-anal fossa,
pudendal canal, popliteal fossa, lumbar triangle), skin, CSF, bone marrow.

## 7. Integrating into the app (the contract)

1. `out/handmade.glb` → `npx tsx scripts/anatomy/z-anatomy/optimize-glb.ts
out/handmade.glb public/models/handmade/handmade.glb --simplify 0.5`.
   Copy the manifest to `src/data/anatomy/z-anatomy/manifest-handmade.json`.
2. `build.ts` → `MODEL_SOURCES`: add `Handmade: { license: "CC BY-SA 4.0",
attribution: "Hand-built schematic structures (this project, CC BY-SA
4.0), placed in the Z-Anatomy body.", credit: "Hand-built", commercialUse:
true }`.
3. `index.ts`: import the manifest into the entries, and add `{ id:
"handmade", url: "/models/handmade/handmade.glb" }` to the models (before
   `female`).
4. Female-only pieces: `sex: "female"` in the manifest. Male-only:
   `sex: "male"`. Male and female versions of one structure (external
   urethral sphincter, bulbospongiosus, urethra) share a **name**, and so
   an **id**. Each mesh carries its own `sex`; `datasetForSex` shows the
   right one. To make a mesh name unique where needed, put the side or
   variant in the mesh name: `"External urethral sphincter"` in the male
   pack and `"External urethral sphincter (female)"` mapped through
   `group: "External urethral sphincter"`. Then read `buildZAnatomyDataset`
   and confirm both resolve to one structure that exists in both bodies.
5. `dump-structures.ts`: add the manifest. Then rerun
   `course_names.py` and `summary_notes.py`, and add `synonyms.json` /
   `parents.json` entries for her terms in section 6 that still don't
   match. Check `.course-cache/summary/unmatched.json` before and after.
6. Tests in `build.test.ts`: every hand-built id exists with `modelSource:
"Handmade"`; female-only ones are absent from the male body and vice
   versa (`datasetForSex`); regions as specified; plus the existing mesh
   count test.
7. Docs, in the same commit: `scripts/anatomy/handmade/README.md` (method,
   landmarks, every offset's reason, how to rerun); `THIRD_PARTY_ASSETS.md`
   row; `docs/STATUS.md` (what exists, counts, next steps, session log);
   `docs/DECISIONS.md` (why procedural, the landmark method);
   `docs/CONTENT_REVIEW.md` (every new name, "schematic — please check");
   `docs/MODEL_SOURCES.md` ("Still without any open source" → built by
   hand).

## 8. Verification (all of it, before you say it's done)

1. The script's own clearance assertions pass, and it prints each
   structure's length, its nearest neighbours, and the worst penetration.
2. `npm run anatomy:validate`: 0 errors (every mesh-map entry has a real
   mesh node).
3. `npm run verify`: format, typecheck, lint, tests, validate, build.
4. Rerun the audit described in `docs/DECISIONS.md` → "Audit":
   1. `npx tsx scripts/anatomy/audit-extract.ts out.json public/models/…/*.glb`
      (including `handmade.glb`);
   2. sides: each `.l` mesh's centre has x > 0;
   3. regions by height;
   4. no mutual duplicates (≥ 60 % of each mesh within 1.5 mm of the
      other);
   5. nothing floating (every piece within 10 mm of something);
   6. no other-body structures in either body.
5. Screenshots: fresh `npm run build`, then `npx next start -p 3100` as a
   background task. Script Playwright like `e2e/explore.flow.ts`:
   - open `/explore?structure=<id>` for each new structure, with muscles
     hidden (legend switches) where they hide it;
   - press focus (`מיקוד`);
   - save front and side views (drag the canvas);
   - female pieces in the female body (set `localStorage["anatomy.settings"]`
     `bodySex: "female"` or use settings → Body).

   **Look at every screenshot**, and compare the course with the
   descriptions above: the phrenic nerve on scalenus anterior and in front
   of the lung root, the recurrent nerves hooking round the subclavian
   artery or the arch, the thoracic duct crossing at T4–T6.

6. `npm run e2e:smoke`: all checks green. Add one check, for example that
   the phrenic nerve is searchable and selectable in both bodies.
7. Push, and check the GitHub CI run for the commit.

## 9. Report back

List what was built, with screenshots, the clearance and audit results,
which of her summary terms now match (and which still don't, with the
reason), what was not built and why, and any anatomical uncertainty you
resolved and how. Ask the user before merging to `main`.

---

## Appendix: anchor coordinates (Blender frame, mm; measured 2026-10-06)

Centres and bounding boxes of existing meshes, as shipped. +x = the
body's left, −y = front, z = height. Long structures (vessels, nerves)
have wide boxes; use the meshes themselves, not these numbers, to place
anything.

**Neck: spine, larynx, muscles**

| Mesh name                    | Centre (x, y, z) mm | Box min → max (x, y, z) mm         |
| ---------------------------- | ------------------- | ---------------------------------- |
| Atlas (C1)                   | (0, 19, 1543)       | (-43, -3, 1533) → (43, 46, 1553)   |
| Axis (C2)                    | (0, 20, 1525)       | (-27, 0, 1509) → (27, 52, 1551)    |
| Vertebra C3                  | (0, 18, 1509)       | (-28, 0, 1493) → (28, 54, 1520)    |
| Vertebra C4                  | (0, 19, 1494)       | (-29, 0, 1481) → (29, 53, 1506)    |
| Vertebra C5                  | (0, 22, 1479)       | (-31, 2, 1469) → (31, 58, 1491)    |
| Vertebra C6                  | (0, 24, 1464)       | (-31, 3, 1454) → (31, 67, 1478)    |
| Vertebra C7                  | (0, 31, 1451)       | (-36, 7, 1439) → (36, 77, 1466)    |
| Vertebra T1                  | (0, 38, 1438)       | (-39, 11, 1423) → (39, 83, 1453)   |
| Hyoid bone                   | (0, -25, 1502)      | (-23, -39, 1492) → (23, -3, 1511)  |
| Thyroid cartilage            | (0, -12, 1478)      | (-21, -32, 1461) → (21, 0, 1499)   |
| Cricoid cartilage            | (0, -10, 1464)      | (-12, -20, 1457) → (12, -1, 1474)  |
| Trachea                      | (0, -1, 1410)       | (-14, -18, 1355) → (13, 21, 1461)  |
| Oesophagus                   | (2, 14, 1310)       | (-9, -18, 1194) → (18, 34, 1476)   |
| Thyroid gland                | (0, -12, 1470)      | (-24, -37, 1455) → (24, 5, 1489)   |
| Sternocleidomastoid muscle.l | (36, -15, 1472)     | (4, -64, 1382) → (61, 49, 1575)    |
| Scalenus anterior muscle.l   | (34, 1, 1455)       | (21, -8, 1411) → (55, 10, 1494)    |
| Scalenus medius muscle.l     | (36, 12, 1465)      | (24, 2, 1419) → (54, 27, 1519)     |
| Omohyoid muscle.l            | (60, 10, 1434)      | (12, -34, 1391) → (103, 60, 1498)  |
| Clavicle.l                   | (79, -2, 1409)      | (11, -51, 1389) → (154, 52, 1425)  |
| First rib.l                  | (44, 5, 1421)       | (16, -37, 1387) → (71, 34, 1447)   |
| Manubrium of sternum         | (0, -55, 1377)      | (-29, -84, 1350) → (28, -32, 1404) |
| Mastoid nodes.l              | (57, 15, 1559)      | (51, 6, 1550) → (61, 23, 1568)     |

**Neck and thorax: vessels and nerves**

| Mesh name                    | Centre (x, y, z) mm | Box min → max (x, y, z) mm           |
| ---------------------------- | ------------------- | ------------------------------------ |
| Left common carotid artery   | (21, -3, 1444)      | (12, -10, 1395) → (35, 4, 1487)      |
| Right common carotid artery  | (-22, -9, 1446)     | (-35, -21, 1410) → (-11, 4, 1487)    |
| External carotid artery.l    | (37, -3, 1524)      | (28, -7, 1486) → (46, 4, 1561)       |
| Internal jugular vein.l      | (32, -1, 1519)      | (20, -24, 1412) → (40, 20, 1574)     |
| Internal jugular vein.r      | (-32, -1, 1519)     | (-40, -24, 1412) → (-20, 20, 1574)   |
| Left subclavian artery       | (44, 2, 1415)       | (19, -4, 1389) → (81, 9, 1427)       |
| Right subclavian artery      | (-41, -1, 1418)     | (-81, -19, 1408) → (-11, 5, 1424)    |
| Left subclavian vein         | (54, -11, 1411)     | (23, -24, 1397) → (95, 1, 1417)      |
| Brachiocephalic trunk        | (1, -16, 1400)      | (-19, -22, 1382) → (17, -7, 1415)    |
| Left brachiocephalic vein    | (3, -25, 1392)      | (-25, -35, 1371) → (30, -13, 1415)   |
| Right brachiocephalic vein   | (-18, -21, 1389)    | (-29, -33, 1371) → (-4, -12, 1413)   |
| Ascending aorta              | (9, -26, 1334)      | (-10, -44, 1308) → (32, -4, 1364)    |
| Aortic arch                  | (15, -1, 1375)      | (-8, -42, 1355) → (32, 43, 1397)     |
| Thoracic aorta               | (17, 29, 1295)      | (-1, 1, 1205) → (31, 49, 1365)       |
| Abdominal aorta              | (8, -17, 1113)      | (-4, -40, 1029) → (19, 19, 1211)     |
| Azygos vein                  | (-12, 22, 1275)     | (-18, -15, 1151) → (-6, 38, 1366)    |
| Hemi-azygos vein             | (15, 32, 1219)      | (-16, 22, 1147) → (24, 43, 1249)     |
| Right atrium                 | (-15, -23, 1298)    | (-37, -66, 1246) → (8, 8, 1345)      |
| Left atrium                  | (22, 3, 1308)       | (-24, -55, 1263) → (66, 32, 1338)    |
| Diaphragm                    | (-2, -6, 1180)      | (-126, -101, 1042) → (125, 67, 1262) |
| Vagus nerve (X).l            | (16, 5, 1515)       | (2, -31, 1346) → (29, 43, 1576)      |
| Vagus nerve (X).r            | (16, -1, 1312)      | (-29, -43, 1105) → (70, 46, 1576)    |
| Sympathetic trunk.l          | (13, 29, 1373)      | (5, -5, 1133) → (25, 63, 1504)       |
| Accessory nerve (XI).l       | (28, 28, 1506)      | (3, -12, 1290) → (60, 112, 1570)     |
| Hypoglossal nerve (XII).l    | (13, -1, 1554)      | (1, -55, 1509) → (28, 21, 1574)      |
| Superior thyroid vein.l      | (40, -9, 1491)      | (17, -14, 1461) → (47, -1, 1510)     |
| Lingual vein.l               | (25, -31, 1537)     | (16, -52, 1527) → (32, -6, 1540)     |
| Lingual nerve.l              | (20, -33, 1533)     | (8, -62, 1519) → (31, -16, 1570)     |
| Facial artery.l              | (35, -44, 1524)     | (29, -70, 1508) → (41, -4, 1553)     |
| Posterior auricular vein.l   | (66, 19, 1585)      | (49, -7, 1562) → (77, 31, 1619)      |
| Occipital artery.l           | (47, 77, 1621)      | (31, -4, 1553) → (63, 103, 1679)     |
| Transverse cervical artery.l | (54, 4, 1451)       | (41, -5, 1430) → (62, 18, 1478)      |
| Thyrocervical trunk.l        | (41, -1, 1428)      | (40, -2, 1420) → (43, 2, 1433)       |
| Internal thoracic artery.l   | (23, -53, 1350)     | (14, -102, 1249) → (43, 2, 1422)     |
| Intercostal nerves.l         | (77, 1, 1256)       | (12, -105, 982) → (137, 90, 1435)    |

**Abdomen**

| Mesh name                   | Centre (x, y, z) mm | Box min → max (x, y, z) mm           |
| --------------------------- | ------------------- | ------------------------------------ |
| Vertebra T12                | (0, 43, 1143)       | (-23, -4, 1112) → (23, 77, 1166)     |
| Vertebra L1                 | (0, 36, 1106)       | (-37, -12, 1074) → (37, 71, 1134)    |
| Vertebra L2                 | (0, 31, 1076)       | (-42, -17, 1050) → (42, 66, 1100)    |
| Twelfth rib.l               | (51, 47, 1112)      | (19, 24, 1056) → (85, 68, 1154)      |
| Subcostal artery.l          | (33, 34, 1126)      | (-3, -10, 1071) → (74, 64, 1152)     |
| Quadratus lumborum muscle.l | (40, 54, 1051)      | (18, 29, 940) → (69, 74, 1147)       |
| Iliohypogastric nerve.l     | (67, 33, 1074)      | (14, -14, 1006) → (116, 44, 1133)    |
| Liver                       | (-23, -36, 1189)    | (-115, -99, 1091) → (92, 54, 1258)   |
| Gallbladder                 | (-48, -56, 1134)    | (-63, -80, 1115) → (-27, -32, 1159)  |
| Bile duct                   | (-30, -38, 1129)    | (-58, -41, 1089) → (-13, -29, 1163)  |
| Stomach                     | (44, -41, 1166)     | (-29, -89, 1104) → (105, 16, 1229)   |
| Spleen                      | (86, 7, 1158)       | (56, -43, 1126) → (114, 52, 1197)    |
| Pancreas                    | (6, -25, 1121)      | (-45, -48, 1079) → (73, 5, 1153)     |
| Splenic artery              | (69, -1, 1157)      | (4, -36, 1144) → (99, 18, 1169)      |
| Common hepatic artery       | (-4, -46, 1150)     | (-22, -62, 1144) → (10, -30, 1160)   |
| Proper hepatic artery       | (-72, -60, 1156)    | (-112, -74, 1144) → (-20, -46, 1173) |
| Gastroduodenal artery       | (-31, -78, 1137)    | (-35, -88, 1129) → (-20, -59, 1149)  |
| Left gastric artery         | (14, -43, 1169)     | (4, -57, 1154) → (22, -30, 1178)     |

**Pelvis and perineum**

| Mesh name                       | Centre (x, y, z) mm | Box min → max (x, y, z) mm       |
| ------------------------------- | ------------------- | -------------------------------- |
| Hip bone.l                      | (63, 12, 890)       | (3, -56, 797) → (135, 87, 1012)  |
| Pubic symphysis                 | (0, -43, 844)       | (-17, -56, 835) → (17, -30, 854) |
| Coccyx                          | (0, 77, 846)        | (-17, 67, 830) → (17, 86, 861)   |
| Obturator internus.l            | (49, 19, 848)       | (21, -24, 818) → (119, 58, 878)  |
| Pubococcygeus muscle.l          | (17, 35, 835)       | (0, -18, 815) → (33, 75, 863)    |
| Iliococcygeus muscle.l          | (28, 44, 844)       | (0, -5, 823) → (46, 70, 868)     |
| Tendinous arch of levator ani.l | (36, 14, 847)       | (23, -18, 834) → (47, 47, 868)   |
| External anal sphincter.l       | (5, 56, 810)        | (0, 45, 800) → (12, 68, 822)     |
| Sigmoid colon (shown as Rectum) | (0, 49, 871)        | (-26, 22, 804) → (35, 72, 926)   |
| Urethra                         | (0, -39, 801)       | (-2, -88, 745) → (2, 18, 831)    |
| Corpus spongiosum of penis      | (-1, -34, 795)      | (-11, -89, 747) → (10, 23, 819)  |
| Corpus cavernosum of penis      | (0, -47, 796)       | (-33, -101, 745) → (33, 34, 828) |
| Testis.l                        | (21, -56, 742)      | (10, -68, 727) → (31, -45, 756)  |
| Ductus deferens.l               | (31, -35, 822)      | (17, -57, 733) → (56, 34, 892)   |
| Inguinal ligament.l             | (76, -53, 897)      | (19, -57, 840) → (124, -48, 953) |
| Pudendal nerve.l                | (20, 57, 870)       | (9, -23, 814) → (29, 82, 930)    |
| Internal pudendal artery.l      | (41, 44, 867)       | (30, 16, 814) → (50, 56, 926)    |
| Vagina                          | (1, 36, 833)        | (-16, 30, 806) → (20, 46, 855)   |
| Cervix of uterus                | (3, 40, 866)        | (-8, 29, 854) → (14, 48, 877)    |
| Fundus of urinary bladder       | (1, 7, 850)         | (-21, -23, 835) → (21, 28, 861)  |

**Thigh**

| Mesh name                | Centre (x, y, z) mm | Box min → max (x, y, z) mm      |
| ------------------------ | ------------------- | ------------------------------- |
| Femoral nerve.l          | (61, -2, 968)       | (11, -44, 628) → (88, 29, 1101) |
| Saphenous nerve.l        | (53, 25, 421)       | (31, -48, 104) → (73, 105, 862) |
| Femoral artery.l         | (60, -31, 750)      | (45, -51, 560) → (77, 18, 898)  |
| Vastus medialis muscle.l | (69, -17, 578)      | (34, -49, 385) → (105, 19, 793) |

**Head: orbit and ear**

| Mesh name              | Centre (x, y, z) mm | Box min → max (x, y, z) mm        |
| ---------------------- | ------------------- | --------------------------------- |
| Infra-orbital artery.l | (27, -62, 1570)     | (23, -73, 1559) → (30, -46, 1576) |
| Maxillary nerve.l      | (23, -57, 1571)     | (11, -79, 1544) → (33, -2, 1600)  |
| Tympanic membrane.l    | (48, 4, 1578)       | (46, -1, 1574) → (51, 10, 1582)   |
| Malleus.l              | (48, 4, 1582)       | (46, 2, 1578) → (50, 5, 1586)     |
| Incus.l                | (47, 6, 1583)       | (45, 5, 1580) → (49, 10, 1586)    |
| Stapes.l               | (43, 5, 1581)       | (41, 3, 1580) → (45, 6, 1582)     |
| Auditory tube.l        | (20, -6, 1580)      | (9, -14, 1576) → (30, 2, 1583)    |
| Chorda tympani.l       | (30, -6, 1569)      | (26, -17, 1556) → (37, 6, 1580)   |
| Facial nerve (VII).l   | (44, -25, 1564)     | (0, -87, 1508) → (66, 17, 1624)   |
| Cochlea.l              | (40, -1, 1580)      | (36, -5, 1576) → (43, 5, 1584)    |
