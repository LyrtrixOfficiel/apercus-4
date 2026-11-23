/* Ingrid Marie : les scènes de ses mots (css/scenes.css).
   L'arrivée sous la Lune du jour, le cairn de la terre, le ciel « Lune et Soleil », les cartes des cinq éléments,
   le vent des voyages, la rivière des soins. Tout suit le défilement ; seuls le léger balancement du cairn et la
   dérive du vent bougent d'eux-mêmes, et s'arrêtent dans la version calme (« ?calme=1 »). */
(function () {
  'use strict';
  var html = document.documentElement;
  var calme = html.classList.contains('calme');
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var borne = function (x, a, b) { return x < a ? a : x > b ? b : x; };
  var lisse = function (a, b, x) { x = borne((x - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); };
  var vh = window.innerHeight, vw = window.innerWidth;
  var mobile = window.matchMedia('(max-width: 900px)').matches;
  var maintenant = function () { return performance.now() / 1000; };
  var luneDuJour = null;
  try { luneDuJour = window.LuneDuJour ? window.LuneDuJour.lune(new Date()) : null; } catch (e) {}
  var partDuJour = luneDuJour ? luneDuJour.part : 0.4;

  /* progression d'une section épinglée : 0 quand elle arrive en haut, 1 quand elle repart */
  function avance(el) {
    var r = el.getBoundingClientRect();
    var course = r.height - vh;
    return course > 0 ? borne(-r.top / course, 0, 1) : (r.top < 0 ? 1 : 0);
  }
  function visible(el, marge) { var r = el.getBoundingClientRect(); return r.bottom > -(marge || 0) && r.top < vh + (marge || 0); }

  /* ------------------------------------------------------------ l'arrivée : un vrai chargement, puis la marée
     La Lune se remplit avec ce qui est réellement chargé (polices, Lune, sable écrit, eau prête), un compteur de 0 à 100
     le dit. À 100, la marée monte sur la nuit, et se retire sur le rivage, déjà sous l'eau : le site n'apparaît jamais nu. */
  var entree = $('#entree');
  function arrivee() {
    if (!entree || !html.classList.contains('entree-la')) { if (window.IM && IM.apresEntree) IM.apresEntree(); return; }
    try { sessionStorage.setItem('im-entree', '1'); } catch (e) {}
    window.scrollTo(0, 0);
    if (window.IM && IM.lenis) IM.lenis.stop();
    var nom = $('.entree__nom', entree), phase = $('#entree-phase'), toile = $('#entree-lune'), compte = $('#entree-compte'), etat = $('#entree-etat');
    nom.innerHTML = nom.textContent.split('').map(function (c, i) {
      return c === ' ' ? ' ' : '<span class="l" style="transition-delay:' + (0.3 + i * 0.06).toFixed(2) + 's">' + c + '</span>';
    }).join('');
    if (luneDuJour && phase) phase.textContent = "La Lune aujourd'hui : " + luneDuJour.nom;
    var astre = window.Astre && toile ? new window.Astre(toile, { rayon: 0.6 }) : null;
    if (astre && !astre.ok) astre = null;
    var debut = maintenant(), tAvant = debut, aff = 0, fini = false, sortie = 0, montee = false;
    var polices = !document.fonts;
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { polices = true; });
    requestAnimationFrame(function () { entree.classList.add('vu'); nom.classList.add('vu'); });
    function prets() {
      var l = [polices, !astre || astre.charge, html.classList.contains('nom-ecrit') || !html.classList.contains('eau-voulue') || !$('#rivage'), !window.IM || !IM.eauPrete || IM.eauPrete()];
      var n = 0; l.forEach(function (x) { if (x) n++; });
      return n / l.length;
    }
    function finir() {
      if (fini) return;
      fini = true;
      html.classList.remove('entree-la', 'entree-maree');
      if (entree.parentNode) entree.parentNode.removeChild(entree);
      if (window.IM && IM.lenis) IM.lenis.start();
    }
    function image() {
      if (fini) return;
      requestAnimationFrame(image);
      var t = maintenant(), dt = Math.min(0.1, t - tAvant), age = t - debut; tAvant = t;
      // ce qui est prêt, avec une avance lente pour que le compteur ne reste jamais figé ; au bout de 9 s, on y va
      var cible = Math.max(prets(), Math.min(0.9, age / 9));
      if (age > 9) cible = 1;
      // jamais plus vite que 1,8 s pour aller de 0 à 100 : le chargement se lit
      aff = Math.min(aff + (cible - aff) * (1 - Math.exp(-dt * 3.2)) + (cible >= 1 ? dt * 0.25 : 0), cible, age / 1.8);
      if (cible >= 1 && aff > 0.985) aff = Math.min(1, age / 1.8);
      if (compte) compte.textContent = Math.round(aff * 100);
      if (astre) astre.dessine({ part: 0.03 + 0.47 * (calme ? 1 : aff), eclat: sortie, halo: 0.45 + aff * 0.3 + sortie });
      if (aff >= 1 && !montee) {
        montee = true;
        entree.classList.add('fin');
        if (etat) etat.textContent = 'La marée monte';
        setTimeout(function () {
          // la marée monte : sous son bord, le rivage (déjà sous l'eau) ; au-dessus, la nuit encore
          var ok = !calme && window.IM && IM.maree && IM.maree(function () {
            finir();
            if (window.IM && IM.apresEntree) IM.apresEntree();
          }, function (m) { entree.style.setProperty('--m', (m * 100).toFixed(2)); });
          if (ok) html.classList.add('entree-maree');
          if (!ok) {
            // sans la nappe d'eau : la nuit s'ouvre en cercle autour de la Lune
            var d0 = maintenant();
            (function ouvre() {
              var e = borne((maintenant() - d0) / 1.3, 0, 1), ee = e * e * (3 - 2 * e);
              sortie = ee;
              entree.style.setProperty('--k', (1 + ee * 0.35).toFixed(3));
              entree.style.setProperty('--r', (-22 + ee * 150).toFixed(2));
              if (e < 1) requestAnimationFrame(ouvre); else { finir(); if (window.IM && IM.apresEntree) IM.apresEntree(); }
            })();
          }
        }, 380);
      }
    }
    requestAnimationFrame(image);
  }

  /* ------------------------------------------------------------ entre terre et mer : ses deux photos se découvrent
     « Entre terre » arrive de gauche, « et mer » de droite ; la mer (elle, au bord de l'océan) s'ouvre de bas en haut,
     la terre de haut en bas ; chaque photo glisse doucement dans son cadre. Tout suit le défilement. */
  var terremer = $('#terre-mer'), tmL1 = $('.terremer__l1'), tmL2 = $('.terremer__l2');
  var tmMer = $('.terremer__photo--mer'), tmTerre = $('.terremer__photo--terre'), tmTexte = terremer ? $$('.terremer__texte > *', terremer) : [];
  function terremerImage() {
    if (!terremer || calme || !visible(terremer, 80)) return;
    var r = terremer.getBoundingClientRect();
    // 0 quand la section arrive par le bas, 1 quand elle repart : l'arrivée compte pour un tiers
    var p = borne((vh - r.top) / r.height, 0, 1);
    var t = lisse(0.1, 0.4, p);
    tmL1.style.transform = 'translateX(' + ((1 - t) * -9).toFixed(2) + 'vw)'; tmL1.style.opacity = (0.15 + t * 0.85).toFixed(3);
    tmL2.style.transform = 'translateX(' + ((1 - t) * 11).toFixed(2) + 'vw)'; tmL2.style.opacity = (0.15 + t * 0.85).toFixed(3);
    [[tmMer, 0.2, 0.52, 1], [tmTerre, 0.3, 0.62, -1]].forEach(function (d) {
      var el = d[0]; if (!el) return;
      var o = lisse(d[1], d[2], p), cadre = el.firstElementChild;
      var cache = ((1 - o) * 100).toFixed(2) + '%';
      cadre.style.setProperty(d[3] > 0 ? '--haut' : '--bas', cache);
      cadre.style.setProperty('--z', (1.28 - 0.24 * lisse(d[1], 1, p)).toFixed(4));
      var y = 0; // la scène suit la page (plus épinglée) : pas de décalage
      el.style.transform = 'translateY(' + y.toFixed(2) + 'vh)';
      el.style.setProperty('--c', lisse(d[2] - 0.04, d[2] + 0.08, p).toFixed(3));
    });
    tmTexte.forEach(function (el, i) {
      var a = 0.42 + i * 0.07, u = lisse(vh * 0.98, vh * 0.78, el.getBoundingClientRect().top + i * 8);
      el.style.opacity = u.toFixed(3);
      el.style.transform = 'translateY(' + ((1 - u) * 1.6).toFixed(2) + 'rem)';
    });
  }

  /* ------------------------------------------------------------ la terre : le cairn se construit pierre par pierre */
  var cairn = $('#ancrage'), pile = $('#cairn'), pierres = pile ? $$('.cairn__pierre', pile) : [];
  // largeur de chaque pierre par rapport à la base, décalage de côté, inclinaison une fois posée
  var LARGEUR = [1, 0.86, 0.78, 0.64, 0.6, 0.5, 0.4], COTE = [0, -0.05, 0.06, -0.04, 0.05, -0.03, 0.015], PENTE = [0, 2.2, -2.6, 3, -2.2, 2.4, -1.4];
  var posees = [], base = 0, cumul = [], derniereChute = 0, avantCairn = -1;
  function mesurerCairn() {
    if (!pile) return;
    base = pile.offsetWidth;
    var y = 0;
    pierres.forEach(function (p, i) {
      var im = $('img', p), l = base * LARGEUR[i];
      p.style.width = (LARGEUR[i] * 100) + '%'; // relatif à la pile : juste même si la mesure tombe pendant un redimensionnement
      var h = l * (im.getAttribute('height') / im.getAttribute('width'));
      cumul[i] = y;
      y += h * (i === 0 ? 0.74 : 0.7);
    });
  }
  function cairnImage(t) {
    if (!cairn || calme) return;
    if (!visible(cairn, 100)) return;
    if (Math.abs(pile.offsetWidth - base) > 0.5) mesurerCairn();
    var p = avance(cairn);
    var balance = 0;
    pierres.forEach(function (pierre, i) {
      var a = 0.04 + i * 0.105, u = lisse(a, a + 0.085, p);
      var chute = (1 - u) * (vh * 1.05 + cumul[i]);
      var rebond = u > 0 && u < 1 ? Math.sin(u * Math.PI) * 6 : 0;
      var x = -50 + COTE[i] * 100;
      var r = PENTE[i] + (1 - u) * (i % 2 ? 9 : -9);
      pierre.style.transform = 'translate(' + x.toFixed(2) + '%, ' + (-(cumul[i]) + chute - rebond).toFixed(1) + 'px) rotate(' + r.toFixed(2) + 'deg)';
      var pose = u >= 1;
      if (pose !== !!posees[i]) { posees[i] = pose; pierre.classList.toggle('pose', pose); if (pose) derniereChute = t; }
    });
    // l'équilibre : la pile oscille un peu après chaque pierre, puis respire à peine
    balance = Math.sin(t * 2.1) * (1.6 * Math.exp(-(t - derniereChute) * 1.4)) + Math.sin(t * 0.7) * 0.25;
    pile.style.transform = 'rotate(' + balance.toFixed(3) + 'deg)';
    cairn.classList.toggle('fini', p > 0.8);
    avantCairn = p;
  }

  /* ------------------------------------------------------------ le ciel : le soleil se couche, la Lune du jour se lève */
  var ciel = $('#lune'), couches = ciel ? $$('.ciel__couche', ciel) : [], temps = ciel ? $$('.ciel__temps', ciel) : [];
  var toileLune = $('#ciel-lune'), astreCiel = null;
  // chaque texte : arrive, reste, repart (le dernier reste)
  var FENETRES = [[-1, 0.03, 0.3, 0.4], [0.48, 0.58, 2, 3]];
  function cielImage() {
    if (!ciel || !visible(ciel, 50)) return;
    if (!astreCiel && toileLune && window.Astre) { astreCiel = new window.Astre(toileLune, { rayon: 0.5 }); if (!astreCiel.ok) toileLune.style.display = 'none'; }
    var p = avance(ciel);
    var rose = lisse(0.1, 0.3, p), nuit = lisse(0.32, 0.5, p);
    couches[0].style.transform = 'scale(' + (1.04 + p * 0.1).toFixed(4) + ') translateY(' + (p * 3).toFixed(2) + '%)';
    couches[1].style.opacity = rose.toFixed(3);
    couches[1].style.transform = 'scale(' + (1.12 - p * 0.08).toFixed(4) + ')';
    couches[2].style.opacity = nuit.toFixed(3);
    couches[2].style.transform = 'scale(' + (1.1 - nuit * 0.1).toFixed(4) + ')';
    var lune = lisse(0.48, 0.62, p);
    if (toileLune) {
      toileLune.style.opacity = lune.toFixed(3);
      toileLune.style.setProperty('--monte', ((1 - lune) * 40).toFixed(1) + '%');
      if (astreCiel && astreCiel.ok && lune > 0) astreCiel.dessine({ part: partDuJour, halo: 1.3 });
    }
    temps.forEach(function (el, i) {
      var f = FENETRES[i];
      var o = lisse(f[0], f[1], p) * (1 - lisse(f[2], f[3], p));
      if (i === 0) o = 1 - lisse(f[2], f[3], p);
      el.style.opacity = o.toFixed(3);
      var d = (1 - lisse(f[0], f[1], p)) * 3 - lisse(f[2], f[3], p) * 3;
      el.style.transform = 'translateY(' + d.toFixed(2) + 'rem)';
    });
  }

  /* ------------------------------------------------------------ les cartes : cinq éléments, face cachée */
  var table = $('#cartes'), cartes = table ? $$('.carte', table) : [], encore = $('#carte-encore'), choisie = null, ouverture = 0;
  function eventail() {
    var n = cartes.length, ecart = mobile ? Math.min(vw * 0.115, 52) : Math.min(vw * 0.075, 120);
    cartes.forEach(function (c, i) {
      var k = i - (n - 1) / 2, o = ouverture;
      var x = k * ecart * o, y = Math.abs(k) * Math.abs(k) * 8 * o, r = k * 7 * o;
      if (choisie) {
        if (c === choisie) { c.style.transform = 'translate(-50%, -50%) translateY(-2%) scale(' + (mobile ? 1.65 : 1.7) + ') rotateY(180deg)'; c.style.zIndex = 10; c.style.opacity = 1; return; }
        c.style.transform = 'translate(-50%, -50%) translate(' + (k * ecart * 2.2).toFixed(1) + 'px, 70%) rotate(' + (k * 14) + 'deg) scale(.8)';
        c.style.opacity = 0; c.style.zIndex = 1; return;
      }
      c.style.opacity = 1; c.style.zIndex = 5 - Math.abs(Math.round(k));
      c.style.transform = 'translate(-50%, -50%) translate(' + x.toFixed(1) + 'px, ' + y.toFixed(1) + 'px) rotate(' + r.toFixed(2) + 'deg)';
    });
  }
  function oracleImage() {
    if (!table || !visible(table, 50)) return;
    var r = table.getBoundingClientRect();
    var o = calme ? 1 : lisse(vh * 1.0, vh * 0.35, r.top);
    if (Math.abs(o - ouverture) > 0.002) { ouverture = o; if (!choisie) eventail(); }
  }
  cartes.forEach(function (c) {
    c.addEventListener('click', function () {
      if (choisie) return;
      // le hasard choisit la carte, pas l'endroit où l'on a cliqué : on échange leurs faces
      var tiree = cartes[Math.floor(Math.random() * cartes.length)];
      if (tiree !== c) { var f1 = $('.carte__face', c), f2 = $('.carte__face', tiree); var tmp = document.createElement('span'); f1.parentNode.replaceChild(tmp, f1); f2.parentNode.replaceChild(f1, f2); tmp.parentNode.replaceChild(f2, tmp); }
      choisie = c; c.classList.add('choisie');
      cartes.forEach(function (x) { x.setAttribute('aria-label', x === c ? 'Votre carte : ' + $('.carte__mots b', x).textContent + '. ' + $('.carte__mots span', x).textContent : 'Carte'); });
      eventail();
      if (encore) setTimeout(function () { encore.hidden = false; }, 700);
    });
  });
  if (encore) encore.addEventListener('click', function () {
    if (choisie) choisie.classList.remove('choisie');
    choisie = null; encore.hidden = true;
    cartes.forEach(function (x) { x.setAttribute('aria-label', 'Retourner une carte'); });
    eventail();
  });

  /* ------------------------------------------------------------ ses pratiques : les mots arrivent un à un */
  var dons = $('#dons'), donsMots = dons ? $$('.dons__pratiques li', dons) : [];
  function donsImage() {
    if (!dons || !visible(dons, 50)) return;
    var r = dons.getBoundingClientRect(), p = borne((vh - r.top) / (vh * 0.95), 0, 2);
    donsMots.forEach(function (li, i) { var a = 0.32 + i * 0.075, u = calme ? 1 : lisse(a, a + 0.2, p); li.style.setProperty('--u', u.toFixed(3)); });
  }

  /* ------------------------------------------------------------ l'air : les mots passent avec le vent */
  var vent = $('#voyages'), mots = vent ? $$('[data-vent]', vent) : [], cielVent = vent ? $('.vent__ciel img', vent) : null, yAvant = window.scrollY, vitesse = 0;
  function ventImage(t, dt) {
    var y = window.scrollY;
    vitesse += ((y - yAvant) / Math.max(dt, 0.008) - vitesse) * 0.08;
    yAvant = y;
    if (!vent || !visible(vent, 50)) return;
    var r = vent.getBoundingClientRect();
    var p = (vh - r.top) / (vh + r.height);
    mots.forEach(function (m, i) {
      var k = parseFloat(m.getAttribute('data-vent')), l = m.offsetWidth;
      var derive = calme ? 0 : t * 18 * (i % 2 ? -1 : 1);
      var x = (k > 0 ? -l : vw) + (k > 0 ? 1 : -1) * ((p * 1.15 * Math.abs(k)) * (vw + l)) + derive;
      m.style.setProperty('--x', x.toFixed(1) + 'px');
      m.style.setProperty('--s', borne(-vitesse * 0.004 * k, -10, 10).toFixed(2) + 'deg');
    });
    if (cielVent && !calme) cielVent.style.setProperty('--v', ((p - 0.5) * -60).toFixed(1) + 'px');
  }

  /* ------------------------------------------------------------ l'eau : la photo du soin change dans son galet */
  var riviere = $('#riviere'), soinsListe = riviere ? $$('.riviere__soin', riviere) : [], galet = $('#riviere-galet'), photosSoin = galet ? $$('img', galet) : [], soinIci = 0;
  var FORMES = ['47% 53% 51% 49% / 57% 45% 55% 43%', '58% 42% 46% 54% / 44% 58% 42% 56%', '42% 58% 57% 43% / 52% 40% 60% 48%', '53% 47% 40% 60% / 60% 52% 48% 40%', '45% 55% 52% 48% / 46% 60% 40% 54%'];
  var TOURNE = [0, -3, 2.5, -1.5, 3];
  function riviereImage() {
    if (!riviere || !visible(riviere, 50)) return;
    var cible = mobile ? vh * 0.7 : vh * 0.5, meilleur = 0, d = 1e9;
    soinsListe.forEach(function (li, i) { var r = li.getBoundingClientRect(), e = Math.abs(r.top + r.height / 2 - cible); if (e < d) { d = e; meilleur = i; } });
    if (meilleur === soinIci) return;
    soinIci = meilleur;
    soinsListe.forEach(function (li, i) { li.classList.toggle('ici', i === meilleur); });
    photosSoin.forEach(function (im, i) { im.classList.toggle('ici', i === meilleur); });
    galet.style.setProperty('--forme', FORMES[meilleur % FORMES.length]);
    galet.style.setProperty('--tourne', TOURNE[meilleur % TOURNE.length] + 'deg');
  }


  /* ------------------------------------------------------------ les soins : la carte suivante se pose sur la précédente */
  var pileSoins = $('#pile'), cartesSoin = pileSoins ? $$('.soin-carte', pileSoins) : [];
  function pileImage() {
    if (!pileSoins || !visible(pileSoins, 50)) return;
    cartesSoin.forEach(function (c, i) {
      var suite = cartesSoin[i + 1], r = 0;
      if (suite && !calme) {
        var a = c.getBoundingClientRect(), b = suite.getBoundingClientRect();
        r = borne(1 - (b.top - a.top) / Math.max(a.height, 1), 0, 1);
      }
      c.style.setProperty('--r', r.toFixed(3));
    });
  }

  /* ------------------------------------------------------------ enfants et parents : la photo s'ouvre en montant */
  var famillePhoto = $('#famille-photo'), familleImg = famillePhoto ? $('img', famillePhoto) : null;
  function familleImage() {
    if (!famillePhoto || !visible(famillePhoto, 50)) return;
    var r = famillePhoto.getBoundingClientRect(), o = calme ? 1 : lisse(vh * 1.02, vh * 0.42, r.top);
    famillePhoto.style.setProperty('--o', o.toFixed(3));
    if (familleImg && !calme) familleImg.style.transform = 'scale(' + (1.16 - o * 0.12).toFixed(4) + ') translateY(' + (((r.top + r.height / 2) - vh / 2) * -0.04).toFixed(1) + 'px)';
  }

  /* ------------------------------------------------------------ la séance : la Lune croît d'étape en étape, en plein jour */
  var cycle = $('#cycle'), etapesCycle = cycle ? $$('#cycle-etapes li', cycle) : [], toileCycle = $('#cycle-lune'), astreCycle = null, etapeIci = 0;
  function cycleImage() {
    if (!cycle || !visible(cycle, 50)) return;
    if (!astreCycle && toileCycle && window.Astre) { astreCycle = new window.Astre(toileCycle, { rayon: 0.86 }); if (!astreCycle.ok) toileCycle.style.display = 'none'; }
    var p = avance(cycle);
    // nouvelle lune, premier quartier, pleine lune, dernier quartier : la Lune suit la séance
    if (astreCycle && astreCycle.ok) astreCycle.dessine({ part: 0.035 + p * 0.73, jour: 1, halo: 0 });
    var e = Math.min(etapesCycle.length - 1, Math.floor(p * etapesCycle.length * 0.999));
    if (e !== etapeIci) { etapeIci = e; etapesCycle.forEach(function (li, i) { li.classList.toggle('ici', i === e); }); }
  }

  /* ------------------------------------------------------------ enfants et parents : le petit galet rejoint le grand */
  var ensemble = $('#famille'), grand = ensemble ? $('.ensemble__grand', ensemble) : null, petit = ensemble ? $('.ensemble__petit', ensemble) : null, uni = false;
  function ensembleImage() {
    if (!ensemble || !grand || !visible(ensemble, 50)) return;
    var p = calme ? 1 : avance(ensemble);
    var a = lisse(0.04, 0.34, p), b = lisse(0.3, 0.42, p), pose = lisse(0.36, 0.7, p);
    var hg = grand.offsetHeight, hp = petit.offsetHeight;
    // le grand galet monte du sable, le petit descend et se pose sur lui
    var yg = (1 - a) * vh * 0.55;
    var yp = -(hg * 0.72) - (1 - pose) * vh * (mobile ? 0.15 : 0.62);
    var xp = -50 + (1 - pose) * 26;
    grand.style.transform = 'translate(-50%, ' + yg.toFixed(1) + 'px) rotate(' + ((1 - a) * -4).toFixed(2) + 'deg)';
    grand.style.opacity = a.toFixed(3);
    petit.style.transform = 'translate(' + xp.toFixed(2) + '%, ' + yp.toFixed(1) + 'px) rotate(' + ((1 - pose) * 12 - 2).toFixed(2) + 'deg)';
    petit.style.opacity = b.toFixed(3);
    var u = pose >= 1;
    if (u !== uni) { uni = u; ensemble.classList.toggle('uni', u); }
  }

  /* ------------------------------------------------------------ les avis : ils passent de côté */
  var voix = $('#avis'), rangVoix = $('#voix');
  function voixImage() {
    if (!voix || !rangVoix || calme || !visible(voix, 50)) return;
    var p = avance(voix);
    var course = Math.max(0, rangVoix.scrollWidth - vw);
    if (mobile) {
      // un avis à la fois, centré : il reste posé, puis glisse vers le suivant
      var avisListe = rangVoix.children, nb = avisListe.length;
      if (nb > 1) {
        var t = lisse(0.03, 0.97, p) * (nb - 1), k = Math.min(nb - 2, Math.floor(t)), f = lisse(0.3, 0.7, t - k);
        var centre = function (i) { var el = avisListe[i]; return el.offsetLeft + el.offsetWidth / 2 - vw / 2; };
        rangVoix.style.setProperty('--x', (-(centre(k) + (centre(k + 1) - centre(k)) * f)).toFixed(1) + 'px');
        return;
      }
    }
    rangVoix.style.setProperty('--x', (-lisse(0.04, 0.96, p) * course).toFixed(1) + 'px');
  }

  /* ------------------------------------------------------------ le tarif : la table glisse doucement sous la carte */
  var tarif = $('#tarif'), fondTable = tarif ? $('.table__fond img', tarif) : null;
  function tableImage() {
    if (!tarif || !fondTable || calme || !visible(tarif, 50)) return;
    var r = tarif.getBoundingClientRect();
    fondTable.style.setProperty('--t', (((r.top + r.height / 2) - vh / 2) * -0.12).toFixed(1) + 'px');
  }

  /* ------------------------------------------------------------ l'en-tête suit la lumière : clair sur les scènes de nuit */
  var nuits = $$('[data-nuit]'), enNuit = false;
  function teteImage() {
    var n = false;
    for (var i = 0; i < nuits.length; i++) { var r = nuits[i].getBoundingClientRect(); if (r.top <= 44 && r.bottom > 44) { n = true; break; } }
    if (n && ciel && nuits[i] === ciel) n = avance(ciel) > 0.36;
    if (n !== enNuit) { enNuit = n; html.classList.toggle('tete-nuit', n); }
  }

  /* ------------------------------------------------------------ les avis : le carrousel et ses flèches */
  var rangAvis = $('#avis-rang'), flechesAvis = $$('[data-defile]');
  function flechesEtat() {
    if (!rangAvis) return;
    var max = rangAvis.scrollWidth - rangAvis.clientWidth - 2;
    flechesAvis.forEach(function (b) { b.disabled = +b.getAttribute('data-defile') < 0 ? rangAvis.scrollLeft <= 2 : rangAvis.scrollLeft >= max; });
  }
  if (rangAvis) {
    flechesAvis.forEach(function (b) {
      b.addEventListener('click', function () {
        var carte = rangAvis.firstElementChild, pas = carte ? carte.getBoundingClientRect().width + 16 : rangAvis.clientWidth * 0.8;
        rangAvis.scrollBy({ left: pas * +b.getAttribute('data-defile'), behavior: 'smooth' });
      });
    });
    rangAvis.addEventListener('scroll', flechesEtat, { passive: true });
    window.addEventListener('resize', flechesEtat);
    flechesEtat();
  }

  /* ------------------------------------------------------------ la boucle */
  var tAvant = maintenant();
  function image() {
    requestAnimationFrame(image);
    var t = maintenant(), dt = t - tAvant; tAvant = t;
    terremerImage(); cairnImage(t); cielImage(); oracleImage(); donsImage(); ventImage(t, dt); riviereImage(); cycleImage(); ensembleImage(); familleImage(); voixImage(); tableImage(); teteImage();
  }
  function retailler() {
    vh = window.innerHeight; vw = window.innerWidth; mobile = window.matchMedia('(max-width: 900px)').matches;
    mesurerCairn(); eventail();
  }
  window.addEventListener('resize', retailler);
  window.addEventListener('load', retailler);
  pierres.forEach(function (p) { var im = $('img', p); if (!im.complete) im.addEventListener('load', mesurerCairn); });
  mesurerCairn(); eventail();
  if (calme) pierres.forEach(function (p) { p.classList.add('pose'); });
  arrivee();
  requestAnimationFrame(image);
})();
