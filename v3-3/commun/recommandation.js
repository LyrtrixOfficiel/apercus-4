// Moteur de recommandation des univers, partagé par la page d'arrivée (navigateur) et les scripts (node).
// Module ES sans dépendance autre que familles.js. Déterministe : mêmes données, même classement.
//
// Utilisation :
//   const catalogue = await chargerCatalogue({ lire });            // lire(url) -> Promise<objet JSON | null>
//   const r = recommander(fiche, catalogue, { teinte: 'vert', ton: 'clair' });
//   r.classement[0] -> { id, univers, palette, accord, rang, score, raison: { texte, type, mot }, mots, detail }
//
// Comment le score est calculé (pour chaque univers) :
//   1. Famille du métier. famille(fiche) donne la famille principale (poids 1). Les autres familles reconnues
//      dans SES textes (approche, à propos, conviction, accroche) comptent un peu (0,35 chacune, 0,15 pour
//      « élan » qui reconnaît le mot très courant « accompagner » ; 0,7 au plus en tout).
//      score familles = somme(poids de la famille x note de l'univers pour cette famille, de 0 à 5), la note étant
//      corrigée de la générosité de l'univers : un univers qui se note haut partout perd 0,6 x (sa moyenne moins
//      la moyenne du catalogue), un univers spécialiste gagne d'autant. Sinon les généralistes gagneraient tout.
//   2. Ses mots. Chaque racine de `motsCles` trouvée dans ses textes rapporte selon le champ (métier 1,6 ;
//      accroche et conviction 1,2 ; approche et à propos 1), les suivantes de moins en moins (x 0,6 à chaque
//      fois), 3 points au plus ; un mot trop courant (« accompagner », « séance », « cabinet ») compte trois fois
//      moins et n'est jamais cité. Le mot trouvé est gardé, avec ses voisins utiles (« voyage intérieur »), pour
//      l'expliquer. Une racine qui commence par « = » doit être le mot entier (« =art », « =sons »).
//   3. Ses goûts, s'il en a donnés (teinte du nuancier, lumière du jour ou du soir). Ils ne changent pas le
//      score : ils rangent d'abord par paliers. Palier 0 : l'univers a une palette dans la teinte (et la lumière)
//      choisies. Palier 1 : seulement une teinte voisine ou neutre, ou la mauvaise lumière. Palier 2 : rien
//      d'approchant (l'univers passe derrière et son affiche est montrée sans couleur, jamais dans une couleur
//      contraire). Une petite prime d'ambiance (lumineux pour le jour, sombre ou mystère pour le soir) départage.
//   4. Diversité du trio. Le premier est le meilleur score. Pour les places 2 et 3, un univers trop proche
//      d'un univers déjà choisi (mêmes ambiances, même lumière) perd jusqu'à 1,1 point : on propose trois
//      façons différentes de lui plaire plutôt que trois variantes de la même idée.
//   5. Palette. Pour chaque univers : la teinte et la lumière choisies d'abord, sinon une voisine, sinon une
//      neutre ; sans goût déclaré, la palette `defautPour` de sa famille, sinon la première.
//   6. Raison. Chacun des trois premiers reçoit une raison en SES mots, sans réutiliser un mot déjà cité plus
//      haut : « Vous parlez de “voyage intérieur” : on vous a imaginé un ciel de nuit... ». À défaut, la famille
//      (« Pour la périnatalité et la famille, ... »), et pour un univers peu attendu : « Plus inattendu pour vous ».
//      `raison.debut` en garde le début seul (« Vous parlez des « vibrations » »), pour les phrases courtes.
//   0. Pertinence, AVANT tout le reste (troisième tour : « ne montrer QUE ce qui vise la personne »).
//      Un univers réservé (RESERVES) n'est proposé qu'à sa famille : Cocon à la périnatalité, Institut à la
//      beauté, Méridiens au corps et à l'énergie, Résonance au son et à la création. Les autres doivent se
//      noter au moins SEUILS[famille] (3 par défaut, 4 pour la périnatalité) pour la famille principale du
//      praticien. `r.proposes` : les univers pertinents, du meilleur au moins bon (4 au plus). S'il en manque
//      (catalogue incomplet), on complète par les meilleurs non réservés, marqués `horsSujet`.

import { FAMILLES, ORDRE as ORDRE_FAMILLES, famille } from './familles.js';

