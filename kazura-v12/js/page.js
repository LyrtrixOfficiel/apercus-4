// Kazura v12 : la page. Elle lance le monde 3D (monde/monde.js), lui donne la progression du défilement,
// pose le titre d'ouverture quand le monde a fini la sienne (3 s au plus), monte les modules de Vitrine
// (experiences/, realisations/) quand on s'en approche, et prépare le message du formulaire.
// Tout ce qui est ici est un plus : sans ce script, la page entière se lit telle quelle.

const racine = document.documentElement;
const reduit = matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobile = matchMedia('(max-width: 799px), (pointer: coarse)').matches;
const SECTIONS = ['ouverture', 'promesse', 'experiences', 'realisations', 'rever', 'deroule', 'matheo', 'questions', 'contact'];
const borne = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));

// ------------------------------------------------------------------------------------------------ l'ouverture

let ouvert = racine.classList.contains('ouvert');
function ouvrir() {
  if (ouvert) return;
  ouvert = true;
  racine.classList.add('ouvert');
}
// déjà plus bas dans la page (retour, lien vers une section) : pas d'ouverture à attendre
if (scrollY > innerHeight * 0.3 || (location.hash && location.hash !== '#ouverture')) ouvrir();
// le titre se pose quand le sceau a fini de naître (l'ouverture se joue en entier : c'est le moment fort) ;
// si le monde n'a toujours pas sa première image après 4 s, on n'attend plus : le titre arrive, l'ouverture sera brève
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

// ------------------------------------------------------------------------------------------------ le monde

let monde = null;
let dernierePosition = null;

async function lancerMonde() {
  const canvas = document.getElementById('monde');
  if (!canvas) { ouvrir(); return; }
  try {
    const mod = await import('../monde/monde.js');
    if (typeof mod.lancer !== 'function') throw new Error('monde.js n’expose pas lancer()');
    monde = await mod.lancer({ canvas, reduit, mobile });
    // le titre est déjà là (monde arrivé tard, ou retour plus bas dans la page) : pas d'ouverture à rejouer en entier
    if (ouvert && typeof monde.passer === 'function') monde.passer();
    if (monde && monde.pret && typeof monde.pret.then === 'function') {
      monde.pret.then(() => { premiereImage = true; racine.classList.add('monde-vivant'); if (ouvert && typeof monde.passer === 'function') monde.passer(); }, () => {});
    } else { premiereImage = true; racine.classList.add('monde-vivant'); }
    attendreOuverture(monde).then(ouvrir, ouvrir);
    // la position actuelle, tout de suite
    dernierePosition = null;
    mesurer();
  } catch (e) {
    // pas de monde (fichier absent, pas de WebGL…) : le fond de nuit reste, la page s'ouvre sans attendre
    monde = null;
    setTimeout(ouvrir, 500);
    if (location.search.includes('debug')) console.info('Monde indisponible :', e && e.message);
  }
}

// ------------------------------------------------------------------------------------------------ le défilement

const tete = document.getElementById('tete');
const sections = SECTIONS.map((id) => document.getElementById(id)).filter(Boolean);
const liensNav = [...document.querySelectorAll('.nav a[href^="#"]')];
const fil = document.getElementById('fil');
const ouverture = document.getElementById('ouverture');
let prevu = false;

function sectionCourante() {
  const repere = innerHeight * 0.45;
  let courante = sections[0];
  for (const s of sections) { if (s.getBoundingClientRect().top <= repere) courante = s; else break; }
  return courante ? courante.id : 'ouverture';
}

function mesurer() {
  prevu = false;
  const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
  const p = borne(scrollY / max);
  const id = sectionCourante();

  if (monde && typeof monde.progression === 'function') {
    const cle = p.toFixed(4) + id;
    if (cle !== dernierePosition) { dernierePosition = cle; try { monde.progression(p, id); } catch {} }
  }

  // la nuit de lecture descend sur le monde à mesure qu'on quitte l'ouverture
  const hautOuv = ouverture ? ouverture.offsetHeight : innerHeight;
  racine.style.setProperty('--lecture', borne(scrollY / (hautOuv * 0.8)).toFixed(3));

  tete.classList.toggle('colle', scrollY > 24);
  for (const a of liensNav) {
    const vise = a.getAttribute('href').slice(1);
    if (vise === id) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
  }

  // la liane du déroulé pousse au fil de la lecture
  if (fil) {
    const r = fil.getBoundingClientRect();
    const pousse = borne((innerHeight * 0.62 - r.top) / Math.max(1, r.height));
    fil.style.setProperty('--pousse', pousse.toFixed(3));
  }
}
const demander = () => { if (!prevu) { prevu = true; requestAnimationFrame(mesurer); } };
addEventListener('scroll', demander, { passive: true });
addEventListener('resize', demander);

