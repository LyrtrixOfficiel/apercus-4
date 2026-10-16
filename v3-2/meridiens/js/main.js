// Méridiens : la main ouverte vue par la paume (repli élégant pour tous les métiers), et la paire de mains
// avec le champ qui circule entre elles (reiki, magnétisme, soins énergétiques).
// Une main : boîte 300 x 450, doigts vers le haut, pouce à droite.
import { lisse, tourne, ellipse } from './trace.js';

const DOIGTS = [
  // auriculaire, annulaire, majeur, index : cx, base (pli palmaire), pointe, demi-largeur, inclinaison (+ = vers la droite)
  { id: 'auriculaire', nom: 'Auriculaire', cx: 87, base: 222, tip: 118, w: 13.5, ang: -9 },
  { id: 'annulaire', nom: 'Annulaire', cx: 121, base: 200, tip: 74, w: 15, ang: -3.5 },
  { id: 'majeur', nom: 'Majeur', cx: 156, base: 194, tip: 50, w: 15.5, ang: 0.5 },
  { id: 'index', nom: 'Index', cx: 191, base: 202, tip: 80, w: 15, ang: 5 },
];
const POUCE = { cx: 224, base: 300, tip: 202, w: 17.5, ang: 31 };
const P = (o, u, v) => tourne([o.cx + u * o.w, o.base - v * (o.base - o.tip)], [o.cx, o.base], o.ang);

function contourMain() {
  const pts = [];
  // poignet gauche puis bord cubital de la paume
  pts.push([108, 430], [101, 396], [92, 358], [82, 318], [75, 282], [73, 252]);
  DOIGTS.forEach((o, i) => {
    const gauche = i === 0 ? [[-1.04, .2], [-1.02, .5]] : [[-1, .36], [-1, .58]];
    for (const [u, v] of [...gauche, [-.86, .84], [-.48, .97], [0, 1], [.48, .97], [.86, .84], [1, .58]]) pts.push(P(o, u, v));
    if (i < DOIGTS.length - 1) {
      const o2 = DOIGTS[i + 1];
      pts.push(P(o, 1, .34));
      const a = P(o, 1, .2), b = P(o2, -1, .2);
      pts.push([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 3]);
    } else {
      pts.push(P(o, 1, .3), P(o, 1.02, .06));
    }
  });
  // creux entre index et pouce, puis le pouce
  pts.push([211, 236], [217, 258]);
  for (const [u, v] of [[-1, .45], [-.92, .74], [-.55, .95], [0, 1], [.55, .95], [.95, .72], [1.04, .4], [1.06, .12]]) pts.push(P(POUCE, u, v));
  // éminence thénar et poignet droit
  pts.push([240, 334], [230, 364], [215, 394], [206, 430]);
  return pts;
}

function details() {
  const d = [];
  for (const o of [...DOIGTS]) {
    const pad = []; for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; pad.push(P(o, Math.cos(a) * .58, .82 + Math.sin(a) * .1)); }
    d.push({ d: lisse(pad, true), cl: 'fin' });
    for (const v of [.6, .63]) d.push({ d: lisse([P(o, -.78, v), P(o, 0, v + .012), P(o, .78, v)]), cl: 'fin' });
    for (const v of [.3]) d.push({ d: lisse([P(o, -.8, v), P(o, -.1, v + .015), P(o, .8, v - .005)]), cl: 'fin' });
    d.push({ d: lisse([P(o, -.7, .04), P(o, 0, .07), P(o, .7, .04)]), cl: 'pli' });
  }
  const pad = []; for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; pad.push(P(POUCE, Math.cos(a) * .58, .8 + Math.sin(a) * .11)); }
  d.push({ d: lisse(pad, true), cl: 'fin' });
  d.push({ d: lisse([P(POUCE, -.8, .5), P(POUCE, 0, .53), P(POUCE, .8, .49)]), cl: 'fin' });
  // lignes de la main : coeur, tête, vie
  d.push({ d: lisse([[76, 262], [104, 252], [134, 246], [160, 240], [184, 226]]), cl: 'fin' });
  d.push({ d: lisse([[206, 262], [176, 272], [146, 284], [116, 300], [96, 318]]), cl: 'fin' });
  d.push({ d: lisse([[204, 262], [190, 292], [183, 326], [186, 360], [194, 392]]), cl: 'fin' });
  // plis du poignet
  d.push({ d: lisse([[104, 404], [140, 410], [178, 410], [210, 404]]), cl: 'pli' });
  d.push({ d: lisse([[106, 418], [142, 422], [180, 422], [208, 418]]), cl: 'pli' });
  // éminence hypothénar
  d.push({ d: lisse([[88, 326], [102, 356], [114, 388]]), cl: 'fin' });
  return d;
}

