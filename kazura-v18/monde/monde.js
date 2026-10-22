/* Kazura v14, la Scène : « la liane et le sceau ».

   Le sceau de Kazura est le protagoniste de tout le site, au centre de l'écran, comme le « A » d'ALCHE.
   Ouverture (celle de la v12, enrichie de traits de construction), jouée EN ENTIER à son rythme lent :
     le noir, une étincelle violette ; la vrille jaillit et trace l'anneau pendant que cercles, axes et
     grille se dessinent puis s'effacent ; une feuille trifoliée s'ouvre et devient le sceau en jade ;
     éclat, onde, gerbe ; puis la salle s'allume et le décor s'installe.
     Aucune minuterie ne l'accélère : seul un geste du visiteur (défilement, clic, touche, doigt) le peut.
   Puis le sceau RESTE au centre et vit, dans une salle plus riche (v14) : couches de feuilles de kudzu
     et premiers plans flous, rayons et poussières, sol poli qui reflète, écrans qui s'animent, arc de
     lumière derrière le mot géant.
   Au fil de la page (défilement lissé par la page, suivi CONTINÛMENT : mots, matières et ambiances
   coulent avec p et locale, sans palier) :
     ouverture    jade translucide, KAZURA
     promesse     verre irisé à dispersion, RECOMMANDÉ puis CHERCHÉ puis TROUVÉ
     realisations la salle des réalisations (l'anneau) ; la salle prend la couleur du site affiché ;
                  v17 : au téléphone avec le carrousel DOM de la page (telephoneDom), l'anneau s'efface
     experiences  v18 : la partie courte, juste après les réalisations : glace, EXPÉRIENCE ; les TRANCHES en partent
     rever        les TRANCHES (AFTERDEPTH) ouvrent le monde VIOLET : matière liquide, sceau de cristal, ruban qui danse
     deroule      v18 : LA VAGUE de la v16 (coulée irisée) couvre le violet, vit un moment, puis se resserre sur le
                  ruban et s'y range en découvrant le blanc de la v17 (la feuille de dessin, le sceau qui s'y trace)
     matheo       une marée (rive au fil fin) ramène le sombre : la salle, apaisée ; le sceau, plus petit, à droite
     questions    la salle revient, verre givré, QUESTIONS
     contact      le sceau au centre, or et jade, KAZURA

   Contrat avec la page : voir LISEZMOI.md. */

import { borne, lisse, melange, amortir, sortieCubique, sortieQuartique, entreeSortie } from './commun.js';
import { repli } from './repli.js';
import { Tubes, construireVrille, materiauLiane, RAYON_SCEAU } from './liane.js';
import { construireFeuillesOuverture } from './feuilles.js';
import { construireSceau, construireContour } from './sceau.js';
import { creerEtincelle, creerOnde, creerGerbes, creerAura, creerEnvironnement } from './atmosphere.js';
import { uniformesPartages, GLSL_MASQUE, GLSL_IRIS, GLSL_RAMPE } from './glsl.js';
import { creerTypo, chargerPolice } from './typo.js';
import { creerFond } from './fond.js';
import { creerConstruction, creerVrilles, creerEssaim } from './vie.js';
import { creerCarrousel } from './carrousel.js';
import { creerRuban } from './ruban.js';
import { creerClair } from './clair.js';
import { creerPictos } from './pictos.js';
import { creerVie } from './vie-labo.js';
import { creerDecor } from './heros.js';
import { materiauMatiere, geometriesEpaisses, creerRuban as creerRubanAnneau, INDICE } from './protagoniste.js';

export const VERSION_THREE = '0.170.0';
/* v18 : l'ordre des parties : les réalisations juste après la promesse, puis les Expériences (courtes), d'où partent
   les tranches vers le violet de « Osez rêver ». rever (4) et deroule (5) retrouvent leurs indices de la v16. */
export const SECTIONS = ['ouverture', 'promesse', 'realisations', 'experiences', 'rever', 'deroule', 'matheo', 'questions', 'contact'];
const CDN = `https://cdn.jsdelivr.net/npm/three@${VERSION_THREE}`;
const PP = `${CDN}/examples/jsm/postprocessing`;

/* Peint tout de suite derrière le canevas : jamais d'écran noir pendant le chargement. */
const FOND_CSS = 'radial-gradient(90% 70% at 70% 20%, #1a0f33 0%, #0b0618 45%, #040309 100%)';

function webglPossible() {
  try { const c = document.createElement('canvas'); return !!c.getContext('webgl2'); } catch { return false; }
}

/* three et ses passes ; chaque module chargé fait avancer la progression (three pèse le plus lourd) */
async function chargerThree(avance) {
  const poids = [0.5, 0.06, 0.04, 0.06, 0.04, 0.04];
  let fait = 0;
  const suivre = (p, i) => p.then((m) => { fait += poids[i]; avance(fait); return m; });
  const [THREE, ec, rp, bp, op, sp] = await Promise.all([
    import(`${CDN}/+esm`),
    import(`${PP}/EffectComposer.js/+esm`),
    import(`${PP}/RenderPass.js/+esm`),
    import(`${PP}/UnrealBloomPass.js/+esm`),
    import(`${PP}/OutputPass.js/+esm`),
    import(`${PP}/ShaderPass.js/+esm`),
  ].map(suivre));
  return { THREE, EffectComposer: ec.EffectComposer, RenderPass: rp.RenderPass, UnrealBloomPass: bp.UnrealBloomPass, OutputPass: op.OutputPass, ShaderPass: sp.ShaderPass };
}

/* ------------------------------------------------------------ le lancement
   lancer() rend la main TOUT DE SUITE (un objet « façade » au contrat complet) : la page peut s'abonner
   à surChargement, poser realisations.definir, envoyer progression... Les appels sont gardés et transmis
   à la scène dès qu'elle existe. `pret` est résolue quand l'ouverture peut commencer. */
export async function lancer({ canvas, reduit = false, mobile = false, figerOuverture = null, forcerRepli = false, surChargement = null, telephoneDom = false } = {}) {
  if (!canvas) throw new Error('lancer : il faut un canevas');
  canvas.style.background = FOND_CSS;
  if (forcerRepli || !webglPossible()) {
    const r = repli(canvas, { reduit, mobile, telephoneDom });
    r.surChargement = (fn) => { try { fn(1); } catch {} return () => {}; };
    if (typeof surChargement === 'function') r.surChargement(surChargement);
    return r;
  }
  const F = creerFacade();
  window.__kzMonde = F.objet;   // pour les outils de capture (lecture seule)
  if (typeof surChargement === 'function') F.objet.surChargement(surChargement);
  const police = chargerPolice();                      // en parallèle de three
  (async () => {
    let M;
    try { M = await chargerThree((x) => F.avance(x * 0.72)); }
    catch (e) { window.__kzMondeErreur = String(e && e.stack || e); F.brancher(repli(canvas, { reduit, mobile, telephoneDom })); return; }
    try { F.brancher(await monter(M, { canvas, reduit: !!reduit, mobile: !!mobile, figerOuverture, police, telephoneDom: !!telephoneDom, avance: (x) => F.avance(0.72 + x * 0.28), facade: F })); }
    catch (e) { window.__kzMondeErreur = String(e && e.stack || e); F.brancher(repli(canvas, { reduit, mobile, telephoneDom })); }
  })();
  return F.objet;
}

function creerFacade() {
  let impl = null, charge = 0, demandePause = false, detruite = false;
  let derniereProg = null, sites = null, cadre = null;
  const ecoutesCharge = new Set(), ecoutesChg = [], ecoutesClic = [];
  let resPret, resFin;
  const pret = new Promise((r) => { resPret = r; });
  const ouvertureFinie = new Promise((r) => { resFin = r; });
  const avance = (x) => {
    x = Math.min(1, Math.max(0, x));
    if (x <= charge) return;
    charge = x;
    for (const f of ecoutesCharge) { try { f(charge); } catch {} }
  };
  const brancher = (x) => {
    // v17 : la page a déjà abandonné la scène (detruire) avant qu'elle soit montée : on la libère aussitôt
    if (detruite) { try { x.detruire(); } catch {} return; }
    impl = x;
    if (derniereProg) x.progression(...derniereProg);
    if (sites) x.realisations.definir(...sites);
    if (cadre && x.realisations.cadrer) x.realisations.cadrer(cadre);
    for (const f of ecoutesChg) x.realisations.surChangement(f);
    if (x.realisations.surClicPanneau) for (const f of ecoutesClic) x.realisations.surClicPanneau(f);
    if (demandePause) x.pause();
    Promise.resolve(x.pret).then(() => { avance(1); resPret(); });
    Promise.resolve(x.ouvertureFinie).then(() => resFin());
  };
  const objet = {
    pret, ouvertureFinie,
    get repli() { return !!(impl && impl.repli); },
    surChargement(fn) {
      if (typeof fn !== 'function') return () => {};
      ecoutesCharge.add(fn); try { fn(charge); } catch {}
      return () => ecoutesCharge.delete(fn);
    },
    progression(p, sectionId, locale) { derniereProg = [p, sectionId, locale]; if (impl) impl.progression(p, sectionId, locale); },
    realisations: {
      definir(liste, opts) { sites = [liste, opts]; if (impl) impl.realisations.definir(liste, opts); },
      aller(i) { if (impl) impl.realisations.aller(i); },
      glisser(dx) { if (impl) impl.realisations.glisser(dx); },
      relacher() { if (impl && impl.realisations.relacher) impl.realisations.relacher(); },
      cadrer(c) { cadre = c; if (impl && impl.realisations.cadrer) impl.realisations.cadrer(c); },
      surChangement(fn) {
        if (typeof fn !== 'function') return () => {};
        ecoutesChg.push(fn);
        let off = impl ? impl.realisations.surChangement(fn) : null;
        return () => { const k = ecoutesChg.indexOf(fn); if (k >= 0) ecoutesChg.splice(k, 1); if (off) off(); };
      },
      surClicPanneau(fn) {
        if (typeof fn !== 'function') return () => {};
        ecoutesClic.push(fn);
        const off = impl && impl.realisations.surClicPanneau ? impl.realisations.surClicPanneau(fn) : null;
        return () => { const k = ecoutesClic.indexOf(fn); if (k >= 0) ecoutesClic.splice(k, 1); if (off) off(); };
      },
      panneauEn(x, y) { return impl && impl.realisations.panneauEn ? impl.realisations.panneauEn(x, y) : -1; },
      choisirEn(x, y) { return impl && impl.realisations.panneauEn ? impl.realisations.panneauEn(x, y) : -1; },
      get actif() { return impl ? impl.realisations.actif : 0; },
      get ids() { return impl && impl.realisations.ids ? impl.realisations.ids : []; },
      get anneauCache() { return !!(impl && impl.realisations.anneauCache); },
    },
    etat() { return impl ? impl.etat() : { quaternion: [0, 0, 0, 1], section: 'ouverture', clair: 0, fps: 0 }; },
    pause() { demandePause = true; if (impl) impl.pause(); },
    reprendre() { demandePause = false; if (impl) impl.reprendre(); },
    get enPause() { return impl ? !!impl.enPause : demandePause; },
    passer() { if (impl) impl.passer(); },
    clairEn(x, y) { return impl && impl.clairEn ? impl.clairEn(x, y) : 0; },
    voile(f, z) { if (impl && impl.voile) impl.voile(f, z); },
    stats() { return impl ? impl.stats() : { chargement: Math.round(charge * 100) / 100 }; },
    detruire() { detruite = true; if (impl) impl.detruire(); resPret(); resFin(); },
    _figer(t) { if (impl && impl._figer) impl._figer(t); },
    _sauter() { if (impl && impl._sauter) impl._sauter(); },
    _debug() { return impl && impl._debug ? impl._debug() : null; },
  };
  return { objet, avance, brancher };
}

