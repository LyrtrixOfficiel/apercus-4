// Mathéo Bringia : l'accueil.
//  1. LE DÉPART : la séquence du kart n°15 (87 images), jouée image par image au défilement, avec les feux de
//     départ pendant le chargement, le HUD de télémétrie (EXEMPLE), BRINGIA et #15 en typographie géante.
//     Téléphone (portrait) : l'image remplit l'écran. Ordinateur et ultra-large : un cadre vertical au centre,
//     son reflet sur l'asphalte, la scène 3D tout autour, et le mot BRINGIA qui passe DERRIÈRE le cadre.
//  2. LE CIRCUIT : le tracé d'Angerville se dessine, le point 15 fait le tour, les manches s'allument.
//  3. LE PILOTE : il met son casque (séquence studio, 55 images), sur le blanc.
//  4. Les noms des partenaires glissent avec le défilement.
import { lissage, reduit, mobile } from './commun.js';
import { Sequence, dessinerCouvrant } from './sequence.js';

const borne = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lin = (x, a, b) => borne((x - a) / (b - a));
const doux = (t) => t * t * (3 - 2 * t);
const html = document.documentElement;
const saveData = !!(navigator.connection && (navigator.connection.saveData || /2g/.test(navigator.connection.effectiveType || '')));

let L = innerWidth, H = innerHeight;
const zones = new Map(); // élément -> { haut, hauteur }
function mesurer() {
  L = innerWidth; H = innerHeight;
  for (const el of zones.keys()) { const r = el.getBoundingClientRect(); zones.set(el, { haut: r.top + scrollY, hauteur: el.offsetHeight }); }
}
/** Avancement de 0 à 1 dans une partie haute (sticky) : 0 quand son haut touche le haut de l'écran, 1 à la fin. */
function avancement(el, y) { const z = zones.get(el); return z ? borne((y - z.haut) / Math.max(1, z.hauteur - H)) : 0; }
function suivre(el) { if (el) zones.set(el, null); }

// ======================================================================
// 1. LE DÉPART
// ======================================================================
const depart = document.getElementById('depart');
const scn = depart.querySelector('.depart-scene');
const cv = depart.querySelector('.depart-canvas');
const ctx = cv.getContext('2d');
const tr = depart.querySelector('.depart-trainees');
const trx = tr.getContext('2d');
const affiche = depart.querySelector('.affiche-js');
const feux = [...depart.querySelectorAll('.feux i')];
const feuxBloc = depart.querySelector('.chargement');
const fin = depart.querySelector('.depart-fin');
const geant = depart.querySelector('.depart-geant');
const hud = Object.fromEntries([...depart.querySelectorAll('[data-hud]')].map((e) => [e.dataset.hud, e]));
const miniPath = depart.querySelector('.hud-carte path:nth-of-type(2)');
const miniLong = miniPath ? miniPath.getTotalLength() : 0;
suivre(depart);

const N = 87;
let portrait = L / H < 0.8;
let seq = null, jeu = '';
function choisirJeu() {
  portrait = L / H < 0.8;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  let j;
  if (portrait) j = (H * dpr > 760 && !saveData) ? 't' : 'ts';
  else j = (H * 0.78 * dpr > 640 && !saveData) ? 'o' : 'os';
  if (j === jeu) return;
  jeu = j;
  seq?.arreter();
  seq = new Sequence({ dossier: `img/kart/${j}/`, n: N, simultanes: mobile ? 4 : 6, surProgres: surChargement }).lancer();
  seq.surImage(() => { sale = true; });
  // en mode cadre, le mot géant passe derrière l'image (profondeur) ; plein écran, devant
  geant.style.zIndex = portrait ? 2 : 0;
  cv.style.zIndex = 1;
}

// ---------- les feux de départ : ils s'allument pendant que les premières images arrivent ----------
const PREMIERES = 12; // la première image, la dernière, puis une sur 16 et une sur 8 : toute la séquence, en gros
let partis = false, tFeux = performance.now();
function surChargement() {
  if (partis) return;
  const n = Math.min(PREMIERES, seq.prets);
  const allumes = Math.ceil((n / PREMIERES) * 5);
  feux.forEach((f, i) => f.classList.toggle('on', i < allumes));
  if (n >= PREMIERES) lancerDepart();
}
function lancerDepart() {
  if (partis) return; partis = true;
  // tous les feux allumés, un temps, puis ils s'éteignent : c'est parti
  const attente = Math.max(0, 900 - (performance.now() - tFeux));
  feux.forEach((f) => f.classList.add('on'));
  setTimeout(() => {
    feux.forEach((f) => f.classList.remove('on'));
    feuxBloc.classList.add('parti');
    flash = 1;
  }, attente + (reduit ? 500 : 350));
}
// au pire, après 5 s, on part avec ce qu'on a
setTimeout(() => { if (seq && seq.prets > 0) lancerDepart(); }, 5000);

