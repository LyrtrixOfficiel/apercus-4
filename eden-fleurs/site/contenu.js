// Les faits de la maquette sont ici : pour un autre fleuriste, on change ce fichier, les textes de index.html et les photos.
// Chaque fait vient de SOURCES.md. Ce qui est inconnu reste en pointillés.
window.CONTENU = {
  telephone: '03 65 67 85 30',
  telLien: '+33365678530',
  mail: 'edenfleurs68@gmail.com',
  facebook: 'https://www.facebook.com/edenfleurs68/',
  carte: 'https://www.google.com/maps/search/?api=1&query=Eden+Fleurs+2+route+du+Vin+68980+Beblenheim',
  // Horaires relevés sur Google Maps le 09/11/2026 (mêmes sur Pages Jaunes et Bottin). 0 = dimanche.
  horaires: {
    1: ['Lundi', 8.5, 19], 2: ['Mardi', 8.5, 19], 3: ['Mercredi', 8.5, 19], 4: ['Jeudi', 8.5, 19], 5: ['Vendredi', 8.5, 19],
    6: ['Samedi', 8.5, 18], 0: ['Dimanche', 8.5, 12],
  },
  // Les fleurs du jeu : des exemples, pas son catalogue.
  tiges: [
    ['rose', 'framboise', 'Rose', 'roses'], ['pivoine', 'blush', 'Pivoine', 'pivoines'], ['tulipe', 'beurre', 'Tulipe', 'tulipes'], ['anemone', 'blanc', 'Anémone', 'anémones'],
    ['dahlia', 'corail', 'Dahlia', 'dahlias'], ['marguerite', 'blanc', 'Marguerite', 'marguerites'], ['hortensia', 'bleu', 'Hortensia', 'hortensias'], ['eucalyptus', 'blanc', 'Eucalyptus', 'eucalyptus'],
  ],
  // Le ruban : services cités par Pages Jaunes et Google.
  ruban: ['Abonnements floraux pour les particuliers, les entreprises et les hôtels', 'Ateliers de décoration', 'Prêt de vases', 'Livraison', 'Retrait en boutique'],
  commander: {
    tel: '<small>Le plus simple</small><h3>Appelez Audrey</h3><p>Dites pour qui, pour quand, et ce que vous avez en tête.</p><a class="gros" data-tel data-tel-texte></a>',
    boutique: '<small>Sur place</small><h3>Passez à la boutique</h3><p>2 route du Vin, à Beblenheim. <span data-auj></span></p><p><a data-carte target="_blank" rel="noopener">Voir l’itinéraire</a></p>',
    livraison: '<small>Chez vous, chez eux</small><h3>Livré ou à retirer</h3><p>Livraison, ou retrait en boutique.</p><p>Communes livrées&nbsp;: <span class="ex">..................</span></p>',
  },
};
