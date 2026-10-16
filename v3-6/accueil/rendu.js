// Page d'arrivée (troisième tour) : de la fiche du praticien et de la recommandation au HTML.
// Module partagé : node (batir.mjs) écrit la page lisible sans JavaScript, le navigateur (accueil.js) la redessine
// pour n'importe quelle fiche (?p=<dossier>). Aucune API du DOM ici.
//
// La page tient en trois temps :
//   1. la scène : « Bonjour <prénom> », ce qu'on a lu d'elle, ses univers (3, un 4e derrière « une autre piste »)
//      et SON site, vivant dans un écran d'ordinateur ou de téléphone, avec une petite barre de réglage
//      (lumière du jour ou du soir, nuancier, appareil, ouvrir le site) ;
//   2. la fin : tout se personnalise, on part d'un univers ou de zéro, le domaine est à son nom ;
//   3. le contact et le pied de page.

import { feminiser, villePropre, salutation } from '../commun/prenoms.js';
import { TEINTES, lienUnivers, normaliser, choisirPalette } from '../commun/recommandation.js';
import { pratique } from '../commun/pratiques.js';

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
// typographie française : apostrophe courbe, espace insécable avant « ; : ! ? » » et après « « »
const apos = (s) => String(s ?? '').replace(/'/g, '’');
export const typo = (html) => html.replace(/>([^<]+)</g, (m, t) => `>${t.replace(/'/g, '’').replace(/&#39;/g, '’').replace(/ ([;:!?»])/g, '&nbsp;$1').replace(/« /g, '«&nbsp;')}<`);
export const fr = (s) => esc(apos(s)).replace(/ ([:;!?»])/g, '&nbsp;$1').replace(/« /g, '«&nbsp;');

/** Le contact de Mathéo (le même que sur le site Kazura). */
export const CONTACT = { prenom: 'Mathéo' };

/** Taille de la fenêtre simulée dans chaque appareil (le site s'y affiche exactement comme en vrai). */
export const APPAREILS = { ordi: { l: 1280, h: 800, nom: 'Ordinateur' }, tel: { l: 390, h: 844, nom: 'Téléphone' } };

// ---------------------------------------------------------------------------------------------------------
// Couleurs et contraste

const hex = (h) => { const m = String(h).replace('#', ''); return [0, 2, 4].map((i) => parseInt(m.slice(i, i + 2), 16)); };
const versHex = (c) => '#' + c.map((x) => Math.round(Math.max(0, Math.min(255, x))).toString(16).padStart(2, '0')).join('');
const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
export const luminance = (h) => { const [r, g, b] = hex(h); return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b); };
export const contraste = (a, b) => { const x = luminance(a), y = luminance(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
export const melanger = (a, b, t) => { const x = hex(a), y = hex(b); return versHex(x.map((v, i) => v + (y[i] - v) * t)); };
/** La couleur la plus proche de `c` qui tient `cible`:1 sur `fond` (en la rapprochant de `vers`). */
export function tenir(c, fond, vers, cible = 4.5) {
  for (let t = 0; t <= 1.0001; t += 0.05) { const m = melanger(c, vers, t); if (contraste(m, fond) >= cible) return m; }
  return vers;
}
const valide = (c) => /^#[0-9a-f]{6}$/i.test(String(c || ''));

/**
 * L'ambiance de la scène pour une palette : la page prend la lumière du site qu'on regarde.
 * Palette du soir : la scène est son fond, un peu plus profond. Palette du jour : son fond, à peine plus soutenu
 * (le site se détache de la scène). Textes et accents tenus à 4,5:1 sur le fond réel.
 */
export function ambiance(p) {
  const c = p.couleurs;
  const fondP = valide(c.fond) ? c.fond : '#f3eee6', encreP = valide(c.encre) ? c.encre : '#1b1814';
  const accentP = valide(c.accent) ? c.accent : encreP, accent2P = valide(c.accent2) ? c.accent2 : accentP;
  const sombre = luminance(fondP) < luminance(encreP);
  let fond;
  if (sombre) { fond = melanger(fondP, '#000000', 0.25); }
  else {
    fond = melanger(fondP, encreP, 0.07);
    // un fond très saturé (Pop) reste franc, mais jamais criard sous le texte
    if (contraste(encreP, fond) < 4.5) fond = melanger(fondP, luminance(encreP) > 0.5 ? '#000000' : '#ffffff', 0.18);
  }
  const encre = tenir(encreP, fond, sombre || luminance(encreP) > 0.5 ? '#ffffff' : '#000000', 7);
  // 5,4:1 sur le fond uni : il reste au-dessus de 4,5:1 sous la lumière douce de la scène
  const doux = tenir(melanger(encre, fond, 0.3), fond, encre, 5.4);
  const accent = tenir(accentP, fond, encre, 4.5);
  // l'inverse, pour la fin de page : on change de lumière
  const fondFin = sombre ? melanger(encreP, fondP, 0.04) : melanger(encreP, '#000000', 0.12);
  const encreFin = tenir(fondP, fondFin, sombre ? '#000000' : '#ffffff', 7);
  return {
    fond, encre, doux, accent, lueur: accentP, lueur2: accent2P, sombre,
    fin: { fond: fondFin, encre: encreFin, doux: tenir(melanger(encreFin, fondFin, 0.3), fondFin, encreFin, 5.4), accent: tenir(accentP, fondFin, encreFin, 4.5) },
  };
}

/** Variables CSS de la scène (posées sur <body>, elles glissent d'une palette à l'autre). */
export function variablesScene(p) {
  const a = ambiance(p);
  return { '--s-fond': a.fond, '--s-encre': a.encre, '--s-doux': a.doux, '--s-accent': a.accent, '--s-lueur': a.lueur, '--s-lueur2': a.lueur2,
    '--f-fond': a.fin.fond, '--f-encre': a.fin.encre, '--f-doux': a.fin.doux, '--f-accent': a.fin.accent,
    '--e-fond': p.couleurs.fond, '--e-accent': tenir(valide(p.couleurs.accent) ? p.couleurs.accent : a.encre, p.couleurs.fond, valide(p.couleurs.encre) ? p.couleurs.encre : a.encre, 3) };
}
const enStyle = (v) => Object.entries(v).map(([k, x]) => `${k}:${x}`).join(';');

// ---------------------------------------------------------------------------------------------------------
// Ce qu'on a lu d'elle : une phrase citée, et ce que son site reprend.

const SANTE = /\b(maux|troubles?|souffrances?|sante|guerir|guerison|soigner|traitements?|symptomes?|maladies?|douleurs?|diagnostic|therapeutique|medic|recuperation|vitalite)/;
const PRIX = /€|\beuros?\b|\btarifs?\b|\bprix\b|\bpaiement\b|\brembours/;
const DUREE = /\b(heures?|minutes?|\d+\s*h\b|duree|dure\b)/;
const BEAUX = /\b(douceur|voyage|interieur|confiance|bienveillan|ecoute|ressource|chemin|epanoui|sourire|rayonn|mission|passion|creativ|harmoni|apais|serenit|equilibre|nature|prendre soin|potentiel|liberte|libre|aventure|merveill|reconnect|vibration|transformation|cheminement|respect|famille|parents|bebe|confort|chaleureu|lumiere|corps|esprit|valeurs)/g;
const LIAISONS = /^(pour cela|ensuite|cependant|de ce fait|donc|ainsi|enfin|par ailleurs|alors|puis|et|mais|aussi|egalement)\s*,?\s+/i;

function decouper(champ, texte) {
  const phrases = String(texte || '').replace(/\s+/g, ' ').trim().split(/(?<=[.!?…])\s+(?=[«"“A-ZÀ-ÖØ-Þ])/);
  const out = [];
  for (let p of phrases) {
    p = p.trim();
    if (!p) continue;
    out.push({ champ, texte: p });
    if (p.length > 200) {
      const m = p.match(/,\s+((?:j'|j’|je |nous |mon |ma |mes )[^,]{50,170}[.!?…]?)$/i);
      if (m) out.push({ champ, texte: '… ' + m[1], coupe: true });
    }
  }
  return out;
}

/**
 * La phrase à citer : courte (35 à 190 signes), à la première personne de préférence, jamais un prix, une durée
 * ni une promesse de santé. `prioritaires` : les mots des raisons (le premier pèse le plus).
 * @returns {{ texte: string, champ: string, mot: string|null } | null}
 */
export function phraseCitee(d, prioritaires = []) {
  const candidates = [];
  if (d?.accrocheSienne !== false) candidates.push(...decouper('accroche', d?.accroche));
  candidates.push(...decouper('conviction', d?.conviction));
  for (const s of d?.approche || []) candidates.push(...decouper('approche', s));
  for (const s of d?.apropos || []) candidates.push(...decouper('apropos', s));
  const nomNorm = normaliser(d?.nom || '');
  let meilleure = null;
  const vus = new Set();
  for (const c of candidates) {
    let t = c.texte.replace(/^["“«]\s*|\s*["”»]$/g, '');
    const n0 = normaliser(t);
    if (vus.has(n0)) continue;
    vus.add(n0);
    if (/^ici,/.test(n0) || PRIX.test(n0) || /\w\.\w/.test(t.replace(/\b\w\.\w\.?/g, '')) || /\?$/.test(t)) continue;
    let note = 0;
    const liaison = t.match(LIAISONS);
    if (liaison) { t = t.slice(liaison[0].length).replace(/^\p{Ll}/u, (x) => x.toUpperCase()); note -= 0.5; }
    const n = normaliser(t), L = t.length;
    if (L < 35 || L > 190) continue;
    note += L >= 50 && L <= 140 ? 2 : 1;
    if (/\b(je|j'|mon|ma|mes|moi|nous|notre)\b/.test(n) || /^(je|j')/.test(n)) note += 1.5;
    if (/\b(vous|votre|vos)\b/.test(n)) note += 0.6;
    note += Math.min(2, (n.match(BEAUX) || []).length * 0.5);
    note += { conviction: 1.2, accroche: 0.6, apropos: 0.3, approche: 0 }[c.champ] || 0;
    if (/\d/.test(t)) note -= 4;
    if (DUREE.test(n)) note -= 3;
    if (SANTE.test(n)) note -= 2.5;
    if (/sur rendez-vous|^seance d/.test(n) && L < 80) note -= 3;
    if (/\.\.\.$|…$|\betc\b/.test(t)) note -= 1;
    if (nomNorm && n.includes(nomNorm)) note -= 2;
    if (/^bienvenue/.test(n)) note -= 1;
    if (/\(e\)|\(s\)/.test(t)) note -= 0.8;
    if (c.coupe) note -= 0.6;
    let mot = null;
    prioritaires.forEach((m, i) => { if (!mot && m && n.includes(normaliser(m))) { mot = m; note += i === 0 ? 1.5 : 1; } });
    t = t.replace(/\s*\.\.\.$/, '…').replace(/(\p{L}{4,}e)et (?=\p{L})/gu, '$1 et '); // « l’équilibreet la détente » (faute de frappe)
    if (!/[.!?…]$/.test(t)) t += '.';
    if (!meilleure || note > meilleure.note) meilleure = { texte: t, champ: c.champ, mot, note };
  }
  return meilleure && meilleure.note >= 2 ? meilleure : null;
}

/** Ce que son site reprend de sa fiche, sans rien inventer : « vos mots, vos tarifs, votre numéro ». */
export function repris(d) {
  const vrai = (s) => { const t = String(s ?? '').trim(); return t && !/^ici,/i.test(t); };
  const out = [];
  const mots = (d?.accrocheSienne !== false && vrai(d?.accroche)) || vrai(d?.conviction) || (d?.approche || []).some(vrai) || (d?.apropos || []).some(vrai);
  if (mots) out.push('vos mots');
  if ((d?.tarifs || []).some((t) => vrai(t?.prix) || vrai(t?.nom))) out.push('vos tarifs');
  if (vrai(d?.tel)) out.push('votre numéro');
  if (vrai(d?.resalib)) out.push('votre lien de réservation');
  else if (vrai(d?.ville)) out.push('votre ville');
  return out;
}
const enListe = (xs) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} et ${xs[xs.length - 1]}`);

// ---------------------------------------------------------------------------------------------------------
// Les univers : une promesse courte, vraie pour tout praticien à qui on le propose.

export const COURTES = {
  nature: 'une prairie qui pousse et s’écarte sous la main',
  'aurora-nuit': 'une nuit d’aurores où votre nom s’écrit en étoiles',
  cinema: 'votre cabinet raconté comme un film',
  editorial: 'votre nom en couverture d’un magazine',
  'liquid-glass': 'du verre clair posé sur de grandes photos',
  'pop-vitamine': 'deux couleurs franches, votre nom en géant',
  immersion: 'un monde de verre et de brume que l’on traverse',
  meridiens: 'une carte du corps tracée au fil d’or',
  cocon: 'un carnet de naissance tout en douceur',
  institut: 'une maison de soin comme les grandes marques',
  resonance: 'le son et la couleur rendus visibles',
};
export const courte = (u, d) => {
  // Résonance : le son pour la sonothérapie, les pigments pour l'art-thérapie (comme le site lui-même)
  if (u.id === 'resonance') return d && pratique(d).id === 'art' ? 'des pigments qui fleurissent' : 'le son rendu visible';
  return u.courte || COURTES[u.id] || String(u.promesse || u.nom).split(/[:.,]/)[0].replace(/^\p{Lu}/u, (c) => c.toLowerCase());
};
/** Le style de chaque proposition, en mots simples (jamais le nom technique de l'univers). */
const STYLES = {
  nature: 'Lumineux et naturel', 'aurora-nuit': 'Nuit étoilée', immersion: 'Profond et apaisant',
  cinema: 'Chic et feutré', editorial: 'Élégant, comme un magazine', 'liquid-glass': 'Moderne et lumineux',
  'pop-vitamine': 'Vif et coloré', meridiens: 'Raffiné, encre et or', cocon: 'Doux et tendre',
  institut: 'Luxe et délicatesse', resonance: 'Sobre et vibrant', fluide: 'Clair et fluide',
};
export const libelle = (l, d) => (l.univers.id === 'resonance' && d && pratique(d).id === 'art') ? 'Créatif et coloré' : (STYLES[l.univers.id] || 'Votre site');
/** Gardé pour compatibilité : la page n'affiche plus de « raison ». */
export const raisonCourte = (l, d) => libelle(l, d);

export function policeTitre(u) {
  const t = u?.polices?.titre;
  if (!t || /syst/i.test(t)) return `-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI Variable Display', 'Segoe UI', Roboto, sans-serif`;
  return `'${t.replace(/'/g, '')}', Georgia, serif`;
}

// ---------------------------------------------------------------------------------------------------------
// Palette et goûts : ce qu'on voit est exactement ce qu'on obtient en ouvrant le site.

/** Les teintes du nuancier, dans l'ordre du cercle chromatique. */
export const ORDRE_TEINTES = ['vert', 'bleu', 'violet', 'rose', 'rouge', 'orange', 'jaune', 'or', 'terre', 'neutre-clair', 'neutre-sombre'];
const EN = { vert: 'en vert', bleu: 'en bleu', violet: 'en violet', rose: 'en rose', rouge: 'en rouge', orange: 'en orange', jaune: 'en jaune', or: 'en or', terre: 'en tons de terre', 'neutre-clair': 'en tons clairs', 'neutre-sombre': 'en tons sombres' };

/**
 * La palette d'un univers pour ces goûts, et la phrase honnête qui l'accompagne.
 * @param {object} l  ligne de recommandation ; @param {object[]} proposes  les univers montrés ; @param {{teinte?, ton?}} g
 */
export function paletteDe(l, famille, g = {}, proposes = []) {
  const u = l.univers;
  if (!g.teinte && !g.ton) return { palette: l.palette, accord: 'libre', note: '', autre: null };
  const c = choisirPalette(u, famille, g);
  const p = c.palette;
  let note = '', autre = null;
  if (g.teinte && c.accord !== 'exact') {
    const ailleurs = proposes.find((x) => x.univers.id !== u.id && x.univers.palettes.some((q) => q.teinte === g.teinte && (!g.ton || q.ton === g.ton)))
      || proposes.find((x) => x.univers.id !== u.id && x.univers.palettes.some((q) => q.teinte === g.teinte));
    note = `Cette proposition n’existe pas encore ${EN[g.teinte]} : voici la teinte la plus proche, ${p.nom}.`;
    note += ` On peut la créer ${EN[g.teinte]} pour vous.`;
  } else if (g.ton && !c.bonTon) {
    const lumiere = g.ton === 'sombre' ? 'du soir' : 'du jour';
    note = `Cette proposition n’a pas encore de version ${lumiere}${g.teinte ? ` ${EN[g.teinte]}` : ''} : voici ${p.nom}, la plus proche.`;
    const ailleurs = proposes.find((x) => x.univers.id !== u.id && x.univers.palettes.some((q) => q.ton === g.ton && (!g.teinte || q.teinte === g.teinte)));
  }
  return { palette: p, accord: c.accord, note, autre };
}

// ---------------------------------------------------------------------------------------------------------
// Vue : tout ce que la page affiche, calculé une fois.

const saison = (date) => { const m = date.getMonth(); return `${['Hiver', 'Hiver', 'Printemps', 'Printemps', 'Printemps', 'Été', 'Été', 'Été', 'Automne', 'Automne', 'Automne', 'Hiver'][m]} ${date.getFullYear()}`; };

export function preparer(d, reco, { date = new Date(), demo = null, actif = null } = {}) {
  const salut = salutation(d);
  const a = salut.analyse;
  const metier = feminiser(String(d.metier || '').trim(), a.genre);
  const ville = villePropre(d.ville);
  const proposes = reco.proposes?.length ? reco.proposes : reco.classement.slice(0, 3);
  const prioritaires = proposes.map((l) => (l.raison.type === 'mots' ? l.raison.mot : null));
  const citation = phraseCitee(d, prioritaires);
  const i = Math.max(0, proposes.findIndex((l) => l.univers.id === actif));
  return {
    d, dossier: d.dossier, salut, analyse: a, metier, ville,
    identite: [metier, ville].filter(Boolean).join(' à '),
    citation, repris: repris(d), reco, proposes, top: proposes.slice(0, 3), actif: i,
    voile: proposes[0].palette.couleurs,
    saison: saison(date), demo,
    nomPoster: a.nomAffiche || d.nom,
  };
}

/** Lien du site (celui qu'on ouvre) et de son aperçu (le même, en mode vitrine). */
export const lienSite = (vue, l, palette) => lienUnivers(l.univers.id, vue.dossier, (palette || l.palette).id);
export const lienApercu = (vue, l, palette) => `${lienSite(vue, l, palette)}&apercu=1`;

// ---------------------------------------------------------------------------------------------------------
// Morceaux

const FLECHE = '<svg class="fleche" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17L17 7M9 7h8v8"/></svg>';
const ALLER = '<svg class="fleche" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6"/></svg>';
const SOLEIL = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M5.3 5.3l1.7 1.7M17 17l1.7 1.7M5.3 18.7L7 17M17 7l1.7-1.7"/></svg>';
const LUNE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.6A8.5 8.5 0 0 1 9.4 4a8.5 8.5 0 1 0 10.6 10.6z"/></svg>';
const ORDI = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="11" rx="1.6"/><path d="M1.5 19h21"/></svg>';
const TEL = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="2.5" width="10" height="19" rx="2.4"/><path d="M10.5 5h3"/></svg>';
const APPEL = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 3.5l2.6 3.2-1.6 2.4a12 12 0 0 0 7.3 7.3l2.4-1.6 3.2 2.6-1.4 3a3 3 0 0 1-3.1 1.6C9.7 21 3 14.3 2 7.9a3 3 0 0 1 1.6-3.1z"/></svg>';

const nuance = (p) => `<span class="nuance" aria-hidden="true">${['fond', 'accent', 'accent2', 'encre'].filter((k) => valide(p.couleurs[k])).map((k) => `<i style="background:${esc(p.couleurs[k])}"></i>`).join('')}</span>`;

/** Un onglet d'univers : son nom dans sa police, sa raison en une phrase tirée de ses mots. */
export function rendreOnglet(l, i, vue) {
  const u = l.univers;
  const actif = i === vue.actif;
  return `<li class="onglet"><a role="tab" id="o-${esc(u.id)}" aria-selected="${actif}" aria-controls="vitrine" data-i="${i}" data-id="${esc(u.id)}" href="${esc(lienSite(vue, l))}">
      <span class="o-num">Proposition ${i + 1}</span>
      <span class="o-nom" style="font-family:${esc(policeTitre(u))}">${esc(libelle(l, vue.d))}</span>
      <span class="o-voir" aria-hidden="true">${actif ? "À l’écran" : "Voir"}</span>
    </a></li>`;
}

function rendreNuancier(g) {
  return ORDRE_TEINTES.map((t) => {
    const T = TEINTES[t];
    return `<button class="pastille" type="button" data-teinte="${t}" aria-pressed="${g.teinte === t}" title="${esc(T.nom)}" style="--c1:${T.echantillon[0]};--c2:${T.echantillon[1]}"><span class="vh">${esc(T.nom)}</span></button>`;
  }).join('');
}

// ---------------------------------------------------------------------------------------------------------
// La page

export function rendreCorps(vue, { gouts = {}, mode = 'ordi' } = {}) {
  const { salut, d } = vue;
  const l = vue.proposes[vue.actif];
  const choix = paletteDe(l, vue.reco.famille, gouts, vue.proposes);
  const lettres = (t) => [...t].map((c, i) => (c === ' ' ? ' ' : `<span class="l" style="--i:${i}">${esc(c)}</span>`)).join('');
  const h1 = salut.avecPrenom
    ? `<h1 class="salut" id="salut" aria-label="${esc(`Bonjour ${salut.nom},`)}" style="--long:${Math.max(7, salut.nom.length + 1)}"><span class="salut-ligne salut-mot" aria-hidden="true">${lettres('Bonjour')}</span> <span class="salut-ligne salut-nom" aria-hidden="true">${lettres(salut.nom + ',')}</span></h1>`
    : `<h1 class="salut sans-prenom" id="salut" aria-label="${esc(`Bonjour, ${salut.nom}`)}"><span class="salut-ligne salut-mot" aria-hidden="true">${lettres('Bonjour,')}</span> <span class="salut-ligne salut-enseigne" aria-hidden="true">${esc(salut.nom)}</span></h1>`;

  const cit = vue.citation;
  const citation = cit
    ? `<figure class="cite"><blockquote><p>«&nbsp;${fr(cit.texte)}&nbsp;»</p></blockquote><figcaption>Vos mots, sur votre présentation en ligne.</figcaption></figure>`
    : '';
  const r = vue.repris;
  const lu = r.length
    ? `On a lu votre présentation. Voici votre site, déjà rempli avec <strong>${esc(enListe(r))}</strong>. Rien d’inventé.`
    : 'On a lu votre présentation. Voici votre site : il attend vos mots, rien n’y est inventé.';
  const nb = Math.min(3, vue.proposes.length);
  const titreChoix = nb > 1 ? `Cliquez pour voir les ${nb === 3 ? 'trois' : 'deux'} propositions&nbsp;:` : 'Votre site';
  const quatre = vue.proposes.length > 3;
  const site = lienSite(vue, l, choix.palette);
  const demo = vue.demo ? `<label class="demo">Voir pour <select id="choix-demo">${vue.demo.map((x) => `<option value="${esc(x.dossier)}"${x.dossier === vue.dossier ? ' selected' : ''}>${esc(x.nom)}</option>`).join('')}</select></label>` : '';
  const A = APPAREILS[mode] || APPAREILS.ordi;

  return typo(`
<div class="scene" id="scene">
  <header class="tete">
    <span class="kazura">Kazura</span>
    <span class="prive">Aperçu privé${salut.avecPrenom ? `, préparé pour ${esc(salut.nom)}` : ''}</span>
  </header>

  <div class="scene-grille">
    ${h1}

    <div class="lu apres">
      <p class="lu-texte">J’ai imaginé des maquettes pour votre site, avec vos propres mots. Les voici&nbsp;: faites-les défiler, choisissez celle qui vous ressemble, et dites-moi ce que vous en pensez.</p>
      <p class="signe">Mathéo</p>
    </div>

    <nav class="choix apres" aria-label="Vos univers">
      <p class="choix-titre">${titreChoix}</p>
      <ol class="onglets" role="tablist">${vue.proposes.slice(0, 3).map((x, i) => rendreOnglet(x, i, vue)).join('')}</ol>
    </nav>

    <section class="vitrine apres" id="vitrine" role="tabpanel" aria-labelledby="o-${esc(l.univers.id)}" aria-label="Votre site, en direct">
      <div class="appareil" id="appareil" data-mode="${esc(mode)}" style="--vl:${A.l};--vh:${A.h}">
        <div class="ecran" id="ecran">
          <div class="ecran-vue" id="ecran-vue"><iframe id="apercu" title="Votre site, en direct" allow="autoplay 'none'; camera 'none'; microphone 'none'; geolocation 'none'" referrerpolicy="same-origin" tabindex="0"></iframe>
          <a class="ecran-voile" id="ecran-voile" href="${esc(site)}" style="--pt:${esc(policeTitre(l.univers))}">
            <span class="ev-nom">${esc(vue.nomPoster)}</span>
            <span class="ev-sous">Votre site arrive…</span>
          </a></div>
        </div>
        <div class="socle" aria-hidden="true"></div>
      </div>

      <div class="reglages" role="group" aria-label="Régler l’aperçu">
        <span class="reglages-titre">Changez la couleur de votre site&nbsp;:</span>
        <div class="nuancier" role="group" aria-label="Couleur">${rendreNuancier(gouts)}</div>
      </div>
      <div class="pied-vitrine">
        <p class="note" id="note" aria-live="polite">${nuance(choix.palette)}<span class="note-texte">${fr(choix.note)}</span>${choix.autre ? ` <button class="autre" type="button" data-aller="${esc(choix.autre.id)}">${fr(choix.autre.texte)} ${ALLER}</button>` : ''}</p>
        <a class="ouvrir" id="ouvrir" href="${esc(site)}">Voir mon site en grand ${FLECHE}</a>
      </div>
    </section>
  </div>
</div>

<main class="fin" id="fin">
  <h2 class="fin-titre">Tout se personnalise, <em>à 100&nbsp;%.</em></h2>
  <div class="fin-texte">
    <p>On part de la version qui vous plaît, ou d’une page blanche, et on ajuste ensemble chaque détail&nbsp;: vos textes, vos photos, vos couleurs.</p>
    <p>Le nom de domaine est à votre nom. Le site vous appartient&nbsp;: vous gardez tout.</p>
  </div>
  <div class="rever">
    <p class="rever-titre">Osez rêver.</p>
    <p class="rever-texte">Un site fait sur mesure coûte souvent plusieurs milliers d’euros. Ici, le site de vos rêves reste à la portée de tous&nbsp;: payable jusqu’en 10 fois, sans frais.</p>
  </div>
  <div class="contact">
    <p class="contact-titre">Envie d’en parler ?</p>
    <p>Répondez simplement au message qui vous a conduit ici : ${CONTACT.prenom} vous répond lui-même.</p>
  </div>
</main>

<footer class="pied">
  <p>Aperçu préparé pour ${esc(d.nom)}. Textes, photos, couleurs : tout se modifie selon vos goûts.</p>
  <p class="signature"><span class="kazura">Kazura</span><span>Aperçu privé, non référencé</span>${demo}</p>
</footer>`);
}

/** Les feuilles de police des univers montrés, réduites aux lettres de leur nom (paramètre text= de Google Fonts). */
export function policesUnivers(vue) {
  const vus = new Set();
  // Deux univers partagent parfois une police (Cormorant Garamond : Cinéma et Immersion) et chaque feuille réduite
  // la déclare sans unicode-range : la dernière arrivée sert tout. Toutes reçoivent donc les mêmes lettres.
  const tout = `${vue.reco.classement.map((l) => l.univers.nom).join('')}Ouvrir votre site àâéèêëîïôöûüçœÉÈÀ’'`;
  const lettres = [...new Set([...(tout + tout.toUpperCase() + tout.toLowerCase())].filter((c) => c.trim()))].join('');
  return vue.proposes.map((l) => l.univers).filter((u) => u.polices?.css && /^https:\/\/fonts\.googleapis\.com\/css2\?/.test(u.polices.css)).map((u) => {
    const titre = String(u.polices.titre || '').replace(/\s+/g, '+');
    const familles = (u.polices.css.match(/family=[^&]+/g) || []).filter((f) => titre && f.startsWith(`family=${titre}:`) || f === `family=${titre}`);
    if (!familles.length) return null;
    const url = `https://fonts.googleapis.com/css2?${familles.join('&')}&display=swap&text=${encodeURIComponent(lettres)}`;
    if (vus.has(url)) return null;
    vus.add(url);
    return { id: u.id, url };
  }).filter(Boolean);
}

/** Variables posées sur <body> : la scène (palette de l'univers montré) et le voile d'ouverture. */
export const stylesCorps = (vue, palette) => {
  const v = vue.voile;
  return `${enStyle(variablesScene(palette || vue.proposes[vue.actif].palette))};--v-fond:${v.fond};--v-a:${v.accent};--v-b:${v.accent2 || v.accent};--v-encre:${v.encre}`;
};

/** Le document complet (batir.mjs) : la fiche et le catalogue sont embarqués pour un premier rendu immédiat. */
export function rendreDocument(vue, { base = '', catalogue = [] } = {}) {
  const { salut, d } = vue;
  const titre = salut.avecPrenom ? `Bonjour ${salut.nom}` : `Bonjour, ${salut.nom}`;
  const v = vue.voile;
  const polices = policesUnivers(vue).map((p) => `<link rel="stylesheet" href="${esc(p.url)}" media="print" onload="this.media='all'"><noscript><link rel="stylesheet" href="${esc(p.url)}"></noscript>`).join('');
  const donnees = JSON.stringify({ dossier: vue.dossier, fiche: d, catalogue }).replace(/</g, '\\u003c');
  return `<!doctype html>
<html lang="fr" class="sans-js">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<title>${esc(titre)}</title>
<meta name="description" content="${esc(`Aperçu privé préparé pour ${d.nom} : votre futur site, en direct.`)}">
<meta name="theme-color" content="${esc(v.fond)}">
<script>
// Avant tout affichage : JavaScript présent, et l'ouverture « Bonjour » sauf si on la refuse (?sansouverture).
(function () {
  var h = document.documentElement; h.className = 'js';
  if (!/[?&]sansouverture/.test(location.search)) { h.classList.add('ouverture'); h.classList.add('voile-actif'); }
  try { if (localStorage.getItem('kazura-accueil-vu')) h.classList.add('revisite'); } catch (e) {}
  var p = /[?&]p=([a-z0-9-]+)/.exec(location.search); if (p && p[1] !== '${esc(vue.dossier)}') h.classList.add('autre-fiche');
})();
</script>
<link rel="preload" href="${base}accueil/polices/newsreader-normal-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="${base}accueil/polices/newsreader-italic-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
${polices}
<link rel="stylesheet" href="${base}accueil/accueil.css">
</head>
<body style="${esc(stylesCorps(vue))}">
<div class="voile" id="voile" aria-hidden="true"><canvas id="voile-toile"></canvas><p class="voile-ligne" id="voile-ligne"></p><p class="voile-passer">Touchez l’écran pour découvrir votre site</p></div>
<div id="page">${rendreCorps(vue)}</div>
<script type="application/json" id="donnees">${donnees}</script>
<script type="module" src="${base}accueil/accueil.js"></script>
</body>
</html>
`;
}
