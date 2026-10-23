// Mathéo Bringia : LE PILOTE. Toutes les pages lisent ce fichier (l'accueil, « Le pilote », le pied de page).
//
// MODE D'EMPLOI
//   - Modifier un texte : changer ce qui est entre les apostrophes, garder les apostrophes et la virgule de fin.
//     Une apostrophe DANS le texte s'écrit ’ (apostrophe typographique) : « l’Indoor », jamais l'Indoor.
//   - Ajouter une ligne au palmarès : copier un bloc { ... }, le coller en haut de la liste PALMARES (la liste se lit
//     du plus récent au plus ancien), le remplir. « fort: true » le met en avant (accueil, gros chiffre).
//   - « exemple: true » : le texte est un EXEMPLE de maquette (un petit badge « exemple » s'affiche). À remplacer ou
//     supprimer avant la mise en ligne.
//   - Après une modification : lancer « node outils/generer.mjs » (version sans JavaScript des pages).
//     Avec JavaScript, toutes les pages se mettent à jour d'elles-mêmes.
//
// SOURCES : les résultats viennent des classements officiels publiés par Silverlane Events (FRKC et CRKI),
// relevés le 23/10/2026 (voir RECHERCHE.md). Rien n'est inventé ici, sauf ce qui porte « exemple: true ».

export const PILOTE = {
  prenom: 'Mathéo',
  nom: 'Bringia',
  numero: '15', // le numéro du kart dans le reel de l’Outdoor 2026 : la signature graphique du site
  discipline: 'Pilote de karting',
  accroche: 'Karting de location, à fond. FRKC, CRKI, et l’envie d’aller chercher la finale.',
  resume:
    'Mathéo Bringia court en karting de location (rental) : au FRKC, le championnat de France des karts de location qui qualifie pour le mondial, et au CRKI, le challenge indoor de l’Est.',
  // la bio de la page « Le pilote » : un paragraphe par ligne
  bio: [
    'En karting de location, tout le monde roule sur le même matériel : les karts sont fournis par la piste et tirés au sort. Ce qui fait la différence, c’est le pilote. Sa trajectoire, son freinage, sa tête froide dans le trafic.',
    'Mathéo Bringia a été sacré champion Junior du CRKI en 2025, sans jamais sortir du top 5 de la saison. Il a enchaîné avec une deuxième place au championnat 90 kg de la saison suivante.',
    'Au FRKC, il progresse course après course : 39e sur 55 à l’Outdoor 2025, 19e sur 100 et meilleur Junior français à l’Indoor 2026, puis 25e sur 100 à l’Outdoor 2026, premier pilote non qualifié pour la finale.',
    'Il fait partie de l’académie de Driver Performance Lab, qui accompagne les pilotes sur la technique, les données et la préparation. Son parrain : Kevin Petit.',
    'Prochain rendez-vous : le FRKC Indoor 2027, du 5 au 7 février, au Metz Kart Indoor. Il est inscrit.',
  ],
  // les chiffres de l'accueil (tableau de bord) : valeur, unité, ce que c'est, d'où ça vient
  chiffres: [
    { valeur: '1er', legende: 'Champion CRKI Junior', detail: 'Saison 1, 2025, sur 28 pilotes' },
    { valeur: 'P2', legende: 'Meilleure manche au FRKC', detail: 'Manche 4, FRKC Indoor 2026' },
    { valeur: '19e', unite: '/100', legende: 'FRKC Indoor 2026', detail: 'Meilleur Junior français' },
    { valeur: '25e', unite: '/100', legende: 'FRKC Outdoor 2026', detail: 'À une place de la finale' },
  ],
  equipement: [
    { quoi: 'Casque', marque: 'Frevy Designs', detail: 'Orange et noir, peint par l’atelier belge Frevy Designs, caméra embarquée sur le dessus.' },
    { quoi: 'Combinaison', marque: 'Marina Racewear', detail: 'Orange, noire et blanche, sur mesure, avec les couleurs de ses partenaires.' },
    { quoi: 'Gants', marque: 'Marina Racewear', detail: 'Orange mouchetés de noir, « MB » sur le dessus de la main.' },
    { quoi: 'Kart', marque: 'Fourni par la piste', detail: 'Karting de location : le kart est celui du circuit, tiré au sort. « BRINGIA » s’affiche sur le ponton.' },
  ],
  reseaux: [
    { nom: 'Instagram', compte: '@matheo.bringia', lien: 'https://www.instagram.com/matheo.bringia/' },
  ],
};

