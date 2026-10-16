/* IMMERSION : le contenu de la page, rendu depuis la fiche JSON du praticien.
   Module pur (aucun acces au document) : le navigateur l'utilise quand
   l'adresse porte ?p=<dossier>, et batir.mjs l'utilise sous node pour ecrire
   la page lisible sans JavaScript. Rien n'est invente : un champ vide devient
   un emplacement qui dit ce qui viendra.

   Chaque section se raconte dans le monde qu'elle habite :
     accueil  : le nom devant le cristal ;
     approche : des phrases qui affleurent a la surface de l'eau, une par ecran,
                puis ses themes, chacun fait naitre une onde ;
     seance   : un gue, une pierre de verre par etape, la camera passe de l'une
                a l'autre ;
     tarifs   : le prix grave, vu d'en haut, au-dessus des pierres ;
     a propos : le prenom qui nait de la brume, puis son recit, et une vitre
                embuee qui attend son portrait ;
     contact  : le cristal a l'aube, le numero en grand. */
import { famille } from '../../commun/familles.js';
import { PALETTES, paletteDefaut, trouverPalette } from './palettes.js';
import { nettoyer, rangerApproche, sansRedites, AUX_TARIFS } from '../../commun/phrases.js';

const TIRETS = /\s*[\u2013\u2014]\s*/g;
export const net = (s) => String(s ?? '').replace(TIRETS, ', ').replace(/\s+/g, ' ').trim();
export const esc = (s) => net(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const liste = (a) => (Array.isArray(a) ? a.map(net).filter(Boolean) : []);
const sansAccent = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/* Prenoms courants : sert a reconnaitre un nom ecrit a l'envers (« Meyer Sandrine »)
   et le prenom cache dans une enseigne (« La Bulle d'Adeline »). */
const PRENOMS = new Set(`aurore celine charlotte ingrid adeline marilou marion sandrine nathalie sabrina sophie marie anne
isabelle catherine sylvie christine valerie veronique stephanie emilie julie laura sarah camille lea chloe manon emma ines
lucie pauline claire elodie audrey aurelie caroline virginie laetitia laurence delphine sandra karine carole corinne
florence helene agnes beatrice brigitte chantal christelle cecile alexandra amandine angelique anais annie ariane armelle
axelle barbara berengere bernadette capucine carine cassandre clara clemence colette coralie cynthia daphne diane
dominique dorothee edith elisabeth elise eloise elsa emeline estelle eva eve fabienne fanny flora francoise gaelle
genevieve geraldine ghislaine gwenaelle helena hortense irene jeanne jessica joelle josephine josiane judith juliette
justine karen katia laure lena leila liliane line lise lola louise lucile ludivine lydie madeleine maeva magali maite
malika marina marjorie marlene martine maryse mathilde maud melanie melissa mireille monique morgane muriel myriam nadia
nadine natacha nelly nicole noemie oceane odile olga ophelie patricia pascale perrine rachel raphaelle rebecca regine
rose roxane sabine salome samia severine simone solange solene stella suzanne sylviane tatiana therese valentine vanessa
victoire violaine yasmine yvonne zoe adele agathe alice aline amelie angele anouk apolline astrid aude blandine celia
charline christiane clarisse constance cyrielle elena eleonore emmanuelle evelyne gabrielle gisele hannah heloise ilona
jade jocelyne laurie leonie lilou maelle margaux marianne marine maureen mylene nina nolwenn oriane priscilla sonia
tiphaine vera sylvia mia aurelia annick annabelle flavie jean pierre michel philippe alain patrick nicolas christophe
christian daniel david eric frederic laurent stephane olivier sebastien thierry julien vincent francois pascal jerome
bruno didier gilles guillaume jacques thomas alexandre antoine arnaud benoit cedric damien denis emmanuel fabrice franck
gerard herve joel lionel luc marc mathieu matthieu maxime paul regis remi romain serge sylvain xavier yann yves adrien
anthony aurelien benjamin bertrand cyril florian gael hugo jeremy kevin loic louis lucas ludovic mickael morgan quentin
raphael samuel simon tristan valentin william yannick fabien gregory jonathan mathias mehdi karim erwan gaetan ronan
tanguy matheo theo leo arthur jules gabriel noah nathan`.split(/\s+/));
const estPrenom = (m) => PRENOMS.has(sansAccent(m).split('-')[0]);
const ARTICLE = /^(la|le|les|l['’].*|au|aux|chez|un|une|d['’].*)$/i;
const MOT_ENSEIGNE = /^(cabinet|espace|atelier|institut|centre|maison|studio|association|massages?|yoga|bien-?[eê]tre|th[ée]rapies?|sant[ée]|zen|harmonie|soins?|sarl|eurl|sas)$/i;

/* Le nom, tel qu'on le montre : la personne (prenom puis nom), l'enseigne a part,
   deux lignes pour l'accueil, le mot que la brume ecrira, les initiales. */
export function analyserNom(d) {
  const brut = net(d.nom) || 'Votre nom';
  const mots = brut.split(' ');
  const textes = sansAccent([d.accroche, d.conviction, ...liste(d.approche), ...liste(d.apropos)].join(' '));
  let personne = [], enseigne = '';
  const iEns = mots.findIndex((m) => MOT_ENSEIGNE.test(m));
  if (ARTICLE.test(mots[0]) || (iEns >= 0 && iEns <= 1 && !estPrenom(mots[0]))) enseigne = brut;
  else if (iEns >= 2) { personne = mots.slice(0, iEns); enseigne = mots.slice(iEns).join(' '); }
  else personne = mots.slice();

  /* Un nom a l'envers : « Meyer Sandrine ». On le retourne si ses propres textes
     disent « Sandrine Meyer », ou si seul le second mot est un prenom connu. */
  if (personne.length === 2) {
    const [a, b] = personne;
    const ditInverse = textes.includes(sansAccent(`${b} ${a}`));
    if (ditInverse || (estPrenom(b) && !estPrenom(a))) personne = [b, a];
  }
  let prenom = '';
  if (personne.length) prenom = personne[0];
  else {
    const m = brut.match(/(?:d['’]|de |chez )([A-ZÀ-Ý][\p{L}-]+)/u);
    if (m && estPrenom(m[1])) prenom = m[1];
  }
  const nomFamille = personne.slice(1).join(' ');
  const personneTxt = personne.join(' ');
  let lignes;
  if (personne.length) lignes = [personne[0], nomFamille].filter(Boolean);
  else {
    /* Une enseigne sur deux lignes equilibrees. */
    let best = [brut], ecart = Infinity;
    for (let i = 1; i < mots.length; i++) {
      const g = mots.slice(0, i).join(' '), dr = mots.slice(i).join(' ');
      const e = Math.abs(g.length - dr.length);
      if (e < ecart) { ecart = e; best = [g, dr]; }
    }
    lignes = best;
  }
  const motBrume = prenom || mots.filter((m) => !ARTICLE.test(m) && m.length > 2).sort((x, y) => y.length - x.length)[0] || mots[0];
  const initiales = personne.length >= 2
    ? (personne[0][0] + personne[1][0]).toUpperCase()
    : net(d.initiales) || lignes.map((l) => l.replace(/^(la|le|les|l['’]|d['’])\s*/i, '')[0] || '').join('').toUpperCase().slice(0, 2);
  return {
    complet: personneTxt ? (enseigne ? `${personneTxt}, ${enseigne}` : personneTxt) : enseigne,
    court: personneTxt || enseigne,
    personne: personneTxt, enseigne: personne.length ? enseigne : '', prenom, motBrume, lignes, initiales
  };
}

function lieu(d) {
  const v = net(d.ville);
  if (!v) return '';
  return d.cp ? `${v} (${net(d.cp)})` : v;
}

function lienEnLigne(url) {
  try {
    const h = new URL(url).hostname.replace(/^www\./, '');
    if (/resalib/.test(h)) return 'Réserver en ligne sur Resalib';
    return `Ma page sur ${h}`;
  } catch { return null; }
}

/* Les mots du praticien ranges (voir phrases.js) : doublons retires, phrases de prix ou de duree
   rangees avec les tarifs, et la premiere phrase qui affleure est choisie (jamais une phrase
   pratique ni un liant). La conviction garde sa scene a elle, sous la lune. */

function titreSeance(d) {
  const t = net((d.tarifs || [])[0]?.nom);
  if (t && /^s[ée]ance d/i.test(t) && !/[_@]/.test(t) && t.length < 46) return t;
  // jamais « La séance » puis une première étape « La séance »
  return (d.etapes || []).some((e) => /^la s[ée]ance\.?$/i.test(net(e?.titre))) ? 'Le temps d’une séance' : 'La séance';
}

const lienPalette = (dossier, id) => `?${dossier ? `p=${encodeURIComponent(dossier)}&amp;` : ''}palette=${id}`;

/* Les sections, dans l'ordre. data-monde dit quel monde 3D les habite. */
export function rendre(d, { dossier = d.dossier || '', palette = '' } = {}) {
  d = nettoyer(d); // règle commune : promesses de santé retirées, doublons, prix et durée hors de l'approche
  const N = analyserNom(d);
  const fam = famille(d);
  const pal = trouverPalette(palette) ? palette : paletteDefaut(fam);
  const metier = esc(d.metier);
  const ville = esc(net(d.ville));
  const ou = esc(lieu(d));
  const tel = esc(d.tel);
  const telLien = esc(d.telLien);
  const rangee = rangerApproche({ ...d, approche: liste(d.approche), conviction: net(d.conviction), accroche: d.accrocheSienne !== false ? net(d.accroche) : '' }, { avecConviction: false, ecarter: AUX_TARIFS });
  const notesPrix = rangee.ecartes;
  const approche = rangee.phare ? [rangee.phare, ...rangee.reste] : [];
  const apropos = sansRedites(liste(d.apropos), [net(d.cerf)]);
  const apports = (d.apports || []).filter((a) => a && net(a.titre));
  const etapes = (d.etapes || []).filter((e) => e && net(e.titre));
  const tarifs = (d.tarifs || []).filter((t) => t && net(t.nom));
  const enLigne = d.resalib ? lienEnLigne(d.resalib) : null;
  const mon = N.prenom ? 'Mon' : 'L’';
  const longue = Math.max(...N.lignes.map((l) => l.length), 4);

  const accueil = `
<section class="sc sc-accueil" id="accueil" data-monde="cristal" data-nom="Accueil">
  <div class="accueil-in">
    <h1 class="nom" aria-label="${esc(N.court)}" style="--n:${longue}">${N.lignes.map((l, i) => `<span class="ligne l${i + 1}"><span class="mot">${esc(l)}</span></span>`).join('')}</h1>
    ${N.enseigne ? `<p class="enseigne">${esc(N.enseigne)}</p>` : ''}
    <p class="qui">${metier ? `<em>${metier}</em>` : ''}${metier && ville ? ' à ' : ''}${ville}</p>
    ${d.accrocheSienne !== false && net(d.accroche) ? `<p class="accroche">${esc(d.accroche)}</p>` : ''}
    <div class="actions">
      ${tel ? `<a class="btn btn-plein" href="${telLien}">Appeler le <span class="btn-n">${tel}</span></a>` : ''}
      <a class="btn btn-fil" href="#contact">Prendre rendez-vous</a>
    </div>
  </div>
  <p class="defiler" aria-hidden="true"><span class="defiler-trait"></span>Défiler pour entrer</p>
</section>`;

  const phrases = approche.length
    ? approche.map((p, i) => `<p class="phrase phrase-${(i % 3) + 1}">${esc(p)}</p>`).join('\n    ')
    : `<p class="phrase phrase-1 emplacement">Ici, votre approche : ce qui vous guide dans votre métier, avec vos mots.</p>`;

  const sectionApproche = `
<section class="sc sc-approche" id="approche" data-monde="eau" data-nom="L’approche">
  <h2 class="horizon" data-reflet="${mon === 'Mon' ? 'Mon approche' : 'L’approche'}">${mon === 'Mon' ? 'Mon approche' : 'L’approche'}</h2>
  <div class="phrases">
    ${phrases}
  </div>
  ${net(d.conviction) ? `<figure class="conviction"><blockquote><p>${esc(d.conviction)}</p></blockquote><figcaption>${esc(N.prenom || N.court)}</figcaption></figure>` : ''}
  ${apports.length ? `<div class="ondes">
    <p class="ondes-intro">Ce que l’on vient y chercher</p>
    <ul class="ondes-liste">
      ${apports.map((a, i) => `<li class="onde-mot o${(i % 4) + 1}"><h3>${esc(a.titre)}</h3>${net(a.texte) ? `<p>${esc(a.texte)}</p>` : ''}</li>`).join('\n      ')}
    </ul>
  </div>` : ''}
</section>`;

  const vide = !!d.etapesEmplacement;
  const sectionSeance = `
<section class="sc sc-seance${vide ? ' seance-vide' : ''}" id="seance" data-monde="galets" data-nom="La séance">
  <header class="gue-tete">
    <h2 class="titre">${esc(titreSeance(d))}</h2>
    <p class="gue-sous">d’une pierre à l’autre, à votre rythme</p>
  </header>
  <ol class="gue">
    ${etapes.map((e, i) => `<li class="pas ${i % 2 ? 'pas-d' : 'pas-g'}" data-etape="${i}">
      <h3>${esc(e.titre)}</h3>
      <p${vide ? ' class="emplacement"' : ''}>${esc(e.texte)}</p>
      ${net(e.duree) ? `<p class="duree">${esc(net(e.duree).replace(/\s*·\s*/, ' : '))}</p>` : ''}
    </li>`).join('\n    ')}
  </ol>
</section>`;

  const lignesPrix = tarifs.map((t) => `<li class="prix"><span class="prix-nom">${esc(t.nom)}</span><span class="prix-val">${esc(t.prix || 'Sur demande')}</span></li>`);
  const durees = [];
  if (net(d.dureePremiere)) durees.push(`Première séance : ${esc(d.dureePremiere)}`);
  if (net(d.dureeSuivi)) durees.push(`Séances de suivi : ${esc(d.dureeSuivi)}`);
  const sectionTarifs = `
<section class="sc sc-tarifs" id="tarifs" data-monde="galets" data-nom="Tarifs">
  <div class="gravure">
    <h2 class="titre">Tarifs <em>et durées</em></h2>
    ${lignesPrix.length ? `<ul class="prix-liste">${lignesPrix.join('')}</ul>` : `<p class="emplacement prix-vide">Ici, vos tarifs et la durée de vos séances.</p>`}
    ${durees.length ? `<p class="durees">${durees.join('<br>')}</p>` : ''}
    ${notesPrix.map((p) => `<p class="note-prix">${esc(p)}</p>`).join('')}
    ${net(d.paiement) ? `<p class="paiement">${esc(d.paiement)}</p>` : ''}
    <p class="avert">${esc(d.avertissement || 'Les accompagnements proposés relèvent du bien-être. Ils ne remplacent en aucun cas un avis, un diagnostic ou un traitement médical.')}</p>
  </div>
</section>`;

  const recit = apropos.length
    ? apropos.map((p, i) => `<p${i === 0 ? ' class="recit-1"' : ''}>${esc(p)}</p>`).join('\n        ')
    : `<p class="recit-1 emplacement">Ici, votre parcours en quelques lignes : d’où vous venez, ce qui vous a mené à ce métier.</p>`;
  const sectionApropos = `
<section class="sc sc-apropos" id="apropos" data-monde="brume" data-nom="À propos">
  <div class="scene-nom" aria-hidden="true"><p class="scene-nom-t">${esc(N.motBrume)}</p></div>
  <div class="brume-in">
    <h2 class="titre">${esc(N.personne || N.court)}</h2>
    <div class="brume-grille">
      <figure class="vitre"><div class="vitre-verre"></div><figcaption>Ici, votre portrait</figcaption></figure>
      <div class="recit">
        ${recit}
      </div>
    </div>
    ${net(d.cerf) ? `<p class="cerf">${esc(d.cerf)}</p>` : ''}
  </div>
</section>`;

  const liens = [];
  if (enLigne) liens.push(`<a class="lien" href="${esc(d.resalib)}" rel="noopener" target="_blank">${esc(enLigne)}</a>`);
  if (net(d.facebook) && !/facebook\.com\/me\/?$/.test(d.facebook)) liens.push(`<a class="lien" href="${esc(d.facebook)}" rel="noopener" target="_blank">Facebook</a>`);

  const sectionContact = `
<section class="sc sc-contact" id="contact" data-monde="cristal" data-variante="aube" data-nom="Contact">
  <div class="aube-in">
    <h2 class="titre">Prendre <em>rendez-vous</em></h2>
    <p class="rdv">${esc(d.rdv || 'Sur rendez-vous')}${ville ? `, à ${ville}` : ''}.</p>
    ${tel ? `<a class="tel-grand" href="${telLien}"><span class="tel-t">Appeler le</span>${tel}</a>` : `<p class="emplacement">Ici, votre numéro de téléphone.</p>`}
    ${liens.length ? `<p class="liens">${liens.join('')}</p>` : ''}
    <p class="emplacement adresse">Ici, l’adresse de votre cabinet et un plan pour venir.</p>
  </div>
</section>`;

  const autres = PALETTES.filter((p) => p.id !== pal);
  const pied = `
<footer class="pied" data-monde="cristal" data-variante="aube">
  <div class="pied-in">
    <p class="pied-nom">${esc(N.complet)}</p>
    <p class="pied-meta">${[metier, ou].filter(Boolean).join(', ')}${net(d.siret) ? `<span class="pied-siret">SIRET ${esc(d.siret)}</span>` : ''}</p>
    <p class="pied-avert">${esc(d.avertissement || '')}</p>
    <p class="apercu">Aperçu préparé pour ${esc(N.complet)}. Textes, photos, couleurs : tout se modifie selon vos goûts.</p>
    <p class="apercu-2">On peut partir de ce monde, en mélanger deux, ou repartir de zéro, jusqu’au site qui vous ressemble exactement.</p>
    <p class="palettes">Le même monde, d’une autre lumière : ${autres.map((p) => `<a class="pal pal-${p.id}" href="${lienPalette(dossier, p.id)}">${esc(p.nom.toLowerCase())}</a>`).join(', ')}.</p>
  </div>
</footer>`;

  return {
    titre: `${N.court}, ${net(d.metier)}${net(d.ville) ? ' à ' + net(d.ville) : ''}`,
    description: net(d.accroche) || `${net(d.metier)}${net(d.ville) ? ' à ' + net(d.ville) : ''}`,
    prenom: N.motBrume,
    initiales: N.initiales,
    etapes: etapes.length,
    famille: fam,
    palette: pal,
    html: [accueil, sectionApproche, sectionSeance, sectionTarifs, sectionApropos, sectionContact].join('\n'),
    pied,
    hud: { nom: esc(N.court), initiales: esc(N.initiales), telLien, tel }
  };
}
