// Le domaine Kazura v14 : le récit en 3D.
// Le défilement donne une position s, de 0 à 7 (un chapitre par unité). Chaque chapitre a son propre mouvement
// de caméra (pose(u), u de 0 à 1) pendant ses 7 premiers dixièmes ; les 3 derniers dixièmes sont le voyage vers
// le chapitre suivant : position en courbe d'Hermite (vitesses raccordées), regard en interpolation sphérique,
// champ, mise au point et ouverture en douceur. Jamais de fondu : la caméra va d'un lieu à l'autre.
//
//  1. L'arrivée      le grand paysage, le château au sommet de la colline, au loin.
//  2. Le pré         on descend dans les herbes hautes ; la mise au point glisse des fleurs au château.
//  3. Les rangs      grue au-dessus des têtes de rang, puis on entre dans l'allée.
//  4. La grappe      gros plan, à contre-jour : la matière des grains.
//  5. Le château     on s'élève au-dessus des vignes, au téléobjectif.
//  6. La bouteille   on recule jusqu'au tonneau : le riesling du domaine, en majesté.
//  7. La nuit        on s'assied dans le pré ; le domaine s'allume.

import { hauteur, SOMMET, LIEU } from './terrain.js';
import { douce, melange, lisse } from './commun.js';
import { GRAPPE } from './grappe.js';
import { BOUTEILLE, TONNEAU } from './bouteille.js';

export const NB = 7;
export const PART_POSE = 0.7;          // part de chaque chapitre tenue par son propre mouvement

const sol = (x, z) => hauteur(x, z);
const lerp3 = (a, b, t) => [melange(a[0], b[0], t), melange(a[1], b[1], t), melange(a[2], b[2], t)];
const ROT = -0.06;                      // rotation du château (chateau.js)
/** Un point du château, en coordonnées locales du modèle (chateau.js), vers le monde. */
export function pointChateau(x, y, z) {
  const c = Math.cos(ROT), s = Math.sin(ROT);
  return [SOMMET.x + x * c + z * s, SOMMET.y - 1.5 + y, SOMMET.z - x * s + z * c];
}
const CH = pointChateau(2, 26, 0);
function viser(p, cap, incl, d = 600) {
  const a = (cap * Math.PI) / 180, e = (incl * Math.PI) / 180;
  return [p[0] + Math.sin(a) * d, p[1] + Math.tan(e) * d, p[2] - Math.cos(a) * d];
}
const B = BOUTEILLE;
const BC = [B.x, B.y + 0.165, B.z];     // le cœur de la bouteille

/* Les chapitres : pose(u) -> { p, c, fov (horizontal pour 16/9), focus, ouv }, et l'heure du récit. */
export const CHAPITRES = [
  {
    id: 'arrivee', heure: [0.06, 0.1],
    pose(u) {
      const e = douce(u);
      const p = lerp3([-9.6, sol(-9.6, 41) + 6.4, 41], [-6.6, sol(-6.6, 33) + 3.2, 33], e);
      return { p, c: viser(p, melange(2.2, 3.0, e), melange(4.8, 6.4, e)), fov: melange(60, 62, e), focus: 90, ouv: 0.7 };
    },
  },
  {
    id: 'pre', heure: [0.11, 0.14],
    pose(u) {
      const p = lerp3([-4.0, sol(-4.0, 27.4) + 0.6, 27.4], [-1.0, sol(-1.0, 26.4) + 0.64, 26.4], u);
      const m = douce(lisse(0.3, 0.85, u));
      return { p, c: viser(p, -6.5 + u * 3.5, 3.4 + u * 1.4), fov: 58, focus: melange(1.9, 260, m * m), ouv: melange(3.6, 1.2, m) };
    },
  },
  {
    id: 'rangs', heure: [0.16, 0.22],
    pose(u) {
      const e = douce(u);
      const p = lerp3([1.25, sol(1.25, 19.5) + 6.0, 19.5], [1.25, sol(1.25, 6.2) + 1.32, 6.2], e);
      return { p, c: viser(p, melange(1.6, 2.2, e), melange(-19, 4.2, e)), fov: 56, focus: melange(16, 24, e), ouv: 0.8 };
    },
  },
  {
    id: 'grappe', heure: [0.27, 0.32],
    pose(u) {
      const e = douce(u);
      const g = [GRAPPE.x, GRAPPE.y - 0.07, GRAPPE.z];
      // un lent arc de cercle qui se resserre autour de la grappe
      const a = melange(0.95, 0.55, e), r = melange(1.25, 0.46, e);
      const p = [g[0] + Math.cos(a) * r, g[1] + melange(0.2, 0.025, e), g[2] + Math.sin(a) * r];
      const c = [g[0] + melange(0.0, -0.035, e), g[1] + melange(-0.02, 0.0, e), g[2] + melange(0.0, 0.05, e)];
      return { p, c, fov: melange(42, 32, e), focus: Math.hypot(p[0] - g[0], p[1] - g[1], p[2] - g[2]), ouv: melange(4.5, 8.5, e), portrait: 1.0 };
    },
  },
  {
    id: 'chateau', heure: [0.34, 0.39],
    pose(u) {
      const e = douce(u);
      const p = lerp3([1.2, sol(1.2, 1.5) + 7, 1.5], [2, 46, -46], e);
      const c = lerp3([CH[0] - 6, CH[1] - 12, CH[2]], [CH[0] - 3, CH[1] - 3, CH[2]], e);
      return { p, c, fov: melange(24, 15, e), focus: 560, ouv: 0.55, brume: 0.4, portrait: 0.85 };
    },
  },
  {
    id: 'bouteille', heure: [0.42, 0.46],
    pose(u) {
      const e = douce(u);
      const a = melange(-0.4, 0.28, e), r = melange(1.38, 1.06, e);
      const p = [BC[0] + Math.sin(a) * r, BC[1] + melange(0.2, 0.1, e), BC[2] + Math.cos(a) * r];
      // la bouteille un peu à droite du centre : le texte respire à gauche
      const c = [BC[0] - Math.cos(a) * 0.1, BC[1] + 0.03, BC[2] + Math.sin(a) * 0.1];
      return { p, c, fov: melange(42, 37, e), focus: r, ouv: melange(3.2, 4.4, e), expo: 1.32, portrait: 0.9 };
    },
  },
  {
    id: 'nuit', heure: [0.62, 0.95],
    pose(u) {
      const e = douce(u);
      const p = lerp3([-0.6, sol(-0.6, 18.4) + 1.25, 18.4], [-1.2, sol(-1.2, 20.9) + 0.85, 20.9], e);
      return { p, c: viser(p, melange(-4, -1, e), melange(4, 9.5, e)), fov: melange(58, 64, e), focus: melange(5, 14, e), ouv: 1.6 };
    },
  },
];