// ------------------------------------------------------------------------------------------------ l'apparition

function apparitions() {
  if (!('IntersectionObserver' in window)) return;
  const elements = document.querySelectorAll('.pg-apparait, [data-lignes]');
  const io = new IntersectionObserver((entrees) => {
    for (const e of entrees) {
      if (e.isIntersecting) { e.target.classList.add('vu'); io.unobserve(e.target); }
    }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
  // ce qui est déjà à l'écran apparaît d'emblée, le reste attend qu'on s'en approche
  for (const el of elements) io.observe(el);
  racine.classList.add('anime');
}

// ------------------------------------------------------------------------------------------------ le menu du téléphone

const menu = document.getElementById('menu');
if (menu) {
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) menu.open = false; });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && menu.open) { menu.open = false; menu.querySelector('summary').focus(); } });
  matchMedia('(min-width: 1080px)').addEventListener('change', (m) => { if (m.matches) menu.open = false; });
}

// ------------------------------------------------------------------------------------------------ les modules de Vitrine

const MODULES = {
  experiences: { js: '../experiences/experiences.js', css: 'experiences/experiences.css' },
  realisations: { js: '../realisations/realisations.js', css: 'realisations/realisations.css' },
};

function feuille(href) {
  return new Promise((ok) => {
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = href;
    l.onload = ok; l.onerror = ok;
    document.head.appendChild(l);
  });
}

async function monterModule(conteneur) {
  const nom = conteneur.dataset.module;
  const def = MODULES[nom];
  if (!def || conteneur.dataset.monte) return;
  conteneur.dataset.monte = 'en-cours';
  const repli = conteneur.querySelector('.repli');
  try {
    const mod = await import(def.js);
    if (typeof mod.monter !== 'function') throw new Error(nom + ' : monter() absent');
    await feuille(def.css);
    const cible = document.createElement('div');
    cible.className = 'module-vivant module-' + nom;
    conteneur.appendChild(cible);
    try {
      await mod.monter(cible, { reduit, mobile });
      if (repli) repli.remove();
      conteneur.dataset.monte = 'oui';
    } catch (e) {
      cible.remove();
      throw e;
    }
  } catch (e) {
    // le repli statique reste en place
    conteneur.dataset.monte = 'non';
    if (location.search.includes('debug')) console.info('Module ' + nom + ' indisponible :', e && e.message);
  }
}

function modules() {
  const conteneurs = [...document.querySelectorAll('[data-module]')];
  if (!('IntersectionObserver' in window)) { conteneurs.forEach(monterModule); return; }
  const io = new IntersectionObserver((entrees) => {
    for (const e of entrees) if (e.isIntersecting) { io.unobserve(e.target); monterModule(e.target); }
  }, { rootMargin: '900px 0px 900px 0px' });
  conteneurs.forEach((c) => io.observe(c));
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
  if (activite) moi.push(`Mon activité : ${activite}.`.replace(/\.\.$/, '.'));
  if (moi.length) lignes.push(moi.join(' '));
  if (situation) lignes.push(situation);
  if (projet) lignes.push('', projet);
  lignes.push('', 'Pouvons-nous en parler ?');
  if (prenom) lignes.push('', prenom);
  return lignes.join('\n').replace(/\n{3,}/g, '\n\n');
}

if (form) {
  const apercu = document.getElementById('f-apercu');
  const texte = document.getElementById('f-apercu-texte');
  const montrer = () => { texte.textContent = message(); apercu.hidden = false; };
  form.addEventListener('input', montrer);
  form.addEventListener('change', montrer);
  montrer();
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
modules();
mesurer();
lancerMonde();
