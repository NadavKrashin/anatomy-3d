"""
Exports the Z-Anatomy atlas (whole body) to web-ready GLBs, one per "pack",
so the app can stream them in progressively.

Run with Blender's Python module (pip install "bpy==4.5.*", Python 3.11):

    python export_glb.py -- <z-anatomy-repo> <out-dir> <out-manifest.json> [--non-commercial-only]

Writes <out-dir>/<pack>.glb for each pack (skeleton, muscles, nerves,
vessels, organs) and one manifest of exported nodes for the dataset builder
(src/data/anatomy/z-anatomy/build.ts).

What it keeps
  - Real structures only: names ending in ".l"/".r" or without a suffix.
    Label empties and landmark/attachment patches (".j", ".i", ".ol", …) are
    dropped (attachments have their own export: export_attachments.py).
  - Everything in the skeletal, joint, muscular, nervous, cardiovascular,
    visceral and lymphoid models, minus coverings that would hide what is
    inside on first view (fasciae, sheaths, bursae, capsules, meninges,
    pleura, greater omentum) and helper objects.

What the packs never include (non-commercial licence, see THIRD_PARTY_ASSETS.md):
  - the inner ear model (everything under the "Internal ear" collection).
With --non-commercial-only it exports exactly that instead, as one file
<out-dir>/non-commercial.glb whose manifest entries name their source
(build.ts → MODEL_SOURCES), so the app can leave them out with one switch
(THIRD_PARTY_ASSETS.md → "Going commercial").
Never exported at all: the kidney model (lissiecowley, CC BY-NC: kidneys,
renal pelvis, intrarenal vessels), replaced by the Human Reference Atlas
kidney (scripts/anatomy/hra/export_hra_kidney.py, 2026-10-08).

Per node it records: system, tissue (for one shared material per tissue),
region, pack and, for parts, the whole they belong to (group): the whole
muscle for muscle parts, or the whole organ (ORGAN_GROUPS, with groupSide)
for e.g. heart chambers, lung lobes, brain gyri.

Licence: Z-Anatomy CC BY-SA 4.0, BodyParts3D CC BY-SA 2.1 JP.
"""
import csv
import json
import re
import sys
from pathlib import Path

import bpy
from mathutils import Vector

ARGS = sys.argv[sys.argv.index("--") + 1 :]
NC_ONLY = "--non-commercial-only" in ARGS
REPO, OUT_DIR, OUT_MANIFEST = (Path(p) for p in ARGS if not p.startswith("--"))
FBX_DIR = REPO / "Resources/Models/FBX"
LAYERS = REPO / "Resources/Layers"

# (file, default system, pack). Order matters: Blender renames a repeated
# name to "<name>.001", which the real-structure filter then drops, so the
# first file to define a name wins.
SOURCES = [
    ("SkeletalSystem100.fbx", "skeletal", "skeleton"),
    ("Joints100.fbx", "joints", "skeleton"),
    ("MuscularSystem100.fbx", "muscular", "muscles"),
    ("NervousSystem100.fbx", "nervous", "nerves"),
    ("CardioVascular41.fbx", "cardiovascular", "vessels"),
    ("VisceralSystem100.fbx", "visceral", "organs"),
    ("LymphoidOrgans100.fbx", "lymphatic", "organs"),
]
PACKS = ["non-commercial"] if NC_ONLY else ["skeleton", "muscles", "nerves", "vessels", "organs"]

SUFFIXED = re.compile(r"\.[a-z0-9]+$")
COVERINGS = re.compile(
    r"fascia|sheath|bursa|retinacul|aponeurosis|septum|capsule|dura|arachnoid|pia mater|meninge|^pleura$|greater omentum",
    re.I,
)
# Real structures whose names merely contain a covering word ("fasciae",
# "meningeal", "septum"): a muscle, arteries/nerves, a brain part.
NOT_COVERINGS = re.compile(
    r"^tensor fasciae latae|meningeal (artery|branch)|middle meningeal|^septum pellucidum",
    re.I,
)
HELPERS = re.compile(r"^take a picture$|^cross section|-profile$|\?", re.I)
# Duplicates the whole liver mesh (overlapping surfaces would z-fight).
LIVER_SEGMENT = re.compile(r"segment of liver", re.I)

