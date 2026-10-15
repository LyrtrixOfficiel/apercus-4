// Liquid glass : démarrage de la page.
// 1. Choix du praticien (?p=<dossier>) et rendu depuis son JSON.
// 2. Barre flottante (se resserre au défilement), tiroir, apparitions à ressort.
// 3. Verre de la barre : filtre SVG de déplacement (réfraction du contenu qui passe dessous, navigateurs Chromium).
// 4. Verre des panneaux : WebGL2 (verre.js). Sans WebGL, le CSS garde un verre dépoli classique.
import { rendre, FAMILLES, famille } from './rendu.js';

const racine = document.getElementById('racine');
const reduit = matchMedia('(prefers-reduced-motion: reduce)').matches;
const etat = { pointeur: null, inclinaison: null };

async function donnees() {
  let d = JSON.parse(document.getElementById('donnees').textContent);
  const p = new URLSearchParams(location.search).get('p');
  if (p && /^[a-z0-9-]+$/.test(p) && p !== d.dossier) {
    try {
      const r = await fetch(`../donnees/${p}.json`);
      if (r.ok) {
        d = await r.json();
        const out = rendre(d);
        racine.innerHTML = out.html;
        document.title = out.titre;
        document.querySelector('meta[name="description"]')?.setAttribute('content', out.description);
        document.querySelector('meta[name="theme-color"]')?.setAttribute('content', out.couleur);
      }
    } catch { /* on garde la page déjà écrite */ }
  }
  document.documentElement.classList.remove('attente');
  return d;
}

function appliquerFamille(d) {
  const F = FAMILLES[famille(d)];
  const s = document.documentElement.style;
  s.setProperty('--fond', F.fond); s.setProperty('--accent', F.accent); s.setProperty('--encre', F.encre); s.setProperty('--doux', F.doux);
  F.lumieres.forEach((c, i) => s.setProperty(`--l${i}`, c));
  return F;
}

function tiroir() {
  const bouton = document.querySelector('.bouton-menu'), panneau = document.getElementById('tiroir');
  if (!bouton || !panneau) return;
  const libelle = bouton.querySelector('.vh');
  const ouvrir = (oui) => {
    bouton.setAttribute('aria-expanded', String(oui));
    libelle.textContent = oui ? 'Fermer le menu' : 'Ouvrir le menu';
    if (oui) { panneau.hidden = false; requestAnimationFrame(() => panneau.classList.add('ouvert')); panneau.querySelector('a')?.focus(); }
    else { panneau.classList.remove('ouvert'); setTimeout(() => { if (!panneau.classList.contains('ouvert')) panneau.hidden = true; }, reduit ? 0 : 500); }
  };
  bouton.addEventListener('click', () => ouvrir(bouton.getAttribute('aria-expanded') !== 'true'));
  panneau.addEventListener('click', (e) => { if (e.target.closest('a')) ouvrir(false); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && bouton.getAttribute('aria-expanded') === 'true') { ouvrir(false); bouton.focus(); } });
}

// La barre se resserre en descendant, s'ouvre en remontant (comme les barres d'onglets récentes).
function barre() {
  const nav = document.querySelector('.barre');
  if (!nav) return;
  let dernier = scrollY;
  addEventListener('scroll', () => {
    const y = scrollY;
    nav.classList.toggle('compacte', y > 140 && y > dernier);
    dernier = y;
  }, { passive: true });
}

