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

# Kidneys (Human Reference Atlas, male, both bodies)

They replace Z-Anatomy's non-commercial kidney (lissiecowley, CC BY-NC
4.0), so that only the inner ear keeps the app non-commercial (user
decision 2026-10-07; `docs/HANDMADE_MODELS_PROMPT.md` item 25). The male set,
because the kidney is shared by both bodies (no `sex`).

Output: `public/models/hra/kidney.glb` (loaded in both bodies) and
`src/data/anatomy/z-anatomy/manifest-hra-kidney.json` (`pack: "hra-kidney"`,
`source: "Human Reference Atlas"`).

## Regenerate

```sh
git clone --filter=blob:none --no-checkout https://github.com/hubmapconsortium/ccf-3d-reference-object-library.git ccf3d
cd ccf3d
for f in VH_M_Kidney_L VH_M_Kidney_R VH_M_Ureter_L VH_M_Ureter_R VH_M_Blood_Vasculature_Kidney; do
  git checkout HEAD -- "VH_Male/v1.2/$f.glb"
done
cd -
# needs out/decoded (scripts/anatomy/handmade/README.md → Rerun, steps 1–2) for the checks
~/bpyenv/bin/python scripts/anatomy/hra/export_hra_kidney.py -- ccf3d/VH_Male out/kidney.glb out/manifest-hra-kidney.json
npx tsx scripts/anatomy/z-anatomy/optimize-glb.ts out/kidney.glb public/models/hra/kidney.glb --simplify 0.5
cp out/manifest-hra-kidney.json src/data/anatomy/z-anatomy/manifest-hra-kidney.json
npm run format
```

The placement is read from `kidney-fit.json`. `--fit <decoded dir>`
recomputes it from a decoded copy of the old non-commercial file (from git
history, before 2026-10-08), whose kidney it was fitted to; ≈ 20 min.

## Placement and checks

- Per side, trimmed ICP (similarity: rotation, uniform scale, translation)
  from the Atlas's kidney capsule to the kidney it replaces (last run:
  scale 0.81 left / 0.86 right, median distance 2.4 / 2.9 mm).
- Then a translation out of the liver, spleen, psoas major and quadratus
  lumborum until no capsule vertex is inside them (the old kidney sat 5–8 %
  inside psoas and 3 % inside the spleen or liver).
- Checked on every run (asserted): hilum facing medially and forward; upper
  pole at T12, lower pole at L3, right kidney lower; the renal pelvis meets
  Z-Anatomy's ureter, its renal artery (through its anterior and posterior
  branches) and its renal vein (through the hilar segment below) reach the
  kidney, each within 3 mm; no capsule vertex inside the four neighbours.

## What it keeps

Per side, parts of the whole "Kidney": fibrous capsule, renal cortex, renal
columns, renal pyramids, renal papillae (the Atlas's 9–10 pyramids and
papillae joined into one mesh each), hilum, minor calyces, major calyces
(from the Atlas's ureter file), renal pelvis.

The hilar end of the renal vein, as `Renal vein.l/.r` — the same structure
(id) as Z-Anatomy's "Left/Right renal vein", which stops 15–20 mm short of
the kidney (the old kidney's intrarenal veins bridged that): the Atlas vein
lateral to where Z-Anatomy's ends, its medial end blended onto that end.

Left out: the Atlas's ureters (Z-Anatomy's reaches its bladder), renal
arteries (Z-Anatomy's and its branches reach the kidney; the Atlas file
also swaps their sides) and the rest of its renal veins. The old kidney's
"intrarenal arteries/veins" have no Atlas counterpart.
