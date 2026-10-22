// Le site infini : le moteur (three.js 0.170.0).
//
// LE PRINCIPE (effet Droste, zoom sans fin)
// - Chaque niveau = un site (page dessinée en canvas 2D, posée en plan à 1 m devant la caméra de départ) dont l'image
//   d'ouverture est un trou ouvert sur un monde en 3D. Dans ce monde, un objet PORTE (vitrine, pupille, téléphone…) a
//   exactement les proportions de l'écran.
// - La caméra part de l'origine (la page remplit l'écran), passe par le trou, vole dans le monde et finit face à la porte,
//   à la distance où la porte remplit l'écran au pixel près.
// - La porte affiche le niveau suivant rendu dans une texture (render target) depuis SA caméra de départ : au bout du vol,
//   l'image de la porte et le niveau suivant sont identiques, le relais se fait sans couture.
// - Trois niveaux vivent à la fois : le courant (à l'écran), le suivant (texture de la taille de la porte à l'écran),
//   celui d'après (petite texture), et au-delà une simple image de la page. On recycle les textures à chaque image.
// - La vitesse est uniforme en « logarithme du zoom » : on mesure le chemin (déplacement / distance au point regardé)
//   et on le reparamètre, chaque niveau a ainsi la même sensation de plongée.
import { THREE, U, liberer } from './mondes/outils.js';
import { NIVEAUX, dessinerPage, trou as trouPage } from './pages.js';

const MONDES = {
  kazura: () => import('./mondes/kazura.js'),
  boulangerie: () => import('./mondes/boulangerie.js'),
  tatouage: () => import('./mondes/tatouage.js'),
  avocat: () => import('./mondes/avocat.js'),
  fleuriste: () => import('./mondes/fleuriste.js'),
  escalade: () => import('./mondes/escalade.js'),
  garage: () => import('./mondes/garage.js'),
  musique: () => import('./mondes/musique.js'),
  vigneron: () => import('./mondes/vigneron.js'),
};
const BOUCLE = NIVEAUX.length - 1;            // 8 métiers ; le niveau 0 (Kazura) n'est vu qu'au début
export const idDe = (n) => (n <= 0 ? 'kazura' : NIVEAUX[1 + ((n - 1) % BOUCLE)].id);
const infoDe = (id) => NIVEAUX.find((x) => x.id === id);
const lisse = (x, a, b) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

