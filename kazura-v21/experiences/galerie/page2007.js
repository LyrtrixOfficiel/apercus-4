// Kazura v19, page des expériences : la page web de 2007 de Lila Fougère (l'expérience « Cassez votre vieux site »),
// dessinée en canvas 2D pour le portail, qui la fissure en direct. Carrée : le portail est rond.

export function dessinerPage2007(taille = 1024) {
  const c = document.createElement('canvas');
  c.width = c.height = taille;
  const g = c.getContext('2d');
  const k = taille / 1024;
  g.scale(k, k);

  // le fond gris à motif, et la page posée dessus
  g.fillStyle = '#9fa6b2';
  g.fillRect(0, 0, 1024, 1024);
  g.fillStyle = 'rgba(255,255,255,.08)';
  for (let y = 0; y < 1024; y += 16) for (let x = (y / 16) % 2 ? 8 : 0; x < 1024; x += 16) g.fillRect(x, y, 8, 8);
  g.fillStyle = '#d4d0c8';
  g.fillRect(96, 80, 832, 880);
  g.strokeStyle = '#808080'; g.lineWidth = 3; g.strokeRect(96, 80, 832, 880);

  // le titre en dégradé, en Comic
  const deg = g.createLinearGradient(110, 0, 910, 0);
  deg.addColorStop(0, '#1d2a9e'); deg.addColorStop(1, '#7fb2ff');
  g.fillStyle = deg; g.fillRect(112, 96, 800, 150);
  g.font = 'bold 64px "Comic Sans MS", "Comic Neue", cursive';
  g.textBaseline = 'middle';
  const titre = g.createLinearGradient(0, 130, 0, 210);
  titre.addColorStop(0, '#ffe066'); titre.addColorStop(1, '#ff7b00');
  g.fillStyle = titre; g.strokeStyle = '#3a0000'; g.lineWidth = 3;
  g.strokeText('Bienvenue !!!', 160, 150); g.fillText('Bienvenue !!!', 160, 150);
  g.font = 'italic 30px "Times New Roman", serif'; g.fillStyle = '#e8f0ff';
  g.fillText('sur le site de Lila Fougère, sophrologue', 162, 212);

  // le texte qui défile
  g.fillStyle = '#000'; g.fillRect(112, 262, 800, 40);
  g.font = 'bold 24px "Courier New", monospace'; g.fillStyle = '#00ff66';
  g.fillText('*** Nouveau : les séances de groupe le jeudi !!! ***', 128, 283);

  // le menu à gauche
  const menu = ['Accueil', 'Qui suis-je ?', 'Mes tarifs', 'Livre d’or', 'Contact'];
  menu.forEach((m, i) => {
    const y = 322 + i * 74;
    const b = g.createLinearGradient(0, y, 0, y + 58);
    b.addColorStop(0, '#f4f4f4'); b.addColorStop(1, '#b9b9c6');
    g.fillStyle = b; g.fillRect(112, y, 250, 58);
    g.strokeStyle = '#6d6d7a'; g.lineWidth = 2; g.strokeRect(112, y, 250, 58);
    g.fillStyle = '#2346d8'; g.beginPath(); g.arc(138, y + 29, 9, 0, 7); g.fill();
    g.font = 'bold 26px Verdana, sans-serif'; g.fillStyle = '#1a2fa8';
    g.fillText(m, 158, y + 30);
  });

  // la photo pixelisée
  for (let y = 0; y < 10; y++) for (let x = 0; x < 12; x++) {
    const v = 120 + ((x * 37 + y * 53) % 90);
    g.fillStyle = `rgb(${v + 40},${v + 10},${v})`;
    g.fillRect(392 + x * 22, 330 + y * 22, 22, 22);
  }
  g.strokeStyle = '#444'; g.lineWidth = 2; g.strokeRect(392, 330, 264, 220);

  // le texte en Times
  g.font = '25px "Times New Roman", serif'; g.fillStyle = '#222';
  ['La sophrologie est une méthode', 'de relaxation. Elle vous aide à', 'mieux dormir et à gérer le stress.', 'Je vous reçois dans mon cabinet,', 'sur rendez-vous par téléphone.']
    .forEach((l, i) => g.fillText(l, 392, 590 + i * 34));
  g.font = 'bold 22px Verdana, sans-serif'; g.fillStyle = '#c00000';
  g.fillText('Appelez le répondeur !', 680, 360);
  g.font = '20px Verdana, sans-serif'; g.fillStyle = '#333';
  ['Séance : voir', 'la page tarifs', '(en construction)'].forEach((l, i) => g.fillText(l, 680, 400 + i * 30));

  // le compteur de visites
  g.font = '20px Verdana, sans-serif'; g.fillStyle = '#333';
  g.fillText('Vous êtes le visiteur n°', 120, 742);
  [0, 0, 1, 2, 4, 7].forEach((n, i) => {
    g.fillStyle = '#000'; g.fillRect(120 + i * 34, 762, 30, 42);
    g.font = 'bold 30px "Courier New", monospace'; g.fillStyle = '#39ff14';
    g.fillText(String(n), 127 + i * 34, 784);
  });

  // les badges et le bandeau « en construction »
  const badges = [['Meilleur affichage', '800 x 600', '#7a7a7a'], ['100 %', 'fait main', '#b22222'], ['IE 6', 'recommandé', '#2a5db0']];
  badges.forEach(([a, b, coul], i) => {
    const x = 392 + i * 176;
    g.fillStyle = coul; g.fillRect(x, 760, 160, 52);
    g.font = 'bold 17px Verdana, sans-serif'; g.fillStyle = '#fff';
    g.fillText(a, x + 8, 778); g.fillText(b, x + 8, 798);
  });
  g.save();
  g.beginPath(); g.rect(112, 836, 800, 56); g.clip();
  for (let x = 60; x < 960; x += 56) {
    g.fillStyle = '#f2c400'; g.beginPath(); g.moveTo(x, 836); g.lineTo(x + 28, 836); g.lineTo(x - 28, 892); g.lineTo(x - 56, 892); g.fill();
    g.fillStyle = '#111'; g.beginPath(); g.moveTo(x + 28, 836); g.lineTo(x + 56, 836); g.lineTo(x, 892); g.lineTo(x - 28, 892); g.fill();
  }
  g.restore();
  g.font = 'bold 28px Verdana, sans-serif'; g.fillStyle = '#fff'; g.strokeStyle = '#000'; g.lineWidth = 4;
  g.strokeText('SITE EN CONSTRUCTION', 330, 865); g.fillText('SITE EN CONSTRUCTION', 330, 865);
  g.font = 'italic 18px "Times New Roman", serif'; g.fillStyle = '#555';
  g.fillText('Dernière mise à jour : le 14/02/2007. © 2007 Lila Fougère', 300, 928);
  return c;
}
