// Méridiens : choix de la carte selon le métier, et construction du dessin SVG (au trait, gravé),
// identique dans node (page lisible sans JavaScript) et dans le navigateur.
import { lisse, echantillons, r1, poly } from './trace.js';
import { pied } from './pied.js';
import { main, champ } from './main.js';
import { corps } from './corps.js';
import { oreille } from './oreille.js';
import { nautile } from './nautile.js';
import { pratique } from '../../commun/pratiques.js';

export const CARTES = { pied, main, silhouette: corps, champ, oreille, nautile };

// La carte suit la pratique exacte du praticien (commun/pratiques.js, la même règle pour tous les univers) :
// jamais un pied pour qui ne travaille pas le pied, jamais un corps pour qui ne touche pas.
const PAR_PRATIQUE = {
  plantaire: 'pied', palmaire: 'main', auriculo: 'oreille', // faciale (dien chan) : pas de visage dessiné, la forme neutre
  meridiens: 'silhouette', kinesio: 'silhouette', qigong: 'silhouette',
  energie: 'champ',
  massage: 'silhouette', yoga: 'silhouette', danse: 'silhouette',
  esthetique: 'main', bebe: 'main', perinat: 'main', parent: 'main', animal: 'main',
};
// Sans jargon : la silhouette d'un masseur ou d'un professeur de yoga garde ses lignes de lumière, sans noms de
// méridiens ; la main d'une esthéticienne ou d'un praticien qui soigne les animaux n'a pas de « paume » à toucher.
const DOUCES = new Set(['massage', 'yoga', 'danse', 'esthetique', 'bebe', 'perinat', 'parent', 'animal']);
export function choisirCarte(d, force) {
  if (force && CARTES[force]) return force;
  return PAR_PRATIQUE[pratique(d).id] || 'nautile';
}
export function carteDouce(d, carte) {
  return (carte === 'silhouette' || carte === 'main') && DOUCES.has(pratique(d).id);
}
export const LEGENDE_DOUCE = { aria: 'Une silhouette au trait, parcourue de lignes de lumière', geste: 'Touchez la silhouette : la lumière suit les lignes du corps.' };
export const LEGENDE_DOUCE_MAIN = { aria: 'Une main ouverte au trait, parcourue de lignes de lumière', geste: 'Touchez la main : la lumière suit ses lignes.' };

// Ce que dit la carte, pour les lecteurs d'écran et la légende.
export const LEGENDES = {
  pied: { aria: 'Les zones réflexes de la plante des pieds, dessinées au trait', geste: 'Touchez une zone du pied : elle s’éveille, et la lumière part de là.' },
  main: { aria: 'Une main ouverte dessinée au trait, ses lignes parcourues de lumière', geste: 'Touchez la paume : la lumière part de là.' },
  silhouette: { aria: 'Une silhouette au trait et le trajet des méridiens', geste: 'Touchez un méridien : la lumière le parcourt.' },
  champ: { aria: 'Deux mains au trait et le champ qui circule entre elles', geste: 'Touchez le champ entre les mains : il ondule et s’éclaire.' },
  oreille: { aria: 'Une oreille dessinée au trait, ses reliefs parcourus de lumière', geste: 'Touchez un relief de l’oreille : il s’éveille, et la lumière part de là.' },
  nautile: { aria: 'Un nautile en coupe, gravé au trait, sa spirale parcourue de lumière', geste: 'Touchez la coquille : la lumière suit la spirale jusqu’au cœur.' },
};