/* ------------------------------------------------------------ les parties, réglage par réglage
   Chaque partie est une « clé » ; entre deux clés tout glisse (milieu de partie à milieu de partie).
   decor : feuilles en couches et premiers plans ; pous : poussières ; arc, rayons, ecrans, sol : la salle. */
const CLES = [
  /* ouverture    */ { x: 0, yP: 0, y: 0, z: 0, ech: 1.12, verre: 0, givre: 0, or: 0, teinte: 0x6d3fd1, motF: 0.3, vrilles: 1, essaim: 1, lisere: 1, lueur: 1, balance: 1, tour: 1, seve: 0xa855f7, essaimC: 0xc084fc, decor: 1, pous: 1, arc: 1, rayons: 1, ecrans: 1, sol: 1, arcC: 0x5b5cff },
  /* promesse     */ { x: 0, yP: 0, y: 0, z: 0, ech: 1.08, verre: 1, givre: 0, or: 0, teinte: 0x4f46e5, motF: 0.34, vrilles: 0.75, essaim: 0.8, lisere: 0.6, lueur: 0.9, balance: 1.25, tour: 1, seve: 0xa855f7, essaimC: 0xa5b4fc, decor: 0.85, pous: 1, arc: 0.8, rayons: 0.8, ecrans: 1, sol: 1, arcC: 0x7a4dff },
  /* realisations */ { x: 0, yP: 0, y: 1.9, z: -3.2, ech: 0.85, verre: 1, givre: 0.25, or: 0, teinte: 0x8b5cf6, motF: 0.22, vrilles: 0.4, essaim: 0.5, lisere: 0.3, lueur: 0.6, balance: 0.7, tour: 0.6, seve: 0xa855f7, essaimC: 0xddd6fe, decor: 0.35, pous: 0.6, arc: 0.35, rayons: 0.4, ecrans: 0.6, sol: 1, arcC: 0x8b5cf6 },
  /* experiences  */ { x: 0.42, yP: 0.5, y: 0.05, z: -0.5, ech: 0.72, verre: 1, givre: 0.85, or: 0, teinte: 0x0f8f86, motF: 0.16, vrilles: 0.6, essaim: 0.5, lisere: 0.4, lueur: 0.7, balance: 0.8, tour: 0.7, seve: 0x8b5cf6, essaimC: 0x99f6e4, decor: 0.55, pous: 0.7, arc: 0.4, rayons: 0.5, ecrans: 0.5, sol: 1, arcC: 0x2fd4c0 },   // v18 : partie courte après les réalisations, sceau de glace à droite (les tranches en partent)
  /* rever        */ { x: 0.4, yP: 0, y: 0, z: 0, ech: 0.98, verre: 0, givre: 0, or: 0, teinte: 0x8b5cf6, motF: 0, vrilles: 0, essaim: 0, lisere: 0, lueur: 0, balance: 0, tour: 0, seve: 0xa855f7, essaimC: 0xc084fc, decor: 0, pous: 0, arc: 0, rayons: 0, ecrans: 0, sol: 1, arcC: 0x8b5cf6 },
  /* deroule      */ { x: 0, yP: 0, y: 0, z: 0, ech: 1.08, verre: 0, givre: 0, or: 0, teinte: 0x8b5cf6, motF: 0, vrilles: 0, essaim: 0, lisere: 0, lueur: 0, balance: 0, tour: 0, seve: 0xa855f7, essaimC: 0xc084fc, decor: 0, pous: 0, arc: 0, rayons: 0, ecrans: 0, sol: 1, arcC: 0x8b5cf6 },
  /* matheo       */ { x: 0.7, yP: 0.74, y: 0.05, z: -0.6, ech: 0.55, verre: 1, givre: 0.25, or: 0.45, teinte: 0x2b2163, motF: 0, vrilles: 1, essaim: 0.45, lisere: 0.45, lueur: 0.75, balance: 0.6, tour: 0.55, seve: 0x6ee7b7, essaimC: 0xc4b5fd, decor: 0.4, pous: 0.55, arc: 0.22, rayons: 0.55, ecrans: 0.22, sol: 1, arcC: 0x7c6cff },
  /* questions    */ { x: 0, yP: 0, y: 0, z: -0.3, ech: 1.0, verre: 1, givre: 0.6, or: 0, teinte: 0x4338ca, motF: 0.26, vrilles: 0.5, essaim: 0.7, lisere: 0.4, lueur: 0.7, balance: 0.9, tour: 0.8, seve: 0xa855f7, essaimC: 0xc4b5fd, decor: 0.75, pous: 0.9, arc: 0.6, rayons: 0.6, ecrans: 1, sol: 1, arcC: 0x5b6cff },
  /* contact      */ { x: 0, yP: 0, y: 0, z: 0, ech: 1.14, verre: 0, givre: 0, or: 1, teinte: 0xb7832f, motF: 0.3, vrilles: 1, essaim: 1, lisere: 0.55, lueur: 1, balance: 0.9, tour: 1, seve: 0xf2c87a, essaimC: 0xfde68a, decor: 1, pous: 1, arc: 1, rayons: 1, ecrans: 0.8, sol: 1, arcC: 0xffb45c },
];
const NUMS = ['x', 'yP', 'y', 'z', 'ech', 'verre', 'givre', 'or', 'motF', 'vrilles', 'essaim', 'lisere', 'lueur', 'balance', 'tour', 'decor', 'pous', 'arc', 'rayons', 'ecrans', 'sol'];
const COULS = ['teinte', 'seve', 'essaimC', 'arcC'];
/* la piste des mots projetés : [début dans la page (s), ligne de l'atlas] ; chaque changement est un balayage
   qui suit le défilement (fenêtre de 0,16 partie centrée sur la frontière) */
const PISTE_MOTS = [[0, 0], [1.0, 1], [1.333, 2], [1.667, 3], [2, 5], [3, 4], [5, 6], [8, 7]];   // v18 : RÉALISATIONS à 2, EXPÉRIENCE à 3, QUESTIONS posé dès 5 (le mot change pendant qu'il est éteint)
/* la matière du sceau par partie (matières du labo : verre irisé, glace, jade, holo ; or ajouté pour le final) */
const MATIERE_PAR_PARTIE = [
  { anneau: 'jade', folioles: 'verre', coeur: 'holo' },     // ouverture : le jade de Kazura domine
  { anneau: 'verre', folioles: 'holo', coeur: 'jade' },     // promesse : le verre irisé, les folioles holographiques
  { anneau: 'verre', folioles: 'verre', coeur: 'or' },      // réalisations : du verre derrière les panneaux
  { anneau: 'glace', folioles: 'glace', coeur: 'holo' },    // expériences (v18 : après les réalisations) : la glace
  { anneau: 'verre', folioles: 'holo', coeur: 'jade' },     // rêver (cristal dans le violet)
  { anneau: 'verre', folioles: 'holo', coeur: 'jade' },     // déroulé
  { anneau: 'holo', folioles: 'jade', coeur: 'or' },        // qui fait votre site (le sceau s'efface)
  { anneau: 'holo', folioles: 'glace', coeur: 'jade' },     // questions
  { anneau: 'or', folioles: 'jade', coeur: 'or' },          // contact : or et jade
];
const DECALAGE_MATIERE = { anneau: 0, folioles: 0.07, coeur: 0.14 };
/* v15 : le passage vers le clair (tranches) commence à s = 3,6 et dure 0,7 partie ; voir kzEtat (glsl.js) */
const DEBUT_TRANCHES = 3.6, DUREE_TRANCHES = 0.7;   // v18 : elles partent des Expériences (comme en v16, des réalisations)
const fract = (x) => x - Math.floor(x);
const h1 = (b, k) => fract(Math.sin(b * 12.9898 + k) * 43758.5453);
/* v18 : LA VAGUE de la v16 revient : la coulée irisée du violet au blanc (kzBlanc, glsl.js kzVague). Elle arrive à
   s = 4,84 au rythme de la v16 (kzBlanc 0,5, tout l'écran couvert, à 5,01), VIT un moment (plateau de PLATEAU_VAGUE
   partie), puis se retire un peu plus posément (RETRAIT_VAGUE partie au lieu de 0,17) et se range dans le ruban. */
export const DEBUT_VAGUE = 4.84, DUREE_VAGUE = 0.34, PLATEAU_VAGUE = 0.1, RETRAIT_VAGUE = 0.24;
/* kzBlanc en fonction de s : l'arrivée et le retrait de la v16, séparés par le plateau (0,5) */
export function vagueDe(s) {
  const x = s - DEBUT_VAGUE, m = DUREE_VAGUE * 0.5;
  if (x <= 0) return 0;
  if (x < m) return 0.5 * x / m;
  if (x < m + PLATEAU_VAGUE) return 0.5;
  return Math.min(1, 0.5 + 0.5 * (x - m - PLATEAU_VAGUE) / RETRAIT_VAGUE);
}
const lisseP = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
/* la coulée en un point (u, v : 0 à 1, v vers le haut) : [distance signée à l'axe, demi-largeur], comme kzVague */
function vaguePoint(u, v, w, asp, t) {
  const px = (u - 0.5) * asp, py = v - 0.5;
  const ax = asp < 1 ? 0.34 : 0.5, ay = asp < 1 ? 0.94 : 0.866;
  const le = px * ax + py * ay;
  const d = px * ay - py * ax + 0.06 * Math.sin(le * 4 + t * 0.6) + 0.035 * Math.sin(le * 9 - t * 1.1 + 1.3);
  const e = lisseP(0, 0.5, w) - lisseP(0.5, 1, w);
  const hmax = (0.5 * Math.sqrt(asp * asp + 1) + 0.13) / 0.8 + 0.06;
  const hw = w > 0.0001 && w < 0.9999 ? (0.004 + hmax * e) * (1 + 0.18 * Math.sin(le * 2.6 + w * 5)) : 0;
  return [d, hw];
}
/* le monde CLAIR (blanc) en un point de l'écran (u, v : 0 à 1, v vers le haut), même formule que kzClair et
   kzBlancEn (sans le bruit de la marée) ; bal, liq, w : kzBal, kzLiq, kzBlanc ; N : nombre de bandes.
   v16 : le violet de « Osez rêver » compte comme SOMBRE (0) ; la coulée irisée, très lumineuse, comme claire. */
function clairPoint(u, v, bal, liq, N, w = 0, asp = 1, t = 0) {
  if (bal <= 0 || w <= 0) return 0;
  let c = 1;
  if (bal < 1) {
    const b = Math.floor(u * N);
    const e2 = (bal - 0.66) / 0.34 - h1(b, 9.7) * 0.5 - (1 - v) * 0.32;
    c = e2 >= 0 ? 1 : 0;
  }
  if (c && liq > 0 && v < -0.3 + 1.6 * liq) c = 0;
  if (c && w < 1) {
    const [d, hw] = vaguePoint(u, v, w, asp, t);
    if (!(Math.abs(d) < hw) && w < 0.5) c = 0;
  }
  return c;
}

