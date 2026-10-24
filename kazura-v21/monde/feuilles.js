/* Kazura v12, le Monde : les feuilles de kudzu et les fleurs.
   Une feuille de kudzu = trois folioles : une terminale symétrique, deux latérales asymétriques
   lobées du côté extérieur. Chaque foliole est une grille (u le long de la nervure, v en travers)
   dont le nuanceur calcule la forme : contour ovale acuminé, lobe et sinus, pli de la nervure,
   bord ondulé, dépliement à la naissance, vent, frisson au toucher. La normale est recalculée par
   différences finies, donc l'éclairage reste juste pendant le mouvement.
   Le fragment dessine la nervure médiane, les nervures secondaires pennées, le réseau fin, le
   dessus vernissé, le dessous pâle velouté, et la lumière qui traverse la feuille par derrière. */
import { hasard, greffer, GLSL_BRUIT, GLSL_VENT, GLSL_RELIEF, GLSL_SAIN } from './commun.js';

function grilleFoliole(THREE, nu, nv) {
  const pos = [], nor = [], idx = [];
  for (let i = 0; i <= nu; i++) {
    const u = Math.pow(i / nu, 0.92);
    for (let j = 0; j <= nv; j++) { pos.push(u, (j / nv) * 2 - 1, 0); nor.push(0, 0, 1); }
  }
  for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
    const a = i * (nv + 1) + j, b = a + nv + 1;
    idx.push(a, b, a + 1, b, b + 1, a + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setIndex(idx);
  return g;
}

const SOMMET_FEUILLE = /* glsl */ `
  attribute vec4 aFA; // naissance, côté (-1 0 1), lobe, graine
  attribute vec4 aFB; // instant du frisson, épaisseur (translucidité), teinte, libre
  uniform float uCroiss; uniform float uRepli; uniform float uDuree;
  varying vec3 vF; varying vec4 vFA; varying vec4 vFB;
  float kzDemi(float u, float c, float lobe) {
    float uu = clamp(u, 0.0, 1.0);
    float b = pow(max(sin(3.14159265 * pow(uu, 0.62)), 0.0), 0.78);
    float w = 0.41 * b * (1.0 - 0.3 * smoothstep(0.5, 1.0, uu));
    float l = 0.08 * exp(-pow((uu - 0.37) / 0.11, 2.0)) - 0.055 * exp(-pow((uu - 0.575) / 0.06, 2.0));
    w += lobe * l * c;
    w *= smoothstep(0.0, 0.06, uu);
    return max(w, 0.0);
  }
  float kzCoteDe(float v) { float sv = v >= 0.0 ? 1.0 : -1.0; return abs(aFA.y) < 0.5 ? 0.6 : (sv * aFA.y > 0.0 ? 1.0 : -0.4); }
  vec3 kzFeuille(float u, float v, float g) {
    float gr = aFA.w;
    float w = kzDemi(u, kzCoteDe(v), aFA.z) * (1.0 - 0.3 * uRepli);
    float y = v * w; float ay = abs(y);
    float z = 0.16 * (sqrt(y * y + 0.0009) - 0.03) * (1.0 - 0.5 * u) + 0.55 * y * y * (1.0 - 0.4 * u) - 0.13 * u * u + 0.02 * sin(u * 21.0 + gr * 40.0) * pow(abs(v), 3.0);
    float ang = (1.0 - g) * 1.35 + uRepli * 1.25;
    ang *= smoothstep(0.0, 0.04, ay) * 0.5 + 0.5;
    vec3 p = vec3(u, y * cos(ang), z + ay * sin(ang));
    float ph = gr * 50.0;
    float f = uVent * (0.035 + 0.025 * sin(uTemps * 1.3 + ph)) * sin(uTemps * (1.6 + gr) + ph + u * 1.4);
    p.z += f * u * u;
    float tw = uVent * 0.10 * sin(uTemps * 1.1 + ph * 1.7) * u;
    float ct = cos(tw); float st = sin(tw);
    p.yz = vec2(ct * p.y - st * p.z, st * p.y + ct * p.z);
    float dt = uTemps - aFB.x;
    if (dt > 0.0 && dt < 3.0) { float fr = exp(-dt * 3.0) * sin(dt * 34.0) * 0.17; p.z += fr * u * u; p.y += fr * 0.25 * u * sin(u * 8.0 + dt * 20.0); }
    return p;
  }`;

const FRAGMENT_FEUILLE = /* glsl */ `
  uniform float uTemps;
  uniform vec3 uFDessus; uniform vec3 uFDessus2; uniform vec3 uFDessous; uniform vec3 uFNervure;
  uniform vec3 uFTrans; uniform vec3 uLumCouleur; uniform vec3 uLumDir; uniform vec3 uSeve;
  uniform float uTransForce; uniform float uDissout;
  varying vec3 vF; varying vec4 vFA; varying vec4 vFB;`;

export function materiauFeuille(THREE, { mobile, cle = 'feuille' }) {
  const m = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, roughness: 0.45, metalness: 0, side: THREE.DoubleSide, specularIntensity: 0.2,
    sheen: 1.0, sheenRoughness: 0.55, sheenColor: new THREE.Color(0x9fe8c8).multiplyScalar(0.22),
    envMapIntensity: 0.35,
  });
  const u = {
    uCroiss: { value: 0 }, uRepli: { value: 0 }, uDuree: { value: 1.1 }, uDissout: { value: 0 },
    uFDessus: { value: new THREE.Color(0x073d2a) }, uFDessus2: { value: new THREE.Color(0x14704a) },
    uFDessous: { value: new THREE.Color(0x1f5a43) }, uFNervure: { value: new THREE.Color(0xb8e6a0) },
    uFTrans: { value: new THREE.Color(0x66e09a) }, uLumCouleur: { value: new THREE.Color(1, 1, 1) },
    uLumDir: { value: new THREE.Vector3(0, 0, 1) }, uSeve: { value: new THREE.Color(0xa855f7) },
    uTransForce: { value: 0.7 },
  };
  return greffer(m, {
    cle, uniforms: u,
    declVert: GLSL_VENT + SOMMET_FEUILLE,
    vert: [
      ['#include <beginnormal_vertex>', `
        float kzG = clamp((uCroiss - aFA.x) / uDuree, 0.0, 1.0);
        float kzGm = kzG - 1.0;
        float kzS = 1.0 + 2.1 * kzGm * kzGm * kzGm + 1.1 * kzGm * kzGm;
        float kzU = position.x; float kzV = position.y;
        vec3 kzP = kzFeuille(kzU, kzV, kzG);
        float kdu = kzU < 0.97 ? 0.015 : -0.015; float kdv = kzV < 0.95 ? 0.02 : -0.02;
        vec3 kzPu = (kzFeuille(kzU + kdu, kzV, kzG) - kzP) / kdu;
        vec3 kzPv = (kzFeuille(kzU, kzV + kdv, kzG) - kzP) / kdv;
        vec3 kzN0 = cross(kzPu, kzPv);
        vec3 objectNormal = dot(kzN0, kzN0) > 1e-12 ? normalize(kzN0) : vec3(0.0, 0.0, 1.0);
        vec3 kzPos = kzP * kzS;
        vF = vec3(kzU, kzV, kzDemi(kzU, kzCoteDe(kzV), aFA.z));
        vFA = aFA; vFB = aFB;`],
      ['#include <begin_vertex>', 'vec3 transformed = kzPos;'],
      ['#include <project_vertex>', `
        vec4 mvPosition = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
          mvPosition = instanceMatrix * mvPosition;
          mvPosition.xyz += kzBalance(instanceMatrix[3].xyz);
        #endif
        mvPosition = modelViewMatrix * mvPosition;
        gl_Position = projectionMatrix * mvPosition;`],
    ],
    declFrag: GLSL_BRUIT + GLSL_RELIEF + FRAGMENT_FEUILLE,
    frag: [
      ['#include <color_fragment>', `
        float kzBord = 0.0;
        if (uDissout > 0.001) {
          float kd = kzBruit(vec3(vF.x * 7.0, vF.y * 3.0, vFA.w * 13.0)) * 0.65 + (1.0 - vF.x) * 0.35;
          if (kd < uDissout) discard;
          kzBord = 1.0 - smoothstep(0.0, 0.06, kd - uDissout);
        }
        float kzu = vF.x; float kzy = vF.y * vF.z; float kay = abs(kzy); float kav = abs(vF.y);
        float kzMid = 1.0 - smoothstep(0.004, 0.011 + 0.006 * (1.0 - kzu), kay);
        float kzPh = (kzu - 1.05 * pow(kay, 0.9)) * 7.0 + vFA.w * 3.0;
        float kzD = abs(fract(kzPh) - 0.5);
        float kzLw = 0.032 * (1.0 - 0.6 * kav);
        float kzSec = (1.0 - smoothstep(kzLw * 0.45, kzLw, kzD)) * smoothstep(0.02, 0.05, kay) * (1.0 - smoothstep(0.8, 0.97, kav))
                    * smoothstep(0.06, 0.14, kzu) * (1.0 - smoothstep(0.86, 0.97, kzu));
        float kzN = kzBruit(vec3(kzu * 70.0, kzy * 70.0, vFA.w * 17.0));
        float kzNet = (1.0 - smoothstep(0.0, 0.045, abs(kzN - 0.5))) * (1.0 - kzMid) * (1.0 - kzSec);
        float kzVar = kzBruit(vec3(kzu * 4.0, kzy * 4.0, vFA.w * 9.0));
        float kzAreole = smoothstep(0.0, 0.5, kzD);
        vec3 kzTeinte = mix(vec3(0.75, 1.0, 1.15), vec3(1.25, 1.05, 0.6), vFB.z);
        vec3 kzCol = gl_FrontFacing ? mix(uFDessus, uFDessus2, kzVar) : uFDessous * (0.85 + 0.3 * kzVar);
        kzCol *= kzTeinte;
        kzCol = mix(kzCol, uFNervure * (gl_FrontFacing ? 0.55 : 0.9), max(kzMid, kzSec * 0.6) * (gl_FrontFacing ? 0.3 : 0.45));
        kzCol *= (0.55 + 0.45 * smoothstep(0.0, 0.4, kzu)) * (1.0 - 0.35 * smoothstep(0.82, 1.0, kav));
        diffuseColor.rgb = kzCol * (0.7 + 0.45 * vFB.w);`],
      ['#include <roughnessmap_fragment>', `
        float roughnessFactor = (gl_FrontFacing ? 0.42 : 0.66) - 0.08 * max(kzMid, kzSec);`],
      ['#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        float kzH = kzMid * 0.6 + kzSec * 0.35 - kzNet * 0.15;
        normal = kzRelief(-vViewPosition, normal, kzH, 0.5, faceDirection);`],
      ['#include <opaque_fragment>', `
        vec3 kzVv = normalize(vViewPosition);
        float kzDer = clamp(-dot(normal, uLumDir), 0.0, 1.0);
        float kzAx = pow(clamp(dot(-kzVv, uLumDir), 0.0, 1.0), 5.0);
        float kzEp = (1.0 - 0.45 * kzSec - 0.25 * kzNet - 0.35 * kzMid) * (0.9 + 0.1 * kzAreole) * vFB.y;
        float kzEpais = 0.6 + 0.8 * kzBruit(vec3(kzu * 6.0, kzy * 6.0, vFA.w * 31.0));
        outgoingLight += uFTrans * kzTeinte * uLumCouleur * kzDer * (0.03 + 1.25 * kzAx) * kzEp * kzEpais * uTransForce * (0.35 + 0.65 * smoothstep(0.0, 0.45, vF.x));
        float kzDt = uTemps - vFB.x;
        float kzGl = (kzDt > 0.0 && kzDt < 4.0) ? exp(-kzDt * 1.5) * smoothstep(0.0, 0.08, kzDt) : 0.0;
        outgoingLight += uSeve * kzGl * (0.2 + 1.8 * max(kzMid, kzSec));
        outgoingLight += uSeve * kzBord * 5.0;
        ${GLSL_SAIN}
        outgoingLight = min(outgoingLight, vec3(1.8));
        #include <opaque_fragment>`],
    ],
  });
}

