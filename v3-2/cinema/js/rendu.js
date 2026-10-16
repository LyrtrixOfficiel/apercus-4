// Rendu de l'univers Cinéma : la page du praticien racontée comme un film.
// Un seul module, utilisé par le navigateur (?p=<dossier>) ET par outils/batir.mjs
// (page lisible sans JavaScript). Tout vient du JSON du praticien ; ce qui manque
// devient un « plan à tourner » qui dit ce qui viendra. Rien n'est inventé.
//
// Le film : carton de chargement (initiales) > ouverture en format cinéma (générique)
// > carton « Chapitre premier » (sa phrase) > l'approche en plans > la séance en
// plan-séquence sous-titré > la bande-annonce (ce que l'on y trouve) > le billet
// (à l'affiche : tarifs) > le scénario (dans son propre rôle) > le générique de fin
// (rendez-vous, mentions) > fermeture à l'iris.
import { lire, sansLiaison } from './identite.js';

export const PALETTES = ['ambre', 'nuit', 'lin', 'foret', 'rose'];
export const PALETTE_PAR_FAMILLE = { esprit: 'ambre', toucher: 'ambre', psy: 'ambre', creation: 'nuit', elan: 'nuit', famille: 'lin', mouvement: 'lin', plantes: 'foret', energie: 'foret', beaute: 'rose' };

// Quelle photo va où, par famille de métier.
export const JEUX = {
  esprit: { accueil: 'soleil-rideaux', plans: ['canape-rideau', 'bougie-travertin', 'ombres-sol'], sequence: ['brume-lac', 'rideaux-blancs', 'ciel-ocean', 'mur-fenetre'], bande: ['lin', 'marbre', 'fleurs-sechees', 'colonnes'], fin: 'rideau-soleil' },
  psy: { accueil: 'fauteuil-bois', plans: ['lampe-canape', 'sablier', 'carnet-tasse'], sequence: ['fauteuils', 'fenetre-mer', 'salon-baie', 'plante-verre'], bande: ['carnets', 'canape-rideau', 'mur-fenetre', 'vase-seche'], fin: 'salon' },
  toucher: { accueil: 'spa-salle', plans: ['massage-fenetre', 'bougie-lavande', 'galets-bois'], sequence: ['serviettes', 'mains-dos', 'hammam', 'flacons'], bande: ['lin', 'bougie-travertin', 'rideau', 'ombres-chaudes'], fin: 'rideau-soleil' },
  plantes: { accueil: 'aromatiques', plans: ['bol-herbes', 'tisane', 'sauge'], sequence: ['plantes-soleil', 'ombre-mur', 'fleurs-tisane', 'vase-seche'], bande: ['fleurs-sechees', 'banc-bas', 'lin', 'rideau-soleil'], fin: 'ombres-chaudes' },
  energie: { accueil: 'tatami-porte', plans: ['pied-huile', 'galets-noirs', 'jardin-japonais'], sequence: ['tatami-lumiere', 'pied-mains', 'galets-bois', 'rayons'], bande: ['lumiere-verre', 'plume', 'cristal', 'voile-irise'], fin: 'soleil-rideaux' },
  son: { accueil: 'gong-salle', plans: ['bols-chantants', 'bol-livres', 'gong-plante'], sequence: ['bol-maillet', 'voile-irise', 'lumiere-verre', 'ombres-sol'], bande: ['plume', 'colonnes', 'lin', 'rideau'], fin: 'rideau-soleil' },
  art: { accueil: 'palette-papier', plans: ['aquarelle', 'pinceaux-vase', 'argile-mains'], sequence: ['bol-argile', 'ombres-chaudes', 'mur-fenetre', 'lin'], bande: ['vase-seche', 'fleurs-sechees', 'banc-bas', 'rideaux-blancs'], fin: 'rideau-soleil' },
  famille: { accueil: 'chaussons', plans: ['doudou', 'coton', 'plante-verre'], sequence: ['coton-branches', 'voilage-soir', 'soleil-rideaux', 'canape-rideau'], bande: ['rideaux-blancs', 'vase-seche', 'fleurs-sechees', 'lin'], fin: 'rideau-soleil' },
  beaute: { accueil: 'hammam', plans: ['coquillage', 'salle-soin', 'pot-rose'], sequence: ['serviettes', 'coton-branches', 'bougie-lavande', 'rideaux-blancs'], bande: ['marbre', 'lin', 'fleurs-sechees', 'rideau-soleil'], fin: 'rideau' },
  mouvement: { accueil: 'salle-doree', plans: ['meditation', 'tapis-fenetre', 'banc-bas'], sequence: ['ombres-sol', 'rideau', 'mur-fenetre', 'lin'], bande: ['colonnes', 'plantes-soleil', 'fleurs-sechees', 'rideaux-blancs'], fin: 'rideau-soleil' },
  elan: { accueil: 'escalier-clair', plans: ['escalier-ciel', 'carnet-tasse', 'fenetre-mer'], sequence: ['escalier-bois', 'salon-baie', 'carnets', 'plante-verre'], bande: ['colonnes', 'mur-fenetre', 'lin', 'ombres-chaudes'], fin: 'rideau-soleil' },
};
const jeuDe = (p, d) => {
  if (p.famille !== 'creation') return JEUX[p.famille] || JEUX.esprit;
  return /art|peint|dessin|argile|modelage|collage|sculpt/i.test([d.metier, d.accroche].join(' ')) ? JEUX.art : JEUX.son;
};

