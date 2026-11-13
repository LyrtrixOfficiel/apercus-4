// La Sandwicherie du Lycée : la journée du lycée défile avec la page, et ça sonne à chaque rubrique.
// Le réglage système des animations n'est jamais lu. Mode calme seulement avec ?calme=1.
(function () {
  var C = window.CONTENU, doc = document, html = doc.documentElement;
  var $ = function (s, r) { return (r || doc).querySelector(s); }, $$ = function (s, r) { return [].slice.call((r || doc).querySelectorAll(s)); };
  var calme = html.classList.contains('calme');
  var M = { secs: [], max: 0, fil: 0, pays: null };   // positions gardées en mémoire pour le défilement
  var borne = function (x, a, b) { return Math.max(a, Math.min(b, x)); };
  function relance(el, cl) { el.classList.remove(cl); void el.offsetWidth; el.classList.add(cl); }
  function hh(x) { var h = Math.floor(x), m = Math.round((x - h) * 60); return h + ' h' + (m ? ' ' + (m < 10 ? '0' : '') + m : ''); }

  // Couleur du stylo : ?palette=bleu|vert|noir, ou le bouton Couleur de la page Bonjour.
  function palette(nom) { var P = C.palettes[nom]; if (!P) return; html.style.setProperty('--encre', P.encre); html.style.setProperty('--fonce', P.fonce); var m = $('meta[name=theme-color]'); if (m) m.content = P.encre; }
  palette(new URLSearchParams(location.search).get('palette') || 'bleu');
  addEventListener('message', function (e) { if (e.data && e.data.type === 'kazura-couleur') palette(e.data.palette); });
  $$('[data-itin]').forEach(function (a) { a.href = C.carteLien; });

  // Le titre : les lettres montent une à une.
  var n = 0;
  $$('#titre .la, #titre .sdw').forEach(function (m) {
    m.innerHTML = m.textContent.split('').map(function (l) { return '<span class="l" style="--i:' + (n++) + ';--r:' + (n % 2 ? -7 : 6) + 'deg">' + l + '</span>'; }).join('');
  });
  var lettres = $$('#titre .l');
  lettres.forEach(function (l) { l.addEventListener('pointerenter', function () { relance(l, 'hop'); }); });
  function vague() { lettres.forEach(function (l, i) { setTimeout(function () { relance(l, 'hop'); }, i * 32); }); }

  // La sonnerie
  var AC = null;
  function son(duree) {
    try {
      AC = AC || new (window.AudioContext || window.webkitAudioContext)();
      if (AC.state === 'suspended') AC.resume();
      var o = AC.createOscillator(), g = AC.createGain(), t = AC.currentTime;
      o.type = 'square'; o.frequency.value = 1568; g.gain.value = 0;
      for (var k = 0; k < duree / .034; k++) g.gain.setValueAtTime(k % 2 ? 0 : .045, t + k * .034);
      g.gain.setValueAtTime(0, t + duree);
      o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + duree + .05);
    } catch (e) {}
  }
  var cloche = $('#cloche'), pendule = $('#pendule'), heure = $('#heure'), dring = $('#dring'), main = $('#main');
  function sonne(grand, muet) {
    relance(cloche, 'sonne'); relance(pendule, 'vibre'); relance(heure, 'sonne'); vague();
    if (grand && !calme) { relance(dring, 'go'); relance(main, 'secoue'); }
    if (!muet) son(grand ? .75 : .3);
  }
  cloche.addEventListener('click', function () { sonne(true); });
  heure.addEventListener('click', function () { sonne(true); });
  if (!calme) setTimeout(function () { sonne(false, true); }, 2100);

  // La pendule, à l'heure qu'il est, et l'état du comptoir selon les horaires du contenu.
  var aH = $('#a-h'), aM = $('#a-m'), aS = $('#a-s'), tours = 0, derS = -1;
  function etat() {
    var d = new Date(), j = d.getDay(), t = d.getHours() + d.getMinutes() / 60, J = C.semaine.filter(function (s) { return s.d === j; })[0];
    if (J) for (var k = 0; k < J.c.length; k++) {
      var a = J.c[k][0], b = J.c[k][1];
      if (t >= a && t < b) { var r = Math.ceil((b - t) * 60); return [true, 'Ouvert : ça sonne dans ' + (r >= 60 ? Math.floor(r / 60) + ' h ' + (r % 60 ? (r % 60 < 10 ? '0' : '') + r % 60 : '') : r + ' min')]; }
      if (t < a) return [false, 'Fermé : rentrée à ' + hh(a)];
    }
    for (var p = 1; p <= 7; p++) {
      var q = (j + p) % 7, S = C.semaine.filter(function (s) { return s.d === q; })[0];
      if (S) return [false, 'Fermé : rentrée ' + (p === 1 ? 'demain' : S.nom.toLowerCase()) + ' à ' + hh(S.c[0][0])];
    }
    return [false, ''];
  }
  function seconde() {
    var d = new Date(), s = d.getSeconds(), m = d.getMinutes(), h = d.getHours() % 12;
    if (s < derS) tours++; derS = s;
    aS.style.transform = 'rotate(' + (tours * 360 + s * 6) + 'deg)';
    aM.style.transform = 'rotate(' + (m * 6 + s / 10) + 'deg)';
    aH.style.transform = 'rotate(' + (h * 30 + m / 2) + 'deg)';
    var e = etat(); $('#etat').classList.toggle('ouvert', e[0]); if ($('#etat-t').textContent !== e[1]) $('#etat-t').textContent = e[1];
  }
  seconde(); setInterval(seconde, 1000);

  // Les bandes entre les rubriques : le texte file avec le défilement.
  var bandes = $$('[data-bande]').map(function (b, i) {
    var d = doc.createElement('div'), t = '<span>' + b.dataset.bande + '</span>';
    d.innerHTML = t; b.appendChild(d);
    return { el: b, d: d, t: t, sens: i % 2 ? 1 : -1, w: 0 };
  });
  function mesureBandes() { bandes.forEach(function (B) { B.d.innerHTML = B.t; B.w = B.d.firstChild.offsetWidth || 400; var k = Math.ceil(innerWidth * 1.15 / B.w) + 2, s = ''; while (k--) s += B.t; B.d.innerHTML = s; }); }

  // 10 h : les casiers
  var casiers = $('#casiers');
  casiers.innerHTML = C.casiers.map(function (c, i) {
    var l = ''; for (var k = 0; k < c.lignes; k++) l += '<div class="ligne"><i></i><b>.. , .. €</b></div>';
    return '<article class="casier" data-t="' + c.teinte + '"><div class="dedans"><h3>' + c.t + '</h3>' + l +
      (c.photo ? '<div class="collee"><img src="photos/' + c.photo + '" alt="' + c.alt + '" loading="lazy" width="1000" height="1250"><small>Image d’illustration</small></div>' : '<p class="casier-mot">' + c.mot + '</p>') +
      '</div><button class="porte" type="button" aria-expanded="false" aria-label="Casier ' + c.t + ' : ouvrir ou fermer"><span class="fentes"><i></i><i></i><i></i></span><span class="etiq">' + c.t + '</span><span class="ouvrir">ouvrir</span><span class="num">N° ' + (i + 1) + '</span><span class="poignee"></span></button></article>';
  }).join('');
  function bascule(c, o) { c.classList.toggle('ouvert', o); $('.porte', c).setAttribute('aria-expanded', o ? 'true' : 'false'); }
  $$('.casier', casiers).forEach(function (c) { $('.porte', c).addEventListener('click', function () { bascule(c, !c.classList.contains('ouvert')); }); });
  var ioC = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (!e.isIntersecting) return; ioC.unobserve(e.target); var i = [].indexOf.call(casiers.children, e.target); setTimeout(function () { bascule(e.target, true); }, calme ? 0 : 450 + (innerWidth > 620 ? i * 330 : 0)); });
  }, { threshold: .6 });
  $$('.casier', casiers).slice(0, 3).forEach(function (c) { ioC.observe(c); });

  // 13 h 30 : l'emploi du temps, dessiné à partir des créneaux
  var H0 = 8, H1 = 18, edt = $('#edt'), ajd = new Date().getDay(), rang = 0;
  var teintes = [['var(--jaune)', 'var(--noir)'], ['var(--rouge)', '#fff'], ['var(--blanc)', 'var(--noir)'], ['var(--orange)', 'var(--noir)'], ['#8fd3ff', 'var(--noir)']];
  var pc = function (h) { return ((h - H0) / (H1 - H0) * 100).toFixed(2) + '%'; };
  edt.innerHTML = '<div class="edt-col edt-heures"><span class="edt-h">h</span><div class="piste">' + [8, 10, 12, 14, 16, 18].map(function (h) { return '<span style="top:' + pc(h) + '">' + h + ' h</span>'; }).join('') + '</div></div>' +
    C.semaine.map(function (s, i) {
      var t = new Date().getHours() + new Date().getMinutes() / 60;
      return '<div class="edt-col' + (s.d === ajd ? ' ajd' : '') + '" data-i="' + i + '"><button class="edt-j" type="button" aria-label="' + s.nom + '">' + s.j + '</button><div class="piste">' +
        s.c.map(function (c) { return '<div class="cr" style="--i:' + (rang++) + ';--c:' + teintes[i][0] + ';--e:' + teintes[i][1] + ';top:' + pc(c[0]) + ';height:' + ((c[1] - c[0]) / (H1 - H0) * 100).toFixed(2) + '%"><span>' + hh(c[0]) + '</span><span>' + hh(c[1]) + '</span></div>'; }).join('') +
        (s.d === ajd && t >= H0 && t <= H1 ? '<i class="mnt" style="top:' + pc(t) + '"></i>' : '') + '</div></div>';
    }).join('');
  var lu = $('#jour-lu');
  function jour(i, anime) {
    var s = C.semaine[i];
    $$('.edt-col', edt).forEach(function (c) { c.classList.toggle('choisi', c.dataset.i === String(i)); });
    $('#jour-n').textContent = s.nom + (s.d === ajd ? ', aujourd’hui' : '');
    $('#jour-c').innerHTML = s.c.map(function (c) { return hh(c[0]) + ' à ' + hh(c[1]); }).join('<br>puis ');
    if (anime) relance(lu, 'change');
  }
  $$('.edt-col[data-i]', edt).forEach(function (c) { c.addEventListener('click', function () { jour(+c.dataset.i, true); }); });
  var iAjd = -1; C.semaine.forEach(function (s, i) { if (s.d === ajd) iAjd = i; });
  jour(iAjd < 0 ? 0 : iAjd);
  new IntersectionObserver(function (e, o) { if (e[0].isIntersecting) { edt.classList.add('vu'); o.disconnect(); } }, { threshold: .25 }).observe(edt);

  // 12 h : le jeu. Les étages se balancent, on les lâche, la pile penche, la sonnerie arrête tout.
  var table = $('#table'), pile = $('#pile'), vol = $('#vol'), cam = $('#cam'), msg = $('#j-msg'), chrono = $('.chrono', table);
  var HT = { 'pain-b': 34, 'pain-h': 46, salade: 22, tomate: 18, fromage: 13, jambon: 15, cornichon: 13, frites: 20 }, TYPES = ['salade', 'jambon', 'fromage', 'tomate', 'frites', 'cornichon'];
  var G = { etat: 'repos', n: 0, xs: [0], h: 0, ph: 0, x: 0, prec: 0, reste: 30, type: 'pain-h', der: 0, vy: 0, t0: 0, cible: 0, s: 0, vu: false };
  var record = 0; try { record = +localStorage.getItem('sdl-record') || 0; } catch (e) {}
  $('#j-r').textContent = record;
  function etage(type, x, y, cl) { var d = doc.createElement('i'); d.className = 'et et-' + type + (cl ? ' ' + cl : ''); d.style.setProperty('--x', x + 'px'); d.style.setProperty('--y', y + 'px'); return d; }
  function dit(t) { msg.textContent = t; relance(msg, 'clac'); }
  function lw() { return Math.min(330, table.clientWidth * .5); }
  function ht(type) { return HT[type] * Math.max(.85, lw() / 240); }
  function regle() { table.style.setProperty('--lw', lw() + 'px'); table.style.setProperty('--k', Math.max(.85, lw() / 240).toFixed(3)); }
  function nouveauVol(type) { G.type = type; vol.innerHTML = ''; vol.appendChild(etage(type, 0, 0)); G.vy = 0; }
  function poser(type, x, cl) { pile.appendChild(etage(type, x, G.h, cl)); G.h += ht(type); G.xs.push(x); }
  function cadre() { var H = table.clientHeight; G.s = Math.max(0, G.h - H * .36); cam.style.transform = 'translateY(' + G.s + 'px)'; }
  function demo() {
    G.etat = 'repos'; G.h = 0; G.xs = []; pile.innerHTML = ''; pile.style.removeProperty('--penche'); pile.classList.add('berce');
    [['pain-b', 0], ['salade', 10], ['jambon', -8], ['fromage', 12], ['tomate', -6], ['frites', 6]].forEach(function (e) { poser(e[0], e[1]); });
    cadre(); nouveauVol('pain-h'); chrono.classList.remove('presse'); $('#j-barre').style.transform = ''; $('#j-s').textContent = '30';
  }
  function depart() {
    $('#copie').hidden = true; pile.classList.remove('berce'); pile.innerHTML = ''; pile.style.setProperty('--penche', '0deg');
    G.etat = 'balance'; G.n = 0; G.h = 0; G.xs = []; G.prec = 0; G.reste = 30; G.ph = 0;
    regle(); poser('pain-b', 0, 'pose'); cadre(); nouveauVol(TYPES[0]);
    $('#j-n').textContent = '0'; $('#j-go').textContent = 'Recommencer'; chrono.classList.remove('presse'); dit('Touchez pour lâcher');
    try { table.focus({ preventScroll: true }); } catch (e) {}
  }
  function lache() {
    if (G.etat !== 'balance') return;
    var H = table.clientHeight;
    G.etat = 'chute'; G.t0 = performance.now(); G.cible = (H - 72) - (H * .22 + 14 + G.h - G.s) - ht(G.type);
  }
  function atterrit() {
    var L = lw(), ref = G.xs[G.xs.length - 1], dx = G.x - ref, e = vol.firstChild;
    if (Math.abs(dx) > L * .62) { // à côté : l'étage dégringole
      G.etat = 'rate'; G.reste -= 2; dit('À côté ! Deux secondes de perdues');
      e.style.transition = 'transform .6s cubic-bezier(.5,0,.9,.5)'; e.style.transform = 'translate(' + (dx > 0 ? 90 : -90) + 'px,' + (table.clientHeight) + 'px) rotate(' + (dx > 0 ? 150 : -150) + 'deg)';
      setTimeout(function () { if (G.etat === 'rate') { G.etat = 'balance'; nouveauVol(G.type); } }, 620);
      return;
    }
    poser(G.type, G.x, 'pose'); G.n++; G.prec += 1 - Math.abs(dx) / (L * .62);
    $('#j-n').textContent = G.n; relance($('#j-n').parentNode, 'plus');
    var com = 0; G.xs.forEach(function (x) { com += x; }); com /= G.xs.length;
    pile.style.setProperty('--penche', borne(com / L * 46, -17, 17).toFixed(1) + 'deg');
    if (Math.abs(com) > L * .3) { fin(true); return; }
    dit(Math.abs(dx) < L * .07 ? 'Pile dessus !' : Math.abs(com) > L * .17 ? 'Ça penche, redressez !' : Math.abs(dx) < L * .28 ? 'Ça tient' : 'De justesse');
    cadre(); G.etat = 'balance'; nouveauVol(TYPES[G.n % TYPES.length]);
  }
  function fin(parTerre) {
    G.etat = 'fin'; vol.innerHTML = ''; sonne(true);
    if (parTerre) {
      $$('.et', pile).forEach(function (e, i) { e.style.setProperty('--tx', ((i % 2 ? 1 : -1) * (60 + i * 22)) + 'px'); e.style.setProperty('--rr', ((i % 2 ? 1 : -1) * (120 + i * 30)) + 'deg'); e.style.setProperty('--dl', (i * .04) + 's'); e.classList.remove('pose'); e.classList.add('chute'); });
      cam.style.transform = 'none'; dit('Tout est par terre');
    } else { poser('pain-h', G.xs[G.xs.length - 1], 'pose'); cadre(); dit('Ça sonne : on pose les stylos'); }
    var p = G.n ? G.prec / G.n : 0, note = parTerre ? Math.min(8, Math.round(G.n * .8)) : Math.min(20, Math.round(G.n * 1.3 + p * 3)), appr = '';
    C.bulletin.forEach(function (b) { if (note >= b[0]) appr = b[1]; });
    if (parTerre) appr = 'Par terre. Les lois de la physique sont au programme.';
    if (G.n > record) { record = G.n; try { localStorage.setItem('sdl-record', record); } catch (e) {} $('#j-r').textContent = record; relance($('#j-r').parentNode, 'plus'); }
    setTimeout(function () { $('#note').textContent = note; $('#appr').textContent = appr; $('#copie').hidden = false; $('#j-go').textContent = 'Rejouer'; }, calme ? 0 : 1100);
  }
  // La boucle ne tourne que quand la table est à l'écran (avant, elle tournait à vide tout le temps).
  var boucle = false, permis = !calme;
  function lance() { if (!boucle && permis && G.vu) { boucle = true; G.der = performance.now(); requestAnimationFrame(tic); } }
  function tic(t) {
    if (!G.vu) { boucle = false; return; }
    var dt = Math.max(0, Math.min(.05, (t - G.der) / 1000)); G.der = t;
    if (G.vu) {
      var A = (table.clientWidth - lw()) / 2 - 10, joue = G.etat === 'balance' || G.etat === 'chute' || G.etat === 'rate';
      if (G.etat === 'balance' || G.etat === 'repos') { G.ph += dt * (G.etat === 'repos' ? 1.1 : Math.min(4.3, 1.9 + G.n * .14)); G.x = Math.sin(G.ph) * A * (G.etat === 'repos' ? .5 : 1); vol.style.transform = 'translate(' + G.x.toFixed(1) + 'px,0)'; }
      else if (G.etat === 'chute') { var k = Math.min(1, (t - G.t0) / 240); vol.style.transform = 'translate(' + G.x.toFixed(1) + 'px,' + (G.cible * k * k).toFixed(1) + 'px)'; if (k >= 1) atterrit(); }
      if (joue) {
        G.reste -= dt; var r = Math.max(0, G.reste);
        $('#j-barre').style.transform = 'scaleX(' + (r / 30).toFixed(4) + ')'; $('#j-s').textContent = Math.ceil(r);
        chrono.classList.toggle('presse', r <= 6);
        if (r <= 0 && G.etat !== 'fin') fin(false);
      }
    }
    requestAnimationFrame(tic);
  }
  regle(); demo();
  new IntersectionObserver(function (e) { G.vu = e[0].isIntersecting; lance(); }, { threshold: .05 }).observe(table);
  table.addEventListener('click', function (e) { if (e.target.closest('.copie')) return; if (G.etat === 'repos') depart(); else lache(); });
  table.addEventListener('keydown', function (e) { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (G.etat === 'repos' || G.etat === 'fin') depart(); else lache(); } });
  $('#j-go').addEventListener('click', depart); $('#j-re').addEventListener('click', depart);
  if (calme) { $('#j-go').addEventListener('click', function () { permis = true; G.vu = true; lance(); }, { once: true }); }

  // 15 h 30 : le pays des terrils, dessiné en aplats. Les cartables font la file jusqu'à la porte.
  var pays = $('#paysage'), sacs = [];
  (function () {
    var s = '<svg viewBox="0 0 2000 520" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg">';
    s += '<circle cx="1800" cy="262" r="58" fill="#ffd21f"/>';
    s += '<g class="g" style="--p:-14px"><path d="M40 440 L236 236 Q262 212 288 236 L484 440Z" fill="#30323d"/><path d="M470 440 L752 128 Q790 92 828 128 L1110 440Z" fill="#20212a"/><path d="M790 101 Q812 108 828 128 L1110 440 L930 440Z" fill="#2e303b"/><path d="M1180 440 L1386 204 Q1412 180 1438 204 L1644 440Z" fill="#272932"/><path d="M1412 186 Q1428 192 1438 204 L1644 440 L1520 440Z" fill="#353743"/></g>';
    s += '<g class="g" style="--p:-26px" fill="#2a3a4d"><rect x="1236" y="214" width="18" height="226"/><rect x="1302" y="214" width="18" height="226"/><path d="M1240 300 L1316 360 M1316 300 L1240 360 M1240 372 L1316 432 M1316 372 L1240 432" stroke="#2a3a4d" stroke-width="11" fill="none"/><path d="M1126 440 L1256 204 L1278 214 L1150 440Z"/><rect x="1214" y="196" width="130" height="22" rx="4"/>';
    s += '<g class="roue"><circle cx="1278" cy="150" r="44" fill="none" stroke="#2a3a4d" stroke-width="13"/><path d="M1278 108 V192 M1236 150 H1320" stroke="#2a3a4d" stroke-width="10"/><circle cx="1278" cy="150" r="11" fill="#e8392b"/></g></g>';
    s += '<g class="g" style="--p:-40px">';
    for (var x = -140, k = 0; x < 2140; x += 132, k++) {
      if (x > 800 && x < 1120) continue;
      var c = k % 2 ? '#b34a31' : '#a43f29';
      s += '<path d="M' + (x - 5) + ' 348 L' + (x + 14) + ' 310 H' + (x + 118) + ' L' + (x + 137) + ' 348Z" fill="#6b281e"/><rect x="' + (x + 88) + '" y="286" width="20" height="36" fill="#6b281e"/><rect x="' + x + '" y="346" width="132" height="94" fill="' + c + '"/>' +
        '<rect x="' + (x + 16) + '" y="366" width="30" height="34" rx="3" fill="#f6ecd6"/><rect x="' + (x + 86) + '" y="366" width="30" height="34" rx="3" fill="' + (k % 3 ? '#f6ecd6' : '#ffd21f') + '"/><rect x="' + (x + 52) + '" y="386" width="27" height="54" rx="3" fill="' + (k % 2 ? '#12308f' : '#0d6b4c') + '"/>';
      if (k % 4 === 1) s += '<circle class="fumee" cx="' + (x + 98) + '" cy="276" r="13" fill="#fff"/><circle class="fumee f2" cx="' + (x + 98) + '" cy="276" r="13" fill="#fff"/><circle class="fumee f3" cx="' + (x + 98) + '" cy="276" r="13" fill="#fff"/>';
    }
    // La sandwicherie, stylisée (ce n'est pas un portrait de la vraie devanture)
    s += '<path d="M858 300 L884 258 H1100 L1126 300Z" fill="#6b281e"/><rect x="866" y="298" width="252" height="142" fill="#fffdf6"/><rect x="866" y="298" width="252" height="50" fill="var(--encre)"/>' +
      '<text x="992" y="335" text-anchor="middle" textLength="224" lengthAdjust="spacingAndGlyphs" style="font:900 31px \'Big Shoulders Display\',Impact,sans-serif" fill="#fff">LA SANDWICHERIE DU LYCÉE</text>' +
      '<rect class="vitrine-l" x="884" y="366" width="134" height="56" rx="5" fill="#ffd21f"/><rect x="884" y="418" width="134" height="12" rx="3" fill="#e8392b"/><rect x="1040" y="364" width="58" height="76" rx="4" fill="var(--encre)"/><rect x="1050" y="374" width="38" height="30" rx="3" fill="#8fd3ff"/>' +
      '<rect x="1118" y="312" width="44" height="9" fill="#17171c"/><g class="enseigne"><rect x="1137" y="320" width="7" height="16" fill="#17171c"/><rect x="1108" y="334" width="66" height="56" rx="10" fill="#fffdf6" stroke="#17171c" stroke-width="6"/><rect x="1121" y="346" width="40" height="10" rx="5" fill="#d48a34"/><rect x="1118" y="357" width="46" height="6" rx="3" fill="#4fb23c"/><rect x="1121" y="364" width="40" height="6" rx="3" fill="#e8402f"/><rect x="1121" y="371" width="40" height="9" rx="4" fill="#d48a34"/></g></g>';
    s += '<rect x="-200" y="438" width="2400" height="22" fill="#9a9ca6"/><rect x="-200" y="458" width="2400" height="80" fill="#3a3c47"/>';
    for (var r = -160; r < 2200; r += 220) s += '<rect x="' + r + '" y="488" width="96" height="11" rx="3" fill="#f8f2e4"/>';
    var cs = ['#e8392b', '#ffd21f', '#0d8a61', '#ff8a1f', 'var(--encre)'];
    s += '<g id="file">' + cs.map(function (c) { return '<g class="sac"><rect x="-11" y="-77" width="22" height="20" rx="10" fill="none" stroke="' + c + '" stroke-width="7"/><rect x="-25" y="-66" width="50" height="66" rx="17" fill="' + c + '"/><rect x="-16" y="-34" width="32" height="24" rx="8" fill="rgba(255,255,255,.42)"/><rect x="-16" y="-52" width="32" height="7" rx="3.5" fill="rgba(0,0,0,.22)"/></g>'; }).join('') + '</g></svg>';
    pays.innerHTML = s; sacs = $$('.sac', pays);
  })();
  // Position du paysage gardée en mémoire (voir mesure()) : rien n'est relu pendant le défilement.
  var derP = -1;
  function file(y, H) {
    var P = M.pays; if (!P) return;
    var top = P.top - y; if (top + P.h < 0 || top > H) return;
    var ech = Math.max(P.w / 2000, P.h / 520), gauche = 1000 - P.w / ech / 2;
    var p = calme ? 1 : borne((H - top) / (H * .55 + P.h * .7), 0, 1);
    if (p === derP) return; derP = p;
    sacs.forEach(function (g, i) {
      var q = borne(p * 1.35 - i * .07, 0, 1); q = q * q * (3 - 2 * q);
      var a = gauche - 50 - i * 90, b = 1024 - i * 60, x = a + (b - a) * q, y = q < 1 ? -Math.abs(Math.sin(x / 26)) * 20 : 0;
      g.setAttribute('transform', 'translate(' + x.toFixed(1) + ',' + (446 + y).toFixed(1) + ')');
    });
  }
  $('#quartier').addEventListener('pointermove', function (e) { pays.style.setProperty('--mx', (e.clientX / innerWidth * 2 - 1).toFixed(3)); });

  // 17 h : le mot d'excuse, qui part en avion
  var papier = $('#papier'), occupe = false;
  $$('.trou', papier).forEach(function (b) {
    var L = C.mot[b.dataset.k], i = 0; b.textContent = L[0];
    function suivant() { i = (i + 1) % L.length; b.textContent = L[i]; relance(b, 'tic'); }
    b.addEventListener('click', suivant);
    b.addEventListener('keydown', function (e) { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); suivant(); } });
  });
  $('#m-go').addEventListener('click', function () {
    if (occupe) return; occupe = true; papier.classList.remove('revient'); papier.classList.add('signe');
    setTimeout(function () { papier.classList.add('avion'); }, calme ? 0 : 1050);
    setTimeout(function () {
      papier.classList.remove('signe', 'avion'); void papier.offsetWidth; papier.classList.add('revient'); occupe = false;
      $('#m-dit').textContent = 'Le mot est parti en avion. Pour de rire, bien sûr : sur votre vrai site, il peut devenir une commande à venir chercher.';
    }, calme ? 400 : 3100);
  });

  // L'accueil suit la souris
  var scene = $('#scene'), acc = $('#accueil');
  acc.addEventListener('pointermove', function (e) { if (e.pointerType === 'touch') return; scene.style.setProperty('--mx', (e.clientX / innerWidth * 2 - 1).toFixed(3)); scene.style.setProperty('--my', (e.clientY / innerHeight * 2 - 1).toFixed(3)); });

  // Le menu du téléphone
  var mb = $('#menu-b');
  function menu(o) { html.classList.toggle('menu-ouvert', o); mb.setAttribute('aria-expanded', o ? 'true' : 'false'); mb.textContent = o ? 'Fermer' : 'Menu'; }
  mb.addEventListener('click', function () { menu(!html.classList.contains('menu-ouvert')); });
  $$('#liens a').forEach(function (a, i) { a.style.setProperty('--i', i); a.addEventListener('click', function () { menu(false); }); });
  $('.marque').addEventListener('click', function () { menu(false); });

  // Les entrées de rubrique
  var aps = $$('main section:not(.accueil) .case-h, main section:not(.accueil) h2, .intro, .petit, .scores, main section:not(.accueil) .boutons, .plaque-adr, .fiche, .papier-zone, .table, .jour-lu, .casier, .edt, .bul-r, .pied-g > *');
  aps.forEach(function (el) { el.classList.add('ap'); var f = [].indexOf.call(el.parentNode.children, el); el.style.setProperty('--d', el.classList.contains('casier') || el.classList.contains('bul-r') ? f : Math.min(f, 4)); });
  if (calme) aps.forEach(function (el) { el.classList.add('vu'); });
  else { var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('vu'); io.unobserve(e.target); } }); }, { threshold: .12, rootMargin: '0px 0px -6% 0px' }); aps.forEach(function (el) { io.observe(el); }); }

  // Le défilement : l'heure de la journée avance, la sonnerie marque chaque rubrique, les bandes filent, les cartables avancent.
  var secs = $$('main section'), heures = secs.map(function (s) { return +s.dataset.h; }).concat([18]), liens = $$('#liens a'), cur = -1, hT = $('#heure-t'), filC = $('#fil-c'), fil = $('#fil'), derTxt = '', prevu = false;
  // Les positions sont mesurées une fois (chargement, polices, redimensionnement, changement de hauteur), jamais pendant le défilement.
  var fonds = $$('.fond-cases i', acc).map(function (i) { return { el: i, v: parseFloat(getComputedStyle(i).getPropertyValue('--v')) || 60 }; });
  function mesure() {
    var y = scrollY;
    M.secs = secs.map(function (s) { return { top: s.offsetTop, h: s.offsetHeight || 1 }; });
    M.max = doc.scrollingElement.scrollHeight - innerHeight;
    M.fil = fil.clientWidth;
    bandes.forEach(function (B) { var r = B.el.getBoundingClientRect(); B.top = r.top + y; B.bas = r.bottom + y; });
    var r = pays.getBoundingClientRect(); M.pays = { top: r.top + y, h: r.height, w: r.width }; derP = -1;
  }
  function maj() {
    prevu = false;
    var y = scrollY, H = innerHeight, ligne = y + H * .42, i = 0, max = M.max;
    for (var k = 0; k < secs.length; k++) if (M.secs[k].top <= ligne) i = k;
    var s = secs[i], f = borne((ligne - M.secs[i].top) / M.secs[i].h, 0, 1), h = heures[i] + (heures[i + 1] - heures[i]) * f;
    if (y <= 2) h = 8; if (y >= max - 2) h = 18;
    var mn = Math.round(h * 60 / 5) * 5, txt = ('0' + Math.floor(mn / 60)).slice(-2) + ':' + ('0' + mn % 60).slice(-2);
    if (txt !== derTxt) { hT.textContent = txt; derTxt = txt; }
    if (i !== cur) {
      if (cur !== -1 && !calme) { relance(heure, 'sonne'); }
      cur = i; liens.forEach(function (a) { a.classList.toggle('ici', a.getAttribute('href') === '#' + s.id); });
    }
    filC.style.transform = 'translateX(' + (borne(y / Math.max(1, max), 0, 1) * M.fil).toFixed(1) + 'px)';
    // Le fond de l'accueil : transform écrit directement (avant, une variable --sy recalculait tout l'accueil à chaque image).
    if (y < H * 1.3) { var sy = y / H; fonds.forEach(function (F) { F.el.style.transform = 'translateY(' + (sy * F.v).toFixed(1) + 'px)'; }); scene.style.transform = 'translateY(' + (sy * -70).toFixed(1) + 'px)'; }
    if (!calme) bandes.forEach(function (B) {
      var top = B.top - y; if (B.bas - y < -50 || top > H + 50) return;
      var d = ((H - top) * .5) % B.w; B.d.style.transform = 'translateX(' + (B.sens < 0 ? -d : d - B.w).toFixed(1) + 'px)';
    });
    file(y, H);
  }
  function demande() { if (!prevu) { prevu = true; requestAnimationFrame(maj); } }
  addEventListener('scroll', demande, { passive: true });
  addEventListener('resize', function () { mesureBandes(); regle(); if (G.etat === 'repos') demo(); mesure(); demande(); });
  mesureBandes(); mesure(); maj();
  if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(function () { mesureBandes(); mesure(); maj(); });
  // Une rubrique qui change de hauteur (texte du mot, fiche du jour) : on remesure, une fois.
  if (window.ResizeObserver) new ResizeObserver(function () { mesure(); demande(); }).observe($('#main'));

  // Les animations sans fin des rubriques loin de l'écran sont mises en pause (classe « hors »), et repartent avant d'y revenir.
  var ioH = new IntersectionObserver(function (es) { es.forEach(function (e) { e.target.classList.toggle('hors', !e.isIntersecting); }); }, { rootMargin: '150px 0px' });
  secs.forEach(function (s) { ioH.observe(s); });

  // Page Bonjour : on prévient le cadre
  addEventListener('scroll', function un() { removeEventListener('scroll', un); try { if (parent !== window) parent.postMessage({ type: 'kazura-defile' }, '*'); } catch (x) {} }, { passive: true });
  addEventListener('load', function () { setTimeout(function () { try { if (parent !== window) parent.postMessage({ type: 'kazura-pret' }, '*'); } catch (x) {} }, 200); });
})();
