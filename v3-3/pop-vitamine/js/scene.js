// Pop vitaminé : les objets en scène.
// Deux « scènes » dans la page : l'affiche (accueil, objets qui flottent) et la boîte à jouets (contact, objets qui
// tombent au sol). Un seul moteur Three.js ; son canevas est posé DANS la scène visible (il défile avec la section,
// rien ne décroche au doigt) et passe de l'une à l'autre quand on fait défiler.
// Rendu : studio photo calculé (boîtes à lumière à bords doux, comme RoomEnvironment), ombres propres des objets
// (carte d'ombres douce), ombre portée de leur vraie silhouette sur le fond coloré, ombre de contact au sol.
// Les mêmes objets, photographiés une fois par le moteur, deviennent les autocollants des autres sections.
// Mode « sprites » (?rendu=sprites) : des images en 2,5D (photos déposées dans images/objets/, sinon les
// photographies du moteur), avec exactement la même physique. Sans WebGL : photos s'il y en a, sinon formes CSS.
import { Monde, brancherGestes } from './physique.js';
import { ECHELLE } from './objets.js';

const URL_THREE = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.170.0/three.module.min.js';

// ------------------------------------------------------------ placement des objets
function placementAffiche(L, H, n) {
  const tel = L <= 760;
  if (n > 3) {
    // atelier : tous les objets en grille, pour les regarder un à un
    const col = Math.ceil(Math.sqrt((n * L) / H)), lig = Math.ceil(n / col), s = Math.min(L / col, (H - 80) / lig) * 0.78;
    return Array.from({ length: n }, (_, i) => ({ x: (L / col) * ((i % col) + 0.5), y: 60 + ((H - 80) / lig) * (Math.floor(i / col) + 0.5), s }));
  }
  const pos = tel
    ? [[0.3, 0.23, Math.min(0.3 * H, 0.56 * L)], [0.78, 0.19, Math.min(0.19 * H, 0.34 * L)], [0.8, 0.37, Math.min(0.14 * H, 0.27 * L)]]
    : [[0.17, 0.53, Math.min(0.56 * H, 0.32 * L)], [0.845, 0.42, Math.min(0.4 * H, 0.23 * L)], [0.7, 0.8, Math.min(0.24 * H, 0.14 * L)]];
  return pos.slice(0, n).map(([x, y, s]) => ({ x: x * L, y: y * H, s }));
}
// la boîte à jouets : les objets tombent de juste au-dessus du sol (de derrière le coupon), pas du haut de la section
function placementBoite(L, H, n, haut = 0) {
  const s = L <= 760 ? Math.min(0.3 * L, 0.3 * H) : Math.min(0.19 * L, 0.36 * H, 250);
  return Array.from({ length: n }, (_, i) => ({ x: L * (0.14 + (0.72 * i) / Math.max(1, n - 1)), y: haut - s * (0.7 + i * 0.75), s: s * (i === 0 ? 1.12 : 1) }));
}

