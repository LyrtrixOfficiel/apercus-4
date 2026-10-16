// Aurora Nuit : la fiche de l'univers et ses palettes. Source unique :
// batir.mjs en tire univers.json (contrat de BRIEF-2) et css/palettes.css,
// app.js y lit les couleurs du shader des aurores et des etoiles.
import { famille } from '../../commun/familles.js';

// gl : couleurs du shader en 0..1. nuit = [haut, bas] du ciel ; rideaux = trois rideaux [bas, haut].
export const PALETTES = [
  {
    id: 'aurore-verte', nom: 'Aurore verte', teinte: 'vert', ton: 'sombre', vivacite: 'vive',
    couleurs: { fond: '#050813', encre: '#eef1fb', accent: '#7cf5c8', accent2: '#b9a8ff' },
    defautPour: ['esprit', 'plantes'],
    css: {
      nuit: '#050813', 'nuit-2': '#0b1026', encre: '#eef1fb', doux: '#c9d1e8', pale: '#a3adcc', accent: '#7cf5c8', accent2: '#b9a8ff', accent3: '#ffb0da',
      reve: '#d9d0ff', 'reve-signe': '#b9a8ff', lune1: '#26346a', lune2: '#111a3e', lune3: '#070b1e',
      crepuscule1: '#1b1640', crepuscule2: '#5a2f5e', crepuscule3: '#c4637a', aube1: '#0e2236', aube2: '#2f6a6a', aube3: '#c9b88a',
      bouton: '#f4f6ff', 'bouton-encre': '#070b1c', 'theme-color': '#050813',
    },
    gl: { nuit: [[.012, .018, .05], [.016, .02, .062]], horizon: [.02, .035, .075],
      rideaux: [[[.18, 1, .6], [.5, .3, 1]], [[.12, .82, .86], [.45, .27, .9]], [[.55, .7, .62], [1, .34, .68]]], frange: [1, .35, .7], etoile: [235, 242, 255] },
  },
  {
    id: 'aurore-violette', nom: 'Aurore violette', teinte: 'violet', ton: 'sombre', vivacite: 'vive',
    couleurs: { fond: '#07051a', encre: '#f1edff', accent: '#c9adff', accent2: '#ff9fd8' },
    defautPour: ['energie', 'creation'],
    css: {
      nuit: '#07051a', 'nuit-2': '#120c30', encre: '#f1edff', doux: '#d0c8ec', pale: '#ada3d2', accent: '#c9adff', accent2: '#ff9fd8', accent3: '#7cd8f5',
      reve: '#ffd0ec', 'reve-signe': '#ff9fd8', lune1: '#33285e', lune2: '#1a1240', lune3: '#0b0720',
      crepuscule1: '#1d1240', crepuscule2: '#5e2a66', crepuscule3: '#d0607e', aube1: '#160f33', aube2: '#5a3a7a', aube3: '#d4a2be',
      bouton: '#f6f2ff', 'bouton-encre': '#120c30', 'theme-color': '#07051a',
    },
    gl: { nuit: [[.018, .012, .05], [.03, .016, .07]], horizon: [.05, .025, .09],
      rideaux: [[[.58, .32, 1], [.95, .3, .78]], [[.38, .3, .95], [.7, .25, .9]], [[.95, .45, .8], [.4, .7, 1]]], frange: [1, .5, .9], etoile: [242, 236, 255] },
  },
  {
    id: 'nuit-bleue', nom: 'Nuit bleue', teinte: 'bleu', ton: 'sombre', vivacite: 'douce',
    couleurs: { fond: '#040a18', encre: '#eef4ff', accent: '#8cc8ff', accent2: '#a8b8ff' },
    defautPour: ['psy', 'mouvement'],
    css: {
      nuit: '#040a18', 'nuit-2': '#0a1530', encre: '#eef4ff', doux: '#c6d3ea', pale: '#9fb0cf', accent: '#8cc8ff', accent2: '#a8b8ff', accent3: '#7cf5e8',
      reve: '#cfe0ff', 'reve-signe': '#8cc8ff', lune1: '#1f3866', lune2: '#0f1e40', lune3: '#060c1e',
      crepuscule1: '#0f1838', crepuscule2: '#2c3a6e', crepuscule3: '#8a6a9a', aube1: '#0a1c34', aube2: '#2a5a80', aube3: '#a6c3d8',
      bouton: '#f2f7ff', 'bouton-encre': '#06102a', 'theme-color': '#040a18',
    },
    gl: { nuit: [[.01, .02, .055], [.014, .03, .075]], horizon: [.02, .05, .1],
      rideaux: [[[.2, .62, 1], [.35, .4, .95]], [[.15, .85, .95], [.3, .5, 1]], [[.55, .7, 1], [.7, .55, 1]]], frange: [.6, .8, 1], etoile: [230, 240, 255] },
  },
  {
    id: 'aube-rose', nom: 'Aube rose', teinte: 'rose', ton: 'sombre', vivacite: 'douce',
    couleurs: { fond: '#120818', encre: '#fff0f4', accent: '#ffb3c8', accent2: '#ffd2a0' },
    defautPour: ['famille', 'beaute'],
    css: {
      nuit: '#120818', 'nuit-2': '#22102a', encre: '#fff0f4', doux: '#ecd2dc', pale: '#c9a8b8', accent: '#ffb3c8', accent2: '#ffd2a0', accent3: '#c9a8ff',
      reve: '#ffe0b8', 'reve-signe': '#ffd2a0', lune1: '#4a2a4e', lune2: '#2a1430', lune3: '#140a18',
      crepuscule1: '#2a1236', crepuscule2: '#7a3360', crepuscule3: '#f08a86', aube1: '#2a1430', aube2: '#8a4a6a', aube3: '#e2b394',
      bouton: '#fff4f6', 'bouton-encre': '#22102a', 'theme-color': '#120818',
    },
    gl: { nuit: [[.045, .016, .05], [.06, .022, .06]], horizon: [.1, .04, .08],
      rideaux: [[[1, .42, .62], [1, .7, .5]], [[.95, .5, .75], [.7, .45, 1]], [[1, .78, .45], [1, .45, .55]]], frange: [1, .75, .6], etoile: [255, 238, 242] },
  },
  {
    id: 'aube-doree', nom: 'Aube dorée', teinte: 'or', ton: 'sombre', vivacite: 'douce',
    couleurs: { fond: '#0d0a12', encre: '#fff7e8', accent: '#f5d08a', accent2: '#ffb07a' },
    defautPour: ['toucher', 'elan'],
    css: {
      nuit: '#0d0a12', 'nuit-2': '#1c1520', encre: '#fff7e8', doux: '#e8dcc6', pale: '#c4b59c', accent: '#f5d08a', accent2: '#ffb07a', accent3: '#b9e8c8',
      reve: '#ffe6b0', 'reve-signe': '#f5d08a', lune1: '#3e3424', lune2: '#221c16', lune3: '#100c0c',
      crepuscule1: '#201828', crepuscule2: '#5e3a3a', crepuscule3: '#e09060', aube1: '#1a1820', aube2: '#5a5040', aube3: '#dcc184',
      bouton: '#fff8ea', 'bouton-encre': '#1c1520', 'theme-color': '#0d0a12',
    },
    gl: { nuit: [[.03, .024, .04], [.045, .032, .05]], horizon: [.08, .06, .05],
      rideaux: [[[1, .78, .35], [1, .5, .3]], [[.95, .62, .3], [.85, .45, .55]], [[.75, .9, .6], [1, .7, .4]]], frange: [1, .8, .5], etoile: [255, 246, 228] },
  },
];

