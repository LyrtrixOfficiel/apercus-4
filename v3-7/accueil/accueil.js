// Page d'arrivée, côté navigateur (troisième tour).
// La fiche ?p=<dossier>, l'ouverture « Bonjour <prénom> », puis SON site, vivant, dans un écran : un seul aperçu
// à la fois (une seule iframe, rechargée à chaque univers, teinte ou appareil), un fondu soigné le temps qu'il se
// prépare (message « kazura-pret » de l'univers, ou 6 s au plus), une barre de réglage collée à l'écran.
// Le rendu lui-même vit dans rendu.js (partagé avec node).
import { chargerCatalogue, recommander, TEINTES } from '../commun/recommandation.js';
import { preparer, rendreCorps, policesUnivers, stylesCorps, variablesScene, paletteDe, lienSite, lienApercu, raisonCourte, policeTitre, APPAREILS, esc, fr } from './rendu.js';
import { voile as creerVoile } from './voile.js';

const H = document.documentElement;
H.classList.add('vivant'); // le script tourne : les filets de sécurité CSS se retirent
const reduit = matchMedia('(prefers-reduced-motion: reduce)').matches;
const etroit = matchMedia('(max-width: 699px)');
const params = new URLSearchParams(location.search);
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const $ = (s) => document.querySelector(s);

let embarque = {};
try { embarque = JSON.parse(document.getElementById('donnees')?.textContent || '{}'); } catch {}
let fiche = embarque.fiche, catalogue = embarque.catalogue || [];
const gouts = {};
if (TEINTES[params.get('teinte')]) gouts.teinte = params.get('teinte');
if (['clair', 'sombre'].includes(params.get('ton'))) gouts.ton = params.get('ton');
let mode = etroit.matches ? 'tel' : (params.get('appareil') === 'tel' ? 'tel' : 'ordi');
let vue = null, demo = null;

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
}
const attendre = (ms) => (presse ? Promise.resolve() : new Promise((r) => { const t = setTimeout(r, ms); reveil = () => { clearTimeout(t); r(); }; }));

// --------------------------------------------------------------------------------------------- données
const lireJSON = async (url) => { const r = await fetch(url, { cache: 'no-cache' }); if (!r.ok) throw new Error(url); return r.json(); };
const avant = (promesse, ms) => Promise.race([promesse, pause(ms).then(() => null)]);
const signature = (v) => v ? v.proposes.map((l) => `${l.univers.id}:${l.palette.id}`).join(',') : '';

function calculer() {
  const reco = recommander(fiche, catalogue);
  vue = preparer(fiche, reco, { demo, actif: params.get('u') });
}

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
  const l = vue.proposes[vue.actif];
  const c = paletteDe(l, vue.reco.famille, gouts, vue.proposes);
  document.getElementById('page').innerHTML = rendreCorps(vue, { gouts, mode });
  document.body.setAttribute('style', stylesCorps(vue, c.palette));
  document.title = vue.salut.avecPrenom ? `Bonjour ${vue.salut.nom}` : `Bonjour, ${vue.salut.nom}`;
  majPolices();
  installer();
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
  // un catalogue plus frais (un univers a changé ses palettes) : on ne redessine que si la proposition change
  frais.then((c) => {
    if (!c || !c.length || JSON.stringify(c) === JSON.stringify(catalogue)) return;
    const avantSig = signature(vue);
    catalogue = c;
    const reco = recommander(fiche, catalogue);
    const essai = preparer(fiche, reco, { demo, actif: params.get('u') });
    if (signature(essai) !== avantSig) rendre();
  });
  return true;
}

// --------------------------------------------------------------------------------------------- l'aperçu en direct
// Une seule iframe. Elle charge `<univers>/?p=…&palette=…&apercu=1` : exactement le site qu'on ouvre, en vitrine.
let jeton = 0, finPret = null;

