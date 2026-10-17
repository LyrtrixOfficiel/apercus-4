// Nature : rendu de la page depuis la fiche JSON d'un praticien.
// Meme module dans le navigateur (?p=<dossier>) et dans node (batir.mjs ecrit la
// page par defaut en dur : elle se lit sans JavaScript).
// La page se raconte comme une promenade : la prairie, un herbier (son approche),
// un sentier (la seance), des sachets de graines (les tarifs), une fenetre (qui il ou elle est).
import { graine, hasard, fleurette, pierre, graines } from './botanique.js';
import { ESPECES, NOMS_ESPECES, especesPour, liane, cadreArche } from './herbier.js';
import { IMAGES } from './univers.js';
import { nettoyer, sansRedites, titreSansDoublon } from '../../commun/phrases.js';

// Tirets cadratin et demi-cadratin, ecrits par leur code : jamais dans le texte rendu.
const TIRETS = new RegExp('[' + String.fromCharCode(8211, 8212) + ']', 'g');
const ENT = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s = '') => String(s ?? '').replace(/[&<>"']/g, (c) => ENT[c]);
const fr = (s = '') => esc(s).replace(/ ([:;!?»])/g, ' $1').replace(/« /g, '« ').replace(TIRETS, ',').replace(/rendez-vous/g, 'rendez‑vous');
const lien = (u) => (/^https?:\/\//i.test(u || '') ? esc(u) : '');
const place = (t) => /^Ici,/.test((t || '').trim());
const de = (nom) => (/^[aeiouyhàâäéèêëîïôöùûü]/i.test(nom || '') ? 'd’' : 'de ') + nom;

// Les mots du praticien rangés par la règle commune (commun/phrases.js) : promesses de santé retirées,
// doublons, phrase d'ouverture choisie ; les phrases de prix ou de durée de son approche rejoignent les tarifs.
const approcheRangee = (d) => nettoyer(d).phrases;
const parcours = (d) => sansRedites((d.apropos || []).filter(Boolean), [d.cerf]);

// Un nom a l'envers (« Meyer Sandrine ») est remis a l'endroit quand ses propres textes disent « Sandrine Meyer ».
export function aLEndroit(d) {
  const mots = String(d?.nom || '').trim().split(/\s+/);
  if (mots.length !== 2) return d;
  const textes = [d.accroche, d.conviction, ...(d.approche || []), ...(d.apropos || [])].join(' ');
  if (!textes.includes(mots[1] + ' ' + mots[0])) return d;
  return { ...d, nom: mots[1] + ' ' + mots[0], initiales: (mots[1][0] + mots[0][0]).toUpperCase() };
}

export function titre(d) { return `${d.nom} · ${d.metier}${d.ville ? ' à ' + d.ville : ''}`; }
export function description(d) { return nettoyer(d).accroche || `${d.metier}${d.ville ? ' à ' + d.ville : ''}, sur rendez-vous.`; }

// Le chargement : une graine qui germe sous les initiales (hors de #site, pour ne pas repartir a zero).
// Une coupe de terre au soleil du matin : les racines descendent, la tige monte, deux cotyledons
// s'ouvrent, puis la premiere vraie feuille ; une goutte de rosee s'allume au bout d'une feuille.
export function chargement(d) {
  return `<div class="graine" id="graine" aria-hidden="true">
  <div class="graine-scene">
    <p class="graine-initiales" id="graine-initiales">${esc(d.initiales || '')}</p>
    <svg class="graine-dessin" viewBox="0 0 200 170" focusable="false">
      <defs>
        <radialGradient id="graine-g-jour" cx="50%" cy="50%" r="50%"><stop class="gj0" offset="0"/><stop class="gj1" offset="1"/></radialGradient>
        <radialGradient id="graine-g-terre" cx="50%" cy="0%" r="62%"><stop class="gt0" offset="0"/><stop class="gt1" offset="1"/></radialGradient>
      </defs>
      <circle class="graine-jour" cx="100" cy="78" r="74" fill="url(#graine-g-jour)"/>
      <path class="graine-terre" d="M8 110C58 103 142 103 192 110V170H8Z" fill="url(#graine-g-terre)"/>
      <path class="graine-sol" d="M12 110C60 103 140 103 188 110"/>
      <path class="graine-miette" d="M40 122h2M62 134h2.5M146 126h2M158 140h2.5M74 152h2M128 156h2"/>
      <path class="graine-racine r1" pathLength="1" d="M99 125C97 135 91 143 84 155"/>
      <path class="graine-racine r2" pathLength="1" d="M100 126C102 139 100 150 103 163"/>
      <path class="graine-racine r3" pathLength="1" d="M101 125C107 132 115 138 120 149"/>
      <ellipse class="graine-grain" cx="100" cy="121" rx="7.5" ry="4.6" transform="rotate(-12 100 121)"/>
      <path class="graine-tige" pathLength="1" d="M100 118C100 103 97 91 100 71"/>
      <path class="graine-cotyledon gauche" d="M100 73C88 71 76 62 73 49C87 49 98 57 100 73Z"/>
      <path class="graine-cotyledon droite" d="M100 71C109 62 122 58 131 62C127 72 113 77 100 71Z"/>
      <path class="graine-feuille" d="M100 71C95 61 96 50 103 41C109 51 107 62 100 71Z"/>
      <circle class="graine-rosee" cx="129.5" cy="63.5" r="2.3"/>
    </svg>
  </div>
</div>`;
}

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

// Fond d'accueil sans WebGL ni JavaScript : des collines et des herbes en SVG (couleurs de la palette).
function collines(seed) {
  let herbes = '';
  const r = hasard(seed);
  for (let i = 0; i < 90; i++) {
    const x = r() * 1440, h = 40 + r() * 120, c = (r() - .5) * 60;
    herbes += `M${Math.round(x)} 400Q${Math.round(x + c * .3)} ${Math.round(400 - h * .6)} ${Math.round(x + c)} ${Math.round(400 - h)}Q${Math.round(x + c * .3 + 6)} ${Math.round(400 - h * .55)} ${Math.round(x + 9)} 400Z`;
  }
  return `<svg class="collines" viewBox="0 0 1440 400" preserveAspectRatio="none" aria-hidden="true" focusable="false">
    <path class="c1" d="M0 170C220 120 420 150 640 130S1100 90 1440 140V400H0Z"/>
    <path class="c2" d="M0 240C260 200 520 230 760 205S1180 180 1440 220V400H0Z"/>
    <path class="c3" d="M0 310C300 280 600 300 900 285S1260 270 1440 300V400H0Z"/>
    <path class="c4" d="${herbes}"/>
  </svg>`;
}

function nomDecoupe(nom) {
  const mots = String(nom || '').trim().split(/\s+/);
  return mots.map((m, k) => `<span class="mot${k === mots.length - 1 && mots.length > 1 ? ' mot-fin' : ''}">${esc(m)}</span>`).join(' ');
}
const longueurNom = (nom) => (nom.length > 34 ? ' nom-tres-long' : nom.length > 22 ? ' nom-long' : '');

function accueil(d) {
  const lieu = [d.metier, d.ville].filter(Boolean).map(esc).join(' <span aria-hidden="true">·</span> ');
  const doublon = d.ville && (d.accroche || '').toLowerCase().includes(d.ville.toLowerCase());
  return `
<section class="accueil" id="accueil" aria-label="Accueil">
  <div class="jour" aria-hidden="true"><span class="soleil"></span><span class="rayons"></span><span class="rayons rayons-2"></span></div>
  <div class="brume" aria-hidden="true"></div>
  ${collines(graine(d.dossier || d.nom))}
  <div class="accueil-texte">
    ${doublon ? '' : `<p class="metier-lieu">${lieu}</p>`}
    <h1 class="nom${longueurNom(d.nom || '')}" id="nom" data-pousse>${nomDecoupe(d.nom)}</h1>
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

const titreSection = (texte, id, classe = '') => `<h2 class="titre${classe}" data-respire id="${id}-titre">${fr(texte)}</h2>`;

// ---------- L'approche : un herbier dont chaque theme est une planche ----------
function approche(d) {
  const { phare, reste } = approcheRangee(d);
  const apports = (d.apports || []).filter((a) => a && a.titre);
  const s = graine(d.nom + 'herbier');
  const collection = `Herbier ${esc(de(d.nom))}${d.ville ? ', ' + esc(d.ville) : ''}`;
  const rots = [-1.6, 1.1, -.4, 1.8, -1.1, .6];
  const especes = especesPour(apports.length ? apports : [{ titre: '' }], s);
  const planche = (a, i, vide) => {
    // la première planche est dessinée tout de suite ; les suivantes, cachées dessous, après l'ouverture (dessinsDifferes)
    const [nom, latin] = NOMS_ESPECES[especes[i]];
    const sp = { nom, latin }, dessin = i === 0 ? ESPECES[especes[i]](s + i * 101).svg : '';
    return `
        <li class="planche${vide ? ' planche-vide' : ''}" style="--rot:${rots[i % rots.length]}deg" data-i="${i}">
          <div class="planche-papier">
            <div class="planche-specimen" aria-hidden="true"${i ? ` data-espece="${especes[i]}" data-graine="${s + i * 101}"` : ''}>${dessin}</div>
            <div class="planche-etiquette">
              <p class="planche-collection">${collection}</p>
              ${vide
                ? `<h3>Ici, les thèmes de votre accompagnement</h3><p>Chacun sur sa planche, avec vos mots : ce que vos séances apportent.</p>`
                : `<h3>${fr(a.titre)}</h3><p>${fr(a.texte)}</p>`}
              <p class="planche-espece">${esc(sp.nom)}, <i>${esc(sp.latin)}</i></p>
            </div>
          </div>
        </li>`;
  };
  return `
<section class="section approche" id="approche" aria-labelledby="approche-titre">
  <div class="cadre approche-cadre">
    <div class="approche-texte">
      ${titreSection('L’approche', 'approche')}
      ${phare ? `<p class="phare" data-mots>${fr(phare)}</p>` : `<p class="phare emplacement-texte">Ici, votre approche avec vos mots : ce qui vous anime, votre façon d’accompagner.</p>`}
      ${reste.length ? `<div class="corps-texte">${reste.map((p) => `<p>${fr(p)}</p>`).join('')}</div>` : ''}
    </div>
    <div class="herbier${apports.length > 1 ? ' herbier-pile' : ''}" data-herbier>
      <ol class="planches" role="list" aria-label="Herbier : les thèmes de l’accompagnement">${apports.length ? apports.map((a, i) => planche(a, i, false)).join('') : planche(null, 0, true)}
      </ol>
    </div>
  </div>
</section>`;
}

// ---------- La seance : un sentier, chaque etape une halte ----------
function seance(d) {
  const etapes = (d.etapes || []).filter((e) => e && e.titre);
  const s = graine(d.nom + 'sentier');
  // Jamais « La séance » en titre puis « La séance » en première halte.
  const titre = titreSansDoublon('La séance', etapes.map((e) => e.titre), 'Le chemin d’une séance');
  return `
<section class="section seance" id="seance" aria-labelledby="seance-titre">
  <div class="cadre seance-tete">
    ${titreSection(titre, 'seance')}
  </div>
  <div class="cadre sentier" data-sentier>
    <svg class="sentier-trace" aria-hidden="true" focusable="false" preserveAspectRatio="none"><path class="sentier-chemin"/><path class="sentier-portee"/><path class="sentier-pas"/><path class="sentier-reflet"/><path class="sentier-ombre"/><path class="sentier-herbes"/><path class="sentier-herbes foncees"/><path class="sentier-fleurs"/><path class="sentier-coeurs"/></svg>
    <ol class="haltes" role="list">
      ${etapes.map((e, i) => `
      <li class="halte${place(e.texte) ? ' halte-place' : ''}">
        <svg class="halte-pierre" viewBox="0 0 64 26" aria-hidden="true" focusable="false"><path d="${pierre(s + i * 7)}"/></svg>
        <h3>${fr(e.titre)}</h3>
        <p>${fr(e.texte)}</p>
        ${e.duree ? `<p class="borne"><span>${fr(e.duree)}</span></p>` : ''}
      </li>`).join('')}
    </ol>
  </div>
</section>`;
}

// ---------- Les tarifs : des sachets de graines ----------
// La fenêtre du sachet : la fleur d'une planche botanique, cadrée de près.
const FLEURS_SACHET = ['camomille', 'coquelicot', 'millepertuis', 'eglantier', 'lavande'];
export function vignette(seed, i) {
  const sp = ESPECES[FLEURS_SACHET[(i + seed) % FLEURS_SACHET.length]](seed);
  const [x, y, l, h] = sp.fleur;
  return sp.svg.replace('viewBox="0 0 300 400"', `viewBox="${Math.round(x)} ${Math.round(y)} ${Math.round(l)} ${Math.round(h)}" preserveAspectRatio="xMidYMid slice"`).replace('class="specimen', 'class="specimen sachet-plante');
}
function tarifs(d) {
  const t = (d.tarifs || []).filter((x) => x && x.nom);
  const durees = [d.dureePremiere && `Première séance : ${d.dureePremiere}`, d.dureeSuivi && `Séances de suivi : ${d.dureeSuivi}`].filter(Boolean);
  const s = graine(d.nom + 'graines');
  const rots = [-2.4, 2, -1, 2.8];
  const sachet = (x, i, vide) => `
      <li class="sachet${vide ? ' sachet-vide' : ''}" style="--r:${rots[i % rots.length]}deg">
        <div class="sachet-enveloppe">
          <span class="sachet-rabat" aria-hidden="true"></span>
          <div class="sachet-fenetre" aria-hidden="true" data-vignette="${s + i * 37}:${i}"></div>
          <div class="sachet-texte">
            <h3>${vide ? 'Ici, vos séances' : fr(x.nom)}</h3>
            <p class="prix${vide || !/[0-9]/.test(x.prix || '') ? ' prix-texte' : ''}">${vide ? 'Vos tarifs' : fr(x.prix || 'Sur demande')}</p>
            ${vide ? '<p class="sachet-note">La durée de chaque séance et ce qu’elle comprend.</p>' : durees.length ? `<ul class="durees" role="list">${durees.map((u) => `<li>${fr(u)}</li>`).join('')}</ul>` : ''}
          </div>
          <p class="sachet-lieu" aria-hidden="true">${esc(d.ville || d.nom)}</p>
        </div>
      </li>`;
  return `
<section class="section tarifs" id="tarifs" aria-labelledby="tarifs-titre">
  <div class="cadre tarifs-cadre">
    <div class="tarifs-tete">
      ${titreSection('Tarifs', 'tarifs')}
      ${d.paiement ? `<p class="note">${fr(d.paiement)}</p>` : ''}
      ${approcheRangee(d).ecartes.map((p) => `<p class="note note-mots">${fr(p)}</p>`).join('')}
    </div>
    <div class="sachets-place">
      <ul class="sachets sachets-${Math.min(3, Math.max(1, t.length))}" role="list">${t.length ? t.map((x, i) => sachet(x, i, false)).join('') : sachet(null, 0, true)}
      </ul>
      ${graines(s, 11)}
    </div>
  </div>
</section>`;
}

// ---------- A propos : une fenetre en arche, un rameau qui grimpe ----------
function apropos(d) {
  const paras = parcours(d);
  const s = graine(d.nom + 'apropos');
  const portrait = /^(https?:[/][/]|images[/])/.test(d.portrait || '') ? d.portrait : IMAGES.arche;
  return `
<section class="section apropos" id="apropos" aria-labelledby="apropos-titre">
  <div class="cadre apropos-grille">
    <figure class="arche" aria-label="${d.portrait ? esc(d.nom) : 'Emplacement pour votre portrait'}">
      <div class="arche-fenetre" aria-hidden="true">${portrait ? `<img src="${esc(portrait)}" alt="" loading="lazy" decoding="async">` : ''}<span class="arche-lumiere"></span></div>
      <svg class="arche-plante" viewBox="-40 -48 480 630" aria-hidden="true" focusable="false" data-liane="${s}">${cadreArche(s)}</svg>
      ${d.portrait ? '' : `<figcaption>${fleurette(s + 5, { taille: 36 })}<span>Ici, votre portrait</span></figcaption>`}
    </figure>
    <div class="apropos-texte">
      <h2 class="titre titre-nom" data-respire id="apropos-titre">${esc(d.nom)}</h2>
      ${paras.length ? paras.map((p) => `<p>${fr(p)}</p>`).join('') : `<p class="emplacement-texte">Ici, votre parcours en quelques lignes : votre chemin jusqu’à ce métier, vos formations, ce qui compte pour vous.</p>`}
      ${d.cerf ? `<blockquote class="citation"><p>${fr(d.cerf)}</p></blockquote>` : ''}
    </div>
  </div>
</section>`;
}

// ---------- Contact : le numero en grand, un carnet de terrain, la prairie du bas ----------
function contact(d) {
  const resa = /resalib\.fr/i.test(d.resalib || '') ? lien(d.resalib) : '';
  const fb = lien(d.facebook);
  const lieu = [d.ville, d.cp && `(${d.cp})`].filter(Boolean).join(' ');
  return `
<section class="section contact" id="contact" aria-labelledby="contact-titre">
  <div class="cadre contact-cadre">
    ${titreSection('Prendre rendez-vous', 'contact')}
    <p class="contact-rdv">${fr(d.rdv || 'Sur rendez-vous')}</p>
    ${d.tel ? `<a class="tel-geant" href="${esc(d.telLien)}">${esc(d.tel)}</a>` : `<p class="tel-geant emplacement-texte">Ici, votre numéro</p>`}
    <div class="contact-liens">
      ${d.tel ? `<a class="pilule pilule-sombre" href="${esc(d.telLien)}">${esc(d.appeler || 'Appeler')}</a>` : ''}
      ${resa ? `<a class="lien-fleche" href="${resa}" rel="noopener" target="_blank">Réserver en ligne</a>` : ''}
      ${fb ? `<a class="lien-fleche" href="${fb}" rel="noopener" target="_blank">Sur Facebook</a>` : ''}
    </div>
    <dl class="carnet">
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
  <div class="cadre pied-cadre">
    <div class="pied-gauche">
      ${fleurette(graine(d.nom) + 11, { taille: 44 })}
      <p class="pied-nom">${esc(d.nom)}<span>${esc(d.metier)}${d.ville ? ' · ' + esc(d.ville) : ''}</span></p>
      ${d.tel ? `<p class="pied-tel"><a href="${esc(d.telLien)}">${esc(d.tel)}</a></p>` : ''}
      <nav class="pied-liens" aria-label="Plan de la page"><a href="#approche">L’approche</a><a href="#seance">La séance</a><a href="#tarifs">Tarifs</a><a href="#apropos">À propos</a><a href="#contact">Rendez-vous</a></nav>
    </div>
    <div class="pied-droite">
      <p class="pied-apercu">Aperçu préparé pour ${esc(d.nom)}. Textes, photos, couleurs : tout se modifie selon vos goûts.</p>
      <p class="pied-suite">Cette prairie est un point de départ. On peut la garder telle quelle, la mêler à un autre univers ou repartir d’une page blanche, jusqu’au site qui vous ressemble exactement.</p>
      <p class="pied-avert">${fr(d.avertissement)}</p>
      ${d.siret ? `<p class="pied-legal">SIRET ${esc(d.siret)}</p>` : ''}
      <a class="pied-haut" href="#accueil">Revenir en haut</a>
    </div>
  </div>
</footer>`;
}

// Les dessins lourds, après l'ouverture : les planches cachées sous la première, la fleur des sachets, la liane.
// Un dessin à la fois, quand le navigateur a le temps : la page reste légère à l'ouverture (et dans l'aperçu).
export function dessinsDifferes(racine = document) {
  const taches = [];
  racine.querySelectorAll('[data-espece]').forEach((el) => taches.push(() => { el.innerHTML = ESPECES[el.dataset.espece]?.(+el.dataset.graine)?.svg || ''; el.removeAttribute('data-espece'); }));
  racine.querySelectorAll('[data-vignette]').forEach((el) => taches.push(() => { const [g, i] = el.dataset.vignette.split(':').map(Number); el.innerHTML = vignette(g, i); el.removeAttribute('data-vignette'); }));
  racine.querySelectorAll('[data-liane]').forEach((el) => taches.push(() => { el.insertAdjacentHTML('beforeend', liane(+el.dataset.liane)); el.removeAttribute('data-liane'); }));
  const plus = typeof requestIdleCallback === 'function' ? (f) => requestIdleCallback(f, { timeout: 700 }) : (f) => setTimeout(f, 60);
  const suivant = () => { const t = taches.shift(); if (!t) return; t(); plus(suivant); };
  plus(suivant);
}

export function rendre(d) {
  d = nettoyer(d);
  return entete(d) + '\n<main id="contenu">' + accueil(d) + approche(d) + seance(d) + tarifs(d) + apropos(d) + contact(d) + '\n</main>' + pied(d);
}
