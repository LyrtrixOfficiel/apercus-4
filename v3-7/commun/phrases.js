// Les mots du praticien, rangés avant d'être montrés : UNE règle pour les 11 univers.
// Module ES sans dépendance, dans le navigateur (import) et dans node (batir.mjs).
//
// 1. Aucune promesse de santé ni de résultat : une phrase qui en fait une (« meilleure récupération »,
//    « vitalité », « libération de maux », « améliorations concrètes », guérir, soigner, traiter, effets
//    bénéfiques...) n'est pas reprise. Dans une énumération (« une profonde détente, une meilleure récupération
//    et une vitalité au quotidien »), seuls les éléments qui promettent tombent. Les phrases de prudence
//    (« ne remplace pas un avis médical ») restent toujours.
// 2. Les doublons disparaissent : un paragraphe repris dans un autre, puis une phrase déjà dite ailleurs
//    (accroche, conviction, paragraphe précédent).
// 3. La phrase d'ouverture est CHOISIE : celle qui dit le mieux qui il ou elle est (« Mon approche est
//    douce… »), jamais une phrase de prix, de durée, d'organisation, ni une phrase qui commence par un liant.
// 4. Les phrases de prix et de durée sortent de l'approche : elles vont avec les tarifs (renvoyées à part).
// Rien n'est inventé ni réécrit : on choisit, on range, on retire, on rétablit une majuscule en début de phrase.
//
// Usage le plus simple : const d = nettoyer(fiche) au début du rendu ; puis d.phrases = { phare, reste, ecartes }.

export const cle = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

// Majuscule rétablie en début de phrase (« … art thérapie. quelles sont… »), espaces propres.
export const propre = (s) => String(s ?? '').replace(/\s+/g, ' ').trim()
  .replace(/([.!?…]\s+)([a-zà-öø-ÿ])/g, (m, a, b) => a + b.toUpperCase()).replace(/^[a-zà-öø-ÿ]/, (c) => c.toUpperCase());

