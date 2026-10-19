/* Kazura v13, la Scène : « la liane et le sceau ».

   Le sceau de Kazura est le protagoniste de tout le site, au centre de l'écran, comme le « A » d'ALCHE.
   Ouverture (gardée de la v12, enrichie de traits de construction) : le noir, une étincelle violette ;
     la vrille jaillit et trace l'anneau pendant que cercles, axes et grille se dessinent puis
     s'effacent ; une feuille trifoliée s'ouvre et devient le sceau en jade ; éclat, onde, gerbe.
   Puis le sceau RESTE au centre et vit : il tourne lentement, respire, des vrilles poussent, des
     lucioles tournent. Derrière lui, une salle cylindrique de dalles sombres où défile un mot géant.
   Au fil de la page, il change de peau et de monde :
     ouverture    jade translucide, KAZURA
     promesse     verre irisé à dispersion, RECOMMANDÉ puis CHERCHÉ puis TROUVÉ
     experiences  verre givré, EXPÉRIENCE
     realisations carrousel de panneaux courbes ; la salle prend la couleur du site affiché
     rever        l'horizon courbe blanc balaie l'écran : monde clair, grille de croix, sceau en
                  contour fin, la liane devenue ruban holographique forme une branche du sceau
     deroule      le ruban descend et trace le chemin des six moments
     matheo       une marée liquide irisée ramène la nuit : nuit indigo peinte, étoile dorée
     questions    la salle revient, verre givré, QUESTIONS
     contact      le sceau au centre, or et jade, KAZURA

   Contrat avec la page : voir LISEZMOI.md. */

import { borne, lisse, melange, amortir, sortieCubique, sortieQuartique, entreeSortie } from './commun.js';
import { repli } from './repli.js';
import { Tubes, construireVrille, materiauLiane, RAYON_SCEAU } from './liane.js';
import { construireFeuillesOuverture } from './feuilles.js';
import { construireSceau, construireContour } from './sceau.js';
import { creerEtincelle, creerOnde, creerGerbes, creerAura, creerEnvironnement } from './atmosphere.js';
import { uniformesPartages, GLSL_MASQUE, GLSL_IRIS } from './glsl.js';
import { creerTypo } from './typo.js';
import { creerFond } from './fond.js';
import { creerConstruction, creerVrilles, creerEssaim } from './vie.js';
import { creerCarrousel } from './carrousel.js';
import { creerRuban } from './ruban.js';
import { creerEtoile } from './etoile.js';
import { creerVie } from './vie-labo.js';
import { materiauMatiere, geometriesEpaisses, creerRuban as creerRubanAnneau, INDICE } from './protagoniste.js';

export const VERSION_THREE = '0.170.0';
export const SECTIONS = ['ouverture', 'promesse', 'experiences', 'realisations', 'rever', 'deroule', 'matheo', 'questions', 'contact'];
const CDN = `https://cdn.jsdelivr.net/npm/three@${VERSION_THREE}`;
const PP = `${CDN}/examples/jsm/postprocessing`;

/* Peint tout de suite derrière le canevas : jamais d'écran noir pendant le chargement. */
const FOND_CSS = 'radial-gradient(90% 70% at 70% 20%, #1a0f33 0%, #0b0618 45%, #040309 100%)';

function webglPossible() {
  try { const c = document.createElement('canvas'); return !!c.getContext('webgl2'); } catch { return false; }
}

async function chargerThree() {
  const [THREE, ec, rp, bp, op, sp] = await Promise.all([
    import(`${CDN}/+esm`),
    import(`${PP}/EffectComposer.js/+esm`),
    import(`${PP}/RenderPass.js/+esm`),
    import(`${PP}/UnrealBloomPass.js/+esm`),
    import(`${PP}/OutputPass.js/+esm`),
    import(`${PP}/ShaderPass.js/+esm`),
  ]);
  return { THREE, EffectComposer: ec.EffectComposer, RenderPass: rp.RenderPass, UnrealBloomPass: bp.UnrealBloomPass, OutputPass: op.OutputPass, ShaderPass: sp.ShaderPass };
}

export async function lancer({ canvas, reduit = false, mobile = false, figerOuverture = null, forcerRepli = false } = {}) {
  if (!canvas) throw new Error('lancer : il faut un canevas');
  canvas.style.background = FOND_CSS;
  if (forcerRepli || !webglPossible()) return repli(canvas, { reduit, mobile });
  let M;
  try { M = await chargerThree(); } catch (e) { window.__kzMondeErreur = String(e && e.stack || e); return repli(canvas, { reduit, mobile }); }
  try { return await monter(M, { canvas, reduit: !!reduit, mobile: !!mobile, figerOuverture }); }
  catch (e) { window.__kzMondeErreur = String(e && e.stack || e); return repli(canvas, { reduit, mobile }); }
}

/* ------------------------------------------------------------ les parties, réglage par réglage
   Chaque partie est une « clé » ; entre deux clés tout glisse (milieu de partie à milieu de partie). */
