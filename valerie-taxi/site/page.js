// Valérie Taxi : « la départementale ». Tout le mouvement de la page.
// Règle du mouvement : ce script ne lit jamais le réglage « moins d'animations » du système.
// Le mode calme n'existe que sur demande : ?calme=1 (classe calme sur html, posée dans index.html).
(function () {
  'use strict';
  var C = window.CONTENU || {}, H = document.documentElement, D = document;
  var calme = H.classList.contains('calme');
  var $ = function (s, r) { return (r || D).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || D).querySelectorAll(s)); };
  var borne = function (v, a, b) { return v < (a || 0) ? (a || 0) : v > (b === undefined ? 1 : b) ? (b === undefined ? 1 : b) : v; };
  var NS = 'http://www.w3.org/2000/svg';
  var svg = function (nom, attrs, parent) { var e = D.createElementNS(NS, nom); for (var k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };
  var hm = function (min) { min = ((Math.round(min) % 1440) + 1440) % 1440; var m = min % 60; return Math.floor(min / 60) + ' h ' + (m < 10 ? '0' : '') + m; };

  /* ---------- couleur choisie depuis la page Bonjour ---------- */
  addEventListener('message', function (e) {
    var d = e.data; if (!d || d.type !== 'kazura-couleur') return;
    if ((C.palettes || []).indexOf(d.palette) >= 0) H.setAttribute('data-palette', d.palette);
  });
  var parent = window.parent !== window ? window.parent : null;
  addEventListener('load', function () { if (parent) parent.postMessage({ type: 'kazura-pret' }, '*'); });

  /* ---------- le lumineux : vert libre, rouge à bord ---------- */
  var etat = $('#etat');
  function lumineux(v) { H.setAttribute('data-lum', v); if (etat) etat.textContent = v === 'pris' ? 'À bord' : 'Libre'; }
  var lumG = $('#lumineux');
  function basculer() {
    lumineux(H.getAttribute('data-lum') === 'pris' ? 'libre' : 'pris');
    lumG.classList.remove('tic'); void lumG.getBoundingClientRect(); lumG.classList.add('tic');
  }
  if (lumG) {
    lumG.addEventListener('click', basculer);
    lumG.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); basculer(); } });
  }

  /* ---------- entrées : ce qui arrive à l'écran reçoit la classe vu ---------- */
  var aVoir = $$('[data-e]').concat($$('#poteau, #bord'));
  if (calme || !('IntersectionObserver' in window)) aVoir.forEach(function (e) { e.classList.add('vu'); });
  else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('vu'); io.unobserve(x.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    aVoir.forEach(function (e) { io.observe(e); });
  }
  // une pièce posée ne rejoue pas son entrée quand on la touche ensuite
  D.addEventListener('animationend', function (e) {
    var t = e.target; if (!t.classList) return;
    if (e.animationName === 'fl-in' || e.animationName === 'plante') t.classList.add('pose');
    if (e.animationName === 'vent') t.classList.remove('vent');
    if (e.animationName === 'secoue' && t.parentNode) t.parentNode.classList.remove('secoue');
    if (e.animationName === 'tourne' && t.parentNode) t.parentNode.classList.remove('tourne');
    if (e.animationName === 'tic' || e.animationName === 'bat' || e.animationName === 'dit') t.classList.remove('tic', 'bat', 'change');
  });

  /* ---------- menu (téléphone et tablette) ---------- */
  var menu = $('#menu'), btMenu = $('#bt-menu');
  function fermerMenu() { menu.hidden = true; btMenu.setAttribute('aria-expanded', 'false'); btMenu.textContent = 'Menu'; }
  function ouvrirMenu() { menu.hidden = false; btMenu.setAttribute('aria-expanded', 'true'); btMenu.textContent = 'Fermer'; }
  menu.addEventListener('wheel', function (e) { e.preventDefault(); }, { passive: false });
  btMenu.addEventListener('click', function () { menu.hidden ? ouvrirMenu() : fermerMenu(); });
  $('#menu-fermer').addEventListener('click', fermerMenu);
  $$('a', menu).forEach(function (a) { a.addEventListener('click', fermerMenu); });
  addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) fermerMenu(); });
  addEventListener('resize', function () { if (innerWidth >= 1280 && !menu.hidden) fermerMenu(); });

  /* ---------- accueil : les flèches tournent au vent, puis emmènent à la rubrique ---------- */
  $$('.fl').forEach(function (f) {
    var vent = function () { if (f.classList.contains('pose')) f.classList.add('vent'); };
    f.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') vent(); });
    f.addEventListener('click', function () {
      vent();
      var c = $(f.getAttribute('data-vers')); if (c) setTimeout(function () { c.scrollIntoView({ behavior: calme ? 'auto' : 'smooth' }); }, calme ? 0 : 650);
    });
  });
  // un coup de vent de temps en temps, même sans rien toucher
  if (!calme) setInterval(function () {
    var poses = $$('.fl.pose'); if (!poses.length || scrollY > innerHeight) return;
    poses[Math.floor(Math.random() * poses.length)].classList.add('vent');
  }, 4200);

  /* ---------- transports : un panneau touché fait deux tours sur son mât ---------- */
  $$('.pan').forEach(function (p) { p.addEventListener('click', function () { if (!calme) p.classList.add('tourne'); }); });

  /* ---------- la carte du secteur ---------- */
  var carte = $('#carte'), lieuxG = $('#lieux'), champs = $('#champs');
  // les champs du bocage : une grille déformée, toujours la même (graine fixe)
  (function () {
    var g = 20261112, alea = function () { g |= 0; g = g + 0x6D2B79F5 | 0; var t = Math.imul(g ^ g >>> 15, 1 | g); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    var N = 6, pas = 900 / N, P = [], tons = ['#d9e8bb', '#c9dfa6', '#e9e3a6', '#dcebc4', '#bcd899', '#f0e8b8', '#d2e4b1'];
    for (var j = 0; j <= N; j++) { P[j] = []; for (var i = 0; i <= N; i++) P[j][i] = [i * pas + (i && i < N ? (alea() - .5) * 78 : 0), j * pas + (j && j < N ? (alea() - .5) * 78 : 0)]; }
    for (j = 0; j < N; j++) for (i = 0; i < N; i++) {
      var a = P[j][i], b = P[j][i + 1], c = P[j + 1][i + 1], d = P[j + 1][i];
      svg('path', { d: 'M' + a + 'L' + b + 'L' + c + 'L' + d + 'Z', fill: tons[Math.floor(alea() * tons.length)] }, champs);
    }
  })();

  var LIEUX = [
    { id: 'trans', nom: 'TRANS-SUR-ERDRE', x: 548, y: 150, mat: 30 },
    { id: 'touches', nom: 'LES TOUCHES', x: 330, y: 304, mat: 28 },
    { id: 'mouzeil', nom: 'MOUZEIL', x: 640, y: 292, mat: 34, dx: 44, borne: true },
    { id: 'ligne', nom: 'LIGNÉ', x: 452, y: 436, mat: 28, dx: -12 },
    { id: 'ancenis', nom: 'ANCENIS', x: 806, y: 568, mat: 44, dx: -16, h: 'an' },
    { id: 'nantes', nom: 'NANTES', x: 98, y: 828, mat: 0, sans: true },
    { id: 'nantes', h: 'hd', x: 240, y: 782, sous: 'Hôtel-Dieu', sx: 32, sy: 12, anc: 'start' },
    { id: 'nantes', h: 'la', x: 70, y: 690, sous: 'Laënnec', sx: 2, sy: 60, anc: 'middle' }
  ];
  var parDest = {};
  LIEUX.forEach(function (L, n) {
    var g = svg('g', { 'class': 'lieu' + (L.h ? ' hop' : ''), 'data-id': L.id, tabindex: 0, role: 'button', 'aria-label': (L.nom || L.sous) + '. Touchez pour en savoir plus.' }, lieuxG);
    var dedans = svg('g', { 'class': 'lieu-in', style: '--i:' + n }, g);
    if (L.h) {
      svg('rect', { 'class': 'lieu-h', x: L.x - 23, y: L.y - 23, width: 46, height: 46, rx: 9 }, dedans);
      var hh = svg('text', { 'class': 'lieu-hh', x: L.x, y: L.y + 14, 'text-anchor': 'middle' }, dedans); hh.textContent = 'H';
      parDest[L.h] = g;
    }
    if (L.sous) { var s = svg('text', { 'class': 'lieu-s', x: L.x + L.sx, y: L.y + L.sy, 'text-anchor': L.anc }, dedans); s.textContent = L.sous; }
    if (L.nom) {
      var cx = L.x + (L.dx || 0), bas = L.y - (L.h ? 23 : 0) - L.mat, l = L.nom.length * 24.6 + 36;
      if (L.mat) svg('rect', { 'class': 'lieu-mat', x: L.x - 4, y: bas, width: 8, height: L.mat + (L.h ? 0 : 4) }, dedans);
      var r = svg('rect', { 'class': 'lieu-p', x: cx - l / 2, y: bas - 58, width: l, height: 58, rx: 10 }, dedans);
      var t = svg('text', { 'class': 'lieu-t', x: cx, y: bas - 16, 'text-anchor': 'middle' }, dedans); t.textContent = L.nom;
      if (L.borne) { svg('path', { 'class': 'lieu-b', d: 'M' + (L.x + 12) + ' ' + (L.y + 4) + 'v-22q0-12 13-12t13 12v22z' }, dedans); }
      // largeur exacte du panneau une fois la police chargée
      var ajuster = function () { try { var w = t.getComputedTextLength() + 36; if (w > 60) { r.setAttribute('width', w); r.setAttribute('x', cx - w / 2); } } catch (e) {} };
      ajuster(); if (D.fonts && D.fonts.ready) D.fonts.ready.then(ajuster);
    }
    var dire = function () {
      var p = $('#se-dit'); p.textContent = C.communes[L.id] || ''; p.classList.remove('change'); void p.offsetWidth; p.classList.add('change');
      if (dedans.classList.contains('pose')) g.classList.add('secoue');
    };
    g.addEventListener('click', dire);
    g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); dire(); } });
  });

  /* ---------- le trajet : la route se trace, l'heure de départ se calcule ---------- */
  var rdv = C.rendezVous || 540, choix = C.destinations[0], mob = $('#mob'), jeton = 0, dejaJoue = false, lieuTouche = false;
  var destsB = $('#dests');
  C.destinations.forEach(function (d) {
    var b = D.createElement('button'); b.type = 'button'; b.className = 'dest'; b.setAttribute('aria-pressed', d === choix ? 'true' : 'false');
    b.innerHTML = '<i aria-hidden="true">H</i><span></span>'; b.lastChild.textContent = d.nom; d.bouton = b;
    b.addEventListener('click', function () { choisir(d, true); });
    destsB.appendChild(b);
  });
  function bat(e) { e.classList.remove('bat'); void e.offsetWidth; e.classList.add('bat'); }
  function chiffres() {
    var dep = rdv - choix.minutes - C.marge;
    $('#rdv').textContent = hm(rdv); $('#res-h').textContent = hm(dep); $('#res-km').textContent = choix.km;
    $('#res-d').textContent = choix.minutes + ' minutes de route, plus ' + C.marge + ' minutes de marge.';
    $('#doc-heure').textContent = hm(rdv);
    var fh = $('#f-heure'), h = Math.floor(rdv / 60), m = rdv % 60; fh.value = (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
    if (!lieuTouche) $('#f-lieu').value = choix.nom;
    majCarnet();
  }
  function tracer(d) {
    var moi = ++jeton, t = $('#t-' + d.id), cible = parDest[d.id];
    $$('.trajet').forEach(function (p) { p.classList.remove('actif'); p.style.strokeDashoffset = ''; });
    $$('.lieu.hop').forEach(function (g) { g.classList.remove('but'); });
    t.classList.add('actif');
    if (calme) { cible.classList.add('but'); return; }
    var L = t.getTotalLength(), t0 = performance.now(), duree = 900 + L * 1.9, kmEl = $('#res-km'), kmFin = parseFloat(d.km.replace(',', '.'));
    t.style.strokeDashoffset = 1; mob.classList.add('roule'); lumineux('pris');
    (function pas(now) {
      if (moi !== jeton) return;
      var k = borne((now - t0) / duree), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2, pt = t.getPointAtLength(L * e);
      kmEl.textContent = (kmFin * e).toFixed(1).replace('.', ','); t.style.strokeDashoffset = 1 - e; mob.setAttribute('transform', 'translate(' + pt.x.toFixed(1) + ' ' + (pt.y - 26).toFixed(1) + ')');
      if (k < 1) requestAnimationFrame(pas);
      else {
        kmEl.textContent = d.km; cible.classList.add('but'); if ($('.lieu-in', cible).classList.contains('pose')) cible.classList.add('secoue');
        setTimeout(function () { if (moi === jeton) { mob.classList.remove('roule'); lumineux('libre'); } }, 1300);
      }
    })(t0);
  }
  function choisir(d, geste) {
    choix = d; C.destinations.forEach(function (x) { x.bouton.setAttribute('aria-pressed', x === d ? 'true' : 'false'); });
    chiffres(); bat($('#res-h')); tracer(d);
    if (geste) { // sur petit écran, on remet la carte sous les yeux
      var r = carte.getBoundingClientRect(), haut = $('#tete').offsetHeight;
      if (r.top < haut || r.bottom > innerHeight + r.height * .55) scrollTo({ top: scrollY + r.top - haut - 12, behavior: calme ? 'auto' : 'smooth' });
    }
  }
  function pasHeure(sens) { rdv = borne(rdv + sens * 15, 6 * 60, 20 * 60); chiffres(); bat($('#rdv')); bat($('#res-h')); }
  [['#moins', -1], ['#plus', 1]].forEach(function (p) {
    var b = $(p[0]), tenu = null, rep = null;
    var stop = function () { clearTimeout(tenu); clearInterval(rep); };
    b.addEventListener('click', function (e) { if (e.detail === 0) pasHeure(p[1]); }); // clavier
    b.addEventListener('pointerdown', function (e) { e.preventDefault(); b.focus(); pasHeure(p[1]); stop(); tenu = setTimeout(function () { rep = setInterval(function () { pasHeure(p[1]); }, 130); }, 480); });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (n) { b.addEventListener(n, stop); });
  });
  // premier trajet joué tout seul quand la carte arrive à l'écran
  var seCarte = $('.se-carte');
  if ('IntersectionObserver' in window && !calme) {
    var ioc = new IntersectionObserver(function (es) { if (es[0].isIntersecting && !dejaJoue) { dejaJoue = true; ioc.disconnect(); setTimeout(function () { tracer(choix); }, 1500); } }, { threshold: 0.45 });
    ioc.observe(seCarte);
  } else tracer(choix);

  /* ---------- à préparer : chaque papier coché se range dans la pochette ---------- */
  var coches = $$('.coche'), pochette = $('#pochette');
  coches.forEach(function (b) {
    b.addEventListener('click', function () {
      var on = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', on ? 'true' : 'false');
      $('.doc[data-doc=' + b.getAttribute('data-doc') + ']', pochette).classList.toggle('range', on);
      var n = coches.filter(function (x) { return x.getAttribute('aria-pressed') === 'true'; }).length;
      pochette.classList.toggle('pret', n === coches.length);
      $('#pr-compte').textContent = n === 0 ? 'Rien de rangé pour l’instant.' : n === coches.length ? 'Tout est dans la pochette. Bonne route.' : n + (n > 1 ? ' papiers' : ' papier') + ' sur ' + coches.length + ' dans la pochette.';
    });
  });

  /* ---------- le carnet : la demande s'écrit à la main dans la page du jour ---------- */
  var carnet = $('#carnet'), fJour = $('#f-jour'), fHeure = $('#f-heure'), fLieu = $('#f-lieu'), fNom = $('#f-nom'), sens = 'aller et retour', lignes = [];
  (function () { var d = new Date(Date.now() + 864e5); if (d.getDay() === 0) d = new Date(d.getTime() + 864e5); var z = function (n) { return (n < 10 ? '0' : '') + n; }; fJour.value = d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate()); })();
  var agH = $('#ag-heures');
  for (var k = 0; k < 4; k++) { var li = D.createElement('li'); li.innerHTML = '<span></span><p></p>'; agH.appendChild(li); lignes.push(li); }
  lignes[3].appendChild($('#ag-tampon'));
  function ecrire(p, texte) {
    clearInterval(p._t); var a = p.textContent; if (a === texte) return;
    if (calme) { p.textContent = texte; return; }
    var n = 0; while (n < a.length && n < texte.length && a[n] === texte[n]) n++;
    p.textContent = texte.slice(0, n);
    p._t = setInterval(function () { n++; p.textContent = texte.slice(0, n); if (n >= texte.length) clearInterval(p._t); }, 26);
  }
  function majCarnet() {
    carnet.classList.remove('note');
    var j = fJour.value ? new Date(fJour.value + 'T12:00:00') : null;
    if (j && !isNaN(j)) {
      $('#ag-num').textContent = j.getDate();
      $('#ag-jour').textContent = j.toLocaleDateString('fr-FR', { weekday: 'long' });
      $('#ag-mois').textContent = j.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    } else { $('#ag-num').textContent = '..'; $('#ag-jour').textContent = 'Le jour'; $('#ag-mois').textContent = 'à choisir'; }
    var hmv = /^(\d\d):(\d\d)$/.exec(fHeure.value || ''), min = hmv ? +hmv[1] * 60 + +hmv[2] : rdv, h = Math.floor(min / 60);
    var lieu = fLieu.value.trim(), connu = null;
    C.destinations.forEach(function (d) { if (d.nom.toLowerCase() === lieu.toLowerCase()) connu = d; });
    var textes = [
      connu ? 'Départ de ' + C.depart + ' vers ' + hm(min - connu.minutes - C.marge) : '',
      hm(min) + ', ' + (lieu || 'lieu à préciser'),
      (fNom.value.trim() || 'votre nom') + ', ' + sens,
      ''
    ];
    lignes.forEach(function (li, i) {
      var hh = h - 1 + i; li.firstChild.textContent = hh >= 0 && hh < 24 ? hh + ' h' : '';
      li.className = i === 1 ? 'rdv' : ''; ecrire(li.children[1], textes[i]);
    });
    $('#ag-note').textContent = 'Rien n’est envoyé : c’est une maquette.';
  }
  [fJour, fHeure, fNom].forEach(function (c) { c.addEventListener('input', majCarnet); });
  fLieu.addEventListener('input', function () { lieuTouche = true; majCarnet(); });
  fHeure.addEventListener('change', function () { var m = /^(\d\d):(\d\d)$/.exec(fHeure.value || ''); if (m) { rdv = borne(+m[1] * 60 + +m[2], 0, 1439); $('#rdv').textContent = hm(rdv); $('#res-h').textContent = hm(rdv - choix.minutes - C.marge); $('#doc-heure').textContent = hm(rdv); } });
  $$('#sens button').forEach(function (b) {
    b.addEventListener('click', function () { sens = b.getAttribute('data-s'); $$('#sens button').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); }); majCarnet(); });
  });
  $('#form').addEventListener('submit', function (e) {
    e.preventDefault(); carnet.classList.add('note');
    $('#ag-note').textContent = 'Sur votre vrai site, cette demande arriverait chez Valérie. Ici, rien n’est envoyé.';
    var r = $('#agenda').getBoundingClientRect(); if (r.top > innerHeight * .6 || r.top < 0) $('#agenda').scrollIntoView({ behavior: calme ? 'auto' : 'smooth', block: 'center' });
  });
  chiffres();

  /* ---------- téléphone : affiché seulement s'il est confirmé dans contenu.js ---------- */
  if (C.telephone) {
    var tel = $('#tel'), a = D.createElement('a'); a.href = 'tel:' + C.telephone.replace(/\s/g, ''); a.textContent = C.telephone; a.className = 'plaque-vrai';
    tel.textContent = ''; tel.appendChild(a); tel.removeAttribute('aria-label');
  }

  /* ---------- ce qui suit le défilement ---------- */
  var bocage = $('#bocage'), fil = $('#fil-taxi'), zebre = $$('#zebre i'), zebreB = $('#zebre'), mots = $$('#cit span'), cit = $('#cit'), portes = $$('.porte-b'), collines = $('.collines'), clocher = $('.clocher');
  var liens = $$('#nav a'), cibles = liens.map(function (a) { return $(a.getAttribute('href')); }), piste = $('#route-piste'), route = $('#route');
  var demande = false, defile = false, moitie = 0, t0 = performance.now();
  portes.forEach(function (p) {
    p.addEventListener('click', function () { var o = parseFloat(p.style.getPropertyValue('--o')) || 0; p._force = o > .5 ? 0 : 1; p.style.setProperty('--o', p._force); });
  });
  function maj() {
    demande = false;
    var y = scrollY, Hh = innerHeight, max = Math.max(1, D.documentElement.scrollHeight - Hh);
    fil.style.setProperty('--av', (y / max).toFixed(4));
    if (!defile && y > 40) { defile = true; if (parent) parent.postMessage({ type: 'kazura-defile' }, '*'); }
    if (calme) { mots.forEach(function (m) { m.classList.add('dit'); }); portes.forEach(function (p) { p.style.setProperty('--o', 1); }); }
    else {
      if (y < Hh * 1.2) { collines.style.transform = 'translateY(' + (y * .1).toFixed(1) + 'px)'; clocher.style.transform = 'translateY(' + (y * .16).toFixed(1) + 'px)'; }
      var r = zebreB.getBoundingClientRect();
      if (r.top < Hh && r.bottom > 0) {
        var n = zebre.length, p = borne((Hh - r.top) / (Hh * .5 + r.height * .5));
        for (var i = 0; i < n; i++) zebre[i].style.setProperty('--z', borne((p * (n * .55 + 2.4) - i * .55) / 2.4).toFixed(3));
      }
      r = bocage.getBoundingClientRect();
      if (r.top < Hh && r.bottom > 0) { var bb = (Hh - r.top) * .09; bocage.style.setProperty('--b1', (-bb).toFixed(1) + 'px'); bocage.style.setProperty('--b2', (bb * .7).toFixed(1) + 'px'); }
      r = cit.getBoundingClientRect();
      if (r.top < Hh && r.bottom > -200) { var q = borne((Hh * .92 - r.top) / (Hh * .3)) * (mots.length + .6); mots.forEach(function (m, i) { m.classList.toggle('dit', i < q); }); }
      portes.forEach(function (b, i) {
        var rr = b.getBoundingClientRect();
        if (rr.bottom < -40 || rr.top > Hh + 40) { b._force = undefined; return; }
        if (b._force !== undefined) return;
        var o = borne(((Hh * .96 - rr.top) / (Hh * .6)) * 1.5 - i * .16);
        b.style.setProperty('--o', o.toFixed(3));
      });
    }
    var ici = -1; for (var c = 0; c < cibles.length; c++) if (cibles[c] && cibles[c].getBoundingClientRect().top < Hh * .42) ici = c;
    liens.forEach(function (a, i) { a.classList.toggle('ici', i === ici); });
  }
  function appel() { if (!demande) { demande = true; requestAnimationFrame(maj); } }
  addEventListener('scroll', appel, { passive: true }); addEventListener('resize', function () { moitie = 0; appel(); }); maj();

  // la route peinte : elle roule doucement toute seule, et plus vite avec le défilement
  var routeVue = false;
  if (!calme && piste) {
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { var v = es[0].isIntersecting; if (v && !routeVue) { routeVue = true; requestAnimationFrame(rouler); } routeVue = v; }, { rootMargin: '80px' }).observe(route);
    else { routeVue = true; requestAnimationFrame(rouler); }
  }
  function rouler(t) {
    if (!routeVue) return;
    if (!moitie) moitie = piste.scrollWidth / 2;
    var x = ((t - t0) * .045 + scrollY * .55) % moitie;
    piste.style.transform = 'translate3d(' + (-x).toFixed(1) + 'px,0,0)';
    requestAnimationFrame(rouler);
  }
})();
