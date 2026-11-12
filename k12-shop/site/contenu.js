// Tout ce qui change d'une épicerie à l'autre est ici. Chaque fait vient de SOURCES.md.
// Horaires, téléphone, carte, vrais rayons : inconnus, donc en pointillés sur la page.
// Aucun produit du tabac, de la vape, du CBD ni d'alcool : ni ici, ni sur la page.
window.CONTENU = {
  nom: 'K12 Shop',
  adresse: '2 rue Charles Kaddouz, 13012 Marseille',
  carteLien: 'https://www.google.com/maps/search/?api=1&query=2+rue+Charles+Kaddouz+13012+Marseille',

  // Ce qui manque dans une cuisine selon l'heure : des généralités, pas des horaires d'ouverture.
  heures: [
    [0, 5, 'les piles, l’eau fraîche, le dépannage de la nuit', 'piles'],
    [5, 9, 'le lait et le café du petit-déjeuner', 'café'],
    [9, 12, 'ce qu’on a oublié sur la liste de courses', 'riz'],
    [12, 14, 'de quoi manger sur le pouce', '#manger'],
    [14, 18, 'le goûter et une boisson fraîche', 'goûter'],
    [18, 21, 'le paquet de pâtes du dîner', 'pâtes'],
    [21, 24, 'le dessert qu’on n’avait pas prévu', 'dessert'],
  ],

  // Rayons d'exemple (formes génériques, sans marque) : la vraie liste s'écrit avec le commerçant.
  // paquets : type:couleur:couleur2:largeur:hauteur
  rayons: [
    { id: 'frais', nom: 'Le frais', article: 'au frais',
      mots: ['lait', 'beurre', 'yaourt', 'yaourts', 'oeuf', 'oeufs', 'fromage', 'creme', 'jambon', 'frais', 'margarine'],
      paquets: 'bouteille:#fff:#1735d1:30:96 bouteille:#fff:#1735d1:30:96 brique:#bfe8ff:#1735d1:40:84 pot:#fff:#ff4d9d:34:44 pot:#fff:#62e86f:34:44 boite:#ffd21e:#fff:58:36 oeufs:#d9c7a3:#bfa97f:74:30 brique:#fff:#ef3b24:38:80' },
    { id: 'epicerie', nom: 'Pâtes, riz, conserves', article: 'à l’épicerie',
      mots: ['pate', 'pates', 'riz', 'conserve', 'conserves', 'sauce', 'tomate', 'thon', 'huile', 'sel', 'poivre', 'farine', 'semoule', 'lentilles', 'epices', 'spaghetti', 'coquillettes', 'pois chiches', 'mais', 'moutarde', 'ketchup', 'mayonnaise', 'vinaigre', 'soupe'],
      paquets: 'sachet:#1735d1:#ffd21e:46:92 sachet:#ef3b24:#fff:46:92 boite:#ffd21e:#ef3b24:42:100 conserve:#ef3b24:#fff:36:50 conserve:#62e86f:#fff:36:50 conserve:#ffd21e:#1735d1:36:50 bouteille:#f2c14e:#ef3b24:28:104 pot:#ef3b24:#fff:38:62 conserve:#1735d1:#ffd21e:40:44' },
    { id: 'petitdej', nom: 'Petit-déjeuner', article: 'au petit-déjeuner',
      mots: ['cafe', 'the', 'tisane', 'cereales', 'confiture', 'sucre', 'miel', 'cacao', 'biscottes', 'petit dej', 'petit-dejeuner', 'dejeuner', 'pate a tartiner', 'infusion'],
      paquets: 'boite:#ff8b1f:#fff:60:108 boite:#1735d1:#ffd21e:56:100 pot:#7a3b12:#ffd21e:40:66 pot:#ef3b24:#fff:38:58 pot:#ffb400:#fff:36:54 sachet:#3b2a1a:#ffd21e:44:84 boite:#62e86f:#fff:48:62' },
    { id: 'gouter', nom: 'Pain et goûter', article: 'au goûter',
      mots: ['pain', 'pain de mie', 'biscuit', 'biscuits', 'gateau', 'gateaux', 'chocolat', 'bonbon', 'bonbons', 'chips', 'gouter', 'sucre', 'dessert', 'glace', 'glaces', 'brioche', 'compote', 'cacahuetes', 'madeleines', 'crepes'],
      paquets: 'pain:#e9b76a:#fff:70:56 pain:#d99a4a:#1735d1:70:56 sachet:#ef3b24:#ffd21e:50:74 sachet:#ffd21e:#1735d1:50:74 boite:#ff4d9d:#fff:58:44 boite:#ff8b1f:#fff:46:86' },
    { id: 'boissons', nom: 'Boissons fraîches', article: 'aux boissons fraîches',
      mots: ['eau', 'soda', 'sodas', 'jus', 'sirop', 'limonade', 'boisson', 'boissons', 'soif', 'the glace', 'eau gazeuse', 'eau fraiche', 'jus d orange', 'canette'],
      paquets: 'bouteille:#9fe3ff:#1735d1:32:118 bouteille:#9fe3ff:#1735d1:32:118 bouteille:#ef3b24:#fff:30:104 bouteille:#ff8b1f:#fff:30:104 bouteille:#62e86f:#fff:30:104 conserve:#ef3b24:#fff:26:50 conserve:#ffd21e:#1735d1:26:50 conserve:#1735d1:#fff:26:50 brique:#ff8b1f:#fff:40:86 brique:#62e86f:#ffd21e:40:86 bouteille:#ff4d9d:#fff:28:92' },
    { id: 'depannage', nom: 'Le dépannage', article: 'au dépannage',
      mots: ['pile', 'piles', 'ampoule', 'ampoules', 'chargeur', 'cable', 'scotch', 'bougie', 'bougies', 'sac poubelle', 'sacs poubelle', 'eponge', 'eponges', 'croquettes', 'litiere', 'depannage', 'ficelle', 'colle', 'stylo', 'enveloppe', 'aluminium', 'film'],
      paquets: 'piles:#fff:#ef3b24:44:72 piles:#fff:#1735d1:44:72 boite:#ffd21e:#06222a:40:60 boite:#fff:#1735d1:36:84 rouleau:#06222a:#ffd21e:48:64 sachet:#1735d1:#fff:56:96 boite:#62e86f:#06222a:44:50' },
    { id: 'hygiene', nom: 'Hygiène et entretien', article: 'à l’hygiène',
      mots: ['papier toilette', 'pq', 'mouchoir', 'mouchoirs', 'savon', 'dentifrice', 'shampoing', 'shampooing', 'lessive', 'liquide vaisselle', 'gel douche', 'brosse a dents', 'essuie-tout', 'sopalin', 'javel', 'coton', 'deodorant', 'hygiene'],
      paquets: 'rouleau:#bfe8ff:#fff:72:92 rouleau:#ffd0e4:#fff:72:60 bouteille:#62e86f:#fff:34:96 bouteille:#1735d1:#ffd21e:34:108 bouteille:#ff4d9d:#fff:32:88 boite:#fff:#ef3b24:46:38 bouteille:#ffd21e:#ef3b24:36:100' },
    { id: 'bebe', nom: 'Bébé', article: 'au rayon bébé',
      mots: ['couche', 'couches', 'lingettes', 'lait bebe', 'petit pot', 'petits pots', 'bebe', 'biberon', 'tetine'],
      paquets: 'sachet:#ffd0e4:#ff4d9d:76:100 sachet:#bfe8ff:#1735d1:76:100 boite:#fff:#ff4d9d:50:42 pot:#ffb400:#fff:32:40 pot:#62e86f:#fff:32:40 pot:#ff8b1f:#fff:32:40 conserve:#fff:#1735d1:44:70' },
  ],

  // Le bandeau qui défile entre deux rubriques (exemples génériques).
  bandeau: ['le lait', 'les piles', 'le pain', 'les pâtes', 'le café', 'l’eau fraîche', 'les œufs', 'le sucre', 'le dessert', 'les couches'],

  // Les mots à toucher sous la question.
  envies: ['du lait', 'des pâtes', 'des piles', 'du pain', 'du café', 'de l’eau fraîche', 'un dessert', 'du papier toilette', 'des couches'],

  // Le panneau à lettres amovibles, avant que le commerçant écrive sa carte.
  panneau: ['LA CARTE', '. . . . . . .', 'À COMPLÉTER', 'AVEC VOUS'],

  // Trois ambiances pour la page Bonjour (?palette=...).
  palettes: ['soleil', 'menthe', 'corail'],
};
