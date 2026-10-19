/* Kazura v12, le Monde : la scène 3D de fond et l'ouverture.

   « La liane de lumière ». Un monde de nuit, profond et velouté ; une liane de kudzu (葛, Kazura) en
   jade vivant y pousse, une sève de lumière violette circule dans sa tige par pulsations.

   Ouverture (3 s, passable d'un toucher, d'une touche ou d'un défilement) :
     le noir, une étincelle violette ; la liane jaillit et s'enroule en anneau ; au cœur, une feuille
     trifoliée s'ouvre, puis ses trois folioles se replient et deviennent le sceau de Kazura (dessin
     exact de sceau-jade.svg, en jade poli à liseré violet) ; le sceau rayonne, puis se met en retrait.
   Défilement : la caméra traverse l'anneau puis accompagne la liane, qui pousse, bifurque et fleurit.
     L'ambiance glisse de la nuit violette à l'aube dorée, au jade du matin, puis au crépuscule.

   Contrat (BRIEF.md) :
     const monde = await lancer({ canvas, reduit, mobile })
     monde.progression(p, sectionId)   p de 0 à 1 sur toute la page
     monde.pret                        promesse : la première image est à l'écran
     monde.ouvertureFinie              promesse : la page peut poser son titre
     monde.detruire()
   Le Monde n'écrit aucun texte. Aucun effet ne suit la souris ; seul le toucher d'une feuille la
   fait frémir et libère une petite pulsation de lumière. */

import { borne, lisse, melange, amortir, sortieCubique, sortieQuartique, entreeSortie } from './commun.js';
import { repli } from './repli.js';
import { SECTIONS, creerAmbiances } from './ambiances.js';
import { construireTraces, construireLiane, construireVrille, construireLointaines, materiauLiane, RAYON_SCEAU } from './liane.js';
import { construireFeuilles, construireFeuillesOuverture, construireFleurs } from './feuilles.js';
import { construireSceau } from './sceau.js';
import { creerCiel, creerLucioles, creerEtincelle, creerOnde, creerGerbes, creerBokeh, creerAura, creerEnvironnement, materiauSilhouette } from './atmosphere.js';

export const VERSION_THREE = '0.170.0';
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
  if (forcerRepli || !webglPossible()) return repli(canvas);
  let M;
  try { M = await chargerThree(); } catch (e) { window.__kzMondeErreur = String(e && e.stack || e); return repli(canvas); }
  try { return monter(M, { canvas, reduit: !!reduit, mobile: !!mobile, figerOuverture }); }
  catch (e) { window.__kzMondeErreur = String(e && e.stack || e); return repli(canvas); }
}

