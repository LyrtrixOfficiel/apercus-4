// Kazura v13 : la page posée sur la scène 3D (monde/monde.js).
// Elle lance la scène et lui donne le défilement (progression p, partie en cours, progression locale), pose le titre
// d'ouverture quand le sceau a fini de naître, fait vivre l'interface technique (index de partie, gyroscope qui suit
// le quaternion du sceau, croix de grille), révèle les titres en lettres brouillées dans leurs bandeaux, pilote la
// salle des réalisations (défilement, flèches, doigt, souris), fait vivre l'expérience du domaine dans sa fenêtre (et en plein écran) et
// prépare le message du formulaire.
// Tout est défensif : si la scène n'expose pas encore une méthode, la page marche quand même.
// Sans ce script, la page entière se lit telle quelle.

const racine = document.documentElement;
const reduit = matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobile = matchMedia('(max-width: 799px), (pointer: coarse)').matches;
const SECTIONS = ['ouverture', 'promesse', 'experiences', 'realisations', 'rever', 'deroule', 'matheo', 'questions', 'contact'];
const CLAIRES = new Set(['rever', 'deroule']);
const borne = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const $ = (s, el = document) => el.querySelector(s);
const deux = (n) => String(n).padStart(2, '0');
const debug = location.search.includes('debug');

// le domaine Kazura (experiences/domaine/domaine.js) : livré le 19/10. Passer à false pour revenir à l'affiche « en préparation »
// (on ne cherche jamais le module quand il est annoncé absent : un fichier manquant laisserait une erreur 404 dans la console).
const DOMAINE_PRET = true;
const DOMAINE = { js: '../experiences/domaine/domaine.js', css: 'experiences/domaine/domaine.css' };

// Sans WebGL (le téléphone de Mathéo, peut-être) : html.sans-3d. La page prend alors le relais pour le grand mot
// étiré de chaque partie et le passage au clair ; la scène, elle, peint son repli 2D (monde.repli === true).
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

// ------------------------------------------------------------------------------------------------ l'ouverture

let ouvert = racine.classList.contains('ouvert');
function ouvrir() {
  if (ouvert) return;
  ouvert = true;
  racine.classList.add('ouvert');
}
// déjà plus bas dans la page (retour, lien vers une section) : pas d'ouverture à attendre
if (scrollY > innerHeight * 0.3 || (location.hash && location.hash !== '#ouverture')) ouvrir();
// le titre se pose quand le sceau a fini de naître ; sans première image après 4 s, on n'attend plus ; plafond 7 s (8 s adouci)
let premiereImage = false;
setTimeout(() => { if (!premiereImage) ouvrir(); }, Math.max(0, 4000 - performance.now()));
setTimeout(ouvrir, Math.max(0, (reduit ? 8000 : 7000) - performance.now()));

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
  if (!canvas) { ouvrir(); return; }
  try {
    const mod = await import('../monde/monde.js');
    if (typeof mod.lancer !== 'function') throw new Error('monde.js n’expose pas lancer()');
    monde = await mod.lancer({ canvas, reduit, mobile });
    if (!monde) throw new Error('lancer() ne renvoie rien');
    if (monde.repli === true) passerSans3d();
    // le titre est déjà là (monde arrivé tard, ou retour plus bas dans la page) : pas d'ouverture à rejouer en entier
    if (ouvert) appel(monde, 'passer');
    if (monde.pret && typeof monde.pret.then === 'function') {
      monde.pret.then(() => { premiereImage = true; racine.classList.add('monde-vivant'); if (ouvert) appel(monde, 'passer'); }, () => {});
    } else { premiereImage = true; racine.classList.add('monde-vivant'); }
    attendreOuverture(monde).then(ouvrir, ouvrir);
    brancherSalle();
    dernierePosition = '';
    mesurer();
  } catch (e) {
    // pas de scène (fichier absent, pas de WebGL…) : le fond de nuit reste, la page s'ouvre sans attendre
    monde = null;
    passerSans3d();
    setTimeout(ouvrir, 500);
    if (debug) console.info('Monde indisponible :', e && e.message);
  }
}

