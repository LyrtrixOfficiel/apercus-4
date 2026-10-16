// Rendu de l'univers Éditorial : le site comme un numéro de magazine.
// Un seul module, utilisé par le navigateur (?p=<dossier>) ET par outils/batir.mjs
// (page lisible sans JavaScript). Tout vient du JSON ; ce qui manque devient un
// emplacement qui dit ce qui viendra. Rien n'est inventé.
//
// Le numéro : couverture qui s'imprime (le chargement) > sommaire > le grand entretien
// (son approche, son parcours, en questions et réponses) > en bref (la séance, en colonnes
// de journal) > pleine page (ce que l'on y trouve) > pratique (l'encadré) > quatrième de
// couverture (rendez-vous) > colophon.
import { lire, sansLiaison } from './identite.js';

export const PALETTES = ['encre', 'klein', 'vert', 'terracotta', 'rose', 'violet'];
export const PALETTE_PAR_FAMILLE = { psy: 'encre', elan: 'encre', esprit: 'klein', plantes: 'vert', famille: 'terracotta', mouvement: 'terracotta', beaute: 'rose', toucher: 'rose', energie: 'violet', creation: 'violet' };
// objet de couverture, objet d'article, puis quatre photos (entretien, brèves, sommaire, pleine page sans « apports »)
export const JEUX = {
  esprit: { objets: ['plume-brune', 'pierre-ronde'], photos: ['ombre-fleurs', 'main-pierre', 'voile-irise', 'bougie-verte'] },
  psy: { objets: ['tasse', 'plume-brune'], photos: ['fauteuil-bois', 'lampe-canape', 'carnet-tasse', 'main-fleurs'] },
  toucher: { objets: ['galets-noirs', 'feuille'], photos: ['mains-dos', 'serviettes', 'salle-soin', 'pied-huile'] },
  plantes: { objets: ['feuille', 'branche'], photos: ['bol-herbes', 'tournesol', 'ombre-fleurs', 'main-fleurs'] },
  energie: { objets: ['amethyste', 'pierre-ronde'], photos: ['pied-huile', 'tatami-porte', 'voile-irise', 'main-pierre'] },
  son: { objets: ['bol-chantant', 'plume-brune'], photos: ['bols-chantants', 'gong-salle', 'voile-irise', 'tatami-porte'] },
  art: { objets: ['pinceaux', 'feuille'], photos: ['aquarelle', 'argile-mains', 'vases', 'ombre-fleurs'] },
  famille: { objets: ['cotonnier', 'rose'], photos: ['coton', 'chaussons', 'vases', 'coton-branches'] },
  beaute: { objets: ['pot-rose', 'coquillage'], photos: ['salle-soin', 'coton-branches', 'serviettes', 'vases'] },
  mouvement: { objets: ['pierre-ronde', 'plume-brune'], photos: ['tapis-fenetre', 'salle-doree', 'bougie-verte', 'tatami-porte'] },
  elan: { objets: ['branche', 'pierre-ronde'], photos: ['main-fleurs', 'carnet-tasse', 'tournesol', 'ombre-fleurs'] },
};
const jeuDe = (p, d) => {
  if (p.famille !== 'creation') return JEUX[p.famille] || JEUX.esprit;
  return /art|peint|dessin|argile|modelage|collage|sculpt/i.test([d.metier, d.accroche].join(' ')) ? JEUX.art : JEUX.son;
};

// --- texte ------------------------------------------------------------------------------
const NB = ' ', FINE = ' ';
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const typo = (s) => String(s ?? '').replace(/\s+/g, ' ').trim()
  .replace(/ ([;!?])/g, FINE + '$1').replace(/ :/g, NB + ':')
  .replace(/« /g, '«' + NB).replace(/ »/g, NB + '»')
  .replace(/(\d) (h|min|€|ans?)\b/g, '$1' + NB + '$2').replace(/(\d) €/g, '$1' + NB + '€');
const fr = (s) => esc(typo(s));
const maj = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const vide = (texte, quoi = 'À écrire') => `<span class="vide"><span class="vide-quoi">${esc(quoi)}</span> ${fr(texte)}</span>`;
const court = (s, n) => { const t = typo(s); if (t.length <= n) return t; const c = t.slice(0, n); return c.slice(0, c.lastIndexOf(' ')).replace(/[,;:]$/, '') + '…'; };
const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
export const dateNumero = (d = new Date()) => `${maj(MOIS[d.getMonth()])} ${d.getFullYear()}`;

