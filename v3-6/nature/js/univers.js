// Nature : la fiche de l'univers et ses palettes. Source unique :
// batir.mjs en tire univers.json (contrat de BRIEF-2) et css/palettes.css,
// app.js y lit les couleurs de la prairie WebGL, des pollens et des ombres.
import { famille } from '../../commun/familles.js';

// Couleurs du shader en 0..1 (lineaires a l'oeil, pas de correction gamma).
// Genres de fleurs : 0 marguerite, 1 bouton d'or, 2 coquelicot, 3 bleuet, 4 epi de lavande, 5 epi de ble.
export const PALETTES = [
  {
    id: 'prairie', nom: "Prairie d'été", teinte: 'vert', ton: 'clair', vivacite: 'douce',
    couleurs: { fond: '#f7f3e6', encre: '#1d3a28', accent: '#356b2b', accent2: '#e8b84a' },
    defautPour: ['plantes', 'elan'],
    css: {
      fond: '#f7f3e6', fond2: '#eef2e3', fond3: '#e9efdd', papier: '#fffdf6', encre: '#1d3a28', 'encre-papier': '#1d3a28', doux: '#344f3c',
      accent: '#356b2b', pousse: '#6fae4f', tendre: '#cfe5b0', soleil: '#ffd36e', place: '#574a85', 'place-signe': '#8a7cc0',
      ligne: 'rgba(29, 58, 40, .14)', terre: '#1b3324', 'terre-encre': '#eef2e2', 'terre-doux': '#c9d8bf', apercu: '#f3e3b0',
      ciel1: '#fbf5e1', ciel2: '#f8f2e0', ciel3: '#eef1dc', ciel4: '#e5edd5', ciel5: '#e2ead2',
      'soleil-coeur': 'rgba(255, 246, 214, 1)', 'soleil-halo': 'rgba(255, 232, 160, .55)', rayon: 'rgba(255, 249, 226, .7)',
      colline1: '#cfe0b4', colline2: '#a9c98e', colline3: '#7faa6a', colline4: '#5b8f4c',
      kraft: '#dcc69b', 'kraft-fonce': '#b99b69', bois: '#6f4e2c', 'bois-encre': '#fbf6ea', sentier: '#e5d6b4', 'sentier-bord': '#cdb88c',
      'plante-tige': '#5a7d3e', 'plante-feuille': 'rgba(126, 160, 86, .5)', 'plante-trait': '#5a7d3e', 'plante-fleur': '#f1e3b3', 'plante-coeur': '#d9a531',
      bouton: '#1d3a28', 'bouton-encre': '#fbf8ee', ombre: '#2c4a2a', 'ombre-force': '.07', 'theme-color': '#f7f3e6',
    },
    gl: {
      herbe: [[.09, .2, .1], [.25, .47, .19], [.6, .77, .38]], tige: [[.24, .42, .18], [.36, .56, .24]],
      sol: [[.16, .3, .12], [.27, .44, .17]], brume: [.9, .925, .84], jaune: [1.22, 1.06, .62], reflet: [1, .9, .55],
      fleurs: [[0, .42], [1, .2], [3, .16], [2, .22]],
      couleurs: { 0: [[1, .99, .95], [1, .9, .93], [.98, .76, .18]], 1: [[.99, .82, .2], [.99, .86, .3], [.9, .62, .1]], 2: [[.86, .22, .16], [.93, .36, .22], [.14, .09, .09]], 3: [[.35, .45, .92], [.55, .42, .9], [.3, .22, .55]], 4: [[.55, .45, .85], [.62, .5, .9], [.4, .3, .65]], 5: [[.92, .78, .45], [.85, .7, .38], [.7, .55, .25]] },
      pollen: ['rgba(255,244,200,1)', 'rgba(232,178,64,.9)', 'rgba(236,184,80,.22)'], lucioles: false,
    },
  },
  {
    id: 'bles', nom: "Prairie dorée d'automne", teinte: 'or', ton: 'clair', vivacite: 'douce',
    couleurs: { fond: '#f8efd9', encre: '#33260f', accent: '#875811', accent2: '#c8452c' },
    defautPour: ['toucher', 'energie'],
    css: {
      fond: '#f8efd9', fond2: '#f4e8cd', fond3: '#efe1c3', papier: '#fffaf0', encre: '#33260f', 'encre-papier': '#33260f', doux: '#4f3b1d',
      accent: '#875811', pousse: '#c08a2c', tendre: '#ecd9a6', soleil: '#ffc65a', place: '#6a3d5c', 'place-signe': '#a0708f',
      ligne: 'rgba(51, 38, 15, .15)', terre: '#2f2212', 'terre-encre': '#f5ead2', 'terre-doux': '#d9c7a3', apercu: '#f5d38a',
      ciel1: '#fdf0d2', ciel2: '#fbeac8', ciel3: '#f6e2bb', ciel4: '#f0d9ac', ciel5: '#ead2a2',
      'soleil-coeur': 'rgba(255, 238, 200, 1)', 'soleil-halo': 'rgba(255, 205, 120, .55)', rayon: 'rgba(255, 240, 205, .7)',
      colline1: '#ecd59a', colline2: '#d9b86b', colline3: '#c39a4c', colline4: '#a77d35',
      kraft: '#d7b98a', 'kraft-fonce': '#b18a55', bois: '#74491f', 'bois-encre': '#fff7e8', sentier: '#ead6ae', 'sentier-bord': '#cfb27d',
      'plante-tige': '#7a5a24', 'plante-feuille': 'rgba(176, 140, 70, .5)', 'plante-trait': '#7a5a24', 'plante-fleur': '#e6563a', 'plante-coeur': '#2a1a10',
      bouton: '#33260f', 'bouton-encre': '#fff7e8', ombre: '#4a3514', 'ombre-force': '.07', 'theme-color': '#f8efd9',
    },
    gl: {
      herbe: [[.2, .15, .06], [.56, .43, .16], [.88, .74, .4]], tige: [[.42, .38, .14], [.58, .52, .22]],
      sol: [[.3, .22, .1], [.46, .35, .15]], brume: [.97, .91, .77], jaune: [1.12, 1.02, .72], reflet: [1, .86, .5],
      fleurs: [[2, .38], [5, .44], [0, .12], [3, .06]],
      couleurs: { 0: [[1, .97, .9], [1, .92, .86], [.95, .66, .16]], 1: [[.99, .8, .22], [.98, .84, .3], [.9, .6, .1]], 2: [[.84, .17, .1], [.92, .3, .16], [.12, .07, .07]], 3: [[.33, .42, .86], [.5, .4, .86], [.3, .22, .5]], 4: [[.55, .45, .85], [.62, .5, .9], [.4, .3, .65]], 5: [[.93, .76, .4], [.86, .66, .3], [.66, .48, .2]] },
      pollen: ['rgba(255,240,205,1)', 'rgba(222,160,52,.9)', 'rgba(226,170,70,.22)'], lucioles: false,
    },
  },
  {
    id: 'lavande', nom: 'Prairie de lavande', teinte: 'violet', ton: 'clair', vivacite: 'douce',
    couleurs: { fond: '#f5f2f8', encre: '#2a2340', accent: '#5b4a98', accent2: '#8fa86a' },
    defautPour: ['esprit', 'psy', 'beaute'],
    css: {
      fond: '#f5f2f8', fond2: '#f0ecf6', fond3: '#ebe6f3', papier: '#fffdfc', encre: '#2a2340', 'encre-papier': '#2a2340', doux: '#463d61',
      accent: '#5b4a98', pousse: '#8f7cc8', tendre: '#ddd3f0', soleil: '#ffe2b0', place: '#7c3a5c', 'place-signe': '#b07898',
      ligne: 'rgba(42, 35, 64, .14)', terre: '#241e37', 'terre-encre': '#f0ecf8', 'terre-doux': '#cdc5e2', apercu: '#f1d9a8',
      ciel1: '#fbf3ee', ciel2: '#f7f0f2', ciel3: '#f0ebf4', ciel4: '#e9e3f1', ciel5: '#e3ddee',
      'soleil-coeur': 'rgba(255, 244, 228, 1)', 'soleil-halo': 'rgba(255, 214, 196, .5)', rayon: 'rgba(255, 246, 236, .7)',
      colline1: '#d9d6e8', colline2: '#bcb5d8', colline3: '#9d93c6', colline4: '#7f72b0',
      kraft: '#d8c6a4', 'kraft-fonce': '#b39b72', bois: '#5f4a3d', 'bois-encre': '#fdf9f4', sentier: '#e6dccb', 'sentier-bord': '#cbbca2',
      'plante-tige': '#5d6b4f', 'plante-feuille': 'rgba(128, 146, 112, .5)', 'plante-trait': '#5d6b4f', 'plante-fleur': '#9a86d0', 'plante-coeur': '#6a58a8',
      bouton: '#2a2340', 'bouton-encre': '#f8f5ff', ombre: '#35304a', 'ombre-force': '.06', 'theme-color': '#f5f2f8',
    },
    gl: {
      herbe: [[.1, .16, .13], [.3, .43, .33], [.6, .7, .57]], tige: [[.3, .4, .3], [.42, .52, .4]],
      sol: [[.18, .24, .2], [.3, .36, .28]], brume: [.94, .92, .96], jaune: [1.04, 1, 1.06], reflet: [1, .95, .9],
      fleurs: [[4, .8], [0, .13], [3, .07]],
      couleurs: { 0: [[1, .98, .97], [.98, .93, .97], [.96, .78, .3]], 1: [[.99, .82, .2], [.99, .86, .3], [.9, .62, .1]], 2: [[.86, .22, .16], [.93, .36, .22], [.14, .09, .09]], 3: [[.4, .45, .9], [.55, .45, .92], [.3, .22, .55]], 4: [[.5, .38, .8], [.6, .46, .86], [.36, .26, .6]], 5: [[.92, .78, .45], [.85, .7, .38], [.7, .55, .25]] },
      pollen: ['rgba(255,246,236,1)', 'rgba(196,170,236,.9)', 'rgba(196,170,236,.22)'], lucioles: false,
    },
  },
  {
    id: 'crepuscule', nom: 'Prairie au crépuscule', teinte: 'rose', ton: 'sombre', vivacite: 'vive',
    couleurs: { fond: '#1d1a2b', encre: '#f6eee4', accent: '#f4b06a', accent2: '#e77f8f' },
    defautPour: ['creation'],
    css: {
      fond: '#1d1a2b', fond2: '#211d31', fond3: '#1a1727', papier: '#f6efe2', encre: '#f6eee4', 'encre-papier': '#2a2033', doux: '#ddd3e2',
      accent: '#f4b06a', pousse: '#e88f6a', tendre: '#3a3350', soleil: '#ffb07a', place: '#cdbdff', 'place-signe': '#a993f0',
      ligne: 'rgba(246, 238, 228, .16)', terre: '#110e1a', 'terre-encre': '#f1e9f5', 'terre-doux': '#bfb6cf', apercu: '#f6c88e',
      ciel1: '#1c1834', ciel2: '#2f2552', ciel3: '#5a3466', ciel4: '#9a4a6c', ciel5: '#d9776c',
      'soleil-coeur': 'rgba(255, 196, 140, .95)', 'soleil-halo': 'rgba(240, 120, 110, .45)', rayon: 'rgba(255, 190, 150, .45)',
      colline1: '#4a3352', colline2: '#36284a', colline3: '#261d38', colline4: '#1a1528',
      kraft: '#d8bf98', 'kraft-fonce': '#a98b62', bois: '#6b4a38', 'bois-encre': '#fff4e6', sentier: '#3a3046', 'sentier-bord': '#4c3f5c',
      'plante-tige': '#6a5a4a', 'plante-feuille': 'rgba(130, 110, 120, .45)', 'plante-trait': '#5a4a50', 'plante-fleur': '#e98a7a', 'plante-coeur': '#7a3a4a',
      bouton: '#f6eee4', 'bouton-encre': '#1d1a2b', ombre: '#000000', 'ombre-force': '0', 'theme-color': '#1d1a2b',
    },
    gl: {
      herbe: [[.015, .02, .04], [.07, .07, .13], [.3, .2, .26]], tige: [[.06, .06, .11], [.16, .12, .18]],
      sol: [[.02, .02, .05], [.05, .04, .09]], brume: [.86, .5, .46], jaune: [1.5, 1, .8], reflet: [1, .6, .45],
      fleurs: [[0, .5], [2, .3], [3, .2]],
      couleurs: { 0: [[.95, .78, .8], [.9, .7, .78], [.95, .6, .3]], 1: [[.95, .7, .3], [.95, .74, .35], [.8, .5, .15]], 2: [[.7, .16, .2], [.8, .24, .26], [.1, .05, .08]], 3: [[.42, .38, .85], [.5, .36, .8], [.25, .18, .45]], 4: [[.5, .38, .8], [.6, .46, .86], [.36, .26, .6]], 5: [[.92, .7, .45], [.85, .62, .38], [.6, .4, .25]] },
      pollen: ['rgba(250,255,190,1)', 'rgba(214,240,120,.85)', 'rgba(200,230,110,.2)'], lucioles: true,
    },
  },
  {
    id: 'rosee', nom: 'Prairie de rosée', teinte: 'bleu', ton: 'clair', vivacite: 'douce',
    couleurs: { fond: '#eef3f6', encre: '#16303d', accent: '#24607a', accent2: '#9cc6d2' },
    defautPour: ['famille', 'mouvement'],
    css: {
      fond: '#eef3f6', fond2: '#e8f0f4', fond3: '#e2ecf1', papier: '#fdfefe', encre: '#16303d', 'encre-papier': '#16303d', doux: '#2e4a58',
      accent: '#24607a', pousse: '#4f93ad', tendre: '#cfe3ec', soleil: '#fff1c9', place: '#6a4a8c', 'place-signe': '#9a80bb',
      ligne: 'rgba(22, 48, 61, .14)', terre: '#132a35', 'terre-encre': '#e9f3f6', 'terre-doux': '#bcd2dc', apercu: '#f0e3b8',
      ciel1: '#f5f8fa', ciel2: '#eef4f8', ciel3: '#e5eff5', ciel4: '#dbe8ef', ciel5: '#d4e3ea',
      'soleil-coeur': 'rgba(255, 252, 240, 1)', 'soleil-halo': 'rgba(220, 236, 250, .6)', rayon: 'rgba(255, 255, 250, .7)',
      colline1: '#cfe0e6', colline2: '#a8c6d1', colline3: '#82a9b8', colline4: '#5d8a9b',
      kraft: '#d6c7a6', 'kraft-fonce': '#ae9c76', bois: '#574636', 'bois-encre': '#fbfaf6', sentier: '#dfe2da', 'sentier-bord': '#bfc5b8',
      'plante-tige': '#4d6b62', 'plante-feuille': 'rgba(110, 150, 140, .48)', 'plante-trait': '#4d6b62', 'plante-fleur': '#6f8fe0', 'plante-coeur': '#3c4c9a',
      bouton: '#16303d', 'bouton-encre': '#f4fafc', ombre: '#23404a', 'ombre-force': '.06', 'theme-color': '#eef3f6',
    },
    gl: {
      herbe: [[.05, .13, .14], [.17, .37, .36], [.5, .7, .7]], tige: [[.17, .33, .3], [.28, .45, .42]],
      sol: [[.1, .2, .2], [.17, .3, .29]], brume: [.88, .93, .95], jaune: [.98, 1.04, 1.1], reflet: [.85, .95, 1],
      fleurs: [[3, .5], [0, .38], [4, .12]],
      couleurs: { 0: [[1, 1, 1], [.95, .97, 1], [.96, .82, .32]], 1: [[.99, .82, .2], [.99, .86, .3], [.9, .62, .1]], 2: [[.86, .22, .16], [.93, .36, .22], [.14, .09, .09]], 3: [[.28, .42, .95], [.36, .5, .98], [.2, .2, .55]], 4: [[.48, .45, .88], [.55, .5, .92], [.34, .3, .62]], 5: [[.92, .78, .45], [.85, .7, .38], [.7, .55, .25]] },
      pollen: ['rgba(255,255,255,1)', 'rgba(200,226,240,.9)', 'rgba(200,226,240,.22)'], lucioles: false,
    },
  },
];