/* La passe de finition : vignettage doux et grain très fin (après le rendu filmique). */
const FINITION = {
  uniforms: { tDiffuse: { value: null }, uTemps: { value: 0 }, uGrain: { value: 0.03 }, uVignette: { value: 0.3 }, uRes: { value: null }, uVoile: { value: 0 }, uVoileZone: { value: null } },
  vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse; uniform float uTemps; uniform float uGrain; uniform float uVignette; uniform vec2 uRes;
    uniform float uVoile; uniform vec2 uVoileZone;
    varying vec2 vUv;
    float h(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main() {
      vec4 c = texture2D(tDiffuse, vUv);
      vec2 q = vUv - 0.5; q.x *= uRes.x / uRes.y;
      c.rgb *= 1.0 - uVignette * smoothstep(0.3, 1.0, length(q));
      c.rgb *= 1.0 - uVoile * (1.0 - smoothstep(uVoileZone.x, uVoileZone.y, vUv.x));
      vec2 px = floor(vUv * uRes);
      float g = h(px + fract(uTemps * 7.13) * vec2(91.7, 37.3)) + h(px * 1.3 + fract(uTemps * 3.7) * vec2(13.1, 71.9)) - 1.0;
      c.rgb += g * uGrain * (0.6 + 0.4 * (1.0 - dot(c.rgb, vec3(0.33))));
      gl_FragColor = vec4(c.rgb, 1.0);
    }`,
};

function monter(M, { canvas, reduit, mobile, figerOuverture: figerInitial }) {
  let figerOuverture = figerInitial;
  const { THREE } = M;
  const V3 = THREE.Vector3;
  const bride = typeof window.__bride === 'number';

  /* ------------------------------------------------------------ rendu */
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, stencil: false, powerPreference: 'high-performance' });
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x040309, 1);
  const dprBase = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 1.75);
  let dpr = dprBase;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0c071b, 0.05);
  const camera = new THREE.PerspectiveCamera(38, 1, 0.03, 420);
  const envRT = creerEnvironnement(THREE, renderer);
  scene.environment = envRT.texture;

  /* ------------------------------------------------------------ lumières */
  const lum = new THREE.DirectionalLight(0xffffff, 1.5);
  scene.add(lum, lum.target);
  const hemi = new THREE.HemisphereLight(0x2a1d5c, 0x03140e, 0.35);
  scene.add(hemi);
  const lumSeve = new THREE.PointLight(0xa855f7, 0, 4.5, 2);   // suit la tête de la liane
  const lumCoeur = new THREE.PointLight(0xa855f7, 0, 5, 2);    // éclaire le sceau pendant l'ouverture
  lumCoeur.position.set(0, 0.1, 0.9);
  scene.add(lumSeve, lumCoeur);

  /* ------------------------------------------------------------ uniformes partagés */
  const P = {
    uTemps: { value: 0 }, uVent: { value: 0.4 },
    uLumDir: { value: new V3(0, 0, 1) }, uLumCouleur: { value: new THREE.Color(1, 1, 1) },
    uSeve: { value: new THREE.Color(0xa855f7) }, uFTrans: { value: new THREE.Color(0x5fd89a) },
  };
  const partager = (mat, noms) => { for (const n of noms) mat.userData.uniforms[n] = P[n]; };

  /* ------------------------------------------------------------ la liane */
  const traces = construireTraces(THREE, { mobile });
  const lianeData = construireLiane(THREE, traces, { mobile });
  const matLiane = materiauLiane(THREE, { mobile });
  partager(matLiane, ['uTemps', 'uVent', 'uSeve', 'uLumDir', 'uLumCouleur']);
  const liane = new THREE.Mesh(lianeData.geometrie, matLiane);
  liane.frustumCulled = false;
  scene.add(liane);

  const vrilleData = construireVrille(THREE, { mobile });
  const matVrille = materiauLiane(THREE, { mobile });
  partager(matVrille, ['uTemps', 'uVent', 'uSeve', 'uLumDir', 'uLumCouleur']);
  matVrille.userData.uniforms.uTeteInt.value = 5;
  const vrille = new THREE.Mesh(vrilleData.geometrie, matVrille);
  vrille.frustumCulled = false;
  scene.add(vrille);

  const silh = materiauSilhouette(THREE);
  silh.u.uTemps = P.uTemps; silh.u.uVent = P.uVent;
  const lointaines = new THREE.Mesh(construireLointaines(THREE, traces, { mobile }), silh.materiau);
  lointaines.frustumCulled = false;
  scene.add(lointaines);

  const lumDirFeuilles = new V3(0.35, 0.5, -1).normalize();
  const feuilles = construireFeuilles(THREE, lianeData.feuilles, { mobile, lumiere: lumDirFeuilles });
  partager(feuilles.materiau, ['uTemps', 'uVent', 'uLumDir', 'uLumCouleur', 'uSeve', 'uFTrans']);
  if (mobile) feuilles.materiau.userData.uniforms.uTransForce.value = 0.5;
  scene.add(feuilles.mesh);

  const feuillesOuv = construireFeuillesOuverture(THREE, { mobile });
  partager(feuillesOuv.materiau, ['uTemps', 'uLumDir', 'uLumCouleur', 'uSeve', 'uFTrans']);
  feuillesOuv.materiau.userData.uniforms.uVent = { value: 0.15 };
  scene.add(feuillesOuv.mesh);

  const fleurs = construireFleurs(THREE, lianeData.hampes, { mobile });
  partager(fleurs.materiau, ['uTemps', 'uVent', 'uSeve']);
  scene.add(fleurs.mesh);

  /* ------------------------------------------------------------ le sceau */
  const sceau = construireSceau(THREE, { mobile });
  scene.add(sceau.groupe);
  for (const p of sceau.parties) for (const m of [p.face, p.bord]) { m.userData.uniforms.uTemps = P.uTemps; m.userData.uniforms.uSeve = P.uSeve; m.userData.uniforms.uLumDir = P.uLumDir; m.userData.uniforms.uLumCouleur = P.uLumCouleur; }

  /* ------------------------------------------------------------ atmosphère */
  const ciel = creerCiel(THREE);
  ciel.u.uTemps = P.uTemps;
  scene.add(ciel.mesh);
  // les silhouettes lisent le même ciel
  for (const k of ['uZen', 'uHor', 'uHalo', 'uHaloForce', 'uLumiere']) silh.u[k] = ciel.u[k];
  silh.u.uLumMonde = ciel.u.uLumDir;
  const lucioles = creerLucioles(THREE, traces, { mobile });
  lucioles.u.uTemps = P.uTemps; lucioles.u.uVent = P.uVent;
  scene.add(lucioles.mesh);
  const etincelle = creerEtincelle(THREE);
  const comete = creerEtincelle(THREE);
  etincelle.u.uTemps = P.uTemps; comete.u.uTemps = P.uTemps;
  scene.add(etincelle.mesh, comete.mesh);
  const aura = creerAura(THREE);
  aura.u.uTemps = P.uTemps;
  scene.add(aura.mesh);
  const onde = creerOnde(THREE);
  scene.add(onde.mesh);
  const bokeh = creerBokeh(THREE, traces, { mobile });
  bokeh.u.uTemps = P.uTemps;
  scene.add(bokeh.mesh);
  const gerbes = creerGerbes(THREE, { mobile });
  gerbes.u.uTemps = P.uTemps;
  scene.add(gerbes.mesh);

  /* ------------------------------------------------------------ post-traitement */
  const cible = new THREE.WebGLRenderTarget(2, 2, { type: THREE.HalfFloatType, samples: mobile ? 0 : 4 });
  const composer = new M.EffectComposer(renderer, cible);
  composer.addPass(new M.RenderPass(scene, camera));
  const bloom = new M.UnrealBloomPass(new THREE.Vector2(2, 2), 0.75, 0.6, 0.85);
  if (mobile) { const o = bloom.setSize.bind(bloom); bloom.setSize = (w, h) => o(Math.max(2, w >> 1), Math.max(2, h >> 1)); }
  composer.addPass(bloom);
  composer.addPass(new M.OutputPass());
  FINITION.uniforms.uRes.value = new THREE.Vector2(1, 1);
  FINITION.uniforms.uVoileZone.value = new THREE.Vector2(0.38, 0.62);
  const finition = new M.ShaderPass(FINITION);
  composer.addPass(finition);

  /* ------------------------------------------------------------ ambiances */
  const ambiances = creerAmbiances(THREE);
  let curseur = 0, curseurCible = 0;

  /* ------------------------------------------------------------ caméra : un seul chemin, sans à-coups */
  let cheminCam = null, cheminVue = null, distOuverture = 7, largeur = 1, hauteur = 1, voileManuel = null, voileDefaut = 0.18;
  const uMax = traces.L - 14;
  const uDe = (p) => Math.max(0, (p - 0.1) / 0.9) * uMax;
  function construireCamera(aspect) {
    const fov = aspect < 1 ? melange(54, 42, lisse(0.45, 1.0, aspect)) : melange(40, 34, lisse(1.0, 1.9, aspect));
    camera.fov = fov;
    const t2 = Math.tan(fov * Math.PI / 360) * 2;
    distOuverture = (2 * RAYON_SCEAU) / ((aspect < 1 ? 0.66 : 0.46) * Math.min(1, aspect) * t2);
    const portrait = aspect < 1;
    const dl = portrait ? 0.92 : melange(1.15, 1.6, lisse(1.0, 1.8, aspect));
    const du = portrait ? 0.5 : 0.34;
    const vueCote = portrait ? 0.62 : 0.3, vueHaut = portrait ? 0.62 : 0.12;
    const yC = aspect < 1 ? -0.5 : -0.3;
    const D = distOuverture;
    const pc = [], pv = [];
    const N = 40;
    for (let i = 0; i <= N; i++) {
      const p = i / N;
      if (i === 0) { pc.push(new V3(0, 0, D)); pv.push(new V3(0, yC, 0)); continue; }
      if (i === 1) { pc.push(new V3(0, -0.04, D * 0.74)); pv.push(new V3(0, yC, -1.2)); continue; }
      if (i === 2) { pc.push(new V3(-0.03, -0.1, D * 0.46)); pv.push(new V3(0.05, -0.3, -3)); continue; }
      if (i === 3) { pc.push(new V3(-0.08, -0.2, D * 0.17)); pv.push(new V3(0.15, -0.55, -5)); continue; }
      if (i === 4) { pc.push(new V3(-0.3, -0.4, -0.8)); pv.push(new V3(0.4, -0.8, -7)); continue; }
      const u = uDe(p);
      const c = traces.cadre(u), v = traces.cadre(u + 5.5);
      pc.push(c.p.clone().addScaledVector(c.cote, -dl).addScaledVector(c.haut, du));
      pv.push(v.p.clone().addScaledVector(v.cote, -dl * vueCote).addScaledVector(v.haut, vueHaut));
    }
    cheminCam = new THREE.CatmullRomCurve3(pc, false, 'catmullrom', 0.5);
    cheminVue = new THREE.CatmullRomCurve3(pv, false, 'catmullrom', 0.5);
    camera.updateProjectionMatrix();
  }

  function dimensionner() {
    largeur = Math.max(1, canvas.clientWidth || window.innerWidth);
    hauteur = Math.max(1, canvas.clientHeight || window.innerHeight);
    renderer.setPixelRatio(dpr);
    renderer.setSize(largeur, hauteur, false);
    composer.setPixelRatio(dpr);
    composer.setSize(largeur, hauteur);
    finition.uniforms.uRes.value.set(largeur * dpr, hauteur * dpr);
    camera.aspect = largeur / hauteur;
    construireCamera(camera.aspect);
    // voile par défaut : léger sur la colonne de gauche (ordinateur), sur toute la largeur en portrait
    if (voileManuel == null) {
      const portrait = camera.aspect < 1;
      voileDefaut = portrait ? 0.32 : 0.18;
      finition.uniforms.uVoile.value = voileDefaut;
      finition.uniforms.uVoileZone.value.set(portrait ? 2.0 : 0.3, portrait ? 3.0 : 0.6);
    }
    const taille = dpr * (largeur < 700 ? 1.15 : 1) * Math.min(1.4, hauteur / 800);
    lucioles.u.uTaille.value = taille;
    gerbes.u.uTaille.value = taille;
    bokeh.u.uTaille.value = dpr * Math.min(1.5, hauteur / 800);
  }
  dimensionner();
  const ro = new ResizeObserver(() => dimensionner());
  ro.observe(canvas);

  /* ------------------------------------------------------------ état */
  const echelle = reduit ? 1.35 : 1;          // l'ouverture adoucie dure 4 s sous mouvement réduit
  const FIN = 3.0, TITRE = 2.55;
  let tOuv = 0, accel = 1, ouvertureCommencee = false;
  let pCible = 0, pLisse = 0, pPrec = 0, vitesse = 0, vent = 0.4;
  let croiss = 0;
  let temps = 0, dernier = 0, raf = 0, detruit = false;
  let finir, resoudrePret;
  const ouvertureFinie = new Promise((r) => { finir = r; });
  const pret = new Promise((r) => { resoudrePret = r; });
  let titreDonne = false, gerbeLancee = false;
  const mesures = [];
  let derniereAdaptation = 0;

  const tete = new V3(), tmp = new V3(), tmp2 = new V3(), vue = new V3(), lumMonde = new V3();

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
      liane: lisse(1.75, 3.0, t) * 8,
      lucioles: lisse(2.2, 3.4, t),
      lumiere: lisse(0.2, 2.6, t),
    };
  }

  function passer() { if (tOuv < FIN) accel = 5; }
  const surGeste = (e) => {
    if (tOuv < FIN && ouvertureCommencee) { passer(); return; }
    if (e.type === 'pointerdown') toucher(e);
  };

  /* ------------------------------------------------------------ toucher une feuille */
  const rayon = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  function toucher(ev) {
    const t = ev.target;
    if (t && t.closest && t.closest('a,button,input,textarea,select,label,summary,[role="button"],[contenteditable],video,iframe')) return;
    const r = canvas.getBoundingClientRect();
    ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    rayon.setFromCamera(ndc, camera);
    const o = rayon.ray.origin, d = rayon.ray.direction;
    let meilleur = null, bd = Infinity;
    for (const f of feuilles.pick) {
      if (croiss < f.naiss + 0.9) continue;
      tmp.subVectors(f.centre, o);
      const s = tmp.dot(d);
      if (s < 0.15 || s > 30) continue;
      const perp = tmp.lengthSq() - s * s;
      if (perp < f.rayon * f.rayon && s < bd) { bd = s; meilleur = f; }
    }
    if (!meilleur) return;
    const a = feuilles.attrB;
    for (let k = 0; k < 3; k++) a.array[(meilleur.i + k) * 4] = temps;
    a.needsUpdate = true;
    gerbes.lancer(meilleur.centre, temps, { ech: reduit ? 0.35 : 0.6 });
  }
  window.addEventListener('pointerdown', surGeste, { passive: true });
  window.addEventListener('keydown', surGeste);
  window.addEventListener('wheel', surGeste, { passive: true });
  window.addEventListener('touchstart', surGeste, { passive: true });

  /* ------------------------------------------------------------ une image */
  function image(now) {
    raf = requestAnimationFrame(image);
    if (detruit || document.hidden) { dernier = now; return; }
    const dt = Math.min(0.05, dernier ? (now - dernier) / 1000 : 0.016);
    dernier = now;
    temps += dt;
    P.uTemps.value = temps;

    // ouverture
    if (ouvertureCommencee && tOuv < FIN + 1) tOuv += (dt / echelle) * accel;
    const tO = figerOuverture != null ? figerOuverture : tOuv;
    const o = etatOuverture(tO);
    if (!titreDonne && tO >= TITRE) { titreDonne = true; finir(); }

    // défilement lissé, vent
    pLisse = amortir(pLisse, pCible, reduit ? 2.4 : 3.6, dt);
    if (Math.abs(pLisse - pCible) < 1e-5) pLisse = pCible;
    const v = Math.abs(pLisse - pPrec) / Math.max(dt, 1e-3); pPrec = pLisse;
    vitesse = v > vitesse ? amortir(vitesse, v, 6, dt) : amortir(vitesse, v, 1.2, dt);
    vent = (reduit ? 0.28 : 0.42) + Math.min(1, vitesse * 6) * (reduit ? 0.45 : 1.25);
    P.uVent.value = vent;

    // ambiance
    curseur = amortir(curseur, curseurCible, reduit ? 0.45 : 0.6, dt);
    const A = ambiances.evaluer(curseur);
    const L = o.lumiere;

    // caméra
    const pc = cheminCam.getPoint(borne(pLisse)), pv = cheminVue.getPoint(borne(pLisse));
    const derive = reduit ? 0.012 : 0.025;
    pc.x += Math.sin(temps * 0.21) * derive; pc.y += Math.sin(temps * 0.17 + 1) * derive;
    const recul = (1 - o.retrait) * distOuverture * (reduit ? 0.08 : 0.24) * (1 - lisse(0, 0.04, pLisse));
    pc.z -= recul;
    camera.position.copy(pc);
    camera.lookAt(pv);
    // une fois né, le sceau quitte la colonne du titre : à droite en paysage, vers le haut en portrait ;
    // il revient au centre dès qu'on défile vers lui (avant la traversée de l'anneau)
    const glisse = lisse(0, 1, o.retrait) * (1 - lisse(0.0, 0.05, pLisse));
    if (glisse > 0.0005) {
      const portraitV = camera.aspect < 1;
      camera.setViewOffset(largeur, hauteur, portraitV ? 0 : -largeur * 0.3 * glisse, portraitV ? hauteur * 0.27 * glisse : 0, largeur, hauteur);
      camera.zoom = 1 - (portraitV ? 0.34 : 0.32) * glisse;
      camera.updateProjectionMatrix();
    } else if (camera.view && camera.view.enabled) {
      camera.clearViewOffset();
      camera.zoom = 1;
      camera.updateProjectionMatrix();
    }
    camera.updateMatrixWorld();

    // lumière principale : direction de l'ambiance exprimée dans le repère de la caméra, donc le halo
    // reste en haut à droite de l'écran et le côté gauche (le texte) reste calme
    lumMonde.copy(A.lumDir).transformDirection(camera.matrixWorld);
    lum.color.copy(A.lum); lum.intensity = A.lumInt * (0.15 + 0.85 * L);
    lum.position.copy(camera.position).addScaledVector(lumMonde, 30);
    lum.target.position.copy(camera.position);
    hemi.color.copy(A.hemiCiel); hemi.groundColor.copy(A.hemiSol); hemi.intensity = A.hemiInt * (0.2 + 0.8 * L);
    P.uLumCouleur.value.copy(A.lum).multiplyScalar(A.lumInt * 0.55 * (0.2 + 0.8 * L));
    P.uLumDir.value.copy(A.lumDir);
    P.uSeve.value.copy(A.seve);
    P.uFTrans.value.copy(A.trans);
    scene.fog.color.copy(A.brume); scene.fog.density = A.densite;
    scene.environmentIntensity = A.envInt * (0.3 + 0.7 * L);
    renderer.toneMappingExposure = A.expo;
    bloom.strength = A.bloom + o.eclat * (reduit ? 0.2 : 0.45);

    ciel.mesh.position.copy(camera.position);
    ciel.u.uZen.value.copy(A.zen); ciel.u.uHor.value.copy(A.hor); ciel.u.uHalo.value.copy(A.halo);
    ciel.u.uHaloForce.value = A.haloForce; ciel.u.uLumDir.value.copy(lumMonde); ciel.u.uEtoiles.value = A.etoiles;
    ciel.u.uLumiere.value = 0.08 + 0.92 * L;

    // pousse : monotone, suit la caméra avec de l'avance, jamais plus vite qu'une vitesse douce
    const cibleCroiss = tO < 2.05 ? o.liane : Math.max(o.liane, uDe(pLisse) + 11);
    if (cibleCroiss > croiss) croiss = Math.min(cibleCroiss, croiss + dt * (reduit ? 5 : 9) * (0.4 + 0.6 * borne((cibleCroiss - croiss) / 4)));
    matLiane.userData.uniforms.uCroiss.value = croiss;
    matLiane.userData.uniforms.uSeveInt.value = A.seveInt;
    matLiane.userData.uniforms.uLueurJade.value = A.jadeLueur * 2.5;
    feuilles.materiau.userData.uniforms.uCroiss.value = croiss;
    fleurs.materiau.userData.uniforms.uCroiss.value = croiss;
    const iT = Math.max(0, Math.min(traces.tige.length - 1, Math.round((croiss - 0.35) / traces.pas)));
    lumSeve.position.copy(traces.tige[iT].p);
    lumSeve.color.copy(A.seve);
    lumSeve.intensity = (croiss > 1 ? 1 : 0) * 2.2 * (0.3 + 0.7 * L);

    // la vrille et le sceau
    const uv = matVrille.userData.uniforms;
    uv.uCroiss.value = o.vrille; uv.uQueue.value = o.queue - 0.2; uv.uSeveInt.value = A.seveInt * 1.2;
    vrille.visible = o.queue < vrilleData.longueur + 0.3;
    const fo = feuillesOuv.materiau.userData.uniforms;
    fo.uCroiss.value = o.feuilles; fo.uRepli.value = o.repli; fo.uDissout.value = o.dissout;
    feuillesOuv.mesh.visible = o.feuilles > 0.001 && o.dissout < 1.0;
    const longBoucle = vrilleData.longueur - vrilleData.longJet;
    sceau.apparition(sceau.anneau, borne((o.queue - vrilleData.longJet) / longBoucle + 0.05));
    for (const f of sceau.folioles) sceau.apparition(f, o.folioles);
    sceau.apparition(sceau.coeur, o.coeur);
    const eclat = o.eclat * (reduit ? 0.45 : 1);
    const approche = lisse(0.01, 0.07, pLisse);
    sceau.tout('uEclat', eclat);
    sceau.lisere(1.6 * (1 - 0.55 * o.retrait) * (1 - 0.6 * approche) * (0.35 + 0.65 * L) * (0.9 + 0.1 * Math.sin(temps * 1.1)));
    sceau.tout('uLueur', (0.26 + 0.3 * eclat) * (1 - 0.35 * o.retrait) * (1 - 0.65 * approche) * (0.3 + 0.7 * L));
    for (const pa of sceau.parties) pa.face.envMapIntensity = 2.6 * (1 - 0.6 * approche);

    // étincelle (au cœur) et comète (la tête de la vrille)
    vue.copy(camera.position);
    etincelle.mesh.position.set(0, 0, 0.06);
    etincelle.mesh.quaternion.copy(camera.quaternion);
    etincelle.mesh.scale.setScalar(0.5 + 0.9 * lisse(0, 0.3, tO));
    etincelle.u.uInt.value = o.etincelle * 1.6 + eclat * 0.25;
    etincelle.mesh.visible = etincelle.u.uInt.value > 0.002;
    const lv = Math.max(0, o.vrille - 0.15);
    vrilleData.tete(lv, tete);
    comete.mesh.position.copy(tete).add(tmp2.set(0, 0, 0.08));
    comete.mesh.quaternion.copy(camera.quaternion);
    comete.mesh.scale.setScalar(0.7);
    const ic = lisse(0.28, 0.4, tO) * (1 - lisse(1.25, 1.6, tO));
    comete.u.uInt.value = ic * 1.3; comete.u.uRayons.value = 0.4;
    comete.mesh.visible = ic > 0.002;
    lumCoeur.position.copy(tete).add(tmp2.set(0, 0, 0.5));
    lumCoeur.intensity = (ic * 3 + o.etincelle * 2 + eclat * 4 + (1 - o.retrait) * 0.6 * lisse(1.6, 2.2, tO)) * (reduit ? 0.8 : 1);
    lumCoeur.color.copy(A.seve);

    aura.u.uCouleur.value.copy(A.seve);
    aura.u.uInt.value = lisse(1.9, 2.6, tO) * (1 - approche) * (reduit ? 0.8 : 1);
    aura.mesh.visible = aura.u.uInt.value > 0.002;
    // onde et gerbe du rayonnement
    onde.u.uR.value = RAYON_SCEAU * (1 + sortieCubique(o.onde) * 2.2);
    onde.u.uA.value = o.onde > 0 && o.onde < 1 ? Math.pow(1 - o.onde, 3) * (reduit ? 0.5 : 1.1) : 0;
    onde.u.uLarg.value = 0.035 + 0.1 * o.onde;
    onde.u.uCouleur.value.copy(A.seve);
    onde.mesh.visible = onde.u.uA.value > 0.001;
    if (!gerbeLancee && tO >= 2.27 && tO < 2.8 && !reduit) { gerbeLancee = true; gerbes.lancer(tmp.set(0, 0, 0.05), temps, { ech: 2.3, plan: true }); }
    gerbes.u.uCouleur.value.copy(A.lucioles).lerp(A.seve, 0.5);

    lucioles.u.uCouleur.value.copy(A.lucioles);
    lucioles.u.uInt.value = A.luciolesInt * o.lucioles * (reduit ? 0.8 : 1);
    lucioles.u.uDens.value = A.densite;
    bokeh.u.uCouleur.value.copy(A.lucioles);
    bokeh.u.uInt.value = A.luciolesInt * o.lucioles * (reduit ? 0.7 : 1);
    silh.u.uLumDir.value.copy(A.lumDir);
    finition.uniforms.uTemps.value = temps;
    if (voileManuel == null) finition.uniforms.uVoile.value = voileDefaut * lisse(2.1, 2.9, tO);
    scene.environmentRotation.y = Math.sin(temps * (reduit ? 0.08 : 0.13)) * 0.45;

    composer.render(dt);

    // cadence et adaptation (jamais sous la bride de capture)
    mesures.push(dt * 1000); if (mesures.length > 120) mesures.shift();
    if (!bride && temps - derniereAdaptation > 2.5 && temps > 4 && mesures.length >= 60) {
      derniereAdaptation = temps;
      const moy = mesures.reduce((a, b) => a + b, 0) / mesures.length;
      if (moy > 21 && dpr > (mobile ? 0.8 : 0.75)) { dpr = Math.max(mobile ? 0.8 : 0.75, dpr * 0.85); dimensionner(); mesures.length = 0; }
    }
  }

  /* ------------------------------------------------------------ démarrage */
  const demarrer = async () => {
    try { await renderer.compileAsync(scene, camera); } catch {}
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

  return {
    pret,
    ouvertureFinie,
    progression(p, sectionId) {
      pCible = borne(Number(p) || 0);
      const i = SECTIONS.indexOf(sectionId);
      curseurCible = i >= 0 ? i : pCible * 8;
      if (pCible > 0.01 && tOuv < FIN) passer();
    },
    passer,
    /* assombrit la scène derrière le texte : force de 0 à 0,8 ; zone = [début, fin] du fondu horizontal
       (0 à 1 de gauche à droite ; [2, 3] couvre toute la largeur). Sans argument : réglage par défaut. */
    voile(force, zone) {
      if (force == null) { voileManuel = null; dimensionner(); return; }
      voileManuel = borne(force, 0, 0.8);
      finition.uniforms.uVoile.value = voileManuel;
      if (zone) finition.uniforms.uVoileZone.value.set(zone[0], zone[1]);
    },
    /* test seulement : fige l'ouverture à l'instant t (secondes de l'ouverture normale), null pour relâcher */
    _figer(t) { figerOuverture = t; },
    /* test seulement : saute au bout des lissages (caméra, ambiance, pousse) */
    _debug() { return { scene, lumSeve, lumCoeur, lucioles, bokeh, feuilles, renderer, camera }; },
    _sauter() { pLisse = pCible; pPrec = pCible; curseur = curseurCible; croiss = Math.max(croiss, uDe(pCible) + 11); },
    stats() {
      const moy = mesures.length ? mesures.reduce((a, b) => a + b, 0) / mesures.length : 0;
      return { ips: moy ? Math.round(1000 / moy) : 0, ms: Math.round(moy * 10) / 10, dpr, ouverture: Math.round(tOuv * 100) / 100, croissance: Math.round(croiss * 10) / 10, curseur: Math.round(curseur * 100) / 100, appels: renderer.info.render.calls, triangles: renderer.info.render.triangles };
    },
    detruire() {
      detruit = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('pointerdown', surGeste);
      window.removeEventListener('keydown', surGeste);
      window.removeEventListener('wheel', surGeste);
      window.removeEventListener('touchstart', surGeste);
      scene.traverse((ob) => {
        if (ob.geometry) ob.geometry.dispose();
        const m = ob.material; if (m) (Array.isArray(m) ? m : [m]).forEach((x) => x.dispose());
      });
      envRT.dispose();
      composer.dispose?.();
      cible.dispose();
      renderer.dispose();
      finir(); resoudrePret();
    },
  };
}
