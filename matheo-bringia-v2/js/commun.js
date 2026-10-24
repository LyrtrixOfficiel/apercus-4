// Mathéo Bringia : ce que toutes les pages partagent.
//  - les zones de données (data-rendu) remplies depuis donnees/*.js ;
//  - le défilement lissé, le menu, l'en-tête, les apparitions au défilement, le compte à rebours ;
//  - la scène 3D derrière la page (ou son repli 2D sans WebGL), avec l'ambiance de la partie à l'écran.
import { lisser } from './lissage.js';
import { RENDUS } from './rendus.js';
import { AMBIANCES, melanger } from './ambiances.js';

const html = document.documentElement;
export const reduit = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const mobile = matchMedia('(pointer: coarse)').matches || innerWidth < 760;
if (reduit) html.classList.add('reduit');

// ---------- les données ----------
for (const el of document.querySelectorAll('[data-rendu]')) {
  const f = RENDUS[el.dataset.rendu];
  if (!f) continue;
  try { const h = f(); if (el.__rendu !== h) { el.innerHTML = h; el.__rendu = h; } } catch (e) { console.warn('rendu', el.dataset.rendu, e); }
}

// le bandeau des partenaires (en bas de chaque page) suit lui aussi le fichier de données
{
  const b = document.querySelector('.bandeau');
  if (b) { const h = RENDUS.bandeau(); const t = document.createElement('div'); t.innerHTML = h; b.replaceWith(t.firstElementChild); }
}

// ---------- le défilement lissé ----------
export const lissage = lisser({ reduit });

// ---------- l'en-tête et le menu ----------
const entete = document.querySelector('[data-entete]');
const menu = document.querySelector('.menu');
if (menu) {
  menu.addEventListener('toggle', () => {
    html.classList.toggle('menu-ouvert', menu.open);
    document.body.style.overflowY = menu.open ? 'hidden' : '';
  });
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) menu.open = false; });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && menu.open) { menu.open = false; menu.querySelector('summary').focus(); } });
}

// ---------- les apparitions ----------
const io = new IntersectionObserver((es) => {
  for (const e of es) if (e.isIntersecting) { e.target.classList.add('vu'); io.unobserve(e.target); }
}, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
for (const el of document.querySelectorAll('.apparait')) io.observe(el);

// ---------- le compte à rebours (J-) ----------
for (const el of document.querySelectorAll('[data-compte]')) {
  const [a, m, j] = el.dataset.compte.split('-').map(Number);
  const s = el.querySelector('span');
  if (!m || !j) { el.hidden = true; continue; }
  const jours = Math.ceil((new Date(a, m - 1, j) - new Date()) / 864e5);
  s.textContent = jours > 0 ? String(jours) : '0';
  el.removeAttribute('aria-hidden');
  el.setAttribute('aria-label', `Dans ${jours} jours`);
}

// ---------- l'ambiance de la scène selon la partie à l'écran ----------
let parties = [];
function mesurer() {
  parties = [...document.querySelectorAll('[data-ambiance]')].map((el) => {
    const r = el.getBoundingClientRect();
    return { a: AMBIANCES[el.dataset.ambiance] || AMBIANCES.calme, haut: r.top + scrollY, bas: r.bottom + scrollY };
  }).sort((x, y) => x.haut - y.haut);
}
mesurer();
addEventListener('resize', mesurer);
addEventListener('load', mesurer);
new ResizeObserver(() => mesurer()).observe(document.body);

let yPrec = scrollY, tPrec = performance.now(), vitesse = 0;
const lisse = (t) => t * t * (3 - 2 * t);
export function etatScene() {
  const y = lissage.position();
  const now = performance.now();
  const dt = Math.max(1, now - tPrec);
  vitesse += (((y - yPrec) / dt) * 1000 - vitesse) * 0.3;
  yPrec = y; tPrec = now;
  if (!parties.length) return { amb: AMBIANCES.calme, y, vitesse };
  const c = y + innerHeight * 0.5;
  let i = parties.findIndex((p) => c >= p.haut && c < p.bas);
  if (i < 0) i = c < parties[0].haut ? 0 : parties.length - 1;
  const p = parties[i];
  const prec = parties[i - 1];
  let amb = p.a;
  if (prec) {
    const t = Math.min(1, Math.max(0, (c - p.haut + innerHeight * 0.45) / (innerHeight * 0.9)));
    if (t < 1) amb = melanger(prec.a, p.a, lisse(t));
  }
  return { amb, y, vitesse };
}

// l'en-tête plus opaque dès qu'on a quitté le haut de la page
let plein = null;
function surDefile() {
  const p = scrollY > 40;
  if (p !== plein) { plein = p; entete?.classList.toggle('plein', p); }
}
addEventListener('scroll', surDefile, { passive: true });
surDefile();

// ---------- la scène 3D, ou son repli ----------
const canvas = document.querySelector('canvas.scene');
function webglOk() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; }
}
export const scene = (async () => {
  if (!canvas) return null;
  // la scène démarre après la première image de la page : le contenu passe d'abord
  await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 60)));
  if (webglOk() && !/sanswebgl/.test(location.search)) {
    try {
      const { lancerScene } = await import('./scene.js');
      html.classList.add('webgl');
      return lancerScene({ canvas, reduit, mobile, etat: etatScene });
    } catch (e) { console.warn('3D indisponible, repli 2D', e && e.message); }
  }
  const { lancerRepli } = await import('./repli.js');
  html.classList.add('repli');
  return lancerRepli({ canvas, reduit, etat: etatScene });
})();
