"""
Pure-numpy geometry for the hand-built structures (no bpy): paths, tubes,
bands, sleeves and ellipsoids. Units are metres, like the Blender frame.

Every builder returns (vertices (n, 3), triangles (m, 3), s (n,)) where `s`
is each vertex's arc length along the structure's path; the clearance check
uses it to allow contact only near a structure's own origin or ending.
"""
import numpy as np

STEP = 0.002  # resample paths every 2 mm (HANDMADE_MODELS_PROMPT.md §5)


def catmull_rom(points, step: float = STEP, alpha: float = 0.5, with_u: bool = False):
    """Centripetal Catmull-Rom spline through `points`, resampled every `step`.
    With `with_u`, also each sample's parameter u = k + t (between point k and k + 1)."""
    P = np.asarray(points, float)
    keep = np.r_[True, np.linalg.norm(np.diff(P, axis=0), axis=1) > 1e-6]
    P = P[keep]
    if len(P) < 2:
        raise ValueError("a path needs two distinct points")
    # Phantom end points continue the first/last segment.
    P = np.vstack([2 * P[0] - P[1], P, 2 * P[-1] - P[-2]])
    dense, us = [], []
    for i in range(1, len(P) - 2):
        p0, p1, p2, p3 = P[i - 1 : i + 3]
        t0 = 0.0
        t1 = t0 + np.linalg.norm(p1 - p0) ** alpha
        t2 = t1 + np.linalg.norm(p2 - p1) ** alpha
        t3 = t2 + np.linalg.norm(p3 - p2) ** alpha
        n = max(8, int(np.linalg.norm(p2 - p1) / (step / 4)))
        for t in np.linspace(t1, t2, n, endpoint=False):
            us.append(i - 1 + (t - t1) / (t2 - t1))
            a1 = (t1 - t) / (t1 - t0) * p0 + (t - t0) / (t1 - t0) * p1
            a2 = (t2 - t) / (t2 - t1) * p1 + (t - t1) / (t2 - t1) * p2
            a3 = (t3 - t) / (t3 - t2) * p2 + (t - t2) / (t3 - t2) * p3
            b1 = (t2 - t) / (t2 - t0) * a1 + (t - t0) / (t2 - t0) * a2
            b2 = (t3 - t) / (t3 - t1) * a2 + (t - t1) / (t3 - t1) * a3
            dense.append((t2 - t) / (t2 - t1) * b1 + (t - t1) / (t2 - t1) * b2)
    dense.append(P[-2])
    us.append(len(P) - 3)
    D = np.array(dense)
    if not with_u:
        return resample(D, step)
    sl = arc_length(D)
    n = max(2, int(round(sl[-1] / step)) + 1)
    t = np.linspace(0, sl[-1], n)
    return np.column_stack([np.interp(t, sl, D[:, k]) for k in range(3)]), np.interp(t, sl, np.array(us))


def arc_length(path: np.ndarray) -> np.ndarray:
    return np.r_[0.0, np.cumsum(np.linalg.norm(np.diff(path, axis=0), axis=1))]


def resample(path: np.ndarray, step: float = STEP) -> np.ndarray:
    s = arc_length(path)
    n = max(2, int(round(s[-1] / step)) + 1)
    t = np.linspace(0, s[-1], n)
    return np.column_stack([np.interp(t, s, path[:, k]) for k in range(3)])


def smooth(path: np.ndarray, iterations: int = 1, fixed: int = 1) -> np.ndarray:
    """Laplacian smoothing with the first/last `fixed` points pinned."""
    P = path.copy()
    for _ in range(iterations):
        Q = P.copy()
        Q[1:-1] = 0.25 * P[:-2] + 0.5 * P[1:-1] + 0.25 * P[2:]
        Q[:fixed], Q[-fixed:] = P[:fixed], P[-fixed:]
        P = Q
    return P


