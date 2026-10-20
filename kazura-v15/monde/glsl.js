/* Kazura v13, la Scène : morceaux de nuanceurs partagés.
   - MASQUE : la frontière entre le monde sombre et le monde clair, calculée par pixel
     (l'horizon courbe blanc qui monte, puis la marée liquide qui ramène la nuit). Chaque matière
     la lit avec gl_FragCoord : le sceau de verre s'arrête net à l'horizon, son contour fin commence
     juste dessous, comme chez ALCHE.
   - SALLE : la salle cylindrique de dalles et la typographie géante projetée dessus, en fonction
     d'un rayon (origine, direction). Le fond la peint ; le sceau de verre la réfracte (trois
     longueurs d'onde : la fausse dispersion qui met des arcs-en-ciel dans les arêtes).
   Les uniformes sont des objets partagés : une seule mise à jour par image pour tout le monde. */

/* Une texture de bruit qui se répète (128 x 128) : r et g deux fbm à quatre octaves (période de base :
   un quart de la texture), b un bruit de valeur à 16 cellules, a un bruit à 32 cellules. Lue au lieu d'être
   calculée : le nuanceur du sceau compilait en plus de 2 s sous Windows, il compile désormais vite. */
export function creerTexBruit(THREE) {
  const N = 128;
  const h = (x, y, s) => { let n = (x * 374761393 + y * 668265263 + s * 2147483647) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
  const bruit = (u, v, f, s) => {
    const x = u * f, y = v * f, i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j;
    const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    const g = (a, b) => h(((a % f) + f) % f, ((b % f) + f) % f, s);
    return (g(i, j) * (1 - sx) + g(i + 1, j) * sx) * (1 - sy) + (g(i, j + 1) * (1 - sx) + g(i + 1, j + 1) * sx) * sy;
  };
  const fbm = (u, v, s) => { let a = 0.5, t = 0, f = 4; for (let k = 0; k < 4; k++) { t += a * bruit(u, v, f, s + k); f *= 2; a *= 0.5; } return t / 0.9375; };
  const d = new Uint8Array(N * N * 4);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const u = x / N, v = y / N, o = (y * N + x) * 4;
    d[o] = fbm(u, v, 11) * 255; d[o + 1] = fbm(u, v, 57) * 255; d[o + 2] = bruit(u, v, 16, 91) * 255; d[o + 3] = bruit(u, v, 32, 133) * 255;
  }
  const t = new THREE.DataTexture(d, N, N, THREE.RGBAFormat);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true;
  t.needsUpdate = true;
  return t;
}

export function uniformesPartages(THREE) {
  return {
    kzBruitTex: { value: creerTexBruit(THREE) },
    kzProf: { value: 0 },         // le traitement « profondeur » du labo (réf. C), en courts passages
    kzRes: { value: new THREE.Vector2(1, 1) },
    kzBal: { value: 0 },          // balayage de l'horizon : 0 sombre, 1 clair
    kzLiq: { value: 0 },          // marée liquide : 0 rien, 1 la nuit a tout recouvert
    kzTps: { value: 0 },
    kzSalleC: { value: new THREE.Vector3(0, 0, 3) },
    kzSalleR: { value: 12 },
    kzMots: { value: null },
    kzMotA: { value: new THREE.Vector4(0, 4, 0, 4) },   // ligne A, largeur A (en hauteurs de lettre), ligne B, largeur B
    kzMotMix: { value: 0 },
    kzMotDecal: { value: 0 },
    kzMotForce: { value: 0.5 },
    kzLignes: { value: 8 },
    kzTeinte: { value: new THREE.Color(0x6d3fd1) },
    kzSalleForce: { value: 0 },
    kzPixAng: { value: 0.001 },   // angle d'un pixel (radians) : anticrénelage dans la salle
  };
}

export const GLSL_TEXBRUIT = /* glsl */ `
uniform sampler2D kzBruitTex;
vec4 kzTB(vec2 p) { return texture2D(kzBruitTex, p); }
`;