// Découpe en phrases (un point, puis une majuscule ou un guillemet).
export const phrasesDe = (p) => propre(p).split(/(?<=[.!?…])\s+(?=[A-ZÀ-ÖØ-Þ«"])/u).map((x) => x.trim()).filter(Boolean);

// ---------- 1. Promesses de santé ou de résultat ----------
export const PROMESSE = new RegExp([
  'effets? b[ée]n[ée]fiques?', 'bienfaits? (sur|pour) (la |votre |vos |le )?(sant|corps|organisme|sommeil|syst)',
  'gu[ée]ri(r|son|t|ssent|sse)?\\b', '\\bsoign(er|e|ent|ons|ez)\\b', '\\btrait(er|e|ent|ons|ez)\\b (les |vos |la |le |l.|des )?(maladies?|douleurs?|troubles?|sympt|pathologie|causes?|probl[èe]mes? de sant|stress|anxi[ée]t|d[ée]pression|insomnie|burn.?out|addictions?|phobies?)',
  'traitements? (de |des |du |contre )(la |l.|les )?(douleur|maladie|stress|insomnie|trouble|d[ée]pression|anxi[ée]t)',
  'syst[èe]me (nerveux|immunitaire|lymphatique|digestif|hormonal)', '\\bimmunit', '\\bd[ée]fenses? naturelles?',
  'am[ée]lior\\w* (du |de la |de l.|le |la |l.|votre |vos )?(sommeil|sant[ée]|peau|teint|circulation|digestion|immunit|qualit[ée] du sommeil|r[ée]cup)',
  'am[ée]liorations? (concr|nette|significativ|visible|rapide|durable)', 'constater des', 'r[ée]sultats? (garanti|visible|imm[ée]diat|rapide|durable|concret|prouv)',
  'soulag', 'apais\\w* (les |vos )?douleurs?', '\\bdouleurs? (chroniques?|articulaires?|musculaires?|de dos)', 'maux de (dos|t[êe]te|ventre)',
  'lib[ée]r\\w* (de |des |les |vos |ses )?maux', '(gu[ée]ri|soulag|r[ée]sou|[ée]limin)\\w* (les |vos |ses |des )?(maladies?|pathologies?|migraines?|insomnies?|troubles?)',
  'rajeuni', 'anti.?[âa]ge', 'anti.?rides', '\\blifting\\b', '[ée]clat (de la peau|du teint|du visage)', 'raffermi', 'repulp', 'effet bonne mine', 'minceur', 'amincis', 'perte de poids', 'cellulite', 'd[ée]toxi', '\\btoxines?\\b',
  'meilleure r[ée]cup[ée]ration', 'r[ée]cup[ée]ration (musculaire|physique)', '\\bvitalit[ée]', '[ée]nergie vitale', 'r[ée]g[ée]n[ée]r',
  'effets? (peuvent|sont|se font|se d[ée]ploient|imm[ée]diats?|durables?|visibles?)', '\\bboost', 'renforc\\w* (le |votre |vos |les )?(syst|immun|organisme|d[ée]fenses)',
  'lib[ée]ration (de|des) (maux|douleurs|tensions physiques)', '\\befficac', 'scientifiquement', '(?<![a-zà-ÿ])prouv[ée]e?s?\\b', 'cliniquement',
  'sant[ée] (physique|mentale)', '(retrouv|recouvr)\\w* (une |la |votre )?(bonne |pleine )?sant[ée]', 'en pleine sant[ée]',
].join('|'), 'i');
// Une phrase de prudence reste toujours, même si elle nomme la maladie ou la médecine.
export const PRUDENCE = /(ne remplace|ne se substitu|ne saurait remplacer|en compl[ée]ment|compl[ée]mentaire d|avis m[ée]dical|suivi m[ée]dical|consulter (un|votre) m[ée]decin|aucun diagnostic|ne pose pas de diagnostic|relèvent du bien-être)/i;

export const estPromesse = (p) => PROMESSE.test(p) && !PRUDENCE.test(p);

// Une énumération (« A, B, C et D ») dont certains éléments promettent : on garde la phrase et les autres
// éléments. Seulement si chaque élément commence par un article (sinon on ne sait pas découper sans réécrire).
const ARTICLE = /^(un|une|des|le|la|les|l['’]|du|de la|de l['’]|votre|vos|son|sa|ses|plus de|moins de)\s*/i;
function sansElementsPromis(f) {
  const fin = (f.match(/[.!?…]+$/) || ['.'])[0];
  const corps = f.replace(/[.!?…]+$/, '');
  const morceaux = corps.split(/,\s+|\s+et\s+/);
  if (morceaux.length < 3) return '';
  const [tete, ...elements] = morceaux;
  if (!elements.every((e) => ARTICLE.test(e.trim())) || estPromesse(tete)) return '';
  const gardes = elements.filter((e) => !estPromesse(e));
  if (gardes.length === elements.length) return '';
  // la tête se termine par le premier élément : « La sonothérapie favorise une profonde détente »
  const liste = gardes.length === 0 ? '' : gardes.length === 1 ? ' et ' + gardes[0] : ', ' + gardes.slice(0, -1).join(', ') + ' et ' + gardes[gardes.length - 1];
  const res = `${tete}${liste}${fin}`;
  return estPromesse(res) ? '' : res;
}

/** Le texte sans ses phrases qui promettent un effet de santé ou un résultat. */
export function sansPromesse(t = '') {
  const f = phrasesDe(t);
  if (!f.length) return '';
  return f.map((p) => (estPromesse(p) ? sansElementsPromis(p) : p)).filter(Boolean).join(' ').trim();
}

// ---------- 3 et 4. Prix, durée, organisation, liants ----------
export const PRIX = /(\bprix\b|\btarif|€|\beuros?\b)/i;
// Prix et durée : leur place est avec les tarifs, pas dans l'approche.
export const AUX_TARIFS = /(\bprix\b|\btarif|€|\beuros?\b|\bdur[ée]e?s?\b|\bdure\b|\d\s?h(eures?)?\b|\d+\s?min(utes)?\b|\bune heure\b|\bheure et demie\b)/i;
export const PRATIQUE = /(\bprix\b|\btarif|€|\beuros?\b|\bdur[ée]e?s?\b|\bdure\b|\d\s?h\b|\d\s?heures?\b|domicile|je me d[ée]place|table de massage|habill[ée]|en visio|[àa] distance|en entreprise|je vous explique|le d[ée]roul[ée]|r[ée]ponds? [àa] vos questions|infos pratiques|du lundi|sur inscriptions?|\bzoom\b|me contacte[rz]?\b|n.h[ée]sitez pas)/i;
// Débuts de phrase qui renvoient à une phrase précédente : la phrase ne tient pas seule.
const LIANT = /^(pour cela|pour ce faire|c\S+est pourquoi|ainsi|de plus|par ailleurs|en effet|ensuite|puis|enfin|cependant|toutefois|pourtant|mais|donc|alors|[ée]galement|aussi|apr[èe]s|en fin de|[àa] la fin|au d[ée]but|lors de|d\S+abord|tout d\S+abord|de ce fait|ce moment|cette s[ée]ance|celle-ci|celui-ci|ces (outils|[ée]l[ée]ments|techniques|m[ée]thodes|s[ée]ances)|cela|ceci|gr[âa]ce [àa] (cela|ces|ce))\b/i;
// Ceux qui renvoient vraiment à ce qui précède : une accroche ne commence pas ainsi (« Lors de », « Après » tiennent seuls).
const RENVOI = /^(pour cela|pour ce faire|c\S+est pourquoi|ainsi|de plus|par ailleurs|en effet|ensuite|puis|cependant|toutefois|pourtant|mais|donc|alors|[ée]galement|aussi|de ce fait|celle-ci|celui-ci|ces (outils|[ée]l[ée]ments|techniques|m[ée]thodes|s[ée]ances|pratiques)|cela|ceci|gr[âa]ce [àa] (cela|ces|ce))\b/i;
// Liants qu'on peut retirer proprement : la phrase garde son sens.
const LIANT_RETIRABLE = /^(?:(?:pour cela|pour ce faire|c\S+est pourquoi|ainsi|de plus|par ailleurs|en effet|de ce fait),?|(?:ensuite|enfin|puis),)\s+/i;
// Ce qui dit une personne, une conviction, une façon d'être.
const PORTEUR = /(mon approche|ma pratique|ma d[ée]marche|je crois|pour moi|mon souhait|ma conviction|ma mission|une mission|chaque (s[ée]ance|personne|accompagnement|[êe]tre|soin)|c\S+est (une|un) |invitation|voyage int[ée]rieur|j.accompagne|je vous accompagne)/i;
// Une précaution ou une phrase qui renvoie ailleurs n'ouvre pas.
const SECONDAIRE = /(substitu|ne remplace|avis m[ée]dical|professionnels? de sant[ée]|\b[ée]galement\b|en compl[ée]ment)/i;
// Phrase générique fabriquée quand la fiche ne disait rien.
export const GENERIQUE = /^(s[ée]ances?|consultations?|massages?)\b[^.]{0,60},? sur rendez-vous\.?$/i;
const ACCROCHE_GENERIQUE = /^[^.]{0,90}(,| à [^,.]+,) sur rendez-vous\.?$/i;

export const sansLiant = (p) => propre(String(p).replace(LIANT_RETIRABLE, ''));
export const commenceParLiant = (p) => RENVOI.test(propre(p)) && !LIANT_RETIRABLE.test(propre(p));

function note(p, conviction) {
  const t = propre(p), n = t.length;
  let s = 0;
  if (GENERIQUE.test(t)) return -99;
  if (PRATIQUE.test(t)) s -= 4;
  if (LIANT_RETIRABLE.test(t)) s -= 1; else if (LIANT.test(t)) s -= 3;
  if (PORTEUR.test(t)) s += 3;
  if (SECONDAIRE.test(t)) s -= 2;
  if (/^(bonjour|je (m.appelle|suis) )/i.test(t)) s -= 2;
  if (n >= 45 && n <= 240) s += 1;
  if (n > 320) s -= 2;
  if (n < 30) s -= 3;
  if (conviction) s += 3;
  return s;
}

// ---------- 2. Doublons ----------
// Paragraphes en double : un paragraphe repris dans un autre, plus long, disparaît (on garde le plus complet).
export function sansDoublons(a) {
  const k = a.map(cle);
  return a.filter((p, i) => !k.some((q, j) => j !== i && q.length >= k[i].length && q.includes(k[i].slice(0, 80)) && (q.length > k[i].length || j < i)));
}

// Puis les phrases déjà dites (dans « deja » ou plus haut dans la liste) disparaissent ; un paragraphe vidé saute.
export function sansRedites(paras, deja = []) {
  const vues = deja.filter(Boolean).flatMap(phrasesDe).map(cle).filter((x) => x.length > 24);
  const out = [];
  for (const p of sansDoublons(paras.map(propre).filter(Boolean))) {
    const garde = phrasesDe(p).filter((f) => {
      const c = cle(f);
      if (c.length > 24 && vues.some((v) => v.includes(c) || (c.length > 60 && c.includes(v)))) return false;
      vues.push(c);
      return true;
    });
    if (garde.length) out.push(garde.join(' '));
  }
  return out;
}

// L'approche rangée : { phare (phrase d'ouverture), reste (autres paragraphes), ecartes (phrases de prix ou de durée) }.
// options.avecConviction : la conviction peut ouvrir (elle a un bonus) ; sinon elle reste à part.
// options.ecarter : regex des phrases à sortir de l'approche (par défaut : prix et durée, AUX_TARIFS).
export function rangerApproche(d, { avecConviction = true, ecarter = AUX_TARIFS, deja = [] } = {}) {
  const conv = propre(sansPromesse(d.conviction || ''));
  // « Institut de beauté Carole Duforêt, à Draguignan. » : la phrase fabriquée d'une fiche presque vide.
  const nomVille = cle(`${d.nom || ''} a ${d.ville || ''}`);
  let paras = sansRedites((d.approche || []).map(sansPromesse).filter(Boolean), [d.accroche, avecConviction ? '' : conv, ...deja])
    .filter((p) => !GENERIQUE.test(p) && cle(p) !== nomVille);
  const ecartes = [];
  if (ecarter) {
    paras = paras.map((p) => { const f = phrasesDe(p); ecartes.push(...f.filter((x) => ecarter.test(x))); return f.filter((x) => !ecarter.test(x)).join(' '); }).filter(Boolean);
  }
  const candidats = paras.map((p, i) => ({ p, i, s: note(p, false) }));
  if (avecConviction && conv) {
    paras = sansRedites(paras, [conv]);
    candidats.length = 0;
    paras.forEach((p, i) => candidats.push({ p, i, s: note(p, false) }));
    candidats.push({ p: conv, i: -1, s: note(conv, true) });
  }
  if (!candidats.length) return { phare: '', reste: [], ecartes };
  const meilleur = candidats.reduce((a, b) => (b.s > a.s || (b.s === a.s && b.i === -1 && a.i !== -1) ? b : a));
  if (meilleur.s <= -99) return { phare: '', reste: [], ecartes };
  let phare = sansLiant(meilleur.p), suite = [];
  // Un paragraphe trop long pour ouvrir : sa première phrase ouvre, la suite vient juste après.
  const f = phrasesDe(phare);
  if (phare.length > 230 && f.length > 1 && f[0].length >= 40) { phare = f[0]; suite = [f.slice(1).join(' ')]; }
  // Un paragraphe qui a perdu la phrase qui le précédait perd aussi son liant (« Ensuite, je vous guide… »).
  const autres = paras.map((p, i) => (i === 0 || i - 1 === meilleur.i ? sansLiant(p) : p)).filter((_, i) => i !== meilleur.i);
  if (meilleur.i !== -1 && conv && avecConviction) autres.unshift(conv);
  return { phare, reste: [...suite, ...autres], ecartes };
}

// ---------- La fiche entière, nettoyée ----------
const EMPLACEMENT_ETAPE = 'Ici, ce moment de la séance raconté avec vos mots.';
const estEmplacement = (t) => /^\s*Ici,/.test(t || '');

/** L'accroche, si elle tient seule et ne promet rien ; sinon la phrase générique « Métier à Ville, sur rendez-vous. » */
export function accrocheNette(d) {
  const brute = propre(d.accroche || '');
  const generique = `${propre(d.metier || '')}${d.ville ? ' à ' + d.ville : ''}, sur rendez-vous.`;
  if (!brute) return { texte: d.metier ? generique : '', sienne: false };
  if (ACCROCHE_GENERIQUE.test(brute) && !d.accrocheSienne) return { texte: brute, sienne: false };
  let t = sansPromesse(brute);
  if (t && commenceParLiant(t)) t = '';
  if (t) t = sansLiant(t);
  return t ? { texte: t, sienne: d.accrocheSienne !== false } : { texte: d.metier ? generique : '', sienne: false };
}

/**
 * La fiche telle que tous les univers la montrent : mêmes promesses retirées, mêmes doublons, même phrase
 * d'ouverture, mêmes phrases de prix et de durée mises de côté. Idempotent (nettoyer(nettoyer(d)) = nettoyer(d)).
 * d.phrases = { phare, reste, ecartes } : l'approche rangée, prête à montrer.
 * d.promessesRetirees : nombre de phrases ou d'éléments retirés (pour les relectures).
 */
export function nettoyer(d) {
  if (!d || d.__net) return d;
  let retirees = 0;
  const net = (t) => { const a = propre(t || ''); const b = sansPromesse(a); if (b !== a) retirees++; return b; };
  const acc = accrocheNette(d);
  if (acc.texte !== propre(d.accroche || '')) retirees++;
  const conviction = net(d.conviction);
  const approche = (d.approche || []).map(net).filter(Boolean);
  const apropos = sansRedites((d.apropos || []).map(net).filter(Boolean), [acc.texte, conviction]);
  const etapes = (d.etapes || []).filter((e) => e && e.titre).map((e) => {
    if (estEmplacement(e.texte)) return e;
    const t = net(e.texte);
    return { ...e, texte: t || EMPLACEMENT_ETAPE, vide: !t };
  });
  const apports = (d.apports || []).filter((a) => a && a.titre && !estPromesse(a.titre)).map((a) => ({ ...a, texte: net(a.texte) }));
  const sortie = { ...d, accroche: acc.texte, accrocheSienne: acc.sienne, conviction, approche, apropos, etapes, apports, cerf: net(d.cerf) };
  sortie.phrases = rangerApproche(sortie);
  sortie.promessesRetirees = retirees;
  Object.defineProperty(sortie, '__net', { value: true, enumerable: false });
  return sortie;
}

// ---------- Titres en double ----------
/** Le titre d'une section, sans redire celui d'une étape (« La séance » puis « La séance »). */
export function titreSansDoublon(titre, autres = [], repli = '') {
  const c = cle(titre);
  return autres.some((t) => cle(t) === c) ? (repli || titre) : titre;
}
