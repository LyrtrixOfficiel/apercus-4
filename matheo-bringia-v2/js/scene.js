// Mathéo Bringia : la scène 3D, fixe derrière toute la page. three.js 0.170.0.
// Elle ne montre AUCUN kart ni personnage (ce sont les vraies images) : seulement l'ENVIRONNEMENT d'une piste de nuit.
//  - l'asphalte : grain de l'enrobé, trajectoire gommée plus sombre, lignes blanches, vibreurs orange et blancs,
//    quadrillage de télémétrie, cases de la grille de départ ;
//  - la lumière : une nappe orange devant la caméra, la lueur de l'horizon et les projecteurs au loin ;
//  - les lignes de vitesse (qui filent plus vite quand on défile vite) et les particules de gomme.
// La caméra avance quand on défile (on « roule » le long de la page) ; chaque partie de la page a son ambiance
// (hauteur, inclinaison, lumière, densité des lignes...), mélangée en douceur d'une partie à l'autre.
// Tous les nuanceurs commencent par « precision highp float » (puces Adreno).
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/+esm';

const HP = 'precision highp float;\nprecision highp int;\n';

const SOL_V = HP + `
varying vec3 vMonde;
void main() {
  vec4 m = modelMatrix * vec4(position, 1.0);
  vMonde = m.xyz;
  gl_Position = projectionMatrix * viewMatrix * m;
}`;

const SOL_F = HP + `
uniform vec3 uCam;
uniform vec3 uTeinte;
uniform float uLumiere, uGrille, uQuad, uBordures, uTemps, uBrouillard, uDetail;
uniform vec3 uFond;
varying vec3 vMonde;

float h21(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float bruit(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y);
}
// une ligne nette d'épaisseur e (en mètres), adoucie selon la distance pour ne pas scintiller
float ligne(float d, float e, float flou) { return 1.0 - smoothstep(e * 0.5, e * 0.5 + flou, abs(d)); }

void main() {
  vec2 p = vMonde.xz;
  float dist = length(vMonde - uCam);
  float flou = 0.02 + dist * 0.0035;
  // l'enrobé : grain fin (fondu au loin) et taches plus larges
  float grain = bruit(p * 9.0) * 0.55 + bruit(p * 23.0) * 0.45;
  float tache = bruit(p * 0.35) * 0.6 + bruit(p * 1.3) * 0.4;
  float detail = clamp(1.0 - dist / (38.0 * uDetail + 6.0), 0.0, 1.0);
  vec3 col = vec3(0.052, 0.055, 0.06) * (0.78 + 0.35 * tache);
  col *= mix(1.0, 0.72 + 0.56 * grain, detail * 0.85);
  // gravillons clairs épars
  float gr = step(0.985, h21(floor(p * 34.0))) * detail;
  col += vec3(0.05) * gr;
  // la piste : 10 m de large ; dehors, plus sombre
  float ax = abs(p.x);
  float dehors = smoothstep(5.6, 6.4, ax);
  col *= mix(1.0, 0.45, dehors);
  // la trajectoire gommée (plus sombre, satinée)
  float traj = 1.6 * sin(p.y * 0.045) + 0.8 * sin(p.y * 0.11 + 1.3);
  float gomme = exp(-pow((p.x - traj) / 1.25, 2.0));
  col *= 1.0 - 0.38 * gomme;
  // les lignes blanches du bord et les vibreurs
  float bord = ligne(ax - 5.0, 0.14, flou);
  col = mix(col, vec3(0.62, 0.61, 0.58), bord * 0.8);
  float vib = step(5.08, ax) * (1.0 - step(5.9, ax));
  float bande = step(0.5, fract(p.y / 2.2));
  vec3 cVib = mix(vec3(0.85, 0.83, 0.8), vec3(1.0, 0.33, 0.06), bande);
  col = mix(col, cVib * 0.5, vib * uBordures * (1.0 - smoothstep(40.0, 90.0, dist)));
  // les cases de la grille de départ : deux colonnes décalées, une case tous les 8 m
  float rang = floor(p.y / 8.0);
  float decal = mod(rang, 2.0) * 4.0;
  float zl = mod(p.y + decal, 8.0);
  float colonne = (p.x < 0.0) ? -2.4 : 2.4;
  float cote = (p.x < 0.0) ? 0.0 : 4.0;
  float zc = mod(p.y + cote, 8.0);
  float caseH = ligne(zc - 1.0, 0.16, flou) * step(abs(p.x - colonne), 1.3);
  float caseV = ligne(abs(p.x - colonne) - 1.3, 0.14, flou) * step(zc, 1.0 + 0.08) * step(1.0 - 1.6, zc);
  float cases = max(caseH, caseV);
  col = mix(col, vec3(0.86, 0.85, 0.82), cases * uGrille * 0.9);
  // le quadrillage de télémétrie (fin, orange, tous les 4 m)
  vec2 q = abs(fract(p / 4.0 + 0.5) - 0.5) * 4.0;
  float quad = max(ligne(q.x, 0.035, flou * 0.8), ligne(q.y, 0.035, flou * 0.8));
  float quadFort = max(ligne(abs(fract(p.x / 20.0 + 0.5) - 0.5) * 20.0, 0.07, flou), ligne(abs(fract(p.y / 20.0 + 0.5) - 0.5) * 20.0, 0.07, flou));
  col += uTeinte * (quad * 0.16 + quadFort * 0.3) * uQuad * (1.0 - smoothstep(30.0, 90.0, dist));
  // la nappe de lumière devant la caméra
  vec2 c = uCam.xz + vec2(0.0, -11.0);
  float nappe = exp(-dot(p - c, p - c) / (90.0 + 70.0 * uLumiere));
  float nappeLarge = exp(-dot(p - c, p - c) / 900.0);
  col += uTeinte * (nappe * 0.1 + nappeLarge * 0.018) * uLumiere * (0.8 + 0.4 * grain * detail);
  // un reflet satiné, plus fort sur la gomme
  float vue = clamp(1.0 - abs(normalize(vMonde - uCam).y) * 2.2, 0.0, 1.0);
  col += uTeinte * vue * vue * vue * (0.01 + 0.03 * gomme) * uLumiere;
  // brouillard vers le fond
  float b = 1.0 - exp(-dist * uBrouillard);
  col = mix(col, uFond, b);
  gl_FragColor = vec4(col, 1.0);
}`;

