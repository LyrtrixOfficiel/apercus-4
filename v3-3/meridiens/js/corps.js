// Méridiens : la silhouette debout, bras légèrement ouverts, et le trajet des grands méridiens
// (shiatsu, acupression, kinésiologie, do-in). Boîte 300 x 820, axe du corps en x = 150.
import { lisse, miroir, echantillons, ellipse } from './trace.js';

// Demi-contour, côté droit de l'image (côté gauche de la personne), du cou vers le bas.
const DEMI = [
  [163, 112], [165, 138], [178, 149], [200, 158], [218, 168], [229, 186], [234, 214],
  [239, 252], [244, 288], [250, 318], [258, 356], [266, 392], [273, 420],
  [281, 436], [287, 458], [287, 482], [281, 500], [271, 506], [262, 497], [258, 474], [256, 446], [253, 426],
  [246, 394], [238, 356], [231, 318], [224, 282], [214, 244], [208, 228],
  [205, 252], [200, 290], [196, 324], [198, 356], [205, 390], [211, 424],
  [212, 462], [208, 512], [201, 560], [200, 600], [197, 648], [190, 700], [186, 726],
  [190, 744], [196, 762], [192, 778], [178, 784], [163, 781], [159, 766], [161, 740], [162, 716],
  [164, 668], [166, 620], [164, 576], [162, 528], [158, 482], [152, 446],
];
// la tête fait partie du même trait : du sommet vers la mâchoire, puis le cou
const TETE_D = [[166, 31], [178, 44], [183, 64], [182, 84], [177, 99], [169, 108]];
function contourCorps() {
  const demi = [...TETE_D, ...DEMI];
  return [[150, 27], ...demi, [150, 440], ...miroir(demi, 150).reverse()];
}

const MER = {
  poumon: { nom: 'Méridien du Poumon', pts: [[192, 172], [214, 190], [230, 228], [238, 270], [246, 316], [256, 358], [266, 396], [276, 428], [284, 462]] },
  coeur: { nom: 'Méridien du Cœur', pts: [[209, 234], [220, 274], [230, 314], [240, 354], [250, 396], [257, 432], [264, 470], [269, 498]] },
  estomac: { nom: 'Méridien de l’Estomac', pts: [[161, 78], [164, 104], [168, 140], [178, 172], [178, 236], [172, 296], [173, 352], [184, 420], [190, 492], [184, 566], [181, 640], [179, 712], [180, 752], [177, 780]] },
  rate: { nom: 'Méridien de la Rate', pts: [[164, 779], [165, 744], [168, 700], [171, 640], [172, 584], [175, 518], [184, 452], [190, 392], [194, 326], [197, 258], [194, 214]] },
  rein: { nom: 'Méridien du Rein', pts: [[171, 786], [164, 748], [163, 700], [162, 640], [161, 576], [158, 506], [157, 440], [157, 376], [157, 310], [159, 246], [161, 180]] },
  vesicule: { nom: 'Méridien de la Vésicule biliaire', pts: [[176, 66], [181, 96], [187, 128], [204, 160], [206, 214], [202, 270], [199, 330], [208, 396], [211, 456], [205, 524], [199, 592], [195, 660], [188, 718], [190, 750], [189, 776]] },
};

function lignesEtZones() {
  const lignes = [], zones = [];
  for (const [id, m] of Object.entries(MER)) {
    lignes.push({ id: id + 'G', pts: m.pts });
    lignes.push({ id: id + 'D', pts: miroir(m.pts, 150) });
    zones.push({ id: id, nom: m.nom, lignes: [id + 'G', id + 'D'], ancre: m.pts[Math.floor(m.pts.length / 2)] });
  }
  lignes.push({ id: 'conception', pts: [[150, 436], [150, 360], [150, 290], [150, 220], [150, 160], [150, 116]] });
  zones.push({ id: 'conception', nom: 'Vaisseau Conception', lignes: ['conception'], ancre: [150, 300] });
  return { lignes, zones };
}

function details() {
  const d = [];
  // clavicules
  d.push({ d: lisse([[160, 152], [172, 156], [190, 154], [208, 160]]), cl: 'fin' });
  d.push({ d: lisse([[140, 152], [128, 156], [110, 154], [92, 160]]), cl: 'fin' });
  // nombril, genoux, chevilles : à peine
  d.push({ d: lisse(ellipse(150, 336, 2.6, 3.4, 8), true), cl: 'fin' });
  for (const s of [1, -1]) {
    const x = (v) => 150 + s * (v - 150);
    d.push({ d: lisse([[x(171), 560], [x(180), 568], [x(191), 562]]), cl: 'fin' });
    d.push({ d: lisse([[x(166), 724], [x(171), 730]]), cl: 'fin' });
    d.push({ d: lisse([[x(176), 196], [x(190), 222], [x(200), 236]]), cl: 'pli' });
  }
  return d;
}

export function corps() {
  const { lignes, zones } = lignesEtZones();
  // points (acupoints) le long des méridiens, régulièrement espacés
  const points = [];
  for (const l of lignes) { const e = echantillons(l.pts, false, 6); for (let i = 3; i < e.length - 2; i += 9) points.push(e[i]); }
  return {
    type: 'silhouette', vb: [4, 16, 292, 784],
    membres: [{
      contour: contourCorps(), details: details(), zones, lignes, points, mat: [1, 0, 0, 1, 0, 0],
      gravure: { lumiere: [-.6, -.8], long: 10, pas: 4.6 },
    }],
  };
}