NON_COMMERCIAL_COLLECTIONS = {"Internal ear.g"}
# The non-commercial kidney model, replaced by the Human Reference Atlas's.
REPLACED_KIDNEY = re.compile(r"^kidney\b|^renal pelvis|^intrarenal (arteries|veins)", re.I)


def non_commercial_source(obj: bpy.types.Object) -> str | None:
    """The model a non-commercially licensed mesh comes from (ids of
    MODEL_SOURCES in src/data/anatomy/z-anatomy/build.ts), else None."""
    if NON_COMMERCIAL_COLLECTIONS & set(ancestors(obj)):
        return "Dundee inner ear"
    return None

# Organs → system. Explicit and reviewable; anything unmatched is an error.
VISCERAL_SYSTEMS = [
    ("respiratory", r"lung|bronch|trachea|epiglottis|nasal cavity|nasopharynx"),
    ("urinary", r"kidney|renal pelvis|ureter|urinary bladder|urethra"),
    ("reproductive", r"penis|ductus deferens|ejaculatory|epididymis|testis|seminal gland|prostate|spermatic"),
    ("endocrine", r"thyroid|parathyroid|suprarenal|hypophysis|pineal"),
    (
        "digestive",
        r"tongue|gingiva|palate|parotid|submandibular|sublingual|pharynx|oesophagus|stomach|duoden|jejun|ileum|colon|taenia|appendi|meso|omentum|liver|gallbladder|bile|pancrea",
    ),
]

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
    (("Left lower limb", "Right lower limb"), "lower-limb"),
    (("Head", "Cranium"), "head"),
    (("Neck",), "neck"),
    (("Back", "Spine", "Spinal cord"), "back"),
    (("Thorax",), "thorax"),
]

# Organs made of several meshes: source group (".g" empty) → whole organ
# name, and whether the whole is one midline organ or one per side (the
# parts' side). A mesh joins the nearest listed group among its ancestors.
ORGAN_GROUPS: dict[str, tuple[str, str]] = {
    "Heart.g": ("Heart", "midline"),
    "Right lung.g": ("Lung", "right"),
    "Left lung.g": ("Lung", "left"),
    "Frontal lobe.g": ("Frontal lobe", "sided"),
    "Parietal lobe.g": ("Parietal lobe", "sided"),
    "Temporal lobe.g": ("Temporal lobe", "sided"),
    "Occipital lobe.g": ("Occipital lobe", "sided"),
    "Limbic lobe.g": ("Limbic lobe", "sided"),
    "Insula.g": ("Insula", "sided"),
    "Cerebellum.g": ("Cerebellum", "midline"),
    "Brainstem.g": ("Brainstem", "midline"),
    "Diencephalon.g": ("Diencephalon", "midline"),
    "Spinal cord.g": ("Spinal cord", "midline"),
    "Eyeball.g": ("Eyeball", "sided"),
    "Colon.g": ("Colon", "midline"),
    "Small intestine.g": ("Small intestine", "midline"),
    "Pharynx.g": ("Pharynx", "midline"),
    "Hypophysis.g": ("Hypophysis", "midline"),
    "Thymus.g": ("Thymus", "midline"),
    "Penis.g": ("Penis", "midline"),
}


def organ_group(obj: bpy.types.Object) -> tuple[str, str] | None:
    """(whole organ name, its side) for a mesh that is part of a listed organ."""
    for ancestor in ancestors(obj):
        if ancestor in ORGAN_GROUPS:
            name, side = ORGAN_GROUPS[ancestor]
            if side == "sided":
                if not obj.name.endswith((".l", ".r")):
                    return None  # a midline piece of a paired organ stays on its own
                side = "left" if obj.name.endswith(".l") else "right"
            return name, side
    return None


NOT_MUSCLE_GROUPS = {"Common flexor tendon", "Common extensor tendon", "Trochanteric insertion"}

