// Institut : fiche (?p=), palette (?palette=), chargement (la goutte d'huile qui dessine les initiales),
// la creme de l'accueil, et ce que pilote le defilement. Rien ne suit la souris : la matiere reagit au geste.
import { rendre, titre, description, contexte } from './rendu.js';
import { UNIVERS, paletteDe, variables } from './univers.js';
import { famille } from '../../commun/familles.js';
import { demarrerCreme } from './creme.js';
import { APERCU, apercuPret, filet } from '../../commun/apercu.js';
import { fondus } from '../../commun/fondus.js';
filet('institut');

const html = document.documentElement;
const reduit = html.classList.contains('reduit');
const tactile = matchMedia('(hover: none), (pointer: coarse)').matches;
const petit = tactile || Math.min(innerWidth, innerHeight) < 640;
const site = document.getElementById('site');
const params = new URLSearchParams(location.search);
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const attendre = (ms) => new Promise((r) => setTimeout(r, ms));
const debut = performance.now();

// ---------- 1. La fiche et la palette ----------
let d = null;
const demande = params.get('p');
const dossier = demande && /^[a-z0-9-]{2,120}$/.test(demande) ? demande : site.dataset.p;
try { const r = await fetch(`../donnees/${dossier}.json`); if (r.ok) d = await r.json(); } catch (e) { console.warn('fiche introuvable', e); }
const pal = paletteDe(params.get('palette'), d ? famille(d) : 'beaute');
if (d && d.dossier !== site.dataset.p) {
  site.innerHTML = rendre(d, pal.id); site.dataset.p = d.dossier;
  document.title = titre(d);
  $('meta[name="description"]')?.setAttribute('content', description(d));
}
// l'image de repli (sans WebGL) suit la palette
$$('.matiere-fixe source, .matiere-fixe img').forEach((el) => { for (const a of ['src', 'srcset']) { const v = el.getAttribute(a); if (v) el.setAttribute(a, v.replace(/creme-repli-[a-z-]+?-(large|haute)/, `creme-repli-${pal.id}-$1`)); } });
if (pal.id !== site.dataset.palette) {
  $('#palette').textContent = `:root{${variables(pal)}}`;
  $('meta[name="theme-color"]')?.setAttribute('content', pal.couleurs.fond);
  site.dataset.palette = pal.id;
}
html.dataset.ton = pal.ton;
const c = d ? contexte(d) : { ini: $('.barre-sceau span')?.textContent || '', nom: $('#nom')?.textContent || '' };