// ------------------------------------------------------------------------------------------------ le défilement

const tete = document.getElementById('tete');
const hud = document.getElementById('hud');
const sections = SECTIONS.map((id) => document.getElementById(id)).filter(Boolean);
const liensNav = [...document.querySelectorAll('.nav a[href^="#"]')];
const indexHud = [...document.querySelectorAll('#hud-index li')];
const gSection = document.getElementById('g-section');
const hudP = document.getElementById('hud-p');
const chemin = document.getElementById('chemin');
const contours = [...document.querySelectorAll('.contour')].map((el) => ({ el, s: el.closest('section') }));
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
  const max = Math.max(1, racine.scrollHeight - innerHeight);
  const p = borne(scrollY / max);
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
  tete.classList.toggle('colle', scrollY > 24);
  if (hudP) hudP.textContent = 'p ' + p.toFixed(3).replace(/^0/, '');
  if (hud) hud.style.setProperty('--croix-y', (-(scrollY * (reduit ? 0.05 : 0.14)) % 180).toFixed(1) + 'px');

  // les grands mots en contour glissent au fil de leur partie
  for (const c of contours) {
    const rs = c.s.getBoundingClientRect();
    if (rs.bottom < -200 || rs.top > innerHeight + 200) continue;
    c.el.style.setProperty('--l', borne((innerHeight - rs.top) / (innerHeight + rs.height)).toFixed(3));
  }

  // le fil du déroulé se trace au fil de la lecture
  if (chemin) {
    const rc = chemin.getBoundingClientRect();
    chemin.style.setProperty('--pousse', borne((innerHeight * 0.6 - rc.top) / Math.max(1, rc.height)).toFixed(3));
  }

  salleAuDefilement();
  if (sans3d) motDeFond(id, locale);
}

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
  // le mot glisse au fil de la partie, comme un bandeau qui passe
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
const demander = () => { if (!prevu) { prevu = true; requestAnimationFrame(mesurer); } };
addEventListener('scroll', demander, { passive: true });
addEventListener('resize', () => { mesurerSalle(); demander(); });

// ------------------------------------------------------------------------------------------------ le jour et la nuit

// L'encre suit le fond réel : si la scène dit qu'elle est claire (etat().clair), on la croit ; sinon (scène absente,
// ancienne, sans WebGL), la page peint elle-même le jour de secours dans les parties claires.
const themeMeta = document.querySelector('meta[name="theme-color"]');
let jour = null, secours = null;
function regleJour(e) {
  const clairScene = e && e.clair != null ? Number(e.clair) : null;
  const sec = clairScene == null || Number.isNaN(clairScene);
  const j = sec ? CLAIRES.has(sectionActuelle) : clairScene > 0.5;
  if (sec !== secours) { secours = sec; racine.classList.toggle('jour-secours', sec); }
  if (j !== jour) {
    jour = j;
    racine.classList.toggle('jour', j);
    if (themeMeta) themeMeta.setAttribute('content', j ? '#e4e9ea' : '#05070b');
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
  // les axes de devant se dessinent après ceux de derrière
  const prof = [['x', poserAxe(q, [1, 0, 0], G.lx, G.px)], ['y', poserAxe(q, [0, 1, 0], G.ly, G.py)], ['z', poserAxe(q, [0, 0, 1], G.lz, G.pz)]];
  prof.sort((a, b) => a[1] - b[1]);
  for (const [n] of prof) G['p' + n].parentNode.appendChild(G['p' + n]);
}

let derniereImage = 0, dernierTexte = 0, compteImages = 0, debutCompte = 0, fpsPropre = 0;
function boucle(t) {
  requestAnimationFrame(boucle);
  compteImages++;
  if (t - debutCompte > 1000) { fpsPropre = Math.round(compteImages * 1000 / (t - debutCompte)); compteImages = 0; debutCompte = t; }
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

/** Révèle le texte d'un élément lettre à lettre, avec un petit curseur de signes brouillés en tête. */
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
  const duree = reduit ? Math.min(520, 220 + total * 6) : Math.min(1500, 360 + total * 17);
  const largeur = reduit ? 2 : 5;
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
        // les lignes qui arrivent ensemble se suivent : le bandeau se déroule, puis les lettres se posent
        const attente = rang++ * (reduit ? 140 : 110);
        setTimeout(() => {
          el.classList.add('vu');
          setTimeout(() => brouiller(el), (reduit ? 380 : 260));
        }, attente);
      } else el.classList.add('vu');
    }
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.15 });
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

