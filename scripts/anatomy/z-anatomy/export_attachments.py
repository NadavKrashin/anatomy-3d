"""
Exports Z-Anatomy's muscle attachment patches (origins and insertions) for
the muscles in the app's dataset, as a separate GLB the app lazy-loads.

    python export_attachments.py -- <z-anatomy-repo> <dataset-manifest.json> <out.glb> <out-attachments.json>

Z-Anatomy marks each attachment twice: the object-name suffix (".o…" origin,
".e…" end = insertion, then an optional index and the side, e.g.
"Biceps brachii muscle.el", "Sternocostal head of pectoralis major muscle.e2l")
and the material name ("Origin-…" / "End-…"). They disagree for a few
patches; those are exported as kind "attachment" (unclassified) rather than
guessed. Patches live on the bones, so their world transform is baked in.

A few patches carry the wrong side suffix (e.g. a right-side serratus
anterior patch named ".e2l"), so a patch takes the side of the nearest mesh
of its own muscle (or of the muscle's parts) — it must sit on the muscle it
is shown for. Without such meshes, the side comes from position (Blender
+X is the body's left) unless the patch lies on the midline.

Licence: Z-Anatomy CC BY-SA 4.0 — see THIRD_PARTY_ASSETS.md.
"""
import json
import re
import sys
from collections import Counter
from pathlib import Path

import bpy
from mathutils import Vector

REPO, MANIFEST, OUT_GLB, OUT_JSON = (Path(p) for p in sys.argv[sys.argv.index("--") + 1 :])
FBX_DIR = REPO / "Resources/Models/FBX"
PATCH = re.compile(r"^(?P<muscle>.+)\.(?P<kind>[oe])\d*(?P<side>[lr])$")
MIDLINE = 0.01  # metres either side of x = 0


def center(obj: bpy.types.Object) -> Vector:
    corners = [obj.matrix_world @ Vector(c) for c in obj.bound_box]
    return sum(corners, Vector()) / 8


def side_of(
    obj: bpy.types.Object, named: str, muscle_meshes: dict[str, list[Vector]]
) -> tuple[str, bool]:
    """(side, corrected): nearest own-muscle mesh, else position, else name."""
    by_name = "left" if named == "l" else "right"
    here = center(obj)
    distances = {
        side: min((here - c).length for c in centers)
        for side, centers in muscle_meshes.items()
        if centers
    }
    if len(distances) == 2:
        side = min(distances, key=distances.get)
        return side, side != by_name
    if abs(here.x) < MIDLINE:
        return by_name, False
    by_position = "left" if here.x > 0 else "right"
    return by_position, by_position != by_name


def strip(name: str) -> str:
    return name.strip("()")


def material_kind(obj: bpy.types.Object) -> str | None:
    for slot in obj.material_slots:
        name = slot.material.name if slot.material else ""
        if name.startswith(("Origin", "Muscular origin")):
            return "o"
        if name.startswith("End"):
            return "e"
    return None


def main() -> None:
    manifest = json.loads(MANIFEST.read_text())
    targets = {strip(re.sub(r"\.(l|r)$", "", e["name"])) for e in manifest if e["tissue"] == "muscle"}
    targets |= {e["group"] for e in manifest if e.get("group")}
    # Muscle (or whole-muscle group) → its exported mesh names per side.
    meshes_of: dict[str, dict[str, list[str]]] = {}
    for e in manifest:
        if e["tissue"] != "muscle" or not e["name"].endswith((".l", ".r")):
            continue
        side = "left" if e["name"].endswith(".l") else "right"
        for key in {strip(e["name"][:-2]), e.get("group")} - {None}:
            meshes_of.setdefault(key, {"left": [], "right": []})[side].append(e["name"])

    bpy.ops.wm.read_factory_settings(use_empty=True)
    for name in ("SkeletalSystem100.fbx", "MuscularSystem100.fbx"):
        bpy.ops.import_scene.fbx(filepath=str(FBX_DIR / name))

    keep, entries, kinds, corrected = [], [], Counter(), []
    for obj in bpy.data.objects:
        match = PATCH.match(obj.name)
        if obj.type != "MESH" or not match or strip(match["muscle"]) not in targets:
            continue
        by_name = match["kind"]
        kind = {"o": "origin", "e": "insertion"}[by_name] if material_kind(obj) == by_name else "attachment"
        kinds[kind] += 1
        own = meshes_of.get(strip(match["muscle"]), {})
        centers = {
            side: [center(bpy.data.objects[n]) for n in names if n in bpy.data.objects]
            for side, names in own.items()
        }
        side, side_corrected = side_of(obj, match["side"], centers)
        if side_corrected:
            corrected.append(obj.name)
        keep.append(obj)
        entries.append(
            {
                "name": obj.name,
                "muscle": strip(match["muscle"]),
                "side": side,
                "kind": kind,
                # The bone (or cartilage) the patch sits on, side stripped.
                "on": re.sub(r"\.(l|r)$", "", obj.parent.name) if obj.parent else None,
                "vertices": len(obj.data.vertices),
            }
        )

    for obj in keep:
        matrix = obj.matrix_world.copy()
        obj.parent = None
        obj.matrix_world = matrix
    kept = set(keep)
    for obj in list(bpy.data.objects):
        if obj not in kept:
            bpy.data.objects.remove(obj, do_unlink=True)

    material = bpy.data.materials.new("attachment")
    for obj in keep:
        obj.data.materials.clear()
        obj.data.materials.append(material)
        for polygon in obj.data.polygons:
            polygon.material_index = 0
        obj.data.name = obj.name

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
    entries.sort(key=lambda e: e["name"])
    OUT_JSON.write_text(json.dumps(entries, indent=1, ensure_ascii=False))
    print(f"Exported {len(entries)} patches {dict(kinds)}, {sum(e['vertices'] for e in entries)} vertices")
    print(f"Side corrected (suffix disagreed with the nearest own-muscle mesh or position): {corrected}")


main()
