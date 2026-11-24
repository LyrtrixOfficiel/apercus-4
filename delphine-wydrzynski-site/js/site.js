/* Espace ONE : toute la mise en scène, autour du lac (js/lac.js).
 *
 * Chaque « scène » donne l'état du lac qu'elle veut : data-lac="jour vent pan zoom y brume".
 * Entre deux scènes, le lac passe de l'une à l'autre au défilement. Quatre scènes de l'accueil pilotent
 * le lac elles-mêmes (data-scene) : la pluie des questions, le corps, le panoramique des « plus de »,
 * l'infini de LemniWave, et l'axe de la fin.
 *
 * Le site ne lit pas le réglage « mouvements réduits » de l'appareil : sur le PC de Mathéo, Windows coupe les
 * animations et un site qui obéit y paraît figé. Version calme sur demande : ?calme=1 (retenu), ?calme=0.
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

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var borne = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var lisse = function (x) { x = borne(x, 0, 1); return x * x * (3 - 2 * x); };
  var mel = function (a, b, k) { return a + (b - a) * k; };
  var VH = innerHeight;
  var accueil = corps.getAttribute('data-page') === 'accueil';

  /* ---------------- défilement doux ---------------- */
  var lenis = null;
  if (!CALME && window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.085, wheelMultiplier: 0.95, touchMultiplier: 1.2 });
  }
  window.oneLenis = lenis;
  var allerA = function (cible) {
    if (lenis) lenis.scrollTo(cible, { duration: 2.2, easing: function (t) { return 1 - Math.pow(1 - t, 4); } });
    else if (typeof cible === 'number') scrollTo(0, cible); else cible.scrollIntoView();
  };

  /* ---------------- le lac ---------------- */
  var toile = $('canvas.lac');
  var lacPret = false, quandPret = [];
  var lacOk = !!(window.Lac && toile && window.Lac.init(toile, {
    dossier: 'images/',
    pret: function () { lacPret = true; quandPret.forEach(function (f) { f(); }); }
  }));
  if (!lacOk) { doc.classList.add('sans-lac'); lacPret = true; }
  var Lac = lacOk ? window.Lac : { regler: function () {}, imposer: function () {}, goutte: function () {}, dessiner: function () {}, versPhoto: function () { return [0, 0]; }, HORIZON: .6, etat: { jour: 1, vent: 0 }, temps: function () { return 0; } };

  var scenes = $$('[data-lac]').map(function (el) {
    var v = el.getAttribute('data-lac').trim().split(/\s+/).map(Number);
    return { el: el, v: { jour: v[0], vent: v[1], pan: v[2], zoom: v[3], y: v[4], brume: v[5] }, haut: 0, bas: 0, etat: el.getAttribute('data-etat') || '' };
  });
  var tons = $$('main > section, .pied').map(function (el) { return { el: el, ton: el.getAttribute('data-ton') || (el.classList.contains('scene') ? 'sombre' : 'clair'), haut: 0, bas: 0 }; });

  function mesurer() {
    VH = innerHeight;
    var sy = scrollY;
    scenes.forEach(function (s) { var r = s.el.getBoundingClientRect(); s.haut = r.top + sy; s.bas = r.bottom + sy; });
    tons.forEach(function (s) { var r = s.el.getBoundingClientRect(); s.haut = r.top + sy; s.bas = r.bottom + sy; });
    epingles.forEach(function (e) { var r = e.el.getBoundingClientRect(); e.haut = r.top + sy; e.long = Math.max(1, r.height - VH); });
  }
  if (scenes.length) Lac.imposer(scenes[0].v);

  // L'avancée d'une scène épinglée : 0 quand elle touche le haut de l'écran, 1 quand elle le quitte.
  var epingles = $$('[data-scene]').map(function (el) { return { el: el, nom: el.getAttribute('data-scene'), haut: 0, long: 1 }; });
  var avance = function (e) { return borne((scrollY - e.haut) / e.long, 0, 1); };

  /* ---------------- les scènes qui pilotent le lac ---------------- */
  var pilotes = {};
  var derniereGoutte = 0;
  var pleut = function (t, cadence, force) {
    if (t - derniereGoutte < cadence) return;
    derniereGoutte = t;
    Lac.goutte(0.08 + Math.random() * 0.84, Lac.HORIZON + 0.06 + Math.random() * 0.36, force * (0.6 + Math.random() * 0.6));
  };

  // « Vous sentez-vous souvent… » : chaque question est une goutte, puis il pleut, puis la phrase qui apaise.
  (function () {
    var sc = $('.alerte'); if (!sc) return;
    var items = $$('.alerte-liste li', sc), n = $('.alerte-n', sc), vu = -1;
    pilotes.alerte = function (p, t, lac) {
      var k = Math.floor(borne((p - 0.06) / 0.62, 0, 0.999) * 7);
      if (p < 0.06) k = 0;
      k = Math.min(k, 6);
      if (k !== vu) {
        items.forEach(function (li, i) { li.classList.toggle('la', i === k - 1); li.classList.toggle('passe', i < k - 1); });
        if (k > vu && k > 0) { for (var g = 0; g < 3; g++) Lac.goutte(0.2 + Math.random() * 0.6, Lac.HORIZON + 0.1 + Math.random() * 0.3, 1.3); }
        n.textContent = k; vu = k;
      }
      var repond = p > 0.74;
      sc.classList.toggle('repond', repond);
      if (!repond && p > 0.04) pleut(t, 0.42 - k * 0.05, 0.8 + k * 0.08);
      var apaise = lisse((p - 0.74) / 0.26);
      lac.jour = mel(0.02, 0.16, apaise); lac.vent = mel(1, 0.72, apaise); lac.pan = mel(-0.35, 0.1, p);
      lac.zoom = mel(1.22, 1.12, p); lac.y = 0.62; lac.brume = 0.1 * apaise;
    };
  })();

  // Le corps : les trois phrases de la tête se barrent, puis « le corps possède son propre langage ».
  (function () {
    var sc = $('.corps'); if (!sc) return;
    var barres = $$('.barre', sc);
    pilotes.corps = function (p, t, lac) {
      barres.forEach(function (b, i) {
        var q = lisse((p - 0.08 - i * 0.18) / 0.16);
        b.style.setProperty('--p', q.toFixed(3));
        b.classList.toggle('barree', q > 0.98);
      });
      sc.classList.toggle('parle', p > 0.66);
      lac.jour = mel(0.2, 0.42, p); lac.vent = mel(0.7, 0.42, lisse(p)); lac.pan = mel(0.1, -0.2, p);
      lac.zoom = 1.14; lac.y = 0.5; lac.brume = mel(0.1, 0.5, p);
    };
  })();

  // Les « plus de » : on longe le lac, les mots défilent de côté, le vent tombe, l'aube arrive.
  (function () {
    var sc = $('.plus'); if (!sc) return;
    var piste = $('.plus-piste', sc);
    pilotes.plus = function (p, t, lac) {
      var course = piste.scrollWidth - innerWidth * 0.5;
      var q = lisse(p * 1.05);
      piste.style.transform = 'translate3d(' + (-course * q).toFixed(1) + 'px,0,0)';
      sc.classList.toggle('fini', p > 0.86);
      lac.jour = mel(0.46, 0.76, p); lac.vent = mel(0.36, 0.12, p); lac.pan = mel(-1, 1, q);
      lac.zoom = 1.34; lac.y = 0.56; lac.brume = mel(0.6, 0.95, p);
    };
  })();

  // L'approche : l'infini se trace, un point le parcourt, et les ronds dans l'eau suivent la même figure.
  (function () {
    var sc = $('.approche'); if (!sc) return;
    var svg = $('.infini', sc), chemin = svg && $('path', svg), point = svg && $('.infini-point', svg);
    var L = chemin ? chemin.getTotalLength() : 0, dernier = 0;
    pilotes.approche = function (p, t, lac) {
      var r = sc.getBoundingClientRect();
      var trace = lisse((VH - r.top) / (VH * 0.9));
      if (svg) svg.style.setProperty('--p', trace.toFixed(3));
      if (point && L) {
        var pt = chemin.getPointAtLength(((t * 0.09) % 1) * L);
        point.setAttribute('cx', pt.x.toFixed(1)); point.setAttribute('cy', pt.y.toFixed(1));
      }
      if (t - dernier > 0.45 && r.top < VH * 0.6 && r.bottom > VH * 0.4) {
        dernier = t;
        var a = t * 0.9, s = Math.sin(a), c = Math.cos(a), d = 1 + s * s;
        Lac.goutte(0.5 + 0.22 * c / d, Lac.HORIZON + 0.2 + 0.14 * s * c / d, 0.7);
      }
    };
  })();

  // La fin : l'axe descend jusqu'au lac, le lac est un miroir.
  (function () {
    var sc = $('.fin'); if (!sc) return;
    var axe = $('.fin-axe', sc);
    pilotes.fin = function (p, t, lac) {
      var r = sc.getBoundingClientRect();
      var ra = axe.getBoundingClientRect(); axe.style.setProperty('--p', lisse((VH * 0.85 - ra.top) / (VH * 0.35)).toFixed(3));
    };
  })();

  /* ---------------- l'état du lac à chaque image ---------------- */
  var instrument = $('.instrument'), iPoint = $('.instrument-point'), iEtat = $('.instrument-etat'), etatAffiche = '';
  var entete = $('.entete');
  var lacVisible = true;

  function lacSelonDefilement(t) {
    if (!scenes.length) return;
    var milieu = scrollY + VH * 0.5;
    var lac = null, etat = '';
    for (var i = 0; i < scenes.length; i++) {
      var s = scenes[i];
      if (milieu >= s.haut && milieu <= s.bas) { lac = Object.assign({}, s.v); etat = s.etat; break; }
      var suiv = scenes[i + 1];
      if (suiv && milieu > s.bas && milieu < suiv.haut) {
        var k = lisse((milieu - s.bas) / (suiv.haut - s.bas));
        lac = {}; for (var c in s.v) lac[c] = mel(s.v[c], suiv.v[c], k);
        etat = k < 0.5 ? s.etat : suiv.etat; break;
      }
    }
    if (!lac) { var bout = milieu < scenes[0].haut ? scenes[0] : scenes[scenes.length - 1]; lac = Object.assign({}, bout.v); etat = bout.etat; }
    epingles.forEach(function (e) {
      if (!pilotes[e.nom]) return;
      var dedans = milieu >= e.haut && milieu <= e.haut + e.long + VH;
      if (dedans) pilotes[e.nom](avance(e), t, lac);
      else if (e.nom === 'approche' || e.nom === 'fin') pilotes[e.nom](avance(e), t, {});
    });
    Lac.regler(lac);
    if (instrument && accueil) {
      var calme = borne(Lac.etat.jour * 0.55 + (1 - Lac.etat.vent) * 0.45, 0, 1);
      iPoint.style.top = (calme * 100).toFixed(1) + '%';
      iPoint.style.setProperty('--x', (calme * 100).toFixed(1) + '%');
      if (etat && etat !== etatAffiche) { etatAffiche = etat; iEtat.textContent = etat; }
    }
  }

  /* ---------------- l'en-tête, l'instrument : clair ou sombre selon ce qu'il y a dessous ---------------- */
  var dernierY = scrollY, tonEntete = '';
  function selonDessous() {
    var y = scrollY;
    var sous = function (py) { for (var i = 0; i < tons.length; i++) if (py >= tons[i].haut && py <= tons[i].bas) return tons[i].ton; return 'sombre'; };
    var tonH = sous(y + 40);
    if (tonH !== tonEntete) { tonEntete = tonH; entete.classList.toggle('clair', tonH === 'clair'); }
    entete.classList.toggle('fond', y > 60);
    var descend = y > dernierY + 4, monte = y < dernierY - 4;
    if (doc.classList.contains('menu-ouvert')) entete.classList.remove('cache');
    else if (descend && y > VH * 0.6) entete.classList.add('cache');
    else if (monte || y < VH * 0.3) entete.classList.remove('cache');
    dernierY = y;
    if (instrument) instrument.classList.toggle('clair', sous(y + VH * 0.5) === 'clair');
    if (flottant) flottant.classList.toggle('visible', y > VH * 0.75 && !doc.classList.contains('menu-ouvert'));
  }
  var flottant = $('.rdv-flottant');

  /* ---------------- les cartes qui s'empilent ---------------- */
  var cartes = $$('.pile .carte');
  function empiler() {
    for (var i = 0; i < cartes.length - 1; i++) {
      var r = cartes[i + 1].getBoundingClientRect();
      var k = borne(1 - (r.top - VH * 0.12) / (VH * 0.8), 0, 1);
      cartes[i].style.setProperty('--s', (1 - k * 0.06).toFixed(4));
    }
  }

  /* ---------------- apparitions ---------------- */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('vu'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -12% 0px' });
    $$('.revele, .revele-photo').forEach(function (el) { io.observe(el); });
    // le lac ne se dessine que si on le voit
    var visibles = new Set();
    var io2 = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) visibles.add(e.target); else visibles.delete(e.target); });
      lacVisible = visibles.size > 0;
    }, { rootMargin: '10% 0px 10% 0px' });
    $$('.scene').forEach(function (el) { io2.observe(el); });
  } else {
    $$('.revele, .revele-photo').forEach(function (el) { el.classList.add('vu'); });
  }

  /* ---------------- toucher l'eau ---------------- */
  addEventListener('pointerdown', function (e) {
    if (e.target.closest('a, button, input, textarea, summary, .feuille, .bloc, .pied, .menu, .entete, .verre, .fin-appel, .approche-titres')) return;
    if (!e.target.closest('.scene') && !doc.classList.contains('respire')) return;
    var p = Lac.versPhoto(e.clientX, e.clientY);
    if (p[1] > Lac.HORIZON + 0.01) Lac.goutte(p[0], p[1], 1.1);
  }, { passive: true });

  /* ---------------- respirer avec le lac ---------------- */
  (function () {
    var bouton = $('.respirer'), mot = $('.souffle-mot');
    if (!bouton) return;
    corps.appendChild($('.souffle')); // hors de <main>, qui s'efface pendant la respiration
    var actif = false, minuteur = null, avant = null;
    function cycle(inspire) {
      if (!actif) return;
      mot.style.opacity = 0;
      setTimeout(function () { if (!actif) return; mot.textContent = inspire ? 'Inspirez' : 'Expirez'; mot.style.opacity = 1; }, 500);
      if (inspire) Lac.goutte(0.5, Lac.HORIZON + 0.24, 1.6);
      minuteur = setTimeout(function () { cycle(!inspire); }, inspire ? 4000 : 6000);
    }
    function entrer() {
      actif = true; avant = Object.assign({}, Lac.etat);
      doc.classList.add('respire'); bouton.setAttribute('aria-pressed', 'true');
      if (lenis) lenis.stop();
      cycle(true);
    }
    function sortir() {
      if (!actif) return;
      actif = false; clearTimeout(minuteur);
      doc.classList.remove('respire'); bouton.setAttribute('aria-pressed', 'false');
      if (lenis) lenis.start();
    }
    bouton.addEventListener('click', function (e) { e.stopPropagation(); entrer(); });
    $('.souffle').addEventListener('click', sortir);
    addEventListener('keydown', function (e) { if (e.key === 'Escape') sortir(); });
    addEventListener('wheel', function () { if (actif) sortir(); }, { passive: true });
    respirerEtat = function () { return actif; };
  })();
  var respirerEtat = respirerEtat || function () { return false; };

  /* ---------------- les paroles ---------------- */
  (function () {
    var bloc = $('[data-avis]'); if (!bloc) return;
    var paroles = $$('.parole', bloc), points = $('.avis-points'), i = 0, minuteur = null;
    paroles.forEach(function () { points.appendChild(document.createElement('i')); });
    var pts = $$('i', points);
    function montrer(n, goutte) {
      i = (n + paroles.length) % paroles.length;
      paroles.forEach(function (p, k) { p.classList.toggle('la', k === i); });
      pts.forEach(function (p, k) { p.classList.toggle('la', k === i); });
      if (goutte) Lac.goutte(0.35 + Math.random() * 0.3, Lac.HORIZON + 0.22, 1);
      clearTimeout(minuteur);
      minuteur = setTimeout(function () { montrer(i + 1, true); }, 8000);
    }
    $('.avis-prec').addEventListener('click', function () { montrer(i - 1, true); });
    $('.avis-suiv').addEventListener('click', function () { montrer(i + 1, true); });
    montrer(0, false);
  })();

  /* ---------------- menu ---------------- */
  (function () {
    var b = $('.bouton-menu'), m = $('#menu');
    if (!b || !m) return;
    function ouvrir(oui) {
      b.setAttribute('aria-expanded', oui ? 'true' : 'false');
      doc.classList.toggle('menu-ouvert', oui);
      if (oui) { m.hidden = false; requestAnimationFrame(function () { m.classList.add('ouvert'); }); if (lenis) lenis.stop(); }
      else { m.classList.remove('ouvert'); setTimeout(function () { if (!m.classList.contains('ouvert')) m.hidden = true; }, 900); if (lenis) lenis.start(); }
    }
    b.addEventListener('click', function () { ouvrir(b.getAttribute('aria-expanded') !== 'true'); });
    $$('a', m).forEach(function (a) { a.addEventListener('click', function () { ouvrir(false); }); });
    addEventListener('keydown', function (e) { if (e.key === 'Escape') ouvrir(false); });
  })();

  /* ---------------- liens : ancres douces, voile entre deux pages ---------------- */
  var voile = $('.voile');
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a'); if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;
    var href = a.getAttribute('href') || '';
    if (/^(tel:|mailto:|https?:)/.test(href)) return;
    var url = new URL(href, location.href);
    var memePage = url.pathname === location.pathname;
    if (url.hash && (memePage || href.charAt(0) === '#')) {
      var cible = document.getElementById(url.hash.slice(1));
      if (cible) { e.preventDefault(); allerA(cible); history.replaceState(null, '', url.hash); }
      return;
    }
    if (url.origin !== location.origin || !/\.html$|\/$/.test(url.pathname)) return;
    e.preventDefault();
    try { sessionStorage.setItem('one-voile', '1'); } catch (err) {}
    voile.classList.remove('part');
    voile.classList.add('descend');
    setTimeout(function () { location.href = url.href; }, 850);
  });
  addEventListener('pageshow', function (e) { if (e.persisted) { voile.classList.remove('descend'); doc.classList.add('arrive'); } });

  /* ---------------- arrivée ---------------- */
  var arrivee = function () {
    if (doc.classList.contains('arrive')) return;
    doc.classList.add('arrive');
    if (voile.classList.contains('descend')) {
      voile.classList.add('part');
      setTimeout(function () { voile.style.transition = 'none'; voile.classList.remove('descend', 'part'); voile.offsetHeight; voile.style.transition = ''; }, 1100);
    }
    if (location.hash) { var c = document.getElementById(location.hash.slice(1)); if (c) setTimeout(function () { allerA(c); }, 400); }
  };

  var viaVoile = false;
  try { viaVoile = sessionStorage.getItem('one-voile') === '1'; sessionStorage.removeItem('one-voile'); } catch (e) {}
  if (viaVoile) { voile.style.transition = 'none'; voile.classList.add('descend'); voile.offsetHeight; voile.style.transition = ''; }

  var chargement = $('.chargement');
  if (!chargement || doc.classList.contains('deja-vu')) {
    if (chargement) chargement.remove();
    var go = function () { setTimeout(arrivee, 120); };
    if (lacPret) go(); else { quandPret.push(go); setTimeout(arrivee, 2500); }
  } else {
    // Première visite : la nuit, l'horizon se trace et l'axe le traverse pendant que le lac se charge.
    var pc = $('.chargement-pc'), motC = $('.chargement-mot'), t0 = performance.now(), avant = t0, affiche = 0, fini = false;
    var MOTS = [[0, 'Le vent souffle'], [0.35, 'Le vent tombe'], [0.7, 'Le lac se pose'], [1, 'Bienvenue']];
    var reel = function () { return (lacPret ? 0.7 : 0.15) + (document.fonts && document.fonts.status === 'loaded' ? 0.3 : 0); };
    (function boucle(m) {
      if (fini) return;
      var cible = Math.min(reel(), (m - t0) / 2600);
      affiche = mel(affiche, cible, 1 - Math.exp(-(m - avant) / 260)); avant = m;
      if (cible >= 1 && affiche > 0.995) affiche = 1;
      chargement.style.setProperty('--p', affiche.toFixed(3));
      pc.textContent = Math.round(affiche * 100);
      for (var i = MOTS.length - 1; i >= 0; i--) if (affiche >= MOTS[i][0]) { if (motC.textContent !== MOTS[i][1]) motC.textContent = MOTS[i][1]; break; }
      if (affiche >= 1) {
        fini = true;
        try { sessionStorage.setItem('one-vu', '1'); } catch (e) {}
        setTimeout(function () { chargement.classList.add('ouvre'); setTimeout(arrivee, 500); setTimeout(function () { chargement.remove(); }, 1800); }, 350);
        return;
      }
      requestAnimationFrame(boucle);
    })(t0);
    setTimeout(function () { lacPret = true; }, 7000);
  }

  /* ---------------- la boucle ---------------- */
  mesurer();
  addEventListener('resize', function () { mesurer(); });
  addEventListener('load', mesurer);
  setInterval(mesurer, 1500);

  function image(m) {
    if (lenis) lenis.raf(m);
    var t = Lac.temps();
    if (respirerEtat()) Lac.regler({ jour: 0.9, vent: 0, brume: 0.7, zoom: 1.04, y: 0.5, pan: 0 });
    else lacSelonDefilement(t);
    selonDessous();
    if (cartes.length) empiler();
    if (lacVisible || respirerEtat() || scrollY < VH) Lac.dessiner(m);
    requestAnimationFrame(image);
  }
  requestAnimationFrame(image);
})();

// Aperçu : le formulaire ne part pas, on le dit.
document.querySelectorAll('form[data-apercu]').forEach(function (f) {
  f.addEventListener('submit', function (e) { e.preventDefault(); var n = f.querySelector('.note-apercu'); if (n) n.hidden = false; });
});