// --- texte -------------------------------------------------------------------------
const NB = ' ', FINE = ' ';
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const typo = (s) => String(s ?? '').replace(/\s+/g, ' ').trim()
  .replace(/ ([;!?])/g, FINE + '$1').replace(/ :/g, NB + ':')
  .replace(/« /g, '«' + NB).replace(/ »/g, NB + '»')
  .replace(/(\d) (h|min|€|ans?)\b/g, '$1' + NB + '$2').replace(/(\d) €/g, '$1' + NB + '€').replace(/ (€)/g, NB + '$1');
const fr = (s) => esc(typo(s));
const maj = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
// Titres découpés en lettres (le texte entier reste lisible pour les lecteurs d'écran).
function lettres(s) {
  let i = 0;
  const t = typo(s);
  return `<span class="lu">${esc(t)}</span><span aria-hidden="true">${t.split(' ').map((m) => `<span class="mot">${[...m].map((c) => `<span class="lettre" style="--i:${i++}">${esc(c)}</span>`).join('')}</span>`).join(' ')}</span>`;
}
const mots = (s) => typo(s).split(' ').map((m) => `<span class="mot">${esc(m)}</span>`).join(' ');
// Ce qui manque : une « réplique à écrire », un « plan à tourner ».
const vide = (texte, quoi = 'À écrire ensemble') => `<span class="vide"><span class="vide-quoi">${esc(quoi)}</span> ${fr(texte)}</span>`;

// --- images --------------------------------------------------------------------------
function photo(images, nom, { grand = false, classe = '', charge = 'lazy', attrs = '' } = {}) {
  const i = images[nom] || {};
  const alt = i.sujet ? `Photo d’ambiance : ${i.sujet}` : '';
  return `<picture class="photo ${classe}"${attrs}>${grand ? `<source media="(min-width: 900px)" srcset="images/${nom}-1920.webp">` : ''}<img src="images/${nom}-1000.webp" width="${i.l || 1000}" height="${i.h || 1000}" alt="${esc(alt)}" loading="${charge}" decoding="async"${charge === 'eager' ? ' fetchpriority="high"' : ''} style="background-image:url(${i.flou || ''})"></picture>`;
}

