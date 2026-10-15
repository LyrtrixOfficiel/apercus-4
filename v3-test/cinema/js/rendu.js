// Rendu de la direction Cinéma : un seul module, utilisé par le navigateur
// (?p=<dossier>) ET par outils/batir.mjs (page lisible sans JavaScript).
// Tout vient du JSON du praticien ; ce qui manque devient un emplacement
// qui dit ce qui viendra. Rien n'est inventé.

// Quelle photo va où, par famille de métier (accueil, approche, séance, galerie, contact).
export const JEUX = {
  calme: {
    accueil: 'soleil-rideaux', approche: ['canape-rideau', 'bougie-travertin'],
    seance: ['brume-lac', 'ombres-sol', 'ciel-ocean', 'rideaux-blancs'],
    galerie: ['arches', 'lin', 'colonnes', 'marbre', 'mur-fenetre', 'fleurs-sechees'], contact: 'rideau-soleil',
  },
  toucher: {
    accueil: 'spa-salle', approche: ['massage-fenetre', 'bougie-lavande'],
    seance: ['serviettes', 'galets-bois', 'mains-dos', 'hammam'],
    galerie: ['flacons', 'rideau', 'lin', 'colonnes', 'bougie-travertin', 'ombres-chaudes'], contact: 'hammam',
  },
  plantes: {
    accueil: 'plantes-soleil', approche: ['bol-herbes', 'tisane'],
    seance: ['sauge', 'aromatiques', 'ombre-mur', 'fleurs-tisane'],
    galerie: ['fleurs-sechees', 'banc-bas', 'lin', 'vase-seche', 'rideau-soleil', 'mur-fenetre'], contact: 'ombres-chaudes',
  },
  accompagnement: {
    accueil: 'salon', approche: ['fauteuils', 'carnet-tasse'],
    seance: ['fenetre-mer', 'salon-baie', 'carnets', 'ombres-sol'],
    galerie: ['arches', 'canape-rideau', 'banc-bas', 'lin', 'mur-fenetre', 'colonnes'], contact: 'rideau-soleil',
  },
  yoga: {
    accueil: 'grand-studio', approche: ['tapis-fenetre', 'banc-bas'],
    seance: ['studio', 'meditation', 'salle-doree', 'ombres-sol'],
    galerie: ['arches', 'colonnes', 'rideau', 'lin', 'plantes-soleil', 'ombres-chaudes'], contact: 'rideau-soleil',
  },
  energie: {
    accueil: 'lumiere-verre', approche: ['plume', 'cristal'],
    seance: ['voile-irise', 'rayons', 'soleil-rideaux', 'mur-fenetre'],
    galerie: ['arches', 'colonnes', 'lin', 'bougie-travertin', 'fleurs-sechees', 'marbre'], contact: 'rideau-soleil',
  },
  perinatal: {
    accueil: 'chambre', approche: ['coton', 'lin'],
    seance: ['draps', 'voilage-soir', 'soleil-rideaux', 'canape-rideau'],
    galerie: ['rideaux-blancs', 'arches', 'vase-seche', 'rideau', 'mur-fenetre', 'fleurs-sechees'], contact: 'rideau-soleil',
  },
};

const sansAccent = (s) => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
// L'ordre compte : « Réflexologie bébé » est d'abord périnatal, « Naturopathe réflexologue » d'abord plantes.
const REGLES = [
  [/doula|perinat|sage-femme|bebe|maternit|naissance|parental|portage/, 'perinatal'],
  [/reiki|magnet|energet|sonoth|chaman|astrolog|musicoth|lithoth|bols? chantant/, 'energie'],
  [/yoga|qi ?gong|tai ?chi|pilates/, 'yoga'],
  [/naturo|phyto|herbor|aroma|fleurs de bach|nutri|diet|ayurv|plante|soins naturels|medecines? douces/, 'plantes'],
  [/massage|masseu|reflexo|shiatsu|somatopath|esthet|kinesi|medecine chinoise|tuina|drainage|soin du corps/, 'toucher'],
  [/coach|pnl|eft|art-?ther|psycho|gestalt|formateur|formatrice|sexo|constellation/, 'accompagnement'],
];
export const familleDe = (metier) => (REGLES.find(([re]) => re.test(sansAccent(metier))) || [null, 'calme'])[1];

