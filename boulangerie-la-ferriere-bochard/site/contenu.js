// Les faits de la maquette qui servent au script. Pour une autre boulangerie : on change ce fichier, les textes de index.html et les photos.
// Chaque fait vient de SOURCES.md. Ce qui est inconnu reste en pointillés dans la page.
window.CONTENU = {
  carteLien: 'https://www.google.com/maps/search/?api=1&query=Boulangerie+La+Ferri%C3%A8re-Bochard+61420',
  // Du mois de fermeture au mois de réouverture : quinze mois de rideau baissé, puis octobre 2026.
  mois: [
    ['Juil.', '2025'], ['Août', '2025'], ['Sept.', '2025'], ['Oct.', '2025'], ['Nov.', '2025'], ['Déc.', '2025'],
    ['Janv.', '2026'], ['Févr.', '2026'], ['Mars', '2026'], ['Avril', '2026'], ['Mai', '2026'], ['Juin', '2026'], ['Juil.', '2026'],
    ['Août', '2026'], ['Sept.', '2026'], ['Oct.', '2026'],
  ],
  // Horaires publiés par la mairie (0 = dimanche). Chaque créneau : [ouverture, fermeture] en heures.
  horaires: {
    0: [[7, 13]], 1: [], 2: [[7, 13], [16, 19]], 3: [[7, 13], [16, 19]], 4: [[7, 13], [16, 19]], 5: [[7, 13], [16, 19]], 6: [[7, 13]],
  },
  jours: ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'],
  // Le mot que le doigt écrit dans la farine à l'arrivée.
  motFarine: 'Rouverte !',
  // Les moments de la journée, un par rubrique, affichés à côté de l'astre du menu.
  // Trois teintes branchées sur le bouton Couleur de la page Bonjour.
  palettes: {
    braise: { accent: '#ff7b2e', 'accent-f': '#b9400d', dore: '#f3bf5c', soir: '#c44a26' },
    ble: { accent: '#f2b534', 'accent-f': '#8a5a00', dore: '#f0cf7a', soir: '#a8641a' },
    aube: { accent: '#ff8f7a', 'accent-f': '#b23a2b', dore: '#f6c79a', soir: '#b8455a' },
  },
};
