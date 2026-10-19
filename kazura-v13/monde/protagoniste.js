/* Kazura v13, la Scène : le sceau protagoniste, repris du labo v12 (direction ALCHE).
   Ajouts v13 : la matière OR (le final), le masque du monde clair (la matière s'arrête net sous
   l'horizon), un ruban limité à l'anneau quand il n'y a pas de chemin de liane.
   - les MATIÈRES du sceau : verre irisé à dispersion (arcs-en-ciel), glace bleue, jade translucide,
     holographique qui coule. Chaque partie (anneau, folioles, cœur) peut avoir la sienne ; on passe
     d'une matière à l'autre par un front qui balaie l'objet (une lisière de lumière le suit).
     Le verre, la glace et le jade réfractent vraiment ce qu'il y a derrière : la scène est rendue
     une fois sans le sceau (cible « fond », à résolution réduite), le sceau la lit, décalée selon la
     réfraction, longueur d'onde par longueur d'onde (dispersion).
   - la SALLE : un mur cylindrique de dalles sombres et brillantes derrière le sceau, une typographie
     géante projetée dessus (les lettres se cassent sur les joints des dalles) ; elle se défait
     dalle par dalle quand on quitte l'ouverture.
   - le RUBAN holographique : la liane devenue ruban irisé, qui s'enroule autour de l'anneau puis
     s'en va en spirale le long du chemin de la liane. */
import { RAYON_ANNEAU, ANGLE_SORTIE, RAYON_SCEAU, reperes } from './liane.js';
import { GLSL_MASQUE, GLSL_RAMPE } from './glsl.js';

/* ---------------------------------------------------------------- le sceau épais (copie des formes de sceau.js)
   Même dessin exact que sceau-jade.svg, mais extrudé plus profond : un vrai objet 3D, qui montre ses
   flancs quand il tourne et qui a l'épaisseur pour réfracter. */
const K = RAYON_SCEAU / 48;
const X = (x) => (x - 50) * K;
const Y = (y) => (50 - y) * K;

function formeFoliole(THREE) {
  const s = new THREE.Shape();
  s.moveTo(X(50), Y(46));
  s.bezierCurveTo(X(39.5), Y(37), X(34.5), Y(23.5), X(50), Y(7));
  s.bezierCurveTo(X(65.5), Y(23.5), X(60.5), Y(37), X(50), Y(46));
  const h = new THREE.Path();
  h.moveTo(X(50), Y(38.6));
  h.bezierCurveTo(X(56.2), Y(32.6), X(58.6), Y(24.2), X(50), Y(15));
  h.bezierCurveTo(X(41.4), Y(24.2), X(43.8), Y(32.6), X(50), Y(38.6));
  s.holes.push(h);
  return s;
}
function formeAnneau(THREE) {
  const s = new THREE.Shape();
  s.absarc(0, 0, 48 * K, 0, Math.PI * 2, false);
  const h = new THREE.Path();
  h.absarc(0, 0, 42 * K, 0, Math.PI * 2, true);
  s.holes.push(h);
  return s;
}
function formeCoeur(THREE) {
  const s = new THREE.Shape();
  s.absarc(0, 0, 4.6 * K, 0, Math.PI * 2, false);
  return s;
}

function normalesAdoucies(THREE, g, angle) {
  const pos = g.attributes.position, n = pos.count, seuil = Math.cos(angle);
  const fn = new Float32Array(n * 3);
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), ab = new THREE.Vector3(), cb = new THREE.Vector3();
  for (let i = 0; i + 2 < n; i += 3) {
    a.fromBufferAttribute(pos, i); b.fromBufferAttribute(pos, i + 1); c.fromBufferAttribute(pos, i + 2);
    cb.subVectors(c, b); ab.subVectors(a, b); cb.cross(ab);
    for (let k = 0; k < 3; k++) fn.set([cb.x, cb.y, cb.z], (i + k) * 3);
  }
  const cle = (i) => Math.round(pos.getX(i) * 2e4) + ',' + Math.round(pos.getY(i) * 2e4) + ',' + Math.round(pos.getZ(i) * 2e4);
  const groupes = new Map();
  for (let i = 0; i < n; i++) { const k = cle(i); if (!groupes.has(k)) groupes.set(k, []); groupes.get(k).push(i); }
  const out = new Float32Array(n * 3), u = new THREE.Vector3(), v = new THREE.Vector3(), s = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    u.fromArray(fn, i * 3).normalize(); s.set(0, 0, 0);
    for (const j of groupes.get(cle(i))) { v.fromArray(fn, j * 3); const l = v.length(); if (l > 0 && v.dot(u) / l > seuil) s.add(v); }
    if (s.lengthSq() === 0) s.copy(u);
    s.normalize(); out[i * 3] = s.x; out[i * 3 + 1] = s.y; out[i * 3 + 2] = s.z;
  }
  g.setAttribute('normal', new THREE.BufferAttribute(out, 3));
}


