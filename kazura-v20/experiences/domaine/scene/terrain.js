// Le domaine Kazura : le lieu (relief, rangs de vigne, pré, rideau d'arbres, colline, château) et le sol.
// Unités : le mètre. La caméra regarde vers -z ; le château est au sommet de la colline, loin devant.

import { fbm2, lisse, GLSL_BRUIT, GLSL_LUMIERE } from './commun.js';

export const LIEU = {
  rangs: { k0: -12, k1: 12, ecart: 2.5, zDebut: 13.6, zFin: -74 },
  pre: { z0: 14.2, z1: 44 },
  rideau: { z0: -88, z1: -122 },
  colline: { x: 30, z: -560, rx: 330, rz: 250, h: 118 },
  arbres: [{ x: -11.2, z: -27 }, { x: -5.1, z: -43 }],   // les deux petits arbres dans les rangs
  piquetMagique: { x: 2.5, z: 13.6 },                       // le piquet où s'enroule la liane (tête de rang)
};

const C = LIEU.colline;
function dome(x, z, cx, cz, rx, rz, h, forme = 2.2) {
  const dx = (x - cx) / rx, dz = (z - cz) / rz;
  const r = Math.sqrt(dx * dx + dz * dz);
  if (r >= 1) return 0;
  return h * Math.pow(1 - Math.pow(r, forme), 1.8);
}

/** Hauteur du sol (le relief est calculé ici une fois, et sert à poser chaque plante). */
export function hauteur(x, z) {
  let y = Math.min(Math.max(0, -z), 120) * 0.028 - Math.max(0, z - 16) * 0.018;
  y += (fbm2(x * 0.018 + 3.1, z * 0.018 + 1.7, 3) - 0.5) * 2.2;
  y += lisse(-92, -210, z) * 12;
  y += dome(x, z, C.x, C.z, C.rx, C.rz, C.h);
  y += dome(x, z, -460, -730, 330, 290, 104, 1.8);
  y += dome(x, z, 520, -780, 370, 300, 118, 1.8);
  y += dome(x, z, -150, -390, 170, 130, 44, 2);
  // bosses de forêt sur la colline
  const surColline = lisse(0.98, 0.6, Math.hypot((x - C.x) / C.rx, (z - C.z) / C.rz));
  y += surColline * (fbm2(x * 0.03, z * 0.03, 3) - 0.45) * 10;
  return y;
}

export const SOMMET = (() => ({ x: C.x, z: C.z, y: hauteur(C.x, C.z) }))();

/** Grille de sol à pas variable : fine près de la caméra, large au loin. */
function grille(THREE, mobile) {
  const zs = [], xs = [];
  const fz = mobile ? 1.7 : 1;
  for (let z = 50; z > -1000; ) { zs.push(z); z -= (0.9 + Math.max(0, -z) * 0.028 + Math.max(0, z - 20) * 0.05) * fz; }
  for (let x = -900; x < 960; ) { xs.push(x); x += (1.1 + Math.abs(x - 10) * 0.035) * fz; }
  const nx = xs.length, nz = zs.length;
  const pos = new Float32Array(nx * nz * 3);
  let k = 0;
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { pos[k++] = xs[i]; pos[k++] = hauteur(xs[i], zs[j]); pos[k++] = zs[j]; }
  const idx = new Uint32Array((nx - 1) * (nz - 1) * 6);
  k = 0;
  for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) {
    const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1;
    idx[k++] = a; idx[k++] = b; idx[k++] = c; idx[k++] = b; idx[k++] = d; idx[k++] = c;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  g.computeVertexNormals();
  return g;
}

