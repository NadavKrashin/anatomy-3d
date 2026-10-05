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
omentum), helper objects, the liver-segment duplicates and the
**non-commercial inner ear and kidney models**; organ → system from an
explicit list (`VISCERAL_SYSTEMS`); region from Z-Anatomy collections, else
by height against skeletal landmarks; one material per tissue; muscle parts
tagged with their whole muscle; missing side suffixes completed from
position; left/right regions harmonised.

## 4. Compress (meshopt, names preserved) and install

```bash
mkdir -p public/models/z-anatomy
for p in skeleton muscles nerves vessels organs; do
  npx tsx scripts/anatomy/z-anatomy/optimize-glb.ts out/body/$p.glb public/models/z-anatomy/$p.glb --simplify 0.5
done
cp out/manifest.json src/data/anatomy/z-anatomy/manifest.json
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
`export_glb.py`. Never include the inner ear ("Internal ear" collection) or
the kidney model — they carry non-commercial licences (the export filters
them; `build.test.ts` checks the manifest).
