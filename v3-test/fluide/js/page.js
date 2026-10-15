/* FLUIDE : la page. Choisit le praticien (?p=<dossier>), rend son contenu,
   puis allume le fond, les apparitions a ressort et l'inclinaison des cartes.
   Sans JavaScript, la page ecrite par batir.mjs se lit telle quelle. */
import { rendre } from './contenu.js';

const html = document.documentElement;
const reduit = matchMedia('(prefers-reduced-motion: reduce)').matches;
const telephone = matchMedia('(pointer: coarse)').matches || innerWidth < 760;
if (reduit) html.classList.add('reduit');

async function chargerPraticien() {
  const p = new URLSearchParams(location.search).get('p');
  if (!p || !/^[a-z0-9-]+$/.test(p) || p === document.body.dataset.p) return;
  try {
    const r = await fetch(`../donnees/${p}.json`, { cache: 'no-store' });
    if (!r.ok) return;
    const d = await r.json();
    const v = rendre(d);
    document.getElementById('contenu').innerHTML = v.html;
    document.querySelector('.pied').outerHTML = v.pied;
    document.title = v.titre;
    document.querySelector('meta[name="description"]')?.setAttribute('content', v.description);
    document.querySelector('.entete-nom-t').innerHTML = v.entete.nom;
    document.querySelector('.entete-mono').innerHTML = v.entete.initiales;
    document.querySelector('.entete-appel').setAttribute('href', d.telLien);
    document.body.dataset.p = p;
  } catch {}
}

/* Le ressort : une courbe d'amortissement echantillonnee en linear(), que
   les transitions CSS savent suivre. Leger depassement, retour en douceur. */
function ressort(raideur = 170, amorti = 17, masse = 1) {
  const w0 = Math.sqrt(raideur / masse), z = amorti / (2 * Math.sqrt(raideur * masse));
  const wd = w0 * Math.sqrt(1 - z * z);
  const x = (t) => 1 - Math.exp(-z * w0 * t) * (Math.cos(wd * t) + (z * w0 / wd) * Math.sin(wd * t));
  let duree = 0;
  for (let t = 0; t < 4; t += 0.01) if (Math.abs(1 - x(t)) > 0.002) duree = t;
  const pts = [];
  const n = 48;
  for (let i = 0; i <= n; i++) pts.push(+x((i / n) * duree).toFixed(4));
  pts[n] = 1;
  return { courbe: `linear(${pts.join(', ')})`, duree };
}

function apparitions() {
  if (reduit) { document.querySelectorAll('.rev').forEach((e) => e.classList.add('vu')); return; }
  if (CSS.supports('transition-timing-function', 'linear(0, 1)')) {
    const r = ressort();
    html.style.setProperty('--ressort', r.courbe);
    html.style.setProperty('--ressort-duree', r.duree.toFixed(2) + 's');
  }
  const io = new IntersectionObserver((es) => {
    for (const e of es) if (e.isIntersecting) { e.target.classList.add('vu'); io.unobserve(e.target); }
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });
  document.querySelectorAll('.rev').forEach((el) => io.observe(el));
  requestAnimationFrame(() => html.classList.add('pret'));
}

/* L'en-tete se resserre des que l'on defile. */
function entete() {
  const e = document.querySelector('.entete');
  const maj = () => e.classList.toggle('serre', scrollY > 24);
  addEventListener('scroll', maj, { passive: true });
  maj();
}

/* Les cartes s'inclinent vers le pointeur, sur un ressort. */
function inclinaison() {
  if (reduit || telephone) return;
  const actives = new Map();
  let tourne = false;
  const pas = () => {
    tourne = false;
    for (const [el, s] of actives) {
      s.vx += (170 * (s.tx - s.x) - 16 * s.vx) / 60; s.x += s.vx / 60;
      s.vy += (170 * (s.ty - s.y) - 16 * s.vy) / 60; s.y += s.vy / 60;
      el.style.setProperty('--rx', s.y.toFixed(3) + 'deg');
      el.style.setProperty('--ry', s.x.toFixed(3) + 'deg');
      if (Math.abs(s.x - s.tx) + Math.abs(s.y - s.ty) + Math.abs(s.vx) + Math.abs(s.vy) > 0.01) tourne = true;
      else if (s.tx === 0 && s.ty === 0) actives.delete(el);
    }
    if (tourne) requestAnimationFrame(pas);
  };
  const relancer = () => { if (!tourne) { tourne = true; requestAnimationFrame(pas); } };
  document.addEventListener('pointermove', (ev) => {
    const el = ev.target.closest?.('.carte');
    for (const [c, s] of actives) if (c !== el) { s.tx = 0; s.ty = 0; }
    if (el) {
      const r = el.getBoundingClientRect();
      const px = (ev.clientX - r.left) / r.width, py = (ev.clientY - r.top) / r.height;
      const s = actives.get(el) || { x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0 };
      s.tx = (px - 0.5) * 7; s.ty = (0.5 - py) * 7;
      actives.set(el, s);
      el.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
      el.style.setProperty('--my', (py * 100).toFixed(1) + '%');
    }
    relancer();
  }, { passive: true });
}

async function demarrer() {
  await chargerPraticien();
  entete();
  apparitions();
  inclinaison();
  const sans = new URLSearchParams(location.search).has('sansgl');
  if (sans) { html.classList.add('sans-webgl'); return; }
  try {
    const { demarrer: fond } = await import('./fond.js');
    const f = fond({ toile: document.querySelector('.toile'), telephone, reduit });
    if (!f) throw new Error('WebGL indisponible');
    html.classList.add('avec-webgl');
    window.__fond = f;
  } catch (e) {
    console.warn('Fond WebGL indisponible :', e);
    html.classList.add('sans-webgl');
  }
}
demarrer();
