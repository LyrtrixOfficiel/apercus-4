// Les données de la maquette Porte Lune. Chaque fait vient de SOURCES.md ; ce qui est inconnu reste en pointillés dans la page.
// Aucun téléphone n'est affiché : le seul numéro connu est celui de l'association, classé « probable ».
window.CONTENU = {
  faits: {
    nom: 'Porte Lune',
    // Sans numéro : la mairie donne le 21 pour l'association, l'adresse de la boutique n'est écrite nulle part (vérification du 13/11).
    adresse: 'Rue Armand Caduc, La Réole',
    // Seule la boutique est attestée (actu.fr). Le bar associatif et le coin jeux de table restent des idées à confirmer.
    lieux: ['Boutique de créateurs'],
    idees: ['Un bar associatif ?', 'Un coin jeux de table ?'],
    ouverture: 'Sigfried Lebaillif et l’association La Guilde France ont ouvert Porte Lune, boutique mêlant artisanat local et initiatives solidaires (actu.fr).',
    boutique: 'Costumes, accessoires en cuir à tannage végétal, bijouterie, mailles et écailles métalliques. Création artisanale et sur mesure (annuaire de la mairie de La Réole).',
    association: 'Festivals à thème historique, fantastique ou culturel, chasses au trésor, parcours immersifs, promotion de l’artisanat (JeVeuxAider).',
    editions: [
      ['Mai 2025', 'Première édition du Mysteria Festival, du 16 au 18 mai. Elfes, Vikings, une centaine d’exposants, marché nocturne et spectacle de feu. Gratuit.'],
      ['9 et 10 mai 2026', 'Mille et Une Nuits. Quai de Garonne, Jardin du Temple sur l’esplanade Charles de Gaulle, prieuré des Bénédictins. Entrée libre.'],
    ],
  },
  liens: { facebook: 'https://www.facebook.com/LaGuildeFrance', instagram: 'https://www.instagram.com/mysteria_fest/' },

  // Ce que dit la tringle quand on touche une pièce (les mots de la fiche de la mairie, rien de plus).
  pieces: {
    costumes: 'Costumes : création artisanale, et sur mesure.',
    cuir: 'Accessoires en cuir à tannage végétal.',
    bijoux: 'Bijouterie. Les noms des créateurs s’écriront ici.',
    mailles: 'Mailles et écailles métalliques : essayez l’écu, juste en dessous.',
    accessoires: 'Accessoires. Vos pièces du moment s’écriront ici.',
  },

  // Le jeu : une soirée en quatre jets de dé à vingt faces. Histoire inventée, annoncée comme telle dans la page.
  epreuves: [
    { nom: 'Pousser la porte', seuil: 4, ok: 'La porte cède, le heurtoir tinte encore. Vous êtes dedans.', ko: 'Elle résiste. Quelqu’un vous ouvre de l’intérieur, en riant.' },
    { nom: 'Dénicher la pièce qui vous attendait', seuil: 9, ok: 'Elle était là, au bout de la tringle. Vous ne repartirez pas sans elle.', ko: 'Trop de belles choses, impossible de choisir. Il faudra revenir.' },
    { nom: 'Trinquer avec la tablée', seuil: 7, ok: 'Les godets se lèvent d’un seul geste. Vous voilà adopté.', ko: 'Vous trinquez dans le vide. La tablée rit et recommence avec vous.' },
    { nom: 'Gagner la partie', seuil: 13, ok: 'Dernier tour, dernier jet : toute la table vous acclame.', ko: 'Perdu, de peu. On remet ça à la prochaine lune.' },
  ],
  verdicts: [
    'Les dés n’ont pas voulu. La porte, elle, reste ouverte.',
    'Soirée mouvementée. Vous reviendrez prendre votre revanche.',
    'Belle soirée. La Guilde vous a à l’œil.',
    'Très belle soirée. On vous garde une chaise.',
    'Soirée parfaite. La Guilde vous garde une place à sa table.',
  ],

  // Le bouton Couleur de la page Bonjour change seulement la porte et la nuit.
  palettes: {
    gueules: { theme: '#0f2f2b' },
    azur: { theme: '#241a30' },
    pourpre: { theme: '#1b2a2f' },
  },
};
