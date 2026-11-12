// Tout ce qui est propre au commerce est ici : pour un autre restaurant, on change ce fichier et les photos.
// Chaque fait vient de SOURCES.md. Ce qui est inconnu reste en pointillés : la carte, les prix, les horaires, le téléphone.
// Rien ne dit que le restaurant est ouvert : la page ne l'écrit nulle part.
window.CONTENU = {
  nom: 'Ché Mia',
  metier: 'Restauration sur place et à emporter',
  adresse: ['94 ter boulevard Victor Hugo', '59000 Lille'],
  adresse2: '49 rue de Wazemmes',
  quartier: 'Wazemmes',
  numero: '94 ter',
  carteLien: 'https://www.google.com/maps/search/?api=1&query=94+ter+boulevard+Victor+Hugo+59000+Lille',
  // Aucun numéro : ceux des annuaires datent d'avant la reprise.
  telephone: null,
  jours: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'],
  // Rubriques relevées dans les annuaires AVANT la reprise (eat-list, Sluurpy) : présentées comme telles, à confirmer.
  // Aucun plat, aucun prix.
  rubriques: ['Burgers', 'Wraps', 'Sandwiches et paninis', 'Pâtes', 'Menus et assiettes', 'Frites et apéritifs'],
  // Les aimants à lettres de la porte du frigo.
  aimants: 'LA CARTE',
  // Le jeu des paires : six décors d'assiette, six choses vraies sur la maison.
  paires: [
    { decor: 'fleurs', titre: 'Sur place', texte: 'On s’assoit et on mange ici.' },
    { decor: 'rayons', titre: 'À emporter', texte: 'Ou on repart avec.' },
    { decor: 'feuilles', titre: 'Wazemmes', texte: 'Le quartier, à Lille.' },
    { decor: 'festons', titre: '94 ter boulevard Victor Hugo', texte: 'La première adresse.' },
    { decor: 'bandes', titre: '49 rue de Wazemmes', texte: 'La seconde adresse.' },
    { decor: 'losanges', titre: 'Octobre 2026', texte: 'Une nouvelle équipe.' },
  ],
  // Trois ambiances proposées depuis la page d'accueil de l'aperçu.
  palettes: {
    cerise: { accent: '#d3212f', accent2: '#a31420', accent3: '#ee4a4f' },
    faience: { accent: '#2456a6', accent2: '#173b78', accent3: '#4b7fd1' },
    menthe: { accent: '#1d7a5d', accent2: '#125341', accent3: '#3aa583' },
  },
};