export function creerSol(THREE, U, tex, { mobile }) {
  const geo = grille(THREE, mobile);
  const R = LIEU.rangs;
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...U, tHerbe: { value: tex.herbe }, tCanopee: { value: tex.canopee } },
    vertexShader: /* glsl */`
      varying vec3 vPos; varying vec3 vN;
      void main() { vPos = position; vN = normal; gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */`
      uniform sampler2D tHerbe; uniform sampler2D tCanopee;
      ${GLSL_BRUIT}
      ${GLSL_LUMIERE}
      varying vec3 vPos; varying vec3 vN;
      float bande(float x, float a, float b, float f) { return smoothstep(a - f, a + f, x) * (1.0 - smoothstep(b - f, b + f, x)); }
      void main() {
        vec3 n = normalize(vN);
        vec3 v = normalize(vPos - cameraPosition);
        float dist = length(vPos - cameraPosition);
        vec2 xz = vPos.xz;
        // herbe : deux échelles pour casser la répétition
        vec3 h1 = texture2D(tHerbe, xz / 2.6).rgb;
        vec3 h2 = texture2D(tHerbe, xz / 11.0 + 0.37).rgb;
        float macro = fbm3(xz * 0.035);
        vec3 herbe = mix(h1, h2, smoothstep(6.0, 40.0, dist)) * mix(0.75, 1.15, macro);
        herbe *= vec3(0.92, 1.0, 0.82);
        // le vignoble : terre sous les rangs, herbe rase entre
        float vigne = bande(vPos.x, ${(R.k0 * R.ecart - 1).toFixed(1)}, ${(R.k1 * R.ecart + 1).toFixed(1)}, 0.6) * bande(vPos.z, ${(R.zFin - 1).toFixed(1)}, ${(R.zDebut + 0.6).toFixed(1)}, 0.6);
        float dr = abs(vPos.x - ${R.ecart.toFixed(2)} * floor(vPos.x / ${R.ecart.toFixed(2)} + 0.5));
        float terre = (1.0 - smoothstep(0.32, 0.62, dr + (bruit(xz * 3.0) - 0.5) * 0.25)) * vigne;
        vec3 sol = vec3(0.30, 0.22, 0.15) * mix(0.7, 1.1, bruit(xz * 6.0));
        vec3 alb = mix(herbe, sol, terre * 0.85);
        // au pied des herbes hautes du pré, le sol est dans l'ombre
        float pre = smoothstep(14.0, 15.5, vPos.z) * (1.0 - smoothstep(42.0, 46.0, vPos.z));
        alb = mix(alb, alb * vec3(0.45, 0.5, 0.35), pre);
        // ombres des haies de vigne (calcul exact pour une haie de 1,6 m, adoucie)
        float ombre = 0.0;
        if (vigne > 0.0 && uLumDir.y > 0.02) {
          float sx = clamp(1.55 * uLumDir.x / uLumDir.y, -7.0, 7.0);
          float lo = vPos.x + min(0.0, sx) - 0.34, hi = vPos.x + max(0.0, sx) + 0.34;
          for (int i = -4; i <= 4; i++) {
            float c = ${R.ecart.toFixed(2)} * (floor((vPos.x + sx * 0.5) / ${R.ecart.toFixed(2)} + 0.5) + float(i));
            ombre = max(ombre, smoothstep(lo - 0.25, lo + 0.25, c) * (1.0 - smoothstep(hi - 0.25, hi + 0.25, c)));
          }
          ombre *= vigne * (1.0 - uNuit);
        }
        // la forêt (rideau d'arbres et colline) : canopée vue de loin
        float foret = smoothstep(-80.0, -100.0, vPos.z) * (1.0 - smoothstep(-128.0, -150.0, vPos.z) * 0.0);
        float colline = 1.0 - smoothstep(0.82, 1.02, length(vec2((vPos.x - ${C.x.toFixed(1)}) / ${C.rx.toFixed(1)}, (vPos.z - (${C.z.toFixed(1)})) / ${C.rz.toFixed(1)})));
        float collines = max(colline, smoothstep(14.0, 40.0, vPos.y));
        foret = max(foret * smoothstep(-86.0, -96.0, vPos.z), collines);
        vec3 can = texture2D(tCanopee, xz / 46.0).rgb;
        vec3 can2 = texture2D(tCanopee, xz / 13.0 + 0.5).rgb;
        vec3 bois = mix(can, can2, 0.5) * vec3(0.55, 0.72, 0.5) * mix(0.6, 1.1, fbm3(xz * 0.02));
        alb = mix(alb, bois, foret);
        float ao = mix(1.0, 0.82, terre) * mix(1.0, 0.55, ombre);
        vec3 nn = normalize(n + vec3((can2.g - 0.4) * 0.6, 0.0, (can.g - 0.4) * 0.6) * foret);
        vec3 c = eclairer(alb, nn, v, ao, 0.0, 0.2);
        c *= mix(1.0, 0.45, ombre);
        gl_FragColor = vec4(brumer(c, vPos), 1.0);
      }`,
  });
  const sol = new THREE.Mesh(geo, mat);
  sol.frustumCulled = false;
  return sol;
}

/** Les Vosges au loin : une couronne de crêtes, presque toute dans la brume. */
export function creerLointain(THREE, U) {
  const nA = 160, nR = 6;
  const pos = [], idx = [];
  for (let j = 0; j < nR; j++) {
    const r = 1500 + j * 260;
    for (let i = 0; i <= nA; i++) {
      const a = -1.75 + (3.5 * i) / nA;
      const x = Math.sin(a) * r + 30, z = -Math.cos(a) * r - 200;
      const crete = (fbm2(a * 3.1 + j * 7.3, j * 1.7, 4)) * 330 + 60 + j * 25;
      const y = j === 0 ? -40 : crete * (0.75 + 0.25 * Math.sin(a * 2.0 + j));
      pos.push(x, y, z);
    }
  }
  for (let j = 0; j < nR - 1; j++) for (let i = 0; i < nA; i++) {
    const a = j * (nA + 1) + i, b = a + 1, c = a + nA + 1, d = c + 1;
    idx.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  const mat = new THREE.ShaderMaterial({
    uniforms: U,
    side: THREE.DoubleSide,
    vertexShader: 'varying vec3 vPos; varying vec3 vN; void main() { vPos = position; vN = normal; gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.0); }',
    fragmentShader: /* glsl */`
      ${GLSL_LUMIERE}
      varying vec3 vPos; varying vec3 vN;
      void main() {
        vec3 n = normalize(vN); if (n.y < 0.0) n = -n;
        vec3 c = eclairer(vec3(0.07, 0.11, 0.08), n, normalize(vPos - cameraPosition), 1.0, 0.0, 0.3);
        vec3 dv = vPos - cameraPosition; float d = length(dv);
        float f = 1.0 - exp(-d * uBrumeDensite * 0.55);
        float s = pow(max(dot(dv / d, uSoleil), 0.0), 6.0);
        vec3 col = mix(uBrume, uBrumeSoleil, s * 0.85);
        gl_FragColor = vec4(mix(c, col, clamp(f, 0.0, 0.93)), 1.0);
      }`,
  });
  const m = new THREE.Mesh(g, mat);
  m.frustumCulled = false;
  return m;
}

/** v20 : la montagne boisée derrière le château, comme sur la photo du Haut-Koenigsbourg (la vue depuis la plaine).
    Une crête couverte de forêt (canopée en texture, vallons plus sombres), à 300-700 m derrière la colline : depuis le
    téléobjectif du chapitre du château elle monte derrière le bas des murs ; depuis les vignes elle reste sous le château,
    qui garde le ciel pour lui. */
export function creerMontagne(THREE, U, tex, { mobile }) {
  const nx = mobile ? 90 : 150, nz = mobile ? 30 : 46;
  const X0 = -900, X1 = 1000, Z0 = -1500, Z1 = -800;
  const crete = (x) => 280 + 120 * Math.exp(-(((x - 60) / 460) ** 2)) + (fbm2(x * 0.004 + 7.0, 2.3, 4) - 0.5) * 80;
  const pos = new Float32Array((nx + 1) * (nz + 1) * 3);
  let k = 0;
  for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) {
    const x = X0 + ((X1 - X0) * i) / nx, z = Z0 + ((Z1 - Z0) * j) / nz;
    const t = (z - Z0) / (Z1 - Z0);                       // 0 au fond, 1 devant
    const profil = Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.35)), 0.8) * (1 - Math.max(0, t - 0.74) * 3.8);
    const y = crete(x) * Math.max(0, profil) + (fbm2(x * 0.012, z * 0.012, 4) - 0.5) * 40 * profil - 30;
    pos[k++] = x; pos[k++] = y; pos[k++] = z;
  }
  const idx = [];
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1;
    idx.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...U, tCanopee: { value: tex.canopee } },
    side: THREE.DoubleSide,
    vertexShader: 'varying vec3 vPos; varying vec3 vN; void main() { vPos = position; vN = normal; gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.0); }',
    fragmentShader: /* glsl */`
      uniform sampler2D tCanopee;
      ${GLSL_BRUIT}
      ${GLSL_LUMIERE}
      varying vec3 vPos; varying vec3 vN;
      void main() {
        vec3 n = normalize(vN); if (n.y < 0.0) n = -n;
        vec3 v = normalize(vPos - cameraPosition);
        vec3 can = texture2D(tCanopee, vPos.xz / 34.0).rgb;
        vec3 can2 = texture2D(tCanopee, vPos.xz / 11.0 + 0.3).rgb;
        // feuillus et sapins mêlés : des taches plus sombres et plus bleues
        float sapins = smoothstep(0.45, 0.7, bruit(vPos.xz * 0.01 + 4.0));
        vec3 alb = mix(can, can2, 0.5) * mix(vec3(0.22, 0.32, 0.25), vec3(0.13, 0.21, 0.21), sapins) * mix(0.55, 1.1, bruit(vPos.xz * 0.006));
        // les couronnes des arbres, vues de loin : un grain sombre
        alb *= mix(0.45, 1.2, bruit(vPos.xz * 0.11)) * mix(0.7, 1.1, bruit(vPos.xz * 0.37 + 5.0));
        vec3 nn = normalize(n + vec3((can2.g - 0.4) * 0.8, 0.0, (can.g - 0.4) * 0.8));
        vec3 c = eclairer(alb, nn, v, 0.8, 0.0, 0.1);
        // la perspective aérienne : à plus d'un kilomètre, la forêt bleuit
        float d = length(vPos - cameraPosition);
        c = mix(c, uBrume * 0.75, (1.0 - exp(-d * uBrumeDensite * 0.5)) * (1.0 - uNuit * 0.5));
        gl_FragColor = vec4(brumer(c, vPos), 1.0);
      }`,
  });
  const m = new THREE.Mesh(g, mat);
  m.frustumCulled = false;
  return m;
}
