// Méridiens : la fiche (?p=), la palette (?palette=), la carte (?carte=), l'ouverture, puis la vie de la page.
import { rendre, titre, description, palette, stylePalette, fr } from './rendu.js';
import { geometrie, choisirCarte } from './carte.js';
import { creerLumiere } from './lumiere.js';
import { creerChamp } from './champ.js';
import { graine } from './trace.js';
import { APERCU, apercuPret, filet } from '../../commun/apercu.js';
filet('meridiens');

const html = document.documentElement;
const ample = html.classList.contains('ample');
const tactile = matchMedia('(hover: none), (pointer: coarse)').matches;
const petit = tactile || innerWidth < 700;
const params = new URLSearchParams(location.search);
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const ouverture = $('#ouverture');
const progres = (k) => ouverture?.style.setProperty('--progres', k);
progres(.18);

// 1. La fiche et la palette
const site = $('#site');
const demande = params.get('p'), carteForcee = params.get('carte'), paletteDemandee = params.get('palette');
const valide = (x) => x && /^[a-z0-9-]{2,120}$/.test(x);
const charger = (u) => fetch(u).then((r) => (r.ok ? r.json() : null)).catch(() => null);
const autre = valide(demande) && demande !== site.dataset.p;
const [U, fiche] = await Promise.all([
  charger('univers.json'),
  autre || carteForcee || paletteDemandee ? charger(`../donnees/${autre ? demande : site.dataset.p}.json`) : null,
]);
if (fiche && (autre || carteForcee)) {
  site.innerHTML = rendre(fiche, { carte: carteForcee });
  site.dataset.p = fiche.dossier || demande;
  document.title = titre(fiche);
  $('meta[name="description"]')?.setAttribute('content', description(fiche));
}
if (U && fiche && (autre || paletteDemandee)) {
  const P = palette(fiche, U, paletteDemandee);
  html.style.cssText = stylePalette(P); html.dataset.palette = P.id; html.dataset.ton = P.ton;
  $('meta[name="theme-color"]')?.setAttribute('content', P.couleurs.fond);
}
progres(.4);

// 2. L'ouverture : les initiales se tracent au fil d'or dès que la police est là
const initiales = $('#ouverture-initiales');
if (initiales) initiales.textContent = (fiche?.initiales || $('.sceau span')?.textContent || 'M').trim();
// la feuille des polices ne bloque pas la page : on attend qu'elle soit là, puis les polices elles-mêmes
const feuille = $('#polices');
const feuillePrete = feuille && !feuille.dataset.pret ? new Promise((r) => { feuille.addEventListener('load', r, { once: true }); feuille.addEventListener('error', r, { once: true }); }) : Promise.resolve();
const polices = Promise.race([
  feuillePrete.then(() => Promise.all([document.fonts.load('italic 300 150px Playfair'), document.fonts.load('300 80px Playfair'), document.fonts.load('400 17px "Instrument Sans"')])),
  new Promise((r) => setTimeout(r, APERCU ? 450 : 1200)),
]);
await polices;
ouverture?.classList.add('trace');
const debutTrace = performance.now();
progres(.7);

// 3. La carte de l'accueil et celle de la séance
const planche = $('#accueil');
const type = $('.planche-carte')?.dataset.carte || 'pied';
const geo = geometrie(type);
const douce = $('.planche-carte')?.dataset.douce === '1'; // massage : pas de noms de méridiens
const moteurs = [];
const boiteAccueil = $('.planche .carte-boite');
const lumiere = boiteAccueil ? creerLumiere(boiteAccueil, geo, { ample, petit, etiquette: false }) : null;
if (lumiere) moteurs.push({ m: lumiere, el: planche });
const boiteSeance = $('.annotee-carte .carte-boite');
// la séance réutilise le dessin de l'accueil (<use> sans script) : avec le script, une vraie copie, que la page peut styler
const usage = $('.annotee-carte use'), source = $('#h-dessin');
if (usage && source) {
  const copie = source.cloneNode(true); copie.removeAttribute('id');
  // planche de la séance : un seul pied, plus grand (le second est retiré de la copie)
  if (usage.closest('svg')?.classList.contains('carte-seule')) [...copie.querySelectorAll(':scope > .membre')].slice(1).forEach((m) => m.remove());
  usage.replaceWith(copie);
}
const lumiereSeance = boiteSeance ? creerLumiere(boiteSeance, geometrie(type, true), { ample, petit, svgZones: false, etiquette: false }) : null;
if (lumiereSeance) moteurs.push({ m: lumiereSeance, el: $('#seance') });
const contact = $('#contact');
const champ = contact ? creerChamp(contact, $('.rencontre-coeur', contact), { ample, petit, graine: graine(site.dataset.p) }) : null;
if (champ) moteurs.push({ m: champ, el: contact });
progres(.9);

