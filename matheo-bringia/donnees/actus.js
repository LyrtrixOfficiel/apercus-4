// Mathéo Bringia : LES ACTUS. L'accueil (« Dernières actus »), la page Actus et chaque article lisent ce fichier.
//
// MODE D'EMPLOI
//   AJOUTER UNE ACTU
//     1. copier le bloc MODÈLE ci-dessous (entre les deux lignes de tirets), le coller EN HAUT de la liste ACTUS :
//        la liste se lit de la plus récente à la plus ancienne, l'accueil montre les 3 premières ;
//     2. remplir :
//          id         un nom court, sans espace ni accent, unique : il sert d'adresse (article.html?id=...)
//          date       'AAAA-MM-JJ' (exemple '2027-02-07'), ou 'AAAA-MM' ou 'AAAA' si le jour n'est pas connu
//          rubrique   'Résultat', 'Course', 'Coulisses', 'Partenaire'...
//          titre      le titre ; chapo : une ou deux phrases sous le titre
//          texte      l'article : un paragraphe par ligne, chaque ligne entre apostrophes et suivie d'une virgule
//          image      une photo, chemin sans l'extension, par exemple 'medias/photos/indoor-trophee'
//                     (le site prend la version légère '-480' pour les cartes, voir donnees/photos.js)
//          source     (facultatif) le lien qui prouve l'info (classement officiel...)
//          exemple    true si c'est un EXEMPLE de maquette (badge « exemple »)
//     3. lancer « node outils/generer.mjs » (version sans JavaScript). Avec JavaScript, tout se met à jour seul.
//   MASQUER UNE ACTU : ajouter  masque: true  dans son bloc.
//
//   ---------------- MODÈLE ----------------
//   {
//     id: 'mon-actu', date: '2027-02-07', rubrique: 'Résultat',
//     titre: 'Le titre', chapo: 'Une phrase qui résume.',
//     texte: [
//       'Premier paragraphe.',
//       'Deuxième paragraphe.',
//     ],
//     image: 'medias/photos/angerville-face',
//   },
//   ----------------------------------------
//
// SOURCES : classements officiels FRKC et CRKI publiés par Silverlane Events (voir RECHERCHE.md).

