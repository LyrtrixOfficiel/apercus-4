// Rendu de la direction Éditorial : le site comme un numéro de magazine.
// Un seul module, utilisé par le navigateur (?p=<dossier>) ET par outils/batir.mjs
// (page lisible sans JavaScript). Tout vient du JSON ; ce qui manque devient un
// emplacement qui dit ce qui viendra. Rien n'est inventé.

const NB = String.fromCharCode(160);    // espace insécable
const FINE = String.fromCharCode(8239); // espace fine insécable
const TIRETS = new RegExp('\\s*[' + String.fromCharCode(8211, 8212) + ']\\s*', 'g');

// Une couleur franche par famille de métier, deux objets détourés, deux photos, des mots.
export const THEMES = {
  calme: { accent: '#2b3bc4', nom: 'outremer', couverture: 'plume-brune', objet: 'pierre-ronde', fig: ['ombre-fleurs', 'main-pierre'], mots: ['ralentir', 'respirer', 'se poser', 'lâcher prise'] },
  toucher: { accent: '#b42356', nom: 'framboise', couverture: 'galets-noirs', objet: 'feuille', fig: ['mains-dos', 'serviettes'], mots: ['se poser', 'se détendre', 'prendre soin de soi', 'souffler'] },
  plantes: { accent: '#1f6b3b', nom: 'vert sapin', couverture: 'feuille', objet: 'branche', fig: ['bol-herbes', 'tournesol'], mots: ['prendre soin de soi', 'ralentir', 'revenir à l’essentiel', 'écouter son corps'] },
  accompagnement: { accent: '#0f6e7a', nom: 'bleu canard', couverture: 'branche', objet: 'pierre-ronde', fig: ['main-fleurs', 'carnet-tasse'], mots: ['faire le point', 'avancer', 'clarifier', 'se retrouver'] },
  yoga: { accent: '#b5491b', nom: 'orange brûlé', couverture: 'pierre-ronde', objet: 'plume-brune', fig: ['tapis-fenetre', 'salle-doree'], mots: ['respirer', 'bouger', 'se poser', 'ralentir'] },
  energie: { accent: '#5b2bc0', nom: 'violet', couverture: 'amethyste', objet: 'plume-brune', fig: ['bougie-verte', 'voile-irise'], mots: ['ralentir', 'se poser', 'écouter', 'respirer'] },
  perinatal: { accent: '#a8432c', nom: 'terre cuite', couverture: 'rose', objet: 'plume-brune', fig: ['coton', 'vases'], mots: ['se préparer', 'se poser', 'se faire accompagner', 'respirer'] },
};

const sansAccent = (s) => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const REGLES = [
  [/doula|perinat|sage-femme|bebe|maternit|naissance|parental|portage/, 'perinatal'],
  [/reiki|magnet|energet|sonoth|chaman|astrolog|musicoth|lithoth|bols? chantant/, 'energie'],
  [/yoga|qi ?gong|tai ?chi|pilates/, 'yoga'],
  [/naturo|phyto|herbor|aroma|fleurs de bach|nutri|diet|ayurv|plante|soins naturels|medecines? douces/, 'plantes'],
  [/massage|masseu|reflexo|shiatsu|somatopath|esthet|kinesi|medecine chinoise|tuina|drainage|soin du corps/, 'toucher'],
  [/coach|pnl|eft|art-?ther|psycho|gestalt|formateur|formatrice|sexo|constellation/, 'accompagnement'],
];
export const familleDe = (metier) => (REGLES.find(([re]) => re.test(sansAccent(metier))) || [null, 'calme'])[1];

// --- texte ---------------------------------------------------------------------
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const propre = (s) => String(s ?? '').replace(TIRETS, ', ').replace(/\s+/g, ' ').trim();
const typo = (s) => propre(s)
  .replace(/ ([;!?])/g, FINE + '$1').replace(/ :/g, NB + ':')
  .replace(/« /g, '«' + NB).replace(/ »/g, NB + '»')
  .replace(/(\d) (h|min|€|ans?)\b/g, '$1' + NB + '$2').replace(/(\d) €/g, '$1' + NB + '€');
const fr = (s) => esc(typo(s));
const mots = (s) => typo(s).split(' ').map((m) => `<span class="mot"><span>${esc(m)}</span></span>`).join(' ');
const utile = (p) => p && !/_/.test(p) && propre(p).length > 12;
const ville = (v) => propre(v).split('-').map((m, i) => (i > 0 && /^(en|le|la|les|de|du|des|sur|sous|l[eè]s|et)$/i.test(m) ? m.toLowerCase() : m)).join('-');
const n2 = (i) => String(i).padStart(2, '0');

