/* Kazura v13, la Scène : le repli sans WebGL.
   Le même récit, en 2D (un canevas 2D, quelques éléments DOM et CSS), pour les navigateurs qui ne
   donnent pas WebGL (navigateurs intégrés à une appli, réglages d'économie, vieux téléphones) :
   - l'ouverture : étincelle, traits de construction, la vrille qui trace l'anneau, la feuille trifoliée,
     puis le sceau qui se matérialise, éclat et onde ;
   - le sceau au centre, qui respire, se balance (fausse perspective) et change de peau : jade, verre
     irisé, givre, or et jade ; des vrilles poussent autour, des lucioles tournent ;
   - la salle de dalles et le mot géant qui défile, tramé de points de lumière ;
   - le carrousel des réalisations : les captures posées en arc, en perspective CSS ;
   - l'horizon courbe blanc, le monde clair à croix, le contour fin, le ruban holographique et son chemin ;
   - la marée liquide irisée, la nuit indigo peinte et l'étoile dorée ; le final or et jade.
   Même interface que la scène 3D. */
import { chargerPolice } from './typo.js';

const SECTIONS = ['ouverture', 'promesse', 'experiences', 'realisations', 'rever', 'deroule', 'matheo', 'questions', 'contact'];
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
  { teinte: 0x0f9f8f, verre: 1, givre: 1, or: 0, ech: 0.92, y: 0, vrilles: 0.5, essaim: 0.7, seve: 0x8b5cf6 },
  { teinte: 0x8b5cf6, verre: 1, givre: 0.3, or: 0, ech: 0.5, y: -0.55, vrilles: 0.3, essaim: 0.4, seve: 0xa855f7 },
  { teinte: 0x8b5cf6, verre: 0, givre: 0, or: 0, ech: 1.0, y: 0, vrilles: 0, essaim: 0, seve: 0xa855f7 },
  { teinte: 0x8b5cf6, verre: 0, givre: 0, or: 0, ech: 1.0, y: 0, vrilles: 0, essaim: 0, seve: 0xa855f7 },
  { teinte: 0x3730a3, verre: 0, givre: 0, or: 0.5, ech: 0.0, y: 0, vrilles: 0, essaim: 0.6, seve: 0xfbbf24 },
  { teinte: 0x4338ca, verre: 1, givre: 0.6, or: 0, ech: 0.92, y: 0, vrilles: 0.5, essaim: 0.7, seve: 0xa855f7 },
  { teinte: 0xb7832f, verre: 0, givre: 0, or: 1, ech: 1.04, y: 0, vrilles: 1, essaim: 1, seve: 0xf2c87a },
].map((c) => ({ ...c, teinte: hex(c.teinte), seve: hex(c.seve) }));
const MOT_PAR_PARTIE = [0, 1, 4, 5, -1, -1, -1, 8, 9];

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

