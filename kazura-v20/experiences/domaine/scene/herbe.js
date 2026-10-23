// Le domaine Kazura : les herbes hautes et les fleurs sauvages (coquelicots, bleuets, marguerites).
// Brins instanciés pliés par le vent dans le nuanceur, lumière qui traverse au contre-jour,
// et la main (souris ou doigt) qui écarte ce qu'elle touche à l'écran.

import { alea, melangerBlocs, GLSL_BRUIT, GLSL_VENT, GLSL_LUMIERE, GLSL_MAIN } from './commun.js';
import { LIEU, hauteur } from './terrain.js';

/* Les chemins de caméra au ras du sol : on n'y plante rien (pas de brin collé à l'objectif). */
const COULOIRS = [
  [[-4.2, 27.4], [-0.6, 26.2], 0.5],
  [[9.2, 30.6], [5.6, 29.4], 0.55],
  [[1.1, 15.2], [4.1, 15.4], 0.3],
  [[-0.5, 18.2], [-1.3, 21.1], 0.42],
];
/* Le tonneau du domaine (scene/bouteille.js) : rien ne pousse à travers. */
const TON = { x: -1.6, z: 15.6, r: 0.46 };
const sousTonneau = (x, z) => Math.hypot(x - TON.x, z - TON.z) < TON.r;
function dansCouloir(x, z) {
  for (const [[ax, az], [bx, bz], r] of COULOIRS) {
    const dx = bx - ax, dz = bz - az;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz)));
    if (Math.hypot(x - ax - dx * t, z - az - dz * t) < r) return true;
  }
  return false;
}
const E = LIEU.rangs.ecart;
/* Devant les caméras au ras du sol, l'herbe lointaine reste plus basse : le regard passe et trouve le château. */
function degager(x, z) {
  let f = 1;
  for (const [cx, cz] of [[-2.4, 26.8], [7.4, 30]]) {
    const d = cz - z, lat = Math.abs(x - cx);
    if (d > 2.2 && d < 14 && lat < 2 + d * 0.9) f = Math.min(f, 0.42 + 0.58 * Math.min(1, Math.max(0, (d - 9) / 5)));
  }
  return f;
}
const dansRang = (x, z) => z < LIEU.rangs.zDebut - 0.3 && Math.abs(x - E * Math.round(x / E)) < 0.42;

/** Tire un point dans le pré : un cœur dense là où filment les plans rapprochés, puis tout le pré. */
function pointPre(h, coeur) {
  // tout près des caméras au ras du sol (plans 2 et 6) : le pré doit y être dense
  if (coeur && h() < 0.16) {
    const c = h() < 0.6 ? [-2.4, 25.0, 4.5, 1.7] : [7.2, 28.3, 4.5, 1.5];
    return [c[0] + (h() - 0.5) * 2 * c[2], c[1] + (h() - 0.5) * 2 * c[3]];
  }
  if (coeur) {
    const c = h() < 0.62 ? [-1.5, 24.5, 9, 6] : [4, 22, 13, 9];
    return [c[0] + (h() - 0.5) * 2 * c[2], c[1] + (h() - 0.5) * 2 * c[3]];
  }
  return [-40 + h() * 82, LIEU.pre.z0 + h() * (LIEU.pre.z1 - LIEU.pre.z0)];
}

