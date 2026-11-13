// Le Chaudron : tout le mouvement de la page. Aucune dépendance, aucun WebGL.
// Le mouvement joue toujours en entier ; mode calme seulement avec ?calme=1 (jamais d'après le réglage du système).
(function () {
  'use strict';
  var H = document.documentElement, C = window.CONTENU || {}, Q = new URLSearchParams(location.search);
  var calme = H.classList.contains('calme');
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function borne(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lisse(t) { t = borne(t, 0, 1); return t * t * (3 - 2 * t); }
  function cree(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }

  // ---------- couleurs (bouton « Couleur » de la page Bonjour) ----------
  function palette(n) {
    var p = (C.palettes || {})[n]; if (!p) return;
    Object.keys(p).forEach(function (k) { H.style.setProperty(k, p[k]); });
    var m = $('meta[name=theme-color]'); if (m) m.setAttribute('content', p['--eau']);
  }
  palette(Q.get('palette') || 'cuivre');
  addEventListener('message', function (e) { if (e.data && e.data.type === 'kazura-couleur') palette(e.data.palette); });

  // ---------- faits ----------
  $$('[data-carte]').forEach(function (a) { a.href = C.carte; });
  var maintenant = new Date();
  var dj = $('#date-jour');
  if (dj) { try { dj.textContent = maintenant.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }); } catch (e) {} }
  var ulJ = $('#jours'), auj = (maintenant.getDay() + 6) % 7;
  (C.jours || []).forEach(function (j, i) {
    var li = cree('li', i === auj ? 'auj' : ''); li.appendChild(cree('b', '', j)); li.appendChild(cree('span', '', C.horaires ? C.horaires[i] : '............')); ulJ.appendChild(li);
  });

  // ---------- moteur : une seule boucle, qui s'arrête quand plus rien ne bouge ----------
  var acteurs = [], tourne = false, der = 0;
  var Y = scrollY, VH = innerHeight; // lus une fois en tête d'image, avant toute écriture (aucune mise en page forcée ensuite)
  function reveille() { if (!tourne) { tourne = true; der = performance.now(); requestAnimationFrame(boucle); } }
  function boucle(t) {
    Y = scrollY; VH = innerHeight;
    var dt = Math.min(.05, (t - der) / 1000); der = t; var vivant = false;
    for (var i = 0; i < acteurs.length; i++) if (acteurs[i](dt, t / 1000)) vivant = true;
    if (vivant) requestAnimationFrame(boucle); else tourne = false;
  }

  // ---------- pendules : tout ce qui est suspendu se balance ----------
  var pendules = [];
  function pendule(el, pose, opt) {
    var p = { el: el, a: 0, w: 0, k: (opt && opt.k) || 34, d: (opt && opt.d) || 2.6, max: (opt && opt.max) || 9, pose: pose, vis: true };
    pendules.push(p); return p;
  }
  acteurs.push(function (dt) {
    var vivant = false;
    pendules.forEach(function (p) {
      if (Math.abs(p.a) < .02 && Math.abs(p.w) < .05) { if (p.a !== 0) { p.a = 0; p.w = 0; p.pose(0); } return; }
      p.w += (-p.k * p.a - p.d * p.w) * dt; p.a = borne(p.a + p.w * dt, -p.max, p.max); p.pose(p.a); vivant = true;
    });
    return vivant;
  });
  function pousse(p, f) { if (calme) return; p.w += f; reveille(); }

  // ---------- en-tête ----------
  var tete = $('#tete'), burger = $('#burger'), chauffe = $('#chauffe');
  burger.addEventListener('click', function () { var o = H.classList.toggle('menu-ouvert'); burger.setAttribute('aria-expanded', o); burger.textContent = o ? 'Fermer' : 'Menu'; });
  $$('#menu a').forEach(function (a) { a.addEventListener('click', function () { H.classList.remove('menu-ouvert'); burger.setAttribute('aria-expanded', false); burger.textContent = 'Menu'; }); });
  var liens = {}; $$('#menu a').forEach(function (a) { liens[a.getAttribute('href').slice(1)] = a; });

  // ---------- le titre : lettres qui montent, puis qui sautent sous la souris ----------
  $$('[data-lettres]').forEach(function (el) {
    var mot = el.textContent; el.textContent = '';
    mot.split('').forEach(function (c, i) { var s = cree('span', 'l', c); s.style.setProperty('--i', i); s.style.setProperty('--k', (i % 2 ? 1 : -1) * (.5 + (i * 37 % 10) / 14)); el.appendChild(s); });
    var ls = $$('.l', el);
    function saute(i) { var l = ls[i]; if (!l || calme) return; l.classList.add('saute'); clearTimeout(l._t); l._t = setTimeout(function () { l.classList.remove('saute'); }, 320); }
    ls.forEach(function (l, i) {
      l.addEventListener('pointerenter', function () { saute(i); setTimeout(function () { saute(i - 1); saute(i + 1); }, 70); });
      l.addEventListener('animationend', function () { l.style.animation = 'none'; });
    });
    el.addEventListener('pointerdown', function () { ls.forEach(function (l, i) { setTimeout(function () { saute(i); }, i * 45); }); });
  });

  // ---------- 1. le chaudron de l'accueil ----------
  var scene = $('#scene'), pot = $('#pot'), pend = $('#pendule');
  var pPot = pendule(pend, function (a) { pend.style.transform = 'rotate(' + a.toFixed(2) + 'deg)'; }, { k: 22, d: 1.5, max: 7 });
  function ouvrir(o) { scene.classList.toggle('ouvert', o); pot.setAttribute('aria-pressed', o); pousse(pPot, o ? 26 : -18); }
  pot.addEventListener('click', function () { scene.classList.add('joue'); ouvrir(!scene.classList.contains('ouvert')); });
  scene.addEventListener('pointermove', function (e) { if (e.pointerType === 'mouse') pousse(pPot, borne(e.movementX || 0, -20, 20) * .22); });
  setTimeout(function () { ouvrir(true); }, calme ? 0 : 1500);

  // ---------- entrées et sections visibles ----------
  var visibles = {};
  var ioSec = new IntersectionObserver(function (es) {
    es.forEach(function (e) { e.target.classList.toggle('en-vue', e.isIntersecting); visibles[e.target.id] = e.isIntersecting; });
    sale = true; reveille();
  }, { rootMargin: '120px 0px 120px 0px' });
  $$('.sec').forEach(function (s) { ioSec.observe(s); });
  var ioActif = new IntersectionObserver(function (es) {
    es.forEach(function (e) { var a = liens[e.target.id]; if (a) a.classList.toggle('actif', e.isIntersecting); });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('.sec').forEach(function (s) { ioActif.observe(s); });
  var ioEntre = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('vu'); ioEntre.unobserve(e.target); if (e.target._vu) e.target._vu(); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: .08 });
  $$('.entre').forEach(function (el) {
    var freres = $$('.entre', el.parentElement).filter(function (f) { return f.parentElement === el.parentElement; });
    el.style.setProperty('--d', freres.indexOf(el));
    ioEntre.observe(el);
  });
  [$('#fourneau')].forEach(function (el) { ioEntre.observe(el); });
  if (calme) $$('.entre').forEach(function (e) { e.classList.add('vu'); });

  // ---------- 2. le fourneau : on soulève les couvercles ----------
  var fourneau = $('#fourneau'), feux = $$('.feu', fourneau);
  function leve(f, o) {
    f.classList.toggle('ouvert', o); $('.cocotte', f).setAttribute('aria-expanded', o);
    fourneau.classList.toggle('o' + (feux.indexOf(f) + 1), o);
  }
  feux.forEach(function (f) {
    $('.cocotte', f).addEventListener('click', function () { fourneau._joue = true; leve(f, !f.classList.contains('ouvert')); });
    $('.fiche-zone', f).addEventListener('click', function () { if (f.classList.contains('ouvert')) leve(f, false); });
  });
  fourneau._vu = function () { setTimeout(function () { if (!fourneau._joue) leve(feux[0], true); }, calme ? 0 : 1300); setTimeout(function () { if (!fourneau._joue) leve(feux[2], true); }, calme ? 0 : 1750); };

  // ---------- 3. la rôtissoire ----------
  var roti = $('#rotissoire'), roue = $('#roue'), rayons = $('#rayons'), bras = $$('.bras', roue), bals = $$('.bal', roue), maniv = $('#manivelle');
  var jauge = $('#jauge'), motC = $('#cuisson-mot'), btnF = $('#fournee');
  var R = { a: 0, v: 14, tenu: false, cuit: 0, pret: false, rayon: 100, etat: -1, q: -1 }, NB = bals.length, PAS = 360 / NB;
  function mesureRoue() { R.rayon = roue.clientWidth * .36; }
  var MOTS = ['Ça tourne, ça commence à dorer.', 'Ça dore, encore un tour.', 'Presque : encore un petit tour.', 'Doré à point : c’est prêt.'];
  // les cinq bras tournent ensemble : on tourne leur support, une seule écriture par image
  for (var ib = 0; ib < NB; ib++) bras[ib].style.transform = 'rotate(' + (ib * PAS - 90) + 'deg)';
  function poseRoue(t) {
    rayons.style.transform = 'rotate(' + R.a.toFixed(2) + 'deg)';
    var incl = borne(-R.v * .05, -22, 22);
    for (var j = 0; j < NB; j++) {
      var g = (R.a + j * PAS) * Math.PI / 180;
      bals[j].style.transform = 'translate(' + (Math.sin(g) * R.rayon).toFixed(1) + 'px,' + (-Math.cos(g) * R.rayon).toFixed(1) + 'px) rotate(' + (incl + Math.sin(t * 2.2 + j) * 2.5).toFixed(2) + 'deg)';
    }
    maniv.style.transform = 'rotate(' + (R.a * 2).toFixed(1) + 'deg)';
  }
  function cuire(d) {
    if (R.pret) return;
    R.cuit = Math.min(1, R.cuit + Math.abs(d) / 1500);
    // la couleur des volailles ne change que par paliers de 1/200 : on ne repeint les balancelles que quand l'œil peut le voir
    var q = Math.round(R.cuit * 200);
    if (q !== R.q) {
      if (Math.round(q / 4) !== Math.round(R.q / 4)) roti.style.setProperty('--dore', (Math.round(q / 4) / 50).toFixed(3));
      R.q = q; jauge.style.transform = 'scaleX(' + (q / 200).toFixed(3) + ')';
    }
    var e = R.cuit >= 1 ? 3 : R.cuit > .66 ? 2 : R.cuit > .3 ? 1 : 0;
    if (e !== R.etat) { R.etat = e; motC.textContent = MOTS[e]; }
    if (R.cuit >= 1) { R.pret = true; roti.classList.add('pret'); btnF.hidden = false; }
  }
  btnF.addEventListener('click', function () { R.pret = false; R.cuit = 0; R.etat = -1; roti.classList.remove('pret'); btnF.hidden = true; cuire(0); R.v = 220; reveille(); });
  acteurs.push(function (dt, t) {
    if (!visibles.broche) return false;
    if (!R.tenu) { var d = R.v * dt; R.a += d; cuire(d); R.v += ((calme ? 0 : 14) - R.v) * Math.min(1, dt * 1.3); }
    poseRoue(t);
    return !calme || Math.abs(R.v) > 1 || R.tenu;
  });
  (function () {
    var cx, cy, a0, tPrec, vMes = 0;
    function angle(e) { return Math.atan2(e.clientY - cy, e.clientX - cx) * 180 / Math.PI; }
    roue.addEventListener('pointerdown', function (e) {
      var r = roue.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2; a0 = angle(e); tPrec = performance.now(); vMes = 0; R.tenu = true;
      try { roue.setPointerCapture(e.pointerId); } catch (x) {} reveille();
    });
    roue.addEventListener('pointermove', function (e) {
      if (!R.tenu) return;
      var a1 = angle(e), d = a1 - a0; if (d > 180) d -= 360; if (d < -180) d += 360; a0 = a1;
      var t = performance.now(), dt = Math.max(8, t - tPrec) / 1000; tPrec = t;
      R.a += d; cuire(d); vMes = vMes * .6 + (d / dt) * .4;
    });
    function lache() { if (!R.tenu) return; R.tenu = false; R.v = borne(vMes, -620, 620); reveille(); }
    roue.addEventListener('pointerup', lache); roue.addEventListener('pointercancel', lache); roue.addEventListener('lostpointercapture', lache);
  })();

  // ---------- 4. à emporter ----------
  var JUS = { broche: '#d2811f', chaudron: '#a4501a', jour: 'var(--acc)', epicerie: '#8a9a3a' };
  var qte = {}, plan = $('#plan'), pile = $('#pile'), tL = $('#t-lignes'), bonL = $('#bon-lignes'), btnFermer = $('#fermer'), tFin = $('#t-fin');
  var fini = false, devis = 0, MAXB = 14;
  (C.emporter || []).forEach(function (e) { qte[e.cle] = 0; });
  function total() { return Object.keys(qte).reduce(function (s, k) { return s + qte[k]; }, 0); }
  function ligne(n, texte) { var li = cree('li'); li.appendChild(cree('b', '', n + ' ×')); li.appendChild(document.createTextNode(texte)); return li; }
  function ecrire() {
    [tL, bonL].forEach(function (ul, quel) {
      ul.textContent = '';
      (C.emporter || []).forEach(function (e) { if (qte[e.cle]) ul.appendChild(ligne(qte[e.cle], qte[e.cle] > 1 ? e.plusieurs : e.un)); });
      if (quel === 1 && devis) { var li = cree('li'); li.appendChild(cree('b', '', devis)); li.appendChild(document.createTextNode(' convives : devis traiteur')); ul.appendChild(li); }
      if (!ul.children.length) ul.appendChild(cree('li', 't-rien', quel ? 'Rien de noté. Passez par « À emporter » ou par « Le traiteur ».' : 'Rien de noté pour l’instant.'));
    });
    $$('.choix').forEach(function (c) { $('output', c).textContent = qte[c.dataset.cle]; });
    var t = total(); plan.classList.toggle('plein', t > 0); btnFermer.disabled = !t && !fini;
  }
  function dessinePile() {
    var vus = $$('.barq:not(.plus)', pile), reste = total() - vus.length, plus = $('.barq.plus', pile);
    if (reste > 0) { if (!plus) { plus = cree('span', 'barq plus'); pile.appendChild(plus); } plus.textContent = '+ ' + reste; } else if (plus) plus.remove();
  }
  function barquette(cle) { var b = cree('span', 'barq'); b.dataset.t = cle; var c = cree('i', 'bq-c'); c.style.setProperty('--jus', JUS[cle]); b.appendChild(c); b.appendChild(cree('i', 'bq-l')); return b; }
  function rouvrir() { if (!fini) return; fini = false; plan.classList.remove('fini'); $$('.barq', pile).forEach(function (b) { b.classList.remove('ferme'); }); btnFermer.textContent = 'Fermer les barquettes'; tFin.textContent = ''; }
  function ajoute(cle, choix) {
    if (qte[cle] >= 30) return; rouvrir(); qte[cle]++;
    choix.classList.remove('tinte'); void choix.offsetWidth; choix.classList.add('tinte');
    var plusB = $('.barq.plus', pile);
    if ($$('.barq:not(.plus)', pile).length < MAXB) {
      var b = barquette(cle); pile.insertBefore(b, plusB);
      if (!calme && choix.animate) { b.style.visibility = 'hidden'; // la barquette vole de l'assiette au plan de travail
        var r0 = $('.assiette', choix).getBoundingClientRect(), r1 = pile.getBoundingClientRect(), v = barquette(cle);
        v.style.cssText = 'position:fixed;z-index:80;left:0;top:0;animation:none;pointer-events:none';
        document.body.appendChild(v);
        var x0 = r0.left + r0.width / 2 - 37, y0 = r0.top + r0.height / 2 - 20, x1 = r1.left + r1.width / 2 - 37, y1 = r1.top + Math.max(0, r1.height - 40);
        v.animate([{ transform: 'translate(' + x0 + 'px,' + y0 + 'px) scale(.5) rotate(-20deg)' }, { transform: 'translate(' + ((x0 + x1) / 2) + 'px,' + (Math.min(y0, y1) - 90) + 'px) scale(1.1) rotate(10deg)', offset: .55 }, { transform: 'translate(' + x1 + 'px,' + y1 + 'px) scale(1) rotate(0deg)' }], { duration: 460, easing: 'cubic-bezier(.4,0,.6,1)' }).onfinish = function () { v.remove(); b.style.visibility = ''; };
      }
    }
    ecrire(); dessinePile();
  }
  function retire(cle) {
    if (!qte[cle]) return; rouvrir(); qte[cle]--;
    var l = $$('.barq[data-t="' + cle + '"]', pile); if (l.length) l[l.length - 1].remove();
    ecrire(); dessinePile();
  }
  $$('.choix').forEach(function (c) {
    var cle = c.dataset.cle;
    $('.plus', c).addEventListener('click', function () { plan._joue = true; ajoute(cle, c); });
    $('.moins', c).addEventListener('click', function () { plan._joue = true; retire(cle); });
    $('.assiette', c).addEventListener('click', function () { plan._joue = true; ajoute(cle, c); });
  });
  btnFermer.addEventListener('click', function () {
    if (fini) { Object.keys(qte).forEach(function (k) { qte[k] = 0; }); pile.textContent = ''; rouvrir(); ecrire(); return; }
    if (!total()) return;
    fini = true; plan.classList.add('fini');
    $$('.barq:not(.plus)', pile).forEach(function (b, i) { setTimeout(function () { b.classList.add('ferme'); }, calme ? 0 : i * 60); });
    btnFermer.textContent = 'Recommencer';
    tFin.textContent = 'Commande prête. Sur votre vrai site, elle arrive directement chez vous, avec l’heure de retrait.';
  });
  ecrire();
  plan._vu = function () { // petite démonstration à l'arrivée : trois barquettes se posent
    if (calme) return;
    ['broche', 'chaudron', 'jour'].forEach(function (cle, i) { setTimeout(function () { if (!plan._joue) ajoute(cle, $('.choix[data-cle="' + cle + '"]')); }, 700 + i * 420); });
  };

  // ---------- 5. le garde-manger ----------
  var garde = $('#garde'), armoire = $('.armoire', garde), portes = [$('.pg', garde), $('.pd', garde)], etiq = $('#etiquette'), etNom = $('#et-nom');
  var RANGS = ['étagère du haut', 'étagère du milieu', 'étagère du bas'], ouv = { v: 0, auto: false };
  function choisir(a) {
    $$('.art.choisi', garde).forEach(function (x) { x.classList.remove('choisi'); });
    a.classList.add('choisi'); a.classList.remove('saute'); void a.offsetWidth; a.classList.add('saute');
    var rang = $$('.etage', garde).indexOf(a.parentElement);
    etNom.textContent = a.dataset.n + ', ' + RANGS[rang];
    etiq.classList.remove('change'); void etiq.offsetWidth; etiq.classList.add('change');
  }
  $$('.art', garde).forEach(function (a) { a.addEventListener('click', function () { ouv.auto = true; choisir(a); }); });

  // ---------- 6. le traiteur : la louche sur la tringle ----------
  var curseur = $('#curseur'), poignee = $('#poignee'), nbEl = $('#nb'), occ = $('#occasion'), marmite = $('#marmite'), pileA = $('#pile-ass'), lienDevis = $('#devis'), banquet = $('#banquet');
  var T = { x: 0, n: 0 };
  var pLouche = pendule(poignee, function (a) { poignee.style.rotate = a.toFixed(2) + 'deg'; }, { k: 40, d: 3, max: 24 });
  function convives(x) { return Math.round(2 + 198 * Math.pow(x, 2.2)); }
  function regle(x, sansBalancer) {
    x = borne(x, 0, 1); var n = convives(x);
    if (!sansBalancer) pousse(pLouche, (x - T.x) * -900);
    T.x = x; banquet.style.setProperty('--x', x.toFixed(4));
    if (n === T.n) return; T.n = n;
    nbEl.textContent = n; poignee.setAttribute('aria-valuenow', n);
    marmite.style.setProperty('--s', (.4 + .6 * Math.pow(x, .8)).toFixed(3));
    var o = ''; (C.occasions || []).forEach(function (p) { if (n >= p[0]) o = p[1]; }); occ.textContent = o;
    lienDevis.textContent = 'Demander un devis pour ' + n + ' convives';
    var na = borne(Math.round(n / 8), 1, 20);
    while (pileA.children.length < na) pileA.appendChild(cree('i'));
    while (pileA.children.length > na) pileA.lastChild.remove();
  }
  (function () {
    var tenu = false;
    function depuis(e) { var r = curseur.getBoundingClientRect(); regle((e.clientX - r.left) / r.width); }
    curseur.addEventListener('pointerdown', function (e) { tenu = true; banquet._joue = true; try { curseur.setPointerCapture(e.pointerId); } catch (x) {} depuis(e); e.preventDefault(); });
    curseur.addEventListener('pointermove', function (e) { if (tenu) depuis(e); });
    function fin() { tenu = false; }
    curseur.addEventListener('pointerup', fin); curseur.addEventListener('pointercancel', fin);
    poignee.addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? .03 : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -.03 : 0;
      if (d) { banquet._joue = true; regle(T.x + d); e.preventDefault(); }
    });
  })();
  curseur.style.touchAction = 'pan-y';
  regle(.257, true);
  lienDevis.addEventListener('click', function () { devis = T.n; ecrire(); });
  banquet._vu = function () { // petite démonstration à l'arrivée : la louche part de 2 et vient se poser
    if (calme) return; var t0 = performance.now();
    acteurs.push(function () { if (banquet._joue) return false; var k = (performance.now() - t0) / 1500; if (k >= 1) { regle(.5); return false; } regle(lisse(k) * .5); return true; });
    reveille();
  };

  // ---------- 7. le bassin : la marée ----------
  var bassin = $('#bassin'), maree = $('#maree'), pinasse = $('#pinasse'), btnM = $('#maree-btn');
  var M = { v: 0, mode: null, sc: 0, etroit: false };
  btnM.addEventListener('click', function () {
    M.mode = M.mode === 'bas' ? 'haut' : 'bas';
    btnM.setAttribute('aria-pressed', M.mode === 'bas'); btnM.textContent = M.mode === 'bas' ? 'Faire remonter la marée' : 'Faire descendre la marée'; reveille();
  });
  acteurs.push(function (dt) {
    if (!visibles.venir) return false;
    var cible = M.mode === 'bas' ? 1 : M.mode === 'haut' ? 0 : borne(M.sc * .9 - .2, 0, .42);
    var avant = M.v; M.v += (cible - M.v) * Math.min(1, dt * (calme ? 60 : 1.6));
    var niveau = 330 + M.v * 112, y = Math.min(niveau - 12, 386);
    maree.setAttribute('transform', 'translate(0 ' + (M.v * 112).toFixed(1) + ')');
    pinasse.setAttribute('transform', 'translate(' + (M.etroit ? 250 + M.sc * 260 : 330 + M.sc * 620).toFixed(1) + ' ' + y.toFixed(1) + ')');
    bassin.classList.toggle('basse', niveau - 12 > 388);
    return Math.abs(cible - M.v) > .002 || Math.abs(avant - M.v) > .0005;
  });

  // ---------- 8. commander : la cloche, les plaques suspendues ----------
  var zoneC = $('#cloche-zone'), motCl = $('#cloche-mot');
  $('#envoyer').addEventListener('click', function () { zoneC.classList.add('sous-cloche'); motCl.textContent = 'C’est sous cloche. Sur votre vrai site, la commande arrive directement chez vous.'; });
  $('#cloche').addEventListener('click', function () { zoneC.classList.remove('sous-cloche'); motCl.textContent = ''; });
  var numero = $('#numero'), susp = $('#suspendues');
  var pNum = pendule(numero, function (a) { numero.style.setProperty('--bal', a.toFixed(2)); }, { k: 30, d: 2, max: 12 });
  var pSusp = pendule(susp, function (a) { susp.style.setProperty('--bal', a.toFixed(2)); }, { k: 26, d: 1.8, max: 12 });
  [[numero, pNum], [susp, pSusp]].forEach(function (c) {
    c[0].addEventListener('pointermove', function (e) { pousse(c[1], borne(e.movementX || 0, -24, 24) * .5); });
    c[0].addEventListener('pointerdown', function () { pousse(c[1], 40); });
  });

  // ---------- défilement : tringle, eau, portes, balancements ----------
  // Les positions dans la page sont mesurées une fois (chargement, polices, redimensionnement, changement de hauteur du corps)
  // et gardées en mémoire : à chaque image on ne lit plus que scrollY, puis on écrit.
  var eaux = $$('.eau').map(function (e) { var i = $$('i', e); return { el: e, sec: e.parentElement, a: i[0], b: i[1], dx: '' }; });
  var photos = $$('.photo').map(function (f, i) { return { el: f, base: 3, k: i % 2 ? 1 : -1, haut: 0, h: 0, r: '' }; });
  var yPrec = scrollY, sale = true, tetePrec = 0, MAX = 1, pPrec = -1, posArm = 0, posBas = 0, hBas = 1;
  var paysage = $('.paysage', bassin), logoPot = $('.logo-pot', tete);
  function hautDoc(el) { var y = 0; while (el) { y += el.offsetTop; el = el.offsetParent; } return y; } // position de mise en page, sans les transformations
  function mesure() {
    mesureRoue(); M.etroit = innerWidth <= 900; paysage.setAttribute('preserveAspectRatio', M.etroit ? 'xMinYMax slice' : 'xMidYMax slice');
    MAX = document.scrollingElement.scrollHeight - innerHeight;
    posArm = hautDoc(armoire); posBas = hautDoc(bassin); hBas = bassin.offsetHeight || 1;
    photos.forEach(function (p) { p.base = parseFloat(getComputedStyle(p.el).getPropertyValue('--r')) || 3; p.haut = hautDoc(p.el); p.h = p.el.offsetHeight; });
    sale = true; reveille();
  }
  addEventListener('scroll', function () { sale = true; reveille(); }, { passive: true });
  addEventListener('resize', mesure);
  if (window.ResizeObserver) new ResizeObserver(function () { mesure(); }).observe(document.body);
  var REMUE = [{ transform: 'none', easing: 'cubic-bezier(.2,.8,.2,1)' }, { transform: 'rotate(-14deg)', offset: .3, easing: 'cubic-bezier(.2,.8,.2,1)' }, { transform: 'rotate(9deg)', offset: .65, easing: 'cubic-bezier(.2,.8,.2,1)' }, { transform: 'none' }];
  acteurs.push(function () {
    if (!sale) return false; sale = false;
    var y = Y, vh = VH, dy = y - yPrec; yPrec = y;
    var p = MAX > 0 ? borne(y / MAX, 0, 1) : 0;
    if (Math.abs(p - pPrec) > .0004) { pPrec = p; chauffe.style.transform = 'scaleX(' + p.toFixed(4) + ')'; }
    var dx = (y * .22) % 120, dxs = dx.toFixed(1);
    eaux.forEach(function (o) { if (visibles[o.sec.id] && o.dx !== dxs) { o.dx = dxs; o.a.style.transform = 'translateX(' + (-dx - 60).toFixed(1) + 'px)'; o.b.style.transform = 'translateX(' + dxs + 'px)'; } });
    if (calme) { armoire.style.setProperty('--ouv', 1); M.sc = .5; return false; }
    if (dy) {
      var f = borne(dy, -60, 60);
      if (visibles.accueil) pousse(pPot, f * .5);
      if (visibles.traiteur) pousse(pLouche, f * .7);
      if (visibles.commander) { pousse(pNum, f * .55); pousse(pSusp, f * .5); }
      if (visibles.broche && !R.tenu) { R.v = borne(R.v + f * 2.6, -420, 420); }
      if (Math.abs(dy) > 30 && performance.now() - tetePrec > 900 && logoPot.animate) { tetePrec = performance.now(); logoPot.animate(REMUE, { duration: 500 }); }
    }
    if (visibles.epicerie) {
      var o = lisse((vh * .94 - (posArm - y)) / (vh * .58));
      if (Math.abs(o - ouv.v) > .002) { ouv.v = o; portes[0].style.transform = 'rotateY(' + (o * -106).toFixed(2) + 'deg)'; portes[1].style.transform = 'rotateY(' + (o * 106).toFixed(2) + 'deg)'; }
      if (o > .97 && !ouv.auto) { ouv.auto = true; setTimeout(function () { if (!$('.art.choisi', garde)) choisir($$('.art', garde)[6]); }, 500); }
    }
    if (visibles.venir) M.sc = borne((vh - (posBas - y)) / (vh + hBas), 0, 1);
    photos.forEach(function (ph) {
      var top = ph.haut - y; if (top + ph.h < 0 || top > vh) return;
      var r = (ph.base + ph.k * ((top + ph.h / 2 - vh / 2) / vh) * 7).toFixed(2) + 'deg';
      if (r !== ph.r) { ph.r = r; ph.el.style.rotate = r; }
    });
    return false;
  });

  mesure();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(mesure);
  addEventListener('load', mesure);
})();
