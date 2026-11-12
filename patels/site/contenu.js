// Tout le contenu propre à l'institut est ici : pour un autre institut, on change ce fichier et les photos.
// Chaque fait vient de SOURCES.md. Ce qui est inconnu reste en pointillés (lignes sans valeur).
// Téléphone : fiche Google au nom de Patel's relevée le 10/11/2026 (voir ..\..\NUMEROS-RAPPORT.md).
window.CONTENU = {
  tel: '09 54 75 12 13',
  telLien: 'tel:+33954751213',
  carte: 'https://www.google.com/maps/search/?api=1&query=18+rue+Belgrand+75020+Paris',
  // Les sept bracelets : un par métier inscrit au registre (BODACC du 04/10/2026 et du 27/10/2026).
  // lignes : ce qui s'affiche suivi de pointillés. vers : la section où l'on joue avec ce métier.
  prestations: [
    { id: 'coiffure', nom: 'Coiffure', c: '#d9390f', o: '#ffc94a',
      phrase: 'Le salon de coiffure est au même endroit que le reste.',
      lignes: ['Coupes', 'Tarifs'], photo: 'cheveux', alt: 'Une coiffeuse peigne de longs cheveux noirs, vue de dos',
      vers: '#coiffure', versTexte: 'Sécher les mèches' },
    { id: 'ongles', nom: 'Ongles', c: '#d4145f', o: '#ffc94a',
      phrase: 'Manucure et pédicure.',
      lignes: ['Manucure', 'Pédicure'], photo: 'ongles', alt: 'Une pose de vernis rose sur une petite table de manucure',
      vers: '#ongles', versTexte: 'Poser la couleur' },
    { id: 'epilation', nom: 'Épilation', c: '#f7a806', o: '#d4145f',
      phrase: 'Épilation du visage et du corps.',
      lignes: ['Visage', 'Corps', 'Au fil (à confirmer avec vous)'], photo: 'visage', alt: 'Une esthéticienne épile les sourcils d’une cliente',
      vers: '#fil', versTexte: 'Tirer le fil' },
    { id: 'cils', nom: 'Cils', c: '#19a59c', o: '#ffc94a',
      phrase: 'Les cils se font ici aussi.',
      lignes: ['Vos prestations pour les cils', 'Tarifs'],
      vers: '#fil', versTexte: 'Voir le regard' },
    { id: 'visage', nom: 'Soins du visage', c: '#ff8fb5', o: '#fff4e0',
      phrase: 'Des soins du visage, à l’institut.',
      lignes: ['Vos soins', 'Durées et tarifs'],
      vers: '#rdv', versTexte: 'Prendre rendez-vous' },
    { id: 'massages', nom: 'Massages', c: '#fff4e0', o: '#d4145f',
      phrase: 'Des massages, pour souffler un peu.',
      lignes: ['Durées', 'Tarifs'], photo: 'massage', alt: 'Une petite salle de massage : une table, une serviette pliée, un bol d’huile',
      vers: '#massages', versTexte: 'Masser les lettres' },
    { id: 'produits', nom: 'Produits cosmétiques', court: 'Produits', c: '#1c8a57', o: '#ffc94a',
      phrase: 'Et des produits cosmétiques à emporter.',
      lignes: ['Vos marques', 'Prix'],
      vers: '#venir', versTexte: 'Passer à l’institut' },
  ],
  // Les vernis du nuancier (couleurs de la maquette, pas un catalogue).
  vernis: [
    ['Rani', '#d4145f'], ['Souci', '#f7a806'], ['Vermillon', '#d9390f'], ['Indigo', '#1b1560'], ['Rose', '#ff8fb5'],
  ],
  // Les couleurs dont on repeint les pétales du rangoli.
  holi: ['#d4145f', '#f7a806', '#04676a', '#d9390f', '#19a59c', '#ff8fb5', '#1c8a57'],
};
