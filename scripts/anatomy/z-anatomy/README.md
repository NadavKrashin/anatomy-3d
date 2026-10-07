# Z-Anatomy → app pipeline

Reproduces the whole-body model files `public/models/z-anatomy/{skeleton,
muscles,nerves,vessels,organs}.glb`, the attachment patches
`public/models/z-anatomy/attachments.glb`, and the data files
`src/data/anatomy/z-anatomy/{manifest,attachments}.json` from the open
Z-Anatomy atlas. Licences: see `THIRD_PARTY_ASSETS.md` (CC BY-SA —
attribution required, and derived models are shared under the same licence).

## 1. Get the source (≈230 MB of FBX, sparse checkout)

```bash
git clone --depth 1 --filter=blob:none --no-checkout https://github.com/LluisV/Z-Anatomy zanat
cd zanat
git sparse-checkout set --no-cone "Resources/Models/*" "Resources/Layers/*" LICENSE README.md
git checkout HEAD
cd ..
```

Avoid `git ls-tree -l` on the partial clone — asking for sizes downloads
every blob.

## 2. Blender as a Python module (no Blender install needed)

```bash
python3.11 -m venv bpyenv
./bpyenv/bin/pip install "bpy==4.5.*"
```

## 3. Export (≈3 min, whole body, one GLB per pack)

```bash
./bpyenv/bin/python scripts/anatomy/z-anatomy/export_glb.py -- zanat out/body out/manifest.json
```

`export_glb.py` documents the rules: real structures only (no label empties
or landmark/attachment patches); everything in the skeletal, joint,
muscular, nervous, cardiovascular, visceral and lymphoid models except
coverings (fasciae, sheaths, bursae, capsules, meninges, pleura, greater
omentum; `NOT_COVERINGS` keeps real structures that only share a word with
them — tensor fasciae latae, meningeal arteries/branch, septum pellucidum),
helper objects, the liver-segment duplicates and the
**non-commercial inner ear and kidney models** (exported on their own,
below); organ → system from an
explicit list (`VISCERAL_SYSTEMS`); region from Z-Anatomy collections, else
by height against skeletal landmarks (a vessel the source's "Thorax"
collection lists below the diaphragm — its pelvic veins — goes by height); one material per tissue; muscle parts
tagged with their whole muscle; missing side suffixes completed from
position; left/right regions harmonised.

## 4. Compress (meshopt, names preserved) and install

```bash
mkdir -p public/models/z-anatomy
for p in skeleton muscles nerves vessels organs; do
  npx tsx scripts/anatomy/z-anatomy/optimize-glb.ts out/body/$p.glb public/models/z-anatomy/$p.glb --simplify 0.5
done
cp out/manifest.json src/data/anatomy/z-anatomy/manifest.json
# Branches the source carries inside other meshes become their own structures
# (infra-orbital nerve, nerve to vastus medialis; DECISIONS.md → "Split
# branches out of Z-Anatomy meshes"):
npx tsx scripts/anatomy/z-anatomy/split-meshes.ts public/models/z-anatomy/nerves.glb \
  public/models/z-anatomy/vessels.glb src/data/anatomy/z-anatomy/manifest.json
npm run format
# The non-commercial inner ear and kidney, in their own file
# (THIRD_PARTY_ASSETS.md → "Non-commercial models"):
python scripts/anatomy/z-anatomy/export_glb.py -- Z-Anatomy out/nc out/nc/manifest.json --non-commercial-only
npx tsx scripts/anatomy/z-anatomy/optimize-glb.ts out/nc/non-commercial.glb public/models/non-commercial/non-commercial.glb --simplify 0.5
cp out/nc/manifest.json src/data/anatomy/z-anatomy/manifest-non-commercial.json
npm run anatomy:validate
npm test
```

`--simplify 0.5` is error-bounded (shapes keep their outline); it takes the
body from ≈4.4M to ≈3.1M triangles, 15.8 MB in total (skeleton 2.6 MB loads
first). The app builds structures from the manifest at runtime
(`src/data/anatomy/z-anatomy/build.ts`), so no other file needs
regenerating. The pack list lives in `src/data/anatomy/z-anatomy/index.ts`.

## 5. Origins & insertions (attachment patches)

```bash
./bpyenv/bin/python scripts/anatomy/z-anatomy/export_attachments.py -- zanat \
  src/data/anatomy/z-anatomy/manifest.json out/attachments-raw.glb out/attachments.json
npx tsx scripts/anatomy/z-anatomy/optimize-glb.ts out/attachments-raw.glb \
  public/models/z-anatomy/attachments.glb --simplify 0.5
# keep only name/muscle/side/kind/on:
python3 -c "import json;e=json.load(open('out/attachments.json'));json.dump([{k:x[k] for k in ('name','muscle','side','kind','on')} for x in e],open('src/data/anatomy/z-anatomy/attachments.json','w'),indent=1,ensure_ascii=False)"
npm run anatomy:validate
```

Run it after the main export (it reads the dataset manifest to pick the
muscles). The script documents the kind/side rules; muscles whose labels
are known to be wrong are demoted in `src/data/anatomy/z-anatomy/attachments.ts`.

## Changing the scope

Edit `SOURCES`, `COVERINGS`, `VISCERAL_SYSTEMS` or the region landmarks in
`export_glb.py`. The inner ear ("Internal ear" collection) and the kidney
model carry non-commercial licences: they never go into the five packs, only
into the `--non-commercial-only` file, which the app can drop with one switch
(`build.test.ts` checks both). Kidney-named structures are placed by height
(the source lists the intrarenal veins under "Thorax"). Meshes without faces (guide lines and points: eyeball axes, "-curve",
"-path") are skipped; whole-spine ligaments and the rotatores go to the
back region (`WHOLE_SPINE`; the source lists them under "Neck").

## Shipped files in Blender

The shipped GLBs are meshopt-compressed and quantized, which Blender can't
import. `npx tsx scripts/anatomy/decode-glb.ts <in.glb> <out.glb>` writes an
uncompressed copy with the same coordinates (for building new pieces
against exactly what the app shows; see `docs/HANDMADE_MODELS_PROMPT.md`).
