/* Martine Durand : défilement doux, apparitions, le fil de la goutte, les quatre visages, le formulaire.
   Le réglage système « mouvements réduits » n'est jamais lu ; la version calme se demande avec ?calme=1. */
(function () {
  'use strict';
  var h = document.documentElement;
  var calme = h.classList.contains('calme');
  window.MD = true;

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var borne = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var adoucir = function (t) { return 1 - Math.pow(1 - t, 3); };

  /* ---------- défilement doux à la molette (le doigt garde le défilement natif) ---------- */
  var lenis = null;
  if (!calme && window.Lenis) {
    lenis = new window.Lenis({ duration: 1.15, easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); }, smoothWheel: true, wheelMultiplier: 1 });
    var boucle = function (t) { lenis.raf(t); requestAnimationFrame(boucle); };
    requestAnimationFrame(boucle);
  }
  var hauteurEntete = function () { var e = $('.entete'); return e ? e.offsetHeight : 0; };
  var allerA = function (cible) {
    if (!cible) return;
    var decalage = cible.id === 'accueil' || cible.id === 'psychotherapie' ? 0 : -hauteurEntete() - 10;
    if (lenis) lenis.scrollTo(cible, { offset: decalage, duration: 1.5 });
    else window.scrollTo({ top: cible.getBoundingClientRect().top + window.scrollY + decalage, behavior: calme ? 'auto' : 'smooth' });
  };
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href').slice(1);
    var cible = id ? document.getElementById(id) : null;
    if (!cible) return;
    e.preventDefault();
    fermerMenu();
    allerA(cible);
    if (history.replaceState) history.replaceState(null, '', '#' + id);
  });
  // arrivée depuis l'autre page avec une ancre
  if (location.hash && location.hash.length > 1) {
    var depart = document.getElementById(location.hash.slice(1));
    if (depart) setTimeout(function () { allerA(depart); }, 350);
  }

  /* ---------- menu du téléphone ---------- */
  var boutonMenu = $('.bouton-menu');
  var menu = $('#menu-mobile');
  $$('.menu-mobile nav a').forEach(function (a, i) { a.style.setProperty('--n', i); });
  function fermerMenu() {
    if (!menu || menu.hidden) return;
    menu.classList.remove('ouvert');
    boutonMenu.setAttribute('aria-expanded', 'false');
    $('.entete').classList.remove('menu-ouvert');
    menu.hidden = true;
    if (lenis) lenis.start();
  }
  if (boutonMenu && menu) {
    boutonMenu.addEventListener('click', function () {
      if (!menu.hidden) { fermerMenu(); return; }
      menu.hidden = false;
      boutonMenu.setAttribute('aria-expanded', 'true');
      $('.entete').classList.add('menu-ouvert');
      if (lenis) lenis.stop();
      requestAnimationFrame(function () { requestAnimationFrame(function () { menu.classList.add('ouvert'); }); });
    });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) fermerMenu(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') fermerMenu(); });
  }

  /* ---------- le signe des sections, posé dans la page (pas dans un <use>, pour pouvoir l'animer) ---------- */
  $$('svg.signe').forEach(function (s) {
    s.setAttribute('viewBox', '0 0 100 64');
    s.innerHTML = '<g class="s-cercles" fill="none" stroke="currentColor" stroke-width="2.2"><circle class="s-c1" cx="50" cy="44" r="9.5"/><circle class="s-c2" cx="50" cy="44" r="9.5"/><circle class="s-c3" cx="50" cy="44" r="9.5"/></g><use class="s-goutte" href="#goutte" x="43" y="0" width="14" height="20"/>';
  });

  /* ---------- le titre de l'atelier, lettre par lettre, aux couleurs de ses personnages ---------- */
  var titreAtelier = $('.at-titre');
  if (titreAtelier) {
    var couleurs = ['#3a6fb6', '#e8741e', '#7e4fb8', '#4caa3a', '#d99a00', '#d2473a'];
    var k = 0;
    var mots = titreAtelier.textContent.trim().split(/\s+/);
    titreAtelier.setAttribute('aria-label', mots.join(' '));
    titreAtelier.innerHTML = mots.map(function (m) {
      return '<span class="mot" aria-hidden="true">' + m.split('').map(function (l) {
        var html = '<span class="l" style="--k:' + k + ';color:' + couleurs[k % couleurs.length] + (m === 'et' ? ';font-size:.62em' : '') + '">' + l + '</span>';
        k++;
        return html;
      }).join('') + '</span>';
    }).join('<span class="espace" aria-hidden="true"> </span>');
    requestAnimationFrame(function () { titreAtelier.classList.add('vu'); });
  }

  /* ---------- apparitions ---------- */
  var aReveler = $$('[data-revele], .pied, .atelier-persos');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entrees) {
      entrees.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('vu'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
    aReveler.forEach(function (el) { io.observe(el); });
  } else aReveler.forEach(function (el) { el.classList.add('vu'); });
  // l'accueil se montre tout de suite
  requestAnimationFrame(function () { $$('.accueil [data-revele]').forEach(function (el) { el.classList.add('vu'); }); });
  // le titre de la scène des visages
  var titreEmotions = $('.emotions .titre-section');

  /* ---------- le fil de la goutte (écrans larges) ---------- */
  var fil = $('.fil');
  var reperes = $$('[data-repere]');
  var plein = $('.fil-plein'), goutteFil = $('.fil-goutte'), onde = $('.fil-onde'), zone = $('.fil-reperes');
  var marques = [];
  var positions = [];
  if (fil && zone) {
    reperes.forEach(function (sec) {
      var a = document.createElement('a');
      a.href = '#' + sec.id;
      a.setAttribute('aria-label', sec.getAttribute('data-repere'));
      a.innerHTML = '<span>' + sec.getAttribute('data-repere') + '</span>';
      zone.appendChild(a);
      marques.push(a);
    });
  }
  var mesurer = function () {
    var total = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    positions = reperes.map(function (sec) {
      var y = sec.getBoundingClientRect().top + window.scrollY - innerHeight * 0.35;
      return borne(y / total, 0, 1);
    });
    positions[0] = 0;
    marques.forEach(function (m, i) { m.style.top = (positions[i] * 100) + '%'; });
  };

  /* ---------- les quatre visages ---------- */
  var emotions = $('.emotions');
  var cartes = $$('.carte-emotion');
  var rotations = [-3, 2.4, -1.6, 1.2];
  var etatE = -1;

  /* ---------- la boucle d'image ---------- */
  var entete = $('.entete');
  var toileAccueil = $('.accueil-toile .toile');
  var liensNav = $$('.nav a[href^="#"]');
  var dernierIci = -1;
  var flottants = calme ? [] : $$('[data-vitesse]').map(function (el) { return { el: el, v: parseFloat(el.getAttribute('data-vitesse')) || 0 }; });
  var y0 = -1;
  function image() {
    var y = window.scrollY;
    if (y === y0) return;
    y0 = y;
    var vh = innerHeight;
    if (entete) entete.classList.toggle('plie', y > 30);

    // l'accueil : la toile monte un peu moins vite et se balance
    if (toileAccueil && y < vh * 1.3) {
      toileAccueil.style.transform = 'translateY(' + (y * 0.12).toFixed(1) + 'px) rotate(' + (-2.2 + y * 0.004).toFixed(2) + 'deg)';
    }

    // le fil
    var total = Math.max(1, document.documentElement.scrollHeight - vh);
    var p = borne(y / total, 0, 1);
    if (plein) {
      plein.style.transform = 'scaleY(' + p.toFixed(4) + ')';
      goutteFil.style.transform = 'translateY(' + (p * vh * 0.70).toFixed(1) + 'px)';
      var ici = 0;
      for (var i = 0; i < positions.length; i++) if (p >= positions[i] - 0.002) ici = i;
      marques.forEach(function (m, k) { m.classList.toggle('passe', k < ici); m.classList.toggle('ici', k === ici); });
      if (ici !== dernierIci) {
        if (dernierIci !== -1 && onde) { onde.classList.remove('plouf'); void onde.offsetWidth; onde.classList.add('plouf'); }
        dernierIci = ici;
      }
    }

    // les personnages qui flottent à des vitesses différentes
    for (var j = 0; j < flottants.length; j++) {
      var f = flottants[j];
      var rf = f.el.getBoundingClientRect();
      if (rf.bottom < -200 || rf.top > vh + 200) continue;
      var centre = rf.top + rf.height / 2 - vh / 2;
      f.el.style.setProperty('--py', (centre * f.v).toFixed(1) + 'px');
    }

    // le menu du haut suit la partie lue
    var actif = null;
    liensNav.forEach(function (a) {
      var s = document.getElementById(a.getAttribute('href').slice(1));
      if (s && s.getBoundingClientRect().top < vh * 0.4) actif = a;
    });
    liensNav.forEach(function (a) { a.classList.toggle('actif', a === actif); });

    // les visages : chacun se pose sur le précédent
    if (emotions) {
      var r = emotions.getBoundingClientRect();
      var course = r.height - vh;
      var q = borne(-r.top / course, 0, 1);
      if (r.top < vh * 0.5 && titreEmotions) titreEmotions.classList.add('vu');
      var s = q * 3.35;
      var e = 0;
      cartes.forEach(function (c, k) {
        if (k === 0) {
          var couvert0 = borne(s, 0, 1);
          c.style.transform = 'rotate(' + rotations[0] + 'deg) scale(' + (1 - couvert0 * 0.04).toFixed(4) + ')';
          return;
        }
        var t = adoucir(borne(s - (k - 1), 0, 1));
        var couvert = borne(s - k, 0, 1);
        if (t > 0.5) e = k;
        var dy = (1 - t) * (vh * 1.05);
        var rot = rotations[k] + (1 - t) * (k % 2 ? 9 : -9);
        c.style.transform = 'translateY(' + dy.toFixed(1) + 'px) rotate(' + rot.toFixed(2) + 'deg) scale(' + (1 - couvert * 0.04).toFixed(4) + ')';
      });
      if (e === 0 && s > 0.5 && s < 1) e = 0;
      if (e !== etatE) { emotions.setAttribute('data-e', e); etatE = e; }
    }
  }
  var tic = false;
  var demander = function () { if (!tic) { tic = true; requestAnimationFrame(function () { tic = false; image(); }); } };
  if (lenis) lenis.on('scroll', demander);
  window.addEventListener('scroll', demander, { passive: true });
  window.addEventListener('resize', function () { mesurer(); y0 = -1; demander(); });
  window.addEventListener('load', function () { mesurer(); y0 = -1; demander(); });
  mesurer();
  if (emotions) emotions.setAttribute('data-e', '0');
  image();

  /* ---------- formulaire : version d'aperçu, rien ne part ---------- */
  var form = $('.formulaire');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var retour = $('.form-retour', form);
      var manque = false;
      $$('[required]', form).forEach(function (ch) {
        var boite = ch.type === 'checkbox' ? ch.closest('.accord') : ch.closest('.champ');
        var ok = ch.type === 'checkbox' ? ch.checked : (ch.value.trim() !== '' && (ch.type !== 'email' || /.+@.+\..+/.test(ch.value)));
        if (boite) boite.classList.toggle('erreur', !ok);
        if (!ok) manque = true;
      });
      if (manque) {
        retour.className = 'form-retour attention';
        retour.textContent = 'Il manque une information : votre nom, votre e-mail, votre message et votre accord.';
        return;
      }
      retour.className = 'form-retour attention';
      retour.textContent = 'Version d’aperçu du site : ce message ne part pas encore. Le formulaire fonctionnera une fois le site en ligne. En attendant : 06 52 14 34 63.';
    });
  }

  /* ---------- l'année du pied de page ---------- */
  $$('[data-annee]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