/* Construit les instances : trois folioles par feuille, orientées vers la lumière. */
export function construireFeuilles(THREE, attaches, { mobile, lumiere }) {
  const alea = hasard(31);
  const n = attaches.length * 3;
  const geo = grilleFoliole(THREE, mobile ? 14 : 22, mobile ? 6 : 10);
  const aFA = new Float32Array(n * 4), aFB = new Float32Array(n * 4);
  const mat = materiauFeuille(THREE, { mobile });
  const im = new THREE.InstancedMesh(geo, mat, n);
  im.frustumCulled = false;
  const M = new THREE.Matrix4(), S = new THREE.Matrix4();
  const up = new THREE.Vector3(0, 1, 0);
  const pick = []; // pour le toucher : centre et rayon de chaque feuille
  let k = 0;
  for (const a of attaches) {
    const nb = new THREE.Vector3().copy(lumiere).multiplyScalar(0.55).addScaledVector(up, 0.5)
      .add(new THREE.Vector3(alea() - 0.5, alea() - 0.5, alea() - 0.5).multiplyScalar(1.35)).normalize();
    let xT = a.dir.clone().addScaledVector(nb, -a.dir.dot(nb));
    if (xT.lengthSq() < 1e-4) xT = new THREE.Vector3(1, 0, 0).addScaledVector(nb, -nb.x);
    xT.normalize();
    const taille = (mobile ? 0.6 : 0.52) * a.taille * (0.85 + alea() * 0.3);
    const lobe = 0.4 + alea() * 0.9;
    const graine = alea();
    const teinte = Math.pow(alea(), 1.4), eclair = alea();
    const def = [
      { ang: 0, cote: 0, s: 1.0, base: 0.05 },
      { ang: 1.15 + alea() * 0.25, cote: 1, s: 0.86, base: 0 },
      { ang: -(1.15 + alea() * 0.25), cote: -1, s: 0.86, base: 0 },
    ];
    for (const d of def) {
      const x = xT.clone().applyAxisAngle(nb, d.ang);
      const z = nb.clone().applyAxisAngle(x, d.cote * 0.12); // latérales un peu penchées
      x.addScaledVector(z, -0.12).normalize();
      const y = new THREE.Vector3().crossVectors(z, x).normalize();
      const z2 = new THREE.Vector3().crossVectors(x, y).normalize();
      M.makeBasis(x, y, z2);
      S.makeScale(taille * d.s, taille * d.s, taille * d.s);
      M.multiply(S);
      const p = a.p.clone().addScaledVector(xT, d.base * taille);
      M.setPosition(p);
      im.setMatrixAt(k, M);
      aFA.set([a.naiss + 0.05 + alea() * 0.15, d.cote, lobe * (d.cote === 0 ? 0.8 : 1), (graine + k * 0.137) % 1], k * 4);
      aFB.set([-100, 0.75 + alea() * 0.4, teinte, eclair], k * 4);
      k++;
    }
    pick.push({ centre: a.p.clone().addScaledVector(xT, taille * 0.35), rayon: taille * 0.75, naiss: a.naiss, i: k - 3 });
  }
  geo.setAttribute('aFA', new THREE.InstancedBufferAttribute(aFA, 4));
  const attrB = new THREE.InstancedBufferAttribute(aFB, 4);
  attrB.setUsage(THREE.DynamicDrawUsage);
  geo.setAttribute('aFB', attrB);
  im.instanceMatrix.needsUpdate = true;
  return { mesh: im, materiau: mat, pick, attrB };
}