const CIEL_V = HP + `
varying vec3 vDir;
void main() {
  vec4 m = modelMatrix * vec4(position, 1.0);
  vDir = m.xyz - cameraPosition;
  gl_Position = projectionMatrix * viewMatrix * m;
}`;
const CIEL_F = HP + `
uniform vec3 uTeinte, uFond;
uniform float uHorizon, uTemps;
varying vec3 vDir;
float h11(float x) { return fract(sin(x * 127.1) * 43758.5453); }
void main() {
  vec3 d = normalize(vDir);
  float y = d.y;
  vec3 col = uFond;
  float lueur = exp(-abs(y) * 7.0) * 0.06 + exp(-abs(y) * 45.0) * 0.24;
  col += uTeinte * lueur * uHorizon;
  // les projecteurs au loin : des points chauds sur l'horizon
  float a = atan(d.x, -d.z);
  float k = floor(a * 18.0);
  float f = fract(a * 18.0) - 0.5;
  float on = step(0.72, h11(k));
  float haut = 0.02 + 0.03 * h11(k + 7.0);
  float pt = exp(-(f * f) * 900.0) * exp(-pow((y - haut) * 120.0, 2.0)) * on;
  col += mix(vec3(1.0, 0.85, 0.7), uTeinte, 0.4) * pt * 1.4 * uHorizon;
  gl_FragColor = vec4(col, 1.0);
}`;