// ------------------------------------------------------------------------------------------------ la salle des réalisations

const salle = document.getElementById('salle');
const salleScene = document.getElementById('salle-scene');
const oeuvres = [...document.querySelectorAll('.oeuvre')].filter((o) => !o.hidden);
const N = oeuvres.length;
const compte = document.getElementById('o-compte');
const bPrec = document.getElementById('o-prec'), bSuiv = document.getElementById('o-suiv');
let courant = -1, salleHaut = 0, salleH = 1;

function mesurerSalle() {
  if (!salle) return;
  const r = salle.getBoundingClientRect();
  salleHaut = r.top + scrollY;
  salleH = r.height;
}

function montrer(i, source) {
  i = borne(i, 0, N - 1);
  if (i === courant) return;
  courant = i;
  oeuvres.forEach((o, k) => {
    o.classList.toggle('actif', k === i);
    o.setAttribute('aria-hidden', k === i ? 'false' : 'true');
    o.inert = k !== i;
  });
  if (compte) compte.innerHTML = `<b>${deux(i + 1)}</b> / ${deux(N)}`;
  if (bPrec) bPrec.disabled = i === 0;
  if (bSuiv) bSuiv.disabled = i === N - 1;
  if (salleScene) salleScene.style.setProperty('--teinte', oeuvres[i].dataset.couleur || 'transparent');
  if (source !== 'monde' && monde) appel(monde.realisations, 'aller', i);
}

/** Le défilement dans la salle choisit le site : chaque site a sa part égale du parcours. */
function salleAuDefilement() {
  if (!salle || N < 1 || !racine.classList.contains('salle-prete')) return;
  const course = Math.max(1, salleH - innerHeight);
  const t = (scrollY - salleHaut) / course;
  if (t < -0.2 || t > 1.2) return;
  montrer(Math.floor(borne(t, 0, 0.9999) * N));
}

function allerA(i) {
  i = borne(i, 0, N - 1);
  montrer(i);
  const course = Math.max(1, salleH - innerHeight);
  scrollTo({ top: Math.round(salleHaut + ((i + 0.5) / N) * course), behavior: reduit ? 'auto' : 'smooth' });
}