/** Univers réservés à certaines familles : jamais proposés ailleurs. Un univers.json peut aussi déclarer `reserve`. */
export const RESERVES = { cocon: ['famille'], institut: ['beaute'], meridiens: ['energie'], resonance: ['creation'] };
/** Note minimale (déclarée par l'univers, de 0 à 5) pour la famille principale du praticien. */
export const SEUILS = { famille: 4, _: 3 };
const seuil = (f) => SEUILS[f] ?? SEUILS._;
/** L'univers vise-t-il ce praticien ? */
export function pertinent(u, principale) {
  const r = Array.isArray(u.reserve) && u.reserve.length ? u.reserve : RESERVES[u.id];
  if (r) return r.includes(principale);
  return (Number(u.familles?.[principale]) || 0) >= seuil(principale);
}
const reserve = (u) => Boolean((Array.isArray(u.reserve) && u.reserve.length) || RESERVES[u.id]);

/** Univers montrés sur la page d'arrivée, dans l'ordre de départage. Fluide est en réserve. */
export const UNIVERS_AFFICHES = ['nature', 'aurora-nuit', 'cinema', 'editorial', 'liquid-glass', 'pop-vitamine', 'immersion', 'meridiens', 'cocon', 'institut', 'resonance'];
export const RESERVE = ['fluide'];

/** Les teintes du contrat univers.json, leur nom, leur nuance d'échantillon et leurs voisines (jamais contraires). */
export const TEINTES = {
  vert: { nom: 'Vert', article: 'le vert', echantillon: ['#4f7f3a', '#a9cf8c'], voisines: ['jaune', 'terre', 'bleu'] },
  bleu: { nom: 'Bleu', article: 'le bleu', echantillon: ['#2c5a96', '#9cc3ec'], voisines: ['violet', 'vert'] },
  violet: { nom: 'Violet', article: 'le violet', echantillon: ['#5f45aa', '#c4b3f0'], voisines: ['bleu', 'rose'] },
  rose: { nom: 'Rose', article: 'le rose', echantillon: ['#b8577c', '#f3c2d3'], voisines: ['rouge', 'violet'] },
  rouge: { nom: 'Rouge', article: 'le rouge', echantillon: ['#a8332a', '#e99a86'], voisines: ['rose', 'orange', 'terre'] },
  orange: { nom: 'Orange', article: "l'orange", echantillon: ['#c8641f', '#f6be8a'], voisines: ['rouge', 'jaune', 'terre'] },
  jaune: { nom: 'Jaune', article: 'le jaune', echantillon: ['#c99a1e', '#f5dc80'], voisines: ['or', 'orange'] },
  terre: { nom: 'Terre', article: 'les tons de terre', echantillon: ['#8a5232', '#d6b08e'], voisines: ['orange', 'rouge', 'or'] },
  or: { nom: 'Or', article: "l'or", echantillon: ['#a8822f', '#e7cf8f'], voisines: ['jaune', 'terre'] },
  'neutre-clair': { nom: 'Lin', article: 'les tons clairs', echantillon: ['#d9cfbf', '#f3eee6'], voisines: ['terre', 'or'] },
  'neutre-sombre': { nom: 'Encre', article: 'les tons sombres', echantillon: ['#26221e', '#5a534b'], voisines: ['bleu', 'or'] },
};
const NEUTRES = ['neutre-clair', 'neutre-sombre'];

// ---------------------------------------------------------------------------------------------------------
// Catalogue : <id>/univers.json en priorité, sinon accueil/univers-provisoires.json, champ par champ.

const paletteValide = (p) => p && typeof p.id === 'string' && p.couleurs && /^#[0-9a-f]{6}$/i.test(p.couleurs.fond || '') && /^#[0-9a-f]{6}$/i.test(p.couleurs.encre || '');

/** Fusionne un univers.json réel (prioritaire) et l'estimation provisoire. */
export function fusionner(provisoire, reel) {
  if (!reel || typeof reel !== 'object') return provisoire ? { ...provisoire, source: 'provisoire' } : null;
  const p = provisoire || {};
  const u = { ...p, source: 'univers.json' };
  for (const [cle, val] of Object.entries(reel)) {
    if (val === undefined || val === null || val === '') continue;
    if (cle === 'palettes') { const ok = Array.isArray(val) ? val.filter(paletteValide) : []; if (ok.length) u.palettes = ok; continue; }
    if (cle === 'familles') { if (typeof val === 'object' && Object.values(val).some((x) => typeof x === 'number')) u.familles = val; continue; }
    if (cle === 'motsCles') { if (Array.isArray(val) && val.length) u.motsCles = val.map(String); continue; }
    if (cle === 'polices') { if (typeof val === 'object') u.polices = { ...(p.polices || {}), ...val }; continue; }
    u[cle] = val;
  }
  u.id = p.id || reel.id;
  return u;
}

