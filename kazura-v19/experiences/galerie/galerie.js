// Kazura v19 : la page des expériences, devenue une expérience (agent Galerie).
// « Le champ des possibles est infini. » Un couloir de portails : chaque expérience est un portail vivant, on défile de
// l'un à l'autre (la caméra avance dans le couloir), un clic sur « Essayer » ou sur le portail fait plonger la caméra
// dedans, puis ouvre l'expérience.
//
// - Les données : js/experiences-liste.js (pret, affiche, monde, action, gestes, duree…). Une expérience pas prête mais
//   qui a son affiche apparaît en portail « Bientôt », sans lien.
// - Le HTML garde la version sans JavaScript (le bloc généré debut:affiches) : ici, on construit le voyage par-dessus.
// - Sans WebGL (ou contexte perdu) : les mêmes étapes, avec des hublots en HTML et CSS (images, anneau irisé).
// - Mouvement réduit : la spirale se resserre, tout ralentit, la plongée est plus courte et plus douce. Jamais coupé.
// - Essais : ?essai=6 (six expériences), ?essai=bientot (le portail « Bientôt »), ?gl=0 (sans WebGL), ?q=fixe (qualité fixe),
//   ?lent=40 (machine lente simulée : la qualité doit baisser), ?sans-aimant (pas de pose automatique sur les étapes).
import { lisser } from '../../js/lissage.js';
import { EXPERIENCES, dossier } from '../../js/experiences-liste.js';

const html = document.documentElement;
const reduit = matchMedia('(prefers-reduced-motion: reduce)').matches;
const toucher = matchMedia('(pointer: coarse)').matches;
const params = new URLSearchParams(location.search);
const L = lisser({ reduit });
const deux = (n) => String(n).padStart(2, '0');
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const borne = (x, a, b) => Math.min(b, Math.max(a, x));
const lisse = (t) => { t = borne(t, 0, 1); return t * t * (3 - 2 * t); };

// ------------------------------------------------------------------------------------------------ les données
let liste = EXPERIENCES.filter((x) => x.pret || x.affiche).map((x) => ({ ...x, bientot: !x.pret }));
if (params.get('essai') === 'bientot' && !liste.some((x) => x.id === 'infini')) {
  const inf = EXPERIENCES.find((x) => x.id === 'infini');
  if (inf) liste.push({ ...inf, bientot: true });
}
if (params.get('essai') === '6') {
  const base = EXPERIENCES.filter((x) => x.pret);
  const noms = ['Le salon de thé', 'L’atelier du potier', 'La salle de sport', 'Le cabinet d’avocats'];
  for (let i = 0; liste.length < 6; i++) {
    const b = base[i % base.length];
    liste.push({ ...b, id: `${b.id}-essai${i}`, lien: dossier(b), titre: noms[i % noms.length], monde: 'affiche', bientot: false });
  }
}
const lien = (x) => (x.lien || dossier(x)) + 'index.html';
const image = (x) => (x.affiche ? `${x.lien || dossier(x)}affiche.webp` : x.repli || null);
const prets = liste.filter((x) => !x.bientot);

// ------------------------------------------------------------------------------------------------ le HTML
const MAIN = '<svg class="xp-main" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 11V5.5a1.5 1.5 0 013 0V10m0-1.5a1.5 1.5 0 013 0V11m0-1a1.5 1.5 0 013 0v4.5c0 3.6-2.4 6.5-6 6.5h-.6c-2 0-3.4-.8-4.6-2.4L4.2 14a1.6 1.6 0 012.5-2L9 14.2"/></svg>';
const HORLOGE = '<svg class="xp-horloge" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.2"/><path d="M8 4.6V8l2.4 1.6"/></svg>';
const FL = '<svg class="fl" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6"/></svg>';

function hublot(x) {
  const img = image(x);
  if (x.monde === 'infini' && !x.affiche) return `<span class="gx-hublot gx-gigogne">${'<i></i>'.repeat(5)}</span>`;
  if (img) return `<span class="gx-hublot"><img src="${esc(img)}" alt="" width="1600" height="1000" decoding="async"></span>`;
  return '<span class="gx-hublot gx-hublot-sceau"><img src="img/sceau.svg" alt="" width="26" height="26"></span>';
}