/* la rampe de profondeur du labo (réf. C) : 0 près (or pâle, corail), magenta, violet, 1 loin (indigo profond) */
export const GLSL_RAMPE = /* glsl */ `
uniform float kzProf;
vec3 kzRampe(float t) {
  vec3 c0 = vec3(1.00, 0.90, 0.66), c1 = vec3(1.00, 0.52, 0.34), c2 = vec3(1.00, 0.18, 0.52), c3 = vec3(0.80, 0.14, 0.95),
       c4 = vec3(0.48, 0.22, 1.00), c5 = vec3(0.20, 0.22, 0.92), c6 = vec3(0.05, 0.05, 0.30);
  float x = clamp(t, 0.0, 1.0) * 6.0;
  vec3 c = mix(c0, c1, clamp(x, 0.0, 1.0));
  c = mix(c, c2, clamp(x - 1.0, 0.0, 1.0)); c = mix(c, c3, clamp(x - 2.0, 0.0, 1.0)); c = mix(c, c4, clamp(x - 3.0, 0.0, 1.0));
  c = mix(c, c5, clamp(x - 4.0, 0.0, 1.0)); c = mix(c, c6, clamp(x - 5.0, 0.0, 1.0));
  return c;
}
`;

export const GLSL_MASQUE = /* glsl */ `
uniform vec2 kzRes; uniform float kzBal; uniform float kzLiq; uniform float kzTps;
float kzC2(float x) { return x * x; }
float kzHm(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }
float kzNm(vec2 p) { vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(kzHm(i), kzHm(i + vec2(1.0, 0.0)), f.x), mix(kzHm(i + vec2(0.0, 1.0)), kzHm(i + vec2(1.0, 1.0)), f.x), f.y); }
/* v14 : le passage au clair par TRANCHES verticales (AFTERDEPTH). L'écran est coupé en bandes
   (4 au téléphone, 7 en 16:10, 12 en ultra-large) ; chaque bande part à son tour, dans un ordre
   mêlé, et son front court verticalement (vers le haut ou vers le bas, une bande sur deux).
   Une bande passe par quatre états : la scène sombre, sa « passe de profondeur » en gris, la même
   en couleurs de profondeur (bleu, magenta, rouge), puis le monde clair.
   kzEtat renvoie l'état continu : < 0 sombre, 0 à 1,2 gris, 1,2 à 3 couleur, >= 3 clair. */
/* v15 : le passage respire, en trois temps (kzBal de 0 à 1) :
   A (0 à 0,34) : chaque bande, à son tour, bascule du sombre au gris (bref) puis au violet, front vertical
                  (vers le haut ou vers le bas, une bande sur deux) ;
   B (0,34 à 0,66) : tout l'écran est violet, la profondeur respire ;
   C (0,66 à 1) : chaque bande, à son tour, s'ouvre sur le clair, front qui descend depuis le haut.
   kzEtat : < 0 sombre, 0 à 1,2 gris, 1,2 à 3 violet (la valeur grandit tant que le violet dure), >= 3 clair.
   La même formule est reprise en JavaScript (monde.js, partClaire) pour etat().clair et clairEn(x, y). */
float kzNbBandes() { return max(4.0, floor(kzRes.x / kzRes.y * 4.5 + 0.5)); }
float kzH1(float b, float k) { return fract(sin(b * 12.9898 + k) * 43758.5453); }
float kzEtat(vec2 uv) {
  if (kzBal <= 0.0) return -1.0;
  if (kzBal >= 1.0) return 4.0;
  float N = kzNbBandes();
  float b = floor(uv.x * N);
  float yy = mod(b, 2.0) < 0.5 ? 1.0 - uv.y : uv.y;
  float e1 = kzBal * 2.5 - kzH1(b, 4.1) * 0.45 - yy * 0.3;
  float e2 = (kzBal - 0.66) / 0.34 - kzH1(b, 9.7) * 0.5 - (1.0 - uv.y) * 0.32;
  if (e2 >= 0.0) return 3.0 + e2;
  if (e1 < 0.0) return e1 * 4.0;
  return e1 < 0.1 ? e1 * 12.0 : min(2.99, 1.2 + (e1 - 0.1) * 1.2);
}
/* compatibilité : « distance » négative dans le clair */
float kzHorizon(vec2 uv) { return (3.0 - kzEtat(uv)) * 0.1; }
/* distance signée à la marée : négative là où la nuit est revenue */
float kzMaree(vec2 uv) {
  float asp = kzRes.x / kzRes.y;
  float x = uv.x * asp;
  float n = kzNm(vec2(x * 1.6 + kzTps * 0.18, kzTps * 0.1)) * 0.65 + kzNm(vec2(x * 4.0 - kzTps * 0.3, 3.0 + kzTps * 0.2)) * 0.35;
  float vague = 0.05 * sin(x * 5.0 + kzTps * 1.3) + 0.03 * sin(x * 11.0 - kzTps * 1.9);
  float front = mix(-0.3, 1.3, kzLiq);
  return (uv.y + (n - 0.5) * 0.24 + vague) - front;
}
/* 1 dans le monde clair, 0 dans le sombre */
float kzClair(vec2 fc) {
  if (kzBal <= 0.0) return 0.0;
  vec2 uv = fc / kzRes;
  float c = kzEtat(uv) >= 3.0 ? 1.0 : 0.0;
  if (kzLiq > 0.0 && kzMaree(uv) < 0.0) c = 0.0;
  return c;
}
`;

