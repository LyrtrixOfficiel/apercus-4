// Le domaine Kazura v20 : le château de grès rose, refait d'après la vue classique du Haut-Koenigsbourg
// (references-v20/haut-koenigsbourg-reference.jpg : depuis la plaine, à l'est, un peu en contrebas).
// De gauche à droite, comme sur la photo :
//  - la grande tour ronde du bastion, toit conique de tuiles rouge orangé à deux étages, et derrière elle un bâtiment aux
//    tuiles orange et deux petites flèches vert-de-gris ;
//  - la longue courtine de grès rose, son chemin de ronde couvert, le rocher qui affleure dessous ;
//  - le logis haut, ses grands toits d'ardoise sombres, ses lucarnes et ses cheminées ;
//  - le très haut donjon carré au toit pyramidal de cuivre vert-de-gris (lucarne, cheminée) ;
//  - devant et plus bas, les bâtiments aux tuiles orange et une tourelle ronde ;
//  - à droite, la partie est : grande tour au toit d'ardoise très pointu, logis est et son clocheton, bastion arrondi,
//    et en contrebas la longue enceinte basse et sa tourelle.
// Le tout sur un éperon de grès qui sort de la forêt. Une seule géométrie fusionnée (un seul appel de dessin), une seule
// matière : grès appareillé, tuiles, ardoise, cuivre, bois, roche et fenêtres, tout est procédural (aucune image).
// Coordonnées locales : x de gauche à droite (vu des vignes), z vers la caméra, y = 0 au pied de la courtine.
// La nuit, il est éclairé par en dessous et ses fenêtres s'allument.

import { alea, fbm2, GLSL_BRUIT, GLSL_LUMIERE } from './commun.js';
import { SOMMET } from './terrain.js';

const GRES = 0, TUILE = 1, ARDOISE = 2, ROCHE = 3, CUIVRE = 4, BOIS = 5;
/** rot : rotation autour de la verticale (la partie est vient un peu vers la plaine, comme sur la photo) ;
    y0 : hauteur du pied de la courtine au-dessus du sommet de la colline (l'éperon de grès sort de la forêt). */
export const CHATEAU = { rot: -0.24, y0: 18 };

/** Un point du château, en coordonnées locales du modèle, vers le monde. */
export function pointChateau(x, y, z) {
  const c = Math.cos(CHATEAU.rot), s = Math.sin(CHATEAU.rot);
  return [SOMMET.x + x * c + z * s, SOMMET.y + CHATEAU.y0 + y, SOMMET.z - x * s + z * c];
}

