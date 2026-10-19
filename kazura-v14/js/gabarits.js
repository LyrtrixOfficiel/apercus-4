// Kazura : les gabarits HTML des réalisations et des expériences.
// Les mêmes fonctions servent au navigateur (la page se remplit depuis les listes) et au script
// realisations/generer.mjs (qui écrit la version sans JavaScript dans les pages). Aucune dépendance au DOM.

import { domaine } from '../realisations/sites.js';
import { dossier } from './experiences-liste.js';

const deux = (n) => String(n).padStart(2, '0');
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const IMG = 'realisations/img/';
const SORTIE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17L17 7M9 7h8v8"/></svg>';
const FLECHE = '<svg class="fl" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6"/></svg>';

/** Le sceau Kazura en traits fins (anneau double, trois folioles, cœur), pour les affiches dessinées. */
export const SCEAU_TRAITS = `<svg class="sceau-traits" viewBox="-2 -2 104 104" aria-hidden="true" focusable="false"><g fill="none" stroke="currentColor" stroke-width="1" vector-effect="non-scaling-stroke">
<circle cx="50" cy="50" r="48"/><circle cx="50" cy="50" r="42"/>
<path d="M50 46C39.5 37 34.5 23.5 50 7c15.5 16.5 10.5 30 0 39zm0-7.4c6.2-6 8.6-14.4 0-23.6-8.6 9.2-6.2 17.6 0 23.6z"/>
<path transform="rotate(120 50 50)" d="M50 46C39.5 37 34.5 23.5 50 7c15.5 16.5 10.5 30 0 39zm0-7.4c6.2-6 8.6-14.4 0-23.6-8.6 9.2-6.2 17.6 0 23.6z"/>
<path transform="rotate(240 50 50)" d="M50 46C39.5 37 34.5 23.5 50 7c15.5 16.5 10.5 30 0 39zm0-7.4c6.2-6 8.6-14.4 0-23.6-8.6 9.2-6.2 17.6 0 23.6z"/>
<circle cx="50" cy="50" r="4.6"/></g></svg>`;

/** Un site de la sélection de l'accueil (la légende sous le panneau 3D, ou l'image en DOM sans 3D). */
export function oeuvreHTML(s, i, n) {
  const c = s.captures || {};
  const petit = IMG + (c.petit || c.ordi), grand = IMG + (c.ordi || c.petit);
  return `<article class="oeuvre" data-id="${esc(s.id)}" data-couleur="${esc(s.couleur || '#8b5cf6')}" data-image="${esc(grand)}" data-petit="${esc(petit)}" aria-labelledby="o-${esc(s.id)}">
  <div class="o-image"><img src="${esc(petit)}" srcset="${esc(petit)} 800w, ${esc(grand)} 1440w" sizes="(min-width: 900px) 56vw, 92vw" width="1440" height="900" alt="${esc(s.nom)}, la page d’accueil" loading="lazy" decoding="async"></div>
  <div class="o-legende">
    <p class="o-pos"><span class="o-num">${deux(i + 1)} / ${deux(n)}</span><span>${esc(domaine(s))}</span></p>
    <h3 id="o-${esc(s.id)}">${esc(s.nom)}</h3>
    <p class="o-metier">${esc(s.metier)}</p>
    <p class="o-fait">${esc(s.phrase)}</p>
    <ul class="o-tags" aria-label="Ce qu’on y trouve">${(s.etiquettes || []).map((e) => `<li>${esc(e)}</li>`).join('')}</ul>
    <a class="o-voir" href="${esc(s.adresse)}" target="_blank" rel="noopener">Voir le site<span class="vh"> ${esc(s.nom)} (nouvel onglet)</span>${SORTIE}</a>
  </div>
</article>`;
}

/** Une carte de la page « Toutes les réalisations ». */
export function carteHTML(s, i) {
  const c = s.captures || {};
  const petit = IMG + (c.petit || c.ordi), grand = IMG + (c.ordi || c.petit);
  return `<li class="carte" data-etiquettes="${esc((s.etiquettes || []).join('|'))}" style="--teinte:${esc(s.couleur || '#8b5cf6')}">
  <a class="c-lien" href="${esc(s.adresse)}" target="_blank" rel="noopener">
    <div class="c-image"><img src="${esc(petit)}" srcset="${esc(petit)} 800w, ${esc(grand)} 1440w" sizes="(min-width: 1500px) 30vw, (min-width: 900px) 45vw, 92vw" width="1440" height="900" alt="${esc(s.nom)}, la page d’accueil" loading="lazy" decoding="async"></div>
    <div class="c-texte">
      <span class="c-pos"><span>${deux(i + 1)}</span><span>${esc(domaine(s))}</span></span>
      <h2 class="c-nom">${esc(s.nom)}</h2>
      <span class="c-metier">${esc(s.metier)}</span>
      <span class="c-phrase">${esc(s.phrase)}</span>
      <span class="c-tags">${(s.etiquettes || []).map((e) => `<span>${esc(e)}</span>`).join('')}</span>
      <span class="c-voir">Voir le site<span class="vh"> (nouvel onglet)</span>${SORTIE}</span>
    </div>
  </a>
</li>`;
}

/** Une affiche d'expérience. niveau : 'h3' dans l'accueil, 'h2' sur la page des expériences. */
export function afficheHTML(x, i, { niveau = 'h3', chargement = 'lazy' } = {}) {
  const d = dossier(x);
  const id = `af-${esc(x.id)}`;
  let image;
  if (x.affiche) image = `<img src="${d}affiche.webp" alt="" width="1600" height="1000" loading="${chargement}" decoding="async">`;
  else if (x.repli) image = `<img src="${esc(x.repli)}" alt="" width="1600" height="1000" loading="${chargement}" decoding="async">`;
  else image = `<span class="af-dessin">${SCEAU_TRAITS}<span class="af-dessin-mot">${esc(x.titre)}</span></span>`;
  const video = x.video ? `<video class="af-video" muted loop playsinline preload="none" data-src="${d}affiche.mp4"${x.affiche ? ` poster="${d}affiche.webp"` : ''}></video>` : '';
  return `<article class="affiche" data-id="${esc(x.id)}" style="--teinte:${esc(x.couleur || '#6ee7b7')}">
  <a class="af-lien" href="${d}index.html" aria-labelledby="${id}" aria-describedby="${id}-d">
    <div class="af-image" aria-hidden="true">${image}${video}
      <span class="af-coin af-coin-1"></span><span class="af-coin af-coin-2"></span><span class="af-coin af-coin-3"></span><span class="af-coin af-coin-4"></span>
      <span class="af-repere"><span>XP.${deux(i + 1)}</span><span>${esc(x.genre)}</span></span>
    </div>
    <div class="af-texte">
      <span class="etiquette af-etiquette">Expérience ${deux(i + 1)} · ${esc(x.genre)}</span>
      <${niveau} class="af-titre" id="${id}">${esc(x.titre)}</${niveau}>
      <span class="af-phrase" id="${id}-d">${esc(x.phrase)}</span>
      <span class="bouton af-entrer">Entrer${FLECHE}</span>
    </div>
  </a>
</article>`;
}
