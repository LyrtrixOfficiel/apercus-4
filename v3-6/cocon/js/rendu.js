// Cocon : la page entière depuis la fiche JSON d'un praticien.
// Même module dans le navigateur (?p=<dossier>) et dans node (batir.mjs écrit la page par défaut : lisible sans JavaScript).
import { famille } from '../../commun/familles.js';
import { nettoyer } from '../../commun/phrases.js';
import { pratique } from '../../commun/pratiques.js';

// Le ton de Cocon selon la pratique (pour les relectures) : la naissance, les tout-petits, ou la famille.
export const tonDe = (d) => ({ perinat: 'naissance', bebe: 'tout-petits', parent: 'famille et éducation' }[pratique(d).id] || 'famille, ton doux');

const ENT = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s = '') => String(s ?? '').replace(/[&<>"']/g, (c) => ENT[c]).replace(new RegExp(String.fromCharCode(91, 8211, 8212, 93), 'g'), ',');
export const fr = (s = '') => esc(String(s).trim()).replace(/\s+([:;!?»])/g, ' $1').replace(/«\s*/g, '« ').replace(/(rendez-vous)/gi, '<x-nobr>$1</x-nobr>').replace(/(\d) (€|h\b|min\b)/g, '$1 $2');
const lien = (u) => (/^https?:\/\//i.test(u || '') ? esc(u) : '');
const place = (t) => /^Ici,/.test(String(t || '').trim());
const r1 = (v) => Math.round(v * 10) / 10;
export function graine(t = '') { let h = 2166136261; for (const c of String(t)) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
export function hasard(g) { let s = (g >>> 0) || 1; return () => ((s = Math.imul(s ^ (s >>> 15), 2246822507) ^ Math.imul(s ^ (s >>> 13), 3266489909)) >>> 0) / 4294967296; }

export function titre(d) { return `${d.nom} · ${d.metier}${d.ville ? ' à ' + d.ville : ''}`; }
export function description(d) { return nettoyer(d).accroche || `${d.metier}${d.ville ? ' à ' + d.ville : ''}, sur rendez-vous.`; }
export function palette(d, univers, demande) {
  const P = univers.palettes;
  return P.find((p) => p.id === demande) || P.find((p) => (p.defautPour || []).includes(famille(d))) || P[0];
}
export function stylePalette(p) { const c = p.couleurs; return `--fond:${c.fond};--encre:${c.encre};--accent:${c.accent};--accent2:${c.accent2}`; }

// Le nom : le début en Young Serif, la fin comme écrite à la main (ce qui suit « d’ », ou le dernier mot avec sa particule).
function nomCompose(nom) {
  const n = String(nom || '').trim();
  const m = n.match(/^(.*?)\s+(d[’']\S.*)$/i);
  let tete, fin;
  if (m) { tete = m[1]; fin = m[2]; }
  else {
    const mots = n.split(/\s+/);
    if (mots.length < 2) return { html: esc(n), taille: n.length > 14 ? 'long' : '' };
    const k = mots.length > 2 && /^(le|la|de|du|des|van|von|di|da)$/i.test(mots.at(-2)) ? 2 : 1;
    tete = mots.slice(0, -k).join(' '); fin = mots.slice(-k).join(' ');
  }
  const taille = n.length > 30 ? 'tres-long' : n.length > 18 ? 'long' : '';
  return { html: `<span class="nom-a">${esc(tete)}</span> <span class="nom-b">${esc(fin)}</span>`, taille };
}
// paragraphes en double (« Bienvenue ... Je suis ... » puis « Je suis ... ») : on garde le plus net ;
// si le plus long ajoute une phrase à la fin du plus court, on garde seulement cette phrase en plus
function sansDoublons(ps) {
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

// Lune de papier : la phase change d'une section à l'autre (croissant, demi, gibbeuse, pleine), comme une attente.
export function lune(phase, cl = '') {
  const R = 40, k = Math.cos(phase * Math.PI); // 1 nouvelle, -1 pleine
  const terminateur = `A${r1(Math.abs(k) * R)} ${R} 0 0 ${k > 0 ? 0 : 1} 50 10`;
  const d = phase >= 1 ? `M50 10A40 40 0 1 1 49.9 10Z` : `M50 10A40 40 0 0 1 50 90${terminateur}Z`;
  return `<svg class="lune ${cl}" viewBox="0 0 100 100" aria-hidden="true" focusable="false"><circle class="lune-ombre" cx="50" cy="50" r="40"/><path class="lune-claire" d="${d}"/></svg>`;
}

// Le mobile en papier, dessiné sans WebGL (page sans JavaScript, ou repli) : mêmes éléments que la scène 3D.
function nuage(cx, cy, s) {
  return `M${r1(cx - 52 * s)} ${r1(cy + 14 * s)}c${r1(-14 * s)} 0 ${r1(-22 * s)} ${r1(-12 * s)} ${r1(-17 * s)} ${r1(-24 * s)}c${r1(5 * s)} ${r1(-11 * s)} ${r1(19 * s)} ${r1(-15 * s)} ${r1(30 * s)} ${r1(-9 * s)}c${r1(4 * s)} ${r1(-20 * s)} ${r1(27 * s)} ${r1(-31 * s)} ${r1(45 * s)} ${r1(-20 * s)}c${r1(12 * s)} ${r1(-12 * s)} ${r1(36 * s)} ${r1(-8 * s)} ${r1(40 * s)} ${r1(10 * s)}c${r1(16 * s)} ${r1(-2 * s)} ${r1(27 * s)} ${r1(10 * s)} ${r1(23 * s)} ${r1(24 * s)}c${r1(-2 * s)} ${r1(9 * s)} ${r1(-10 * s)} ${r1(15 * s)} ${r1(-19 * s)} ${r1(15 * s)}Z`;
}
function etoile(cx, cy, R, r) {
  let d = '';
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r : R; d += `${i ? 'L' : 'M'}${r1(cx + Math.cos(a) * rr)} ${r1(cy + Math.sin(a) * rr)}`; }
  return d + 'Z';
}
export function mobileSvg(initiales = '') {
  // anneau en perspective, fils, puis les éléments (chacun dans un groupe qui se balance en CSS)
  const el = [
    { x: 300, y: 300, fil: 230, f: `<path class="m-lune" d="M300 228a72 72 0 1 0 60 112a58 58 0 1 1 -60 -112Z"/>`, d: 0 },
    { x: 168, y: 214, fil: 120, f: `<path class="m-nuage" d="${nuage(168, 236, 1)}"/><text class="m-initiales" x="166" y="242" text-anchor="middle">${esc(initiales)}</text>`, d: 1.3 },
    { x: 438, y: 248, fil: 160, f: `<path class="m-nuage" d="${nuage(438, 268, .82)}"/>`, d: 2.1 },
    { x: 226, y: 340, fil: 268, f: `<path class="m-etoile" d="${etoile(226, 362, 26, 11)}"/>`, d: .7 },
    { x: 382, y: 352, fil: 280, f: `<path class="m-etoile m-etoile-2" d="${etoile(382, 374, 22, 9.5)}"/>`, d: 1.8 },
    { x: 118, y: 300, fil: 222, f: `<circle class="m-boule" cx="118" cy="316" r="12"/>`, d: 2.6 },
    { x: 486, y: 330, fil: 252, f: `<circle class="m-boule m-boule-2" cx="486" cy="344" r="10"/>`, d: .4 },
  ];
  return `<svg class="mobile-svg" viewBox="40 -10 520 440" aria-hidden="true" focusable="false">
  <path class="m-fil" d="M300 -10V40M300 40L170 78M300 40L430 78M300 40V70"/>
  <ellipse class="m-anneau" cx="300" cy="80" rx="190" ry="26"/>
  ${el.map((e) => `<g class="m-pendant" style="--d:${e.d}s;transform-origin:${e.x}px 80px"><path class="m-fil" d="M${e.x} ${e.x === 300 ? 40 : 80}V${e.y}"/>${e.f}</g>`).join('')}
  </svg>`;
}

function tete(d) {
  return `
<header class="tete" id="tete">
  <a class="sceau" href="#accueil" aria-label="${esc(d.nom)}, revenir en haut">${esc(d.initiales || '')}</a>
  <nav class="tete-liens" aria-label="Sections"><a href="#approche">L’approche</a><a href="#seance">La séance</a><a href="#tarifs">Tarifs</a><a href="#apropos">À propos</a></nav>
  <a class="tete-rdv" href="#contact"><x-nobr>Rendez-vous</x-nobr></a>
</header>`;
}

function accueil(d) {
  const N = nomCompose(d.nom);
  const lieu = [esc(d.metier), d.ville && `à ${esc(d.ville)}`].filter(Boolean).join(' ');
  return `
<section class="berceau" id="accueil" aria-labelledby="nom">
  <div class="scene" aria-hidden="true">${mobileSvg(d.initiales)}</div>
  <div class="berceau-titre">
    <p class="metier">${lieu}</p>
    <h1 class="nom ${N.taille ? 'nom-' + N.taille : ''}" id="nom">${N.html}</h1>
  </div>
  <div class="berceau-suite">
    <p class="accroche">${fr(d.accroche)}</p>
    <div class="actions">
      <a class="bouton" href="#contact"><x-nobr>Prendre rendez-vous</x-nobr></a>
      ${d.tel ? `<a class="lien-tel" href="${esc(d.telLien)}">${esc(d.tel)}</a>` : ''}
    </div>
  </div>
  <p class="geste">Faites tourner le mobile du bout du doigt.</p>
</section>`;
}

// La dédicace du carnet : la phrase d'ouverture choisie par la règle commune des 11 univers (commun/phrases.js),
// sa conviction d'abord ; jamais une promesse, un prix, une durée ni un liant.
function dedicaceEtReste(d) {
  const { phare, reste } = nettoyer(d).phrases;
  return { dedicace: phare, reste: reste.filter((t) => t && !place(t)) };
}

function approche(d) {
  const { dedicace, reste } = dedicaceEtReste(d);
  const apports = (d.apports || []).filter((a) => a && a.titre);
  return `
<section class="carnet" id="approche" aria-labelledby="approche-titre">
  <div class="livre">
    <div class="page page-g">
      ${lune(.28, 'lune-page')}
      <h2 class="titre" id="approche-titre">L’approche</h2>
      ${dedicace ? `<p class="dedicace${dedicace.length > 110 ? ' dedicace-longue' : ''}">${fr(dedicace)}</p>` : `<p class="dedicace emplacement">Ici, la phrase qui vous ressemble.</p>`}
    </div>
    <div class="page page-d">
      ${reste.map((p) => `<p>${fr(p)}</p>`).join('') || (dedicace ? '' : `<p class="emplacement">Ici, votre approche, avec vos mots : comment vous accompagnez, ce qui compte pour vous.</p>`)}
      ${apports.length ? `<dl class="champs">${apports.map((a) => `<div class="champ"><dt>${fr(a.titre)}</dt><dd>${fr(a.texte)}</dd></div>`).join('')}</dl>` : ''}
    </div>
    <span class="signet" aria-hidden="true"></span>
  </div>
</section>`;
}

// Une crête de colline découpée dans le papier
// Un arbre de papier découpé, jamais deux fois le même : sapin à étages aux branches qui retombent, arbre rond à
// la couronne bosselée, ou peuplier élancé. Une moitié plus claire, comme un papier plié en deux.
function arbrePapier(r, genre) {
  const f = (v) => r1(v);
  if (genre < .4) { // sapin : trois étages, bords en dents de scie souples
    let g = '', dr = '';
    const etages = [[4, 22, 9], [14, 34, 13], [25, 48, 17]];
    for (const [haut, bas, demi] of etages) {
      const dents = 3, pts = [];
      for (let i = 0; i <= dents; i++) { const u = i / dents, xx = 20 - demi * u, yy = haut + (bas - haut) * u; pts.push([xx, yy], [xx + 2.2 + r(), yy + 1.6]); }
      g += `M20 ${f(haut - (haut === 4 ? 2 : 0))}` + pts.map(([a, b]) => `L${f(a)} ${f(b)}`).join('') + `L20 ${f(bas - 1)}Z`;
      dr += `M20 ${f(haut - (haut === 4 ? 2 : 0))}` + pts.map(([a, b]) => `L${f(40 - a)} ${f(b)}`).join('') + `L20 ${f(bas - 1)}Z`;
    }
    return `<path d="${g}"/><path class="pli" d="${dr}"/><rect x="18.4" y="46" width="3.2" height="13" rx="1"/>`;
  }
  if (genre < .8) { // arbre rond : une couronne de bosses
    const n = 7, cx = 20, cy = 21, R = 13.5;
    let d = '';
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2 - Math.PI / 2, a1 = ((i + 1) / n) * Math.PI * 2 - Math.PI / 2, rr = R * (.92 + r() * .14);
      const p0 = [cx + Math.cos(a0) * rr, cy + Math.sin(a0) * rr], p1 = [cx + Math.cos(a1) * rr, cy + Math.sin(a1) * rr];
      d += `${i ? '' : `M${f(p0[0])} ${f(p0[1])}`}A${f(rr * .48)} ${f(rr * .48)} 0 0 1 ${f(p1[0])} ${f(p1[1])}`;
    }
    const tronc = `<path class="tronc" d="M18.6 59V33L14.5 27.5M18.6 36L23.5 29.5M21.4 59V33.5" />`;
    return `<path d="${d}Z"/><path class="pli" d="M20 ${f(cy - R)}V${f(cy + R)}A${f(R)} ${f(R)} 0 0 0 20 ${f(cy - R)}Z"/>${tronc}<rect x="18.4" y="33" width="3.2" height="26" rx="1"/>`;
  }
  // peuplier élancé
  const h = 44 + r() * 6;
  return `<path d="M20 ${f(52 - h)}C28 ${f(60 - h)} 27.5 40 20 47C12.5 40 12 ${f(60 - h)} 20 ${f(52 - h)}Z"/><path class="pli" d="M20 ${f(52 - h)}C28 ${f(60 - h)} 27.5 40 20 47Z"/><rect x="18.6" y="44" width="2.8" height="15" rx="1"/>`;
}

function crete(seed, k) {
  const r = hasard(seed + k * 97);
  const pts = [];
  const n = 5 + Math.floor(r() * 3);
  for (let i = 0; i <= n; i++) pts.push([i / n * 1000, 40 + r() * 60 - (i === Math.floor(n / 2) ? 26 : 0)]);
  let d = `M0 ${r1(pts[0][1])}`;
  for (let i = 1; i < pts.length; i++) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i]; d += `C${r1(x0 + (x1 - x0) * .5)} ${r1(y0)} ${r1(x0 + (x1 - x0) * .5)} ${r1(y1)} ${r1(x1)} ${r1(y1)}`; }
  // un à trois arbres de papier découpé posés sur la crête (sur des points exacts de la courbe, jamais aux bords)
  const places = pts.slice(1, -1).map((p, i) => ({ p, o: r() })).sort((a, b) => a.o - b.o).slice(0, 2 + Math.floor(r() * 2.6));
  const arbres = places.map(({ p: [x, y] }) => {
    const genre = r(), t = (.75 + r() * .5).toFixed(2);
    return `<svg class="arbre" viewBox="0 0 40 60" style="left:${r1(x / 10)}%;--y:${(y / 140).toFixed(3)};--t:${t}" aria-hidden="true" focusable="false">${arbrePapier(r, genre)}</svg>`;
  }).join('');
  return `<svg class="crete" viewBox="0 0 1000 140" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d="${d}V140H0Z"/></svg>${arbres}`;
}

function seance(d) {
  const etapes = (d.etapes || []).filter((e) => e && e.titre);
  const durees = [d.dureePremiere && `Première rencontre : ${d.dureePremiere}`, d.dureeSuivi && `Rencontres suivantes : ${d.dureeSuivi}`].filter(Boolean);
  const texte = [d.accroche, ...(d.approche || []), ...(d.apropos || []), ...(etapes.map((e) => e.texte))].join(' ');
  // la ligne médicale seulement pour la naissance et les tout-petits, jamais pour la parentalité ou l'éducation
  const complement = ['perinat', 'bebe'].includes(pratique(d).id) && !/compl[ée]ment|substitu|remplac/i.test(texte);
  const s = graine(d.dossier || d.nom);
  const n = etapes.length;
  return `
<section class="paysage" id="seance" aria-labelledby="seance-titre">
  <div class="ciel">
    <h2 class="titre" id="seance-titre">${etapes.some((e) => /^la s[ée]ance\.?$/i.test(String(e?.titre || '').trim())) ? 'Le temps d’une séance' : 'La séance'}</h2>
    <div class="ciel-papier" aria-hidden="true">
      ${lune(.5, 'lune-ciel')}
      <svg class="nuage-papier n1" viewBox="40 170 260 100"><path d="${nuage(168, 236, 1)}"/></svg>
      <svg class="nuage-papier n2" viewBox="40 170 260 100"><path d="${nuage(168, 236, 1)}"/></svg>
      <svg class="etoile-papier e1" viewBox="0 0 60 60"><path d="${etoile(30, 31, 27, 11.5)}"/><path class="pli" d="M30 4V31M4.3 22.7L30 31M14.1 52.8L30 31M45.9 52.8L30 31M55.7 22.7L30 31"/></svg>
      <svg class="etoile-papier e2" viewBox="0 0 60 60"><path d="${etoile(30, 31, 27, 11.5)}"/><path class="pli" d="M30 4V31M4.3 22.7L30 31M14.1 52.8L30 31M45.9 52.8L30 31M55.7 22.7L30 31"/></svg>
    </div>
  </div>
  <div class="collines" style="--n:${n}">
    ${etapes.map((e, i) => `
    <div class="colline${place(e.texte) ? ' emplacement' : ''}" style="--k:${i};--p:${n > 1 ? (i / (n - 1)).toFixed(2) : 0}" data-cote="${i % 2 ? 'd' : 'g'}">
      ${crete(s, i)}
      <div class="colline-corps">
        <h3>${fr(e.titre)}</h3>
        <p>${fr(e.texte)}</p>
        ${e.duree ? `<p class="colline-duree">${fr(e.duree)}</p>` : ''}
      </div>
    </div>`).join('')}
    <div class="colline colline-sol${durees.length || complement ? '' : ' colline-vide'}" style="--k:${n}">
      ${crete(s, n)}
      <div class="colline-corps">
        ${durees.map((x) => `<p class="colline-duree">${fr(x)}</p>`).join('')}
        ${complement ? `<p class="colline-note">Cet accompagnement vient en complément du suivi médical, il ne le remplace pas.</p>` : ''}
      </div>
    </div>
  </div>
</section>`;
}

function tarifs(d) {
  const t = (d.tarifs || []).filter((x) => x && x.nom);
  const euro = (s) => s.replace(/€/g, '<span class="euro">€</span>');
  return `
<section class="fairepart" id="tarifs" aria-labelledby="tarifs-titre">
  <div class="fp">
    <div class="fp-haut">
      <div class="fp-recto">
        ${lune(.78, 'lune-fp')}
        <h2 class="titre" id="tarifs-titre">Tarifs</h2>
        <p class="fp-sous">${fr(d.rdv || 'Sur rendez-vous')}</p>
      </div>
    </div>
    <div class="fp-bas">
      ${t.length ? t.map((x) => `<div class="fp-ligne"><p class="fp-nom">${fr(x.nom)}</p><p class="fp-prix">${euro(fr(x.prix || 'Sur demande'))}</p></div>`).join('') : `<div class="fp-ligne emplacement"><p class="fp-nom">Ici, vos rencontres et vos formules</p><p class="fp-prix fp-vide">Vos tarifs</p><p class="fp-note">La durée de chaque rencontre, ce qu’elle comprend, son prix.</p></div>`}
      ${d.paiement ? `<p class="fp-note">${fr(d.paiement)}</p>` : ''}
      ${d.dureePremiere || d.dureeSuivi ? `<p class="fp-note">${[d.dureePremiere && `Première rencontre : ${fr(d.dureePremiere)}`, d.dureeSuivi && `ensuite : ${fr(d.dureeSuivi)}`].filter(Boolean).join(', ')}</p>` : ''}
    </div>
  </div>
</section>`;
}

function apropos(d) {
  const p = sansDoublons(d.apropos || []);
  return `
<section class="tambour" id="apropos" aria-labelledby="apropos-titre">
  <figure class="cerceau">
    <svg viewBox="0 0 400 440" aria-hidden="true" focusable="false">
      <defs><clipPath id="toile"><ellipse cx="200" cy="240" rx="166" ry="166"/></clipPath>
      <pattern id="trame" width="5" height="5" patternUnits="userSpaceOnUse"><rect width="5" height="5" class="lin"/><path d="M0 1.2H5M0 3.7H5" class="lin-fil"/><path d="M1.2 0V5M3.7 0V5" class="lin-fil lin-fil-2"/></pattern>
      <radialGradient id="lin-ombre" cx=".5" cy=".42" r=".6"><stop offset=".7" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".16"/></radialGradient></defs>
      <ellipse cx="200" cy="240" rx="166" ry="166" fill="url(#trame)"/>
      <ellipse cx="200" cy="240" rx="166" ry="166" fill="url(#lin-ombre)"/>
      <g clip-path="url(#toile)">
        <path class="brin" d="M150 318C168 286 196 252 246 216"/>
        <path class="brin-feuille" d="M163 297c-14-2-24-10-26-22 13 0 23 8 26 22ZM170 289c4-13 14-21 27-21-2 13-13 21-27 21ZM186 268c-13-4-21-13-21-25 12 2 20 11 21 25ZM195 260c6-12 17-18 29-16-4 12-16 18-29 16ZM213 243c-11-6-17-16-15-27 11 4 17 14 15 27ZM224 236c8-10 19-14 31-10-6 11-18 15-31 10Z"/>
        <circle class="brin-fleur" cx="248" cy="213" r="5"/>
      </g>
      <text class="brode" x="200" y="352" text-anchor="middle">Ici, votre portrait</text>
      <ellipse class="bois" cx="200" cy="240" rx="176" ry="176"/>
      <ellipse class="bois-2" cx="200" cy="240" rx="184" ry="184"/>
      <path class="vis" d="M188 52h24v20h-24zM194 40h12v12h-12z"/>
    </svg>
  </figure>
  <div class="tambour-texte">
    <h2 class="titre" id="apropos-titre">À propos</h2>
    <p class="tambour-nom">${esc(d.nom)}</p>
    ${p.length ? p.map((x) => `<p>${fr(x)}</p>`).join('') : `<p class="emplacement">Ici, votre parcours : comment ce métier est venu à vous, vos formations, ce qui vous tient à cœur.</p>`}
  </div>
</section>`;
}

function contact(d) {
  const resa = /resalib\.fr/i.test(d.resalib || '') ? lien(d.resalib) : '';
  const fb = lien(d.facebook);
  const lieu = [d.ville, d.cp && `(${d.cp})`].filter(Boolean).join(' ');
  return `
<section class="veille allumee" id="contact" aria-labelledby="contact-titre">
  ${ciel(graine(d.nom) + 11, 34, 160, 600)}
  <button class="veilleuse" type="button" aria-pressed="true" aria-label="Allumer ou éteindre la veilleuse">
    <span class="halo" aria-hidden="true"></span>
    <svg viewBox="0 0 200 230" aria-hidden="true" focusable="false">
      <defs><radialGradient id="globe" cx=".42" cy=".38" r=".7"><stop offset="0" class="globe-a"/><stop offset=".7" class="globe-b"/><stop offset="1" class="globe-c"/></radialGradient></defs>
      <circle class="globe" cx="100" cy="96" r="80" fill="url(#globe)"/>
      <g class="crateres"><circle cx="72" cy="78" r="12"/><circle cx="122" cy="118" r="17"/><circle cx="128" cy="64" r="7"/><circle cx="80" cy="128" r="6"/></g>
      <path class="socle" d="M58 182h84c6 0 10 4 10 10v8c0 6-4 10-10 10H58c-6 0-10-4-10-10v-8c0-6 4-10 10-10Z"/>
      <path class="socle-ligne" d="M54 196h92"/>
    </svg>
  </button>
  <div class="veille-texte">
    <h2 class="titre" id="contact-titre">Prendre <x-nobr>rendez-vous</x-nobr></h2>
    <p class="veille-rdv">${fr(d.rdv || 'Sur rendez-vous')}${d.ville ? `, à ${esc(d.ville)}` : ''}</p>
    ${d.tel ? `<a class="tel" href="${esc(d.telLien)}">${esc(d.tel)}</a>` : `<p class="tel emplacement">Ici, votre numéro</p>`}
    <div class="actions">
      ${d.tel ? `<a class="bouton" href="${esc(d.telLien)}">${esc(d.appeler || 'Appeler')}</a>` : ''}
      ${resa ? `<a class="lien-tel" href="${resa}" rel="noopener" target="_blank">Réserver en ligne</a>` : ''}
      ${fb ? `<a class="lien-tel" href="${fb}" rel="noopener" target="_blank">Facebook</a>` : ''}
    </div>
    <dl class="infos">
      <div><dt>Où</dt><dd>${lieu ? fr(lieu) + ', ' : ''}<span class="emplacement">${lieu ? 'ici, le lieu de vos rencontres, à domicile ou au cabinet' : 'Ici, votre ville et le lieu de vos rencontres, à domicile ou au cabinet'}</span></dd></div>
      <div><dt>Quand</dt><dd><span class="emplacement">Ici, vos jours et vos horaires</span></dd></div>
      ${d.paiementListe ? `<div><dt>Règlement</dt><dd>${fr(d.paiementListe.charAt(0).toUpperCase() + d.paiementListe.slice(1))}</dd></div>` : ''}
    </dl>
  </div>
</section>`;
}

// un ciel d'étoiles (pied de page, et la nuit du contact sous la veilleuse)
function ciel(g, n, y0, y1) {
  const r = hasard(g);
  let s = '';
  for (let i = 0; i < n; i++) s += `<circle cx="${r1(r() * 1000)}" cy="${r1(y0 + r() * (y1 - y0))}" r="${r1(.6 + r() * 1.3)}" style="--t:${r1(r() * 6)}s"/>`;
  return `<svg class="pied-ciel" viewBox="0 0 1000 ${y1}" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">${s}</svg>`;
}

function pied(d) {
  const r = hasard(graine(d.nom) + 5);
  let ciel = '';
  for (let i = 0; i < 46; i++) ciel += `<circle cx="${r1(r() * 1000)}" cy="${r1(r() * 300)}" r="${r1(.6 + r() * 1.3)}" style="--t:${r1(r() * 6)}s"/>`;
  return `
<footer class="pied" id="pied">
  <svg class="pied-ciel" viewBox="0 0 1000 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">${ciel}</svg>
  <p class="pied-nom">${esc(d.nom)}</p>
  <p class="pied-metier">${esc(d.metier)}${d.ville ? ' · ' + esc(d.ville) : ''}</p>
  <p class="pied-avert">${fr(d.avertissement)}</p>
  <p class="pied-apercu">Aperçu préparé pour ${esc(d.nom)}. Textes, photos, couleurs : tout se modifie selon vos goûts.</p>
  <p class="pied-apercu">On peut partir de cet univers, en marier deux, ou repartir d’une page blanche, jusqu’au site qui vous ressemble exactement.</p>
  ${d.siret ? `<p class="pied-legal">SIRET ${esc(d.siret)}</p>` : ''}
  <a class="pied-haut" href="#accueil">Revenir en haut</a>
</footer>`;
}

export function rendre(d) {
  d = nettoyer(d);
  return tete(d) + '\n<main id="contenu">' + accueil(d) + approche(d) + seance(d) + tarifs(d) + apropos(d) + contact(d) + '\n</main>' + pied(d);
}
