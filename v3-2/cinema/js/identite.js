// Lecture robuste d'un praticien : nom remis à l'endroit, prénom, enseigne, métier accordé,
// phrases de prix et de durée sorties de l'approche, doublons retirés, phrase forte choisie.
// Ne crée aucun contenu : on trie, on range et on accorde ce que le praticien a écrit.
// Même module dans cinema/ et editorial/ (chaque univers reste autonome).
import { famille as familleDe } from '../../commun/familles.js';

const TIRETS = new RegExp('\\s*[' + String.fromCharCode(8211, 8212) + ']\\s*', 'g');
export const propre = (s) => String(s ?? '').replace(TIRETS, ', ').replace(/\s+/g, ' ').trim();
const plat = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const F = 'marie nathalie isabelle sylvie catherine francoise christine valerie sandrine veronique martine monique nicole sophie celine stephanie corinne patricia anne brigitte aurelie emilie julie laurence christelle caroline virginie delphine karine laetitia helene chantal florence pascale elodie sabrina audrey melanie camille laura sarah pauline marion charlotte manon lea chloe emma clara ines lucie mathilde anais amandine jessica vanessa marine morgane claire agnes beatrice danielle josiane annie evelyne joelle muriel myriam nadine odile regine sylviane gisele jacqueline michele michelle colette denise yvette christiane ghislaine fabienne frederique geraldine gwenaelle ingrid aurore adeline alexandra alice amelie angelique annabelle armelle axelle benedicte berengere carole cecile charlene cindy claudine coralie cynthia elsa estelle eva fanny gaelle jennifer jeanne jocelyne juliette justine laure leonie lise lola louise lucile ludivine lydie magali maelle margaux marianne marina marjorie maryline maud melissa mireille nadia noemie oceane olivia ophelie perrine rachel rose roseline sabine severine solene sonia stella suzanne sylvaine tiphaine valentine victoire yasmine zoe agathe albane aline anouk apolline ariane blandine capucine clemence constance elise emmanuelle flavie heloise hortense iris jade josephine laurine lena lou maeva mylene nina nolwenn pascaline priscilla romane salome sixtine soizic tatiana violaine wendy mathilda marilou maryse huguette dorothee edwige fleur gwendoline katia laurie linda malika mariette nelly rebecca segolene sylvia annick elisabeth isaline ludmila mia nora rania samia leila emeline sandra cathy kelly marlene sevrine gaelane anne-marie anne-sophie marie-claire marie-christine marie-france marie-laure marie-pierre';
const M = 'philippe pierre jean michel alain patrick nicolas christophe laurent frederic stephane david olivier eric thierry pascal sebastien julien thomas vincent jerome guillaume francois daniel bernard didier gilles bruno franck fabrice arnaud antoine benoit cedric damien denis emmanuel fabien florent gerard herve jacques joel lionel louis luc ludovic marc mathieu matthieu maxime mickael patrice paul raphael regis romain serge sylvain xavier yannick yves alexandre anthony baptiste benjamin clement gael hugo jonathan kevin lucas mathis quentin remi simon theo tristan victor adrien aurelien bastien charles cyril erwan gregory henri jeremy loic martin nathan renaud samuel thibault valentin william yann matthias matheo leo jean-pierre jean-marc jean-luc jean-francois jean-michel pierre-yves';
const MIXTES = 'dominique claude camille';
const FEM = new Set(F.split(' ')), MASC = new Set(M.split(' ')), MIX = new Set(MIXTES.split(' '));
const estPrenom = (m) => { const k = plat(m); return FEM.has(k) || MASC.has(k) || MIX.has(k); };
const estFeminin = (m) => FEM.has(plat(m));

