"""
Hand-built schematic structures that no open 3D model has (phrenic nerve,
laryngeal nerves, cervical plexus branches, thoracic duct, …), placed in
the Z-Anatomy body from landmarks measured on its meshes.

    ./bpyenv/bin/python scripts/anatomy/handmade/build_handmade.py -- \
        out/decoded out/handmade.glb out/manifest-handmade.json [--only <regex>] [--skip <regex>] [--preview out/preview.npz]

--only builds the matching structures and stops (no export; for iterating);
--skip leaves the matching ones out and still exports (e.g. structures not
ready to ship yet).

<out/decoded> holds the shipped GLBs decoded for Blender (README.md). Every
structure's course, landmark and offset is documented where it is built:
structures_neck.py, structures_trunk.py, structures_pelvis.py,
structures_head.py. Brief:
docs/HANDMADE_MODELS_PROMPT.md. The script asserts each structure's
clearance (nothing inside a mesh it should not touch, ≥ 0.5 mm from it)
and prints its length, nearest neighbours and worst penetration.
"""
import json
import re
import sys
from pathlib import Path

import bpy
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))

from body_cache import load_body  # noqa: E402
from landmarks import Body, check  # noqa: E402
from parts import Builder  # noqa: E402
import structures_neck  # noqa: E402
import structures_trunk  # noqa: E402
import structures_pelvis  # noqa: E402
import structures_head  # noqa: E402

TISSUE_COLORS = {  # sRGB, roughness — the same as TISSUE_COLORS in z-anatomy/export_glb.py
    "muscle": ("#b4564c", 0.55),
    "ligament": ("#d8cfa8", 0.6),
    "nerve": ("#e3c14e", 0.5),
    "artery": ("#c43a3f", 0.45),
    "vein": ("#4a6fb5", 0.45),
    "digestive": ("#c98a6a", 0.55),
    "lymphatic": ("#7fb48a", 0.55),
    "reproductive": ("#c77d9b", 0.55),
    "urinary": ("#d1b04a", 0.5),
}
MIN_GAP = 0.0005  # m: closest a structure may come to a mesh it should not touch
MAX_TRIANGLES = 150_000


def srgb_to_linear(hex_color: str) -> tuple[float, float, float, float]:
    c = [int(hex_color[i : i + 2], 16) / 255 for i in (1, 3, 5)]
    return (*[x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c], 1.0)


def export(parts, out_glb: Path) -> None:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    mats = {}
    for tissue, (color, roughness) in TISSUE_COLORS.items():
        mat = bpy.data.materials.new(tissue)
        mat.use_nodes = True
        bsdf = mat.node_tree.nodes["Principled BSDF"]
        bsdf.inputs["Base Color"].default_value = srgb_to_linear(color)
        bsdf.inputs["Roughness"].default_value = roughness
        bsdf.inputs["Metallic"].default_value = 0.0
        mats[tissue] = mat
    for part in parts:
        V, F = part.mesh()
        assert len(F), f"{part.name} has no faces"
        assert len(part.name) <= 60, f"mesh name too long: {part.name}"
        mesh = bpy.data.meshes.new(part.name)
        mesh.from_pydata(V.tolist(), [], F.tolist())
        mesh.validate()
        for poly in mesh.polygons:
            poly.use_smooth = True
        mesh.materials.append(mats[part.tissue])
        obj = bpy.data.objects.new(part.name, mesh)
        assert obj.name == part.name, f"Blender renamed {part.name} → {obj.name}"
        bpy.context.scene.collection.objects.link(obj)
    bpy.ops.export_scene.gltf(
        filepath=str(out_glb), export_format="GLB", export_yup=True, export_apply=True,
        export_normals=True, export_texcoords=False, export_materials="EXPORT",
        export_cameras=False, export_lights=False, export_animations=False,
    )


def manifest_entry(part) -> dict:
    V, _ = part.mesh()
    entry = {"name": part.name, "system": part.system, "tissue": part.tissue, "region": part.region,
             "pack": "handmade", "vertices": int(len(V)), "source": "Handmade"}
    if part.group:
        entry["group"] = part.group
    if part.group_side:
        entry["groupSide"] = part.group_side
    if part.sex:
        entry["sex"] = part.sex
    return entry


