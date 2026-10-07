"""
The hand-built perineum from below, both bodies, with the hip bones, the
corpora / vagina and the external anal sphincter for context — a review
image (docs/screenshots/handmade/perineum-from-below.png); the app's camera
can't look up between the thighs.

    ~/bpyenv/bin/python scripts/anatomy/handmade/plot_perineum.py \
      out/preview-all.npz docs/screenshots/handmade/perineum-from-below.png

The preview comes from build_handmade.py --preview.
"""
import sys
from pathlib import Path

import matplotlib
import numpy as np
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.collections import PolyCollection

sys.path.insert(0, str(Path(__file__).parent))
from body_cache import load_body  # noqa: E402

body = load_body(Path(__file__).parents[3] / "out/decoded")
prev = np.load(sys.argv[1])
ours = lambda n: (prev[f"v_{n}"], prev[f"f_{n}"])
CONTEXT = {"Hip bone.l": "#e8e2d0", "Hip bone.r": "#e8e2d0", "Sacrum": "#e8e2d0", "Coccyx": "#e8e2d0",
           "External anal sphincter.l": "#b9837a", "External anal sphincter.r": "#b9837a"}
MALE = {"Corpus cavernosum of penis": "#d7a7b5", "Corpus spongiosum of penis": "#e3bcc8"}
FEMALE = {"Vagina": "#e3bcc8"}
COMMON = ["Perineal body", "Superficial transverse perineal muscle.l", "Superficial transverse perineal muscle.r",
          "Deep transverse perineal muscle.l", "Deep transverse perineal muscle.r", "Anal canal", "Internal anal sphincter"]
MALE_OURS = ["External urethral sphincter", "Bulbospongiosus muscle", "Ischiocavernosus muscle.l", "Ischiocavernosus muscle.r"]
FEMALE_OURS = ["Sphincter urethrae", "Compressor urethrae", "Urethrovaginal sphincter", "Bulbospongiosus muscle.l",
               "Bulbospongiosus muscle.r", "Ischiocavernosus muscle (female).l", "Ischiocavernosus muscle (female).r",
               "Urethra (female)", "Crus of clitoris.l", "Crus of clitoris.r", "Body of clitoris", "Glans of clitoris",
               "Bulb of vestibule.l", "Bulb of vestibule.r", "Greater vestibular gland.l", "Greater vestibular gland.r",
               "Labium minus.l", "Labium minus.r", "Vaginal vestibule"]
MALE_OURS_EXTRA = ["Bulbourethral gland.l", "Bulbourethral gland.r"]
PALETTE = [matplotlib.colormaps["tab20"](i) for i in (0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19)]
L = np.array([0.3, -0.5, -0.8]); L /= np.linalg.norm(L)

def tris(V, F, color, zmax):
    T = V[F]
    keep = T[:, :, 2].min(1) < zmax
    T = T[keep]
    n = np.cross(T[:, 1] - T[:, 0], T[:, 2] - T[:, 0])
    n /= np.linalg.norm(n, axis=1, keepdims=True) + 1e-12
    shade = 0.55 + 0.45 * np.abs(n @ L)
    c = np.array(matplotlib.colors.to_rgb(color))
    return T, np.clip(c[None] * shade[:, None], 0, 1)

def panel(ax, sex, ours_list, extra):
    polys, cols, depth = [], [], []
    for name, col in {**CONTEXT, **extra}.items():
        if name not in body: continue
        V, F, _ = body[name]
        T, C = tris(V, F, col, 0.84)
        polys.append(T); cols.append(C)
    handles = []
    names = [n for n in COMMON + ours_list if f"v_{n}" in prev.files]
    for i, name in enumerate(names):
        V, F = ours(name)
        col = PALETTE[i % len(PALETTE)]
        T, C = tris(V, F, col, 9)
        polys.append(T); cols.append(C)
        handles.append(plt.Line2D([], [], color=col, lw=6, label=name))
    T = np.vstack(polys); C = np.vstack(cols)
    order = np.argsort(-T[:, :, 2].mean(1))  # far (high) first; we look up from below
    P = T[order][:, :, [0, 1]] * 1000 * np.array([1, -1])  # x right = body's left, anterior up
    ax.add_collection(PolyCollection(P, facecolors=C[order], edgecolors="none"))
    ax.set_xlim(-75, 75); ax.set_ylim(-90, 65); ax.set_aspect("equal")
    ax.set_title(f"{sex} perineum from below (anterior up, body's left on the right), mm", fontsize=10)
    ax.legend(handles=handles, fontsize=7, loc="lower left", bbox_to_anchor=(1.01, 0), frameon=False)

fig, axes = plt.subplots(2, 1, figsize=(10, 13))
panel(axes[0], "Male", MALE_OURS + MALE_OURS_EXTRA, MALE)
panel(axes[1], "Female", FEMALE_OURS, FEMALE)
fig.tight_layout()
fig.savefig(sys.argv[2], dpi=110)
