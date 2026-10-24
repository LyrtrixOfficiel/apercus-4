/* Mathéo Bringia v2, le monde : « un tour d'Angerville, de nuit ».

   Le protagoniste est le logo MB en 3D (logo.js), extrudé depuis le vrai logo vectorisé. Il se pose sur la ligne de
   départ, sous le portique, pendant que les 5 feux rouges s'allument AU RYTHME DU CHARGEMENT RÉEL ; les feux
   s'éteignent : départ. Puis le défilement de la page fait faire UN TOUR du vrai tracé d'Angerville (1198 m) en
   caméra embarquée lissée, de nuit ; le MB nous accompagne et change de matière d'une partie à l'autre.

   Parties (SECTIONS) et ce qu'on voit :
     ouverture    la grille de nuit, le MB posé sur la ligne (carbone), les feux ; DÉPART
     palmares     on passe sous le portique ; ligne droite des stands : les panneaux géants des chiffres (alu brossé)
     course       virage 1, la ligne droite, l'épingle droite (gomme)
     photos       le S et la boucle : les écrans géants avec ses vraies photos (carbone)
     calendrier   le freinage : TUNNEL de lumière orange (alu)
     actus        la courbe des tribunes, projecteurs et poussière (carbone)
     pilote       la VISIÈRE traverse l'écran ; le MB revient grand, en peinture orange nacrée (le casque)
     partenaires  la ligne droite du fond et l'épingle : panneaux publicitaires de bord de piste (alu)
     arrivee      le dernier virage, le portique, le damier ; FLASH du podium, le MB en OR ; puis la piste se replie
                  en tracé lumineux vu du ciel.
   Tout est fonction CONTINUE de la position s (partie + locale) : rien ne dépend d'une minuterie, tout se rejoue à
   l'envers. Contrat avec la page : LISEZMOI.md. */
import { borne, lisse, plusLisse, melange, amortir, sortieCubique, cloche, table, bruit1 } from './commun.js';
import { creerLogo, creerOmbre } from './logo.js';
import { piste, LONGUEUR, U_LIGNE, NB_LAMPES, creerRuban, creerSol, creerCiel } from './piste.js';
import { creerDecor, auBord } from './decor.js';
import { creerFinition, creerEnvironnement } from './finition.js';
import { chargerPolices } from './textes.js';
const chargerRepli = () => import('./repli.js').then((m) => m.repli);

export const VERSION_THREE = '0.170.0';
export const SECTIONS = ['ouverture', 'palmares', 'course', 'photos', 'calendrier', 'actus', 'pilote', 'partenaires', 'arrivee'];
const CDN = `https://cdn.jsdelivr.net/npm/three@${VERSION_THREE}`;
const PP = `${CDN}/examples/jsm/postprocessing`;
const FOND_CSS = 'radial-gradient(120% 70% at 50% 92%, #2a1206 0%, #0d0806 40%, #050506 100%)';
const PLAFOND = 25000;   // la 3D doit montrer sa première image en 25 s, sinon le repli

function webglPossible() {
  try { const c = document.createElement('canvas'); return !!c.getContext('webgl2'); } catch { return false; }
}

