// Kazura : LA liste des réalisations. C'est le seul endroit à modifier pour ajouter, masquer ou mettre en avant un site.
//
// Pour AJOUTER un site :
//   1. mettre ses captures dans realisations/img/ :
//        <id>-ordi-0.webp      la page d'accueil sur ordinateur, 1440 x 900
//        <id>-ordi-0-800.webp  la même en 800 px de large (téléphone, grille)
//        <id>-tel-0.webp       (facultatif) la page d'accueil sur téléphone, 600 x 1298
//        <id>-ordi-1.webp, <id>-ordi-2.webp (facultatif) deux autres écrans du site, listés dans « ecrans » :
//                              le panneau 3D les fait défiler
//   2. copier un bloc ci-dessous, le coller à la place voulue (l'ordre de la liste est l'ordre d'affichage), le remplir ;
//   3. lancer : node realisations/generer.mjs
//      Il écrit la version SANS JavaScript des pages et signale une capture manquante. Avec JavaScript, l'accueil,
//      la page « Toutes les réalisations » et la 3D se mettent à jour d'eux-mêmes.
//   La place du bloc dans la liste est la place du site, partout (accueil, page des réalisations, 3D).
//   Essai sans rien toucher ici : node page-outils/essai-sites18.mjs 8 ordi (des copies factices, en mémoire).
//
// Les réglages :
//   selection: true   le site apparaît dans la sélection de l'accueil. L'accueil en montre 6 AU PLUS (l'anneau 3D en
//                     tient 6) : au-delà, seuls les 6 PREMIERS de la liste marqués selection: true y sont. La page
//                     « Toutes les réalisations » montre TOUS les sites non masqués (4 à 10, et plus).
//   masque: true      le site n'apparaît NULLE PART (en attente d'un accord, site retiré pour l'instant…)
//   court             (v17) le métier en quelques mots : il tient sur une ligne sous la carte du téléphone
//   couleur           la couleur dominante du site : elle teinte la salle 3D quand son panneau est de face

