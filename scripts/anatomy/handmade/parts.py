"""
What a hand-built structure is made of, and the helpers every structure
module uses: a Part is one exported mesh (one manifest entry); it is built
from Pieces (a trunk, its roots, its branches), each with its own clearance
allowances, checked separately and merged at export.
"""
from dataclasses import dataclass, field

import numpy as np

from landmarks import Allow, Body, obstacle_sets, relax
from shapes import catmull_rom, tube, taper


@dataclass
class Piece:
    label: str
    V: np.ndarray
    F: np.ndarray
    s: np.ndarray
    allow: Allow
    path: np.ndarray | None = None
    radius: np.ndarray | None = None


@dataclass
class Part:
    name: str
    system: str
    tissue: str
    region: str
    pieces: list[Piece] = field(default_factory=list)
    sex: str | None = None
    group: str | None = None
    group_side: str | None = None
    # Other parts this one may touch (its parent nerve, its own branches).
    family: tuple[str, ...] = ()

    def mesh(self):
        V, F, off = [], [], 0
        for p in self.pieces:
            V.append(p.V)
            F.append(p.F + off)
            off += len(p.V)
        return np.vstack(V), np.vstack(F)

    def length(self) -> float:
        return sum(float(np.linalg.norm(np.diff(p.path, axis=0), axis=1).sum()) for p in self.pieces if p.path is not None)


class Builder:
    """Shared state: the body (with the parts built so far as obstacles) and the parts."""

    def __init__(self, body: Body):
        self.body = body
        self.parts: list[Part] = []

    def vessel(self, part: Part, label: str, ctrl, radius: float, allow: Allow = Allow(), *,
               start_taper: float = 0.0, end_taper: float = 0.006, tip: float = 0.45,
               segments: int = 10, do_relax: bool = True, pin=(True, True), clearance: float = 0.0009,
               path=None, spacing: float = 0.006, flatten=None, up=None, step: float | None = None,
               fit: bool | None = None) -> Piece:
        """
        A tube through control points: spline → relaxed out of neighbours →
        swept circle (or a flat band: `flatten` = thickness / width, the width
        along `up`; relaxed conservatively with the half-width as radius).
        `step`: sample spacing along the course (default 2 mm; finer for
        structures a few millimetres long, like the middle ear's muscles).
        `fit`: narrow the tube where neighbours leave no room (fit_radius;
        default: when relaxing).
        """
        P = (catmull_rom(ctrl, step) if step else catmull_rom(ctrl)) if path is None else path
        r = taper(P, radius, start_taper, end_taper, tip)
        if do_relax:
            P = relax(self.body, P, r, part.sex, allow, clearance=clearance, pin=pin,
                      own=part.family + (part.name,), spacing=spacing, step=step)
            r = taper(P, radius, start_taper, end_taper, tip)
            # A second pass with control points twice as dense fixes what is
            # left locally without disturbing the course.
            P = relax(self.body, P, r, part.sex, allow, clearance=clearance, pin=pin,
                      own=part.family + (part.name,), spacing=spacing / 2, iterations=60, step=step)
            r = taper(P, radius, start_taper, end_taper, tip)
        if do_relax if fit is None else fit:
            r = self.fit_radius(P, r, part, allow)
        V, F, s = tube(P, r, segments, flatten=flatten, up=up)
        piece = Piece(label, V, F, s, allow, P, r)
        part.pieces.append(piece)
        return piece

    def fit_radius(self, P: np.ndarray, r: np.ndarray, part: Part, allow: Allow) -> np.ndarray:
        """
        Where neighbours leave less room than the nominal radius (this model is
        crowded: the neck's vessels overlap), the tube narrows locally — to
        0.6 mm short of a mesh it must not touch, 0.15 mm short of one it may
        touch — never below half its radius, smoothly along the course.
        """
        from landmarks import _zones  # noqa: PLC0415
        from shapes import arc_length, smooth  # noqa: PLC0415

        zones = allow.zones(arc_length(P))
        sets = obstacle_sets(self.body, P, part.sex, allow, part.family + (part.name,))
        limit = np.full(len(P), np.inf)
        for z in (0, 1, 2, 3):
            sel = np.flatnonzero(zones == z)
            if len(sel):
                for i, hits in zip(sel, sets[z][0].hits(P[sel], 0.005)):
                    for m, _, _, sd in hits:
                        limit[i] = min(limit[i], sd - (0.00015 if allow.touches(m) else 0.0006))
        if np.isinf(limit).all():
            return r
        lim = np.minimum.reduce([np.roll(limit, k) for k in (-1, 0, 1)])
        lim[0], lim[-1] = limit[0], limit[-1]
        out = np.minimum(r, smooth(np.minimum(lim, r), 2, fixed=0))
        out = np.minimum(out, limit)
        return np.maximum(out, 0.5 * r)

    def free(self, p, radius: float, sex=None, allow: Allow = Allow(), search: float = 0.004,
             own=(), clearance: float = 0.0010) -> np.ndarray:
        """
        The point nearest to p (within `search`) that keeps radius + clearance
        from every mesh it may not touch — for points pinned at both ends of
        tubes (a nerve's division, a branch's ending), which relaxation can't
        move. Falls back to the roomiest point found.
        """
        p = np.asarray(p, float)
        g = np.arange(-search, search + 1e-9, 0.0005)
        G = np.array([(x, y, z) for x in g for y in g for z in g if x * x + y * y + z * z <= search * search])
        G = G[np.argsort(np.linalg.norm(G, axis=1))] + p
        hard = obstacle_sets(self.body, np.vstack([p - search, p + search]), sex, allow, own)[0][0]
        need = radius + clearance
        best, best_room = p, -1.0
        for start in range(0, len(G), 400):
            chunk = G[start : start + 400]
            for q, hits in zip(chunk, hard.hits(chunk, need + 0.002)):
                room = min((sd for m, _, _, sd in hits if not allow.touches(m)), default=1.0)
                room = min([room] + [sd + need - radius - 0.0002 for m, _, _, sd in hits if allow.touches(m)])
                if room >= need:
                    return q
                if room > best_room:
                    best, best_room = q, room
        return best

    def solid(self, part: Part, label: str, mesh, allow: Allow = Allow()) -> Piece:
        V, F, s = mesh
        piece = Piece(label, V, F, s, allow)
        part.pieces.append(piece)
        return piece

    def add(self, part: Part) -> Part:
        V, F = part.mesh()
        self.body.add(part.name, V, F, part.sex)
        self.parts.append(part)
        return part


def point_at(path: np.ndarray, z: float) -> np.ndarray:
    """The point of a (mostly vertical) path closest to height z."""
    return path[np.argmin(np.abs(path[:, 2] - z))]


def along(path: np.ndarray, fraction: float) -> tuple[np.ndarray, np.ndarray]:
    """Point and unit tangent at a fraction of a path's length."""
    s = np.r_[0, np.cumsum(np.linalg.norm(np.diff(path, axis=0), axis=1))]
    i = int(np.clip(np.searchsorted(s, fraction * s[-1]), 1, len(path) - 2))
    t = path[i + 1] - path[i - 1]
    return path[i], t / np.linalg.norm(t)


def unit(v) -> np.ndarray:
    v = np.asarray(v, float)
    return v / np.linalg.norm(v)


MM = 0.001
