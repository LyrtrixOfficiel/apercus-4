// Eden Fleurs : le dessin des fleurs et les jardins vivants.
// Tout est dessiné en 2D (canvas), en aplats : aucune 3D, donc aucune déformation.
// Chaque tête de fleur est dessinée une fois puis réutilisée ; seules la tige et l'inclinaison changent à chaque image.
(function () {
  'use strict';
  var TAU = Math.PI * 2;
  var E = window.EDEN = {};
  // Le mouvement joue toujours en entier. Le mode calme n'existe que sur demande : ?calme=1 (classe calme sur html).
  E.calme = /[?&]calme=1/.test(location.search);

  // ---------- couleurs ----------
  // chaque teinte : [principale, ombre, lumière]
  E.TEINTES = {
    rose: ['#f2669c', '#cf3a75', '#ffabc9'],
    framboise: ['#d62b63', '#a2194a', '#f2669c'],
    corail: ['#f57b4e', '#d2532d', '#ffb393'],
    beurre: ['#f9c842', '#e19f1d', '#ffe793'],
    blanc: ['#fff6e8', '#eedbc3', '#ffffff'],
    lilas: ['#b895ee', '#8a64cb', '#decbfb'],
    peche: ['#ffb68c', '#f18d5f', '#ffdcc6'],
    rouge: ['#e53b42', '#ae212e', '#ff7d73'],
    bleu: ['#7391f2', '#4a64c6', '#b6c7ff'],
    blush: ['#ffd5d8', '#f4a9b3', '#fff2f0'],
    prune: ['#8d3f7a', '#662a59', '#bb6ba6'],
  };
  E.VERTS = { tige: '#3f9c57', clair: '#6cc070', fonce: '#2c7a45', sauge: '#9fc6a7', saugeFonce: '#78a886' };
  var COEUR = '#2c1631', JAUNE = '#f9c842', JAUNE2 = '#e19f1d';

  function hex(c) { if (c.charAt(0) !== '#') { var m = c.match(/[\d.]+/g) || [0, 0, 0]; return [+m[0], +m[1], +m[2]]; } return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]; }
  function mix(a, b, t) {
    var x = hex(a), y = hex(b);
    return 'rgb(' + Math.round(x[0] + (y[0] - x[0]) * t) + ',' + Math.round(x[1] + (y[1] - x[1]) * t) + ',' + Math.round(x[2] + (y[2] - x[2]) * t) + ')';
  }
  E.mix = mix;
  function alea(graine) { var a = graine >>> 0; return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  E.alea = alea;
  function borne(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lisse(a, b, x) { var t = borne((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
  function rebond(t) { t = borne(t, 0, 1); var c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); }
  function sortie(t) { t = borne(t, 0, 1); return 1 - Math.pow(1 - t, 3); }
  E.borne = borne; E.lisse = lisse; E.rebond = rebond; E.sortie = sortie;

  // ---------- formes ----------
  function petale(c, len, larg, pointu) {
    c.beginPath(); c.moveTo(0, 0);
    if (pointu) { c.bezierCurveTo(-larg * 1.35, -len * .32, -larg * .55, -len * .82, 0, -len); c.bezierCurveTo(larg * .55, -len * .82, larg * 1.35, -len * .32, 0, 0); }
    else { c.bezierCurveTo(-larg * 1.15, -len * .22, -larg * 1.2, -len, 0, -len); c.bezierCurveTo(larg * 1.2, -len, larg * 1.15, -len * .22, 0, 0); }
    c.closePath(); c.fill();
  }
  function couronne(c, n, len, larg, coul, dec, pointu, coul2) {
    for (var i = 0; i < n; i++) { c.save(); c.rotate(dec + i * TAU / n); c.fillStyle = coul2 && i % 2 ? coul2 : coul; petale(c, len, larg, pointu); c.restore(); }
  }
  function disque(c, x, y, r, coul) { c.fillStyle = coul; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); }
  function anneau(c, n, dist, ray, coul, dec, coul2) {
    for (var i = 0; i < n; i++) { var a = dec + i * TAU / n; disque(c, Math.cos(a) * dist, Math.sin(a) * dist, ray, coul2 && i % 2 ? coul2 : coul); }
  }

  // Chaque espèce : boite = [gauche, haut, droite, bas] en rayons autour du point d'attache, face = tête vue de face.
  var ESP = E.ESPECES = {
    marguerite: { boite: [1.05, 1.05, 1.05, 1.05], face: 1, d: function (c, r, t) {
      couronne(c, 13, r * .96, r * .17, t[1], TAU / 26); couronne(c, 13, r, r * .18, t[0], 0);
      disque(c, 0, 0, r * .3, JAUNE2); disque(c, -r * .03, -r * .04, r * .25, JAUNE);
    } },
    cosmos: { boite: [1.05, 1.05, 1.05, 1.05], face: 1, d: function (c, r, t) {
      couronne(c, 8, r, r * .33, t[0], 0, 0, t[2]); couronne(c, 8, r * .5, r * .17, t[1], TAU / 16);
      disque(c, 0, 0, r * .2, JAUNE2); disque(c, -r * .02, -r * .03, r * .15, JAUNE);
    } },
    anemone: { boite: [1.05, 1.05, 1.05, 1.05], face: 1, d: function (c, r, t) {
      couronne(c, 6, r, r * .5, t[1], TAU / 12); couronne(c, 6, r * .96, r * .46, t[0], 0);
      disque(c, 0, 0, r * .36, t[2]); disque(c, 0, 0, r * .25, COEUR); disque(c, -r * .05, -r * .06, r * .08, '#56305c');
    } },
    coquelicot: { boite: [1.08, 1.08, 1.08, 1.08], face: 1, d: function (c, r, t) {
      anneau(c, 2, r * .42, r * .62, t[1], TAU / 8); anneau(c, 2, r * .4, r * .64, t[0], TAU / 8 + TAU / 4);
      disque(c, 0, 0, r * .25, COEUR); anneau(c, 6, r * .25, r * .06, COEUR, 0); disque(c, 0, 0, r * .1, '#9ec06a');
    } },
    rose: { boite: [1.08, 1.08, 1.08, 1.08], face: 1, d: function (c, r, t) {
      anneau(c, 6, r * .5, r * .54, t[1], 0, mix(t[1], t[0], .45));
      anneau(c, 6, r * .33, r * .44, t[0], TAU / 12, mix(t[0], t[2], .4));
      anneau(c, 4, r * .19, r * .32, t[2], .3, mix(t[2], t[0], .45));
      anneau(c, 3, r * .09, r * .2, t[0], 1.1); disque(c, r * .02, r * .02, r * .1, t[1]);
    } },
    pivoine: { boite: [1.1, 1.1, 1.1, 1.1], face: 1, d: function (c, r, t) {
      anneau(c, 8, r * .64, r * .42, t[0], 0, mix(t[0], t[1], .5));
      anneau(c, 8, r * .43, r * .38, t[2], TAU / 16, mix(t[2], t[0], .5));
      anneau(c, 6, r * .25, r * .3, t[0], .2, mix(t[0], t[2], .55));
      disque(c, 0, 0, r * .2, t[1]); anneau(c, 5, r * .09, r * .07, JAUNE, .4); disque(c, 0, 0, r * .06, JAUNE2);
    } },
    dahlia: { boite: [1.05, 1.05, 1.05, 1.05], face: 1, d: function (c, r, t) {
      couronne(c, 14, r, r * .19, t[1], 0, 1); couronne(c, 12, r * .78, r * .2, t[0], TAU / 24, 1);
      couronne(c, 9, r * .54, r * .19, t[2], .2, 1); couronne(c, 6, r * .3, r * .14, t[0], .5, 1); disque(c, 0, 0, r * .1, t[1]);
    } },
    tournesol: { boite: [1.05, 1.05, 1.05, 1.05], face: 1, d: function (c, r) {
      couronne(c, 16, r, r * .17, JAUNE2, TAU / 32, 1); couronne(c, 16, r * .94, r * .18, JAUNE, 0, 1);
      disque(c, 0, 0, r * .46, '#6a3d22'); disque(c, 0, 0, r * .31, '#47250f'); anneau(c, 9, r * .385, r * .05, '#8a5632', 0);
    } },
    lys: { boite: [1.05, 1.05, 1.05, 1.05], face: 1, d: function (c, r, t) {
      couronne(c, 3, r, r * .3, t[1], TAU / 6, 1); couronne(c, 3, r, r * .32, t[0], 0, 1);
      couronne(c, 6, r * .7, r * .07, t[2], 0, 1);
      c.strokeStyle = '#a9c36a'; c.lineWidth = Math.max(1.5, r * .05); c.lineCap = 'round';
      for (var i = 0; i < 6; i++) { var a = i * TAU / 6 + .5; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * r * .42, Math.sin(a) * r * .42); c.stroke(); disque(c, Math.cos(a) * r * .45, Math.sin(a) * r * .45, r * .075, '#d67a2c'); }
      disque(c, 0, 0, r * .1, '#b9d36b');
    } },
    hortensia: { boite: [1.08, 1.08, 1.08, 1.08], face: 1, d: function (c, r, t) {
      disque(c, 0, 0, r * .86, t[1]);
      var pos = [[0, 0]], i, a;
      for (i = 0; i < 6; i++) { a = i * TAU / 6 + .3; pos.push([Math.cos(a) * r * .42, Math.sin(a) * r * .42]); }
      for (i = 0; i < 10; i++) { a = i * TAU / 10; pos.push([Math.cos(a) * r * .78, Math.sin(a) * r * .78]); }
      for (i = pos.length - 1; i >= 0; i--) { c.save(); c.translate(pos[i][0], pos[i][1]); c.rotate(i * 1.7); anneau(c, 4, r * .115, r * .125, i % 3 ? t[0] : t[2], 0); disque(c, 0, 0, r * .05, t[1]); c.restore(); }
    } },
    orchidee: { boite: [1.08, 1.08, 1.08, 1.08], face: 1, d: function (c, r, t) {
      couronne(c, 3, r, r * .26, t[1], 0, 1);
      c.fillStyle = t[0]; c.save(); c.rotate(TAU / 4 + .12); petale(c, r, r * .5); c.restore(); c.save(); c.rotate(-TAU / 4 - .12); petale(c, r, r * .5); c.restore();
      c.fillStyle = '#d62b63'; c.save(); c.rotate(TAU / 2); petale(c, r * .5, r * .26); c.restore();
      disque(c, 0, -r * .02, r * .13, JAUNE); disque(c, 0, r * .12, r * .06, '#a2194a');
    } },
    tulipe: { boite: [.95, 2.05, .95, .12], d: function (c, r, t) {
      c.fillStyle = t[2]; c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(-r * .55, -r * .4, -r * .42, -r * 1.5, 0, -r * 1.86); c.bezierCurveTo(r * .42, -r * 1.5, r * .55, -r * .4, 0, 0); c.fill();
      c.fillStyle = t[0]; c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(-r * .86, -r * .12, -r * .88, -r * 1.25, -r * .52, -r * 1.96); c.bezierCurveTo(-r * .2, -r * 1.5, r * .06, -r * 1.0, r * .12, -r * .3); c.closePath(); c.fill();
      c.fillStyle = t[1]; c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(r * .86, -r * .12, r * .88, -r * 1.25, r * .52, -r * 1.96); c.bezierCurveTo(r * .3, -r * 1.6, r * .16, -r * 1.2, r * .12, -r * .3); c.closePath(); c.fill();
    } },
    lupin: { boite: [.75, 3.25, .75, .1], d: function (c, r, t) {
      var n = 9, i, y, w;
      for (i = 0; i < n; i++) { y = -r * .28 - i * r * .31; w = r * (.6 - i * .05); disque(c, -w * .5, y, w * .62, i % 2 ? t[0] : t[1]); disque(c, w * .5, y - r * .1, w * .62, i % 2 ? t[2] : t[0]); }
      disque(c, 0, -r * 3.0, r * .13, t[2]);
    } },
    bouton: { boite: [.6, 1.7, .6, .1], d: function (c, r, t) {
      c.fillStyle = t[0]; c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(-r * .62, -r * .25, -r * .5, -r * 1.05, 0, -r * 1.6); c.bezierCurveTo(r * .5, -r * 1.05, r * .62, -r * .25, 0, 0); c.fill();
      c.fillStyle = t[1]; c.beginPath(); c.moveTo(0, -r * .1); c.bezierCurveTo(r * .5, -r * .3, r * .42, -r * 1.0, 0, -r * 1.6); c.bezierCurveTo(r * .16, -r * 1.0, r * .12, -r * .5, 0, -r * .1); c.fill();
      c.fillStyle = E.VERTS.tige; c.save(); c.rotate(-.5); petale(c, r * .75, r * .2, 1); c.restore(); c.save(); c.rotate(.5); petale(c, r * .75, r * .2, 1); c.restore();
    } },
    eucalyptus: { boite: [.9, 3.5, .9, .1], d: function (c, r) {
      c.strokeStyle = E.VERTS.saugeFonce; c.lineWidth = Math.max(2, r * .1); c.lineCap = 'round'; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(r * .1, -r * 1.7, 0, -r * 3.2); c.stroke();
      for (var i = 0; i < 7; i++) { var y = -r * .45 - i * r * .42, s = r * (.44 - i * .035); disque(c, -s * .95, y, s, i % 2 ? E.VERTS.sauge : E.VERTS.saugeFonce); disque(c, s * .95, y - r * .2, s, i % 2 ? E.VERTS.saugeFonce : E.VERTS.sauge); }
      disque(c, 0, -r * 3.25, r * .2, E.VERTS.sauge);
    } },
    feuille: { boite: [1.1, 2.4, 1.1, .1], d: function (c, r) {
      c.fillStyle = E.VERTS.fonce; c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(-r * 1.5, -r * .5, -r * 1.1, -r * 2.0, 0, -r * 2.3); c.bezierCurveTo(r * 1.1, -r * 2.0, r * 1.5, -r * .5, 0, 0); c.fill();
      c.fillStyle = E.VERTS.clair; c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(r * 1.5, -r * .5, r * 1.1, -r * 2.0, 0, -r * 2.3); c.bezierCurveTo(r * .14, -r * 1.5, r * .14, -r * .7, 0, 0); c.fill();
    } },
  };

  // ---------- têtes dessinées une fois ----------
  var cache = {};
  function tete(esp, teinte, r, fond, voile) {
    r = Math.max(4, Math.round(r / 3) * 3);
    var dpr = E.dpr || 1, cle = esp + '|' + teinte + '|' + r + '|' + (voile ? fond + voile : '') + '|' + dpr;
    if (cache[cle]) return cache[cle];
    var e = ESP[esp], t = E.TEINTES[teinte] || E.TEINTES.rose;
    if (voile) t = [mix(t[0], fond, voile), mix(t[1], fond, voile), mix(t[2], fond, voile)];
    var b = e.boite, w = Math.ceil((b[0] + b[2]) * r) + 2, h = Math.ceil((b[1] + b[3]) * r) + 2;
    var cv = document.createElement('canvas'); cv.width = Math.ceil(w * dpr); cv.height = Math.ceil(h * dpr);
    var c = cv.getContext('2d'); c.scale(dpr, dpr); c.translate(b[0] * r + 1, b[1] * r + 1); e.d(c, r, t);
    return (cache[cle] = { cv: cv, w: w, h: h, ax: b[0] * r + 1, ay: b[1] * r + 1, r: r });
  }
  E.tete = tete;

  // Une fleur seule dans la page (élément canvas), pour les scènes en DOM.
  E.fleurEl = function (esp, teinte, r, classe) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2), e = ESP[esp], t = E.TEINTES[teinte] || E.TEINTES.rose, b = e.boite;
    var w = (b[0] + b[2]) * r, h = (b[1] + b[3]) * r, cv = document.createElement('canvas');
    cv.width = Math.ceil(w * dpr); cv.height = Math.ceil(h * dpr); cv.style.width = w + 'px'; cv.style.height = h + 'px';
    cv.className = 'fl' + (classe ? ' ' + classe : ''); cv.setAttribute('aria-hidden', 'true');
    var c = cv.getContext('2d'); c.scale(dpr, dpr); c.translate(b[0] * r, b[1] * r); e.d(c, r, t);
    cv.dataset.ax = b[0] * r; cv.dataset.ay = b[1] * r;
    return cv;
  };

  var FEUILLE = null;
  function feuillePath() {
    if (FEUILLE) return FEUILLE;
    FEUILLE = new Path2D(); FEUILLE.moveTo(0, 0); FEUILLE.bezierCurveTo(.2, -.52, .78, -.42, 1, 0); FEUILLE.bezierCurveTo(.78, .34, .2, .4, 0, 0);
    return FEUILLE;
  }
  var PETALE = null;
  function petalePath() {
    if (PETALE) return PETALE;
    PETALE = new Path2D(); PETALE.moveTo(0, -1); PETALE.bezierCurveTo(.85, -.6, .7, .7, 0, 1); PETALE.bezierCurveTo(-.7, .7, -.85, -.6, 0, -1);
    return PETALE;
  }

  // ---------- un jardin ----------
  // opt : especes [[nom, poids, [teintes]]], densite (fleurs pour 1000 px), haut (part de la hauteur), rayon [min,max],
  //       fond (couleur derrière, pour le lointain), sol (couleur de la butte), butte (hauteur en px), profil(x de 0 à 1),
  //       pousse 'auto' ou 'defile', graine, lent (jardin calme)
  var jardins = [];
  function Jardin(cv, opt) {
    this.cv = cv; this.c = cv.getContext('2d'); this.o = opt; this.fl = []; this.pet = []; this.pap = [];
    this.px = -9999; this.py = -9999; this.pvx = 0; this.pvy = 0; this.dernier = 0;
    this.souffle = 0; this.cible = opt.pousse === 'defile' ? 0 : 1; this.t0 = 0; this.vu = false; this.parti = false; this.L = 0; this.H = 0;
    jardins.push(this); this.mesure();
  }
  // Densité des jardins : plafonnée à 1,5 sur téléphone et tablette (écran étroit ou doigt), 2 sur ordinateur.
  // Les fleurs sont des aplats : la différence ne se voit pas, et la carte graphique peint presque deux fois moins de pixels.
  function plafond() {
    var tel = innerWidth < 760 || (window.matchMedia && matchMedia('(pointer: coarse)').matches);
    return Math.min(window.devicePixelRatio || 1, tel ? 1.5 : 2);
  }
  Jardin.prototype.mesure = function () {
    var r = this.cv.getBoundingClientRect(), L = Math.round(r.width), H = Math.round(r.height);
    if (!L || !H) return;
    var dpr = E.dpr = plafond();
    if (L === this.L && H === this.H && dpr === this.dpr) return;
    var semer = L !== this.L || !this.fl.length;
    this.L = L; this.H = H; this.dpr = dpr; this.cv.width = Math.round(L * dpr); this.cv.height = Math.round(H * dpr);
    if (semer) this.semer(); else this.poser();
  };
  Jardin.prototype.yButte = function (x) {
    var o = this.o, b = o.butte == null ? 46 : o.butte;
    return this.H - b + Math.sin(x / this.L * TAU * (o.ondes || 1.5) + (o.phase || 0)) * b * .32 + Math.sin(x / this.L * TAU * 3.3 + 1) * b * .1;
  };
  Jardin.prototype.zonePx = function (xn) {
    var o = this.o; return (this.H - (o.butte == null ? 46 : o.butte)) * (o.haut || .8) * (o.profil ? o.profil(xn, this) : 1);
  };
  Jardin.prototype.semer = function () {
    var o = this.o, rnd = alea(o.graine || 7), L = this.L, i, k;
    var etroit = L < 700, base = L / 1000 * (o.densite || 60) * (etroit ? 1.25 : 1);
    // plus la place est haute, plus on plante serré : les têtes cachent les tiges
    var T = 48, cum = [], somme = 0;
    for (i = 0; i < T; i++) { somme += o.poids ? o.poids((i + .5) / T, this) : 1; cum.push(somme); }
    var n = borne(Math.round(base * somme / T), 8, o.max || 190);
    var total = 0; for (i = 0; i < o.especes.length; i++) total += o.especes[i][1];
    var anciennes = this.fl.filter(function (f) { return f.plantee; });
    this.fl = [];
    for (i = 0; i < n; i++) {
      var u = (i + .1 + rnd() * .8) / n * somme, t = 0; while (t < T - 1 && cum[t] < u) t++;
      var av = t ? cum[t - 1] : 0, xn = borne((t + (u - av) / (cum[t] - av)) / T, .004, .996);
      var tir = rnd() * total, e = o.especes[0];
      for (k = 0; k < o.especes.length; k++) { tir -= o.especes[k][1]; if (tir <= 0) { e = o.especes[k]; break; } }
      this.fl.push(this.creer(xn, ((i * 7) % 10 + rnd()) / 10, e[0], e[2][Math.floor(rnd() * e[2].length)], rnd, false));
    }
    for (i = 0; i < anciennes.length; i++) this.fl.push(anciennes[i]);
    this.fl.sort(function (a, b) { return a.z - b.z; });
    this.poser();
    if (o.papillons && !this.pap.length) this.lacher(etroit ? Math.min(2, o.papillons) : o.papillons);
  };
  // etage : 0 = tout en haut et derrière, 1 = tout en bas et devant
  Jardin.prototype.creer = function (xn, etage, esp, teinte, rnd, plantee) {
    var o = this.o, ray = o.rayon || [16, 30], etroit = this.L < 700, face = ESP[esp].face;
    var hmin = borne(70 / Math.max(1, this.zonePx(xn)), .1, .44), hn = hmin + (1 - hmin) * (1 - etage), z = borne(etage * .9 + rnd() * .1, 0, 1);
    var r = (ray[0] + (ray[1] - ray[0]) * (z * .55 + rnd() * .45)) * (etroit ? .8 : 1);
    if (!face) r *= esp === 'lupin' || esp === 'eucalyptus' ? .62 : .72;
    return {
      xn: xn, z: z, esp: esp, teinte: teinte, r: r, hn: hn * (face ? 1 : .92),
      ph: rnd() * TAU, vit: .7 + rnd() * .6, raide: 26 + rnd() * 22, a: 0, v: 0, g: 0,
      seuil: rnd() * .55, retard: rnd() * 1.3 + (1 - z) * .5, courbe: (rnd() - .5) * .5, tourne: rnd() * TAU,
      fe: [[.3 + rnd() * .16, rnd() < .5 ? 1 : -1, .8 + rnd() * .5], [.52 + rnd() * .16, rnd() < .5 ? 1 : -1, .6 + rnd() * .5]],
      voile: z < .28 ? .2 : z < .6 ? .09 : 0, plantee: plantee, ne: plantee ? performance.now() : 0, vert: rnd() < .5,
    };
  };
  Jardin.prototype.poser = function () {
    var o = this.o, i, f, fondJ = o.fond || '#3d0f24', V = E.VERTS;
    for (i = 0; i < this.fl.length; i++) {
      f = this.fl[i]; f.x = f.xn * this.L; f.y = this.yButte(f.x) + 10 + f.z * 8;
      f.Lg = Math.max(26, this.zonePx(f.xn) * f.hn - f.r * (ESP[f.esp].face ? .5 : 1.4));
      f.sp = tete(f.esp, f.teinte, f.r, fondJ, f.voile);
      // couleurs de la tige et des deux feuilles, calculées une fois (et plus à chaque image)
      f.cT = f.voile ? mix(V.tige, fondJ, f.voile) : V.tige;
      f.cF = [f.voile ? mix(V.fonce, fondJ, f.voile) : (f.vert ? V.clair : V.fonce), f.voile ? mix(V.clair, fondJ, f.voile) : (1 ^ f.vert ? V.clair : V.fonce)];
    }
  };
  Jardin.prototype.planter = function (x, esp, teinte) {
    var o = this.o, rnd = alea((x * 977 + performance.now()) | 0), e = o.especes[Math.floor(rnd() * o.especes.length)];
    var f = this.creer(borne(x / this.L, .02, .98), .62 + rnd() * .36, esp || e[0], teinte || e[2][Math.floor(rnd() * e[2].length)], rnd, true);
    f.z = 1; f.voile = 0; this.fl.push(f); this.poser();
    for (var i = 0; i < this.fl.length; i++) { var d = this.fl[i].x - x; if (Math.abs(d) < 150 && this.fl[i] !== f) this.fl[i].v += (d < 0 ? -1 : 1) * (1 - Math.abs(d) / 150) * 3.2; }
    var nb = this.fl.filter(function (q) { return q.plantee; });
    if (nb.length > 26) { var vieux = nb[0]; this.fl.splice(this.fl.indexOf(vieux), 1); }
    return f;
  };
  Jardin.prototype.petales = function (x, y, teinte, n, force) {
    if (E.calme) n = Math.ceil(n / 2);
    var t = E.TEINTES[teinte] || E.TEINTES.rose;
    for (var i = 0; i < n && this.pet.length < 44; i++) {
      var a = -Math.PI / 2 + (Math.random() - .5) * 2.4, v = (60 + Math.random() * 150) * (force || 1);
      this.pet.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: Math.random() * TAU, vr: (Math.random() - .5) * 8, s: 5 + Math.random() * 6, c: t[i % 3 === 2 ? 2 : 0], vie: 1.6 + Math.random() * 1.2, age: 0 });
    }
  };
  Jardin.prototype.pointeur = function (cx, cy, t) {
    var r = this.cv.getBoundingClientRect();
    if (cy < r.top - 140 || cy > r.bottom + 60) { this.px = -9999; return; }
    var x = cx - r.left, y = cy - r.top, dt = Math.max(8, t - this.dernier);
    if (this.px > -9000 && dt < 200) { this.pvx = this.pvx * .5 + (x - this.px) / dt * 1000 * .5; this.pvy = (y - this.py) / dt * 1000; } else { this.pvx = 0; this.pvy = 0; }
    this.px = x; this.py = y; this.dernier = t;
  };
  Jardin.prototype.image = function (t, dt) {
    var c = this.c, o = this.o, dpr = this.dpr, L = this.L, H = this.H, i, f;
    if (!L) return;
    if (!this.parti) { this.parti = true; this.t0 = t; }
    var age = (t - this.t0) / 1000, calme = E.calme ? .6 : 1, lent = o.lent ? .5 : 1;
    if (t - this.dernier > 2500) this.px = -9999; // le doigt est parti
    this.pvx *= Math.pow(.02, dt); this.souffle *= Math.pow(.05, dt);
    var R = L < 700 ? 96 : 130, tt = t / 1000;
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, this.cv.width, this.cv.height);
    var feuille = feuillePath();
    for (i = 0; i < this.fl.length; i++) {
      f = this.fl[i];
      // pousse
      var but;
      if (f.plantee) but = borne((t - f.ne) / 900, 0, 1);
      else if (o.pousse === 'defile') but = borne((this.cible - f.seuil * .6) / .4, 0, 1);
      else but = borne((age - f.retard * (E.calme ? .5 : 1)) / 1.1, 0, 1);
      f.g += (but - f.g) * Math.min(1, dt * (o.pousse === 'defile' ? 7 : 30));
      if (f.g < .004) continue;
      var gt = sortie(Math.min(1, f.g * 1.3)), gh = rebond((f.g - .4) / .6), Lg = f.Lg * gt;
      // vent, doigt, ressort
      var vent = (Math.sin(tt * .9 * f.vit * lent + f.ph + f.x * .004) * .055 + Math.sin(tt * .37 * lent + f.ph * 2) * .035) * calme + this.souffle;
      var hx = f.x + Math.sin(f.a + f.courbe * .3) * Lg, hy = f.y - Math.cos(f.a) * Lg, pous = 0;
      if (this.px > -9000) {
        var dx = hx - this.px, dy = hy - this.py, d = Math.sqrt(dx * dx + dy * dy);
        var mx = (f.x + hx) / 2 - this.px, my = (f.y + hy) / 2 - this.py, d2 = Math.sqrt(mx * mx + my * my);
        if (d2 < d) { d = d2; dx = mx; }
        if (d < R) {
          var k = 1 - d / R; k *= k;
          pous = (dx >= 0 ? 1 : -1) * k * .85 + borne(this.pvx * .0016, -.9, .9) * k;
          if (Math.abs(this.pvx) > 500 && k > .35 && Math.random() < .05 && ESP[f.esp].face) this.petales(hx, hy, f.teinte, 2, .6);
        }
      }
      var acc = (vent + pous - f.a) * f.raide - f.v * 5.2;
      f.v += acc * dt; f.a += f.v * dt; f.a = borne(f.a, -1.25, 1.25);
      // tige
      var a = f.a, tx = f.x + Math.sin(a) * Lg + f.courbe * Lg * .12, ty = f.y - Math.cos(a) * Lg, qx = f.x + f.courbe * Lg * .3, qy = f.y - Lg * .56;
      var ep = Math.max(3.5, f.r * .2) * (.8 + f.z * .3), vt = f.cT;
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.strokeStyle = vt; c.lineWidth = ep; c.lineCap = 'round'; c.beginPath(); c.moveTo(f.x, f.y); c.quadraticCurveTo(qx, qy, tx, ty); c.stroke();
      // feuilles
      for (var j = 0; j < 2; j++) {
        var fe = f.fe[j], u = fe[0]; if (gt < u + .1) continue;
        var w = 1 - u, bx = w * w * f.x + 2 * w * u * qx + u * u * tx, by = w * w * f.y + 2 * w * u * qy + u * u * ty;
        var tg = Math.atan2(2 * w * (qy - f.y) + 2 * u * (ty - qy), 2 * w * (qx - f.x) + 2 * u * (tx - qx));
        var ang = tg + fe[1] * (.95 - Math.abs(f.v) * .02), ll = f.r * 1.5 * fe[2] * sortie((gt - u - .1) * 3), ca = Math.cos(ang) * ll * dpr, sa = Math.sin(ang) * ll * dpr;
        c.setTransform(ca, sa, -sa * fe[1], ca * fe[1], bx * dpr, by * dpr);
        c.fillStyle = f.cF[j]; c.fill(feuille);
      }
      // tête : tournée, jamais étirée
      if (gh > .01) {
        var sp = f.sp, face = ESP[f.esp].face, rot = face ? a * .55 + f.tourne * .08 - .04 + Math.sin(tt * .5 + f.ph) * .05 * calme : a * 1.15 + f.courbe * .25;
        var co = Math.cos(rot) * gh * dpr, si = Math.sin(rot) * gh * dpr;
        c.setTransform(co, si, -si, co, tx * dpr, ty * dpr); c.drawImage(sp.cv, -sp.ax, -sp.ay, sp.w, sp.h);
      }
      f.tx = tx; f.ty = ty;
    }
    // pétales envolés
    if (this.pet.length) {
      var pp = petalePath();
      for (i = this.pet.length - 1; i >= 0; i--) {
        var p = this.pet[i]; p.age += dt; if (p.age > p.vie) { this.pet.splice(i, 1); continue; }
        p.vy += 260 * dt; p.vx *= Math.pow(.25, dt); p.vy *= Math.pow(.45, dt); p.x += (p.vx + Math.sin(p.age * 5 + p.r) * 40) * dt; p.y += p.vy * dt; p.r += p.vr * dt;
        var al = Math.min(1, (p.vie - p.age) * 2), cs = Math.cos(p.r) * p.s * dpr, sn = Math.sin(p.r) * p.s * dpr;
        c.setTransform(cs, sn, -sn * .62, cs * .62, p.x * dpr, p.y * dpr); c.globalAlpha = al; c.fillStyle = p.c; c.fill(pp); c.globalAlpha = 1;
      }
    }
    if (this.pap.length) this.papillons(t, dt);
    // la butte, par-dessus le pied des tiges
    if (o.sol) {
      c.setTransform(dpr, 0, 0, dpr, 0, 0); c.fillStyle = o.sol; c.beginPath(); c.moveTo(-2, H + 2);
      for (var x = -2; x <= L + 12; x += 12) c.lineTo(x, this.yButte(x));
      c.lineTo(L + 2, H + 2); c.closePath(); c.fill();
    }
  };
  // Les papillons : ils vont de fleur en fleur, se posent, et s'envolent quand le doigt ou la souris approche.
  var AILES = [['#ffd84f', '#f57b4e'], ['#ffffff', '#ffabc9'], ['#9db4ff', '#ffffff'], ['#ffe793', '#ffffff']];
  Jardin.prototype.lacher = function (n) {
    this.pap = [];
    for (var i = 0; i < n; i++) this.pap.push({ x: this.L * (.2 + .6 * Math.random()), y: -30 - i * 40, vx: 0, vy: 0, bx: 0, by: 0, but: null, etat: 0, temps: 0, ph: Math.random() * TAU, c: AILES[i % AILES.length], s: (this.L < 700 ? 12 : 16) + (i % 2) * 2 });
  };
  Jardin.prototype.papillons = function (t, dt) {
    var c = this.c, dpr = this.dpr, tt = t / 1000, i, p, pp = petalePath();
    for (i = 0; i < this.pap.length; i++) {
      p = this.pap[i];
      // le doigt approche : on s'envole
      if (this.px > -9000 && p.etat !== 2) {
        var ex = p.x - this.px, ey = p.y - this.py;
        if (ex * ex + ey * ey < 130 * 130) { p.etat = 2; p.but = null; p.temps = 1; p.bx = borne(p.x + (ex >= 0 ? 1 : -1) * (160 + Math.random() * 220), 20, this.L - 20); p.by = Math.max(70, p.y - 90 - Math.random() * 140, this.H - (this.o.butte == null ? 46 : this.o.butte) - this.zonePx(p.bx / this.L) - 24); }
      }
      if (p.etat === 2) { p.temps -= dt; if (p.temps <= 0) { p.etat = 0; p.but = null; } }
      if (p.etat !== 2 && !p.but) {
        for (var essais = 0; essais < 14; essais++) { var f = this.fl[Math.floor(Math.random() * this.fl.length)]; if (f && f.g > .9 && f.tx != null && ESP[f.esp].face && f.ty > 80 && f.tx > 24 && f.tx < this.L - 24 && (!p.but || f.ty < p.but.ty)) p.but = f; }
        if (!p.but) { p.bx = this.L * (.15 + .7 * Math.random()); p.by = this.H - (this.o.butte == null ? 46 : this.o.butte) - this.zonePx(p.bx / this.L) * .7; }
        p.etat = 0;
      }
      if (p.but) { p.bx = p.but.tx; p.by = p.but.ty - p.but.r * .55; }
      var pres = Math.abs(p.x - p.bx) < 8 && Math.abs(p.y - p.by) < 8;
      if (p.etat === 0 && p.but && pres) { p.etat = 1; p.temps = 1.2 + Math.random() * 2.8; }
      else if (p.etat === 1) { p.temps -= dt; if (p.temps <= 0) { p.etat = 0; p.but = null; } }
      var pose = p.etat === 1;
      var k = p.etat === 2 ? 9 : pose ? 14 : 4.2, dx = p.bx - p.x, dy = p.by - p.y;
      p.vx += (dx * k - p.vx * 3.4) * dt; p.vy += (dy * k - p.vy * 3.4) * dt;
      var vm = p.etat === 2 ? 520 : 230, v = Math.sqrt(p.vx * p.vx + p.vy * p.vy); if (v > vm) { p.vx *= vm / v; p.vy *= vm / v; }
      p.x += p.vx * dt; p.y += p.vy * dt + (pose ? 0 : Math.sin(tt * 11 + p.ph) * 22 * dt);
      // dessin : les ailes battent (elles se referment et s'ouvrent), le corps au milieu
      var bat = pose ? .25 + .75 * Math.abs(Math.sin(tt * 2.2 + p.ph)) : .18 + .82 * Math.abs(Math.sin(tt * 15 + p.ph)), inc = borne(p.vx * .0022, -.6, .6), s = p.s * dpr;
      var co = Math.cos(inc), si = Math.sin(inc);
      for (var cote = -1; cote <= 1; cote += 2) {
        var e = cote * bat;
        // aile du haut
        c.setTransform(co * s * e * 1.25, si * s * e * 1.25, -si * s * 1.25, co * s * 1.25, p.x * dpr, p.y * dpr); c.transform(1, 0, 0, 1, .62, -.5); c.rotate(.5); c.fillStyle = p.c[0]; c.fill(pp);
        // aile du bas
        c.setTransform(co * s * e * .85, si * s * e * .85, -si * s * .85, co * s * .85, p.x * dpr, p.y * dpr); c.transform(1, 0, 0, 1, .6, .62); c.rotate(-.5); c.fillStyle = p.c[1]; c.fill(pp);
      }
      c.setTransform(co * s, si * s, -si * s, co * s, p.x * dpr, p.y * dpr); c.fillStyle = '#2c1631'; c.beginPath(); c.ellipse(0, 0, .2, 1.05, 0, 0, TAU); c.fill();
    }
  };
  E.Jardin = Jardin;
  E.jardins = jardins;

  // ---------- une seule boucle pour toute la page ----------
  var suivis = [], dernierT = 0, lance = false;
  E.chaqueImage = function (f) { suivis.push(f); };
  function boucle(t) {
    var dt = Math.min(.05, (t - dernierT) / 1000 || .016); dernierT = t;
    for (var i = 0; i < jardins.length; i++) if (jardins[i].vu) jardins[i].image(t, dt);
    for (i = 0; i < suivis.length; i++) suivis[i](t, dt);
    requestAnimationFrame(boucle);
  }
  E.demarrer = function () {
    if (lance) return; lance = true;
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) { es.forEach(function (e) { for (var i = 0; i < jardins.length; i++) if (jardins[i].cv === e.target) { jardins[i].vu = e.isIntersecting; if (e.isIntersecting) jardins[i].mesure(); } }); }, { rootMargin: '120px 0px' });
      jardins.forEach(function (j) { io.observe(j.cv); });
      E.observer = function (j) { io.observe(j.cv); };
    } else { jardins.forEach(function (j) { j.vu = true; }); E.observer = function (j) { j.vu = true; }; }
    function bouge(e) { var t = performance.now(); for (var i = 0; i < jardins.length; i++) if (jardins[i].vu) jardins[i].pointeur(e.clientX, e.clientY, t); }
    window.addEventListener('pointermove', bouge, { passive: true });
    window.addEventListener('pointerdown', bouge, { passive: true });
    window.addEventListener('touchmove', function (e) { var p = e.touches[0]; if (p) bouge(p); }, { passive: true });
    document.addEventListener('pointerleave', function () { jardins.forEach(function (j) { j.px = -9999; }); });
    var yAvant = window.scrollY, tAvant = performance.now();
    window.addEventListener('scroll', function () {
      var t = performance.now(), v = (window.scrollY - yAvant) / Math.max(8, t - tAvant); yAvant = window.scrollY; tAvant = t;
      var s = borne(v * .09, -.3, .3) * (E.calme ? .4 : 1);
      for (var i = 0; i < jardins.length; i++) if (jardins[i].vu) jardins[i].souffle = jardins[i].souffle * .6 + s * .4;
    }, { passive: true });
    var larg = window.innerWidth;
    window.addEventListener('resize', function () { jardins.forEach(function (j) { j.mesure(); }); larg = window.innerWidth; });
    requestAnimationFrame(boucle);
  };
})();