def main() -> None:
    args = sys.argv[sys.argv.index("--") + 1 :]
    decoded, out_glb, out_manifest = (Path(a) for a in args[:3])
    only = re.compile(args[args.index("--only") + 1]) if "--only" in args else None
    skip = re.compile(args[args.index("--skip") + 1]) if "--skip" in args else None
    if skip is not None:
        # want(name) in each module: `only` matches it — a pattern matching
        # everything except what `skip` matches.
        only_or_all = only.pattern if only is not None else ".*"
        only_filter = re.compile(rf"^(?!.*(?:{skip.pattern}))(?=.*(?:{only_or_all}))")
    else:
        only_filter = only
    preview = Path(args[args.index("--preview") + 1]) if "--preview" in args else None

    body = Body(load_body(decoded))
    b = Builder(body)
    for module in (structures_neck, structures_trunk, structures_pelvis, structures_head):
        module.build(b, only_filter)

    print(f"\n{'structure':48} {'length':>7} {'inside':>7} {'gap':>6}  worst / nearest")
    failures = []
    for part in b.parts:
        worst_in, worst_mesh, gap, gap_mesh, near, emb, emb_mesh = 0.0, "", 1.0, "", [], 0.0, ""
        for piece in part.pieces:
            rep = check(body, part.name, piece.V, piece.s, part.sex, piece.allow, own=part.family + (part.name,))
            if rep.worst_inside > worst_in:
                worst_in, worst_mesh = rep.worst_inside, f"{rep.worst_inside_mesh} ({piece.label} at {rep.where_in})"
            if rep.min_gap < gap:
                gap, gap_mesh = rep.min_gap, f"{rep.min_gap_mesh} ({piece.label} at {rep.where_gap})"
            near += [n for n in rep.neighbours if n not in near]
            if rep.embedded > emb:
                emb, emb_mesh = rep.embedded, rep.embedded_mesh
            if rep.embedded > piece.allow.depth + 1e-4:
                failures.append(f"{part.name} ({piece.label}): {rep.embedded * 1000:.2f} mm into {rep.embedded_mesh} at {rep.where_embedded}, "
                                f"more than the {piece.allow.depth * 1000:.1f} mm allowed")
        print(f"{part.name:48} {part.length() * 1000:6.0f}mm {worst_in * 1000:6.2f}mm {gap * 1000:5.2f}mm"
              f"  {worst_mesh or gap_mesh} / {', '.join(near[:4])}"
              + (f"  [sinks {emb * 1000:.1f} mm into {emb_mesh}]" if emb else ""))
        if worst_in > 0 or gap < MIN_GAP:
            failures.append(f"{part.name}: inside {worst_in * 1000:.2f} mm ({worst_mesh}), gap {gap * 1000:.2f} mm ({gap_mesh})")

    tris = sum(len(p.mesh()[1]) for p in b.parts)
    print(f"\n{len(b.parts)} meshes, {tris} triangles")
    if preview:
        arrays = {}
        for p in b.parts:
            V, F = p.mesh()
            arrays[f"v_{p.name}"], arrays[f"f_{p.name}"] = V, F
            for piece in p.pieces:
                if piece.path is not None:
                    arrays[f"c_{p.name}|{piece.label}"] = piece.path
        np.savez(preview, **arrays)
    assert tris <= MAX_TRIANGLES, f"{tris} triangles > budget {MAX_TRIANGLES}"
    if failures:
        print("\nCLEARANCE FAILURES:\n  " + "\n  ".join(failures))
        if only is None:
            sys.exit(1)
        return
    if only is None:
        export(b.parts, out_glb)
        manifest = sorted((manifest_entry(p) for p in b.parts), key=lambda m: m["name"])
        out_manifest.write_text(json.dumps(manifest, indent=1, ensure_ascii=False) + "\n")
        print(f"wrote {out_glb} and {out_manifest}")


main()
