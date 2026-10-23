// Kazura : LA liste des expériences du hub (accueil, bandeau « Expériences », et page experiences.html).
// v17 : sur l'accueil, la PREMIÈRE de la liste est en vedette (son affiche, « Essayer ») ; les autres sont de simples liens.
//
// Chaque expérience vit dans son dossier, experiences/<id>/, avec sa propre page index.html.
// Pour AJOUTER une expérience :
//   1. son dossier experiences/<id>/ avec index.html (la page de l'expérience) ;
//   2. si possible son affiche : experiences/<id>/affiche.webp (1600 x 1000, moins de 200 Ko, nette).
//      v15 : plus aucune vidéo sur l'accueil ni sur experiences.html, seulement l'affiche fixe ;
//   3. un bloc ci-dessous, puis (pour la version sans JavaScript) : node realisations/generer.mjs
//      Le script vérifie aussi les fichiers et signale un réglage qui ne correspond pas au dossier.
//
// Les réglages :
//   pret: true      l'expérience est montrée (sa page index.html existe). false : elle reste cachée.
//   affiche: true   le dossier contient affiche.webp (sinon : l'image de repli, ou une affiche dessinée en CSS)
//   repli           une image de secours tant que l'affiche n'existe pas (chemin depuis la racine du site), ou null
//   couleur         la teinte de l'affiche (lueur, coins)
//   action          v16 : ce qu'on y fait, en une phrase à l'impératif (le titre de l'affiche : « Visitez un domaine en 3D »)
//   gestes          v16 : comment on s'y prend, en clair (« Faites défiler, réglez l'heure du doigt »)
//   duree           v16 : combien de temps ça prend (« 2 min environ »)
//   accroche        v17 : une phrase courte sous le titre, dans le bandeau de l'accueil (seulement la 1re expérience)
//   monde           v19 : ce qui bouge dans son portail, sur la page des expériences (experiences/galerie/) :
//                   'domaine' (les vignes au couchant), 'casser' (la page de 2007 qui se fissure), 'infini' (un site
//                   dans un site, sans fin), ou rien : son affiche, animée doucement (convient à toute nouvelle expérience).
//
// v19, page des expériences : une expérience pas encore prête (pret: false) mais qui a déjà son affiche (affiche: true)
// y apparaît comme un portail « Bientôt », sans lien. Sans affiche, elle reste cachée. L'accueil ne montre que les prêtes.

export const EXPERIENCES = [
  {
    id: 'domaine',
    titre: 'Le domaine Kazura',
    genre: 'Récit en 3D',
    action: 'Visitez un domaine viticole en 3D',
    accroche: 'Ce n’est pas une vidéo : vous vous promenez vous-même, des vignes au château.',
    phrase: 'Le site imaginaire d’un domaine viticole, au pied du Haut-Koenigsbourg. En faisant défiler, la caméra vous emmène des vignes au château, jusqu’à la nuit.',
    gestes: 'Faites défiler, réglez l’heure, tournez la bouteille.',
    duree: '3 min environ',
    couleur: '#e9c987',
    monde: 'domaine',
    pret: true,
    affiche: true,
    repli: 'img/domaine-or.webp',
  },
  {
    id: 'casser',
    titre: 'Cassez votre vieux site',
    genre: 'Jeu',
    action: 'Cassez un vieux site, regardez le nouveau éclore',
    phrase: 'Une page web de 2007, grise et démodée. Cassez-la à coups de graines et de liane : le sceau Kazura s’ouvre alors sur un site neuf, prise de rendez-vous comprise.',
    gestes: 'Touchez pour lancer des graines, glissez d’un coup pour trancher.',
    duree: '2 min environ',
    couleur: '#6ee7b7',
    monde: 'casser',
    pret: true,
    affiche: true,
    repli: null,
  },
  // v19 : le site infini (agent Infini, experiences/infini/). v20 : retiré (Mathéo : pas fluide, 3D pas au niveau du domaine) ; caché partout tant que pret et affiche valent false
  {
    id: 'infini',
    titre: 'Le site infini',
    genre: 'Zoom sans fin',
    action: 'Plongez dans un site qui s’ouvre sur un autre, sans fin',
    accroche: 'Une vitrine, une pupille, une goutte de rosée : chaque porte ouvre le site d’un autre métier.',
    phrase: 'Un site, dans un site, dans un site… On plonge dans un écran, et chaque image cache une porte vers le site d’un autre métier : boulangerie, tatouage, avocate, fleuriste, escalade, garage, école de musique, vigneron. Sans couture, sans fin.',
    gestes: 'Faites défiler, glissez ou pincez pour plonger ; remontez quand vous voulez.',
    duree: '1 min environ, sans fin',
    couleur: '#c9b8ff',
    monde: 'infini',
    pret: false,
    affiche: false,
    repli: null,
  },
];

/** Les expériences montrées, dans l'ordre de la liste. */
export const pretes = () => EXPERIENCES.filter((x) => x.pret);
/** Le dossier d'une expérience, depuis la racine du site. */
export const dossier = (x) => `experiences/${x.id}/`;
