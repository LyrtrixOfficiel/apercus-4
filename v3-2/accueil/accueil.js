// Page d'arrivée, côté navigateur : la fiche ?p=<dossier>, l'ouverture « Bonjour <prénom> », le nuancier qui
// re-teinte les affiches en direct, l'aperçu à la demande. Le rendu lui-même vit dans rendu.js (partagé avec node).
import { chargerCatalogue, recommander, lienUnivers, TEINTES } from '../commun/recommandation.js';
import { preparer, rendreCorps, rendreChoix, rendreAutre, rendreMiroir, policesUnivers, stylesCorps, esc } from './rendu.js';
import { affiche, variablesAffiche } from './affiches.js';
import { voile as creerVoile } from './voile.js';

const H = document.documentElement;
H.classList.add('vivant'); // le script tourne : les filets de sécurité CSS se retirent
const reduit = matchMedia('(prefers-reduced-motion: reduce)').matches;
const params = new URLSearchParams(location.search);
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const t0 = performance.now();

let embarque = {};
try { embarque = JSON.parse(document.getElementById('donnees')?.textContent || '{}'); } catch {}
let fiche = embarque.fiche, catalogue = embarque.catalogue || [];
const gouts = {};
if (TEINTES[params.get('teinte')]) gouts.teinte = params.get('teinte');
if (['clair', 'sombre'].includes(params.get('ton'))) gouts.ton = params.get('ton');
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
  // dès la première image de soie, le fond CSS du voile s'efface : le trou ouvrira bien sur la page
  try { V = creerVoile(document.getElementById('voile-toile'), { reduit, depart: depart.length === 3 ? depart : null, premiere: () => document.getElementById('voile')?.classList.add('gl') }); } catch { V = null; }
  const passer = () => { presse = true; reveil && reveil(); };
  for (const ev of ['pointerdown', 'keydown', 'wheel', 'touchstart']) addEventListener(ev, passer, { once: true, passive: true });
}
// une attente que le visiteur peut écourter d'un toucher
const attendre = (ms) => (presse ? Promise.resolve() : new Promise((r) => { const t = setTimeout(r, ms); reveil = () => { clearTimeout(t); r(); }; }));

// --------------------------------------------------------------------------------------------- données
const lireJSON = async (url) => { const r = await fetch(url, { cache: 'no-cache' }); if (!r.ok) throw new Error(url); return r.json(); };
const avant = (promesse, ms) => Promise.race([promesse, pause(ms).then(() => null)]);

function calculer() {
  const reco = recommander(fiche, catalogue, gouts);
  vue = preparer(fiche, reco, { demo });
}

function majPolices() {
  document.querySelectorAll('link[data-police]').forEach((l) => l.remove());
  for (const p of policesUnivers(vue, catalogue)) {
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = p.url; l.dataset.police = p.id;
    document.head.appendChild(l);
  }
}

function rendre() {
  calculer();
  document.getElementById('page').innerHTML = rendreCorps(vue);
  document.body.setAttribute('style', stylesCorps(vue));
  document.title = vue.salut.avecPrenom ? `Bonjour ${vue.salut.nom}` : `Bonjour, ${vue.salut.nom}`;
}

// Le catalogue des univers est embarqué dans la page (batir.mjs) : on rend tout de suite avec lui, et on va
// chercher en arrière-plan les univers.json du moment ; s'ils ont changé, la page se recalcule sans bruit.
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
  frais.then((c) => { if (c && c.length && JSON.stringify(c) !== JSON.stringify(catalogue)) { catalogue = c; rafraichir(); } });
  return true;
}

// Nouveau catalogue reçu après le premier rendu : on remplace le contenu sous l'en-tête (le titre peut être en vol).
function rafraichir() {
  calculer();
  const t = document.createElement('template');
  t.innerHTML = rendreCorps(vue);
  const neuf = t.content.getElementById('contenu'), ancien = document.getElementById('contenu');
  if (!neuf || !ancien) return;
  ancien.replaceWith(neuf);
  document.body.setAttribute('style', stylesCorps(vue));
  if (H.classList.contains('pret')) { majPolices(); observer(neuf); }
}

