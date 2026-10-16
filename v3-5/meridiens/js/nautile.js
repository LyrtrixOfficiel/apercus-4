// Méridiens : le nautile en coupe, la carte neutre pour tous les métiers qui ne travaillent pas sur un point du
// corps (psychopraticien, coach, sophrologue, hypnothérapeute, naturopathe...). Une planche de naturaliste :
// la coquille gravée, ses loges, et le siphon, le fil qui traverse toutes les loges jusqu'au cœur de la spirale.
// C'est lui que la lumière parcourt. Spirale logarithmique r = a·e^(bθ), b = ln 3 / 2π (le rayon triple à chaque tour).
import { lisse } from './trace.js';

const B = Math.log(3) / (2 * Math.PI);
const A = 2.1;
const T_MAX = 2 * Math.PI * 3.62; // la coquille fait un peu plus de trois tours et demi
const C = [212, 206]; // le centre de la spirale
const ROT = -0.35; // l'ouverture regarde vers le bas à droite, comme sur les planches anciennes
const r = (t) => A * Math.exp(B * t);
const pt = (t, k = 1) => { const a = t + ROT; return [C[0] + Math.cos(a) * r(t) * k, C[1] - Math.sin(a) * r(t) * k]; };
const arc = (t0, t1, k = 1, pas = 0.12) => { const out = []; const n = Math.max(2, Math.ceil(Math.abs(t1 - t0) / pas)); for (let i = 0; i <= n; i++) out.push(pt(t0 + (t1 - t0) * i / n, k)); return out; };
const mix = (p, q, u) => [p[0] + (q[0] - p[0]) * u, p[1] + (q[1] - p[1]) * u];

// Les cloisons (septa) : entre le tour extérieur (angle t) et le tour intérieur (t - 2π), bombées vers le centre.
const PAS_LOGE = (2 * Math.PI) / 11; // onze loges par tour, comme le vrai nautile
const T_HABITATION = T_MAX - 2 * Math.PI * 0.36; // la dernière loge, ouverte, n'a pas de cloison
function cloisons() {
  const out = [];
  for (let t = T_HABITATION; t > 2 * Math.PI + 1.2; t -= PAS_LOGE * (0.92 + 0.08 * Math.sin(t * 3.1))) {
    const ext = pt(t, 0.985), int = pt(t - 2 * Math.PI, 1.015);
    // la cloison se creuse vers l'arrière de la spirale : point milieu reculé le long du tour
    const m = mix(ext, int, 0.5), recul = pt(t - 0.22, (r(t) * 0.5 + r(t - 2 * Math.PI) * 0.5) / r(t - 0.22));
    const creux = mix(m, recul, 0.55);
    out.push({ t, pts: [ext, mix(ext, creux, 0.55), creux, mix(creux, int, 0.45), int] });
  }
  return out;
}

