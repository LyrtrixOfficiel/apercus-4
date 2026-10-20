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

/** Une vignette de la rangée des réalisations (accueil) : la capture et le nom, un bouton qui met le site en grand. */
export function vignetteHTML(s, i) {
  const c = s.captures || {};
  const petit = IMG + (c.petit || c.ordi);
  return `<li><button class="vg" type="button" data-i="${i}" style="--teinte:${esc(s.couleur || '#8b5cf6')}">
  <span class="vg-image"><img src="${esc(petit)}" alt="" width="800" height="500" loading="lazy" decoding="async"></span>
  <span class="vg-nom"><span class="vg-num" aria-hidden="true">${deux(i + 1)}</span>${esc(s.nom)}</span>
</button></li>`;
}

/** L'invitation de l'accueil : les affiches fixes des premières expériences, composées (aucune vidéo). */
export function invitationHTML(liste) {
  return liste.slice(0, 3).map((x, i) => {
    const d = dossier(x);
    const image = x.affiche ? `${d}affiche.webp` : x.repli ? esc(x.repli) : '';
    const visuel = image ? `<img src="${image}" alt="" width="1600" height="1000" loading="lazy" decoding="async">`
      : `<span class="af-dessin">${SCEAU_TRAITS}<span class="af-dessin-mot">${esc(x.titre)}</span></span>`;
    return `<figure class="xp-af xp-af-${i + 1}" style="--teinte:${esc(x.couleur || '#6ee7b7')}">
  <span class="xp-af-cadre">${visuel}</span>
  <figcaption><span class="xp-af-num">XP.${deux(i + 1)}</span><span class="xp-af-nom">${esc(x.titre)}</span><span class="xp-af-genre">${esc(x.genre)}</span></figcaption>
</figure>`;
  }).join('\n');
}

/** Une expérience sur la page des expériences : l'affiche fixe, le texte et le bouton « Entrer ». Aucune vidéo. */
export function afficheHTML(x, i, { niveau = 'h2', chargement = 'lazy' } = {}) {
  const d = dossier(x);
  const id = `af-${esc(x.id)}`;
  let image;
  if (x.affiche) image = `<img src="${d}affiche.webp" alt="" width="1600" height="1000" loading="${chargement}" decoding="async">`;
  else if (x.repli) image = `<img src="${esc(x.repli)}" alt="" width="1600" height="1000" loading="${chargement}" decoding="async">`;
  else image = `<span class="af-dessin">${SCEAU_TRAITS}<span class="af-dessin-mot">${esc(x.titre)}</span></span>`;
  return `<article class="affiche" data-id="${esc(x.id)}" style="--teinte:${esc(x.couleur || '#6ee7b7')}">
  <a class="af-image" href="${d}index.html" tabindex="-1" aria-hidden="true">${image}
    <span class="af-coin af-coin-1"></span><span class="af-coin af-coin-2"></span><span class="af-coin af-coin-3"></span><span class="af-coin af-coin-4"></span>
  </a>
  <div class="af-texte">
    <p class="etiquette af-etiquette">Expérience ${deux(i + 1)} · ${esc(x.genre)}</p>
    <${niveau} class="af-titre" id="${id}">${esc(x.titre)}</${niveau}>
    <p class="af-phrase">${esc(x.phrase)}</p>
    <p class="af-actions"><a class="bouton af-entrer" href="${d}index.html" aria-describedby="${id}">Entrer<svg class="fl" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6"/></svg></a><span class="af-note">S’ouvre sur sa propre page</span></p>
  </div>
</article>`;
}
