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
anterior patch named ".e2l"), so the side comes from the patch's position
(Blender +X is the body's left) unless it lies on the midline.

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


def side_of(obj: bpy.types.Object, named: str) -> tuple[str, bool]:
    """(side, corrected): from the world-space centre, else from the name."""
    corners = [obj.matrix_world @ Vector(c) for c in obj.bound_box]
    x = (min(c.x for c in corners) + max(c.x for c in corners)) / 2
    by_name = "left" if named == "l" else "right"
    if abs(x) < MIDLINE:
        return by_name, False
    by_position = "left" if x > 0 else "right"
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
        side, side_corrected = side_of(obj, match["side"])
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
    print(f"Side taken from position (name suffix was wrong): {corrected}")


main()