// --- texte -------------------------------------------------------------------
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// Jamais de tiret long ; espaces insécables à la française.
const propre = (s) => String(s ?? '').replace(/\s*[\u2013\u2014]\s*/g, ', ').replace(/\s+/g, ' ').trim();
const typo = (s) => propre(s)
  .replace(/ ([;!?])/g, '\u202F$1').replace(/ :/g, '\u00A0:')
  .replace(/« /g, '«\u00A0').replace(/ »/g, '\u00A0»')
  .replace(/(\d) (h|min|€|ans?)\b/g, '$1\u00A0$2').replace(/(\d) €/g, '$1\u00A0€').replace(/ (€)/g, '\u00A0$1');
const fr = (s) => esc(typo(s));
// Titres découpés à l'avance (lettres ou mots) : le texte entier reste lisible
// pour les lecteurs d'écran et sans JavaScript ; les morceaux ne servent qu'au mouvement.
function lettres(s) {
  let i = 0;
  const t = typo(s);
  return `<span class="lu">${esc(t)}</span><span aria-hidden="true">${t.split(' ').map((m) => `<span class="mot">${[...m].map((c) => `<span class="lettre" style="--i:${i++}">${esc(c)}</span>`).join('')}</span>`).join(' ')}</span>`;
}
const mots = (s) => typo(s).split(' ').map((m) => `<span class="mot">${esc(m)}</span>`).join(' ');
const utile = (p) => p && !/_/.test(p) && propre(p).length > 12;
const ville = (v) => propre(v).split('-').map((m, i) => (i > 0 && /^(en|le|la|les|de|du|des|sur|sous|l[eè]s|et)$/i.test(m) ? m.toLowerCase() : m)).join('-');
const ROMAINS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

// --- images ------------------------------------------------------------------
// grand : ajoute la version 1920 x 1200 recadrée pour les écrans larges (plein cadre).
function photo(images, nom, { grand = false, classe = '', alt = '', charge = 'lazy', attrs = '' } = {}) {
  const i = images[nom] || {};
  const texte = alt || (i.sujet ? `Photo d’ambiance : ${i.sujet}` : '');
  return `<picture class="photo ${classe}"${attrs}>${grand ? `<source media="(min-width: 900px)" srcset="images/${nom}-1920.webp">` : ''}<img src="images/${nom}-1000.webp" width="${i.l || 1000}" height="${i.h || 1000}" alt="${esc(texte)}" loading="${charge}" decoding="async"${charge === 'eager' ? ' fetchpriority="high"' : ''} style="background-image:url(${i.flou || ''})"></picture>`;
}

const ICONES = `<svg width="0" height="0" style="position:absolute" aria-hidden="true">
<symbol id="i-tel" viewBox="0 0 24 24"><path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></symbol>
<symbol id="i-fleche" viewBox="0 0 24 24"><path d="M4 12h15M14 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></symbol>
<symbol id="i-haut" viewBox="0 0 24 24"><path d="M12 20V5M6 10l6-6 6 6" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></symbol>
<symbol id="i-lien" viewBox="0 0 24 24"><path d="M7 17 17 7M9 7h8v8" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></symbol>
</svg>`;

function lienExterne(url) {
  if (!url) return null;
  let hote = '';
  try { hote = new URL(url).hostname.replace(/^www\./, ''); } catch { return null; }
  if (/resalib/.test(hote)) return { url, texte: 'Réserver en ligne sur Resalib' };
  if (/facebook/.test(hote)) return { url, texte: 'Sa page Facebook' };
  return { url, texte: `Sa fiche sur ${hote}` };
}

