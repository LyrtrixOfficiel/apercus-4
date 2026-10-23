// Mathéo Bringia : LES PHOTOS. La Galerie (événements, albums, vidéos), la page « Le pilote » et l'accueil lisent ce fichier.
//
// MODE D'EMPLOI
//   AJOUTER DES PHOTOS
//     1. copier les photos (JPEG ou PNG) dans  site/medias/photos/originaux/
//        (les photos HEIC de l'iPhone : les exporter d'abord en JPEG)
//     2. lancer :  python outils/photos.py <id de l'album>
//        Il crée pour chaque photo une version web (site/medias/photos/<nom>.webp, 1600 px) et une vignette
//        (<nom>-480.webp), et affiche les blocs à coller ci-dessous.
//     3. coller les blocs dans PHOTOS (l'ordre de la liste est l'ordre d'affichage), écrire une légende courte,
//        choisir l'album.
//     4. lancer :  node outils/generer.mjs   (version sans JavaScript). Avec JavaScript, tout se met à jour seul.
//   LES CHAMPS
//     fichier   le chemin SANS l'extension : 'medias/photos/indoor-trophee' (le site ajoute .webp et -480.webp)
//     legende   une phrase courte, écrite aussi pour les personnes qui n'y voient pas (texte alternatif)
//     album     l'id d'un album de ALBUMS ci-dessous
//     forme     '' (carrée), 'haut' (portrait, deux cases de haut) ou 'large' (paysage, deux cases de large)
//     pilote    true : la photo apparaît aussi sur la page « Le pilote » (les 4 premières marquées)
//   AJOUTER UN ÉVÉNEMENT : copier un bloc de ALBUMS (l'ordre de la liste est l'ordre d'affichage), puis marquer ses
//   photos avec son id. « a_venir: true » : la carte annonce l'événement, sans photos.
//
// SOURCE : le lot de photos du pilote (iCloud, reçu le 23/10/2026), préparé par outils/photos-icloud.py. Les dates
// viennent des métadonnées des photos (23 août 2026 pour la course, 13 janvier 2026 pour la soirée en salle, 27 et
// 28 mai 2026 pour la soirée en plein air, 19 octobre 2025 pour la Winter Cup). Auteur des photos de course : à compléter.

export const ALBUMS = [
  { id: 'angerville-2026', titre: 'FRKC Outdoor 2026', date: '23 août 2026', lieu: 'Angerville', credit: 'Photos : auteur à compléter', couverture: 'medias/photos/angerville-virage' },
  { id: 'indoor-2026', titre: 'FRKC Indoor 2026, 3e Français', date: '2026', lieu: 'Metz Kart Indoor', credit: '', couverture: 'medias/photos/indoor-trophee' },
  { id: 'soiree-mai-2026', titre: 'Soirée des partenaires', date: '27 mai 2026', lieu: 'En plein air', credit: '', couverture: 'medias/photos/soiree-mai-affiche' },
  { id: 'soiree-janvier-2026', titre: 'Soirée des partenaires', date: 'Janvier 2026', lieu: 'Salle de karting', credit: '', couverture: 'medias/photos/soiree-hiver-kart-mb' },
  { id: 'winter-cup-2025', titre: 'Winter Cup', date: 'Octobre 2025', lieu: 'Karting', credit: '', couverture: 'medias/photos/winter-cup-portrait' },
  { id: 'studio-2026', titre: 'En studio', date: '2026', lieu: 'Photo et vidéo', credit: 'Vidéo : @matheo.bringia', couverture: 'medias/photos/pied-studio' },
  { id: 'indoor-2027', titre: 'FRKC Indoor 2027', date: '5 au 7 février 2027', lieu: 'Metz', credit: '', a_venir: true },
];

