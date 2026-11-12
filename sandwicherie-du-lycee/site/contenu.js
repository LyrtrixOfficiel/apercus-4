// Tout ce qui change d'une sandwicherie à l'autre est ici (et dans les textes de index.html).
// Chaque fait vient de SOURCES.md. Ce qui est inconnu reste en pointillés : la carte, les formules, les prix, le téléphone.
window.CONTENU = {
  nom: 'La Sandwicherie du Lycée',
  adresse: '15 rue César Marcellak, 62160 Bully-les-Mines',
  // Aucun numéro : celui des annuaires est celui de l'ancien exploitant (voir SOURCES.md).
  telephone: '',
  carteLien: 'https://www.google.com/maps/search/?api=1&query=15+rue+C%C3%A9sar+Marcellak+62160+Bully-les-Mines',
  // Les casiers de la carte : le titre vient des annuaires (sandwichs chauds et froids, point chaud), les lignes restent vides.
  casiers: [
    { t: 'Sandwichs froids', lignes: 3, photo: 'froid.webp', alt: 'Un sandwich froid coupé en deux sur son papier', teinte: 'jaune' },
    { t: 'Sandwichs chauds', lignes: 3, photo: 'chaud.webp', alt: 'Un sandwich chaud dans son papier', teinte: 'rouge' },
    { t: 'Point chaud', lignes: 3, photo: 'pain.webp', alt: 'Des pains dorés qui sortent du four', teinte: 'vert' },
    { t: 'Formules', lignes: 2, photo: '', alt: '', teinte: 'orange', mot: 'Vos formules, vos prix : à écrire avec vous.' },
  ],
  // Horaires relevés dans les annuaires (PagesJaunes, Mappy), sans doute d'avant la reprise : à confirmer.
  // Jours : 1 = lundi, comme Date.getDay(). Créneaux en heures décimales.
  semaine: [
    { j: 'Lun', nom: 'Lundi', d: 1, c: [[8, 13.5], [15.5, 18]] },
    { j: 'Mar', nom: 'Mardi', d: 2, c: [[8, 13.5], [15.5, 18]] },
    { j: 'Mer', nom: 'Mercredi', d: 3, c: [[8, 13]] },
    { j: 'Jeu', nom: 'Jeudi', d: 4, c: [[8, 13.5], [15.5, 18]] },
    { j: 'Ven', nom: 'Vendredi', d: 5, c: [[8, 13.5], [15.5, 18]] },
  ],
  // Le bouton Couleur de la page Bonjour change la couleur du stylo.
  palettes: {
    bleu: { encre: '#1b45c7', fonce: '#12308f' },
    vert: { encre: '#0d7a55', fonce: '#07563b' },
    noir: { encre: '#23232d', fonce: '#101016' },
  },
  // Le mot d'excuse : on touche un trou, il change.
  mot: {
    retard: ['cinq minutes', 'dix bonnes minutes', 'toute la récré', 'un petit quart d’heure'],
    motif: ['la file avançait bien, mais pas assez', 'le sandwich était encore chaud', 'il fallait bien finir les miettes', 'la sonnerie a sonné trop tôt'],
  },
  // Le jeu : les appréciations du bulletin.
  bulletin: [
    [0, 'Peut mieux faire. Le sandwich, lui, est irréprochable.'],
    [6, 'Des efforts. On reprend à la prochaine sonnerie.'],
    [10, 'Bon trimestre : ça tient debout.'],
    [14, 'Très bien. Le plateau est fier de vous.'],
    [18, 'Félicitations du conseil de classe.'],
  ],
};
