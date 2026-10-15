// Aurora Nuit : chargement de la fiche (?p=<dossier>), puis mise en lumiere.
import { rendre, titre, description } from './rendu.js';
import { demarrerCiel } from './ciel.js';
import { demarrerEtoiles } from './etoiles.js';

const html = document.documentElement;
const reduit = !html.classList.contains('mouvement');
const tactile = matchMedia('(hover: none), (pointer: coarse)').matches;
const petit = tactile || Math.min(innerWidth, innerHeight) < 640;
const site = document.getElementById('site');

// 1. La fiche du praticien
const demande = new URLSearchParams(location.search).get('p');
if (demande && /^[a-z0-9-]{2,120}$/.test(demande) && demande !== site.dataset.p) {
  try {
    const r = await fetch(`../donnees/${demande}.json`);
    if (r.ok) {
      const d = await r.json();
      site.innerHTML = rendre(d); site.dataset.p = d.dossier || demande;
      document.title = titre(d);
      document.querySelector('meta[name="description"]')?.setAttribute('content', description(d));
    }
  } catch (e) { console.warn('fiche introuvable, page par defaut', e); }
}

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const nom = $('#nom'), accueil = $('#accueil');

// 2. Titres qui s'allument lettre a lettre (le titre garde son texte pour les lecteurs d'ecran)
if (!reduit) {
  for (const h of $$('[data-allume]')) {
    const texte = h.textContent; h.setAttribute('aria-label', texte);
    let i = 0;
    h.innerHTML = '<span aria-hidden="true">' + texte.split(/(\s+)/).map((m) => /^\s+$/.test(m) ? m
      : `<span class="mot-a">${[...m].map((c) => `<span class="car" style="--i:${i++}">${c.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</span>`).join('')}</span>`).join('') + '</span>';
  }
  // Phrase phare : les mots s'eclairent au fil du defilement
  for (const p of $$('[data-illumine]')) {
    p.innerHTML = p.innerHTML.split(/(\s+)/).map((m) => /^\s+$/.test(m) || !m ? m : `<span class="w">${m}</span>`).join('');
  }
  // Apparitions douces
  for (const sel of ['.colonnes p', '.cartes .carte', '.infos > div', '.lune', '.apropos-texte > p', '.citation', '.contact-rdv', '.tel-geant', '.actions-contact', '.note', '.pied .cadre > *']) {
    $$(sel).forEach((e, i) => { e.classList.add('revele'); e.style.setProperty('--i', i % 4); });
  }
}
const vigie = new IntersectionObserver((entrees) => {
  for (const e of entrees) if (e.isIntersecting) { e.target.classList.add(e.target.matches('[data-allume]') ? 'on' : 'vu'); vigie.unobserve(e.target); }
}, { rootMargin: '0px 0px -12% 0px', threshold: .15 });
$$('[data-allume], .revele').forEach((e) => vigie.observe(e));

// 3. Le ciel
const toile = $('#ciel');
const ciel = demarrerCiel(toile, { petit, reduit });
if (ciel) html.classList.add('gl');

// 4. Etoiles et constellation (apres le chargement des polices : la forme des lettres en depend)
const lever = () => accueil.classList.add('lever');
requestAnimationFrame(() => accueil.classList.add('debut'));
setTimeout(lever, 2600); // le texte d'accueil ne doit jamais attendre trop longtemps
const etoiles = demarrerEtoiles($('#etoiles'), nom, accueil, { petit, reduit, allumer: () => { nom.classList.add('allume'); lever(); } });
await Promise.race([document.fonts?.ready, new Promise((r) => setTimeout(r, 2500))]);
etoiles.construire();
if (reduit) { nom.classList.add('allume'); lever(); }

// 5. La lentille de lumiere et sa carte du ciel cachee
const lueur = $('#lueur'), carte = $('#carte-celeste');
let R = 320;
function carteCeleste() {
  const W = innerWidth, H = innerHeight, cx = W * .78, cy = H * .18, D = Math.hypot(W, H);
  const rnd = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
  let svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none" stroke="rgba(200,220,255,.42)" stroke-width=".6">`;
  for (const k of [.18, .34, .52, .72, .95]) svg += `<circle cx="${cx}" cy="${cy}" r="${D * k}" ${k === .52 ? 'stroke-dasharray="2 6"' : ''}/>`;
  for (let a = 0; a < 24; a++) { const t = a / 24 * Math.PI * 2; svg += `<line x1="${cx + Math.cos(t) * D * .18}" y1="${cy + Math.sin(t) * D * .18}" x2="${cx + Math.cos(t) * D}" y2="${cy + Math.sin(t) * D}" stroke-opacity="${a % 6 ? .35 : .8}"/>`; }
  for (let a = 0; a < 180; a++) { const t = a / 180 * Math.PI * 2, r1 = D * .72, r2 = r1 + (a % 5 ? 5 : 11); svg += `<line x1="${cx + Math.cos(t) * r1}" y1="${cy + Math.sin(t) * r1}" x2="${cx + Math.cos(t) * r2}" y2="${cy + Math.sin(t) * r2}"/>`; }
  let ec = `M0 ${H * .62}`; for (let x = 0; x <= W; x += 20) ec += ` L${x} ${H * .62 - Math.sin(x / W * Math.PI * 1.3 + .4) * H * .22}`;
  svg += `<path d="${ec}" stroke="rgba(124,245,200,.6)" stroke-dasharray="1 5"/>`;
  // Petites constellations dessinees au hasard (graine fixe)
  for (let c = 0; c < Math.round(W * H / 160000) + 3; c++) {
    let x = rnd() * W, y = rnd() * H; const pts = [[x, y]];
    for (let i = 0; i < 4 + Math.floor(rnd() * 3); i++) { x += (rnd() - .4) * 120; y += (rnd() - .5) * 90; pts.push([x, y]); }
    svg += `<polyline points="${pts.map((p) => p.join(',')).join(' ')}" stroke="rgba(185,168,255,.55)"/>`;
    for (const [px, py] of pts) svg += `<circle cx="${px}" cy="${py}" r="${1 + rnd() * 1.1}" fill="rgba(240,245,255,.6)" stroke="none"/>`;
  }
  svg += '</svg>';
  carte.innerHTML = svg;
  R = Math.min(460, Math.max(220, Math.max(W, H) * .3));
  lueur.style.setProperty('--lentille', R * 2 + 'px');
}
carteCeleste();

const lum = { tx: innerWidth / 2, ty: innerHeight * .4, px: innerWidth / 2, py: innerHeight * .4, z: 0, tz: 0, dernier: -1e9, touche: false };
function viser(e) { lum.tx = e.clientX; lum.ty = e.clientY; lum.dernier = performance.now(); }
addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse' || lum.touche) viser(e); majCartes(e); }, { passive: true });
addEventListener('pointerdown', (e) => { lum.touche = e.pointerType !== 'mouse'; viser(e); }, { passive: true });
addEventListener('pointerup', () => { lum.touche = false; }, { passive: true });
addEventListener('pointercancel', () => { lum.touche = false; }, { passive: true });
document.addEventListener('pointerleave', () => { lum.dernier = -1e9; });

// 6. Cartes : le bord s'allume la ou passe la main
const cartesVues = new Set();
const vigieCartes = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting ? cartesVues.add(e.target) : cartesVues.delete(e.target)));
$$('.carte').forEach((c) => vigieCartes.observe(c));
function majCartes(e) {
  for (const c of cartesVues) { const r = c.getBoundingClientRect(); c.style.setProperty('--x', (e.clientX - r.left) + 'px'); c.style.setProperty('--y', (e.clientY - r.top) + 'px'); }
}

