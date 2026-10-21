/* Kazura v13, la Scène : le repli sans WebGL.
   Le même récit, en 2D (un canevas 2D, quelques éléments DOM et CSS), pour les navigateurs qui ne
   donnent pas WebGL (navigateurs intégrés à une appli, réglages d'économie, vieux téléphones) :
   - l'ouverture : étincelle, traits de construction, la vrille qui trace l'anneau, la feuille trifoliée,
     puis le sceau qui se matérialise, éclat et onde ;
   - le sceau au centre, qui respire, se balance (fausse perspective) et change de peau : jade, verre
     irisé, givre, or et jade ; des vrilles poussent autour, des lucioles tournent ;
   - la salle de dalles et le mot géant qui défile, tramé de points de lumière ;
   - le carrousel des réalisations : les captures posées en arc, en perspective CSS ;
   - v14 : l'arc de lumière derrière le mot, des feuilles de kudzu sur les côtés, des poussières ;
   - v14 : le passage au clair par tranches verticales (gris, couleurs de profondeur, clair), le monde clair
     à croix avec ses taches de couleur, ses feuilles de verre et le mot RÊVER en contour, le contour fin,
     le ruban holographique et son chemin ;
   - v16 : « Osez rêver » vit dans le VIOLET (soie violette qui coule, lueur rose) ; une coulée irisée en diagonale
     couvre l'écran puis se retire en laissant le BLANC du déroulé ; plus de failles ; l'anneau des réalisations
     montre ses voisins, un clic sur un voisin l'amène de face, une petite rotation d'invitation au premier passage ;
   - v15 : un long passage violet ; la marée irisée ramène la salle, apaisée,
     pour « Qui fait votre site » (plus de hanko) ; le final or et jade.
   - v17 : l'ordre des parties change (Expériences après « Qui fait votre site ») ; LA FEUILLE de porcelaine se lève
     du bas, inclinée, et remplit l'écran (plus de coulée arc-en-ciel) ; le blanc est la feuille de dessin (croix
     fines, traits de construction du sceau au fil des moments) ; la rive de la marée est un fil fin ; au téléphone,
     `telephoneDom` efface l'anneau CSS au profit du carrousel de la page.
   Même interface que la scène 3D. */
import { chargerPolice } from './typo.js';

const SECTIONS = ['ouverture', 'promesse', 'realisations', 'rever', 'deroule', 'matheo', 'experiences', 'questions', 'contact'];   // v17
const MOTS = ['KAZURA', 'RECOMMANDÉ', 'CHERCHÉ', 'TROUVÉ', 'EXPÉRIENCE', 'RÉALISATIONS', '', '', 'QUESTIONS', 'KAZURA'];

const ANNEAU = 'M50 2a48 48 0 1 0 0 96 48 48 0 1 0 0-96zm0 6a42 42 0 1 1 0 84 42 42 0 1 1 0-84z';
const FOLIOLE = 'M50 46C39.5 37 34.5 23.5 50 7c15.5 16.5 10.5 30 0 39zm0-7.4c6.2-6 8.6-14.4 0-23.6-8.6 9.2-6.2 17.6 0 23.6z';