export const GLSL_IRIS = /* glsl */ `
vec3 kzIris(float x) { return max(0.5 + 0.5 * cos(6.2831853 * (x + vec3(0.0, 0.33, 0.67))), 0.0); }
/* v15 : la gamme violette du passage (0 loin : indigo profond ; 1 tout près : rose pâle) */
vec3 kzViolet(float t) {
  t = clamp(t, 0.0, 1.0);
  vec3 a = vec3(0.09, 0.03, 0.28), b = vec3(0.30, 0.08, 0.78), c = vec3(0.56, 0.14, 0.98), d = vec3(0.86, 0.2, 0.88), e = vec3(1.0, 0.5, 0.8), f = vec3(1.0, 0.86, 0.96);
  vec3 r = mix(a, b, smoothstep(0.0, 0.25, t));
  r = mix(r, c, smoothstep(0.2, 0.45, t)); r = mix(r, d, smoothstep(0.45, 0.68, t));
  r = mix(r, e, smoothstep(0.68, 0.86, t)); r = mix(r, f, smoothstep(0.86, 1.0, t));
  return r;
}
/* palette holographique : rose, cyan, vert, violet, un peu de jaune */
vec3 kzHolo(float x) {
  x = fract(x);
  vec3 a = vec3(1.0, 0.22, 0.62), b = vec3(0.12, 0.85, 1.0), c = vec3(0.3, 0.95, 0.45), d = vec3(0.52, 0.32, 1.0), e = vec3(1.0, 0.88, 0.3);
  float s = x * 5.0;
  vec3 r = mix(a, b, smoothstep(0.0, 1.0, s));
  r = mix(r, c, smoothstep(1.0, 2.0, s));
  r = mix(r, e, smoothstep(2.0, 2.6, s) * (1.0 - smoothstep(2.6, 3.0, s)));
  r = mix(r, d, smoothstep(2.6, 4.0, s));
  r = mix(r, a, smoothstep(4.0, 5.0, s));
  return r;
}
`;