// --------------------------------------------------------------------------------------------- observation
let io = null;
function observer(racine = document) {
  const cibles = racine.querySelectorAll('.revele, .affiche, .nuancier, .feuille');
  if (!('IntersectionObserver' in window)) { cibles.forEach((c) => c.classList.add('vu', 'vue', 'en-vue', 'ouvert')); return; }
  io ??= new IntersectionObserver((entrees) => {
    for (const e of entrees) {
      const el = e.target;
      if (el.classList.contains('affiche')) {
        el.classList.toggle('en-vue', e.isIntersecting);
        if (e.isIntersecting) el.classList.add('vue');
      } else if (e.isIntersecting) {
        el.classList.add(el.classList.contains('nuancier') ? 'ouvert' : 'vu');
        if (el.classList.contains('feuille')) el.classList.add('vu');
        io.unobserve(el);
      }
    }
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });
  cibles.forEach((c) => io.observe(c));
}

// --------------------------------------------------------------------------------------------- goûts en direct
function majAffiche(el, ligne) {
  // même univers : on ne change que les couleurs (transition douce des variables CSS)
  for (const [k, v] of Object.entries(variablesAffiche(ligne, vue))) el.style.setProperty(k, v);
  el.dataset.ton = ligne.palette.ton || 'clair';
  el.classList.toggle('affiche-grise', Boolean(gouts.teinte && ligne.accord === 'gris'));
  const mot = el.querySelector('.ed-mot');
  if (mot) mot.textContent = ligne.raison?.type === 'mots' ? `« ${ligne.raison.mot} »` : '';
}

function remplacer(ancien, html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  const neuf = t.content.firstElementChild;
  ancien.replaceWith(neuf);
  observer(neuf);
  neuf.querySelectorAll('.affiche').forEach((a) => a.classList.add('vue', 'en-vue'));
  return neuf;
}

function majChoix() {
  vue.top.forEach((l, i) => {
    const el = document.querySelector(`.choix-${i + 1}`);
    if (!el) return;
    if (el.dataset.id !== l.univers.id) {
      const neuf = remplacer(el, rendreChoix(l, i, vue));
      neuf.querySelectorAll('.revele').forEach((x) => x.classList.add('vu'));
      neuf.querySelector('.affiche')?.animate?.([{ opacity: 0 }, { opacity: 1 }], { duration: reduit ? 900 : 600, easing: 'ease' });
      return;
    }
    const lien = lienUnivers(l.univers.id, vue.dossier, l.palette.id);
    el.dataset.palette = l.palette.id;
    majAffiche(el.querySelector('.affiche'), l);
    const html = document.createElement('div');
    html.innerHTML = rendreChoix(l, i, vue);
    for (const sel of ['.raison', '.teinte', '.actions']) el.querySelector(sel).innerHTML = html.querySelector(sel).innerHTML;
    const cadre = el.querySelector('.cadre');
    cadre.href = lien; cadre.setAttribute('aria-label', html.querySelector('.cadre').getAttribute('aria-label'));
  });
}

function majMiroir() {
  const m = document.getElementById('miroir');
  if (!m) return;
  vue.top.forEach((l, i) => {
    const carte = m.querySelector(`.m-${i + 1}`);
    if (!carte) return;
    if (carte.dataset.id === l.univers.id) { majAffiche(carte.querySelector('.affiche'), l); return; }
    carte.dataset.id = l.univers.id;
    carte.innerHTML = affiche(l, vue, { taille: 'mini' });
    carte.classList.remove('nouvelle'); void carte.offsetWidth; carte.classList.add('nouvelle');
    carte.querySelectorAll('.affiche').forEach((a) => a.classList.add('vue', 'en-vue'));
  });
  const neuf = document.createElement('div');
  neuf.innerHTML = rendreMiroir(vue);
  m.querySelector('.miroir-legende').innerHTML = neuf.querySelector('.miroir-legende').innerHTML;
}

function majAutres() {
  const bande = document.getElementById('bande');
  if (!bande) return;
  const defile = bande.scrollLeft;
  bande.innerHTML = vue.autres.map((l, i) => rendreAutre(l, i, vue)).join('');
  bande.scrollLeft = defile;
  observer(bande);
}

