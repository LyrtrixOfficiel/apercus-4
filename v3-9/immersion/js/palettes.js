/* IMMERSION : les palettes. Une seule source pour la page (couleurs CSS, reprises
   dans css/immersion.css sous html[data-palette]), pour le monde 3D (ciel, eau,
   lumiere du cristal, brume) et pour univers.json (ecrit par outils/univers.mjs).
   Toutes gardent la nuit : c'est l'univers. Ce qui change, c'est la couleur de
   la lumiere, et elle se voit au premier coup d'oeil. */

export const PALETTES = [
  {
    id: 'nuit-bleue', nom: 'Nuit bleue', teinte: 'bleu', ton: 'sombre', vivacite: 'douce',
    couleurs: { fond: '#04060b', encre: '#efebe4', texte: '#d9d6cf', doux: '#aab3bd', accent: '#a6dcd4', accent2: '#e8cba3' },
    defautPour: ['esprit', 'psy', 'elan'],
    monde: {
      zen: [0.010, 0.016, 0.034], hor: [0.035, 0.075, 0.105], lueur: [0.06, 0.16, 0.21], sol: [0.004, 0.007, 0.012],
      lum: [0.70, 0.92, 1.0], halo: [0.26, 0.62, 0.78], lune: [1.0, 0.98, 0.93], brume: [0.40, 0.64, 0.78], nom: [1.0, 0.97, 0.92],
      verre: [0.80, 0.93, 1.0], galet: [0.55, 0.92, 0.88], eau: [0.004, 0.010, 0.017],
      zenA: [0.040, 0.026, 0.050], horA: [0.34, 0.19, 0.13], lueurA: [0.62, 0.34, 0.18], lumA: [1.0, 0.80, 0.56], haloA: [1.0, 0.58, 0.32]
    }
  },
  {
    id: 'nuit-violette', nom: 'Nuit violette', teinte: 'violet', ton: 'sombre', vivacite: 'douce',
    couleurs: { fond: '#07050d', encre: '#f2ecf5', texte: '#ddd5e3', doux: '#b5acc2', accent: '#c9b6f2', accent2: '#f0c2c8' },
    defautPour: ['creation', 'energie'],
    monde: {
      zen: [0.018, 0.010, 0.040], hor: [0.085, 0.045, 0.150], lueur: [0.20, 0.10, 0.34], sol: [0.007, 0.004, 0.012],
      lum: [0.86, 0.74, 1.0], halo: [0.58, 0.38, 0.95], lune: [1.0, 0.96, 1.0], brume: [0.62, 0.48, 0.90], nom: [1.0, 0.95, 1.0],
      verre: [0.90, 0.82, 1.0], galet: [0.78, 0.64, 1.0], eau: [0.008, 0.005, 0.016],
      zenA: [0.050, 0.020, 0.060], horA: [0.36, 0.15, 0.28], lueurA: [0.74, 0.30, 0.46], lumA: [1.0, 0.76, 0.84], haloA: [1.0, 0.52, 0.66]
    }
  },
  {
    id: 'aube-doree', nom: 'Aube dorée', teinte: 'or', ton: 'sombre', vivacite: 'douce',
    couleurs: { fond: '#0a0705', encre: '#f5ede1', texte: '#e2d8ca', doux: '#bfb2a2', accent: '#ecc58c', accent2: '#f2a37a' },
    defautPour: ['toucher', 'beaute'],
    monde: {
      zen: [0.026, 0.018, 0.020], hor: [0.20, 0.11, 0.050], lueur: [0.50, 0.28, 0.10], sol: [0.010, 0.007, 0.005],
      lum: [1.0, 0.86, 0.62], halo: [1.0, 0.64, 0.30], lune: [1.0, 0.92, 0.78], brume: [0.88, 0.66, 0.40], nom: [1.0, 0.94, 0.80],
      verre: [1.0, 0.90, 0.74], galet: [1.0, 0.80, 0.52], eau: [0.014, 0.009, 0.005],
      zenA: [0.060, 0.034, 0.030], horA: [0.46, 0.22, 0.08], lueurA: [1.0, 0.52, 0.18], lumA: [1.0, 0.80, 0.50], haloA: [1.0, 0.56, 0.24]
    }
  },
  {
    id: 'brume-verte', nom: 'Brume verte', teinte: 'vert', ton: 'sombre', vivacite: 'douce',
    couleurs: { fond: '#040907', encre: '#edf3eb', texte: '#d5ded4', doux: '#aabaac', accent: '#a3dcb3', accent2: '#e6d79a' },
    defautPour: ['plantes', 'mouvement'],
    monde: {
      zen: [0.008, 0.024, 0.018], hor: [0.030, 0.110, 0.075], lueur: [0.07, 0.30, 0.18], sol: [0.004, 0.010, 0.007],
      lum: [0.72, 1.0, 0.80], halo: [0.30, 0.82, 0.50], lune: [0.96, 1.0, 0.94], brume: [0.44, 0.84, 0.58], nom: [0.94, 1.0, 0.94],
      verre: [0.78, 1.0, 0.86], galet: [0.52, 0.96, 0.68], eau: [0.003, 0.012, 0.008],
      zenA: [0.030, 0.040, 0.030], horA: [0.24, 0.26, 0.10], lueurA: [0.58, 0.58, 0.20], lumA: [1.0, 0.96, 0.66], haloA: [0.88, 0.84, 0.36]
    }
  },
  {
    id: 'rosee', nom: 'Rosée', teinte: 'rose', ton: 'sombre', vivacite: 'douce',
    couleurs: { fond: '#0b0609', encre: '#f7edf0', texte: '#e5d7dc', doux: '#c4afb7', accent: '#f3b6c6', accent2: '#f2c9a0' },
    defautPour: ['famille'],
    monde: {
      zen: [0.032, 0.014, 0.030], hor: [0.20, 0.075, 0.115], lueur: [0.48, 0.16, 0.26], sol: [0.012, 0.006, 0.009],
      lum: [1.0, 0.82, 0.88], halo: [1.0, 0.50, 0.66], lune: [1.0, 0.94, 0.95], brume: [0.92, 0.58, 0.72], nom: [1.0, 0.95, 0.96],
      verre: [1.0, 0.84, 0.90], galet: [1.0, 0.66, 0.80], eau: [0.014, 0.006, 0.010],
      zenA: [0.060, 0.026, 0.040], horA: [0.46, 0.20, 0.18], lueurA: [1.0, 0.50, 0.40], lumA: [1.0, 0.86, 0.74], haloA: [1.0, 0.62, 0.48]
    }
  }
];

export const IDS = PALETTES.map((p) => p.id);

export function trouverPalette(id) {
  return PALETTES.find((p) => p.id === id) || null;
}

/* Sans ?palette=, la palette depend de la famille du metier. */
export function paletteDefaut(fam) {
  return (PALETTES.find((p) => p.defautPour.includes(fam)) || PALETTES[0]).id;
}
