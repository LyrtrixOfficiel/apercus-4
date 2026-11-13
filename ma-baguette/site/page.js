// Ma Baguette : « Prenez un ticket ». Aucune dépendance, aucun WebGL. Tout le contenu propre au commerce vient de contenu.js.
// Le réglage système des animations n'est jamais lu : tout bouge toujours. Mode calme sur demande : ?calme=1.
(function () {
  var C = window.CONTENU, D = document, H = D.documentElement;
  var $ = function (s, r) { return (r || D).querySelector(s); }, $$ = function (s, r) { return [].slice.call((r || D).querySelectorAll(s)); };
  var calme = H.classList.contains('calme');
  var req = new URLSearchParams(location.search);
  function borne(x, a, b) { return x < a ? a : x > b ? b : x; }
  function annoncer(t) { try { if (parent !== window) parent.postMessage({ type: t }, '*'); } catch (e) {} }
  function rejoue(el, cl) { el.classList.remove(cl); void el.offsetWidth; el.classList.add(cl); }
  var mb = innerWidth < 760 ? .7 : 1, vh = innerHeight;
  var G = { sec: [], jourTop: 0, jourH: 1, colleW: 0, colleH: 0, meTop: 0, meH: 0 };   // positions gardées en mémoire (voir mesurer)

  // ---------- liens ----------
  $$('[data-carte]').forEach(function (a) { a.href = C.carte; a.target = '_blank'; a.rel = 'noopener'; });

  // ---------- teintes et mur de briques (une tuile dessinée par teinte) ----------
  function rvb(h) { var n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
  function tuile(p) {
    var bw = 124, bh = 42, cols = 6, rangs = 8, cv = D.createElement('canvas'); cv.width = bw * cols; cv.height = bh * rangs;
    var x = cv.getContext('2d'), base = rvb(p.mur), g = 20261112;
    function al() { g = (g * 16807) % 2147483647; return g / 2147483647; }
    x.fillStyle = p.joint; x.fillRect(0, 0, cv.width, cv.height);
    for (var r = 0; r < rangs; r++) {
      var tons = []; for (var k = 0; k < cols; k++) tons.push([(al() - .5) * .2, (al() - .5) * 16]);
      for (var c = -1; c < cols; c++) {
        var t = tons[(c + cols) % cols], ox = c * bw + (r % 2 ? bw / 2 : 0) + 2.5, oy = r * bh + 2.5;
        x.fillStyle = 'rgb(' + Math.round(borne(base[0] * (1 + t[0]) + t[1] * .4, 0, 255)) + ',' + Math.round(borne(base[1] * (1 + t[0]) - t[1] * .3, 0, 255)) + ',' + Math.round(borne(base[2] * (1 + t[0]) - t[1] * .5, 0, 255)) + ')';
        x.fillRect(ox, oy, bw - 5, bh - 5);
        for (var s = 0; s < 6; s++) { x.fillStyle = al() < .5 ? 'rgba(0,0,0,.07)' : 'rgba(255,255,255,.09)'; x.fillRect(ox + al() * (bw - 34), oy + 2 + al() * (bh - 16), 5 + al() * 24, 2 + al() * 5); }
        x.fillStyle = 'rgba(0,0,0,.11)'; x.fillRect(ox, oy + bh - 9, bw - 5, 4);
        x.fillStyle = 'rgba(255,255,255,.1)'; x.fillRect(ox, oy, bw - 5, 3);
      }
    }
    return cv.toDataURL('image/jpeg', .84);
  }
  function teinte(nom) {
    var p = C.palettes[nom]; if (!p) return;
    ['mur', 'joint', 'email', 'papier', 'encre', 'or'].forEach(function (k) { H.style.setProperty('--' + k, p[k]); });
    try { H.style.setProperty('--mur-img', 'url(' + tuile(p) + ')'); } catch (e) {}
    var m = $('meta[name=theme-color]'); if (m) m.content = p.theme;
  }
  teinte(C.palettes[req.get('palette')] ? req.get('palette') : 'brique');
  addEventListener('message', function (e) { if (e.data && e.data.type === 'kazura-couleur') teinte(e.data.palette); });

  // ---------- les briques s'allument sous la souris ou le doigt, une onde quand on tape le mur ----------
  $$('.mur').forEach(function (m) {
    var bassin = [], n = 0, dern = '';
    for (var i = 0; i < 48; i++) { var b = D.createElement('i'); b.className = 'brq'; m.insertBefore(b, m.firstChild); bassin.push(b); }
    function allume(col, rg, delai) {
      var b = bassin[n++ % bassin.length], s = mb;
      b.style.cssText = 'left:' + (col * 124 * s + (rg % 2 ? 62 * s : 0) + 2.5 * s) + 'px;top:' + (rg * 42 * s + 2.5 * s) + 'px;width:' + 119 * s + 'px;height:' + 37 * s + 'px';
      setTimeout(function () { b.classList.add('on'); setTimeout(function () { b.classList.remove('on'); }, 110); }, delai || 0);
    }
    function case_(e) { var r = m.getBoundingClientRect(), s = mb, rg = Math.floor((e.clientY - r.top) / (42 * s)); return [Math.floor((e.clientX - r.left - (rg % 2 ? 62 * s : 0)) / (124 * s)), rg]; }
    if (calme) return;
    m.addEventListener('pointermove', function (e) { var c = case_(e), k = c.join(); if (k === dern) return; dern = k; allume(c[0], c[1], 0); }, { passive: true });
    m.addEventListener('pointerdown', function (e) {
      if (e.target.closest('a,button,input,.pl,.affiche,.mot,.distrib')) return;
      var c = case_(e);
      for (var dr = -3; dr <= 3; dr++) for (var dc = -3; dc <= 3; dc++) {
        var dx = dc + (((c[1] + dr) % 2 + 2) % 2 ? .5 : 0) - (((c[1] % 2) + 2) % 2 ? .5 : 0), d = Math.hypot(dx, dr * .55);
        if (d > 0 && d < 2.7) allume(c[0] + dc, c[1] + dr, d * 85);
      }
    }, { passive: true });
  });

  // ---------- petits sons, seulement après un geste ----------
  var ac = null;
  function bruit(duree, grave, aigu, vol) {
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      var sr = ac.sampleRate, n = Math.floor(sr * duree), t = ac.createBuffer(1, n, sr), d = t.getChannelData(0);
      for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (Math.exp(-i / (sr * duree * .22)) * .5 + (Math.random() < .006 ? .9 : 0) * Math.exp(-i / (sr * duree * .6)));
      var src = ac.createBufferSource(); src.buffer = t;
      var f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = grave; f.frequency.linearRampToValueAtTime(aigu, ac.currentTime + duree); f.Q.value = .7;
      var v = ac.createGain(); v.gain.value = vol; src.connect(f); f.connect(v); v.connect(ac.destination); src.start();
    } catch (e) {}
  }
  function croc() { bruit(.26, 2400, 1500, .5); }
  function zip() { bruit(.2, 900, 4200, .28); }
  function toc() { bruit(.09, 320, 180, .7); }

  // ---------- horloges ----------
  $$('.ho-cadran').forEach(function (c) { for (var i = 11; i >= 0; i--) { var b = D.createElement('b'); b.style.setProperty('--i', i); c.insertBefore(b, c.firstChild); } });
  function aiguilles(h, heures, avecS) {
    var T = heures * 3600;
    $('.ho-h', h).style.setProperty('--a', (T / 120).toFixed(2) + 'deg');
    $('.ho-m', h).style.setProperty('--a', (T / 10).toFixed(2) + 'deg');
    if (avecS) $('.ho-s', h).style.setProperty('--a', (Math.floor(T) * 6) + 'deg');
  }
  var hor = $('#horloge');
  function heureToulouse() {
    var p = new Date().toLocaleTimeString('fr-FR', { timeZone: 'Europe/Paris', hour12: false }).split(':');
    return (+p[0]) + (+p[1]) / 60 + (+p[2]) / 3600;
  }
  function tic() { try { aiguilles(hor, heureToulouse(), true); } catch (e) { var d = new Date(); aiguilles(hor, d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600, true); } }
  tic(); if (!calme) setInterval(tic, 1000);

  // ---------- accueil : la plaque qui se pend, la baguette qui suit ----------
  var plg = $('#pl-g'), acc = $('#accueil'), hbag = $('#h-bag');
  plg.addEventListener('animationend', function (e) { if (e.target !== plg) return; plg.classList.add('fini'); plg.classList.remove('pend'); });
  plg.addEventListener('click', function () { if (!plg.classList.contains('fini')) return; rejoue(plg, 'pend'); toc(); });
  $$('.balance').forEach(function (b) {
    b.addEventListener('animationend', function (e) { if (e.target !== b) return; b.classList.add('fini'); b.classList.remove('pend'); });
    b.addEventListener('click', function () { rejoue(b, 'pend'); toc(); });
  });
  var cx = 0, cy = 0, vx = 0, vy = 0, suit = false;
  function suivre() {
    vx += (cx - vx) * .08; vy += (cy - vy) * .08;
    hbag.style.setProperty('--px', vx.toFixed(3)); hbag.style.setProperty('--py', vy.toFixed(3));
    if (Math.abs(cx - vx) + Math.abs(cy - vy) > .004) requestAnimationFrame(suivre); else suit = false;
  }
  if (!calme) acc.addEventListener('pointermove', function (e) {
    if (e.pointerType === 'touch') return;
    cx = (e.clientX / innerWidth - .5) * 2; cy = (e.clientY / vh - .5) * 2;
    if (!suit) { suit = true; requestAnimationFrame(suivre); }
  }, { passive: true });

  // ---------- le distributeur de tickets ----------
  var tk = $('#di-ticket'), led = $('#led'), aide = $('#di-aide'), pris = false, MOI = $$('main > section').length;
  function nn(n) { return (n < 10 ? '0' : '') + n; }
  $$('[data-moi]').forEach(function (e) { e.textContent = nn(MOI); });
  function prendre(vol) {
    if (pris) return; pris = true;
    tk.classList.remove('appel');
    if (vol && !calme) {
      var a = tk.getBoundingClientRect(), b = led.getBoundingClientRect();
      tk.classList.add('vole');
      tk.style.transform = 'translate3d(' + (b.left + b.width / 2 - a.left - a.width / 2).toFixed(0) + 'px,' + (b.top + b.height / 2 - a.top - a.height / 2).toFixed(0) + 'px,0) scale(.34) rotate(22deg)';
      zip();
      setTimeout(function () { tk.classList.add('pris'); rejoue(led, 'recu'); $$('#led-n b').forEach(function (d) { rejoue(d, 'roule'); }); }, 780);
    } else tk.classList.add('pris');
    aide.textContent = 'Vous avez le ' + nn(MOI) + '. La file avance quand vous descendez.';
  }
  tk.classList.add('appel');
  (function () {
    var y0 = 0, tire = false, dy = 0;
    tk.addEventListener('pointerdown', function (e) { if (pris) return; tire = true; y0 = e.clientY; dy = 0; tk.classList.remove('appel'); try { tk.setPointerCapture(e.pointerId); } catch (x) {} });
    tk.addEventListener('pointermove', function (e) { if (!tire) return; dy = borne(e.clientY - y0, 0, 96); tk.style.setProperty('--ty', dy + 'px'); if (dy > 58) { tire = false; prendre(true); } });
    function fin() { if (!tire) return; tire = false; if (dy < 8) prendre(true); else { tk.style.setProperty('--ty', '0px'); tk.classList.add('appel'); } }
    tk.addEventListener('pointerup', fin); tk.addEventListener('pointercancel', fin);
    tk.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); prendre(true); } });
  })();

  // ---------- l'afficheur « on sert le » et le menu ----------
  var sections = $$('main > section'), ledN = $$('#led-n b'), ledT = $('#led-t'), liens = $$('.menu a[href^="#"]'), affN = $('#aff-n'), aff = $('.afficheur'), enCours = 0;
  function servir(n) {
    if (n === enCours) return; enCours = n;
    var t = nn(n);
    ledN.forEach(function (b, i) { if (b.textContent !== t[i]) { b.textContent = t[i]; if (!calme) rejoue(b, 'roule'); } });
    var moi = n >= MOI;
    ledT.textContent = moi ? 'C’est à vous' : 'On sert le';
    led.classList.toggle('avous', moi && !calme);
    aff.classList.toggle('avous', moi && !calme);
    if (moi && !pris) prendre(false);
    var id = sections[n - 1].id;
    liens.forEach(function (a) { a.classList.toggle('ici', a.getAttribute('href') === '#' + id); });
  }

  // ---------- rangs de briques : le mur s'effrite ou se monte au défilement ----------
  var rangs = $$('.rang').map(function (el) {
    var o = { el: el, tombe: el.classList.contains('tombe'), b: [] };
    o.batir = function () {
      el.textContent = ''; o.b = [];
      var s = mb, n = Math.ceil(el.clientWidth / (124 * s)) + 1;
      for (var r = 0; r < 2; r++) for (var c = -1; c < n; c++) {
        var b = D.createElement('b');
        b.style.left = (c * 124 * s + (r % 2 ? 62 * s : 0) + 2.5 * s).toFixed(1) + 'px'; b.style.top = (r * 42 * s + 2.5 * s).toFixed(1) + 'px';
        b.style.setProperty('--o', (Math.random() * .13).toFixed(3));
        el.appendChild(b);
        o.b.push({ el: b, t: (r === 1 ? 0 : .2) + Math.random() * .52, rot: (Math.random() - .5) * 46, dx: (Math.random() - .5) * 50, der: -1 });
      }
    };
    o.batir(); return o;
  });
  function majRangs(y) {
    rangs.forEach(function (o) {
      var top = o.top - y; if (top > vh + 60 || top + o.h < -160) return;
      var q = borne((vh * .94 - top) / (vh * .52), 0, 1);
      o.b.forEach(function (k) {
        var l = borne((q - k.t) / .26, 0, 1); if (!o.tombe) l = 1 - l;
        if (Math.abs(l - k.der) < .004) return; k.der = l;
        var e = l * l;
        k.el.style.transform = l ? 'translate3d(' + (k.dx * e).toFixed(1) + 'px,' + ((o.tombe ? 120 : -100) * e).toFixed(1) + 'px,0) rotate(' + (k.rot * e).toFixed(1) + 'deg)' : '';
        k.el.style.opacity = (1 - l * l * l).toFixed(3);
      });
    });
  }
  var dents = $$('.dents');

  // ---------- ma baguette : les réglages ----------
  var bag = $('#co-bag'), bagIn = $('#co-bag-in'), manNom = $('#co-nom'), indice = $('#co-indice');
  for (var i = 0; i < 10; i++) { var t = D.createElement('i'); t.className = 'tr tr' + i + (i > 4 ? ' d' : ''); t.style.setProperty('--i', i); t.style.setProperty('--s', i % 2 ? 1 : -1); bagIn.appendChild(t); }
  var E = { cuisson: 50, taille: 'entière', tranchee: 'non', papier: 'dans son papier', croc: 0, prenom: '' };
  var QUIGNON = ['intact', 'croqué en chemin', 'bien entamé', 'il n’y en a plus'];
  var listes = [$('#ti-lignes-a'), $('#ti-lignes-b')], tampons = [$('#tampon-a'), $('#tampon-b')], avant = {};
  function lignes() {
    var c = E.cuisson;
    return [['cuisson', c < 34 ? 'pas trop cuite' : c < 67 ? 'dorée' : 'bien cuite'], ['taille', E.taille], ['tranchée', E.tranchee], ['emportée', E.papier], ['quignon', QUIGNON[E.croc]], ['pour', E.prenom || '............']];
  }
  function majTicket(premier) {
    var L = lignes();
    listes.forEach(function (dl) {
      if (!dl.children.length) dl.innerHTML = L.map(function (l) { return '<div><dt>' + l[0] + '</dt><i></i><dd></dd></div>'; }).join('');
      L.forEach(function (l, i) { var dd = dl.children[i].lastChild; if (dd.textContent !== l[1]) { dd.textContent = l[1]; if (!premier && !calme) rejoue(dd, 'neuf'); } });
    });
    if (!premier) { tampons.forEach(function (t) { t.classList.remove('pose'); }); $('#ticket-b').classList.remove('tendu'); donner.textContent = 'Tendre mon ticket'; noteCm.textContent = NOTE0; }
  }
  function majBag() {
    var c = E.cuisson / 100, t, f;
    if (c < .5) { t = (.5 - c) * 2; f = 'brightness(' + (1 + .25 * t).toFixed(3) + ') saturate(' + (1 - .32 * t).toFixed(3) + ') contrast(' + (1 - .07 * t).toFixed(3) + ')'; }
    else { t = (c - .5) * 2; f = 'brightness(' + (1 - .4 * t).toFixed(3) + ') saturate(' + (1 + .06 * t).toFixed(3) + ') contrast(' + (1 + .14 * t).toFixed(3) + ')'; }
    bag.style.setProperty('--cuisson', f);
    bag.classList.toggle('demie', E.taille !== 'entière');
    bag.classList.toggle('tranchee', E.tranchee === 'oui');
    bag.classList.toggle('nue', E.papier !== 'dans son papier');
    bag.classList.toggle('b1', E.croc === 1); bag.classList.toggle('b2', E.croc === 2); bag.classList.toggle('b3', E.croc === 3);
    bag.classList.toggle('croque', E.croc > 0);
    manNom.textContent = E.prenom ? 'à ' + E.prenom : 'Ma baguette';
  }
  function miettes(xp, yp, nb) {
    if (calme) return;
    var tons = ['#e2a23c', '#c47a2a', '#f6e3b4', '#8a4a1c', '#f0c873'];
    for (var i = 0; i < nb; i++) {
      var m = D.createElement('i'), a = Math.random() * 6.28, v = 40 + Math.random() * 110;
      m.className = 'miette';
      m.style.cssText = 'left:' + xp + '%;top:' + yp + '%;--t:' + (6 + Math.random() * 11).toFixed(0) + 'px;--c:' + tons[i % tons.length] + ';--x:' + (Math.cos(a) * v).toFixed(0) + 'px;--y:' + (Math.sin(a) * v * .7 + 70).toFixed(0) + 'px;--r:' + ((Math.random() - .5) * 700).toFixed(0) + 'deg';
      bag.appendChild(m); (function (m) { setTimeout(function () { m.remove(); }, 850); })(m);
    }
  }
  function croquer() {
    if (E.croc >= 3) { indice.textContent = 'Il n’y a plus de quignon. Vous pouvez en remettre un.'; return; }
    E.croc++; croc(); miettes(E.taille === 'entière' ? 4 + E.croc * 3 : 29 + E.croc * 3, 46, 12);
    indice.textContent = ['', 'Encore un peu ?', 'Il en reste un bout.', 'Voilà. C’est toujours comme ça.'][E.croc];
    majBag(); majTicket();
  }
  $('#co-croc').addEventListener('click', croquer);
  $('#co-croquer').addEventListener('click', croquer);
  $('#co-recoller').addEventListener('click', function () { E.croc = 0; indice.textContent = 'Touchez le bout de la baguette : on le croque toujours en chemin.'; majBag(); majTicket(); });
  $('#co-cuisson').addEventListener('input', function () { E.cuisson = +this.value; majBag(); majTicket(); });
  $$('.choix button[data-k]').forEach(function (b) {
    b.addEventListener('click', function () {
      var k = b.getAttribute('data-k'), v = b.getAttribute('data-v'); if (E[k] === v) return;
      E[k] = v; $$('.choix button[data-k="' + k + '"]').forEach(function (o) { o.setAttribute('aria-pressed', o === b ? 'true' : 'false'); });
      if (k === 'taille' || k === 'tranchee') { if (v !== 'entière' && v !== 'non') { croc(); miettes(k === 'taille' ? 50 : 50, 50, k === 'taille' ? 14 : 9); } }
      majBag(); majTicket();
    });
  });
  $('#co-prenom').addEventListener('input', function () { E.prenom = this.value.replace(/[<>]/g, '').trim().slice(0, 14); majBag(); majTicket(); });
  $('#co-noter').addEventListener('click', function () {
    tampons[0].classList.remove('pose'); void tampons[0].offsetWidth; tampons[0].classList.add('pose');
    rejoue($('#ticket-a'), 'secoue'); toc(); if (!pris) prendre(false); rejoue(led, 'recu');
  });

  // ---------- au mètre : le ruban se déroule, l'aiguille monte ----------
  var meScene = $('#me-scene'), meBande = $('#me-bande'), meCm = $('#me-cm'), meG = $('#me-g'), meAig = $('.me-balance .ho-m'), meDer = -1;
  for (var c5 = 5; c5 <= 65; c5 += 5) { var eb = D.createElement('b'); eb.textContent = c5; eb.style.left = (c5 / 65 * 100).toFixed(3) + '%'; meBande.appendChild(eb); }
  meAig.style.setProperty('--a', '-135deg');
  function majMetre(y) {
    var top = G.meTop - y; if (top > vh + 80 || top + G.meH < -80) return;
    var q = borne((vh * .9 - top) / (vh * .62), 0, 1); q = q * q * (3 - 2 * q);
    if (Math.abs(q - meDer) < .002) return; meDer = q;
    meScene.style.setProperty('--q', q.toFixed(4));
    meCm.textContent = Math.round(q * 65); meG.textContent = Math.round(q * 250 / 5) * 5;
    meAig.style.setProperty('--a', (-135 + 135 * q).toFixed(1) + 'deg');
  }

  // ---------- la vitrine : étiquettes plantées, reflet de la vitre ----------
  var kE = 0;
  C.comptoir.forEach(function (l) {
    var b = D.createElement('button'); b.type = 'button'; b.className = 'etq';
    b.style.setProperty('--k', kE); b.style.setProperty('--s', kE % 2 ? 1 : -1); kE++;
    var sp = D.createElement('span'), pr = D.createElement('b'); sp.textContent = l.nom; pr.textContent = l.prix; b.appendChild(sp); b.appendChild(pr);
    b.setAttribute('aria-label', (l.nom.charAt(0) === '.' ? 'Produit à compléter' : l.nom) + ', prix à compléter');
    b.addEventListener('click', function () {
      rejoue(b, 'tourne'); toc();
      setTimeout(function () { var dos = b.classList.toggle('dos'); sp.textContent = dos ? 'Votre produit' : l.nom; pr.textContent = dos ? 'votre prix' : l.prix; }, calme ? 0 : 250);
    });
    b.addEventListener('animationend', function (e) { if (e.animationName === 'tourne') b.classList.remove('tourne'); if (e.animationName === 'plante') b.classList.add('ok'); });
    $(l.rayon === 'pain' ? '#etqs-pain' : '#etqs-pat').appendChild(b);
  });
  var JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'], auj = new Date().getDay();
  $('#vi-jour').textContent = 'Le pain de ce ' + JOURS[auj];
  var cadres = $$('.vi-cadre');
  cadres.forEach(function (c) {
    c.addEventListener('pointermove', function (e) { var r = c.getBoundingClientRect(); c.style.setProperty('--rx', (-70 + (e.clientX - r.left) / r.width * 150).toFixed(1) + '%'); c._main = true; }, { passive: true });
    c.addEventListener('pointerleave', function () { c._main = false; });
  });

  // ---------- la journée sur la place ----------
  var jour = $('#journee'), colle = $('#j-colle'), rue = $('#j-rue'), cartes = $$('.j-carte'), reperes = $$('#j-reperes button'), jh = $('#j-horloge'), fenetres = [];
  (function () {
    var plan = [['bas', 'rgba(255,200,150,.14)', '#2e4d43'], ['haut', 'rgba(120,40,20,.12)', '#5a3324'], ['moyen boulangerie', '', ''], ['haut', 'rgba(255,220,190,.2)', '#27406e'], ['bas', 'rgba(120,40,20,.1)', '#2e4d43']], g = 7;
    function al() { g = (g * 16807) % 2147483647; return g / 2147483647; }
    plan.forEach(function (p, n) {
      var im = D.createElement('div'); im.className = 'imm ' + p[0]; if (p[1]) im.style.setProperty('--teinte', p[1]);
      var h = '<div class="toit"></div>';
      for (var e = 0; e < 2; e++) { h += '<div class="etage">'; for (var f = 0; f < 3; f++) h += '<span class="fen"><i class="vl g"></i><i class="vl d"></i></span>'; h += '</div>'; }
      if (n === 2) h += '<div class="rdc boul"><span class="ens"><em>Ma</em>BAGUETTE</span><span class="arc vit"><span class="pains"><i style="--s:-1"></i><i style="--s:1"></i><i style="--s:-.4"></i><i style="--s:.8"></i><i style="--s:-1.2"></i><i style="--s:.3"></i></span></span><span class="arc porte"></span><span class="num12">12</span></div>';
      else h += '<div class="rdc"><span class="arc porte" style="--pc:' + p[2] + '"></span><span class="arc porte" style="--pc:' + p[2] + '"></span></div>';
      h += '<i class="imm-nuit"></i>';
      im.innerHTML = h; rue.appendChild(im);
      $$('.fen', im).forEach(function (f) { fenetres.push({ el: f, ouvre: 6.5 + al() * 2.9, ferme: 19.7 + al() * 1.4, lampe: al() < .45, etat: '' }); });
    });
    var ch = D.createElement('span'); ch.className = 'cheminee'; ch.innerHTML = '<i style="--k:0"></i><i style="--k:1"></i><i style="--k:2"></i>'; rue.children[2].appendChild(ch);
    var cv = D.createElement('span'); cv.className = 'chevalet'; cv.textContent = 'Ouvert dès ' + C.ouverture + ' h'; rue.appendChild(cv);
    var halo = D.createElement('i'); halo.className = 'halo'; rue.appendChild(halo);
    var rev = D.createElement('i'); rev.className = 'reverbere'; rue.appendChild(rev);
  })();
  // Fluidité (13/11) : chaque variable est posée sur les seuls éléments qui la lisent, et seulement quand elle change.
  // Posées sur .j-colle, elles faisaient recalculer les styles de toute la scène (près de 300 éléments) à chaque image.
  var cibles = {
    nuit: $$('.c-nuit, .j-ciel .lune, .j-ciel .nuage, .imm-nuit, .halo', colle), soir: $$('.c-soir', colle),
    vitrine: $$('.boul .arc', colle), lampe: $$('.reverbere', colle), ax: $$('.astre', colle), ay: $$('.astre', colle)
  }, ecrit = {};
  function pose(k, v) { if (ecrit[k] === v) return; ecrit[k] = v; cibles[k].forEach(function (e) { e.style.setProperty('--' + k, v); }); }
  var jhH = $('.ho-h', jh), jhM = $('.ho-m', jh), jhDer = '';
  var MOMENTS = [0, .2, .42, .6, .82], CIBLES = [.05, .3, .5, .7, .95], momentOn = -1, pDer = -1;
  function heureDe(p) { return p < .16 ? 5.75 + p / .16 * 1.35 : 7.1 + (p - .16) / .84 * 14.1; }
  function majJour(y) {
    var top = G.jourTop - y; if (top > vh || top + G.jourH < 0) return;
    var p = borne(-top / (G.jourH - vh), 0, 1); if (Math.abs(p - pDer) < .0008) return; pDer = p;
    var h = heureDe(p), W = G.colleW, Hh = G.colleH;
    var matin = borne(1 - (h - 5.9) / 2.1, 0, 1), nuit2 = borne((h - 19.6) / 1.5, 0, 1) * .85, nuit = Math.max(matin, nuit2), soir = borne((h - 17) / 2.2, 0, 1) * (1 - nuit2 * .5);
    var t = (h - 6.3) / 14, taille = borne(W * .066, 58, 104);
    pose('nuit', nuit.toFixed(3)); pose('soir', soir.toFixed(3));
    pose('vitrine', Math.max(nuit, .5).toFixed(3)); pose('lampe', nuit > .3 ? '1' : '0');
    pose('ax', (W * (.03 + .94 * t) - taille / 2).toFixed(1) + 'px'); pose('ay', (Hh * (.72 - .56 * Math.sin(Math.PI * borne(t, 0, 1))) - taille / 2).toFixed(1) + 'px');
    var T = h * 3600, ah = (T / 120).toFixed(2) + 'deg', am = (T / 10).toFixed(2) + 'deg';
    if (am !== jhDer) { jhDer = am; jhH.style.setProperty('--a', ah); jhM.style.setProperty('--a', am); }
    fenetres.forEach(function (f) {
      var ouv = h > f.ouvre && h < f.ferme, lum = ouv && f.lampe && (h < f.ouvre + .9 && h < 8.4 || h > 18.7), e = (ouv ? 'o' : '') + (lum ? 'l' : '');
      if (e === f.etat) return; f.etat = e; f.el.classList.toggle('ouverte', ouv); f.el.classList.toggle('allumee', lum);
    });
    var m = 0; for (var i = 0; i < MOMENTS.length; i++) if (p >= MOMENTS[i]) m = i;
    if (m !== momentOn) { momentOn = m; cartes.forEach(function (c, i) { c.classList.toggle('on', i === m); }); reperes.forEach(function (b, i) { b.classList.toggle('on', i === m); b.setAttribute('aria-pressed', i === m ? 'true' : 'false'); }); }
  }
  reperes.forEach(function (b, i) { b.addEventListener('click', function () { var r = jour.getBoundingClientRect(); scrollTo({ top: scrollY + r.top + (r.height - vh) * CIBLES[i], behavior: calme ? 'auto' : 'smooth' }); }); });

  // ---------- la place : la semaine ----------
  var sem = $('#semaine'), ordre = [1, 2, 3, 4, 5, 6, 0];
  ordre.forEach(function (j) { var s = D.createElement('span'); s.className = 'jr' + (j === auj ? ' auj' : ''); s.title = JOURS[j]; s.innerHTML = '<b></b><i>....</i>'; s.firstChild.textContent = JOURS[j].charAt(0).toUpperCase(); sem.appendChild(s); });

  // ---------- un mot sur le mur ----------
  var mots = $('#mots'), champMot = $('#ec-mot');
  $('#ecrire').addEventListener('submit', function (e) {
    e.preventDefault();
    var t = champMot.value.replace(/\s+/g, ' ').trim().slice(0, 48) || champMot.placeholder;
    var n = D.createElement('p'), sc = D.createElement('i'); n.className = 'unmot'; sc.className = 'scotch';
    n.style.setProperty('--r', ((Math.random() - .5) * 9).toFixed(1) + 'deg'); n.appendChild(sc); n.appendChild(D.createTextNode(t));
    mots.insertBefore(n, mots.firstChild); while (mots.children.length > 5) mots.lastChild.remove();
    champMot.value = ''; toc();
  });

  // ---------- mon ticket ----------
  var donner = $('#cm-donner'), noteCm = $('#cm-note'), NOTE0 = noteCm.textContent;
  donner.addEventListener('click', function () {
    var tb = $('#ticket-b'); if (tb.classList.contains('tendu')) return;
    tb.classList.add('tendu'); zip();
    setTimeout(function () { tampons[1].classList.remove('pose'); void tampons[1].offsetWidth; tampons[1].classList.add('pose'); toc(); }, calme ? 0 : 420);
    donner.textContent = 'Ticket tendu';
    noteCm.textContent = 'C’est noté, pour la maquette. Sur votre vrai site, la boulangerie reçoit le ticket et met la baguette de côté.';
  });
  majBag(); majTicket(true);

  // ---------- menu du téléphone, ancres ----------
  var menu = $('#menu'), mbt = $('#menu-b');
  function fermer() { menu.classList.remove('ouvert'); mbt.setAttribute('aria-expanded', 'false'); mbt.textContent = 'Menu'; }
  mbt.addEventListener('click', function () { var o = menu.classList.toggle('ouvert'); mbt.setAttribute('aria-expanded', o ? 'true' : 'false'); mbt.textContent = o ? 'Fermer' : 'Menu'; });
  addEventListener('keydown', function (e) { if (e.key === 'Escape') fermer(); });
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var c = $(a.getAttribute('href')); if (!c) return; e.preventDefault(); fermer();
      var t = c.id === 'journee' || c.id === 'accueil' ? null : $('.tete', c), y = c.getBoundingClientRect().top + scrollY;
      if (t) y = t.getBoundingClientRect().top + scrollY - parseFloat(getComputedStyle(H).getPropertyValue('--barre')) - (innerHeight < 800 ? 18 : 34);
      scrollTo({ top: Math.max(0, y), behavior: calme ? 'auto' : 'smooth' });
    });
  });

  // ---------- apparitions ----------
  var io = new IntersectionObserver(function (en) { en.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('vu'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -8% 0px', threshold: .08 });
  $$('.revele').forEach(function (e) { io.observe(e); });

  // ---------- une seule boucle au défilement ----------
  // Fluidité (13/11) : les positions sont mesurées une fois (chargement, redimensionnement, polices, changement de taille
  // du contenu) et gardées en mémoire ; à chaque image on ne fait plus que des calculs et des écritures, aucune lecture.
  // offsetTop ignore les transformations : les apparitions en cours ne faussent pas les positions.
  function absTop(el) { var t = 0; while (el) { t += el.offsetTop; el = el.offsetParent; } return t; }
  function mesurer() {
    G.sec = sections.map(absTop);
    rangs.forEach(function (o) { o.top = absTop(o.el); o.h = o.el.offsetHeight; });
    G.jourTop = absTop(jour); G.jourH = jour.offsetHeight; G.colleW = colle.clientWidth; G.colleH = colle.clientHeight;
    G.meTop = absTop(meScene); G.meH = meScene.offsetHeight;
    dents.forEach(function (d) { d._top = absTop(d); d._h = d.offsetHeight; d._dx = ''; });
    cadres.forEach(function (c) { c._top = absTop(c); c._h = c.offsetHeight; });
    pDer = -1; meDer = -1;
  }
  var att = false, defile = false, sDer = '';
  function rendu() {
    att = false;
    var y = scrollY, n = 1;
    for (var i = 0; i < G.sec.length; i++) if (G.sec[i] - y < vh * .5) n = i + 1;
    servir(n);
    if (y < vh * 1.3 && !calme) { var sy = (y * .2).toFixed(1) + 'px'; if (sy !== sDer) { sDer = sy; hbag.style.setProperty('--sy', sy); hbag.style.setProperty('--sr', Math.min(16, y * .016).toFixed(2) + 'deg'); } }
    majRangs(y); majJour(y); majMetre(y);
    dents.forEach(function (d) {
      var top = d._top - y; if (top >= vh + 40 || top + d._h <= -40) return;
      var dx = ((top / vh - .5) * -46).toFixed(1) + 'px'; if (dx !== d._dx) { d._dx = dx; d.style.setProperty('--dx', dx); }
    });
    cadres.forEach(function (c) {
      var top = c._top - y; if (top > vh || top + c._h < 0) return;
      var k = borne((vh - top) / (vh + c._h), 0, 1);
      c.style.setProperty('--par', ((k - .5) * 9).toFixed(2) + '%');
      if (!c._main) c.style.setProperty('--rx', (-80 + k * 190).toFixed(1) + '%');
    });
  }
  function dem() { if (!att) { att = true; requestAnimationFrame(rendu); } if (!defile) { defile = true; annoncer('kazura-defile'); } }
  addEventListener('scroll', dem, { passive: true });
  addEventListener('resize', function () {
    var a = mb; mb = innerWidth < 760 ? .7 : 1; vh = innerHeight;
    rangs.forEach(function (o) { o.batir(); }); mesurer(); att = false; rendu(); if (a !== mb) $$('.brq').forEach(function (b) { b.classList.remove('on'); });
  });
  mesurer(); rendu();
  // le contenu change de hauteur (photos chargées, polices, mots collés, ticket) : on remesure
  if (window.ResizeObserver) new ResizeObserver(function () { mesurer(); dem(); }).observe($('main'));
  addEventListener('load', function () { mesurer(); dem(); });

  // ---------- les animations sans fin s'arrêtent hors de l'écran (et repartent avant d'y revenir) ----------
  if (window.IntersectionObserver) {
    var vigie = new IntersectionObserver(function (en) { en.forEach(function (e) { e.target.classList.toggle('hors', !e.isIntersecting); }); }, { rootMargin: '60% 0px 60% 0px' });
    sections.forEach(function (s) { vigie.observe(s); });
  }

  (D.fonts && D.fonts.ready ? D.fonts.ready : Promise.resolve()).then(function () { H.classList.add('pret'); annoncer('kazura-pret'); }, function () { annoncer('kazura-pret'); });
})();