const LIGNES_V = HP + `
attribute vec4 aInst;   // x, y, phase, longueur
attribute vec2 aInst2;  // vitesse, teinte
uniform float uTemps, uDefile, uEtendue, uLargeur;
uniform vec3 uCam;
uniform vec2 uEcran;
varying float vT;
varying float vTeinte;
varying float vFondu;
void main() {
  // position du segment, relative à la caméra : il file vers nous et revient au fond
  float z = mod(aInst.z - uDefile * aInst2.x, uEtendue);
  vec3 tete = vec3(aInst.x, aInst.y, -z) + uCam;
  tete.y = max(tete.y, 0.06);
  vec3 queue = tete + vec3(0.0, 0.0, -aInst.w);
  queue.y = tete.y;
  vec4 a = projectionMatrix * viewMatrix * vec4(tete, 1.0);
  vec4 b = projectionMatrix * viewMatrix * vec4(queue, 1.0);
  // un segment qui passe derrière la caméra est replié
  if (a.w < 0.2) a = b + (a - b) * ((b.w - 0.2) / max(b.w - a.w, 1e-3));
  vec2 sa = a.xy / a.w * uEcran, sb = b.xy / b.w * uEcran;
  vec2 dir = normalize(sb - sa + vec2(1e-5));
  vec2 nrm = vec2(-dir.y, dir.x);
  float bout = position.x;           // 0 tête, 1 queue
  float cote = position.y;           // -1, 1
  vec4 p = mix(a, b, bout);
  float larg = uLargeur * mix(1.0, 0.35, bout) * clamp(3.0 / p.w, 0.25, 2.2);
  p.xy += nrm * cote * larg / uEcran * p.w;
  gl_Position = p;
  vT = bout;
  vTeinte = aInst2.y;
  vFondu = smoothstep(0.0, 0.12, z / uEtendue) * (1.0 - smoothstep(0.7, 1.0, z / uEtendue));
}`;
const LIGNES_F = HP + `
uniform vec3 uTeinte;
uniform float uForce;
varying float vT;
varying float vTeinte;
varying float vFondu;
void main() {
  float a = (1.0 - vT) * vFondu * uForce;
  vec3 c = mix(vec3(1.0, 0.96, 0.9), uTeinte * 1.4, vTeinte);
  gl_FragColor = vec4(c * a, a);
}`;

const GOMME_V = HP + `
attribute vec4 aG;     // position de base x, y, z, graine
uniform float uTemps, uDefile, uTaille, uEtendue;
uniform vec3 uCam;
varying float vGraine;
varying float vFondu;
void main() {
  vec3 p = aG.xyz;
  p.z = mod(p.z + uTemps * (2.0 + aG.w * 3.0) + uDefile * 0.6, uEtendue) - uEtendue;
  p.y += sin(uTemps * 0.6 + aG.w * 30.0) * 0.25;
  p.x += cos(uTemps * 0.4 + aG.w * 17.0) * 0.3;
  vec3 m = vec3(p.x + uCam.x, p.y, p.z + uCam.z);
  vec4 v = viewMatrix * vec4(m, 1.0);
  gl_Position = projectionMatrix * v;
  gl_PointSize = uTaille * (0.5 + aG.w) / max(-v.z, 0.5);
  vGraine = aG.w;
  vFondu = smoothstep(-uEtendue, -uEtendue * 0.8, p.z) * smoothstep(0.0, -2.0, p.z);
}`;
const GOMME_F = HP + `
uniform vec3 uTeinte;
uniform float uForce;
varying float vGraine;
varying float vFondu;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float r = length(c);
  if (r > 0.5) discard;
  float coeur = smoothstep(0.5, 0.0, r);
  float bord = smoothstep(0.5, 0.3, r) - smoothstep(0.3, 0.1, r);
  vec3 col = mix(vec3(0.02), uTeinte, bord * (0.4 + vGraine * 0.6));
  col += uTeinte * 0.25 * coeur * step(0.82, vGraine);
  float a = coeur * vFondu * uForce * (0.35 + 0.65 * vGraine);
  gl_FragColor = vec4(col * a, a);
}`;

/**
 * @param {object} o
 * @param {HTMLCanvasElement} o.canvas
 * @param {boolean} o.reduit   mouvement réduit : la même scène, plus lente et plus douce
 * @param {boolean} o.mobile
 * @param {() => {amb: object, y: number, vitesse: number}} o.etat  l'ambiance mélangée, la position et la vitesse de défilement
 */
