// La REF'Bar : « Ce soir, on allume ».
// Règle du mouvement : ce script ne lit jamais le réglage « animations réduites » du système.
// Tout bouge toujours ; le mode calme n'existe que sur demande, avec ?calme=1.
(function () {
  'use strict';
  var H = document.documentElement, C = window.CONTENU || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var calme = /[?&]calme=1/.test(location.search);
  H.classList.add('js'); if (calme) H.classList.add('calme');
  var borne = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var hasard = function (a, b) { return a + Math.random() * (b - a); };
  var JOURS = C.horaires.map(function (h) { return h[0]; });
  var auj = (new Date().getDay() + 6) % 7; // 0 = lundi
  var heure = function (n) { return (n % 24) + '\u00a0h'; };
  var plages = function (p, sep) { return p ? p.map(function (x) { return heure(x[0]) + ' à\u00a0' + heure(x[1]); }).join(sep || ', ') : null; };
  var el = function (b, c, t) { var e = document.createElement(b); if (c) e.className = c; if (t != null) e.textContent = t; return e; };

  /* ---------- ambiance (couleur des néons) ---------- */
  var PAL = Object.keys(C.palettes), COUL = [], EG = { n: 0, b: [], w: 0, d: 1, lu: .02, c: [] };
  function couleurs() { var s = getComputedStyle(H); COUL = ['--n1', '--n3', '--n2', '--papier', '--n1'].map(function (v) { return s.getPropertyValue(v).trim(); }); EG.c = [COUL[0], COUL[2], COUL[1]]; }
  function palette(n) { if (PAL.indexOf(n) < 0) return; H.dataset.palette = n; var m = $('meta[name=theme-color]'); if (m) m.content = C.palettes[n].theme; couleurs(); sale = true; }
  palette(new URLSearchParams(location.search).get('palette') || 'rose');
  addEventListener('message', function (e) { if (e.data && e.data.type === 'kazura-couleur') palette(e.data.palette); });

  /* ---------- liens ---------- */
  $$('[data-tel]').forEach(function (a) { a.href = 'tel:' + C.telLien; });
  $$('[data-tel-t]').forEach(function (a) { a.textContent = C.telephone; });
  $$('[data-carte]').forEach(function (a) { a.href = C.carte; });

  /* ---------- égaliseur sous la barre ---------- */
  // Un seul canvas : les mêmes barres (26 au téléphone, 64 à l'ordinateur), la même danse, le même étirement.
  // En éléments animés un par un, elles coûtaient à elles seules 5 ms par image sur un téléphone.
  var egal = $('#egal'), eg = el('canvas'), egx = eg.getContext('2d');
  egal.appendChild(eg);
  function tailleEgal() {
    var n = innerWidth < 700 ? 26 : 64;
    if (EG.n !== n) { EG.n = n; EG.b = []; for (var i = 0; i < n; i++) EG.b.push({ d: hasard(0, 1.4), h: hasard(.4, 1) }); }
    EG.w = egal.clientWidth || innerWidth; EG.d = Math.min(window.devicePixelRatio || 1, innerWidth < 700 ? 1.5 : 2); // densité plafonnée à 1,5 sur téléphone
    var cw = Math.round(EG.w * EG.d), ch = Math.round(40 * EG.d); if (eg.width !== cw || eg.height !== ch) { eg.width = cw; eg.height = ch; }
  }
  function dessinerEgal(t, etire) {
    var n = EG.n, d = EG.d, pas = (EG.w + 3) / n, lw = Math.max(1, Math.round((pas - 3) * d) / d), r = Math.min(3, lw / 2);
    egx.setTransform(d, 0, 0, d, 0, 0); egx.clearRect(0, 0, EG.w, 40);
    for (var i = 0; i < n; i++) {
      var b = EG.b[i], s = 1;
      if (!calme) { var u = (t / 1000 + b.d) / 1.05, f = u % 1; if (Math.floor(u) % 2) f = 1 - f; f = f * f * (3 - 2 * f); s = .22 + (b.h - .22) * f; }
      var h = 9 * s * etire, ry = 3 * s * etire, x = Math.round(i * pas * d) / d; // bords calés sur les pixels de l'écran
      egx.globalAlpha = borne((EG.lu - i / n) * 80 + 1, .3, 1); egx.fillStyle = EG.c[i % 3];
      egx.beginPath(); egx.moveTo(x, 0); egx.lineTo(x + lw, 0); egx.lineTo(x + lw, h - ry); egx.quadraticCurveTo(x + lw, h, x + lw - r, h); egx.lineTo(x + r, h); egx.quadraticCurveTo(x, h, x, h - ry); egx.closePath(); egx.fill();
    }
  }

  /* ---------- 1. l'enseigne : elle s'allume lettre par lettre, on l'éteint, on touche une lettre ---------- */
  var acc = $('#accueil'), tubes = $$('#enseigne .tube'), inter = $('#inter'), allume = true, minut = [];
  function neuf(t) { t.classList.remove('gres', 'neuf'); void t.offsetWidth; t.classList.add('on', 'neuf'); setTimeout(function () { t.classList.remove('neuf'); }, 800); }
  function allumer() { minut.forEach(clearTimeout); minut = []; acc.classList.remove('eteint'); tubes.forEach(function (t, i) { minut.push(setTimeout(function () { neuf(t); }, calme ? 0 : 350 + i * 160)); }); }
  function eteindre() { minut.forEach(clearTimeout); minut = []; tubes.forEach(function (t) { t.classList.remove('on', 'gres', 'neuf'); }); acc.classList.add('eteint'); }
  inter.addEventListener('click', function () { allume = !allume; inter.setAttribute('aria-pressed', allume); $('.inter-t', inter).textContent = allume ? 'Éteindre l’enseigne' : 'Rallumer l’enseigne'; if (allume) allumer(); else eteindre(); });
  $$('.tube').forEach(function (t) { t.addEventListener('click', function () { if (t.classList.contains('on')) t.classList.remove('on', 'neuf', 'gres'); else neuf(t); }); });
  allumer();
  if (!calme) setInterval(function () { // un tube grésille de temps en temps
    if (document.hidden) return;
    var on = $$('.tube.on').filter(function (t) { return !t.closest('.hors'); }); // seulement dans une rubrique à l'écran, sans lire la mise en page
    if (!on.length) return; var t = on[Math.floor(Math.random() * on.length)];
    t.classList.remove('gres'); void t.offsetWidth; t.classList.add('gres'); setTimeout(function () { t.classList.remove('gres'); }, 700);
  }, 2600);
  $('#auj-j').textContent = JOURS[auj].toLowerCase();
  $('#auj-h').innerHTML = (plages(C.horaires[auj][1], '<br>') || 'Horaires à confirmer');
  var halo = $('#halo');
  var haloVu = false; // l'accueil est le premier bloc de la page : sa position dans le document ne se relit pas à chaque mouvement
  acc.addEventListener('pointermove', function (e) { if (e.pointerType !== 'mouse') return; if (!haloVu) { haloVu = true; halo.style.willChange = 'transform'; halo.style.opacity = 1; } halo.style.transform = 'translate(' + (e.pageX - P.accX) + 'px,' + (e.pageY - P.accY) + 'px)'; });
  acc.addEventListener('pointerleave', function () { haloVu = false; halo.style.opacity = 0; halo.style.willChange = ''; });

  /* ---------- 2. le bandeau lumineux ---------- */
  var bd = $('#bandeau'), bx = 0, bw = 0;
  (function () { var h = ''; for (var k = 0; k < 2; k++) C.bandeau.forEach(function (m) { h += '<span>' + m + '</span><svg><use href="#etoile"/></svg>'; }); bd.innerHTML = h + h; })();

  /* ---------- 3. le tableau à lettres ---------- */
  var tab = $('#tableau'), ti = 0;
  function lettre(c, cl) { var s = el('span', 'tl' + (cl || ''), c); s.style.setProperty('--i', ti++); s.style.setProperty('--r', hasard(-26, 26).toFixed(0) + 'deg'); return s; }
  function mot(m, cl) { var g = el('span', 't-mot'); m.split('').forEach(function (c) { g.appendChild(c === ' ' ? el('span', 'te') : lettre(c, cl)); }); return g; }
  C.tableau.forEach(function (r) { var d = el('div', 't-rang' + (r.ton ? ' ' + r.ton : '')); r.mots.forEach(function (m) { d.appendChild(mot(m)); }); if (r.suite) d.appendChild(el('span', 't-suite')); tab.appendChild(d); });
  var vous = el('div', 't-rang t-vous'); vous.appendChild(mot(C.tableauVous)); tab.appendChild(vous);
  tab.addEventListener('click', function (e) { // une lettre touchée tombe, puis revient
    var l = e.target.closest('.tl'); if (!l || l.classList.contains('chute')) return;
    l.classList.remove('repose'); l.classList.add('chute');
    setTimeout(function () { l.classList.remove('chute'); l.classList.add('repose'); setTimeout(function () { l.classList.remove('repose'); }, 600); }, 1500);
  });
  var ancien = C.tableauVous;
  $('#saisie').addEventListener('input', function () {
    var v = this.value.toUpperCase().replace(/[^A-Z0-9ÀÂÄÇÉÈÊËÎÏÔÖÙÛÜ '’!?]/g, '').slice(0, 14), txt = v || C.tableauVous;
    var commun = 0; while (commun < txt.length && commun < ancien.length && txt[commun] === ancien[commun]) commun++;
    vous.innerHTML = ''; var g = el('span', 't-mot');
    txt.split('').forEach(function (c, i) { g.appendChild(c === ' ' ? el('span', 'te') : lettre(c, i >= commun ? ' repose' : '')); });
    vous.appendChild(g); ancien = txt;
    setTimeout(function () { $$('.repose', vous).forEach(function (l) { l.classList.remove('repose'); }); }, 650);
  });

  /* ---------- 4. les affiches ---------- */
  var zone = $('#aff-zone'), bande = $('#affiches'), affs = $$('.aff');
  var lie = matchMedia('(hover:hover) and (pointer:fine)').matches; // à la souris, la bande glisse avec le défilement
  if (lie) zone.classList.add('lie');
  affs.forEach(function (a, i) {
    a.style.setProperty('--i', i);
    function dec() { if (a.classList.contains('pend') || !a.classList.contains('pose')) return; a.classList.add('pend'); setTimeout(function () { a.classList.remove('pend'); }, 1600); }
    a.addEventListener('click', dec);
    a.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); dec(); } });
  });
  (function () { // la manette de l'affiche d'arcade, en gros carrés (dessin générique, aucun personnage de jeu existant)
    var px = $('.aff-px'); if (!px) return;
    var M = ['..XXXX..', '..XXXX..', '...XX...', '...XX...', '.XXXXXX.', 'XXXXXXXX', 'XXXXXXXX'], o = [];
    M.forEach(function (l, y) { l.split('').forEach(function (c, x) { if (c === 'X') o.push((x * 6) + 'cqw ' + (y * 6) + 'cqw 0 0 currentColor'); }); });
    px.style.boxShadow = o.join(',');
  })();

  /* ---------- 5. le karaoké ---------- */
  var sc = $('#karaoke'), piste = $('#piste'), bille = $('#bille'), paroles = $('#paroles'), bouton = $('#chante'), ecran = $('#ecran'), bravo = $('#bravo');
  var K = { l: 0, m: 0, n: 0, joueur: false, fini: false, energie: 0, vu: false, dernier: 0, retour: null, w: -1, lh: 0, cx: [], alt: false }, lignes = [];
  C.paroles.forEach(function (mots) { var p = el('p', 'ligne'); mots.forEach(function (m) { p.appendChild(el('span', 'mot', m)); }); piste.appendChild(p); lignes.push(p); });
  function ajuster(force) { // la plus longue ligne tient toujours dans l'écran
    var w = paroles.clientWidth;
    if (force || w !== K.w) {
      var base = borne(w / 11.5, 18, 60), max = 0; K.w = w;
      piste.style.setProperty('--kf', base + 'px');
      lignes.forEach(function (l) { var s = 0; $$('.mot', l).forEach(function (m) { s += m.offsetWidth; }); s += (l.children.length - 1) * base * .26; max = Math.max(max, s); });
      if (max > w - 10) piste.style.setProperty('--kf', (base * (w - 10) / max).toFixed(1) + 'px');
    }
    // la place de chaque mot est lue ici, une fois : la bille ne relit plus la mise en page à chaque mot chanté
    K.lh = lignes[0].offsetHeight;
    K.cx = lignes.map(function (l) { return [].map.call(l.children, function (m) { return m.offsetLeft + m.offsetWidth / 2; }); });
    placer(); viser();
  }
  var compte = $('#k-compte');
  function placer() {
    piste.style.transform = 'translateY(' + (-K.l * K.lh) + 'px)';
    lignes.forEach(function (l, i) { l.classList.toggle('ici', i === K.l); l.classList.toggle('suite', i === K.l + 1); l.classList.toggle('passe', i < K.l); });
    compte.textContent = (K.l + 1) + ' / ' + lignes.length;
  }
  function viser() { var c = K.cx[K.l]; bille.style.transform = 'translate(' + c[Math.min(K.m, c.length - 1)] + 'px,22px)'; }
  function debut() { K.l = 0; K.m = 0; K.n = 0; K.fini = false; $$('.mot.dit', piste).forEach(function (m) { m.classList.remove('dit'); }); bravo.hidden = true; piste.style.visibility = ''; bille.style.visibility = ''; placer(); viser(); }
  function chanter(parJoueur) {
    if (K.fini) return;
    var l = lignes[K.l]; l.children[K.m].classList.add('dit');
    K.alt = !K.alt; bille.classList.toggle('saute', K.alt); bille.classList.toggle('saute2', !K.alt); // deux animations jumelles en alternance : le saut repart sans forcer un calcul de mise en page
    if (parJoueur) { note(K.n); envoyerNote(); K.energie = Math.min(1, K.energie + .12); }
    K.n++; K.m++;
    if (K.m >= l.children.length) {
      if (K.l >= lignes.length - 1) { fin(parJoueur); return; }
      K.m = 0; K.l++; placer();
    }
    viser();
  }
  function fin(parJoueur) {
    K.fini = true; clearTimeout(K.retour);
    if (parJoueur) { K.energie = 1; setTimeout(function () { bravo.hidden = false; piste.style.visibility = 'hidden'; bille.style.visibility = 'hidden'; confettis(); }, 450); K.retour = setTimeout(function () { K.joueur = false; bouton.classList.remove('joue'); debut(); }, 16000); }
    else K.retour = setTimeout(debut, 1500);
  }
  function appui() {
    if (!K.joueur) { K.joueur = true; bouton.classList.add('joue'); clearTimeout(K.retour); debut(); }
    if (K.fini) return; chanter(true);
  }
  var tenir = null, t0 = null, ptr = false;
  function enfonce(e) { if (e.target.closest('#encore')) return; ptr = true; bouton.classList.add('appui'); appui(); clearTimeout(t0); clearInterval(tenir); t0 = setTimeout(function () { tenir = setInterval(appui, 280); }, 430); }
  function lache() { bouton.classList.remove('appui'); clearTimeout(t0); clearInterval(tenir); tenir = null; }
  [bouton, ecran].forEach(function (b) { b.addEventListener('pointerdown', enfonce); ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (n) { b.addEventListener(n, lache); }); b.addEventListener('contextmenu', function (e) { e.preventDefault(); }); });
  bouton.addEventListener('click', function () { if (ptr) { ptr = false; return; } appui(); }); // clavier : Entrée ou barre d'espace
  $('#encore').addEventListener('click', function () { clearTimeout(K.retour); debut(); });
  // le son : une note par mot, seulement quand on touche le micro
  var ctx = null, son = true, bs = $('#son');
  bs.addEventListener('click', function () { son = !son; bs.setAttribute('aria-pressed', son); bs.textContent = son ? 'Son : activé' : 'Son : coupé'; });
  function note(i) {
    if (!son) return;
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)(); if (ctx.state === 'suspended') ctx.resume();
      var o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime;
      o.type = 'triangle'; o.frequency.value = C.melodie[i % C.melodie.length];
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(.15, t + .015); g.gain.exponentialRampToValueAtTime(.001, t + .34);
      o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + .36);
    } catch (e) { }
  }
  function envoyerNote() {
    if (calme) return;
    var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('class', 'vole'); s.setAttribute('viewBox', '0 0 40 56');
    s.innerHTML = '<use href="#note"/>';
    var r = bouton.getBoundingClientRect(), p = sc.getBoundingClientRect();
    s.style.left = (r.left + r.width / 2 - p.left - 15 + hasard(-34, 34)) + 'px'; s.style.top = (r.top - p.top - 20) + 'px';
    s.style.setProperty('--dx', hasard(-110, 110).toFixed(0) + 'px'); s.style.color = 'var(--n' + (1 + Math.floor(Math.random() * 3)) + ')';
    sc.appendChild(s); setTimeout(function () { s.remove(); }, 1300);
  }
  function confettis() {
    if (calme) return;
    var r = ecran.getBoundingClientRect(), p = sc.getBoundingClientRect();
    for (var i = 0; i < 34; i++) {
      var c = el('i', 'conf'); c.style.left = (r.left - p.left + hasard(0, r.width)) + 'px'; c.style.top = (r.top - p.top - 20) + 'px';
      c.style.setProperty('--c', 'var(--n' + (1 + i % 3) + ')'); c.style.setProperty('--dx', hasard(-90, 90).toFixed(0) + 'px'); c.style.setProperty('--dy', hasard(r.height * .8, r.height + 160).toFixed(0) + 'px');
      c.style.setProperty('--rt', hasard(-520, 520).toFixed(0) + 'deg'); c.style.setProperty('--d', hasard(1.1, 2.3).toFixed(2) + 's');
      sc.appendChild(c); (function (c) { setTimeout(function () { c.remove(); }, 2500); })(c);
    }
  }
  // applaudimètre
  var barres = [], ab = $('#applau-b'), salle = $('#salle'), dernierNiv = -1;
  for (var i = 0; i < 12; i++) { var b = el('i'); b.style.setProperty('--k', i); b.style.setProperty('--c', i < 6 ? 'var(--n2)' : i < 10 ? 'var(--n3)' : 'var(--n1)'); ab.appendChild(b); barres.push(b); }
  function applaudir() {
    var n = Math.round(K.energie * 12); if (n === dernierNiv) return; dernierNiv = n;
    barres.forEach(function (b, i) { b.classList.toggle('on', i < n); });
    salle.textContent = C.salle[n >= 11 ? 3 : n >= 6 ? 2 : n >= 2 ? 1 : 0];
  }
  new IntersectionObserver(function (l) { K.vu = l[0].isIntersecting; }, { threshold: .25 }).observe(ecran);
  // les pancartes du public : les vrais avis Google
  var pan = $('#pancartes');
  C.avis.forEach(function (a, i) {
    var f = el('figure', 'panc'); f.style.setProperty('--i', i); f.style.setProperty('--r', [-2, 1.8, -1.2][i % 3] + 'deg');
    f.appendChild(el('blockquote', '', '«\u00a0' + a[0] + '\u00a0»')); f.appendChild(el('figcaption', '', a[1] + (/Google/.test(a[1]) ? '' : ', avis Google')));
    f.addEventListener('click', function () { f.classList.add('hop'); setTimeout(function () { f.classList.remove('hop'); }, 240); });
    pan.appendChild(f);
  });
  $$('#etoiles svg').forEach(function (s, i) { s.style.setProperty('--i', i); });

  /* ---------- 6. la semaine : l'éphéméride et la grille ---------- */
  var feuille = $('#feuille'), pile = $('#eph-pile'), rangs = $('#rangs'), jour = calme ? auj : (auj + 5) % 7;
  function contenuFeuille(j) {
    var h = C.horaires[j];
    return '<span class="f-q">' + (j === auj ? 'Aujourd’hui' : 'Cette semaine') + '</span><span class="f-j">' + h[0] + '</span><span class="f-h">' + (plages(h[1], '<br>') || 'Horaires à confirmer') + '</span><span class="f-s">Ce soir-là : votre soirée ici</span>';
  }
  function montrer(j, anime) {
    if (anime && !calme && j !== jour) { var v = feuille.cloneNode(true); v.removeAttribute('id'); v.classList.add('arrache'); pile.parentNode.appendChild(v); setTimeout(function () { v.remove(); }, 820); }
    jour = j; feuille.innerHTML = contenuFeuille(j);
    $$('.rang', rangs).forEach(function (r, i) { r.classList.toggle('choisi', i === j); });
  }
  C.horaires.forEach(function (h, j) {
    var b = el('button', 'rang' + (j === auj ? ' auj' : '') + (h[1] ? '' : ' inconnu')), seg = ''; b.type = 'button';
    (h[1] || []).forEach(function (x, k) {
      var tard = x[1] > 22;
      seg += '<i' + (tard ? ' class="tard"' : '') + ' style="--a:' + ((x[0] - 9) / 17 * 100).toFixed(2) + ';--l:' + ((x[1] - x[0]) / 17 * 100).toFixed(2) + ';--t:' + (tard ? (22 - x[0]) / (x[1] - x[0]) * 100 : 100).toFixed(1) + ';--i:' + (j + k) + '"></i>';
    });
    b.innerHTML = '<span class="rang-j">' + h[0] + (j === auj ? '<small>aujourd’hui</small>' : '') + '</span><span class="rang-p">' + seg + '</span><span class="rang-h">' + (plages(h[1]) || 'à confirmer avec vous') + '</span>';
    b.addEventListener('click', function () { montrer(j, true); });
    rangs.appendChild(b);
  });
  montrer(jour, false);
  pile.addEventListener('click', function () { montrer((jour + 1) % 7, true); });

  /* ---------- 7. la borne d'arcade : un casse-briques ---------- */
  var cv = $('#toile'), cx = cv.getContext('2d'), msg = $('#borne-m'), scoreEl = $('#score'), manette = $('#manette i'), jeton = $('#jeton');
  var G = { w: 200, h: 150, px: 100, pw: 36, bx: 100, by: 118, vx: 52, vy: -84, br: [], casse: 0, joueur: false, score: 0, vies: 3, vu: false, cible: 100, pause: 0 };
  function briques() { G.br = []; G.casse = 0; for (var r = 0; r < 5; r++) for (var c = 0; c < 10; c++) G.br.push({ x: 5 + c * 19, y: 16 + r * 9, w: 18, h: 7, c: r, m: false }); }
  function relance() { G.bx = G.px; G.by = 124; G.vx = (Math.random() < .5 ? -1 : 1) * hasard(38, 62); G.vy = -84; }
  function dire(t) { msg.textContent = t; }
  function demarrer() {
    G.joueur = true; G.score = 0; G.vies = 3; scoreEl.textContent = '0'; briques(); relance(); dire(''); G.pause = .5;
    if (!calme) { jeton.classList.remove('insere'); void jeton.offsetWidth; jeton.classList.add('insere'); setTimeout(function () { jeton.classList.remove('insere'); }, 520); }
  }
  function perdu() {
    if (!G.joueur) { if (G.casse > 34) briques(); relance(); return; }
    G.vies--;
    if (G.vies <= 0) { G.joueur = false; dire('Encore un jeton ?'); briques(); relance(); }
    else { relance(); G.pause = .6; }
  }
  function pasJeu(dt) {
    if (G.pause > 0) { G.pause -= dt; G.px += (G.cible - G.px) * Math.min(1, dt * 30); G.px = borne(G.px, G.pw / 2, G.w - G.pw / 2); G.bx = G.px; return; }
    if (!G.joueur) G.cible = G.bx + Math.sin(performance.now() / 600) * 9; // démonstration : la raquette suit la balle
    G.px += (G.cible - G.px) * Math.min(1, dt * (G.joueur ? 30 : 8)); G.px = borne(G.px, G.pw / 2, G.w - G.pw / 2);
    G.bx += G.vx * dt; G.by += G.vy * dt;
    if (G.bx < 3) { G.bx = 3; G.vx = Math.abs(G.vx); } if (G.bx > G.w - 3) { G.bx = G.w - 3; G.vx = -Math.abs(G.vx); } if (G.by < 3) { G.by = 3; G.vy = Math.abs(G.vy); }
    if (G.vy > 0 && G.by >= 134 && G.by <= 142 && Math.abs(G.bx - G.px) < G.pw / 2 + 3) { G.vy = -Math.abs(G.vy); G.vx = (G.bx - G.px) / (G.pw / 2) * 96; G.by = 134; }
    if (G.by > G.h + 8) { perdu(); return; }
    for (var i = 0; i < G.br.length; i++) {
      var b = G.br[i];
      if (!b.m && G.bx > b.x - 2 && G.bx < b.x + b.w + 2 && G.by > b.y - 2 && G.by < b.y + b.h + 2) {
        b.m = true; G.vy = -G.vy; G.casse++;
        if (G.joueur) { G.score++; scoreEl.textContent = G.score; }
        if (G.casse >= G.br.length) { if (G.joueur) { dire('Bravo !'); setTimeout(function () { if (G.joueur) dire(''); }, 1600); } briques(); relance(); G.pause = .8; }
        break;
      }
    }
  }
  function dessiner() {
    cx.fillStyle = '#02040f'; cx.fillRect(0, 0, G.w, G.h);
    G.br.forEach(function (b) { if (b.m) return; cx.fillStyle = COUL[b.c]; cx.fillRect(b.x, b.y, b.w, b.h); });
    cx.fillStyle = COUL[3]; cx.fillRect(Math.round(G.px - G.pw / 2), 138, G.pw, 5);
    cx.fillStyle = COUL[1]; cx.fillRect(Math.round(G.bx) - 3, Math.round(G.by) - 3, 6, 6);
    if (G.joueur) for (var v = 0; v < G.vies; v++) { cx.fillStyle = COUL[0]; cx.fillRect(5 + v * 9, 4, 6, 6); }
  }
  function viserRaquette(e) { var r = cv.getBoundingClientRect(); G.cible = (e.clientX - r.left) / r.width * G.w; }
  cv.addEventListener('pointerdown', function (e) { if (!G.joueur) demarrer(); viserRaquette(e); });
  cv.addEventListener('pointermove', function (e) { if (G.joueur) viserRaquette(e); });
  jeton.addEventListener('click', demarrer);
  addEventListener('keydown', function (e) { if (!G.joueur || !G.vu) return; if (e.key === 'ArrowLeft') G.cible = borne(G.px - 26, 0, G.w); else if (e.key === 'ArrowRight') G.cible = borne(G.px + 26, 0, G.w); });
  new IntersectionObserver(function (l) { G.vu = l[0].isIntersecting; }, { threshold: .1 }).observe(cv);
  briques(); dessiner();
  $$('#boites i').forEach(function (b, i) { b.style.setProperty('--i', i); });

  /* ---------- 8. venir : le numéro, la table ---------- */
  var num = $('#numero');
  C.telephone.split(' ').forEach(function (p, i) { var b = el('b', '', p); b.style.setProperty('--i', i); b.setAttribute('aria-hidden', 'true'); num.appendChild(b); });
  var js = $('#jours'), soir = auj, nb = 2, pl = $('#pile');
  ['L', 'M', 'M', 'J', 'V', 'S', 'D'].forEach(function (l, j) {
    var b = el('button', '', l); b.type = 'button'; b.setAttribute('aria-label', JOURS[j]); b.setAttribute('aria-pressed', j === soir);
    b.addEventListener('click', function () { soir = j; $$('button', js).forEach(function (x, k) { x.setAttribute('aria-pressed', k === j); }); });
    js.appendChild(b);
  });
  function majNb() { $('#nb').textContent = nb; while (pl.children.length > nb) pl.lastChild.remove(); while (pl.children.length < nb) pl.appendChild(el('i')); }
  $('#plus').addEventListener('click', function () { nb = Math.min(12, nb + 1); majNb(); });
  $('#moins').addEventListener('click', function () { nb = Math.max(1, nb - 1); majNb(); });
  majNb();
  $('#table').addEventListener('submit', function (e) {
    e.preventDefault(); var n = $('#prenom').value.trim(), t = this;
    $('#recu-d').textContent = nb + (nb > 1 ? ' personnes' : ' personne') + ', ' + JOURS[soir].toLowerCase() + ' soir' + (n ? ', au nom de ' + n : '') + '.';
    if (t.classList.contains('imprime') && !calme) { t.classList.remove('imprime'); setTimeout(function () { t.classList.add('imprime'); }, 380); } else t.classList.add('imprime');
  });

  /* ---------- 9. les pages ---------- */
  $$('#onglets span').forEach(function (s, i) { s.style.setProperty('--i', i); s.style.setProperty('--c', 'var(--n' + (1 + i % 3) + ')'); s.style.setProperty('--r', [-2, 1.5, -1, 2.5][i] + 'deg'); });

  /* ---------- bords déchirés ---------- */
  $$('.dechire').forEach(function (d) {
    var p = ['0% 100%'], x = 0; while (x < 100) { p.push(x.toFixed(1) + '% ' + hasard(8, 78).toFixed(0) + '%'); x += hasard(.7, 2.4); }
    p.push('100% ' + hasard(20, 70).toFixed(0) + '%', '100% 100%'); d.style.clipPath = 'polygon(' + p.join(',') + ')';
  });

  /* ---------- entrées ---------- */
  var io = new IntersectionObserver(function (l) {
    l.forEach(function (e) {
      if (!e.isIntersecting) return; var c = e.target; c.classList.add('vu'); io.unobserve(c);
      if (c.classList.contains('aff')) setTimeout(function () { c.classList.add('pose'); }, 700 + (+c.style.getPropertyValue('--i')) * 80);
      if (c.id === 'tableau') setTimeout(function () { c.classList.add('fini'); }, ti * 22 + 800);
      if (c.id === 'boites') setTimeout(function () { c.classList.add('pose'); }, 1500);
      if (c.id === 'eph' && !calme) { setTimeout(function () { montrer((jour + 1) % 7, true); }, 700); setTimeout(function () { montrer(auj, true); }, 1500); }
    });
  }, { threshold: .12, rootMargin: '0px 0px -5% 0px' });
  $$('.rev,.aff,.panc,#etoiles,#grille,#boites,#onglets,#tableau').forEach(function (e) { io.observe(e); });
  if (calme) { $$('.aff').forEach(function (a) { a.classList.add('pose'); }); tab.classList.add('vu', 'fini'); }

  /* ---------- menu, ancres, rubrique en cours ---------- */
  var coin = $('#coin'), menu = $('#menu');
  function basculer(o) { menu.hidden = !o; coin.setAttribute('aria-expanded', o); $('.coin-t', coin).textContent = o ? 'Fermer' : 'Menu'; }
  coin.addEventListener('click', function () { basculer(menu.hidden); });
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]'); if (!a) return; var c = $(a.getAttribute('href')); if (!c) return;
    e.preventDefault(); basculer(false);
    var y = c.id === 'accueil' ? 0 : c.getBoundingClientRect().top + scrollY - (c.id === 'karaoke' ? 30 : 20);
    scrollTo({ top: Math.max(0, y), behavior: calme ? 'auto' : 'smooth' });
  });
  var liens = $$('#nav a'), cibles = liens.map(function (a) { return $(a.getAttribute('href')); });

  /* ---------- la boucle : défilement, bandeau, karaoké, borne ---------- */
  var images = $$('.pola-i img,.carte-i img'), accG = $('.acc-g'), vit = $('.vitrine');
  var sale = true, dy = scrollY, vel = 0, tp = performance.now(), defile = false, demo = 0, manV = '', iciV = -2, pair = false;
  // Tout ce que la boucle a besoin de savoir de la mise en page est lu ICI, une fois (chargement, redimensionnement, polices,
  // page qui change de hauteur), puis gardé : pendant le défilement, la boucle ne lit plus que scrollY.
  var P = { vh: innerHeight, large: innerWidth >= 1000, max: 1, img: [], cib: [], zt: 0, zh: 0, trop: 0, accX: 0, accY: 0 };
  function reperer() {
    var y = scrollY, x = scrollX, ar = acc.getBoundingClientRect();
    P.vh = innerHeight; P.large = innerWidth >= 1000; P.accX = ar.left + x; P.accY = ar.top + y;
    P.max = Math.max(1, document.scrollingElement.scrollHeight - P.vh);
    P.img = images.map(function (im, i) { var b = im.parentNode.getBoundingClientRect(); return { im: im, t: b.top + y, h: b.height, v: P.img[i] ? P.img[i].v : '' }; });
    P.cib = P.large ? cibles.map(function (c) { return c ? c.getBoundingClientRect().top + y : Infinity; }) : [];
    if (lie) { var zr = zone.getBoundingClientRect(); P.zt = zr.top + y; P.zh = zr.height; P.trop = bande.scrollWidth - zone.clientWidth + 2 * parseFloat(getComputedStyle(zone).paddingLeft); }
    sale = true;
  }
  function mesurer(force) { tailleEgal(); bw = bd.scrollWidth / 2; ajuster(force === true); reperer(); }
  // Ce qui n'est pas à l'écran s'arrête : les animations sans fin de la rubrique (classe « hors »), le bandeau, le grésillement.
  var bandeauVu = true;
  var ioz = new IntersectionObserver(function (l) {
    l.forEach(function (e) { if (e.target === bd.parentNode) bandeauVu = e.isIntersecting; else e.target.classList.toggle('hors', !e.isIntersecting); });
  }, { rootMargin: '60px 0px' });
  [acc, bd.parentNode, $('#soirees'), sc, $('#jeux'), $('.pied')].forEach(function (z) { ioz.observe(z); });
  function tick(t) {
    var dt = Math.min(.05, (t - tp) / 1000); tp = t;
    var y = scrollY, vh = P.vh, v = (y - dy) / Math.max(dt, .001); dy = y; vel += (v - vel) * Math.min(1, dt * 8);
    if (!calme) {
      if (bw && bandeauVu) { bx -= (46 + Math.min(1500, Math.abs(vel)) * .6) * dt; if (bx < -bw) bx += bw; bd.style.transform = 'translate3d(' + bx.toFixed(1) + 'px,0,0)'; }
      if (sale) {
        if (P.large && y < vh * 1.3) { accG.style.transform = 'translate3d(0,' + (y * .2).toFixed(1) + 'px,0)'; vit.style.transform = 'translate3d(0,' + (y * .09).toFixed(1) + 'px,0) rotate(' + (y * .012).toFixed(2) + 'deg)'; }
        for (var i = 0; i < P.img.length; i++) { // les photos glissent dans leur cadre
          var o = P.img[i], top = o.t - y; if (top + o.h < -40 || top > vh + 40) continue;
          var s = 'translate3d(0,' + (-borne((vh - top) / (vh + o.h), 0, 1) * 12).toFixed(2) + '%,0)'; if (s !== o.v) { o.v = s; o.im.style.transform = s; }
        }
        if (lie) { // la bande d'affiches glisse pendant qu'on traverse la rubrique
          var zt = P.zt - y;
          if (P.trop > 0 && zt + P.zh > -100 && zt < vh + 100) { var q2 = borne((vh * .8 - zt) / (vh * .8 - Math.max(64, vh * .5 - P.zh / 2)), 0, 1); bande.style.transform = 'translate3d(' + (-P.trop * q2).toFixed(1) + 'px,0,0)'; }
          else if (P.trop <= 0) bande.style.transform = '';
        }
      }
      // karaoké : démonstration tant que personne n'a touché le micro
      if (K.vu && !K.joueur && !K.fini) { demo += dt; if (demo > .52) { demo = 0; chanter(false); } }
      if (K.energie > 0) { K.energie = Math.max(0, K.energie - dt * (K.fini ? .04 : .1)); }
      applaudir();
      if (G.vu) { pasJeu(Math.min(dt, .033)); dessiner(); var mv = 'translateX(' + borne((G.cible - G.px) * .6, -9, 9).toFixed(1) + 'px)'; if (mv !== manV) { manV = mv; manette.style.transform = mv; } }
    }
    if (sale) {
      if (P.large) { var ici = -1; for (var k = 0; k < P.cib.length; k++) if (P.cib[k] - y < vh * .45) ici = k; if (ici !== iciV) { iciV = ici; liens.forEach(function (a, j) { a.classList.toggle('actif', j === ici); }); } }
      EG.lu = borne(y / P.max, .02, 1); // l'égaliseur s'allume au fil de la lecture
      if (calme) dessinerEgal(t, 1);
      sale = false;
    }
    if (!calme) { var et = 1 + Math.min(3.4, Math.abs(vel) / 420); if (et > 1.02 || (pair = !pair)) dessinerEgal(t, et); } // page immobile : la danse lente se redessine une image sur deux
    requestAnimationFrame(tick);
  }
  addEventListener('scroll', function () { sale = true; if (!defile) { defile = true; try { parent.postMessage({ type: 'kazura-defile' }, '*'); } catch (e) { } } }, { passive: true });
  addEventListener('resize', mesurer);
  addEventListener('load', function () { mesurer(true); try { parent.postMessage({ type: 'kazura-pret' }, '*'); } catch (e) { } });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { mesurer(true); });
  if (window.ResizeObserver) new ResizeObserver(reperer).observe($('#page')); // la page change de hauteur (ticket imprimé, par exemple) : on relit les positions
  mesurer(true); if (calme) { dessiner(); applaudir(); }
  requestAnimationFrame(tick);
})();