export function geometriesEpaisses(THREE, { mobile }) {
  const ex = (forme) => {
    const g = new THREE.ExtrudeGeometry(forme, {
      depth: 0.13, curveSegments: mobile ? 40 : 72,
      bevelEnabled: true, bevelThickness: 0.045, bevelSize: 0.032, bevelOffset: -0.032, bevelSegments: mobile ? 4 : 7,
    });
    g.translate(0, 0, -0.065);
    normalesAdoucies(THREE, g, Math.PI / 2.4);
    return g;
  };
  return { anneau: ex(formeAnneau(THREE)), foliole: ex(formeFoliole(THREE)), coeur: ex(formeCoeur(THREE)) };
}


export const MATIERES = ['verre', 'glace', 'jade', 'holo', 'or'];

const SOMMET_MATIERE = /* glsl */ `
attribute float aS;
varying vec3 vN; varying vec3 vV; varying vec3 vLoc; varying vec3 vMonde; varying float vS;
void main() {
  vLoc = position; vS = aS;
  vec4 mw = modelMatrix * vec4(position, 1.0);
  vMonde = mw.xyz;
  vec4 mv = viewMatrix * mw;
  vV = -mv.xyz;
  vN = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * mv;
}`;

const FRAGMENT_MATIERE = /* glsl */ `
precision highp float;
${GLSL_MASQUE}
${GLSL_RAMPE}
uniform sampler2D tFond; uniform vec2 uRes; uniform float uTemps; uniform mat4 uVueInv;
uniform int uA; uniform int uB; uniform int uNb; uniform float uFront; uniform float uApp;
uniform vec3 uSeve; uniform float uLisere; uniform float uRefr; uniform float uRuban; uniform float uLong; uniform float uEclat;
varying vec3 vN; varying vec3 vV; varying vec3 vLoc; varying vec3 vMonde; varying float vS;
#define PI 3.14159265
/* le bruit vient d'une petite texture précalculée (r : bruit de valeur, g : fbm, b : bords de Voronoï) :
   le nuanceur reste court, il se compile vite partout (y compris sous Windows, où D3D déroule tout) */
uniform sampler2D tBruit;
vec4 bt(vec2 p) { return textureLod(tBruit, p, 0.0); }
float b3(vec3 p) { return bt(p.xy * 0.125 + p.z * 0.37).r; }
float fbm3(vec3 p) { return bt(p.xy * 0.0625 + p.z * 0.29).g; }
vec3 spectre(float x) { return clamp(vec3(abs(x * 6.0 - 3.0) - 1.0, 2.0 - abs(x * 6.0 - 2.0), 2.0 - abs(x * 6.0 - 4.0)), 0.0, 1.0); }
/* interférences d'un film mince (bulle de savon) : épaisseur d en nm */
vec3 filmMince(float cosT, float d) { vec3 ph = 2.0 * 1.38 * d * cosT / vec3(650.0, 532.0, 450.0); return 0.5 + 0.5 * cos(6.2831853 * ph); }
/* le studio : ce que reflète l'objet (bandes lumineuses franches, comme les boîtes à lumière d'un plateau) */
vec3 studio(vec3 R) {
  vec3 c = mix(vec3(0.015, 0.014, 0.022), vec3(0.08, 0.08, 0.10), smoothstep(-0.3, 0.8, R.y));
  float a = atan(R.x, -R.z);
  c += vec3(1.0) * 2.4 * smoothstep(0.82, 0.93, R.y);
  c += vec3(1.0, 0.97, 0.92) * 3.2 * smoothstep(0.09, 0.0, abs(a - 1.15)) * smoothstep(-0.45, 0.0, R.y) * smoothstep(0.75, 0.35, R.y);
  c += vec3(0.85, 0.9, 1.0) * 2.0 * smoothstep(0.07, 0.0, abs(a + 1.45)) * smoothstep(-0.5, 0.2, R.y);
  c += vec3(1.0) * 1.3 * smoothstep(0.05, 0.0, abs(R.y + 0.12)) * smoothstep(0.4, 0.9, -R.z);
  c += vec3(0.9, 0.85, 1.0) * 1.6 * smoothstep(0.06, 0.0, abs(a - 2.6)) * smoothstep(0.1, 0.5, R.y);
  return c * 0.55;
}
/* la palette holographique d'ALCHE : rose, lavande, cyan, vert, jaune, retour au rose */
vec3 holo(float h) {
  vec3 c0 = vec3(1.0, 0.36, 0.72), c1 = vec3(0.78, 0.66, 1.0), c2 = vec3(0.28, 0.95, 0.97), c3 = vec3(0.40, 0.95, 0.52), c4 = vec3(0.96, 0.95, 0.45);
  float x = fract(h) * 5.0;
  vec3 c = mix(c0, c1, clamp(x, 0.0, 1.0));
  c = mix(c, c2, clamp(x - 1.0, 0.0, 1.0)); c = mix(c, c3, clamp(x - 2.0, 0.0, 1.0)); c = mix(c, c4, clamp(x - 3.0, 0.0, 1.0)); c = mix(c, c0, clamp(x - 4.0, 0.0, 1.0));
  return c;
}
vec3 fond(vec2 uv) { return textureLod(tFond, clamp(uv, 0.002, 0.998), 0.0).rgb; }

vec3 matiere(int k, vec3 N, vec3 V, float nv, vec3 R, vec2 uvS) {
  vec3 res = vec3(0.0);
  float F = 0.05 + 0.95 * pow(1.0 - nv, 4.0);
  float ep = 0.55 + 1.6 * (1.0 - nv);                       // épaisseur traversée : plus grande sur les biseaux
  if (k == 0) {                                             // VERRE irisé à dispersion
    vec3 refr = vec3(0.0), ws = vec3(0.0);
    for (int i = 0; i < 6; i++) {
      float x = (float(i) + 0.5) / 6.0;
      float ior = 1.47 + 0.42 * (x - 0.5);
      vec3 T = refract(-V, N, 1.0 / ior);
      vec3 w = spectre(x);
      refr += fond(uvS + T.xy * ep * 0.11 * uRefr) * w; ws += w;
    }
    refr /= ws;
    vec3 irid = filmMince(nv, 280.0 + 360.0 * b3(vLoc * 3.0 + vec3(0.0, uTemps * 0.08, 0.0)));
    vec3 arc = spectre(fract(nv * 1.6 + vLoc.x * 0.35 + vLoc.y * 0.2 - uTemps * 0.04)) * pow(1.0 - nv, 2.5);
    res = refr * vec3(0.97, 0.99, 1.02) * (1.0 - F * 0.5) * 1.08 + studio(R) * F * (0.7 + 1.0 * irid) + arc * 0.5 + vec3(0.01, 0.012, 0.016);
  }
  else if (k == 1) {                                             // GLACE bleue, givrée, fêlée
    vec3 Nf = normalize(N + (bt(vLoc.xy * 2.7).rgr - 0.5) * vec3(0.35, 0.35, 0.2));
    vec3 T = refract(-V, Nf, 1.0 / 1.31);
    vec2 o = T.xy * ep * 0.05 * uRefr;
    vec3 refr = (fond(uvS + o) * 2.0 + fond(uvS + o + vec2(0.006, 0.004)) + fond(uvS + o - vec2(0.005, 0.006)) + fond(uvS + o + vec2(-0.004, 0.007))) / 5.0;
    float fele = 1.0 - smoothstep(0.0, 0.08, bt(vLoc.xy * 0.55 + 0.3).b);              // fêlures : bords de Voronoï
    vec3 c = refr * vec3(0.55, 0.78, 1.05) + vec3(0.10, 0.22, 0.42) * (0.3 + 0.7 * (1.0 - nv)) * 0.6;
    c += vec3(0.75, 0.9, 1.0) * fele * 0.55 * (0.4 + 0.6 * nv);
    res = c + studio(R) * F * vec3(0.85, 0.93, 1.0) * 1.1;
  }
  else if (k == 2) {                                             // JADE translucide, nuageux, poli
    vec3 T = refract(-V, N, 1.0 / 1.62);
    vec2 o = T.xy * ep * 0.04 * uRefr;
    vec3 refr = (fond(uvS + o) + fond(uvS + o + vec2(0.008, 0.0)) + fond(uvS + o - vec2(0.0, 0.008)) + fond(uvS + o + vec2(-0.006, 0.006))) * 0.25;
    float nuage = fbm3(vLoc * vec3(4.5, 4.5, 3.0) + 2.0);
    float veine = 1.0 - smoothstep(0.0, 0.035, abs(fbm3(vLoc * 7.0 + 11.0) - 0.5));
    vec3 absorbe = exp(-ep * vec3(3.2, 0.55, 1.5));
    vec3 diffuse = mix(vec3(0.015, 0.16, 0.10), vec3(0.09, 0.55, 0.36), smoothstep(0.25, 0.85, nuage));
    vec3 c = refr * absorbe * 1.4 + diffuse * (0.35 + 0.65 * pow(nv, 0.7)) * 0.55 + vec3(0.5, 0.9, 0.7) * veine * 0.05;
    c += studio(R) * F * 1.25;
    c += uSeve * pow(1.0 - nv, 3.0) * uLisere;                // le liseré violet de Kazura
    res = c;
  }
  else if (k == 4) {                                        // OR poli (le final de Kazura)
    float br = bt(vLoc.xy * 1.1 + vec2(vLoc.z)).g;
    vec3 or = mix(vec3(1.0, 0.66, 0.26), vec3(1.0, 0.84, 0.5), br);
    vec3 env = studio(R) * 1.9 + vec3(0.06, 0.04, 0.02);
    res = or * env * (0.55 + 0.45 * F + 0.4 * pow(1.0 - nv, 2.0)) + or * 0.05 * nv + uSeve * pow(1.0 - nv, 4.0) * 0.12;
  }
  else {                                                    // HOLOGRAPHIQUE qui coule
  float flot = fbm3(vLoc * 1.7 + vec3(0.0, -uTemps * 0.22, uTemps * 0.05));
  float h = vLoc.y * 0.55 + vLoc.x * 0.25 + vS * 0.18 + flot * 1.7 + nv * 0.6 - uTemps * 0.1;
  vec3 c = holo(h);
  float strie = smoothstep(0.42, 0.5, fract(h * 2.0 + flot)) * smoothstep(0.58, 0.5, fract(h * 2.0 + flot));
  c *= 0.62 + 0.38 * nv;
  c = mix(c, c * 0.35, strie * 0.6);                         // les filets sombres qui coulent dans l'irisation
  c *= filmMince(nv, 420.0 + 220.0 * flot) * 0.5 + 0.75;
  res = c * 0.42 + studio(R) * F * 0.7;
  }
  return res;
}

void main() {
  if (kzClair(gl_FragCoord.xy) > 0.5) discard;
  if (uRuban > 0.5 && vS > uLong) discard;
  vec3 N = normalize(vN); vec3 V = normalize(vV);
  if (!gl_FrontFacing) N = -N;
  float nv = clamp(dot(N, V), 0.0, 1.0);
  vec3 R = normalize(mat3(uVueInv) * reflect(-V, N));
  vec2 uvS = gl_FragCoord.xy / uRes;
  // le front qui change la matière : il balaie l'objet en diagonale, avec une lisière lumineuse
  float s = dot(vMonde.xy, normalize(vec2(0.62, -0.78))) / 2.6 + 0.5 + (b3(vLoc * 5.0) - 0.5) * 0.06;
  if (uRuban > 0.5) s = fract(vS * 0.05);
  float m = uA == uB ? 0.0 : smoothstep(uFront - 0.025, uFront + 0.025, 1.0 - s);
  // une seule copie de matiere() (compilation rapide) : de part et d'autre du front, la lisière cache la couture
  vec3 c = matiere(m > 0.5 ? uB : uA, N, V, nv, R, uvS);
  float lis = uA == uB ? 0.0 : exp(-pow((1.0 - s - uFront) / 0.02, 2.0)) * step(0.001, uFront) * step(uFront, 0.999);
  c += mix(uSeve, vec3(1.0), 0.5) * lis * 3.0;
  c *= 1.0 + uEclat * 1.5;
  if (uRuban > 0.5) c += holo(vS * 0.3 - uTemps * 0.3) * exp(-(uLong - vS) * 6.0) * 2.5;   // la tête du ruban brille
  if (kzProf > 0.001) { float Lc = dot(c, vec3(0.2126, 0.7152, 0.0722)); c = mix(c, kzRampe(0.06 + 0.22 * (1.0 - nv) + 0.08 * (1.0 - s)) * (0.12 + 1.5 * Lc + 0.5 * pow(1.0 - nv, 2.0)), kzProf); }
  if (any(isnan(c))) c = vec3(0.0);
  gl_FragColor = vec4(min(c, vec3(30.0)), 1.0);
}`;

