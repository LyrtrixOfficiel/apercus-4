// Resonance : fiche (?p=), palette (?palette=), chargement (le sable se rassemble en initiales), la plaque de
// Chladni pilotee par le defilement, le son (coupe par defaut), les cordes, le bol, les ondes des tarifs.
// Rien ne suit la souris : la matiere (sable, cordes, air, eau) reagit au geste.
import { rendre, titre, description, contexte } from './rendu.js';
import { paletteDe, variables, modeDe, timbreDe } from './univers.js';
import { famille } from '../../commun/familles.js';
import { demarrerPlaque } from './plaque.js';
import { demarrerEncre } from './encre.js';
import { demarrerCordes } from './cordes.js';
import { demarrerBol } from './bol.js';
import { activerSon, sonActif, bol as sonBol, corde as sonCorde, goutte, GAMME } from './son.js';
import { APERCU, apercuPret, filet } from '../../commun/apercu.js';
filet('resonance');

const html = document.documentElement;
const reduit = html.classList.contains('reduit');
const tactile = matchMedia('(hover: none), (pointer: coarse)').matches;
const petit = tactile || Math.min(innerWidth, innerHeight) < 640;
const site = document.getElementById('site');
const params = new URLSearchParams(location.search);
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const attendre = (ms) => new Promise((r) => setTimeout(r, ms));
const borne = (v) => Math.min(1, Math.max(0, v));
const lisse = (a, b, x) => { const t = borne((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const debut = performance.now();

// ---------- 1. Fiche, mode, palette ----------
let d = null;
const demande = params.get('p');
const dossier = demande && /^[a-z0-9-]{2,120}$/.test(demande) ? demande : site.dataset.p;
try { const r = await fetch(`../donnees/${dossier}.json`); if (r.ok) d = await r.json(); } catch (e) { console.warn('fiche introuvable', e); }
if (d && d.dossier !== site.dataset.p) {
  site.innerHTML = rendre(d); site.dataset.p = d.dossier;
  document.title = titre(d);
  $('meta[name="description"]')?.setAttribute('content', description(d));
}
const mode = d ? modeDe(d) : 'son';
const timbre = d ? timbreDe(d) : 'tibetain';
const pal = paletteDe(params.get('palette'), d ? famille(d) : 'creation', mode);
if (pal.id !== site.dataset.palette) {
  $('#palette').textContent = `:root{${variables(pal)}}`;
  $('meta[name="theme-color"]')?.setAttribute('content', pal.couleurs.fond);
  site.dataset.palette = pal.id;
}
html.dataset.ton = pal.ton;
const coul = pal.couleurs;
const c = d ? contexte(d) : { ini: $('.barre-ini')?.textContent || '', nom: $('#nom')?.textContent || '', prenom: '' };
const motFinal = c.prenom && c.prenom.length <= 10 ? c.prenom : c.ini;
const POLICE = '"Bricolage Grotesque", "Arial Narrow", sans-serif';
const polices = Promise.race([
  (window.__policesPret || Promise.resolve()).then(() => Promise.all([document.fonts.load(`600 120px "Bricolage Grotesque"`, motFinal + c.ini), document.fonts.load('300 80px "Bricolage Grotesque"'), document.fonts.load('italic 300 20px Spectral')])),
  attendre(1800),
]).catch(() => {});

// ---------- 2. Chargement : le sable vibre et se rassemble en initiales ----------
const ch = $('#chargement');
let chargementFini = false;
function fermerChargement() { if (chargementFini) return; chargementFini = true; ch.classList.add('fini'); html.classList.add('ouvert'); requestAnimationFrame(() => apercuPret('resonance')); }
ch.addEventListener('pointerdown', fermerChargement);
async function jouerChargement() {
  const toile = $('#chargement-toile'), W = innerWidth, H = innerHeight, dpr = Math.min(devicePixelRatio || 1, 2);
  toile.width = W * dpr; toile.height = H * dpr;
  const ctx = toile.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const nomCh = $('#ch-nom'); if (nomCh) nomCh.textContent = c.nom || '';
  await Promise.race([polices, attendre(350)]);
  // cibles : les pixels des initiales
  const L = Math.round(W / 2), Hh = Math.round(H / 2), off = document.createElement('canvas'); off.width = L; off.height = Hh;
  const o = off.getContext('2d');
  const fs = Math.min(L * .5, Hh * .36);
  o.font = `600 ${fs}px ${POLICE}`; o.textAlign = 'center'; o.fillStyle = '#fff';
  const m = o.measureText(c.ini);
  o.fillText(c.ini, L / 2, Hh * .46 + (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2);
  const px = o.getImageData(0, 0, L, Hh).data, cibles = [];
  for (let y = 0; y < Hh; y += 1) for (let x = 0; x < L; x += 1) if (px[(y * L + x) * 4] > 128) cibles.push([x * 2, y * 2]);
  const n = petit ? 1500 : 2800, grains = [];
  for (let i = 0; i < n; i++) {
    const t = cibles[Math.floor(Math.random() * cibles.length)] || [W / 2, H / 2];
    const a = Math.random() * Math.PI * 2, r = (reduit ? .25 : .6) * Math.max(W, H) * Math.sqrt(Math.random());
    grains.push({ x0: W / 2 + Math.cos(a) * r, y0: H / 2 + Math.sin(a) * r, tx: t[0] + (Math.random() - .5) * 2, ty: t[1] + (Math.random() - .5) * 2, k: Math.random(), s: .8 + Math.random() * 1.2 });
  }
  ch.classList.add('vu');
  const duree = reduit ? 900 : 1500, t0 = performance.now();
  await new Promise((fin) => {
    const image = (now) => {
      const e = borne((now - t0) / duree), f = 1 - Math.pow(1 - e, 3);
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = coul.sable;
      for (const g of grains) {
        const p = borne(f * 1.25 - g.k * .25), q = 1 - Math.pow(1 - p, 3);
        const vib = (1 - q) * (reduit ? 1.2 : 3);
        const x = g.x0 + (g.tx - g.x0) * q + Math.sin(now * .014 + g.k * 40) * vib, y = g.y0 + (g.ty - g.y0) * q + Math.cos(now * .012 + g.k * 31) * vib;
        ctx.globalAlpha = .45 + .55 * q;
        ctx.fillRect(x, y, g.s, g.s);
      }
      ctx.globalAlpha = 1;
      if (e < 1) requestAnimationFrame(image); else fin();
    };
    requestAnimationFrame(image);
  });
}
const chargementJoue = jouerChargement();

// ---------- 3. La plaque ----------
const accueil = $('#accueil'), scene = $('.scene'), plaqueBoite = $('#plaque');
let plaque = null;
const FIGURES = [[3, 5, 1], [4, 7, -1], [2, 6, 1], [5, 3, -1]];
// Art-therapie : le papier et ses pigments, avec la meme interface que la plaque.
function encreCommePlaque(toile) {
  const e = demarrerEncre(toile, { petit, reduit });
  if (!e) return null;
  let W = 1, H = 1, dernier = null, segment = -1, k = 0;
  return {
    palette: () => e.palette(coul),
    taille(w, h) { W = w; H = h; e.taille(w, h); },
    texte: (mot, police) => e.texte(mot, police),
    toucher(x, y, appuye) {
      const px = x / W, py = 1 - y / H;
      if (dernier) { const dx = (px - dernier[0]) * W, dy = (py - dernier[1]) * H; if (Math.hypot(dx, dy) > 1) e.splat(px, py, dx * .9, dy * .9, appuye ? [[.18, 0, 0], [0, .18, 0], [0, 0, .18]][k % 3] : [0, 0, 0], appuye ? .0011 : .0016); }
      dernier = [px, py]; clearTimeout(this.oubli); this.oubli = setTimeout(() => { dernier = null; }, 120);
    },
    onde(x, y) { k++; e.fleurir(x / W, 1 - y / H, k % 3, 1); },
    dessiner(t, s) {
      // a l'ouverture : quelques taches fleurissent, a droite du nom
      if (!this.ouvert && t > .2) {
        this.ouvert = true;
        const p = petit ? [[.7, .78, 0], [.3, .86, 1], [.82, .58, 2]] : [[.66, .7, 0], [.84, .42, 1], [.72, .2, 2], [.93, .82, 0]];
        p.forEach(([x, y, c], i) => setTimeout(() => e.fleurir(x, y, c, petit ? .75 : 1.35), i * 260));
      }
      const seg = Math.floor(s.s ?? 0);
      if (seg !== segment) {
        // chaque tranche de defilement fait fleurir une couleur, a une place choisie
        const places = [[.3, .74, 0], [.78, .3, 1], [.5, .84, 2]];
        if (seg >= 1 && seg < 3 && seg > segment) { const [x, y, p] = places[seg]; e.fleurir(x, y, p, petit ? .6 : 1.2); }
        segment = seg;
      }
      // un souffle d'eau de temps en temps : la couleur continue de vivre (plus rare et plus doux sous mouvement
      // reduit) ; il se tait quand le prenom s'ecrit
      const rythme = reduit ? 6 : 3.2, force = (reduit ? 1.1 : 2.2) * (petit ? .65 : 1), large = petit ? .002 : .003;
      if (s.fin < .05 && t - (this.souffle || 0) > rythme) { this.souffle = t; e.splat(.5 + .4 * Math.sin(t * .7), .5 + .3 * Math.cos(t * .5), Math.cos(t) * force, Math.sin(t * 1.3) * force, [0, 0, 0], large); }
      // l'eau se calme d'abord, puis l'encre monte dans les lettres : ecrites dans une eau encore agitee, elles coulaient
      const ecrit = borne((s.fin - .5) / .5);
      if (ecrit > 0) e.ecrire(.08 * ecrit * ecrit, [.12, .95, 0]);
      e.dessiner(t, Math.min(1, s.fin * 2));
    },
    perdu: (f) => e.perdu(f),
  };
}
async function preparerPlaque() {
  if (!plaqueBoite) return false;
  const toile = document.createElement('canvas'); toile.setAttribute('aria-hidden', 'true');
  plaqueBoite.appendChild(toile);
  plaque = mode === 'pigment' ? encreCommePlaque(toile) : null;
  if (!plaque) plaque = demarrerPlaque(toile, { petit, reduit });
  if (!plaque) { toile.remove(); return false; }
  plaque.palette(mode === 'pigment' ? { plaque: coul.plaque, sable: coul.pigments[0], fond: coul.fond, papier: coul.papier, pigments: coul.pigments } : coul);
  const r = scene.getBoundingClientRect();
  plaque.taille(r.width, r.height);
  await polices;
  plaque.texte(motFinal, POLICE);
  plaque.dessiner(0, { a: FIGURES[0], b: FIGURES[0], mix: 0, fin: 0, s: 0 });
  html.classList.add('gl');
  plaque.perdu(() => { html.classList.remove('gl'); plaque = null; toile.remove(); });
  return true;
}
const plaquePrete = preparerPlaque().catch((e) => { console.warn('plaque indisponible', e); return false; });
Promise.race([Promise.all([plaquePrete, chargementJoue, attendre(APERCU ? 450 : reduit ? 900 : 1600)]), attendre(APERCU ? Math.max(0, 720 - performance.now()) : 2500)]).then(() => setTimeout(fermerChargement, APERCU ? 50 : reduit ? 120 : 300));

// La sequence : chaque tranche de defilement accorde la plaque sur une autre figure ; la derniere ecrit le prenom.
let sequence = { s: 0, a: FIGURES[0], b: FIGURES[0], mix: 0, fin: 0 }, noteJouee = 0;
const couches = $$('.couche'), defiler = $('.defiler'), invite = $('#invite');
function calculerSequence() {
  const r = accueil.getBoundingClientRect(), course = Math.max(1, accueil.offsetHeight - innerHeight);
  // la sequence occupe les quatre cinquiemes de la course : la derniere figure (le prenom) reste posee ensuite
  const s = borne(-r.top / (course * .8)) * 3;
  const seg = Math.min(2, Math.floor(s)), f = s - seg, m = lisse(.28, .78, f);
  if (seg < 2) sequence = { s, a: FIGURES[seg], b: FIGURES[seg + 1], mix: m, fin: 0 };
  else sequence = { s, a: FIGURES[2], b: FIGURES[3], mix: m * .4, fin: m };
  const actives = [s < .72, s > .9 && s < 1.92, s > 2.45];
  couches.forEach((el) => el.classList.toggle('active', !!actives[+el.dataset.couche]));
  defiler?.classList.toggle('parti', s > .15);
  invite?.classList.toggle('loin', s > 2.3); // le prenom s'ecrit : l'invitation se retire
  // une note a chaque nouvelle figure, si le son est actif
  const note = Math.round(s);
  if (note !== noteJouee) { noteJouee = note; if (sonActif()) sonBol(GAMME[[2, 4, 3, 5][note] ?? 2], timbre, .55); }
}

// Le geste sur la plaque
let premiereFois = true;
function surPlaque(e, appuye) {
  if (!plaque || e.target.closest('a, button')) return;
  const r = plaqueBoite.getBoundingClientRect();
  plaque.toucher(e.clientX - r.left, e.clientY - r.top, appuye);
  reveiller();
}
scene.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse' || e.buttons) surPlaque(e, false); }, { passive: true });
scene.addEventListener('pointerdown', (e) => {
  if (!plaque || e.target.closest('a, button')) return;
  const r = plaqueBoite.getBoundingClientRect();
  plaque.onde(e.clientX - r.left, e.clientY - r.top, (performance.now() - debut) / 1000, 1);
  surPlaque(e, true);
  if (premiereFois) { premiereFois = false; invite?.classList.add('parti'); }
  if (mode === 'son') sonBol(GAMME[[2, 4, 3, 5][Math.round(sequence.s)] ?? 2], timbre, .8); else goutte(.8);
}, { passive: true });

// ---------- 4. Le son (coupe par defaut) ----------
const boutonSon = $('#son');
// dans l'aperçu de la page d'arrivée : aucun son, et pas de bouton pour en mettre
if (APERCU && boutonSon) { boutonSon.hidden = true; boutonSon.style.display = 'none'; }
boutonSon?.addEventListener('click', async () => {
  const oui = !sonActif();
  const ok = await activerSon(oui);
  const actif = oui && ok !== false;
  boutonSon.setAttribute('aria-pressed', String(actif));
  boutonSon.querySelector('.son-texte').textContent = actif ? 'Son activé' : 'Son coupé';
  if (actif) { if (mode === 'son') sonBol(GAMME[2], timbre, .5); else goutte(.6); }
});

// ---------- 5. Les cordes, le bol, les ondes ----------
const NB = 7;
const cordesBoite = $('#cordes');
const cordes = cordesBoite ? demarrerCordes(cordesBoite, { reduit, style: mode, couleurs: { accent: coul.accent, pigments: coul.pigments }, surPince: (k, f) => (mode === 'son' ? sonCorde(GAMME[NB - 1 - k] || GAMME[k % GAMME.length], f) : goutte(Math.min(1, f))) }) : null;

const bolFig = $('#bol');
if (bolFig) {
  const img = $('img', bolFig);
  bolFig.setAttribute('tabindex', '0'); bolFig.setAttribute('role', 'button');
  bolFig.setAttribute('aria-label', mode === 'son' ? 'Faire sonner le bol' : 'Toucher l’eau');
  const lancer = () => {
    const b = demarrerBol(bolFig, img, mode === 'son' ? { foyer: [.43, .5], source: [.43, .37], mode, lueur: coul.accent, surFrappe: (f) => sonBol(GAMME[1], timbre, f) } : { foyer: [.5, .5], mode, lueur: '#ffffff', surFrappe: (f) => goutte(f) });
    if (b) { addEventListener('resize', () => b.taille()); window.__bol = b; }
  };
  if (img) {
    img.loading = 'eager';
    (img.complete && img.naturalWidth ? Promise.resolve() : img.decode()).then(lancer).catch(() => {});
  }
}
$$('.note-tenue').forEach((li, i) => {
  const chemin = $('.nt-onde path', li);
  const vibrer = () => {
    chemin?.animate([{ transform: 'scaleY(1)' }, { transform: 'scaleY(2.4)' }, { transform: 'scaleY(-1.8)' }, { transform: 'scaleY(1.3)' }, { transform: 'scaleY(-.7)' }, { transform: 'scaleY(.3)' }, { transform: 'scaleY(1)' }], { duration: 1300, easing: 'cubic-bezier(.2,.7,.3,1)' });
    if (mode === 'son') sonCorde(GAMME[(i + 3) % GAMME.length], .5);
  };
  li.addEventListener('pointerenter', vibrer); li.addEventListener('pointerdown', vibrer);
});
const telGeant = $('.tel-geant');
const telOnde = $('.tel-onde path');
telGeant?.addEventListener('pointerenter', () => telOnde?.animate([{ transform: 'scaleY(1)' }, { transform: 'scaleY(2)' }, { transform: 'scaleY(-1.4)' }, { transform: 'scaleY(.6)' }, { transform: 'scaleY(1)' }], { duration: 1100, easing: 'ease-out' }));

// ---------- 6. Ce que pilote le defilement ----------
const barre = $('#barre');
for (const s of ['.phare', '.approche-suite > p', '.gamme', '.mesure', '.durees', '.note-tenue', '.tarifs-note', '.disque', '.apropos-texte > *', '.contact-mode', '.tel-geant', '.contact-liens', '.infos > div', '.pied-nom', '.pied-apercu', '.pied-mesure']) {
  $$(s).forEach((el, i) => { el.classList.add('apparait'); el.style.setProperty('--d', `${(i % 3) * .09}s`); });
}
const vigie = new IntersectionObserver((es) => { for (const e of es) if (e.isIntersecting) { e.target.classList.add('vu'); vigie.unobserve(e.target); } }, { rootMargin: '0px 0px -8% 0px', threshold: .08 });
$$('.apparait').forEach((el) => vigie.observe(el));
const traces = $$('.trace'), disque = $('.disque-sillons');
let defile = true;
function defilement() {
  const H = innerHeight;
  calculerSequence();
  barre.classList.toggle('pleine', accueil.getBoundingClientRect().bottom < 80);
  for (const t of traces) { const r = t.getBoundingClientRect(); t.style.setProperty('--trace', (1 - borne((H * .92 - r.top) / (H * .55))).toFixed(3)); }
  if (disque) { const r = disque.getBoundingClientRect(); disque.style.setProperty('--rot', `${((H - r.top) * .18).toFixed(1)}deg`); }
}
addEventListener('scroll', () => { defile = true; reveiller(); }, { passive: true });

// ---------- 7. La boucle ----------
let enVue = true, vivant = false, redim = 0;
new IntersectionObserver(([e]) => { enVue = e.isIntersecting; if (enVue) reveiller(); }, { threshold: 0 }).observe(accueil);
addEventListener('resize', () => {
  clearTimeout(redim);
  redim = setTimeout(() => { const r = scene.getBoundingClientRect(); if (plaque) { plaque.taille(r.width, r.height); plaque.texte(motFinal, POLICE); } cordes?.taille(); defile = true; reveiller(); }, 220);
});
function reveiller() { if (!vivant) { vivant = true; requestAnimationFrame(boucle); } }
function boucle(m) {
  vivant = false;
  if (defile) { defilement(); defile = false; }
  if (plaque && enVue) {
    const t = (m - debut) / 1000;
    const souffle = reduit ? 0 : .035 * Math.sin(t * .55) * (1 - sequence.fin);
    plaque.dessiner(t, { a: sequence.a, b: sequence.b, mix: borne(sequence.mix + souffle), fin: sequence.fin, s: sequence.s });
    vivant = true; requestAnimationFrame(boucle);
  }
}
reveiller();