function preparerSalle() {
  if (!salle || !N) return;
  salle.style.setProperty('--n', N);
  oeuvres.forEach((o, k) => { const num = o.querySelector('.o-num'); if (num) num.textContent = `${deux(k + 1)} / ${deux(N)}`; o.setAttribute('aria-roledescription', 'diapositive'); });
  const pilote = document.getElementById('pilote');
  if (pilote && N > 1) pilote.hidden = false;
  // les images restent pour le repli en DOM ; elles se chargent tout de suite, la salle n'est pas loin
  oeuvres.forEach((o) => { const im = o.querySelector('img'); if (im) im.loading = 'eager'; });
  racine.classList.add('salle-prete');
  courant = -1;
  mesurerSalle();
  montrer(0);
  bPrec?.addEventListener('click', () => allerA(courant - 1));
  bSuiv?.addEventListener('click', () => allerA(courant + 1));
  salleScene.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); allerA(courant - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); allerA(courant + 1); }
  });

  // le doigt et la souris : un glissement horizontal fait tourner la salle ; le vertical reste au défilement
  let x0 = 0, y0 = 0, dx = 0, sens = null, id = null;
  const fin = () => {
    if (sens === 'h') {
      const seuil = Math.min(90, innerWidth * 0.14);
      if (dx < -seuil) allerA(courant + 1); else if (dx > seuil) allerA(courant - 1);
    }
    sens = null; id = null; dx = 0;
    salleScene.classList.remove('glisse');
    salleScene.style.setProperty('--glisse', '0px');
    salleScene.style.setProperty('--glisse-r', '0');
    if (monde) appel(monde.realisations, 'glisser', 0);
  };
  salleScene.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || e.target.closest('a, button')) return;
    x0 = e.clientX; y0 = e.clientY; dx = 0; sens = null; id = e.pointerId;
  });
  salleScene.addEventListener('pointermove', (e) => {
    if (id !== e.pointerId) return;
    dx = e.clientX - x0;
    const dy = e.clientY - y0;
    if (!sens) {
      if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy) * 1.2) { sens = 'h'; salleScene.classList.add('glisse'); try { salleScene.setPointerCapture(id); } catch {} }
      else if (Math.abs(dy) > 10) { id = null; return; }
    }
    if (sens !== 'h') return;
    const frac = borne(dx / innerWidth, -1, 1);
    salleScene.style.setProperty('--glisse', (dx * 0.55).toFixed(1) + 'px');
    salleScene.style.setProperty('--glisse-r', (frac * -18).toFixed(2));
    // la scène attend le décalage du doigt en pixels (monde/carrousel.js : un panneau = environ 62 % de l'écran)
    if (monde) appel(monde.realisations, 'glisser', dx);
  });
  salleScene.addEventListener('pointerup', fin);
  salleScene.addEventListener('pointercancel', fin);
  salleScene.addEventListener('lostpointercapture', () => { if (sens === 'h') fin(); });
  salleScene.tabIndex = -1;
}

/** Quand la scène sait afficher les panneaux en 3D, on lui donne les sites et l'image en DOM s'efface. */
function brancherSalle() {
  const R = monde && monde.realisations;
  if (!R || typeof R.definir !== 'function' || monde.repli === true || !N) return;
  const sites = oeuvres.map((o) => {
    const im = o.querySelector('img');
    const src = im ? im.getAttribute('src').replace(/-800\.webp$/, mobile ? '-800.webp' : '.webp') : '';
    return { id: o.dataset.id, image: new URL(src, location.href).href, couleur: o.dataset.couleur || '#6ee7b7' };
  });
  try { R.definir(sites); } catch (e) { if (debug) console.info('realisations.definir', e && e.message); return; }
  racine.classList.add('salle-3d');
  appel(R, 'aller', Math.max(0, courant));
  appel(R, 'surChangement', (i) => {
    const k = Number(i);
    if (!Number.isInteger(k) || k === courant) return;
    montrer(k, 'monde');
    const course = Math.max(1, salleH - innerHeight);
    const vise = salleHaut + ((k + 0.5) / N) * course;
    if (Math.abs(scrollY - vise) > course / N / 2) scrollTo({ top: Math.round(vise), behavior: reduit ? 'auto' : 'smooth' });
  });
}

// ------------------------------------------------------------------------------------------------ l'expérience du domaine

// Le domaine vit dans sa fenêtre, dans la page (16/9 sur ordinateur, 4/5 sur téléphone) : le module se monte quand on
// approche, charge sa 3D lui-même et ne dessine que s'il est visible. Le bouton « Plein écran » agrandit la fenêtre.
const xpBloc = document.getElementById('xp-domaine');
const xpFenetre = xpBloc?.querySelector('.xp-fenetre');
const xpScene = document.getElementById('xp-scene');
const xpPlein = document.getElementById('xp-plein');
const xpEntrer = document.getElementById('xp-entrer');
const xpStatut = document.getElementById('xp-statut');
const domainePret = DOMAINE_PRET || racine.dataset.domaine === 'pret' || /[?&]domaine=1\b/.test(location.search);
let domaine = null, pleinEcran = false;