export function lancerScene({ canvas, reduit = false, mobile = false, etat }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !mobile, alpha: false, powerPreference: 'high-performance', precision: 'highp' });
  renderer.setClearColor(0x060708, 1);
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 600);
  const fond = new THREE.Color(0.024, 0.027, 0.032);
  const teinte = new THREE.Color(1.0, 0.36, 0.09);

  // le ciel
  const ciel = new THREE.Mesh(new THREE.SphereGeometry(400, 32, 16), new THREE.ShaderMaterial({
    vertexShader: CIEL_V, fragmentShader: CIEL_F, side: THREE.BackSide, depthWrite: false,
    uniforms: { uTeinte: { value: teinte }, uFond: { value: fond }, uHorizon: { value: 1 }, uTemps: { value: 0 } },
  }));
  ciel.renderOrder = -2;
  scene.add(ciel);

  // le sol : un grand plan qui suit la caméra (le motif est calculé dans le monde, il ne glisse pas)
  const solMat = new THREE.ShaderMaterial({
    vertexShader: SOL_V, fragmentShader: SOL_F,
    uniforms: {
      uCam: { value: new THREE.Vector3() }, uTeinte: { value: teinte }, uFond: { value: fond },
      uLumiere: { value: 1 }, uGrille: { value: 0 }, uQuad: { value: 0 }, uBordures: { value: 1 }, uTemps: { value: 0 },
      uBrouillard: { value: 0.03 }, uDetail: { value: mobile ? 0.7 : 1 },
    },
  });
  const sol = new THREE.Mesh(new THREE.PlaneGeometry(700, 700, 1, 1), solMat);
  sol.rotation.x = -Math.PI / 2;
  scene.add(sol);

  // les lignes de vitesse
  const N_LIGNES = mobile ? 90 : 160;
  const base = new THREE.InstancedBufferGeometry();
  base.setAttribute('position', new THREE.Float32BufferAttribute([0, -1, 0, 1, -1, 0, 0, 1, 0, 1, 1, 0], 3));
  base.setIndex([0, 1, 2, 2, 1, 3]);
  const i1 = new Float32Array(N_LIGNES * 4), i2 = new Float32Array(N_LIGNES * 2);
  const alea = (() => { let s = 15; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
  for (let i = 0; i < N_LIGNES; i++) {
    const ang = alea() * Math.PI * 2, r = 2.2 + Math.pow(alea(), 0.7) * 14;
    i1.set([Math.cos(ang) * r, Math.sin(ang) * r * 0.5, alea() * 90, 2 + alea() * 7], i * 4);
    i2.set([0.6 + alea() * 1.2, alea() < 0.35 ? 1 : 0], i * 2);
  }
  base.setAttribute('aInst', new THREE.InstancedBufferAttribute(i1, 4));
  base.setAttribute('aInst2', new THREE.InstancedBufferAttribute(i2, 2));
  base.instanceCount = N_LIGNES;
  const lignesMat = new THREE.ShaderMaterial({
    vertexShader: LIGNES_V, fragmentShader: LIGNES_F, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTemps: { value: 0 }, uDefile: { value: 0 }, uEtendue: { value: 90 }, uLargeur: { value: 1.2 }, uCam: { value: new THREE.Vector3() },
      uEcran: { value: new THREE.Vector2(1, 1) }, uTeinte: { value: teinte }, uForce: { value: 1 } },
  });
  const lignes = new THREE.Mesh(base, lignesMat);
  lignes.frustumCulled = false;
  scene.add(lignes);

  // les particules de gomme
  const N_G = mobile ? 260 : 520;
  const g = new THREE.BufferGeometry();
  const ga = new Float32Array(N_G * 4), gp = new Float32Array(N_G * 3);
  for (let i = 0; i < N_G; i++) ga.set([(alea() - 0.5) * 22, 0.05 + Math.pow(alea(), 2) * 5, alea() * 40, alea()], i * 4);
  g.setAttribute('position', new THREE.BufferAttribute(gp, 3));
  g.setAttribute('aG', new THREE.BufferAttribute(ga, 4));
  const gommeMat = new THREE.ShaderMaterial({
    vertexShader: GOMME_V, fragmentShader: GOMME_F, transparent: true, depthWrite: false, blending: THREE.NormalBlending,
    uniforms: { uTemps: { value: 0 }, uDefile: { value: 0 }, uTaille: { value: 42 }, uEtendue: { value: 40 }, uCam: { value: new THREE.Vector3() },
      uTeinte: { value: teinte }, uForce: { value: 1 } },
  });
  const gomme = new THREE.Points(g, gommeMat);
  gomme.frustumCulled = false;
  scene.add(gomme);

  // ---------- la boucle ----------
  let L = 0, H = 0, dpr = 1, dprMax = 1;
  const PALIERS = [1, 0.85, 0.72, 0.6, 0.5];
  let palier = 0;
  function taille() {
    L = innerWidth; H = innerHeight;
    dprMax = Math.min(devicePixelRatio || 1, mobile ? 1.5 : 1.25);
    // en ultra-large, on part plus bas : 4 millions de pixels de sol
    if (L * H > 3.2e6) dprMax = Math.min(dprMax, 0.85);
    appliquer();
  }
  function appliquer() {
    dpr = Math.max(0.5, dprMax * PALIERS[palier]);
    renderer.setPixelRatio(dpr);
    renderer.setSize(L, H, false);
    camera.aspect = L / H;
    camera.updateProjectionMatrix();
    lignesMat.uniforms.uEcran.value.set(L / 2, H / 2);
  }
  taille();
  addEventListener('resize', taille);

  let t = 0, dernier = performance.now(), z = 0, defile = 0, tangageLisse = null, vit = 0;
  let mesures = [], arret = false, visible = true;
  const lent = reduit ? 0.35 : 1;
  document.addEventListener('visibilitychange', () => { visible = !document.hidden; dernier = performance.now(); });

  function image(now) {
    if (arret) return;
    requestAnimationFrame(image);
    if (!visible) return;
    const dt = Math.min(0.05, (now - dernier) / 1000);
    dernier = now;
    // qualité : sous 25 images par seconde pendant 1,5 s, on baisse la densité de rendu d'un palier
    mesures.push(dt);
    if (mesures.length > 45) {
      const moy = mesures.reduce((a, b) => a + b, 0) / mesures.length;
      mesures = [];
      if (moy > 0.04 && palier < PALIERS.length - 1) { palier++; appliquer(); }
    }
    const e = etat();
    const a = e.amb;
    t += dt * lent;
    // la caméra avance avec le défilement, et un peu toute seule (la piste vit)
    vit += ((e.vitesse || 0) - vit) * Math.min(1, dt * 4);
    z = -(e.y * 0.018) - t * a.avance * 0.35;
    const cam = new THREE.Vector3(Math.sin(t * 0.13) * 0.6 * lent, a.camY + Math.sin(t * 0.7) * 0.02 * lent, z);
    camera.position.copy(cam);
    const tg = a.tangage;
    tangageLisse = tangageLisse === null ? tg : tangageLisse + (tg - tangageLisse) * Math.min(1, dt * 3);
    camera.rotation.set(tangageLisse, Math.sin(t * 0.11) * 0.03 * lent, Math.sin(t * 0.17) * 0.012 * lent, 'YXZ');
    if (Math.abs(camera.fov - a.fov) > 0.01) { camera.fov = a.fov; camera.updateProjectionMatrix(); }
    sol.position.set(cam.x, 0, cam.z - 150);
    ciel.position.copy(cam);
    const u = solMat.uniforms;
    u.uCam.value.copy(cam); u.uLumiere.value = a.lumiere; u.uGrille.value = a.grille; u.uQuad.value = a.quad;
    u.uBordures.value = a.bordures; u.uTemps.value = t; u.uBrouillard.value = a.brouillard;
    ciel.material.uniforms.uHorizon.value = a.horizon;
    // les lignes filent plus vite quand on défile vite
    const elan = Math.min(3, Math.abs(vit) / 900);
    defile += dt * (a.vitLignes * 22 + elan * 60) * lent;
    const lu = lignesMat.uniforms;
    lu.uTemps.value = 0; lu.uDefile.value = defile; lu.uCam.value.copy(cam);
    lu.uForce.value = Math.min(1, a.lignes * (0.55 + elan * 0.5)) * (reduit ? 0.75 : 1);
    lu.uLargeur.value = (mobile ? 1.0 : 1.3) * dpr;
    const gu = gommeMat.uniforms;
    gu.uTemps.value = t; gu.uDefile.value = defile * 0.4; gu.uCam.value.copy(cam);
    gu.uForce.value = a.gomme; gu.uTaille.value = 46 * dpr * (H / 900);
    renderer.render(scene, camera);
  }
  requestAnimationFrame((n) => { dernier = n; image(n); canvas.classList.add('prete'); });

  return {
    arreter() { arret = true; renderer.dispose(); },
    stats: () => ({ dpr, palier }),
  };
}
