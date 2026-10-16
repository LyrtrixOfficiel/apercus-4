// Liquid glass : un fond d'écran vivant aux couleurs de la palette, dessiné une fois (canevas 2D).
// Des rubans larges et brillants qui se croisent, comme les fonds d'écran des systèmes récents :
// de vrais bords et des dégradés, pour que le verre ait quelque chose à courber.
// Sert aux tarifs, et de repli quand une photo manque. Le même canevas est la texture du verre.

const hasard = (graine) => { let s = graine >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); };
const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mel = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const css = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

export function dessinerPapier(canvas, couleurs, graine = 7) {
  const L = canvas.width, H = canvas.height, g = canvas.getContext('2d');
  const r = hasard(graine);
  const C = couleurs.map(rgb);
  const blanc = [255, 255, 255], noir = [8, 10, 20];
  // fond
  const fond = g.createLinearGradient(0, 0, L, H);
  fond.addColorStop(0, css(mel(C[3], blanc, 0.15))); fond.addColorStop(0.55, css(C[1])); fond.addColorStop(1, css(C[0]));
  g.fillStyle = fond; g.fillRect(0, 0, L, H);
  for (const [x, y, rr, c, a] of [[0.15, 0.2, 0.7, C[2], 0.9], [0.9, 0.85, 0.8, C[4], 0.75], [0.8, 0.1, 0.5, C[0], 0.7]]) {
    const rad = g.createRadialGradient(x * L, y * H, 0, x * L, y * H, rr * Math.max(L, H));
    rad.addColorStop(0, css(c, a)); rad.addColorStop(1, css(c, 0));
    g.fillStyle = rad; g.fillRect(0, 0, L, H);
  }
  // rubans : courbe centrale, épaisseur variable, dégradé à travers la largeur
  const M = Math.max(L, H);
  const rubans = [
    { c: C[0], y0: 0.95, y1: 0.05, ep: 0.34 }, { c: C[2], y0: 1.15, y1: 0.35, ep: 0.22 },
    { c: C[4], y0: 0.62, y1: -0.2, ep: 0.2 }, { c: C[1], y0: 1.35, y1: 0.62, ep: 0.26 },
  ];
  for (const rb of rubans) {
    const p0 = [-0.25 * L, rb.y0 * H], p3 = [1.25 * L, rb.y1 * H];
    const p1 = [L * (0.2 + r() * 0.2), H * (rb.y0 - 0.1 - r() * 0.5)], p2 = [L * (0.55 + r() * 0.25), H * (rb.y1 + 0.2 + r() * 0.5)];
    const pts = [], N = 90;
    for (let i = 0; i <= N; i++) {
      const t = i / N, u = 1 - t;
      const x = u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0];
      const y = u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1];
      const ep = rb.ep * M * (0.75 + 0.35 * Math.sin(t * Math.PI));
      pts.push([x, y, ep]);
    }
    const bord = (s) => pts.map(([x, y, ep], i) => {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(N, i + 1)];
      let nx = -(b[1] - a[1]), ny = b[0] - a[0]; const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
      return [x + nx * ep * 0.5 * s, y + ny * ep * 0.5 * s];
    });
    const haut = bord(-1), bas = bord(1).reverse();
    const mil = pts[N >> 1], av = pts[(N >> 1) - 1], ap = pts[(N >> 1) + 1];
    let nx = -(ap[1] - av[1]), ny = ap[0] - av[0]; const nl = Math.hypot(nx, ny) || 1; nx /= nl; ny /= nl;
    const e = mil[2] * 0.5;
    const gr = g.createLinearGradient(mil[0] - nx * e, mil[1] - ny * e, mil[0] + nx * e, mil[1] + ny * e);
    gr.addColorStop(0, css(mel(rb.c, blanc, 0.55)));
    gr.addColorStop(0.18, css(mel(rb.c, blanc, 0.18)));
    gr.addColorStop(0.62, css(rb.c));
    gr.addColorStop(1, css(mel(rb.c, noir, 0.32)));
    g.save();
    g.shadowColor = 'rgba(10,12,30,0.32)'; g.shadowBlur = M * 0.05; g.shadowOffsetY = M * 0.012;
    g.beginPath();
    [...haut, ...bas].forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    g.closePath(); g.fillStyle = gr; g.fill();
    g.restore();
    // reflet brillant le long du bord éclairé
    g.save();
    g.beginPath(); haut.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = Math.max(1.5, M * 0.0022);
    g.shadowColor = 'rgba(255,255,255,0.9)'; g.shadowBlur = M * 0.01; g.stroke();
    g.restore();
  }
  // grain fin contre les bandes du dégradé
  const img = g.getImageData(0, 0, L, H), d = img.data;
  for (let i = 0; i < d.length; i += 4) { const n = (r() - 0.5) * 6; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
  g.putImageData(img, 0, 0);
  return canvas;
}

// Crée le canevas du fond d'écran dans chaque scène « papier »
export function papiers(palette, petit) {
  let k = 0;
  for (const fond of document.querySelectorAll('.scene-fond.papier')) {
    if (fond.querySelector('canvas')) continue;
    const c = document.createElement('canvas');
    c.className = 'papier-toile';
    c.width = petit ? 900 : 1600; c.height = petit ? 1600 : 1000;
    dessinerPapier(c, palette.papier, 11 + k++ * 17);
    fond.appendChild(c);
  }
}
