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

/** Petite fleur des champs (pour les emplacements et le pied de page). */
export function fleurette(seed, { taille = 64 } = {}) {
  const r = hasard(seed), n = 5 + Math.floor(r() * 4), c = taille / 2;
  let p = '';
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + r() * .2; p += limbe(c, c, c + Math.cos(a) * c * .92, c + Math.sin(a) * c * .92, .36, .02); }
  return `<svg class="fleurette" viewBox="0 0 ${taille} ${taille}" aria-hidden="true" focusable="false"><path class="petales" d="${p}"/><circle class="coeur" cx="${c}" cy="${c}" r="${f(taille * .13)}"/></svg>`;
}
