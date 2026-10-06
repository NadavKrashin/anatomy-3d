# Female organs (Human Reference Atlas)

The app's female body (settings → Body) shows these instead of the male
organs. Source: the Human Reference Atlas 3D reference organs of the
Visible Human Female (HuBMAP, **CC BY 4.0**), from
[ccf-3d-reference-object-library](https://github.com/hubmapconsortium/ccf-3d-reference-object-library).
Why this source and the options the user chose from: `docs/DECISIONS.md` →
"Male/female model switch" and "Male/female switch: one body, female organs
fitted in".

Output: `public/models/hra/female.glb` (loaded only in the female body) and
`src/data/anatomy/z-anatomy/manifest-female.json` (`pack: "female"`,
`sex: "female"`, `source: "Human Reference Atlas"`).

## Regenerate

Needs the Blender Python venv (`scripts/anatomy/z-anatomy/README.md`) and
the raw Z-Anatomy packs written by `export_glb.py` (`skeleton.glb`,
`muscles.glb`, `organs.glb`).

```sh
git clone --filter=blob:none --no-checkout https://github.com/hubmapconsortium/ccf-3d-reference-object-library.git ccf3d
cd ccf3d
for f in v1.2/VH_F_Uterus v1.2/VH_F_Vagina v1.2/VH_F_Ovary_L v1.2/VH_F_Ovary_R \
  v1.2/VH_F_Fallopian_Tube_L v1.2/VH_F_Fallopian_Tube_R v1.2/VH_F_Ligaments_Uterus_Ovaries \
  v1.2/VH_F_Pelvis v1.2/VH_F_Urinary_Bladder v1.3/VH_F_mammary_gland_L v1.3/VH_F_mammary_gland_R; do
  git checkout HEAD -- "VH_Female/$f.glb"
done
cd -
# run from the repo root (a script named like a stdlib module breaks bpy)
python scripts/anatomy/hra/export_hra.py -- path/to/out/body ccf3d/VH_Female out/female.glb out/manifest-female.json
npx tsx scripts/anatomy/z-anatomy/optimize-glb.ts out/female.glb public/models/hra/female.glb --simplify 0.5
cp out/manifest-female.json src/data/anatomy/z-anatomy/manifest-female.json
npm run format
```

Then rerun the course names and her notes (`dump-structures.ts`,
`course_names.py`, `summary_notes.py`).

## Placement

- **Pelvic organs:** trimmed ICP finds a similarity transform (rotation,
  uniform scale, translation) from the Atlas's bony pelvis to Z-Anatomy's
  hip bones, sacrum and coccyx (last run: scale 0.81, median 4 mm). A
  female pelvis is shallower than the male one we fit to, so the organs are
  then shifted so the Atlas bladder's centre sits on Z-Anatomy's bladder
  (27 mm back), where our ureters end.
- **Breasts:** same rotation and scale; the nipple goes on the
  midclavicular line (middle of the clavicle) at the 4th intercostal space
  (between the 4th and 5th ribs there); then every vertex moves front/back
  by the gap between the breast's back surface and the chest wall (ray-cast
  depth maps), so the breast lies on the pectoralis.
- Big meshes are welded and decimated to ≤ 6,000 vertices each.

## What it keeps

Uterus (fundus, body, lower uterine segment, cervix, internal/external
cervical os, cornua), vagina (+ cervicovaginal junction), ovaries, uterine
tubes (ampulla, isthmus, infundibulum, fimbriae), round, ovarian,
suspensory, cardinal and uterosacral ligaments, the bladder's parts
(fundus, dome, trigone, neck, ureteric orifices — parts of the shared
"Urinary bladder") and breasts (nipple, areola, areolar tubercles, fatty
tissue, lobes, lactiferous ducts and sinuses, suspensory ligaments).

Left out: the uterine anterior/posterior walls (same surfaces as body and
fundus), broad ligament, mesosalpinx, mesovarium and uterovesical pouch
(peritoneal coverings), the abdominal ostium (labelled at the uterine end).
