// Tout le contenu de la maquette est ici : pour un autre primeur, on change ce fichier.
// Chaque fait sur le commerce vient de SOURCES.md. Ce qui est inconnu reste en pointillés.
// Le calendrier est un repère général pour le Sud de la France, pas la liste de ce qui est en rayon.
window.CONTENU = {
  // Nom commercial au répertoire des entreprises (singulier). Le BODACC écrit « Primeurs » : une seule ligne à changer.
  nom: ['Primeur', 'des 4 Saisons'],
  metier: 'Fruits, légumes et produits du terroir',
  rue: '322 boulevard Saint-Fructueux',
  ville: '34400 Lunel',
  carteLien: 'https://www.google.com/maps/search/?api=1&query=322+boulevard+Saint-Fructueux+34400+Lunel',
  // BODACC : début d'exploitation le 05/10/2026.
  depuis: 'Ouvert depuis octobre 2026',
  // Aucun numéro confirmé pour ce commerce : pointillés.
  telephone: '.. .. .. .. ..',
  // Horaires inconnus : pointillés, jour par jour.
  jours: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'],
  horaire: '.. h .. à .. h ..',

  // Les quatre saisons : photo d'illustration (gommette de l'étal), début (mois de 0 à 11, jour), couleurs de la roue, fruit qui roule dans la barre.
  saisons: [
    { id: 'printemps', photo: 'photos/printemps.webp', nom: 'Printemps', le: 'le printemps', de: 'de printemps', au: 'Au printemps', debut: [2, 20], milieu: [4, 5], clair: '#dcefb0', vif: '#63ad3a', fruit: 'fraise',
      etal: { fruits: ['fraise', 'cerise', 'abricot', 'kiwi'], legumes: ['asperge', 'pois', 'radis', 'courgette'] } },
    { id: 'ete', photo: 'photos/ete.webp', nom: 'Été', le: 'l’été', de: 'd’été', au: 'En été', debut: [5, 21], milieu: [7, 5], clair: '#ffe28a', vif: '#f2a900', fruit: 'peche',
      etal: { fruits: ['peche', 'melon', 'abricot', 'figue'], legumes: ['tomate', 'aubergine', 'courgette', 'poivron'] } },
    { id: 'automne', photo: 'photos/automne.webp', nom: 'Automne', le: 'l’automne', de: 'd’automne', au: 'En automne', debut: [8, 22], milieu: [10, 5], clair: '#f7c894', vif: '#d9631a', fruit: 'pomme',
      etal: { fruits: ['raisin', 'figue', 'pomme', 'chataigne'], legumes: ['potiron', 'poireau', 'chou', 'endive'] } },
    { id: 'hiver', photo: 'photos/hiver.webp', nom: 'Hiver', le: 'l’hiver', de: 'd’hiver', au: 'En hiver', debut: [11, 21], milieu: [1, 5], clair: '#cfe3ee', vif: '#3f86b5', fruit: 'orange',
      etal: { fruits: ['orange', 'clementine', 'citron', 'kiwi'], legumes: ['poireau', 'endive', 'chou', 'potiron'] } },
  ],

  // Calendrier général du Sud : de (mois de début) à (mois de fin), de 0 (janvier) à 11 (décembre) ; pic = sa place sur la roue.
  // jeu = les saisons acceptées dans « De quelle saison ? » (absent : le produit n'est pas dans le jeu).
  produits: [
    { id: 'orange', nom: 'Oranges', un: 'L’orange', type: 'fruit', de: 11, a: 3, pic: 0, jeu: ['hiver'] },
    { id: 'endive', nom: 'Endives', un: 'L’endive', type: 'legume', de: 10, a: 2, pic: 0, jeu: ['hiver'] },
    { id: 'citron', nom: 'Citrons', un: 'Le citron', type: 'fruit', de: 10, a: 2, pic: 1, jeu: ['hiver'] },
    { id: 'poireau', nom: 'Poireaux', un: 'Le poireau', type: 'legume', de: 9, a: 2, pic: 1, jeu: ['automne', 'hiver'] },
    { id: 'kiwi', nom: 'Kiwis', un: 'Le kiwi', type: 'fruit', de: 10, a: 4, pic: 2 },
    { id: 'radis', nom: 'Radis', un: 'Le radis', type: 'legume', de: 2, a: 5, pic: 2, jeu: ['printemps'] },
    { id: 'asperge', nom: 'Asperges', un: 'L’asperge', type: 'legume', de: 2, a: 5, pic: 3, jeu: ['printemps'] },
    { id: 'fraise', nom: 'Fraises', un: 'La fraise', type: 'fruit', de: 3, a: 5, pic: 3, jeu: ['printemps'] },
    { id: 'pois', nom: 'Petits pois', un: 'Le petit pois', type: 'legume', de: 3, a: 5, pic: 4, jeu: ['printemps'] },
    { id: 'cerise', nom: 'Cerises', un: 'La cerise', type: 'fruit', de: 4, a: 6, pic: 4, jeu: ['printemps', 'ete'] },
    { id: 'abricot', nom: 'Abricots', un: 'L’abricot', type: 'fruit', de: 5, a: 7, pic: 5, jeu: ['ete'] },
    { id: 'courgette', nom: 'Courgettes', un: 'La courgette', type: 'legume', de: 5, a: 8, pic: 5, jeu: ['ete'] },
    { id: 'peche', nom: 'Pêches', un: 'La pêche', type: 'fruit', de: 5, a: 8, pic: 6, jeu: ['ete'] },
    { id: 'tomate', nom: 'Tomates', un: 'La tomate', type: 'legume', de: 5, a: 8, pic: 6, jeu: ['ete'] },
    { id: 'melon', nom: 'Melons', un: 'Le melon', type: 'fruit', de: 5, a: 8, pic: 7, jeu: ['ete'] },
    { id: 'aubergine', nom: 'Aubergines', un: 'L’aubergine', type: 'legume', de: 5, a: 8, pic: 7, jeu: ['ete'] },
    { id: 'figue', nom: 'Figues', un: 'La figue', type: 'fruit', de: 7, a: 9, pic: 8, jeu: ['ete', 'automne'] },
    { id: 'poivron', nom: 'Poivrons', un: 'Le poivron', type: 'legume', de: 6, a: 9, pic: 8 },
    { id: 'raisin', nom: 'Raisin', un: 'Le raisin', type: 'fruit', de: 7, a: 9, pic: 9, jeu: ['ete', 'automne'] },
    { id: 'potiron', nom: 'Potirons', un: 'Le potiron', type: 'legume', de: 8, a: 11, pic: 9, jeu: ['automne'] },
    { id: 'pomme', nom: 'Pommes', un: 'La pomme', type: 'fruit', de: 8, a: 3, pic: 10 },
    { id: 'chataigne', nom: 'Châtaignes', un: 'La châtaigne', type: 'fruit', de: 9, a: 10, pic: 10, jeu: ['automne'] },
    { id: 'clementine', nom: 'Clémentines', un: 'La clémentine', type: 'fruit', de: 10, a: 1, pic: 11, jeu: ['automne', 'hiver'] },
    { id: 'chou', nom: 'Choux', un: 'Le chou', type: 'legume', de: 9, a: 2, pic: 11 },
  ],
  mois: ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'],
  moisCourts: ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'],
  moisRoue: ['JANV', 'FÉVR', 'MARS', 'AVR', 'MAI', 'JUIN', 'JUIL', 'AOÛT', 'SEPT', 'OCT', 'NOV', 'DÉC'],
};