// mots qui ouvrent une enseigne (« Cabinet l'Art des Sens », « Cornouaille Massage Quimper »)
const MARQUE = /^(cabinet|espace|institut|atelier|centre|studio|maison|salon|chez|massages?|bien-?etre|harmonie|spa|soins?|beaute|yoga|sophrologie|naturopathie|hypnose|reflexologie|shiatsu|reiki|therapies?|coaching|cocon|bulle|sens|equilibre|essence|source|jardin|ame|souffle)$/;
const ARTICLE = /^(la|le|les|l['’].*|un|une|aux?)$/i;

function accorder(metier, feminin) {
  if (!feminin) return metier;
  return metier.split(' ').map((m) => m
    .replace(/(praticien|esth[ée]ticien|magn[ée]tiseur|ien)$/i, (x) => (/ien$/i.test(x) ? x + 'ne' : x))
    .replace(/^(accompagn|consult|interven|enseign|soign)ant$/i, '$1ante')
    .replace(/^(p[ée]rinat|natal|m[ée]di[ée]v|holist|corpor|ment)al$/i, '$1ale')
    .replace(/^(masseur|relaxologue)$/i, (x) => (/eur$/i.test(x) ? x.slice(0, -3) + 'euse' : x))).join(' ');
}

// une phrase courte de prise de rendez-vous n'est pas une accroche
const generique = (s) => !s || /sur rendez-vous\.?$/i.test(s) && s.length < 70;
const PRIX = /\b(prix|tarifs?|€|euros?|rembours\w*|mutuelles?|paiement|r[èe]glement)\b/i;
const DUREE = /\b(dur[ée]e|dure|durera)\b[^.]*\b(\d+\s?h|heures?|minutes?|min)\b/i;
const PARCOURS = /\b(CAP|BAC|dipl[oô]m\w*|form[ée]e?\b|formation|certifi\w*|[ée]cole|apr[èe]s \d+ ans|ann[ée]es? (en tant|comme)|ing[ée]nieur|carri[èe]re|parcours)\b/i;
const FORTE = /\b(je crois|pour moi|ma conviction|mission)\b/i;
const FORTE2 = /\b(souhait|[àa] c(œ|oe)ur|essentiel|profond[ée]ment)\b/i;
const LIAISON = /^((e|é)galement|aussi|de plus|ensuite|puis|pour cela|de ce fait|cependant|donc|en effet|par ailleurs)\b/i;
// premier paragraphe d'une partie : on retire le mot de liaison qui renvoie à une phrase absente
export const sansLiaison = (p) => {
  const m = String(p).match(/^(ensuite|puis|pour cela|de ce fait|cependant|donc|en effet|par ailleurs|aussi),\s+(.)/i);
  return m ? m[2].toUpperCase() + String(p).slice(m[0].length) : p;
};

function phrases(liste) {
  return (liste || []).map(propre)
    // « Bienvenue dans La Bulle d'Adeline Je suis... » : un point oublié avant « Je »
    .map((p) => p.replace(/([a-zà-ÿ]) (Je |J['’])/g, '$1. $2'))
    .filter((p) => p && !/_/.test(p) && p.length > 12);
}
function sansDoublons(liste) {
  const cle = (s) => plat(s).replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
  const garde = [];
  for (const p of liste) {
    const k = cle(p);
    const i = garde.findIndex((g) => { const kg = cle(g); return kg.includes(k) || k.includes(kg) || kg.slice(0, 60) === k.slice(0, 60); });
    if (i < 0) garde.push(p); else if (k.length > cle(garde[i]).length) garde[i] = p;
  }
  return garde;
}

export function lire(d) {
  const brut = propre(d.nom);
  const mots = brut.split(' ').filter(Boolean);
  let personne = null, enseigne = null;
  const iMarque = mots.findIndex((m, i) => MARQUE.test(plat(m)) || (i === 0 && ARTICLE.test(m)));
  if (iMarque === 0) enseigne = brut;
  else if (iMarque > 0) {
    const avant = mots.slice(0, iMarque);
    if (avant.length >= 1 && avant.length <= 3 && (estPrenom(avant[0]) || (avant[1] && estPrenom(avant[1])))) { personne = avant.join(' '); enseigne = mots.slice(iMarque).join(' '); }
    else enseigne = brut;
  } else personne = brut;

  // le praticien se présente-t-il lui-même ? (« Je suis Sandrine Meyer »)
  const textes = [d.accroche, ...(d.apropos || []), ...(d.approche || []), d.conviction].map(propre).join(' ');
  if (personne) {
    const p = personne.split(' ');
    const m = textes.match(/je (?:suis|m['’]appelle) ([A-ZÀ-Ý][\p{L}-]+)(?:[ .]([A-ZÀ-Ý][\p{L}-]+))?/u);
    if (m && p.length >= 2 && plat(m[1]) === plat(p[p.length - 1]) && plat(m[1]) !== plat(p[0])) personne = [p[p.length - 1], ...p.slice(0, -1)].join(' ');
    else if (p.length === 2 && !estPrenom(p[0]) && estPrenom(p[1])) personne = `${p[1]} ${p[0]}`;
  }
  let prenom = null;
  if (personne) { const p0 = personne.split(' ')[0]; if (estPrenom(p0) || personne.split(' ').length === 2) prenom = p0; }
  if (!prenom && enseigne) { const m = enseigne.match(/(?:d['’]|chez )([A-ZÀ-Ý][\p{Ll}-]+)$/u); if (m && estPrenom(m[1])) prenom = m[1]; }
  const nom = personne && enseigne ? `${personne}, ${enseigne}` : (personne || enseigne || brut);
  const significatifs = (s) => s.split(' ').filter((m) => !/^(la|le|les|de|des|du|et|à|a|en|d['’].*|l['’].*)$/i.test(m) || /^[ld]['’]./i.test(m)).map((m) => m.replace(/^[ld]['’]/i, ''));
  const base = personne ? personne.split(' ') : significatifs(enseigne || brut);
  const initiales = (personne ? base[0][0] + (base.length > 1 ? base[base.length - 1][0] : '') : base.slice(0, 2).map((m) => m[0]).join('')).toUpperCase();

  const metierBrut = propre(d.metier);
  const feminin = prenom ? estFeminin(prenom) || /\b(d[ée]sireuse|pr[êe]te|passionn[ée]e|form[ée]e|certifi[ée]e|install[ée]e|devenue|consult[ée]e)\b/i.test(textes) : /\b(d[ée]sireuse|pr[êe]te|passionn[ée]e|form[ée]e|certifi[ée]e|devenue|consult[ée]e)\b/i.test(textes);
  const metier = accorder(metierBrut, feminin);

  const ville = propre(d.ville).split('-').map((m, i) => (i > 0 && /^(en|le|la|les|de|du|des|sur|sous|l[eè]s|et)$/i.test(m) ? m.toLowerCase() : m)).join('-');
  const accroche = propre(d.accroche);
  const accrocheGenerique = generique(accroche);

  // l'approche : on en sort les prix et les durées ; un récit de parcours rejoint l'à-propos
  let approche = sansDoublons(phrases(d.approche));
  let apropos = sansDoublons(phrases(d.apropos));
  const notesTarifs = approche.filter((p) => PRIX.test(p));
  const notesDuree = approche.filter((p) => !PRIX.test(p) && DUREE.test(p));
  approche = approche.filter((p) => !notesTarifs.includes(p) && !notesDuree.includes(p));
  if (approche.length && PARCOURS.test(approche[0])) { apropos = sansDoublons([...approche, ...apropos]); approche = []; }
  // « Je suis donc devenue... » avant « Après 13 ans... » : le récit reprend dans l'ordre
  const iAvant = apropos.findIndex((p, i) => i > 0 && /^(apr[èe]s|avant|depuis|il y a)\b/i.test(p));
  if (iAvant > 0 && /\bdonc\b/i.test(apropos[0])) apropos = [apropos[iAvant], ...apropos.filter((_, i) => i !== iAvant)];
  approche = approche.filter((p) => !(approche.length > 1 && /sur rendez-vous\.?$/i.test(p) && p.length < 60));
  if (approche.length === 1 && /sur rendez-vous\.?$/i.test(approche[0]) && approche[0].length < 60) approche = [];

  // la phrase forte : sa conviction, sinon une phrase à elle qui en a la force
  let phrase = propre(d.conviction) || null, source = phrase ? 'conviction' : null;
  if (phrase && (LIAISON.test(phrase) || phrase.length > 260)) { approche = sansDoublons([...approche, phrase]); phrase = null; source = null; }
  if (!phrase) {
    const toutes = [...approche, ...apropos];
    const ok = (p) => p.length <= 170 && !LIAISON.test(p);
    const f = toutes.find((p) => FORTE.test(p) && ok(p)) || toutes.find((p) => FORTE2.test(p) && ok(p))
      || approche.find((p) => /^(mon approche|ma pratique|mon accompagnement|chaque)\b/i.test(p) && ok(p))
      || approche.filter((p) => /^vous\b/i.test(p) && p.length <= 120).sort((a, b) => a.length - b.length)[0];
    if (f) { phrase = f; source = 'texte'; approche = approche.filter((p) => p !== f); apropos = apropos.filter((p) => p !== f); }
  }
  if (!phrase && accroche && d.accrocheSienne && !accrocheGenerique && accroche.length <= 170) { phrase = accroche; source = 'accroche'; }

  const placeholders = !!d.etapesEmplacement;
  const etapes = (d.etapes || []).filter((e) => e && e.titre).map((e) => ({ titre: propre(e.titre), texte: propre(e.texte), duree: propre(e.duree), vide: placeholders }));
  const apports = (d.apports || []).filter((a) => a && a.titre).map((a) => ({ titre: propre(a.titre), texte: propre(a.texte) }));
  const tarifs = (d.tarifs || []).filter((t) => t && t.nom).map((t) => ({ nom: propre(t.nom), prix: propre(t.prix) || 'Sur demande' }));
  const tel = propre(d.tel);
  const telLien = d.telLien || (tel ? 'tel:' + tel.replace(/\s/g, '') : '');
  const liens = [d.resalib, d.facebook].map((url) => {
    if (!url) return null;
    let hote = '';
    try { hote = new URL(url).hostname.replace(/^www\./, ''); } catch { return null; }
    if (/facebook\.com\/me\/?$/.test(url)) return null; // lien vers le profil de qui regarde, pas le sien
    if (/resalib/.test(hote)) return { url, type: 'resalib', texte: 'Réserver sur Resalib' };
    if (/facebook/.test(hote)) return { url, type: 'facebook', texte: 'Sa page Facebook' };
    return { url, type: 'fiche', texte: `Sa fiche sur ${hote}` };
  }).filter(Boolean);

  return {
    dossier: d.dossier, brut, nom, personne, enseigne, prenom, initiales, feminin,
    metier, metierBrut, famille: familleDe(d), ville, cp: propre(d.cp), lieu: [propre(d.cp), ville].filter(Boolean).join(' '),
    accroche: accroche || null, accrocheGenerique, accrocheSienne: !!d.accrocheSienne && !accrocheGenerique,
    phrase, phraseSource: source, approche, apropos, notesTarifs, notesDuree, cerf: propre(d.cerf) || null,
    etapes, etapesVides: placeholders, apports, tarifs, dureePremiere: propre(d.dureePremiere), dureeSuivi: propre(d.dureeSuivi),
    paiement: propre(d.paiementListe), tel, telLien, liens, rdv: propre(d.rdv) || 'Sur rendez-vous',
    siret: propre(d.siret), avertissement: propre(d.avertissement), court: !!d.court,
  };
}
