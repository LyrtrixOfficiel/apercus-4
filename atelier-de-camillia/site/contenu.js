// Les faits de la maquette sont ici : pour un autre institut, on change ce fichier et les photos.
// Chaque fait vient de SOURCES.md (tarifs relevés sur la page Planity le 09/11/2026). Ce qui est inconnu reste en pointillés dans la page.
window.CONTENU = {
  telephone: '06 83 56 05 87',
  telLien: '+33683560587',
  planity: 'https://www.planity.com/atelier-de-beaute-14740-thue-et-mue',
  // Horaires de Bretteville-l’Orgueilleuse (Planity) : [jour de la semaine 0 = dimanche, ouverture, fermeture]
  horaires: [[1, 9, 19], [2, 9, 19], [3, 9, 19], [4, 9, 19], [5, 9, 19], [6, 9, 16]],
  // Le tambour de l’arrivée : une photo, un soin, son prix, la famille de la carte à ouvrir.
  tambour: [
    { photo: 'visage', nom: 'Soin ProSkin by Dermalogica', prix: '45 € les 30 minutes', cat: 1, pos: '50% 46%' },
    { photo: 'cils', nom: 'Pose complète cil à cil', prix: '72 €', cat: 6, pos: '50% 30%' },
    { photo: 'mains', nom: 'Vernis semi-permanent', prix: '34 €', cat: 4, pos: '50% 50%' },
    { photo: 'regard', nom: 'Maquillage permanent des sourcils', prix: '320 €', cat: 8, pos: '55% 40%' },
    { photo: 'cours', nom: 'Cours de maquillage, palette offerte', prix: '35 €', cat: 9, pos: '50% 28%' },
  ],
  // Les scènes de la tapisserie : l’inscription, la photo, le détail, la famille de la carte (cat), le cadrage de la photo.
  scenes: [
    { lignes: ['ICI CAMILLE', 'POSE LES CILS'], photo: 'cils', txt: 'Pose complète cil à cil 72 €. Rehaussement de cils 49 €.', cat: 6, pos: '50% 35%' },
    { lignes: ['ICI ON DESSINE', 'LE REGARD'], photo: 'regard', txt: 'Maquillage permanent sourcils, eye-liner ou bouche : 320 €, retouche incluse.', cat: 8, pos: '50% 40%' },
    { lignes: ['ICI LA PEAU', 'RESPIRE'], photo: 'visage', txt: 'Soins ProSkin by Dermalogica : 45 € les 30 minutes, 63 € l’heure.', cat: 1, pos: '45% 50%' },
    { lignes: ['ICI LES MAINS', 'SE POSENT'], photo: 'mains', txt: 'Vernis semi-permanent 34 €. Gel sur ongle naturel 46 €.', cat: 4, pos: '50% 50%' },
    { lignes: ['ICI LES JOLIS', 'PETONS'], photo: 'pieds', txt: 'Soin douceur des pieds 30 €. Soin anti-callosité Yumi 41 €.', cat: 5, pos: '35% 50%' },
    { lignes: ['ICI LE CORPS', 'SE DÉNOUE'], photo: 'corps', txt: 'L’instant sur mesure, de 45 € à 90 €. Madérothérapie, de 45 € à 79 €.', cat: 2, pos: '50% 50%' },
    { lignes: ['ICI ON', 'APPREND'], photo: 'cours', txt: 'Cours individuel de maquillage, 45 minutes, 35 €. Une palette offerte à la fin.', cat: 9, pos: '50% 30%' },
  ],
  catalogue: [
    { t: 'Épilations', l: [['Sourcils', '15 min', '9 €'], ['Création ligne sourcils', '20 min', '11 €'], ['Lèvres ou menton', '10 min', '8 €'], ['Nez ou oreilles', '15 min', '6 €'], ['½ jambes, cuisses ou bras', '20 min', '21 €'], ['Sourcils + lèvre ou menton', '15 min', '14 €'], ['Visage (sourcils, lèvre, menton)', '25 min', '20 €'], ['Dos, bras ou torse', '25 min', '21 €'], ['½ jambes + aisselles ou maillot', '30 min', '27 €'], ['½ jambes + maillot échancré', '30 min', '29 €']] },
    { t: 'Soins du visage', l: [['Soin ados', '40 min', '38 €'], ['ProSkin by Dermalogica 30 min', '40 min', '45 €'], ['ProSkin by Dermalogica 60 min', '1 h 10', '63 €'], ['Pro Power Peel by Dermalogica', '1 h 20', '83 €'], ['Supplément masque LED', '15 min', '15 €']] },
    { t: 'Soins du corps', l: [['Gommage corps', '35 min', '31 €'], ['Soin dos équilibrant', '45 min', '38 €'], ['L’instant sur mesure 30 min', '35 min', '45 €'], ['L’instant sur mesure 60 min', '1 h 05', '63 €'], ['L’instant sur mesure 90 min', '1 h 35', '90 €']] },
    { t: 'Madérothérapie', l: [['Ventre + dos', '35 min', '45 €'], ['Jambes + fesses', '40 min', '52 €'], ['Corps complet', '1 h 10', '79 €']] },
    { t: 'Ongles', l: [['Manucure simple', '20 min', '17 €'], ['Vernis semi-permanent mains', '45 min', '34 €'], ['Vernis semi-permanent pieds', '35 min', '34 €'], ['Renfort vernis semi-permanent', '50 min', '36 €'], ['Gel sur ongle naturel', '1 h 20', '46 €']] },
    { t: 'Jolis petons', l: [['Soin douceur des pieds', '30 min', '30 €'], ['Soin anti-callosité Yumi', '45 min', '41 €'], ['Anti-callosité Yumi + pose semi-permanent', '45 min', '69 €']] },
    { t: 'Extensions de cils', l: [['Pose complète cil à cil', '1 h 50', '72 €'], ['Pose complète mixte', '2 h', '87 €'], ['Remplissage 2 semaines', '45 min', '32 €'], ['Remplissage 3 semaines', '1 h', '42 €'], ['Remplissage 4 semaines', '1 h 15', '57 €']] },
    { t: 'Beauté du regard', l: [['Teinture sourcils', '20 min', '15 €'], ['Teinture cils', '30 min', '22 €'], ['Épilation + teinture sourcils', '25 min', '22 €'], ['Épilation sourcils + teinture sourcils et cils', '45 min', '42 €'], ['Rehaussement de cils', '50 min', '49 €']] },
    { t: 'Maquillage permanent', l: [['Sourcils', '3 h 20', '320 €'], ['Eye-liner', '3 h 20', '320 €'], ['Bouche', '3 h 20', '320 €']] },
    { t: 'Cours de maquillage', l: [['Cours individuel, palette offerte', '45 min', '35 €']] },
  ],
  // Le canevas : trois motifs à broder (15 cases sur 11), et la phrase vraie qui s’affiche quand le motif est fini.
  motifs: [
    { nom: 'Les cils', fin: 'Pose complète cil à cil : 1 h 50, 72 €.', g: ['...............', '...X...X...X...', '....X..X..X....', '.X..XXXXXXX..X.', '..XXX.....XXX..', '.XX...XXX...XX.', 'XX...XXXXX...XX', '.XX...XXX...XX.', '..XXX.....XXX..', '....XXXXXXX....', '...............'] },
    { nom: 'Le cœur', fin: '5 sur 5 sur Planity, d’après 244 avis.', g: ['...............', '...XXX...XXX...', '..XXXXX.XXXXX..', '..XXXXXXXXXXX..', '..XXXXXXXXXXX..', '...XXXXXXXXX...', '....XXXXXXX....', '.....XXXXX.....', '......XXX......', '.......X.......', '...............'] },
    { nom: 'Le C de Camillia', fin: 'À Bayeux depuis le 15 octobre 2026, au 1 rue du Docteur Michel.', g: ['...............', '.....XXXXXX....', '...XXXXXXXXXX..', '..XXXX....XXX..', '..XXX..........', '..XXX..........', '..XXX..........', '..XXXX....XXX..', '...XXXXXXXXXX..', '.....XXXXXX....', '...............'] },
  ],
};
