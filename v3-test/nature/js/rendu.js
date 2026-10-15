// Nature : rendu de la page depuis la fiche JSON d'un praticien.
// Meme module dans le navigateur (?p=<dossier>) et dans node (batir.mjs ecrit la
// page par defaut en dur : elle se lit sans JavaScript).
import { graine, fougere, rameau, feuille, fleurette } from './botanique.js';

const ENT = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s = '') => String(s ?? '').replace(/[&<>"']/g, (c) => ENT[c]);
const fr = (s = '') => esc(s).replace(/ ([:;!?»])/g, '\u202f$1').replace(/« /g, '«\u202f').replace(/[\u2013\u2014]/g, ',').replace(/rendez-vous/g, 'rendez\u2011vous');
const lien = (u) => (/^https?:\/\//i.test(u || '') ? esc(u) : '');
const place = (t) => /^Ici,/.test((t || '').trim());

export function titre(d) { return `${d.nom} · ${d.metier}${d.ville ? ' à ' + d.ville : ''}`; }
export function description(d) { return d.accroche || `${d.metier}${d.ville ? ' à ' + d.ville : ''}, sur rendez-vous.`; }

function entete(d) {
  return `
<header class="barre" id="barre">
  <a class="sceau" href="#accueil" aria-label="${esc(d.nom)}, retour en haut">${fleurette(graine(d.nom) + 3, { taille: 40 })}<span>${esc(d.initiales || '')}</span></a>
  <nav class="barre-liens" aria-label="Sections">
    <a href="#approche">L’approche</a><a href="#seance">La séance</a><a href="#tarifs">Tarifs</a><a href="#apropos">À propos</a>
  </nav>
  <a class="pilule pilule-sombre" href="#contact">Rendez-vous</a>
</header>`;
}

// Fond d'accueil sans WebGL ni JavaScript : des collines et des herbes en SVG.
function collines(seed) {
  let herbes = '';
  const r = (() => { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
  for (let i = 0; i < 90; i++) {
    const x = r() * 1440, h = 40 + r() * 120, c = (r() - .5) * 60;
    herbes += `M${Math.round(x)} 400Q${Math.round(x + c * .3)} ${Math.round(400 - h * .6)} ${Math.round(x + c)} ${Math.round(400 - h)}Q${Math.round(x + c * .3 + 6)} ${Math.round(400 - h * .55)} ${Math.round(x + 9)} 400Z`;
  }
  return `<svg class="collines" viewBox="0 0 1440 400" preserveAspectRatio="none" aria-hidden="true" focusable="false">
    <path d="M0 170C220 120 420 150 640 130S1100 90 1440 140V400H0Z" fill="#cfe0b4"/>
    <path d="M0 240C260 200 520 230 760 205S1180 180 1440 220V400H0Z" fill="#a9c98e"/>
    <path d="M0 310C300 280 600 300 900 285S1260 270 1440 300V400H0Z" fill="#7faa6a"/>
    <path d="${herbes}" fill="#5b8f4c"/>
  </svg>`;
}

function accueil(d) {
  const lieu = [d.metier, d.ville].filter(Boolean).map(esc).join(' <i aria-hidden="true">·</i> ');
  return `
<section class="accueil" id="accueil" aria-label="Accueil">
  <div class="jour" aria-hidden="true"><span class="soleil"></span><span class="rayons"></span><span class="rayons rayons-2"></span></div>
  <div class="brume" aria-hidden="true"></div>
  ${collines(graine(d.dossier || d.nom))}
  <div class="accueil-texte">
    <p class="sur-titre"><span class="pastille" aria-hidden="true"></span>${lieu}</p>
    <h1 class="nom" id="nom" data-pousse>${esc(d.nom)}</h1>
    <p class="accroche">${fr(d.accroche)}</p>
    <div class="actions">
      ${d.tel ? `<a class="pilule pilule-sombre" href="${esc(d.telLien)}">${esc(d.appeler || 'Appeler')} le ${esc(d.tel)}</a>` : ''}
      <a class="pilule pilule-claire" href="#contact">Prendre rendez-vous</a>
    </div>
  </div>
  <div class="prairie-place" data-place="accueil" aria-hidden="true"></div>
  <a class="souffle" href="#approche" aria-label="Découvrir la suite"><span class="souffle-rond" aria-hidden="true"></span><span class="souffle-mots" aria-hidden="true"><span>Inspirez</span><span>Expirez</span></span></a>
</section>`;
}

function enTete(num, nom, titreSection, id) {
  return `<p class="etiquette" aria-hidden="true"><span class="etiquette-num">${num}</span>${nom ? esc(nom) : ''}</p>
    <h2 class="titre" data-respire id="${id}-titre">${fr(titreSection)}</h2>`;
}

function approche(d, num) {
  const paras = (d.approche || []).filter(Boolean);
  let phare = d.conviction, reste = paras;
  if (!phare && paras.length) { phare = paras[0]; reste = paras.slice(1); }
  const apports = (d.apports || []).filter((a) => a && a.titre);
  const s = graine(d.nom + 'approche');
  return `
<section class="section approche" id="approche" aria-labelledby="approche-titre">
  <div class="cadre approche-grille">
    <div class="approche-texte">
      ${enTete(num, '', 'L’approche', 'approche')}
      ${phare ? `<p class="phare" data-mots>${fr(phare)}</p>` : `<p class="phare emplacement-texte">Ici, votre approche avec vos mots : ce qui vous anime, votre façon d’accompagner.</p>`}
      ${reste.map((p) => `<p class="corps">${fr(p)}</p>`).join('')}
    </div>
    <div class="approche-plante" aria-hidden="true">${fougere(s, { classe: 'fougere dessin' })}</div>
  </div>
  ${apports.length ? `
  <div class="cadre">
    <h3 class="sous-titre">Au fil des séances</h3>
    <ul class="cartes" role="list">
      ${apports.map((a, i) => `<li class="carte" style="--i:${i}">${feuille(s + i * 17, i % 4)}<h4>${fr(a.titre)}</h4><p>${fr(a.texte)}</p></li>`).join('')}
    </ul>
  </div>` : ''}
</section>`;
}

function seance(d, num) {
  const etapes = (d.etapes || []).filter((e) => e && e.titre);
  const s = graine(d.nom + 'seance');
  return `
<section class="section seance" id="seance" aria-labelledby="seance-titre">
  <div class="cadre deux-col">
    <div class="col-tete">
      ${enTete(num, '', 'La séance', 'seance')}
      <div class="col-plante" aria-hidden="true">${rameau(s + 3, { largeur: 140, hauteur: 300, feuilles: 9, classe: 'rameau dessin' })}</div>
    </div>
    <div class="tige-boite">
      <svg class="tige-svg" aria-hidden="true" focusable="false" preserveAspectRatio="none"><path class="tige-trait" pathLength="1"/></svg>
      <ol class="etapes" role="list">
        ${etapes.map((e, i) => `
        <li class="etape${place(e.texte) ? ' etape-emplacement' : ''}">
          <span class="bourgeon" aria-hidden="true">${feuille(s + i * 31, (i + 1) % 3)}</span>
          <p class="etape-num">${String(i + 1).padStart(2, '0')}</p>
          <h3>${fr(e.titre)}</h3>
          <p>${fr(e.texte)}</p>
          ${e.duree ? `<p class="etape-duree">${fr(e.duree)}</p>` : ''}
        </li>`).join('')}
      </ol>
    </div>
  </div>
</section>`;
}

function tarifs(d, num) {
  const t = (d.tarifs || []).filter((x) => x && x.nom);
  const durees = [d.dureePremiere && `Première séance : ${d.dureePremiere}`, d.dureeSuivi && `Séances de suivi : ${d.dureeSuivi}`].filter(Boolean);
  const s = graine(d.nom + 'tarifs');
  const etiquette = (x, i, vide) => `
      <li class="herbier${vide ? ' emplacement' : ''}" style="--r:${[-1.2, .9, -.5, 1.3][i % 4]}deg">
        <span class="scotch" aria-hidden="true"></span>
        <div class="herbier-plante" aria-hidden="true">${rameau(s + i * 13, { largeur: 120, hauteur: 220, feuilles: 7, classe: 'rameau dessin' })}</div>
        <div class="herbier-texte">
          <p class="herbier-num">N° ${String(i + 1).padStart(2, '0')}</p>
          <h3>${vide ? 'Ici, vos séances' : fr(x.nom)}</h3>
          <p class="prix">${vide ? 'Vos tarifs' : fr(x.prix || 'Sur demande')}</p>
          ${vide ? '<p class="herbier-note">La durée de chaque séance et ce qu’elle comprend.</p>' : durees.length ? `<ul class="durees" role="list">${durees.map((u) => `<li>${fr(u)}</li>`).join('')}</ul>` : ''}
        </div>
      </li>`;
  return `
<section class="section tarifs" id="tarifs" aria-labelledby="tarifs-titre">
  <div class="cadre deux-col">
    <div class="col-tete">
      ${enTete(num, '', 'Tarifs', 'tarifs')}
      ${d.paiement ? `<p class="note">${fr(d.paiement)}</p>` : ''}
    </div>
    <ul class="herbiers" role="list">${t.length ? t.map((x, i) => etiquette(x, i, false)).join('') : etiquette(null, 0, true)}
    </ul>
  </div>
</section>`;
}

function apropos(d, num) {
  const paras = (d.apropos || []).filter(Boolean);
  const s = graine(d.nom + 'apropos');
  return `
<section class="section apropos" id="apropos" aria-labelledby="apropos-titre">
  <div class="cadre apropos-grille">
    <figure class="arche" aria-label="Emplacement pour votre portrait">
      <div class="arche-fenetre" aria-hidden="true"><span class="arche-lumiere"></span></div>
      <div class="arche-plante" aria-hidden="true">${rameau(s, { largeur: 150, hauteur: 420, feuilles: 11, classe: 'rameau dessin' })}</div>
      <figcaption>${fleurette(s + 5, { taille: 36 })}<span>Ici, votre portrait</span></figcaption>
    </figure>
    <div class="apropos-texte">
      ${enTete(num, 'À propos', d.nom, 'apropos')}
      ${paras.length ? paras.map((p) => `<p>${fr(p)}</p>`).join('') : `<p class="emplacement-texte">Ici, votre parcours en quelques lignes : votre chemin jusqu’à ce métier, vos formations, ce qui compte pour vous.</p>`}
      ${d.cerf ? `<blockquote class="citation"><p>${fr(d.cerf)}</p></blockquote>` : ''}
    </div>
  </div>
</section>`;
}

function contact(d, num) {
  const resa = /resalib\.fr/i.test(d.resalib || '') ? lien(d.resalib) : '';
  const fb = lien(d.facebook);
  const lieu = [d.ville, d.cp && `(${d.cp})`].filter(Boolean).join(' ');
  return `
<section class="section contact" id="contact" aria-labelledby="contact-titre">
  <div class="cadre contact-cadre">
    ${enTete(num, 'Contact', 'Prendre rendez-vous', 'contact')}
    <p class="contact-rdv">${fr(d.rdv || 'Sur rendez-vous')}</p>
    ${d.tel ? `<a class="tel-geant" href="${esc(d.telLien)}">${esc(d.tel)}</a>` : `<p class="tel-geant emplacement-texte">Ici, votre numéro</p>`}
    <div class="actions">
      ${d.tel ? `<a class="pilule pilule-sombre" href="${esc(d.telLien)}">${esc(d.appeler || 'Appeler')}</a>` : ''}
      ${resa ? `<a class="pilule pilule-claire" href="${resa}" rel="noopener" target="_blank">Réserver en ligne</a>` : ''}
      ${fb ? `<a class="pilule pilule-claire" href="${fb}" rel="noopener" target="_blank">Facebook</a>` : ''}
    </div>
    <dl class="infos">
      <div><dt>Où</dt><dd>${lieu ? fr(lieu) : '<span class="emplacement-texte">Ici, votre ville</span>'}<br><span class="emplacement-texte">Ici, l’adresse et l’accès</span></dd></div>
      <div><dt>Quand</dt><dd><span class="emplacement-texte">Ici, vos jours et horaires</span></dd></div>
      ${d.paiementListe ? `<div><dt>Règlement</dt><dd>${fr(d.paiementListe.charAt(0).toUpperCase() + d.paiementListe.slice(1))}</dd></div>` : ''}
    </dl>
  </div>
  <div class="prairie-place prairie-bas" data-place="contact" aria-hidden="true">${collines(graine(d.nom) + 9)}</div>
</section>`;
}

function pied(d) {
  return `
<footer class="pied" id="pied">
  <div class="cadre">
    ${fleurette(graine(d.nom) + 11, { taille: 44 })}
    <p class="pied-nom">${esc(d.nom)}<span>${esc(d.metier)}${d.ville ? ' · ' + esc(d.ville) : ''}</span></p>
    <p class="pied-avert">${fr(d.avertissement)}</p>
    <p class="pied-apercu">Aperçu préparé pour ${esc(d.nom)}. Textes, photos, couleurs\u202f: tout se modifie selon vos goûts.</p>
    ${d.siret ? `<p class="pied-legal">SIRET ${esc(d.siret)}</p>` : ''}
    <a class="pied-haut" href="#accueil">Revenir en haut</a>
  </div>
</footer>`;
}

export function rendre(d) {
  let n = 0;
  const num = () => String(++n).padStart(2, '0');
  return entete(d) + '\n<main id="contenu">' + accueil(d) + approche(d, num()) + seance(d, num()) + tarifs(d, num()) + apropos(d, num()) + contact(d, num()) + '\n</main>' + pied(d);
}
