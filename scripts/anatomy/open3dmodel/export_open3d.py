"""
Adds structures from Open3DModel (AnatomyTOOL, CC BY-SA) that the Z-Anatomy
model lacks, as one extra pack ("extras") the app streams in last.

    python export_open3d.py -- <z-anatomy raw packs dir> <open3d glb dir> \
        <out extras.glb> <out manifest-open3d.json> [--analyse]

Open3DModel is built on Z-Anatomy (same body, same coordinates), so its
meshes drop in. What it adds (docs/MODEL_SOURCES.md): nerves (brachial
plexus cords and divisions, lumbosacral plexus, branches), muscles (psoas
minor, articularis genus), arteries, veins and ligaments.

Rules, in order:
  - Only the groups Arteries / Veins / Nerves / Muscles / Ligaments (also
    "<region> - capsules, ligaments, fasciae"); bones and cartilages exist
    already; bursae, fasciae, sheaths, retinacula, capsules and the "Overlays"
    (spaces such as the femoral triangle) would hide what is inside.
  - Skip anything Z-Anatomy already has: same normalised name, or a mesh
    occupying the same box (≤ DUP_MM on every side) as an existing one —
    Open3DModel renamed or misspelt some (e.g. "Musculocutaneus nerve").
  - Names: RENAMES (renames.json) fixes typos and spells out "br"/"n".
  - Open3DModel's limbs are right-sided: each ".r" mesh without a ".l"
    twin is mirrored across the midline (x → -x) as ".l".
  - Region: the limb of the source file, except trunk structures (plexuses,
    roots, trunk nerves; TRUNK) placed by height like the main export.
"""
import json
import re
import sys
from pathlib import Path

import bpy
from mathutils import Matrix, Vector

ARGS = sys.argv[sys.argv.index("--") + 1 :]
ANALYSE = "--analyse" in ARGS
ZA_DIR, O3D_DIR, OUT_GLB, OUT_MANIFEST = (Path(p) for p in ARGS[:4])
HERE = Path(__file__).parent

# (file, region of its limb); upper limb before hand so hand duplicates drop.
SOURCES = [("upper-limb.glb", "upper-limb"), ("lower-limb.glb", "lower-limb"), ("hand.glb", "upper-limb")]
# hand.glb mostly repeats upper-limb.glb, piece by piece; only these are new.
HAND_ONLY = {"Transverse carpal ligament"}
GROUP_TISSUE = [
    (re.compile(r"arteries", re.I), ("cardiovascular", "artery")),
    (re.compile(r"veins", re.I), ("cardiovascular", "vein")),
    (re.compile(r"nerves", re.I), ("nervous", "nerve")),
    (re.compile(r"muscles", re.I), ("muscular", "muscle")),
    (re.compile(r"ligaments", re.I), ("muscular", "ligament")),  # as in Z-Anatomy; the app files them under "other"
]
COVERINGS = re.compile(
    r"fascia|sheath|bursa|retinacul|aponeurosis|septum|capsule|synovial|overlay|annular ligament|cruciform ligament|fibrous sheath",
    re.I,
)
SKIP = re.compile(
    r"\.\d{3}$|curve_|^(arteries|veins|nerves|muscles|ligaments)$"
    # single muscles our model has as one combined mesh, aggregate vein meshes
    r"|^\d(st|nd|rd|th) .*(inteross|lumbrical)|superficial veins of upper limb|deep veins of the arm"
    r"|arachnoid|articular cartilage|tendon sheath",
    re.I,
)
TRUNK = re.compile(
    r"plexus|ramus|rami\b|sympath|coccygeal nerve|iliohypogastric|ilioinguinal|genitofemoral|clunial|nerve to levator|lumbosacral",
    re.I,
)
DUP_MM = 0.006
TISSUE_COLORS = {"artery": "#c43a3f", "vein": "#4a6fb5", "nerve": "#e3c14e", "muscle": "#b4564c", "ligament": "#d8cfa8"}


def clean(name: str) -> str:
    return re.sub(r"[​\t ]+$", "", name.replace("​", "")).strip()


def side_of(name: str) -> str:
    m = re.search(r"\.(l|r)$", name)
    return m.group(1) if m else ""


def base(name: str) -> str:
    return re.sub(r"\.(l|r)$", "", name).strip()


SPELLING = [
    (r"interosseus", "interosseous"), (r"musculocutaneus", "musculocutaneous"), (r"cuteneous", "cutaneous"),
    (r"sympathic", "sympathetic"), (r"ilio-", "ilio"), (r"dorsal pedis", "dorsalis pedis"), (r"planter", "plantar"),
    (r"recrurrent", "recurrent"), (r"collatertal", "collateral"), (r"palmal", "palmar"), (r"femoralis", "femoral"),
]