// Carte de déplacement d'une lentille en rectangle arrondi : rouge = décalage horizontal, vert = vertical.
function filtreLentille() {
  const nav = document.querySelector('.barre');
  // Seuls les navigateurs Chromium appliquent un filtre SVG au fond d'un élément ; ailleurs, flou classique.
  if (!nav || !window.chrome || !CSS.supports('backdrop-filter', 'url(#a)')) return;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '0'); svg.setAttribute('height', '0'); svg.setAttribute('aria-hidden', 'true');
  svg.style.position = 'absolute';
  svg.innerHTML = '<filter id="lentille" x="0" y="0" width="100%" height="100%" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB"><feImage id="lentille-carte" result="carte" preserveAspectRatio="none"/><feDisplacementMap in="SourceGraphic" in2="carte" scale="44" xChannelSelector="R" yChannelSelector="G"/><feGaussianBlur stdDeviation="0.6"/></filter>';
  document.body.appendChild(svg);
  const filtre = svg.querySelector('filter'), image = svg.querySelector('#lentille-carte');
  const dessiner = () => {
    const l = Math.round(nav.offsetWidth), h = Math.round(nav.offsetHeight);
    if (!l || !h) return;
    const c = document.createElement('canvas'); c.width = l; c.height = h;
    const g = c.getContext('2d'), img = g.createImageData(l, h), r = h / 2, biseau = Math.min(18, r);
    for (let y = 0; y < h; y++) for (let x = 0; x < l; x++) {
      // distance au bord d'une pilule et normale vers l'extérieur
      const cx = Math.min(Math.max(x + 0.5, r), l - r), dx = x + 0.5 - cx, dy = y + 0.5 - r, dist = Math.hypot(dx, dy);
      const dans = r - dist, t = Math.max(0, Math.min(1, 1 - dans / biseau));
      const pente = t * t;
      const nx = dist ? dx / dist : 0, ny = dist ? dy / dist : 0;
      const i = (y * l + x) * 4;
      img.data[i] = 128 - nx * pente * 127; img.data[i + 1] = 128 - ny * pente * 127; img.data[i + 2] = 128; img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    image.setAttribute('href', c.toDataURL());
    image.setAttribute('width', l); image.setAttribute('height', h);
    filtre.setAttribute('width', l); filtre.setAttribute('height', h);
    document.documentElement.classList.add('lentille-svg');
  };
  dessiner();
  new ResizeObserver(dessiner).observe(nav);
}

function apparitions() {
  const els = document.querySelectorAll('.sc .titre, .sc .sur-titre, [data-verre], .note, .paiement, .portrait figcaption');
  if (reduit || !('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('vu')); return; }
  els.forEach((e) => e.classList.add('a-reveler'));
  const io = new IntersectionObserver((es) => {
    for (const e of es) if (e.isIntersecting) { e.target.classList.add('vu'); io.unobserve(e.target); }
  }, { rootMargin: '0px 0px -6% 0px' });
  els.forEach((e) => io.observe(e));
}

function gestes() {
  addEventListener('pointermove', (e) => { etat.pointeur = [e.clientX, e.clientY]; }, { passive: true });
  addEventListener('pointerleave', () => { etat.pointeur = null; });
  document.addEventListener('mouseleave', () => { etat.pointeur = null; });
  // inclinaison du téléphone, seulement là où elle ne demande pas d'autorisation (Android) :
  // sur iPhone, la lumière suit le défilement et le doigt, sans fenêtre de permission.
  if ('DeviceOrientationEvent' in window && typeof DeviceOrientationEvent.requestPermission !== 'function') {
    addEventListener('deviceorientation', (e) => {
      if (e.gamma == null) return;
      etat.inclinaison = [Math.max(-1, Math.min(1, e.gamma / 35)), Math.max(-1, Math.min(1, (e.beta - 45) / 35))];
    });
  }
}

async function demarrer() {
  const d = await donnees();
  const F = appliquerFamille(d);
  tiroir(); barre(); filtreLentille(); apparitions(); gestes();
  const canvas = document.querySelector('canvas.lumiere');
  const ok = (() => { try { return !!document.createElement('canvas').getContext('webgl2'); } catch { return false; } })();
  if (!canvas || !ok) { document.documentElement.classList.add('sans-gl'); return; }
  try {
    const m = await import('./verre.js');
    m.lancer({ canvas, F, d, reduit, etat });
  } catch (err) { console.warn('verre WebGL indisponible', err); document.documentElement.classList.add('sans-gl'); }
}

demarrer();
