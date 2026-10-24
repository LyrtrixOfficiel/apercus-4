// Mathéo Bringia v2 : l'accueil, « un tour d'Angerville, de nuit ».
// La page est posée sur le monde (monde/monde.js, agent MONDE, contrat dans monde/LISEZMOI.md) :
//  - le chargement : le MB et ses 5 feux en DOM, au rythme du vrai chargement (monde.surChargement) ; ils s'effacent
//    à « pret ». Le titre se pose à « ouvertureFinie » (les feux se sont éteints : DÉPART). La page n'accélère rien.
//    Seul plafond : 25 s sans « pret », ou une erreur : le titre arrive sans 3D, sur la nuit de CSS.
//  - le défilement lissé (js/lissage.js, via commun.js) ; à chaque image : monde.progression(p, partie, locale).
//  - le HUD du tour (secteur, virage, distance sur les 1198 m, mini-circuit), les plaques photo 2.5D (ouverture en
//    obturateur, zoom lent, parallaxe, balayage de lumière, grain), l'encre selon le fond (etat().clair, clairEn).
// Tout est défensif : si la scène n'expose pas une méthode, la page marche quand même. Sans ce script, tout se lit.
import { lissage, reduit, mobile } from './commun.js';
import { HD } from './hd.js';
import { PILOTE, PAR } from './rendus.js';

const racine = document.documentElement;
const SECTIONS = ['ouverture', 'palmares', 'course', 'photos', 'calendrier', 'actus', 'pilote', 'partenaires', 'arrivee'];
const NOMS = {
  ouverture: ['Grille de départ', 'Ligne de départ'],
  palmares: ['Palmarès', 'Ligne droite des stands'],
  course: ['Dernière course', 'Virages 1 à 3 · épingle droite'],
  photos: ['Photos', 'Virage 4 · gauche de la tour'],
  calendrier: ['Calendrier', 'Virage 5 · épingle du Coeur'],
  actus: ['Actus', 'Virage 6 · courbe des tribunes'],
  pilote: ['Le pilote', 'Virage 7 · épingle de la cafétéria'],
  partenaires: ['Partenaires', 'Virages 8 à 10 · ligne droite du fond'],
  arrivee: ['Arrivée', 'Virages 11 et 12 · ligne d’arrivée'],
};
const borne = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lisse = (t) => t * t * (3 - 2 * t);
const debug = location.search.includes('debug');
const AMP = reduit ? 0.35 : 1; // mouvement réduit : adoucir, jamais couper

function appel(obj, nom, ...args) {
  try { if (obj && typeof obj[nom] === 'function') return obj[nom](...args); } catch (e) { if (debug) console.info('monde.' + nom, e && e.message); }
  return undefined;
}

// ------------------------------------------------------------------------------------------------ apparitions
{
  const cibles = document.querySelectorAll('.secteur .s-texte > *, .geants, .progression-v2');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => { for (const e of es) if (e.isIntersecting) { e.target.classList.add('vu'); io.unobserve(e.target); } }, { rootMargin: '0px 0px -6% 0px', threshold: 0.05 });
    for (const el of cibles) io.observe(el);
  } else for (const el of cibles) el.classList.add('vu');
}

// ------------------------------------------------------------------------------------------------ chargement et ouverture
const feux = [...document.querySelectorAll('#feux i')];
const chEtat = document.getElementById('ch-etat');
let ouvert = false, charge = false, mondePret = false, abandon = false;
let monde = null;

function ouvrir() { if (ouvert) return; ouvert = true; racine.classList.add('ouvert'); }
function finirChargement() { if (charge) return; charge = true; racine.classList.add('charge'); }
function progressionChargement(x) {
  const p = borne(Number(x) || 0);
  const k = Math.floor(p * 5 + 1e-6);
  feux.forEach((f, i) => f.classList.toggle('on', i < k));
  if (chEtat) chEtat.textContent = `Mise en grille · ${Math.round(p * 100)} %`;
}
// déjà plus bas dans la page (retour, lien vers une partie) : inutile d'attendre le titre
if (scrollY > innerHeight * 0.3 || (location.hash && location.hash !== '#ouverture')) ouvrir();

function abandonner(raison) {
  if (abandon || mondePret) return;
  abandon = true;
  clearTimeout(plafond);
  if (debug) console.info('Scène abandonnée :', raison);
  racine.classList.add('scene-absente');
  racine.classList.remove('monde-3d');
  finirChargement();
  ouvrir();
  if (monde) { const m = monde; monde = null; appel(m, 'detruire'); }
}
const plafond = setTimeout(() => abandonner('25 s sans première image'), 25000);

