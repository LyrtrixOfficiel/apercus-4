// Kazura v15 : « Le domaine Kazura », le moteur 3D de la page d'expérience (experiences/domaine/index.html).
// v15 : plus fluide à visuel égal. La bouteille et la grappe ont deux niveaux de détail ; les copies d'écran de la
// bouteille ne couvrent que sa zone ; la grappe et le tonneau ne sont dessinés que dans le champ ; la qualité
// adaptative juge plus vite (45 images) et saute deux crans si la cadence est très basse.
// Un domaine viticole alsacien imaginaire au pied d'un château de grès rose. Ce n'est plus un film qui tourne seul :
// c'est le défilement de la page qui mène la caméra de lieu en lieu (scene/recit3d.js), et l'heure suit le récit
// tant que le visiteur ne la prend pas en main. Les gestes de la v13 sont gardés : la main écarte les herbes et les
// fleurs, un toucher fait partir des pétales (des lucioles la nuit) ; au chapitre de la bouteille, glisser la fait
// tourner.
//
// API : const m = monter(el, { reduit, mobile, fixe, forcerRepli, surImage })
//   m.pret        promesse : { etat: 'vivant' } (première image dessinée) ou { etat: 'repli', raison }
//   m.cible(s)    la position du récit voulue par la page (0 à 7) ; la caméra la rejoint en douceur
//   m.aller(s)    saut immédiat (captures)
//   m.heureMain(h) l'heure prise en main (0 jour, 1 nuit) ; m.heureMain(null) la rend au récit
//   m.detruire()
//   surImage({ s, h, hRecit, main, chapitre, ancres }) est appelé à chaque image (ancres : id -> { x, y, v }).
// three.js 0.170.0 depuis jsdelivr (+esm). Le rendu s'arrête quand l'onglet est caché.

import { creerUniformesCommuns } from './scene/commun.js';
import { creerHeure, direction } from './scene/heure.js';
import { creerSol, creerLointain, creerMontagne } from './scene/terrain.js';
import { creerCiel } from './scene/ciel.js';
import { creerVigne } from './scene/vigne.js';
import { creerHerbe } from './scene/herbe.js';
import { creerForet, creerPetitsArbres } from './scene/arbres.js';
import { creerChateau } from './scene/chateau.js';
import { creerVillage } from './scene/village.js';
import { creerLiane, creerLucioles, creerGerbes } from './scene/magie.js';
import { creerGrappe } from './scene/grappe.js';
import { creerBouteille, BOUTEILLE } from './scene/bouteille.js';
import { creerCameraRecit, creerSuivi, heureRecit, ANCRES, NB, PART_POSE } from './scene/recit3d.js';
import { creerChaine } from './scene/post.js';

const VERSION_THREE = '0.170.0';
const CDN = `https://cdn.jsdelivr.net/npm/three@${VERSION_THREE}`;
const BASE = new URL('.', import.meta.url).href;
export const CHAPITRE_BOUTEILLE = 5;

export function webgl2() {
  try { const c = document.createElement('canvas'); return !!c.getContext('webgl2'); } catch { return false; }
}

function chargerTextures(THREE, mobile) {
  const L = new THREE.TextureLoader();
  const un = (nom, { srgb = true, repeter = false } = {}) => new Promise((ok, ko) => {
    L.load(`${BASE}tex/${nom}`, (t) => {
      if (srgb) t.colorSpace = THREE.SRGBColorSpace;
      if (repeter) t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.anisotropy = mobile ? 2 : 8;
      ok(t);
    }, undefined, ko);
  });
  return Promise.all([un('vigne.webp'), un('arbres.webp'), un('herbe.webp', { repeter: true }), un('canopee.webp', { repeter: true }), un('ecorce.webp', { repeter: true })])
    .then(([vigne, arbres, herbe, canopee, ecorce]) => ({ vigne, arbres, herbe, canopee, ecorce }));
}

