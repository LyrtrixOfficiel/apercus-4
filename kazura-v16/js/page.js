// Kazura v14 : la page posée sur la scène 3D (monde/monde.js).
// - Le chargement : le sceau se dessine en traits fins tant que la scène se prépare (progression si monde.surChargement existe).
//   Il s'efface à « pret ». Le titre ne se pose qu'à « ouvertureFinie ». Seul plafond : 15 s sans « pret », ou une erreur :
//   le titre arrive alors sans 3D. La page n'appelle JAMAIS monde.passer() : seule la scène le fait, sur un geste du visiteur.
// - Le défilement lissé (js/lissage.js) ; la position lissée part vers la scène à chaque image (progression).
// - L'interface technique (index, gyroscope, croix), les lettres brouillées (moins d'une seconde par ligne).
// - Les réalisations : la sélection de realisations/sites.js, toute visible d'un coup (une rangée de vignettes
//   cliquables), le site actif en grand ; flèches, clavier et glisser en plus. Le défilement vertical ne change jamais de site.
// - L'invitation aux expériences (js/experiences-liste.js) : les affiches fixes, aucune vidéo, aucune 3D d'expérience.
// - Les passages entre le sombre et le clair : un rideau en escalier lié au défilement.
// - Le message prérédigé du formulaire.
// Tout est défensif : si la scène n'expose pas une méthode, la page marche quand même. Sans ce script, tout se lit tel quel.

import { lisser } from './lissage.js';
import { selection } from '../realisations/sites.js';
import { pretes } from './experiences-liste.js';
import { oeuvreHTML, vignetteHTML, invitationHTML, prixHTML, faqPrixHTML } from './gabarits.js';
import * as reglages from './reglages.js';

window.kazuraPage = true;
const racine = document.documentElement;
const reduit = matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobile = matchMedia('(max-width: 799px), (pointer: coarse)').matches;
const SECTIONS = ['ouverture', 'promesse', 'experiences', 'realisations', 'rever', 'deroule', 'matheo', 'questions', 'contact'];
// v16 : « Osez rêver » vit dans le monde VIOLET (sombre, encre claire) ; seul le déroulé est blanc
const CLAIRES = new Set(['deroule']);
const VIOLETTES = new Set(['rever']);
const borne = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const $ = (s, el = document) => el.querySelector(s);
const deux = (n) => String(n).padStart(2, '0');
const debug = location.search.includes('debug');
const lissage = lisser({ reduit });

// Sans WebGL : html.sans-3d. La page prend alors le relais pour le grand mot de chaque partie et le passage au clair ;
// la scène, elle, peint son repli 2D (monde.repli === true).
function webglPossible() {
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    if (!gl) return false;
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch { return false; }
}
let sans3d = false, dernierMot = '';
function passerSans3d() { sans3d = true; racine.classList.add('sans-3d'); dernierMot = ''; }
if (!webglPossible()) passerSans3d();

/** Appelle une méthode de la scène si elle existe, sans jamais casser la page. */
function appel(obj, nom, ...args) {
  try { if (obj && typeof obj[nom] === 'function') return obj[nom](...args); } catch (e) { if (debug) console.info('monde.' + nom, e && e.message); }
  return undefined;
}

// ------------------------------------------------------------------------------------------------ chargement et ouverture

const chargement = document.getElementById('chargement');
const chEtat = document.getElementById('ch-etat');
const chJauge = document.getElementById('ch-jauge');
let ouvert = racine.classList.contains('ouvert');
let charge = false, mondePret = false, abandon = false;

function ouvrir() {
  if (ouvert) return;
  ouvert = true;
  racine.classList.add('ouvert');
}
function finirChargement() {
  if (charge) return;
  charge = true;
  racine.classList.add('charge');
  setTimeout(() => { if (chargement) chargement.hidden = true; }, reduit ? 2200 : 1600);
}
/** La progression du chargement (0 à 1), sous toutes les formes que la scène peut lui donner. */
function progressionChargement(v) {
  if (charge || !chJauge) return;
  let p = v;
  if (v && typeof v === 'object') p = v.progression ?? v.p ?? v.fraction ?? v.avancement ?? (v.total ? v.fait / v.total : NaN);
  p = Number(p);
  if (!Number.isFinite(p)) return;
  if (p > 1.001) p /= 100;
  p = borne(p);
  racine.classList.add('ch-mesure');
  chJauge.style.strokeDashoffset = (1 - p).toFixed(4);
  if (chEtat) chEtat.textContent = `Préparation de la scène · ${Math.round(p * 100)} %`;
}
// déjà plus bas dans la page (retour, lien vers une partie) : le titre d'ouverture est hors de vue, inutile de l'attendre
if (scrollY > innerHeight * 0.3 || (location.hash && location.hash !== '#ouverture')) ouvrir();

/** Le seul plafond : 15 s sans « pret », ou une erreur. Le titre arrive sans 3D. */
function abandonner(raison) {
  if (abandon || mondePret) return;
  abandon = true;
  clearTimeout(plafond);
  if (debug) console.info('Scène abandonnée :', raison);
  passerSans3d();
  racine.classList.add('scene-absente');
  finirChargement();
  ouvrir();
  if (monde) { const m = monde; monde = null; appel(m, 'detruire'); }
}
const plafond = setTimeout(() => abandonner('15 s sans première image'), 15000);