function ajuster() {
  const vueEcran = document.getElementById('ecran-vue'), f = document.getElementById('apercu');
  if (!vueEcran || !f) return;
  const A = APPAREILS[mode];
  const k = vueEcran.clientWidth / A.l;
  if (k > 0) vueEcran.style.setProperty('--k', k.toFixed(5));
  // téléphone : pas d'appareil dessiné, le site remplit le cadre ; la fenêtre simulée prend la hauteur du cadre
  if (k > 0 && etroit.matches) f.style.height = `${Math.round(vueEcran.clientHeight / k)}px`; else f.style.height = '';
}

let observateur = null;
function installer() {
  const app = document.getElementById('appareil');
  if (!app) return;
  const A = APPAREILS[mode];
  app.dataset.mode = mode;
  app.style.setProperty('--vl', A.l); app.style.setProperty('--vh', A.h);
  observateur?.disconnect();
  observateur = new ResizeObserver(ajuster);
  observateur.observe(document.getElementById('ecran-vue'));
  // l'invitation « Faites défiler votre site » s'efface dès qu'on fait défiler dans le site
  const fr8 = document.getElementById('apercu');
  if (fr8 && !fr8.dataset.ecoute) { fr8.dataset.ecoute = '1'; fr8.addEventListener('load', () => { try { fr8.contentWindow.addEventListener('scroll', () => document.getElementById('ecran')?.classList.add('defile'), { once: true, passive: true }); } catch {} }); }
  ajuster();
  majDispo();
  const l = vue.proposes[vue.actif];
  montrer(l, paletteDe(l, vue.reco.famille, gouts, vue.proposes).palette);
}

addEventListener('message', (e) => {
  const f = document.getElementById('apercu');
  if (!f || e.source !== f.contentWindow || !e.data || e.data.type !== 'kazura-pret') return;
  if (finPret && (!e.data.univers || e.data.univers === finPret.id)) finPret.fin('message');
});

function voileEcran(l, palette) {
  const v = document.getElementById('ecran-voile'), ecran = document.getElementById('ecran');
  if (!v || !ecran) return;
  const vars = variablesScene(palette);
  ecran.style.setProperty('--e-fond', vars['--e-fond']);
  ecran.style.setProperty('--e-accent', vars['--e-accent']);
  v.style.setProperty('--pt', policeTitre(l.univers));
  v.querySelector('.ev-nom').textContent = vue.nomPoster;
  v.href = lienSite(vue, l, palette);
}

async function montrer(l, palette, { force = false } = {}) {
  const f = document.getElementById('apercu'), ecran = document.getElementById('ecran');
  if (!f || !ecran) return;
  const url = lienApercu(vue, l, palette);
  if (!force && f.dataset.url === url) return;
  const j = ++jeton;
  voileEcran(l, palette);
  const deja = Boolean(f.dataset.url);
  ecran.classList.remove('pret');
  ecran.querySelector('.ecran-repli')?.remove();
  if (deja) await pause(reduit ? 520 : 380); // le voile recouvre l'ancien site avant qu'il parte
  if (j !== jeton) return;
  f.dataset.url = url;
  f.title = `Votre site, en direct`;
  const raison = await new Promise((resoudre) => {
    let fait = false, minuteur = 0;
    const fin = (pourquoi) => { if (fait) return; fait = true; clearTimeout(minuteur); if (finPret?.fin === fin) finPret = null; resoudre(pourquoi); };
    finPret = { id: l.univers.id, fin };
    f.onload = () => {
      if (j !== jeton) return;
      if (echec(f)) { fin('echec'); return; }
      // un univers sans ?apercu=1 joue encore son propre chargement (2,5 s au plus) : on le laisse finir
      setTimeout(() => fin('charge'), 2600);
    };
    minuteur = setTimeout(() => fin('delai'), 6000);
    // remplacer l'adresse sans ajouter d'étape à l'historique du visiteur
    try { if (deja && f.contentWindow?.location?.href && f.contentWindow.location.href !== 'about:blank') f.contentWindow.location.replace(url); else f.src = url; } catch { f.src = url; }
  });
  if (j !== jeton) return;
  if (raison === 'echec') await repli(l, palette);
  ecran.classList.add('pret');
  document.documentElement.dataset.apercu = raison; // pour la relecture
}