export const UNIVERS = {
  id: 'nature',
  nom: 'Nature',
  promesse: "Une prairie qui pousse à l'ouverture, s'écarte sous la main, et un herbier où l'on tourne les planches.",
  pourVous: '{prenom}, votre accompagnement raconté comme une promenade : un herbier pour votre approche, un sentier pour la séance, des sachets de graines pour vos tarifs.',
  familles: { plantes: 5, toucher: 4, mouvement: 4, famille: 4, energie: 3, beaute: 3, elan: 3, esprit: 2, creation: 2, psy: 2 },
  motsCles: ['nature', 'plante', 'jardin', 'terre', 'saison', 'respir', 'equilibre', 'naturel', 'vital', 'herb', 'fleur', 'prevention', 'aroma', 'phyto', 'douceur', 'racine', 'foret', 'campagne'],
  ambiances: ['lumineux', 'naturel', 'doux', 'chaleureux'],
  polices: {
    titre: 'Fraunces', texte: 'Figtree',
    css: 'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght,SOFT,WONK@0,9..144,300..600,0..100,0..1;1,9..144,300..600,0..100,0..1&family=Figtree:wght@400..600&display=swap',
  },
  affiche: "Bande de prairie en bas (brins verts, quelques marguerites et coquelicots), fond crème ensoleillé, nom en Fraunces doux avec le dernier mot en italique.",
};

