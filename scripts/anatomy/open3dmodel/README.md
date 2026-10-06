# Open3DModel extras

Adds the pieces the Z-Anatomy model lacks from
[Open3DModel](https://anatomytool.org/open3dmodel) (AnatomyTOOL: Leiden,
Utrecht, Maastricht, KU Leuven; **CC BY-SA**). Open3DModel is built on
Z-Anatomy, so it uses the same body and coordinates and its meshes drop in
unchanged. Why this source: `docs/MODEL_SOURCES.md`.

Output: `public/models/open3dmodel/extras.glb` (the sixth model file,
streamed last) and `src/data/anatomy/z-anatomy/manifest-open3d.json` (its
entries, `pack: "extras"`, `source: "Open3DModel"`). `index.ts` builds the
dataset from both manifests; structures from this file carry Open3DModel as
their source and attribution.

## Regenerate

Needs the Blender Python venv from `scripts/anatomy/z-anatomy/README.md`
(the files are Draco-compressed) and the raw Z-Anatomy packs (`out/body/`
of that pipeline, with its `manifest.json` next to the folder).

```sh
O=path/to/o3d
# download https://caskanatomy.info/open3dmodelfiles/<m>/<m>-glb.zip for
# m = upper-limb, lower-limb, hand, unzip, and save the GLB inside as $O/<m>.glb
python export_open3d.py -- path/to/out/body $O $O/extras.glb $O/manifest.json --analyse   # report only
python export_open3d.py -- path/to/out/body $O $O/extras.glb $O/manifest.json
npx tsx scripts/anatomy/z-anatomy/optimize-glb.ts $O/extras.glb public/models/open3dmodel/extras.glb --simplify 0.5
cp $O/manifest.json src/data/anatomy/z-anatomy/manifest-open3d.json
npm run format
```

Then rerun the course names and her notes so they reach the new
structures (`scripts/course/medintzfat/dump-structures.ts`, `course_names.py`,
`scripts/course/summary/summary_notes.py`).

## What it keeps

- Only arteries, veins, nerves, muscles and ligaments. Bones and cartilages
  exist already; coverings (fasciae, bursae, sheaths, retinacula, capsules,
  the "Overlays" spaces) would hide what is inside, as in the main export.
- Nothing Z-Anatomy already has: the same normalised name, a mesh in the
  same box (≤ 6 mm on every side) or the same place (centre within 8 mm,
  extents within 25 %) of the same tissue, or a pair listed by hand in
  `renames.json` → `sameAs` (Open3DModel names some pieces differently, e.g.
  "Deep artery of the thigh" for our "Deep femoral artery").
- `renames.json` → `renames` fixes spelling and Open3DModel-only wordings
  ("Bifurcatum ligament" → "Bifurcate ligament", "L1 root" → "L1 anterior
  ramus"). Branch names are written like Z-Anatomy's ("Radial nerve
  (superficial br)" → "Superficial branch of radial nerve").
- The upper limb is right-sided only, so each right piece without a left
  twin is mirrored (x → −x) as the left one. Z-Anatomy is exactly symmetric,
  so the mirror lands on the left limb.
- Region: the limb of the source file, except trunk pieces (plexuses, rami,
  trunk nerves), placed by height like the main export. The brachial plexus
  stays in the upper limb.

Last run: 103 pieces kept → 206 meshes (with mirrors), 320k vertices before
simplifying; 1.8 MB after.