const CLES = [
  /* ouverture    */ { y: 0, z: 0, ech: 1.12, verre: 0, givre: 0, or: 0, teinte: 0x6d3fd1, motF: 0.3, vrilles: 1, essaim: 1, lisere: 1, lueur: 1, balance: 1, tour: 1, seve: 0xa855f7, essaimC: 0xc084fc },
  /* promesse     */ { y: 0, z: 0, ech: 1.08, verre: 1, givre: 0, or: 0, teinte: 0x4f46e5, motF: 0.34, vrilles: 0.75, essaim: 0.8, lisere: 0.6, lueur: 0.9, balance: 1.25, tour: 1, seve: 0xa855f7, essaimC: 0xa5b4fc },
  /* experiences  */ { y: 0.05, z: -0.4, ech: 0.98, verre: 1, givre: 0.85, or: 0, teinte: 0x0f9f8f, motF: 0.3, vrilles: 0.5, essaim: 0.7, lisere: 0.4, lueur: 0.8, balance: 1, tour: 0.8, seve: 0x8b5cf6, essaimC: 0x99f6e4 },
  /* realisations */ { y: 1.9, z: -3.2, ech: 0.85, verre: 1, givre: 0.25, or: 0, teinte: 0x8b5cf6, motF: 0.22, vrilles: 0.4, essaim: 0.5, lisere: 0.3, lueur: 0.6, balance: 0.7, tour: 0.6, seve: 0xa855f7, essaimC: 0xddd6fe },
  /* rever        */ { y: 0, z: 0, ech: 1.08, verre: 0, givre: 0, or: 0, teinte: 0x8b5cf6, motF: 0, vrilles: 0, essaim: 0, lisere: 0, lueur: 0, balance: 0, tour: 0, seve: 0xa855f7, essaimC: 0xc084fc },
  /* deroule      */ { y: 0, z: 0, ech: 1.08, verre: 0, givre: 0, or: 0, teinte: 0x8b5cf6, motF: 0, vrilles: 0, essaim: 0, lisere: 0, lueur: 0, balance: 0, tour: 0, seve: 0xa855f7, essaimC: 0xc084fc },
  /* matheo       */ { y: 0.8, z: -6, ech: 0.001, verre: 1, givre: 0, or: 0.5, teinte: 0x3730a3, motF: 0, vrilles: 0, essaim: 0.6, lisere: 0, lueur: 0, balance: 0.5, tour: 0.5, seve: 0xfbbf24, essaimC: 0xfde68a },
  /* questions    */ { y: 0, z: -0.3, ech: 1.0, verre: 1, givre: 0.6, or: 0, teinte: 0x4338ca, motF: 0.26, vrilles: 0.5, essaim: 0.7, lisere: 0.4, lueur: 0.7, balance: 0.9, tour: 0.8, seve: 0xa855f7, essaimC: 0xc4b5fd },
  /* contact      */ { y: 0, z: 0, ech: 1.14, verre: 0, givre: 0, or: 1, teinte: 0xb7832f, motF: 0.3, vrilles: 1, essaim: 1, lisere: 0.55, lueur: 1, balance: 0.9, tour: 1, seve: 0xf2c87a, essaimC: 0xfde68a },
];
const NUMS = ['y', 'z', 'ech', 'verre', 'givre', 'or', 'motF', 'vrilles', 'essaim', 'lisere', 'lueur', 'balance', 'tour'];
const COULS = ['teinte', 'seve', 'essaimC'];
/* le mot projeté par partie (ligne de l'atlas, -1 = aucun) ; la promesse en enchaîne trois */
const MOT_PAR_PARTIE = [0, 1, 4, 5, -1, -1, -1, 6, 7];
/* la matière du sceau par partie (matières du labo : verre irisé, glace, jade, holo ; or ajouté pour le final) */
/* consigne de Mathéo : « mélange tout » ; chaque partie a sa combinaison, les fronts lumineux passent de l'une à l'autre */
const MATIERE_PAR_PARTIE = [
  { anneau: 'jade', folioles: 'verre', coeur: 'holo' },     // ouverture : le jade de Kazura domine
  { anneau: 'verre', folioles: 'holo', coeur: 'jade' },     // promesse : le verre irisé, les folioles holographiques
  { anneau: 'glace', folioles: 'glace', coeur: 'holo' },    // expériences : la glace
  { anneau: 'verre', folioles: 'verre', coeur: 'or' },      // réalisations : du verre derrière les panneaux
  { anneau: 'verre', folioles: 'holo', coeur: 'jade' },     // rêver (contour dans le clair)
  { anneau: 'verre', folioles: 'holo', coeur: 'jade' },     // déroulé (contour dans le clair)
  { anneau: 'holo', folioles: 'jade', coeur: 'or' },        // qui fait votre site (le sceau s'efface)
  { anneau: 'holo', folioles: 'glace', coeur: 'jade' },     // questions
  { anneau: 'or', folioles: 'jade', coeur: 'or' },          // contact : or et jade
];

/* La passe de finition : aberration douce, ombre de l'horizon, rive irisée de la marée, vignettage, grain. */
function passeFinition(THREE, U) {
  return {
    uniforms: {
      tDiffuse: { value: null }, uTemps: { value: 0 }, uGrain: { value: 0.03 }, uVignette: { value: 0.3 }, uRes: { value: new THREE.Vector2(1, 1) },
      uVoile: { value: 0 }, uVoileZone: { value: new THREE.Vector2(2, 3) }, uAberr: { value: 0.012 },
      kzRes: U.kzRes, kzBal: U.kzBal, kzLiq: U.kzLiq, kzTps: U.kzTps,
    },
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: /* glsl */ `
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
        float cl = kzClair(gl_FragCoord.xy);
        // l'horizon : une ombre douce du côté sombre, un liseré clair du côté clair
        if (kzBal > 0.0 && kzBal < 1.0) {
          float hz = kzHorizon(vUv);
          c *= 1.0 - 0.75 * exp(-max(hz, 0.0) * 22.0) * step(0.0, hz);
          c += vec3(0.9, 0.95, 1.0) * exp(-abs(hz) * 260.0) * 0.35;
        }
        // la marée : une rive irisée qui coule
        if (kzLiq > 0.0 && kzLiq < 1.0) {
          float mm = kzMaree(vUv);
          vec3 ir = kzHolo(vUv.x * 0.9 - uTemps * 0.1 + mm * 9.0);
          float rive = smoothstep(0.03, 0.0, abs(mm + 0.006));
          c = mix(c, ir * 0.95, rive * 0.92);
          c = mix(c, vec3(1.0), smoothstep(0.004, 0.0, abs(mm - 0.012)) * 0.5);
          c += ir * smoothstep(0.12, 0.0, -mm) * step(mm, 0.0) * 0.2;
        }
        vec2 qa = q; qa.x *= uRes.x / uRes.y;
        c *= 1.0 - uVignette * mix(1.0, 0.35, cl) * smoothstep(0.3, 1.0, length(qa));
        c *= 1.0 - uVoile * (1.0 - smoothstep(uVoileZone.x, uVoileZone.y, vUv.x));
        vec2 px = floor(vUv * uRes);
        float g = h(px + fract(uTemps * 7.13) * vec2(91.7, 37.3)) + h(px * 1.3 + fract(uTemps * 3.7) * vec2(13.1, 71.9)) - 1.0;
        c += g * uGrain * mix(0.6 + 0.4 * (1.0 - dot(c, vec3(0.33))), 0.45, cl);
        gl_FragColor = vec4(c, 1.0);
      }`,
  };
}

