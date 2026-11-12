// Maison M&D : « Et avec ça ? ». La devanture, les rayons, le sac en papier, le comptoir.
// Aucune dépendance. Le mouvement joue toujours en entier ; mode calme seulement avec ?calme=1 (jamais d'après le réglage du système).
(function () {
  'use strict';
  var H = document.documentElement, C = window.CONTENU || {}, Q = new URLSearchParams(location.search);
  var calme = H.classList.contains('calme');
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var borne = function (x, a, b) { return x < a ? a : x > b ? b : x; };
  var lisse = function (x) { x = borne(x, 0, 1); return x * x * (3 - 2 * x); };
  var hasard = function (a, b) { return a + Math.random() * (b - a); };

  // ---------- couleur du store (bouton « Couleur » de la page Bonjour) ----------
  function palette(n) {
    var p = (C.palettes || {})[n]; if (!p) return;
    for (var k in p) if (k !== 'theme') H.style.setProperty('--' + k, p[k]);
    var m = $('meta[name=theme-color]'); if (m && p.theme) m.content = p.theme;
  }
  palette(Q.get('palette') || 'rouge');
  addEventListener('message', function (e) { if (e.data && e.data.type === 'kazura-couleur') palette(e.data.palette); });
  function annoncer(t) { try { if (parent !== window) parent.postMessage({ type: t }, '*'); } catch (e) {} }

  // ---------- les formes ----------
  function svg(nom) {
    var s = document.getElementById('i-' + nom);
    return '<svg viewBox="' + (s ? s.getAttribute('viewBox') : '0 0 10 10') + '" aria-hidden="true" focusable="false"><use href="#i-' + nom + '"/></svg>';
  }
  function garnir(r) { $$('.ic[data-i]', r).forEach(function (e) { if (!e.firstChild) e.innerHTML = svg(e.getAttribute('data-i')); }); }
  garnir(document);

  // ---------- les faits ----------
  if (C.telephoneLien) $$('[data-tel]').forEach(function (a) { a.href = 'tel:' + C.telephoneLien; });
  if (C.telephone) $$('[data-tel-texte]').forEach(function (a) { a.textContent = C.telephone; });
  if (C.carte) $$('[data-carte]').forEach(function (a) { a.href = C.carte; });

  // ---------- une seule boucle, qui dort dès que rien ne bouge ----------
  var taches = [], tourne = false, dernier = 0;
  function boucle(t) {
    var dt = Math.min(.05, (t - dernier) / 1000 || .016), encore = false; dernier = t;
    for (var i = 0; i < taches.length; i++) if (taches[i](dt, t)) encore = true;
    if (encore) requestAnimationFrame(boucle); else tourne = false;
  }
  function reveille() { if (!tourne) { tourne = true; dernier = performance.now(); requestAnimationFrame(boucle); } }

  // ---------- défilement doux fait à la main (ne dépend d'aucun réglage du système) ----------
  var glisse = null;
  function hauteurBarre() { return ($('#barre') || {}).offsetHeight || 58; }
  function allerA(el) {
    var y0 = scrollY, y1 = Math.max(0, Math.min(document.scrollingElement.scrollHeight - innerHeight, el.getBoundingClientRect().top + scrollY - hauteurBarre() + 2));
    if (calme) { scrollTo(0, y1); return; }
    var t0 = performance.now(), d = borne(Math.abs(y1 - y0) * .45, 420, 1100), moi = {};
    glisse = moi;
    (function pas(t) { if (glisse !== moi) return; var x = borne((t - t0) / d, 0, 1), k = x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; scrollTo(0, y0 + (y1 - y0) * k); if (x < 1) requestAnimationFrame(pas); })(t0);
  }
  ['wheel', 'touchstart', 'keydown'].forEach(function (ev) { addEventListener(ev, function () { glisse = null; }, { passive: true }); });
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]'); if (!a) return;
    var c = document.getElementById(a.getAttribute('href').slice(1)); if (!c) return;
    e.preventDefault(); fermerSac(); allerA(c);
  });

  // ---------- le son de la clochette (seulement sur un geste) ----------
  var audio = null;
  function ding(f, v) {
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === 'suspended') audio.resume();
      var t = audio.currentTime;
      [[f, .5, 1.5], [f * 2.76, .22, .9], [f * 5.4, .1, .45]].forEach(function (p) {
        var o = audio.createOscillator(), g = audio.createGain();
        o.type = 'sine'; o.frequency.value = p[0];
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(p[1] * (v || .22), t + .008); g.gain.exponentialRampToValueAtTime(0.0001, t + p[2]);
        o.connect(g); g.connect(audio.destination); o.start(t); o.stop(t + p[2] + .05);
      });
    } catch (e) {}
  }

  // ====================== LA DEVANTURE ======================
  var devanture = $('#haut'), enseigne = $('#enseigne'), lettres = $$('.lt', enseigne), lambrequin = $('#lambrequin');
  lettres.forEach(function (l, i) { l.style.setProperty('--k', i); });
  function poserStore() {
    var s = document.createElement('span'); lambrequin.textContent = ''; lambrequin.appendChild(s);
    var w = s.getBoundingClientRect().width || 60, n = Math.ceil(innerWidth / w) + 1, h = '';
    for (var i = 0; i < n; i++) h += '<span style="--n:' + i + '"></span>';
    lambrequin.innerHTML = h;
    var g = enseigne.getBoundingClientRect().left;
    lettres.forEach(function (l) { l.style.setProperty('--ox', (l.getBoundingClientRect().left - g).toFixed(1) + 'px'); });
  }
  poserStore();
  var reflet = { x: -500, cible: -500 };
  taches.push(function (dt) {
    var d = reflet.cible - reflet.x; if (Math.abs(d) < .5) return false;
    reflet.x += d * Math.min(1, dt * 5); enseigne.style.setProperty('--sx', reflet.x.toFixed(1) + 'px'); return true;
  });
  function balayer() { if (calme) return; reflet.x = -500; reflet.cible = innerWidth + 500; reveille(); }
  devanture.addEventListener('pointermove', function (e) { if (e.pointerType === 'touch') return; reflet.cible = e.clientX - enseigne.getBoundingClientRect().left; reveille(); });
  setInterval(function () { if (devanture.getBoundingClientRect().bottom > 100 && !document.hidden) balayer(); }, 6500);

  var porte = $('#porte'), clochette = $('.clochette', porte);
  function sonner(el, cl) { el.classList.remove(cl); void el.offsetWidth; el.classList.add(cl); }
  function pousser() {
    if (porte.classList.contains('ouvre')) return;
    porte.classList.add('ouvre'); sonner(clochette, 'sonne'); ding(1318);
    setTimeout(function () { allerA($('#bonjour')); }, calme ? 0 : 620);
    setTimeout(function () { porte.classList.remove('ouvre'); }, 2000);
  }
  porte.addEventListener('click', pousser);
  $('#pousser').addEventListener('click', pousser);

  // ====================== LE SAC ======================
  var sac = [], vus = {}, sacB = $('#sac-b'), sacP = $('#sac-p'), sacN = $('#sac-n');
  var PLURIEL = { 'une baguette': 'baguettes', 'une boule': 'boules', 'un pain long': 'pains longs', 'une tartelette': 'tartelettes', 'un éclair': 'éclairs', 'une religieuse': 'religieuses', 'un macaron': 'macarons', 'un bocal': 'bocaux', 'une conserve': 'conserves', 'une bouteille': 'bouteilles', 'un paquet': 'paquets', 'une pomme': 'pommes', 'une poire': 'poires', 'une orange': 'oranges', 'un citron': 'citrons', 'une tomate': 'tomates', 'une carotte': 'carottes', 'un poireau': 'poireaux', 'un potiron': 'potirons', 'un chou': 'choux', 'le journal': 'journaux' };
  function varsDe(el) {
    var cs = getComputedStyle(el), s = '';
    ['--c', '--c2', '--croute', '--croute-f', '--mie'].forEach(function (v) { var x = cs.getPropertyValue(v).trim(); if (x) s += v + ':' + x + ';'; });
    return s;
  }
  function phraseSac() {
    if (!sac.length) return 'Votre sac est encore vide. Dans chaque rayon, touchez ce qui vous fait envie.';
    var ordre = [], compte = {};
    sac.forEach(function (o) { if (!compte[o.nom]) { compte[o.nom] = 0; ordre.push(o.nom); } compte[o.nom]++; });
    var mots = ordre.map(function (n) { return compte[n] > 1 ? compte[n] + ' ' + (PLURIEL[n] || n) : n; });
    var reste = 0; if (mots.length > 5) { reste = mots.length - 4; mots = mots.slice(0, 4); mots.push('le reste'); }
    var fin = mots.length > 1 ? mots.slice(0, -1).join(', ') + ' et ' + mots[mots.length - 1] : mots[0];
    return 'Dans votre sac : ' + fin + '.';
  }
  function majSac() {
    sacN.textContent = sac.length; sacB.classList.toggle('plein', sac.length > 0);
    $('#sac-c').innerHTML = sac.slice(-18).map(function (o) { return '<span class="ic" style="' + o.style + '">' + svg(o.ic) + '</span>'; }).join('');
    $('#sac-v').hidden = sac.length > 0;
    $('#sac-r').innerHTML = (C.rayons || []).map(function (r) {
      var pris = vus[r.id] || sac.some(function (o) { return o.r === r.id; });
      return '<a href="#' + r.id + '"' + (pris ? ' class="fait"' : '') + '>' + r.court + '</a>';
    }).join('');
    var d = $('#gsac-dedans');
    d.innerHTML = sac.slice(-7).map(function (o, i) { return '<span class="ic" style="' + o.style + '--r:' + ((i * 37) % 30 - 15) + ';--k:' + (o.k || 1) + '">' + svg(o.ic) + '</span>'; }).join('');
    $('#sac-dit').textContent = phraseSac();
  }
  function fermerSac() { if (!sacP.hidden) { sacP.hidden = true; sacB.setAttribute('aria-expanded', 'false'); } }
  sacB.addEventListener('click', function (e) { e.stopPropagation(); sacP.hidden = !sacP.hidden; sacB.setAttribute('aria-expanded', String(!sacP.hidden)); });
  document.addEventListener('click', function (e) { if (!sacP.hidden && !e.target.closest('#sac-p')) fermerSac(); });
  addEventListener('keydown', function (e) { if (e.key === 'Escape') fermerSac(); });
  $('#sac-vider').addEventListener('click', function () { sac = []; majSac(); });

  var HAUTEUR = { baguette: 1, bouteille: .9, poireau: 1, carotte: .9, chou: .8, gaz: 1, bocal: .7, conserve: .6, paquet: .7, boule: .5, miche: .42, tarte: .5, eclair: .34, macaron: .4, pomme: .5, poire: .6, tomate: .46, potiron: .55, orange: .45, chouvert: .55, journal: .5 };
  function vole(depuis, vers, ic, style, fin) {
    var a = depuis.getBoundingClientRect(), b = vers.getBoundingClientRect();
    var v = document.createElement('span'); v.className = 'vol ic'; v.style.cssText = style || ''; v.innerHTML = svg(ic);
    var h = borne(a.height, 34, 130); v.style.setProperty('--h', h + 'px');
    document.body.appendChild(v);
    var x0 = a.left + a.width / 2, y0 = a.top + a.height / 2, x1 = b.left + b.width / 2, y1 = b.top + b.height / 2;
    var haut = Math.min(y0, y1) - 70 - Math.abs(x1 - x0) * .06, ech = borne(30 / h, .2, 1), cadres = [];
    for (var i = 0; i <= 14; i++) {
      var t = i / 14, x = x0 + (x1 - x0) * t, y = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * haut + t * t * y1;
      cadres.push({ transform: 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) translate(-50%,-50%) rotate(' + Math.round(t * 220) + 'deg) scale(' + (1 - t * (1 - ech)).toFixed(3) + ')' });
    }
    var an = v.animate(cadres, { duration: calme ? 1 : 640, easing: 'cubic-bezier(.45,0,.7,1)', fill: 'forwards' });
    an.onfinish = function () { v.remove(); if (fin) fin(); };
  }
  function dansLeSac(o) { sac.push(o); majSac(); sonner(sacB, 'saute'); }
  function prendre(b) {
    var o = { r: b.dataset.prend, nom: b.dataset.nom, ic: b.dataset.i, style: varsDe(b), k: HAUTEUR[b.dataset.i] || .6 };
    vole(b, sacB, o.ic, o.style, function () { dansLeSac(o); });
    sonner(b, 'pris');
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-prend]'); if (!b || b.closest('.glisse')) return;
    prendre(b);
  });

  // ====================== BONJOUR : le compteur, le journal, les enseignes ======================
  var cpt = $('#cpt'), cptFait = false;
  function compter() {
    if (cptFait) return; cptFait = true; if (calme) return;
    var n = +cpt.dataset.n, t0 = performance.now();
    (function p(t) { var x = borne((t - t0) / 1400, 0, 1); cpt.textContent = Math.round(n * (1 - Math.pow(1 - x, 3))); if (x < 1) requestAnimationFrame(p); })(t0);
  }

  // les enseignes qui pendent : un pendule par panneau, poussé par le défilement, la souris et le doigt
  var pendules = $$('.ens-p').map(function (el, i) { return { el: el, a: 0, w: 0, k: 34 + (i * 7) % 13, c: 1.5 + (i % 3) * .25, zone: el.closest('section'), max: 30 }; });
  var plaqueH = $('#horaires'); pendules.push({ el: plaqueH, a: 0, w: 0, k: 30, c: 2.2, zone: plaqueH.closest('section'), doux: .22, max: 6 });
  taches.push(function (dt) {
    var encore = false;
    pendules.forEach(function (p) {
      if (Math.abs(p.a) < .04 && Math.abs(p.w) < .4) { if (p.a !== 0) { p.a = 0; p.el.style.setProperty('--a', 0); } return; }
      p.w += (-p.k * p.a - p.c * p.w) * dt; p.a = borne(p.a + p.w * dt, -p.max, p.max); if (Math.abs(p.a) >= p.max) p.w *= -.3;
      p.el.style.setProperty('--a', p.a.toFixed(2)); encore = true;
    });
    return encore;
  });
  function souffle(force, zone) { if (calme) return; pendules.forEach(function (p, i) { if (zone && p.zone !== zone) return; p.w += force * (p.doux || 1) * (.55 + ((i * 53) % 10) / 14); }); reveille(); }
  $$('.ens').forEach(function (a, i) {
    var p = pendules[i];
    a.addEventListener('pointermove', function (e) { if (calme) return; p.w += borne(e.movementX || 0, -30, 30) * 2.2; reveille(); });
    a.addEventListener('pointerdown', function () { if (calme) return; p.w += (i % 2 ? -1 : 1) * 190; reveille(); });
  });
  plaqueH.addEventListener('pointerdown', function () { if (calme) return; pendules[pendules.length - 1].w += 90; reveille(); });

  // ====================== LE PAIN : la cuisson ======================
  function hex(c) { return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]; }
  function melange(a, b, t) { var x = hex(a), y = hex(b); return '#' + x.map(function (v, i) { return ('0' + Math.round(v + (y[i] - v) * t).toString(16)).slice(-2); }).join(''); }
  var CUISSON = [[0, '#f3dba0'], [.42, '#d9963f'], [.75, '#9b5a22'], [1, '#4a230d']];
  var jeuPain = $('#jeu-pain'), curseur = $('#cuisson'), painDit = $('#pain-dit');
  function cuire(parle) {
    var t = curseur.value / 100, c = CUISSON[CUISSON.length - 1][1];
    for (var i = 1; i < CUISSON.length; i++) if (t <= CUISSON[i][0]) { c = melange(CUISSON[i - 1][1], CUISSON[i][1], (t - CUISSON[i - 1][0]) / (CUISSON[i][0] - CUISSON[i - 1][0])); break; }
    jeuPain.style.setProperty('--croute', c);
    jeuPain.style.setProperty('--croute-f', melange(c, '#2a1206', .26));
    jeuPain.style.setProperty('--mie', melange(c, '#fff6da', .68 - t * .3));
    jeuPain.style.setProperty('--cuisson', t.toFixed(2));
    if (parle) painDit.textContent = t < .2 ? 'Pas trop cuite : toute blanche.' : t < .5 ? 'Juste dorée, comme il faut.' : t < .78 ? 'Bien cuite : ça croustille.' : t < .93 ? 'Très bien cuite, pour les amateurs.' : 'Là, c’est du charbon !';
  }
  curseur.addEventListener('input', function () { cuire(true); }); cuire(false);

  // ====================== LES GÂTEAUX : les bougies ======================
  var bougies = $('#bougies'), gatDit = $('#gat-dit'), TEINTES = ['#d63f2b', '#2a63b3', '#3f7d4e', '#f4b83a', '#e0569b'], nbB = 0, souffle2 = false;
  function planter(x) {
    if (souffle2) return;
    if (nbB >= 12) { gatDit.textContent = 'Douze bougies : il n’y a plus de place !'; return; }
    if (x == null) { // la place la plus libre
      var pris = $$('.bg', bougies).map(function (b) { return +b.dataset.x; }), mieux = 50, ecart = -1;
      for (var c = 6; c <= 94; c += 4) { var e = pris.length ? Math.min.apply(null, pris.map(function (p) { return Math.abs(p - c); })) : 100 - Math.abs(c - 50); if (e > ecart) { ecart = e; mieux = c; } }
      x = mieux;
    }
    var b = document.createElement('i'); b.className = 'bg'; b.dataset.x = x; b.style.setProperty('--x', x); b.style.setProperty('--c', TEINTES[nbB % TEINTES.length]);
    bougies.appendChild(b); nbB++;
    gatDit.textContent = nbB === 1 ? 'Une bougie. Encore ?' : nbB + ' bougies. Encore, ou on souffle ?';
  }
  $('#gateau').addEventListener('click', function (e) { var r = bougies.getBoundingClientRect(); planter(borne(Math.round((e.clientX - r.left) / r.width * 100), 4, 96)); });
  $('#bougie-plus').addEventListener('click', function () { planter(null); });
  $('#souffler').addEventListener('click', function () {
    if (souffle2) return;
    if (!nbB) { gatDit.textContent = 'Pas encore de bougie : touchez le gâteau.'; return; }
    souffle2 = true;
    $$('.bg', bougies).sort(function (a, b) { return a.dataset.x - b.dataset.x; }).forEach(function (b, i) { setTimeout(function () { b.classList.add('eteinte'); }, calme ? 0 : i * 70); });
    gatDit.textContent = 'Bon anniversaire !';
    setTimeout(function () { $$('.bg', bougies).forEach(function (b) { b.classList.add('part'); }); }, 1900);
    setTimeout(function () { bougies.textContent = ''; nbB = 0; souffle2 = false; gatDit.textContent = 'On recommence ? Touchez le gâteau.'; }, 2500);
  });

  (function () {
    var f = $('#fanions'), T = ['var(--store)', 'var(--jaune)', 'var(--nuit)', '#fffaf0', 'var(--vert)'], h = '<path d="M4 8Q300 130 596 8" fill="none" stroke="var(--encre)" stroke-width="5" stroke-linecap="round"/>';
    for (var i = 0; i < 11; i++) {
      var t = .06 + i * .088, x = 4 + 592 * t, y = 8 + 244 * t * (1 - t), pente = Math.atan2(244 * (1 - 2 * t), 592) * 180 / Math.PI;
      h += '<g transform="translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ') rotate(' + pente.toFixed(1) + ')"><polygon points="-24,0 24,0 0,50" fill="' + T[i % 5] + '" style="--n:' + i + '"/></g>';
    }
    f.innerHTML = h;
  })();

  // ====================== LE TRAITEUR : la table ======================
  var convives = 8, tHaut = $('#tbl-haut'), tBas = $('#tbl-bas'), nappe = $('#tbl-nappe'), table = $('#table'), zoneT = $('#tbl-zone'), PLATS = ['cloche', 'tourte', 'salade'];
  function regler(r, n) { while (r.children.length < n) { var a = document.createElement('i'); a.className = 'ass'; r.appendChild(a); } while (r.children.length > n) r.removeChild(r.lastChild); }
  function dresser(parle) {
    var h = Math.ceil(convives / 2), b = Math.floor(convives / 2), plats = borne(Math.round(convives / 5), 1, 7);
    regler(tHaut, h); regler(tBas, b);
    while (nappe.children.length < plats) { var p = document.createElement('span'); p.className = 'ic'; p.innerHTML = svg(PLATS[nappe.children.length % 3]); nappe.appendChild(p); }
    while (nappe.children.length > plats) nappe.removeChild(nappe.lastChild);
    table.style.setProperty('--places', h);
    var pas = parseFloat(getComputedStyle(table).getPropertyValue('--pas')) || 84, l = h * pas + 44;
    table.style.setProperty('--ech', Math.min(1.45, (zoneT.clientWidth - 8) / l, (zoneT.clientHeight - 8) / (table.offsetHeight || 300)).toFixed(3));
    $('#conv-n').textContent = convives;
    $('#table-dit').textContent = convives <= 4 ? 'Un repas à quelques-uns.' : convives <= 10 ? 'Une belle tablée.' : convives <= 20 ? 'Une fête de famille.' : convives <= 34 ? 'Une grande fête.' : 'Tout le village, ou presque !';
    if (parle) vus.traiteur = true;
  }
  function tenir(b, d) {
    var t = null, r = null;
    function un() { var n = borne(convives + d, 2, 40); if (n !== convives) { convives = n; dresser(true); } }
    function stop() { clearTimeout(t); clearInterval(r); }
    b.addEventListener('pointerdown', function () { un(); stop(); t = setTimeout(function () { r = setInterval(un, 110); }, 380); });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) { b.addEventListener(ev, stop); });
    b.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); un(); } });
  }
  tenir($('#conv-plus'), 1); tenir($('#conv-moins'), -1); dresser(false);

  // ====================== L'ÉPICERIE : les étagères qu'on fait glisser ======================
  var PROD = [['bocal', 'un bocal', '#d63f2b', '#f4b83a', .8], ['conserve', 'une conserve', '#3f7d4e', '', .62], ['bouteille', 'une bouteille', '#2a63b3', '#f4b83a', 1], ['paquet', 'un paquet', '#f4b83a', '#1b2a41', .78], ['bocal', 'un bocal', '#e8a13a', '#d63f2b', .66], ['bouteille', 'une bouteille', '#7a2e22', '#1b2a41', .94], ['conserve', 'une conserve', '#d63f2b', '', .56], ['paquet', 'un paquet', '#f29c94', '#a52a1b', .7], ['bocal', 'un bocal', '#6aa85a', '#fffaf0', .74], ['bouteille', 'une bouteille', '#e9dfc8', '#d63f2b', .88], ['conserve', 'une conserve', '#2a63b3', '', .6], ['paquet', 'un paquet', '#3f7d4e', '#fffaf0', .82], ['bocal', 'un bocal', '#8a4b9a', '#f4b83a', .6], ['bouteille', 'une bouteille', '#2f8257', '#f4b83a', .98]];
  var epi = $('#jeu-epi'), rangs = [$('#epi-1'), $('#epi-2')], ep = { x: 0, v: 0, pen: 0, tenu: false, larg: [1, 1], vu: false };
  function produit(p, i) { return '<button class="pr" type="button" data-prend="epicerie" data-nom="' + p[1] + '" data-i="' + p[0] + '" style="--c:' + p[2] + ';' + (p[3] ? '--c2:' + p[3] + ';' : '') + '--k:' + p[4] + ';--s:' + (i % 2 ? 1 : -.8) + '"><span class="ic">' + svg(p[0]) + '</span></button>'; }
  function garnirEtageres() {
    rangs.forEach(function (r, n) {
      var liste = n ? PROD.slice(6).concat(PROD.slice(0, 6)).reverse() : PROD, un = liste.map(produit).join('');
      r.innerHTML = un;
      var ecart = parseFloat(getComputedStyle(r).columnGap) || 20, l = r.scrollWidth + ecart, copies = Math.ceil(innerWidth / l) + 2, tout = '';
      for (var i = 0; i < copies; i++) tout += un;
      r.innerHTML = tout; ep.larg[n] = l;
    });
    placerEtageres();
  }
  function placerEtageres() {
    var a = ((ep.x % ep.larg[0]) + ep.larg[0]) % ep.larg[0], b = (((-ep.x * .7) % ep.larg[1]) + ep.larg[1]) % ep.larg[1];
    rangs[0].style.transform = 'translate3d(' + (-a).toFixed(1) + 'px,0,0)';
    rangs[1].style.transform = 'translate3d(' + (-b).toFixed(1) + 'px,0,0)';
    epi.style.setProperty('--pen', ep.pen.toFixed(2));
  }
  taches.push(function (dt) {
    if (!ep.vu) return false;
    if (!ep.tenu) { ep.x += ep.v * dt; ep.v += ((calme ? 0 : 26) - ep.v) * Math.min(1, dt * 1.6); }
    var cible = borne(-(ep.v - 26) * .022, -15, 15); ep.pen += (cible - ep.pen) * Math.min(1, dt * 9);
    placerEtageres(); return !calme || Math.abs(ep.v) > 1;
  });
  (function () {
    var x0 = 0, xd = 0, td = 0, bouge = 0, id = null;
    epi.addEventListener('pointerdown', function (e) { id = e.pointerId; x0 = xd = e.clientX; td = e.timeStamp; bouge = 0; ep.tenu = true; ep.v = 0; epi.classList.remove('glisse'); });
    addEventListener('pointermove', function (e) {
      if (!ep.tenu || e.pointerId !== id) return;
      var dx = e.clientX - xd, dt = Math.max(1, e.timeStamp - td) / 1000; xd = e.clientX; td = e.timeStamp; bouge += Math.abs(dx);
      if (bouge > 8) epi.classList.add('glisse');
      ep.x -= dx; ep.v = ep.v * .6 + (-dx / dt) * .4; reveille();
    }, { passive: true });
    function lache(e) { if (!ep.tenu || (e && e.pointerId !== id)) return; ep.tenu = false; ep.v = borne(ep.v, -2600, 2600); setTimeout(function () { epi.classList.remove('glisse'); }, 60); reveille(); }
    addEventListener('pointerup', lache); addEventListener('pointercancel', lache);
    epi.addEventListener('dragstart', function (e) { e.preventDefault(); });
  })();

  // ====================== FRUITS ET LÉGUMES : la balance ======================
  var CAGETTES = [
    [['pomme', 'une pomme', '#d63f2b', 150, .62], ['poire', 'une poire', '#c9c545', 170, .74], ['pomme', 'une pomme', '#9cc043', 150, .6], ['orange', 'une orange', '#f4a53a', 140, .56], ['pomme', 'une pomme', '#e8813a', 150, .64]],
    [['tomate', 'une tomate', '#e0452f', 120, .56], ['carotte', 'une carotte', '', 80, 1], ['poireau', 'un poireau', '', 200, 1.1], ['carotte', 'une carotte', '', 80, .92], ['tomate', 'une tomate', '#e0452f', 120, .52]],
    [['potiron', 'un potiron', '', 900, .8], ['chouvert', 'un chou', '', 700, .72], ['orange', 'un citron', '#f1d23b', 90, .46], ['potiron', 'un potiron', '', 900, .7]],
  ];
  var cag = $('#cagettes'), tas = $('#tas'), plateau = $('#plateau'), aiguille = $('#aiguille'), poidsEl = $('#poids'), balDit = $('#bal-dit');
  var bal = { total: 0, vu: 0, ang: -72, w: 0, cible: -72, sur: [] };
  cag.innerHTML = CAGETTES.map(function (c, n) {
    return '<div class="cag" style="--n:' + n + '">' + c.map(function (f) { return '<button class="fl" type="button" data-fruit="' + f[1] + '" data-i="' + f[0] + '" data-g="' + f[3] + '" style="' + (f[2] ? '--c:' + f[2] + ';' : '') + '--k:' + f[4] + '"><span class="ic">' + svg(f[0]) + '</span></button>'; }).join('') + '</div>';
  }).join('');
  function ecrirePoids(g) { return g < 1000 ? Math.round(g) + ' g' : (Math.round(g / 10) / 100).toFixed(2).replace('.', ',') + ' kg'; }
  taches.push(function (dt) {
    var d = bal.cible - bal.ang, bouge = Math.abs(d) > .05 || Math.abs(bal.w) > .5 || Math.abs(bal.total - bal.vu) > .5;
    if (!bouge) return false;
    bal.w += (150 * d - 9 * bal.w) * dt; bal.ang += bal.w * dt;
    bal.vu += (bal.total - bal.vu) * Math.min(1, dt * 7); if (Math.abs(bal.total - bal.vu) < 1) bal.vu = bal.total;
    aiguille.style.setProperty('--ang', bal.ang.toFixed(2)); poidsEl.textContent = ecrirePoids(bal.vu);
    return true;
  });
  function peser() {
    bal.cible = -72 + 144 * Math.min(bal.total, 2000) / 2000;
    plateau.style.setProperty('--enf', (Math.min(bal.total, 2000) / 2000 * 10).toFixed(1));
    balDit.textContent = !bal.total ? 'Touchez un fruit ou un légume.' : bal.total < 500 ? 'Un petit creux.' : bal.total < 1200 ? 'De quoi faire une bonne soupe.' : bal.total < 2000 ? 'Un beau panier.' : 'Deux kilos : l’aiguille est au bout !';
    if (calme) { bal.ang = bal.cible; bal.vu = bal.total; aiguille.style.setProperty('--ang', bal.ang); poidsEl.textContent = ecrirePoids(bal.total); } else reveille();
  }
  cag.addEventListener('click', function (e) {
    var b = e.target.closest('.fl'); if (!b) return;
    var g = +b.dataset.g;
    if (bal.total + g > 2700) { sonner(plateau, 'plein'); balDit.textContent = 'Le plateau déborde : videz-le, ou mettez tout dans le sac.'; return; }
    var o = { r: 'primeurs', nom: b.dataset.fruit, ic: b.dataset.i, style: varsDe(b), k: HAUTEUR[b.dataset.i] || .5, g: g };
    sonner(b, 'pris');
    vole(b, plateau, o.ic, o.style, function () {
      bal.sur.push(o); bal.total += g;
      var s = document.createElement('span'); s.className = 'ic'; s.style.cssText = o.style + '--x:' + (12 + ((bal.sur.length * 29) % 76)) + ';--r:' + (((bal.sur.length * 47) % 50) - 25) + ';--k:' + o.k; s.innerHTML = svg(o.ic); tas.appendChild(s);
      bal.w += 260; peser();
    });
  });
  $('#bal-vider').addEventListener('click', function () { bal.sur = []; bal.total = 0; tas.textContent = ''; peser(); });
  $('#bal-sac').addEventListener('click', function () {
    if (!bal.sur.length) { balDit.textContent = 'Rien sur le plateau pour l’instant.'; return; }
    var lot = bal.sur.slice(), petits = $$('.ic', tas);
    lot.forEach(function (o, i) { setTimeout(function () { var el = petits[i] || plateau; vole(el, sacB, o.ic, o.style, function () { dansLeSac(o); }); if (petits[i]) petits[i].style.visibility = 'hidden'; }, calme ? 0 : i * 90); });
    setTimeout(function () { tas.textContent = ''; }, lot.length * 90 + 100);
    bal.sur = []; bal.total = 0; peser(); balDit.textContent = 'C’est pesé, c’est dans le sac.';
  });

  // ====================== LE GAZ ET LE JOURNAL ======================
  var gazDit = $('#gaz-dit'), GAZ = ['Bien lourde, celle-là.', 'Celle-ci ne rentre pas dans le sac !', 'Clong.', 'Pleine, on dirait.'], nGaz = 0;
  $$('[data-gaz]').forEach(function (b) { b.addEventListener('click', function () { sonner(b, 'balance'); gazDit.textContent = GAZ[nGaz++ % GAZ.length]; vus.gaz = true; majSac(); ding(196, .16); }); });

  var anneau = $('#anneau'), tq = $('#tourniquet'), TITRES = ['#1b2a41', '#d63f2b', '#2a63b3', '#3f7d4e', '#7a2e22', '#40566b'], rot = { a: -12, v: 16, tenu: false, vu: false };
  anneau.innerHTML = TITRES.map(function (c, i) { return '<span class="tq-j" style="--n:' + i + ';--c:' + c + '"><i class="m"></i><i class="h"></i><i class="p"></i><i class="l"></i><i class="l"></i><i class="l c"></i></span>'; }).join('');
  taches.push(function (dt) {
    if (!rot.vu) return false;
    if (!rot.tenu) { rot.a += rot.v * dt; rot.v += ((calme ? 0 : 16) - rot.v) * Math.min(1, dt * 1.2); }
    anneau.style.setProperty('--rot', rot.a.toFixed(2)); return !calme || Math.abs(rot.v) > 1;
  });
  (function () {
    var xd = 0, td = 0, bouge = 0, id = null;
    tq.addEventListener('pointerdown', function (e) { id = e.pointerId; xd = e.clientX; td = e.timeStamp; bouge = 0; rot.tenu = true; rot.v = 0; });
    addEventListener('pointermove', function (e) {
      if (!rot.tenu || e.pointerId !== id) return;
      var dx = e.clientX - xd, dt = Math.max(1, e.timeStamp - td) / 1000; xd = e.clientX; td = e.timeStamp; bouge += Math.abs(dx);
      rot.a += dx * .7; rot.v = rot.v * .5 + (dx * .7 / dt) * .5; reveille();
    }, { passive: true });
    function lache(e) {
      if (!rot.tenu || (e && e.pointerId !== id)) return; rot.tenu = false; rot.v = borne(rot.v, -900, 900); reveille();
      if (bouge < 8 && e && e.type === 'pointerup') { // une simple tape : on prend le journal de devant
        var n = ((Math.round(-rot.a / 60) % 6) + 6) % 6, o = { r: 'journaux', nom: 'le journal', ic: 'journal', style: '--c:' + TITRES[n] + ';', k: .5 };
        vole($$('.tq-j', anneau)[n] || tq, sacB, 'journal', o.style, function () { dansLeSac(o); });
      }
    }
    addEventListener('pointerup', lache); addEventListener('pointercancel', lache);
  })();

  // ====================== LE COMPTOIR ======================
  var sonnette = $('#sonnette'), arrive = $('#arrive'), tArr = null;
  sonnette.addEventListener('click', function () {
    sonner(sonnette, 'tape'); ding(2093, .2); setTimeout(function () { ding(2093, .16); }, 170);
    arrive.classList.add('la'); clearTimeout(tArr); tArr = setTimeout(function () { arrive.classList.remove('la'); }, 2200);
  });

  // ====================== LE VILLAGE : les fenêtres qui se rallument ======================
  var villageEl = $('#village');
  function batirVillage() {
    var W = villageEl.clientWidth, u = villageEl.clientHeight / 200, g = 11, h = '', tot = 0, el = [];
    function r() { g = (g * 16807) % 2147483647; return g / 2147483647; }
    while (tot < W + 200 * u) { var w = (64 + r() * 60) * u, arbre = r() < .16; if (arbre) w = (44 + r() * 20) * u; el.push({ w: w, h: 36 + r() * 26, t: 26 + r() * 22, arbre: arbre, a: r(), b: r(), c: r() }); tot += w; }
    var mil = Math.floor(el.length / 2); el[mil] = { boutique: true, w: Math.max(150, 230 * u) }; if (el[mil - 2]) el[mil - 2] = { eglise: true, w: 96 * u };
    if (el[mil - 1]) el[mil - 1].arbre = false; if (el[mil + 1]) el[mil + 1].arbre = false;
    el.forEach(function (m) {
      if (m.boutique) h += '<div class="bq" style="--w:' + m.w.toFixed(0) + '"><b>M<i>&amp;</i>D</b><span class="bq-store"></span><span class="bq-bas"><i></i><i class="bq-porte"></i><i></i></span></div>';
      else if (m.eglise) h += '<div class="mz eg" style="--w:' + m.w.toFixed(0) + ';--h:100"></div>';
      else if (m.arbre) h += '<div class="ab" style="--w:' + m.w.toFixed(0) + ';--h:' + (30 + m.a * 22).toFixed(0) + '"></div>';
      else h += '<div class="mz" style="--w:' + m.w.toFixed(0) + ';--h:' + m.h.toFixed(0) + ';--t:' + m.t.toFixed(0) + '%"><i class="fn" style="left:' + (16 + m.a * 14).toFixed(0) + '%;--d:' + (1.2 + m.b * 3.4).toFixed(2) + 's"></i>' + (m.c > .35 ? '<i class="fn" style="left:' + (58 + m.b * 14).toFixed(0) + '%;--d:' + (1.4 + m.c * 3.6).toFixed(2) + 's"></i>' : '') + '</div>';
    });
    villageEl.innerHTML = h;
  }
  batirVillage();

  // ====================== « Et avec ça ? » : les bandes qui glissent avec le défilement ======================
  var bandes = $$('.etavec').map(function (b, i) {
    var f = document.createElement('div'); f.className = 'ea-file';
    var un = '<span>' + b.dataset.mots + '</span><i>&amp;</i>', n = Math.ceil((innerWidth + 900) / Math.max(260, b.dataset.mots.length * 22)) + 2, h = '';
    for (var k = 0; k < n; k++) h += un;
    f.innerHTML = h; b.appendChild(f);
    return { el: b, f: f, sens: i % 2 ? 1 : -1 };
  });

  // ====================== ce qui suit le défilement ======================
  var journal = $('#journal'), photos = $$('[data-para]'), attente = false, dernierY = scrollY, premier = true;
  function suivre() {
    attente = false;
    var vh = innerHeight, y = scrollY, dy = y - dernierY; dernierY = y;
    var rj = journal.getBoundingClientRect(), mb = bandes.map(function (b) { return b.el.getBoundingClientRect(); }), mp = photos.map(function (p) { return p.getBoundingClientRect(); });
    journal.style.setProperty('--pli', calme ? 0 : (1 - lisse((vh * .9 - rj.top) / (vh * .52))).toFixed(3));
    bandes.forEach(function (b, i) { var r = mb[i]; if (r.bottom < -50 || r.top > vh + 50) return; b.f.style.transform = 'translate3d(' + (b.sens * (vh - r.top) * .42 - (b.sens > 0 ? 620 : 40)).toFixed(1) + 'px,0,0)'; });
    if (!calme) photos.forEach(function (p, i) { var r = mp[i]; if (r.bottom < -80 || r.top > vh + 80) return; p.style.setProperty('--py', (((r.top + r.height / 2) - vh / 2) / vh * +p.dataset.para).toFixed(1)); });
    if (y < vh * 1.2) devanture.style.setProperty('--ref', (y * .7).toFixed(0));
    if (dy && !calme) { var f = borne(dy, -50, 50) * .9; pendules.forEach(function (p) { var r = p.el.getBoundingClientRect(); if (r.bottom > 0 && r.top < vh) p.w += f * (p.doux || 1) * (.5 + (p.k % 7) / 9); }); reveille(); }
    if (dy && premier) { premier = false; annoncer('kazura-defile'); }
  }
  function demander() { if (!attente) { attente = true; requestAnimationFrame(suivre); } }
  addEventListener('scroll', demander, { passive: true });

  // ====================== entrées de section, lien courant, veille ======================
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      var s = e.target; s.classList.add('vu'); io.unobserve(s);
      if (s.id === 'bonjour') { compter(); setTimeout(function () { souffle(150, s); }, 250); }
      if (s.id === 'horaires') setTimeout(function () { souffle(130, s.closest('section')); }, 200);
      if (s.id === 'jeu-gateau' && !calme) [22, 50, 78].forEach(function (x, i) { setTimeout(function () { if (!nbB || i) planter(x); }, 1500 + i * 220); });
    });
  }, { rootMargin: '0px 0px -22% 0px' });
  $$('[data-vu]').forEach(function (s) { io.observe(s); });
  var ioVillage = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { villageEl.classList.add('vu'); ioVillage.disconnect(); } }); }, { rootMargin: '0px 0px -8% 0px' });
  ioVillage.observe(villageEl);

  var liens = $$('.liens a'), cibles = liens.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); });
  var ioVeille = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      e.target.classList.toggle('la', e.isIntersecting);
      if (e.target.id === 'epicerie') { ep.vu = e.isIntersecting; if (ep.vu) reveille(); }
      if (e.target.id === 'gaz-journaux') { rot.vu = e.isIntersecting; if (rot.vu) reveille(); }
    });
  }, { rootMargin: '80px 0px 80px 0px' });
  $$('main > section').forEach(function (s) { ioVeille.observe(s); });
  var ioLien = new IntersectionObserver(function (es) {
    es.forEach(function (e) { var i = cibles.indexOf(e.target); if (i >= 0) liens[i].classList.toggle('ici', e.isIntersecting); });
  }, { rootMargin: '-45% 0px -50% 0px' });
  cibles.forEach(function (c) { if (c) ioLien.observe(c); });

  // ====================== départ ======================
  var tR = null;
  addEventListener('resize', function () { clearTimeout(tR); tR = setTimeout(function () { poserStore(); garnirEtageres(); batirVillage(); if (villageEl.classList.contains('vu')) villageEl.classList.add('vu'); dresser(false); demander(); }, 180); });
  function pret() {
    if (H.classList.contains('pret')) return;
    H.classList.add('pret'); poserStore(); garnirEtageres(); dresser(false); majSac(); suivre();
    setTimeout(balayer, 1500); annoncer('kazura-pret');
  }
  majSac();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { setTimeout(pret, 60); });
  setTimeout(pret, 1200);
})();