export function nautile() {
  const ext = arc(T_MAX - 2 * Math.PI, T_MAX); // le tour extérieur
  // le bord de l'ouverture revient du tour extérieur au tour intérieur, légèrement retroussé
  const o1 = pt(T_MAX), o2 = pt(T_MAX - 2 * Math.PI);
  // (une courbe douce, à peine bombée vers l'extérieur, comme le bord d'une vraie coquille)
  const bombe = (u, h) => { const m = mix(o1, o2, u); const dx = m[0] - C[0], dy = m[1] - C[1], L = Math.hypot(dx, dy) || 1; return [m[0] + dx / L * h, m[1] + dy / L * h]; };
  const ouverture = [bombe(0.3, 5), bombe(0.6, 4), bombe(0.85, 2)];
  const contour = [...ext, ...ouverture];
  // épaisseur de la coquille : un second trait juste à l'intérieur du tour extérieur
  const paroi = arc(T_MAX - 2 * Math.PI + 0.25, T_MAX - 0.08, 0.955);
  // les tours intérieurs de la spirale
  const tours = arc(1.2, T_MAX - 2 * Math.PI, 1);
  const toursInt = arc(1.2 + 2 * Math.PI, T_MAX - 2 * Math.PI + 0.2, 0.955).map((p) => p);
  const S = cloisons();
  const details = [
    { d: lisse(paroi), cl: 'fin' },
    { d: lisse(tours), cl: 'fin' },
    { d: lisse(arc(2 * Math.PI + 1.2, T_MAX - 2 * Math.PI, 0.94)), cl: 'pli' },
    ...S.map((s) => ({ d: lisse(s.pts), cl: 'fin' })),
    // stries de croissance sur la loge d'habitation, de plus en plus serrées vers l'ouverture
    ...Array.from({ length: 7 }, (_, i) => {
      const t = T_HABITATION + (T_MAX - T_HABITATION) * (0.18 + i * 0.12);
      return { d: lisse([pt(t, 0.995), pt(t - 0.05, 0.93), pt(t - 0.07, 0.86)]), cl: 'pli' };
    }),
  ];
  void toursInt;
  // le siphon : traverse chaque cloison au tiers de sa longueur, du côté intérieur
  // (au même rayon relatif tout du long : r·0,585), puis il s'enroule jusqu'au cœur
  const siphon = S.map((s) => pt(s.t, 0.585));
  const lignes = [
    { id: 'siphon', pts: arc(T_HABITATION, 0.5, 0.585, 0.3) },
    { id: 'spirale', pts: arc(0.8, T_MAX - 0.2, 0.9).filter((_, i) => i % 2 === 0) },
    { id: 'bord', pts: arc(T_MAX - 2 * Math.PI + 0.4, T_MAX - 0.1, 0.975).filter((_, i) => i % 2 === 0) },
  ];
  // zones : de l'ouverture vers le cœur
  const anneau = (t0, t1, k0, k1) => [...arc(t0, t1, k0, 0.2), ...arc(t1, t0, k1, 0.2)];
  const zones = [
    { id: 'ouverture', nom: 'L’ouverture', pts: [...arc(T_HABITATION, T_MAX, 0.99, 0.15), ...arc(T_MAX, T_HABITATION, 0.35, 0.15)], ancre: pt((T_HABITATION + T_MAX) / 2, 0.68) },
    { id: 'chemin', nom: 'Le chemin parcouru', pts: anneau(T_HABITATION - 2 * Math.PI * 0.55, T_HABITATION, 0.98, 0.36), ancre: pt(T_HABITATION - 2 * Math.PI * 0.27, 0.67) },
    { id: 'tours', nom: 'Les premiers tours', pts: anneau(T_HABITATION - 2 * Math.PI * 1.15, T_HABITATION - 2 * Math.PI * 0.55, 0.98, 0.36), ancre: pt(T_HABITATION - 2 * Math.PI * 0.85, 0.67) },
    { id: 'coeur', nom: 'Le cœur de la spirale', pts: Array.from({ length: 14 }, (_, i) => { const a = i / 14 * Math.PI * 2; const R = r(2 * Math.PI * 1.9); return [C[0] + Math.cos(a) * R, C[1] + Math.sin(a) * R]; }), ancre: [C[0], C[1]] },
  ];
  // la boîte : autour du tour extérieur, avec une marge
  const xs = contour.map((p) => p[0]), ys = contour.map((p) => p[1]);
  const m = 14, x0 = Math.min(...xs) - m, y0 = Math.min(...ys) - m;
  return {
    type: 'nautile', vb: [Math.round(x0), Math.round(y0), Math.round(Math.max(...xs) - x0 + m), Math.round(Math.max(...ys) - y0 + m)],
    membres: [{ contour, details, zones, lignes, mat: [1, 0, 0, 1, 0, 0], gravure: { lumiere: [-0.6, -0.8], rangs: 6, ecart: 2.4 }, points: siphon.filter((_, i) => i % 2 === 0) }],
  };
}
