# Hand-built structures

Structures that no open 3D model has, built procedurally and placed in the
Z-Anatomy body from landmarks measured on its own meshes. The brief they
follow is `docs/HANDMADE_MODELS_PROMPT.md`; the decision is in
`docs/DECISIONS.md` → "Hand-built structures". Output:
`public/models/handmade/handmade.glb` and
`src/data/anatomy/z-anatomy/manifest-handmade.json` (source `Handmade`, the
project's own work, CC BY-SA 4.0).

Built so far: **priority 1** of the brief (items 1–11). Each one is
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
# 3. Build (≈ 15 min; asserts clearance, prints a report)
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
- `structures_neck.py` (items 1–6), `structures_trunk.py` (7–9),
  `structures_pelvis.py` (10–11): every landmark and offset with its reason,
  in the code next to it.

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
   greatest possible depth (3·volume/area).
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
  - phrenic nerve into the lungs (≤ 5 mm): the model's lungs lie directly on
    the heart, with no pleura or pericardium between;
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
    (≤ 2 mm); internal anal sphincter into the external one (≤ 2 mm);
    male bulbospongiosus into the crura where they abut the bulb (≤ 1 mm).

## Model quirks met (Z-Anatomy and the fitted female organs)

- The left vagus runs **through** the aortic arch (z 1372–1396 mm): the left
  recurrent nerve starts where it leaves the arch's underside and hooks
  under the arch beside the ligamentum arteriosum node.
- The right vagus lies medial to the subclavian artery's first part: the
  right recurrent nerve leaves it laterally and hooks under and behind the
  artery.
- The common carotid encloses the front of scalenus anterior at z 1470–1490:
  the phrenic nerve's first 2 cm run just lateral to the muscle.
- The superior thyroid vein starts far laterally: the artery takes the
  textbook course instead of following the vein.
- The right renal artery lies on the L1 body: the thoracic duct passes just
  in front of it; the IVC and aorta leave only a small triangle on the
  spine, so the cisterna chyli is 20 × 5 × 4 mm (textbook 8 × 6 mm across).
- The external anal sphincter is a small ring (inner radius ≈ 6 mm) tilted
  45°: the anal canal follows its axis and is ≈ 11 mm wide (textbook
  15–20 mm).
- The Atlas vagina sits far back in our male pelvis: the female urethra's
  course (used for the female sphincter; the urethra itself is item 14) is
  nearly vertical in front of it.
- No skin or investing fascia: the supraclavicular nerves, which run in
  the roof of the posterior triangle, lie up to 23 mm from any mesh there
  (the audit's only finding).
- Female external genitalia are not built yet (item 13): the female
  bulbospongiosus and ischiocavernosus lie where the vestibular bulbs and
  the clitoris' crura belong.