export const PHOTOS = [
  // FRKC Outdoor 2026, Angerville
  { fichier: 'medias/photos/angerville-casque', legende: 'Casque orange, gants orange, BRINGIA sur le ponton', album: 'angerville-2026', forme: 'haut', pilote: true },
  { fichier: 'medias/photos/angerville-virage', legende: 'Le n°15 à la corde', album: 'angerville-2026', forme: 'large' },
  { fichier: 'medias/photos/angerville-face', legende: 'De face, en sortie de virage', album: 'angerville-2026', forme: '' },
  { fichier: 'medias/photos/angerville-profil', legende: 'Le kart en appui', album: 'angerville-2026', forme: '' },
  { fichier: 'medias/photos/angerville-peloton', legende: 'Dans le peloton', album: 'angerville-2026', forme: 'haut' },
  { fichier: 'medias/photos/angerville-duel', legende: 'Roue dans roue', album: 'angerville-2026', forme: '' },
  { fichier: 'medias/photos/angerville-kmc', legende: 'Au virage du drapeau KWC', album: 'angerville-2026', forme: '' },
  { fichier: 'medias/photos/angerville-sortie', legende: 'Plein gaz en sortie', album: 'angerville-2026', forme: 'large' },
  { fichier: 'medias/photos/angerville-groupe', legende: 'Le groupe dans le virage', album: 'angerville-2026', forme: '' },
  { fichier: 'medias/photos/angerville-corde', legende: 'À la corde, devant un adversaire', album: 'angerville-2026', forme: '' },
  { fichier: 'medias/photos/angerville-casque-main', legende: 'Casque à la main, à Angerville', album: 'angerville-2026', forme: 'haut', pilote: true },
  // FRKC Indoor 2026
  { fichier: 'medias/photos/indoor-trophee', legende: 'Le trophée « 3rd place France », FRKC Indoor 2026', album: 'indoor-2026', forme: 'haut' },
  { fichier: 'medias/photos/indoor-podium', legende: 'Sur le podium des Français, au Metz Kart Indoor', album: 'indoor-2026', forme: '' },
  { fichier: 'medias/photos/indoor-podium-duo', legende: 'Médaille au cou, trophée en main', album: 'indoor-2026', forme: '' },
  { fichier: 'medias/photos/indoor-medaille', legende: 'Devant le mur du FRKC', album: 'indoor-2026', forme: '' },
  // soirée du 27 mai 2026
  { fichier: 'medias/photos/soiree-mai-affiche', legende: 'L’affiche de la soirée du 27 mai', album: 'soiree-mai-2026', forme: 'haut' },
  { fichier: 'medias/photos/soiree-mai-kakemono', legende: 'Le kakémono des partenaires : VIP, Premium, Prestige', album: 'soiree-mai-2026', forme: 'haut' },
  { fichier: 'medias/photos/soiree-mai-casque', legende: 'Le casque et les trophées exposés', album: 'soiree-mai-2026', forme: '' },
  { fichier: 'medias/photos/soiree-mai-table', legende: 'La table des trophées', album: 'soiree-mai-2026', forme: '' },
  { fichier: 'medias/photos/soiree-mai-pilote', legende: 'Mathéo, le soir du 27 mai', album: 'soiree-mai-2026', forme: '' },
  { fichier: 'medias/photos/soiree-mai-tente', legende: 'Les invités sous la tente', album: 'soiree-mai-2026', forme: 'large' },
  // soirée de janvier 2026
  { fichier: 'medias/photos/soiree-hiver-kart-mb', legende: 'Le kart exposé entre les kakémonos MB', album: 'soiree-janvier-2026', forme: 'haut' },
  { fichier: 'medias/photos/soiree-hiver-pilote-kart', legende: 'Au volant du kart exposé', album: 'soiree-janvier-2026', forme: '' },
  { fichier: 'medias/photos/soiree-hiver-kart', legende: 'Devant le kart exposé', album: 'soiree-janvier-2026', forme: 'large' },
  { fichier: 'medias/photos/soiree-hiver-kakemono', legende: 'Devant les kakémonos', album: 'soiree-janvier-2026', forme: '' },
  { fichier: 'medias/photos/soiree-hiver-duo', legende: 'Devant la combinaison exposée', album: 'soiree-janvier-2026', forme: '' },
  { fichier: 'medias/photos/soiree-hiver-trophees', legende: 'Trophées et médailles du CRKI', album: 'soiree-janvier-2026', forme: '' },
  { fichier: 'medias/photos/soiree-hiver-echange', legende: 'Un échange avec un invité', album: 'soiree-janvier-2026', forme: '' },
  { fichier: 'medias/photos/soiree-hiver-salle', legende: 'La salle et le buffet', album: 'soiree-janvier-2026', forme: 'large' },
  { fichier: 'medias/photos/soiree-hiver-buffet', legende: 'Le buffet', album: 'soiree-janvier-2026', forme: '' },
  // Winter Cup 2025
  { fichier: 'medias/photos/winter-cup-portrait', legende: 'À la Winter Cup, casque à la main', album: 'winter-cup-2025', forme: 'haut', pilote: true },
  { fichier: 'medias/photos/winter-cup-casque', legende: 'Casque fermé, dans la pénombre', album: 'winter-cup-2025', forme: 'haut' },
  // studio
  { fichier: 'medias/photos/pied-studio', legende: 'En pied, pouces levés', album: 'studio-2026', forme: 'haut' },
  { fichier: 'img/photos/pilote-dos', legende: 'Le dos de la combinaison', album: 'studio-2026', forme: '' },
  { fichier: 'img/photos/pilote-gant', legende: 'Gants orange mouchetés, MB sur le dessus', album: 'studio-2026', forme: '' },
  { fichier: 'img/photos/pilote-epaule', legende: 'L’épaule de la combinaison', album: 'studio-2026', forme: '' },
  { fichier: 'img/photos/logo-mb', legende: 'Le logo MB, en fin de vidéo', album: 'studio-2026', forme: '' },
];

export const VIDEOS = [
  { fichier: 'video/studio.mp4', affiche: 'img/photos/pilote-epaule.webp', titre: 'Casque fermé', texte: 'La combinaison en détail, le casque, puis le logo MB : le reel studio de Mathéo, publié sur son compte Instagram.', album: 'studio-2026' },
];

// ---- outils (ne pas modifier) ----
export const photosDe = (album) => PHOTOS.filter((p) => p.album === album);
export const photosPilote = () => PHOTOS.filter((p) => p.pilote).slice(0, 4);