/** Toujours « highp » dans les deux étapes (les puces Adreno refusent un même uniform en deux précisions). */
function highp(m) {
  if (!m?.isShaderMaterial || m.userData.highp) return;
  m.vertexShader = 'precision highp float;\n' + m.vertexShader;
  m.fragmentShader = 'precision highp float;\n' + m.fragmentShader;
  m.userData.highp = true;
}

export function monter(el, opts = {}) {
  const reduit = opts.reduit ?? matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile = opts.mobile ?? (matchMedia('(pointer: coarse)').matches || innerWidth < 760);
  const fixe = !!opts.fixe;
  const surImage = opts.surImage || (() => {});

  const toile = document.createElement('canvas');
  toile.className = 'dk-toile';
  toile.setAttribute('aria-hidden', 'true');
  el.appendChild(toile);

  let detruit = false, raf = 0, moteur = null, dernier = 0;
  const nettoyages = [];
  const ecoute = (cible, type, f, o) => { cible.addEventListener(type, f, o); nettoyages.push(() => cible.removeEventListener(type, f, o)); };

  /* le récit et l'heure */
  const R = { cible: 0, vue: 0 };
  const suivi = creerSuivi({ reduit });   // v20 : amortissement critique, vitesse et accélération perçues plafonnées
  const H = { main: null, vue: heureRecit(0), chapitreMain: -1 };
  const chapitreDe = (s) => Math.min(NB - 1, Math.floor(Math.max(0, s) + (1 - PART_POSE) * 0.5));

  let pretOk; const pret = new Promise((r) => (pretOk = r));
  function repli(raison) {
    if (moteur?.repli) return;
    moteur = { repli: true };
    try { toile.remove(); } catch {}
    pretOk({ etat: 'repli', raison });
  }

  async function demarrer() {
    if (opts.forcerRepli || !webgl2()) { repli('WebGL 2 absent'); return; }
    try {
      const THREE = await import(`${CDN}/+esm`);
      if (detruit) return;
      const textures = await chargerTextures(THREE, mobile);
      if (detruit) return;
      moteur = await construire(THREE, textures);
      if (detruit) { moteur.detruire(); return; }
      relancer();
    } catch (e) {
      console.warn('Domaine : la 3D ne peut pas démarrer ici', e);
      repli('erreur');
    }
  }

  function relancer() {
    const doit = !document.hidden && !detruit && moteur && !moteur.repli && moteur.image;
    if (doit && !raf) { dernier = 0; raf = requestAnimationFrame(boucle); }
    if (!doit && raf) { cancelAnimationFrame(raf); raf = 0; }
  }
  ecoute(document, 'visibilitychange', relancer);

  async function construire(THREE, tex) {
    const renderer = new THREE.WebGLRenderer({ canvas: toile, antialias: false, alpha: false, powerPreference: 'high-performance', stencil: false, precision: 'highp' });
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.setClearColor(0x000000, 1);

    const U = creerUniformesCommuns(THREE);
    const heure = creerHeure(THREE);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 16 / 9, 0.05, 6000);
    const o = { mobile, reduit };

    const ciel = creerCiel(THREE, U, o);
    direction(THREE, -32, 38, ciel.uniformes.uLune.value);
    const sol = creerSol(THREE, U, tex, o);
    const lointain = creerLointain(THREE, U);
    const montagne = creerMontagne(THREE, U, tex, o);   // v20 : la montagne boisée derrière le château (photo de référence)
    const foret = creerForet(THREE, U, tex, o);
    const petitsArbres = creerPetitsArbres(THREE, U, tex, o);
    const vigne = creerVigne(THREE, U, tex, o);
    const herbe = creerHerbe(THREE, U, o);
    const chateau = creerChateau(THREE, U, o);
    const village = creerVillage(THREE, U, o);   // v21 : le village au loin, sur le flanc droit (photo de référence)
    const liane = creerLiane(THREE, U, o);
    const lucioles = creerLucioles(THREE, U, o);
    const gerbes = creerGerbes(THREE, U, o);
    const grappe = creerGrappe(THREE, U, tex, o);
    const partage = { tFond: { value: null } };
    const bouteille = creerBouteille(THREE, U, ciel, partage, o);
    scene.add(ciel.objet, lointain, montagne, village, sol, foret, petitsArbres, chateau, vigne.objet, herbe.objet, grappe.objet, bouteille.opaque, liane.objet, lucioles.objet, gerbes.objet);

    const chaine = creerChaine(THREE, renderer, o);
    partage.tFond.value = chaine.rtFond.texture;
    U.uA2C.value = chaine.Q.msaa > 0 ? 1 : 0;
    const cam = creerCameraRecit(THREE, o);

    for (const sc of [scene, ...bouteille.passes.map((p) => p.scene)]) sc.traverse((ob) => { const m = ob.material; if (m) for (const mm of Array.isArray(m) ? m : [m]) highp(mm); });
    for (const m of chaine.materiaux) highp(m);

    // les objets de la scène, nommés pour les outils de mesure (_inventaire, _cacher)
    const objetsMesure = () => {
      const o = { ciel: ciel.objet, lointain, montagne, village, sol, foret, petitsArbres, chateau, vigne: vigne.objet, herbe: herbe.objet, grappe: grappe.objet, tonneau: bouteille.opaque, liane: liane.objet, lucioles: lucioles.objet, gerbes: gerbes.objet };
      bouteille.passes.forEach((p, i) => { o['passe' + i] = p.scene; });
      return o;
    };

    /* les ancres de la page */
    const T = herbe.tetes;
    const tete = (i) => [T[i].x, T[i].y + 0.03, T[i].z];
    const ancres = { ...ANCRES, ...grappe.ancres, ...bouteille.ancres, coquelicot: tete(0), marguerite: tete(2), bleuet: tete(3) };
    const idsAncres = Object.keys(ancres);
    const vAncre = new THREE.Vector3();

    /* qualité : densité de pixels, puis effets, puis densité d'herbe, si la cadence tombe */
    const dprMax = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 1.6);
    const NIVEAUX = mobile
      ? [{ dpr: dprMax }, { dpr: Math.min(dprMax, 1.25) }, { dpr: 1 }, { dpr: 0.85, rayons: false }, { dpr: 0.75, herbe: 0.6, rayons: false }]
      : [{ dpr: dprMax }, { dpr: Math.min(dprMax, 1.25) }, { dpr: 1 }, { dpr: 1, dof: false }, { dpr: 0.85, dof: false, rayons: false }, { dpr: 0.75, dof: false, rayons: false, herbe: 0.6 }];
    let niveau = 0;
    const nHerbe = herbe.herbe.geometry.instanceCount;
    function appliquerNiveau() {
      const n = NIVEAUX[niveau];
      chaine.regler({ dof: n.dof !== false && !mobile, rayons: n.rayons !== false });
      herbe.herbe.geometry.instanceCount = Math.round(nHerbe * (n.herbe || 1));
      dimensionner(true);
    }
    let lC = 0, hC = 0, dprC = 0;
    function dimensionner(force = false) {
      const r = el.getBoundingClientRect();
      const l = Math.max(2, Math.round(r.width)), h = Math.max(2, Math.round(r.height));
      const dpr = NIVEAUX[niveau].dpr;
      if (!force && l === lC && h === hC && dpr === dprC) return;
      lC = l; hC = h; dprC = dpr;
      renderer.setPixelRatio(dpr);
      renderer.setSize(l, h, false);
      chaine.taille(l * dpr, h * dpr);
      camera.aspect = l / h;
      camera.updateProjectionMatrix();
      U.uAspect.value = l / h;
    }
    const ro = new ResizeObserver(() => dimensionner());
    ro.observe(el);
    dimensionner(true);

    // compilation des nuanceurs avant la première image
    heure.appliquer(H.vue, U);
    ciel.regler(heure.P, U);
    cam.poser(camera, R.vue, camera.aspect, 0);
    try { await renderer.compileAsync(scene, camera); } catch { /* compilation au premier rendu */ }
    for (const p of bouteille.passes) { try { await renderer.compileAsync(p.scene, camera); } catch {} }

    /* la main : position écran, force, vitesse ; les gerbes au toucher ; la bouteille qu'on fait tourner */
    const main = { x: 0, y: 0, force: 0, cible: 0, bas: null, vx: 0, vy: 0, glisse: false };
    const souris = [0, 0];
    const tour = { angle: 0, vitesse: 0 };
    const ndc = (e) => { const r = toile.getBoundingClientRect(); return [((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1)]; };
    const enBouteille = () => chapitreDe(R.vue) === CHAPITRE_BOUTEILLE;
    ecoute(toile, 'pointerdown', (e) => {
      const [x, y] = ndc(e);
      main.bas = { id: e.pointerId, x0: e.clientX, y0: e.clientY, h0: H.main ?? H.vue, t0: performance.now(), dernierX: e.clientX, tDernier: performance.now() };
      main.glisse = false;
      main.x = x; main.y = y; main.cible = 1;
    });
    ecoute(toile, 'pointermove', (e) => {
      const [x, y] = ndc(e);
      main.vx = x - main.x; main.vy = y - main.y;
      main.x = x; main.y = y;
      if (e.pointerType === 'mouse') { main.cible = 1; souris[0] = x; souris[1] = y; }
      const b = main.bas;
      if (b && b.id === e.pointerId) {
        const dx = e.clientX - b.x0, dy = e.clientY - b.y0;
        if (!main.glisse && Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.2) {
          main.glisse = true; toile.setPointerCapture?.(e.pointerId); el.classList.add('dk-glisse');
        }
        if (main.glisse) {
          if (enBouteille()) {
            const now = performance.now();
            const d = (e.clientX - b.dernierX) / Math.max(200, toile.clientWidth * 0.35) * Math.PI;
            tour.angle += d;
            tour.vitesse = d / Math.max(0.008, (now - b.tDernier) / 1000);
            b.dernierX = e.clientX; b.tDernier = now;
          } else prendreHeure(b.h0 + dx / (toile.clientWidth * 0.85));
        }
      }
    });
    const fin = (e, annule) => {
      const b = main.bas;
      if (b && b.id === e.pointerId) {
        if (!annule && !main.glisse && performance.now() - b.t0 < 500 && Math.hypot(e.clientX - b.x0, e.clientY - b.y0) < 12) toucher();
        main.bas = null;
        el.classList.remove('dk-glisse');
        if (e.pointerType !== 'mouse') main.cible = 0;
      }
    };
    ecoute(toile, 'pointerup', (e) => fin(e, false));
    ecoute(toile, 'pointercancel', (e) => fin(e, true));
    ecoute(toile, 'pointerleave', (e) => { if (e.pointerType === 'mouse' || !main.bas) { main.cible = 0; souris[0] = souris[1] = 0; } });

    const ray = new THREE.Raycaster();
    const vTmp = new THREE.Vector3(), vMat = new THREE.Matrix4();
    const derniereGerbe = new Float32Array(herbe.tetes.length);
    function fleurSousLaMain(rayonNdc, distMax) {
      vMat.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
      const e = vMat.elements, asp = camera.aspect;
      let best = null, bd = rayonNdc;
      for (let i = 0; i < T.length; i++) {
        const f = T[i];
        const w = e[3] * f.x + e[7] * f.y + e[11] * f.z + e[15];
        if (w < 0.3 || w > distMax) continue;
        const x = (e[0] * f.x + e[4] * f.y + e[8] * f.z + e[12]) / w;
        const y = (e[1] * f.x + e[5] * f.y + e[9] * f.z + e[13]) / w;
        const d = Math.hypot((x - main.x) * asp, y - main.y);
        if (d < bd) { bd = d; best = i; }
      }
      return best;
    }
    function toucher() {
      const nuit = H.vue > 0.62 ? 1 : 0;
      const i = fleurSousLaMain(0.09, 18);
      if (i !== null) {
        const f = T[i];
        gerbes.emettre(f.x, f.y, f.z, nuit ? (f.type === 2 ? 4 : f.type) : f.type, reduit ? 10 : 18, nuit);
        derniereGerbe[i] = U.uTemps.value;
      } else {
        ray.setFromCamera({ x: main.x, y: main.y }, camera);
        const d = Math.min(9, ray.ray.direction.y < -0.02 ? (camera.position.y - 0.3) / -ray.ray.direction.y : 4);
        ray.ray.at(Math.max(0.6, d), vTmp);
        gerbes.emettre(vTmp.x, vTmp.y, vTmp.z, nuit ? 3 : (Math.random() < 0.5 ? 0 : 2), reduit ? 10 : 16, nuit);
      }
    }

    /* la boucle */
    let image = 0, figer = false, sansPasses = false, simu = false;
    const caches = new Set();
    let zoneVue = 0;
    // ce qui n'est dessiné que dans le champ, et les niveaux de détail
    const champ = new THREE.Frustum(), mPV = new THREE.Matrix4();
    const sGrappe = new THREE.Sphere(new THREE.Vector3(...grappe.centre), 0.7);
    const sTonneau = new THREE.Sphere(new THREE.Vector3(bouteille.centre[0], bouteille.centre[1] - 0.55, bouteille.centre[2]), 0.8);
    const coins = [];
    for (const x of [0, 1]) for (const y of [0, 1]) for (const z of [0, 1]) coins.push(new THREE.Vector3(bouteille.boite[x][0], bouteille.boite[y][1], bouteille.boite[z][2]));
    const vZ = new THREE.Vector3();
    /** La zone de l'écran (uv) où sont la bouteille et le verre, avec une large marge (réfraction du vin). */
    function zoneBouteille() {
      let x0 = 1, y0 = 1, x1 = 0, y1 = 0;
      for (const c of coins) {
        vZ.copy(c).applyMatrix4(camera.matrixWorldInverse);
        if (vZ.z > -camera.near * 2) return [0, 0, 1, 1];
        vZ.applyMatrix4(camera.projectionMatrix);
        const u = vZ.x * 0.5 + 0.5, v = vZ.y * 0.5 + 0.5;
        x0 = Math.min(x0, u); x1 = Math.max(x1, u); y0 = Math.min(y0, v); y1 = Math.max(y1, v);
      }
      const m = 0.75 * Math.max(x1 - x0, y1 - y0) + 0.03;
      return [Math.max(0, x0 - m), Math.max(0, y0 - m), Math.min(1, x1 + m), Math.min(1, y1 + m)];
    }
    let mesure = { n: 0, somme: 0, depuis: 0 };
    const stats = { ips: 0, niveau: 0, ms: 0 };
    const vD = new THREE.Vector3(), vA = new THREE.Vector3(), vB = new THREE.Vector3();
    const bc = new THREE.Vector3(...bouteille.centre);
    let chapitreVu = 0;

    function image1(dt, maintenant) {
      // le récit : la caméra rejoint la position voulue par la page
      // v20 : amortissement critique dans l'espace de la violence perçue (scene/recit3d.js, creerSuivi)
      if (!figer) R.vue = suivi.avancer(R.cible, dt);
      const ch = chapitreDe(R.vue);
      if (ch !== chapitreVu) { chapitreVu = ch; if (H.main !== null && ch !== H.chapitreMain) H.main = null; }
      const hR = heureRecit(R.vue);
      const hCible = H.main ?? hR;
      if (figer) H.vue = hCible;
      else H.vue += (hCible - H.vue) * (1 - Math.exp(-dt * (main.glisse || H.tire ? 9 : 2.4)));
      U.uTemps.value += figer ? 0 : dt;
      const P = heure.appliquer(H.vue, U);
      ciel.regler(P, U);
      lucioles.uniformes.uLucioles.value = P.lucioles;
      bouteille.regler(P, U.uNuit.value);

      main.force += (main.cible - main.force) * (1 - Math.exp(-dt * (main.cible > main.force ? 10 : 3)));
      U.uMain.value.set(main.x, main.y, main.force * (reduit ? 0.7 : 1));

      const e = cam.poser(camera, R.vue, camera.aspect, U.uTemps.value, mobile ? [0, 0] : souris);
      camera.updateMatrixWorld();
      U.uBrumeDensite.value = P.densite * e.brume;
      P.expo *= e.expo;
      camera.getWorldDirection(vA); vA.y = 0; vA.normalize();
      vD.set(-vA.z, 0, vA.x);
      U.uCamDroite.value.copy(vD); U.uCamAvant.value.copy(vA);
      const px = (hC_px() / (2 * Math.tan((camera.fov * Math.PI) / 360)));
      lucioles.uniformes.uPx.value = px; gerbes.uniformes.uPx.value = px; liane.points.uniforms.uPx.value = px;

      // la bouteille : l'étiquette face à la caméra au milieu du chapitre, le défilement et la main la font tourner
      if (!main.glisse) { tour.angle += tour.vitesse * dt; tour.vitesse *= Math.exp(-dt * 2.2); }
      const az = Math.atan2(camera.position.x - bc.x, camera.position.z - bc.z);
      bouteille.tourner(az + (R.vue - (CHAPITRE_BOUTEILLE + PART_POSE * 0.5)) * 1.1 + tour.angle);
      grappe.animer(U.uTemps.value, P.vent);

      // les fleurs effleurées lâchent leurs pétales
      if (main.force > 0.3 && (Math.abs(main.vx) + Math.abs(main.vy)) > 0.004 && image % 2 === 0) {
        const i = fleurSousLaMain(0.05, 12);
        if (i !== null && U.uTemps.value - derniereGerbe[i] > 1.2) {
          derniereGerbe[i] = U.uTemps.value;
          const f = T[i];
          const nuit = H.vue > 0.62 ? 1 : 0;
          gerbes.emettre(f.x, f.y, f.z, nuit ? (f.type === 2 ? 4 : f.type) : f.type, reduit ? 3 : 5, nuit);
        }
      }
      main.vx *= 0.5; main.vy *= 0.5;
      gerbes.animer(figer ? 0 : dt, P.vent * 1.2, U.uTemps.value);

      // la bouteille n'est dessinée (passes transparentes) que si elle est dans le champ
      vB.copy(bc).applyMatrix4(camera.matrixWorldInverse);
      const dB = -vB.z;
      vAncre.copy(bc).project(camera);
      const bouteilleVue = dB > 0.05 && dB < 40 && Math.abs(vAncre.x) < 1.3 && Math.abs(vAncre.y) < 1.4;
      // sa taille à l'écran (pixels de l'image) choisit le niveau de détail ; la zone limite les copies
      let zone = null;
      zoneVue = 0;
      if (bouteilleVue) {
        const hB = bouteille.hauteur / dB / (2 * Math.tan((camera.fov * Math.PI) / 360)) * hC_px();
        if (hB > 170) bouteille.detail(true); else if (hB < 150) bouteille.detail(false);
        zone = zoneBouteille();
        zoneVue = (zone[2] - zone[0]) * (zone[3] - zone[1]);
        const tx = chaine.texel();
        bouteille.zone(zone[0], zone[1], zone[2], zone[3], tx[0], tx[1]);
      } else bouteille.detail(false);
      // la grappe et le tonneau ne sont dessinés que dans le champ ; la grappe s'allège au-delà de 2,4 m
      mPV.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
      champ.setFromProjectionMatrix(mPV);
      grappe.objet.visible = !caches.has('grappe') && champ.intersectsSphere(sGrappe);
      grappe.detail(camera.position.distanceTo(sGrappe.center) < 2.4);
      bouteille.opaque.visible = !caches.has('tonneau') && champ.intersectsSphere(sTonneau);

      if (!simu) chaine.rendre({ scene, camera, P, focus: e.focus, ouv: e.ouv, fondu: 1, temps: U.uTemps.value, passes: bouteilleVue && !sansPasses ? bouteille.passes : null, zone, soleilDir: P.h > 0.66 ? ciel.uniformes.uLune.value : P.soleil });
      image++;
      if (image === 2) pretOk({ etat: 'vivant' });

      // les ancres projetées pour la page
      const out = {};
      for (const id of idsAncres) {
        const a = ancres[id];
        vAncre.set(a[0], a[1], a[2]).applyMatrix4(camera.matrixWorldInverse);
        const devant = vAncre.z < -0.02;
        vAncre.set(a[0], a[1], a[2]).project(camera);
        out[id] = { x: (vAncre.x * 0.5 + 0.5) * lC, y: (0.5 - vAncre.y * 0.5) * hC, v: devant && Math.abs(vAncre.x) < 1.05 && Math.abs(vAncre.y) < 1.05 };
      }
      surImage({ s: R.vue, h: H.vue, hRecit: hR, main: H.main !== null, chapitre: ch, voyage: e.voyage, ancres: out, cam: [camera.position.x, camera.position.y, camera.position.z] });
    }
    const hC_px = () => hC * dprC;

    // la qualité adaptative : 2,5 s pour s'installer, puis un jugement toutes les 45 images ; sous 45 i/s on descend
    // d'un cran, sous 28 i/s de deux (un téléphone lent trouve son niveau en quelques secondes, pas en vingt)
    let attenteMesure = 2500;
    function mesurer(dt, maintenant) {
      if (fixe || figer) return;
      if (maintenant - mesure.depuis < attenteMesure) { if (!mesure.depuis) mesure.depuis = maintenant; return; }
      mesure.n++; mesure.somme += dt;
      if (mesure.n >= 45) {
        const moy = mesure.somme / mesure.n;
        stats.ips = Math.round(1 / moy); stats.ms = Math.round(moy * 1000 * 10) / 10;
        if (moy > 1 / 45 && niveau < NIVEAUX.length - 1) {
          niveau = Math.min(NIVEAUX.length - 1, niveau + (moy > 1 / 28 ? 2 : 1));
          stats.niveau = niveau; appliquerNiveau(); mesure.depuis = maintenant; attenteMesure = 1200;
        }
        mesure.n = 0; mesure.somme = 0;
      }
    }

    function detruireMoteur() {
      ro.disconnect();
      for (const sc of [scene, ...bouteille.passes.map((p) => p.scene)]) sc.traverse((ob) => {
        ob.geometry?.dispose?.();
        const m = ob.material;
        if (m) for (const mm of Array.isArray(m) ? m : [m]) mm.dispose();
      });
      bouteille.detruire();
      grappe.detruire();
      for (const t of Object.values(tex)) t.dispose();
      chaine.detruire();
      renderer.dispose();
      try { renderer.forceContextLoss(); } catch {}
    }
    ecoute(toile, 'webglcontextlost', (ev) => { ev.preventDefault(); detruireMoteur(); repli('contexte WebGL perdu'); });

    return {
      image: image1, mesurer, detruire: detruireMoteur, stats,
      _figer(f) { figer = !!f; },
      // mesure de la caméra (outils/camera.mjs) : la page veut successivement les positions « cibles », une image de
      // dt secondes chacune, sans dessin ; renvoie position, quaternion et champ de la caméra à chaque image
      _simuler(cibles, dt = 1 / 60, depart = null) {
        simu = true;
        if (depart !== null) { R.cible = R.vue = depart; suivi.aller(depart); }
        const out = [];
        try {
          for (const c of cibles) {
            R.cible = c; image1(dt, 0);
            out.push([camera.position.x, camera.position.y, camera.position.z, camera.quaternion.x, camera.quaternion.y, camera.quaternion.z, camera.quaternion.w, camera.fov, R.vue]);
          }
        } finally { simu = false; }
        return out;
      },
      _niveau(n) { niveau = n; appliquerNiveau(); },
      _gpu() { return null; },
      // mesure (outils/chrono.mjs) : n images d'affilée, chacune attendue jusqu'au bout (lecture d'un pixel),
      // temps médian et 90e centile en ms, appels de dessin et triangles de la dernière image
      _profil(lire) { if (lire) return chaine.profil.lire(); chaine.profil.demarrer(); return chaine.profil.dispo; },
      _cacher(nom, cache) {
        if (nom === 'passes') { sansPasses = !!cache; return true; }
        if (cache) caches.add(nom); else caches.delete(nom);
        const o = objetsMesure()[nom]; if (o) o.visible = !cache; return !!o;
      },
      _inventaire() {
        const noms = objetsMesure();
        const out = {};
        for (const [k, o] of Object.entries(noms)) {
          let t = 0;
          o.traverse((ob) => {
            const g = ob.geometry; if (!g) return;
            const n = (g.index ? g.index.count : g.attributes.position.count) / (ob.isPoints ? 1 : 3);
            const ic = g.isInstancedBufferGeometry ? g.instanceCount : 1;
            t += n * (Number.isFinite(ic) ? ic : 1);
          });
          out[k] = Math.round(t / 1000) + ' k';
        }
        return out;
      },
      _chrono(n = 40) {
        const gl = renderer.getContext(), px = new Uint8Array(4), t = [];
        renderer.info.autoReset = false;
        for (let i = 0; i < n; i++) {
          renderer.info.reset();
          const t0 = performance.now();
          image1(1 / 60, t0);
          gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
          t.push(performance.now() - t0);
        }
        const info = { appels: renderer.info.render.calls, triangles: renderer.info.render.triangles, zone: Math.round(zoneVue * 100) };
        renderer.info.autoReset = true;
        t.sort((a, b) => a - b);
        return { med: +t[n >> 1].toFixed(2), p90: +t[Math.floor(n * 0.9)].toFixed(2), ...info, px: [lC * dprC, hC * dprC].map(Math.round) };
      },
    };
  }

  function prendreHeure(h) {
    H.main = Math.min(1, Math.max(0, h));
    H.chapitreMain = chapitreDe(R.vue);
  }

  function boucle(t) {
    raf = requestAnimationFrame(boucle);
    const dt = dernier ? Math.min(0.05, (t - dernier) / 1000) : 1 / 60;
    dernier = t;
    if (!moteur?.image) return;
    try { moteur.image(dt, performance.now()); moteur.mesurer(dt, performance.now()); }
    catch (e) { console.warn('Domaine : arrêt du rendu', e); cancelAnimationFrame(raf); raf = 0; try { moteur.detruire?.(); } catch {} repli('erreur de rendu'); }
  }

  demarrer();

  return {
    pret,
    cible(s) { R.cible = Math.min(NB, Math.max(0, s)); },
    aller(s) { R.cible = R.vue = suivi.aller(Math.min(NB, Math.max(0, s))); H.vue = H.main ?? heureRecit(R.vue); },
    heureMain(h, tire = false) { if (h === null) { H.main = null; return; } prendreHeure(h); H.tire = tire; },
    etat: () => ({ s: R.vue, h: H.vue, main: H.main !== null }),
    stats: () => moteur?.stats || null,
    _figer: (f) => moteur?._figer?.(f),
    _simuler: (c, dt, d) => moteur?._simuler?.(c, dt, d),
    _niveau: (n) => moteur?._niveau?.(n),
    _chrono: (n) => moteur?._chrono?.(n),
    _inventaire: () => moteur?._inventaire?.(),
    _profil: (l) => moteur?._profil?.(l),
    _cacher: (n, c) => moteur?._cacher?.(n, c),
    detruire() {
      if (detruit) return;
      detruit = true;
      cancelAnimationFrame(raf); raf = 0;
      for (const f of nettoyages) f();
      try { moteur?.detruire?.(); } catch {}
      toile.remove();
    },
  };
}

export { BOUTEILLE };
