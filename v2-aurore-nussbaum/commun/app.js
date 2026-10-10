/* Site praticien V2 : comportements communs aux huit directions.
   Chaque effet s'active par un attribut dans le HTML (data-split, data-reveal,
   data-scrub, data-recit, data-horizontal, data-parallaxe, data-curseur,
   data-apercu, data-video). Une direction n'a donc rien a programmer : sa
   composition decide des attributs presents. Sans ce fichier, tout s'affiche
   (la classe « js » est retiree au bout de 4 s par la page). */
(function () {
  'use strict';
  var R = document.documentElement;
  var reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finPointeur = window.matchMedia('(pointer: fine)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* --- texte decoupe en mots et lettres ------------------------------------ */
  function decouper(el) {
    var label = el.textContent.replace(/\s+/g, ' ').trim(), c = 0, w = 0;
    function traiter(n, parent) {
      if (n.nodeType === 3) {
        n.textContent.split(/([ \t\n\r]+)/).forEach(function (m) {
          if (!m) return;
          if (/^[ \t\n\r]+$/.test(m)) { parent.appendChild(document.createTextNode(' ')); return; }
          var mot = document.createElement('span'); mot.className = 'mot'; mot.style.setProperty('--w', w++);
          Array.from(m).forEach(function (ch) { var s = document.createElement('span'); s.className = 'c'; s.style.setProperty('--c', c++); s.textContent = ch; mot.appendChild(s); });
          parent.appendChild(mot);
        });
      } else if (n.nodeType === 1) {
        var copie = n.cloneNode(false); parent.appendChild(copie);
        Array.from(n.childNodes).forEach(function (x) { traiter(x, copie); });
      }
    }
    var f = document.createDocumentFragment();
    Array.from(el.childNodes).forEach(function (n) { traiter(n, f); });
    el.textContent = ''; el.appendChild(f); el.setAttribute('aria-label', label);
    Array.from(el.children).forEach(function (e) { e.setAttribute('aria-hidden', 'true'); });
  }
  $$('[data-split]').forEach(decouper);

  /* --- apparitions au defilement ------------------------------------------ */
  var aVoir = $$('main [data-reveal], main [data-split], .cerf');
  var ac = $('.ac');
  aVoir = aVoir.filter(function (e) { return !ac || !ac.contains(e); });
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: .08 });
    aVoir.forEach(function (e) { io.observe(e); });
  } else aVoir.forEach(function (e) { e.classList.add('is-in'); });

  /* L'accueil joue sa choregraphie une fois les polices pretes. */
  function intro() {
    if (!ac) return;
    var m = $$('[data-anim], [data-split]', ac);
    requestAnimationFrame(function () { requestAnimationFrame(function () { ac.classList.add('is-in'); m.forEach(function (x) { x.classList.add('is-in'); }); }); });
  }

  /* --- video de fond : chargee apres l'affichage, jamais en mouvement reduit */
  $$('video[data-video]').forEach(function (v) {
    var eco = navigator.connection && navigator.connection.saveData;
    if (reduit || eco) return;
    setTimeout(function () {
      v.src = v.getAttribute('data-video');
      v.addEventListener('playing', function () { v.classList.add('is-lue'); }, { once: true });
      var p = v.play(); if (p && p.catch) p.catch(function () {});
    }, 600);
  });

  /* --- curseur : lumiere de l'accueil (Aurore), projecteur (Nuit) ---------- */
  if (finPointeur && !reduit) {
    $$('[data-curseur], .ac--video').forEach(function (z) {
      var cible = null;
      z.addEventListener('pointermove', function (e) {
        var r = z.getBoundingClientRect();
        cible = [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height];
        requestAnimationFrame(function () {
          if (!cible) return;
          z.style.setProperty('--cx', (cible[0] - .5).toFixed(3)); z.style.setProperty('--cy', (cible[1] - .5).toFixed(3));
          z.style.setProperty('--mx', (cible[0] * 100).toFixed(1) + '%'); z.style.setProperty('--my', (cible[1] * 100).toFixed(1) + '%');
          cible = null;
        });
      }, { passive: true });
    });
  }

  /* --- apercu d'image qui suit le curseur (liste des apports, Nuit) -------- */
  $$('[data-apercu]').forEach(function (s) {
    var boite = $('.apercu-curseur', s), im = boite && $('img', boite);
    if (!boite || !finPointeur || reduit) return;
    $$('[data-image]', s).forEach(function (li) {
      li.addEventListener('pointerenter', function () { im.src = li.getAttribute('data-image'); boite.classList.add('is-visible'); });
      li.addEventListener('pointerleave', function () { boite.classList.remove('is-visible'); });
    });
    s.addEventListener('pointermove', function (e) { boite.style.setProperty('--ax', e.clientX + 'px'); boite.style.setProperty('--ay', e.clientY + 'px'); }, { passive: true });
  });

  /* --- citation qui s'allume mot a mot ------------------------------------- */
  var citations = $$('[data-scrub]');
  citations.forEach(function (q) {
    var p = $('p', q), mots = p.textContent.trim().split(/\s+/);
    p.setAttribute('aria-label', p.textContent.trim());
    p.innerHTML = mots.map(function (m, i) { return '<span class="m" aria-hidden="true" style="--i:' + i + '">' + m + '</span>'; }).join(' ');
    q.style.setProperty('--n', mots.length);
  });

  /* --- recit epingle ------------------------------------------------------- */
  var recits = $$('[data-recit]');
  /* --- defilement horizontal ------------------------------------------------ */
  var horizontaux = $$('[data-horizontal]');
  var grandEcran = window.matchMedia('(min-width: 900px)');
  function mesurerHorizontaux() {
    horizontaux.forEach(function (s) {
      var piste = $('.horizontal__piste', s), scene = $('.horizontal__scene', s);
      var actif = grandEcran.matches && !reduit;
      s.classList.toggle('est-epingle', actif);
      if (!actif) { s.style.removeProperty('--hauteur'); piste.style.removeProperty('--x'); return; }
      var course = Math.max(0, piste.scrollWidth - scene.clientWidth);
      s._course = course;
      s.style.setProperty('--hauteur', (course + window.innerHeight) + 'px');
    });
  }
  /* --- parallaxe ------------------------------------------------------------ */
  var parallaxes = reduit ? [] : $$('[data-parallaxe]');

  var entete = $('#entete');
  var liens = $$('.nav a');
  var cibles = liens.map(function (a) { return $(a.getAttribute('href')); });
  var attente = false;
  function image() {
    attente = false;
    var vh = window.innerHeight;
    if (entete) entete.classList.toggle('is-scrolled', window.scrollY > 30);
    citations.forEach(function (q) {
      if (reduit || R.classList.contains('tout-visible')) { q.style.setProperty('--p', 1); return; }
      var r = q.getBoundingClientRect();
      q.style.setProperty('--p', Math.max(0, Math.min(1, (vh * .9 - r.top) / (r.height + vh * .5))).toFixed(3));
    });
    recits.forEach(function (s) {
      var sc = $('.recit__scene', s), r = sc.getBoundingClientRect(), n = +getComputedStyle(s).getPropertyValue('--n') || 4;
      var p = Math.max(0, Math.min(.999, -r.top / Math.max(1, r.height - vh)));
      s.setAttribute('data-actif', String(Math.floor(p * n)));
    });
    horizontaux.forEach(function (s) {
      if (!s.classList.contains('est-epingle')) return;
      var r = s.getBoundingClientRect(), p = Math.max(0, Math.min(1, -r.top / Math.max(1, r.height - vh)));
      $('.horizontal__piste', s).style.setProperty('--x', (-p * (s._course || 0)).toFixed(1) + 'px');
    });
    parallaxes.forEach(function (el) {
      var r = el.parentElement.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) return;
      var centre = (r.top + r.height / 2 - vh / 2) / vh;
      el.style.transform = 'translate3d(0,' + (centre * -100 * parseFloat(el.getAttribute('data-parallaxe'))).toFixed(1) + 'px,0)';
    });
    var actif = -1;
    cibles.forEach(function (c, i) { if (c && c.getBoundingClientRect().top < vh * .4) actif = i; });
    liens.forEach(function (a, i) { a.classList.toggle('is-actif', i === actif); });
  }
  function demander() { if (!attente) { attente = true; requestAnimationFrame(image); } }
  window.addEventListener('scroll', demander, { passive: true });
  var minuterie = 0;
  window.addEventListener('resize', function () { clearTimeout(minuterie); minuterie = setTimeout(function () { mesurerHorizontaux(); demander(); }, 150); });

  /* --- menus <details> : se referment au choix d'un lien, ou a cote ------- */
  $$('details.menu').forEach(function (m) {
    m.addEventListener('click', function (e) { if (e.target.closest('a')) m.open = false; });
    document.addEventListener('click', function (e) { if (m.open && !m.contains(e.target)) m.open = false; });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') m.open = false; });
    m.addEventListener('toggle', function () { document.body.style.overflow = m.open && /plein|panneau/.test(m.className) ? 'hidden' : ''; });
  });

  /* --- selecteur de direction (demonstration) ------------------------------ */
  var boite = $('#ambiances');
  if (boite) {
    var b = $('.ambiances__bouton', boite);
    var ouvrir = function (oui) { boite.classList.toggle('is-ouvert', oui); b.setAttribute('aria-expanded', String(oui)); };
    b.addEventListener('click', function (e) { e.stopPropagation(); ouvrir(!boite.classList.contains('is-ouvert')); });
    document.addEventListener('click', function (e) { if (!boite.contains(e.target)) ouvrir(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') ouvrir(false); });
  }

  mesurerHorizontaux();
  image();
  window.__siteOk = true;
  var polices = document.fonts && document.fonts.ready ? Promise.race([document.fonts.ready, new Promise(function (r) { setTimeout(r, 1500); })]) : Promise.resolve();
  polices.then(function () { mesurerHorizontaux(); image(); intro(); });
})();
