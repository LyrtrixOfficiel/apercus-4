// Eden Fleurs : les scènes de la page. Les faits sont dans contenu.js, le dessin des fleurs dans fleurs.js.
(function () {
  'use strict';
  var E = window.EDEN, C = window.CONTENU, d = document, racine = d.documentElement;
  function $(s, p) { return (p || d).querySelector(s); }
  function $$(s, p) { return [].slice.call((p || d).querySelectorAll(s)); }
  var borne = E.borne, lisse = E.lisse, sortie = E.sortie, rebond = E.rebond, calme = E.calme;
  function fond(el) { return getComputedStyle(el).backgroundColor; }
  function heure(h) { var m = Math.round((h % 1) * 60); return Math.floor(h) + ' h' + (m ? ' ' + (m < 10 ? '0' : '') + m : ''); }

  function liens(p) {
    $$('[data-tel]', p).forEach(function (a) { a.href = 'tel:' + C.telLien; });
    $$('[data-tel-texte]', p).forEach(function (a) { a.textContent = C.telephone; });
    $$('[data-mail]', p).forEach(function (a) { a.href = 'mailto:' + C.mail; a.textContent = C.mail; });
    $$('[data-fb]', p).forEach(function (a) { a.href = C.facebook; });
    $$('[data-carte]', p).forEach(function (a) { a.href = C.carte; });
  }
  liens(d);

  // ---------- l'heure à Beblenheim ----------
  function maintenant() {
    var j = new Date().getDay(), h = new Date().getHours() + new Date().getMinutes() / 60;
    try {
      var o = {}; new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Paris', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date()).forEach(function (x) { o[x.type] = x.value; });
      j = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(o.weekday); h = (+o.hour) + (+o.minute) / 60;
    } catch (e) {}
    return { j: j, h: h };
  }
  var MAINT = maintenant(), AUJ = C.horaires[MAINT.j], OUVERT = MAINT.h >= AUJ[1] && MAINT.h < AUJ[2];

  // ---------- les jardins ----------
  var MIXTE = [['rose', 3, ['rose', 'framboise', 'blush']], ['pivoine', 3, ['blush', 'rose', 'peche']], ['anemone', 2, ['blanc', 'lilas']], ['coquelicot', 2, ['rouge', 'corail']],
    ['dahlia', 2, ['corail', 'framboise', 'beurre']], ['marguerite', 2, ['blanc']], ['cosmos', 2, ['rose', 'blanc']], ['tulipe', 2, ['beurre', 'corail', 'rose']],
    ['lupin', 1.4, ['lilas', 'bleu']], ['tournesol', 1.2, ['beurre']], ['hortensia', 1.2, ['bleu', 'lilas']], ['bouton', .8, ['rose', 'corail']]];
  var THEMES = {
    roses: { e: [['rose', 5, ['framboise', 'rouge', 'rose']], ['pivoine', 3, ['rose', 'peche', 'lilas']], ['bouton', 1.2, ['framboise', 'rouge']], ['dahlia', 1.5, ['corail']]], r: [20, 37] },
    vert: { e: [['orchidee', 4, ['blanc', 'blush']], ['hortensia', 2, ['bleu', 'blanc']], ['feuille', 2, ['blanc']], ['eucalyptus', 1.5, ['blanc']], ['anemone', 2, ['blanc']]], r: [19, 35] },
    blanc: { e: [['rose', 4, ['blanc', 'blush']], ['pivoine', 4, ['blanc', 'blush', 'peche']], ['anemone', 2, ['blanc']], ['eucalyptus', 1.3, ['blanc']], ['marguerite', 1.5, ['blanc']]], r: [20, 37] },
    deuil: { e: [['lys', 4, ['blanc']], ['dahlia', 2.5, ['prune', 'lilas']], ['anemone', 2.5, ['lilas', 'blanc']], ['rose', 2, ['prune', 'blanc']], ['eucalyptus', 1.5, ['blanc']]], r: [19, 34], lent: 1, d: 44 },
    soleil: { e: [['tournesol', 4, ['beurre']], ['tulipe', 3, ['corail', 'rose', 'beurre']], ['marguerite', 3, ['blanc']], ['dahlia', 2, ['corail', 'peche']], ['cosmos', 2, ['rose']]], r: [20, 37] },
    marguerites: { e: [['marguerite', 6, ['blanc']], ['cosmos', 3, ['rose', 'framboise']], ['coquelicot', 2, ['rouge']], ['lupin', 1.4, ['lilas']]], r: [19, 35] },
    mixte: { e: [['coquelicot', 3, ['rouge', 'framboise']], ['dahlia', 3, ['framboise', 'prune']], ['tulipe', 2.5, ['rose', 'framboise']], ['lupin', 2, ['lilas', 'bleu']], ['anemone', 2, ['lilas', 'blanc']]], r: [19, 35] },
    vin: { e: [['pivoine', 4, ['blush', 'blanc', 'peche']], ['rose', 3, ['blanc', 'blush', 'beurre']], ['anemone', 2.5, ['blanc', 'lilas']], ['hortensia', 2, ['bleu', 'lilas']], ['tournesol', 1.2, ['beurre']]], r: [20, 37] },
  };

  var heros = $('#heros'), herosTexte = $('#herosTexte'), zone = { t: -1e9 };
  function mesureHeros(j) {
    var now = performance.now(); if (now - zone.t < 60) return; zone.t = now;
    var hr = heros.getBoundingClientRect(), tr = herosTexte.getBoundingClientRect(), nr = $('#nom').getBoundingClientRect(), sr = $('.sous').getBoundingClientRect();
    zone.bas = Math.max(110, hr.height - (tr.bottom - hr.top) - 54 - 16);
    zone.droite = Math.max(nr.right, sr.right) - hr.left;
    zone.haute = Math.max(zone.bas, (hr.height - 54) - 120 - (hr.height > innerHeight ? hr.height - innerHeight : 0) * .4);
  }
  function pxHeros(xn, j) { mesureHeros(j); var m = j.L >= 760 ? lisse(zone.droite - 40, zone.droite + 340, xn * j.L) : 0; return zone.bas + (zone.haute - zone.bas) * m; }
  var jardin = new E.Jardin($('#jardin'), {
    especes: MIXTE, densite: 60, haut: 1, rayon: [20, 40], fond: fond(heros), sol: fond($('#boutique')), butte: 54, graine: 11, pousse: 'auto', papillons: 4,
    profil: function (xn, j) { return pxHeros(xn, j) / (j.H - 54); },
    poids: function (xn, j) { return borne(pxHeros(xn, j) / Math.max(170, zone.bas), 1, 4.4); }, max: 320,
  });
  // toucher le jardin : une fleur pousse (un toucher bref, pas un défilement)
  var appui = null;
  heros.addEventListener('pointerdown', function (e) { appui = e.target.closest('a,button') ? null : { x: e.clientX, y: e.clientY, t: performance.now() }; });
  heros.addEventListener('pointerup', function (e) {
    if (!appui || Math.abs(e.clientX - appui.x) + Math.abs(e.clientY - appui.y) > 14 || performance.now() - appui.t > 600) { appui = null; return; }
    appui = null;
    var r = jardin.cv.getBoundingClientRect(), x = e.clientX - r.left, f = jardin.planter(x);
    jardin.petales(x, jardin.yButte(x) - 30, f.teinte, 7, 1.2);
  });
  heros.addEventListener('pointercancel', function () { appui = null; });

  var massifs = [];
  $$('.massif').forEach(function (cv, i) {
    var sec = cv.parentElement, avant = sec.previousElementSibling, th = THEMES[cv.dataset.massif];
    var j = new E.Jardin(cv, { especes: th.e, densite: th.d || 64, haut: .97, rayon: th.r, fond: fond(avant), sol: fond(sec), butte: 34, graine: 20 + i * 7, pousse: 'defile', lent: th.lent, ondes: 1 + (i % 3) * .5, phase: i * 1.3 });
    massifs.push({ j: j, sec: sec });
  });
  var pied = $('#pied'), jardinFin = new E.Jardin($('#jardinFin'), { especes: MIXTE, densite: 84, haut: .96, rayon: [20, 40], fond: fond(pied), butte: 0, graine: 5, pousse: 'defile', papillons: 3 });

  // ---------- le bonjour ----------
  var bj = $('#bonjour'), entre = false;
  function entrer() {
    if (entre) return; entre = true; racine.classList.add('entre'); bj.classList.add('part');
    jardin.parti = true; jardin.t0 = performance.now() + 250;
    setTimeout(function () { racine.classList.remove('bonjour-actif'); }, 1100);
  }
  if (racine.classList.contains('bonjour-actif')) {
    jardin.parti = true; jardin.t0 = performance.now() + 1e8;
    setTimeout(entrer, calme ? 1700 : 2300); bj.addEventListener('pointerdown', entrer);
  }

  // ---------- la tige qui pousse en lisant ----------
  var tige = $('#tige'), tigeT = $('#tigeT'), tigeF = $('#tigeF'), sections = [heros].concat($$('.bloc')).concat([pied]), feuillesTige = [], tetesTige = [], secActuelle = -1;
  var TETES = [['bouton', 'rose'], ['rose', 'framboise'], ['pivoine', 'blush'], ['orchidee', 'blanc'], ['rose', 'blanc'], ['lys', 'blanc'], ['tournesol', 'beurre'], ['marguerite', 'blanc'], ['coquelicot', 'rouge'], ['anemone', 'lilas'], ['dahlia', 'corail']];
  sections.forEach(function (s, i) {
    var t = TETES[i % TETES.length], el = E.fleurEl(t[0], t[1], innerWidth < 760 ? 12 : 17); tigeF.appendChild(el); tetesTige.push(el);
    if (i) { var f = d.createElement('i'); f.className = 'tf' + (i % 2 ? ' g' : ''); tige.insertBefore(f, tigeF); feuillesTige.push(f); }
  });
  var bornes = [], docH = 1;
  function mesureTige() {
    docH = Math.max(1, d.documentElement.scrollHeight - innerHeight);
    bornes = sections.map(function (s) { return s.getBoundingClientRect().top + scrollY; });
    feuillesTige.forEach(function (f, i) { f.style.top = borne((bornes[i + 1] - innerHeight * .5) / docH, 0, 1) * 100 + '%'; });
  }

  // ---------- apparitions ----------
  var vus = {};
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('vu'); io.unobserve(e.target); if (e.target.id === 'faits') compter(); } }); }, { threshold: .25, rootMargin: '0px 0px -6% 0px' });
    $$('.monte,.plaques,.pl-mots,.av-fleurs,#faits').forEach(function (el) { io.observe(el); });
    var io2 = new IntersectionObserver(function (es) { es.forEach(function (e) { vus[e.target.id] = e.isIntersecting; if (e.isIntersecting && e.target.id === 'env' && !envOuverte) { envOuverte = true; setTimeout(function () { env.classList.add('ouverte'); }, 350); } if (e.isIntersecting && e.target.id === 'maArche' && !pluieFaite) { pluieFaite = true; setTimeout(pluie, 500); } }); }, { threshold: .35 });
    ['bqScene', 'plScene', 'maArche', 'deCouronne', 'ruban', 'env'].forEach(function (id) { io2.observe($('#' + id)); });
  } else { $$('.monte,.plaques,.pl-mots,.av-fleurs').forEach(function (el) { el.classList.add('vu'); }); }

  // les plaques de la rue
  $$('.plaque').forEach(function (p) {
    p.addEventListener('click', function () { p.classList.remove('encore'); void p.offsetWidth; p.classList.add('encore'); });
    p.addEventListener('animationend', function () { p.classList.remove('encore'); });
  });
  // les chiffres qui montent
  function compter() {
    $$('#faits b').forEach(function (b, n) {
      var txt = b.dataset.compte, v = parseFloat(txt.replace(',', '.')), dec = txt.indexOf(',') > -1, de = v > 1000 ? v - 26 : 0, t0 = performance.now() + n * 160, dur = calme ? 500 : 1300;
      (function pas(t) { var k = sortie(borne((t - t0) / dur, 0, 1)), x = de + (v - de) * k; b.textContent = dec ? x.toFixed(1).replace('.', ',') : String(Math.round(x)); if (k < 1) requestAnimationFrame(pas); else b.textContent = txt; })(performance.now());
    });
  }

  // ---------- le bouquet à composer ----------
  var bqScene = $('#bqScene'), bqZone = $('#bqFleurs'), bqCompte = $('#bqCompte'), bqChoix = $('#bqChoix'), posees = [], bqTilt = 0, bqCible = 0;
  var VARIANTES = { rose: ['framboise', 'rouge', 'blush'], pivoine: ['blush', 'peche', 'blanc'], tulipe: ['beurre', 'corail', 'blush'], anemone: ['blanc', 'lilas'], dahlia: ['corail', 'beurre'], marguerite: ['blanc'], hortensia: ['bleu', 'lilas'], eucalyptus: ['blanc'] };
  var PLACES = [[0, .2, 1.05], [-.56, .22, .98], [.56, .22, .98], [-.25, .35, .95], [.25, .35, .95], [-.74, .37, .88], [.74, .37, .88], [0, .47, .9], [-.44, .49, .86], [.44, .49, .86], [-.86, .5, .78], [.86, .5, .78]];
  function poserTige(k, depuis) {
    var p = posees[k], pl = PLACES[k], W = bqScene.clientWidth, H = bqScene.clientHeight, face = E.ESPECES[p.esp].face;
    var r = W * .122 * pl[2] * (face ? 1 : p.esp === 'eucalyptus' ? .52 : .8), dist = pl[1] * W * (face ? 1 : .78);
    var x = W * .5 + Math.sin(pl[0]) * dist, y = H * .585 - Math.cos(pl[0]) * dist, el = E.fleurEl(p.esp, p.teinte, r);
    var ax = +el.dataset.ax, ay = +el.dataset.ay, rot = face ? pl[0] * .5 : pl[0];
    el.style.left = (x - ax) + 'px'; el.style.top = (y - ay) + 'px'; el.style.transformOrigin = ax + 'px ' + ay + 'px'; el.style.transform = 'rotate(' + rot + 'rad)';
    el.style.zIndex = face ? 20 - k : 2;
    bqZone.appendChild(el); p.el = el;
    if (depuis && el.animate) {
      var b = depuis.getBoundingClientRect(), s = bqScene.getBoundingClientRect(), dx = b.left + b.width / 2 - (s.left + x), dy = b.top + b.height / 2 - (s.top + y);
      el.animate([{ transform: 'translate(' + dx + 'px,' + dy + 'px) rotate(' + (rot - 1.4) + 'rad) scale(.35)' }, { transform: 'translate(0,0) rotate(' + rot + 'rad) scale(1)' }], { duration: calme ? 380 : 720, easing: 'cubic-bezier(.3,1.3,.5,1)' });
      bqCible = (x < W / 2 ? -1 : 1) * 4;
    }
  }
  function direBouquet(plein) {
    if (!posees.length) { bqCompte.textContent = 'Le papier attend ses fleurs.'; return; }
    var n = {}, ordre = []; posees.forEach(function (p) { if (!n[p.esp]) { n[p.esp] = 0; ordre.push(p.esp); } n[p.esp]++; });
    var liste = ordre.map(function (e) { var t = C.tiges.filter(function (x) { return x[0] === e; })[0]; return n[e] + ' ' + (n[e] > 1 ? t[3] : t[2].toLowerCase()); }).join(', ');
    bqCompte.textContent = (plein ? 'Il est plein, et il est beau : ' : posees.length + (posees.length > 1 ? ' tiges : ' : ' tige : ')) + liste + '.';
  }
  C.tiges.forEach(function (t) {
    var b = d.createElement('button'); b.type = 'button'; b.className = 'tig'; b.appendChild(E.fleurEl(t[0], t[1], 22)); var s = d.createElement('span'); s.textContent = t[2]; b.appendChild(s);
    b.addEventListener('click', function () {
      if (posees.length >= PLACES.length) { direBouquet(true); if (bqScene.animate) bqScene.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(-3deg)' }, { transform: 'rotate(3deg)' }, { transform: 'rotate(0)' }], { duration: 380 }); return; }
      var v = VARIANTES[t[0]], k = posees.length; posees.push({ esp: t[0], teinte: v[posees.filter(function (p) { return p.esp === t[0]; }).length % v.length] });
      poserTige(k, b); direBouquet(posees.length >= PLACES.length);
    });
    bqChoix.appendChild(b);
  });
  $('#bqVider').addEventListener('click', function () {
    posees.forEach(function (p, i) {
      var el = p.el; if (!el) return;
      if (el.animate) el.animate([{ transform: el.style.transform }, { transform: 'translate(' + (i % 2 ? 60 : -60) + 'px,340px) rotate(' + (i % 2 ? 2 : -2) + 'rad)', opacity: 0 }], { duration: 620, delay: i * 35, easing: 'cubic-bezier(.5,0,.8,.4)', fill: 'forwards' }).onfinish = function () { el.remove(); };
      else el.remove();
    });
    posees = []; direBouquet();
  });
  $('#bqMot').addEventListener('input', function () { $('#bqCarte').textContent = this.value.trim() || 'Pour toi'; });
  bqScene.addEventListener('pointermove', function (e) { var r = bqScene.getBoundingClientRect(); bqCible = ((e.clientX - r.left) / r.width - .5) * 9; });
  bqScene.addEventListener('pointerleave', function () { bqCible = 0; });
  // un petit bouquet déjà commencé, pour donner envie
  [['rose', 'framboise'], ['pivoine', 'blush'], ['marguerite', 'blanc'], ['eucalyptus', 'blanc'], ['dahlia', 'corail']].forEach(function (t) { posees.push({ esp: t[0], teinte: t[1] }); });
  direBouquet();
  function rebatirBouquet() { bqZone.textContent = ''; posees.forEach(function (p, k) { poserTige(k); }); }

  // ---------- plantes : les feuilles se déroulent ----------
  var plScene = $('#plScene'), feuilles = [], orchidees = 0, plP = 0;
  var FEUILLES = [[3, 86, -60, 1], [1, 60, -66, 1.1], [8, 31, -46, .95], [97, 88, 58, 1], [99, 60, 64, 1.05], [92, 29, 44, .9], [24, 6, -22, .8], [78, 5, 20, .8]];
  var SPOTS = [[20, 19], [80, 17], [50, 3], [5, 44], [95, 42], [9, 70], [91, 72]];
  function batirPlantes() {
    $$('.pf,.po', plScene).forEach(function (x) { x.remove(); }); feuilles = [];
    var W = plScene.clientWidth, H = plScene.clientHeight;
    FEUILLES.forEach(function (f, i) {
      var el = E.fleurEl('feuille', 'blanc', W * .13 * f[3], 'pf'), ax = +el.dataset.ax, ay = +el.dataset.ay;
      el.style.left = (W * f[0] / 100 - ax) + 'px'; el.style.top = (H * f[1] / 100 - ay) + 'px'; el.style.transformOrigin = ax + 'px ' + ay + 'px';
      var o = { el: el, a: f[2], v: 0, x: 0, i: i }; feuilles.push(o);
      function secoue() { o.v += (f[2] < 0 ? -1 : 1) * 260; ouvrirOrchidee(); }
      el.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') secoue(); }); el.addEventListener('click', secoue);
      plScene.appendChild(el);
    });
    for (var k = 0; k < orchidees; k++) poserOrchidee(k, true);
  }
  function poserOrchidee(k, direct) {
    var s = SPOTS[k], W = plScene.clientWidth, el = E.fleurEl('orchidee', k % 3 === 1 ? 'blush' : 'blanc', W * (.075 + (k % 2) * .012), 'po');
    el.style.left = s[0] + '%'; el.style.top = s[1] + '%'; el.style.setProperty('--r', (k % 2 ? 14 : -12) + 'deg'); el.style.zIndex = 5; plScene.appendChild(el);
    if (direct) el.classList.add('on'); else requestAnimationFrame(function () { requestAnimationFrame(function () { el.classList.add('on'); }); });
  }
  var dernOrch = 0;
  function ouvrirOrchidee() { var t = performance.now(); if (orchidees >= SPOTS.length || t - dernOrch < 450) return; dernOrch = t; poserOrchidee(orchidees++); }

  // ---------- mariages : l'arche fleurie et les pétales ----------
  var maArche = $('#maArche'), fleursArche = [], pluieFaite = false, maP = -1;
  var ARCHE = [['rose', 'blanc', 1.05], ['eucalyptus', 'blanc', .5], ['pivoine', 'blush', 1.15], ['anemone', 'blanc', .95], ['feuille', 'blanc', .5], ['rose', 'blush', 1.1], ['pivoine', 'blanc', 1.2], ['eucalyptus', 'blanc', .5], ['rose', 'peche', 1], ['marguerite', 'blanc', .9]];
  function batirArche() {
    fleursArche.forEach(function (f) { f.el.remove(); }); fleursArche = [];
    var W = maArche.clientWidth, H = maArche.clientHeight, R = W / 2, cote = H - R, arc = Math.PI * R, tot = 2 * cote + arc, n = W < 300 ? 19 : 23, rnd = E.alea(31);
    for (var i = 0; i < n; i++) {
      var s = (i + .5) / n * tot, x, y, nx, ny;
      if (s < cote) { x = 0; y = H - s; nx = -1; ny = 0; }
      else if (s < cote + arc) { var a = Math.PI - (s - cote) / R; x = R + Math.cos(a) * R; y = R - Math.sin(a) * R; nx = Math.cos(a); ny = -Math.sin(a); }
      else { x = W; y = R + (s - cote - arc); nx = 1; ny = 0; }
      var t = ARCHE[i % ARCHE.length], face = E.ESPECES[t[0]].face, dehors = (rnd() - .35) * W * .06, el = E.fleurEl(t[0], t[1], W * .1 * t[2] * (.88 + rnd() * .24), 'af');
      var ax = +el.dataset.ax, ay = +el.dataset.ay, rot = face ? (rnd() - .5) * .8 : Math.atan2(ny, nx) + Math.PI / 2 + (rnd() - .5) * .5;
      el.style.left = (x + nx * dehors - ax) + 'px'; el.style.top = (y + ny * dehors - ay) + 'px'; el.style.transformOrigin = ax + 'px ' + ay + 'px'; el.style.zIndex = face ? 3 : 2;
      el.style.transform = 'scale(0)'; maArche.appendChild(el); fleursArche.push({ el: el, rot: rot, ordre: 1 - Math.abs(2 * (i + .5) / n - 1), s: -1 });
    }
    maP = -1;
  }
  var COUL_PETALES = ['#ffffff', '#f2669c', '#d62b63', '#ffb68c', '#ffffff', '#f9c842'];
  function pluie() {
    var z = $('#maPluie'), H = z.clientHeight, L = z.clientWidth, n = calme ? 22 : (L < 700 ? 30 : 46);
    for (var i = 0; i < n; i++) (function (i) {
      var p = d.createElement('i'), x = Math.random() * L, taille = .8 + Math.random() * .9;
      p.style.left = x + 'px'; p.style.background = COUL_PETALES[i % COUL_PETALES.length]; p.style.width = 22 * taille + 'px'; p.style.height = 15 * taille + 'px';
      z.appendChild(p);
      if (!p.animate) { p.remove(); return; }
      var dx = (Math.random() - .5) * 260, r0 = Math.random() * 360;
      p.animate([{ transform: 'translate(0,0) rotate(' + r0 + 'deg)' }, { transform: 'translate(' + dx * .5 + 'px,' + H * .5 + 'px) rotate(' + (r0 + 300) + 'deg)' }, { transform: 'translate(' + dx + 'px,' + (H + 60) + 'px) rotate(' + (r0 + 620) + 'deg)' }],
        { duration: (2600 + Math.random() * 2600) * (H > 900 ? 1.25 : 1), delay: Math.random() * 1100, easing: 'cubic-bezier(.35,.1,.7,.9)', fill: 'backwards' }).onfinish = function () { p.remove(); };
    })(i);
  }
  $('#maLancer').addEventListener('click', pluie);

  // ---------- deuil : la couronne ----------
  var deCouronne = $('#deCouronne'), deTour = $('#deTour'), fleursCouronne = [], deP = -1;
  var COURONNE = [['lys', 'blanc', 1.15], ['eucalyptus', 'blanc', .5], ['rose', 'blanc', 1], ['feuille', 'blanc', .55], ['anemone', 'blanc', .95], ['eucalyptus', 'blanc', .5], ['rose', 'blush', .95], ['feuille', 'blanc', .55]];
  function batirCouronne() {
    deTour.textContent = ''; fleursCouronne = [];
    var W = deCouronne.clientWidth, R = W * .425, n = 24;
    for (var i = 0; i < n; i++) {
      var a = i / n * Math.PI * 2 - Math.PI / 2, t = COURONNE[i % COURONNE.length], face = E.ESPECES[t[0]].face, rr = R + (face ? (i % 3 - 1) * W * .012 : -W * .01);
      var el = E.fleurEl(t[0], t[1], W * .082 * t[2], 'cf'), ax = +el.dataset.ax, ay = +el.dataset.ay;
      el.style.transformOrigin = ax + 'px ' + ay + 'px'; el.style.zIndex = face ? 3 : 2; el.style.transform = 'scale(0)'; deTour.appendChild(el);
      fleursCouronne.push({ el: el, x: Math.cos(a) * rr - ax, y: Math.sin(a) * rr - ay, rot: face ? i * .7 : a + Math.PI + .25, ordre: i / n, s: -1 });
    }
    deP = -1;
  }

  // ---------- cadeaux : la boîte et le ruban ----------
  var boite = $('#boite'), boiteFleurs = $('#boiteFleurs');
  [['pivoine', 'blush', -52, 120], ['dahlia', 'corail', -33, 176], ['rose', 'framboise', -14, 138], ['anemone', 'lilas', 3, 196], ['marguerite', 'blanc', 20, 146], ['hortensia', 'bleu', 37, 180], ['cosmos', 'rose', 55, 116]].forEach(function (f, i) {
    var w = d.createElement('span'); w.className = 'bf'; w.style.setProperty('--a', f[2] + 'deg'); w.style.setProperty('--h', f[3] + 'px'); w.style.setProperty('--d', (Math.abs(i - 3) * .07) + 's');
    w.appendChild(d.createElement('u')); w.appendChild(E.fleurEl(f[0], f[1], 36)); boiteFleurs.appendChild(w);
  });
  boite.addEventListener('click', function () {
    var o = boite.classList.toggle('ouverte');
    $('#boiteIndice').textContent = o ? 'Et voilà. Retouchez-la pour la refermer.' : 'Touchez la boîte.';
  });
  var ruban = $('#ruban'), rubanL = 0;
  (function () {
    for (var k = 0; k < 2; k++) C.ruban.forEach(function (t, i) {
      var s = d.createElement('span'); s.textContent = t; ruban.appendChild(s);
      ruban.appendChild(E.fleurEl(['marguerite', 'cosmos', 'anemone', 'pivoine', 'dahlia'][i % 5], ['blanc', 'blush', 'blanc', 'blush', 'beurre'][i % 5], 15));
    });
  })();

  // ---------- avis : la marguerite ----------
  var paq = $('#paq'), avMot = $('#avMot'), petales = [], effeuille = 0, MOTS = ['Un peu…', 'Beaucoup…', 'Passionnément…', 'À la folie !', 'Pas du tout ?'], NP = 9;
  function dire(t) { avMot.textContent = t; avMot.classList.remove('saute'); void avMot.offsetWidth; avMot.classList.add('saute'); }
  for (var ip = 0; ip < NP; ip++) (function (i) {
    var b = d.createElement('button'), a = i * 360 / NP; b.type = 'button'; b.className = 'pe'; b.style.setProperty('--a', a + 'deg'); b.style.setProperty('--n', i); b.setAttribute('aria-label', 'Détacher un pétale');
    b.addEventListener('click', function () {
      if (b.classList.contains('partie') || b.dataset.vol) return;
      b.dataset.vol = 1; effeuille++;
      var dernier = effeuille >= NP, dir = Math.sin(a * Math.PI / 180) >= 0 ? 1 : -1, ux = Math.sin(a * Math.PI / 180) * 36, uy = -Math.cos(a * Math.PI / 180) * 36;
      dire(dernier ? 'À la folie ! Comme ses clients.' : MOTS[(effeuille - 1) % 5]);
      function fini() { b.classList.add('partie'); delete b.dataset.vol; }
      if (b.animate) b.animate([{ transform: 'translate(0,0) rotate(' + a + 'deg)' }, { transform: 'translate(' + ux + 'px,' + uy + 'px) rotate(' + (a + dir * 24) + 'deg)', offset: .22 }, { transform: 'translate(' + (ux + dir * 46) + 'px,' + (paq.clientHeight * .9) + 'px) rotate(' + (a + dir * 170) + 'deg)', opacity: 0 }], { duration: calme ? 600 : 1050, easing: 'cubic-bezier(.4,0,.7,.6)' }).onfinish = fini; else fini();
      if (dernier) setTimeout(function () { effeuille = 0; petales.forEach(function (p) { p.classList.remove('partie'); p.classList.add('revient'); }); setTimeout(function () { petales.forEach(function (p) { p.classList.remove('revient'); }); dire('Elle a repoussé. Encore ?'); }, 1200); }, 2600);
    });
    paq.insertBefore(b, $('.paq-coeur', paq)); petales.push(b);
  })(ip);
  (function () {
    var z = $('#avFleurs');
    for (var i = 0; i < 5; i++) { var s = d.createElement('span'), f = E.fleurEl('marguerite', 'blanc', innerWidth < 760 ? 21 : 27); s.style.setProperty('--n', i); if (i === 4) s.style.width = parseFloat(f.style.width) * .7 + 'px'; s.appendChild(f); z.appendChild(s); }
  })();

  // ---------- commander : l'enveloppe ----------
  var env = $('#env'), envCarte = $('#envCarte'), envOuverte = false;
  function carte(k) {
    envCarte.innerHTML = C.commander[k]; liens(envCarte);
    var a = $('[data-auj]', envCarte); if (a) a.textContent = 'Aujourd’hui, ' + AUJ[0].toLowerCase() + ' : ' + heure(AUJ[1]) + ' à ' + heure(AUJ[2]) + '.';
  }
  carte('tel');
  $$('#coChoix button').forEach(function (b) {
    b.addEventListener('click', function () {
      $$('#coChoix button').forEach(function (x) { x.classList.toggle('on', x === b); });
      envOuverte = true; env.classList.remove('ouverte');
      setTimeout(function () { carte(b.dataset.co); env.classList.add('ouverte'); }, calme ? 200 : 520);
    });
  });

  // ---------- infos : les horaires et la fleur ouverte ou fermée ----------
  (function () {
    var ul = $('#hor');
    [1, 2, 3, 4, 5, 6, 0].forEach(function (j) { var h = C.horaires[j], li = d.createElement('li'); if (j === MAINT.j) li.className = 'auj'; li.innerHTML = '<span>' + h[0] + (j === MAINT.j ? ', aujourd’hui' : '') + '</span><b>' + heure(h[1]) + ' à ' + heure(h[2]) + '</b>'; ul.appendChild(li); });
    var dem = C.horaires[(MAINT.j + 1) % 7];
    $('#etatF').appendChild(OUVERT ? E.fleurEl('anemone', 'rose', 30) : E.fleurEl('bouton', 'rose', 26));
    $('#etatT').textContent = OUVERT ? 'Ouvert en ce moment' : 'Fermé pour l’instant';
    $('#etatS').textContent = OUVERT ? 'jusqu’à ' + heure(AUJ[2]) : (MAINT.h < AUJ[1] ? 'ouvre à ' + heure(AUJ[1]) : 'rouvre demain à ' + heure(dem[1]));
  })();

  // ---------- le défilement ----------
  var glisses = $$('[data-glisse]').map(function (f) { return { f: f, img: $('img', f) }; }), navs = $$('.tete nav a'), yVu = -1, hVu = -1, lVu = innerWidth;
  function defile() {
    var y = scrollY, vh = innerHeight, i, r;
    // la tige
    var p = borne(y / docH, 0, 1), th = tige.clientHeight;
    tigeT.style.transform = 'scaleY(' + p + ')'; tigeF.style.transform = 'translateY(' + p * th + 'px) rotate(' + y * .25 + 'deg)';
    for (i = 0; i < feuillesTige.length; i++) feuillesTige[i].classList.toggle('on', y >= bornes[i + 1] - vh * .5);
    var act = 0; for (i = 0; i < bornes.length; i++) if (y + vh * .5 >= bornes[i]) act = i;
    if (act !== secActuelle) { secActuelle = act; tetesTige.forEach(function (t, k) { t.classList.toggle('on', k === act); }); var id = sections[act].id; navs.forEach(function (a) { a.classList.toggle('ici', a.getAttribute('href') === '#' + id); }); }
    // les massifs poussent quand leur section arrive
    for (i = 0; i < massifs.length; i++) { if (!massifs[i].j.vu) continue; r = massifs[i].sec.getBoundingClientRect(); massifs[i].j.cible = borne((vh - r.top + massifs[i].j.H) / (massifs[i].j.H + vh * .2), 0, 1); }
    if (jardinFin.vu) { r = jardinFin.cv.getBoundingClientRect(); jardinFin.cible = borne((vh - r.top) / (r.height * .75), 0, 1); }
    // les photos glissent dans leur cadre
    for (i = 0; i < glisses.length; i++) { r = glisses[i].f.getBoundingClientRect(); if (r.bottom < -50 || r.top > vh + 50) continue; glisses[i].img.style.transform = 'translateY(' + (-borne((r.top + r.height / 2 - vh / 2) / vh, -1, 1) * 7.2).toFixed(2) + '%)'; }
    // plantes
    if (vus.plScene !== false) { r = plScene.getBoundingClientRect(); plP = borne((vh * .92 - r.top) / (vh * .55), 0, 1); }
    // l'arche
    r = maArche.getBoundingClientRect();
    if (r.bottom > -100 && r.top < vh + 100) {
      var pa = borne((vh * .95 - r.top) / (vh * .7), 0, 1);
      if (Math.abs(pa - maP) > .004) { maP = pa; fleursArche.forEach(function (f) { var s = rebond(borne((pa * 1.3 - f.ordre) / .3, 0, 1)); if (Math.abs(s - f.s) > .003) { f.s = s; f.el.style.transform = 'rotate(' + f.rot + 'rad) scale(' + s.toFixed(3) + ')'; } }); }
    }
    // la couronne
    r = deCouronne.getBoundingClientRect();
    if (r.bottom > -100 && r.top < vh + 100) {
      var pc = borne((vh * .95 - r.top) / (vh * .75), 0, 1);
      if (Math.abs(pc - deP) > .004) { deP = pc; fleursCouronne.forEach(function (f) { var s = sortie(borne((pc * 1.25 - f.ordre) / .25, 0, 1)); if (Math.abs(s - f.s) > .003) { f.s = s; f.el.style.transform = 'translate(' + f.x.toFixed(1) + 'px,' + f.y.toFixed(1) + 'px) rotate(' + f.rot + 'rad) scale(' + s.toFixed(3) + ')'; } }); }
    }
  }
  E.chaqueImage(function (t, dt) {
    if (scrollY !== yVu || innerHeight !== hVu) { yVu = scrollY; hVu = innerHeight; defile(); }
    var tt = t / 1000, i;
    if (vus.bqScene) { bqTilt += (bqCible + Math.sin(tt * 1.1) * 1.3 * (calme ? .4 : 1) - bqTilt) * Math.min(1, dt * 5); bqCible *= Math.pow(.3, dt); bqZone.style.transform = 'rotate(' + bqTilt.toFixed(2) + 'deg)'; }
    if (vus.plScene) for (i = 0; i < feuilles.length; i++) {
      var f = feuilles[i], o = sortie(borne((plP - i * .07) / .45, 0, 1));
      f.v += (-f.x * 70 - f.v * 5) * dt; f.x += f.v * dt;
      f.el.style.transform = 'rotate(' + (f.a * o + Math.sin(tt * 1.2 + i * 1.7) * 3.2 * (calme ? .4 : 1) + f.x).toFixed(2) + 'deg) scale(' + (.2 + .8 * o).toFixed(3) + ')';
    }
    if (vus.ruban && rubanL) { var x = (tt * (calme ? 16 : 46) + scrollY * .35) % rubanL; ruban.style.transform = 'translateX(' + (-x).toFixed(1) + 'px)'; }
  });

  // ---------- mesures ----------
  function toutBatir() { batirPlantes(); batirArche(); batirCouronne(); rebatirBouquet(); rubanL = ruban.scrollWidth / 2 + 9; mesureTige(); yVu = -1; }
  toutBatir();
  var attente;
  addEventListener('resize', function () { clearTimeout(attente); attente = setTimeout(function () { if (innerWidth !== lVu) { lVu = innerWidth; toutBatir(); } else { mesureTige(); yVu = -1; } zone.t = -1e9; jardin.semer(); }, 180); });
  addEventListener('load', function () { mesureTige(); zone.t = -1e9; jardin.poser(); yVu = -1; });
  if (d.fonts && d.fonts.ready) d.fonts.ready.then(function () { zone.t = -1e9; jardin.semer(); toutBatir(); });
  setTimeout(function () { mesureTige(); yVu = -1; }, 1500);
  E.demarrer();
})();
