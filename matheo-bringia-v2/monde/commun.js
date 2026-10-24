/* Petits outils partagés du monde de Bringia. */
export const borne = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lisse = (a, b, x) => { const t = borne((x - a) / (b - a)); return t * t * (3 - 2 * t); };
export const plusLisse = (a, b, x) => { const t = borne((x - a) / (b - a)); return t * t * t * (t * (t * 6 - 15) + 10); };
export const melange = (a, b, t) => a + (b - a) * t;
/* amorti indépendant de la cadence : vitesse k (par seconde) */
export const amortir = (x, cible, k, dt) => x + (cible - x) * (1 - Math.exp(-k * dt));
export const sortieCubique = (t) => 1 - Math.pow(1 - borne(t), 3);
export const entreeSortie = (t) => { t = borne(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
/* une cloche : 0 hors de [a, d], 1 entre b et c, montées douces */
export const cloche = (a, b, c, d, x) => lisse(a, b, x) * (1 - lisse(c, d, x));

/* En tête de TOUS les nuanceurs écrits à la main (puces Adreno : même précision des deux côtés). */
export const HP = 'precision highp float;\nprecision highp int;\n';

/* Interpolation d'une table de clés [[s, valeur], ...] (s croissant), en Hermite monotone (vitesse continue,
   jamais de dépassement). */
export function table(cles) {
  const n = cles.length, xs = cles.map((c) => c[0]), ys = cles.map((c) => c[1]);
  const d = [], m = new Array(n).fill(0);
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / Math.max(1e-9, xs[i + 1] - xs[i]));
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  m[0] = d[0]; m[n - 1] = d[n - 2];
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) { m[i] = 0; m[i + 1] = 0; continue; }
    const a = m[i] / d[i], b = m[i + 1] / d[i], h = a * a + b * b;
    if (h > 9) { const t = 3 / Math.sqrt(h); m[i] = t * a * d[i]; m[i + 1] = t * b * d[i]; }
  }
  return (x) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0; while (i < n - 2 && x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i], t = (x - xs[i]) / h, t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1];
  };
}

/* bruit de valeur (JS) pour les tremblements doux */
export function bruit1(x) {
  const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  const h = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  return h(i) * (1 - u) + h(i + 1) * u;
}