// ------------------------------------------------------------ studio photo calculé (environnement pour les reflets)
function studio(THREE, renderer, P) {
  const s = new THREE.Scene();
  const a = new THREE.Color(P.scenes.accueil[0]), b = new THREE.Color(P.scenes.accueil[1]);
  // la salle : sol teinté par le duo, murs gris, plafond plus clair
  s.add(new THREE.Mesh(new THREE.SphereGeometry(30, 48, 24), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    uniforms: { a: { value: a.clone().multiplyScalar(0.42) }, b: { value: b.clone().multiplyScalar(0.42) } },
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform vec3 a; uniform vec3 b; varying vec3 vP; void main(){ vec3 sol = mix(a, b, 0.5 + 0.5 * vP.x); vec3 c = mix(sol, vec3(0.3), smoothstep(-0.35, 0.15, vP.y)); c = mix(c, vec3(0.55), smoothstep(0.4, 1.0, vP.y)); gl_FragColor = vec4(c, 1.0); }',
  })));
  // boîtes à lumière à bords doux
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d'); g.filter = 'blur(9px)'; g.fillStyle = '#fff'; g.beginPath(); g.roundRect(18, 18, 92, 92, 18); g.fill();
  const tex = new THREE.CanvasTexture(c);
  const boite = (x, y, z, l, h, I, teinte = '#ffffff') => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(l, h), new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color(teinte).multiplyScalar(I), side: THREE.DoubleSide, toneMapped: false, transparent: true, depthWrite: false }));
    m.position.set(x, y, z); m.lookAt(0, 0, 0); s.add(m);
  };
  boite(-6.5, 6, 7, 8, 5.5, 5.5);                       // grande boîte principale, en haut à gauche
  boite(-10, 1.2, 0.5, 2, 11, 7);                       // bande verticale à gauche : long reflet sur les cylindres
  boite(10, 1.6, -1.5, 2, 11, 3.6, '#FFF0DC');          // bande chaude à droite
  boite(0, 11, 0, 11, 11, 2.4);                         // plafond
  boite(1.5, -0.5, 11, 9, 3.2, 1.15);                   // débouché de face
  boite(0, 2.5, -11, 13, 6, 1.5, P.scenes.accueil[1]);  // contre-jour coloré
  boite(0, -9, 1, 16, 16, 0.75, P.scenes.accueil[0]);   // rebond coloré du sol
  const pm = new THREE.PMREMGenerator(renderer);
  const env = pm.fromScene(s, 0.02).texture;
  pm.dispose();
  return env;
}

function ombreTexture(THREE) {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d'), r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  r.addColorStop(0, 'rgba(0,0,0,1)'); r.addColorStop(0.35, 'rgba(0,0,0,0.6)'); r.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = r; g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

// ------------------------------------------------------------ autocollants : bord blanc découpé autour de la silhouette
export function decouper(source, { bord = 0.035, marge = 0.02 } = {}) {
  // recadre sur la silhouette (alpha), puis ajoute un liseré blanc épais
  const l = source.width, h = source.height;
  const ctx = source.getContext('2d', { willReadFrequently: true });
  const px = ctx.getImageData(0, 0, l, h).data;
  let x0 = l, y0 = h, x1 = 0, y1 = 0;
  for (let y = 0; y < h; y += 2) for (let x = 0; x < l; x += 2) if (px[(y * l + x) * 4 + 3] > 10) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 <= x0) { x0 = 0; y0 = 0; x1 = l - 1; y1 = h - 1; }
  const w = x1 - x0 + 2, hh = y1 - y0 + 2;
  const objet = document.createElement('canvas'); objet.width = w; objet.height = hh;
  objet.getContext('2d').drawImage(source, x0, y0, w, hh, 0, 0, w, hh);
  const b = Math.round(Math.max(w, hh) * bord), m = Math.round(Math.max(w, hh) * marge);
  const auto = document.createElement('canvas'); auto.width = w + 2 * (b + m); auto.height = hh + 2 * (b + m);
  const g = auto.getContext('2d');
  for (let k = 0; k < 40; k++) { const a = (k / 40) * Math.PI * 2; for (const f of [1, 0.6]) g.drawImage(objet, b + m + Math.cos(a) * b * f, b + m + Math.sin(a) * b * f); }
  g.globalCompositeOperation = 'source-in'; g.fillStyle = '#ffffff'; g.fillRect(0, 0, auto.width, auto.height);
  g.globalCompositeOperation = 'source-over'; g.drawImage(objet, b + m, b + m);
  return { objet, autocollant: auto };
}
const enURL = (canvas) => new Promise((r) => canvas.toBlob((bl) => r(bl ? URL.createObjectURL(bl) : canvas.toDataURL('image/png')), 'image/png'));

