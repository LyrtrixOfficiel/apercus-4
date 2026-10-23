// Mathéo Bringia : une séquence d'images jouée au défilement (comme les pages produit d'Apple).
// Chargement PROGRESSIF et PRIORITAIRE : la première image, puis une image sur 16, sur 8, sur 4, sur 2, puis toutes.
// On voit donc toute la séquence très vite (en saccadé), et elle se remplit jusqu'à être fluide. Pendant le
// chargement, on dessine l'image chargée la plus proche : jamais de trou noir. Si le visiteur défile vite vers une
// image pas encore chargée, elle passe en tête de file.

export class Sequence {
  /**
   * @param {object} o
   * @param {string} o.dossier  par exemple 'img/kart/t/'
   * @param {number} o.n        nombre d'images (000.webp à n-1)
   * @param {number} [o.simultanes] chargements en parallèle
   */
  constructor({ dossier, n, simultanes = 6, surProgres = null }) {
    this.dossier = dossier; this.n = n; this.simultanes = simultanes; this.surProgres = surProgres;
    this.images = new Array(n).fill(null);
    this.etat = new Uint8Array(n); // 0 rien, 1 en cours, 2 prêt, 3 échec
    this.prets = 0; this.enCours = 0; this.arrete = false;
    const vu = new Set(); this.file = [];
    const pousser = (i) => { if (i >= 0 && i < n && !vu.has(i)) { vu.add(i); this.file.push(i); } };
    pousser(0); pousser(n - 1);
    for (const pas of [16, 8, 4, 2, 1]) for (let i = 0; i < n; i += pas) pousser(i);
    this.ecouteurs = new Set();
  }
  url(i) { return `${this.dossier}${String(i).padStart(3, '0')}.webp`; }
  lancer() { this.pomper(); return this; }
  arreter() { this.arrete = true; }
  /** Fait passer l'image i (et ses voisines) en tête de file. */
  prioriser(i) {
    i = Math.round(i);
    for (const k of [i + 2, i - 1, i + 1, i]) {
      if (k < 0 || k >= this.n || this.etat[k]) continue;
      const j = this.file.indexOf(k); if (j > 0) { this.file.splice(j, 1); this.file.unshift(k); }
    }
    this.pomper();
  }
  pomper() {
    while (!this.arrete && this.enCours < this.simultanes && this.file.length) {
      const i = this.file.shift();
      if (this.etat[i]) continue;
      this.etat[i] = 1; this.enCours++;
      const img = new Image();
      img.decoding = 'async';
      img.src = this.url(i);
      const fini = (ok) => {
        this.enCours--;
        if (ok) { this.images[i] = img; this.etat[i] = 2; this.prets++; } else this.etat[i] = 3;
        this.surProgres?.(this.prets / this.n, i);
        for (const f of this.ecouteurs) f(i);
        this.pomper();
      };
      (img.decode ? img.decode() : new Promise((r, x) => { img.onload = r; img.onerror = x; })).then(() => fini(true), () => fini(false));
    }
  }
  surImage(f) { this.ecouteurs.add(f); return () => this.ecouteurs.delete(f); }
  pret(i) { return this.etat[i] === 2; }
  /** L'image chargée la plus proche de i (ou null). */
  proche(i) {
    i = Math.max(0, Math.min(this.n - 1, Math.round(i)));
    if (this.etat[i] === 2) return this.images[i];
    for (let d = 1; d < this.n; d++) {
      if (i - d >= 0 && this.etat[i - d] === 2) return this.images[i - d];
      if (i + d < this.n && this.etat[i + d] === 2) return this.images[i + d];
    }
    return null;
  }
}

/** Dessine img en « cover » dans (dx, dy, dw, dh), avec un point d'intérêt (fx, fy) entre 0 et 1. */
export function dessinerCouvrant(ctx, img, dx, dy, dw, dh, fx = 0.5, fy = 0.5, alpha = 1) {
  const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
  if (!iw || !ih) return;
  const s = Math.max(dw / iw, dh / ih);
  const sw = dw / s, sh = dh / s;
  const sx = (iw - sw) * fx, sy = (ih - sh) * fy;
  ctx.globalAlpha = alpha;
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
  ctx.globalAlpha = 1;
}
