// Primeur des 4 Saisons : la roue des saisons fait changer tout le site.
// Le réglage système « moins de mouvement » n'est jamais lu. Mode calme seulement avec ?calme=1.
(function () {
  'use strict';
  var H = document.documentElement, C = window.CONTENU, fruit = window.fruit, FR = window.FRUITS, emballe = window.emballe;
  var calme = H.classList.contains('calme');
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var S = C.saisons, P = C.produits, PID = {}, SID = {};
  P.forEach(function (p) { PID[p.id] = p; });
  S.forEach(function (s, i) { s.i = i; SID[s.id] = s; });
  var JM = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  var JOURS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  var FORT = { printemps: '#1e5c3a', ete: '#0e5aa0', automne: '#4a1b3e', hiver: '#13304f' };
  var rejouer = function (el, cls) { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };

  // ---------- Dates et saisons ----------
  function angleDe(m, j) { return (m + (j - 1) / JM[m]) * 30; }
  function norm(a) { return ((a % 360) + 360) % 360; }
  function dateDe(a) { a = norm(a); var m = Math.min(11, Math.floor(a / 30)); return { m: m, j: Math.min(JM[m], Math.floor((a - m * 30) / 30 * JM[m]) + 1) }; }
  function saisonDe(m, j) { var v = m * 100 + j; return (v < 220 || v >= 1121) ? 'hiver' : v < 521 ? 'printemps' : v < 822 ? 'ete' : 'automne'; }
  function dans(p, m) { return p.de <= p.a ? (m >= p.de && m <= p.a) : (m >= p.de || m <= p.a); }
  function elide(mot) { return (/^[aeiouéèâh]/i.test(mot) ? 'd’' : 'de ') + mot; }
  function moisCourt(p) { return elide(C.moisCourts[p.de]) + ' à ' + C.moisCourts[p.a]; }
  function moisLong(p) { return elide(C.mois[p.de]) + ' à ' + C.mois[p.a]; }
  var AUJ = new Date(), A0 = angleDe(AUJ.getMonth(), AUJ.getDate());
  var forcee = /[?&](?:palette|saison)=(printemps|ete|automne|hiver)/.exec(location.search);
  var angle = forcee ? angleDe(SID[forcee[1]].milieu[0], SID[forcee[1]].milieu[1]) : A0;
  var saison = null, moisIci = -1, cleDate = '', intro = true;

  // ---------- Textes venus de contenu.js ----------
  $('#nom-a').textContent = C.nom[0];
  $('#nom-b').innerHTML = C.nom[1].split(' ').map(function (mot, k, tous) {
    var avant = tous.slice(0, k).join('').length;
    return mot.split('').map(function (l, i) { return '<span class="l" style="--i:' + (avant + i) + '">' + l + '</span>'; }).join('');
  }).join(' ');
  $('#mystere').innerHTML = emballe('var(--a)') + emballe('var(--fort)') + emballe('var(--b)');
  $$('.jc').forEach(function (jc) { $('.jc-embleme', jc).innerHTML = fruit(SID[jc.dataset.s].fruit); });
  $('#tel').textContent = C.telephone; $('#depuis').textContent = C.depuis; $('#itineraire').href = C.carteLien;

  // ---------- La roue ----------
  var roue = $('#roue'), disque = $('#disque');
  function pol(a, r) { var t = (a - 90) * Math.PI / 180; return (r * Math.cos(t)).toFixed(2) + ' ' + (r * Math.sin(t)).toFixed(2); }
  function anneau(a1, a2, r1, r2) {
    var g = (a2 - a1) > 180 ? 1 : 0;
    return 'M' + pol(a1, r2) + 'A' + r2 + ' ' + r2 + ' 0 ' + g + ' 1 ' + pol(a2, r2) + 'L' + pol(a2, r1) + 'A' + r1 + ' ' + r1 + ' 0 ' + g + ' 0 ' + pol(a1, r1) + 'z';
  }
  (function construireRoue() {
    var s = '<svg viewBox="-300 -300 600 600" aria-hidden="true" focusable="false"><circle r="300" fill="#231b16"/>';
    for (var m = 0; m < 12; m++) {
      if (m % 2) s += '<path d="' + anneau(m * 30, m * 30 + 30, 258, 300) + '" fill="#34281f"/>';
      s += '<text class="r-mois" text-anchor="middle" transform="rotate(' + (m * 30 + 15) + ') translate(0 -271)">' + C.moisRoue[m] + '</text>';
    }
    S.forEach(function (sa, i) {
      var a1 = angleDe(sa.debut[0], sa.debut[1]), nx = S[(i + 1) % 4], a2 = angleDe(nx.debut[0], nx.debut[1]); if (a2 < a1) a2 += 360;
      s += '<path d="' + anneau(a1, a2, 84, 258) + '" fill="' + sa.clair + '"/><path d="' + anneau(a1, a2, 84, 122) + '" fill="' + sa.vif + '"/>';
      var nom = sa.nom.toUpperCase(), pas = 7.6, a0 = (a1 + a2) / 2 - pas * (nom.length - 1) / 2;
      nom.split('').forEach(function (l, k) { s += '<text class="r-saison" text-anchor="middle" transform="rotate(' + (a0 + k * pas).toFixed(2) + ') translate(0 -96)">' + l + '</text>'; });
    });
    for (m = 0; m < 12; m++) if (m % 2) s += '<path d="' + anneau(m * 30, m * 30 + 30, 122, 258) + '" fill="#fff" opacity=".2"/>';
    S.forEach(function (sa) { var a = angleDe(sa.debut[0], sa.debut[1]); s += '<path d="M' + pol(a, 84) + 'L' + pol(a, 259) + '" stroke="#231b16" stroke-width="6"/>'; });
    var vus = {};
    P.forEach(function (p) {
      var dehors = !vus[p.pic]; vus[p.pic] = 1;
      var r = dehors ? 219 : 157, t = dehors ? 68 : 52;
      s += '<g transform="rotate(' + (p.pic * 30 + 15) + ') translate(0 ' + (-r) + ')"><g class="ic" data-m="' + p.pic + '"><svg x="' + (-t / 2) + '" y="' + (-t / 2) + '" width="' + t + '" height="' + t + '" viewBox="0 0 64 64" overflow="visible">' + FR[p.id] + '</svg></g></g>';
    });
    disque.innerHTML = s + '<circle r="84" fill="#231b16"/></svg>';
  })();

  function majDate(d, auj) {
    var k = d.j <= 10 ? 0 : d.j <= 20 ? 1 : 2;
    $('#p-date').textContent = auj ? AUJ.getDate() + ' ' + C.moisRoue[d.m] : ['DÉBUT ', 'MI-', 'FIN '][k] + C.moisRoue[d.m];
    $('#p-sous').textContent = auj ? 'aujourd’hui' : SID[saison].nom;
    $('#quand').textContent = auj ? JOURS[AUJ.getDay()] + ' ' + AUJ.getDate() + (AUJ.getDate() === 1 ? 'er ' : ' ') + C.mois[d.m] : ['Début ', 'Mi-', 'Fin '][k] + C.mois[d.m];
    $('#an-jour').setAttribute('aria-pressed', String(auj));
    roue.setAttribute('aria-valuetext', $('#quand').textContent + ', ' + SID[saison].nom);
  }
  function majMois() {
    $$('.ic', disque).forEach(function (g) { g.classList.toggle('haut', +g.dataset.m === moisIci); });
    $$('.cal-ici').forEach(function (e) { e.style.setProperty('--m', moisIci); });
    $$('.cm').forEach(function (b) { b.classList.toggle('ici', +b.dataset.m === moisIci); });
    $$('.mot[data-mot=moisnom]').forEach(function (e) { e.textContent = 'en ' + C.mois[moisIci]; });
    trier();
  }
  var miniTour = 0, garnirN = 0, pluieT = 0;
  // À chaque changement de saison, ses fruits tombent en pluie sur tout l'écran (jamais au chargement).
  function pluie(s) {
    var t = performance.now(); if (calme || t - pluieT < 900) return; pluieT = t;
    var ids = ids0(SID[s]), z = document.createElement('div'), n = innerWidth < 700 ? 9 : 16, fini = 0; z.className = 'pluie';
    for (var i = 0; i < n; i++) z.insertAdjacentHTML('beforeend', fruit(ids[i % ids.length]));
    document.body.appendChild(z);
    $$('.fr', z).forEach(function (f, i) {
      var x = (i + .15 + Math.random() * .7) / n * innerWidth - 26, r = (Math.random() - .5) * 700;
      f.animate([{ transform: 'translate(' + x + 'px,-80px) rotate(0deg)' }, { transform: 'translate(' + (x + (Math.random() - .5) * 120) + 'px,' + (innerHeight + 80) + 'px) rotate(' + r + 'deg)' }],
        { duration: 1000 + Math.random() * 700, delay: Math.random() * 350, easing: 'cubic-bezier(.45,0,.9,.6)', fill: 'both' }).onfinish = function () { if (++fini === n) z.parentNode.removeChild(z); };
    });
  }
  function ids0(sa) { return sa.etal.fruits.concat(sa.etal.legumes); }
  // Entre deux rubriques, les fruits de la saison roulent avec le défilement.
  function rouler() {
    $$('.roulade').forEach(function (z) {
      var r = z.getBoundingClientRect(); if (r.bottom < -40 || r.top > innerHeight + 40) return;
      var t = (innerHeight - r.top) / (innerHeight + r.height), sens = +z.dataset.sens, W = r.width + 120, it = z.children;
      for (var i = 0; i < it.length; i++) {
        var f = (((i / it.length + t * .8 * sens) % 1) + 1) % 1, x = f * W - 60;
        it[i].style.transform = 'translateX(' + x.toFixed(1) + 'px) rotate(' + (x * 2.29).toFixed(1) + 'deg)';
      }
    });
  }
  function majSaison(s) {
    var avant = saison; saison = s; H.dataset.saison = s; var sa = SID[s];
    var th = $('meta[name=theme-color]'); if (th) th.content = FORT[s];
    $$('.mot[data-mot=le]').forEach(function (e) { e.textContent = sa.le; if (avant) rejouer(e, 'change'); });
    $$('.mot[data-mot=de]').forEach(function (e) { e.textContent = sa.de; if (avant) rejouer(e, 'change'); });
    $$('.an[data-s]').forEach(function (b) { if (b.dataset.s !== 'jour') b.setAttribute('aria-pressed', String(b.dataset.s === s)); });
    $('#tourner-mot').textContent = sa.nom;
    // la petite roue de la barre : l'automne est dessiné en haut, l'année tourne dans le sens des aiguilles
    var ordre = ['automne', 'hiver', 'printemps', 'ete'], cible = -90 * ordre.indexOf(s);
    while (cible > miniTour + 1) cible -= 360; while (cible < miniTour - 359) cible += 360; if (!avant) cible = -90 * ordre.indexOf(s);
    miniTour = cible; $('#mini-g').style.transform = 'rotate(' + cible + 'deg)';
    $('#roule').innerHTML = fruit(sa.fruit);
    $('#pastille-img').src = sa.photo;
    garnir(!avant); if (avant) pluie(s);
    $$('.roulade').forEach(function (r, k) { r.innerHTML = [0, 1, 2, 3, 4, 5, 6].map(function (i) { return '<span class="rl">' + fruit(ids0(sa)[(i + k * 3) % 8]) + '</span>'; }).join(''); }); rouler();
    var ids = sa.etal.fruits.concat(sa.etal.legumes);
    $$('.jour-bac').forEach(function (b, i) { b.innerHTML = fruit(ids[i % ids.length]) + fruit(ids[(i + 3) % ids.length]); });
  }
  function poser(a) {
    angle = a; disque.style.transform = 'rotate(' + (-a).toFixed(2) + 'deg)';
    if (intro) return;
    var n = norm(a), d = dateDe(n);
    if (d.m !== moisIci) { moisIci = d.m; majMois(); }
    var s = saisonDe(d.m, d.j), change = s !== saison; if (change) majSaison(s);
    var auj = Math.abs(((n - A0 + 540) % 360) - 180) < 1.2;
    var cle = auj ? 'auj' : d.m + '-' + (d.j <= 10 ? 0 : d.j <= 20 ? 1 : 2);
    if (cle !== cleDate || change) { cleDate = cle; majDate(d, auj); }
    roue.setAttribute('aria-valuenow', Math.round(n));
  }

  // Tirer, lancer, viser
  var glisse = null, vit = 0, anim = 0;
  function arreter() { cancelAnimationFrame(anim); anim = 0; if (intro) { intro = false; poser(angle); } }
  function allerA(cible, ms) {
    arreter(); if (calme) { poser(cible); return; }
    var a0 = angle, t0 = performance.now(); ms = ms || Math.min(1500, 500 + Math.abs(cible - a0) * 5);
    (function pas(t) { var k = Math.min(1, (t - t0) / ms), e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; poser(a0 + (cible - a0) * e); if (k < 1) anim = requestAnimationFrame(pas); })(t0);
  }
  function auPlusCourt(a) { return angle + ((a - norm(angle)) % 360 + 540) % 360 - 180; }
  function versSaison(id) { var sa = SID[id]; allerA(auPlusCourt(angleDe(sa.milieu[0], sa.milieu[1]))); touchee(); }
  function touchee(tiree) { roue.classList.add('touchee'); if (tiree) $('.roue-aide').classList.add('vu-main'); }
  function angPt(e) { var r = roue.getBoundingClientRect(); return Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180 / Math.PI; }
  roue.addEventListener('pointerdown', function (e) {
    if (e.button) return; arreter(); vit = 0;
    glisse = { a: angPt(e), t: performance.now(), id: e.pointerId, bouge: 0 };
    try { roue.setPointerCapture(e.pointerId); } catch (x) {}
  });
  roue.addEventListener('pointermove', function (e) {
    if (!glisse || e.pointerId !== glisse.id) return;
    var a = angPt(e), d = a - glisse.a; if (d > 180) d -= 360; if (d < -180) d += 360;
    var t = performance.now(), dt = Math.max(1, t - glisse.t);
    vit = vit * .55 + (d / dt) * .45; glisse.a = a; glisse.t = t; glisse.bouge += Math.abs(d);
    if (glisse.bouge > 12) touchee(true);
    poser(angle - d);
  });
  function lacher(e) {
    if (!glisse) return; var g = glisse, v = vit; glisse = null;
    if (e.type === 'pointerup' && g.bouge < 2) { var rr = roue.getBoundingClientRect(); if (Math.hypot(e.clientX - rr.left - rr.width / 2, e.clientY - rr.top - rr.height / 2) < rr.width * .15) return; var d = angPt(e) + 90; d = ((d % 360) + 540) % 360 - 180; if (Math.abs(d) > 6) { allerA(angle + d); touchee(); } return; }
    if (calme || Math.abs(v) < .02 || performance.now() - g.t > 120) return;
    var t0 = performance.now();
    (function pas(t) { var dt = Math.min(40, t - t0); t0 = t; v *= Math.pow(.9945, dt); poser(angle - v * dt); if (Math.abs(v) > .004) anim = requestAnimationFrame(pas); })(t0);
  }
  roue.addEventListener('pointerup', lacher); roue.addEventListener('pointercancel', lacher);
  roue.addEventListener('keydown', function (e) {
    var d = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? 10 : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -10 : 0;
    if (d) { e.preventDefault(); arreter(); poser(angle + d); touchee(); }
  });
  document.addEventListener('click', function (e) {
    var b = e.target.closest('.an'); if (!b) return;
    if (b.dataset.s === 'jour') { allerA(auPlusCourt(A0)); touchee(); } else versSaison(b.dataset.s);
  });
  $('#tourner').addEventListener('click', function () {
    var sa = S[(SID[saison].i + 1) % 4], mil = angleDe(sa.milieu[0], sa.milieu[1]), d = (mil - norm(angle) + 360) % 360 || 360;
    allerA(angle + d); touchee(); rejouer(this, 'tourne');
  });

  // ---------- L'étal ----------
  function tasHtml(id, k) {
    var p = PID[id];
    return '<button type="button" class="tas" data-id="' + id + '" aria-label="' + p.nom + ' : voir les mois">' +
      '<span class="tas-fruits">' + [0, 1, 2].map(function (j) { return fruit(id, 'tombe').replace('<svg ', '<svg style="--k:' + (k * 3 + j) + '" '); }).join('') + '</span>' +
      '<span class="pique plante" style="--k:' + (k * 3) + '"><b>' + p.nom + '</b><small>..,.. €</small></span></button>';
  }
  function garnir(tout) {
    var jeton = ++garnirN;
    ['fruits', 'legumes'].forEach(function (t, ti) {
      var el = $('#tas-' + t), ids = SID[saison].etal[t];
      var remplir = function () { if (jeton === garnirN) el.innerHTML = ids.map(function (id, k) { return tasHtml(id, k + ti * 2); }).join(''); };
      if (tout || calme || !el.children.length) { remplir(); return; }
      $$('.fr', el).forEach(function (f, i) { f.classList.remove('tombe'); f.style.setProperty('--k', i); f.classList.add('part'); });
      setTimeout(remplir, 430);
    });
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest('.tas'); if (!t) return;
    var p = PID[t.dataset.id], q = $('.pique', t), dos = t.dataset.dos === '1';
    rejouer(t, 'saute'); q.classList.remove('plante'); rejouer(q, 'flip');
    setTimeout(function () { q.innerHTML = '<b>' + p.nom + '</b><small>' + (dos ? '..,.. €' : moisCourt(p)) + '</small>'; t.dataset.dos = dos ? '' : '1'; }, calme ? 0 : 200);
  });

  // ---------- Le calendrier ----------
  var tri = 'tout';
  (function construireCal() {
    var lettres = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'], moitie = Math.ceil(P.length / 2);
    var ms = function (m) { return (m <= 1 || m === 11) ? 'm-h' : m <= 4 ? 'm-p' : m <= 7 ? 'm-e' : 'm-a'; };
    var bloc = function (liste) {
      var h = '<div class="cal-bloc"><span class="cal-ici"></span><div class="cal-rang cal-tete"><span></span>' + lettres.map(function (l, m) { return '<button type="button" class="cm" data-m="' + m + '" aria-label="Aller en ' + C.mois[m] + '">' + l + '</button>'; }).join('') + '</div>';
      liste.forEach(function (p, r) {
        h += '<div class="cal-rang" data-id="' + p.id + '" role="img" aria-label="' + p.nom + ' : ' + moisLong(p) + '"><span class="cal-nom">' + fruit(p.id) + p.nom + '</span>';
        for (var m = 0; m < 12; m++) {
          h += dans(p, m) ? '<i class="on ' + ms(m) + (m === 0 || !dans(p, m - 1) ? ' deb' : '') + (m === 11 || !dans(p, m + 1) ? ' fin' : '') + '" style="--r:' + r + ';--c:' + m + '"></i>' : '<i></i>';
        }
        h += '</div>';
      });
      return h + '</div>';
    };
    $('#cal').innerHTML = bloc(P.slice(0, moitie)) + bloc(P.slice(moitie));
  })();
  function trier() {
    $$('.cal-rang[data-id]').forEach(function (r) {
      var p = PID[r.dataset.id];
      r.classList.toggle('terne', !(tri === 'tout' || (tri === 'saison' ? dans(p, moisIci) : p.type === tri)));
    });
  }
  document.addEventListener('click', function (e) { var b = e.target.closest('.cm'); if (b) { allerA(auPlusCourt(+b.dataset.m * 30 + 15)); touchee(); } });
  document.addEventListener('click', function (e) {
    var b = e.target.closest('.tri-b'); if (!b) return; tri = b.dataset.tri;
    $$('.tri-b').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); trier();
  });

  // ---------- Le jeu : de quelle saison ? ----------
  var soie = $('#soie'), soieFruit = $('#soie-fruit'), jeuDit = $('#jeu-dit'), J = { file: [], n: 0, bons: 0, essais: 0, ouvert: false, fini: false, occupe: false };
  function dire(el, t) { el.textContent = t; rejouer(el, 'pop'); }
  function voler(de, vers, id, fin) {
    var v = document.createElement('div'); v.className = 'vol'; v.style.width = de.width + 'px'; v.style.height = de.height + 'px'; v.innerHTML = fruit(id); document.body.appendChild(v);
    var c = vers.getBoundingClientRect(), x1 = c.left + c.width / 2 - de.width / 2, y1 = c.top + c.height * .3 - de.height / 2;
    var a = v.animate([
      { transform: 'translate(' + de.left + 'px,' + de.top + 'px) scale(1) rotate(0deg)' },
      { transform: 'translate(' + (de.left + x1) / 2 + 'px,' + (Math.min(de.top, y1) - 70) + 'px) scale(1.1) rotate(160deg)', offset: .5 },
      { transform: 'translate(' + x1 + 'px,' + y1 + 'px) scale(.45) rotate(340deg)' }
    ], { duration: calme ? 1 : 560, easing: 'cubic-bezier(.4,0,.6,1)' });
    a.onfinish = function () { v.remove(); fin(); };
  }
  function suivant() {
    J.occupe = false; J.ouvert = false; J.essais = 0;
    if (J.n >= J.file.length) {
      J.fini = true; majFile(); soie.classList.add('vide'); soie.classList.remove('ouvert');
      dire(jeuDit, J.bons + ' sur 8 du premier coup. ' + (J.bons >= 7 ? 'Vous pouvez tenir l’étal.' : J.bons >= 4 ? 'Bel étal. On refait une tournée ?' : 'On refait une tournée ?'));
      soie.setAttribute('aria-label', 'Rejouer'); return;
    }
    var p = J.file[J.n]; majFile();
    soie.classList.add('vide'); soie.classList.remove('ouvert'); soie.setAttribute('aria-label', 'Déballer le fruit');
    soie.dataset.id = p.id; setTimeout(function () { soieFruit.innerHTML = fruit(p.id); soie.classList.remove('vide'); rejouer(soie, 'arrive'); }, calme ? 0 : (J.n ? 520 : 0));
    if (J.n) setTimeout(function () { if (!J.ouvert && !J.fini) dire(jeuDit, 'Au suivant : touchez le papier.'); }, 900);
  }
  function majFile() {
    $('#file').innerHTML = J.file.map(function (p, i) { return '<span class="f-it' + (i < J.n ? ' fait' : i === J.n ? ' ici' : '') + '">' + (i < J.n ? fruit(p.id) : emballe('var(--a)')) + '</span>'; }).join('');
  }
  function nouveauJeu() {
    var pool = P.filter(function (p) { return p.jeu; }), file = [];
    for (var i = pool.length - 1; i > 0; i--) { var k = Math.floor(Math.random() * (i + 1)), t = pool[i]; pool[i] = pool[k]; pool[k] = t; }
    // deux produits par saison, pour que les quatre cageots servent
    S.forEach(function (sa) { var n = 0; pool.forEach(function (p) { if (n < 2 && file.indexOf(p) < 0 && p.jeu[0] === sa.id) { file.push(p); n++; } }); });
    for (i = file.length - 1; i > 0; i--) { k = Math.floor(Math.random() * (i + 1)); t = file[i]; file[i] = file[k]; file[k] = t; }
    J.file = file.slice(0, 8); J.n = 0; J.bons = 0; J.fini = false;
    $('#jeu-n').textContent = '0'; $$('.jc-fond').forEach(function (f) { f.innerHTML = ''; f.parentNode.classList.remove('plein'); });
    jeuDit.textContent = 'Touchez le papier pour le déballer.'; suivant();
  }
  function deballer() {
    if (J.fini) { nouveauJeu(); return; }
    if (J.ouvert || J.occupe) return;
    J.ouvert = true; soie.classList.add('ouvert'); soie.classList.remove('arrive');
    dire(jeuDit, J.file[J.n].un + ' : dans quel cageot ?');
  }
  function choisir(jc, depuis) {
    if (J.fini || J.occupe) return;
    if (!J.ouvert) { dire(jeuDit, 'Déballez d’abord le fruit.'); return; }
    var p = J.file[J.n], s = jc.dataset.s;
    if (p.jeu.indexOf(s) < 0) { J.essais++; rejouer(jc, 'non'); soieFruit.style.opacity = ''; dire(jeuDit, 'Pas ' + (s === 'ete' ? 'en été' : s === 'hiver' ? 'en hiver' : s === 'automne' ? 'en automne' : 'au printemps') + '. Un autre cageot ?'); return; }
    J.occupe = true; if (!J.essais) J.bons++;
    var r = depuis || soieFruit.getBoundingClientRect(); soieFruit.style.opacity = '0';
    voler(r, jc, p.id, function () {
      soieFruit.style.opacity = ''; rejouer(jc, 'oui');
      var f = $('.jc-fond', jc); jc.classList.add('plein'); f.insertAdjacentHTML('beforeend', fruit(p.id)); if (f.children.length > 5) f.firstElementChild.remove();
      $('#jeu-n').textContent = J.bons; if (!J.essais) rejouer($('.pique-score'), 'bravo');
      dire(jeuDit, 'Oui : ' + p.nom.toLowerCase() + ', ' + moisLong(p) + '.');
      J.n++; setTimeout(suivant, calme ? 400 : 1300);
    });
    soie.classList.add('vide');
  }
  soie.addEventListener('click', function (e) { if (!J.ouvert || J.fini) deballer(); });
  soie.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); deballer(); } });
  $('#jeu-cageots').addEventListener('click', function (e) { var jc = e.target.closest('.jc'); if (jc) choisir(jc); });
  $('#jeu-encore').addEventListener('click', nouveauJeu);
  // glisser le fruit déballé jusqu'à un cageot
  (function () {
    var g = null;
    function sous(x, y) { var el = document.elementFromPoint(x, y); return el && el.closest ? el.closest('.jc') : null; }
    soieFruit.addEventListener('pointerdown', function (e) {
      if (!J.ouvert || J.occupe || J.fini || e.button) return;
      var r = soieFruit.getBoundingClientRect();
      g = { id: e.pointerId, x: e.clientX, y: e.clientY, r: r, v: null, vise: null };
      try { soieFruit.setPointerCapture(e.pointerId); } catch (x) {}
    });
    soieFruit.addEventListener('pointermove', function (e) {
      if (!g || e.pointerId !== g.id) return;
      var dx = e.clientX - g.x, dy = e.clientY - g.y;
      if (!g.v) {
        if (Math.abs(dx) + Math.abs(dy) < 8) return;
        g.v = document.createElement('div'); g.v.className = 'vol'; g.v.style.width = g.r.width + 'px'; g.v.style.height = g.r.height + 'px'; g.v.innerHTML = fruit(J.file[J.n].id);
        document.body.appendChild(g.v); soieFruit.style.opacity = '0';
      }
      g.v.style.transform = 'translate(' + (g.r.left + dx) + 'px,' + (g.r.top + dy) + 'px) scale(1.12) rotate(' + (dx * .08) + 'deg)';
      var jc = sous(e.clientX, e.clientY); if (jc !== g.vise) { if (g.vise) g.vise.classList.remove('vise'); if (jc) jc.classList.add('vise'); g.vise = jc; }
    });
    function fin(e) {
      if (!g || e.pointerId !== g.id) return; var h = g; g = null;
      if (!h.v) return;
      var r = h.v.getBoundingClientRect(), jc = e.type === 'pointerup' ? sous(e.clientX, e.clientY) : null; h.v.remove(); if (h.vise) h.vise.classList.remove('vise');
      if (jc) choisir(jc, { left: r.left, top: r.top, width: h.r.width, height: h.r.height }); else soieFruit.style.opacity = '';
    }
    soieFruit.addEventListener('pointerup', fin); soieFruit.addEventListener('pointercancel', fin);
  })();

  // ---------- Le point relais ----------
  (function () {
    var b = $('#relais-b'), dit = $('#relais-dit'), pose = $('#pose'), pas = 0;
    var N = ['Plus aucun colis', 'Un colis attend', 'Deux colis attendent', 'Trois colis attendent', 'Quatre colis attendent', 'Cinq colis attendent', 'Six colis attendent'];
    var reste = function () { return $$('.rayon .colis:not(.pris)').length; };
    b.addEventListener('click', function () {
      if (pas === 0) {
        var c = $('.rayon .colis:not(.pris)');
        if (!c) { $$('.rayon .colis').forEach(function (x) { x.classList.remove('pris'); x.style.animation = 'none'; void x.offsetWidth; x.style.animation = ''; }); dire(dit, 'Nouvel arrivage sur l’étagère.'); return; }
        var r0 = c.getBoundingClientRect(), k = c.cloneNode(true); k.style.animation = 'none'; pose.appendChild(k); c.classList.add('pris');
        var r1 = k.getBoundingClientRect();
        k.animate([{ transform: 'translate(' + (r0.left - r1.left) + 'px,' + (r0.top - r1.top) + 'px) scale(' + (r0.width / r1.width) + ')', transformOrigin: '0 0' }, { transform: 'translate(' + (r0.left - r1.left) * .4 + 'px,' + (r0.top - r1.top - 50) + 'px) scale(1.05) rotate(-8deg)', transformOrigin: '0 0', offset: .55 }, { transform: 'none', transformOrigin: '0 0' }], { duration: calme ? 1 : 750, easing: 'cubic-bezier(.3,.9,.4,1)' });
        dire(dit, 'Le voilà sur le comptoir.'); b.textContent = 'Et une barquette de saison'; pas = 1;
      } else if (pas === 1) {
        var ids = SID[saison].etal.fruits;
        pose.insertAdjacentHTML('beforeend', '<span class="barquette-zone">' + fruit(ids[0]) + fruit(ids[1]) + fruit(ids[0]) + '<span class="barquette"></span></span>');
        dire(dit, 'Un colis, des fruits : bonne route.'); b.textContent = 'Un autre colis'; pas = 2;
      } else {
        $$('*', pose).forEach(function (x) { if (x.parentNode === pose) x.animate([{ transform: 'none', opacity: 1 }, { transform: 'translateX(140px) rotate(8deg)', opacity: 0 }], { duration: calme ? 1 : 380, easing: 'ease-in', fill: 'forwards' }); });
        setTimeout(function () { pose.innerHTML = ''; }, calme ? 0 : 390);
        var n = reste(); dire(dit, n ? N[n] + ' sur l’étagère.' : 'L’étagère est vide : au prochain arrivage.'); b.textContent = n ? 'Je viens chercher mon colis' : 'Faire rentrer l’arrivage'; pas = 0;
      }
    });
  })();

  // ---------- Les horaires ----------
  (function () {
    var auj = (AUJ.getDay() + 6) % 7, sem = $('#semaine'); sem.setAttribute('data-vu', '');
    sem.innerHTML = C.jours.map(function (j, i) {
      return '<div class="jour' + (i === auj ? ' auj' : '') + '" style="--i:' + i + '">' + (i === auj ? '<span class="auj-m">Aujourd’hui</span>' : '') +
        '<span class="pique"><b>' + j + '</b><small aria-label="horaires à compléter">.. h ..<br>.. h ..</small></span><span class="jour-bac" aria-hidden="true"></span></div>';
    }).join('');
  })();

  // ---------- Flamants ----------
  $$('.flamant').forEach(function (f) {
    f.addEventListener('click', function () { if (f.classList.contains('envol')) return; f.classList.add('envol'); setTimeout(function () { f.classList.remove('envol'); }, calme ? 600 : 5200); });
  });

  // ---------- Apparitions ----------
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return; var el = e.target; io.unobserve(el); el.classList.add('vu');
      if (el.classList.contains('c-fruits')) garnir(true);
    });
  }, { threshold: .12, rootMargin: '0px 0px -6% 0px' });
  $$('[data-vu]').forEach(function (el) { io.observe(el); });

  // ---------- Défilement : fruit qui roule, latte, paysage, rubrique en cours ----------
  var liens = $$('.liens a'), rubriques = liens.map(function (a) { return $(a.getAttribute('href')); });
  var roule = $('#roule'), latte = $('#latte'), plans = $$('.plan'), terroir = $('#terroir'), enVue = false, lx = 0, tDernier = 0, yDernier = 0, lw = 0;
  function mesurer() { lw = latte.scrollWidth / 3; }
  function defile() {
    var y = scrollY, max = Math.max(1, document.documentElement.scrollHeight - innerHeight), p = Math.min(1, y / max);
    roule.style.transform = 'translateX(' + (p * (innerWidth - 30)).toFixed(1) + 'px) rotate(' + (p * 1440).toFixed(1) + 'deg)';
    var ici = -1; rubriques.forEach(function (r, i) { if (r && r.getBoundingClientRect().top < innerHeight * .45) ici = i; });
    liens.forEach(function (a, i) { a.classList.toggle('ici', i === ici); });
    var r = terroir.getBoundingClientRect();
    if (r.top < innerHeight && r.bottom > 0) { var d = innerHeight - r.top; plans.forEach(function (g) { g.style.transform = 'translateX(' + (-d * +g.dataset.v).toFixed(1) + 'px)'; }); }
    rouler();
  }
  function boucle(t) {
    var dt = Math.min(60, t - tDernier); tDernier = t;
    var dy = scrollY - yDernier; yDernier = scrollY;
    lx += dt * .03 + dy * .5; if (lw) { lx = ((lx % lw) + lw) % lw; latte.style.transform = 'translateX(' + (-lx).toFixed(1) + 'px)'; }
    requestAnimationFrame(boucle);
  }
  addEventListener('scroll', defile, { passive: true }); addEventListener('resize', function () { mesurer(); defile(); });

  // ---------- Menu du téléphone ----------
  var menuB = $('#menu-b'), menu = $('#liens');
  menuB.addEventListener('click', function () { var o = !menu.classList.contains('ouvert'); menu.classList.toggle('ouvert', o); menuB.setAttribute('aria-expanded', String(o)); menuB.textContent = o ? 'Fermer' : 'Menu'; });
  menu.addEventListener('click', function (e) { if (e.target.closest('a')) { menu.classList.remove('ouvert'); menuB.setAttribute('aria-expanded', 'false'); menuB.textContent = 'Menu'; } });

  // ---------- Page Bonjour : le bouton Couleur fait tourner l'année ----------
  var dedans = window.parent !== window;
  function annoncer(t) { if (dedans) { try { parent.postMessage({ type: t }, '*'); } catch (e) {} } }
  addEventListener('message', function (e) {
    var p = e.data && e.data.type === 'kazura-couleur' ? e.data.palette : null; if (!p) return;
    if (SID[p]) versSaison(p); else { allerA(auPlusCourt(A0)); }
  });
  addEventListener('scroll', function un() { removeEventListener('scroll', un); annoncer('kazura-defile'); }, { passive: true });
  addEventListener('load', function () { setTimeout(function () { annoncer('kazura-pret'); }, 200); });

  // ---------- Départ ----------
  intro = false; poser(angle);
  nouveauJeu(); mesurer(); defile(); requestAnimationFrame(boucle);
  if (!calme) {
    intro = true; var but = angle; poser(but - 140);
    setTimeout(function () {
      var t0 = performance.now(), ms = 1900;
      (function pas(t) { var k = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - k, 4); if (!intro) return; poser(but - 140 * (1 - e)); if (k < 1) anim = requestAnimationFrame(pas); else { intro = false; poser(but); } })(t0);
    }, 250);
  }
  var pret = function () { H.classList.add('pret'); mesurer(); };
  if (document.fonts && document.fonts.ready) { Promise.race([document.fonts.ready, new Promise(function (r) { setTimeout(r, 900); })]).then(pret); } else pret();
})();
