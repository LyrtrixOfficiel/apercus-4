// Tout ce qui est un FAIT est ici, avec sa source dans SOURCES.md. Pour un autre café, on change ce fichier.
// Ce qui est inconnu reste vide : la page dessine alors des pointillés épais « à compléter avec vous ».
window.CONTENU = {
  nom: 'Le Richelieu',
  // Aucun numéro affiché : quatre numéros différents circulent, aucun n'est confirmé pour la nouvelle équipe (LISTE-29-VERIFIEE.csv : « probable »).
  telephone: '',
  // Aucun horaire affiché : la page Facebook annonçait « Fermeture temporaire » le 09/11/2026.
  horaires: null,
  adresse: { numero: '8', rue: 'avenue Charles de Gaulle', ville: '19000 Tulle' },
  instagram: 'https://www.instagram.com/caferichelieu/',
  facebook: 'https://www.facebook.com/caferichelieu',
  carte: 'https://www.google.com/maps/search/?api=1&query=Caf%C3%A9+Le+Richelieu+8+avenue+Charles+de+Gaulle+19000+Tulle',

  // Les trois choses servies (BODACC du 29/10/2026 : café, bar licence IV, petite restauration).
  // « Bières artisanales, locales et bios » décrit très probablement le bar de l'équipe précédente (2021 à 2026) : présenté comme la maison jusqu'ici, à confirmer.
  // Les lignes de la carte sont volontairement vides : ni boisson, ni plat, ni prix inventé.
  objets: {
    cafe: {
      pilule: 'Un café', cartel: 'Son Éminence prend un café.',
      titre: 'Le café', sous: 'Au comptoir ou à la table.',
      note: 'Vos boissons chaudes et leurs prix : à compléter avec vous.',
    },
    biere: {
      pilule: 'Une bière artisanale', cartel: 'Son Éminence prend une bière artisanale.',
      titre: 'Les bières artisanales', sous: 'Locales et bios jusqu’ici. Vous les gardez ?',
      note: 'Vos bières du moment et leurs prix : à compléter avec vous.',
    },
    assiette: {
      pilule: 'De quoi grignoter', cartel: 'Son Éminence prend de quoi grignoter.',
      titre: 'La petite restauration', sous: 'De quoi grignoter avec un verre.',
      note: 'Vos assiettes et leurs prix : à compléter avec vous.',
    },
  },

  // Étiquettes des producteurs : aucune n'est connue, elles restent en pointillés.
  etiquettes: ['Pour la bière', 'Pour le café', 'Pour l’assiette', 'Et aussi', 'Et encore'],

  // Agenda : aucune soirée à venir n'a été trouvée.
  agenda: [null, null, null],

  semaine: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'],

  // Trois ambiances, branchées sur le bouton Couleur de la page Bonjour.
  palettes: {
    cardinal: { theme: '#c2161c' },
    narcisse: { theme: '#f6c11d' },
    bugle: { theme: '#3947b5' },
  },
};
