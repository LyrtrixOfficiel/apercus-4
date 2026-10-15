/* IMMERSION : le contenu de la page, rendu depuis la fiche JSON du praticien.
   Module pur (aucun acces au document) : le navigateur l'utilise quand
   l'adresse porte ?p=<dossier>, et batir.mjs l'utilise sous node pour ecrire
   la page lisible sans JavaScript. Rien n'est invente : un champ vide devient
   un emplacement qui dit ce qui viendra. */

const TIRETS = /\s*[\u2013\u2014]\s*/g;
export const net = (s) => String(s ?? '').replace(TIRETS, ', ').replace(/\s+/g, ' ').trim();
export const esc = (s) => net(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const liste = (a) => (Array.isArray(a) ? a.map(net).filter(Boolean) : []);

export function prenom(d) {
  return net(d.nom).split(' ')[0] || net(d.nom);
}

function lieu(d) {
  const v = net(d.ville);
  if (!v) return '';
  return d.cp ? `${v} (${net(d.cp)})` : v;
}

function lienEnLigne(url) {
  try {
    const h = new URL(url).hostname.replace(/^www\./, '');
    if (/resalib/.test(h)) return { libelle: 'Réserver en ligne sur Resalib', court: 'Resalib' };
    return { libelle: `Ma fiche sur ${h}`, court: h };
  } catch { return null; }
}

/* Les sections, dans l'ordre. data-monde dit quel monde 3D les habite. */
export function rendre(d) {
  const nom = esc(d.nom);
  const mots = net(d.nom).split(' ');
  const metier = esc(d.metier);
  const ou = esc(lieu(d));
  const tel = esc(d.tel);
  const telLien = esc(d.telLien);
  const approche = liste(d.approche);
  const apropos = liste(d.apropos);
  const apports = (d.apports || []).filter((a) => a && a.titre);
  const etapes = (d.etapes || []).filter((e) => e && e.titre);
  const tarifs = (d.tarifs || []).filter((t) => t && t.nom);
  const enLigne = d.resalib ? lienEnLigne(d.resalib) : null;
  const kicker = [metier, ou].filter(Boolean).map((t) => `<span>${t}</span>`).join('<span class="sep" aria-hidden="true"></span>');

  const accueil = `
<section class="sc sc-accueil" id="accueil" data-monde="cristal" data-nom="Accueil">
  <div class="sc-in">
    <p class="kicker mono">${kicker}</p>
    <h1 class="nom" aria-label="${nom}">${mots.map((m) => `<span class="ligne"><span class="mot">${esc(m)}</span></span>`).join('')}</h1>
    <p class="accroche">${esc(d.accroche)}</p>
    <div class="actions">
      <a class="btn btn-plein" href="${telLien}"><span class="btn-t">Appeler</span><span class="btn-n">${tel}</span></a>
      <a class="btn btn-fil" href="#contact">Prendre rendez-vous</a>
    </div>
  </div>
  <p class="defiler mono" aria-hidden="true"><span class="defiler-trait"></span>Défiler pour entrer</p>
</section>`;

  const blocApproche = approche.length
    ? approche.map((p, i) => `<p${i === 0 ? ' class="chapo"' : ''}>${esc(p)}</p>`).join('\n      ')
    : `<p class="emplacement">Ici, votre approche : ce qui vous guide dans votre métier, avec vos mots.</p>`;

  const sectionApproche = `
<section class="sc sc-approche" id="approche" data-monde="eau" data-nom="L'approche">
  <div class="sc-in panneau">
    <p class="etiquette mono"><span class="num"></span>L'approche</p>
    <h2 class="titre">Un temps pour <em>soi</em>, à la surface du calme</h2>
    <div class="texte">
      ${blocApproche}
    </div>
  </div>
  ${d.conviction ? `<figure class="citation panneau"><blockquote><p>${esc(d.conviction)}</p></blockquote><figcaption class="mono">${nom}</figcaption></figure>` : ''}
  ${apports.length ? `<div class="sc-in panneau apports-bloc">
    <p class="etiquette mono">Les chemins possibles</p>
    <ul class="apports">
      ${apports.map((a, i) => `<li class="apport"><span class="apport-n mono">${String(i + 1).padStart(2, '0')}</span><h3>${esc(a.titre)}</h3><p>${esc(a.texte)}</p></li>`).join('\n      ')}
    </ul>
  </div>` : ''}
</section>`;

  const sectionSeance = `
<section class="sc sc-seance" id="seance" data-monde="galets" data-nom="La séance">
  <div class="sc-in panneau entete-seance">
    <p class="etiquette mono"><span class="num"></span>La séance</p>
    <h2 class="titre">Pas à pas, <em>à votre rythme</em></h2>
  </div>
  <ol class="etapes">
    ${etapes.map((e, i) => `<li class="etape panneau${d.etapesEmplacement ? ' etape-vide' : ''}" data-etape="${i}">
      <span class="etape-n mono">${String(i + 1).padStart(2, '0')} / ${String(etapes.length).padStart(2, '0')}</span>
      <h3>${esc(e.titre)}</h3>
      <p${d.etapesEmplacement ? ' class="emplacement"' : ''}>${esc(e.texte)}</p>
      ${e.duree ? `<p class="duree mono">${esc(e.duree)}</p>` : ''}
    </li>`).join('\n    ')}
  </ol>
</section>`;

  const lignesTarifs = tarifs.map((t) => `<li class="tarif"><span class="tarif-nom">${esc(t.nom)}</span><span class="tarif-pointilles" aria-hidden="true"></span><span class="tarif-prix">${esc(t.prix)}</span></li>`);
  if (d.dureePremiere) lignesTarifs.push(`<li class="tarif tarif-duree"><span class="tarif-nom">Première séance</span><span class="tarif-pointilles" aria-hidden="true"></span><span class="tarif-prix">${esc(d.dureePremiere)}</span></li>`);
  if (d.dureeSuivi) lignesTarifs.push(`<li class="tarif tarif-duree"><span class="tarif-nom">Séances de suivi</span><span class="tarif-pointilles" aria-hidden="true"></span><span class="tarif-prix">${esc(d.dureeSuivi)}</span></li>`);

  const sectionTarifs = `
<section class="sc sc-tarifs" id="tarifs" data-monde="galets" data-nom="Tarifs">
  <div class="sc-in panneau">
    <p class="etiquette mono"><span class="num"></span>Tarifs</p>
    <h2 class="titre">Tarifs <em>et durées</em></h2>
    ${lignesTarifs.length ? `<ul class="tarifs">${lignesTarifs.join('')}</ul>` : `<p class="emplacement">Ici, vos tarifs et la durée de vos séances.</p>`}
    ${d.paiement ? `<p class="paiement">${esc(d.paiement)}</p>` : ''}
    <p class="avert">${esc(d.avertissement)}</p>
  </div>
</section>`;

  const blocApropos = apropos.length
    ? apropos.map((p) => `<p>${esc(p)}</p>`).join('\n      ')
    : `<p class="emplacement">Ici, votre parcours en quelques lignes : d'où vous venez, ce qui vous a mené à ce métier.</p>`;

  const sectionApropos = `
<section class="sc sc-apropos" id="apropos" data-monde="brume" data-nom="À propos">
  <div class="scene-nom" aria-hidden="true"><p class="scene-nom-t">${esc(prenom(d))}</p></div>
  <div class="sc-in panneau">
    <p class="etiquette mono"><span class="num"></span>À propos</p>
    <h2 class="titre">${nom}</h2>
    <div class="apropos-grille">
      <figure class="portrait"><div class="portrait-cadre"><span class="portrait-t">Ici, votre portrait</span></div></figure>
      <div class="texte">
      ${blocApropos}
      </div>
    </div>
    ${d.cerf ? `<p class="cerf">${esc(d.cerf)}</p>` : ''}
  </div>
</section>`;

  const liens = [];
  if (enLigne) liens.push(`<a class="lien" href="${esc(d.resalib)}" rel="noopener" target="_blank">${esc(enLigne.libelle)}</a>`);
  if (d.facebook) liens.push(`<a class="lien" href="${esc(d.facebook)}" rel="noopener" target="_blank">Facebook</a>`);

  const sectionContact = `
<section class="sc sc-contact" id="contact" data-monde="cristal" data-variante="aube" data-nom="Contact">
  <div class="sc-in panneau">
    <p class="etiquette mono"><span class="num"></span>Contact</p>
    <h2 class="titre">Prendre <em>rendez-vous</em></h2>
    <p class="rdv">${esc(d.rdv || 'Sur rendez-vous')}${ou ? `, à ${esc(net(d.ville))}` : ''}.</p>
    <a class="tel-grand" href="${telLien}"><span class="mono">Par téléphone</span>${tel}</a>
    ${liens.length ? `<p class="liens">${liens.join('')}</p>` : ''}
    <p class="emplacement adresse">Ici, l'adresse de votre cabinet et un plan pour venir.</p>
  </div>
</section>`;

  const pied = `
<footer class="pied" data-monde="cristal" data-variante="aube">
  <div class="pied-in">
    <p class="pied-nom">${nom}</p>
    <p class="mono pied-meta">${[metier, ou].filter(Boolean).join(' · ')}${d.siret ? ` · SIRET ${esc(d.siret)}` : ''}</p>
    <p class="pied-avert">${esc(d.avertissement)}</p>
    <p class="apercu">Aperçu préparé pour ${nom}. Textes, photos, couleurs : tout se modifie selon vos goûts.</p>
  </div>
</footer>`;

  return {
    titre: `${net(d.nom)}, ${net(d.metier)}${d.ville ? ' à ' + net(d.ville) : ''}`,
    description: net(d.accroche),
    prenom: prenom(d),
    etapes: etapes.length,
    html: [accueil, sectionApproche, sectionSeance, sectionTarifs, sectionApropos, sectionContact].join('\n'),
    pied,
    hud: { nom, metier, tel, telLien, initiales: esc(d.initiales || net(d.nom).split(' ').map((m) => m[0]).join('').slice(0, 2)) }
  };
}