// L'univers n'a pas répondu (page absente) : on montre son affiche construite, en lien vers le site.
function echec(f) {
  try {
    const doc = f.contentDocument;
    if (!doc || !doc.body) return true;
    const texte = (doc.body.innerText || '').trim();
    return (/^introuvable$|^404/i.test(texte) || /404|not found/i.test(doc.title)) && !doc.querySelector('script, canvas, main');
  } catch { return false; }
}
async function repli(l, palette) {
  try {
    if (!document.querySelector('link[data-affiches]')) {
      const lien = document.createElement('link');
      lien.rel = 'stylesheet'; lien.href = new URL('./affiches.css', import.meta.url).href; lien.dataset.affiches = '1';
      document.head.appendChild(lien);
    }
    const { affiche } = await import('./affiches.js');
    const ecranVue = document.getElementById('ecran-vue');
    const div = document.createElement('div');
    div.className = 'ecran-repli';
    div.innerHTML = `${affiche({ ...l, palette }, vue, { taille: 'grande' })}<a href="${esc(lienSite(vue, l, palette))}" aria-label="Ouvrir votre site"></a>`;
    div.querySelectorAll('.affiche').forEach((a) => a.classList.add('vue', 'en-vue'));
    ecranVue.appendChild(div);
  } catch {}
}

// --------------------------------------------------------------------------------------------- univers, teinte, appareil
const nuance = (p) => `<span class="nuance" aria-hidden="true">${['fond', 'accent', 'accent2', 'encre'].filter((k) => /^#[0-9a-f]{6}$/i.test(p.couleurs[k] || '')).map((k) => `<i style="background:${esc(p.couleurs[k])}"></i>`).join('')}</span>`;
const FLECHE = '<svg class="fleche" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17L17 7M9 7h8v8"/></svg>';
const ALLER = '<svg class="fleche" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6"/></svg>';

function majDispo() {
  const u = vue.proposes[vue.actif].univers;
  document.querySelectorAll('.pastille').forEach((b) => { b.dataset.dispo = u.palettes.some((p) => p.teinte === b.dataset.teinte) ? 'oui' : 'non'; });
}

function appliquer({ recharger = true } = {}) {
  const l = vue.proposes[vue.actif];
  const c = paletteDe(l, vue.reco.famille, gouts, vue.proposes);
  for (const [k, v] of Object.entries(variablesScene(c.palette))) document.body.style.setProperty(k, v);
  document.querySelectorAll('.onglet a').forEach((a) => { const on = Number(a.dataset.i) === vue.actif; a.setAttribute('aria-selected', String(on)); const v = a.querySelector('.o-voir'); if (v) v.textContent = on ? 'À l’écran' : 'Voir'; });
  const ra = $('.raison-active'); if (ra) ra.innerHTML = fr(raisonCourte(l, vue.d));
  $('#vitrine')?.setAttribute('aria-labelledby', `o-${l.univers.id}`);
  const note = $('#note');
  if (note) note.innerHTML = `${nuance(c.palette)}<span class="note-texte">${fr(c.note)}</span>${c.autre ? ` <button class="autre" type="button" data-aller="${esc(c.autre.id)}">${fr(c.autre.texte)} ${ALLER}</button>` : ''}`;
  const site = lienSite(vue, l, c.palette);
  const ouvrir = $('#ouvrir'); if (ouvrir) ouvrir.href = site;
  document.querySelectorAll('.lumiere').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.ton === gouts.ton)));
  document.querySelectorAll('.pastille').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.teinte === gouts.teinte)));
  document.querySelectorAll('.mode').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === mode)));
  majDispo();
  const u = new URL(location.href);
  const etat = { u: vue.actif ? l.univers.id : null, teinte: gouts.teinte, ton: gouts.ton, appareil: !etroit.matches && mode === 'tel' ? 'tel' : null };
  for (const [k, v] of Object.entries(etat)) (v ? u.searchParams.set(k, v) : u.searchParams.delete(k));
  history.replaceState(null, '', u);
  if (recharger) montrer(l, c.palette);
}