// Lettrine : la première lettre sort du flux ; la phrase reste entière pour les lecteurs d'écran.
function lettrine(p) {
  const t = typo(p);
  const m = t.match(/^([«"“]?\s*)(\p{L})/u);
  if (!m) return `<p>${esc(t)}</p>`;
  return `<p class="avec-lettrine"><span class="lettrine" aria-hidden="true">${esc(m[2])}</span><span class="lu">${esc(m[2])}</span>${esc(t.slice(m[0].length))}</p>`;
}

function photo(images, nom, { classe = '', attrs = '' } = {}) {
  const i = images[nom] || {};
  const alt = i.sujet ? `Photo d’ambiance : ${i.sujet}` : '';
  return `<picture class="photo ${classe}"${attrs}><source media="(min-width: 900px)" srcset="images/${nom}-1600.webp"><img src="images/${nom}-900.webp" width="${i.l || 900}" height="${i.h || 900}" alt="${esc(alt)}" loading="lazy" decoding="async" style="background-image:url(${i.flou || ''})"></picture>`;
}
function objet(images, nom, { classe = '', attrs = '', charge = 'lazy' } = {}) {
  const i = images[nom] || {};
  return `<img class="objet ${classe}" src="images/${nom}-objet-600.webp" srcset="images/${nom}-objet-600.webp 600w, images/${nom}-objet-1100.webp 1100w" sizes="(min-width: 900px) 34vw, 60vw" width="${i.l || 600}" height="${i.h || 600}" alt="" loading="${charge}" decoding="async" draggable="false"${attrs}>`;
}

// code-barres de couverture, tiré de son numéro de téléphone (motifs EAN, pour le plaisir de l'œil)
const MOTIFS = ['0001101', '0011001', '0010011', '0111101', '0100011', '0110001', '0101111', '0111011', '0110111', '0001011'];
function codeBarres(tel) {
  const ch = (tel || '').replace(/\D/g, '').slice(0, 12) || '000000000000';
  const bits = '101' + [...ch].map((c, i) => (i === Math.floor(ch.length / 2) ? '01010' : '') + MOTIFS[+c]).join('') + '101';
  let x = 0, rects = '';
  for (const b of bits) { if (b === '1') rects += `<rect x="${x}" y="0" width="1" height="40"/>`; x++; }
  return `<svg class="code-barres" viewBox="0 0 ${bits.length} 40" preserveAspectRatio="none" aria-hidden="true">${rects}</svg>`;
}

// le titre de couverture en lignes équilibrées (3 au plus), chacune ajustée ensuite à la largeur
function lignesTitre(t) {
  const m = typo(t).split(' ');
  const total = m.join(' ').length;
  if (m.length === 1 || total <= 9) return [m.join(' ')];
  let mieux = null;
  const essayer = (coupes) => {
    const l = []; let a = 0;
    for (const c of [...coupes, m.length]) { l.push(m.slice(a, c).join(' ')); a = c; }
    // une ligne qui finit sur un petit mot (« Le », « des ») coupe ce qui va ensemble
    const pire = Math.max(...l.map((x) => x.length)) + (l.slice(0, -1).some((x) => /(^|\s)\S{1,3}$/.test(x)) ? 5 : 0);
    if (!mieux || pire < mieux.pire || (pire === mieux.pire && l.length < mieux.l.length)) mieux = { l, pire };
  };
  for (let i = 1; i < m.length; i++) essayer([i]);
  if (m.length >= 3 && total > 16) for (let i = 1; i < m.length - 1; i++) for (let j = i + 1; j < m.length; j++) essayer([i, j]);
  return mieux.l;
}

export function rendre(d, images, { palette, date = dateNumero() } = {}) {
  const p = lire(d);
  const J = jeuDe(p, d);
  const pal = PALETTES.includes(palette) ? palette : PALETTE_PAR_FAMILLE[p.famille] || 'klein';
  // la couverture : l'enseigne devient le titre du magazine, la personne en est la vedette
  let surtitre = '', titreCouv = p.personne || p.nom, vedette = '';
  if (p.enseigne) {
    const m = p.enseigne.match(/^(cabinet|espace|institut|atelier|centre|studio|maison|salon)\s+(.+)$/i);
    if (m && m[2].split(' ').length >= 1) { surtitre = maj(m[1].toLowerCase()); titreCouv = maj(m[2]); } else titreCouv = p.enseigne;
    if (p.personne) vedette = p.personne;
  }
  const qui = p.prenom || p.personne || p.enseigne || p.nom;
  const lieuMetier = [maj(p.metier), p.ville].filter(Boolean).join(' à ');
  const lignes = lignesTitre(titreCouv);
  const pages = { sommaire: 3, entretien: 4, seance: 10, pleine: 12, pratique: 14 };
  const folio = (k) => `<p class="folio" aria-hidden="true"><span>${pages[k]}</span><span>${fr(p.personne || p.enseigne || p.nom)}</span><span>N°${NB}01, <span class="date-numero">${esc(date)}</span></span></p>`;

  // ---- couverture ------------------------------------------------------------------------------
  const phraseCourte = p.phrase ? court(p.phrase, 78) : null;
  const etapesTitres = p.etapes.map((e) => e.titre);
  const lignesCouv = [
    ['entretien', 'Le grand entretien', phraseCourte ? `«${NB}${esc(phraseCourte)}${NB}»` : `${fr(qui)} se raconte, avec ses mots`],
    ['seance', 'En bref', etapesTitres.length > 1 ? `${fr(etapesTitres[0])}, puis ${fr(etapesTitres[etapesTitres.length - 1].toLowerCase())}` : 'La séance, pas à pas'],
    p.apports.length ? ['pleine', 'Pleine page', fr(p.apports.slice(0, 3).map((a) => a.titre.toLowerCase()).join(', ').replace(/^./, (c) => c.toUpperCase()))] : null,
    ['pratique', 'Pratique', p.tarifs.length ? `${fr(p.tarifs[0].nom)}, ${fr(p.tarifs[0].prix)}` : 'Tarifs, durée, rendez-vous'],
  ].filter(Boolean);
  const couverture = `
<section class="couverture" id="couverture" aria-label="Couverture">
  <div class="repere repere-hg" aria-hidden="true"></div><div class="repere repere-hd" aria-hidden="true"></div><div class="repere repere-bg" aria-hidden="true"></div><div class="repere repere-bd" aria-hidden="true"></div>
  <div class="gamme" aria-hidden="true" data-gamme><i></i><i></i><i></i><i></i><i></i><i></i></div>
  <p class="couverture-haut"><span>N°${NB}01</span><span>${fr(lieuMetier)}</span><span class="date-numero">${esc(date)}</span></p>
  <h1 class="couverture-titre" data-lignes="${lignes.length}">
    ${surtitre ? `<span class="couverture-surtitre">${fr(surtitre)}</span>` : ''}
    ${lignes.map((l, i) => `<span class="titre-ligne titre-ligne-${i % 2 ? 'b' : 'a'}" style="--n:${Math.max(l.length, 3)};--l:${i}"><span class="titre-texte" data-t="${esc(l)}">${esc(l)}</span></span>`).join('')}
    ${vedette ? `<span class="couverture-vedette">${fr(vedette)}</span>` : ''}
  </h1>
  <div class="couverture-objet-zone" data-zone>
    ${objet(images, J.objets[0], { classe: 'couverture-objet', charge: 'eager', attrs: ' data-objet' })}
  </div>
  <nav class="accroches" aria-label="Dans ce numéro">
    ${lignesCouv.map(([id, t, s], i) => `<a class="accroche accroche-${i}" href="#${id}"><b>${t}</b><span>${s}</span></a>`).join('')}
  </nav>
  <div class="couverture-bas">
    <p class="couverture-rdv">${fr(p.rdv)}${p.tel ? `<a href="${esc(p.telLien)}">${fr(p.tel)}</a>` : ''}</p>
    <div class="couverture-code">${codeBarres(p.tel)}<span>${p.tel ? fr(p.tel) : `N°${NB}01`}</span></div>
  </div>
</section>`;

  // ---- sommaire -----------------------------------------------------------------------------------
  const entrees = [
    ['entretien', 'Le grand entretien', `${fr(p.personne || p.enseigne || p.nom)} raconte son approche et son chemin, avec ses mots.`],
    ['seance', 'En bref : la séance', etapesTitres.length ? fr(etapesTitres.join(', ').toLowerCase().replace(/^./, (c) => c.toUpperCase())) + '.' : 'Le déroulé d’une séance.'],
    ['pleine', 'Pleine page', p.apports.length ? 'Ce que vous y trouverez.' : 'Les images du lieu.'],
    ['pratique', 'Pratique', 'Tarifs, durée, règlement, adresse.'],
    ['rdv', 'Quatrième de couverture', 'Prendre rendez-vous.'],
  ];
  const sommaire = `
<section class="sommaire" id="sommaire" aria-labelledby="t-sommaire">
  <figure class="sommaire-figure" data-figure>
    ${photo(images, J.photos[2], { classe: 'figure-photo' })}
    <figcaption>Photo d’ambiance, ${fr(images[J.photos[2]]?.sujet || '')}. Vos images prendront sa place.</figcaption>
  </figure>
  <div class="sommaire-corps">
    <h2 id="t-sommaire" class="sommaire-titre">Sommaire</h2>
    <ol class="sommaire-liste" role="list">
      ${entrees.map(([id, t, s], i) => `<li class="entree entree-${i}"><a href="#${id}"><span class="entree-page">${id === 'rdv' ? 'IV' : pages[id]}</span><span class="entree-titre">${t}</span><span class="entree-dek">${s}</span></a></li>`).join('')}
    </ol>
  </div>
  ${folio('sommaire')}
</section>`;

  // ---- le grand entretien ------------------------------------------------------------------------------
  const questions = [];
  const approche = p.approche.map((t, i) => (i === 0 ? sansLiaison(t) : t));
  const qApproche = { q: 'Votre approche, en quelques mots ?', a: approche, vide: 'Ici, votre réponse : ce qui vous guide, votre manière d’accueillir, ce que l’on vient chercher auprès de vous. Nous l’écrirons ensemble, avec vos mots.' };
  const qChemin = { q: 'Votre chemin jusqu’ici ?', a: p.apropos.map((t, i) => (i === 0 ? sansLiaison(t) : t)), vide: 'Ici, votre parcours : ce qui vous a menée à ce métier, vos formations, ce qui vous tient à cœur.' };
  // l'entretien commence toujours par ses mots : si l'approche manque, son chemin passe devant
  if (approche.length || !p.apropos.length) { qChemin.q = p.apropos.length ? 'Et votre chemin jusqu’ici ?' : 'Votre parcours ?'; questions.push(qApproche, qChemin); }
  else { qApproche.q = 'Et votre approche, aujourd’hui ?'; questions.push(qChemin, qApproche); }
  if (p.cerf) questions.push({ q: 'Un dernier mot ?', a: [p.cerf] });
  let premiere = true;
  const corpsEntretien = questions.map((x) => `
      <p class="question">${x.q}</p>
      ${x.a.length ? x.a.map((t) => { const h = premiere ? lettrine(t) : `<p>${fr(t)}</p>`; premiere = false; return h; }).join('') : `<p class="reponse-vide">${vide(x.vide)}</p>`}`).join('');
  const nomEntretien = fr(p.personne || p.enseigne || p.nom);
  const metierPersonne = /(logue|th[ée]rapeute|pathe|icienne?|eur|euse|ante?|coach|doula|praticienne?)\b/i.test(p.metier);
  const presentation = `${nomEntretien}${metierPersonne && p.personne ? ' est ' : ', '}${fr(p.metier.toLowerCase())}${p.ville ? ` à ${fr(p.ville)}` : ''}.`;
  const chapo = !p.approche.length && !p.apropos.length
    ? `${presentation} Cet entretien attend ses mots : nous l’écrirons ensemble.`
    : p.prenom ? `${presentation} Ici, ${p.feminin ? 'elle' : 'il'} raconte son approche et son chemin, avec ses mots.` : `${presentation} Ici, son approche et son chemin, avec ses mots.`;
  const titreEntretien = p.phrase
    ? `<h2 id="t-entretien" class="entretien-titre${p.phrase.length > 120 ? ' long' : ''}"><span class="guillemet" aria-hidden="true">«</span>${fr(p.phrase)}<span class="guillemet" aria-hidden="true">»</span></h2>`
    : `<h2 id="t-entretien" class="entretien-titre">Rencontre avec ${fr(p.personne || p.enseigne || p.nom)}</h2>`;
  const entretien = `
<section class="entretien" id="entretien" aria-labelledby="t-entretien">
  <header class="entretien-tete">
    <p class="rubrique">Le grand entretien</p>
    ${titreEntretien}
    <p class="chapo">${chapo}</p>
  </header>
  <div class="entretien-grille">
    <div class="entretien-marge">
    <figure class="entretien-figure" data-figure>
      ${photo(images, J.photos[0], { classe: 'figure-photo' })}
      <figcaption>Photo d’ambiance, ${fr(images[J.photos[0]]?.sujet || '')}. Vos images prendront sa place.</figcaption>
    </figure>
    ${objet(images, J.objets[1], { classe: 'objet-marge', attrs: ' data-flotte' })}
    </div>
    <div class="entretien-texte">${corpsEntretien}
      <figure class="portrait" data-figure>
        <div class="portrait-cadre"><span class="portrait-initiales" aria-hidden="true">${esc(p.initiales)}</span></div>
        <figcaption>Ici, votre portrait : une photo de vous, dans votre lumière.</figcaption>
      </figure>
    </div>
  </div>
  ${folio('entretien')}
</section>`;

  // ---- en bref : la séance ---------------------------------------------------------------------------
  const durees = [p.dureePremiere && `Première séance${NB}: ${p.dureePremiere}`, p.dureeSuivi && `Suivi${NB}: ${p.dureeSuivi}`].filter(Boolean);
  // les durées sont déjà dites dans les étapes : pas de doublon dans un encadré
  const encadre = (durees.length || p.notesDuree.length) && !p.etapes.some((e) => e.duree) ? `<aside class="breve-encadre"><p class="encadre-titre">Durées</p>${durees.map((x) => `<p>${fr(x)}</p>`).join('')}${p.notesDuree.map((x) => `<p>${fr(x)}</p>`).join('')}</aside>` : '';
  const breves = p.etapes.length ? p.etapes : [{ titre: 'La séance', texte: 'Ici, le déroulé d’une séance, à votre façon.', vide: true }];
  const seance = `
<section class="breves" id="seance" aria-labelledby="t-seance">
  <header class="breves-tete">
    <h2 id="t-seance" class="breves-titre">En bref</h2>
    <p class="breves-dek">La séance${p.etapes.length > 1 ? ', du premier pas au suivi' : ''}, racontée par ${fr(qui)}.</p>
  </header>
  <div class="colonnes${breves.length + (encadre ? 1 : 0) <= 3 ? ' colonnes-courtes' : ''}">
    ${breves.map((e, i) => `
    <article class="breve">
      <p><b class="breve-tete">${fr(e.titre)}.</b> ${e.vide ? vide(e.texte) : fr(e.texte)}</p>
      ${e.duree ? `<p class="breve-duree">${fr(e.duree)}</p>` : ''}
    </article>${i === 0 ? encadre : ''}`).join('')}
    <figure class="breve-figure" data-figure>
      ${photo(images, J.photos[1], { classe: 'figure-photo' })}
      <figcaption>Photo d’ambiance, ${fr(images[J.photos[1]]?.sujet || '')}.</figcaption>
    </figure>
  </div>
  ${folio('seance')}
</section>`;

  // ---- pleine page ------------------------------------------------------------------------------------
  const pleine = p.apports.length ? `
<section class="pleine" id="pleine" aria-labelledby="t-pleine">
  <h2 id="t-pleine" class="pleine-rubrique">Ce que vous y trouverez</h2>
  <div class="pleine-mots" aria-hidden="true">
    ${p.apports.slice(0, 5).map((a, i) => `<p class="pleine-ligne pleine-ligne-${i % 2 ? 'b' : 'a'}" data-glisse="${i % 2 ? 1 : -1}" style="--n:${Math.max(a.titre.length, 6)}"><span>${esc(typo(a.titre))}</span></p>`).join('')}
  </div>
  <dl class="pleine-legendes">
    ${p.apports.slice(0, 5).map((a) => `<div><dt>${fr(a.titre)}</dt><dd>${fr(a.texte)}</dd></div>`).join('')}
  </dl>
  ${folio('pleine')}
</section>` : `
<section class="pleine pleine-photo" id="pleine" aria-labelledby="t-pleine">
  ${photo(images, J.photos[3] || J.photos[2], { classe: 'pleine-image' })}
  <div class="pleine-texte">
    <h2 id="t-pleine" class="pleine-grand">Ici, vos images.</h2>
    <p>${vide('Votre lieu, votre lumière, vos objets : une pleine page rien que pour eux.', 'À photographier')}</p>
  </div>
  ${folio('pleine')}
</section>`;

  // ---- pratique ------------------------------------------------------------------------------------------
  const infos = [
    ['Durée', p.dureePremiere ? `${p.dureePremiere}${p.dureeSuivi ? `, puis ${p.dureeSuivi} en suivi` : ''}` : p.notesDuree[0] || null, 'Ici, la durée d’une séance.'],
    ['Règlement', p.paiement ? maj(p.paiement) : null, 'Ici, les moyens de paiement.'],
    ['Accueil', p.rdv, ''],
    ['Lieu', p.lieu || null, 'Ici, l’adresse de votre cabinet.'],
    ['Horaires', null, 'Ici, vos jours et heures.'],
  ];
  const pratique = `
<section class="pratique" id="pratique" aria-labelledby="t-pratique">
  <h2 id="t-pratique" class="pratique-titre">Pratique</h2>
  <div class="pratique-corps">
    ${p.tarifs.length ? p.tarifs.map((t) => `<div class="tarif"><p class="tarif-nom">${fr(t.nom)}</p><p class="tarif-prix">${fr(t.prix)}</p></div>`).join('') : `<div class="tarif tarif-vide"><p class="tarif-nom">${fr(maj(p.metier))}</p><p class="tarif-prix">Tarifs à venir</p><p>${vide('Ici, vos séances et leurs tarifs.')}</p></div>`}
    <p class="carnet">${infos.map(([k, v, x]) => `<span class="carnet-cle">${k}</span> ${v ? fr(v) : vide(x, 'À préciser')}`).join('<span class="carnet-sep" aria-hidden="true"> · </span>')}</p>
    ${p.notesTarifs.length ? `<p class="pratique-note">${p.notesTarifs.map(fr).join(' ')}</p>` : ''}
  </div>
  ${folio('pratique')}
</section>`;

  // ---- quatrième de couverture -----------------------------------------------------------------------------
  const resa = p.liens.find((l) => l.type !== 'facebook');
  const fb = p.liens.find((l) => l.type === 'facebook');
  // le texte de dos, comme au dos d'un vrai magazine : son accroche, si elle est à elle et pas déjà en titre
  const dos = p.accroche && !p.accrocheGenerique && p.accroche !== p.phrase ? (p.accrocheSienne ? `«${NB}${fr(p.accroche)}${NB}»` : fr(p.accroche)) : '';
  const rdv = `
<section class="quatrieme${dos ? '' : ' quatrieme-courte'}" id="rdv" aria-labelledby="t-rdv">
  <p class="quatrieme-haut"><span>Quatrième de couverture</span><span>${fr(p.rdv)}</span></p>
  ${dos ? `<p class="quatrieme-dos">${dos}</p>` : ''}
  <h2 id="t-rdv" class="quatrieme-titre">Appelez${p.prenom ? ` ${fr(p.prenom)}` : ''}.</h2>
  ${p.tel ? `<a class="quatrieme-tel" href="${esc(p.telLien)}" data-ajuste><span>${fr(p.tel)}</span></a>` : `<p class="quatrieme-vide">${vide('Ici, votre numéro de téléphone.', 'À préciser')}</p>`}
  <div class="quatrieme-bas">
    <div class="quatrieme-actions">
      ${p.tel ? `<a class="bouton" href="${esc(p.telLien)}">Appeler</a>` : ''}
      ${resa ? `<a class="bouton bouton-creux" href="${esc(resa.url)}" target="_blank" rel="noopener">${fr(resa.texte)} <span aria-hidden="true">↗</span></a>` : ''}
      ${fb ? `<a class="bouton bouton-creux" href="${esc(fb.url)}" target="_blank" rel="noopener">Facebook <span aria-hidden="true">↗</span></a>` : ''}
    </div>
    <div class="quatrieme-code">${codeBarres(p.tel)}<span>N°${NB}01 · <span class="date-numero">${esc(date)}</span></span></div>
  </div>
</section>`;

  // ---- colophon -----------------------------------------------------------------------------------------
  const colophon = `
<footer class="colophon">
  <p class="colophon-titre">Colophon</p>
  <dl class="colophon-grille">
    <div class="colophon-numero"><dt>Ce numéro</dt><dd>Aperçu préparé pour ${fr(p.nom)}. Textes, photos, couleurs : tout se modifie selon vos goûts.</dd></div>
    <div class="colophon-suite"><dt>La suite</dt><dd>On peut partir de cet univers, en mélanger deux, ou repartir d’une page blanche, jusqu’au site qui vous ressemble exactement.</dd></div>
    <div><dt>Publication</dt><dd>${fr(p.personne || p.enseigne || p.nom)}${p.personne && p.enseigne ? `, ${fr(p.enseigne)}` : ''}</dd></div>
    <div><dt>Rédaction</dt><dd>Ses mots, mis en page</dd></div>
    <div><dt>Lieu</dt><dd>${p.lieu ? fr(p.lieu) : vide('Ici, votre adresse.', 'À préciser')}</dd></div>
    <div><dt>Contact</dt><dd>${p.tel ? `<a href="${esc(p.telLien)}">${fr(p.tel)}</a>` : vide('Ici, votre numéro.', 'À préciser')}</dd></div>
    <div><dt>Images</dt><dd>Photos d’ambiance Unsplash, objets détourés par nos soins</dd></div>
    ${p.siret ? `<div><dt>SIRET</dt><dd>${esc(p.siret)}</dd></div>` : ''}
  </dl>
  <p class="colophon-avert">${fr(p.avertissement)}</p>
  <p class="colophon-fin"><span>N°${NB}01, <span class="date-numero">${esc(date)}</span></span><a href="#couverture">Revenir à la couverture <span aria-hidden="true">↑</span></a><span>Maquette non publiée</span></p>
</footer>`;

  // ---- tête et sommaire plein écran ---------------------------------------------------------------------------
  const tete = `
<a class="evitement" href="#entretien">Aller au contenu</a>
<header class="tete" data-tete>
  <a class="tete-num" href="#couverture" aria-label="Revenir à la couverture">N°${NB}01</a>
  <p class="tete-nom">${fr(p.personne || p.enseigne || p.nom)}</p>
  <div class="tete-droite">
    <button class="tete-sommaire" type="button" aria-expanded="false" aria-controls="sommaire-plein" data-sommaire-bouton>Sommaire</button>
    ${p.tel ? `<a class="tete-appel" href="${esc(p.telLien)}">Appeler</a>` : ''}
  </div>
  <span class="tete-progression" aria-hidden="true" data-progression></span>
</header>
<div class="sommaire-plein" id="sommaire-plein" hidden data-sommaire>
  <p class="sommaire-plein-titre">Dans ce numéro</p>
  <ol role="list">${[['couverture', 'Couverture', 1], ...entrees.map(([id, t]) => [id, t, id === 'rdv' ? 'IV' : pages[id]])].map(([id, t, n]) => `<li><a href="#${id}"><b>${n}</b><span>${t}</span></a></li>`).join('')}</ol>
</div>`;

  return {
    famille: p.famille, palette: pal, initiales: p.initiales, nomCourt: p.personne || p.enseigne || p.nom,
    titre: `${p.nom} · ${[p.metier, p.ville].filter(Boolean).join(' à ')}`,
    description: p.accroche && !p.accrocheGenerique ? p.accroche : `${maj(p.metier)}${p.ville ? ' à ' + p.ville : ''}, sur rendez-vous.`,
    html: `${tete}<main id="contenu">${couverture}${sommaire}${entretien}${seance}${pleine}${pratique}${rdv}</main>${colophon}`,
    precharge: `images/${J.objets[0]}-objet-600.webp`,
  };
}
