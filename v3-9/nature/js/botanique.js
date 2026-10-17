// Botanique generee en code : fougeres, rameaux, feuilles. Chaque dessin vient
// d'une graine, donc il est different d'un praticien a l'autre mais toujours le
// meme pour une meme page. Sortie : du SVG en texte (servi tel quel, sans JavaScript).

export function graine(texte = '') {
  let h = 1779033703 ^ texte.length;
  for (let i = 0; i < texte.length; i++) { h = Math.imul(h ^ texte.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  return h >>> 0;
}
export function hasard(s) { // mulberry32
  return () => { s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const f = (n) => Math.round(n * 10) / 10;

// Une feuille (deux courbes) de P vers Q, largeur relative l, courbure c.
function limbe(px, py, qx, qy, l, c = 0) {
  const mx = (px + qx) / 2, my = (py + qy) / 2, dx = qx - px, dy = qy - py, L = Math.hypot(dx, dy) || 1;
  const nx = -dy / L, ny = dx / L;
  const a1x = mx + nx * L * l + dx * c, a1y = my + ny * L * l + dy * c;
  const a2x = mx - nx * L * l + dx * c, a2y = my - ny * L * l + dy * c;
  return `M${f(px)} ${f(py)}Q${f(a1x)} ${f(a1y)} ${f(qx)} ${f(qy)}Q${f(a2x)} ${f(a2y)} ${f(px)} ${f(py)}Z`;
}

/** Fougere : un rachis courbe, des pennes alternees faites de folioles. */
export function fougere(seed, { largeur = 220, hauteur = 520, classe = 'fougere' } = {}) {
  const r = hasard(seed);
  const cx = largeur / 2, courbe = (r() - .5) * largeur * .5;
  const B = (t) => { const u = 1 - t; return [u * u * cx + 2 * u * t * (cx + courbe * 1.4) + t * t * (cx + courbe), u * u * (hauteur - 6) + 2 * u * t * (hauteur * .5) + t * t * 14]; };
  const tige = `M${f(cx)} ${f(hauteur - 6)}Q${f(cx + courbe * 1.4)} ${f(hauteur * .5)} ${f(cx + courbe)} 14`;
  let pennes = '';
  const N = 13 + Math.floor(r() * 5);
  for (let i = 0; i < N; i++) {
    const t = .1 + .86 * (i / N);
    const [x, y] = B(t), [x2, y2] = B(Math.min(1, t + .01));
    const ang = Math.atan2(y2 - y, x2 - x);
    const L = largeur * .46 * Math.pow(1 - t, .55) * (.55 + .45 * Math.sin(Math.min(1, t * 1.3) * Math.PI * .9 + .3));
    for (const cote of [-1, 1]) {
      const a = ang + cote * (1.05 - t * .35);
      const qx = x + Math.cos(a) * L, qy = y + Math.sin(a) * L;
      let d = `M${f(x)} ${f(y)}L${f(qx)} ${f(qy)}`;
      const n = Math.max(3, Math.round(L / 9));
      for (let k = 1; k <= n; k++) { // folioles le long de la penne
        const u = k / (n + 1), bx = x + (qx - x) * u, by = y + (qy - y) * u, l2 = L * .2 * (1 - u * .7);
        for (const s of [-1, 1]) {
          const b = a + s * 1.1 - (s * .25);
          d += limbe(bx, by, bx + Math.cos(b) * l2 + Math.cos(a) * l2 * .5, by + Math.sin(b) * l2 + Math.sin(a) * l2 * .5, .32, .05);
        }
      }
      pennes += `<path class="penne" style="--k:${i}" d="${d}"/>`;
    }
  }
  return `<svg class="${classe}" viewBox="0 0 ${largeur} ${hauteur}" aria-hidden="true" focusable="false"><path class="tige" pathLength="1" d="${tige}"/>${pennes}</svg>`;
}

/** Rameau : une tige qui ondule, des feuilles ovales alternees. */
export function rameau(seed, { largeur = 160, hauteur = 360, feuilles = 9, classe = 'rameau' } = {}) {
  const r = hasard(seed);
  const pts = []; let x = largeur / 2, y = hauteur - 4;
  for (let i = 0; i <= 6; i++) { pts.push([x, y]); x += (r() - .5) * largeur * .22; y -= (hauteur - 20) / 6; }
  let tige = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 1; i < pts.length; i++) { const [ax, ay] = pts[i - 1], [bx, by] = pts[i]; tige += `Q${f(ax)} ${f((ay + by) / 2)} ${f((ax + bx) / 2)} ${f(by + (ay - by) * .1)}T${f(bx)} ${f(by)}`; }
  let fe = '';
  for (let i = 0; i < feuilles; i++) {
    const t = .12 + .85 * i / feuilles, k = t * (pts.length - 1), j = Math.floor(k), u = k - j;
    const [ax, ay] = pts[j], [bx, by] = pts[Math.min(pts.length - 1, j + 1)];
    const px = ax + (bx - ax) * u, py = ay + (by - ay) * u, cote = i % 2 ? 1 : -1;
    const L = largeur * (.34 - t * .14) * (.8 + r() * .4), a = -Math.PI / 2 + cote * (.85 + r() * .35);
    fe += `<path class="feuille" style="--k:${i}" d="${limbe(px, py, px + Math.cos(a) * L, py + Math.sin(a) * L, .3, .06)}"/>`;
  }
  return `<svg class="${classe}" viewBox="0 0 ${largeur} ${hauteur}" aria-hidden="true" focusable="false"><path class="tige" pathLength="1" d="${tige}"/>${fe}</svg>`;
}

/** Feuille seule, avec nervures : quatre formes (lanceolee, ovale, en coeur, trefle). */
export function feuille(seed, forme = 0) {
  const r = hasard(seed);
  let d = '', nerv = '';
  if (forme === 3) { // trefle
    for (const a of [-2.1, -Math.PI / 2, -1.05]) {
      const x = 50 + Math.cos(a) * 30, y = 62 + Math.sin(a) * 30;
      d += `M50 62C${f(50 + Math.cos(a - .9) * 40)} ${f(62 + Math.sin(a - .9) * 40)} ${f(x + Math.cos(a) * 14)} ${f(y + Math.sin(a) * 14)} ${f(x)} ${f(y + 2)}C${f(x + Math.cos(a) * 14 + 6)} ${f(y + Math.sin(a) * 14)} ${f(50 + Math.cos(a + .9) * 40)} ${f(62 + Math.sin(a + .9) * 40)} 50 62Z`;
      nerv += `M50 62L${f(50 + Math.cos(a) * 30)} ${f(62 + Math.sin(a) * 30)}`;
    }
    nerv += 'M50 62Q52 80 47 94';
  } else {
    const l = [16, 27, 30][forme] * (.9 + r() * .2), haut = 8, bas = 90;
    const coeur = forme === 2 ? `C${50 - l * .2} ${bas - 6} ${50 - l * .5} ${bas + 2} ${50 - l} ${bas - 22}` : `C${50 - l * .5} ${bas - 4} ${50 - l} ${bas - 16} ${50 - l} ${bas - 34}`;
    d = `M50 ${bas}${coeur}C${50 - l} ${haut + 30} ${50 - l * .3} ${haut + 8} 50 ${haut}C${50 + l * .3} ${haut + 8} ${50 + l} ${haut + 30} ${50 + l} ${bas - (forme === 2 ? 22 : 34)}${forme === 2 ? `C${50 + l * .5} ${bas + 2} ${50 + l * .2} ${bas - 6} 50 ${bas}` : `C${50 + l} ${bas - 16} ${50 + l * .5} ${bas - 4} 50 ${bas}`}Z`;
    nerv = `M50 ${bas + 6}L50 ${haut + 6}`;
    for (let i = 1; i <= 5; i++) { const y = bas - i * (bas - haut) / 6.5, w = l * .75 * Math.sin(i / 6 * Math.PI) + 4; nerv += `M50 ${f(y)}Q${f(50 - w * .4)} ${f(y - 6)} ${f(50 - w)} ${f(y - 14)}M50 ${f(y)}Q${f(50 + w * .4)} ${f(y - 6)} ${f(50 + w)} ${f(y - 14)}`; }
  }
  const rot = Math.round((r() - .5) * 40);
  return `<svg class="feuille-icone" viewBox="0 0 100 100" aria-hidden="true" focusable="false"><g transform="rotate(${rot} 50 55)"><path class="limbe" d="${d}"/><path class="nervure" d="${nerv}"/></g></svg>`;
}

// ---------- Specimens d'herbier (planches) ----------
// Chaque fonction rend un SVG de viewBox 0 0 300 400, la plante posee en bas au centre,
// avec les points ou poser les bandelettes de papier gomme (attaches).
const SVG = (classe, corps, attaches = []) => `<svg class="${classe}" viewBox="0 0 300 400" aria-hidden="true" focusable="false">${corps}${attaches.map(([x, y, a]) => `<rect class="bandelette" x="${f(x - 17)}" y="${f(y - 5)}" width="34" height="10" transform="rotate(${f(a)} ${f(x)} ${f(y)})"/>`).join('')}</svg>`;

// Une tige courbe de (x0,y0) vers le haut ; renvoie le chemin et une fonction point(t).
function tigeCourbe(r, x0, y0, h, ecart) {
  const c1 = [x0 + (r() - .5) * ecart, y0 - h * .35], c2 = [x0 + (r() - .5) * ecart * 1.4, y0 - h * .7], p = [x0 + (r() - .5) * ecart * 1.2, y0 - h];
  const pt = (t) => { const u = 1 - t; return [u * u * u * x0 + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * p[0], u * u * u * y0 + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * p[1]]; };
  return { d: `M${f(x0)} ${f(y0)}C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p[0])} ${f(p[1])}`, pt };
}
const angle = (pt, t) => { const [a, b] = pt(Math.max(0, t - .01)), [c, e] = pt(Math.min(1, t + .01)); return Math.atan2(e - b, c - a); };

/** Graminee : deux ou trois chaumes souples, epillets en panicule, longues feuilles. */
export function graminee(seed, classe = 'specimen') {
  const r = hasard(seed);
  let tiges = '', feuilles = '', epis = '';
  const n = 2 + Math.floor(r() * 2);
  for (let k = 0; k < n; k++) {
    const T = tigeCourbe(r, 150 + (k - (n - 1) / 2) * 14, 386, 300 + r() * 50, 90);
    tiges += `<path class="tige" d="${T.d}"/>`;
    const N = 9 + Math.floor(r() * 6);
    for (let i = 0; i < N; i++) {
      const t = .62 + .38 * i / N, [x, y] = T.pt(t), a = angle(T.pt, t), cote = i % 2 ? 1 : -1;
      const L = 16 + 12 * (1 - i / N) + r() * 6, b = a + cote * (.42 + r() * .25);
      epis += `<path class="epillet" d="${limbe(x, y, x + Math.cos(b) * L, y + Math.sin(b) * L, .2, .1)}"/>`;
    }
    const [lx, ly] = T.pt(.18 + r() * .2), cote = k % 2 ? 1 : -1;
    feuilles += `<path class="feuille" d="M${f(lx)} ${f(ly)}Q${f(lx + cote * 60)} ${f(ly - 70)} ${f(lx + cote * (70 + r() * 40))} ${f(ly - 150 - r() * 60)}Q${f(lx + cote * 46)} ${f(ly - 70)} ${f(lx + cote * 3)} ${f(ly + 4)}Z"/>`;
  }
  return SVG(classe + ' graminee', feuilles + tiges + epis, [[150, 346, -8 + r() * 16], [150 + (r() - .5) * 20, 230, -10 + r() * 20]]);
}

/** Ombelle : une tige, des feuilles decoupees, des rayons en dome et des fleurettes en grappes. */
export function ombelle(seed, classe = 'specimen') {
  const r = hasard(seed);
  const T = tigeCourbe(r, 150, 388, 250 + r() * 30, 50);
  let corps = `<path class="tige" d="${T.d}"/>`;
  for (const t of [.22, .45]) { // feuilles decoupees
    const [x, y] = T.pt(t), cote = t < .3 ? -1 : 1, a = -Math.PI / 2 + cote * 1.0;
    let d = `M${f(x)} ${f(y)}L${f(x + Math.cos(a) * 70)} ${f(y + Math.sin(a) * 70)}`;
    for (let i = 1; i <= 5; i++) { const u = i / 6, bx = x + Math.cos(a) * 70 * u, by = y + Math.sin(a) * 70 * u; for (const s of [-1, 1]) { const b = a + s * .9; d += limbe(bx, by, bx + Math.cos(b) * (16 - i * 1.6), by + Math.sin(b) * (16 - i * 1.6), .34, .05); } }
    corps += `<path class="feuille" d="${d}"/>`;
  }
  const [cx, cy] = T.pt(1), R = 70 + r() * 16, n = 9 + Math.floor(r() * 4);
  let rayons = '', fleurs = '';
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (i / (n - 1) - .5) * 2.3, L = R * (.8 + .25 * Math.cos((i / (n - 1) - .5) * 3)), x = cx + Math.cos(a) * L, y = cy + Math.sin(a) * L * .7;
    rayons += `M${f(cx)} ${f(cy)}Q${f(cx + Math.cos(a) * L * .5)} ${f(cy + Math.sin(a) * L * .5 - 6)} ${f(x)} ${f(y)}`;
    for (let j = 0; j < 7; j++) { const b = -Math.PI / 2 + (j / 6 - .5) * 2.4, l = 9 + r() * 4, fx = x + Math.cos(b) * l, fy = y + Math.sin(b) * l * .8; rayons += `M${f(x)} ${f(y)}L${f(fx)} ${f(fy)}`; fleurs += `<circle class="fleur" cx="${f(fx)}" cy="${f(fy)}" r="${f(2.1 + r() * 1.1)}"/>`; }
  }
  corps += `<path class="tige fine" d="${rayons}"/>${fleurs}`;
  return SVG(classe + ' ombelle', corps, [[150, 350, 6 - r() * 12], [T.pt(.6)[0], T.pt(.6)[1], -6 + r() * 12]]);
}

/** Tige fleurie : feuilles lanceolees alternees, deux ou trois fleurs des champs en haut. */
export function tigeFleurie(seed, classe = 'specimen') {
  const r = hasard(seed);
  const T = tigeCourbe(r, 150, 388, 230 + r() * 40, 70);
  let corps = `<path class="tige" d="${T.d}"/>`, fe = '', fl = '';
  for (let i = 0; i < 7; i++) {
    const t = .08 + .62 * i / 7, [x, y] = T.pt(t), a = angle(T.pt, t), cote = i % 2 ? 1 : -1;
    const L = 46 - i * 4 + r() * 8, b = a + cote * (.7 + r() * .3);
    fe += `<path class="feuille" d="${limbe(x, y, x + Math.cos(b) * L, y + Math.sin(b) * L, .24, .08)}"/>`;
  }
  const tetes = [[1, 0]];
  for (const t of [.74, .84]) if (r() < .85) tetes.push([t, t < .8 ? -1 : 1]);
  for (const [t, cote] of tetes) {
    let [x, y] = T.pt(t);
    if (cote) { const a = angle(T.pt, t) + cote * .6, L = 40 + r() * 20, ex = x + Math.cos(a) * L, ey = y + Math.sin(a) * L - 10; corps += `<path class="tige" d="M${f(x)} ${f(y)}Q${f(x + Math.cos(a) * L * .4)} ${f(y + Math.sin(a) * L * .6)} ${f(ex)} ${f(ey)}"/>`; x = ex; y = ey; }
    const n = 11 + Math.floor(r() * 5), R = 15 + r() * 6, inc = .55 + r() * .3; // fleur un peu de biais, comme pressee
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; fl += `<path class="fleur" d="${limbe(x, y, x + Math.cos(a) * R, y + Math.sin(a) * R * inc, .22, 0)}"/>`; }
    fl += `<ellipse class="coeur" cx="${f(x)}" cy="${f(y)}" rx="${f(R * .3)}" ry="${f(R * .3 * inc)}"/>`;
  }
  return SVG(classe + ' tige-fleurie', fe + corps + fl, [[150, 352, -5 + r() * 10], [T.pt(.45)[0], T.pt(.45)[1], 8 - r() * 16]]);
}

/** Fougere en planche (meme dessin que la fougere, cadre 300 x 400). */
export function fougerePlanche(seed, classe = 'specimen') {
  const s = fougere(seed, { largeur: 300, hauteur: 400, classe: classe + ' fougere-planche' });
  return s.replace('</svg>', `<rect class="bandelette" x="133" y="352" width="34" height="10" transform="rotate(-6 150 357)"/><rect class="bandelette" x="128" y="205" width="34" height="10" transform="rotate(8 145 210)"/></svg>`);
}

/** Rameau en planche. */
export function rameauPlanche(seed, classe = 'specimen') {
  const s = rameau(seed, { largeur: 300, hauteur: 400, feuilles: 12, classe: classe + ' rameau-planche' });
  return s.replace('</svg>', `<rect class="bandelette" x="133" y="360" width="34" height="10" transform="rotate(5 150 365)"/><rect class="bandelette" x="130" y="200" width="34" height="10" transform="rotate(-7 147 205)"/></svg>`);
}

export const SPECIMENS = [ombelle, graminee, tigeFleurie, fougerePlanche, rameauPlanche];

/** Pierre plate du sentier : un contour irregulier. */
export function pierre(seed, l = 64, h = 26) {
  // une pierre plate aux pans un peu anguleux (comme celles du pas japonais), coins adoucis
  const r = hasard(seed), n = 7 + Math.floor(r() * 3), t0 = r() * 6;
  const pts = Array.from({ length: n }, (_, i) => { const a = t0 + (i + (r() - .5) * .5) / n * Math.PI * 2, k = .8 + r() * .2; return [l / 2 + Math.cos(a) * l / 2 * k, h / 2 + Math.sin(a) * h / 2 * k]; });
  let d = `M${f((pts[0][0] + pts[n - 1][0]) / 2)} ${f((pts[0][1] + pts[n - 1][1]) / 2)}`;
  for (let i = 0; i < n; i++) {
    const [x, y] = pts[i], [x0, y0] = pts[(i - 1 + n) % n], [x2, y2] = pts[(i + 1) % n], u = .38;
    d += `L${f(x + ((x0 + x) / 2 - x) * u)} ${f(y + ((y0 + y) / 2 - y) * u)}Q${f(x)} ${f(y)} ${f(x + ((x + x2) / 2 - x) * u)} ${f(y + ((y + y2) / 2 - y) * u)}`;
  }
  return d + 'Z';
}

/** Graines repandues a cote d'un sachet. */
export function graines(seed, n = 9, l = 160, h = 70) {
  const r = hasard(seed);
  let s = '';
  for (let i = 0; i < n; i++) { const x = 10 + r() * (l - 20), y = 10 + r() * (h - 20), a = Math.round(r() * 180), rx = 2.6 + r() * 1.6; s += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx)}" ry="${f(rx * .55)}" transform="rotate(${a} ${f(x)} ${f(y)})"/>`; }
  return `<svg class="graines" viewBox="0 0 ${l} ${h}" aria-hidden="true" focusable="false">${s}</svg>`;
}

/** Petite fleur des champs (pour les emplacements et le pied de page). */
export function fleurette(seed, { taille = 64 } = {}) {
  const r = hasard(seed), n = 5 + Math.floor(r() * 4), c = taille / 2;
  let p = '';
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + r() * .2; p += limbe(c, c, c + Math.cos(a) * c * .92, c + Math.sin(a) * c * .92, .36, .02); }
  return `<svg class="fleurette" viewBox="0 0 ${taille} ${taille}" aria-hidden="true" focusable="false"><path class="petales" d="${p}"/><circle class="coeur" cx="${c}" cy="${c}" r="${f(taille * .13)}"/></svg>`;
}
