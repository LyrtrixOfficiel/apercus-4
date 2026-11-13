/* Le Richelieu, Tulle. Un seul moteur : une boucle requestAnimationFrame qui s'arrête dès que rien ne bouge.
   Règle du mouvement : ce script ne lit JAMAIS le réglage système « moins de mouvement ». Mode calme seulement avec ?calme=1. */
(function () {
  'use strict';
  var C = window.CONTENU, H = document.documentElement, Q = new URLSearchParams(location.search);
  var CALME = Q.get('calme') === '1';
  if (CALME) H.classList.add('calme');
  var $ = function (s, e) { return (e || document).querySelector(s); };
  var $$ = function (s, e) { return [].slice.call((e || document).querySelectorAll(s)); };
  var borne = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var TR = '<i class="tr"></i>';

  /* Palette : trois ambiances, branchées sur le bouton Couleur de la page Bonjour */
  function palette(n) {
    if (!C.palettes[n]) n = 'cardinal';
    H.setAttribute('data-palette', n);
    var m = $('meta[name=theme-color]'); if (m) m.content = C.palettes[n].theme;
  }
  palette(Q.get('palette') || 'cardinal');
  addEventListener('message', function (e) { if (e.data && e.data.type === 'kazura-couleur') palette(e.data.palette); });

  /* Liens réels */
  $$('[data-lien]').forEach(function (a) { a.href = C[a.getAttribute('data-lien')]; });

  /* Moteur */
  var tourne = false, jusqu = 0, dernier = 0, pas = [];
  function reveil(ms) {
    jusqu = Math.max(jusqu, performance.now() + (ms || 900));
    if (!tourne) { tourne = true; dernier = performance.now(); requestAnimationFrame(boucle); }
  }
  var aDefiler = false, defile = function () {};
  function boucle(t) {
    var dt = Math.min(.05, (t - dernier) / 1000), vivant = false; dernier = t;
    if (aDefiler) defile(); // une seule fois par image, avant toute écriture
    for (var i = 0; i < pas.length; i++) if (pas[i](dt, t)) vivant = true;
    if (vivant || t < jusqu) requestAnimationFrame(boucle); else tourne = false;
  }

  /* 1. La une : lettres, dévoilement, regard, toast, objet en main */
  var nomR = $('#nom-r');
  nomR.innerHTML = nomR.textContent.split('').map(function (l, i) { return '<span style="--i:' + i + '">' + l + '</span>'; }).join('');
  var dev = $('#devise');
  dev.innerHTML = dev.textContent.trim().split(/,\s*/).map(function (m, i, t) { return '<span style="--i:' + i + '">' + m + (i < t.length - 1 ? ',' : '') + '</span>'; }).join(' ');
  function pret() {
    ajusterNom(); H.classList.add('pret');
    geoSale = true; demander(); // les polices sont là : les positions gardées en mémoire sont remesurées
    cvCoupe(700);
  }
  function ajusterNom() { // le nom tient toujours sur sa ligne
    var t = $('.nom'); t.style.fontSize = '';
    var f = parseFloat(getComputedStyle(t).fontSize), w = 0;
    $$('span', nomR).forEach(function (l) { w += l.offsetWidth; });
    if (w > nomR.clientWidth) t.style.fontSize = Math.floor(f * nomR.clientWidth / w * .99) + 'px';
  }
  // Toutes les polices sont demandées tout de suite, même celles des rubriques encore loin de l'écran (elles ne sont plus calculées d'avance).
  if (document.fonts && document.fonts.load) ['400 1em Rozha', 'italic 400 1em Fell', '500 1em Figtree', '400 1em Plume'].forEach(function (f) { try { document.fonts.load(f); } catch (e) {} });
  var attente = new Promise(function (ok) { setTimeout(ok, 1400); });
  (document.fonts && document.fonts.ready ? Promise.race([document.fonts.ready, attente]) : attente).then(function () { setTimeout(pret, 120); });

  var cadre = $('#cadre'), card = $('#cardinal'), pup = $('#pupilles'), cartelT = $('#cartel-t');
  var oeil = { x: 0, y: 0, cx: 0, cy: .2 }, souris = 0, pupT = '';
  /* Fluidité : toutes les positions sont mesurées une fois (chargement, polices, redimensionnement, changement de hauteur)
     et gardées ici. Ni le défilement ni la souris ne relisent la mise en page. */
  var geo = { W: innerWidth, Hh: innerHeight, max: 0, cadre: { l: 0, t: 0, w: 1, h: 1 }, local: { t: 0, h: 0 }, arche: { t: 0, h: 0 } }, geoSale = true, sy = 0;
  function viser(x, y) {
    var k = geo.cadre, mx = k.l + k.w * .52, my = k.t - sy + k.h * .31;
    oeil.cx = borne((x - mx) / (geo.W * .3), -1, 1); oeil.cy = borne((y - my) / (geo.Hh * .4), -1, 1);
    reveil();
  }
  addEventListener('pointermove', function (e) {
    viser(e.clientX, e.clientY);
    if (e.pointerType === 'mouse') {
      souris = performance.now();
      var k = geo.cadre, haut = k.t - sy;
      if (haut + k.h > 0) {
        cadre.style.transform = 'rotateX(' + (borne((e.clientY - (haut + k.h / 2)) / geo.Hh, -1, 1) * -12).toFixed(2) + 'deg) rotateY(' +
          (borne((e.clientX - (k.l + k.w / 2)) / geo.W, -1, 1) * 16).toFixed(2) + 'deg)';
      }
    }
  }, { passive: true });
  addEventListener('pointerdown', function (e) { viser(e.clientX, e.clientY); }, { passive: true });
  pas.push(function () {
    var dx = oeil.cx - oeil.x, dy = oeil.cy - oeil.y;
    oeil.x += dx * .16; oeil.y += dy * .16;
    var t = 'translate(' + (oeil.x * 4.8).toFixed(2) + ' ' + (oeil.y * 3.2).toFixed(2) + ')';
    if (t !== pupT) { pupT = t; pup.setAttribute('transform', t); } // on n'écrit que si le regard a bougé
    return Math.abs(dx) + Math.abs(dy) > .004;
  });

  var objet = 'cafe', minuteur = 0;
  function dire(el, texte) { el.textContent = texte; el.classList.remove('change'); void el.offsetWidth; el.classList.add('change'); }
  cadre.addEventListener('click', function () {
    card.classList.add('trinque'); dire(cartelT, 'À la vôtre.');
    clearTimeout(minuteur);
    minuteur = setTimeout(function () { card.classList.remove('trinque'); dire(cartelT, C.objets[objet].cartel); }, 1150);
  });
  setInterval(function () { // de temps en temps, il trinque tout seul
    if (CALME || document.hidden || !$('#une').classList.contains('ici') || card.classList.contains('trinque') || card.classList.contains('baisse')) return;
    card.classList.add('trinque'); setTimeout(function () { if (cartelT.textContent !== 'À la vôtre.') card.classList.remove('trinque'); }, 800);
  }, 7000);
  var pilules = $('#pilules');
  pilules.innerHTML = Object.keys(C.objets).map(function (k) { return '<button class="pilule" type="button" data-k="' + k + '" aria-pressed="' + (k === objet) + '">' + C.objets[k].pilule + '</button>'; }).join('');
  pilules.addEventListener('click', function (e) { var b = e.target.closest('[data-k]'); if (b) prendre(b.getAttribute('data-k')); });

  /* 3. Sur le zinc : la carte qui se retourne */
  var carte = $('#carte');
  function ecrireCarte(k) {
    var o = C.objets[k];
    carte.innerHTML = '<p class="carte-sur">La carte</p><h3>' + o.titre + '</h3><p class="carte-sous">' + o.sous + '</p><ul>' +
      [0, 1, 2, 3].map(function () { return '<li>' + TR + TR + '</li>'; }).join('') + '</ul><p class="carte-note">' + o.note + '</p>';
  }
  ecrireCarte(objet);
  function prendre(k) {
    if (!C.objets[k]) return;
    var change = k !== objet; objet = k;
    $$('[data-k]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-k') === k)); });
    clearTimeout(minuteur); card.classList.remove('trinque'); dire(cartelT, C.objets[k].cartel);
    if (!change) return;
    card.classList.add('baisse');
    setTimeout(function () { card.setAttribute('data-objet', k); card.classList.remove('baisse'); }, CALME ? 0 : 240);
    carte.classList.add('tourne');
    setTimeout(function () { ecrireCarte(k); carte.classList.remove('tourne'); }, CALME ? 0 : 250);
  }
  $$('.servi').forEach(function (b) { b.addEventListener('click', function () { prendre(b.getAttribute('data-k')); }); });

  /* 2. La plume écrit la devise */
  var plume = $('#plume'), mots = $('#plume-mots'), ecrit = -1, plumeW = 0, plumeY = 0;
  function ecrire() { plumeW = mots.offsetWidth; plumeY = mots.offsetTop + mots.offsetHeight * .7; ecrit = 0; reveil(3200); } // mesuré une fois, pas à chaque image
  plume.addEventListener('click', ecrire);
  pas.push(function (dt) {
    if (ecrit < 0 || ecrit >= 1) return false;
    ecrit = Math.min(1, ecrit + dt / (CALME ? .05 : 2.7));
    var p = ecrit, w = plumeW, fin = p >= 1;
    plume.style.setProperty('--p', p.toFixed(4));
    plume.style.setProperty('--px', (p * w).toFixed(1));
    plume.style.setProperty('--py', (plumeY + (fin ? 0 : Math.sin(p * 64) * 5)).toFixed(1));
    plume.style.setProperty('--pr', (fin ? 14 : Math.sin(p * 47) * 9).toFixed(1));
    plume.style.setProperty('--po', 1);
    return !fin;
  });

  /* 4. Les étiquettes à ficelle : des pendules */
  var corde = $('#corde');
  corde.innerHTML = C.etiquettes.map(function (t) {
    return '<div class="etiquette"><span class="etiquette-c"><b>' + t + '</b><span>' + TR + '</span><span>' + TR + '</span><span class="km">à ' + TR + ' km de Tulle</span></span></div>';
  }).join('');
  var pend = $$('.etiquette', corde).map(function (el, i) { return { el: el, a: 0, v: 0, s: i % 2 ? 1 : -1, k: 34 + i * 5 }; });
  function pousser(p, f) { p.v += f; reveil(); }
  corde.addEventListener('pointermove', function (e) {
    var el = e.target.closest('.etiquette'); if (!el) return;
    var p = pend[[].indexOf.call(corde.children, el)];
    if (p) pousser(p, borne((e.movementX || 0) * 4.5, -160, 160));
  }, { passive: true });
  corde.addEventListener('pointerdown', function (e) {
    var el = e.target.closest('.etiquette'); if (!el) return;
    var p = pend[[].indexOf.call(corde.children, el)], r = el.getBoundingClientRect();
    if (p) pousser(p, (e.clientX < r.left + r.width / 2 ? 1 : -1) * 150);
  }, { passive: true });
  var pendVus = true; // les étiquettes ne se balancent que si leur rubrique est à l'écran (ou tout près)
  pas.push(function (dt) {
    var vivant = false;
    for (var i = 0; i < pend.length; i++) {
      var p = pend[i];
      if (!pendVus) { if (p.a || p.v) { p.a = 0; p.v = 0; p.el.style.transform = ''; } continue; }
      p.v += (-p.k * p.a - 1.5 * p.v) * dt; p.a = borne(p.a + p.v * dt, -13, 13); if (Math.abs(p.a) >= 13) p.v *= -.4;
      if (Math.abs(p.a) > .04 || Math.abs(p.v) > .4) { vivant = true; p.el.style.transform = 'rotate(' + p.a.toFixed(2) + 'deg)'; }
      else if (p.a) { p.a = 0; p.el.style.transform = ''; }
    }
    return vivant;
  });

  /* 5. Narcisse & Bugle : l'épi de bugle, puis le carrelage à refaire */
  var epi = $('#bugle-epi .epi'), h = '';
  for (var n = 0; n < 6; n++) {
    var e = 1 - n * .1;
    h += '<g transform="translate(55 ' + (204 - n * 31) + ') scale(' + e.toFixed(2) + ')"><g class="niv" style="--i:' + n + '">' +
      '<path d="M0 0c-26-2-38-16-40-30 20 0 36 10 40 30zM0 0c26-2 38-16 40-30-20 0-36 10-40 30z" fill="' + (n % 2 ? '#2f7d4a' : '#256a3d') + '"/>' +
      '<ellipse cx="-14" cy="-22" rx="11" ry="14" fill="#3947b5"/><ellipse cx="14" cy="-22" rx="11" ry="14" fill="#232c7c"/><ellipse cy="-30" rx="11" ry="15" fill="#5c6bdc"/></g></g>';
  }
  epi.innerHTML = h;

  var sol = $('#sol'), col = 0, lig = 0, cases = [], eclos = {}, tours = 0, nFleurs = 0, verif = 0;
  var nTours = $('#n-tours'), nFl = $('#n-fleurs'), ditJeu = $('#jeu-dit');
  var cible = {
    rosaces: function (x, y) { return y % 2 ? (x % 2 ? 0 : 1) : (x % 2 ? 3 : 2); },
    ecailles: function (x) { return x % 2 ? 3 : 2; },
  };
  function poser(c, quarts, delai) {
    if (!quarts) return;
    c.n += quarts; tours += quarts;
    c.el.style.setProperty('--dl', delai || 0);
    c.el.style.transform = 'rotate(' + c.n * 90 + 'deg)';
  }
  function entiere(i, j) { // les quatre quarts de rond se regardent autour du sommet (i, j)
    var r = function (x, y) { return cases[y * col + x].n % 4; };
    return r(i - 1, j - 1) === 2 && r(i, j - 1) === 3 && r(i - 1, j) === 1 && r(i, j) === 0;
  }
  function verifier(silence) {
    var total = 0;
    for (var j = 1; j < lig; j++) for (var i = 1; i < col; i++) {
      var cle = i + ',' + j, ok = entiere(i, j);
      if (ok) total++;
      if (ok && !eclos[cle]) {
        var f = document.createElement('span'); f.className = 'eclos';
        f.style.left = (i / col * 100) + '%'; f.style.top = (j / lig * 100) + '%';
        f.innerHTML = '<svg viewBox="-50 -50 100 100" aria-hidden="true"><use href="#' + ((i + j) % 4 === 0 ? 'bugle' : 'narcisse') + '" x="-50" y="-50" width="100" height="100"/></svg>';
        sol.appendChild(f); eclos[cle] = f;
        (function (f) { requestAnimationFrame(function () { requestAnimationFrame(function () { f.classList.add('la'); }); }); })(f);
      } else if (!ok && eclos[cle]) {
        (function (f) { f.classList.remove('la'); setTimeout(function () { f.remove(); }, 700); })(eclos[cle]);
        delete eclos[cle];
      }
    }
    nTours.textContent = tours;
    if (total !== nFleurs) { nFl.classList.remove('saute'); void nFl.offsetWidth; nFl.classList.add('saute'); }
    nFl.textContent = total;
    if (!silence || total !== nFleurs) {
      var t = total === 0 ? 'Touchez un carreau pour le tourner. Quatre quarts de rond qui se regardent font une rosace : une fleur y éclot.'
        : total === 1 ? 'Une fleur. Narcisse ou bugle, selon l’endroit. Encore ?'
          : total < 5 ? total + ' fleurs : le sol reprend des couleurs.'
            : total + ' fleurs : c’est le printemps au comptoir.';
      if (ditJeu.textContent !== t) dire(ditJeu, t);
    }
    nFleurs = total;
  }
  function plusTard(ms) { clearTimeout(verif); verif = setTimeout(verifier, CALME ? 0 : ms); }
  function batirSol() {
    var c = innerWidth < 760 ? 6 : 8, l = innerWidth < 760 ? 6 : 4;
    if (c === col) return;
    col = c; lig = l; cases = []; eclos = {}; sol.innerHTML = ''; sol.style.setProperty('--col', col);
    for (var y = 0; y < lig; y++) for (var x = 0; x < col; x++) {
      var el = document.createElement('b'), cs = { el: el, x: x, y: y, n: (x * 7 + y * 5 + (x * y) % 3) % 4 };
      el.style.transform = 'rotate(' + cs.n * 90 + 'deg)'; sol.appendChild(el); cases.push(cs);
    }
    // aucune rosace au départ, sauf une presque faite : il manque un quart de tour à un seul carreau
    var ix = col / 2, jy = Math.min(2, lig - 1), indice = [[ix - 1, jy - 1, 2], [ix, jy - 1, 3], [ix - 1, jy, 1], [ix, jy, 3]];
    indice.forEach(function (q) { var k = cases[q[1] * col + q[0]]; k.n = q[2]; k.indice = true; k.el.style.transform = 'rotate(' + k.n * 90 + 'deg)'; });
    for (var j = 1; j < lig; j++) for (var i = 1; i < col; i++) if (entiere(i, j)) {
      var k = [cases[j * col + i], cases[j * col + i - 1], cases[(j - 1) * col + i], cases[(j - 1) * col + i - 1]].filter(function (q) { return !q.indice; })[0];
      if (k) { k.n += 2; k.el.style.transform = 'rotate(' + k.n * 90 + 'deg)'; }
    }
    tours = 0; nFleurs = 0; verifier(false);
  }
  var glisse = false, derniere = null;
  function caseDe(el) { if (!el || el.parentNode !== sol || el.tagName !== 'B') return null; return cases[[].indexOf.call(sol.children, el)]; }
  sol.addEventListener('pointerdown', function (e) { var c = caseDe(e.target); glisse = true; derniere = c; if (c) { poser(c, 1, 0); plusTard(330); } });
  sol.addEventListener('pointermove', function (e) {
    if (!glisse) return;
    var c = caseDe(document.elementFromPoint(e.clientX, e.clientY));
    if (c && c !== derniere) { derniere = c; poser(c, 1, 0); plusTard(330); }
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (t) { sol.addEventListener(t, function () { glisse = false; derniere = null; }); });
  $$('[data-motif]').forEach(function (b) {
    b.addEventListener('click', function () {
      var m = b.getAttribute('data-motif'), bouge = 0, fin = 0;
      cases.forEach(function (c) {
        var q = m === 'hasard' ? 1 + Math.floor(Math.random() * 3) : (cible[m](c.x, c.y) - c.n % 4 + 4) % 4, d = (c.x + c.y) * 45;
        if (q) { bouge++; fin = Math.max(fin, d); poser(c, q, d); }
      });
      if (!bouge) cases.forEach(function (c) { var d = (c.x + c.y) * 45; fin = Math.max(fin, d); poser(c, 4, d); });
      plusTard(fin + 420);
    });
  });
  batirSol();

  /* 6. L'agenda : trois lettres cachetées */
  $('#lettres').innerHTML = C.agenda.map(function (s, i) {
    return '<div data-vu style="--d:' + i * 130 + '"><button class="lettre" type="button" aria-expanded="false"><span class="dos"></span>' +
      '<span class="feuillet"><b>' + (s ? s.titre : 'Votre soirée') + '</b><span>Le ' + (s ? s.date : TR) + '</span><span>À ' + (s ? s.heure : TR + ' h') + '</span>' + (s ? '' : '<small>À compléter avec vous.</small>') + '</span>' +
      '<span class="devant"></span><span class="rabat"></span><span class="cire" aria-hidden="true"><i>R</i><i>R</i></span><span class="vh">Briser le sceau de la lettre ' + (i + 1) + '</span></button></div>';
  }).join('');
  $$('.lettre').forEach(function (l) {
    l.addEventListener('click', function () { var o = l.classList.toggle('ouverte'); l.setAttribute('aria-expanded', String(o)); });
  });

  var premiere = $('.lettre');

  /* 7. Venir : la semaine en pointillés */
  $('#semaine').innerHTML = C.semaine.map(function (j) { return '<p class="jour" aria-label="' + j + ', horaires à confirmer"><b>' + j.slice(0, 3) + '<i>' + j.slice(3) + '</i></b>' + TR + TR + '</p>'; }).join('');

  /* 8. Le sceau de cire : on maintient pour cacheter */
  var pli = $('#pli'), cachet = $('#cachet'), cire = 0, tenu = false, fait = false;
  $('#sujets').addEventListener('click', function (e) {
    var b = e.target.closest('.pilule'); if (!b) return;
    $$('.pilule', this).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
  });
  function tenir(e) { if (fait) return; tenu = true; cachet.classList.add('appuie'); if (e && e.pointerId != null && cachet.setPointerCapture) { try { cachet.setPointerCapture(e.pointerId); } catch (x) {} } reveil(1600); }
  function lacher() { tenu = false; cachet.classList.remove('appuie'); reveil(900); }
  cachet.addEventListener('pointerdown', tenir);
  ['pointerup', 'pointercancel'].forEach(function (t) { cachet.addEventListener(t, lacher); });
  cachet.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  cachet.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) { e.preventDefault(); tenir(); } });
  cachet.addEventListener('keyup', function (e) { if (e.key === 'Enter' || e.key === ' ') lacher(); });
  var cireT = '';
  pas.push(function (dt) {
    if (fait) return false;
    if (tenu) { cire = Math.min(1, cire + dt / (CALME ? .1 : 1.15)); if (cire >= 1) { fait = true; tenu = false; cachet.classList.remove('appuie'); pli.classList.add('cachete'); } }
    else if (cire > 0) cire = Math.max(0, cire - dt * 2);
    var c = cire.toFixed(3);
    if (c !== cireT) { cireT = c; cachet.style.setProperty('--c', c); } // rien n'est écrit tant que la cire ne bouge pas
    return tenu || (cire > 0 && cire < 1);
  });
  $('#autre-mot').addEventListener('click', function () {
    fait = false; cire = 0; cireT = ''; cachet.style.setProperty('--c', 0); pli.classList.remove('cachete'); $('#m-nom').value = ''; $('#m-mot').value = '';
  });

  /* Menu du téléphone */
  var burger = $('#burger');
  function menu(o) { H.classList.toggle('menu-ouvert', o); burger.setAttribute('aria-expanded', String(o)); burger.setAttribute('aria-label', o ? 'Fermer le menu' : 'Ouvrir le menu'); }
  burger.addEventListener('click', function () { menu(!H.classList.contains('menu-ouvert')); });
  $('#menu').addEventListener('click', function (e) { if (e.target.closest('a')) menu(false); });
  addEventListener('keydown', function (e) { if (e.key === 'Escape') menu(false); });

  /* Frises de carreaux : elles tournent par quarts de tour avec le défilement */
  var frises = [];
  function batirFrises() {
    frises = $$('.frise').map(function (f) {
      var t = innerWidth < 760 ? 46 : 64, nb = Math.ceil(innerWidth / t); if (nb % 2) nb++;
      var rangs = +(f.getAttribute('data-rangs') || 1), s = '';
      f.style.setProperty('--n', nb); f.style.setProperty('--rangs', rangs); f.classList.remove('pres');
      for (var i = 0; i < nb * rangs; i++) s += '<b></b>';
      f.innerHTML = s;
      return { el: f, nb: nb, t: 0, h: 0, pres: false, c: $$('b', f).map(function (b, i) { var x = i % nb, y = Math.floor(i / nb); return { el: b, x: x, base: cible.rosaces(x, y), k: -1 }; }) };
    });
    geoSale = true;
  }
  function tournerFrises(y) {
    var Hh = geo.Hh;
    for (var i = 0; i < frises.length; i++) {
      var f = frises[i], haut = f.t - y;
      // les carreaux ne sont des calques que lorsque leur frise approche de l'écran
      var pres = haut + f.h > -260 && haut < Hh + 260;
      if (pres !== f.pres) { f.pres = pres; f.el.classList.toggle('pres', pres); }
      if (haut + f.h < -40 || haut > Hh + 40) continue;
      var p = 1 - (haut + f.h / 2) / Hh;
      for (var j = 0; j < f.c.length; j++) {
        var c = f.c[j], k = CALME ? 0 : Math.max(0, Math.floor(p * 5.5 - (c.x / f.nb) * 1.6));
        if (k !== c.k) { c.k = k; c.el.style.transform = 'rotate(' + (c.base + k) * 90 + 'deg)'; }
      }
    }
  }

  /* Défilement : ruban, sceau, parallaxes, regard */
  var ruban = $('#ruban'), sceau = { el: $('#sceau'), a: 0, v: 0, x: 0, t: '' }, fondMot = $('#fond-mot'), local = $('#local'), arche = $('#arche'), photo = $('#arche img');
  var rubanT = '', fondT = '', photoT = '';
  sy = scrollY;
  function mesurer() { // des lectures seulement, toutes ensemble
    var y = scrollY, r;
    geo.W = innerWidth; geo.Hh = innerHeight; geo.max = H.scrollHeight - geo.Hh;
    for (var i = 0; i < frises.length; i++) { r = frises[i].el.getBoundingClientRect(); frises[i].t = r.top + y; frises[i].h = r.height; }
    r = local.getBoundingClientRect(); geo.local.t = r.top + y; geo.local.h = r.height;
    r = arche.getBoundingClientRect(); geo.arche.t = r.top + y; geo.arche.h = r.height;
    r = cadre.getBoundingClientRect(); geo.cadre.l = r.left; geo.cadre.t = r.top + y; geo.cadre.w = r.width; geo.cadre.h = r.height;
    geoSale = false;
  }
  defile = function () {
    aDefiler = false;
    if (geoSale) mesurer();
    var y = scrollY, W = geo.W, Hh = geo.Hh, p = geo.max > 0 ? borne(y / geo.max, 0, 1) : 0, d = y - sy, t; sy = y;
    // à partir d'ici, des écritures seulement
    t = 'scaleX(' + p.toFixed(4) + ')'; if (t !== rubanT) { rubanT = t; ruban.style.transform = t; }
    sceau.x = borne(p * W, W < 860 ? 18 : 28, W - (W < 860 ? 18 : 28));
    var haut = geo.local.t - y, h = geo.local.h;
    pendVus = haut + h > -120 && haut < Hh + 120;
    if (!CALME) {
      sceau.v -= borne(d, -60, 60) * 5;
      if (pendVus) for (var i = 0; i < pend.length; i++) pend[i].v += borne(d, -50, 50) * .9 * pend[i].s;
    }
    if (haut + h > 0 && haut < Hh) {
      t = 'translate(' + (((haut - Hh) / (h + Hh)) * W * .55 + W * .12).toFixed(1) + 'px,-56%)';
      if (t !== fondT) { fondT = t; fondMot.style.transform = t; }
    }
    haut = geo.arche.t - y; h = geo.arche.h;
    if (haut + h > 0 && haut < Hh) {
      t = 'translateY(' + borne((haut + h / 2 - Hh / 2) * -.11, -h * .11, h * .11).toFixed(1) + 'px)';
      if (t !== photoT) { photoT = t; photo.style.transform = t; }
    }
    if (performance.now() - souris > 1500 && y < Hh) { oeil.cy = borne(y / 260, .1, 1); oeil.cx *= .9; }
    tournerFrises(y);
  };
  function demander() { aDefiler = true; reveil(); } // le défilement ne fait que demander une image
  pas.push(function (dt) {
    var s = sceau;
    s.v += (-70 * s.a - 5 * s.v) * dt; s.a = borne(s.a + s.v * dt, -42, 42);
    var bouge = Math.abs(s.a) > .05 || Math.abs(s.v) > .5;
    if (!bouge) s.a = 0;
    var t = 'translateX(' + s.x.toFixed(1) + 'px) rotate(' + s.a.toFixed(2) + 'deg)';
    if (t !== s.t) { s.t = t; s.el.style.transform = t; }
    return bouge;
  });
  addEventListener('scroll', demander, { passive: true });
  // Si la hauteur de la page change (carte retournée, message du jeu, lettre cachetée), les positions sont remesurées à l'image suivante.
  if (window.ResizeObserver) new ResizeObserver(function () { geoSale = true; demander(); }).observe(document.body);

  /* Entrées et rubrique en cours */
  var vu = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('vu'); vu.unobserve(e.target);
      if (e.target === plume) setTimeout(ecrire, CALME ? 0 : 450);
      if (e.target === premiere.parentNode) setTimeout(function () { if (!premiere.classList.contains('ouverte')) premiere.click(); }, CALME ? 0 : 1100);
      if (e.target === corde && !CALME) pend.forEach(function (p, i) { p.a = p.s * (8 + i); reveil(); });
    });
  }, { threshold: .14, rootMargin: '0px 0px -7% 0px' });
  corde.setAttribute('data-vu', 'corde');
  $$('[data-vu]').forEach(function (el) { vu.observe(el); });
  var liens = $$('.menu a');
  var ici = new IntersectionObserver(function (es) {
    es.forEach(function (e) { e.target.classList.toggle('ici', e.isIntersecting); });
  }, { rootMargin: '60px 0px 60px 0px' });
  $$('main > section').forEach(function (s) { ici.observe(s); });
  var enCours = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      liens.forEach(function (a) { a.classList.toggle('ici', a.getAttribute('href') === '#' + e.target.id); });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('main > section').forEach(function (s) { enCours.observe(s); });

  /* Fluidité : une rubrique loin de l'écran n'est ni calculée ni peinte (content-visibility, classe cv sur html).
     Pour que rien ne bouge quand elle revient, sa hauteur exacte est relevée tant qu'elle est affichée et gardée en réserve
     (contain-intrinsic-block-size). Si la fenêtre change, on coupe, tout se remet en page, les hauteurs sont relevées, puis on réactive. */
  var cvActif = false, cvT = 0, cvOk = !!(window.ResizeObserver && window.CSS && CSS.supports && CSS.supports('content-visibility', 'auto')), cvW = H.clientWidth, cvH = H.clientHeight;
  function cvCoupe(ms) {
    if (!cvOk) return;
    if (cvActif) { cvActif = false; H.classList.remove('cv'); }
    clearTimeout(cvT); cvT = setTimeout(function () { cvActif = true; H.classList.add('cv'); }, ms || 500);
  }
  if (cvOk) {
    var cvRo = new ResizeObserver(function (es) {
      var large = false;
      for (var i = 0; i < es.length; i++) {
        var e = es[i], b = e.contentBoxSize && e.contentBoxSize[0], h = b ? b.blockSize : e.contentRect.height, w = b ? b.inlineSize : e.contentRect.width, t = e.target;
        if (cvActif && t.cvL != null && Math.abs(t.cvL - w) > .5) large = true; // la largeur a changé sans prévenir
        t.cvL = w;
        if (h > 0 && h !== t.cvHt) { t.cvHt = h; t.style.containIntrinsicBlockSize = h + 'px'; }
      }
      if (large) cvCoupe();
    });
    $$('main > section, .pied').forEach(function (r) { cvRo.observe(r); });
    addEventListener('load', function () { cvCoupe(700); });
  }

  var largeur = innerWidth, re = 0;
  addEventListener('resize', function () {
    // la barre d'adresse du téléphone qui se replie ne compte pas : seule la taille de la page compte
    if (cvOk && (H.clientWidth !== cvW || H.clientHeight !== cvH)) { cvW = H.clientWidth; cvH = H.clientHeight; cvCoupe(600); }
    clearTimeout(re);
    re = setTimeout(function () { if (innerWidth !== largeur) { largeur = innerWidth; batirFrises(); batirSol(); ajusterNom(); } geoSale = true; demander(); }, 180);
  });
  addEventListener('load', function () { geoSale = true; demander(); });
  batirFrises(); defile();
})();
