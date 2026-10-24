// Mathéo Bringia : LES PARTENAIRES. L'accueil, la page Partenaires et le bandeau en bas de chaque page lisent ce fichier.
//
// MODE D'EMPLOI
//   AJOUTER UN PARTENAIRE
//     1. copier un bloc { ... } de la liste PARTENAIRES, le coller à la place voulue (l'ordre de la liste est l'ordre
//        d'affichage, à l'intérieur de son rang) ;
//     2. remplir :
//          id       un nom court, sans espace ni accent, unique
//          nom      le nom tel qu'il s'écrit (le site l'écrit en texte : on ne reproduit pas les logos)
//          rang     'vip', 'premium', 'prestige' (les rangs du kakémono de Mathéo), 'academie' ou 'equipement'
//          texte    (facultatif) ce qu'il fait, en quelques mots
//          lien     son site, commençant par https:// ; vide ('') tant qu'on ne l'a pas : « site à compléter » s'affiche
//          exemple  true si ce n'est PAS confirmé (badge « exemple »)
//     3. lancer « node outils/generer.mjs » (version sans JavaScript). Avec JavaScript, tout se met à jour seul.
//   RETIRER UN PARTENAIRE : supprimer son bloc, ou ajouter  masque: true.
//
// SOURCE (23/10/2026) : le kakémono « MB » de la soirée des partenaires du 27 mai 2026 (photo du lot iCloud du pilote,
// repère n°00), lu nom par nom : rangs VIP, PREMIUM et PRESTIGE. Le logo « XP » de sa combinaison est celui de
// KEVIN PETIT (« KP »), son parrain. Les sites ne sont pas encore connus : à compléter.
// À CONFIRMER avec Mathéo : le kakémono de la soirée de janvier 2026 (photo n°15) citait aussi Promocash Barr, Hop’la
// Guêpe, TomSolaire, Atlas Home, Clôtures & Matériaux Center Sélestat, Ease et Au Potin : partenaires de la saison
// précédente, ou toujours là ? Ils ne sont pas affichés.

export const RANGS = [
  { id: 'vip', nom: 'VIP' },
  { id: 'premium', nom: 'Premium' },
  { id: 'prestige', nom: 'Prestige' },
  { id: 'academie', nom: 'Académie' },
  { id: 'equipement', nom: 'Équipement' },
];

export const PARTENAIRES = [
  { id: 'hot-dog-style', nom: 'Hot-Dog Style', rang: 'vip', texte: 'By Alex Le Gourmand. Mathéo en est l’ambassadeur.', lien: '' },
  { id: 'agence-alex-le-gourmand', nom: 'L’Agence Alex Le Gourmand', rang: 'vip', texte: '', lien: '' },
  { id: 'kevin-petit', nom: 'KP, Kevin Petit', rang: 'vip', texte: 'Son parrain. Le « KP » de la combinaison.', lien: '' },
  { id: 'alsace-energies-granules', nom: 'Alsace Énergies et Granulés', rang: 'vip', texte: '', lien: '' },
  { id: 'smile', nom: 'Smile', rang: 'vip', texte: 'Agence experte en communication.', lien: '' },
  { id: 'eupl', nom: 'EUPL', rang: 'vip', texte: 'Europe Utilitaire Poids Lourds.', lien: '' },
  { id: 'evolution-graphique', nom: 'Évolution Graphique', rang: 'vip', texte: '', lien: '' },
  { id: 'cigo-flams', nom: 'Cigo Flam’s', rang: 'premium', texte: '', lien: '' },
  { id: 'ls-teleprospection', nom: 'LS Téléprospection', rang: 'premium', texte: 'Téléprospection.', lien: '' },
  { id: 'laurent-beck', nom: 'Laurent Beck', rang: 'prestige', texte: 'Prestations viticoles et arboricoles.', lien: '' },
  { id: 'opticus', nom: 'Opticus', rang: 'prestige', texte: '', lien: '' },
  { id: 'kaisen', nom: 'Kaisen', rang: 'prestige', texte: 'Architecture d’intérieur.', lien: '' },
  { id: 'autoeasy', nom: 'AutoEasy', rang: 'prestige', texte: 'Achetez, vendez, profitez.', lien: '' },
  { id: 'philippe-haas-axa', nom: 'Philippe Haas, AXA', rang: 'prestige', texte: 'Agent général d’assurance exclusif AXA.', lien: '' },
  { id: 'driver-performance-lab', nom: 'Driver Performance Lab', rang: 'academie', texte: 'Son académie : coaching de pilotes, technique, données, préparation.', lien: 'https://www.driverperformancelab.com' },
  { id: 'marina-racewear', nom: 'Marina Racewear', rang: 'equipement', texte: 'Sa combinaison et ses gants (fabricant espagnol, sur mesure).', lien: 'https://www.marinaracewear.com', exemple: true },
  { id: 'frevy-designs', nom: 'Frevy Designs', rang: 'equipement', texte: 'La peinture de son casque (atelier belge).', lien: 'https://frevydesigns.com', exemple: true },
];

/** Ce que Mathéo peut offrir à un partenaire (la partie « Devenir partenaire »). */
export const EMPLACEMENTS = [
  { id: 'combinaison', titre: 'La combinaison', texte: 'Poitrine, épaules, manches, dos, jambes : votre nom sur chaque photo, chaque podium, chaque vidéo.', repere: 'Le plus visible' },
  { id: 'casque', titre: 'Le casque', texte: 'Le bandeau et les flancs du casque : en gros plan dans toutes les vidéos embarquées.', repere: 'Gros plans' },
  { id: 'soirees', titre: 'Les soirées partenaires', texte: 'Mathéo réunit ses partenaires : en janvier 2026 dans une salle de karting, le 27 mai 2026 en plein air. Kart exposé, trophées, rencontres.', repere: 'Deux en 2026' },
  { id: 'kakemono', titre: 'Le kakémono MB', texte: 'Votre nom sur le kakémono qui l’accompagne aux soirées et aux événements, par rang : VIP, Premium, Prestige.', repere: 'Par rang' },
  { id: 'reseaux', titre: 'Les réseaux et ce site', texte: 'Instagram @matheo.bringia, la page Partenaires avec votre lien, le bandeau en bas de chaque page.', repere: 'Toute l’année' },
  { id: 'kart', titre: 'Le kart', texte: 'Un autocollant sur le ponton ou le nez, quand le règlement de la piste l’autorise (les karts de location sont ceux du circuit).', repere: 'Selon la piste' },
];

export const visibles = () => PARTENAIRES.filter((p) => !p.masque);
export const duRang = (r) => visibles().filter((p) => p.rang === r);
export const nomRang = (r) => (RANGS.find((x) => x.id === r) || { nom: r }).nom;