function attendre(x) {
  if (x && typeof x.then === 'function') return x;
  if (x === true) return Promise.resolve();
  return new Promise(() => {});
}

/** Les données passées au monde : ses vraies photos (écrans géants), les partenaires (panneaux), les chiffres. */
function photosPourLeMonde() {
  const noms = ['angerville-attaque', 'angerville-virage', 'angerville-casque', 'angerville-face', 'angerville-peloton', 'angerville-profil', 'angerville-kmc', 'angerville-duel'];
  const LEG = {
    'angerville-attaque': 'De face, à l’attaque', 'angerville-virage': 'En appui', 'angerville-casque': 'Casque Frevy Designs',
    'angerville-face': 'En sortie de virage', 'angerville-peloton': 'Dans la file', 'angerville-profil': 'Le kart en appui',
    'angerville-kmc': 'Au virage du drapeau KWC', 'angerville-duel': 'Roue dans roue',
  };
  return noms.filter((n) => HD[n]).map((n) => {
    const h = HD[n];
    const l = h.portrait ? (mobile ? 720 : 1080) : (mobile ? 960 : 1600);
    return { src: `medias/hd/${n}-${l}.webp`, legende: LEG[n] || '', largeur: l, hauteur: Math.round(l * h.h / h.l) };
  });
}

