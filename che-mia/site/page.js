// Ché Mia : la maison du Nord. Le contenu propre au commerce vient de contenu.js.
// Le mouvement joue toujours en entier : on ne lit jamais le réglage « animations réduites » du système.
// Mode calme seulement sur demande, avec ?calme=1 (classe calme sur html).
(function () {
  'use strict';
  var C = window.CONTENU, D = document, H = D.documentElement;
  var calme = H.classList.contains('calme');
  var $ = function (s, p) { return (p || D).querySelector(s); };
  var $$ = function (s, p) { return Array.prototype.slice.call((p || D).querySelectorAll(s)); };
  var borne = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var seg = function (p, a, b) { return borne((p - a) / (b - a), 0, 1); };
  var doux = function (t) { return t * t * (3 - 2 * t); };
  var graine = 7; function alea() { graine = (graine * 16807) % 2147483647; return (graine - 1) / 2147483646; }
  var entre = function (a, b) { return a + (b - a) * alea(); };
  var hasard = function (a, b) { return a + (b - a) * Math.random(); };

  /* ---------- Couleurs, liens, menu ---------- */
  function palette(nom) {
    var P = C.palettes[nom]; if (!P) return;
    for (var k in P) H.style.setProperty('--' + k, P[k]);
    var m = $('meta[name=theme-color]'); if (m) m.content = P.accent;
  }
  palette(new URLSearchParams(location.search).get('palette') || 'cerise');
  addEventListener('message', function (e) { if (e.data && e.data.type === 'kazura-couleur') palette(e.data.palette); });
  $$('[data-itin]').forEach(function (a) { a.href = C.carteLien; });

  var liens = $('#liens'), menuB = $('#menu-b');
  function fermerMenu() { liens.classList.remove('ouvert'); menuB.setAttribute('aria-expanded', 'false'); menuB.textContent = 'Menu'; }
  menuB.addEventListener('click', function () { var o = liens.classList.toggle('ouvert'); menuB.setAttribute('aria-expanded', o); menuB.textContent = o ? 'Fermer' : 'Menu'; });
  liens.addEventListener('click', function (e) { if (e.target.closest('a')) fermerMenu(); });

  /* ---------- Le moineau ---------- */
  var MOINEAU = '<svg viewBox="-6 0 72 50" aria-hidden="true"><path class="m-queue" d="M10 24L-5 14 1 31z"/><rect class="m-patte" x="23" y="38" width="4" height="11" rx="2"/><rect class="m-patte" x="32" y="38" width="4" height="11" rx="2"/><ellipse class="m-corps" cx="27" cy="28" rx="19" ry="13.5"/><ellipse class="m-ventre" cx="31" cy="32" rx="12" ry="8"/><g class="m-tete"><circle class="m-calotte" cx="44" cy="17" r="11"/><path class="m-joue" d="M35 20q9.500 8 19 0-1 9-9.500 9T35 20z"/><circle cx="47" cy="15" r="2.5" fill="#1a0f0a"/><path class="m-bec" d="M54 13.500l11 4.500-11 4z"/></g><path class="m-aile" d="M12 24q14-14 27 2-14 12-27-2z"/></svg>';

  // Une volée : des moineaux posés à des places fixes (en % de la boîte), qui s'envolent quand on approche et reviennent.
  function volee(boite, places, rayon) {
    var couche = D.createElement('div'); couche.className = 'vol'; couche.setAttribute('aria-hidden', 'true'); boite.appendChild(couche);
    var oiseaux = places.map(function (p, i) {
      var el = D.createElement('i'); el.className = 'moineau'; el.innerHTML = MOINEAU;
      el.style.left = p[0] + '%'; el.style.top = p[1] + '%'; el.style.setProperty('--dp', (-i * 1.7).toFixed(1) + 's');
      couche.appendChild(el);
      return { el: el, sens: p[2] || 1, etat: 'pose', t: 0 };
    });
    function poser(o) { o.etat = 'pose'; o.el.classList.remove('vole'); o.el.classList.add('pose', 'atterrit'); o.el.style.setProperty('--sens', o.sens); setTimeout(function () { o.el.classList.remove('atterrit'); }, 500); }
    function revenir(o, duree) {
      if (o.etat !== 'loin') return; o.etat = 'retour';
      o.el.classList.remove('sans'); void o.el.offsetWidth;
      o.el.style.setProperty('--dur', (duree || 1.3) + 's');
      o.el.style.setProperty('--sens', o.dx > 0 ? -1 : 1);
      o.el.style.setProperty('--tx', '0px'); o.el.style.setProperty('--ty', '0px');
      clearTimeout(o.t); o.t = setTimeout(function () { poser(o); }, (duree || 1.3) * 1000);
    }
    function partir(o, sansRetour) {
      if (o.etat !== 'pose') return; o.etat = 'loin';
      var r = boite.getBoundingClientRect();
      o.dx = hasard(-.75, .75) * Math.max(r.width, 260); o.dy = -hasard(.5, 1.05) * Math.max(r.height, 320);
      o.el.classList.remove('pose', 'atterrit'); o.el.classList.add('vole');
      o.el.style.setProperty('--dur', hasard(.8, 1.15).toFixed(2) + 's');
      o.el.style.setProperty('--sens', o.dx > 0 ? 1 : -1);
      o.el.style.setProperty('--tx', o.dx.toFixed(0) + 'px'); o.el.style.setProperty('--ty', o.dy.toFixed(0) + 'px');
      clearTimeout(o.t); if (!sansRetour) o.t = setTimeout(function () { revenir(o); }, hasard(2400, 5200));
    }
    function pres(x, y, type) {
      var r = boite.getBoundingClientRect(), R = Math.max(70, r.width * (type === 'mouse' ? rayon : rayon * 1.7));
      oiseaux.forEach(function (o, i) {
        if (o.etat !== 'pose') return;
        var ox = r.left + places[i][0] / 100 * r.width, oy = r.top + places[i][1] / 100 * r.height - r.width * .04;
        if (Math.hypot(x - ox, y - oy) < R) partir(o);
      });
    }
    boite.addEventListener('pointermove', function (e) { pres(e.clientX, e.clientY, e.pointerType); });
    boite.addEventListener('pointerdown', function (e) { pres(e.clientX, e.clientY, 'touch'); });
    return {
      oiseaux: oiseaux,
      tousPartent: function (sansRetour) { oiseaux.forEach(function (o, i) { setTimeout(function () { partir(o, sansRetour); }, i * 70); }); },
      tousReviennent: function () { oiseaux.forEach(function (o, i) { setTimeout(function () { revenir(o); }, i * 160); }); },
      arriver: function (delai) { // au chargement : ils arrivent de loin et se posent l'un après l'autre
        if (calme) { oiseaux.forEach(poser); return; }
        var r = boite.getBoundingClientRect();
        oiseaux.forEach(function (o, i) {
          o.etat = 'loin'; o.dx = (i % 2 ? 1 : -1) * hasard(.5, .9) * Math.max(r.width, 260);
          o.el.classList.add('sans', 'vole');
          o.el.style.setProperty('--tx', o.dx.toFixed(0) + 'px'); o.el.style.setProperty('--ty', (-hasard(.7, 1.1) * Math.max(r.height, 320)).toFixed(0) + 'px');
          o.t = setTimeout(function () { revenir(o, 1.5); }, delai + i * 190);
        });
      },
    };
  }

  /* ---------- Accueil : le titre, la façade, la porte, le paillasson ---------- */
  var titre = $('#titre'), tilt = [-4, 3, -2, 0, 4, -3, 2];
  titre.innerHTML = C.nom.split('').map(function (l, i) { return l === ' ' ? '<span class="l esp" aria-hidden="true"></span>' : '<span class="l" aria-hidden="true" style="--i:' + i + ';--r:' + tilt[i % tilt.length] + 'deg">' + l + '</span>'; }).join('');

  var maison = $('#maison');
  var nuee = volee(maison, [[13.3, 34.6, 1], [26.7, 23.1, 1], [46.8, 6, -1], [53.6, 6, 1], [66.7, 17.4, -1], [86.7, 34.6, -1], [79.2, 15.4, 1]], .15);
  nuee.arriver(2300);

  var porte = $('#porte');
  function allerAuNom() { $('#nom').scrollIntoView({ behavior: calme ? 'auto' : 'smooth' }); }
  function ouvrirPorte(puis) {
    if (porte.classList.contains('ouverte')) { if (puis) allerAuNom(); return; }
    porte.classList.add('ouverte'); porte.setAttribute('aria-label', 'Entrer');
    if (puis) setTimeout(allerAuNom, calme ? 0 : 850);
  }
  porte.addEventListener('click', function () { ouvrirPorte(true); });
  porte.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ouvrirPorte(true); } });
  $('.seuil').addEventListener('click', allerAuNom);
  $('#pousser').addEventListener('click', function (e) { e.preventDefault(); ouvrirPorte(true); });
  $$('.fenetre-e').forEach(function (f) {
    var bascule = function () { f.classList.toggle('eteinte'); };
    f.addEventListener('click', bascule);
    f.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); bascule(); } });
  });

  var tapis = $('#paillasson'), frotte = 0, dernierX = null, sensF = 0, propre = false, astuce = $('#astuce-accueil');
  function poussiere(n) {
    for (var i = 0; i < n; i++) {
      var p = D.createElement('i'); p.className = 'poussiere';
      p.style.left = 'calc(5.5% + ' + hasard(2, 34).toFixed(1) + 'cqw)'; p.style.bottom = hasard(4, 9).toFixed(1) + 'cqw';
      p.style.setProperty('--px', hasard(-9, 9).toFixed(1) + 'cqw'); p.style.setProperty('--py', hasard(-16, -6).toFixed(1) + 'cqw');
      maison.appendChild(p); p.addEventListener('animationend', function () { this.remove(); });
    }
  }
  function frotter() {
    if (propre) return;
    frotte++; tapis.classList.remove('frotte'); void tapis.offsetWidth; tapis.classList.add('frotte');
    if (!calme) poussiere(4);
    if (frotte >= 3) {
      propre = true; tapis.classList.add('propre'); tapis.setAttribute('aria-label', 'Bienvenue : entrer');
      astuce.textContent = 'Bienvenue. Les pieds sont propres : entrez donc.';
      setTimeout(function () { ouvrirPorte(false); }, 300); nuee.tousPartent();
    }
  }
  tapis.addEventListener('pointermove', function (e) {
    if (dernierX === null) { dernierX = e.clientX; return; }
    var d = e.clientX - dernierX; if (Math.abs(d) < 9) return;
    var s = d > 0 ? 1 : -1; if (sensF && s !== sensF) frotter(); sensF = s; dernierX = e.clientX;
  });
  tapis.addEventListener('pointerleave', function () { dernierX = null; sensF = 0; });
  tapis.addEventListener('click', function () { if (propre) allerAuNom(); else frotter(); });

  /* ---------- Les assiettes ---------- */
  var DECORS = {
    fleurs: { nom: 'à fleurs bleues', base: '#fffdf6', c: '#2456a6', c2: '#f7c843' },
    rayons: { nom: 'à rayons rouges', base: '#fff3d9', c: '#d3212f', c2: '#d3212f' },
    feuilles: { nom: 'à feuilles vertes', base: '#f2f6e4', c: '#1c5546', c2: '#3aa583' },
    festons: { nom: 'à festons jaunes', base: '#fffaf0', c: '#e7aa16', c2: '#b8472d' },
    bandes: { nom: 'à bandes brunes', base: '#f7e7c9', c: '#7a3b1c', c2: '#d0623f' },
    losanges: { nom: 'à losanges roses', base: '#ffeee9', c: '#e2578a', c2: '#2b1710' },
  };
  function pt(r, a) { var t = (a - 90) * Math.PI / 180; return (50 + r * Math.cos(t)).toFixed(2) + ' ' + (50 + r * Math.sin(t)).toFixed(2); }
  function assiette(decor, centre) {
    var d = DECORS[decor], s = '<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="49" fill="' + d.base + '"/>', k, c = '';
    if (decor === 'fleurs') {
      for (k = 0; k < 10; k++) s += '<ellipse cx="50" cy="11.5" rx="5.600" ry="8.600" fill="' + d.c + '" transform="rotate(' + k * 36 + ' 50 50)"/>';
      for (k = 0; k < 6; k++) c += '<ellipse cx="50" cy="40" rx="4.600" ry="8" fill="' + d.c + '" transform="rotate(' + k * 60 + ' 50 50)"/>';
      c += '<circle cx="50" cy="50" r="5" fill="' + d.c2 + '"/>';
    } else if (decor === 'rayons') {
      for (k = 0; k < 12; k++) s += '<path d="M' + pt(49, k * 30 - 7.5) + 'A49 49 0 0 1 ' + pt(49, k * 30 + 7.5) + 'L' + pt(33, k * 30 + 7.5) + 'A33 33 0 0 0 ' + pt(33, k * 30 - 7.5) + 'z" fill="' + d.c + '"/>';
      c = '<circle cx="50" cy="50" r="7" fill="' + d.c + '"/>';
    } else if (decor === 'feuilles') {
      for (k = 0; k < 8; k++) s += '<path d="M50 4q9 8 0 18-9-10 0-18z" fill="' + (k % 2 ? d.c2 : d.c) + '" transform="rotate(' + k * 45 + ' 50 50) rotate(30 50 13)"/>';
      for (k = -1; k < 2; k++) c += '<path d="M50 36q8 8 0 18-8-10 0-18z" fill="' + (k ? d.c2 : d.c) + '" transform="rotate(' + k * 42 + ' 50 58)"/>';
    } else if (decor === 'festons') {
      for (k = 0; k < 14; k++) s += '<circle cx="' + pt(41.5, k * 360 / 14).replace(' ', '" cy="') + '" r="7.600" fill="' + d.c + '"/>';
      s += '<circle cx="50" cy="50" r="33" fill="none" stroke="' + d.c2 + '" stroke-width="3.400"/>';
      c = '<circle cx="50" cy="50" r="8" fill="' + d.c + '"/>';
    } else if (decor === 'bandes') {
      s += '<circle cx="50" cy="50" r="44.5" fill="none" stroke="' + d.c + '" stroke-width="7"/><circle cx="50" cy="50" r="35.5" fill="none" stroke="' + d.c2 + '" stroke-width="5"/>';
      c = '<circle cx="50" cy="50" r="6" fill="' + d.c + '"/>';
    } else {
      for (k = 0; k < 8; k++) s += '<path d="M50 3l7.500 9.500-7.500 9.500-7.500-9.500z" fill="' + (k % 2 ? d.c2 : d.c) + '" transform="rotate(' + k * 45 + ' 50 50)"/>';
      c = '<path d="M50 38l9 12-9 12-9-12z" fill="' + d.c + '"/>';
    }
    return s + '<circle cx="50" cy="50" r="30" fill="rgba(43,23,16,.055)"/>' + (centre ? c : '') + '</svg>';
  }
  var DOS = '<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="49" fill="#f1dcb0"/><circle cx="50" cy="50" r="33" fill="none" stroke="#dfc48f" stroke-width="7"/><path d="M36 62V52h4v-4h4v-4h4v-4h4v4h4v4h4v4h4v10z" fill="#c9a66b"/></svg>';

  /* ---------- Le nom : assiettes au mur, cadre qui penche, phrase qui s'allume ---------- */
  var mur = $('#mur-assiettes'), cadrePhoto = $('#cadre-photo');
  [['fleurs', 'Sur place'], ['rayons', 'À emporter'], ['feuilles', 'Wazemmes, Lille'], ['festons', 'Nouvelle équipe, octobre 2026']].forEach(function (a, i) {
    var b = D.createElement('button'); b.type = 'button'; b.className = 'assiette-mur'; b.style.setProperty('--d', (i * .14).toFixed(2) + 's');
    b.setAttribute('aria-label', a[1] + ' : faire tourner l’assiette');
    b.innerHTML = '<span class="am">' + assiette(a[0], false) + '<b>' + a[1] + '</b></span>';
    b.addEventListener('click', function () { b.classList.remove('tourne'); void b.offsetWidth; b.classList.add('tourne'); });
    if (i < 3) mur.insertBefore(b, cadrePhoto); else mur.appendChild(b);
  });
  var phrase = $('#phrase-nom'), mots = [];
  phrase.innerHTML = phrase.innerHTML.split(/\s+/).map(function (m) { return '<span class="mot">' + m + '</span>'; }).join(' ');
  mots = $$('.mot', phrase);

  /* ---------- Ce qui se balance : les torchons et le cadre (petits ressorts) ---------- */
  var corps = [], eveille = false;
  function corpsNouveau(el, raideur, frein, limite) { var o = { el: el, a: 0, v: 0, k: raideur, c: frein, lim: limite }; corps.push(o); return o; }
  function pousser(o, f) { if (calme) return; o.v += f; if (!eveille) { eveille = true; requestAnimationFrame(pas); } }
  function pas() {
    var encore = false;
    corps.forEach(function (o) {
      if (!o.a && !o.v) return;
      o.v += -o.k * o.a; o.v *= o.c; o.a += o.v;
      if (o.a > o.lim) { o.a = o.lim; o.v *= -.35; } else if (o.a < -o.lim) { o.a = -o.lim; o.v *= -.35; }
      if (Math.abs(o.a) < .04 && Math.abs(o.v) < .04) { o.a = 0; o.v = 0; } else encore = true;
      o.el.style.setProperty('--a', o.a.toFixed(2) + 'deg');
    });
    if (encore) requestAnimationFrame(pas); else eveille = false;
  }
  var cadreCorps = corpsNouveau(cadrePhoto, .05, .955, 9);
  cadrePhoto.addEventListener('click', function () { pousser(cadreCorps, hasard(0, 1) < .5 ? -1.6 : 1.6); });
  cadrePhoto.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') pousser(cadreCorps, .7); });

  /* ---------- La table : sur place ou à emporter ---------- */
  var scene = $('#scene-table'), tableMot = $('#table-mot');
  $('#assiette-t').insertAdjacentHTML('afterbegin', assiette('fleurs', false));
  var MOTS_TABLE = { place: 'La table est mise. Asseyez-vous.', emporte: 'C’est emballé. On ne repart jamais de la maison les mains vides.' };
  $$('.pilule').forEach(function (b) {
    b.addEventListener('click', function () {
      var m = b.dataset.mode;
      $$('.pilule').forEach(function (x) { var a = x === b; x.classList.toggle('actif', a); x.setAttribute('aria-pressed', a); });
      scene.classList.toggle('mode-place', m === 'place'); scene.classList.toggle('mode-emporte', m === 'emporte');
      tableMot.textContent = MOTS_TABLE[m];
    });
  });

  /* ---------- La carte : la porte du frigo ---------- */
  $('#rubriques').innerHTML = C.rubriques.map(function (r) { return '<div class="rubrique"><h4>' + r + '</h4><p><i></i><b>.. , .. €</b></p><p><i></i><b>.. , .. €</b></p></div>'; }).join('');
  var COULEURS = ['#d3212f', '#1c5546', '#e7aa16', '#2456a6', '#b8472d', '#e2578a', '#1d7a5d'];
  var boiteLettres = $('#lettres'), frigoPorte = $('#frigo-porte');
  C.aimants.split('').forEach(function (l, i) {
    var s = D.createElement('span'); s.className = 'lettre' + (l === ' ' ? ' vide' : ''); s.textContent = l === ' ' ? '' : l;
    s.style.cssText = '--c:' + COULEURS[i % COULEURS.length] + ';--r:' + entre(-9, 9).toFixed(1) + 'deg;--i:' + i;
    boiteLettres.appendChild(s);
    if (l !== ' ') glisser(s, { borne: frigoPorte, debut: function () { s.classList.add('libre'); } });
  });
  // Faire glisser un élément au doigt ou à la souris (il reste où on le lâche, sauf si fin() rend 'retour').
  function glisser(el, opt) {
    var x0 = 0, y0 = 0, dx = 0, dy = 0, pris = false, bouge = false, lim = null;
    function poser() { el.style.setProperty('--dx', dx.toFixed(1) + 'px'); el.style.setProperty('--dy', dy.toFixed(1) + 'px'); }
    el.addEventListener('pointerdown', function (e) {
      if (e.button) return;
      pris = true; bouge = false; try { el.setPointerCapture(e.pointerId); } catch (err) {}
      x0 = e.clientX - dx; y0 = e.clientY - dy; el.classList.add('pris'); el.classList.remove('retour');
      if (opt.borne) { var b = opt.borne.getBoundingClientRect(), r = el.getBoundingClientRect(); lim = [dx + b.left + 6 - r.left, dx + b.right - 6 - r.right, dy + b.top + 6 - r.top, dy + b.bottom - 6 - r.bottom]; }
      if (opt.debut) opt.debut();
      e.preventDefault();
    });
    el.addEventListener('pointermove', function (e) {
      if (!pris) return;
      dx = e.clientX - x0; dy = e.clientY - y0;
      if (lim) { dx = borne(dx, lim[0], lim[1]); dy = borne(dy, lim[2], lim[3]); }
      if (Math.hypot(dx, dy) > 5) bouge = true;
      poser(); if (opt.bouge) opt.bouge(dx, dy);
    });
    function fin() {
      if (!pris) return; pris = false; el.classList.remove('pris');
      if (opt.fin && opt.fin(dx, dy, bouge) === 'retour') { dx = 0; dy = 0; el.classList.add('retour'); poser(); }
    }
    el.addEventListener('pointerup', fin); el.addEventListener('pointercancel', fin);
    return { aller: function (x, y) { dx = x; dy = y; el.classList.add('retour'); poser(); } };
  }
  var feuille = $('#feuille'), raccrocher = $('#raccrocher'), zone = $('.feuille-zone');
  zone.insertBefore(raccrocher, zone.firstChild);
  var tenus = [
    { el: $('#aimant-1'), hors: false, fuite: [-34, -92] },
    { el: $('#aimant-2'), hors: false, fuite: [30, -96] },
  ];
  function etatFeuille() {
    var g = !tenus[0].hors, d = !tenus[1].hors;
    feuille.classList.toggle('pend-g', g && !d); feuille.classList.toggle('pend-d', d && !g); feuille.classList.toggle('tombe', !g && !d);
    raccrocher.hidden = g || d;
  }
  tenus.forEach(function (t) {
    t.g = glisser(t.el, {
      borne: frigoPorte,
      debut: function () { $$('.aimant.gros').forEach(function (a) { a.classList.remove('inviter'); }); },
      bouge: function (x, y) { var h = Math.hypot(x, y) > 44; if (h !== t.hors) { t.hors = h; etatFeuille(); } },
      fin: function (x, y, bouge) {
        if (!bouge) { // simple toucher : l'aimant saute de côté, ou revient
          t.hors = !t.hors; etatFeuille();
          if (t.hors) { t.g.aller(t.fuite[0], t.fuite[1]); return; }
          return 'retour';
        }
        if (Math.hypot(x, y) < 76) { t.hors = false; etatFeuille(); return 'retour'; }
        t.hors = true; etatFeuille();
      },
    });
    t.el.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return; e.preventDefault();
      t.hors = !t.hors; etatFeuille(); if (t.hors) t.g.aller(t.fuite[0], t.fuite[1]); else t.g.aller(0, 0);
    });
  });
  raccrocher.addEventListener('click', function () { tenus.forEach(function (t) { t.hors = false; t.g.aller(0, 0); }); etatFeuille(); });

  /* ---------- Le buffet : le jeu des paires ---------- */
  var jeu = $('#jeu'), faits = $('#faits'), elCoups = $('#coups'), elTrouvees = $('#trouvees'), bravo = $('#bravo');
  var ouverte = null, bloque = false, coups = 0, trouvees = 0;
  function melanger() {
    var paquet = []; C.paires.forEach(function (p, k) { paquet.push(k, k); });
    for (var i = paquet.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = paquet[i]; paquet[i] = paquet[j]; paquet[j] = t; }
    jeu.innerHTML = ''; faits.innerHTML = ''; bravo.textContent = ''; ouverte = null; bloque = false; coups = 0; trouvees = 0;
    elCoups.textContent = '0'; elTrouvees.textContent = '0';
    paquet.forEach(function (k, n) {
      var p = C.paires[k], b = D.createElement('button'); b.type = 'button'; b.className = 'pa'; b.style.setProperty('--i', n);
      b.setAttribute('aria-label', 'Assiette retournée, numéro ' + (n + 1));
      b.innerHTML = '<span class="pa-in"><span class="cote verso">' + DOS + '</span><span class="cote recto">' + assiette(p.decor, true) + '</span></span>';
      var c = { el: b, k: k, n: n };
      b.addEventListener('click', function () { retourner(c); });
      jeu.appendChild(b);
    });
  }
  function retourner(c) {
    if (bloque || c.el.classList.contains('vue') || c.el.classList.contains('trouvee')) return;
    c.el.classList.add('vue'); c.el.setAttribute('aria-label', 'Assiette ' + DECORS[C.paires[c.k].decor].nom);
    if (!ouverte) { ouverte = c; return; }
    coups++; elCoups.textContent = coups;
    var a = ouverte; ouverte = null;
    if (a.k === c.k) {
      trouvees++; elTrouvees.textContent = trouvees;
      setTimeout(function () { [a, c].forEach(function (x) { x.el.classList.remove('vue'); x.el.classList.add('trouvee'); }); }, calme ? 0 : 420);
      var p = C.paires[c.k], li = D.createElement('li'); li.innerHTML = '<b>' + p.titre + '</b>' + p.texte; faits.appendChild(li);
      if (trouvees === C.paires.length) setTimeout(function () { bravo.textContent = 'Toute la vaisselle est rangée, en ' + coups + ' coups.'; $$('.pa', jeu).forEach(function (b, i) { setTimeout(function () { b.classList.remove('trouvee'); void b.offsetWidth; b.classList.add('trouvee'); }, i * 60); }); }, 900);
    } else {
      bloque = true;
      setTimeout(function () {
        [a, c].forEach(function (x) { x.el.classList.add('non'); });
        setTimeout(function () { [a, c].forEach(function (x) { x.el.classList.remove('vue', 'non'); x.el.setAttribute('aria-label', 'Assiette retournée, numéro ' + (x.n + 1)); }); bloque = false; }, 420);
      }, calme ? 500 : 800);
    }
  }
  $('#rejouer').addEventListener('click', melanger);
  melanger();

  /* ---------- Les horaires : un torchon par jour ---------- */
  var torchons = $('#torchons'), tringle = $('.tringle'), aujourdhui = (new Date().getDay() + 6) % 7, corpsTorchons = [];
  C.jours.forEach(function (j, i) {
    var li = D.createElement('li'); li.className = 'torchon' + (i === aujourdhui ? ' jourj' : ''); li.style.setProperty('--i', i);
    li.innerHTML = '<div class="pend"><div><span class="jour">' + j + '</span><span class="heures"><span>.. h ..</span><span>à .. h ..</span></span>' + (i === aujourdhui ? '<span class="auj">Aujourd’hui</span>' : '') + '</div></div>';
    torchons.appendChild(li);
    var o = corpsNouveau(li.firstChild, .045 + alea() * .02, .95, 16); o.li = li; corpsTorchons.push(o);
    li.addEventListener('click', function () { pousser(o, hasard(0, 1) < .5 ? -3.4 : 3.4); });
  });
  var ventX = null;
  tringle.addEventListener('pointermove', function (e) {
    if (ventX === null) { ventX = e.clientX; return; }
    var d = e.clientX - ventX; ventX = e.clientX; if (!d) return;
    corpsTorchons.forEach(function (o) { var r = o.li.getBoundingClientRect(); if (e.clientX > r.left - 6 && e.clientX < r.right + 6 && e.clientY > r.top) pousser(o, borne(d * .1, -1.6, 1.6)); });
  });
  tringle.addEventListener('pointerleave', function () { ventX = null; });

  /* ---------- Les toits : une rangée de maisons à pignons ---------- */
  function rangee(largeur, sol, hmin, hmax, couleurs, vitres, lmin, lmax) {
    var x = -12, s = '';
    while (x < largeur + 12) {
      var l = entre(lmin, lmax), h = entre(hmin, hmax), haut = sol - h, col = couleurs[Math.floor(alea() * couleurs.length)], t = alea(), m = l / 9, d;
      if (t < .58) d = 'M' + x + ' ' + sol + 'V' + (haut + 3 * m) + 'h' + m + 'v' + -m + 'h' + m + 'v' + -m + 'h' + m + 'v' + -m + 'h' + 3 * m + 'v' + m + 'h' + m + 'v' + m + 'h' + m + 'v' + m + 'h' + m + 'V' + sol + 'z';
      else if (t < .82) d = 'M' + x + ' ' + sol + 'V' + (haut + l * .42) + 'L' + (x + l / 2) + ' ' + haut + 'L' + (x + l) + ' ' + (haut + l * .42) + 'V' + sol + 'z';
      else d = 'M' + x + ' ' + sol + 'V' + (haut + m) + 'h' + l * .6 + 'v' + -m * 1.6 + 'h' + l * .18 + 'v' + m * 1.6 + 'h' + l * .22 + 'V' + sol + 'z';
      s += '<path d="' + d.replace(/(\d+\.\d{2})\d+/g, '$1') + '" fill="' + col + '"/>';
      if (vitres) {
        var fw = l * .2, fh = l * .28;
        for (var y = haut + l * .62; y < sol - fh * .6; y += fh * 1.7) for (var c = 0; c < 2; c++) s += '<rect x="' + (x + l * (.2 + c * .4)).toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + fw.toFixed(1) + '" height="' + fh.toFixed(1) + '" rx="2" fill="' + (alea() < .55 ? vitres[0] : vitres[1]) + '"/>';
      }
      x += l + 1;
    }
    return s;
  }
  graine = 31;
  $('#vue').innerHTML = '<svg viewBox="0 0 800 560" preserveAspectRatio="xMidYMax slice">'
    + '<g class="nu" fill="#fff"><ellipse cx="130" cy="96" rx="78" ry="24"/><ellipse cx="110" cy="76" rx="40" ry="28"/><ellipse cx="160" cy="72" rx="34" ry="24"/></g>'
    + '<g class="nu b" fill="#fff"><ellipse cx="520" cy="150" rx="62" ry="19"/><ellipse cx="505" cy="134" rx="32" ry="22"/></g>'
    + '<g fill="#a9c9d6"><rect x="592" y="150" width="40" height="330"/><path d="M586 150h52l-10-34h-32z"/><rect x="600" y="84" width="24" height="34"/><path d="M596 84h32l-16-46z"/></g><circle cx="612" cy="196" r="11" fill="#eaf5f8"/>'
    + rangee(800, 470, 110, 190, ['#cf9a84', '#c48a72', '#d9ab8c'], null, 66, 104)
    + rangee(800, 562, 150, 250, ['#b8472d', '#8f3220', '#d0623f', '#dba25c', '#7a3b1c'], ['#f7d774', '#fff3d9'], 84, 128) + '</svg>';
  graine = 12;
  $('#toits').innerHTML = '<svg viewBox="0 0 1600 130" preserveAspectRatio="xMidYMax slice">' + rangee(1600, 131, 46, 112, ['#2b1710'], ['#f7c843', '#4a2616'], 62, 108) + '</svg>';
  var fenetre = $('#fenetre'), rideauxFermes = false;
  function basculeRideaux() { rideauxFermes = !rideauxFermes; majRideaux(); }
  function majRideaux() { var r = fenetre.getBoundingClientRect(), vh = innerHeight; fenetre.style.setProperty('--o', rideauxFermes ? 0 : (calme ? 1 : doux(seg(r.top, vh * .86, vh * .3)).toFixed(3))); }
  fenetre.addEventListener('click', basculeRideaux);
  fenetre.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); basculeRideaux(); } });

  /* ---------- Le téléphone à cadran ---------- */
  var disque = $('#disque'), compose = $('#compose'), telephone = $('#telephone'), tourne = false, chiffres = [];
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].forEach(function (c, k) {
    var a = (-45 - 27 * k) * Math.PI / 180, b = D.createElement('button'); b.type = 'button'; b.className = 'trou';
    b.style.left = (50 + 37 * Math.cos(a)).toFixed(2) + '%'; b.style.top = (50 + 37 * Math.sin(a)).toFixed(2) + '%';
    b.setAttribute('aria-label', 'Composer le ' + c); b.innerHTML = '<span>' + c + '</span>';
    b.addEventListener('click', function () {
      if (tourne) return; tourne = true; telephone.classList.remove('sonne');
      var angle = 73 + 27 * k, aller = calme ? 0 : .25 + angle / 360 * .8, retour = calme ? 0 : .2 + angle / 360 * 1.1;
      disque.style.setProperty('--t', aller + 's'); disque.style.setProperty('--rot', angle + 'deg'); disque.style.transform = 'rotate(' + angle + 'deg)';
      setTimeout(function () {
        disque.style.setProperty('--t', retour + 's'); disque.style.setProperty('--rot', '0deg'); disque.style.transform = 'none';
        setTimeout(function () {
          tourne = false; if (chiffres.length >= 10) chiffres = [];
          chiffres.push(c);
          compose.textContent = chiffres.length < 10 ? 'Vous composez : ' + chiffres.join(' ') : 'Dix chiffres : ' + chiffres.join(' ') + '. Ça sonne dans le vide : le vrai numéro s’écrira ici.';
        }, retour * 1000 + 40);
      }, aller * 1000 + 60);
    });
    disque.appendChild(b);
  });

  /* ---------- Le pied : deux moineaux sur le paillasson ---------- */
  var nueePied = volee($('.tapis'), [[18, 2, 1], [74, 2, -1]], .2);

  /* ---------- Les rangées de pignons (transitions) ---------- */
  var MOTIF = [.25, .5, .75, 1, 1, .75, .5, .25];
  var bandes = $$('[data-pignons]').map(function (b) {
    var n = innerWidth < 700 ? 16 : innerWidth < 1300 ? 24 : 32, cols = [];
    for (var i = 0; i < n; i++) { var c = D.createElement('i'); c.style.setProperty('--h', MOTIF[i % 8]); b.appendChild(c); cols.push({ el: c, o: alea() * .42 }); }
    return { el: b, cols: cols };
  });

  /* ---------- Apparitions ---------- */
  var aVoir = $$('.nom-texte,.mur-assiettes,.set,.scene-table,.carte-texte,.frigo,.buffet-texte,.meuble,.horaires-tete,.tringle,.fenetre,.venir-texte,.appeler-texte,.telephone,.pied-grille');
  $$('.nom-texte,.carte-texte,.buffet-texte,.horaires-tete,.fenetre,.venir-texte,.appeler-texte,.telephone,.pied-grille').forEach(function (e) { e.classList.add('monte'); });
  function vu(e) {
    if (e.classList.contains('vu')) return; e.classList.add('vu');
    if (e.classList.contains('frigo')) { setTimeout(function () { $$('.aimant.gros').forEach(function (a) { a.classList.add('inviter'); }); }, 900); }
    if (e.classList.contains('telephone') && !calme) { e.classList.add('sonne'); }
    if (e.classList.contains('tringle')) setTimeout(function () { corpsTorchons.forEach(function (o, i) { pousser(o, (i % 2 ? -1 : 1) * hasard(1.4, 2.6)); }); }, 700);
  }
  if (calme || !('IntersectionObserver' in window)) aVoir.forEach(vu);
  else {
    var io = new IntersectionObserver(function (es) { es.forEach(function (x) { if (x.isIntersecting) { vu(x.target); io.unobserve(x.target); } }); }, { threshold: .16, rootMargin: '0px 0px -6% 0px' });
    aVoir.forEach(function (e) { io.observe(e); });
  }

  /* ---------- Le défilement : un seul passage par image ---------- */
  var fil = $('#fil'); fil.innerHTML = MOINEAU; fil.classList.add('pose');
  var frise1 = $('#frise-1'), frise2 = $('#frise-2'), ciel = $('.ciel'), accueil = $('#accueil');
  var sections = $$('main section[id]'), liensNav = $$('a', liens), dernierY = scrollY, attente = false, sensFil = 1, partisPourDefil = false, reposFil = 0;
  function maj() {
    attente = false;
    var y = scrollY, vh = innerHeight, dv = y - dernierY, total = Math.max(1, D.scrollingElement.scrollHeight - vh), p = borne(y / total, 0, 1);
    dernierY = y;
    // le moineau de la barre
    if (dv) sensFil = dv > 0 ? 1 : -1;
    fil.style.setProperty('--fx', (8 + p * (innerWidth - 46)).toFixed(1) + 'px');
    fil.style.setProperty('--fy', calme ? '0px' : (-Math.abs(Math.sin(y / 52)) * 10).toFixed(1) + 'px');
    fil.style.setProperty('--fs', sensFil);
    if (dv && !calme) { fil.classList.remove('pose'); fil.classList.toggle('vole', Math.abs(dv) > 46); clearTimeout(reposFil); reposFil = setTimeout(function () { fil.classList.remove('vole'); fil.classList.add('pose'); fil.style.setProperty('--fy', '0px'); }, 260); }
    // rubrique en cours
    var ici = null; sections.forEach(function (s) { if (s.getBoundingClientRect().top < vh * .45) ici = s.id; });
    liensNav.forEach(function (a) { a.classList.toggle('ici', a.getAttribute('href') === '#' + ici); });
    if (calme) { bandes.forEach(function (b) { b.cols.forEach(function (c) { c.el.style.setProperty('--p', 1); }); }); mots.forEach(function (m) { m.classList.add('on'); }); majRideaux(); return; }
    // accueil : le ciel glisse, les moineaux s'envolent quand on descend
    if (y < vh * 1.2) ciel.style.transform = 'translate3d(0,' + (y * .28).toFixed(1) + 'px,0)';
    var hA = accueil.offsetHeight;
    if (!partisPourDefil && y > hA * .34) { partisPourDefil = true; nuee.tousPartent(true); }
    else if (partisPourDefil && y < hA * .12) { partisPourDefil = false; nuee.tousReviennent(); }
    // frises
    var tf = frise1.offsetHeight;
    frise1.style.transform = 'translate3d(' + (-((y * .22) % tf)).toFixed(1) + 'px,0,0)';
    frise2.style.transform = 'translate3d(' + (-tf + ((y * .22) % tf)).toFixed(1) + 'px,0,0)';
    // phrase qui s'allume
    var rp = phrase.getBoundingClientRect();
    if (rp.top < vh && rp.bottom > -200) { var pp = seg(rp.top, vh * .88, vh * .36) * mots.length; mots.forEach(function (m, i) { m.classList.toggle('on', i < pp); }); }
    // pignons
    bandes.forEach(function (b) {
      var r = b.el.getBoundingClientRect(); if (r.top > vh + 40 || r.bottom < -40) return;
      var P = seg(r.top, vh, vh * .5);
      b.cols.forEach(function (c) { c.el.style.setProperty('--p', doux(seg(P, c.o, c.o + .56)).toFixed(3)); });
    });
    // rideaux
    majRideaux();
    // le vent du défilement
    if (dv) {
      var rt = tringle.getBoundingClientRect();
      if (rt.top < vh && rt.bottom > 0) corpsTorchons.forEach(function (o, i) { pousser(o, borne(dv * .045, -1.5, 1.5) * (.6 + ((i * 37) % 10) / 12)); });
      var rc = cadrePhoto.getBoundingClientRect();
      if (rc.top < vh && rc.bottom > 0) pousser(cadreCorps, borne(dv * .02, -.7, .7));
    }
  }
  function demander() { if (!attente) { attente = true; requestAnimationFrame(maj); } }
  addEventListener('scroll', demander, { passive: true });
  addEventListener('resize', demander);
  maj();
})();