// ---------- le dessin ----------
let sale = true, dprC = 1, flash = 0;
function tailleCanvas() {
  dprC = Math.min(devicePixelRatio || 1, 2);
  cv.width = Math.round(L * dprC); cv.height = Math.round(H * dprC);
  const k = Math.min(1, dprC);
  tr.width = Math.round(L * k); tr.height = Math.round(H * k);
  sale = true;
}

/** Le cadre (mode ordinateur) : position et taille en pixels CSS, selon l'avancement p. */
function cadre(p) {
  const fh = H * 0.78, fw = fh * 0.75;
  // il arrive un peu à droite (le titre est à gauche), se centre, puis glisse à gauche pour la sortie (à droite)
  const debut = lin(p, 0.0, 0.14), sortie = doux(lin(p, 0.82, 0.95));
  const dx = (1 - doux(debut)) * L * 0.11 - sortie * L * 0.13;
  const s = 0.94 + 0.06 * doux(lin(p, 0.05, 0.75));
  const w = fw * s, h = fh * s;
  return { x: (L - w) / 2 + dx, y: Math.max(H * 0.09, 96) + (fh - h) * 0.5, w, h };
}

// la télémétrie (EXEMPLE) : des valeurs crédibles pour un kart de location 270 cm³ (vitesse de pointe 60 à 70 km/h)
const cle = (f, pts) => { for (let i = 1; i < pts.length; i++) if (f <= pts[i][0]) { const [f0, v0] = pts[i - 1], [f1, v1] = pts[i]; return v0 + (v1 - v0) * doux((f - f0) / (f1 - f0)); } return pts.at(-1)[1]; };
const VITESSE = [[0, 39], [14, 41], [30, 47], [46, 55], [62, 62], [72, 64.5], [86, 66]];
const LATERAL = [[0, -1.45], [18, -1.3], [34, -0.9], [46, -0.2], [56, 0.55], [66, 0.35], [86, 0.15]];
const LONGI = [[0, 0.1], [20, 0.35], [46, 0.4], [70, 0.22], [86, 0.12]];
const fmt = (n, d) => n.toFixed(d).replace('.', ',');
let fPrec = -1;
function majHud(f) {
  const fi = Math.round(f);
  if (fi === fPrec) return; fPrec = fi;
  const sec = fi / 30;
  hud.tc.textContent = `00:00:${String(Math.floor(sec)).padStart(2, '0')}:${String(fi % 30).padStart(2, '0')}`;
  const v = cle(f, VITESSE) + Math.sin(fi * 1.7) * 0.25;
  hud.v.firstChild.textContent = String(Math.round(v));
  hud.arc.setAttribute('stroke-dashoffset', String(100 - borne((v - 20) / 55) * 100));
  const rpm = 2700 + borne((v - 38) / 30) * 880 + Math.sin(fi * 2.3) * 12;
  hud.rpm.firstChild.textContent = String(Math.round(rpm / 10) * 10);
  const gl = cle(f, LATERAL), go = cle(f, LONGI);
  hud.g.setAttribute('cx', String(gl * 26)); hud.g.setAttribute('cy', String(-go * 26));
  hud.gv.textContent = `${fmt(Math.abs(gl), 1)} g`;
  const t = 41.318 + sec; // le tour en cours (exemple)
  hud.chrono.textContent = `0:${String(Math.floor(t)).padStart(2, '0')}.${String(Math.floor((t % 1) * 1000)).padStart(3, '0')}`;
  hud.delta.textContent = `-0,${String(Math.round(118 + fi * 1.3)).padStart(3, '0')}`;
  const s = fi / (N - 1);
  // la mini-carte : le point avance sur une portion du tour (illustration) ; la courbe de vitesse se trace
  if (hud.mini && miniPath) { const pt = miniPath.getPointAtLength(((0.9 + s * 0.06) % 1) * miniLong); hud.mini.setAttribute('cx', pt.x.toFixed(1)); hud.mini.setAttribute('cy', pt.y.toFixed(1)); }
  if (hud.courbe) { const pts = []; for (let k = 0; k <= fi; k += 2) pts.push(`${((k / (N - 1)) * 300).toFixed(1)},${(120 - ((cle(k, VITESSE) - 30) / 45) * 120).toFixed(1)}`); hud.courbe.setAttribute('points', pts.join(' ') || '0,120'); }
  hud.s1.style.setProperty('--s', borne(s * 3)); hud.s2.style.setProperty('--s', borne(s * 3 - 1)); hud.s3.style.setProperty('--s', borne(s * 3 - 2));
}