// 4. Fin de l'ouverture : on laisse le sceau se lire, jamais plus de 2,5 s au total
let ouvert = false;
function ouvrir() {
  if (ouvert) return; ouvert = true;
  progres(1);
  ouverture?.classList.add('fini');
  requestAnimationFrame(() => { planche?.classList.add('eveil'); apercuPret('meridiens'); });
  setTimeout(() => lumiere?.souffle(), ample ? 1500 : 900);
}
ouverture?.addEventListener('pointerdown', ouvrir);
addEventListener('keydown', ouvrir, { once: true });
const lire = APERCU ? 250 : ample ? 1450 : 900;
setTimeout(ouvrir, Math.max(0, Math.min((APERCU ? 720 : 2500) - performance.now(), lire - (performance.now() - debutTrace))));

// 5. Ce qui apparaît au défilement
for (const sel of ['.trace-corps p', '.roue', '.annot', '.tarif', '.prix-note', '.medaillon-portrait', '.medaillon-texte > *', '.rencontre-coeur', '.infos > div', '.pied > *']) {
  $$(sel).forEach((e, i) => { e.classList.add('revele'); e.style.transitionDelay = (i % 3) * 90 + 'ms'; });
}
const vigie = new IntersectionObserver((es) => { for (const e of es) if (e.isIntersecting) { e.target.classList.add('vu'); vigie.unobserve(e.target); } }, { rootMargin: '0px 0px -8% 0px', threshold: .1 });
$$('.revele').forEach((e) => vigie.observe(e));
// les moteurs ne tournent que lorsqu'on les voit
const vigieMoteurs = new IntersectionObserver((es) => { for (const e of es) for (const x of moteurs) if (x.el === e.target) x.m.visible = e.isIntersecting; }, { rootMargin: '120px 0px' });
moteurs.forEach((x) => { x.m.visible = false; vigieMoteurs.observe(x.el); });

// 6. La grande phrase : ses mots s'éclairent pendant la lecture, une tête de lumière passe dessus
const phrase = $('.phrase');
const motsPhrase = phrase ? $$('.m', phrase) : [];
let tete = -1;
function lirePhrase() {
  if (!motsPhrase.length) return;
  const r = phrase.getBoundingClientRect(), H = innerHeight;
  const k = Math.min(1, Math.max(0, (H * .88 - r.top) / (r.height + H * .3)));
  const n = Math.round(k * motsPhrase.length);
  motsPhrase.forEach((m, i) => { const on = i < n; if (m._on !== on) { m._on = on; m.classList.toggle('lit', on); } });
  const t = n > 0 && n < motsPhrase.length ? n - 1 : -1;
  if (t !== tete) { motsPhrase[tete]?.classList.remove('tete-lumiere'); motsPhrase[t]?.classList.add('tete-lumiere'); tete = t; }
}