/** Attend la fin de l'ouverture du monde, quelle que soit la forme qu'il lui donne. */
function attendreOuverture(m) {
  const fin = m && m.ouvertureFinie;
  if (fin && typeof fin.then === 'function') return fin;
  if (typeof fin === 'function') { try { const r = fin(); if (r && typeof r.then === 'function') return r; if (r === true) return Promise.resolve(); } catch {} }
  if (fin === true) return Promise.resolve();
  return new Promise((ok) => {
    for (const nom of ['ouvertureFinie', 'monde:ouverture-finie', 'kazura:ouverture-finie']) {
      addEventListener(nom, ok, { once: true });
      document.addEventListener(nom, ok, { once: true });
    }
  });
}

// ------------------------------------------------------------------------------------------------ la scène

let monde = null;
let dernierePosition = '';

async function lancerMonde() {
  const canvas = document.getElementById('monde');
  if (!canvas) { abandonner('pas de canevas'); return; }
  try {
    const mod = await import('../monde/monde.js');
    if (typeof mod.lancer !== 'function') throw new Error('monde.js n’expose pas lancer()');
    const m = await mod.lancer({ canvas, reduit, mobile });
    if (!m) throw new Error('lancer() ne renvoie rien');
    if (abandon) { appel(m, 'detruire'); return; } // arrivée après le plafond : on libère tout
    monde = m;
    if (monde.repli === true) passerSans3d();
    if (typeof monde.surChargement === 'function') { try { monde.surChargement(progressionChargement); } catch {} }
    const quandPret = () => {
      if (abandon) return;
      mondePret = true;
      clearTimeout(plafond);
      if (monde.repli === true) passerSans3d(); // la scène a pu se replier en 2D après une erreur
      finirChargement();
      racine.classList.add('monde-vivant');
      // le titre se pose quand le sceau a fini de naître ; la page n'accélère rien. Un filet très tardif seulement,
      // si la scène ne prévenait jamais (30 s après la première image) : le titre arrive, l'ouverture continue.
      attendreOuverture(monde).then(ouvrir, ouvrir);
      setTimeout(ouvrir, 30000);
    };
    if (monde.pret && typeof monde.pret.then === 'function') monde.pret.then(quandPret, (e) => abandonner('erreur de la scène : ' + (e && e.message)));
    else quandPret();
    brancherSalle();
    dernierePosition = '';
    mesurer();
  } catch (e) {
    abandonner('scène indisponible : ' + (e && e.message));
  }
}
addEventListener('error', (e) => { if (!mondePret && e && e.filename && /\/monde\//.test(e.filename)) abandonner('erreur dans la scène'); });
addEventListener('unhandledrejection', (e) => { const s = String(e && e.reason && (e.reason.stack || e.reason)); if (!mondePret && /\/monde\//.test(s)) abandonner('promesse rejetée dans la scène'); });

// ------------------------------------------------------------------------------------------------ le défilement

const tete = document.getElementById('tete');
const hud = document.getElementById('hud');
const sections = SECTIONS.map((id) => document.getElementById(id)).filter(Boolean);
// v16 : la navigation est la même sur toutes les pages ; ici, le lien de la partie en cours s'allume (data-s)
const liensNav = [...document.querySelectorAll('.tete a[data-s]')];
const NAV_DE = { ouverture: 'ouverture', promesse: 'ouverture', experiences: 'experiences', realisations: 'realisations', rever: 'rever', deroule: 'deroule', questions: 'questions', contact: 'contact' };
const indexHud = [...document.querySelectorAll('#hud-index li')];
const gSection = document.getElementById('g-section');
const hudP = document.getElementById('hud-p');
let sectionActuelle = 'ouverture';
let prevu = false;

function sectionCourante() {
  const repere = innerHeight * 0.45;
  let courante = sections[0];
  for (const s of sections) { if (s.getBoundingClientRect().top <= repere) courante = s; else break; }
  return courante || sections[0];
}

let dernierY = -1;
// Au téléphone, le panneau 3D actif tient dans l'espace réellement libre entre le titre de la partie et la légende du
// site actif : cet espace bouge avec le défilement, on le mesure à chaque image (il mordait sur « 01 / 04 »).
let dernierCadre = '';
function cadrerSalle() {
  if (!monde || !monde.realisations || innerWidth >= innerHeight) return;
  const titre = document.querySelector('#realisations .r-sous') || document.getElementById('titre-realisations');
  const leg = document.querySelector('#oeuvres .oeuvre.actif .o-legende, #oeuvres .o-legende');
  if (!titre || !leg) return;
  const H = innerHeight;
  const haut = Math.max(titre.getBoundingClientRect().bottom + 14, H * 0.08);
  const bas = Math.min(leg.getBoundingClientRect().top - 14, H * 0.92);
  if (bas - haut < H * 0.12) return;
  const c = { cx: 0.5, cy: (haut + bas) / 2 / H, l: 0.84, hMax: (bas - haut) / H };
  const cle = c.cy.toFixed(3) + c.hMax.toFixed(3);
  if (cle === dernierCadre) return;
  dernierCadre = cle;
  appel(monde.realisations, 'cadrer', { tel: c });
  // l'indication « Faites tourner » se pose sur le panneau
  salle?.style.setProperty('--ri-y', (c.cy * 100).toFixed(1) + 'vh');
}

function mesurer() {
  prevu = false;
  const y = scrollY;
  dernierY = y;
  const max = Math.max(1, racine.scrollHeight - innerHeight);
  const p = borne(y / max);
  const s = sectionCourante();
  const id = s ? s.id : 'ouverture';
  const r = s ? s.getBoundingClientRect() : { top: 0, height: 1 };
  const locale = borne((innerHeight * 0.45 - r.top) / Math.max(1, r.height));

  if (monde) {
    const cle = p.toFixed(4) + id + locale.toFixed(3);
    if (cle !== dernierePosition) { dernierePosition = cle; appel(monde, 'progression', p, id, locale); }
    if (id === 'realisations') cadrerSalle();
  }

  if (id !== sectionActuelle) {
    sectionActuelle = id;
    for (const li of indexHud) li.classList.toggle('actif', li.dataset.s === id);
    if (gSection) gSection.textContent = (indexHud.find((li) => li.dataset.s === id)?.textContent || '').trim();
    const n = NAV_DE[id];
    for (const a of liensNav) {
      const ici = a.dataset.s === n;
      a.classList.toggle('ici', ici);
      // aria-current seulement pour les ancres de cette page (les liens vers une autre page n'en portent pas ici)
      if (ici && a.getAttribute('href').startsWith('#')) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    }
    racine.classList.toggle('violet', VIOLETTES.has(id));
  }
  tete.classList.toggle('colle', y > 24);
  if (hudP) hudP.textContent = 'p ' + p.toFixed(3).replace(/^0/, '');
  if (hud) hud.style.setProperty('--croix-y', (-(y * (reduit ? 0.05 : 0.14)) % 180).toFixed(1) + 'px');

  derouleAuDefilement();
  majPassages(performance.now());
  if (sans3d) motDeFond(id, locale);
}
const demander = () => { if (!prevu) { prevu = true; requestAnimationFrame(mesurer); } };
// v15 : pendant un glissé lissé, la scène et tout ce qui suit le défilement sont posés DANS la même image que la page
// (surImage), pas une image plus tard : le texte et la 3D bougent ensemble, sans décalage qui se sent comme un saut.
lissage.surImage(() => mesurer());
addEventListener('scroll', () => { if (Math.abs(scrollY - dernierY) > 0.5) demander(); }, { passive: true });
addEventListener('resize', () => { mesurerPassages(); dernierY = -1; demander(); });

// ------------------------------------------------------------------------------------------------ le grand mot (sans WebGL)

const MOTS = { ouverture: ['KAZURA'], promesse: ['RECOMMANDÉ', 'CHERCHÉ', 'TROUVÉ'], experiences: ['EXPÉRIENCES'], realisations: ['RÉALISATIONS'],
  rever: ['RÊVER'], deroule: ['CHEMIN'], matheo: ['ATELIER'], questions: ['QUESTIONS'], contact: ['KAZURA'] };
const motFond = document.getElementById('mot-fond');
const motTextes = [document.getElementById('mot-masque'), document.getElementById('mot-trait')];
let minuterieMot = 0;
function motDeFond(id, locale) {
  if (!motFond) return;
  const liste = MOTS[id] || ['KAZURA'];
  const mot = liste[Math.min(liste.length - 1, Math.floor(locale * liste.length))];
  motFond.style.setProperty('--mot-x', ((0.5 - locale) * (reduit ? 8 : 26)).toFixed(2));
  if (mot === dernierMot) return;
  const premier = !dernierMot;
  dernierMot = mot;
  clearTimeout(minuterieMot);
  const poser = () => { for (const t of motTextes) if (t) t.textContent = mot; motFond.classList.remove('change'); };
  if (premier) { poser(); return; }
  motFond.classList.add('change');
  minuterieMot = setTimeout(poser, reduit ? 520 : 380);
}

// ------------------------------------------------------------------------------------------------ le jour et la nuit

// L'encre suit le fond réel : si la scène dit qu'elle est claire (etat().clair), on la croit ; sinon (scène absente,
// sans WebGL), la page peint elle-même le jour de secours dans les parties claires.
const themeMeta = document.querySelector('meta[name="theme-color"]');
let jour = null, secours = null, clairScene = 0, depuisJour = 0;
function regleJour(e) {
  const c = e && e.clair != null ? Number(e.clair) : null;
  const sec = c == null || Number.isNaN(c) || sans3d && !(monde && monde.repli);
  const j = sec ? CLAIRES.has(sectionActuelle) : c > 0.5;
  clairScene = sec ? null : c;
  if (sec !== secours) { secours = sec; racine.classList.toggle('jour-secours', sec); }
  // v16 : sans scène, la page peint elle-même le violet de « Osez rêver » (le fond .fond passe au violet)
  racine.classList.toggle('violet-secours', sec && VIOLETTES.has(sectionActuelle));
  if (j !== jour) {
    jour = j;
    depuisJour = performance.now();
    // v15 : au changement d'encre, les bandeaux (fond et lettres) basculent ensemble, sans fondu décalé : sinon, une
    // demi-seconde, on lisait du clair sur clair (le fond du bandeau ne peut pas se fondre, ses lettres si)
    racine.classList.add('bascule');
    racine.classList.toggle('jour', j);
    requestAnimationFrame(() => requestAnimationFrame(() => racine.classList.remove('bascule')));
    if (themeMeta) themeMeta.setAttribute('content', j ? '#e4e9ea' : '#05070b');
  }
}

// ------------------------------------------------------------------------------------------------ les passages en escalier

// Seulement quand il n'y a PAS de scène du tout (ni 3D ni repli 2D) : entre les réalisations et « Osez rêver » (vers le
// clair), et entre le déroulé et l'atelier (vers la nuit), un rideau monte avec le défilement et couvre l'écran au
// moment où le jour de secours change de monde ; puis il repart par le haut. v15 : plus de marches à bord net, un bord
// fondu (un dégradé de masque sur un cinquième d'écran), pour qu'aucune couture ne se voie. Dès que la scène donne
// etat().clair (3D comme repli 2D), ce sont ses tranches qui font le passage : le rideau de la page ne sort pas.
const PASSAGES = [
  { el: document.getElementById('passage-clair'), vers: 'rever', clair: true },
  { el: document.getElementById('passage-nuit'), vers: 'matheo', clair: false },
].filter((p) => p.el && document.getElementById(p.vers));
for (const P of PASSAGES) {
  P.fond = P.el.querySelector('.pa-fond');
  P.mot = P.el.querySelector('.pa-mot');
  P.legende = P.el.querySelector('.pa-legende');
  P.g = 0; P.depuis = 0; P.B = 0; P.vu = false;
}
function mesurerPassages() {
  for (const P of PASSAGES) {
    const s = document.getElementById(P.vers);
    P.B = s.getBoundingClientRect().top + scrollY - innerHeight * 0.45;
  }
}
let derniereMaj = 0;
const lisse3 = (v) => v * v * (3 - 2 * v);
function majPassages(t) {
  const dt = Math.min(0.1, derniereMaj ? (t - derniereMaj) / 1000 : 0.016);
  derniereMaj = t;
  const H = innerHeight, y = scrollY;
  const Z = H * 0.8;
  const sceneLa = clairScene != null && !!monde;
  for (const P of PASSAGES) {
    if (sceneLa) { if (P.vu) { P.vu = false; P.el.classList.remove('vu'); } continue; }
    const monte = borne((y - (P.B - Z)) / Z);
    const confirme = jour === P.clair && t - depuisJour > (reduit ? 1500 : 1150);
    const passe = y >= P.B - 2;
    if (passe && !P.depuis) P.depuis = t;
    if (!passe) P.depuis = 0;
    const cible = passe && (confirme || t - P.depuis > 2600) ? 1 : 0;
    // le départ : une glissade douce dans le temps
    const tau = reduit ? 0.42 : 0.3;
    P.g += (cible - P.g) * (1 - Math.exp(-dt / tau));
    if (Math.abs(cible - P.g) < 0.002) P.g = cible;
    const visible = monte > 0.001 && P.g < 0.999;
    if (visible !== P.vu) { P.vu = visible; P.el.classList.toggle('vu', visible); }
    if (!visible) continue;
    // le bord haut monte avec le défilement, le bord bas part avec P.g ; chacun fondu sur 22 % de l'écran
    const F = 22;
    const haut = lisse3(monte) * (100 + F), bas = lisse3(P.g) * (100 + F);
    P.fond.style.setProperty('--pa-haut', haut.toFixed(2) + '%');
    P.fond.style.setProperty('--pa-bas', bas.toFixed(2) + '%');
    if (P.mot) P.mot.style.translate = `${((1 - monte) * (P.clair ? 18 : -18) - P.g * (P.clair ? 10 : -10)).toFixed(2)}vw 0`;
    if (P.legende) {
      P.legende.style.translate = `0 ${Math.max(70, H * (1 - haut / 100) + 20)}px`;
      P.legende.style.opacity = (borne(monte * 3) * (1 - P.g) * borne((haut - F) / 30)).toFixed(3);
    }
  }
}

// ------------------------------------------------------------------------------------------------ le gyroscope

const G = {
  x: document.getElementById('g-x'), y: document.getElementById('g-y'), z: document.getElementById('g-z'), w: document.getElementById('g-w'),
  a1: document.getElementById('g-a1'), a2: document.getElementById('g-a2'),
  lx: document.getElementById('g-lx'), ly: document.getElementById('g-ly'), lz: document.getElementById('g-lz'),
  px: document.getElementById('g-px'), py: document.getElementById('g-py'), pz: document.getElementById('g-pz'),
  fps: document.getElementById('g-fps'),
};
const R_ANNEAU = 40, R_AXE = 32;

/** Fait tourner le vecteur v par le quaternion q = [x, y, z, w]. */
function tourner(q, v) {
  const [x, y, z, w] = q, [vx, vy, vz] = v;
  const tx = 2 * (y * vz - z * vy), ty = 2 * (z * vx - x * vz), tz = 2 * (x * vy - y * vx);
  return [vx + w * tx + (y * tz - z * ty), vy + w * ty + (z * tx - x * tz), vz + w * tz + (x * ty - y * tx)];
}
function produit(a, b) {
  const [ax, ay, az, aw] = a, [bx, by, bz, bw] = b;
  return [aw * bx + ax * bw + ay * bz - az * by, aw * by - ax * bz + ay * bw + az * bx, aw * bz + ax * by - ay * bx + az * bw, aw * bw - ax * bx - ay * by - az * bz];
}
function lireQuaternion(Q) {
  if (!Q) return null;
  let q = null;
  if (Array.isArray(Q) || ArrayBuffer.isView(Q)) q = [Q[0], Q[1], Q[2], Q[3]];
  else if (typeof Q === 'object' && 'x' in Q) q = [Q.x, Q.y, Q.z, Q.w];
  if (!q || q.some((n) => typeof n !== 'number' || Number.isNaN(n))) return null;
  const l = Math.hypot(...q) || 1;
  return q.map((n) => n / l);
}
/** Sans quaternion de la scène : une lente rotation de respiration, pour que le décor reste vivant. */
function quaternionLibre(t) {
  const a = t * (reduit ? 0.12 : 0.24), b = Math.sin(t * 0.31) * 0.28;
  return produit([0, Math.sin(a / 2), 0, Math.cos(a / 2)], [Math.sin(b / 2), 0, 0, Math.cos(b / 2)]);
}
const fmt = (n) => (n < -0.004 ? '-' : '') + Math.abs(n).toFixed(2).replace(/^0/, '');
function anneau(q, axeA, axeB) {
  let d = '';
  for (let k = 0; k <= 48; k++) {
    const a = (k / 48) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
    const v = tourner(q, [axeA[0] * c + axeB[0] * s, axeA[1] * c + axeB[1] * s, axeA[2] * c + axeB[2] * s]);
    d += (k ? 'L' : 'M') + (v[0] * R_ANNEAU).toFixed(1) + ' ' + (-v[1] * R_ANNEAU).toFixed(1);
  }
  return d;
}
function poserAxe(q, axe, ligne, point) {
  const v = tourner(q, axe);
  const x = (v[0] * R_AXE).toFixed(1), y = (-v[1] * R_AXE).toFixed(1);
  ligne.setAttribute('x2', x); ligne.setAttribute('y2', y);
  point.setAttribute('transform', `translate(${x} ${y})`);
  point.classList.toggle('derriere', v[2] < -0.05);
  return v[2];
}
function dessinerGyro(q) {
  if (!G.a1) return;
  G.a1.setAttribute('d', anneau(q, [1, 0, 0], [0, 0, 1]));
  G.a2.setAttribute('d', anneau(q, [0, 1, 0], [0, 0, 1]));
  const prof = [['x', poserAxe(q, [1, 0, 0], G.lx, G.px)], ['y', poserAxe(q, [0, 1, 0], G.ly, G.py)], ['z', poserAxe(q, [0, 0, 1], G.lz, G.pz)]];
  prof.sort((a, b) => a[1] - b[1]);
  for (const [n] of prof) G['p' + n].parentNode.appendChild(G['p' + n]);
}

let dernierTexte = 0, compteImages = 0, debutCompte = 0, fpsPropre = 0;
function boucle(t) {
  requestAnimationFrame(boucle);
  compteImages++;
  if (t - debutCompte > 1000) { fpsPropre = Math.round(compteImages * 1000 / (t - debutCompte)); compteImages = 0; debutCompte = t; }
  // les marches des passages repartent dans le temps : on les suit à chaque image tant qu'elles bougent
  if (PASSAGES.some((P) => P.vu)) majPassages(t);
  // v15 : à chaque image (le gyroscope suit le sceau, qui suit le défilement : à 30 i/s, il marchait par à-coups)
  const e = monde ? appel(monde, 'etat') : null;
  regleJour(e);
  if (!ouvert || document.hidden) return;
  const q = lireQuaternion(e && e.quaternion) || quaternionLibre(t / 1000);
  dessinerGyro(q);
  if (t - dernierTexte > 120) {
    dernierTexte = t;
    if (G.x) { G.x.textContent = fmt(q[0]); G.y.textContent = fmt(q[1]); G.z.textContent = fmt(q[2]); G.w.textContent = fmt(q[3]); }
    const f = e && typeof e.fps === 'number' ? Math.round(e.fps) : fpsPropre;
    if (G.fps) G.fps.textContent = (f ? deux(f) : '--') + ' i/s';
  }
}

// ------------------------------------------------------------------------------------------------ les lettres brouillées

const GLYPHES = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+=/<>';
const auHasard = () => GLYPHES[(Math.random() * GLYPHES.length) | 0];

/** Révèle le texte d'un élément lettre à lettre, avec un petit curseur de signes brouillés en tête. Moins d'une seconde. */
function brouiller(el) {
  const marcheur = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const morceaux = [];
  let total = 0;
  for (let n = marcheur.nextNode(); n; n = marcheur.nextNode()) {
    if (!n.data.trim()) continue;
    morceaux.push({ n, s: n.data, o: total });
    total += n.data.length;
  }
  if (!total) return;
  for (const m of morceaux) {
    m.vu = document.createTextNode('');
    m.cur = document.createElement('span'); m.cur.className = 'br-curseur'; m.cur.setAttribute('aria-hidden', 'true');
    m.reste = document.createElement('span'); m.reste.className = 'br-reste'; m.reste.textContent = m.s;
    m.n.replaceWith(m.vu, m.cur, m.reste);
  }
  const duree = reduit ? Math.min(560, 200 + total * 6) : Math.min(820, 240 + total * 10);
  const largeur = reduit ? 2 : 4;
  let debut = 0, dernierHasard = 0;
  const pas = (t) => {
    if (!debut) debut = t;
    const k = borne((t - debut) / duree);
    const R = Math.floor(k * total);
    const changer = t - dernierHasard > (reduit ? 90 : 45);
    if (changer) dernierHasard = t;
    for (const m of morceaux) {
      const L = m.s.length;
      const r = borne(R - m.o, 0, L);
      const c = borne(R + largeur - m.o, 0, L) - r;
      if (m.vu.data.length !== r) m.vu.data = m.s.slice(0, r);
      if (changer || m.cur.textContent.length !== c) {
        let brouille = '';
        for (let i = 0; i < c; i++) { const ch = m.s[r + i]; brouille += ch === ' ' || ch === ' ' ? ch : auHasard(); }
        m.cur.textContent = brouille;
      }
      const reste = m.s.slice(r + c);
      if (m.reste.textContent !== reste) m.reste.textContent = reste;
    }
    if (k < 1) requestAnimationFrame(pas);
    else for (const m of morceaux) { m.cur.remove(); m.reste.remove(); m.vu.replaceWith(m.n); }
  };
  requestAnimationFrame(pas);
}

function apparitions() {
  if (!('IntersectionObserver' in window)) {
    document.querySelectorAll('.apparait, [data-brouille]').forEach((el) => el.classList.add('vu'));
    return;
  }
  const io = new IntersectionObserver((entrees) => {
    let rang = 0;
    for (const e of entrees) {
      if (!e.isIntersecting) continue;
      io.unobserve(e.target);
      const el = e.target;
      if (el.hasAttribute('data-brouille')) {
        const attente = rang++ * (reduit ? 120 : 90);
        setTimeout(() => {
          el.classList.add('vu');
          setTimeout(() => brouiller(el), el.querySelector('.bd') && !el.closest('.partie-claire') ? (reduit ? 340 : 240) : 60);
        }, attente);
      } else el.classList.add('vu');
    }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
  document.querySelectorAll('.apparait, [data-brouille]').forEach((el) => io.observe(el));
  racine.classList.add('anime');
}

// ------------------------------------------------------------------------------------------------ le menu du téléphone

const menu = document.getElementById('menu');
if (menu) {
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) menu.open = false; });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && menu.open) { menu.open = false; menu.querySelector('summary').focus(); } });
  matchMedia('(min-width: 1200px)').addEventListener('change', (m) => { if (m.matches) menu.open = false; });
}

// ------------------------------------------------------------------------------------------------ les réalisations

// Un écran : le titre en haut, le panneau 3D au centre (la scène), en bas la légende du site actif (nom, métier, phrase,
// « Voir le site ») et la rangée de TOUS les sites de la sélection, en vignettes cliquables. Un clic sur une vignette
// met ce site en grand (et la scène y va : realisations.aller(i)). Flèches, clavier et glisser au doigt en plus.
// Le défilement de la page traverse la partie normalement : il ne change jamais de site.
const salle = document.getElementById('salle');
const salleScene = document.getElementById('salle-scene');
const oeuvresEl = document.getElementById('oeuvres');
const vignettesEl = document.getElementById('vignettes');
const compte = document.getElementById('o-compte');
const bPrec = document.getElementById('o-prec'), bSuiv = document.getElementById('o-suiv');
let oeuvres = [], N = 0, courant = -1;

function montrer(i, source) {
  if (!N) return;
  i = ((i % N) + N) % N;
  if (i === courant) return;
  const sens = courant < 0 ? 0 : ((i - courant + N) % N) <= N / 2 ? 1 : -1;
  courant = i;
  if (salleScene) salleScene.style.setProperty('--sens', sens);
  oeuvres.forEach((o, k) => {
    o.classList.toggle('actif', k === i);
    o.setAttribute('aria-hidden', k === i ? 'false' : 'true');
    o.inert = k !== i;
  });
  vignettesEl?.querySelectorAll('button').forEach((b, k) => b.setAttribute('aria-pressed', String(k === i)));
  // la vignette active reste visible dans la rangée (téléphone, ou plus de sites que de place)
  const vb = vignettesEl?.querySelectorAll('button')[i];
  if (vb && vignettesEl.scrollWidth > vignettesEl.clientWidth + 2) {
    const l = vb.offsetLeft - (vignettesEl.clientWidth - vb.offsetWidth) / 2;
    vignettesEl.scrollTo({ left: l, behavior: reduit || source === 'debut' ? 'instant' : 'smooth' });
  }
  if (compte) compte.innerHTML = `<b>${deux(i + 1)}</b> / ${deux(N)}`;
  if (salleScene) salleScene.style.setProperty('--teinte', oeuvres[i].dataset.couleur || 'transparent');
  if (source !== 'monde' && monde) appel(monde.realisations, 'aller', i);
}

function preparerSalle() {
  if (!salle || !oeuvresEl) return;
  const sites = selection();
  N = sites.length;
  oeuvresEl.innerHTML = sites.map((s, i) => oeuvreHTML(s, i, N)).join('');
  oeuvres = [...oeuvresEl.querySelectorAll('.oeuvre')];
  if (!N) { salle.hidden = true; return; }
  oeuvres.forEach((o) => { o.setAttribute('aria-roledescription', 'diapositive'); const im = o.querySelector('img'); if (im) im.loading = 'eager'; });
  if (vignettesEl) {
    vignettesEl.innerHTML = sites.map((x, k) => vignetteHTML(x, k)).join('');
    vignettesEl.querySelectorAll('button').forEach((b, k) => b.addEventListener('click', () => { finirIndice(); montrer(k); }));
  }
  const pilote = document.getElementById('pilote');
  if (pilote && N > 1) pilote.hidden = false;
  racine.classList.add('salle-prete');
  courant = -1;
  montrer(0, 'debut');
  bPrec?.addEventListener('click', () => { finirIndice(); montrer(courant - 1); });
  bSuiv?.addEventListener('click', () => { finirIndice(); montrer(courant + 1); });
  surveillerIndice();
  // le clavier : flèches gauche et droite, quand la salle est à l'écran (et qu'on n'écrit pas dans un champ)
  addEventListener('keydown', (e) => {
    if (sectionActuelle !== 'realisations' || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.target.closest && e.target.closest('input, textarea, select, [contenteditable]')) return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); finirIndice(); montrer(courant - 1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); finirIndice(); montrer(courant + 1); }
  });

  // le doigt et la souris : un glissement horizontal fait tourner la salle ; le vertical reste au défilement
  let x0 = 0, y0 = 0, dx = 0, sens = null, id = null;
  const fin = (e) => {
    // un clic sans glisser, hors des commandes et des textes : un panneau voisin vient de face
    if (sens === null && id !== null && e && e.type === 'pointerup' && Math.hypot(e.clientX - x0, e.clientY - y0) < 8) clicPanneau(e);
    if (sens === 'h') {
      const seuil = Math.min(80, innerWidth * 0.12);
      if (dx < -seuil) montrer(courant + 1); else if (dx > seuil) montrer(courant - 1);
    }
    sens = null; id = null; dx = 0;
    salleScene.classList.remove('glisse');
    salleScene.style.setProperty('--glisse', '0px');
    salleScene.style.setProperty('--glisse-r', '0');
    if (monde) appel(monde.realisations, 'glisser', 0);
  };
  salle.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || e.target.closest('a, button, .vignettes, .o-legende, .pilote, .r-tete')) return;
    x0 = e.clientX; y0 = e.clientY; dx = 0; sens = null; id = e.pointerId;
  });
  salle.addEventListener('pointermove', (e) => {
    if (id !== e.pointerId) return;
    dx = e.clientX - x0;
    const dy = e.clientY - y0;
    if (!sens) {
      if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy) * 1.2) { sens = 'h'; finirIndice(); salleScene.classList.add('glisse'); try { salle.setPointerCapture(id); } catch {} }
      else if (Math.abs(dy) > 10) { id = null; return; }
    }
    if (sens !== 'h') return;
    const frac = borne(dx / innerWidth, -1, 1);
    salleScene.style.setProperty('--glisse', (dx * 0.55).toFixed(1) + 'px');
    salleScene.style.setProperty('--glisse-r', (frac * -18).toFixed(2));
    if (monde) appel(monde.realisations, 'glisser', dx);
  });
  salle.addEventListener('pointerup', fin);
  salle.addEventListener('pointercancel', fin);
  salle.addEventListener('lostpointercapture', () => { if (sens === 'h') fin(); });
}

