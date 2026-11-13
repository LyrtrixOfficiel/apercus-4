// Tout ce qui est propre au commerce est ici : pour une autre friterie, on change ce fichier et les photos.
// Chaque fait vient de SOURCES.md. Ce qui est inconnu reste en pointillés : la carte, les prix, les horaires, le téléphone.
window.CONTENU = {
  nom: 'La Frite Pochée',
  adresse: '40 A rue Léon Blum, 59950 Auby',
  repere: 'face à la mairie',
  carteLien: 'https://www.google.com/maps/search/?api=1&query=40+A+rue+L%C3%A9on+Blum+59950+Auby',
  // Aucun numéro : celui de la liste est celui de l'ancienne friterie.
  telephone: null,
  jours: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'],
  // Les trois activités déclarées au registre : friterie, snacking, petite restauration. Aucun produit, aucun prix.
  familles: [
    { id: 'friterie', titre: 'La friterie', photo: 'mur', alt: 'Des frites dorées dans le bac d’une friteuse', phrase: 'Vos frites, vos portions, vos sauces.', lignes: 4 },
    { id: 'snacking', titre: 'Le snacking', photo: 'paquet', alt: 'Un paquet emballé dans son papier, tendu par-dessus le comptoir', phrase: 'Ce qui s’emporte et se mange sur le pouce.', lignes: 4 },
    // Photo de barquette à emporter (13/11) : la table dressée laissait croire à une salle ; l'ancienne friterie du local ne faisait presque que de l'emporter (4 couverts).
    { id: 'restauration', titre: 'La petite restauration', photo: 'barquette', alt: 'Une barquette de frites dans son papier, avec mayonnaise, ketchup et petite fourchette', phrase: 'Vos plats, servis comme vous les faites.', lignes: 3 },
  ],
  // Sauces du JEU : des noms génériques, sans marque. Ce n'est pas la carte du commerce.
  sauces: [
    { id: 'mayo', nom: 'Mayonnaise', c: '#f6e2a0', o: '#e3c366', l: '#fff6d6' },
    { id: 'ketchup', nom: 'Ketchup', c: '#d3251a', o: '#a3160e', l: '#f0594d' },
    { id: 'moutarde', nom: 'Moutarde', c: '#dfa50c', o: '#b47f00', l: '#f6cb4e' },
    { id: 'andalouse', nom: 'Andalouse', c: '#ee7a2b', o: '#c55a12', l: '#ffa35e' },
    { id: 'barbecue', nom: 'Barbecue', c: '#6b2a12', o: '#4a1a08', l: '#96482a' },
  ],
  // Trois ambiances proposées depuis la page d'accueil de l'aperçu.
  palettes: {
    ketchup: { rouge: '#d8281b', rouge2: '#a3170d', rouge3: '#e53e2c' },
    baraque: { rouge: '#1d4fb3', rouge2: '#12357c', rouge3: '#2c62cc' },
    cornichon: { rouge: '#2f7d3b', rouge2: '#1d5727', rouge3: '#3d9349' },
  },
};
