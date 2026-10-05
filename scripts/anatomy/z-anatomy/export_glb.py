"""
Exports a web-ready subset of the Z-Anatomy atlas to GLB.

Run with Blender's Python module (pip install "bpy==4.5.*", Python 3.11):

    python export_glb.py -- <z-anatomy-repo> <out.glb> <out-manifest.json>

What it does
  1. Imports the per-system FBX exports from Z-Anatomy (Resources/Models/FBX).
  2. Keeps real structures only: names ending in ".l"/".r" or without a
     suffix. Z-Anatomy also ships label empties and landmark/attachment
     surface patches (".j", ".i", ".ol", ".el", …) which are dropped.
  3. Scope (see SCOPE below): the whole skeleton for context, plus every
     muscle, nerve and vessel listed in Z-Anatomy's "Left/Right upper limb"
     collections — minus wrappers (fasciae, sheaths, bursae, …) that would
     hide everything else.
  4. Replaces the action-colour-coded source materials with one material per
     tissue (bone, muscle, nerve, …) so the app can highlight cheaply.
  5. Writes the GLB (+Y up) and a manifest of exported nodes for the dataset
     generator (scripts/anatomy/z-anatomy/build-dataset.ts).

Licence: Z-Anatomy CC BY-SA 4.0, BodyParts3D CC BY-SA 2.1 JP — see
THIRD_PARTY_ASSETS.md. Do not include the inner ear or kidney models
(non-commercial licences).
"""
import csv
import json
import re
import sys
from pathlib import Path

import bpy

REPO, OUT_GLB, OUT_MANIFEST = (Path(p) for p in sys.argv[sys.argv.index("--") + 1 :])
FBX_DIR = REPO / "Resources/Models/FBX"
LAYERS = REPO / "Resources/Layers"

SYSTEM_FILES = {
    "skeletal": "SkeletalSystem100.fbx",
    "muscular": "MuscularSystem100.fbx",
    "nervous": "NervousSystem100.fbx",
    "cardiovascular": "CardioVascular41.fbx",
}

REAL_STRUCTURE = re.compile(r"(\.(l|r))?$")
SUFFIXED = re.compile(r"\.[a-z0-9]+$")
WRAPPERS = re.compile(r"fascia|sheath|bursa|retinacul|aponeurosis|septum|capsule", re.I)

# Z-Anatomy's "upper limb" collections omit the pectoral region, axilla and
# scapular region, which upper-limb anatomy courses cover. Added explicitly
# (base names, both sides).
EXTRA_UPPER_LIMB = {
    "Clavicular head of pectoralis major muscle",
    "Sternocostal head of pectoralis major muscle",
    "(Abdominal part of pectoralis major muscle)",
    "Pectoralis minor muscle",
    "Subclavius muscle",
    "Serratus anterior muscle",
    "Latissimus dorsi muscle",
    "Teres major muscle",
    "Descending part of trapezius muscle",
    "Transverse part of trapezius muscle",
    "Ascending part of trapezius muscle",
    "Rhomboid major muscle",
    "Rhomboid minor muscle",
    "Levator scapulae",
    "Axillary artery",
    "Subscapular artery",
    "Circumflex scapular artery",
    "Suprascapular artery",
    "Lateral thoracic artery",
    "Lateral thoracic vein",
    "Transverse cervical artery",
}
EXTRA_UNSIDED = {"Left subclavian artery", "Right subclavian artery", "Left subclavian vein", "Right subclavian vein"}

# First matching Z-Anatomy collection wins (BONUS.csv column → app region).
REGION_COLLECTIONS = [
    (("Left upper limb", "Right upper limb"), "upper-limb"),
    (("Left lower limb", "Right lower limb"), "lower-limb"),
    (("Head", "Cranium"), "head"),
    (("Neck",), "neck"),
    (("Back", "Spine"), "back"),
    (("Thorax",), "thorax"),
]

# Helper objects shipped inside the source files.
EXCLUDED_OBJECTS = {"Take a picture"}

NOT_MUSCLE_GROUPS = {"Common flexor tendon", "Common extensor tendon", "Trochanteric insertion"}

TISSUE_COLORS = {  # sRGB, roughness
    "bone": ("#e6dac3", 0.75),
    "cartilage": ("#b9d3d6", 0.5),
    "teeth": ("#f2efe6", 0.4),
    "muscle": ("#b4564c", 0.55),
    "ligament": ("#d8cfa8", 0.6),
    "nerve": ("#e3c14e", 0.5),
    "artery": ("#c43a3f", 0.45),
    "vein": ("#4a6fb5", 0.45),
}


def is_real_structure(name: str) -> bool:
    return name.endswith((".l", ".r")) or not SUFFIXED.search(name)


def read_columns(csv_name: str) -> dict[str, list[str]]:
    """Z-Anatomy layer CSVs: one collection per column, header = collection name."""
    rows = list(csv.reader(open(LAYERS / csv_name, encoding="utf-8")))
    return {h: [r[i] for r in rows[1:] if i < len(r) and r[i]] for i, h in enumerate(rows[0]) if h}


