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

const HORLOGE = '<svg class="xp-horloge" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.2"/><path d="M8 4.6V8l2.4 1.6"/></svg>';
const MAIN = '<svg class="xp-main" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 11V5.5a1.5 1.5 0 013 0V10m0-1.5a1.5 1.5 0 013 0V11m0-1a1.5 1.5 0 013 0v4.5c0 3.6-2.4 6.5-6 6.5h-.6c-2 0-3.4-.8-4.6-2.4L4.2 14a1.6 1.6 0 012.5-2L9 14.2"/></svg>';
const FL = '<svg class="fl" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6"/></svg>';

/** L'image d'une expérience : son affiche, son image de secours, ou une affiche dessinée. */
function visuelXp(x, chargement = 'lazy') {
  const d = dossier(x);
  if (x.affiche) return `<img src="${d}affiche.webp" alt="" width="1600" height="1000" loading="${chargement}" decoding="async">`;
  if (x.repli) return `<img src="${esc(x.repli)}" alt="" width="1600" height="1000" loading="${chargement}" decoding="async">`;
  return `<span class="af-dessin">${SCEAU_TRAITS}<span class="af-dessin-mot">${esc(x.titre)}</span></span>`;
}

/** L'accueil, partie « Expériences » (v16) : une carte par expérience, qui dit ce qu'on y fait, comment, et combien de
 *  temps ça prend. Chaque carte mène DIRECTEMENT à son expérience (elle s'ouvre sur sa propre page). Aucune vidéo. */
export function invitationHTML(liste) {
  return liste.slice(0, 3).map((x, i) => `<li class="xp-carte xp-carte-${i + 1}" style="--teinte:${esc(x.couleur || '#6ee7b7')}">
  <a class="xp-lien" href="${dossier(x)}index.html">
    <span class="xp-af-cadre">${visuelXp(x)}<span class="xp-pastille">${MAIN}Interactif</span></span>
    <span class="xp-infos">
      <span class="xp-meta"><span class="xp-num">Expérience ${deux(i + 1)} · ${esc(x.titre)}</span>${x.duree ? `<span class="xp-duree">${HORLOGE}${esc(x.duree)}</span>` : ''}</span>
      <span class="xp-action">${esc(x.action || x.titre)}</span>
      <span class="xp-gestes">${esc(x.gestes || x.phrase)}</span>
      <span class="xp-essayer">Essayer${FL}</span>
    </span>
  </a>
</li>`).join('\n');
}

/** Une expérience sur la page des expériences : l'affiche fixe, ce qu'on y fait, comment, la durée, et « Essayer ». */
export function afficheHTML(x, i, { niveau = 'h2', chargement = 'lazy' } = {}) {
  const d = dossier(x);
  const id = `af-${esc(x.id)}`;
  return `<article class="affiche" data-id="${esc(x.id)}" style="--teinte:${esc(x.couleur || '#6ee7b7')}">
  <a class="af-image" href="${d}index.html" tabindex="-1" aria-hidden="true">${visuelXp(x, chargement)}
    <span class="af-coin af-coin-1"></span><span class="af-coin af-coin-2"></span><span class="af-coin af-coin-3"></span><span class="af-coin af-coin-4"></span>
    <span class="xp-pastille">${MAIN}Interactif</span>
  </a>
  <div class="af-texte">
    <p class="etiquette af-etiquette">Expérience ${deux(i + 1)} · ${esc(x.titre)}</p>
    <${niveau} class="af-titre" id="${id}">${esc(x.action || x.titre)}</${niveau}>
    <p class="af-phrase">${esc(x.phrase)}</p>
    <dl class="af-fiche">
      <div><dt>Ce que vous faites</dt><dd>${esc(x.gestes || 'Vous essayez, à votre rythme.')}</dd></div>
      <div><dt>Durée</dt><dd>${esc(x.duree || 'Quelques minutes')}</dd></div>
      <div><dt>Sur</dt><dd>Téléphone et ordinateur</dd></div>
    </dl>
    <p class="af-actions"><a class="bouton af-entrer" href="${d}index.html" aria-describedby="${id}">Essayer${FL}</a><span class="af-note">S’ouvre sur sa propre page</span></p>
  </div>
</article>`;
}

