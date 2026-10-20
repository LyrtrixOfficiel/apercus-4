// Kazura : les pages « Toutes les réalisations » et « Les expériences ». Légères : aucune 3D.
// Elles se remplissent depuis les deux listes (realisations/sites.js, js/experiences-liste.js), gardent le défilement
// lissé, et proposent un tri par étiquette quand il y a assez de sites pour que ce soit utile.
import { lisser } from './lissage.js';
import { visibles } from '../realisations/sites.js';
import { pretes } from './experiences-liste.js';
import { carteHTML, afficheHTML } from './gabarits.js';

const reduit = matchMedia('(prefers-reduced-motion: reduce)').matches;
lisser({ reduit });
const deux = (n) => String(n).padStart(2, '0');

// les réalisations
const cartes = document.getElementById('cartes');
if (cartes) {
  const sites = visibles();
  cartes.innerHTML = sites.map((s, i) => carteHTML(s, i)).join('');
  const compte = document.getElementById('lp-compte');
  const dire = (n) => { if (compte) compte.textContent = `${deux(n)} site${n > 1 ? 's' : ''} en ligne`; };
  dire(sites.length);
  // le tri : seulement à partir de 6 sites, avec les étiquettes partagées par au moins deux d'entre eux
  const filtres = document.getElementById('filtres');
  const freq = new Map();
  for (const s of sites) for (const e of s.etiquettes || []) freq.set(e, (freq.get(e) || 0) + 1);
  const utiles = [...freq].filter(([, n]) => n > 1).sort((a, b) => b[1] - a[1]).map(([e]) => e);
  if (filtres && sites.length >= 6 && utiles.length) {
    filtres.innerHTML = ['Tous', ...utiles].map((e, i) => `<button type="button" data-e="${i ? e : ''}" aria-pressed="${i === 0}">${e}</button>`).join('');
    filtres.hidden = false;
    filtres.addEventListener('click', (ev) => {
      const b = ev.target.closest('button');
      if (!b) return;
      filtres.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      let n = 0;
      cartes.querySelectorAll('.carte').forEach((c) => {
        const ok = !b.dataset.e || c.dataset.etiquettes.split('|').includes(b.dataset.e);
        c.hidden = !ok;
        if (ok) n++;
      });
      dire(n);
    });
  }
}

// les expériences
const affiches = document.getElementById('affiches');
if (affiches) {
  const liste = pretes();
  affiches.innerHTML = liste.map((x, i) => afficheHTML(x, i, { niveau: 'h2', chargement: i < 2 ? 'eager' : 'lazy' })).join('');
}

// l'apparition au défilement
if ('IntersectionObserver' in window) {
  const els = document.querySelectorAll('.carte, .affiche, .lp-fin');
  const io = new IntersectionObserver((entrees) => {
    for (const e of entrees) if (e.isIntersecting) { e.target.classList.add('vu'); io.unobserve(e.target); }
  }, { rootMargin: '0px 0px -6% 0px', threshold: 0.08 });
  els.forEach((el, i) => { el.style.setProperty('--d', `${(i % 3) * 0.07}s`); io.observe(el); });
  document.documentElement.classList.add('anime-liste');
}

// v16 : le menu du téléphone, le même que sur l'accueil (un <details>, il s'ouvre aussi sans JavaScript)
const menu = document.getElementById('menu');
if (menu) {
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) menu.open = false; });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && menu.open) { menu.open = false; menu.querySelector('summary').focus(); } });
  matchMedia('(min-width: 1200px)').addEventListener('change', (m) => { if (m.matches) menu.open = false; });
}
