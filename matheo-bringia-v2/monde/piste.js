/* La piste d'Angerville, de nuit : le vrai tracé (trace.js), 1198 m, 8 m de large.
   - le ruban de piste : bitume (grain, taches, gomme sur la trajectoire), lignes blanches, vibreurs rouges et blancs
     en relief aux virages, bas-côté d'herbe sèche et bacs de gravier à l'extérieur des épingles, grille de départ et
     ligne à damier ;
   - le sol : les champs moissonnés de la Beauce, la nuit ;
   - le ciel : nuit, étoiles, nuages accrochés par la lueur ORANGE de l'horizon, lisière d'arbres au loin.
   L'éclairage vient des projecteurs (les 8 plus proches de la caméra, mis à jour à chaque image) : flaques de lumière,
   reflets satinés sur le bitume. Au final (uTrace), la piste se replie en tracé lumineux vu du ciel. */
import { TRACE } from './trace.js';
import { HP } from './commun.js';

export const LONGUEUR = 1198;
export const LARGEUR = 8;
const N = TRACE.length;
const PAS = LONGUEUR / N;
/* la ligne de départ et d'arrivée : sur la ligne droite des stands */
export const U_LIGNE = 0.04;

/* ------------------------------------------------------------ le tracé échantillonné */
function lisserBoucle(P, r) {
  const out = [];
  for (let i = 0; i < N; i++) {
    let x = 0, z = 0, w = 0;
    for (let k = -r; k <= r; k++) { const p = P[(i + k + N) % N], g = Math.exp(-(k * k) / (2 * (r / 2) * (r / 2))); x += p[0] * g; z += p[1] * g; w += g; }
    out.push([x / w, z / w]);
  }
  return out;
}
const POS = TRACE;
const POS_L = lisserBoucle(TRACE, 8);   // pour la caméra (lissée sur ±16 m)
function tangentes(P, r) {
  return P.map((_, i) => { const a = P[(i - r + N) % N], b = P[(i + r) % N]; const dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1; return [dx / l, dz / l]; });
}
const TAN = tangentes(POS, 2);
const TAN_L = tangentes(POS_L, 4);
/* courbure signée (1/m) : > 0 quand la piste tourne à droite */
const COURB = (() => {
  const c = TAN_L.map((t, i) => { const a = TAN_L[(i - 3 + N) % N], b = TAN_L[(i + 3) % N]; const cr = a[0] * b[1] - a[1] * b[0]; return cr / (6 * PAS); });
  return lisserBoucle(c.map((v) => [v, 0]), 6).map((v) => v[0]);
})();
/* la trajectoire : vers l'intérieur des virages (corde), le long de l'extérieur avant (en mètres, + = à droite) */
const TRAJ = (() => {
  const t = COURB.map((k) => Math.max(-2.6, Math.min(2.6, k * 95)));
  return lisserBoucle(t.map((v) => [v, 0]), 10).map((v) => v[0]);
})();

const mod = (u) => ((u % 1) + 1) % 1;
function interp(T, u) {
  const f = mod(u) * N, i = Math.floor(f), t = f - i, a = T[i % N], b = T[(i + 1) % N];
  return Array.isArray(a) ? [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t] : a + (b - a) * t;
}
export const piste = {
  N, PAS, POS, TAN,
  point: (u) => interp(POS, u),
  pointLisse: (u) => interp(POS_L, u),
  tangente: (u) => { const t = interp(TAN, u), l = Math.hypot(t[0], t[1]) || 1; return [t[0] / l, t[1] / l]; },
  tangenteLisse: (u) => { const t = interp(TAN_L, u), l = Math.hypot(t[0], t[1]) || 1; return [t[0] / l, t[1] / l]; },
  courbure: (u) => interp(COURB, u),
  trajectoire: (u) => interp(TRAJ, u),
  /* la droite de la piste (vers l'extérieur droit), au sol */
  droite: (t) => [-t[1], t[0]],
  /* distance au tracé le plus proche (mètres), pour placer le décor sans le poser sur une autre portion */
  distance(x, z) { let m = 1e9; for (let i = 0; i < N; i += 2) { const p = POS[i], d = (p[0] - x) ** 2 + (p[1] - z) ** 2; if (d < m) m = d; } return Math.sqrt(m); },
};

