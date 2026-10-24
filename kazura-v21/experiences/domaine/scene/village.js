// Le domaine Kazura v21 : le village au loin, sur le flanc droit de la montagne boisée (comme sur la photo du
// Haut-Koenigsbourg : des maisons aux murs clairs et aux toits de tuiles, serrées au bas du flanc, dans les arbres). Une seule géométrie de maison (murs et toit à deux pans), posée en instances : un seul appel de dessin,
// quelques milliers de triangles. La nuit, des fenêtres s'allument.

import { alea, GLSL_BRUIT, GLSL_LUMIERE } from './commun.js';
import { solMontagne, VILLAGE } from './terrain.js';

/** Le cœur du village (terrain.js) : à droite du château vu depuis les vignes, au bas du flanc de la montagne. */
export { VILLAGE };

/** Les maisons du village : [x, y, z, angle, longueur, hauteur, profondeur, graine] à la suite (même tirage partout :
    arbres.js s'en sert pour planter les arbres entre elles). */
export function maisonsVillage(mobile) {
  const h = alea(41);
  const V = VILLAGE;
  const inst = [];
  const n = mobile ? 34 : 56;
  // un bourg serré au bas du flanc, le long de la pente, et deux hameaux à côté
  const noyaux = [[V.x, V.z, 24, 4, 0.7], [V.x + 32, V.z + 3, 11, 3, 0.18], [V.x - 30, V.z - 5, 9, 3, 0.12]];
  const gauss = () => { let u = 0; for (let k = 0; k < 4; k++) u += h(); return (u - 2) / 0.58; };
  let essais = 0;
  while (inst.length / 8 < n && essais++ < 3000) {
    let r = h(), q = noyaux[0];
    for (const k of noyaux) { if (r < k[4]) { q = k; break; } r -= k[4]; }
    const x = q[0] + gauss() * q[2], z = q[1] + gauss() * q[3];
    if (solMontagne(x, z, mobile) < 60) continue;
    // pas deux maisons l'une dans l'autre
    let libre = true;
    for (let j = 0; j < inst.length && libre; j += 8) if (Math.hypot(inst[j] - x, (inst[j + 2] - z) * 1.5) < 4.4) libre = false;
    if (!libre) continue;
    // des maisons plus petites que nature : le vrai village est à plusieurs kilomètres, on le rapproche sans qu'il écrase le château
    const l = 3 + h() * 1.6, p = 2.3 + h() * 0.8, ht = 2.4 + h() * 0.8;
    // les faîtages suivent à peu près les courbes de niveau (la pente descend vers la plaine)
    const a = (h() < 0.8 ? 0 : Math.PI / 2) + (h() - 0.5) * 0.4;
    // posée SUR le sol dessiné (solMontagne) : la façade aval touche le sol, l'arrière s'enfonce dans le talus
    const prof = Math.abs(Math.cos(a)) * p + Math.abs(Math.sin(a)) * l;
    const y = Math.min(solMontagne(x, z + prof * 0.5, mobile), solMontagne(x, z, mobile)) - 0.15;
    inst.push(x, y, z, a, l, ht, p, h());
  }
  return inst;
}

