// Etoiles et constellation : un champ d'etoiles qui scintille (parallaxe au defilement),
// des etoiles filantes rares, et la constellation qui dessine le nom du praticien.
// Les etoiles partent eparpillees dans le ciel, se rassemblent en suivant les lettres
// du titre (lues dans la vraie mise en page), se relient, puis le texte s'allume.

const TAU = Math.PI * 2;

function lutin(rayon, couleur) {
  const c = document.createElement('canvas'); c.width = c.height = rayon * 2;
  const g = c.getContext('2d'); const d = g.createRadialGradient(rayon, rayon, 0, rayon, rayon, rayon);
  d.addColorStop(0, couleur(1)); d.addColorStop(.18, couleur(.85)); d.addColorStop(.45, couleur(.18)); d.addColorStop(1, couleur(0));
  g.fillStyle = d; g.fillRect(0, 0, rayon * 2, rayon * 2); return c;
}

// Positions des etoiles de la constellation, prises sur le rendu reel des mots du titre.
function cibles(titre, max) {
  const r = titre.getBoundingClientRect();
  const W = Math.ceil(r.width), H = Math.ceil(r.height);
  if (W < 10 || H < 10) return [];
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.fillStyle = '#fff'; g.strokeStyle = '#fff'; g.textBaseline = 'alphabetic';
  for (const mot of titre.querySelectorAll('.mot')) {
    const m = mot.getBoundingClientRect(), cs = getComputedStyle(mot), fs = parseFloat(cs.fontSize);
    g.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    if ('letterSpacing' in g) g.letterSpacing = cs.letterSpacing === 'normal' ? '0px' : cs.letterSpacing;
    const me = g.measureText(mot.textContent);
    const asc = me.fontBoundingBoxAscent ?? fs * .8, desc = me.fontBoundingBoxDescent ?? fs * .2;
    const y = m.top - r.top + (m.height - (asc + desc)) / 2 + asc;
    g.lineWidth = Math.max(1, fs * .035);
    g.fillText(mot.textContent, m.left - r.left, y); g.strokeText(mot.textContent, m.left - r.left, y);
  }
  const px = g.getImageData(0, 0, W, H).data;
  let plein = 0; for (let i = 3; i < px.length; i += 16) if (px[i] > 128) plein++;
  plein *= 4;
  const pas = Math.max(3, Math.sqrt(plein / max));
  const pts = [];
  for (let y = pas / 2; y < H; y += pas) for (let x = (Math.round(y / pas) % 2) * pas / 2; x < W; x += pas) {
    const jx = x + (Math.random() - .5) * pas * .7, jy = y + (Math.random() - .5) * pas * .7;
    const i = ((Math.round(jy) * W) + Math.round(jx)) * 4 + 3;
    if (px[i] > 140) pts.push({ x: r.left + jx, y: r.top + scrollY + jy });
  }
  while (pts.length > max) pts.splice(Math.floor(Math.random() * pts.length), 1);
  pts.pas = pas;
  return pts;
}

