// Kazura v14 : la page posée sur la scène 3D (monde/monde.js).
// - Le chargement : le sceau se dessine en traits fins tant que la scène se prépare (progression si monde.surChargement existe).
//   Il s'efface à « pret ». Le titre ne se pose qu'à « ouvertureFinie ». Seul plafond : 15 s sans « pret », ou une erreur :
//   le titre arrive alors sans 3D. La page n'appelle JAMAIS monde.passer() : seule la scène le fait, sur un geste du visiteur.
// - Le défilement lissé (js/lissage.js) ; la position lissée part vers la scène à chaque image (progression).
// - L'interface technique (index, gyroscope, croix), les lettres brouillées (moins d'une seconde par ligne).
// - Les réalisations : la sélection de realisations/sites.js, dans les deux sens (flèches, clavier, glisser, points).
// - Les affiches des expériences (js/experiences-liste.js) : aucune 3D d'expérience n'est chargée ici.
// - Les passages entre le sombre et le clair : un rideau en escalier lié au défilement.
// - Le message prérédigé du formulaire.
// Tout est défensif : si la scène n'expose pas une méthode, la page marche quand même. Sans ce script, tout se lit tel quel.

import { lisser } from './lissage.js';
import { selection } from '../realisations/sites.js';
import { pretes } from './experiences-liste.js';
import { oeuvreHTML, afficheHTML } from './gabarits.js';

window.kazuraPage = true;
const racine = document.documentElement;
const reduit = matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobile = matchMedia('(max-width: 799px), (pointer: coarse)').matches;
const SECTIONS = ['ouverture', 'promesse', 'experiences', 'realisations', 'rever', 'deroule', 'matheo', 'questions', 'contact'];
const CLAIRES = new Set(['rever', 'deroule']);
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
const liensNav = [...document.querySelectorAll('.nav a[href^="#"]')];
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

function mesurer() {
  prevu = false;
  const y = scrollY;
  const max = Math.max(1, racine.scrollHeight - innerHeight);
  const p = borne(y / max);
  const s = sectionCourante();
  const id = s ? s.id : 'ouverture';
  const r = s ? s.getBoundingClientRect() : { top: 0, height: 1 };
  const locale = borne((innerHeight * 0.45 - r.top) / Math.max(1, r.height));

  if (monde) {
    const cle = p.toFixed(4) + id + locale.toFixed(3);
    if (cle !== dernierePosition) { dernierePosition = cle; appel(monde, 'progression', p, id, locale); }
  }

  if (id !== sectionActuelle) {
    sectionActuelle = id;
    for (const li of indexHud) li.classList.toggle('actif', li.dataset.s === id);
    if (gSection) gSection.textContent = (indexHud.find((li) => li.dataset.s === id)?.textContent || '').trim();
    for (const a of liensNav) {
      if (a.getAttribute('href').slice(1) === id) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    }
  }
  tete.classList.toggle('colle', y > 24);
  if (hudP) hudP.textContent = 'p ' + p.toFixed(3).replace(/^0/, '');
  if (hud) hud.style.setProperty('--croix-y', (-(y * (reduit ? 0.05 : 0.14)) % 180).toFixed(1) + 'px');

  derouleAuDefilement();
  majPassages(performance.now());
  if (sans3d) motDeFond(id, locale);
}
const demander = () => { if (!prevu) { prevu = true; requestAnimationFrame(mesurer); } };
addEventListener('scroll', demander, { passive: true });
addEventListener('resize', () => { mesurerPassages(); demander(); });

// ------------------------------------------------------------------------------------------------ le grand mot (sans WebGL)

const MOTS = { ouverture: ['KAZURA'], promesse: ['RECOMMANDÉ', 'CHERCHÉ', 'TROUVÉ'], experiences: ['ESSAYER'], realisations: ['RÉALISATIONS'],
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
  if (j !== jour) {
    jour = j;
    depuisJour = performance.now();
    racine.classList.toggle('jour', j);
    if (themeMeta) themeMeta.setAttribute('content', j ? '#e4e9ea' : '#05070b');
  }
}

// ------------------------------------------------------------------------------------------------ les passages en escalier

