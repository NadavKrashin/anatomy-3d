"""
The audit (docs/DECISIONS.md → "Audit") for the hand-built meshes, on the
shipped GLBs: sides, regions by height, mutual duplicates, floating parts.

    npx tsx scripts/anatomy/audit-extract.ts out/audit.json \
      public/models/z-anatomy/{skeleton,muscles,nerves,organs,vessels}.glb \
      public/models/{open3dmodel,bodyparts3d}/extras.glb \
      public/models/hra/female.glb public/models/handmade/handmade.glb
    ~/bpyenv/bin/python scripts/anatomy/handmade/audit_handmade.py out/audit.json

Which body each mesh belongs to is checked by build.test.ts instead.
"""
import json
import sys

import numpy as np
from scipy.spatial import cKDTree

nodes = json.load(open(sys.argv[1]))
manifest = {e["name"]: e for e in json.load(open("src/data/anatomy/z-anatomy/manifest-handmade.json"))}
ours = [n for n in nodes if n["file"].endswith("handmade.glb")]
MM = 1000.0  # the GLBs are in metres; glTF frame: y up, +z front, +x the body's left
points = {id(n): np.array(n["sample"]) * MM for n in nodes}
trees = {id(n): cKDTree(points[id(n)]) for n in nodes}
by_name = {n["name"]: n for n in nodes}
band = {k: (by_name[v]["lo"][1] * MM, by_name[v]["hi"][1] * MM)
        for k, v in [("mandible", "Mandible"), ("manubrium", "Manubrium of sternum"), ("sacrum", "Sacrum")]}


def region_fits(region: str, y: float) -> bool:
    return {
        "neck": band["manubrium"][1] - 30 <= y <= band["mandible"][1],
        "thorax": band["sacrum"][1] <= y <= band["manubrium"][1] + 60,
        "abdomen": band["sacrum"][0] <= y <= band["manubrium"][0],
        "pelvis": y <= band["sacrum"][1],
    }.get(region, True)


failures = []
for n in ours:
    name, entry = n["name"], manifest[n["name"]]
    c = np.array(n["c"]) * MM
    if (name.endswith(".l") and c[0] <= 0) or (name.endswith(".r") and c[0] >= 0):
        failures.append(f"side: {name} centre x = {c[0]:.0f} mm")
    if not region_fits(entry["region"], c[1]):
        failures.append(f"region: {name} is {entry['region']} at height {c[1]:.0f} mm")
    p = points[id(n)]
    nearest = np.full(len(p), np.inf)
    who = [""] * len(p)
    for o in nodes:
        if o is n:
            continue
        lo, hi = np.array(o["lo"]) * MM, np.array(o["hi"]) * MM
        if (p.min(0) > hi + 25).any() or (p.max(0) < lo - 25).any():
            continue
        d, _ = trees[id(o)].query(p, distance_upper_bound=25)
        for i in np.flatnonzero(d < nearest):
            who[i] = o["name"]
        nearest = np.minimum(nearest, d)
        back, _ = trees[id(n)].query(points[id(o)], distance_upper_bound=1.5)
        a, b = (d <= 1.5).mean(), (back <= 1.5).mean()
        if min(a, b) >= 0.6:
            failures.append(f"duplicate: {name} ~ {o['name']} ({a:.0%} / {b:.0%})")
    far = np.flatnonzero(nearest > 10)
    worst = float(np.max(np.where(np.isinf(nearest), 25, nearest)))
    print(f"{name:48} {entry['region']:8} height {c[1]:5.0f} mm   farthest from any mesh {worst:5.1f} mm")
    if len(far):
        i = far[np.argmax(nearest[far])]
        failures.append(f"floating: {name}: {len(far)}/{len(p)} samples > 10 mm from any mesh "
                        f"(worst {nearest[i]:.0f} mm at {np.round(p[i]).astype(int).tolist()}, nearest {who[i]})")
print("\nall checks pass" if not failures else "\nFINDINGS:\n  " + "\n  ".join(failures))