function etapeHTML(x, i) {
  const id = `gx-t-${esc(x.id)}`;
  const n = liste.length;
  const fen = x.bientot
    ? `<span class="gx-fenetre" aria-hidden="true">${hublot(x)}</span>`
    : `<a class="gx-fenetre" href="${esc(lien(x))}" data-i="${i}" tabindex="-1" aria-hidden="true">${hublot(x)}</a>`;
  const actions = x.bientot
    ? `<p class="gx-actions"><span class="gx-bientot-mot">Bientôt</span><span class="gx-note">En préparation, elle arrive très vite</span></p>`
    : `<p class="gx-actions"><a class="bouton gx-entrer" href="${esc(lien(x))}" data-i="${i}" aria-describedby="${id}">Essayer${FL}</a><span class="gx-note">S’ouvre sur sa propre page</span></p>`;
  return `<section class="gx-etape gx-xp${x.bientot ? ' gx-bientot' : ''}" id="xp-${esc(x.id)}" data-i="${i}" style="--teinte:${esc(x.couleur || '#c9b8ff')}" aria-labelledby="${id}">
  ${fen}
  <div class="gx-carte">
    <p class="etiquette gx-num"><span class="gx-num-n"><span class="gx-num-mot">Expérience </span>${deux(i + 1)}<span class="gx-num-sur">&nbsp;/&nbsp;${deux(n)}</span></span><span class="gx-num-nom">${esc(x.titre)}</span></p>
    <h2 class="gx-action" id="${id}">${esc(x.action || x.titre)}</h2>
    <p class="xb-meta gx-meta"><span>${MAIN}Interactif</span><span class="xb-duree">${HORLOGE}${esc(x.duree || 'Quelques minutes')}</span><span class="gx-sur">Téléphone et ordinateur</span></p>
    <p class="gx-phrase">${esc(x.phrase)}</p>
    <p class="gx-gestes"><span class="gx-gestes-t">Ce que vous faites</span> ${esc(x.gestes || 'Vous essayez, à votre rythme.')}</p>
    ${actions}
  </div>
</section>`;
}