function majCommandes() {
  document.querySelectorAll('.lumiere').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.ton === gouts.ton)));
  document.querySelectorAll('.lame').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.teinte === gouts.teinte)));
  document.querySelector('.nuancier')?.classList.toggle('choisi', Boolean(gouts.teinte));
  const eff = document.getElementById('effacer');
  if (eff) eff.hidden = !(gouts.teinte || gouts.ton);
  document.body.setAttribute('style', stylesCorps(vue));
  const u = new URL(location.href);
  for (const k of ['teinte', 'ton']) gouts[k] ? u.searchParams.set(k, gouts[k]) : u.searchParams.delete(k);
  history.replaceState(null, '', u);
}

function appliquerGouts() {
  calculer();
  majChoix(); majMiroir(); majAutres(); majCommandes();
}

// --------------------------------------------------------------------------------------------- aperçu à la demande
function ouvrirApercu(lien, nom) {
  const d = document.getElementById('fenetre');
  if (!d || typeof d.showModal !== 'function') { location.href = lien; return; }
  document.getElementById('fenetre-titre').textContent = nom;
  document.getElementById('fenetre-grand').href = lien;
  const f = document.getElementById('fenetre-iframe');
  f.src = lien;
  d.showModal();
}
function fermerApercu() {
  const d = document.getElementById('fenetre');
  d?.close();
}

// --------------------------------------------------------------------------------------------- événements (délégués)
function brancher() {
  document.addEventListener('click', (e) => {
    const lum = e.target.closest('.lumiere');
    if (lum) { gouts.ton = gouts.ton === lum.dataset.ton ? undefined : lum.dataset.ton; appliquerGouts(); return; }
    const lame = e.target.closest('.lame');
    if (lame) { gouts.teinte = gouts.teinte === lame.dataset.teinte ? undefined : lame.dataset.teinte; appliquerGouts(); return; }
    if (e.target.closest('#effacer')) { delete gouts.teinte; delete gouts.ton; appliquerGouts(); return; }
    const ap = e.target.closest('[data-apercu]');
    if (ap) { e.preventDefault(); ouvrirApercu(ap.dataset.apercu, ap.dataset.nom || 'Aperçu'); return; }
    if (e.target.closest('#fenetre-fermer')) { fermerApercu(); return; }
    const d = document.getElementById('fenetre');
    if (e.target === d) fermerApercu(); // clic sur le fond
  });
  document.getElementById('fenetre')?.addEventListener('close', () => { const f = document.getElementById('fenetre-iframe'); if (f) f.src = 'about:blank'; });
  document.addEventListener('change', (e) => {
    if (e.target.id === 'choix-demo') { const u = new URL(location.href); u.searchParams.set('p', e.target.value); u.searchParams.delete('teinte'); u.searchParams.delete('ton'); location.href = u; }
  });
}

// --------------------------------------------------------------------------------------------- la séquence
async function attendrePolices(ms) {
  if (!document.fonts?.load) return;
  const nom = vue?.salut.nom || '';
  // la feuille de Google Fonts arrive sans bloquer l'affichage : on l'attend avant de demander les polices
  const feuille = [...document.querySelectorAll('link[rel="stylesheet"]')].find((l) => l.href.includes('Newsreader'));
  const feuillePrete = feuille && !feuille.sheet ? new Promise((r) => { feuille.addEventListener('load', r, { once: true }); feuille.addEventListener('error', r, { once: true }); }) : Promise.resolve();
  await avant(feuillePrete.then(() => Promise.all([
    document.fonts.load(`300 80px Newsreader`, 'Bonjour'),
    document.fonts.load(`italic 400 80px Newsreader`, nom || 'Bonjour'),
    document.fonts.load(`400 16px Archivo`),
  ])).catch(() => null), Math.max(0, ms));
}