// v16 : l'indication « Faites tourner », au premier passage. Elle s'allume quand la salle est bien à l'écran, et
// s'efface pour de bon au premier geste du visiteur (glisser, flèche, vignette, clavier, clic sur un panneau).
// Les changements venus de la scène (sa rotation d'invitation) ne comptent pas comme un geste.
const indice = document.getElementById('r-indice');
let indiceFini = false, minuterieIndice = 0;
function finirIndice() {
  if (indiceFini) return;
  indiceFini = true;
  clearTimeout(minuterieIndice);
  salle?.classList.remove('indice-la');
  salle?.classList.add('indice-fini');
}
function surveillerIndice() {
  if (!indice || !salle || !('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver(([e]) => {
    clearTimeout(minuterieIndice);
    if (indiceFini) { io.disconnect(); return; }
    if (e.isIntersecting && e.intersectionRatio > 0.6) minuterieIndice = setTimeout(() => salle.classList.add('indice-la'), reduit ? 900 : 650);
    else salle.classList.remove('indice-la');
  }, { threshold: [0, 0.6, 0.9] });
  io.observe(salle);
}

/** Un clic dans la salle, hors des commandes : la scène dit quel panneau est sous le doigt (realisations.choisirEn,
 *  si elle l'expose) ; sinon, à gauche du panneau de face, le site précédent, à droite, le suivant. */
