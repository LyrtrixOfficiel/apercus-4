// Méridiens : la page entière depuis la fiche JSON d'un praticien.
// Même module dans le navigateur (?p=<dossier>) et dans node (batir.mjs écrit la page par défaut : lisible sans JavaScript).
import { famille } from '../../commun/familles.js';
import { svgCarte, choisirCarte, carteDouce, LEGENDES, LEGENDE_DOUCE, CARTES } from './carte.js';
import { graine, hasard, r1, poly } from './trace.js';

const ENT = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s = '') => String(s ?? '').replace(/[&<>"']/g, (c) => ENT[c]).replace(new RegExp(String.fromCharCode(91, 8211, 8212, 93), 'g'), ',');
// typographie française : espaces fines avant ; : ! ? et dans les guillemets, insécables où il faut
export const fr = (s = '') => esc(String(s).trim()).replace(/\s+([:;!?»])/g, ' $1').replace(/«\s*/g, '« ').replace(/(rendez-vous)/gi, '<x-nobr>$1</x-nobr>').replace(/(\d) (€|h\b|min\b)/g, '$1 $2');
const lien = (u) => (/^https?:\/\//i.test(u || '') ? esc(u) : '');
const place = (t) => /^Ici,/.test(String(t || '').trim());
const vide = (a) => !a || !a.length;

export function titre(d) { return `${d.nom} · ${d.metier}${d.ville ? ' à ' + d.ville : ''}`; }
export function description(d) { return d.accroche || `${d.metier}${d.ville ? ' à ' + d.ville : ''}, sur rendez-vous.`; }

// Palette : demandée par ?palette=, sinon celle prévue pour la famille du métier, sinon la première.
export function palette(d, univers, demande) {
  const P = univers.palettes;
  return P.find((p) => p.id === demande) || P.find((p) => (p.defautPour || []).includes(famille(d))) || P[0];
}
export function stylePalette(p) {
  const c = p.couleurs;
  return `--fond:${c.fond};--encre:${c.encre};--accent:${c.accent};--accent2:${c.accent2}`;
}

// Le nom : le dernier mot en italique (ou ce qui suit « d’ »), une taille selon la longueur.
function nomCompose(nom) {
  const n = String(nom || '').trim();
  const m = n.match(/^(.*?)\s+(d[’']\S.*)$/i);
  let tete, fin;
  if (m) { tete = m[1]; fin = m[2]; }
  else {
    const mots = n.split(/\s+/); if (mots.length < 2) return { html: esc(n), taille: n.length > 14 ? 'long' : '' };
    // la particule reste avec le nom : « Marion » / « Le Thimonnier »
    const k = mots.length > 2 && /^(le|la|de|du|des|van|von|di|da|del|dos)$/i.test(mots.at(-2)) ? 2 : 1;
    tete = mots.slice(0, -k).join(' '); fin = mots.slice(-k).join(' ');
  }
  let taille = n.length > 30 ? 'tres-long' : n.length > 19 ? 'long' : '';
  // la fin en italique ne se coupe jamais (« Le » seul sur sa ligne) : si elle est longue, tout le nom descend d'une taille
  if (fin.length > 10 && taille !== 'tres-long') taille = 'fin-longue';
  return { html: `<span class="nom-a">${esc(tete)}</span> <em class="nom-b">${esc(fin).replace(/ /g, '&nbsp;')}</em>`, taille };
}

function tete(d) {
  return `
<header class="tete" id="tete">
  <a class="sceau" href="#accueil" aria-label="${esc(d.nom)}, revenir en haut"><span>${esc(d.initiales || '')}</span></a>
  <nav class="tete-liens" aria-label="Sections">
    <a href="#approche">L’approche</a><a href="#seance">La séance</a><a href="#tarifs">Tarifs</a><a href="#apropos">À propos</a>
  </nav>
  <a class="tete-rdv" href="#contact"><span class="point" aria-hidden="true"></span><x-nobr>Rendez-vous</x-nobr></a>
</header>`;
}

const ratio = (carte, seul) => { const C = CARTES[carte](); const vb = seul && C.vbSeul ? C.vbSeul : C.vb; return (vb[2] / vb[3]).toFixed(3); };
function accueil(d, carte) {
  const L = carteDouce(d, carte) ? LEGENDE_DOUCE : LEGENDES[carte];
  const N = nomCompose(d.nom);
  const lieu = [esc(d.metier), d.ville && `à ${esc(d.ville)}`].filter(Boolean).join(' ');
  return `
<section class="planche" id="accueil" aria-labelledby="nom">
  <div class="planche-titre">
    <p class="metier">${lieu}</p>
    <h1 class="nom ${N.taille ? 'nom-' + N.taille : ''}" id="nom">${N.html}</h1>
  </div>
  <figure class="planche-carte" data-carte="${carte}"${L === LEGENDE_DOUCE ? ' data-douce="1"' : ''}>
    <div class="carte-boite" style="--ratio:${ratio(carte)}" role="img" aria-label="${esc(L.aria)}">${svgCarte(carte, 'h')}</div>
    <figcaption class="geste"><span class="point" aria-hidden="true"></span>${esc(L.geste)}</figcaption>
  </figure>
  <div class="planche-suite">
    <p class="accroche">${fr(d.accroche)}</p>
    <div class="actions">
      <a class="bouton" href="#contact"><x-nobr>Prendre rendez-vous</x-nobr></a>
      ${d.tel ? `<a class="appel" href="${esc(d.telLien)}"><span class="point" aria-hidden="true"></span>${esc(d.tel)}</a>` : ''}
    </div>
  </div>
  <a class="descendre" href="#approche" aria-label="Découvrir la suite"><span aria-hidden="true"></span></a>
</section>`;
}

// Paragraphes en double (« Bienvenue ... Je suis ... » puis « Je suis ... ») : on garde le plus net ;
// si le plus long ajoute une phrase à la fin du plus court, on garde seulement cette phrase en plus.
export function sansDoublons(ps) {
  const p = [...new Set((ps || []).filter(Boolean).map((x) => String(x).trim()))];
  const out = [];
  for (const x of p) {
    const court = p.find((y) => y !== x && y.length < x.length && x.includes(y));
    if (!court) { out.push(x); continue; }
    const fin = x.startsWith(court) ? x.slice(court.length).replace(/^[\s.,;:]+/, '').trim() : '';
    if (fin.length >= 20) out.push(fin.charAt(0).toUpperCase() + fin.slice(1));
  }
  return out;
}

// La phrase phare : la plus courte et la plus forte entre la conviction et la première phrase de l'approche.
function phrasePhare(d) {
  const brute = (d.approche || []).map((t) => String(t || '').trim());
  d = { ...d, approche: sansDoublons(d.approche) };
  // un morceau recomposé par sansDoublons (la fin d'un paragraphe en double) ne devient jamais la phrase phare
  const cand = [d.conviction, ...(d.approche || []).filter((t) => brute.includes(t))].filter((t) => t && !place(t));
  if (!cand.length) return { phrase: '', reste: [] };
  // une phrase qui tient seule : pas de mot de liaison en tête, pas de chiffres ; on préfère la conviction et le « je »
  const note = (t) => {
    let n = 0;
    if (/^(cependant|mais|et|donc|de ce fait|ainsi|pourtant|par ailleurs|en effet|puis|alors|aussi|enfin|[éeÉE]galement|de plus|en outre|ensuite)\b/i.test(t.trim())) n -= 3;
    if (/\d/.test(t)) n -= 2;
    if (/\?\s*$/.test(t)) n -= 1;
    if (t === d.conviction) n += 1.5;
    if (/pour moi|c[’']est|mon approche|je |j[’']/i.test(t)) n += 1;
    if (t.length >= 30 && t.length <= 140) n += 1.2; else if (t.length > 140) n -= 1.2;
    return n - t.length / 600;
  };
  const phrase = cand.reduce((a, b) => (note(b) > note(a) ? b : a));
  const reste = [...(d.approche || []), d.conviction].filter((t) => t && t !== phrase && !place(t));
  return { phrase, reste: [...new Set(reste)] };
}

function mots(t) { return fr(t).split(/(\s+)/).map((m) => (/^\s+$/.test(m) || !m ? m : `<span class="m">${m}</span>`)).join(''); }

function roue(d) {
  const a = (d.apports || []).filter((x) => x && x.titre);
  if (!a.length) return '';
  const n = a.length;
  const angles = a.map((_, i) => -Math.PI / 2 + i / n * Math.PI * 2);
  const pos = angles.map((t) => [r1(50 + Math.cos(t) * 40), r1(50 + Math.sin(t) * 40)]);
  // le nom de chaque point se pose à l'extérieur du cercle, jamais sur le trait
  const cote = (t) => { const c = Math.cos(t), s = Math.sin(t); return Math.abs(c) > .72 ? (c > 0 ? 'droite' : 'gauche') : (s < 0 ? 'haut' : 'bas'); };
  const liens = n > 2 ? pos.map((p, i) => { const q = pos[(i + 1) % n]; return `M${p[0]} ${p[1]}L${q[0]} ${q[1]}`; }).join('') : '';
  return `
  <div class="roue" data-n="${n}">
    <svg class="roue-trace" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <circle class="roue-cercle" cx="50" cy="50" r="40" pathLength="1"/>
      <circle class="roue-cercle roue-cercle-2" cx="50" cy="50" r="46"/>
      <path class="roue-liens" d="${liens}"/>
      <circle class="roue-lumiere" cx="50" cy="50" r="40" pathLength="1"/>
    </svg>
    <ul class="roue-points" role="list">
      ${a.map((x, i) => `<li class="roue-point${i === 0 ? ' actif' : ''}" style="--x:${pos[i][0]}%;--y:${pos[i][1]}%" data-i="${i}" data-cote="${cote(angles[i])}">
        <button class="roue-nom" type="button" aria-pressed="${i === 0}"><span class="point" aria-hidden="true"></span><span>${fr(x.titre)}</span></button>
        <p class="roue-texte">${fr(x.texte)}</p>
      </li>`).join('')}
    </ul>
    <div class="roue-centre" aria-live="polite"></div>
  </div>
  <p class="roue-geste">Touchez un point du cercle.</p>`;
}

function approche(d) {
  const { phrase, reste } = phrasePhare(d);
  return `
<section class="trace" id="approche" aria-labelledby="approche-titre">
  <h2 class="titre" id="approche-titre">L’approche</h2>
  ${phrase ? `<p class="phrase${phrase.length > 110 ? ' phrase-longue' : ''}">${mots(phrase)}</p>` : `<p class="phrase emplacement">Ici, votre approche, avec vos mots : ce qui guide vos mains, ce que vous cherchez à offrir.</p>`}
  ${reste.length ? `<div class="trace-corps">${reste.map((p) => `<p>${fr(p)}</p>`).join('')}</div>` : ''}
  ${roue(d)}
</section>`;
}

// Zones annotées pour la séance, du haut vers le bas du dessin.
const AXE = {
  pied: ['tete', 'yeux', 'poitrine', 'plexus', 'reins', 'intestins', 'bassin'],
  main: ['majeur', 'index', 'paume', 'poignet'],
  silhouette: ['vesicule', 'poumon', 'estomac', 'rate', 'rein'],
  champ: ['champ'],
};
function seance(d, carte) {
  const etapes = (d.etapes || []).filter((e) => e && e.titre);
  const durees = [d.dureePremiere && `Première séance : ${d.dureePremiere}`, d.dureeSuivi && `Séances suivantes : ${d.dureeSuivi}`].filter(Boolean);
  const axe = AXE[carte];
  const n = etapes.length;
  return `
<section class="annotee" id="seance" aria-labelledby="seance-titre">
  <h2 class="titre" id="seance-titre">La séance</h2>
  <div class="annotee-grille" data-n="${n}">
    <div class="annotee-carte" data-carte="${carte}" aria-hidden="true"><div class="carte-boite" style="--ratio:${ratio(carte, true)}">${svgCarte(carte, 's', 'h', true)}</div></div>
    <div class="annotations">
      ${etapes.map((e, i) => {
        const z = axe[n > 1 ? Math.round(i * (axe.length - 1) / (n - 1)) : Math.floor(axe.length / 2)];
        const membre = carte === 'champ' ? 2 : 0;
        return `<div class="annot${place(e.texte) ? ' emplacement' : ''}" data-zone="${membre}-${z}" data-cote="${i % 2 ? 'd' : 'g'}">
        <h3>${fr(e.titre)}</h3>
        <p>${fr(e.texte)}</p>
        ${e.duree ? `<p class="annot-duree">${fr(e.duree)}</p>` : ''}
      </div>`;
      }).join('')}
      ${durees.length ? `<p class="annotee-durees">${durees.map(fr).join('<br>')}</p>` : ''}
    </div>
  </div>
</section>`;
}

function tarifs(d) {
  const t = (d.tarifs || []).filter((x) => x && x.nom);
  const meridien = (k) => `<svg class="meridien" viewBox="0 0 1000 40" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path class="meridien-fil" d="M0 20C140 6 260 34 400 20S660 6 800 20S940 30 1000 18"/><path class="meridien-lumiere" pathLength="1" style="--k:${k}" d="M0 20C140 6 260 34 400 20S660 6 800 20S940 30 1000 18"/></svg>`;
  return `
<section class="prix" id="tarifs" aria-labelledby="tarifs-titre">
  <h2 class="titre" id="tarifs-titre">Tarifs</h2>
  ${t.length ? t.map((x, i) => `
  <div class="tarif">
    <p class="tarif-nom">${fr(x.nom)}</p>
    <p class="tarif-prix">${fr(x.prix || 'Sur demande').replace(/€/g, '<span class="euro">€</span>')}</p>
    ${meridien(i)}
  </div>`).join('') : `
  <div class="tarif emplacement">
    <p class="tarif-nom">Ici, vos séances</p>
    <p class="tarif-prix tarif-vide">Vos tarifs</p>
    ${meridien(0)}
    <p class="prix-note">La durée de chaque séance, ce qu’elle comprend, et son prix, en toutes lettres.</p>
  </div>`}
  ${d.dureePremiere || d.dureeSuivi ? `<p class="prix-note">${[d.dureePremiere && `Première séance : ${fr(d.dureePremiere)}`, d.dureeSuivi && `séances suivantes : ${fr(d.dureeSuivi)}`].filter(Boolean).join(', ')}</p>` : ''}
  ${d.paiement ? `<p class="prix-note">${fr(d.paiement)}</p>` : ''}
</section>`;
}

// Rosace guillochée : des hypotrochoïdes superposées, au fil d'or, autour de l'emplacement du portrait.
function guilloche(seed) {
  const r = hasard(seed);
  let d = '';
  const couches = [[12, 7, 3.1, 132], [9, 5, 2.4, 142], [16, 9, 1.8, 150]];
  for (const [k, m, amp, R] of couches) {
    const ph = r() * Math.PI;
    for (let j = 0; j < 2; j++) {
      const pts = [];
      const N = 300;
      for (let i = 0; i < N; i++) {
        const t = i / N * Math.PI * 2;
        const rr = R + amp * 3 * Math.sin(k * t + ph + j * .5) + amp * Math.sin(m * t * 2 + j);
        pts.push([160 + Math.cos(t) * rr, 160 + Math.sin(t) * rr]);
      }
      d += poly(pts, true);
    }
  }
  return `<svg class="guilloche" viewBox="0 0 320 320" aria-hidden="true" focusable="false"><path d="${d}"/><ellipse class="guilloche-cadre" cx="160" cy="160" rx="104" ry="122"/><ellipse class="guilloche-cadre fin" cx="160" cy="160" rx="110" ry="128"/></svg>`;
}

function apropos(d) {
  const p = sansDoublons(d.apropos);
  return `
<section class="medaillon" id="apropos" aria-labelledby="apropos-titre">
  <figure class="medaillon-portrait">
    ${guilloche(graine(d.dossier || d.nom))}
    <div class="portrait-place"><span>Ici, votre portrait</span></div>
  </figure>
  <div class="medaillon-texte">
    <h2 class="titre" id="apropos-titre"><span class="titre-petit">À propos</span> ${esc(d.nom)}</h2>
    ${p.length ? p.map((x, i) => `<p${i === 0 ? ' class="lettrine"' : ''}>${fr(x)}</p>`).join('') : `<p class="emplacement">Ici, votre parcours : comment ce métier est venu à vous, vos formations, ce qui vous tient à cœur.</p>`}
  </div>
</section>`;
}

// Lignes de champ qui convergent vers le numéro (version fixe, sans JavaScript ; le JavaScript les anime).
function champFixe(seed) {
  const r = hasard(seed);
  let d = '';
  for (let i = 0; i < 46; i++) {
    const a = i / 46 * Math.PI * 2 + r() * .05;
    const x0 = 500 + Math.cos(a) * 760, y0 = 300 + Math.sin(a) * 520;
    const tw = (r() - .5) * .9;
    const cx = 500 + Math.cos(a + tw) * 330, cy = 300 + Math.sin(a + tw) * 220;
    d += `M${r1(x0)} ${r1(y0)}Q${r1(cx)} ${r1(cy)} ${r1(500 + Math.cos(a) * 60)} ${r1(300 + Math.sin(a) * 34)}`;
  }
  return `<svg class="champ-fixe" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"><path d="${d}"/></svg>`;
}

function contact(d) {
  const resa = /resalib\.fr/i.test(d.resalib || '') ? lien(d.resalib) : '';
  const fb = lien(d.facebook);
  const lieu = [d.ville, d.cp && `(${d.cp})`].filter(Boolean).join(' ');
  return `
<section class="rencontre" id="contact" aria-labelledby="contact-titre">
  ${champFixe(graine(d.nom))}
  <div class="rencontre-coeur">
    <h2 class="titre" id="contact-titre">Prendre <x-nobr>rendez-vous</x-nobr></h2>
    <p class="rencontre-rdv">${fr(d.rdv || 'Sur rendez-vous')}${d.ville ? `, à ${esc(d.ville)}` : ''}</p>
    ${d.tel ? `<a class="tel" href="${esc(d.telLien)}">${esc(d.tel)}</a>` : `<p class="tel emplacement">Ici, votre numéro</p>`}
    <div class="actions">
      ${d.tel ? `<a class="bouton" href="${esc(d.telLien)}">${esc(d.appeler || 'Appeler')}</a>` : ''}
      ${resa ? `<a class="appel" href="${resa}" rel="noopener" target="_blank"><span class="point" aria-hidden="true"></span>Réserver en ligne</a>` : ''}
      ${fb ? `<a class="appel" href="${fb}" rel="noopener" target="_blank"><span class="point" aria-hidden="true"></span>Facebook</a>` : ''}
    </div>
  </div>
  <dl class="infos legende">
    <div><dt>Où</dt><dd>${lieu ? fr(lieu) + ', ' : ''}<span class="emplacement">${lieu ? 'ici, l’adresse du cabinet et l’accès' : 'Ici, votre ville, l’adresse du cabinet et l’accès'}</span></dd></div>
    <div><dt>Quand</dt><dd><span class="emplacement">Ici, vos jours et vos horaires</span></dd></div>
    ${d.paiementListe ? `<div><dt>Règlement</dt><dd>${fr(d.paiementListe.charAt(0).toUpperCase() + d.paiementListe.slice(1))}</dd></div>` : ''}
  </dl>
</section>`;
}

function pied(d) {
  return `
<footer class="pied" id="pied">
  <p class="pied-sceau" aria-hidden="true">${esc(d.initiales || '')}</p>
  <p class="pied-nom">${esc(d.nom)}<span>${esc(d.metier)}${d.ville ? ' · ' + esc(d.ville) : ''}</span></p>
  <p class="pied-avert">${fr(d.avertissement)}</p>
  <p class="pied-apercu">Aperçu préparé pour ${esc(d.nom)}. Textes, photos, couleurs : tout se modifie selon vos goûts.</p>
  <p class="pied-apercu">On peut partir de cet univers, en marier deux, ou repartir d’une page blanche, jusqu’au site qui vous ressemble exactement.</p>
  ${d.siret ? `<p class="pied-legal">SIRET ${esc(d.siret)}</p>` : ''}
  <a class="pied-haut" href="#accueil">Revenir en haut</a>
</footer>`;
}

export function rendre(d, { carte: force } = {}) {
  const carte = choisirCarte(d, force);
  return tete(d) + '\n<main id="contenu">' + accueil(d, carte) + approche(d) + seance(d, carte) + tarifs(d) + apropos(d) + contact(d) + '\n</main>' + pied(d);
}
