// Tout ce qui change d'une boulangerie à l'autre est ici. Chaque fait vient de SOURCES.md.
// Ce qui est inconnu reste en pointillés dans la page (fermeture, jours, téléphone, produits, prix).
window.CONTENU = {
  nom: 'Ma Baguette',
  metier: 'Boulangerie pâtisserie',
  adresse: '12 place Arnaud Bernard',
  ville: '31000 Toulouse',
  carte: 'https://www.google.com/maps/search/?api=1&query=12+place+Arnaud+Bernard+31000+Toulouse',
  telephone: null,   // numéro seulement « probable » dans LISTE-29-VERIFIEE.csv : jamais affiché
  ouverture: 6,      // fiche Google
  fermeture: null,   // inconnue
  jours: null,       // inconnus
  // Les quatre lignes du comptoir : noms génériques, prix en pointillés tant qu'on ne les connaît pas.
  comptoir: [
    { nom: 'La baguette', prix: '.. €', rayon: 'pain' },
    { nom: 'La tradition', prix: '.. €', rayon: 'pain' },
    { nom: 'Le pain du jour', prix: '.. €', rayon: 'pain' },
    { nom: 'La tarte', prix: '.. €', rayon: 'pat' },
    { nom: '............', prix: '.. €', rayon: 'pat' },
    { nom: '............', prix: '.. €', rayon: 'pat' },
  ],
  // Trois teintes, branchées sur le bouton Couleur de la page Bonjour (?palette=brique, pastel ou nuit).
  palettes: {
    brique: { mur: '#c95f45', joint: '#eed6ba', email: '#1c3f94', papier: '#fbf2df', encre: '#1a1b33', or: '#f0ab3c', theme: '#fbf2df' },
    pastel: { mur: '#4d70b0', joint: '#e4ecf6', email: '#b4452d', papier: '#fbf2df', encre: '#1a1b33', or: '#f3b54a', theme: '#fbf2df' },
    nuit: { mur: '#343a68', joint: '#1c2042', email: '#2a52c2', papier: '#f7edd8', encre: '#14152b', or: '#f6b545', theme: '#f7edd8' },
  },
};