// ---------------------------------------------------------------------------------------------------- la navigation

const WHATSAPP = 'https://wa.me/33630110038';
const TEL = '<a href="tel:+33749983583">07&nbsp;49&nbsp;98&nbsp;35&nbsp;83</a>';
const COURRIEL = '<a href="mailto:matheo@kazura.fr">matheo@kazura.fr</a>';

/** LES liens de la navigation, identiques sur toutes les pages (v16). page : 'accueil', 'realisations', 'experiences'
 *  ou 'mentions'. Sur l'accueil, les liens vers ses parties sont des ancres (#rever) ; ailleurs, ils y ramènent
 *  (index.html#rever). data-s : la partie de l'accueil que le lien désigne (il s'allume quand on y est). */
export function liensNav(page) {
  const a = page === 'accueil' ? '' : 'index.html';
  return [
    { href: page === 'accueil' ? '#ouverture' : 'index.html', texte: 'Accueil', s: 'ouverture', courant: page === 'accueil' },
    { href: 'realisations.html', texte: 'Réalisations', s: 'realisations', courant: page === 'realisations' },
    { href: 'experiences.html', texte: 'Expériences', s: 'experiences', courant: page === 'experiences' },
    { href: a + '#rever', texte: 'Ce qui est compris', s: 'rever' },
    { href: a + '#deroule', texte: 'Comment ça se passe', s: 'deroule' },
    { href: a + '#questions', texte: 'Questions', s: 'questions' },
  ];
}

/** LA barre du haut et le menu du téléphone, identiques sur toutes les pages. */
export function navHTML(page) {
  const a = page === 'accueil' ? '' : 'index.html';
  const liens = liensNav(page);
  const lien = (l) => `<a href="${l.href}" data-s="${l.s}"${l.courant && page !== 'accueil' ? ' aria-current="page"' : ''}>${l.texte}</a>`;
  return `<header class="tete${page === 'accueil' ? '' : ' colle'}" id="tete">
  <a class="marque" href="${page === 'accueil' ? '#ouverture' : 'index.html'}" aria-label="Kazura, retour à l’accueil">
    <img src="img/sceau.svg" alt="" width="26" height="26"><span>Kazura</span>
  </a>
  <nav class="nav" aria-label="Navigation principale">
    ${liens.map(lien).join('\n    ')}
  </nav>
  <a class="pilule bouton-tete" href="${a}#contact"><span class="long">Me contacter</span><span class="court" aria-hidden="true">Contact</span></a>
  <details class="menu" id="menu">
    <summary><span class="menu-traits" aria-hidden="true"><i></i><i></i><i></i></span><span class="menu-ouvrir">Menu</span><span class="menu-fermer">Fermer</span></summary>
    <div class="menu-panneau">
      <nav aria-label="Menu">
        ${liens.map(lien).join('\n        ')}
        <a href="${a}#contact" data-s="contact">Me contacter</a>
      </nav>
      <p class="menu-pied">
        <a href="${WHATSAPP}" rel="noopener">WhatsApp</a>
        ${TEL}
        ${COURRIEL}
      </p>
    </div>
  </details>
</header>`;
}