// les traînées (téléphone : par-dessus l'image, en mode écran)
const alea = (() => { let s = 11; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
const TRAITS = Array.from({ length: 34 }, () => ({ a: alea() * Math.PI * 2, r: alea(), z: alea(), l: 0.06 + alea() * 0.1, o: alea() < 0.4 }));
let tTrainees = 0;
function trainees(p, dt, elan) {
  const W = tr.width, Hh = tr.height;
  trx.clearRect(0, 0, W, Hh);
  const force = (doux(lin(p, 0.08, 0.3)) * (1 - doux(lin(p, 0.9, 1)))) * (0.35 + elan * 0.65) * (reduit ? 0.6 : 1);
  if (force < 0.01) return;
  tTrainees += dt * (0.35 + elan * 1.5) * (reduit ? 0.4 : 1);
  const cx = W * 0.5, cy = Hh * 0.42, R = Math.hypot(W, Hh) * 0.7;
  trx.lineCap = 'round';
  for (const s of TRAITS) {
    const z = (s.z + tTrainees * (0.5 + s.r)) % 1;
    const d0 = 0.35 + Math.pow(z, 2) * 0.75, d1 = 0.35 + Math.pow(Math.min(1, z + s.l), 2) * 0.75;
    const x0 = cx + Math.cos(s.a) * R * d0, y0 = cy + Math.sin(s.a) * R * d0;
    const x1 = cx + Math.cos(s.a) * R * d1, y1 = cy + Math.sin(s.a) * R * d1;
    const al = force * Math.sin(Math.PI * z) * 0.55;
    trx.strokeStyle = s.o ? `rgba(255,110,40,${al})` : `rgba(255,248,240,${al * 0.7})`;
    trx.lineWidth = 1 + 2.5 * d1;
    trx.beginPath(); trx.moveTo(x0, y0); trx.lineTo(x1, y1); trx.stroke();
  }
}

let pDepart = -1, dernierT = performance.now(), geantL = 0, posPrec = 0, elanLisse = 0;
function dessinerDepart(y, now) {
  const p = avancement(depart, y);
  const dt = Math.min(0.05, (now - dernierT) / 1000); dernierT = now;
  const vit = Math.abs(y - posPrec) / Math.max(dt, 1e-3); posPrec = y;
  elanLisse += (Math.min(1, vit / 1400) - elanLisse) * Math.min(1, dt * 5);
  const visible = y < (zones.get(depart)?.haut || 0) + (zones.get(depart)?.hauteur || H) + 10;
  if (!visible) { if (pDepart !== 2) { pDepart = 2; trx.clearRect(0, 0, tr.width, tr.height); } return; }
  // les traînées vivent même sans défilement (le moteur tourne)
  if (portrait) trainees(p, dt, elanLisse);
  if (flash > 0) { flash = Math.max(0, flash - dt * 1.6); sale = true; }
  if (p === pDepart && !sale) return;
  pDepart = p; sale = false;
  const f = borne((p - 0.025) / 0.78) * (N - 1);
  seq.prioriser(f);
  majHud(f);

  // les couches de texte (variables CSS)
  const S = scn.style;
  const to = 1 - doux(lin(p, 0.015, 0.11));
  S.setProperty('--to', to.toFixed(3));
  S.setProperty('--io', (1 - doux(lin(p, 0.005, 0.05))).toFixed(3));
  S.setProperty('--ho', (doux(lin(p, 0.07, 0.17)) * (1 - doux(lin(p, 0.83, 0.89)))).toFixed(3));
  S.setProperty('--go', (doux(lin(p, 0.1, 0.22)) * 0.9 * (1 - doux(lin(p, 0.9, 1)))).toFixed(3));
  S.setProperty('--gp', `${(doux(lin(p, 0.66, 0.8)) * 100).toFixed(1)}%`);
  S.setProperty('--no', doux(lin(p, 0.74, 0.84)).toFixed(3));
  const fo = doux(lin(p, 0.87, 0.95));
  S.setProperty('--fo', fo.toFixed(3));
  fin.classList.toggle('actif', fo > 0.5);
  if (!geantL) geantL = geant.getBoundingClientRect().width;
  // BRINGIA traverse l'écran de droite à gauche, plus vite quand le kart approche
  const gx = L * 0.95 - doux(lin(p, 0.08, 0.92)) * (geantL + L * 0.9);
  S.setProperty('--gx', `${gx.toFixed(1)}px`);
  geant.style.top = portrait ? '64%' : '52%';

  // l'image
  const c = ctx;
  c.setTransform(dprC, 0, 0, dprC, 0, 0);
  c.clearRect(0, 0, L, H);
  // l'image la plus proche, sans fondu entre deux images (un fondu dédouble le kart quand on s'arrête entre deux)
  const i0 = Math.round(f);
  const a = seq.pret(i0) ? seq.images[i0] : seq.proche(i0);
  if (!a) return;
  const sombre = 0.15 * doux(lin(p, 0.86, 0.97));
  if (portrait) {
    // plein écran ; un léger zoom avec l'approche
    const z = 1 + 0.06 * doux(lin(p, 0.0, 0.8));
    const w = L * z, h = H * z, x = (L - w) / 2, yy = (H - h) / 2;
    dessinerCouvrant(c, a, x, yy, w, h, 0.5, 0.5);
  } else {
    const r = cadre(p);
    // le reflet sur l'asphalte mouillé, sous le cadre
    const hr = Math.min(H - (r.y + r.h), r.h * 0.4);
    if (hr > 4) {
      c.save();
      c.beginPath(); c.rect(r.x, r.y + r.h + 3, r.w, hr); c.clip();
      c.translate(0, (r.y + r.h) * 2 + 3); c.scale(1, -1);
      dessinerCouvrant(c, a, r.x, r.y, r.w, r.h, 0.5, 0.5, 0.28);
      c.restore();
      const g = c.createLinearGradient(0, r.y + r.h, 0, r.y + r.h + hr);
      g.addColorStop(0, 'rgba(6,7,8,0.25)'); g.addColorStop(1, 'rgba(6,7,8,1)');
      c.globalCompositeOperation = 'destination-out';
      c.fillStyle = g; c.fillRect(r.x - 1, r.y + r.h + 2, r.w + 2, hr + 2);
      c.globalCompositeOperation = 'source-over';
    }
    // la lueur orange derrière le cadre
    const lg = c.createRadialGradient(r.x + r.w / 2, r.y + r.h * 0.55, r.w * 0.2, r.x + r.w / 2, r.y + r.h * 0.55, r.w * 1.3);
    lg.addColorStop(0, `rgba(255,90,20,${0.16 + 0.1 * doux(lin(p, 0.3, 0.8))})`); lg.addColorStop(1, 'rgba(255,90,20,0)');
    c.fillStyle = lg; c.fillRect(r.x - r.w * 1.3, r.y - r.h * 0.5, r.w * 3.6, r.h * 2);
    dessinerCouvrant(c, a, r.x, r.y, r.w, r.h, 0.5, 0.5);
    if (sombre) { c.fillStyle = `rgba(6,7,8,${sombre})`; c.fillRect(r.x, r.y, r.w, r.h); }
    // le liseré et les coins HUD du cadre
    c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = 1; c.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
    c.strokeStyle = '#ff5a14'; c.lineWidth = 2;
    const q = 18;
    c.beginPath();
    c.moveTo(r.x - 6, r.y + q); c.lineTo(r.x - 6, r.y - 6); c.lineTo(r.x + q, r.y - 6);
    c.moveTo(r.x + r.w - q, r.y - 6); c.lineTo(r.x + r.w + 6, r.y - 6); c.lineTo(r.x + r.w + 6, r.y + q);
    c.moveTo(r.x - 6, r.y + r.h - q); c.lineTo(r.x - 6, r.y + r.h + 6); c.lineTo(r.x + q, r.y + r.h + 6);
    c.moveTo(r.x + r.w - q, r.y + r.h + 6); c.lineTo(r.x + r.w + 6, r.y + r.h + 6); c.lineTo(r.x + r.w + 6, r.y + r.h - q);
    c.stroke();
    // les graduations sur le côté (la télémétrie habille le cadre)
    c.fillStyle = 'rgba(255,255,255,.35)';
    for (let i = 0; i <= 20; i++) { const yy = r.y + (r.h * i) / 20; c.fillRect(r.x + r.w + 14, yy, i % 5 ? 4 : 10, 1); c.fillRect(r.x - 14 - (i % 5 ? 4 : 10), yy, i % 5 ? 4 : 10, 1); }
    c.fillStyle = '#ff5a14';
    const cur = r.y + r.h * (f / (N - 1));
    c.fillRect(r.x + r.w + 12, cur - 1, 14, 3);
    c.font = '500 10px "JetBrains Mono", monospace';
    c.fillStyle = 'rgba(255,255,255,.75)';
    c.fillText(`CAM 15 · ${String(Math.round(f)).padStart(3, '0')}/${N - 1}`, r.x, r.y - 14);
  }
  if (portrait && sombre) { c.fillStyle = `rgba(6,7,8,${sombre})`; c.fillRect(0, 0, L, H); }
  // le départ : un éclair orange quand les feux s'éteignent
  if (flash > 0) { c.fillStyle = `rgba(255,90,20,${0.22 * flash * (reduit ? 0.5 : 1)})`; c.fillRect(0, 0, L, H); }
  if (!cv.classList.contains('pret')) { cv.classList.add('pret'); affiche?.classList.add('cache'); }
}

// ======================================================================
// 2. LE CIRCUIT
// ======================================================================
const circuit = document.getElementById('circuit');
suivre(circuit);
const svg = circuit.querySelector('svg');
const coeur = svg.querySelector('.trace-coeur'), lueur = svg.querySelector('.trace-lueur'), halo = svg.querySelector('.trace-halo');
const sillage = svg.querySelector('.trace-sillage'), point = svg.querySelector('.point-15'), onde = svg.querySelector('.onde');
const dist = circuit.querySelector('[data-circuit="dist"]');
const manches = [...circuit.querySelectorAll('.manche')];
const bilan = circuit.querySelector('.circuit-bilan');
const LONG = coeur.getTotalLength();
for (const pth of [coeur, lueur, halo]) { pth.style.strokeDasharray = `${LONG} ${LONG}`; }
const TRAINE = LONG * 0.07;
sillage.style.strokeDasharray = `${TRAINE} ${LONG}`;
manches.forEach((m) => m.classList.remove('allume'));
let pCircuit = -1;
function dessinerCircuit(y, now) {
  const p = avancement(circuit, y);
  const z = zones.get(circuit);
  if (!z || y + H < z.haut - H * 0.2 || y > z.haut + z.hauteur) return;
  const onde_t = (now / 1000) % 1.6;
  onde.setAttribute('r', String(16 + onde_t * 14 * (reduit ? 0.6 : 1)));
  onde.style.opacity = String((1 - onde_t / 1.6) * 0.7);
  if (p === pCircuit) return;
  pCircuit = p;
  // le tracé se dessine (aussi un peu avant que la partie ne colle en haut)
  const pAvant = borne((y - (z.haut - H * 0.7)) / (H * 0.7));
  const trace = doux(borne(pAvant * 0.45 + lin(p, 0, 0.28) * 0.55));
  const off = LONG * (1 - trace);
  coeur.style.strokeDashoffset = off; lueur.style.strokeDashoffset = off; halo.style.strokeDashoffset = off;
  // la vue : de la perspective (au ras de la piste) à la vue du ciel
  const vue = doux(lin(p, 0.0, 0.5));
  const plan = svg.style;
  plan.setProperty('--rx', `${(56 - 40 * vue).toFixed(2)}deg`);
  plan.setProperty('--rz', `${(-8 + 8 * vue).toFixed(2)}deg`);
  plan.setProperty('--cs', (0.9 + 0.1 * vue).toFixed(3));
  // le point 15 fait le tour
  const s = doux(lin(p, 0.28, 0.94));
  const L0 = s * LONG;
  const pt = coeur.getPointAtLength(L0 % LONG);
  point.setAttribute('transform', `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)})`);
  point.style.opacity = String(doux(lin(p, 0.18, 0.28)));
  sillage.style.strokeDashoffset = String(-(L0 - TRAINE));
  sillage.style.opacity = String(s > 0.002 && s < 0.998 ? 1 : 0);
  dist.firstChild.textContent = String(Math.round(s * 1198)).padStart(4, '0');
  manches.forEach((m, i) => m.classList.toggle('allume', s >= (i + 0.6) / 6.2));
  bilan.style.opacity = String(0.25 + 0.75 * doux(lin(s, 0.9, 1)));
}

// ======================================================================
// 3. LE PILOTE : il met son casque
// ======================================================================
const pilote = document.getElementById('pilote');
suivre(pilote);
const pcv = pilote.querySelector('.pilote-cadre canvas');
const pctx = pcv.getContext('2d');
const NC = 55;
let seqC = null, pPilote = -1, saleC = false;
const etapes = [...pilote.querySelectorAll('.pilote-etapes li')];
const contour = pilote.querySelector('.pilote-texte .contour');
function dessinerPilote(y) {
  const z = zones.get(pilote);
  if (!z) return;
  // la séquence ne se charge qu'à l'approche
  if (!seqC && y + H * 2.5 > z.haut) {
    const r = pcv.getBoundingClientRect();
    const grand = r.height * Math.min(devicePixelRatio || 1, 2) > 700 && !saveData;
    seqC = new Sequence({ dossier: `img/casque/${grand ? 'c' : 'cs'}/`, n: NC, simultanes: 3 }).lancer();
    seqC.surImage(() => { saleC = true; });
  }
  if (!seqC || y + H < z.haut || y > z.haut + z.hauteur) return;
  // téléphone (la partie ne colle pas) : on suit le passage du cadre dans l'écran
  let p;
  if (getComputedStyle(pilote.querySelector('.pilote-scene')).position === 'sticky') p = avancement(pilote, y);
  else { const r = pcv.getBoundingClientRect(); p = borne((H - r.top) / (H + r.height)); }
  if (p === pPilote && !saleC) return;
  pPilote = p; saleC = false;
  const f = borne((p - 0.08) / 0.8) * (NC - 1);
  seqC.prioriser(f);
  // les étapes du parcours s'allument une à une, le mot FERMÉ se remplit
  etapes.forEach((li, i) => li.classList.toggle('actif', p >= 0.12 + i * 0.17));
  if (contour) contour.style.setProperty('--rempli', `${(doux(lin(p, 0.1, 0.7)) * 100).toFixed(1)}%`);
  const img = seqC.proche(f);
  if (!img) return;
  const w = pcv.clientWidth, h = pcv.clientHeight, d = Math.min(devicePixelRatio || 1, 2);
  if (pcv.width !== Math.round(w * d)) { pcv.width = Math.round(w * d); pcv.height = Math.round(h * d); }
  pctx.setTransform(d, 0, 0, d, 0, 0);
  dessinerCouvrant(pctx, img, 0, 0, w, h);
  pcv.classList.add('pret');
}

// ======================================================================
// 4. LES NOMS DES PARTENAIRES
// ======================================================================
const part = document.getElementById('partenaires');
const defile = part.querySelector('.defile-noms');
suivre(part);
function dessinerPartenaires(y) {
  const z = zones.get(part);
  if (!z || y + H < z.haut || y > z.haut + z.hauteur) return;
  const p = borne((y + H - z.haut) / (z.hauteur + H));
  defile.style.setProperty('--dx', `${(-p * 50).toFixed(2)}%`);
}

// ======================================================================
// 5. LA BANDE DE PHOTOS EN PISTE : elle glisse de droite à gauche pendant qu'on la traverse
// ======================================================================
const piste = document.getElementById('piste');
const bande = piste?.querySelector('[data-glisse]');
suivre(piste);
function dessinerPiste(y) {
  const z = zones.get(piste);
  if (!z || !bande || y + H < z.haut || y > z.haut + z.hauteur) return;
  const p = borne((y + H - z.haut) / (z.hauteur + H));
  const trop = Math.max(0, bande.scrollWidth - L);
  bande.style.setProperty('--bx', `${(-p * trop).toFixed(1)}px`);
}

// ======================================================================
// la boucle
// ======================================================================
function redimensionner() { mesurer(); choisirJeu(); tailleCanvas(); geantL = 0; pDepart = -1; pCircuit = -1; pPilote = -1; }
redimensionner();
addEventListener('resize', redimensionner);
addEventListener('load', () => { mesurer(); sale = true; });
new ResizeObserver(() => { mesurer(); sale = true; }).observe(document.body);
document.fonts?.ready.then(() => { geantL = 0; sale = true; mesurer(); });

function boucle(now) {
  requestAnimationFrame(boucle);
  const y = lissage.position();
  dessinerDepart(y, now);
  dessinerCircuit(y, now);
  dessinerPilote(y);
  dessinerPartenaires(y);
  dessinerPiste(y);
}
requestAnimationFrame(boucle);
