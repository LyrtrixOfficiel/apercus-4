// Le site infini : le démarrage et l'interface.
// WebGL 2 présent : le moteur three.js (moteur.js). Sinon (ou ?sansgl) : le repli en canvas 2D (repli.js).
// Réglages d'essai : ?d=3.5 (aller à une profondeur), ?fixe=1 (qualité figée), ?q=0.8 (qualité), ?sansgl.
import { NIVEAUX } from './pages.js';

const q = new URLSearchParams(location.search);
const reduit = matchMedia('(prefers-reduced-motion: reduce)').matches;
const tactile = matchMedia('(pointer: coarse)').matches;
const mobile = tactile || Math.min(innerWidth, innerHeight) < 600 || q.has('mobile');
if (tactile) document.documentElement.classList.add('tactile');

const $ = (s) => document.querySelector(s);
const toile = $('#scene');
const el = {
  n: $('.if-p-n'), mot: $('.if-p-mot'), zoom: $('.if-zoom'), metier: $('.if-metier'), site: $('.if-site'),
  annonce: $('#annonce'), pause: $('.if-pause'), geste: $('.if-geste-mot'),
};
if (tactile) el.geste.textContent = 'Glissez vers le haut pour entrer';
if (reduit) el.pause.hidden = true;

function webgl2() { try { return !!document.createElement('canvas').getContext('webgl2'); } catch { return false; } }

// « × 3,2 milliards » : le zoom cumulé, en mots
const MOTS = [[1e24, 'quadrillions'], [1e21, 'trilliards'], [1e18, 'trillions'], [1e15, 'billiards'], [1e12, 'billions'], [1e9, 'milliards'], [1e6, 'millions']];
const nf = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });
const nf0 = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
function zoomEnMots(L) {
  if (L > 59) { const e = Math.floor(L / Math.LN10); return `× 10${String(e).replace(/\d/g, (c) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[c])}`; }
  const z = Math.exp(L);
  for (const [v, m] of MOTS) if (z >= v) return `× ${nf.format(z / v)} ${m}`;
  return `× ${z < 10 ? nf.format(z) : nf0.format(z)}`;
}

let dernierTexte = '', dernierN = -1;
const rappels = {
  surNiveau(n, info) {
    if (n === 0) { el.metier.textContent = 'Kazura'; el.site.textContent = 'Le seuil : entrez dans l’écran'; }
    else { el.metier.textContent = info.metier; el.site.textContent = `${info.site} · porte : ${info.porte}`; }
    el.n.textContent = String(n).padStart(2, '0');
    el.mot.textContent = n === 0 ? 'Seuil' : 'Site';
    if (n !== dernierN && n > 0) el.annonce.textContent = `Site ${n} : ${info.metier}, ${info.site}. On en sort par ${info.porte}.`;
    dernierN = n;
  },
  surProfondeur(D, L) {
    const t = zoomEnMots(L);
    if (t !== dernierTexte) { el.zoom.textContent = t; dernierTexte = t; }
    document.body.classList.toggle('plonge', D > 0.04);
  },
};

async function polices() {
  try {
    await Promise.race([
      Promise.all(['400 20px Newsreader', 'italic 400 20px Newsreader', '500 20px "Bricolage Grotesque"', '800 20px "Bricolage Grotesque"', '400 20px "JetBrains Mono"'].map((f) => document.fonts.load(f))),
      new Promise((r) => setTimeout(r, 2500)),
    ]);
  } catch {}
}

let ctrl = null;
async function repli(raison) {
  console.info('Site infini : repli 2D', raison || '');
  document.body.classList.add('repli');
  const m = await import('./repli.js');
  ctrl = m.demarrer(toile, { reduit, mobile, ...rappels });
  if (q.has('d')) ctrl.aller(+q.get('d'));
  window.__infini = ctrl;
  document.body.classList.remove('attente');
}

(async () => {
  await polices();
  if (q.has('sansgl') || !webgl2()) { await repli('WebGL 2 absent'); return; }
  try {
    const m = await import('./moteur.js');
    ctrl = await m.demarrer(toile, {
      reduit, mobile, fixe: q.has('fixe'), trace: q.has('trace'), ...rappels,
      surPerte() { ctrl?.arreter(); repli('contexte WebGL perdu'); },
    });
    if (q.has('q')) ctrl.qualite(+q.get('q'));
    if (q.has('d')) ctrl.aller(+q.get('d'));
    window.__infini = ctrl;
    document.body.classList.remove('attente');
  } catch (e) {
    console.warn('Site infini : le moteur 3D ne démarre pas', e);
    try { ctrl?.arreter(); } catch {}
    await repli('erreur');
  }
})();

el.pause.addEventListener('click', () => {
  const oui = el.pause.getAttribute('aria-pressed') !== 'true';
  el.pause.setAttribute('aria-pressed', String(oui));
  el.pause.setAttribute('aria-label', oui ? 'Reprendre la plongée automatique' : 'Mettre en pause la plongée automatique');
  ctrl?.pause(oui);
});
export { NIVEAUX };