const minutes = (x) => Number((x.duree || '').match(/\d+/)?.[0]) || null;
function resumeDurees() {
  const m = prets.map(minutes).filter(Boolean);
  if (!m.length) return 'quelques minutes chacune';
  const a = Math.min(...m), b = Math.max(...m);
  return a === b ? `${a} min environ chacune` : `de ${a} à ${b} min chacune`;
}
const NOMBRES = ['zéro', 'une', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix'];

const main = document.getElementById('contenu');
const voyage = document.getElementById('gx-voyage');
const fin = document.getElementById('gx-fin');
const acc = document.getElementById('gx-acc');
voyage.innerHTML = liste.map(etapeHTML).join('');
const nb = prets.length;
const guide = document.getElementById('gx-compte');
if (guide) guide.innerHTML = `${NOMBRES[nb] ? NOMBRES[nb][0].toUpperCase() + NOMBRES[nb].slice(1) : nb} expérience${nb > 1 ? 's' : ''} à essayer vous-même, ${resumeDurees()}.${liste.length > nb ? ' Une autre arrive bientôt.' : ''}`;
const sommaire = document.getElementById('gx-sommaire');
if (sommaire) {
  sommaire.innerHTML = liste.map((x, i) => `<li${x.bientot ? ' class="gx-som-bientot"' : ''}><a href="#xp-${esc(x.id)}"><span class="gx-som-hublot" aria-hidden="true">${image(x) ? `<img src="${esc(image(x))}" alt="" width="1600" height="1000" decoding="async">` : '<i></i>'}</span><span class="gx-som-num" aria-hidden="true">${deux(i + 1)}</span><span class="gx-som-titre">${esc(x.titre)}</span><span class="gx-som-duree">${x.bientot ? 'Bientôt' : esc((x.duree || '').replace(' environ', ''))}</span></a></li>`).join('');
  sommaire.hidden = false;
  sommaire.classList.toggle('gx-nombreux', liste.length >= 5);
}
// sans WebGL, le couloir de l'accueil devient trois hublots en HTML (le premier en grand)
acc.querySelector('.gx-acc-fenetre').innerHTML = liste.slice(0, 3).map((x, i) => `<span class="gx-mini gx-mini-${i}" style="--teinte:${esc(x.couleur || '#c9b8ff')}">${hublot(x)}</span>`).join('');
const etapes = [acc, ...voyage.querySelectorAll('.gx-xp'), fin];
const sections = [...voyage.querySelectorAll('.gx-xp'), fin];
html.classList.add('gx-pret');

// le rail : un repère par étape, à gauche (ordinateur) ou à droite (téléphone)
const rail = document.getElementById('gx-rail');
rail.innerHTML = `<ol>${liste.map((x, i) => `<li><a href="#xp-${esc(x.id)}" data-e="${i}" title="${esc(x.titre)}"><i aria-hidden="true"></i><span aria-hidden="true">${deux(i + 1)}</span><span class="vh">Expérience ${i + 1} : ${esc(x.titre)}</span></a></li>`).join('')}<li><a href="#gx-fin" data-e="${liste.length}" title="Et le vôtre ?"><i aria-hidden="true"></i><span aria-hidden="true">Vous</span><span class="vh">Et le vôtre ?</span></a></li></ol>`;
rail.hidden = false;
const railLiens = [...rail.querySelectorAll('a')];

// ------------------------------------------------------------------------------------------------ les mesures
let stops = [], slots = { acc: null, xp: null, fin: null }, H = innerHeight, W = innerWidth;
function rect(el, parent, decal = 0) {
  const r = el.getBoundingClientRect(), p = parent.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top - p.top + r.height / 2 + decal, r: Math.min(r.width, r.height) / 2 };
}
function mesurer() {
  H = innerHeight; W = innerWidth;
  const max = Math.max(0, html.scrollHeight - H);
  const tops = etapes.map((el) => el.getBoundingClientRect().top + scrollY);
  stops = tops.map((t) => Math.min(t, max));
  const premiere = sections[0];
  slots.acc = rect(acc.querySelector('.gx-acc-fenetre'), acc);
  slots.xp = rect(premiere.querySelector('.gx-fenetre'), premiere, tops[1] - stops[1]);
  slots.fin = rect(fin.querySelector('.gx-fenetre'), fin, tops[tops.length - 1] - stops[stops.length - 1]);
}

// la position dans le voyage : -1 l'accueil, 0..n-1 les expériences, n « Et le vôtre ? » ; au-delà, le pied
// (l'accueil est à SA plutôt qu'à -1 : la caméra y est plus près du premier portail, le couloir se voit mieux)
const SA = -0.55;
function position(y) {
  const n = stops.length;
  if (y <= stops[0]) return { s: SA, au: 0 };
  for (let j = 0; j < n - 1; j++) {
    if (y < stops[j + 1]) {
      const d = stops[j + 1] - stops[j], t = d > 0 ? (y - stops[j]) / d : 0;
      return { s: j === 0 ? SA + t * -SA : j - 1 + t, au: 0 };
    }
  }
  return { s: n - 2, au: (y - stops[n - 1]) / H };
}
const melange = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, r: a.r + (b.r - a.r) * t });
function slotA(s) {
  const n = liste.length;
  if (s < 0) return melange(slots.acc, slots.xp, lisse((s - SA) / -SA));
  if (s > n - 1) return melange(slots.xp, slots.fin, lisse(s - (n - 1)));
  return slots.xp;
}

// ------------------------------------------------------------------------------------------------ l'état vivant
let sAff = SA, sCible = SA, au = 0;
const regard = { x: 0, y: 0, cx: 0, cy: 0 };
let survol = -1, plonge = null, actif = -2, tPrec = 0;