/** Le pied de page, identique partout. */
export function piedHTML(page) {
  const a = page === 'accueil' ? '' : 'index.html';
  return `<footer class="pied">
  <div class="pied-haut">
    <a class="marque" href="${page === 'accueil' ? '#ouverture' : 'index.html'}" aria-label="Kazura, retour à l’accueil"><img src="img/sceau.svg" alt="" width="26" height="26"><span>Kazura</span></a>
    <p>Des sites sur mesure pour les indépendants, dessinés et construits par Mathéo.</p>
  </div>
  <div class="pied-colonnes">
    <ul class="pied-liens" aria-label="Le site">
      ${liensNav(page).map((l) => `<li><a href="${l.href}"${l.courant && page !== 'accueil' ? ' aria-current="page"' : ''}>${l.texte}</a></li>`).join('\n      ')}
      <li><a href="mentions-legales.html"${page === 'mentions' ? ' aria-current="page"' : ''}>Mentions légales</a></li>
    </ul>
    <ul class="pied-liens" aria-label="Me contacter">
      <li><a href="${a}#contact">Me contacter</a></li>
      <li><a href="${WHATSAPP}" rel="noopener">WhatsApp</a></li>
      <li>${TEL}</li>
      <li>${COURRIEL}</li>
    </ul>
  </div>
  <p class="pied-bas">Kazura, Matheo Schmitt, entrepreneur individuel. SIREN 100&nbsp;165&nbsp;455. Ce site ne dépose aucun cookie.</p>
</footer>`;
}

// ---------------------------------------------------------------------------------------------------- les prix

const euros = (n) => `${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '&nbsp;')}&nbsp;€`;

/** Le bloc de prix de « Osez rêver ». VIDE tant que AFFICHER_PRIX est faux (js/reglages.js). */
export function prixHTML({ AFFICHER_PRIX, PRIX }) {
  if (!AFFICHER_PRIX) return '';
  const p = PRIX, part = Math.round(p.creation / p.fois);
  return `<div class="prix">
  <p class="etiquette prix-tete">Le prix, tout compris</p>
  <div class="prix-cartes">
    <div class="prix-carte prix-creation">
      <p class="prix-quoi">La création de votre site</p>
      <p class="prix-montant"><b>${p.creation}</b><span>&nbsp;€</span></p>
      <p class="prix-detail">${euros(p.creation)} la création, tout compris, soit <strong>${p.fois}&nbsp;×&nbsp;${euros(part)}</strong> sans frais.</p>
    </div>
    <p class="prix-puis" aria-hidden="true">puis</p>
    <div class="prix-carte prix-abo">
      <p class="prix-quoi">L’abonnement</p>
      <p class="prix-montant"><b>${p.mois}</b><span>&nbsp;€ par mois</span></p>
      <p class="prix-detail">Puis ${euros(p.mois)} par mois, <strong>sans engagement</strong> (ou ${euros(p.an)} par an, un mois offert).</p>
    </div>
  </div>
</div>`;
}

/** La réponse à « Combien coûte un site ? », avec ou sans chiffres selon le réglage. */
export function faqPrixHTML({ AFFICHER_PRIX, PRIX }) {
  if (!AFFICHER_PRIX) return `<p>Tout ce qui est listé plus haut est compris dans la création, sans option cachée&nbsp;: je vous donne le prix avant de commencer, et il ne bouge plus. Vous payez en une fois, en 2&nbsp;fois, ou jusqu’en 10&nbsp;fois sans frais. Ensuite, l’abonnement mensuel est sans engagement. Le plus simple pour le connaître&nbsp;: m’écrire deux lignes sur votre activité.</p>`;
  const p = PRIX, part = Math.round(p.creation / p.fois);
  return `<p><strong>${euros(p.creation)} la création, tout compris</strong>&nbsp;: tout ce qui est listé plus haut, sans option cachée. Vous payez en une fois, en 2&nbsp;fois, ou jusqu’en ${p.fois}&nbsp;fois sans frais, soit ${p.fois}&nbsp;×&nbsp;${euros(part)}. Ensuite, ${euros(p.mois)} par mois, sans engagement (ou ${euros(p.an)} par an, un mois offert). La boutique, le paiement en ligne et l’espace membres sont à part, sur devis.</p>`;
}