/* Les ancres : des points du monde où la page accroche ses étiquettes. Les fleurs, la grappe et la bouteille
   ajoutent les leurs à la construction (domaine.js). */
export const ANCRES = {
  chateau: pointChateau(8.5, 60, 0),
  coteau: [-6, sol(-6, -18) + 1.8, -18],
  piquet: [0, sol(0, 13.6) + 1.95, 13.6],
  allee: [1.25, sol(1.25, 7) + 0.15, 7],
  rang: [-2.5, sol(-2.5, 4) + 1.55, 4],
  donjon: pointChateau(8.5, 50, 4.5),
  bastion: pointChateau(-47.5, 22, 8.5),
  logis: pointChateau(-16, 27, 6),
  liane: [LIEU.piquetMagique.x, sol(LIEU.piquetMagique.x, LIEU.piquetMagique.z) + 1.7, LIEU.piquetMagique.z],
  tonneau: [TONNEAU.x - 0.2, TONNEAU.y + 0.5, TONNEAU.z + 0.25],
};

/* ---------- les outils du voyage ---------- */
function versDir(s) { const d = [s.c[0] - s.p[0], s.c[1] - s.p[1], s.c[2] - s.p[2]]; const l = Math.hypot(...d); return [d[0] / l, d[1] / l, d[2] / l]; }
function slerp(a, b, t) {
  let d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  d = Math.min(1, Math.max(-1, d));
  const th = Math.acos(d);
  if (th < 1e-4) return lerp3(a, b, t);
  const s = Math.sin(th), k0 = Math.sin((1 - t) * th) / s, k1 = Math.sin(t * th) / s;
  return [a[0] * k0 + b[0] * k1, a[1] * k0 + b[1] * k1, a[2] * k0 + b[2] * k1];
}
function hermite(p0, m0, p1, m1, t) {
  const t2 = t * t, t3 = t2 * t;
  const h00 = 2 * t3 - 3 * t2 + 1, h10 = t3 - 2 * t2 + t, h01 = -2 * t3 + 3 * t2, h11 = t3 - t2;
  return [0, 1, 2].map((k) => h00 * p0[k] + h10 * m0[k] + h01 * p1[k] + h11 * m1[k]);
}
/** La vitesse d'une pose en bout de course, en unités du voyage (raccord C1 entre le chapitre et son voyage). */
function vitesse(ch, u, sens) {
  const du = 0.004;
  const a = ch.pose(Math.min(1, Math.max(0, u - (sens > 0 ? du : 0)))).p, b = ch.pose(Math.min(1, Math.max(0, u + (sens > 0 ? 0 : du)))).p;
  const k = (1 - PART_POSE) / PART_POSE / du;     // du/ds de la pose ramené à l'échelle du voyage
  return [(b[0] - a[0]) * k, (b[1] - a[1]) * k, (b[2] - a[2]) * k];
}