TISSUE_COLORS = {  # sRGB, roughness
    "bone": ("#e6dac3", 0.75),
    "cartilage": ("#b9d3d6", 0.5),
    "teeth": ("#f2efe6", 0.4),
    "muscle": ("#b4564c", 0.55),
    "ligament": ("#d8cfa8", 0.6),
    "nerve": ("#e3c14e", 0.5),
    "brain": ("#e2c4bd", 0.6),
    "sense": ("#d9cfc2", 0.5),
    "artery": ("#c43a3f", 0.45),
    "vein": ("#4a6fb5", 0.45),
    "heart": ("#a8423f", 0.5),
    "respiratory": ("#d49c9a", 0.6),
    "digestive": ("#c98a6a", 0.55),
    "urinary": ("#d1b04a", 0.5),
    "reproductive": ("#c77d9b", 0.55),
    "endocrine": ("#8f7cc4", 0.5),
    "lymphatic": ("#7fb48a", 0.55),
}

CARTILAGE = re.compile(r"cartilage|intervertebral disc|meniscus|nucleus pulposus|symphysis|labrum|articular disc", re.I)
TEETH = re.compile(r"incisor|canine|premolar|molar|tooth|teeth", re.I)
HEART = re.compile(r"atrium|ventricle|leaflet|papillary|cusp|valve", re.I)


def is_real_structure(name: str) -> bool:
    return name.endswith((".l", ".r")) or not SUFFIXED.search(name)


def read_columns(csv_name: str) -> dict[str, list[str]]:
    """Z-Anatomy layer CSVs: one collection per column, header = collection name."""
    rows = list(csv.reader(open(LAYERS / csv_name, encoding="utf-8")))
    return {h: [r[i] for r in rows[1:] if i < len(r) and r[i]] for i, h in enumerate(rows[0]) if h}


def base_name(name: str) -> str:
    return re.sub(r"\.(l|r)$", "", name)


def ancestors(obj: bpy.types.Object) -> list[str]:
    names, node = [], obj.parent
    while node:
        names.append(node.name)
        node = node.parent
    return names


def world_center(obj: bpy.types.Object) -> Vector:
    corners = [obj.matrix_world @ Vector(c) for c in obj.bound_box]
    return sum(corners, Vector()) / 8


def muscle_groups() -> dict[str, str]:
    """Part base name → whole-muscle name (e.g. Long head of biceps brachii → Biceps brachii muscle)."""
    groups = {}
    for whole, parts in read_columns("Collections - Group-Muscles.csv").items():
        if whole in NOT_MUSCLE_GROUPS:  # muscles sharing an attachment, not parts of one muscle
            continue
        for part in parts:
            groups[part.strip("()")] = whole
    return groups


def visceral_system(name: str) -> str:
    for system, pattern in VISCERAL_SYSTEMS:
        if re.search(pattern, name, re.I):
            return system
    raise SystemExit(f"No system for visceral structure {name!r} — add it to VISCERAL_SYSTEMS")


def classify(source_system: str, obj: bpy.types.Object) -> tuple[str, str]:
    """(app system, tissue) from the source file and the anatomical name."""
    name = obj.name
    if source_system == "skeletal":
        if TEETH.search(name):
            return "skeletal", "teeth"
        return "skeletal", "cartilage" if CARTILAGE.search(name) else "bone"
    if source_system == "joints":
        return ("skeletal", "cartilage") if CARTILAGE.search(name) else ("other", "ligament")
    if source_system == "muscular":
        return ("other", "ligament") if "ligament" in name.lower() else ("muscular", "muscle")
    if source_system == "nervous":
        chain = ancestors(obj)
        if "Sense organs.g" in chain or "Eye.g" in chain:
            return "nervous", "sense"
        central = any(c in chain for c in ("Central nervous system.g", "Brain.g", "Spinal cord.g"))
        return "nervous", "brain" if central else "nerve"
    if source_system == "cardiovascular":
        if HEART.search(name):
            return "cardiovascular", "heart"
        return "cardiovascular", "vein" if re.search(r"vein|venous|sinus", name, re.I) else "artery"
    if source_system == "lymphatic":
        return "lymphatic", "lymphatic"
    system = visceral_system(name)
    return system, system


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