def za_style(name: str) -> str:
    """Open3DModel's "Radial nerve (superficial br)" / "Ulnar nerve Deep br" /
    "Obturator nerve, anterior branch" → Z-Anatomy's "Superficial branch of
    radial nerve" form; abbreviations spelled out."""
    n = re.sub(r"\s+", " ", name).strip(" .")
    n = re.sub(r"\bbr\b\.?", "branch", n)
    n = re.sub(r"\bnn\b", "nerves", n)
    n = re.sub(r"\bn\b\.?", "nerve", n)
    n = re.sub(r"\ba\.(?=\s|$)", "artery", n)
    n = re.sub(r"\blig\.?$", "ligament", n)
    for a, b in SPELLING:
        n = re.sub(a, b, n, flags=re.I)
    m = re.match(r"^(.+? (?:nerve|artery))\s*(?:\(|, | )(.+? branch(?:es)?)\)?$", n, re.I)
    if m and not m.group(2).lower().startswith(("of ", "to ")):
        n = f"{m.group(2)} of {m.group(1).lower()}"
    m = re.match(r"^.+? nerve \((.+? nerves?)\)$", n, re.I)  # "Radial nerve (posterior interosseous n)"
    if m:
        n = m.group(1)
    n = re.sub(r"^Arm superficial vein-", "", n)
    return n[0].upper() + n[1:]


def norm(name: str) -> str:
    s = re.sub(r"^(left|right) ", "", base(name).lower())
    for a, b in SPELLING:
        s = re.sub(a, b, s)
    s = re.sub(r"\b(muscle|muscles|bone)\b", " ", s)
    s = re.sub(r"[^a-z0-9]+", " ", s)
    return " ".join(w.rstrip("s") for w in s.split())


def world_box(obj) -> tuple[Vector, Vector]:
    pts = [obj.matrix_world @ Vector(c) for c in obj.bound_box]
    return (Vector([min(p[i] for p in pts) for i in range(3)]), Vector([max(p[i] for p in pts) for i in range(3)]))


def same_box(a, b) -> bool:
    return all(abs(a[k][i] - b[k][i]) <= DUP_MM for k in (0, 1) for i in range(3))


def same_place(a, b) -> bool:
    """A remodelled copy: centre within 8 mm, each extent within 25 %."""
    ca, cb = (a[0] + a[1]) / 2, (b[0] + b[1]) / 2
    if (ca - cb).length > 0.008:
        return False
    return all(abs((a[1][i] - a[0][i]) - (b[1][i] - b[0][i])) <= 0.25 * max(b[1][i] - b[0][i], 0.004) for i in range(3))


def group_of(obj):
    node = obj.parent
    while node is not None:
        for pattern, kind in GROUP_TISSUE:
            if pattern.search(node.name) and not re.search(r"bursae|synovia|cartilage|bones", node.name, re.I):
                return node.name, kind
        node = node.parent
    return None, None


def load_existing(tissue_of):
    """Z-Anatomy meshes: normalised names, (name, tissue, box), height landmarks."""
    names, boxes, landmarks = set(), [], {}
    for glb in sorted(ZA_DIR.glob("*.glb")):
        bpy.ops.wm.read_factory_settings(use_empty=True)
        bpy.ops.import_scene.gltf(filepath=str(glb))
        for obj in bpy.data.objects:
            if obj.type != "MESH":
                continue
            names.add(norm(obj.name))
            box = world_box(obj)
            boxes.append((obj.name, tissue_of.get(obj.name), box))
            if obj.name in ("Mandible", "Manubrium of sternum", "Diaphragm", "Sacrum"):
                landmarks[obj.name] = box
    levels = [
        (landmarks["Mandible"][0].z, "head"),
        (landmarks["Manubrium of sternum"][1].z, "neck"),
        (landmarks["Diaphragm"][1].z, "thorax"),
        (landmarks["Sacrum"][1].z, "abdomen"),
    ]
    return names, boxes, levels


def region_by_height(z: float, levels) -> str:
    for level, region in levels:
        if z >= level:
            return region
    return "pelvis"


