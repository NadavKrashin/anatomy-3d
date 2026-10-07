# Hand-built structures

Structures that no open 3D model has, built procedurally and placed in the
Z-Anatomy body from landmarks measured on its own meshes. The brief they
follow is `docs/HANDMADE_MODELS_PROMPT.md`; the decision is in
`docs/DECISIONS.md` → "Hand-built structures". Output:
`public/models/handmade/handmade.glb` and
`src/data/anatomy/z-anatomy/manifest-handmade.json` (source `Handmade`, the
project's own work, CC BY-SA 4.0).

Built: **priorities 1 and 2** of the brief (items 1–21; 16 and 18 are cut
out of existing Z-Anatomy meshes instead, below). Each one is
_schematic in shape, never in position_: the course follows textbook anatomy
(Gray's Anatomy for Students, Moore, Netter) between real landmarks of our
model, and is checked against every neighbouring mesh.

| Item | Meshes                                                                                                                                                                                                                                                                                                                                                                  |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | `Phrenic nerve.l/.r` (C3–C5 roots, trunk, 4 terminal branches on/through the diaphragm)                                                                                                                                                                                                                                                                                 |
| 2    | `Left/Right recurrent laryngeal nerve`                                                                                                                                                                                                                                                                                                                                  |
| 3    | `Superior laryngeal nerve.l/.r` (trunk, group), `Internal/External branch of superior laryngeal nerve.l/.r`                                                                                                                                                                                                                                                             |
| 4    | `Superior/Inferior root of ansa cervicalis.l/.r`, `Ansa cervicalis.l/.r` (loop, group), `Muscular branches of ansa cervicalis.l/.r`                                                                                                                                                                                                                                     |
| 5    | `Lesser occipital nerve`, `Great auricular nerve`, `Transverse cervical nerve`, `Supraclavicular nerves` (.l/.r)                                                                                                                                                                                                                                                        |
| 6    | `Superior thyroid artery.l/.r` (with glandular branches), `Superior laryngeal artery.l/.r`                                                                                                                                                                                                                                                                              |
| 7    | `Thoracic duct`, `Cisterna chyli`                                                                                                                                                                                                                                                                                                                                       |
| 8    | `Cystic artery` (with superficial and deep branches)                                                                                                                                                                                                                                                                                                                    |
| 9    | `Short gastric arteries` (4 vessels, one structure)                                                                                                                                                                                                                                                                                                                     |
| 10   | `Perineal body`, `Superficial/Deep transverse perineal muscle.l/.r`, `External urethral sphincter` (male ring; female parts `Sphincter urethrae`, `Compressor urethrae`, `Urethrovaginal sphincter`), `Bulbospongiosus muscle` (male, one muscle with a raphe; female `.l/.r` parts), `Ischiocavernosus muscle.l/.r` (male) and `Ischiocavernosus muscle (female).l/.r` |
| 11   | `Anal canal`, `Internal anal sphincter`                                                                                                                                                                                                                                                                                                                                 |
| 12   | `Pericardiacophrenic artery.l/.r`, `Pericardiacophrenic vein.l/.r` (along the phrenic nerve)                                                                                                                                                                                                                                                                            |
| 13   | Female: `Glans/Body of clitoris`, `Crus of clitoris.l/.r` (group `Clitoris`), `Suspensory ligament of clitoris`, `Bulb of vestibule.l/.r`, `Greater vestibular gland.l/.r` (with ducts), `Vaginal vestibule`, `Labium minus.l/.r`, `Labium majus.l/.r`, `Mons pubis`                                                                                                    |
| 14   | Female: `Urethra (female)` (one structure with the male `Urethra`)                                                                                                                                                                                                                                                                                                      |
| 15   | Male: `Bulbourethral gland.l/.r` (with ducts), `Cremaster muscle.l/.r`                                                                                                                                                                                                                                                                                                  |
| 16   | `Infra-orbital nerve.l/.r` — cut out of Z-Anatomy's `Maxillary nerve` (`scripts/anatomy/z-anatomy/split-meshes.ts`)                                                                                                                                                                                                                                                     |
| 17   | `Subcostal nerve.l/.r`                                                                                                                                                                                                                                                                                                                                                  |
| 18   | `Nerve to vastus medialis.l/.r` — cut out of Z-Anatomy's `Femoral nerve` (`split-meshes.ts`)                                                                                                                                                                                                                                                                            |
| 19   | `Lingual artery.l/.r` (with the deep lingual artery), `Posterior auricular artery.l/.r`                                                                                                                                                                                                                                                                                 |
| 20   | `Greater pancreatic artery`                                                                                                                                                                                                                                                                                                                                             |
| 21   | `Suboccipital nerve.l/.r` (with twigs to the suboccipital muscles and semispinalis capitis)                                                                                                                                                                                                                                                                             |
| 22   | `Tensor tympani muscle.l/.r` (belly and tendon to the malleus), `Stapedius muscle.l/.r` (belly beside the facial nerve, tendon to the stapes' neck)                                                                                                                                                                                                                     |
| 23   | `Subcostal muscles.l/.r` (four slips: ribs 7→9, 8→10, 9→11, 10→12)                                                                                                                                                                                                                                                                                                      |
| 24   | Male: `Scrotum` (2 mm pouch, open at its root), `Septum of scrotum`                                                                                                                                                                                                                                                                                                     |

## Rerun

```bash
# 1. Blender as a Python module (once): Python 3.11 venv, bpy 4.5, numpy
python3.11 -m venv ~/bpyenv && ~/bpyenv/bin/pip install "bpy==4.5.*"
# 2. Decode the shipped GLBs (meshopt) so Blender can read them
mkdir -p out/decoded
for f in public/models/z-anatomy/*.glb public/models/open3dmodel/extras.glb \
         public/models/bodyparts3d/extras.glb public/models/hra/female.glb \
         public/models/non-commercial/non-commercial.glb; do
  npx tsx scripts/anatomy/decode-glb.ts "$f" "out/decoded/$(basename $(dirname $f))-$(basename $f)"
done
# 3. Build (≈ 25 min; asserts clearance, prints a report)
~/bpyenv/bin/python scripts/anatomy/handmade/build_handmade.py -- \
  out/decoded out/handmade.glb out/manifest-handmade.json
# 4. Compress and install
npx tsx scripts/anatomy/z-anatomy/optimize-glb.ts out/handmade.glb \
  public/models/handmade/handmade.glb --simplify 0.5
cp out/manifest-handmade.json src/data/anatomy/z-anatomy/manifest-handmade.json
npm run anatomy:validate && npm test
```

Options: `--only <regex>` builds matching structures only (no export; for
iterating), `--preview out/p.npz` saves meshes and centre lines for plots,
`HANDMADE_DEBUG=1` prints each relaxation step. The first run caches the
decoded body in `out/decoded/body-cache.npz` (rebuilt when a GLB is newer).

## Files

- `clearance-report.txt` — that report from the last full build.
- `plot_perineum.py` — the perineum from below in both bodies, a review
  image (the app's camera can't look up between the thighs).
- `contact_sheets.py` — the review shots (`e2e/handmade-shots.ts`) as one
  sheet per region.
- `audit_handmade.py` — the audit of `docs/DECISIONS.md` → "Audit" for these meshes (sides, regions by height, mutual duplicates, floating parts), on the shipped GLBs; usage in its docstring.
- `build_handmade.py` — entry point: builds everything, runs the clearance
  check on every piece, prints length / worst penetration / smallest gap /
  nearest neighbours per structure, exports the GLB and manifest.
- `body_cache.py` — the decoded GLBs as numpy arrays (Blender frame: metres,
  Z up, +X = the body's left, −Y = anterior).
- `landmarks.py` — queries on named meshes (extreme vertices, ray casts,
  nearest points, slabs, cross-sections cut from the triangles — the
  meshes are too coarse for vertex slabs) and the clearance machinery
  (below).
- `shapes.py` — centripetal Catmull-Rom paths resampled every 2 mm,
  parallel-transport tubes (10–12 segments, capped, tapered), flat bands,
  sleeves (sphincter cuffs), ellipsoids, spindles, curved sheets (`arc_band`).
- `parts.py` — `Part` (one mesh, one manifest entry) made of `Piece`s (trunk,
  roots, branches) each with its own allowances; `Builder.vessel` (spline →
  relax → fit radius → tube), `Builder.free` (nearest roomy spot for a
  point pinned at both ends of tubes).
- `structures_neck.py` (items 1–6), `structures_trunk.py` (7–9, 12, 17,
  20), `structures_pelvis.py` (10–11, 13–15), `structures_head.py` (19,
  21): every landmark and offset with its reason, in the code next to it.

## Method

1. **Landmarks from meshes**, never hard-coded coordinates: e.g. the
   anterior tubercle of C4 = the vertex of `Vertebra C4` furthest lateral in
   front of the foramen transversarium; the front of scalenus anterior = a
   ray cast from the front at a height; the heart's border = its most
   lateral vertex in front of the lung root at a height.
2. **Control points = landmark + stated offset** (e.g. "radius + 1 mm in
   front of scalenus anterior: the nerve lies on it under the prevertebral
   fascia"; "4 mm outside the heart: on the fibrous pericardium").
3. **Relaxation**: the control points of the spline (one every 6 mm, then
   3 mm) move by the pushes their 2 mm samples need until every sample keeps
   radius + 0.9 mm from every mesh it must not touch; the displacement (not
   the shape) is smoothed, so hooks and loops survive. Ends are pinned.
4. **Inside or outside** is decided per mesh (meshes nest in this model: the
   left vagus runs inside the aortic arch) with the generalized winding
   number (Jacobson et al. 2013) — robust to the open vessel tubes and
   double-walled sheets here, where ray parity and normals fail. It runs only
   where the nearest face suggests "inside" and closer than the mesh's
   greatest possible depth (3·volume/area). The face's normal is taken
   outward by the mesh's orientation (`Body.facing`: the sign of its
   signed volume, about the world origin and about its own centroid);
   where the two disagree (≈ 490 meshes: open tubes far from the origin,
   inconsistently wound triangles) the winding number decides for every
   nearby point. The final check (6) uses the winding number for every
   point near enough to be inside, whatever the normals say.
   Until 2026-10-07 (priority 3) the raw normal was used: about 1,200 body
   meshes (mirrored sides, mostly left) have inverted triangles, so points
   inside them were never confirmed — the check and the relaxation missed
   them (the left phrenic nerve ran through scalenus medius, the ansa's
   superior root through the SCM and the internal jugular vein). Every
   structure was rebuilt and rechecked with the fix.
5. **Fit**: where neighbours leave less room than the nominal diameter the
   tube narrows locally (never below half).
6. **Check** (asserted): no vertex inside a mesh it may not enter; at least
   0.5 mm from every mesh it should not touch, except at its own origin and
   ending.

## Allowances (each with its reason, in the code)

- `start` / `end`: meshes a piece may touch near its origin or ending (its
  parent nerve, the bone or muscle it reaches).
- `touch`: may lie against, never inside — a nerve on a muscle under its
  fascia, the ansa on the carotid sheath, a duct on the vertebral bodies,
  the perineal muscles meeting in the perineal body, the ansa's inferior
  root and omohyoid twig crossing in front of the phrenic nerve (the loop
  itself keeps clear of it), companions running
  together (superior thyroid artery and external laryngeal nerve).
- `squeeze` + `depth`: may sink into a soft organ, at most `depth`, reported
  — only where the model leaves no room:
  - phrenic nerve into the lungs (≤ 5.5 mm): the model's lungs lie directly
    on the heart and the aortic arch, with no pleura or pericardium between;
  - right recurrent laryngeal nerve into the right lung apex and its apical
    vessels (≤ 5 mm): the apex rises round the subclavian artery (no
    cervical pleura), so the hook under the artery lies in its surface;
  - left recurrent laryngeal nerve into the trachea / oesophagus / left main
    bronchus wall (≤ 3 mm) and both into the thyroid lobe's back (≤ 2.5 mm):
    the arch lies on the trachea's left side;
  - thoracic duct into the oesophagus, left atrium wall or diaphragm crus
    (≤ 2.5 mm): they lie almost on the spine at T6–T8 and round the hiatus;
  - short gastric arteries into stomach / spleen (≤ 2.5 mm): the two organs
    touch along their facing surfaces (no gastrosplenic gap);
  - cystic artery's deep branch into the gallbladder bed (≤ 2 mm);
  - cervical plexus branches through the platysma (≤ 1.5 mm); ansa into the
    SCM (≤ 1.5 mm, the IJV passes through it here);
  - male external urethral sphincter into the prostate apex / bulb / crura
    (≤ 2 mm); internal anal sphincter into the external one (≤ 2 mm), the
    anal canal into its front rim where it bends out of the rectum (≤ 1.5 mm);
    male bulbospongiosus into the crura where they abut the bulb (≤ 1 mm);
    the anal canal and internal sphincter into the pararectal nodes on the
    rectum's end (≤ 1.5 / 2 mm);
  - subcostal muscles into the lungs and the diaphragm's back (≤ 3.5 mm;
    ≤ 4 mm for the lowest slip), which lie on the thoracic wall.
- `anywhere`: the middle ear's muscles inside the temporal bone (one closed
  mesh, no cavity); the superficial external pudendal vessels in the
  scrotum's wall (they run down over the testes' front: its anterior
  scrotal branches).

## Model quirks met (Z-Anatomy and the fitted female organs)

- The left vagus runs **through** the aortic arch (z 1372–1396 mm): the left
  recurrent nerve starts where it leaves the arch's underside and hooks
  under the arch beside the ligamentum arteriosum node.
- The right vagus lies just **behind** the subclavian artery's first part
  and reaches above it (textbook: it crosses in front): the right recurrent
  nerve leaves it above the artery and hooks round it — in front, under,
  behind — 6 mm lateral to the brachiocephalic bifurcation, flat under the
  whole artery (radius + 1.5 mm below its lowest point within ± 4 mm: the
  underside slopes down medially), then medially behind the vagus to the
  groove. Further laterally the lung apex fills the space under the artery.
  Fixed 2026-10-07 after review: it used to pass round the artery's medial
  end beside the bifurcation, with artery above and below it. Check: the
  artery lies directly above all of its lowest 15 % of points and below none
  (as for the left nerve under the arch); its underside is 2.3 mm above the
  lowest point.
- Its tight hook (≈ 10 mm) is relaxed with control points every 3 mm (6 mm
  elsewhere), so the relaxation keeps its shape.
- The internal jugular vein lies in front of the carotids from the
  bifurcation up (textbook: lateral), pressed against the SCM: the ansa's
  superior root descends medial to it, in front of the carotids. Fixed
  2026-10-07 (priority 3): it used to pass in front of the vein, through
  it and the SCM — hidden by the inside-test bug (Method 4).
- The common carotid encloses the front of scalenus anterior at z 1470–1490:
  the phrenic nerve's first 2 cm run just lateral to the muscle.
- The superior thyroid vein starts far laterally: the artery takes the
  textbook course instead of following the vein.
- The right renal artery lies on the L1 body: the thoracic duct passes just
  in front of it; the IVC and aorta leave only a small triangle on the
  spine, so the cisterna chyli is 20 × 5 × 4 mm (textbook 8 × 6 mm across).
- The external anal sphincter is a small ring (inner radius ≈ 6 mm) tilted
  45°: the anal canal follows its axis and is ≈ 11 mm wide (textbook
  15–20 mm). The rectum's ("Sigmoid colon") lower end lies 8 mm in front of
  that axis, just above the ring: the canal starts inside the rectum's lower
  end (1 mm into its wall and 2.5 mm up, so its start cap stays inside) and
  bends back into the axis (the anorectal flexure). Fixed
  2026-10-07 after review: it used to start on the axis, 3 mm short of the
  rectum, leaving a visible gap.
- The Atlas vagina sits far back in our male pelvis: the female urethra's
  course (used for the female sphincter; the urethra itself is item 14) is
  nearly vertical in front of it.
- The middle ear: the temporal bone is one closed mesh (no tympanic
  cavity or canals), so the ear's muscles may lie anywhere inside it. The
  auditory tube ends 10 mm medial to the cavity, short of the cochlea; the
  facial nerve lies on its end, and the temporomandibular disc and the
  temporal lobe reach into the bone in front of the cochlea, leaving ~1 mm.
  A clearance-grid search (0.25 mm) found one corridor with room for the
  tensor tympani: from the tube's end forward round the cochlea, then back
  along the cavity's anterior wall to the cochleariform process — so the
  muscle hooks forward (≈ 40 mm belly, textbook ≈ 20 mm). These muscles are
  sampled every 0.5 mm and not relaxed (relaxing so fine a path makes it
  zig-zag); their control points are each placed with room and the tube
  narrows where needed.
- The lower ribs' inner surface bulges under a slip's edges: the subcostal
  slips are offset from the wall across their whole width. The model's
  lungs and the diaphragm's back lie on the wall, so the slips sink into
  them by about their thickness (≤ 3.5 mm; ≤ 4 mm for the lowest slip).
- The testes hang close to the thighs: the scrotum's root lies against
  adductor longus and gracilis (allowed within 12 mm of its rim).
- No skin or investing fascia: the supraclavicular nerves, which run in
  the roof of the posterior triangle, lie up to 23 mm from any mesh there
  (the audit's only finding).
- Female external genitalia are not built yet (item 13): the female
  bulbospongiosus and ischiocavernosus lie where the vestibular bulbs and
  the clitoris' crura belong.
