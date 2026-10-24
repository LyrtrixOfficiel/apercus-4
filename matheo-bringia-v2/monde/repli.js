/* Le repli sans WebGL (pas de WebGL, three injoignable, plafond de 25 s, machine trop lente) : un canevas 2D.
   Le tracé lumineux d'Angerville vu du ciel (le point avance avec s, la partie parcourue s'allume), le MB dessiné
   avec les MÊMES contours que la 3D (logo-mb.json), ses 5 feux pour l'ouverture, le tunnel orange, le flash du
   podium (le MB passe à l'or), la nuit et la lueur orange de l'horizon. Même contrat que monde.js. */
import { TRACE } from './trace.js';

const SECTIONS = ['ouverture', 'palmares', 'course', 'photos', 'calendrier', 'actus', 'pilote', 'partenaires', 'arrivee'];
const borne = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lisse = (a, b, x) => { const t = borne((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const cloche = (a, b, c, d, x) => lisse(a, b, x) * (1 - lisse(c, d, x));
const U_LIGNE = 0.04;
/* même avancée que la 3D (à peu près) */
const CLES = [[0, 0.033], [1, 0.0475], [2, 0.118], [3, 0.252], [4, 0.398], [5, 0.508], [6, 0.567], [7, 0.598], [8, 0.8], [8.36, 1.0], [8.55, 1.04], [9, 1.072]];
function uDe(s) { for (let i = 0; i < CLES.length - 1; i++) { const [a, ua] = CLES[i], [b, ub] = CLES[i + 1]; if (s <= b) { const t = (s - a) / (b - a); return ua + (ub - ua) * t * t * (3 - 2 * t); } } return CLES[CLES.length - 1][1]; }
/* la place du MB : [cx, cy, taille] en fractions de l'écran, paysage / portrait */
const PLACE_P = [[0.5, 0.42, 0.34], [0.76, 0.36, 0.26], [0.76, 0.36, 0.26], [0.82, 0.22, 0.14], [0.76, 0.36, 0.26], [0.76, 0.36, 0.26], [0.7, 0.44, 0.42], [0.76, 0.36, 0.25], [0.5, 0.3, 0.3]];
const PLACE_V = [[0.5, 0.34, 0.2], [0.5, 0.24, 0.16], [0.5, 0.24, 0.16], [0.78, 0.13, 0.1], [0.5, 0.24, 0.16], [0.5, 0.24, 0.16], [0.5, 0.3, 0.28], [0.5, 0.24, 0.16], [0.5, 0.28, 0.22]];

export function repli(canvasOrig, { reduit = false, mobile = false, ids = SECTIONS, fondu = false } = {}) {
  let canvas = canvasOrig, ctx = null, superpose = false;
  try { ctx = canvasOrig.getContext('2d'); } catch {}
  if (!ctx) {
    // le canevas porte déjà un contexte WebGL : un canevas 2D par-dessus, à la même place
    canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    const cs = getComputedStyle(canvasOrig);
    canvas.style.cssText = `position:${cs.position === 'static' ? 'fixed' : cs.position};inset:0;width:100%;height:100%;pointer-events:none;z-index:${cs.zIndex === 'auto' ? 0 : cs.zIndex};`;
    canvasOrig.after(canvas);
    ctx = canvas.getContext('2d');
    superpose = true;
  }
  let logo = null;
  fetch(new URL('./logo-mb.json', import.meta.url)).then((r) => r.json()).then((d) => { logo = preparer(d); }).catch(() => {});
  function preparer(d) {
    const chemin = (formes) => { const p = new Path2D(); for (const f of formes) for (const b of [f.contour, ...f.trous]) { b.forEach((q, i) => (i ? p.lineTo(q[0], -q[1]) : p.moveTo(q[0], -q[1]))); p.closePath(); } return p; };
    return { sil: chemin(d.silhouette), let: chemin(d.lettres), lis: chemin(d.lisere) };
  }
  // le tracé normalisé
  let minX = 1e9, maxX = -1e9, minZ = 1e9, maxZ = -1e9;
  for (const [x, z] of TRACE) { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z); }
  const N = TRACE.length;

  let W = 1, H = 1, dpr = 1, portrait = false;
  function dimensionner() {
    const r = canvas.getBoundingClientRect();
    W = Math.max(1, Math.round(r.width || innerWidth)); H = Math.max(1, Math.round(r.height || innerHeight));
    portrait = H > W * 1.05;
    dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 1.5);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
  }
  dimensionner();
  const ro = new ResizeObserver(dimensionner); ro.observe(canvas);

  let sCible = 0, s = 0, temps = 0, dernier = 0, raf = 0, enPause = false, detruit = false;
  let tOuv = 0, accel = 1, finie = false, feux = 0, tFeu = 0.4, tTous = -1, tEteint = -1, dernierGeste = -1e9, apparition = fondu ? 0 : 1;
  let resFin; const ouvertureFinie = new Promise((r) => { resFin = r; });
  const DUREE = reduit ? 1.5 : 1;
  const geste = () => { dernierGeste = performance.now(); if (!finie) accel = 4; };
  for (const e of ['wheel', 'touchstart', 'keydown', 'pointerdown']) window.addEventListener(e, geste, { passive: true });
  let sectionCourante = 'ouverture';
  const mbE = { x: 0.5, y: 0.42, r: 0.17 };

  function place(tab, k) {
    const i = Math.floor(borne(s, 0, 8.999)), l = s - i, a = tab[i][k];
    if (l > 0.78 && i < 8) return a + (tab[i + 1][k] - a) * lisse(0.78, 1, l) * 0.5;
    if (l < 0.22 && i > 0) return tab[i - 1][k] + (a - tab[i - 1][k]) * (0.5 + lisse(0, 0.22, l) * 0.5);
    return a;
  }

  function dessiner() {
    const c = ctx; c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.globalAlpha = 1;
    // la nuit et la lueur orange
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#040406'); g.addColorStop(0.6, '#0a0708'); g.addColorStop(1, '#1d0c05');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    const rg = c.createRadialGradient(W * 0.5, H * 1.05, 0, W * 0.5, H * 1.05, Math.max(W, H) * 0.7);
    rg.addColorStop(0, 'rgba(255,90,20,0.22)'); rg.addColorStop(1, 'rgba(255,90,20,0)');
    c.fillStyle = rg; c.fillRect(0, 0, W, H);
    // le tracé vu du ciel (grand au final)
    const fin = lisse(8.6, 9, s);
    const zone = portrait ? { x: W * 0.06, y: H * 0.46, w: W * 0.88, h: H * 0.36 } : { x: W * 0.46, y: H * 0.52, w: W * 0.48, h: H * 0.38 };
    const zf = { x: W * 0.08, y: H * 0.42, w: W * 0.84, h: H * 0.48 };
    const zx = zone.x + (zf.x - zone.x) * fin, zy = zone.y + (zf.y - zone.y) * fin, zw = zone.w + (zf.w - zone.w) * fin, zh = zone.h + (zf.h - zone.h) * fin;
    const k = Math.min(zw / (maxX - minX), zh / (maxZ - minZ));
    const ox = zx + (zw - (maxX - minX) * k) / 2, oy = zy + (zh - (maxZ - minZ) * k) / 2;
    const P = (i) => { const p = TRACE[((i % N) + N) % N]; return [ox + (p[0] - minX) * k, oy + (p[1] - minZ) * k]; };
    c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath(); for (let i = 0; i <= N; i++) { const [x, y] = P(i); i ? c.lineTo(x, y) : c.moveTo(x, y); }
    c.strokeStyle = 'rgba(255,255,255,0.08)'; c.lineWidth = Math.max(5, 8 * k); c.stroke();
    c.strokeStyle = 'rgba(255,90,20,0.28)'; c.lineWidth = 1.5; c.stroke();
    // la partie parcourue s'allume
    const u = uDe(s), i0 = Math.round(U_LIGNE * N), i1 = Math.round(u * N);
    c.save(); c.shadowColor = '#ff5a14'; c.shadowBlur = 14;
    c.beginPath(); for (let i = i0; i <= i1; i++) { const [x, y] = P(i); i === i0 ? c.moveTo(x, y) : c.lineTo(x, y); }
    c.strokeStyle = '#ff6a24'; c.lineWidth = 2.6 + fin * 1.4; c.stroke(); c.restore();
    const [px, py] = P(i1);
    const pl = 0.5 + 0.5 * Math.sin(temps * 4);
    c.fillStyle = 'rgba(255,120,50,0.25)'; c.beginPath(); c.arc(px, py, 9 + pl * 5, 0, 7); c.fill();
    c.fillStyle = '#fff3ea'; c.beginPath(); c.arc(px, py, 3.2, 0, 7); c.fill();
    // le MB
    const tab = portrait ? PLACE_V : PLACE_P;
    const cx = place(tab, 0) * W, cy = place(tab, 1) * H, taille = place(tab, 2) * H * (1 + Math.sin(temps * (reduit ? 1 : 1.6)) * 0.012);
    let chute = 0; if (tOuv < 2) chute = (1 - (1 - Math.pow(1 - borne(tOuv / (1.2 * DUREE)), 3))) * H * 0.25;
    mbE.x = cx / W; mbE.y = (cy - chute) / H; mbE.r = taille * 0.55 / H;
    if (logo) {
      c.save(); c.translate(cx, cy - chute); c.scale(taille, taille);
      c.rotate(Math.sin(temps * 0.5) * 0.02 * (reduit ? 0.5 : 1));
      const or = lisse(8.44, 8.56, s), nacre = cloche(5.75, 6.0, 6.85, 7.0, s);
      c.shadowColor = 'rgba(255,90,20,0.45)'; c.shadowBlur = 30;
      const gs = c.createLinearGradient(-0.5, -0.5, 0.5, 0.5);
      if (or > 0.5) { gs.addColorStop(0, '#ffe2a0'); gs.addColorStop(0.5, '#c58a2a'); gs.addColorStop(1, '#ffd27a'); }
      else if (nacre > 0.5) { gs.addColorStop(0, '#ff8a3c'); gs.addColorStop(0.5, '#d83e05'); gs.addColorStop(1, '#ffb070'); }
      else { gs.addColorStop(0, '#2a2a2e'); gs.addColorStop(0.5, '#141416'); gs.addColorStop(1, '#2b2b30'); }
      c.fillStyle = gs; c.fill(logo.sil, 'evenodd');
      c.shadowBlur = 0;
      c.fillStyle = '#f4f0ea'; c.fill(logo.let, 'evenodd');
      c.fillStyle = '#ff5a14'; c.fill(logo.lis, 'evenodd');
      c.restore();
    }
    // les feux (ouverture)
    const allumes = tEteint > 0 ? 0 : feux;
    const vis = 1 - lisse(0.1, 0.5, s);
    if (vis > 0.01) {
      const r = Math.min(W, H) * 0.028, y = portrait ? H * 0.1 : H * 0.12;
      c.globalAlpha = vis;
      c.fillStyle = '#0b0b0c'; c.fillRect(W / 2 - r * 7, y - r * 1.6, r * 14, r * 3.2);
      for (let i = 0; i < 5; i++) {
        const x = W / 2 + (i - 2) * r * 2.6;
        if (i < allumes) { c.save(); c.shadowColor = '#ff2010'; c.shadowBlur = 24; c.fillStyle = '#ff2a14'; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); c.restore(); }
        else { c.fillStyle = '#2a0b0b'; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); }
      }
      c.globalAlpha = 1;
    }
    // le tunnel orange et le flash du podium
    const tun = cloche(3.78, 3.92, 4.18, 4.32, s);
    if (tun > 0) { c.fillStyle = `rgba(255,90,20,${0.18 * tun})`; c.fillRect(0, 0, W, H); }
    const fl = cloche(8.47, 8.52, 8.53, 8.63, s) * (reduit ? 0.6 : 1);
    if (fl > 0) { c.fillStyle = `rgba(255,244,228,${0.92 * fl})`; c.fillRect(0, 0, W, H); }
    flash = fl;
  }
  let flash = 0;

  function image(now) {
    raf = requestAnimationFrame(image);
    const dt = dernier ? Math.min(0.1, (now - dernier) / 1000) : 1 / 60; dernier = now;
    temps += dt;
    s += (sCible - s) * (1 - Math.exp(-(reduit ? 7 : 10) * dt));
    tOuv += dt * accel / DUREE;
    if (feux < 5 && tOuv >= tFeu) { feux++; tFeu = tOuv + 0.55; if (feux === 5) tTous = tOuv; }
    if (feux === 5 && tEteint < 0 && tOuv >= tTous + 1) tEteint = tOuv;
    if (tEteint > 0 && !finie && tOuv >= tEteint + 0.45) { finie = true; accel = 1; resFin(); }
    if (apparition < 1) { apparition = Math.min(1, apparition + dt / 1.2); canvas.style.opacity = String(apparition); }
    dessiner();
  }
  if (fondu) { canvas.style.opacity = '0'; tOuv = 99; feux = 5; tEteint = 1; finie = true; resFin(); }
  raf = requestAnimationFrame(image);

  return {
    repli: true,
    pret: Promise.resolve(),
    ouvertureFinie,
    progression(p, id, locale) {
      const i = ids.indexOf(id);
      const l = locale == null || Number.isNaN(Number(locale)) ? 0.5 : borne(Number(locale));
      sCible = borne(i >= 0 ? i + l : borne(Number(p) || 0) * 9, 0, 9);
      sectionCourante = SECTIONS[Math.min(8, Math.floor(sCible))];
    },
    definirPhotos() {}, definirPartenaires() {}, definirChiffres() {},
    passer() { if (performance.now() - dernierGeste < 1500 && !finie) accel = 4; },
    clairEn() { return flash > 0.5 ? 1 : 0; },
    etat() { const clair = Math.round(Math.min(1, flash) * 100) / 100; return { section: sectionCourante, s: Math.round(s * 1000) / 1000, clair, fond: clair > 0.5 ? 'clair' : 'sombre', mb: { ...mbE }, fps: 0, feux: tEteint > 0 ? 0 : feux, depart: finie, palier: 5, qualite: 0 }; },
    pause() { if (enPause) return; enPause = true; cancelAnimationFrame(raf); },
    reprendre() { if (!enPause || detruit) return; enPause = false; dernier = 0; raf = requestAnimationFrame(image); },
    get enPause() { return enPause; },
    stats() { return { repli: true, s, ouverture: tOuv, feux }; },
    detruire() {
      detruit = true; cancelAnimationFrame(raf); ro.disconnect();
      for (const e of ['wheel', 'touchstart', 'keydown', 'pointerdown']) window.removeEventListener(e, geste);
      if (superpose) canvas.remove();
      resFin();
    },
  };
}