def excluded(obj: bpy.types.Object) -> str | None:
    name = obj.name
    if obj.type != "MESH" or not is_real_structure(name):
        return "not a structure"
    if not obj.data.polygons:
        return "no surface"  # guide lines and points (eyeball axes, "-curve", "-path")
    if REPLACED_KIDNEY.search(name):
        return "non-commercial kidney (replaced by the Human Reference Atlas's)"
    if non_commercial_source(obj) and not NC_ONLY:
        return "non-commercial licence"
    if NC_ONLY and not non_commercial_source(obj):
        return "not non-commercial"
    if HELPERS.search(name):
        return "helper object"
    if COVERINGS.search(name) and not NOT_COVERINGS.search(name):
        return "covering"
    if LIVER_SEGMENT.search(name):
        return "liver segment (duplicates the liver)"
    return None


KIDNEY = re.compile(r"\bkidney\b", re.I)
# Run the whole length of the spine; the source lists them under "Neck".
WHOLE_SPINE = re.compile(
    r"^(anterior|posterior) longitudinal ligament|^interspinous ligaments|^intertransverse ligaments|^ligamenta flava|^rotatores",
    re.I,
)


def z_range(obj: bpy.types.Object) -> tuple[float, float]:
    zs = [(obj.matrix_world @ Vector(c)).z for c in obj.bound_box]
    return min(zs), max(zs)


class Regions:
    """
    Region per structure: Z-Anatomy collections first; structures they don't
    place (organs, midline nerves/vessels/muscles) by the height of their
    centre against skeletal landmarks (Blender: +Z up) — a navigation aid,
    not an anatomical definition:
      head    above the lowest point of the mandible
      neck    above the top of the manubrium (jugular notch)
      thorax  above the top of the diaphragm's dome
      abdomen above the top of the sacrum (promontory, pelvic inlet)
      pelvis  below it
    """

    def __init__(self, bonus: dict[str, list[str]], objects: dict[str, bpy.types.Object]):
        self.bonus = {k: set(v) for k, v in bonus.items()}
        self.upper_limb = self.bonus["Left upper limb"] | self.bonus["Right upper limb"]
        self.upper_limb |= {f"{n}.{side}" for n in EXTRA_UPPER_LIMB for side in "lr"} | EXTRA_UNSIDED
        # Z-Anatomy's "Thorax" collection also lists pelvic veins (iliac,
        # gluteal, pudendal…): a vessel it places below the diaphragm's lowest
        # point (crura, ~L2-L3) is placed by height instead.
        self.below_diaphragm = z_range(objects["Diaphragm"])[0]
        self.levels = [
            (z_range(objects["Mandible"])[0], "head"),
            (z_range(objects["Manubrium of sternum"])[1], "neck"),
            (z_range(objects["Diaphragm"])[1], "thorax"),
            (z_range(objects["Sacrum"])[1], "abdomen"),
        ]

    def __call__(self, obj: bpy.types.Object, system: str) -> str:
        name = obj.name
        if name in self.upper_limb:
            return "upper-limb"
        if WHOLE_SPINE.search(name):
            return "back"
        center = world_center(obj)
        # The kidney's own vessels are listed under "Thorax" (with the vena
        # cava); place them, like the kidney, by height.
        by_height_only = KIDNEY.search(name)
        for columns, region in [] if by_height_only else REGION_COLLECTIONS:
            if any(name in self.bonus[c] for c in columns):
                misfiled = (
                    region == "thorax"
                    and system == "cardiovascular"
                    and center.z < self.below_diaphragm
                )
                if not misfiled:
                    return region
        if abs(center.x) > 0.25:  # outside the trunk/head column
            return "other"
        for z, region in self.levels:
            if center.z >= z:
                return region
        return "pelvis"


# Source spelling differences between the two sides of one structure.
RENAMES = {"Middle cerebral artery (M3-segment).r": "Middle cerebral artery (M3 segment).r"}


def complete_sides(keep_names: set[str], objects: list[bpy.types.Object]) -> dict[str, str]:
    """A few structures exist as "<name>.r" plus an unsuffixed "<name>" for the
    other side; give the unsuffixed one its side from its position (Blender
    +X is the body's left). Returns old → new names."""
    renamed = {}
    for obj in objects:
        name = obj.name
        if name.endswith((".l", ".r")) or not ({f"{name}.l", f"{name}.r"} & keep_names):
            continue
        side = "l" if world_center(obj).x > 0 else "r"
        if f"{name}.{side}" not in keep_names:
            renamed[name] = f"{name}.{side}"
    return renamed