/* ------------------------------------------------------------ l'éclairage partagé (GLSL) */
export const NB_LAMPES = 8;
export const GLSL_LUMIERE = `
uniform vec4 uLampes[${NB_LAMPES}];   // xyz : la tête du projecteur ; w : sa force
uniform vec3 uCouleurLampe;
uniform float uTemps, uNuit, uTrace, uOrangeTunnel, uNbL;
uniform vec3 uCam;
float mbH(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float mbB(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mbH(i), mbH(i + vec2(1.0, 0.0)), f.x), mix(mbH(i + vec2(0.0, 1.0)), mbH(i + vec2(1.0, 1.0)), f.x), f.y); }
float mbF(vec2 p) { return mbB(p) * 0.5 + mbB(p * 2.03 + 1.7) * 0.3 + mbB(p * 4.1 + 3.1) * 0.2; }
// l'éclairement au sol (loi du cosinus) et un reflet satiné vers la caméra (rugosité r)
vec3 eclairer(vec3 p, vec3 albedo, float brillance, float r) {
  vec3 V = normalize(uCam - p);
  vec3 dif = vec3(0.0), spec = vec3(0.0);
  // le bitume mouillé par plaques : les projecteurs s'y reflètent en longues traînées verticales
  vec3 R = reflect(-V, vec3(0.0, 1.0, 0.0));
  vec2 Rh = normalize(R.xz + 1e-5);
  float mouille = (0.35 + 0.65 * mbB(p.xz * 0.21)) * (0.7 + 0.3 * mbB(p.xz * 3.1));
  for (int i = 0; i < ${NB_LAMPES}; i++) {
    if (float(i) >= uNbL) break;
    vec4 L = uLampes[i];
    if (L.w <= 0.0) continue;
    vec3 d = L.xyz - p; float d2 = dot(d, d); vec3 l = d * inversesqrt(d2);
    float e = L.w * max(l.y, 0.0) * 225.0 / (225.0 + d2);
    dif += e;
    vec3 h = normalize(l + V);
    float nh = max(h.y, 0.0);
    spec += L.w * pow(nh, r) * (r * 0.03 + 0.5) * 400.0 / (400.0 + d2);
    vec2 Lh = normalize(d.xz + 1e-5);
    float daz = 1.0 - dot(Rh, Lh), del = R.y - l.y;
    spec += L.w * exp(-daz * 5200.0) * exp(-del * del * 9.0) * mouille * 9.0 * 900.0 / (900.0 + d2);
  }
  vec3 amb = vec3(0.006, 0.007, 0.011) + vec3(0.018, 0.007, 0.002) * uNuit;
  return albedo * (amb + dif * uCouleurLampe * 0.9) + spec * uCouleurLampe * brillance * 0.05;
}
`;

/* ------------------------------------------------------------ le ruban de piste */
/* profil en travers (mètres depuis l'axe ; + = à droite) */
const PROFIL = [-9.5, -7, -5.6, -5.25, -4.15, -4.0, -3.85, -2, 0, 2, 3.85, 4.0, 4.15, 5.25, 5.6, 7, 9.5];

