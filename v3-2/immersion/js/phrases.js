// Les mots du praticien, rangés avant d'être montrés (même fichier dans nature/, aurora-nuit/ et immersion/).
// 1. Les doublons disparaissent : un paragraphe repris dans un autre, puis une phrase déjà dite ailleurs
//    (dans l'accroche, la conviction ou un paragraphe précédent).
// 2. La phrase d'ouverture est CHOISIE : celle qui dit le mieux qui il ou elle est (« Mon approche est
//    douce… », « Pour moi c'est plus qu'un métier… »), jamais une phrase de prix, de durée, d'organisation,
//    ni une phrase qui commence par un liant (« Cependant, », « Après… », « En fin de séance… »).
// 3. Une phrase générique fabriquée (« Séance d'hypnose, sur rendez-vous. ») ne compte pas : la page montre
//    alors l'emplacement qui dit ce qui viendra.
// Rien n'est inventé ni réécrit : on choisit, on range, on rétablit une majuscule en début de phrase.

export const cle = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

// Majuscule rétablie en début de phrase (« … art thérapie. quelles sont… »), espaces propres.
export const propre = (s) => String(s ?? '').replace(/\s+/g, ' ').trim()
  .replace(/([.!?…]\s+)([a-zà-öø-ÿ])/g, (m, a, b) => a + b.toUpperCase()).replace(/^[a-zà-öø-ÿ]/, (c) => c.toUpperCase());

// Découpe en phrases (un point, puis une majuscule ou un guillemet).
export const phrasesDe = (p) => propre(p).split(/(?<=[.!?…])\s+(?=[A-ZÀ-ÖØ-Þ«"])/u).map((x) => x.trim()).filter(Boolean);

// Prix, durée, organisation pratique : leur place est avec les tarifs ou la séance, pas en ouverture.
export const PRIX = /(\bprix\b|\btarif|€|\beuros?\b)/i;
export const PRATIQUE = /(\bprix\b|\btarif|€|\beuros?\b|\bdur[ée]e?s?\b|\bdure\b|\d\s?h\b|\d\s?heures?\b|domicile|je me d[ée]place|table de massage|habill[ée]|en visio|[àa] distance|en entreprise|je vous explique|le d[ée]roul[ée]|r[ée]ponds? [àa] vos questions)/i;
// Débuts de phrase qui renvoient à une phrase précédente : la phrase ne tient pas seule.
const LIANT = /^(pour cela|pour ce faire|c\S+est pourquoi|ainsi|de plus|par ailleurs|en effet|ensuite|puis|enfin|cependant|toutefois|pourtant|mais|donc|alors|[ée]galement|aussi|apr[èe]s|en fin de|[àa] la fin|au d[ée]but|lors de|d\S+abord|tout d\S+abord|de ce fait|c\S+est pourquoi|ce moment|cette s[ée]ance|celle-ci|celui-ci)\b/i;
// Liants qu'on peut retirer proprement : la phrase garde son sens.
const LIANT_RETIRABLE = /^(?:(?:pour cela|pour ce faire|c\S+est pourquoi|ainsi|de plus|par ailleurs|en effet|de ce fait),?|(?:ensuite|enfin|puis),)\s+/i;
// Ce qui dit une personne, une conviction, une façon d'être.
const PORTEUR = /(mon approche|ma pratique|ma d[ée]marche|je crois|pour moi|mon souhait|ma conviction|ma mission|une mission|chaque (s[ée]ance|personne|accompagnement|[êe]tre)|c\S+est (une|un) |invitation|voyage int[ée]rieur)/i;
// Une précaution (« ne se substitue pas à un avis médical ») ou une phrase qui renvoie ailleurs (« également ») n'ouvre pas.
const SECONDAIRE = /(substitu|ne remplace|avis m[ée]dical|professionnels? de sant[ée]|\b[ée]galement\b)/i;
// Phrase générique fabriquée quand la fiche ne disait rien.
const GENERIQUE = /^(s[ée]ances?|consultations?|massages?)\b[^.]{0,60},? sur rendez-vous\.?$/i;

export const sansLiant = (p) => propre(String(p).replace(LIANT_RETIRABLE, ''));

function note(p, conviction) {
  const t = propre(p), n = t.length;
  let s = 0;
  if (GENERIQUE.test(t)) return -99;
  if (PRATIQUE.test(t)) s -= 4;
  if (LIANT_RETIRABLE.test(t)) s -= 1; else if (LIANT.test(t)) s -= 3;
  if (PORTEUR.test(t)) s += 3;
  if (SECONDAIRE.test(t)) s -= 2;
  if (n >= 45 && n <= 240) s += 1;
  if (n > 320) s -= 2;
  if (n < 30) s -= 3;
  if (conviction) s += 3;
  return s;
}

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

// L'approche rangée : [phrase d'ouverture, autres paragraphes, phrases de prix ou de durée mises de côté].
// options.conviction : la conviction peut ouvrir (elle a un bonus) ; sinon elle reste dans les paragraphes.
// options.ecarter : regex des phrases à sortir de l'approche (par défaut, rien).
export function rangerApproche(d, { avecConviction = true, ecarter = null, deja = [] } = {}) {
  const conv = propre(d.conviction || '');
  let paras = sansRedites((d.approche || []).filter(Boolean), [d.accroche, avecConviction ? '' : conv, ...deja]).filter((p) => !GENERIQUE.test(p));
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