// ---------- 2. Le monogramme : meme place dans le chargement et sur la creme ----------
const accueil = $('#accueil'), matiere = $('#matiere');
const POLICE = 'Noto Serif Display';
const mesureur = document.createElement('canvas').getContext('2d');
function placeMonogramme(W, H) {
  const ordi = W >= 900;
  let fs = ordi ? Math.min(H * .36, W * .3, 420) : Math.min(W * (c.ini.length > 1 ? .6 : .78), H * .36);
  // l'italique deborde : on mesure, et le monogramme tient toujours dans l'ecran avec ses marges
  mesureur.font = `italic 500 ${fs}px "${POLICE}"`;
  const m = mesureur.measureText(c.ini || 'A'), l = m.actualBoundingBoxRight + m.actualBoundingBoxLeft, max = W * (ordi ? .5 : .8);
  if (l > max) fs *= max / l;
  return { cx: W * .5, cy: H * (ordi ? .35 : .4), fs };
}
function dessinerTexte(ctx, W, H, ini) {
  const { cx, cy, fs } = placeMonogramme(W, H);
  ctx.font = `italic 500 ${fs}px "${POLICE}"`;
  const m = ctx.measureText(ini);
  const x = cx - (m.actualBoundingBoxRight - m.actualBoundingBoxLeft) / 2 + m.actualBoundingBoxLeft;
  const y = cy + (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2;
  return { x, y, fs, haut: cy - m.actualBoundingBoxAscent / 2 - (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2, m };
}
// La feuille des polices ne bloque pas la page : on attend qu'elle arrive, puis les fichiers (1,8 s au plus).
const polices = Promise.race([
  (window.__policesPret || Promise.resolve()).then(() => Promise.all([document.fonts.load(`italic 500 200px "${POLICE}"`, c.ini || 'A'), document.fonts.load(`260 80px "${POLICE}"`), document.fonts.load('400 16px Jost')])),
  attendre(1800),
]).catch(() => {});

// ---------- 3. Le chargement : une goutte tombe, s'etale, et l'huile dessine les initiales ----------
const ch = $('#chargement');
let chargementFini = false;
const finDuChargement = { r: null }; const quandFini = new Promise((r) => (finDuChargement.r = r));
function fermerChargement() {
  if (chargementFini) return; chargementFini = true;
  ch.classList.add('fini'); html.classList.add('ouvert'); finDuChargement.r();
  requestAnimationFrame(() => apercuPret('institut'));
}
ch.addEventListener('pointerdown', fermerChargement);
async function jouerChargement() {
  const W = innerWidth, H = innerHeight, coul = pal.couleurs;
  await Promise.race([polices, attendre(350)]);
  const ctx = document.createElement('canvas').getContext('2d');
  const t = dessinerTexte(ctx, W, H, c.ini);
  const impact = { x: W * .5, y: t.y - t.fs * .34 };
  const rayon = Math.hypot(Math.max(impact.x, W - impact.x), t.fs * .8);
  const ns = 'http://www.w3.org/2000/svg';
  ch.innerHTML = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" xmlns="${ns}">
    <defs>
      <linearGradient id="ch-or" x1="0" y1="0" x2="0.4" y2="1">
        <stop offset="0" stop-color="${coul.huile}" stop-opacity=".78"/><stop offset=".55" stop-color="${coul.huile}" stop-opacity=".92"/><stop offset="1" stop-color="${coul.accent2}" stop-opacity=".9"/>
      </linearGradient>
      <radialGradient id="ch-goutte" cx=".38" cy=".3" r=".75"><stop offset="0" stop-color="#fff6dc"/><stop offset=".25" stop-color="${coul.huile}"/><stop offset="1" stop-color="${coul.accent}"/></radialGradient>
      <filter id="ch-brillant" x="-10%" y="-10%" width="120%" height="120%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="${(t.fs / 70).toFixed(1)}" result="flou"/>
        <feSpecularLighting in="flou" surfaceScale="${(t.fs / 40).toFixed(1)}" specularConstant="1.1" specularExponent="34" lighting-color="#fff8e8" result="spec">
          <fePointLight x="${(W * .2).toFixed(0)}" y="${(H * .05).toFixed(0)}" z="${(t.fs * 1.6).toFixed(0)}"/>
        </feSpecularLighting>
        <feComposite in="spec" in2="SourceAlpha" operator="in" result="spec2"/>
        <feComposite in="SourceGraphic" in2="spec2" operator="arithmetic" k1="0" k2="1" k3=".85" k4="0"/>
      </filter>
      <filter id="ch-bord" x="-20%" y="-20%" width="140%" height="140%"><feTurbulence type="fractalNoise" baseFrequency=".018" numOctaves="2" seed="4"/><feDisplacementMap in="SourceGraphic" scale="${(t.fs * .16).toFixed(0)}" xChannelSelector="R" yChannelSelector="G"/></filter>
      <mask id="ch-masque" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><circle id="ch-tache" cx="${impact.x}" cy="${impact.y}" r="0" fill="#fff" filter="url(#ch-bord)"/></mask>
    </defs>
    <g mask="url(#ch-masque)"><text x="${t.x}" y="${t.y}" font-family="${POLICE}" font-style="italic" font-weight="500" font-size="${t.fs}" fill="url(#ch-or)" filter="url(#ch-brillant)">${c.ini}</text></g>
    <circle id="ch-onde" cx="${impact.x}" cy="${impact.y}" r="0" fill="none" stroke="${coul.huile}" stroke-width="1.5" opacity="0"/>
    <g id="ch-chute"><ellipse cx="${impact.x}" cy="0" rx="9" ry="12" fill="url(#ch-goutte)"/></g>
  </svg><p class="ch-nom">${(c.nom || '').replace(/[<>&]/g, '')}</p>`;
  ch.classList.add('vu');
  const tache = $('#ch-tache'), onde = $('#ch-onde'), chute = $('#ch-chute'), goutte = chute.firstElementChild;
  const tChute = reduit ? 0 : 560, tEtale = reduit ? 760 : 1050;
  const t0 = performance.now();
  if (reduit) chute.style.display = 'none';
  await new Promise((fin) => {
    const image = (m) => {
      const e = Math.max(0, m - t0);
      if (e < tChute) {
        const k = e / tChute, y = -30 + (impact.y + 30) * k * k;
        goutte.setAttribute('cy', y.toFixed(1)); goutte.setAttribute('ry', (12 + 7 * k).toFixed(1)); goutte.setAttribute('rx', (9 - 1.5 * k).toFixed(1));
      } else {
        chute.style.display = 'none';
        const k = Math.min(1, (e - tChute) / tEtale), ease = 1 - Math.pow(1 - k, 3);
        tache.setAttribute('r', (rayon * ease).toFixed(1));
        const ko = Math.min(1, (e - tChute) / 700);
        onde.setAttribute('r', (8 + t.fs * .55 * (1 - Math.pow(1 - ko, 2))).toFixed(1));
        onde.setAttribute('opacity', (reduit ? .3 : .7) * (1 - ko));
        if (k >= 1) return fin();
      }
      requestAnimationFrame(image);
    };
    requestAnimationFrame(image);
  });
}
const chargementJoue = jouerChargement();

// ---------- 4. La creme ----------
let creme = null, toile = null;
function masqueInitiales(W, H) {
  const cv = document.createElement('canvas'); cv.width = Math.round(W); cv.height = Math.round(H);
  const ctx = cv.getContext('2d');
  const t = dessinerTexte(ctx, W, H, c.ini);
  if ('filter' in ctx) ctx.filter = `blur(${Math.max(1.2, t.fs / 160).toFixed(1)}px)`;
  ctx.fillStyle = '#fff'; ctx.fillText(c.ini, t.x, t.y);
  return cv;
}
async function preparerCreme() {
  if (!matiere) return false;
  toile = document.createElement('canvas'); toile.className = 'creme'; toile.setAttribute('aria-hidden', 'true');
  matiere.appendChild(toile);
  creme = demarrerCreme(toile, { petit, reduit });
  if (!creme) { toile.remove(); return false; }
  creme.palette(pal.couleurs);
  if (params.has('atelier')) window.__creme = creme; // outils/repli.mjs : rendu des images de repli
  const r = accueil.getBoundingClientRect();
  creme.taille(r.width, r.height);
  await polices;
  creme.initiales(masqueInitiales(r.width, r.height));
  if (!document.fonts.check(`italic 500 100px "${POLICE}"`, c.ini)) {
    (window.__policesPret || Promise.resolve()).then(() => document.fonts.load(`italic 500 100px "${POLICE}"`, c.ini)).then(() => { if (creme && !touche) { const q = accueil.getBoundingClientRect(); creme.initiales(masqueInitiales(q.width, q.height)); reveiller(); } });
  }
  creme.dessiner(0, { zoom: 1, image: 0 });
  html.classList.add('gl');
  placerInvite(); ajusterNom();
  creme.perdu(() => { html.classList.remove('gl'); creme = null; toile.remove(); });
  return true;
}
const cremePrete = preparerCreme().catch((e) => { console.warn('creme indisponible', e); return false; });

// Le chargement se ferme quand la creme est prete et que la goutte a fini (2,5 s au plus).
Promise.race([Promise.all([cremePrete, chargementJoue, attendre(APERCU ? 450 : reduit ? 900 : 1700)]), attendre(APERCU ? Math.max(0, 720 - performance.now()) : 2500)]).then(() => setTimeout(fermerChargement, APERCU ? 50 : reduit ? 150 : 350));

// ---------- 5. Le geste sur la creme ----------
const invite = $('#invite');
let geste = null, touche = false;
function placerInvite() {
  if (!invite) return;
  const r = accueil.getBoundingClientRect(), p = placeMonogramme(r.width, r.height);
  invite.style.top = `${Math.round(p.cy + p.fs * .42)}px`;
}
placerInvite();
// Le nom tient sur sa colonne : on reduit la taille si la ligne la plus longue deborde.
function ajusterNom() {
  const nom = $('#nom'), bas = $('.accueil-bas'); if (!nom) return;
  nom.style.fontSize = '';
  const dispo = nom.clientWidth, lignes = $$('.nom-ligne', nom), max = Math.max(...lignes.map((l) => l.offsetWidth));
  let taille = parseFloat(getComputedStyle(nom).fontSize);
  if (max > dispo && dispo > 0) { taille *= dispo / max * .98; nom.style.fontSize = `${taille.toFixed(1)}px`; }
  // et en hauteur : le bloc du bas ne remonte pas sur le monogramme
  const r = accueil.getBoundingClientRect(), p = placeMonogramme(r.width, r.height), limite = p.cy + p.fs * .5 + 34;
  for (let i = 0; i < 8 && bas && bas.getBoundingClientRect().top - r.top < limite && taille > 34; i++) { taille *= .9; nom.style.fontSize = `${taille.toFixed(1)}px`; }
}
ajusterNom(); polices.then(ajusterNom); document.fonts.addEventListener?.("loadingdone", ajusterNom);
function relatif(e) { const r = toile.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top, r]; }
function surGeste(e, appuye) {
  if (!creme || !toile || e.target.closest('a, button')) return;
  const [x, y, r] = relatif(e);
  if (x < 0 || y < 0 || x > r.width || y > r.height) { creme.lever(); return; }
  creme.geste(x, y, appuye, e.pointerType);
  if (appuye) touche = true;
  if (appuye && invite && !invite.classList.contains('parti')) invite.classList.add('parti');
  reveiller();
}
accueil.addEventListener('pointerdown', (e) => { geste = e.pointerId; creme?.lever(); surGeste(e, true); }, { passive: true });
accueil.addEventListener('pointermove', (e) => {
  const appuye = e.pointerType === 'touch' || e.pointerType === 'pen' ? geste === e.pointerId : (e.buttons & 1) === 1;
  if (e.pointerType !== 'mouse' && !appuye) return;
  for (const ev of (e.getCoalescedEvents?.() || [e]).slice(-6)) surGeste(ev, appuye);
}, { passive: true });
for (const t of ['pointerup', 'pointercancel', 'pointerleave']) accueil.addEventListener(t, () => { geste = null; creme?.lever(); }, { passive: true });

// ---------- 6. Ce que pilote le defilement ----------
const barre = $('#barre');
const remplir = $$('[data-remplir]');
const rituelPhoto = $('.rituel-photo'), sceau = $('.carte-sceau'), lumierePortrait = $('.portrait-lumiere');
for (const s of ['.approche-texte > p', '.composition', '.geste', '.rituel-sous', '.carte-papier', '.carte-photo', '.portrait', '.lettre-corps > p', '.rdv-tete', '.carte-rdv', '.rdv-coord', '.pied-nom', '.pied-apercu', '.pied-mesure']) {
  $$(s).forEach((el, i) => { el.classList.add('apparait'); el.style.setProperty('--d', `${(i % 3) * 0.09}s`); });
}
const vigie = new IntersectionObserver((es) => { for (const e of es) if (e.isIntersecting) { e.target.classList.add('vu'); vigie.unobserve(e.target); } }, { rootMargin: '0px 0px -8% 0px', threshold: .1 });
$$('.apparait, .revele-photo, .cadre-photo').forEach((el) => vigie.observe(el));
// la signature est entierement masquee au depart : on observe son paragraphe voisin
const signature = $('.signature');
if (signature) new IntersectionObserver(([e], o) => { if (e.isIntersecting) { signature.classList.add('vu'); o.disconnect(); } }, { rootMargin: '0px 0px -12% 0px' }).observe(signature.parentElement);
const borne = (v) => Math.min(1, Math.max(0, v));
let zoom = 1, defile = true;
function defilement() {
  const H = innerHeight, y = scrollY, hA = accueil.offsetHeight;
  barre.classList.toggle('pleine', y > hA - 90);
  zoom = 1 + .12 * borne(y / hA);
  for (const el of remplir) {
    const r = el.getBoundingClientRect();
    const p = borne((H * .88 - r.top) / (r.height + H * .4));
    el.style.setProperty('--p', `${(-14 + p * 128).toFixed(1)}%`);
  }
  if (rituelPhoto) { const r = rituelPhoto.parentElement.getBoundingClientRect(); rituelPhoto.style.setProperty('--z', (1.14 - .14 * borne((H - r.top) / (H + r.height))).toFixed(4)); }
  if (sceau) { const r = sceau.getBoundingClientRect(); sceau.style.setProperty('--eclat', borne((H - r.top) / (H + r.height)).toFixed(3)); }
  if (lumierePortrait) { const r = lumierePortrait.getBoundingClientRect(); lumierePortrait.style.setProperty('--l', ((H * .5 - r.top) / H).toFixed(3)); }
}
addEventListener('scroll', () => { defile = true; reveiller(); }, { passive: true });
addEventListener('resize', () => { defile = true; reveiller(); });

// La carte de rendez-vous se retourne d'un toucher.
const carteRdv = $('#carte-rdv');
carteRdv?.querySelector('button')?.addEventListener('click', () => carteRdv.classList.toggle('retournee'));

// Tour 4 : le fond de la page glisse d'une section à l'autre au défilement (plus de jointure).
fondus({ sections: [...document.querySelectorAll('.accueil, .section, .pied')] });

// ---------- 7. La boucle ----------
let enVue = true, vivant = false, precedent = 0, lent = 0, essaiLent = 0;
new IntersectionObserver(([e]) => { enVue = e.isIntersecting; if (enVue) reveiller(); }, { threshold: 0 }).observe(accueil);
let largeur = innerWidth, hauteur = accueil.offsetHeight, redim = 0;
addEventListener('resize', () => {
  clearTimeout(redim);
  redim = setTimeout(() => {
    const r = accueil.getBoundingClientRect();
    if (creme && (Math.abs(r.width - largeur) > 2 || Math.abs(r.height - hauteur) > 120)) { creme.taille(r.width, r.height); creme.initiales(masqueInitiales(r.width, r.height)); }
    largeur = r.width; hauteur = r.height; placerInvite(); ajusterNom(); reveiller();
  }, 220);
});
function reveiller() { if (!vivant) { vivant = true; requestAnimationFrame(boucle); } }
function boucle(m) {
  vivant = false;
  if (defile) { defilement(); defile = false; }
  if (creme && enVue) {
    const dt = precedent ? m - precedent : 16; precedent = m;
    creme.dessiner((m - debut) / 1000, { zoom, image: Math.round(m / 16) });
    // qualite adaptative : si l'image prend trop de temps, la definition baisse
    if (!reduit && dt < 200) { lent = lent * .95 + (dt > 26 ? 1 : 0) * .05; if (lent > .6 && m - essaiLent > 2500) { essaiLent = m; if (creme.baisser()) lent = 0; } }
    // la lumiere de studio derive doucement (moins ample sous mouvement reduit) : la matiere reste vivante
    vivant = true; requestAnimationFrame(boucle);
  } else precedent = 0;
}
reveiller();
await quandFini;
reveiller();
