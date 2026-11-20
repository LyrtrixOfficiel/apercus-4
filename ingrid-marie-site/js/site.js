/* Ingrid Marie : la mise en scène du site.
   Le rivage ne s'arrête jamais : derrière chaque section, une vraie matière en plein écran (sable, galets, eau,
   bois, pierre), et une vague qui dépose la suivante quand on descend. Une seule boucle d'animation.
   Le site ne lit pas le réglage « mouvements réduits » de l'appareil (coupé sans raison sur bien des PC). Version calme sur
   demande, « ?calme=1 » : les matières et la vague restent, puisqu'elles suivent le doigt ; ce qui bouge tout seul ou
   déplace l'écran (défilement doux, défilement de côté, glissements, vague entre deux pages) s'arrête. */
(function () {
  'use strict';
  var IM = window.IM = {};
  var html = document.documentElement;
  var calme = html.classList.contains('calme');
  var vh = window.innerHeight, vw = window.innerWidth;
  var mobile = window.matchMedia('(max-width: 900px)').matches;
  var borne = function (x, a, b) { return x < a ? a : x > b ? b : x; };
  var lisse = function (a, b, x) { x = borne((x - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); };
  var melange = function (a, b, t) { return a + (b - a) * t; };
  var secondes = function () { return performance.now() / 1000; };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ------------------------------------------------------------ défilement doux, même à la molette (au doigt : celui du téléphone) */
  var lenis = null;
  if (!calme && window.Lenis) { try { lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 0.95, syncTouch: false }); } catch (e) { lenis = null; } }
  IM.lenis = lenis;
  /* la marée de l'accueil attend la fin de l'arrivée sous la Lune (js/scenes.js) */
  var attendre = html.classList.contains('entree-la'), compose = false;
  IM.apresEntree = function () { attendre = false; if (compose && !depart) depart = secondes(); };

  /* ------------------------------------------------------------ l'aperçu (votremaquette.fr, hébergement sans formulaires) : on le dit au lieu de faire semblant d'envoyer */
  if (/votremaquette\.fr$|github\.io$/.test(location.hostname)) $$('form.mot').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var note = $('.mot__apercu', f) || f.appendChild(document.createElement('p'));
      note.className = 'mot__note mot__apercu'; note.setAttribute('role', 'status');
      note.textContent = "Version d'aperçu du site : ce message ne part pas encore. Le formulaire fonctionnera une fois le site en ligne.";
    });
  });

  /* ------------------------------------------------------------ la Lune du jour (js/lune.js), dans la scène « Lune et Soleil » */
  (function () {
    var ciel = $('#lune-ciel');
    if (!ciel || !window.LuneDuJour) return;
    try {
      var l = window.LuneDuJour.lune(new Date());
      var f = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Paris' });
      var date = function (d) { return f.format(d).replace(/ 1 /, ' 1er '); };
      var deux = [['pleine lune', l.pleine], ['nouvelle lune', l.nouvelle]].sort(function (a, b) { return a[1] - b[1]; });
      var suite = deux[0][0] + ' ' + date(deux[0][1]) + ', ' + deux[1][0] + ' ' + date(deux[1][1]) + '.';
      $('#lune-nom').textContent = l.nom;
      $('#lune-suite').textContent = suite.charAt(0).toUpperCase() + suite.slice(1);
      ciel.hidden = false;
    } catch (e) { ciel.hidden = true; }
  })();

  /* ------------------------------------------------------------ en-tête et menu */
  var tete = $('#tete'), menu = $('#menu'), ouvrir = $('#ouvrir-menu');
  var yAvant = 0;
  function enTete(y) {
    tete.classList.toggle('tete--pleine', y > 40);
    if (y > yAvant + 8 && y > 320 && !html.classList.contains('menu-ouvert')) tete.classList.add('tete--cachee');
    else if (y < yAvant - 8 || y < 320) tete.classList.remove('tete--cachee');
    yAvant = y;
  }
  var fermeture = null;
  function basculerMenu(etat) {
    var ouvert = etat == null ? !html.classList.contains('menu-ouvert') : etat;
    clearTimeout(fermeture);
    if (ouvert) {
      menu.hidden = false; void menu.offsetWidth;
      html.classList.add('menu-ouvert');
      tete.classList.remove('tete--cachee');
      document.body.style.overflow = 'hidden';
      if (lenis) lenis.stop();
    } else {
      html.classList.remove('menu-ouvert');
      document.body.style.overflow = '';
      if (lenis) lenis.start();
      fermeture = setTimeout(function () { menu.hidden = true; }, 750);
    }
    ouvrir.setAttribute('aria-expanded', ouvert ? 'true' : 'false');
    ouvrir.setAttribute('aria-label', ouvert ? 'Fermer le menu' : 'Ouvrir le menu');
    var mot = $('span', ouvrir); if (mot) mot.textContent = ouvert ? 'Fermer' : 'Menu';
  }
  if (ouvrir) ouvrir.addEventListener('click', function () { basculerMenu(); });
  var soins = $('.tete__soins'), boutonSoins = $('.tete__bouton');
  function sousMenu(etat) {
    if (!soins) return;
    soins.classList.toggle('ouvert', etat);
    boutonSoins.setAttribute('aria-expanded', etat ? 'true' : 'false');
  }
  if (boutonSoins) {
    boutonSoins.addEventListener('click', function (e) { e.stopPropagation(); sousMenu(!soins.classList.contains('ouvert')); });
    soins.addEventListener('mouseenter', function () { if (!mobile) sousMenu(true); });
    soins.addEventListener('mouseleave', function () { sousMenu(false); });
    document.addEventListener('click', function (e) { if (!soins.contains(e.target)) sousMenu(false); });
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { sousMenu(false); if (html.classList.contains('menu-ouvert')) basculerMenu(false); } });
  $$('[data-annee]').forEach(function (e) { e.textContent = new Date().getFullYear(); });

  /* ------------------------------------------------------------ les mots qui s'éclairent à la lecture */
  var phrases = $$('[data-mots]');
  phrases.forEach(function (el) {
    var mots = el.textContent.trim().split(/ +/);
    el.textContent = '';
    mots.forEach(function (m, i) {
      var s = document.createElement('span'); s.className = 'm'; s.textContent = m;
      el.appendChild(s);
      if (i < mots.length - 1) el.appendChild(document.createTextNode(' '));
    });
    el._m = $$('.m', el); el._n = -1;
  });
  function lireMots() {
    phrases.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      var debut = vh * 0.88, fin = vh * 0.3;
      var p = borne((debut - r.top) / (debut - fin + r.height * 0.5), 0, 1);
      var n = Math.round(p * el._m.length);
      if (n === el._n) return;
      el._n = n;
      for (var i = 0; i < el._m.length; i++) el._m[i].classList.toggle('lu', i < n);
    });
  }

  /* ------------------------------------------------------------ les photos qui glissent dans leur galet */
  var cadres = $$('[data-glisse]');
  var flottants = $$('[data-flotte]');
  function glisser() {
    if (calme) return;
    flottants.forEach(function (el) {
      var r = el.parentNode.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      el.style.setProperty('--f', ((r.top + r.height / 2 - vh / 2) * parseFloat(el.getAttribute('data-flotte'))).toFixed(1) + 'px');
    });
    cadres.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) return;
      var c = (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2);
      el.style.setProperty('--g', (-(0.5 - c * 0.5) * 13.5).toFixed(2) + '%');
    });
  }

  /* ------------------------------------------------------------ le rivage : toutes les matières, sous une même eau */
  var toile = $('#eau'), eau = null, scenes = [], pret = false, H = vh;
  var rivage = $('#rivage'), sceneRivage = null, nom = null, imageFond = null;
  var maree = -0.32, depart = 0, echelleEau = 1, lent = 0, compte = 0, tAvant = 0;
  var front = 9, kAvant = -1, impulsion = null, attenteCompo = null;

  /* Le sable de l'accueil, avec le nom écrit du doigt exactement là où le titre est posé. */
  function composer() {
    if (!eau || !eau.ok || !rivage || !imageFond || !imageFond.naturalWidth) return;
    eau.taille();
    var c = eau.canvas, l = c.width, h = c.height;
    var t = document.createElement('canvas'); t.width = l; t.height = h;
    var x = t.getContext('2d');
    var il = imageFond.naturalWidth, ih = imageFond.naturalHeight, r = Math.max(l / il, h / ih);
    x.drawImage(imageFond, (l - il * r) / 2, (h - ih * r) / 2, il * r, ih * r);
    var k = l / sceneRivage.clientWidth, cadre = sceneRivage.getBoundingClientRect(), style = getComputedStyle(nom);
    var taille = parseFloat(style.fontSize) * k;
    x.font = 'italic 400 ' + taille + 'px Fraunces, Georgia, serif';
    x.textBaseline = 'alphabetic';
    try { if ('letterSpacing' in x) x.letterSpacing = ((parseFloat(style.letterSpacing) || 0) * k) + 'px'; } catch (e) {}
    $$('span', nom).forEach(function (s) {
      var b = s.getBoundingClientRect(), m = x.measureText(s.textContent);
      var haut = m.fontBoundingBoxAscent || taille * 0.8, bas = m.fontBoundingBoxDescent || taille * 0.2;
      var px = (b.left - cadre.left) * k, py = (b.top - cadre.top) * k + (b.height * k - (haut + bas)) / 2 + haut;
      var d = Math.max(1, taille * 0.012);
      x.save();
      x.globalCompositeOperation = 'soft-light'; x.fillStyle = 'rgba(255,251,238,0.95)';
      try { x.filter = 'blur(' + (d * 0.5).toFixed(1) + 'px)'; } catch (e) {}
      x.fillText(s.textContent, px + d * 1.4, py + d * 1.6);
      x.globalCompositeOperation = 'multiply'; x.fillStyle = 'rgba(118,88,54,0.86)';
      try { x.filter = 'blur(' + (d * 0.3).toFixed(1) + 'px)'; } catch (e) {}
      x.fillText(s.textContent, px, py);
      x.fillStyle = 'rgba(84,60,34,0.4)';
      try { x.filter = 'blur(' + (d * 0.9).toFixed(1) + 'px)'; } catch (e) {}
      x.fillText(s.textContent, px - d * 0.7, py - d * 0.8);
      x.restore();
    });
    scenes[0].mat = eau.texture(t, scenes[0].mat);
    html.classList.add('nom-ecrit');
  }

  function charger(s) {
    if (s.etat || s.rivage || !s.sources.length) return;
    s.etat = 1;
    var besoin = Math.max(toile.width, toile.height * 1.5) * 0.85, choix = s.sources[s.sources.length - 1];
    for (var i = 0; i < s.sources.length; i++) if (s.sources[i].l >= besoin) { choix = s.sources[i]; break; }
    var im = new Image();
    im.decoding = 'async';
    im.onload = function () { if (!eau) return; s.mat = eau.texture(im); s.etat = 2; };
    im.onerror = function () { s.etat = 3; };   // pas de nouvel essai : la section garde un aplat crème
    im.src = choix.u;
  }

  function preparerEau() {
    if (!toile || !window.Eau) return;
    echelleEau = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 1.25);
    eau = new window.Eau(toile, { mode: 'fond', echelle: echelleEau });
    var els = $$('[data-matiere]');
    if (!eau.ok || !els.length) { eau = null; return; }
    eau.taille();
    scenes = els.map(function (el, i) {
      var f = (el.getAttribute('data-foyer') || '50 50').split(/\s+/);
      return {
        el: el, rang: i, rivage: el === rivage, mat: null, etat: 0, haut: 0, h: 0, longe: null,
        sources: (el.getAttribute('data-sources') || '').split(',').map(function (x) { var p = x.trim().split(/\s+/); return { u: p[0], l: parseFloat(p[1]) || 0 }; }).filter(function (x) { return x.u; }),
        lave: parseFloat(el.getAttribute('data-lave')) || 0, bain: parseFloat(el.getAttribute('data-bain')) || 0,
        fx: (parseFloat(f[0]) || 50) / 100, fy: (parseFloat(f[1]) || 50) / 100,
        seches: [], emportes: []
      };
    });
    $$('[data-seche]').forEach(function (e) { var p = e.closest('[data-matiere]'), i = els.indexOf(p); if (i >= 0) scenes[i].seches.push(e); else e.classList.add('sec'); });
    $$('[data-emporte]').forEach(function (e) { var p = e.closest('[data-matiere]'), i = els.indexOf(p); if (i >= 0) scenes[i].emportes.push(e); });
    // tout ce qui est posé sur une matière part avec elle : la vague emporte aussi les blocs qui n'ont rien demandé
    var hors = '.scene__fond, .rivage__fond, script, style';
    scenes.forEach(function (s) {
      var liste = s.emportes;
      var pris = function (e) { for (var a = 0; a < liste.length; a++) if (liste[a] === e || liste[a].contains(e)) return true; return false; };
      var contient = function (e) { for (var a = 0; a < liste.length; a++) if (e.contains(liste[a])) return true; return false; };
      var ajouter = function (e, niveau) {
        if (e.matches(hors) || pris(e) || (e.closest('[data-matiere]') !== s.el)) return;
        if (e.matches('.halo')) { e._doux = true; e.classList.add('emportable'); liste.push(e); return; }
        var enfants = Array.prototype.slice.call(e.children);
        var cadre = e.matches('.scene__dedans, .soin-scene__colle, .rivage__scene, .seance__scene');
        if ((cadre || contient(e) || $('[data-seche]', e)) && enfants.length && niveau < 4 && !e.hasAttribute('data-seche')) { enfants.forEach(function (c) { ajouter(c, niveau + 1); }); return; }
        e._doux = true; e.classList.add('emportable'); liste.push(e);
      };
      Array.prototype.slice.call(s.el.children).forEach(function (c) { ajouter(c, 0); });
    });
    html.classList.add('eau-voulue');
    if (rivage && scenes[0].rivage) {
      sceneRivage = $('.rivage__scene', rivage); nom = $('#nom'); imageFond = $('.rivage__fond img', rivage);
      nom.innerHTML = nom.textContent.trim().split(/\s+/).map(function (m) { return '<span>' + m + '</span>'; }).join(' ');
      var quand = function () {
        var polices = document.fonts && document.fonts.load ? document.fonts.load('italic 400 80px Fraunces') : Promise.resolve();
        polices.then(composer, composer).then(function () { compose = true; if (!attendre) depart = secondes(); });
      };
      if (imageFond.complete && imageFond.naturalWidth) quand(); else imageFond.addEventListener('load', quand);
    }
    if (calme) return;
    var ox = -99, oy = -99, ot = 0;
    var toucher = function (e) {
      var x = e.clientX, y = e.clientY, t = secondes();
      var dx = x - ox, dy = y - oy;
      if (dx * dx + dy * dy < 54 * 54 && t - ot < 0.5) return;
      ox = x; oy = y; ot = t;
      eau.onde(x, y, t);
    };
    window.addEventListener('pointermove', toucher, { passive: true });
    window.addEventListener('pointerdown', toucher, { passive: true });
  }

  /* Comment une matière couvre l'écran : échelle et décalage, avec un léger glissement quand on descend. */
  function cadre(s, y) {
    if (s.rivage) return [1, 1, 0, Math.max(0, y - (s.h - vh)) / H];
    var m = s.mat;
    if (!m) return [1, 1, 0, 0];
    var ca = toile.width / toile.height, ta = m.l / m.h, sx = 1, sy = 1;
    if (ta > ca) sx = ca / ta; else sy = ta / ca;
    sx /= 1.07; sy /= 1.07;
    var mx = (1 - sx) / 2, my = (1 - sy) / 2;
    var ox = mx * (2 * s.fx - 1), oy = my * (2 * s.fy - 1);
    if (!calme) {
      if (s.longe != null) ox = mx * (2 * s.longe - 1) * 0.9;
      oy -= borne(((s.haut + s.h / 2) - (y + vh / 2)) / vh, -1.2, 1.2) * 0.03;
    }
    return [sx, sy, borne(ox, -mx, mx), borne(oy, -my, my)];
  }

  function imageEau(t, y) {
    if (!eau || !eau.ok) return;
    var dt = Math.min(0.1, Math.max(0.001, t - tAvant));
    if (eau.taille() && rivage) { clearTimeout(attenteCompo); attenteCompo = setTimeout(composer, 160); }
    H = toile.clientHeight || vh;
    var i, n = scenes.length, k = 0;
    for (i = 1; i < n; i++) { if (scenes[i].haut - y < vh) k = i; else break; }
    var A = scenes[k], B = A, f = 9, balaye = false;
    if (k > 0) {
      var b = (scenes[k].haut - y) / vh, cible = Math.max(-0.42, b - (1 - b) * 1.5);
      front = k !== kAvant ? cible : front + (cible - front) * (1 - Math.exp(-dt * 9));
      if (front > -0.34) { A = scenes[k - 1]; f = front; } else balaye = true;
    }
    kAvant = k;
    var epaisseur = 0.24;
    if (impulsion) {
      var q = (t - impulsion.debut) / impulsion.duree;
      if (q >= 1 || f < 5) { if (!impulsion.fait) impulsion.cb(); impulsion = null; }
      else {
        var e = q * q * (3 - 2 * q);
        f = melange(1.12, -0.36, e); epaisseur = 0.32;
        if (!impulsion.fait && q > 0.52) { impulsion.fait = true; impulsion.cb(); }
      }
    }
    var bande = epaisseur * lisse(-0.32, 0.45, f > 5 ? 0 : f);

    // la marée de l'accueil
    var mar = 9;
    if (A.rivage && depart) {
      // la section suivante recouvre le dernier écran de l'accueil : il reste épinglé pendant que la vague passe
      var chevauche = n > 1 && scenes[1].haut < A.haut + A.h - 4;
      var course = A.h - vh * (chevauche ? 2 : 1), p = course > 2 ? borne(y / course, 0, 1) : 1;
      var but = melange(0.06, mobile ? 0.70 : 0.74, lisse(0, 1, p));
      but = melange(-0.32, but, lisse(0, 1, (t - depart) / 2.6));
      maree = calme ? but : maree + (but - maree) * (1 - Math.exp(-dt * 5.2));
      mar = maree * sceneRivage.clientHeight / H;
      rivage.classList.toggle('basse', p > 0.8);
    }

    // les photos : celles d'ici et d'à côté, pas plus
    for (i = 0; i < n; i++) {
      var s = scenes[i], ecart = i - k;
      if (ecart >= -1 && ecart <= (mobile ? 1 : 2)) charger(s);
      else if ((ecart < -2 || ecart > 3) && s.mat && !s.rivage) { eau.liberer(s.mat); s.mat = null; s.etat = 0; }
    }
    if (!pret && A.mat) {
      pret = true; html.classList.add('eau-ok');
      setTimeout(function () { html.classList.add('eau-seule'); }, 900);
    }

    var kH = vh / H;
    eau.dessine(t, {
      a: A.mat, b: B.mat, cadreA: cadre(A, y), cadreB: cadre(B, y), maree: mar,
      front: f > 5 ? 9 : f * kH, bande: bande * kH, lave: [A.lave, B.lave], bain: [A.bain, B.bain]
    });

    // ce que la vague découvre, ce qu'elle emporte
    var fpx = f > 5 ? -1e9 : f * vh, limite = fpx + bande * vh * 0.85;
    for (i = Math.max(0, k - 1); i <= Math.min(n - 1, k + 1); i++) {
      var sc = scenes[i], j, el, r;
      for (j = 0; j < sc.seches.length; j++) {
        el = sc.seches[j];
        if (el._vu) continue;
        r = el.getBoundingClientRect();
        if (r.top > vh * 0.93) continue;
        if (r.bottom > 0 && f < 5 && i >= k && !impulsion && r.top < limite) continue;
        el._vu = true; el.classList.add('sec');
      }
      for (j = 0; j < sc.emportes.length; j++) {
        el = sc.emportes[j];
        var parti = false;
        if (i === k - 1 && !impulsion) {
          if (balaye) parti = true;
          else if (f < 5) { r = el.getBoundingClientRect(); parti = (el._doux ? (Math.max(r.top, 0) + Math.min(r.bottom, vh)) / 2 : r.bottom - 8) > fpx; }
        }
        if (parti !== !!el._parti) { el._parti = parti; el.classList.toggle('emporte', parti); }
      }
    }

    // si l'appareil peine, on allège le dessin (jamais le contenu)
    if (t - tAvant < 0.5) { lent += t - tAvant; compte++; }
    tAvant = t;
    if (compte >= 50) {
      if (lent / compte > 0.027 && echelleEau > 0.62) { echelleEau = Math.max(0.6, echelleEau * 0.78); eau.echelle = echelleEau; if (rivage) composer(); }
      lent = 0; compte = 0;
    }
  }

  /* Une vague passe sur la section en cours (elle apporte un autre avis). */
  IM.vague = function (suite) {
    if (!eau || !eau.ok || calme) { setTimeout(suite, 380); return; }
    impulsion = { debut: secondes(), duree: 1.7, cb: suite, fait: false };
  };

  /* sans le rivage animé : les blocs apparaissent simplement quand on arrive dessus */
  function sansEau() {
    var tous = $$('[data-seche]');
    if (!('IntersectionObserver' in window)) { tous.forEach(function (e) { e.classList.add('sec'); }); return; }
    var veille = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('sec'); veille.unobserve(e.target); } }); }, { threshold: 0.12 });
    tous.forEach(function (e) { veille.observe(e); });
  }

  function mesurer() {
    var y = window.scrollY;
    scenes.forEach(function (s) { var r = s.el.getBoundingClientRect(); s.haut = r.top + y; s.h = r.height; });
    if (seance) { seance._haut = seance.getBoundingClientRect().top + y; seance._long = seance.offsetHeight - vh; }
  }

  /* ------------------------------------------------------------ d'une page à l'autre : la nappe monte, puis se retire */
  var voile = null, passage = null;
  function preparerVoile() {
    var t = $('#voile');
    if (!window.Eau || !t || calme) return;
    voile = new window.Eau(t, { mode: 'voile', echelle: mobile ? 0.8 : 0.7 });
    if (!voile.ok) voile = null;
  }
  function imageVoile(t) {
    if (!voile || !passage) return;
    var k = borne((t - passage.debut) / passage.duree, 0, 1), e = k * k * (3 - 2 * k);
    voile.taille(); voile.couvre = 1;
    voile.maree = passage.sens === 'monte' ? melange(1.2, -0.3, e) : melange(-0.3, 1.25, e);
    voile.dessine(t);
    if (k >= 1) {
      if (passage.sens === 'monte') { if (!passage.parti) { passage.parti = true; window.location.href = passage.url; } }
      else { passage = null; voile.couvre = 0; voile.efface(); }
    }
  }
  IM.partir = function (adresse) {
    if (!voile) { window.location.href = adresse; return; }
    try { sessionStorage.setItem('im-vague', '1'); } catch (e) {}
    passage = { sens: 'monte', debut: secondes(), duree: 0.7, url: adresse };
  };
  function arriver() {
    var nappe = $('#nappe');
    if (!html.classList.contains('arrivee')) return;
    try { sessionStorage.removeItem('im-vague'); } catch (e) {}
    if (voile) {
      voile.taille(); voile.couvre = 1; voile.maree = -0.3; voile.dessine(secondes());
      html.classList.remove('arrivee');
      passage = { sens: 'descend', debut: secondes() + 0.08, duree: 1.15 };
    } else {
      nappe.classList.add('part');
      setTimeout(function () { html.classList.remove('arrivee'); nappe.classList.remove('part'); }, 750);
    }
  }
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) { passage = null; html.classList.remove('arrivee'); if (voile) { voile.couvre = 0; voile.efface(); } }
  });
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a') : null;
    if (!a || a.target === '_blank' || a.hasAttribute('download') || e.defaultPrevented) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    var u;
    try { u = new URL(a.href, window.location.href); } catch (x) { return; }
    if (u.origin !== window.location.origin || /^\/(espace|api|media)\//.test(u.pathname)) return;
    if (u.pathname === window.location.pathname) {
      if (html.classList.contains('menu-ouvert')) basculerMenu(false);
      var cible = null; try { cible = u.hash.length > 1 ? document.getElementById(decodeURIComponent(u.hash.slice(1))) : null; } catch (x) {}
      if (cible && lenis) { e.preventDefault(); lenis.scrollTo(cible, { offset: -90, duration: 1.5 }); }
      return;
    }
    if (!/(\.html|\/)$/.test(u.pathname)) return;
    e.preventDefault();
    if (html.classList.contains('menu-ouvert')) basculerMenu(false);
    IM.partir(u.href);
  });

  /* ------------------------------------------------------------ la séance : on longe le rivage */
  var seance = $('#seance'), piste = $('#piste'), etapes = piste ? $$('li', piste) : [], jauge = seance ? $('.seance__jauge i', seance) : null, sceneSeance = null;
  function longer(y) {
    if (!seance || calme) return;
    if (y < seance._haut - vh || y > seance._haut + seance._long + vh) return;
    var p = borne((y - seance._haut) / Math.max(1, seance._long), 0, 1);
    piste.style.setProperty('--x', (-p * Math.max(0, piste.scrollWidth - vw)).toFixed(1) + 'px');
    if (jauge) jauge.style.transform = 'scaleX(' + p.toFixed(4) + ')';
    if (sceneSeance) sceneSeance.longe = p;
    var ici = Math.round(p * (etapes.length - 1));
    etapes.forEach(function (li, i) { li.classList.toggle('ici', i === ici); });
  }

  /* ------------------------------------------------------------ les avis : une vague en apporte un autre */
  var echos = $('#echos');
  if (echos) {
    var avis = []; try { avis = JSON.parse(echos.getAttribute('data-avis')); } catch (e) {}
    var rang = 0, occupe = false, visible = false, figure = $('.echos__avis', echos), compteur = $('#echo-rang');
    var poser = function () {
      var a = avis[rang];
      $('#echo-texte').textContent = a.t; $('#echo-nom').textContent = a.n; $('#echo-date').textContent = a.d + ', avis vérifié sur Resalib';
      if (compteur) compteur.textContent = (rang + 1) + ' / ' + avis.length;
    };
    var suivant = function () {
      if (occupe || avis.length < 2) return;
      occupe = true;
      rang = (rang + 1) % avis.length;
      figure.classList.add('part');
      IM.vague(function () { poser(); figure.classList.remove('part'); setTimeout(function () { occupe = false; }, 900); });
    };
    $('#echo-suivant').addEventListener('click', function () { suivant(); clearInterval(tour); });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }, { threshold: 0.6 }).observe(echos);
    var tour = setInterval(function () { if (visible && !document.hidden && !calme) suivant(); }, 9000);
  }

  /* ------------------------------------------------------------ les communes : deux rangs qui se croisent */
  var rangs = $$('[data-rang]');
  function defiler(t, y) {
    if (!rangs.length || calme) return;
    rangs.forEach(function (el) {
      var r = el.parentNode.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      var moitie = el.scrollWidth / 2, sens = el.getAttribute('data-rang') === 'retour' ? -1 : 1;
      var x = (y * 0.5 + t * 22) % moitie;
      el.style.setProperty('--x', (sens > 0 ? -x : x - moitie).toFixed(1) + 'px');
    });
  }

  /* ------------------------------------------------------------ le rendez-vous à portée de pouce (téléphone) */
  var rdv = $('#rdv-fixe');
  function pouce(y) {
    if (!rdv) return;
    var seuil = rivage ? rivage.offsetHeight - vh * 1.4 : 360;
    rdv.classList.toggle('la', y > seuil && y + vh < document.documentElement.scrollHeight - 420);
  }

  /* ------------------------------------------------------------ la boucle */
  var yVu = -1;
  function image(ms) {
    requestAnimationFrame(image);
    if (lenis) lenis.raf(ms);
    var t = ms / 1000, y = window.scrollY;
    if (y !== yVu) { enTete(y); lireMots(); glisser(); longer(y); pouce(y); yVu = y; }
    imageEau(t, y);
    imageVoile(t);
    defiler(t, y);
  }
  var largeurVue = vw;
  function retailler() {
    var l = window.innerWidth, h = window.innerHeight;
    vh = h; vw = l; mobile = window.matchMedia('(max-width: 900px)').matches;
    if (l !== largeurVue) { largeurVue = l; kAvant = -1; }
    mesurer(); yVu = -1;
    if (lenis) lenis.resize();
  }
  window.addEventListener('resize', retailler);
  window.addEventListener('load', function () { mesurer(); yVu = -1; });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { mesurer(); yVu = -1; });
  if ('ResizeObserver' in window) { var guet = null; new ResizeObserver(function () { clearTimeout(guet); guet = setTimeout(function () { mesurer(); yVu = -1; }, 120); }).observe(document.body); }

  preparerEau();
  if (!eau) sansEau();
  if (seance) for (var i = 0; i < scenes.length; i++) if (scenes[i].el === seance) sceneSeance = scenes[i];
  preparerVoile();
  mesurer();
  arriver();
  requestAnimationFrame(image);
})();