def base_name(name: str) -> str:
    return re.sub(r"\.(l|r)$", "", name)


def region_of(name: str, bonus: dict[str, list[str]], upper_limb: set[str]) -> str:
    if name in upper_limb:
        return "upper-limb"
    for columns, region in REGION_COLLECTIONS:
        if any(name in bonus[c] for c in columns):
            return region
    return "other"


def muscle_groups() -> dict[str, str]:
    """Part base name → whole-muscle name (e.g. Long head of biceps brachii → Biceps brachii muscle)."""
    groups = {}
    for whole, parts in read_columns("Collections - Group-Muscles.csv").items():
        # These columns list muscles sharing an attachment, not parts of one muscle.
        if whole in NOT_MUSCLE_GROUPS:
            continue
        for part in parts:
            groups[part.strip("()")] = whole
    return groups


CARTILAGE = re.compile(r"cartilage|intervertebral disc|meniscus|nucleus pulposus|symphysis", re.I)
TEETH = re.compile(r"incisor|canine|premolar|molar|tooth|teeth", re.I)


def tissue_for(system: str, name: str) -> str:
    """Tissue from the anatomical name. (Source material slots are unreliable:
    many bones list their articular cartilage material first.)"""
    if system == "skeletal":
        if TEETH.search(name):
            return "teeth"
        return "cartilage" if CARTILAGE.search(name) else "bone"
    if system == "muscular":
        return "ligament" if "ligament" in name.lower() else "muscle"
    if system == "nervous":
        return "nerve"
    return "vein" if re.search(r"vein|venous", name, re.I) else "artery"


def srgb_to_linear(hex_color: str) -> tuple[float, float, float, float]:
    def channel(i: int) -> float:
        c = int(hex_color[i : i + 2], 16) / 255
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

    return (channel(1), channel(3), channel(5), 1.0)


def make_materials() -> dict[str, bpy.types.Material]:
    materials = {}
    for tissue, (color, roughness) in TISSUE_COLORS.items():
        mat = bpy.data.materials.new(tissue)
        mat.use_nodes = True
        bsdf = mat.node_tree.nodes["Principled BSDF"]
        bsdf.inputs["Base Color"].default_value = srgb_to_linear(color)
        bsdf.inputs["Roughness"].default_value = roughness
        bsdf.inputs["Metallic"].default_value = 0.0
        materials[tissue] = mat
    return materials


def main() -> None:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bonus = read_columns("Collections - BONUS.csv")
    groups = muscle_groups()
    upper_limb = set(bonus["Left upper limb"]) | set(bonus["Right upper limb"])
    upper_limb |= {f"{n}.{side}" for n in EXTRA_UPPER_LIMB for side in "lr"} | EXTRA_UNSIDED
    materials = make_materials()
    keep: list[tuple[bpy.types.Object, str, str]] = []

    for system, filename in SYSTEM_FILES.items():
        before = set(bpy.data.objects)
        bpy.ops.import_scene.fbx(filepath=str(FBX_DIR / filename))
        for obj in set(bpy.data.objects) - before:
            name = obj.name
            in_scope = system == "skeletal" or (name in upper_limb and not WRAPPERS.search(name))
            if obj.type == "MESH" and is_real_structure(name) and in_scope and name not in EXCLUDED_OBJECTS:
                keep.append((obj, system, tissue_for(system, name)))

    kept = {obj for obj, _, _ in keep}
    # Detach kept meshes from label/group empties without moving them, then
    # delete everything else.
    for obj in kept:
        matrix = obj.matrix_world.copy()
        obj.parent = None
        obj.matrix_world = matrix
    for obj in list(bpy.data.objects):
        if obj not in kept:
            bpy.data.objects.remove(obj, do_unlink=True)

    manifest = []
    for obj, system, tissue in keep:
        obj.data.materials.clear()
        obj.data.materials.append(materials[tissue])
        # Source meshes can use several material slots (e.g. bone + attachment
        # patches); point every face at the single tissue material, or faces
        # referencing removed slots export with glTF's default material.
        for polygon in obj.data.polygons:
            polygon.material_index = 0
        obj.data.name = obj.name
        entry = {
            "name": obj.name,
            "system": system,
            "tissue": tissue,
            "region": region_of(obj.name, bonus, upper_limb),
            "vertices": len(obj.data.vertices),
        }
        group = groups.get(base_name(obj.name).strip("()"))
        if group and system == "muscular":
            entry["group"] = group
        manifest.append(entry)

    bpy.ops.export_scene.gltf(
        filepath=str(OUT_GLB),
        export_format="GLB",
        export_yup=True,
        export_apply=True,
        export_normals=True,
        export_texcoords=False,
        export_materials="EXPORT",
        export_cameras=False,
        export_lights=False,
        export_animations=False,
    )
    manifest.sort(key=lambda m: m["name"])
    OUT_MANIFEST.write_text(json.dumps(manifest, indent=1, ensure_ascii=False))
    print(f"Exported {len(manifest)} meshes, {sum(m['vertices'] for m in manifest)} vertices")


main()
