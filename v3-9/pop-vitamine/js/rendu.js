// Pop vitaminé : du JSON du praticien au HTML de la page.
// Module partagé : node l'utilise pour écrire index.html (lisible sans JavaScript), le navigateur le réutilise
// pour ?p=<dossier>&palette=<id>. Aucune API du DOM ici.
//
// Chaque section a une forme pop qui lui appartient : l'affiche produit (accueil), l'étiquette géante (approche),
// l'emballage qu'on déplie (séance : le patron d'une boîte), le ticket (tarifs), l'affiche (à propos),
// le coupon et la boîte à jouets (contact). Les objets 3D y reviennent en autocollants.
import { famille as familleDe } from '../../commun/familles.js';
import { nettoyer, cle } from '../../commun/phrases.js';
import { PALETTES, choisirPalette, suivante } from './palettes.js';
import { identite } from './prenom.js';
import { objetsPour, autocollants, NOMS_OBJETS } from './objets-liste.js';

export { PALETTES };

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);
const propre = (s) => String(s ?? '').replace(/[\u2013\u2014]/g, ',').replace(/\s+/g, ' ').trim();
const plein = (s) => propre(s).length > 0;
const txt = (s) => esc(propre(s)).replace(/(\S*-\S*)/g, (m) => (m.length <= 16 ? `<span class="insecable">${m}</span>` : m));
const prix = (p) => esc(propre(p)).replace(/(\d[\d\s,.]*\s?€)/g, (m) => `<span class="insecable">${m.trim()}</span>`);
const maj = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const svg = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
const T = 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
const I = {
  tel: svg(`<path ${T} d="M6.6 3.5h2.6l1.4 4-2 1.3a12 12 0 0 0 6.6 6.6l1.3-2 4 1.4v2.6a2 2 0 0 1-2.2 2A17.6 17.6 0 0 1 4.6 5.7a2 2 0 0 1 2-2.2Z"/>`),
  menu: svg(`<path ${T} d="M5 8h14M5 12h14M5 16h14"/>`),
  fermer: svg(`<path ${T} d="M6 6l12 12M18 6 6 18"/>`),
  cal: svg(`<rect ${T} x="4" y="5.5" width="16" height="14.5" rx="2.5"/><path ${T} d="M8 3.5v4M16 3.5v4M4 10h16"/>`),
  fleche: svg(`<path ${T} d="M7 17 17 7M9 7h8v8"/>`),
  haut: svg(`<path ${T} d="M12 19V5M6 11l6-6 6 6"/>`),
  ciseaux: svg(`<circle ${T} cx="6" cy="6" r="3"/><circle ${T} cx="6" cy="18" r="3"/><path ${T} d="M20 4 8.1 15.9M14.5 14.5 20 20M8.1 8.1 12 12"/>`),
};
const autocollant = (nom, place) => `<span class="autocollant ac-${place}" data-objet="${nom}" role="img" aria-label="${esc(NOMS_OBJETS[nom] || nom)}" hidden></span>`;

function lienFiche(url) {
  if (!url) return null;
  if (/resalib\./i.test(url)) return 'Réserver sur Resalib';
  if (/doctolib\./i.test(url)) return 'Réserver sur Doctolib';
  return 'Voir ma fiche en ligne';
}

