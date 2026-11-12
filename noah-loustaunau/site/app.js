/* Noah Loustaunau : « De la cime à la pelouse ».
   Le site ne lit jamais le réglage « moins de mouvement » du système : tout bouge toujours.
   Mode calme seulement sur demande, avec ?calme=1 (classe calme sur html). */
(function () {
  'use strict';
  var C = window.CONTENU || {};
  var H = document.documentElement;
  var calme = H.classList.contains('calme');
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var borne = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var graine = 7;
  function alea() { graine = (graine * 16807) % 2147483647; return (graine - 1) / 2147483646; }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }

  /* ---------- Éclats : copeaux, sciure, feuilles, brins d'herbe (une seule toile, qui s'arrête dès qu'elle est vide) ---------- */
  var toile = $('#eclats'), ctx = toile.getContext('2d'), P = [], actif = false, dpr = Math.min(2, window.devicePixelRatio || 1);
  function tailleToile() { toile.width = Math.round(innerWidth * dpr); toile.height = Math.round(innerHeight * dpr); }
  function eclats(x, y, n, couleurs, o) {
    if (calme) return;
    o = o || {};
    for (var i = 0; i < n; i++) {
      P.push({ x: x + (Math.random() - .5) * (o.large || 10), y: y, vx: (Math.random() - .5) * (o.vx || 7), vy: -Math.random() * (o.vy || 6) - (o.vy0 || 0),
        g: o.g || .4, r: Math.random() * 6.28, vr: (Math.random() - .5) * .5, s: (o.s || 7) * (.6 + Math.random() * .8),
        c: couleurs[(Math.random() * couleurs.length) | 0], v: 1, f: o.f || .014, feuille: o.forme === 'feuille' });
    }
    if (P.length > 300) P.splice(0, P.length - 300);
    if (!actif) { actif = true; requestAnimationFrame(boucleEclats); }
  }
  function boucleEclats() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (var i = P.length - 1; i >= 0; i--) {
      var p = P[i];
      p.vy += p.g; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.v -= p.f;
      if (p.feuille) { p.vx += Math.sin(p.r) * .12; p.vy *= .97; }
      if (p.v <= 0 || p.y > innerHeight + 30) { P.splice(i, 1); continue; }
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.globalAlpha = Math.min(1, p.v * 2.4); ctx.fillStyle = p.c;
      if (p.feuille) { ctx.beginPath(); ctx.moveTo(-p.s, 0); ctx.quadraticCurveTo(0, -p.s * .9, p.s, 0); ctx.quadraticCurveTo(0, p.s * .9, -p.s, 0); ctx.fill(); }
      else ctx.fillRect(-p.s / 2, -p.s * .22, p.s, p.s * .44);
      ctx.restore();
    }
    if (P.length) requestAnimationFrame(boucleEclats); else { actif = false; ctx.clearRect(0, 0, innerWidth, innerHeight); }
  }
  var F = null;
  function teintes() {
    if (!F) { var s = getComputedStyle(H); F = ['--f1', '--f2', '--f3', '--f4'].map(function (n) { return s.getPropertyValue(n).trim(); }); }
    return F;
  }
  var BOIS = ['#ecd2a0', '#dbb27a', '#f5edd9'];
  function milieu(e) { var r = e.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }

  /* ---------- Les arbres dessinés ---------- */
  function planter(racine, blobs, branches) {
    racine.appendChild(el('i', 'tronc'));
    for (var b = 1; b <= branches; b++) racine.appendChild(el('i', 'branche b' + b));
    blobs.forEach(function (b, n) {
      var marque = b[4] === 'm', auto = b[4] === 'a';
      var e = el(marque ? 'button' : 'span', 'feu' + (marque ? ' marque' : '') + (auto ? ' auto' : ''));
      if (marque) { e.type = 'button'; e.setAttribute('aria-label', 'Couper cette branche'); }
      e.style.cssText = '--x:' + b[0] + ';--y:' + b[1] + ';--d:' + b[2] + ';--fc:var(--f' + b[3] + ');--t:' + (4.5 + alea() * 4).toFixed(1) + 's;--dl:-' + (alea() * 4).toFixed(1) +
        's;--ex:' + Math.round((b[0] - 50) * 3.4) + 'px;--ey:' + Math.round((b[1] - 46) * 2.6 - 40) + 'px;--k:' + Math.round(5 + alea() * 15) + 'px;--n:' + n;
      e.appendChild(el('i'));
      racine.appendChild(e);
    });
  }

  /* ---------- 1. La cime : l'arbre se taille à l'arrivée, puis on coupe les branches marquées ---------- */
  var cime = $('#cime'), arbre = $('#arbre');
  planter(arbre, [
    [50, 38, 46, 2], [32, 44, 34, 1], [68, 42, 36, 1], [41, 26, 32, 3], [61, 24, 30, 3], [50, 51, 30, 1], [25, 33, 24, 2], [76, 31, 24, 2], [50, 16, 22, 4], [36, 37, 17, 4], [65, 35, 15, 4],
    [14, 47, 18, 3, 'm'], [87, 46, 17, 3, 'm'], [22, 19, 16, 2, 'm'], [80, 17, 15, 2, 'm'], [53, 6, 14, 3, 'm'],
    [6, 31, 13, 4, 'a'], [94, 30, 12, 4, 'a'], [35, 8, 12, 4, 'a']
  ], 2);
  $$('#titre .ligne').forEach(function (l, li) {
    var t = l.textContent; l.textContent = '';
    t.split('').forEach(function (ch, i) { var s = el('span', 'lt'); s.textContent = ch; s.style.setProperty('--i', li * 4 + i); s.setAttribute('aria-hidden', 'true'); l.appendChild(s); });
  });
  (function () {
    var boite = $('#chutes');
    for (var i = 0; i < 11; i++) {
      var c = el('i', 'chute');
      c.style.cssText = '--x:' + (4 + alea() * 92).toFixed(1) + ';--s:' + Math.round(18 + alea() * 20) + 'px;--t:' + (9 + alea() * 8).toFixed(1) + 's;--dl:-' + (alea() * 16).toFixed(1) + 's;--dx:' + Math.round(alea() * 140 - 70) + 'px;--fc:var(--f' + (2 + (i % 3)) + ')';
      boite.appendChild(c);
    }
  })();
  var marques = $$('.feu.marque', arbre), autos = $$('.feu.auto', arbre), reste = marques.length;
  var tailleTexte = $('#taille-texte'), repousser = $('#repousser');
  function couper(e) {
    if (e.classList.contains('coupe')) return false;
    var m = milieu(e);
    e.style.setProperty('--dx', ((m[0] < innerWidth * .7 ? -1 : 1) * (30 + Math.random() * 110)).toFixed(0) + 'px');
    e.style.setProperty('--r', ((Math.random() < .5 ? -1 : 1) * (70 + Math.random() * 130)).toFixed(0) + 'deg');
    e.classList.remove('repousse'); e.classList.add('coupe');
    eclats(m[0], m[1], 12, teintes(), { forme: 'feuille', s: 9, vx: 11, vy: 7 });
    eclats(m[0], m[1], 7, BOIS, { s: 7, vx: 8, vy: 6 });
    return true;
  }
  function majTaille() {
    if (reste > 0) tailleTexte.textContent = reste === marques.length ? 'Les branches marquées à l’orange sont de trop : touchez-les.' : (reste === 1 ? 'Encore une branche marquée.' : 'Encore ' + reste + ' branches marquées.');
    else tailleTexte.textContent = 'Taille terminée. Le reste peut pousser.';
    repousser.hidden = reste > 0;
  }
  autos.forEach(function (e, i) { setTimeout(function () { couper(e); }, calme ? 0 : 1700 + i * 480); });
  marques.forEach(function (e) {
    e.addEventListener('click', function () { if (couper(e)) { e.disabled = true; reste--; majTaille(); } });
  });
  repousser.addEventListener('click', function () {
    marques.concat(autos).forEach(function (e) { e.classList.remove('coupe'); e.classList.add('repousse'); e.disabled = false; });
    reste = marques.length; majTaille();
    setTimeout(function () { marques.concat(autos).forEach(function (e) { e.classList.remove('repousse'); }); }, 2800);
  });
  majTaille();
  var sourisVue = false, sx = 0, sy = 0;
  cime.addEventListener('pointermove', function (e) {
    if (calme || e.pointerType === 'touch') return;
    var r = cime.getBoundingClientRect(); sx = (e.clientX - r.left) / r.width * 2 - 1; sy = (e.clientY - r.top) / r.height * 2 - 1;
    if (!sourisVue) { sourisVue = true; requestAnimationFrame(function () { sourisVue = false; arbre.style.setProperty('--mx', sx.toFixed(3)); arbre.style.setProperty('--my', sy.toFixed(3)); }); }
  });

  /* ---------- 3. Élagage : le défilement fait aller la scie ---------- */
  var sec3 = $('#elagage'), piste = $('#scie-piste'), scene = $('#scie-scene'), bois = $('#bois'), scie = $('#scie'), pont = $('#pont'), brg = $('#br-g'), indice = $('#scie-indice');
  (function () {
    var d = '', N = 24, pas = 398 / N;
    for (var i = 0; i < N; i++) { var x0 = 150 + i * pas, y0 = 118 - 26 * i / N; d += 'M' + x0.toFixed(1) + ' ' + (y0 - 2).toFixed(1) + 'L' + (x0 + pas * .22).toFixed(1) + ' ' + (y0 + 13).toFixed(1) + 'L' + (x0 + pas).toFixed(1) + ' ' + (y0 - 2 - 26 / N).toFixed(1) + 'Z'; }
    $('#scie-dents').setAttribute('d', d);
  })();
  var phrase = $('#scie-phrase');
  (C.elagage.phrase || []).forEach(function (t) { var s = el('span'); s.textContent = t; phrase.appendChild(s); });
  var mots = $$('span', phrase), seuils = [.05, .36, .7];
  var lignesE = $('#elagage-lignes');
  (C.elagage.details || []).forEach(function (t) { lignesE.appendChild(el('p', 'lg', '<b>' + t + '</b><i></i>')); });
  var g3 = { xc: 0, yt: 0, hb: 0, w: 0 }, pcAvant = -1;
  function mesureScie() {
    g3.xc = pont.offsetLeft + pont.offsetWidth / 2; g3.yt = brg.offsetTop; g3.hb = brg.offsetHeight; g3.w = parseFloat(getComputedStyle(scie).width) || 300;
    pcAvant = -1;
  }
  function majScie() {
    var r = piste.getBoundingClientRect();
    if (r.bottom < -200 || r.top > innerHeight + 200) return;
    var total = r.height - scene.offsetHeight;
    var pc = calme ? 1 : borne(-r.top / total / .7, 0, 1);
    if (pc === pcAvant) return;
    var fini = pc >= 1, k = g3.w / 560, xs = innerWidth < 1000 ? 300 : 360, cx = xs * k, cy = (118 - 26 * (xs - 150) / 398 + 9) * k;
    bois.style.setProperty('--p', pc.toFixed(3));
    scie.style.transformOrigin = cx.toFixed(1) + 'px ' + cy.toFixed(1) + 'px';
    if (fini) scie.style.transform = innerWidth < 1000 ? 'translate(' + (g3.xc - cx + g3.w * .2).toFixed(1) + 'px,' + (g3.yt - cy + g3.hb * 1.75).toFixed(1) + 'px) rotate(-9deg)' : 'translate(' + (g3.xc - cx - g3.w * .1).toFixed(1) + 'px,' + (g3.yt - cy - g3.hb * .75).toFixed(1) + 'px) rotate(-15deg)';
    else scie.style.transform = 'translate(' + (g3.xc - cx).toFixed(1) + 'px,' + (g3.yt + pc * g3.hb - cy).toFixed(1) + 'px) rotate(7deg) translateX(' + (Math.sin(pc * Math.PI * 2 * 8) * g3.w * .16).toFixed(1) + 'px)';
    sec3.classList.toggle('tombee', fini);
    mots.forEach(function (m, i) { m.classList.toggle('on', pc > seuils[i]); });
    indice.textContent = pc > .02 ? 'Encore : la scie avance.' : 'Défilez : la scie avance.';
    if (!fini && pc > 0 && pcAvant >= 0 && Math.abs(pc - pcAvant) > .003) {
      var b = bois.getBoundingClientRect();
      eclats(b.left + g3.xc, b.top + g3.yt + pc * g3.hb, 2, BOIS, { s: 6, vx: 6, vy: 3, g: .5, large: 4 });
    }
    if (fini && pcAvant >= 0 && pcAvant < 1) { var b2 = bois.getBoundingClientRect(); eclats(b2.left + g3.xc, b2.top + g3.yt + g3.hb, 22, BOIS, { s: 8, vx: 13, vy: 8 }); }
    pcAvant = pc;
  }

  /* ---------- 4. Les cernes de la souche ---------- */
  var souche = $('#souche'), listeC = $('#cernes-liste'), cernes = C.cernes || [], anneaux = [], lignesC = [], tourC = null, cerneActif = -1;
  (function () {
    var RR = ['50% 48% 52% 49%/49% 52% 48% 51%', '48% 52% 49% 51%/52% 48% 51% 49%', '51% 49% 50% 52%/48% 51% 49% 52%'];
    var A = [{ s: 100, cls: 'ecorce' }, { s: 91, cls: 'futur', k: 2 }, { s: 78, c: '#ecd2a0', k: 1 }, { s: 66, c: '#dbb27a', k: 0 }, { s: 54, c: '#e6c58f' }, { s: 44, c: '#d3a66c' }, { s: 34, c: '#e6c58f' }, { s: 24, c: '#d3a66c' }, { s: 14, c: '#e6c58f' }, { s: 6, c: '#b97a45' }];
    A.forEach(function (a, n) {
      var histoire = a.k != null && cernes[a.k];
      var e = el(histoire ? 'button' : 'i', 'an' + (a.cls ? ' ' + a.cls : ''));
      e.style.cssText = '--s:' + a.s + '%;--rr:' + RR[n % 3] + (a.c ? ';--ac:' + a.c : '');
      if (histoire) { e.type = 'button'; e.setAttribute('aria-label', cernes[a.k].quand + ' : ' + cernes[a.k].titre); e.addEventListener('click', function () { activerCerne(a.k, true); }); e.addEventListener('pointerenter', function (ev) { if (ev.pointerType === 'mouse') activerCerne(a.k, true); }); anneaux[a.k] = e; }
      souche.appendChild(e);
    });
    souche.appendChild(el('i', 'fente'));
    cernes.forEach(function (c, k) {
      var b = el('button', 'cerne-l', '<span class="quand">' + c.quand + '</span><span><b>' + c.titre + '</b><span>' + c.texte + '</span></span>');
      b.type = 'button'; b.setAttribute('data-v', ''); b.style.setProperty('--i', 3 + k);
      b.addEventListener('click', function () { activerCerne(k, true); });
      b.addEventListener('pointerenter', function (ev) { if (ev.pointerType === 'mouse') activerCerne(k, true); });
      listeC.appendChild(b); lignesC[k] = b;
    });
  })();
  function activerCerne(k, geste) {
    if (geste && tourC) { clearInterval(tourC); tourC = null; }
    if (k === cerneActif) return;
    cerneActif = k;
    anneaux.forEach(function (a, i) { if (a) a.classList.toggle('actif', i === k); });
    lignesC.forEach(function (l, i) { l.classList.toggle('actif', i === k); });
    if (geste && anneaux[k]) { var m = milieu(lignesC[k]); eclats(m[0] - lignesC[k].offsetWidth / 2 + 30, m[1], 5, BOIS, { s: 6, vx: 7, vy: 5 }); }
  }
  function ondeSouche() {
    var tous = $$('.an', souche).reverse();
    tous.forEach(function (a, i) { setTimeout(function () { a.classList.add('onde'); setTimeout(function () { a.classList.remove('onde'); }, 260); }, i * 70); });
  }
  function lancerCernes() {
    setTimeout(ondeSouche, calme ? 0 : 1300);
    activerCerne(0);
    if (!calme && !tourC) tourC = setInterval(function () { activerCerne((cerneActif + 1) % cernes.length); }, 2600);
  }

  /* ---------- 5. La haie au cordeau ---------- */
  var haie = $('#haie'), rang = $('#haie-rang'), etatHaie = $('#haie-etat'), touffes = [], taillees = [], nbT = 0, nbCoupees = 0, largeurHaie = 0, haieTouchee = false;
  function construireHaie() {
    var w = haie.clientWidth; if (!w || w === largeurHaie) return;
    largeurHaie = w; rang.innerHTML = ''; touffes = []; taillees = []; nbCoupees = 0; graine = 11;
    var pas = w < 700 ? 27 : w < 1300 ? 40 : 50, hMax = haie.clientHeight * .46 * .94;
    nbT = Math.round(w / pas);
    for (var i = 0; i < nbT; i++) {
      var t = el('i', 'touffe');
      t.style.cssText = 'left:' + (i / nbT * 100 - .5).toFixed(2) + '%;width:' + (100 / nbT + 1.1).toFixed(2) + '%;--h:' + Math.round(hMax * (.3 + alea() * .7)) + 'px;--r:' + Math.round(alea() * 70 - 35) + 'deg';
      rang.appendChild(t); touffes.push(t); taillees.push(0);
    }
    majHaie();
  }
  function majHaie() {
    var fini = nbCoupees >= nbT && nbT > 0;
    etatHaie.textContent = fini ? 'Au cordeau. Rien ne dépasse.' : nbCoupees + ' sur ' + nbT;
    if (fini && !haie.classList.contains('fini')) { var r = haie.getBoundingClientRect(); for (var i = 0; i < 6; i++) eclats(r.left + r.width * (i + .5) / 6, r.top + r.height * .46, 6, teintes(), { forme: 'feuille', s: 8, vx: 9, vy: 8 }); }
    haie.classList.toggle('fini', fini);
  }
  function tailler(i) {
    if (i < 0 || i >= nbT || taillees[i]) return;
    taillees[i] = 1; nbCoupees++; touffes[i].classList.add('coupee');
    var r = haie.getBoundingClientRect();
    eclats(r.left + (i + .5) * r.width / nbT, r.top + r.height * .46 - 8, 3, teintes(), { forme: 'feuille', s: 7, vx: 7, vy: 5 });
    majHaie();
  }
  function gesteHaie(e) { haieTouchee = true; var r = haie.getBoundingClientRect(); tailler(Math.floor((e.clientX - r.left) / r.width * nbT)); }
  haie.addEventListener('pointermove', gesteHaie);
  haie.addEventListener('pointerdown', gesteHaie);
  $('#haie-auto').addEventListener('click', function () {
    haieTouchee = true; var k = 0;
    for (var i = 0; i < nbT; i++) if (!taillees[i]) (function (i, k) { setTimeout(function () { tailler(i); }, calme ? 0 : k * 45); })(i, k++);
  });
  $('#haie-repousse').addEventListener('click', function () {
    haieTouchee = true;
    touffes.forEach(function (t, i) { setTimeout(function () { t.classList.remove('coupee'); }, calme ? 0 : i * 22); taillees[i] = 0; });
    nbCoupees = 0; majHaie();
  });
  function demoHaie() { if (haieTouchee) return; [1, 2, 3, 4].forEach(function (i, k) { setTimeout(function () { if (!haieTouchee) tailler(i); }, 500 + k * 240); }); }

  /* ---------- 6. Le plan : tondre en bandes, poser des éléments ---------- */
  var terrain = $('#terrain'), cv = $('#pelouse'), cx2 = cv.getContext('2d'), tond = $('#tondeuse'), poses = $('#poses'), bulleEl = $('#terrain-bulle');
  var etatPlan = $('#plan-etat'), resumeEl = $('#plan-resume'), outils = $('#outils');
  var G = { w: 0, h: 0, R: 0, C: 0, cw: 0, ch: 0, etat: null, total: 0, faits: 0, tw: 90, bati: [] };
  var pos = { x: 0, y: 0, a: 0 }, cible = null, file = [], enRoute = false, rapide = false, dernierT = 0, outil = 'tondeuse', planTouche = false, glisse = false, compteT = 0, fete = false;
  var NOMS = { arbre: ['arbre', 'arbres'], haie: ['haie', 'haies'], arbustes: ['massif d’arbustes', 'massifs d’arbustes'], allee: ['allée', 'allées'] };
  function dansBati(x, y) { return G.bati.some(function (b) { return x >= b[0] && x <= b[0] + b[2] && y >= b[1] && y <= b[1] + b[3]; }); }
  function fondPelouse() {
    var d = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(G.w * d); cv.height = Math.round(G.h * d);
    cx2.setTransform(d, 0, 0, d, 0, 0);
    cx2.fillStyle = '#3f7d2c'; cx2.fillRect(0, 0, G.w, G.h);
    graine = 23;
    var tons = ['#4a8a31', '#356f26', '#44822d'], n = Math.round(G.w * G.h / 5200);
    for (var k = 0; k < n; k++) { cx2.fillStyle = tons[k % 3]; cx2.beginPath(); cx2.ellipse(alea() * G.w, alea() * G.h, 14 + alea() * 26, 7 + alea() * 9, alea() * .6 - .3, 0, 6.3); cx2.fill(); }
  }
  function preparerPlan(force) {
    var w = terrain.clientWidth, h = terrain.clientHeight;
    if (!w || (!force && w === G.w && Math.abs(h - G.h) < 2)) return;
    G.w = w; G.h = h; G.R = borne(Math.round(h / 58), 5, 9); G.ch = h / G.R; G.C = Math.round(w / (G.ch * .5)); G.cw = w / G.C;
    var etroit = innerWidth < 1000, ma = $('.maison', terrain), te = $('.terrasse', terrain);
    var mw = Math.round((etroit ? .36 : .28) * G.C), mh = Math.round((etroit ? .3 : .42) * G.R), tw2 = Math.round((etroit ? .22 : .18) * G.C), th = Math.max(1, Math.round((etroit ? .2 : .3) * G.R));
    ma.style.width = (mw / G.C * 100) + '%'; ma.style.height = (mh / G.R * 100) + '%';
    te.style.left = (mw / G.C * 100) + '%'; te.style.width = (tw2 / G.C * 100) + '%'; te.style.height = (th / G.R * 100) + '%';
    G.bati = $$('.maison,.terrasse', terrain).map(function (b) { return [b.offsetLeft, b.offsetTop, b.offsetWidth, b.offsetHeight]; });
    G.etat = new Uint8Array(G.R * G.C); G.total = 0; G.faits = 0; fete = false;
    for (var j = 0; j < G.R; j++) for (var i = 0; i < G.C; i++) { if (dansBati((i + .5) * G.cw, (j + .5) * G.ch)) G.etat[j * G.C + i] = 2; else G.total++; }
    G.tw = G.ch * 1.42; tond.style.setProperty('--tw', G.tw.toFixed(1) + 'px');
    fondPelouse();
    file.length = 0; cible = null;
    pos.x = w * .72; pos.y = G.ch * (G.R - 1.5); pos.a = Math.PI; placerTondeuse(); majPlan();
  }
  function tondCase(i, j) {
    if (i < 0 || i >= G.C || j < 0 || j >= G.R) return 0;
    var k = j * G.C + i; if (G.etat[k]) return 0;
    G.etat[k] = 1; G.faits++;
    cx2.fillStyle = j % 2 ? '#93c842' : '#b9df67'; cx2.fillRect(i * G.cw - .5, j * G.ch, G.cw + 1, G.ch);
    return 1;
  }
  function tondAutour(x, y) {
    var j = borne(Math.floor(y / G.ch), 0, G.R - 1), i0 = Math.floor((x - G.tw * .3) / G.cw), i1 = Math.floor((x + G.tw * .3) / G.cw), n = 0;
    for (var i = i0; i <= i1; i++) n += tondCase(i, j);
    return n;
  }
  function placerTondeuse() { tond.style.transform = 'translate(' + pos.x.toFixed(1) + 'px,' + pos.y.toFixed(1) + 'px) rotate(' + pos.a.toFixed(3) + 'rad)'; }
  function bande(y) { return (borne(Math.floor(y / G.ch), 0, G.R - 1) + .5) * G.ch; }
  function aller(x, y) { cible = { x: borne(x, G.tw * .36, G.w - G.tw * .36), y: bande(y) }; lancerTonte(); }
  function lancerTonte() { if (!enRoute) { enRoute = true; dernierT = performance.now(); requestAnimationFrame(pasTonte); } }
  function pasTonte(t) {
    var dt = Math.min(50, t - dernierT); dernierT = t;
    if (!cible && file.length) cible = file.shift();
    if (!cible) { enRoute = false; rapide = false; return; }
    var v = G.w / 1300 * dt * (rapide ? 2.6 : 1), sous = Math.max(1, Math.ceil(v / (G.cw * .5))), n = 0;
    for (var s = 0; s < sous && cible; s++) {
      var dx = cible.x - pos.x, dy = cible.y - pos.y, d = Math.hypot(dx, dy), pasV = v / sous;
      if (d <= pasV) { pos.x = cible.x; pos.y = cible.y; cible = file.length ? file.shift() : null; }
      else { pos.x += dx / d * pasV; pos.y += dy / d * pasV; var a = Math.atan2(dy, dx), da = a - pos.a; while (da > Math.PI) da -= 6.2832; while (da < -Math.PI) da += 6.2832; pos.a += da * .35; }
      n += tondAutour(pos.x, pos.y);
    }
    if (n) {
      majPlan();
      if (++compteT % 2 === 0) { var r = terrain.getBoundingClientRect(); eclats(r.left + terrain.clientLeft + pos.x, r.top + terrain.clientTop + pos.y, 2, ['#b9df67', '#93c842', '#d6ee7a'], { s: 6, vx: 6, vy: 4, g: .3, f: .03 }); }
    }
    placerTondeuse();
    requestAnimationFrame(pasTonte);
  }
  function pct() { return G.total ? Math.round(G.faits / G.total * 100) : 0; }
  function majPlan() {
    var p = pct();
    etatPlan.textContent = p >= 100 ? 'Pelouse tondue, bandes bien droites.' : 'Pelouse tondue : ' + p + ' %';
    if (p >= 100 && !fete) {
      fete = true; bulle('Pelouse tondue. Posez maintenant un arbre, une haie, une allée.');
      outils.classList.add('appel'); setTimeout(function () { outils.classList.remove('appel'); }, 1600);
      var r = terrain.getBoundingClientRect(); for (var i = 0; i < 5; i++) eclats(r.left + r.width * (i + .5) / 5, r.top + r.height * .6, 7, ['#b9df67', '#93c842', '#d6ee7a'], { s: 8, vx: 10, vy: 11 });
    }
  }
  function tonteAuto(bandes) {
    file.length = 0; cible = null;
    for (var q = 0; q < bandes.length; q++) {
      var j = bandes[q], i0 = 0; while (i0 < G.C && G.etat[j * G.C + i0] === 2) i0++;
      var xa = i0 * G.cw + G.tw * .36, xb = G.w - G.tw * .36, y = (j + .5) * G.ch;
      if (q % 2) { file.push({ x: xb, y: y }, { x: xa, y: y }); } else { file.push({ x: xa, y: y }, { x: xb, y: y }); }
    }
    lancerTonte();
  }
  var bulleT = null;
  function bulle(t) { bulleEl.textContent = t; bulleEl.classList.add('on'); clearTimeout(bulleT); bulleT = setTimeout(function () { bulleEl.classList.remove('on'); }, 3200); }
  function comptes() {
    var c = {}, parts = [];
    $$('.pose:not(.ote)', poses).forEach(function (p) { c[p.dataset.type] = (c[p.dataset.type] || 0) + 1; });
    Object.keys(NOMS).forEach(function (k) { if (c[k]) parts.push(c[k] + ' ' + NOMS[k][c[k] > 1 ? 1 : 0]); });
    return parts;
  }
  function resume() { var p = comptes(); resumeEl.textContent = 'Sur votre plan : ' + (p.length ? p.join(', ') + '.' : 'rien pour l’instant.'); }
  function poser(type, x, y) {
    if (dansBati(x, y)) { terrain.classList.remove('non'); void terrain.offsetWidth; terrain.classList.add('non'); bulle('Pas sur la maison ni sur la terrasse.'); return; }
    if ($$('.pose', poses).length >= 16) { bulle('Le plan est plein : touchez un élément pour l’enlever.'); return; }
    var b = el('button', 'pose p-' + type, '<i></i><i></i><i></i><i></i>');
    b.type = 'button'; b.dataset.type = type; b.setAttribute('aria-label', 'Enlever : ' + NOMS[type][0]);
    b.style.left = borne(x / G.w * 100, 6, 94).toFixed(1) + '%'; b.style.top = borne(y / G.h * 100, 10, 88).toFixed(1) + '%';
    poses.appendChild(b);
    var r = terrain.getBoundingClientRect(); eclats(r.left + x, r.top + y, 8, type === 'allee' ? ['#e6d9ba', '#cdbf9d'] : teintes(), { forme: type === 'allee' ? '' : 'feuille', s: 8, vx: 9, vy: 7 });
    resume();
  }
  function oter(b) { b.classList.add('ote'); resume(); setTimeout(function () { b.remove(); }, 300); }
  function pointPlan(e) { var r = terrain.getBoundingClientRect(); return [e.clientX - r.left - terrain.clientLeft, e.clientY - r.top - terrain.clientTop]; }
  terrain.addEventListener('pointerdown', function (e) {
    planTouche = true;
    var p = pointPlan(e), po = e.target.closest ? e.target.closest('.pose') : null;
    if (po) { oter(po); return; }
    if (outil === 'tondeuse') { file.length = 0; rapide = false; aller(p[0], p[1]); glisse = true; }
    else poser(outil, p[0], p[1]);
  });
  terrain.addEventListener('pointermove', function (e) { if (glisse && outil === 'tondeuse') { var p = pointPlan(e); file.length = 0; aller(p[0], p[1]); } });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (n) { terrain.addEventListener(n, function () { glisse = false; }); });
  $$('button', outils).forEach(function (b) {
    b.addEventListener('click', function () {
      outil = b.dataset.outil; planTouche = true;
      $$('button', outils).forEach(function (o) { o.setAttribute('aria-pressed', o === b ? 'true' : 'false'); });
      bulle(outil === 'tondeuse' ? 'Touchez la pelouse : la tondeuse y va.' : 'Touchez le plan pour poser : ' + NOMS[outil][0] + '.');
    });
  });
  $('#plan-auto').addEventListener('click', function () {
    planTouche = true; rapide = true;
    var b = []; for (var j = 0; j < G.R; j++) b.push(j);
    tonteAuto(b);
  });
  $('#plan-vide').addEventListener('click', function () { planTouche = true; $$('.pose', poses).forEach(oter); preparerPlan(true); resume(); bulle('Le terrain est remis à zéro.'); });
  $('#plan-joindre').addEventListener('click', function () {
    var p = comptes(), fp = $('#f-plan');
    fp.textContent = (p.length ? p.join(', ') : 'Aucun élément posé') + ', pelouse tondue à ' + pct() + ' %.';
    var bloc = fp.parentNode; bloc.classList.remove('flash'); setTimeout(function () { bloc.classList.add('flash'); }, 700);
  });
  function demoPlan() { if (planTouche) return; tonteAuto([G.R - 1]); }

  /* ---------- 7. Les saisons : tout le site change de feuillage ---------- */
  var listeS = $('#saisons-liste'), petit = $('#petit-arbre'), SC = { printemps: '#6cbb49', ete: '#2f8f46', automne: '#e8962a', hiver: '#98b1a8' };
  graine = 5;
  planter(petit, [[50, 34, 58, 2], [28, 42, 42, 1], [72, 40, 44, 1], [38, 21, 40, 3], [64, 19, 38, 3], [50, 51, 36, 1], [18, 29, 28, 2], [83, 27, 28, 2], [50, 9, 28, 4], [33, 34, 21, 4], [68, 33, 19, 4]], 6);
  function saison(id, geste) {
    H.setAttribute('data-saison', id); F = null;
    $$('.saison', listeS).forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.id === id ? 'true' : 'false'); });
    if (geste) { var m = milieu(petit); setTimeout(function () { eclats(m[0], m[1] - 40, id === 'hiver' ? 34 : 22, teintes(), { forme: 'feuille', s: 10, vx: 16, vy: 9, large: 160, g: .22, f: .009 }); }, 60); }
  }
  (C.saisons || []).forEach(function (s) {
    var b = el('button', 'saison', '<span class="s-nom">' + s.nom + '</span><span class="s-ligne">' + s.ligne + '<i></i></span>');
    b.type = 'button'; b.dataset.id = s.id; b.style.setProperty('--sc', SC[s.id]);
    b.addEventListener('click', function () { saison(s.id, true); });
    listeS.appendChild(b);
  });
  saison(H.getAttribute('data-saison') || 'ete');

  /* ---------- 8. Les bornes, 9. les coordonnées et la demande, 10. les bûches ---------- */
  var bornes = $('#bornes');
  (C.bornes || []).forEach(function (b, i) {
    var d = el('div', 'borne' + (b.pointilles ? ' vide' : ''), '<b>' + b.nom + '</b><small>' + b.sous + '</small>'); d.style.setProperty('--i', i); bornes.appendChild(d);
    d.addEventListener('click', function () { if (calme || !d.animate) return; d.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-22px) rotate(' + (i % 2 ? 4 : -4) + 'deg)' }, { transform: 'translateY(0)' }], { duration: 520, easing: 'cubic-bezier(.3,1.5,.5,1)' }); });
  });
  var coord = $('#coord');
  (C.coordonnees || []).forEach(function (c) {
    var tel = c.nom === 'Téléphone', vide = /^[.\s]+$/.test(c.valeur);
    if (tel && C.telephone) coord.appendChild(el('p', 'lg', '<b>' + c.nom + '</b><i></i><a href="tel:' + C.telephone.replace(/\s/g, '') + '">' + C.telephone + '</a>'));
    else coord.appendChild(el('p', 'lg', '<b>' + c.nom + '</b>' + (tel && vide ? '<em>' + c.valeur + '</em>' : vide ? '<i></i>' : '<i></i><span>' + c.valeur + '</span>')));
  });
  var formu = $('#formulaire'), noteF = $('#feuille-note');
  formu.addEventListener('submit', function (e) {
    e.preventDefault();
    formu.classList.add('tamponnee');
    noteF.textContent = 'Maquette : rien n’est envoyé. Sur le vrai site, la demande arrive chez Noah.';
    var m = milieu($('#bombe')); eclats(m[0], m[1], 26, ['#ff5a1f', '#ff7a45', '#d8430c'], { s: 6, vx: 18, vy: 12, g: .25, f: .03 });
  });
  formu.addEventListener('input', function () { formu.classList.remove('tamponnee'); });
  var tas = $('#tas');
  (function () {
    var pages = C.pages || [], k = 0, tailles = [1, 2, 3], total = pages.length;
    tailles.forEach(function (n, r) {
      var rg = el('div', 'rang');
      for (var i = 0; i < n && k < total; i++, k++) {
        var b = el('span', 'buche'); b.textContent = pages[k]; b.style.setProperty('--i', (2 - r) * 2 + i); rg.appendChild(b);
        b.addEventListener('click', function () { if (calme || !this.animate) return; this.animate([{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }], { duration: 900, easing: 'cubic-bezier(.2,.9,.25,1)' }); var m = milieu(this); eclats(m[0], m[1] + this.offsetHeight * .4, 6, BOIS, { s: 6, vx: 8, vy: 4 }); });
      }
      tas.appendChild(rg);
    });
  })();

  /* ---------- La corde : un noeud par rubrique, le mousqueton descend avec la lecture ---------- */
  var corde = $('#corde'), noeuds = $('#noeuds'), mousq = $('#mousqueton'), brin = $('.brin', corde), etapes = [], docH = 1, piste2 = 1, dernierY = 0, penche = 0;
  $$('[data-noeud]').forEach(function (s) {
    var a = el('a', 'noeud', '<span>' + s.getAttribute('data-noeud') + '</span>'); a.href = '#' + s.id; a.setAttribute('aria-label', s.getAttribute('data-noeud'));
    noeuds.appendChild(a); etapes.push({ s: s, a: a, y: 0 });
  });
  var liensNav = $$('#liens a'), dents = $$('.dents i'), dw = 44, arbre0 = 0;
  function mesurer() {
    docH = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    piste2 = corde.clientHeight - 70;
    dw = innerWidth < 1000 ? 30 : 44;
    arbre0 = Math.max(0, arbre.parentNode.getBoundingClientRect().top + scrollY - parseFloat(getComputedStyle(H).getPropertyValue('--tete')) - 30);
    etapes.forEach(function (e, i) { e.y = i === 0 ? 0 : e.s.getBoundingClientRect().top + scrollY - parseFloat(getComputedStyle(H).getPropertyValue('--tete')); e.a.style.top = (22 + piste2 * borne(e.y / docH, 0, 1)).toFixed(1) + 'px'; });
    mesureScie();
  }
  var vu = false;
  function defiler() {
    vu = false;
    var y = window.scrollY || 0, vh = innerHeight;
    if (!calme) {
      var sxv = (-((y * .5) % dw)).toFixed(1);
      for (var i = 0; i < dents.length; i++) dents[i].style.setProperty('--sx', sxv);
      if (y < cime.offsetHeight) cime.style.setProperty('--p', borne((y - arbre0) / Math.max(1, cime.offsetHeight - arbre0), 0, 1).toFixed(3));
      brin.style.setProperty('--ry', Math.round(-y * .4) + 'px');
      penche += borne((y - dernierY) * .5, -24, 24); penche *= .8;
      mousq.style.setProperty('--mr', penche.toFixed(1) + 'deg');
      var rs = souche.getBoundingClientRect(); if (rs.bottom > 0 && rs.top < vh) souche.style.setProperty('--rot', ((rs.top + rs.height / 2 - vh / 2) * -.05).toFixed(2) + 'deg');
    }
    dernierY = y;
    mousq.style.setProperty('--my', (22 + piste2 * borne(y / docH, 0, 1)).toFixed(1) + 'px');
    var courant = 0;
    etapes.forEach(function (e, i) { var passe = y >= e.y - vh * .4; e.a.classList.toggle('passe', passe); if (passe) courant = i; });
    etapes.forEach(function (e, i) { e.a.classList.toggle('courant', i === courant); });
    var id = etapes[courant].s.id;
    liensNav.forEach(function (l) { l.classList.toggle('courant', l.getAttribute('href') === '#' + id); });
    majScie();
    if (!calme && Math.abs(penche) > .4 && !vu) { vu = true; requestAnimationFrame(defiler); }
  }
  addEventListener('scroll', function () { if (!vu) { vu = true; requestAnimationFrame(defiler); } }, { passive: true });

  /* ---------- Entrées de rubrique ---------- */
  var premiers = { 'haie': demoHaie, 'terrain': demoPlan, 'souche': lancerCernes };
  var obs = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      var t = e.target; t.classList.add('vu'); obs.unobserve(t);
      $$('[data-v="roule"]', t).forEach(function (r) { r.classList.add('vu'); });
      if (t.id === 'tas') setTimeout(function () { t.classList.add('pret'); }, 2400);
      var f = premiers[t.getAttribute('data-premier')]; if (f) setTimeout(f, 300);
    });
  }, { threshold: .14, rootMargin: '0px 0px -6% 0px' });
  haie.setAttribute('data-premier', 'haie'); terrain.setAttribute('data-premier', 'terrain'); souche.setAttribute('data-premier', 'souche');
  $$('[data-v]:not([data-v="roule"]),.bornes,.tas,[data-premier],.cernes-grille').forEach(function (e) { obs.observe(e); });

  /* ---------- Dialogue avec la page Bonjour, quand le site est montré dans son cadre ---------- */
  addEventListener('message', function (e) { if (e.data && e.data.type === 'kazura-couleur' && SC[e.data.palette]) saison(e.data.palette, true); });
  if (window.parent !== window) {
    try { window.parent.postMessage({ type: 'kazura-pret' }, '*'); } catch (err) {}
    var dit = false;
    addEventListener('scroll', function () { if (!dit && scrollY > 40) { dit = true; try { window.parent.postMessage({ type: 'kazura-defile' }, '*'); } catch (err) {} } }, { passive: true });
  }

  /* ---------- Menu du téléphone ---------- */
  var menu = $('#menu'), menuB = $('#menu-b');
  function basculeMenu(ouvre) { menu.hidden = !ouvre; menuB.setAttribute('aria-expanded', ouvre ? 'true' : 'false'); menuB.textContent = ouvre ? 'Fermer' : 'Menu'; }
  menuB.addEventListener('click', function () { basculeMenu(menu.hidden); });
  $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { basculeMenu(false); }); });
  $$('.marque,.btn-tete').forEach(function (a) { a.addEventListener('click', function () { basculeMenu(false); }); });

  /* ---------- Mise en route ---------- */
  var tR = null;
  function toutMesurer() { tailleToile(); construireHaie(); preparerPlan(); mesurer(); defiler(); }
  addEventListener('resize', function () { clearTimeout(tR); tR = setTimeout(toutMesurer, 160); });
  toutMesurer();
  addEventListener('load', toutMesurer);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(toutMesurer);
})();