/* Les trois folioles de l'ouverture, au cœur du sceau, sur les axes du kamon (haut, bas gauche, bas droit). */
export function construireFeuillesOuverture(THREE, { mobile }) {
  const geo = grilleFoliole(THREE, mobile ? 18 : 28, mobile ? 8 : 12);
  const mat = materiauFeuille(THREE, { mobile, cle: 'feuille-ouverture' });
  const im = new THREE.InstancedMesh(geo, mat, 3);
  im.frustumCulled = false;
  const aFA = new Float32Array(12), aFB = new Float32Array(12);
  const M = new THREE.Matrix4();
  for (let i = 0; i < 3; i++) {
    const a = Math.PI / 2 + i * (Math.PI * 2 / 3);
    const x = new THREE.Vector3(Math.cos(a), Math.sin(a), 0);
    const z = new THREE.Vector3(0, 0, 1);
    const y = new THREE.Vector3().crossVectors(z, x);
    M.makeBasis(x, y, z).multiply(new THREE.Matrix4().makeScale(1.04, 0.86, 1.0));
    M.setPosition(x.clone().multiplyScalar(0.07).add(new THREE.Vector3(0, 0, 0.04)));
    im.setMatrixAt(i, M);
    aFA.set([i * 0.08, 0, 0.35, 0.21 + i * 0.29], i * 4);
    aFB.set([-100, 1.0, 0.45, 0.7], i * 4);
  }
  geo.setAttribute('aFA', new THREE.InstancedBufferAttribute(aFA, 4));
  geo.setAttribute('aFB', new THREE.InstancedBufferAttribute(aFB, 4));
  return { mesh: im, materiau: mat };
}