function clicPanneau(e) {
  const x = e.clientX / innerWidth, y = e.clientY / innerHeight;
  const R = monde && monde.realisations;
  for (const nom of ['choisirEn', 'panneauEn', 'indiceEn']) {
    if (R && typeof R[nom] === 'function') {
      const k = appel(R, nom, x, y);
      if (Number.isInteger(k) && k >= 0) { finirIndice(); if (k !== courant) montrer(k); }
      return;
    }
  }
  const portrait = innerWidth < innerHeight;
  const c = portrait ? { cx: 0.5, l: 0.84 } : { cx: 0.63, l: 0.44 };
  if (x < c.cx - c.l / 2) { finirIndice(); montrer(courant - 1); }
  else if (x > c.cx + c.l / 2) { finirIndice(); montrer(courant + 1); }
}

/** Quand la scène sait afficher les panneaux en 3D, on lui donne les sites et l'image en DOM s'efface. */
function brancherSalle() {
  const R = monde && monde.realisations;
  if (!R || typeof R.definir !== 'function' || monde.repli === true || !N) return;
  const sites = oeuvres.map((o) => {
    const image = new URL(mobile ? o.dataset.petit : o.dataset.image, location.href).href;
    // les autres écrans du site (realisations/sites.js, « ecrans ») : le panneau 3D les fait défiler
    const fiche = selection().find((x) => x.id === o.dataset.id);
    const autres = (fiche?.captures?.ecrans || []).map((f) => new URL('realisations/img/' + (mobile ? f.replace(/\.webp$/, '-800.webp') : f), location.href).href);
    return { id: o.dataset.id, image, images: [image, ...autres].slice(0, 4), couleur: o.dataset.couleur || '#6ee7b7' };
  });
  try { R.definir(sites); } catch (e) { if (debug) console.info('realisations.definir', e && e.message); return; }
  racine.classList.add('salle-3d');
  appel(R, 'aller', Math.max(0, courant));
  appel(R, 'surChangement', (i) => {
    const k = Number(i);
    if (!Number.isInteger(k) || k === courant) return;
    montrer(k, 'monde');
  });
}

