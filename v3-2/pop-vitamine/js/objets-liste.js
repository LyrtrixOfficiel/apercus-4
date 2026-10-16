// Pop vitaminé : quels objets pour quelle famille de métier. Aucun flacon, aucune gélule, aucun cachet, aucun galet.
// accueil : les trois objets de l'affiche (le premier, le plus grand, est le produit à son nom) ;
// nomme : l'objet qui porte l'étiquette à son nom (initiales, métier, ville) ;
// boite : les objets qui tombent dans la boîte à jouets du contact ;
// autocollants : les objets devenus autocollants dans les sections (approche, séance, tarifs, à propos, contact).
export const OBJETS_PAR_FAMILLE = {
  plantes: { accueil: ['sachet', 'theiere', 'plante'], nomme: 'sachet', boite: ['sachet', 'theiere', 'tasse', 'lavande'] },
  esprit: { accueil: ['bougie', 'coussin', 'lavande'], nomme: 'bougie', boite: ['bougie', 'coussin', 'lavande', 'tasse'] },
  psy: { accueil: ['carnet', 'tasse', 'plante'], nomme: 'carnet', boite: ['carnet', 'tasse', 'plante', 'bougie'] },
  toucher: { accueil: ['serviette', 'bougie', 'baume'], nomme: 'serviette', boite: ['serviette', 'baume', 'savon', 'lavande'] },
  famille: { accueil: ['sac', 'tasse', 'lavande'], nomme: 'sac', boite: ['sac', 'tasse', 'lavande', 'serviette'] },
  beaute: { accueil: ['savon', 'baume', 'lavande'], nomme: 'savon', boite: ['savon', 'serviette', 'baume', 'lavande'] },
  creation: { accueil: ['carnet', 'bol', 'bougie'], nomme: 'carnet', boite: ['carnet', 'bol', 'bougie', 'plante'] },
  energie: { accueil: ['bougie', 'bol', 'plante'], nomme: 'bougie', boite: ['bougie', 'bol', 'plante', 'serviette'] },
  mouvement: { accueil: ['brique', 'tapis', 'plante'], nomme: 'brique', boite: ['brique', 'tapis', 'serviette', 'plante'] },
  elan: { accueil: ['mug', 'carnet', 'plante'], nomme: 'mug', boite: ['mug', 'carnet', 'plante', 'bougie'] },
};

// les autocollants de chaque section, tirés de la liste de la famille
export function autocollants(liste) {
  const [a, b, c] = liste.accueil, autre = liste.boite.find((n) => !liste.accueil.includes(n)) || b;
  return { approche: b, seance: a, tarifs: c, apropos: autre, contact: a };
}

// noms lisibles (images à générer, textes alternatifs)
export const NOMS_OBJETS = {
  sachet: 'sachet de tisane en papier kraft', theiere: 'théière en grès émaillé', tasse: 'tasse de tisane sur sa soucoupe',
  plante: 'plante en pot', lavande: 'bouquet de lavande', bougie: 'bougie dans un pot de grès', coussin: 'coussin moelleux',
  carnet: 'carnet relié toile', savon: 'savon artisanal sur son porte-savon', serviette: 'serviette roulée', sac: 'sac en toile',
  mug: 'mug émaillé', baume: 'pot de baume', bol: 'bol chantant et son maillet', brique: 'brique de yoga en liège', tapis: 'tapis de yoga roulé',
};
