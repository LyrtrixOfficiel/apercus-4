// Les 24 fruits et légumes de la maquette, dessinés en aplats francs (boîte 64 x 64, sans dégradé ni renvoi interne).
// window.fruit('orange') rend un <svg> prêt à poser ; window.FRUITS garde le tracé nu (pour la roue).
(function () {
  'use strict';
  var n = function (v) { return Math.round(v * 100) / 100; };
  // Croissant d'ombre en bas à droite d'un rond.
  function croissant(r, k) {
    var a1 = -25 * Math.PI / 180, a2 = 115 * Math.PI / 180, R = n(r * (k || 1.5));
    var x1 = n(r * Math.cos(a1)), y1 = n(r * Math.sin(a1)), x2 = n(r * Math.cos(a2)), y2 = n(r * Math.sin(a2));
    return 'M' + x1 + ' ' + y1 + 'A' + r + ' ' + r + ' 0 0 1 ' + x2 + ' ' + y2 + 'A' + R + ' ' + R + ' 0 0 0 ' + x1 + ' ' + y1 + 'z';
  }
  function boule(cx, cy, rx, ry, c1, c2, k) {
    return '<g transform="translate(' + cx + ' ' + cy + ') scale(1 ' + n(ry / rx) + ')"><circle r="' + rx + '" fill="' + c1 + '"/><path d="' + croissant(rx, k) + '" fill="' + c2 + '"/></g>';
  }
  function reflet(cx, cy, rx, ry, rot, o) {
    return '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" fill="#fff" opacity="' + (o || 0.4) + '" transform="rotate(' + rot + ' ' + cx + ' ' + cy + ')"/>';
  }
  // Feuille en amande partant de (x, y) dans la direction rot, longueur l.
  function feuille(x, y, rot, l, c, e) {
    var h = n(l * (e || 0.3));
    return '<path transform="translate(' + x + ' ' + y + ') rotate(' + rot + ')" d="M0 0C' + n(l * 0.25) + ' ' + (-h) + ' ' + n(l * 0.72) + ' ' + (-h) + ' ' + l + ' 0C' + n(l * 0.72) + ' ' + h + ' ' + n(l * 0.25) + ' ' + h + ' 0 0z" fill="' + c + '"/>';
  }
  var V1 = '#3f8f36', V2 = '#57a845', V3 = '#2f7a2e';
  var F = {};

  F.orange = boule(32, 37, 23, 23, '#f7931e', '#df6e0d') + reflet(22.5, 28, 6.5, 3.4, -35, 0.45) +
    '<circle cx="32" cy="16" r="2.8" fill="#3d6b27"/>' + feuille(33, 15, -32, 18, V2, 0.34);

  F.clementine = boule(32, 40, 23, 19.5, '#fba51d', '#ea800d') + reflet(22, 32, 6.5, 3, -28, 0.45) +
    feuille(32, 22, -152, 17, V1, 0.34) + feuille(32, 22, -34, 19, V2, 0.34) + '<circle cx="32" cy="22.5" r="2.6" fill="#3d6b27"/>';

  F.citron = '<g transform="rotate(-18 32 34)"><path d="M50 27c6 1 10 3.500 11 7-1 3.500-5 6-11 7z" fill="#ffd61f"/><path d="M12 30.500c-3.500.6-6 1.800-7 3.500 1 1.700 3.500 2.900 7 3.500z" fill="#f2bb0a"/>' +
    boule(31, 34, 22, 16.5, '#ffd61f', '#f0b400') + reflet(22, 27.5, 7.5, 3, -18, 0.5) + '</g>';

  (function () {
    var s = '<circle cx="32" cy="34" r="24.5" fill="#8a5a2b"/><circle cx="32" cy="34" r="21" fill="#9fca3c"/><circle cx="32" cy="34" r="15" fill="#b9dd55"/><ellipse cx="32" cy="34" rx="6.500" ry="6" fill="#f4f3cf"/>';
    for (var i = 0; i < 14; i++) s += '<ellipse cx="32" cy="23.200" rx="1.150" ry="2.300" fill="#2b2118" transform="rotate(' + n(i * 360 / 14) + ' 32 34)"/>';
    F.kiwi = s + reflet(20, 21, 5, 2, -40, 0.3);
  })();

  F.fraise = '<path d="M32 59C22 53 11 41 11 29c0-8 6-13 12.500-13 3.600 0 6.600 1.500 8.500 4 1.900-2.500 4.900-4 8.500-4C47 16 53 21 53 29c0 12-11 24-21 30z" fill="#e63246"/>' +
    '<path d="M53 29c0 12-11 24-21 30 9-9 17-22 18.400-37.400C52 23.500 53 26 53 29z" fill="#c21f31"/>' +
    [[21, 29], [30, 27], [40, 29], [25, 37], [35, 36], [44, 36], [30, 45], [38, 45], [33, 53]].map(function (p) { return '<ellipse cx="' + p[0] + '" cy="' + p[1] + '" rx="1.200" ry="1.900" fill="#ffd95a"/>'; }).join('') +
    feuille(32, 19, -176, 13, V1, 0.36) + feuille(32, 19, -4, 13, V1, 0.36) + feuille(32, 19, -138, 13.500, V2, 0.36) + feuille(32, 19, -42, 13.500, V2, 0.36) + feuille(32, 19, -90, 10, V3, 0.4);

  F.cerise = '<path d="M21 42C22 28 27 17 37 9M43 44C42 30 40 18 37 9" fill="none" stroke="#5c8a2c" stroke-width="2.600" stroke-linecap="round"/>' +
    feuille(37, 9, 14, 19, V2, 0.34) + boule(21, 46, 12.500, 12.500, '#d4183a', '#a50e29') + reflet(16.500, 41, 3.400, 1.800, -35, 0.5) +
    boule(43, 48, 12.500, 12.500, '#c5142f', '#960b24') + reflet(38.500, 43, 3.400, 1.800, -35, 0.5);

  F.abricot = '<path d="M33 17v-6" stroke="#6b4a22" stroke-width="2.800" stroke-linecap="round"/>' + feuille(34, 13, -22, 16, V2, 0.34) +
    boule(32, 38, 21, 21.500, '#fdb23c', '#ef8a1e') + '<ellipse cx="23" cy="41" rx="8.500" ry="12" fill="#f26a3a" opacity=".35"/>' +
    '<path d="M34 17.500c-6 9-7 26-1 41" fill="none" stroke="#de7818" stroke-width="2.400" stroke-linecap="round"/>' + reflet(43, 29, 4.200, 2.300, -40, 0.45);

  F.peche = '<path d="M33 17v-6" stroke="#6b4a22" stroke-width="2.800" stroke-linecap="round"/>' + feuille(34, 13, -18, 23, '#4c9a36', 0.26) +
    boule(32, 39, 23, 21.500, '#f9a45c', '#ea6c40') + '<path d="M9.500 40c0-12 9-21.500 21-22.500-6 8-8 29-2 42.500-10.500-1.500-19-9-19-20z" fill="#e5483a" opacity=".5"/>' +
    '<path d="M32 18c-6 9-7 26-1.500 42" fill="none" stroke="#d6532f" stroke-width="2.400" stroke-linecap="round"/>' + reflet(43, 29, 5, 2.600, -40, 0.4);

  F.melon = '<path d="M32 15c0-3 1-5.500 3.500-8" stroke="#7a6a3a" stroke-width="3.600" stroke-linecap="round" fill="none"/>' +
    boule(32, 37, 24, 23, '#d8dc92', '#bcc06c') +
    '<g fill="none" stroke="#5f9146" stroke-width="2.600" stroke-linecap="round"><path d="M32 14.500v45"/><path d="M32 14.500C20 21 20 53 32 59.500"/><path d="M32 14.500C44 21 44 53 32 59.500"/><path d="M32 14.500C8 21 8 53 32 59.500"/><path d="M32 14.500C56 21 56 53 32 59.500"/></g>' +
    reflet(21, 26, 5, 2.400, -38, 0.35);

  F.tomate = boule(32, 39, 24, 21, '#e83a2c', '#c0231c') + reflet(20.500, 31, 6.500, 3, -30, 0.45) +
    '<path d="M32 20c0-3 .5-6 1.500-9" stroke="#3d7a2a" stroke-width="3" stroke-linecap="round" fill="none"/>' +
    feuille(32, 20, -172, 14, V1, 0.3) + feuille(32, 20, -8, 14, V1, 0.3) + feuille(32, 20, 150, 11, V2, 0.34) + feuille(32, 20, 30, 11, V2, 0.34) + feuille(32, 20, 90, 9, V3, 0.4);

  F.aubergine = '<g transform="rotate(28 32 34)"><rect x="29.500" y="3" width="5" height="12" rx="2.500" fill="#3d7a2c"/>' +
    '<path d="M32 16c11 0 18 13 18 25.500C50 52 42 60 32 60s-18-8-18-18.500C14 29 21 16 32 16z" fill="#5a2a72"/>' +
    '<path d="M50 41.500C50 52 42 60 32 60c8-3 12-10 12-19 0-9-3-17-8-23 8 3 14 13 14 23.500z" fill="#431d58"/>' +
    reflet(22.500, 38, 3.200, 10, 8, 0.26) +
    '<path d="M20.500 25c1-7.500 6-12 11.500-12s10.500 4.500 11.500 12c-2.500 2-5-1-7.500 2.500-1.500-3-6.500-3-8 0-2.500-3.500-5-.5-7.500-2.500z" fill="#4f9a3a"/></g>';

  F.courgette = '<g transform="rotate(-38 32 32)"><path d="M53 26l8-1.500v15L53 38z" fill="#9db86a"/><rect x="4" y="22" width="51" height="20" rx="10" fill="#4e9a3b"/>' +
    '<path d="M6.500 37.500C8.500 40.300 11.500 42 14 42h31c5.500 0 10-4.500 10-10 0-1-.2-2-.5-3-2 5-6 8.500-11 8.500z" fill="#3a7f2e"/>' +
    [[15, 28], [23, 31], [32, 27], [40, 30.500], [47, 27.500]].map(function (p) { return '<ellipse cx="' + p[0] + '" cy="' + p[1] + '" rx="2.400" ry="1" fill="#96d472" opacity=".8"/>'; }).join('') +
    '<rect x="11" y="24.500" width="30" height="2.600" rx="1.300" fill="#fff" opacity=".22"/></g>';

  F.poivron = '<path d="M29 21c0-5 1.500-9 5-12l4.500 3c-3 2.500-3.500 5.500-3.500 9z" fill="#3f8a33"/>' +
    '<path d="M12 33c0-9 6-15 13-13 2-2.500 12-2.500 14 0 7-2 13 4 13 13 0 13-5 24-12 27-3 1-4.500-1-8-1s-5 2-8 1c-7-3-12-14-12-27z" fill="#e3352b"/>' +
    '<path d="M52 33c0 13-5 24-12 27 5-6 8-16 8-27 0-5-2-9.500-5-12.500 5-.5 9 4.500 9 12.500z" fill="#bd221b"/>' +
    '<path d="M25 22c-3 9-3 26 2 37M39 22c3 9 3 26-2 37" fill="none" stroke="#c7271f" stroke-width="2.200" stroke-linecap="round"/>' + reflet(19, 33, 2.400, 8, 8, 0.35);

  F.figue = '<path d="M32 11V5" stroke="#6f7f35" stroke-width="3.800" stroke-linecap="round"/>' +
    '<path d="M32 9c1.500 8 17 17 17 32 0 10-7.500 18-17 18s-17-8-17-18c0-15 15.500-24 17-32z" fill="#5c2a63"/>' +
    '<path d="M49 41c0 10-7.500 18-17 18 8-3 12-10 12-18 0-9-5-16-9-22 6 5 14 12 14 22z" fill="#43204a"/>' +
    '<path d="M31 17c-6 8-9.500 16-9.500 25M32 18c1 9 1 29 0 39M33.500 18c4.500 7 7.500 15 7.500 24" stroke="#8a5596" stroke-width="1.800" fill="none" stroke-linecap="round" opacity=".7"/>' + reflet(23, 40, 2.800, 7, 14, 0.25);

  (function () {
    var s = '<path d="M33 17V7M33 9.500l8-3.500" stroke="#7a5a2b" stroke-width="2.800" stroke-linecap="round" fill="none"/>' + feuille(32, 11, -164, 19, V2, 0.42);
    var rangs = [[25, [13.500, 26.500, 39.500, 52.500]], [35.500, [20, 33, 46]], [46, [26.500, 39.500]], [56, [33]]], k = 0;
    rangs.forEach(function (r) { r[1].forEach(function (x) { s += '<circle cx="' + x + '" cy="' + r[0] + '" r="7.200" fill="' + (k++ % 2 ? '#7c3a94' : '#6a2c82') + '"/><circle cx="' + (x - 2.500) + '" cy="' + (r[0] - 2.500) + '" r="1.900" fill="#fff" opacity=".4"/>'; }); });
    F.raisin = s;
  })();

  F.pomme = '<path d="M32 23c0-5 1.500-9 4.500-12" stroke="#6b4a22" stroke-width="2.800" fill="none" stroke-linecap="round"/>' + feuille(34.500, 15, -20, 16, V2, 0.34) +
    '<path d="M32 21c5-5 15-4.500 19 3 5 9.500 1 24-7 31-4 3.400-7.500 2.400-12 .4-4.500 2-8 3-12-.4-8-7-12-21.500-7-31 4-7.500 14-8 19-3z" fill="#d92a30"/>' +
    '<path d="M51 24c5 9.500 1 24-7 31-4 3.400-7.500 2.400-12 .4 9.500-.4 16-9 17-19.400.4-5-.5-10-3-14 2 .2 4 .4 5 2z" fill="#b11a23"/>' +
    reflet(21.500, 31, 2.800, 7, 16, 0.38);

  F.chataigne = '<path d="M32 8l-2.500-4.500M32 8l3-4M32 8V2" stroke="#d2b07a" stroke-width="1.800" stroke-linecap="round"/>' +
    '<path d="M32 7c1.500 5 5.500 7.500 12 10.500 9 4.500 13.500 13.500 11.500 23.500C53.500 50.500 44 57 32 57S10.500 50.500 8.500 41C6.500 31 11 22 20 17.500 26.500 14.500 30.500 12 32 7z" fill="#7b4a25"/>' +
    '<path d="M55.500 41C53.500 50.500 44 57 32 57c9-2 16-8 17-16 1-8-2-15-7-20 9 4 15 11 13.500 20z" fill="#5e3417"/>' +
    '<path d="M12.500 46c4 6.500 11 11 19.500 11s15.500-4.500 19.500-11c-5-3.500-12-5-19.500-5s-14.500 1.500-19.500 5z" fill="#d6b680"/>' +
    '<path d="M22 24c-4 4-6 9-6 13" stroke="#a9713f" stroke-width="3" stroke-linecap="round" fill="none"/>';

  F.potiron = '<path d="M29 21c0-5 1-8.500 4.500-11l4.500 2.500c-2.500 2-3 5-3 8.500z" fill="#5f7d2e"/>' +
    '<ellipse cx="13.500" cy="40" rx="10" ry="15" fill="#e8791b"/><ellipse cx="50.500" cy="40" rx="10" ry="15" fill="#d6620d"/>' +
    '<ellipse cx="22.500" cy="39" rx="10.500" ry="18" fill="#f28a1a"/><ellipse cx="41.500" cy="39" rx="10.500" ry="18" fill="#e5741a"/>' +
    '<ellipse cx="32" cy="39" rx="9.500" ry="19.500" fill="#f79a2b"/>' + reflet(27.500, 29, 2.200, 6.500, 10, 0.35);

  F.endive = '<path d="M32 5c9 9 15 23 13.500 37C44.500 51 39 59 32 59s-12.500-8-13.500-17C17 28 23 14 32 5z" fill="#f6f0c6"/>' +
    '<path d="M45.500 42C44.500 51 39 59 32 59c5-3 8-9 9-17 1-8 0-15-3-22 5 6 8.500 14 7.500 22z" fill="#e0d79c"/>' +
    '<path d="M32 5c5 5 9 12 11.500 20-4-3-7.500-4.500-11.500-4.500s-7.500 1.500-11.500 4.500C23 17 27 10 32 5z" fill="#e3de5e"/>' +
    '<path d="M32 23v33M25.500 28c-2 9-2 18 .5 26M38.500 28c2 9 2 18-.5 26" stroke="#d2c97c" stroke-width="2" fill="none" stroke-linecap="round"/>';

  F.poireau = '<g transform="rotate(24 32 34)"><path d="M32 35C30 23 24 12 15 5c-1 9 3 21 10 30z" fill="#2f7d38"/><path d="M32 35c2-12 8-23 17-30 1 9-3 21-10 30z" fill="#3f9143"/><path d="M27 35c0-12 2-24 5-32 3 8 5 20 5 32z" fill="#57a84f"/>' +
    '<rect x="26.500" y="30" width="11" height="27" rx="5" fill="#f5f3e0"/><path d="M26.500 39v-7c0-1 1-2 2-2h7c1 0 2 1 2 2v7c-3 2-8 2-11 0z" fill="#b9db8c"/><rect x="33.500" y="38" width="4" height="18" rx="2" fill="#e0ddc2"/>' +
    '<path d="M28 57l-2 5M32 58v5M36 57l2 5M30 58l-1 5M34 58l1 5" stroke="#c2a66a" stroke-width="1.500" stroke-linecap="round"/></g>';

  F.radis = feuille(32, 26, -124, 21, V1, 0.34) + feuille(32, 26, -56, 21, V1, 0.34) + feuille(32, 26, -90, 23, V2, 0.3) +
    '<path d="M27 51c2 2 4 3 5 3s3-1 5-3c-1 4-3 8-5 11-2-3-4-7-5-11z" fill="#f7eef0"/>' +
    boule(32, 40, 15.500, 15, '#e8335e', '#c21d47') + '<path d="M19 46.500c3 5 7.500 8.500 13 8.500s10-3.500 13-8.500c-3 3-7.500 4.500-13 4.500s-10-1.500-13-4.500z" fill="#f7eef0" opacity=".92"/>' + reflet(25.500, 34.500, 4.200, 2.200, -35, 0.5);

  (function () {
    function tige(x, rot) {
      return '<g transform="translate(' + x + ' 61) rotate(' + rot + ')"><path d="M-4.800 0V-40c0-6 2.200-11 4.800-14 2.600 3 4.800 8 4.800 14V0z" fill="#72b24c"/>' +
        '<path d="M0-54c2.600 3 4.800 8 4.800 13.500-1.600-2-3.200-3-4.800-3s-3.200 1-4.800 3C-4.800-46 -2.600-51 0-54z" fill="#6d4f86"/>' +
        '<path d="M-4.800-30l4.800 5 4.800-5M-4.800-19l4.800 5 4.800-5" stroke="#4f8a36" stroke-width="1.700" fill="none" stroke-linejoin="round"/></g>';
    }
    F.asperge = tige(20.500, -10) + tige(43.500, 10) + tige(32, 0) + '<path d="M12.500 40c6 3 13 4.500 19.500 4.500S45.500 43 51.500 40v7.500c-6 3-13 4.500-19.500 4.500s-13.500-1.500-19.500-4.500z" fill="#d94a3a"/>';
  })();

  F.pois = '<g transform="rotate(-14 32 34)"><path d="M60 31c2.500-1 3.500-3 2.500-5.500" stroke="#3f8f36" stroke-width="2.400" fill="none" stroke-linecap="round"/>' +
    '<path d="M2.500 31c8-9.500 18.500-14 29.500-14s21.500 4.500 29.500 14c-8 10.500-18.500 16-29.500 16S10.500 41.500 2.500 31z" fill="#3f8f36"/>' +
    '<path d="M8.500 31c7-6.500 14.500-10 23.500-10s16.500 3.500 23.500 10c-7 7-14.500 11-23.500 11S15.500 38 8.500 31z" fill="#2c722b"/>' +
    [[15.200, 5.400], [26.300, 6.600], [37.700, 6.600], [48.800, 5.400]].map(function (p) { return boule(p[0], 31.500, p[1], p[1], '#a2dc5e', '#7fc246') + reflet(p[0] - 2, 29, 1.900, 1.100, -35, 0.55); }).join('') + '</g>';

  F.chou = '<circle cx="32" cy="36" r="24" fill="#6fae4c"/><path d="M32 60C17 59 8 48 8 35c0-3 .5-6 1.500-8.500C19 28 29 39 32 60z" fill="#5a9a3f"/>' +
    '<path d="M32 60c15-1 24-12 24-25 0-3-.5-6-1.500-8.500C45 28 35 39 32 60z" fill="#82c35c"/><circle cx="32" cy="32" r="15.500" fill="#a9da7c"/>' +
    '<path d="M32 16.500c8.500 0 15.500 7 15.500 15.500 0 2-.4 4-1.100 5.700C43 30 38 26 32 25.500z" fill="#93cc66"/>' +
    '<path d="M32 19v25M32 27l-8.500-5M32 27l8.500-5M32 35l-10.500-3M32 35l10.500-3" stroke="#e8f6cc" stroke-width="1.900" stroke-linecap="round" fill="none"/>';

  // Un fruit encore emballé dans son papier de soie, avec sa gommette.
  window.emballe = function (couleur, cls) {
    return '<svg class="fr' + (cls ? ' ' + cls : '') + '" viewBox="0 0 64 64" aria-hidden="true" focusable="false">' +
      '<path d="M32 15c-3-5-9-9-13-9 2 4 4 8 7 11zM32 15c3-5 9-9 13-9-2 4-4 8-7 11zM32 16c-1.500-5-1.500-10 0-14 1.500 4 1.500 9 0 14z" fill="#fff8e6"/>' +
      boule(32, 38, 23, 22.500, '#fff8e6', '#ead7ae') +
      '<path d="M32 16c-6 6-12 9-18 10M32 16c6 6 12 9 18 10M31 17c-2 8-4 13-10 20M33 17c2 8 4 13 10 20" stroke="#e0c998" stroke-width="2" fill="none" stroke-linecap="round"/>' +
      '<circle cx="32" cy="43" r="9.500" style="fill:' + (couleur || '#d9631a') + '"/><path d="M34.300 37.500l-7.300 7.800v1.600h6.300v2.600h3v-2.600h1.700v-2.300h-1.700v-7.100zm-1 3.500v3.600h-3.300z" fill="#fff"/></svg>';
  };
  window.FRUITS = F;
  window.fruit = function (id, cls) { return '<svg class="fr' + (cls ? ' ' + cls : '') + '" viewBox="0 0 64 64" aria-hidden="true" focusable="false">' + (F[id] || '') + '</svg>'; };
})();