const ICONES = `<svg width="0" height="0" style="position:absolute" aria-hidden="true">
<symbol id="i-tel" viewBox="0 0 24 24"><path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></symbol>
<symbol id="i-lien" viewBox="0 0 24 24"><path d="M7 17 17 7M9 7h8v8" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></symbol>
<symbol id="i-haut" viewBox="0 0 24 24"><path d="M12 20V5M6 10l6-6 6 6" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></symbol>
</svg>`;

const ORDINAUX = ['premier', 'deux', 'trois', 'quatre', 'cinq', 'six'];
const PLANS = [['large', 'Plan large'], ['serre', 'Gros plan'], ['moyen', 'Plan moyen']];

export function rendre(d, images, { palette } = {}) {
  const p = lire(d);
  const J = jeuDe(p, d);
  const pal = PALETTES.includes(palette) ? palette : PALETTE_PAR_FAMILLE[p.famille] || 'ambre';
  const titre = p.personne || p.enseigne || p.nom;          // ce qui s'affiche en grand
  const qui = p.prenom || titre;                               // à qui l'on parle
  const credit = [maj(p.metier), p.ville].filter(Boolean).join(' à ');
  const accrocheSousTitre = p.accroche && p.accroche !== p.phrase && !p.accrocheGenerique ? p.accroche : null;

  // ---- chargement (hors #site : il doit exister avant tout rendu) ------------------
  const presente = `${titre} présente`;

  // ---- 1. ouverture ----------------------------------------------------------------------
  const longueur = typo(titre).length;
  const ouverture = `
<section class="ouverture" id="accueil" aria-label="Accueil">
  <div class="ouverture-cadre" data-ouverture-cadre>
    ${photo(images, J.accueil, { grand: true, classe: 'ouverture-photo', charge: 'eager' })}
    <div class="ouverture-voile" aria-hidden="true"></div>
  </div>
  <div class="ouverture-titres">
    ${p.personne && p.enseigne ? `<p class="ouverture-enseigne" data-intro style="--d:0">${fr(p.enseigne)}</p>` : ''}
    <h1 class="ouverture-nom${longueur > 22 ? ' long' : longueur > 15 ? ' moyen' : ''}">${lettres(titre)}</h1>
    <p class="ouverture-credit" data-intro style="--d:1">${fr(credit || p.metier)}</p>
  </div>
  ${accrocheSousTitre ? `<p class="sous-titre" data-intro style="--d:2">${p.accrocheSienne ? `«${NB}${fr(accrocheSousTitre)}${NB}»` : fr(accrocheSousTitre)}</p>` : ''}
  <div class="ouverture-pied" data-intro style="--d:3">
    <a class="defiler" href="#approche"><span class="defiler-ligne" aria-hidden="true"></span><span>Le film commence</span></a>
    <p class="ouverture-rdv">${fr(p.rdv)}${p.tel ? `<a href="${esc(p.telLien)}">${fr(p.tel)}</a>` : ''}</p>
  </div>
</section>`;

  // ---- 2. carton : chapitre premier ------------------------------------------------------
  const phrase = p.phrase;
  const taille = !phrase ? 'moyen' : phrase.length > 170 ? 'long' : phrase.length > 90 ? 'moyen' : 'court';
  const carton = `
<section class="carton" id="approche" aria-labelledby="t-approche">
  <div class="carton-cadre">
    <p class="carton-chapitre"><span>Chapitre premier</span><span class="carton-filet" aria-hidden="true"></span><span id="t-approche">L’approche</span></p>
    <blockquote class="carton-phrase carton-${taille}${phrase ? '' : ' carton-vide'}" data-mots>
      <p>${phrase ? mots(phrase) : mots('Ici, en une phrase, ce qui guide votre travail.')}</p>
      ${phrase ? `<footer class="carton-signe">${fr(qui)}</footer>` : `<footer class="carton-signe">${vide('Une phrase à vous, que l’on mettra en grand sur ce carton.', 'Réplique à écrire')}</footer>`}
    </blockquote>
  </div>
</section>`;

  // ---- 3. l'approche en plans ----------------------------------------------------------------
  const textes = p.approche.length ? p.approche.map((t, i) => (i === 0 ? sansLiaison(t) : t)) : [];
  // trois plans au plus : au-delà, les phrases se regroupent sous le dernier
  const groupes = textes.length <= 3 ? textes.map((t) => [t]) : [[textes[0]], [textes[1]], textes.slice(2)];
  const plans = (groupes.length ? groupes : [null]).map((g, i) => {
    const [forme, nomPlan] = PLANS[i % 3];
    const im = J.plans[i % J.plans.length];
    return `
  <article class="plan plan-${forme}">
    <figure class="plan-cadre" data-revele>
      <div class="plan-image">${photo(images, im, { grand: forme === 'large', classe: 'plan-photo' })}</div>
      <span class="viseur" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
      <figcaption>${nomPlan}, photo d’ambiance</figcaption>
    </figure>
    <div class="plan-texte" data-revele>
      ${g ? g.map((t, k) => `<p${i === 0 && k === 0 ? ' class="plan-lead"' : ''}>${fr(t)}</p>`).join('') : `<p class="plan-lead">${vide('Ici, votre approche en quelques phrases : ce qui vous guide, votre manière d’accueillir, ce que l’on vient chercher auprès de vous.', 'Plan à tourner')}</p>`}
    </div>
  </article>`;
  }).join('');
  const sectionPlans = `
<section class="plans" aria-label="L’approche, en plans">${plans}
</section>`;

  // ---- 4. la séance en plan-séquence sous-titré ------------------------------------------------
  const etapes = p.etapes.length ? p.etapes : [{ titre: 'La séance', texte: 'Ici, le déroulé d’une séance, à votre façon.', vide: true }];
  const dureeSeance = [p.dureePremiere && `Première séance, ${p.dureePremiere}`, p.dureeSuivi && `suivi, ${p.dureeSuivi}`].filter(Boolean).join(' ; ') || p.notesDuree[0] || '';
  const sequence = `
<section class="sequence" id="seance" aria-labelledby="t-seance" style="--n:${etapes.length}" data-sequence>
  <div class="sequence-ecran">
    <div class="sequence-images" aria-hidden="true">
      ${etapes.map((_, i) => photo(images, J.sequence[i % J.sequence.length], { grand: true, classe: `sequence-photo${i === 0 ? ' actif' : ''}`, attrs: ` data-plan="${i}"` })).join('')}
      <div class="sequence-voile"></div>
    </div>
    <header class="sequence-tete">
      <h2 id="t-seance">La séance</h2>
      <p>en un plan-séquence${dureeSeance ? `<span class="sequence-duree">${fr(dureeSeance)}</span>` : ''}</p>
    </header>
    <ol class="sous-titres" role="list">
      ${etapes.map((e, i) => `
      <li class="sous-titre-bloc${i === 0 ? ' actif' : ''}" data-etape="${i}">
        <h3>${fr(e.titre)}</h3>
        <p>${e.vide ? vide(e.texte, 'Réplique à écrire') : fr(e.texte)}</p>
        ${e.duree ? `<p class="sous-titre-duree">${fr(e.duree)}</p>` : ''}
      </li>`).join('')}
    </ol>
    <div class="pellicule" aria-hidden="true">${etapes.map((_, i) => `<span data-cran="${i}"${i === 0 ? ' class="actif"' : ''}></span>`).join('')}</div>
  </div>
</section>`;

  // ---- 5. bande-annonce ---------------------------------------------------------------------------
  const cartes = p.apports.length
    ? p.apports.slice(0, 4).map((a) => ({ titre: a.titre, texte: a.texte }))
    : [{ titre: maj(p.metier), texte: '' }, { titre: p.ville ? `À ${p.ville}` : p.rdv, texte: '' }];
  const bande = `
<section class="bande" id="bande" aria-labelledby="t-bande">
  <div class="bande-panneau bande-ouverture">
    <p class="bande-sur">Bande-annonce</p>
    <h2 id="t-bande" class="bande-titre">${p.apports.length ? 'Ce que vous y trouverez' : 'Bientôt, vos images'}</h2>
    <p class="bande-note">${p.apports.length ? 'En quelques plans, avant le film.' : vide('Ici, les images de votre lieu : votre salle, votre lumière, vos objets.', 'Plans à tourner')}</p>
  </div>
  ${cartes.map((c, i) => `
  <div class="bande-panneau" data-panneau>
    ${photo(images, J.bande[i % J.bande.length], { grand: true, classe: 'bande-photo' })}
    <div class="bande-voile" aria-hidden="true"></div>
    <div class="bande-texte">
      <p class="bande-mot">${fr(c.titre)}.</p>
      ${c.texte ? `<p class="bande-legende">${fr(c.texte)}</p>` : ''}
    </div>
  </div>`).join('')}
  <p class="bande-credit">Photos d’ambiance : les images de votre lieu prendront leur place.</p>
</section>`;

  // ---- 6. à l'affiche : le billet ---------------------------------------------------------------
  const lignesTarifs = p.tarifs.length
    ? p.tarifs.map((t) => `<div class="billet-seance"><p class="billet-nom">${fr(t.nom)}</p><p class="billet-prix">${fr(t.prix)}</p></div>`).join('')
    : `<div class="billet-seance billet-seance-vide"><p class="billet-nom">${fr(maj(p.metier))}</p><p class="billet-prix billet-prix-vide">${vide('Ici, vos séances et leurs tarifs.', 'Tarif à venir')}</p></div>`;
  const infos = [
    ['Durée', p.dureePremiere ? `${p.dureePremiere}${p.dureeSuivi ? `, puis ${p.dureeSuivi}` : ''}` : (p.notesDuree[0] || null)],
    ['Règlement', p.paiement ? maj(p.paiement) : null],
    ['Lieu', p.ville || null],
  ];
  const billet = `
<section class="affiche" id="tarifs" aria-labelledby="t-tarifs">
  <header class="affiche-tete" data-revele>
    <h2 id="t-tarifs">À l’affiche</h2>
    <p>les séances, leurs tarifs, et comment venir</p>
  </header>
  <div class="billet" data-billet data-revele>
    <div class="billet-corps">
      <p class="billet-entete"><span>Billet d’entrée</span><span>${fr(titre)}</span></p>
      ${lignesTarifs}
      <dl class="billet-infos">
        ${infos.map(([k, v]) => `<div><dt>${k}</dt><dd>${v ? fr(v) : vide(k === 'Lieu' ? 'Ici, votre adresse.' : k === 'Durée' ? 'Ici, la durée d’une séance.' : 'Ici, les moyens de paiement.', 'À préciser')}</dd></div>`).join('')}
      </dl>
      ${p.notesTarifs.length ? `<p class="billet-note">${p.notesTarifs.map(fr).join(' ')}</p>` : ''}
    </div>
    <div class="billet-talon" data-talon>
      <span class="billet-initiales" aria-hidden="true">${esc(p.initiales)}</span>
      <p class="billet-rdv">${fr(p.rdv)}</p>
      ${p.tel ? `<a class="billet-tel" href="${esc(p.telLien)}">${fr(p.tel)}</a>` : ''}
      <span class="billet-geste" aria-hidden="true">à détacher</span>
    </div>
  </div>
</section>`;

  // ---- 7. le scénario : dans son propre rôle -----------------------------------------------------
  const lieuScene = p.famille === 'famille' ? 'À LA MAISON' : 'LE CABINET';
  const personnage = (p.prenom || titre).toLocaleUpperCase('fr');
  const repliques = p.apropos.length ? p.apropos.map((t, i) => (i === 0 ? sansLiaison(t) : t)) : null;
  const scenario = `
<section class="scenario" id="apropos" aria-labelledby="t-apropos">
  <header class="scenario-tete" data-revele>
    <h2 id="t-apropos">Dans son propre rôle</h2>
    <p>${fr(titre)}${p.metier ? `, ${fr(p.metier.toLowerCase())}` : ''}</p>
  </header>
  <div class="scenario-grille">
    <figure class="photogramme" data-revele>
      <div class="photogramme-image">
        <span class="photogramme-initiales" aria-hidden="true">${esc(p.initiales)}</span>
        <figcaption>Ici, votre portrait<small>une photo de vous, dans votre lumière</small></figcaption>
      </div>
    </figure>
    <article class="feuille" data-revele>
      <p class="feuille-scene">INT. ${lieuScene}${p.ville ? ` · ${esc(p.ville.toLocaleUpperCase('fr'))}` : ''} · JOUR</p>
      <p class="feuille-action">${fr(titre)}${p.metier ? `, ${fr(p.metier.toLowerCase())},` : ''} prend la parole.</p>
      <p class="feuille-perso">${esc(personnage)}</p>
      ${repliques ? repliques.map((t, i) => `${i ? '<p class="feuille-didascalie">(un temps)</p>' : ''}<p class="feuille-replique">${fr(t)}</p>`).join('') : `<p class="feuille-replique">${vide('Ici, votre parcours : ce qui vous a menée à ce métier, vos formations, ce qui vous tient à cœur.', 'Réplique à écrire')}</p>`}
      ${p.cerf ? `<p class="feuille-didascalie">(un temps)</p><p class="feuille-replique">${fr(p.cerf)}</p>` : ''}
      <p class="feuille-fondu">FONDU ENCHAÎNÉ.</p>
    </article>
  </div>
</section>`;

  // ---- 8. générique de fin : rendez-vous, mentions, fermeture à l'iris ------------------------------
  const resa = p.liens.find((l) => l.type !== 'facebook');
  const fb = p.liens.find((l) => l.type === 'facebook');
  const roles = [
    ['Dans son propre rôle', esc(typo(titre))],
    p.personne && p.enseigne ? ['Enseigne', fr(p.enseigne)] : null,
    ['Métier', fr(maj(p.metier))],
    ['Lieu de tournage', p.lieu ? fr(p.lieu) : vide('Ici, l’adresse de votre cabinet.', 'À préciser')],
    ['Accueil', fr(p.rdv)],
    ['Horaires', vide('Ici, vos jours et heures.', 'À préciser')],
    ['Téléphone', p.tel ? `<a href="${esc(p.telLien)}">${fr(p.tel)}</a>` : vide('Ici, votre numéro.', 'À préciser')],
    resa ? ['Réservation en ligne', `<a href="${esc(resa.url)}" target="_blank" rel="noopener">${esc(resa.texte.replace(/^Réserver sur |^Sa fiche sur /, ''))}</a>`] : null,
    fb ? ['Sur Facebook', `<a href="${esc(fb.url)}" target="_blank" rel="noopener">sa page</a>`] : null,
    p.siret ? ['SIRET', esc(p.siret)] : null,
    ['Images', 'Photos d’ambiance Unsplash, étalonnées pour vous'],
  ].filter(Boolean);
  const generique = `
<section class="generique" id="contact" aria-labelledby="t-contact">
  <div class="generique-appel" data-revele>
    <h2 id="t-contact" class="generique-titre">${lettres('Prenons rendez-vous')}</h2>
    ${p.tel ? `<a class="generique-tel" href="${esc(p.telLien)}"><svg aria-hidden="true"><use href="#i-tel"/></svg><span>${fr(p.tel)}</span></a>` : `<p class="generique-tel">${vide('Ici, votre numéro de téléphone.', 'À préciser')}</p>`}
    <div class="generique-actions">
      ${p.tel ? `<a class="bouton bouton-plein" href="${esc(p.telLien)}">${p.prenom ? `Appeler ${fr(p.prenom)}` : 'Appeler'}</a>` : ''}
      ${resa ? `<a class="bouton" href="${esc(resa.url)}" target="_blank" rel="noopener">${fr(resa.texte)}<svg aria-hidden="true"><use href="#i-lien"/></svg></a>` : ''}
    </div>
  </div>
  <div class="defilement" aria-label="Générique">
    <dl class="roles">${roles.map(([r, v]) => `<div><dt>${r}</dt><dd>${v}</dd></div>`).join('')}</dl>
    <footer class="pied">
      <p class="pied-apercu">Aperçu préparé pour ${fr(p.nom)}. Textes, photos, couleurs : tout se modifie selon vos goûts.</p>
      <p class="pied-suite">On peut partir de cet univers, en mélanger deux, ou repartir de zéro : on avance ensemble jusqu’au site qui vous ressemble exactement.</p>
      <p class="pied-avert">${fr(p.avertissement)}</p>
      <p class="pied-fin"><a href="#accueil"><svg aria-hidden="true"><use href="#i-haut"/></svg>Revoir depuis le début</a><span>Maquette non publiée</span></p>
    </footer>
  </div>
  <div class="iris" data-iris aria-hidden="true">
    <div class="iris-cercle">${photo(images, J.fin, { grand: true, classe: 'iris-photo' })}</div>
    <p class="iris-fin">Fin</p>
  </div>
</section>`;

  // ---- barre, menu, rideau ------------------------------------------------------------------------------
  const nav = [['approche', 'L’approche'], ['seance', 'La séance'], ['tarifs', 'À l’affiche'], ['apropos', 'Son rôle'], ['contact', 'Rendez-vous']];
  const barre = `
<a class="evitement" href="#approche">Aller au contenu</a>
<header class="barre" data-barre>
  <a class="barre-nom" href="#accueil" aria-label="${esc(titre)}, revenir au début"><span class="monogramme" aria-hidden="true">${esc(p.initiales)}</span><span class="barre-nom-texte">${fr(titre)}</span></a>
  <nav class="barre-nav" aria-label="Navigation principale">${nav.slice(0, 4).map(([id, t]) => `<a href="#${id}">${t}</a>`).join('')}</nav>
  ${p.tel ? `<a class="barre-rdv" href="${esc(p.telLien)}"><svg aria-hidden="true"><use href="#i-tel"/></svg><span>Rendez-vous</span></a>` : `<a class="barre-rdv" href="#contact"><span>Rendez-vous</span></a>`}
  <button class="barre-menu" type="button" aria-expanded="false" aria-controls="menu" data-menu-bouton><span>Chapitres</span></button>
</header>
<div class="menu" id="menu" hidden data-menu>
  <nav aria-label="Chapitres">${nav.map(([id, t], i) => `<a href="#${id}"><i>${i === nav.length - 1 ? 'générique' : `chapitre ${ORDINAUX[i]}`}</i><span>${t}</span></a>`).join('')}</nav>
  ${p.tel ? `<a class="menu-tel" href="${esc(p.telLien)}">${fr(p.tel)}</a>` : ''}
</div>
<div class="rideau" aria-hidden="true" data-rideau><span class="rideau-barre rideau-haut"></span><span class="rideau-barre rideau-bas"></span><p class="rideau-carton"><span>${fr(titre)}</span><small>${fr(credit || p.metier)}</small></p></div>`;

  return {
    famille: p.famille, palette: pal, initiales: p.initiales, presente,
    titre: `${p.nom} · ${[p.metier, p.ville].filter(Boolean).join(' à ')}`,
    description: p.accroche && !p.accrocheGenerique ? p.accroche : `${maj(p.metier)}${p.ville ? ' à ' + p.ville : ''}, sur rendez-vous.`,
    html: `${ICONES}${barre}<main id="contenu">${ouverture}${carton}${sectionPlans}${sequence}${bande}${billet}${scenario}${generique}</main>`,
    precharge: `images/${J.accueil}-1000.webp`,
    attendre: [J.accueil, J.plans[0]],
  };
}
