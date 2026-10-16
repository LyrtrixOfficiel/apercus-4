// Cocon : la fiche (?p=), la palette (?palette=), l'ouverture brodée, puis le mobile, le paysage de papier,
// le faire-part qui s'ouvre et la veilleuse.
import { rendre, titre, description, palette, stylePalette } from './rendu.js';

const html = document.documentElement;
const ample = html.classList.contains('ample');
const tactile = matchMedia('(hover: none), (pointer: coarse)').matches;
const petit = tactile || innerWidth < 700;
const params = new URLSearchParams(location.search);
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const ouverture = $('#ouverture');
const progres = (k) => ouverture?.style.setProperty('--progres', k);
progres(.15);

// 1. La fiche et la palette
const site = $('#site');
const demande = params.get('p'), paletteDemandee = params.get('palette');
const valide = (x) => x && /^[a-z0-9-]{2,120}$/.test(x);
const charger = (u) => fetch(u).then((r) => (r.ok ? r.json() : null)).catch(() => null);
const autre = valide(demande) && demande !== site.dataset.p;
const [U, fiche] = await Promise.all([charger('univers.json'), autre || paletteDemandee ? charger(`../donnees/${autre ? demande : site.dataset.p}.json`) : null]);
if (fiche && autre) {
  site.innerHTML = rendre(fiche); site.dataset.p = fiche.dossier || demande;
  document.title = titre(fiche); $('meta[name="description"]')?.setAttribute('content', description(fiche));
}
if (U && fiche && (autre || paletteDemandee)) {
  const P = palette(fiche, U, paletteDemandee);
  html.style.cssText = stylePalette(P); html.dataset.palette = P.id; html.dataset.ton = P.ton;
  $('meta[name="theme-color"]')?.setAttribute('content', P.couleurs.fond);
}
const initiales = (fiche?.initiales || $('.sceau')?.textContent || 'C').trim();
$$('.ouverture-initiales').forEach((t) => { t.textContent = initiales; });
progres(.35);

// 2. Les polices (la feuille ne bloque pas la page), puis la broderie des initiales
const feuille = $('#polices');
const feuillePrete = feuille && !feuille.dataset.pret ? new Promise((r) => { feuille.addEventListener('load', r, { once: true }); feuille.addEventListener('error', r, { once: true }); }) : Promise.resolve();
await Promise.race([
  feuillePrete.then(() => Promise.all([document.fonts.load('400 150px "Young Serif"'), document.fonts.load('600 40px Caveat'), document.fonts.load('400 17px "Nunito Sans"')])),
  new Promise((r) => setTimeout(r, 1200)),
]);
ouverture?.classList.add('trace');
const debutTrace = performance.now();
progres(.55);

// 3. Le mobile en 3D (repli : le mobile de papier en SVG, déjà dans la page). Si three.js tarde (réseau lent),
// la page s'ouvre avec le mobile de papier et la scène 3D le remplace en fondu dès qu'elle est prête.
const scene = $('.scene');
let mobile = null;
async function monterMobile() {
  const { creerMobile } = await import('./mobile.js');
  const m = scene && !params.has('sans3d') ? await creerMobile(scene, { ample, petit, initiales }) : null;
  if (!m) return null;
  await Promise.race([m.pret, new Promise((r) => setTimeout(r, 900))]);
  scene.classList.add('vivante');
  return m;
}
const montage = monterMobile().catch((e) => { console.warn('mobile 3D indisponible, mobile de papier', e?.message || e); return null; });
mobile = await Promise.race([montage, new Promise((r) => setTimeout(() => r(null), 2000))]);
if (!mobile) montage.then((m) => { if (m) { mobile = m; vigieScene(); m.lancer(.5); } });
progres(.9);

// 4. Fin de l'ouverture : la broderie se lit, jamais plus de 2,5 s au total
let ouvert = false;
function ouvrir() {
  if (ouvert) return; ouvert = true;
  progres(1); ouverture?.classList.add('fini');
  requestAnimationFrame(() => $('#accueil')?.classList.add('eveil'));
  // le mobile reçoit une petite poussée à l'ouverture, comme une porte qu'on ouvre
  setTimeout(() => mobile?.lancer(ample ? .9 : .5), 350);
}
ouverture?.addEventListener('pointerdown', ouvrir);
addEventListener('keydown', ouvrir, { once: true });
const lire = ample ? 1500 : 950;
setTimeout(ouvrir, Math.max(0, Math.min(2500 - performance.now(), lire - (performance.now() - debutTrace))));

// 5. Apparitions au défilement
for (const sel of ['.livre', '.champ', '.colline-corps > *', '.fp', '.cerceau', '.tambour-texte > *', '.veille-texte > *', '.pied > p']) {
  $$(sel).forEach((e, i) => { e.classList.add('revele'); e.style.transitionDelay = (i % 3) * 90 + 'ms'; });
}
const vigie = new IntersectionObserver((es) => { for (const e of es) if (e.isIntersecting) { e.target.classList.add('vu'); vigie.unobserve(e.target); } }, { rootMargin: '0px 0px -8% 0px', threshold: .1 });
$$('.revele').forEach((e) => vigie.observe(e));

