/* Garage Mayen : tout ce qui bouge. Aucune dépendance. */
(function () {
  'use strict';
  var D = document, H = D.documentElement;
  var $ = function (s, c) { return (c || D).querySelector(s); };
  var $$ = function (s, c) { return [].slice.call((c || D).querySelectorAll(s)); };
  var CALME = D.documentElement.classList.contains('calme');
  var FIN = matchMedia('(hover:hover) and (pointer:fine)').matches;
  var borne = function (v, a, b) { return v < a ? a : v > b ? b : v; };

  /* ---------- les teintes : une seule couleur gouverne tout le site ---------- */
  var TEINTES = [
    ['rouge', 'Rouge vif', '#e23a26', '#0e1012'],
    ['orange', 'Orange cuivre', '#f0761f', '#0e1012'],
    ['jaune', 'Jaune signal', '#f4bd14', '#0e1012'],
    ['vert', 'Vert émeraude', '#1e9d66', '#0e1012'],
    ['bleu', 'Bleu roi', '#2d68ea', '#ffffff'],
    ['gris', 'Gris acier', '#98a1a9', '#0e1012']
  ];
  var couleur = function (id) { for (var i = 0; i < TEINTES.length; i++) if (TEINTES[i][0] === id) return TEINTES[i]; return null; };
  var actuelle = couleur(H.dataset.teinte) ? H.dataset.teinte : 'rouge';
  var vague = $('#vague'), nomTeinte = $('#teinte-nom'), minuterieVague = 0;
  function appliquer(id) {
    actuelle = id; H.dataset.teinte = id;
    $$('[data-teinte-id]').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.teinteId === id ? 'true' : 'false'); });
    if (nomTeinte) { nomTeinte.textContent = couleur(id)[1]; }
  }
  function teinte(id) {
    if (id === actuelle || !couleur(id)) return;
    if (CALME || !vague) { appliquer(id); return; }
    vague.style.setProperty('--vc', couleur(id)[2]);
    vague.classList.remove('part'); void vague.offsetWidth; vague.classList.add('part');
    vague.onanimationend = function () { vague.classList.remove('part'); };
    if (nomTeinte) { var p = nomTeinte.parentNode; p.classList.remove('change'); void p.offsetWidth; p.classList.add('change'); }
    clearTimeout(minuterieVague);
    minuterieVague = setTimeout(function () { appliquer(id); }, 600);
  }
  var eventail = $('#eventail'), godets = $('#godets');
  TEINTES.forEach(function (t, k) {
    [[eventail, 'pale'], [godets, 'godet']].forEach(function (c) {
      if (!c[0]) return;
      var b = D.createElement('button');
      b.type = 'button'; b.className = c[1]; b.dataset.teinteId = t[0];
      b.style.cssText = '--k:' + k + ';--c:' + t[2] + ';--cs:' + t[3];
      b.setAttribute('aria-pressed', t[0] === actuelle ? 'true' : 'false');
      if (c[1] === 'pale') { var s = D.createElement('span'); s.textContent = t[1]; b.appendChild(s); } else b.setAttribute('aria-label', t[1]);
      b.addEventListener('click', function () { teinte(t[0]); });
      c[0].appendChild(b);
    });
  });
  if (nomTeinte) nomTeinte.textContent = couleur(actuelle)[1];
  addEventListener('message', function (e) { var d = e.data; if (d && d.type === 'kazura-couleur' && couleur(d.palette)) teinte(d.palette); });
  addEventListener('load', function () { try { if (parent !== window) parent.postMessage({ type: 'kazura-pret' }, '*'); } catch (e) {} });
  addEventListener('scroll', function un() { removeEventListener('scroll', un); try { if (parent !== window) parent.postMessage({ type: 'kazura-defile' }, '*'); } catch (e) {} }, { passive: true });

  /* ---------- lettres séparées, tôle froissée ---------- */
  var FR = [[-14, .12, 10, -.03], [9, -.2, -14, .02], [-6, .16, 6, 0], [17, -.08, -9, .04], [-11, .22, 13, -.02], [5, -.15, -5, .03], [-16, .1, -12, 0], [12, -.22, 8, -.04], [-8, .18, -15, .02], [15, -.1, 11, 0], [-10, .14, -7, -.02]];
  $$('[data-lettres]').forEach(function (el) {
    var t = el.textContent.trim(), fr = el.classList.contains('froisse');
    el.setAttribute('aria-label', t); el.textContent = '';
    t.split('').forEach(function (c, i) {
      var s = D.createElement('i');
      s.textContent = c; s.dataset.l = c.toUpperCase(); s.setAttribute('aria-hidden', 'true'); s.style.setProperty('--i', i);
      if (fr) { var f = FR[i % FR.length]; s.style.setProperty('--r', f[0] + 'deg'); s.style.setProperty('--dy', f[1] + 'em'); s.style.setProperty('--sk', f[2] + 'deg'); s.style.setProperty('--dx', f[3] + 'em'); }
      el.appendChild(s);
    });
    if (fr) {
      var cogner = function (e) { var i = e.target; if (i.tagName !== 'I' || i.classList.contains('choc')) return; i.classList.add('choc'); };
      el.addEventListener('pointerover', cogner); el.addEventListener('pointerdown', cogner);
      el.addEventListener('animationend', function (e) { e.target.classList.remove('choc'); });
    }
  });
  $$('.defile-p').forEach(function (p) { var h = p.innerHTML; p.innerHTML = h + h + h + h; });

  /* ---------- typographie ajustée au pixel ---------- */
  var pont = $('#pont'), plateau = $('#plateau');
  function ajuster() {
    var vh = innerHeight;
    var els = $$('[data-fit]');
    els.forEach(function (el) { el.style.fontSize = '10px'; });
    var larg = els.map(function (el) {
      var b = el.parentNode;
      while (b && getComputedStyle(b).display === 'contents') b = b.parentNode;
      var cs = getComputedStyle(b);
      return b.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    });
    var nat = els.map(function (el) { el.style.fontSize = '100px'; var n = el.offsetWidth; el.style.fontSize = '10px'; return n; });
    els.forEach(function (el, i) {
      if (!nat[i] || larg[i] < 10) { el.style.fontSize = ''; return; }
      el.style.fontSize = Math.min(100 * larg[i] / nat[i] * .992, +el.dataset.fit * vh / 100).toFixed(1) + 'px';
    });
    if (pont && plateau) {
      var tete = parseFloat(getComputedStyle(H).getPropertyValue('--tete')) || 64, hp = plateau.offsetHeight;
      pont.style.setProperty('--hp', hp + 'px');
      pont.style.setProperty('--course', Math.max(0, vh - tete - vh * .04 - hp - vh * .06).toFixed(0) + 'px');
    }
    mesurerPos();
  }

  /* ---------- apparitions ---------- */
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('vu'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -7% 0px', threshold: .1 });
  $$('.ap:not(.cadre),.rubans,.vu-groupe,.eventail').forEach(function (e) { io.observe(e); });
  /* un cadre ferme n'a pas de surface : on guette son parent */
  var ioc = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { $$('.cadre.ap', e.target).forEach(function (c) { c.classList.add('vu'); }); ioc.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -7% 0px', threshold: .15 });
  $$('.cadre.ap').forEach(function (c) { ioc.observe(c.parentNode); });
  var nom = $('.heros-nom');
  if (nom) { nom.classList.remove('vu'); requestAnimationFrame(function () { requestAnimationFrame(function () { nom.classList.add('vu'); H.classList.add('peint'); }); }); }

  /* ---------- la boucle : barre, compteur, transitions, parallaxe ---------- */
  var entete = $('.tete'), tamb = [], tb = $('#tambours');
  if (tb) for (var k = 0; k < 4; k++) {
    var t = D.createElement('span'), b = D.createElement('b'), h = '';
    for (var n = 0; n < 11; n++) h += '<span>' + (n % 10) + '</span>';
    t.className = 'tambour'; b.innerHTML = h; t.appendChild(b); tb.appendChild(t); tamb.unshift(b);
  }
  /* fluidité (13/11) : les positions sont mesurées une fois (chargement, polices, redimensionnement, changement de hauteur
     de la page) et gardées en mémoire ; la boucle ne lit plus la mise en page, elle calcule puis écrit. */
  var trans = $$('.trans').map(function (el) { return { el: el, p: 0, aff: -1, top: 0, h: 0 }; });
  var glisse = $$('[data-px]').map(function (el) { return { el: el, cadre: el.parentNode, f: +el.dataset.px, top: 0, h: 0, aff: '' }; });
  var liens = $$('.tete nav a'), cibles = liens.map(function (a) { return $(a.getAttribute('href')); }), hautsCibles = [], navCur = -2;
  var avance = D.createElement('i'), avAff = '', tambAff = ['', '', '', ''], tambVisibles = false, maxDef = 0;
  avance.className = 'avance'; avance.setAttribute('aria-hidden', 'true'); if (entete) entete.appendChild(avance);
  var raf = 0, navT = 0;
  if (CALME) trans.forEach(function (t) { t.el.style.setProperty('--p', 1); });
  function mesurerPos() {
    var y = scrollY;
    trans.forEach(function (t) { var r = t.el.getBoundingClientRect(); t.top = r.top + y; t.h = r.height; });
    glisse.forEach(function (o) { var r = o.cadre.getBoundingClientRect(); o.top = r.top + y; o.h = r.height; });
    hautsCibles = cibles.map(function (c) { return c ? c.getBoundingClientRect().top + y : Infinity; });
    maxDef = D.scrollingElement.scrollHeight - innerHeight;
    tambVisibles = !!(tb && tb.getClientRects().length);
    reveil();
  }
  function reveil() { if (!raf) raf = requestAnimationFrame(boucle); }
  function boucle(temps) {
    raf = 0;
    var y = scrollY, vh = innerHeight, encore = false;
    var av = 'scaleX(' + (maxDef > 0 ? borne(y / maxDef, 0, 1) : 0).toFixed(4) + ')';
    if (av !== avAff) { avance.style.transform = av; avAff = av; }
    if (tamb.length && tambVisibles) {
      var v = y * .02646;
      for (var k = 0; k < 4; k++) {
        var u = Math.pow(10, k), d = Math.floor(v / u) % 10, bas = v % u, pos = k === 0 ? v % 10 : d + Math.max(0, bas - (u - 1));
        var tr = 'translateY(' + (-pos * 1.5).toFixed(3) + 'em)';
        if (tr !== tambAff[k]) { tamb[k].style.transform = tr; tambAff[k] = tr; }
      }
    }
    if (!CALME) trans.forEach(function (t) {
      var haut = t.top - y;
      if (haut + t.h < -vh || haut > vh * 2) return;
      var deb = vh * .8, fin = -(t.h - vh), c = borne((deb - haut) / (deb - fin), 0, 1), e = c - t.p;
      if (Math.abs(e) > .0008) { t.p += e * .17; encore = true; } else t.p = c;
      if (t.p !== t.aff) { t.el.style.setProperty('--p', t.p.toFixed(4)); t.aff = t.p; }
    });
    if (!CALME) glisse.forEach(function (o) {
      var haut = o.top - y;
      if (haut + o.h < 0 || haut > vh) return;
      var tr = 'translate3d(0,' + ((haut + o.h / 2 - vh / 2) / vh * o.f * -78).toFixed(2) + '%,0)';
      if (tr !== o.aff) { o.el.style.transform = tr; o.aff = tr; }
    });
    if (temps - navT > 160) {
      navT = temps; var cur = -1;
      hautsCibles.forEach(function (h, i) { if (h - y < vh * .5) cur = i; });
      if (cur !== navCur) { navCur = cur; liens.forEach(function (a, i) { a.setAttribute('aria-current', i === cur ? 'true' : 'false'); }); }
    }
    if (encore) reveil();
  }
  addEventListener('scroll', reveil, { passive: true });
  if (window.ResizeObserver) new ResizeObserver(function () { mesurerPos(); }).observe(D.body);

  /* les animations sans fin s'arrêtent hors écran et repartent juste avant d'y revenir */
  var vigie = new IntersectionObserver(function (es) {
    es.forEach(function (e) { e.target.classList.toggle('hors', !e.isIntersecting); });
  }, { rootMargin: '20% 0px 20% 0px' });
  $$('.defile,.heros,.rail-aide').forEach(function (e) { vigie.observe(e); });
  var lw = innerWidth, lh = innerHeight, rt = 0;
  addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () {
      var dw = innerWidth !== lw; if (!dw && Math.abs(innerHeight - lh) < 110) return;
      lw = innerWidth; lh = innerHeight; ajuster(); if (dw) monter(true);
    }, 140);
  });

  /* ---------- le reflet suit la souris sur la laque ---------- */
  var reflet = $('#reflet'), heros = $('#heros');
  if (reflet && FIN) {
    heros.addEventListener('pointermove', function (e) {
      var r = reflet.getBoundingClientRect();
      reflet.classList.add('main'); reflet.style.setProperty('--gx', borne((e.clientX - r.left) / r.width * 100, -30, 130).toFixed(1) + '%');
    });
    heros.addEventListener('pointerleave', function () { reflet.classList.remove('main'); reflet.style.removeProperty('--gx'); });
  }

  /* ---------- avant, après ---------- */
  var cmp = $('#compare');
  if (cmp) {
    var prise = false;
    var poser = function (pc) { pc = borne(pc, 3, 97); cmp.style.setProperty('--x', pc.toFixed(1) + '%'); cmp.setAttribute('aria-valuenow', Math.round(pc)); };
    var depuis = function (e) { var r = cmp.getBoundingClientRect(); poser((e.clientX - r.left) / r.width * 100); };
    cmp.addEventListener('pointerdown', function (e) { prise = true; cmp.classList.remove('anime'); try { cmp.setPointerCapture(e.pointerId); } catch (x) {} depuis(e); });
    cmp.addEventListener('pointermove', function (e) { if (prise) depuis(e); });
    ['pointerup', 'pointercancel'].forEach(function (n) { cmp.addEventListener(n, function () { prise = false; }); });
    cmp.addEventListener('keydown', function (e) {
      var x = parseFloat(cmp.style.getPropertyValue('--x')) || 50;
      if (e.key === 'ArrowLeft') poser(x - 6); else if (e.key === 'ArrowRight') poser(x + 6); else return;
      e.preventDefault();
    });
    new IntersectionObserver(function (es, o) {
      if (!es[0].isIntersecting) return; o.disconnect();
      cmp.classList.add('anime'); setTimeout(function () { poser(46); }, 350);
      setTimeout(function () { cmp.classList.remove('anime'); }, 2100);
    }, { threshold: .55 }).observe(cmp);
  }

  /* ---------- la cabine : on peint les lettres au pistolet ---------- */
  var cab = $('#cabine'), cv = $('#toile'), monter = function () {};
  if (cab && cv && cv.getContext) (function () {
    var ctx = cv.getContext('2d'), faire = function () { return D.createElement('canvas'); };
    var paint = faire(), pctx = paint.getContext('2d'), masque = faire(), mctx = masque.getContext('2d'), tmp = faire(), tctx = tmp.getContext('2d'), appret = faire(), actx = appret.getContext('2d');
    var petit = faire(), sctx = petit.getContext('2d', { willReadFrequently: true });
    var W = 0, Hc = 0, cases = [], couv = 0, verni = false, gl = -1, prevu = false, mesureT = 0, touche = false, R = 40, brosses = {}, dern = null;
    var etat = $('#etat'), jauge = $('#jauge'), pc = $('#pc');
    function afficher() {
      var c = verni ? 1 : couv;
      jauge.style.setProperty('--c', c.toFixed(3)); pc.textContent = Math.round(c * 100) + ' %';
      etat.textContent = verni ? 'Verni. Ça brille.' : c < .02 ? 'En apprêt' : c < .45 ? 'Première passe' : 'Encore un voile';
      etat.classList.toggle('verni', verni);
    }
    function brosse() {
      var cle = actuelle + R;
      if (brosses[cle]) return brosses[cle];
      var b = faire(), x = b.getContext('2d'), c = couleur(actuelle)[2];
      var rr = parseInt(c.slice(1, 3), 16), vv = parseInt(c.slice(3, 5), 16), bb = parseInt(c.slice(5, 7), 16), col = function (a) { return 'rgba(' + rr + ',' + vv + ',' + bb + ',' + a + ')'; };
      b.width = b.height = R * 2;
      var g = x.createRadialGradient(R, R, 0, R, R, R);
      g.addColorStop(0, col(.5)); g.addColorStop(.45, col(.3)); g.addColorStop(1, col(0));
      x.fillStyle = g; x.fillRect(0, 0, R * 2, R * 2);
      x.fillStyle = col(.35);
      for (var i = 0; i < 46; i++) { var a = i * 2.399, d = R * (.35 + .62 * ((i * 37 % 46) / 46)), s = Math.max(1, R * .03); x.fillRect(R + Math.cos(a) * d, R + Math.sin(a) * d, s, s); }
      return (brosses[cle] = b);
    }
    function dessiner() {
      prevu = false;
      ctx.clearRect(0, 0, W, Hc);
      ctx.globalAlpha = .22; ctx.drawImage(paint, 0, 0); ctx.globalAlpha = 1;
      ctx.drawImage(appret, 0, 0);
      tctx.globalCompositeOperation = 'source-over'; tctx.clearRect(0, 0, W, Hc); tctx.drawImage(paint, 0, 0);
      tctx.globalCompositeOperation = 'destination-in'; tctx.drawImage(masque, 0, 0);
      if (verni || gl >= 0) {
        tctx.globalCompositeOperation = 'source-atop';
        if (verni) { var g0 = tctx.createLinearGradient(0, Hc * .18, 0, Hc * .62); g0.addColorStop(0, 'rgba(255,255,255,.34)'); g0.addColorStop(.55, 'rgba(255,255,255,.06)'); g0.addColorStop(1, 'rgba(0,0,0,.16)'); tctx.fillStyle = g0; tctx.fillRect(0, 0, W, Hc); }
        if (gl >= 0) { var gx = gl * W * 1.7 - W * .35, g1 = tctx.createLinearGradient(gx - W * .16, 0, gx + W * .16, Hc * .35); g1.addColorStop(0, 'rgba(255,255,255,0)'); g1.addColorStop(.5, 'rgba(255,255,255,.85)'); g1.addColorStop(1, 'rgba(255,255,255,0)'); tctx.fillStyle = g1; tctx.fillRect(0, 0, W, Hc); }
      }
      ctx.drawImage(tmp, 0, 0);
    }
    function planifier() { if (!prevu) { prevu = true; requestAnimationFrame(dessiner); } }
    function mesurer() {
      if (verni || !cases.length) return;
      sctx.clearRect(0, 0, petit.width, petit.height);
      tctx.globalCompositeOperation = 'source-over'; tctx.clearRect(0, 0, W, Hc); tctx.drawImage(paint, 0, 0);
      tctx.globalCompositeOperation = 'destination-in'; tctx.drawImage(masque, 0, 0);
      sctx.drawImage(tmp, 0, 0, petit.width, petit.height);
      var d = sctx.getImageData(0, 0, petit.width, petit.height).data, n = 0;
      for (var i = 0; i < cases.length; i++) if (d[cases[i]] > 120) n++;
      couv = n / cases.length;
      if (couv >= .9) vernir(); else afficher();
    }
    function vernir() {
      verni = true;
      tctx.globalCompositeOperation = 'source-over'; tctx.clearRect(0, 0, W, Hc); tctx.fillStyle = couleur(actuelle)[2]; tctx.fillRect(0, 0, W, Hc);
      tctx.globalCompositeOperation = 'destination-in'; tctx.drawImage(masque, 0, 0);
      pctx.globalCompositeOperation = 'destination-over'; pctx.drawImage(tmp, 0, 0); pctx.globalCompositeOperation = 'source-over';
      afficher();
      var t0 = performance.now();
      (function passe(t) { gl = borne((t - t0) / 1300, 0, 1); if (gl >= 1) gl = -1; dessiner(); if (gl >= 0) requestAnimationFrame(passe); })(t0);
    }
    function trait(x0, y0, x1, y1) {
      var b = brosse(), d = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.ceil(d / (R * .26)));
      for (var i = 1; i <= n; i++) pctx.drawImage(b, x0 + (x1 - x0) * i / n - R, y0 + (y1 - y0) * i / n - R);
      planifier();
      var t = performance.now(); if (t - mesureT > 220) { mesureT = t; setTimeout(mesurer, 60); }
    }
    monter = function (force) {
      var r = cab.getBoundingClientRect(); if (r.width < 20) return;
      var dpr = Math.min(2, devicePixelRatio || 1); if (r.width * dpr > 1700) dpr = 1700 / r.width;
      var w = Math.round(r.width * dpr), hh = Math.round(r.height * dpr);
      if (!force && w === W && hh === Hc) return;
      W = w; Hc = hh; [cv, paint, masque, tmp, appret].forEach(function (c) { c.width = W; c.height = Hc; });
      R = Math.round(Math.max(W * .05, 27 * dpr)); brosses = {};
      var serre = W / Hc < 1.9, mot = 'MAYEN';
      var police = function (x, px) { x.font = '900 ' + px + 'px Archivo, "Arial Black", sans-serif'; try { x.fontStretch = serre ? 'condensed' : 'expanded'; } catch (e) {} x.textAlign = 'center'; x.textBaseline = 'alphabetic'; };
      police(mctx, 100);
      var fs = Math.min(100 * W * .9 / mctx.measureText(mot).width, Hc * .66 / .7), yb = Hc / 2 + fs * .35;
      police(mctx, fs); mctx.clearRect(0, 0, W, Hc); mctx.fillStyle = '#fff'; mctx.fillText(mot, W / 2, yb);
      police(actx, fs); actx.clearRect(0, 0, W, Hc); actx.globalCompositeOperation = 'source-over'; actx.fillStyle = '#84888c'; actx.fillText(mot, W / 2, yb);
      actx.globalCompositeOperation = 'source-atop';
      var g = actx.createLinearGradient(0, yb - fs * .72, 0, yb); g.addColorStop(0, 'rgba(255,255,255,.16)'); g.addColorStop(1, 'rgba(0,0,0,.2)'); actx.fillStyle = g; actx.fillRect(0, 0, W, Hc);
      petit.width = 150; petit.height = Math.max(24, Math.round(150 * Hc / W));
      sctx.clearRect(0, 0, petit.width, petit.height); sctx.drawImage(masque, 0, 0, petit.width, petit.height);
      var d = sctx.getImageData(0, 0, petit.width, petit.height).data; cases = [];
      for (var i = 3; i < d.length; i += 4) if (d[i] > 200) cases.push(i);
      couv = 0; verni = false; gl = -1; afficher(); dessiner();
    };
    var pos = function (e) { var r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * W / r.width, (e.clientY - r.top) * Hc / r.height]; };
    cab.addEventListener('pointerdown', function (e) { touche = true; dern = pos(e); trait(dern[0], dern[1], dern[0], dern[1]); if (e.pointerType !== 'mouse') try { cab.setPointerCapture(e.pointerId); } catch (x) {} });
    cab.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse' && !dern) return;
      var p = pos(e); touche = true; if (!dern) dern = p; trait(dern[0], dern[1], p[0], p[1]); dern = p;
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (n) { cab.addEventListener(n, function () { dern = null; }); });
    $('#poncer').addEventListener('click', function () {
      var i = 0; verni = false; gl = -1; touche = true;
      (function ponce() {
        pctx.globalCompositeOperation = 'destination-out'; pctx.fillStyle = 'rgba(0,0,0,.24)'; pctx.fillRect(0, 0, W, Hc); pctx.globalCompositeOperation = 'source-over';
        if (++i < 16) { dessiner(); requestAnimationFrame(ponce); } else { pctx.clearRect(0, 0, W, Hc); couv = 0; afficher(); dessiner(); }
      })();
    });
    /* une première passe toute seule, pour montrer le geste */
    new IntersectionObserver(function (es, o) {
      if (!es[0].isIntersecting) return; o.disconnect(); monter();
      if (CALME) return;
      setTimeout(function () {
        if (touche) return;
        var t0 = performance.now(), px = null;
        (function demo(t) {
          if (touche) return;
          var a = borne((t - t0) / 1500, 0, 1), e = a * a * (3 - 2 * a), x = W * (.08 + .5 * e), y = Hc * (.5 + .1 * Math.sin(a * 9));
          if (px) trait(px[0], px[1], x, y); px = [x, y];
          if (a < 1) requestAnimationFrame(demo);
        })(t0);
      }, 700);
    }, { threshold: .5 }).observe(cab);
  })();

  /* ---------- le rail d'affichettes ---------- */
  var rail = $('#rail');
  if (rail) {
    var sx = rail.scrollLeft, arret = 0;
    rail.addEventListener('scroll', function () {
      var v = rail.scrollLeft - sx; sx = rail.scrollLeft;
      if (!CALME) rail.style.setProperty('--v', borne(-v * .16, -3.2, 3.2).toFixed(2) + 'deg');
      clearTimeout(arret); arret = setTimeout(function () { rail.style.setProperty('--v', '0deg'); }, 110);
    }, { passive: true });
    if (FIN) {
      var tire = false, x0 = 0, s0 = 0, bouge = 0, vit = 0, inertie = 0;
      rail.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse' || e.button) return; tire = true; x0 = e.clientX; s0 = rail.scrollLeft; bouge = 0; vit = 0; cancelAnimationFrame(inertie); });
      rail.addEventListener('pointermove', function (e) {
        if (!tire) return;
        var d = e.clientX - x0; bouge = Math.max(bouge, Math.abs(d));
        if (bouge > 6 && !rail.classList.contains('tire')) { rail.classList.add('tire'); try { rail.setPointerCapture(e.pointerId); } catch (x) {} }
        var av = rail.scrollLeft; rail.scrollLeft = s0 - d; vit = vit * .6 + (rail.scrollLeft - av) * .4;
      });
      var lacher = function () {
        if (!tire) return; tire = false;
        (function glisser() { if (Math.abs(vit) < .4) { rail.classList.remove('tire'); return; } rail.scrollLeft += vit; vit *= .93; inertie = requestAnimationFrame(glisser); })();
      };
      rail.addEventListener('pointerup', lacher); rail.addEventListener('pointercancel', lacher);
      rail.addEventListener('click', function (e) { if (bouge > 6) { e.preventDefault(); e.stopPropagation(); } }, true);
      rail.addEventListener('dragstart', function (e) { e.preventDefault(); });
    }
  }

  /* ---------- le devis : on touche la carrosserie, le bon se remplit ---------- */
  var bon = $('#bon'), boiteZones = $('#zones'), zones = $$('.zone'), etiquettes = [];
  var vide = boiteZones ? boiteZones.innerHTML : '';
  function cocher(motif) { $$('input[name=motif]', bon).forEach(function (i) { if (i.value === motif) i.checked = true; }); }
  function basculer(z, i) {
    var on = z.getAttribute('aria-pressed') !== 'true';
    z.setAttribute('aria-pressed', on ? 'true' : 'false');
    if (on) {
      if (!etiquettes.filter(Boolean).length) boiteZones.innerHTML = '';
      var b = D.createElement('button');
      b.type = 'button'; b.className = 'ruban'; b.style.setProperty('--r', ((i % 2 ? 1 : -1) * (1 + (i % 3) * .7)) + 'deg');
      b.textContent = z.dataset.z; var x = D.createElement('b'); x.textContent = '×'; x.setAttribute('aria-hidden', 'true'); b.appendChild(x);
      b.setAttribute('aria-label', 'Retirer : ' + z.dataset.z);
      b.addEventListener('click', function () { basculer(z, i); });
      boiteZones.appendChild(b); etiquettes[i] = b;
      if (!$$('input[name=motif]:checked', bon).length) cocher('Carrosserie');
    } else if (etiquettes[i]) {
      etiquettes[i].remove(); etiquettes[i] = null;
      if (!etiquettes.filter(Boolean).length) boiteZones.innerHTML = vide;
    }
  }
  zones.forEach(function (z, i) {
    z.setAttribute('role', 'button'); z.setAttribute('tabindex', '0'); z.setAttribute('aria-pressed', 'false'); z.setAttribute('aria-label', z.dataset.z);
    z.addEventListener('click', function () { basculer(z, i); });
    z.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); basculer(z, i); } });
  });
  $$('a[data-motif]').forEach(function (a) { a.addEventListener('click', function () { if (bon) cocher(a.dataset.motif); }); });
  if (bon) {
    var msg = $('#bon-msg'), msg0 = msg.innerHTML, libelle = $('#envoyer span'), champTel = $('#champ-tel');
    bon.addEventListener('submit', function (e) {
      e.preventDefault();
      if (bon.classList.contains('fait')) {
        bon.reset(); zones.forEach(function (z, i) { if (z.getAttribute('aria-pressed') === 'true') basculer(z, i); });
        bon.classList.remove('fait'); libelle.textContent = 'Préparer ma demande'; msg.innerHTML = msg0; return;
      }
      if (bon.tel.value.replace(/\D/g, '').length < 9) {
        champTel.classList.remove('erreur'); void champTel.offsetWidth; champTel.classList.add('erreur');
        msg.textContent = 'Laissez un numéro, pour que le garage puisse vous rappeler.'; bon.tel.focus(); return;
      }
      champTel.classList.remove('erreur'); bon.classList.add('fait'); libelle.textContent = 'Nouvelle demande';
      msg.textContent = 'Maquette : rien n\'est envoyé. Sur le vrai site, cette demande arrive directement au garage.';
    });
  }

  /* ---------- le téléphone arrive comme un compteur ---------- */
  var tg = $('#tel-gros');
  if (tg) {
    var rang = 0, rouleaux = [];
    tg.textContent = '';
    tg.dataset.num.split(' ').forEach(function (p) {
      var s = D.createElement('span'); s.className = 'paire'; s.setAttribute('aria-hidden', 'true');
      p.split('').forEach(function (ch) {
        var t = D.createElement('span'), b = D.createElement('b'), h = '';
        for (var k = 0; k < 20; k++) h += '<span>' + (k % 10) + '</span>';
        t.className = 'tb'; b.innerHTML = h; b.style.setProperty('--i', rang++); b.dataset.n = 10 + (+ch);
        t.appendChild(b); s.appendChild(t); rouleaux.push(b);
      });
      tg.appendChild(s);
    });
    new IntersectionObserver(function (es, o) {
      if (!es[0].isIntersecting) return; o.disconnect();
      rouleaux.forEach(function (b) { b.style.transform = 'translateY(' + (-b.dataset.n * 1.18).toFixed(2) + 'em)'; });
    }, { threshold: .6 }).observe(tg);
  }

  /* ---------- menu du téléphone ---------- */
  var burger = $('#burger');
  if (burger) {
    var menu = function (o) { H.classList.toggle('menu-ouvert', o); burger.setAttribute('aria-expanded', o ? 'true' : 'false'); burger.setAttribute('aria-label', o ? 'Fermer le menu' : 'Ouvrir le menu'); };
    burger.addEventListener('click', function () { menu(!H.classList.contains('menu-ouvert')); });
    $$('#menu a').forEach(function (a) { a.addEventListener('click', function () { menu(false); }); });
    addEventListener('keydown', function (e) { if (e.key === 'Escape') menu(false); });
  }

  /* ---------- l'étiquette qui suit la souris ---------- */
  var cur = $('#curseur');
  if (cur && FIN && !CALME) D.addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'mouse') return;
    var t = e.target.closest ? e.target.closest('[data-cur]') : null;
    cur.style.setProperty('--cx', e.clientX + 'px'); cur.style.setProperty('--cy', e.clientY + 'px'); cur.style.setProperty('--cs', t ? 1 : 0); curMontre = !!t;
    if (t && cur.textContent !== t.dataset.cur) cur.textContent = t.dataset.cur;
  }, { passive: true });
  var curMontre = false;
  if (cur && FIN && !CALME) addEventListener('scroll', function () { if (curMontre) { curMontre = false; cur.style.setProperty('--cs', 0); } }, { passive: true });

  ajuster();
  if (D.fonts && D.fonts.load) D.fonts.load('900 100px Archivo').then(function () { ajuster(); monter(true); }).catch(function () {});
  if (D.fonts && D.fonts.ready) D.fonts.ready.then(ajuster);
  addEventListener('load', ajuster);
})();