export function demarrerEtoiles(canvas, titre, accueil, { petit, reduit, allumer }) {
  const g = canvas.getContext('2d');
  let W = 0, H = 0, dpr = 1;
  const sprites = { blanc: lutin(16, (a) => `rgba(235,242,255,${a})`), menthe: lutin(16, (a) => `rgba(150,255,220,${a})`), violet: lutin(16, (a) => `rgba(200,185,255,${a})`) };

  // Champ d'etoiles, sur une hauteur 1.6 fois l'ecran (elles defilent en parallaxe).
  const champ = [];
  function semer() {
    champ.length = 0;
    const n = Math.round((petit ? 90 : 230) * Math.min(1.4, (W * H) / (1440 * 900) + .35));
    for (let i = 0; i < n; i++) {
      const z = Math.random();
      champ.push({ x: Math.random() * W, y: Math.random() * H * 1.6, z, r: .35 + Math.pow(Math.random(), 4) * 1.6 + z * .3, ph: Math.random() * TAU, v: .4 + Math.random() * 1.6, c: Math.random() < .12 ? 'menthe' : Math.random() < .12 ? 'violet' : 'blanc' });
    }
  }
  function taille() {
    dpr = Math.min(devicePixelRatio || 1, petit ? 1.5 : 1.75); W = innerWidth; H = innerHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    semer();
  }
  taille();

  // Constellation du nom.
  let pts = [], liens = [], debut = 0, allume = false, forme = 0, finAccueil = 0;
  function construire() {
    const max = petit ? 150 : 300;
    const c = cibles(titre, max);
    const ar = accueil.getBoundingClientRect();
    const anciens = pts, gauche = c.length ? r0(c) : 0;
    pts = c.map((p, i) => {
      const a = anciens[i];
      const x0 = a ? a.x : Math.random() * W, y0 = a ? a.y : ar.top + scrollY + Math.random() * ar.height * .9;
      return { x: reduit ? p.x : x0, y: reduit ? p.y : y0, tx: p.x, ty: p.y, vx: 0, vy: 0,
        retard: reduit ? 0 : 250 + ((p.x - gauche) / Math.max(1, W)) * 1100 + Math.random() * 500,
        r: .7 + Math.random() * 1.1, ph: Math.random() * TAU, v: .8 + Math.random() * 1.8, c: Math.random() < .3 ? 'menthe' : Math.random() < .2 ? 'violet' : 'blanc' };
    });
    // Liens : chaque etoile vers ses deux plus proches voisines, sans doublon.
    liens = []; const vus = new Set(), lim = (c.pas || 8) * 2.1;
    for (let i = 0; i < pts.length; i++) {
      const pr = [];
      for (let j = 0; j < pts.length; j++) if (j !== i) {
        const dx = pts[i].tx - pts[j].tx, dy = pts[i].ty - pts[j].ty, d = dx * dx + dy * dy;
        if (d < lim * lim) pr.push([d, j]);
      }
      pr.sort((a, b) => a[0] - b[0]);
      for (const [, j] of pr.slice(0, 2)) { const k = i < j ? i + ',' + j : j + ',' + i; if (!vus.has(k)) { vus.add(k); liens.push([i, j]); } }
    }
    if (!debut) debut = performance.now();
    finAccueil = 0;
  }
  const r0 = (c) => c.reduce((m, p) => Math.min(m, p.x), Infinity);

  // Etoile filante, de temps en temps.
  let filante = null, prochaine = performance.now() + 5000;

  let dernierT = performance.now();
  function image(maintenant, lumiere) {
    const dt = Math.min(50, maintenant - dernierT) / 16.67; dernierT = maintenant;
    const t = maintenant / 1000, sy = scrollY;
    g.clearRect(0, 0, W, H);

    // 1. Champ d'etoiles
    const hc = H * 1.6;
    for (const s of champ) {
      let y = (s.y - sy * (.05 + s.z * .12)) % hc; if (y < 0) y += hc;
      if (y > H + 4) continue;
      const scint = reduit ? .8 : .55 + .45 * Math.sin(t * s.v + s.ph);
      let a = (.25 + .6 * s.z) * scint;
      if (lumiere) { const dx = s.x - lumiere.px, dy = y - lumiere.py, d2 = dx * dx + dy * dy; a += Math.exp(-d2 / 26000) * .9 * lumiere.z; }
      if (s.r > 1.1) { const k = s.r * 4.5 * (0.8 + a * .4); g.globalAlpha = Math.min(1, a); g.drawImage(sprites[s.c], s.x - k / 2, y - k / 2, k, k); }
      else { g.globalAlpha = Math.min(1, a); g.fillStyle = '#e8eeff'; g.fillRect(s.x, y, s.r * 1.4, s.r * 1.4); }
    }

    // 2. Etoile filante
    if (!reduit) {
      if (!filante && maintenant > prochaine) {
        const x = W * (.2 + Math.random() * .7), y = H * (.05 + Math.random() * .3);
        filante = { x, y, vx: -(4 + Math.random() * 4), vy: 1.6 + Math.random() * 1.6, vie: 0 };
        prochaine = maintenant + 7000 + Math.random() * 9000;
      }
      if (filante) {
        const f = filante; f.vie += dt; f.x += f.vx * dt; f.y += f.vy * dt;
        const a = Math.sin(Math.min(1, f.vie / 55) * Math.PI);
        const gr = g.createLinearGradient(f.x, f.y, f.x - f.vx * 16, f.y - f.vy * 16);
        gr.addColorStop(0, `rgba(230,255,245,${.9 * a})`); gr.addColorStop(1, 'rgba(230,255,245,0)');
        g.globalAlpha = 1; g.strokeStyle = gr; g.lineWidth = 1.3; g.beginPath(); g.moveTo(f.x, f.y); g.lineTo(f.x - f.vx * 16, f.y - f.vy * 16); g.stroke();
        if (f.vie > 55) filante = null;
      }
    }

    // 3. Constellation du nom (seulement tant que l'accueil est a l'ecran)
    if (!finAccueil) finAccueil = accueil.offsetTop + accueil.offsetHeight;
    const ab = finAccueil;
    if (pts.length && sy < ab) {
      const ecoule = maintenant - debut;
      let arrives = 0;
      for (const p of pts) {
        if (!reduit && ecoule > p.retard) {
          let fx = (p.tx - p.x) * .045, fy = (p.ty - p.y) * .045;
          if (lumiere && lumiere.z > .1) {
            const dx = p.x - lumiere.px, dy = p.y - sy - lumiere.py, d2 = dx * dx + dy * dy, R = petit ? 70 : 110;
            if (d2 < R * R) { const d = Math.sqrt(d2) || 1, k = (1 - d / R) * 2.4 * lumiere.z; fx += dx / d * k; fy += dy / d * k; }
          }
          p.vx = (p.vx + fx * dt) * Math.pow(.86, dt); p.vy = (p.vy + fy * dt) * Math.pow(.86, dt);
          p.x += p.vx * dt; p.y += p.vy * dt;
        } else if (!reduit) { p.x += Math.sin(t * .3 + p.ph) * .08 * dt; }
        const dx = p.tx - p.x, dy = p.ty - p.y;
        if (dx * dx + dy * dy < 9) arrives++;
      }
      const cible = reduit ? 1 : Math.min(1, arrives / pts.length / .85);
      forme += (cible - forme) * .04 * dt;
      if (!allume && (reduit || (ecoule > 1800 && forme > .8) || ecoule > 4200)) { allume = true; allumer(); }

      // Liens
      if (forme > .05) {
        g.globalAlpha = 1; g.lineWidth = .7;
        g.strokeStyle = `rgba(160,255,225,${(allume ? .16 : .26) * forme})`;
        g.beginPath();
        for (const [i, j] of liens) { const a = pts[i], b = pts[j]; g.moveTo(a.x, a.y - sy); g.lineTo(b.x, b.y - sy); }
        g.stroke();
        if (lumiere && lumiere.z > .1) { // liens avives pres de la lumiere
          g.strokeStyle = `rgba(200,255,240,${.55 * forme * lumiere.z})`; g.beginPath();
          const R2 = (petit ? 90 : 150) ** 2;
          for (const [i, j] of liens) { const a = pts[i], b = pts[j]; const dx = a.x - lumiere.px, dy = a.y - sy - lumiere.py; if (dx * dx + dy * dy < R2) { g.moveTo(a.x, a.y - sy); g.lineTo(b.x, b.y - sy); } }
          g.stroke();
        }
      }
      // Etoiles
      for (const p of pts) {
        const scint = reduit ? .85 : .6 + .4 * Math.sin(t * p.v * 1.4 + p.ph);
        let a = (allume ? .7 : 1) * scint;
        let k = p.r * 7;
        if (lumiere && lumiere.z > .1) { const dx = p.x - lumiere.px, dy = p.y - sy - lumiere.py; const pr = Math.exp(-(dx * dx + dy * dy) / 9000) * lumiere.z; a = Math.min(1, a + pr); k *= 1 + pr * .8; }
        g.globalAlpha = a; g.drawImage(sprites[p.c], p.x - k / 2, p.y - sy - k / 2, k, k);
      }
    }
    g.globalAlpha = 1;
  }

  return { image, taille: () => { taille(); }, construire };
}
