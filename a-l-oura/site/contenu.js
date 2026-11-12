// Les faits et les listes de la maquette sont ici : pour un autre bar ou brew pub, on change ce fichier et les photos.
// Chaque fait vient de SOURCES.md ; rien de l'ancien bistrot n'est repris ici. Ce qu'on ignore reste en pointillés.
window.CONTENU = {
  telephone: '06 15 10 60 71',
  telLien: '+33615106071',
  itineraire: 'https://www.google.com/maps/search/?api=1&query=2+place+Georges+Cl%C3%A9menceau+06500+Castellar',
  altitude: 363,
  // Trois ambiances, branchées sur le bouton Couleur de la page Bonjour et sur les trois poignées de la tireuse.
  palettes: {
    ambre: { nom: 'Ambrée', theme: '#0f3b2e' },
    blonde: { nom: 'Blonde', theme: '#113848' },
    brune: { nom: 'Brune', theme: '#2b1a12' },
  },
  // La tireuse de l'accueil : ce que dit le carton selon le verre servi.
  tirage: {
    depart: 'Tenez une poignée. Lâchez au trait.',
    demo: 'Comme ça. À vous : tenez une poignée, lâchez au trait.',
    encore: 'Encore un peu : le trait est plus haut.',
    reprise: 'Attention, chaque reprise fait mousser.',
    parfait: ['Parfaite. Pile au trait, deux doigts de mousse.', 'Au trait. Rien à redire.', 'Belle pression. On vous garde derrière le comptoir ?'],
    deborde: ['Ça déborde ! Lâchez un peu avant le trait.', 'Trop de mousse. On éponge, et on recommence.'],
    suivante: 'Verre suivant. À vous.',
  },
  // L'ardoise : la première face ne dit que ce qui est sûr (fiche de l'Office de tourisme), les deux autres attendent le gérant.
  ardoises: [
    { titre: 'Ce qui est sûr', lignes: [['Tout est fait maison', ''], ['Des produits locaux', 'dès que possible'], ['Les producteurs du coin', 'circuits courts'], ['La qualité', 'avant la quantité']], pied: 'Et une carte volontairement courte.' },
    { titre: 'À manger', lignes: [['.....', '.. €'], ['.....', '.. €'], ['.....', '.. €'], ['.....', '.. €']], pied: 'Vos plats et vos prix : à écrire avec vous.' },
    { titre: 'À la pression', lignes: [['Bière .....', 'style ....., degrés .....'], ['Bière .....', 'style ....., degrés .....'], ['Bière .....', 'style ....., degrés .....'], ['Bière .....', 'style ....., degrés .....']], pied: 'Vos bières et leurs noms : à écrire avec vous.' },
  ],
  horaires: [['Du lundi au dimanche', '.. h .. à .. h ..']],
};