// 7. Ce qui depend du defilement
const phares = $$('[data-illumine]').map((p) => ({ p, mots: $$('.w', p) }));
const trajet = $('.trajet'), pas = $$('.pas');
// Lectures d'abord, ecritures ensuite (pas de mise en page forcee), et seulement quand on a defile.
let aDefiler = 3, maxDefil = 1;
addEventListener('scroll', () => { aDefiler = 1; }, { passive: true });
function defilement() {
  const H = innerHeight;
  maxDefil = Math.max(1, document.documentElement.scrollHeight - H);
  const lus = phares.map(({ p }) => p.getBoundingClientRect());
  const rt = trajet && trajet.getBoundingClientRect(), rp = pas.map((e) => e.getBoundingClientRect().top);
  phares.forEach(({ mots }, j) => {
    const r = lus[j], k = Math.min(1, Math.max(0, (H * .95 - r.top) / (r.height * .8 + H * .15)));
    const n = Math.round(k * mots.length * 1.05);
    mots.forEach((m, i) => { const on = i < n; if (m._on !== on) { m._on = on; m.classList.toggle('lit', on); } });
  });
  if (trajet) {
    trajet.style.setProperty('--prog', Math.min(1, Math.max(0, (H * .62 - rt.top) / rt.height)).toFixed(4));
    pas.forEach((e, i) => { const on = rp[i] < H * .64; if (e._on !== on) { e._on = on; e.classList.toggle('atteint', on); } });
  }
}