export function creerVillage(THREE, U, { mobile }) {
  const inst = maisonsVillage(mobile);
  const N = inst.length / 8;

  // une maison unité : murs de -0,35 (enfoncés dans le sol) à 0,55, haut toit alsacien de 0,55 à 1,5 ; faîtage selon x
  const pos = [], nor = [], mat = [];
  const quad = (a, b, c, d, m) => {
    const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [d[0] - a[0], d[1] - a[1], d[2] - a[2]];
    let nn = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    const l = Math.hypot(...nn); nn = nn.map((k) => k / l);
    for (const q of [a, b, c, a, c, d]) { pos.push(...q); nor.push(...nn); mat.push(m); }
  };
  const tri = (a, b, c, m) => {
    const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    let nn = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    const l = Math.hypot(...nn); nn = nn.map((k) => k / l);
    for (const q of [a, b, c]) { pos.push(...q); nor.push(...nn); mat.push(m); }
  };
  const y0 = -0.35, y1 = 0.55, yf = 1.5, d = 0.09;
  // les quatre murs
  quad([-0.5, y0, 0.5], [0.5, y0, 0.5], [0.5, y1, 0.5], [-0.5, y1, 0.5], 0);
  quad([0.5, y0, -0.5], [-0.5, y0, -0.5], [-0.5, y1, -0.5], [0.5, y1, -0.5], 0);
  quad([0.5, y0, 0.5], [0.5, y0, -0.5], [0.5, y1, -0.5], [0.5, y1, 0.5], 0);
  quad([-0.5, y0, -0.5], [-0.5, y0, 0.5], [-0.5, y1, 0.5], [-0.5, y1, -0.5], 0);
  // les pignons
  tri([0.5, y1, 0.5], [0.5, y1, -0.5], [0.5, yf, 0], 0);
  tri([-0.5, y1, -0.5], [-0.5, y1, 0.5], [-0.5, yf, 0], 0);
  // les deux pans du toit, avec un débord
  quad([-0.5 - d, y1 - 0.08, 0.5 + d], [0.5 + d, y1 - 0.08, 0.5 + d], [0.5 + d, yf, 0], [-0.5 - d, yf, 0], 1);
  quad([0.5 + d, y1 - 0.08, -0.5 - d], [-0.5 - d, y1 - 0.08, -0.5 - d], [-0.5 - d, yf, 0], [0.5 + d, yf, 0], 1);

  const geo = new THREE.InstancedBufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  geo.setAttribute('aMat', new THREE.Float32BufferAttribute(mat, 1));
  const aP = new Float32Array(N * 4), aS = new Float32Array(N * 4);
  for (let i = 0; i < N; i++) { aP.set(inst.slice(i * 8, i * 8 + 4), i * 4); aS.set(inst.slice(i * 8 + 4, i * 8 + 8), i * 4); }
  geo.setAttribute('aP', new THREE.InstancedBufferAttribute(aP, 4));
  geo.setAttribute('aS', new THREE.InstancedBufferAttribute(aS, 4));
  geo.instanceCount = N;

  const m = new THREE.ShaderMaterial({
    uniforms: U,
    vertexShader: /* glsl */`
      attribute float aMat; attribute vec4 aP; attribute vec4 aS;
      varying vec3 vPos; varying vec3 vN; varying vec3 vLoc; varying float vMat; varying float vGraine; varying vec3 vTaille;
      void main() {
        float c = cos(aP.w), s = sin(aP.w);
        vec3 q = position * vec3(aS.x, aS.y, aS.z);
        vec3 w = aP.xyz + vec3(q.x * c + q.z * s, q.y, -q.x * s + q.z * c);
        vec3 nq = normalize(normal / aS.xyz);
        vN = vec3(nq.x * c + nq.z * s, nq.y, -nq.x * s + nq.z * c);
        vLoc = q; vMat = aMat; vGraine = aS.w; vTaille = aS.xyz; vPos = w;
        gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.0);
      }`,
    fragmentShader: /* glsl */`
      uniform float uChateauLum; uniform float uTemps;
      ${GLSL_BRUIT}
      ${GLSL_LUMIERE}
      varying vec3 vPos; varying vec3 vN; varying vec3 vLoc; varying float vMat; varying float vGraine; varying vec3 vTaille;
      void main() {
        vec3 n = normalize(vN);
        vec3 v = normalize(vPos - cameraPosition);
        vec3 alb;
        float g = vGraine;
        // la grille des fenêtres (dérivées hors de toute condition) ; trop petite à l'écran, elle se fond en sa moyenne
        float u = abs(n.x) > abs(n.z) ? vLoc.z : vLoc.x;
        vec2 cel = vec2(u / 2.2, vLoc.y / (vTaille.y * 0.26));
        float flou = smoothstep(0.25, 0.7, max(fwidth(cel.x), fwidth(cel.y)));
        float fen = 0.0;
        if (vMat < 0.5) {
          // les murs : crépi blanc, crème ou ocre pâle, quelques colombages sombres
          alb = mix(vec3(0.38, 0.36, 0.33), vec3(0.40, 0.33, 0.26), step(0.7, g));
          alb = mix(alb, vec3(0.43, 0.42, 0.39), step(g, 0.3));
          // les fenêtres : une grille simple sur chaque mur (deux étages)
          vec2 f = abs(fract(cel) - 0.5);
          fen = step(f.x, 0.16) * step(f.y, 0.18) * step(0.05, vLoc.y) * step(vLoc.y, vTaille.y * 0.5);
          fen = mix(fen, 0.12 * step(0.05, vLoc.y), flou);
          alb = mix(alb, vec3(0.06, 0.06, 0.07), fen * 0.85);
        } else {
          // les toits de tuiles rouge orangé, plus ou moins vieillies, quelques-uns d'ardoise
          alb = mix(vec3(0.34, 0.10, 0.05), vec3(0.44, 0.15, 0.075), fract(g * 7.31));
          alb = mix(alb, vec3(0.06, 0.07, 0.09), step(0.88, fract(g * 3.7)));
        }
        // la nuit, les murs et les toits s'éteignent avec la montagne : seules les fenêtres restent
        float soir = max(uNuit, uChateauLum);
        alb *= mix(1.0, 0.1, soir);
        // à contre-jour (heure dorée), la pente regarde la plaine, à l'opposé du soleil : elle est dans l'ombre de la
        // montagne, le village aussi (pas de soleil direct sur les pignons, seulement le ciel)
        float face = smoothstep(-0.15, 0.25, uLumDir.z);
        alb *= mix(0.3, 1.0, face);
        float ndl = max(dot(n, uLumDir), 0.0) * face;
        vec3 c = alb * (uLumCouleur * ndl + ambiant(n));
        // la nuit, des fenêtres allumées (pas toutes)
        if (uChateauLum > 0.001 && vMat < 0.5) {
          float allume = mix(step(0.45, h21(floor(cel) + g * 31.0)), 0.55, flou);
          c += vec3(1.0, 0.62, 0.28) * fen * allume * uChateauLum * (2.6 + 0.4 * sin(uTemps * 0.7 + g * 40.0));
        }
        // la perspective aérienne, comme la montagne : à plus d'un kilomètre, tout bleuit un peu
        float dd = length(vPos - cameraPosition);
        // (un peu plus que la montagne : le vrai village est plus loin, et il ne doit pas sauter aux yeux)
        c = mix(c, uBrume * 0.75, (1.0 - exp(-dd * uBrumeDensite * 1.1)) * (1.0 - soir * 0.8));
        // et, de jour, le contraste du lointain : les maisons se fondent un peu dans la forêt (photo : un voile bleuté)
        c = mix(c, uBrume * 0.55, 0.24 * face * (1.0 - soir));
        gl_FragColor = vec4(brumer(c, vPos), 1.0);
      }`,
  });
  const village = new THREE.Mesh(geo, m);
  village.frustumCulled = false;
  village.userData.triangles = (pos.length / 9) * N;
  return village;
}
