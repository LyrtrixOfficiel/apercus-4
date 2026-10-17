// Méridiens : outils de tracé partagés (navigateur et node).
// Les dessins sont décrits par des points d'ancrage, lissés en courbes de Bézier (Catmull-Rom centripète),
// ce qui donne des contours souples et continus, comme tracés à la plume.

export const r1 = (v) => Math.round(v * 10) / 10;

// Points -> chemin lisse (ouvert ou fermé). Catmull-Rom centripète (alpha 0,5) : pas de boucles ni de pointes.
export function lisse(pts, ferme = false, tension = 1) {
  const n = pts.length;
  if (n < 2) return '';
  const P = (i) => ferme ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
  let d = `M${r1(pts[0][0])} ${r1(pts[0][1])}`;
  const fin = ferme ? n : n - 1;
  for (let i = 0; i < fin; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    const d1 = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) ** .5 || 1e-4;
    const d2 = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) ** .5 || 1e-4;
    const d3 = Math.hypot(p3[0] - p2[0], p3[1] - p2[1]) ** .5 || 1e-4;
    const c1 = [
      (d1 * d1 * p2[0] - d2 * d2 * p0[0] + (2 * d1 * d1 + 3 * d1 * d2 + d2 * d2) * p1[0]) / (3 * d1 * (d1 + d2)),
      (d1 * d1 * p2[1] - d2 * d2 * p0[1] + (2 * d1 * d1 + 3 * d1 * d2 + d2 * d2) * p1[1]) / (3 * d1 * (d1 + d2)),
    ];
    const c2 = [
      (d3 * d3 * p1[0] - d2 * d2 * p3[0] + (2 * d3 * d3 + 3 * d3 * d2 + d2 * d2) * p2[0]) / (3 * d3 * (d3 + d2)),
      (d3 * d3 * p1[1] - d2 * d2 * p3[1] + (2 * d3 * d3 + 3 * d3 * d2 + d2 * d2) * p2[1]) / (3 * d3 * (d3 + d2)),
    ];
    const a = [p1[0] + (c1[0] - p1[0]) * tension, p1[1] + (c1[1] - p1[1]) * tension];
    const b = [p2[0] + (c2[0] - p2[0]) * tension, p2[1] + (c2[1] - p2[1]) * tension];
    d += `C${r1(a[0])} ${r1(a[1])} ${r1(b[0])} ${r1(b[1])} ${r1(p2[0])} ${r1(p2[1])}`;
  }
  return d + (ferme ? 'Z' : '');
}

// Échantillonne la même courbe en polyligne (pour la lumière, calculée en JS sans lire le DOM).
export function echantillons(pts, ferme = false, parSegment = 10) {
  const n = pts.length, out = [];
  const P = (i) => ferme ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
  const fin = ferme ? n : n - 1;
  for (let i = 0; i < fin; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    const d1 = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) ** .5 || 1e-4;
    const d2 = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) ** .5 || 1e-4;
    const d3 = Math.hypot(p3[0] - p2[0], p3[1] - p2[1]) ** .5 || 1e-4;
    const c1 = [0, 1].map((k) => (d1 * d1 * p2[k] - d2 * d2 * p0[k] + (2 * d1 * d1 + 3 * d1 * d2 + d2 * d2) * p1[k]) / (3 * d1 * (d1 + d2)));
    const c2 = [0, 1].map((k) => (d3 * d3 * p1[k] - d2 * d2 * p3[k] + (2 * d3 * d3 + 3 * d3 * d2 + d2 * d2) * p2[k]) / (3 * d3 * (d3 + d2)));
    for (let s = 0; s < parSegment; s++) {
      const t = s / parSegment, u = 1 - t;
      out.push([0, 1].map((k) => u * u * u * p1[k] + 3 * u * u * t * c1[k] + 3 * u * t * t * c2[k] + t * t * t * p2[k]));
    }
  }
  if (!ferme) out.push(pts[n - 1].slice());
  return out;
}

// Rotation d'un point autour d'un centre (degrés).
export function tourne([x, y], [cx, cy], deg) {
  const a = deg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
  return [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c];
}
export const miroir = (pts, axe) => pts.map(([x, y]) => [2 * axe - x, y]);
export const decale = (pts, dx = 0, dy = 0) => pts.map(([x, y]) => [x + dx, y + dy]);
export const ech = (pts, k, [cx, cy] = [0, 0]) => pts.map(([x, y]) => [cx + (x - cx) * k, cy + (y - cy) * k]);

// Ellipse en points (pour les zones et les coussinets).
export function ellipse(cx, cy, rx, ry, n = 14, rot = 0) {
  const pts = [];
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; pts.push(tourne([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry], [cx, cy], rot)); }
  return pts;
}

// Hasard reproductible (une graine par praticien).
export function hasard(graine) { let s = (graine >>> 0) || 1; return () => ((s = Math.imul(s ^ (s >>> 15), 2246822507) ^ Math.imul(s ^ (s >>> 13), 3266489909), (s >>>= 0) / 4294967296)); }
export function graine(t = '') { let h = 2166136261; for (const c of String(t)) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }

// Polyligne compacte : premier point absolu, puis déplacements relatifs au dixième (chemins deux fois plus légers).
const n1 = (v) => { const s = String(Math.round(v * 10) / 10); return s.replace(/^0\./, '.').replace(/^-0\./, '-.'); };
export function poly(pts, ferme = false) {
  if (!pts.length) return '';
  let d = `M${n1(pts[0][0])} ${n1(pts[0][1])}l`, px = Math.round(pts[0][0] * 10), py = Math.round(pts[0][1] * 10);
  let prem = true;
  for (let i = 1; i < pts.length; i++) {
    const x = Math.round(pts[i][0] * 10), y = Math.round(pts[i][1] * 10), dx = (x - px) / 10, dy = (y - py) / 10;
    if (!dx && !dy) continue;
    const a = n1(dx), b = n1(dy);
    d += (prem || a.startsWith('-') ? '' : ' ') + a + (b.startsWith('-') ? '' : ' ') + b;
    prem = false; px = x; py = y;
  }
  return d + (ferme ? 'z' : '');
}