// ------------------------------------------------------------------------------------------------ l'invitation aux expériences

function preparerInvitation() {
  const el = document.getElementById('xp-cartes');
  if (!el) return;
  el.innerHTML = invitationHTML(pretes());
  el.style.setProperty('--n', Math.min(3, pretes().length));
}

// ------------------------------------------------------------------------------------------------ « Osez rêver » : les prix

// v16 : le collage est retiré. Le bloc de prix et la réponse « Combien coûte un site ? » suivent UN réglage
// (js/reglages.js, AFFICHER_PRIX). La page les réécrit d'après ce réglage : même si la version sans JavaScript n'a pas
// été régénérée, ce qu'on voit avec JavaScript respecte toujours le réglage.
function preparerPrix() {
  const bloc = document.getElementById('rv-prix');
  if (bloc) { bloc.innerHTML = prixHTML(reglages); bloc.hidden = !reglages.AFFICHER_PRIX; }
  const faq = document.getElementById('faq-prix');
  if (faq) faq.innerHTML = faqPrixHTML(reglages);
  racine.classList.toggle('prix-affiches', !!reglages.AFFICHER_PRIX);
}

// ------------------------------------------------------------------------------------------------ le déroulé

const moments = [...document.querySelectorAll('#chemin .moment')];
const drMot = document.getElementById('dr-mot');
const drFil = [...document.querySelectorAll('#dr-fil li')];
let momentActuel = -1, minuterieDr = 0;
function derouleAuDefilement() {
  if (!moments.length || !drMot) return;
  const ligne = innerHeight * 0.55;
  let k = 0;
  for (let i = 0; i < moments.length; i++) if (moments[i].getBoundingClientRect().top <= ligne) k = i;
  if (k === momentActuel) return;
  const premier = momentActuel < 0;
  momentActuel = k;
  drFil.forEach((li, i) => { li.classList.toggle('fait', i < k); li.classList.toggle('actif', i === k); });
  moments.forEach((m, i) => m.classList.toggle('actif', i === k));
  const mot = moments[k].dataset.qui || '';
  clearTimeout(minuterieDr);
  if (premier) { drMot.textContent = mot; return; }
  drMot.classList.add('change');
  minuterieDr = setTimeout(() => { drMot.textContent = mot; drMot.classList.remove('change'); }, reduit ? 300 : 220);
}