// L'ACADÉMIE, le PARRAIN et le rôle d'AMBASSADEUR (page « Le pilote », d'après le plan du site de Mathéo).
// Confirmé par Mathéo le 23/10/2026 : académie Driver Performance Lab, parrain Kevin Petit, ambassadeur de Hot-Dog Style.
// « a_completer » : ce qui manque encore (s'affiche « à compléter » tant que c'est vide).
export const ACADEMIE = {
  titre: 'L’Académie',
  nom: 'Driver Performance Lab',
  lien: 'https://www.driverperformancelab.com',
  texte: 'Mathéo fait partie de l’académie de Driver Performance Lab, une structure de coaching de pilotes. On y travaille tout ce qui fait le chrono en dehors du kart : la technique de pilotage, l’analyse des données, la préparation physique et mentale, la nutrition.',
  points: ['Coaching de pilotes : karting, auto, simulateur', 'Technique et analyse de données', 'Préparation physique et mentale, nutrition'],
  exemple: false,
};
export const PARRAIN = {
  titre: 'Son parrain',
  nom: 'Kevin Petit',
  photo: 'medias/photos/kevin-petit-mur', legende: 'Devant le mur des partenaires de Kevin Petit',
  presentation: '', // À COMPLÉTER : une ou deux phrases pour présenter Kevin Petit (qui il est, ce qu'il apporte à Mathéo)
};
export const AMBASSADEUR = {
  titre: 'Ambassadeur',
  nom: 'Hot-Dog Style',
  lien: '', // À COMPLÉTER : le site de Hot-Dog Style (aucun site public trouvé le 23/10/2026)
  texte: 'Mathéo est l’ambassadeur de Hot-Dog Style, dont le nom est sur le dos de sa combinaison.',
  role: '', // À COMPLÉTER : ce que fait l'ambassadeur (événements, contenus, présence...)
  exemple: false,
};

// LE CONTACT (page Contact). Ne jamais écrire un numéro ou une adresse au hasard : laisser vide tant que Mathéo ne
// les a pas donnés. Vide = « à compléter » s'affiche, avec le badge « exemple ».
export const CONTACT = {
  telephone: '', // par exemple '06 00 00 00 00', À COMPLÉTER par Mathéo
  email: '',     // par exemple 'contact@...', À COMPLÉTER par Mathéo
};

export const PALMARES = [
  { annee: '2026', titre: 'FRKC Outdoor 2026', resultat: '25e sur 100', detail: '5e en demi-finale, premier pilote non qualifié pour la finale (TOP 24). Manches : 8e, 13e, 5e, 3e, 11e.', fort: true },
  { annee: '2026', titre: 'FRKC Indoor 2026', resultat: '19e sur 100', detail: 'Meilleur Junior français, 3e Français sur 26. Manches : 6e, 3e, 12e, 2e, 6e.', fort: true },
  { annee: '2025-2026', titre: 'CRKI Saison 2, 90 kg', resultat: 'Vice-champion', detail: '2e sur 47 pilotes classés. Manches : 7e, 3e, 4e, 2e, 3e, 2e, 4e.', fort: true },
  { annee: '2025', titre: 'CRKI Saison 1, Junior', resultat: 'Champion', detail: '1er sur 28 pilotes classés, jamais hors du top 5 : 2e, 3e, 3e, 2e, 5e, 2e.', fort: true },
  { annee: '2025', titre: 'FRKC Outdoor 2025', resultat: '39e sur 55', detail: 'Catégorie Junior, 8e Junior sur 13. Demi-finale : 12e.' },
];

/** Les résultats de manche de l'Outdoor 2026, pour le tour de piste de l'accueil. */
export const MANCHES_OUTDOOR_2026 = [
  { id: 'H1', nom: 'Manche 1', pos: 8 },
  { id: 'H2', nom: 'Manche 2', pos: 13 },
  { id: 'H3', nom: 'Manche 3', pos: 5 },
  { id: 'H4', nom: 'Manche 4', pos: 3 },
  { id: 'H5', nom: 'Manche 5', pos: 11 },
  { id: 'DF', nom: 'Demi-finale', pos: 5 },
];
