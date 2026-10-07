"""
The existing body, as world-space numpy arrays, for build_handmade.py.

Imports the decoded GLBs (scripts/anatomy/decode-glb.ts) with Blender's glTF
importer — the frame every export script uses: metres, Z up, +X = the
body's left, -Y = anterior — and caches every mesh's world vertices and
triangles in one .npz next to them, so later runs skip the slow import.
The cache is rebuilt when any GLB is newer than it.
"""
from pathlib import Path

import numpy as np

GLBS = (
    "z-anatomy-skeleton", "z-anatomy-muscles", "z-anatomy-nerves", "z-anatomy-vessels",
    "z-anatomy-organs", "open3dmodel-extras", "bodyparts3d-extras", "hra-female",
    "non-commercial-non-commercial",
)


def _import_with_bpy(paths: list[Path]) -> dict[str, tuple[np.ndarray, np.ndarray, str]]:
    import bpy  # noqa: PLC0415 — only when the cache is stale

    bpy.ops.wm.read_factory_settings(use_empty=True)
    meshes = {}
    for path in paths:
        before = set(bpy.data.objects)
        bpy.ops.import_scene.gltf(filepath=str(path))
        for obj in set(bpy.data.objects) - before:
            if obj.type != "MESH" or not obj.data.polygons:
                continue
            m = np.array(obj.matrix_world)
            co = np.empty(len(obj.data.vertices) * 3)
            obj.data.vertices.foreach_get("co", co)
            V = co.reshape(-1, 3) @ m[:3, :3].T + m[:3, 3]
            obj.data.calc_loop_triangles()
            tri = np.empty(len(obj.data.loop_triangles) * 3, np.int32)
            obj.data.loop_triangles.foreach_get("vertices", tri)
            meshes[obj.name] = (V.astype(np.float32), tri.reshape(-1, 3), path.stem)
    return meshes


def load_body(decoded_dir: Path) -> dict[str, tuple[np.ndarray, np.ndarray, str]]:
    """Mesh name → (world vertices (n, 3) in metres, triangles (m, 3), source file stem)."""
    paths = [decoded_dir / f"{g}.glb" for g in GLBS]
    missing = [p for p in paths if not p.exists()]
    assert not missing, f"decode the shipped GLBs first (README.md): missing {missing}"
    cache = decoded_dir / "body-cache.npz"
    if cache.exists() and cache.stat().st_mtime > max(p.stat().st_mtime for p in paths):
        data = np.load(cache, allow_pickle=False)
        names = data["names"].tolist()
        files = data["files"].tolist()
        return {n: (data[f"v{i}"], data[f"f{i}"], files[i]) for i, n in enumerate(names)}
    meshes = _import_with_bpy(paths)
    names = list(meshes)
    arrays = {}
    for i, n in enumerate(names):
        arrays[f"v{i}"], arrays[f"f{i}"] = meshes[n][0], meshes[n][1]
    np.savez(cache, names=np.array(names), files=np.array([meshes[n][2] for n in names]), **arrays)
    return meshes
