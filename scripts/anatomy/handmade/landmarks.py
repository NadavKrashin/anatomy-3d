"""
The existing body as something to measure against: landmark queries on
named meshes (extreme vertices, ray casts, nearest surface points, slices)
and the clearance machinery (obstacle BVHs, signed distance, path
relaxation, the final clearance check). Needs bpy's `mathutils`.

Which meshes a new structure must clear depends on the body it is shown
in: a male-only structure ignores the female organs (never shown together)
and vice versa; a structure shared by both bodies must clear everything.
"""
import os
import re
from dataclasses import dataclass, field
from pathlib import Path

import bpy  # noqa: F401 — mathutils is only importable after bpy
import numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree

ROOT = Path(__file__).resolve().parents[3]
DEBUG = bool(os.environ.get("HANDMADE_DEBUG"))


def male_only_bases() -> set[str]:
    """MALE_ONLY from src/data/anatomy/z-anatomy/build.ts (one list, read here)."""
    src = (ROOT / "src/data/anatomy/z-anatomy/build.ts").read_text()
    block = re.search(r"const MALE_ONLY = new Set\(\[(.*?)\]\)", src, re.S)
    assert block, "MALE_ONLY not found in build.ts"
    return set(re.findall(r'"([^"]+)"', block.group(1)))


def base_name(name: str) -> str:
    """'Right testicular artery.r' → 'Testicular artery' (like parseName in build.ts)."""
    n = re.sub(r"\.(l|r)$", "", name)
    m = re.match(r"^(Left|Right) (.+)$", n)
    if m:
        n = m.group(2)[0].upper() + m.group(2)[1:]
    return n.strip("()")


def matches(pattern: str, name: str) -> bool:
    """A mesh name given literally ("Vagus nerve (X).l") or as a full-match regex."""
    return name == pattern or re.fullmatch(pattern, name) is not None


def _bvh(V: np.ndarray, F: np.ndarray) -> BVHTree:
    return BVHTree.FromPolygons(V.tolist(), F.tolist(), all_triangles=True)


@dataclass
class Obstacles:
    """Meshes to keep clear of, each queried on its own BVH (meshes nest in
    this model — the vagus runs inside the aortic arch — so the nearest
    surface of a union would hide being inside the outer one)."""

    body: "Body"
    names: list[str]
    lo: np.ndarray
    hi: np.ndarray

    def hits(self, P, reach: float):
        """
        For each point of P: [(mesh, nearest surface point, unit direction out
        of the mesh, signed distance)] for every mesh closer than `reach` or
        containing the point. Inside/outside comes from the winding number,
        not from normals: many meshes here are open or double-walled.
        """
        P = np.atleast_2d(np.asarray(P, float))
        out = [[] for _ in range(len(P))]
        for k, n in enumerate(self.names):
            idx = np.flatnonzero(((self.lo[k] - reach) <= P).all(1) & ((self.hi[k] + reach) >= P).all(1))
            if not len(idx):
                continue
            tree = self.body.bvh(n)
            near = [tree.find_nearest(Vector(P[i])) for i in idx]
            locs = np.array([h[0] if h[0] is not None else (np.inf, np.inf, np.inf) for h in near])
            normals = np.array([h[1] if h[1] is not None else (0, 0, 0) for h in near])
            dist = np.linalg.norm(locs - P[idx], axis=1)
            in_box = ((self.lo[k] <= P[idx]) & (self.hi[k] >= P[idx])).all(1)
            keep = (dist < reach) | in_box
            if not keep.any():
                continue
            # The (costly) winding number only to confirm an "inside" that the
            # nearest face's normal suggests (inverted or open meshes say so
            # wrongly; the winding number settles it).
            # A point further from the surface than the mesh's greatest
            # possible depth cannot be inside it (thin sheets: intercostals).
            raw_in = ((P[idx] - locs) * normals).sum(1) < 0
            ask = in_box & raw_in & (dist < self.body.max_depth(n) * 1.2 + 1e-4)
            inside = np.zeros(len(idx), bool)
            if ask.any():
                inside[ask] = self.body.winding(n, P[idx[ask]]) > 0.5
            for j in np.flatnonzero(keep):
                if dist[j] >= reach and not inside[j]:
                    continue
                v = (P[idx[j]] - locs[j]) / max(dist[j], 1e-12)
                out[idx[j]].append((n, locs[j], -v if inside[j] else v, -dist[j] if inside[j] else dist[j]))
        return out


