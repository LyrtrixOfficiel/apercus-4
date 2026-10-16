// Liquid glass : du JSON du praticien au HTML de la page.
// Module partagé : node l'utilise pour écrire index.html (lisible sans JavaScript),
// le navigateur le réutilise pour ?p=<dossier>&palette=<id>. Aucune API du DOM ici.
//
// La page raconte le praticien avec les formes de l'interface d'Apple :
// écran verrouillé (accueil), feuille qui se déploie (approche), contrôle segmenté (séance),
// widgets (tarifs), affiche de contact (à propos), fiche Contacts (rendez-vous), barre d'onglets flottante.
import { famille as familleDe } from '../../commun/familles.js';
import { PALETTES, choisirPalette } from './palettes.js';
import { PHOTOS, PAPIERS, PORTRAITS } from './photos.js';
import { identite } from './prenom.js';

export { PALETTES };

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);
const propre = (s) => String(s ?? '').replace(/[\u2013\u2014]/g, ',').replace(/\s+/g, ' ').trim();
const plein = (s) => propre(s).length > 0;
// « rendez-vous », « bien-être » ne se coupent jamais au trait d'union
// typographie française : espace insécable avant ; : ! ? » et après «, entre un nombre et son unité (1 h, 60 €)
const fine = (h) => h.replace(/ ([;:!?»])/g, '\u00A0$1').replace(/« /g, '«\u00A0').replace(/(\d) (?=(?:h|min|€|ans|séances?)(?!\p{L})|\d)/gu, '$1\u00A0');
const txt = (s) => fine(esc(propre(s))).replace(/(\S*-\S*)/g, (m) => (m.length <= 16 ? `<span class="insecable">${m}</span>` : m));

// Icônes au trait, dessinées pour la maquette (esprit SF Symbols, aucun fichier d'Apple).
const svg = (d, extra = '') => `<svg viewBox="0 0 24 24" aria-hidden="true" ${extra}>${d}</svg>`;
const T = 'fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';
export const I = {
  maison: svg(`<path ${T} d="M4 11 12 4.5 20 11v8a1.5 1.5 0 0 1-1.5 1.5H15v-5.5H9v5.5H5.5A1.5 1.5 0 0 1 4 19Z"/>`),
  etoile: svg(`<path ${T} d="M12 3.5c.7 4.4 3.1 6.8 7.5 7.5-4.4.7-6.8 3.1-7.5 7.5-.7-4.4-3.1-6.8-7.5-7.5 4.4-.7 6.8-3.1 7.5-7.5Z"/>`),
  horloge: svg(`<circle ${T} cx="12" cy="12" r="8.5"/><path ${T} d="M12 7.5V12l3 2"/>`),
  etiquette: svg(`<path ${T} d="M3.8 12.4V5.3a1.5 1.5 0 0 1 1.5-1.5h7.1l7.9 7.9a1.5 1.5 0 0 1 0 2.1l-6.9 6.9a1.5 1.5 0 0 1-2.1 0Z"/><circle cx="8.3" cy="8.3" r="1.5" fill="currentColor"/>`),
  personne: svg(`<circle ${T} cx="12" cy="8" r="3.8"/><path ${T} d="M4.5 20c.9-3.9 3.9-6 7.5-6s6.6 2.1 7.5 6"/>`),
  tel: svg(`<path ${T} d="M6.6 3.5h2.6l1.4 4-2 1.3a12 12 0 0 0 6.6 6.6l1.3-2 4 1.4v2.6a2 2 0 0 1-2.2 2A17.6 17.6 0 0 1 4.6 5.7a2 2 0 0 1 2-2.2Z"/>`),
  cal: svg(`<rect ${T} x="4" y="5.5" width="16" height="14.5" rx="3"/><path ${T} d="M8 3.5v4M16 3.5v4M4 10h16"/>`),
  lieu: svg(`<path ${T} d="M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11Z"/><circle ${T} cx="12" cy="10" r="2.3"/>`),
  fleche: svg(`<path ${T} d="M7 17 17 7M9 7h8v8"/>`),
  fermer: svg(`<path ${T} d="M7 7l10 10M17 7 7 17"/>`),
  ajout: svg(`<circle ${T} cx="10" cy="8" r="3.6"/><path ${T} d="M3.5 19.5c.8-3.6 3.4-5.6 6.5-5.6 1.3 0 2.5.3 3.5.9M18 13.5v6M15 16.5h6"/>`),
  bulle: svg(`<path ${T} d="M4.5 11.5c0-4 3.4-7 7.5-7s7.5 3 7.5 7-3.4 7-7.5 7c-1 0-2-.2-2.9-.5L5 19.5l1-3.4c-1-1.3-1.5-2.9-1.5-4.6Z"/>`),
  monde: svg(`<circle ${T} cx="12" cy="12" r="8.5"/><path ${T} d="M3.5 12h17M12 3.5c2.4 2.4 3.5 5.2 3.5 8.5s-1.1 6.1-3.5 8.5c-2.4-2.4-3.5-5.2-3.5-8.5s1.1-6.1 3.5-8.5Z"/>`),
  haut: svg(`<path ${T} d="M12 19V5M6 11l6-6 6 6"/>`),
  euro: svg(`<path ${T} d="M17 6.5A6.5 6.5 0 0 0 7.2 9.5M17 17.5a6.5 6.5 0 0 1-9.8-3M5 10.5h8M5 13.5h8"/>`),
  carte: svg(`<rect ${T} x="3.5" y="6" width="17" height="12" rx="2.5"/><path ${T} d="M3.5 10h17"/>`),
};

