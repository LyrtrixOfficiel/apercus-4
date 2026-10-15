// Nature : chargement de la fiche (?p=<dossier>), puis la prairie, les pollens,
// les ombres de feuillage et les apparitions au rythme d'une respiration.
import { rendre, titre, description } from './rendu.js';
import { demarrerPrairie, prairieFixe } from './prairie.js';
import { demarrerPollens } from './pollens.js';
import { graine, hasard } from './botanique.js';

const html = document.documentElement;
const reduit = !html.classList.contains('mouvement');
const tactile = matchMedia('(hover: none), (pointer: coarse)').matches;
const petit = tactile || Math.min(innerWidth, innerHeight) < 640;
const site = document.getElementById('site');

// 1. La fiche
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
const accueil = $('#accueil'), nom = $('#nom');
const sel = graine(site.dataset.p || 'prairie');

// 2. Le nom pousse lettre a lettre ; les titres apparaissent mot a mot, comme une respiration
const decouper = (el, unite) => {
  const texte = el.textContent; el.setAttribute('aria-label', texte);
  let i = 0;
  el.innerHTML = '<span aria-hidden="true">' + texte.trim().split(/\s+/).map((m, k, tous) => {
    const contenu = unite === 'lettre' ? [...m].map((c) => `<span class="l" style="--i:${i++}">${c}</span>`).join('') : m;
    return `<span class="mot${k === tous.length - 1 && tous.length > 1 ? ' mot-fin' : ''}" style="--m:${k}">${contenu}</span>`;
  }).join(' ') + '</span>';
};
if (nom) decouper(nom, 'lettre');
if (!reduit) {
  $$('[data-respire]').forEach((h) => decouper(h, 'mot'));
  for (const p of $$('[data-mots]')) p.innerHTML = p.innerHTML.split(/(\s+)/).map((m) => /^\s+$/.test(m) || !m ? m : `<span class="w">${m}</span>`).join('');
  for (const s of ['.corps', '.cartes .carte', '.herbier', '.arche', '.apropos-texte > p', '.citation', '.contact-rdv', '.tel-geant', '.contact .actions', '.infos > div', '.note', '.etape', '.sous-titre']) {
    $$(s).forEach((e, i) => { e.classList.add('revele'); e.style.setProperty('--d', (i % 4) * 80 + 'ms'); });
  }
}
const vigie = new IntersectionObserver((es) => {
  for (const e of es) if (e.isIntersecting) { e.target.classList.add('vu'); vigie.unobserve(e.target); }
}, { rootMargin: '0px 0px -10% 0px', threshold: .12 });
$$('[data-respire], .revele, .dessin').forEach((e) => vigie.observe(e));
// On attend les polices (au plus 1,6 s) : sinon le nom pousserait dans une police de secours puis sauterait.
Promise.race([document.fonts?.ready, new Promise((r) => setTimeout(r, 1600))]).then(() => requestAnimationFrame(() => accueil.classList.add('eveil')));

// 3. Les prairies : une a l'accueil, une seconde (creee quand on y arrive) au pied du contact.
// Deux toiles plutot qu'une toile deplacee : deplacer un contexte WebGL d'un endroit a l'autre de la page
// a fait planter le navigateur de test.
const places = { accueil: $('.prairie-place[data-place="accueil"]'), contact: $('.prairie-place[data-place="contact"]') };
const horizonAccueil = () => { const a = accueil.getBoundingClientRect(), p = places.accueil.getBoundingClientRect(); return Math.min(.8, Math.max(.45, (p.top - a.top) / a.height + .015)); };
const brume = $('.brume');
const poserHorizon = (h) => brume && brume.style.setProperty('--horizon', (h * 100).toFixed(2) + '%');
function creerChamp(parent, devant, horizon, graineChamp) {
  const toile = document.createElement('canvas');
  toile.className = 'prairie'; toile.setAttribute('aria-hidden', 'true');
  devant ? parent.prepend(toile) : parent.appendChild(toile);
  const prairie = demarrerPrairie(toile, { petit, reduit, seed: graineChamp });
  if (prairie) { html.classList.add('gl'); prairie.taille(horizon()); } else prairieFixe(toile, horizon(), graineChamp);
  return { toile, prairie, horizon, onde: [0, 0, 99, 0], debut: 0, r: null };
}
const champs = { accueil: creerChamp(accueil, true, horizonAccueil, sel) };
poserHorizon(horizonAccueil());
const visibles = new Set(['accueil']);
const vigieChamps = new IntersectionObserver((es) => {
  for (const e of es) {
    const k = e.target === accueil ? 'accueil' : 'contact';
    if (e.isIntersecting) { visibles.add(k); if (k === 'contact' && !champs.contact) champs.contact = creerChamp(places.contact, false, () => .3, sel + 1); }
    else visibles.delete(k);
  }
  if (reduit) dessinerUneFois();
}, { rootMargin: '200px 0px' });
vigieChamps.observe(accueil);
if (places.contact) vigieChamps.observe(places.contact);

