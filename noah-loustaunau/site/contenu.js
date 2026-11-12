// Tout ce qui change d'un paysagiste ou d'un élagueur à l'autre est ici.
// Chaque fait vient de SOURCES.md. Ce qui est inconnu reste en pointillés.
// Le seul numéro connu est celui de l'ancien exploitant : il ne doit jamais s'afficher (voir SOURCES.md).
window.CONTENU = {
  telephone: null, // numéro de Noah Loustaunau inconnu à ce jour : pointillés

  // La branche qu'on scie : la phrase s'allume en trois temps
  elagage: {
    phrase: ['La branche de trop,', 'retirée à la bonne hauteur,', 'sans abîmer ce qui reste.'],
    details: ['Hauteurs', 'Essences', 'Abattage', 'Évacuation']
  },

  // Les cernes de la souche, du plus ancien au plus récent
  cernes: [
    { quand: '2025', titre: 'À son compte',
      texte: 'Noah Loustaunau s’installe à son compte, en travaux agricoles.' },
    { quand: 'Juillet 2026', titre: 'La reprise',
      texte: 'Il reprend une partie d’une activité de paysagiste et d’élagage à Molesmes, dans l’Yonne, et un service d’aménagement paysager à Lainsecq.' },
    { quand: 'Ensuite', titre: 'Le prochain cerne', pointilles: true,
      texte: '........................ C’est vous qui l’écrivez.' }
  ],

  // Les saisons : le feuillage de tout le site change
  saisons: [
    { id: 'printemps', nom: 'Printemps', ligne: 'Au printemps, chez vous' },
    { id: 'ete', nom: 'Été', ligne: 'En été, chez vous' },
    { id: 'automne', nom: 'Automne', ligne: 'À l’automne, chez vous' },
    { id: 'hiver', nom: 'Hiver', ligne: 'En hiver, chez vous' }
  ],

  // Les bornes du secteur
  bornes: [
    { nom: 'Molesmes', sous: '89560 Les Hauts de Forterre' },
    { nom: 'Lainsecq', sous: '89520, Yonne' },
    { nom: '..........', sous: 'Autres communes', pointilles: true }
  ],

  // Les coordonnées : tout est en pointillés tant que Noah ne les a pas données
  coordonnees: [
    { nom: 'Téléphone', valeur: '.. .. .. .. ..' },
    { nom: 'Mail', valeur: '....................' },
    { nom: 'Communes desservies', valeur: '....................' },
    { nom: 'Horaires', valeur: '....................' }
  ],

  // Une bûche, une page
  pages: ['Élagage', 'Jardins', 'Chantiers', 'Avant, après', 'Devis', 'Contact']
};
