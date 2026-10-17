// Etoiles : un champ d'etoiles fixe derriere la page (avec des etoiles filantes, rares, ou
// nees d'un toucher), et la constellation du nom, dessinee dans une toile posee DANS
// l'accueil : elle defile avec le texte, nativement, sans aucun decalage possible.
// Rien ne reagit au survol : pas de repulsion, pas de lumiere qui suit, aucune vibration.

const TAU = Math.PI * 2;
const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
function lutin(rayon, couleur) {
  const c = document.createElement('canvas'); c.width = c.height = rayon * 2;
  const g = c.getContext('2d'), d = g.createRadialGradient(rayon, rayon, 0, rayon, rayon, rayon);
  d.addColorStop(0, couleur(1)); d.addColorStop(.16, couleur(.9)); d.addColorStop(.42, couleur(.16)); d.addColorStop(1, couleur(0));
  g.fillStyle = d; g.fillRect(0, 0, rayon * 2, rayon * 2); return c;
}
const lisse = (x) => x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);
function hasard(s) { return () => { s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// ---------- Le champ d'etoiles (toile fixe) ----------
export function demarrerChamp(canvas, { petit, reduit, palette, parallaxe }) {
  const g = canvas.getContext('2d');
  const [er, eg, eb] = palette.gl.etoile;
  const sprites = { blanc: lutin(16, (a) => `rgba(${er},${eg},${eb},${a})`), accent: lutin(16, (a) => rgba(palette.css.accent, a)), accent2: lutin(16, (a) => rgba(palette.css.accent2, a)) };
  let W = 0, H = 0;
  const champ = [];
  function taille() {
    const dpr = Math.min(devicePixelRatio || 1, petit ? 1.5 : 1.75); W = innerWidth; H = innerHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    champ.length = 0;
    const n = Math.round((petit ? 90 : 230) * Math.min(1.4, (W * H) / (1440 * 900) + .35));
    for (let i = 0; i < n; i++) {
      const z = Math.random();
      champ.push({ x: Math.random() * W, y: Math.random() * H * 1.6, z, r: .35 + Math.pow(Math.random(), 4) * 1.6 + z * .3, ph: Math.random() * TAU, v: .4 + Math.random() * 1.6, c: Math.random() < .12 ? 'accent' : Math.random() < .12 ? 'accent2' : 'blanc' });
    }
  }
  taille();
  const filantes = [];
  let prochaine = performance.now() + 6000;
  function lancer(x, y, provoquee) {
    const sens = x < W * .35 ? 1 : -1, v = (provoquee ? 9 : 6) + Math.random() * 4; // vers le bas, du cote ou il y a de la place
    filantes.push({ x, y, vx: sens * v * (.8 + Math.random() * .15), vy: v * (.3 + Math.random() * .15) + 1, vie: 0, duree: provoquee ? 52 : 60 });
  }
  let dernierT = performance.now();
  function image(maintenant) {
    const dt = Math.min(50, maintenant - dernierT) / 16.67; dernierT = maintenant;
    const t = maintenant / 1000 * (reduit ? .5 : 1), sy = parallaxe ? scrollY : 0;
    g.clearRect(0, 0, W, H);
    const hc = H * 1.6;
    for (const s of champ) {
      let y = (s.y - sy * (.05 + s.z * .12)) % hc; if (y < 0) y += hc;
      if (y > H + 4) continue;
      const a = (.25 + .6 * s.z) * (.62 + .38 * Math.sin(t * s.v + s.ph));
      if (s.r > 1.1) { const k = s.r * 4.5 * (.8 + a * .4); g.globalAlpha = Math.min(1, a); g.drawImage(sprites[s.c], s.x - k / 2, y - k / 2, k, k); }
      else { g.globalAlpha = Math.min(1, a); g.fillStyle = `rgb(${er},${eg},${eb})`; g.fillRect(s.x, y, s.r * 1.4, s.r * 1.4); }
    }
    if (maintenant > prochaine) { lancer(W * (.2 + Math.random() * .7), H * (.05 + Math.random() * .3), false); prochaine = maintenant + 8000 + Math.random() * 9000; }
    for (let i = filantes.length - 1; i >= 0; i--) {
      const f = filantes[i]; f.vie += dt; f.x += f.vx * dt; f.y += f.vy * dt;
      const a = Math.sin(Math.min(1, f.vie / f.duree) * Math.PI);
      const gr = g.createLinearGradient(f.x, f.y, f.x - f.vx * 14, f.y - f.vy * 14);
      gr.addColorStop(0, `rgba(${er},${eg},${eb},${.95 * a})`); gr.addColorStop(1, `rgba(${er},${eg},${eb},0)`);
      g.globalAlpha = 1; g.strokeStyle = gr; g.lineWidth = 1.4; g.beginPath(); g.moveTo(f.x, f.y); g.lineTo(f.x - f.vx * 14, f.y - f.vy * 14); g.stroke();
      g.globalAlpha = a; g.drawImage(sprites.blanc, f.x - 6, f.y - 6, 12, 12);
      if (f.vie > f.duree) filantes.splice(i, 1);
    }
    g.globalAlpha = 1;
  }
  return { image, taille, filante: (x, y) => lancer(x, y, true) };
}

// ---------- La constellation du nom (toile dans l'accueil) ----------
// Des etoiles clairsemees posees sur le dessin reel des lettres (lu dans la mise en page),
// reliees par l'arbre le plus court de chaque mot : une figure d'atlas, pas un nuage de points.
function cibles(titre, accueil, rnd) {
  const r = titre.getBoundingClientRect(), ra = accueil.getBoundingClientRect();
  const W = Math.ceil(r.width), H = Math.ceil(r.height);
  if (W < 10 || H < 10) return [];
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.fillStyle = '#fff'; g.textBaseline = 'alphabetic';
  const mots = [];
  for (const mot of titre.querySelectorAll('.mot')) {
    const m = mot.getBoundingClientRect(), cs = getComputedStyle(mot), fs = parseFloat(cs.fontSize);
    g.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    if ('letterSpacing' in g) g.letterSpacing = cs.letterSpacing === 'normal' ? '0px' : cs.letterSpacing;
    // la ligne de base exacte, lue dans la mise en page (un repere de taille nulle aligne sur la ligne de base)
    const repere = document.createElement('span'); repere.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline';
    mot.prepend(repere); const b = repere.getBoundingClientRect(); repere.remove();
    const y = b.bottom - r.top;
    g.clearRect(0, 0, W, H); g.fillText(mot.textContent, b.left - r.left, y);
    const px = g.getImageData(0, 0, W, H).data;
    const D = Math.max(9, fs * .26), pts = [];
    const x0 = Math.max(0, Math.floor(m.left - r.left)), x1 = Math.min(W, Math.ceil(m.right - r.left)), y0 = Math.max(0, Math.floor(m.top - r.top)), y1 = Math.min(H, Math.ceil(m.bottom - r.top));
    for (let essai = 0; essai < 2600; essai++) {
      const x = x0 + rnd() * (x1 - x0), yy = y0 + rnd() * (y1 - y0);
      const ix = Math.min(W - 1, Math.round(x)), iy = Math.min(H - 1, Math.round(yy));
      if (!(px[(iy * W + ix) * 4 + 3] >= 160)) continue; // hors des lettres (ou hors de l'image) : refuse
      if (pts.every((p) => (p[0] - x) ** 2 + (p[1] - yy) ** 2 > D * D)) pts.push([x, yy]);
    }
    mots.push(pts.map(([x, yy]) => ({ x: r.left - ra.left + x, y: r.top - ra.top + yy })));
  }
  return mots;
}
function arbre(pts) { // arbre couvrant le plus court (Prim)
  const n = pts.length, liens = []; if (n < 2) return liens;
  const dans = new Array(n).fill(false), d = new Array(n).fill(Infinity), de = new Array(n).fill(-1); d[0] = 0;
  for (let k = 0; k < n; k++) {
    let u = -1; for (let i = 0; i < n; i++) if (!dans[i] && (u < 0 || d[i] < d[u])) u = i;
    dans[u] = true; if (de[u] >= 0) liens.push([de[u], u]);
    for (let v = 0; v < n; v++) if (!dans[v]) { const dd = (pts[u].x - pts[v].x) ** 2 + (pts[u].y - pts[v].y) ** 2; if (dd < d[v]) { d[v] = dd; de[v] = u; } }
  }
  return liens;
}

export function demarrerConstellation(canvas, titre, accueil, { petit, reduit, palette }) {
  const g = canvas.getContext('2d');
  const [er, eg, eb] = palette.gl.etoile;
  const sprite = lutin(16, (a) => `rgba(${er},${eg},${eb},${a})`), spriteA = lutin(16, (a) => rgba(palette.css.accent, a));
  let W = 0, H = 0, etoiles = [], liens = [], debut = 0;
  const k = reduit ? .45 : 1; // le temps de l'ouverture, raccourci en mouvement reduit
  function construire() {
    const dpr = Math.min(devicePixelRatio || 1, petit ? 2 : 1.75);
    W = accueil.clientWidth; H = accueil.offsetHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr); canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const rnd = hasard(titre.textContent.length * 7919 + 17); // memes etoiles pour une meme mise en page
    const mots = cibles(titre, accueil, rnd);
    etoiles = []; liens = [];
    for (const pts of mots) {
      const base = etoiles.length;
      for (const p of pts) etoiles.push({ ...p, vive: rnd() < .16, r: .8 + rnd() * .9, ph: rnd() * TAU, v: .5 + rnd() * 1.2, accent: rnd() < .22 });
      for (const [a, b] of arbre(pts)) liens.push([base + a, base + b]);
    }
    const xmin = Math.min(...etoiles.map((e) => e.x)), xmax = Math.max(...etoiles.map((e) => e.x));
    for (const e of etoiles) e.retard = (120 + (e.x - xmin) / Math.max(1, xmax - xmin) * 950 + rnd() * 220) * k;
    for (const l of liens) l.retard = Math.max(etoiles[l[0]].retard, etoiles[l[1]].retard) + 140 * k;
  }
  function image(maintenant, allume) {
    if (!debut) return;
    const t = maintenant - debut, tt = maintenant / 1000 * (reduit ? .5 : 1);
    g.clearRect(0, 0, W, H);
    // apres l'ouverture, la figure se retire : quelques eclats restent sur les lettres, le nom devient le sujet
    const repos = lisse((t - 2400 * k) / (1600 * k));
    g.lineWidth = .65; g.lineCap = 'round';
    for (const l of liens) {
      const p = lisse((t - l.retard) / (560 * k)); if (p <= 0) continue;
      const a = etoiles[l[0]], b = etoiles[l[1]];
      g.strokeStyle = rgba(palette.css.accent, (.38 - .34 * repos) * Math.min(1, p * 1.4));
      g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(a.x + (b.x - a.x) * p, a.y + (b.y - a.y) * p); g.stroke();
    }
    for (const e of etoiles) {
      const p = (t - e.retard) / (560 * k); if (p <= 0) continue;
      const eclat = reduit ? lisse(p) : lisse(p) * (1 + .45 * Math.sin(Math.min(1, p) * Math.PI)); // un eclat a l'apparition, sans bouger
      const scint = .74 + .26 * Math.sin(tt * e.v + e.ph);
      const a = Math.min(1, eclat * scint * (1 - (e.vive ? .35 : .8) * repos));
      if (a < .01) continue;
      const taille = (e.vive ? 2.6 : e.r * 1.7) * 4;
      g.globalAlpha = a; g.drawImage(e.accent ? spriteA : sprite, e.x - taille / 2, e.y - taille / 2, taille, taille);
      if (e.vive) { // les plus brillantes portent une fine croix de diffraction, comme sur une photo du ciel
        const L = 7 + 5 * scint;
        g.globalAlpha = a * .5; g.strokeStyle = `rgb(${er},${eg},${eb})`; g.lineWidth = .5;
        g.beginPath(); g.moveTo(e.x - L, e.y); g.lineTo(e.x + L, e.y); g.moveTo(e.x, e.y - L); g.lineTo(e.x, e.y + L); g.stroke();
      }
    }
    g.globalAlpha = 1;
  }
  return { construire, image, commencer: () => { debut = performance.now(); }, get etoiles() { return etoiles; } };
}