// Images a deposer (voir IMAGES-A-GENERER.md) : mettre le chemin quand le fichier existe, sinon laisser vide.
// Un portrait du praticien (champ portrait de sa fiche) passe toujours avant.
export const IMAGES = { arche: '' }; // ex. 'images/arche.webp'

export const parId = (id) => PALETTES.find((p) => p.id === id);

/** Palette retenue : ?palette=<id> d'abord, sinon celle de la famille du metier. */
export function choisirPalette(d, demande) {
  if (demande && parId(demande)) return parId(demande);
  const f = famille(d);
  return PALETTES.find((p) => p.defautPour.includes(f)) || PALETTES[0];
}

/** Contrat univers.json (BRIEF-2) : on ne garde que les champs du contrat. */
export function universJson() {
  return {
    ...UNIVERS,
    palettes: PALETTES.map(({ id, nom, teinte, ton, vivacite, couleurs, defautPour }) => ({ id, nom, teinte, ton, vivacite, couleurs, defautPour })),
  };
}

/** Feuille css/palettes.css : un bloc de variables par palette. */
export function palettesCss() {
  return '/* Ecrit par batir.mjs depuis js/univers.js : ne pas modifier a la main. */\n' + PALETTES.map((p, i) =>
    `${i === 0 ? ':root, ' : ''}:root[data-palette="${p.id}"] {\n${Object.entries(p.css).map(([k, v]) => `  --${k}: ${v};`).join('\n')}\n  color-scheme: ${p.ton === 'sombre' ? 'dark' : 'light'};\n}`).join('\n');
}
