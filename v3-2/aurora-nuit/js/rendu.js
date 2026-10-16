// Aurora Nuit : rendu de la page depuis la fiche JSON d'un praticien.
// Le meme module sert dans le navigateur (adresse ?p=<dossier>) et dans node
// (batir.mjs ecrit la page par defaut en dur, lisible sans JavaScript).
import { IMAGES } from './univers.js';
import { rangerApproche, sansRedites, propre } from './phrases.js';
// La page se raconte comme une nuit claire : le nom en etoiles, chaque theme une
// constellation, la seance du crepuscule a l'aube, les tarifs graves sur une carte du ciel.

// Tirets cadratin et demi-cadratin, ecrits par leur code : jamais dans le texte rendu.
const TIRETS = new RegExp('[' + String.fromCharCode(8211, 8212) + ']', 'g');
const ENT = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s = '') => String(s ?? '').replace(/[&<>"']/g, (c) => ENT[c]);
const FINE = String.fromCharCode(8239), INSEC = String.fromCharCode(8209);
// Typographie francaise : espace fine insecable avant : ; ! ? et dans les guillemets.
const fr = (s = '') => esc(s).replace(/ ([:;!?»])/g, FINE + '$1').replace(/« /g, '«' + FINE).replace(TIRETS, ',').replace(/rendez-vous/g, 'rendez' + INSEC + 'vous');
const lien = (u) => (/^https?:\/\//i.test(u || '') ? esc(u) : '');
const place = (t) => /^Ici,/.test((t || '').trim());

export function graine(texte = '') {
  let h = 1779033703 ^ texte.length;
  for (let i = 0; i < texte.length; i++) { h = Math.imul(h ^ texte.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  return h >>> 0;
}
export function hasard(s) { return () => { s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const f1 = (n) => Math.round(n * 10) / 10;

// Les mots du praticien rangés (doublons, phrase d'ouverture choisie) : voir phrases.js.
// Les phrases de prix ou de durée de son approche rejoignent les tarifs.
const AUX_TARIFS = /(\bprix\b|\btarif|€|\beuros?\b|\bdur[ée]e?\b|\bdure\b)/i;
const approcheRangee = (d) => rangerApproche(d, { ecarter: AUX_TARIFS });
const parcours = (d) => sansRedites((d.apropos || []).filter(Boolean), [d.cerf]);

// Un nom a l'envers (« Meyer Sandrine ») est remis a l'endroit quand ses propres textes disent « Sandrine Meyer ».
export function aLEndroit(d) {
  const mots = String(d?.nom || '').trim().split(/\s+/);
  if (mots.length !== 2) return d;
  const textes = [d.accroche, d.conviction, ...(d.approche || []), ...(d.apropos || [])].join(' ');
  if (!textes.includes(mots[1] + ' ' + mots[0])) return d;
  return { ...d, nom: mots[1] + ' ' + mots[0], initiales: (mots[1][0] + mots[0][0]).toUpperCase() };
}

export function titre(d) { return `${d.nom} · ${d.metier}${d.ville ? ' à ' + d.ville : ''}`; }
export function description(d) { return d.accroche || `${d.metier}${d.ville ? ' à ' + d.ville : ''}, sur rendez-vous.`; }

// Une constellation dessinee depuis une graine : des etoiles espacees, reliees en une ligne qui serpente
// (et parfois une branche), quelques etoiles plus brillantes.
export function asterisme(seed, { l = 280, h = 190, n = 0, classe = 'asterisme' } = {}) {
  const r = hasard(seed), N = n || 5 + Math.floor(r() * 3), pts = [];
  for (let essai = 0; pts.length < N && essai < 400; essai++) {
    const p = [18 + r() * (l - 36), 16 + r() * (h - 32)];
    if (pts.every((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) > Math.min(l, h) * .26)) pts.push(p);
  }
  // chaine du plus a gauche vers le plus proche, puis une branche eventuelle
  const reste = pts.slice().sort((a, b) => a[0] - b[0]), chaine = [reste.shift()];
  while (reste.length) { const der = chaine[chaine.length - 1]; reste.sort((a, b) => Math.hypot(a[0] - der[0], a[1] - der[1]) - Math.hypot(b[0] - der[0], b[1] - der[1])); chaine.push(reste.shift()); }
  const branche = chaine.length > 5 ? [chaine[2], chaine[chaine.length - 1]] : null;
  const d = 'M' + chaine.map((p) => `${f1(p[0])} ${f1(p[1])}`).join('L');
  const etoiles = chaine.map((p, i) => { const b = r() < .3 ? 1 : 0; return `<circle class="ast-etoile${b ? ' ast-vive' : ''}" cx="${f1(p[0])}" cy="${f1(p[1])}" r="${b ? 3.2 : 1.6 + r() * 1.1}" style="--k:${i}"/>`; }).join('');
  return `<svg class="${classe}" viewBox="0 0 ${l} ${h}" aria-hidden="true" focusable="false"><path class="ast-lien" pathLength="1" d="${d}"/>${branche ? `<path class="ast-lien ast-branche" pathLength="1" d="M${f1(branche[0][0])} ${f1(branche[0][1])}L${f1(branche[1][0])} ${f1(branche[1][1])}"/>` : ''}${etoiles}</svg>`;
}

// Le chargement : une carte du ciel gravee qui se trace autour des initiales (hors de #site).
export function chargement(d) {
  let graduations = '';
  for (let a = 0; a < 72; a++) { const t = a / 72 * Math.PI * 2, r1 = 168, r2 = a % 6 ? 174 : 182; graduations += `M${f1(200 + Math.cos(t) * r1)} ${f1(200 + Math.sin(t) * r1)}L${f1(200 + Math.cos(t) * r2)} ${f1(200 + Math.sin(t) * r2)}`; }
  return `<div class="voile" id="voile" aria-hidden="true">
  <svg class="astrolabe" viewBox="0 0 400 400" focusable="false">
    <circle class="a-anneau" cx="200" cy="200" r="190" pathLength="1"/>
    <path class="a-graduations" d="${graduations}"/>
    <circle class="a-pointille" cx="200" cy="200" r="150"/>
    <path class="a-ecliptique" pathLength="1" d="M48 236C120 150 280 150 352 236"/>
    <circle class="a-astre" cx="104" cy="186" r="2.2"/><circle class="a-astre" cx="300" cy="196" r="1.6"/><circle class="a-astre" cx="236" cy="96" r="1.8"/><circle class="a-astre" cx="150" cy="300" r="1.4"/>
  </svg>
  <p class="voile-initiales" id="voile-initiales">${esc(d.initiales || '')}</p>
</div>`;
}

// Chaque lettre dans un span : elles naissent une a une, comme des etoiles qui deviennent des lettres.
const motsNom = (nom) => { let k = 0; return String(nom || '').trim().split(/\s+/).map((m) => `<span class="mot" aria-hidden="true">${[...m].map((c) => `<span class="l" style="--l:${k++}">${esc(c)}</span>`).join('')}</span>`).join(' '); };
const longueurNom = (nom) => (nom.length > 34 ? ' nom-tres-long' : nom.length > 22 ? ' nom-long' : '');

function entete(d) {
  return `
<header class="barre" id="barre">
  <a class="sceau" href="#accueil" aria-label="${esc(d.nom)}, retour en haut"><span>${esc(d.initiales || '')}</span></a>
  <nav class="barre-liens" aria-label="Sections">
    <a href="#approche">L’approche</a><a href="#seance">La séance</a><a href="#tarifs">Tarifs</a><a href="#apropos">À propos</a>
  </nav>
  <a class="pilule pilule-verre" href="#contact">Rendez-vous</a>
</header>`;
}

function accueil(d) {
  const lieu = [d.metier, d.ville].filter(Boolean).map(esc).join(' <span aria-hidden="true">✦</span> ');
  const doublon = d.ville && (d.accroche || '').toLowerCase().includes(d.ville.toLowerCase());
  return `
<section class="accueil" id="accueil" aria-label="Accueil">
  <canvas class="constellation" id="constellation" aria-hidden="true"></canvas>
  <div class="accueil-centre">
    ${doublon ? '' : `<p class="metier-lieu">${lieu}</p>`}
    <h1 class="nom${longueurNom(d.nom || '')}" id="nom" aria-label="${esc(d.nom)}">${motsNom(d.nom)}</h1>
    <p class="accroche">${fr(d.accroche)}</p>
    <div class="actions">
      ${d.tel ? `<a class="pilule pilule-claire" href="${esc(d.telLien)}">${esc(d.appeler || 'Appeler')} le ${esc(d.tel)}</a>` : ''}
      <a class="lien-lueur" href="#contact">Prendre rendez-vous</a>
    </div>
  </div>
  <a class="descendre" href="#approche" aria-label="Découvrir la suite"><span></span></a>
</section>`;
}

const titreSection = (texte, id, classe = '') => `<h2 class="titre${classe}" data-allume id="${id}-titre">${fr(texte)}</h2>`;

// ---------- L'approche : un atlas du ciel ----------
// Une seule carte celeste gravee (et non une rangee de cartes) : chaque theme y est une constellation,
// a sa place, a sa taille. A cote, la legende de l'atlas : en la lisant, la constellation du theme
// s'allume sur la carte ; celles deja lues restent tracees, discretes. Sans JavaScript : tout est allume.
const COMPOSITIONS = {
  1: [[500, 400, 1.6]],
  2: [[300, 270, 1.3], [700, 560, 1.15]],
  3: [[270, 240, 1.15], [735, 205, .9], [545, 600, 1.25]],
  4: [[255, 225, 1.1], [735, 180, .85], [370, 590, .95], [770, 565, 1.15]],
  5: [[245, 215, 1.05], [720, 165, .8], [520, 410, .7], [250, 620, .9], [790, 600, 1.1]],
  6: [[230, 200, 1], [690, 150, .78], [520, 400, .68], [880, 380, .62], [250, 620, .9], [740, 640, 1.05]],
};
function figure(seed, cx, cy, sc, i, titre, vide) {
  const r = hasard(seed), l = 250 * sc, h = 170 * sc, N = vide ? 5 : 5 + Math.floor(r() * 3), pts = [];
  for (let essai = 0; pts.length < N && essai < 500; essai++) {
    const p = [cx - l / 2 + r() * l, cy - h / 2 + r() * h];
    if (pts.every((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) > Math.min(l, h) * .28)) pts.push(p);
  }
  const reste = pts.slice().sort((a, b) => a[0] - b[0]), chaine = [reste.shift()];
  while (reste.length) { const der = chaine[chaine.length - 1]; reste.sort((a, b) => Math.hypot(a[0] - der[0], a[1] - der[1]) - Math.hypot(b[0] - der[0], b[1] - der[1])); chaine.push(reste.shift()); }
  const branche = chaine.length > 5 ? `<path class="fig-lien fig-branche" pathLength="1" d="M${f1(chaine[2][0])} ${f1(chaine[2][1])}L${f1(chaine[chaine.length - 1][0])} ${f1(chaine[chaine.length - 1][1])}"/>` : '';
  const d = 'M' + chaine.map((p) => `${f1(p[0])} ${f1(p[1])}`).join('L');
  const etoiles = chaine.map((p, k) => { const vive = r() < .28; return `<circle class="fig-etoile${vive ? ' fig-vive' : ''}" cx="${f1(p[0])}" cy="${f1(p[1])}" r="${f1(vive ? 3.4 : 1.7 + r() * 1.2)}" style="--k:${k}"/>`; }).join('');
  // le nom du theme grave sous la figure, comme dans un atlas ; jamais hors de la carte
  const yb = Math.max(...chaine.map((p) => p[1])), xm = Math.min(860, Math.max(140, cx));
  return `<g class="figure${vide ? ' figure-vide' : ''}" data-i="${i}"><path class="fig-lien" pathLength="1" d="${d}"/>${branche}${etoiles}<text class="fig-nom" x="${f1(xm)}" y="${f1(Math.min(770, yb + 44))}" text-anchor="middle">${esc(titre)}</text></g>`;
}
function carteAtlas(seed, items) {
  const r = hasard(seed), n = Math.min(6, Math.max(1, items.length)), miroir = r() < .5;
  const places = COMPOSITIONS[n].map(([x, y, k]) => [miroir ? 1000 - x : x, y, k]);
  let s = '<svg class="atlas-svg" viewBox="0 0 1000 800" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">';
  s += '<defs><radialGradient id="atlas-lacte" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="currentColor" stop-opacity=".16"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/></radialGradient></defs>';
  s += `<ellipse class="atlas-lacte" cx="500" cy="400" rx="620" ry="120" transform="rotate(${miroir ? 24 : -24} 500 400)" fill="url(#atlas-lacte)"/>`;
  s += '<g class="atlas-gravure">';
  s += '<circle cx="500" cy="400" r="392"/><circle cx="500" cy="400" r="384" class="fin"/>';
  for (let a = 0; a < 120; a++) { const t = a / 120 * Math.PI * 2, r1 = 384, r2 = a % 10 ? 378 : 370; s += `<line x1="${f1(500 + Math.cos(t) * r1)}" y1="${f1(400 + Math.sin(t) * r1)}" x2="${f1(500 + Math.cos(t) * r2)}" y2="${f1(400 + Math.sin(t) * r2)}" class="fin"/>`; }
  for (const k of [110, 230]) s += `<circle cx="500" cy="400" r="${k}" class="fin" stroke-dasharray="2 8"/>`;
  for (let a = 0; a < 12; a++) { const t = a / 12 * Math.PI * 2; s += `<line x1="500" y1="400" x2="${f1(500 + Math.cos(t) * 370)}" y2="${f1(400 + Math.sin(t) * 370)}" class="fin"/>`; }
  s += `<path class="atlas-ecliptique" d="M${miroir ? 900 : 100} ${miroir ? 210 : 560}Q500 ${miroir ? 700 : 100} ${miroir ? 100 : 900} ${miroir ? 590 : 240}"/>`;
  s += '</g><g class="atlas-fond">';
  for (let i = 0; i < 150; i++) { const a = r() * Math.PI * 2, dd = Math.sqrt(r()) * 380; s += `<circle cx="${f1(500 + Math.cos(a) * dd)}" cy="${f1(400 + Math.sin(a) * dd)}" r="${f1(.5 + Math.pow(r(), 4) * 2.2)}"/>`; }
  s += '</g>';
  items.slice(0, 6).forEach((it, i) => { const [x, y, k] = places[i]; s += figure(seed + i * 97, x, y, k, i, it.titre, it.vide); });
  return s + '</svg>';
}

function approche(d) {
  const { phare, reste } = approcheRangee(d);
  const apports = (d.apports || []).filter((a) => a && a.titre);
  const s = graine(d.nom + 'ciel');
  const items = apports.length ? apports.map((a) => ({ titre: a.titre, texte: a.texte })) : [{ titre: 'Ici, vos thèmes', vide: true }];
  return `
<section class="section approche" id="approche" aria-labelledby="approche-titre">
  <div class="cadre">
    ${titreSection('L’approche', 'approche')}
    ${phare ? `<p class="phare" data-illumine>${fr(phare)}</p>` : `<p class="phare emplacement-texte">Ici, votre approche avec vos mots : ce qui vous anime, votre façon d’accompagner.</p>`}
    ${reste.length ? `<div class="colonnes">${reste.map((p) => `<p>${fr(p)}</p>`).join('')}</div>` : ''}
  </div>
  <div class="atlas atlas-${items.length}" data-atlas>
    <div class="atlas-carte">${carteAtlas(s, items)}</div>
    <ol class="atlas-legende" role="list" aria-label="Les thèmes de l’accompagnement">${items.map((a, i) => `
      <li class="atlas-entree${a.vide ? ' entree-vide' : ''}" data-i="${i}">
        ${a.vide ? `<h3 class="emplacement-texte">Ici, les thèmes de votre accompagnement</h3><p>Chacun deviendra une constellation de cette carte, avec vos mots.</p>` : `<h3>${fr(a.titre)}</h3>${a.texte ? `<p>${fr(a.texte)}</p>` : ''}`}
      </li>`).join('')}
    </ol>
  </div>
</section>`;
}

// ---------- La seance : le trajet d'une nuit, du crepuscule a l'aube ----------
export function moment(i, n) {
  if (n === 1) return 'Au cœur de la nuit';
  if (i === 0) return 'Au crépuscule';
  if (i === n - 1) return 'À l’aube';
  return n > 3 && i === n - 2 ? 'Vers l’aube' : 'Au cœur de la nuit';
}
function seance(d) {
  const etapes = (d.etapes || []).filter((e) => e && e.titre), n = etapes.length;
  const r = hasard(graine(d.nom + 'nuit'));
  let etoiles = '';
  for (let i = 0; i < 90; i++) etoiles += `<circle cx="${f1(r() * 1000)}" cy="${f1(r() * 560)}" r="${f1(.6 + Math.pow(r(), 3) * 1.8)}"/>`;
  return `
<section class="section seance" id="seance" aria-labelledby="seance-titre" style="--n:${Math.max(1, n)}">
  <div class="nuit-piste">
    <div class="nuit-scene">
      <div class="nuit-ciel" aria-hidden="true"><span class="nuit-crepuscule"></span><span class="nuit-aube"></span></div>
      <svg class="nuit-etoiles" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">${etoiles}</svg>
      <svg class="nuit-decor" aria-hidden="true" focusable="false"><path class="nuit-arc"/><g class="nuit-reperes"></g><path class="nuit-horizon"/></svg>
      <div class="nuit-lune" aria-hidden="true"><span class="nuit-disque"></span><span class="nuit-moment">${esc(moment(0, n))}</span></div>
      <div class="cadre nuit-texte">
        ${titreSection('La séance', 'seance', ' titre-nuit')}
        <ol class="nuit-etapes" role="list">
          ${etapes.map((e, i) => `
          <li class="nuit-etape${place(e.texte) ? ' etape-place' : ''}" data-i="${i}" data-moment="${esc(moment(i, n))}">
            <p class="nuit-quand" aria-hidden="true">${esc(moment(i, n))}</p>
            <h3>${fr(e.titre)}</h3>
            <p class="nuit-dit">${fr(e.texte)}</p>
            ${e.duree ? `<p class="nuit-duree">${fr(e.duree)}</p>` : ''}
          </li>`).join('')}
        </ol>
      </div>
    </div>
  </div>
</section>`;
}

// ---------- Les tarifs : graves sur une carte du ciel qu'on fait tourner ----------
function planisphere(t0, seed) {
  const r = hasard(seed);
  let s = '<svg class="pl-svg" viewBox="0 0 600 600" aria-hidden="true" focusable="false"><g class="pl-disque">';
  s += '<circle class="pl-trait" cx="300" cy="300" r="292"/><circle class="pl-trait" cx="300" cy="300" r="250"/><circle class="pl-trait fin" cx="300" cy="300" r="214" stroke-dasharray="2 6"/>';
  for (let a = 0; a < 180; a++) { const t = a / 180 * Math.PI * 2, r1 = 250, r2 = a % 15 === 0 ? 236 : a % 5 === 0 ? 242 : 246; s += `<line class="pl-trait${a % 5 ? ' fin' : ''}" x1="${f1(300 + Math.cos(t) * r1)}" y1="${f1(300 + Math.sin(t) * r1)}" x2="${f1(300 + Math.cos(t) * r2)}" y2="${f1(300 + Math.sin(t) * r2)}"/>`; }
  for (let a = 0; a < 12; a++) { const t = a / 12 * Math.PI * 2; s += `<line class="pl-trait fin" x1="${f1(300 + Math.cos(t) * 214)}" y1="${f1(300 + Math.sin(t) * 214)}" x2="${f1(300 + Math.cos(t) * 236)}" y2="${f1(300 + Math.sin(t) * 236)}"/>`; }
  s += `<path id="pl-cercle" d="M300 300m-271 0a271 271 0 1 1 542 0a271 271 0 1 1 -542 0" fill="none"/>`;
  s += `<text class="pl-anneau"><textPath href="#pl-cercle" textLength="1690" lengthAdjust="spacing">${esc(t0)}</textPath></text>`;
  for (let i = 0; i < 46; i++) { const a = r() * Math.PI * 2, d = 120 + r() * 88; s += `<circle class="pl-astre" cx="${f1(300 + Math.cos(a) * d)}" cy="${f1(300 + Math.sin(a) * d)}" r="${f1(.7 + Math.pow(r(), 3) * 2.2)}"/>`; }
  s += '</g><circle class="pl-centre-fond" cx="300" cy="300" r="186"/></svg>';
  return s;
}
function tarifs(d) {
  const t = (d.tarifs || []).filter((x) => x && x.nom);
  const durees = [d.dureePremiere && `Première séance : ${d.dureePremiere}`, d.dureeSuivi && `Séances de suivi : ${d.dureeSuivi}`].filter(Boolean);
  const premier = t[0];
  const anneau = premier ? `${premier.nom} ✦ ${premier.prix || 'Sur demande'} ✦ ${d.ville || d.nom} ✦ ` : 'Vos séances ✦ Vos tarifs ✦ ';
  const texteAnneau = anneau.repeat(Math.max(1, Math.ceil(110 / anneau.length))).toUpperCase().replace(TIRETS, ',');
  return `
<section class="section tarifs" id="tarifs" aria-labelledby="tarifs-titre">
  <div class="cadre tarifs-cadre">
    <div class="tarifs-tete">
      ${titreSection('Tarifs', 'tarifs')}
      ${d.paiement ? `<p class="note">${fr(d.paiement)}</p>` : ''}
      ${approcheRangee(d).ecartes.map((p) => `<p class="note note-mots">${fr(p)}</p>`).join('')}
      <p class="pl-aide" aria-hidden="true">La carte tourne sous le doigt ou à la souris.</p>
    </div>
    <figure class="planisphere" data-planisphere>
      ${planisphere(texteAnneau, graine(d.nom + 'carte'))}
      <figcaption class="pl-centre${premier ? '' : ' pl-vide'}">
        ${premier ? `<p class="pl-nom">${fr(premier.nom)}</p><p class="prix${/[0-9]/.test(premier.prix || '') ? '' : ' prix-texte'}">${fr(premier.prix || 'Sur demande')}</p>${durees.length ? `<ul class="durees" role="list">${durees.map((u) => `<li>${fr(u)}</li>`).join('')}</ul>` : ''}`
          : `<p class="pl-nom">Ici, vos séances</p><p class="prix prix-texte">Vos tarifs</p><p class="pl-note">La durée de chaque séance et ce qu’elle comprend.</p>`}
      </figcaption>
    </figure>
    ${t.length > 1 ? `<dl class="pl-legende">${t.slice(1).map((x) => `<div><dt>${fr(x.nom)}</dt><dd>${fr(x.prix || 'Sur demande')}</dd></div>`).join('')}</dl>` : ''}
  </div>
</section>`;
}

// ---------- A propos : la lune-portrait ----------
function apropos(d) {
  const paras = parcours(d);
  const portrait = /^(https?:[/][/]|images[/])/.test(d.portrait || '') ? d.portrait : IMAGES.lune;
  return `
<section class="section apropos" id="apropos" aria-labelledby="apropos-titre">
  <div class="cadre apropos-grille">
    <figure class="lune" aria-label="Emplacement pour votre portrait">
      <div class="lune-disque" aria-hidden="true"><span class="lune-halo"></span>${portrait ? `<img src="${esc(portrait)}" alt="" loading="lazy" decoding="async">` : ''}</div>
      ${d.portrait ? '' : '<figcaption>Ici, votre portrait</figcaption>'}
    </figure>
    <div class="apropos-texte">
      <h2 class="titre titre-nom" data-allume id="apropos-titre">${esc(d.nom)}</h2>
      ${paras.length ? paras.map((p) => `<p>${fr(p)}</p>`).join('') : `<p class="emplacement-texte">Ici, votre parcours en quelques lignes : votre chemin jusqu’à ce métier, vos formations, ce qui compte pour vous.</p>`}
      ${d.cerf ? `<blockquote class="citation"><p>${fr(d.cerf)}</p></blockquote>` : ''}
    </div>
  </div>
</section>`;
}

// ---------- Contact : le numero en lumiere, les reperes sur une seule ligne ----------
function contact(d) {
  const resa = /resalib\.fr/i.test(d.resalib || '') ? lien(d.resalib) : '';
  const fb = lien(d.facebook);
  const lieu = [d.ville, d.cp && `(${d.cp})`].filter(Boolean).join(' ');
  const reperes = [
    lieu ? `<span>${fr(lieu)}</span>` : '<span class="emplacement-texte">Ici, votre ville</span>',
    '<span class="emplacement-texte">Ici, l’adresse et l’accès</span>',
    '<span class="emplacement-texte">Ici, vos jours et horaires</span>',
    d.paiementListe ? `<span>${fr(d.paiementListe.charAt(0).toUpperCase() + d.paiementListe.slice(1))}</span>` : '',
  ].filter(Boolean);
  return `
<section class="section contact" id="contact" aria-labelledby="contact-titre">
  <div class="cadre contact-cadre">
    ${titreSection('Prendre rendez-vous', 'contact')}
    <p class="contact-rdv">${fr(d.rdv || 'Sur rendez-vous')}</p>
    ${d.tel ? `<a class="tel-geant" href="${esc(d.telLien)}"><span class="tel-texte">${esc(d.tel)}</span></a>` : `<p class="tel-geant emplacement-texte">Ici, votre numéro</p>`}
    <div class="actions actions-contact">
      ${d.tel ? `<a class="pilule pilule-claire" href="${esc(d.telLien)}">${esc(d.appeler || 'Appeler')}</a>` : ''}
      ${resa ? `<a class="lien-lueur" href="${resa}" rel="noopener" target="_blank">Réserver en ligne</a>` : ''}
      ${fb ? `<a class="lien-lueur" href="${fb}" rel="noopener" target="_blank">Sur Facebook</a>` : ''}
    </div>
    <p class="reperes">${reperes.join('<i aria-hidden="true">✦</i>')}</p>
  </div>
</section>`;
}

function pied(d) {
  return `
<footer class="pied" id="pied">
  <div class="cadre pied-cadre">
    ${asterisme(graine(d.nom + 'pied'), { l: 220, h: 90, n: 6, classe: 'asterisme pied-asterisme' })}
    <p class="pied-nom">${esc(d.nom)}<span>${esc(d.metier)}${d.ville ? ' · ' + esc(d.ville) : ''}</span></p>
    ${d.tel ? `<p class="pied-tel"><a href="${esc(d.telLien)}">${esc(d.tel)}</a></p>` : ''}
    <nav class="pied-liens" aria-label="Plan de la page"><a href="#approche">L’approche</a><a href="#seance">La séance</a><a href="#tarifs">Tarifs</a><a href="#apropos">À propos</a><a href="#contact">Rendez-vous</a></nav>
    <p class="pied-apercu">Aperçu préparé pour ${esc(d.nom)}. Textes, photos, couleurs${FINE}: tout se modifie selon vos goûts.</p>
    <p class="pied-suite">Cette nuit est un point de départ. On peut la garder telle quelle, la mêler à un autre univers ou repartir d’une page blanche, jusqu’au site qui vous ressemble exactement.</p>
    <p class="pied-avert">${fr(d.avertissement)}</p>
    ${d.siret ? `<p class="pied-legal">SIRET ${esc(d.siret)}</p>` : ''}
    <a class="pied-haut" href="#accueil">Revenir en haut</a>
  </div>
</footer>`;
}

export function rendre(d) {
  return entete(d) + '\n<main id="contenu">' + accueil(d) + approche(d) + seance(d) + tarifs(d) + apropos(d) + contact(d) + '\n</main>' + pied(d);
}