async function chargerThree(avance) {
  const poids = [0.62, 0.06, 0.04, 0.12, 0.08, 0.08];
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

/* ------------------------------------------------------------ le lancement (façade : rend la main tout de suite) */
export async function lancer({ canvas, reduit = false, mobile = false, sections = null, figerOuverture = null, forcerRepli = false, surChargement = null, adaptation = true } = {}) {
  if (!canvas) throw new Error('lancer : il faut un canevas');
  canvas.style.background = FOND_CSS;
  const ids = Array.isArray(sections) && sections.length === SECTIONS.length ? sections : SECTIONS;
  const opts = { reduit: !!reduit, mobile: !!mobile, ids };
  if (forcerRepli || !webglPossible()) {
    const r = (await chargerRepli())(canvas, opts);
    r.surChargement = (fn) => { try { fn(1); } catch {} return () => {}; };
    if (typeof surChargement === 'function') r.surChargement(surChargement);
    window.__mbMonde = r;
    return r;
  }
  const F = creerFacade();
  window.__mbMonde = F.objet;
  F.replier = () => chargerRepli().then((repli) => F.basculer(repli(canvas, { ...opts, fondu: true }))).catch(() => {});
  if (typeof surChargement === 'function') F.objet.surChargement(surChargement);
  // le plafond : pas de première image 3D en 25 s, le repli prend la place
  const plafond = setTimeout(() => { if (!F.aPret()) { window.__mbPlafond = true; chargerRepli().then((repli) => F.brancherRepli(repli(canvas, opts))); } }, PLAFOND);
  const polices = chargerPolices();
  const logo = fetch(new URL('./logo-mb.json', import.meta.url)).then((r) => r.json());
  (async () => {
    let M;
    try { M = await chargerThree((x) => F.avance(x * 0.6)); }
    catch (e) { window.__mbErreur = String(e && e.stack || e); clearTimeout(plafond); F.brancherRepli((await chargerRepli())(canvas, opts)); return; }
    if (F.estDetruite() || F.aRepli()) return;
    try {
      const donnees = await logo; await polices; F.avance(0.66);
      const impl = await monter(M, { canvas, ...opts, figerOuverture, logo: donnees, avance: (x) => F.avance(x), facade: F, adaptation });
      F.brancher(impl);
      impl.pret.then(() => clearTimeout(plafond));
    } catch (e) { window.__mbErreur = String(e && e.stack || e); clearTimeout(plafond); F.brancherRepli((await chargerRepli())(canvas, opts)); }
  })();
  return F.objet;
}

function creerFacade() {
  let impl = null, charge = 0, demandePause = false, detruite = false, pretFait = false;
  let derniereProg = null, photos = null, partenaires = null, chiffres = null;
  const ecoutes = new Set();
  let resPret, resFin;
  const pret = new Promise((r) => { resPret = r; });
  const ouvertureFinie = new Promise((r) => { resFin = r; });
  const avance = (x) => {
    x = borne(x); if (x <= charge) return; charge = x;
    for (const f of ecoutes) { try { f(charge); } catch {} }
  };
  const rejouer = (x) => {
    if (derniereProg) x.progression(...derniereProg);
    if (photos) x.definirPhotos(photos);
    if (partenaires) x.definirPartenaires(partenaires);
    if (chiffres) x.definirChiffres(chiffres);
    if (demandePause) x.pause();
  };
  const brancher = (x) => {
    if (detruite) { try { x.detruire(); } catch {} return; }
    if (impl && impl.repli) { try { x.detruire(); } catch {} return; }   // le plafond a déjà passé la main au repli
    impl = x; rejouer(x);
    Promise.resolve(x.pret).then(() => { pretFait = true; avance(1); resPret(); });
    Promise.resolve(x.ouvertureFinie).then(() => resFin());
  };
  /* le repli prend la place (plafond, échec) : la 3D éventuelle est libérée */
  const brancherRepli = (r) => {
    if (detruite) { try { r.detruire(); } catch {} return; }
    const ancien = impl; impl = r; rejouer(r);
    if (ancien) { try { ancien.detruire(); } catch {} }
    Promise.resolve(r.pret).then(() => { pretFait = true; avance(1); resPret(); });
    Promise.resolve(r.ouvertureFinie).then(() => resFin());
  };
  let bascule = false;
  const basculer = (r) => {
    if (bascule || detruite || !impl || impl.repli) { try { r.detruire(); } catch {} return; }
    bascule = true; const ancien = impl; impl = r; rejouer(r);
    window.__mbRepliAuto = Math.round(performance.now());
    setTimeout(() => { try { ancien.detruire(); } catch {} }, 1500);
  };
  const objet = {
    pret, ouvertureFinie,
    get repli() { return !!(impl && impl.repli); },
    surChargement(fn) { if (typeof fn !== 'function') return () => {}; ecoutes.add(fn); try { fn(charge); } catch {} return () => ecoutes.delete(fn); },
    progression(p, id, locale) { derniereProg = [p, id, locale]; if (impl) impl.progression(p, id, locale); },
    definirPhotos(l) { photos = Array.isArray(l) ? l.slice() : []; if (impl) impl.definirPhotos(photos); },
    definirPartenaires(l) { partenaires = Array.isArray(l) ? l.slice() : []; if (impl) impl.definirPartenaires(partenaires); },
    definirChiffres(l) { chiffres = Array.isArray(l) ? l.slice() : []; if (impl) impl.definirChiffres(chiffres); },
    etat() { return impl ? impl.etat() : { section: 'ouverture', s: 0, clair: 0, fond: 'sombre', mb: { x: 0.5, y: 0.45, r: 0.2 }, fps: 0, feux: 0, palier: 0, qualite: 1 }; },
    clairEn(x, y) { return impl && impl.clairEn ? impl.clairEn(x, y) : 0; },
    pause() { demandePause = true; if (impl) impl.pause(); },
    reprendre() { demandePause = false; if (impl) impl.reprendre(); },
    get enPause() { return impl ? !!impl.enPause : demandePause; },
    passer() { if (impl) impl.passer(); },
    stats() { return impl ? impl.stats() : { chargement: Math.round(charge * 100) / 100 }; },
    detruire() { detruite = true; if (impl) impl.detruire(); resPret(); resFin(); },
    _figer(t) { if (impl && impl._figer) impl._figer(t); },
    _debug() { return impl && impl._debug ? impl._debug() : null; },
    _sauter() { if (impl && impl._sauter) impl._sauter(); },
    _qualite(n) { return impl && impl._qualite ? impl._qualite(n) : 0; },
    _replier() { if (impl && !impl.repli) objet.__F.replier(); },
  };
  const F = { objet, avance, brancher, brancherRepli, basculer, aPret: () => pretFait, aRepli: () => !!(impl && impl.repli), estDetruite: () => detruite, replier: null };
  objet.__F = F;
  return F;
}

/* ------------------------------------------------------------ les clés, partie par partie */
const L = LONGUEUR;
const U_DEPART = U_LIGNE - 13 / L;
/* l'avancée sur le tracé (u) en fonction de s */
const uDe = table([
  [0, U_DEPART], [0.25, U_DEPART + 1.5 / L], [1, 0.0475], [2, 0.118], [3, 0.252], [4, 0.398], [5, 0.508],
  [5.8, 0.556], [6.5, 0.578], [7, 0.598], [8, 0.80], [8.36, 1.0], [8.55, 1.04], [9, 1.072],
]);
/* les matières du corps du MB : [carbone, nacre, alu, gomme, or] par partie */
const MATIERES = [[1, 0, 0, 0, 0], [0, 0, 1, 0, 0], [0, 0, 0, 1, 0], [1, 0, 0, 0, 0], [0, 0, 1, 0, 0], [1, 0, 0, 0, 0], [0, 1, 0, 0, 0], [0, 0, 1, 0, 0], [0, 0, 1, 0, 0]];
/* la place du MB à l'écran (repère de la caméra) : [x, y] en NDC, taille (part de la hauteur d'écran), par partie,
   en paysage et en portrait (le texte de la page est à gauche en paysage, en bas en portrait) */
const PLACE_P = [[0, 0.05, 0.3], [0.52, 0.55, 0.19], [0.5, 0.2, 0.24], [0.66, 0.6, 0.13], [0.5, 0.2, 0.24], [0.52, 0.2, 0.23], [0.42, 0.06, 0.44], [0.52, 0.22, 0.23], [0.5, 0.3, 0.24]];
const PLACE_V = [[0, 0.3, 0.2], [0, 0.5, 0.17], [0, 0.5, 0.17], [0.55, 0.74, 0.1], [0, 0.5, 0.17], [0, 0.5, 0.17], [0, 0.38, 0.3], [0, 0.5, 0.16], [0, 0.56, 0.2]];
function cleDe(tab, s, k) {
  const i = Math.floor(borne(s, 0, 8.999)), l = s - i;
  // plateau au milieu de la partie, passage sur les bords (0,8 à 1,2)
  const a = tab[i][k];
  if (l > 0.78 && i < 8) return melange(a, tab[i + 1][k], plusLisse(0.78, 1.0, l) * 0.5);
  if (l < 0.22 && i > 0) return melange(tab[i - 1][k], a, 0.5 + plusLisse(0, 0.22, l) * 0.5);
  return a;
}

/* ------------------------------------------------------------ la scène */
async function monter(M, { canvas, reduit, mobile, ids, figerOuverture: figerInitial, logo: donneesLogo, avance, facade, adaptation }) {
  const { THREE } = M;
  let figerOuverture = figerInitial;
  const bride = () => typeof window.__bride === 'number';
  const attendreImage = () => new Promise((r) => requestAnimationFrame(() => r()));
  const V3 = THREE.Vector3;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, stencil: false, powerPreference: 'high-performance' });
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x050506, 1);
  renderer.debug.checkShaderErrors = !!window.__mbDebug;
  { const ex = renderer.extensions, get = ex.get.bind(ex); ex.get = (n) => (n === 'KHR_parallel_shader_compile' && !ex.has(n) ? null : get(n)); }
  const dprBase = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 1.75);
  let dpr = dprBase;
  /* la qualité adaptative : 6 paliers (0 = pleine qualité) */
  const PALIERS = [
    { r: 1, halo: 1, part: 1, lampes: 8 }, { r: 0.88, halo: 1, part: 1, lampes: 8 }, { r: 0.78, halo: 0.9, part: 0.85, lampes: 7 },
    { r: 0.69, halo: 0.8, part: 0.7, lampes: 6 }, { r: 0.62, halo: 0.7, part: 0.55, lampes: 5 }, { r: 0.56, halo: 0.6, part: 0.45, lampes: 4 },
  ];
  const PLANCHER = mobile ? 0.75 : 0.6, PALIER_MAX = PALIERS.length - 1;
  let qHalo = 1, partCible = 1, partVue = 1;
  const Q = { n: 0, brut: 0, fen: [], prochain: 0, bonDepuis: 0, attenteMontee: 0, recul: 8000, essai: null, descente: null, cible: 0, mem: [], vMin: 1000 / 60, historique: [], depuis: 0 };

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 2600);
  scene.add(camera);
  const envRT = creerEnvironnement(THREE, renderer);

  /* les uniformes partagés par tout le décor */
  const lampes = Array.from({ length: NB_LAMPES }, () => new THREE.Vector4());
  const U = {
    uTemps: { value: 0 }, uNuit: { value: 1 }, uTrace: { value: 0 }, uOrangeTunnel: { value: 0 },
    uCam: { value: new V3() }, uLampes: { value: lampes }, uNbL: { value: NB_LAMPES }, uCouleurLampe: { value: new THREE.Color(1.0, 0.9, 0.78) },
  };
  avance(0.68);

  const ciel = creerCiel(THREE, U), sol = creerSol(THREE, U), ruban = creerRuban(THREE, U);
  scene.add(ciel.mesh, sol.mesh, ruban.mesh);
  const decor = creerDecor(THREE, U, { mobile, reduit, tunnel: [uDe(3.7), uDe(4.42)] });
  scene.add(decor.groupe, decor.lignes);

  /* ---------------- le MB */
  const mb = creerLogo(THREE, donneesLogo);
  for (const m of [mb.matCorps, mb.matLettres, mb.matLisere]) { m.envMap = envRT.texture; }
  mb.matCorps.envMapIntensity = 1; mb.matLettres.envMapIntensity = 0.6; mb.matLisere.envMapIntensity = 0.5;
  const pivot = new THREE.Group(); pivot.add(mb.groupe);
  scene.add(pivot);
  const ombre = creerOmbre(THREE); scene.add(ombre);
  // l'onde de lumière au sol quand il se pose, et au départ
  const onde = new THREE.Mesh(new THREE.RingGeometry(0.2, 1, 64), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uT: { value: 0 }, uF: { value: 0 } },
    vertexShader: 'precision highp float;\nprecision highp int;\nvarying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'precision highp float;\nprecision highp int;\nuniform float uT, uF; varying vec2 vUv; void main(){ float r = length(vUv - 0.5) * 2.0; float a = exp(-(((r - uT) * 9.0) * ((r - uT) * 9.0))) * uF * (1.0 - uT); gl_FragColor = vec4(vec3(1.0, 0.38, 0.08) * a * 4.0, 1.0); }',
  }));
  onde.rotation.x = -Math.PI / 2; onde.renderOrder = 3; scene.add(onde);
  // les lumières du MB : une clé froide, un contre-jour orange, le projecteur le plus proche
  const cle = new THREE.DirectionalLight(0xf2f4ff, 1.4); scene.add(cle, cle.target);
  const contre = new THREE.PointLight(0xff5a14, 0, 12, 2); scene.add(contre);
  const contreF = new THREE.DirectionalLight(0xdfe8ff, 2.2); scene.add(contreF, contreF.target);
  const proche = new THREE.PointLight(0xfff0dc, 0, 60, 2); scene.add(proche);
  const remplir = new THREE.HemisphereLight(0x1a1c28, 0x1a0c04, 0.4); scene.add(remplir);

  /* ---------------- le rendu : scène -> halo -> finition -> sortie (filmique, sRGB) */
  let largeur = 1, hauteur = 1, portrait = false;
  const cible = new THREE.WebGLRenderTarget(2, 2, { type: THREE.HalfFloatType, samples: mobile ? 0 : 4 });
  const composer = new M.EffectComposer(renderer, cible);
  composer.addPass(new M.RenderPass(scene, camera));
  const halo = new M.UnrealBloomPass(new THREE.Vector2(256, 256), mobile ? 0.42 : 0.5, 0.5, 1.1);
  composer.addPass(halo);
  const finition = new M.ShaderPass(creerFinition(THREE));
  composer.addPass(finition);
  composer.addPass(new M.OutputPass());
  const FU = finition.uniforms;
  FU.uDoux.value = reduit ? 1 : 0;

  function dimensionner() {
    const r = canvas.getBoundingClientRect();
    largeur = Math.max(1, Math.round(r.width || window.innerWidth)); hauteur = Math.max(1, Math.round(r.height || window.innerHeight));
    portrait = hauteur > largeur * 1.05;
    renderer.setPixelRatio(dpr);
    renderer.setSize(largeur, hauteur, false);
    composer.setPixelRatio(dpr);
    composer.setSize(largeur, hauteur);
    const kb = (mobile ? 0.5 : 0.75) * qHalo;
    halo.setSize(Math.round(largeur * dprBase * kb), Math.round(hauteur * dprBase * kb));
    FU.uRes.value.set(largeur * dpr, hauteur * dpr);
    camera.aspect = largeur / hauteur;
    camera.updateProjectionMatrix();
  }
  dimensionner();
  const ro = new ResizeObserver(() => { Q.redim = true; Q.ignorer = 3; });
  ro.observe(canvas);

  /* ---------------- l'état */
  let sCible = 0, sLisse = 0, sPrec = 0, recu = false, vitesse = 0, avancee = 0, section = 'ouverture';
  let temps = 0, dernier = 0, raf = 0, enPause = false, detruit = false;
  let tOuv = 0, accel = 1, ouvertureCommencee = false, dernierGeste = -1e9, sDepart = null;
  let feux = 0, tFeu = 0.6, tTous = -1, tEteint = -1, finie = false;
  const DUREE = reduit ? 1.5 : 1;
  const pretes = { premier: false, decor: false, matieres: false };
  let resoudrePret, finir;
  const pret = new Promise((r) => { resoudrePret = r; });
  const ouvertureFinie = new Promise((r) => { finir = r; });
  let pointeur = { x: 0, y: 0 }, pointeurL = { x: 0, y: 0 };
  let chargeCourante = 0.7;
  const mesures = [];
  const mbEcran = { x: 0.5, y: 0.45, r: 0.2 };
  let flash = 0;

  /* ---------------- gestes */
  const accelerer = () => { if (!finie && ouvertureCommencee) accel = 4; };
  const geste = () => { dernierGeste = performance.now(); accelerer(); };
  const surPointeur = (e) => { pointeur.x = (e.clientX / Math.max(1, largeur)) * 2 - 1; pointeur.y = (e.clientY / Math.max(1, hauteur)) * 2 - 1; };
  const surOrientation = (e) => { if (e.gamma == null) return; pointeur.x = borne(e.gamma / 30, -1, 1); pointeur.y = borne((e.beta - 45) / 30, -1, 1); };
  const surBas = (e) => { if (e.target && e.target.closest && e.target.closest('a,button,input,textarea,select,summary,label')) return; geste(); };
  window.addEventListener('pointermove', surPointeur, { passive: true });
  window.addEventListener('deviceorientation', surOrientation, { passive: true });
  window.addEventListener('wheel', geste, { passive: true });
  window.addEventListener('touchstart', geste, { passive: true });
  window.addEventListener('keydown', geste);
  window.addEventListener('pointerdown', surBas, { passive: true });
  const surVisibilite = () => { Q.fen.length = 0; Q.brut = 0; dernier = 0; };
  document.addEventListener('visibilitychange', surVisibilite);

  /* ---------------- outils de pose */
  const tmpV = new V3(), tmpV2 = new V3(), tmpQ = new THREE.Quaternion(), tmpQ2 = new THREE.Quaternion(), tmpE = new THREE.Euler(), tmpM = new THREE.Matrix4();
  const camPos = new V3(), camVise = new V3();
  // le centre de la boîte du circuit (trace.js est centré sur elle)
  const centreCircuit = (() => { let a = 1e9, b = -1e9, c = 1e9, d = -1e9; for (const p of piste.POS) { a = Math.min(a, p[0]); b = Math.max(b, p[0]); c = Math.min(c, p[1]); d = Math.max(d, p[1]); } return [(a + b) / 2, (c + d) / 2]; })();
  const ligne = auBord(U_LIGNE, 0, 0);

  /* la caméra embarquée à la position s (avant les effets) */
  function poserCamera(s, t, dt) {
    const u = uDe(s);
    const p = piste.pointLisse(u), tg = piste.tangenteLisse(u), dr = piste.droite(tg);
    // l'ouverture : en paysage, la caméra se décale à gauche (le titre de la page est à gauche, le MB à droite) ;
    // en portrait, elle monte un peu et regarde plus bas (le titre est en bas, le MB au-dessus)
    const hero = 1 - plusLisse(0.05, 0.8, s);
    const lat = piste.trajectoire(u) * 0.55 * lisse(0.3, 1.2, s) + (portrait ? 0 : -3.8) * hero;
    const h = melange(1.3, 1.15, lisse(0, 1, s)) + cloche(5.6, 6.0, 6.6, 7.0, s) * 0.3 + (portrait ? 1.1 : 0) * hero;
    camPos.set(p[0] + dr[0] * lat, h, p[1] + dr[1] * lat);
    // le regard : la ligne et le MB à l'ouverture, puis la piste devant (lissée)
    const loin = melange(13.6, 17, lisse(0.05, 0.9, s));
    const uv = u + loin / L;
    const q = piste.pointLisse(uv), dq = piste.droite(piste.tangenteLisse(uv)), latV = piste.trajectoire(uv) * 0.5 * lisse(0.3, 1.2, s) + (portrait ? 0 : -3.8) * hero;
    const hv = melange(portrait ? 0.1 : (largeur / hauteur > 2.1 ? 4.3 : 3.2), portrait ? 2.2 : 0.85, lisse(0.0, 0.8, s));
    camVise.set(q[0] + dq[0] * latV, hv, q[1] + dq[1] * latV);
    // l'ouverture : la caméra descend en grue vers sa place
    if (!finie || tOuv < 12) {
      const e = sortieCubique(borne(tOuv / 3.6));
      const recul = (1 - e) * 6, monte = (1 - e) * 2.6;
      camPos.x -= tg[0] * recul; camPos.z -= tg[1] * recul; camPos.y += monte;
      camVise.y += monte * 0.25;
    }
    // le final : on monte au ciel, au-dessus du circuit
    const ciel = plusLisse(8.58, 9.0, s);
    if (ciel > 0) {
      const cx = centreCircuit[0], cz = centreCircuit[1];
      // en paysage, le circuit en long ; en portrait, la caméra tourne d'un quart : la grande longueur passe en hauteur.
      // Le centre du circuit est un peu sous le milieu de l'écran (le MB est au-dessus).
      const haut = portrait ? 410 : 255;
      const [px, pz, vx, vz] = portrait ? [cx + haut * 0.3, cz, cx - 72, cz] : [cx, cz + haut * 0.36, cx, cz - 30];
      camPos.set(melange(camPos.x, px, ciel), melange(camPos.y, haut, ciel), melange(camPos.z, pz, ciel));
      camVise.set(melange(camVise.x, vx, ciel), melange(camVise.y, 0, ciel), melange(camVise.z, vz, ciel));
    }
    camera.position.copy(camPos);
    camera.near = melange(0.1, 4, ciel);
    camera.up.set(0, 1, 0);
    camera.lookAt(camVise);
    // le roulis dans les virages (adouci en mouvement réduit), un léger tremblement de moteur
    const k = piste.courbure(u + 6 / L);
    const roulis = borne(-k * 2.6, -0.1, 0.1) * (reduit ? 0.4 : 1) * (1 - ciel);
    camera.rotateZ(roulis);
    if (!reduit && finie) {
      const tr = 0.0012 * (0.3 + Math.min(1, vitesse * 3)) * (1 - ciel);
      camera.rotateX((bruit1(t * 23) - 0.5) * tr); camera.rotateY((bruit1(t * 19 + 5) - 0.5) * tr);
    }
    return u;
  }

  /* la place du MB : posé sur la ligne (ouverture) ou devant la caméra, à sa place d'écran */
  function poserMB(s, t, u) {
    const asp = largeur / hauteur;
    const tab = portrait ? PLACE_V : PLACE_P;
    let nx = cleDe(tab, s, 0), ny = cleDe(tab, s, 1), taille = cleDe(tab, s, 2);
    if (!portrait && asp > 2.1) { nx *= 0.75; taille *= 1.05; }   // ultra-large : un peu plus près du texte
    // vu du ciel : le MB monte au-dessus du circuit et rapetisse un peu
    const cielMB = plusLisse(8.6, 9.0, s);
    ny = melange(ny, portrait ? 0.7 : 0.62, cielMB); nx = melange(nx, 0, cielMB); taille *= melange(1, portrait ? 0.8 : 0.72, cielMB);
    // le pointeur le déplace un peu
    nx += pointeurL.x * 0.025; ny -= pointeurL.y * 0.02;
    const d = melange(6.5, 22, plusLisse(8.58, 9.0, s));
    const demiH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * d;
    const hMonde = taille * 2 * demiH;
    tmpV.set(nx * demiH * asp, ny * demiH, -d).applyMatrix4(camera.matrixWorld);
    const echCam = hMonde;
    // posé sur la ligne : debout dans la case de pole, face à la caméra
    const echSol = 3.0;
    tmpV2.set(ligne.x - ligne.t[0] * 0.6, echSol * 0.5 + 0.02, ligne.z - ligne.t[1] * 0.6);
    const wSol = 1 - plusLisse(0.04, 0.62, s);
    // l'ouverture : il descend du ciel et se pose
    let chute = 0, tour = 0;
    if (tOuv < 3) {
      const e = borne(tOuv / 1.7);
      chute = (1 - sortieCubique(e)) * 7 + Math.sin(e * Math.PI) * 0;
      tour = (1 - sortieCubique(e)) * Math.PI * 1.2;
    }
    tmpV2.y += chute;
    pivot.position.lerpVectors(tmpV, tmpV2, wSol);
    const ech = melange(echCam, echSol, wSol);
    // respiration
    const souffle = 1 + Math.sin(t * (reduit ? 1.0 : 1.6)) * 0.012;
    pivot.scale.setScalar(ech * souffle);
    // orientation : face à la caméra, penché dans les virages, vers le pointeur
    tmpM.lookAt(camera.position, pivot.position, camera.up);
    tmpQ.setFromRotationMatrix(tmpM);   // +z vers la caméra
    const k = piste.courbure(u + 10 / L);
    const amp = reduit ? 0.5 : 1;
    // au sol, il regarde la caméra mais garde son aplomb (pas de basculement)
    const lacet = (pointeurL.x * 0.22 + Math.sin(t * 0.5) * 0.06 - k * 3) * amp + tour;
    const tangage = (-pointeurL.y * 0.12 + Math.sin(t * 0.37) * 0.03) * amp * (1 - wSol);
    const roulis = borne(k * 4, -0.25, 0.25) * amp * (1 - wSol);
    tmpE.set(tangage, lacet, roulis, 'YXZ'); tmpQ2.setFromEuler(tmpE);
    pivot.quaternion.copy(tmpQ).multiply(tmpQ2);
    if (wSol > 0) { const qSol = new THREE.Quaternion().setFromAxisAngle(new V3(0, 1, 0), Math.atan2(camera.position.x - pivot.position.x, camera.position.z - pivot.position.z)).multiply(tmpQ2); pivot.quaternion.slerp(qSol, wSol); }
    // départ : un tour complet
    if (tEteint > 0) { const e = borne((tOuv - tEteint) / 1.3); if (e < 1) pivot.rotateY(sortieCubique(e) * Math.PI * 2); }
    // l'ombre au sol (seulement posé)
    ombre.position.set(pivot.position.x, 0.04, pivot.position.z);
    ombre.scale.set(echSol * 1.6, echSol * 0.9, 1);
    ombre.rotation.z = -Math.atan2(ligne.t[0], ligne.t[1]);
    ombre.material.uniforms.uForce.value = 0.75 * wSol * borne(1 - chute / 3);
    ombre.visible = wSol > 0.01;
    // le centre du MB à l'écran (pour la page)
    tmpV.copy(pivot.position).project(camera);
    mbEcran.x = Math.round((tmpV.x * 0.5 + 0.5) * 1000) / 1000; mbEcran.y = Math.round((0.5 - tmpV.y * 0.5) * 1000) / 1000;
    const dist = camera.position.distanceTo(pivot.position);
    mbEcran.r = Math.round(ech * 0.55 / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * dist) * 1000) / 1000;
    return wSol;
  }

  /* ---------------- la boucle */
  let figeT = null;
  function image(now) {
    raf = requestAnimationFrame(image);
    if (Q.redim) { Q.redim = false; dimensionner(); }
    const dtBrut = dernier ? Math.min(0.1, (now - dernier) / 1000) : 1 / 60;
    dernier = now;
    const dt = bride() ? 1 / window.__bride : dtBrut;
    mesures.push(dtBrut * 1000); if (mesures.length > 40) mesures.shift();
    if (adaptation && !bride()) adapter(now);
    temps += dt;
    const t = temps;
    U.uTemps.value = t;
    // la position : un léger amorti contre les à-coups (la page lisse déjà)
    sLisse = amortir(sLisse, sCible, reduit ? 7 : 10, dt);
    if (Math.abs(sLisse - sCible) < 1e-4) sLisse = sCible;
    const ds = (sLisse - sPrec) / Math.max(dt, 1e-3); sPrec = sLisse;
    vitesse = amortir(vitesse, Math.min(2, Math.abs(ds) * 1.2), 5, dt);
    const s = sLisse;
    // l'ouverture
    if (ouvertureCommencee) {
      if (figerOuverture != null) tOuv = figerOuverture; else tOuv += dt * accel / DUREE;
      if (feux < 5 && tOuv >= tFeu) {
        const seuils = [0.8, 0.8, 0.85, 0.93, 1];
        const lot = feux < 3 ? pretes.premier : feux < 4 ? pretes.decor : pretes.matieres;
        if ((lot && chargeCourante >= seuils[feux] - 1e-6) || tOuv > 14) { feux++; tFeu = tOuv + 0.5; if (feux === 5) tTous = tOuv; }
      }
      if (feux === 5 && tEteint < 0 && tOuv >= tTous + 0.8) tEteint = tOuv;
      if (tEteint > 0 && !finie && tOuv >= tEteint + 0.45) { finie = true; accel = 1; finir(); }
      if (figerOuverture != null) {
        // ouverture figée (outils) : l'état des feux suit le temps demandé
        feux = Math.max(0, Math.min(5, Math.floor((tOuv - 0.6) / 0.5) + 1));
        tEteint = tOuv >= 0.6 + 4 * 0.5 + 0.8 ? 0.6 + 4 * 0.5 + 0.8 : -1;
      }
    }
    const allumes = tEteint > 0 ? 0 : feux;
    decor.feux.forEach((m, i) => { m.uniforms.uOn.value = amortir(m.uniforms.uOn.value, i < allumes ? 1 : 0, i < allumes ? 30 : 18, dt); });
    const depart = tEteint > 0 ? Math.exp(-(tOuv - tEteint) * 1.6) * (tOuv >= tEteint ? 1 : 0) : 0;

    pointeurL.x = amortir(pointeurL.x, pointeur.x, 2.5, dt); pointeurL.y = amortir(pointeurL.y, pointeur.y, 2.5, dt);
    const u = poserCamera(s, t, dt);
    camera.updateMatrixWorld();
    // le coup de départ : un élan du champ de vision
    const fovBase = portrait ? 66 : (largeur / hauteur > 2.1 ? 40 : 46);
    camera.fov = fovBase + (depart * 5 + vitesse * 3) * (reduit ? 0.4 : 1) + cloche(3.82, 3.95, 4.15, 4.3, s) * 6;
    camera.updateProjectionMatrix();
    U.uCam.value.copy(camera.position);
    decor.lampesProches(camera.position.x, camera.position.z, lampes, 1 - U.uTrace.value * 0.9);
    const wSol = poserMB(s, t, u);

    // les matières du MB
    const i0 = Math.floor(borne(s, 0, 8.999)), l0 = s - i0;
    const m0 = MATIERES[i0], m1 = MATIERES[Math.min(8, i0 + 1)];
    const w = plusLisse(0.72, 1.0, l0);
    // l'or arrive avec le flash du podium (8,5)
    const o = plusLisse(8.44, 8.56, s);
    const mx = m0.map((v, k) => melange(melange(v, m1[k], w), k === 4 ? 1 : 0, o));
    if (pretes.matieres) { const cu = mb.matCorps.userData.U; cu.uP1.value.set(mx[0], mx[1], mx[2], mx[3]); cu.uOr.value = mx[4]; cu.uTemps.value = t; cu.uEclat.value = depart * 0.5; }
    else { mb.matCorps.userData.U.uP1.value.set(1, 0, 0, 0); mb.matCorps.userData.U.uOr.value = 0; }
    mb.matLisere.emissiveIntensity = 0.55 + depart * 1.6 + 0.15 * Math.sin(t * 1.6);

    // les lumières du MB
    const camDroite = tmpV.set(1, 0, 0).applyQuaternion(camera.quaternion);
    cle.position.copy(pivot.position).addScaledVector(camDroite, -4).add(tmpV2.set(0, 5, 0)).addScaledVector(camera.getWorldDirection(new V3()), -3);
    cle.target.position.copy(pivot.position);
    contre.position.copy(pivot.position).addScaledVector(camera.getWorldDirection(new V3()), 1.2 + 1.4 * pivot.scale.x).add(tmpV2.set(0, 0.8 * pivot.scale.x, 0));
    // le contre-jour orange ne sert qu'au MB posé sur la ligne (devant la caméra, il faisait un reflet brûlé sur les arêtes)
    contre.intensity = 5 * pivot.scale.x * lisse(0.3, 0.8, wSol);
    contreF.position.copy(pivot.position).addScaledVector(camera.getWorldDirection(new V3()), 4).addScaledVector(camDroite, 3).add(tmpV2.set(0, 2.5, 0));
    contreF.target.position.copy(pivot.position);
    contre.distance = 6 * pivot.scale.x + 4;
    const L0 = lampes[0];
    proche.position.set(L0.x, L0.y, L0.z); proche.intensity = 900 * (L0.w / 3.5);

    // l'onde au sol quand il se pose (1,8 s) et au départ
    const tPose = 1.6;
    const eP = tOuv > tPose ? borne((tOuv - tPose) / 1.2) : 0, eD = tEteint > 0 ? borne((tOuv - tEteint) / 1.4) : 0;
    const eo = eD > 0 ? eD : eP;
    onde.position.set(ligne.x - ligne.t[0] * 0.6, 0.05, ligne.z - ligne.t[1] * 0.6);
    onde.scale.setScalar(2 + eo * (eD > 0 ? 14 : 6));
    onde.material.uniforms.uT.value = eo; onde.material.uniforms.uF.value = (eo > 0 && eo < 1 ? 1 : 0) * wSol * (reduit ? 0.6 : 1);
    onde.visible = onde.material.uniforms.uF.value > 0;

    // les passages
    const tunnel = cloche(3.78, 3.92, 4.18, 4.32, s);
    U.uOrangeTunnel.value = tunnel;
    FU.uTunnel.value = tunnel * 0.8;
    FU.uVisiere.value = s > 5.8 && s < 6.2 ? (s - 5.82) / 0.36 : -1;
    flash = cloche(8.47, 8.52, 8.53, 8.63, s) * (reduit ? 0.6 : 1);
    FU.uFlash.value = flash * 0.72;
    ciel.mat.uniforms.uFlash.value = flash;
    const trace = plusLisse(8.62, 8.95, s);
    U.uTrace.value = trace;
    ruban.mat.uniforms.uDessin.value = plusLisse(8.66, 9.0, s);
    FU.uVitesse.value = Math.min(1.2, vitesse * 1.4 + depart * 0.8 + tunnel * 0.35) * (1 - trace);
    FU.uTemps.value = t;
    FU.uVignette.value = 1;
    decor.matL.uniforms.uVitesse.value = Math.min(1.3, vitesse * 1.5 + depart * 1.2 + tunnel * 0.5) * (reduit ? 0.5 : 1) * (1 - trace);
    avancee += dt * (0.25 + vitesse * 1.5 + depart * 2 + tunnel) * (reduit ? 0.5 : 1);
    decor.matL.uniforms.uAvance.value = avancee;
    // le drapeau se hisse pour l'arrivée
    const hisse = plusLisse(7.9, 8.4, s);
    decor.drapeau.visible = hisse > 0.01 && pretes.decor;
    decor.drapeau.userData.tissu.position.y = melange(1.8, 8.8, hisse);
    // les photos se chargent à l'approche
    if (!decor.photosDemandees && (s > 1.4 || (finie && tOuv > tEteint + 6))) decor.chargerPhotos();
    // les poussières : la part du palier
    partVue = amortir(partVue, partCible, 1.5, dt);
    decor.matP.uniforms.uPart.value = partVue;
    decor.matP.uniforms.uTaille.value = dpr * 1.6 * (hauteur / 900);
    U.uNuit.value = 1;

    composer.render(dt);
  }

  /* ---------------- la qualité adaptative (comme Kazura v20) */
  function appliquerPalier(n) {
    n = Math.max(0, Math.min(PALIER_MAX, n));
    const P = PALIERS[n];
    Q.n = n; Q.depuis = performance.now(); Q.bas = 0; Q.fen.length = 0;
    Q.historique.push([Math.round(temps * 10) / 10, n]); if (Q.historique.length > 40) Q.historique.shift();
    const d = Math.max(Math.min(PLANCHER, dprBase), dprBase * P.r);
    partCible = P.part;
    U.uNbL.value = P.lampes;
    if (Math.abs(d - dpr) > 1e-3 || P.halo !== qHalo) { dpr = d; qHalo = P.halo; Q.redim = true; }
  }
  function adapter(now) {
    const brut = Q.brut ? now - Q.brut : 0;
    Q.brut = now;
    if (!brut || brut > 10000 || document.hidden || compilations.size || !pretes.premier) { Q.fen.length = 0; return; }
    if (!Q.t0) Q.t0 = now;
    if (decor.charges !== Q.charges) { Q.charges = decor.charges; Q.fen.length = 0; Q.ignorer = 2; Q.ignorerT = now + 400; return; }
    if (Q.ignorer > 0 || now < (Q.ignorerT || 0)) { Q.ignorer = Math.max(0, (Q.ignorer || 0) - 1); return; }
    Q.fen.push(now, brut);
    while (Q.fen.length > 2 && now - Q.fen[0] > 9000) Q.fen.splice(0, 2);
    if (now - Q.t0 < 4000 || now < Q.prochain) return;
    let n = 0, somme = 0, n8 = 0, somme8 = 0; const court = [];
    for (let i = 0; i < Q.fen.length; i += 2) { somme8 += Q.fen[i + 1]; n8++; if (now - Q.fen[i] <= 1500) { somme += Q.fen[i + 1]; n++; court.push(Q.fen[i + 1]); } }
    if (n < 3 && Q.fen.length >= 6) { n = 0; somme = 0; court.length = 0; for (let i = Q.fen.length - 6; i < Q.fen.length; i += 2) { somme += Q.fen[i + 1]; n++; court.push(Q.fen[i + 1]); } }
    if (somme < 1200 || n < 3) return;
    const ips = 1000 * n / somme;
    court.sort((a, b) => a - b);
    const p10 = court[Math.floor(court.length * 0.1)];
    if (p10 > 6 && p10 < Q.vMin * 0.97) Q.vMin = Math.max(6.5, p10);
    const hz = 1000 / Q.vMin;
    const cibleDefaut = Math.min(mobile ? 30 : 50, 0.85 * hz);
    if (ips >= 0.92 * hz) Q.cible = 0;
    const cibleIps = Q.cible || cibleDefaut;
    Q.ips = Math.round(ips * 10) / 10;
    const m0 = Q.mem[Q.n];
    Q.mem[Q.n] = { v: m0 && now - m0.t < 30000 ? m0.v * 0.6 + ips * 0.4 : ips, t: now };
    const memo = (k) => (Q.mem[k] && now - Q.mem[k].t < 30000 ? Q.mem[k].v : null);
    if (Q.essai) {
      const e = Q.essai; Q.essai = null;
      if (ips >= cibleIps || ips >= e.ips * 0.92) { if (ips < cibleIps) Q.cible = Math.max(12, Math.min(cibleDefaut, ips * 0.8)); Q.recul = 8000; Q.prochain = now + 1500; return; }
      Q.attenteMontee = now + Q.recul; Q.recul = Math.min(64000, Q.recul * 2);
      appliquerPalier(Q.n + 1); Q.prochain = now + 1500; Q.bonDepuis = 0; return;
    }
    Q.bas = ips < cibleIps ? (Q.bas || 0) + 1 : 0;
    if (ips < cibleIps && (Q.bas >= 2 || ips < cibleIps * 0.6)) {
      Q.bonDepuis = 0;
      if (Q.n < PALIER_MAX) {
        const dessous = memo(Q.n + 1), ici = memo(Q.n);
        if (dessous != null && ici != null && dessous < ici * 1.08) { Q.cible = Math.max(12, Math.min(cibleIps, ips * 0.8)); Q.prochain = now + 1500; return; }
        if (!Q.descente) Q.descente = { de: Q.n, ips, pas: 0 };
        else if (++Q.descente.pas >= 2 && ips < Q.descente.ips * 1.08) { Q.cible = Math.max(12, Math.min(cibleIps, ips * 0.8)); appliquerPalier(Q.descente.de); Q.descente = null; Q.prochain = now + 1500; return; }
        appliquerPalier(Q.n + 1); Q.prochain = now + 1500; return;
      }
    } else if (ips >= cibleIps) Q.descente = null;
    // le repli 2D : au palier le plus bas, sous 12 i/s pendant 8 s, après l'ouverture, une fois tout compilé
    const ips8 = somme8 ? 1000 * n8 / somme8 : 99;
    if (Q.n === PALIER_MAX && ips8 < 12 && Q.fen.length > 2 && now - Q.fen[0] > 7500 && finie && Object.values(pretes).every(Boolean) && facade && facade.replier && !Q.replie) { Q.replie = true; facade.replier(); return; }
    if (Q.n > 0 && now >= Q.attenteMontee) {
      if (ips >= 0.92 * hz) { if (!Q.bonDepuis) Q.bonDepuis = now; } else Q.bonDepuis = 0;
      const tenu = Q.bonDepuis && now - Q.bonDepuis > 5000;
      const dessus = memo(Q.n - 1), ici = memo(Q.n);
      const stagne = ips < cibleDefaut && now - Q.depuis > 8000 && !(dessus != null && ici != null && ici > dessus * 1.12);
      if (tenu || stagne) { Q.essai = { t: now, ips }; Q.bonDepuis = 0; Q.descente = null; appliquerPalier(Q.n - 1); Q.prochain = now + 1200; }
    } else Q.bonDepuis = 0;
  }

  /* ---------------- la compilation par lots
     1. ce que montre l'ouverture (ciel, sol, piste, portique, projecteurs, MB en carbone, passes), puis `pret` ;
     2. le reste par petits lots entre les images, pendant que les feux s'allument : les panneaux et écrans,
        le tunnel, le drapeau, les lignes de vitesse ; puis les matières du MB. Les feux 4 et 5 attendent ces lots :
        ils s'allument au rythme du VRAI chargement. */
  const compilations = new Set();
  const suivreCompil = (p) => { compilations.add(p); const fin = () => compilations.delete(p); p.then(fin, fin); return p; };
  function doublures(racines) {
    const sc = new THREE.Scene();
    const ajouter = (o) => { if (o.isMesh || o.isPoints || o.isLine || o.isSprite) { const d = o.clone(false); d.visible = true; d.frustumCulled = false; sc.add(d); } for (const c of o.children) ajouter(c); };
    for (const r of racines) ajouter(r);
    return sc;
  }
  function scenePasses() {
    const sc = new THREE.Scene(), g = new THREE.PlaneGeometry(2, 2), vus = new Set();
    for (const pass of composer.passes) for (const v of Object.values(pass)) for (const m of Array.isArray(v) ? v : [v]) if (m && m.isMaterial && !vus.has(m)) { vus.add(m); const q = new THREE.Mesh(g, m); q.frustumCulled = false; sc.add(q); }
    return sc;
  }
  function compiler(racines, extra = []) {
    let p;
    renderer.setRenderTarget(composer.readBuffer);
    try { p = suivreCompil(Promise.all([doublures(racines), ...extra].map((sc) => renderer.compileAsync(sc, camera, scene)))); } catch { p = Promise.resolve(); }
    renderer.setRenderTarget(null);
    return p.catch(() => {});
  }
  // une doublure de panneau (même programme que tous les écrans) pour le lot du décor
  const ecranTemoin = (() => { const sc = new THREE.Scene(); const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), decor.portique.children.find((c) => c.material && c.material.uniforms && c.material.uniforms.uCarte).material); m.frustumCulled = false; sc.add(m); return sc; })();
  const lotDecor = [decor.chiffres, decor.ecrans, decor.pubs, decor.arches, decor.drapeau, decor.lignes];
  const demarrer = async () => {
    const t0 = performance.now();
    // le MB de l'ouverture : la matière du corps telle quelle (carbone) ; elle est la même programme ensuite
    const pP = suivreCompil(renderer.compileAsync(scenePasses(), camera, scene)).catch(() => {});
    await compiler([ciel.mesh, sol.mesh, ruban.mesh, ...decor.groupe.children.filter((c) => !lotDecor.includes(c)), pivot, ombre, onde]);
    await pP;
    window.__mbCompil1 = Math.round(performance.now() - t0);
    if (detruit) return;
    chargeCourante = 0.85; avance(0.85);
    for (const o of lotDecor) o.visible = false;
    pretes.premier = true;
    composer.render(0.016);
    await attendreImage();
    if (detruit) return;
    ouvertureCommencee = true;
    if (sCible >= 0.6) accel = 4;
    sDepart = sCible;
    resoudrePret();
    const lots = [[lotDecor, 'decor', [ecranTemoin]], [[pivot], 'matieres']];
    for (const [racines, nom, extra] of lots) {
      await attendreImage(); await attendreImage();
      if (detruit) return;
      const t = performance.now();
      await compiler(racines, extra);
      if (nom === 'decor') for (const o of lotDecor) o.visible = o !== decor.drapeau;
      pretes[nom] = true;
      chargeCourante = nom === 'decor' ? 0.93 : 1;
      (window.__mbCompil2 ||= {})[nom] = Math.round(performance.now() - t);
    }
  };
  if (window.__mbDebug) window.__mbDbg = { scene, U, FU, halo, finition, composer, decor, mb, pivot, onde, ombre, ruban, sol, ciel, camera };
  raf = requestAnimationFrame(image);
  demarrer();

  const clairEn = () => (flash > 0.5 ? 1 : 0);
  return {
    pret, ouvertureFinie, repli: false,
    progression(p, id, locale) {
      const i = ids.indexOf(id);
      const l = locale == null || Number.isNaN(Number(locale)) ? 0.5 : borne(Number(locale));
      sCible = i >= 0 ? i + l : borne(Number(p) || 0) * SECTIONS.length;
      sCible = borne(sCible, 0, 9);
      section = SECTIONS[Math.min(8, Math.floor(sCible))];
      if (!recu) { recu = true; sLisse = sCible; sPrec = sCible; }
      if (sDepart != null && Math.abs(sCible - sDepart) > 0.08) { dernierGeste = performance.now(); accelerer(); }
    },
    definirPhotos: (l) => decor.definirPhotos(l),
    definirPartenaires: (l) => decor.definirPartenaires(l),
    definirChiffres: (l) => decor.definirChiffres(l),
    passer() { if (performance.now() - dernierGeste < 1500) accelerer(); },
    clairEn,
    etat() {
      const moy = mesures.length ? mesures.reduce((a, b) => a + b, 0) / mesures.length : 0;
      const clair = Math.round(Math.min(1, flash * 1.05) * 100) / 100;
      return { section, s: Math.round(sLisse * 1000) / 1000, clair, fond: clair > 0.5 ? 'clair' : 'sombre', mb: { ...mbEcran }, fps: moy ? Math.round(1000 / moy) : 0, feux: tEteint > 0 ? 0 : feux, depart: finie, palier: Q.n, qualite: Math.round((1 - Q.n / PALIER_MAX) * 100) / 100 };
    },
    pause() { if (enPause || detruit) return; enPause = true; cancelAnimationFrame(raf); },
    reprendre() { if (!enPause || detruit) return; enPause = false; dernier = 0; Q.brut = 0; raf = requestAnimationFrame(image); },
    get enPause() { return enPause; },
    stats() {
      const moy = mesures.length ? mesures.reduce((a, b) => a + b, 0) / mesures.length : 0;
      return { ips: moy ? Math.round(1000 / moy) : 0, ms: Math.round(moy * 10) / 10, dpr: Math.round(dpr * 100) / 100, palier: Q.n, ipsMesure: Q.ips || 0, paliers: Q.historique.slice(), ouverture: Math.round(tOuv * 100) / 100, feux, s: Math.round(sLisse * 1000) / 1000, section, pretes: { ...pretes }, appels: renderer.info.render.calls, triangles: renderer.info.render.triangles, programmes: renderer.info.programs ? renderer.info.programs.length : 0, compil1: window.__mbCompil1, compil2: window.__mbCompil2 };
    },
    _figer(t) { figerOuverture = t; },
    _debug() { return { cam: camera.position.toArray(), vise: camVise.toArray(), fov: camera.fov, near: camera.near, mb: pivot.position.toArray(), ech: pivot.scale.x, q: pivot.quaternion.toArray(), vitesse, tOuv, feux, tEteint, flash, visiere: FU.uVisiere.value, vit: FU.uVitesse.value }; },
    _sauter() { sLisse = sCible; sPrec = sCible; vitesse = 0; },
    _qualite(n) { if (n == null) { adaptation = true; return Q.n; } adaptation = false; appliquerPalier(Number(n) || 0); partVue = partCible; return Q.n; },
    detruire() {
      detruit = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('pointermove', surPointeur);
      window.removeEventListener('deviceorientation', surOrientation);
      window.removeEventListener('wheel', geste);
      window.removeEventListener('touchstart', geste);
      window.removeEventListener('keydown', geste);
      window.removeEventListener('pointerdown', surBas);
      document.removeEventListener('visibilitychange', surVisibilite);
      finir(); resoudrePret();
      Promise.allSettled([...compilations]).then(() => {
        scene.traverse((o) => {
          if (o.geometry) o.geometry.dispose();
          const m = o.material; if (m) (Array.isArray(m) ? m : [m]).forEach((x) => { if (x.uniforms) for (const v of Object.values(x.uniforms)) if (v && v.value && v.value.isTexture) v.value.dispose(); x.dispose(); });
        });
        envRT.dispose(); cible.dispose(); composer.dispose?.(); renderer.dispose();
      });
    },
  };
}
