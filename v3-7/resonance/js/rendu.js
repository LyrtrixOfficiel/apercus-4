// Resonance : la page entiere depuis la fiche JSON d'un praticien.
// Meme module dans le navigateur (?p=<dossier>) et dans node (batir.mjs ecrit la page par defaut : elle se lit
// sans JavaScript, avec une figure de Chladni dessinee en SVG). Rien n'est invente.
import { lireNom, metierAccorde, initiales } from './prenom.js';
import { nettoyer, sansPromesse } from '../../commun/phrases.js';
import { PHOTOS } from './photos.js';
import { modeDe } from './univers.js';

const ENT = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s = '') => String(s ?? '').replace(/[&<>"']/g, (c) => ENT[c]);
export const fr = (s = '') => esc(s).replace(/[\u2013\u2014]/g, ',').replace(/([.!?…]\s+)(\p{Ll})/gu, (t, a, b) => a + b.toUpperCase()).replace(/\s+([:;!?»])/g, ' $1').replace(/«\s*/g, '« ').replace(/rendez-vous/g, 'rendez‑vous');
const lien = (u) => (/^https?:\/\//i.test(u || '') ? esc(u) : '');
const place = (t) => /^\s*Ici,/.test(t || '');
// Aucune promesse de santé ni de résultat, doublons retirés, phrase d'ouverture choisie, prix et durée hors de
// l'approche : la règle commune des 11 univers (commun/phrases.js), la même partout.
export { sansPromesse };

export function contexte(d) {
  const lu = lireNom(d);
  const mode = modeDe(d);
  return { ...lu, metier: metierAccorde(d, lu.genre), ini: initiales(d, lu), mode };
}
export function titre(d) { const c = contexte(d); return `${c.personne}${c.enseigne ? ', ' + c.enseigne : ''} · ${c.metier}${d.ville ? ' à ' + d.ville : ''}`; }
export function description(d) { return nettoyer(d).accroche || `${contexte(d).metier}${d.ville ? ' à ' + d.ville : ''}, sur rendez-vous.`; }

// Les nuances : un mot de partition (ou d'atelier, pour l'art-therapie) a cote de chaque titre.
const NUANCES = {
  son: { approche: 'dolce', seance: 'legato', tarifs: 'a tempo', apropos: 'cantabile', contact: 'da capo' },
  pigment: { approche: 'lavis', seance: 'mouillé sur mouillé', tarifs: 'au pinceau', apropos: 'nuancier', contact: 'dernière touche' },
};

function photo(role, classe = '', tailles = '100vw', charge = 'lazy') {
  const p = PHOTOS[role];
  if (!p) return '';
  return `<img class="${classe}" src="images/${p.nom}-900.webp" srcset="images/${p.nom}-900.webp 900w, images/${p.nom}-1600.webp 1600w" sizes="${tailles}" width="${p.l}" height="${p.h}" loading="${charge}" decoding="async" alt="">`;
}

// ---------- Figure de Chladni en SVG (repli sans JavaScript ni WebGL) ----------
// Lignes nodales de f = cos(n pi x) cos(m pi y) - s cos(m pi x) cos(n pi y), par carres marchants.
export function chladni(n, m, s = 1) { return (x, y) => Math.cos(n * Math.PI * x) * Math.cos(m * Math.PI * y) - s * Math.cos(m * Math.PI * x) * Math.cos(n * Math.PI * y); }
export function figureSvg(n, m, s, classe = 'figure') {
  const f = chladni(n, m, s), N = 72, pas = 1 / N, segs = [];
  const v = []; for (let j = 0; j <= N; j++) { v.push([]); for (let i = 0; i <= N; i++) v[j].push(f(i * pas, j * pas)); }
  const k = (a, b) => a / (a - b);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const a = v[j][i], b = v[j][i + 1], c = v[j + 1][i + 1], dd = v[j + 1][i];
    const pts = [];
    if ((a > 0) !== (b > 0)) pts.push([i + k(a, b), j]);
    if ((b > 0) !== (c > 0)) pts.push([i + 1, j + k(b, c)]);
    if ((c > 0) !== (dd > 0)) pts.push([i + 1 - k(c, dd), j + 1]);
    if ((dd > 0) !== (a > 0)) pts.push([i, j + 1 - k(dd, a)]);
    for (let q = 0; q + 1 < pts.length; q += 2) segs.push(pts[q], pts[q + 1]);
  }
  let dpath = '';
  for (let q = 0; q < segs.length; q += 2) dpath += `M${(segs[q][0] * 10).toFixed(0)} ${(segs[q][1] * 10).toFixed(0)}L${(segs[q + 1][0] * 10).toFixed(0)} ${(segs[q + 1][1] * 10).toFixed(0)}`;
  return `<svg class="${classe}" viewBox="0 0 ${N * 10} ${N * 10}" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"><path d="${dpath}"/></svg>`;
}

function entete(d, c) {
  return `
<header class="barre" id="barre">
  <a class="barre-nom" href="#accueil" aria-label="${esc(c.nom)}, retour en haut"><span class="barre-ini" aria-hidden="true">${esc(c.ini)}</span><span class="barre-texte">${esc(c.personne)}</span></a>
  <button class="son" id="son" type="button" aria-pressed="false"><span class="son-barres" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span class="son-texte">Son coupé</span></button>
  <a class="barre-rdv" href="#contact">Rendez&#8209;vous</a>
</header>`;
}

function accueil(d, c) {
  const long = c.personne.length > 24 ? 'nom-tres-long' : c.personne.length > 15 ? 'nom-long' : '';
  const lieu = [c.metier, d.ville].filter(Boolean).map((t, i) => (i ? `<span class="insecable">${fr(t).replace(/-/g, '\u2011')}</span>` : fr(t))).join(' <span aria-hidden="true">·</span> ');
  return `
<section class="accueil" id="accueil" aria-labelledby="nom" data-mode="${c.mode}">
  <div class="scene">
    <div class="plaque" id="plaque" aria-hidden="true">${c.mode === 'son' ? figureSvg(3, 5, 1, 'figure figure-fixe') : `<div class="lavis-fixe">${photo('lavis', 'lavis-photo', '100vw', 'eager')}</div>`}</div>
    <div class="voile" aria-hidden="true"></div>
    <div class="couche couche-0" data-couche="0">
      <p class="lieu">${lieu}</p>
      <h1 class="nom ${long}" id="nom">${fr(c.personne)}</h1>
      ${c.enseigne ? `<p class="enseigne">${fr(c.enseigne)}</p>` : ''}
      <div class="actions">
        <a class="bouton" href="#contact">Prendre rendez&#8209;vous</a>
        ${d.tel ? `<a class="lien-tel" href="${esc(d.telLien)}">${esc(d.tel)}</a>` : ''}
      </div>
    </div>
    ${sansPromesse(d.accroche) ? `<div class="couche couche-1" data-couche="1"><p class="accroche">${fr(sansPromesse(d.accroche))}</p></div>` : ''}
    <div class="couche couche-2" data-couche="2"><p class="fin-sequence">${fr(d.rdv || 'Sur rendez-vous')}${d.ville ? `, à ${fr(d.ville)}` : ''}.</p><a class="bouton" href="#contact">Prendre rendez&#8209;vous</a></div>
    <p class="invite" id="invite" aria-hidden="true">${c.mode === 'son' ? 'Touchez la plaque : le sable saute, puis retrouve sa figure.' : 'Touchez le papier : la couleur fleurit.'}</p>
    <p class="defiler" aria-hidden="true"><span></span>${c.mode === 'son' ? 'Faites défiler : le sable change de figure' : 'Faites défiler : les pigments se répondent'}</p>
  </div>
</section>`;
}

const choisirPhare = (d) => { const { phare, reste } = nettoyer(d).phrases; return { phare, reste }; };

function approche(d, c) {
  const { phare, reste } = choisirPhare(d);
  const apports = (d.apports || []).filter((a) => a && a.titre);
  return `
<section class="section approche" id="approche" aria-labelledby="approche-titre">
  <h2 class="titre" id="approche-titre">L’approche <i class="nuance">${NUANCES[c.mode].approche}</i></h2>
  ${phare ? `<p class="phare${phare.length > 150 ? ' phare-long' : ''}">${fr(phare)}</p>` : `<p class="phare emplacement">Ici, votre approche avec vos mots : ce que le son, la voix ou la création ouvrent chez les personnes que vous accompagnez.</p>`}
  <div class="cordes" id="cordes" data-mode="${c.mode}">
    <div class="cordes-fixes" aria-hidden="true">${[0, 1, 2, 3, 4, 5, 6].map((i) => `<span style="--i:${i}"></span>`).join('')}</div>
    <p class="cordes-invite" aria-hidden="true">${c.mode === 'son' ? 'Effleurez les cordes' : 'Passez le doigt : chaque trait vibre'}</p>
  </div>
  <div class="approche-suite">
    ${reste.length ? reste.map((p) => `<p>${fr(p)}</p>`).join('\n    ') : `<p class="emplacement">Ici, quelques lignes de plus : vos instruments, vos matières, ce qui rend vos séances uniques.</p>`}
  </div>
  ${apports.length ? `
  <div class="gamme" aria-label="Ce qu’on y trouve">
    <h3 class="gamme-titre">Ce qu’on y trouve</h3>
    <ul class="gamme-notes" role="list">${apports.map((a, i) => `
      <li style="--k:${i};--n:${apports.length}"><strong>${fr(a.titre)}</strong>${a.texte ? `<span>${fr(a.texte)}</span>` : ''}</li>`).join('')}
    </ul>
  </div>` : ''}
</section>`;
}

function seance(d, c) {
  const etapes = (d.etapes || []).filter((e) => e && e.titre).map((e) => ({ ...e, texte: sansPromesse(e.texte) || 'Ici, ce moment de la séance raconté avec vos mots.' }));
  const n = etapes.length;
  // l'enveloppe du son : attaque, tenue, extinction
  const phases = n === 1 ? ['entiere'] : n === 2 ? ['attaque', 'extinction'] : etapes.map((_, i) => (i === 0 ? 'attaque' : i === n - 1 ? 'extinction' : 'tenue'));
  const durees = [d.dureePremiere && `Première séance : ${d.dureePremiere}`, d.dureeSuivi && `Séances suivantes : ${d.dureeSuivi}`].filter(Boolean);
  const role = c.mode === 'son' ? 'bol' : 'eau';
  return `
<section class="section seance" id="seance" aria-labelledby="seance-titre">
  <h2 class="titre" id="seance-titre">${(d.etapes || []).some((e) => /^la s[ée]ance\.?$/i.test(String(e?.titre || '').trim())) ? 'Le mouvement' : 'La séance'} <i class="nuance">${NUANCES[c.mode].seance}</i></h2>
  <figure class="bol" id="bol" data-role="${role}">
    ${photo(role, 'bol-photo', '(min-width: 900px) 80vw, 100vw')}
    <figcaption class="bol-invite">${c.mode === 'son' ? 'Touchez le bol' : 'Touchez l’eau'}</figcaption>
  </figure>
  <div class="enveloppe">
    ${etapes.length ? etapes.map((e, i) => `
    <div class="mesure mesure-${phases[i]}">
      <svg class="trace" viewBox="0 0 1200 120" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d="${onde(phases[i])}" pathLength="1"/></svg>
      <h3>${fr(e.titre)}</h3>
      <p class="${place(e.texte) ? 'emplacement' : ''}">${fr(e.texte)}</p>
      ${e.duree ? `<p class="duree">${fr(e.duree)}</p>` : ''}
    </div>`).join('') : `<div class="mesure mesure-entiere"><p class="emplacement">Ici, le déroulé d’une séance.</p></div>`}
    ${durees.length ? `<p class="durees">${durees.map(fr).join(' · ')}</p>` : ''}
  </div>
</section>`;
}
// Une onde dont l'amplitude suit la phase (montee, tenue, extinction).
function onde(phase) {
  let p = 'M0 60';
  for (let x = 0; x <= 1200; x += 6) {
    const t = x / 1200;
    const env = phase === 'attaque' ? Math.min(1, t * 5) * (1 - t * .15) : phase === 'tenue' ? .85 : phase === 'extinction' ? .85 * Math.exp(-t * 3.2) : Math.min(1, t * 6) * Math.exp(-t * 2.2);
    p += `L${x} ${(60 - Math.sin(t * Math.PI * 2 * 14) * 48 * env).toFixed(1)}`;
  }
  return p;
}

function tarifs(d, c) {
  const t = (d.tarifs || []).filter((x) => x && x.nom);
  const vague = '<svg class="nt-onde" viewBox="0 0 400 24" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d="' + Array.from({ length: 101 }, (_, i) => `${i ? 'L' : 'M'}${i * 4} ${(12 - Math.sin(i * .5) * 7).toFixed(1)}`).join('') + '"/></svg>';
  const ligne = (nom, prix, vide) => `
      <li class="note-tenue${vide ? ' note-vide' : ''}"><span class="nt-nom${vide ? ' emplacement' : ''}">${nom}</span>${vague}<span class="nt-prix${vide ? ' emplacement' : ''}">${prix}</span></li>`;
  const durees = [d.dureePremiere && `Première séance : ${d.dureePremiere}`, d.dureeSuivi && `Suivi : ${d.dureeSuivi}`].filter(Boolean);
  return `
<section class="section tarifs" id="tarifs" aria-labelledby="tarifs-titre">
  <h2 class="titre" id="tarifs-titre">Tarifs <i class="nuance">${NUANCES[c.mode].tarifs}</i></h2>
  <ul class="notes" role="list">${t.length ? t.map((x) => ligne(fr(x.nom), fr(x.prix || 'Sur demande'), false)).join('') : ligne('Ici, vos séances', 'votre tarif', true) + ligne('Ici, un atelier ou un forfait', 'votre tarif', true)}
  </ul>
  ${durees.length ? `<p class="tarifs-note">${durees.map(fr).join(' · ')}</p>` : ''}
  ${d.paiement ? `<p class="tarifs-note">${fr(d.paiement)}</p>` : `<p class="tarifs-note emplacement">Ici, vos moyens de règlement.</p>`}
</section>`;
}

function apropos(d, c) {
  const paras = (d.apropos || []).filter(Boolean);
  return `
<section class="section apropos" id="apropos" aria-labelledby="apropos-titre">
  <figure class="disque" data-mode="${c.mode}" aria-label="Emplacement pour votre portrait">
    <div class="disque-sillons" aria-hidden="true"></div>
    <figcaption>Ici, votre portrait</figcaption>
  </figure>
  <div class="apropos-texte">
    <h2 class="titre" id="apropos-titre">${esc(c.prenom || c.personne)} <i class="nuance">${NUANCES[c.mode].apropos}</i></h2>
    ${paras.length ? paras.map((p) => `<p>${fr(p)}</p>`).join('\n    ') : `<p class="emplacement">Ici, votre parcours : ce qui vous a menée au son, à la voix ou à la création, vos formations, ce qui compte pour vous.</p>`}
    ${d.cerf ? `<p class="citation">${fr(d.cerf)}</p>` : ''}
  </div>
</section>`;
}

function contact(d, c) {
  const resa = /resalib\.fr/i.test(d.resalib || '') ? lien(d.resalib) : '';
  const fb = lien(d.facebook);
  const lieu = [d.ville, d.cp && `(${d.cp})`].filter(Boolean).join(' ');
  return `
<section class="section contact" id="contact" aria-labelledby="contact-titre">
  <h2 class="titre" id="contact-titre">Prendre rendez&#8209;vous <i class="nuance">${NUANCES[c.mode].contact}</i></h2>
  <p class="contact-mode">${fr(d.rdv || 'Sur rendez-vous')}${d.ville ? `, à ${fr(d.ville)}` : ''}.</p>
  ${d.tel ? `<a class="tel-geant" href="${esc(d.telLien)}"><span>${esc(d.tel)}</span><svg class="tel-onde" viewBox="0 0 600 30" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d="${Array.from({ length: 151 }, (_, i) => `${i ? 'L' : 'M'}${i * 4} ${(15 - Math.sin(i * .42) * 9 * Math.exp(-i / 70)).toFixed(1)}`).join('')}"/></svg></a>` : `<p class="tel-geant emplacement">Ici, votre numéro</p>`}
  <p class="contact-liens">
    ${d.tel ? `<a href="${esc(d.telLien)}">${esc(d.appeler || 'Appeler')}</a>` : ''}
    ${resa ? `<a href="${resa}" rel="noopener" target="_blank">Réserver en ligne</a>` : ''}
    ${fb ? `<a href="${fb}" rel="noopener" target="_blank">Facebook</a>` : ''}
  </p>
  <dl class="infos">
    <div><dt>Où</dt><dd>${lieu ? fr(lieu) : '<span class="emplacement">Ici, votre ville</span>'}<br><span class="emplacement">Ici, l’adresse du cabinet ou de l’atelier</span></dd></div>
    <div><dt>Quand</dt><dd><span class="emplacement">Ici, vos jours et horaires</span></dd></div>
    ${d.paiementListe ? `<div><dt>Règlement</dt><dd>${fr(d.paiementListe.charAt(0).toUpperCase() + d.paiementListe.slice(1))}</dd></div>` : ''}
  </dl>
</section>`;
}

function pied(d, c) {
  return `
<footer class="pied" id="pied">
  <p class="pied-nom">${fr(c.nom)}<span>${fr(c.metier)}${d.ville ? ' · ' + fr(d.ville) : ''}</span></p>
  <p class="pied-apercu">Aperçu préparé pour ${fr(c.nom)}. Textes, photos, couleurs : tout se modifie selon vos goûts.</p>
  <p class="pied-mesure">On peut partir de cet univers, en mêler deux, ou repartir d’une page blanche, jusqu’au site qui vous ressemble exactement.</p>
  <p class="pied-avert">${fr(d.avertissement || '')}</p>
  ${d.siret ? `<p class="pied-legal">SIRET ${esc(d.siret)}</p>` : ''}
  <a class="pied-haut" href="#accueil">Revenir en haut</a>
</footer>`;
}

export function rendre(d) {
  d = nettoyer(d);
  const c = contexte(d);
  return entete(d, c) + '\n<main id="contenu">' + accueil(d, c) + approche(d, c) + seance(d, c) + tarifs(d, c) + apropos(d, c) + contact(d, c) + '\n</main>' + pied(d, c);
}