const borne = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lisse = (a, b, x) => { const t = borne((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const mel = (a, b, t) => a + (b - a) * t;
const amortir = (x, c, l, dt) => c + (x - c) * Math.exp(-l * dt);
const sortie3 = (t) => 1 - Math.pow(1 - borne(t), 3);
const es = (t) => { t = borne(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
function hasard(g) { let a = g >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const hex = (h) => [(h >> 16) & 255, (h >> 8) & 255, h & 255];
const rgba = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const melC = (a, b, t) => [mel(a[0], b[0], t), mel(a[1], b[1], t), mel(a[2], b[2], t)];

/* les parties : teinte, peaux, présence des vrilles et lucioles */
const CLES = [
  { teinte: 0x6d3fd1, verre: 0, givre: 0, or: 0, ech: 1.0, y: 0, vrilles: 1, essaim: 1, seve: 0xa855f7 },
  { teinte: 0x4f46e5, verre: 1, givre: 0, or: 0, ech: 0.98, y: 0, vrilles: 0.7, essaim: 0.8, seve: 0xa855f7 },
  { teinte: 0x8b5cf6, verre: 1, givre: 0.3, or: 0, ech: 0.5, y: -0.55, vrilles: 0.3, essaim: 0.4, seve: 0xa855f7 },
  { teinte: 0x8b5cf6, verre: 0, givre: 0, or: 0, ech: 1.0, y: 0, vrilles: 0, essaim: 0, seve: 0xa855f7 },
  { teinte: 0x8b5cf6, verre: 0, givre: 0, or: 0, ech: 1.0, y: 0, vrilles: 0, essaim: 0, seve: 0xa855f7 },
  { teinte: 0x2b2163, verre: 1, givre: 0.25, or: 0.45, ech: 0.85, y: 0, vrilles: 1, essaim: 0.45, seve: 0x6ee7b7 },
  { teinte: 0x0f8f86, verre: 1, givre: 1, or: 0, ech: 0.8, y: 0, vrilles: 0.6, essaim: 0.5, seve: 0x8b5cf6 },   // v17 : expériences
  { teinte: 0x4338ca, verre: 1, givre: 0.6, or: 0, ech: 0.92, y: 0, vrilles: 0.5, essaim: 0.7, seve: 0xa855f7 },
  { teinte: 0xb7832f, verre: 0, givre: 0, or: 1, ech: 1.04, y: 0, vrilles: 1, essaim: 1, seve: 0xf2c87a },
].map((c) => ({ ...c, teinte: hex(c.teinte), seve: hex(c.seve) }));
const MOT_PAR_PARTIE = [0, 1, 5, -1, -1, -1, 4, 8, 9];   // v17

const HOLO = [[255, 56, 158], [31, 216, 255], [77, 242, 115], [133, 82, 255], [255, 224, 77]];

const STYLE = `
.kz-repli { position: fixed; inset: 0; pointer-events: none; overflow: hidden; background: #050309; }
.kz-repli canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
.kz-car { position: absolute; inset: 0; perspective: 1100px; perspective-origin: 50% 42%; opacity: 0; transition: opacity .8s ease; }
.kz-car-anneau { position: absolute; left: 50%; top: 36%; width: 0; height: 0; transform-style: preserve-3d; }
.kz-car-p { position: absolute; left: 0; top: 0; border-radius: 10px; background: #120c1e center top / cover no-repeat; backface-visibility: hidden;
  box-shadow: 0 0 0 1px rgba(255,255,255,.18), 0 0 26px rgba(160,120,255,.25), 0 30px 60px rgba(0,0,0,.6); }
.kz-car-p::after { content: ""; position: absolute; inset: -2px; border-radius: 12px; padding: 2px; background: linear-gradient(var(--kz-a, 0deg), #ff389e, #1fd8ff, #4df273, #8552ff, #ffe04d, #ff389e);
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor; mask-composite: exclude; opacity: .75; }
`;

/* v17 : LA FEUILLE qui bascule et se lève, même formule que la scène (glsl.js kzFeuille, monde.js poseFeuille) */
const DEBUT_VAGUE = 3.62, DUREE_VAGUE = 0.5;
const lsF = (a, b, x) => { const k = Math.min(1, Math.max(0, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
function poseFeuille(f, doux) {
  const e = lsF(0, 0.62, f), h = 1 - lsF(0, 1, f), g = 1 - lsF(0, 0.25, f);
  const A = (1.42 - 0.5 * doux) * Math.pow(h, 1.35), r = -0.2 * (1 - doux) * h * h;
  const C = [0, -0.62 * Math.pow(1 - e, 1.4) - 1.6 * g * g, -1 - 2.3 * Math.pow(1 - e, 1.7)];
  const ca = Math.cos(A), sa = Math.sin(A), cr = Math.cos(r), sr = Math.sin(r);
  return { A, C, R: [cr, sr, 0], V: [-sr * ca, cr * ca, -sa], N: [-sr * sa, cr * sa, ca] };
}
function feuillePt(u, v, f, asp, doux) {
  if (f >= 1) return true;
  if (f <= 0) return false;
  const { C, R, V, N } = poseFeuille(f, doux), px = (u - 0.5) * asp, py = v - 0.5;
  const dn = px * N[0] + py * N[1] - N[2];
  const tt = (C[1] * N[1] + C[2] * N[2]) / (Math.abs(dn) < 1e-5 ? -1e-5 : dn);
  if (tt <= 0) return false;
  const X = [px * tt - C[0], py * tt - C[1], -tt - C[2]];
  return Math.abs(X[0] * R[0] + X[1] * R[1]) < 0.5 * asp + 0.07 && Math.abs(X[0] * V[0] + X[1] * V[1] + X[2] * V[2]) < 0.57;
}
/* les coins d'un rectangle de la feuille à l'écran (u, v de 0 à 1 depuis le haut gauche) ; ep : décalage derrière
   la face avant (la tranche) */
function coinsFeuille(f, asp, doux, ep = 0) {
  const { C, R, V, N } = poseFeuille(f, doux), W = 0.5 * asp + 0.07, H = 0.57;
  return [[-W, -H], [W, -H], [W, H], [-W, H]].map(([a, b]) => {
    const X = [0, 1, 2].map((i) => C[i] + R[i] * a + V[i] * b - N[i] * ep);
    return [0.5 + (X[0] / -X[2]) / asp, 0.5 - X[1] / -X[2]];
  });
}
export function repli(canvas, { reduit = false, mobile = false, telephoneDom = false } = {}) {
  let telDom = !!telephoneDom;
  if (!document.getElementById('kz-repli-style')) {
    const st = document.createElement('style');
    st.id = 'kz-repli-style'; st.textContent = STYLE;
    document.head.appendChild(st);
  }
  const div = document.createElement('div');
  div.className = 'kz-repli';
  div.setAttribute('aria-hidden', 'true');
  const cv = document.createElement('canvas');
  const car = document.createElement('div'); car.className = 'kz-car';
  const anneauCar = document.createElement('div'); anneauCar.className = 'kz-car-anneau';
  car.appendChild(anneauCar);
  div.append(cv, car);
  const cs = canvas ? getComputedStyle(canvas) : null;
  if (cs && cs.zIndex && cs.zIndex !== 'auto') div.style.zIndex = cs.zIndex;
  if (canvas && canvas.parentNode) { canvas.style.display = 'none'; canvas.parentNode.insertBefore(div, canvas.nextSibling); }
  else document.body.prepend(div);
  const ctx = cv.getContext('2d');

  const pAnneau = new Path2D(ANNEAU), pFoliole = new Path2D(FOLIOLE);
  let police = false;
  chargerPolice().then((ok) => { police = ok; });

  /* ------------------------------------------------------------ tracés précalculés (unités du dessin, 0 à 100) */
  const vrille = [];
  { const P0 = [50, 50], P1 = [48.1, 73.8], P2 = [55.9, 98.6], P3 = [72.5, 88.97];
    for (let i = 0; i <= 40; i++) { const t = i / 40, m = 1 - t; vrille.push([m * m * m * P0[0] + 3 * m * m * t * P1[0] + 3 * m * t * t * P2[0] + t * t * t * P3[0], m * m * m * P0[1] + 3 * m * m * t * P1[1] + 3 * m * t * t * P2[1] + t * t * t * P3[1]]); }
    for (let i = 1; i <= 160; i++) { const a = -Math.PI / 3 + (i / 160) * (Math.PI * 2 + 0.25); vrille.push([50 + 45 * Math.cos(a), 50 - 45 * Math.sin(a)]); } }
  const lv = [0]; for (let i = 1; i < vrille.length; i++) lv.push(lv[i - 1] + Math.hypot(vrille[i][0] - vrille[i - 1][0], vrille[i][1] - vrille[i - 1][1]));
  const LV = lv[lv.length - 1], LJET = lv[40];
  const alea = hasard(613);
  const vrilles = [-Math.PI / 3, 0.55, 1.9, 2.75, 3.75].map((a0, k) => {
    const pts = []; let x = 50 + 48 * Math.cos(a0), y = 50 - 48 * Math.sin(a0);
    const sens = alea() < 0.5 ? 1 : -1;
    let dir = -a0 + sens * 0.6;
    const n = 60 + Math.round(alea() * 30);
    for (let i = 0; i < n; i++) { pts.push([x, y]); const f = i / n; dir += sens * (0.02 + (f > 0.55 ? Math.pow((f - 0.55) / 0.45, 2) * 0.32 : 0)); x += Math.cos(dir) * 0.9; y += Math.sin(dir) * 0.9; }
    return { pts, retard: k * 0.18 };
  });
  const arc = []; for (let i = 0; i <= 80; i++) { const a = 2.35 + (-Math.PI / 3 - 2.35) * (i / 80); arc.push([50 + 45 * Math.cos(a), 50 - 45 * Math.sin(a)]); }
  const descente = []; { let [x, y] = arc[arc.length - 1]; for (let i = 0; i < 600; i++) { y += 1.0; x = 72.5 - 22 * Math.sin(i * 0.012) * Math.min(1, i / 60) - 8 * Math.sin(i * 0.031); descente.push([x, y]); } }
  // v14 : feuilles de kudzu sur les côtés (en haut et en bas sur un téléphone) et poussières
  const feuillesH = Array.from({ length: mobile ? 9 : 16 }, (_, i) => ({ c: i % 2 ? 1 : -1, a: alea() * 2 - 1, b: 0.55 + alea() * 0.5, s: 0.09 + alea() * 0.1, r: alea() * 6.28, p: alea() * 6.28, z: alea() }));
  const pous = Array.from({ length: mobile ? 50 : 110 }, () => ({ x: alea(), y: alea(), v: 0.004 + alea() * 0.012, r: 0.6 + alea() * 2.4, p: alea() * 6.28 }));
  const essaim = Array.from({ length: mobile ? 60 : 110 }, () => ({ r: 54 + Math.pow(alea(), 1.5) * 50, a: alea() * 6.283, v: 0.1 + alea() * 0.25, t: alea(), y: (alea() - 0.5) * 0.4 }));

  /* ------------------------------------------------------------ calques précalculés (au redimensionnement) */
  let W = 1, H = 1, dpr = 1, mur = null, croix = null, trame = null, violetC = null;
  function calque(w, h) { const c = document.createElement('canvas'); c.width = Math.max(1, w); c.height = Math.max(1, h); return c; }
  function preparer() {
    // la salle de dalles : carreaux noirs, liseré, grille fine, bombés comme un cylindre
    mur = calque(W, H); const m = mur.getContext('2d');
    m.fillStyle = '#060509'; m.fillRect(0, 0, W, H);
    const tw = Math.max(70, H * 0.19), r = hasard(7);
    const bomb = (x, y) => y + (y - H * 0.45) * 0.1 * Math.pow((x - W / 2) / (W / 2), 2);
    for (let cx = W / 2 - Math.ceil(W / 2 / tw) * tw; cx < W; cx += tw) {
      const off = r() * tw;
      for (let y = -off; y < H + tw; y += tw) {
        const v = r();
        m.fillStyle = `rgba(${18 + v * 14},${16 + v * 12},${26 + v * 20},${0.55 + 0.45 * v})`;
        const y0 = bomb(cx, y), y1 = bomb(cx, y + tw);
        m.fillRect(cx + 2, y0 + 2, tw - 4, y1 - y0 - 4);
        m.fillStyle = 'rgba(255,255,255,0.035)'; m.fillRect(cx + 4, y0 + 4, tw - 8, 1.5);
        m.strokeStyle = 'rgba(200,200,230,0.04)'; m.lineWidth = 1;
        for (let k = 1; k < 6; k++) { m.beginPath(); m.moveTo(cx + k * tw / 6, y0); m.lineTo(cx + k * tw / 6, y1); m.stroke(); m.beginPath(); m.moveTo(cx, y0 + k * (y1 - y0) / 6); m.lineTo(cx + tw, y0 + k * (y1 - y0) / 6); m.stroke(); }
      }
    }
    const v = m.createLinearGradient(0, 0, 0, H); v.addColorStop(0, 'rgba(0,0,0,.85)'); v.addColorStop(0.3, 'rgba(0,0,0,0)'); v.addColorStop(0.7, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.85)');
    m.fillStyle = v; m.fillRect(0, 0, W, H);
    trame = calque(Math.round(6 * dpr), Math.round(6 * dpr)); const t = trame.getContext('2d');
    t.fillStyle = 'rgba(225,220,245,1)'; t.beginPath(); t.arc(trame.width / 2, trame.height / 2, trame.width * 0.32, 0, 7); t.fill();
    // v16 : le monde violet : la profondeur (indigo, violet, magenta, rose), des coulées de soie en diagonale, des croix
    violetC = calque(W, H); const vc = violetC.getContext('2d');
    const gv0 = vc.createLinearGradient(0, 0, W, H); gv0.addColorStop(0, '#12063a'); gv0.addColorStop(0.45, '#3a0f8f'); gv0.addColorStop(0.8, '#7a1fc9'); gv0.addColorStop(1, '#b02aa8');
    vc.fillStyle = gv0; vc.fillRect(0, 0, W, H);
    const rv = hasard(31), portV = W < H;
    vc.save(); vc.translate(W / 2, H / 2); vc.rotate(portV ? -1.22 : -1.05);
    const Lg = Math.hypot(W, H);
    for (let k = 0; k < 9; k++) {
      const y = (k / 8 - 0.5) * Lg * 0.9 + (rv() - 0.5) * Lg * 0.06, e = Lg * (0.03 + rv() * 0.06);
      const g = vc.createLinearGradient(0, y - e, 0, y + e);
      const c = ['168,85,247', '217,70,239', '124,58,237', '244,114,182'][k % 4];
      g.addColorStop(0, `rgba(${c},0)`); g.addColorStop(0.5, `rgba(${c},${0.18 + rv() * 0.2})`); g.addColorStop(1, `rgba(${c},0)`);
      vc.fillStyle = g; vc.fillRect(-Lg, y - e, Lg * 2, e * 2);
    }
    vc.restore();
    // côté textes (à gauche en paysage) : l'indigo profond ; au téléphone, un voile égal
    const gl = vc.createLinearGradient(0, 0, W, 0);
    if (portV) { gl.addColorStop(0, 'rgba(10,3,30,.3)'); gl.addColorStop(1, 'rgba(10,3,30,.3)'); }
    else { gl.addColorStop(0, 'rgba(10,3,30,.55)'); gl.addColorStop(0.55, 'rgba(10,3,30,.1)'); gl.addColorStop(1, 'rgba(10,3,30,0)'); }
    vc.fillStyle = gl; vc.fillRect(0, 0, W, H);
    vc.strokeStyle = 'rgba(200,180,255,.35)'; vc.lineWidth = Math.max(1, dpr);
    { const gp = 26 * dpr * 7, d = 8 * dpr;
      for (let x = (W / 2) % gp; x < W; x += gp) for (let y = (H / 2) % gp; y < H; y += gp) { vc.beginPath(); vc.moveTo(x - d, y); vc.lineTo(x + d, y); vc.moveTo(x, y - d); vc.lineTo(x, y + d); vc.stroke(); } }
    // v17 : la feuille de dessin : blanc froid lumineux, vignette légère, croix fines (plus de grille grise)
    croix = calque(W, H); const c = croix.getContext('2d');
    const g = c.createRadialGradient(W / 2, H * 0.5, Math.min(W, H) * 0.3, W / 2, H * 0.5, Math.max(W, H) * 0.75);
    g.addColorStop(0, '#eef2f4'); g.addColorStop(1, '#dde3e8');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.strokeStyle = 'rgba(150,160,172,0.7)'; c.lineWidth = Math.max(1, dpr * 0.8);
    const gp = H * 0.2, d = 7 * Math.max(dpr, H / 900);
    for (let x = W / 2 - Math.ceil(W / 2 / gp) * gp; x < W; x += gp) for (let y = H / 2 - Math.ceil(H / 2 / gp) * gp; y < H; y += gp) { c.beginPath(); c.moveTo(x - d, y); c.lineTo(x + d, y); c.moveTo(x, y - d); c.lineTo(x, y + d); c.stroke(); }
  }
  /* v17 : l'avancement du déroulé (0 à 6), lu dans la page (#chemin > .moment) comme la scène, sinon d'après s */
  function avancementDeroule(sv) {
    const ch = document.getElementById('chemin');
    const ms = ch ? [...ch.querySelectorAll(':scope > .moment')] : [];
    let D = 0;
    if (ms.length >= 6) for (let k = 0; k < 6; k++) { const r = ms[k].getBoundingClientRect(); D += borne((innerHeight * 0.86 - r.top) / (innerHeight * 0.38)); }
    else for (let k = 0; k < 6; k++) D += borne((sv - 4 - (0.12 + k * 0.13)) / 0.08);
    return D;
  }
  /* v17 : les traits de construction du sceau sur la feuille, puis le sceau au trait blanc et son ombre douce */
  function dessinRepli(sv) {
    if (sv < 3.9 || sv > 5.4) return;
    const D = avancementDeroule(sv);
    if (D <= 0.001) return;
    const k = (i, l = 0.9) => lsF(i, i + l, D);
    const port = W < H, S = port ? 0.42 * W : 0.36 * H, cx = port ? W / 2 : W / 2 - 0.06 * W, cy = port ? H * 0.4 : H / 2;
    const u = Math.max(1, H / 900);
    ctx.save();
    ctx.strokeStyle = 'rgba(140,152,166,.8)'; ctx.lineWidth = 1.1 * u;
    const k0 = k(0), k1 = k(1), k2 = k(2), k3 = k(3), k4 = k(4), k5 = k(5, 0.8);
    if (k0 > 0) { const L = (W * 0.5 + 0.3 * H) * k0, Lv = 0.8 * H * k0; ctx.beginPath(); ctx.moveTo(cx - L, cy); ctx.lineTo(cx + L, cy); ctx.moveTo(cx, cy - Lv); ctx.lineTo(cx, cy + Lv); ctx.stroke(); }
    const arcH = (x, y, r, f, dep = 0) => { if (f <= 0) return; ctx.beginPath(); ctx.arc(x, y, r, -Math.PI / 2 + dep, -Math.PI / 2 + dep + f * Math.PI * 2); ctx.stroke(); };
    arcH(cx, cy, S, k1); arcH(cx, cy, S * 0.86, k1);
    if (k2 > 0) for (let i = 0; i < 3; i++) {
      const an = -Math.PI / 2 + i * 2.0944, dx = Math.cos(an), dy = Math.sin(an);
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + dx * S * 1.25 * k2, cy + dy * S * 1.25 * k2); ctx.stroke();
      arcH(cx + dx * S * 0.5, cy + dy * S * 0.5, S * 0.5, k2, i * 2.0944);
    }
    if (k3 > 0) {
      ctx.save(); ctx.beginPath(); ctx.rect(cx - S, cy - S, 2 * S, 2 * S * k3); ctx.clip();
      ctx.strokeRect(cx - S, cy - S, 2 * S, 2 * S);
      ctx.globalAlpha = 0.45; ctx.beginPath();
      for (let j = 1; j < 8; j++) { const o = -S + j * S / 4; ctx.moveTo(cx + o, cy - S); ctx.lineTo(cx + o, cy + S); ctx.moveTo(cx - S, cy + o); ctx.lineTo(cx + S, cy + o); }
      ctx.stroke(); ctx.restore();
    }
    if (k4 > 0) {
      ctx.save(); ctx.translate(cx, cy); ctx.scale(S / 48, S / 48); ctx.translate(-50, -50);
      ctx.beginPath(); ctx.moveTo(50, 50); ctx.arc(50, 50, 80, -Math.PI / 2, -Math.PI / 2 + k4 * Math.PI * 2); ctx.closePath(); ctx.clip();
      const tracer = () => { ctx.stroke(new Path2D(ANNEAU)); for (let i = 0; i < 3; i++) { ctx.save(); ctx.translate(50, 50); ctx.rotate(i * 2.0944); ctx.translate(-50, -50); ctx.stroke(new Path2D(FOLIOLE)); ctx.restore(); } };
      ctx.lineWidth = 1.6 * u * 48 / S;
      ctx.save(); ctx.translate(1.6 * u * 48 / S, 2.2 * u * 48 / S); ctx.strokeStyle = 'rgba(120,132,150,.35)'; ctx.filter = `blur(${(2 * u).toFixed(1)}px)`; tracer(); ctx.restore();
      ctx.strokeStyle = 'rgba(255,255,255,.98)'; tracer();
      if (k5 > 0) { ctx.globalAlpha = 0.5 * k5; ctx.strokeStyle = holo(0, 0, 100, 100, temps * 0.05, 8); ctx.lineWidth = 0.8 * u * 48 / S; ctx.stroke(new Path2D(ANNEAU)); }
      ctx.restore();
    }
    ctx.restore();
  }
  /* la part du clair à l'écran (même modèle que kzEtat de la scène) */
  /* v16 : le clair (blanc) en un point (u, v : 0 à 1, v vers le haut) ; le violet de « Osez rêver » compte comme sombre */
  function clairPt(sv, u, v) {
    const bal = borne((sv - 2.6) / 0.7), liq = lisse(4.86, 5.18, sv), w = borne((sv - DEBUT_VAGUE) / DUREE_VAGUE);
    if (bal <= 0 || w <= 0) return 0;
    const N = Math.max(4, Math.round((W / Math.max(1, H)) * 4.5)), b = Math.floor(borne(u) * N);
    let c = bal >= 1 ? 1 : (((bal - 0.66) / 0.34 - (((Math.sin(b * 12.9898 + 9.7) * 43758.5453) % 1 + 1) % 1) * 0.5 - (1 - v) * 0.32) >= 0 ? 1 : 0);
    if (c && liq > 0 && v < -0.3 + 1.6 * liq) c = 0;
    if (c && w < 1 && !feuillePt(u, v, w, W / Math.max(1, H), reduit ? 1 : 0)) c = 0;
    return c;
  }
  function partClaire(sv) {
    let t = 0, n = 0;
    for (let b = 0; b < 12; b++) for (let k = 0; k < 12; k++) { t += clairPt(sv, (b + 0.5) / 12, (k + 0.5) / 12); n++; }
    return t / n;
  }
  function dimensionner() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    W = Math.round((div.clientWidth || innerWidth) * dpr); H = Math.round((div.clientHeight || innerHeight) * dpr);
    cv.width = W; cv.height = H;
    preparer();
    placerCarrousel();
  }

  /* ------------------------------------------------------------ carrousel en CSS */
  let sites = [], panneaux = [], actif = 0, angle = 0, angleCible = 0, glisse = 0, rayonCar = 400, invit = -1, decalI = 0, carVisR = 0;
  const ecouteurs = [], ecoutesClic = [];
  /* v16 : le panneau (indice du site) sous un point de l'écran (x, y : 0 à 1), le plus en face d'abord */
  function panneauEn(x, y) {
    if (carVisR < 0.5 || !panneaux.length) return -1;
    const X = x * innerWidth, Y = y * innerHeight, n = panneaux.length;
    let best = -1, bd = 1e9;
    panneaux.forEach((p, i) => {
      const r = p.getBoundingClientRect();
      if (X < r.left || X > r.right || Y < r.top || Y > r.bottom || Number(p.style.opacity) < 0.15) return;
      let d = i - angle; d -= Math.round(d / n) * n;
      if (Math.abs(d) < bd) { bd = Math.abs(d); best = i; }
    });
    return best;
  }
  let xB = 0, yB = 0;
  const surBas = (e) => { xB = e.clientX; yB = e.clientY; };
  const surClic = (e) => {
    if (carVisR < 0.6 || (e.target && e.target.closest && e.target.closest('a,button,input,textarea,select,label,summary,[role="button"]'))) return;
    if (Math.hypot(e.clientX - xB, e.clientY - yB) > 8) return;
    const k = panneauEn(e.clientX / innerWidth, e.clientY / innerHeight);
    if (k < 0 || k === actif) return;
    invit = 2;
    api.realisations.aller(k);
    for (const f of ecoutesClic) { try { f(k, sites[k]); } catch {} }
  };
  const pasCar = 0.9;
  function placerCarrousel() {
    const w = Math.min(560, (W / dpr) * (W < H ? 0.7 : 0.5)), h = w * 0.62;
    panneaux.forEach((p) => { p.style.width = w + 'px'; p.style.height = h + 'px'; p.style.marginLeft = -w / 2 + 'px'; p.style.marginTop = -h / 2 + 'px'; });
    rayonCar = w * 0.9;
  }
  function construireCarrousel() {
    anneauCar.innerHTML = '';
    panneaux = sites.map((s) => { const p = document.createElement('div'); p.className = 'kz-car-p'; if (s.image) p.style.backgroundImage = `url("${s.image}")`; anneauCar.appendChild(p); return p; });
    placerCarrousel();
  }

  /* ------------------------------------------------------------ état */
  const echelle = reduit ? 1.55 : 1.15;
  let tOuv = 0, accel = 1, temps = 0, dernier = 0, raf = 0, detruit = false, enPause = false;
  let sCible = 0, sL = 0, section = 'ouverture', croiss = 0, spin = 0, motDecal = 0, pulse = 0;
  let finir; const ouvertureFinie = new Promise((r) => { finir = r; });
  let titreDonne = false, dernierGeste = -1e9, sDepart = null;
  const mesures = [];
  const q = { x: 0, y: 0, z: 0, w: 1 };
  const teinte = CLES[0].teinte.slice();

  function cles(s) {
    const x = borne(s - 0.5, 0, CLES.length - 1), i = Math.min(CLES.length - 2, Math.floor(x));
    let t = x - i; t = t * t * (3 - 2 * t);
    const a = CLES[i], b = CLES[i + 1], o = {};
    for (const k of ['verre', 'givre', 'or', 'ech', 'y', 'vrilles', 'essaim']) o[k] = mel(a[k], b[k], t);
    o.teinte = melC(a.teinte, b.teinte, t); o.seve = melC(a.seve, b.seve, t);
    return o;
  }

  /* ------------------------------------------------------------ dessin du sceau */
  function tracerPolyligne(pts, l0, l1, lens) {
    ctx.beginPath(); let commence = false;
    for (let i = 0; i < pts.length; i++) {
      if (lens[i] < l0 || lens[i] > l1) continue;
      if (!commence) { ctx.moveTo(pts[i][0], pts[i][1]); commence = true; } else ctx.lineTo(pts[i][0], pts[i][1]);
    }
  }
  function formeSceau(fn) { fn(pAnneau, 'anneau'); for (let i = 0; i < 3; i++) { ctx.save(); ctx.translate(50, 50); ctx.rotate(i * 2.0944); ctx.translate(-50, -50); fn(pFoliole, 'foliole'); ctx.restore(); } fn(null, 'coeur'); }
  function remplir(p) { if (p) ctx.fill(p, 'evenodd'); else { ctx.beginPath(); ctx.arc(50, 50, 4.6, 0, 7); ctx.fill(); } }
  function trait(p) { if (p) ctx.stroke(p); else { ctx.beginPath(); ctx.arc(50, 50, 4.6, 0, 7); ctx.stroke(); } }
  function sceauPeau(K, app, seve, eclat) {
    const jade = ctx.createRadialGradient(38, 30, 4, 50, 50, 62);
    jade.addColorStop(0, '#6ff0c0'); jade.addColorStop(0.5, '#12a876'); jade.addColorStop(1, '#075a3e');
    const or = ctx.createLinearGradient(10, 10, 90, 90);
    or.addColorStop(0, '#fff3c4'); or.addColorStop(0.4, '#eec877'); or.addColorStop(0.7, '#a8731f'); or.addColorStop(1, '#f6dc9a');
    formeSceau((p, type) => {
      const a = type === 'anneau' ? app.anneau : type === 'foliole' ? app.folioles : app.coeur;
      if (a <= 0.001) return;
      ctx.save();
      if (a < 0.999) { // apparition : l'anneau dans le sens de la vrille, les folioles depuis la base, le cœur depuis le centre
        ctx.beginPath();
        if (type === 'anneau') { ctx.moveTo(50, 50); ctx.arc(50, 50, 60, Math.PI / 3, Math.PI / 3 - a * Math.PI * 2, true); ctx.closePath(); }
        else if (type === 'foliole') ctx.rect(0, 46 - a * 42, 100, a * 42 + 2);
        else ctx.arc(50, 50, 6 * a, 0, 7);
        ctx.clip();
      }
      const o = type === 'foliole' ? K.or * 0.2 : K.or;
      ctx.globalAlpha *= 1 - 0.82 * K.verre;
      ctx.fillStyle = o > 0.5 ? or : jade; remplir(p);
      if (o > 0.001 && o < 0.999) { ctx.globalAlpha *= (o > 0.5 ? 1 - o : o); ctx.fillStyle = o > 0.5 ? jade : or; remplir(p); }
      ctx.restore(); ctx.save();
      if (a < 0.999) { ctx.beginPath(); if (type === 'anneau') { ctx.moveTo(50, 50); ctx.arc(50, 50, 60, Math.PI / 3, Math.PI / 3 - a * Math.PI * 2, true); ctx.closePath(); } else if (type === 'foliole') ctx.rect(0, 46 - a * 42, 100, a * 42 + 2); else ctx.arc(50, 50, 6 * a, 0, 7); ctx.clip(); }
      if (K.verre > 0.01) { // verre irisé : trois liserés décalés, comme une dispersion
        ctx.globalCompositeOperation = 'lighter';
        [['rgba(255,70,120,', -0.7], ['rgba(70,255,170,', 0], ['rgba(80,140,255,', 0.7]].forEach(([c, d]) => {
          ctx.save(); ctx.translate(d, -d * 0.5); ctx.strokeStyle = c + (0.55 * K.verre) + ')'; ctx.lineWidth = 0.9; trait(p); ctx.restore();
        });
        ctx.fillStyle = `rgba(${teinte[0] * 0.5 + 90},${teinte[1] * 0.5 + 100},${teinte[2] * 0.5 + 130},${0.12 * K.verre})`; remplir(p);
        if (K.givre > 0.01) { ctx.fillStyle = `rgba(230,240,255,${0.18 * K.givre * K.verre})`; remplir(p); }
        ctx.globalCompositeOperation = 'source-over';
      }
      ctx.strokeStyle = rgba(o > 0.5 ? [255, 214, 140] : seve, Math.min(1, 0.75 * (1 - 0.6 * K.verre) + eclat));
      ctx.lineWidth = 0.7 + eclat * 1.5; ctx.shadowColor = rgba(o > 0.5 ? [255, 190, 90] : seve, 0.9); ctx.shadowBlur = (6 + 20 * eclat) * dpr;
      trait(p);
      ctx.restore();
    });
  }
  function sceauContour(trace) {
    ctx.save(); ctx.lineWidth = 0.55;
    ctx.setLineDash([400 * trace, 400]);
    ctx.strokeStyle = 'rgba(80,90,100,0.45)'; ctx.translate(1.6, 1.2); formeSceau((p) => trait(p)); ctx.translate(-1.6, -1.2);
    ctx.strokeStyle = '#ffffff'; ctx.shadowColor = 'rgba(60,70,80,.5)'; ctx.shadowBlur = 2 * dpr; formeSceau((p) => trait(p));
    ctx.restore();
  }
  function feuilleKudzu(x, y, taille, rot) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(taille, taille);
    ctx.beginPath();
    for (const [a, L] of [[-Math.PI / 2, 1], [-Math.PI / 2 + 1.2, 0.8], [-Math.PI / 2 - 1.2, 0.8]]) {
      const ca = Math.cos(a), sa = Math.sin(a), px = -sa, py = ca;
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(ca * L * 0.25 + px * L * 0.42, sa * L * 0.25 + py * L * 0.42, ca * L * 0.8 + px * L * 0.3, sa * L * 0.8 + py * L * 0.3, ca * L, sa * L);
      ctx.bezierCurveTo(ca * L * 0.8 - px * L * 0.3, sa * L * 0.8 - py * L * 0.3, ca * L * 0.25 - px * L * 0.42, sa * L * 0.25 - py * L * 0.42, 0, 0);
    }
    ctx.restore();
  }
  function holo(x0, y0, x1, y1, t, n = 10) {
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    for (let i = 0; i <= n; i++) { const f = (i / n) * (n / 2) + t; const k = Math.floor(f) % 5, m = f - Math.floor(f); g.addColorStop(i / n, rgba(melC(HOLO[k], HOLO[(k + 1) % 5], m), 1)); }
    return g;
  }

  /* ------------------------------------------------------------ une image */
  function image(now) {
    if (enPause) return;
    raf = requestAnimationFrame(image);
    if (detruit || document.hidden) { dernier = now; return; }
    const dt = Math.min(0.05, dernier ? (now - dernier) / 1000 : 0.016); dernier = now; temps += dt;
    mesures.push(dt * 1000); if (mesures.length > 90) mesures.shift();
    if (tOuv < 6) tOuv += (dt / echelle) * accel;
    const t = tOuv;
    if (!titreDonne && t >= 2.55) { titreDonne = true; finir(); }
    sL = amortir(sL, sCible, reduit ? 7 : 10, dt);
    if (sDepart == null) sDepart = sCible;
    const s = sL, K = cles(s);
    const viv = lisse(2.55, 4.6, t), salle = lisse(2.45, 4.4, t);
    for (let i = 0; i < 3; i++) teinte[i] = amortir(teinte[i], K.teinte[i], 3, dt);
    const bal = borne((s - 2.6) / 0.7), liq = lisse(4.86, 5.18, s), nuitP = lisse(4.92, 5.12, s) * (1 - 0.55 * lisse(5.7, 6.4, s)) * (1 - lisse(6.7, 7.12, s));
    const clairP = bal * (1 - liq);
    const port = W < H;
    const carVisP = lisse(1.72, 2.08, s) * (1 - lisse(2.86, 3.02, s));
    const S = (port ? Math.min(W * 0.72, H * 0.4) : Math.min(H * 0.5, W * 0.42)) * mel(1, K.ech, viv) * (1 - 0.45 * nuitP) * (1 + 0.016 * Math.sin(temps * 0.9) * viv);
    const descenteY = s > 4 && s < 5.3 ? borne((s - 4) / 0.9) * S * 5.2 : 0;
    // dans « Qui fait votre site », le sceau se range à droite (en haut au téléphone) : le texte est au centre
    const cx = W / 2 + (port ? 0 : W * 0.33 * nuitP), cy = (port ? H * 0.4 - H * 0.3 * nuitP : H * 0.45) + K.y * S - descenteY;
    const amp = (reduit ? 0.5 : 1) * viv * (1 - clairP);
    const swY = Math.sin(temps * 0.23 * (reduit ? 0.6 : 1)) * 0.42 * amp + 0.3 * clairP;
    const swX = Math.sin(temps * 0.17 * (reduit ? 0.6 : 1) + 1) * 0.16 * amp - 0.15 * clairP;
    spin += dt * 0.07 * (reduit ? 0.6 : 1) * viv * (1 - clairP);
    pulse = Math.max(0, pulse - dt * 1.4);
    { const c1 = Math.cos(swX / 2), s1 = Math.sin(swX / 2), c2 = Math.cos(swY / 2), s2 = Math.sin(swY / 2), c3 = Math.cos(spin / 2), s3 = Math.sin(spin / 2);
      q.x = s1 * c2 * c3 + c1 * s2 * s3; q.y = c1 * s2 * c3 - s1 * c2 * s3; q.z = c1 * c2 * s3 + s1 * s2 * c3; q.w = c1 * c2 * c3 - s1 * s2 * s3; }
    const repere = (tour = true) => { ctx.translate(cx, cy); ctx.scale(Math.cos(swY) * S / 100, Math.cos(swX) * S / 100); if (tour) ctx.rotate(spin * (1 - clairP) + Math.round(spin / 2.0944) * 2.0944 * clairP); ctx.translate(-50, -50); };

    /* ---------------- le monde sombre */
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    ctx.fillStyle = '#040309'; ctx.fillRect(0, 0, W, H);
    const atel = 1 - 0.42 * nuitP;   // « Qui fait votre site » : la salle, apaisée
    if (salle > 0.001) {
      ctx.globalAlpha = salle * atel; ctx.drawImage(mur, 0, 0);
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * 0.7);
      g.addColorStop(0, rgba(teinte, 0.32)); g.addColorStop(1, rgba(teinte, 0.06));
      ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      const ip = Math.min(8, Math.max(0, Math.floor(s)));
      let im = MOT_PAR_PARTIE[ip]; if (ip === 1) im = 1 + Math.min(2, Math.floor(borne(s - 1) * 3));
      if (im >= 0 && MOTS[im]) {
        motDecal += dt * (reduit ? 18 : 45) * dpr;
        const fs = Math.round((port ? 0.2 : 0.3) * H);
        const fam = `${police ? '"KzGeante",' : ''}"Arial Black", Arial, sans-serif`;
        ctx.font = `800 ${fs}px ${fam}`;
        ctx.textBaseline = 'middle';
        const mot = MOTS[im] + '   ', lw = ctx.measureText(mot).width;
        ctx.fillStyle = ctx.createPattern(trame, 'repeat');
        ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = salle * (1 - nuitP) * 0.42;
        for (let x = -(motDecal % lw); x < W; x += lw) ctx.fillText(mot, x, H * 0.48);
        ctx.globalAlpha = salle * (1 - nuitP) * 0.1; ctx.font = `800 ${Math.round(fs * 0.5)}px ${fam}`;
        const lw2 = ctx.measureText('KAZURA   ').width;
        for (let x = ((motDecal * 0.6) % lw2) - lw2; x < W; x += lw2) { ctx.fillText('KAZURA   ', x, H * 0.82); ctx.fillText('KAZURA   ', W - x - lw2, H * 0.14); }
      }
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      // v14 : l'arc de lumière (un U de néon) derrière le mot, et son halo
      const dec = lisse(2.9, 4.9, t) * (1 - nuitP) * (1 - carVisP);
      if (dec > 0.01) {
        const rA = port ? W * 0.9 : H * 0.62, cyA = (port ? H * 0.62 : H * 0.66) - rA;
        ctx.globalCompositeOperation = 'lighter';
        for (const [lw, al] of [[18, 0.08], [6, 0.22], [1.6, 0.9]]) {
          ctx.beginPath(); ctx.arc(W / 2, cyA, rA, 0.08 * Math.PI, 0.92 * Math.PI);
          ctx.strokeStyle = `rgba(${al > 0.5 ? 200 : 110},${al > 0.5 ? 210 : 110},255,${al * dec})`; ctx.lineWidth = lw * dpr; ctx.stroke();
        }
        ctx.globalCompositeOperation = 'source-over';
        // feuilles de kudzu sur les côtés : silhouettes au liseré de lumière
        for (const f of feuillesH) {
          if (!port && f.c < 0 && f.a < 0.1) continue;
          const bx = port ? (0.5 + f.a * 0.5) * W : (f.c > 0 ? 0.5 + f.b * 0.5 : 0.5 - f.b * 0.5) * W;
          const by = port ? (f.c > 0 ? 1 - f.b * 0.25 : f.b * 0.25) * H : (0.5 - f.a * 0.5) * H;
          const sw = Math.sin(temps * 0.4 + f.p) * 0.08;
          feuilleKudzu(bx, by, f.s * Math.min(W, H) * (0.8 + f.z), f.r + sw);
          ctx.fillStyle = `rgba(4,18,13,${0.85 * dec})`; ctx.fill();
          ctx.strokeStyle = rgba(melC(teinte, [80, 220, 160], 0.4), 0.35 * dec); ctx.lineWidth = 1.2 * dpr; ctx.stroke();
        }
        // poussières qui montent
        ctx.globalCompositeOperation = 'lighter';
        for (const d of pous) {
          const y = (((d.y - temps * d.v * (reduit ? 0.5 : 1)) % 1) + 1) % 1;
          ctx.fillStyle = `rgba(215,205,255,${(0.25 + 0.35 * Math.sin(temps + d.p) ** 2) * dec})`;
          ctx.beginPath(); ctx.arc(d.x * W + Math.sin(temps * 0.2 + d.p) * 10 * dpr, y * H, d.r * dpr, 0, 7); ctx.fill();
        }
        ctx.globalCompositeOperation = 'source-over';
      }
    }
    { const g = ctx.createRadialGradient(W * 0.86, -H * 0.02, 0, W * 0.86, -H * 0.02, Math.max(W, H) * 0.6);
      g.addColorStop(0, `rgba(70,30,170,${0.35 * lisse(0.2, 2.6, t) * (1 - salle * 0.5)})`); g.addColorStop(1, 'rgba(70,30,170,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }

    // l'ouverture : construction, vrille, feuille, étincelle, onde
    if (t < 3.2) {
      ctx.save(); ctx.translate(cx, cy); ctx.scale(S / 100, S / 100); ctx.translate(-50, -50);
      const cons = lisse(0.3, 1.75, t), consF = lisse(0.25, 0.6, t) * (1 - lisse(1.9, 2.7, t));
      if (consF > 0.01) {
        ctx.strokeStyle = `rgba(217,204,255,${0.32 * consF})`; ctx.lineWidth = 0.25;
        for (const [r, d] of [[48, 0], [42, 0.08], [45, 0.25], [64, 0.35], [30, 0.45]]) { const p = borne(cons * 1.2 - d); if (p > 0) { ctx.beginPath(); ctx.arc(50, 50, r, Math.PI / 3, Math.PI / 3 - p * 6.283, true); ctx.stroke(); } }
        for (let i = 0; i < 3; i++) { const a = -Math.PI / 2 + i * 2.0944, p = borne(cons * 1.4 - 0.1 - i * 0.08) * 80; ctx.beginPath(); ctx.moveTo(50 - Math.cos(a) * p, 50 - Math.sin(a) * p); ctx.lineTo(50 + Math.cos(a) * p, 50 + Math.sin(a) * p); ctx.stroke(); }
        const pt = borne(cons * 1.3 - 0.2) * 120;
        ctx.beginPath(); ctx.moveTo(50 - pt, 2); ctx.lineTo(50 + pt, 2); ctx.moveTo(50 - pt, 98); ctx.lineTo(50 + pt, 98); ctx.moveTo(2, 50 - pt); ctx.lineTo(2, 50 + pt); ctx.moveTo(98, 50 - pt); ctx.lineTo(98, 50 + pt); ctx.stroke();
      }
      const tete = sortie3((t - 0.28) / 1.15) * (LV + 20), queue = es((t - 1.45) / 0.85) * (LV + 15);
      if (tete > 0 && queue < LV) {
        tracerPolyligne(vrille, queue, tete, lv);
        ctx.lineCap = 'round'; ctx.strokeStyle = '#8f6be0'; ctx.lineWidth = 5.4; ctx.shadowColor = 'rgba(168,85,247,.9)'; ctx.shadowBlur = 14 * dpr; ctx.stroke();
        ctx.strokeStyle = 'rgba(205,180,255,.85)'; ctx.lineWidth = 1.6; ctx.shadowBlur = 0; ctx.stroke();
        let i = 0; while (i < vrille.length - 1 && lv[i] < tete) i++;
        const ic = lisse(0.28, 0.4, t) * (1 - lisse(1.25, 1.6, t));
        if (ic > 0.01) { const g = ctx.createRadialGradient(vrille[i][0], vrille[i][1], 0, vrille[i][0], vrille[i][1], 9); g.addColorStop(0, `rgba(255,255,255,${ic})`); g.addColorStop(0.3, `rgba(190,140,255,${ic * 0.6})`); g.addColorStop(1, 'rgba(168,85,247,0)'); ctx.fillStyle = g; ctx.fillRect(vrille[i][0] - 9, vrille[i][1] - 9, 18, 18); }
      }
      const fe = lisse(0.75, 1.7, t), dis = lisse(1.82, 2.28, t);
      if (fe > 0.01 && dis < 1) {
        ctx.globalAlpha = 1 - dis;
        for (let i = 0; i < 3; i++) { ctx.save(); ctx.translate(50, 50); ctx.rotate(-Math.PI / 2 + i * 2.0944); ctx.scale(fe * (1 - 0.3 * lisse(1.6, 2.1, t)), fe);
          const g = ctx.createLinearGradient(0, 0, 40, 0); g.addColorStop(0, '#0b5a3c'); g.addColorStop(1, '#1f9d6b');
          ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(2, 0); ctx.bezierCurveTo(12, -16, 34, -12, 40, 0); ctx.bezierCurveTo(34, 12, 12, 16, 2, 0); ctx.fill();
          ctx.strokeStyle = 'rgba(120,230,170,.5)'; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(2, 0); ctx.lineTo(38, 0); ctx.stroke(); ctx.restore(); }
        ctx.globalAlpha = 1;
      }
      const et = lisse(0, 0.25, t) * (1 - lisse(0.5, 1.0, t)) + Math.exp(-Math.pow((t - 2.32) / 0.15, 2)) * (reduit ? 0.3 : 0.6);
      if (et > 0.01) { const g = ctx.createRadialGradient(50, 50, 0, 50, 50, 26); g.addColorStop(0, `rgba(255,255,255,${et})`); g.addColorStop(0.15, `rgba(200,160,255,${et * 0.7})`); g.addColorStop(1, 'rgba(168,85,247,0)'); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.fillRect(0, 0, 100, 100); ctx.globalCompositeOperation = 'source-over'; }
      const on = borne((t - 2.24) / 0.7);
      if (on > 0 && on < 1) { ctx.strokeStyle = `rgba(168,85,247,${Math.pow(1 - on, 3) * (reduit ? 0.5 : 0.9)})`; ctx.lineWidth = 2 + 6 * on; ctx.shadowColor = 'rgba(168,85,247,.8)'; ctx.shadowBlur = 20 * dpr; ctx.beginPath(); ctx.arc(50, 50, 48 * (1 + sortie3(on) * 2.2), 0, 7); ctx.stroke(); ctx.shadowBlur = 0; }
      ctx.restore();
    }

    // le sceau (monde sombre)
    if (mel(1, K.ech, viv) > 0.02) {
      const app = { anneau: borne((es((t - 1.45) / 0.85) * (LV + 15) - LJET) / (LV - LJET) + 0.05), folioles: sortie3((t - 1.7) / 0.55), coeur: sortie3((t - 1.92) / 0.32) };
      ctx.save(); ctx.globalAlpha = 1 - 0.25 * nuitP;
      const ga = ctx.createRadialGradient(cx, cy, 0, cx, cy, S * 0.9);
      ga.addColorStop(0, rgba(K.seve, 0.18 * lisse(1.9, 2.6, t))); ga.addColorStop(1, rgba(K.seve, 0));
      ctx.fillStyle = ga; ctx.fillRect(cx - S, cy - S, 2 * S, 2 * S);
      repere();
      const eclat = Math.exp(-Math.pow((t - 2.32) / 0.15, 2)) * (reduit ? 0.45 : 1) + pulse * 0.4;
      // épaisseur : une couche arrière décalée et sombre
      if (viv > 0.05) { ctx.save(); ctx.translate(Math.sin(swY) * 4 * viv, -Math.sin(swX) * 4 * viv); ctx.globalAlpha *= 0.5; sceauPeau({ ...K, verre: Math.max(K.verre, 0.6) }, app, [40, 20, 80], 0); ctx.restore(); }
      sceauPeau(K, app, K.seve, eclat);
      const cibleV = t < 2.6 ? lisse(1.75, 3, t) * 0.4 : K.vrilles * (1 - clairP);
      croiss = cibleV > croiss ? Math.min(cibleV, croiss + dt * (reduit ? 0.25 : 0.4)) : Math.max(cibleV, croiss - dt * 1.5);
      ctx.lineCap = 'round';
      for (const v of vrilles) {
        const g = borne((croiss - v.retard * 0.3) / 0.6);
        if (g <= 0.01) continue;
        const n = Math.floor(v.pts.length * g);
        for (let k = 0; k < 3; k++) {
          const a = Math.floor(n * k / 3), b = Math.min(n, Math.floor(n * (k + 1) / 3) + 1);
          if (b - a < 2) continue;
          ctx.beginPath(); ctx.moveTo(v.pts[a][0], v.pts[a][1]); for (let i = a + 1; i < b; i++) ctx.lineTo(v.pts[i][0], v.pts[i][1]);
          ctx.strokeStyle = k === 2 ? 'rgba(170,150,255,.85)' : 'rgba(40,170,120,.95)'; ctx.lineWidth = 1.6 - k * 0.45; ctx.stroke();
        }
      }
      ctx.restore();
    }
    const ess = K.essaim * lisse(2.2, 3.6, t) * (1 - clairP);
    if (ess > 0.01) {
      ctx.globalCompositeOperation = 'lighter';
      for (const l of essaim) {
        const a = l.a + temps * l.v * (reduit ? 0.5 : 1) * 60 / l.r;
        const x = cx + Math.cos(a) * l.r * S / 100, y = cy + (Math.sin(a) * 0.92 + l.y) * l.r * S / 100;
        const sc = Math.pow(0.5 + 0.5 * Math.sin(temps * (1.2 + l.t * 2.5) + l.t * 40), 3);
        ctx.fillStyle = rgba(melC(K.seve, [255, 255, 255], 0.35), ess * (0.2 + 0.8 * sc) * 0.9);
        ctx.beginPath(); ctx.arc(x, y, (1 + 1.6 * l.t) * dpr, 0, 7); ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
    }

    /* ---------------- le carrousel (DOM) */
    // v17 : au téléphone avec le carrousel DOM de la page (telephoneDom), l'anneau CSS s'efface ; la teinte suit le site actif
    const telCache = telDom && W < H && W / dpr < 768;
    const carAmb = lisse(1.72, 2.08, s) * (1 - lisse(2.78, 2.96, s));
    const carVis = carAmb * (telCache ? 0 : 1);
    carVisR = carVis;
    if (telCache && carAmb > 0.005 && sites.length) { const cs = sites[actif]; if (cs && cs.couleur) { const h = parseInt(String(cs.couleur).replace('#', ''), 16); if (!Number.isNaN(h)) { const cc = hex(h); for (let i = 0; i < 3; i++) teinte[i] = mel(teinte[i], cc[i], carAmb * 0.08); } } }
    car.style.opacity = String(carVis.toFixed(3));
    car.style.visibility = carVis > 0.005 ? 'visible' : 'hidden';
    if (carVis > 0.005 && panneaux.length) {
      // v16 : la petite rotation d'invitation, une fois, au premier passage
      if (invit < 0 && carVis > 0.85 && panneaux.length > 1) invit = 0;
      if (invit >= 0 && invit < 1) { invit = Math.min(1, invit + dt / (reduit ? 3.4 : 2.4)); decalI = Math.pow(Math.sin(Math.PI * invit), 1.5) * (reduit ? 0.14 : 0.3); }
      else decalI = 0;
      angle = amortir(angle, angleCible + glisse + decalI, reduit ? 4 : 6, dt);
      anneauCar.style.transform = `translateZ(${-rayonCar}px) rotateY(${-angle * pasCar}rad)`;
      const n = panneaux.length;
      panneaux.forEach((p, i) => {
        let d = i - angle; d -= Math.round(d / n) * n;
        p.style.transform = `rotateY(${(angle + d) * pasCar}rad) translateZ(${rayonCar}px)`;
        const fin = Math.min(1.6, n / 2 - 0.05), ad = Math.abs(d);
        // v16 : les voisins restent bien visibles (ils invitent au clic)
        p.style.opacity = String(((1 - Math.min(0.4, ad * 0.3)) * (1 - lisse(fin - 0.4, fin, ad))).toFixed(3));
        p.style.filter = `brightness(${(1 - Math.min(0.45, Math.abs(d) * 0.4)).toFixed(2)}) saturate(${(1 - Math.min(0.3, ad * 0.3)).toFixed(2)})`;
        p.style.setProperty('--kz-a', `${((temps * 40 + i * 60) % 360).toFixed(1)}deg`);
      });
      const c = sites[((Math.round(angle) % n) + n) % n];
      if (c && c.couleur) { const h = parseInt(String(c.couleur).replace('#', ''), 16); if (!Number.isNaN(h)) { const cc = hex(h); for (let i = 0; i < 3; i++) teinte[i] = mel(teinte[i], cc[i], carVis * 0.08); } }
    }

    /* ---------------- le passage au clair par tranches (AFTERDEPTH), puis le monde clair */
    if (bal > 0.001 && liq < 0.999) {
      const N = Math.max(4, Math.round((W / H) * 4.5));
      const h1 = (b, k) => ((Math.sin(b * 12.9898 + k) * 43758.5453) % 1 + 1) % 1;
      const zone = (b, thr) => {   // la part de la bande b déjà passée à l'état thr (0 gris, 1,2 violet, 3 clair) : [y0, y1] en pixels
        if (thr >= 3) { const v = borne(((bal - 0.66) / 0.34 - h1(b, 9.7) * 0.5) / 0.32); return [0, v * H]; }
        const v = borne((bal * 2.5 - h1(b, 4.1) * 0.45 - (thr > 0 ? 0.1 : 0)) / 0.3);
        return b % 2 === 0 ? [0, v * H] : [(1 - v) * H, H];
      };
      const bande = (b) => [Math.floor(b * W / N), Math.ceil((b + 1) * W / N)];
      if (bal < 0.999) {
        ctx.save();
        for (let b = 0; b < N; b++) {
          const [x0, x1] = bande(b);
          const [g0, g1] = zone(b, 0), [c0, c1] = zone(b, 1.2);
          if (g1 > g0) { ctx.globalCompositeOperation = 'saturation'; ctx.fillStyle = '#808080'; ctx.fillRect(x0, g0, x1 - x0, g1 - g0);
            ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = 'rgba(60,60,60,.5)'; ctx.fillRect(x0, g0, x1 - x0, g1 - g0); }
          if (c1 > c0) { const gr = ctx.createLinearGradient(0, H, 0, 0); gr.addColorStop(0, '#2b16b8'); gr.addColorStop(0.5, '#8b2cf5'); gr.addColorStop(1, '#e044c8');
            ctx.globalCompositeOperation = 'color'; ctx.fillStyle = gr; ctx.fillRect(x0, c0, x1 - x0, c1 - c0); }
        }
        ctx.restore();
      }
      ctx.save();
      ctx.beginPath();
      for (let b = 0; b < N; b++) { const [x0, x1] = bande(b), [y0, y1] = zone(b, 3); if (y1 > y0) ctx.rect(x0, y0, x1 - x0, y1 - y0); }
      ctx.clip();
      // v17 : le violet (« Osez rêver »), puis LA FEUILLE de porcelaine qui se lève et remplit l'écran (le déroulé)
      const vg = borne((s - DEBUT_VAGUE) / DUREE_VAGUE);
      const asp = W / H, doux = reduit ? 1 : 0;
      if (vg < 1) {
        ctx.drawImage(violetC, 0, 0);
        const gx = W * (port ? 0.55 : 0.82 + 0.03 * Math.sin(temps * 0.13 * (reduit ? 0.5 : 1))), gy = H * (port ? 0.9 : 0.85), gr = ctx.createRadialGradient(gx, gy, 0, gx, gy, Math.max(W, H) * 0.45);
        gr.addColorStop(0, 'rgba(236,72,180,.42)'); gr.addColorStop(1, 'rgba(236,72,180,0)'); ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
        // les feuilles de verre, seulement dans le violet (la feuille de porcelaine passe devant)
        for (let k = 0; k < (port ? 3 : 5); k++) {
          const fx = port ? (k % 2 ? 0.86 : 0.14) : [0.78, 0.9, 0.12, 0.66, 0.95][k], fy = [0.25, 0.7, 0.8, 0.9, 0.42][k] + Math.sin(temps * 0.2 + k) * 0.01;
          const ta = Math.min(W, H) * (port ? 0.16 : 0.13) * (1 + (k % 3) * 0.25);
          feuilleKudzu(fx * W, fy * H, ta, k * 1.7 + temps * 0.03);
          ctx.fillStyle = ['rgba(240,171,252,.22)', 'rgba(196,181,253,.22)', 'rgba(249,168,212,.22)'][k % 3]; ctx.fill();
          ctx.strokeStyle = 'rgba(230,210,255,.5)'; ctx.lineWidth = 1 * dpr; ctx.stroke();
        }
      }
      if (vg > 0) {
        const co = vg >= 1 ? [[0, 1.2], [1, 1.2], [1, -0.2], [0, -0.2]] : coinsFeuille(vg, asp, doux);   // bas gauche, bas droit, haut droit, haut gauche
        const pts = co.map(([u, v]) => [u * W, v * H]);
        ctx.save();
        if (vg < 1) {
          // l'ombre douce portée sur le violet, puis la tranche (l'épaisseur de la porcelaine)
          const inc = poseFeuille(vg, doux).A / 1.42;
          ctx.save(); ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath();
          ctx.shadowColor = 'rgba(20,6,50,.55)'; ctx.shadowBlur = (30 + 40 * inc) * dpr; ctx.shadowOffsetX = 10 * dpr * (0.4 + inc); ctx.shadowOffsetY = 28 * dpr * (0.4 + inc);
          ctx.fillStyle = '#eef2f4'; ctx.fill(); ctx.restore();
          const dos = coinsFeuille(vg, asp, doux, 0.014).map(([u, v]) => [u * W, v * H]);
          ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); ctx.lineTo(pts[1][0], pts[1][1]); ctx.lineTo(dos[1][0], dos[1][1]); ctx.lineTo(dos[0][0], dos[0][1]); ctx.closePath();
          ctx.fillStyle = '#c9c8db'; ctx.fill();
        }
        ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath();
        ctx.save(); ctx.clip();
        ctx.drawImage(croix, 0, 0);
        if (vg < 1) {
          // en lumière rasante, la porcelaine reflète un peu de lavande ; le haut accroche la lumière
          const inc = poseFeuille(vg, doux).A / 1.42;
          const gy0 = Math.min(pts[2][1], pts[3][1]), gy1 = Math.max(pts[0][1], pts[1][1]);
          const gl = ctx.createLinearGradient(0, gy0, 0, gy1);
          gl.addColorStop(0, `rgba(255,255,255,${(0.6 * inc).toFixed(3)})`); gl.addColorStop(0.3, 'rgba(255,255,255,0)'); gl.addColorStop(1, `rgba(150,140,200,${(0.22 * inc).toFixed(3)})`);
          ctx.fillStyle = gl; ctx.fillRect(0, 0, W, H);
        }
        dessinRepli(s);
        ctx.restore();
        if (vg < 1) {
          // l'arête : une frange irisée fine et un fil de lumière net
          ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); ctx.lineTo(pts[3][0], pts[3][1]); ctx.lineTo(pts[2][0], pts[2][1]); ctx.lineTo(pts[1][0], pts[1][1]);
          ctx.lineJoin = 'round';
          ctx.strokeStyle = holo(0, 0, W, 0, temps * 0.1, 10); ctx.globalAlpha = 0.55; ctx.lineWidth = 4 * dpr; ctx.stroke();
          ctx.globalAlpha = 1; ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 1.4 * dpr; ctx.stroke();
        }
        ctx.restore();
      }
      ctx.save(); repere(false); sceauContour(lisse(3.0, 3.45, s) * (vg > 0 ? 0 : 1));
      const head = lisse(3.02, 3.5, s), desc = borne((s - 4) / 0.9) * (s < 5.3 ? 1 : 0);
      ctx.lineCap = 'butt'; ctx.lineJoin = 'round';
      const nArc = Math.floor(arc.length * head), nDesc = Math.floor(descente.length * desc);
      // v17 : sur la feuille, l'arc posé sur l'anneau n'existe plus (le ruban naît à la sortie de l'anneau) ; au
      // téléphone, pas de ruban sur la feuille (les textes y prennent toute la largeur)
      const surFeuille = vg > 0.3;
      if (nArc > 1 && !(surFeuille && (port || nDesc < 2))) {
        ctx.beginPath(); ctx.moveTo(surFeuille ? descente[0][0] : arc[0][0], surFeuille ? descente[0][1] : arc[0][1]);
        if (!surFeuille) for (let i = 1; i < nArc; i++) ctx.lineTo(arc[i][0], arc[i][1]);
        for (let i = 0; i < nDesc; i++) ctx.lineTo(descente[i][0], descente[i][1]);
        ctx.strokeStyle = holo(10, -10, 40, 690, temps * 0.35, 60); ctx.lineWidth = 9.5; ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1.2; ctx.stroke();
        for (let j = 1; j <= 6; j++) { const i = j * 95; if (i < nDesc) { const [x, y] = descente[i]; ctx.fillStyle = '#12a876'; for (let f = 0; f < 3; f++) { ctx.save(); ctx.translate(x, y); ctx.rotate(-0.4 + f * 2.09 + j); ctx.beginPath(); ctx.moveTo(1, 0); ctx.quadraticCurveTo(6, -5.5, 13, 0); ctx.quadraticCurveTo(6, 5.5, 1, 0); ctx.fill(); ctx.strokeStyle = 'rgba(160,240,200,.6)'; ctx.lineWidth = 0.4; ctx.beginPath(); ctx.moveTo(1, 0); ctx.lineTo(12, 0); ctx.stroke(); ctx.restore(); } } }
      }
      ctx.restore();
      ctx.restore();
      // les coutures des tranches
      if (bal < 0.999) {
        for (let b = 0; b < N; b++) {
          const [x0, x1] = bande(b);
          for (const [thr, c] of [[0, 'rgba(235,240,255,.8)'], [1.2, 'rgba(255,120,220,.85)'], [3, 'rgba(255,255,255,.95)']]) {
            const [y0, y1] = zone(b, thr); const y = b % 2 === 0 ? y1 : y0;
            if (y1 - y0 > 0.5 && y1 - y0 < H - 0.5) { ctx.fillStyle = c; ctx.fillRect(x0, y - dpr, x1 - x0, 2 * dpr); }
          }
        }
      }
    }

    /* ---------------- la marée : la salle revient, rive irisée */
    if (liq > 0.001 && liq < 0.999 && bal > 0) {
      const front = H * (1 - mel(-0.3, 1.3, liq));
      const yl = (x) => front + H * (0.05 * Math.sin((x / W) * 5 * (W / H) + temps * 1.3) + 0.03 * Math.sin((x / W) * 11 * (W / H) - temps * 1.9));
      const enMaree = liq < 0.999 && bal > 0;
      ctx.save();
      if (enMaree) { ctx.beginPath(); ctx.moveTo(0, H + 10); for (let x = 0; x <= W + 1; x += W / 60) ctx.lineTo(x, yl(x)); ctx.lineTo(W, H + 10); ctx.closePath(); ctx.clip(); }
      // sous la marée : la salle, apaisée (le reste de l'atelier est peint plus haut, avec le monde sombre)
      if (enMaree) { ctx.globalAlpha = 1; ctx.fillStyle = '#040309'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 0.58; ctx.drawImage(mur, 0, 0); }
      ctx.restore();
      if (enMaree && liq > 0) {
        ctx.beginPath(); for (let x = 0; x <= W + 1; x += W / 60) x ? ctx.lineTo(x, yl(x)) : ctx.moveTo(x, yl(x));
        // v17 : la rive est un fil de lumière net et une frange irisée fine (plus de bandeau arc-en-ciel)
        ctx.globalAlpha = 0.6; ctx.strokeStyle = holo(0, 0, W, 0, temps * 0.2); ctx.lineWidth = 4 * dpr; ctx.stroke(); ctx.globalAlpha = 1;
        ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 1.3 * dpr; ctx.stroke();
      }
    }
    const gv = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
    gv.addColorStop(0, 'rgba(0,0,0,0)'); gv.addColorStop(1, `rgba(0,0,0,${0.35 * (1 - 0.6 * clairP)})`);
    ctx.fillStyle = gv; ctx.fillRect(0, 0, W, H);
  }

  // seul un geste du visiteur accélère l'ouverture (jamais une minuterie)
  function accelerer() { if (tOuv < 3) accel = 4; }
  function passer() { if (performance.now() - dernierGeste < 1500) accelerer(); }
  const surGeste = (e) => {
    dernierGeste = performance.now();
    if (tOuv < 3) { accelerer(); return; }
  };
  window.addEventListener('pointerdown', surGeste, { passive: true });
  window.addEventListener('pointerdown', surBas, { passive: true });
  window.addEventListener('click', surClic);
  window.addEventListener('keydown', surGeste);
  window.addEventListener('wheel', surGeste, { passive: true });
  window.addEventListener('touchstart', surGeste, { passive: true });
  const ro = new ResizeObserver(() => dimensionner());
  ro.observe(div);
  dimensionner();
  raf = requestAnimationFrame(image);

  const api = {
    pret: Promise.resolve(),
    ouvertureFinie,
    repli: true,
    realisations: {
      definir(liste, opts = {}) {
        if (opts && opts.telephoneDom != null) telDom = !!opts.telephoneDom;
        let l = (liste || []).filter((x) => x && (x.image || (x.images && x.images.length)));
        if (l.length > 6) { const ch = Array.isArray(opts && opts.selection) ? l.filter((x) => opts.selection.includes(x.id)) : l.filter((x) => x.selection === true); l = (ch.length ? ch : l).slice(0, 6); }
        sites = l.map((x) => ({ id: x.id, image: x.image || x.images[0], couleur: x.couleur }));
        actif = Math.min(actif, Math.max(0, sites.length - 1)); angleCible = actif; construireCarrousel();
      },
      cadrer() {},
      relacher() { const n = sites.length; if (!n) return; const k = Math.round(angleCible + glisse); glisse = 0; angleCible = k; const j = ((k % n) + n) % n; if (j !== actif) { actif = j; for (const f of ecouteurs) { try { f(j, sites[j]); } catch {} } } },
      get ids() { return sites.map((x) => x.id); },
      aller(i) {
        if (!sites.length) return; const n = sites.length, j = ((Math.round(i) % n) + n) % n;
        glisse = 0; let c = j; while (c - angleCible > n / 2) c -= n; while (angleCible - c > n / 2) c += n; angleCible = c;
        if (j !== actif) { actif = j; for (const f of ecouteurs) { try { f(j, sites[j]); } catch {} } }
      },
      glisser(dx) { glisse = -(Number(dx) || 0) / Math.max(200, (W / dpr) * 0.6); },
      surChangement(fn) { if (typeof fn === 'function') ecouteurs.push(fn); return () => { const k = ecouteurs.indexOf(fn); if (k >= 0) ecouteurs.splice(k, 1); }; },
      surClicPanneau(fn) { if (typeof fn === 'function') ecoutesClic.push(fn); return () => { const k = ecoutesClic.indexOf(fn); if (k >= 0) ecoutesClic.splice(k, 1); }; },
      panneauEn(x, y) { return panneauEn(borne(Number(x) || 0), borne(Number(y) || 0)); },
      choisirEn(x, y) { return panneauEn(borne(Number(x) || 0), borne(Number(y) || 0)); },
      get actif() { return actif; },
      get anneauCache() { return telDom && W < H && W / dpr < 768; },
    },
    progression(p, sectionId, locale) {
      const i = SECTIONS.indexOf(sectionId);
      const l = locale == null || Number.isNaN(Number(locale)) ? 0.5 : borne(Number(locale));
      sCible = i >= 0 ? i + l : borne(Number(p) || 0) * 9;
      if (i >= 0) section = sectionId;
      if (sDepart == null) { sDepart = sCible; if (sCible >= 0.6) accelerer(); }
      else if (Math.abs(sCible - sDepart) > 0.08) { dernierGeste = performance.now(); accelerer(); }
    },
    passer,
    clairEn(x, y) { return clairPt(sL, borne(Number(x) || 0), 1 - borne(Number(y) || 0)); },
    pause() { if (enPause || detruit) return; enPause = true; cancelAnimationFrame(raf); },
    reprendre() { if (!enPause || detruit) return; enPause = false; dernier = 0; raf = requestAnimationFrame(image); },
    get enPause() { return enPause; },
    etat() {
      const moy = mesures.length ? mesures.reduce((a, b) => a + b, 0) / mesures.length : 0;
      return { quaternion: [q.x, q.y, q.z, q.w], section, clair: Math.round(partClaire(sL) * 1000) / 1000, fps: moy ? Math.round(1000 / moy) : 0 };
    },
    voile() {},
    stats() { const moy = mesures.length ? mesures.reduce((a, b) => a + b, 0) / mesures.length : 0; return { repli: true, ips: moy ? Math.round(1000 / moy) : 0, s: Math.round(sL * 100) / 100, section, dpr }; },
    _sauter() { sL = sCible; },
    detruire() {
      detruit = true; cancelAnimationFrame(raf); ro.disconnect();
      window.removeEventListener('pointerdown', surGeste); window.removeEventListener('keydown', surGeste);
      window.removeEventListener('wheel', surGeste); window.removeEventListener('touchstart', surGeste);
      window.removeEventListener('pointerdown', surBas); window.removeEventListener('click', surClic);
      div.remove(); if (canvas) canvas.style.display = ''; finir();
    },
  };
  return api;
}
