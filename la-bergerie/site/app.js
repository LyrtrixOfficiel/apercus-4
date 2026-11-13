// La Bergerie : « le carton ». Tout le contenu vient de contenu.js. Aucun WebGL, aucune dépendance.
// Le mouvement joue toujours (le réglage système « animations réduites » n’est jamais lu) ; mode calme seulement avec ?calme=1.
(function () {
  'use strict';
  var C = window.CONTENU, D = document, H = D.documentElement;
  var $ = function (s, r) { return (r || D).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || D).querySelectorAll(s)); };
  var borne = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var lisse = function (t) { t = borne(t, 0, 1); return t * t * (3 - 2 * t); };
  var euros = function (v) { return v.toFixed(2).replace('.', ',') + ' €'; };
  var req = new URLSearchParams(location.search);

  // ---------- Couleurs (bouton Couleur de la page Bonjour) ----------
  var ANCIENS = { lie: 'tomate', olive: 'basilic' };
  function palette(nom) {
    var P = C.palettes[ANCIENS[nom] || nom]; if (!P) return;
    H.style.setProperty('--vif', P.vif); H.style.setProperty('--vif-fonce', P.vifFonce); H.style.setProperty('--second', P.second);
  }
  palette(req.get('palette') || 'tomate');
  addEventListener('message', function (e) { if (e.data && e.data.type === 'kazura-couleur') palette(e.data.palette); });

  // ---------- Faits simples ----------
  $$('[data-tel]').forEach(function (a) { a.href = 'tel:' + C.telLien; });
  $$('[data-num]').forEach(function (e) { e.textContent = C.telephone; });
  $$('[data-note]').forEach(function (e) { e.textContent = C.note; });
  $$('[data-avis]').forEach(function (e) { e.textContent = C.avis; });
  $$('[data-supplement]').forEach(function (e) { e.textContent = C.supplement; });
  $('#itineraire').href = C.carteLien;

  // ---------- Aujourd'hui ----------
  var maintenant = new Date(), ajd = maintenant.getDay(), minutes = maintenant.getHours() * 60 + maintenant.getMinutes();
  var jourAjd = C.jours.filter(function (j) { return j.d === ajd; })[0];
  function prochain() { for (var k = 1; k <= 7; k++) { var d = (ajd + k) % 7, j = C.jours.filter(function (x) { return x.d === d; })[0]; if (j.h) return j; } }
  var ouvertCeSoir = !!jourAjd.h && minutes < C.fermetureMinutes;
  var phrase = ouvertCeSoir ? 'Ce soir, ' + jourAjd.j.toLowerCase() + ' : ouvert de ' + jourAjd.h + '.'
    : (jourAjd.h ? 'C’est fermé pour ce soir.' : 'Fermé le ' + jourAjd.j.toLowerCase() + '.') + ' Prochaine ouverture : ' + prochain().j.toLowerCase() + ', ' + C.ouverture + '.';
  var ceSoir = $('#ce-soir'); ceSoir.textContent = phrase; ceSoir.classList.toggle('ouvert', ouvertCeSoir);
  $('#statut').textContent = 'Du jeudi au dimanche, de 18 h 30 à 21 h 30. ' + phrase;

  // ---------- Le titre tamponné ----------
  var tn = $('#titre-nom');
  tn.innerHTML = tn.textContent.split('').map(function (c, i) { return '<span class="l" style="--i:' + i + '">' + c + '</span>'; }).join('');
  var lettres = $$('.l', tn);
  function sauter(i, inc) { var l = lettres[i]; if (!l) return; l.style.animationDelay = '0s'; l.style.setProperty('--inc', inc + 'deg'); l.classList.remove('saute'); void l.offsetWidth; l.classList.add('saute'); }
  lettres.forEach(function (l, i) {
    l.addEventListener('pointerdown', function () { sauter(i, 7); setTimeout(function () { sauter(i - 1, -5); sauter(i + 1, 5); }, 70); setTimeout(function () { sauter(i - 2, -3); sauter(i + 2, 3); }, 140); });
    l.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') sauter(i, i % 2 ? 6 : -6); });
  });

  // ---------- Le carton de l'accueil ----------
  var boite = $('#boite'), couv = $('#couvercle'), accueil = $('#accueil'), boiteScene = $('.boite-scene');
  var OUVERT = matchMedia('(max-width: 899px)').matches ? -68 : -58, FERME = -180, boiteOuverte = false; // au téléphone le couvercle se tient plus droit : la pizza remonte dans le premier écran
  function angle(a) { couv.style.setProperty('--a', a + 'deg'); }
  function ouvrir(o) { boiteOuverte = o; boite.classList.remove('suit'); boite.classList.toggle('ouvert', o); angle(o ? OUVERT : FERME); }
  angle(FERME);
  setTimeout(function () { ouvrir(true); }, H.classList.contains('calme') ? 0 : 1100);
  boite.addEventListener('click', function () { ouvrir(!boiteOuverte); });
  boite.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ouvrir(!boiteOuverte); } });
  accueil.addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'mouse') return;
    var r = accueil.getBoundingClientRect(), nx = (e.clientX - r.left) / r.width - .5, ny = (e.clientY - r.top) / r.height - .5;
    boite.style.setProperty('--ty', (nx * 16).toFixed(2) + 'deg'); boite.style.setProperty('--tx', (-ny * 10).toFixed(2) + 'deg');
    boiteScene.style.setProperty('--px', (nx * -18).toFixed(1) + 'px');
  });

  // ---------- Le dessin des pizzas, en papier découpé ----------
  var ING = C.ingredients;
  function alea(g) { var s = g >>> 0; return function () { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }
  function f1(v) { return (Math.round(v * 10) / 10).toString(); }
  function forme(f, c, R) {
    switch (f) {
      case 'flaque': { var a = 7 + R() * 3, b = 6 + R() * 2.5; return '<ellipse rx="' + f1(a) + '" ry="' + f1(b) + '" fill="' + c + '"/><ellipse cx="-1.5" cy="-1.5" rx="' + f1(a * .45) + '" ry="' + f1(b * .4) + '" fill="#ffffff" opacity=".55"/>'; }
      case 'chevre': return '<circle r="8" fill="#e6cf9c"/><circle r="6.5" fill="' + c + '"/><circle cx="-2" cy="-1" r=".9" fill="#6f7f3a"/><circle cx="2.4" cy="1.6" r=".8" fill="#6f7f3a"/><circle cx="0" cy="3" r=".7" fill="#b98a3a"/>';
      case 'rape': return '<path d="M-4.5 -1q4.5 -3 9 1" fill="none" stroke="' + c + '" stroke-width="2.2" stroke-linecap="round"/>';
      case 'miette': return '<path d="M-4.5 0q0-4.2 4.5-3.6q4.5-.4 4.5 3.4q0 4-4.7 3.8q-4.3.2-4.3-3.6z" fill="' + c + '"/><circle cx="-1.2" cy="-.6" r="1.1" fill="#5d8197"/><circle cx="1.7" cy="1.1" r=".9" fill="#5d8197"/>';
      case 'cube': return '<rect x="-2.9" y="-2.9" width="5.8" height="5.8" rx="1.3" fill="' + c + '"/>';
      case 'gros': return '<circle r="15" fill="#eadfc8"/><circle r="13" fill="#ffffff"/><ellipse cx="-4" cy="-4" rx="5" ry="3.4" fill="#f3ede2"/>';
      case 'lamelle': return '<rect x="-7.5" y="-3.6" width="15" height="7.2" rx="3.4" fill="' + c + '"/><rect x="-5" y="-1.8" width="7" height="1.8" rx=".9" fill="#fbd3ce"/>';
      case 'voile': return '<path d="M-9-2q3-6 9-3q6-3 9 2q1 6-6 6q-4 3-9 0q-5-1-3-5z" fill="' + c + '"/><path d="M-6-1q5-3 12 1" fill="none" stroke="#f3d6cc" stroke-width="1.5" stroke-linecap="round"/>';
      case 'rondelle': return '<circle r="5.6" fill="' + c + '"/><circle r="4.9" fill="none" stroke="#2a1a12" stroke-opacity=".2" stroke-width="1.3"/><circle cx="-1.6" cy="-1" r=".9" fill="#f5d9c2"/><circle cx="1.8" cy="1.4" r=".8" fill="#f5d9c2"/><circle cx="1.2" cy="-2.2" r=".6" fill="#f5d9c2"/>';
      case 'baton': return '<rect x="-3.6" y="-1.6" width="7.2" height="3.2" rx="1.4" fill="' + c + '"/><rect x="-3.6" y="-1.6" width="2.5" height="3.2" rx="1.2" fill="#f6dccd"/>';
      case 'tranche': return '<ellipse rx="8.2" ry="4.8" fill="#f3e2c8"/><ellipse cy="1.2" rx="7.5" ry="3.6" fill="' + c + '"/>';
      case 'galet': return '<path d="M-4.8 0q0-4 4.8-3.6q4.8 0 4.8 3.6q0 3.6-4.8 3.6q-4.8 0-4.8-3.6z" fill="' + c + '"/><ellipse cx="-1" cy="-1" rx="1.7" ry="1" fill="#9a6a4b"/>';
      case 'anneau': return '<circle r="4.5" fill="' + c + '"/><circle r="1.8" fill="#c9a37a"/>';
      case 'champi': return '<path d="M-6.4 0C-6.4-7 6.4-7 6.4 0L2.3 0L2.3 4.4C2.3 6.3-2.3 6.3-2.3 4.4L-2.3 0Z" fill="' + c + '"/><path d="M-4.6-.9C-3-3.2 3-3.2 4.6-.9" fill="none" stroke="#b39a76" stroke-width="1.2" stroke-linecap="round"/>';
      case 'feuille': return '<path d="M0-8.5C5.4-5 4.4 4.4 0 8.5C-4.4 4.4-5.4-5 0-8.5Z" fill="' + c + '"/><path d="M0-6V6" stroke="#2c6e3a" stroke-width="1.1" stroke-linecap="round"/>';
      case 'arc': return '<path d="M-5.2 2A5.2 5.2 0 0 1 5.2 2" fill="none" stroke="' + c + '" stroke-width="2.4" stroke-linecap="round"/>';
      case 'laniere': return '<path d="M-8.5 2Q-2-5.5 8.5-1" fill="none" stroke="' + c + '" stroke-width="4" stroke-linecap="round"/>';
      case 'demi': return '<path d="M-5.8 2A5.8 5.8 0 0 1 5.8 2Z" fill="' + c + '"/><path d="M-3 1A3 3 0 0 1 3 1Z" fill="#e0573a"/>';
      case 'brin': return '<path d="M-5 1Q0-3.2 5 0" fill="none" stroke="' + c + '" stroke-width="1.8" stroke-linecap="round"/>';
      case 'pdt': return '<circle r="6.6" fill="#e2c26f"/><circle r="5.3" fill="' + c + '"/>';
      case 'filet': return '<path d="M-10 0Q-7.5-4.4-5 0T0 0T5 0T10 0" fill="none" stroke="' + c + '" stroke-width="2.3" stroke-linecap="round"/>';
      case 'cerneau': return '<path d="M-4.2 0q0-3.8 4.2-3.4q4.2-.4 4.2 3.4q0 3.6-4.2 3.4q-4.2.2-4.2-3.4z" fill="' + c + '"/><path d="M0-2.7V2.7" stroke="#6f4621" stroke-width="1.1"/>';
      case 'oeuf': return '<path d="M-13 1q-1-12 11-12q13-1 14 10q1 12-12 12q-12 1-13-10z" fill="#ffffff"/><circle cx="1" r="5.8" fill="#f5a623"/><circle cx="-.6" cy="-1.6" r="1.7" fill="#ffd27a"/>';
      case 'poudre': { var s = ''; for (var k = 0; k < 8; k++) s += '<circle cx="' + f1((R() - .5) * 15) + '" cy="' + f1((R() - .5) * 15) + '" r="' + f1(.7 + R() * .5) + '" fill="' + c + '"/>'; return s; }
    }
    return '<circle r="4" fill="' + c + '"/>';
  }
  var SEUL = { gros: 1, oeuf: 1 };
  // Les morceaux d'un ingrédient, dans un secteur (a0 à a1, en radians) ou sur toute la pizza.
  function morceaux(cle, graine, a0, a1, anime) {
    var ing = ING[cle], R = alea(graine), plein = a1 - a0 > 6, s = '';
    var n = SEUL[ing.f] ? 1 : plein ? ing.q : Math.max(2, Math.round(ing.q * .36));
    for (var k = 0; k < n; k++) {
      var a, r;
      if (SEUL[ing.f]) { a = plein ? R() * 6.28 : (a0 + a1) / 2; r = plein ? 6 + R() * 14 : 50; }
      else if (plein) { a = (k + R() * .8) / n * 6.283 + graine; r = 14 + Math.sqrt(R()) * 60; }
      else { a = a0 + (a1 - a0) * (.14 + .72 * ((k + .2 + R() * .6) / n)); r = 26 + Math.sqrt((k * .618 + R() * .5) % 1) * 50; }
      var x = r * Math.cos(a), y = r * Math.sin(a), rot = Math.round(R() * 360), ech = SEUL[ing.f] && !plein ? .72 : 1;
      var m = forme(ing.f, ing.c, R);
      var ombre = '<g transform="translate(.9 1.4)" opacity=".26">' + m.replace(/(fill|stroke)="(?!none)[^"]*"/g, '$1="#3a1500"').replace(/ (stroke-)?opacity="[^"]*"/g, '') + '</g>';
      s += '<g transform="translate(' + f1(x) + ' ' + f1(y) + ') rotate(' + rot + ') scale(' + ech + ')"><g' + (anime ? ' style="--i:' + k + '"' : '') + '>' + ombre + m + '</g></g>';
    }
    return s;
  }
  var SAUCE = { tomate: '#cf3d22', creme: '#f7e9c6' }, TACHE = { tomate: '#e0593b', creme: '#fff8e3' };
  function fond(base, graine, dore) {
    var R = alea(graine), s = '<circle r="97" fill="#b9793a"/><circle r="95.5" fill="#e6ad62"/>';
    for (var k = 0; k < 16; k++) { var a = (k + R() * .7) / 16 * 6.283, p = [91 * Math.cos(a), 91 * Math.sin(a)]; s += '<ellipse cx="' + f1(p[0]) + '" cy="' + f1(p[1]) + '" rx="' + f1(6 + R() * 5) + '" ry="3.4" transform="rotate(' + Math.round(a * 57.3 + 90) + ' ' + f1(p[0]) + ' ' + f1(p[1]) + ')" fill="#f3c888"/>'; }
    var cuit = '';
    for (k = 0; k < 13; k++) { a = R() * 6.283; p = [92 * Math.cos(a), 92 * Math.sin(a)]; cuit += '<ellipse cx="' + f1(p[0]) + '" cy="' + f1(p[1]) + '" rx="' + f1(2.5 + R() * 4) + '" ry="' + f1(1.6 + R() * 1.6) + '" transform="rotate(' + Math.round(a * 57.3 + 90) + ' ' + f1(p[0]) + ' ' + f1(p[1]) + ')" fill="#8f4f1e"/>'; }
    s += dore ? '<g class="dore">' + cuit + '</g>' : cuit;
    s += '<circle class="sauce" r="83" fill="' + SAUCE[base] + '"/>';
    for (k = 0; k < 9; k++) { a = R() * 6.283; var r = Math.sqrt(R()) * 66; s += '<ellipse class="tache" cx="' + f1(r * Math.cos(a)) + '" cy="' + f1(r * Math.sin(a)) + '" rx="' + f1(7 + R() * 9) + '" ry="' + f1(5 + R() * 6) + '" fill="' + TACHE[base] + '" opacity=".5"/>'; }
    return s;
  }
  // Les fromages fondus passent dessous, le reste dessus.
  var DESSOUS = { flaque: 1, rape: 1 };
  function ordre(g) { return g.filter(function (k) { return DESSOUS[ING[k].f]; }).concat(g.filter(function (k) { return !DESSOUS[ING[k].f]; })); }

  // ---------- La carte : la roue de dix parts et la liste ----------
  var P = C.pizzas, N = P.length, PAS = 360 / N, roue = $('#roue'), liste = $('#liste'), roueZone = $('#roue-zone');
  (function () {
    var s = '<svg viewBox="-104 -104 208 208" aria-hidden="true">';
    P.forEach(function (p, i) {
      var c = i * PAS * Math.PI / 180, d = (PAS / 2 - 1) * Math.PI / 180, a0 = c - d, a1 = c + d;
      var chemin = 'M0 0L' + f1(99 * Math.cos(a0)) + ' ' + f1(99 * Math.sin(a0)) + 'A99 99 0 0 1 ' + f1(99 * Math.cos(a1)) + ' ' + f1(99 * Math.sin(a1)) + 'Z';
      s += '<g class="part" data-i="' + i + '" style="--ux:' + Math.cos(c).toFixed(3) + ';--uy:' + Math.sin(c).toFixed(3) + ';--i:' + i + '"><clipPath id="sect' + i + '"><path d="' + chemin + '"/></clipPath><g data-secteur="sect' + i + '">' + fond(p.b, 40 + i * 7, false);
      ordre(p.g).forEach(function (k, j) { s += morceaux(k, 100 + i * 31 + j * 17, a0, a1, false); });
      s += '</g></g>';
    });
    roue.innerHTML = s + '</svg>';
    // Le découpage de chaque part est posé après coup, attribut par attribut : le fichier unique réécrit les adresses du HTML injecté.
    $$('[data-secteur]', roue).forEach(function (g) { g.setAttribute('clip-path', 'u' + 'rl(#' + g.getAttribute('data-secteur') + ')'); });
    liste.innerHTML = P.map(function (p, i) {
      return '<article class="pz" data-i="' + i + '"><button class="pz-tete" type="button"><span class="pz-nom">' + p.n + '</span><span class="pz-prix">' + p.p + '</span></button>' +
        '<p class="pz-ing"><i class="base ' + p.b + '" aria-hidden="true"></i>' + p.i + '</p><button class="pz-plus" type="button" data-noter="' + i + '" aria-label="Noter une ' + p.n + ' pour ma commande">+ Noter<b></b></button></article>';
    }).join('');
  })();
  var svgRoue = $('svg', roue), parts = $$('.part', roue), lignes = $$('.pz', liste);
  var actif = -1, rot = 0, verrou = 0;
  var etroit = matchMedia('(max-width: 999px)');
  function cible() { return etroit.matches ? 90 : 0; }
  function tourner(v) { rot = v; svgRoue.style.setProperty('--rot', v.toFixed(2) + 'deg'); }
  function activer(i, garde) {
    i = (i % N + N) % N;
    if (i !== actif) {
      if (actif >= 0) { parts[actif].classList.remove('active'); lignes[actif].classList.remove('active'); }
      actif = i; parts[i].classList.add('active'); lignes[i].classList.add('active');
    }
    if (!garde) { var v = cible() - i * PAS, d = ((v - rot) % 360 + 540) % 360 - 180; roue.classList.remove('tire'); tourner(rot + d); }
  }
  activer(5); // la Bergerie, la pizza de la maison
  lignes.forEach(function (l, i) {
    l.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') activer(i); });
    l.addEventListener('click', function (e) { if (e.target.closest('.pz-plus')) return; verrou = Date.now() + 1400; activer(i); });
  });
  // On fait tourner la pizza à la main ; au lâcher, elle s'arrête sur une part.
  (function () {
    var prise = null, vit = 0, bouge = 0, lance = 0;
    function ang(e) { var r = roue.getBoundingClientRect(); return Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180 / Math.PI; }
    function plusProche() { return Math.round((cible() - rot) / PAS); }
    roue.addEventListener('pointerdown', function (e) { prise = { a: ang(e), t: performance.now(), x: e.clientX, y: e.clientY, cible: e.target.closest('.part') }; bouge = 0; vit = 0; cancelAnimationFrame(lance); });
    addEventListener('pointermove', function (e) {
      if (!prise) return;
      var a = ang(e), d = ((a - prise.a) % 360 + 540) % 360 - 180, t = performance.now();
      bouge += Math.abs(e.clientX - prise.x) + Math.abs(e.clientY - prise.y); prise.x = e.clientX; prise.y = e.clientY;
      if (bouge < 8) return;
      if (!roue.classList.contains('tire')) { roue.classList.add('tire'); try { roue.setPointerCapture(e.pointerId); } catch (x) {} }
      vit = d / Math.max(8, t - prise.t) * 16; prise.a = a; prise.t = t;
      tourner(rot + d); activer(plusProche(), true);
    });
    function fin() {
      if (!prise) return; var p = prise; prise = null;
      if (bouge < 8) { if (p.cible) { verrou = Date.now() + 1400; activer(+p.cible.dataset.i); } return; }
      verrou = Date.now() + 1600;
      (function glisse() {
        vit *= .94; tourner(rot + vit); activer(plusProche(), true);
        if (Math.abs(vit) > .35) lance = requestAnimationFrame(glisse); else activer(plusProche());
      })();
    }
    addEventListener('pointerup', fin); addEventListener('pointercancel', fin);
  })();

  // ---------- Pizza du mois : le titre fond ----------
  var fondTitre = $('#fond-titre');
  (function () {
    var R = alea(21), n = 0;
    fondTitre.innerHTML = C.mois.n.split(' ').map(function (mot) {
      return '<span class="mot">' + mot.split('').map(function (c) {
        n++; var coule = R() < .72 || n === 4;
        return '<span class="l" aria-hidden="true"' + (coule ? ' style="--gx:' + Math.round(22 + R() * 40) + '%;--gl:' + (.2 + R() * .4).toFixed(2) + 'em"' : '') + '>' + c + (coule ? '<i class="fil"></i><i class="perle"></i>' : '') + '</span>';
      }).join('') + '</span>';
    }).join(' ');
  })();
  var bouche = $('#bouche');

  // ---------- Le jeu : composer, enfourner ----------
  var jeu = $('#jeu-corps'), disque = $('#disque'), bacs = $('#bacs'), reponse = $('#reponse'), pelle = $('#pelle'), four = $('#four');
  var base = 'tomate', choix = [], cuit = false, enCuisson = false;
  disque.innerHTML = '<svg viewBox="-104 -104 208 208" aria-hidden="true"><g id="dq-fond">' + fond(base, 5, true) + '</g><g id="dq-dessous"></g><g id="dq-dessus"></g></svg>';
  var dqDessous = $('#dq-dessous'), dqDessus = $('#dq-dessus');
  bacs.innerHTML = '<p class="bac-titre">La base</p><div class="puces">' +
    '<button class="puce base-choix" type="button" data-base="tomate" aria-pressed="true" style="--c:' + SAUCE.tomate + '"><i></i>Tomate</button>' +
    '<button class="puce base-choix" type="button" data-base="creme" aria-pressed="false" style="--c:' + SAUCE.creme + '"><i></i>Crème</button></div>' +
    C.bacs.map(function (b) {
      return '<p class="bac-titre">' + b.t + '</p><div class="puces">' + b.k.map(function (k) { return '<button class="puce" type="button" data-k="' + k + '" aria-pressed="false" style="--c:' + ING[k].c + '"><i></i>' + ING[k].n + '</button>'; }).join('') + '</div>';
    }).join('');
  function poser(k) {
    var g = D.createElementNS('http://www.w3.org/2000/svg', 'g'); g.setAttribute('class', 'pose'); g.setAttribute('data-k', k);
    g.innerHTML = morceaux(k, 900 + Object.keys(ING).indexOf(k) * 13, 0, 6.3, true);
    (DESSOUS[ING[k].f] ? dqDessous : dqDessus).appendChild(g);
  }
  function oter(k) { var g = $('[data-k="' + k + '"]', disque); if (g) g.remove(); }
  function changerBase(b) {
    base = b;
    $$('[data-base]', bacs).forEach(function (x) { x.setAttribute('aria-pressed', x.dataset.base === b ? 'true' : 'false'); });
    $('.sauce', disque).setAttribute('fill', SAUCE[b]); $$('.tache', disque).forEach(function (t) { t.setAttribute('fill', TACHE[b]); });
  }
  function basculer(k, etat) {
    var i = choix.indexOf(k), veut = etat === undefined ? i < 0 : etat;
    if (veut && i < 0) { choix.push(k); poser(k); } else if (!veut && i >= 0) { choix.splice(i, 1); oter(k); }
    var b = $('[data-k="' + k + '"]', bacs); if (b) b.setAttribute('aria-pressed', veut ? 'true' : 'false');
  }
  function cru() { cuit = false; jeu.classList.remove('cuit', 'sorti'); }
  var CANDIDATES = P.concat([C.mois]);
  function classement() {
    return CANDIDATES.map(function (p) {
      var commun = p.g.filter(function (k) { return choix.indexOf(k) >= 0; }).length, extra = choix.length - commun;
      return { p: p, commun: commun, extra: extra, exact: commun === p.g.length && extra === 0 && p.b === base, score: commun * 2 - extra * .8 + (p.b === base ? 1 : 0) - (p.g.length - commun) * .15 };
    }).sort(function (a, b) { return b.score - a.score; });
  }
  function la(p) { return p === C.mois ? p.n : 'La ' + p.n; }
  var meilleure = null;
  function repondre(neuf) {
    var h;
    if (!choix.length) {
      meilleure = null;
      h = '<p class="pochoir">La carte répond ici</p><h3 class="rep-nom">Pâte nue.</h3><p class="rep-compte">Choisissez une base, puis posez deux ou trois ingrédients.</p>' +
        '<p class="rep-actions"><button class="bouton plein" type="button" data-jeu="hasard">Garnir au hasard</button></p>';
    } else {
      var cl = classement(), m = cl[0], p = m.p; meilleure = p;
      var mots = p.i.replace(/\.$/, '').split(', ');
      var ing = mots.map(function (t, j) { var ok = j === 0 ? p.b === base : choix.indexOf(p.g[j - 1]) >= 0; return ok ? '<b>' + t + '</b>' : '<s>' + t + '</s>'; }).join(', ') + '.';
      var compte = m.exact ? 'Tout y est : même base, mêmes ingrédients.'
        : m.commun + ' de ses ' + p.g.length + ' ingrédients ' + (m.commun > 1 ? 'sont' : 'est') + ' sur votre pâte' + (m.extra ? ', et vous en avez ajouté ' + m.extra + '.' : '.');
      var autres = cl.slice(1, 3).filter(function (x) { return x.commun > 0; }).map(function (x) { return la(x.p).replace(/^La /, 'la '); });
      h = '<p class="pochoir">' + (m.exact ? 'C’est exactement' : cuit ? 'La plus proche sur la carte' : 'Sur la carte, ça ressemble à') + '</p><h3 class="rep-nom">' + la(p) + '</h3><p class="rep-prix">' + p.p + (p === C.mois ? ', pizza du mois' : '') + '</p>' +
        '<p class="rep-ing">' + ing + '</p><p class="rep-compte">' + compte + '</p>' + (autres.length ? '<p class="rep-autres">Pas loin non plus : ' + autres.join(', ') + '.</p>' : '') +
        '<p class="rep-actions">' + (cuit
          ? '<a class="bouton plein" href="tel:' + C.telLien + '">Appeler pour la commander</a><button class="bouton second" type="button" data-noter="' + (p === C.mois ? 'mois' : P.indexOf(p)) + '">Noter</button><button class="bouton second" type="button" data-jeu="vider">Refaire</button>'
          : '<button class="bouton plein" type="button" data-jeu="enfourner">Enfourner</button><button class="bouton second" type="button" data-jeu="vider">Tout enlever</button>') + '</p>';
    }
    reponse.innerHTML = h;
    if (neuf) { reponse.classList.remove('neuf'); void reponse.offsetWidth; reponse.classList.add('neuf'); }
  }
  function enfourner() {
    if (enCuisson || !choix.length) return;
    enCuisson = true; cru();
    var rp = pelle.getBoundingClientRect(), rf = four.getBoundingClientRect();
    pelle.style.setProperty('--monte', ((rf.top + rf.height * .62) - (rp.top + rp.height / 2)).toFixed(0) + 'px');
    jeu.classList.add('cuisson');
    var jauge = $('#four-jauge'), t0 = performance.now() + 700, duree = 2100;
    (function chauffe(t) {
      var k = borne((t - t0) / duree, 0, 1); jauge.style.setProperty('--j', k.toFixed(3));
      if (k < 1) return requestAnimationFrame(chauffe);
      jeu.classList.remove('cuisson'); jeu.classList.add('cuit', 'sorti'); cuit = true; enCuisson = false;
      repondre(true); setTimeout(function () { jauge.style.setProperty('--j', 0); }, 600);
    })(performance.now());
  }
  bacs.addEventListener('click', function (e) {
    var b = e.target.closest('.puce'); if (!b || enCuisson) return;
    if (b.dataset.base) changerBase(b.dataset.base); else basculer(b.dataset.k);
    cru(); repondre(true);
  });
  reponse.addEventListener('click', function (e) {
    var b = e.target.closest('[data-jeu]'); if (!b || enCuisson) return;
    if (b.dataset.jeu === 'enfourner') enfourner();
    else if (b.dataset.jeu === 'vider') { choix.slice().forEach(function (k) { basculer(k, false); }); cru(); repondre(true); }
    else if (b.dataset.jeu === 'hasard') { var p = P[Math.floor(Math.random() * N)]; changerBase(p.b); p.g.slice(0, 3).forEach(function (k, j) { setTimeout(function () { basculer(k, true); cru(); repondre(true); }, j * 260); }); }
  });
  repondre(false);

  // ---------- L'histoire : le camion roule jusqu'à la ferme ----------
  var histoire = $('#histoire'), paysage = $('#paysage'), monde = $('#monde'), camion = $('#camion'), ferme = $('#ferme'), temps = $$('#temps p');
  var geo = null;
  (function () {
    var R = alea(77), s = '', V = ['#24613f', '#2f7a4c', '#1c5235'];
    for (var k = 0; k < 15; k++) {
      var x = (k + .2 + R() * .6) / 15 * 78 + 1, peuplier = R() < .4, h = 20 + R() * 20;
      s += '<i class="arbre" style="left:' + x.toFixed(1) + '%;--h:' + h.toFixed(0) + '%;--l:' + (peuplier ? h * .16 : h * .34).toFixed(1) + 'vh;--v:' + V[k % 3] + (peuplier ? ';--ra:50% 50% 46% 46% / 62% 62% 38% 38%' : '') + '"></i>';
    }
    $('#arbres').innerHTML = s;
  })();
  function mesurer() {
    var vw = innerWidth, hp = paysage.clientHeight || 300;
    var W = borne(vw * 1.7, 1500, 3200), marge = vw < 700 ? 12 : W * .03;
    var fH = Math.min(hp * .74, vw * .8 / 2.133), fW = fH * 2.133, fX = W - marge - fW;
    var cH = Math.min(hp * .4, vw * .36 / 1.8), cW = cH * 1.8;
    monde.style.setProperty('--monde', W + 'px');
    ferme.style.height = fH.toFixed(0) + 'px'; ferme.style.width = fW.toFixed(0) + 'px'; ferme.style.right = marge.toFixed(0) + 'px';
    camion.style.height = cH.toFixed(0) + 'px';
    geo = { vw: vw, hp: hp, W: W, depart: W * .015, arrivee: Math.max(fX + fW * .245 - cW, W - vw + 8), cW: cW, rayon: cH * 20 / 150 };
  }

  // ---------- Traiteur : la grande table ----------
  var zone = $('#table-zone'), nombre = $('#nombre'), convives = 12, dresses = 0;
  function dresser() {
    var w = zone.clientWidth, h = zone.clientHeight; if (!w) return;
    var tl = w * .07, tw = w * .86, th = h * .44, n = convives, bouts = n >= 4 ? 2 : 0, haut = Math.ceil((n - bouts) / 2), bas = n - bouts - haut;
    var s = borne(tw / Math.max(haut, 1) - 7, 13, Math.min(50, h * .2)), html = '', k = 0;
    function une(x, y) { html += '<i class="assiette" style="left:' + x.toFixed(1) + 'px;top:' + y.toFixed(1) + 'px;--s:' + s.toFixed(1) + 'px;--o:' + (k * 67 % 360) + 'deg' + (k < dresses ? ';animation:none' : ';animation-delay:' + Math.min(k - dresses, 12) * 28 + 'ms') + '"></i>'; k++; }
    for (var j = 0; j < haut; j++) une(tl + tw * (j + .5) / haut, h / 2 - th / 2 - s * .62);
    for (j = 0; j < bas; j++) une(tl + tw * (j + .5) / bas, h / 2 + th / 2 + s * .62);
    if (bouts) { une(tl - s * .66, h / 2); une(tl + tw + s * .66, h / 2); }
    $$('.assiette', zone).forEach(function (a) { a.remove(); });
    zone.insertAdjacentHTML('beforeend', html); dresses = n;
    nombre.textContent = n;
    $('#tablee-phrase').textContent = 'Pour ' + n + ' convives, le plus simple est d’en parler de vive voix : vos formules viendront ici.';
  }
  function changer(d) { var v = borne(convives + d, 2, 60); if (v === convives) return; convives = v; dresser(); nombre.classList.remove('bat'); void nombre.offsetWidth; nombre.classList.add('bat'); }
  [['#moins', -1], ['#plus', 1]].forEach(function (c) {
    var b = $(c[0]), t1, t2;
    function stop() { clearTimeout(t1); clearInterval(t2); }
    b.addEventListener('pointerdown', function () { changer(c[1]); stop(); t1 = setTimeout(function () { t2 = setInterval(function () { changer(c[1]); }, 70); }, 380); });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (n) { b.addEventListener(n, stop); });
    b.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); changer(c[1]); } });
  });

  // ---------- Horaires : sept fours ----------
  $('#fours').innerHTML = C.jours.map(function (j, i) {
    var ici = j.d === ajd;
    return '<div class="jour ' + (j.h ? 'ouvre' : 'ferme') + (ici ? ' ajd' : '') + '" style="--i:' + i + '"' + (ici ? ' data-mot="' + (j.h ? 'Ce soir' : 'Aujourd’hui') + '"' : '') + '><span class="jour-four" aria-hidden="true"><i class="jour-feu"></i></span><span class="jour-nom">' + j.j + '</span><span class="jour-h">' + (j.h ? j.h.replace(' à ', ' <span>à ') + '</span>' : 'Fermé') + '</span></div>';
  }).join('');

  // ---------- Commande : les pâtons et le bloc ----------
  var patons = $('#patons');
  patons.innerHTML = C.telephone.split(' ').map(function (d, i) { return '<span class="paton" style="--i:' + i + '">' + d + '</span>'; }).join('');
  patons.addEventListener('pointerdown', function (e) { var p = e.target.closest('.paton'); if (p) { patons.classList.add('leve'); p.classList.add('ecrase'); } });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (n) { patons.addEventListener(n, function () { $$('.ecrase', patons).forEach(function (p) { p.classList.remove('ecrase'); }); }); });
  var commande = {}, blocLignes = $('#bloc-lignes');
  function pizzaDe(k) { return k === 'mois' ? C.mois : P[+k]; }
  function ecrireBloc() {
    var cles = Object.keys(commande).filter(function (k) { return commande[k] > 0; }), total = 0, nb = 0;
    blocLignes.innerHTML = cles.length ? cles.map(function (k) {
      var p = pizzaDe(k), q = commande[k]; total += p.e * q; nb += q;
      return '<div class="ligne"><span class="ligne-q"><button type="button" data-q="-1" data-k="' + k + '" aria-label="Une de moins">&minus;</button><b>' + q + '</b><button type="button" data-q="1" data-k="' + k + '" aria-label="Une de plus">+</button></span><span class="ligne-nom">' + (p.court || p.n) + '</span><span class="ligne-prix">' + euros(p.e * q) + '</span></div>';
    }).join('') : '<p class="bloc-vide">Rien de noté pour l’instant. Touchez « + Noter » dans la carte, ou appelez directement.</p>';
    $('#bloc-total').textContent = euros(total);
    $$('[data-compte]').forEach(function (c) { c.hidden = !nb; c.textContent = nb; });
    $$('.pz-plus').forEach(function (b) { var q = commande[b.dataset.noter] || 0; b.classList.toggle('note', q > 0); $('b', b).textContent = q; });
  }
  D.addEventListener('click', function (e) {
    var n = e.target.closest('[data-noter]'), q = e.target.closest('[data-q]');
    if (n) { var k = n.dataset.noter; commande[k] = (commande[k] || 0) + 1; ecrireBloc(); n.animate && n.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.18) rotate(-3deg)' }, { transform: 'scale(1)' }], { duration: 320, easing: 'cubic-bezier(.3,1.6,.5,1)' }); }
    else if (q) { commande[q.dataset.k] = Math.max(0, (commande[q.dataset.k] || 0) + (+q.dataset.q)); ecrireBloc(); }
  });
  ecrireBloc();

  // ---------- Menu ----------
  var menuBouton = $('#menu-bouton');
  function menu(o) { H.classList.toggle('menu-ouvert', o); menuBouton.setAttribute('aria-expanded', o ? 'true' : 'false'); menuBouton.textContent = o ? 'Fermer' : 'Menu'; }
  menuBouton.addEventListener('click', function () { menu(!H.classList.contains('menu-ouvert')); });
  $$('#menu a').forEach(function (a) { a.addEventListener('click', function () { menu(false); }); });
  addEventListener('keydown', function (e) { if (e.key === 'Escape') menu(false); });

  // ---------- Entrées de section ----------
  [['.tete-section > *', 0], ['.accueil-texte > *', 0], ['.mois-texte > *', 0], ['.traiteur-texte > :not(.partage)', 0], ['.commande-texte > :not(.patons)', 0], ['.pz', 0], ['.bacs > *', 0], ['.jour', 0], ['.pied-grille > *', 0]].forEach(function (c) {
    var parDernier = null, i = 0;
    $$(c[0]).forEach(function (e) { if (e.parentNode !== parDernier) { parDernier = e.parentNode; i = 0; } e.classList.add('entre'); e.style.setProperty('--i', Math.min(i++, 12)); });
  });
  $$('.bouche, .reponse, .jeu-plan, .pate-photo, .partage, .tablee, .colis, .lieu-note, .bloc, .siege, .roue-carton').forEach(function (e) { e.classList.add('entre-o'); });
  var vue = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      var s = e.target; s.classList.add('vu'); vue.unobserve(s);
      if (s.id === 'traiteur') setTimeout(dresser, 250);
      setTimeout(function () { $$('.entre', s).forEach(function (x) { x.classList.remove('entre'); }); if (s.id === 'carte') roue.classList.add('pret'); if (s.id === 'commande') patons.classList.add('leve'); }, 2400);
    });
  }, { threshold: .12 });
  $$('main > section, .pied').forEach(function (s) { vue.observe(s); });

  // ---------- Ce qui suit le défilement ----------
  var coupes = $$('.coupe').map(function (c) { return { el: c.parentNode, r: $('.roulette', c), lame: $('.lame', c) }; });
  var liensNav = $$('.liens a'), sections = $$('main > section'), marque = $('#marque-pizza'), carte = $('#carte'), dernierIci = '';
  var tirages = $$('.pate-photo img, .partage img, .siege img');
  var demande = false;
  // Fluidité (13/11) : toutes les lectures de la mise en page d'abord, toutes les écritures ensuite (plus de recalcul forcé entre deux),
  // et une valeur n'est réécrite que si elle a changé.
  var dejaEcrit = new Map();
  function poserVar(el, nom, v) { var m = dejaEcrit.get(el); if (!m) { m = {}; dejaEcrit.set(el, m); } if (m[nom] === v) return; m[nom] = v; el.style.setProperty(nom, v); }
  var collinesLoin = $('.collines.loin', paysage), soleil = $('.ciel-soleil', paysage), tempsLa = -1, arrive = null, roueLoin = null;
  function maj() {
    demande = false;
    if (!geo) mesurer();
    // ---- lectures ----
    var y = scrollY, vh = innerHeight, vw = innerWidth, total = H.scrollHeight - vh;
    var ici = '';
    for (var s = 0; s < sections.length; s++) { var r = sections[s].getBoundingClientRect(); if (r.top < vh * .45 && r.bottom > vh * .45) ici = sections[s].id; }
    var hautsCoupes = coupes.map(function (c) { return c.el.getBoundingClientRect().top; });
    var ra = accueil.getBoundingClientRect(), rbo = ra.bottom > 0 && boiteOuverte ? boiteScene.getBoundingClientRect() : null;
    var partTel = -1, rc = carte.getBoundingClientRect();
    if (etroit.matches && Date.now() > verrou) {
      if (rc.top < vh * .5 && rc.bottom > vh * .5) {
        var seuil = roueZone.getBoundingClientRect().bottom + 70;
        for (var i = 0; i < N; i++) { if (lignes[i].getBoundingClientRect().bottom > seuil) { partTel = i; break; } }
      }
    }
    var rf = fondTitre.getBoundingClientRect(), rb = bouche.getBoundingClientRect();
    var rTirages = tirages.map(function (im) { return im.getBoundingClientRect(); });
    var rh = histoire.getBoundingClientRect();
    // ---- écritures ----
    // la pizza de la barre : une part de moins à chaque dixième de page
    poserVar(marque, '--mange', Math.min(9, Math.floor(borne(y / Math.max(1, total), 0, 1) * 10 + .02)) * 36 + 'deg');
    // la rubrique en cours
    if (ici !== dernierIci) { dernierIci = ici; liensNav.forEach(function (a) { a.classList.toggle('ici', a.getAttribute('href') === '#' + ici); }); }
    // la roulette qui coupe le carton à chaque changement de section (hors de vue, elle ne fait plus partie du dessin)
    coupes.forEach(function (c, j) {
      var t = hautsCoupes[j], loin = t < -80 || t > vh + 80;
      if (loin !== c.loin) { c.loin = loin; c.r.classList.toggle('loin', loin); }
      if (loin) return;
      var x = -90 + (1 - t / vh) * (vw + 180);
      poserVar(c.r, '--x', x.toFixed(1) + 'px'); poserVar(c.lame, '--r', (x * 1.98).toFixed(1) + 'deg');
    });
    // le carton de l'accueil se referme quand il quitte l'écran par le haut (réglé sur sa propre position, pas sur celle de la section)
    if (rbo) {
      var q = borne((vh * .4 - (rbo.top + rbo.height * .62)) / (vh * .5), 0, 1);
      if (q > .06) { boite.classList.add('suit'); angle(OUVERT + (FERME - OUVERT) * lisse((q - .06) / .8)); }
      else if (boite.classList.contains('suit')) { boite.classList.remove('suit'); angle(OUVERT); }
    }
    // la roue (des milliers de morceaux découpés) ne reste dans le dessin que près de la carte : loin d'elle, tout le reste de la page défile plus léger
    var rl = rc.bottom < -vh * .6 || rc.top > vh * 1.6;
    if (rl !== roueLoin) { roueLoin = rl; roue.classList.toggle('loin', rl); }
    // au téléphone, la carte fait tourner la roue en défilant
    if (partTel >= 0 && partTel !== actif) activer(partTel);
    // le titre de la pizza du mois fond, sa photo glisse dans la bouche du four
    if (rf.bottom > -200 && rf.top < vh + 100) poserVar(fondTitre, '--g', lisse((vh * .92 - rf.top) / (vh * .7)).toFixed(3));
    if (rb.bottom > 0 && rb.top < vh) poserVar(bouche, '--p', (-20 + 18 * borne((vh - rb.top) / (vh + rb.height), 0, 1)).toFixed(2) + '%');
    // les tirages photo flottent un peu
    tirages.forEach(function (im, j) { var r = rTirages[j]; if (r.bottom < -40 || r.top > vh + 40) return; var v = 'translate3d(0,' + (((r.top + r.height / 2) / vh - .5) * -30).toFixed(1) + 'px,0)'; if (im._ty !== v) { im._ty = v; im.style.transform = v; } });
    // le camion
    if (rh.top < vh && rh.bottom > 0) {
      var p = borne(-rh.top / Math.max(1, rh.height - vh), 0, 1), k = lisse((p - .04) / .84);
      var x = geo.depart + (geo.arrivee - geo.depart) * k, max = geo.W - geo.vw;
      var suit = borne(x + geo.cW * .5 - geo.vw * .36, 0, max), cam = suit + (max - suit) * lisse((p - .72) / .2);
      poserVar(monde, '--cx', (-cam).toFixed(1) + 'px'); poserVar(camion, '--kx', x.toFixed(1) + 'px');
      poserVar(camion, '--rr', (x / geo.rayon * 57.3).toFixed(0) + 'deg');
      // posées sur les deux éléments qui s'en servent, pas sur tout le paysage
      if (collinesLoin) poserVar(collinesLoin, '--lx', (-cam * .3).toFixed(1) + 'px');
      if (soleil) poserVar(soleil, '--sy', (geo.hp * .42 * p).toFixed(1) + 'px');
      var t = p < .3 ? 0 : p < .62 ? 1 : 2;
      if (t !== tempsLa) { tempsLa = t; temps.forEach(function (e, i) { e.classList.toggle('la', i === t); e.classList.toggle('passe', i < t); }); }
      var a = p > .86; if (a !== arrive) { arrive = a; paysage.classList.toggle('arrive', a); }
    }
  }
  function demander() { if (!demande) { demande = true; requestAnimationFrame(maj); } }
  addEventListener('scroll', demander, { passive: true });
  addEventListener('resize', function () { geo = null; dresser(); if (actif >= 0) activer(actif); demander(); });
  addEventListener('load', function () { geo = null; demander(); });
  maj();

  // ---------- Liaison avec la page Bonjour ----------
  addEventListener('scroll', function un() { removeEventListener('scroll', un); try { if (parent !== window) parent.postMessage({ type: 'kazura-defile' }, '*'); } catch (x) {} }, { passive: true });
  addEventListener('load', function () { setTimeout(function () { try { if (parent !== window) parent.postMessage({ type: 'kazura-pret' }, '*'); } catch (x) {} }, 200); });
})();