export function creerRuban(THREE, U) {
  const pos = [], att = [], trj = [], idx = [];
  const M = PROFIL.length;
  // vibreurs : à l'intérieur des virages serrés, et à l'extérieur des plus serrés ; gravier à l'extérieur des épingles
  const kerb = COURB.map((k) => Math.min(1, Math.max(0, (Math.abs(k) - 1 / 70) * 60)));
  const kerbL = lisserBoucle(kerb.map((v) => [v, 0]), 3).map((v) => Math.min(1, v[0] * 1.6));
  for (let i = 0; i <= N; i++) {
    const j = i % N, p = POS[j], t = TAN[j], r = [-t[1], t[0]], k = COURB[j];
    const kIn = kerbL[j], kOut = Math.min(1, Math.max(0, (Math.abs(k) - 1 / 32) * 90));
    // côté intérieur : à droite si la piste tourne à droite
    const kD = k > 0 ? kIn : Math.max(kOut, 0), kG = k < 0 ? kIn : Math.max(kOut, 0);
    const gravD = k < 0 ? Math.min(1, Math.max(0, (Math.abs(k) - 1 / 40) * 80)) : 0;
    const gravG = k > 0 ? Math.min(1, Math.max(0, (Math.abs(k) - 1 / 40) * 80)) : 0;
    for (let c = 0; c < M; c++) {
      const lat = PROFIL[c];
      const cote = lat > 0 ? kD : kG;
      const enKerb = Math.abs(lat) > 4.05 && Math.abs(lat) < 5.3 ? 1 : 0;
      const y = 0.02 + enKerb * cote * (Math.abs(lat) < 4.6 ? 0.05 : 0.07);
      pos.push(p[0] + r[0] * lat, y, p[1] + r[1] * lat);
      att.push(i * PAS, lat, cote, lat > 0 ? gravD : gravG);
      trj.push(TRAJ[j]);
    }
  }
  for (let i = 0; i < N; i++) for (let c = 0; c < M - 1; c++) {
    const a = i * M + c, b = a + 1, d = (i + 1) * M + c, e = d + 1;
    idx.push(a, b, d, b, e, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aPiste', new THREE.Float32BufferAttribute(att, 4));
  g.setAttribute('aTraj', new THREE.Float32BufferAttribute(trj, 1));
  g.setIndex(idx);
  g.computeBoundingSphere();
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...U, uLigne: { value: U_LIGNE * LONGUEUR }, uDessin: { value: 0 } },
    vertexShader: HP + `
      attribute vec4 aPiste; attribute float aTraj;
      varying vec3 vMonde; varying vec4 vP; varying float vTraj;
      void main() { vP = aPiste; vTraj = aTraj; vec4 m = modelMatrix * vec4(position, 1.0); vMonde = m.xyz; gl_Position = projectionMatrix * viewMatrix * m; }`,
    fragmentShader: HP + GLSL_LUMIERE + `
      uniform float uLigne, uDessin;
      varying vec3 vMonde; varying vec4 vP; varying float vTraj;
      float ligne(float d, float e, float f) { return 1.0 - smoothstep(e * 0.5, e * 0.5 + f, abs(d)); }
      vec3 champ(vec2 p) {
        float s = mbF(p * 0.08), r = mbB(vec2(p.x * 0.6 + p.y * 0.2, p.y * 3.0));
        return vec3(0.075, 0.062, 0.04) * (0.6 + 0.6 * s) * (0.85 + 0.3 * r);
      }
      void main() {
        float u = vP.x, lat = vP.y, kerb = vP.z, grav = vP.w;
        vec2 p = vMonde.xz;
        float dist = length(vMonde - uCam);
        float f = 0.012 + dist * 0.0022;
        float alat = abs(lat);
        // le bitume : grain fin fondu au loin, taches, réparations
        float detail = clamp(1.0 - dist / 45.0, 0.0, 1.0);
        float grain = mbB(p * 11.0) * 0.55 + mbB(p * 29.0) * 0.45;
        float tache = mbF(vec2(u * 0.12, lat * 0.25));
        vec3 bit = vec3(0.062, 0.064, 0.07) * (0.66 + 0.6 * tache);
        bit *= mix(1.0, 0.62 + 0.76 * grain, detail * 0.9);
        // la gomme sur la trajectoire (plus sombre, plus lisse), et des traces de freinage
        float tr = vTraj;
        float gomme = exp(-(((lat - tr) / 1.35) * ((lat - tr) / 1.35)));
        float traces = smoothstep(0.55, 0.9, mbB(vec2(u * 0.06, lat * 3.2))) * smoothstep(0.4, 0.8, mbB(vec2(u * 0.02 + 7.0, 1.0)));
        bit *= 1.0 - 0.42 * gomme - 0.25 * traces * (1.0 - gomme);
        float rug = mix(18.0, 46.0, gomme);
        // bas-côté : herbe sèche, gravier à l'extérieur des épingles
        vec3 herbe = champ(p) * vec3(0.9, 1.0, 0.75);
        vec3 gravier = vec3(0.16, 0.14, 0.11) * (0.6 + 0.6 * mbB(p * 18.0));
        vec3 dehors = mix(herbe, gravier, grav * smoothstep(5.4, 6.0, alat) * (1.0 - smoothstep(8.5, 9.4, alat)));
        vec3 col = mix(bit, dehors, smoothstep(4.0, 4.35, alat));
        // la ligne blanche du bord
        float bord = ligne(alat - 4.0, 0.14, f);
        col = mix(col, vec3(0.55, 0.54, 0.52), bord * (1.0 - kerb));
        // les vibreurs : bandes rouges et blanches de 1 m, en relief
        float zk = step(4.0, alat) * (1.0 - step(5.25, alat));
        float bande = step(0.5, fract(u / 2.0));
        vec3 cK = mix(vec3(0.5, 0.49, 0.47), vec3(0.55, 0.025, 0.02), bande);
        float pente = smoothstep(4.0, 4.6, alat);
        cK *= 0.75 + 0.35 * pente;
        col = mix(col, cK, zk * kerb);
        // la grille de départ (cases en quinconce derrière la ligne) et la ligne à damier
        float du = u - uLigne;
        float dDep = mod(du + ${LONGUEUR.toFixed(1)} * 0.5, ${LONGUEUR.toFixed(1)}) - ${LONGUEUR.toFixed(1)} * 0.5;
        float rang = floor(-dDep / 6.0);
        float colX = mod(rang, 2.0) < 0.5 ? -1.8 : 1.8;
        float zc = fract(-dDep / 6.0) * 6.0;
        float dansG = step(0.0, -dDep) * step(-dDep, 48.0);
        float caseH = ligne(zc - 0.3, 0.12, f) * step(abs(lat - colX), 1.1);
        float caseV = ligne(abs(lat - colX) - 1.1, 0.1, f) * step(zc, 2.2) * step(0.3, zc);
        col = mix(col, vec3(0.8, 0.79, 0.76), max(caseH, caseV) * dansG * 0.85);
        float dam = step(0.0, dDep) * step(dDep, 1.2) * step(alat, 4.0);
        float cDam = mod(floor(dDep / 0.4) + floor((lat + 4.0) / 0.4), 2.0);
        col = mix(col, vec3(0.82) * cDam + vec3(0.01), dam * 0.95);
        // la lumière des projecteurs, et un reflet satiné plus fort sur la gomme
        float brille = (0.45 + 0.9 * gomme) * (1.0 - smoothstep(4.0, 4.4, alat) * (1.0 - zk * kerb));
        vec3 c = eclairer(vMonde, col, brille, rug);
        // le tunnel orange se reflète sur le bitume
        c += vec3(1.0, 0.32, 0.05) * uOrangeTunnel * (0.05 + 0.12 * gomme) * (1.0 - smoothstep(3.0, 6.0, alat));
        // le final : la piste se replie en tracé lumineux (vue du ciel), une lumière la parcourt
        if (uTrace > 0.001) {
          float axe = exp(-((lat / 2.4) * (lat / 2.4))) + 0.35 * exp(-((lat / 6.0) * (lat / 6.0)));
          float dess = smoothstep(uDessin * ${LONGUEUR.toFixed(1)} + 6.0, uDessin * ${LONGUEUR.toFixed(1)} - 30.0, mod(u - uLigne + ${LONGUEUR.toFixed(1)}, ${LONGUEUR.toFixed(1)}));
          float onde = exp(-((mod(u - uTemps * 140.0, ${LONGUEUR.toFixed(1)}) - 600.0) * (mod(u - uTemps * 140.0, ${LONGUEUR.toFixed(1)}) - 600.0)) / 2400.0);
          vec3 trace = vec3(1.0, 0.36, 0.06) * axe * (1.4 + 4.0 * onde) * mix(0.25, 1.0, dess);
          c = mix(c, c * 0.25 + trace, uTrace);
        }
        // brouillard de nuit vers l'horizon
        float bru = 1.0 - exp(-dist * 0.0026);
        c = mix(c, vec3(0.005, 0.005, 0.009) + vec3(0.016, 0.006, 0.0015) * uNuit, bru * (1.0 - uTrace * 0.85));
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  const mesh = new THREE.Mesh(g, mat);
  mesh.frustumCulled = false;
  return { mesh, mat };
}

/* ------------------------------------------------------------ le sol : les champs de la Beauce, la nuit */
export function creerSol(THREE, U) {
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...U },
    vertexShader: HP + 'varying vec3 vMonde; void main(){ vec4 m = modelMatrix * vec4(position, 1.0); vMonde = m.xyz; gl_Position = projectionMatrix * viewMatrix * m; }',
    fragmentShader: HP + GLSL_LUMIERE + `
      varying vec3 vMonde;
      void main() {
        vec2 p = vMonde.xz;
        float dist = length(vMonde - uCam);
        float s = mbF(p * 0.08), r = mbB(vec2(p.x * 0.6 + p.y * 0.2, p.y * 3.0));
        // les parcelles : des bandes de chaume dans des sens différents
        vec2 cel = floor(p / 160.0);
        float a = mbH(cel) * 3.1416;
        vec2 q = vec2(cos(a) * p.x + sin(a) * p.y, -sin(a) * p.x + cos(a) * p.y);
        float sillon = 0.5 + 0.5 * sin(q.x * 2.6);
        float teinte = mbH(cel + 3.0);
        vec3 col = mix(vec3(0.075, 0.062, 0.04), vec3(0.06, 0.055, 0.035), teinte) * (0.6 + 0.6 * s) * (0.85 + 0.3 * r);
        col *= 0.85 + 0.25 * sillon * clamp(1.0 - dist / 80.0, 0.0, 1.0);
        vec3 c = eclairer(vMonde, col, 0.05, 6.0);
        if (uTrace > 0.001) c = mix(c, c * 0.06, uTrace);
        float bru = 1.0 - exp(-dist * 0.0026);
        c = mix(c, vec3(0.005, 0.005, 0.009) + vec3(0.016, 0.006, 0.0015) * uNuit, bru);
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(3000, 3000), mat);
  m.rotation.x = -Math.PI / 2;
  m.position.y = -0.08;
  m.frustumCulled = false;
  return { mesh: m, mat };
}

/* ------------------------------------------------------------ le ciel de nuit */
export function creerCiel(THREE, U) {
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...U, uFlash: { value: 0 } },
    side: THREE.BackSide, depthWrite: false,
    vertexShader: HP + 'varying vec3 vDir; void main(){ vDir = position; vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }',
    fragmentShader: HP + GLSL_LUMIERE + `
      uniform float uFlash;
      varying vec3 vDir;
      void main() {
        vec3 d = normalize(vDir);
        float y = d.y;
        float az = atan(d.x, d.z);
        // la lueur orange : plus forte vers le nord-est (Paris), une seconde plus faible à l'opposé
        float cote = 0.55 + 0.45 * cos(az - 2.2);
        vec3 haut = vec3(0.004, 0.005, 0.012), bas = vec3(0.018, 0.014, 0.022);
        vec3 col = mix(bas, haut, smoothstep(-0.02, 0.5, y));
        float lueur = exp(-max(y, 0.0) * 9.0) * 0.55 + exp(-max(y, 0.0) * 30.0) * 0.7;
        col += vec3(0.42, 0.11, 0.02) * lueur * cote * uNuit * 0.35;
        // nuages bas accrochés par la lueur
        vec2 nq = d.xz / max(y + 0.08, 0.04);
        float nu = smoothstep(0.45, 0.85, mbF(nq * 0.9 + vec2(uTemps * 0.004, 0.0)));
        col += vec3(0.22, 0.07, 0.02) * nu * exp(-max(y, 0.0) * 5.0) * cote * 0.25 * uNuit;
        col *= 1.0 - nu * 0.25 * smoothstep(0.05, 0.4, y);
        // étoiles (scintillent à peine)
        vec2 sq = vec2(az * 140.0, y * 140.0);
        float e = step(0.9965, mbH(floor(sq))) * smoothstep(0.08, 0.35, y) * (1.0 - nu);
        float sc = 0.7 + 0.3 * sin(uTemps * 2.0 + mbH(floor(sq) + 1.0) * 30.0);
        vec2 fs = fract(sq) - 0.5;
        col += vec3(0.8, 0.85, 1.0) * e * sc * exp(-dot(fs, fs) * 18.0) * 0.9;
        // la lisière d'arbres et de hangars à l'horizon
        float lis = 0.012 + 0.012 * mbF(vec2(az * 9.0, 0.0)) + 0.006 * step(0.85, mbH(vec2(floor(az * 60.0), 2.0)));
        col = mix(col, vec3(0.006, 0.005, 0.008), smoothstep(lis + 0.002, lis - 0.002, y));
        // de petites lumières lointaines sur la lisière
        float pl = step(0.93, mbH(vec2(floor(az * 220.0), 5.0))) * exp(-(((y - lis * 0.6) * 300.0) * ((y - lis * 0.6) * 300.0)));
        col += vec3(1.0, 0.6, 0.3) * pl * 0.5 * exp(-((fract(az * 220.0) - 0.5) * (fract(az * 220.0) - 0.5)) * 40.0);
        if (y < 0.0) col = vec3(0.005, 0.005, 0.009) + vec3(0.016, 0.006, 0.0015) * uNuit;
        col += vec3(1.0, 0.85, 0.6) * uFlash * 0.4;
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  const m = new THREE.Mesh(new THREE.SphereGeometry(1200, 48, 24), mat);
  m.frustumCulled = false;
  m.renderOrder = -10;
  return { mesh: m, mat };
}
