// Boulangerie de La Ferrière-Bochard : une journée de boulangerie. Aucune dépendance.
// La page ne lit jamais le réglage système des animations réduites : tout bouge toujours. Mode calme : ?calme=1.
(function () {
  'use strict';
  var C = window.CONTENU, html = document.documentElement, calme = html.classList.contains('calme');
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var borne = function (v, a, b) { return Math.max(a === undefined ? 0 : a, Math.min(b === undefined ? 1 : b, v)); };
  var alea = function (a, b) { return a + Math.random() * (b - a); };

  // ---------- teintes, page Bonjour ----------
  function palette(nom) {
    var P = C.palettes[nom]; if (!P) return;
    Object.keys(P).forEach(function (k) { html.style.setProperty('--' + k, P[k]); });
  }
  palette(new URLSearchParams(location.search).get('palette') || 'braise');
  addEventListener('message', function (e) { if (e.data && e.data.type === 'kazura-couleur') palette(e.data.palette); });
  function annoncer(t) { try { if (parent !== window) parent.postMessage({ type: t }, '*'); } catch (x) {} }
  addEventListener('scroll', function un() { removeEventListener('scroll', un); annoncer('kazura-defile'); }, { passive: true });
  addEventListener('load', function () { setTimeout(function () { annoncer('kazura-pret'); }, 200); });
  $$('[data-carte]').forEach(function (a) { a.href = C.carteLien; });

  // ---------- l'heure de Paris : ouvert ou fermé ----------
  function maintenant() {
    var p = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Paris', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(new Date()), o = {};
    p.forEach(function (x) { o[x.type] = x.value; });
    return { j: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(o.weekday), h: (+o.hour % 24) + (+o.minute) / 60 };
  }
  function heure(h) { var e = Math.floor(h + 1e-6), m = Math.round((h - e) * 60); return e + ' h' + (m ? ' ' + (m < 10 ? '0' : '') + m : ''); }
  function prochaine(n) {
    for (var d = 0; d < 8; d++) {
      var j = (n.j + d) % 7, cr = C.horaires[j] || [];
      for (var i = 0; i < cr.length; i++) if (d > 0 || cr[i][0] > n.h) return { j: j, h: cr[i][0], d: d };
    }
    return null;
  }
  function creneaux(cr) { return cr.map(function (c) { return 'de ' + heure(c[0]) + ' à ' + heure(c[1]); }).join(' et '); }
  var N = maintenant();
  (function etat() {
    var cr = C.horaires[N.j] || [], ouvert = null;
    cr.forEach(function (c) { if (N.h >= c[0] && N.h < c[1]) ouvert = c; });
    var pro = prochaine(N), quand = pro ? (pro.d === 0 ? 'tout à l’heure' : pro.d === 1 ? 'demain' : C.jours[pro.j]) : '';
    $$('[data-etat-mot]').forEach(function (b) { b.textContent = ouvert ? 'Ouvert' : 'Fermé'; });
    $$('.pancarte').forEach(function (p) { p.classList.toggle('ferme', !ouvert); });
    $$('[data-etat-court]').forEach(function (s) { s.textContent = ouvert ? 'jusqu’à ' + heure(ouvert[1]) : pro ? (pro.d === 0 ? 'ouvre à ' : 'ouvre ' + quand + ' à ') + heure(pro.h) : ''; });
    var jour = C.jours[N.j];
    $('#etat').innerHTML = '<b>Aujourd’hui ' + jour + '</b> ' + (cr.length ? 'ouvert ' + creneaux(cr) + '.' : 'fermé. Réouverture ' + quand + ' à ' + heure(pro.h) + '.');
    $('#h-dire').textContent = ouvert ? 'En ce moment, c’est ouvert, jusqu’à ' + heure(ouvert[1]) + '.'
      : pro ? 'En ce moment, le rideau est baissé. Il se relève ' + quand + ' à ' + heure(pro.h) + '.' : '';
    $('#mot-fin').textContent = pro ? 'À ' + (pro.d === 0 ? 'tout à l’heure' : pro.d === 1 ? 'demain' : quand) + ', ' + heure(pro.h) + '.' : 'À demain, 7 h.';
  })();

  // ---------- le rideau de fer de l'arrivée ----------
  var rideau = $('#rideau'), leve = false;
  function ouvrir() { html.classList.add('ouvert'); farine.ecrire(); }
  function lever() {
    if (leve) return; leve = true;
    html.classList.add('rideau-leve');
    setTimeout(ouvrir, 520);
    setTimeout(function () { html.classList.remove('rideau-baisse', 'rideau-leve'); }, 1750);
  }
  if (calme) { leve = true; }
  else {
    rideau.addEventListener('click', lever);
    rideau.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') lever(); });
    addEventListener('scroll', lever, { passive: true, once: true });
    addEventListener('wheel', lever, { passive: true, once: true });
    addEventListener('touchmove', lever, { passive: true, once: true });
    setTimeout(lever, 1500);
  }

  // ---------- la farine du plan de travail ----------
  var farine = (function () {
    var cv = $('#farine'), sec = $('#accueil'), tas = $('#tas'), ct = cv.getContext('2d');
    var W = 0, H = 0, k = 1, R = { x: 0, y: 0, w: 1, h: 1 }, der = null, mots = [C.motFarine, 'Du pain !', 'À 7 h'], iMot = 0, enCours = 0;
    function gauss() { return (Math.random() + Math.random() + Math.random()) / 3; }
    function tache(x, y, r, a) {
      var g = ct.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(250,244,230,' + a + ')'); g.addColorStop(1, 'rgba(250,244,230,0)');
      ct.fillStyle = g; ct.beginPath(); ct.arc(x, y, r, 0, 6.3); ct.fill();
    }
    function semer() {
      var s = sec.getBoundingClientRect(), t = tas.getBoundingClientRect(), i, n;
      W = s.width; H = s.height; k = Math.min(1.5, window.devicePixelRatio || 1);
      cv.width = Math.round(W * k); cv.height = Math.round(H * k); ct.setTransform(k, 0, 0, k, 0, 0);
      R = { x: t.left - s.left, y: t.top - s.top, w: t.width, h: t.height };
      ct.clearRect(0, 0, W, H); ct.globalCompositeOperation = 'source-over';
      n = Math.round(R.w * R.h / 420);
      for (i = 0; i < n; i++) { // le tas : dense au milieu, de plus en plus léger vers les bords (pas de ronds visibles)
        var gx = (gauss() - .5) * 1.38, gy = (gauss() - .5) * 1.4, loin = Math.min(1, Math.hypot(gx / .5, gy / .5));
        tache(R.x + R.w * (.52 + gx), R.y + R.h * (.5 + gy), alea(24, 60) * (1 + loin * .5), alea(.16, .34) * (1 - loin * .78));
      }
      for (i = 0; i < n / 2.5; i++) tache(R.x + R.w * (.5 + (gauss() - .5) * 1.05), R.y + R.h * (.48 + (gauss() - .5) * .95), alea(40, 90), alea(.25, .42)); // le cœur du tas, bien blanc
      for (i = 0; i < n * 1.4; i++) { // les grains, autour du tas
        ct.fillStyle = 'rgba(255,252,244,' + alea(.2, .65).toFixed(2) + ')';
        ct.fillRect(R.x + R.w * (.5 + (gauss() - .5) * 2.5), R.y + R.h * (.5 + (gauss() - .5) * 2.2), alea(1, 2.8), alea(1, 2.8));
      }
    }
    var avant = null; // le point d'avant : on recreuse le segment précédent pour que le bourrelet ne le rebouche pas
    function trait(x0, y0, x1, y1, r) {
      ct.lineCap = 'round'; ct.lineJoin = 'round';
      ct.globalCompositeOperation = 'source-over'; ct.strokeStyle = 'rgba(255,252,244,.1)'; ct.lineWidth = r * 2 + 16; // le bourrelet de farine repoussée
      ct.beginPath(); ct.moveTo(x0, y0); ct.lineTo(x1, y1); ct.stroke();
      ct.globalCompositeOperation = 'destination-out'; ct.strokeStyle = '#000'; ct.lineWidth = r * 2; ct.shadowColor = '#000'; ct.shadowBlur = 4;
      ct.beginPath(); if (avant) { ct.moveTo(avant[0], avant[1]); ct.lineTo(x0, y0); } else ct.moveTo(x0, y0); ct.lineTo(x1 + .01, y1 + .01); ct.stroke(); ct.stroke();
      ct.shadowBlur = 0; ct.globalCompositeOperation = 'source-over';
      avant = [x0, y0];
    }
    function calque(mot, taille, epais, couleur) {
      var c = document.createElement('canvas'); c.width = Math.round(R.w * k); c.height = Math.round(R.h * k);
      var x = c.getContext('2d'); x.setTransform(k, 0, 0, k, 0, 0);
      x.translate(R.w / 2, R.h * (R.w < 460 ? .55 : .47)); x.rotate(-.1); // au téléphone, le mot passe sous la pancarte
      x.font = taille + 'px "Playwrite FR Moderne", cursive'; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.lineJoin = 'round'; x.lineCap = 'round'; x.lineWidth = epais; x.strokeStyle = couleur; x.fillStyle = couleur;
      x.strokeText(mot, 0, 0); x.fillText(mot, 0, 0);
      return c;
    }
    // Le doigt écrit le mot dans la farine, de gauche à droite.
    function ecrire(direct) {
      var mot = mots[iMot % mots.length], moi = ++enCours;
      var taille = Math.min(R.h * .34, R.w / (mot.length * .58));
      (document.fonts && document.fonts.load ? document.fonts.load(Math.round(taille) + 'px "Playwrite FR Moderne"') : Promise.resolve()).then(function () {
        if (moi !== enCours) return;
        var bour = calque(mot, taille, taille * .2 + 20, 'rgba(255,252,244,.5)'), creux = calque(mot, taille, taille * .13, '#000');
        var t0 = performance.now(), duree = direct || calme ? 1 : 2100, p0 = 0;
        (function pas(t) {
          if (moi !== enCours) return;
          var p = borne((t - t0) / duree);
          ct.save(); ct.beginPath(); ct.rect(R.x + R.w * p0 - 1, R.y, R.w * (p - p0) + 2, R.h); ct.clip();
          ct.globalCompositeOperation = 'source-over'; ct.globalAlpha = .35; ct.drawImage(bour, R.x, R.y, R.w, R.h);
          ct.globalAlpha = 1; ct.globalCompositeOperation = 'destination-out'; ct.drawImage(creux, R.x, R.y, R.w, R.h);
          ct.restore(); ct.globalCompositeOperation = 'source-over';
          p0 = p; if (p < 1) requestAnimationFrame(pas);
        })(t0);
      });
    }
    function point(e) { var s = sec.getBoundingClientRect(); return [e.clientX - s.left, e.clientY - s.top]; }
    sec.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') { der = point(e); avant = null; trait(der[0], der[1], der[0], der[1], 15); } });
    sec.addEventListener('pointermove', function (e) {
      var p = point(e);
      if (der && Math.hypot(p[0] - der[0], p[1] - der[1]) < 160) trait(der[0], der[1], p[0], p[1], e.pointerType === 'mouse' ? 12 : 15); else avant = null;
      der = p;
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (n) { sec.addEventListener(n, function () { der = null; avant = null; }); });
    $('#tamis').addEventListener('click', function () {
      tas.classList.remove('tamise'); void tas.offsetWidth; tas.classList.add('tamise'); cv.classList.add('efface');
      setTimeout(function () { iMot++; enCours++; semer(); cv.classList.remove('efface'); setTimeout(function () { ecrire(); }, 500); }, 380);
    });
    var tr; addEventListener('resize', function () { clearTimeout(tr); tr = setTimeout(function () { var w = sec.getBoundingClientRect().width; if (Math.abs(w - W) > 2) { semer(); if (html.classList.contains('ouvert')) ecrire(true); } }, 200); });
    semer();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (!html.classList.contains('ouvert')) semer(); });
    return { ecrire: ecrire };
  })();
  if (calme) ouvrir();

  // ---------- le village : un pâton par mois ----------
  var mois = $('#mois'), vn = $('#v-n'), vsuite = $('#v-suite'), nMois = -1;
  mois.innerHTML = C.mois.map(function (m) { return '<li><span class="socle"><i class="pate"></i></span><b>' + m[0] + '</b><small>' + m[1] + '</small></li>'; }).join('');
  var lis = $$('li', mois);
  function majMois(p) {
    var n = calme ? lis.length : Math.round(p * (lis.length + .4));
    if (n === nMois) return; nMois = n;
    lis.forEach(function (li, i) { li.classList.toggle('la', i < n); li.classList.toggle('leve', i === lis.length - 1 && n >= lis.length); });
    vn.textContent = Math.min(15, n);
    var revenu = n >= lis.length;
    vsuite.textContent = revenu ? 'puis le four s’est rallumé.' : 'sans boulangerie.';
    vsuite.classList.toggle('revenu', revenu);
  }
  // l'appel de la mairie s'allume mot par mot
  var appel = $('#appel-mots');
  appel.innerHTML = appel.textContent.trim().split(' ').map(function (m) { return '<span>' + m + '</span>'; }).join(' ');
  var motsAppel = $$('span', appel), nAppel = -1;

  // ---------- le jeu : signez votre pain ----------
  (function jeu() {
    var svg = $('#scene-pain'), pl = $('#planche'), outil = $('#lame-outil'), dit = $('#lame-dit'), pain = $('#pain'), g = $('#grignes'), bEnf = $('#enfourner');
    var NS = 'http://www.w3.org/2000/svg';
    var FORMES = {
      boule: 'M130 210a170 160 0 1 0 340 0a170 160 0 1 0-340 0z',
      batard: 'M48 212a252 130 0 1 0 504 0a252 130 0 1 0-504 0z',
      baguette: 'M96 146h408a64 64 0 0 1 0 128h-408a64 64 0 0 1 0-128z',
    };
    var gb = document.createElementNS(NS, 'g'), gf = document.createElementNS(NS, 'g'); g.appendChild(gb); g.appendChild(gf);
    var etat = 'cru', pts = null, cur = null, n = 0, demo = false;
    function dire(t) { dit.textContent = t; }
    function versSvg(e) { var p = new DOMPoint(e.clientX, e.clientY).matrixTransform(svg.getScreenCTM().inverse()); return [p.x, p.y]; }
    function chemin(P) {
      var d = 'M' + P[0][0].toFixed(1) + ' ' + P[0][1].toFixed(1);
      if (P.length < 3) return d + 'L' + P[P.length - 1][0].toFixed(1) + ' ' + (P[P.length - 1][1] + .1).toFixed(1);
      for (var i = 1; i < P.length - 1; i++) d += 'Q' + P[i][0].toFixed(1) + ' ' + P[i][1].toFixed(1) + ' ' + ((P[i][0] + P[i + 1][0]) / 2).toFixed(1) + ' ' + ((P[i][1] + P[i + 1][1]) / 2).toFixed(1);
      return d + 'L' + P[P.length - 1][0].toFixed(1) + ' ' + P[P.length - 1][1].toFixed(1);
    }
    function nouvelle() {
      var a = document.createElementNS(NS, 'path'), b = document.createElementNS(NS, 'path');
      a.setAttribute('class', 'grigne-bord'); b.setAttribute('class', 'grigne-fond'); gb.appendChild(a); gf.appendChild(b); return [a, b];
    }
    function tracer(c, P) { var d = chemin(P); c[0].setAttribute('d', d); c[1].setAttribute('d', d); }
    function placer(p, a) { outil.setAttribute('transform', 'translate(' + p[0].toFixed(1) + ' ' + p[1].toFixed(1) + ') rotate(' + (a || 30) + ')'); }
    function longueur(P) { var l = 0; for (var i = 1; i < P.length; i++) l += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); return l; }
    function compte() {
      dire(n === 0 ? 'Tracez une grigne sur la pâte.' : n === 1 ? 'Une grigne. Encore une, ou enfournez.' : n + ' grignes. Quand c’est signé, enfournez.');
    }
    function vider() { gb.innerHTML = ''; gf.innerHTML = ''; n = 0; }
    function cru() { etat = 'cru'; pl.classList.remove('au-four', 'cuit'); bEnf.textContent = 'Enfourner'; }
    svg.addEventListener('pointerdown', function (e) {
      if (etat !== 'cru') return;
      if (n >= 8) { dire('Huit grignes, c’est déjà une belle signature. Enfournez !'); return; }
      e.preventDefault(); try { svg.setPointerCapture(e.pointerId); } catch (x) {}
      pts = [versSvg(e)]; cur = nouvelle(); pl.classList.add('coupe'); placer(pts[0]);
    });
    svg.addEventListener('pointermove', function (e) {
      if (!pts) return;
      var p = versSvg(e), d = pts[pts.length - 1];
      if (Math.hypot(p[0] - d[0], p[1] - d[1]) > 5) { pts.push(p); tracer(cur, pts); }
      placer(p);
    });
    function fini() {
      if (!pts) return;
      pl.classList.remove('coupe');
      if (longueur(pts) < 24) { cur[0].remove(); cur[1].remove(); } else { n++; compte(); }
      pts = null; cur = null;
    }
    svg.addEventListener('pointerup', fini); svg.addEventListener('pointercancel', fini);
    // La lame montre le geste une fois, toute seule.
    function montrer(apres) {
      var A = [205, 300], M = [270, 190], B = [395, 128], c = nouvelle(), P = [], t0 = performance.now();
      pl.classList.add('coupe');
      (function pas(t) {
        var p = borne((t - t0) / 1000), q = p * p * (3 - 2 * p), u = 1 - q;
        var pt = [u * u * A[0] + 2 * u * q * M[0] + q * q * B[0], u * u * A[1] + 2 * u * q * M[1] + q * q * B[1]];
        P.push(pt); tracer(c, P); placer(pt);
        if (p < 1 && etat === 'cru') requestAnimationFrame(pas);
        else { pl.classList.remove('coupe'); n++; if (apres) apres(); }
      })(t0);
    }
    new IntersectionObserver(function (es, io) {
      if (!es[0].isIntersecting || demo) return; demo = true; io.disconnect();
      if (n === 0 && !calme) setTimeout(function () { if (n === 0 && etat === 'cru' && !pts) montrer(function () { dire('Voilà une grigne. À vous : tracez les vôtres, puis enfournez.'); }); }, 700);
    }, { threshold: .55 }).observe(pl);
    function enfourner() {
      etat = 'four'; pl.classList.add('au-four'); dire('Au four. La croûte dore, les grignes s’ouvrent.');
      setTimeout(function () {
        if (etat !== 'four') return;
        etat = 'cuit'; pl.classList.remove('au-four'); pl.classList.add('cuit'); bEnf.textContent = 'Un autre pain';
        dire('Sorti du four : votre pain est signé. La grigne de la maison, elle, sera ici en photo.');
      }, calme ? 300 : 3500);
    }
    bEnf.addEventListener('click', function () {
      if (etat === 'four') return;
      if (etat === 'cuit') { vider(); cru(); pain.classList.remove('change'); void pain.getBoundingClientRect(); pain.classList.add('change'); compte(); return; }
      if (n === 0) { montrer(enfourner); return; }
      enfourner();
    });
    $('#effacer').addEventListener('click', function () { if (etat === 'four') return; vider(); cru(); compte(); });
    $$('.forme').forEach(function (b) {
      b.addEventListener('click', function () {
        if (etat === 'four') return;
        $$('.forme').forEach(function (x) { x.classList.toggle('actif', x === b); });
        var d = FORMES[b.dataset.forme];
        ['#forme-cru', '#forme-cuit', '#forme-clip'].forEach(function (s) { $(s).setAttribute('d', d); });
        $('.pain-ombre').setAttribute('rx', b.dataset.forme === 'boule' ? 210 : 270);
        vider(); cru(); compte();
        pain.classList.remove('change'); void pain.getBoundingClientRect(); pain.classList.add('change');
      });
    });
  })();

  // ---------- dans le sac : les pointillés à remplir ----------
  $$('.rayon input').forEach(function (inp) {
    inp.addEventListener('input', function () {
      var l = $('.sachet-ligne[data-ligne="' + inp.dataset.rayon + '"]'), v = inp.value.trim();
      if (v) l.textContent = v; else l.innerHTML = '<span class="pt">........................</span>';
      l.classList.remove('ecrit'); void l.offsetWidth; l.classList.add('ecrit');
    });
  });

  // ---------- l'étagère des horaires ----------
  (function semaine() {
    var ordre = [1, 2, 3, 4, 5, 6, 0], h = '', i = 0;
    ordre.forEach(function (j) {
      var cr = C.horaires[j] || [], nom = C.jours[j].charAt(0).toUpperCase() + C.jours[j].slice(1), auj = j === N.j;
      h += '<div class="jour' + (auj ? ' auj' : '') + '"><p class="jour-nom"><b>' + nom + '</b><small>' + (cr.length ? cr.map(function (c) { return heure(c[0]) + ' à ' + heure(c[1]); }).join(', ') : 'Fermé') + (auj ? ' (aujourd’hui)' : '') + '</small></p><div class="piste">';
      if (!cr.length) h += '<span class="torchon">Repos</span>';
      cr.forEach(function (c) { h += '<i class="bag" style="--a:' + ((c[0] - 7) / 12 * 100).toFixed(2) + ';--l:' + ((c[1] - c[0]) / 12 * 100).toFixed(2) + ';--i:' + (i++) + '" title="' + heure(c[0]) + ' à ' + heure(c[1]) + '"></i>'; });
      if (auj && N.h >= 7 && N.h <= 19) h += '<span class="aiguille" style="--t:' + ((N.h - 7) / 12 * 100).toFixed(2) + '"><span>Il est ' + heure(Math.floor(N.h * 60) / 60) + '</span></span>';
      h += '</div></div>';
    });
    $('#semaine').innerHTML = h;
  })();

  // ---------- un pain mis de côté ----------
  (function reserve() {
    var f = $('#reserve'), nom = $('#r-nom'), quoi = $('#r-quoi'), sacN = $('#sac-nom'), main = $('#sac-nom-main'), detail = $('#sac-nom-detail'), note = $('#reserve-note'), quand = 'demain matin';
    function maj() { main.textContent = nom.value.trim() || 'Votre nom'; detail.textContent = (quoi.value.trim() ? quoi.value.trim() + ', ' : '') + 'pour ' + quand; sacN.classList.remove('plie'); }
    nom.addEventListener('input', maj); quoi.addEventListener('input', maj);
    $$('.choix', f).forEach(function (b) { b.addEventListener('click', function () { $$('.choix', f).forEach(function (x) { x.classList.toggle('actif', x === b); }); quand = b.dataset.quand; maj(); }); });
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!nom.value.trim()) { nom.classList.remove('secoue'); void nom.offsetWidth; nom.classList.add('secoue'); nom.focus(); return; }
      sacN.classList.add('plie');
      note.textContent = 'Sac au nom de ' + nom.value.trim() + ', pour ' + quand + ' : c’est plié. Rien n’est envoyé, c’est une démonstration. Sur le vrai site, la demande arrive à la boulangerie.';
    });
  })();

  // le rideau de la fin se relève un instant quand on le touche
  $('#vitrine').addEventListener('click', function () { var v = this; if (v.classList.contains('releve')) return; v.classList.add('releve'); setTimeout(function () { v.classList.remove('releve'); }, 2600); });

  // ---------- le menu du téléphone ----------
  var menu = $('#menu'), bMenu = $('#menu-bouton');
  $$('a', menu).forEach(function (a, i) { a.style.setProperty('--i', i); a.addEventListener('click', function () { fermer(); }); });
  function fermer() { menu.hidden = true; bMenu.setAttribute('aria-expanded', 'false'); bMenu.textContent = 'Menu'; }
  bMenu.addEventListener('click', function () {
    if (menu.hidden) { menu.hidden = false; bMenu.setAttribute('aria-expanded', 'true'); bMenu.textContent = 'Fermer'; } else fermer();
  });
  addEventListener('keydown', function (e) { if (e.key === 'Escape') fermer(); });

  // ---------- les entrées ----------
  ['.v-tete', '.v-planche', '.eglise', '.appel', '.f-tete', '.f-suite', '.lame-texte', '.planche', '.sac-tete', '.sachet', '.h-tete', '.v-adresse>h2', '.adresse', '.reserve', '.pages', '.vitrine'].forEach(function (s) {
    $$(s).forEach(function (el) { el.setAttribute('data-entre', ''); });
  });
  $$('.v-faits p').forEach(function (p, i) { p.setAttribute('data-entre', ''); p.style.setProperty('--d', i + 1); });
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (x) {
      if (!x.isIntersecting) return;
      x.target.classList.add('vu'); io.unobserve(x.target);
      $$('[data-compte]', x.target).forEach(compter);
    });
  }, { threshold: .18, rootMargin: '0px 0px -6% 0px' });
  $$('[data-entre], #affiches, #gestes, .f-photos, #etal, #etagere, #panneau, .v-faits').forEach(function (el) { io.observe(el); });
  function compter(b) {
    var but = +b.dataset.compte, t0 = performance.now(), d = but > 50 ? 1400 : 500;
    if (calme || b.dataset.fait) return; b.dataset.fait = 1;
    (function pas(t) { var p = borne((t - t0) / d); b.textContent = Math.round(but * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(pas); })(t0);
  }

  // ---------- ce qui suit le défilement ----------
  var sections = $$('main section'), liens = $$('.liens a'), astre = $('#astre'), moment = $('#moment'), eglise = $('#eglise'), vitrine = $('#vitrine'), fPhotos = $$('.f-photo');
  var JOUR = { accueil: 0, village: .12, fournil: .55, lame: .9, sac: 1, horaires: 1, venir: .55, fin: 0 }, secCourante = '';
  var enAttente = false;
  function maj() {
    enAttente = false;
    var vh = innerHeight, milieu = vh * .45, courante = sections[0], r, p;
    sections.forEach(function (s) { if (s.getBoundingClientRect().top <= milieu) courante = s; });
    if (courante.id !== secCourante) {
      secCourante = courante.id;
      astre.style.setProperty('--j', JOUR[secCourante]);
      moment.textContent = courante.dataset.moment;
      liens.forEach(function (a) { a.classList.toggle('actif', a.getAttribute('href') === '#' + secCourante); });
    }
    astre.style.setProperty('--tour', (scrollY / 9).toFixed(1) + 'deg');
    if (!calme) html.style.setProperty('--gl', (scrollY * .12).toFixed(1) + 'px');
    r = mois.getBoundingClientRect(); majMois(borne((vh * .9 - r.top) / (vh * .55)));
    r = eglise.getBoundingClientRect(); p = borne((vh - r.top) / (vh + r.height));
    eglise.style.setProperty('--sol', borne(p * 2.1 - .25).toFixed(3)); eglise.style.setProperty('--pa', p.toFixed(3));
    r = appel.getBoundingClientRect(); p = calme ? motsAppel.length : Math.round(borne((vh * .88 - r.top) / (vh * .5)) * motsAppel.length);
    if (p !== nAppel) { nAppel = p; motsAppel.forEach(function (s, i) { s.classList.toggle('on', i < p); }); }
    r = vitrine.getBoundingClientRect(); vitrine.style.setProperty('--b', calme ? 1 : borne((vh * .98 - r.top) / (vh * .6)).toFixed(3));
    if (!calme) fPhotos.forEach(function (f, i) { var q = f.getBoundingClientRect(); f.style.translate = '0 ' + (((q.top + q.height / 2 - vh / 2) / vh) * (i ? 34 : -34)).toFixed(1) + 'px'; });
  }
  function demander() { if (!enAttente) { enAttente = true; requestAnimationFrame(maj); } }
  addEventListener('scroll', demander, { passive: true }); addEventListener('resize', demander);
  maj();
})();
