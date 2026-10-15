/* FLUIDE : le contenu de la page, rendu depuis la fiche JSON du praticien.
   Module pur : le navigateur l'utilise pour ?p=<dossier>, batir.mjs sous node
   pour ecrire la page lisible sans JavaScript. Rien n'est invente : un champ
   vide devient un emplacement qui dit ce qui viendra.

   Les elements [data-goutte] sont des ancres : le fond WebGL y pose une goutte
   (rayon = la moitie de la largeur de l'ancre multipliee par la valeur). */

const TIRETS = /\s*[\u2013\u2014]\s*/g;
export const net = (s) => String(s ?? '').replace(TIRETS, ', ').replace(/\s+/g, ' ').trim();
export const esc = (s) => net(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const liste = (a) => (Array.isArray(a) ? a.map(net).filter(Boolean) : []);
const deux = (n) => String(n).padStart(2, '0');

function lieu(d) {
  const v = net(d.ville);
  if (!v) return '';
  return d.cp ? `${v} (${net(d.cp)})` : v;
}
function lienEnLigne(url) {
  try {
    const h = new URL(url).hostname.replace(/^www\./, '');
    if (/resalib/.test(h)) return 'Réserver en ligne sur Resalib';
    return `Ma fiche sur ${h}`;
  } catch { return null; }
}
const FLECHE = '<svg class="fleche" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const COCHE = '<svg class="coche" viewBox="0 0 16 16" aria-hidden="true"><path d="m4 8.4 2.6 2.6L12 5.6" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';

export function rendre(d) {
  const nom = esc(d.nom);
  const metier = esc(d.metier);
  const ville = esc(net(d.ville));
  const ou = esc(lieu(d));
  const tel = esc(d.tel);
  const telLien = esc(d.telLien);
  const approche = liste(d.approche);
  const apropos = liste(d.apropos);
  const apports = (d.apports || []).filter((a) => a && a.titre);
  const etapes = (d.etapes || []).filter((e) => e && e.titre);
  const tarifs = (d.tarifs || []).filter((t) => t && t.nom);
  const enLigne = d.resalib ? lienEnLigne(d.resalib) : null;
  const mots = net(d.nom).split(' ');
  const infos = [esc(d.rdv || 'Sur rendez-vous')];
  if (d.dureePremiere) infos.push(`Première séance : ${esc(d.dureePremiere)}`);
  if (d.paiementListe) { const p = net(d.paiementListe); infos.push(esc(p.charAt(0).toUpperCase() + p.slice(1))); }

  const accueil = `
<section class="heros" id="accueil" data-teinte="peche">
  <div class="heros-texte">
    <p class="pastille"><span class="pastille-point" aria-hidden="true"></span>${metier}${ville ? `<span class="pastille-sep" aria-hidden="true"></span>${ville}` : ''}</p>
    <h1 class="heros-titre">${mots.map((m, i) => `<span class="heros-mot" style="--i:${i}">${esc(m)}</span>`).join(' ')}</h1>
    <p class="heros-accroche">${esc(d.accroche)}</p>
    <div class="heros-actions">
      <a class="bouton bouton-plein" href="${telLien}">Appeler <span class="bouton-num">${tel}</span></a>
      <a class="bouton bouton-verre" href="#seance">Découvrir la séance ${FLECHE}</a>
    </div>
    <ul class="heros-infos">${infos.map((i) => `<li>${COCHE}${i}</li>`).join('')}</ul>
  </div>
  <div class="heros-visuel" aria-hidden="true">
    <span class="ancre ancre-mere" data-goutte="1"></span>
    <span class="ancre ancre-sat ancre-sat-1" data-goutte="1"></span>
    <span class="ancre ancre-sat ancre-sat-2" data-goutte="1"></span>
  </div>
</section>`;

  const lead = approche[0];
  const suite = approche.slice(1);
  const sectionApproche = `
<section class="bloc" id="approche" data-teinte="menthe">
  <div class="bloc-in">
    <span class="deco-goutte" data-goutte="1" aria-hidden="true"></span>
    <p class="etiquette rev">L'approche</p>
    <h2 class="titre rev">L'approche, <em>en quelques mots</em></h2>
    ${lead ? `<p class="lead rev">${esc(lead)}</p>` : `<p class="emplacement rev">Ici, votre approche : ce qui vous guide dans votre métier, avec vos mots.</p>`}
    ${suite.length ? `<div class="colonnes">${suite.map((p, i) => `<p class="rev" style="--d:${i * 0.08}s">${esc(p)}</p>`).join('')}</div>` : ''}
    ${d.conviction ? `<figure class="citation rev"><blockquote><p>${esc(d.conviction)}</p></blockquote><figcaption>${nom}</figcaption></figure>` : ''}
    ${apports.length ? `<ul class="apports">${apports.map((a, i) => `<li class="carte apport rev" style="--d:${i * 0.07}s"><span class="apport-icone" data-goutte="0.9">${deux(i + 1)}</span><h3>${esc(a.titre)}</h3><p>${esc(a.texte)}</p></li>`).join('')}</ul>` : ''}
  </div>
</section>`;

  const sectionSeance = `
<section class="bloc" id="seance" data-teinte="lilas">
  <div class="bloc-in seance-grille">
    <div class="seance-tete">
      <p class="etiquette rev">La séance</p>
      <h2 class="titre rev">Pas à pas, <em>à votre rythme</em></h2>
      <p class="seance-note rev">${esc(d.avertissement)}</p>
    </div>
    <ol class="etapes">
      ${etapes.map((e, i) => `<li class="etape rev${d.etapesEmplacement ? ' etape-vide' : ''}" style="--d:${i * 0.06}s">
        <span class="etape-num" data-goutte="1">${deux(i + 1)}</span>
        <div class="etape-corps carte">
          <h3>${esc(e.titre)}</h3>
          <p${d.etapesEmplacement ? ' class="emplacement-texte"' : ''}>${esc(e.texte)}</p>
          ${e.duree ? `<p class="puce">${esc(e.duree)}</p>` : ''}
        </div>
      </li>`).join('\n      ')}
    </ol>
  </div>
</section>`;

  const details = [];
  if (d.dureePremiere) details.push(`<li>${COCHE}Première séance : ${esc(d.dureePremiere)}</li>`);
  if (d.dureeSuivi) details.push(`<li>${COCHE}Séances de suivi : ${esc(d.dureeSuivi)}</li>`);
  const cartesPrix = tarifs.length
    ? tarifs.map((t, i) => `<article class="carte carte-prix rev" style="--d:${i * 0.08}s">${i === 0 ? '<span class="ancre-prix" data-goutte="1" aria-hidden="true"></span>' : ''}
        <p class="prix-nom">${esc(t.nom)}</p>
        <p class="prix">${esc(t.prix)}</p>
        ${i === 0 && details.length ? `<ul class="prix-details">${details.join('')}</ul>` : ''}
      </article>`).join('')
    : `<article class="carte carte-prix carte-vide rev"><span class="ancre-prix" data-goutte="1" aria-hidden="true"></span><p class="emplacement">Ici, vos tarifs et la durée de vos séances.</p></article>`;

  const sectionTarifs = `
<section class="bloc" id="tarifs" data-teinte="beurre">
  <div class="bloc-in">
    <p class="etiquette rev">Tarifs</p>
    <h2 class="titre rev">Tarifs <em>et durées</em></h2>
    <div class="tarifs-grille">
      ${cartesPrix}
      <article class="carte carte-info rev" style="--d:0.16s">
        <p class="info-titre">Bon à savoir</p>
        <ul class="prix-details">
          <li>${COCHE}${esc(d.rdv || 'Sur rendez-vous')}</li>
          ${d.paiement ? `<li>${COCHE}${esc(d.paiement)}</li>` : ''}
          ${!tarifs.length && details.length ? details.join('') : ''}
        </ul>
        <p class="info-avert">${esc(d.avertissement)}</p>
      </article>
    </div>
  </div>
</section>`;

  const sectionApropos = `
<section class="bloc" id="apropos" data-teinte="rose">
  <div class="bloc-in apropos-grille">
    <figure class="portrait carte rev">
      <span class="portrait-ancre" data-goutte="1" aria-hidden="true"></span>
      <span class="portrait-t">Ici, votre portrait</span>
    </figure>
    <div class="apropos-texte">
      <p class="etiquette rev">À propos</p>
      <h2 class="titre rev">${nom}</h2>
      ${apropos.length ? apropos.map((p, i) => `<p class="rev" style="--d:${i * 0.05}s">${esc(p)}</p>`).join('\n      ') : `<p class="emplacement rev">Ici, votre parcours en quelques lignes : d'où vous venez, ce qui vous a mené à ce métier.</p>`}
      ${d.cerf ? `<p class="cerf rev">${esc(d.cerf)}</p>` : ''}
    </div>
  </div>
</section>`;

  const liens = [];
  if (enLigne) liens.push(`<a class="bouton bouton-verre" href="${esc(d.resalib)}" rel="noopener" target="_blank">${esc(enLigne)} ${FLECHE}</a>`);
  if (d.facebook) liens.push(`<a class="bouton bouton-verre" href="${esc(d.facebook)}" rel="noopener" target="_blank">Facebook ${FLECHE}</a>`);

  const sectionContact = `
<section class="bloc" id="contact" data-teinte="ciel">
  <div class="bloc-in">
    <div class="contact-carte rev">
      <p class="etiquette">Contact</p>
      <h2 class="titre">Prendre <em>rendez-vous</em></h2>
      <p class="contact-rdv">${esc(d.rdv || 'Sur rendez-vous')}${ville ? `, à ${ville}` : ''}.</p>
      <span class="contact-halo" data-goutte="1" aria-hidden="true"></span>
      <div class="contact-tel">
        <a class="tel" href="${telLien}"><span class="tel-l">Appeler</span>${tel}</a>
      </div>
      ${liens.length ? `<div class="contact-liens">${liens.join('')}</div>` : ''}
      <p class="emplacement">Ici, l'adresse de votre cabinet et un plan pour venir.</p>
    </div>
  </div>
</section>`;

  const pied = `
<footer class="pied">
  <div class="pied-in">
    <div>
      <p class="pied-nom">${nom}</p>
      <p class="pied-meta">${[metier, ou].filter(Boolean).join(' · ')}${d.siret ? ` · SIRET ${esc(d.siret)}` : ''}</p>
    </div>
    <p class="pied-avert">${esc(d.avertissement)}</p>
    <p class="apercu">Aperçu préparé pour ${nom}. Textes, photos, couleurs : tout se modifie selon vos goûts.</p>
  </div>
</footer>`;

  return {
    titre: `${net(d.nom)}, ${net(d.metier)}${d.ville ? ' à ' + net(d.ville) : ''}`,
    description: net(d.accroche),
    html: [accueil, sectionApproche, sectionSeance, sectionTarifs, sectionApropos, sectionContact].join('\n'),
    pied,
    entete: { nom, tel, telLien, initiales: esc(d.initiales || mots.map((m) => m[0]).join('').slice(0, 2)) }
  };
}
