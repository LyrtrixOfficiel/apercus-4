// Page d'arrivée, côté navigateur (quatrième tour, BRIEF-4).
// « Bonjour <prénom>, » et la phrase de Mathéo sur le voile d'ouverture, puis SON site en plein écran (une seule
// iframe `<univers>/?p=…&palette=…&apercu=1`, chargée juste à temps pour que sa première impression se joue
// devant elle), une barre en mots et trois panneaux : les autres idées, les couleurs, la fin.
// Le rendu lui-même vit dans rendu.js (partagé avec node).
import { chargerCatalogue, recommander, choisirPalette } from '../commun/recommandation.js';
import { preparer, rendreCorps, rendreIdee, rendreCouleurs, policesUnivers, stylesCorps, variablesScene, lienSite, lienApercu, titreHTML, policeTitre } from './rendu.js';
import { voile as creerVoile } from './voile.js';

const H = document.documentElement;
H.classList.add('vivant'); // le script tourne : les filets de sécurité CSS se retirent
const reduit = matchMedia('(prefers-reduced-motion: reduce)').matches;
const tactile = matchMedia('(pointer: coarse)').matches;
if (tactile) H.classList.add('tactile');
const params = new URLSearchParams(location.search);
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const $ = (s) => document.querySelector(s);
const lireStock = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const ecrireStock = (k) => { try { localStorage.setItem(k, '1'); } catch {} };

let embarque = {};
try { embarque = JSON.parse(document.getElementById('donnees')?.textContent || '{}'); } catch {}
let fiche = embarque.fiche, catalogue = embarque.catalogue || [];
let vue = null, demo = null;
let palettes = [];   // la palette regardée de chaque idée
const gouts = {};    // ce qu'elle a choisi dans « Changer les couleurs » (lumière et teinte), suivi d'une idée à l'autre