@dataclass
class Body:
    meshes: dict[str, tuple[np.ndarray, np.ndarray, str]]
    sex: dict[str, str | None] = field(default_factory=dict)
    _bvh: dict[str, BVHTree] = field(default_factory=dict)
    _orient: dict[str, float] = field(default_factory=dict)
    _tris: dict[str, np.ndarray] = field(default_factory=dict)
    _depth: dict[str, float] = field(default_factory=dict)

    def __post_init__(self):
        male = male_only_bases()
        for n, (_, _, src) in self.meshes.items():
            self.sex[n] = "female" if src == "hra-female" else ("male" if base_name(n) in male else None)
        self._boxes()

    def _boxes(self):
        self.names = list(self.meshes)
        self.lo = np.array([self.meshes[n][0].min(0) for n in self.names])
        self.hi = np.array([self.meshes[n][0].max(0) for n in self.names])

    def add(self, name: str, V: np.ndarray, F: np.ndarray, sex: str | None) -> None:
        """A built structure becomes an obstacle for the ones built after it."""
        self.meshes[name] = (V.astype(np.float32), F, "handmade")
        self.sex[name] = sex
        self._bvh.pop(name, None)
        self._orient.pop(name, None)
        self._tris.pop(name, None)
        self._depth.pop(name, None)
        self._boxes()

    # ---- queries on one named mesh -------------------------------------
    def V(self, name: str) -> np.ndarray:
        return self.meshes[name][0].astype(float)

    def bvh(self, name: str) -> BVHTree:
        if name not in self._bvh:
            V, F, _ = self.meshes[name]
            self._bvh[name] = _bvh(V, F)
        return self._bvh[name]

    def orientation(self, name: str) -> float:
        """+1 if the mesh's triangles face outward (positive signed volume), −1 if inverted."""
        if name not in self._orient:
            V, F, _ = self.meshes[name]
            A, B_, C = (V[F[:, k]].astype(float) for k in range(3))
            vol = np.einsum("ij,ij->i", A, np.cross(B_, C)).sum()
            self._orient[name] = 1.0 if vol >= 0 else -1.0
        return self._orient[name]

    def max_depth(self, name: str) -> float:
        """Upper bound of how deep a point can be inside the mesh: 3·|volume| / area
        (the radius for a sphere, 1.5× the thickness for a sheet)."""
        if name not in self._depth:
            V, F, _ = self.meshes[name]
            A, B_, C = (V[F[:, k]].astype(float) for k in range(3))
            area = 0.5 * np.linalg.norm(np.cross(B_ - A, C - A), axis=1).sum()
            vol = abs(np.einsum("ij,ij->i", A, np.cross(B_, C)).sum()) / 6
            self._depth[name] = 3 * vol / max(area, 1e-12)
        return self._depth[name]

    def nearest(self, name: str, p) -> tuple[np.ndarray, np.ndarray, float]:
        loc, normal, _, dist = self.bvh(name).find_nearest(Vector(p))
        return np.array(loc), np.array(normal), dist

    def ray(self, name: str, origin, direction, max_dist: float = 1.0, normal: bool = False):
        loc, n, _, _ = self.bvh(name).ray_cast(Vector(origin), Vector(direction).normalized(), max_dist)
        if loc is None:
            return (None, None) if normal else None
        return (np.array(loc), np.array(n) * self.orientation(name)) if normal else np.array(loc)

    def extreme(self, name: str, direction, where=None) -> np.ndarray:
        """The vertex of `name` furthest along `direction`, among those `where(V)` keeps."""
        V = self.V(name)
        if where is not None:
            V = V[where(V)]
        assert len(V), f"no vertex of {name!r} passes the filter"
        return V[np.argmax(V @ np.asarray(direction, float))]

    def slab(self, name: str, axis: int, value: float, tol: float = 0.0015) -> np.ndarray:
        V = self.V(name)
        return V[np.abs(V[:, axis] - value) < tol]

    def section(self, name: str, axis: int, value: float) -> np.ndarray:
        """Where the mesh's triangle edges cross the plane {axis = value}: a
        cross-section at any height, however coarse the mesh (a slab of
        vertices can be empty there)."""
        V, F, _ = self.meshes[name]
        V = V.astype(float)
        E = np.vstack([F[:, [0, 1]], F[:, [1, 2]], F[:, [2, 0]]])
        a, b = V[E[:, 0]], V[E[:, 1]]
        da, db = a[:, axis] - value, b[:, axis] - value
        cut = (da * db < 0)
        t = da[cut] / (da[cut] - db[cut])
        return a[cut] + t[:, None] * (b[cut] - a[cut])

    def centre_at(self, name: str, axis: int, value: float, tol: float = 0.0015) -> np.ndarray:
        S = self.slab(name, axis, value, tol)
        assert len(S), f"{name!r} has no vertex at {'xyz'[axis]} = {value * 1000:.1f} mm"
        return (S.min(0) + S.max(0)) / 2

    def winding(self, name: str, Q: np.ndarray) -> np.ndarray:
        """
        Generalized winding number (Jacobson et al. 2013) of each point of Q:
        ~1 inside, ~0 outside, robust where ray parity and normals fail —
        vessel tubes here are open at their ends, organs have small holes,
        sheets are double-walled.
        """
        if name not in self._tris:
            V, F, _ = self.meshes[name]
            self._tris[name] = V.astype(float)[F]
        T = self._tris[name]
        Q = np.atleast_2d(np.asarray(Q, float))
        w = np.zeros(len(Q))
        step = max(64, 400_000 // max(len(Q), 1))
        for k in range(0, len(T), step):
            t = T[k : k + step]
            a = t[None, :, 0, :] - Q[:, None, :]
            b_ = t[None, :, 1, :] - Q[:, None, :]
            c = t[None, :, 2, :] - Q[:, None, :]
            la, lb, lc = (np.sqrt((x * x).sum(-1)) for x in (a, b_, c))
            det = (a * np.cross(b_, c)).sum(-1)
            den = la * lb * lc + (a * b_).sum(-1) * lc + (b_ * c).sum(-1) * la + (c * a).sum(-1) * lb
            w += np.arctan2(det, den).sum(1)
        return np.abs(w / (2 * np.pi))

    def inside(self, name: str, p) -> bool:
        return bool(self.winding(name, p)[0] > 0.5)

    # ---- obstacles ------------------------------------------------------
    def visible(self, name: str, sex: str | None) -> bool:
        s = self.sex[name]
        return s is None or sex is None or s == sex

    def obstacles(self, lo, hi, sex: str | None, exclude=(), margin: float = 0.01, only=None) -> Obstacles:
        lo, hi = np.asarray(lo) - margin, np.asarray(hi) + margin
        names = [
            n for i, n in enumerate(self.names)
            if (only is None or n in only)
            and (self.hi[i] >= lo).all() and (self.lo[i] <= hi).all()
            and self.visible(n, sex) and not any(matches(e, n) for e in exclude)
        ]
        idx = [self.names.index(n) for n in names]
        return Obstacles(self, names, self.lo[idx].reshape(-1, 3), self.hi[idx].reshape(-1, 3))


def _zones(s: np.ndarray, start: float, end: float) -> np.ndarray:
    """0 = middle, 1 = within `start` of the start, 2 = within `end` of the end, 3 = both (short pieces)."""
    z = np.zeros(len(s), int)
    z[s <= start] = 1
    z[s >= s[-1] - end] += 2
    return z


@dataclass
class Allow:
    """Meshes (full-match regexes) a structure may touch: anywhere, near its start, near its end."""

    anywhere: tuple[str, ...] = ()
    start: tuple[str, ...] = ()
    end: tuple[str, ...] = ()
    zone: float = 0.010  # metres from each end where start/end contacts are allowed
    end_zone: float | None = None
    # May lie against these (gap < 0.5 mm) but never inside them: a nerve on
    # a muscle's surface under its fascia, a duct squeezed between two vessels.
    touch: tuple[str, ...] = ()
    # Where the model leaves no room — the lungs lie directly on the heart,
    # with no pleura or pericardium between — a structure may sink into
    # these soft organs, at most `depth` metres; it stays as clear of them as
    # the hard neighbours allow and the depth is reported.
    squeeze: tuple[str, ...] = ()
    depth: float = 0.0

    def touches(self, mesh: str) -> bool:
        return any(matches(t, mesh) for t in self.touch)

    def zones(self, s):
        return _zones(s, self.zone, self.end_zone if self.end_zone is not None else self.zone)

    def exclude(self, zone: int) -> tuple[str, ...]:
        return self.anywhere + (self.start if zone in (1, 3) else ()) + (self.end if zone in (2, 3) else ())


def obstacle_sets(body: Body, pts, sex, allow: Allow, own=()):
    """Per zone: (hard obstacles, soft obstacles it may sink into)."""
    lo, hi = pts.min(0), pts.max(0)
    own = tuple(re.escape(o) for o in own)
    sets = {}
    for z in (0, 1, 2, 3):
        hard = body.obstacles(lo, hi, sex, allow.exclude(z) + own + allow.squeeze)
        if allow.squeeze:
            soft_names = [n for n in body.names if any(matches(q, n) for q in allow.squeeze)
                          and not any(matches(e, n) for e in allow.exclude(z) + own)]
            soft = body.obstacles(lo, hi, sex, only=set(soft_names))
        else:
            soft = Obstacles(body, [], np.zeros((0, 3)), np.zeros((0, 3)))
        sets[z] = (hard, soft)
    return sets


LAST_WORST = [""]


def _push(hits, need_of) -> tuple[np.ndarray, float]:
    """Displacement that brings a point to signed distance ≥ need_of(mesh) from every hit."""
    D, worst = np.zeros(3), 0.0
    for mesh, _, out, sd in hits:
        need = need_of(mesh)
        if sd >= need:
            continue
        D += out * (need - sd) * 1.05
        if need - sd > worst:
            worst = need - sd
            LAST_WORST[0] = mesh
    return D, worst


def relax(body: Body, path: np.ndarray, radius, sex, allow: Allow, clearance: float = 0.0008,
          iterations: int = 140, pin=(True, True), own=(), spacing: float = 0.006) -> np.ndarray:
    """
    Push a course out of every mesh it must not touch until each point is at
    least radius + clearance from them (touch meshes: radius + 0.2 mm; soft
    `squeeze` organs: as far as the hard ones allow), keeping it smooth: the
    control points of a centripetal Catmull-Rom spline, one every `spacing`,
    move by the (weighted) pushes their dense 2 mm samples need. Returns the
    dense course.
    """
    from shapes import arc_length, catmull_rom, resample, smooth  # noqa: PLC0415

    total = arc_length(path)[-1]
    C = resample(path, max(min(spacing, total / 3), 0.0015))
    radius_at = lambda s_: np.interp(s_, arc_length(path), np.broadcast_to(np.asarray(radius, float), (len(path),)))  # noqa: E731
    sets = obstacle_sets(body, path, sex, allow, own)
    hard_need = lambda r_: (lambda m: r_ + (0.0002 if allow.touches(m) else clearance))  # noqa: E731
    for it in range(iterations):
        P, u = catmull_rom(C, with_u=True)
        s_ = arc_length(P)
        r = radius_at(s_ * total / max(s_[-1], 1e-9))
        zones = allow.zones(s_)
        acc, wsum, worst, worst_at = np.zeros_like(C), np.zeros(len(C)), 0.0, ""
        hard_hits, soft_hits = [[]] * len(P), [[]] * len(P)
        for z in (0, 1, 2, 3):
            sel = np.flatnonzero(zones == z)
            if len(sel):
                for i, h in zip(sel, sets[z][0].hits(P[sel], 0.004)):
                    hard_hits[i] = h
                for i, h in zip(sel, sets[z][1].hits(P[sel], 0.004)):
                    soft_hits[i] = h
        for i, p in enumerate(P):
            # Soft organs only push back past the allowed depth.
            d_soft, _ = _push(soft_hits[i], lambda m: r[i] + clearance - allow.depth)
            d_hard, w = _push(hard_hits[i], hard_need(r[i]))
            d = 0.5 * d_soft + d_hard
            if w > worst:
                worst, worst_at = w, f"{LAST_WORST[0]} at {np.round(p * 1000).astype(int)}"
            k = min(int(u[i]), len(C) - 2)
            t = u[i] - k
            for j, wt in ((k, 1 - t), (k + 1, t)):
                acc[j] += wt * d
                wsum[j] += wt
        if DEBUG:
            print(f"    relax it {it}: worst {worst * 1000:.2f} mm ({worst_at}), {len(C)} control points")
        if worst < 2e-5 and it > 0:
            break
        D = acc / np.maximum(wsum, 1e-9)[:, None] * 1.6
        D *= np.minimum(1.0, 0.0015 / np.maximum(np.linalg.norm(D, axis=1, keepdims=True), 1e-12))
        # Smooth the displacement, not the shape (shape smoothing shrinks hooks and loops).
        if it < iterations * 0.6:
            D = smooth(D, 1, fixed=0)
        if pin[0]:
            D[0] = 0
        if pin[1]:
            D[-1] = 0
        C = C + D
    return catmull_rom(C)


@dataclass
class Report:
    name: str
    worst_inside: float  # deepest vertex inside another mesh (m), 0 if none
    worst_inside_mesh: str
    min_gap: float  # smallest distance to a mesh it should not touch (m)
    min_gap_mesh: str
    neighbours: list[str]
    embedded: float = 0.0  # deepest vertex inside a `squeeze` organ (m)
    embedded_mesh: str = ""
    where_in: tuple = ()  # the deepest vertex inside, mm
    where_gap: tuple = ()  # the closest vertex, mm
    where_embedded: tuple = ()


def check(body: Body, name: str, V, s, sex, allow: Allow, own=()) -> Report:
    """Clearance of a built mesh: nothing inside a non-allowed mesh, ≥ 0.5 mm away from it;
    sinking into a `squeeze` organ is measured separately (Report.embedded)."""
    zones = allow.zones(s) if len(s) and s.max() > 0 else np.zeros(len(V), int)
    sets = obstacle_sets(body, V, sex, allow, own)
    worst_in, worst_in_mesh, gap, gap_mesh, embedded, embedded_mesh = 0.0, "", 1.0, "", 0.0, ""
    near: dict[str, float] = {}
    where_in, where_gap, where_emb = (), (), ()
    for z in (0, 1, 2, 3):
        sel = np.flatnonzero(zones == z)
        if not len(sel):
            continue
        hard, soft = sets[z]
        for i, hits in zip(sel, soft.hits(V[sel], 0.0)):
            for mesh, _, _, sd in hits:
                if -sd > embedded:
                    embedded, embedded_mesh, where_emb = -sd, mesh, tuple(np.round(V[i] * 1000).astype(int))
        for i, hits in zip(sel, hard.hits(V[sel], 0.005)):
            p = V[i]
            for mesh, _, _, sd in hits:
                near[mesh] = min(near.get(mesh, 1.0), abs(sd))
                if sd < -2e-5:
                    if -sd > worst_in:
                        worst_in, worst_in_mesh, where_in = -sd, mesh, tuple(np.round(p * 1000).astype(int))
                elif abs(sd) < gap and not allow.touches(mesh):
                    gap, gap_mesh, where_gap = abs(sd), mesh, tuple(np.round(p * 1000).astype(int))
    return Report(name, worst_in, worst_in_mesh, gap, gap_mesh, sorted(near, key=near.get)[:4],
                  embedded, embedded_mesh, where_in, where_gap, where_emb)