/** L'état de la caméra pour une position s du récit. */
export function etatRecit(s) {
  s = Math.min(NB - 1e-4, Math.max(0, s));
  const i = Math.floor(s), f = s - i;
  const ch = CHAPITRES[i];
  if (i === NB - 1 || f <= PART_POSE) {
    const u = i === NB - 1 ? Math.min(1, f / 0.92) : f / PART_POSE;
    const x = ch.pose(u);
    return { ...x, brume: x.brume ?? 1, expo: x.expo ?? 1, portrait: x.portrait ?? 1.25, dir: versDir(x), chapitre: i, u, voyage: 0 };
  }
  // le voyage vers le chapitre suivant
  const w = (f - PART_POSE) / (1 - PART_POSE);
  const A = ch.pose(1), Bp = CHAPITRES[i + 1].pose(0);
  const m0 = vitesse(ch, 1, 1), m1 = vitesse(CHAPITRES[i + 1], 0, -1);
  // les grands voyages prennent un peu d'élan (tangentes allongées, une courbe plutôt qu'une ligne)
  const dist = Math.hypot(Bp.p[0] - A.p[0], Bp.p[1] - A.p[1], Bp.p[2] - A.p[2]);
  const lev = [0, Math.min(dist * 0.35, 6), 0];
  const p = hermite(A.p, [m0[0], m0[1] + lev[1], m0[2]], Bp.p, [m1[0], m1[1] - lev[1], m1[2]], w);
  const ww = douce(w);
  const dir = slerp(versDir(A), versDir(Bp), ww);
  const focus = Math.exp(melange(Math.log(A.focus), Math.log(Bp.focus), ww));
  return { p, dir, brume: melange(A.brume ?? 1, Bp.brume ?? 1, ww), expo: melange(A.expo ?? 1, Bp.expo ?? 1, ww), portrait: melange(A.portrait ?? 1.25, Bp.portrait ?? 1.25, ww), fov: melange(A.fov, Bp.fov, ww), focus, ouv: melange(A.ouv, Bp.ouv, ww) * (1 - 0.35 * Math.sin(Math.PI * w)), chapitre: i, u: 1, voyage: w };
}

/** L'heure que le récit donne à la position s (continue, d'un chapitre à l'autre). */
export function heureRecit(s) {
  s = Math.min(NB - 1e-4, Math.max(0, s));
  const i = Math.floor(s), f = s - i;
  const [a, b] = CHAPITRES[i].heure;
  if (i === NB - 1) return melange(a, b, douce(lisse(0.05, 0.85, f)));
  if (f <= PART_POSE) return melange(a, b, f / PART_POSE);
  return melange(b, CHAPITRES[i + 1].heure[0], douce((f - PART_POSE) / (1 - PART_POSE)));
}

export function creerCameraRecit(THREE, { reduit }) {
  const v = new THREE.Vector3(), cible = new THREE.Vector3(), droite = new THREE.Vector3(), haut = new THREE.Vector3(0, 1, 0);
  let decalX = 0, decalY = 0;
  /** Pose la caméra ; souris en [-1..1] (parallaxe), force : ampleur de la parallaxe. */
  function poser(camera, s, aspect, temps, souris = [0, 0]) {
    const e = etatRecit(s);
    v.set(e.p[0], e.p[1], e.p[2]);
    const d = e.focus;
    cible.set(e.p[0] + e.dir[0] * d, e.p[1] + e.dir[1] * d, e.p[2] + e.dir[2] * d);
    droite.set(e.dir[0], e.dir[1], e.dir[2]).cross(haut).normalize();
    // la parallaxe de la souris : on tourne un peu autour du point net (plus en gros plan)
    decalX += (souris[0] - decalX) * 0.04;
    decalY += (souris[1] - decalY) * 0.04;
    const prox = Math.min(1, 1.2 / Math.max(0.3, d));
    const amp = (reduit ? 0.35 : 1) * (0.012 * d * 0.08 + prox * 0.05);
    v.addScaledVector(droite, decalX * amp * 2.2);
    v.y += decalY * amp * 1.3;
    if (!reduit) {
      // la caméra à l'épaule : un souffle à peine perceptible
      const k = Math.min(d, 60) * 0.0012;
      cible.addScaledVector(droite, (Math.sin(temps * 0.53) * 0.6 + Math.sin(temps * 1.27) * 0.25) * k);
      cible.y += (Math.sin(temps * 0.71 + 1.3) * 0.45 + Math.sin(temps * 1.61) * 0.15) * k;
    }
    camera.position.copy(v);
    camera.lookAt(cible);
    // champ horizontal pour 16/9 ; en portrait on garde de la largeur sans écraser les plans serrés
    const asp = Math.max(aspect, 0.45);
    let hfov = e.fov;
    if (asp < 1.2) hfov *= melange(e.portrait ?? 1.25, 1.0, Math.min(1, (asp - 0.45) / 0.75));
    // ultra-large : le cadrage vertical reste celui d'un écran 16/10 (on voit plus large, pas moins haut)
    let vfov = 2 * Math.atan(Math.tan((hfov * Math.PI) / 360) / Math.min(asp, 1.75)) * (180 / Math.PI);
    vfov = Math.min(asp < 1 ? 74 : 62, Math.max(6, vfov));
    if (Math.abs(camera.fov - vfov) > 0.001) { camera.fov = vfov; camera.updateProjectionMatrix(); }
    return e;
  }
  return { poser };
}