// --------------------------------------------------------------------------------------------- ouverture
const ouverture = H.classList.contains('ouverture');
const revisite = H.classList.contains('revisite');
let V = null, presse = false, reveil = null;
if (ouverture) {
  H.classList.add('voile-actif');
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  scrollTo(0, 0);
  const cs = getComputedStyle(document.body);
  const depart = ['--v-fond', '--v-a', '--v-b'].map((k) => cs.getPropertyValue(k).trim()).filter((c) => /^#[0-9a-f]{6}$/i.test(c));
  try { V = creerVoile(document.getElementById('voile-toile'), { reduit, depart: depart.length === 3 ? depart : null, premiere: () => document.getElementById('voile')?.classList.add('gl') }); } catch { V = null; }
  const passer = () => { presse = true; reveil && reveil(); };
  for (const ev of ['pointerdown', 'keydown', 'wheel', 'touchstart']) addEventListener(ev, passer, { once: true, passive: true });
  const p = document.getElementById('voile-passer');
  if (p) p.textContent = tactile ? 'Touchez l’écran pour entrer' : 'Cliquez pour entrer';
}
const attendre = (ms) => (presse ? Promise.resolve() : new Promise((r) => { const t = setTimeout(r, ms); reveil = () => { clearTimeout(t); r(); }; }));

// --------------------------------------------------------------------------------------------- données
const lireJSON = async (url) => { const r = await fetch(url, { cache: 'no-cache' }); if (!r.ok) throw new Error(url); return r.json(); };
const avant = (promesse, ms) => Promise.race([promesse, pause(ms).then(() => null)]);
const signature = (v) => (v ? v.proposes.map((l) => `${l.univers.id}:${l.palette.id}`).join(',') : '');

function calculer() {
  const reco = recommander(fiche, catalogue);
  const idee = Math.max(0, (Number(params.get('idee')) || 1) - 1);
  vue = preparer(fiche, reco, { demo, actif: idee });
  palettes = vue.proposes.map((l) => l.palette);
  const voulue = vue.proposes[vue.actif].univers.palettes.find((p) => p.id === params.get('couleur'));
  if (voulue) { palettes[vue.actif] = voulue; gouts.ton = voulue.ton; gouts.teinte = voulue.teinte; }
}
const pal = () => palettes[vue.actif];
/** La palette qu'aura l'idée i si on la choisit maintenant (ses goûts suivent d'une idée à l'autre). */
const paletteDe = (i) => {
  if (i === vue.actif) return pal();
  if (!gouts.ton && !gouts.teinte) return palettes[i];
  return choisirPalette(vue.proposes[i].univers, vue.reco.famille, gouts).palette;
};

function majPolices() {
  for (const p of policesUnivers(vue)) {
    if ([...document.querySelectorAll('link[rel="stylesheet"]')].some((l) => l.href === p.url)) continue;
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = p.url; l.dataset.police = p.id;
    document.head.appendChild(l);
  }
}

function rendre() {
  calculer();
  document.getElementById('page').innerHTML = rendreCorps(vue, { palette: pal() });
  document.body.setAttribute('style', stylesCorps(vue, pal()));
  document.title = vue.salut.avecPrenom ? `Bonjour ${vue.salut.nom}` : `Bonjour, ${vue.salut.nom}`;
  const fin = $('#fin');
  fin?.setAttribute('role', 'dialog'); fin?.setAttribute('aria-modal', 'true');
  for (const id of ['p-idees', 'p-couleurs']) { const p = document.getElementById(id); p?.setAttribute('role', 'dialog'); }
  $('#fin-titre')?.setAttribute('tabindex', '-1');
  const aide = $('#aide-texte');
  if (aide) aide.textContent = tactile ? 'Glissez du doigt : c’est votre site.' : 'Faites défiler : c’est votre site.';
  majPolices();
  majIdees();
}

async function charger() {
  const p = params.get('p');
  const voulu = p && /^[a-z0-9-]+$/.test(p) ? p : null;
  const autre = voulu && voulu !== embarque.dossier;
  const frais = chargerCatalogue({ lire: lireJSON }).catch(() => null);
  const [f, cat] = await Promise.all([
    autre ? avant(lireJSON(`donnees/${voulu}.json`).catch(() => null), 4000) : null,
    catalogue.length ? null : avant(frais, 3000),
  ]);
  if (autre && !f) return false; // jamais la page d'un autre praticien
  if (f) fiche = f;
  if (cat && cat.length) catalogue = cat;
  if (params.has('demo')) { try { demo = await avant(lireJSON('accueil/demo.json'), 1500); } catch { demo = null; } }
  if (!fiche || !catalogue.length) return false;
  rendre();
  // un catalogue plus frais (un univers a changé ses palettes) : on ne redessine que si la proposition change,
  // et jamais une fois le site montré
  frais.then((c) => {
    if (!c || !c.length || JSON.stringify(c) === JSON.stringify(catalogue) || $('#apercu')?.dataset.url) return;
    const avantSig = signature(vue);
    catalogue = c;
    if (signature(preparer(fiche, recommander(fiche, catalogue), { demo })) !== avantSig) rendre();
  });
  return true;
}

// --------------------------------------------------------------------------------------------- son site
// Une seule iframe. Elle charge `<univers>/?p=…&palette=…&apercu=1` : exactement le site qu'on ouvrirait.
let jeton = 0, finPret = null;

addEventListener('message', (e) => {
  const f = document.getElementById('apercu');
  if (!f || e.source !== f.contentWindow || !e.data || e.data.type !== 'kazura-pret') return;
  if (finPret && (!e.data.univers || e.data.univers === finPret.id)) finPret.fin('message');
});

function majPassage() {
  const l = vue.proposes[vue.actif], p = pal();
  const passage = $('#passage');
  if (!passage) return;
  passage.style.setProperty('--pt', policeTitre(l.univers));
  $('#passage-titre').innerHTML = titreHTML(vue.titres[vue.actif]);
  $('#passage-ouvrir').href = lienSite(vue, l, p);
}

/** Charge l'idée regardée dans sa palette ; le passage (sa couleur, son titre) couvre le temps du chargement. */
async function montrer() {
  const f = $('#apercu'), scene = $('#scene'), passage = $('#passage');
  if (!f || !scene) return;
  const l = vue.proposes[vue.actif], p = pal();
  const url = lienApercu(vue, l, p);
  if (f.dataset.url === url) return;
  const j = ++jeton;
  majPassage();
  const deja = Boolean(f.dataset.url);
  scene.classList.remove('pret');
  passage.classList.remove('echec');
  if (deja) await pause(reduit ? 560 : 420); // le passage recouvre l'ancien site avant qu'il parte
  if (j !== jeton) return;
  f.dataset.url = url;
  f.title = `Votre site : ${vue.titres[vue.actif].texte}`;
  const raison = await new Promise((resoudre) => {
    let fait = false, minuteur = 0;
    const fin = (pourquoi) => { if (fait) return; fait = true; clearTimeout(minuteur); if (finPret?.fin === fin) finPret = null; resoudre(pourquoi); };
    finPret = { id: l.univers.id, fin };
    f.onload = () => {
      if (j !== jeton) return;
      if (echec(f)) { fin('echec'); return; }
      ecouterGestes(f);
      // un univers sans ?apercu=1 jouerait encore son chargement (2,5 s au plus) : on le laisse finir
      setTimeout(() => fin('charge'), 2600);
    };
    minuteur = setTimeout(() => fin('delai'), 6000);
    // remplacer l'adresse sans ajouter d'étape à l'historique du visiteur
    try { if (deja && f.contentWindow?.location?.href && f.contentWindow.location.href !== 'about:blank') f.contentWindow.location.replace(url); else f.src = url; } catch { f.src = url; }
  });
  if (j !== jeton) return;
  H.dataset.apercu = raison; // pour la relecture
  if (raison === 'echec') { passage.classList.add('echec'); return; }
  scene.classList.add('pret');
}

// L'univers n'a pas répondu (page absente) : le passage reste, avec un lien vers le site.
function echec(f) {
  try {
    const doc = f.contentDocument;
    if (!doc || !doc.body) return true;
    const texte = (doc.body.innerText || '').trim();
    return (/^introuvable$|^404/i.test(texte) || /404|not found/i.test(doc.title)) && !doc.querySelector('script, canvas, main');
  } catch { return false; }
}

// --------------------------------------------------------------------------------------------- l'aide du premier passage
let aideMontree = false;
function montrerAide() {
  if (lireStock('kazura-aide-vue') || aideMontree) return;
  aideMontree = true;
  const a = $('#aide');
  a?.classList.add('vue');
  for (const ev of ['wheel', 'touchstart', 'pointerdown', 'keydown']) addEventListener(ev, cacherAide, { once: true, passive: true });
}
function cacherAide() {
  const a = $('#aide');
  if (!a || !a.classList.contains('vue') || a.classList.contains('partie')) return;
  a.classList.add('partie');
  ecrireStock('kazura-aide-vue');
}
// les gestes faits DANS son site (même origine) comptent aussi, et Échap y referme les panneaux
function ecouterGestes(f) {
  try {
    const w = f.contentWindow;
    for (const ev of ['wheel', 'touchstart', 'pointerdown']) w.addEventListener(ev, cacherAide, { passive: true });
    w.addEventListener('keydown', (e) => { cacherAide(); if (e.key === 'Escape') fermer(); });
    w.addEventListener('pointerdown', () => { if (ouvert && ouvert !== 'fin') fermer(); }, { passive: true });
  } catch {}
}

// --------------------------------------------------------------------------------------------- la barre et ses panneaux
let ouvert = null, retour = null;
const PANNEAUX = { idees: ['#p-idees', '#b-idees'], couleurs: ['#p-couleurs', '#b-couleurs'], fin: ['#fin', '#b-plait'] };

function ouvrir(nom) {
  if (ouvert === nom) { fermer(); return; }
  if (ouvert) fermer({ rendre: false });
  cacherAide();
  const [panneau, bouton] = PANNEAUX[nom].map((s) => $(s));
  if (!panneau) return;
  ouvert = nom; retour = bouton;
  bouton?.setAttribute('aria-expanded', 'true');
  if (nom === 'fin') {
    panneau.scrollTop = 0;
    panneau.classList.add('ouverte');
    for (const s of ['#scene', '#barre']) { const el = $(s); if (el) el.inert = true; }
    setTimeout(() => $('#fin-titre')?.focus({ preventScroll: true }), 60);
  } else {
    if (nom === 'couleurs') $('#couleurs').innerHTML = rendreCouleurs(vue, pal());
    panneau.classList.add('ouvert');
    $('#attrape')?.classList.add('vue');
    const cible = panneau.querySelector('.idee:not([aria-current]) a, .teinte[aria-pressed="true"]') || panneau.querySelector('button, a');
    setTimeout(() => cible?.focus({ preventScroll: true }), 60);
  }
}

function fermer({ rendre: rendreFocus = true } = {}) {
  if (!ouvert) return;
  const [panneau, bouton] = PANNEAUX[ouvert].map((s) => $(s));
  panneau?.classList.remove('ouvert', 'ouverte');
  bouton?.setAttribute('aria-expanded', 'false');
  $('#attrape')?.classList.remove('vue');
  for (const s of ['#scene', '#barre']) { const el = $(s); if (el) el.inert = false; }
  ouvert = null;
  if (rendreFocus && retour && !tactile) retour.focus({ preventScroll: true });
  retour = null;
}

/** Les cartes des idées, peintes dans la palette qu'elles auront si on les choisit. */
function majIdees() {
  const ol = $('#idees');
  if (!ol) return;
  ol.innerHTML = vue.proposes.map((x, i) => rendreIdee(vue, i, paletteDe(i))).join('');
  const actuelle = $('#idee-actuelle');
  if (actuelle) actuelle.innerHTML = titreHTML(vue.titres[vue.actif]);
}

function majEtat() {
  for (const [k, v] of Object.entries(variablesScene(pal()))) document.body.style.setProperty(k, v);
  majIdees();
  const u = new URL(location.href);
  const etat = { idee: vue.actif ? String(vue.actif + 1) : null, couleur: pal().id !== vue.proposes[vue.actif].palette.id ? pal().id : null };
  for (const [k, v] of Object.entries(etat)) (v ? u.searchParams.set(k, v) : u.searchParams.delete(k));
  history.replaceState(null, '', u);
}

function choisirIdee(i) {
  if (!vue.proposes[i]) return;
  fermer({ rendre: false });
  if (i === vue.actif) return;
  palettes[i] = paletteDe(i);
  vue.actif = i;
  majEtat();
  montrer();
  if (!tactile) $('#b-idees')?.focus({ preventScroll: true });
}

function choisirPaletteId(id, note = '') {
  const u = vue.proposes[vue.actif].univers;
  const p = u.palettes.find((x) => x.id === id);
  if (!p) return;
  gouts.ton = p.ton; gouts.teinte = p.teinte;
  palettes[vue.actif] = p;
  $('#couleurs').innerHTML = rendreCouleurs(vue, p, { note });
  $(`.teinte[data-palette="${CSS.escape(p.id)}"]`)?.focus({ preventScroll: true });
  majEtat();
  montrer();
}

function choisirTon(ton) {
  const u = vue.proposes[vue.actif].univers;
  const bouton = $(`.ton[data-ton="${ton}"]`);
  if (bouton?.getAttribute('aria-disabled') === 'true') {
    const autre = ton === 'sombre' ? 'du jour' : 'du soir', voulue = ton === 'sombre' ? 'du soir' : 'du jour';
    $('#couleurs-note').textContent = `Cette idée est pensée pour la lumière ${autre}. Une version en lumière ${voulue} se crée sur demande, pour vous.`;
    return;
  }
  if ((pal().ton === 'sombre' ? 'sombre' : 'clair') === ton) return;
  const p = choisirPalette(u, vue.reco.famille, { ton, teinte: pal().teinte }).palette;
  choisirPaletteId(p.id);
  $(`.ton[data-ton="${ton}"]`)?.focus({ preventScroll: true });
}

function brancher() {
  document.addEventListener('click', (e) => {
    const b = e.target.closest('#b-idees, #b-couleurs, #b-plait');
    if (b) { ouvrir({ 'b-idees': 'idees', 'b-couleurs': 'couleurs', 'b-plait': 'fin' }[b.id]); return; }
    if (e.target.closest('[data-fermer], #attrape')) { fermer(); return; }
    const carte = e.target.closest('.idee-carte');
    if (carte && !e.metaKey && !e.ctrlKey && !e.shiftKey) { e.preventDefault(); choisirIdee(Number(carte.dataset.i)); return; }
    const ton = e.target.closest('.ton');
    if (ton) { choisirTon(ton.dataset.ton); return; }
    const teinte = e.target.closest('.teinte');
    if (teinte) { choisirPaletteId(teinte.dataset.palette); return; }
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && ouvert) { e.preventDefault(); fermer(); } });
  document.addEventListener('change', (e) => {
    if (e.target.id === 'choix-demo') { const u = new URL(location.href); u.searchParams.set('p', e.target.value); for (const k of ['idee', 'couleur']) u.searchParams.delete(k); location.href = u; }
  });
}