def main() -> None:
    renames = json.loads((HERE / "renames.json").read_text())["renames"]
    manifest = json.loads((ZA_DIR.parent / "manifest.json").read_text())
    existing_names, existing_boxes, levels = load_existing({m["name"]: m["tissue"] for m in manifest})
    existing_names |= {norm(m["group"]) for m in manifest if m.get("group")}
    same_as = json.loads((HERE / "renames.json").read_text()).get("sameAs", {})

    bpy.ops.wm.read_factory_settings(use_empty=True)
    picked, report = {}, {"skipped-group": 0, "covering": 0, "same-name": [], "same-place": [], "kept": []}
    for filename, limb in SOURCES:
        before = set(bpy.data.objects)
        bpy.ops.import_scene.gltf(filepath=str(O3D_DIR / filename))
        for obj in set(bpy.data.objects) - before:
            if obj.type != "MESH":
                continue
            raw = clean(obj.name)
            if SKIP.search(raw) or (filename == "hand.glb" and base(raw) not in HAND_ONLY):
                continue
            group, kind = group_of(obj)
            if kind is None:
                report["skipped-group"] += 1
                continue
            if COVERINGS.search(raw):
                report["covering"] += 1
                continue
            styled = za_style(base(raw))
            if styled in same_as or base(raw) in same_as:
                report["same-name"].append(raw)
                continue
            name = renames.get(styled, styled) + (f".{side_of(raw)}" if side_of(raw) else "")
            assert len(base(name)) <= 60, f"name too long for Blender (63 chars with side): {name}"
            if norm(name) in existing_names:
                report["same-name"].append(raw)
                continue
            box = world_box(obj)
            twin = next((n for n, t, b in existing_boxes if t == kind[1] and (same_box(box, b) or same_place(box, b))), None)
            if twin:
                report["same-place"].append(f"{raw} = {twin}")
                continue
            if name in picked or any(same_box(box, p["box"]) for p in picked.values()):
                continue  # hand.glb repeats upper-limb.glb
            centre = (box[0] + box[1]) / 2
            if not side_of(name) and abs(centre.x) > 0.02:  # unsuffixed but one-sided
                name += ".r" if centre.x < 0 else ".l"
            trunk = TRUNK.search(name) and "brachial plexus" not in name.lower()  # upper limb, as in Z-Anatomy
            region = region_by_height(centre.z, levels) if trunk else limb
            picked[name] = {"obj": obj, "system": kind[0], "tissue": kind[1], "region": region, "box": box}
            report["kept"].append(f"{name} [{kind[1]}, {region}]")

    boxes = {n: b for n, _, b in existing_boxes}
    if "Femur.r" in boxes and "Femur.l" in boxes:  # how well does mirroring fit?
        r, l = boxes["Femur.r"], boxes["Femur.l"]
        err = max(abs(-r[1].x - l[0].x), abs(-r[0].x - l[1].x), *(abs(r[k][i] - l[k][i]) for k in (0, 1) for i in (1, 2)))
        print(f"MIRROR femur left vs mirrored right: max {err * 1000:.1f} mm")
    print("REPORT", json.dumps({k: (v if isinstance(v, int) else len(v)) for k, v in report.items()}))
    for key in ("same-place", "kept"):
        print(f"--- {key}")
        for line in sorted(report[key]):
            print("   ", line)
    if ANALYSE:
        import difflib
        pool = sorted({re.sub(r"\.(l|r)$", "", n) for n, _, _ in existing_boxes})
        low = {p.lower(): p for p in pool}
        print("--- closest existing")
        for name in sorted(picked):
            close = difflib.get_close_matches(base(name).lower(), list(low), n=2, cutoff=0.72)
            if close:
                print("   ", base(name), "~", [low[c] for c in close])
        return
    export(picked)


def export(picked) -> None:
    materials = {}
    for tissue, color in TISSUE_COLORS.items():
        mat = bpy.data.materials.new(tissue)
        mat.use_nodes = True
        rgb = [int(color[i : i + 2], 16) / 255 for i in (1, 3, 5)]
        lin = [c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in rgb]
        mat.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (*lin, 1)
        materials[tissue] = mat

    keep = []
    for name, p in sorted(picked.items()):
        obj = p["obj"]
        matrix = obj.matrix_world.copy()
        obj.parent = None
        obj.matrix_world = matrix
        obj.name = name
        keep.append((obj, p))
        if side_of(name) == "r" and f"{base(name)}.l" not in picked:
            twin = obj.copy()
            twin.data = obj.data.copy()
            bpy.context.collection.objects.link(twin)
            twin.matrix_world = Matrix.Scale(-1, 4, (1, 0, 0)) @ obj.matrix_world
            twin.name = f"{base(name)}.l"
            keep.append((twin, p))
    kept = {obj for obj, _ in keep}
    for obj in list(bpy.data.objects):
        if obj not in kept:
            bpy.data.objects.remove(obj, do_unlink=True)
    bpy.ops.object.select_all(action="DESELECT")
    for obj, p in keep:
        # bake transforms; Blender flips the winding of mirrored copies
        bpy.context.view_layer.objects.active = obj
        obj.select_set(True)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    manifest = []
    for obj, p in keep:
        obj.data.materials.clear()
        obj.data.materials.append(materials[p["tissue"]])
        obj.data.name = obj.name
        manifest.append({
            "name": obj.name, "system": p["system"], "tissue": p["tissue"], "region": p["region"],
            "pack": "extras", "vertices": len(obj.data.vertices), "source": "Open3DModel",
        })
    bpy.ops.export_scene.gltf(
        filepath=str(OUT_GLB), export_format="GLB", use_selection=True, export_yup=True,
        export_apply=True, export_normals=True, export_texcoords=False, export_materials="EXPORT",
        export_cameras=False, export_lights=False, export_animations=False,
    )
    manifest.sort(key=lambda m: m["name"])
    OUT_MANIFEST.write_text(json.dumps(manifest, indent=1, ensure_ascii=False))
    print(f"extras: {len(manifest)} meshes, {sum(m['vertices'] for m in manifest)} vertices")


main()