function choisir(i) {
  if (i < 0 || i >= vue.proposes.length) return;
  const li = document.querySelectorAll('.onglet')[i];
  if (li?.hidden) { li.hidden = false; $('#piste')?.remove(); }
  if (i === vue.actif) return;
  vue.actif = i;
  appliquer();
}

async function changerMode(m) {
  if (m === mode || (etroit.matches && m !== 'tel')) return;
  const app = document.getElementById('appareil');
  mode = m;
  app.classList.add('bascule');
  await pause(reduit ? 420 : 320);
  const A = APPAREILS[mode];
  app.dataset.mode = mode;
  app.style.setProperty('--vl', A.l); app.style.setProperty('--vh', A.h);
  ajuster();
  requestAnimationFrame(() => app.classList.remove('bascule'));
  appliquer({ recharger: false });
  const l = vue.proposes[vue.actif];
  montrer(l, paletteDe(l, vue.reco.famille, gouts, vue.proposes).palette, { force: true });
}

function brancher() {
  document.addEventListener('click', (e) => {
    const onglet = e.target.closest('.onglet a');
    if (onglet && !e.metaKey && !e.ctrlKey && !e.shiftKey) { e.preventDefault(); choisir(Number(onglet.dataset.i)); return; }
    if (e.target.closest('#piste')) { choisir(3); document.querySelector('.onglet.quatrieme a')?.focus({ preventScroll: true }); return; }
    const lum = e.target.closest('.lumiere');
    if (lum) { gouts.ton = gouts.ton === lum.dataset.ton ? undefined : lum.dataset.ton; appliquer(); return; }
    const p = e.target.closest('.pastille');
    if (p) { gouts.teinte = gouts.teinte === p.dataset.teinte ? undefined : p.dataset.teinte; appliquer(); return; }
    const m = e.target.closest('.mode');
    if (m) { changerMode(m.dataset.mode); return; }
    const aller = e.target.closest('[data-aller]');
    if (aller) { const i = vue.proposes.findIndex((l) => l.univers.id === aller.dataset.aller); if (i >= 0) { const li = document.querySelectorAll('.onglet')[i]; if (li?.hidden) { li.hidden = false; $('#piste')?.remove(); } vue.actif = i; appliquer(); } }
  });
  // flèches du clavier dans la liste d'onglets
  document.addEventListener('keydown', (e) => {
    const a = e.target.closest?.('.onglet a');
    if (!a || !['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    const tous = [...document.querySelectorAll('.onglet:not([hidden]) a')];
    const k = tous.indexOf(a) + (['ArrowDown', 'ArrowRight'].includes(e.key) ? 1 : -1);
    const cible = tous[(k + tous.length) % tous.length];
    if (cible) { e.preventDefault(); cible.focus(); choisir(Number(cible.dataset.i)); }
  });
  document.addEventListener('change', (e) => {
    if (e.target.id === 'choix-demo') { const u = new URL(location.href); u.searchParams.set('p', e.target.value); for (const k of ['teinte', 'ton', 'u', 'appareil']) u.searchParams.delete(k); location.href = u; }
  });
  etroit.addEventListener?.('change', () => { if (etroit.matches && mode !== 'tel') changerMode('tel'); });
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

async function demarrer() {
  brancher();
  const polices = attendrePolices(revisite ? 700 : 2000);
  const ok = await charger();
  if (!ok) {
    if (params.get('p') && params.get('p') !== embarque.dossier) { echecPage(); return; }
    rendre();
  }
  H.classList.remove('autre-fiche');
  if (V && vue) V.teinter([vue.voile.fond, vue.voile.accent, vue.voile.accent2 || vue.voile.accent], 500);
  if (!ouverture) { finir(); return; }
  await polices;
  const h1 = document.getElementById('salut');
  const place = h1 ? h1.getBoundingClientRect() : null; // place finale du titre, d'où le voile s'ouvrira
  let echelle = 1, dx = 0, dy = 0;
  if (h1 && place) { // aussi en mouvement réduit : la salutation doit être lisible au centre (sans voyage brusque)
    // la salutation naît au centre de l'écran, en grand, puis rejoint sa place de titre
    echelle = Math.max(1, Math.min(2.2, (innerWidth * (innerWidth < 700 ? 0.9 : 0.78)) / place.width, (innerHeight * 0.5) / place.height));
    dx = innerWidth / 2 - (place.left + place.width / 2); dy = innerHeight / 2 - (place.top + place.height / 2);
    h1.style.transform = `translate(${Math.round(dx)}px, ${Math.round(dy)}px) scale(${echelle.toFixed(3)})`;
  }
  // sous la salutation, son métier et sa ville
  const ligne = document.getElementById('voile-ligne');
  if (false && ligne && h1 && place && vue?.identite) {
    ligne.textContent = vue.identite;
    const larg = place.width * echelle, haut = place.height * echelle;
    const cx = place.left + place.width / 2 + dx, cy = place.top + place.height / 2 + dy;
    ligne.style.left = `${Math.round(Math.max(16, cx - larg / 2 + larg * 0.004))}px`;
    ligne.style.top = `${Math.round(cy + haut / 2 + Math.min(26, innerHeight * 0.03))}px`;
    ligne.style.setProperty('--dl', `${(reduit ? 400 : 260) + h1.querySelectorAll('.l').length * (reduit ? 12 : 28)}ms`);
  }
  void h1?.offsetWidth;
  H.classList.add('ecrit');
  const lettres = h1 ? h1.querySelectorAll('.salut-nom .l').length : 6;
  const ecriture = revisite ? 480 : reduit ? 300 + lettres * 12 + 700 : 200 + lettres * 28 + 620;
  await attendre(ecriture + (revisite ? 120 : 280));
  // puis on attend vraiment son geste : « Touchez l’écran » doit dire vrai (filet de sécurité : 30 s)
  if (!presse && !revisite) { H.classList.add('invite'); await attendre(30000); }

  // le voile s'ouvre depuis la place du titre ; la salutation devient le titre, le site apparaît
  const vite = presse || revisite;
  h1?.classList.add('vole');
  void h1?.offsetWidth;
  if (h1) h1.style.transform = '';
  H.classList.remove('ouverture');
  const voileEl = document.getElementById('voile');
  voileEl.style.pointerEvents = 'none';
  const duree = vite ? 700 : reduit ? 1000 : 1100;
  const cx = place ? place.left + place.width * 0.45 : innerWidth / 2, cy = place ? place.top + place.height / 2 : innerHeight / 2;
  if (V) await V.ouvrir(duree, cx, cy);
  else { voileEl.style.setProperty('--cx', `${Math.round(cx)}px`); voileEl.style.setProperty('--cy', `${Math.round(cy)}px`); voileEl.classList.add('css-ouvre'); await pause(duree); }
  H.classList.remove('voile-actif');
  V?.detruire();
  setTimeout(() => h1?.classList.remove('vole'), 1400);
  try { localStorage.setItem('kazura-accueil-vu', '1'); } catch {}
  finir();
}

function echecPage() {
  H.classList.remove('ouverture', 'voile-actif', 'autre-fiche');
  document.getElementById('page').innerHTML = '<div class="scene"><header class="tete"><span class="kazura">Kazura</span><span class="prive">Aperçu privé</span></header><h1 class="salut" style="--long:8">Bonjour</h1><p class="lu-texte">Votre aperçu n’a pas pu se charger. Rechargez la page dans un instant : il vous attend.</p></div>';
}

function finir() {
  H.classList.remove('ouverture', 'voile-actif');
  H.classList.add('pret');
}

demarrer().catch((e) => { console.error(e); finir(); });