// Paragraphe avec lettrine : la première lettre est sortie du flux (la phrase reste entière pour les lecteurs d'écran).
function lettrine(p) {
  const t = typo(p);
  const m = t.match(/^([«"“]?\s*)(\p{L})/u);
  if (!m) return `<p>${esc(t)}</p>`;
  return `<p class="avec-lettrine"><span class="lettrine" aria-hidden="true">${esc(m[2])}</span><span class="lu">${esc(m[2])}</span>${esc(t.slice(m[0].length))}</p>`;
}

function photo(images, nom, { classe = '', alt = '', attrs = '' } = {}) {
  const i = images[nom] || {};
  const texte = alt || (i.sujet ? `Photo d’ambiance : ${i.sujet}` : '');
  return `<picture class="photo ${classe}"${attrs}><source media="(min-width: 900px)" srcset="images/${nom}-1600.webp"><img src="images/${nom}-900.webp" width="${i.l || 900}" height="${i.h || 900}" alt="${esc(texte)}" loading="lazy" decoding="async" style="background-image:url(${i.flou || ''})"></picture>`;
}
function objet(images, nom, { classe = '', attrs = '', charge = 'lazy' } = {}) {
  const i = images[nom] || {};
  return `<img class="objet ${classe}" src="images/${nom}-objet-600.webp" srcset="images/${nom}-objet-600.webp 600w, images/${nom}-objet-1100.webp 1100w" sizes="(min-width: 900px) 40vw, 70vw" width="${i.l || 600}" height="${i.h || 600}" alt="" loading="${charge}" decoding="async"${attrs}>`;
}

function lienExterne(url) {
  if (!url) return null;
  let hote = '';
  try { hote = new URL(url).hostname.replace(/^www\./, ''); } catch { return null; }
  if (/resalib/.test(hote)) return { url, texte: 'Réserver sur Resalib' };
  if (/facebook/.test(hote)) return { url, texte: 'Facebook' };
  return { url, texte: hote };
}

export function rendre(d, images) {
  const famille = familleDe(d.metier);
  const T = THEMES[famille];
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
  const vide = (texte) => `<span class="emplacement"><span class="emplacement-tag">À compléter</span>${fr(texte)}</span>`;
  const sousTitre = [metier, lieu].filter(Boolean).join(' à ');

  // rubriques, numérotées dans l'ordre où elles paraissent
  const rubriques = [['approche', 'L’approche'], ['seance', 'La séance'], ...(apports.length ? [['apports', 'Ce que vous y trouverez']] : []), ['tarifs', 'Infos pratiques'], ['portrait', 'Le portrait'], ['rdv', 'Rendez-vous']];
  const num = Object.fromEntries(rubriques.map(([k], i) => [k, n2(i + 1)]));
  const entete = (k, titre, glisse) => `
  <header class="rubrique-entete">
    <p class="rubrique-num" aria-hidden="true">${num[k]}</p>
    <p class="rubrique-label"><span>Rubrique ${num[k]}</span><span class="filet" aria-hidden="true"></span><span>${fr(titre)}</span></p>
    <h2 class="glisse${titre.length > 12 ? ' long' : ''}" data-glisse="${glisse}" id="t-${k}">${fr(titre)}</h2>
  </header>`;

  // le titre de couverture : un mot par ligne, chaque ligne ajustée à la largeur
  const lignes = typo(nom).split(' ').reduce((acc, m) => { const der = acc[acc.length - 1]; if (der && (der + ' ' + m).length <= 7) acc[acc.length - 1] = der + ' ' + m; else acc.push(m); return acc; }, []);
  const marque = lignes.map((l, i) => `<span class="titre-ligne titre-ligne-${i % 2 ? 'b' : 'a'}" style="--n:${Math.max(l.length, 3)};--l:${i}" data-ligne="${i}"><span class="titre-texte">${esc(l)}</span></span>`).join('');
  const lieuBandeau = [metier, lieu, d.rdv || 'Sur rendez-vous', tel].filter(Boolean).map((x) => `<span>${fr(x)}</span><i aria-hidden="true">✦</i>`).join('');
  const badge = `Numéro 01 · ${lieu || metier} · ${d.rdv || 'Sur rendez-vous'} · `;

  // 0. couverture
  const couverture = `
<section class="couverture" id="couverture" aria-label="Couverture">
  <div class="couverture-filets">
    <span>N°${NB}01</span><span>${fr(sousTitre)}</span><span>${fr(d.rdv || 'Sur rendez-vous')}</span>
  </div>
  <h1 class="couverture-titre" aria-label="${esc(typo(nom))}" data-lignes="${Math.min(lignes.length, 4)}">
    <span class="couverture-bloc" aria-hidden="true" data-bloc></span>
    ${marque}
    ${objet(images, T.couverture, { classe: 'couverture-objet', charge: 'eager', attrs: ' data-objet-couverture' })}
  </h1>
  <div class="couverture-bas">
    <nav class="sommaire" aria-label="Dans ce numéro">
      <p class="sommaire-titre">Dans ce numéro</p>
      <ol role="list">${rubriques.map(([k, t]) => `<li><a href="#${k}"><b>${num[k]}</b>${fr(t)}</a></li>`).join('')}</ol>
    </nav>
    <p class="couverture-phrase">Un temps pour <span class="tournant" data-mots-tournants='${esc(JSON.stringify(T.mots))}'><span class="tournant-mot">${fr(T.mots[0])}</span></span></p>
    <svg class="badge" viewBox="0 0 200 200" aria-hidden="true" data-badge>
      <defs><path id="cercle" d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0"/></defs>
      <circle cx="100" cy="100" r="96" class="badge-fond"/>
      <text><textPath href="#cercle" textLength="486" lengthAdjust="spacing">${esc(typo(badge))}</textPath></text>
      <text x="100" y="114" text-anchor="middle" class="badge-centre">${esc(d.initiales || '')}</text>
    </svg>
  </div>
</section>
<div class="bandeau" aria-hidden="true"><div class="bandeau-piste" data-bandeau>${lieuBandeau.repeat(4)}</div></div>`;

  // 1. l'approche
  const corps = approche.length ? approche : [];
  const sectionApproche = `
<section class="rubrique approche" id="approche" aria-labelledby="t-approche">
  ${entete('approche', 'L’approche', 'gauche')}
  <div class="article">
    <aside class="article-cote">
      ${accroche && (d.conviction || !d.accrocheSienne) ? `<p class="chapo">${d.accrocheSienne ? `«${NB}${fr(accroche)}${NB}»` : fr(accroche)}</p>` : ''}
      <figure class="figure" data-figure>
        ${photo(images, T.fig[0], { classe: 'figure-photo' })}
        <figcaption><b>Fig. 1</b> Photo d’ambiance, ${fr(images[T.fig[0]]?.sujet || '')}. Vos images prendront sa place.</figcaption>
      </figure>
    </aside>
    <div class="article-texte${corps.length > 2 ? ' colonnes' : ''}">
      ${corps.length ? corps.map((p, i) => (i === 0 ? lettrine(p) : `<p>${fr(p)}</p>`)).join('') : `${lettrine('Ici, votre approche en quelques phrases.')}<p>${vide('Ce qui vous guide, votre manière d’accueillir, ce que l’on vient chercher auprès de vous. Nous l’écrirons ensemble, avec vos mots.')}</p>`}
    </div>
    ${objet(images, T.objet, { classe: 'objet-flottant', attrs: ' data-flotte' })}
  </div>
</section>`;

  // 2. la citation immense
  const citation = d.conviction ? propre(d.conviction) : (d.accrocheSienne && accroche ? accroche : '');
  const sectionCitation = `
<section class="citation" aria-label="Citation">
  <blockquote>
    <span class="guillemet" aria-hidden="true">«</span>
    <p class="citation-texte${citation ? '' : ' citation-vide'}" data-citation>${mots(citation || 'Ici, la phrase qui vous ressemble.')}</p>
    <footer>${citation ? `${fr(nom)}, ${fr(metier.toLowerCase())}` : vide('Une phrase à vous, que l’on mettra en grand.')}</footer>
  </blockquote>
</section>`;

  // 3. la séance : les titres d'étapes glissent, en alternance
  const sectionSeance = `
<section class="rubrique seance" id="seance" aria-labelledby="t-seance">
  ${entete('seance', 'La séance', 'droite')}
  ${d.dureePremiere || d.dureeSuivi ? `<p class="seance-durees">${d.dureePremiere ? `<span>Première séance <b>${fr(d.dureePremiere)}</b></span>` : ''}${d.dureeSuivi ? `<span>Suivi <b>${fr(d.dureeSuivi)}</b></span>` : ''}</p>` : ''}
  <div class="seance-grille">
    <ol class="etapes" role="list">
      ${etapes.map((e, i) => `
      <li class="etape">
        <p class="etape-num" aria-hidden="true">${i + 1}</p>
        <h3 class="etape-titre" data-glisse="${i % 2 ? 'droite' : 'gauche'}">${fr(e.titre)}</h3>
        <div class="etape-texte">
          ${d.etapesEmplacement ? `<p>${vide(e.texte)}</p>` : `<p>${fr(e.texte)}</p>`}
          ${e.duree ? `<p class="etape-duree">${fr(e.duree)}</p>` : ''}
        </div>
      </li>`).join('')}
    </ol>
    <figure class="figure seance-figure" data-figure>
      ${photo(images, T.fig[1], { classe: 'figure-photo' })}
      <figcaption><b>Fig. 2</b> Photo d’ambiance, ${fr(images[T.fig[1]]?.sujet || '')}.</figcaption>
    </figure>
  </div>
</section>`;

  // 4. ce que vous y trouverez (seulement si le praticien l'a écrit)
  const sectionApports = apports.length ? `
<section class="rubrique apports" id="apports" aria-labelledby="t-apports">
  ${entete('apports', 'Ce que vous y trouverez', 'gauche')}
  <ul class="index" role="list">
    ${apports.map((a, i) => `<li class="index-ligne"><span class="index-num">${n2(i + 1)}</span><h3>${fr(a.titre)}</h3><p>${fr(a.texte)}</p></li>`).join('')}
  </ul>
</section>` : '';

  // 5. infos pratiques
  const sectionTarifs = `
<section class="rubrique tarifs" id="tarifs" aria-labelledby="t-tarifs">
  ${entete('tarifs', 'Infos pratiques', 'droite')}
  <div class="carnet">
    <div class="carnet-tarifs">
      <p class="carnet-label">Tarifs</p>
      ${tarifs.length ? `<ul role="list">${tarifs.map((t) => `<li><span>${fr(t.nom)}</span><b>${fr(t.prix || 'Sur demande')}</b></li>`).join('')}</ul>` : `<p class="carnet-vide">${vide('Ici, vos séances et leurs tarifs.')}</p>`}
    </div>
    <dl class="carnet-infos">
      <div><dt>Accueil</dt><dd>${fr(d.rdv || 'Sur rendez-vous')}</dd></div>
      <div><dt>Première séance</dt><dd>${d.dureePremiere ? fr(d.dureePremiere) : vide('Ici, sa durée.')}</dd></div>
      <div><dt>Suivi</dt><dd>${d.dureeSuivi ? fr(d.dureeSuivi) : vide('Ici, le rythme des rendez-vous.')}</dd></div>
      <div><dt>Règlement</dt><dd>${d.paiementListe ? fr(d.paiementListe.charAt(0).toUpperCase() + d.paiementListe.slice(1)) : vide('Ici, les moyens de paiement.')}</dd></div>
    </dl>
    <svg class="badge badge-carnet" viewBox="0 0 200 200" aria-hidden="true" data-badge>
      <defs><path id="cercle2" d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0"/></defs>
      <circle cx="100" cy="100" r="96" class="badge-fond"/>
      <text><textPath href="#cercle2" textLength="486" lengthAdjust="spacing">${esc(typo('Sur rendez-vous · Sur rendez-vous · '))}</textPath></text>
      <text x="100" y="116" text-anchor="middle" class="badge-centre">✦</text>
    </svg>
  </div>
</section>`;

  // 6. le portrait
  const sectionPortrait = `
<section class="rubrique portrait" id="portrait" aria-labelledby="t-portrait">
  ${entete('portrait', 'Le portrait', 'gauche')}
  <div class="portrait-grille">
    <figure class="portrait-cadre" data-figure>
      <div class="portrait-vide"><span class="portrait-initiales" aria-hidden="true">${esc(d.initiales || '')}</span><figcaption>Ici, votre portrait<small>une photo de vous, dans votre lumière</small></figcaption></div>
    </figure>
    <div class="portrait-texte">
      <p class="portrait-nom">${fr(nom)}</p>
      <p class="portrait-metier">${fr(sousTitre)}</p>
      ${apropos.length ? apropos.map((p, i) => (i === 0 ? lettrine(p) : `<p>${fr(p)}</p>`)).join('') : `${lettrine('Ici, votre parcours.')}<p>${vide('Ce qui vous a menée à ce métier, vos formations, ce qui vous tient à cœur.')}</p>`}
    </div>
  </div>
</section>`;

  // 7. rendez-vous
  const sectionRdv = `
<section class="rdv" id="rdv" aria-labelledby="t-rdv">
  <div class="rdv-haut">
    <p class="rubrique-label"><span>Rubrique ${num.rdv}</span><span class="filet" aria-hidden="true"></span><span>Rendez-vous</span></p>
    <h2 class="rdv-titre" id="t-rdv">Appelez.</h2>
  </div>
  ${tel ? `<a class="rdv-tel" href="${esc(telLien)}" data-ajuste style="--n:${tel.length}"><span>${fr(tel)}</span></a>` : `<p class="rdv-tel-vide">${vide('Ici, votre numéro de téléphone.')}</p>`}
  <div class="rdv-infos">
    <dl>
      <div><dt>Lieu</dt><dd>${lieuComplet ? fr(lieuComplet) : vide('Ici, l’adresse de votre cabinet.')}</dd></div>
      <div><dt>Accueil</dt><dd>${fr(d.rdv || 'Sur rendez-vous')}</dd></div>
      <div><dt>Horaires</dt><dd>${vide('Ici, vos jours et heures.')}</dd></div>
    </dl>
    <div class="rdv-actions">
      ${tel ? `<a class="bouton" href="${esc(telLien)}">${fr(d.appeler || 'Appeler')}</a>` : ''}
      ${liens.map((l) => `<a class="bouton bouton-creux" href="${esc(l.url)}" target="_blank" rel="noopener">${fr(l.texte)} <span aria-hidden="true">↗</span></a>`).join('')}
    </div>
  </div>
  ${d.cerf ? `<p class="rdv-phrase">${fr(d.cerf)}</p>` : ''}
  <div class="bandeau bandeau-rdv" aria-hidden="true"><div class="bandeau-piste" data-bandeau data-sens="-1">${'<span>Prendre rendez-vous</span><i>✦</i>'.repeat(8)}</div></div>
</section>`;

  const apercu = `Aperçu préparé pour ${nom}. Textes, photos, couleurs : tout se modifie selon vos goûts.`;
  const colophon = `
<footer class="colophon">
  <p class="colophon-titre">Colophon</p>
  <dl class="colophon-grille">
    <div><dt>Ce numéro</dt><dd>${fr(apercu)}</dd></div>
    <div><dt>Rédaction</dt><dd>${fr(nom)}${metier ? `, ${fr(metier.toLowerCase())}` : ''}</dd></div>
    <div><dt>Lieu</dt><dd>${lieuComplet ? fr(lieuComplet) : 'À compléter'}</dd></div>
    <div><dt>Contact</dt><dd>${tel ? `<a href="${esc(telLien)}">${fr(tel)}</a>` : 'À compléter'}</dd></div>
    <div><dt>Images</dt><dd>Photos d’ambiance Unsplash, objets détourés par nos soins</dd></div>
    ${d.siret ? `<div><dt>SIRET</dt><dd>${esc(d.siret)}</dd></div>` : ''}
  </dl>
  <p class="colophon-avert">${fr(d.avertissement || '')}</p>
  <p class="colophon-fin"><span>N°${NB}01</span><a href="#couverture">Revenir à la couverture ↑</a><span>Maquette non publiée</span></p>
</footer>`;

  const tete = `
<a class="evitement" href="#approche">Aller au contenu</a>
<header class="tete" data-tete>
  <a class="tete-num" href="#couverture" aria-label="Revenir à la couverture">N°${NB}01</a>
  <p class="tete-nom">${fr(nom)}</p>
  <div class="tete-droite">
    <button class="tete-sommaire" type="button" aria-expanded="false" aria-controls="sommaire-plein" data-sommaire-bouton>Sommaire</button>
    ${tel ? `<a class="tete-appel" href="${esc(telLien)}">Appeler</a>` : ''}
  </div>
  <span class="tete-progression" aria-hidden="true" data-progression></span>
</header>
<div class="sommaire-plein" id="sommaire-plein" hidden data-sommaire>
  <p class="sommaire-plein-titre">Sommaire</p>
  <ol role="list">${rubriques.map(([k, t]) => `<li><a href="#${k}"><b>${num[k]}</b><span>${fr(t)}</span></a></li>`).join('')}</ol>
</div>`;

  return {
    famille,
    accent: T.accent,
    titre: `${nom} · ${[metier, lieu].filter(Boolean).join(' à ')}`,
    description: accroche || `${metier}${lieu ? ' à ' + lieu : ''}, sur rendez-vous.`,
    html: `${tete}<main id="contenu">${couverture}${sectionApproche}${sectionCitation}${sectionSeance}${sectionApports}${sectionTarifs}${sectionPortrait}${sectionRdv}</main>${colophon}`,
    precharge: `images/${T.couverture}-objet-600.webp`,
  };
}