async function lancerMonde() {
  const canvas = document.getElementById('monde');
  if (!canvas) { abandonner('pas de canevas'); return; }
  try {
    const mod = await import('../monde/monde.js');
    if (typeof mod.lancer !== 'function') throw new Error('monde.js n’expose pas lancer()');
    const m = await mod.lancer({ canvas, reduit, mobile, sections: SECTIONS });
    if (!m) throw new Error('lancer() ne renvoie rien');
    if (abandon) { appel(m, 'detruire'); return; }
    monde = m;
    window.__mbPage = { monde: m };
    appel(m, 'surChargement', progressionChargement);
    appel(m, 'definirPhotos', photosPourLeMonde());
    appel(m, 'definirPartenaires', PAR.visibles().map((p) => ({ nom: p.nom, rang: p.rang })));
    appel(m, 'definirChiffres', PILOTE.chiffres.map((c) => ({ valeur: c.valeur, unite: c.unite || '', legende: c.legende, detail: c.detail || '' })));
    attendre(m.pret).then(() => {
      if (abandon) return;
      mondePret = true;
      clearTimeout(plafond);
      finirChargement();
      racine.classList.add('monde-vivant');
      attendre(m.ouvertureFinie).then(ouvrir, ouvrir);
      setTimeout(ouvrir, 30000); // filet très tardif, si la scène ne prévenait jamais
    }, (e) => abandonner('erreur de la scène : ' + (e && e.message)));
    derniereCle = '';
    mesurer();
  } catch (e) {
    abandonner('scène indisponible : ' + (e && e.message));
  }
}
addEventListener('error', (e) => { if (!mondePret && e && e.filename && /\/monde\//.test(e.filename)) abandonner('erreur dans la scène'); });
addEventListener('unhandledrejection', (e) => { const s = String(e && e.reason && (e.reason.stack || e.reason)); if (!mondePret && /\/monde\//.test(s)) abandonner('promesse rejetée dans la scène'); });

// ------------------------------------------------------------------------------------------------ le défilement
const sections = SECTIONS.map((id) => document.getElementById(id)).filter(Boolean);
const htN = document.getElementById('ht-n'), htNom = document.getElementById('ht-nom'), htDist = document.getElementById('ht-dist'), htVirage = document.getElementById('ht-virage');
const htBarre = document.getElementById('ht-barre');
const htIndex = [...document.querySelectorAll('#ht-index li')];
const nuitPiste = document.querySelector('.nuit-piste');
const miniPath = document.querySelector('.ht-carte path:nth-of-type(2)');
const miniPoint = document.querySelector('.ht-carte [data-hud="mini"]');
const miniLong = miniPath ? miniPath.getTotalLength() : 0;
const plaques = [...document.querySelectorAll('[data-plaque]')].map((el) => ({ el, zone: el.closest('.plaque-zone'), casque: el.classList.contains('pl-casque') }));
let actuelle = '', derniereCle = '', prevu = false, dernierY = -1;

function sectionCourante() {
  const repere = innerHeight * 0.45;
  let c = sections[0];
  for (const s of sections) { if (s.getBoundingClientRect().top <= repere) c = s; else break; }
  return c;
}

let plaqueOuverte = false;
function majPlaques() {
  const H = innerHeight, L = innerWidth;
  let ouverte = false;
  for (const P of plaques) {
    const r = P.zone.getBoundingClientRect();
    if (r.bottom < -50 || r.top > H + 50) { if (P.vu !== false) { P.vu = false; P.el.style.setProperty('--o', '0'); } continue; }
    P.vu = true;
    const z = borne(-r.top / Math.max(1, r.height - H));
    const o = lisse(borne(z / 0.16)) * (1 - lisse(borne((z - 0.84) / 0.16)));
    const s = P.el.style;
    s.setProperty('--o', o.toFixed(4));
    s.setProperty('--fs', (1.14 - 0.1 * z * AMP).toFixed(4));
    s.setProperty('--fy', ((0.5 - z) * 50 * AMP).toFixed(1));
    s.setProperty('--as', (1 + 0.075 * z * AMP).toFixed(4));
    if (P.casque) { s.setProperty('--ax', '0'); s.setProperty('--ay', ((0.5 - z) * H * 0.05 * AMP).toFixed(1)); }
    else { s.setProperty('--ax', ((z - 0.5) * L * 0.06 * AMP).toFixed(1)); s.setProperty('--ay', ((0.5 - z) * H * 0.015 * AMP).toFixed(1)); }
    // le balayage de lumière à l'ouverture de l'obturateur
    const b = borne((z - 0.04) / 0.3);
    s.setProperty('--b', (Math.sin(Math.PI * b) * (reduit ? 0.5 : 0.9)).toFixed(3));
    s.setProperty('--bx', (b * 130 - 10).toFixed(1));
    if (o > 0.3) ouverte = true;
  }
  if (ouverte !== plaqueOuverte) { plaqueOuverte = ouverte; racine.classList.toggle('plaque-ouverte', ouverte); }
}

// l'encre suit le fond réel : la scène est la nuit, sauf le flash du podium
let jour = null;
const BLOCS_ENCRE = [...document.querySelectorAll('.s-arrivee .s-texte > *, .s-partenaires .s-texte > .etiquette-v2')];
function encre() {
  const e = monde && !abandon ? appel(monde, 'etat') : null;
  const c = e && e.clair != null ? Number(e.clair) : 0;
  const j = c > 0.5;
  if (j !== jour) { jour = j; racine.classList.toggle('jour', j); }
  const passage = c > 0.01 && c < 0.99 && typeof (monde && monde.clairEn) === 'function';
  for (const b of BLOCS_ENCRE) {
    if (!passage) { b.classList.remove('encre-jour', 'encre-nuit'); continue; }
    const r = b.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) continue;
    let v = 0;
    try { for (const fy of [0.25, 0.75]) for (const fx of [0.2, 0.8]) v += Number(monde.clairEn(borne((r.left + r.width * fx) / innerWidth), borne((r.top + r.height * fy) / innerHeight))) / 4; } catch { v = c; }
    b.classList.toggle('encre-jour', v > 0.5);
    b.classList.toggle('encre-nuit', v <= 0.5);
  }
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

  if (monde && !abandon) {
    const cle = p.toFixed(4) + id + locale.toFixed(4);
    if (cle !== derniereCle) { derniereCle = cle; appel(monde, 'progression', p, id, locale); }
    racine.classList.toggle('monde-3d', monde.repli !== true);
    racine.classList.toggle('monde-repli', monde.repli === true);
  }
  if (id !== actuelle) {
    actuelle = id;
    const i = SECTIONS.indexOf(id);
    if (htN) htN.textContent = 'S' + i;
    if (htNom) htNom.textContent = NOMS[id][0];
    if (htVirage) htVirage.textContent = NOMS[id][1];
    for (const li of htIndex) li.classList.toggle('actif', li.dataset.s === id);
  }
  // le tour : la position dans la page = la distance parcourue sur les 1198 m
  if (htDist) htDist.textContent = String(Math.round(p * 1198)).padStart(4, '0');
  if (htBarre) htBarre.style.setProperty('--p', p.toFixed(4));
  if (miniPath && miniPoint && miniLong) {
    const pt = miniPath.getPointAtLength((p * miniLong) % miniLong);
    miniPoint.setAttribute('cx', pt.x.toFixed(1)); miniPoint.setAttribute('cy', pt.y.toFixed(1));
  }
  if (nuitPiste) nuitPiste.style.setProperty('--avance', (y * 0.5 * AMP).toFixed(1));
  majPlaques();
  encre();
}
const demander = () => { if (!prevu) { prevu = true; requestAnimationFrame(mesurer); } };
lissage.surImage(() => mesurer());
addEventListener('scroll', () => { if (Math.abs(scrollY - dernierY) > 0.5) demander(); }, { passive: true });
addEventListener('resize', () => { dernierY = -1; derniereCle = ''; demander(); });
mesurer();
lancerMonde();