// 6. Le mobile ne tourne que lorsqu'on le voit
function vigieScene() { if (mobile) new IntersectionObserver((es) => { mobile.visible = es[0].isIntersecting; }, { rootMargin: '80px 0px' }).observe(scene); }
vigieScene();

// 7. La veilleuse : elle s'allume quand on arrive à la nuit ; on l'éteint ou la rallume d'un toucher
const veille = $('#contact'), bouton = $('.veilleuse');
let veilleTouchee = false;
if (veille && bouton) {
  veille.classList.remove('allumee'); bouton.setAttribute('aria-pressed', 'false');
  const regler = (on) => { veille.classList.toggle('allumee', on); bouton.setAttribute('aria-pressed', String(on)); };
  bouton.addEventListener('click', () => { veilleTouchee = true; regler(!veille.classList.contains('allumee')); });
  new IntersectionObserver((es) => { if (es[0].isIntersecting && !veilleTouchee) setTimeout(() => regler(true), ample ? 500 : 300); }, { threshold: .35 }).observe(veille);
}

// 8. Ce qui suit le défilement, amorti : nuages et lune de papier, collines, faire-part, vent dans le mobile
const nuages = $$('.nuage-papier, .etoile-papier'), luneCiel = $('.lune-ciel'), collines = $$('.colline'), fp = $('.fp'), haut = $('.fp-haut');
const etat = new Map();
const amortir = (cle, cible, k) => { const v = etat.get(cle) ?? cible; const n = v + (cible - v) * k; etat.set(cle, n); return n; };
let dernierY = scrollY, vent = 0, enNuit = false;
const tete = $('#tete');
function boucle(m) {
  const H = innerHeight, k = Math.min(1, .12 * (ample ? 1 : .8));
  const amp = ample ? 1 : .55;
  // lectures
  const rp = $('#seance')?.getBoundingClientRect();
  const rf = fp?.getBoundingClientRect();
  // le paysage : chaque couche de papier glisse à sa vitesse
  if (rp && rp.bottom > -100 && rp.top < H + 100) {
    const p = (H - rp.top) / (H + rp.height);
    nuages.forEach((n, i) => { n.style.setProperty('--px', amortir('nx' + i, (p - .5) * (i ? -60 : 80) * amp, k).toFixed(1) + 'px'); n.style.setProperty('--py', amortir('ny' + i, (p - .5) * -50 * amp, k).toFixed(1) + 'px'); });
    luneCiel?.style.setProperty('--py', amortir('lune', (p - .5) * 90 * amp, k).toFixed(1) + 'px');
    collines.forEach((c, i) => c.style.setProperty('--py', amortir('c' + i, (p - .5) * (collines.length - i) * -9 * amp, k).toFixed(1) + 'px'));
  }
  // le faire-part se déplie quand il monte dans l'écran
  if (rf && haut) {
    const p = Math.min(1, Math.max(0, (H * .92 - rf.top) / (H * .5)));
    haut.style.setProperty('--pli', amortir('pli', (1 - p) * 72, ample ? .1 : .14).toFixed(2) + 'deg');
  }
  // l'en-tête passe à la nuit avec la page
  if (veille && tete) { const nuit = veille.getBoundingClientRect().top + Math.min(240, H * .3) < 64; if (nuit !== enNuit) { enNuit = nuit; tete.classList.toggle('nuit', nuit); } }
  // le défilement fait un peu de vent dans le mobile
  const v = scrollY - dernierY; dernierY = scrollY;
  vent += (v - vent) * .2;
  if (mobile && Math.abs(vent) > .5) mobile.vent(vent * amp);
  mobile?.image(m);
  requestAnimationFrame(boucle);
}
requestAnimationFrame(boucle);

// Le nom ne se coupe jamais au milieu d'un mot : s'il déborde, il descend d'une taille, pas à pas (au plus bas 55 %).
// Sans script, la règle CSS overflow-wrap reste le filet.
function ajusterNom() {
  const nom = $('#nom'); if (!nom) return;
  nom.style.fontSize = ''; nom.style.overflowWrap = 'normal';
  const base = parseFloat(getComputedStyle(nom).fontSize);
  let k = 1;
  const deborde = () => nom.scrollWidth > nom.clientWidth + 1;
  while (deborde() && k > .55) { k -= .04; nom.style.fontSize = (base * k).toFixed(1) + 'px'; }
  if (deborde()) nom.style.overflowWrap = '';
}
ajusterNom();
document.fonts?.ready.then(ajusterNom);

let attente, largeur = innerWidth;
addEventListener('resize', () => { clearTimeout(attente); attente = setTimeout(() => { ajusterNom(); if (innerWidth !== largeur || !tactile) mobile?.taille(); largeur = innerWidth; }, 180); });
setTimeout(() => mobile?.taille(), 400);