/* Les fleurs : grappes dressées de petites fleurs violettes, qui s'ouvrent du bas vers le haut. */
export function construireFleurs(THREE, hampes, { mobile }) {
  const alea = hasard(5);
  const parGrappe = mobile ? 16 : 30;
  const n = Math.max(1, hampes.length * parGrappe);
  const geo = new THREE.IcosahedronGeometry(1, mobile ? 1 : 2);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { // une fleur en goutte : étendard rond, carène pointue
    let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const t = (y + 1) / 2;
    const r = Math.pow(Math.sin(Math.PI * Math.pow(t, 0.55)), 0.9);
    p.setXYZ(i, x * r * (0.55 + 0.45 * t), y * 1.7, z * r * (0.35 + 0.35 * t));
  }
  geo.computeVertexNormals();
  const aFl = new Float32Array(n * 4);
  const m = new THREE.MeshPhysicalMaterial({ color: 0x7c3aed, roughness: 0.45, sheen: 1, sheenColor: new THREE.Color(0xf5d0fe).multiplyScalar(0.6), sheenRoughness: 0.35, envMapIntensity: 0.4 });
  const u = { uCroiss: { value: 0 }, uSeve: { value: new THREE.Color(0xa855f7) }, uFleurInt: { value: 0.8 } };
  greffer(m, {
    cle: 'fleur', uniforms: u,
    declVert: GLSL_VENT + `attribute vec4 aFl; uniform float uCroiss; varying float vFl; varying float vFlH;`,
    vert: [
      ['#include <begin_vertex>', `
        float kzO = clamp((uCroiss - aFl.x) / 1.6, 0.0, 1.0);
        kzO = kzO * kzO * (3.0 - 2.0 * kzO);
        vec3 transformed = position * kzO;
        vFl = kzO; vFlH = position.y;`],
      ['#include <project_vertex>', `
        vec4 mvPosition = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
          mvPosition = instanceMatrix * mvPosition;
          mvPosition.xyz += kzBalance(instanceMatrix[3].xyz);
        #endif
        mvPosition = modelViewMatrix * mvPosition;
        gl_Position = projectionMatrix * mvPosition;`],
    ],
    declFrag: `uniform vec3 uSeve; uniform float uFleurInt; uniform float uTemps; varying float vFl; varying float vFlH;`,
    frag: [['#include <emissivemap_fragment>', `#include <emissivemap_fragment>
      float kzC = pow(clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0), 2.0);
      totalEmissiveRadiance += mix(uSeve, vec3(0.95, 0.75, 1.0), smoothstep(0.3, 1.2, vFlH) * 0.5) * uFleurInt * (0.15 + 0.6 * kzC) * smoothstep(0.2, 1.0, vFl) * (0.85 + 0.15 * sin(uTemps * 1.7 + vFlH));`]],
  });
  const im = new THREE.InstancedMesh(geo, m, n);
  im.frustumCulled = false;
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  let k = 0;
  for (const h of hampes) {
    const pts = h.pts;
    for (let j = 0; j < parGrappe; j++) {
      const f = 0.12 + 0.88 * (j / (parGrappe - 1));
      const idx = Math.min(pts.length - 1, Math.round(f * (pts.length - 1)));
      const c = pts[idx];
      const a = j * 2.4 + h.graine * 6;
      const sortie = new THREE.Vector3(Math.cos(a), -0.35, Math.sin(a)).normalize();
      const taille = 0.024 * (1.2 - 0.65 * f) * (mobile ? 1.15 : 1);
      Q.setFromUnitVectors(up, sortie.clone().multiplyScalar(-1).add(new THREE.Vector3(0, 0.6, 0)).normalize());
      S.set(taille, taille, taille);
      M.compose(c.clone().addScaledVector(sortie, taille * 1.3), Q, S);
      im.setMatrixAt(k, M);
      aFl.set([h.naiss + 0.6 + f * 1.4, h.graine, f, 0], k * 4);
      k++;
    }
  }
  geo.setAttribute('aFl', new THREE.InstancedBufferAttribute(aFl, 4));
  im.count = k;
  return { mesh: im, materiau: m };
}
