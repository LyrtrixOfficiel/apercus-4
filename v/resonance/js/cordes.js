// Resonance : les cordes. Sept cordes tendues en travers de la section ; quand la main ou le doigt les
// traverse, la corde traversee est pincee a cet endroit (equation d'onde amortie), et chante si le son est actif.
// Pour l'art-therapie, ce sont des traits de pigment qui vibrent. Canevas 2D place DANS la section.

export function demarrerCordes(boite, { reduit = false, style = 'son', couleurs, surPince } = {}) {
  const toile = document.createElement('canvas');
  toile.setAttribute('aria-hidden', 'true');
  boite.prepend(toile);
  const ctx = toile.getContext('2d');
  if (!ctx) { toile.remove(); return null; }
  const NB = 7, M = 120;
  const cordes = Array.from({ length: NB }, (_, i) => ({ y: .14 + i * .114, u: new Float32Array(M), v: new Float32Array(M), e: 0 }));
  let W = 1, H = 1, dpr = 1, vivant = false, prec = null;

  function taille() {
    const r = boite.getBoundingClientRect();
    W = r.width; H = r.height; dpr = Math.min(window.devicePixelRatio || 1, 2);
    toile.width = Math.round(W * dpr); toile.height = Math.round(H * dpr);
    dessiner();
  }
  function pincer(k, x, force) {
    const c = cordes[k], i0 = Math.max(2, Math.min(M - 3, Math.round(x / W * (M - 1))));
    const amp = Math.min(1, force) * H * .1 * (reduit ? .85 : 1);
    for (let i = 1; i < M - 1; i++) {
      const d = (i - i0) / (i < i0 ? i0 : M - 1 - i0);
      c.u[i] += amp * Math.max(0, 1 - Math.abs(d)) * (prec && prec.vy < 0 ? -1 : 1);
    }
    c.e = 1;
    surPince?.(k, force);
    reveiller();
  }
  function bouger(x, y) {
    if (prec) {
      for (let k = 0; k < NB; k++) {
        const yc = cordes[k].y * H;
        if ((prec.y - yc) * (y - yc) < 0) {
          const t = (yc - prec.y) / (y - prec.y), xc = prec.x + (x - prec.x) * t;
          const vitesse = Math.hypot(x - prec.x, y - prec.y);
          pincer(k, xc, .25 + vitesse / 40);
        }
      }
      prec = { x, y, vy: y - prec.y };
    } else prec = { x, y, vy: 0 };
  }
  boite.addEventListener('pointermove', (e) => { const r = boite.getBoundingClientRect(); bouger(e.clientX - r.left, e.clientY - r.top); }, { passive: true });
  boite.addEventListener('pointerdown', (e) => {
    const r = boite.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    // un toucher pince la corde la plus proche
    let k = 0, best = 1e9; cordes.forEach((c, i) => { const d = Math.abs(c.y * H - y); if (d < best) { best = d; k = i; } });
    if (best < H * .08) pincer(k, x, .7);
    prec = { x, y, vy: 0 };
  }, { passive: true });
  boite.addEventListener('pointerleave', () => { prec = null; });
  boite.addEventListener('pointercancel', () => { prec = null; });

  function pas() {
    const c2 = .45, amort = .0012;
    let total = 0;
    for (const c of cordes) {
      if (c.e < .0005) continue;
      for (let s = 0; s < 10; s++) {
        for (let i = 1; i < M - 1; i++) c.v[i] = (c.v[i] + c2 * (c.u[i - 1] + c.u[i + 1] - 2 * c.u[i])) * (1 - amort);
        for (let i = 1; i < M - 1; i++) c.u[i] += c.v[i];
      }
      let e = 0; for (let i = 0; i < M; i++) e = Math.max(e, Math.abs(c.u[i]));
      c.e = e / (H * .07); total += c.e;
      if (c.e < .0005) { c.u.fill(0); c.v.fill(0); c.e = 0; }
    }
    return total;
  }
  function dessiner() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    cordes.forEach((c, k) => {
      const y0 = c.y * H;
      ctx.beginPath();
      for (let i = 0; i < M; i++) { const x = (i / (M - 1)) * W, y = y0 + c.u[i]; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      if (style === 'pigment') {
        const p = couleurs.pigments[k % couleurs.pigments.length];
        ctx.strokeStyle = p; ctx.globalAlpha = .55 + .35 * Math.min(1, c.e * 3); ctx.lineWidth = 2.2 + (k % 3) * 1.4 + c.e * 3; ctx.lineCap = 'round';
      } else {
        const g = ctx.createLinearGradient(0, 0, W, 0);
        g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(.1, couleurs.accent); g.addColorStop(.9, couleurs.accent); g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.strokeStyle = g; ctx.globalAlpha = .62 + .38 * Math.min(1, c.e * 4); ctx.lineWidth = 1.3 + c.e * 1.8; ctx.shadowColor = couleurs.accent; ctx.shadowBlur = c.e > .02 ? 8 * Math.min(1, c.e * 3) : 0;
      }
      ctx.stroke();
    });
    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
  }
  function boucle() {
    const e = pas(); dessiner();
    if (e > .0005) requestAnimationFrame(boucle); else vivant = false;
  }
  function reveiller() { if (!vivant) { vivant = true; requestAnimationFrame(boucle); } }
  taille();
  boite.classList.add('gl-cordes');
  return { taille, couleurs(c) { couleurs = c; dessiner(); } };
}