export async function demarrer(toile, opts = {}) {
  const reduit = !!opts.reduit, mobile = !!opts.mobile;
  const renderer = new THREE.WebGLRenderer({ canvas: toile, antialias: false, alpha: false, powerPreference: 'high-performance', stencil: false, precision: 'highp' });
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.autoClear = false;
  const gl = renderer.getContext();
  const demi = renderer.extensions.has('EXT_color_buffer_float') || renderer.extensions.has('EXT_color_buffer_half_float');
  const maxTex = renderer.capabilities.maxTextureSize;
  const maxEch = Math.min(4, renderer.capabilities.maxSamples || 0);

  // ---------------------------------------------------------------------------------------------------------
  // Taille, qualité
  const Q = { q: mobile ? 0.8 : 1, qmin: 0.45, cap: mobile ? 2 : 2, msaa: mobile ? 0 : maxEch, interieur: 1, fixe: !!opts.fixe };
  let W = 1, H = 1, Wp = 1, Hp = 1, A = 1, F = 0.7, tanF = 0.36;
  const cibles = { S: null, A: null, B: null };
  function cible(w, h, ech) {
    return new THREE.WebGLRenderTarget(w, h, { type: demi ? THREE.HalfFloatType : THREE.UnsignedByteType, samples: ech, depthBuffer: true, stencilBuffer: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, generateMipmaps: false });
  }
  function dimensionner() {
    W = Math.max(1, window.innerWidth); H = Math.max(1, window.innerHeight); A = W / H;
    F = THREE.MathUtils.degToRad(A < 1 ? 56 : 40); tanF = Math.tan(F / 2);
    const pr = Math.min(window.devicePixelRatio || 1, Q.cap) * Q.q;
    renderer.setPixelRatio(pr); renderer.setSize(W, H, false);
    Wp = Math.round(W * pr); Hp = Math.round(H * pr);
    for (const k of ['S', 'A', 'B']) { cibles[k]?.dispose(); }
    cibles.S = cible(Wp, Hp, Q.msaa); cibles.A = cible(Wp, Hp, Q.msaa); cibles.B = cible(Math.ceil(Wp * 0.6), Math.ceil(Hp * 0.6), 0);
    post.material.uniforms.tScene.value = cibles.S.texture;
    post.material.uniforms.uRes.value.set(Wp, Hp);
  }

  // ---------------------------------------------------------------------------------------------------------
  // Le passage final : compression douce des hautes lumières, vignette, légère aberration sur les bords, grain, sRGB
  const triangle = new THREE.BufferGeometry();
  triangle.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
  const post = new THREE.Mesh(triangle, new THREE.ShaderMaterial({
    depthTest: false, depthWrite: false,
    uniforms: { tScene: { value: null }, tPorte: { value: null }, uEchP: { value: new THREE.Vector2(1, 1) }, uMixP: { value: 0 }, uRes: { value: new THREE.Vector2(1, 1) }, uT: U.temps, uGrain: { value: mobile ? 0.03 : 0.035 }, uVoile: { value: 0 } },
    vertexShader: `precision highp float; varying vec2 vUv; void main(){ vUv = position.xy*0.5 + 0.5; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
    fragmentShader: `precision highp float; uniform sampler2D tScene, tPorte; uniform vec2 uRes, uEchP; uniform float uT, uGrain, uVoile, uMixP; varying vec2 vUv;
      vec3 doux(vec3 c){ float k = 0.86; vec3 x = max(c - k, 0.0); return min(c, vec3(k)) + (1.0 - k)*(1.0 - exp(-x/(1.0 - k))); }
      vec3 srgb(vec3 c){ c = clamp(c, 0.0, 1.0); return mix(c*12.92, 1.055*pow(c, vec3(1.0/2.4)) - 0.055, step(0.0031308, c)); }
      float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233)))*43758.5453); }
      void main(){
        vec2 d = vUv - 0.5; float r2 = dot(d, d);
        vec2 o = d * r2 * 0.012;
        vec3 c = vec3(texture2D(tScene, vUv - o).r, texture2D(tScene, vUv).g, texture2D(tScene, vUv + o).b);
        if (uMixP > 0.0) { vec2 q = vUv - o; vec3 p = vec3(texture2D(tPorte, (vUv - o)*uEchP).r, texture2D(tPorte, vUv*uEchP).g, texture2D(tPorte, (vUv + o)*uEchP).b); c = mix(c, p, uMixP); }
        c = doux(c);
        c *= 1.0 - 0.32*smoothstep(0.18, 0.75, r2*1.6);
        vec3 s = srgb(c);
        float g = h(vUv*uRes + fract(uT*7.13)*vec2(311.0, 173.0)) - 0.5;
        s += g * uGrain;
        s = mix(s, vec3(0.02, 0.016, 0.04), uVoile);
        gl_FragColor = vec4(s, 1.0);
      }`,
  }));
  post.frustumCulled = false;
  const postScene = new THREE.Scene(); postScene.add(post);
  const postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  dimensionner();

  // ---------------------------------------------------------------------------------------------------------
  // Les niveaux (par identifiant ; une fenêtre de quelques niveaux autour du courant est gardée en mémoire)
  const niveaux = new Map();   // id -> niveau
  const enCours = new Map();   // id -> promesse
  const cam = new THREE.PerspectiveCamera(40, 1, 0.005, 600);
  const camDepart = new THREE.PerspectiveCamera(40, 1, 0.005, 600);
  let generation = 0;

  function pageTexture(id) {
    const s = Math.min(Math.min(window.devicePixelRatio || 1, 2) * (mobile ? 1.25 : 1.5), maxTex / Math.max(W, H));
    const c = document.createElement('canvas'); c.width = Math.round(W * s); c.height = Math.round(H * s);
    const x = c.getContext('2d'); x.scale(c.width / W, c.height / H);
    dessinerPage(x, id, W, H);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true;
    return t;
  }

  const trace = (...x) => { if (opts.trace) console.log('[infini]', ...x); };
  async function construire(id) {
    const gen = generation; trace('construire', id);
    const mod = await MONDES[id]().catch(() => import('./mondes/boulangerie.js'));
    if (gen !== generation) return null;
    const info = infoDe(id);
    const iSuiv = id === 'vigneron' ? NIVEAUX[1] : NIVEAUX[NIVEAUX.indexOf(info) + 1];
    const scene = new THREE.Scene();
    const hp = 2 * tanF, wp = hp * A;   // la page à z = -1
    let page = null, tr = null;
    if (id !== 'kazura') {
      const tex = pageTexture(id);
      const t = trouPage(id, W, H);
      tr = { cx: ((t.x + t.w / 2) / W - 0.5) * wp, cy: (0.5 - (t.y + t.h / 2) / H) * hp, w: t.w / W * wp, h: t.h / H * hp };
      const m = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, fog: false });
      m.color.setScalar(1.035);
      page = new THREE.Mesh(new THREE.PlaneGeometry(wp, hp), m); page.position.z = -1; page.renderOrder = 50;
      scene.add(page);
    }
    trace('monde', id);
    const monde = mod.construire({ a: A, F, renderer, mobile, reduit, trou: tr, fondSuivant: iSuiv.fond, mondeSuivant: iSuiv.monde });
    scene.add(monde.racine);
    if (monde.brouillard) scene.fog = new THREE.Fog(...monde.brouillard);
    const decal = new THREE.Vector3();
    if (tr) { const Zf = monde.foyer ?? 8; decal.set(tr.cx * Zf, tr.cy * Zf, 0); monde.racine.position.add(decal); }
    scene.updateMatrixWorld(true);

    // le chemin de la caméra
    const V = (x) => new THREE.Vector3(...x);
    const cles = [];
    const Y = new THREE.Vector3(0, 1, 0);
    const w0 = V(monde.chemin[0].c).add(decal);
    if (tr) {
      const T = new THREE.Vector3(tr.cx, tr.cy, -1);
      cles.push({ p: new THREE.Vector3(0, 0, 0), c: new THREE.Vector3(0, 0, -1), h: Y });
      cles.push({ p: new THREE.Vector3(0, 0, -0.1), c: new THREE.Vector3(0, 0, -1), h: Y });
      cles.push({ p: T.clone().multiplyScalar(0.62), c: w0.clone().lerp(T, 0.15), h: Y });
      cles.push({ p: T.clone().multiplyScalar(1.12), c: w0, h: Y });
      for (const k of monde.chemin) cles.push({ p: V(k.p).add(decal), c: V(k.c).add(decal), h: k.h ? V(k.h) : Y });
    } else {
      for (const k of monde.chemin) cles.push({ p: V(k.p), c: V(k.c), h: k.h ? V(k.h) : Y });
    }
    const P = monde.porte;
    const Cw = new THREE.Vector3().setFromMatrixPosition(P.mesh.matrixWorld);
    const N = new THREE.Vector3(0, 0, 1).transformDirection(P.mesh.matrixWorld);
    const Hw = new THREE.Vector3(0, 1, 0).transformDirection(P.mesh.matrixWorld);
    const dFin = P.hh / tanF;
    const approche = monde.approche ?? 3.2;
    const dp = cles.at(-1).p.distanceTo(Cw);
    const dA = Math.min(dFin * approche, Math.max(dFin * 1.25, dp * 0.5));
    cles.push({ p: Cw.clone().addScaledVector(N, dA), c: Cw.clone(), h: Hw.clone() });
    cles.push({ p: Cw.clone().addScaledVector(N, dFin), c: Cw.clone(), h: Hw.clone() });
    const cp = new THREE.CatmullRomCurve3(cles.map((k) => k.p), false, 'centripetal');
    const cc = new THREE.CatmullRomCurve3(cles.map((k) => k.c), false, 'centripetal');
    // reparamétrage : chaque pas compte (déplacement / distance au point regardé) + un peu de rotation
    const NB = 1400, table = new Float32Array(NB + 1);
    let M = 0; const a = new THREE.Vector3(), b = new THREE.Vector3(), ca = new THREE.Vector3(), da = new THREE.Vector3(), db = new THREE.Vector3();
    cp.getPoint(0, a); cc.getPoint(0, ca); da.subVectors(ca, a).normalize();
    for (let k = 1; k <= NB; k++) {
      const u = k / NB; cp.getPoint(u, b); cc.getPoint(u, ca);
      const dist = Math.max(b.distanceTo(ca), 1e-4);
      db.subVectors(ca, b).normalize();
      M += a.distanceTo(b) / dist + 0.9 * Math.acos(Math.min(1, Math.max(-1, da.dot(db))));
      table[k] = M; a.copy(b); da.copy(db);
    }
    // ce qui flotte (particules, halos, rayons, voiles) s'efface quand la porte remplit l'écran : rien ne doit passer le relais
    const fondus = [];
    scene.traverse((o) => {
      if (o === page) return;
      const m = o.material;
      if (!m || Array.isArray(m)) return;
      if (o.isPoints && m.uniforms?.uOp) fondus.push({ u: m.uniforms.uOp, base: m.uniforms.uOp.value });
      else if (o.isSprite) fondus.push({ m, base: m.opacity });
      else if (m.uniforms?.uOp && m.blending === THREE.AdditiveBlending) fondus.push({ u: m.uniforms.uOp, base: m.uniforms.uOp.value });
    });
    const niv = {
      id, info, scene, monde, page, porte: P, cles, cp, cc, table, M, NB, fond: monde.fondScene ?? new THREE.Color(info.monde), fondus,
      coins: [], sigma0: 0, pret: false, fondVivant: P.mat.uniforms.uFond.value.clone(),
    };
    // les quatre coins du rectangle de l'écran dans la porte
    const R = new THREE.Vector3().crossVectors(Hw, N).normalize();
    for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) niv.coins.push(Cw.clone().addScaledVector(R, sx * P.hh * P.a).addScaledVector(Hw, sy * P.hh));
    poser(niv, 0, camDepart, false);
    niv.sigma0 = sigma(niv, camDepart);
    trace('chemin', id, M);
    try { await renderer.compileAsync(scene, camDepart); } catch {}
    trace('compile', id);
    if (gen !== generation) { liberer(scene); niv.page?.material.map.dispose(); return null; }
    niv.pret = true;
    return niv;
  }
  function demander(id) {
    if (niveaux.has(id)) return niveaux.get(id);
    if (!enCours.has(id)) {
      const pr = construire(id).then((n) => { enCours.delete(id); if (n) niveaux.set(id, n); return n; }).catch((e) => { enCours.delete(id); console.warn('Niveau indisponible', id, e); return null; });
      enCours.set(id, pr);
    }
    return null;
  }
  function liberer1(id) {
    const n = niveaux.get(id); if (!n) return;
    liberer(n.scene); niveaux.delete(id);
  }
  function toutLiberer() { generation++; for (const id of [...niveaux.keys()]) liberer1(id); enCours.clear(); }

  // ---------------------------------------------------------------------------------------------------------
  // La pose de la caméra au progrès p (0 : la page remplit l'écran ; 1 : la porte remplit l'écran)
  const tmpP = new THREE.Vector3(), tmpC = new THREE.Vector3(), tmpH = new THREE.Vector3();
  function poser(niv, p, camera, parallaxe = true) {
    const m = Math.min(1, Math.max(0, p)) * niv.M, t = niv.table;
    let lo = 0, hi = niv.NB;
    while (hi - lo > 1) { const mi = (lo + hi) >> 1; if (t[mi] < m) lo = mi; else hi = mi; }
    const f = t[hi] > t[lo] ? (m - t[lo]) / (t[hi] - t[lo]) : 0;
    const u = p >= 1 ? 1 : (lo + f) / niv.NB;
    niv.cp.getPoint(u, tmpP); niv.cc.getPoint(u, tmpC);
    const K = niv.cles.length, x = u * (K - 1), s = Math.min(K - 2, Math.floor(x)), fr = lisse(x - s, 0, 1);
    tmpH.copy(niv.cles[s].h).lerp(niv.cles[s + 1].h, fr).normalize();
    camera.fov = THREE.MathUtils.radToDeg(F); camera.aspect = A; camera.updateProjectionMatrix();
    camera.position.copy(tmpP); camera.up.copy(tmpH); camera.lookAt(tmpC);
    if (parallaxe) {
      const w = Math.pow(Math.sin(Math.PI * Math.min(1, Math.max(0, p))), 1.2) * (reduit ? 0.5 : 1);
      const d = tmpP.distanceTo(tmpC);
      camera.translateX(par.x * 0.035 * d * w); camera.translateY(-par.y * 0.025 * d * w);
      camera.rotateY(-par.x * 0.018 * w); camera.rotateX(-par.y * 0.012 * w);
    }
    camera.updateMatrixWorld(true);
  }
  const vv = new THREE.Vector3();
  function sigma(niv, camera) {
    camera.updateMatrixWorld(); camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    for (const c of niv.coins) {
      vv.copy(c).applyMatrix4(camera.matrixWorldInverse);
      if (vv.z > -1e-4) return 1;
      vv.applyMatrix4(camera.projectionMatrix);
      x0 = Math.min(x0, vv.x); x1 = Math.max(x1, vv.x); y0 = Math.min(y0, vv.y); y1 = Math.max(y1, vv.y);
    }
    return Math.min(1, Math.max((x1 - x0) / 2, (y1 - y0) / 2));
  }

  // ---------------------------------------------------------------------------------------------------------
  // Dessiner un niveau dans une cible (sous-rectangle vw x vh)
  function rendre(niv, camera, rt, vw, vh) {
    U.px.value = vh / (2 * tanF);
    rt.viewport.set(0, 0, vw, vh); rt.scissor.set(0, 0, vw, vh); rt.scissorTest = true;
    renderer.setRenderTarget(rt);
    renderer.setClearColor(niv.fond, 1); renderer.clear(true, true, false);
    renderer.render(niv.scene, camera);
  }
  function effacer(niv, s) {
    const f = 1 - lisse(s, 0.6, 0.95);
    for (const x of niv.fondus) { if (x.u) x.u.value = x.base * f; else x.m.opacity = x.base * f; }
  }
  function brancher(niv, tex, ex, ey, statique, fondStatique, s) {
    effacer(niv, s);
    const u = niv.porte.mat.uniforms;
    u.tEcran.value = tex; u.uEch.value.set(ex, ey); u.uMode.value = statique ? 1 : 0;
    if (statique) u.uFond.value.set(fondStatique);
    else u.uFond.value.copy(niv.fondVivant);
    if (niv.porte.rond) u.uW.value = niv.monde.depli ? niv.monde.depli(s) : lisse(s, 0.22, 0.93);
  }

  // ---------------------------------------------------------------------------------------------------------
  // L'état : D = n + p (n : numéro du niveau depuis le début, p : progrès dans le niveau)
  let D = 0, Dc = 0, vitesse = 0, dernierGeste = performance.now() + 2500, enPause = false, tAuto = 0;
  const par = { x: 0, y: 0, cx: 0, cy: 0 };
  const Mde = (n) => niveaux.get(idDe(Math.max(0, Math.floor(n))))?.M ?? 3.6;
  function pousser(dLog) {          // dLog : en unités de « logarithme du zoom »
    dernierGeste = performance.now();
    Dc = Math.max(0, Dc + dLog / Mde(Dc));
  }

  // les gestes
  const evs = [];
  const ecoute = (cible, type, f, o) => { cible.addEventListener(type, f, o); evs.push([cible, type, f, o]); };
  ecoute(toile, 'wheel', (e) => { e.preventDefault(); const k = e.deltaMode === 1 ? 33 : e.deltaMode === 2 ? 600 : 1; pousser(Math.max(-2, Math.min(2, e.deltaY * k * 0.0042))); }, { passive: false });
  const doigts = new Map(); let inertie = 0, dernierY = 0, dernierT = 0;
  ecoute(toile, 'pointerdown', (e) => { toile.setPointerCapture?.(e.pointerId); doigts.set(e.pointerId, { x: e.clientX, y: e.clientY }); inertie = 0; dernierGeste = performance.now(); opts.surGeste?.(); });
  ecoute(toile, 'pointermove', (e) => {
    if (e.pointerType === 'mouse' && !doigts.size) { par.cx = (e.clientX / W) * 2 - 1; par.cy = (e.clientY / H) * 2 - 1; return; }
    const d = doigts.get(e.pointerId); if (!d) return;
    if (doigts.size >= 2) {
      const [a1, b1] = [...doigts.values()]; const av = Math.hypot(a1.x - b1.x, a1.y - b1.y);
      d.x = e.clientX; d.y = e.clientY;
      const [a2, b2] = [...doigts.values()]; const ap = Math.hypot(a2.x - b2.x, a2.y - b2.y);
      if (av > 10 && ap > 10) pousser(Math.log(ap / av) * 1.3);
    } else {
      const dy = e.clientY - d.y; d.x = e.clientX; d.y = e.clientY;
      const dl = -dy / H * 2.6; pousser(dl);
      const t = performance.now(); if (t > dernierT) { inertie = inertie * 0.4 + 0.6 * dl / ((t - dernierT) / 1000 + 1e-3); dernierT = t; }
    }
  });
  const lacher = (e) => { doigts.delete(e.pointerId); if (performance.now() - dernierT > 90) inertie = 0; };
  ecoute(toile, 'pointerup', lacher); ecoute(toile, 'pointercancel', lacher);
  ecoute(window, 'keydown', (e) => {
    if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    const k = e.key;
    if (['ArrowDown', 'PageDown', 'ArrowRight', ' '].includes(k) && !(k === ' ' && e.target?.tagName === 'BUTTON')) { e.preventDefault(); pousser(k === 'PageDown' ? 2.4 : 0.9); }
    else if (['ArrowUp', 'PageUp', 'ArrowLeft'].includes(k)) { e.preventDefault(); pousser(k === 'PageUp' ? -2.4 : -0.9); }
    else if (k === 'Home') { e.preventDefault(); dernierGeste = performance.now(); Dc = 0; }
  });
  // gyroscope (téléphone) : une parallaxe légère
  let gyro0 = null;
  ecoute(window, 'deviceorientation', (e) => {
    if (e.beta == null || e.gamma == null) return;
    if (!gyro0) gyro0 = { b: e.beta, g: e.gamma };
    par.cx = Math.max(-1, Math.min(1, (e.gamma - gyro0.g) / 20)); par.cy = Math.max(-1, Math.min(1, (e.beta - gyro0.b) / 20));
  });
  ecoute(window, 'resize', () => { clearTimeout(resizeT); resizeT = setTimeout(redimensionner, 220); });
  let resizeT = 0;
  function redimensionner() {
    const nW = window.innerWidth, nH = window.innerHeight;
    if (nW === W && nH === H) return;
    post.material.uniforms.uVoile.value = 1;
    toutLiberer(); dimensionner();
  }

  // ---------------------------------------------------------------------------------------------------------
  // La boucle
  let dernier = performance.now(), courant = -1, arret = false, raf = 0, visible = true;
  const mesure = { t0: performance.now(), n: 0, lent: 0, rapide: 0, ips: 60 };
  ecoute(document, 'visibilitychange', () => { visible = !document.hidden; dernier = performance.now(); });
  const VITESSE_AUTO = reduit ? 0 : 0.42;   // unités de log-zoom par seconde (environ 8 s par niveau)

  let enBanc = false;
  function image(now) {
    if (!enBanc) raf = requestAnimationFrame(image);
    if (!visible) return;
    const dt = Math.max(0, Math.min(0.1, (now - dernier) / 1000)); dernier = Math.max(dernier, now);
    U.temps.value += dt * (reduit ? 0.6 : 1);
    // l'automatique, doux, quand on ne touche à rien
    const calme = (now - dernierGeste) / 1000;
    const auto = !enPause && VITESSE_AUTO > 0 && calme > 3.2 ? lisse(calme, 3.2, 5.5) : 0;
    tAuto = auto;
    if (auto > 0) Dc += dt * VITESSE_AUTO * auto / Mde(Dc);
    if (inertie && !doigts.size) { Dc = Math.max(0, Dc + inertie * dt / Mde(Dc)); inertie *= Math.exp(-dt / 0.32); if (Math.abs(inertie) < 0.02) inertie = 0; }
    // on suit la consigne, sans dépasser une vitesse raisonnable
    const tau = reduit ? 0.55 : 0.24;
    let pas = (Dc - D) * (1 - Math.exp(-dt / tau));
    const maxPas = dt * (reduit ? 5 : 10) / Mde(D);
    pas = Math.max(-maxPas, Math.min(maxPas, pas));
    D = Math.max(0, D + pas);
    par.x += (par.cx - par.x) * (1 - Math.exp(-dt / 0.6)); par.y += (par.cy - par.y) * (1 - Math.exp(-dt / 0.6));

    // les niveaux nécessaires
    const n = Math.floor(D), p = D - n;
    const ids = [idDe(n), idDe(n + 1), idDe(n + 2), idDe(n + 3)];
    const L0 = demander(ids[0]), L1 = demander(ids[1]), L2 = demander(ids[2]), L3 = demander(ids[3]);
    if (n > 0) demander(idDe(n - 1));
    // on libère ce qui est loin
    const garder = new Set([idDe(Math.max(0, n - 2)), idDe(Math.max(0, n - 1)), ...ids]);
    for (const id of [...niveaux.keys()]) if (!garder.has(id)) liberer1(id);
    opts.surProfondeur?.(D, logZoom(D), tAuto > 0.5);
    if (!L0 || !L1) { renderer.setRenderTarget(null); renderer.setClearColor('#05040c'); renderer.clear(); return; }
    if (post.material.uniforms.uVoile.value > 0) post.material.uniforms.uVoile.value = Math.max(0, post.material.uniforms.uVoile.value - dt * 2.5);
    if (n !== courant) { courant = n; opts.surNiveau?.(n, L0.info); }

    // 1. la caméra du niveau courant, et la taille de sa porte à l'écran
    poser(L0, p, cam, true);
    const s0 = sigma(L0, cam);
    const s1 = Math.min(1, Math.max(0.06, s0 * 1.25)) * (s0 > 0.97 ? 1 : Q.interieur);
    const v1w = Math.max(8, Math.round(Wp * Math.min(1, s1))), v1h = Math.max(8, Math.round(Hp * Math.min(1, s1)));
    // 2. le niveau d'après (n + 2), s'il est assez grand à l'écran
    const f2 = s0 * L1.sigma0;
    let tex1 = null, e1x = 1, e1y = 1, stat1 = true;
    if (L2 && f2 * Hp > 28) {
      const s2 = Math.min(0.6, Math.max(0.03, f2 * 1.3));
      const v2w = Math.max(8, Math.round(Wp * s2)), v2h = Math.max(8, Math.round(Hp * s2));
      if (L3?.page) brancher(L2, L3.page.material.map, 1, 1, true, L3.info.monde, L2.sigma0);
      else brancher(L2, null, 1, 1, true, '#000', L2.sigma0);
      L2.monde.maj?.(U.temps.value, { sigma: L2.sigma0, p: 0, actif: false });
      poser(L2, 0, camDepart, false);
      rendre(L2, camDepart, cibles.B, v2w, v2h);
      tex1 = cibles.B.texture; e1x = v2w / cibles.B.width; e1y = v2h / cibles.B.height; stat1 = false;
    } else if (L2?.page) tex1 = L2.page.material.map;
    else if (L2) tex1 = null;
    brancher(L1, tex1, e1x, e1y, stat1, L2?.info.monde ?? '#000', L1.sigma0);
    if (!tex1) L1.porte.mat.uniforms.uMode.value = 1;
    L1.monde.maj?.(U.temps.value, { sigma: L1.sigma0, p: 0, actif: false });
    poser(L1, 0, camDepart, false);
    rendre(L1, camDepart, cibles.A, v1w, v1h);
    // 3. le niveau courant
    brancher(L0, cibles.A.texture, v1w / Wp, v1h / Hp, false, null, s0);
    L0.monde.maj?.(U.temps.value, { sigma: s0, p, actif: true });
    poser(L0, p, cam, true);
    rendre(L0, cam, cibles.S, Wp, Hp);
    // 4. à l'écran (sur les toutes dernières images, fondu vers le niveau suivant : le relais est exact)
    const pu = post.material.uniforms;
    pu.uMixP.value = s0 >= 0.999 ? 1 : lisse(s0, 0.975, 0.999); pu.tPorte.value = cibles.A.texture; pu.uEchP.value.set(v1w / Wp, v1h / Hp);
    renderer.setRenderTarget(null);
    renderer.render(postScene, postCam);

    // la qualité adaptative
    if (!Q.fixe) qualite(now, dt);
  }
  function logZoom(d) {
    const n = Math.floor(d); let L = 0;
    for (let k = 0; k < n; k++) L += niveaux.get(idDe(k))?.M ?? Mcache[idDe(k)] ?? 3.6;
    return L + (d - n) * Mde(d);
  }
  const Mcache = {};
  setInterval(() => { for (const [id, n] of niveaux) Mcache[id] = n.M; }, 1000);

  function qualite(now, dt) {
    mesure.n++;
    const ecoule = now - mesure.t0;
    if (ecoule < 1500) return;
    const ips = mesure.n * 1000 / ecoule; mesure.ips = ips; mesure.n = 0; mesure.t0 = now;
    const cibleIps = mobile ? 40 : 52;
    if (ips < cibleIps * 0.85 && Q.q > Q.qmin) {
      mesure.lent++; mesure.rapide = 0;
      if (mesure.lent >= 1) { Q.q = Math.max(Q.qmin, Q.q * 0.84); if (Q.q < 0.7) { Q.msaa = 0; Q.interieur = 0.8; } changerQualite(); mesure.lent = 0; }
    } else if (ips > 57 && Q.q < (mobile ? 0.9 : 1)) {
      mesure.rapide++; mesure.lent = 0;
      if (mesure.rapide >= 3) { Q.q = Math.min(mobile ? 0.9 : 1, Q.q * 1.12); changerQualite(); mesure.rapide = 0; }
    } else { mesure.lent = 0; mesure.rapide = 0; }
  }
  function changerQualite() {
    const pr = Math.min(window.devicePixelRatio || 1, Q.cap) * Q.q;
    renderer.setPixelRatio(pr); renderer.setSize(W, H, false);
    Wp = Math.round(W * pr); Hp = Math.round(H * pr);
    for (const k of ['S', 'A', 'B']) cibles[k]?.dispose();
    cibles.S = cible(Wp, Hp, Q.msaa); cibles.A = cible(Wp, Hp, Q.msaa); cibles.B = cible(Math.ceil(Wp * 0.6), Math.ceil(Hp * 0.6), 0);
    post.material.uniforms.tScene.value = cibles.S.texture; post.material.uniforms.uRes.value.set(Wp, Hp);
  }

  // le départ : on attend les trois premiers niveaux
  for (const id of [idDe(0), idDe(1), idDe(2)]) demander(id);
  await Promise.all([...enCours.values()]);
  demander(idDe(3));
  raf = requestAnimationFrame(image);
  ecoute(toile, 'webglcontextlost', (e) => { e.preventDefault(); opts.surPerte?.(); });

  return {
    aller(d, immediat = true) { Dc = Math.max(0, d); if (immediat) D = Dc; dernierGeste = performance.now(); },
    pause(oui) { enPause = oui; if (!oui) dernierGeste = performance.now() - 3300; },
    etat: () => ({ D, Dc, n: Math.floor(D), id: idDe(Math.floor(D)), q: Q.q, ips: mesure.ips, auto: tAuto, pret: [...niveaux.keys()], W: Wp, H: Hp, msaa: Q.msaa, demi }),
    qualite(q) { Q.fixe = true; Q.q = q; changerQualite(); },
    /** Banc d'essai : n images rendues d'affilée, GPU attendu à chaque fois (gl.finish) ; renvoie la durée moyenne en ms. */
    banc(n = 60) {
      cancelAnimationFrame(raf); enBanc = true; const t0 = performance.now(); let t = t0;
      for (let k = 0; k < n; k++) { t += 16.7; image(t); gl.finish(); }
      const ms = (performance.now() - t0) / n; enBanc = false; dernier = performance.now(); raf = requestAnimationFrame(image); return ms;
    },
    attendre: async () => { await Promise.all([...enCours.values()]); },
    arreter() { arret = true; cancelAnimationFrame(raf); for (const [c, t, f, o] of evs) c.removeEventListener(t, f, o); toutLiberer(); renderer.dispose(); },
  };
}