// La main dans les herbes ; un toucher fait courir une onde et s'envoler les pollens
const main = { x: -999, y: -999, actif: false, force: 0, cible: 0, vu: 0 };
const souffles = [];
addEventListener('pointermove', (e) => { main.x = e.clientX; main.y = e.clientY; main.actif = true; main.vu = performance.now(); }, { passive: true });
addEventListener('pointerdown', (e) => {
  main.x = e.clientX; main.y = e.clientY; main.actif = true; main.vu = performance.now();
  if (e.target.closest('a, button')) return;
  for (const c of Object.values(champs)) {
    if (!c || !c.prairie) continue;
    const r = c.toile.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 2 - 1, y = 1 - ((e.clientY - r.top) / r.height) * 2;
    if (e.clientY > r.top && e.clientY < r.bottom && y < (1 - 2 * c.prairie.horizon) + .1) { c.onde[0] = x; c.onde[1] = y; c.onde[2] = 0; c.onde[3] = 1; souffles.push({ x: e.clientX, y: e.clientY }); }
  }
}, { passive: true });
document.addEventListener('pointerleave', () => { main.actif = false; });

// 4. Pollens
const pollens = demarrerPollens($('#pollens'), { petit, reduit });

// 5. Ombres de feuillage, dessinees une fois en code
(function feuillage() {
  const S = 720, c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d'), r = hasard(sel + 7), flou = 'filter' in g;
  if (flou) g.filter = 'blur(4px)';
  g.fillStyle = '#2c4a2a';
  for (let b = 0; b < 11; b++) {
    let x = r() * S, y = -20, a = Math.PI / 2 + (r() - .5) * 1.2;
    for (let k = 0; k < 30; k++) {
      x += Math.cos(a) * 14; y += Math.sin(a) * 14; a += (r() - .5) * .4;
      for (const s of [-1, 1]) {
        if (r() < .25) continue;
        const la = a + s * (.6 + r() * .6), L = 14 + r() * 20;
        g.save(); g.translate(x, y); g.rotate(la); g.beginPath(); g.moveTo(0, 0);
        g.quadraticCurveTo(L * .5, -L * .3, L, 0); g.quadraticCurveTo(L * .5, L * .3, 0, 0); g.fill(); g.restore();
      }
      if (y > S * .75) break;
    }
  }
  c.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob), boite = $('#feuillage');
    boite.style.setProperty('--ombre', `url(${url})`);
    if (!flou) boite.classList.add('flou-css');
    boite.classList.add('pret');
  }, 'image/png');
})();

// 6. La tige de la seance, tracee a la hauteur reelle des etapes
const tige = $('.tige-boite'), etapes = $$('.etape');
function tracerTige() {
  if (!tige) return;
  const svg = $('.tige-svg', tige), chemin = $('.tige-trait', tige), H = tige.offsetHeight;
  const ys = etapes.map((e) => e.offsetTop + 22);
  svg.setAttribute('viewBox', `0 0 60 ${H}`); svg.style.height = H + 'px';
  let d = 'M28 0', y0 = 0, cote = 1;
  for (const y of [...ys, H]) { const m = (y0 + y) / 2; d += `C${28 + 16 * cote} ${m - (y - y0) * .2} ${28 + 16 * cote} ${m + (y - y0) * .2} 28 ${y}`; y0 = y; cote = -cote; }
  chemin.setAttribute('d', d);
}
tracerTige();