// Le nom géant : au plus trois lignes, les petits mots collés au suivant. Pour une enseigne très longue
// (« Nathalie Renouard Cabinet l'Art des Sens »), le prénom et le nom en géant, le reste au-dessus.
export function nomGeant(id) {
  let mots = id.nom.split(/\s+/).filter(Boolean);
  let reste = '';
  if (mots.length > 3 && id.prenom && mots[0].toLowerCase() === id.prenom.toLowerCase()) { reste = mots.slice(2).join(' '); mots = mots.slice(0, 2); }
  const lignes = [];
  for (let i = 0; i < mots.length; i++) {
    const m = mots[i];
    const dernier = lignes[lignes.length - 1];
    if (dernier && (dernier.length <= 3 || m.length <= 2 || /^[dl]['’]/i.test(m)) && (dernier + ' ' + m).length <= 13) lignes[lignes.length - 1] = dernier + ' ' + m;
    else lignes.push(m);
  }
  while (lignes.length > 3) { const a = lignes.pop(); lignes[lignes.length - 1] += ' ' + a; }
  return { lignes, reste };
}

function sceneStyle(P, cle, suite) {
  const [a, b, e] = P.scenes[cle];
  let s = `--a:${a};--b:${b};--encre:${e}`;
  if (suite) { const [na, nb] = P.scenes[suite]; s += `;--na:${na};--nb:${nb}`; }
  return s;
}

const vague = `<div class="vague" aria-hidden="true"></div>`;

export function rendre(d, options = {}) {
  d = nettoyer(d); // règle commune des 11 univers : promesses retirées, doublons, prix et durée hors de l'approche
  const fam = familleDe(d);
  const P = choisirPalette(fam, options.palette);
  const id = identite(d);
  const nom = id.nom, metier = propre(d.metier), ville = propre(d.ville);
  const geant = nomGeant(id);
  // l'approche rangée : la phrase d'ouverture choisie en tête ; la conviction a sa place à elle
  const approche = [d.phrases.phare, ...d.phrases.reste].filter((p) => plein(p) && cle(p) !== cle(d.conviction));
  const apropos = (d.apropos || []).filter(plein);
  const apports = (d.apports || []).filter((a) => plein(a.titre));
  const tarifs = (d.tarifs || []).filter((t) => plein(t.nom));
  const etapes = (d.etapes || []).filter((e) => plein(e.titre));
  const fiche = lienFiche(d.resalib);
  const rdv = propre(d.rdv) || 'Sur rendez-vous';
  const sienne = d.accrocheSienne && plein(d.accroche);
  const metierVille = [metier, ville].filter(Boolean).join(ville && metier ? ' à ' : '');
  const surtitre = [geant.reste, metierVille].filter(Boolean).join(' · ');
  const tel = esc(d.tel), telLien = esc(d.telLien);
  const objets = objetsPour(d);
  const AC = autocollants(objets);
  const lignesLong = Math.max(4, ...geant.lignes.map((l) => l.length));

  // ---------------------------------------------------------------- en-tête, menu, chargement
  const tete = `
<a class="evitement" href="#approche">Aller au contenu</a>
<div class="chargement" aria-hidden="true" style="${sceneStyle(P, 'accueil')}"><div class="ch-scene">${[...id.initiales].map((l, i) => `<span class="ch-l" style="--i:${i}"><b>${esc(l)}</b><i></i></span>`).join('')}</div>${metier ? `<p class="ch-mot">${esc(metier)}${ville ? ` à ${esc(ville)}` : ''}</p>` : ''}</div>
<header class="tete">
  <a class="logo" href="#accueil" aria-label="${esc(nom)}, haut de page"><span>${esc(id.initiales)}</span></a>
  <div class="tete-actions">
    <a class="rond" href="${telLien}" aria-label="Appeler ${esc(nom)} au ${tel}">${I.tel}</a>
    <button class="rond bouton-menu" type="button" aria-expanded="false" aria-controls="menu"><span class="vh">Ouvrir le menu</span><span class="i-ouvrir">${I.menu}</span><span class="i-fermer">${I.fermer}</span></button>
  </div>
</header>
<div class="menu" id="menu" hidden>
  <nav aria-label="Sections"><a href="#approche">Approche</a><a href="#seance">La séance</a><a href="#tarifs">Tarifs</a><a href="#apropos">À propos</a><a href="#contact">Rendez-vous</a></nav>
  <a class="pilule" href="${telLien}">${I.tel}<span>${tel}</span></a>
</div>`;

  // ---------------------------------------------------------------- accueil : l'affiche produit
  const accueil = `
<section id="accueil" class="sc sc-accueil" data-scene="accueil" style="${sceneStyle(P, 'accueil', 'approche')}">
  <div class="scene3d scene3d-accueil" data-objets="${objets.accueil.join(',')}" aria-hidden="true"></div>
  <div class="accueil-texte">
    ${surtitre ? `<p class="surtitre">${txt(surtitre)}</p>` : ''}
    <h1 class="geant" style="--lw:${lignesLong}" aria-label="${esc(nom)}">${geant.lignes.map((l) => `<span class="ligne" aria-hidden="true">${esc(l)}</span>`).join('')}</h1>
    ${sienne ? `<p class="accroche">${txt(d.accroche)}</p>` : ''}
    <div class="actions"><a class="pilule" href="#contact">${I.cal}<span>Prendre rendez-vous</span></a></div>
  </div>
  <p class="astuce" aria-hidden="true">Attrapez un objet, lancez-le</p>
  ${vague}
</section>`;

  // ---------------------------------------------------------------- approche : l'étiquette géante
  const ingredients = apports.map((a) => propre(a.titre).toLowerCase()).join(', ');
  const tampon = [metier, ville, rdv].filter(Boolean).join(' · ').toUpperCase() + ' · ';
  const approcheSec = `
<section id="approche" class="sc sc-approche" data-scene="approche" style="${sceneStyle(P, 'approche', 'seance')}">
  <div class="etiquette-zone">
  ${autocollant(AC.approche, 'approche')}
  <div class="etiquette" data-pop>
    <div class="et-cadre">
      <h2 class="et-titre">Mon approche</h2>
      ${plein(d.conviction) ? `<p class="et-slogan">${txt(d.conviction)}</p>` : ''}
      <div class="et-texte">
        ${approche.length ? approche.map((p) => `<p>${txt(p)}</p>`).join('') : `<div class="emplacement"><p class="emplacement-titre">Ici, votre approche</p><p>Votre chemin jusqu’à ce métier, ce que vous proposez, et pour qui. En quelques phrases, avec vos mots.</p></div>`}
      </div>
      ${ingredients ? `<p class="et-ingredients"><strong>Ingrédients :</strong> ${txt(maj(ingredients))}.</p>` : ''}
      <div class="et-pied">
        <p class="et-fabrique">Fait main${ville ? ` à ${txt(ville)}` : ''} par ${esc(nom)}</p>
        <p class="et-code" aria-label="Téléphone ${tel}"><span class="et-barres" aria-hidden="true"></span><span>${tel}</span></p>
      </div>
    </div>
    <div class="tampon" aria-hidden="true">
      <svg viewBox="0 0 200 200"><defs><path id="cercle-tampon" d="M100,100 m-74,0 a74,74 0 1,1 148,0 a74,74 0 1,1 -148,0"/></defs><text><textPath href="#cercle-tampon">${esc(tampon.repeat(tampon.length < 40 ? 2 : 1))}</textPath></text></svg>
      <span>${esc(id.initiales)}</span>
    </div>
  </div>
  </div>
  ${vague}
</section>`;

  // ---------------------------------------------------------------- séance : le patron d'une boîte, qu'on déplie
  // Face avant : le « produit » (la séance de <métier>, ses initiales) ; côtés et dos : les étapes, comme un mode
  // d'emploi imprimé sur l'emballage ; rabats : d'où l'on vient, comment on réserve. Languette de collage, repères.
  const etape = (e) => `<div class="pa-etape${d.etapesEmplacement ? ' pa-vide' : ''}">
        <h3>${txt(e.titre)}</h3>
        <p>${txt(e.texte)}</p>
        ${plein(e.duree) ? `<p class="pa-duree">${txt(e.duree)}</p>` : ''}
      </div>`;
  const cotes = [etapes.slice(0, 1), etapes.slice(1, 2), etapes.slice(2)];
  const infos = [plein(d.dureePremiere) && `Première séance : ${propre(d.dureePremiere)}`, plein(d.dureeSuivi) && `Suivi : ${propre(d.dureeSuivi)}`, rdv, ville && `À ${ville}`].filter(Boolean);
  const panneau = (cls, contenu, extra = '') => `<div class="pa ${cls}"${extra}><div class="pa-in">${contenu}</div></div>`;
  const seanceSec = `
<section id="seance" class="sc sc-seance" data-scene="seance" style="${sceneStyle(P, 'seance', 'tarifs')}">
  <div class="cadre">
    <h2 class="titre-pop" data-pop>${etapes.some((e) => /^la s[ée]ance\.?$/i.test(String(e?.titre || '').trim())) ? 'Mode d’emploi' : 'La séance'}</h2>
    ${d.etapesEmplacement ? `<p class="note-pop" data-pop>Ces étapes attendent vos mots : elles se remplissent ensemble.</p>` : ''}
  </div>
  <div class="patron-zone">
    <div class="patron" data-n="${etapes.length}">
      ${panneau('pa-avant', `
        <p class="pa-marque">${esc(id.initiales)}</p>
        <p class="pa-produit">La séance<span>${txt(metier || 'sur rendez-vous')}</span></p>
        ${autocollant(AC.seance, 'seance')}
        <p class="pa-signe">${esc(nom)}${ville ? `<br>${txt(ville)}` : ''}</p>`)}
      ${panneau('pa-gauche', cotes[0].map(etape).join('') || `<p class="pa-vide-texte">Ici, le premier rendez-vous.</p>`)}
      ${panneau('pa-languette', '', ' aria-hidden="true"')}
      ${panneau('pa-droite', cotes[1].map(etape).join('') || `<p class="pa-vide-texte">Ici, le déroulé d’une séance.</p>`)}
      ${panneau('pa-dos', cotes[2].length ? cotes[2].map(etape).join('') : `<p class="pa-marque pa-marque-dos" aria-hidden="true">${esc(id.initiales)}</p><ul class="pa-infos">${infos.map((x) => `<li>${txt(x)}</li>`).join('')}</ul>`)}
      ${panneau('pa-haut', `<p class="pa-rabat">Ouvrir ici</p>`, ' aria-hidden="true"')}
      ${panneau('pa-bas', cotes[2].length ? `<p class="pa-rabat-infos">${infos.map(txt).join(' · ')}</p>` : `<p class="pa-rabat-infos">Réservation : <span class="insecable">${tel}</span></p>`)}
    </div>
  </div>
  ${vague}
</section>`;

  // ---------------------------------------------------------------- tarifs : le ticket
  const lignesTicket = [];
  for (const t of tarifs) lignesTicket.push([propre(t.nom), propre(t.prix) || 'Sur demande', true]);
  if (plein(d.dureePremiere)) lignesTicket.push(['Première séance', propre(d.dureePremiere)]);
  if (plein(d.dureeSuivi)) lignesTicket.push(['Suivi', propre(d.dureeSuivi)]);
  const tarifsSec = `
<section id="tarifs" class="sc sc-tarifs" data-scene="tarifs" style="${sceneStyle(P, 'tarifs', 'apropos')}">
  <div class="cadre tarifs-cadre">
    <div class="tarifs-titre">
      <h2 class="titre-pop" data-pop>Tarifs</h2>
      ${autocollant(AC.tarifs, 'tarifs')}
    </div>
    <div class="imprimante">
      <div class="fente" aria-hidden="true"></div>
      <div class="ticket">
        <p class="tk-entete"><strong>${esc(nom)}</strong>${metierVille ? `<span>${txt(metierVille)}</span>` : ''}</p>
        ${tarifs.length ? `<ul class="tk-lignes">${lignesTicket.map(([a, b, fort]) => `<li${fort ? ' class="tk-fort"' : ''}><span>${txt(a)}</span><i aria-hidden="true"></i><span>${fort ? prix(b) : txt(b)}</span></li>`).join('')}</ul>`
    : `<div class="tk-vide"><p class="tk-fort">Ici, vos tarifs</p><p>Vos séances, leur durée et leur prix, comme vous les présentez.</p></div>`}
        ${plein(d.paiement) ? `<p class="tk-paiement">${txt(d.paiement)}</p>` : ''}
        <p class="tk-rdv">${txt(rdv)}${ville ? ` · ${txt(ville)}` : ''}</p>
        <div class="tk-souche">
          <p class="tk-bon">Merci, à très vite</p>
          <a class="pilule pilule-sombre" href="#contact">${I.cal}<span>Réserver</span></a>
        </div>
      </div>
    </div>
  </div>
  ${vague}
</section>`;

  // ---------------------------------------------------------------- à propos : l'affiche
  const aproposSec = `
<section id="apropos" class="sc sc-apropos" data-scene="apropos" style="${sceneStyle(P, 'apropos', 'contact')}">
  <div class="affiche" data-pop>
    <span class="scotch scotch-1" aria-hidden="true"></span><span class="scotch scotch-2" aria-hidden="true"></span>
    ${autocollant(AC.apropos, 'apropos')}
    <div class="af-haut">
      <div class="af-portrait"><span aria-hidden="true">${esc(id.initiales)}</span><p>Ici, votre portrait</p></div>
      <div class="af-titres">
        <h2 class="af-nom">${geant.lignes.map((l) => `<span>${esc(l)}</span>`).join(' ')}</h2>
        ${metierVille ? `<p class="af-sous">${txt(maj(metierVille))}</p>` : ''}
      </div>
    </div>
    <div class="af-texte">
      ${apropos.length ? apropos.map((p) => `<p>${txt(p)}</p>`).join('') : `<div class="emplacement"><p class="emplacement-titre">Ici, votre histoire</p><p>Votre parcours, vos formations, ce qui vous anime. Quelques lignes qui vous ressemblent.</p></div>`}
    </div>
    ${plein(d.cerf) ? `<p class="af-bandeau">${txt(d.cerf)}</p>` : ''}
  </div>
  ${vague}
</section>`;

  // ---------------------------------------------------------------- contact : la boîte à jouets, puis le pied
  const autre = suivante(P.id);
  const contactSec = `
<section id="contact" class="sc sc-contact" data-scene="contact" style="${sceneStyle(P, 'contact')}">
  <div class="contact-scene">
  <div class="scene3d scene3d-boite" data-objets="${objets.boite.join(',')}" aria-hidden="true"></div>
  <div class="cadre contact-cadre">
    <h2 class="titre-pop titre-contact" data-pop>Prendre rendez-vous</h2>
    <div class="coupon" data-pop>
      <span class="ciseaux" aria-hidden="true">${I.ciseaux}</span>
      <div class="cp-gauche">
        <h3 class="cp-titre">Votre rendez-vous</h3>
        <dl class="cp-champs">
          <div><dt>Avec</dt><dd>${esc(nom)}</dd></div>
          ${metier ? `<div><dt>Pour</dt><dd>${txt(metier)}</dd></div>` : ''}
          ${ville ? `<div><dt>Où</dt><dd>${txt(ville)}</dd></div>` : ''}
          <div><dt>Quand</dt><dd>${txt(rdv)}</dd></div>
        </dl>
      </div>
      <div class="cp-droite">
        <p class="cp-appel">Un coup de fil suffit</p>
        <a class="numero" href="${telLien}" aria-label="Appeler le ${tel}">${tel}</a>
        <div class="actions">
          <a class="pilule" href="${telLien}">${I.tel}<span>${esc(d.appeler || 'Appeler')}</span></a>
          ${fiche ? `<a class="pilule pilule-creuse" href="${esc(d.resalib)}" rel="noopener" target="_blank">${I.fleche}<span>${esc(fiche)}</span></a>` : ''}
          ${plein(d.facebook) ? `<a class="pilule pilule-creuse" href="${esc(d.facebook)}" rel="noopener" target="_blank">${I.fleche}<span>Facebook</span></a>` : ''}
        </div>
      </div>
      ${autocollant(AC.contact, 'contact')}
    </div>
  </div>
  <div class="boite-sol" aria-hidden="true"><p class="boite-mot">Attrapez, lancez, faites sauter : ils sont là pour ça.</p></div>
  </div>
  <footer class="pied" id="pied">
    <div class="pied-haut">
      <p class="pied-nom">${esc(nom)}</p>
      <p>${[metier, ville].filter(Boolean).map(esc).join(' · ')}${plein(d.siret) ? ` · SIRET ${esc(d.siret)}` : ''}</p>
    </div>
    <p class="apercu">Aperçu préparé pour ${esc(nom)}. Textes, photos, couleurs : tout se modifie selon vos goûts.</p>
    <p class="melange">Partez de cet univers, mariez-en deux, ou repartez de zéro : on avance ensemble jusqu’au site qui vous ressemble exactement.</p>
    <p class="pied-couleurs"><a class="pilule pilule-petite" href="?p=${encodeURIComponent(d.dossier)}&amp;palette=${autre.id}#pied" data-palette="${autre.id}">Essayer « ${esc(autre.nom)} »</a><span>Couleurs du moment : ${esc(P.nom)}</span></p>
    <p class="avertissement">${txt(d.avertissement)}</p>
    <nav class="pied-liens" aria-label="Plan de la page"><a href="#approche">Approche</a><a href="#seance">La séance</a><a href="#tarifs">Tarifs</a><a href="#apropos">À propos</a><a href="#accueil">${I.haut}<span>Haut de page</span></a></nav>
  </footer>
</section>`;

  const html = `${tete}
<main id="contenu" data-famille="${fam}" data-palette="${P.id}" data-nomme="${objets.nomme}">${accueil}${approcheSec}${seanceSec}${tarifsSec}${aproposSec}${contactSec}
</main>`;
  const titre = `${nom}${metier ? ', ' + metier : ''}${ville ? ' à ' + ville : ''}`;
  const description = (sienne ? propre(d.accroche) : '') || `${metier}${ville ? ' à ' + ville : ''}, sur rendez-vous.`;
  return { html, titre, description, famille: fam, palette: P, identite: id, objets, couleur: P.scenes.accueil[0] };
}

export function variables(P) {
  const c = P.couleurs, o = P.objets;
  return [`--fond:${c.fond}`, `--accent:${c.accent}`, `--accent2:${c.accent2}`, `--vif:${o.vif}`, `--papier:${o.etiquette}`, `--papier-encre:${o.etiquetteEncre}`, `--bande:${o.bande}`, `--titre-papier:${o.titrePapier || o.bande}`].join(';');
}
