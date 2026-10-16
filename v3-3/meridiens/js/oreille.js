// Méridiens : l'oreille (auriculothérapie, réflexologie auriculaire), vue de profil, gravée comme une planche
// d'anatomie : l'hélix qui s'enroule, l'anthélix et ses deux branches, la conque, le tragus, le lobe.
// Les zones suivent la cartographie classique de l'auriculothérapie, sans détail médical (on nomme les reliefs).
// Oreille droite vue de côté (le visage serait à droite). Boîte 200 x 404.
import { lisse, echantillons } from './trace.js';

// Le contour en C : de l'attache haute, par-dessus l'hélix, le bord arrière, le lobe, puis le tragus.
const CONTOUR = [
  [170, 60], [160, 32], [136, 13], [106, 8], [76, 15], [51, 34], [35, 64], [27, 102], [26, 146], [32, 190],
  [43, 232], [57, 268], [69, 296], [76, 320], [80, 346], [88, 369], [102, 386], [122, 394], [141, 388],
  [151, 370], [154, 346], [160, 327], [168, 314], [182, 304], [193, 290], [195, 268], [188, 250], [181, 236],
  [182, 212], [186, 180], [185, 140], [180, 100],
];
// Le pli intérieur de l'hélix, de sa racine dans la conque jusqu'au-dessus du lobe.
const HELIX_INT = [[150, 178], [154, 142], [160, 106], [156, 74], [138, 47], [108, 36], [80, 44], [60, 65], [49, 98], [47, 142], [53, 188], [65, 230], [79, 264], [92, 291], [100, 309]];
// Le bord roulé de l'hélix : un second trait très proche du contour, côté intérieur, en haut et derrière.
const HELIX_BORD = [[158, 42], [134, 23], [106, 18], [78, 25], [57, 42], [43, 70], [36, 104], [36, 146], [42, 188], [53, 228], [66, 262]];
// L'anthélix : un tronc qui monte depuis l'antitragus, puis deux branches (la fosse triangulaire entre elles).
const ANTI_TRONC = [[114, 300], [105, 272], [99, 236], [99, 198], [104, 164], [114, 138]];
const ANTI_HAUT = [[114, 138], [117, 112], [127, 87], [143, 66]];
const ANTI_BAS = [[114, 138], [132, 131], [152, 131], [168, 138]];
// La conque, le bol creusé autour du conduit, coupé par la racine de l'hélix.
const CONQUE = [[168, 152], [146, 153], [125, 166], [115, 196], [113, 236], [119, 272], [133, 294], [153, 300], [171, 294], [183, 277]];
const RACINE = [[181, 202], [163, 191], [145, 187], [130, 191]];
const ANTITRAGUS = [[121, 306], [135, 315], [150, 313], [161, 303]];
const TRAGUS = [[177, 226], [187, 246], [188, 272], [179, 291]];
const CONDUIT = (() => { const p = []; for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; p.push([166 + Math.cos(a) * 8, 246 + Math.sin(a) * 12]); } return p; })();
const LOBE = [[86, 346], [112, 339], [138, 341], [153, 348]];

function zones() {
  return [
    { id: 'helix', nom: 'L’hélix, le rebord', pts: [...CONTOUR.slice(1, 12), ...HELIX_INT.slice(3, 13).reverse()], ancre: [44, 150] },
    { id: 'fosse', nom: 'La fosse triangulaire', pts: [[116, 136], [120, 100], [140, 68], [156, 74], [160, 104], [154, 128], [134, 130]], ancre: [138, 104] },
    { id: 'antihelix', nom: 'L’anthélix, reflet du dos', pts: [[92, 236], [95, 190], [108, 150], [122, 142], [112, 176], [108, 212], [110, 256], [122, 296], [110, 308], [98, 276]], ancre: [102, 230] },
    { id: 'conque', nom: 'La conque', pts: CONQUE, ancre: [142, 236] },
    { id: 'tragus', nom: 'Le tragus', pts: [[178, 228], [194, 250], [196, 280], [184, 298], [176, 270]], ancre: [186, 262] },
    { id: 'lobe', nom: 'Le lobe, reflet de la tête', pts: [[80, 344], [154, 344], [152, 372], [140, 390], [120, 396], [100, 388], [86, 368]], ancre: [118, 366] },
  ];
}

export function oreille() {
  const details = [
    { d: lisse(HELIX_INT), cl: 'fin' }, { d: lisse(HELIX_BORD), cl: 'pli' },
    { d: lisse(ANTI_TRONC), cl: 'fin' }, { d: lisse(ANTI_HAUT), cl: 'fin' }, { d: lisse(ANTI_BAS), cl: 'fin' },
    { d: lisse(CONQUE), cl: 'fin' }, { d: lisse(RACINE), cl: 'fin' },
    { d: lisse(ANTITRAGUS), cl: 'fin' }, { d: lisse(TRAGUS), cl: 'fin' },
    { d: lisse(CONDUIT, true), cl: 'fin' },
    { d: lisse(LOBE), cl: 'pli' },
  ];
  // tailles de gravure au fond de la conque et sous le rebord de l'hélix (ombres), comme au burin
  const hachures = [];
  const fond = echantillons(CONQUE, false, 5);
  for (let i = 4; i < fond.length - 6; i += 3) { const [x, y] = fond[i]; hachures.push(`M${x + 3} ${y}l${7 + (i % 4)} ${-1 - (i % 3)}`); }
  const sous = echantillons(HELIX_INT, false, 5);
  for (let i = 10; i < sous.length - 6; i += 3) { const [x, y] = sous[i]; hachures.push(`M${(x + 4).toFixed(1)} ${y.toFixed(1)}l6 1.5`); }
  details.push({ d: hachures.join(''), cl: 'hachure' });
  // la lumière court le long des reliefs : rebord, anthélix (le dos, du bas vers le haut), conque, l'axe du lobe vers le haut
  const lignes = [
    { id: 'rebord', pts: HELIX_INT.slice().reverse() },
    { id: 'dos', pts: [...ANTI_TRONC, ...ANTI_HAUT.slice(1)] },
    { id: 'branche', pts: ANTI_BAS },
    { id: 'conque', pts: CONQUE },
    { id: 'axe', pts: [[118, 384], [116, 350], [112, 318], [106, 284], [101, 246], [101, 204], [108, 166], [122, 124], [138, 90]] },
  ];
  return {
    type: 'oreille', vb: [10, -2, 200, 408],
    membres: [{ contour: CONTOUR, details, zones: zones(), lignes, mat: [1, 0, 0, 1, 0, 0], gravure: { lumiere: [0.55, -0.83], rangs: 5 } }],
  };
}