// 7. Ce qui suit le defilement
const fougere = $('.approche-plante'), phares = $$('[data-mots]').map((p) => ({ p, mots: $$('.w', p) }));
const sections = $$('#accueil, .section, .pied');
const FONDS = { accueil: '#f7f3e6', approche: '#f6f2e4', seance: '#eef2e3', tarifs: '#f7f1e2', apropos: '#f1f3e5', contact: '#e9efdd', pied: '#e9efdd' };
let fondActuel = '';
// Lectures d'abord, ecritures ensuite, et seulement quand on a defile.
let aDefiler = 3;
addEventListener('scroll', () => { aDefiler = 1; }, { passive: true });
function defilement() {
  const H = innerHeight;
  const lus = phares.map(({ p }) => p.getBoundingClientRect());
  const rf = fougere && fougere.getBoundingClientRect();
  const rt = tige && tige.getBoundingClientRect(), re = etapes.map((e) => e.getBoundingClientRect().top);
  let courante = 'accueil';
  for (const s of sections) { if (s.getBoundingClientRect().top < H * .5) courante = s.id || 'pied'; }
  phares.forEach(({ mots }, j) => {
    const r = lus[j], k = Math.min(1, Math.max(0, (H * .95 - r.top) / (r.height * .8 + H * .15)));
    const n = Math.round(k * mots.length * 1.05);
    mots.forEach((m, i) => { const on = i < n; if (m._on !== on) { m._on = on; m.classList.toggle('lit', on); } });
  });
  if (fougere) fougere.style.setProperty('--trace', Math.min(1, Math.max(0, (H * .95 - rf.top) / (rf.height * .9))).toFixed(3));
  if (tige) {
    tige.style.setProperty('--prog', Math.min(1, Math.max(0, (H * .66 - rt.top) / rt.height)).toFixed(4));
    etapes.forEach((e, i) => { const on = re[i] < H * .7; if (e._on !== on) { e._on = on; e.classList.toggle('atteint', on); } });
  }
  if (courante !== fondActuel) { fondActuel = courante; document.body.style.setProperty('--fond', FONDS[courante] || FONDS.accueil); }
}

// 8. La boucle
const t0 = performance.now();
let precedent = 0, vent = 1, dernierY = scrollY;
const etat = { vent: 1, pousse: 0, ptr: [0, 0, 0], onde: [0, 0, 99, 0], dolly: 0 };
function boucle(m) {
  const t = (m - t0) / 1000, dt = precedent ? Math.min(.05, (m - precedent) / 1000) : .016; precedent = m;
  const v = Math.abs(scrollY - dernierY) / Math.max(dt, .001); dernierY = scrollY;
  vent += (1 + Math.min(2.2, v / 900) - vent) * Math.min(1, dt * 2.5);
  // force de la main : vive quand elle bouge, s'efface quand elle s'arrete
  main.cible = main.actif && m - main.vu < 700 ? 1 : 0;
  main.force += (main.cible - main.force) * Math.min(1, dt * (main.cible ? 6 : 1.6));
  const hA = accueil.offsetHeight; // lectures avant toute ecriture
  const actifs = ['accueil', 'contact'].map((k) => champs[k]).filter((c, i) => c && c.prairie && visibles.has(i ? 'contact' : 'accueil'));
  for (const c of actifs) c.r = c.toile.getBoundingClientRect();
  if (aDefiler > 0) { defilement(); aDefiler--; }
  for (const c of actifs) {
    if (!c.debut) c.debut = m;
    const r = c.r;
    etat.vent = vent; etat.pousse = reduit ? 2 : Math.min(2, (m - c.debut) / 1000 / 2.6 * 1.6);
    etat.ptr = [((main.x - r.left) / r.width) * 2 - 1, 1 - ((main.y - r.top) / r.height) * 2, main.force];
    c.onde[2] += dt; etat.onde = c.onde;
    etat.dolly = c === champs.accueil ? Math.min(3, scrollY / Math.max(1, hA) * 3) : 0;
    c.prairie.dessiner(reduit ? 3 : t, etat);
  }
  pollens.image(m, main, souffles.splice(0));
  if (!reduit) requestAnimationFrame(boucle);
}
requestAnimationFrame(boucle);
function dessinerUneFois() { requestAnimationFrame((m) => boucle(m)); }
if (reduit) {
  let attente = false;
  const redessiner = () => { if (!attente) { attente = true; requestAnimationFrame((m) => { attente = false; boucle(m); }); } };
  addEventListener('scroll', redessiner, { passive: true });
  addEventListener('resize', redessiner);
}

let attente, largeurVue = innerWidth;
addEventListener('resize', () => {
  clearTimeout(attente);
  attente = setTimeout(() => {
    pollens.taille(); tracerTige(); aDefiler = 2;
    for (const c of Object.values(champs)) { if (c.prairie) c.prairie.taille(c.horizon()); else if (innerWidth !== largeurVue) prairieFixe(c.toile, c.horizon(), sel); }
    poserHorizon(horizonAccueil());
    largeurVue = innerWidth;
  }, 200);
});
