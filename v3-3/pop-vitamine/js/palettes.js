// Pop vitaminé : les six palettes en duo, et le choix par famille de métier.
// scenes : pour chaque section, [couleur a, couleur b, encre]. L'encre tient 4,5:1 sur tout le dégradé
// (vérifié par outils/contraste.mjs). Les sections alternent couleur franche et couleur douce.
// objets : couleurs des produits (glaçure, étiquette, tissu...). La glaçure est la couleur complémentaire du duo,
// comme une bouteille rouge sur un fond vert : les objets sautent aux yeux au lieu de se fondre dans le fond.
// titrePapier : la couleur des grands titres imprimés sur papier (étiquette, affiche, coupon), 4,5:1 sur le papier.
export const PALETTES = [
  {
    id: 'menthe', nom: 'Menthe et violette', teinte: 'vert', ton: 'clair', vivacite: 'vive',
    couleurs: { fond: '#0B7A55', encre: '#FFFFFF', accent: '#6A3FD4', accent2: '#0B7A55' },
    scenes: {
      accueil: ['#0B7A55', '#6A3FD4', '#FFFFFF'],
      approche: ['#C9F5DD', '#E2D7FF', '#1A0B2E'],
      seance: ['#6A3FD4', '#5531C2', '#FFFFFF'],
      tarifs: ['#0B7A55', '#096A4A', '#FFFFFF'],
      apropos: ['#E2D7FF', '#C9F5DD', '#1A0B2E'],
      contact: ['#6A3FD4', '#0B7A55', '#FFFFFF'],
    },
    objets: { glacure: '#FF6F61', glacure2: '#FFF4E6', vif: '#FFC93C', tissu: '#E8DCC6', etiquette: '#FFF8EC', etiquetteEncre: '#1A0B2E', bande: '#0B7A55', titrePapier: '#0B7A55' },
    defautPour: ['plantes'],
  },
  {
    id: 'mangue', nom: 'Mangue et framboise', teinte: 'orange', ton: 'clair', vivacite: 'vive',
    couleurs: { fond: '#FF8A3D', encre: '#2A0A10', accent: '#FF3D7F', accent2: '#FF8A3D' },
    scenes: {
      accueil: ['#FF8A3D', '#FF3D7F', '#2A0A10'],
      approche: ['#FFE2C9', '#FFD3E2', '#2A0A10'],
      seance: ['#FF3D7F', '#FF5A8F', '#2A0A10'],
      tarifs: ['#FF8A3D', '#FFA05A', '#2A0A10'],
      apropos: ['#FFD3E2', '#FFE2C9', '#2A0A10'],
      contact: ['#FF3D7F', '#FF8A3D', '#2A0A10'],
    },
    objets: { glacure: '#3B5BFF', glacure2: '#FFF3E6', vif: '#FFD23F', tissu: '#F2E3CC', etiquette: '#FFF8EC', etiquetteEncre: '#2A0A10', bande: '#FF3D7F', titrePapier: '#C81E5A' },
    defautPour: ['toucher', 'energie'],
  },
  {
    id: 'lagon', nom: 'Lagon et citron', teinte: 'bleu', ton: 'clair', vivacite: 'vive',
    couleurs: { fond: '#1E5BFF', encre: '#FFFFFF', accent: '#FFD60A', accent2: '#1E5BFF' },
    scenes: {
      accueil: ['#1E5BFF', '#1440D8', '#FFFFFF'],
      approche: ['#FFD60A', '#FFE45C', '#1A1405'],
      seance: ['#1E5BFF', '#2C47E6', '#FFFFFF'],
      tarifs: ['#FFE45C', '#FFD60A', '#1A1405'],
      apropos: ['#1440D8', '#1E5BFF', '#FFFFFF'],
      contact: ['#FFD60A', '#FFC800', '#1A1405'],
    },
    objets: { glacure: '#FF5A5F', glacure2: '#F4F1EA', vif: '#FFD60A', tissu: '#E9E1D0', etiquette: '#FFFFFF', etiquetteEncre: '#0B1A4D', bande: '#1E5BFF', titrePapier: '#1E5BFF' },
    defautPour: ['psy', 'mouvement'],
  },
  {
    id: 'cerise', nom: 'Cerise et pêche', teinte: 'rose', ton: 'clair', vivacite: 'vive',
    couleurs: { fond: '#FF4F86', encre: '#2A0A12', accent: '#D81B5F', accent2: '#FF9E7A' },
    scenes: {
      accueil: ['#FF4F86', '#FF9E7A', '#2A0A12'],
      approche: ['#FFE1D6', '#FFD1E0', '#2A0A12'],
      seance: ['#D81B5F', '#C2124F', '#FFFFFF'],
      tarifs: ['#FF9E7A', '#FFB394', '#2A0A12'],
      apropos: ['#FFD1E0', '#FFE1D6', '#2A0A12'],
      contact: ['#FF4F86', '#FF9E7A', '#2A0A12'],
    },
    objets: { glacure: '#17906A', glacure2: '#FFF4EE', vif: '#FFD23F', tissu: '#F3E4D3', etiquette: '#FFFFFF', etiquetteEncre: '#2A0A12', bande: '#FF4F86', titrePapier: '#C2124F' },
    defautPour: ['famille', 'beaute'],
  },
  {
    id: 'raisin', nom: 'Raisin et lilas', teinte: 'violet', ton: 'clair', vivacite: 'vive',
    couleurs: { fond: '#5B2BD6', encre: '#FFFFFF', accent: '#C9A7FF', accent2: '#5B2BD6' },
    scenes: {
      accueil: ['#5B2BD6', '#8E34C8', '#FFFFFF'],
      approche: ['#ECE2FF', '#DCC9FF', '#1E0B3A'],
      seance: ['#C9A7FF', '#B794FF', '#1E0B3A'],
      tarifs: ['#5B2BD6', '#4A1FC2', '#FFFFFF'],
      apropos: ['#DCC9FF', '#ECE2FF', '#1E0B3A'],
      contact: ['#8E34C8', '#5B2BD6', '#FFFFFF'],
    },
    objets: { glacure: '#FF7A45', glacure2: '#FFF5EC', vif: '#FFE14D', tissu: '#ECE3D6', etiquette: '#FFFFFF', etiquetteEncre: '#1E0B3A', bande: '#5B2BD6', titrePapier: '#5B2BD6' },
    defautPour: ['esprit'],
  },
  {
    id: 'citron', nom: 'Citron et corail', teinte: 'jaune', ton: 'clair', vivacite: 'vive',
    couleurs: { fond: '#FFD23F', encre: '#2A0E08', accent: '#FF7A59', accent2: '#FFD23F' },
    scenes: {
      accueil: ['#FFD23F', '#FF7A59', '#2A0E08'],
      approche: ['#FFF2C2', '#FFDBCF', '#2A0E08'],
      seance: ['#FF7A59', '#FF8D6E', '#2A0E08'],
      tarifs: ['#FFD23F', '#FFDE6B', '#2A0E08'],
      apropos: ['#FFDBCF', '#FFF2C2', '#2A0E08'],
      contact: ['#FF7A59', '#FFD23F', '#2A0E08'],
    },
    objets: { glacure: '#3355FF', glacure2: '#FFF7E8', vif: '#2E9E6A', tissu: '#F1E6D2', etiquette: '#FFFFFF', etiquetteEncre: '#2A0E08', bande: '#FF7A59', titrePapier: '#C93A1E' },
    defautPour: ['elan', 'creation'],
  },
];

export const PALETTE_PAR_ID = Object.fromEntries(PALETTES.map((p) => [p.id, p]));

export function choisirPalette(fam, demande) {
  if (demande && PALETTE_PAR_ID[demande]) return PALETTE_PAR_ID[demande];
  return PALETTES.find((p) => p.defautPour.includes(fam)) || PALETTES[0];
}

// la palette suivante (bouton « essayer une autre couleur » du pied de page)
export const suivante = (id) => PALETTES[(PALETTES.findIndex((p) => p.id === id) + 1) % PALETTES.length];
