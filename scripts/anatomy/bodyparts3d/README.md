# BodyParts3D pieces

Small structures Z-Anatomy lacks, from
[BodyParts3D 4.0](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html)
(DBCLS, **CC BY-SA 2.1 JP**) — the model Z-Anatomy itself was built from.
Why this source: `docs/MODEL_SOURCES.md`.

Output: `public/models/bodyparts3d/extras.glb` and
`src/data/anatomy/z-anatomy/manifest-bp3d.json` (`pack: "bodyparts3d"`,
`source: "BodyParts3D"`): small and anterior cardiac veins; right gastric,
dorsal pancreatic, anterior/posterior superior pancreaticoduodenal and
gastro-omental arteries; gastric veins; a bronchial artery; frontal,
lacrimal and supra-orbital nerves; levator veli palatini and semispinalis
capitis; dorsal scapular arteries (23 meshes).

## Regenerate

```sh
# isa_BP3D_4.0_obj_99.zip (136 MB), isa_element_parts.txt and
# partof_element_parts.txt from the download page above, unzipped into BP/
python scripts/anatomy/bodyparts3d/export_bp3d.py -- path/to/out/body BP out/bodyparts3d.glb out/manifest-bp3d.json
npx tsx scripts/anatomy/z-anatomy/optimize-glb.ts out/bodyparts3d.glb public/models/bodyparts3d/extras.glb --simplify 0.5
cp out/manifest-bp3d.json src/data/anatomy/z-anatomy/manifest-bp3d.json
npm run format
```

`path/to/out/body` = the raw Z-Anatomy packs of `../z-anatomy/export_glb.py`.
Then rerun the course names and her notes (`dump-structures.ts`,
`course_names.py`, `summary_notes.py`).

## Fit

BodyParts3D is in millimetres in its own frame, and Z-Anatomy remodelled
parts of it, so one global transform is ~12 mm off (median). The script:

1. finds anchors — Z-Anatomy meshes whose name matches a BodyParts3D
   concept with exactly one file ("Femur.l" ↔ "left femur"; 607 of them);
2. fits a global affine to the anchors' centres (trimmed to the best 70%);
3. for each new structure, runs ICP on the anchors within 7 cm (at least 6) to get a local similarity correction — last run 0.6–3.3 mm median
   residual on those anchors.

## Not taken

- **Rectum:** BodyParts3D's rectum is the same tube as Z-Anatomy's
  "Sigmoid colon" mesh (84% of it within 1 cm), which is in fact the
  rectum. The app relabels that mesh (`RELABEL` in
  `src/data/anatomy/z-anatomy/build.ts`); see `docs/DECISIONS.md`.
- The kidney (Z-Anatomy's non-commercial one is in use) and BodyParts3D's
  other new concepts are mostly groupings ("abdomen proper") or already in
  Z-Anatomy under other names.