export function repli(canvas, { reduit = false, mobile = false } = {}) {
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
  const essaim = Array.from({ length: mobile ? 60 : 110 }, () => ({ r: 54 + Math.pow(alea(), 1.5) * 50, a: alea() * 6.283, v: 0.1 + alea() * 0.25, t: alea(), y: (alea() - 0.5) * 0.4 }));

  /* ------------------------------------------------------------ calques précalculés (au redimensionnement) */
  let W = 1, H = 1, dpr = 1, mur = null, croix = null, nuit = null, trame = null;
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
    // le monde clair : grille fine et croix
    croix = calque(W, H); const c = croix.getContext('2d');
    const g = c.createRadialGradient(W / 2, H * 0.55, 0, W / 2, H * 0.55, Math.max(W, H) * 0.75);
    g.addColorStop(0, '#e9eef0'); g.addColorStop(1, '#cfd6da');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    const pas = 26 * dpr; c.strokeStyle = 'rgba(40,50,60,0.05)'; c.lineWidth = 1;
    for (let x = (W / 2) % pas; x < W; x += pas) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke(); }
    for (let y = (H / 2) % pas; y < H; y += pas) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
    c.strokeStyle = 'rgba(70,78,88,0.75)'; c.lineWidth = Math.max(1, dpr);
    const gp = pas * 7, d = 8 * dpr;
    for (let x = (W / 2) % gp; x < W; x += gp) for (let y = (H / 2) % gp; y < H; y += gp) { c.beginPath(); c.moveTo(x - d, y); c.lineTo(x + d, y); c.moveTo(x, y - d); c.lineTo(x, y + d); c.stroke(); }
    // la nuit peinte : des coups de pinceau qui suivent les courants de quelques tourbillons
    nuit = calque(W, H); const n = nuit.getContext('2d');
    n.fillStyle = '#07051a'; n.fillRect(0, 0, W, H);
    const rn = hasard(31), U = Math.min(W, H);
    const tourb = [[0.68, 0.42, 0.16, 1], [0.18, 0.3, 0.1, -1], [0.42, 0.82, 0.12, 1], [0.85, 0.84, 0.1, -1], [0.08, 0.75, 0.08, 1]];
    const psi = (x, y) => { let p = (y / H) * 0.85; for (const [tx, ty, f, sg] of tourb) p += sg * f * 0.6 * Math.log(Math.hypot((x - tx * W) / U, (y - ty * H) / U) + 0.04); return p; };
    const PAL = ['#14146a', '#23308f', '#3a47b8', '#6a62d6', '#4f9fc4', '#b7a8f5'];
    const nb = mobile ? 700 : 1300;
    n.lineCap = 'round';
    for (let i = 0; i < nb; i++) {
      let x = rn() * W, y = rn() * H;
      n.beginPath(); n.moveTo(x, y);
      const long = 10 + rn() * 26;
      for (let k = 0; k < long; k++) {
        const e = 1.5, gx = (psi(x + e, y) - psi(x - e, y)) / (2 * e), gy = (psi(x, y + e) - psi(x, y - e)) / (2 * e);
        const l = Math.hypot(gx, gy) || 1;
        x += (gy / l) * 3 * dpr; y += (-gx / l) * 3 * dpr; n.lineTo(x, y);
      }
      const h = rn();
      n.strokeStyle = PAL[Math.min(PAL.length - 1, Math.floor(Math.pow(h, 1.6) * PAL.length))];
      n.globalAlpha = 0.35 + rn() * 0.45; n.lineWidth = (1.5 + rn() * 3.5) * dpr; n.stroke();
    }
    n.globalAlpha = 1;
    for (let i = 0; i < 70; i++) { n.fillStyle = rn() < 0.8 ? 'rgba(255,225,140,.85)' : 'rgba(120,230,240,.85)'; n.beginPath(); n.arc(rn() * W, rn() * H, (0.8 + rn() * 1.8) * dpr, 0, 7); n.fill(); }
  }
  function dimensionner() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    W = Math.round((div.clientWidth || innerWidth) * dpr); H = Math.round((div.clientHeight || innerHeight) * dpr);
    cv.width = W; cv.height = H;
    preparer();
    placerCarrousel();
  }

  /* ------------------------------------------------------------ carrousel en CSS */
  let sites = [], panneaux = [], actif = 0, angle = 0, angleCible = 0, glisse = 0, rayonCar = 400;
  const ecouteurs = [];
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
  const echelle = reduit ? 1.35 : 1;
  let tOuv = 0, accel = 1, temps = 0, dernier = 0, raf = 0, detruit = false, enPause = false;
  let sCible = 0, sL = 0, section = 'ouverture', croiss = 0, spin = 0, motDecal = 0, pulse = 0;
  let finir; const ouvertureFinie = new Promise((r) => { finir = r; });
  let titreDonne = false, etoileEcran = null;
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
    sL = amortir(sL, sCible, reduit ? 2.2 : 3.4, dt);
    const s = sL, K = cles(s);
    const viv = lisse(2.55, 4.6, t), salle = lisse(2.45, 4.4, t);
    for (let i = 0; i < 3; i++) teinte[i] = amortir(teinte[i], K.teinte[i], 3, dt);
    const bal = lisse(3.82, 4.14, s), liq = lisse(5.86, 6.18, s), nuitP = lisse(5.92, 6.12, s) * (1 - lisse(6.78, 7.12, s));
    const clairP = bal * (1 - liq);
    const port = W < H;
    const S = (port ? Math.min(W * 0.72, H * 0.4) : Math.min(H * 0.5, W * 0.42)) * mel(1, K.ech, viv) * (1 + 0.016 * Math.sin(temps * 0.9) * viv);
    const descenteY = s > 5 && s < 6.3 ? borne((s - 5) / 0.9) * S * 5.2 : 0;
    const cx = W / 2, cy = (port ? H * 0.4 : H * 0.45) + K.y * S - descenteY;
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
    if (salle > 0.001 && nuitP < 0.999) {
      ctx.globalAlpha = salle * (1 - nuitP); ctx.drawImage(mur, 0, 0);
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
    if (mel(1, K.ech, viv) > 0.02 && nuitP < 0.98) {
      const app = { anneau: borne((es((t - 1.45) / 0.85) * (LV + 15) - LJET) / (LV - LJET) + 0.05), folioles: sortie3((t - 1.7) / 0.55), coeur: sortie3((t - 1.92) / 0.32) };
      ctx.save(); ctx.globalAlpha = 1 - nuitP;
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
    const carVis = lisse(2.72, 3.08, s) * (1 - lisse(3.78, 3.96, s));
    car.style.opacity = String(carVis.toFixed(3));
    car.style.visibility = carVis > 0.005 ? 'visible' : 'hidden';
    if (carVis > 0.005 && panneaux.length) {
      angle = amortir(angle, angleCible + glisse, reduit ? 4 : 6, dt);
      anneauCar.style.transform = `translateZ(${-rayonCar}px) rotateY(${-angle * pasCar}rad)`;
      const n = panneaux.length;
      panneaux.forEach((p, i) => {
        let d = i - angle; d -= Math.round(d / n) * n;
        p.style.transform = `rotateY(${(angle + d) * pasCar}rad) translateZ(${rayonCar}px)`;
        p.style.opacity = String(Math.abs(d) < 1.6 ? 1 - Math.min(0.75, Math.abs(d) * 0.55) : 0);
        p.style.filter = `brightness(${(1 - Math.min(0.6, Math.abs(d) * 0.45)).toFixed(2)})`;
        p.style.setProperty('--kz-a', `${((temps * 40 + i * 60) % 360).toFixed(1)}deg`);
      });
      const c = sites[((Math.round(angle) % n) + n) % n];
      if (c && c.couleur) { const h = parseInt(String(c.couleur).replace('#', ''), 16); if (!Number.isNaN(h)) { const cc = hex(h); for (let i = 0; i < 3; i++) teinte[i] = mel(teinte[i], cc[i], carVis * 0.08); } }
    }

    /* ---------------- le monde clair, sous l'horizon */
    if (bal > 0.001 && liq < 0.999) {
      const c = mel(-0.42, 1.42, bal), k = mel(0.38, -0.38, bal);
      const yb = (x) => H * (1 - (c - k * Math.pow((x / W - 0.5) * 2, 2)));
      ctx.save();
      ctx.beginPath(); ctx.moveTo(0, H + 10); for (let x = 0; x <= W + 1; x += W / 40) ctx.lineTo(x, yb(x)); ctx.lineTo(W, H + 10); ctx.closePath();
      if (bal < 0.999) { ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.9)'; ctx.shadowBlur = 40 * dpr; ctx.shadowOffsetY = -6 * dpr; ctx.fillStyle = '#dfe5e8'; ctx.fill(); ctx.restore(); }
      ctx.clip();
      ctx.drawImage(croix, 0, 0);
      ctx.save(); repere(false); sceauContour(lisse(3.86, 4.3, s));
      const head = lisse(3.95, 4.5, s), desc = borne((s - 5) / 0.9) * (s < 6.3 ? 1 : 0);
      ctx.lineCap = 'butt'; ctx.lineJoin = 'round';
      const nArc = Math.floor(arc.length * head), nDesc = Math.floor(descente.length * desc);
      if (nArc > 1) {
        ctx.beginPath(); ctx.moveTo(arc[0][0], arc[0][1]);
        for (let i = 1; i < nArc; i++) ctx.lineTo(arc[i][0], arc[i][1]);
        for (let i = 0; i < nDesc; i++) ctx.lineTo(descente[i][0], descente[i][1]);
        ctx.strokeStyle = holo(10, -10, 40, 690, temps * 0.35, 60); ctx.lineWidth = 9.5; ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1.2; ctx.stroke();
        for (let j = 1; j <= 6; j++) { const i = j * 95; if (i < nDesc) { const [x, y] = descente[i]; ctx.fillStyle = '#12a876'; for (let f = 0; f < 3; f++) { ctx.save(); ctx.translate(x, y); ctx.rotate(-0.4 + f * 2.09 + j); ctx.beginPath(); ctx.moveTo(1, 0); ctx.quadraticCurveTo(6, -5.5, 13, 0); ctx.quadraticCurveTo(6, 5.5, 1, 0); ctx.fill(); ctx.strokeStyle = 'rgba(160,240,200,.6)'; ctx.lineWidth = 0.4; ctx.beginPath(); ctx.moveTo(1, 0); ctx.lineTo(12, 0); ctx.stroke(); ctx.restore(); } } }
      }
      ctx.restore();
      ctx.restore();
      if (bal < 0.999) { ctx.beginPath(); for (let x = 0; x <= W + 1; x += W / 40) x ? ctx.lineTo(x, yb(x)) : ctx.moveTo(x, yb(x)); ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 1.5 * dpr; ctx.stroke(); }
    }

    /* ---------------- la marée : la nuit revient, rive irisée ; la nuit peinte et l'étoile */
    if (liq > 0.001 || nuitP > 0.001) {
      const front = H * (1 - mel(-0.3, 1.3, liq));
      const yl = (x) => front + H * (0.05 * Math.sin((x / W) * 5 * (W / H) + temps * 1.3) + 0.03 * Math.sin((x / W) * 11 * (W / H) - temps * 1.9));
      const enMaree = liq < 0.999 && bal > 0;
      ctx.save();
      if (enMaree) { ctx.beginPath(); ctx.moveTo(0, H + 10); for (let x = 0; x <= W + 1; x += W / 60) ctx.lineTo(x, yl(x)); ctx.lineTo(W, H + 10); ctx.closePath(); ctx.clip(); }
      ctx.globalAlpha = enMaree ? 1 : nuitP;
      ctx.drawImage(nuit, Math.sin(temps * 0.05) * 6 * dpr, Math.cos(temps * 0.04) * 4 * dpr);
      const ev = lisse(6.02, 6.3, s) * (1 - lisse(6.75, 7.05, s));
      if (ev > 0.01) {
        const ex = port ? W / 2 : W * 0.68, ey = port ? H * 0.33 : H * 0.42, R = (port ? W * 0.2 : H * 0.17) * (1 + 0.04 * Math.sin(temps * 1.4) + pulse * 0.12);
        const g0 = ctx.createRadialGradient(ex, ey, 0, ex, ey, R * 3); g0.addColorStop(0, `rgba(255,190,80,${0.35 * ev})`); g0.addColorStop(1, 'rgba(255,170,60,0)');
        ctx.fillStyle = g0; ctx.fillRect(ex - R * 3, ey - R * 3, R * 6, R * 6);
        ctx.save(); ctx.translate(ex, ey); ctx.rotate(temps * 0.05 * (reduit ? 0.5 : 1) + pulse * 2);
        ctx.beginPath();
        for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * 1.2566, b = a + 0.6283; const r1 = R * (1 + 0.05 * Math.sin(i * 2.1)); if (!i) ctx.moveTo(Math.cos(a) * r1, Math.sin(a) * r1); ctx.quadraticCurveTo(Math.cos(b) * R * 0.62, Math.sin(b) * R * 0.62, Math.cos(a + 1.2566) * R, Math.sin(a + 1.2566) * R); }
        ctx.closePath();
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, R); g.addColorStop(0, `rgba(255,248,190,${ev})`); g.addColorStop(0.55, `rgba(255,205,80,${ev})`); g.addColorStop(1, `rgba(240,150,40,${ev})`);
        ctx.fillStyle = g; ctx.shadowColor = 'rgba(255,190,80,.9)'; ctx.shadowBlur = 30 * dpr; ctx.fill(); ctx.shadowBlur = 0;
        ctx.strokeStyle = `rgba(255,252,220,${0.5 * ev})`; ctx.lineWidth = 1.5 * dpr;
        for (let i = 0; i < 3; i++) { ctx.beginPath(); for (let a = 0; a < 9; a += 0.2) { const r = R * 0.05 * a; const x = Math.cos(a + i * 2.1) * r, y = Math.sin(a + i * 2.1) * r; a ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); }
        ctx.restore();
        etoileEcran = { x: ex, y: ey, r: R };
      } else etoileEcran = null;
      ctx.restore();
      if (enMaree && liq > 0) {
        ctx.beginPath(); for (let x = 0; x <= W + 1; x += W / 60) x ? ctx.lineTo(x, yl(x)) : ctx.moveTo(x, yl(x));
        ctx.strokeStyle = holo(0, 0, W, 0, temps * 0.4); ctx.lineWidth = 10 * dpr; ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 1.5 * dpr; ctx.stroke();
      }
    }
    const gv = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
    gv.addColorStop(0, 'rgba(0,0,0,0)'); gv.addColorStop(1, `rgba(0,0,0,${0.35 * (1 - 0.6 * clairP)})`);
    ctx.fillStyle = gv; ctx.fillRect(0, 0, W, H);
  }

  function passer() { if (tOuv < 3) accel = 5; }
  const surGeste = (e) => {
    if (tOuv < 3) { passer(); return; }
    if (e.type === 'pointerdown' && etoileEcran) {
      const x = e.clientX * dpr, y = e.clientY * dpr;
      if (Math.hypot(x - etoileEcran.x, y - etoileEcran.y) < etoileEcran.r * 1.4) pulse = 1;
    }
  };
  window.addEventListener('pointerdown', surGeste, { passive: true });
  window.addEventListener('keydown', surGeste);
  window.addEventListener('wheel', surGeste, { passive: true });
  window.addEventListener('touchstart', surGeste, { passive: true });
  const ro = new ResizeObserver(() => dimensionner());
  ro.observe(div);
  dimensionner();
  raf = requestAnimationFrame(image);

  return {
    pret: Promise.resolve(),
    ouvertureFinie,
    repli: true,
    realisations: {
      definir(liste) { sites = (liste || []).map((x) => ({ id: x.id, image: x.image, couleur: x.couleur })); actif = Math.min(actif, Math.max(0, sites.length - 1)); angleCible = actif; construireCarrousel(); },
      aller(i) {
        if (!sites.length) return; const n = sites.length, j = ((Math.round(i) % n) + n) % n;
        glisse = 0; let c = j; while (c - angleCible > n / 2) c -= n; while (angleCible - c > n / 2) c += n; angleCible = c;
        if (j !== actif) { actif = j; for (const f of ecouteurs) { try { f(j, sites[j]); } catch {} } }
      },
      glisser(dx) { glisse = -(Number(dx) || 0) / Math.max(200, (W / dpr) * 0.6); },
      surChangement(fn) { if (typeof fn === 'function') ecouteurs.push(fn); return () => { const k = ecouteurs.indexOf(fn); if (k >= 0) ecouteurs.splice(k, 1); }; },
      get actif() { return actif; },
    },
    progression(p, sectionId, locale) {
      const i = SECTIONS.indexOf(sectionId);
      const l = locale == null || Number.isNaN(Number(locale)) ? 0.5 : borne(Number(locale));
      sCible = i >= 0 ? i + l : borne(Number(p) || 0) * 9;
      if (i >= 0) section = sectionId;
      if (sCible > 0.04) passer();
    },
    passer,
    pause() { if (enPause || detruit) return; enPause = true; cancelAnimationFrame(raf); },
    reprendre() { if (!enPause || detruit) return; enPause = false; dernier = 0; raf = requestAnimationFrame(image); },
    get enPause() { return enPause; },
    etat() {
      const moy = mesures.length ? mesures.reduce((a, b) => a + b, 0) / mesures.length : 0;
      const bal = lisse(3.82, 4.14, sL), liq = lisse(5.86, 6.18, sL);
      return { quaternion: [q.x, q.y, q.z, q.w], section, clair: bal * (1 - liq) > 0.5, fps: moy ? Math.round(1000 / moy) : 0 };
    },
    voile() {},
    stats() { const moy = mesures.length ? mesures.reduce((a, b) => a + b, 0) / mesures.length : 0; return { repli: true, ips: moy ? Math.round(1000 / moy) : 0, s: Math.round(sL * 100) / 100, section, dpr }; },
    _sauter() { sL = sCible; },
    detruire() {
      detruit = true; cancelAnimationFrame(raf); ro.disconnect();
      window.removeEventListener('pointerdown', surGeste); window.removeEventListener('keydown', surGeste);
      window.removeEventListener('wheel', surGeste); window.removeEventListener('touchstart', surGeste);
      div.remove(); if (canvas) canvas.style.display = ''; finir();
    },
  };
}
