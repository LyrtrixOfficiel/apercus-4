// Liquid glass : les six palettes (fonds d'écran) et le choix par famille de métier.
// fond / encre / accent / accent2 : couleurs du contrat univers.json.
// papier : les couleurs du fond d'écran calculé (tarifs, chargement, repli sans photo) :
//   0 vive, 1 seconde vive, 2 claire, 3 très claire, 4 profonde.
// verre : teinte que le verre prend légèrement ; nuit : l'interface passe en apparence sombre.
export const PALETTES = [
  {
    id: 'lagon', nom: 'Lagon', teinte: 'bleu', ton: 'clair', vivacite: 'vive',
    couleurs: { fond: '#E8F2FA', encre: '#0A1A2A', accent: '#0A63B8', accent2: '#2FC3E3' },
    papier: ['#0A84FF', '#35C6F2', '#9BE7F7', '#E3F7FF', '#0B4AA8'],
    defautPour: ['psy', 'mouvement'],
  },
  {
    id: 'prairie', nom: 'Prairie', teinte: 'vert', ton: 'clair', vivacite: 'vive',
    couleurs: { fond: '#ECF5EC', encre: '#0B1D11', accent: '#1C7440', accent2: '#8ED46A' },
    papier: ['#14984F', '#6CD45A', '#B4E64F', '#E2F7D2', '#0B5530'],
    defautPour: ['plantes'],
  },
  {
    id: 'lavande', nom: 'Lavande', teinte: 'violet', ton: 'clair', vivacite: 'douce',
    couleurs: { fond: '#F1EEFB', encre: '#16112B', accent: '#5636C2', accent2: '#BFA2FF' },
    papier: ['#6A47F5', '#F08BD6', '#A68AFF', '#EDE4FF', '#36198F'],
    defautPour: ['esprit', 'creation'],
  },
  {
    id: 'corail', nom: 'Corail', teinte: 'rose', ton: 'clair', vivacite: 'vive',
    couleurs: { fond: '#FCEDEA', encre: '#2A1012', accent: '#B8283F', accent2: '#FF9A87' },
    papier: ['#FF5E6C', '#FFB067', '#FF9DB2', '#FFE3DA', '#B3164F'],
    defautPour: ['famille', 'beaute'],
  },
  {
    id: 'soleil', nom: 'Soleil', teinte: 'orange', ton: 'clair', vivacite: 'vive',
    couleurs: { fond: '#FFF2E2', encre: '#251304', accent: '#AE4308', accent2: '#FFB340' },
    papier: ['#FF8500', '#FF6A5C', '#FFC233', '#FFF0C7', '#D93C0A'],
    defautPour: ['energie', 'toucher', 'elan'],
  },
  {
    id: 'minuit', nom: 'Minuit', teinte: 'bleu', ton: 'sombre', vivacite: 'douce',
    couleurs: { fond: '#090E1C', encre: '#F2F5FF', accent: '#8DB5FF', accent2: '#B996FF' },
    papier: ['#3B2B8E', '#7462E8', '#1C5594', '#0A1C4A', '#05070F'],
    defautPour: [],
  },
];

export const PALETTE_PAR_ID = Object.fromEntries(PALETTES.map((p) => [p.id, p]));

export function choisirPalette(fam, demande) {
  if (demande && PALETTE_PAR_ID[demande]) return PALETTE_PAR_ID[demande];
  return PALETTES.find((p) => p.defautPour.includes(fam)) || PALETTES[0];
}