addEventListener('pointermove', (e) => {
  if (e.pointerType === 'touch') return;
  regard.cx = (e.clientX / W) * 2 - 1;
  regard.cy = -((e.clientY / H) * 2 - 1);
}, { passive: true });
addEventListener('touchmove', (e) => {
  const t = e.touches[0];
  if (t) { regard.cx = ((t.clientX / W) * 2 - 1) * 0.6; regard.cy = -((t.clientY / H) * 2 - 1) * 0.3; }
}, { passive: true });

voyage.addEventListener('pointerover', (e) => { const f = e.target.closest('.gx-fenetre[data-i], .gx-entrer'); if (f) survol = Number(f.dataset.i); });
voyage.addEventListener('pointerout', (e) => { const f = e.target.closest('.gx-fenetre[data-i], .gx-entrer'); if (f && !f.contains(e.relatedTarget)) survol = -1; });
voyage.addEventListener('focusin', (e) => { const f = e.target.closest('.gx-entrer'); if (f) survol = Number(f.dataset.i); });
voyage.addEventListener('focusout', () => { survol = -1; });
fin.addEventListener('pointerover', (e) => { if (e.target.closest('.gx-fenetre, .bouton')) survol = liste.length; });
fin.addEventListener('pointerout', (e) => { const f = e.target.closest('.gx-fenetre, .bouton'); if (f && !f.contains(e.relatedTarget)) survol = -1; });

// le rectangle du texte de l'étape la plus proche (la scène y adoucit la liane et les poussières)
function zoneTexte(s) {
  const k = Math.round(s);
  const el = k < 0 ? acc.querySelector('.gx-acc-texte') : (sections[Math.min(k, sections.length - 1)]?.querySelector('.gx-carte'));
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { l: r.left - 12, t: r.top - 12, r: r.right + 12, b: r.bottom + 12 };
}
const freinEssai = Number(params.get('lent')) || 0; // essai : ?lent=40 simule une machine lente (40 ms de plus par image)
function etat() {
  if (freinEssai) { const f = performance.now() + freinEssai; while (performance.now() < f); }
  const t = performance.now();
  const dt = tPrec ? Math.min(0.1, (t - tPrec) / 1000) : 1 / 60;
  tPrec = t;
  const tau = reduit ? 0.22 : 0.12;
  sAff += (sCible - sAff) * (1 - Math.exp(-dt / tau));
  if (Math.abs(sCible - sAff) < 0.0005) sAff = sCible;
  const lent = reduit ? 0.35 : 1;
  const derive = toucher ? { x: Math.sin(t / 3100) * 0.35 * lent, y: Math.cos(t / 3700) * 0.25 * lent } : { x: 0, y: 0 };
  regard.x += (regard.cx + derive.x - regard.x) * (1 - Math.exp(-dt / 0.35));
  regard.y += (regard.cy + derive.y - regard.y) * (1 - Math.exp(-dt / 0.35));
  return {
    s: sAff,
    dt,
    slot: slotA(sAff),
    regard: { x: regard.x * lent, y: regard.y * lent },
    survol,
    plonge,
    texte: zoneTexte(sAff),
    alpha: 1 - lisse((au - 0.15) / 0.6),
    cache: au > 0.95 || document.hidden,
  };
}

// ------------------------------------------------------------------------------------------------ le défilement
let scene = null;
function surDefilement() {
  const p = position(scrollY);
  sCible = p.s; au = p.au;
  const e = Math.round(borne(p.s, -1, liste.length));
  if (e !== actif) {
    actif = e;
    railLiens.forEach((a, i) => { if (i === e) a.setAttribute('aria-current', 'step'); else a.removeAttribute('aria-current'); });
    html.classList.toggle('gx-loin', e >= 0);
  }
  // le texte d'une étape s'efface quand on la quitte (le portail suivant arrive à sa place)
  sections.forEach((el, i) => {
    const v = 1 - borne((Math.abs(p.s - i) - 0.08) * 2.6, 0, 1);
    el.style.setProperty('--v', v.toFixed(3));
  });
  acc.style.setProperty('--v', (1 - borne((p.s - SA) / -SA * 1.5, 0, 1)).toFixed(3));
  if (scene && au < 0.95) scene.relancer();
  aimanter();
}
addEventListener('scroll', surDefilement, { passive: true });