// « 60 € à 90 € » : chaque montant reste entier, la coupure ne tombe que sur « à »
const prix = (p) => esc(propre(p)).replace(/(\d[\d\s,.]*\s?€)/g, (m) => `<span class="insecable">${m.trim()}</span>`);

function lienFiche(url) {
  if (!url) return null;
  if (/resalib\./i.test(url)) return 'Réserver sur Resalib';
  if (/doctolib\./i.test(url)) return 'Réserver sur Doctolib';
  return 'Voir ma fiche en ligne';
}

// Libellé court d'une étape pour le contrôle segmenté : « Le premier rendez-vous » -> « Premier rendez-vous »
function court(titre) {
  const t = propre(titre).replace(/^(le|la|les)\s+/i, '').replace(/^l[’']\s*/i, '');
  return t.charAt(0).toUpperCase() + t.slice(1);
}

// Les photos de la palette, rangées par affinité avec la famille du métier.
export function photosPour(palette, fam) {
  const liste = Object.entries(PHOTOS).filter(([, p]) => p.palette === palette.id);
  const score = ([, p]) => (p.familles?.includes(fam) ? 2 : 0) + (p.reserve ? 0 : 1);
  liste.sort((a, b) => score(b) - score(a));
  const noms = liste.map(([n]) => n);
  if (!noms.length) return null;
  const pris = (i) => noms[i % noms.length];
  return { accueil: pris(0), approche: pris(1), seance: pris(2), apropos: pris(3) };
}

function fond(photo, opts = '') {
  if (!photo) return `<div class="scene-fond papier" aria-hidden="true"></div>`;
  const P = PHOTOS[photo];
  return `<div class="scene-fond" aria-hidden="true"${opts}><picture><source media="(max-width: 760px)" srcset="images/${photo}-m.webp"><img src="images/${photo}-d.webp" alt="" decoding="async" data-photo="${photo}"${P?.clair ? ' data-clair' : ''}></picture></div>`;
}
const tonDe = (photo) => (photo && PHOTOS[photo] && PHOTOS[photo].clair ? 'clair' : 'sombre');

function vcard(d, id, metier, ville) {
  const tel = String(d.telLien || '').replace(/^tel:/, '');
  const [prenom, ...reste] = id.nom.split(' ');
  const lignes = ['BEGIN:VCARD', 'VERSION:3.0', `FN:${id.nom}`, `N:${reste.join(' ')};${prenom};;;`];
  if (metier) lignes.push(`TITLE:${metier}`);
  if (tel) lignes.push(`TEL;TYPE=CELL:${tel}`);
  if (ville) lignes.push(`ADR;TYPE=WORK:;;;${ville};;${propre(d.cp)};France`);
  if (d.resalib) lignes.push(`URL:${d.resalib}`);
  lignes.push('END:VCARD');
  return 'data:text/vcard;charset=utf-8,' + encodeURIComponent(lignes.join('\r\n'));
}

export function rendre(d, options = {}) {
  const fam = familleDe(d);
  const palette = choisirPalette(fam, options.palette);
  const photos = photosPour(palette, fam);
  const id = identite(d);
  const nom = id.nom, metier = propre(d.metier), ville = propre(d.ville);
  const approche = (d.approche || []).filter(plein);
  const apropos = (d.apropos || []).filter(plein);
  const apports = (d.apports || []).filter((a) => plein(a.titre));
  const tarifs = (d.tarifs || []).filter((t) => plein(t.nom));
  const etapes = (d.etapes || []).filter((e) => plein(e.titre));
  const fiche = lienFiche(d.resalib);
  const rdv = propre(d.rdv) || 'Sur rendez-vous';
  const sienne = d.accrocheSienne && plein(d.accroche);
  const ligneDate = [metier, ville].filter(Boolean).join(' · ');
  const notifTexte = sienne ? propre(d.accroche) : [rdv, ville ? `à ${ville}` : ''].filter(Boolean).join(' ') + '.';
  const tel = esc(d.tel), telLien = esc(d.telLien);
  // son portrait, quand il existe : champ « portrait » de la fiche (images/<dossier>.webp, ../<dossier partagé>/..., ou https)
  // ou fichier déposé dans images/portraits/<dossier>.webp (repéré par node outils/images.mjs)
  const brutPortrait = propre(d.portrait) || PORTRAITS?.[d.dossier] || '';
  const portrait = /^(https?:\/\/|images\/|\.\.\/)[^"'<>\s]+$/.test(brutPortrait) ? brutPortrait : '';
  const visage = (cls, alt = '') => `<img class="${cls}" src="${esc(portrait)}" alt="${esc(alt)}" decoding="async">`;
  const lien = (dossier, pal) => `?p=${encodeURIComponent(dossier)}&amp;palette=${pal}#pied`;

  // ---------------------------------------------------------------- chrome : chargement, haut, barre d'onglets, menu
  const chrome = `
<a class="evitement" href="#approche">Aller au contenu</a>
<div class="chargement" aria-hidden="true"><div class="ch-verre"><span>${esc(id.initiales)}</span></div><p class="ch-prenom">${esc(id.prenom)}</p></div>
<div class="bord-defilement bord-haut" aria-hidden="true"></div>
<div class="bord-defilement bord-bas" aria-hidden="true"></div>
<header class="haut-page">
  <a class="capsule-nom verre-dom" href="#accueil" aria-label="${esc(nom)}, haut de page"><span class="avatar-mini">${portrait ? visage('visage') : esc(id.initiales)}</span><span class="capsule-nom-texte"><span class="cn-nom">${esc(nom)}</span><span class="cn-section" aria-hidden="true"></span></span></a>
  <a class="capsule-rdv verre-dom" href="#contact">${I.cal}<span>Prendre rendez-vous</span></a>
</header>
<nav class="barre-onglets" aria-label="Sections de la page">
  <div class="onglets verre-dom">
    <span class="onglets-pastille" aria-hidden="true"></span>
    <a class="onglet" href="#accueil" data-cible="accueil">${I.maison}<span>Accueil</span></a>
    <a class="onglet" href="#approche" data-cible="approche">${I.etoile}<span>Approche</span></a>
    <a class="onglet" href="#seance" data-cible="seance">${I.horloge}<span>Séance</span></a>
    <a class="onglet" href="#tarifs" data-cible="tarifs">${I.etiquette}<span>Tarifs</span></a>
    <a class="onglet" href="#apropos" data-cible="apropos">${I.personne}<span>À propos</span></a>
  </div>
  <button class="bouton-rdv verre-dom" type="button" aria-expanded="false" aria-controls="menu-rdv"><span class="br-icone">${I.cal}</span><span class="br-fermer">${I.fermer}</span><span class="vh">Prendre rendez-vous</span></button>
</nav>
<div class="menu-rdv verre-dom" id="menu-rdv" hidden>
  <p class="menu-titre">Prendre rendez-vous</p>
  <a class="menu-ligne" href="${telLien}">${I.tel}<span><strong>Appeler</strong><small>${tel}</small></span></a>
  ${fiche ? `<a class="menu-ligne" href="${esc(d.resalib)}" rel="noopener" target="_blank">${I.cal}<span><strong>${esc(fiche)}</strong><small>En ligne, à toute heure</small></span></a>` : ''}
  <a class="menu-ligne" href="${vcard(d, id, metier, ville)}" download="${esc(nom.replace(/[^\p{L}\p{N}]+/gu, '-'))}.vcf" data-vcard>${I.ajout}<span><strong>Ajouter à mes contacts</strong><small>Son numéro dans votre téléphone</small></span></a>
  ${plein(d.facebook) ? `<a class="menu-ligne" href="${esc(d.facebook)}" rel="noopener" target="_blank">${I.bulle}<span><strong>Facebook</strong><small>Sa page</small></span></a>` : ''}
</div>`;

  // ---------------------------------------------------------------- accueil : l'écran verrouillé
  const accueil = `
<section id="accueil" class="scene accueil" data-ton="${tonDe(photos?.accueil)}">
  ${fond(photos?.accueil)}
  <canvas class="scene-verre" aria-hidden="true"></canvas>
  <div class="scene-contenu verrou">
    ${ligneDate ? `<p class="ligne-date" data-verre="voile">${txt(ligneDate)}</p>` : ''}
    <h1 class="prenom-geant" data-verre="texte" style="--n:${Math.max(3, id.prenom.length)}" aria-label="${esc(nom)}${metier ? ', ' + esc(metier) : ''}${ville ? ' à ' + esc(ville) : ''}"><span aria-hidden="true">${esc(id.prenom)}</span></h1>
    <div class="verrou-bas">
      <div class="notif-pile" data-groupe>
        <span class="notif-fantome" data-verre="notif" aria-hidden="true"></span>
        <article class="notif" data-verre="notif">
          <span class="notif-icone" aria-hidden="true">${portrait ? visage('visage') : esc(id.initiales)}</span>
          <div class="notif-corps">
            <p class="notif-tete"><strong>${esc(nom)}</strong><span>maintenant</span></p>
            <p class="notif-texte">${txt(notifTexte)}</p>
          </div>
        </article>
      </div>
      <div class="verrou-actions" data-groupe>
        <a class="capsule" data-verre="capsule" href="${telLien}" aria-label="Appeler le ${tel}">${I.tel}<span>Appeler</span></a>
        <a class="capsule" data-verre="capsule" href="#contact">${I.cal}<span>Rendez-vous</span></a>
      </div>
      <a class="indicateur" href="#approche" data-verre="voile"><span class="indicateur-barre" aria-hidden="true"></span><span class="indicateur-texte">Faites défiler pour entrer</span></a>
    </div>
  </div>
</section>`;

  // ---------------------------------------------------------------- approche : une capsule qui s'étire en feuille
  const approcheSec = `
<section id="approche" class="scene approche" data-ton="${tonDe(photos?.approche)}">
  ${fond(photos?.approche)}
  <canvas class="scene-verre" aria-hidden="true"></canvas>
  <div class="scene-contenu">
    <div class="feuille" data-verre="panneau" data-morph>
      <span class="feuille-capsule" aria-hidden="true">${I.etoile}<span>Mon approche</span></span>
      <div class="feuille-interieur">
        <span class="poignee" aria-hidden="true"></span>
        <h2 class="titre-feuille">Mon approche</h2>
        ${plein(d.conviction) ? `<blockquote class="citation"><p>${txt(d.conviction)}</p></blockquote>` : ''}
        <div class="texte">
          ${approche.length ? approche.map((p, i) => `<p${i === 0 && !plein(d.conviction) ? ' class="chapo"' : ''}>${txt(p)}</p>`).join('') : `<div class="emplacement"><p class="emplacement-titre">Ici, votre approche</p><p>Votre chemin jusqu’à ce métier, ce que vous proposez, et pour qui. En quelques phrases, avec vos mots.</p></div>`}
        </div>
        ${apports.length ? `<ul class="liste-groupee">${apports.map((a) => `<li><span class="lg-titre">${txt(a.titre)}</span>${plein(a.texte) ? `<span class="lg-texte">${txt(a.texte)}</span>` : ''}</li>`).join('')}</ul>` : ''}
      </div>
    </div>
  </div>
</section>`;

  // ---------------------------------------------------------------- séance : contrôle segmenté et panneaux
  const seanceSec = `
<section id="seance" class="scene seance" data-ton="${tonDe(photos?.seance)}">
  ${fond(photos?.seance)}
  <canvas class="scene-verre" aria-hidden="true"></canvas>
  <div class="scene-contenu">
    <h2 class="titre-scene"><span data-verre="voile">La séance</span></h2>
    ${d.etapesEmplacement ? `<p class="note-scene" data-verre="voile">Ces étapes attendent vos mots : elles se remplissent ensemble.</p>` : ''}
    <div class="segments" data-verre="panneau" role="tablist" aria-label="Les temps de la séance" data-n="${etapes.length}">
      <span class="segments-pouce verre-dom" aria-hidden="true"></span>
      ${etapes.map((e, i) => `<button class="segment" type="button" role="tab" id="onglet-etape-${i}" aria-controls="etape-${i}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}"><span>${txt(court(e.titre))}</span></button>`).join('')}
    </div>
    <div class="etapes-cadre">
      <div class="etapes-piste">
        ${etapes.map((e, i) => `<article class="etape${d.etapesEmplacement ? ' etape-vide' : ''}" id="etape-${i}" role="tabpanel" aria-labelledby="onglet-etape-${i}" data-verre="panneau">
          <h3>${txt(e.titre)}</h3>
          <p>${txt(e.texte)}</p>
          ${plein(e.duree) ? `<p class="etape-duree">${I.horloge}<span>${txt(e.duree)}</span></p>` : ''}
        </article>`).join('')}
      </div>
    </div>
  </div>
</section>`;

  // ---------------------------------------------------------------- tarifs : des widgets
  const t0 = tarifs[0];
  const lignesDurees = [plein(d.dureePremiere) ? ['Première séance', d.dureePremiere] : null, plein(d.dureeSuivi) ? ['Suivi', d.dureeSuivi] : null].filter(Boolean);
  const widgetPrix = t0
    ? `<div class="widget widget-prix" data-verre="panneau">
        <p class="w-libelle">${I.etiquette}<span>${txt(t0.nom)}</span></p>
        <p class="w-prix">${prix(t0.prix || 'Sur demande')}</p>
        ${tarifs.length > 1 ? `<ul class="w-autres">${tarifs.slice(1).map((t) => `<li><span>${txt(t.nom)}</span><span>${txt(t.prix || 'Sur demande')}</span></li>`).join('')}</ul>` : ''}
        ${lignesDurees.length ? `<ul class="w-durees">${lignesDurees.map(([a, b]) => `<li><span>${a}</span><span>${txt(b)}</span></li>`).join('')}</ul>` : ''}
      </div>`
    : `<div class="widget widget-prix widget-vide" data-verre="panneau">
        <p class="w-libelle">${I.etiquette}<span>Vos séances</span></p>
        <p class="w-prix w-prix-vide">Ici, vos tarifs</p>
        <p class="w-note">Vos séances, leur durée et leur prix, comme vous les présentez.</p>
      </div>`;
  const tarifsSec = `
<section id="tarifs" class="scene tarifs" data-ton="${palette.ton === 'sombre' ? 'sombre' : 'clair'}">
  ${fond(PAPIERS?.[palette.id] ? 'papier-' + palette.id : null)}
  <canvas class="scene-verre" aria-hidden="true"></canvas>
  <div class="scene-contenu">
    <h2 class="titre-scene"><span data-verre="voile">Tarifs</span></h2>
    <div class="widgets" data-groupe>
      ${widgetPrix}
      <div class="widget widget-rdv" data-verre="panneau">
        <p class="w-grand">${I.cal}<span>${txt(rdv)}</span></p>
        ${ville ? `<p class="w-ligne">${I.lieu}<span>${txt(ville)}</span></p>` : ''}
        <a class="capsule capsule-pleine" href="#contact">Réserver</a>
      </div>
      ${plein(d.paiementListe) ? `<div class="widget widget-paiement" data-verre="panneau"><p class="w-libelle">${I.carte}<span>Paiement</span></p><p class="w-texte">${txt(d.paiementListe.charAt(0).toUpperCase() + d.paiementListe.slice(1))}</p></div>` : ''}
    </div>
  </div>
</section>`;

  // ---------------------------------------------------------------- à propos : l'affiche de contact
  const aproposSec = `
<section id="apropos" class="scene apropos" data-ton="${tonDe(photos?.apropos)}">
  ${fond(photos?.apropos)}
  <canvas class="scene-verre" aria-hidden="true"></canvas>
  <div class="scene-contenu apropos-grille">
    <figure class="portrait${portrait ? ' avec-photo' : ''}">
      <div class="portrait-lentille" data-verre="lentille">${portrait ? visage('portrait-photo', 'Portrait de ' + nom) : `<span aria-hidden="true">${esc(id.initiales)}</span>`}</div>
      ${portrait ? '' : '<figcaption class="capsule capsule-info" data-verre="capsule">Ici, votre portrait</figcaption>'}
    </figure>
    <div class="apropos-texte" data-verre="panneau">
      <h2 class="apropos-nom">${esc(nom)}</h2>
      ${ligneDate ? `<p class="apropos-sous">${txt(ligneDate)}</p>` : ''}
      ${apropos.length ? apropos.map((p, i) => `<p${i === 0 ? ' class="chapo"' : ''}>${txt(p)}</p>`).join('') : `<div class="emplacement"><p class="emplacement-titre">Ici, votre histoire</p><p>Votre parcours, vos formations, ce qui vous anime. Quelques lignes qui vous ressemblent.</p></div>`}
      ${plein(d.cerf) ? `<p class="signature">${txt(d.cerf)}</p>` : ''}
    </div>
  </div>
</section>`;

  // ---------------------------------------------------------------- contact : la fiche Contacts, puis le pied
  const actions = [
    `<a class="action" href="${telLien}"><span class="action-rond" data-verre="capsule">${I.tel}</span><span class="action-nom">appeler</span></a>`,
    fiche ? `<a class="action" href="${esc(d.resalib)}" rel="noopener" target="_blank"><span class="action-rond" data-verre="capsule">${I.cal}</span><span class="action-nom">réserver</span></a>` : '',
    `<a class="action" href="${vcard(d, id, metier, ville)}" download="${esc(nom.replace(/[^\p{L}\p{N}]+/gu, '-'))}.vcf" data-vcard><span class="action-rond" data-verre="capsule">${I.ajout}</span><span class="action-nom">enregistrer</span></a>`,
    plein(d.facebook) ? `<a class="action" href="${esc(d.facebook)}" rel="noopener" target="_blank"><span class="action-rond" data-verre="capsule">${I.bulle}</span><span class="action-nom">facebook</span></a>` : '',
  ].filter(Boolean);
  const lignes = [
    `<a class="fiche-ligne" href="${telLien}"><span class="fl-libelle">mobile</span><span class="fl-valeur fl-tel">${tel}</span></a>`,
    `<div class="fiche-ligne"><span class="fl-libelle">rendez-vous</span><span class="fl-valeur">${txt(rdv)}</span></div>`,
    ville ? `<div class="fiche-ligne"><span class="fl-libelle">ville</span><span class="fl-valeur">${txt(ville)}${plein(d.cp) ? ` <span class="fl-doux">${esc(d.cp)}</span>` : ''}</span></div>` : '',
    plein(d.paiementListe) ? `<div class="fiche-ligne"><span class="fl-libelle">paiement</span><span class="fl-valeur">${txt(d.paiementListe)}</span></div>` : '',
    fiche ? `<a class="fiche-ligne" href="${esc(d.resalib)}" rel="noopener" target="_blank"><span class="fl-libelle">en ligne</span><span class="fl-valeur fl-lien">${esc(fiche)}</span></a>` : '',
  ].filter(Boolean);
  const autres = PALETTES.map((p) => `<a class="nuancier-choix${p.id === palette.id ? ' actif' : ''}" href="${lien(d.dossier, p.id)}" role="radio" aria-checked="${p.id === palette.id}" data-palette="${p.id}" style="--n0:${p.papier[0]};--n1:${p.papier[1]};--n2:${p.papier[2]};--n4:${p.papier[4]}"><span class="nuancier-rond" aria-hidden="true"></span><span class="nuancier-nom">${esc(p.nom)}</span></a>`).join('');
  const contactSec = `
<section id="contact" class="scene contact" data-ton="sombre">
  ${fond(photos?.accueil, ' data-flou')}
  <canvas class="scene-verre" aria-hidden="true"></canvas>
  <div class="scene-contenu">
    <div class="fiche">
      <div class="avatar" data-verre="lentille">${portrait ? visage('portrait-photo') : `<span>${esc(id.initiales)}</span>`}</div>
      <h2 class="fiche-nom" data-verre="voile">${esc(nom)}</h2>
      ${ligneDate ? `<p class="fiche-metier" data-verre="voile">${txt(ligneDate)}</p>` : ''}
      <div class="fiche-actions" data-groupe data-n="${actions.length}">${actions.join('')}</div>
      <div class="fiche-liste" data-verre="panneau">${lignes.join('')}</div>
    </div>
    <footer class="pied" id="pied" data-verre="panneau">
      <div class="pied-haut">
        <p class="pied-nom">${esc(nom)}</p>
        <p class="pied-infos">${[metier, ville].filter(Boolean).map(esc).join(' · ')}${plein(d.siret) ? ` · SIRET ${esc(d.siret)}` : ''}</p>
      </div>
      <p class="pied-apercu">Aperçu préparé pour ${esc(nom)}. Textes, photos, couleurs : tout se modifie selon vos goûts.</p>
      <p class="pied-melange">On peut partir de cet univers, en marier deux, ou repartir de zéro : on avance ensemble jusqu’au site qui vous ressemble exactement.</p>
      <div class="pied-palettes">
        <p class="pied-petit" id="titre-palettes">Essayer un autre fond d’écran</p>
        <div class="nuancier" role="radiogroup" aria-labelledby="titre-palettes">${autres}</div>
      </div>
      <p class="pied-avertissement">${txt(d.avertissement)}</p>
      <nav class="pied-liens" aria-label="Plan de la page"><a href="#approche">Approche</a><a href="#seance">Séance</a><a href="#tarifs">Tarifs</a><a href="#apropos">À propos</a><a href="#accueil">${I.haut}<span>Haut de page</span></a></nav>
    </footer>
  </div>
</section>`;

  const html = `${chrome}
<main id="contenu" data-famille="${fam}">${accueil}${approcheSec}${seanceSec}${tarifsSec}${aproposSec}${contactSec}
</main>`;
  const titre = `${nom}${metier ? ', ' + metier : ''}${ville ? ' à ' + ville : ''}`;
  const description = (sienne ? propre(d.accroche) : '') || `${metier}${ville ? ' à ' + ville : ''}, sur rendez-vous.`;
  return { html, titre, description, famille: fam, palette, photos, identite: id, couleur: palette.couleurs.fond };
}

// Variables CSS de la palette (écrites sur <html>)
export function variables(palette) {
  const c = palette.couleurs;
  return [`--fond:${c.fond}`, `--encre:${c.encre}`, `--accent:${c.accent}`, `--accent2:${c.accent2}`,
    ...palette.papier.map((x, i) => `--p${i}:${x}`)].join(';');
}