// ------------------------------------------------------------ lancement
// mode : 'auto' (3D si possible), '3d', 'sprites'. Renvoie { pret, reveil, images } ; images : promesse d'un objet
// { nom: { objet: url, autocollant: url, l, h } } pour les autocollants des sections.
export async function lancerObjets({ P, d, liste, reduit, petit, sprites, mode = 'auto', besoinImages = [] }) {
  const etapes = [...document.querySelectorAll('.scene3d')].map((el) => ({
    el, type: el.classList.contains('scene3d-boite') ? 'boite' : 'affiche', noms: (el.dataset.objets || '').split(',').filter(Boolean),
  }));
  const besoin = [...new Set(etapes.flatMap((e) => e.noms))];
  const photos = sprites && besoin.every((n) => sprites[n]);
  let gl = false;
  try { const c = document.createElement('canvas'); gl = !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { gl = false; }
  const veutSprites = mode === 'sprites' || (mode === 'auto' && photos && !gl);
  if (!gl && !photos) { document.documentElement.classList.add('sans-gl'); return { pret: Promise.resolve(), images: Promise.resolve({}) }; }
  if (!etapes.length) return { pret: Promise.resolve(), images: Promise.resolve({}) };

  // physique : un monde par scène
  let reveil = () => {};
  for (const e of etapes) {
    e.monde = new Monde({ gravite: e.type === 'boite' ? 2300 : 0, reduit });
    e.vu = false; e.visible = false;
    e.corps = e.noms.map((nom, i) => e.monde.ajouter({ nom, i, hx: 0, hy: 0, s: 100, apparition: 0, vApp: 0, cache: e.type === 'boite' }));
    brancherGestes(e.el, e.monde, { reveil: () => reveil() });
  }
  const mesurer = () => {
    for (const e of etapes) {
      const r = e.el.getBoundingClientRect();
      e.L = r.width; e.H = r.height;
      let sol = null, haut = 0;
      if (e.type === 'boite') {
        const s = e.el.parentElement.querySelector('.boite-sol');
        sol = s ? s.getBoundingClientRect().bottom - r.top : e.H;
        haut = s ? s.getBoundingClientRect().top - r.top : 0;
      }
      e.monde.bornes(e.L, e.H, sol);
      const pl = e.type === 'boite' ? placementBoite(e.L, e.H, e.corps.length, haut) : placementAffiche(e.L, e.H, e.corps.length);
      e.corps.forEach((c, i) => {
        const p = pl[i] || pl[pl.length - 1];
        c.s = p.s;
        const [px, py] = c.proportions || [0.8, 1];
        c.wx = 0.5 * c.s * (c.echelle || 1) * px * 0.9; c.wy = 0.5 * c.s * (c.echelle || 1) * py * 0.92;
        c.r = Math.max(c.wx, c.wy); c.bas = c.wy / c.r;
        c.hx = p.x; c.hy = p.y;
        if (e.type === 'affiche' && !c.place) { c.x = p.x; c.y = p.y; c.place = true; }
        if (e.type === 'boite' && !e.vu) { c.x = p.x; c.y = p.y; }
      });
    }
  };

  // ------------------------------------------------------------ rendu : Three.js, ou images en 2,5D
  let rendu, images;
  if (veutSprites && photos) {
    const im = Object.fromEntries(Object.entries(sprites).map(([k, s]) => [k, { objet: s.variantes?.[P.id] || s.fichier, l: s.l, h: s.h, etiquette: s.etiquette }]));
    rendu = rendreSprites(etapes, im, d);
    images = photosEnAutocollants(im, besoinImages);
  } else {
    const moteur = await moteur3D(etapes, { P, d, liste, petit, reduit });
    images = moteur.photographier([...new Set([...besoinImages, ...(veutSprites ? besoin : [])])]);
    if (veutSprites) {
      const im = await images;
      moteur.liberer();
      rendu = rendreSprites(etapes, im, d);
    } else rendu = moteur;
  }
  mesurer();
  new ResizeObserver(() => { mesurer(); rendu.mesurer?.(); reveil(); }).observe(document.getElementById('contenu'));

  // visibilité : on n'anime que ce qui se voit ; la boîte à jouets se remplit à la première vue
  for (const e of etapes) e.declencheur = (e.type === 'boite' && e.el.parentElement.querySelector('.boite-sol')) || e.el;
  const io = new IntersectionObserver((es) => {
    for (const x of es) {
      const e = etapes.find((s) => s.el === x.target || s.declencheur === x.target);
      if (x.target === e.el) e.visible = x.isIntersecting;
      if (x.target === e.declencheur && x.isIntersecting && !e.vu) {
        e.visible = true;
        e.vu = true;
        e.corps.forEach((c, i) => { c.cache = false; c.retard = e.monde.t + (reduit ? 0.08 : 0.16) * i; });
      }
    }
    reveil();
  }, { threshold: 0.08 });
  etapes.forEach((e) => { io.observe(e.el); if (e.declencheur !== e.el) io.observe(e.declencheur); });

  let enCours = false, tPrec = 0, calme = 0;
  reveil = () => { calme = 0; if (!enCours) { enCours = true; tPrec = performance.now(); requestAnimationFrame(image); } };
  function image(now) {
    const dt = Math.min(0.05, Math.max(0.001, (now - tPrec) / 1000)); tPrec = now;
    let actif = false;
    for (const e of etapes) {
      if (!e.visible) continue;
      actif = true;
      e.monde.pas(dt);
      for (const c of e.corps) {
        if (c.cache) continue;
        // apparition à ressort (pop !), plus douce et sans rebond en mouvement réduit
        if (e.monde.t >= (c.retard || 0)) {
          const k = reduit ? 90 : 120, z = reduit ? 1 : 0.42;
          c.vApp += (k * (1 - c.apparition) - 2 * Math.sqrt(k) * z * c.vApp) * dt; c.apparition += c.vApp * dt;
        }
      }
    }
    rendu.dessiner(etapes, dt);
    calme = actif ? 0 : calme + 1;
    if (calme < 10) requestAnimationFrame(image); else enCours = false;
  }
  reveil();
  window.__pop = {
    mode: veutSprites ? 'sprites' : '3d', photos: !!photos,
    etat: () => etapes.map((e) => ({ type: e.type, L: e.L, H: e.H, sol: e.monde.sol, visible: e.visible, corps: e.corps.map((c) => ({ nom: c.nom, x: Math.round(c.x), y: Math.round(c.y), s: Math.round(c.s), r: Math.round(c.r), app: +c.apparition.toFixed(2), prop: c.proportions?.map((v) => +v.toFixed(2)) })) })),
  };
  // prêt quand les autocollants sont photographiés (le canevas est alors libre pour la scène)
  return { pret: rendu.pret || images.then(() => {}, () => {}), reveil, images };
}

// ------------------------------------------------------------ moteur 3D
async function moteur3D(etapes, { P, d, liste, petit, reduit }) {
  const THREE = await import(URL_THREE);
  const { fabrique } = await import('./objets.js');
  await document.fonts?.load('800 100px Bricolage');
  const leger = petit || (navigator.hardwareConcurrency || 8) <= 4;
  const canvas = document.createElement('canvas');
  canvas.className = 'toile3d';
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance', premultipliedAlpha: true });
  renderer.setClearColor(0x000000, 0);
  const dpr = Math.min(window.devicePixelRatio || 1, leger ? 1.6 : 2);
  renderer.setPixelRatio(dpr);
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.autoClear = false;
  await new Promise((r) => setTimeout(r, 0));
  const env = studio(THREE, renderer, P);
  const camera = new THREE.PerspectiveCamera(24, 1, 0.1, 100);
  camera.position.set(0, 0, 12);
  const hautVue = 2 * 12 * Math.tan(THREE.MathUtils.degToRad(12));
  const texOmbre = ombreTexture(THREE);
  const B = fabrique(THREE, P, d, { leger, nomme: liste.nomme });
  const lumiere = (scene) => {
    const cle = new THREE.DirectionalLight('#fff8ef', 1.7); cle.position.set(-4.5, 7, 7.5);
    cle.castShadow = true; cle.shadow.mapSize.set(leger ? 1024 : 2048, leger ? 1024 : 2048);
    cle.shadow.bias = -0.0004; cle.shadow.normalBias = 0.018; cle.shadow.radius = 3;
    const oc = cle.shadow.camera; oc.near = 1; oc.far = 30; oc.left = -6; oc.right = 6; oc.top = 4; oc.bottom = -4;
    scene.add(cle, cle.target);
    return cle;
  };
  for (const e of etapes) {
    e.scene = new THREE.Scene();
    e.scene.environment = env;
    e.cle = lumiere(e.scene);
    for (const c of e.corps) {
      // on rend la main au navigateur entre deux objets : le chargement peut s'ouvrir à l'heure même si la machine est lente
      await new Promise((r) => setTimeout(r, 0));
      const obj = (B[c.nom] || B.plante).call(B);
      c.proportions = obj.userData.proportions;
      c.echelle = ECHELLE[c.nom] ?? 1;
      const pivot = new THREE.Group(); pivot.add(obj);
      const ombre = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: texOmbre, color: '#000000', transparent: true, depthWrite: false, opacity: 0 }));
      ombre.renderOrder = -1;
      e.scene.add(ombre, pivot);
      c.obj = obj; c.pivot = pivot; c.ombre = ombre; c.anime = obj.userData.anime || [];
      // pose de trois quarts, chaque objet un peu différemment
      c.poseX = 0.08 + (c.i % 2) * 0.08; c.poseY = -0.3 + c.i * 0.38; c.poseZ = (c.i % 2 ? -1 : 1) * 0.05;
    }
  }

  // ---- ombre portée de la vraie silhouette (affiche) : silhouettes en noir, flou séparable, posées derrière, décalées
  const rtA = new THREE.WebGLRenderTarget(4, 4), rtB = new THREE.WebGLRenderTarget(4, 4);
  const noir = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const plein = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
  const scPlein = new THREE.Scene(); scPlein.add(plein);
  const camPlein = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const vs = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
  const flou = new THREE.ShaderMaterial({
    uniforms: { carte: { value: null }, pas: { value: new THREE.Vector2() } }, depthTest: false, depthWrite: false, vertexShader: vs,
    fragmentShader: 'uniform sampler2D carte; uniform vec2 pas; varying vec2 vUv; void main(){ float w0 = 0.2270270270, w1 = 0.3162162162, w2 = 0.0702702703; float a = texture2D(carte, vUv).a * w0 + (texture2D(carte, vUv + pas * 1.3846).a + texture2D(carte, vUv - pas * 1.3846).a) * w1 + (texture2D(carte, vUv + pas * 3.2308).a + texture2D(carte, vUv - pas * 3.2308).a) * w2; gl_FragColor = vec4(0.0, 0.0, 0.0, a); }',
  });
  const pose = new THREE.ShaderMaterial({
    uniforms: { carte: { value: null }, decal: { value: new THREE.Vector2(0.012, -0.03) }, force: { value: 0.3 } }, transparent: true, depthTest: false, depthWrite: false, vertexShader: vs,
    fragmentShader: 'uniform sampler2D carte; uniform vec2 decal; uniform float force; varying vec2 vUv; void main(){ float a = texture2D(carte, vUv - decal).a * force; gl_FragColor = vec4(0.0, 0.0, 0.0, a); }',
  });
  const ombrePortee = (e) => {
    const masques = [];
    for (const c of e.corps) { masques.push(c.ombre); c.ombre.visible = false; for (const a of c.anime) { masques.push(a); a.visible = false; } }
    e.scene.overrideMaterial = noir;
    renderer.setRenderTarget(rtA); renderer.setClearColor(0x000000, 0); renderer.clear(); renderer.render(e.scene, camera);
    e.scene.overrideMaterial = null;
    for (const m of masques) m.visible = true;
    plein.material = flou;
    const passes = leger ? 1 : 2, ech = 1.6;
    for (let i = 0; i < passes; i++) {
      flou.uniforms.carte.value = rtA.texture; flou.uniforms.pas.value.set(ech / rtA.width, 0); renderer.setRenderTarget(rtB); renderer.clear(); renderer.render(scPlein, camPlein);
      flou.uniforms.carte.value = rtB.texture; flou.uniforms.pas.value.set(0, ech / rtA.height); renderer.setRenderTarget(rtA); renderer.clear(); renderer.render(scPlein, camPlein);
    }
    renderer.setRenderTarget(null);
    plein.material = pose; pose.uniforms.carte.value = rtA.texture;
    renderer.render(scPlein, camPlein);
  };

  // compiler maintenant (pendant le chargement), pas au premier défilement
  for (const e of etapes) { await new Promise((r) => setTimeout(r, 0)); renderer.compile(e.scene, camera); }
  let active = null, taille = [0, 0];
  const regler = (L, H) => {
    renderer.setSize(Math.max(1, L), Math.max(1, H), false);
    camera.aspect = L / H; camera.updateProjectionMatrix();
    const w = Math.max(4, Math.round(L * dpr / 4)), h = Math.max(4, Math.round(H * dpr / 4));
    rtA.setSize(w, h); rtB.setSize(w, h);
    for (const e of etapes) { const oc = e.cle.shadow.camera, demi = hautVue / 2 + 0.8; oc.top = demi; oc.bottom = -demi; oc.left = -demi * camera.aspect; oc.right = demi * camera.aspect; oc.updateProjectionMatrix(); }
    taille = [L, H];
  };
  const attacher = (e) => {
    if (active === e && taille[0] === e.L && taille[1] === e.H) return;
    active = e;
    if (canvas.parentElement !== e.el) e.el.appendChild(canvas);
    regler(e.L, e.H);
  };

  // ---- photographies des objets (autocollants, mode sprites) : une fois, sur le même canevas, pendant le chargement
  let enPhoto = false;
  async function photographier(noms) {
    const sortie = {};
    if (!noms.length) return sortie;
    enPhoto = true;
    const sc = new THREE.Scene(); sc.environment = env; const cle = lumiere(sc);
    const T = leger ? 420 : 560;
    regler(T / dpr, T / dpr);
    const oc = cle.shadow.camera; oc.left = oc.bottom = -3.2; oc.right = oc.top = 3.2; oc.updateProjectionMatrix();
    for (const nom of noms) {
      let c = null;
      for (const e of etapes) { c = c || e.corps.find((x) => x.nom === nom); }
      let obj = c?.obj, parent = obj?.parent, propre = false;
      if (!obj) { obj = (B[nom] || B.plante).call(B); propre = true; }
      const sauve = { p: obj.position.clone(), r: obj.rotation.clone(), s: obj.scale.clone() };
      const tenant = new THREE.Group(); tenant.add(obj); sc.add(tenant);
      obj.position.set(0, 0, 0); obj.scale.setScalar(1); obj.rotation.set(0.1, -0.3, 0.04);
      const boite = new THREE.Box3().setFromObject(tenant), t = new THREE.Vector3(), centre = new THREE.Vector3();
      boite.getSize(t); boite.getCenter(centre);
      const f = (hautVue * 0.86) / Math.max(t.x, t.y);
      tenant.scale.setScalar(f); tenant.position.copy(centre.multiplyScalar(-f));
      // la vapeur ne se photographie pas (sur un autocollant, elle ferait une traînée blanche) ; la flamme, si
      for (const a of obj.userData.anime || []) { a.userData.mat.uniforms.uTemps.value = 1.3; const q = new THREE.Quaternion(); a.parent.getWorldQuaternion(q); a.quaternion.copy(q.invert()); a.visible = !a.userData.vapeur; }
      renderer.shadowMap.needsUpdate = true;
      renderer.setRenderTarget(null); renderer.setClearColor(0x000000, 0); renderer.clear(); renderer.render(sc, camera);
      const copie = document.createElement('canvas'); copie.width = canvas.width; copie.height = canvas.height;
      copie.getContext('2d').drawImage(canvas, 0, 0);
      for (const a of obj.userData.anime || []) a.visible = true;
      sc.remove(tenant); tenant.remove(obj);
      obj.position.copy(sauve.p); obj.rotation.copy(sauve.r); obj.scale.copy(sauve.s);
      if (parent && !propre) parent.add(obj);
      const { objet, autocollant } = decouper(copie);
      sortie[nom] = { objet: await enURL(objet), autocollant: await enURL(autocollant), l: objet.width, h: objet.height, la: autocollant.width, ha: autocollant.height };
    }
    renderer.clear();
    active = null; taille = [0, 0]; enPhoto = false;
    return sortie;
  }

  const tmp = new THREE.Quaternion();
  let t = 0;
  return {
    photographier,
    liberer() { renderer.dispose(); renderer.forceContextLoss?.(); canvas.remove(); },
    mesurer() { if (active) regler(active.L, active.H); },
    dessiner(toutes, dt) {
      t += dt;
      // la scène la plus visible prend le canevas (les deux ne sont jamais à l'écran en même temps)
      // pendant la séance photo des autocollants, le canevas est au studio : on attend
      const vis = toutes.filter((e) => e.visible);
      if (!vis.length || enPhoto) return;
      attacher(vis[0]);
      const e = active;
      const k = hautVue / e.H;
      for (const c of e.corps) {
        const visible = !c.cache && c.apparition > 0.001;
        c.pivot.visible = visible; c.ombre.visible = visible && e.type === 'boite';
        if (!visible) continue;
        const s = c.s * c.echelle * k * Math.max(0.0001, c.apparition) * c.presse;
        c.pivot.position.set((c.x - e.L / 2) * k, -(c.y - e.H / 2) * k, 0);
        c.pivot.scale.setScalar(s);
        c.obj.rotation.set(c.poseX + c.vy * 0.00012, c.poseY + c.spin, c.poseZ + c.a * 0.55 - c.vx * 0.00012);
        if (e.type === 'boite') {
          // ombre de contact au sol, plus nette quand l'objet s'en approche
          const sol = e.monde.sol ?? e.H;
          const haut = Math.max(0, sol - (c.y + c.wy));
          const largeur = s * Math.max(0.55, c.proportions?.[0] ?? 0.8);
          c.ombre.position.set(c.pivot.position.x, -(sol - e.H / 2) * k + s * 0.015, -0.6);
          c.ombre.scale.set(largeur * (1.15 + haut / 380), s * 0.16, 1);
          c.ombre.material.opacity = 0.42 * Math.max(0, 1 - haut / 320) * Math.min(1, c.apparition);
        }
        for (const a of c.anime) {
          a.userData.mat.uniforms.uTemps.value = t;
          // flamme et vapeur toujours tournées vers nous
          a.parent.getWorldQuaternion(tmp); a.quaternion.copy(tmp.invert());
        }
      }
      renderer.setRenderTarget(null); renderer.setClearColor(0x000000, 0); renderer.clear();
      if (e.type === 'affiche') ombrePortee(e);
      renderer.shadowMap.needsUpdate = true;
      renderer.render(e.scene, camera);
    },
  };
}