export const GLSL_SALLE = /* glsl */ `
#define KZ_DALLE 1.9
#define KZ_LETTRE 2.7
#define KZ_LIGNE_Y 0.25
uniform vec3 kzSalleC; uniform float kzSalleR; uniform sampler2D kzMots; uniform vec4 kzMotA; uniform float kzMotMix;
uniform float kzMotDecal; uniform float kzMotForce; uniform float kzLignes; uniform vec3 kzTeinte; uniform float kzSalleForce;
uniform float kzPixAng;
float kzH21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
/* le rayon touche la paroi du cylindre (on est dedans) : distance */
float kzTouche(vec3 o, vec3 d) {
  vec2 oc = o.xz - kzSalleC.xz; vec2 dd = d.xz;
  float a = max(dot(dd, dd), 1e-5); float b = dot(oc, dd); float c = dot(oc, oc) - kzSalleR * kzSalleR;
  return (-b + sqrt(max(b * b - a * c, 0.0))) / a;
}
/* coordonnées sur la paroi : x = abscisse (0 derrière le sceau), y = hauteur */
vec2 kzParoi(vec3 p) { vec2 r = p.xz - kzSalleC.xz; return vec2(atan(r.x, -r.y) * kzSalleR, p.y); }
/* la typographie géante : ligne de l'atlas, largeur du mot (en hauteurs de lettre), hauteur de lettre, défilement */
float kzMot(vec2 q, float ligne, float larg, float haut, float y0, float decal, float ecart) {
  float P = larg * haut + ecart;
  float x = mod(q.x - decal + 1000.0 * P, P) - (P - larg * haut) * 0.5;
  float yy = (q.y - y0) / haut + 0.5;
  if (x < 0.0 || x > larg * haut || yy < 0.0 || yy > 1.0) return 0.0;
  /* l'atlas : chaque ligne fait 8 hauteurs de lettre de large (2048 x 256), le mot est centré */
  float u = 0.5 + (x / haut - larg * 0.5) / 8.0;
  float v = 1.0 - (ligne + 1.0 - yy) / kzLignes;
  return texture2D(kzMots, vec2(u, v)).r;
}
/* la paroi telle que la voit un reflet ou une réfraction (version légère) */
vec3 kzSalleVue(vec3 o, vec3 d) {
  float t = kzTouche(o, d);
  vec2 q = kzParoi(o + d * t);
  float col = floor(q.x / KZ_DALLE);
  float off = kzH21(vec2(col, 7.0)) * KZ_DALLE;
  vec2 f = vec2(fract(q.x / KZ_DALLE), fract((q.y + off) / KZ_DALLE));
  float hs = kzH21(vec2(col, floor((q.y + off) / KZ_DALLE)));
  vec2 e = min(f, 1.0 - f);
  float joint = smoothstep(0.0, 0.03, min(e.x, e.y));
  vec3 c = vec3(0.015) + kzTeinte * (0.03 + 0.2 * hs * hs);
  float m = kzMot(q, kzMotA.x, kzMotA.y, KZ_LETTRE, KZ_LIGNE_Y, kzMotDecal, 5.0);
  c += vec3(0.9, 0.88, 0.95) * m * kzMotForce * 1.4;
  c += vec3(0.5, 0.5, 0.55) * smoothstep(0.92, 1.0, 1.0 - f.y) * 0.25;
  return c * joint * (0.25 + 0.75 * kzSalleForce);
}
`;

/* La feuille de kudzu en deux dimensions (trois folioles), en distance signée approchée :
   p en unités de feuille, l'attache du pétiole à l'origine, la foliole terminale vers le haut.
   Négative dedans. Sert aux couches de feuilles du héros et aux premiers plans flous. */
export const GLSL_KUDZU = /* glsl */ `
float kzDemiF(float u) {
  float uu = clamp(u, 0.0, 1.0);
  return 0.42 * pow(max(sin(3.14159265 * pow(uu, 0.62)), 0.0), 0.78) * (1.0 - 0.3 * smoothstep(0.5, 1.0, uu)) * smoothstep(0.0, 0.06, uu);
}
float kzFoliole(vec2 p, float ang, float L, out float u, out float v) {
  vec2 d = vec2(cos(ang), sin(ang));
  u = dot(p, d) / L; v = dot(p, vec2(-d.y, d.x)) / L;
  float w = kzDemiF(u);
  return max(abs(v) - w, max(-u, u - 1.0)) * L;
}
/* renvoie la distance ; nerv : intensité des nervures (médiane et secondaires) */
float kzKudzu(vec2 p, out float nerv) {
  float u0, v0, u1, v1, u2, v2;
  float d0 = kzFoliole(p - vec2(0.0, 0.1), 1.5708, 1.0, u0, v0);
  float d1 = kzFoliole(p, 1.5708 + 1.2, 0.8, u1, v1);
  float d2 = kzFoliole(p, 1.5708 - 1.2, 0.8, u2, v2);
  float d = min(d0, min(d1, d2));
  float u = d0 <= min(d1, d2) ? u0 : (d1 < d2 ? u1 : u2);
  float v = d0 <= min(d1, d2) ? v0 : (d1 < d2 ? v1 : v2);
  float med = exp(-abs(v) * 160.0);
  float sec = exp(-abs(fract((u - abs(v) * 1.3) * 7.0) - 0.5) * 22.0) * smoothstep(0.02, 0.06, abs(v));
  nerv = max(med, sec * 0.55) * smoothstep(0.0, -0.02, d);
  return d;
}
`;