/* La texture de bruit (256 x 256, périodique) : r bruit de valeur (8 cellules), g fbm (4 octaves), b bords de Voronoï (16 cellules). */
let texBruit = null;
export function textureBruit(THREE) {
  if (texBruit) return texBruit;
  const N = 256, d = new Uint8Array(N * N * 4);
  const h = (x, y, s) => { let n = (x * 374761393 + y * 668265263 + s * 2246822519) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
  const valeur = (x, y, f, s) => {
    const X = x * f / N, Y = y * f / N, i = Math.floor(X), j = Math.floor(Y);
    let fx = X - i, fy = Y - j; fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
    const g = (a, b) => h(((a % f) + f) % f, ((b % f) + f) % f, s);
    return (g(i, j) * (1 - fx) + g(i + 1, j) * fx) * (1 - fy) + (g(i, j + 1) * (1 - fx) + g(i + 1, j + 1) * fx) * fy;
  };
  const C = 16, pts = [];
  for (let j = 0; j < C; j++) for (let i = 0; i < C; i++) pts.push([(i + h(i, j, 9)) * N / C, (j + h(i, j, 10)) * N / C]);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const r = valeur(x, y, 8, 1);
    let g = 0, a = 0.5, f = 4;
    for (let o = 0; o < 4; o++) { g += a * valeur(x, y, f, 2 + o); a *= 0.5; f *= 2; }
    const ci = Math.floor(x / (N / C)), cj = Math.floor(y / (N / C));
    let d1 = 1e9, d2 = 1e9;
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      const ii = (ci + di + C) % C, jj = (cj + dj + C) % C;
      let [px, py] = pts[jj * C + ii];
      px += (ci + di - ii) * (N / C) * (ii !== ci + di ? 1 : 0); py += (cj + dj - jj) * (N / C) * (jj !== cj + dj ? 1 : 0);
      const dd = Math.hypot(px - x, py - y);
      if (dd < d1) { d2 = d1; d1 = dd; } else if (dd < d2) d2 = dd;
    }
    const k = (y * N + x) * 4;
    d[k] = r * 255; d[k + 1] = Math.min(1, g / 0.94) * 255; d[k + 2] = Math.min(1, (d2 - d1) / (N / C) * 2) * 255; d[k + 3] = 255;
  }
  texBruit = new THREE.DataTexture(d, N, N, THREE.RGBAFormat);
  texBruit.wrapS = texBruit.wrapT = THREE.RepeatWrapping;
  texBruit.magFilter = THREE.LinearFilter; texBruit.minFilter = THREE.LinearFilter;
  texBruit.needsUpdate = true;
  return texBruit;
}

