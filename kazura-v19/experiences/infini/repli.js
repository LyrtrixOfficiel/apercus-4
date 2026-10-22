// Le site infini : le repli sans WebGL. Un Droste vectoriel en canvas 2D : chaque page est redessinée à chaque image,
// à l'échelle exacte (jamais floue) ; son image d'ouverture montre un monde peint simplement (dégradé, lueur, poussières),
// et au milieu, la porte (rectangle ou rond) qui contient le site suivant. Mêmes gestes que la version 3D.
import { NIVEAUX, dessinerPage, trou, cheminTrou } from './pages.js';

const BOUCLE = NIVEAUX.length - 1;
const idDe = (n) => NIVEAUX[1 + (((n % BOUCLE) + BOUCLE) % BOUCLE)];

export function demarrer(toile, opts = {}) {
  const reduit = !!opts.reduit;
  const ctx = toile.getContext('2d');
  let W = 1, H = 1, pr = 1;
  function dim() { W = innerWidth; H = innerHeight; pr = Math.min(devicePixelRatio || 1, 2); toile.width = Math.round(W * pr); toile.height = Math.round(H * pr); }
  dim(); addEventListener('resize', dim);

  // la porte de chaque niveau, en pixels de l'écran (à l'échelle 1)
  function porte(info) {
    const t = trou(info.id, W, H), A = W / H;
    const cx = t.x + t.w / 2, cy = t.y + t.h * 0.56;
    let hh;
    if (info.rond) { const r = Math.min(t.w, t.h) * 0.36; hh = r / Math.sqrt(1 + A * A); return { cx, cy, w: 2 * hh * A, h: 2 * hh, r, t }; }
    hh = Math.min(t.h * 0.26, t.w * 0.3 / A);
    return { cx, cy, w: 2 * hh * A, h: 2 * hh, t };
  }

  function monde(info, t, temps) {
    const c = info.monde;
    const g = ctx.createLinearGradient(0, t.y, 0, t.y + t.h);
    g.addColorStop(0, shade(c, 0.55)); g.addColorStop(0.6, c); g.addColorStop(1, shade(c, 0.4));
    ctx.fillStyle = g; ctx.fillRect(t.x, t.y, t.w, t.h);
    const rg = ctx.createRadialGradient(t.x + t.w / 2, t.y + t.h * 0.56, 0, t.x + t.w / 2, t.y + t.h * 0.56, Math.max(t.w, t.h) * 0.6);
    rg.addColorStop(0, 'rgba(255,240,220,0.55)'); rg.addColorStop(1, 'rgba(255,240,220,0)');
    ctx.fillStyle = rg; ctx.fillRect(t.x, t.y, t.w, t.h);
    ctx.fillStyle = 'rgba(255,245,230,0.7)';
    for (let k = 0; k < 26; k++) {
      const x = t.x + ((k * 97.3 + temps * 9 * (1 + (k % 3))) % t.w), y = t.y + ((k * 53.7 + Math.sin(temps * 0.5 + k) * 12 + t.h) % t.h);
      ctx.beginPath(); ctx.arc(x, y, Math.max(0.6, Math.min(t.w, t.h) * 0.004 * (1 + (k % 3))), 0, 7); ctx.fill();
    }
  }
  function shade(hex, k) { const n = parseInt(hex.slice(1), 16); const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255; return `rgb(${Math.round(r * k)},${Math.round(g * k)},${Math.round(b * k)})`; }

  // dessine le niveau n (page, monde, porte, et à l'intérieur le niveau suivant) ; la matrice courante est déjà posée
  function niveau(n, profondeur, temps, echelle) {
    const info = idDe(n);
    const p = porte(info);
    if (echelle * W < 6) return;
    if (echelle * W < 60) { ctx.fillStyle = info.fond; ctx.fillRect(0, 0, W, H); return; }
    dessinerPage(ctx, info.id, W, H);
    ctx.save(); ctx.globalCompositeOperation = 'destination-over'; cheminTrou(ctx, p.t); ctx.clip(); monde(info, p.t, temps); ctx.restore();
    ctx.save(); cheminTrou(ctx, p.t); ctx.clip();
    // le cadre de la porte
    ctx.save();
    if (info.rond) { ctx.beginPath(); ctx.arc(p.cx, p.cy, p.r * 1.06, 0, 7); ctx.fillStyle = 'rgba(10,8,20,0.55)'; ctx.fill(); ctx.beginPath(); ctx.arc(p.cx, p.cy, p.r, 0, 7); ctx.clip(); }
    else { ctx.fillStyle = 'rgba(10,8,20,0.6)'; ctx.fillRect(p.cx - p.w / 2 - p.h * 0.04, p.cy - p.h / 2 - p.h * 0.04, p.w + p.h * 0.08, p.h * 1.08); ctx.beginPath(); ctx.rect(p.cx - p.w / 2, p.cy - p.h / 2, p.w, p.h); ctx.clip(); }
    if (profondeur > 0) {
      const s = p.w / W;
      ctx.save(); ctx.translate(p.cx - p.w / 2, p.cy - p.h / 2); ctx.scale(s, s);
      ctx.fillStyle = idDe(n + 1).fond; ctx.fillRect(-W, -H, 3 * W, 3 * H);
      niveau(n + 1, profondeur - 1, temps, echelle * s);
      ctx.restore();
    } else { ctx.fillStyle = idDe(n + 1).fond; ctx.fillRect(p.cx - p.w, p.cy - p.h, p.w * 2, p.h * 2); }
    ctx.restore();
    ctx.restore();
  }

  // l'état et les gestes (comme le moteur 3D)
  let D = 0, Dc = 0, dernierGeste = performance.now() - 1500, enPause = false, temps = 0, courant = -1;
  const pousser = (d) => { dernierGeste = performance.now(); Dc = Math.max(0, Dc + d / 3.2); };
  toile.addEventListener('wheel', (e) => { e.preventDefault(); pousser(Math.max(-2, Math.min(2, e.deltaY * (e.deltaMode ? 33 : 1) * 0.0042))); }, { passive: false });
  const doigts = new Map();
  toile.addEventListener('pointerdown', (e) => { doigts.set(e.pointerId, e.clientY); dernierGeste = performance.now(); });
  toile.addEventListener('pointermove', (e) => { if (!doigts.has(e.pointerId)) return; const dy = e.clientY - doigts.get(e.pointerId); doigts.set(e.pointerId, e.clientY); pousser(-dy / H * 2.6); });
  const lacher = (e) => doigts.delete(e.pointerId);
  toile.addEventListener('pointerup', lacher); toile.addEventListener('pointercancel', lacher);
  addEventListener('keydown', (e) => {
    if (['ArrowDown', 'PageDown', 'ArrowRight'].includes(e.key)) { e.preventDefault(); pousser(0.9); }
    else if (['ArrowUp', 'PageUp', 'ArrowLeft'].includes(e.key)) { e.preventDefault(); pousser(-0.9); }
  });

  let dernier = performance.now(), raf = 0;
  function image(now) {
    raf = requestAnimationFrame(image);
    const dt = Math.max(0, Math.min(0.1, (now - dernier) / 1000)); dernier = Math.max(dernier, now); temps += dt * (reduit ? 0.5 : 1);
    const calme = (now - dernierGeste) / 1000;
    if (!enPause && !reduit && calme > 3.2) Dc += dt * 0.12 * Math.min(1, (calme - 3.2) / 2);
    D += (Dc - D) * (1 - Math.exp(-dt / (reduit ? 0.55 : 0.24)));
    const n = Math.floor(D), f = D - n;
    const info = idDe(n), p = porte(info);
    // zoom exponentiel vers un point fixe : à f = 1, la porte remplit l'écran
    const S1 = W / p.w, s = Math.pow(S1, f);
    const Fx = (W / 2 - S1 * p.cx) / (1 - S1), Fy = (H / 2 - S1 * p.cy) / (1 - S1);
    ctx.setTransform(pr, 0, 0, pr, 0, 0);
    ctx.fillStyle = info.fond; ctx.fillRect(0, 0, W, H);
    ctx.setTransform(pr * s, 0, 0, pr * s, pr * (Fx - Fx * s), pr * (Fy - Fy * s));
    niveau(n, 3, temps, s);
    if (n !== courant) { courant = n; opts.surNiveau?.(n + 1, info); }
    opts.surProfondeur?.(D + 1, D * 3.2 + 1.4);
  }
  raf = requestAnimationFrame(image);
  return {
    aller(d) { Dc = D = Math.max(0, d - 1); dernierGeste = performance.now(); },
    pause(oui) { enPause = oui; },
    etat: () => ({ D: D + 1, repli: true }),
    attendre: async () => {},
    arreter() { cancelAnimationFrame(raf); },
  };
}
