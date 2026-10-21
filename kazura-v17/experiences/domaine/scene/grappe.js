// Le domaine Kazura v14 : la grappe en gros plan (chapitre 4).
// Une grappe de riesling suspendue côté allée sur le rang x = 0 : grains serrés en volume, chacun avec sa pruine
// (la fine pellicule blanche), ses lenticelles, sa cicatrice de fleur, sa lumière qui le traverse à contre-jour ;
// les pédicelles et la rafle, le sarment, et trois grandes feuilles détourées qui s'allument au soleil.

import { alea, GLSL_BRUIT, GLSL_LUMIERE, GLSL_ALPHA } from './commun.js';
import { hauteur } from './terrain.js';

/** Le point d'attache de la grappe (haut de la rafle). */
export const GRAPPE = { x: 0.3, z: 0.6, y: hauteur(0.3, 0.6) + 1.02 };
/** Zone dégagée autour de la grappe (vigne.js n'y plante pas ses cartes). */
export const ZONE_GRAPPE = { x0: -0.06, x1: 1.6, z0: GRAPPE.z - 1.15, z1: GRAPPE.z + 1.2 };

export function creerGrappe(THREE, U, tex, { mobile }) {
  const groupe = new THREE.Group();
  const pivot = new THREE.Group();           // la grappe se balance autour de son attache
  pivot.position.set(GRAPPE.x, GRAPPE.y, GRAPPE.z);
  groupe.add(pivot);
  const h = alea(91);

  /* ---------- 1. Les grains : un tassement aléatoire autour de la rafle ---------- */
  const L = 0.135;                                            // longueur de la grappe
  const axe = (t) => [0.006 * Math.sin(t * 2.2), -0.012 - t * L, 0.004 * t];
  const rayonGrappe = (t) => 0.036 * Math.pow(Math.max(0, 1 - t), 0.55) * (0.75 + 0.25 * Math.sin(Math.min(1, t * 3) * Math.PI * 0.5)) + 0.007;
  const grains = [];
  const nMax = mobile ? 96 : 140;
  for (let essai = 0; essai < 16000 && grains.length < nMax; essai++) {
    const t = Math.pow(h(), 0.85);
    const a = h() * Math.PI * 2;
    const R = rayonGrappe(t);
    const rr = R * (0.2 + 0.8 * Math.sqrt(h()));
    const c0 = axe(t);
    // une petite aile en haut à gauche, comme beaucoup de grappes
    const aile = t < 0.28 && Math.cos(a - 2.4) > 0.6 ? 0.018 : 0;
    const c = [c0[0] + Math.cos(a) * (rr + aile), c0[1], c0[2] + Math.sin(a) * (rr + aile)];
    const r = 0.0071 + h() * 0.0017;
    let ok = true;
    for (const g of grains) { if (Math.hypot(g.c[0] - c[0], g.c[1] - c[1], g.c[2] - c[2]) < (g.r + r) * 0.9) { ok = false; break; } }
    if (!ok) continue;
    const lat = Math.hypot(c[0] - c0[0], c[2] - c0[2]) || 1;
    const ax = [(c[0] - c0[0]) / lat * 0.82, -0.57, (c[2] - c0[2]) / lat * 0.82];
    grains.push({ c, r, t, ax, ext: rr / R, attache: c0 });
  }
  const nG = grains.length;
  const aC = new Float32Array(nG * 4), aA = new Float32Array(nG * 4);
  grains.forEach((g, i) => {
    aC.set([g.c[0], g.c[1], g.c[2], g.r], i * 4);
    const l = Math.hypot(...g.ax);
    aA.set([g.ax[0] / l, g.ax[1] / l, g.ax[2] / l, h() * 0.999], i * 4);
  });
  const aO = new Float32Array(nG);
  grains.forEach((g, i) => { aO[i] = Math.min(1, 0.35 + 0.65 * g.ext) * (1 - 0.25 * g.t); });
  const sphere = new THREE.IcosahedronGeometry(1, mobile ? 3 : 4);
  const geo = new THREE.InstancedBufferGeometry();
  geo.index = sphere.index; geo.attributes.position = sphere.attributes.position;
  geo.setAttribute('aC', new THREE.InstancedBufferAttribute(aC, 4));
  geo.setAttribute('aA', new THREE.InstancedBufferAttribute(aA, 4));
  geo.setAttribute('aO', new THREE.InstancedBufferAttribute(aO, 1));
  geo.instanceCount = nG;
  const matGrains = new THREE.ShaderMaterial({
    uniforms: U,
    vertexShader: /* glsl */`
      attribute vec4 aC; attribute vec4 aA; attribute float aO;
      varying vec3 vPos; varying vec3 vN; varying vec3 vL; varying vec3 vAxe; varying float vR; varying float vO;
      void main() {
        vec3 d = normalize(position);
        // un grain un peu allongé le long de son pédicelle
        float k = dot(d, aA.xyz);
        vec3 p = (d + aA.xyz * k * 0.06) * aC.w;
        vec4 w = modelMatrix * vec4(aC.xyz + p, 1.0);
        vPos = w.xyz; vN = normalize(mat3(modelMatrix) * d); vL = d; vAxe = aA.xyz; vR = aA.w; vO = aO;
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */`
      ${GLSL_BRUIT}
      ${GLSL_LUMIERE}
      varying vec3 vPos; varying vec3 vN; varying vec3 vL; varying vec3 vAxe; varying float vR; varying float vO;
      float bruit3(vec3 p) { return bruit(p.xy + p.z * 1.7) * 0.5 + bruit(p.yz * 1.3 - p.x * 2.1) * 0.5; }
      void main() {
        vec3 n = normalize(vN);
        vec3 v = normalize(vPos - cameraPosition);
        float ndv = clamp(dot(n, -v), 0.0, 1.0);
        vec3 l = vL;
        // la teinte : vert-jaune, dorée côté soleil, quelques grains plus mûrs (ambrés)
        float mur = smoothstep(0.55, 1.0, vR);
        vec3 alb = mix(vec3(0.36, 0.5, 0.08), vec3(0.7, 0.58, 0.1), 0.3 + 0.5 * vR);
        alb = mix(alb, vec3(0.62, 0.36, 0.08), mur * 0.45);
        // cicatrice de la fleur (au pôle opposé au pédicelle) et lenticelles
        float pole = dot(l, -vAxe);
        float cicatrice = smoothstep(0.985, 0.995, pole);
        float lent = smoothstep(0.82, 0.9, bruit3(l * 38.0 + vR * 50.0)) * 0.6;
        alb = mix(alb, vec3(0.16, 0.1, 0.04), max(cicatrice, lent * 0.55));
        // la pruine : une fleur bleutée et poudrée, essuyée par endroits
        float pruine = smoothstep(0.32, 0.62, bruit3(l * 2.6 + vR * 17.0)) * 0.75 + 0.15;
        float ao = vO * mix(0.45, 1.0, smoothstep(-0.7, 0.5, dot(l, -vAxe) * 0.6 + n.y * 0.4));
        vec3 c = eclairer(alb, n, v, ao, 0.0, 0.25);
        // la lumière qui traverse le grain à contre-jour : bords lumineux, cœur plus dense, ombre des pépins
        float contre = pow(max(dot(v, uLumDir), 0.0), 2.5);
        float pepins = smoothstep(0.55, 0.95, ndv) * 0.55;
        vec3 trans = mix(vec3(0.62, 0.7, 0.16), vec3(0.85, 0.66, 0.16), vR) * mix(0.9, 0.22, ndv) * (1.0 - pepins);
        float face = smoothstep(-0.2, 0.4, dot(n, -uLumDir) + 0.25);
        c += uLumCouleur * trans * contre * face * vO * vO * 0.32;
        c += uLumCouleur * vec3(0.9, 0.85, 0.35) * pow(max(dot(n, uLumDir), 0.0), 1.0) * 0.06;
        // le liseré de soleil sur le contour, à contre-jour
        c += uLumCouleur * vec3(1.0, 0.92, 0.7) * pow(1.0 - ndv, 3.0) * contre * (0.25 + 0.35 * pruine) * vO;
        // velours de la pruine sur les bords
        c += (ambiant(n) * 0.55 + uLumCouleur * 0.05) * pow(1.0 - ndv, 2.2) * pruine * 0.75;
        // reflets nets là où la pruine est essuyée
        vec3 hh = normalize(uLumDir - v);
        float spec = pow(max(dot(n, hh), 0.0), 260.0) * 2.4 + pow(max(dot(n, hh), 0.0), 40.0) * 0.08;
        c += uLumCouleur * spec * (1.0 - pruine * 0.85);
        float fres = 0.04 + 0.96 * pow(1.0 - ndv, 5.0);
        c += ambiant(reflect(v, n)) * fres * 0.6 * (1.0 - pruine * 0.6) * vO;
        gl_FragColor = vec4(brumer(c, vPos), 1.0);
      }`,
  });
  // au-delà de 2,4 m, un grain fait quelques pixels : une sphère de 80 triangles au lieu de 500 (ou 320)
  const sphereLoin = new THREE.IcosahedronGeometry(1, 1);
  const geoLoin = new THREE.InstancedBufferGeometry();
  geoLoin.index = sphereLoin.index; geoLoin.attributes.position = sphereLoin.attributes.position;
  for (const k of ['aC', 'aA', 'aO']) geoLoin.setAttribute(k, geo.getAttribute(k));
  geoLoin.instanceCount = nG;
  const mGrains = new THREE.Mesh(geo, matGrains);
  mGrains.frustumCulled = false;
  pivot.add(mGrains);

  /* ---------- 2. La rafle et les pédicelles ---------- */
  const tiges = [];
  const ptsRafle = [];
  for (let i = 0; i <= 10; i++) { const t = (i / 10) * 0.92; ptsRafle.push(new THREE.Vector3(...axe(t))); }
  ptsRafle.unshift(new THREE.Vector3(0, 0.035, -0.004));
  const rafle = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ptsRafle), 40, 0.0024, 6, false);
  {
    const p = rafle.attributes.position, uv = rafle.attributes.uv;
    const c = new THREE.CatmullRomCurve3(ptsRafle), q = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      const t = uv.getX(i); c.getPointAt(Math.min(1, t), q);
      const k = 1.1 - t * 0.6;
      p.setXYZ(i, q.x + (p.getX(i) - q.x) * k, q.y + (p.getY(i) - q.y) * k, q.z + (p.getZ(i) - q.z) * k);
    }
    rafle.computeVertexNormals();
  }
  tiges.push(rafle);
  const cyl = new THREE.CylinderGeometry(0.0007, 0.0011, 1, 5, 1, true);
  const m4 = new THREE.Matrix4(), up = new THREE.Vector3(0, 1, 0), qq = new THREE.Quaternion();
  for (const g of grains) {
    const b = new THREE.Vector3(g.c[0] - g.ax[0] * g.r * 0.9, g.c[1] - g.ax[1] * g.r * 0.9, g.c[2] - g.ax[2] * g.r * 0.9);
    const vers = new THREE.Vector3(...g.attache).sub(b); const lv = vers.length();
    const a = b.clone().addScaledVector(vers, Math.min(1, 0.007 / Math.max(lv, 1e-4)));
    const d = new THREE.Vector3().subVectors(b, a); const len = d.length();
    if (len < 0.002) continue;
    qq.setFromUnitVectors(up, d.clone().normalize());
    m4.compose(a.clone().addScaledVector(d, 0.5), qq, new THREE.Vector3(1, len, 1));
    tiges.push(cyl.clone().applyMatrix4(m4));
  }
  const pos = [], nor = [];
  for (const g of tiges) { const gg = g.index ? g.toNonIndexed() : g; gg.computeVertexNormals(); pos.push(...gg.attributes.position.array); nor.push(...gg.attributes.normal.array); }
  const gt = new THREE.BufferGeometry();
  gt.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  gt.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  const matTige = new THREE.ShaderMaterial({
    uniforms: U,
    vertexShader: 'varying vec3 vPos; varying vec3 vN; void main() { vec4 w = modelMatrix * vec4(position, 1.0); vPos = w.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: /* glsl */`
      ${GLSL_LUMIERE}
      varying vec3 vPos; varying vec3 vN;
      void main() {
        vec3 v = normalize(vPos - cameraPosition);
        vec3 c = eclairer(vec3(0.2, 0.24, 0.07), normalize(vN), v, 0.7, 1.2, 0.4);
        gl_FragColor = vec4(brumer(c, vPos), 1.0);
      }`,
  });
  const mTiges = new THREE.Mesh(gt, matTige);
  mTiges.frustumCulled = false;
  pivot.add(mTiges);

  /* ---------- 3. Le sarment (de la tête du cep au-dessus de la grappe) ---------- */
  const y0 = hauteur(0, GRAPPE.z);
  const ptsS = [[0.0, y0 + 0.92, GRAPPE.z - 0.55], [0.06, y0 + 1.0, GRAPPE.z - 0.25], [0.2, y0 + 1.06, GRAPPE.z - 0.04], [0.3, GRAPPE.y + 0.04, GRAPPE.z], [0.38, GRAPPE.y + 0.1, GRAPPE.z + 0.22], [0.42, GRAPPE.y + 0.24, GRAPPE.z + 0.5], [0.4, GRAPPE.y + 0.42, GRAPPE.z + 0.72]]
    .map((p) => new THREE.Vector3(...p));
  const sarment = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ptsS), 60, 0.0075, 7, false);
  const matSarment = new THREE.ShaderMaterial({
    uniforms: { ...U, tEcorce: { value: tex.ecorce } },
    vertexShader: 'varying vec3 vPos; varying vec3 vN; varying vec2 vUv; void main() { vPos = position; vN = normal; vUv = uv; gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.0); }',
    fragmentShader: /* glsl */`
      uniform sampler2D tEcorce;
      ${GLSL_LUMIERE}
      varying vec3 vPos; varying vec3 vN; varying vec2 vUv;
      void main() {
        vec3 t = texture2D(tEcorce, vec2(vUv.y * 0.5, vUv.x * 9.0)).rgb;
        float noeud = smoothstep(0.03, 0.0, abs(fract(vUv.x * 4.0) - 0.5) - 0.46);
        vec3 alb = mix(vec3(0.24, 0.16, 0.08), t * vec3(0.9, 0.7, 0.45), 0.5) * (1.0 - noeud * 0.35);
        alb = mix(alb, vec3(0.22, 0.26, 0.08), smoothstep(0.55, 1.0, vUv.x));
        vec3 v = normalize(vPos - cameraPosition);
        vec3 c = eclairer(alb, normalize(vN), v, 0.8, 0.2, 0.3);
        vec3 hh = normalize(uLumDir - v);
        c += uLumCouleur * pow(max(dot(normalize(vN), hh), 0.0), 30.0) * 0.06;
        gl_FragColor = vec4(brumer(c, vPos), 1.0);
      }`,
  });
  const mSarment = new THREE.Mesh(sarment, matSarment);
  mSarment.frustumCulled = false;
  groupe.add(mSarment);

  /* ---------- 4. Les grandes feuilles (découpées dans la texture de la vigne, bombées, translucides) ---------- */
  // la grande feuille de la texture : rectangle en pixels (1024 px), et son point d'attache
  const R0 = { x0: 318, y0: 84, x1: 662, y1: 438 };
  const uv0 = [R0.x0 / 1024, 1 - R0.y1 / 1024], uv1 = [R0.x1 / 1024, 1 - R0.y0 / 1024];
  const feuille = new THREE.PlaneGeometry(1, 1, 12, 12);
  {
    const p = feuille.attributes.position, uv = feuille.attributes.uv;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i);
      // bombée en coupe, les lobes qui retombent
      const z = -0.16 * (x * x + y * y) + 0.05 * Math.sin(x * 9.0) * (x * x) - 0.08 * Math.max(0, -y) * Math.abs(x);
      p.setZ(i, z);
      uv.setXY(i, uv0[0] + (x + 0.5) * (uv1[0] - uv0[0]), uv0[1] + (y + 0.5) * (uv1[1] - uv0[1]));
    }
    feuille.computeVertexNormals();
  }
  const feuilles = [
    // [x, y, z, taille, lacet, tangage, roulis]
    [GRAPPE.x - 0.02, GRAPPE.y + 0.05, GRAPPE.z - 0.14, 0.2, 1.0, -0.15, 0.25],
    [GRAPPE.x + 0.05, GRAPPE.y + 0.13, GRAPPE.z + 0.16, 0.18, 1.35, 0.55, -0.4],
    [GRAPPE.x - 0.12, GRAPPE.y - 0.16, GRAPPE.z - 0.32, 0.22, 0.75, -0.35, 0.6],
    [GRAPPE.x + 0.12, GRAPPE.y + 0.32, GRAPPE.z + 0.42, 0.19, 1.6, 0.9, 0.2],
    [GRAPPE.x - 0.05, GRAPPE.y + 0.18, GRAPPE.z - 0.46, 0.21, 0.9, 0.2, -0.3],
  ];
  const matF = new THREE.ShaderMaterial({
    uniforms: { ...U, tVigne: { value: tex.vigne } },
    side: THREE.DoubleSide,
    alphaToCoverage: !mobile,
    vertexShader: /* glsl */`
      uniform float uTemps; uniform float uVent;
      varying vec2 vUv; varying vec3 vPos; varying vec3 vN;
      void main() {
        vec3 p = position;
        p.z += sin(uTemps * 1.7 + position.x * 3.0 + modelMatrix[3][2] * 9.0) * 0.012 * uVent * (p.x * p.x + p.y * p.y);
        vec4 w = modelMatrix * vec4(p, 1.0);
        vUv = uv; vPos = w.xyz; vN = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */`
      uniform sampler2D tVigne; uniform float uA2C;
      ${GLSL_LUMIERE}
      ${GLSL_ALPHA}
      varying vec2 vUv; varying vec3 vPos; varying vec3 vN;
      void main() {
        vec4 t = texture2D(tVigne, vUv);
        float a = uA2C > 0.5 ? alphaNet(t.a, vUv, 0.5) : t.a;
        if (a < (uA2C > 0.5 ? 0.02 : 0.5)) discard;
        vec3 v = normalize(vPos - cameraPosition);
        vec3 n = normalize(vN);
        bool dos = dot(n, v) > 0.0;
        if (dos) n = -n;
        vec3 alb = t.rgb * (dos ? vec3(0.85, 0.95, 0.75) : vec3(1.0));
        vec3 c = eclairer(alb, n, v, 0.85, 0.0, 0.3);
        // la lumière à travers la feuille : verte, les nervures plus claires
        float contre = pow(max(dot(v, uLumDir), 0.0), 1.6);
        float traverse = smoothstep(-0.1, 0.3, dot(-n, uLumDir));
        vec3 vert = alb * vec3(1.1, 1.45, 0.45) + vec3(0.06, 0.08, 0.0) * smoothstep(0.35, 0.6, dot(t.rgb, vec3(0.3, 0.6, 0.1)));
        c += uLumCouleur * min(vert, vec3(0.5)) * contre * traverse * 0.6 * (1.0 - smoothstep(0.32, 0.55, dot(t.rgb, vec3(0.3, 0.6, 0.1))));
        vec3 hh = normalize(uLumDir - v);
        c += uLumCouleur * pow(max(dot(n, hh), 0.0), 60.0) * 0.12;
        gl_FragColor = vec4(brumer(c, vPos), a);
      }`,
  });
  for (const [x, y, z, s, lac, tan, rou] of feuilles) {
    const m = new THREE.Mesh(feuille, matF);
    m.position.set(x, y, z);
    m.rotation.set(tan, lac, rou, 'YXZ');
    m.scale.setScalar(s);
    m.frustumCulled = false;
    groupe.add(m);
  }

  /* les ancres : un grain de face, la rafle, une feuille */
  const devant = grains.reduce((b, g) => (g.c[0] + g.c[2] > b.c[0] + b.c[2] && g.t > 0.25 && g.t < 0.55 ? g : b), grains[0]);
  const ancres = {
    grain: [GRAPPE.x + devant.c[0], GRAPPE.y + devant.c[1], GRAPPE.z + devant.c[2]],
    rafle: [GRAPPE.x, GRAPPE.y + 0.02, GRAPPE.z],
    feuille: [feuilles[1][0] + 0.02, feuilles[1][1] + 0.03, feuilles[1][2] + 0.04],
  };

  function animer(t, vent) {
    pivot.rotation.z = Math.sin(t * 0.9) * 0.025 * vent;
    pivot.rotation.x = Math.sin(t * 0.7 + 1.3) * 0.02 * vent;
  }
  groupe.traverse((o) => { o.frustumCulled = false; });
  /** Le niveau de détail des grains : true de près. */
  function detail(proche) { const g = proche ? geo : geoLoin; if (mGrains.geometry !== g) mGrains.geometry = g; }
  return { objet: groupe, animer, ancres, detail, centre: [GRAPPE.x, GRAPPE.y - 0.07, GRAPPE.z], detruire() { geo.dispose(); geoLoin.dispose(); sphere.dispose(); sphereLoin.dispose(); } };
}
