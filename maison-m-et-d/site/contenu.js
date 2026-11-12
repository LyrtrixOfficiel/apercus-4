// Les faits de la maquette sont ici : pour un autre commerce multiservice, on change ce fichier, les photos et les textes de index.html.
// Chaque fait vient de SOURCES.md. Ce qui est inconnu reste en pointillés (horaires, prix, ce qu'il y a dans chaque rayon).
window.CONTENU = {
  nom: 'Maison M&D',
  gerants: 'Manon et Diego', // BODACC du 29/10/2026, Ouest-France du 18/10/2026
  adresse: '35 rue de l’Hippodrome', // BODACC
  ville: '50800 La Chapelle-Cécelin, Manche',
  carte: 'https://www.google.com/maps/search/?api=1&query=35+rue+de+l%27Hippodrome+50800+La+Chapelle-C%C3%A9celin',
  telephone: '02 33 58 89 24', // confirmé : PagesJaunes Maison M&D, Ouest-France du 18/10/2026, fiche Google (LISTE-29-VERIFIEE.csv)
  telephoneLien: '+33233588924',
  note: '5,0 sur 5 sur Google (14 avis)', // LISTE-29-VERIFIEE.csv, relevé du 11/11/2026
  // Activité du fonds au BODACC : sept rayons.
  rayons: [
    { id: 'pain', mot: 'Le pain', court: 'Pain', phrase: 'Ce qui sort du four : ............' },
    { id: 'gateaux', mot: 'Les gâteaux', court: 'Gâteaux', phrase: 'Ce qu’il y a en vitrine : ............' },
    { id: 'traiteur', mot: 'Le traiteur', court: 'Traiteur', phrase: 'Pour vos fêtes et vos repas : ............' },
    { id: 'epicerie', mot: 'L’épicerie', court: 'Épicerie', phrase: 'Ce qu’on trouve sur les étagères : ............' },
    { id: 'primeurs', mot: 'Fruits et légumes', court: 'Fruits et légumes', phrase: 'La saison du moment : ............' },
    { id: 'gaz', mot: 'Le gaz', court: 'Gaz', phrase: 'Dépôt de gaz : ............' },
    { id: 'journaux', mot: 'Le journal', court: 'Journaux', phrase: 'Vente de journaux : ............' },
  ],
  // La couleur du store : c'est le bouton « Couleur » de la page Bonjour.
  palettes: {
    rouge: { store: '#d63f2b', 'store-f': '#a52a1b', nuit: '#1c3557', 'nuit-c': '#2b4f7d', theme: '#1c3557' },
    bleu: { store: '#2a63b3', 'store-f': '#1b447f', nuit: '#18283f', 'nuit-c': '#2c4466', theme: '#18283f' },
    vert: { store: '#2f8257', 'store-f': '#1e5b3b', nuit: '#1f3340', 'nuit-c': '#335263', theme: '#1f3340' },
  },
};
