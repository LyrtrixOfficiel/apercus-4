// La Frite Pochée : la baraque à frites. Le contenu propre au commerce vient de contenu.js.
// Le mouvement joue toujours en entier : on ne lit jamais le réglage « animations réduites » du système.
// Mode calme seulement sur demande, avec ?calme=1 (classe calme sur html).
(function () {
  'use strict';
  var C = window.CONTENU, D = document, H = D.documentElement;
  var calme = H.classList.contains('calme');
  var $ = function (s, p) { return (p || D).querySelector(s); };
  var $$ = function (s, p) { return Array.prototype.slice.call((p || D).querySelectorAll(s)); };
  var borne = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var seg = function (p, a, b) { return borne((p - a) / (b - a), 0, 1); };
  var doux = function (t) { return t * t * (3 - 2 * t); };
  var graine = 11; function alea() { graine = (graine * 16807) % 2147483647; return (graine - 1) / 2147483646; }
  var entre = function (a, b) { return a + (b - a) * alea(); };

  /* ---------- Couleurs, liens, menu ---------- */
  function palette(nom) {
    var P = C.palettes[nom]; if (!P) return;
    for (var k in P) H.style.setProperty('--' + k, P[k]);
    var m = $('meta[name=theme-color]'); if (m) m.content = P.rouge;
  }
  palette(new URLSearchParams(location.search).get('palette') || 'ketchup');
  addEventListener('message', function (e) { if (e.data && e.data.type === 'kazura-couleur') palette(e.data.palette); });
  $$('[data-itin]').forEach(function (a) { a.href = C.carteLien; });

  var liens = $('#liens'), menuB = $('#menu-b');
  menuB.addEventListener('click', function () { var o = liens.classList.toggle('ouvert'); menuB.setAttribute('aria-expanded', o); menuB.textContent = o ? 'Fermer' : 'Menu'; });
  liens.addEventListener('click', function (e) { if (e.target.closest('a')) { liens.classList.remove('ouvert'); menuB.setAttribute('aria-expanded', 'false'); menuB.textContent = 'Menu'; } });

  /* ---------- Accueil : le titre plonge et dore, le cornet se remplit ---------- */
  $('#t2').innerHTML = 'Pochée'.split('').map(function (l, i) { return '<span style="--i:' + i + ';--r:' + entre(-16, 16).toFixed(1) + 'deg">' + l + '</span>'; }).join('');

  var cornet = $('#cornet'), boiteFrites = $('#frites'), frites = [], piquees = 0, msgPique = $('#pique');
  (function () {
    var plan = [], n = 12, i;
    for (i = 0; i < n; i++) { var t = i / (n - 1) * 2 - 1; plan.push({ x: t * 5.1, a: t * 31 + entre(-4, 4), l: 15.6 - Math.abs(t) * 3.4 + entre(-1.1, 1.1) }); }
    for (i = 0; i < 6; i++) { var t2 = i / 5 * 2 - 1; plan.push({ x: t2 * 3.6 + entre(-.4, .4), a: t2 * 20 + entre(-5, 5), l: 10.6 - Math.abs(t2) * 1.6 + entre(-.8, .8) }); }
    var ordre = plan.map(function (_, k) { return k; }).sort(function () { return alea() - .5; });
    plan.forEach(function (f, k) {
      var el = D.createElement('div'); el.className = 'fr';
      el.style.cssText = '--x:' + f.x.toFixed(2) + ';--a:' + f.a.toFixed(1) + 'deg;--l:' + f.l.toFixed(2) + ';--d:' + (calme ? 0 : .7 + ordre.indexOf(k) * .085).toFixed(2) + 's';
      el.innerHTML = '<span><i></i></span>';
      boiteFrites.appendChild(el);
      var r = f.a * Math.PI / 180;
      frites.push({ el: el, i: el.firstChild.firstChild, mx: 13 + f.x + Math.sin(r) * f.l * .62, my: 17.6 - Math.cos(r) * f.l * .62, rot: 0, vit: 0, cible: 0, vol: entre(.25, 1), tour: entre(-50, 50) });
    });
    var m = D.createElement('div'); m.className = 'mayo-tas'; boiteFrites.appendChild(m);
    var f = D.createElement('div'); f.className = 'fourche-cornet'; boiteFrites.appendChild(f);
  })();

  var defileAccueil = 0, boucleFrites = 0;
  function animeFrites() {
    var bouge = false;
    frites.forEach(function (f) {
      f.vit += (f.cible - f.rot) * .14; f.vit *= .78; f.rot += f.vit;
      if (Math.abs(f.vit) > .02 || Math.abs(f.cible - f.rot) > .05) bouge = true;
      f.i.style.transform = 'translateY(' + (-defileAccueil * f.vol).toFixed(1) + 'px) rotate(' + (f.rot + defileAccueil * f.tour / 400).toFixed(2) + 'deg)';
    });
    boucleFrites = bouge ? requestAnimationFrame(animeFrites) : 0;
  }
  function lanceFrites() { if (!boucleFrites) boucleFrites = requestAnimationFrame(animeFrites); }
  if (!calme) {
    $('#cornet-zone').addEventListener('pointermove', function (e) {
      var r = cornet.getBoundingClientRect(), u = r.width / 26, x = (e.clientX - r.left) / u, y = (e.clientY - r.top) / u;
      frites.forEach(function (f) { var dx = f.mx - x, dy = f.my - y, d = Math.sqrt(dx * dx + dy * dy); f.cible = d < 7 ? (dx >= 0 ? 1 : -1) * (1 - d / 7) * 20 : 0; });
      lanceFrites();
    });
    $('#cornet-zone').addEventListener('pointerleave', function () { frites.forEach(function (f) { f.cible = 0; }); lanceFrites(); });
  }
  boiteFrites.addEventListener('click', function (e) {
    var el = e.target.closest('.fr'); if (!el || el.classList.contains('piquee')) return;
    el.classList.add('piquee'); piquees++;
    msgPique.textContent = piquees === 1 ? 'Une frite piquée.' : piquees < 5 ? piquees + ' frites piquées.' : piquees < 9 ? piquees + ' frites. Gourmand !' : piquees + ' frites. Laissez-en un peu !';
    msgPique.classList.remove('hop'); void msgPique.offsetWidth; msgPique.classList.add('hop');
    setTimeout(function () { el.style.setProperty('--d', '0s'); el.classList.remove('piquee'); var s = el.firstChild; s.style.animation = 'none'; void s.offsetWidth; s.style.animation = ''; }, calme ? 300 : 1500);
  });

  /* ---------- Coulures de sauce ---------- */
  var coulures = $$('[data-coulure]');
  function poseCoulures() {
    coulures.forEach(function (c) {
      var n = borne(Math.round(innerWidth / 120), 5, 15), h = '', x = entre(1, 5), i;
      for (i = 0; i < n; i++) { var w = entre(26, 64); h += '<i style="--g:' + x.toFixed(1) + '%;--w:' + w.toFixed(0) + 'px;--h:' + entre(innerWidth < 700 ? 22 : 34, innerWidth < 700 ? 66 : 150).toFixed(0) + 'px"></i>'; x += 100 / n + entre(-2.5, 2.5); }
      c.innerHTML = h;
    });
  }
  poseCoulures();

  /* ---------- Entrées ---------- */
  var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('vu'); io.unobserve(e.target); } }); }, { threshold: .16 });

  /* ---------- La carte : trois feuilles sur le comptoir ---------- */
  $('#feuilles').innerHTML = C.familles.map(function (f, i) {
    var l = ''; for (var k = 0; k < f.lignes; k++) l += '<li><span></span><b>.. , .. €</b></li>';
    return '<article class="feuille" data-entre style="--r:' + [-3, 2, -1.5][i] + 'deg;--y:' + [0, 26, 8][i] + 'px;--i:' + i + '"><i class="ruban" style="transform:rotate(' + [-4, 3, -2][i] + 'deg)"></i>' +
      '<figure><img src="photos/' + f.photo + '.webp" alt="' + f.alt + '" loading="lazy" width="1500" height="1119"><figcaption>Image d’illustration</figcaption></figure>' +
      '<h3>' + f.titre + '</h3><p class="phrase">' + f.phrase + '</p><ul class="lignes">' + l + '</ul><p class="avec">À compléter avec vous</p></article>';
  }).join('');

  /* ---------- Horaires : l'horloge à fourchettes ---------- */
  var semaine = $('#semaine');
  semaine.innerHTML = C.jours.map(function (j, i) { return '<li style="--i:' + i + '"><b>' + j + '</b><span></span><em>.. h .. à .. h ..</em></li>'; }).join('');
  (function () {
    var h = '', i;
    for (i = 0; i < 12; i++) h += i % 3 === 0 ? '<rect class="h-tic gros" x="-7" y="-166" width="14" height="30" rx="4" transform="rotate(' + i * 30 + ')"/>' : '<rect class="h-tic" x="-5" y="-164" width="10" height="20" rx="4" transform="rotate(' + i * 30 + ')"/>';
    [[12, 0, -98], [3, 112, 14], [6, 0, 126], [9, -112, 14]].forEach(function (c) { h += '<text class="h-chiffre" x="' + c[1] + '" y="' + c[2] + '">' + c[0] + '</text>'; });
    $('#h-heures').innerHTML = h;
  })();
  var horloge = { vue: false, ici: true, s: 0, m: 0, h: 0, ps: -1 }, fmt = null;
  try { fmt = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', hour: 'numeric', minute: 'numeric', second: 'numeric', weekday: 'long', hour12: false }); } catch (x) {}
  function heureAuby() {
    var o = { h: 0, m: 0, s: 0, j: '' }, d = new Date();
    if (fmt && fmt.formatToParts) fmt.formatToParts(d).forEach(function (p) { if (p.type === 'hour') o.h = +p.value % 24; else if (p.type === 'minute') o.m = +p.value; else if (p.type === 'second') o.s = +p.value; else if (p.type === 'weekday') o.j = p.value; });
    else { o.h = d.getHours(); o.m = d.getMinutes(); o.s = d.getSeconds(); o.j = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'][d.getDay()]; }
    return o;
  }
  var heureEl = $('#heure'), joursLi = null;
  function tic() {
    // rubrique loin de l'écran : on ne touche à rien, tout est remis à l'heure dès qu'elle revient
    if (!horloge.ici) return;
    var t = heureAuby(), txt = 'Il est ' + t.h + ' h ' + (t.m < 10 ? '0' : '') + t.m + ' à Auby.';
    if (heureEl.textContent !== txt) heureEl.textContent = txt;
    joursLi = joursLi || $$('li', semaine);
    joursLi.forEach(function (li) { li.classList.toggle('jour', li.firstChild.textContent.toLowerCase() === t.j); });
    if (!horloge.vue) return;
    if (horloge.ps >= 0 && t.s < horloge.ps) horloge.s += 360;
    horloge.ps = t.s;
    $('#h-seconde').style.transform = 'rotate(' + (horloge.s + t.s * 6) + 'deg)';
    $('#h-grande').style.transform = 'rotate(' + (t.m * 6 + t.s / 10) + 'deg)';
    $('#h-petite').style.transform = 'rotate(' + ((t.h % 12) * 30 + t.m / 2) + 'deg)';
  }
  tic(); setInterval(tic, 1000);
  new IntersectionObserver(function (es, o) { if (es[0].isIntersecting) { horloge.vue = true; tic(); o.disconnect(); } }, { threshold: .4 }).observe($('#horloge'));

  /* ---------- Venir : la rue, la mairie en face, la nuit qui tombe ---------- */
  var rue = $('#rue'), venir = $('#venir');
  (function () {
    var s = '<circle class="soleil" cx="1560" cy="170" r="64" fill="#ffc326"/>', lu = '', x, k = 0;
    function terril(x0, xs, x1, ys, c, c2) { s += '<path fill="' + c + '" d="M' + x0 + ' 380 L' + (xs - 30) + ' ' + (ys + 18) + ' Q' + xs + ' ' + ys + ' ' + (xs + 30) + ' ' + (ys + 18) + ' L' + x1 + ' 380Z"/><path fill="' + c2 + '" d="M' + (xs + 6) + ' ' + (ys + 8) + ' Q' + (xs + 16) + ' ' + (ys + 6) + ' ' + (xs + 30) + ' ' + (ys + 18) + ' L' + x1 + ' 380 L' + (xs + 110) + ' 380Z"/>'; }
    terril(180, 600, 1040, 96, '#7a5564', '#684555'); terril(1420, 1800, 2180, 150, '#8a6270', '#75505f'); terril(-200, 60, 360, 210, '#8a6270', '#75505f'); terril(2080, 2330, 2600, 200, '#7a5564', '#684555');
    function maisons(a, b) {
      for (x = a; x < b; x += 78) {
        var h = 62 + (k % 3) * 9, y = 380 - h, c = k % 2 ? '#a8452b' : '#96391f';
        s += '<rect x="' + x + '" y="' + y + '" width="78" height="' + h + '" fill="' + c + '"/><path fill="#57261c" d="M' + (x - 3) + ' ' + y + ' L' + (x + 39) + ' ' + (y - 30) + ' L' + (x + 81) + ' ' + y + 'Z"/><rect x="' + (x + 56) + '" y="' + (y - 34) + '" width="11" height="26" fill="#57261c"/>' +
          '<rect x="' + (x + 12) + '" y="' + (y + 14) + '" width="20" height="26" rx="2" fill="#4a3350"/><rect x="' + (x + 46) + '" y="' + (y + 14) + '" width="20" height="26" rx="2" fill="#4a3350"/>';
        if (k % 3 === 0) lu += '<rect x="' + (x + 12) + '" y="' + (y + 14) + '" width="20" height="26" rx="2" fill="#ffd257"/>';
        if (k % 4 === 1) lu += '<rect x="' + (x + 46) + '" y="' + (y + 14) + '" width="20" height="26" rx="2" fill="#ffc326"/>';
        k++;
      }
    }
    maisons(-20, 900); maisons(1500, 2420);
    // la mairie
    s += '<rect x="928" y="366" width="244" height="14" fill="#d9c7a6"/><rect x="946" y="214" width="208" height="154" fill="#f3e3c3"/><path fill="#e2cda2" d="M934 216 L1050 156 L1166 216Z"/><rect x="934" y="212" width="232" height="12" fill="#d9c7a6"/>' +
      '<circle cx="1050" cy="192" r="15" fill="#fffaf0"/><path d="M1050 192 V182 M1050 192 H1058" stroke="#3b1a0b" stroke-width="4" stroke-linecap="round"/>';
    [962, 1004, 1082, 1124].forEach(function (c) { s += '<rect x="' + c + '" y="250" width="14" height="118" fill="#fffaf0"/>'; });
    s += '<path fill="#6a3517" d="M1032 368 V318 A18 18 0 0 1 1068 318 V368Z"/>';
    [[980, 262], [1102, 262], [980, 316], [1102, 316]].forEach(function (w) { s += '<rect x="' + w[0] + '" y="' + w[1] + '" width="20" height="36" rx="3" fill="#4a3350"/>'; lu += '<rect x="' + w[0] + '" y="' + w[1] + '" width="20" height="36" rx="3" fill="#ffd257"/>'; });
    s += '<rect x="996" y="226" width="108" height="26" rx="5" fill="#3b1a0b"/><text x="1050" y="247" font-size="20" text-anchor="middle" fill="#ffc326">MAIRIE</text>' +
      '<rect x="1047" y="92" width="6" height="70" fill="#6a3517"/><g class="drapeau"><rect x="1053" y="96" width="15" height="30" fill="#1d4fb3"/><rect x="1068" y="96" width="15" height="30" fill="#fffaf0"/><rect x="1083" y="96" width="15" height="30" fill="#d8281b"/></g>';
    // la friterie
    s += '<rect x="1220" y="232" width="244" height="148" fill="#b8472b"/><rect x="1212" y="222" width="260" height="14" fill="#57261c"/><rect x="1238" y="300" width="132" height="58" rx="4" fill="#4a3350"/><rect x="1388" y="296" width="56" height="84" rx="4" fill="#6a3517"/><rect x="1424" y="200" width="16" height="24" fill="#59636a"/>';
    lu += '<rect x="1238" y="300" width="132" height="58" rx="4" fill="#ffd257"/><rect x="1238" y="338" width="132" height="20" fill="#f2a20c"/><rect x="1396" y="304" width="40" height="34" rx="3" fill="#ffc326"/>';
    for (x = 0; x < 10; x++) { var c2 = x % 2 ? '#fffaf0' : 'var(--rouge)'; s += '<rect x="' + (1226 + x * 23.2) + '" y="264" width="23.4" height="22" style="fill:' + c2 + '"/><circle cx="' + (1237.6 + x * 23.2) + '" cy="286" r="11.6" style="fill:' + c2 + '"/>'; }
    // la rue
    s += '<rect x="-100" y="374" width="2600" height="10" fill="#d9c7a6"/><rect x="-100" y="382" width="2600" height="60" fill="#5a4350"/>';
    for (x = 0; x < 2400; x += 170) if (x < 1140 || x > 1260) s += '<rect x="' + x + '" y="408" width="70" height="9" rx="3" fill="#fff3d6" opacity=".75"/>';
    for (x = 0; x < 4; x++) s += '<rect x="' + (1172 + x * 14) + '" y="388" width="9" height="48" fill="#fff3d6"/>';
    [880, 1516].forEach(function (p) { s += '<rect x="' + p + '" y="246" width="8" height="134" fill="#3b1a0b"/><rect x="' + p + '" y="246" width="40" height="8" fill="#3b1a0b"/><rect x="' + (p + 26) + '" y="252" width="20" height="11" rx="3" fill="#ffc326"/>'; lu += '<path d="M' + (p + 27) + ' 262 L' + (p + 45) + ' 262 L' + (p + 96) + ' 380 L' + (p - 24) + ' 380Z" fill="#ffd257" opacity=".3"/><rect x="' + (p + 24) + '" y="250" width="24" height="15" rx="4" fill="#fff3d6"/>'; });
    for (x = 0; x < 6; x++) lu += '<circle class="ampoule" style="--i:' + x + '" cx="' + (1250 + x * 36) + '" cy="194" r="8" fill="#ffe58a"/>';
    var haut = '<rect x="1232" y="196" width="216" height="38" rx="7" style="fill:var(--rouge)"/><text x="1340" y="225" font-size="22" text-anchor="middle" fill="#fff3d6">LA FRITE POCHÉE</text><g class="enseigne-cornet">';
    [-34, -17, 0, 17, 34].forEach(function (a) { haut += '<rect x="1335" y="104" width="11" height="48" rx="3" fill="' + (a % 2 ? '#ffc326' : '#f9b72c') + '" transform="rotate(' + a + ' 1340 158)"/>'; });
    haut += '<path fill="#fffaf0" d="M1312 146 L1368 146 L1340 198Z"/><path fill="#ecdcb8" d="M1350 146 L1368 146 L1340 198Z"/></g>';
    for (x = 0; x < 3; x++) haut += '<circle class="fumee" style="--i:' + x + '" cx="1432" cy="194" r="15" fill="#fff7e6"/>';
    rue.innerHTML = '<svg viewBox="0 80 2400 360" preserveAspectRatio="xMidYMax slice" focusable="false">' + s + '<rect class="nuit" x="-100" y="-400" width="2600" height="860"/><g class="lueurs">' + lu + '</g>' + haut + '</svg>';
  })();
  // La nuit est écrite sur ces quatre éléments seulement, pas sur toute la rubrique : sinon chaque image recalcule les styles de toute la rue.
  var nuitEls = [$('.voile-nuit', venir), $('.nuit', rue), $('.lueurs', rue), $('.soleil', rue)];

  /* ---------- Les deux bains : la scène épinglée ---------- */
  var bains = $('#bains'), zone = $('#plateau-zone'), plateau = $('#plateau'), panier = $('#panier'), manche = $('#manche'), chariot = $('#chariot');
  var legendes = $$('.legende'), jaugeF = $('#jauge-f'), jaugeC = $('#jauge-c'), jaugeBarre = $('.jauge-barre'), tampon = $('#tampon'), huile1 = $('.bac-1 .huile'), huile2 = $('.bac-2 .huile'), pDernier = -1;
  // Dernières valeurs écrites : on n'écrit dans le style que ce qui a changé (chaque écriture relance le calcul des styles).
  var ecrit = { k: -1, b1: '', b2: '', jx: -1 }, geo = { jW: 0 };
  (function () {
    var h = '', i;
    for (i = 0; i < 9; i++) h += '<i class="pf" style="--g:' + (i * 16.4 + entre(-2, 2)).toFixed(1) + 'px;--l:' + entre(128, 174).toFixed(0) + 'px;--a:' + entre(-9, 9).toFixed(1) + 'deg"></i>';
    $('#panier-frites').innerHTML = h;
  })();
  function taillePlateau() { plateau.style.setProperty('--e', Math.max(.3, Math.min(zone.clientWidth / 640, zone.clientHeight / 560, 1.3)).toFixed(3)); }
  var TEINTES = [[0, [246, 236, 208]], [.45, [244, 222, 138]], [1, [243, 166, 20]]];
  function teinte(k, f) {
    var a = TEINTES[k < .45 ? 0 : 1], b = TEINTES[k < .45 ? 1 : 2], t = (k - a[0]) / (b[0] - a[0]);
    return 'rgb(' + a[1].map(function (v, i) { var c = v + (b[1][i] - v) * t; return Math.round(f > 1 ? c + (255 - c) * (f - 1) : c * f); }).join(',') + ')';
  }
  function majBains(p) {
    if (Math.abs(p - pDernier) < .0005) return; pDernier = p;
    var bas = doux(seg(p, .05, .16)) - doux(seg(p, .32, .41)) + doux(seg(p, .54, .63)) - doux(seg(p, .81, .89));
    var x = doux(seg(p, .42, .53)), k = .45 * seg(p, .13, .33) + .55 * seg(p, .61, .82);
    var px = x * 316, py = 96 + bas * 206;
    panier.style.transform = 'translate(' + px.toFixed(1) + 'px,' + py.toFixed(1) + 'px)';
    chariot.style.transform = 'translateX(' + px.toFixed(1) + 'px)';
    manche.style.transform = 'translateX(' + px.toFixed(1) + 'px) scaleY(' + ((py - 56) / 100).toFixed(3) + ')';
    // la couleur des frites ne change que pendant les deux bains : 200 crans suffisent à l'œil
    var kq = Math.round(k * 200) / 200;
    if (kq !== ecrit.k) {
      ecrit.k = kq;
      panier.style.setProperty('--frite', teinte(kq, 1)); panier.style.setProperty('--frite-o', teinte(kq, .86)); panier.style.setProperty('--frite-l', teinte(kq, 1.5));
      jaugeF.style.setProperty('--k', kq.toFixed(3));
    }
    var b1 = (x < .5 ? .2 + .8 * bas : .2).toFixed(2), b2 = (x >= .5 ? .25 + .75 * bas : .25).toFixed(2);
    if (b1 !== ecrit.b1) { ecrit.b1 = b1; huile1.style.setProperty('--b', b1); }
    if (b2 !== ecrit.b2) { ecrit.b2 = b2; huile2.style.setProperty('--b', b2); }
    var jx = Math.round(kq * geo.jW * 2) / 2;
    if (jx !== ecrit.jx) { ecrit.jx = jx; jaugeC.style.transform = 'translateX(' + jx + 'px)'; }
    panier.classList.toggle('egoutte', (p > .34 && p < .5) || (p > .83 && p < .93));
    panier.classList.toggle('chante', p > .6 && p < .82);
    panier.classList.toggle('fume', p > .85);
    tampon.classList.toggle('pose', p > .92);
    var n = p < .32 ? 0 : p < .54 ? 1 : p < .82 ? 2 : 3;
    legendes.forEach(function (l, i) { l.classList.toggle('actif', i === n); l.classList.toggle('passe', i < n); });
  }

  /* ---------- Les sauces : le jeu ---------- */
  var toile = $('#toile'), ctx = toile.getContext('2d'), barquette = $('#barquette'), boiteBF = $('#barquette-frites'), flacons = $('#flacons'), verdict = $('#verdict'), deborde = $('#deborde');
  var sauce = null, dose = 0, mises = [], aJoue = false, appui = false, dernier = null, file = [], R = 14, demo = 0, lt = 0, ht = 0;
  flacons.innerHTML = C.sauces.map(function (s) { return '<button class="flacon" type="button" data-s="' + s.id + '" style="--c:' + s.c + ';--o:' + s.o + ';--l:' + s.l + '" aria-pressed="false"><i class="bec"></i><i class="col"></i><i class="corps"></i><span>' + s.nom + '</span></button>'; }).join('');
  function semeFrites() {
    var h = '', i;
    for (i = 0; i < 30; i++) h += '<i class="bf" style="--g:' + entre(12, 88).toFixed(1) + '%;--h:' + entre(12, 88).toFixed(1) + '%;--l:' + entre(26, 44).toFixed(1) + '%;--a:' + entre(-80, 80).toFixed(0) + 'deg"></i>';
    boiteBF.innerHTML = h;
  }
  function tailleToile() {
    var r = toile.getBoundingClientRect(), d = Math.min(2, window.devicePixelRatio || 1);
    if (!r.width || (Math.abs(r.width - lt) < 2 && Math.abs(r.height - ht) < 2)) return;
    lt = r.width; ht = r.height; toile.width = Math.round(lt * d); toile.height = Math.round(ht * d); ctx.setTransform(d, 0, 0, d, 0, 0); R = Math.max(8, lt * .028);
    dose = 0; mises = []; file = []; deborde.classList.remove('pose'); dit();
  }
  function choisir(id) {
    sauce = C.sauces.filter(function (s) { return s.id === id; })[0] || C.sauces[0];
    $$('.flacon', flacons).forEach(function (b) { var o = b.dataset.s === sauce.id; b.classList.toggle('choisi', o); b.setAttribute('aria-pressed', o); });
  }
  function presse(o) { var b = $('.flacon.choisi', flacons); $$('.flacon', flacons).forEach(function (f) { f.classList.remove('presse'); }); if (b && o) b.classList.add('presse'); }
  function rond(x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill(); }
  function reflet(q) { ctx.globalAlpha = .7; ctx.fillStyle = q.s.l; rond(q.x - q.r * .3, q.y - q.r * .34, q.r * .3); ctx.globalAlpha = 1; }
  function pose(x, y) {
    var r = R * entre(.84, 1.16);
    ctx.fillStyle = sauce.o; rond(x, y + r * .3, r); ctx.fillStyle = sauce.c; rond(x, y, r);
    file.push({ x: x, y: y, r: r, s: sauce }); if (file.length > 4) reflet(file.shift());
    dose++; if (mises.indexOf(sauce.nom) < 0) mises.push(sauce.nom);
  }
  function trait(a, b) { var d = Math.hypot(b.x - a.x, b.y - a.y), n = Math.max(1, Math.round(d / (R * .42))), i; if (d < R * .2) return false; for (i = 1; i <= n; i++) pose(a.x + (b.x - a.x) * i / n, a.y + (b.y - a.y) * i / n); return true; }
  function finTrait() { while (file.length) reflet(file.shift()); }
  var verdictDit = '';
  function ecritVerdict(h) { if (h !== verdictDit) { verdictDit = h; verdict.innerHTML = h; } }   // seulement quand la phrase change
  function dit() {
    if (!mises.length) { ecritVerdict('<b>Barquette nature.</b> <span>Rien dessus, pour l’instant.</span>'); return; }
    var noms = mises.map(function (n, i) { return i ? n.toLowerCase() : n; });
    var liste = noms.length === 1 ? noms[0] : noms.slice(0, -1).join(', ') + ' et ' + noms[noms.length - 1];
    var mot = dose < 60 ? 'Une touche, pour goûter.' : dose < 240 ? 'Honnête.' : dose < 560 ? 'Généreux, comme on aime.' : 'Là, ça déborde !';
    ecritVerdict('<b>' + liste + '.</b> <span>' + mot + '</span>');
    if (dose >= 560 && !deborde.classList.contains('pose')) { deborde.classList.add('pose'); barquette.classList.remove('secoue'); void barquette.offsetWidth; barquette.classList.add('secoue'); }
  }
  function point(e) { var r = toile.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
  flacons.addEventListener('click', function (e) { var b = e.target.closest('.flacon'); if (!b) return; arreteDemo(); aJoue = true; choisir(b.dataset.s); presse(true); setTimeout(function () { presse(false); }, 220); });
  toile.addEventListener('pointerdown', function (e) {
    arreteDemo(); aJoue = true; if (!sauce) choisir('mayo');
    appui = true; try { toile.setPointerCapture(e.pointerId); } catch (x) {}
    dernier = point(e); pose(dernier.x, dernier.y); presse(true); dit(); e.preventDefault();
  });
  toile.addEventListener('pointermove', function (e) { if (!appui) return; var p = point(e); if (Math.hypot(p.x - dernier.x, p.y - dernier.y) < R * .3) return; trait(dernier, p); dernier = p; dit(); });
  function leve() { if (!appui) return; appui = false; finTrait(); presse(false); }
  toile.addEventListener('pointerup', leve); toile.addEventListener('pointercancel', leve); toile.addEventListener('lostpointercapture', leve);
  $('#vider').addEventListener('click', function () {
    arreteDemo(); aJoue = true; ctx.clearRect(0, 0, lt, ht); dose = 0; mises = []; file = []; deborde.classList.remove('pose'); semeFrites(); dit();
    barquette.classList.remove('secoue'); void barquette.offsetWidth; barquette.classList.add('secoue');
  });
  function arreteDemo() { if (demo) { cancelAnimationFrame(demo); demo = 0; finTrait(); presse(false); } }
  function lanceDemo() {
    if (aJoue || demo || dose) return;
    tailleToile();
    var t0 = 0, prec = null, passes = [
      { s: 'mayo', d: 1700, f: function (t) { return { x: lt * (.14 + .72 * t), y: ht * (.4 + Math.sin(t * 15.7) * .16) }; } },
      { s: 'ketchup', d: 1300, f: function (t) { return { x: lt * (.84 - .62 * t), y: ht * (.68 + Math.sin(t * 12.6) * .1) }; } }], n = 0;
    if (calme) { passes.forEach(function (ps) { choisir(ps.s); var a = ps.f(0), i; for (i = 1; i <= 60; i++) { var b = ps.f(i / 60); trait(a, b); a = b; } finTrait(); }); dit(); return; }
    function pas(t) {
      if (!t0) { t0 = t; choisir(passes[n].s); presse(true); prec = passes[n].f(0); }
      var q = Math.min(1, (t - t0) / passes[n].d), p = passes[n].f(q);
      if (trait(prec, p)) { prec = p; dit(); }
      if (q >= 1) { finTrait(); presse(false); n++; t0 = 0; if (n >= passes.length) { demo = 0; return; } }
      demo = requestAnimationFrame(pas);
    }
    demo = requestAnimationFrame(pas);
  }
  semeFrites();
  new IntersectionObserver(function (es, o) { if (es[0].isIntersecting) { o.disconnect(); setTimeout(lanceDemo, calme ? 0 : 700); } }, { threshold: .55 }).observe(barquette);

  /* ---------- La haie de frites du pied, et les photos qui penchent sous la souris ---------- */
  var haie = $('#haie'), brins = [], boucleHaie = 0, yPrec = scrollY;
  function plante() {
    var h = '', n = Math.round(innerWidth / 26), i;
    for (i = 0; i < n; i++) h += '<i style="--g:' + (i / n * 100 + entre(-.6, .6)).toFixed(2) + '%;--w:' + entre(15, 23).toFixed(0) + 'px;--h:' + entre(44, 118).toFixed(0) + 'px"></i>';
    haie.innerHTML = h;
    brins = $$('i', haie).map(function (el, i) { return { el: el, x: (i + .5) / n, base: entre(-7, 7), rot: 0, vit: 0, cible: 0 }; });
    brins.forEach(function (b) { b.el.style.transform = 'rotate(' + b.base.toFixed(1) + 'deg)'; });
  }
  function animeHaie() {
    var bouge = false;
    brins.forEach(function (b) {
      b.vit += (b.cible - b.rot) * .1; b.vit *= .84; b.rot += b.vit;
      if (Math.abs(b.vit) > .03 || Math.abs(b.cible - b.rot) > .08) bouge = true;
      b.el.style.transform = 'rotate(' + (b.base + b.rot).toFixed(2) + 'deg)';
    });
    boucleHaie = bouge ? requestAnimationFrame(animeHaie) : 0;
  }
  function lanceHaie() { if (!boucleHaie) boucleHaie = requestAnimationFrame(animeHaie); }
  plante();
  if (!calme) {
    addEventListener('pointermove', function (e) {
      // positions gardées en mémoire par le moteur de défilement : aucune lecture de mise en page à chaque mouvement de souris
      var top = geo.hT - scrollY, bas = geo.hB - scrollY; if (top > innerHeight || bas < 0) return;
      var pres = e.clientY > top - 60 && e.clientY < bas + 90, x = e.clientX / geo.hW;
      brins.forEach(function (b) { var d = (b.x - x) * geo.hW; b.cible = pres && Math.abs(d) < 150 ? (d >= 0 ? 1 : -1) * (1 - Math.abs(d) / 150) * 34 : 0; });
      lanceHaie();
    }, { passive: true });
    $$('.tirage, .feuille').forEach(function (el) {
      var im = $('img', el);
      el.addEventListener('pointermove', function (e) { if (e.pointerType === 'touch') return; var r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; im.style.transform = 'perspective(700px) rotateY(' + (x * 12).toFixed(1) + 'deg) rotateX(' + (-y * 10).toFixed(1) + 'deg) scale(1.04)'; });
      el.addEventListener('pointerleave', function () { im.style.transform = ''; });
    });
  }

  /* ---------- Le défilement : un seul moteur ---------- */
  // Les positions sont mesurées une fois (chargement, redimensionnement, polices, changement de hauteur de la page) et gardées en mémoire :
  // pendant le défilement, le moteur ne lit plus jamais la mise en page, il ne fait qu'écrire, et seulement ce qui a changé.
  var cuissonF = $('#cuisson-f'), cuissonM = $('#cuisson-m'), accueil = $('#accueil'), rubriques = $$('.liens a').map(function (a) { return { a: a, s: $(a.getAttribute('href')) }; }), attente = 0;
  var der = { q: -1, n: '', coul: coulures.map(function () { return ''; }), ici: undefined };
  // La barre de cuisson était la seule écriture faite à chaque image sur toute la page, et chaque écriture fait retraiter tout le document.
  // Quand le navigateur sait lier une animation au défilement (style.css), c'est lui qui la joue : on n'écrit plus rien.
  var cuissonCSS = !calme && !!(window.CSS && CSS.supports && CSS.supports('animation-timeline: scroll()'));
  function mesure() {
    var y = scrollY, r;
    geo.vh = innerHeight; geo.total = D.scrollingElement.scrollHeight - geo.vh; geo.accH = accueil.offsetHeight;
    r = bains.getBoundingClientRect(); geo.bT = r.top + y; geo.bH = r.height;
    geo.coul = coulures.map(function (c) { return c.getBoundingClientRect().top + y; });
    r = rue.getBoundingClientRect(); geo.rT = r.top + y; geo.rB = r.bottom + y;
    r = haie.getBoundingClientRect(); geo.hT = r.top + y; geo.hB = r.bottom + y; geo.hW = r.width;
    geo.rub = rubriques.map(function (o) { return o.s ? o.s.getBoundingClientRect().top + y : Infinity; });
    geo.jW = jaugeBarre.clientWidth;
    pDernier = -1; ecrit.jx = -1;
  }
  function maj() {
    attente = 0;
    var vh = geo.vh, y = scrollY, q = geo.total > 0 ? borne(y / geo.total, 0, 1) : 0, t;
    if (!cuissonCSS && Math.abs(q - der.q) > .0002) { der.q = q; cuissonF.style.transform = 'scaleX(' + q.toFixed(4) + ')'; }
    var mot = q < .16 ? 'Crue' : q < .5 ? 'Pochée' : q < .93 ? 'Saisie' : 'Servie'; if (cuissonM.textContent !== mot) cuissonM.textContent = mot;
    // accueil : les frites s'envolent
    var da = calme ? 0 : Math.min(y, geo.accH) * 1.1;
    if (da !== defileAccueil) { defileAccueil = da; lanceFrites(); }
    // les deux bains
    t = geo.bT - y;
    if (t < vh && t + geo.bH > 0) majBains(borne(-t / (geo.bH - vh), 0, 1)); else majBains(t >= vh ? 0 : 1);
    // coulures
    coulures.forEach(function (c, i) { var tc = geo.coul[i] - y; if (tc > -200 && tc < vh + 50) { var v = seg(1 - tc / vh, .04, .8).toFixed(3); if (v !== der.coul[i]) { der.coul[i] = v; c.style.setProperty('--p', v); } } });
    // la nuit tombe sur la rue
    t = geo.rT - y;
    if (t < vh + 40 && geo.rB - y > -40) { var n = (.8 * doux(seg(1 - t / vh, .14, .7))).toFixed(3); if (n !== der.n) { der.n = n; nuitEls.forEach(function (el) { if (el) el.style.setProperty('--n', n); }); } }
    // la haie frémit quand on arrive en bas
    if (!calme && brins.length) { var dy = y - yPrec; if (dy && geo.hT - y < vh && geo.hB - y > 0) { var coup = borne(dy * .5, -16, 16); brins.forEach(function (b, i) { b.vit += coup * (.5 + (i % 5) * .14); }); lanceHaie(); } }
    yPrec = y;
    // rubrique en cours
    var ici = null; rubriques.forEach(function (o, i) { if (geo.rub[i] - y < vh * .45) ici = o; });
    if (ici !== der.ici) { der.ici = ici; rubriques.forEach(function (o) { o.a.classList.toggle('ici', o === ici); }); }
  }
  function demande() { if (!attente) attente = requestAnimationFrame(maj); }
  function remesure() { mesure(); demande(); }
  addEventListener('scroll', demande, { passive: true });
  function cadreRue() { rue.firstChild.setAttribute('viewBox', innerWidth < 700 ? '915 40 570 400' : '0 80 2400 360'); }
  cadreRue();
  addEventListener('resize', function () { taillePlateau(); tailleToile(); cadreRue(); plante(); remesure(); });
  taillePlateau(); tailleToile(); mesure(); maj();
  // la page change de hauteur (verdict des sauces sur deux lignes, polices, images) : on remesure, une fois, après la mise en page
  if (window.ResizeObserver) new ResizeObserver(function () { remesure(); }).observe(D.body);
  $$('[data-entre], #semaine, #tickets').forEach(function (el) { io.observe(el); });
  if (D.fonts && D.fonts.ready) D.fonts.ready.then(function () { taillePlateau(); remesure(); });

  /* ---------- Vigie : ce qui est loin de l'écran se met en pause (classe hors), et repart dans la même image au retour ---------- */
  var vigie = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      var loin = !e.isIntersecting;
      e.target.classList.toggle('hors', loin);
      if (e.target.id === 'horaires') { horloge.ici = !loin; if (!loin) tic(); }
    });
  }, { rootMargin: '160px 0px' });
  [accueil, bains, $('#horaires'), rue, $('.bandeau')].forEach(function (el) { if (el) vigie.observe(el); });

  /* ---------- Liens avec la page d'accueil de l'aperçu ---------- */
  addEventListener('scroll', function un() { removeEventListener('scroll', un); try { if (parent !== window) parent.postMessage({ type: 'kazura-defile' }, '*'); } catch (x) {} }, { passive: true });
  addEventListener('load', function () { taillePlateau(); tailleToile(); demande(); setTimeout(function () { try { if (parent !== window) parent.postMessage({ type: 'kazura-pret' }, '*'); } catch (x) {} }, 200); });
})();