REGION_PRIORITY = ["upper-limb", "lower-limb", "head", "neck", "back", "thorax", "abdomen", "pelvis", "other"]


def harmonize_sides(regions: dict[str, str]) -> dict[str, str]:
    """Left and right of a structure share a region. The source collections
    sometimes list only one side; take the more specific region of the two."""
    by_base: dict[str, list[str]] = {}
    for name in regions:
        if name.endswith((".l", ".r")):
            by_base.setdefault(base_name(name), []).append(name)
    for names in by_base.values():
        best = min((regions[n] for n in names), key=REGION_PRIORITY.index)
        for n in names:
            regions[n] = best
    return regions


def main() -> None:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    groups = muscle_groups()
    materials = make_materials()
    keep: list[tuple[bpy.types.Object, str, str, str]] = []
    sources: dict[str, str] = {}
    skipped: dict[str, int] = {}

    for filename, source_system, pack in SOURCES:
        before = set(bpy.data.objects)
        bpy.ops.import_scene.fbx(filepath=str(FBX_DIR / filename))
        for obj in set(bpy.data.objects) - before:
            reason = excluded(obj)
            if reason:
                skipped[reason] = skipped.get(reason, 0) + (reason != "not a structure")
                continue
            system, tissue = classify(source_system, obj)
            keep.append((obj, system, tissue, "non-commercial" if NC_ONLY else pack))
            if NC_ONLY:
                sources[obj.name] = non_commercial_source(obj)

    by_name = {obj.name: obj for obj, *_ in keep}
    # Landmarks (mandible, diaphragm…) from every imported object: an
    # export of only some structures still needs them.
    landmarks = {obj.name: obj for obj in bpy.data.objects}
    region_of = Regions(read_columns("Collections - BONUS.csv"), landmarks)
    regions = {obj.name: region_of(obj, system) for obj, system, _, _ in keep}
    organs = {obj.name: organ_group(obj) for obj, *_ in keep}  # before unparenting
    renamed = (
        complete_sides(set(by_name), [obj for obj, *_ in keep])
        | {old: new for old, new in RENAMES.items() if old in by_name}
        | {name: name.strip() for name in by_name if name != name.strip()}
    )
    for obj, *_ in keep:
        if obj.name in renamed:
            old = obj.name
            obj.name = renamed[old]
            regions[obj.name] = regions.pop(old)
            organs[obj.name] = organs.pop(old)
            if old in sources:
                sources[obj.name] = sources.pop(old)
    print("Renamed:", renamed)
    regions = harmonize_sides(regions)

    kept = {obj for obj, *_ in keep}
    for obj in kept:  # detach from label/group empties without moving
        matrix = obj.matrix_world.copy()
        obj.parent = None
        obj.matrix_world = matrix
    for obj in list(bpy.data.objects):
        if obj not in kept:
            bpy.data.objects.remove(obj, do_unlink=True)

    manifest = []
    for obj, system, tissue, pack in keep:
        obj.data.materials.clear()
        obj.data.materials.append(materials[tissue])
        for polygon in obj.data.polygons:  # faces may reference removed slots
            polygon.material_index = 0
        obj.data.name = obj.name
        entry = {
            "name": obj.name,
            "system": system,
            "tissue": tissue,
            "region": regions[obj.name],
            "pack": pack,
            "vertices": len(obj.data.vertices),
        }
        if obj.name in sources:
            entry["source"] = sources[obj.name]
        group = groups.get(base_name(obj.name).strip("()"))
        if group and system == "muscular":
            entry["group"] = group
        elif organs[obj.name]:
            entry["group"], entry["groupSide"] = organs[obj.name]
        manifest.append(entry)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for pack in PACKS:
        bpy.ops.object.select_all(action="DESELECT")
        for obj, _, _, obj_pack in keep:
            obj.select_set(obj_pack == pack)
        bpy.ops.export_scene.gltf(
            filepath=str(OUT_DIR / f"{pack}.glb"),
            export_format="GLB",
            use_selection=True,
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
    for pack in PACKS:
        entries = [m for m in manifest if m["pack"] == pack]
        print(f"{pack}: {len(entries)} meshes, {sum(m['vertices'] for m in entries)} vertices")
    print("Skipped:", {k: v for k, v in skipped.items() if v})


main()