def transport_frames(path: np.ndarray, up=None) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Tangents and parallel-transport normals/binormals (no twist along the path)."""
    T = np.gradient(path, axis=0)
    T /= np.linalg.norm(T, axis=1, keepdims=True)
    ref = np.array(up if up is not None else (0, 0, 1.0), float)
    if abs(T[0] @ ref) > 0.9:
        ref = np.array((1.0, 0, 0)) if abs(T[0][0]) < 0.9 else np.array((0, 1.0, 0))
    N = np.zeros_like(path)
    N[0] = ref - (ref @ T[0]) * T[0]
    N[0] /= np.linalg.norm(N[0])
    for i in range(1, len(path)):
        v = N[i - 1] - (N[i - 1] @ T[i]) * T[i]
        N[i] = v / np.linalg.norm(v)
    return T, N, np.cross(T, N)


def _rings_to_mesh(rings: np.ndarray, s: np.ndarray, caps: bool, closed_loop: bool = False):
    """rings (n, k, 3) → quads between consecutive rings, optional fan caps."""
    n, k, _ = rings.shape
    V = rings.reshape(-1, 3)
    S = np.repeat(s, k)
    F = []
    last = n if closed_loop else n - 1
    for i in range(last):
        a, b = i * k, ((i + 1) % n) * k
        for j in range(k):
            j2 = (j + 1) % k
            F += [(a + j, b + j, b + j2), (a + j, b + j2, a + j2)]
    if caps and not closed_loop:
        c0, c1 = len(V), len(V) + 1
        V = np.vstack([V, rings[0].mean(0), rings[-1].mean(0)])
        S = np.r_[S, s[0], s[-1]]
        b = (n - 1) * k
        for j in range(k):
            j2 = (j + 1) % k
            F += [(c0, j2, j), (c1, b + j, b + j2)]
    return V, np.array(F, np.int32), S


def tube(path, radius, segments: int = 10, caps: bool = True, flatten=None, up=None):
    """
    Circle (or ellipse) swept along `path` on parallel-transport frames.
    `radius`: scalar or per-point array. `flatten`: optional (per-point)
    ratio of the second semi-axis to the first, for bands; `up` orients the
    first semi-axis at the start.
    """
    path = np.asarray(path, float)
    r = np.broadcast_to(np.asarray(radius, float), (len(path),))
    f = np.broadcast_to(np.asarray(1.0 if flatten is None else flatten, float), (len(path),))
    _, N, Bn = transport_frames(path, up)
    ang = np.linspace(0, 2 * np.pi, segments, endpoint=False)
    rings = (
        path[:, None, :]
        + (r[:, None, None] * np.cos(ang)[None, :, None]) * N[:, None, :]
        + (r[:, None, None] * f[:, None, None] * np.sin(ang)[None, :, None]) * Bn[:, None, :]
    )
    return _rings_to_mesh(rings, arc_length(path), caps)


def band(path, width, thickness, normals, segments: int = 12):
    """
    A flat muscle band: an elliptical section `width` × `thickness` (full
    sizes, per point or scalar) whose thin axis follows `normals` (per point).
    """
    path = np.asarray(path, float)
    T = np.gradient(path, axis=0)
    T /= np.linalg.norm(T, axis=1, keepdims=True)
    Nn = np.asarray(normals, float)
    Nn = np.broadcast_to(Nn, path.shape).copy()
    Nn -= (Nn * T).sum(1, keepdims=True) * T
    Nn /= np.linalg.norm(Nn, axis=1, keepdims=True)
    W = np.cross(Nn, T)
    w = np.broadcast_to(np.asarray(width, float), (len(path),)) / 2
    t = np.broadcast_to(np.asarray(thickness, float), (len(path),)) / 2
    ang = np.linspace(0, 2 * np.pi, segments, endpoint=False)
    rings = (
        path[:, None, :]
        + (w[:, None, None] * np.cos(ang)[None, :, None]) * W[:, None, :]
        + (t[:, None, None] * np.sin(ang)[None, :, None]) * Nn[:, None, :]
    )
    return _rings_to_mesh(rings, arc_length(path), caps=True)


def sleeve(path, r_inner, r_outer, segments: int = 24, flatten=None, up=None):
    """A thick-walled cylinder (a sphincter cuff) along `path`: outer and inner walls plus rims."""
    path = np.asarray(path, float)
    n = len(path)
    ri = np.broadcast_to(np.asarray(r_inner, float), (n,))
    ro = np.broadcast_to(np.asarray(r_outer, float), (n,))
    f = np.broadcast_to(np.asarray(1.0 if flatten is None else flatten, float), (n,))
    _, N, Bn = transport_frames(path, up)
    ang = np.linspace(0, 2 * np.pi, segments, endpoint=False)

    def rings(r):
        return (
            path[:, None, :]
            + (r[:, None, None] * np.cos(ang)[None, :, None]) * N[:, None, :]
            + (r[:, None, None] * f[:, None, None] * np.sin(ang)[None, :, None]) * Bn[:, None, :]
        )

    s = arc_length(path)
    Vo, Fo, So = _rings_to_mesh(rings(ro), s, caps=False)
    Vi, Fi, Si = _rings_to_mesh(rings(ri), s, caps=False)
    k, off = segments, len(Vo)
    F = [Fo, Fi[:, ::-1] + off]
    rims = []
    for row in (0, n - 1):
        for j in range(k):
            j2 = (j + 1) % k
            a, b = row * k + j, row * k + j2
            tri = [(a, b, off + b), (a, off + b, off + a)]
            rims += tri if row == n - 1 else [t[::-1] for t in tri]
    F.append(np.array(rims, np.int32))
    return np.vstack([Vo, Vi]), np.vstack(F), np.r_[So, Si]


def ellipsoid(center, axes, radii, nu: int = 20, nv: int = 12):
    """Ellipsoid with semi-axes `radii` along the rows of `axes` (orthonormal)."""
    A = np.asarray(axes, float)
    r = np.asarray(radii, float)
    V = []
    for i in range(1, nv):
        th = np.pi * i / nv
        for j in range(nu):
            ph = 2 * np.pi * j / nu
            u = np.array([np.sin(th) * np.cos(ph), np.sin(th) * np.sin(ph), np.cos(th)])
            V.append(center + (u * r) @ A)
    top, bot = len(V), len(V) + 1
    V += [center + r[2] * A[2], center - r[2] * A[2]]
    F = []
    for i in range(nv - 2):
        for j in range(nu):
            a, b = i * nu + j, i * nu + (j + 1) % nu
            c, d = a + nu, b + nu
            F += [(a, c, d), (a, d, b)]
    last = (nv - 2) * nu
    for j in range(nu):
        F += [(top, j, (j + 1) % nu), (bot, last + (j + 1) % nu, last + j)]
    V = np.array(V)
    return V, np.array(F, np.int32), np.zeros(len(V))


def spindle(path, radius_max, flatten=1.0, segments: int = 14, up=None):
    """A sac/spindle along `path`: radius rises as a sine from the ends (cisterna chyli)."""
    path = np.asarray(path, float)
    s = arc_length(path)
    r = radius_max * np.sin(np.pi * np.clip(s / s[-1], 0.02, 0.98)) ** 0.7
    return tube(path, r, segments, caps=True, flatten=flatten, up=up)


def taper(path: np.ndarray, r0: float, start: float = 0.0, end: float = 0.0, tip: float = 0.45) -> np.ndarray:
    """Per-point radius: r0, narrowing to `tip`·r0 over the first `start` / last `end` metres."""
    s = arc_length(path)
    r = np.full(len(path), r0)
    if start > 0:
        r *= np.clip(tip + (1 - tip) * s / start, tip, 1)
    if end > 0:
        r *= np.clip(tip + (1 - tip) * (s[-1] - s) / end, tip, 1)
    return r


def merge(*parts):
    """Concatenate several (V, F, s) meshes into one."""
    V, F, S, off = [], [], [], 0
    for v, f, s in parts:
        V.append(v)
        F.append(f + off)
        S.append(s)
        off += len(v)
    return np.vstack(V), np.vstack(F), np.concatenate(S)


def mirror(mesh):
    """x → −x (the body is exactly symmetric), flipping triangle winding."""
    V, F, S = mesh
    return V * np.array([-1.0, 1, 1]), F[:, ::-1].copy(), S.copy()


def arc_band(sections, theta0: float, theta1: float, offset: float, thickness: float, m: int = 14):
    """
    A curved muscle sheet wrapped part-way round an elongated organ (the
    bulb, a crus): for each section (centre, u, v, a, b) — an ellipse
    c + a·cosθ·u + b·sinθ·v — the sheet spans θ0…θ1 (radians), from
    `offset` to `offset + thickness` outside the ellipse. Closed solid.
    """
    th = np.linspace(theta0, theta1, m)
    n = len(sections)

    def grid(extra):
        G = np.zeros((n, m, 3))
        for i, (c, u, v, a, b_) in enumerate(sections):
            G[i] = c + np.outer((a + extra) * np.cos(th), u) + np.outer((b_ + extra) * np.sin(th), v)
        return G

    inner, outer = grid(offset), grid(offset + thickness)
    V = np.vstack([inner.reshape(-1, 3), outer.reshape(-1, 3)])
    off = n * m
    idx = lambda i, j, k: k * off + i * m + j  # noqa: E731
    F = []
    for i in range(n - 1):
        for j in range(m - 1):
            a, b_, c, d = idx(i, j, 1), idx(i + 1, j, 1), idx(i + 1, j + 1, 1), idx(i, j + 1, 1)
            F += [(a, b_, c), (a, c, d)]  # outer
            a, b_, c, d = idx(i, j, 0), idx(i + 1, j, 0), idx(i + 1, j + 1, 0), idx(i, j + 1, 0)
            F += [(a, c, b_), (a, d, c)]  # inner (reversed)
    for i in range(n - 1):  # the two long edges
        for j in (0, m - 1):
            a, b_, c, d = idx(i, j, 0), idx(i + 1, j, 0), idx(i + 1, j, 1), idx(i, j, 1)
            F += [(a, b_, c), (a, c, d)] if j == 0 else [(a, c, b_), (a, d, c)]
    for i in (0, n - 1):  # the two ends
        for j in range(m - 1):
            a, b_, c, d = idx(i, j, 0), idx(i, j + 1, 0), idx(i, j + 1, 1), idx(i, j, 1)
            F += [(a, b_, c), (a, c, d)] if i == 0 else [(a, c, b_), (a, d, c)]
    centres = np.array([sec[0] for sec in sections])
    s = np.concatenate([np.repeat(arc_length(centres), m)] * 2)
    return V, np.array(F, np.int32), s
