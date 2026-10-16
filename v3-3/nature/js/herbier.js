// Nature : les planches de l'herbier, dessinées comme de vraies planches botaniques : un trait d'encre fin dont
// l'épaisseur varie comme sous une plume, un lavis d'aquarelle posé un peu à côté du trait (bords irréguliers,
// pigment qui se dépose sur les bords, grain du papier), des nervures, des tailles d'ombre au burin.
// Chaque thème de l'approche reçoit sa plante (lavande pour la détente, camomille pour le stress, coquelicot
// pour les émotions, pissenlit en aigrette pour le lâcher-prise...), dessinée depuis une graine : jamais deux
// fois la même, toujours la même pour une même page. Sortie : du SVG en texte (servi tel quel, sans JavaScript).
// Aussi : la liane de l'arche (clématite) et les fleurs des sachets.
import { hasard } from './botanique.js';

const f = (n) => Math.round(n * 10) / 10;
let SERIE = 0; // pour des identifiants uniques dans la page (formes partagées)
const ENCRE = 'var(--herbier-encre, #3b3624)';

// ---------- Courbes ----------
// Catmull-Rom centripète vers Bézier : des courbes souples, sans boucle ni pointe.
export function lisse(pts, ferme = false) {
  const n = pts.length;
  if (n < 2) return '';
  const P = (i) => (ferme ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  const fin = ferme ? n : n - 1;
  for (let i = 0; i < fin; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    const d1 = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) ** 0.5 || 1e-4;
    const d2 = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) ** 0.5 || 1e-4;
    const d3 = Math.hypot(p3[0] - p2[0], p3[1] - p2[1]) ** 0.5 || 1e-4;
    const c1 = [0, 1].map((k) => (d1 * d1 * p2[k] - d2 * d2 * p0[k] + (2 * d1 * d1 + 3 * d1 * d2 + d2 * d2) * p1[k]) / (3 * d1 * (d1 + d2)));
    const c2 = [0, 1].map((k) => (d3 * d3 * p1[k] - d2 * d2 * p3[k] + (2 * d3 * d3 + 3 * d3 * d2 + d2 * d2) * p2[k]) / (3 * d3 * (d3 + d2)));
    d += `C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d + (ferme ? 'Z' : '');
}
const poly = (pts, ferme = false) => pts.map((p, i) => `${i ? 'L' : 'M'}${f(p[0])} ${f(p[1])}`).join('') + (ferme ? 'Z' : '');
// Une courbe de Bézier cubique échantillonnée (pour les tiges).
function bezier(p0, p1, p2, p3, n = 40) {
  const out = [];
  for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; out.push([0, 1].map((k) => u * u * u * p0[k] + 3 * u * u * t * p1[k] + 3 * u * t * t * p2[k] + t * t * t * p3[k])); }
  return out;
}
const at = (pts, t) => { const x = Math.max(0, Math.min(pts.length - 1, t * (pts.length - 1))), i = Math.min(pts.length - 2, Math.floor(x)), u = x - i; return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * u, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * u]; };
const dirAt = (pts, t) => { const a = at(pts, Math.max(0, t - 0.01)), b = at(pts, Math.min(1, t + 0.01)); return Math.atan2(b[1] - a[1], b[0] - a[0]); };
// Trait de plume : un ruban rempli dont la largeur suit w(t) (pression), plus fin à la pointe.
function ruban(pts, w0, w1 = w0 * 0.35) {
  const G = [], D = [];
  pts.forEach((p, i) => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, t = i / (pts.length - 1);
    const w = (w0 + (w1 - w0) * t) / 2;
    G.push([p[0] - dy / L * w, p[1] + dx / L * w]); D.push([p[0] + dy / L * w, p[1] - dx / L * w]);
  });
  return lisse([...G, ...D.reverse()], true);
}

// ---------- La feuille ----------
const PROFILS = {
  lance: (t) => Math.sin(Math.PI * Math.pow(t, 0.8)) ** 1.15 * (1 - 0.2 * t),
  ovale: (t) => Math.sin(Math.PI * Math.pow(t, 0.68)),
  coeur: (t) => Math.sin(Math.PI * (0.12 + 0.88 * Math.pow(t, 0.75))) * (1 + 0.35 * Math.max(0, 0.18 - t) / 0.18),
  aiguille: (t) => Math.min(1, t * 8) * (1 - t) ** 0.6,
  ruban: (t) => Math.min(1, t * 10) * (1 - t ** 3),
};
/**
 * Une feuille posée en (x, y), dirigée selon l'angle a, longueur L, largeur relative k.
 * forme : profil ; courbe : la nervure se courbe (-0.4 à 0.4) ; torsion : un côté se dérobe (la feuille tourne) ;
 * dents : nombre de dents par côté (0 = bord lisse) ; nervures : nombre de nervures secondaires.
 */
function feuille(x, y, a, L, k, { forme = 'lance', courbe = 0, torsion = 0, dents = 0, nervures = 5, profondeur = 0.02 } = {}) {
  const ux = Math.cos(a), uy = Math.sin(a), vx = -uy, vy = ux, prof = PROFILS[forme];
  const mid = (t) => { const b = courbe * L * t * t * 0.5; return [x + ux * L * t + vx * b, y + uy * L * t + vy * b]; };
  // assez de points pour la forme et les dents, pas plus (une petite feuille n'a pas besoin de 44 points)
  const N = Math.max(8, Math.min(40, Math.round(L / 3) + dents * 3)), G = [], D = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N, m = mid(t), m2 = mid(Math.min(1, t + 0.02)), m1 = mid(Math.max(0, t - 0.02));
    const ang = Math.atan2(m2[1] - m1[1], m2[0] - m1[0]), nx = -Math.sin(ang), ny = Math.cos(ang);
    let w = prof(t) * L * k;
    let dg = 0;
    if (dents) { const s = (t * dents) % 1; dg = (s < 0.75 ? s / 0.75 : (1 - s) / 0.25) * L * profondeur * Math.sin(Math.PI * t); }
    G.push([m[0] + nx * (w * (1 - torsion) + dg), m[1] + ny * (w * (1 - torsion) + dg)]);
    D.push([m[0] - nx * (w * (1 + torsion * 0.25) + dg), m[1] - ny * (w * (1 + torsion * 0.25) + dg)]);
  }
  const contour = [...G, ...D.slice(1, -1).reverse()];
  const nervure = Array.from({ length: 12 }, (_, i) => mid(i / 11 * 0.94));
  const secondaires = [], ombres = [];
  for (let i = 1; i <= nervures; i++) {
    const t = 0.1 + 0.8 * i / (nervures + 1), t2 = Math.min(0.98, t + 0.13), m = mid(t);
    for (const [cote, bord] of [[1, G], [-1, D]]) {
      const e = at(bord, t2), q = [m[0] + (e[0] - m[0]) * 0.86, m[1] + (e[1] - m[1]) * 0.86];
      const c = [m[0] + (q[0] - m[0]) * 0.45 + ux * L * 0.02, m[1] + (q[1] - m[1]) * 0.45 + uy * L * 0.02];
      secondaires.push([m, c, q]);
      // côté de l'ombre (le côté qui se dérobe) : quelques tailles parallèles à la nervure
      if (cote === 1 && torsion > 0.15) for (const s of [0.35, 0.6]) { const p0 = [m[0] + (q[0] - m[0]) * s, m[1] + (q[1] - m[1]) * s]; ombres.push([p0, [p0[0] + ux * L * 0.05, p0[1] + uy * L * 0.05]]); }
    }
  }
  return { contour, nervure, secondaires, ombres, pointe: mid(1) };
}

// ---------- La planche : couches de lavis, de trait, d'ombre ----------
function planche(seed) {
  const lavis = [], traits = [], fins = [], ombres = [], points = [], formes = [];
  const prefixe = 'h' + (seed % 1e5) + '-' + (SERIE++) + '-';
  let dernier = null; // le dernier lavis : si le trait suit avec la même forme, elle n'est écrite qu'une fois (<use>)
  const P = {
    lavis(d, couleur, op = 0.6) { const a = `fill="${couleur}" fill-opacity="${op}" stroke="${couleur}" stroke-opacity="${Math.min(1, op * 0.7)}" stroke-width="1.3"`; lavis.push(`<path d="${d}" ${a}/>`); dernier = { d, a, i: lavis.length - 1 }; },
    trait(d, l = 0.75) {
      if (dernier && dernier.d === d) {
        const id = prefixe + formes.length; formes.push(`<path id="${id}" d="${d}"/>`);
        lavis[dernier.i] = `<use href="#${id}" ${dernier.a}/>`; traits.push(`<use href="#${id}" stroke-width="${l}"/>`); dernier = null; return;
      }
      traits.push(`<path d="${d}" stroke-width="${l}"/>`);
    },
    plein(d) { traits.push(`<path d="${d}" fill="${ENCRE}" stroke="none"/>`); },
    fin(d, l = 0.42) { fins.push(`<path d="${d}" stroke-width="${l}"/>`); },
    ombre(d) { ombres.push(d); },
    point(x, y, r = 0.7) { points.push(`M${f(x - r)} ${f(y)}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0`); },
    feuille(F, couleur, op = 0.55, l = 0.7) {
      P.lavis(lisse(F.contour, true), couleur, op);
      P.trait(lisse(F.contour, true), l);
      P.fin(lisse(F.nervure), 0.55);
      P.fin(F.secondaires.map((s) => lisse(s)).join(''), 0.38);
      P.ombre(F.ombres.map((o) => poly(o)).join(''));
    },
    rendre(classe, attaches = [], decalage = [1.4, 1.8]) {
      const id = 'aq' + (seed % 1e6);
      const defs = `<defs>${formes.join('')}<filter id="${id}" x="-4%" y="-4%" width="108%" height="108%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency=".05" numOctaves="3" seed="${seed % 97}" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="5" xChannelSelector="R" yChannelSelector="G" result="b"/><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="1" seed="${(seed + 7) % 97}" result="g"/><feColorMatrix in="g" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -1.4 1.5" result="ga"/><feComposite in="b" in2="ga" operator="in"/></filter></defs>`;
      const bande = attaches.map(([x, y, a]) => `<g transform="rotate(${f(a)} ${f(x)} ${f(y)})"><rect class="bandelette" x="${f(x - 18)}" y="${f(y - 5.5)}" width="36" height="11"/><path class="bandelette-bord" d="M${f(x - 18)} ${f(y - 5.5)}l1.5 2.2-1.5 2.2 1.5 2.2-1.5 2.2M${f(x + 18)} ${f(y - 5.5)}l-1.5 2.2 1.5 2.2-1.5 2.2 1.5 2.2"/></g>`).join('');
      return `${defs}<g class="lavis" filter="url(#${id})" transform="translate(${decalage[0]} ${decalage[1]})">${lavis.join('')}</g>`
        + `<g class="trait" fill="none" stroke="${ENCRE}" stroke-linecap="round" stroke-linejoin="round">${traits.join('')}</g>`
        + `<g class="trait-fin" fill="none" stroke="${ENCRE}" stroke-linecap="round" stroke-opacity=".78">${fins.join('')}</g>`
        + `<path class="taille" fill="none" stroke="${ENCRE}" stroke-width=".35" stroke-opacity=".6" stroke-linecap="round" d="${ombres.join('')}"/>`
        + `<path class="pointille" fill="${ENCRE}" fill-opacity=".75" d="${points.join('')}"/>`
        + bande;
    },
  };
  return P;
}
const SVG = (classe, corps, vb = '0 0 300 400') => `<svg class="${classe}" viewBox="${vb}" aria-hidden="true" focusable="false">${corps}</svg>`;

// Une tige qui monte de (x0, y0) sur une hauteur h, souple ; renvoie ses points.
function tige(r, x0, y0, h, ecart = 40) {
  return bezier([x0, y0], [x0 + (r() - 0.5) * ecart, y0 - h * 0.35], [x0 + (r() - 0.5) * ecart * 1.3, y0 - h * 0.7], [x0 + (r() - 0.5) * ecart, y0 - h], 48);
}

// Couleurs d'aquarelle (pigments naturels, un peu rompus, comme sur les vraies planches)
const C = {
  vert: '#7f9a55', vertFonce: '#5b7a3c', vertGris: '#9aa98a', olive: '#8b9a6a', sauge: '#a3b195',
  lavande: '#8f7bbd', lavandeFonce: '#6d5a9e', rouge: '#d4553f', rougeFonce: '#a83a2c', rose: '#e8b4b8', roseFonce: '#cf8f97',
  jaune: '#e9c24b', or: '#d9a23a', creme: '#f3ead2', blanc: '#fbf8ef', paille: '#d8c18a', brun: '#9a7651', gris: '#b9b6ab', violetOlive: '#5d4a63',
};

// ---------- Les espèces ----------
// Chaque espèce : (graine) -> { svg, nom, latin, fleur: [x, y, l, h] (où cadrer la vignette du sachet) }

function lavande(seed) {
  const r = hasard(seed), P = planche(seed);
  const tiges = [];
  for (let k = 0; k < 5; k++) tiges.push(tige(r, 140 + (k - 2) * 7 + (r() - 0.5) * 6, 384, 330 + r() * 30 - Math.abs(k - 2) * 26, 60 + Math.abs(k - 2) * 50));
  // feuilles étroites gris-vert à la base, opposées
  for (const T of tiges) for (let i = 0; i < 4; i++) {
    const t = 0.05 + i * 0.09, [x, y] = at(T, t), a = dirAt(T, t);
    for (const s of [-1, 1]) P.feuille(feuille(x, y, a + s * (0.55 + r() * 0.25), 34 + r() * 14 - i * 3, 0.09, { forme: 'aiguille', courbe: s * 0.18, nervures: 0 }), C.sauge, 0.55, 0.55);
  }
  for (const T of tiges) {
    P.trait(ruban(T.slice(0, 46), 1.5, 0.7), 0.15);
    P.plein(ruban(T.slice(0, 46), 1.4, 0.5));
    // l'épi : des verticilles de calices, de plus en plus petits vers la pointe
    const n = 9 + Math.floor(r() * 3);
    for (let i = 0; i < n; i++) {
      const t = 0.72 + 0.27 * i / n, [x, y] = at(T, t), a = dirAt(T, t), s = 1 - i / n * 0.55;
      for (const [o, cote] of [[-0.9, -1], [0.9, 1], [0, 0]]) {
        const cx = x + Math.cos(a + Math.PI / 2) * cote * 6.2 * s, cy = y + Math.sin(a + Math.PI / 2) * cote * 6.2 * s;
        const L = 11 * s, b = a + o * 0.5;
        // le calice : une petite ellipse inclinée le long de l'épi
        const rx = L / 2, ry = L * 0.32, deg = f(b * 180 / Math.PI), ex = cx + Math.cos(b) * rx, ey = cy + Math.sin(b) * rx;
        const x1 = cx + Math.cos(b) * rx * 2, y1 = cy + Math.sin(b) * rx * 2;
        const ell = `M${f(cx)} ${f(cy)}A${f(rx)} ${f(ry)} ${deg} 1 0 ${f(x1)} ${f(y1)}A${f(rx)} ${f(ry)} ${deg} 1 0 ${f(cx)} ${f(cy)}Z`;
        const F = { pointe: [x1, y1] }; void ex; void ey;
        P.lavis(ell, i % 3 ? C.lavande : C.lavandeFonce, 0.75);
        P.trait(ell, 0.5);
        if ((i + (cote + 1)) % 3 === 0 && i < n - 2) { const q = F.pointe; P.lavis(`M${f(q[0] - 2.2)} ${f(q[1])}a2.2 1.6 0 1 0 4.4 0a2.2 1.6 0 1 0 -4.4 0`, C.lavandeFonce, 0.85); P.fin(`M${f(q[0] - 2.2)} ${f(q[1])}a2.2 1.6 0 1 0 4.4 0a2.2 1.6 0 1 0 -4.4 0`, 0.35); }
      }
    }
  }
  const bouts = tiges.map((T) => T[T.length - 1]), bx0 = Math.min(...bouts.map((p) => p[0])), bx1 = Math.max(...bouts.map((p) => p[0])), by0 = Math.min(...bouts.map((p) => p[1]));
  return { svg: SVG('specimen herbier-lavande', P.rendre('lavande', [[150, 352, -6 + r() * 12], [at(tiges[2], 0.42)[0], at(tiges[2], 0.42)[1], 7 - r() * 14]])), nom: 'Lavande vraie', latin: 'Lavandula angustifolia', fleur: [bx0 - 30, by0 - 14, bx1 - bx0 + 60, 120] };
}

function capitule(P, r, x, y, R, inc, rot, { rayons = 18, ray = C.blanc, disque = C.jaune, dome = 0.3 } = {}) {
  const ca = Math.cos(rot), sa = Math.sin(rot);
  const tr = (u, v) => [x + u * ca - v * inc * sa, y + u * sa + v * inc * ca];
  // les rayons (ligules) : derrière d'abord, devant ensuite
  const ordre = Array.from({ length: rayons }, (_, i) => i).sort((i, j) => Math.sin(i / rayons * 2 * Math.PI) - Math.sin(j / rayons * 2 * Math.PI));
  for (const i of ordre) {
    const a = i / rayons * Math.PI * 2 + r() * 0.12, L = R * (0.95 + r() * 0.12);
    const pts = []; const w = R * 0.13;
    for (let k = 0; k <= 6; k++) { const t = k / 6, e = Math.sin(Math.PI * Math.pow(t, 0.7)) * w * (1 - 0.15 * t); pts.push([Math.cos(a) * (R * 0.32 + L * 0.68 * t) - Math.sin(a) * e, Math.sin(a) * (R * 0.32 + L * 0.68 * t) + Math.cos(a) * e]); }
    for (let k = 5; k >= 1; k--) { const t = k / 6, e = Math.sin(Math.PI * Math.pow(t, 0.7)) * w * (1 - 0.15 * t); pts.push([Math.cos(a) * (R * 0.32 + L * 0.68 * t) + Math.sin(a) * e, Math.sin(a) * (R * 0.32 + L * 0.68 * t) - Math.cos(a) * e]); }
    const q = pts.map(([u, v]) => tr(u, v));
    P.lavis(lisse(q, true), ray, 0.9);
    P.trait(lisse(q, true), 0.5);
    P.fin(lisse([tr(Math.cos(a) * R * 0.45, Math.sin(a) * R * 0.45), tr(Math.cos(a) * R * 0.85, Math.sin(a) * R * 0.85)]), 0.3);
  }
  // le disque bombé : un dôme jaune, pointillé en spirale (phyllotaxie)
  const Rd = R * 0.34;
  const disq = Array.from({ length: 24 }, (_, i) => { const a = i / 24 * Math.PI * 2; return tr(Math.cos(a) * Rd, Math.sin(a) * Rd - dome * Rd * (1 - Math.sin(a)) * 0.5); });
  P.lavis(lisse(disq, true), disque, 0.95);
  P.trait(lisse(disq, true), 0.6);
  for (let i = 0; i < 44; i++) { const rr = Math.sqrt(i / 44) * Rd * 0.92, a = i * 2.39996; const [px, py] = tr(Math.cos(a) * rr, Math.sin(a) * rr); P.point(px, py - dome * Rd * 0.4 * (1 - rr / Rd), 0.42); }
}

function camomille(seed) {
  const r = hasard(seed), P = planche(seed);
  const T = tige(r, 150, 386, 290, 50);
  P.plein(ruban(T, 1.7, 0.7));
  // feuilles finement découpées (pennées) le long de la tige
  for (let i = 0; i < 6; i++) {
    const t = 0.08 + i * 0.1, [x, y] = at(T, t), a = dirAt(T, t), s = i % 2 ? 1 : -1, b = a + s * (0.9 + r() * 0.3), L = 46 - i * 4;
    const axe = bezier([x, y], [x + Math.cos(b) * L * 0.4, y + Math.sin(b) * L * 0.4], [x + Math.cos(b - s * 0.3) * L * 0.75, y + Math.sin(b - s * 0.3) * L * 0.75], [x + Math.cos(b - s * 0.4) * L, y + Math.sin(b - s * 0.4) * L], 12);
    P.trait(lisse(axe), 0.55);
    for (let j = 1; j < 7; j++) { const u = j / 7, [px, py] = at(axe, u), c = dirAt(axe, u); for (const z of [-1, 1]) { const l = (11 - j) * 0.9; const q = [px + Math.cos(c + z * 0.9) * l, py + Math.sin(c + z * 0.9) * l]; P.lavis(ruban([[px, py], q], 2.4, 0.6), C.vert, 0.55); P.fin(lisse([[px, py], [(px + q[0]) / 2 + Math.cos(c) * 1.2, (py + q[1]) / 2 + Math.sin(c) * 1.2], q]), 0.45); } }
  }
  // trois capitules : un de face, deux de biais, sur des pédoncules
  const tetes = [[1, 0, 1]];
  const branches = [[0.58, 1], [0.66, -1], [0.78, 1], [0.5, -1]];
  for (const [t, s] of branches) {
    const [x, y] = at(T, t), a = dirAt(T, t) + s * 0.55, L = 52 + r() * 18;
    const B = bezier([x, y], [x + Math.cos(a) * L * 0.4, y + Math.sin(a) * L * 0.4], [x + Math.cos(a - s * 0.4) * L * 0.8, y + Math.sin(a - s * 0.4) * L * 0.8 - 6], [x + Math.cos(a - s * 0.5) * L, y + Math.sin(a - s * 0.5) * L - 12], 16);
    P.plein(ruban(B, 1.1, 0.6)); tetes.push([B, s, t < 0.55 ? 0.45 : 0.62 + r() * 0.3]);
  }
  for (const [B, s, k] of tetes) {
    const [x, y] = Array.isArray(B) ? B[B.length - 1] : T[T.length - 1];
    capitule(P, r, x, y - 2, 31 * k, s ? 0.45 : 0.62, s * 0.35, { rayons: 17, dome: 0.5 });
  }
  const [hx, hy] = T[T.length - 1];
  return { svg: SVG('specimen herbier-camomille', P.rendre('camomille', [[150, 350, -5 + r() * 10], [at(T, 0.45)[0], at(T, 0.45)[1], 6 - r() * 12]])), nom: 'Camomille', latin: 'Matricaria chamomilla', fleur: [hx - 80, hy - 50, 160, 140] };
}

function petale(cx, cy, a, L, l, ondes = 5, amp = 0.05, r = Math.random) {
  // un pétale en éventail au bord ondulé (coquelicot, églantine)
  const pts = [[cx, cy]];
  const N = 26;
  for (let i = 0; i <= N; i++) {
    const u = i / N, b = a + (u - 0.5) * l, R = L * (0.82 + 0.18 * Math.sin(Math.PI * u)) * (1 + amp * Math.sin(u * Math.PI * ondes + r() * 0.6));
    pts.push([cx + Math.cos(b) * R, cy + Math.sin(b) * R]);
  }
  return pts;
}

function coquelicot(seed) {
  const r = hasard(seed), P = planche(seed);
  const T = tige(r, 152, 386, 270, 60);
  P.plein(ruban(T, 1.6, 0.8));
  // poils de la tige
  for (let i = 4; i < T.length - 3; i += 2) { const [x, y] = T[i], a = dirAt(T, i / T.length) + (i % 4 ? 0.9 : -0.9); P.fin(poly([[x, y], [x + Math.cos(a) * 3.2, y + Math.sin(a) * 3.2]]), 0.3); }
  // feuilles découpées à la base
  for (let i = 0; i < 2; i++) {
    const t = 0.1 + i * 0.16, [x, y] = at(T, t), a = dirAt(T, t), s = i % 2 ? 1 : -1;
    P.feuille(feuille(x, y, a + s * 1.0, 64 - i * 10, 0.16, { forme: 'lance', courbe: s * 0.25, dents: 6, profondeur: 0.07, nervures: 5, torsion: 0.25 }), C.vert, 0.55);
  }
  // la fleur : quatre pétales froissés, deux derrière plus sombres, deux devant
  const [x, y] = T[T.length - 1], a0 = dirAt(T, 1);
  const R = 58 + r() * 8;
  for (const [o, op, c] of [[-0.95, 0.55, C.rougeFonce], [0.95, 0.55, C.rougeFonce], [-0.35, 0.8, C.rouge], [0.45, 0.8, C.rouge]]) {
    const pts = petale(x, y - 4, a0 + o, R * (0.92 + r() * 0.12), 1.55, 6, 0.06, r);
    P.lavis(lisse(pts, true), c, op);
    P.trait(lisse(pts, true), 0.6);
    // plis du pétale : quelques nervures qui rayonnent depuis la base
    for (let k = 0; k < 5; k++) { const b = a0 + o + (k / 4 - 0.5) * 1.0; P.fin(lisse([[x + Math.cos(b) * 8, y - 4 + Math.sin(b) * 8], [x + Math.cos(b + 0.05) * R * 0.5, y - 4 + Math.sin(b + 0.05) * R * 0.5], [x + Math.cos(b) * R * 0.78, y - 4 + Math.sin(b) * R * 0.78]]), 0.28); }
    const tache = petale(x, y - 4, a0 + o, R * 0.24, 1.0, 3, 0.1, r);
    P.lavis(lisse(tache, true), '#2a2120', 0.7);
  }
  // la capsule et son disque étoilé
  P.lavis(`M${f(x - 7)} ${f(y - 6)}a7 6 0 1 0 14 0a7 6 0 1 0 -14 0`, '#7b8a5a', 0.9);
  P.trait(`M${f(x - 7)} ${f(y - 6)}a7 6 0 1 0 14 0a7 6 0 1 0 -14 0`, 0.6);
  for (let k = 0; k < 8; k++) { const b = k / 8 * Math.PI * 2; P.fin(poly([[x, y - 7], [x + Math.cos(b) * 6.5, y - 7 + Math.sin(b) * 3]]), 0.4); }
  for (let k = 0; k < 40; k++) { const b = r() * Math.PI * 2, d = 8 + r() * 4; P.fin(poly([[x + Math.cos(b) * 6, y - 6 + Math.sin(b) * 5], [x + Math.cos(b) * d, y - 6 + Math.sin(b) * d * 0.8]]), 0.3); P.point(x + Math.cos(b) * d, y - 6 + Math.sin(b) * d * 0.8, 0.55); }
  // un bouton penché, velu
  const [bx, by] = at(T, 0.6), sb = -1;
  const B = bezier([bx, by], [bx + sb * 30, by - 30], [bx + sb * 52, by - 34], [bx + sb * 56, by - 14], 16);
  P.plein(ruban(B, 1.1, 0.7));
  const [ex, ey] = B[B.length - 1];
  const bouton = Array.from({ length: 16 }, (_, i) => { const t = i / 16 * Math.PI * 2; return [ex + Math.cos(t) * 7, ey + 10 + Math.sin(t) * 11 + (Math.sin(t) > 0 ? Math.sin(t) * 4 : 0)]; });
  P.lavis(lisse(bouton, true), C.vert, 0.6); P.trait(lisse(bouton, true), 0.55);
  for (let i = 0; i < 16; i++) { const [px, py] = bouton[i], [qx, qy] = [ex, ey + 10]; const L = Math.hypot(px - qx, py - qy); P.fin(poly([[px, py], [px + (px - qx) / L * 3, py + (py - qy) / L * 3]]), 0.28); }
  return { svg: SVG('specimen herbier-coquelicot', P.rendre('coquelicot', [[152, 352, -6 + r() * 12], [at(T, 0.4)[0], at(T, 0.4)[1], 8 - r() * 16]])), nom: 'Coquelicot', latin: 'Papaver rhoeas', fleur: [x - 70, y - 70, 140, 120] };
}

function aigrette(P, r, x, y, R) {
  // la boule de graines : des filaments qui rayonnent, chacun terminé par un parachute de soies
  const n = 70;
  for (let i = 0; i < n; i++) {
    const a = i * 2.39996, z = (i / n) * 2 - 1, k = Math.sqrt(1 - z * z), rr = R * (0.88 + r() * 0.1);
    const ex = x + Math.cos(a) * rr * k, ey = y + z * rr * 0.96;
    P.fin(poly([[x + (ex - x) * 0.15, y + (ey - y) * 0.15], [ex, ey]]), 0.26);
    const b = Math.atan2(ey - y, ex - x);
    let d = '';
    for (let j = 0; j < 7; j++) { const c = b + (j / 6 - 0.5) * 1.5; d += `M${f(ex)} ${f(ey)}l${f(Math.cos(c) * 5)} ${f(Math.sin(c) * 5)}`; }
    P.fin(d, 0.2);
  }
  P.lavis(`M${f(x - R)} ${f(y)}a${R} ${R} 0 1 0 ${2 * R} 0a${R} ${R} 0 1 0 ${-2 * R} 0`, C.gris, 0.18);
  P.lavis(`M${f(x - 5)} ${f(y)}a5 4 0 1 0 10 0a5 4 0 1 0 -10 0`, C.paille, 0.9);
  P.trait(`M${f(x - 5)} ${f(y)}a5 4 0 1 0 10 0a5 4 0 1 0 -10 0`, 0.5);
}
function graineVolante(P, x, y, a, s = 1) {
  // une graine qui s'envole : l'akène, le bec, le parachute
  const L = 16 * s, bx = x + Math.cos(a) * L, by = y + Math.sin(a) * L;
  P.lavis(`M${f(x - 1.6 * s)} ${f(y)}a${f(1.6 * s)} ${f(3 * s)} 0 1 0 ${f(3.2 * s)} 0a${f(1.6 * s)} ${f(3 * s)} 0 1 0 ${f(-3.2 * s)} 0`, C.brun, 0.8);
  P.fin(poly([[x, y], [bx, by]]), 0.3);
  let d = '';
  for (let j = 0; j < 9; j++) { const c = a + (j / 8 - 0.5) * 2.2; d += `M${f(bx)} ${f(by)}q${f(Math.cos(c) * 4 * s)} ${f(Math.sin(c) * 4 * s - 1)} ${f(Math.cos(c) * 7 * s)} ${f(Math.sin(c) * 7 * s)}`; }
  P.fin(d, 0.22);
}
function pissenlit(seed) {
  const r = hasard(seed), P = planche(seed);
  // les feuilles en rosette, dentées comme des dents de lion
  for (let i = 0; i < 4; i++) {
    const a = -Math.PI / 2 + (i - 1.5) * 0.42 + (r() - 0.5) * 0.15;
    P.feuille(feuille(150 + (i - 1.5) * 6, 384, a, 110 - Math.abs(i - 1.5) * 18, 0.13, { forme: 'lance', courbe: (i - 1.5) * 0.12, dents: 7, profondeur: 0.09, torsion: i % 2 ? 0.3 : 0.05, nervures: 6 }), C.vert, 0.5);
  }
  const T = tige(r, 150, 384, 250, 36);
  P.lavis(ruban(T, 3.2, 2.2), C.paille, 0.6);
  P.trait(ruban(T, 3, 2), 0.55);
  const [x, y] = T[T.length - 1];
  aigrette(P, r, x, y - 44, 50);
  // quelques graines s'envolent vers le haut à droite : lâcher prise
  [[x + 52, y - 78, -0.9, 0.95], [x + 86, y - 112, -1.2, 0.85], [x + 112, y - 150, -0.7, 0.75], [x + 70, y - 160, -1.5, 0.7]].forEach(([gx, gy, a, s]) => graineVolante(P, gx + (r() - 0.5) * 10, gy + (r() - 0.5) * 10, a, s));
  // un second capitule refermé, encore en bouton
  const [bx, by] = at(T, 0.45);
  const B = bezier([bx, by], [bx - 20, by - 30], [bx - 30, by - 60], [bx - 34, by - 80], 14);
  P.lavis(ruban(B, 2.6, 2), C.paille, 0.5); P.trait(ruban(B, 2.4, 1.8), 0.5);
  const [ex, ey] = B[B.length - 1];
  const bouton = [[ex - 6, ey + 6], [ex - 7, ey - 6], [ex - 2, ey - 18], [ex + 2, ey - 18], [ex + 7, ey - 6], [ex + 6, ey + 6]];
  P.lavis(lisse(bouton, true), C.vert, 0.6); P.trait(lisse(bouton, true), 0.55);
  for (const o of [-4, 0, 4]) P.fin(lisse([[ex + o * 0.9, ey + 5], [ex + o * 0.6, ey - 6], [ex + o * 0.2, ey - 16]]), 0.3);
  return { svg: SVG('specimen herbier-pissenlit', P.rendre('pissenlit', [[150, 356, -4 + r() * 8], [at(T, 0.62)[0], at(T, 0.62)[1], 6 - r() * 12]])), nom: 'Pissenlit en aigrette', latin: 'Taraxacum officinale', fleur: [x - 60, y - 120, 190, 150] };
}

function fougere(seed) {
  const r = hasard(seed), P = planche(seed);
  const s0 = (r() - 0.5) * 70;
  const T = bezier([150, 388], [150 + s0 * 0.2, 300], [150 + s0 * 1.1, 160], [150 + s0 * 0.8, 26], 60);
  P.plein(ruban(T, 2.2, 0.6));
  const N = 15 + Math.floor(r() * 3);
  for (let i = 0; i < N; i++) {
    const t = 0.1 + 0.86 * i / N, [x, y] = at(T, t), a = dirAt(T, t);
    const L = 112 * Math.pow(1 - t, 0.62) * (0.62 + 0.38 * Math.sin(Math.min(1, t * 1.6) * Math.PI * 0.8 + 0.3));
    for (const s of [-1, 1]) {
      const b = a + s * (1.2 - t * 0.45) + (r() - 0.5) * 0.06;
      const ax = bezier([x, y], [x + Math.cos(b) * L * 0.35, y + Math.sin(b) * L * 0.35], [x + Math.cos(b + s * 0.12) * L * 0.7, y + Math.sin(b + s * 0.12) * L * 0.7], [x + Math.cos(b + s * 0.25) * L, y + Math.sin(b + s * 0.25) * L], 16);
      // la penne : un contour festonné (pinnules arrondies) autour de son axe
      const n = Math.max(4, Math.round(L / 7));
      const G = [], D = [];
      for (let k = 0; k <= n * 2; k++) {
        const u = k / (n * 2), [px, py] = at(ax, u), c = dirAt(ax, u), w = L * 0.14 * (1 - u * 0.75) * (0.75 + 0.25 * Math.abs(Math.sin(u * n * Math.PI)));
        G.push([px + Math.cos(c - Math.PI / 2) * w, py + Math.sin(c - Math.PI / 2) * w]);
        D.push([px + Math.cos(c + Math.PI / 2) * w, py + Math.sin(c + Math.PI / 2) * w]);
      }
      const contour = [...G, ...D.reverse()];
      P.lavis(lisse(contour, true), i % 3 ? C.vert : C.vertFonce, 0.5);
      P.trait(lisse(contour, true), 0.48);
      P.fin(lisse(ax), 0.4);
      for (let k = 1; k < n; k++) { const u = k / n, [px, py] = at(ax, u), c = dirAt(ax, u); for (const z of [-1, 1]) P.fin(poly([[px, py], [px + Math.cos(c + z * 0.8) * L * 0.1 * (1 - u * 0.7), py + Math.sin(c + z * 0.8) * L * 0.1 * (1 - u * 0.7)]]), 0.25); }
    }
  }
  // la crosse qui s'enroule en haut
  const [tx, ty] = T[T.length - 1];
  const cr = Array.from({ length: 24 }, (_, i) => { const a = i / 24 * Math.PI * 2.4, R = 9 * (1 - i / 30); return [tx + Math.cos(a + 1.5) * R, ty - 4 + Math.sin(a + 1.5) * R]; });
  P.trait(lisse(cr), 0.7);
  return { svg: SVG('specimen herbier-fougere', P.rendre('fougere', [[150, 356, -6 + r() * 12], [at(T, 0.48)[0], at(T, 0.48)[1], 7 - r() * 14]])), nom: 'Fougère', latin: 'Dryopteris filix-mas', fleur: [at(T, 0.5)[0] - 90, at(T, 0.5)[1] - 90, 180, 150] };
}

function avoine(seed) {
  const r = hasard(seed), P = planche(seed);
  const tiges = [tige(r, 144, 388, 320, 60), tige(r, 156, 388, 290, 70)];
  for (const T of tiges) {
    P.lavis(ruban(T, 2.6, 1.2), C.paille, 0.6);
    P.trait(ruban(T, 2.4, 1.0), 0.45);
    for (const t of [0.22, 0.48]) { const [x, y] = at(T, t), a = dirAt(T, t); P.trait(poly([[x + Math.cos(a + Math.PI / 2) * 2, y + Math.sin(a + Math.PI / 2) * 2], [x - Math.cos(a + Math.PI / 2) * 2, y - Math.sin(a + Math.PI / 2) * 2]]), 0.9); }
    // longues feuilles rubanées qui se tordent
    for (const [t, s] of [[0.22, -1], [0.48, 1]]) { const [x, y] = at(T, t), a = dirAt(T, t); P.feuille(feuille(x, y, a + s * 0.45, 120 + r() * 30, 0.05, { forme: 'ruban', courbe: s * 0.55, torsion: 0.4, nervures: 0 }), C.vert, 0.5, 0.55); }
    // la panicule : des épillets qui pendent sur de fins rameaux
    const [hx, hy] = T[T.length - 1];
    for (let i = 0; i < 9; i++) {
      const t = 0.66 + 0.33 * i / 9, [x, y] = at(T, t), a = dirAt(T, t), s = i % 2 ? 1 : -1;
      const b = a + s * (0.7 + r() * 0.3), L = 26 - i * 1.5;
      const R = bezier([x, y], [x + Math.cos(b) * L * 0.5, y + Math.sin(b) * L * 0.5], [x + Math.cos(b) * L, y + Math.sin(b) * L], [x + Math.cos(b) * L + s * 3, y + Math.sin(b) * L + 8], 10);
      P.fin(lisse(R), 0.4);
      const [ex, ey] = R[R.length - 1];
      for (const o of [-0.12, 0.12]) {
        const F = feuille(ex, ey, Math.PI / 2 + o + s * 0.15, 15 + r() * 3, 0.2, { forme: 'lance', nervures: 0 });
        P.lavis(lisse(F.contour, true), C.paille, 0.75); P.trait(lisse(F.contour, true), 0.45);
        P.fin(lisse([F.pointe, [F.pointe[0] + s * 4, F.pointe[1] + 14]]), 0.3); // l'arête
      }
    }
    void hx; void hy;
  }
  const [x, y] = tiges[0][tiges[0].length - 1];
  return { svg: SVG('specimen herbier-avoine', P.rendre('avoine', [[150, 356, -6 + r() * 12], [at(tiges[0], 0.4)[0], at(tiges[0], 0.4)[1], 7 - r() * 14]])), nom: 'Avoine', latin: 'Avena sativa', fleur: [x - 60, y - 20, 140, 120] };
}

function olivier(seed) {
  const r = hasard(seed), P = planche(seed);
  const T = bezier([118, 388], [128, 300], [176, 220], [186, 40], 56);
  P.lavis(ruban(T, 4.6, 1.6), C.brun, 0.55);
  P.trait(ruban(T, 4.2, 1.4), 0.6);
  for (let i = 3; i < T.length - 6; i += 5) { const [x, y] = T[i]; P.fin(poly([[x - 1.5, y], [x + 1.2, y - 2]]), 0.35); }
  // paires de feuilles étroites, argentées dessous (côté qui se dérobe plus pâle)
  for (let i = 0; i < 9; i++) {
    const t = 0.12 + i * 0.095, [x, y] = at(T, t), a = dirAt(T, t);
    for (const s of [-1, 1]) {
      const F = feuille(x, y, a + s * (0.62 + r() * 0.2), 58 - i * 2.6 + r() * 8, 0.11, { forme: 'lance', courbe: s * 0.12, torsion: r() * 0.5, nervures: 3 });
      P.feuille(F, (i + (s > 0)) % 2 ? C.olive : C.sauge, 0.6, 0.62);
    }
  }
  // quelques olives sur de courts pédoncules
  for (const t of [0.38, 0.55, 0.62]) {
    const [x, y] = at(T, t), s = t === 0.55 ? 1 : -1, ox = x + s * 14, oy = y + 14;
    P.fin(lisse([[x, y], [x + s * 7, y + 6], [ox, oy - 6]]), 0.45);
    const o = `M${f(ox - 5.5)} ${f(oy)}a5.5 7 0 1 0 11 0a5.5 7 0 1 0 -11 0`;
    P.lavis(o, t === 0.62 ? C.violetOlive : C.olive, 0.85); P.trait(o, 0.6);
    P.fin(`M${f(ox - 2)} ${f(oy - 3)}q1 -2 3 -2`, 0.45);
  }
  return { svg: SVG('specimen herbier-olivier', P.rendre('olivier', [[124, 352, -8 + r() * 10], [at(T, 0.5)[0], at(T, 0.5)[1], 10 - r() * 14]])), nom: 'Rameau d’olivier', latin: 'Olea europaea', fleur: [at(T, 0.5)[0] - 80, at(T, 0.5)[1] - 60, 160, 140] };
}

function fleurCinq(P, r, x, y, R, rot, { couleur, fonce, etamines = 40, encoche = true, inc = 0.85 }) {
  for (let i = 0; i < 5; i++) {
    const a = rot + i / 5 * Math.PI * 2;
    const pts = [];
    for (let k = 0; k <= 20; k++) {
      const u = k / 20, b = a + (u - 0.5) * 1.25;
      let rr = R * (0.55 + 0.45 * Math.sin(Math.PI * u) ** 0.6);
      if (encoche) rr *= 1 - 0.12 * Math.exp(-((u - 0.5) ** 2) / 0.004);
      pts.push([x + Math.cos(b) * rr, y + Math.sin(b) * rr * inc]);
    }
    const p = [[x, y], ...pts];
    P.lavis(lisse(p, true), i % 2 ? couleur : fonce, 0.6);
    P.trait(lisse(p, true), 0.55);
    for (let k = 0; k < 3; k++) { const b = a + (k - 1) * 0.28; P.fin(lisse([[x + Math.cos(b) * R * 0.2, y + Math.sin(b) * R * 0.2 * inc], [x + Math.cos(b) * R * 0.62, y + Math.sin(b) * R * 0.62 * inc]]), 0.26); }
  }
  for (let k = 0; k < etamines; k++) { const b = r() * Math.PI * 2, d = R * (0.22 + r() * 0.3); const ex = x + Math.cos(b) * d, ey = y + Math.sin(b) * d * inc; P.fin(poly([[x + Math.cos(b) * 3, y + Math.sin(b) * 3 * inc], [ex, ey]]), 0.3); P.point(ex, ey, 0.75); }
  P.lavis(`M${f(x - 5)} ${f(y)}a5 ${f(5 * inc)} 0 1 0 10 0a5 ${f(5 * inc)} 0 1 0 -10 0`, C.or, 0.9);
}
function eglantier(seed, jaune = false) {
  const r = hasard(seed), P = planche(seed);
  const T = bezier([160, 388], [150, 300], [120, 210], [142, 70], 56);
  P.lavis(ruban(T, 3.4, 1.2), C.vertFonce, 0.45); P.trait(ruban(T, 3.2, 1.1), 0.55);
  // aiguillons de l'églantier
  if (!jaune) for (let i = 6; i < T.length - 8; i += 7) { const [x, y] = T[i], a = dirAt(T, i / T.length) + (i % 2 ? 1.9 : -1.9); P.plein(poly([[x - 1.6, y], [x + Math.cos(a) * 5, y + Math.sin(a) * 5 + 2], [x + 1.6, y]], true)); }
  // feuilles composées (églantier) ou simples et opposées (millepertuis)
  for (let i = 0; i < 5; i++) {
    const t = 0.12 + i * 0.15, [x, y] = at(T, t), a = dirAt(T, t), s = i % 2 ? 1 : -1;
    if (jaune) {
      for (const z of [-1, 1]) {
        const F = feuille(x, y, a + z * 1.05, 30 - i * 2, 0.24, { forme: 'ovale', nervures: 3, torsion: r() * 0.3 });
        P.feuille(F, C.vert, 0.5, 0.6);
        for (let k = 0; k < 6; k++) { const u = 0.25 + r() * 0.5, q = at(F.contour.slice(0, 44), u); P.point((q[0] + F.nervure[6][0]) / 2, (q[1] + F.nervure[6][1]) / 2, 0.5); }
      }
    } else {
      const b = a + s * 0.95, L = 64 - i * 4;
      const axe = [[x, y], [x + Math.cos(b) * L * 0.5, y + Math.sin(b) * L * 0.5 - 4], [x + Math.cos(b) * L, y + Math.sin(b) * L - 6]];
      P.fin(lisse(axe), 0.5);
      for (let k = 0; k < 3; k++) {
        const u = 0.3 + k * 0.32, [px, py] = at(bezier(axe[0], axe[1], axe[1], axe[2], 10), u);
        for (const z of k === 2 ? [0] : [-1, 1]) P.feuille(feuille(px, py, b + z * 1.0, 17 - k, 0.36, { forme: 'ovale', dents: 7, profondeur: 0.035, nervures: 3, torsion: z > 0 ? 0.3 : 0 }), C.vert, 0.5, 0.55);
      }
    }
  }
  // deux fleurs et un bouton (ou des cynorhodons)
  const [x, y] = T[T.length - 1];
  const couleur = jaune ? C.jaune : C.rose, fonce = jaune ? C.or : C.roseFonce;
  fleurCinq(P, r, x, y - 4, 36, r() * 1.2, { couleur, fonce, etamines: jaune ? 70 : 36, encoche: !jaune, inc: 0.88 });
  const [bx, by] = at(T, 0.66);
  const B = bezier([bx, by], [bx + 24, by - 12], [bx + 44, by - 10], [bx + 56, by + 4], 12);
  P.trait(ruban(B, 1.4, 0.8), 0.5);
  const [ex, ey] = B[B.length - 1];
  if (jaune) fleurCinq(P, r, ex, ey + 6, 18, 0.6, { couleur, fonce, etamines: 44, encoche: false, inc: 0.6 });
  else {
    // un cynorhodon (le fruit de l'églantier) et sa couronne de sépales
    const fr = `M${f(ex - 6)} ${f(ey + 10)}a6 10 0 1 0 12 0a6 10 0 1 0 -12 0`;
    P.lavis(fr, C.rouge, 0.8); P.trait(fr, 0.6);
    for (const o of [-0.5, 0, 0.5]) P.fin(lisse([[ex, ey + 1], [ex + Math.sin(o) * 5, ey - 4], [ex + Math.sin(o) * 9, ey - 8]]), 0.45);
  }
  return { svg: SVG(`specimen herbier-${jaune ? 'millepertuis' : 'eglantier'}`, P.rendre(jaune ? 'millepertuis' : 'eglantier', [[156, 352, -6 + r() * 12], [at(T, 0.45)[0], at(T, 0.45)[1], 7 - r() * 14]])), nom: jaune ? 'Millepertuis' : 'Églantier', latin: jaune ? 'Hypericum perforatum' : 'Rosa canina', fleur: [x - 70, y - 50, 160, 130] };
}
const millepertuis = (seed) => eglantier(seed, true);

export const ESPECES = { lavande, camomille, coquelicot, pissenlit, fougere, avoine, olivier, eglantier, millepertuis };
// Les noms, sans dessiner (pour l'étiquette d'une planche dessinée plus tard)
export const NOMS_ESPECES = {
  lavande: ['Lavande vraie', 'Lavandula angustifolia'], camomille: ['Camomille', 'Matricaria chamomilla'], coquelicot: ['Coquelicot', 'Papaver rhoeas'],
  pissenlit: ['Pissenlit en aigrette', 'Taraxacum officinale'], fougere: ['Fougère', 'Dryopteris filix-mas'], avoine: ['Avoine', 'Avena sativa'],
  olivier: ['Rameau d’olivier', 'Olea europaea'], eglantier: ['Églantier', 'Rosa canina'], millepertuis: ['Millepertuis', 'Hypericum perforatum'],
};

// Le thème de l'approche (ses mots) choisit la plante : une correspondance de sens, jamais une promesse de soin.
const THEMES = [
  [/d[ée]tente|relax|calme|apais|sommeil|repos|douceur/i, 'lavande'],
  [/stress|anxi|tension|pression|surmenage/i, 'camomille'],
  [/[ée]motion|c(œ|oe)ur|sensib|ressenti/i, 'coquelicot'],
  [/l[âa]cher|lib[ée]r|l[ée]g[èe]r|souffl|respir|d[ée]poser/i, 'pissenlit'],
  [/[ée]quilibre|harmonie|ancr|centr|alignement/i, 'fougere'],
  [/confiance|estime|soi\b|rayonn|lumi[èe]re|affirm/i, 'millepertuis'],
  [/ressource|force|racine|[ée]nergie|vitalit|r[ée]silien/i, 'avoine'],
  [/s[ée]r[ée]nit|paix|bienveillan|sagesse/i, 'olivier'],
  [/projet|chang|avenir|[ée]lan|transition|cap\b|objectif|[ée]panou/i, 'eglantier'],
];
const ORDRE = ['lavande', 'fougere', 'coquelicot', 'olivier', 'camomille', 'pissenlit', 'eglantier', 'avoine', 'millepertuis'];
/** Les plantes de ses planches, une par thème, jamais deux fois la même. */
export function especesPour(apports, seed) {
  const pris = new Set();
  return apports.map((a, i) => {
    const t = `${a?.titre || ''} ${a?.texte || ''}`;
    let e = THEMES.find(([re, nom]) => re.test(t) && !pris.has(nom))?.[1];
    if (!e) e = ORDRE.map((_, k) => ORDRE[(k + seed + i) % ORDRE.length]).find((n) => !pris.has(n)) || ORDRE[i % ORDRE.length];
    pris.add(e);
    return e;
  });
}

// ---------- La liane de l'arche : une clématite qui grimpe le long du cadre ----------
// L'arche : un rectangle surmonté d'un demi-cercle (boîte l x h, rayon l/2). La liane monte sur le côté gauche,
// passe par-dessus le cintre, et retombe un peu à droite ; feuilles, vrilles, quelques fleurs.
export function liane(seed, l = 400, h = 533) {
  const r = hasard(seed), P = planche(seed);
  const R = l / 2, cx = l / 2, cy = R; // centre du cintre
  const cadre = (s) => { // point sur le cadre, s de 0 (bas gauche) à 1 (milieu du cintre côté droit, vers 2 h)
    const H = h - R, arcL = Math.PI * R * 0.78, tot = H + arcL, d = s * tot;
    if (d < H) return [-2, h - d];
    const a = Math.PI - (d - H) / R; return [cx + Math.cos(a) * (R + 2), cy - Math.sin(a) * (R + 2)];
  };
  // la tige principale serpente autour du cadre
  const pts = [];
  for (let i = 0; i <= 90; i++) { const s = i / 90, [x, y] = cadre(s), ond = Math.sin(s * 22 + r() * 0.3) * 7; const nx = s < 0.45 ? -1 : (x - cx) / (R || 1), ny = s < 0.45 ? 0 : (y - cy) / (R || 1); pts.push([x + nx * ond, y + ny * ond]); }
  pts.unshift([18, h + 26], [4, h + 8]);
  P.lavis(ruban(pts, 3.2, 1.0), C.brun, 0.45);
  P.trait(ruban(pts, 2.8, 0.8), 0.5);
  // feuilles et vrilles, à pas irréguliers : touffues à la base et sur le cintre, plus clairsemées entre les deux ;
  // sur le montant, la pesanteur fait pendre les feuilles vers le bas
  let i = 3;
  while (i < pts.length - 3) {
    const s0 = (i - 2) / (pts.length - 2);
    const densite = s0 < 0.18 || s0 > 0.55 ? 1 : 0.72;
    const [x, y] = pts[i], a = Math.atan2(pts[i + 1][1] - pts[i - 1][1], pts[i + 1][0] - pts[i - 1][0]);
    const s = r() < 0.5 ? 1 : -1;
    const tombe = s0 < 0.45 ? Math.PI / 2 : a + s * 1.2; // vers le bas sur le montant
    const b = tombe * 0.55 + (a + s * 1.15) * 0.45 + (r() - 0.5) * 0.5, L = 10 + r() * 16;
    const px = x + Math.cos(b) * L, py = y + Math.sin(b) * L;
    P.fin(lisse([[x, y], [x + Math.cos(b) * L * 0.5 + (r() - 0.5) * 4, y + Math.sin(b) * L * 0.5], [px, py]]), 0.55);
    const echelle = 0.75 + r() * 0.65, trois = r() < 0.72;
    for (const z of trois ? [-0.8 - r() * 0.3, 0, 0.8 + r() * 0.3] : [0]) {
      P.feuille(feuille(px, py, b + z + (r() - 0.5) * 0.25, (z ? 22 : 30) * echelle * (0.85 + r() * 0.3), 0.26 + r() * 0.06, { forme: 'lance', dents: 3, profondeur: 0.035, courbe: z * 0.35 + (r() - 0.5) * 0.4, torsion: r() * 0.5, nervures: 4 }), r() < 0.7 ? C.vert : C.vertFonce, 0.5 + r() * 0.15, 0.55);
    }
    if (r() < 0.45) { // une vrille qui s'enroule
      const sv = -s, c = a + sv * (0.7 + r() * 0.5), vx = x + Math.cos(c) * 8, vy = y + Math.sin(c) * 8, tours = 6 + r() * 5;
      const sp = Array.from({ length: 22 }, (_, k) => { const t = k / 21, rr = 8 * (1 - t * 0.85), ang = c + t * tours * sv; return [vx + Math.cos(c) * t * 16 + Math.cos(ang) * rr * t, vy + Math.sin(c) * t * 16 + Math.sin(ang) * rr * t]; });
      P.fin(lisse([[x, y], ...sp]), 0.4);
    }
    i += Math.max(2, Math.round((3 + r() * 4) / densite));
  }
  // fleurs de clématite : quatre larges sépales ovales, veinés, étamines en houppe ; quelques boutons
  const fleurs = [0.12 + r() * 0.06, 0.36 + r() * 0.06, 0.6, 0.72 + r() * 0.04, 0.88 + r() * 0.06].map((s) => { const [x, y] = cadre(s); return [x + (r() - 0.5) * 14, y + (r() - 0.5) * 10]; });
  fleurs.forEach(([x, y], k) => {
    const R2 = 21 + r() * 10, rot = r() * 1.6, inc = 0.7 + r() * 0.3;
    const sepales = [0, 1, 2, 3].sort((p, q) => Math.sin(rot + p * Math.PI / 2) - Math.sin(rot + q * Math.PI / 2));
    for (const i2 of sepales) {
      const a = rot + i2 / 4 * Math.PI * 2 + (r() - 0.5) * 0.15;
      const pts2 = [];
      for (let j = 0; j <= 18; j++) { const u = j / 18, e = Math.sin(Math.PI * Math.pow(u, 0.85)) * 0.42; pts2.push([u, e]); }
      const vers = (u, e) => [x + Math.cos(a) * u * R2 - Math.sin(a) * e * R2, y + (Math.sin(a) * u * R2 + Math.cos(a) * e * R2) * inc];
      const contour = [...pts2.map(([u, e]) => vers(u, e)), ...pts2.slice(1, -1).reverse().map(([u, e]) => vers(u, -e))];
      P.lavis(lisse(contour, true), k % 2 ? C.rose : C.creme, 0.82);
      P.trait(lisse(contour, true), 0.55);
      for (const e of [-0.18, 0, 0.18]) P.fin(lisse([vers(0.12, e * 0.3), vers(0.5, e), vers(0.86, e * 0.6)]), 0.28);
    }
    for (let i2 = 0; i2 < 22; i2++) { const b = r() * Math.PI * 2, d = 3 + r() * 4; P.fin(poly([[x, y], [x + Math.cos(b) * d, y + Math.sin(b) * d * inc]]), 0.32); P.point(x + Math.cos(b) * d, y + Math.sin(b) * d * inc, 0.55); }
    P.lavis(`M${f(x - 3.5)} ${f(y)}a3.5 3 0 1 0 7 0a3.5 3 0 1 0 -7 0`, C.or, 0.9);
  });
  for (const s of [0.25, 0.5, 0.82]) { // boutons
    const [x, y] = cadre(s + (r() - 0.5) * 0.03), a = r() * Math.PI * 2;
    const bt = `M${f(x)} ${f(y)}q${f(Math.cos(a) * 6 - 4)} ${f(Math.sin(a) * 6 - 2)} ${f(Math.cos(a) * 12)} ${f(Math.sin(a) * 12)}q${f(-Math.cos(a) * 2 + 5)} ${f(-Math.sin(a) * 6 + 2)} ${f(-Math.cos(a) * 12)} ${f(-Math.sin(a) * 12)}Z`;
    P.lavis(bt, C.rose, 0.7); P.trait(bt, 0.5);
  }
  return P.rendre('liane', [], [1, 1.4]);
}

// Le cadre de l'arche au trait : un double filet d'encre, un peu vivant (pas une forme de logiciel).
export function cadreArche(seed, l = 400, h = 533) {
  const r = hasard(seed);
  const R = l / 2;
  const contour = (m, j) => {
    const pts = [];
    for (let i = 0; i <= 14; i++) pts.push([m + (r() - 0.5) * j, h - m - (h - R - m) * i / 14]);
    for (let i = 1; i < 40; i++) { const a = Math.PI - i / 40 * Math.PI; pts.push([R + Math.cos(a) * (R - m) + (r() - 0.5) * j, R - Math.sin(a) * (R - m) + (r() - 0.5) * j]); }
    for (let i = 0; i <= 14; i++) pts.push([l - m + (r() - 0.5) * j, R + (h - R - m) * i / 14]);
    return pts;
  };
  const ext = contour(0, 0.8), int = contour(11, 0.6);
  return `<path class="arche-trait" d="${lisse(ext)}" fill="none" stroke="${ENCRE}" stroke-width="1.2" stroke-linecap="round"/>`
    + `<path class="arche-trait" d="${lisse(int)}" fill="none" stroke="${ENCRE}" stroke-width=".6" stroke-opacity=".7" stroke-linecap="round"/>`
    + `<path class="arche-appui" d="M-14 ${h}H${l + 14}M-8 ${h + 6}H${l + 8}" fill="none" stroke="${ENCRE}" stroke-width=".9" stroke-linecap="round"/>`;
}
