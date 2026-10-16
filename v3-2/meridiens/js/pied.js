// Méridiens : la paire de pieds vue par la plante, au trait, avec les zones réflexes de la cartographie
// classique et les dix zones longitudinales (cinq par pied) où circule la lumière.
// Coordonnées d'un pied : boîte 240 x 600, gros orteil à droite (pied gauche de la planche) ;
// le pied droit est le miroir (transformation SVG), avec le foie à la place de l'estomac.
import { lisse, tourne, ellipse } from './trace.js';

const ORTEILS = [
  // cx, pointe, demi-largeur, pli de base, inclinaison (degrés, + = vers l'extérieur)
  { cx: 196, tip: 16, w: 34, base: 156, ang: -2, web: .5 },
  { cx: 141, tip: 38, w: 20.5, base: 156, ang: 4, web: .54 },
  { cx: 103, tip: 61, w: 19, base: 166, ang: 8, web: .56 },
  { cx: 68.5, tip: 90, w: 17.6, base: 180, ang: 13, web: .57 },
  { cx: 36, tip: 126, w: 16.2, base: 198, ang: 19, web: .58 },
];
// point d'un orteil : u de -1 (côté extérieur) à 1 (côté gros orteil), v de 0 (pli de base) à 1 (pointe)
const P = (o, u, v) => tourne([o.cx + u * o.w, o.base - v * (o.base - o.tip)], [o.cx, o.base], o.ang);

export function contourPied() {
  const pts = [];
  // bord interne (côté gros orteil), du talon vers les orteils : voûte creusée, saillie de l'avant-pied
  pts.push([126, 595], [160, 590], [185, 573], [198, 543], [200, 505], [195, 466], [192, 426], [196, 384], [205, 340], [218, 294], [229, 250], [234, 212]);
  ORTEILS.forEach((o, i) => {
    const prof = i === 0 ? [[1.03, .38], [1.02, .62]] : [[1, o.web + .06], [1, .64]];
    const cote = [[.86, .83], [.5, .97], [0, 1], [-.5, .97], [-.86, .83], [-1, .64], [-1, o.web + .06]];
    for (const [u, v] of [...prof, ...cote]) pts.push(P(o, u, v));
    if (i < ORTEILS.length - 1) {
      const o2 = ORTEILS[i + 1];
      const a = P(o, -1, o.web - .02), b = P(o2, 1, o2.web - .02);
      pts.push([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 4]);
    }
  });
  // bord externe, du cinquième orteil vers le talon (saillie de la base du cinquième métatarsien)
  const o5 = ORTEILS[4];
  pts.push(P(o5, -1.04, .3), [16, 232], [15, 268], [19, 310], [26, 352], [33, 392], [38, 432], [45, 478], [56, 523], [73, 563], [97, 588]);
  return pts;
}

// Détails anatomiques : coussinets et plis des orteils, racine des orteils, avant-pied, voûte, talon.
function details() {
  const d = [];
  ORTEILS.forEach((o, i) => {
    const pad = [];
    for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; pad.push(P(o, Math.cos(a) * .6, .74 + Math.sin(a) * (i ? .15 : .14))); }
    d.push({ d: lisse(pad, true), cl: 'fin' });
    const v = i ? .5 : .46;
    d.push({ d: lisse([P(o, -.72, v - .02), P(o, -.2, v + .015), P(o, .3, v + .01), P(o, .74, v - .025)]), cl: 'fin' });
  });
  // pli à la racine des orteils
  const racine = ORTEILS.slice().reverse().map((o) => P(o, 0, .06));
  d.push({ d: lisse([[22, 216], ...racine, [228, 178]]), cl: 'pli' });
  // bord inférieur du coussinet de l'avant-pied
  d.push({ d: lisse([[24, 266], [62, 276], [106, 281], [150, 278], [192, 266], [224, 250]]), cl: 'pli' });
  // voûte plantaire : un arc doux côté interne et des hachures de gravure
  d.push({ d: lisse([[208, 302], [190, 342], [181, 392], [183, 440], [190, 484]]), cl: 'fin' });
  // coussinet du talon
  d.push({ d: lisse([[68, 522], [94, 501], [128, 495], [163, 503], [184, 526], [182, 557], [159, 577], [126, 583], [93, 575], [72, 554]], true), cl: 'fin' });
  // base du cinquième métatarsien
  d.push({ d: lisse([[24, 356], [33, 382], [36, 412]]), cl: 'fin' });
  return d;
}