async function monter(M, { canvas, reduit, mobile, figerOuverture: figerInitial }) {
  let figerOuverture = figerInitial;
  const { THREE } = M;
  const V3 = THREE.Vector3;
  const bride = () => typeof window.__bride === 'number';

  /* ------------------------------------------------------------ rendu */
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, stencil: false, powerPreference: 'high-performance' });
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x040309, 1);
  const dprBase = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 1.75);
  let dpr = dprBase;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.03, 200);
  const envRT = creerEnvironnement(THREE, renderer);
  scene.environment = envRT.texture;

  const U = uniformesPartages(THREE);
  const typo = await creerTypo(THREE, { mobile });
  U.kzMots.value = typo.texture;
  U.kzLignes.value = typo.lignes;

  /* ------------------------------------------------------------ lumières */
  const lum = new THREE.DirectionalLight(0xb9a6ff, 1.5);
  scene.add(lum, lum.target);
  const hemi = new THREE.HemisphereLight(0x2a1d5c, 0x03140e, 0.3);
  scene.add(hemi);
  const lumCoeur = new THREE.PointLight(0xa855f7, 0, 5, 2);
  scene.add(lumCoeur);

  /* ------------------------------------------------------------ uniformes partagés de la v12 */
  const P = {
    uTemps: { value: 0 }, uVent: { value: 0.4 },
    uLumDir: { value: new V3(0.35, 0.5, -1).normalize() }, uLumCouleur: { value: new THREE.Color(1, 1, 1) },
    uSeve: { value: new THREE.Color(0xa855f7) }, uFTrans: { value: new THREE.Color(0x6fd88a) },
  };
  const partager = (mat, noms) => { for (const n of noms) mat.userData.uniforms[n] = P[n]; };

  /* ------------------------------------------------------------ le fond (salle, monde clair, nuit) */
  const fond = creerFond(THREE, U, { mobile });
  scene.add(fond.mesh);

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
    kzRes: U.kzRes, kzBal: U.kzBal, kzLiq: U.kzLiq, kzTps: U.kzTps, kzProf: U.kzProf,
  };
  const epaisses = geometriesEpaisses(THREE, { mobile });
  const matieres = new Map(), geoFine = new Map(), matFine = new Map();
  for (const p of sceau.parties) { matieres.set(p, materiauMatiere(THREE, PM)); geoFine.set(p, p.mesh.geometry); matFine.set(p, p.mesh.material); }
  const partieDe = (p) => (p === sceau.anneau ? 'anneau' : p === sceau.coeur ? 'coeur' : 'folioles');
  const geoEpaisse = (p) => (p === sceau.anneau ? epaisses.anneau : p === sceau.coeur ? epaisses.coeur : epaisses.foliole);
  const etatMat = {}; for (const k of ['anneau', 'folioles', 'coeur']) etatMat[k] = { de: 'jade', vers: 'jade', t0: -1, duree: 2.2 };
  let tempsMat = 0, planCourant = null;
  function changerMatiere(nom, duree = 2.2) {
    const plan = typeof nom === 'object' ? nom : { anneau: nom, folioles: nom, coeur: nom };
    let i = 0;
    for (const [k, v] of Object.entries(plan)) {
      const e = etatMat[k]; if (!e || e.vers === v || !(v in INDICE)) continue;
      // si le front précédent n'est pas fini, on repart de ce qu'on voit le plus
      const k0 = e.t0 < 0 ? 1 : Math.min(1, (tempsMat - e.t0) / e.duree);
      e.de = k0 > 0.5 ? e.vers : e.de; e.vers = v; e.t0 = tempsMat + i * 0.3; e.duree = duree * (reduit ? 1.5 : 1); i++;
    }
  }
  const rubanA = creerRubanAnneau(THREE, null, PM, { mobile });
  rot.add(rubanA.mesh);
  rubanA.mesh.visible = false;
  const aura = creerAura(THREE);
  aura.u.uTemps = P.uTemps;
  pivot.add(aura.mesh);
  const essaim = creerEssaim(THREE, { mobile });
  essaim.u.uTemps = P.uTemps;
  pivot.add(essaim.mesh);

  /* ------------------------------------------------------------ la vie du labo : feuilles qui tombent, volutes, essaims */
  const vieLabo = creerVie(THREE, { scene, camera, mobile, reduit, partages: P, sansVrilles: true });
  vieLabo.regler(true);
  const AV = { seve: new THREE.Color(), seveInt: 2.4, jadeLueur: 0.05, lucioles: new THREE.Color(), luciolesInt: 1 };

  /* ------------------------------------------------------------ ruban, carrousel, étoile */
  let ruban = null, rubanPortrait = null;
  const pivotRuban = new THREE.Group();
  scene.add(pivotRuban);
  function construireRuban(portraitR) {
    if (ruban && rubanPortrait === portraitR) return;
    if (ruban) { pivotRuban.remove(ruban.groupe); ruban.groupe.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); }); }
    ruban = creerRuban(THREE, { mobile, U, lumiere: lumFeuilles, portrait: portraitR });
    partager(ruban.feuilles.materiau, ['uTemps', 'uVent', 'uLumDir', 'uLumCouleur', 'uSeve', 'uFTrans']);
    ruban.u.uTemps = P.uTemps;
    pivotRuban.add(ruban.groupe);
    rubanPortrait = portraitR;
  }
  const carrousel = creerCarrousel(THREE, { mobile, renderer });
  scene.add(carrousel.groupe);
  const etoile = creerEtoile(THREE, { U });
  etoile.u.uTemps = P.uTemps;
  scene.add(etoile.mesh);

  /* ------------------------------------------------------------ post-traitement */
  const cible = new THREE.WebGLRenderTarget(2, 2, { type: THREE.HalfFloatType, samples: mobile ? 0 : 4 });
  const composer = new M.EffectComposer(renderer, cible);
  composer.addPass(new M.RenderPass(scene, camera));
  const bloom = new M.UnrealBloomPass(new THREE.Vector2(2, 2), 0.75, 0.6, 0.85);
  // téléphone : le halo lumineux se calcule au quart de la définition (il est flou de toute façon)
  if (mobile) { const o = bloom.setSize.bind(bloom); bloom.setSize = (w, h) => o(Math.max(2, w >> 2), Math.max(2, h >> 2)); }
  composer.addPass(bloom);
  composer.addPass(new M.OutputPass());
  const finition = new M.ShaderPass(passeFinition(THREE, U));
  // ShaderPass clone ses uniformes : on rebranche ceux qui sont partagés
  for (const k of ['kzRes', 'kzBal', 'kzLiq', 'kzTps']) finition.uniforms[k] = U[k];
  finition.material.uniforms = finition.uniforms;
  composer.addPass(finition);

  /* ------------------------------------------------------------ cadrage */
  let distOuverture = 7, largeur = 1, hauteur = 1, yC = -0.3, portrait = false, voileManuel = null;
  function construireCamera(aspect) {
    const fov = aspect < 1 ? melange(54, 42, lisse(0.45, 1.0, aspect)) : melange(40, 34, lisse(1.0, 1.9, aspect));
    camera.fov = fov;
    const t2 = Math.tan(fov * Math.PI / 360) * 2;
    distOuverture = (2 * RAYON_SCEAU) / ((aspect < 1 ? 0.66 : 0.46) * Math.min(1, aspect) * t2);
    portrait = aspect < 1;
    // petits téléphones (360 x 640) : le sceau un peu plus petit et plus haut, il ne touche pas le titre
    const petit = portrait && (canvas.clientHeight || window.innerHeight) < 720;
    if (petit) distOuverture *= 1.12;
    yC = portrait ? (petit ? -0.78 : -0.5) : -0.3;
    U.kzSalleC.value.set(0, 0, distOuverture * 0.85);
    U.kzSalleR.value = portrait ? 7.5 : 9.5;
    camera.updateProjectionMatrix();
    carrousel.cadrer({ portrait });
    construireRuban(portrait);
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
    vieLabo.dimensionner(largeur, hauteur, dpr);
    essaim.u.uTaille.value = taille;
    gerbes.u.uTaille.value = taille;
    construction.u.uPx.value = 1 / H;
  }
  dimensionner();
  const ro = new ResizeObserver(() => dimensionner());
  ro.observe(canvas);

  /* ------------------------------------------------------------ état */
  const echelle = reduit ? 1.35 : 1;          // l'ouverture adoucie dure 4 s sous mouvement réduit
  const FIN = 3.0, TITRE = 2.55;
  let tOuv = 0, accel = 1, ouvertureCommencee = false;
  let sCible = 0, sLisse = 0, sPrec = 0, vitesse = 0;
  let temps = 0, dernier = 0, raf = 0, detruit = false, enPause = false;
  let finir, resoudrePret;
  const ouvertureFinie = new Promise((r) => { finir = r; });
  const pret = new Promise((r) => { resoudrePret = r; });
  let titreDonne = false, gerbeLancee = false;
  const mesures = [];
  let derniereAdaptation = 0;
  let sectionCourante = 'ouverture';
  let croissV = 0, motA = 0, motB = 0, motMix = 0, motDecal = 0, spin = 0;
  let camY = 0, camYCible = 0;
  let inclX = 0, inclY = 0, inclXc = 0, inclYc = 0;   // inclinaison vers le pointeur ou l'appareil
  let pulse = 0, tourneEtoile = 0, vTourne = 0, eX = 0.5, eY = 0.5, eXc = 0.5, eYc = 0.5;
  const C = {}; for (const k of NUMS) C[k] = 0; for (const k of COULS) C[k] = new THREE.Color();
  const CLESC = CLES.map((c) => { const o = { ...c }; for (const k of COULS) o[k] = new THREE.Color(c[k]); return o; });
  const tmp = new V3(), tmp2 = new V3(), tete = new V3(), qTmp = new THREE.Quaternion(), eul = new THREE.Euler();
  const teinte = new THREE.Color(), couleurSite = new THREE.Color();
  const ecranEtoile = new THREE.Vector2(0.62, 0.55);
  let rayonEtoileEcran = 0.2;

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

  function passer() { if (tOuv < FIN) accel = 5; }

  /* ------------------------------------------------------------ gestes */
  const interactif = (t) => t && t.closest && t.closest('a,button,input,textarea,select,label,summary,[role="button"],[contenteditable],video,iframe');
  function surPointeur(e) {
    if (e.pointerType === 'touch') return;
    inclYc = ((e.clientX / Math.max(1, largeur)) - 0.5) * 2;
    inclXc = ((e.clientY / Math.max(1, hauteur)) - 0.5) * 2;
    eXc = e.clientX / Math.max(1, largeur); eYc = 1 - e.clientY / Math.max(1, hauteur);
  }
  function surOrientation(e) {
    if (e.beta == null || e.gamma == null) return;
    inclYc = borne(e.gamma / 30, -1, 1);
    inclXc = borne((e.beta - 45) / 30, -1, 1);
  }
  function surToucher(e) {
    if (tOuv < FIN && ouvertureCommencee) { passer(); return; }
    if (e.type !== 'pointerdown' || interactif(e.target)) return;
    const x = e.clientX / Math.max(1, largeur), y = 1 - e.clientY / Math.max(1, hauteur);
    // l'étoile, dans la nuit : on l'attrape
    if (etoile.mesh.visible && etoile.u.uInt.value > 0.5) {
      const dx = (x - ecranEtoile.x) * largeur / hauteur, dy = y - ecranEtoile.y;
      if (Math.hypot(dx, dy) < rayonEtoileEcran * 1.3) {
        pulse = 1; vTourne += reduit ? 1.2 : 3.2;
        gerbes.lancer(etoile.mesh.position, temps, { ech: reduit ? 0.6 : 1.4, plan: true });
        return;
      }
    }
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
  window.addEventListener('deviceorientation', surOrientation, { passive: true });

  /* ------------------------------------------------------------ une image */
  function image(now) {
    if (enPause) return;
    raf = requestAnimationFrame(image);
    if (detruit || document.hidden) { dernier = now; return; }
    const dt = Math.min(0.05, dernier ? (now - dernier) / 1000 : 0.016);
    dernier = now;
    temps += dt;
    P.uTemps.value = temps;
    U.kzTps.value = temps;

    // ouverture
    if (ouvertureCommencee && tOuv < 6) tOuv += (dt / echelle) * accel;
    const tO = figerOuverture != null ? figerOuverture : tOuv;
    const o = etatOuverture(tO);
    if (!titreDonne && tO >= TITRE) { titreDonne = true; finir(); }
    const L = o.lumiere;
    const viv = o.vivant;

    // progression lissée dans la page
    sLisse = amortir(sLisse, sCible, reduit ? 2.2 : 3.4, dt);
    if (Math.abs(sLisse - sCible) < 1e-5) sLisse = sCible;
    const s = sLisse;
    const v = Math.abs(s - sPrec) / Math.max(dt, 1e-3); sPrec = s;
    vitesse = v > vitesse ? amortir(vitesse, v, 6, dt) : amortir(vitesse, v, 1.5, dt);
    P.uVent.value = (reduit ? 0.28 : 0.42) + Math.min(1, vitesse * 0.8) * (reduit ? 0.4 : 1.1);
    const K = evaluerCles(s);

    // mondes : l'horizon, la marée, la nuit
    const bal = lisse(3.82, 4.14, s);
    const liq = lisse(5.86, 6.18, s);
    U.kzBal.value = bal;
    U.kzLiq.value = bal > 0 ? liq : 0;
    const clairPart = bal * (1 - liq);
    const nuit = lisse(5.92, 6.12, s) * (1 - lisse(6.78, 7.12, s));
    // les courts passages « profondeur » du labo : en entrant dans la promesse et dans le contact
    const fenetre = (a, b) => lisse(a, a + 0.12, s) * (1 - lisse(b - 0.14, b, s));
    U.kzProf.value = Math.max(fenetre(0.9, 1.3), fenetre(7.88, 8.3)) * (reduit ? 0.75 : 1);
    fond.u.uNuit.value = nuit;
    U.kzSalleForce.value = o.salle * (1 - nuit);
    fond.u.uHaloOuv.value = L * (1 - o.salle * 0.6);

    // teinte : celle de la partie, ou la couleur du site affiché dans le carrousel
    const carVis = lisse(2.72, 3.08, s) * (1 - lisse(3.78, 3.96, s));
    teinte.copy(K.teinte);
    if (carrousel.nombre) { carrousel.couleurActive(couleurSite); teinte.lerp(couleurSite, carVis); }
    U.kzTeinte.value.lerp(teinte, 1 - Math.exp(-dt * 3));

    // le mot projeté
    const ip = Math.min(8, Math.max(0, Math.floor(s)));
    let motVoulu = MOT_PAR_PARTIE[ip];
    if (ip === 1) motVoulu = 1 + Math.min(2, Math.floor(borne(s - 1) * 3));
    if (motVoulu >= 0 && motVoulu !== motB) {
      if (motMix > 0.5) motA = motB;
      motB = motVoulu; motMix = 0;
    }
    if (motB !== motA) { motMix = Math.min(1, motMix + dt / (reduit ? 1.3 : 0.85)); if (motMix >= 1) { motA = motB; motMix = 0; } }
    U.kzMotA.value.set(motA, typo.largeurs[motA], motB, typo.largeurs[motB]);
    U.kzMotMix.value = motMix;
    motDecal += dt * (reduit ? 0.45 : 1.15) * (1 + Math.min(4, vitesse * 3));
    U.kzMotDecal.value = motDecal;
    U.kzMotForce.value = K.motF * (motVoulu < 0 ? 0.25 : 1);

    // caméra : fixe face au sceau ; elle descend avec le ruban dans le déroulé
    const sDesc = borne((s - 5.0) / 0.9);
    let teteY = 0;
    if (ruban) {
      const fin = ruban.sAnneau * lisse(3.95, 4.5, s) + (ruban.sTotal - ruban.sAnneau) * sDesc * (s < 6.3 ? 1 : 0);
      ruban.u.uFin.value = Math.max(0.0001, fin);
      ruban.u.uDebut.value = 0;
      if (s > 5) { pivotRuban.updateMatrixWorld(true); teteY = pivotRuban.localToWorld(ruban.posDeS(fin, tete)).y; }
      ruban.feuilles.materiau.userData.uniforms.uCroiss.value = fin * (1 - lisse(5.9, 6.1, s));
      ruban.feuilles.mesh.visible = false;   // sur le clair, les feuilles éclairées lisent sombre : les repères suffisent
      ruban.majMarques(s > 4.8 && s < 6.05 ? fin : 0);
    }
    camYCible = s > 5 && s < 6.2 ? Math.min(0, teteY + (portrait ? 1.6 : 1.3)) : 0;
    camY = s >= 6.2 ? amortir(camY, 0, 1.6, dt) : amortir(camY, camYCible, reduit ? 3 : 5, dt);
    const pc = tmp.set(0, camY, distOuverture);
    const derive = (reduit ? 0.012 : 0.03) * viv;
    pc.x += Math.sin(temps * 0.21) * derive; pc.y += Math.sin(temps * 0.17 + 1) * derive;
    const recul = (1 - o.retrait) * distOuverture * (reduit ? 0.08 : 0.24);
    pc.z -= recul;
    camera.position.copy(pc);
    camera.lookAt(0, camY + yC, 0);
    camera.updateMatrixWorld();
    fond.maj(camera);

    // le héros : place, échelle, respiration, orientation
    const ech = melange(1, K.ech, viv);
    pivot.position.set(0, K.y * viv, K.z * viv);
    pivot.scale.setScalar(Math.max(0.0005, ech));
    pivot.visible = ech > 0.01;
    const respire = 1 + 0.016 * Math.sin(temps * 0.9) * viv * (reduit ? 0.6 : 1);
    rot.scale.setScalar(respire);
    const ampl = (reduit ? 0.5 : 1) * K.balance * viv;
    const vv = reduit ? 0.6 : 1;
    inclX = amortir(inclX, inclXc, 2, dt); inclY = amortir(inclY, inclYc, 2, dt);
    const enDescente = lisse(4.7, 5.15, s);
    const fixeX = -0.16 * clairPart * (1 - enDescente), fixeY = 0.32 * clairPart * (1 - 0.6 * enDescente);   // dans le monde clair : une perspective fixe, comme un dessin
    const swY = Math.sin(temps * 0.23 * vv) * 0.42 * ampl + inclY * 0.16 * ampl + fixeY;
    const swX = Math.sin(temps * 0.17 * vv + 1.0) * 0.16 * ampl + inclX * 0.1 * ampl + fixeX;
    spin += dt * 0.07 * vv * K.tour * viv;
    // en entrant dans le clair, le tour revient doucement à l'orientation du dessin
    const tiers = Math.PI * 2 / 3;
    const spinVu = spin * (1 - clairPart) + Math.round(spin / tiers) * tiers * clairPart;
    rot.rotation.set(swX, swY, spinVu, 'XYZ');
    pulse = Math.max(0, pulse - dt * 1.4);
    // le sceau prend de l'épaisseur une fois né (de face, l'ouverture ne change pas)
    sceau.groupe.scale.setScalar(1 + pulse * 0.04);
    pivot.updateMatrixWorld(true);
    // le ruban suit la place et l'inclinaison, jamais le tour ni la respiration
    pivotRuban.position.copy(pivot.position);
    pivotRuban.scale.copy(pivot.scale);
    pivotRuban.rotation.set(swX, swY, 0, 'XYZ');
    pivotRuban.visible = bal > 0.001 && liq < 0.999;

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

    // les matières du labo prennent le relais sous l'éclat de l'ouverture (le sceau devient épais)
    tempsMat += dt;
    const relais = tO >= 2.33;
    const ipCible = Math.min(8, Math.max(0, Math.floor(sCible)));
    if (relais && planCourant !== ipCible) { planCourant = ipCible; changerMatiere(MATIERE_PAR_PARTIE[ipCible]); }
    for (const pa of sceau.parties) {
      const m = matieres.get(pa);
      pa.mesh.material = relais ? m : matFine.get(pa);
      pa.mesh.geometry = relais ? geoEpaisse(pa) : geoFine.get(pa);
      if (!relais) continue;
      const e = etatMat[partieDe(pa)];
      const k = e.t0 < 0 ? 1 : Math.min(1, Math.max(0, (tempsMat - e.t0) / e.duree));
      const ke = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      m.uniforms.uA.value = INDICE[k >= 1 ? e.vers : e.de]; m.uniforms.uB.value = INDICE[e.vers];
      m.uniforms.uFront.value = k >= 1 ? 1 : ke;
      m.uniforms.uNb.value = m.uniforms.uA.value === m.uniforms.uB.value ? 1 : 2;
      m.uniforms.uLisere.value = 0.45 * melange(1, 0.5 + 0.5 * K.lisere, viv);
      m.uniforms.uEclat.value = o.eclat * (reduit ? 0.3 : 0.6) + pulse * 0.25;
    }
    PM.uVueInv.value.copy(camera.matrixWorld);
    // le ruban holographique s'enroule autour de l'anneau après l'ouverture (monde sombre seulement)
    const rubVis = (tO > 2.6 ? 1 : 0) * (1 - carVis) * (1 - nuit) * (1 - clairPart);
    const ru = rubanA.mat.uniforms;
    const cibleR = rubVis > 0.5 ? rubanA.longAnneau : 0;
    ru.uLong.value = cibleR > ru.uLong.value ? Math.min(cibleR, ru.uLong.value + dt * (reduit ? 1.6 : 2.6)) : Math.max(cibleR, ru.uLong.value - dt * 4);
    rubanA.mesh.visible = ru.uLong.value > 0.01;

    // le contour du monde clair se trace pendant que l'horizon passe
    contour.u.uTrace.value = lisse(3.86, 4.3, s) * 1.02;
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
    if (!gerbeLancee && tO >= 2.27 && tO < 2.8 && !reduit) { gerbeLancee = true; gerbes.lancer(tmp.set(0, 0, 0.05), temps, { ech: 2.3, plan: true }); }
    gerbes.u.uCouleur.value.copy(K.essaimC).lerp(K.seve, 0.4);

    // vrilles : poussent après l'ouverture, se retirent avant le monde clair, repoussent ensuite
    const cibleV = tO < 2.6 ? o.liane : Math.max(o.liane * K.vrilles, vrilles.longueur * K.vrilles);
    croissV = cibleV > croissV ? Math.min(cibleV, croissV + dt * (reduit ? 0.55 : 0.9)) : Math.max(cibleV, croissV - dt * 2.2);
    vrilles.materiau.userData.uniforms.uCroiss.value = croissV;
    vrilles.materiau.userData.uniforms.uSeveInt.value = 2.4;
    vrilles.feuilles.materiau.userData.uniforms.uCroiss.value = croissV;
    vrilles.mesh.visible = croissV > 0.01;
    vrilles.feuilles.mesh.visible = croissV > 0.15;

    // essaim
    essaim.u.uCouleur.value.copy(K.essaimC);
    essaim.u.uInt.value = K.essaim * lisse(2.2, 3.6, tO) * (1 - clairPart) * (reduit ? 0.8 : 1);
    essaim.u.uVitesse.value = reduit ? 0.5 : 1;
    essaim.mesh.visible = essaim.u.uInt.value > 0.002;

    // la vie du labo, seulement dans les parties sombres où le sceau est au centre
    const auCentre = (1 - carVis) * (1 - clairPart) * (1 - nuit);
    vieLabo.regler(auCentre > 0.5 && tO > 3);
    AV.seve.copy(K.seve); AV.lucioles.copy(K.essaimC); AV.luciolesInt = K.essaim;
    vieLabo.maj({ dt, ouv: lisse(2.8, 4.5, tO), p: 0, A: AV, croissPret: tO > 3 });

    // carrousel : devant la caméra, centre de rotation près d'elle
    carrousel.placer(distOuverture, camY + (portrait ? 0.5 : yC * 0.55 + 0.08));
    carrousel.maj(dt, temps, carVis, (x, c, l, d) => amortir(x, c, reduit ? l * 0.6 : l, d));

    // l'étoile peinte : dans la nuit, posée devant la caméra
    const etVis = lisse(6.02, 6.3, s) * (1 - lisse(6.75, 7.05, s));
    etoile.mesh.visible = etVis > 0.002;
    if (etoile.mesh.visible) {
      const dEt = 3.2;
      const hv = 2 * dEt * Math.tan(camera.fov * Math.PI / 360), wv = hv * camera.aspect;
      const taille = Math.min(hv * 0.8, wv * 1.25);
      eX = amortir(eX, eXc, 2, dt); eY = amortir(eY, eYc, 2, dt);
      const bx = portrait ? 0 : 0.2 * wv, by = portrait ? 0.17 * hv : 0.04 * hv;
      const attire = reduit ? 0.02 : 0.05;
      tmp.set(bx + (eX - 0.5 - bx / wv) * wv * attire, by + (eY - 0.5 - by / hv) * hv * attire + Math.sin(temps * 0.7) * 0.03, -dEt);
      tmp.applyQuaternion(camera.quaternion).add(camera.position);
      etoile.mesh.position.copy(tmp);
      etoile.mesh.quaternion.copy(camera.quaternion);
      eul.set((eY - 0.5 - by / hv) * -0.5, (eX - 0.5 - bx / wv) * 0.5, 0);
      qTmp.setFromEuler(eul); etoile.mesh.quaternion.multiply(qTmp);
      etoile.mesh.scale.setScalar(taille * (0.9 + 0.1 * etVis));
      vTourne = amortir(vTourne, 0, 1.2, dt);
      tourneEtoile += dt * (0.05 + vTourne) * (reduit ? 0.5 : 1);
      etoile.u.uTourne.value = tourneEtoile;
      etoile.u.uPulse.value = pulse;
      etoile.u.uInt.value = etVis;
      ecranEtoile.set(0.5 + bx / wv, 0.5 + by / hv);
      rayonEtoileEcran = taille * 0.25 / hv;
      fond.u.uEtoile.value.set(ecranEtoile.x, ecranEtoile.y, rayonEtoileEcran * 1.4);
    }

    // lueur derrière le sceau (salle)
    tmp.setFromMatrixPosition(pivot.matrixWorld).project(camera);
    fond.u.uLueur.value.set(tmp.x * 0.5 + 0.5, tmp.y * 0.5 + 0.5);
    fond.u.uLueurForce.value = 0.6 + 0.4 * K.lueur;

    // post-traitement selon le monde
    bloom.strength = (0.62 + o.eclat * (reduit ? 0.2 : 0.45) + pulse * 0.2) * (1 - clairPart) * (1 - 0.85 * carVis) * (1 - 0.6 * etVis);
    bloom.threshold = 0.85 + 2 * clairPart + 3 * carVis;
    finition.uniforms.uTemps.value = temps;
    finition.uniforms.uVignette.value = 0.32;
    finition.uniforms.uAberr.value = mobile ? 0.0 : 0.005;
    if (voileManuel != null) finition.uniforms.uVoile.value = voileManuel;

    // la scène sans le sceau, pour que ses matières la réfractent
    if (relais && pivot.visible && clairPart < 0.999) {
      const visS = sceau.groupe.visible, visR = rubanA.mesh.visible;
      sceau.groupe.visible = false; rubanA.mesh.visible = false;
      const W0 = U.kzRes.value.x, H0 = U.kzRes.value.y;
      U.kzRes.value.set(cibleFond.width, cibleFond.height);
      renderer.setRenderTarget(cibleFond);
      renderer.render(scene, camera);
      renderer.setRenderTarget(null);
      U.kzRes.value.set(W0, H0);
      sceau.groupe.visible = visS; rubanA.mesh.visible = visR;
    }
    const tR0 = performance.now(), nP0 = renderer.info.programs ? renderer.info.programs.length : 0;
    composer.render(dt);
    const tR = performance.now() - tR0;
    if (tR > 60 && (window.__kzLent ||= []).length < 40) window.__kzLent.push(Math.round(tR) + 'ms prog ' + nP0 + '>' + (renderer.info.programs ? renderer.info.programs.length : 0) + ' t' + tO.toFixed(2));

    // cadence et adaptation (jamais sous la bride de capture)
    mesures.push(dt * 1000); if (mesures.length > 120) mesures.shift();
    if (!bride() && temps - derniereAdaptation > 2.5 && temps > 4 && mesures.length >= 60) {
      derniereAdaptation = temps;
      const moy = mesures.reduce((a, b) => a + b, 0) / mesures.length;
      const ecart = Math.sqrt(mesures.reduce((a, b) => a + (b - moy) * (b - moy), 0) / mesures.length);
      // un écran bridé à 30 Hz (économie d'énergie, très courant sur Xiaomi) donne 33 ms très réguliers :
      // ce n'est pas de la lenteur, on ne dégrade pas (correctif du labo)
      const ecran30 = Math.abs(moy - 33.3) < 3 && ecart < 4;
      const plancher = mobile ? Math.min(dprBase, 1.1) : 0.75;
      if (ecran30) { mesures.length = 0; } else
      if (moy > 19 && dpr > plancher) { dpr = Math.max(plancher, dpr * 0.85); dimensionner(); mesures.length = 0; }
      else if (moy > 24 && bloom.enabled) { bloom.enabled = false; mesures.length = 0; }   // dernier recours : plus de halo
      else if (moy < 12.5 && dpr < dprBase) { dpr = Math.min(dprBase, dpr * 1.1); dimensionner(); mesures.length = 0; }
    }
  }

  /* ------------------------------------------------------------ démarrage */
  const demarrer = async () => {
    const t0Compil = performance.now();
    // les matières du labo ne sont posées qu'au relais : on les compile d'avance, en parallèle
    const scMat = new THREE.Scene();
    for (const pa of sceau.parties) { const mm = new THREE.Mesh(geoEpaisse(pa), matieres.get(pa)); mm.frustumCulled = false; scMat.add(mm); }
    // three ne compile que ce qui est visible : on montre tout le temps de la compilation
    const caches = [];
    scene.traverse((o) => { if (!o.visible) { caches.push(o); o.visible = true; } });
    // compiler POUR la cible du rendu (sans rendu filmique : c'est la passe de sortie qui l'applique),
    // sinon three recompile chaque matière au premier rendu, en pleine ouverture
    renderer.setRenderTarget(composer.readBuffer);
    try { await Promise.all([renderer.compileAsync(scene, camera, scene), renderer.compileAsync(scMat, camera, scene)]); } catch {}
    renderer.setRenderTarget(null);
    for (const o of caches) o.visible = false;
    window.__kzCompil = Math.round(performance.now() - t0Compil);
    if (detruit) return;
    composer.render(0.016); // chauffe les passes
    requestAnimationFrame(() => {
      if (detruit) return;
      ouvertureCommencee = true;
      resoudrePret();
    });
  };
  raf = requestAnimationFrame(image);
  demarrer();

  const realisations = {
    definir(sites) { carrousel.definir(sites); },
    aller(i) { carrousel.aller(i); },
    glisser(dx) { carrousel.glisser(Number(dx) || 0, largeur); },
    surChangement(fn) { return carrousel.surChangement(fn); },
    get actif() { return carrousel.actif; },
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
      if (sCible > 0.04 && tOuv < FIN) passer();
    },
    passer,
    /* la page met la scène en pause quand une autre 3D tourne (le domaine) : plus aucun rendu, plus de GPU */
    pause() { if (enPause || detruit) return; enPause = true; cancelAnimationFrame(raf); },
    reprendre() { if (!enPause || detruit) return; enPause = false; dernier = 0; raf = requestAnimationFrame(image); },
    get enPause() { return enPause; },
    etat() {
      const q = rot.getWorldQuaternion(qTmp);
      const moy = mesures.length ? mesures.reduce((a, b) => a + b, 0) / mesures.length : 0;
      return { quaternion: [q.x, q.y, q.z, q.w], section: sectionCourante, clair: U.kzBal.value * (1 - U.kzLiq.value) > 0.5, fps: moy ? Math.round(1000 / moy) : 0 };
    },
    /* assombrit la scène derrière le texte (0 à 0,8) ; zone = [début, fin] du fondu horizontal ([2, 3] : toute la largeur) */
    voile(force, zone) {
      if (force == null) { voileManuel = null; finition.uniforms.uVoile.value = 0; return; }
      voileManuel = borne(force, 0, 0.8);
      if (zone) finition.uniforms.uVoileZone.value.set(zone[0], zone[1]);
    },
    stats() {
      const moy = mesures.length ? mesures.reduce((a, b) => a + b, 0) / mesures.length : 0;
      return { ips: moy ? Math.round(1000 / moy) : 0, ms: Math.round(moy * 10) / 10, dpr: Math.round(dpr * 100) / 100, ouverture: Math.round(tOuv * 100) / 100, s: Math.round(sLisse * 100) / 100, section: sectionCourante, appels: renderer.info.render.calls, triangles: renderer.info.render.triangles, police: typo.police };
    },
    /* test seulement */
    _figer(t) { figerOuverture = t; },
    _sauter() { sLisse = sCible; sPrec = sCible; camY = camYCible; motMix = 1; },
    _debug() { return { scene, camera, renderer, U, K: C }; },
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
      scene.traverse((ob) => {
        if (ob.geometry) ob.geometry.dispose();
        const m = ob.material; if (m) (Array.isArray(m) ? m : [m]).forEach((x) => x.dispose());
      });
      typo.texture.dispose();
      vieLabo.detruire();
      envRT.dispose();
      composer.dispose?.();
      cible.dispose();
      cibleFond.dispose();
      for (const m of matieres.values()) m.dispose();
      for (const g of Object.values(epaisses)) g.dispose();
      renderer.dispose();
      finir(); resoudrePret();
    },
  };
}