// 8. La boucle
const t0 = performance.now();
let avanceLisse = 0, precedent = 0;
function intensite(s) { return 1 - .62 * Math.min(1, s / .14) + .3 * Math.max(0, (s - .86) / .14); }
function boucle(maintenant) {
  const t = (maintenant - t0) / 1000;
  const dt = precedent ? Math.min(.05, (maintenant - precedent) / 1000) : .016;
  precedent = maintenant;
  if (aDefiler > 0) { defilement(); aDefiler--; }
  const s = Math.min(1, scrollY / maxDefil);
  avanceLisse += (s - avanceLisse) * .08;

  // La lumiere vagabonde seule quand personne ne la guide (toujours sur telephone, sauf au toucher)
  const libre = maintenant - lum.dernier > 2600;
  if (libre) {
    lum.tx = innerWidth * (.5 + .34 * Math.sin(t * .11) * Math.cos(t * .07));
    lum.ty = innerHeight * (.42 + .2 * Math.sin(t * .17 + 1.3));
  }
  lum.tz = libre ? (tactile ? .7 : .55) : 1;
  const f = 1 - Math.exp(-dt * (libre ? 1.2 : 7));
  lum.px += (lum.tx - lum.px) * f; lum.py += (lum.ty - lum.py) * f; lum.z += (lum.tz - lum.z) * .03;

  if (ciel) ciel.dessiner(reduit ? 14 : t, { x: lum.px / innerWidth, y: 1 - lum.py / innerHeight, z: lum.z }, avanceLisse, intensite(avanceLisse));
  etoiles.image(maintenant, lum);

  lueur.style.transform = `translate3d(${lum.px - R}px, ${lum.py - R}px, 0)`;
  const op = scrollY < innerHeight * .6 ? 1 : (libre ? .5 : .85); // hors de l'accueil, la lentille se fait discrete
  if (lueur._op !== op) { lueur._op = op; lueur.style.opacity = op; }
  carte.style.transform = `translate3d(${R - lum.px}px, ${R - lum.py}px, 0)`;
  if (!reduit) requestAnimationFrame(boucle);
}
lueur.classList.add('prete');
requestAnimationFrame(boucle);

if (reduit) { // Mouvement reduit : une image fixe, redessinee seulement au defilement
  let attente = false;
  const redessiner = () => { if (!attente) { attente = true; requestAnimationFrame((m) => { attente = false; avanceLisse = Math.min(1, scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight)); boucle(m); }); } };
  addEventListener('scroll', redessiner, { passive: true });
  addEventListener('pointermove', redessiner, { passive: true });
  addEventListener('resize', redessiner);
}

let attenteTaille, largeurVue = innerWidth;
addEventListener('resize', () => {
  clearTimeout(attenteTaille);
  attenteTaille = setTimeout(() => {
    if (innerWidth === largeurVue) { ciel?.taille(); return; } // barre d adresse du telephone : rien a reconstruire
    largeurVue = innerWidth; aDefiler = 2; etoiles.taille(); etoiles.construire(); carteCeleste(); ciel?.taille(); }, 220);
});
