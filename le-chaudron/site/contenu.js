// Tous les faits de la maquette sont ici. Chaque fait vient de SOURCES.md.
// Ce qui est inconnu vaut null et s'affiche en pointillés (carte, prix, horaires, téléphone, enseigne définitive).
window.CONTENU = {
  nom: 'Le Chaudron',
  sousNom: 'd’Andernos',
  metier: 'Traiteur, rôtisserie, plats cuisinés à emporter, épicerie fine', // BODACC, activité du fonds cédé
  adresse: ['10 avenue de Bordeaux', '33510 Andernos-les-Bains'], // BODACC, annonce du 31/10/2026
  carte: 'https://www.google.com/maps/search/?api=1&query=10+avenue+de+Bordeaux+33510+Andernos-les-Bains',
  reprise: 'Maison reprise à l’automne 2026 par Nicolas Rambeau.', // BODACC : acte du 19/10/2026, société NICOLAS RAMBEAU
  telephone: null, // aucun numéro confirmé : voir SOURCES.md avant d'en écrire un
  enseigne: null, // nom définitif inconnu
  horaires: null, // ceux des annuaires sont ceux de l'ancien exploitant
  // Les quatre emplacements du fourneau : libellé, puis ce qui reste à écrire.
  fourneau: [
    { cle: 'jour', nom: 'Plat du jour' },
    { cle: 'broche', nom: 'À la broche' },
    { cle: 'chaudron', nom: 'Dans le chaudron' },
    { cle: 'soir', nom: 'Pour ce soir' },
  ],
  // Ce qu'on peut noter dans une commande à emporter : des familles, pas des plats (la carte est inconnue).
  emporter: [
    { cle: 'broche', nom: 'À la broche', un: 'part à la broche', plusieurs: 'parts à la broche' },
    { cle: 'chaudron', nom: 'Dans le chaudron', un: 'louche du chaudron', plusieurs: 'louches du chaudron' },
    { cle: 'jour', nom: 'Le plat du jour', un: 'plat du jour', plusieurs: 'plats du jour' },
    { cle: 'epicerie', nom: 'De l’épicerie', un: 'bocal de l’épicerie', plusieurs: 'bocaux de l’épicerie' },
  ],
  // Paliers du traiteur : simples mots d'occasion, pas des formules de la maison.
  occasions: [
    [2, 'Un dîner à la maison'],
    [9, 'Un repas de famille'],
    [26, 'Une fête'],
    [61, 'Une réception entière'],
  ],
  jours: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'],
  // Trois ambiances, branchées sur le bouton « Couleur » de la page Bonjour (?palette=...).
  palettes: {
    cuivre: { '--eau': '#17606b', '--eau-f': '#0d3d47', '--eau-c': '#a9d6d0', '--acc': '#c9412a', '--acc-f': '#8f2415' },
    cocotte: { '--eau': '#a8301f', '--eau-f': '#6d170f', '--eau-c': '#f2b6a0', '--acc': '#17606b', '--acc-f': '#0d3d47' },
    pin: { '--eau': '#2c6146', '--eau-f': '#173a29', '--eau-c': '#b9d8b7', '--acc': '#d0652a', '--acc-f': '#8a3a12' },
  },
};
