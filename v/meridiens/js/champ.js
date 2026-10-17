// Méridiens : le champ du contact. Des lignes de force convergent vers le numéro ; la main qui passe les
// écarte (elles reviennent sur un ressort amorti), et la lumière y descend vers le point de rencontre.
// La toile vit DANS la section : elle défile avec elle, à l'image près.

function rgb(hex) { const n = parseInt(String(hex).trim().replace('#', ''), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }

export function creerChamp(section, coeur, { ample = true, petit = false, graine = 1 } = {}) {
  const toile = document.createElement('canvas');
  toile.className = 'champ-toile'; toile.setAttribute('aria-hidden', 'true');
  section.prepend(toile); section.classList.add('vivant');
  const g = toile.getContext('2d');
  let W = 0, H = 0, dpr = 1, lignes = [], visible = false, sombre = true, cl = [134, 194, 178], or = [220, 180, 108];
  let s = graine >>> 0 || 1; const r = () => ((s = Math.imul(s ^ (s >>> 15), 2246822507) ^ Math.imul(s ^ (s >>> 13), 3266489909)) >>> 0) / 4294967296;
  const main = { x: -1e4, y: -1e4, px: -1e4, py: -1e4, force: 0 };
  const impulsions = [];

  function couleurs() {
    const cs = getComputedStyle(document.documentElement);
    sombre = document.documentElement.dataset.ton !== 'clair';
    cl = rgb(cs.getPropertyValue(sombre ? '--accent2' : '--accent').trim() || '#86c2b2'); or = rgb(cs.getPropertyValue('--accent').trim() || '#dcb46c');
  }
  function construire() {
    const rs = section.getBoundingClientRect(), rc = coeur.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = rs.width; H = rs.height;
    toile.width = Math.round(W * dpr); toile.height = Math.round(H * dpr);
    const cx = rc.left - rs.left + rc.width / 2, cy = rc.top - rs.top + rc.height / 2;
    const rx = rc.width * .62 + 20, ry = rc.height * .62 + 16;
    const N = petit ? 30 : 52, R = Math.hypot(W, H) * .62;
    lignes = [];
    for (let i = 0; i < N; i++) {
      const a = i / N * Math.PI * 2 + (r() - .5) * .06, tw = (r() - .5) * .9;
      const x0 = cx + Math.cos(a) * R, y0 = cy + Math.sin(a) * R;
      const x1 = cx + Math.cos(a) * rx, y1 = cy + Math.sin(a) * ry;
      const qx = cx + Math.cos(a + tw) * (R * .45 + rx * .5), qy = cy + Math.sin(a + tw) * (R * .45 + ry * .5);
      const n = 34, base = [];
      for (let k = 0; k <= n; k++) { const t = k / n, u = 1 - t; base.push([u * u * x0 + 2 * u * t * qx + t * t * x1, u * u * y0 + 2 * u * t * qy + t * t * y1]); }
      lignes.push({ base, o: base.map(() => [0, 0]), v: base.map(() => [0, 0]), n: n + 1 });
    }
  }
  function geste(e) {
    const rs = section.getBoundingClientRect();
    main.x = e.clientX - rs.left; main.y = e.clientY - rs.top; main.force = 1;
  }
  section.addEventListener('pointermove', geste, { passive: true });
  section.addEventListener('pointerdown', (e) => { geste(e); for (let i = 0; i < 6; i++) impulsions.push({ l: lignes[Math.floor(r() * lignes.length)], t: 0, v: .35 + r() * .2 }); }, { passive: true });
  section.addEventListener('pointerleave', () => { main.force = 0; }, { passive: true });

  let prochaine = 0, precedent = 0;
  function image(m) {
    const dt = precedent ? Math.min(.05, (m - precedent) / 1000) : .016; precedent = m;
    if (!visible) return;
    // la main ne pousse que lorsqu'elle bouge
    const vit = Math.hypot(main.x - main.px, main.y - main.py) / Math.max(dt, .001);
    main.px = main.x; main.py = main.y;
    const pousse = main.force * Math.min(1, vit / 600);
    main.force *= Math.exp(-dt * 2);
    const R = petit ? 70 : 110;
    for (const l of lignes) for (let i = 1; i < l.n - 1; i++) {
      const b = l.base[i], o = l.o[i], v = l.v[i];
      const x = b[0] + o[0], y = b[1] + o[1], dx = x - main.x, dy = y - main.y, d = Math.hypot(dx, dy);
      // ressort presque critique : la ligne s'écarte puis revient sans rebondir (aucune vibration)
      let fx = -70 * o[0] - 16 * v[0], fy = -70 * o[1] - 16 * v[1];
      if (pousse > .01 && d < R && d > .1) { const k = (1 - d / R) ** 2 * 5200 * pousse; fx += dx / d * k; fy += dy / d * k; }
      v[0] += fx * dt; v[1] += fy * dt; o[0] += v[0] * dt; o[1] += v[1] * dt;
    }
    prochaine -= dt;
    if (prochaine <= 0) { impulsions.push({ l: lignes[Math.floor(r() * lignes.length)], t: 0, v: .22 + r() * .14 }); prochaine = ample ? .35 : .8; }
    for (let i = impulsions.length - 1; i >= 0; i--) { const p = impulsions[i]; p.t += p.v * dt * (ample ? 1 : .75); if (p.t > 1.05) impulsions.splice(i, 1); }

    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, W, H);
    g.lineWidth = 1; g.strokeStyle = `rgb(${cl})`; g.globalAlpha = sombre ? .3 : .34;
    g.beginPath();
    for (const l of lignes) { for (let i = 0; i < l.n; i++) { const x = l.base[i][0] + l.o[i][0], y = l.base[i][1] + l.o[i][1]; i ? g.lineTo(x, y) : g.moveTo(x, y); } }
    g.stroke();
    g.globalCompositeOperation = sombre ? 'lighter' : 'source-over';
    for (const p of impulsions) {
      const l = p.l; if (!l) continue;
      for (let k = 6; k >= 0; k--) {
        const t = p.t - k * .018; if (t < 0 || t > 1) continue;
        const f = t * (l.n - 1), a = Math.floor(f), b = Math.min(l.n - 1, a + 1), u = f - a;
        const x = l.base[a][0] + l.o[a][0] + (l.base[b][0] + l.o[b][0] - l.base[a][0] - l.o[a][0]) * u;
        const y = l.base[a][1] + l.o[a][1] + (l.base[b][1] + l.o[b][1] - l.base[a][1] - l.o[a][1]) * u;
        const rr = (k ? 3.2 : 4.6) * (1 - k / 8);
        g.globalAlpha = (k ? .35 * (1 - k / 7) : .95) * Math.min(1, (1.05 - p.t) * 4);
        g.fillStyle = `rgb(${or})`; g.beginPath(); g.arc(x, y, rr, 0, Math.PI * 2); g.fill();
      }
    }
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
  }
  couleurs(); construire();
  return { image, couleurs, taille: construire, set visible(v) { visible = v; if (!v) precedent = 0; } };
}