// --------------------------------------------------------------------------------------------- la séquence
async function attendrePolices(ms) {
  if (!document.fonts?.load) return;
  const nom = vue?.salut.nom || '';
  await avant(Promise.all([
    document.fonts.load('300 80px Newsreader', 'Bonjour'),
    document.fonts.load('italic 400 80px Newsreader', nom || 'Bonjour'),
    document.fonts.load('400 16px Archivo', 'Bonjour'),
  ]).catch(() => null), Math.max(0, ms));
}

function entrer() {
  $('#barre')?.classList.add('vue');
  setTimeout(montrerAide, reduit ? 900 : 700);
  if (!tactile) { try { $('#apercu')?.contentWindow?.focus(); } catch {} }
}

async function demarrer() {
  brancher();
  const polices = attendrePolices(revisite ? 700 : 2000);
  const ok = await charger();
  if (!ok) {
    if (params.get('p') && params.get('p') !== embarque.dossier) { echecPage(); return; }
    rendre();
  }
  H.classList.remove('autre-fiche');
  if (V && vue) { const c = pal().couleurs; V.teinter([c.fond, c.accent, c.accent2 || c.accent], 500); }
  if (!ouverture) { finir(); montrer(); entrer(); return; }
  await polices;

  // « Bonjour Céline, » s'écrit, puis la phrase de Mathéo et sa signature
  const mot = $('#mot'), h1 = $('#salut');
  const n = h1 ? h1.querySelectorAll('.l').length : 12;
  const ecriture = revisite ? 300 + n * 18 : reduit ? 300 + n * 12 + 500 : 200 + n * 28 + 420;
  mot?.style.setProperty('--dl', `${Math.round(ecriture)}ms`);
  void mot?.offsetWidth;
  H.classList.add('ecrit');
  // le temps de lire la phrase (elle arrive avec la signature 450 ms plus tard)
  const lu = ecriture + 450 + (revisite ? 1100 : reduit ? 2100 : 1800);
  // son site se charge juste avant la fin de la lecture : sa première impression se jouera devant elle
  let chargement = null;
  const lancer = () => { if (!chargement) chargement = montrer(); return chargement; };
  const avance = setTimeout(lancer, Math.max(0, lu - 1500));
  setTimeout(() => { if (!H.classList.contains('pret')) { presse = true; reveil && reveil(); } }, 9000);
  await attendre(lu);
  clearTimeout(avance);
  await avant(lancer(), presse ? 1800 : 2600);

  // le voile s'ouvre depuis le centre, le mot s'efface, le site est là
  mot?.classList.add('part');
  H.classList.remove('ouverture');
  const voileEl = document.getElementById('voile');
  voileEl.style.pointerEvents = 'none';
  const duree = presse || revisite ? 800 : reduit ? 1100 : 1200;
  const cx = innerWidth / 2, cy = innerHeight * 0.46;
  setTimeout(entrer, duree * 0.55);
  if (V) await V.ouvrir(duree, cx, cy);
  else { voileEl.style.setProperty('--cx', `${Math.round(cx)}px`); voileEl.style.setProperty('--cy', `${Math.round(cy)}px`); voileEl.classList.add('css-ouvre'); await pause(duree); }
  H.classList.remove('voile-actif');
  V?.detruire();
  mot?.classList.remove('part');
  mot?.classList.add('cache');
  ecrireStock('kazura-accueil-vu');
  finir();
}

function echecPage() {
  H.classList.remove('ouverture', 'voile-actif', 'autre-fiche');
  H.className = 'sans-js';
  document.getElementById('page').innerHTML = '<header class="mot"><h1 class="salut" style="--long:8">Bonjour</h1><p class="phrase">Votre aperçu n’a pas pu se charger. Rechargez la page dans un instant : il vous attend.</p></header>';
}

function finir() {
  H.classList.remove('ouverture', 'voile-actif');
  H.classList.add('pret');
  if (!$('#mot')?.classList.contains('cache')) $('#mot')?.classList.add('cache');
}

demarrer().catch((e) => { console.error(e); finir(); });
