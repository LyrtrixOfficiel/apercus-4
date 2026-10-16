// Page d'arrivée : de la fiche du praticien et de la recommandation au HTML.
// Module partagé : node (batir.mjs) écrit la page lisible sans JavaScript, le navigateur (accueil.js) la redessine
// pour n'importe quelle fiche (?p=<dossier>) et à chaque goût choisi. Aucune API du DOM ici.

import { analyserNom, feminiser, villePropre, salutation } from '../commun/prenoms.js';
import { TEINTES, lienUnivers, normaliser } from '../commun/recommandation.js';
import { affiche, MOTS_AFFICHES } from './affiches.js';

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
// insécables avant : ; ! ? » et après «, comme en typographie française
// apostrophe typographique partout dans le texte affiché (les attributs passent par esc, qui code l'apostrophe droite)
const apos = (s) => String(s ?? '').replace(/'/g, '’');
// et, dans les seuls nœuds de texte, l'espace insécable avant « ; : ! ? » » (jamais un « ; » seul en début de ligne)
export const typo = (html) => html.replace(/'/g, '’').replace(/>([^<]+)</g, (m, t) => `>${t.replace(/&#39;/g, '’').replace(/ ([;:!?»])/g, '&nbsp;$1').replace(/« /g, '«&nbsp;')}<`);
export const fr = (s) => esc(apos(s)).replace(/ ([:;!?»])/g, '&nbsp;$1').replace(/« /g, '«&nbsp;');

// ---------------------------------------------------------------------------------------------------------
// Couleurs et contraste

const hex = (h) => { const m = String(h).replace('#', ''); return [0, 2, 4].map((i) => parseInt(m.slice(i, i + 2), 16)); };
const versHex = (c) => '#' + c.map((x) => Math.round(Math.max(0, Math.min(255, x))).toString(16).padStart(2, '0')).join('');
const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
export const luminance = (h) => { const [r, g, b] = hex(h); return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b); };
export const contraste = (a, b) => { const x = luminance(a), y = luminance(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
export const melanger = (a, b, t) => { const x = hex(a), y = hex(b); return versHex(x.map((v, i) => v + (y[i] - v) * t)); };
/** La couleur la plus proche de `c` qui tient `cible`:1 sur `fond` (en la rapprochant de `encre`). */
export function tenir(c, fond, encre, cible = 4.5) {
  for (let t = 0; t <= 1.0001; t += 0.05) { const m = melanger(c, encre, t); if (contraste(m, fond) >= cible) return m; }
  return encre;
}

export const PAGE = { papier: '#f3eee6', papier2: '#e9e2d6', encre: '#1b1814', encre2: '#4a433b', nuit: '#16130f' };

// ---------------------------------------------------------------------------------------------------------
// La phrase citée : la plus belle de son accroche, son approche, sa conviction ou son à propos.

const SANTE = /\b(maux|troubles?|souffrances?|sante|guerir|guerison|soigner|traitements?|symptomes?|maladies?|douleurs?|diagnostic|therapeutique|medic)/;
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
    // une phrase très longue : sa dernière proposition à la première personne peut se citer seule
    if (p.length > 220) {
      const m = p.match(/,\s+((?:j'|j’|je |nous |mon |ma |mes )[^,]{50,200}[.!?…]?)$/i);
      if (m) out.push({ champ, texte: '… ' + m[1], coupe: true });
    }
  }
  return out;
}

/**
 * Choisit la phrase à citer. `prioritaires` : mots des raisons du trio (le premier pèse le plus).
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
    if (L < 35 || L > 260) continue;
    note += L >= 60 && L <= 170 ? 2 : L <= 240 ? 1 : 0;
    if (/\b(je|j'|mon|ma|mes|moi|nous|notre)\b/.test(n) || /^(je|j')/.test(n)) note += 1.5;
    if (/\b(vous|votre|vos)\b/.test(n)) note += 0.6;
    note += Math.min(2, (n.match(BEAUX) || []).length * 0.5);
    note += { conviction: 1.2, accroche: 0.6, apropos: 0.3, approche: 0 }[c.champ] || 0;
    if (/\d/.test(t)) note -= 4;
    if (DUREE.test(n)) note -= 3;
    if (SANTE.test(n)) note -= 2.5;
    if (/sur rendez-vous|^seance d/.test(n) && L < 80) note -= 3;
    if (/\.\.\.$|…$/.test(t)) note -= 0.5;
    if (nomNorm && n.includes(nomNorm)) note -= 2;
    if (/^bienvenue/.test(n)) note -= 1;
    if (c.coupe) note -= 0.6;
    let mot = null;
    prioritaires.forEach((m, i) => { if (!mot && m && n.includes(normaliser(m))) { mot = m; note += i === 0 ? 1.5 : 1; } });
    t = t.replace(/\s*\.\.\.$/, '…');
    if (!/[.!?…]$/.test(t)) t += '.';
    if (!meilleure || note > meilleure.note) meilleure = { texte: t, champ: c.champ, mot, note };
  }
  return meilleure && meilleure.note >= 2 ? meilleure : null;
}

// Met en valeur le mot trouvé dans la citation, sans toucher au reste.
function surligner(texte, mot) {
  const html = fr(texte);
  if (!mot) return html;
  const n = normaliser(texte), m = normaliser(mot);
  const i = n.indexOf(m);
  if (i < 0) return html;
  return fr(texte.slice(0, i)) + `<mark>${fr(texte.slice(i, i + mot.length))}</mark>` + fr(texte.slice(i + mot.length));
}

// ---------------------------------------------------------------------------------------------------------
// Vue : tout ce que la page affiche, calculé une fois.

const saison = (date) => { const m = date.getMonth(); return `${['Hiver', 'Hiver', 'Printemps', 'Printemps', 'Printemps', 'Été', 'Été', 'Été', 'Automne', 'Automne', 'Automne', 'Hiver'][m]} ${date.getFullYear()}`; };

export function preparer(d, reco, { date = new Date(), demo = null } = {}) {
  const salut = salutation(d);
  const a = salut.analyse;
  const metier = feminiser(String(d.metier || '').trim(), a.genre);
  const ville = villePropre(d.ville);
  const top = reco.classement.slice(0, 3);
  const prioritaires = top.map((l) => (l.raison.type === 'mots' ? l.raison.mot : null));
  const citation = phraseCitee(d, prioritaires);
  if (citation?.mot) citation.univers = top.find((l) => l.raison.mot === citation.mot)?.univers.nom || null;
  const p0 = top[0].palette.couleurs;
  const accent = tenir(p0.accent, PAGE.papier, PAGE.encre, 4.5);
  return {
    d, dossier: d.dossier, salut, analyse: a, metier, ville,
    identite: [metier, ville].filter(Boolean).join(' à '),
    citation, reco, top, autres: reco.classement.slice(3), accent, voile: p0,
    saison: saison(date), demo,
    nomPoster: a.nomAffiche || d.nom,
  };
}

// ---------------------------------------------------------------------------------------------------------
// Morceaux

const fleche = '<svg class="fleche" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6"/></svg>';
const oeil = '<svg class="oeil" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';

export function policeTitre(u) {
  const t = u?.polices?.titre;
  if (!t || /syst/i.test(t)) return `-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI Variable Display', 'Segoe UI', Roboto, sans-serif`;
  return `'${t.replace(/'/g, '')}', Georgia, serif`;
}

const nuance = (p) => `<span class="nuance" aria-hidden="true">${['fond', 'accent', 'accent2', 'encre'].map((k) => `<i style="background:${esc(p.couleurs[k])}"></i>`).join('')}</span>`;

function noteTeinte(l, gouts) {
  const p = l.palette;
  if (gouts?.teinte && l.accord === 'gris') return `<span>Pas encore dans ${esc(TEINTES[gouts.teinte].article)} : on peut le créer pour vous.</span>`;
  if (gouts?.teinte && (l.accord === 'voisin' || l.accord === 'neutre')) return `${nuance(p)}<span>En teinte ${esc(p.nom)}, la plus proche de votre choix.</span>`;
  return `${nuance(p)}<span>En teinte ${esc(p.nom)}.</span>`;
}

const RANGS = ['Notre premier choix', 'Une autre piste', 'Une troisième piste'];

export function rendreChoix(l, i, vue) {
  const u = l.univers, lien = lienUnivers(u.id, vue.dossier, l.palette.id);
  return typo(`<article class="choix choix-${i + 1}" data-id="${esc(u.id)}" data-palette="${esc(l.palette.id)}">
    <a class="cadre" href="${esc(lien)}" aria-label="Ouvrir ${esc(u.nom)}, en teinte ${esc(l.palette.nom)}">${affiche(l, vue, { taille: i === 0 ? 'grande' : 'moyenne' })}</a>
    <div class="choix-texte">
      <p class="choix-rang">${RANGS[i]}</p>
      <h3 class="choix-nom" style="font-family:${esc(policeTitre(u))}">${esc(u.nom)}</h3>
      <p class="raison">${fr(l.raison.texte)}</p>
      <p class="teinte">${noteTeinte(l, vue.reco.gouts)}</p>
      <p class="actions"><a class="bouton" href="${esc(lien)}">Ouvrir ce site ${fleche}</a><button class="lien-apercu" type="button" data-apercu="${esc(lien)}" data-nom="${esc(u.nom)}">${oeil}Aperçu ici</button></p>
    </div>
  </article>`);
}

export function rendreAutre(l, i, vue) {
  const u = l.univers, lien = lienUnivers(u.id, vue.dossier, l.palette.id);
  return typo(`<article class="autre autre-${i + 1}" data-id="${esc(u.id)}">
    <a class="cadre" href="${esc(lien)}" aria-label="Ouvrir ${esc(u.nom)}, en teinte ${esc(l.palette.nom)}">${affiche(l, vue, { taille: 'petite' })}</a>
    <h3 class="autre-nom" style="font-family:${esc(policeTitre(u))}">${esc(u.nom)}</h3>
    <p class="autre-promesse">${fr(u.promesse || '')}</p>
    <p class="autre-actions"><a href="${esc(lien)}">Ouvrir ${fleche}</a><button class="lien-apercu" type="button" data-apercu="${esc(lien)}" data-nom="${esc(u.nom)}">${oeil}Aperçu ici</button></p>
  </article>`);
}

export function rendreMiroir(vue) {
  const g = vue.reco.gouts || {};
  const items = vue.top.map((l, i) => `<div class="miroir-carte m-${i + 1}" data-id="${esc(l.univers.id)}">${affiche(l, vue, { taille: 'mini' })}</div>`).join('');
  const liste = vue.top.map((l) => `${esc(l.univers.nom)} en ${esc(l.palette.nom)}`);
  const phrase = liste.length === 3 ? `${liste[0]}, ${liste[1]} et ${liste[2]}` : liste.join(' et ');
  const choisi = g.teinte || g.ton;
  return typo(`<div class="miroir-cartes" aria-hidden="true">${items}</div>
    <p class="miroir-legende">${choisi ? 'Vos trois univers, maintenant : ' : 'Vos trois univers, tels que nous les avons choisis : '}${phrase}.</p>
    <p class="miroir-lien"><a href="#pour-vous">Les revoir en grand ${fleche}</a></p>`);
}

// Lames du nuancier : une par teinte du contrat, dans l'ordre du cercle chromatique.
export const ORDRE_TEINTES = ['vert', 'bleu', 'violet', 'rose', 'rouge', 'orange', 'jaune', 'or', 'terre', 'neutre-clair', 'neutre-sombre'];

function rendreNuancier(g) {
  return ORDRE_TEINTES.map((t, i) => {
    const T = TEINTES[t];
    return `<button class="lame" type="button" data-teinte="${t}" aria-pressed="${g.teinte === t}" style="--i:${i};--c1:${T.echantillon[0]};--c2:${T.echantillon[1]}"><span class="lame-couleur"></span><span class="lame-nom">${esc(T.nom)}</span></button>`;
  }).join('');
}

// Le nom tracé à main levée sur la page blanche (SVG, sans police externe obligatoire).
function pageBlanche(vue) {
  const nom = vue.salut.avecPrenom ? vue.salut.nom : (vue.nomPoster.split(' ')[0] || 'Vous');
  const taille = Math.max(56, Math.min(120, Math.round(640 / Math.max(4, nom.length))));
  return `<svg class="trace" viewBox="0 0 600 260" role="img" aria-label="Votre nom, à dessiner ensemble">
    <g class="reperes"><path d="M40 30v-14M30 40H16M560 30v-14M570 40h14M40 230v14M30 220H16M560 230v14M570 220h14"/><path class="grille" d="M150 40v180M300 40v180M450 40v180M40 130h520"/></g>
    <text x="300" y="${150 + taille * 0.18}" text-anchor="middle" font-size="${taille}">${esc(nom)}</text>
    <path class="souligne" d="M${300 - nom.length * taille * 0.22} ${168 + taille * 0.3} q ${nom.length * taille * 0.22} -14 ${nom.length * taille * 0.44} 2"/>
  </svg>`;
}

// ---------------------------------------------------------------------------------------------------------
// La page

export function rendreCorps(vue) {
  const { salut, d } = vue;
  const g = vue.reco.gouts || {};
  const prenom = salut.avecPrenom ? salut.nom : '';
  const longueur = Math.max(7, (salut.avecPrenom ? salut.nom.length + 1 : 7));
  const lettres = (t) => [...t].map((c, i) => (c === ' ' ? ' ' : `<span class="l" style="--i:${i}">${esc(c)}</span>`)).join('');
  const h1 = salut.avecPrenom
    ? `<h1 class="salut" id="salut" aria-label="${esc(`Bonjour ${salut.nom},`)}" style="--long:${longueur}"><span class="salut-ligne salut-mot" aria-hidden="true">${lettres('Bonjour')}</span> <span class="salut-ligne salut-nom" aria-hidden="true">${lettres(salut.nom + ',')}</span></h1>`
    : `<h1 class="salut sans-prenom" id="salut" aria-label="${esc(`Bonjour, ${salut.nom}`)}" style="--long:8"><span class="salut-ligne salut-mot" aria-hidden="true">${lettres('Bonjour,')}</span> <span class="salut-ligne salut-enseigne" aria-hidden="true">${esc(salut.nom)}</span></h1>`;

  const cit = vue.citation;
  const citation = cit
    ? `<figure class="citation revele">
        <blockquote><p class="${cit.texte.length > 170 ? 'longue' : ''}"><span class="guillemet" aria-hidden="true">«</span>${surligner(cit.texte, cit.mot)}<span class="guillemet fin" aria-hidden="true">»</span></p></blockquote>
        <figcaption>Vos mots, tirés de votre présentation en ligne.${cit.mot && cit.univers ? ` <span class="nait">« ${fr(cit.mot)} » : c'est de là qu'est né ${esc(cit.univers)}, un peu plus bas.</span>` : ''}</figcaption>
      </figure>`
    : `<figure class="citation citation-vide revele">
        <blockquote><p><span class="guillemet" aria-hidden="true">«</span>Ici, la phrase qui vous ressemble.<span class="guillemet fin" aria-hidden="true">»</span></p></blockquote>
        <figcaption>Votre présentation en ligne est encore courte : votre site sera l'occasion de dire, avec vos mots, ce qui fait votre façon de travailler.</figcaption>
      </figure>`;

  const titreGouts = prenom ? `Et si on l'accordait à vous, <em>${esc(prenom)}</em>&nbsp;?` : `Et si on l'accordait à <em>vos goûts</em>&nbsp;?`;

  const demo = vue.demo ? `<label class="demo">Voir pour <select id="choix-demo">${vue.demo.map((x) => `<option value="${esc(x.dossier)}"${x.dossier === vue.dossier ? ' selected' : ''}>${esc(x.nom)}</option>`).join('')}</select></label>` : '';

  return typo(`
<header class="tete" id="haut">
  <div class="marque"><span class="kazura">Kazura</span><span class="prive">Aperçu privé</span></div>
  ${h1}
  <div class="tete-texte apres">
    ${vue.identite ? `<p class="identite">${esc(vue.identite)}</p>` : ''}
    <p class="chapeau">Nous avons lu votre présentation en ligne, et imaginé votre futur site de plusieurs façons. Trois d'entre elles ont été pensées pour vous ; les autres sont là pour le plaisir de comparer.</p>
    <p class="honnete">Ce sont des maquettes, faites avec vos propres textes. Rien n'est publié, et tout se personnalise à 100&nbsp;% : textes, photos, couleurs, mise en page.</p>
  </div>
</header>

<main id="contenu" class="apres">
  <section class="vos-mots" aria-label="Vos mots">${citation}</section>

  <section class="pour-vous" id="pour-vous" aria-labelledby="t-pour-vous">
    <div class="titre-section revele">
      <h2 id="t-pour-vous">Trois univers <em>pensés pour vous</em></h2>
      <p>Chacun est un vrai site, déjà rempli avec vos textes : ouvrez-le, faites-le défiler, sur téléphone comme sur ordinateur.</p>
    </div>
    <div class="trio" id="trio">${vue.top.map((l, i) => rendreChoix(l, i, vue)).join('')}</div>
  </section>

  <section class="accord" id="vos-gouts" aria-labelledby="t-gouts">
    <div class="accord-tete revele">
      <h2 id="t-gouts">${titreGouts}</h2>
      <p>Deux questions, comme on vous les poserait à l'atelier. Les univers changent de couleur en direct ; rien n'est enregistré.</p>
    </div>
    <div class="accord-corps">
      <div class="questions">
        <div class="question revele">
          <p class="q" id="q-lumiere">Votre site, vous le voyez plutôt dans la lumière du jour, ou dans celle du soir&nbsp;?</p>
          <div class="lumieres" role="group" aria-labelledby="q-lumiere">
            <button class="lumiere jour" type="button" data-ton="clair" aria-pressed="${g.ton === 'clair'}"><span class="lumiere-ciel" aria-hidden="true"></span><span class="lumiere-nom">Lumière du jour</span></button>
            <button class="lumiere soir" type="button" data-ton="sombre" aria-pressed="${g.ton === 'sombre'}"><span class="lumiere-ciel" aria-hidden="true"></span><span class="lumiere-nom">Lumière du soir</span></button>
          </div>
        </div>
        <div class="question revele">
          <p class="q" id="q-teinte">Et la couleur qui vous ressemble&nbsp;?</p>
          <div class="nuancier" role="group" aria-labelledby="q-teinte"><span class="rivet" aria-hidden="true"></span>${rendreNuancier(g)}</div>
        </div>
      </div>
      <div class="miroir revele" id="miroir" aria-live="polite">${rendreMiroir(vue)}</div>
    </div>
    <p class="effacer"><button type="button" id="effacer"${g.teinte || g.ton ? '' : ' hidden'}>Revenir à nos choix</button></p>
  </section>

  <section class="autres" id="autres" aria-labelledby="t-autres">
    <div class="titre-section revele">
      <h2 id="t-autres">Les autres univers</h2>
      <p>Moins attendus pour vous, mais tout aussi réels. Parfois, c'est là qu'on a un coup de cœur.</p>
    </div>
    <div class="bande" id="bande">${vue.autres.map((l, i) => rendreAutre(l, i, vue)).join('')}</div>
  </section>

  <section class="zero" id="zero" aria-labelledby="t-zero">
    <div class="feuille revele" aria-hidden="false">${pageBlanche(vue)}</div>
    <div class="zero-texte revele">
      <h2 id="t-zero">Ou partir d'une <em>page blanche</em>.</h2>
      <p>Ces univers sont des points de départ, pas des modèles à prendre ou à laisser. On peut garder l'un d'eux, en mélanger deux, ou tout dessiner ensemble à partir de zéro, jusqu'au site de vos rêves, personnalisé à 100&nbsp;%.</p>
      <p>Textes, photos, couleurs, pages : tout se modifie. Vos clients pourront réserver directement depuis le site, et votre nom de domaine sera à votre nom.</p>
      <p class="parler">Pour en parler, répondez simplement au message qui vous a conduit ici.</p>
    </div>
  </section>
</main>

<footer class="pied apres">
  <p>Aperçu préparé pour ${esc(d.nom)}. Textes, photos, couleurs : tout se modifie selon vos goûts.</p>
  <p>On peut partir d'un univers, en mélanger deux, ou partir de zéro, jusqu'au site qui vous ressemble exactement.</p>
  <p class="signature"><span class="kazura">Kazura</span><span>Aperçu privé, non référencé</span>${demo}</p>
</footer>`);
}

/** Les feuilles de police des univers, réduites aux seuls caractères affichés (paramètre text= de Google Fonts). */
// Deux univers partagent parfois une police (Cormorant Garamond pour Cinéma et Immersion) : chaque feuille réduite
// déclare la même famille sans unicode-range, et la dernière arrivée sert TOUS les caractères. Toutes les feuilles
// reçoivent donc le même jeu de caractères (les noms de tous les univers, les lettres accentuées), sinon un « é »
// absent tombe sur Georgia et l'accent se décale (« Cinéma »). Les familles déjà chargées en entier par la page
// (Newsreader, Archivo) sont retirées des feuilles des univers : réduites, elles masqueraient les lettres de la page.
const ACCENTS = 'àâäéèêëîïôöûüùçœæÀÂÄÉÈÊËÎÏÔÖÛÜÙÇŒÆ’\'«»,.;:!?-&()';
export function policesUnivers(vue, catalogue) {
  const textes = [vue.nomPoster, vue.analyse.enseigne, vue.salut.nom, vue.identite, vue.ville, vue.metier, vue.d.initiales, vue.saison,
    'Carte des soins', MOTS_AFFICHES, 'Approche Séance Contact', '0123456789', ACCENTS,
    ...catalogue.map((u) => u.nom), ...(vue.top || []).map((l) => l.raison?.mot || '')];
  const tout = textes.join('');
  const chars = encodeURIComponent([...new Set([...(tout + tout.toUpperCase() + tout.toLowerCase())].filter((c) => c.trim()))].join(''));
  const vus = new Set();
  return catalogue.filter((u) => u.polices?.css && /^https:\/\/fonts\.googleapis\.com\/css2\?/.test(u.polices.css)).map((u) => {
    const familles = (u.polices.css.match(/family=[^&]+/g) || []).filter((f) => !/^family=(Newsreader|Archivo)(:|$)/.test(f));
    if (!familles.length) return null;
    const url = `https://fonts.googleapis.com/css2?${familles.join('&')}&display=swap&text=${chars}`;
    if (vus.has(url)) return null;
    vus.add(url);
    return { id: u.id, url };
  }).filter(Boolean);
}

/** Variables de couleur posées sur <body> : accent de la page et couleurs du voile d'ouverture. */
export const stylesCorps = (vue) => { const v = vue.voile; return `--sa:${vue.accent};--v-fond:${v.fond};--v-a:${v.accent};--v-b:${v.accent2 || v.accent};--v-encre:${v.encre}`; };

export const POLICES_PAGE = 'https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,300..700&family=Newsreader:ital,opsz,wght@0,6..72,300..600;1,6..72,300..500&display=swap';

/** Le document complet (batir.mjs). `donnees` : la fiche et le catalogue embarqués pour un premier rendu immédiat. */
export function rendreDocument(vue, { base = '', catalogue = [], fiches = null } = {}) {
  const { salut, d } = vue;
  const titre = salut.avecPrenom ? `Bonjour ${salut.nom}` : `Bonjour, ${salut.nom}`;
  const v = vue.voile;
  // polices chargées sans bloquer le premier affichage (le voile apparaît tout de suite) ; sans JavaScript, <noscript>
  const sansBloquer = (url, attr = '') => `<link rel="stylesheet"${attr} href="${esc(url)}" media="print" onload="this.media='all'"><noscript><link rel="stylesheet" href="${esc(url)}"></noscript>`;
  const polices = `<noscript>${policesUnivers(vue, catalogue).map((p) => `<link rel="stylesheet" href="${esc(p.url)}">`).join('')}</noscript>`;
  const policePage = sansBloquer(POLICES_PAGE);
  const donnees = JSON.stringify({ dossier: vue.dossier, fiche: d, catalogue, fiches }).replace(/</g, '\\u003c');
  return `<!doctype html>
<html lang="fr" class="sans-js">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<title>${esc(titre)}</title>
<meta name="description" content="${esc(`Aperçu privé préparé pour ${d.nom} : votre futur site, imaginé de plusieurs façons.`)}">
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
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
${policePage}
${polices}
<link rel="stylesheet" href="${base}accueil/accueil.css">
</head>
<body style="${esc(stylesCorps(vue))}">
<div class="voile" id="voile" aria-hidden="true"><canvas id="voile-toile"></canvas><p class="voile-ligne" id="voile-ligne"></p><p class="voile-passer">Touchez pour entrer</p></div>
<div id="page">${rendreCorps(vue)}</div>
<dialog class="fenetre" id="fenetre" aria-labelledby="fenetre-titre">
  <div class="fenetre-barre"><p id="fenetre-titre">Aperçu</p><a id="fenetre-grand" href="#">Ouvrir en grand</a><button type="button" id="fenetre-fermer" aria-label="Fermer l'aperçu">Fermer</button></div>
  <div class="fenetre-cadre"><iframe id="fenetre-iframe" title="Aperçu de l'univers" loading="lazy"></iframe></div>
</dialog>
<script type="application/json" id="donnees">${donnees}</script>
<script type="module" src="${base}accueil/accueil.js"></script>
</body>
</html>
`;
}