// 7. La roue des apports
const roue = $('.roue');
if (roue) {
  roue.classList.add('vivante');
  const points = $$('.roue-point', roue), centre = $('.roue-centre', roue), n = points.length;
  let actif = -1, touche = 0, minuterie = 0;
  const choisir = (i, main) => {
    if (i === actif) return;
    actif = i; if (main) touche = performance.now();
    points.forEach((p, k) => { p.classList.toggle('actif', k === i); $('.roue-nom', p).setAttribute('aria-pressed', k === i); });
    roue.style.setProperty('--rot', (-90 + i * 360 / n - 9) + 'deg');
    centre.classList.add('change');
    setTimeout(() => {
      const p = points[i];
      centre.innerHTML = `<h3>${$('.roue-nom span:last-child', p).innerHTML}</h3><p>${$('.roue-texte', p).innerHTML}</p>`;
      centre.classList.remove('change');
    }, centre.innerHTML ? 260 : 0);
  };
  points.forEach((p, i) => { $('.roue-nom', p).addEventListener('click', () => choisir(i, true)); $('.roue-nom', p).addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') choisir(i, true); }); });
  choisir(0);
  let roueVue = false;
  new IntersectionObserver((es) => { roueVue = es[0].isIntersecting; }, { threshold: .4 }).observe(roue);
  minuterie = setInterval(() => { if (roueVue && performance.now() - touche > 12000 && n > 1) choisir((actif + 1) % n); }, ample ? 4800 : 7500);
  void minuterie;
}

// 8. La séance : chaque annotation éveille sa zone ; sur ordinateur, un renvoi relie le texte à la zone
const annots = $$('.annot');
let annotActive = null;
function choisirAnnot(a) {
  if (a === annotActive) return;
  annotActive = a;
  annots.forEach((x) => x.classList.toggle('actif', x === a));
  if (a && lumiereSeance) lumiereSeance.activer(a.dataset.zone);
}
annots.forEach((a) => a.addEventListener('pointerenter', () => choisirAnnot(a)));
const grilleSeance = $('.annotee-grille');
let renvois = null;
function tracerRenvois() {
  if (!grilleSeance || !lumiereSeance) return;
  if (innerWidth < 960) { renvois?.remove(); renvois = null; return; }
  if (!renvois) { renvois = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); renvois.setAttribute('class', 'renvois'); renvois.setAttribute('aria-hidden', 'true'); grilleSeance.appendChild(renvois); }
  const rg = grilleSeance.getBoundingClientRect(), rb = boiteSeance.getBoundingClientRect();
  let d = '', c = '';
  for (const a of annots) {
    const z = lumiereSeance.zones.find((zz) => zz.cle === a.dataset.zone) || lumiereSeance.zones.find((zz) => zz.cle.endsWith('-' + a.dataset.zone.split('-').slice(1).join('-')));
    if (!z) continue;
    const h3 = $('h3', a).getBoundingClientRect();
    const gauche = a.dataset.cote === 'g';
    const x0 = (gauche ? h3.right + 16 : h3.left - 16) - rg.left, y0 = h3.top + h3.height / 2 - rg.top;
    let [zx, zy] = lumiereSeance.versPx(z.ancre);
    // un méridien (ou une ligne) : le renvoi va au point de la ligne le plus proche, du côté du texte et à sa hauteur,
    // pour ne jamais traverser le dessin
    if (z.lignes?.length) {
      let dmin = 1e9;
      for (const id of z.lignes) for (const p of lumiereSeance.pointsLigne(id)) {
        const [px, py] = lumiereSeance.versPx(p);
        const dd = Math.abs(rb.top - rg.top + py - y0) + Math.abs(rb.left - rg.left + px - x0) * .35;
        if (dd < dmin) { dmin = dd; zx = px; zy = py; }
      }
    }
    const x1 = rb.left - rg.left + zx, y1 = rb.top - rg.top + zy;
    const mx = (x0 + x1) / 2;
    d += `M${x0.toFixed(1)} ${y0.toFixed(1)}C${mx.toFixed(1)} ${y0.toFixed(1)} ${mx.toFixed(1)} ${y1.toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`;
    c += `<circle cx="${x1.toFixed(1)}" cy="${y1.toFixed(1)}" r="2.6"/>`;
  }
  renvois.innerHTML = `<path d="${d}"/>${c}`;
}
let annotsTour = 0;
function suivreAnnots() {
  if (!annots.length) return;
  if (innerWidth < 960) {
    // téléphone : la carte reste en haut, l'annotation la plus proche du milieu de l'écran éveille sa zone
    let best = null, dist = 1e9; const cible = innerHeight * .62;
    for (const a of annots) { const r = a.getBoundingClientRect(); const dd = Math.abs(r.top + Math.min(r.height, 120) / 2 - cible); if (dd < dist) { dist = dd; best = a; } }
    choisirAnnot(best);
  }
}
setInterval(() => {
  // ordinateur : les annotations s'éveillent tour à tour quand la planche est à l'écran
  if (innerWidth < 960 || !annots.length || !lumiereSeance?.visible) return;
  if (annots.some((a) => a.matches(':hover'))) return;
  choisirAnnot(annots[annotsTour++ % annots.length]);
}, ample ? 3600 : 5200);

// 9. La boucle : lectures d'abord, écritures ensuite
let aDefiler = 3;
addEventListener('scroll', () => { aDefiler = 2; }, { passive: true });
function boucle(m) {
  if (aDefiler > 0) { lirePhrase(); suivreAnnots(); aDefiler--; }
  for (const x of moteurs) x.m.image(m);
  requestAnimationFrame(boucle);
}
requestAnimationFrame(boucle);

// Le nom ne se coupe jamais au milieu d'un mot (« Nussbau / m ») : s'il déborde de sa colonne, il descend
// d'une taille, pas à pas, jusqu'à tenir (au plus bas 55 %). Sans script, la règle CSS overflow-wrap reste le filet.
function ajusterNom() {
  const nom = $('#nom'); if (!nom) return;
  nom.style.fontSize = ''; nom.style.overflowWrap = 'normal';
  const base = parseFloat(getComputedStyle(nom).fontSize);
  let k = 1;
  const deborde = () => nom.scrollWidth > nom.clientWidth + 1 || [...nom.children].some((e) => e.getBoundingClientRect().right > nom.getBoundingClientRect().right + 2);
  while (deborde() && k > .55) { k -= .04; nom.style.fontSize = (base * k).toFixed(1) + 'px'; }
  if (deborde()) nom.style.overflowWrap = '';
}
ajusterNom();
document.fonts?.ready.then(ajusterNom);

let attente, largeur = innerWidth;
function retailler() {
  ajusterNom();
  for (const x of moteurs) x.m.taille();
  tracerRenvois();
  aDefiler = 2;
}
addEventListener('resize', () => { clearTimeout(attente); attente = setTimeout(() => { if (innerWidth !== largeur || !tactile) retailler(); largeur = innerWidth; }, 180); });
document.fonts?.ready.then(() => setTimeout(retailler, 60));
setTimeout(retailler, 400);
void fr;