// l'aimant : quand le défilement s'arrête près d'une étape, la page s'y pose (doucement)
let minuteur = 0, doigt = false;
addEventListener('touchstart', () => { doigt = true; }, { passive: true });
addEventListener('touchend', () => { doigt = false; aimanter(); }, { passive: true });
function aimanter() {
  clearTimeout(minuteur);
  if (plonge || params.has('sans-aimant')) return;
  minuteur = setTimeout(() => {
    if (doigt || plonge) return;
    const y = scrollY;
    if (y > stops[stops.length - 1] + 2) return;
    let k = 0;
    for (let j = 1; j < stops.length; j++) if (Math.abs(stops[j] - y) < Math.abs(stops[k] - y)) k = j;
    const ecart = Math.abs(stops[k] - y);
    if (ecart > 3 && ecart < H * 0.4) L.aller(stops[k], { duree: reduit ? 520 : 640 });
  }, toucher ? 240 : 170);
}

// les flèches gauche et droite passent d'une étape à l'autre
addEventListener('keydown', (e) => {
  if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || plonge) return;
  if (e.target.closest?.('input, textarea, select, [contenteditable]')) return;
  if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
  const k = borne(Math.round(sCible) + (e.key === 'ArrowRight' ? 1 : -1), -1, liste.length);
  e.preventDefault();
  L.aller(stops[k + 1]);
});

// ------------------------------------------------------------------------------------------------ la plongée
const voile = document.getElementById('gx-voile');
function plonger(i, href) {
  if (plonge) return;
  const x = liste[i] || { couleur: '#c9b8ff' };
  const aller = () => {
    plonge = { i, k: 0 };
    html.classList.add('gx-plonge');
    document.body.style.overflowY = 'hidden';
    voile.style.setProperty('--teinte', x.couleur || '#c9b8ff');
    const duree = reduit ? 900 : 1250;
    const t0 = performance.now();
    if (scene) {
      const pas = (t) => {
        if (!plonge) return;
        plonge.k = borne((t - t0) / duree, 0, 1);
        voile.style.opacity = String(lisse((plonge.k - 0.72) / 0.28));
        scene.relancer();
        if (plonge.k < 1) requestAnimationFrame(pas); else partir(href);
      };
      requestAnimationFrame(pas);
    } else plongerSansGl(i, href, duree);
  };
  const cible = stops[i + 1];
  if (Math.abs(scrollY - cible) > 4) L.aller(cible, { duree: reduit ? 420 : 380, fin: aller });
  else aller();
}
function partir(href) {
  location.href = href;
  // si la page ne part pas (bloquée), on rend la main
  setTimeout(remettre, 4000);
}
function remettre() {
  plonge = null;
  html.classList.remove('gx-plonge');
  document.body.style.overflowY = '';
  voile.style.opacity = '0';
  document.querySelector('.gx-envol')?.remove();
  scene?.relancer();
}
addEventListener('pageshow', (e) => { if (e.persisted) { remettre(); mesurer(); surDefilement(); } });