/**
 * Charge le catalogue des univers affichés.
 * @param {{ lire: (chemin: string) => Promise<any>, racine?: string }} o  chemins relatifs à maquettes-v3/
 */
export async function chargerCatalogue({ lire, racine = '' }) {
  const sur = (c) => Promise.resolve().then(() => lire(racine + c)).catch(() => null);
  const [prov, ...reels] = await Promise.all([sur('accueil/univers-provisoires.json'), ...UNIVERS_AFFICHES.map((id) => sur(`${id}/univers.json`))]);
  const liste = prov?.univers || [];
  return UNIVERS_AFFICHES.map((id, i) => fusionner(liste.find((u) => u.id === id), reels[i]))
    .filter((u) => u && Array.isArray(u.palettes) && u.palettes.length)
    .map((u, i) => ({ ordre: i + 1, ...u }));
}

// ---------------------------------------------------------------------------------------------------------
// Textes du praticien

export const normaliser = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’`]/g, "'").toLowerCase();
const ELISION = /^(?:l|d|j|qu|m|s|n|c|t|jusqu|lorsqu|puisqu)'/;
const MOTS_VIDES = new Set(`le la les l un une des du de d au aux et ou en pour par sur dans avec sans sous vers a est sont qui que qu quoi dont ou ce cet cette ces
son sa ses leur leurs vos votre notre nos mon ma mes ton ta tes il elle ils elles vous nous je j tu on se s ne n pas plus tres tout tous toute toutes etre avoir
fait faire comme mais donc car ni si y me m te t lui eux aussi bien ainsi afin chaque autre autres meme memes peu tant puis alors entre chez cela ceci ca
quand lorsque lorsqu parce puisque quoique trop vite tres deja encore toujours jamais souvent ici etc`.split(/\s+/));
const PLACEHOLDER = /^\s*ici,/i;
// Racines trop courantes dans les présentations du bien-être (« accompagner », « séance », « cabinet »...) : si un
// univers les déclare dans ses motsCles, elles comptent trois fois moins et ne sont jamais citées comme raison.
const GENERIQUES = /^(accompagn|seance|seances|bien-?etre|besoin|temps$|moment|cabinet|rendez|pratique|personne|vie$|aide|aider|soin$|soins$|ecoute|parcours|lieu|accueil|profession|experience|objectif|suivi|domicile|outil|approche|methode|technique)/;

/** Les textes qui viennent du praticien, avec le poids de leur champ. Rien de ce qui a été fabriqué. */
export function textesDe(d) {
  const t = [];
  const ajouter = (champ, poids, texte) => { const s = String(texte ?? '').replace(/\s+/g, ' ').trim(); if (s && !PLACEHOLDER.test(s)) t.push({ champ, poids, texte: s }); };
  ajouter('metier', 1.6, d?.metier);
  if (d?.accrocheSienne !== false) ajouter('accroche', 1.2, d?.accroche);
  ajouter('conviction', 1.2, d?.conviction);
  for (const s of d?.approche || []) ajouter('approche', 1, s);
  for (const s of d?.apropos || []) ajouter('apropos', 1, s);
  return t;
}

/** Découpe un texte en mots avec leur position et la ponctuation qui les sépare du mot suivant. */
export function mots(texte) {
  const out = [];
  const re = /[\p{L}\p{M}][\p{L}\p{M}'’-]*/gu;
  let m;
  while ((m = re.exec(texte))) out.push({ brut: m[0], debut: m.index, fin: m.index + m[0].length });
  out.forEach((w, i) => {
    w.norm = normaliser(w.brut);
    w.base = w.norm.replace(ELISION, '');
    w.affiche = w.brut.replace(/^(?:[lLdDjJmMsSnNcCtT]|[qQ]u|[jJ]usqu|[lL]orsqu|[pP]uisqu)['’]/, '');
    const apres = out[i + 1] ? texte.slice(w.fin, out[i + 1].debut) : texte.slice(w.fin);
    w.coupe = /[.,;:!?…()«»"“”/]/.test(apres); // ponctuation avant le mot suivant
  });
  return out;
}

// Repères de grammaire, volontairement simples : ils servent seulement à citer un bout de phrase qui se lit bien.
const ADJECTIF = /(eure|eures|interieur|exterieur|superieur|meilleur|elle|elles|el|els|ale|ales|al|aux|ique|iques|ive|ives|if|ifs|onde|ondes|ond|euse|euses|eux|ee|ees|ante|antes|ant|ants|aire|aires|ible|ibles|able|ables|ulee|ulees|aine|aines|present|presente|presents|presentes|unique|uniques)$/;
const NOM_ABSTRAIT = /(ange|anges|tion|tions|sion|sions|age|ages|ance|ances|ence|ences|ment|ments|te|tes|ure|ures|isme|ude|udes|ite|ites|ie|ies|ce|ces|eur|eurs)$/;
const INFINITIF = /(er|ir|re)$/;
const DETERMINANTS = new Set(['le', 'la', 'les', 'l', 'un', 'une', 'des', 'du', 'de', 'd', 'vos', 'votre', 'son', 'sa', 'ses', 'mes', 'ma', 'mon', 'notre', 'nos', 'leur', 'leurs', 'ce', 'cet', 'cette', 'ces', 'chaque', 'au', 'aux']);
const PRENOMINAUX = new Set(['belle', 'beau', 'bel', 'belles', 'beaux', 'grand', 'grande', 'grands', 'grandes', 'petit', 'petite', 'douce', 'doux', 'vrai', 'vraie', 'nouvelle', 'nouveau', 'pleine', 'plein', 'profonde', 'profond', 'juste', 'bon', 'bonne', 'meilleur', 'meilleure', 'veritable', 'jeune', 'jeunes', 'futur', 'futurs', 'future', 'futures', 'nouvelles', 'nouveaux', 'vraies', 'vrais']);
// Noms en « -ment » (les autres mots en « -ment » sont des adverbes, qu'on ne cite pas : « profondément »).
const NOMS_MENT = new Set(['apaisement', 'epanouissement', 'accompagnement', 'changement', 'moment', 'moments', 'cheminement', 'mouvement', 'mouvements', 'ressentiment', 'allaitement', 'accouchement', 'enseignement', 'developpement', 'ressourcement', 'enracinement', 'alignement', 'relachement', 'detachement', 'engagement', 'sentiment', 'sentiments', 'element', 'elements', 'instrument', 'instruments', 'rayonnement', 'recentrement', 'emerveillement', 'eveillement', 'renouvellement', 'bouleversement', 'environnement', 'fonctionnement', 'comportement', 'evenement', 'evenements']);
// Noms qui finissent comme un infinitif (« plaisir », « sourire ») : jamais le début d'un groupe verbal.
const NOMS_INFINITIFS = new Set(['plaisir', 'plaisirs', 'loisir', 'loisirs', 'desir', 'desirs', 'avenir', 'souvenir', 'souvenirs', 'sourire', 'sourires', 'rire', 'rires', 'devoir', 'pouvoir', 'savoir', 'etre', 'bien-etre', 'mieux-etre', 'cuir', 'air', 'soir', 'espoir', 'miroir', 'loir', 'repertoire', 'memoire', 'histoire', 'victoire', 'gloire', 'territoire', 'trajectoire', 'oratoire', 'equilibre', 'centre', 'cadre', 'ordre', 'titre', 'ventre', 'arbre', 'nombre', 'membre', 'livre', 'oeuvre', 'maitre', 'lettre', 'ombre', 'filtre', 'chiffre', 'theatre', 'spectre', 'diametre', 'metre']);
const adverbe = (w) => /ment$/.test(w.base) && !NOMS_MENT.has(w.base);
const capitale = (w) => /^\p{Lu}/u.test(w.affiche);

/** Autour d'un mot trouvé, l'expression qui se cite bien : « voyage intérieur », « relâcher les tensions ». */
function expression(ws, i, n = 1) {
  const w = ws[i];
  const ok = (x) => x && !MOTS_VIDES.has(x.base) && x.base.length >= 4;
  let a = i, b = i + n - 1;
  const dernier = ws[b], suivant = ws[b + 1], precedent = ws[i - 1];
  const nomPropre = capitale(w) && i > 0 && suivant && ['de', 'du', 'des'].includes(suivant.base) && ws[b + 2] && capitale(ws[b + 2]);
  // « Je suis une personne dynamique » : un adjectif qu'il dit de lui-même se cite seul (« Vous vous dites... »)
  const soi = n === 1 && ADJECTIF.test(w.base) && !NOM_ABSTRAIT.test(w.base) && ws.slice(Math.max(0, i - 4), i).some((x) => ['suis', 'sommes'].includes(x.base));
  if (soi) return { texte: w.affiche.replace(/^\p{Lu}/u, (c) => c.toLowerCase()), forme: 'soi', pluriel: false, mots: 1, adverbe: false };
  if (nomPropre && !dernier.coupe && !suivant.coupe) b = b + 2; // « Fleurs de Bach »
  else if (n === 1 && PRENOMINAUX.has(w.base) && !w.coupe && ok(suivant) && !ADJECTIF.test(suivant.base)) b = i + 1; // « profonde détente »
  else if (!dernier.coupe && ok(suivant) && ADJECTIF.test(suivant.base) && !adverbe(suivant) && !adverbe(dernier) && !(/ant$/.test(suivant.base) && ws[b + 2] && (DETERMINANTS.has(ws[b + 2].base.replace(/'$/, '')) || ['a', 'en', 'de', 'd'].includes(ws[b + 2].base)))) b = b + 1; // « voyage intérieur »
  // un adjectif trouvé seul prend le nom qui le précède : « transformation intérieure », « moyens naturels »,
  // « atmosphère apaisante » (jamais un verbe, un adverbe ou un autre adjectif)
  else if (n === 1 && precedent && !precedent.coupe && ok(precedent) && ADJECTIF.test(w.base) && !adverbe(precedent) && (NOM_ABSTRAIT.test(precedent.base) || !INFINITIF.test(precedent.base) || /re$/.test(precedent.base)) && !ADJECTIF.test(precedent.base) && !capitale(precedent)) a = i - 1;
  else if (n === 1 && INFINITIF.test(w.base) && !NOMS_INFINITIFS.has(w.base) && w.base.length >= 5 && !w.coupe && suivant && DETERMINANTS.has(suivant.base.replace(/'$/, '')) && !suivant.coupe && ok(ws[i + 2])) {
    b = i + 2; // « relâcher les tensions »
    if (!ws[i + 2].coupe && ok(ws[i + 3]) && ADJECTIF.test(ws[i + 3].base)) b = i + 3;
  }
  if (a === i && precedent && !precedent.coupe && PRENOMINAUX.has(precedent.base) && !ADJECTIF.test(w.base)) a = i - 1; // « belle aventure »
  const morceaux = ws.slice(a, b + 1);
  let texte = morceaux.map((x, k) => (k === 0 ? x.affiche : x.brut)).join(' ');
  // une majuscule de liste ou de début de phrase s'efface ; un nom propre (« Fleurs de Bach ») la garde
  if (!morceaux.slice(1).some(capitale) && !/^\p{Lu}{2}/u.test(texte)) texte = texte.replace(/^\p{Lu}/u, (c) => c.toLowerCase());
  if (texte.length > 34) texte = w.affiche;
  const tete = ws[a], avant = ws[a - 1];
  const pronominal = /^s'/.test(tete.norm) || (avant && avant.base === 'se');
  const determine = !pronominal && ((avant && DETERMINANTS.has(avant.base) && !(avant.base === 'de' && /(er|ir)$/.test(tete.base) && !NOM_ABSTRAIT.test(tete.base))) || /^(?:l|d)'/.test(tete.norm));
  const verbe = b > a && INFINITIF.test(tete.base) && tete.base.length > 4 && !NOM_ABSTRAIT.test(tete.base) && !ADJECTIF.test(ws[a + 1].base);
  const forme = verbe || (pronominal && INFINITIF.test(tete.base)) ? 'verbe' : determine ? 'nom' : ADJECTIF.test(tete.base) && !NOM_ABSTRAIT.test(tete.base) ? 'adjectif' : INFINITIF.test(tete.base) && !NOMS_INFINITIFS.has(tete.base) && !NOM_ABSTRAIT.test(tete.base) && tete.base.length > 4 ? 'verbe' : 'nom';
  const conjugue = b === a && forme === 'nom' && !determine && !/(tion|sion|ance|ence|ite|ude|isme|ure|age|ment|eur|ie|ise|esse|ique|oire|eil|ail|on|al|el|is|ys|ns|rs|ts|ps|x)s?$/.test(tete.base) && !NOMS_INFINITIFS.has(tete.base) && avant && !avant.coupe && !['de', 'd', 'et', 'ou'].includes(avant.base);
  const pluriel = b === a && avant && ['les', 'des', 'ses', 'vos', 'mes', 'nos', 'leurs', 'aux', 'ces'].includes(avant.base) && /[sx]$/.test(tete.base);
  return { texte, forme, pluriel, mots: b - a + 1, adverbe: ((adverbe(w) || PRENOMINAUX.has(w.base)) && n === 1 && b === a) || conjugue || (b === a && forme !== 'nom' && /ant$/.test(tete.base)) };
}

/** Les mots-clés d'un univers trouvés dans les textes, du plus fort au plus faible. */
export function trouverMots(univers, textes) {
  const trouves = new Map();
  const liste = univers.motsCles || [];
  for (const t of textes) {
    const phrases = t.texte.split(/(?<=[.!?…])\s+/);
    for (const phrase of phrases) {
      const ws = mots(phrase);
      liste.forEach((racineBrute, rangMot) => {
        const exacte = racineBrute.startsWith('=');
        const racine = normaliser(exacte ? racineBrute.slice(1) : racineBrute).trim();
        if (!racine || (trouves.has(racine) && trouves.get(racine).poids >= t.poids)) return;
        const parts = racine.split(/\s+/);
        let i = -1;
        if (parts.length > 1) {
          i = ws.findIndex((w, k) => parts.every((p, j) => ws[k + j] && (j < parts.length - 1 ? ws[k + j].base === p : ws[k + j].base.startsWith(p))));
        } else if (exacte) i = ws.findIndex((w) => w.base === racine);
        // racine très courte (« son », « art ») : le mot entier ou son pluriel ; « son » possessif ne compte pas
        else if (racine.length <= 3) i = ws.findIndex((w) => (MOTS_VIDES.has(racine) ? [racine + 's', racine + 'x'] : [racine, racine + 's', racine + 'x']).includes(w.base));
        else i = ws.findIndex((w) => w.base.startsWith(racine));
        if (i < 0) return;
        // « temps pour » : on va jusqu'au mot plein suivant (« temps pour vous »)
        let n = parts.length;
        while (n > 1 && MOTS_VIDES.has(parts[n - 1]) && ws[i + n] && !ws[i + n - 1].coupe && n < 4) { n++; if (!MOTS_VIDES.has(ws[i + n - 1].base)) break; }
        const ex = expression(ws, i, n);
        const generique = GENERIQUES.test(racine) || GENERIQUES.test(ws[i].base);
        // force du mot pour l'explication : un nom, une expression de plusieurs mots, une racine en tête de liste
        const force = t.poids + (ex.forme === 'nom' ? 0.5 : ex.forme === 'verbe' ? -0.2 : 0) + (ex.mots > 1 ? 0.4 : 0) + 0.8 * (1 - rangMot / Math.max(1, liste.length)) - (ex.adverbe ? 2 : 0) - (ex.mots === 1 && ex.texte.length < 6 ? 0.4 : 0) - (ex.mots === 1 && ex.forme === 'adjectif' ? 1.5 : 0) - (generique ? 3 : 0);
        trouves.set(racine, { racine, generique, champ: t.champ, poids: t.poids, mot: ex.texte, forme: ex.forme, pluriel: ex.pluriel, adverbe: ex.adverbe, force, phrase });
      });
    }
  }
  return [...trouves.values()].sort((a, b) => b.poids - a.poids || (a.champ === 'metier') - (b.champ === 'metier') || b.force - a.force);
}

/** Profil de familles : la famille principale (1) et les familles reconnues dans ses textes. */
export function profil(d) {
  const principale = famille(d);
  const poids = { [principale]: 1 };
  const texte = [d?.accrocheSienne !== false ? d?.accroche : '', d?.conviction, ...(d?.approche || []), ...(d?.apropos || [])].join(' ');
  let reste = 0.7;
  for (const k of ORDRE_FAMILLES) {
    if (k === principale || reste <= 0) continue;
    if (FAMILLES[k].re.test(texte)) { const p = Math.min(reste, k === 'elan' ? 0.15 : 0.35); poids[k] = p; reste -= p; }
  }
  return { principale, poids };
}

// ---------------------------------------------------------------------------------------------------------
// Palettes et goûts

/** La palette la plus cohérente d'un univers pour cette famille et ces goûts, et son accord avec la teinte. */
export function choisirPalette(univers, principale, gouts = {}) {
  const { teinte, ton } = gouts;
  let meilleure = null;
  univers.palettes.forEach((p, i) => {
    let note = 0, accord = 'libre';
    if (teinte) {
      if (p.teinte === teinte) { note += 100; accord = 'exact'; }
      else if (TEINTES[teinte]?.voisines.includes(p.teinte)) { note += 40; accord = 'voisin'; }
      else if (NEUTRES.includes(p.teinte)) { note += 30; accord = 'neutre'; }
      else accord = 'gris';
    }
    if (ton && p.ton === ton) note += 50;
    if ((p.defautPour || []).includes(principale)) note += 10;
    note -= i * 0.01;
    if (!meilleure || note > meilleure.note) meilleure = { palette: p, note, accord, bonTon: !ton || p.ton === ton };
  });
  return meilleure;
}

// Proximité de deux univers : ambiances communes et même lumière dominante.
function proximite(a, b) {
  const A = new Set(a.ambiances || []), B = new Set(b.ambiances || []);
  const inter = [...A].filter((x) => B.has(x)).length, union = new Set([...A, ...B]).size || 1;
  const sombre = (u) => u.palettes.filter((p) => p.ton === 'sombre').length > u.palettes.length / 2;
  return inter / union * 0.75 + (sombre(a) === sombre(b) ? 0.25 : 0);
}

// ---------------------------------------------------------------------------------------------------------
// Recommandation

const imagine = (u) => (u.imagine || String(u.promesse || u.nom).replace(/^\p{Lu}/u, (c) => c.toLowerCase())).replace(/[.\s]+$/, '');
const de = (x) => (/^[aeiouyhàâäéèêëîïôöûü]/i.test(x) ? 'd’' : 'de ');

/**
 * Classe les univers pour une fiche.
 * @param {object} d        fiche praticien (donnees/<dossier>.json)
 * @param {object[]} catalogue  sortie de chargerCatalogue
 * @param {{teinte?: string, ton?: 'clair'|'sombre'}} gouts
 */
export function recommander(d, catalogue, gouts = {}) {
  const prof = profil(d);
  const textes = textesDe(d);
  // spécificité : moyenne des notes de familles de chaque univers, comparée à la moyenne du catalogue
  const moyenne = (u) => ORDRE_FAMILLES.reduce((s, k) => s + (Number(u.familles?.[k]) || 0), 0) / ORDRE_FAMILLES.length;
  const moyenneCatalogue = catalogue.reduce((s, u) => s + moyenne(u), 0) / Math.max(1, catalogue.length);
  const lignes = catalogue.map((u) => {
    const correction = 0.6 * (moyenne(u) - moyenneCatalogue);
    const note = (k) => { const w = Number(u.familles?.[k]) || 0; return w > 0 ? Math.max(0, Math.min(6, w - correction)) : 0; };
    const famillesScore = Object.entries(prof.poids).reduce((s, [k, p]) => s + p * note(k), 0);
    const trouves = trouverMots(u, textes);
    let motsScore = 0;
    const comptes = [...trouves.filter((m) => !m.generique), ...trouves.filter((m) => m.generique)];
    comptes.forEach((m, i) => { motsScore += 0.9 * m.poids * 0.6 ** i * (m.generique ? 0.33 : 1); });
    motsScore = Math.min(3, motsScore);
    const choix = choisirPalette(u, prof.principale, gouts);
    // paliers : 0 teinte et lumière justes ; 1 teinte juste, autre lumière ; 1,5 teinte voisine ou neutre ;
    // 2 voisine et autre lumière ; 3 aucune teinte approchante (affiche montrée sans couleur)
    let palier = 0;
    if (gouts.teinte) palier = choix.accord === 'exact' ? 0 : choix.accord === 'gris' ? 3 : 1.5;
    if (gouts.ton && !choix.bonTon) palier += palier === 3 ? 0 : palier === 0 ? 1 : 0.5;
    const amb = u.ambiances || [];
    const prime = gouts.ton === 'clair' && amb.includes('lumineux') ? 0.4 : gouts.ton === 'sombre' && (amb.includes('sombre') || amb.includes('mystere')) ? 0.4 : 0;
    const score = famillesScore + motsScore + prime;
    const vise = pertinent(u, prof.principale);
    return { id: u.id, univers: u, score, palier, pertinent: vise, horsSujet: !vise, palette: choix.palette, accord: choix.accord, mots: trouves, detail: { familles: +famillesScore.toFixed(2), mots: +motsScore.toFixed(2), gouts: prime } };
  });

  // tri : pertinents d'abord (puis non réservés, puis réservés à une autre famille), palier, score, ordre du catalogue
  const groupe = (l) => (l.pertinent ? 0 : reserve(l.univers) ? 2 : 1);
  lignes.sort((a, b) => groupe(a) - groupe(b) || a.palier - b.palier || b.score - a.score || (a.univers.ordre || 0) - (b.univers.ordre || 0));

  // diversité du trio (dans le premier groupe et le premier palier disponibles)
  const trio = [];
  const restants = [...lignes];
  while (trio.length < 3 && restants.length) {
    const palierMin = restants[0].palier, groupeMin = groupe(restants[0]);
    let best = null, bestVal = -Infinity;
    for (const l of restants) {
      if (l.palier !== palierMin || groupe(l) !== groupeMin) continue;
      const sim = trio.length ? Math.max(...trio.map((t) => proximite(t.univers, l.univers))) : 0;
      const val = l.score - 1.1 * sim * (trio.length ? 1 : 0);
      if (val > bestVal + 1e-9) { best = l; bestVal = val; }
    }
    best.detail.diversite = +(best.score - bestVal).toFixed(2);
    trio.push(best);
    restants.splice(restants.indexOf(best), 1);
  }
  const classement = [...trio, ...restants];
  classement.forEach((l, i) => { l.rang = i + 1; });

  // raisons, sans répéter un mot
  const dejaCites = new Set();
  const maxScore = classement[0]?.score || 1;
  for (const l of classement) l.raison = raison(l, prof, gouts, dejaCites, maxScore);
  // ce que la page d'arrivée propose : les pertinents (4 au plus), complétés s'il le faut par des non réservés
  const vises = classement.filter((l) => l.pertinent);
  const proposes = (vises.length >= 3 ? vises : [...vises, ...classement.filter((l) => !l.pertinent && !reserve(l.univers))]).slice(0, 4);
  return { famille: prof.principale, profil: prof, gouts, classement, proposes };
}

function raison(l, prof, gouts, dejaCites, maxScore) {
  const u = l.univers, fin = imagine(u);
  const candidat = l.mots.filter((m) => m.champ !== 'metier' && !m.adverbe && !m.generique && !dejaCites.has(normaliser(m.mot)) && m.mot.length >= 4).sort((a, b) => b.force - a.force)[0];
  if (candidat && l.rang <= 4) {
    dejaCites.add(normaliser(candidat.mot));
    const debut = candidat.forme === 'soi' ? `Vous vous dites « ${candidat.mot} »` : candidat.forme !== 'nom' ? `Vous écrivez « ${candidat.mot} »` : candidat.pluriel ? `Vous parlez des « ${candidat.mot} »` : `Vous parlez ${de(candidat.mot)}« ${candidat.mot} »`;
    return { type: 'mots', mot: candidat.mot, phrase: candidat.phrase, debut, texte: `${debut} : on vous a imaginé ${fin}.` };
  }
  const noteFamille = Number(u.familles?.[prof.principale]) || 0; // note déclarée par l'univers (sans correction)
  const fam = FAMILLES[prof.principale].nom;
  const debutFamille = `Pour ${fam}`;
  if (noteFamille >= 3) {
    dejaCites.familles = (dejaCites.familles || 0) + 1;
    const t = [`Pour ${fam}, on vous a imaginé ${fin}.`, `Autre idée pour ${fam} : ${fin}.`, `Une troisième piste pour ${fam} : ${fin}.`][Math.min(2, dejaCites.familles - 1)];
    return { type: 'famille', debut: debutFamille, texte: t };
  }
  if (gouts.teinte && l.accord === 'exact') return { type: 'gout', debut: `Dans ${TEINTES[gouts.teinte].article} que vous aimez`, texte: `Dans ${TEINTES[gouts.teinte].article} que vous aimez, on vous a imaginé ${fin}.` };
  if (gouts.ton && l.palette?.ton === gouts.ton) return { type: 'gout', debut: `Pour la lumière ${gouts.ton === 'clair' ? 'du jour' : 'du soir'}`, texte: `Pour la lumière ${gouts.ton === 'clair' ? 'du jour' : 'du soir'}, on vous a imaginé ${fin}.` };
  if (l.score < maxScore * 0.6) return { type: 'surprise', debut: 'Plus inattendu pour vous', texte: `Plus inattendu pour vous : ${fin}.` };
  return { type: 'famille', debut: debutFamille, texte: `Pour ${FAMILLES[prof.principale].nom}, on vous a aussi imaginé ${fin}.` };
}

/** Lien vers un univers avec sa palette. */
export const lienUnivers = (id, dossier, palette) => `${id}/?p=${encodeURIComponent(dossier)}${palette ? `&palette=${encodeURIComponent(palette)}` : ''}`;
