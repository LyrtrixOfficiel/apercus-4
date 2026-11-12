// Fiche des faits vérifiés de la maquette (mise à jour le 12/11/2026).
// Depuis la refonte du 12/11, la page (index.html) porte ses textes elle-même et ne charge plus ce fichier :
// il reste ici comme référence, pour décliner la maquette ou relire ce qui est sûr. Chaque fait vient de SOURCES.md.
// Ce qui est inconnu reste en pointillés sur la page.
window.CONTENU = {
  nom: 'Poussières d’étoiles',
  metier: 'Boutique de créatrices : aquarelles, céramiques, bijoux, espace bien-être',
  adresse: '31 rue du Château, 56400 Auray',
  telephone: '06 29 47 71 96', // confirmé (LISTE-29-VERIFIEE.csv). Jamais le 06 62 19 60 45.
  horaires: 'Du lundi au samedi, 11 h 30 à 19 h (relevés dans la presse, à confirmer). Dimanche : pointillés.',
  histoire: 'La boutique existe depuis juillet 2023, d’abord au 21 rue Wilson. Elle est aujourd’hui rue du Château et se partage à trois. Ne jamais écrire qu’elle « ouvre ».',
  nomDuLieu: 'Le nom vient d’une expression d’Hubert Reeves : ce qui compose un corps s’est formé dans les étoiles (reformulé, pas de citation).',
  creatrices: [
    { nom: 'Patricia Rémy', role: 'Artiste peintre, à l’origine de la boutique', univers: 'Aquarelles', inconnu: 'Ses séries, ses formats, ses sujets' },
    { nom: 'Caroline Bonnin', role: 'Caoline Céramique', univers: 'Céramiques', inconnu: 'Ses pièces, ses terres, ses émaux' },
    { nom: 'Anne-Claire Verheeke', role: null, univers: null, inconnu: 'Son univers (aucune source ne le dit)' },
  ],
  bijoux: 'Des bijoux, dans la même boutique. Qui les crée, avec quoi : inconnu, en pointillés.',
  bienEtre: 'Un espace bien-être dans la boutique. Ce qu’on y propose, avec ou sans rendez-vous : inconnu, en pointillés.',
  liens: { facebook: 'https://www.facebook.com/p/Poussi%C3%A8res-d%C3%A9toiles-100057388662098/' },
  pages: 'Une page par créatrice, une pour les aquarelles, une pour les céramiques, une pour le bien-être : c’est vous qui voyez.',
  // Les trois ambiances du bouton Couleur de la page Bonjour (?palette=...).
  ambiances: { nuit: '#1b2a63', lagon: '#0f4a50', brique: '#6f281f' },
  photos: 'Trois photos d’illustration générées le 12/11 (site/photos), légendées comme telles : ce ne sont pas les pièces des créatrices.',
};