// Zones réflexes (cartographie traditionnelle), en coordonnées du pied gauche de la planche.
// ancre = point où la lumière naît quand on touche la zone.
function zones(droit) {
  const [h, ...petits] = ORTEILS;
  const anneau = (o, vc, ru, rv, n = 12) => { const p = []; for (let k = 0; k < n; k++) { const a = k / n * Math.PI * 2; p.push(P(o, Math.cos(a) * ru, vc + Math.sin(a) * rv)); } return p; };
  const z = [];
  z.push({ id: 'tete', nom: 'Tête', pts: anneau(h, .72, .78, .2), ancre: P(h, 0, .72) });
  z.push({ id: 'sinus', nom: 'Sinus', multi: petits.map((o) => anneau(o, .78, .72, .15, 10)), ancre: P(petits[0], 0, .78) });
  z.push({ id: 'nuque', nom: 'Nuque', pts: [P(h, -.9, .08), P(h, .95, .1), P(h, .98, .36), P(h, -.9, .36)], ancre: P(h, 0, .22) });
  const yeux = [...petits.map((o) => P(o, 1, .05)), ...petits.slice().reverse().map((o) => P(o, -1, .05)).reverse()];
  z.push({ id: 'yeux', nom: 'Yeux, oreilles', pts: [...petits.map((o) => P(o, .9, .02)), P(petits[3], -1, .02), P(petits[3], -1, .3), ...petits.slice().reverse().map((o) => P(o, 0, .32))], ancre: P(petits[1], 0, .16) });
  void yeux;
  z.push({ id: 'poitrine', nom: 'Poitrine', pts: [[20, 228], [56, 214], [98, 202], [142, 194], [184, 194], [226, 204], [230, 236], [214, 254], [172, 266], [122, 270], [72, 264], [28, 252]], ancre: [126, 234] });
  z.push({ id: 'plexus', nom: 'Plexus solaire', pts: ellipse(130, 297, 17, 13, 12), ancre: [130, 297] });
  if (!droit) z.push({ id: 'estomac', nom: 'Estomac', pts: [[152, 288], [196, 284], [204, 316], [194, 344], [160, 346], [148, 318]], ancre: [176, 316] });
  else z.push({ id: 'foie', nom: 'Foie', pts: [[30, 286], [92, 284], [108, 306], [100, 342], [56, 348], [32, 332]], ancre: [66, 314] });
  z.push({ id: 'reins', nom: 'Reins', pts: ellipse(118, 366, 15, 21, 12, -10), ancre: [118, 366] });
  z.push({ id: 'intestins', nom: 'Intestins', pts: [[40, 402], [92, 400], [150, 402], [184, 408], [186, 442], [182, 474], [130, 480], [76, 478], [48, 470], [40, 436]], ancre: [112, 440] });
  z.push({ id: 'colonne', nom: 'Colonne', pts: [[230, 214], [232, 236], [224, 276], [212, 324], [202, 374], [198, 422], [202, 472], [205, 518], [195, 522], [190, 472], [186, 422], [190, 370], [200, 320], [212, 272], [220, 234], [222, 214]], ancre: [200, 400] });
  z.push({ id: 'bassin', nom: 'Bassin', pts: [[64, 508], [98, 494], [134, 490], [170, 497], [188, 518], [186, 557], [163, 580], [126, 588], [91, 580], [68, 559], [60, 534]], ancre: [126, 540] });
  return z;
}

// Les cinq zones longitudinales (Fitzgerald), de chaque orteil au talon, et les quatre lignes transversales.
function lignes() {
  const L = [];
  const talon = [178, 153, 128, 103, 78];
  ORTEILS.forEach((o, i) => {
    const pointe = P(o, 0, .9), milieu = P(o, 0, .5), racine = P(o, 0, 0);
    const x1 = racine[0] * .7 + talon[i] * .3, x2 = racine[0] * .35 + talon[i] * .65;
    L.push({ id: 'zone' + i, pts: [pointe, milieu, racine, [x1 + (i === 0 ? 4 : 0), 292], [x2, 412], [talon[i], 512], [talon[i] + (2 - i) * 3, 578]] });
  });
  L.push({ id: 'epaules', trans: 1, pts: [[18, 222], [60, 202], [110, 186], [160, 178], [206, 182], [232, 194]] });
  L.push({ id: 'diaphragme', trans: 1, pts: [[17, 272], [70, 280], [128, 284], [184, 276], [226, 258]] });
  L.push({ id: 'taille', trans: 1, pts: [[31, 386], [80, 383], [130, 383], [178, 386], [194, 388]] });
  L.push({ id: 'bassinL', trans: 1, pts: [[47, 488], [96, 482], [140, 482], [184, 488], [200, 492]] });
  return L;
}

// La paire : pied gauche de la planche à gauche, gros orteils vers le centre.
export function pied() {
  const W = 240, H = 600, ecart = 50;
  const C = contourPied(), D = details(), Lg = lignes();
  const dx2 = W + ecart;
  return {
    type: 'pied', vb: [-8, -6, 2 * W + ecart + 16, H + 12], vbSeul: [-10, -8, W + 20, H + 16], W, H, dx2,
    membres: [
      { contour: C, details: D, zones: zones(false), lignes: Lg, mat: [1, 0, 0, 1, 0, 0] },
      { contour: C, details: D, zones: zones(true), lignes: Lg, mat: [-1, 0, 0, 1, W + dx2, 0] },
    ],
  };
}