function plongerSansGl(i, href, duree) {
  const el = (i >= liste.length ? fin : sections[i]).querySelector('.gx-hublot');
  if (!el || !el.animate) { partir(href); return; }
  const r = el.getBoundingClientRect();
  const clone = el.cloneNode(true);
  clone.classList.add('gx-envol');
  Object.assign(clone.style, { position: 'fixed', left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px`, zIndex: 40, margin: 0 });
  document.body.appendChild(clone);
  const echelle = (Math.hypot(W, H) / Math.min(r.width, r.height)) * 2.2;
  const dx = W / 2 - (r.left + r.width / 2), dy = H / 2 - (r.top + r.height / 2);
  clone.animate([{ transform: 'translate(0,0) scale(1)' }, { transform: `translate(${dx}px, ${dy}px) scale(${echelle})` }], { duration: duree, easing: 'cubic-bezier(.55,0,.75,.3)', fill: 'forwards' });
  voile.animate([{ opacity: 0 }, { opacity: 0, offset: 0.65 }, { opacity: 1 }], { duration: duree, fill: 'forwards' }).onfinish = () => partir(href);
}

document.addEventListener('click', (e) => {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const a = e.target.closest('a.gx-entrer, a.gx-fenetre');
  if (!a) return;
  const sec = a.closest('.gx-etape');
  const i = sec === fin ? liste.length : Number(a.dataset.i);
  if (Number.isNaN(i)) return;
  e.preventDefault();
  plonger(i, a.href);
});

// ------------------------------------------------------------------------------------------------ la scène
const canvas = document.getElementById('gx-scene');
function sansGl() {
  html.classList.add('gx-sans-gl');
  html.classList.remove('gx-gl');
  scene?.detruire?.();
  scene = null;
}
async function demarrerScene() {
  if (params.get('gl') === '0') { sansGl(); return; }
  try {
    const { creerScene } = await import('./scene.js');
    const portails = [
      ...liste.map((x) => ({ monde: x.monde || 'affiche', teinte: x.couleur || '#c9b8ff', image: x.monde === 'infini' ? null : image(x), bientot: x.bientot })),
      { monde: 'votre', teinte: '#6ee7b7', image: null },
    ];
    // casser : la page de 2007 est dessinée, l'affiche sert de « nouveau site » derrière les fissures
    scene = creerScene(canvas, {
      portails, reduit, mobile: toucher || Math.min(W, H) < 600, fixe: params.get('q') === 'fixe', etat,
      surQualite: (q) => { canvas.dataset.qualite = q.toFixed(2); },
    });
    html.classList.add('gx-gl');
    canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); sansGl(); }, { once: true });
  } catch (err) {
    sansGl();
  }
}

// ------------------------------------------------------------------------------------------------ le menu (comme les autres pages)
const menu = document.getElementById('menu');
if (menu) {
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) menu.open = false; });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && menu.open) { menu.open = false; menu.querySelector('summary').focus(); } });
  matchMedia('(min-width: 1200px)').addEventListener('change', (m) => { if (m.matches) menu.open = false; });
}

// ------------------------------------------------------------------------------------------------ départ
// (window.__galerie : des poignées pour les captures automatiques, sans effet sur la page)
window.__galerie = {
  get scene() { return scene; }, etat: () => ({ s: sAff, stops, slots }),
  // pour les captures : la plongée figée à k (0 à 1), sans partir ; figer(null) la retire
  figer: (i, k) => {
    if (k === null) { remettre(); return; }
    plonge = { i, k }; html.classList.add('gx-plonge'); voile.style.setProperty('--teinte', (liste[i] || {}).couleur || '#c9b8ff');
    voile.style.opacity = String(lisse((k - 0.72) / 0.28)); scene?.relancer();
  },
  // pour les captures : attendre que la caméra soit posée (sans scène : tout de suite)
  pose: (cible, ms = 20000) => new Promise((r) => { if (!scene) { r(sCible); return; } const t0 = performance.now(); const f = () => { if ((Math.abs(sAff - sCible) < 0.004 && (cible === undefined || Math.abs(sAff - cible) < 0.01)) || performance.now() - t0 > ms) r(+sAff.toFixed(3)); else setTimeout(f, 100); }; f(); }),
};
mesurer();
surDefilement();
sAff = sCible;
let attente = 0;
addEventListener('resize', () => { clearTimeout(attente); attente = setTimeout(() => { mesurer(); surDefilement(); }, 120); });
new ResizeObserver(() => { mesurer(); surDefilement(); }).observe(main);
document.fonts?.ready.then(() => { mesurer(); surDefilement(); });
demarrerScene();
