// Pop vitamine : démarrage de la page.
// 1. Choix du praticien (?p=<dossier>) et rendu depuis son JSON.
// 2. Menu, apparitions, ruban, typographie vivante.
// 3. Scène 3D (chargée à part : si WebGL manque, la page garde ses dégradés CSS).
import { rendre, FAMILLES, famille } from './rendu.js';

const racine = document.getElementById('racine');
const reduit = matchMedia('(prefers-reduced-motion: reduce)').matches;
const etat = { vitesse: 0, souris: [0, 0], sourisPx: null };

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

function menu() {
  const bouton = document.querySelector('.bouton-menu');
  const panneau = document.getElementById('menu');
  if (!bouton || !panneau) return;
  const libelle = bouton.querySelector('.vh');
  const ouvrir = (oui) => {
    bouton.setAttribute('aria-expanded', String(oui));
    libelle.textContent = oui ? 'Fermer le menu' : 'Ouvrir le menu';
    document.documentElement.classList.toggle('menu-ouvert', oui);
    if (oui) { panneau.hidden = false; requestAnimationFrame(() => panneau.classList.add('ouvert')); panneau.querySelector('a')?.focus(); }
    else { panneau.classList.remove('ouvert'); setTimeout(() => { if (!panneau.classList.contains('ouvert')) panneau.hidden = true; }, reduit ? 0 : 450); }
  };
  bouton.addEventListener('click', () => ouvrir(bouton.getAttribute('aria-expanded') !== 'true'));
  panneau.addEventListener('click', (e) => { if (e.target.closest('a')) ouvrir(false); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && bouton.getAttribute('aria-expanded') === 'true') { ouvrir(false); bouton.focus(); } });
  // le menu prend les couleurs de la section en cours
  const sections = [...document.querySelectorAll('[data-scene]')];
  const io = new IntersectionObserver((es) => {
    for (const e of es) if (e.isIntersecting) {
      const cs = getComputedStyle(e.target);
      panneau.style.setProperty('--a', cs.getPropertyValue('--a')); panneau.style.setProperty('--b', cs.getPropertyValue('--b')); panneau.style.setProperty('--encre', cs.getPropertyValue('--encre'));
      document.documentElement.style.setProperty('--section-encre', cs.getPropertyValue('--encre'));
    }
  }, { rootMargin: '-45% 0px -54% 0px' });
  sections.forEach((s) => io.observe(s));
}

function apparitions() {
  const els = document.querySelectorAll('[data-pop], .etape, .titre span');
  if (reduit || !('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('vu')); return; }
  const io = new IntersectionObserver((es) => {
    for (const e of es) if (e.isIntersecting) { e.target.classList.add('vu'); io.unobserve(e.target); }
  }, { rootMargin: '0px 0px -8% 0px' });
  els.forEach((e) => io.observe(e));
}

// Le nom géant : chaque lettre devient une petite gélatine que le pointeur écrase (axe de largeur de la police).
function typoVivante() {
  const h1 = document.querySelector('.geant');
  if (!h1) return [];
  const lettres = [];
  h1.querySelectorAll('.ligne').forEach((ligne, li) => {
    const texte = ligne.textContent;
    ligne.textContent = '';
    [...texte].forEach((c, i) => {
      const s = document.createElement('span');
      s.className = 'lettre'; s.textContent = c;
      s.style.setProperty('--d', `${(li * 6 + i) * 38}ms`);
      ligne.appendChild(s); lettres.push(s);
    });
  });
  requestAnimationFrame(() => h1.classList.add('vu'));
  return lettres;
}

function lancer3D(d) {
  const canvas = document.querySelector('canvas.scene');
  const ok = (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; } })();
  if (!canvas || !ok) { document.documentElement.classList.add('sans-gl'); return; }
  const F = FAMILLES[famille(d)];
  import('./scene.js')
    .then((m) => m.lancer({ canvas, F, d, reduit, etat }))
    .catch((err) => { console.warn('3D indisponible', err); document.documentElement.classList.add('sans-gl'); });
}

// Le nom géant remplit exactement sa largeur, quelle que soit sa longueur (le CSS en donne une
// estimation prudente, lisible sans JavaScript).
function ajusterNom() {
  const h1 = document.querySelector('.geant');
  if (!h1) return;
  const regler = () => {
    h1.style.fontSize = '';
    const css = parseFloat(getComputedStyle(h1).fontSize);
    const dispo = h1.parentElement.clientWidth;
    const large = Math.max(...[...h1.querySelectorAll('.ligne')].map((l) => { const r = document.createRange(); r.selectNodeContents(l); return r.getBoundingClientRect().width; }));
    if (!large || !dispo) return;
    const max = innerWidth <= 760 ? innerWidth * 0.26 : 150;
    h1.style.fontSize = Math.min(max, css * 1.4, css * (dispo * 0.98) / large).toFixed(1) + 'px';
  };
  regler();
  let t; addEventListener('resize', () => { clearTimeout(t); t = setTimeout(regler, 120); });
}

async function demarrer() {
  const d = await donnees();
  await document.fonts?.ready;
  ajusterNom();
  menu();
  const lettres = reduit ? [] : typoVivante();
  apparitions();
  lancer3D(d);

  const piste = document.querySelector('.ruban-piste');
  let decalage = 0, dernier = scrollY, sens = 1, tPrec = performance.now();
  let pointeur = null;
  addEventListener('pointermove', (e) => {
    pointeur = [e.clientX, e.clientY];
    etat.sourisPx = pointeur;
    etat.souris = [(e.clientX / innerWidth) * 2 - 1, (e.clientY / innerHeight) * 2 - 1];
  }, { passive: true });

  const boucle = (now) => {
    const dt = Math.min(0.05, (now - tPrec) / 1000); tPrec = now;
    const dy = scrollY - dernier; dernier = scrollY;
    etat.vitesse += (dy - etat.vitesse) * 0.18;
    if (!reduit && piste) {
      if (Math.abs(dy) > 0.5) sens = dy > 0 ? 1 : -1;
      const largeur = piste.scrollWidth / 4;
      decalage = (decalage + dt * (60 + Math.min(900, Math.abs(etat.vitesse) * 40)) * sens) % largeur;
      if (decalage < 0) decalage += largeur;
      piste.style.transform = `translate3d(${-decalage}px,0,0)`;
    }
    // lettres : lecture des positions d'abord, écriture ensuite
    if (lettres.length && pointeur) {
      const rects = lettres.map((l) => l.getBoundingClientRect());
      rects.forEach((r, i) => {
        const dx = pointeur[0] - (r.left + r.width / 2), dy2 = pointeur[1] - (r.top + r.height / 2);
        const p = Math.max(0, 1 - Math.hypot(dx, dy2) / 260);
        const q = p * p * (3 - 2 * p);
        lettres[i].style.setProperty('--w', (100 - q * 25).toFixed(1));
        lettres[i].style.setProperty('--sy', (1 + q * 0.08).toFixed(3));
      });
    }
    requestAnimationFrame(boucle);
  };
  requestAnimationFrame(boucle);
}

demarrer();
