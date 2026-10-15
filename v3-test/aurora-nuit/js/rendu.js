// Aurora Nuit : rendu de la page depuis la fiche JSON d'un praticien.
// Le meme module sert dans le navigateur (adresse ?p=<dossier>) et dans node
// (batir.mjs ecrit la page par defaut en dur, lisible sans JavaScript).

const ENT = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s = '') => String(s ?? '').replace(/[&<>"']/g, (c) => ENT[c]);
// Typographie francaise : espace fine insecable avant : ; ! ? et dans les guillemets.
const fr = (s = '') => esc(s).replace(/ ([:;!?»])/g, '\u202f$1').replace(/« /g, '«\u202f').replace(/[\u2013\u2014]/g, ',').replace(/rendez-vous/g, 'rendez\u2011vous');
const lien = (u) => (/^https?:\/\//i.test(u || '') ? esc(u) : '');
const place = (t) => /^Ici,/.test((t || '').trim());

export function titre(d) {
  return `${d.nom} · ${d.metier}${d.ville ? ' à ' + d.ville : ''}`;
}
export function description(d) {
  return d.accroche || `${d.metier}${d.ville ? ' à ' + d.ville : ''}, sur rendez-vous.`;
}

// Mots du nom dans des span : la constellation lit leur position pour dessiner les lettres.
const motsNom = (nom) => esc(nom).split(/\s+/).map((m) => `<span class="mot">${m}</span>`).join(' ');

function entete(d) {
  return `
<header class="barre" id="barre">
  <a class="sceau" href="#accueil" aria-label="${esc(d.nom)}, retour en haut"><span>${esc(d.initiales || '')}</span></a>
  <nav class="barre-liens" aria-label="Sections">
    <a href="#approche">L’approche</a><a href="#seance">La séance</a><a href="#tarifs">Tarifs</a><a href="#apropos">À propos</a>
  </nav>
  <a class="pilule pilule-verre" href="#contact">Rendez-vous</a>
</header>`;
}

function accueil(d) {
  const lieu = [d.metier, d.ville].filter(Boolean).map(esc).join(' <i aria-hidden="true">✦</i> ');
  return `
<section class="accueil" id="accueil" aria-label="Accueil">
  <div class="accueil-centre">
    <p class="sur-titre">${lieu}</p>
    <h1 class="nom" id="nom">${motsNom(d.nom)}</h1>
    <p class="accroche">${fr(d.accroche)}</p>
    <div class="actions">
      ${d.tel ? `<a class="pilule pilule-claire" href="${esc(d.telLien)}"><span class="pilule-point" aria-hidden="true"></span>${esc(d.appeler || 'Appeler')} le ${esc(d.tel)}</a>` : ''}
      <a class="lien-lueur" href="#contact">Prendre rendez-vous</a>
    </div>
  </div>
  <a class="descendre" href="#approche" aria-label="Découvrir la suite"><span></span></a>
</section>`;
}

function enTete(num, nom, titreSection, id) {
  return `<p class="etiquette" aria-hidden="true"><span class="etiquette-num">${num}</span>${nom ? esc(nom) : ''}</p>
    <h2 class="titre" data-allume id="${id}-titre">${fr(titreSection)}</h2>`;
}

function approche(d, num) {
  const paras = (d.approche || []).filter(Boolean);
  let phare = d.conviction, reste = paras;
  if (!phare && paras.length) { phare = paras[0]; reste = paras.slice(1); }
  const apports = (d.apports || []).filter((a) => a && a.titre);
  return `
<section class="section approche" id="approche" aria-labelledby="approche-titre">
  <div class="cadre">
    ${enTete(num, '', 'L’approche', 'approche')}
    ${phare
      ? `<p class="phare" data-illumine>${fr(phare)}</p>`
      : `<p class="phare emplacement-texte">Ici, votre approche avec vos mots : ce qui vous anime, votre façon d’accompagner.</p>`}
    ${reste.length ? `<div class="colonnes">${reste.map((p) => `<p>${fr(p)}</p>`).join('')}</div>` : ''}
    ${apports.length ? `
    <h3 class="sous-titre">Au fil des séances</h3>
    <ul class="cartes" role="list">
      ${apports.map((a, i) => `<li class="carte" style="--i:${i}"><span class="carte-astre" aria-hidden="true"></span><h4>${fr(a.titre)}</h4><p>${fr(a.texte)}</p></li>`).join('')}
    </ul>` : ''}
  </div>
</section>`;
}

function seance(d, num) {
  const etapes = (d.etapes || []).filter((e) => e && e.titre);
  return `
<section class="section seance" id="seance" aria-labelledby="seance-titre">
  <div class="cadre">
    ${enTete(num, '', 'La séance', 'seance')}
    <div class="trajet">
    <span class="trajet-fil" aria-hidden="true"><span></span></span>
    <ol class="trajet-liste" role="list">
      ${etapes.map((e, i) => `
      <li class="pas${place(e.texte) ? ' pas-emplacement' : ''}">
        <span class="pas-astre" aria-hidden="true"></span>
        <p class="pas-num">${String(i + 1).padStart(2, '0')}</p>
        <h3>${fr(e.titre)}</h3>
        <p>${fr(e.texte)}</p>
        ${e.duree ? `<p class="pas-duree">${fr(e.duree)}</p>` : ''}
      </li>`).join('')}
    </ol>
    </div>
  </div>
</section>`;
}

function tarifs(d, num) {
  const t = (d.tarifs || []).filter((x) => x && x.nom);
  const durees = [
    d.dureePremiere && `Première séance : ${d.dureePremiere}`,
    d.dureeSuivi && `Séances de suivi : ${d.dureeSuivi}`,
  ].filter(Boolean);
  return `
<section class="section tarifs" id="tarifs" aria-labelledby="tarifs-titre">
  <div class="cadre tarifs-grille">
    <div class="tarifs-tete">
      ${enTete(num, '', 'Tarifs', 'tarifs')}
      ${d.paiement ? `<p class="note">${fr(d.paiement)}</p>` : ''}
    </div>
    <ul class="cartes cartes-tarifs" role="list">
      ${t.length ? t.map((x, i) => `
      <li class="carte carte-tarif" style="--i:${i}">
        <h3>${fr(x.nom)}</h3>
        <p class="prix">${fr(x.prix || 'Sur demande')}</p>
        ${durees.length ? `<ul class="durees" role="list">${durees.map((u) => `<li>${fr(u)}</li>`).join('')}</ul>` : ''}
      </li>`).join('') : `
      <li class="carte carte-tarif emplacement">
        <h3>Ici, vos séances</h3>
        <p class="prix">Vos tarifs</p>
        <p>La durée de chaque séance et ce qu’elle comprend.</p>
      </li>`}
    </ul>
  </div>
</section>`;
}

function apropos(d, num) {
  const paras = (d.apropos || []).filter(Boolean);
  return `
<section class="section apropos" id="apropos" aria-labelledby="apropos-titre">
  <div class="cadre apropos-grille">
    <figure class="lune" aria-label="Emplacement pour votre portrait">
      <div class="lune-disque" aria-hidden="true"><span class="lune-halo"></span></div>
      <figcaption>Ici, votre portrait</figcaption>
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
    ${d.tel ? `<a class="tel-geant" href="${esc(d.telLien)}"><span class="tel-texte">${esc(d.tel)}</span></a>` : `<p class="tel-geant emplacement-texte">Ici, votre numéro</p>`}
    <div class="actions actions-contact">
      ${d.tel ? `<a class="pilule pilule-claire" href="${esc(d.telLien)}"><span class="pilule-point" aria-hidden="true"></span>${esc(d.appeler || 'Appeler')}</a>` : ''}
      ${resa ? `<a class="pilule pilule-verre" href="${resa}" rel="noopener" target="_blank">Réserver en ligne</a>` : ''}
      ${fb ? `<a class="pilule pilule-verre" href="${fb}" rel="noopener" target="_blank">Facebook</a>` : ''}
    </div>
    <dl class="infos">
      <div><dt>Où</dt><dd>${lieu ? fr(lieu) : '<span class="emplacement-texte">Ici, votre ville</span>'}<br><span class="emplacement-texte">Ici, l’adresse et l’accès</span></dd></div>
      <div><dt>Quand</dt><dd><span class="emplacement-texte">Ici, vos jours et horaires</span></dd></div>
      ${d.paiementListe ? `<div><dt>Règlement</dt><dd>${fr(d.paiementListe.charAt(0).toUpperCase() + d.paiementListe.slice(1))}</dd></div>` : ''}
    </dl>
  </div>
</section>`;
}

function pied(d) {
  return `
<footer class="pied" id="pied">
  <div class="cadre">
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