// photos déposées : on leur fait aussi un liseré d'autocollant
async function photosEnAutocollants(im, noms) {
  const sortie = {};
  for (const nom of noms) {
    const s = im[nom]; if (!s) continue;
    const img = new Image(); img.src = s.objet; img.decoding = 'async';
    try { await img.decode(); } catch { continue; }
    const c = document.createElement('canvas'); const f = Math.min(1, 640 / Math.max(img.naturalWidth, img.naturalHeight));
    c.width = Math.round(img.naturalWidth * f); c.height = Math.round(img.naturalHeight * f);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    const { autocollant } = decouper(c);
    sortie[nom] = { ...s, autocollant: await enURL(autocollant), la: autocollant.width, ha: autocollant.height };
  }
  return sortie;
}

// ------------------------------------------------------------ images en 2,5D (mode « sprites »)
function rendreSprites(etapes, im, d) {
  document.documentElement.classList.add('mode-sprites');
  for (const e of etapes) {
    for (const c of e.corps) {
      const S = im[c.nom] || Object.values(im)[0];
      c.proportions = S.l > S.h ? [1, S.h / S.l] : [S.l / S.h, 1];
      c.echelle = (ECHELLE[c.nom] ?? 1) * 1.04;
      const bloc = document.createElement('div'); bloc.className = 'sprite';
      const img = document.createElement('img'); img.src = S.objet; img.alt = ''; img.draggable = false; img.decoding = 'async';
      bloc.appendChild(img);
      if (S.etiquette && c.nom === (e.el.closest('main')?.dataset.nomme || '')) {
        const [x0, y0, x1, y1] = S.etiquette;
        const et = document.createElement('div'); et.className = 'sprite-etiquette';
        et.style.cssText = `left:${x0 * 100}%;top:${y0 * 100}%;width:${(x1 - x0) * 100}%;height:${(y1 - y0) * 100}%`;
        const net = (s) => String(s || '').replace(/[<>&]/g, '');
        et.innerHTML = `<b>${net(d.initiales)}</b><span>${net(d.metier)}</span><i>${net(d.ville)}</i>`;
        bloc.appendChild(et);
      }
      const ombre = document.createElement('div'); ombre.className = 'sprite-ombre';
      e.el.append(ombre, bloc);
      c.bloc = bloc; c.ombreEl = ombre;
    }
  }
  return {
    dessiner(toutes) {
      for (const e of toutes) {
        if (!e.visible) continue;
        for (const c of e.corps) {
          const vis = !c.cache && c.apparition > 0.001;
          c.bloc.style.visibility = c.ombreEl.style.visibility = vis ? 'visible' : 'hidden';
          if (!vis) continue;
          const l = c.s * c.echelle * c.proportions[0], h = c.s * c.echelle * c.proportions[1];
          const s = Math.max(0.0001, c.apparition) * c.presse;
          // 2,5D : rotation dans le plan, et un quart de tour en profondeur qui suit la rotation de l'objet (sans jamais montrer son dos)
          const ry = Math.sin(c.spin) * 26, rx = Math.max(-14, Math.min(14, -c.vy * 0.006));
          c.bloc.style.width = `${l}px`; c.bloc.style.height = `${h}px`;
          c.bloc.style.transform = `translate3d(${(c.x - l / 2).toFixed(1)}px,${(c.y - h / 2).toFixed(1)}px,0) perspective(${Math.round(l * 3)}px) rotate(${(c.a * 0.8).toFixed(4)}rad) rotateY(${ry.toFixed(2)}deg) rotateX(${rx.toFixed(2)}deg) scale(${s.toFixed(4)})`;
          if (e.type === 'boite') {
            const sol = e.monde.sol ?? e.H, haut = Math.max(0, sol - (c.y + c.wy));
            c.ombreEl.style.width = `${l * 1.1}px`; c.ombreEl.style.height = `${l * 0.22}px`;
            c.ombreEl.style.opacity = (Math.max(0, 1 - haut / 320) * Math.min(1, c.apparition)).toFixed(3);
            c.ombreEl.style.transform = `translate3d(${(c.x - l * 0.55).toFixed(1)}px,${(sol - l * 0.11).toFixed(1)}px,0) scale(${(1 + haut / 380).toFixed(3)})`;
          } else c.ombreEl.style.visibility = 'hidden';
        }
      }
    },
  };
}
