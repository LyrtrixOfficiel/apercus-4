// Pollens en suspension : des grains dores qui flottent dans la lumiere,
// s'ecartent au passage de la main et s'envolent au toucher.

export function demarrerPollens(canvas, { petit, reduit }) {
  const g = canvas.getContext('2d');
  let W = 0, H = 0, dpr = 1;
  const grain = document.createElement('canvas'); grain.width = grain.height = 32;
  { const c = grain.getContext('2d'), d = c.createRadialGradient(16, 16, 0, 16, 16, 16);
    d.addColorStop(0, 'rgba(255,244,200,1)'); d.addColorStop(.22, 'rgba(232,178,64,.9)'); d.addColorStop(.55, 'rgba(236,184,80,.22)'); d.addColorStop(1, 'rgba(236,184,80,0)');
    c.fillStyle = d; c.fillRect(0, 0, 32, 32); }
  const p = [];
  function taille() {
    dpr = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = petit ? 34 : 70;
    while (p.length < n) p.push(nouveau(true));
    p.length = n;
  }
  function nouveau(partout) {
    return { x: Math.random() * W, y: partout ? Math.random() * H : H + 10, vx: 0, vy: 0, r: 3 + Math.pow(Math.random(), 2.5) * 9, ph: Math.random() * 6.28, v: .15 + Math.random() * .35, z: .4 + Math.random() * .6 };
  }
  taille();
  let precedent = 0, dernierScroll = scrollY;
  function image(m, main, souffles) {
    const dt = precedent ? Math.min(3, (m - precedent) / 16.67) : 1; precedent = m;
    const t = m / 1000, ds = scrollY - dernierScroll; dernierScroll = scrollY;
    g.clearRect(0, 0, W, H);
    for (const q of souffles) { // un toucher souffle les pollens proches
      for (const a of p) { const dx = a.x - q.x, dy = a.y - q.y, d2 = dx * dx + dy * dy; if (d2 < 220 * 220) { const d = Math.sqrt(d2) || 1, k = (1 - d / 220) * 7; a.vx += dx / d * k; a.vy += dy / d * k - 1.5; } }
    }
    for (const a of p) {
      if (!reduit) {
        a.vx += (Math.sin(t * .6 + a.ph) * .012 + .004) * dt;
        a.vy += (-.006 + Math.cos(t * .5 + a.ph * 1.3) * .006) * dt;
        if (main && main.actif) { const dx = a.x - main.x, dy = a.y - main.y, d2 = dx * dx + dy * dy; if (d2 < 130 * 130) { const d = Math.sqrt(d2) || 1, k = (1 - d / 130) * .5; a.vx += dx / d * k * dt; a.vy += dy / d * k * dt; } }
        a.vx *= Math.pow(.96, dt); a.vy *= Math.pow(.96, dt);
        a.x += (a.vx + Math.sin(t * a.v + a.ph) * .25) * dt; a.y += a.vy * dt - ds * .25 * a.z;
        if (a.y < -20) Object.assign(a, nouveau(false));
        if (a.y > H + 30) { a.y = -10; }
        if (a.x < -20) a.x = W + 10; if (a.x > W + 20) a.x = -10;
      }
      const scint = .55 + .45 * Math.sin(t * 1.3 + a.ph * 3);
      g.globalAlpha = (.35 + .5 * scint) * a.z;
      const k = a.r * (.8 + .3 * scint);
      g.drawImage(grain, a.x - k / 2, a.y - k / 2, k, k);
    }
    g.globalAlpha = 1;
  }
  return { image, taille };
}
