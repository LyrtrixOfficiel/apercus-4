// Kazura v12 : « Le domaine Kazura », l'expérience 3D phare de la section Expériences.
// Un domaine viticole alsacien imaginaire au pied d'un château de grès rose (inspiré du Haut-Koenigsbourg) :
// rangs de vigne, herbes hautes, coquelicots, bleuets et marguerites, deux petits arbres, le rideau d'arbres,
// la colline boisée, le château, un ciel vivant. On fait glisser pour passer du jour à la nuit ; on touche
// les herbes et les fleurs, qui s'écartent et libèrent des pétales (des lucioles la nuit). La caméra vit
// toute seule : six plans de cinéma enchaînés par des fondus.
//
// API : export async function monter(el, { reduit, mobile }) remplit el et renvoie { detruire(), pret }.
// three.js 0.170.0 depuis jsdelivr (+esm), comme monde/monde.js. Le rendu ne tourne que si el est visible.

import { creerUniformesCommuns } from './scene/commun.js';
import { creerHeure, direction } from './scene/heure.js';
import { creerSol, creerLointain } from './scene/terrain.js';
import { creerCiel } from './scene/ciel.js';
import { creerVigne } from './scene/vigne.js';
import { creerHerbe } from './scene/herbe.js';
import { creerForet, creerPetitsArbres } from './scene/arbres.js';
import { creerChateau } from './scene/chateau.js';
import { creerLiane, creerLucioles, creerGerbes } from './scene/magie.js';
import { creerRealisateur } from './scene/camera.js';
import { creerChaine } from './scene/post.js';

const VERSION_THREE = '0.170.0';
const CDN = `https://cdn.jsdelivr.net/npm/three@${VERSION_THREE}`;
const BASE = new URL('.', import.meta.url).href;

const ICONES = {
  soleil: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/></svg>',
  lune: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.5 14.6A8 8 0 0 1 9.4 4.5a8 8 0 1 0 10.1 10.1z"/></svg>',
  main: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V10m0-.5V4a1.5 1.5 0 0 1 3 0v6m0-1.5a1.5 1.5 0 0 1 3 0V14a7 7 0 0 1-7 7h-.6a6 6 0 0 1-4.6-2.2L3.4 15a1.6 1.6 0 0 1 2.4-2.1L9 15.5"/></svg>',
};

function webgl2() {
  try { const c = document.createElement('canvas'); return !!c.getContext('webgl2'); } catch { return false; }
}