// Hachures de gravure le long d'un contour fermé : traits courts vers l'intérieur, plus longs du côté de l'ombre.
// lumiere : direction VERS la lumière (en haut à gauche par défaut). Le bord qui lui tourne le dos est hachuré.
function normales(pts, finesse = 18) {
  const ech = echantillons(pts, true, finesse);
  let aire = 0; for (let i = 0; i < ech.length; i++) { const a = ech[i], b = ech[(i + 1) % ech.length]; aire += a[0] * b[1] - b[0] * a[1]; }
  const o = Math.sign(aire) || 1;
  return ech.map((p, i) => {
    const a = ech[(i - 1 + ech.length) % ech.length], b = ech[(i + 1) % ech.length];
    const tx = b[0] - a[0], ty = b[1] - a[1], L = Math.hypot(tx, ty) || 1;
    return { p, t: [tx / L, ty / L], n: [-ty / L * o, tx / L * o], pas: Math.hypot(p[0] - a[0], p[1] - a[1]) };
  });
}
// Tailles de gravure : des lignes parallèles au contour, du côté de l'ombre, de plus en plus courtes vers
// l'intérieur, comme sur une planche gravée au burin.
function dedans(poly, [x, y]) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c;
  }
  return c;
}
function gravure(pts, { lumiere = [-.55, -.83], ecart = 2.6, rangs = 5, seuil = .2 } = {}) {
  const N = normales(pts, 7), contour = N.map((e) => e.p);
  let d = '';
  for (let k = 1; k <= rangs; k++) {
    const s = seuil + (k - 1) / rangs * (1 - seuil) * .78;
    let trait = [];
    const fin = () => { if (trait.length > 2) d += poly(trait); trait = []; };
    for (const { p, n } of N) {
      const ombre = Math.max(0, n[0] * lumiere[0] + n[1] * lumiere[1]);
      const q = [p[0] + n[0] * (ecart * k + .8), p[1] + n[1] * (ecart * k + .8)];
      if (ombre > s && dedans(contour, q)) trait.push(q);
      else fin();
    }
    fin();
  }
  return d;
}
// Trait plein d'épaisseur variable (plus épais dans l'ombre), comme un trait de plume : un ruban rempli.
function ruban(pts, { lumiere = [-.55, -.83], fin = .35, epais = 2.2 } = {}) {
  const N = normales(pts, 6);
  const dehors = [], interieur = [];
  for (const { p, n } of N) {
    const ombre = Math.max(0, n[0] * lumiere[0] + n[1] * lumiere[1]);
    const w = fin + (epais - fin) * ombre ** 1.3;
    dehors.push(p); interieur.push([p[0] + n[0] * w, p[1] + n[1] * w]);
  }
  return poly(dehors, true) + poly(interieur.reverse(), true);
}

// Données de géométrie pour la lumière (coordonnées de la boîte du dessin, transformations appliquées).
export function geometrie(type, seul = false) {
  const C0 = CARTES[type]();
  const C = seul && C0.vbSeul ? { ...C0, vb: C0.vbSeul, membres: [C0.membres[0]] } : C0;
  const app = (m, [x, y]) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
  const lignes = [], zones = [];
  C.membres.forEach((mb, k) => {
    for (const l of mb.lignes) lignes.push({ id: `${k}-${l.id}`, trans: !!l.trans, ferme: !!l.ferme, pts: echantillons(l.pts, !!l.ferme, 8).map((p) => app(mb.mat, p)), membre: k });
    for (const z of mb.zones) zones.push({
      id: z.id, cle: `${k}-${z.id}`, nom: z.nom, membre: k, ancre: app(mb.mat, z.ancre),
      polys: z.lignes ? [] : (z.multi || [z.pts]).map((ps) => ps.map((p) => app(mb.mat, p))),
      lignes: z.lignes ? z.lignes.map((id) => `${k}-${id}`) : null,
    });
  });
  return { vb: C.vb, lignes, zones, type: C.type };
}