export const ACTUS = [
  {
    id: 'inscrit-frkc-indoor-2027', date: '2026-10', rubrique: 'Course',
    titre: 'Inscrit au FRKC Indoor 2027',
    chapo: 'Rendez-vous du 5 au 7 février 2027 au Metz Kart Indoor, à Augny. L’inscription est confirmée.',
    texte: [
      'Les inscriptions du FRKC Indoor 2027 ont ouvert le 16 octobre. Mathéo Bringia figure sur la liste officielle des inscrits, avec le statut confirmé.',
      'Le programme : vendredi, entraînements officiels ; samedi, entraînements et première manche ; dimanche, les manches 2 à 5, la demi-finale et la finale.',
      'La piste du Metz Kart Indoor s’étend sur trois niveaux, sur environ 700 mètres. À l’Indoor 2026, il y avait signé deux podiums de manche (3e et 2e) et terminé meilleur Junior français.',
    ],
    image: 'medias/photos/winter-cup-portrait',
    source: 'https://www.silverlane-events.com/frkcindoor',
  },
  {
    id: 'frkc-outdoor-2026', date: '2026-08-23', rubrique: 'Résultat',
    titre: '25e sur 100 à Angerville, à une place de la finale',
    chapo: 'Au FRKC Outdoor 2026, il signe la 5e place de sa demi-finale et un podium en manche 4.',
    texte: [
      'Cent pilotes au départ du FRKC Outdoor 2026, sur le Circuit International Anthoine Hubert d’Angerville. Cinq manches de 10 minutes pour tout le monde, puis une demi-finale pour les 50 meilleurs.',
      'Ses manches : 8e, 13e, 5e, puis un podium en manche 4 (3e), et 11e. En demi-finale, il termine 5e.',
      'Au classement général, il est 25e avec 318 points : le premier pilote non qualifié pour la finale, qui réunissait le TOP 24. Il manquait une place : c’est elle qu’il vise maintenant.',
    ],
    image: 'medias/photos/angerville-casque',
    source: 'https://www.silverlane-events.com/frkcoutdoor',
  },
  {
    id: 'soiree-partenaires-mai-2026', date: '2026-05-27', rubrique: 'Partenaires',
    titre: 'Une soirée pour ses partenaires',
    chapo: 'Le 27 mai 2026, Mathéo réunit ses partenaires en plein air, autour de ses trophées et de son casque.',
    texte: [
      'Une soirée « Mathéo Bringia » le 27 mai : les partenaires de la saison se retrouvent sous les tentes, au soleil couchant.',
      'Sur la table, les trophées et les médailles du CRKI, le casque orange et noir. À l’entrée, le kakémono MB présente les partenaires par rang : VIP, Premium et Prestige.',
      'C’est sa façon de remercier ceux qui roulent avec lui, et d’en accueillir de nouveaux.',
    ],
    image: 'medias/photos/soiree-mai-affiche',
  },
  {
    id: 'vice-champion-crki-90', date: '2026', rubrique: 'Résultat',
    titre: 'Vice-champion du CRKI en 90 kg',
    chapo: 'Deuxième sur 47 pilotes classés au championnat indoor de l’Est, saison 2025-2026.',
    texte: [
      'Après son titre Junior, il passe dans la catégorie 90 kg du CRKI, le Challenge Régional Kart Indoor de l’Est.',
      'Sur les sept manches : 7e, 3e, 4e, 2e, 3e, 2e et 4e. Il termine 2e du championnat, sur 47 pilotes classés.',
    ],
    image: 'medias/photos/soiree-hiver-trophees',
    source: 'https://www.silverlane-events.com/crki',
  },
  {
    id: 'frkc-indoor-2026', date: '2026', rubrique: 'Résultat',
    titre: 'Meilleur Junior français au FRKC Indoor 2026',
    chapo: '19e sur 100 au Metz Kart Indoor, avec deux podiums de manche.',
    texte: [
      'Au FRKC Indoor 2026, il termine 19e sur 100 pilotes, avec 343 points.',
      'Il est le meilleur Junior français de l’épreuve, et le 3e Français tous âges confondus : il monte sur la troisième marche du podium des Français, trophée « 3rd place France » en main. Ses manches : 6e, 3e, 12e, 2e et 6e ; 11e en demi-finale.',
    ],
    image: 'medias/photos/indoor-trophee',
    source: 'https://www.silverlane-events.com/frkcindoor',
  },
  {
    id: 'soiree-partenaires-janvier-2026', date: '2026-01', rubrique: 'Partenaires',
    titre: 'Le kart exposé, les partenaires réunis',
    chapo: 'En janvier 2026, une soirée dans une salle de karting : kart exposé, combinaison, kakémonos et buffet.',
    texte: [
      'Pour lancer la saison 2026, Mathéo invite ses partenaires dans une salle de karting. Le kart trône entre les kakémonos MB, la combinaison est exposée à côté.',
      'Trophées du CRKI sur la table, buffet, échanges : une soirée pour se rencontrer, et pour montrer ce que les partenaires rendent possible.',
    ],
    image: 'medias/photos/soiree-hiver-kart-mb',
  },
  {
    id: 'champion-crki-junior', date: '2025', rubrique: 'Résultat',
    titre: 'Champion CRKI Junior',
    chapo: 'Premier sur 28 pilotes, jamais hors du top 5 de la saison.',
    texte: [
      'Saison 1 du CRKI, catégorie Junior : 2e, 3e, 3e, 2e, 5e, puis 2e à la finale. Une régularité qui fait le titre, devant Maxime Bland et Esteban Perrez.',
    ],
    image: 'medias/photos/soiree-mai-table',
    source: 'https://www.silverlane-events.com/crki',
  },
];

// ---- outils (ne pas modifier) ----
const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
export const visibles = () => ACTUS.filter((a) => !a.masque);
export function dateActu(t) {
  const [a, m, j] = String(t || '').split('-').map(Number);
  if (!m) return String(a);
  if (!j) return `${MOIS[m - 1]} ${a}`;
  return `${j} ${MOIS[m - 1]} ${a}`;
}
