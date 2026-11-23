/* Espace ONE : toute la mise en scène.
 *
 * Le site ne lit pas le réglage « mouvements réduits » de l'appareil : sur le PC de Mathéo, Windows coupe les
 * animations et un site qui obéit y paraît figé. Une version calme existe sur demande : ?calme=1 (retenu),
 * ?calme=0 pour revenir.
 */
(function () {
  'use strict';

  var doc = document.documentElement;
  var corps = document.body;
  var params = new URLSearchParams(location.search);
  try {
    if (params.get('calme') === '1') localStorage.setItem('one-calme', '1');
    if (params.get('calme') === '0') localStorage.removeItem('one-calme');
  } catch (e) {}
  var CALME = false;
  try { CALME = localStorage.getItem('one-calme') === '1'; } catch (e) {}
  if (CALME) doc.classList.add('calme');

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var borne = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var lisse = function (x) { x = borne(x, 0, 1); return x * x * (3 - 2 * x); };
  var melange = function (a, b, k) { return a + (b - a) * k; };
  var hauteur = function () { return window.innerHeight; };

  /* ---------------- Défilement doux ---------------- */
  var lenis = null;
  if (!CALME && window.Lenis) {
    lenis = new window.Lenis({ duration: 1.15, easing: function (t) { return 1 - Math.pow(1 - t, 3.2); }, smoothWheel: true, wheelMultiplier: 0.95 });
  }
  function allerA(cible) {
    if (lenis) lenis.scrollTo(cible, { offset: -20, duration: 1.6 });
    else (typeof cible === 'number' ? window.scrollTo(0, cible) : cible.scrollIntoView({ behavior: 'smooth' }));
  }

  /* ---------------- Les fonds : chaque section se fond dans la suivante ---------------- */
  var COULEURS = { creme: '#f4efe6', sable: '#ebe2d3', nuit: '#14161b', aube: '#f2e9dc' };
  var sections = $$('main > section, .pied');
  sections.forEach(function (s, i) {
    var f = s.getAttribute('data-fond') || 'creme';
    var avant = i > 0 ? (sections[i - 1].getAttribute('data-fond') || 'creme') : f;
    s.style.setProperty('--couleur', COULEURS[f]);
    s.style.setProperty('--avant', COULEURS[avant]);
    s.classList.add('fond-' + f);
    if (avant !== f) s.classList.add('fondu');
  });

  /* ---------------- Le fil d'or, derrière tout le site ---------------- */
  var filCanvas = $('canvas.fil');
  var fil = filCanvas && window.Fil ? window.Fil.preparer(filCanvas) : null;
  var etatFil = { tension: 0.1, y: 0.6, alpha: 0.6, nuit: 0, respire: 0 };
  var cibleFil = { tension: 0.1, y: 0.6, alpha: 0.6, nuit: 0 };
  var tensionScene = 0.5;

  function lireSections() {
    var h = hauteur(), centre = h * 0.5;
    var poids = 0, t = 0, y = 0, a = 0, n = 0;
    sections.forEach(function (s) {
      var r = s.getBoundingClientRect();
      if (r.bottom < 0 || r.top > h) return;
      // Poids : la part de la section dans une bande autour du milieu de l'écran.
      var haut = Math.max(r.top, centre - h * 0.35), bas = Math.min(r.bottom, centre + h * 0.35);
      var w = Math.max(0, bas - haut);
      if (!w) return;
      var dt = s.getAttribute('data-tension');
      var dy = (window.innerWidth < 700 && s.getAttribute('data-fil-mobile')) || s.getAttribute('data-fil');
      var tension = dt === 'scene' ? tensionScene : parseFloat(dt || '0.1');
      var cache = dy === 'cache';
      var hy = cache ? 0.5 : parseFloat(dy || '0.5');
      poids += w; t += tension * w; y += hy * w;
      a += (cache ? 0 : s.classList.contains('fond-nuit') ? 0.95 : s.classList.contains('ouverture') ? 0.9 : 0.55) * w;
      n += (s.classList.contains('fond-nuit') ? 1 : 0) * w;
    });
    if (!poids) return;
    cibleFil.tension = t / poids; cibleFil.y = y / poids; cibleFil.alpha = a / poids; cibleFil.nuit = n / poids;
  }

  /* ---------------- L'accueil : la scène du mode alerte ---------------- */
  var alerte = $('.alerte');
  var alerteItems = alerte ? $$('.alerte-liste li', alerte) : [];
  function sceneAlerte() {
    if (!alerte) return;
    var r = alerte.getBoundingClientRect();
    var p = borne(-r.top / (r.height - hauteur()), 0, 1);
    var n = alerteItems.length;
    var fin = 0.8;
    alerteItems.forEach(function (li, i) {
      var debut = 0.05 + (i / n) * (fin - 0.12);
      li.classList.toggle('vu', p > debut);
      li.classList.toggle('actif', p > debut && (i === n - 1 ? p < fin : p < 0.05 + ((i + 1) / n) * (fin - 0.12)));
    });
    alerte.classList.toggle('fin', p > fin);
    alerte.style.setProperty('--p', p.toFixed(4));
    // La tension monte avec chaque phrase, puis retombe quand vient « de son mieux pour vous protéger ».
    var monte = melange(0.3, 1, lisse(p / fin));
    var retombe = lisse((p - fin) / (1 - fin));
    tensionScene = melange(monte, 0.06, retombe);
  }

  /* Les mots qu'on barre : on cesse de tout contrôler. */
  var barre = $('.tete-barre');
  function motsBarres() {
    if (!barre) return;
    var r = barre.getBoundingClientRect();
    var p = borne((hauteur() * 0.8 - r.top) / (hauteur() * 0.5), 0, 1);
    $$('span', barre).forEach(function (s, i) {
      var k = borne(p * 3.2 - i * 0.9, 0, 1);
      s.style.setProperty('--barre', k.toFixed(3));
    });
  }

  /* La piste des « plus de », qui défile de côté. */
  var plus = $('.plus');
  var piste = plus ? $('.plus-piste', plus) : null;
  function pistePlus() {
    if (!plus || !piste) return;
    var r = plus.getBoundingClientRect();
    var p = borne(-r.top / (r.height - hauteur()), 0, 1);
    var course = piste.scrollWidth - window.innerWidth * 0.55;
    piste.style.transform = 'translate3d(' + (-course * lisse(p * 1.08)).toFixed(1) + 'px,0,0)';
    var mots = $$('.plus-mot', piste);
    var centre = window.innerWidth * 0.5;
    mots.forEach(function (m) {
      var b = m.getBoundingClientRect();
      var d = Math.abs(b.left + b.width / 2 - centre) / window.innerWidth;
      m.style.setProperty('--proche', (1 - borne(d * 1.6, 0, 1)).toFixed(3));
    });
  }

  /* Les trois espaces empilés : la carte du dessous recule quand la suivante arrive. */
  var cartes = $$('.pile-carte');
  function pile() {
    cartes.forEach(function (c, i) {
      var suivante = cartes[i + 1];
      if (!suivante) { c.style.setProperty('--recul', 0); return; }
      var r = suivante.getBoundingClientRect();
      var k = borne(1 - (r.top - 120) / (hauteur() * 0.8), 0, 1);
      c.style.setProperty('--recul', k.toFixed(3));
    });
  }

  /* L'infini (LemniWave) : il se trace au défilement, un point le parcourt sans fin. */
  var infini = $('.infini');
  var trace = infini ? $('.infini-trace', infini) : null;
  var point = infini ? $('.infini-point', infini) : null;
  var longueur = trace ? trace.getTotalLength() : 0;
  if (trace) { trace.style.strokeDasharray = longueur; trace.style.strokeDashoffset = longueur; }
  function infiniDefile() {
    if (!infini) return;
    var r = infini.getBoundingClientRect();
    var p = borne((hauteur() - r.top) / (hauteur() * 0.9), 0, 1);
    trace.style.strokeDashoffset = (longueur * (1 - lisse(p))).toFixed(1);
    infini.style.setProperty('--p', p.toFixed(3));
  }
  function infiniPoint(t) {
    if (!point || !longueur) return;
    var q = trace.getPointAtLength(((t * 0.085) % 1) * longueur);
    point.setAttribute('cx', q.x.toFixed(2));
    point.setAttribute('cy', q.y.toFixed(2));
  }

  /* Le chemin : les phrases arrivent une à une, le soleil se lève. */
  var chemin = $('.chemin');
  function cheminDefile() {
    if (!chemin) return;
    var r = chemin.getBoundingClientRect();
    var p = borne((hauteur() - r.top) / (r.height + hauteur() * 0.2), 0, 1);
    chemin.style.setProperty('--p', p.toFixed(3));
    $$('.chemin-liste li', chemin).forEach(function (li, i) { li.classList.toggle('vu', p > 0.28 + i * 0.07); });
  }

  /* Les photos glissent un peu dans leur cadre. */
  var cadres = $$('.cadre img, .ouverture-photo img');
  function glisse() {
    var h = hauteur();
    cadres.forEach(function (img) {
      var r = img.parentNode.getBoundingClientRect();
      if (r.bottom < 0 || r.top > h) return;
      var k = (r.top + r.height / 2 - h / 2) / h;
      img.style.transform = 'translate3d(0,' + (k * -38).toFixed(1) + 'px,0) scale(1.1)';
    });
  }

  /* L'en-tête : il se retire quand on descend, revient quand on remonte, passe en clair sur la nuit. */
  var entete = $('.entete');
  var dernier = 0;
  function enteteDefile(y) {
    if (!entete) return;
    var descend = y > dernier + 4, monte = y < dernier - 4;
    if (y < 80) entete.classList.remove('cache');
    else if (descend && !corps.classList.contains('menu-ouvert')) entete.classList.add('cache');
    else if (monte) entete.classList.remove('cache');
    dernier = y;
    entete.classList.toggle('replie', y > 40);
    var sous = document.elementsFromPoint ? document.elementsFromPoint(window.innerWidth / 2, 60) : [];
    var nuit = false;
    for (var i = 0; i < sous.length; i++) {
      var s = sous[i].closest && sous[i].closest('section, footer');
      if (s) { nuit = s.classList.contains('fond-nuit'); break; }
    }
    entete.classList.toggle('sur-nuit', nuit);
  }

  /* Le bouton « Réserver » qui suit, au téléphone : après l'ouverture, jamais sur le pied de page. */
  var flottant = $('.rdv-flottant');
  var pied = $('.pied');
  function flottantDefile(y) {
    if (!flottant) return;
    var bas = pied ? pied.getBoundingClientRect().top < hauteur() - 40 : false;
    flottant.classList.toggle('visible', y > hauteur() * 0.8 && !bas && !corps.classList.contains('menu-ouvert'));
  }

  function auDefilement() {
    var y = window.scrollY || window.pageYOffset;
    sceneAlerte(); motsBarres(); pistePlus(); pile(); infiniDefile(); cheminDefile(); glisse();
    enteteDefile(y); flottantDefile(y); lireSections();
  }
  if (lenis) lenis.on('scroll', auDefilement);
  window.addEventListener('scroll', function () { if (!lenis) auDefilement(); }, { passive: true });
  window.addEventListener('resize', function () { if (fil) fil.taille(); ondes.forEach(function (o) { o.e.taille(); }); auDefilement(); });

  /* ---------------- Les apparitions ---------------- */
  var vus = new IntersectionObserver(function (entrees) {
    entrees.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('vu'); vus.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
  $$('.revele, .revele-photo, .pas-besoin li, .titre-page, .bloc, .tarif, .question').forEach(function (el, i) {
    vus.observe(el);
  });
  // Les cartes d'une même rangée arrivent l'une après l'autre.
  $$('.trois, .liste-tarifs, .modules').forEach(function (g) {
    $$(':scope > *', g).forEach(function (el, i) { el.style.setProperty('--retard', (i * 0.12) + 's'); });
  });

  /* ---------------- Les vagues des trois espaces ---------------- */
  var ondes = $$('.pile-onde').map(function (c) {
    var prof = parseInt(c.parentNode.getAttribute('data-profondeur'), 10) || 1;
    return { c: c, e: window.Fil.preparer(c), prof: prof, visible: false };
  });
  var voitOnde = new IntersectionObserver(function (entrees) {
    entrees.forEach(function (e) { ondes.forEach(function (o) { if (o.c === e.target) o.visible = e.isIntersecting; }); });
  });
  ondes.forEach(function (o) { voitOnde.observe(o.c); });
  function dessinerOndes(t) {
    ondes.forEach(function (o) {
      if (!o.visible) return;
      var e = o.e;
      e.ctx.clearRect(0, 0, e.l, e.h);
      // Plus l'espace est profond, plus l'onde est ample, lente et posée bas.
      window.Fil.dessiner(e.ctx, e.l, e.h, {
        y: e.h * (0.32 + o.prof * 0.14), tension: [0, 0.3, 0.12, 0][o.prof], ampleur: 8 + o.prof * 12,
        ondes: [0, 2.4, 1.5, 0.8][o.prof], or: '#d8b45e', lueur: 0.6, brins: o.prof, alpha: 0.85, nervosite: 10, pics: 0,
      }, t * (1.25 - o.prof * 0.2));
    });
  }

  /* ---------------- Respirer avec la ligne ---------------- */
  var boutonSouffle = $('.souffle');
  var motSouffle = boutonSouffle ? $('.souffle-mot', boutonSouffle) : null;
  var respire = false;
  var grandMot = null;
  function basculerSouffle(force) {
    respire = typeof force === 'boolean' ? force : !respire;
    corps.classList.toggle('respire', respire);
    if (respire && !grandMot) {
      grandMot = document.createElement('div');
      grandMot.className = 'respire-ecran';
      grandMot.innerHTML = '<p class="respire-mot">Inspirez</p><p class="respire-aide">Suivez la ligne. Touchez l\'écran ou appuyez sur Échap pour revenir.</p>';
      grandMot.addEventListener('click', function () { basculerSouffle(false); });
      corps.appendChild(grandMot);
    }
    if (lenis) { if (respire) lenis.stop(); else lenis.start(); }
  }
  if (boutonSouffle) boutonSouffle.addEventListener('click', function () { basculerSouffle(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { if (respire) basculerSouffle(false); fermerMenu(); } });

  /* ---------------- La boucle d'animation ---------------- */
  var debut = performance.now();
  var dernierSouffle = null;
  function image(maintenant) {
    var t = (maintenant - debut) / 1000;
    if (lenis) lenis.raf(maintenant);
    if (fil) {
      var k = 0.06;
      etatFil.tension = melange(etatFil.tension, cibleFil.tension, 0.08);
      etatFil.y = melange(etatFil.y, cibleFil.y, k);
      etatFil.alpha = melange(etatFil.alpha, cibleFil.alpha, k);
      etatFil.nuit = melange(etatFil.nuit, cibleFil.nuit, k);
      etatFil.respire = melange(etatFil.respire, respire ? 1 : 0, 0.05);
      var ctx = fil.ctx;
      ctx.clearRect(0, 0, fil.l, fil.h);
      var r = etatFil.respire;
      var nuit = Math.max(etatFil.nuit, r);
      window.Fil.dessiner(ctx, fil.l, fil.h, {
        y: fil.h * melange(etatFil.y, 0.5, r),
        tension: etatFil.tension * (1 - r),
        ampleur: melange(Math.min(26, fil.h * 0.035), fil.h * 0.16, r),
        ondes: melange(1.15, 0.5, r),
        or: nuit > 0.5 ? '#dcb862' : '#b38b3a',
        lueur: nuit,
        alpha: Math.max(etatFil.alpha, r),
        epaisseur: melange(1.6, 2.4, r),
      }, t);
    }
    var s = window.Fil.souffle(t);
    if (s.inspire !== dernierSouffle) {
      dernierSouffle = s.inspire;
      var mot = s.inspire ? 'Inspirez' : 'Expirez';
      if (motSouffle) motSouffle.textContent = mot;
      if (grandMot) $('.respire-mot', grandMot).textContent = mot;
      corps.classList.toggle('inspire', s.inspire);
    }
    if (boutonSouffle) boutonSouffle.style.setProperty('--souffle', s.valeur.toFixed(3));
    dessinerOndes(t);
    infiniPoint(t);
    requestAnimationFrame(image);
  }
  requestAnimationFrame(image);

  /* ---------------- Les témoignages, qui passent doucement ---------------- */
  var rail = $('.paroles-rail');
  if (rail) {
    var pisteParoles = $('.paroles-piste', rail);
    pisteParoles.innerHTML += pisteParoles.innerHTML;
    $$('.parole', pisteParoles).slice(pisteParoles.children.length / 2).forEach(function (p) { p.setAttribute('aria-hidden', 'true'); });
    var arret = false, x = 0, dernierT = performance.now();
    var tenir = function () { arret = true; };
    var lacher = function () { arret = false; x = rail.scrollLeft; };
    rail.addEventListener('pointerenter', tenir);
    rail.addEventListener('pointerleave', lacher);
    rail.addEventListener('touchstart', tenir, { passive: true });
    rail.addEventListener('touchend', function () { setTimeout(lacher, 2500); }, { passive: true });
    rail.addEventListener('focusin', tenir);
    rail.addEventListener('focusout', lacher);
    (function avance(m) {
      var dt = Math.min(64, m - dernierT); dernierT = m;
      if (!arret && !CALME) {
        x += dt * 0.035;
        var moitie = pisteParoles.scrollWidth / 2;
        if (x >= moitie) x -= moitie;
        rail.scrollLeft = x;
      }
      requestAnimationFrame(avance);
    })(dernierT);
  }

  /* ---------------- Le menu ---------------- */
  var boutonMenu = $('.bouton-menu');
  var menu = $('#menu');
  function ouvrirMenu() {
    if (!menu) return;
    menu.hidden = false;
    requestAnimationFrame(function () { corps.classList.add('menu-ouvert'); });
    boutonMenu.setAttribute('aria-expanded', 'true');
    $('span', boutonMenu).textContent = 'Fermer';
    if (lenis) lenis.stop();
  }
  function fermerMenu() {
    if (!menu || !corps.classList.contains('menu-ouvert')) return;
    corps.classList.remove('menu-ouvert');
    boutonMenu.setAttribute('aria-expanded', 'false');
    $('span', boutonMenu).textContent = 'Menu';
    if (lenis) lenis.start();
    setTimeout(function () { if (!corps.classList.contains('menu-ouvert')) menu.hidden = true; }, 600);
  }
  if (boutonMenu) boutonMenu.addEventListener('click', function () {
    corps.classList.contains('menu-ouvert') ? fermerMenu() : ouvrirMenu();
  });

  /* ---------------- Les ancres et les passages entre deux pages ---------------- */
  var voile = $('.voile');
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;
    var href = a.getAttribute('href') || '';
    var url = new URL(a.href, location.href);
    if (url.origin !== location.origin || /^(mailto|tel):/.test(href)) return;
    var memePage = url.pathname === location.pathname || (url.pathname.replace(/index\.html$/, '') === location.pathname.replace(/index\.html$/, ''));
    if (memePage && url.hash) {
      var cible = document.getElementById(url.hash.slice(1));
      if (cible) { e.preventDefault(); fermerMenu(); allerA(cible); history.replaceState(null, '', url.hash); }
      return;
    }
    if (!/\.html$|\/$/.test(url.pathname)) return;
    e.preventDefault();
    fermerMenu();
    if (CALME || !voile) { location.href = url.href; return; }
    corps.classList.add('part');
    setTimeout(function () { location.href = url.href; }, 720);
  });
  window.addEventListener('pageshow', function (e) { if (e.persisted) corps.classList.remove('part'); });

  function arrivee() {
    corps.classList.add('arrive');
    setTimeout(function () { corps.classList.add('pret'); }, 40);
    if (location.hash) {
      var c = document.getElementById(location.hash.slice(1));
      if (c) setTimeout(function () { allerA(c); }, 500);
    }
    auDefilement();
  }

  /* ---------------- Le chargement : du mode alerte au calme ---------------- */
  var chargement = $('.chargement');
  var dejaVu = doc.classList.contains('deja-vu');
  if (!chargement || dejaVu || CALME) {
    if (chargement) chargement.remove();
    arrivee();
  } else {
    var cc = window.Fil.preparer($('.chargement-fil', chargement));
    var pc = $('.chargement-pc', chargement), motC = $('.chargement-mot', chargement);
    var aCharger = $$('img').filter(function (i) { return i.loading !== 'lazy'; });
    var faits = 0, total = aCharger.length + 1;
    var compte = function () { faits++; };
    aCharger.forEach(function (i) { if (i.complete) compte(); else { i.addEventListener('load', compte); i.addEventListener('error', compte); } });
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(compte);
    var t0 = performance.now(), affiche = 0, fini = false;
    var MOTS = [[0, 'Le mode alerte'], [0.35, 'Le corps se pose'], [0.7, 'Le calme revient'], [1, 'Bienvenue']];
    (function boucle(m) {
      if (fini) return;
      var t = (m - t0) / 1000;
      var reel = faits / total;
      // Au moins 2,6 secondes : le temps de voir la ligne se calmer, jamais plus que le chargement réel.
      var cible = Math.min(reel, t / 2.6);
      affiche = melange(affiche, cible, 0.06);
      if (cible >= 1 && affiche > 0.995) affiche = 1;
      pc.textContent = Math.round(affiche * 100);
      for (var i = MOTS.length - 1; i >= 0; i--) if (affiche >= MOTS[i][0]) { if (motC.textContent !== MOTS[i][1]) motC.textContent = MOTS[i][1]; break; }
      cc.ctx.clearRect(0, 0, cc.l, cc.h);
      window.Fil.dessiner(cc.ctx, cc.l, cc.h, { y: cc.h * 0.5, tension: 1 - lisse(affiche * 1.1), ampleur: cc.h * 0.05, or: '#dcb862', lueur: 1, alpha: 1, epaisseur: 2 }, t);
      if (affiche >= 1) {
        fini = true;
        chargement.classList.add('ouvre');
        try { sessionStorage.setItem('one-vu', '1'); } catch (e) {}
        setTimeout(arrivee, 350);
        setTimeout(function () { chargement.remove(); }, 1700);
        return;
      }
      requestAnimationFrame(boucle);
    })(t0);
    // Si quelque chose ne charge jamais, on ouvre quand même au bout de 7 secondes.
    setTimeout(function () { faits = total; }, 7000);
  }
})();

// Aperçu : le formulaire ne part pas, on le dit.
document.querySelectorAll('form[data-apercu]').forEach(function (f) {
  f.addEventListener('submit', function (e) { e.preventDefault(); var n = f.querySelector('.note-apercu'); if (n) n.hidden = false; });
});