export function svgCarte(type, uid = 'c', reference = '', seul = false) {
  const C = CARTES[type]();
  const [x0, y0, w, h] = seul && C.vbSeul ? C.vbSeul : C.vb;
  if (reference) return `<svg class="carte carte-${type}${seul && C.vbSeul ? ' carte-seule' : ''}" viewBox="${x0} ${y0} ${w} ${h}" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false"><use href="#${reference}-dessin"/></svg>`;
  let defs = `<radialGradient id="${uid}-lavis" cx=".42" cy=".38" r=".75"><stop offset="0" style="stop-color:var(--accent);stop-opacity:.15"/><stop offset=".6" style="stop-color:var(--accent);stop-opacity:.05"/><stop offset="1" style="stop-color:var(--accent);stop-opacity:0"/></radialGradient>`;
  let corps = '';
  C.membres.forEach((mb, k) => {
    const formes = [mb.contour, ...(mb.contours || [])].filter((c) => c && c.length);
    const contour = formes.map((c) => lisse(c, true)).join('');
    if (contour) defs += `<clipPath id="${uid}-clip${k}"><path d="${contour}"/></clipPath>`;
    const fins = mb.details.filter((d) => d.cl === 'fin').map((d) => d.d).join('');
    const plis = mb.details.filter((d) => d.cl === 'pli').map((d) => d.d).join('');
    const hach = mb.details.filter((d) => d.cl === 'hachure').map((d) => d.d).join('');
    const grav = mb.sansGravure ? '' : formes.map((c) => gravure(c, mb.gravure || {})).join('');
    // styles de base en attributs style (ils suivent le dessin quand la séance le réutilise par <use>)
    const st = { contour: 'fill:none;stroke:var(--accent)', details: 'fill:none;stroke:var(--accent);opacity:.72', plis: 'fill:none;stroke:var(--accent);opacity:.5;stroke-dasharray:2 3', gravure: 'fill:none;stroke:var(--accent);opacity:.5', ligne: 'fill:none;stroke:var(--accent2);opacity:.42', points: 'fill:var(--accent);opacity:.7', zone: 'fill:var(--accent);fill-opacity:0;stroke:var(--accent);stroke-opacity:.16;stroke-dasharray:1.5 2.5', plume: 'fill:var(--accent)' };
    corps += `<g class="membre${mb.champ ? ' membre-champ' : ''}" transform="matrix(${mb.mat.join(' ')})">`;
    const polys = mb.zones.filter((z) => !z.lignes);
    if (polys.length && contour) corps += `<g class="zones" clip-path="url(#${uid}-clip${k})">${polys.map((z) => (z.multi || [z.pts]).map((ps) => `<path class="zone" style="${st.zone}" data-zone="${k}-${z.id}" d="${lisse(ps, true)}"/>`).join('')).join('')}</g>`;
    let habit = '';
    if (contour) habit += `<path class="lavis" d="${contour}" fill="url(#${uid}-lavis)"/>`;
    if (grav || hach) habit += `<path class="gravure" style="${st.gravure}" d="${grav}${hach}"/>`;
    if (plis) habit += `<path class="plis" style="${st.plis}" d="${plis}"/>`;
    if (contour) habit += `<path class="plume" style="${st.plume}" fill-rule="evenodd" d="${formes.map((c) => ruban(c, mb.gravure || {})).join('')}"/>`;
    if (habit) corps += `<g class="habit">${habit}</g>`;
    corps += `<g class="lignes">${mb.lignes.map((l) => `<path class="ligne${l.trans ? ' ligne-t' : ''}" style="${st.ligne}" data-ligne="${k}-${l.id}" d="${lisse(l.pts, !!l.ferme)}"/>`).join('')}</g>`;
    if (mb.points?.length) corps += `<path class="points" style="${st.points}" d="${mb.points.map(([x, y]) => `M${r1(x - 1.6)} ${r1(y)}a1.6 1.6 0 1 0 3.2 0a1.6 1.6 0 1 0 -3.2 0`).join('')}"/>`;
    if (fins) corps += `<path class="details" style="${st.details}" pathLength="1" d="${fins}"/>`;
    if (contour) corps += `<path class="contour" style="${st.contour}" pathLength="1" d="${contour}"/>`;
    corps += `</g>`;
  });
  if (C.decor) corps = C.decor + corps;
  return `<svg class="carte carte-${type}" viewBox="${x0} ${y0} ${w} ${h}" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false"><defs>${defs}</defs><g id="${uid}-dessin">${corps}</g></svg>`;
}
