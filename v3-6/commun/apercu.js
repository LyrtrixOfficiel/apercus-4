// ?apercu=1 : le contrat de la page d'arrivée (BRIEF-3), le même pour les 11 univers.
// La page d'arrivée montre le vrai site, en direct, dans un cadre. Avec ?apercu=1, chaque univers :
// - raccourcit son chargement : 0,8 s au plus (APERCU_MAX), la vraie première impression reste (ouverture, matière) ;
// - coupe tout son (aucun AudioContext n'est créé) ;
// - prévient la page parente quand le premier rendu est prêt : parent.postMessage({ type: 'kazura-pret', univers }, '*') ;
// - garde ?palette=<id> à l'identique (rien ne change de ce côté).
// Dans le cadre, la page marque aussi <html data-apercu> : chaque univers peut alléger ce qui ne se voit pas
// (définition des toiles plafonnée, par exemple) sans rien changer à ce qui se voit.
const q = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams('');
export const APERCU = q.get('apercu') === '1';
export const APERCU_MAX = 800;
export const DANS_CADRE = (() => { try { return typeof window !== 'undefined' && window.parent !== window; } catch { return true; } })();
if (APERCU && typeof document !== 'undefined') document.documentElement.dataset.apercu = '1';

let annonce = false;
/** À appeler une fois le premier rendu prêt (chargement fini ou levé). Sans effet hors aperçu ; une seule fois. */
export function apercuPret(univers) {
  if (!APERCU || annonce) return;
  annonce = true;
  const message = { type: 'kazura-pret', univers, palette: document.documentElement.dataset.palette || document.getElementById('site')?.dataset.palette || document.querySelector('[data-palette]')?.dataset.palette || q.get('palette') || '', p: q.get('p') || '', t: Math.round(performance.now()) };
  try { if (window.parent && window.parent !== window) window.parent.postMessage(message, '*'); } catch { /* cadre d'une autre origine : rien à faire */ }
  try { window.dispatchEvent(new CustomEvent('kazura-pret', { detail: message })); performance.mark?.('kazura-pret'); } catch { /* vieux navigateur */ }
}

/** Une durée de chargement, ramenée à l'aperçu : min(ms, part du budget de 0,8 s). */
export const duree = (ms, part = 1) => (APERCU ? Math.min(ms, APERCU_MAX * part) : ms);

/** Filet de sécurité : si rien n'a annoncé le rendu (erreur, ancien navigateur), on prévient quand même. */
export function filet(univers, ms = 1600) {
  if (!APERCU || typeof setTimeout === 'undefined') return;
  setTimeout(() => apercuPret(univers), ms);
}