export function rendre(d, images) {
  const famille = familleDe(d.metier);
  const J = JEUX[famille];
  const nom = propre(d.nom);
  const metier = propre(d.metier);
  const lieu = ville(d.ville);
  const lieuComplet = [d.cp, lieu].filter(Boolean).join(' ');
  const approche = (d.approche || []).filter(utile);
  const apropos = (d.apropos || []).filter(utile);
  const etapes = (d.etapes || []).filter((e) => e && e.titre);
  const apports = (d.apports || []).filter((a) => a && a.titre);
  const tarifs = (d.tarifs || []).filter((t) => t && t.nom);
  const tel = propre(d.tel);
  const telLien = d.telLien || (tel ? 'tel:' + tel.replace(/\s/g, '') : '');
  const liens = [lienExterne(d.resalib), lienExterne(d.facebook)].filter(Boolean);
  const accroche = propre(d.accroche);
  const n = { approche: 0, seance: 1, galerie: 2, tarifs: 3, apropos: 4, contact: 5 };
  const chap = (k, titre) => `<p class="chapitre" data-reveal><span class="chapitre-num">${ROMAINS[n[k]]}</span><span class="chapitre-trait" aria-hidden="true"></span><span>${titre}</span></p>`;
  const vide = (texte) => `<span class="emplacement"><span class="emplacement-tag">À compléter</span>${fr(texte)}</span>`;
  const sousTitre = [metier, lieu].filter(Boolean).join(' à ');

  // 1. Accueil
  const accueil = `
<section class="accueil" id="accueil" aria-label="Accueil">
  <div class="accueil-cadre" data-accueil-cadre>
    ${photo(images, J.accueil, { grand: true, classe: 'accueil-photo', charge: 'eager' })}
    <div class="accueil-voile" aria-hidden="true"></div>
  </div>
  <div class="accueil-contenu">
    <p class="accueil-sur" data-intro style="--d:0">${fr(metier)}${lieu ? `<span class="point" aria-hidden="true"></span>${fr(lieu)}` : ''}</p>
    <h1 class="accueil-titre">${lettres(nom)}</h1>
    ${accroche ? `<p class="accueil-accroche" data-intro style="--d:1">${d.accrocheSienne ? `«\u00A0${fr(accroche)}\u00A0»` : fr(accroche)}</p>` : ''}
  </div>
  <div class="accueil-pied" data-intro style="--d:2">
    <a class="defiler" href="#approche" data-curseur="Entrer"><span class="defiler-ligne" aria-hidden="true"></span><span>Défiler</span></a>
    <p class="accueil-rdv">${fr(d.rdv || 'Sur rendez-vous')}${tel ? ` <a href="${esc(telLien)}">${fr(tel)}</a>` : ''}</p>
  </div>
</section>`;

  // 2. Approche : une phrase qui s'allume mot à mot, puis trois plans en parallaxe.
  const phrase = d.conviction ? propre(d.conviction) : (approche[0] || '');
  const reste = d.conviction ? approche : approche.slice(1);
  const blocApports = apports.length ? `
    <ul class="apports" role="list">
      ${apports.map((a, i) => `<li class="apport" data-reveal><span class="apport-num">${String(i + 1).padStart(2, '0')}</span><h3>${fr(a.titre)}</h3><p>${fr(a.texte)}</p></li>`).join('')}
    </ul>` : '';
  const sectionApproche = `
<section class="approche" id="approche" aria-labelledby="t-approche">
  ${chap('approche', 'L’approche')}
  <h2 class="approche-phrase${phrase ? '' : ' approche-phrase-vide'}" id="t-approche" data-mots>${mots(phrase || 'Ici, en une phrase, ce qui guide votre travail.')}</h2>
  <div class="approche-scene">
    <div class="plan plan-a" data-parallax="-0.12">${photo(images, J.approche[0], { classe: 'masque', attrs: ' data-masque' })}</div>
    <div class="plan plan-cadre" data-parallax="0.18" aria-hidden="true"></div>
    <div class="plan plan-b" data-parallax="0.32">${photo(images, J.approche[1], { classe: 'masque', attrs: ' data-masque' })}</div>
    <div class="approche-texte">
      ${reste.length ? reste.map((p, i) => `<p data-reveal${i === 0 ? ' class="lead"' : ''}>${fr(p)}</p>`).join('') : `<p data-reveal>${vide('Ici, votre approche en quelques phrases : ce qui vous guide, votre manière d’accueillir, ce que l’on vient chercher auprès de vous.')}</p>`}
    </div>
  </div>
  ${blocApports}
</section>`;

  // 3. La séance : l'image épinglée se transforme pendant qu'on lit les étapes.
  const imgs = J.seance;
  const sectionSeance = `
<section class="seance" id="seance" aria-labelledby="t-seance" style="--n:${Math.max(etapes.length, 1)}">
  <div class="seance-entete">
    ${chap('seance', 'La séance')}
    <h2 id="t-seance" class="titre-section" data-lettres>${lettres('Le déroulé')}</h2>
    ${d.dureePremiere || d.dureeSuivi ? `<p class="seance-durees" data-reveal>${d.dureePremiere ? `<span>Première séance <b>${fr(d.dureePremiere)}</b></span>` : ''}${d.dureeSuivi ? `<span>Séances de suivi <b>${fr(d.dureeSuivi)}</b></span>` : ''}</p>` : ''}
  </div>
  <div class="seance-corps">
    <div class="seance-scene" aria-hidden="true">
      <div class="seance-cadre" data-seance-cadre>
        ${imgs.map((im, i) => photo(images, im, { grand: true, classe: `seance-photo${i === 0 ? ' actif' : ''}`, attrs: ` data-i="${i}"` })).join('')}
        <div class="seance-compteur"><span data-seance-num>01</span><span class="sep"></span><span>${String(etapes.length).padStart(2, '0')}</span></div>
      </div>
    </div>
    <ol class="etapes" role="list">
      ${etapes.map((e, i) => `
      <li class="etape${d.etapesEmplacement ? ' etape-vide' : ''}" data-etape="${i}">
        <span class="etape-num" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
        <h3>${fr(e.titre)}</h3>
        ${d.etapesEmplacement ? `<p>${vide(e.texte)}</p>` : `<p>${fr(e.texte)}</p>`}
        ${e.duree ? `<p class="etape-duree">${fr(e.duree)}</p>` : ''}
      </li>`).join('')}
    </ol>
  </div>
</section>`;

  // 4. Galerie horizontale : l'atmosphère (photos d'ambiance, dites comme telles).
  const cartes = J.galerie.map((im, i) => {
    const a = apports[i];
    const forme = ['haute', 'large', 'carree', 'haute', 'large', 'carree'][i % 6];
    return `<figure class="carte carte-${forme}" data-curseur="Glisser">
      <div class="carte-cadre">${photo(images, im, { classe: 'carte-photo' })}</div>
      <figcaption><span class="carte-num">${String(i + 1).padStart(2, '0')}</span>${a ? `<b>${fr(a.titre)}</b>` : `<span>${fr(images[im]?.sujet || '')}</span>`}</figcaption>
    </figure>`;
  }).join('');
  const sectionGalerie = `
<section class="galerie" id="galerie" aria-labelledby="t-galerie">
  <div class="galerie-colle">
    <div class="galerie-entete">
      ${chap('galerie', apports.length ? 'Ce que vous y trouverez' : 'L’atmosphère')}
      <h2 id="t-galerie" class="titre-section" data-lettres>${lettres(apports.length ? 'Un temps pour soi' : 'La lumière du lieu')}</h2>
      <p class="galerie-note" data-reveal>Photos d’ambiance : les images de votre cabinet prendront leur place.</p>
    </div>
    <div class="galerie-piste" data-piste tabindex="0" aria-label="Galerie de photos d’ambiance, faites défiler">
      ${cartes}
      <figure class="carte carte-vide">
        <div class="carte-cadre"><span class="carte-vide-texte">Ici, vos photos<small>votre salle, votre lumière, vos objets</small></span></div>
      </figure>
    </div>
    <div class="galerie-barre" aria-hidden="true"><span data-galerie-barre></span></div>
  </div>
</section>`;

  // 5. Tarifs
  const lignes = tarifs.length ? tarifs.map((t) => `<li class="tarif" data-ligne><span class="tarif-nom">${fr(t.nom)}</span><span class="tarif-points" aria-hidden="true"></span><span class="tarif-prix">${fr(t.prix || 'Sur demande')}</span></li>`).join('')
    : `<li class="tarif tarif-vide" data-ligne><span class="tarif-nom">${vide('Ici, vos séances et leurs tarifs, la durée de chacune.')}</span></li>`;
  const sectionTarifs = `
<section class="tarifs" id="tarifs" aria-labelledby="t-tarifs">
  ${chap('tarifs', 'Tarifs')}
  <div class="tarifs-grille">
    <h2 id="t-tarifs" class="titre-section" data-lettres>${lettres('Les séances')}</h2>
    <div>
      <ul class="tarifs-liste" role="list">${lignes}</ul>
      <dl class="tarifs-infos" data-reveal>
        <div><dt>Rendez-vous</dt><dd>${fr(d.rdv || 'Sur rendez-vous')}</dd></div>
        ${d.dureePremiere ? `<div><dt>Première séance</dt><dd>${fr(d.dureePremiere)}</dd></div>` : ''}
        ${d.dureeSuivi ? `<div><dt>Suivi</dt><dd>${fr(d.dureeSuivi)}</dd></div>` : ''}
        <div><dt>Règlement</dt><dd>${d.paiementListe ? fr(d.paiementListe.charAt(0).toUpperCase() + d.paiementListe.slice(1)) : vide('Ici, les moyens de paiement acceptés.')}</dd></div>
      </dl>
    </div>
  </div>
</section>`;

  // 6. À propos : portrait à venir, dans une arche qui s'ouvre.
  const sectionApropos = `
<section class="apropos" id="apropos" aria-labelledby="t-apropos">
  ${chap('apropos', 'À propos')}
  <div class="apropos-grille">
    <figure class="portrait" data-masque>
      <div class="portrait-arche">
        <span class="portrait-initiales" aria-hidden="true">${esc(d.initiales || nom.slice(0, 2))}</span>
        <figcaption class="portrait-texte">Ici, votre portrait<small>une photo de vous, dans votre lumière</small></figcaption>
      </div>
    </figure>
    <div class="apropos-texte">
      <h2 id="t-apropos" class="titre-section" data-lettres>${lettres(nom)}</h2>
      <p class="apropos-metier" data-reveal>${fr(sousTitre)}</p>
      ${apropos.length ? apropos.map((p, i) => `<p data-reveal${i === 0 ? ' class="lead"' : ''}>${fr(p)}</p>`).join('') : `<p data-reveal>${vide('Ici, votre parcours : ce qui vous a menée à ce métier, vos formations, ce qui vous tient à cœur.')}</p>`}
    </div>
  </div>
</section>`;

  // 7. Contact : un cercle qui s'ouvre sur une dernière image.
  const sectionContact = `
<section class="contact" id="contact" aria-labelledby="t-contact">
  <div class="contact-cadre" data-contact-cadre>
    ${photo(images, J.contact, { grand: true, classe: 'contact-photo' })}
    <div class="contact-voile" aria-hidden="true"></div>
  </div>
  <div class="contact-contenu">
    ${chap('contact', 'Rendez-vous')}
    <h2 id="t-contact" class="contact-titre" data-lettres>${lettres('Prenons rendez-vous')}</h2>
    ${d.cerf ? `<p class="contact-phrase" data-reveal>${fr(d.cerf)}</p>` : ''}
    ${tel ? `<a class="contact-tel" href="${esc(telLien)}" data-reveal data-curseur="Appeler"><svg aria-hidden="true"><use href="#i-tel"/></svg><span>${fr(tel)}</span></a>` : `<p class="contact-tel">${vide('Ici, votre numéro de téléphone.')}</p>`}
    <div class="contact-actions" data-reveal>
      ${tel ? `<a class="bouton bouton-plein" href="${esc(telLien)}"><span>${fr(d.appeler || 'Appeler')}</span><svg aria-hidden="true"><use href="#i-fleche"/></svg></a>` : ''}
      ${liens.map((l) => `<a class="bouton" href="${esc(l.url)}" target="_blank" rel="noopener"><span>${fr(l.texte)}</span><svg aria-hidden="true"><use href="#i-lien"/></svg></a>`).join('')}
    </div>
    <dl class="contact-infos" data-reveal>
      <div><dt>Lieu</dt><dd>${lieuComplet ? fr(lieuComplet) : vide('Ici, l’adresse de votre cabinet.')}</dd></div>
      <div><dt>Accueil</dt><dd>${fr(d.rdv || 'Sur rendez-vous')}</dd></div>
      <div><dt>Horaires</dt><dd>${vide('Ici, vos jours et heures d’ouverture.')}</dd></div>
    </dl>
  </div>
</section>`;

  const apercu = `Aperçu préparé pour ${nom}. Textes, photos, couleurs : tout se modifie selon vos goûts.`;
  const pied = `
<footer class="pied">
  <div class="pied-haut">
    <a class="pied-nom" href="#accueil"><span class="monogramme" aria-hidden="true">${esc(d.initiales || '')}</span><span>${fr(nom)}<small>${fr(sousTitre)}</small></span></a>
    <nav class="pied-nav" aria-label="Plan du site">
      <a href="#approche">L’approche</a><a href="#seance">La séance</a><a href="#tarifs">Tarifs</a><a href="#apropos">À propos</a><a href="#contact">Rendez-vous</a>
    </nav>
    <a class="pied-haut-lien" href="#accueil" aria-label="Revenir en haut"><svg aria-hidden="true"><use href="#i-haut"/></svg></a>
  </div>
  <p class="pied-apercu">${fr(apercu)}</p>
  <p class="pied-petit">${fr(d.avertissement || '')}</p>
  <p class="pied-petit">${d.siret ? `SIRET ${esc(d.siret)}<span class="point" aria-hidden="true"></span>` : ''}Photos d’ambiance Unsplash<span class="point" aria-hidden="true"></span>Maquette non publiée</p>
</footer>`;

  const barre = `
<a class="evitement" href="#approche">Aller au contenu</a>
<header class="barre" data-barre>
  <a class="barre-nom" href="#accueil" aria-label="${esc(nom)}, retour en haut"><span class="monogramme" aria-hidden="true">${esc(d.initiales || '')}</span><span class="barre-nom-texte">${fr(nom)}</span></a>
  <nav class="barre-nav" aria-label="Navigation principale">
    <a href="#approche">L’approche</a><a href="#seance">La séance</a><a href="#tarifs">Tarifs</a><a href="#apropos">À propos</a>
  </nav>
  ${tel ? `<a class="barre-rdv" href="${esc(telLien)}"><svg aria-hidden="true"><use href="#i-tel"/></svg><span>Rendez-vous</span></a>` : `<a class="barre-rdv" href="#contact"><span>Rendez-vous</span></a>`}
  <button class="barre-menu" type="button" aria-expanded="false" aria-controls="menu" data-menu-bouton><span>Menu</span></button>
</header>
<div class="menu" id="menu" hidden data-menu>
  <nav aria-label="Menu">
    <a href="#approche"><i>I</i>L’approche</a><a href="#seance"><i>II</i>La séance</a><a href="#galerie"><i>III</i>${apports.length ? 'Ce que vous y trouverez' : 'L’atmosphère'}</a><a href="#tarifs"><i>IV</i>Tarifs</a><a href="#apropos"><i>V</i>À propos</a><a href="#contact"><i>VI</i>Rendez-vous</a>
  </nav>
  ${tel ? `<a class="menu-tel" href="${esc(telLien)}">${fr(tel)}</a>` : ''}
</div>
<div class="curseur" aria-hidden="true"><span class="curseur-point"></span><span class="curseur-anneau"><span class="curseur-texte"></span></span></div>
<div class="rideau" aria-hidden="true" data-rideau><span class="rideau-barre rideau-haut"></span><span class="rideau-barre rideau-bas"></span><p class="rideau-carton"><span>${fr(nom)}</span><small>${fr(sousTitre)}</small></p></div>`;

  return {
    famille,
    titre: `${nom} · ${[metier, lieu].filter(Boolean).join(' à ')}`,
    description: accroche || `${metier}${lieu ? ' à ' + lieu : ''}, sur rendez-vous.`,
    html: `${ICONES}${barre}<main id="contenu">${accueil}${sectionApproche}${sectionSeance}${sectionGalerie}${sectionTarifs}${sectionApropos}${sectionContact}</main>${pied}`,
    precharge: `images/${J.accueil}-1000.webp`,
  };
}
