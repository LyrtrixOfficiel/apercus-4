// Mathéo Bringia : les gabarits HTML, partagés par les pages (avec JavaScript) et par outils/generer.mjs (sans).
// Fonctions pures : elles reçoivent des données et rendent du texte HTML, sans toucher au document.

// Les pages, dans l'ordre du plan du site de Mathéo (croquis du 23/10/2026), plus Calendrier et Actus.
export const PAGES = [
  { id: 'accueil', href: 'index.html', nom: 'Accueil', sous: 'Infos, dernière course' },
  { id: 'pilote', href: 'pilote.html', nom: 'Le pilote', sous: 'Classement, championnat, palmarès' },
  { id: 'calendrier', href: 'calendrier.html', nom: 'Calendrier', sous: 'Prochaines courses, résultats' },
  { id: 'actus', href: 'actus.html', nom: 'Actus', sous: 'Au fil des courses' },
  { id: 'galerie', href: 'galerie.html', nom: 'Galerie', sous: 'Photos, vidéos, événements' },
  { id: 'partenaires', href: 'partenaires.html', nom: 'Partenaires', sous: 'Ils roulent avec lui' },
  { id: 'contact', href: 'contact.html', nom: 'Contact', sous: 'Rejoindre l’aventure' },
];

export const esc = (t) => String(t ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  .replace(/ ([:;?!»])/g, '\u00a0$1').replace(/« /g, '«\u00a0');
const badge = (x) => (x && x.exemple ? ' <span class="badge-exemple" title="Exemple de maquette, à confirmer">exemple</span>' : '');
const ext = (lien, texte, cls = '') => `<a class="${cls}" href="${esc(lien)}" target="_blank" rel="noopener">${texte}<span class="sr"> (nouvel onglet)</span></a>`;

/** La navigation, identique sur toutes les pages : le logo, et un menu burger qui ouvre la navigation plein écran.
 * `page` : id de la page courante (article compte comme actus). Sans JavaScript, le menu marche aussi (<details>). */
export function navHTML(page) {
  const cur = page === 'article' ? 'actus' : page;
  return `<header class="entete" data-entete>
  <a class="marque" href="index.html" aria-label="Mathéo Bringia, accueil">
    <img class="marque-logo" src="img/logo/mb-128.png" alt="" width="128" height="125">
    <span class="marque-nom">Mathéo <b>Bringia</b></span>
    <span class="marque-num" aria-hidden="true">15</span>
  </a>
  <a class="bouton bouton-orange entete-cta" href="partenaires.html#devenir"><span>Devenir partenaire</span></a>
  <details class="menu">
    <summary aria-label="Menu"><span class="menu-mot">Menu</span><span class="menu-traits" aria-hidden="true"><i></i><i></i><i></i></span></summary>
    <div class="menu-panneau">
      <div class="menu-fond" aria-hidden="true"><img src="img/logo/mb-512.png" alt="" width="512" height="500" loading="lazy"></div>
      <nav class="menu-nav" aria-label="Navigation principale"><ol>${PAGES.map((p, i) => `<li style="--i:${i}"><a href="${p.href}"${p.id === cur ? ' aria-current="page"' : ''}><span class="menu-n" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span><span class="menu-nom">${p.nom}</span><span class="menu-sous hud">${p.sous}</span></a></li>`).join('')}</ol></nav>
      <div class="menu-cote">
        <p class="hud">Prochaine course</p>
        <p class="menu-course">FRKC Indoor 2027</p>
        <p class="hud">5 au 7 février 2027 · Metz Kart Indoor</p>
        <a class="bouton bouton-orange" href="partenaires.html#devenir"><span>Devenir partenaire</span></a>
        <a class="bouton bouton-ligne" href="contact.html"><span>Rejoindre l’aventure</span></a>
        <p class="menu-pied hud">MB 15 · Karting de location · FRKC · CRKI</p>
      </div>
    </div>
  </details>
</header>`;
}

/** Le bandeau des partenaires (en bas de CHAQUE page, demandé par Mathéo) : les noms en texte, avec leur lien. */
export function bandeauHTML(partenaires) {
  const nom = (p) => (p.lien ? `<a href="${esc(p.lien)}" target="_blank" rel="noopener">${esc(p.nom)}<span class="sr"> (nouvel onglet)</span></a>` : `<span>${esc(p.nom)}</span>`);
  const liste = partenaires.map((p) => `<li>${nom(p)}</li>`).join('<li class="bandeau-sep" aria-hidden="true">/</li>');
  return `<section class="bandeau" aria-label="Les partenaires de Mathéo Bringia">
  <p class="hud bandeau-titre">Ils roulent avec Mathéo <a href="partenaires.html">Tous les partenaires</a></p>
  <div class="bandeau-piste"><ul class="bandeau-liste">${liste}</ul><ul class="bandeau-liste bandeau-copie" aria-hidden="true">${partenaires.map((p) => `<li><span>${esc(p.nom)}</span></li>`).join('<li class="bandeau-sep">/</li>')}</ul></div>
</section>`;
}

/** Le pied de page, identique partout (avec le bandeau des partenaires au-dessus). */
export function piedHTML(pilote, partenaires = []) {
  const res = (pilote?.reseaux || []).map((r) => `<li>${ext(r.lien, `${esc(r.nom)} <span class="hud">${esc(r.compte)}</span>`)}</li>`).join('');
  return `${bandeauHTML(partenaires)}
<footer class="pied" data-ambiance="pied">
  <div class="pied-tete"><img class="pied-logo" src="img/logo/mb-256.webp" alt="Logo MB de Mathéo Bringia" width="256" height="250" loading="lazy"><div class="pied-geant" aria-hidden="true">BRINGIA</div></div>
  <div class="pied-grille">
    <div class="pied-bloc">
      <p class="hud">Pilote de karting · n°15</p>
      <p class="pied-titre">Mathéo Bringia</p>
      <p class="pied-txt">Karting de location : FRKC, CRKI. Prochaine course : FRKC Indoor 2027, Metz Kart Indoor.</p>
      <a class="bouton bouton-orange" href="contact.html"><span>Rejoindre l’aventure</span></a>
    </div>
    <nav class="pied-bloc" aria-label="Plan du site"><p class="hud">Pages</p><ul>${PAGES.map((p) => `<li><a href="${p.href}">${p.nom}</a></li>`).join('')}</ul></nav>
    <div class="pied-bloc"><p class="hud">Le suivre</p><ul>${res}</ul><p class="hud pied-contact"><a href="contact.html">Écrire à Mathéo</a></p></div>
  </div>
  <div class="pied-bas">
    <p>Images : reel « Race Recap » du FRKC Outdoor 2026 par Driver Performance Lab, et reel studio de @matheo.bringia. Résultats : classements officiels FRKC et CRKI (Silverlane Events). Les chiffres de télémétrie de l’accueil sont des exemples.</p>
    <p class="hud">Maquette Kazura · 2026 · Les badges « exemple » signalent ce qui reste à confirmer</p>
  </div>
</footer>`;
}

// ---------- accueil et pages ----------

export function chiffreHTML(c, i) {
  return `<li class="chiffre apparait" style="--i:${i}">
  <span class="chiffre-v">${esc(c.valeur)}${c.unite ? `<small>${esc(c.unite)}</small>` : ''}</span>
  <span class="chiffre-l">${esc(c.legende)}</span>
  <span class="chiffre-d hud">${esc(c.detail)}</span>
</li>`;
}

/** Une image d'actu : un chemin ('medias/photos/x'), ou l'ancien nom court d'une image de img/photos/. */
export const cheminImage = (i) => (String(i).includes('/') ? i : `img/photos/${i}`);

const ICO_FLECHE = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2"/></svg>';

export function carteActuHTML(a, dateActu, { niveau = 'h3', grande = false } = {}) {
  const img = a.image ? `<div class="carte-img"><img src="${esc(cheminImage(a.image))}-480.webp" alt="" width="480" height="360" loading="lazy" decoding="async"></div>` : '';
  return `<article class="carte-actu apparait${grande ? ' grande' : ''}">
  <a href="article.html?id=${esc(a.id)}#${esc(a.id)}">
    ${img}
    <div class="carte-corps">
      <p class="carte-meta hud"><span>${esc(dateActu(a.date))}</span><span class="carte-rub">${esc(a.rubrique)}</span>${badge(a)}</p>
      <${niveau} class="carte-titre">${esc(a.titre)}</${niveau}>
      <p class="carte-chapo">${esc(a.chapo)}</p>
      <span class="carte-lire hud">Lire ${ICO_FLECHE}</span>
    </div>
  </a>
</article>`;
}

const STATUT = { inscrit: 'Inscrit, confirmé', prevu: 'Prévu', objectif: 'Objectif' };
const TYPE = { frkc: 'FRKC', crki: 'CRKI', mondial: 'Mondial', autre: 'Course' };

/** Une course à venir (accueil et calendrier). */
export function courseHTML(c, cal, i = 0) {
  const p = cal.pastille(c);
  return `<li class="course apparait" style="--i:${i}" data-type="${esc(c.type)}">
  <div class="course-date" aria-hidden="true"><span class="course-j">${esc(p.j)}</span><span class="course-m">${esc(p.m)}</span><span class="course-a">${esc(p.a)}</span></div>
  <div class="course-corps">
    <p class="course-meta hud"><span class="course-type">${esc(TYPE[c.type] || 'Course')}</span>${c.statut ? `<span class="course-statut s-${esc(c.statut)}">${esc(STATUT[c.statut] || c.statut)}</span>` : ''}${badge(c)}</p>
    <h3 class="course-nom">${esc(c.nom)}</h3>
    <p class="course-lieu"><span class="sr">Date : ${esc(cal.dateTexte(c))}. Lieu : </span>${esc(c.lieu)}, ${esc(c.ville)}</p>
    ${c.detail ? `<p class="course-detail">${esc(c.detail)}</p>` : ''}
    ${c.lien ? ext(c.lien, `Page officielle ${ICO_FLECHE}`, 'course-lien hud') : ''}
  </div>
</li>`;
}

/** Une course passée (résultats du calendrier). */
export function resultatHTML(c, cal, i = 0) {
  return `<li class="resultat apparait" style="--i:${i}" data-type="${esc(c.type)}">
  <span class="resultat-annee hud">${esc(cal.dateTexte(c))}</span>
  <div class="resultat-corps">
    <h3 class="resultat-nom">${esc(c.nom)}${badge(c)}</h3>
    <p class="resultat-lieu">${esc(c.lieu)}, ${esc(c.ville)}</p>
    ${c.detail ? `<p class="resultat-detail">${esc(c.detail)}</p>` : ''}
  </div>
  <span class="resultat-pos">${esc(c.resultat)}</span>
</li>`;
}

export function partenaireHTML(p, i = 0) {
  const nom = `<span class="partenaire-nom">${esc(p.nom)}</span>`;
  const site = p.lien
    ? ext(p.lien, `Son site ${ICO_FLECHE}`, 'partenaire-site hud')
    : '<span class="partenaire-site hud a-completer">Site à compléter</span>';
  return `<li class="partenaire r-${esc(p.rang)} apparait" style="--i:${i % 6}">
  ${p.lien ? ext(p.lien, nom, 'partenaire-lien') : nom}
  ${p.texte || p.exemple ? `<span class="partenaire-txt">${esc(p.texte)}${badge(p)}</span>` : ''}
  ${site}
</li>`;
}

/** L'accueil : les VIP en grand, les autres rangs en une ligne chacun. */
export function partenairesCourtHTML(PAR) {
  const vip = PAR.duRang('vip');
  const autres = PAR.RANGS.filter((r) => r.id !== 'vip' && PAR.duRang(r.id).length).map((r) => `<p class="rang-ligne"><span class="hud">${esc(r.nom)}</span>${PAR.duRang(r.id).map((p) => (p.lien ? ext(p.lien, esc(p.nom)) : `<span>${esc(p.nom)}</span>`)).join('<i aria-hidden="true">/</i>')}</p>`).join('');
  return `<div class="rang rang-vip"><p class="rang-titre"><span>VIP</span><i aria-hidden="true"></i><span class="hud">${vip.length}</span></p><ul class="liste-partenaires">${vip.map(partenaireHTML).join('')}</ul></div>
<div class="rang-lignes">${autres}</div>`;
}

/** Les partenaires, rang par rang (VIP, Premium, Prestige, Académie, Équipement). */
export function partenairesParRangHTML(PAR) {
  return PAR.RANGS.filter((r) => PAR.duRang(r.id).length).map((r) => `<div class="rang rang-${esc(r.id)}">
  <p class="rang-titre"><span>${esc(r.nom)}</span><i aria-hidden="true"></i><span class="hud">${PAR.duRang(r.id).length}</span></p>
  <ul class="liste-partenaires">${PAR.duRang(r.id).map(partenaireHTML).join('')}</ul>
</div>`).join('\n');
}

const aCompleter = (t = 'À compléter') => `<span class="a-completer">${esc(t)}</span>`;

/** L'Académie (page Pilote). */
export function academieHTML(x) {
  return `<div class="carte-info apparait">
  <p class="hud">${esc(x.titre)}${badge(x)}</p>
  <p class="carte-info-nom">${x.lien ? ext(x.lien, esc(x.nom)) : esc(x.nom)}</p>
  <p class="carte-info-txt">${esc(x.texte)}</p>
  <ul>${(x.points || []).map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
  ${x.lien ? ext(x.lien, `Son site ${ICO_FLECHE}`, 'partenaire-site hud') : ''}
</div>`;
}
/** Le parrain (page Pilote) : sobre, la présentation reste « à compléter » tant qu'elle est vide. */
export function parrainHTML(x) {
  return `<div class="carte-info apparait">
  ${x.photo ? `<figure class="carte-info-photo"><img src="${esc(x.photo)}-480.webp" alt="${esc(x.legende || '')}" width="480" height="640" loading="lazy"><figcaption class="hud">${esc(x.legende || '')}</figcaption></figure>` : ''}
  <p class="hud">${esc(x.titre)}</p>
  <p class="carte-info-nom">${esc(x.nom)}</p>
  <p class="carte-info-txt">${x.presentation ? esc(x.presentation) : aCompleter('Présentation à compléter')}</p>
</div>`;
}
/** Ambassadeur (page Pilote). */
export function ambassadeurHTML(x) {
  return `<div class="carte-info apparait">
  <p class="hud">${esc(x.titre)}${badge(x)}</p>
  <p class="carte-info-nom">${x.lien ? ext(x.lien, esc(x.nom)) : esc(x.nom)}</p>
  <p class="carte-info-txt">${esc(x.texte)}</p>
  <ul><li>Son rôle : ${x.role ? esc(x.role) : aCompleter()}</li><li>Le site : ${x.lien ? ext(x.lien, esc(x.lien.replace(/^https?:\/\/(www\.)?/, ''))) : aCompleter()}</li></ul>
</div>`;
}

/** Une mosaïque de photos (galerie). */
export function mosaiqueHTML(photos) {
  return photos.map((p, i) => `<figure class="${esc(p.forme || '')} apparait" style="--i:${i % 4}"><button type="button" data-grand="${esc(p.fichier)}.webp" aria-label="Agrandir : ${esc(p.legende)}"><img src="${esc(p.fichier)}-480.webp" alt="${esc(p.legende)}" loading="lazy" width="480" height="480"></button><figcaption>${esc(p.legende)}</figcaption></figure>`).join('\n');
}

/** Les cartes des événements (galerie). */
export function evenementHTML(a, nPhotos, nVideos, i = 0) {
  const quoi = a.a_venir ? 'Photos après la course' : [nPhotos ? `${nPhotos} photo${nPhotos > 1 ? 's' : ''}` : '', nVideos ? `${nVideos} vidéo${nVideos > 1 ? 's' : ''}` : ''].filter(Boolean).join(' · ');
  const visuel = a.couverture ? `<img src="${esc(a.couverture)}-480.webp" alt="" width="480" height="480" loading="lazy">` : '<span class="evenement-vide" aria-hidden="true">MB</span>';
  return `<li class="evenement${a.a_venir ? ' a-venir' : ''} apparait" style="--i:${i}"><a href="${a.a_venir ? 'calendrier.html' : `#album-${esc(a.id)}`}">${visuel}<span class="hud">${esc(a.date)} · ${esc(a.lieu)}</span><strong>${esc(a.titre)}</strong><span class="evenement-n hud">${esc(quoi)}</span></a></li>`;
}

export function emplacementHTML(e, i = 0) {
  return `<li class="emplacement apparait" style="--i:${i}">
  <span class="emplacement-n hud">${String(i + 1).padStart(2, '0')} · ${esc(e.repere)}</span>
  <h3 class="emplacement-titre">${esc(e.titre)}</h3>
  <p>${esc(e.texte)}</p>
</li>`;
}

export function palmaresHTML(p, i = 0) {
  return `<li class="palmares-ligne apparait${p.fort ? ' fort' : ''}" style="--i:${i}">
  <span class="palmares-annee hud">${esc(p.annee)}</span>
  <div><h3 class="palmares-titre">${esc(p.titre)}${badge(p)}</h3><p class="palmares-detail">${esc(p.detail)}</p></div>
  <span class="palmares-res">${esc(p.resultat)}</span>
</li>`;
}

export function equipementHTML(e, i = 0) {
  return `<li class="equipement apparait" style="--i:${i}"><span class="hud">${esc(e.quoi)}</span><strong>${esc(e.marque)}</strong><p>${esc(e.detail)}</p></li>`;
}

/** L'article complet (page article.html). Sans JavaScript, la page les montre tous, chacun à son ancre. */
export function articleHTML(a, dateActu, { premier = false } = {}) {
  const fig = a.image ? `<figure class="article-fig"><img src="${esc(cheminImage(a.image))}.webp" alt="" width="1600" height="1067" ${premier ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async"></figure>` : '';
  return `<article class="article" id="${esc(a.id)}" aria-labelledby="t-${esc(a.id)}">
  <header class="article-tete">
    <p class="hud article-meta"><span>${esc(dateActu(a.date))}</span><span class="carte-rub">${esc(a.rubrique)}</span>${badge(a)}</p>
    <h1 class="article-titre" id="t-${esc(a.id)}">${esc(a.titre)}</h1>
    <p class="article-chapo">${esc(a.chapo)}</p>
  </header>
  ${fig}
  <div class="article-texte">${(a.texte || []).map((t) => `<p>${esc(t)}</p>`).join('')}
    ${a.source ? `<p class="article-source hud">Source : ${ext(a.source, 'page officielle')}</p>` : ''}
  </div>
</article>`;
}

// ---------- le circuit (Circuit International Anthoine Hubert, Angerville) ----------
// Points lus sur le plan officiel (RECHERCHE.md), dans l'ordre de course, de 0 à 1 ; boîte de 2,1 pour 1.
export const CIRCUIT = [[0.57, 0.98], [0.04, 0.98], [0.01, 0.90], [0.19, 0.06], [0.25, 0.01], [0.31, 0.14], [0.29, 0.43], [0.20, 0.53],
  [0.16, 0.63], [0.18, 0.82], [0.37, 0.83], [0.39, 0.75], [0.33, 0.53], [0.34, 0.25], [0.40, 0.13], [0.48, 0.10], [0.96, 0.45],
  [0.98, 0.59], [0.81, 0.96], [0.75, 0.94], [0.82, 0.63], [0.76, 0.47], [0.51, 0.28], [0.42, 0.41], [0.46, 0.71], [0.51, 0.78],
  [0.64, 0.63], [0.69, 0.71]];

/** Le tracé en chemin SVG lissé (Catmull-Rom fermée), dans une boîte l x h avec une marge. */
export function cheminCircuit(l = 1000, h = 476, marge = 18) {
  const P = CIRCUIT.map(([x, y]) => [marge + x * (l - 2 * marge), marge + y * (h - 2 * marge)]);
  const n = P.length, f = (v) => v.toFixed(1);
  let d = `M${f(P[0][0])} ${f(P[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = P[(i - 1 + n) % n], p1 = P[i], p2 = P[(i + 1) % n], p3 = P[(i + 2) % n];
    const t = 1 / 6;
    d += `C${f(p1[0] + (p2[0] - p0[0]) * t)} ${f(p1[1] + (p2[1] - p0[1]) * t)} ${f(p2[0] - (p3[0] - p1[0]) * t)} ${f(p2[1] - (p3[1] - p1[1]) * t)} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d + 'Z';
}