function feuille(href) {
  return new Promise((ok) => {
    if (document.querySelector(`link[href="${href}"]`)) { ok(); return; }
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = href;
    l.onload = ok; l.onerror = ok;
    document.head.appendChild(l);
  });
}

async function monterDomaine() {
  if (domaine || !xpScene) return;
  domaine = { instance: null };
  try {
    const [mod] = await Promise.all([import(DOMAINE.js), feuille(DOMAINE.css)]);
    if (typeof mod.monter !== 'function') throw new Error('monter() absent');
    xpScene.hidden = false;
    domaine.instance = await mod.monter(xpScene, { reduit, mobile });
    xpBloc.classList.add('xp-vivant');
    xpPlein.hidden = false;
    if (xpEntrer) xpEntrer.hidden = false;
    xpStatut.textContent = 'Pour l’agrandir : « Plein écran », en haut à droite de l’image. Pour revenir : « Quitter »' + (mobile ? '.' : ' ou la touche Échap.');
  } catch (e) {
    xpScene.hidden = true;
    xpScene.textContent = '';
    xpStatut.textContent = 'Le domaine n’a pas pu s’ouvrir sur cet appareil. Les réalisations, elles, sont juste en dessous.';
    xpStatut.classList.add('prepa');
    if (debug) console.info('Domaine indisponible :', e && e.message);
  }
}

function basculerPlein(ouvrirPlein) {
  if (!xpFenetre || ouvrirPlein === pleinEcran) return;
  pleinEcran = ouvrirPlein;
  xpFenetre.classList.toggle('plein-ecran', ouvrirPlein);
  racine.classList.toggle('xp-plein-ouvert', ouvrirPlein);
  xpBloc.closest('section')?.classList.toggle('xp-ouvert', ouvrirPlein);
  xpPlein.setAttribute('aria-pressed', String(ouvrirPlein));
  if (ouvrirPlein) {
    xpFenetre.setAttribute('role', 'dialog');
    xpFenetre.setAttribute('aria-modal', 'true');
    xpFenetre.setAttribute('aria-label', 'Le domaine Kazura, en plein écran');
    // le vrai plein écran quand le navigateur le permet (ordinateur, Android) ; sinon, la fenêtre couvre l'écran
    try { xpFenetre.requestFullscreen?.({ navigationUI: 'hide' })?.catch?.(() => {}); } catch {}
    xpPlein.focus();
  } else {
    xpFenetre.removeAttribute('role'); xpFenetre.removeAttribute('aria-modal'); xpFenetre.removeAttribute('aria-label');
    if (document.fullscreenElement) { try { document.exitFullscreen()?.catch?.(() => {}); } catch {} }
    xpBloc.scrollIntoView({ block: 'center', behavior: 'auto' });
    xpPlein.focus();
  }
}

function preparerExperience() {
  if (!xpStatut) return;
  if (!domainePret || !xpScene) {
    xpStatut.textContent = 'En préparation · elle ouvre très bientôt';
    xpStatut.classList.add('prepa');
    return;
  }
  xpStatut.textContent = 'Le domaine se prépare…';
  xpPlein?.addEventListener('click', () => basculerPlein(!pleinEcran));
  xpEntrer?.addEventListener('click', () => basculerPlein(true));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && pleinEcran) basculerPlein(false); });
  document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && pleinEcran) basculerPlein(false); });
  if (!('IntersectionObserver' in window)) { monterDomaine(); return; }
  const io = new IntersectionObserver((entrees) => {
    if (entrees.some((e) => e.isIntersecting)) { io.disconnect(); monterDomaine(); }
  }, { rootMargin: '700px 0px 700px 0px' });
  io.observe(xpBloc);
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

apparitions();
preparerSalle();
preparerExperience();
mesurer();
regleJour(null);
requestAnimationFrame(boucle);
addEventListener('load', () => { mesurerSalle(); demander(); });
lancerMonde();
