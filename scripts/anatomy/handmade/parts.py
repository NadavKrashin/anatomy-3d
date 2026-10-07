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
               path=None, spacing: float = 0.006) -> Piece:
        """A tube through control points: spline → relaxed out of neighbours → swept circle."""
        P = catmull_rom(ctrl) if path is None else path
        r = taper(P, radius, start_taper, end_taper, tip)
        if do_relax:
            P = relax(self.body, P, r, part.sex, allow, clearance=clearance, pin=pin,
                      own=part.family + (part.name,), spacing=spacing)
            r = taper(P, radius, start_taper, end_taper, tip)
            # A second pass with control points twice as dense fixes what is
            # left locally without disturbing the course.
            P = relax(self.body, P, r, part.sex, allow, clearance=clearance, pin=pin,
                      own=part.family + (part.name,), spacing=spacing / 2, iterations=60)
            r = taper(P, radius, start_taper, end_taper, tip)
        V, F, s = tube(P, r, segments)
        piece = Piece(label, V, F, s, allow, P, r)
        part.pieces.append(piece)
        return piece

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