async function chargerThree() {
  const THREE = await import(`${CDN}/+esm`);
  return { THREE };
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

export async function monter(el, opts = {}) {
  const reduit = opts.reduit ?? matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile = opts.mobile ?? (matchMedia('(pointer: coarse)').matches || innerWidth < 760);
  const fixe = !!opts.fixe;               // essais : pas d'adaptation de la qualité (Edge bridé à 30 i/s)

  /* ---------- 1. Le gabarit ---------- */
  el.innerHTML = `
  <div class="dk${reduit ? ' dk-reduit' : ''}${mobile ? ' dk-mobile' : ''}" data-etat="attente">
    <canvas class="dk-toile" aria-label="Le domaine Kazura en 3D : un coteau de vignes au pied d'un château. Faites glisser pour passer du jour à la nuit."></canvas>
    <div class="dk-affiche" aria-hidden="true"><img alt="" decoding="async" src="${BASE}img/repli-jour.webp"><img class="dk-affiche-or" alt="" decoding="async"><img class="dk-affiche-nuit" alt="" decoding="async"></div>
    <div class="dk-attente" role="status"><span class="dk-point"></span><span>Le domaine se prépare</span></div>
    <div class="dk-hud" aria-hidden="true">
      <span class="dk-coin dk-hg"></span><span class="dk-coin dk-hd"></span><span class="dk-coin dk-bg"></span><span class="dk-coin dk-bd"></span>
      <span class="dk-croix" style="left:33.333%;top:33.333%"></span><span class="dk-croix" style="left:66.667%;top:33.333%"></span>
      <span class="dk-croix" style="left:33.333%;top:66.667%"></span><span class="dk-croix" style="left:66.667%;top:66.667%"></span>
      <p class="dk-coord"><span class="dk-lat">48.2494° N</span><span class="dk-lon">7.3444° E</span><span class="dk-alt">ALT 000 M</span></p>
      <p class="dk-plan"><span class="dk-plan-n">01/06</span><span class="dk-plan-nom"></span></p>
    </div>
    <div class="dk-titre"><p class="dk-sur">Kazura · expérience 3D</p><p class="dk-mention">Vitrine imaginaire : un domaine inventé, dessiné par Kazura</p></div>
    <div class="dk-bas">
      <p class="dk-consigne"><span class="dk-main">${ICONES.main}</span><span class="dk-consigne-texte">Faites glisser pour passer du jour à la nuit</span></p>
      <div class="dk-temps" role="slider" tabindex="0" aria-label="L'heure du domaine, du jour à la nuit" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-valuetext="Jour">
        <span class="dk-ic dk-ic-soleil">${ICONES.soleil}</span>
        <span class="dk-piste"><span class="dk-graduations"></span><span class="dk-rempli"></span><span class="dk-curseur"><span class="dk-lecture"><span class="dk-heure">15:00</span><span class="dk-moment">Jour</span></span></span></span>
        <span class="dk-ic dk-ic-lune">${ICONES.lune}</span>
      </div>
      <p class="dk-etapes" aria-hidden="true"><span data-h="0">Jour</span><span data-h="0.42">Heure dorée</span><span data-h="0.64">Crépuscule</span><span data-h="1">Nuit</span></p>
    </div>
  </div>`;
  const $ = (s) => el.querySelector(s);
  const racine = $('.dk'), toile = $('.dk-toile'), affiche = $('.dk-affiche'), attente = $('.dk-attente');
  const consigne = $('.dk-consigne'), consigneTexte = $('.dk-consigne-texte'), temps = $('.dk-temps'), piste = $('.dk-piste');
  const curseur = $('.dk-curseur'), rempli = $('.dk-rempli'), moment = $('.dk-moment'), planN = $('.dk-plan-n'), planNom = $('.dk-plan-nom');
  const heureTexte = $('.dk-heure'), altTexte = $('.dk-alt'), latTexte = $('.dk-lat'), lonTexte = $('.dk-lon'), etapes = [...el.querySelectorAll('.dk-etapes span')];
  const imgOr = $('.dk-affiche-or'), imgNuit = $('.dk-affiche-nuit');

  let detruit = false, visible = false, raf = 0, moteur = null, dernier = 0;
  const nettoyages = [];
  const ecoute = (cible, type, f, o) => { cible.addEventListener(type, f, o); nettoyages.push(() => cible.removeEventListener(type, f, o)); };

  /* ---------- 2. L'heure, partagée entre le moteur 3D et le repli ---------- */
  const H = { cible: 0, vue: 0, derniereMain: -1e9, phase: 'tenueJour', t: 0, aGlisse: false };
  // une heure fictive, pour l'indicateur : 15 h en plein jour, 19 h 30 à l'heure dorée, minuit passé à la nuit
  const HORAIRE = [[0, 15], [0.42, 19.5], [0.64, 21.2], [0.82, 22.6], [1, 24.5]];
  function horloge(h) {
    let i = 0; while (i < HORAIRE.length - 2 && h > HORAIRE[i + 1][0]) i++;
    const [a, x] = HORAIRE[i], [b, y] = HORAIRE[i + 1];
    const v = (x + ((h - a) / (b - a)) * (y - x)) % 24;
    const m = Math.floor(v * 60);
    return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  }
  const NOMS = (h) => (h < 0.24 ? 'Jour' : h < 0.54 ? 'Heure dorée' : h < 0.74 ? 'Crépuscule' : 'Nuit');
  function majIndicateur(h) {
    const p = Math.round(h * 100);
    curseur.style.left = `${h * 100}%`;
    rempli.style.transform = `scaleX(${h})`;
    const nom = NOMS(h);
    if (moment.textContent !== nom) { moment.textContent = nom; for (const e of etapes) e.classList.toggle('dk-actif', e.textContent === nom); }
    const hh = horloge(h);
    if (heureTexte.textContent !== hh) heureTexte.textContent = hh;
    temps.setAttribute('aria-valuenow', String(p));
    temps.setAttribute('aria-valuetext', nom);
    racine.style.setProperty('--dk-h', h.toFixed(3));
  }
  const D = reduit ? 1.3 : 1;
  function avancerAuto(dt, maintenant) {
    if (maintenant - H.derniereMain < 8000) return;
    switch (H.phase) {
      case 'tenueJour': H.t += dt; if (H.t > 7 * D) H.phase = 'descend'; break;
      case 'descend': H.cible = Math.min(1, H.cible + dt / (30 * D)); if (H.cible >= 1) { H.phase = 'tenueNuit'; H.t = 0; } break;
      case 'tenueNuit': H.t += dt; if (H.t > 26 * D) H.phase = 'monte'; break;
      case 'monte': H.cible = Math.max(0, H.cible - dt / (14 * D)); if (H.cible <= 0) { H.phase = 'tenueJour'; H.t = 0; } break;
    }
  }
  function mainSurLHeure(h) {
    H.cible = Math.min(1, Math.max(0, h));
    H.derniereMain = performance.now();
    H.phase = H.cible > 0.92 ? 'tenueNuit' : H.cible < 0.06 ? 'tenueJour' : 'descend';
    H.t = 0;
    if (!H.aGlisse) { H.aGlisse = true; montrerConsigne('Touchez les herbes et les fleurs', 5000); }
  }

  /* ---------- 3. Les consignes ---------- */
  let consigneMinuterie = 0, consigneVue = 0;
  function montrerConsigne(texte, duree) {
    consigneTexte.textContent = texte;
    consigne.classList.add('dk-visible');
    consigne.classList.toggle('dk-toucher', /Touchez/.test(texte));
    clearTimeout(consigneMinuterie);
    consigneMinuterie = setTimeout(() => consigne.classList.remove('dk-visible'), duree);
    consigneVue = performance.now();
  }

  /* ---------- 4. Le curseur de l'heure (souris, doigt, clavier) ---------- */
  let glissePiste = null;
  const posPiste = (e) => { const r = piste.getBoundingClientRect(); return (e.clientX - r.left) / r.width; };
  ecoute(temps, 'pointerdown', (e) => { e.preventDefault(); glissePiste = e.pointerId; temps.setPointerCapture?.(e.pointerId); mainSurLHeure(posPiste(e)); racine.classList.add('dk-glisse'); });
  ecoute(temps, 'pointermove', (e) => { if (glissePiste === e.pointerId) mainSurLHeure(posPiste(e)); });
  const finPiste = (e) => { if (glissePiste === e.pointerId) { glissePiste = null; racine.classList.remove('dk-glisse'); } };
  ecoute(temps, 'pointerup', finPiste); ecoute(temps, 'pointercancel', finPiste);
  ecoute(temps, 'keydown', (e) => {
    const pas = { ArrowRight: 0.05, ArrowUp: 0.05, ArrowLeft: -0.05, ArrowDown: -0.05, PageUp: 0.2, PageDown: -0.2 }[e.key];
    if (pas !== undefined) { e.preventDefault(); mainSurLHeure(H.cible + pas); }
    else if (e.key === 'Home') { e.preventDefault(); mainSurLHeure(0); }
    else if (e.key === 'End') { e.preventDefault(); mainSurLHeure(1); }
  });

  /* ---------- 5. Visibilité : on ne dessine que ce qu'on voit ---------- */
  const io = new IntersectionObserver((es) => {
    for (const e of es) {
      visible = e.isIntersecting;
      if (visible && !moteur && !detruit) demarrer();
      relancer();
    }
  }, { rootMargin: '120px 0px', threshold: 0.01 });
  io.observe(el);
  nettoyages.push(() => io.disconnect());
  ecoute(document, 'visibilitychange', () => relancer());

  function relancer() {
    const doit = visible && !document.hidden && !detruit;
    if (doit && !raf) { dernier = 0; raf = requestAnimationFrame(boucle); }
    if (!doit && raf) { cancelAnimationFrame(raf); raf = 0; }
  }

  /* ---------- 6. Le repli sans WebGL : les trois heures en images, toujours pilotées par le curseur ---------- */
  function repli(raison) {
    if (raison) console.info('Domaine : repli en images (' + raison + ')');
    racine.dataset.etat = 'repli';
    imgOr.src = `${BASE}img/repli-or.webp`;
    imgNuit.src = `${BASE}img/repli-nuit.webp`;
    moteur = { repli: true, image() {} };
    montrerConsigne('Faites glisser pour passer du jour à la nuit', 9000);
    // glisser sur l'image fait aussi passer le temps
    let g = null;
    ecoute(toile, 'pointerdown', (e) => { g = { id: e.pointerId, x0: e.clientX, y0: e.clientY, h0: H.cible, actif: false }; });
    ecoute(toile, 'pointermove', (e) => {
      if (!g || g.id !== e.pointerId) return;
      const dx = e.clientX - g.x0, dy = e.clientY - g.y0;
      if (!g.actif && Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.2) { g.actif = true; toile.setPointerCapture?.(e.pointerId); }
      if (g.actif) mainSurLHeure(g.h0 + dx / (toile.clientWidth * 0.85));
    });
    const fin = () => { g = null; };
    ecoute(toile, 'pointerup', fin); ecoute(toile, 'pointercancel', fin);
  }

  let pretOk; const pret = new Promise((r) => (pretOk = r));

  async function demarrer() {
    moteur = { chargement: true };
    if (opts.forcerRepli || !webgl2()) { repli('WebGL 2 absent'); pretOk(); return; }
    try {
      const M = await chargerThree();
      if (detruit) return;
      const textures = await chargerTextures(M.THREE, mobile);
      if (detruit) return;
      moteur = await construire(M, textures);
      if (detruit) { moteur.detruire(); return; }
      racine.dataset.etat = 'pret';
      montrerConsigne('Faites glisser pour passer du jour à la nuit', 9000);
      relancer();
    } catch (e) {
      console.warn('Domaine : la 3D ne peut pas démarrer ici', e);
      repli('erreur');
    }
    pretOk();
  }

  /* ---------- 7. Le moteur 3D ---------- */
  async function construire({ THREE }, tex) {
    const renderer = new THREE.WebGLRenderer({ canvas: toile, antialias: false, alpha: false, powerPreference: 'high-performance', stencil: false });
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.setClearColor(0x000000, 1);
    renderer.autoClear = true;

    const U = creerUniformesCommuns(THREE);
    const heure = creerHeure(THREE);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 16 / 9, 0.08, 6000);
    const o = { mobile, reduit };

    const ciel = creerCiel(THREE, U, o);
    direction(THREE, -32, 38, ciel.uniformes.uLune.value);
    const sol = creerSol(THREE, U, tex, o);
    const lointain = creerLointain(THREE, U);
    const foret = creerForet(THREE, U, tex, o);
    const petitsArbres = creerPetitsArbres(THREE, U, tex, o);
    const vigne = creerVigne(THREE, U, tex, o);
    const herbe = creerHerbe(THREE, U, o);
    const chateau = creerChateau(THREE, U, o);
    const liane = creerLiane(THREE, U, o);
    const lucioles = creerLucioles(THREE, U, o);
    const gerbes = creerGerbes(THREE, U, o);
    scene.add(ciel.objet, lointain, sol, foret, petitsArbres, chateau, vigne.objet, herbe.objet, liane.objet, lucioles.objet, gerbes.objet);

    const chaine = creerChaine(THREE, renderer, o);
    U.uA2C.value = chaine.Q.msaa > 0 ? 1 : 0;
    const real = creerRealisateur(THREE, o);

    // qualité : densité de pixels, puis effets, puis densité d'herbe, si la cadence tombe
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

    // compilation des nuanceurs avant la première image (pas d'à-coup au démarrage)
    heure.appliquer(0, U);
    ciel.regler(heure.P, U);
    real.poser(camera, 0, 0, camera.aspect, 0);
    try { await renderer.compileAsync(scene, camera); } catch { /* compilation au premier rendu */ }

    /* La main : position écran, force, vitesse ; les gerbes au toucher */
    const main = { x: 0, y: 0, force: 0, cible: 0, dedans: false, bas: null, vx: 0, vy: 0, px: 0, py: 0, glisse: false };
    const ndc = (e) => { const r = toile.getBoundingClientRect(); return [((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1)]; };
    const sourisParallaxe = [0, 0];
    ecoute(toile, 'pointerdown', (e) => {
      const [x, y] = ndc(e);
      main.bas = { id: e.pointerId, x0: e.clientX, y0: e.clientY, h0: H.cible, t0: performance.now(), type: e.pointerType };
      main.glisse = false;
      main.x = x; main.y = y; main.cible = 1; main.dedans = true;
    });
    ecoute(toile, 'pointermove', (e) => {
      const [x, y] = ndc(e);
      main.vx = x - main.x; main.vy = y - main.y;
      main.x = x; main.y = y; main.dedans = true;
      if (e.pointerType === 'mouse') { main.cible = 1; sourisParallaxe[0] = x; sourisParallaxe[1] = y; }
      const b = main.bas;
      if (b && b.id === e.pointerId) {
        const dx = e.clientX - b.x0, dy = e.clientY - b.y0;
        if (!main.glisse && Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.2) {
          main.glisse = true; toile.setPointerCapture?.(e.pointerId); racine.classList.add('dk-glisse');
        }
        if (main.glisse) mainSurLHeure(b.h0 + dx / (toile.clientWidth * 0.85));
      }
    });
    const fin = (e, annule) => {
      const b = main.bas;
      if (b && b.id === e.pointerId) {
        if (!annule && !main.glisse && performance.now() - b.t0 < 500 && Math.hypot(e.clientX - b.x0, e.clientY - b.y0) < 12) toucher();
        main.bas = null;
        racine.classList.remove('dk-glisse');
        if (e.pointerType !== 'mouse') main.cible = 0;
      }
    };
    ecoute(toile, 'pointerup', (e) => fin(e, false));
    ecoute(toile, 'pointercancel', (e) => fin(e, true));
    ecoute(toile, 'pointerleave', (e) => { if (e.pointerType === 'mouse' || !main.bas) { main.cible = 0; main.dedans = false; sourisParallaxe[0] = sourisParallaxe[1] = 0; } });

    const ray = new THREE.Raycaster();
    const vTmp = new THREE.Vector3(), vMat = new THREE.Matrix4();
    const derniereGerbe = new Float32Array(herbe.tetes.length);
    /** La fleur la plus proche de la main à l'écran (ou null). */
    function fleurSousLaMain(rayonNdc, distMax) {
      vMat.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
      const e = vMat.elements, asp = camera.aspect;
      let best = null, bd = rayonNdc;
      const T = herbe.tetes;
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
        const f = herbe.tetes[i];
        gerbes.emettre(f.x, f.y, f.z, nuit ? (f.type === 2 ? 4 : f.type) : f.type, reduit ? 10 : 18, nuit);
        derniereGerbe[i] = U.uTemps.value;
      } else {
        // pas de fleur : un point du sol sous la main, au plus à 9 m
        ray.setFromCamera({ x: main.x, y: main.y }, camera);
        const d = Math.min(9, ray.ray.direction.y < -0.02 ? (camera.position.y - 0.3) / -ray.ray.direction.y : 5);
        ray.ray.at(Math.max(1.2, d), vTmp);
        gerbes.emettre(vTmp.x, vTmp.y, vTmp.z, nuit ? 3 : (Math.random() < 0.5 ? 0 : 2), reduit ? 10 : 16, nuit);
      }
      if (!H.aGlisse) montrerConsigne('Faites glisser pour passer du jour à la nuit', 5000);
    }

    /* La boucle */
    let tFilm = 0, numero = -1, image = 0, figer = null;
    let mesure = { n: 0, somme: 0, depuis: 0 };
    const stats = { ips: 0, niveau: 0, ms: 0 };
    const vD = new THREE.Vector3(), vA = new THREE.Vector3();

    function poserUniformesCamera() {
      camera.getWorldDirection(vA); vA.y = 0; vA.normalize();
      vD.set(-vA.z, 0, vA.x);
      U.uCamDroite.value.copy(vD); U.uCamAvant.value.copy(vA);
      const px = (chaine_hauteur() / (2 * Math.tan((camera.fov * Math.PI) / 360)));
      lucioles.uniformes.uPx.value = px; gerbes.uniformes.uPx.value = px; liane.points.uniforms.uPx.value = px;
    }
    const chaine_hauteur = () => hC * dprC;

    // mesure du temps GPU (essais seulement) : EXT_disjoint_timer_query_webgl2
    const gpu = { actif: false, ext: null, file: [], total: 0, n: 0 };
    function gpuDebut() {
      if (!gpu.actif) return null;
      const gl = renderer.getContext();
      gpu.ext = gpu.ext || gl.getExtension('EXT_disjoint_timer_query_webgl2');
      if (!gpu.ext) return null;
      const q = gl.createQuery(); gl.beginQuery(gpu.ext.TIME_ELAPSED_EXT, q); return q;
    }
    function gpuFin(q) {
      const gl = renderer.getContext();
      if (q) { gl.endQuery(gpu.ext.TIME_ELAPSED_EXT); gpu.file.push(q); }
      while (gpu.file.length && gl.getQueryParameter(gpu.file[0], gl.QUERY_RESULT_AVAILABLE)) {
        const q0 = gpu.file.shift();
        if (!gl.getParameter(gpu.ext.GPU_DISJOINT_EXT)) { gpu.total += gl.getQueryParameter(q0, gl.QUERY_RESULT) / 1e6; gpu.n++; }
        gl.deleteQuery(q0);
      }
    }

    function image1(dt, maintenant) {
      if (figer) { H.cible = H.vue = figer.h; tFilm = figer.t; }
      else {
        avancerAuto(dt, maintenant);
        H.vue += (H.cible - H.vue) * (1 - Math.exp(-dt * (glissePiste !== null || main.glisse ? 9 : 2.2)));
        tFilm += dt;
      }
      U.uTemps.value += figer ? 0 : dt;
      const P = heure.appliquer(H.vue, U);
      ciel.regler(P, U);
      lucioles.uniformes.uLucioles.value = P.lucioles;
      majIndicateur(H.vue);

      // la main : force lissée, plus douce en mouvement réduit
      main.force += (main.cible - main.force) * (1 - Math.exp(-dt * (main.cible > main.force ? 10 : 3)));
      U.uMain.value.set(main.x, main.y, main.force * (reduit ? 0.7 : 1));

      // le film
      const et = real.etat(tFilm);
      if (et.numero !== numero) {
        if (numero >= 0 && !figer) {
          // fondu enchaîné : on fige la dernière image du plan qui s'en va
          const ancien = real.etat(numero * real.duree + real.duree - 0.001);
          const s = real.poser(camera, ancien.plan, 0.9999, camera.aspect, U.uTemps.value);
          poserUniformesCamera();
          chaine.rendre({ scene, camera, P, focus: s.focus, ouv: s.ouv, fondu: 1, temps: U.uTemps.value, copierPrecedent: true, soleilDir: P.h > 0.66 ? ciel.uniformes.uLune.value : P.soleil });
        }
        numero = et.numero;
      }
      const pn = `${String(et.plan + 1).padStart(2, '0')}/${String(real.nombre).padStart(2, '0')}`;
      if (planN.textContent !== pn) planN.textContent = pn;
      const s = real.poser(camera, et.plan, et.u, camera.aspect, U.uTemps.value, mobile || reduit ? [0, 0] : sourisParallaxe);
      if (planNom.textContent !== s.nom) planNom.textContent = s.nom;
      if (image % 6 === 0) {
        // coordonnées de la caméra, pour le décor technique (ancrées sur le château qui a inspiré la scène)
        const cp = camera.position;
        latTexte.textContent = `${(48.2494 + (cp.z + 560) / 111200).toFixed(4)}° N`;
        lonTexte.textContent = `${(7.3444 + (cp.x - 30) / 74100).toFixed(4)}° E`;
        altTexte.textContent = `ALT ${String(Math.round(180 + cp.y)).padStart(3, '0')} M`;
      }
      poserUniformesCamera();

      // les fleurs effleurées lâchent leurs pétales
      if (main.force > 0.3 && (Math.abs(main.vx) + Math.abs(main.vy)) > 0.004 && image % 2 === 0) {
        const i = fleurSousLaMain(0.05, 12);
        if (i !== null && U.uTemps.value - derniereGerbe[i] > 1.2) {
          derniereGerbe[i] = U.uTemps.value;
          const f = herbe.tetes[i];
          const nuit = H.vue > 0.62 ? 1 : 0;
          gerbes.emettre(f.x, f.y, f.z, nuit ? (f.type === 2 ? 4 : f.type) : f.type, reduit ? 3 : 5, nuit);
        }
      }
      main.vx *= 0.5; main.vy *= 0.5;
      gerbes.animer(figer ? 0 : dt, P.vent * 1.2, U.uTemps.value);

      const fondu = figer ? 1 : et.entree * et.entree * (3 - 2 * et.entree);
      const q = gpuDebut();
      chaine.rendre({ scene, camera, P, focus: s.focus, ouv: s.ouv, fondu, temps: U.uTemps.value, soleilDir: P.h > 0.66 ? ciel.uniformes.uLune.value : P.soleil });
      gpuFin(q);
      image++;
      if (image === 2) { racine.dataset.etat = 'vivant'; pretOk(); }

      // réapparition de la consigne si personne ne touche
      if (!H.aGlisse && maintenant - consigneVue > 26000) montrerConsigne('Faites glisser pour passer du jour à la nuit', 7000);
    }

    function mesurer(dt, maintenant) {
      if (fixe || figer) return;
      if (maintenant - mesure.depuis < 2500) { if (!mesure.depuis) mesure.depuis = maintenant; return; }
      mesure.n++; mesure.somme += dt;
      if (mesure.n >= 90) {
        const moy = mesure.somme / mesure.n;
        stats.ips = Math.round(1 / moy); stats.ms = Math.round(moy * 1000 * 10) / 10;
        if (moy > 1 / 45 && niveau < NIVEAUX.length - 1) { niveau++; stats.niveau = niveau; appliquerNiveau(); mesure.depuis = maintenant; }
        mesure.n = 0; mesure.somme = 0;
      }
    }

    function detruireMoteur() {
      ro.disconnect();
      scene.traverse((ob) => {
        ob.geometry?.dispose?.();
        const m = ob.material;
        if (m) for (const mm of Array.isArray(m) ? m : [m]) mm.dispose();
      });
      for (const t of Object.values(tex)) t.dispose();
      chaine.detruire();
      renderer.dispose();
      try { renderer.forceContextLoss(); } catch {}
    }

    ecoute(toile, 'webglcontextlost', (e) => { e.preventDefault(); repli('contexte WebGL perdu'); });

    return {
      image: image1, mesurer, detruire: detruireMoteur, stats,
      _figer(f) { figer = f; if (f) { numero = real.etat(f.t).numero; } },
      _niveau(n) { niveau = n; appliquerNiveau(); },
      _etat() { return { film: Math.round(tFilm * 10) / 10, h: Math.round(H.vue * 100) / 100, images: image }; },
      _gpu(oui) { gpu.actif = oui; const r = gpu.n ? Math.round((gpu.total / gpu.n) * 100) / 100 : null; gpu.total = 0; gpu.n = 0; return r; },
      _cadrer() { dimensionner(true); },
    };
  }

  function boucle(t) {
    raf = requestAnimationFrame(boucle);
    const dt = dernier ? Math.min(0.05, (t - dernier) / 1000) : 1 / 60;
    dernier = t;
    if (moteur?.repli) {
      if (!H.aGlisse) avancerAuto(dt, performance.now());
      H.vue += (H.cible - H.vue) * (1 - Math.exp(-dt * 3));
      majIndicateur(H.vue);
      const h = H.vue;
      imgOr.style.opacity = String(Math.max(0, Math.min(1, 1 - Math.abs(h - 0.45) / 0.3)));
      imgNuit.style.opacity = String(Math.max(0, Math.min(1, (h - 0.55) / 0.3)));
      return;
    }
    if (!moteur?.image) return;
    try { moteur.image(dt, performance.now()); moteur.mesurer(dt, performance.now()); }
    catch (e) { console.warn('Domaine : arrêt du rendu', e); cancelAnimationFrame(raf); raf = 0; moteur.detruire?.(); repli('erreur de rendu'); relancer(); }
  }

  return {
    pret,
    detruire() {
      if (detruit) return;
      detruit = true;
      cancelAnimationFrame(raf); raf = 0;
      clearTimeout(consigneMinuterie);
      for (const f of nettoyages) f();
      try { moteur?.detruire?.(); } catch {}
      el.innerHTML = '';
    },
    stats: () => moteur?.stats || null,
    _figer: (f) => moteur?._figer?.(f),
    _niveau: (n) => moteur?._niveau?.(n),
    _etat: () => moteur?._etat?.(),
    _gpu: (oui) => moteur?._gpu?.(oui),
  };
}
