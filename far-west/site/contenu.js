// Les faits et les listes de la maquette sont ici : pour un autre bar de quartier, on change ce fichier.
// Chaque fait vient de SOURCES.md. Ce qu'on ignore reste en pointillés. Rien de l'ancienne exploitation n'est repris.
window.CONTENU = {
  telephone: '01 71 82 16 01', // fiche Google actuelle, confirmé dans LISTE-29-VERIFIEE.csv (fixe)
  telLien: '+33171821601',
  carte: 'https://www.google.com/maps/search/?api=1&query=Le+Far+West+Bar+3+Rue+Faidherbe+75011+Paris',
  avis: '« Nouveau dans le quartier mais déjà incontournable !! »', // avis Google, octobre 2026, mot pour mot
  // Trois ambiances, branchées sur le bouton Couleur de la page Bonjour.
  palettes: {
    couchant: { nom: 'Soleil couchant', theme: '#f3e4c4' },
    neon: { nom: 'Néon violet et bleu', theme: '#efe2ee' },
    turquoise: { nom: 'Turquoise et terre cuite', theme: '#f1e6cf' },
  },
  // La journée du bar (horaires relevés sur Google le 9 novembre 2026, à confirmer) : quatre moments, sans heure inventée par activité (h = rang de l'heure de début dans la liste 8 h, 9 h ... 2 h).
  moments: [
    { nom: 'Le matin', bouton: 'Matin', h: 0, texte: 'Le café, dès l’ouverture.' },
    { nom: 'L’après-midi', bouton: 'Après-midi', h: 4, texte: 'La terrasse est au soleil.' },
    { nom: 'Le soir', bouton: 'Soir', h: 10, texte: 'L’afterwork, l’anniversaire, le match à l’écran.' },
    { nom: 'La nuit', bouton: 'Nuit', h: 15, texte: 'Les néons, les jeux de société, jusqu’à 2 h. Même le dimanche.' },
  ],
  // Les fûts du comptoir : une face sûre (fiche Google), une face qui attend le gérant.
  futs: [
    { a: 'Café', a2: 'dès le matin', b: 'Vos cafés, vos formules du matin', b2: '................' },
    { a: 'Vins et bières', a2: 'une sélection', b: 'Vos bouteilles, vos pressions', b2: '................' },
    { a: 'Brasserie', a2: 'de quoi manger sur place', b: 'Vos plats du moment', b2: '................' },
    { a: 'La carte', a2: '................', b: 'Vos prix', b2: '.. €   .. €   .. €' },
  ],
  // Le tableau à lettres des soirs de match : des mots génériques, aucun match annoncé.
  tableau: ['LE MATCH', 'LA FINALE', 'LE DERBY', 'LA REVANCHE'],
  // Le duel : paroles selon le temps de réaction.
  duel: {
    rangs: [[200, 'Un éclair. Le shérif n’a rien vu.'], [280, 'Réflexes d’acier.'], [360, 'Solide. Le shérif transpire.'], [9999, 'De justesse, mais ça compte.']],
    sherif: [560, 470, 400, 340, 300, 270], // de plus en plus rapide à chaque manche gagnée (millisecondes)
  },
  // La soirée privée : la phrase à dire au téléphone.
  occasions: { anniversaire: 'un anniversaire', afterwork: 'un afterwork', depart: 'un pot de départ' },
  tailles: { tablee: 'on serait une tablée', bande: 'on serait toute une bande', saloon: 'on aimerait tout le saloon' },
};