/** Une matière (une instance par partie : chacune a son propre front). */
export function materiauMatiere(THREE, partages, { ruban = false } = {}) {
  const u = {
    tFond: partages.tFond, uRes: partages.uRes, uTemps: partages.uTemps, uVueInv: partages.uVueInv, uSeve: partages.uSeve, uRefr: partages.uRefr,
    kzRes: partages.kzRes, kzBal: partages.kzBal, kzLiq: partages.kzLiq, kzTps: partages.kzTps, kzProf: partages.kzProf,
    uA: { value: 2 }, uB: { value: 2 }, uNb: { value: 1 }, uFront: { value: 0 }, uApp: { value: 1 }, uLisere: { value: 0.35 },
    uRuban: { value: ruban ? 1 : 0 }, uLong: { value: 0 }, uEclat: { value: 0 }, tBruit: { value: textureBruit(THREE) },
  };
  return new THREE.ShaderMaterial({ uniforms: u, vertexShader: SOMMET_MATIERE, fragmentShader: FRAGMENT_MATIERE, side: ruban ? THREE.DoubleSide : THREE.FrontSide, fog: false });
}

/* ---------------------------------------------------------------- la salle de dalles */
export function creerSalle(THREE, { mobile, texte = 'KAZURA' }) {
  const R = 10.5, H = 34, cz = -1.6;
  // un arc de 225 degrés derrière le sceau (three : theta = 0 vers +z, donc pi = derrière)
  const geo = new THREE.CylinderGeometry(R, R, H, mobile ? 64 : 128, 1, true, Math.PI * 0.375, Math.PI * 1.25);
  const toile = document.createElement('canvas');
  toile.width = 2048; toile.height = 640;
  const tex = new THREE.CanvasTexture(toile);
  tex.colorSpace = THREE.NoColorSpace;
  const dessiner = (mot) => {
    const g = toile.getContext('2d');
    g.clearRect(0, 0, toile.width, toile.height);
    g.fillStyle = '#fff';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    let taille = 560;
    g.font = `900 ${taille}px "Inter", "Arial Black", "Helvetica Neue", Arial, sans-serif`;
    while (g.measureText(mot).width > toile.width * 0.96 && taille > 120) { taille -= 20; g.font = `900 ${taille}px "Inter", "Arial Black", Arial, sans-serif`; }
    g.fillText(mot, toile.width / 2, toile.height / 2 + taille * 0.04);
    tex.needsUpdate = true;
  };
  dessiner(texte);
  const u = {
    tTexte: { value: tex }, uTemps: { value: 0 }, uPresence: { value: 1 }, uTeinte: { value: new THREE.Color(0x6d3fd1) },
    uTexteForce: { value: 1 }, uR: { value: R }, uCz: { value: cz }, uLumiere: { value: 1 },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms: u, side: THREE.BackSide, fog: false,
    vertexShader: /* glsl */ `
      varying vec3 vP; varying vec3 vN; varying vec3 vV;
      void main() { vP = position; vec4 mw = modelMatrix * vec4(position, 1.0); vN = normalize(-(mat3(modelMatrix) * vec3(position.x, 0.0, position.z)));
        vV = cameraPosition - mw.xyz; gl_Position = projectionMatrix * viewMatrix * mw; }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D tTexte; uniform float uTemps; uniform float uPresence; uniform vec3 uTeinte; uniform float uTexteForce; uniform float uR; uniform float uLumiere;
      varying vec3 vP; varying vec3 vN; varying vec3 vV;
      float h12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
      void main() {
        float ang = atan(vP.x, -vP.z);                 // 0 : face à la caméra de l'ouverture
        vec2 q = vec2(ang * uR, vP.y);
        float taille = 0.95;
        vec2 id = floor(q / taille); vec2 f = fract(q / taille);
        float hs = h12(id);
        // la salle se défait dalle par dalle (chaque dalle a son seuil)
        if (hs * 0.85 + 0.15 * h12(id + 3.0) > uPresence * 1.02) discard;
        vec2 b = min(f, 1.0 - f);
        float joint = smoothstep(0.035, 0.06, min(b.x, b.y));
        float bombe = smoothstep(0.0, 0.25, min(b.x, b.y));
        vec3 N = normalize(vN + vec3((f.x - 0.5) * 0.25 * (1.0 - bombe), (f.y - 0.5) * 0.25 * (1.0 - bombe), 0.0) + (vec3(h12(id + 1.0), h12(id + 2.0), 0.0) - 0.5) * 0.08);
        vec3 V = normalize(vV);
        vec3 Rf = reflect(-V, N);
        float spec = pow(max(Rf.y, 0.0), 6.0) * 0.6 + pow(max(dot(Rf, normalize(vec3(0.5, 0.6, 0.4))), 0.0), 40.0) * 1.5;
        vec3 c = vec3(0.010, 0.0105, 0.014) * (0.7 + 0.6 * hs) + uTeinte * 0.006;
        c += vec3(0.55, 0.57, 0.62) * spec * 0.07 * joint;
        c *= joint * 0.85 + 0.15;
        // la typographie géante, projetée : elle se casse sur les joints
        vec2 tuv = vec2(0.5 + ang / 1.3, 0.5 + vP.y / 8.4);
        float lettre = (tuv.x > 0.0 && tuv.x < 1.0 && tuv.y > 0.0 && tuv.y < 1.0) ? texture2D(tTexte, tuv).a : 0.0;
        c += vec3(0.62, 0.62, 0.66) * lettre * joint * uTexteForce * (0.85 + 0.15 * hs) * 0.42;
        // la lumière d'en haut, une lueur au sol
        c *= (0.6 + 0.6 * smoothstep(-6.0, 4.0, vP.y)) * smoothstep(15.0, 8.0, abs(vP.y));
        float bordP = smoothstep(uPresence * 1.02 - 0.06, uPresence * 1.02, hs * 0.85 + 0.15 * h12(id + 3.0));
        c += uTeinte * bordP * 0.6;
        gl_FragColor = vec4(c * uLumiere, 1.0);
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(0, 0, cz);
  mesh.frustumCulled = false;
  mesh.renderOrder = -5;
  return { mesh, u, texte: dessiner };
}

/* ---------------------------------------------------------------- le ruban holographique */
export function creerRuban(THREE, traces, partages, { mobile }) {
  const V3 = THREE.Vector3;
  const pts = [];
  // 1. il s'enroule autour de l'anneau (un tour, six spires), en partant d'en haut
  const nA = mobile ? 420 : 700;
  const a0 = ANGLE_SORTIE + Math.PI * 2;
  for (let i = 0; i <= nA; i++) {
    const t = i / nA;
    const a = a0 - (1 - t) * Math.PI * 2;                 // finit à la sortie de la liane
    const rad = new V3(Math.cos(a), Math.sin(a), 0);
    const ph = t * Math.PI * 2 * 6;
    const r = 0.14 * (0.4 + 0.6 * Math.min(1, t * 6));
    pts.push(rad.clone().multiplyScalar(RAYON_ANNEAU).addScaledVector(rad, Math.cos(ph) * r).add(new V3(0, 0, Math.sin(ph) * r)));
  }
  // 2. puis il part le long du chemin de la liane, en spirale large autour d'elle
  const L = traces ? Math.min(traces.L - 2, 80) : 0, pas = mobile ? 0.09 : 0.06;
  const dep = pts[pts.length - 1].clone();
  for (let u = pas; u < L; u += pas) {
    const c = traces.cadre(u);
    const ph = u * 0.9 + Math.PI * 0.5;
    const r = 0.5 * Math.min(1, u / 3);
    const p = c.p.clone().addScaledVector(c.cote, Math.cos(ph) * r).addScaledVector(c.haut, Math.sin(ph) * r);
    if (u < 2) p.lerp(dep.clone().addScaledVector(c.tg, u), 1 - u / 2);
    pts.push(p);
  }
  const { T, N, B } = reperes(THREE, pts);
  const n = pts.length;
  const pos = new Float32Array(n * 2 * 3), nor = new Float32Array(n * 2 * 3), aS = new Float32Array(n * 2);
  const idx = [];
  let s = 0;
  const w = new V3(), nn = new V3();
  for (let i = 0; i < n; i++) {
    if (i) s += pts[i].distanceTo(pts[i - 1]);
    const tor = s * 1.1;                                      // le ruban se tord lentement
    w.copy(N[i]).multiplyScalar(Math.cos(tor)).addScaledVector(B[i], Math.sin(tor));
    nn.crossVectors(T[i], w).normalize();
    const larg = (i < nA ? 0.045 : 0.075) * Math.min(1, s / 0.4);
    for (let k = 0; k < 2; k++) {
      const p = pts[i].clone().addScaledVector(w, (k ? 1 : -1) * larg);
      pos.set([p.x, p.y, p.z], (i * 2 + k) * 3);
      nor.set([nn.x, nn.y, nn.z], (i * 2 + k) * 3);
      aS[i * 2 + k] = s;
    }
    if (i < n - 1) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setAttribute('aS', new THREE.BufferAttribute(aS, 1));
  g.setIndex(n * 2 > 65535 ? new THREE.Uint32BufferAttribute(idx, 1) : new THREE.Uint16BufferAttribute(idx, 1));
  g.computeBoundingSphere();
  const mat = materiauMatiere(THREE, partages, { ruban: true });
  mat.uniforms.uA.value = 3; mat.uniforms.uB.value = 3;
  const mesh = new THREE.Mesh(g, mat);
  mesh.frustumCulled = false;
  return { mesh, mat, longueur: s, longAnneau: (() => { let x = 0; for (let i = 1; i <= nA; i++) x += pts[i].distanceTo(pts[i - 1]); return x; })() };
}

/* ---------------------------------------------------------------- l'ensemble */
export const INDICE = { verre: 0, glace: 1, jade: 2, holo: 3, or: 4 };

/**
 * opts.matiere : 'origine' | 'verre' | 'glace' | 'jade' | 'holo' | 'mixte' | 'cycle'
 *   ('mixte' : anneau de verre irisé, folioles holographiques, cœur de jade ; 'cycle' : la matière
 *   change toute seule toutes les 7 s, partie par partie)
 */
export function creerProtagoniste(THREE, { renderer, scene, camera, sceau, traces, mobile, reduit, partagesMonde, matiere = 'origine', salle = false, ruban = false }) {
  const echFond = mobile ? 0.5 : 0.6;
  const cibleFond = new THREE.WebGLRenderTarget(2, 2, { type: THREE.HalfFloatType });
  const partages = {
    tFond: { value: cibleFond.texture }, uRes: { value: new THREE.Vector2(1, 1) }, uTemps: partagesMonde.uTemps,
    uVueInv: { value: new THREE.Matrix4() }, uSeve: partagesMonde.uSeve, uRefr: { value: 1 },
  };
  const parties = { anneau: [sceau.anneau], folioles: sceau.folioles, coeur: [sceau.coeur] };
  const origines = new Map();
  const mats = new Map();
  const geoOrig = new Map();
  for (const p of sceau.parties) { origines.set(p, p.mesh.material); geoOrig.set(p, p.mesh.geometry); mats.set(p, materiauMatiere(THREE, partages)); }
  const epaisses = geometriesEpaisses(THREE, { mobile });
  const geoEpaisse = (p) => (p === sceau.anneau ? epaisses.anneau : p === sceau.coeur ? epaisses.coeur : epaisses.foliole);
  const partieDe = (p) => (p === sceau.anneau ? 'anneau' : p === sceau.coeur ? 'coeur' : 'folioles');

  const objSalle = salle ? creerSalle(THREE, { mobile }) : null;
  if (objSalle) scene.add(objSalle.mesh);
  const objRuban = ruban ? creerRuban(THREE, traces, partages, { mobile }) : null;
  if (objRuban) scene.add(objRuban.mesh);

  // état des matières par partie : de, vers, front (0..1), début, durée
  const etat = { actif: matiere !== 'origine', cible: null, parties: {} };
  for (const k of Object.keys(parties)) etat.parties[k] = { de: 'jade', vers: 'jade', t0: -1, duree: 2.2 };
  const plan = (nom) => {
    if (nom === 'mixte') return { anneau: 'verre', folioles: 'holo', coeur: 'jade' };
    if (typeof nom === 'object' && nom) return nom;
    return { anneau: nom, folioles: nom, coeur: nom };
  };
  let temps = 0, cycle = matiere === 'cycle', iCycle = 0, prochainCycle = 0;
  const CYCLE = [{ anneau: 'verre', folioles: 'verre', coeur: 'verre' }, { anneau: 'verre', folioles: 'holo', coeur: 'jade' }, { anneau: 'glace', folioles: 'glace', coeur: 'glace' }, { anneau: 'holo', folioles: 'holo', coeur: 'holo' }, { anneau: 'jade', folioles: 'jade', coeur: 'jade' }];
  function changer(nom, duree = 2.2) {
    if (nom === 'origine') { etat.actif = false; return; }
    etat.actif = true;
    const p = plan(nom);
    let i = 0;
    for (const [k, v] of Object.entries(p)) {
      if (!INDICE.hasOwnProperty(v)) continue;
      const e = etat.parties[k];
      const actuel = e.vers;
      if (actuel === v) continue;
      e.de = actuel; e.vers = v; e.t0 = temps + i * 0.35; e.duree = duree * (reduit ? 1.5 : 1);
      i++;
    }
  }
  let premier = true;

  /* compile la matière d'avance, en parallèle, pour qu'elle n'arrête pas la page au moment du relais */
  const precompiler = async () => {
    const sc = new THREE.Scene();
    const mm = new THREE.Mesh(epaisses.anneau, mats.get(sceau.anneau)); mm.frustumCulled = false; sc.add(mm);
    const t0 = performance.now();
    try { await renderer.compileAsync(sc, camera); } catch {}
    (window.__kzCompil ||= {}).matiere = Math.round(performance.now() - t0);
  };

  return {
    salle: objSalle, ruban: objRuban, partages, precompiler,
    changer, MATIERES,
    dimensionner(l, h, dpr) {
      cibleFond.setSize(Math.max(2, Math.round(l * dpr * echFond)), Math.max(2, Math.round(h * dpr * echFond)));
      partages.uRes.value.set(Math.round(l * dpr), Math.round(h * dpr));
    },
    /* ctx : { dt, tO (ouverture), p, A, sceauVisible, ruban: longueur visible souhaitée } */
    maj({ dt, tO, p, A, approche }) {
      temps += dt;
      partages.uVueInv.value.copy(camera.matrixWorld);
      // la matière prend le relais de l'origine à la fin de l'ouverture, par un front de jade
      const apres = tO > 2.9;
      if (etat.actif && apres && premier) { premier = false; changer(cycle ? CYCLE[0] : matiere, 2.6); prochainCycle = temps + 7; }
      if (cycle && !premier && temps > prochainCycle) { iCycle = (iCycle + 1) % CYCLE.length; changer(CYCLE[iCycle], 2.4); prochainCycle = temps + 7; }
      for (const pa of sceau.parties) {
        const m = mats.get(pa);
        const utiliser = etat.actif && apres;
        pa.mesh.material = utiliser ? m : origines.get(pa);
        pa.mesh.geometry = utiliser ? geoEpaisse(pa) : geoOrig.get(pa);
        if (!utiliser) continue;
        const e = etat.parties[partieDe(pa)];
        const k = e.t0 < 0 ? 1 : Math.min(1, Math.max(0, (temps - e.t0) / e.duree));
        const ke = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        m.uniforms.uA.value = INDICE[e.de]; m.uniforms.uB.value = INDICE[e.vers];
        m.uniforms.uFront.value = k >= 1 ? 1 : ke;
        if (k >= 1) { m.uniforms.uA.value = INDICE[e.vers]; }
        m.uniforms.uNb.value = m.uniforms.uA.value === m.uniforms.uB.value ? 1 : 2;
        m.uniforms.uLisere.value = 0.45 * (1 - 0.6 * (approche || 0));
      }
      if (objSalle) {
        objSalle.u.uTemps.value = temps;
        objSalle.u.uTeinte.value.copy(A.halo);
        const pres = (1 - Math.min(1, Math.max(0, (p - 0.004) / 0.05))) * Math.min(1, Math.max(0, (tO - 1.2) / 1.6));
        objSalle.u.uPresence.value = pres;
        objSalle.mesh.visible = pres > 0.001;
      }
      if (objRuban) {
        const m = objRuban.mat.uniforms;
        const vitesse = reduit ? 2.2 : 3.4;
        if (tO > 2.6) m.uLong.value = Math.min(objRuban.longueur, m.uLong.value + dt * vitesse * (m.uLong.value < objRuban.longAnneau ? 0.8 : 2.2));
        objRuban.mesh.visible = m.uLong.value > 0.01;
      }
    },
    /* rendu du fond (la scène sans le sceau) : à appeler juste avant le rendu principal */
    avantRendu(sceauVisible) {
      if (!etat.actif || !sceauVisible) return;
      const vis = sceau.groupe.visible, rv = objRuban ? objRuban.mesh.visible : false;
      sceau.groupe.visible = false;
      if (objRuban) objRuban.mesh.visible = false;
      renderer.setRenderTarget(cibleFond);
      renderer.render(scene, camera);
      sceau.groupe.visible = vis;
      if (objRuban) objRuban.mesh.visible = rv;
    },
    detruire() {
      cibleFond.dispose();
      for (const m of mats.values()) m.dispose();
      if (objSalle) { objSalle.mesh.geometry.dispose(); objSalle.mesh.material.dispose(); objSalle.u.tTexte.value.dispose(); }
      if (objRuban) { objRuban.mesh.geometry.dispose(); objRuban.mat.dispose(); }
    },
  };
}
