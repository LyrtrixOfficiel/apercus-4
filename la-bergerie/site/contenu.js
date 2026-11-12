// Tous les faits de la maquette sont ici : pour une autre pizzeria, on change ce fichier et les photos.
// Chaque fait vient de SOURCES.md. Ce qui est inconnu reste en pointillés dans la page.
window.CONTENU = {
  nom: 'La Bergerie',
  telephone: '06 75 78 46 00',
  telLien: '+33675784600',
  carteLien: 'https://www.google.com/maps/search/?api=1&query=La+Bergerie+33540+Saint-Laurent-du-Bois',
  ville: 'Saint-Laurent-du-Bois',
  note: '5,0 sur 5',
  avis: '73 avis',
  supplement: 'Supplément ingrédient : 1,00 €.',

  // La carte publiée par le commerce (image « Carte pizza » de son site).
  // n : nom, p : prix affiché, e : prix en euros (pour le total du bloc de commande), b : base,
  // i : ingrédients tels qu'ils sont écrits sur sa carte, g : les mêmes, en clés pour le dessin et le jeu.
  pizzas: [
    { n: 'Jambono', p: '10,50 €', e: 10.5, b: 'tomate', i: 'Tomate, jambon blanc, mozzarella, olives.', g: ['jambon-blanc', 'mozzarella', 'olives'] },
    { n: 'Italienne', p: '13,50 €', e: 13.5, b: 'creme', i: 'Crème, coppa, tomates confites, mozzarella, olives, roquette, burrata.', g: ['coppa', 'tomates-confites', 'mozzarella', 'olives', 'roquette', 'burrata'] },
    { n: 'Chèvre miel', p: '11,50 €', e: 11.5, b: 'creme', i: 'Crème, chèvre, mozzarella, miel, noix, roquette.', g: ['chevre', 'mozzarella', 'miel', 'noix', 'roquette'] },
    { n: 'Forestière', p: '12,00 €', e: 12, b: 'creme', i: 'Crème, échalotes, coppa, champignons, mozzarella, emmental, thym.', g: ['echalotes', 'coppa', 'champignons', 'mozzarella', 'emmental', 'thym'] },
    { n: '5 fromages', p: '12,00 €', e: 12, b: 'creme', i: 'Crème, mozzarella, bleu d’Auvergne, cheddar, chèvre, emmental.', g: ['mozzarella', 'bleu', 'cheddar', 'chevre', 'emmental'] },
    { n: 'Bergerie', p: '13,00 €', e: 13, b: 'tomate', i: 'Tomate, échalote, piquillos, lardons, chèvre, olives, jambon de pays, magret séché.', g: ['echalotes', 'piquillos', 'lardons', 'chevre', 'olives', 'jambon-pays', 'magret'] },
    { n: 'Sud Ouest', p: '13,50 €', e: 13.5, b: 'tomate', i: 'Tomate, champignons, gésiers, mozzarella, magret séché, œuf.', g: ['champignons', 'gesiers', 'mozzarella', 'magret', 'oeuf'] },
    { n: 'Fermière', p: '11,50 €', e: 11.5, b: 'creme', i: 'Crème, jambon blanc, mozzarella, chèvre, roquette, jambon de pays.', g: ['jambon-blanc', 'mozzarella', 'chevre', 'roquette', 'jambon-pays'] },
    { n: 'Merguez', p: '12,50 €', e: 12.5, b: 'tomate', i: 'Tomate, échalote, piquillos, merguez, mozzarella, olives.', g: ['echalotes', 'piquillos', 'merguez', 'mozzarella', 'olives'] },
    { n: 'Charcuterie', p: '12,50 €', e: 12.5, b: 'tomate', i: 'Tomate, lardons, chorizo, mozzarella, olives, piment d’Espelette, jambon de pays.', g: ['lardons', 'chorizo', 'mozzarella', 'olives', 'espelette', 'jambon-pays'] },
  ],
  // La pizza du mois relevée sur son site (image « Pizza du mois », non datée).
  mois: { n: 'La Raclette', court: 'Raclette', p: '12,50 €', e: 12.5, b: 'creme', i: 'Crème, lardons, pomme de terre, fromage à raclette, mozzarella, oignons frits.', g: ['lardons', 'pomme-de-terre', 'raclette', 'mozzarella', 'oignons-frits'] },

  // Tous les ingrédients de sa carte, rangés comme dans les bacs. c : couleur du papier découpé, f : forme, q : nombre de morceaux sur une pizza entière.
  bacs: [
    { t: 'Les fromages', k: ['mozzarella', 'chevre', 'emmental', 'bleu', 'cheddar', 'burrata', 'raclette'] },
    { t: 'La charcuterie', k: ['jambon-blanc', 'jambon-pays', 'coppa', 'lardons', 'chorizo', 'merguez', 'magret', 'gesiers'] },
    { t: 'Le jardin', k: ['olives', 'champignons', 'roquette', 'echalotes', 'piquillos', 'tomates-confites', 'thym', 'pomme-de-terre', 'oignons-frits'] },
    { t: 'Pour finir', k: ['miel', 'noix', 'oeuf', 'espelette'] },
  ],
  ingredients: {
    'mozzarella': { n: 'Mozzarella', c: '#fffaf0', f: 'flaque', q: 9 },
    'chevre': { n: 'Chèvre', c: '#fff1cf', f: 'chevre', q: 5 },
    'emmental': { n: 'Emmental', c: '#f6d35f', f: 'rape', q: 12 },
    'bleu': { n: 'Bleu d’Auvergne', c: '#dfe6e4', f: 'miette', q: 9 },
    'cheddar': { n: 'Cheddar', c: '#f29a2e', f: 'cube', q: 10 },
    'burrata': { n: 'Burrata', c: '#ffffff', f: 'gros', q: 1 },
    'raclette': { n: 'Fromage à raclette', c: '#f6cf6a', f: 'flaque', q: 7 },
    'jambon-blanc': { n: 'Jambon blanc', c: '#f4a9a3', f: 'lamelle', q: 8 },
    'jambon-pays': { n: 'Jambon de pays', c: '#b23a3c', f: 'voile', q: 6 },
    'coppa': { n: 'Coppa', c: '#a8322c', f: 'rondelle', q: 7 },
    'lardons': { n: 'Lardons', c: '#d07a66', f: 'baton', q: 16 },
    'chorizo': { n: 'Chorizo', c: '#cf4a1f', f: 'rondelle', q: 9 },
    'merguez': { n: 'Merguez', c: '#8f3216', f: 'rondelle', q: 9 },
    'magret': { n: 'Magret séché', c: '#7b2028', f: 'tranche', q: 6 },
    'gesiers': { n: 'Gésiers', c: '#7a4a32', f: 'galet', q: 8 },
    'olives': { n: 'Olives', c: '#2a211d', f: 'anneau', q: 8 },
    'champignons': { n: 'Champignons', c: '#ead9bf', f: 'champi', q: 9 },
    'roquette': { n: 'Roquette', c: '#3f8f4d', f: 'feuille', q: 12 },
    'echalotes': { n: 'Échalotes', c: '#c79bc4', f: 'arc', q: 10 },
    'piquillos': { n: 'Piquillos', c: '#d8321c', f: 'laniere', q: 7 },
    'tomates-confites': { n: 'Tomates confites', c: '#b8281a', f: 'demi', q: 7 },
    'thym': { n: 'Thym', c: '#5c7d3a', f: 'brin', q: 12 },
    'pomme-de-terre': { n: 'Pomme de terre', c: '#f3de9c', f: 'pdt', q: 8 },
    'oignons-frits': { n: 'Oignons frits', c: '#b9772f', f: 'brin', q: 16 },
    'miel': { n: 'Miel', c: '#eea31b', f: 'filet', q: 7 },
    'noix': { n: 'Noix', c: '#9b6a3c', f: 'cerneau', q: 8 },
    'oeuf': { n: 'Œuf', c: '#ffffff', f: 'oeuf', q: 1 },
    'espelette': { n: 'Piment d’Espelette', c: '#d9521d', f: 'poudre', q: 7 },
  },

  // Jours : 0 = dimanche, comme Date.getDay(). Horaires relevés en ligne, à confirmer (SOURCES.md).
  jours: [
    { j: 'Lundi', a: 'Lun', d: 1, h: null }, { j: 'Mardi', a: 'Mar', d: 2, h: null }, { j: 'Mercredi', a: 'Mer', d: 3, h: null },
    { j: 'Jeudi', a: 'Jeu', d: 4, h: '18 h 30 à 21 h 30' }, { j: 'Vendredi', a: 'Ven', d: 5, h: '18 h 30 à 21 h 30' },
    { j: 'Samedi', a: 'Sam', d: 6, h: '18 h 30 à 21 h 30' }, { j: 'Dimanche', a: 'Dim', d: 0, h: '18 h 30 à 21 h 30' },
  ],
  ouverture: '18 h 30', fermetureMinutes: 21 * 60 + 30,

  // Un seul site, une seule mise en page : le bouton Couleur de la page Bonjour change seulement l'encre.
  palettes: {
    tomate: { vif: '#d5361b', vifFonce: '#a82410', second: '#1f6a41', theme: '#d2a56d' },
    basilic: { vif: '#1f6a41', vifFonce: '#134a2c', second: '#d5361b', theme: '#d2a56d' },
    braise: { vif: '#d9610f', vifFonce: '#a84505', second: '#5a2a16', theme: '#d2a56d' },
  },
};
