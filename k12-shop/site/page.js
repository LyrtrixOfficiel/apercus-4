// K12 Shop : le caisson lumineux. Un seul moteur (requestAnimationFrame) qui s'arrête dès que rien ne bouge.
// La page ne lit jamais le réglage « mouvements réduits » : mode calme seulement avec ?calme=1.
(function () {
  'use strict';
  var D = document, H = D.documentElement, C = window.CONTENU || {};
  var calme = H.classList.contains('calme');
  var $ = function (s, r) { return (r || D).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || D).querySelectorAll(s)); };
  var borne = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var cree = function (b, c, t) { var e = D.createElement(b); if (c) e.className = c; if (t != null) e.textContent = t; return e; };
  function hasard(g) { return function () { g |= 0; g = g + 0x6D2B79F5 | 0; var t = Math.imul(g ^ g >>> 15, 1 | g); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  var visible = function (e, m) { var r = e.getBoundingClientRect(); return r.bottom > -(m || 0) && r.top < innerHeight + (m || 0); };

  /* ---------- Ce qui est à l'écran ----------
     Une seule vigie pour toute la page. Rien n'est mesuré pendant le défilement : chaque bloc suivi porte e._la
     (vrai tant qu'il est à l'écran) et la classe « hors » quand il n'y est pas (ses animations sans fin se mettent en pause). */
  var vigie = new IntersectionObserver(function (es) {
    es.forEach(function (x) { var e = x.target, la = x.isIntersecting; e._la = la; e.classList.toggle('hors', !la); if (la && e._reprend) e._reprend(); });
  }, { rootMargin: '60px 0px' });
  function suis(e, reprend) { e._la = true; e._reprend = reprend; vigie.observe(e); return e; }
  $$('main > section').forEach(function (s) { suis(s); });
  // La taille de la fenêtre, lue une fois par redimensionnement (la lire à chaque image force une mise en page sur téléphone)
  var vw = innerWidth, vh = innerHeight;

  /* ---------- Le moteur ---------- */
  var abonnes = [], tourne = false, avant = 0;
  function tic(t) {
    var dt = Math.min(.05, (t - avant) / 1000 || .016), encore = false; avant = t;
    for (var i = 0; i < abonnes.length; i++) if (abonnes[i](dt, t)) encore = true;
    if (encore) requestAnimationFrame(tic); else tourne = false;
  }
  function reveille() { if (!tourne) { tourne = true; avant = performance.now(); requestAnimationFrame(tic); } }

  /* ---------- Entrées de section ---------- */
  $$('[data-vu]').forEach(function (e) { [].forEach.call(e.children, function (c, i) { c.style.setProperty('--i', i); }); });
  var guetteur = new IntersectionObserver(function (es) {
    es.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('vu'); guetteur.unobserve(x.target); x.target.dispatchEvent(new CustomEvent('vu')); } });
  }, { threshold: .16 });
  $$('[data-vu]').forEach(function (e) { guetteur.observe(e); });

  /* ---------- La barre : menu, pendule, tube ---------- */
  var menu = $('#menu'), burger = $('#burger'), tube = $('#tube');
  burger.addEventListener('click', function () { var o = menu.classList.toggle('ouvert'); burger.setAttribute('aria-expanded', o); burger.textContent = o ? 'Fermer' : 'Menu'; });
  menu.addEventListener('click', function (e) { if (e.target.closest('a')) { menu.classList.remove('ouvert'); burger.setAttribute('aria-expanded', false); burger.textContent = 'Menu'; } });
  var liens = {}; $$('a', menu).forEach(function (a) { liens[a.getAttribute('href').slice(1)] = a; });
  var ici = new IntersectionObserver(function (es) {
    es.forEach(function (x) { if (x.isIntersecting) { $$('a', menu).forEach(function (a) { a.classList.remove('ici'); }); var l = liens[x.target.id]; if (l) l.classList.add('ici'); } });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('main > section').forEach(function (s) { ici.observe(s); });

  // L'heure qu'il est vraiment à Marseille
  var pendule = $('#pendule'), ilEst = $('#il-est'), envie = $('#envie-heure'), envieMot = '';
  function heureMarseille() {
    try {
      var p = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
      var h = +p.filter(function (x) { return x.type === 'hour'; })[0].value % 24, m = +p.filter(function (x) { return x.type === 'minute'; })[0].value;
      return [h, m];
    } catch (e) { var d = new Date(); return [d.getHours(), d.getMinutes()]; }
  }
  function metsHeure() {
    var hm = heureMarseille(), h = hm[0], m = hm[1], mm = (m < 10 ? '0' : '') + m;
    pendule.textContent = (h < 10 ? '0' : '') + h + ':' + mm;
    ilEst.textContent = h + ' h ' + mm;
    (C.heures || []).forEach(function (t) { if (h >= t[0] && h < t[1]) { envie.textContent = t[2]; envieMot = t[3]; } });
  }
  metsHeure(); setInterval(metsHeure, 15000);
  envie.addEventListener('click', function (e) {
    if (envieMot.charAt(0) === '#') { envie.setAttribute('href', envieMot); return; }
    e.preventDefault(); $('#manque').scrollIntoView({ behavior: calme ? 'auto' : 'smooth' });
    setTimeout(function () { champ.value = envieMot; cherche(envieMot, false); }, calme ? 0 : 700);
  });

  /* ---------- 1. L'enseigne ---------- */
  var caisson = $('#caisson'), k12 = $('#k12');
  $$('.plaques a').forEach(function (a, i) { a.style.setProperty('--i', i); });
  $$('.e-droite > *').forEach(function (a, i) { a.style.setProperty('--i', i); });
  setTimeout(function () { caisson.classList.add('allume'); }, calme ? 0 : 320);
  $$('.lt', k12).forEach(function (l) {
    var b = l.firstElementChild;
    b.addEventListener('animationend', function (e) { if (e.animationName === 'clipse') l.classList.add('pret'); if (e.animationName === 'pend') l.classList.remove('pend'); });
    l.addEventListener('click', function () { if (!l.classList.contains('pret')) return; l.classList.remove('pend'); void b.offsetWidth; l.classList.add('pend'); });
  });
  // Les lettres suivent la souris, chacune à sa profondeur
  var px = 0, py = 0, cx = 0, cy = 0;
  caisson.addEventListener('pointermove', function (e) {
    if (e.pointerType === 'touch') return;
    var r = caisson.getBoundingClientRect(); cx = ((e.clientX - r.left) / r.width - .5) * -1.6; cy = ((e.clientY - r.top) / r.height - .5) * -1.6; reveille();
  });
  caisson.addEventListener('pointerleave', function () { cx = cy = 0; reveille(); });
  abonnes.push(function () {
    if (calme || (px === cx && py === cy)) return false; // rien à écrire tant que la souris n'a pas bougé (jamais au doigt)
    px += (cx - px) * .12; py += (cy - py) * .12;
    if (Math.abs(cx - px) + Math.abs(cy - py) <= .002) { px = cx; py = cy; }
    k12.style.setProperty('--px', px.toFixed(3)); k12.style.setProperty('--py', py.toFixed(3));
    return px !== cx || py !== cy;
  });

  /* ---------- La porte : les lanières ---------- */
  var porte = $('#porte'), boite = $('#lanieres'), bandes = [], sourisX = -9999, sourisDans = false, vDefil = 0;
  function tendLanieres() {
    var n = Math.round(vw / (vw < 700 ? 44 : 76)), al = hasard(12);
    boite.textContent = ''; bandes = [];
    for (var i = 0; i < n; i++) { var el = cree('i'); boite.appendChild(el); bandes.push({ el: el, a: 0, v: 0, g: al(), x: (i + .5) / n, e: '' }); }
  }
  tendLanieres();
  porte.addEventListener('pointermove', function (e) { sourisX = e.clientX; sourisDans = true; reveille(); });
  porte.addEventListener('pointerleave', function () { sourisDans = false; });
  suis(porte, reveille);
  abonnes.push(function (dt, t) {
    if (calme || !porte._la) return false; // hors de l'écran : arrêt complet, la vigie relance au retour
    var L = vw * 1.06, x0 = -vw * .03;
    for (var i = 0; i < bandes.length; i++) {
      var b = bandes[i], cible = borne(vDefil * -.011, -15, 15) * (.55 + b.g * .9) + Math.sin(t / 900 + b.g * 9) * 1.1;
      if (sourisDans) { var dx = x0 + b.x * L - sourisX, p = 1 - Math.abs(dx) / 150; if (p > 0) cible += (dx < 0 ? -1 : 1) * p * 30; }
      b.v += ((cible - b.a) * 70 - b.v * 7) * dt; b.a += b.v * dt;
      var e = 'rotate(' + (Math.round(b.a * 20) / 20) + 'deg)'; // au vingtième de degré (moins d'un quart de pixel au bas d'une lanière) : on n'écrit que ce qui change
      if (e !== b.e) { b.e = e; b.el.style.transform = e; }
    }
    return true; // tant que la porte est à l'écran, les lanières respirent
  });

  /* ---------- 2. Le totem ---------- */
  $$('#totem .pan').forEach(function (p, i) {
    p.style.setProperty('--i', i);
    p.addEventListener('animationend', function (e) { if (e.animationName === 'neon') p.classList.add('pret'); if (e.animationName === 'balance') p.classList.remove('balance'); });
    p.addEventListener('click', function () { p.classList.add('pret'); p.classList.remove('balance'); void p.offsetWidth; p.classList.add('balance'); });
  });
  var douze = $('.douze'), epicerie = $('#epicerie'), piste = $('#piste');
  for (var tourB = 0; tourB < 2; tourB++) (C.bandeau || []).forEach(function (m) { piste.appendChild(cree('span', '', m)); piste.appendChild(cree('i')); });
  suis(piste.parentNode);

  /* ---------- 3. Il vous manque quoi ? ---------- */
  var mur = $('#mur'), champ = $('#q'), reponse = $('#reponse'), envies = $('#envies'), rayons = [], nPaquet = 0;
  var sansAccent = function (s) { return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/œ/g, 'oe').replace(/[’']/g, ' ').replace(/[^a-z0-9 -]/g, ' ').replace(/\s+/g, ' ').trim(); };
  function paquets(spec, dans, compteur) {
    spec.split(' ').forEach(function (s, j) {
      var p = s.split(':'), e = cree('i', 'pq t-' + p[0]);
      e.style.cssText = '--c:' + p[1] + ';--d:' + p[2] + ';--w:' + p[3] + ';--h:' + p[4] + ';--j:' + j + ';--n:' + (compteur ? nPaquet++ : 0);
      dans.appendChild(e);
    });
  }
  (C.rayons || []).forEach(function (r) {
    var el = cree('div', 'rayon'); el.dataset.id = r.id;
    el.appendChild(cree('span', 'nom etoile', r.nom));
    paquets(r.paquets, el, true); mur.appendChild(el);
    rayons.push({ r: r, el: el, mots: r.mots.map(sansAccent) });
    el.addEventListener('click', function (e) {
      var p = e.target.closest('.pq'); if (p && mur.classList.contains('pret')) { p.classList.remove('hop'); void p.offsetWidth; p.classList.add('hop'); }
      allume(el, '<b>' + r.nom + '.</b> Sur votre vrai site : vos produits, vos arrivages, vos mots.');
    });
  });
  mur.addEventListener('vu', function () { setTimeout(function () { mur.classList.add('pret'); }, calme ? 0 : nPaquet * 16 + 650); });
  function dis(html) { reponse.innerHTML = html; reponse.classList.remove('neuve'); void reponse.offsetWidth; reponse.classList.add('neuve'); }
  function allume(el, html) {
    mur.classList.add('pret', 'cherche'); mur.classList.remove('inconnu');
    rayons.forEach(function (x) { x.el.classList.remove('allume'); }); void el.offsetWidth; el.classList.add('allume'); dis(html);
  }
  var INTERDITS = /\b(biere|bieres|vin|vins|alcool|alcools|whisky|vodka|rhum|pastis|champagne|cigarette|cigarettes|tabac|cigare|vape|vapoteuse|puff|cbd|chicha|briquet)\b/;
  function cherche(texte, defile) {
    var brut = String(texte).trim(), q = sansAccent(brut).replace(/^(il me manque |je cherche |j ai besoin |)(du |de la |de l |des |de |d |un peu de |une |un |le |la |les |l )?/, '');
    $$('button', envies).forEach(function (b) { b.classList.toggle('choisi', sansAccent(b.textContent) === sansAccent(brut)); });
    if (!q) { mur.classList.remove('cherche'); rayons.forEach(function (x) { x.el.classList.remove('allume'); }); dis('<b>Rien ne manque ?</b> Touchez un paquet pour voir.'); return; }
    var mieux = null, note = 0;
    if (!INTERDITS.test(q)) rayons.forEach(function (x) {
      x.mots.forEach(function (m) {
        var n = 0;
        if (q === m) n = 100 + m.length; else if ((' ' + q + ' ').indexOf(' ' + m + ' ') >= 0) n = 60 + m.length; else if (q.length >= 3 && m.indexOf(q) === 0) n = 30 + q.length; else if (q.length >= 4 && q.indexOf(m) === 0 && m.length >= 3) n = 20 + m.length;
        if (n > note) { note = n; mieux = x; }
      });
    });
    var propre = brut.replace(/[<>&"]/g, '').slice(0, 30), Maj = propre.charAt(0).toUpperCase() + propre.slice(1);
    if (mieux) {
      allume(mieux.el, '<b>' + Maj + ' ?</b> C’est ' + mieux.r.article + ' : le rayon s’allume.');
      if (defile !== false && !visible(mieux.el, -60)) mieux.el.scrollIntoView({ behavior: calme ? 'auto' : 'smooth', block: 'center' });
    } else {
      mur.classList.remove('cherche'); rayons.forEach(function (x) { x.el.classList.remove('allume'); });
      mur.classList.remove('inconnu'); void mur.offsetWidth; mur.classList.add('pret', 'inconnu');
      dis(INTERDITS.test(q) ? '<b>Pas de ça ici.</b> Autre chose ?' : '<b>« ' + propre + ' » ?</b> Pas encore sur la maquette : la liste de vos rayons s’écrit avec vous.');
    }
  }
  (C.envies || []).forEach(function (m) { var b = cree('button', '', m); b.type = 'button'; envies.appendChild(b); b.addEventListener('click', function () { champ.value = m; cherche(m); }); });
  $$('button', envies).forEach(function (b, i) { b.style.setProperty('--i', i); });
  $('#q-forme').addEventListener('submit', function (e) { e.preventDefault(); cherche(champ.value); champ.blur(); });
  var attente; champ.addEventListener('input', function () { clearTimeout(attente); attente = setTimeout(function () { if (champ.value.trim().length >= 3) cherche(champ.value, false); }, 450); });
  // Un paquet sursaute de temps en temps
  suis(mur);
  var tous = $$('.pq', mur);
  if (!calme) setInterval(function () {
    if (D.hidden || !mur._la || !mur.classList.contains('pret')) return;
    var p = tous[Math.floor(Math.random() * tous.length)];
    if (p && !p.parentNode.classList.contains('allume')) { p.classList.add('hop'); setTimeout(function () { p.classList.remove('hop'); }, 650); }
  }, 1300);

  /* ---------- 4. Le frigo ---------- */
  var frigo = $('#frigo'), fMot = $('#f-mot'), fBouton = $('#f-ouvrir'), cuves = $$('.f-cuve', frigo), minuteries = [];
  var DEDANS = {
    boissons: ['bouteille:#9fe3ff:#1735d1:26:82 bouteille:#9fe3ff:#1735d1:26:82 bouteille:#9fe3ff:#1735d1:26:82 bouteille:#bff3e6:#62e86f:26:82', 'bouteille:#ef3b24:#fff:24:76 bouteille:#ff8b1f:#fff:24:76 bouteille:#62e86f:#fff:24:76 bouteille:#ff4d9d:#fff:24:76', 'conserve:#ef3b24:#fff:24:46 conserve:#ffd21e:#1735d1:24:46 conserve:#1735d1:#fff:24:46 conserve:#62e86f:#fff:24:46 conserve:#ff8b1f:#fff:24:46', 'brique:#ff8b1f:#fff:36:74 brique:#62e86f:#ffd21e:36:74 brique:#ef3b24:#fff:36:74 brique:#ffd21e:#ef3b24:36:74'],
    cremerie: ['bouteille:#fff:#1735d1:28:82 bouteille:#fff:#1735d1:28:82 bouteille:#fff:#ef3b24:28:82 brique:#bfe8ff:#1735d1:36:76', 'pot:#fff:#ff4d9d:30:46 pot:#fff:#62e86f:30:46 pot:#fff:#ffd21e:30:46 pot:#fff:#ff8b1f:30:46', 'boite:#ffd21e:#fff:54:32 boite:#ff8b1f:#fff:44:44 boite:#fff:#1735d1:40:50', 'oeufs:#d9c7a3:#bfa97f:70:30 oeufs:#d9c7a3:#bfa97f:70:30']
  };
  cuves.forEach(function (c, i) {
    var d = $('.f-dedans', c);
    DEDANS[c.dataset.cuve].forEach(function (s) { var et = cree('div', 'et'); paquets(s, et, false); d.appendChild(et); });
    $('.f-porte', c).addEventListener('click', function () { porteFrigo(i, !c.classList.contains('ouvert')); });
  });
  function etatFrigo() {
    var n = cuves.filter(function (c) { return c.classList.contains('ouvert'); }).length;
    frigo.classList.toggle('ouvert', n > 0);
    fBouton.textContent = n === 0 ? 'Ouvrir une porte' : n === 1 ? 'Ouvrir l’autre porte' : 'Refermer le frigo';
  }
  function porteFrigo(i, ouvre, seule) {
    var c = cuves[i], p = $('.f-porte', c); clearTimeout(minuteries[i]);
    if (ouvre === c.classList.contains('ouvert')) return;
    c.classList.toggle('ouvert', ouvre); p.setAttribute('aria-pressed', ouvre);
    if (ouvre) {
      c.classList.remove('embue'); fMot.classList.remove('dit');
      if (!calme) for (var k = 0; k < 3; k++) (function (k) {
        var b = cree('i', 'brume'); b.style.cssText = '--x:' + (i * 46 + 4 + k * 12) + '%;--y:' + (22 + k * 22) + '%;--dx:' + (i ? 40 : -40) + 'px;--dl:' + (k * .22) + 's';
        frigo.appendChild(b); setTimeout(function () { b.remove(); }, 3200);
      })(k);
      minuteries[i] = setTimeout(function () {
        fMot.textContent = 'On referme : le froid s’en va.'; fMot.classList.add('dit');
        setTimeout(function () { fMot.classList.remove('dit'); }, 2300);
        porteFrigo(i, false);
      }, 7500);
    } else if (!calme) { c.classList.remove('embue'); void c.offsetWidth; c.classList.add('embue'); }
    etatFrigo();
  }
  fBouton.addEventListener('click', function () {
    var fermees = cuves.map(function (c, i) { return c.classList.contains('ouvert') ? -1 : i; }).filter(function (i) { return i >= 0; });
    if (fermees.length) porteFrigo(fermees[0], true); else cuves.forEach(function (c, i) { porteFrigo(i, false); });
    var rf = frigo.getBoundingClientRect(); if (rf.top < 60 || rf.bottom > innerHeight) frigo.scrollIntoView({ behavior: calme ? 'auto' : 'smooth', block: 'center' });
  });

  /* ---------- 5. Le panneau à lettres ---------- */
  var rails = $('#rails'), platChamp = $('#plat'), lignes = (C.panneau || []).map(function (t) { return { t: t, moi: false }; }), ordre = [1, 2, 3, 0], tour = 0, alP = hasard(7);
  lignes.forEach(function () { rails.appendChild(cree('div', 'rail')); });
  function tailleRails() { var l = rails.clientWidth - (innerWidth < 620 ? 20 : 36); rails.style.setProperty('--rf', borne(l / 14, 15, 54).toFixed(1) + 'px'); }
  function ecris(i, anime) {
    var rail = rails.children[i]; rail.textContent = '';
    lignes[i].t.split('').forEach(function (ch, k) {
      var c = cree('span', 'c' + (ch === ' ' ? ' vide' : ''), ch === ' ' ? '' : ch);
      if (ch !== '.' && ch !== ' ') c.style.setProperty('--r', (alP() * 7 - 3.5).toFixed(1) + 'deg');
      if (anime && !calme) { c.classList.add('arrive'); c.style.setProperty('--dl', (k * .045).toFixed(3) + 's'); }
      rail.appendChild(c);
    });
  }
  function remplace(i, texte, moi) {
    var rail = rails.children[i], vieux = $$('.c', rail);
    lignes[i] = { t: texte, moi: moi };
    if (calme) { ecris(i, false); return; }
    vieux.forEach(function (c, k) { c.classList.remove('arrive'); c.style.setProperty('--dl', (k * .02).toFixed(3) + 's'); c.style.setProperty('--rt', (alP() * 200 - 100).toFixed(0) + 'deg'); void c.offsetWidth; c.classList.add('tombe'); });
    setTimeout(function () { ecris(i, true); }, vieux.length ? 380 + vieux.length * 20 : 0);
  }
  tailleRails(); lignes.forEach(function (l, i) { ecris(i, false); });
  $('#panneau').addEventListener('vu', function () { if (!calme) lignes.forEach(function (l, i) { setTimeout(function () { ecris(i, true); }, i * 260); }); });
  $('#pa-forme').addEventListener('submit', function (e) {
    e.preventDefault();
    var t = platChamp.value.replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().toLocaleUpperCase('fr-FR').slice(0, 14); if (!t) { platChamp.focus(); return; }
    var libre = ordre.filter(function (i) { return !lignes[i].moi; }), i = libre.length ? libre[0] : ordre[tour++ % ordre.length];
    remplace(i, t, true); platChamp.value = ''; platChamp.blur();
    var rp = rails.getBoundingClientRect(); if (rp.top < 60 || rp.bottom > innerHeight) $('#panneau').scrollIntoView({ behavior: calme ? 'auto' : 'smooth', block: 'center' });
  });
  $('#decrocher').addEventListener('click', function () { tour = 0; (C.panneau || []).forEach(function (t, i) { setTimeout(function () { remplace(i, t, false); }, i * 120); }); });

  /* ---------- 6. La nuit ---------- */
  var quartier = $('#quartier'), immeubles = $('#immeubles'), curseur = $('#curseur'), horloge = $('#horloge'), chiffres = ['#h1', '#h2', '#m1', '#m2'].map(function (s) { return $(s); });
  var compte = $('#compte'), compteMot = $('#compte-mot'), nJouer = $('#n-jouer'), fenetres = [], avance = 0, joue = false, dejaJoue = false, etroit = null;
  var FACADES = [
    { f: 1.1, hh: 78, fa: '#f2c078', toit: '#c8553d', vo: '#5e8fb5', cols: 3, rangs: 3 },
    { f: 1.45, hh: 96, fa: '#f4a990', toit: '#b5483a', vo: '#3f8f78', cols: 4, rangs: 4 },
    { f: 1.25, hh: 64, fa: '#fbe3b0', toit: '#c8553d', vo: '#7a6fb0', cols: 3, rangs: 2, k12: true },
    { f: 1.5, hh: 88, fa: '#eebb6c', toit: '#b5483a', vo: '#5e8fb5', cols: 4, rangs: 3 },
    { f: 1, hh: 74, fa: '#f7b7a3', toit: '#c8553d', vo: '#3f8f78', cols: 3, rangs: 3 }
  ];
  var LUEURS = ['#ffe38a', '#ffe38a', '#fff1c2', '#ffd27a', '#bfe8ff'];
  function batis() {
    var e = innerWidth < 620; if (e === etroit) return; etroit = e;
    var al = hasard(2026), garde = {}; fenetres.forEach(function (f) { garde[f.cle] = f.main; });
    immeubles.textContent = ''; fenetres = [];
    FACADES.forEach(function (F, n) {
      if (e && (n === 0 || n === 4)) return;
      var im = cree('div', 'im'), cols = e ? 3 : F.cols, g = cree('div', 'grille');
      im.style.cssText = '--f:' + F.f + ';--hh:' + F.hh + '%;--fa:' + F.fa + ';--toit:' + F.toit + ';--cols:' + cols;
      im.appendChild(cree('i', 'ombre')); im.appendChild(g);
      for (var k = 0; k < cols * F.rangs; k++) {
        var fe = cree('i', 'fe'), cle = n + '-' + k; fe.style.cssText = '--vo:' + F.vo + ';--lu:' + LUEURS[Math.floor(al() * LUEURS.length)];
        g.appendChild(fe); fenetres.push({ el: fe, t: .05 + al() * .8, main: garde[cle] || '', cle: cle }); fe._f = fenetres[fenetres.length - 1];
      }
      if (n % 2 === 0) { var ch = cree('i', 'cheminee'); ch.style.setProperty('--cx', (14 + al() * 56).toFixed(0) + '%'); im.insertBefore(ch, im.firstChild); }
      var rdc = cree('div', 'rdc' + (F.k12 ? ' chez' : ''));
      if (F.k12) { rdc.appendChild(cree('b', 'caisson-mini', 'K12 SHOP')); var v = cree('div', 'vitrine'); v.appendChild(cree('i')); v.appendChild(cree('i')); v.appendChild(cree('i')); rdc.appendChild(v); rdc.appendChild(cree('i', 'halo')); }
      im.appendChild(rdc); immeubles.appendChild(im);
    });
    nuit(avance, true);
  }
  // Chaque écriture de la nuit est gardée en mémoire : on ne touche à la page que si la valeur a changé.
  var derniers = '', soleil = $('.soleil', quartier), nVu = -1, solVu = '', allumeesVu = -1, inconnueVu = null;
  function nuit(p, force) {
    avance = borne(p, 0, 1);
    // Le soleil glisse à chaque image (son calque seul bouge). Le reste de la tombée du jour (ciel, façades, lueurs)
    // se repeint par 250 petits pas au lieu d'une fois par image : à l'oeil, c'est le même fondu.
    var nExact = borne(avance * 1.2, 0, 1), n = Math.round(nExact * 250) / 250, sol = 'translate3d(0,' + (nExact * 380).toFixed(1) + 'px,0)';
    if (sol !== solVu) { solVu = sol; soleil.style.transform = sol; }
    if (n !== nVu) { nVu = n; quartier.style.setProperty('--n', n); }
    var allumees = 0;
    fenetres.forEach(function (f) { var eteinte = f.main ? f.main === 'off' : avance >= f.t; if (!eteinte) allumees++; if (f.eteinte !== eteinte || force) { f.eteinte = eteinte; f.el.classList.toggle('off', eteinte); } });
    if (allumees !== allumeesVu) {
      allumeesVu = allumees; compte.textContent = allumees; compteMot.textContent = allumees > 1 ? 'fenêtres encore allumées' : allumees === 1 ? 'fenêtre encore allumée' : 'fenêtre allumée : tout le quartier dort';
      quartier.classList.toggle('dort-la', allumees === 0);
    }
    var inconnue = avance > .93, min = Math.round(20 * 60 + avance * 330), h = Math.floor(min / 60) % 24, m = min % 60;
    var txt = inconnue ? '....' : (h < 10 ? '0' : '') + h + (m < 10 ? '0' : '') + m;
    if (inconnue !== inconnueVu) { inconnueVu = inconnue; chiffres.forEach(function (c) { c.classList.toggle('pts', inconnue); }); horloge.classList.toggle('inconnue', inconnue); }
    if (txt !== derniers) { for (var i = 0; i < 4; i++) if (txt[i] !== derniers[i]) { var c = chiffres[i]; c.textContent = inconnue ? '..' : txt[i]; if (!joue || i < 3) { c.classList.remove('change'); void c.offsetWidth; c.classList.add('change'); } } derniers = txt; }
    // Quand l'horloge tourne seule, le curseur avance par 250 crans (un pixel environ) ; sous le doigt, il garde ses 1000 crans.
    var cran = joue ? Math.round(avance * 250) * 4 : Math.round(avance * 1000);
    if (+curseur.value !== cran) curseur.value = cran;
  }
  function jouer(oui) { joue = oui; dejaJoue = true; nJouer.textContent = oui ? 'Arrêter l’horloge' : avance >= 1 ? 'Rejouer la nuit' : 'Laisser passer la nuit'; if (oui) { if (avance >= 1) rallume(); reveille(); } }
  function rallume() { fenetres.forEach(function (f) { f.main = ''; }); nuit(0, true); }
  // La nuit ne passe que sous les yeux : hors de l'écran, l'horloge attend, et repart là où elle en était.
  suis(quartier, function () { if (joue) reveille(); });
  abonnes.push(function (dt) { if (!joue || !quartier._la) return false; nuit(avance + dt / 17); if (avance >= 1) { jouer(false); return false; } return true; });
  curseur.addEventListener('input', function () { if (joue) jouer(false); dejaJoue = true; nuit(curseur.value / 1000); nJouer.textContent = avance >= 1 ? 'Rejouer la nuit' : 'Laisser passer la nuit'; });
  nJouer.addEventListener('click', function () { jouer(!joue); });
  $('#n-rallumer').addEventListener('click', function () { jouer(false); rallume(); nJouer.textContent = 'Laisser passer la nuit'; });
  quartier.addEventListener('vu', function () { if (!calme && !dejaJoue) setTimeout(function () { if (!dejaJoue) jouer(true); }, 600); });
  // Éteindre du doigt : une tape, ou on glisse sur les fenêtres
  var glisse = null, derniere = null;
  function bascule(fe, etat) { var f = fe._f; if (!f || derniere === fe) return; derniere = fe; f.main = etat; nuit(avance); }
  quartier.addEventListener('pointerdown', function (e) {
    var fe = e.target.closest('.fe'); if (!fe) return;
    if (joue) jouer(false); dejaJoue = true; derniere = null; glisse = fe._f.eteinte ? 'on' : 'off'; bascule(fe, glisse);
  });
  quartier.addEventListener('pointermove', function (e) { if (!glisse) return; var el = D.elementFromPoint(e.clientX, e.clientY), fe = el && el.closest ? el.closest('.fe') : null; if (fe) bascule(fe, glisse); });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (n) { quartier.addEventListener(n, function () { glisse = null; }); });
  batis();

  /* ---------- 7. Venir : la plaque d'horaires, l'adresse ---------- */
  var plaque = $('#horaires'), hoLignes = $('#ho-lignes'), ang = 0, vAng = 0;
  ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'].forEach(function (j) {
    var l = cree('label', 'ho-l'), i = cree('input'); l.appendChild(cree('span', '', j)); i.type = 'text'; i.maxLength = 22; i.placeholder = '.. h .. à .. h ..'; i.setAttribute('aria-label', 'Horaires du ' + j.toLowerCase()); i.autocomplete = 'off';
    l.appendChild(i); hoLignes.appendChild(l);
  });
  function pousse(v) { if (calme) return; vAng += v; reveille(); }
  plaque.parentNode.addEventListener('vu', function () { pousse(70); });
  plaque.addEventListener('pointerenter', function (e) { if (e.pointerType !== 'touch') pousse(e.movementX < 0 ? -26 : 26); });
  $('.ho-tete', plaque).addEventListener('click', function () { pousse(ang > 0 ? -60 : 60); });
  var accrochePlaque = suis(plaque.parentNode, function () { if (vAng || ang) reveille(); });
  abonnes.push(function (dt) {
    if (calme || (Math.abs(ang) < .03 && Math.abs(vAng) < .08)) { if (ang || vAng) { ang = vAng = 0; plaque.style.transform = 'rotate(0deg)'; } return false; }
    if (!accrochePlaque._la) return false; // hors de l'écran, la plaque garde son élan et finit de se balancer au retour
    vAng += (-ang * 34 - vAng * 1.25) * dt; var lim = vw < 620 ? 3.5 : 14; ang = borne(ang + vAng * dt, -lim, lim);
    plaque.style.transform = 'rotate(' + ang.toFixed(2) + 'deg)'; return true; // le calque de la plaque tourne seul : rien n'est recalculé à l'intérieur
  });
  var copier = $('#copier');
  copier.addEventListener('click', function () {
    var fait = function () { copier.textContent = 'Adresse copiée'; setTimeout(function () { copier.textContent = 'Copier l’adresse'; }, 2200); };
    try { navigator.clipboard.writeText(C.adresse).then(fait, fait); } catch (e) { fait(); }
  });
  if (C.carteLien) $('#itineraire').href = C.carteLien;

  /* ---------- 8. Les étiquettes des pages ---------- */
  $$('#etiquettes .etoile').forEach(function (b) {
    b.addEventListener('click', function () { b.classList.remove('tourne'); void b.offsetWidth; b.classList.add('tourne'); });
    b.addEventListener('animationend', function () { b.classList.remove('tourne'); });
  });

  /* ---------- Défilement : tube, enseigne, lanières, 12, plaque ---------- */
  // Les positions sont mesurées une seule fois (chargement, polices, redimensionnement, page qui change de hauteur) et gardées
  // en mémoire. Pendant le défilement : une lecture (scrollY), puis seulement des écritures de transform, aucune mesure.
  var eGauche = $('.e-gauche', caisson), eDroite = $('.e-droite', caisson), geo = { max: 0, milieu: 0 };
  var yAvant = scrollY, tAvant = performance.now(), scVu = -1, avVu = '', douzeVu = '';
  function mesure() {
    var y = scrollY, r = epicerie.getBoundingClientRect();
    vw = innerWidth; vh = innerHeight;
    geo.max = D.scrollingElement.scrollHeight - vh; geo.milieu = r.top + y + r.height / 2;
  }
  function defile() {
    var y = scrollY, t = performance.now(), dt = Math.max(8, t - tAvant), v = (y - yAvant) / dt * 1000; yAvant = y; tAvant = t;
    vDefil = vDefil * .6 + v * .4;
    var av = 'scaleX(' + (geo.max > 0 ? borne(y / geo.max, 0, 1).toFixed(4) : 0) + ')';
    if (av !== avVu) { avVu = av; tube.style.transform = av; }
    if (!calme) {
      var sc = borne(y / vh, 0, 1);
      if (sc !== scVu) { scVu = sc; eGauche.style.transform = 'translate3d(0,' + (sc * -70).toFixed(1) + 'px,0)'; eDroite.style.transform = 'translate3d(0,' + (sc * -24).toFixed(1) + 'px,0)'; }
      if (epicerie._la) { var p = (geo.milieu - y - vh / 2) / vh, dz = 'translate3d(0,calc(-50% + ' + (p * -110).toFixed(1) + 'px),0) rotate(' + (p * 7).toFixed(2) + 'deg)'; if (dz !== douzeVu) { douzeVu = dz; douze.style.transform = dz; } }
      if (accrochePlaque._la) vAng += borne(v * .012, -9, 9);
      reveille();
    }
  }
  abonnes.push(function () { vDefil *= .86; return Math.abs(vDefil) > 4; });
  addEventListener('scroll', defile, { passive: true });
  var redim, vwAvant = vw;
  addEventListener('resize', function () {
    clearTimeout(redim); redim = setTimeout(function () {
      mesure();
      // Sur téléphone, la barre d'adresse qui se replie change la hauteur seulement : on ne retend pas le rideau pour ça.
      if (vw !== vwAvant) { vwAvant = vw; tendLanieres(); tailleRails(); batis(); mesure(); }
      defile();
    }, 160);
  });
  // La page change de hauteur (polices arrivées, réponse sur deux lignes) : on remesure, juste après la mise en page, sans rien forcer.
  if (window.ResizeObserver) new ResizeObserver(mesure).observe(D.body);
  if (D.fonts && D.fonts.ready) D.fonts.ready.then(function () { mesure(); defile(); });
  mesure(); defile(); reveille();
  window.__k12 = true;
})();