// Entre les réalisations et « Osez rêver » (vers le clair), et entre le déroulé et l'atelier (vers la nuit) :
// un rideau en marches monte avec le défilement et couvre l'écran au moment où la scène change de monde ;
// quand la scène confirme le nouveau monde (etat().clair), les marches repartent par le haut. Rien n'est minuté :
// la montée suit le défilement, le départ suit la scène.
const PASSAGES = [
  { el: document.getElementById('passage-clair'), vers: 'rever', clair: true },
  { el: document.getElementById('passage-nuit'), vers: 'matheo', clair: false },
].filter((p) => p.el && document.getElementById(p.vers));
for (const P of PASSAGES) {
  P.fond = P.el.querySelector('.pa-fond');
  P.mot = P.el.querySelector('.pa-mot');
  P.trait = P.el.querySelector('.pa-trait');
  P.ligne = P.trait?.querySelector('polyline');
  P.legende = P.el.querySelector('.pa-legende');
  P.g = 0; P.cible = 0; P.depuis = 0; P.B = 0; P.vu = false;
}
function mesurerPassages() {
  for (const P of PASSAGES) {
    const s = document.getElementById(P.vers);
    P.B = s.getBoundingClientRect().top + scrollY - innerHeight * 0.45;
  }
}
let derniereMaj = 0;
function majPassages(t) {
  const dt = Math.min(0.1, derniereMaj ? (t - derniereMaj) / 1000 : 0.016);
  derniereMaj = t;
  const H = innerHeight, W = innerWidth, y = scrollY;
  const Z = H * 0.8;
  const n = W < 700 ? 5 : W < 1400 ? 8 : 11;
  const etale = reduit ? 0.35 : 0.55;
  // quand la scène 3D est là, ses tranches de profondeur font le passage : le rideau de la page s'efface
  const scene3D = !!(monde && monde.repli !== true && clairScene != null && !racine.classList.contains('sans-3d'));
  for (const P of PASSAGES) {
    if (scene3D) { if (P.vu) { P.vu = false; P.el.classList.remove('vu'); } continue; }
    const monte = borne((y - (P.B - Z)) / Z);
    // le nouveau monde est-il là ? la scène le dit (clair), sinon le jour de secours (après son balayage)
    let confirme;
    if (clairScene != null && monde) confirme = P.clair ? clairScene > 0.97 : clairScene < 0.03;
    else confirme = jour === P.clair && t - depuisJour > (reduit ? 1500 : 1150);
    const passe = y >= P.B - 2;
    if (passe && !P.depuis) P.depuis = t;
    if (!passe) P.depuis = 0;
    const cible = passe && (confirme || t - P.depuis > 2600) ? 1 : 0;
    // le départ des marches : une glissade douce dans le temps (0,9 s ; 1,3 s adouci)
    const tau = reduit ? 0.42 : 0.3;
    P.g += (cible - P.g) * (1 - Math.exp(-dt / tau));
    if (Math.abs(cible - P.g) < 0.002) P.g = cible;
    const visible = monte > 0.001 && P.g < 0.999;
    if (visible !== P.vu) { P.vu = visible; P.el.classList.toggle('vu', visible); }
    if (!visible) continue;
    // les marches : de gauche à droite vers le clair, de droite à gauche vers la nuit
    const haut = [], bas = [];
    for (let i = 0; i < n; i++) {
      const k = P.clair ? i : n - 1 - i;
      const dec = (k / Math.max(1, n - 1)) * etale;
      const hm = borne((monte * (1 + etale) - dec));
      const hg = borne((P.g * (1 + etale) - dec));
      const lisse = (v) => v * v * (3 - 2 * v);
      const x0 = Math.round((i / n) * W), x1 = Math.round(((i + 1) / n) * W);
      const yh = Math.round(H - lisse(hm) * H), yb = Math.round(H - lisse(hg) * H);
      haut.push([x0, yh], [x1, yh]);
      bas.push([x0, Math.min(yb, H)], [x1, Math.min(yb, H)]);
    }
    const poly = [...haut, ...bas.reverse()].map(([a, b]) => `${a}px ${b}px`).join(',');
    P.fond.style.clipPath = `polygon(${poly})`;
    if (P.ligne) {
      P.trait.setAttribute('viewBox', `0 0 ${W} ${H}`);
      const bord = P.g > 0.002 ? bas.slice().reverse() : haut;
      P.ligne.setAttribute('points', bord.map(([a, b]) => `${a},${b}`).join(' '));
    }
    if (P.mot) P.mot.style.translate = `${((1 - monte) * (P.clair ? 18 : -18) - P.g * (P.clair ? 10 : -10)).toFixed(2)}vw 0`;
    if (P.legende) {
      const premier = haut[P.clair ? 0 : haut.length - 1];
      P.legende.style.translate = `0 ${Math.max(70, premier[1] - 34)}px`;
      P.legende.style.opacity = (borne(monte * 3) * (1 - P.g)).toFixed(3);
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

let derniereImage = 0, dernierTexte = 0, compteImages = 0, debutCompte = 0, fpsPropre = 0;
function boucle(t) {
  requestAnimationFrame(boucle);
  compteImages++;
  if (t - debutCompte > 1000) { fpsPropre = Math.round(compteImages * 1000 / (t - debutCompte)); compteImages = 0; debutCompte = t; }
  // les marches des passages repartent dans le temps : on les suit à chaque image tant qu'elles bougent
  if (PASSAGES.some((P) => P.vu)) majPassages(t);
  if (t - derniereImage < 32) return;
  derniereImage = t;
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
  matchMedia('(min-width: 1100px)').addEventListener('change', (m) => { if (m.matches) menu.open = false; });
}

// ------------------------------------------------------------------------------------------------ les réalisations

// Un seul écran : le titre en haut, le panneau 3D au centre (la scène), la légende et les commandes en bas.
// Le défilement ne fait plus tourner la salle : flèches, points, clavier, glisser au doigt ou à la souris, dans les deux sens.
const salle = document.getElementById('salle');
const salleScene = document.getElementById('salle-scene');
const oeuvresEl = document.getElementById('oeuvres');
const pointsEl = document.getElementById('points');
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
  pointsEl?.querySelectorAll('button').forEach((b, k) => { if (k === i) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); });
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
  if (pointsEl) {
    pointsEl.innerHTML = oeuvres.map((o, k) => `<li><button type="button" aria-label="${o.querySelector('h3')?.textContent || 'Site ' + (k + 1)}"><i></i></button></li>`).join('');
    pointsEl.querySelectorAll('button').forEach((b, k) => b.addEventListener('click', () => montrer(k)));
  }
  const pilote = document.getElementById('pilote');
  if (pilote && N > 1) pilote.hidden = false;
  racine.classList.add('salle-prete');
  courant = -1;
  montrer(0);
  bPrec?.addEventListener('click', () => montrer(courant - 1));
  bSuiv?.addEventListener('click', () => montrer(courant + 1));
  // le clavier : flèches gauche et droite, quand la salle est à l'écran (et qu'on n'écrit pas dans un champ)
  addEventListener('keydown', (e) => {
    if (sectionActuelle !== 'realisations' || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.target.closest && e.target.closest('input, textarea, select, [contenteditable]')) return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); montrer(courant - 1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); montrer(courant + 1); }
  });

  // le doigt et la souris : un glissement horizontal fait tourner la salle ; le vertical reste au défilement
  let x0 = 0, y0 = 0, dx = 0, sens = null, id = null;
  const fin = () => {
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
    if (e.button !== 0 || e.target.closest('a, button')) return;
    x0 = e.clientX; y0 = e.clientY; dx = 0; sens = null; id = e.pointerId;
  });
  salle.addEventListener('pointermove', (e) => {
    if (id !== e.pointerId) return;
    dx = e.clientX - x0;
    const dy = e.clientY - y0;
    if (!sens) {
      if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy) * 1.2) { sens = 'h'; salleScene.classList.add('glisse'); try { salle.setPointerCapture(id); } catch {} }
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

// ------------------------------------------------------------------------------------------------ les affiches des expériences

function preparerAffiches() {
  const el = document.getElementById('affiches');
  if (!el) return;
  const liste = pretes();
  el.innerHTML = liste.map((x, i) => afficheHTML(x, i)).join('');
  el.style.setProperty('--n', liste.length);
  brancherVideos(el);
}
/** Les boucles muettes : chargées et lues seulement à l'écran ; en mouvement réduit, plus lentes. */
function brancherVideos(el) {
  const videos = [...el.querySelectorAll('video[data-src]')];
  if (!videos.length || !('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver((entrees) => {
    for (const e of entrees) {
      const v = e.target;
      if (e.isIntersecting) {
        if (!v.src) { v.src = v.dataset.src; v.addEventListener('error', () => v.remove(), { once: true }); v.addEventListener('playing', () => v.classList.add('joue'), { once: true }); }
        v.playbackRate = reduit ? 0.6 : 1;
        v.play()?.catch?.(() => {});
      } else v.pause();
    }
  }, { rootMargin: '120px 0px' });
  videos.forEach((v) => io.observe(v));
}

// ------------------------------------------------------------------------------------------------ « Osez rêver » : le collage

// Les captures du collage viennent de vrais sites : si l'un d'eux est masqué (realisations/sites.js), un autre le remplace.
function preparerCollage() {
  const figures = [...document.querySelectorAll('#rv-collage figure[data-site]')];
  if (!figures.length) return;
  const vis = selection();
  const ids = new Set(vis.map((s) => s.id));
  const pris = new Set(figures.map((f) => f.dataset.site).filter((id) => ids.has(id)));
  for (const f of figures) {
    if (ids.has(f.dataset.site)) continue;
    const s = vis.find((x) => !pris.has(x.id) && (f.dataset.vue !== 'tel' || x.captures?.tel));
    if (!s) { f.hidden = true; continue; }
    pris.add(s.id);
    f.dataset.site = s.id;
    const im = f.querySelector('img');
    if (im) im.src = 'realisations/img/' + (f.dataset.vue === 'tel' ? s.captures.tel : s.captures.petit || s.captures.ordi);
    const leg = f.querySelectorAll('figcaption span')[1];
    if (leg) leg.textContent = s.adresse.replace(/^https?:\/\//, '').replace(/\/$/, '') + (f.dataset.vue === 'tel' ? ' · téléphone' : '');
  }
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

preparerAffiches();
preparerSalle();
preparerCollage();
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