function zones() {
  const z = DOIGTS.map((o) => ({ id: o.id, nom: o.nom, pts: (() => { const p = []; for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2; p.push(P(o, Math.cos(a) * .85, .78 + Math.sin(a) * .16)); } return p; })(), ancre: P(o, 0, .8) }));
  const pp = []; for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2; pp.push(P(POUCE, Math.cos(a) * .85, .74 + Math.sin(a) * .2)); }
  z.push({ id: 'pouce', nom: 'Pouce', pts: pp, ancre: P(POUCE, 0, .76) });
  z.push({ id: 'paume', nom: 'Paume', pts: ellipse(146, 318, 42, 46, 14), ancre: [146, 318] });
  z.push({ id: 'poignet', nom: 'Poignet', pts: [[104, 398], [210, 398], [208, 432], [106, 432]], ancre: [156, 414] });
  return z;
}

function lignes() {
  const centre = [148, 320];
  const L = DOIGTS.map((o, i) => ({ id: o.id, pts: [P(o, 0, .9), P(o, 0, .5), P(o, 0, .04), [(P(o, 0, 0)[0] + centre[0]) / 2, (P(o, 0, 0)[1] + centre[1]) / 2 + 6], centre] }));
  L.push({ id: 'pouce', pts: [P(POUCE, 0, .9), P(POUCE, 0, .5), P(POUCE, 0, .05), [196, 318], centre] });
  L.push({ id: 'vie', pts: [centre, [152, 356], [155, 392], [157, 428]] });
  return L;
}

export function main() {
  return {
    type: 'main', vb: [52, 36, 256, 400],
    membres: [{ contour: contourMain(), details: details(), zones: zones(), lignes: lignes(), mat: [1, 0, 0, 1, 0, 0], gravure: { lumiere: [.5, -.86] } }],
  };
}

// Deux mains, pouces vers le centre, et le champ entre elles : arcs qui relient les deux paumes
// et anneaux autour de chacune.
export function champ() {
  const W = 300, ecart = -20, dx2 = W + ecart;
  const C = contourMain(), D = details(), Z = zones(), L = lignes();
  const c1 = [148, 316], c2 = [dx2 + W - 148, 316];
  const arcs = [];
  const mx = (c1[0] + c2[0]) / 2;
  for (const [k, h] of [[0, 0], [1, 34], [2, -34], [3, 72], [4, -72]]) {
    arcs.push({ id: 'arc' + k, ferme: false, pts: [c1, [c1[0] + 60, c1[1] - h * .7], [mx, c1[1] - h], [c2[0] - 60, c2[1] - h * .7], c2] });
  }
  // grandes boucles qui enveloppent les deux mains, par le haut et par le bas
  arcs.push({ id: 'haut', pts: [c1, [c1[0] - 60, c1[1] - 150], [c1[0] - 10, 40], [mx, 14], [c2[0] + 10, 40], [c2[0] + 60, c2[1] - 150], c2] });
  arcs.push({ id: 'bas', pts: [c1, [c1[0] - 40, c1[1] + 110], [mx, 466], [c2[0] + 40, c2[1] + 110], c2] });
  const anneaux = [];
  for (const [i, c] of [[0, c1], [1, c2]]) for (const r of [58, 92]) anneaux.push({ id: `anneau${i}-${r}`, ferme: true, membre: i, pts: ellipse(c[0], c[1], r, r * 1.08, 16) });
  return {
    type: 'champ', vb: [44, 4, 2 * W + ecart - 88, 476],
    membres: [
      { contour: C, details: D, zones: Z, lignes: L, mat: [1, 0, 0, 1, 0, 0], gravure: { lumiere: [.5, -.86] } },
      { contour: C, details: D, zones: Z.map((z) => ({ ...z })), lignes: L, mat: [-1, 0, 0, 1, W + dx2, 0], gravure: { lumiere: [.5, -.86] } },
      // le champ : un membre sans contour, seulement des lignes
      { contour: [], sansGravure: true, details: [], zones: [{ id: 'champ', nom: 'Le champ', pts: [[c1[0] + 40, 160], [c2[0] - 40, 160], [c2[0] - 40, 480], [c1[0] + 40, 480]], ancre: [(c1[0] + c2[0]) / 2, 320] }], lignes: [...arcs, ...anneaux], mat: [1, 0, 0, 1, 0, 0], champ: true },
    ],
  };
}