export function creerHerbe(THREE, U, { mobile, reduit }) {
  const h = alea(11);
  const nPre = mobile ? 17000 : 64000, nRangs = mobile ? 4500 : 17000;
  const N = nPre + nRangs;
  const aR = new Float32Array(N * 4), aF = new Float32Array(N * 4);
  let n = 0;
  let essais = 0;
  while (n < N && essais < N * 4) {
    essais++;
    let x, z, haut, larg;
    if (n < nPre) {
      [x, z] = pointPre(h, h() < 0.68);
      if (z < LIEU.pre.z0 - 0.6) continue;
      const bord = Math.min(1, (z - LIEU.pre.z0) / 2.5);
      haut = (0.32 + Math.pow(h(), 0.8) * 0.62) * (0.55 + 0.45 * bord);
      haut *= degager(x, z);
      larg = 0.009 + h() * 0.014;
    } else {
      x = -12 + h() * 26; z = -42 + h() * 55;
      if (dansRang(x, z)) continue;
      haut = 0.1 + h() * 0.28;
      larg = 0.01 + h() * 0.014;
    }
    if (dansCouloir(x, z) || sousTonneau(x, z)) continue;
    if (Math.abs(x - LIEU.piquetMagique.x) < 0.28 && Math.abs(z - LIEU.piquetMagique.z) < 0.28) continue;
    aR.set([x, hauteur(x, z) - 0.02, z, h()], n * 4);
    aF.set([haut, larg, h() * Math.PI * 2, 0.1 + h() * 0.45], n * 4);
    n++;
  }
  melangerBlocs([[aR, 4], [aF, 4]], n, h);

  const S = mobile ? 4 : 5;
  const pos = [];
  for (let i = 0; i < S; i++) pos.push(-1, i / S, 0, 1, i / S, 0);
  pos.push(0, 1, 0);
  const idx = [];
  for (let i = 0; i < S - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  idx.push((S - 1) * 2, (S - 1) * 2 + 1, S * 2);
  const geo = new THREE.InstancedBufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.setAttribute('aRacine', new THREE.InstancedBufferAttribute(aR, 4));
  geo.setAttribute('aForme', new THREE.InstancedBufferAttribute(aF, 4));
  geo.instanceCount = n;

  const mat = new THREE.ShaderMaterial({
    uniforms: U,
    side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      attribute vec4 aRacine; attribute vec4 aForme;
      ${GLSL_BRUIT}
      ${GLSL_VENT}
      ${GLSL_MAIN}
      varying vec3 vPos; varying vec3 vN; varying float vT; varying float vR; varying float vCote;
      void main() {
        float t = position.y, cote = position.x;
        float hb = aForme.x, w = aForme.y, ang = aForme.z, courbe = aForme.w;
        vec2 dir = vec2(cos(ang), sin(ang));
        vec2 lat = vec2(-dir.y, dir.x);
        vec2 v = vent(aRacine.xz, 0.8 + aRacine.w) * (0.45 + aRacine.w * 0.7) * min(1.0, hb * 2.2);
        vec2 e = ecarter(aRacine.xyz + vec3(0.0, hb * 0.6, 0.0), 16.0) * 2.3;
        vec2 pousse = dir * courbe + v + e;
        float L2 = min(dot(pousse, pousse), 1.4);
        vec2 off = pousse * hb * t * t;
        float y = hb * t * (1.0 - 0.38 * L2 * t);
        float larg = w * (1.0 - t * t * t) * (0.75 + 0.25 * sqrt(t + 0.05));
        vec3 p = aRacine.xyz + vec3(off.x + lat.x * cote * larg * 0.5, y, off.y + lat.y * cote * larg * 0.5);
        vec3 tang = normalize(vec3(pousse.x * 2.0 * t, 1.0 - 0.76 * L2 * t, pousse.y * 2.0 * t));
        vec3 nrm = normalize(cross(vec3(lat.x, 0.0, lat.y), tang));
        nrm = normalize(nrm + vec3(lat.x, 0.0, lat.y) * cote * 0.45);
        vPos = p; vN = nrm; vT = t; vR = aRacine.w; vCote = cote;
        gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: /* glsl */`
      ${GLSL_LUMIERE}
      uniform float uLueur;
      varying vec3 vPos; varying vec3 vN; varying float vT; varying float vR; varying float vCote;
      void main() {
        vec3 v = normalize(vPos - cameraPosition);
        vec3 n = normalize(vN);
        if (dot(n, v) > 0.0) n = -n;
        vec3 base = vec3(0.022, 0.06, 0.008);
        vec3 milieu = mix(vec3(0.1, 0.24, 0.025), vec3(0.16, 0.26, 0.03), vR);
        vec3 pointe = mix(vec3(0.27, 0.42, 0.07), vec3(0.5, 0.4, 0.13), smoothstep(0.78, 0.95, vR));
        vec3 alb = mix(base, milieu, smoothstep(0.0, 0.45, vT));
        alb = mix(alb, pointe, smoothstep(0.4, 1.0, vT));
        float ao = mix(0.25, 1.0, smoothstep(0.0, 0.7, vT));
        vec3 c = eclairer(alb, n, v, ao, 1.5, 0.3);
        vec3 hh = normalize(uLumDir - v);
        c += uLumCouleur * pow(max(dot(n, hh), 0.0), 24.0) * 0.08 * vT;
        // la nuit, les pointes attrapent un peu de lumière magique
        c += vec3(0.25, 0.55, 0.45) * uLueur * 0.05 * smoothstep(0.7, 1.0, vT) * step(0.9, vR);
        gl_FragColor = vec4(brumer(c, vPos), 1.0);
      }`,
  });
  const herbe = new THREE.Mesh(geo, mat);
  herbe.frustumCulled = false;

  /* Les fleurs */
  const hf = alea(23);
  const nF = mobile ? 1100 : 3400;
  const fl = new Float32Array(nF * 4), ff = new Float32Array(nF * 4);
  const tetes = [];
  let m = 0;
  // un bouquet « héros » devant le plan au ras des herbes, et un autre au pied du piquet
  const heros = [[-2.3, 25.2, 0], [-1.7, 24.7, 0], [-2.9, 24.4, 2], [-1.2, 25.6, 1], [-0.5, 24.9, 0], [-3.4, 25.8, 2], [-2.0, 23.6, 0], [-0.9, 23.9, 2], [0.3, 24.4, 1],
    [6.4, 28.4, 0], [7.4, 28.9, 2], [5.6, 28.0, 1], [8.1, 28.2, 0], [1.9, 14.5, 0], [3.2, 14.8, 2], [2.8, 14.1, 1], [3.7, 14.3, 0], [2.1, 14.9, 1]];
  for (const [x, z, type] of heros) {
    if (m >= nF) break;
    const hh = type === 0 ? 0.55 + hf() * 0.2 : type === 1 ? 0.5 + hf() * 0.15 : 0.42 + hf() * 0.15;
    fl.set([x, hauteur(x, z) - 0.02, z, hf()], m * 4);
    ff.set([hh, type, 1.0 + hf() * 0.2, hf() * 6.28], m * 4);
    tetes.push({ x, y: hauteur(x, z) + hh, z, type }); m++;
  }
  let es = 0;
  while (m < nF && es < nF * 6) {
    es++;
    let x, z;
    const r = hf();
    if (r < 0.8) { [x, z] = pointPre(hf, hf() < 0.6); if (z < LIEU.pre.z0 - 0.4) continue; }
    else { x = -12 + hf() * 26; z = -38 + hf() * 50; if (dansRang(x, z)) continue; }
    if (dansCouloir(x, z) || sousTonneau(x, z)) continue;
    const tr = hf();
    const type = tr < 0.46 ? 0 : tr < 0.72 ? 2 : 1;
    const enRang = z < LIEU.pre.z0;
    const hh = (type === 0 ? 0.42 + hf() * 0.32 : type === 1 ? 0.38 + hf() * 0.28 : 0.3 + hf() * 0.3) * (enRang ? 0.6 : 1);
    fl.set([x, hauteur(x, z) - 0.02, z, hf()], m * 4);
    ff.set([hh, type, 0.8 + hf() * 0.45, hf() * 6.28], m * 4);
    tetes.push({ x, y: hauteur(x, z) + hh, z, type }); m++;
  }
  // (les têtes gardent l'ordre de tirage : le mélange ne sert qu'au nuanceur)
  const fl2 = fl.slice(0, m * 4), ff2 = ff.slice(0, m * 4);
  const S2 = 4;
  const fpos = [], fpart = [], fuv = [];
  for (let i = 0; i <= S2; i++) { fpos.push(-1, i / S2, 0, 1, i / S2, 0); fpart.push(0, 0); fuv.push(0, i / S2, 1, i / S2); }
  const tige = fpos.length / 3;
  fpos.push(-1, -1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0); fpart.push(1, 1, 1, 1); fuv.push(0, 0, 1, 0, 0, 1, 1, 1);
  const fidx = [];
  for (let i = 0; i < S2; i++) { const a = i * 2; fidx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  fidx.push(tige, tige + 1, tige + 2, tige + 1, tige + 3, tige + 2);
  const gf = new THREE.InstancedBufferGeometry();
  gf.setAttribute('position', new THREE.Float32BufferAttribute(fpos, 3));
  gf.setAttribute('aPart', new THREE.Float32BufferAttribute(fpart, 1));
  gf.setAttribute('uv', new THREE.Float32BufferAttribute(fuv, 2));
  gf.setIndex(fidx);
  gf.setAttribute('aRacine', new THREE.InstancedBufferAttribute(fl2, 4));
  gf.setAttribute('aFleur', new THREE.InstancedBufferAttribute(ff2, 4));
  gf.instanceCount = m;
  const matF = new THREE.ShaderMaterial({
    uniforms: U,
    side: THREE.DoubleSide,
    alphaToCoverage: !mobile,
    vertexShader: /* glsl */`
      attribute vec4 aRacine; attribute vec4 aFleur; attribute float aPart;
      ${GLSL_BRUIT}
      ${GLSL_VENT}
      ${GLSL_MAIN}
      varying vec3 vPos; varying vec2 vUv; varying float vPart; varying float vType; varying float vR; varying float vT;
      void main() {
        float hb = aFleur.x;
        vec2 v = vent(aRacine.xz, 1.2) * 0.55;
        vec2 e = ecarter(aRacine.xyz + vec3(0.0, hb, 0.0), 14.0) * 2.0;
        vec2 pousse = v + e + vec2(sin(aFleur.w), cos(aFleur.w)) * 0.12;
        float L2 = min(dot(pousse, pousse), 1.3);
        vec3 droite = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
        vec3 haut = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
        vec3 p;
        if (aPart < 0.5) {
          float t = position.y;
          vec2 off = pousse * hb * t * t;
          p = aRacine.xyz + vec3(off.x, hb * t * (1.0 - 0.35 * L2 * t), off.y) + droite * position.x * 0.0035;
          vT = t;
        } else {
          vec3 tete = aRacine.xyz + vec3(pousse.x * hb, hb * (1.0 - 0.35 * L2), pousse.y * hb);
          float taille = (aFleur.y < 0.5 ? 0.05 : aFleur.y < 1.5 ? 0.032 : 0.036) * aFleur.z;
          float rot = aFleur.w + uTemps * 0.0;
          vec2 q = position.xy;
          q = vec2(q.x * cos(rot) - q.y * sin(rot), q.x * sin(rot) + q.y * cos(rot));
          p = tete + (droite * q.x + haut * q.y * 0.85) * taille + haut * taille * 0.3;
          vT = 1.0;
        }
        vPos = p; vUv = uv; vPart = aPart; vType = aFleur.y; vR = aRacine.w;
        gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: /* glsl */`
      ${GLSL_LUMIERE}
      uniform float uLueur; uniform float uTemps; uniform float uA2C;
      varying vec3 vPos; varying vec2 vUv; varying float vPart; varying float vType; varying float vR; varying float vT;
      void main() {
        vec3 v = normalize(vPos - cameraPosition);
        vec3 c; float a = 1.0;
        if (vPart < 0.5) {
          vec3 alb = mix(vec3(0.03, 0.08, 0.015), vec3(0.12, 0.24, 0.05), vT);
          c = eclairer(alb, normalize(-v + vec3(0.0, 0.5, 0.0)), v, mix(0.3, 1.0, vT), 1.2, 0.5);
        } else {
          vec2 p = vUv * 2.0 - 1.0;
          float r = length(p); float an = atan(p.y, p.x);
          vec3 alb; vec3 lueur; float m;
          if (vType < 0.5) {
            m = 0.0; float dp = 1.0; float pli = 0.0;
            for (int i = 0; i < 4; i++) {
              float ag = float(i) * 1.5708 + vR * 3.0;
              vec2 cc = vec2(cos(ag), sin(ag)) * 0.34;
              float d = length(p - cc);
              float mi = 1.0 - smoothstep(0.54, 0.6 + 0.04 * sin(an * 7.0 + vR * 9.0), d);
              // le pétale du dessus garde sa propre ombre ; un liseré sombre là où il en recouvre un autre
              if (mi > 0.5) { pli = max(pli, m * smoothstep(0.5, 0.58, d)); dp = d; }
              m = max(m, mi);
            }
            float froisse = 0.9 + 0.1 * sin(an * 34.0 + r * 12.0) + 0.06 * sin(r * 40.0 + an * 5.0);
            alb = vec3(0.8, 0.04, 0.02) * mix(0.5, 1.12, smoothstep(0.08, 0.62, r)) * froisse;
            alb *= mix(1.0, 0.55, pli);
            alb += vec3(0.25, 0.05, 0.0) * smoothstep(0.35, 0.58, dp);
            alb = mix(alb, vec3(0.012, 0.008, 0.01), 1.0 - smoothstep(0.16, 0.24, r));
            alb = mix(alb, vec3(0.12, 0.14, 0.07), 1.0 - smoothstep(0.08, 0.11, r));
            lueur = vec3(0.9, 0.22, 0.2);
          } else if (vType < 1.5) {
            float lobe = pow(abs(cos(an * 4.5)), 0.6);
            float rr = 0.5 + 0.45 * lobe + 0.05 * sin(an * 36.0);
            m = 1.0 - smoothstep(rr - 0.06, rr, r);
            alb = mix(vec3(0.16, 0.03, 0.3), vec3(0.06, 0.16, 0.8), smoothstep(0.2, 0.55, r));
            lueur = vec3(0.45, 0.55, 1.6);
          } else {
            float pet = abs(sin(an * 10.0 + vR * 6.0));
            m = (1.0 - smoothstep(0.86, 0.97, r)) * (1.0 - smoothstep(0.55, 0.9, pet * smoothstep(0.2, 0.4, r)));
            alb = vec3(0.86, 0.85, 0.8) * mix(0.75, 1.0, smoothstep(0.2, 0.7, r));
            float coeur = 1.0 - smoothstep(0.24, 0.29, r);
            alb = mix(alb, vec3(0.85, 0.48, 0.02) * (0.85 + 0.15 * sin(p.x * 60.0) * sin(p.y * 60.0)), coeur);
            m = max(m, coeur);
            lueur = vec3(1.2, 1.05, 0.55);
          }
          a = m;
          if (a < (uA2C > 0.5 ? 0.05 : 0.5)) discard;
          c = eclairer(alb, normalize(-v + vec3(0.0, 0.6, 0.0)), v, 0.95, 1.5, 0.6);
          float pulse = 0.75 + 0.25 * sin(uTemps * 1.7 + vR * 30.0);
          float brille = step(0.55, fract(vR * 7.31));
          float forme = vType < 0.5 ? 0.15 + 0.85 * smoothstep(0.4, 0.95, r) : 0.3 + 0.7 * (1.0 - smoothstep(0.0, 0.8, r));
          c += lueur * uLueur * pulse * (0.06 + 0.4 * brille) * forme;
        }
        gl_FragColor = vec4(brumer(c, vPos), a);
      }`,
  });
  const fleurs = new THREE.Mesh(gf, matF);
  fleurs.frustumCulled = false;

  const groupe = new THREE.Group();
  groupe.add(herbe, fleurs);
  return { objet: groupe, herbe, fleurs, nHerbe: n, tetes };
}
