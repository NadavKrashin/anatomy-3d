# Z-Anatomy → app pipeline

Reproduces `public/models/z-anatomy-upper-limb.glb` and
`src/data/anatomy/z-anatomy/manifest.json` from the open Z-Anatomy atlas.
Licences: see `THIRD_PARTY_ASSETS.md` (CC BY-SA — attribution required, and
derived models are shared under the same licence).

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

## 3. Export (≈40 s)

```bash
./bpyenv/bin/python scripts/anatomy/z-anatomy/export_glb.py -- zanat out/raw.glb out/manifest.json
```

`export_glb.py` documents the rules: real structures only (no label empties
or landmark/attachment patches), whole skeleton + upper-limb muscles, nerves
and vessels (incl. pectoral/axillary/scapular regions), no fasciae/sheaths/
bursae, one material per tissue, muscle parts tagged with their whole-muscle
group, region per structure.

## 4. Compress (meshopt, names preserved) and install

```bash
npx tsx scripts/anatomy/z-anatomy/optimize-glb.ts out/raw.glb public/models/z-anatomy-upper-limb.glb
cp out/manifest.json src/data/anatomy/z-anatomy/manifest.json
npm run anatomy:inspect public/models/z-anatomy-upper-limb.glb
npm run anatomy:validate
npm test
```

The app builds structures from the manifest at runtime
(`src/data/anatomy/z-anatomy/build.ts`), so no other file needs regenerating.

## 5. Origins & insertions (attachment patches)

```bash
./bpyenv/bin/python scripts/anatomy/z-anatomy/export_attachments.py -- zanat \
  src/data/anatomy/z-anatomy/manifest.json out/attachments-raw.glb out/attachments.json
npx tsx scripts/anatomy/z-anatomy/optimize-glb.ts out/attachments-raw.glb \
  public/models/z-anatomy-upper-limb-attachments.glb --simplify 0.5
# keep only name/muscle/side/kind/on:
python3 -c "import json;e=json.load(open('out/attachments.json'));json.dump([{k:x[k] for k in ('name','muscle','side','kind','on')} for x in e],open('src/data/anatomy/z-anatomy/attachments.json','w'),indent=1,ensure_ascii=False)"
npm run anatomy:validate
```

Run it after the main export (it reads the dataset manifest to pick the
muscles). The script documents the kind/side rules; muscles whose labels
are known to be wrong are demoted in `src/data/anatomy/z-anatomy/attachments.ts`.

## Extending the scope

Add regions by changing `in_scope` / `EXTRA_UPPER_LIMB` in `export_glb.py`
(e.g. thorax viscera from `VisceralSystem100.fbx`). Do **not** include the
inner ear or kidney models — they carry non-commercial licences.
