/* Le fil d'or : le système nerveux dessiné.
 *
 * Une ligne dorée traverse tout le site, derrière le texte. Sa forme dit l'état du corps :
 *   tension 1   le mode alerte : la ligne tremble, se hérisse, fait des pics
 *   tension 0   la sécurité intérieure : une seule onde lente, qui respire
 * Entre les deux, tout se mélange en continu. Chaque section déclare sa tension (data-tension) et la
 * hauteur du fil (data-fil, en part de l'écran) ; site.js les lit au défilement et les donne ici.
 *
 * La respiration : 4 secondes d'inspiration, 6 d'expiration. Quand la tension est basse, l'onde suit
 * ce souffle, et le bouton « Respirez avec la ligne » de l'accueil l'affiche.
 */
(function () {
  'use strict';

  var INSPIRE = 4, EXPIRE = 6, CYCLE = INSPIRE + EXPIRE;

  // Le souffle au temps t (secondes) : 0 poumons vides, 1 poumons pleins, adouci aux deux bouts.
  function souffle(t) {
    var p = t % CYCLE;
    var x = p < INSPIRE ? p / INSPIRE : 1 - (p - INSPIRE) / EXPIRE;
    return { valeur: 0.5 - 0.5 * Math.cos(Math.PI * x), inspire: p < INSPIRE };
  }

  // Bruit doux et répétable : somme de sinus aux fréquences sans rapport simple.
  function agitation(x, t, graine) {
    return Math.sin(x * 0.043 + t * 7.1 + graine) * 0.5
      + Math.sin(x * 0.091 - t * 11.3 + graine * 2.1) * 0.3
      + Math.sin(x * 0.17 + t * 17.9 + graine * 3.7) * 0.2;
  }

  // Les pics d'alerte : de brèves salves, à des endroits qui se déplacent.
  function pics(x, t, l, graine) {
    var s = 0;
    for (var k = 0; k < 3; k++) {
      var c = ((t * (0.21 + k * 0.07) + graine * 0.13 + k * 0.37) % 1) * (l + 240) - 120;
      var d = (x - c) / 16;
      if (d > -3 && d < 3) s += Math.exp(-d * d) * Math.sin(d * 3.2) * (k === 1 ? -1 : 1);
    }
    return s;
  }

  /* Dessine le fil sur un contexte 2D.
   *   o.y          hauteur du fil (pixels)
   *   o.tension    0 à 1
   *   o.ampleur    hauteur de l'onde calme (pixels)
   *   o.or         couleur principale ; o.lueur : 0 à 1 (plus forte la nuit)
   *   o.brins      nombre de fils (1 à 3) ; o.alpha : opacité générale
   */
  function dessiner(ctx, l, h, o, t) {
    var tension = Math.max(0, Math.min(1, o.tension));
    var b = souffle(t).valeur;
    var calme = 1 - tension;
    var ampleur = (o.ampleur || 22) * (0.55 + 0.45 * b) * (0.4 + 0.6 * calme);
    var nervosite = tension * tension * (o.nervosite || 26);
    var pas = l > 900 ? 5 : 4;
    var brins = o.brins || 3;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (var s = brins - 1; s >= 0; s--) {
      var ecart = (s - (brins - 1) / 2) * (6 + 18 * calme * b);
      var principal = s === Math.floor((brins - 1) / 2) || brins === 1;
      ctx.beginPath();
      for (var x = -10; x <= l + 10; x += pas) {
        var u = x / l;
        var lente = Math.sin(u * Math.PI * 2 * (o.ondes || 1.15) + t * 0.35 + s * 0.6) * ampleur;
        var nerf = agitation(x, t, s * 1.7) * nervosite;
        var alerte = tension > 0.45 ? pics(x, t, l, s) * (tension - 0.45) * 1.8 * (o.pics || 70) : 0;
        var y = o.y + ecart + lente + nerf + alerte;
        if (x === -10) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.globalAlpha = (o.alpha == null ? 1 : o.alpha) * (principal ? 1 : 0.28);
      ctx.strokeStyle = o.or || '#b8913f';
      ctx.lineWidth = principal ? (o.epaisseur || 1.6) : 1;
      if (principal && o.lueur) {
        ctx.shadowColor = o.or || '#b8913f';
        ctx.shadowBlur = 14 * o.lueur;
      } else {
        ctx.shadowBlur = 0;
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  // Un canevas à la bonne résolution, recalculé quand sa taille change.
  function preparer(canvas) {
    var ctx = canvas.getContext('2d');
    var etat = { ctx: ctx, l: 0, h: 0 };
    function taille() {
      var r = canvas.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      etat.l = r.width; etat.h = r.height;
      canvas.width = Math.round(r.width * dpr);
      canvas.height = Math.round(r.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    taille();
    etat.taille = taille;
    return etat;
  }

  window.Fil = { dessiner: dessiner, souffle: souffle, preparer: preparer, CYCLE: CYCLE };
})();
