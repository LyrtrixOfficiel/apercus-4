// Page d'arrivée (quatrième tour, BRIEF-4) : de la fiche du praticien et de la recommandation au HTML.
// Module partagé : node (batir.mjs) écrit la page lisible sans JavaScript, le navigateur (accueil.js) la redessine
// pour n'importe quelle fiche (?p=<dossier>). Aucune API du DOM ici.
//
// Le prospect vit SON site, il ne compare pas un catalogue :
//   1. « Bonjour <prénom>, » puis une phrase de Mathéo, signée (sur le voile d'ouverture) ;
//   2. SON site en plein écran, comme un vrai site (une iframe `<univers>/?p=…&palette=…&apercu=1`) ;
//   3. une barre flottante, en mots : « Voir une autre idée » (deux au plus, chacune avec un titre tiré de SES mots,
//      jamais un nom de modèle), « Changer les couleurs » (jour ou soir, et les teintes de cette idée),
//      « Ça me plaît » (la fin : tout se personnalise, page blanche possible, domaine à son nom, « Oser rêver »,
//      répondre au message).
// Sans JavaScript, la même page se lit de haut en bas : la salutation, les idées en liens, la fin.

import { feminiser, villePropre, salutation } from '../commun/prenoms.js';
import { TEINTES, lienUnivers, normaliser } from '../commun/recommandation.js';
import { pratique } from '../commun/pratiques.js';

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
// typographie française : apostrophe courbe, espace insécable avant « ; : ! ? » » et après « « »
const apos = (s) => String(s ?? '').replace(/'/g, '’');
export const typo = (html) => html.replace(/>([^<]+)</g, (m, t) => `>${t.replace(/'/g, '’').replace(/&#39;/g, '’').replace(/ ([;:!?»])/g, '&nbsp;$1').replace(/« /g, '«&nbsp;')}<`);
export const fr = (s) => esc(apos(s)).replace(/ ([:;!?»])/g, '&nbsp;$1').replace(/« /g, '«&nbsp;');

/** Celui qui signe : Mathéo. Le contact, c'est « répondez au message » (jamais de numéro de téléphone). */
export const SIGNATAIRE = 'Mathéo';
/** La phrase de l'ouverture, à la première personne. */
export const PHRASE = 'J’ai imaginé votre site. Le voici.';

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
 * Les couleurs de la page pour une palette : le passage d'une idée à l'autre (sa couleur de fond, son accent)
 * et la fin, qui prend la lumière inverse du site. Textes et accents tenus à 4,5:1 sur le fond réel.
 */
export function ambiance(p) {
  const c = p.couleurs;
  const fondP = valide(c.fond) ? c.fond : '#f3eee6', encreP = valide(c.encre) ? c.encre : '#1b1814';
  const accentP = valide(c.accent) ? c.accent : encreP, accent2P = valide(c.accent2) ? c.accent2 : accentP;
  const sombre = luminance(fondP) < luminance(encreP);
  const encre = tenir(encreP, fondP, sombre || luminance(encreP) > 0.5 ? '#ffffff' : '#000000', 7);
  const accent = tenir(accentP, fondP, encre, 4.5);
  // la fin : le site est clair, elle est sombre (et l'inverse)
  const fondFin = sombre ? melanger(encreP, fondP, 0.04) : melanger(encreP, '#000000', 0.12);
  const encreFin = tenir(fondP, fondFin, sombre ? '#000000' : '#ffffff', 7);
  return {
    fond: fondP, encre, accent, lueur: accentP, lueur2: accent2P, sombre,
    fin: { fond: fondFin, encre: encreFin, doux: tenir(melanger(encreFin, fondFin, 0.3), fondFin, encreFin, 5.4), accent: tenir(accentP, fondFin, encreFin, 4.5), reve: tenir(accent2P, encreFin, fondFin, 4.5) },
  };
}

/** Variables CSS (posées sur <body>, elles glissent d'une palette à l'autre). */
export function variablesScene(p) {
  const a = ambiance(p);
  return { '--e-fond': a.fond, '--e-encre': a.encre, '--e-accent': a.accent, '--e-lueur': a.lueur, '--e-lueur2': a.lueur2,
    '--f-fond': a.fin.fond, '--f-encre': a.fin.encre, '--f-doux': a.fin.doux, '--f-accent': a.fin.accent, '--f-reve': a.fin.reve };
}
const enStyle = (v) => Object.entries(v).map(([k, x]) => `${k}:${x}`).join(';');

// ---------------------------------------------------------------------------------------------------------
// Le titre personnel de chaque idée, tiré de SES mots : « Les vibrations, en couleurs », « Le sommeil, sous les
// étoiles ». Jamais le nom technique de l'univers (Résonance, Immersion...), qui reste caché.

/** Ce que l'idée devient, en quelques mots qui se posent après les siens. */
const CADRES = {
  nature: 'en pleine nature',
  'aurora-nuit': 'sous les étoiles',
  cinema: 'comme au cinéma',
  editorial: 'à la une',
  'liquid-glass': 'tout en transparence',
  'pop-vitamine': 'en couleurs franches',
  cocon: 'tout en douceur',
  immersion: 'entre verre et brume',
  meridiens: 'au fil d’or',
  institut: 'en toute élégance',
  resonance: 'en ondes de couleur',
};
/** Ce qu'on voit, en une phrase courte (sous le titre, dans « Voir une autre idée »). Vraie pour tout praticien. */
export const COURTES = {
  nature: 'Une prairie qui pousse et s’écarte sous la main.',
  'aurora-nuit': 'Une nuit d’aurores où votre nom s’écrit en étoiles.',
  cinema: 'Votre cabinet raconté comme un film.',
  editorial: 'Votre nom en couverture d’un magazine.',
  'liquid-glass': 'Du verre clair posé sur de grandes photos.',
  'pop-vitamine': 'Deux couleurs franches, votre nom en géant.',
  immersion: 'Un monde de verre et de brume que l’on traverse.',
  meridiens: 'Une carte du corps tracée au fil d’or.',
  cocon: 'Un carnet de naissance, tout en douceur.',
  institut: 'Une maison de soin, comme les grandes marques.',
  resonance: 'Le son et la couleur rendus visibles.',
};
export const courte = (u, d) => {
  // Résonance : le son pour la sonothérapie, les pigments pour l'art-thérapie (comme le site lui-même)
  if (u.id === 'resonance' && d && pratique(d).id === 'art') return 'Des pigments qui fleurissent sous vos yeux.';
  return COURTES[u.id] || String(u.promesse || '').split(/[.]/)[0] + '.';
};

// Le genre d'un nom, quand elle ne l'a écrit précédé d'aucun article (« Vous parlez de sommeil »).
const MASCULINS = new Set('sommeil bonheur coeur cœur corps esprit equilibre bien-etre souffle calme silence voyage chemin temps moment toucher lacher-prise ressourcement apaisement son sons rythme regard plaisir confort sourire lien ancrage eveil instant mouvement espace cocon jardin soin massage etre partage present accueil cheminement epanouissement alignement enracinement recentrement potentiel lacher bain'.split(' '));
const FEMININS = new Set('douceur lumiere energie harmonie confiance detente serenite paix vibration nature pause presence ecoute chaleur liberte joie beaute conscience respiration relaxation transformation bienveillance creativite parentalite naissance maternite famille sante couleur musique voix danse terre eau mer foret saison fleur vie'.split(' '));
const voyelle = (s) => /^[aeiouyhâàéèêëîïôöûüœ]/i.test(s);
const majuscule = (s) => String(s).replace(/^\p{Ll}/u, (c) => c.toUpperCase());

/** Le groupe nominal de son mot, avec l'article juste : « Les vibrations », « Votre transformation personnelle ». */
export function groupe(r) {
  const mot = String(r?.mot || '').trim();
  if (!mot) return '';
  // un verbe se cite s'il porte son complément (« Relâcher les tensions ») ; un adjectif, seulement s'il le dit de
  // lui-même (« Dynamique ») ; un mot seul (« Relaxer », « Énergétique ») ne fait pas un titre
  if (r.forme === 'soi' || (r.forme === 'verbe' && /\s/.test(mot))) return majuscule(mot);
  if (r.forme && r.forme !== 'nom') return '';
  const det = r.det || '';
  const tete = normaliser(mot.split(/\s+/)[0]);
  const pluriel = r.pluriel || ['les', 'des', 'ses', 'ces', 'leurs', 'aux', 'mes', 'vos', 'nos', 'tes'].includes(det);
  if (['mon', 'ma', 'mes', 'votre', 'vos', 'notre', 'nos', 'ton', 'ta', 'tes'].includes(det)) return `${pluriel ? 'Vos' : 'Votre'} ${mot}`;
  if (pluriel) return `Les ${mot}`;
  if (voyelle(mot)) return `L’${mot}`;
  let feminin;
  if (['la', 'une', 'sa', 'cette'].includes(det)) feminin = true;
  else if (['le', 'un', 'du', 'au', 'ce', 'cet', 'son'].includes(det)) feminin = false;
  else feminin = FEMININS.has(tete) || (!MASCULINS.has(tete) && /(tion|sion|xion|te|ance|ence|ure|ude|ie|ee|ise|esse|ade|elle|ette|eur|ine|onne|aison|ique)$/.test(tete));
  return `${feminin ? 'La' : 'Le'} ${mot}`;
}

// À défaut de ses mots : sa discipline (« Le shiatsu », « L'hypnose »), sinon son cabinet.
const DISCIPLINES = { plantaire: 'La réflexologie', palmaire: 'La réflexologie', faciale: 'La réflexologie', auriculo: 'L’auriculothérapie', kinesio: 'La kinésiologie',
  energie: 'L’énergie', perinat: 'La naissance', esthetique: 'La beauté', massage: 'Le toucher', son: 'Le son', musique: 'La musique', danse: 'La danse', theatre: 'Le théâtre',
  art: 'La création', yoga: 'Le yoga', qigong: 'Le qi gong', hypnose: 'L’hypnose', sophro: 'La sophrologie', meditation: 'La méditation', psy: 'L’écoute', parent: 'La famille',
  fleurs: 'Les fleurs de Bach', naturo: 'La naturopathie', plantes: 'Les plantes', coach: 'Votre chemin', bebe: 'Les tout-petits' };
function discipline(d) {
  const p = pratique(d);
  if (p.id === 'meridiens') return /shiatsu/i.test(d?.metier || '') ? 'Le shiatsu' : 'L’énergie';
  return DISCIPLINES[p.id] || '';
}

/** Assemble un titre : { avant, mots, apres } (ses mots sont mis en valeur, le reste est le cadre de l'idée). */
function assembler(u, gn, d) {
  if (u.id === 'cocon' && /douceur/i.test(gn)) return { avant: 'Un carnet pour ',mots: gn.replace(/^(Les|La|Le|Votre|Vos|L’)(?=[\s’])/, (x) => x.toLowerCase()), apres: '' };
  let cadre = CADRES[u.id] || 'pour vous';
  if (u.id === 'resonance' && d && pratique(d).id === 'art') cadre = 'au bout du pinceau';
  if (u.id === 'nature' && /natur/i.test(normaliser(gn))) cadre = 'comme une prairie';
  return { avant: '', mots: gn, apres: `, ${cadre}` };
}

/**
 * Le titre personnel de chaque idée proposée, sans répéter un groupe de mots.
 * @returns {{ avant: string, mots: string, apres: string, texte: string, siens: boolean }[]}
 */
export function titresIdees(proposes, d) {
  const vus = new Set();
  const replis = [discipline(d), 'Votre cabinet', 'Votre nom', 'Votre métier'].filter(Boolean);
  return proposes.map((l) => {
    let gn = l.raison?.type === 'mots' ? groupe(l.raison) : '';
    const siens = Boolean(gn);
    if (!gn || vus.has(normaliser(gn))) gn = replis.find((x) => !vus.has(normaliser(x))) || 'Votre site';
    vus.add(normaliser(gn));
    const t = assembler(l.univers, gn, d);
    return { ...t, texte: t.avant + t.mots + t.apres, siens };
  });
}
/** Le titre en HTML : ses mots en italique. */
export const titreHTML = (t) => `${fr(t.avant)}<em>${fr(t.mots)}</em>${fr(t.apres)}`;
/** Compatibilité des outils (tableau.mjs) : la raison d'une ligne, courte. */
export const raisonCourte = (l, d) => titresIdees([l], d)[0].texte;

export function policeTitre(u) {
  const t = u?.polices?.titre;
  if (!t || /syst/i.test(t)) return `-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI Variable Display', 'Segoe UI', Roboto, sans-serif`;
  return `'${t.replace(/'/g, '')}', Georgia, serif`;
}

// ---------------------------------------------------------------------------------------------------------
// Les couleurs d'une idée : uniquement SES palettes (ce qu'on touche est exactement ce que le site devient).

/** Le nom simple d'une palette dans le nuancier : sa teinte (« Vert », « Or »), son nom si deux se ressemblent. */
export function nomsPalettes(u) {
  const compte = {};
  for (const p of u.palettes) { const k = `${p.teinte}|${p.ton}`; compte[k] = (compte[k] || 0) + 1; }
  return Object.fromEntries(u.palettes.map((p) => [p.id, compte[`${p.teinte}|${p.ton}`] > 1 || !TEINTES[p.teinte] ? p.nom : TEINTES[p.teinte].nom]));
}

// ---------------------------------------------------------------------------------------------------------
// Vue : tout ce que la page affiche, calculé une fois.

export function preparer(d, reco, { demo = null, actif = 0 } = {}) {
  const salut = salutation(d);
  const a = salut.analyse;
  const proposes = (reco.proposes?.length ? reco.proposes : reco.classement).slice(0, 3);
  const i = Math.min(proposes.length - 1, Math.max(0, Number(actif) || 0));
  return {
    d, dossier: d.dossier, salut, analyse: a,
    metier: feminiser(String(d.metier || '').trim(), a.genre), ville: villePropre(d.ville),
    reco, proposes, titres: titresIdees(proposes, d), actif: i,
    voile: proposes[i].palette.couleurs, demo,
  };
}

/** Lien du site (celui qu'on ouvre en grand) et de son aperçu (le même, en mode vitrine). */
export const lienSite = (vue, l, palette) => lienUnivers(l.univers.id, vue.dossier, (palette || l.palette).id);
export const lienApercu = (vue, l, palette) => `${lienSite(vue, l, palette)}&apercu=1`;

// ---------------------------------------------------------------------------------------------------------
// Morceaux

const I_IDEES = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="6.5" width="12" height="14" rx="2.2"/><path d="M8.5 3.5h9.8a2.2 2.2 0 0 1 2.2 2.2v11.3"/></svg>';
const I_COULEURS = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.2c3.6 4.1 6.3 7.4 6.3 10.6a6.3 6.3 0 0 1-12.6 0C5.7 10.6 8.4 7.3 12 3.2z"/><path d="M9 14.6a3 3 0 0 0 2.6 2.8"/></svg>';
const I_PLAIT = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.2s-7.6-4.5-8.6-9.6A4.6 4.6 0 0 1 12 7.4a4.6 4.6 0 0 1 8.6 3.2c-1 5.1-8.6 9.6-8.6 9.6z"/></svg>';
const I_FERMER = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
const I_SOLEIL = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M5.3 5.3l1.7 1.7M17 17l1.7 1.7M5.3 18.7L7 17M17 7l1.7-1.7"/></svg>';
const I_LUNE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.6A8.5 8.5 0 0 1 9.4 4a8.5 8.5 0 1 0 10.6 10.6z"/></svg>';
const I_ALLER = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6"/></svg>';
const I_COCHE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

/** Une idée, en carte : peinte dans SA palette, son titre dans SA police. Un vrai lien (lisible sans JS). */
export function rendreIdee(vue, i, palette) {
  const l = vue.proposes[i], t = vue.titres[i], p = palette || l.palette;
  const a = ambiance(p);
  const style = `--c-fond:${a.fond};--c-encre:${a.encre};--c-accent:${a.accent};--c-lueur:${a.lueur};--pt:${policeTitre(l.univers)}`;
  return `<li class="idee"${i === vue.actif ? ' aria-current="true"' : ''}><a class="idee-carte" href="${esc(lienSite(vue, l, p))}" data-i="${i}" style="${esc(style)}">
      <span class="idee-titre">${titreHTML(t)}</span>
      <span class="idee-sous">${fr(courte(l.univers, vue.d))}</span>
      <span class="idee-voir">Voir cette idée ${I_ALLER}</span>
    </a></li>`;
}

/** Le contenu du panneau des couleurs pour l'idée regardée et sa palette. */
export function rendreCouleurs(vue, palette, { note = '' } = {}) {
  const u = vue.proposes[vue.actif].univers;
  const noms = nomsPalettes(u);
  const tons = { clair: u.palettes.filter((p) => p.ton !== 'sombre'), sombre: u.palettes.filter((p) => p.ton === 'sombre') };
  const ton = palette.ton === 'sombre' ? 'sombre' : 'clair';
  const bouton = (k, icone, mot) => `<button class="ton" type="button" data-ton="${k}" aria-pressed="${ton === k}"${tons[k].length ? '' : ' aria-disabled="true"'}>${icone}<span>${mot}</span></button>`;
  const pastilles = tons[ton].map((p) => {
    const c = p.couleurs;
    const fond = valide(c.fond) ? c.fond : '#eee', ac = valide(c.accent) ? c.accent : fond, ac2 = valide(c.accent2) ? c.accent2 : ac;
    return `<button class="teinte" type="button" data-palette="${esc(p.id)}" aria-pressed="${p.id === palette.id}" style="--t1:${fond};--t2:${ac};--t3:${ac2}"><span class="teinte-rond" aria-hidden="true">${I_COCHE}</span><span class="teinte-nom">${fr(noms[p.id])}</span></button>`;
  }).join('');
  return `<div class="tons" role="group" aria-label="Lumière">${bouton('clair', I_SOLEIL, 'Lumière du jour')}${bouton('sombre', I_LUNE, 'Lumière du soir')}</div>
    <div class="teintes" role="group" aria-label="Couleurs">${pastilles}</div>
    <p class="couleurs-note" id="couleurs-note" aria-live="polite">${fr(note || 'Une autre couleur en tête ? Tout se crée sur mesure, à votre goût.')}</p>`;
}

// ---------------------------------------------------------------------------------------------------------
// La page

export function rendreCorps(vue, { palette = null } = {}) {
  const { salut, d } = vue;
  const l = vue.proposes[vue.actif];
  const p = palette || l.palette;
  const lettres = (t) => [...t].map((c, i) => (c === ' ' ? ' ' : `<span class="l" style="--i:${i}">${esc(c)}</span>`)).join('');
  const h1 = salut.avecPrenom
    ? `<h1 class="salut" id="salut" aria-label="${esc(`Bonjour ${salut.nom},`)}" style="--long:${Math.max(7, salut.nom.length + 1)}"><span class="salut-ligne salut-mot" aria-hidden="true">${lettres('Bonjour')}</span> <span class="salut-ligne salut-nom" aria-hidden="true">${lettres(salut.nom + ',')}</span></h1>`
    : `<h1 class="salut sans-prenom" id="salut" aria-label="${esc(`Bonjour, ${salut.nom}`)}" style="--long:8"><span class="salut-ligne salut-mot" aria-hidden="true">${lettres('Bonjour,')}</span> <span class="salut-ligne salut-enseigne" aria-hidden="true">${esc(salut.nom)}</span></h1>`;
  const autres = vue.proposes.length - 1;
  const demo = vue.demo ? `<label class="demo">Voir pour <select id="choix-demo">${vue.demo.map((x) => `<option value="${esc(x.dossier)}"${x.dossier === vue.dossier ? ' selected' : ''}>${esc(x.nom)}</option>`).join('')}</select></label>` : '';
  const tantMieux = salut.avecPrenom ? `Tant mieux, ${esc(salut.nom)}.` : 'Tant mieux.';

  return typo(`
<header class="mot" id="mot">
  <p class="marque"><span class="kazura">Kazura</span><span class="prive">Aperçu privé${salut.avecPrenom ? `, préparé pour ${esc(salut.nom)}` : ''}</span></p>
  ${h1}
  <p class="phrase" id="phrase">${fr(PHRASE)}</p>
  <p class="signe" id="signe">${esc(SIGNATAIRE)}</p>
</header>

<div class="scene" id="scene">
  <div class="site" id="site">
    <iframe id="apercu" title="Votre site, en direct" allow="autoplay 'none'; camera 'none'; microphone 'none'; geolocation 'none'" referrerpolicy="same-origin"></iframe>
    <div class="passage" id="passage" style="--pt:${esc(policeTitre(l.univers))}">
      <p class="passage-titre" id="passage-titre">${titreHTML(vue.titres[vue.actif])}</p>
      <a class="passage-ouvrir" id="passage-ouvrir" href="${esc(lienSite(vue, l, p))}">Ouvrir votre site</a>
    </div>
  </div>
  <p class="aide" id="aide" aria-hidden="true"><span class="aide-geste"><i></i></span><span class="aide-texte" id="aide-texte">Faites défiler : c’est votre site.</span></p>
</div>

<section class="panneau idees-panneau" id="p-idees" aria-labelledby="p-idees-titre">
  <div class="panneau-tete">
    <h2 class="panneau-titre" id="p-idees-titre"><span class="js-seul">${autres > 1 ? 'Deux autres idées pour vous' : autres === 1 ? 'Une autre idée pour vous' : 'Votre idée'}</span><span class="sans-js-seul">${autres ? 'Les idées imaginées pour vous' : 'Votre site'}</span></h2>
    <button class="fermer" type="button" data-fermer>${I_FERMER}<span>Fermer</span></button>
  </div>
  <p class="panneau-sous js-seul">Vous regardez : <span id="idee-actuelle">${titreHTML(vue.titres[vue.actif])}</span></p>
  <ol class="idees" id="idees">${vue.proposes.map((x, i) => rendreIdee(vue, i, i === vue.actif ? p : null)).join('')}</ol>
</section>

<section class="panneau couleurs-panneau js-seul" id="p-couleurs" aria-labelledby="p-couleurs-titre">
  <div class="panneau-tete">
    <h2 class="panneau-titre" id="p-couleurs-titre">Les couleurs de votre site</h2>
    <button class="fermer" type="button" data-fermer>${I_FERMER}<span>Fermer</span></button>
  </div>
  <div id="couleurs">${rendreCouleurs(vue, p)}</div>
</section>

<div class="attrape" id="attrape"></div>

<nav class="barre js-seul" id="barre" aria-label="Votre aperçu">
  ${autres ? `<button class="b" type="button" id="b-idees" aria-controls="p-idees" aria-expanded="false">${I_IDEES}<span>Voir une autre idée</span></button>` : ''}
  <button class="b" type="button" id="b-couleurs" aria-controls="p-couleurs" aria-expanded="false">${I_COULEURS}<span>Changer les couleurs</span></button>
  <button class="b b-plait" type="button" id="b-plait" aria-controls="fin" aria-expanded="false">${I_PLAIT}<span>Ça me plaît</span></button>
</nav>

<section class="fin" id="fin" aria-labelledby="fin-titre">
  <div class="fin-haut js-seul"><button class="fin-fermer" type="button" data-fermer>${I_FERMER}<span>Fermer</span></button></div>
  <div class="fin-corps">
    <p class="fin-tant js-seul">${tantMieux}</p>
    <h2 class="fin-titre" id="fin-titre">Tout se personnalise, <em>à 100&nbsp;%.</em></h2>
    <div class="fin-texte">
      <p>On part de cette idée ou d’une page blanche, et on ajuste ensemble chaque détail : vos textes, vos photos, vos couleurs.</p>
      <p>Le nom de domaine est à votre nom. Le site vous appartient : vous gardez tout.</p>
    </div>
    <div class="rever">
      <h3 class="rever-titre">Oser rêver</h3>
      <p>Un site sur mesure se paie souvent très cher. J’ai voulu l’inverse : le site de vos rêves, à un prix que tout le monde peut se permettre, et payable en plusieurs fois, sans frais.</p>
    </div>
    <div class="contact">
      <p class="contact-titre">Répondez simplement au message que vous avez reçu.</p>
      <p>Je vous réponds moi-même.</p>
      <p class="contact-signe">${esc(SIGNATAIRE)}</p>
    </div>
    <button class="revoir js-seul" type="button" data-fermer>Revoir mon site</button>
  </div>
  <footer class="pied">
    <p>Aperçu préparé pour ${esc(d.nom)}. Textes, photos, couleurs : tout se modifie selon vos goûts.</p>
    <p class="signature"><span class="kazura">Kazura</span><span>Aperçu privé, non référencé</span>${demo}</p>
  </footer>
</section>`);
}

/** Les feuilles de police des idées montrées, réduites aux lettres de leurs titres (paramètre text= de Google Fonts). */
export function policesUnivers(vue) {
  const vus = new Set();
  // Deux univers partagent parfois une police (Cormorant Garamond : Cinéma et Immersion) et chaque feuille réduite
  // la déclare sans unicode-range : la dernière arrivée sert tout. Toutes reçoivent donc les mêmes lettres.
  const tout = `${vue.titres.map((t) => t.texte).join('')}Ouvrir votre site abcdefghijklmnopqrstuvwxyzàâéèêëîïôöûüçœ’',.`;
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

/** Variables posées sur <body> : la palette regardée et le voile d'ouverture. */
export const stylesCorps = (vue, palette) => {
  const v = (palette || vue.proposes[vue.actif].palette).couleurs;
  return `${enStyle(variablesScene(palette || vue.proposes[vue.actif].palette))};--v-fond:${v.fond};--v-a:${v.accent};--v-b:${v.accent2 || v.accent};--v-encre:${v.encre}`;
};

/** Le document complet (batir.mjs) : la fiche et le catalogue sont embarqués pour un premier rendu immédiat. */
export function rendreDocument(vue, { base = '', catalogue = [] } = {}) {
  const { salut, d } = vue;
  const titre = salut.avecPrenom ? `Bonjour ${salut.nom}` : `Bonjour, ${salut.nom}`;
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
<meta name="theme-color" content="${esc(vue.voile.fond)}">
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
<div class="voile" id="voile" aria-hidden="true"><canvas id="voile-toile"></canvas><p class="voile-passer" id="voile-passer">Touchez l’écran pour entrer</p></div>
<div id="page">${rendreCorps(vue)}</div>
<script type="application/json" id="donnees">${donnees}</script>
<script type="module" src="${base}accueil/accueil.js"></script>
</body>
</html>
`;
}
