/* Porte Lune : « Frappez trois coups ». Aucune dépendance.
   Le mouvement joue toujours en entier ; mode calme seulement avec ?calme=1 (jamais d'après le réglage du système). */
(function () {
  'use strict';
  var H = document.documentElement, C = window.CONTENU || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var calme = H.classList.contains('calme');
  var Q = new URLSearchParams(location.search);
  var borne = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var annoncer = function (type) { try { if (parent !== window) parent.postMessage({ type: type }, '*'); } catch (e) {} };
  var rejoue = function (el, cl) { el.classList.remove(cl); void el.offsetWidth; el.classList.add(cl); };
  var etat = { cle: false, coffre: false, jets: null, ecu: null };

  /* ---------- couleurs (bouton Couleur de la page Bonjour) ---------- */
  function palette(n) {
    if (!C.palettes || !C.palettes[n]) return;
    H.dataset.palette = n; var m = $('meta[name=theme-color]'); if (m) m.content = C.palettes[n].theme;
  }
  palette(Q.get('palette') || 'gueules');
  addEventListener('message', function (e) { if (e.data && e.data.type === 'kazura-couleur') palette(e.data.palette); });

  /* ---------- un seul moteur, qui s'arrête dès que rien ne bouge ---------- */
  var systemes = [], enMarche = false, dernier = 0;
  function image(t) {
    var dt = Math.min(.05, (t - dernier) / 1000 || .016); dernier = t;
    var vivant = false; for (var i = 0; i < systemes.length; i++) if (systemes[i](dt)) vivant = true;
    if (vivant) requestAnimationFrame(image); else enMarche = false;
  }
  function reveille() { if (enMarche) return; enMarche = true; dernier = performance.now(); requestAnimationFrame(image); }

  /* ---------- la lune : phases dessinées en aplats ---------- */
  function cheminPhase(R, f) { // f : 0 nouvelle lune, .5 pleine lune, 1 nouvelle lune
    f = ((f % 1) + 1) % 1;
    var c = Math.cos(f * 2 * Math.PI), rx = Math.abs(c) * R;
    return { d: 'M0,' + (-R) + 'A' + R + ',' + R + ' 0 0 1 0,' + R + 'A' + rx.toFixed(2) + ',' + R + ' 0 0 ' + (c < 0 ? 1 : 0) + ' 0,' + (-R) + 'Z', miroir: f > .5 };
  }
  function dessinePhase(path, R, f) { var p = cheminPhase(R, f); path.setAttribute('d', p.d); if (p.miroir) path.setAttribute('transform', 'scale(-1,1)'); else path.removeAttribute('transform'); }
  function svgPhase(f, cl) { var p = cheminPhase(12, f); return '<svg class="' + cl + '" viewBox="-13 -13 26 26" aria-hidden="true"><circle r="12" class="lf-ombre"/><path class="lf-clair" d="' + p.d + '"' + (p.miroir ? ' transform="scale(-1,1)"' : '') + '/></svg>'; }
  // Position réelle de la lune (séries courtes, précises à moins d'une heure sur l'instant des phases).
  function elong(date) {
    var d = date.getTime() / 86400000 - 10957.5, r = Math.PI / 180;
    var L = 218.316 + 13.176396 * d, M = (134.963 + 13.064993 * d) * r, F = (93.272 + 13.229350 * d) * r, D = (297.850 + 12.190749 * d) * r, Ms = (357.529 + 0.98560028 * d) * r;
    var lm = L + 6.289 * Math.sin(M) - 1.274 * Math.sin(M - 2 * D) + .658 * Math.sin(2 * D) + .214 * Math.sin(2 * M) - .186 * Math.sin(Ms) - .114 * Math.sin(2 * F)
      - .059 * Math.sin(2 * M - 2 * D) - .057 * Math.sin(M - 2 * D + Ms) + .053 * Math.sin(M + 2 * D) + .046 * Math.sin(2 * D - Ms) + .041 * Math.sin(M - Ms) - .035 * Math.sin(D) - .031 * Math.sin(M + Ms);
    var ls = 280.460 + .9856474 * d + 1.915 * Math.sin(Ms) + .020 * Math.sin(2 * Ms);
    return (((lm - ls) % 360) + 360) % 360;
  }
  var NOMS = ['Nouvelle lune', 'Premier croissant', 'Premier quartier', 'Lune gibbeuse croissante', 'Pleine lune', 'Lune gibbeuse décroissante', 'Dernier quartier', 'Dernier croissant'];
  function nomPhase(e) { return NOMS[Math.floor(((e + 22.5) % 360) / 45)]; }
  function dateFr(d, o) { try { return d.toLocaleDateString('fr-FR', o || { weekday: 'long', day: 'numeric', month: 'long' }).replace(/(^|\s)1 (?=\D)/, '$11er '); } catch (e) { return d.toDateString(); } }
  var ceSoir = new Date(); ceSoir.setHours(21, 0, 0, 0);

  /* ---------- barre : menu, phases du menu, section courante ---------- */
  var barre = $('#barre'), menuB = $('#menu-b'), liens = $$('#nav a'), lfClair = $('#lf-clair');
  liens.forEach(function (a) { a.insertAdjacentHTML('afterbegin', svgPhase(+a.dataset.f, 'ph')); });
  function menu(ouvert) { barre.classList.toggle('ouvert', ouvert); menuB.setAttribute('aria-expanded', String(ouvert)); menuB.textContent = ouvert ? 'Fermer' : 'Menu'; }
  menuB.addEventListener('click', function () { menu(!barre.classList.contains('ouvert')); });
  liens.forEach(function (a) { a.addEventListener('click', function () { menu(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') menu(false); });
  document.addEventListener('click', function (e) { if (barre.classList.contains('ouvert') && !e.target.closest('#barre')) menu(false); });

  /* ---------- pendules : tout ce qui pend se balance ---------- */
  var pendules = $$('.pend').map(function (el, i) {
    return { el: el, a: 0, w: 0, k: +el.dataset.k || 30, c: +el.dataset.c || 1.5, max: (+el.dataset.max || 26) * (innerWidth < 700 ? .5 : 1), n: i, zone: el.closest('section') };
  });
  systemes.push(function (dt) {
    var bouge = false;
    for (var i = 0; i < pendules.length; i++) {
      var p = pendules[i];
      if (Math.abs(p.a) < .03 && Math.abs(p.w) < .08) { if (p.a !== 0) { p.a = 0; p.w = 0; p.el.style.transform = ''; } continue; }
      p.w += (-p.k * p.a - p.c * p.w) * dt; p.a = borne(p.a + p.w * dt, -p.max, p.max);
      p.el.style.transform = 'rotate(' + p.a.toFixed(2) + 'deg)'; bouge = true;
    }
    return bouge;
  });
  function pousse(p, f) { if (calme || !p) return; p.w += f; reveille(); }
  function penduleDe(el) { for (var i = 0; i < pendules.length; i++) if (pendules[i].el === el) return pendules[i]; return null; }

  /* ---------- 1. la porte ---------- */
  var baie = $('#baie'), porche = $('#porche'), heurtoir = $('#heurtoir'), consigne = $('#consigne'), bFrapper = $('#frapper'), dedans = $('#dedans'), tocs = $('#tocs');
  var coups = 0, ouverte = false, sequence = false, refermee = false, audio = null;
  dedans.inert = true;
  function son() {
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)(); if (audio.state === 'suspended') audio.resume();
      var t = audio.currentTime, o = audio.createOscillator(), g = audio.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(155, t); o.frequency.exponentialRampToValueAtTime(50, t + .14);
      g.gain.setValueAtTime(.5, t); g.gain.exponentialRampToValueAtTime(.001, t + .22);
      o.connect(g); g.connect(audio.destination); o.start(t); o.stop(t + .24);
    } catch (e) {}
  }
  function coup(muet) {
    if (ouverte) return;
    rejoue(heurtoir, 'toc');
    setTimeout(function () {
      if (ouverte) return;
      coups++; if (!muet) son();
      rejoue(porche, 'secoue');
      var m = document.createElement('b'); m.className = 'toc-mot'; m.textContent = 'Toc';
      m.style.left = (50 + coups * 11) + '%'; m.style.top = (66 - coups * 9) + '%'; m.style.setProperty('--r', (coups * 10 - 22) + 'deg');
      tocs.appendChild(m); setTimeout(function () { m.remove(); }, 1100);
      pousse(penduleDe($('.enseigne')), 70);
      consigne.textContent = coups >= 3 ? 'Toc, toc, toc ! La porte s’ouvre.' : (coups === 1 ? 'Toc… encore deux coups.' : 'Toc, toc… encore un coup.');
      if (coups >= 3) setTimeout(ouvrir, calme ? 0 : 420);
    }, calme ? 0 : 150);
  }
  function ouvrir() {
    ouverte = true; baie.classList.add('ouverte'); dedans.inert = false; bFrapper.textContent = 'Refermer la porte';
    setTimeout(function () { if (ouverte) consigne.textContent = 'Entrez : trois lieux vous attendent derrière.'; }, 1500);
  }
  function fermer() {
    ouverte = false; refermee = true; coups = 0; baie.classList.remove('ouverte'); dedans.inert = true;
    bFrapper.textContent = 'Frapper à la porte'; consigne.textContent = 'Trois coups au heurtoir, et la porte s’ouvre.';
  }
  function troisCoups(muet) {
    if (ouverte || sequence) return; sequence = true;
    var reste = 3 - coups, i = 0;
    (function suite() {
      if (ouverte) { sequence = false; return; }
      coup(muet); i++;
      if (i < reste) setTimeout(suite, calme ? 0 : 440); else setTimeout(function () { sequence = false; }, 700);
    })();
  }
  heurtoir.addEventListener('click', function () { if (!sequence) coup(false); });
  bFrapper.addEventListener('click', function () {
    if (ouverte) { fermer(); return; }
    troisCoups(false);
    if (innerWidth < 861) porche.scrollIntoView({ behavior: calme ? 'auto' : 'smooth', block: 'center' });
  });
  var chat = $('#chat'); if (chat) chat.addEventListener('click', function () { rejoue(chat, 'saute'); });
  var luneSvg = $('#lune svg'), toitsHeros = $('.porte .toits');
  $('#porte').addEventListener('pointermove', function (e) {
    if (calme || e.pointerType !== 'mouse') return;
    var x = e.clientX / innerWidth - .5, y = e.clientY / innerHeight - .5;
    luneSvg.style.translate = (x * -26).toFixed(1) + 'px ' + (y * -18).toFixed(1) + 'px';
  });

  /* ---------- 3. l'échoppe : la tringle, la clé, l'écu d'écailles ---------- */
  (function () { // les écailles de la pièce « mailles et écailles »
    var g = $('#ecailles-g'); if (!g) return; var s = '';
    for (var r = 6; r >= 0; r--) for (var c = 0; c < 5; c++) {
      var x = 12 + c * 24 + (r % 2 ? 12 : 0), y = 36 + r * 19;
      s += '<circle cx="' + x + '" cy="' + (y + 3.5) + '" r="13.5" fill="#8d8774"/><circle cx="' + x + '" cy="' + y + '" r="13.5" fill="' + (r % 2 ? '#f1ead7' : '#dcd5c0') + '"/>';
    }
    g.innerHTML = s;
  })();
  var tringleDit = $('#tringle-dit'), cleBarre = $('#cle-barre');
  $$('.pendu').forEach(function (b) {
    var p = penduleDe($('.pend', b)); if (!p) return;
    b.addEventListener('pointermove', function (e) { if (e.pointerType === 'mouse') pousse(p, borne(e.movementX || 0, -30, 30) * 2.4); });
    b.addEventListener('click', function () {
      pousse(p, (p.n % 2 ? -1 : 1) * 200);
      if (b.dataset.p === 'cle') prendreCle(b); else if (b.dataset.p && C.pieces && C.pieces[b.dataset.p]) tringleDit.textContent = C.pieces[b.dataset.p];
    });
  });
  function prendreCle(b) {
    if (etat.cle) return; etat.cle = true;
    var svg = $('svg', b), r = svg.getBoundingClientRect();
    cleBarre.hidden = false; var c = cleBarre.getBoundingClientRect();
    b.classList.add('prise'); $('.etiq', b).textContent = 'Clé prise'; b.setAttribute('aria-label', 'La clé est prise');
    tringleDit.textContent = 'Vous avez la clé. Elle ouvre le coffre de la Guilde, plus bas.';
    if (!calme && svg.animate) {
      var v = svg.cloneNode(true), dx = (c.left + c.width / 2) - (r.left + r.width / 2), dy = (c.top + c.height / 2) - (r.top + r.height / 2);
      v.style.cssText = 'position:fixed;left:' + r.left + 'px;top:' + r.top + 'px;width:' + r.width + 'px;height:' + r.height + 'px;margin:0;z-index:60;pointer-events:none;filter:none';
      document.body.appendChild(v); cleBarre.style.opacity = 0;
      v.animate([{ transform: 'none' }, { transform: 'translate(' + (dx * .45) + 'px,' + (dy * .5 - 90) + 'px) rotate(190deg) scale(.8)', offset: .5 }, { transform: 'translate(' + dx + 'px,' + dy + 'px) rotate(388deg) scale(' + (c.height / r.height).toFixed(3) + ')' }], { duration: 950, easing: 'cubic-bezier(.4,0,.2,1)' })
        .onfinish = function () { v.remove(); cleBarre.style.opacity = ''; rejoue(cleBarre, 'pop'); };
    }
    majCoffre();
  }

  var ecu = $('#ecu'), ecailles = [], email = 'or', ecuCompte = $('#ecu-compte');
  var COUL = { or: '#eaa821', argent: '#f1ead7', sinople: '#1d6a4d', sable: '#241c17' };
  (function () {
    var cols = 9, rangs = 10, pas = .76, html = '';
    for (var r = 0; r < rangs; r++) {
      var dec = r % 2 ? .5 : 0, n = r % 2 ? cols - 1 : cols;
      for (var c = 0; c < n; c++) {
        var x = c + dec, cx = (x + .52) / cols, cy = (r * pas + .6) / (rangs * pas + .45);
        var demi = cy < .4 ? .5 : .5 * Math.sqrt(Math.max(0, 1 - Math.pow((cy - .4) / .62, 2)));
        if (Math.abs(cx - .5) > demi - .03) continue;
        html += '<i class="ecaille" style="left:' + x.toFixed(2) + 'em;top:' + (r * pas).toFixed(2) + 'em;z-index:' + (30 - r) + '"></i>';
      }
    }
    ecu.innerHTML = html; ecailles = $$('.ecaille', ecu);
  })();
  function compteEcu() {
    var n = 0, par = {};
    ecailles.forEach(function (e) { if (e.dataset.email) { n++; par[e.dataset.email] = (par[e.dataset.email] || 0) + 1; } });
    etat.ecu = n ? par : null;
    ecuCompte.textContent = !n ? 'Aucune écaille posée' : n < ecailles.length ? n + (n > 1 ? ' écailles posées sur ' : ' écaille posée sur ') + ecailles.length : 'Écu complet : ' + n + ' écailles. Il vous attend sur votre carte de la Guilde, plus bas.';
    if (n === ecailles.length && !calme) rejoue(ecu, 'complet');
    dessineBlason();
  }
  function pose(el, sansCompte) {
    if (el.dataset.email === email) return;
    el.dataset.email = email; el.style.setProperty('--e', COUL[email]); el.classList.add('posee'); rejoue(el, 'pop');
    if (!sansCompte) compteEcu();
  }
  function sousLeDoigt(e) { var el = document.elementFromPoint(e.clientX, e.clientY); if (el && el.classList.contains('ecaille')) pose(el); }
  ecu.addEventListener('pointermove', sousLeDoigt); ecu.addEventListener('pointerdown', sousLeDoigt);
  $$('#emaux button').forEach(function (b) {
    b.addEventListener('click', function () { email = b.dataset.email; $$('#emaux button').forEach(function (o) { o.setAttribute('aria-pressed', String(o === b)); }); });
  });
  $('#ecu-tout').addEventListener('click', function () {
    var reste = ecailles.filter(function (e) { return e.dataset.email !== email; });
    reste.forEach(function (e, i) { setTimeout(function () { pose(e, i < reste.length - 1); }, calme ? 0 : i * 14); });
  });
  $('#ecu-vide').addEventListener('click', function () {
    ecailles.forEach(function (e) { delete e.dataset.email; e.classList.remove('posee', 'pop'); }); ecu.classList.remove('complet'); compteEcu();
  });

  /* ---------- 4. le comptoir : on trinque ---------- */
  var zinc = $('#zinc'), godets = $$('.godet'), ardoise = $('#ardoise'), zincDit = $('#zinc-dit'), nSante = 0, tArdoise = 0;
  function eclabousse(g) {
    if (calme || !g.animate) return;
    var r = g.getBoundingClientRect(), z = zinc.getBoundingClientRect();
    for (var k = 0; k < 3; k++) (function (k) {
      var d = document.createElement('i'); d.className = 'goutte';
      d.style.left = (r.left - z.left + r.width * (.3 + k * .2)) + 'px'; d.style.top = (r.top - z.top + r.height * .1) + 'px';
      zinc.appendChild(d);
      var dx = (k - 1) * (26 + Math.random() * 22), h = 50 + Math.random() * 50;
      d.animate([{ transform: 'translate(0,0) scale(1)' }, { transform: 'translate(' + dx * .6 + 'px,' + (-h) + 'px) scale(1.1)', offset: .45 }, { transform: 'translate(' + dx + 'px,' + (h * .5) + 'px) scale(.4)', opacity: 0 }], { duration: 620 + k * 60, easing: 'cubic-bezier(.3,.6,.6,1)' }).onfinish = function () { d.remove(); };
    })(k);
  }
  function trinquer(i) {
    nSante++;
    godets.forEach(function (g, j) {
      setTimeout(function () {
        g.style.setProperty('--r', (j < i ? 15 : j > i ? -15 : (i % 2 ? 9 : -9)) + 'deg'); g.classList.add('leve'); eclabousse(g);
        setTimeout(function () { g.classList.remove('leve'); }, calme ? 300 : 440);
      }, calme ? 0 : Math.abs(j - i) * 110);
    });
    clearTimeout(tArdoise); ardoise.innerHTML = '<b>Santé\u00a0!</b>'; ardoise.classList.add('dit'); rejoue(ardoise, 'flip');
    tArdoise = setTimeout(function () { ardoise.innerHTML = '<b>Bar</b><b>associatif</b>'; ardoise.classList.remove('dit', 'flip'); }, 1500);
    zincDit.textContent = nSante === 1 ? 'Santé ! Tous les godets se sont levés.' : 'Santé ! Déjà ' + nSante + ' fois.';
  }
  godets.forEach(function (g, i) { g.addEventListener('click', function () { trinquer(i); }); });
  var rouleau = $('#rouleau'), papier = $('#rouleau-papier');

  /* ---------- 5. la table : les dés ---------- */
  function tirer(n) { return 1 + Math.floor(Math.random() * n); }
  function formeDe(n) {
    var pts = function (a) { return a.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' '); };
    var f = function (a, c) { return '<polygon points="' + pts(a) + '" class="' + c + '"/>'; };
    var s = '', k, a;
    if (n === 4) { s = f([[60, 8], [112, 102], [60, 68]], 'f2') + f([[60, 8], [60, 68], [8, 102]], 'f1') + f([[8, 102], [60, 68], [112, 102]], 'f3'); }
    else if (n === 8) { s = f([[60, 4], [110, 60], [60, 76]], 'f2') + f([[60, 4], [60, 76], [10, 60]], 'f1') + f([[10, 60], [60, 76], [60, 116]], 'f3') + f([[110, 60], [60, 116], [60, 76]], 'f4'); }
    else if (n === 10) { s = f([[60, 4], [32, 58], [10, 50]], 'f2') + f([[60, 4], [110, 50], [88, 58]], 'f3') + f([[10, 50], [32, 58], [60, 84], [60, 116]], 'f3') + f([[110, 50], [60, 116], [60, 84], [88, 58]], 'f4') + f([[60, 4], [88, 58], [60, 84], [32, 58]], 'f1'); }
    else if (n === 12) {
      var ext = [], inte = [];
      for (k = 0; k < 10; k++) { a = (-90 + 36 * k) * Math.PI / 180; ext.push([60 + 56 * Math.cos(a), 60 + 56 * Math.sin(a)]); }
      for (k = 0; k < 5; k++) { a = (-90 + 72 * k) * Math.PI / 180; inte.push([60 + 31 * Math.cos(a), 60 + 31 * Math.sin(a)]); }
      for (k = 0; k < 5; k++) s += f([inte[k], ext[2 * k], ext[2 * k + 1], ext[(2 * k + 2) % 10], inte[(k + 1) % 5]], ['f2', 'f3', 'f4', 'f4', 'f3'][k]);
      s += f(inte, 'f1');
    }
    return '<svg viewBox="0 0 120 120" aria-hidden="true">' + s + '</svg>';
  }
  function rouler(btn, n, fin) {
    if (btn.dataset.roule) return; btn.dataset.roule = '1';
    var b = $('b', btn), forme = $('svg', btn), res = tirer(n);
    var fini = function () { b.textContent = res; delete btn.dataset.roule; if (fin) fin(res); };
    if (calme || !btn.animate) { fini(); return; }
    var t = setInterval(function () { b.textContent = tirer(n); }, 70);
    btn.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-48%)', offset: .3 }, { transform: 'translateY(0)', offset: .62 }, { transform: 'translateY(-13%)', offset: .8 }, { transform: 'translateY(0)' }], { duration: 950, easing: 'ease-out' });
    forme.animate([{ transform: 'rotate(0deg)' }, { transform: 'rotate(' + (Math.random() < .5 ? -1 : 1) * 540 + 'deg)' }], { duration: 950, easing: 'cubic-bezier(.2,.6,.3,1)' }).onfinish = function () {
      clearInterval(t); fini();
      b.animate([{ transform: 'scale(1.7)' }, { transform: 'scale(1)' }], { duration: 280, easing: 'cubic-bezier(.2,1.6,.4,1)' });
    };
  }
  var TONS = { 4: ['#f4c44e', '#eaa821', '#c4841a', '#9a6410', '#1e1611'], 8: ['#e4482e', '#cf3a22', '#a52a17', '#7f1e0f', '#fff3da'], 10: ['#fbf1d3', '#ecdcb0', '#cdb88d', '#a8915f', '#1e1611'], 12: ['#4d3c2f', '#33271e', '#241c17', '#140f0b', '#fbf1d3'] };
  var des = $('#des');
  [4, 8, 10, 12].forEach(function (n) {
    var b = document.createElement('button'), t = TONS[n];
    b.type = 'button'; b.className = 'de'; b.setAttribute('aria-label', 'Lancer le dé à ' + n + ' faces');
    b.style.cssText = '--d1:' + t[0] + ';--d2:' + t[1] + ';--d3:' + t[2] + ';--d4:' + t[3] + ';--dt:' + t[4];
    b.innerHTML = formeDe(n) + '<b>' + n + '</b>';
    b.addEventListener('click', function () { rouler(b, n); });
    des.appendChild(b);
  });

  var EP = C.epreuves || [], etape = 0, reussites = 0, enJeu = false;
  var chemin = $('#chemin'), eps = $$('.ep'), pion = $('#pion'), recitE = $('#recit-e'), recitT = $('#recit-t'), bLancer = $('#lancer'), bRejouer = $('#rejouer'), de20 = $('#de20'), carteJets = $('#carte-jets');
  function placerPion() {
    var i = Math.min(etape, 3), a = $('.ep-arche', eps[i]), ra = a.getBoundingClientRect(), rc = chemin.getBoundingClientRect();
    var w = pion.getBoundingClientRect().width || 44, h = w * 1.6;
    pion.style.transform = 'translate(' + (ra.left - rc.left + ra.width / 2 - w / 2).toFixed(1) + 'px,' + (ra.bottom - rc.top - h + 3).toFixed(1) + 'px)';
    eps.forEach(function (e, j) { e.classList.toggle('ici', j === etape); });
  }
  function annonce() { var e = EP[etape]; if (e) recitE.textContent = e.nom + ' : il faut ' + e.seuil + ' ou plus'; }
  function lancer() {
    if (enJeu || etape > 3 || !EP.length) return; enJeu = true; bLancer.disabled = true;
    rouler(de20, 20, function (n) {
      var e = EP[etape], ok = n >= e.seuil, el = eps[etape];
      el.classList.add(ok ? 'ok' : 'ko');
      var b = document.createElement('b'); b.className = 'ep-n'; b.textContent = n; $('.ep-arche', el).appendChild(b);
      if (ok) reussites++;
      recitT.textContent = (n === 20 ? 'Vingt, réussite critique ! ' : n === 1 ? 'Un, échec critique… ' : n + '. ') + (ok ? e.ok : e.ko);
      etape++; enJeu = false;
      if (etape > 3) {
        etat.jets = reussites; eps.forEach(function (x) { x.classList.remove('ici'); });
        carteJets.textContent = 'Soirée : ' + reussites + (reussites > 1 ? ' réussites' : ' réussite') + ' sur 4 aux dés';
        setTimeout(function () {
          recitE.textContent = 'Fin de soirée : ' + reussites + (reussites > 1 ? ' réussites' : ' réussite') + ' sur 4';
          recitT.textContent = (C.verdicts || [])[reussites] || ''; bLancer.hidden = true; bRejouer.hidden = false;
        }, calme ? 0 : 2300);
      } else setTimeout(function () { placerPion(); annonce(); bLancer.disabled = false; bLancer.textContent = 'Lancer encore'; }, calme ? 0 : 650);
    });
  }
  bLancer.addEventListener('click', lancer); de20.addEventListener('click', lancer);
  bRejouer.addEventListener('click', function () {
    etape = 0; reussites = 0; eps.forEach(function (e) { e.classList.remove('ok', 'ko'); var b = $('.ep-n', e); if (b) b.remove(); });
    bLancer.hidden = false; bLancer.disabled = false; bLancer.textContent = 'Lancer le dé'; bRejouer.hidden = true;
    recitT.textContent = 'Vous revoilà devant la porte. Les dés sont à vous.'; placerPion(); annonce();
  });

  /* ---------- 6. la Guilde : le coffre, la carte, le sceau ---------- */
  var coffre = $('#coffre'), coffreDit = $('#coffre-dit'), bForcer = $('#forcer'), versCle = $('#vers-cle'), bSceller = $('#sceller');
  function majCoffre() {
    if (etat.coffre || !etat.cle) return;
    coffreDit.textContent = 'Vous avez la clé : touchez le coffre.'; versCle.hidden = true; bForcer.hidden = true; coffre.classList.add('pret');
  }
  function ouvrirCoffre(comment) {
    etat.coffre = true; coffre.classList.remove('pret', 'secoue'); coffre.classList.add('ouvert'); versCle.hidden = true; bForcer.hidden = true;
    coffreDit.textContent = comment + ' Le sceau de la Guilde est à vous : scellez votre carte.'; bSceller.classList.add('pret');
    coffre.setAttribute('aria-label', 'Le coffre de la Guilde est ouvert');
  }
  coffre.addEventListener('click', function () {
    if (etat.coffre) return;
    if (etat.cle) { ouvrirCoffre('La clé tourne, le couvercle se lève.'); return; }
    rejoue(coffre, 'secoue'); bForcer.hidden = false;
    coffreDit.textContent = 'Fermé à clé. La clé pend à la tringle de l’échoppe, entre la bijouterie et les écailles.';
  });
  bForcer.addEventListener('click', function () {
    if (etat.coffre) return; var n = tirer(20);
    if (n >= 12) ouvrirCoffre('Jet de crochetage : ' + n + '. La serrure cède.');
    else { rejoue(coffre, 'secoue'); coffreDit.textContent = 'Jet de crochetage : ' + n + '. Raté, il fallait 12. Réessayez, ou allez chercher la clé.'; }
  });
  var nomC = $('#adh-nom'), carteNom = $('#carte-nom'), cire = $('#cire'), adhDit = $('#adh-dit'), carte = $('#carte'), blason = $('#carte-ecu');
  function dessineBlason() {
    var champ = '#cf3a22', second = '#eaa821', k, m1 = 0, m2 = 0;
    if (etat.ecu) {
      for (k in etat.ecu) if (etat.ecu[k] > m1) { m1 = etat.ecu[k]; champ = COUL[k]; }
      second = champ === '#eaa821' ? '#cf3a22' : '#eaa821';
      for (k in etat.ecu) if (COUL[k] !== champ && etat.ecu[k] > m2) { m2 = etat.ecu[k]; second = COUL[k]; }
    }
    var clair = function (c) { return c === '#f1ead7' || c === '#eaa821'; };
    blason.innerHTML = '<path d="M11 11h88v52c0 30-22 46-44 54C33 109 11 93 11 63z" fill="#cdb88d"/><path d="M6 6h88v52c0 30-22 46-44 54C28 104 6 88 6 58z" fill="' + champ + '"/><path d="M50 6h44v52c0 30-22 46-44 54z" fill="' + second + '"/><path d="M50 28a24 24 0 1 0 24 24a19 19 0 0 1-24-24z" fill="' + (clair(champ) && clair(second) ? '#241c17' : '#fbf1d3') + '"/>';
  }
  dessineBlason();
  $('#carte-date').textContent = 'Entré par la porte le ' + dateFr(new Date(), { day: 'numeric', month: 'long', year: 'numeric' });
  $('#carte-lune').textContent = 'Lune du jour : ' + nomPhase(elong(ceSoir)).toLowerCase();
  nomC.addEventListener('input', function () { carteNom.textContent = nomC.value.trim() || 'Votre prénom'; });
  bSceller.addEventListener('click', function () {
    var nom = nomC.value.trim();
    if (!etat.coffre) { adhDit.textContent = 'Il vous faut le sceau : il est dans le coffre de la Guilde, juste à côté.'; rejoue(coffre, 'secoue'); return; }
    if (!nom) { adhDit.textContent = 'Écrivez d’abord votre prénom sur la carte.'; nomC.focus(); return; }
    bSceller.classList.remove('pret'); rejoue(cire, 'pose'); rejoue(carte, 'tape');
    adhDit.textContent = 'Carte scellée, ' + nom + '. Sur votre vrai site, l’adhésion peut se faire en ligne. Ici, rien n’est envoyé.';
  });

  /* ---------- 7. venir : la vraie lune, qu'on fait tourner ---------- */
  var lClair = $('#l-clair'), lClip = $('#l-clip-p'), lNom = $('#l-nom'), lDate = $('#l-date'), lJour = $('#l-jour'), lDisque = $('#l-disque'), lPhases = $('#l-phases'), lSur = $('.l-txt .surtitre');
  function montreLune(j) {
    var d = new Date(ceSoir.getTime() + j * 86400000), e = elong(d);
    dessinePhase(lClair, 100, e / 360); dessinePhase(lClip, 100, e / 360);
    lNom.textContent = nomPhase(e);
    lSur.textContent = j === 0 ? 'La lune, ce soir' : j === 1 ? 'La lune, demain soir' : 'La lune, dans ' + j + ' jours';
    lDate.textContent = dateFr(d).replace(/^./, function (c) { return c.toUpperCase(); }) + ' : éclairée à ' + Math.round((1 - Math.cos(e * Math.PI / 180)) / 2 * 100) + ' %.';
  }
  montreLune(0);
  lJour.addEventListener('input', function () { montreLune(+lJour.value); });
  (function () {
    var x0 = 0, j0 = 0, tenu = false;
    lDisque.addEventListener('pointerdown', function (e) { tenu = true; x0 = e.clientX; j0 = +lJour.value; try { lDisque.setPointerCapture(e.pointerId); } catch (er) {} });
    lDisque.addEventListener('pointermove', function (e) { if (!tenu) return; var j = borne(Math.round(j0 + (e.clientX - x0) / (lDisque.clientWidth / 16)), 0, 29); if (j !== +lJour.value) { lJour.value = j; montreLune(j); } });
    ['pointerup', 'pointercancel'].forEach(function (n) { lDisque.addEventListener(n, function () { tenu = false; }); });
  })();
  (function () { // les quatre prochaines grandes phases, calculées heure par heure
    var res = [], t0 = ceSoir.getTime(), avant = elong(new Date(t0)), CIBLES = [[0, 'Nouvelle lune', 0], [90, 'Premier quartier', .25], [180, 'Pleine lune', .5], [270, 'Dernier quartier', .75]];
    for (var h = 1; h <= 31 * 24 && res.length < 4; h++) {
      var d = new Date(t0 + h * 3600000), e = elong(d);
      for (var k = 0; k < 4; k++) { var a = (avant - CIBLES[k][0] + 540) % 360 - 180, b = (e - CIBLES[k][0] + 540) % 360 - 180; if (a < 0 && b >= 0 && b - a < 5) res.push([d, CIBLES[k][1], CIBLES[k][2]]); }
      avant = e;
    }
    lPhases.innerHTML = res.map(function (r) { return '<p class="l-phase">' + svgPhase(r[2], 'l-icone').replace(/lf-ombre/, 'l-ombre').replace(/lf-clair/, 'l-clair') + '<span><b>' + r[1] + '</b><br>' + dateFr(r[0]) + '</span></p>'; }).join('');
  })();

  /* ---------- défilement : la lune de la barre se remplit, le rouleau se déroule, tout ce qui pend bouge ---------- */
  var cadres = $$('.cadre'), sy = scrollY, premier = true, attente = false;
  function surDefilement() {
    attente = false;
    var y = scrollY, dy = y - sy, vh = innerHeight, max = Math.max(1, H.scrollHeight - vh); sy = y;
    dessinePhase(lfClair, 12, .03 + borne(y / max, 0, 1) * .47);
    if (!calme && y < vh * 1.4) { luneSvg.style.transform = 'translateY(' + (y * .2).toFixed(1) + 'px)'; toitsHeros.style.transform = 'translateY(' + (y * .07).toFixed(1) + 'px)'; }
    if (!ouverte && !sequence && !refermee && y > 90 && y < vh) troisCoups(true);
    var r = rouleau.getBoundingClientRect();
    if (r.top < vh + 200 && r.bottom > -400) papier.style.setProperty('--d', calme ? 1 : borne((vh * .9 - r.top) / (vh * .45), 0, 1).toFixed(3));
    if (!calme) cadres.forEach(function (c) { var q = c.getBoundingClientRect(); if (q.bottom < -60 || q.top > vh + 60) return; c.style.setProperty('--py', (((q.top + q.height / 2) - vh / 2) / vh * +c.dataset.para).toFixed(1)); });
    if (dy && !calme) { var f = borne(dy, -70, 70) * 1.5; pendules.forEach(function (p) { if (p.zone && p.zone._vu === false) return; p.w += f * (.55 + (p.n * 37 % 10) / 14); }); reveille(); }
    if (dy && premier) { premier = false; annoncer('kazura-defile'); }
  }
  addEventListener('scroll', function () { if (!attente) { attente = true; requestAnimationFrame(surDefilement); } }, { passive: true });
  addEventListener('resize', function () { placerPion(); surDefilement(); });

  /* ---------- entrées, section courante ---------- */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('vu'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -7% 0px', threshold: .1 });
    $$('[data-e]').forEach(function (el) { io.observe(el); });
    var sections = $$('main > section[id]');
    var ioZ = new IntersectionObserver(function (es) { es.forEach(function (e) { e.target._vu = e.isIntersecting; }); }, { rootMargin: '10% 0px' });
    sections.forEach(function (s) { ioZ.observe(s); });
    var ioN = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return; var id = e.target.id === 'lieux' ? 'porte' : e.target.id === 'pages' ? 'venir' : e.target.id;
        liens.forEach(function (a) { if (a.getAttribute('href') === '#' + id) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { ioN.observe(s); });
  } else $$('[data-e]').forEach(function (el) { el.classList.add('vu'); });

  /* ---------- départ ---------- */
  function depart() { placerPion(); annonce(); surDefilement(); annoncer('kazura-pret'); }
  if (document.readyState === 'complete') depart(); else addEventListener('load', depart);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(placerPion);
  setTimeout(placerPion, 60);
})();
