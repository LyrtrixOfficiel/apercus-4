// Le domaine Kazura : les arbres.
// Le rideau d'arbres et la forêt de la colline sont des silhouettes détourées (hêtre, noyer, sapin) tournées
// vers la caméra, éclairées comme des volumes ronds. Les deux petits arbres dans les rangs sont en vrai
// volume : un tronc et une couronne de cartes de feuilles.

import { alea, melangerBlocs, GLSL_BRUIT, GLSL_VENT, GLSL_LUMIERE, GLSL_ALPHA } from './commun.js';
import { LIEU, hauteur } from './terrain.js';

const C = LIEU.colline;

export function creerForet(THREE, U, tex, { mobile }) {
  const h = alea(5);
  const inst = [];
  const ajouter = (x, z, haut, type, enfonce, teinte) => {
    const larg = haut * (type === 2 ? 0.55 : type === 1 ? 0.75 : 0.95);
    inst.push(x, hauteur(x, z) - haut * enfonce, z, h(), larg, haut, type, teinte);
  };
  // le rideau d'arbres, derrière les vignes (feuillus, des sapins à droite comme sur la photo)
  const nR = mobile ? 150 : 300;
  for (let i = 0; i < nR; i++) {
    const x = -170 + h() * 360;
    const z = LIEU.rideau.z0 - Math.pow(h(), 0.7) * (LIEU.rideau.z0 - LIEU.rideau.z1) - Math.max(0, x - 60) * 0.1;
    const sapin = x > 38 ? h() < 0.55 : h() < 0.08;
    const haut = sapin ? 15 + h() * 10 : 12 + h() * 11;
    ajouter(x, z, haut, sapin ? 2 : h() < 0.6 ? 0 : 1, 0.05, h());
  }
  // quelques arbres de lisière plus proches, à gauche (cadre du plan large)
  for (let i = 0; i < (mobile ? 8 : 16); i++) {
    const x = -60 + h() * 28, z = -76 - h() * 12;
    ajouter(x, z, 11 + h() * 8, h() < 0.5 ? 0 : 1, 0.04, h());
  }
  // la forêt de la colline (et des collines voisines) : des couronnes qui dépassent de la canopée
  const nC = mobile ? 1300 : 3600;
  for (let i = 0; i < nC; i++) {
    const r = Math.sqrt(h()) * 0.97, a = h() * Math.PI * 2;
    const x = C.x + Math.cos(a) * r * C.rx, z = C.z + Math.sin(a) * r * C.rz;
    if (z > -240) continue;
    if (Math.abs(x - C.x) < 64 && Math.abs(z - C.z) < 24) continue;
    const sommet = 1 - r;
    const sapin = h() < 0.25 + sommet * 0.25;
    ajouter(x, z, (sapin ? 20 : 17) + h() * 10, sapin ? 2 : h() < 0.55 ? 0 : 1, 0.38 - sommet * 0.22, h());
  }
  // la lisière de la forêt sur les collines latérales
  for (let i = 0; i < (mobile ? 260 : 700); i++) {
    const gauche = h() < 0.55;
    const x = gauche ? -460 + (h() - 0.5) * 560 : 520 + (h() - 0.5) * 600;
    const z = gauche ? -730 + (h() - 0.5) * 460 : -780 + (h() - 0.5) * 500;
    if (hauteur(x, z) < 20) continue;
    ajouter(x, z, 20 + h() * 10, h() < 0.4 ? 2 : 0, 0.4, h());
  }
  const n = inst.length / 8;
  const aB = new Float32Array(n * 4), aT = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) { aB.set(inst.slice(i * 8, i * 8 + 4), i * 4); aT.set(inst.slice(i * 8 + 4, i * 8 + 8), i * 4); }
  const geo = new THREE.InstancedBufferGeometry();
  const quad = new THREE.PlaneGeometry(1, 1).translate(0, 0.5, 0);
  geo.index = quad.index; geo.attributes.position = quad.attributes.position; geo.attributes.uv = quad.attributes.uv;
  geo.setAttribute('aBase', new THREE.InstancedBufferAttribute(aB, 4));
  geo.setAttribute('aTaille', new THREE.InstancedBufferAttribute(aT, 4));
  geo.instanceCount = n;
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...U, tArbres: { value: tex.arbres } },
    alphaToCoverage: !mobile,
    vertexShader: /* glsl */`
      attribute vec4 aBase; attribute vec4 aTaille;
      ${GLSL_BRUIT}
      ${GLSL_VENT}
      varying vec2 vUv; varying vec3 vPos; varying vec3 vN; varying float vTeinte; varying float vType; varying float vY;
      void main() {
        vec3 dr = normalize(vec3(viewMatrix[0][0], 0.0, viewMatrix[2][0]));
        vec3 versCam = normalize(vec3(cameraPosition.x - aBase.x, 0.0, cameraPosition.z - aBase.z));
        vec3 p = aBase.xyz + dr * position.x * aTaille.x + vec3(0.0, position.y * aTaille.y, 0.0);
        p.xz += vent(aBase.xz, 0.5) * 0.025 * aTaille.y * position.y * position.y;
        float u = uv.x;
        if (aBase.w > 0.5) u = 1.0 - u;
        vUv = vec2((aTaille.z + u) * 0.25, uv.y);
        vN = normalize(dr * position.x * 1.7 + vec3(0.0, (position.y - 0.4) * 1.3, 0.0) + versCam * 0.75);
        vPos = p; vTeinte = aTaille.w; vType = aTaille.z; vY = position.y;
        gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: /* glsl */`
      uniform sampler2D tArbres; uniform float uA2C;
      ${GLSL_LUMIERE}
      ${GLSL_ALPHA}
      varying vec2 vUv; varying vec3 vPos; varying vec3 vN; varying float vTeinte; varying float vType; varying float vY;
      void main() {
        vec4 t = texture2D(tArbres, vUv);
        float a = uA2C > 0.5 ? alphaNet(t.a, vUv, 0.5) : t.a;
        if (a < (uA2C > 0.5 ? 0.02 : 0.5)) discard;
        vec3 alb = t.rgb * mix(vec3(0.82, 0.95, 0.72), vec3(1.0, 0.98, 0.78), vTeinte);
        if (vType > 1.5) alb *= vec3(0.7, 0.82, 0.85);
        float loin = smoothstep(90.0, 420.0, length(vPos - cameraPosition));
        alb *= mix(0.78, 0.5, loin) * mix(vec3(1.0), vec3(0.85, 0.92, 1.0), loin);
        alb = mix(alb, vec3(dot(alb, vec3(0.33))), loin * 0.25);
        vec3 v = normalize(vPos - cameraPosition);
        float ao = mix(0.45, 1.0, smoothstep(0.05, 0.75, vY));
        vec3 c = eclairer(alb, normalize(vN), v, ao, 0.55, 0.25);
        // liseré de lumière au contre-jour : les bords du feuillage s'allument
        float bord = 1.0 - smoothstep(0.55, 0.95, t.a);
        float contre = pow(max(dot(-v, uLumDir), 0.0), 3.0);
        c += uLumCouleur * bord * contre * 0.35 * (1.0 - uNuit);
        gl_FragColor = vec4(brumer(c, vPos), a);
      }`,
  });
  const foret = new THREE.Mesh(geo, mat);
  foret.frustumCulled = false;
  return foret;
}

/** Un petit arbre en volume : tronc tordu, trois branches, une couronne de cartes de feuilles. */
export function creerPetitsArbres(THREE, U, tex, { mobile }) {
  const groupe = new THREE.Group();
  const h = alea(17);
  const cartes = [];
  const troncs = [];
  for (const [i, a] of LIEU.arbres.entries()) {
    const y0 = hauteur(a.x, a.z);
    const H = i === 0 ? 5.2 : 4.6;
    const centre = [a.x, y0 + H * 0.62, a.z];
    const ray = [H * 0.42, H * 0.34, H * 0.42];
    const n = mobile ? 90 : 190;
    for (let k = 0; k < n; k++) {
      // tirage dans un ellipsoïde, plus dense en surface
      let x, y, z, d;
      do { x = h() * 2 - 1; y = h() * 2 - 1; z = h() * 2 - 1; d = x * x + y * y + z * z; } while (d > 1);
      const s = Math.pow(d, 0.25);
      const px = centre[0] + x / Math.sqrt(d + 1e-6) * s * ray[0];
      const py = centre[1] + y / Math.sqrt(d + 1e-6) * s * ray[1];
      const pz = centre[2] + z / Math.sqrt(d + 1e-6) * s * ray[2];
      cartes.push(px, py, pz, 0.9 + h() * 0.7, h() * Math.PI * 2, (h() - 0.5) * 1.6, h(), s, centre[0], centre[1], centre[2], H);
    }
    troncs.push({ x: a.x, y: y0, z: a.z, H });
  }
  const n = cartes.length / 12;
  const a1 = new Float32Array(n * 4), a2 = new Float32Array(n * 4), a3 = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) { const o = i * 12; a1.set(cartes.slice(o, o + 4), i * 4); a2.set(cartes.slice(o + 4, o + 8), i * 4); a3.set(cartes.slice(o + 8, o + 12), i * 4); }
  melangerBlocs([[a1, 4], [a2, 4], [a3, 4]], n, h);
  const geo = new THREE.InstancedBufferGeometry();
  const quad = new THREE.PlaneGeometry(1, 1);
  geo.index = quad.index; geo.attributes.position = quad.attributes.position; geo.attributes.uv = quad.attributes.uv;
  geo.setAttribute('aA', new THREE.InstancedBufferAttribute(a1, 4));
  geo.setAttribute('aB', new THREE.InstancedBufferAttribute(a2, 4));
  geo.setAttribute('aC', new THREE.InstancedBufferAttribute(a3, 4));
  geo.instanceCount = n;
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...U, tArbres: { value: tex.arbres } },
    side: THREE.DoubleSide,
    alphaToCoverage: !mobile,
    vertexShader: /* glsl */`
      attribute vec4 aA; attribute vec4 aB; attribute vec4 aC;
      ${GLSL_BRUIT}
      ${GLSL_VENT}
      varying vec2 vUv; varying vec3 vPos; varying vec3 vN; varying float vAo; varying float vR;
      void main() {
        float t = aA.w;
        vec3 p = vec3(position.xy * t, 0.0);
        float cy = cos(aB.x), sy = sin(aB.x), cx = cos(aB.y), sx = sin(aB.y);
        p = vec3(p.x, p.y * cx, p.y * sx);
        p = vec3(p.x * cy + p.z * sy, p.y, -p.x * sy + p.z * cy);
        vec3 w = aA.xyz + p;
        float haut = clamp((aA.y - aC.y) / aC.w + 0.5, 0.0, 1.0);
        w.xz += vent(aC.xz, 1.0) * 0.12 * haut;
        w += vec3(sin(uTemps * 2.3 + aB.z * 40.0), 0.0, cos(uTemps * 1.9 + aB.z * 30.0)) * 0.03 * uVent;
        vec3 radial = normalize(aA.xyz - aC.xyz + vec3(0.0, 0.2, 0.0));
        vN = normalize(mix(vec3(sy * cx, -sx, cy * cx), radial, 0.75));
        vAo = mix(0.35, 1.0, aB.w) * mix(0.6, 1.0, haut);
        vUv = vec2(0.75 + uv.x * 0.25, uv.y);
        vPos = w; vR = aB.z;
        gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.0);
      }`,
    fragmentShader: /* glsl */`
      uniform sampler2D tArbres; uniform float uA2C;
      ${GLSL_LUMIERE}
      ${GLSL_ALPHA}
      varying vec2 vUv; varying vec3 vPos; varying vec3 vN; varying float vAo; varying float vR;
      void main() {
        vec4 t = texture2D(tArbres, vUv);
        float a = uA2C > 0.5 ? alphaNet(t.a, vUv, 0.5) : t.a;
        if (a < (uA2C > 0.5 ? 0.02 : 0.5)) discard;
        vec3 v = normalize(vPos - cameraPosition);
        vec3 alb = t.rgb * mix(vec3(0.85, 1.0, 0.7), vec3(1.0, 1.0, 0.75), vR) * 0.85;
        vec3 c = eclairer(alb, normalize(vN), v, vAo, 1.0, 0.3);
        gl_FragColor = vec4(brumer(c, vPos), a);
      }`,
  });
  const couronnes = new THREE.Mesh(geo, mat);
  couronnes.frustumCulled = false;
  groupe.add(couronnes);

  // troncs et branches
  const parts = [];
  for (const t of troncs) {
    const tronc = new THREE.CylinderGeometry(0.09, 0.17, t.H * 0.62, 7, 4).translate(0, t.H * 0.31, 0);
    const pa = tronc.attributes.position;
    for (let i = 0; i < pa.count; i++) { const y = pa.getY(i); pa.setX(i, pa.getX(i) + Math.sin(y * 1.3) * 0.08); pa.setZ(i, pa.getZ(i) + Math.cos(y * 0.9) * 0.06); }
    tronc.translate(t.x, t.y - 0.05, t.z);
    parts.push(tronc);
    for (let b = 0; b < 4; b++) {
      const br = new THREE.CylinderGeometry(0.03, 0.07, t.H * 0.35, 5, 1).translate(0, t.H * 0.175, 0);
      br.rotateZ((b % 2 ? 1 : -1) * (0.5 + h() * 0.4));
      br.rotateY(h() * Math.PI * 2);
      br.translate(t.x, t.y + t.H * (0.42 + b * 0.05), t.z);
      parts.push(br);
    }
  }
  const pos = [], nor = [];
  for (const g of parts) {
    const gg = g.toNonIndexed(); gg.computeVertexNormals();
    pos.push(...gg.attributes.position.array); nor.push(...gg.attributes.normal.array);
  }
  const gt = new THREE.BufferGeometry();
  gt.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  gt.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  const mt = new THREE.ShaderMaterial({
    uniforms: { ...U, tEcorce: { value: tex.ecorce } },
    vertexShader: 'varying vec3 vPos; varying vec3 vN; void main() { vPos = position; vN = normal; gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.0); }',
    fragmentShader: /* glsl */`
      uniform sampler2D tEcorce;
      ${GLSL_LUMIERE}
      varying vec3 vPos; varying vec3 vN;
      void main() {
        vec3 t = texture2D(tEcorce, vec2(atan(vN.x, vN.z) * 0.3, vPos.y * 0.6)).rgb * 0.6;
        vec3 c = eclairer(t, normalize(vN), normalize(vPos - cameraPosition), 0.6, 0.0, 0.2);
        gl_FragColor = vec4(brumer(c, vPos), 1.0);
      }`,
  });
  groupe.add(new THREE.Mesh(gt, mt));
  groupe.traverse((o) => { o.frustumCulled = false; });
  return groupe;
}