export function creerChateau(THREE, U, { mobile }) {
  const pos = [], nor = [], mat = [], fen = [], cu = [], base = [];
  let hautMur = 999;   // le haut du mur en cours (l'ombre portée sous l'avant-toit)
  const h = alea(3);
  const seg = (n) => Math.max(6, Math.round(n * (mobile ? 0.6 : 1)));

  /**
   * Ajoute une géométrie : m matière ; f fenêtres [y0 de la grille, y1, pas horizontal, étage] (null : aucune) ;
   * cyl [cx, cz, r] pour une surface ronde (la coordonnée horizontale suit la circonférence) ; b pied du bâtiment ;
   * du décalage de la grille horizontale (pour centrer une fenêtre).
   */
  function ajoute(g, m, f = null, cyl = null, b = -40, du = 0) {
    if (!g.attributes.normal) g.computeVertexNormals();
    const gg = g.index ? g.toNonIndexed() : g;
    const p = gg.attributes.position.array, n = gg.attributes.normal.array;
    for (let i = 0; i < p.length; i += 3) {
      pos.push(p[i], p[i + 1], p[i + 2]); nor.push(n[i], n[i + 1], n[i + 2]);
      mat.push(m); fen.push(...(f || [0, 0, 0, 0])); base.push(b, hautMur);
      let u;
      if (cyl) u = Math.atan2(p[i + 2] - cyl[1], p[i] - cyl[0]) * cyl[2];
      else u = Math.abs(n[i + 2]) >= Math.abs(n[i]) ? p[i] : p[i + 2];
      cu.push(u + du);
    }
  }
  const tri = (v, m, b = -40) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); g.computeVertexNormals(); ajoute(g, m, null, null, b); };

  const boite = (x0, x1, y0, y1, z0, z1, m = GRES, f = null, du = 0) => {
    hautMur = y1;
    ajoute(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0).translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), m, f, null, m === GRES ? y0 : -40, du);
    hautMur = 999;
  };
  const tour = (x, z, r, y0, y1, m = GRES, f = null, n = 20, evase = 1.03) => {
    hautMur = y1;
    ajoute(new THREE.CylinderGeometry(r, r * evase, y1 - y0, seg(n), 1, true).translate(x, (y0 + y1) / 2, z), m, f, [x, z, r], y0);
    hautMur = 999;
  };
  const cone = (x, z, r, y0, hc, m = ARDOISE, n = 20) =>
    ajoute(new THREE.ConeGeometry(r, hc, seg(n), 1, true).translate(x, y0 + hc / 2, z), m, null, [x, z, r]);
  const tronc = (x, z, r0, r1, y0, y1, m, n = 20) =>
    ajoute(new THREE.CylinderGeometry(r1, r0, y1 - y0, seg(n), 1, true).translate(x, (y0 + y1) / 2, z), m, null, [x, z, r0]);
  const disque = (x, z, r, y, m = GRES) => ajoute(new THREE.CircleGeometry(r, seg(20)).rotateX(-Math.PI / 2).translate(x, y, z), m);

  /** Toit en pavillon (quatre pans) sur un rectangle ; faîtage selon le plus long côté (pyramide si carré). */
  function pavillon(x0, x1, z0, z1, y0, hr, m, deb = 0.7) {
    const a = x0 - deb, b = x1 + deb, c = z0 - deb, d = z1 + deb;
    const lx = b - a, lz = d - c, y1 = y0 + hr, ye = y0 - 0.25;
    let f0, f1;   // les deux bouts du faîtage
    if (lx >= lz) { const k = lz / 2; f0 = [a + k, y1, (c + d) / 2]; f1 = [b - k, y1, (c + d) / 2]; }
    else { const k = lx / 2; f0 = [(a + b) / 2, y1, c + k]; f1 = [(a + b) / 2, y1, d - k]; }
    const A = [a, ye, d], B = [b, ye, d], C = [b, ye, c], D = [a, ye, c];
    const v = [];
    const q = (p, p2, r, s) => v.push(...p, ...p2, ...r, ...p, ...r, ...s);
    if (lx >= lz) { q(A, B, f1, f0); q(C, D, f0, f1); v.push(...B, ...C, ...f1, ...D, ...A, ...f0); }
    else { q(B, C, f0, f1); q(D, A, f1, f0); v.push(...A, ...B, ...f1, ...C, ...D, ...f0); }
    tri(v, m);
  }
  /** Toit à deux pans : faîtage selon x (axe 'x') ou selon z ; pignons de grès. */
  function deuxPans(x0, x1, z0, z1, y0, hr, m, axe = 'x', deb = 0.6, pignons = true) {
    const v = [];
    const y1 = y0 + hr, ye = y0 - (deb * hr) / ((axe === 'x' ? z1 - z0 : x1 - x0) / 2);
    if (axe === 'x') {
      const a = x0 - deb * 0.4, b = x1 + deb * 0.4, c = z0 - deb, d = z1 + deb, zm = (z0 + z1) / 2;
      v.push(a, ye, d, b, ye, d, b, y1, zm, a, ye, d, b, y1, zm, a, y1, zm);
      v.push(b, ye, c, a, ye, c, a, y1, zm, b, ye, c, a, y1, zm, b, y1, zm);
      tri(v, m);
      if (pignons) tri([x0, y0, z0, x0, y0, z1, x0, y1 - 0.15, zm, x1, y0, z1, x1, y0, z0, x1, y1 - 0.15, zm], GRES);
    } else {
      const a = x0 - deb, b = x1 + deb, c = z0 - deb * 0.4, d = z1 + deb * 0.4, xm = (x0 + x1) / 2;
      v.push(b, ye, d, b, ye, c, xm, y1, c, b, ye, d, xm, y1, c, xm, y1, d);
      v.push(a, ye, c, a, ye, d, xm, y1, d, a, ye, c, xm, y1, d, xm, y1, c);
      tri(v, m);
      if (pignons) tri([x1, y0, z1, x0, y0, z1, xm, y1 - 0.15, z1, x0, y0, z0, x1, y0, z0, xm, y1 - 0.15, z0], GRES);
    }
  }
  /** Appentis (un seul pan) le long de x, haut du côté z0, bas du côté z1 (vers la caméra). */
  function appentis(x0, x1, z0, z1, yHaut, yBas, m) {
    tri([x0, yBas, z1, x1, yBas, z1, x1, yHaut, z0, x0, yBas, z1, x1, yHaut, z0, x0, yHaut, z0], m);
  }
  /** Lucarne sur un pan de toit qui regarde la caméra (+z), avec sa fenêtre centrée. */
  function lucarne(x, z, y, l = 1.6, haut = 1.8, m = ARDOISE) {
    const pas = 24, yc = y + haut * 0.48;
    boite(x - l / 2, x + l / 2, y - 0.6, y + haut, z - 2.2, z, GRES, [yc - 0.75, y + haut, pas, 1.5], pas / 2 - x);
    deuxPans(x - l / 2, x + l / 2, z - 2.4, z + 0.1, y + haut, l * 0.55, m, 'z', 0.15, false);
  }
  const cheminee = (x, z, y0, y1, l = 0.9) => {
    boite(x - l / 2, x + l / 2, y0, y1, z - l / 2, z + l / 2, GRES);
    boite(x - l / 2 - 0.12, x + l / 2 + 0.12, y1, y1 + 0.25, z - l / 2 - 0.12, z + l / 2 + 0.12, GRES);
  };
  const fleche = (x, z, r, y0, hc, yb = y0 - 2.5, m = CUIVRE) => { tour(x, z, r * 0.8, yb, y0 + 0.4, GRES, null, 10); cone(x, z, r, y0, hc, m, 10); };

  /* ---------- l'éperon : le rocher de grès rose sur lequel le château est assis ----------
     v21 : comme sur la photo, une falaise de grès en bancs et en blocs sous la courtine et le logis, qui sort de la forêt ;
     sous les bâtiments bas de devant (à droite du logis), une terrasse plus basse et une falaise plus courte. */
  const pied = (x) => (x < 12 ? 0 : -(x - 12) * 0.3);
  const smoothstep01 = (t) => { t = Math.min(1, Math.max(0, t)); return t * t * (3 - 2 * t); };
  // le bord de la falaise (z local) et sa hauteur, selon x : la grande falaise sous la courtine et le logis, la petite
  // sous la terrasse des bâtiments bas
  const terrasse = (x) => smoothstep01((x + 6) / 7) * (1 - smoothstep01((x - 40) / 8));
  const bordFalaise = (x) => 8.6 + terrasse(x) * 12.6 + (fbm2(x * 0.22 + 1.7, 4.1, 3) - 0.5) * 3.2;
  const hautFalaise = (x) => (24 - terrasse(x) * 9) * (0.85 + 0.3 * fbm2(x * 0.06 + 9.0, 2.0, 2));
  {
    const X0 = -112, X1 = 112;
    const nx = mobile ? 76 : 128;
    // en z, des rangées serrées là où tombe la falaise, larges ailleurs
    const zs = [];
    for (let z = -40; z < 2; z += mobile ? 4 : 2.6) zs.push(z);
    for (let z = 2; z < 30; z += mobile ? 1.3 : 0.8) zs.push(z);
    for (let z = 30; z <= 46; z += mobile ? 4 : 2.6) zs.push(z);
    const nz = zs.length - 1;
    const sommet = (x, z) => {
      const r = Math.pow(Math.pow(Math.abs((x - 6) / 83), 4) + Math.pow(Math.abs((z + 2) / 32), 4), 0.25);
      const n = fbm2(x * 0.05 + 3.3, z * 0.07 + 1.1, 4);
      const t = terrasse(x);
      let y = pied(x) - 1.6 + (n - 0.5) * 2.2 - t * 9.5 * smoothstep01((z - 6) / 3);
      // la falaise côté plaine : une chute raide, ses bancs (petits ressauts), puis l'éboulis qui plonge dans la forêt
      const zE = bordFalaise(x), H = hautFalaise(x);
      const f = smoothstep01((z - zE) / 2.6);
      const ressauts = 0.07 * Math.sin(f * Math.PI * 5 + x * 0.13) * f * (1 - f) * 4;
      y -= H * (f + ressauts);
      y -= 22 * smoothstep01((z - zE - 3) / 14) * (0.7 + 0.6 * n);
      y -= 20 * smoothstep01((-14 - z) / 16);                      // côté montagne
      y -= 46 * Math.pow(Math.min(1, Math.max(0, (r - 0.96) / 0.3)), 1.3) * (0.8 + 0.4 * n);
      return y;
    };
    const v = [], ix = [];
    for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) {
      const x = X0 + ((X1 - X0) * i) / nx, z = zs[j];
      v.push(x, sommet(x, z), z);
    }
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      const a0 = j * (nx + 1) + i, b0 = a0 + 1, c0 = a0 + nx + 1, d0 = c0 + 1;
      ix.push(a0, c0, b0, b0, c0, d0);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
    g.setIndex(ix);
    g.computeVertexNormals();
    ajoute(g, ROCHE);
  }
  // les blocs de grès qui se détachent au bord de la falaise et dans sa face (photo : gris rose, en bancs et en blocs)
  for (let i = 0; i < (mobile ? 22 : 34); i++) {
    const x = -64 + i * (mobile ? 3.3 : 2.15) + (h() - 0.5) * 2, zE = bordFalaise(x);
    if (terrasse(x) > 0.5 && h() < 0.6) continue;
    const prof = h();
    const z = zE + 0.6 + prof * 2.4, y = -1.2 - terrasse(x) * 9.5 - prof * hautFalaise(x) * 0.55 - h() * 2.5;
    const sx = 2.6 + h() * 3.6, sy = 1.6 + h() * 3.0, sz = 2.2 + h() * 2.2;
    const g = new THREE.BoxGeometry(sx, sy, sz, 4, 3, 3).toNonIndexed();
    g.rotateY((h() - 0.5) * 0.9); g.rotateX((h() - 0.5) * 0.3); g.rotateZ((h() - 0.5) * 0.35);
    const p = g.attributes.position;
    // des arêtes cassées, des faces bosselées : chaque sommet bouge selon un bruit de sa position (les faces restent jointives)
    for (let k = 0; k < p.count; k++) {
      const vx = p.getX(k), vy = p.getY(k), vz = p.getZ(k);
      const n1 = fbm2(vx * 0.7 + i * 7.1, vz * 0.7 + vy * 1.1, 3) - 0.5, n2 = fbm2(vy * 0.9 + i * 3.3, vx * 0.6 - vz, 3) - 0.5;
      p.setXYZ(k, x + vx * (1 + n1 * 0.7) + n2 * 0.9, y + vy * (1 + n2 * 0.6) + n1 * 0.6, z + vz * (1 + n2 * 0.7) + n1 * 0.9);
    }
    g.deleteAttribute('normal');
    g.computeVertexNormals();
    ajoute(g, ROCHE);
  }

  /* ---------- l'enceinte basse à gauche, en contrebas (photo : en bas à gauche) ---------- */
  boite(-80, -46, -30, -9.5, 13, 15.2, GRES);
  appentis(-80, -46, 12.6, 15.8, -8.2, -9.4, TUILE);

  /* ---------- le grand bastion : la grande tour ronde et son toit à deux étages ---------- */
  {
    const x = -69, z = 2, r = 8.2;
    tour(x, z, r, -30, 13.3, GRES, [-6, 12, 6.5, 6], 32, 1.06);
    tour(x, z, r + 0.25, 11.6, 12.4, GRES, null, 32, 1);           // cordon
    tronc(x, z, r + 1.0, r - 2.2, 13.1, 15.4, TUILE, 32);           // le premier étage du toit
    tour(x, z, r - 2.4, 15.0, 19.3, GRES, [16, 19, 3.4, 3], 26, 1); // le tambour
    cone(x, z, r - 1.4, 19.0, 8.2, TUILE, 28);
    cone(x, z, 0.25, 26.9, 1.8, CUIVRE, 6);
  }
  // derrière la tour : un corps de bâtiment aux tuiles orange, ses lucarnes, deux flèches vert-de-gris
  boite(-62, -42, -8, 15, -14, -3, GRES, [2, 14, 3.6, 4.2]);
  deuxPans(-62, -42, -14, -3, 15, 6.6, TUILE, 'x');
  for (const x of [-57, -51, -46]) lucarne(x, -3.2, 15.3, 1.4, 1.5, TUILE);
  fleche(-55, -9, 1.7, 20.5, 5.0);
  fleche(-77.5, -7, 1.6, 17.5, 6.0, -10);

  /* ---------- la longue courtine et son chemin de ronde couvert ---------- */
  boite(-61, -15, -16, 9.2, 3.5, 7, GRES, [3, 8, 17, 4.5]);
  boite(-61, -15, 9.2, 9.8, 3.3, 7.3, GRES);                       // corniche (la ligne de mâchicoulis)
  boite(-61, -15, 9.8, 11.4, 3.7, 6.7, BOIS);                      // la galerie de bois
  appentis(-61.2, -14.8, 3.2, 7.4, 12.6, 11.2, TUILE);
  boite(-24, -18, 9.8, 13.4, 1.5, 6.4, GRES);                      // petite tour de guet au bout
  pavillon(-24, -18, 1.5, 6.4, 13.4, 2.6, ARDOISE, 0.3);

  /* ---------- le logis : haut, grands toits d'ardoise, lucarnes, cheminées ---------- */
  boite(-16, 9, -16, 14.6, -7, 5, GRES, [-12, 14, 2.9, 3.4]);
  boite(-16.2, 9.2, 14.2, 14.7, -7.2, 5.2, GRES);
  pavillon(-16, 9, -7, 5, 14.6, 6.2, ARDOISE, 0.8);
  for (const x of [-11, -5, 1]) lucarne(x, 5.2, 14.9, 1.7, 2.0);
  cheminee(-13, -1, 17, 22.5); cheminee(-2, -2, 18.5, 22.8); cheminee(4.5, -1.5, 18, 22.2, 0.8);
  // la tourelle d'escalier en façade, le petit pignon de gauche, une flèche et un toit de tuiles derrière
  tour(-6.5, 5.6, 1.3, 1, 13, GRES, null, 12);
  boite(-15.5, -11, 14.6, 18.6, 0.5, 4.6, GRES); deuxPans(-15.5, -11, 0.5, 4.6, 18.6, 3.2, ARDOISE, 'z', 0.25);
  fleche(-8, -7.5, 1.3, 20.2, 4.6, 12);
  boite(-6, 0, -16, 16, -12, -7.5, GRES); deuxPans(-6, 0, -12, -7.5, 16, 4.5, TUILE, 'x');

  /* ---------- le donjon : très haut, carré, toit pyramidal de cuivre vert-de-gris ---------- */
  {
    const x0 = 5, x1 = 19, z0 = -15, z1 = -1;
    boite(x0, x1, -16, 35.8, z0, z1, GRES, [6, 35, 3.5, 5.6]);
    boite(x0 - 0.35, x1 + 0.35, 35.8, 37.6, z0 - 0.35, z1 + 0.35, GRES, [35.9, 37.6, 2.8, 1.7]);   // le dernier étage
    pavillon(x0 - 0.35, x1 + 0.35, z0 - 0.35, z1 + 0.35, 37.6, 9.4, CUIVRE, 0.8);
    cone(12, -8, 0.35, 46.8, 2.4, CUIVRE, 6);
    // la lucarne du toit, côté plaine, et la haute cheminée à droite
    boite(10.6, 13.4, 37.6, 40.0, -2.8, -0.4, GRES, [38.0, 40.0, 24, 1.5]);
    deuxPans(10.6, 13.4, -3.0, -0.3, 40.0, 1.4, CUIVRE, 'z', 0.2, false);
    cheminee(17, -6, 39, 45.2, 1.2);
  }

  /* ---------- devant le donjon : le corps au pignon de grès et au toit d'ardoise ---------- */
  boite(9, 24, -14, 8.6, -6, 6.5, GRES, [-10, 8, 3.2, 3.3]);
  deuxPans(9, 24, -6, 6.5, 8.6, 8.2, ARDOISE, 'x', 0.5);
  // le pignon à redents, côté droit
  for (let k = 0; k < 5; k++) { const e = 6.25 - k * 1.25; boite(23.4, 24.6, 8.6 + k * 1.6, 10.2 + k * 1.6, 0.25 - e, 0.25 + e, GRES); }
  boite(10, 13.5, -1, 1.2, 6.5, 8, BOIS);                            // la galerie de bois

  /* ---------- devant et plus bas : les bâtiments aux tuiles orange et la tourelle ronde ----------
     v21 : relevés sur leur terrasse (photo : le faîtage des grands toits orange arrive au pied de la courtine). */
  boite(-3, 33, -30, -2.6, 9, 20, GRES, [-16, -3.4, 3.4, 3.6]);
  pavillon(-3, 33, 9, 20, -2.6, 7.6, TUILE, 0.8);
  for (const x of [6, 14, 22]) lucarne(x, 20, -1.9, 1.2, 1.2, TUILE);
  cheminee(11, 13, 2.8, 6.6, 0.7); cheminee(25, 14, 2.3, 6.2, 0.7);
  boite(2, 12, -14, 4.2, 4, 9, GRES, [-6, 3, 3.4, 3]);
  deuxPans(2, 12, 4, 9, 4.2, 3.9, TUILE, 'x');
  tour(4.5, 8.4, 3.3, -16, 7.4, GRES, [-6, 6, 4, 3.6], 18);
  tronc(4.5, 8.4, 3.7, 0.4, 7.2, 10.6, TUILE, 18);
  boite(-15, -3, -24, -5, 10, 13, GRES);                             // le mur bas sous la tourelle
  appentis(-15, -3, 9.6, 13.6, -4, -5.4, ARDOISE);

  /* ---------- à droite, la partie est ---------- */
  // la grande tour au toit d'ardoise très pointu
  tour(36, 11, 4.8, -30, -3.4, GRES, [-18, -4, 4.5, 4], 18);
  cone(36, 11, 5.6, -3.6, 12.6, ARDOISE, 8);
  cone(36, 11, 0.2, 8.9, 1.4, CUIVRE, 6);
  // le logis est, son toit en pavillon et son clocheton
  boite(30, 62, -30, -2.6, -6, 6, GRES, [-20, -3, 3.4, 3.4]);
  pavillon(30, 62, -6, 6, -2.6, 6.8, ARDOISE, 0.7);
  boite(55.4, 58.6, 3.6, 6.4, -1.6, 1.6, BOIS);
  cone(57, 0, 2.6, 6.4, 3.4, ARDOISE, 8);
  for (const x of [38, 46]) lucarne(x, 6.0, -2.1, 1.3, 1.4);
  // le bastion arrondi, devant
  tour(52, 9, 9.5, -40, -3.2, GRES, [-26, -6, 6, 4], 32, 1.05);
  tour(52, 9, 9.75, -4.2, -3.2, GRES, null, 32, 1);
  disque(52, 9, 9.6, -3.2, GRES);
  // l'enceinte basse en contrebas, sa tourelle, la tour d'angle
  boite(40, 86, -44, -16.2, 22, 24.5, GRES);
  boite(40, 86, -16.2, -15.4, 21.7, 24.8, GRES);
  tour(43, 24.6, 3.0, -44, -18.6, GRES, [-30, -20, 4, 4], 14);
  cone(43, 24.6, 3.5, -18.8, 4.8, ARDOISE, 10);
  tour(86, 17, 3.6, -46, -14.5, GRES, null, 16);
  cone(86, 17, 4.2, -14.6, 5.4, ARDOISE, 10);
  boite(84.5, 87, -46, -16, -4, 17, GRES);

  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('aMat', new THREE.Float32BufferAttribute(mat, 1));
  g.setAttribute('aFen', new THREE.Float32BufferAttribute(fen, 4));
  g.setAttribute('aU', new THREE.Float32BufferAttribute(cu, 1));
  g.setAttribute('aBase', new THREE.Float32BufferAttribute(base, 2));

  const m = new THREE.ShaderMaterial({
    uniforms: U,
    side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      attribute float aMat; attribute vec4 aFen; attribute float aU; attribute vec2 aBase;
      varying vec3 vPos; varying vec3 vLoc; varying vec3 vN; varying vec3 vNl; varying float vMat; varying vec4 vFen; varying float vU; varying vec2 vBase;
      void main() {
        vLoc = position; vNl = normal; vN = normalize(mat3(modelMatrix) * normal); vMat = aMat; vFen = aFen; vU = aU; vBase = aBase;
        vec4 w = modelMatrix * vec4(position, 1.0); vPos = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */`
      uniform float uChateauLum; uniform float uTemps;
      ${GLSL_BRUIT}
      ${GLSL_LUMIERE}
      varying vec3 vPos; varying vec3 vLoc; varying vec3 vN; varying vec3 vNl; varying float vMat; varying vec4 vFen; varying float vU; varying vec2 vBase;
      // des lignes fines (joints, rangs de tuiles), adoucies au loin : pas de moiré quand le château est petit
      float ligne(float x, float l) { float w = fwidth(x); float d = min(fract(x), 1.0 - fract(x)); return (1.0 - smoothstep(l, l + w * 1.2, d)) * (1.0 - smoothstep(0.18, 0.45, w)); }
      void main() {
        vec3 v = normalize(vPos - cameraPosition);
        vec3 n = normalize(vN);
        if (dot(n, v) > 0.0) n = -n;
        vec3 nl = normalize(vNl);
        float y = vLoc.y;
        vec3 alb; float spec = 0.0, rug = 30.0;
        float pente = 1.0 - abs(nl.y);
        if (vMat < 0.5) {
          // grès des Vosges : assises, blocs décalés, chaque pierre sa teinte (rose, orange, gris, rouge)
          float hA = 0.58;
          float rang = floor(y / hA);
          float lB = mix(0.9, 1.7, h11(rang * 1.37 + 3.0));
          float uu = vU + h11(rang) * 2.0;
          float bloc = floor(uu / lB);
          float t = h21(vec2(rang, bloc));
          // v21 : plus chaud et plus franc (photo : rose orangé au soleil, quelques pierres grises ou rouges)
          alb = mix(vec3(0.55, 0.245, 0.15), vec3(0.62, 0.30, 0.155), smoothstep(0.35, 0.8, t));
          alb = mix(alb, vec3(0.44, 0.30, 0.25), step(0.86, t) * 0.8);
          alb = mix(alb, vec3(0.50, 0.18, 0.11), step(t, 0.12) * 0.7);
          alb *= mix(0.86, 1.1, h21(vec2(bloc, rang + 9.0)));
          // les joints de mortier, plus clairs
          float j = max(ligne(y / hA, 0.045), ligne(uu / lB, 0.03));
          alb = mix(alb, vec3(0.56, 0.42, 0.34), j * 0.26);
          // la patine : grandes taches, coulures sombres, pied verdi
          float tache = fbm3(vec2(vU * 0.06, y * 0.09) + 3.7);
          alb *= mix(0.72, 1.14, tache);
          alb = mix(alb, alb * vec3(0.92, 0.98, 1.05), smoothstep(0.5, 0.8, fbm3(vec2(vU * 0.02, y * 0.03) + 11.0)));
          float coulure = bruit(vec2(vU * 0.9, y * 0.035)) * bruit(vec2(vU * 0.23 + 4.0, y * 0.11));
          alb *= 1.0 - 0.32 * smoothstep(0.25, 0.6, coulure);
          float bas = 1.0 - smoothstep(vBase.x, vBase.x + 4.0, y);
          alb = mix(alb, vec3(0.22, 0.22, 0.16), bas * 0.45);
        } else if (vMat < 1.5) {
          // tuiles plates : rangs, chaque tuile sa cuisson, mousse et noircissement par plaques
          float r = y * 3.3 / max(0.35, pente);
          float rangT = floor(r);
          float t = h21(vec2(rangT, floor(vU * 4.0 + h11(rangT) * 0.5)));
          alb = mix(vec3(0.42, 0.095, 0.04), vec3(0.55, 0.16, 0.06), t);
          alb = mix(alb, vec3(0.30, 0.10, 0.06), step(0.9, t) * 0.6);
          alb *= 1.0 - 0.35 * ligne(r, 0.08);
          alb *= mix(0.7, 1.1, fbm3(vec2(vU, y) * 0.35));
          spec = 0.06; rug = 18.0;
        } else if (vMat < 2.5) {
          // ardoise : petites écailles gris bleu sombre, quelques-unes plus claires
          float r = y * 4.6 / max(0.35, pente);
          float rangA = floor(r);
          float t = h21(vec2(rangA, floor(vU * 4.2 + h11(rangA) * 0.5)));
          // v21 : plus sombres (photo : gris bleu presque noir à l'ombre)
          alb = vec3(0.042, 0.05, 0.066) * mix(0.75, 1.35, t);
          alb *= 1.0 - 0.3 * ligne(r, 0.06);
          alb *= mix(0.85, 1.1, fbm3(vec2(vU, y) * 0.3));
          spec = 0.14; rug = 40.0;
        } else if (vMat < 3.5) {
          // le rocher de grès : bancs horizontaux, lichen, mousse sur le dessus
          // v21 : grès rose des Vosges en bancs épais et irréguliers (rose orangé, patine grise), creux sombres,
          // rares fissures, buissons et lierre accrochés à la face
          float yb = y + (fbm3(vec2(vU * 0.045, y * 0.05) + 2.0) - 0.5) * 5.0;
          float banc = floor(yb / 2.6);
          float bancs = fbm(vec2(vU * 0.05, yb * 0.45));
          alb = mix(vec3(0.50, 0.25, 0.16), vec3(0.62, 0.36, 0.25), bancs);
          alb *= mix(0.8, 1.12, h11(banc * 3.7 + 1.0));
          alb = mix(alb, vec3(0.42, 0.35, 0.31), smoothstep(0.55, 0.85, fbm3(vec2(vU * 0.07, yb * 0.12) + 5.0)) * 0.5);
          alb *= mix(0.42, 1.15, smoothstep(0.2, 0.75, fbm3(vec2(vU * 0.16, y * 0.22) + vLoc.z * 0.1)));
          alb *= mix(0.72, 1.1, bruit(vec2(vU * 0.7, y * 1.3) + 3.0)) * mix(0.85, 1.08, bruit(vec2(vU * 2.3, y * 3.1)));
          // le joint entre deux bancs : un creux sombre et inégal
          alb *= 1.0 - 0.55 * ligne(yb / 2.6, 0.06) * smoothstep(0.3, 0.6, bruit(vec2(vU * 0.3, banc)));
          alb *= 1.0 - 0.4 * smoothstep(0.66, 0.82, bruit(vec2(vU * 0.35, y * 1.2)));
          alb = mix(alb, vec3(0.2, 0.24, 0.15), smoothstep(0.6, 0.85, fbm3(vLoc.xz * 0.3 + 7.0)) * 0.45);
          float lierre = smoothstep(0.56, 0.68, fbm3(vec2(vU * 0.09, y * 0.11) + 13.0));
          alb = mix(alb, vec3(0.045, 0.075, 0.03) * mix(0.7, 1.4, bruit(vec2(vU, y) * 0.8)), lierre * 0.9);
          // sur les replats, la végétation (mousse, buissons) : sombre et verte ; la falaise reste nue
          alb = mix(alb, vec3(0.05, 0.08, 0.035) * mix(0.6, 1.4, fbm3(vLoc.xz * 0.4)), smoothstep(0.5, 0.8, nl.y) * 0.92);
        } else if (vMat < 4.5) {
          // cuivre vert-de-gris : vert d'eau pâle, joints debout plus clairs, coulures plus sombres
          alb = vec3(0.17, 0.39, 0.33);
          alb *= mix(0.78, 1.1, fbm3(vec2(vU * 0.5, y * 0.35)));
          alb = mix(alb, vec3(0.14, 0.24, 0.2), smoothstep(0.55, 0.85, bruit(vec2(vU * 1.6, y * 0.2))) * 0.5);
          alb += vec3(0.05, 0.07, 0.06) * ligne(vU / 0.62, 0.05);
          spec = 0.12; rug = 24.0;
        } else {
          // le bois des galeries, dans l'ombre des toits
          alb = vec3(0.10, 0.06, 0.04) * mix(0.7, 1.2, bruit(vec2(vU * 2.0, y * 8.0)));
        }
        float ao = mix(0.5, 1.0, smoothstep(vBase.x, vBase.x + 7.0, y));
        // l'ombre de l'avant-toit en haut des murs
        if (vMat < 0.5) ao *= 1.0 - 0.38 * smoothstep(vBase.y - 2.2, vBase.y - 0.2, y) * step(y, vBase.y + 0.01);
        if (vMat > 4.5) ao *= 0.55;
        vec3 c = eclairer(alb, n, v, ao, 0.0, 0.12);
        // v21 : de jour, un éclairage plus franc que le reste du paysage (photo : soleil net, ombres moins bleuies)
        float ndl = max(dot(n, uLumDir), 0.0);
        // (seulement quand le soleil éclaire la façade : à contre-jour, à l'heure dorée, on garde la lumière du ciel)
        float franc = (1.0 - uNuit) * smoothstep(-0.15, 0.25, uLumDir.z);
        c = mix(c, alb * (uLumCouleur * ndl * mix(0.55, 1.0, ao) * 1.1 + ambiant(n) * ao * 0.55), franc);
        if (spec > 0.0) { vec3 hh = normalize(uLumDir - v); c += uLumCouleur * pow(max(dot(n, hh), 0.0), rug) * spec; }
        // les fenêtres : petites, sombres, encadrées de grès clair
        float fenetre = 0.0, allume = 0.0;
        // les réglages des fenêtres, arrondis : l'interpolation les bruite d'un rien, et le hachage le transformerait en neige
        vec4 F = floor(vFen * 64.0 + 0.5) / 64.0;
        // les dérivées hors de toute condition (sinon elles sont indéfinies au bord des branches)
        vec2 cel = vec2(vU / max(F.z, 0.01), (y - F.x) / max(F.w, 0.01));
        vec2 w = fwidth(cel);
        if (F.z > 0.0 && abs(nl.y) < 0.4 && y > F.x && y < F.y) {
          vec2 f = fract(cel) - 0.5;
          vec2 id = floor(cel);
          float present = F.z > 19.0 ? 1.0 : step(0.42, h21(id + vec2(F.z * 3.1, F.w)));
          // pas deux fenêtres pareilles : un peu décalées, un peu plus ou moins hautes
          f += (vec2(h21(id + 7.0), h21(id + 13.0)) - 0.5) * vec2(0.12, 0.08);
          vec2 dem = vec2(min(0.46, 0.38 / F.z), min(0.4, (0.55 + 0.25 * h21(id + 3.0)) / F.w));
          float fx = 1.0 - smoothstep(dem.x - w.x, dem.x + w.x, abs(f.x));
          float fy = 1.0 - smoothstep(dem.y - w.y, dem.y + w.y, abs(f.y));
          vec2 dc = dem + vec2(0.13 / F.z, 0.12 / F.w);
          float cadre = (1.0 - smoothstep(dc.x - w.x, dc.x + w.x, abs(f.x))) * (1.0 - smoothstep(dc.y - w.y, dc.y + w.y, abs(f.y)));
          fenetre = fx * fy * present;
          c = mix(c, c * 1.12, max(0.0, cadre - fx * fy) * present * 0.6);
          allume = step(0.42, h21(id * 1.7 + vec2(F.x, 3.0)));
          c = mix(c, alb * 0.12 + uCielHaut * 0.03, fenetre * 0.92);
        }
        // la nuit : projecteurs au pied des murs, chaleur dorée qui s'éteint en montant ; fenêtres allumées
        float lum = uChateauLum;
        if (lum > 0.001) {
          // projecteurs au pied, tournés vers la plaine : les tours s'arrondissent, le haut des murs reste dans la nuit
          float face = (0.35 + 0.65 * max(dot(nl, vec3(0.0, 0.0, 1.0)), 0.0)) * (0.35 + 0.65 * max(dot(n, -v), 0.0));
          float pied = 0.22 + 1.05 * pow(1.0 - smoothstep(vBase.x - 2.0, vBase.x + 36.0, y), 1.6);
          vec3 chaud = vec3(1.0, 0.56, 0.26);
          if (vMat < 0.5) c += alb * chaud * lum * face * pied * 2.3;
          else if (vMat > 2.5 && vMat < 3.5) c += alb * chaud * lum * 0.7 * (1.0 - smoothstep(-6.0, 4.0, y)) * smoothstep(-30.0, -10.0, y);
          else c += alb * chaud * lum * 0.45;
          c += vec3(1.0, 0.66, 0.3) * fenetre * allume * lum * (2.3 + 0.35 * sin(uTemps * 1.7 + vLoc.x * 0.7));
        }
        gl_FragColor = vec4(brumer(c, vPos), 1.0);
      }`,
  });
  const chateau = new THREE.Mesh(g, m);
  chateau.position.set(SOMMET.x, SOMMET.y + CHATEAU.y0, SOMMET.z);
  chateau.rotation.y = CHATEAU.rot;
  chateau.frustumCulled = false;
  chateau.userData.triangles = pos.length / 9;
  return chateau;
}
