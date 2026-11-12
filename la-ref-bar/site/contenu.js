// Tout le contenu de la maquette est ici : pour un autre bar à soirées, on change ce fichier et les photos.
// Chaque fait vient de SOURCES.md. Ce qui est inconnu reste en pointillés.
window.CONTENU = {
  telephone: '03 84 31 97 63',
  telLien: '+33384319763',
  carte: 'https://www.google.com/maps/search/?api=1&query=LA+R%C3%89F%E2%80%99+BAR+3+Av.+Carnot+70100+Gray',

  // Bandeau lumineux : les animations déclarées par la société (BODACC du 29/10/2026) et le karaoké (avis Google).
  bandeau: ['Karaoké', 'Soirées à thème', 'Jeux de société', 'Jeux d’arcade', 'Concerts', 'Spectacles'],

  // Tableau à lettres : l'activité déclarée (BODACC). La carte et le plat du jour sont inconnus : pointillés.
  tableau: [
    { mots: ['BAR', 'CAFÉ', 'BRASSERIE'] },
    { mots: ['SNACK', 'SALON DE THÉ'] },
    { mots: ['RESTAURANT'] },
    { mots: ['LA CARTE'], suite: 'à écrire avec vous', ton: 'rose' },
    { mots: ['PLAT DU JOUR'], suite: 'à écrire avec vous', ton: 'rose' },
  ],
  tableauVous: 'VOTRE MOT ICI',

  // Karaoké : paroles écrites pour la maquette, qui ne disent que ce qui est dans SOURCES.md. Aucune chanson existante.
  paroles: [
    ['Trois,', 'avenue', 'Carnot,'],
    ['un', 'café', 'le', 'matin,'],
    ['un', 'plat', 'à', 'midi,'],
    ['et', 'le', 'soir,', 'on', 'chante.'],
    ['Karaoké', 'au', 'micro,'],
    ['soirées', 'à', 'thème,'],
    ['jeux', 'de', 'société,'],
    ['jeux', 'd’arcade,'],
    ['concerts,', 'spectacles :'],
    ['à', 'Gray,', 'la', 'nuit'],
    ['s’allume', 'à', 'La', 'REF’Bar.'],
  ],
  // Petite mélodie écrite pour la maquette (une note par mot), en hertz.
  melodie: [330, 392, 440, 392, 440, 523, 440, 392, 440, 523, 587, 523, 440, 392, 440, 330,
    330, 392, 440, 392, 440, 523, 440, 523, 587, 659, 587, 523, 587, 659, 587, 523, 440, 392, 440, 523, 523],
  salle: ['La salle attend.', 'Ça prend.', 'La salle chante avec vous.', 'Tout le bar est debout.'],

  // Avis Google relevés le 09/11/2026 (non vérifiés par Google). Note 5,0 sur 5, 7 avis.
  avis: [
    ['Super bar, très moderne, avec de la bonne musique et du karaoké !', 'Un avis Google'],
    ['Les plats sont top. Bravo au chef', 'Théo C., octobre'],
    ['L’accueil est au top', 'Vanessa S., novembre'],
  ],

  // Horaires relevés sur Google Maps le 09/11/2026, à confirmer. Heures en nombres : 26 = 2 h du matin. null = inconnu.
  horaires: [
    ['Lundi', [[9, 14], [18, 22]]],
    ['Mardi', [[9, 14], [18, 22]]],
    ['Mercredi', null],
    ['Jeudi', [[9, 14], [18, 22]]],
    ['Vendredi', [[9, 14], [18, 26]]],
    ['Samedi', [[18, 26]]],
    ['Dimanche', [[18, 22]]],
  ],

  // Trois ambiances : la couleur des néons et de la nuit.
  palettes: {
    rose: { nom: 'Néon rose', theme: '#0a0f2c' },
    ambre: { nom: 'Juke-box', theme: '#1c0d14' },
    menthe: { nom: 'Arcade', theme: '#05211f' },
  },
};
