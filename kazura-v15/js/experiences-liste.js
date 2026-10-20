// Kazura : LA liste des expériences du hub (accueil, partie « Essayez », et page experiences.html).
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

export const EXPERIENCES = [
  {
    id: 'domaine',
    titre: 'Le domaine Kazura',
    genre: 'Récit en 3D',
    phrase: 'Un domaine viticole imaginaire au pied du Haut-Koenigsbourg. La caméra vous fait visiter le lieu, et l’heure se règle à la main.',
    couleur: '#e9c987',
    pret: true,
    affiche: true,
    repli: 'img/domaine-or.webp',
  },
  {
    id: 'casser',
    titre: 'Cassez votre vieux site',
    genre: 'Jeu',
    phrase: 'Lancez des graines sur une page web de 2007, regardez-la tomber en morceaux, puis la liane Kazura y fait éclore un site neuf.',
    couleur: '#6ee7b7',
    pret: true,
    affiche: true,
    repli: null,
  },
];

/** Les expériences montrées, dans l'ordre de la liste. */
export const pretes = () => EXPERIENCES.filter((x) => x.pret);
/** Le dossier d'une expérience, depuis la racine du site. */
export const dossier = (x) => `experiences/${x.id}/`;
