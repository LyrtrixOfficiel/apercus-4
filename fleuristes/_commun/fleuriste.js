/* Famille « fleuriste » : un seul script pour toutes les maquettes. Script classique (pas de module) pour que la page
   s'ouvre aussi depuis le disque. Un seul requestAnimationFrame pilote le defilement doux (Lenis), le glissement des
   photos dans leurs cadres et la tige de progression. Le reglage systeme « mouvements reduits » n'est jamais lu ;
   ?calme=1 coupe le mouvement automatique. Les donnees de la boutique sont dans window.BOUTIQUE (ecrites par le generateur). */
(function () {
  'use strict';
  var H = document.documentElement;
  var B = window.BOUTIQUE || {};
  var calme = H.classList.contains('calme');
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- defilement doux ---------- */
  var lenis = null;
  if (!calme && window.Lenis) lenis = new window.Lenis({ duration: 1.15, smoothWheel: true, wheelMultiplier: 0.95, touchMultiplier: 1.15 });
  function enHaut() { if (lenis) lenis.scrollTo(0, { immediate: true }); else window.scrollTo(0, 0); }

  /* ---------- bonjour : le rideau se leve ---------- */
  var bj = $('#bonjour');
  function ouvrir() {
    if (H.classList.contains('ouvert')) return;
    H.classList.add('ouvert');
    if (bj && H.classList.contains('bonjour-actif')) {
      bj.classList.add('leve');
      setTimeout(function () { bj.classList.add('fini'); if (lenis) lenis.start(); }, 1400);
    }
    observer();
  }
  if (H.classList.contains('bonjour-actif') && !calme) {
    if (lenis) lenis.stop();
    var pret = document.fonts ? document.fonts.ready : Promise.resolve();
    var t0 = performance.now();
    pret.then(function () { setTimeout(ouvrir, Math.max(0, 2300 - (performance.now() - t0))); });
    setTimeout(ouvrir, 3600);
    if (bj) bj.addEventListener('pointerdown', ouvrir);
  } else {
    requestAnimationFrame(function () { requestAnimationFrame(ouvrir); });
  }

  /* ---------- titres mot a mot ---------- */
  $$('.mots').forEach(function (el) {
    if (el.dataset.fait) return;
    el.dataset.fait = 1;
    var parts = [];
    el.childNodes.forEach(function (n) {
      if (n.nodeType === 3) {
        n.textContent.split(/(\s+)/).forEach(function (w) { parts.push(/^\s+$/.test(w) || !w ? document.createTextNode(w) : mot(document.createTextNode(w))); });
      } else if (n.nodeType === 1) {
        if (n.tagName === 'BR') { parts.push(n.cloneNode()); return; }
        var t = n.textContent.split(/(\s+)/);
        t.forEach(function (w) {
          if (/^\s+$/.test(w) || !w) { parts.push(document.createTextNode(w)); return; }
          var c = n.cloneNode(false); c.textContent = w; parts.push(mot(c));
        });
      }
    });
    el.textContent = '';
    parts.forEach(function (p) { el.appendChild(p); });
    $$('.m > span', el).forEach(function (s, i) { s.style.transitionDelay = (i * 0.06) + 's'; });
  });
  function mot(n) { var m = document.createElement('span'); m.className = 'm'; var s = document.createElement('span'); s.appendChild(n); m.appendChild(s); return m; }

  /* ---------- ce qui apparait au defilement ----------
     Teste a chaque image dans la boucle (pas d'IntersectionObserver : avec le defilement doux et les sauts de page,
     il ratait des elements). Un element apparait des que son haut passe sous 92 % de la hauteur de l'ecran. */
  var aVoir = [];
  function observer() {
    aVoir = $$('.page.active .monte:not(.vu), .page.active .cadre:not(.vu), .page.active .mots:not(.vu), .pied .monte:not(.vu)');
    if (calme) { aVoir.forEach(function (el) { el.classList.add('vu'); }); aVoir = []; }
  }
  function reveler(vh) {
    if (!aVoir.length || !H.classList.contains('ouvert')) return;
    var garde = [];
    for (var i = 0; i < aVoir.length; i++) {
      var r = aVoir[i].getBoundingClientRect();
      if (r.top < vh * 0.92) aVoir[i].classList.add('vu');
      else garde.push(aVoir[i]);
    }
    aVoir = garde;
  }

  /* ---------- pages : un rideau de couleur passe d'une page a l'autre ---------- */
  var voile = $('#voile');
  var pages = $$('.page').map(function (p) { return p.dataset.page; });
  function montrer(id, anime) {
    if (pages.indexOf(id) < 0) id = 'accueil';
    var faire = function () {
      $$('.page').forEach(function (p) { p.classList.toggle('active', p.dataset.page === id); });
      $$('a[data-lien]').forEach(function (a) { if (a.dataset.lien === id) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
      document.title = (id === 'accueil' ? '' : (($('.page.active h1') || {}).textContent || '').replace(/\s+/g, ' ').trim() + ' · ') + B.titre;
      enHaut();
      if (lenis) lenis.resize();
      observer();
      tete();
    };
    if (!anime || calme || !voile) { faire(); return; }
    voile.className = 'voile monte';
    setTimeout(function () {
      faire();
      voile.className = 'voile part';
      setTimeout(function () { voile.className = 'voile'; }, 650);
    }, 560);
  }
  function lirePage() { return (location.hash || '#accueil').slice(1).split('?')[0] || 'accueil'; }
  window.addEventListener('hashchange', function () {
    var id = lirePage();
    if (pages.indexOf(id) >= 0) { fermerMenu(); montrer(id, true); }
  });
  montrer(lirePage(), false);

  /* ---------- menu du telephone ---------- */
  var menu = $('#menu'), bMenu = $('#bt-menu');
  function fermerMenu() { if (!menu) return; menu.classList.remove('ouvert'); menu.setAttribute('aria-hidden', 'true'); if (lenis && H.classList.contains('ouvert')) lenis.start(); }
  if (bMenu) bMenu.addEventListener('click', function () { menu.classList.add('ouvert'); menu.setAttribute('aria-hidden', 'false'); if (lenis) lenis.stop(); });
  if ($('#fermer-menu')) $('#fermer-menu').addEventListener('click', fermerMenu);

  /* ---------- la tete : sur la photo, puis pleine ---------- */
  var eTete = $('#tete');
  function tete() {
    if (!eTete) return;
    var y = window.scrollY;
    var page = lirePage();
    var surPhoto = page === 'accueil' && H.classList.contains('disp-a');
    eTete.classList.toggle('sur-photo', surPhoto);
    eTete.classList.toggle('pleine', y > 40 || !surPhoto);
  }

  /* ---------- un seul rAF : Lenis, photos qui glissent, tige ---------- */
  var tigeEl = $('#tige');
  function boucle(t) {
    if (lenis) lenis.raf(t);
    var vh = window.innerHeight;
    reveler(vh);
    if (!calme) {
      $$('.page.active .cadre img, .page.active .porte img').forEach(function (img) {
        var r = img.parentNode.getBoundingClientRect();
        if (r.bottom < -50 || r.top > vh + 50) return;
        var p = (r.top + r.height / 2 - vh / 2) / (vh + r.height);
        img.style.transform = 'translate3d(0,' + (p * -14).toFixed(2) + '%,0)';
      });
    }
    var max = document.documentElement.scrollHeight - vh;
    if (tigeEl) tigeEl.style.setProperty('--p', max > 0 ? Math.min(1, window.scrollY / max).toFixed(4) : 0);
    tete();
    requestAnimationFrame(boucle);
  }
  requestAnimationFrame(boucle);

  /* ---------- occasions : la photo s'ouvre de droite a gauche ---------- */
  $$('[data-occasions]').forEach(function (z) {
    var bts = $$('.occ-choix button', z), ps = $$('.occ-p', z), mots = $$('.occ-t', z);
    bts.forEach(function (b, i) {
      b.addEventListener('click', function () {
        if (b.classList.contains('on')) return;
        var avant = ps.filter(function (p) { return p.classList.contains('on'); })[0];
        ps.forEach(function (p) { p.classList.remove('avant'); });
        if (avant) { avant.classList.remove('on'); avant.classList.add('avant'); }
        ps[i].classList.add('on');
        bts.forEach(function (x) { x.classList.toggle('on', x === b); });
        mots.forEach(function (m, k) { m.hidden = k !== i; });
      });
    });
  });

  /* ---------- en ce moment : la saison du jour ---------- */
  var MOIS = B.mois || {};
  var m = new Date().getMonth() + 1;
  $$('[data-mois-liste]').forEach(function (ul) {
    var l = MOIS[m];
    if (!l) return;
    ul.innerHTML = '';
    l.forEach(function (f) { var li = document.createElement('li'); li.textContent = f; ul.appendChild(li); });
  });
  $$('[data-mois-nom]').forEach(function (el) {
    el.textContent = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'][m - 1];
  });

  /* ---------- horaires : ouvert maintenant ? ---------- */
  var HOR = B.horaires; // {1:[[9,12.5],[14,19]], ...} 0 = dimanche
  function hFmt(h) { var hh = Math.floor(h), mm = Math.round((h - hh) * 60); return hh + ' h' + (mm ? (mm < 10 ? '0' : '') + mm : ''); }
  function etat() {
    var d = new Date(), j = d.getDay(), h = d.getHours() + d.getMinutes() / 60;
    $$('.hor li').forEach(function (li) { li.classList.toggle('auj', +li.dataset.j === j); });
    var els = $$('[data-etat]');
    if (!HOR || !els.length) return;
    var auj = HOR[j] || [];
    var dedans = auj.filter(function (p) { return h >= p[0] && h < p[1]; })[0];
    var txt, cls;
    if (dedans) { txt = 'Ouvert maintenant, jusqu’à ' + hFmt(dedans[1]); cls = 'ouvert-m'; }
    else {
      var suite = auj.filter(function (p) { return p[0] > h; })[0], jour = '';
      if (!suite) for (var k = 1; k < 8; k++) { var jj = (j + k) % 7; if ((HOR[jj] || []).length) { suite = HOR[jj][0]; jour = k === 1 ? 'demain ' : ['dimanche ', 'lundi ', 'mardi ', 'mercredi ', 'jeudi ', 'vendredi ', 'samedi '][jj]; break; } }
      txt = suite ? 'Fermé pour l’instant, ouvre ' + jour + 'à ' + hFmt(suite[0]) : 'Fermé';
      cls = 'ferme-m';
    }
    els.forEach(function (e) { e.className = 'etat ' + cls; e.innerHTML = '<i></i>' + txt; });
  }
  etat(); setInterval(etat, 60000);

  /* ---------- composer sa demande ---------- */
  var comp = $('#comp');
  if (comp) {
    var choix = { occasion: '', couleurs: [], budget: '', quand: '' };
    $$('.puces', comp).forEach(function (g) {
      var multi = g.dataset.multi === '1', cle = g.dataset.cle;
      $$('button', g).forEach(function (b) {
        b.addEventListener('click', function () {
          if (multi) { b.classList.toggle('on'); choix[cle] = $$('button.on', g).map(function (x) { return x.dataset.v; }); }
          else { $$('button', g).forEach(function (x) { x.classList.toggle('on', x === b); }); choix[cle] = b.dataset.v; }
          ecrire();
        });
      });
    });
    var motCarte = $('#comp-mot');
    if (motCarte) motCarte.addEventListener('input', ecrire);
    function ecrire() {
      var t = 'Bonjour, je voudrais ' + (choix.occasion ? 'un bouquet ' + choix.occasion : 'un bouquet');
      if (choix.couleurs.length) t += ', plutôt ' + choix.couleurs.join(' et ');
      if (choix.budget) t += ', ' + choix.budget;
      if (choix.quand) t += ', ' + choix.quand;
      t += '.';
      if (motCarte && motCarte.value.trim()) t += ' Sur la carte : « ' + motCarte.value.trim() + ' ».';
      $('#comp-texte').textContent = t;
      var sms = $('#comp-sms');
      if (sms && B.mobile) sms.href = 'sms:' + B.mobile + '?&body=' + encodeURIComponent(t);
    }
    ecrire();
  }
})();