export const UNIVERS = {
  id: 'aurora-nuit',
  nom: 'Aurora Nuit',
  promesse: "Une nuit d'aurores boréales : le nom s'écrit en étoiles, chaque thème devient une constellation, la séance traverse la nuit jusqu'à l'aube.",
  pourVous: "{prenom}, votre accompagnement raconté comme une nuit claire : vos thèmes en constellations, la séance du crépuscule à l'aube, vos tarifs gravés sur une carte du ciel.",
  familles: { esprit: 5, psy: 4, energie: 4, creation: 4, elan: 3, famille: 2, beaute: 2, mouvement: 2, toucher: 2, plantes: 1 },
  motsCles: ['nuit', 'etoile', 'reve', 'sommeil', 'hypno', 'medit', 'interieur', 'ressource', 'conscience', 'lumiere', 'energ', 'transformation', 'apais', 'calme', 'lacher', 'ciel', 'lune', 'intuition'],
  ambiances: ['sombre', 'mystere', 'chic', 'doux'],
  polices: {
    titre: 'Bodoni Moda', texte: 'Jost',
    css: 'https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..600;1,6..96,400..600&family=Jost:wght@300..500&display=swap',
  },
  affiche: "Ciel bleu nuit avec un rideau d'aurore vert et violet en haut, quelques étoiles reliées en constellation, nom en Bodoni Moda (didone des atlas célestes), un mot en italique.",
};

// Images a deposer (voir IMAGES-A-GENERER.md) : mettre le chemin quand le fichier existe, sinon laisser vide.
// Un portrait du praticien (champ portrait de sa fiche) passe toujours avant.
export const IMAGES = { lune: '' }; // ex. 'images/lune.webp'

export const parId = (id) => PALETTES.find((p) => p.id === id);

/** Palette retenue : ?palette=<id> d'abord, sinon celle de la famille du metier. */
export function choisirPalette(d, demande) {
  if (demande && parId(demande)) return parId(demande);
  const f = famille(d);
  return PALETTES.find((p) => p.defautPour.includes(f)) || PALETTES[0];
}

/** Contrat univers.json (BRIEF-2) : on ne garde que les champs du contrat. */
export function universJson() {
  return { ...UNIVERS, palettes: PALETTES.map(({ id, nom, teinte, ton, vivacite, couleurs, defautPour }) => ({ id, nom, teinte, ton, vivacite, couleurs, defautPour })) };
}

/** Feuille css/palettes.css : un bloc de variables par palette. */
export function palettesCss() {
  return '/* Ecrit par batir.mjs depuis js/univers.js : ne pas modifier a la main. */\n' + PALETTES.map((p, i) =>
    `${i === 0 ? ':root, ' : ''}:root[data-palette="${p.id}"] {\n${Object.entries(p.css).map(([k, v]) => `  --${k}: ${v};`).join('\n')}\n}`).join('\n');
}
