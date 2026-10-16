// Institut : la page entiere depuis la fiche JSON d'un praticien.
// Meme module dans le navigateur (?p=<dossier>) et dans node (batir.mjs ecrit la page par defaut en dur :
// elle se lit sans JavaScript). Rien n'est invente : ce qui manque devient un emplacement qui dit ce qui viendra.
import { lireNom, metierAccorde, initiales } from './prenom.js';
import { PHOTOS } from './photos.js';

const ENT = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s = '') => String(s ?? '').replace(/[&<>"']/g, (c) => ENT[c]);
// Typographie francaise : espaces fines avant ; : ! ? », apres «, jamais de tiret long.
export const fr = (s = '') => esc(s).replace(/[\u2013\u2014]/g, ',').replace(/([.!?…]\s+)(\p{Ll})/gu, (t, a, b) => a + b.toUpperCase()).replace(/\s+([:;!?»])/g, ' $1').replace(/«\s*/g, '« ').replace(/rendez-vous/g, 'rendez‑vous');
const lien = (u) => (/^https?:\/\//i.test(u || '') ? esc(u) : '');
const place = (t) => /^\s*Ici,/.test(t || '');
// Aucune promesse de santé ni de résultat : une phrase du praticien qui en fait une (effets bénéfiques, guérison,
// système nerveux, sommeil amélioré, anti-âge...) n'est pas reprise. Les phrases de prudence restent.
const PROMESSE = /(effets? b[ée]n[ée]fiques?|bienfaits?|gu[ée]ri(r|son|t|ssent)?\b|\bsoign|syst[èe]me (nerveux|immunitaire)|am[ée]lior\w* (du |de la |le |la |votre |vos )?(sommeil|sant[ée]|peau|teint|circulation|digestion|immunit)|soulag|r[ée]sultats? (garanti|visible|imm[ée]diat)|rajeuni|anti.?[âa]ge|anti.?rides|minceur|amincis|perte de poids|cellulite|d[ée]toxi|\bmaladies?\b|pathologie|\bmaux\b|meilleure r[ée]cup[ée]ration|constater des|am[ée]liorations? concr|\bvitalit[ée]|r[ée]g[ée]n[ée]r|effets? (peuvent|sont|se font))/i;
const PRUDENCE = /(ne remplace|ne se substitue|en compl[ée]ment|avis m[ée]dical)/i;
export function sansPromesse(t = '') {
  const phrases = String(t || '').match(/[^.!?…]+[.!?…]*\s*/g) || [];
  return phrases.filter((p) => PRUDENCE.test(p) || !PROMESSE.test(p)).join('').trim();
}
// « Enfin, après la séance » : minuscule apres le mot de liaison, sauf sigle ou nom propre evident.
const minusc = (t) => (/^\p{Lu}\p{Ll}/u.test(t) && !/^(Reiki|Shiatsu|Bach|Reflexo)/i.test(t) ? t.charAt(0).toLowerCase() + t.slice(1) : t);

export function contexte(d) {
  const lu = lireNom(d);
  return { ...lu, metier: metierAccorde(d, lu.genre), ini: initiales(d, lu) };
}
export function titre(d) { const c = contexte(d); return `${c.personne}${c.enseigne ? ', ' + c.enseigne : ''} · ${c.metier}${d.ville ? ' à ' + d.ville : ''}`; }
export function description(d) { return d.accroche || `${contexte(d).metier}${d.ville ? ' à ' + d.ville : ''}, sur rendez-vous.`; }

// Photo d'ambiance (Unsplash), en deux tailles ; decorative : alt vide.
function photo(role, classe = '', tailles = '(min-width: 900px) 50vw, 100vw', charge = 'lazy') {
  const p = PHOTOS[role];
  if (!p) return '';
  return `<img class="${classe}" src="images/${p.nom}-900.webp" srcset="images/${p.nom}-900.webp 900w, images/${p.nom}-1600.webp 1600w" sizes="${tailles}" width="${p.l}" height="${p.h}" loading="${charge}" decoding="async" alt="">`;
}
const ratio = (role) => (PHOTOS[role] ? ` style="--ar:${PHOTOS[role].l} / ${PHOTOS[role].h}"` : '');

// Le nom en lignes : « Marion / Le Thimonnier ». Les particules restent avec le mot qui suit.
function lignesNom(nom) {
  const mots = nom.split(/\s+/).filter(Boolean);
  const groupes = [];
  for (let i = 0; i < mots.length; i++) {
    if (/^(le|la|de|du|des|van|von|di|da|d’|l’)$/i.test(mots[i]) && i < mots.length - 1) { groupes.push(mots[i] + ' ' + mots[i + 1]); i++; } else groupes.push(mots[i]);
  }
  if (groupes.length <= 2) return groupes;
  // trois mots ou plus : on equilibre en deux lignes
  let best = 1, ecart = 1e9;
  for (let k = 1; k < groupes.length; k++) { const a = groupes.slice(0, k).join(' ').length, b = groupes.slice(k).join(' ').length; if (Math.abs(a - b) < ecart) { ecart = Math.abs(a - b); best = k; } }
  return [groupes.slice(0, best).join(' '), groupes.slice(best).join(' ')];
}

function entete(d, c) {
  return `
<header class="barre" id="barre">
  <a class="barre-sceau" href="#accueil" aria-label="${esc(c.nom)}, retour en haut"><span aria-hidden="true">${esc(c.ini)}</span></a>
  <nav class="barre-liens" aria-label="Sections">
    <a href="#approche">L’approche</a><a href="#seance">Le rituel</a><a href="#tarifs">La carte</a><a href="#apropos">${c.prenom ? esc(c.prenom) : 'À propos'}</a>
  </nav>
  <a class="barre-rdv" href="#contact">Rendez&#8209;vous</a>
</header>`;
}

// Sans WebGL (et sans JavaScript) : une image fixe de la meme creme, rendue a l'avance dans chaque palette
// (outils/repli.mjs), large sur ordinateur, haute sur telephone.
function repli(pal = 'porcelaine') {
  return `<picture><source media="(min-width: 900px)" srcset="images/creme-repli-${pal}-large.webp" width="1600" height="1000"><img class="matiere-photo" src="images/creme-repli-${pal}-haute.webp" width="900" height="1400" loading="eager" decoding="async" alt=""></picture>`;
}

function accueil(d, c) {
  const lignes = lignesNom(c.personne);
  const long = c.personne.length > 26 ? 'nom-tres-long' : c.personne.length > 17 ? 'nom-long' : '';
  return `
<section class="accueil" id="accueil" aria-labelledby="nom">
  <div class="matiere" id="matiere" aria-hidden="true"><div class="matiere-fixe">${repli(c.palette)}</div></div>
  <div class="accueil-voile" aria-hidden="true"></div>
  <p class="accueil-metier">${fr(c.metier)}${d.ville ? ` <span>à ${fr(d.ville)}</span>` : ''}</p>
  <div class="accueil-bas">
    <h1 class="nom ${long}" id="nom">${lignes.map((l, i) => `<span class="nom-ligne" style="--i:${i}">${fr(l)}</span>`).join(' ')}</h1>
    ${c.enseigne ? `<p class="enseigne">${fr(c.enseigne)}</p>` : ''}
    ${sansPromesse(d.accroche) ? `<p class="accroche">${d.accrocheSienne && !/^[^.]{0,60}sur rendez-vous\.?$/i.test(d.accroche) ?'« ' + fr(sansPromesse(d.accroche)) + ' »' : fr(sansPromesse(d.accroche))}</p>` : ''}
    <div class="accueil-actions">
      <a class="bouton" href="#contact">Prendre rendez&#8209;vous</a>
      ${d.tel ? `<a class="lien-fin" href="${esc(d.telLien)}">${esc(d.tel)}</a>` : ''}
    </div>
  </div>
  <p class="invite" id="invite" aria-hidden="true">Effleurez la matière</p>
</section>`;
}

// Deux paragraphes presque identiques (fiches recopiees) : on garde le plus long.
function sansDoublons(paras) {
  const net = (p) => p.toLowerCase().replace(/[^\p{L}]/gu, '').slice(0, 70);
  return paras.filter((p, i) => !paras.some((q, j) => j !== i && net(q) === net(p) && (q.length > p.length || (q.length === p.length && j < i))));
}
function choisirPhare(d) {
  const paras = sansDoublons((d.approche || []).map(sansPromesse).filter(Boolean));
  if (d.conviction && sansPromesse(d.conviction)) return { phare: sansPromesse(d.conviction), reste: paras };
  // une conviction plutot qu'un deroule, une phrase courte plutot qu'un paragraphe, jamais un effet promis
  const score = (p) => (/(pour moi|je crois|mission|essentiel|convaincu|philosophie|conviction|c['’]est (plus|un|une))/i.test(p) ? 2 : 0) + (p.length > 30 && p.length < 180 ? 1 : 0) + (p.length < 110 ? .5 : 0) - (/(effet|r[ée]sultat|\d+ ?h\b|dure|tarif|€)/i.test(p) ? 3 : 0);
  let best = 0; paras.forEach((p, i) => { if (score(p) > score(paras[best])) best = i; });
  return { phare: paras[best] || '', reste: paras.filter((_, i) => i !== best) };
}

function approche(d, c) {
  const { phare, reste } = choisirPhare(d);
  const apports = (d.apports || []).filter((a) => a && a.titre);
  return `
<section class="section approche" id="approche" aria-labelledby="approche-titre">
  <h2 class="titre-section" id="approche-titre">L’approche</h2>
  ${phare ? `<blockquote class="manifeste${phare.length > 150 ? ' manifeste-long' : ''}"><p data-remplir>${fr(phare)}</p></blockquote>`
    : `<p class="manifeste manifeste-vide emplacement">Ici, votre approche avec vos mots : ce qui vous anime, ce que vous voulez offrir à chaque personne.</p>`}
  <div class="approche-suite">
    <figure class="cadre-photo photo-approche"${ratio('approche')}>${photo('approche', 'revele-photo')}</figure>
    <div class="approche-texte">
      ${reste.length ? reste.map((p) => `<p>${fr(p)}</p>`).join('\n      ') : `<p class="emplacement">Ici, quelques lignes de plus : votre façon de travailler, ce qui rend vos soins différents.</p>`}
    </div>
  </div>
  ${apports.length ? `
  <div class="composition">
    <h3 class="composition-titre">Ce qu’on y trouve</h3>
    <p class="composition-liste">${apports.map((a) => `<span class="ingredient"><b>${fr(a.titre)}</b>${a.texte ? ` <i>${fr(a.texte.replace(/\.$/, ''))}</i>` : ''}</span>`).join('<span class="sep" aria-hidden="true"> · </span>')}</p>
  </div>` : ''}
</section>`;
}

function seance(d, c) {
  const etapes = (d.etapes || []).filter((e) => e && e.titre).map((e) => ({ ...e, texte: sansPromesse(e.texte) || 'Ici, ce moment de la séance raconté avec vos mots.' }));
  const liens = { 1: [''], 2: ['D’abord', 'Puis'], 3: ['D’abord', 'Puis', 'Enfin'], 4: ['D’abord', 'Puis', 'Ensuite', 'Enfin'] }[etapes.length]
    || etapes.map((_, i) => (i === 0 ? 'D’abord' : i === etapes.length - 1 ? 'Enfin' : i % 2 ? 'Puis' : 'Ensuite'));
  const durees = [d.dureePremiere && `La première séance dure ${d.dureePremiere}.`, d.dureeSuivi && `Les séances suivantes, ${d.dureeSuivi}.`].filter(Boolean);
  const geste = (e, i) => {
    const vide = place(e.texte);
    const t = liens[i] ? `${liens[i]}, ${minusc(e.titre)}` : e.titre;
    return `<p class="geste${vide ? ' geste-vide' : ''}"><em class="geste-titre">${fr(t)}.</em> <span class="${vide ? 'emplacement' : ''}">${fr(e.texte)}</span>${e.duree ? ` <span class="geste-duree">${fr(e.duree)}</span>` : ''}</p>`;
  };
  return `
<section class="section rituel" id="seance" aria-labelledby="seance-titre">
  <figure class="rituel-image" aria-hidden="true">${photo('rituel', 'rituel-photo', '100vw')}</figure>
  <div class="rituel-texte">
    <h2 class="titre-section" id="seance-titre">Le rituel</h2>
    <p class="rituel-sous">La séance, pas à pas, comme on la vit chez ${c.prenom ? esc(c.prenom) : esc(c.personne)}.</p>
    <div class="rituel-prose">
      ${etapes.length ? etapes.map(geste).join('\n      ') : `<p class="geste geste-vide"><span class="emplacement">Ici, le déroulé d’une séance : l’accueil, le soin, et ce qui suit.</span></p>`}
      ${durees.length ? `<p class="geste geste-durees">${durees.map(fr).join(' ')}</p>` : ''}
    </div>
  </div>
</section>`;
}

function tarifs(d, c) {
  const t = (d.tarifs || []).filter((x) => x && x.nom);
  const notes = [d.dureePremiere && `Première séance : ${d.dureePremiere}`, d.dureeSuivi && `Suivi : ${d.dureeSuivi}`].filter(Boolean);
  const soin = (x, i) => `
        <li class="soin">
          <span class="soin-nom">${fr(x.nom)}</span><span class="soin-points" aria-hidden="true"></span><span class="soin-prix">${fr(x.prix || 'Sur demande')}</span>
          ${i === 0 && notes.length ? `<span class="soin-detail">${notes.map(fr).join(' · ')}</span>` : ''}
        </li>`;
  const vides = [['Ici, votre premier soin', 'Sa durée, ce qu’il comprend'], ['Ici, un autre soin', 'Un forfait, une cure, une carte cadeau'], ['Ici, vos soins à domicile ou en structure', 'Si vous vous déplacez']];
  return `
<section class="section carte" id="tarifs" aria-labelledby="tarifs-titre">
  <figure class="flacon" aria-hidden="true">
    ${photo('carte', 'flacon-img', '(min-width: 900px) 42vw, 100vw')}
    <span class="flacon-etiquette"><span class="fe-ini">${esc(c.ini)}</span><span class="fe-nom">${esc(c.personne)}</span><span class="fe-lieu">${d.ville ? esc(d.ville) : esc(c.metier)}</span></span>
  </figure>
  <article class="carte-papier">
    <p class="carte-sceau" aria-hidden="true"><span>${esc(c.ini)}</span></p>
    <h2 class="carte-titre" id="tarifs-titre">La carte <i>des soins</i></h2>
    <p class="carte-maison">${fr(c.enseigne || c.personne)}${d.ville ? ` · ${fr(d.ville)}` : ''}</p>
    <ul class="soins" role="list">${t.length ? t.map(soin).join('') : vides.map(([n, s]) => `
        <li class="soin soin-vide">
          <span class="soin-nom emplacement">${fr(n)}</span><span class="soin-points" aria-hidden="true"></span><span class="soin-prix emplacement">votre tarif</span>
          <span class="soin-detail">${fr(s)}</span>
        </li>`).join('')}
    </ul>
    ${d.paiement ? `<p class="carte-reglement">${fr(d.paiement)}</p>` : `<p class="carte-reglement emplacement">Ici, vos moyens de règlement.</p>`}
    <div class="etiquette-labo" aria-hidden="true">
      <span>${esc(c.personne)}</span><span>${esc(c.metier)}</span><span>${d.ville ? esc(d.ville) + (d.cp ? ' ' + esc(d.cp) : '') : 'Sur rendez-vous'}</span><span>Soin préparé à la main</span>
    </div>
  </article>
</section>`;
}

function apropos(d, c) {
  const paras = (d.apropos || []).filter(Boolean);
  const reste = c.prenom && c.personne.startsWith(c.prenom) ? c.personne.slice(c.prenom.length).trim() : '';
  return `
<section class="section lettre" id="apropos" aria-labelledby="apropos-titre">
  <figure class="portrait" aria-label="Emplacement pour votre portrait">
    <div class="portrait-cadre" aria-hidden="true">${photo('portrait', 'portrait-soie', '(min-width: 900px) 36vw, 100vw')}<span class="portrait-lumiere"></span></div>
    <figcaption>Ici, votre portrait</figcaption>
  </figure>
  <div class="lettre-papier">
    <h2 class="titre-section lettre-titre" id="apropos-titre" style="--l:${Math.max(5, ...(c.prenom || c.personne).split(' ').map((w) => w.length))}">${c.prenom ? `${esc(c.prenom)}${reste ? ` <span>${esc(reste)}</span>` : ''}` : fr(c.personne)}</h2>
    <div class="lettre-corps">
      ${paras.length ? paras.map((p) => `<p>${fr(p)}</p>`).join('\n      ') : `<p class="emplacement">Ici, votre parcours en quelques lignes : ce qui vous a menée à ce métier, vos formations, ce qui compte pour vous.</p>`}
      ${d.cerf ? `<p class="lettre-citation">${fr(d.cerf)}</p>` : ''}
    </div>
    <p class="signature" aria-hidden="true">${esc(c.prenom || c.ini)}</p>
  </div>
</section>`;
}

function contact(d, c) {
  const resa = /resalib\.fr/i.test(d.resalib || '') ? lien(d.resalib) : '';
  const fb = lien(d.facebook);
  const lieu = [d.ville, d.cp && `(${d.cp})`].filter(Boolean).join(' ');
  return `
<section class="section rendezvous" id="contact" aria-labelledby="contact-titre">
  <div class="rdv-tete">
    <h2 class="titre-section" id="contact-titre">Prendre rendez&#8209;vous</h2>
    <p class="rdv-mode">${fr(d.rdv || 'Sur rendez-vous')}${d.ville ? `, à ${fr(d.ville)}` : ''}.</p>
  </div>
  <div class="carte-rdv" id="carte-rdv">
    <button class="carte-rdv-objet" type="button" aria-label="Retourner la carte de rendez-vous">
      <span class="carte-rdv-face recto" aria-hidden="true">
        <span class="crv-sceau">${esc(c.ini)}</span>
        <span class="crv-nom">${esc(c.personne)}</span>
        <span class="crv-metier">${esc(c.metier)}${d.ville ? ' · ' + esc(d.ville) : ''}</span>
        <span class="crv-tel">${d.tel ? esc(d.tel) : 'Votre numéro'}</span>
      </span>
      <span class="carte-rdv-face verso" aria-hidden="true">
        <span class="crv-titre">Votre prochain rendez&#8209;vous</span>
        <span class="crv-ligne">le <i></i></span>
        <span class="crv-ligne">à <i></i></span>
        <span class="crv-note">En cas d’empêchement, merci de prévenir.</span>
      </span>
    </button>
  </div>
  <div class="rdv-coord">
    ${d.tel ? `<a class="tel-geant" href="${esc(d.telLien)}">${esc(d.tel)}</a>` : `<p class="tel-geant emplacement">Ici, votre numéro</p>`}
    <p class="rdv-liens">
      ${d.tel ? `<a href="${esc(d.telLien)}">${esc(d.appeler || 'Appeler')}</a>` : ''}
      ${resa ? `<a href="${resa}" rel="noopener" target="_blank">Réserver en ligne</a>` : ''}
      ${fb ? `<a href="${fb}" rel="noopener" target="_blank">Facebook</a>` : ''}
    </p>
    <dl class="infos">
      <div><dt>Où</dt><dd>${lieu ? fr(lieu) : '<span class="emplacement">Ici, votre ville</span>'}<br><span class="emplacement">Ici, l’adresse de l’institut, ou les lieux où vous vous déplacez</span></dd></div>
      <div><dt>Quand</dt><dd><span class="emplacement">Ici, vos jours et horaires</span></dd></div>
      ${d.paiementListe ? `<div><dt>Règlement</dt><dd>${fr(d.paiementListe.charAt(0).toUpperCase() + d.paiementListe.slice(1))}</dd></div>` : ''}
    </dl>
  </div>
</section>`;
}

function pied(d, c) {
  return `
<footer class="pied" id="pied">
  <p class="pied-sceau" aria-hidden="true">${esc(c.ini)}</p>
  <p class="pied-nom">${fr(c.nom)}<span>${fr(c.metier)}${d.ville ? ' · ' + fr(d.ville) : ''}</span></p>
  <p class="pied-apercu">Aperçu préparé pour ${fr(c.nom)}. Textes, photos, couleurs : tout se modifie selon vos goûts.</p>
  <p class="pied-mesure">On peut partir de cet univers, en mêler deux, ou repartir d’une page blanche, jusqu’au site qui vous ressemble exactement.</p>
  <p class="pied-avert">${fr(d.avertissement || '')}</p>
  ${d.siret ? `<p class="pied-legal">SIRET ${esc(d.siret)}</p>` : ''}
  <a class="pied-haut" href="#accueil">Revenir en haut</a>
</footer>`;
}

export function rendre(d, palette) {
  const c = { ...contexte(d), palette };
  return entete(d, c) + '\n<main id="contenu">' + accueil(d, c) + approche(d, c) + seance(d, c) + tarifs(d, c) + apropos(d, c) + contact(d, c) + '\n</main>' + pied(d, c);
}