/* La passe de finition : tranches AFTERDEPTH (gris puis couleurs de profondeur), rive irisée de la marée,
   aberration douce, vignettage, grain. */
function passeFinition(THREE, U) {
  return {
    uniforms: {
      tDiffuse: { value: null }, uTemps: { value: 0 }, uGrain: { value: 0.03 }, uVignette: { value: 0.3 }, uRes: { value: new THREE.Vector2(1, 1) },
      uVoile: { value: 0 }, uVoileZone: { value: new THREE.Vector2(2, 3) }, uAberr: { value: 0.012 },
      kzRes: U.kzRes, kzBal: U.kzBal, kzLiq: U.kzLiq, kzTps: U.kzTps, kzProf: U.kzProf, kzBlanc: U.kzBlanc, kzDoux: U.kzDoux,
    },
    vertexShader: 'precision highp float; varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: /* glsl */ `
      precision highp float;
      ${GLSL_RAMPE}
      ${GLSL_MASQUE}
      ${GLSL_IRIS}
      uniform sampler2D tDiffuse; uniform float uTemps; uniform float uGrain; uniform float uVignette; uniform vec2 uRes;
      uniform float uVoile; uniform vec2 uVoileZone; uniform float uAberr;
      varying vec2 vUv;
      float h(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
      void main() {
        vec2 q = vUv - 0.5;
        vec2 o = q * uAberr * dot(q, q) * 4.0;
        vec3 c = texture2D(tDiffuse, vUv).rgb;
        if (uAberr > 0.0) { c.r = texture2D(tDiffuse, vUv - o).r; c.b = texture2D(tDiffuse, vUv + o).b; }
        float cl = kzClair(gl_FragCoord.xy) * kzBlancEn(vUv);
        // les tranches : la scène sombre devient sa passe de profondeur en gris, puis en couleurs, puis le clair
        if (kzBal > 0.0 && kzBal < 1.0) {
          float et = kzEtat(vUv);
          float N = kzNbBandes();
          float bande = floor(vUv.x * N);
          if (et > -0.06 && et < 3.0) {
            float L = dot(c, vec3(0.2126, 0.7152, 0.0722));
            float dep = clamp(pow(L, 0.55) * 1.35, 0.0, 1.0);
            vec3 gris = vec3(dep) * 0.95 + 0.02;
            // v15 : la profondeur en VIOLETS (indigo au loin, violet, magenta, rose tout près), qui respire :
            // une onde lente parcourt chaque bande, un balayage lumineux descend, la gamme glisse doucement
            float vio = clamp((et - 1.2) / 1.79, 0.0, 1.0);
            float onde = 0.5 + 0.5 * sin(vUv.y * 5.0 - uTemps * 0.7 + bande * 1.7);
            float dv = clamp(dep * (0.9 + 0.2 * onde) + 0.06 * sin(uTemps * 0.35 + vUv.y * 2.0 + bande), 0.0, 1.0);
            vec3 coul = kzViolet(dv) * (0.62 + 0.5 * dep) + vec3(0.16, 0.04, 0.34) * (1.0 - dep) * 0.35;
            float balai = fract(uTemps * 0.11 + kzH1(bande, 2.3));
            float yb = mod(bande, 2.0) < 0.5 ? vUv.y : 1.0 - vUv.y;
            coul += vec3(0.75, 0.55, 1.0) * exp(-kzC2((yb - (1.2 - balai * 1.4)) / 0.035)) * 0.35 * smoothstep(0.0, 0.15, vio);
            coul *= 0.94 + 0.06 * sin(gl_FragCoord.y * 1.5708);
            vec3 tr = mix(gris, coul, smoothstep(1.15, 1.3, et));
            c = mix(c, tr, smoothstep(-0.06, 0.0, et));
            // coutures : un fil blanc au premier front, un fil irisé au deuxième
            c += vec3(0.9, 0.92, 1.0) * exp(-abs(et) * 70.0) * 0.8;
            c += kzHolo(vUv.y * 1.5 + uTemps * 0.1) * exp(-abs(et - 1.2) * 60.0) * 0.9;
          }
          // v16 : l'ouverture sur le MONDE VIOLET (la matière liquide) : un fil irisé fin, puis la matière
          if (et > 2.9 && et < 3.6) {
            float x = et - 3.0;
            c += mix(vec3(1.0, 0.85, 1.0), kzHolo(vUv.x * 2.0 + uTemps * 0.12), 0.6) * exp(-abs(x) * 70.0) * 0.55;
          }
          // fines arêtes verticales entre les bandes pendant le passage
          float fb = abs(fract(vUv.x * N + 0.5) - 0.5) / N * uRes.x;
          c = mix(c, vec3(0.9, 0.86, 1.0), (1.0 - smoothstep(0.0, 1.2, fb)) * 0.35 * sin(3.14159 * kzBal));
        }
        // v17 : la rive de la marée, accordée à la feuille : un fil blanc net et une frange irisée FINE (plus de bandeau
        // arc-en-ciel) ; côté nuit, un reflet très doux
        if (kzLiq > 0.0 && kzLiq < 1.0) {
          float mm = kzMaree(vUv);
          float ep = mm * uRes.y / max(uRes.y / 900.0, 0.75);   // distance à la rive, en pixels de dessin (négative : la nuit)
          vec3 ir = mix(kzHolo(vUv.x * 0.9 - uTemps * 0.05 + mm * 6.0), vec3(1.0), 0.25);
          c = mix(c, ir, exp(-kzC2((ep + 4.0) / 2.6)) * 0.8);
          c = mix(c, vec3(1.0), exp(-kzC2(ep / 1.3)) * 0.85);
          c += ir * exp(ep / 30.0) * step(ep, 0.0) * 0.06;
        }
        vec2 qa = q; qa.x *= uRes.x / uRes.y;
        c *= 1.0 - uVignette * mix(1.0, 0.2, cl) * smoothstep(0.3, 1.0, length(qa));   // v17 : la feuille garde sa propre vignette, légère
        c *= 1.0 - uVoile * (1.0 - smoothstep(uVoileZone.x, uVoileZone.y, vUv.x));
        vec2 px = floor(vUv * uRes);
        float g = h(px + fract(uTemps * 7.13) * vec2(91.7, 37.3)) + h(px * 1.3 + fract(uTemps * 3.7) * vec2(13.1, 71.9)) - 1.0;
        c += g * uGrain * mix(0.6 + 0.4 * (1.0 - dot(c, vec3(0.33))), 0.22, cl);   // v17 : presque pas de grain sur la feuille
        gl_FragColor = vec4(c, 1.0);
      }`,
  };
}

async function monter(M, { canvas, reduit, mobile, figerOuverture: figerInitial, police, avance, telephoneDom = false }) {
  let figerOuverture = figerInitial;
  /* v17 : au téléphone (portrait, moins de 768 px), la page montre son propre carrousel tactile (cartes DOM) :
     l'anneau 3D s'efface, la salle garde son ambiance et prend la couleur du site actif (realisations.aller) */
  let telDom = !!telephoneDom;
  const anneauCache = () => telDom && portrait && largeur < 768;
  const { THREE } = M;
  const V3 = THREE.Vector3;
  const bride = () => typeof window.__bride === 'number';
  const attendreImage = () => new Promise((r) => requestAnimationFrame(() => r()));

  /* ------------------------------------------------------------ rendu */
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, stencil: false, powerPreference: 'high-performance' });
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x040309, 1);
  // la vérification des nuanceurs force des attentes synchrones : seulement en mode essai (?debug)
  renderer.debug.checkShaderErrors = !!window.__kzDebug;
  const dprBase = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 1.75);
  let dpr = dprBase;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.03, 200);
  const envRT = creerEnvironnement(THREE, renderer);
  scene.environment = envRT.texture;

  const U = uniformesPartages(THREE);
  U.kzDoux.value = reduit ? 1 : 0;   // 1 en mouvement réduit
  const typo = await creerTypo(THREE, { mobile, police });
  U.kzMots.value = typo.texture;
  U.kzLignes.value = typo.lignes;
  avance(0.15);

  /* ------------------------------------------------------------ lumières */
  const lum = new THREE.DirectionalLight(0xb9a6ff, 1.5);
  scene.add(lum, lum.target);
  const hemi = new THREE.HemisphereLight(0x2a1d5c, 0x03140e, 0.3);
  scene.add(hemi);
  const lumCoeur = new THREE.PointLight(0xa855f7, 0, 5, 2);
  scene.add(lumCoeur);

  const P = {
    uTemps: { value: 0 }, uVent: { value: 0.4 },
    uLumDir: { value: new V3(0.35, 0.5, -1).normalize() }, uLumCouleur: { value: new THREE.Color(1, 1, 1) },
    uSeve: { value: new THREE.Color(0xa855f7) }, uFTrans: { value: new THREE.Color(0x6fd88a) },
  };
  const partager = (mat, noms) => { for (const n of noms) mat.userData.uniforms[n] = P[n]; };

  /* ------------------------------------------------------------ le fond (salle, monde clair, nuit) */
  const fond = creerFond(THREE, U, { mobile });
  scene.add(fond.mesh, fond.meshClair);
  fond.mesh.visible = false;
  fond.meshClair.visible = false;
  /* le fond de l'ouverture : un nuanceur minuscule (la nuit et sa lueur violette), compilé en premier ;
     le grand fond (salle, sol, arc, écrans, clair, nuit) prend le relais dès qu'il est prêt */
  const uFO = { kzRes: U.kzRes, uHalo: { value: 0 } };
  const fondOuv = new THREE.Mesh(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3)), new THREE.ShaderMaterial({
    uniforms: uFO, depthWrite: false, depthTest: false,
    vertexShader: 'void main() { gl_Position = vec4(position.xy, 1.0, 1.0); }',
    fragmentShader: `uniform vec2 kzRes; uniform float uHalo;
      void main() { vec2 uv = gl_FragCoord.xy / kzRes; vec2 dh = (uv - vec2(0.86, 1.02)) * vec2(kzRes.x / kzRes.y, 1.0);
        gl_FragColor = vec4(vec3(0.07, 0.03, 0.2) * exp(-dot(dh, dh) * 2.2) * uHalo, 1.0); }`,
  }));
  fondOuv.frustumCulled = false; fondOuv.renderOrder = -101;
  scene.add(fondOuv);

  /* ------------------------------------------------------------ ouverture (v12) */
  const vrilleData = construireVrille(THREE, { mobile });
  const matVrille = materiauLiane(THREE, { mobile });
  partager(matVrille, ['uTemps', 'uVent', 'uSeve', 'uLumDir', 'uLumCouleur']);
  matVrille.userData.uniforms.uTeteInt.value = 5;
  const vrille = new THREE.Mesh(vrilleData.geometrie, matVrille);
  vrille.frustumCulled = false;
  scene.add(vrille);
  const feuillesOuv = construireFeuillesOuverture(THREE, { mobile });
  partager(feuillesOuv.materiau, ['uTemps', 'uLumDir', 'uLumCouleur', 'uSeve', 'uFTrans']);
  feuillesOuv.materiau.userData.uniforms.uVent = { value: 0.15 };
  scene.add(feuillesOuv.mesh);
  const construction = creerConstruction(THREE);
  scene.add(construction.mesh);
  const etincelle = creerEtincelle(THREE), comete = creerEtincelle(THREE);
  etincelle.u.uTemps = P.uTemps; comete.u.uTemps = P.uTemps;
  scene.add(etincelle.mesh, comete.mesh);
  const onde = creerOnde(THREE);
  scene.add(onde.mesh);
  const gerbes = creerGerbes(THREE, { mobile });
  gerbes.u.uTemps = P.uTemps;
  scene.add(gerbes.mesh);

  /* ------------------------------------------------------------ le héros : pivot (place) > rot (orientation) > sceau */
  const pivot = new THREE.Group();
  const rot = new THREE.Group();
  pivot.add(rot);
  scene.add(pivot);
  const sceau = construireSceau(THREE, { mobile, U });
  rot.add(sceau.groupe);
  for (const p of sceau.parties) { const uu = p.face.userData.uniforms; uu.uTemps = P.uTemps; uu.uSeve = P.uSeve; uu.uLumDir = P.uLumDir; uu.uLumCouleur = P.uLumCouleur; }
  const contour = construireContour(THREE, Tubes, { mobile, U });
  sceau.groupe.add(contour.mesh);
  const lumFeuilles = new V3(0.35, 0.5, 1).normalize();
  const vrilles = creerVrilles(THREE, { mobile, lumiere: lumFeuilles });
  partager(vrilles.materiau, ['uTemps', 'uVent', 'uSeve', 'uLumDir', 'uLumCouleur']);
  partager(vrilles.feuilles.materiau, ['uTemps', 'uVent', 'uLumDir', 'uLumCouleur', 'uSeve', 'uFTrans']);
  if (mobile) vrilles.feuilles.materiau.userData.uniforms.uTransForce.value = 0.5;
  rot.add(vrilles.mesh, vrilles.feuilles.mesh);
  /* les matières du labo : elles prennent le relais du jade de l'ouverture sous l'éclat, avec le sceau
     épais ; elles réfractent la scène rendue sans le sceau (cible « fond », à résolution réduite) */
  const echFond = mobile ? 0.5 : 0.6;
  const cibleFond = new THREE.WebGLRenderTarget(2, 2, { type: THREE.HalfFloatType });
  const PM = {
    tFond: { value: cibleFond.texture }, uRes: U.kzRes, uTemps: P.uTemps, uVueInv: { value: new THREE.Matrix4() }, uSeve: P.uSeve, uRefr: { value: 1 },
    kzRes: U.kzRes, kzBal: U.kzBal, kzLiq: U.kzLiq, kzTps: U.kzTps, kzProf: U.kzProf, kzBlanc: U.kzBlanc, kzDoux: U.kzDoux,
    uCentre: { value: new V3() }, uEch: { value: 1 },
  };
  const epaisses = geometriesEpaisses(THREE, { mobile });
  const matieres = new Map(), geoFine = new Map(), matFine = new Map();
  for (const p of sceau.parties) { matieres.set(p, materiauMatiere(THREE, PM)); geoFine.set(p, p.mesh.geometry); matFine.set(p, p.mesh.material); }
  const partieDe = (p) => (p === sceau.anneau ? 'anneau' : p === sceau.coeur ? 'coeur' : 'folioles');
  const geoEpaisse = (p) => (p === sceau.anneau ? epaisses.anneau : p === sceau.coeur ? epaisses.coeur : epaisses.foliole);
  const rubanA = creerRubanAnneau(THREE, null, PM, { mobile });
  rot.add(rubanA.mesh);
  rubanA.mesh.visible = false;
  const aura = creerAura(THREE);
  aura.u.uTemps = P.uTemps;
  pivot.add(aura.mesh);
  const essaim = creerEssaim(THREE, { mobile });
  essaim.u.uTemps = P.uTemps;
  pivot.add(essaim.mesh);

  /* ------------------------------------------------------------ le décor du héros (v14) */
  const decor = creerDecor(THREE, { mobile, U });
  scene.add(decor.groupe);

  /* ------------------------------------------------------------ la vie du labo : feuilles qui tombent, volutes, essaims */
  const vieLabo = creerVie(THREE, { scene, camera, mobile, reduit, partages: P, sansVrilles: true });
  vieLabo.regler(true);
  const AV = { seve: new THREE.Color(), seveInt: 2.4, jadeLueur: 0.05, lucioles: new THREE.Color(), luciolesInt: 1 };

  /* ------------------------------------------------------------ ruban, monde clair, carrousel */
  let ruban = null, rubanPortrait = null;
  const pivotRuban = new THREE.Group();
  scene.add(pivotRuban);
  function construireRuban(portraitR) {
    if (ruban && rubanPortrait === portraitR) return;
    if (ruban) { pivotRuban.remove(ruban.groupe); ruban.groupe.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); }); }
    ruban = creerRuban(THREE, { mobile, U, lumiere: lumFeuilles, portrait: portraitR, PM });
    ruban.u.uTemps = P.uTemps;
    pivotRuban.add(ruban.groupe);
    rubanPortrait = portraitR;
  }
  const clair = creerClair(THREE, { mobile, U, PM });
  scene.add(clair.groupe);
  const pictos = creerPictos(THREE, { mobile, U, reduit });
  scene.add(pictos.groupe);
  const carrousel = creerCarrousel(THREE, { mobile, renderer, reduit, U });
  scene.add(carrousel.groupe);

  /* ------------------------------------------------------------ post-traitement */
  const cible = new THREE.WebGLRenderTarget(2, 2, { type: THREE.HalfFloatType, samples: mobile ? 0 : 4 });
  const composer = new M.EffectComposer(renderer, cible);
  composer.addPass(new M.RenderPass(scene, camera));
  const bloom = new M.UnrealBloomPass(new THREE.Vector2(2, 2), 0.75, 0.6, 0.85);
  if (mobile) { const o = bloom.setSize.bind(bloom); bloom.setSize = (w, h) => o(Math.max(2, w >> 2), Math.max(2, h >> 2)); }
  composer.addPass(bloom);
  composer.addPass(new M.OutputPass());
  const finition = new M.ShaderPass(passeFinition(THREE, U));
  for (const k of ['kzRes', 'kzBal', 'kzLiq', 'kzTps', 'kzProf', 'kzBlanc', 'kzDoux']) finition.uniforms[k] = U[k];
  finition.material.uniforms = finition.uniforms;
  composer.addPass(finition);

  /* ------------------------------------------------------------ cadrage */
  let distOuverture = 7, largeur = 1, hauteur = 1, yC = -0.3, portrait = false, voileManuel = null;
  const repere = new V3();
  function construireCamera(aspect) {
    const fov = aspect < 1 ? melange(54, 42, lisse(0.45, 1.0, aspect)) : melange(40, 34, lisse(1.0, 1.9, aspect));
    camera.fov = fov;
    const t2 = Math.tan(fov * Math.PI / 360) * 2;
    distOuverture = (2 * RAYON_SCEAU) / ((aspect < 1 ? 0.66 : 0.46) * Math.min(1, aspect) * t2);
    portrait = aspect < 1;
    const petit = portrait && (canvas.clientHeight || window.innerHeight) < 720;
    if (petit) distOuverture *= 1.12;
    yC = portrait ? (petit ? -0.78 : -0.5) : -0.3;
    U.kzSalleC.value.set(0, 0, distOuverture * 0.85);
    U.kzSalleR.value = portrait ? 7.5 : 9.5;
    fond.u.uSolY.value = portrait ? -2.6 : -2.3;
    camera.updateProjectionMatrix();
    carrousel.cadrer({ portrait, camera });
    construireRuban(portrait);
    repere.set(0, 0, distOuverture);
    decor.cadrer(camera, repere, portrait);
    clair.cadrer({ camera, portrait, dist: distOuverture });
  }
  function dimensionner() {
    largeur = Math.max(1, canvas.clientWidth || window.innerWidth);
    hauteur = Math.max(1, canvas.clientHeight || window.innerHeight);
    renderer.setPixelRatio(dpr);
    renderer.setSize(largeur, hauteur, false);
    composer.setPixelRatio(dpr);
    composer.setSize(largeur, hauteur);
    const W = Math.round(largeur * dpr), H = Math.round(hauteur * dpr);
    U.kzRes.value.set(W, H);
    cibleFond.setSize(Math.max(2, Math.round(W * echFond)), Math.max(2, Math.round(H * echFond)));
    finition.uniforms.uRes.value.set(W, H);
    camera.aspect = largeur / hauteur;
    construireCamera(camera.aspect);
    U.kzPixAng.value = Math.tan(camera.fov * Math.PI / 360) * 2 / H;
    const taille = dpr * (largeur < 700 ? 1.15 : 1) * Math.min(1.4, hauteur / 800);
    tailleP = taille;
    vieLabo.dimensionner(largeur, hauteur, dpr);
    essaim.u.uTaille.value = taille;
    gerbes.u.uTaille.value = taille;
    construction.u.uPx.value = 1 / H;
  }
  let tailleP = 1, salleT = 0, telFondu = 1;
  // v18 : la ligne du ruban (la vague s'y range)
  const LIGNE_N = 16, ligneRuban = Array.from({ length: LIGNE_N }, () => new V3());
  dimensionner();
  const ro = new ResizeObserver(() => dimensionner());
  ro.observe(canvas);

  /* ------------------------------------------------------------ état */
  // v14 : le rythme lent de la v12, un peu plus posé ; 4,4 s jusqu'au sceau sous mouvement réduit
  const echelle = reduit ? 1.55 : 1.15;
  const FIN = 3.0, TITRE = 2.55;
  let tOuv = 0, accel = 1, ouvertureCommencee = false;
  let sCible = 0, sLisse = 0, sPrec = 0, vitesse = 0, sDepart = null, recu = false;
  let temps = 0, dernier = 0, raf = 0, detruit = false, enPause = false;
  let finir, resoudrePret;
  const ouvertureFinie = new Promise((r) => { finir = r; });
  const pret = new Promise((r) => { resoudrePret = r; });
  let titreDonne = false, gerbeLancee = false;
  let dernierGeste = -1e9;
  const mesures = [];
  let derniereAdaptation = 0;
  let sectionCourante = 'ouverture';
  let croissV = 0, motDecal = 0, spin = 0;
  let camY = 0, camYCible = 0, camX = 0;
  let inclX = 0, inclY = 0, inclXc = 0, inclYc = 0;
  let pulse = 0;
  const pretes = { premier: false, salle: false, matieres: false, clair: false, carrousel: false };
  const C = {}; for (const k of NUMS) C[k] = 0; for (const k of COULS) C[k] = new THREE.Color();
  const CLESC = CLES.map((c) => { const o = { ...c }; for (const k of COULS) o[k] = new THREE.Color(c[k]); return o; });
  const tmp = new V3(), tmp2 = new V3(), tete = new V3(), teteRuban = new V3(), qTmp = new THREE.Quaternion();
  const teinte = new THREE.Color(), couleurSite = new THREE.Color(), cJade = new THREE.Color(0x10b981), cTmp = new THREE.Color();

  function etatOuverture(t) {
    return {
      etincelle: lisse(0.0, 0.25, t) * (1 - lisse(0.5, 1.0, t)),
      vrille: sortieQuartique(borne((t - 0.28) / 1.15)) * (vrilleData.longueur + 0.9),
      feuilles: lisse(0.75, 1.7, t) * 1.3,
      repli: entreeSortie(borne((t - 1.6) / 0.5)),
      dissout: lisse(1.82, 2.28, t) * 1.05,
      queue: entreeSortie(borne((t - 1.45) / 0.85)) * (vrilleData.longueur + 0.6),
      folioles: sortieCubique(borne((t - 1.7) / 0.55)),
      coeur: sortieCubique(borne((t - 1.92) / 0.32)),
      eclat: Math.exp(-Math.pow((t - 2.32) / 0.15, 2)),
      onde: borne((t - 2.24) / 0.7),
      retrait: entreeSortie(borne((t - 2.4) / 0.6)),
      liane: lisse(1.75, 3.0, t) * 1.6,
      lumiere: lisse(0.2, 2.6, t),
      construction: lisse(0.3, 1.75, t),
      constructionFondu: lisse(0.25, 0.6, t) * (1 - lisse(1.9, 2.7, t)),
      vivant: lisse(2.55, 4.6, t),
      salle: lisse(2.45, 4.4, t),
      decor: lisse(2.9, 4.9, t),
    };
  }

  /* les clés lissées : milieu de partie à milieu de partie */
  function evaluerCles(s) {
    const x = borne(s - 0.5, 0, CLES.length - 1);
    const i = Math.min(CLES.length - 2, Math.floor(x));
    let t = x - i; t = t * t * (3 - 2 * t);
    const a = CLESC[i], b = CLESC[i + 1];
    for (const k of NUMS) C[k] = a[k] + (b[k] - a[k]) * t;
    for (const k of COULS) C[k].copy(a[k]).lerp(b[k], t);
    return C;
  }
  /* le mot : deux lignes de l'atlas et le balayage entre elles, en fonction de s seulement */
  const motEtat = { a: 0, b: 0, mix: 0 };
  function evaluerMot(s) {
    let j = 0;
    for (let k = 0; k < PISTE_MOTS.length; k++) if (s >= PISTE_MOTS[k][0] - 0.08) j = k;
    const [s0, l] = PISTE_MOTS[j];
    if (j > 0 && s < s0 + 0.08) { motEtat.a = PISTE_MOTS[j - 1][1]; motEtat.b = l; motEtat.mix = lisse(s0 - 0.08, s0 + 0.08, s); }
    else { motEtat.a = l; motEtat.b = l; motEtat.mix = 0; }
    return motEtat;
  }
  /* la matière d'une partie du sceau, en fonction de s : A, B et le front (0 à 1) */
  const matEtat = { a: 'jade', b: 'jade', f: 0 };
  function evaluerMatiere(s, partie) {
    const x = s - DECALAGE_MATIERE[partie];
    const j = Math.min(8, Math.max(0, Math.floor(x + 0.28)));
    if (j >= 1 && x < j + 0.02) { matEtat.a = MATIERE_PAR_PARTIE[j - 1][partie]; matEtat.b = MATIERE_PAR_PARTIE[j][partie]; matEtat.f = lisse(j - 0.28, j + 0.02, x); }
    else { matEtat.a = matEtat.b = MATIERE_PAR_PARTIE[j][partie]; matEtat.f = 1; }
    return matEtat;
  }

  /* seul un geste du visiteur accélère l'ouverture */
  function accelerer() { if (tOuv < FIN && ouvertureCommencee) accel = 4; }
  function passer() { if (performance.now() - dernierGeste < 1500) accelerer(); }

  /* ------------------------------------------------------------ gestes */
  const interactif = (t) => t && t.closest && t.closest('a,button,input,textarea,select,label,summary,[role="button"],[contenteditable],video,iframe');
  /* v16 : la salle des réalisations : survol (la main) et clic sur un panneau voisin (il vient de face) ;
     un glissement n'est pas un clic */
  let carVisible = 0, xBas = 0, yBas = 0;
  function surBas(e) { xBas = e.clientX; yBas = e.clientY; }
  function surClic(e) {
    if (carVisible < 0.6 || interactif(e.target)) return;
    if (Math.hypot(e.clientX - xBas, e.clientY - yBas) > 8) return;
    carrousel.cliquer(e.clientX / Math.max(1, largeur), e.clientY / Math.max(1, hauteur));
  }
  function surPointeur(e) {
    if (carVisible > 0.5 && !interactif(e.target)) carrousel.pointer(e.clientX / Math.max(1, largeur), e.clientY / Math.max(1, hauteur));
    else carrousel.pointer(null);
    if (e.pointerType === 'touch') return;
    inclYc = ((e.clientX / Math.max(1, largeur)) - 0.5) * 2;
    inclXc = ((e.clientY / Math.max(1, hauteur)) - 0.5) * 2;
  }
  function surOrientation(e) {
    if (e.beta == null || e.gamma == null) return;
    inclYc = borne(e.gamma / 30, -1, 1);
    inclXc = borne((e.beta - 45) / 30, -1, 1);
  }
  function surToucher(e) {
    if (e.type === 'keydown' && ['Shift', 'Control', 'Alt', 'Meta', 'Tab'].includes(e.key)) return;
    dernierGeste = performance.now();
    if (tOuv < FIN && ouvertureCommencee) { accelerer(); return; }
    if (e.type !== 'pointerdown' || interactif(e.target)) return;
    const x = e.clientX / Math.max(1, largeur), y = 1 - e.clientY / Math.max(1, hauteur);
    // le sceau : un toucher le fait luire
    if (!pivot.visible || U.kzBal.value > 0.5) return;
    tmp2.setFromMatrixPosition(sceau.groupe.matrixWorld);
    tmp.copy(tmp2).project(camera);
    const sx = tmp.x * 0.5 + 0.5, sy = tmp.y * 0.5 + 0.5;
    const r = RAYON_SCEAU * pivot.scale.x / (Math.tan(camera.fov * Math.PI / 360) * 2 * Math.max(0.5, camera.position.distanceTo(tmp2)));
    if (Math.hypot((x - sx) * largeur / hauteur, y - sy) < r * 1.1) {
      pulse = 1;
      gerbes.lancer(tmp2, temps, { ech: reduit ? 0.5 : 1.2, plan: true });
    }
  }
  window.addEventListener('pointerdown', surToucher, { passive: true });
  window.addEventListener('keydown', surToucher);
  window.addEventListener('wheel', surToucher, { passive: true });
  window.addEventListener('touchstart', surToucher, { passive: true });
  window.addEventListener('pointermove', surPointeur, { passive: true });
  window.addEventListener('pointerdown', surBas, { passive: true });
  window.addEventListener('click', surClic);
  window.addEventListener('deviceorientation', surOrientation, { passive: true });

  /* ------------------------------------------------------------ une image */
  function image(now) {
    if (enPause) return;
    raf = requestAnimationFrame(image);
    if (detruit || document.hidden || !pretes.premier) { dernier = now; return; }
    const dt = Math.min(0.05, dernier ? (now - dernier) / 1000 : 0.016);
    dernier = now;
    temps += dt;
    P.uTemps.value = temps;
    U.kzTps.value = temps;

    // ouverture
    if (ouvertureCommencee && tOuv < 7) tOuv += (dt / echelle) * accel;
    const tO = figerOuverture != null ? figerOuverture : tOuv;
    const o = etatOuverture(tO);
    if (!titreDonne && tO >= TITRE) { titreDonne = true; finir(); }
    const L = o.lumiere;
    const viv = o.vivant;

    // progression : la page lisse déjà son défilement ; on ne garde qu'un léger amorti contre les à-coups
    sLisse = amortir(sLisse, sCible, reduit ? 7 : 10, dt);
    if (Math.abs(sLisse - sCible) < 1e-5) sLisse = sCible;
    const s = sLisse;
    const v = Math.abs(s - sPrec) / Math.max(dt, 1e-3); sPrec = s;
    vitesse = v > vitesse ? amortir(vitesse, v, 6, dt) : amortir(vitesse, v, 1.5, dt);
    P.uVent.value = (reduit ? 0.28 : 0.42) + Math.min(1, vitesse * 0.8) * (reduit ? 0.4 : 1.1);
    const K = evaluerCles(s);

    // mondes : les tranches vers le clair, la marée qui ramène le sombre (l'atelier : la salle, apaisée)
    // v15 : le passage respire (tranches, gris bref, long violet, puis le clair), de 3,6 à 4,3
    const bal = borne((s - DEBUT_TRANCHES) / DUREE_TRANCHES);
    const liq = lisse(5.86, 6.18, s);   // v18 : la marée de la v17, aux positions de la v16 (matheo est la partie 6)
    U.kzBal.value = bal;
    U.kzLiq.value = bal > 0 ? liq : 0;
    const clairPart = bal * (1 - liq);
    // v18 : la vague du violet au blanc (arrivée, plateau, retrait) ; blancPart : la part du monde de l'autre côté qui est blanche
    const vague = vagueDe(s);
    U.kzBlanc.value = vague;
    // le flux de la coulée suit le défilement sans s'arrêter pendant le plateau (fond.js)
    fond.u.uFlux.value = (s - DEBUT_VAGUE) / DUREE_VAGUE;
    const blancPart = clairPart * lisse(0.3, 0.7, vague);
    // la salle reste apaisée dans « Qui fait votre site » (v16)
    const atelier = lisse(5.92, 6.12, s) * (1 - lisse(6.78, 7.12, s));
    const fenetre = (a, b) => lisse(a, a + 0.12, s) * (1 - lisse(b - 0.14, b, s));
    U.kzProf.value = Math.max(fenetre(0.9, 1.3), fenetre(7.88, 8.3)) * (reduit ? 0.75 : 1);
    if (pretes.salle) salleT += dt;
    U.kzSalleForce.value = o.salle * (1 - 0.42 * atelier) * lisse(0, 1.2, salleT);
    fond.u.uHaloOuv.value = L * (1 - o.salle * 0.6);
    uFO.uHalo.value = fond.u.uHaloOuv.value;
    // le sombre n'est pas peint quand tout l'écran est clair ; le clair seulement pendant et après les tranches
    fond.mesh.visible = pretes.salle && !(bal >= 1 && liq <= 0);
    fond.meshClair.visible = pretes.clair && bal > 0 && liq < 1;
    fondOuv.visible = !pretes.salle;
    fond.u.uArc.value = K.arc * o.decor;
    fond.u.uArcCouleur.value.copy(K.arcC);
    fond.u.uRayons.value = K.rayons * o.salle * (reduit ? 0.8 : 1);
    fond.u.uEcrans.value = K.ecrans * o.decor;
    fond.u.uSol.value = K.sol * o.salle;
    fond.u.uMotClair.value = 0;   // v17 : plus de mot en contour sur le blanc
    // v16 : la matière violette coule (moins vite en mouvement réduit) et monte avec la page
    fond.u.uLent.value = reduit ? 0.5 : 1;
    fond.u.uDefile.value = s;
    // v17 : le dessin du sceau sur la feuille, au fil des moments du déroulé (lus dans la page par pictos.js)
    fond.u.uDessin.value = pretes.clair && s > 4.9 && s < 6.4 ? pictos.avancement(s, hauteur) : 0;
    fond.u.uTexteG.value = portrait ? 0 : 1;

    // teinte : celle de la partie, ou la couleur du site affiché dans le carrousel
    const carVis = lisse(1.72, 2.08, s) * (1 - lisse(2.86, 3.02, s));
    // v17 : au téléphone avec le carrousel DOM de la page, l'anneau s'efface (fondu) ; la salle et sa couleur restent
    // (effacé tout de suite, sans fondu : aucun panneau ne doit se voir derrière les cartes de la page)
    telFondu = anneauCache() ? 0 : amortir(telFondu, 1, 6, dt);
    carVisible = carVis * (pretes.carrousel ? 1 : 0) * telFondu;
    if (carVisible < 0.5) carrousel.pointer(null);
    teinte.copy(K.teinte);
    if (carrousel.nombre) { carrousel.couleurActive(couleurSite); teinte.lerp(couleurSite, carVis); }
    U.kzTeinte.value.lerp(teinte, 1 - Math.exp(-dt * 3));

    // le mot projeté, au fil du défilement
    const me = evaluerMot(s);
    U.kzMotA.value.set(me.a, typo.largeurs[me.a], me.b, typo.largeurs[me.b]);
    U.kzMotMix.value = me.mix;
    motDecal += dt * (reduit ? 0.45 : 1.15) * (1 + Math.min(4, vitesse * 3));
    U.kzMotDecal.value = motDecal;
    U.kzMotForce.value = K.motF;

    // caméra : face au sceau ; elle descend avec la liane dans le déroulé ; un peu vers la souris (parallaxe)
    let teteY = 0;
    if (ruban) {
      const r = ruban.maj(s, dt, temps, pivotRuban, teteRuban);
      teteY = r.teteY;
    }
    // la caméra descend avec la liane dans le déroulé, puis remonte avec la marée, au rythme du défilement
    // (aucune remontée minutée) ; la salle, elle, est toujours vue depuis sa hauteur (fond.maj) : jamais de noir
    camYCible = s > 4.9 && s < 6.3 && ruban ? Math.min(0, teteY + (portrait ? 1.6 : 1.3)) : 0;
    camY = amortir(camY, camYCible, reduit ? 3 : 5, dt);
    const camYVu = camY * (1 - lisse(5.9, 6.22, s));
    inclX = amortir(inclX, inclXc, 2, dt); inclY = amortir(inclY, inclYc, 2, dt);
    camX = amortir(camX, inclY * (reduit ? 0.08 : 0.18) * viv * (1 - clairPart * 0.6), 2.5, dt);
    const pc = tmp.set(camX, camYVu - inclX * (reduit ? 0.03 : 0.07) * viv, distOuverture);
    const derive = (reduit ? 0.012 : 0.03) * viv;
    pc.x += Math.sin(temps * 0.21) * derive; pc.y += Math.sin(temps * 0.17 + 1) * derive;
    const recul = (1 - o.retrait) * distOuverture * (reduit ? 0.08 : 0.24);
    pc.z -= recul;
    camera.position.copy(pc);
    camera.lookAt(camX * 0.5, camYVu + yC, 0);
    camera.updateMatrixWorld();
    fond.maj(camera, camYVu);

    // le héros : place, échelle, respiration, orientation
    const ech = melange(1, K.ech, viv) * (portrait ? 1 - 0.35 * K.yP : 1);
    // v15 : dans « Qui fait votre site », le sceau se range à droite (en haut au téléphone), la page écrit à gauche
    // (x et yP en fractions de la demi-largeur et de la demi-hauteur de l'écran, au plan du sceau)
    const demiH = Math.tan(camera.fov * Math.PI / 360) * Math.max(1, camera.position.z - K.z * viv);
    pivot.position.set(portrait ? 0 : K.x * demiH * camera.aspect * viv, K.y * viv + (portrait ? K.yP * demiH * viv : 0), K.z * viv);
    pivot.scale.setScalar(Math.max(0.0005, ech));
    pivot.visible = ech > 0.01;
    PM.uCentre.value.copy(pivot.position); PM.uEch.value = ech;
    const respire = 1 + 0.016 * Math.sin(temps * 0.9) * viv * (reduit ? 0.6 : 1);
    rot.scale.setScalar(respire);
    const ampl = (reduit ? 0.5 : 1) * K.balance * viv;
    const vv = reduit ? 0.6 : 1;
    const enDescente = lisse(4.7, 5.15, s);
    const fixeX = -0.16 * clairPart * (1 - enDescente), fixeY = 0.32 * clairPart * (1 - 0.6 * enDescente);
    const swY = Math.sin(temps * 0.23 * vv) * 0.42 * ampl + inclY * 0.16 * ampl + fixeY;
    const swX = Math.sin(temps * 0.17 * vv + 1.0) * 0.16 * ampl + inclX * 0.1 * ampl + fixeX;
    spin += dt * 0.07 * vv * K.tour * viv;
    const tiers = Math.PI * 2 / 3;
    const spinVu = spin * (1 - clairPart) + Math.round(spin / tiers) * tiers * clairPart;
    rot.rotation.set(swX, swY, spinVu, 'XYZ');
    pulse = Math.max(0, pulse - dt * 1.4);
    sceau.groupe.scale.setScalar(1 + pulse * 0.04);
    pivot.updateMatrixWorld(true);
    pivotRuban.position.copy(pivot.position);
    pivotRuban.scale.copy(pivot.scale);
    pivotRuban.rotation.set(swX, swY, 0, 'XYZ');
    pivotRuban.visible = bal > 0.001 && liq < 0.999;
    // v18 : en se retirant, la vague se resserre sur le ruban et s'y range : la ligne du ruban à l'écran (fond.js)
    const range = lisse(0.55, 0.9, vague) * (vague < 1 ? 1 : 0);
    fond.u.uRange.value = ruban && pivotRuban.visible ? Math.max(range, 1e-4) * (vague > 0.5 && vague < 1 ? 1 : 0) : 0;
    if (fond.u.uRange.value > 0) {
      pivotRuban.updateMatrixWorld(true);
      ruban.ligne(LIGNE_N, temps, ligneRuban);
      const asp = largeur / hauteur;
      let prof = 0;
      for (let k = 0; k < LIGNE_N; k++) {
        const w = pivotRuban.localToWorld(ligneRuban[k]);
        prof += camera.position.distanceTo(w) / LIGNE_N;
        w.project(camera);
        fond.u.uRubanP.value[k].set(w.x * 0.5 * asp, w.y * 0.5);
      }
      fond.u.uRubanN.value = LIGNE_N;
      // la demi-largeur du ruban à l'écran (hauteurs d'écran) : la coulée finit plus fine que lui, cachée dessous
      const demi = ruban.demiLargeur * pivotRuban.scale.x / (Math.tan(camera.fov * Math.PI / 360) * 2 * Math.max(0.5, prof));
      // au départ, une bande large (proportionnée à l'écran), qui s'affine jusqu'à passer sous le ruban
      // (au départ assez large pour couvrir tout l'écran : rien ne saute à la fin du plateau)
      const L0 = 0.5 * asp + 0.8;
      fond.u.uRubanL.value = demi * 0.55 + (L0 - demi * 0.55) * Math.pow(1 - lisse(0.5, 0.95, vague), 1.7);
    }

    // lumière principale fixée dans le repère de la caméra
    lum.color.set(0xb9a6ff).lerp(K.seve, 0.3);
    lum.intensity = 1.5 * (0.15 + 0.85 * L);
    tmp2.copy(P.uLumDir.value).transformDirection(camera.matrixWorld);
    lum.position.copy(camera.position).addScaledVector(tmp2, 30);
    lum.target.position.copy(camera.position);
    hemi.intensity = 0.3 * (0.2 + 0.8 * L);
    P.uLumCouleur.value.set(0xb9a6ff).multiplyScalar(0.8 * (0.2 + 0.8 * L));
    P.uSeve.value.copy(K.seve);
    scene.environmentIntensity = 0.42 * (0.3 + 0.7 * L);
    scene.environmentRotation.y = Math.sin(temps * (reduit ? 0.08 : 0.13)) * 0.45 + spinVu * 0.2;

    // ouverture : vrille, feuilles, sceau qui se matérialise
    const uvr = matVrille.userData.uniforms;
    uvr.uCroiss.value = o.vrille; uvr.uQueue.value = o.queue - 0.2; uvr.uSeveInt.value = 2.6 * 1.2;
    vrille.visible = o.queue < vrilleData.longueur + 0.3;
    const fo = feuillesOuv.materiau.userData.uniforms;
    fo.uCroiss.value = o.feuilles; fo.uRepli.value = o.repli; fo.uDissout.value = o.dissout;
    feuillesOuv.mesh.visible = o.feuilles > 0.001 && o.dissout < 1.0;
    const longBoucle = vrilleData.longueur - vrilleData.longJet;
    sceau.apparition(sceau.anneau, borne((o.queue - vrilleData.longJet) / longBoucle + 0.05));
    for (const f of sceau.folioles) sceau.apparition(f, o.folioles);
    sceau.apparition(sceau.coeur, o.coeur);
    const eclat = o.eclat * (reduit ? 0.45 : 1) + pulse * 0.35;
    sceau.tout('uEclat', eclat);
    sceau.lisere(1.6 * (1 - 0.55 * o.retrait) * (0.35 + 0.65 * L) * (0.9 + 0.1 * Math.sin(temps * 1.1)) * melange(1, K.lisere, viv));
    sceau.tout('uLueur', (0.26 + 0.3 * eclat) * (1 - 0.35 * o.retrait) * (0.3 + 0.7 * L) * melange(1, K.lueur, viv));
    sceau.peau({ verre: K.verre * viv, givre: K.givre * viv, or: K.or * viv });
    for (const pa of sceau.parties) pa.face.envMapIntensity = 2.6 + 2.2 * K.or * viv;

    // les matières du labo prennent le relais sous l'éclat (dès qu'elles sont compilées) ; elles suivent le défilement
    const relais = tO >= 2.33 && pretes.matieres;
    for (const pa of sceau.parties) {
      const m = matieres.get(pa);
      pa.mesh.material = relais ? m : matFine.get(pa);
      pa.mesh.geometry = relais ? geoEpaisse(pa) : geoFine.get(pa);
      if (!relais) continue;
      const e = evaluerMatiere(s, partieDe(pa));
      m.uniforms.uA.value = INDICE[e.a]; m.uniforms.uB.value = INDICE[e.b];
      m.uniforms.uFront.value = e.f;
      m.uniforms.uLisere.value = 0.45 * melange(1, 0.5 + 0.5 * K.lisere, viv);
      m.uniforms.uEclat.value = o.eclat * (reduit ? 0.3 : 0.6) + pulse * 0.25;
    }
    PM.uVueInv.value.copy(camera.matrixWorld);
    // le ruban holographique s'enroule autour de l'anneau après l'ouverture (monde sombre seulement)
    const rubVis = (tO > 2.6 && pretes.matieres ? 1 : 0) * (1 - carVis) * (1 - clairPart);
    const ru = rubanA.mat.uniforms;
    const cibleR = rubVis > 0.5 ? rubanA.longAnneau : 0;
    ru.uLong.value = cibleR > ru.uLong.value ? Math.min(cibleR, ru.uLong.value + dt * (reduit ? 1.6 : 2.6)) : Math.max(cibleR, ru.uLong.value - dt * 4);
    rubanA.mesh.visible = ru.uLong.value > 0.01;

    // le contour du monde clair se trace pendant que les tranches passent
    contour.u.uTrace.value = lisse(4.0, 4.45, s) * 1.02;
    contour.mesh.visible = bal > 0.001 && liq < 0.999;

    // traits de construction (ouverture)
    construction.u.uProg.value = o.construction;
    construction.u.uFondu.value = o.constructionFondu * (reduit ? 0.8 : 1);
    construction.mesh.visible = construction.u.uFondu.value > 0.002;

    // étincelle (au cœur) et comète (la tête de la vrille)
    etincelle.mesh.position.set(0, 0, 0.06);
    etincelle.mesh.quaternion.copy(camera.quaternion);
    etincelle.mesh.scale.setScalar(0.5 + 0.9 * lisse(0, 0.3, tO));
    etincelle.u.uInt.value = o.etincelle * 1.6 + o.eclat * (reduit ? 0.45 : 1) * 0.25;
    etincelle.mesh.visible = etincelle.u.uInt.value > 0.002;
    vrilleData.tete(Math.max(0, o.vrille - 0.15), tete);
    comete.mesh.position.copy(tete).add(tmp2.set(0, 0, 0.08));
    comete.mesh.quaternion.copy(camera.quaternion);
    comete.mesh.scale.setScalar(0.7);
    const ic = lisse(0.28, 0.4, tO) * (1 - lisse(1.25, 1.6, tO));
    comete.u.uInt.value = ic * 1.3; comete.u.uRayons.value = 0.4;
    comete.mesh.visible = ic > 0.002;
    lumCoeur.position.copy(tete).add(tmp2.set(0, 0, 0.5));
    lumCoeur.intensity = (ic * 3 + o.etincelle * 2 + o.eclat * 4 + (1 - o.retrait) * 0.6 * lisse(1.6, 2.2, tO)) * (reduit ? 0.8 : 1);
    lumCoeur.color.copy(K.seve);
    aura.u.uCouleur.value.copy(K.seve);
    aura.u.uInt.value = lisse(1.9, 2.6, tO) * (1 - clairPart) * melange(1, 0.6 + 0.4 * K.lueur, viv) * (reduit ? 0.8 : 1);
    aura.mesh.visible = aura.u.uInt.value > 0.002;
    onde.u.uR.value = RAYON_SCEAU * (1 + sortieCubique(o.onde) * 2.2);
    onde.u.uA.value = o.onde > 0 && o.onde < 1 ? Math.pow(1 - o.onde, 3) * (reduit ? 0.5 : 1.1) : 0;
    onde.u.uLarg.value = 0.035 + 0.1 * o.onde;
    onde.u.uCouleur.value.copy(K.seve);
    onde.mesh.visible = onde.u.uA.value > 0.001;
    if (!gerbeLancee && tO >= 2.27 && tO < 2.8) { gerbeLancee = true; gerbes.lancer(tmp.set(0, 0, 0.05), temps, { ech: reduit ? 1.1 : 2.3, plan: true }); }
    gerbes.u.uCouleur.value.copy(K.essaimC).lerp(K.seve, 0.4);

    // vrilles : poussent après l'ouverture, se retirent avant le monde clair, repoussent ensuite
    const cibleV = tO < 2.6 ? o.liane : Math.max(o.liane * K.vrilles, vrilles.longueur * K.vrilles);
    croissV = cibleV > croissV ? Math.min(cibleV, croissV + dt * (reduit ? 0.55 : 0.9)) : Math.max(cibleV, croissV - dt * 2.2);
    vrilles.materiau.userData.uniforms.uCroiss.value = croissV;
    vrilles.materiau.userData.uniforms.uSeveInt.value = 2.4;
    vrilles.feuilles.materiau.userData.uniforms.uCroiss.value = croissV;
    vrilles.mesh.visible = croissV > 0.01 && pretes.salle;
    vrilles.feuilles.mesh.visible = croissV > 0.15 && pretes.salle;

    // essaim
    essaim.u.uCouleur.value.copy(K.essaimC);
    essaim.u.uInt.value = K.essaim * lisse(2.2, 3.6, tO) * (1 - clairPart) * (reduit ? 0.8 : 1);
    essaim.u.uVitesse.value = reduit ? 0.5 : 1;
    essaim.mesh.visible = essaim.u.uInt.value > 0.002 && pretes.salle;

    // le décor du héros : il entre en glissant depuis les bords à la fin de l'ouverture
    cTmp.copy(K.teinte).lerp(K.seve, 0.3);
    decor.maj({
      temps, vent: P.uVent.value, intF: K.decor * o.decor * (1 - clairPart) * (pretes.salle ? 1 : 0), intP: (pretes.salle ? 1 : 0) * K.pous * lisse(2.6, 4.6, tO) * (1 - clairPart) * (reduit ? 0.75 : 1),
      lueur: cTmp, jade: cJade, couleurP: cTmp.clone().lerp(K.essaimC, 0.5), ouvre: o.decor, taille: tailleP,
    });

    // la vie du labo, seulement dans les parties sombres où le sceau est au centre
    const auCentre = (1 - carVis) * (1 - clairPart) * (1 - atelier);
    vieLabo.regler(auCentre > 0.5 && tO > 3 && pretes.salle);
    AV.seve.copy(K.seve); AV.lucioles.copy(K.essaimC); AV.luciolesInt = K.essaim;
    vieLabo.maj({ dt, ouv: lisse(2.8, 4.5, tO), p: 0, A: AV, croissPret: tO > 3 });

    // le carrousel des réalisations
    // v18 : l'anneau est attaché à la partie des réalisations : il arrive avec elle d'en bas et repart avec elle
    // vers le haut (son cadrage est celui où le haut de la partie touche le haut de l'écran)
    let monteSalle = 0;
    if (carVis > 0 && !portrait && typeof document !== 'undefined') {
      const el = document.getElementById('realisations');
      if (el) monteSalle = borne(-el.getBoundingClientRect().top / Math.max(1, hauteur), -1, 1);
    }
    carrousel.placer(camera, portrait, monteSalle);
    carrousel.maj(dt, temps, carVis * (pretes.carrousel ? 1 : 0) * telFondu, (x, c, l, d) => amortir(x, c, reduit ? l * 0.6 : l, d));

    // le monde clair : grandes feuilles de verre, ombres, ruban qui danse, objets du déroulé
    clair.maj({ s, dt, temps, clairPart: pretes.clair ? clairPart : 0, camera, teteRuban, ruban, portrait, reduit, blanc: lisse(0.3, 0.7, vague), centre: pivot.position });
    // v15 : les pictogrammes de lumière du déroulé
    pictos.maj({ s, dt, vis: pretes.clair ? clairPart : 0, camera, largeur, hauteur, portrait });

    // lueur derrière le sceau (salle)
    tmp.setFromMatrixPosition(pivot.matrixWorld).project(camera);
    fond.u.uLueur.value.set(tmp.x * 0.5 + 0.5, tmp.y * 0.5 + 0.5);
    fond.u.uLueurForce.value = 0.6 + 0.4 * K.lueur;

    // post-traitement selon le monde
    // v16 : dans le violet, un halo doux sur les crêtes de la matière et le verre ; dans le blanc, presque rien
    const violetPart = clairPart - blancPart;
    bloom.strength = (0.62 + o.eclat * (reduit ? 0.2 : 0.45) + pulse * 0.2) * (1 - clairPart) * (1 - 0.85 * carVis) + violetPart * 0.3 * (1 - lisse(0, 0.2, vague)) + blancPart * 0.06;
    // v18 : la vague garde le halo de la v16 ; pendant la marée, le blanc ne bave plus en brouillard sous la rive (v17)
    bloom.threshold = 0.85 + 0.25 * violetPart + 1.15 * blancPart + 3 * carVis + 6 * lisse(5.8, 5.9, s) * (1 - lisse(6.16, 6.3, s));
    finition.uniforms.uTemps.value = temps;
    // dans la salle des réalisations, rien ne voile le panneau actif : peu de vignettage, ni aberration ni grain
    finition.uniforms.uVignette.value = 0.32 * (1 - 0.7 * carVis);
    // ni aberration ni frange colorée sur le blanc (les croix et le dessin restent nets) ; la vague la garde (v16)
    finition.uniforms.uAberr.value = mobile ? 0.0 : 0.005 * (1 - carVis) * (1 - blancPart);
    finition.uniforms.uGrain.value = 0.03 * (1 - 0.7 * carVis);
    if (voileManuel != null) finition.uniforms.uVoile.value = voileManuel;

    // la scène sans le sceau ni le verre, pour que leurs matières la réfractent
    const verreClair = clair.groupe.visible || (ruban && ruban.verreVisible);
    if ((relais && pivot.visible) || verreClair) {
      const visS = sceau.groupe.visible, visR = rubanA.mesh.visible, visC = clair.masquerVerre();
      sceau.groupe.visible = false; rubanA.mesh.visible = false;
      const W0 = U.kzRes.value.x, H0 = U.kzRes.value.y;
      U.kzRes.value.set(cibleFond.width, cibleFond.height);
      renderer.setRenderTarget(cibleFond);
      renderer.render(scene, camera);
      renderer.setRenderTarget(null);
      U.kzRes.value.set(W0, H0);
      sceau.groupe.visible = visS; rubanA.mesh.visible = visR; clair.retablirVerre(visC);
    }
    const tR0 = performance.now(), nP0 = renderer.info.programs ? renderer.info.programs.length : 0;
    composer.render(dt);
    const tR = performance.now() - tR0;
    if (tR > 60 && (window.__kzLent ||= []).length < 40) window.__kzLent.push(Math.round(tR) + 'ms prog ' + nP0 + '>' + (renderer.info.programs ? renderer.info.programs.length : 0) + ' t' + tO.toFixed(2) + ' s' + s.toFixed(2));

    // cadence et adaptation (jamais sous la bride de capture)
    mesures.push(dt * 1000); if (mesures.length > 120) mesures.shift();
    if (!bride() && temps - derniereAdaptation > 2.5 && temps > 4 && mesures.length >= 60) {
      derniereAdaptation = temps;
      const moy = mesures.reduce((a, b) => a + b, 0) / mesures.length;
      const ecart = Math.sqrt(mesures.reduce((a, b) => a + (b - moy) * (b - moy), 0) / mesures.length);
      const ecran30 = Math.abs(moy - 33.3) < 3 && ecart < 4;
      const plancher = mobile ? Math.min(dprBase, 1.1) : 0.75;
      if (ecran30) { mesures.length = 0; } else
      if (moy > 19 && dpr > plancher) { dpr = Math.max(plancher, dpr * 0.85); dimensionner(); mesures.length = 0; }
      else if (moy > 24 && bloom.enabled) { bloom.enabled = false; mesures.length = 0; }
      else if (moy < 12.5 && dpr < dprBase) { dpr = Math.min(dprBase, dpr * 1.1); dimensionner(); mesures.length = 0; }
    }
  }

  /* ------------------------------------------------------------ compilation en deux temps
     1. ce qui sert à l'ouverture (et à l'installation dans la salle), puis `pret` ;
     2. le reste, par petits lots entre les images, pendant que l'ouverture se joue. La partie synchrone de
        compileAsync (création des programmes) est courte ; le pilote compile ensuite en parallèle
        (KHR_parallel_shader_compile). Un objet dont le lot n'est pas prêt n'est simplement pas montré. */
  /* compile() de three compile TOUT ce qu'on lui donne, visible ou non : on lui donne donc, lot par lot,
     une scène de doublures (mêmes géométries, mêmes matières, même type d'objet) */
  function doublures(racines, exclus) {
    const sc = new THREE.Scene();
    const ajouter = (o) => {
      if (exclus && exclus.has(o)) return;
      if (o.isMesh || o.isPoints || o.isLine || o.isSprite) { const d = o.clone(false); d.visible = true; d.frustumCulled = false; sc.add(d); }
      for (const c of o.children) ajouter(c);
    };
    for (const r of racines) ajouter(r);
    return sc;
  }
  const lot2 = [rubanA.mesh, pivotRuban, clair.groupe, carrousel.groupe, fond.meshClair, pictos.groupe];
  /* les matières des passes (halo, sortie, finition) : compilées pour une cible et pour l'écran */
  function scenePasses() {
    const sc = new THREE.Scene(), g = new THREE.PlaneGeometry(2, 2), vus = new Set();
    for (const pass of composer.passes) for (const v of Object.values(pass)) {
      for (const m of Array.isArray(v) ? v : [v]) if (m && m.isMaterial && !vus.has(m)) { vus.add(m); const q = new THREE.Mesh(g, m); q.frustumCulled = false; sc.add(q); }
    }
    return sc;
  }
  /* v17 : les compilations en cours ; detruire() attend qu'elles finissent avant de libérer les matières (sinon three
     interroge un programme déjà libéré : « isReady » sur undefined) */
  const compilations = new Set();
  function suivreCompil(p) { compilations.add(p); const fin = () => compilations.delete(p); p.then(fin, fin); return p; }
  function lancerCompilation(racines, exclus, extra) {
    let p;
    renderer.setRenderTarget(composer.readBuffer);
    try { p = suivreCompil(Promise.all([doublures(racines, exclus), ...(extra || [])].map((sc) => renderer.compileAsync(sc, camera, scene)))); }
    catch { p = Promise.resolve(); }
    renderer.setRenderTarget(null);
    return p.catch(() => {});
  }
  const lot1b = [fond.mesh, vrilles.mesh, vrilles.feuilles.mesh, essaim.mesh, decor.feuilles, decor.poussieres, vieLabo.groupe, contour.mesh];
  const demarrer = async () => {
    const t0Compil = performance.now();
    // 1. l'ouverture seule : petit fond, vrille, feuilles, traits, étincelle, onde, gerbe, sceau de jade, aura
    const scP = scenePasses();
    const pPasses = suivreCompil(renderer.compileAsync(scP, camera, scene)).catch(() => {});
    renderer.setRenderTarget(composer.readBuffer);
    const pPasses2 = suivreCompil(renderer.compileAsync(scP, camera, scene)).catch(() => {});
    renderer.setRenderTarget(null);
    await lancerCompilation([fondOuv, vrille, feuillesOuv.mesh, construction.mesh, etincelle.mesh, comete.mesh, onde.mesh, gerbes.mesh, sceau.groupe, aura.mesh], new Set([contour.mesh]));
    await Promise.all([pPasses, pPasses2]);
    avance(0.85);
    window.__kzCompil1 = Math.round(performance.now() - t0Compil);
    if (detruit) return;
    pretes.premier = true;
    // rien d'autre que l'ouverture n'est montré tant que son lot n'est pas compilé
    for (const o of [...lot1b, ...lot2]) o.visible = false;
    composer.render(0.016);   // chauffe les passes
    await attendreImage();
    if (detruit) return;
    ouvertureCommencee = true;
    // le visiteur est déjà plus bas dans la page (rechargement) : l'ouverture se joue vite
    if (sCible >= 0.6) accel = 4;
    sDepart = sCible;
    resoudrePret();
    // 2. le reste, lot par lot, pendant que l'ouverture se joue
    const scMat = new THREE.Scene();
    for (const pa of sceau.parties) { const mm = new THREE.Mesh(geoEpaisse(pa), matieres.get(pa)); mm.frustumCulled = false; scMat.add(mm); }
    const lots = [
      [lot1b, 'salle'],
      [[rubanA.mesh], 'matieres', [scMat]],
      [[clair.groupe, pivotRuban, fond.meshClair, pictos.groupe], 'clair'],
      [[carrousel.groupe], 'carrousel'],
    ];
    for (const [racines, nom, extra] of lots) {
      await attendreImage(); await attendreImage();
      if (detruit) return;
      const t = performance.now();
      await lancerCompilation(racines, null, extra);
      pretes[nom] = true;
      (window.__kzCompil2 ||= {})[nom] = Math.round(performance.now() - t);
    }
  };
  raf = requestAnimationFrame(image);
  demarrer();

  /* la part réelle du monde clair à l'écran (0 à 1) et le clair en un point (x, y depuis le haut gauche, 0 à 1) */
  const nbBandes = () => Math.max(4, Math.floor(U.kzRes.value.x / U.kzRes.value.y * 4.5 + 0.5));
  const aspect = () => U.kzRes.value.x / Math.max(1, U.kzRes.value.y);
  function partClaire() {
    const bal = U.kzBal.value, liq = U.kzLiq.value, w = U.kzBlanc.value;
    if (bal <= 0 || liq >= 1 || w <= 0) return 0;
    if (bal >= 1 && liq <= 0 && w >= 1) return 1;
    const N = nbBandes(), asp = aspect(); let n = 0, t = 0;
    const M = Math.max(N, 12);
    for (let b = 0; b < M; b++) for (let k = 0; k < 12; k++) { t += clairPoint((b + 0.5) / M, (k + 0.5) / 12, bal, liq, N, w, asp, temps); n++; }
    return t / n;
  }
  const clairEn = (x, y) => clairPoint(borne(Number(x) || 0), 1 - borne(Number(y) || 0), U.kzBal.value, U.kzLiq.value, nbBandes(), U.kzBlanc.value, aspect(), temps);

  const realisations = {
    definir(sites, opts) { if (opts && opts.telephoneDom != null) telDom = !!opts.telephoneDom; carrousel.definir(sites, opts); },
    aller(i) { carrousel.aller(i); },
    glisser(dx) { carrousel.glisser(Number(dx) || 0, largeur); },
    relacher() { carrousel.relacher(); },
    cadrer(c) { carrousel.cadrer({ cadre: c }); },
    surChangement(fn) { return carrousel.surChangement(fn); },
    surClicPanneau(fn) { return carrousel.surClicPanneau(fn); },
    panneauEn(x, y) { return carVisible > 0.5 ? carrousel.panneauEn(borne(Number(x) || 0), borne(Number(y) || 0)) : -1; },
    choisirEn(x, y) { return carVisible > 0.5 ? carrousel.panneauEn(borne(Number(x) || 0), borne(Number(y) || 0)) : -1; },
    get actif() { return carrousel.actif; },
    get ids() { return carrousel.ids; },
    /* v17 : true quand l'anneau 3D est effacé au profit du carrousel DOM de la page (téléphone portrait) */
    get anneauCache() { return anneauCache(); },
  };

  return {
    pret,
    ouvertureFinie,
    repli: false,
    realisations,
    progression(p, sectionId, locale) {
      const i = SECTIONS.indexOf(sectionId);
      const l = locale == null || Number.isNaN(Number(locale)) ? 0.5 : borne(Number(locale));
      sCible = i >= 0 ? i + l : borne(Number(p) || 0) * SECTIONS.length;
      if (i >= 0) sectionCourante = sectionId;
      if (!recu) { recu = true; sLisse = sCible; sPrec = sCible; }
      // le visiteur a défilé depuis le début de l'ouverture : c'est un geste
      if (sDepart != null && Math.abs(sCible - sDepart) > 0.08) { dernierGeste = performance.now(); accelerer(); }
    },
    passer,
    clairEn,
    pause() { if (enPause || detruit) return; enPause = true; cancelAnimationFrame(raf); },
    reprendre() { if (!enPause || detruit) return; enPause = false; dernier = 0; raf = requestAnimationFrame(image); },
    get enPause() { return enPause; },
    etat() {
      const q = rot.getWorldQuaternion(qTmp);
      const moy = mesures.length ? mesures.reduce((a, b) => a + b, 0) / mesures.length : 0;
      return { quaternion: [q.x, q.y, q.z, q.w], section: sectionCourante, clair: Math.round(partClaire() * 1000) / 1000, fps: moy ? Math.round(1000 / moy) : 0 };
    },
    voile(force, zone) {
      if (force == null) { voileManuel = null; finition.uniforms.uVoile.value = 0; return; }
      voileManuel = borne(force, 0, 0.8);
      if (zone) finition.uniforms.uVoileZone.value.set(zone[0], zone[1]);
    },
    stats() {
      const moy = mesures.length ? mesures.reduce((a, b) => a + b, 0) / mesures.length : 0;
      return { ips: moy ? Math.round(1000 / moy) : 0, ms: Math.round(moy * 10) / 10, dpr: Math.round(dpr * 100) / 100, ouverture: Math.round(tOuv * 100) / 100, s: Math.round(sLisse * 100) / 100, section: sectionCourante, appels: renderer.info.render.calls, triangles: renderer.info.render.triangles, police: typo.police, pretes: { ...pretes }, programmes: renderer.info.programs ? renderer.info.programs.length : 0 };
    },
    _figer(t) { figerOuverture = t; },
    _sauter() { sLisse = sCible; sPrec = sCible; camY = camYCible; },
    _debug() { return { scene, camera, renderer, U, K: C, fond, decor, clair, carrousel, pictos }; },
    detruire() {
      detruit = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('pointerdown', surToucher);
      window.removeEventListener('keydown', surToucher);
      window.removeEventListener('wheel', surToucher);
      window.removeEventListener('touchstart', surToucher);
      window.removeEventListener('pointermove', surPointeur);
      window.removeEventListener('deviceorientation', surOrientation);
      window.removeEventListener('pointerdown', surBas);
      window.removeEventListener('click', surClic);
      if (document.body.style.cursor === 'pointer') document.body.style.cursor = '';
      finir(); resoudrePret();
      Promise.allSettled([...compilations]).then(liberer);
    },
  };
  function liberer() {
      scene.traverse((ob) => {
        if (ob.geometry) ob.geometry.dispose();
        const m = ob.material; if (m) (Array.isArray(m) ? m : [m]).forEach((x) => x.dispose());
      });
      typo.texture.dispose();
      vieLabo.detruire();
      carrousel.detruire && carrousel.detruire();
      envRT.dispose();
      composer.dispose?.();
      cible.dispose();
      cibleFond.dispose();
      for (const m of matieres.values()) m.dispose();
      for (const g of Object.values(epaisses)) g.dispose();
      renderer.dispose();
  }
}