async function demarrer() {
  brancher();
  // polices et données en même temps ; la salutation attend les deux (le vrai prénom, la vraie police)
  const polices = attendrePolices(revisite ? 700 : 2000);
  const ok = await charger();
  performance.mark('kz-donnees');
  if (!ok) {
    // jamais le prénom d'un autre : sans sa fiche, on le dit simplement
    if (params.get('p') && params.get('p') !== embarque.dossier) { echec(); return; }
    calculer();
  }
  H.classList.remove('autre-fiche');
  if (V && vue) V.teinter([vue.voile.fond, vue.voile.accent, vue.voile.accent2 || vue.voile.accent], 500);

  if (!ouverture) { finir(); return; }
  await polices;
  performance.mark('kz-polices');
  const h1 = document.getElementById('salut');
  const place = h1 ? h1.getBoundingClientRect() : null; // place finale du titre, d'où le voile s'ouvrira
  if (h1 && !reduit) {
    // la salutation naît au centre de l'écran, puis rejoint sa place de titre
    const r = place;
    const dx = innerWidth / 2 - (r.left + r.width / 2), dy = innerHeight / 2 - (r.top + r.height / 2);
    h1.style.transform = `translate(${Math.round(dx)}px, ${Math.round(dy)}px)`;
  }
  // sous la salutation, son métier et sa ville (remplis ici seulement : jamais la ligne d'un autre praticien)
  const ligne = document.getElementById('voile-ligne');
  if (ligne && h1 && place && vue?.identite) {
    ligne.textContent = vue.identite;
    const dx = reduit ? 0 : innerWidth / 2 - (place.left + place.width / 2), dy = reduit ? 0 : innerHeight / 2 - (place.top + place.height / 2);
    ligne.style.left = `${Math.round(place.left + dx + h1.offsetWidth * 0.004)}px`;
    ligne.style.top = `${Math.round(place.bottom + dy + Math.min(28, innerHeight * 0.03))}px`;
    ligne.style.setProperty('--dl', `${(reduit ? 400 : 260) + h1.querySelectorAll('.l').length * (reduit ? 12 : 28)}ms`);
  }
  void h1?.offsetWidth;
  H.classList.add('ecrit');
  // si l'appareil est très lent, l'ouverture s'accélère 4 s après le début de l'écriture (elle ne se coupe jamais)
  setTimeout(() => { if (!H.classList.contains('pret')) { presse = true; reveil && reveil(); } }, 4000);
  performance.mark('kz-ecrit');
  // durée de l'écriture : la dernière lettre posée, plus un souffle ; 3 s au plus pour toute l'ouverture
  const lettres = h1 ? h1.querySelectorAll('.salut-nom .l').length : 6;
  // la salutation reste lisible un instant, entière, avant de rejoindre sa place
  const ecriture = revisite ? 480 : reduit ? 300 + lettres * 12 + 700 : 200 + lettres * 28 + 560;
  await attendre(ecriture + (revisite ? 120 : 260));

  // le voile s'ouvre, la salutation devient le titre
  const vite = presse || revisite;
  h1?.classList.add('vole');
  void h1?.offsetWidth;
  if (h1) h1.style.transform = '';
  H.classList.remove('ouverture');
  performance.mark('kz-ouvre');
  const voileEl = document.getElementById('voile');
  voileEl.style.pointerEvents = 'none';
  const duree = vite ? 700 : reduit ? 1000 : 1050;
  const cx = place ? place.left + place.width * 0.4 : innerWidth / 2, cy = place ? place.top + place.height / 2 : innerHeight / 2;
  if (V) await V.ouvrir(duree, cx, cy);
  else { voileEl.style.setProperty('--cx', `${Math.round(cx)}px`); voileEl.style.setProperty('--cy', `${Math.round(cy)}px`); voileEl.classList.add('css-ouvre'); await pause(duree); }
  H.classList.remove('voile-actif');
  performance.mark('kz-ouvert');
  V?.detruire();
  setTimeout(() => h1?.classList.remove('vole'), 1300);
  try { localStorage.setItem('kazura-accueil-vu', '1'); } catch {}
  finir();
}

function echec() {
  H.classList.remove('ouverture', 'voile-actif', 'autre-fiche');
  document.getElementById('page').innerHTML = '<header class="tete"><div class="marque"><span class="kazura">Kazura</span><span class="prive">Aperçu privé</span></div><h1 class="salut" style="--long:8">Bonjour</h1><div class="tete-texte"><p class="chapeau">Votre aperçu n\'a pas pu se charger. Rechargez la page dans un instant : il vous attend.</p></div></header>';
}

function finir() {
  H.classList.remove('ouverture', 'voile-actif');
  H.classList.add('pret');
  if (vue) majPolices();
  observer();
}

demarrer().catch(() => { finir(); });
