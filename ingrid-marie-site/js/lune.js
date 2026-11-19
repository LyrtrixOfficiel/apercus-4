/* La Lune du jour, pour la scène « Lune et Soleil ».
   Dates des nouvelles et des pleines lunes calculées (Jean Meeus, Astronomical Algorithms, chapitre 49),
   justes à quelques minutes près. Rien n'est demandé à un serveur. */
(function (racine) {
  'use strict';
  var RAD = Math.PI / 180;
  // instant (ms depuis 1970, temps universel) de la lunaison k : k entier = nouvelle lune, k + 0,5 = pleine lune
  function instant(k) {
    var T = k / 1236.85, T2 = T * T, T3 = T2 * T, T4 = T3 * T;
    var jde = 2451550.09766 + 29.530588861 * k + 0.00015437 * T2 - 0.00000015 * T3 + 0.00000000073 * T4;
    var E = 1 - 0.002516 * T - 0.0000074 * T2;
    var M = (2.5534 + 29.1053567 * k - 0.0000014 * T2 - 0.00000011 * T3) * RAD;
    var Mp = (201.5643 + 385.81693528 * k + 0.0107582 * T2 + 0.00001238 * T3 - 0.000000058 * T4) * RAD;
    var F = (160.7108 + 390.67050284 * k - 0.0016118 * T2 - 0.00000227 * T3 + 0.000000011 * T4) * RAD;
    var O = (124.7746 - 1.56375588 * k + 0.0020672 * T2 + 0.00000215 * T3) * RAD;
    var pleine = Math.abs(k - Math.floor(k) - 0.5) < 0.01;
    var c = pleine
      ? [-0.40614, 0.17302, 0.01614, 0.01043, 0.00734, -0.00515, 0.00209, -0.00111, -0.00057, 0.00056, -0.00042, 0.00042, 0.00038, -0.00024, -0.00017, -0.00007, 0.00004, 0.00004, 0.00003, 0.00003, -0.00003, 0.00003, -0.00002, -0.00002, 0.00002]
      : [-0.4072, 0.17241, 0.01608, 0.01039, 0.00739, -0.00514, 0.00208, -0.00111, -0.00057, 0.00056, -0.00042, 0.00042, 0.00038, -0.00024, -0.00017, -0.00007, 0.00004, 0.00004, 0.00003, 0.00003, -0.00003, 0.00003, -0.00002, -0.00002, 0.00002];
    var s = Math.sin;
    var somme =
      c[0] * s(Mp) + c[1] * E * s(M) + c[2] * s(2 * Mp) + c[3] * s(2 * F) + c[4] * E * s(Mp - M) + c[5] * E * s(Mp + M) +
      c[6] * E * E * s(2 * M) + c[7] * s(Mp - 2 * F) + c[8] * s(Mp + 2 * F) + c[9] * E * s(2 * Mp + M) + c[10] * s(3 * Mp) +
      c[11] * E * s(M + 2 * F) + c[12] * E * s(M - 2 * F) + c[13] * E * s(2 * Mp - M) + c[14] * s(O) + c[15] * s(Mp + 2 * M) +
      c[16] * s(2 * Mp - 2 * F) + c[17] * s(3 * M) + c[18] * s(Mp + M - 2 * F) + c[19] * s(2 * Mp + 2 * F) + c[20] * s(Mp + M + 2 * F) +
      c[21] * s(Mp - M + 2 * F) + c[22] * s(Mp - M - 2 * F) + c[23] * s(3 * Mp + M) + c[24] * s(4 * Mp);
    // les quatorze termes planétaires
    var A = [
      [299.77 + 0.107408 * k - 0.009173 * T2, 325], [251.88 + 0.016321 * k, 165], [251.83 + 26.651886 * k, 164], [349.42 + 36.412478 * k, 126],
      [84.66 + 18.206239 * k, 110], [141.74 + 53.303771 * k, 62], [207.14 + 2.453732 * k, 60], [154.84 + 7.30686 * k, 56],
      [34.52 + 27.261239 * k, 47], [207.19 + 0.121824 * k, 42], [291.34 + 1.844379 * k, 40], [161.72 + 24.198154 * k, 37],
      [239.56 + 25.513099 * k, 35], [331.55 + 3.592518 * k, 23]];
    for (var i = 0; i < A.length; i++) somme += A[i][1] * 0.000001 * s(A[i][0] * RAD);
    // du temps des éphémérides au temps universel : environ 70 secondes d'écart à notre époque
    return (jde + somme - 2440587.5) * 86400000 - 70000;
  }
  var NOMS = ['Nouvelle lune', 'Premier croissant', 'Premier quartier', 'Lune gibbeuse croissante', 'Pleine lune', 'Lune gibbeuse décroissante', 'Dernier quartier', 'Dernier croissant'];
  // la Lune à un instant donné : nom de la phase, part du cycle (0 nouvelle, 0,5 pleine), prochaines pleine et nouvelle lunes
  function lune(quand) {
    var t = +quand;
    var k = Math.floor((t - instant(0)) / (29.530588861 * 86400000));
    while (instant(k) > t) k--;
    while (instant(k + 1) <= t) k++;
    var avant = instant(k), apres = instant(k + 1), pleine = instant(k + 0.5);
    var part = (t - avant) / (apres - avant);
    var jour = 86400000, nom;
    if (t - avant < jour || apres - t < jour) nom = NOMS[0];
    else if (Math.abs(t - pleine) < jour) nom = NOMS[4];
    else if (Math.abs(part - 0.25) < 0.034) nom = NOMS[2];
    else if (Math.abs(part - 0.75) < 0.034) nom = NOMS[6];
    else nom = part < 0.25 ? NOMS[1] : part < 0.5 ? NOMS[3] : part < 0.75 ? NOMS[5] : NOMS[7];
    return { nom: nom, part: part, pleine: new Date(pleine > t ? pleine : instant(k + 1.5)), nouvelle: new Date(apres) };
  }
  racine.LuneDuJour = { lune: lune, instant: instant };
  if (typeof module !== 'undefined' && module.exports) module.exports = racine.LuneDuJour;
})(typeof window !== 'undefined' ? window : globalThis);