export const SITES = [
  {
    id: 'shiatsu-jiyu',
    nom: 'Shiatsu Jiyū',
    adresse: 'https://shiatsu-jiyu.fr',
    metier: 'Praticienne de shiatsu, dans le Haut-Rhin',
    court: 'Praticienne de shiatsu, Haut-Rhin', // v17 : le métier en une ligne, sous la carte du téléphone
    phrase: 'La séance expliquée simplement, ses tarifs, les avis de ses clients et la prise de rendez-vous.',
    etiquettes: ['bien-être', 'tarifs', 'rendez-vous'],
    captures: { ordi: 'shiatsu-jiyu-ordi-0.webp', petit: 'shiatsu-jiyu-ordi-0-800.webp', tel: 'shiatsu-jiyu-tel-0.webp' , ecrans: ['shiatsu-jiyu-ordi-1.webp', 'shiatsu-jiyu-ordi-2.webp'] },
    couleur: '#f2a65a',
    selection: true,
    masque: false, // accord de la cliente en attente : passer à true pour la retirer partout
  },
  {
    id: 'estelle-formation',
    nom: 'Estelle Formation IA',
    adresse: 'https://estelle-formation.fr',
    metier: 'Cours d’intelligence artificielle en visio, pour les débutants',
    court: 'Cours d’IA en visio, pour débutants', // v17 : le métier en une ligne, sous la carte du téléphone
    phrase: 'Un site joyeux qu’on essaie avant de réserver : on choisit une question et on voit l’IA répondre.',
    etiquettes: ['formation', 'démonstration', 'visio'],
    captures: { ordi: 'estelle-formation-ordi-0.webp', petit: 'estelle-formation-ordi-0-800.webp', tel: 'estelle-formation-tel-0.webp' , ecrans: ['estelle-formation-ordi-1.webp', 'estelle-formation-ordi-2.webp'] },
    couleur: '#a879ff',
    selection: true,
    masque: false,
  },
  {
    id: 'alyriaz',
    nom: 'Alyriaz',
    adresse: 'https://alyriaz.com',
    metier: 'Un média qui explique l’intelligence artificielle',
    court: 'Un média qui explique l’IA', // v17 : le métier en une ligne, sous la carte du téléphone
    phrase: 'Des articles illustrés, une bibliothèque où chercher par sujet, le bilan de chaque semaine.',
    etiquettes: ['média', 'bibliothèque', 'articles'],
    captures: { ordi: 'alyriaz-ordi-0.webp', petit: 'alyriaz-ordi-0-800.webp', tel: 'alyriaz-tel-0.webp' , ecrans: ['alyriaz-ordi-1.webp', 'alyriaz-ordi-2.webp'] },
    couleur: '#6d5cff',
    selection: true,
    masque: false,
  },
  {
    id: 'lyrtrix',
    nom: 'LYRTRIX',
    adresse: 'https://lyrtrix.com',
    metier: 'Un univers musical',
    court: 'Un univers musical', // v17 : le métier en une ligne, sous la carte du téléphone
    phrase: 'La page d’un single, comme une pochette de disque : l’écoute sur les plateformes et la bande-annonce.',
    etiquettes: ['musique', 'single', 'bande-annonce'],
    captures: { ordi: 'lyrtrix-ordi-0.webp', petit: 'lyrtrix-ordi-0-800.webp', tel: 'lyrtrix-tel-0.webp' , ecrans: ['lyrtrix-ordi-1.webp', 'lyrtrix-ordi-2.webp'] },
    couleur: '#d9d6cf',
    selection: true,
    masque: false,
  },
  {
    id: 'ds-therapie',
    nom: 'DS Thérapie',
    adresse: 'https://ds-therapie.netlify.app',
    metier: 'Thérapeute, en visio et en cabinet',
    court: 'Thérapeute, en visio et en cabinet', // v17 : le métier en une ligne, sous la carte du téléphone
    phrase: 'Un accompagnement présenté avec douceur, les deux façons de consulter et la prise de rendez-vous.',
    etiquettes: ['thérapie', 'visio', 'rendez-vous'],
    captures: { ordi: 'ds-therapie-ordi-0.webp', petit: 'ds-therapie-ordi-0-800.webp', tel: 'ds-therapie-tel-0.webp' , ecrans: ['ds-therapie-ordi-1.webp', 'ds-therapie-ordi-2.webp'] },
    couleur: '#7fb5a8',
    selection: false,
    masque: true, // retiré par Mathéo le 19/10, pour l'instant
  },
  {
    id: 'ecrin-des-possibles',
    nom: 'L’écrin des possibles',
    adresse: 'https://lecrindespossibles.fr',
    metier: 'Accompagnement',
    court: 'Accompagnement', // v17 : le métier en une ligne, sous la carte du téléphone
    phrase: 'Un site chaleureux pour présenter un accompagnement et donner envie de faire le premier pas.',
    etiquettes: ['accompagnement', 'bien-être'],
    captures: { ordi: 'ecrin-des-possibles-ordi-0.webp', petit: 'ecrin-des-possibles-ordi-0-800.webp', tel: 'ecrin-des-possibles-tel-0.webp' , ecrans: ['ecrin-des-possibles-ordi-1.webp', 'ecrin-des-possibles-ordi-2.webp'] },
    couleur: '#c9a27a',
    selection: false,
    masque: true, // retiré par Mathéo le 19/10
  },
];

/** Les sites montrés (masque: false), dans l'ordre de la liste. */
export const visibles = () => SITES.filter((s) => !s.masque);
/** v18 : l'accueil en montre 6 au plus (l'anneau 3D en tient 6) : les 6 premiers sites marqués selection: true. */
export const ACCUEIL_MAX = 6;
/** La sélection de l'accueil (selection: true, masque: false), 6 au plus, dans l'ordre de la liste. */
export const selection = () => visibles().filter((s) => s.selection).slice(0, ACCUEIL_MAX);
/** Le domaine affiché (« shiatsu-jiyu.fr »). */
export const domaine = (s) => s.adresse.replace(/^https?:\/\//, '').replace(/\/$/, '');