// ------------------------------------------------------------------------------------------------ le formulaire

const TEL = '33630110038';
const COURRIEL = 'matheo@kazura.fr';
const form = document.getElementById('formulaire');

function message() {
  const val = (id) => (document.getElementById(id)?.value || '').trim().replace(/\s+/g, ' ');
  const prenom = val('f-prenom');
  const activite = val('f-activite');
  const projet = (document.getElementById('f-projet')?.value || '').trim();
  const situation = form.querySelector('input[name="situation"]:checked')?.value || '';
  const lignes = ['Bonjour Mathéo,', ''];
  const moi = [];
  if (prenom) moi.push(`Je m’appelle ${prenom}.`);
  if (activite) moi.push(`Mon activité : ${activite}.`.replace(/\.\.$/, '.'));
  if (moi.length) lignes.push(moi.join(' '));
  if (situation) lignes.push(situation);
  if (projet) lignes.push('', projet);
  lignes.push('', 'Pouvons-nous en parler ?');
  if (prenom) lignes.push('', prenom);
  return lignes.join('\n').replace(/\n{3,}/g, '\n\n');
}

if (form) {
  const apercu = document.getElementById('f-apercu');
  const texte = document.getElementById('f-apercu-texte');
  const montrerMessage = () => { texte.textContent = message(); apercu.hidden = false; };
  form.addEventListener('input', montrerMessage);
  form.addEventListener('change', montrerMessage);
  montrerMessage();
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const canal = e.submitter?.dataset.canal || 'whatsapp';
    const m = message();
    if (canal === 'courriel') {
      location.href = `mailto:${COURRIEL}?subject=${encodeURIComponent('Mon projet de site')}&body=${encodeURIComponent(m)}`;
    } else {
      const url = `https://wa.me/${TEL}?text=${encodeURIComponent(m)}`;
      const w = window.open(url, '_blank');
      if (w) w.opener = null; else location.href = url;
    }
  });
}

// ------------------------------------------------------------------------------------------------ c'est parti

preparerInvitation();
preparerSalle();
preparerPrix();
apparitions();
mesurerPassages();
mesurer();
regleJour(null);
requestAnimationFrame(boucle);
addEventListener('load', () => { mesurerPassages(); demander(); });
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { mesurerPassages(); demander(); });
// la page s'allonge parfois après coup (images, polices) : les repères des passages suivent
if ('ResizeObserver' in window) new ResizeObserver(() => { mesurerPassages(); demander(); }).observe(document.body);
lancerMonde();
// pour les essais : window.kazura.lissage.aller(...)
window.kazura = { lissage, montrer: (i) => montrer(i) };
