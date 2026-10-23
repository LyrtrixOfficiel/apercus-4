/* Kazura v12, le Monde : briques communes aux nuanceurs et petits outils.
   Rien ici ne dépend de three.js : les fonctions reçoivent THREE en paramètre. */

/* Hasard reproductible (mulberry32) : la même liane à chaque visite. */
export function hasard(graine = 7) {
  let a = graine >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const borne = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lisse = (a, b, x) => { const t = borne((x - a) / (b - a)); return t * t * (3 - 2 * t); };
export const melange = (a, b, t) => a + (b - a) * t;
export const sortieCubique = (t) => 1 - Math.pow(1 - borne(t), 3);
export const sortieQuartique = (t) => 1 - Math.pow(1 - borne(t), 4);
export const entreeSortie = (t) => { t = borne(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
/* Amortissement indépendant de la cadence : x tend vers cible avec la vitesse lambda (1/s). */
export const amortir = (x, cible, lambda, dt) => cible + (x - cible) * Math.exp(-lambda * dt);

/* Bruit de valeur 3D et fbm, partagés par tous les nuanceurs (préfixe kz pour ne rien heurter dans three). */
export const GLSL_BRUIT = /* glsl */ `
float kzHash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float kzBruit(vec3 x) {
  vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(kzHash(i), kzHash(i + vec3(1.0, 0.0, 0.0)), f.x), mix(kzHash(i + vec3(0.0, 1.0, 0.0)), kzHash(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
             mix(mix(kzHash(i + vec3(0.0, 0.0, 1.0)), kzHash(i + vec3(1.0, 0.0, 1.0)), f.x), mix(kzHash(i + vec3(0.0, 1.0, 1.0)), kzHash(i + vec3(1.0, 1.0, 1.0)), f.x), f.y), f.z);
}
float kzFbm(vec3 p) { float a = 0.5; float s = 0.0; for (int i = 0; i < 4; i++) { s += a * kzBruit(p); p = p * 2.03 + vec3(3.1, 1.7, 5.3); a *= 0.5; } return s; }
`;

/* Le vent : tout ce qui pousse (tige, pétioles, feuilles, fleurs) se balance avec la même fonction
   de la position, pour que les feuilles restent accrochées à leur tige. */
export const GLSL_VENT = /* glsl */ `
uniform float uTemps;
uniform float uVent;
vec3 kzBalance(vec3 p) {
  float a = uTemps * 0.55 + p.z * 0.23 + p.x * 0.11;
  return vec3(sin(a) + 0.4 * sin(a * 2.3 + 1.0), 0.5 * cos(a * 0.8 + p.z * 0.17), 0.3 * sin(a * 1.3)) * 0.02 * uVent;
}
`;

/* Relief sans texture : la normale suit la pente d'une hauteur calculée (comme le bumpMap de three). */
export const GLSL_RELIEF = /* glsl */ `
vec3 kzRelief(vec3 pos, vec3 n, float h, float force, float face) {
  vec3 sx = dFdx(pos); vec3 sy = dFdy(pos);
  float lx = dot(sx, sx); float ly = dot(sy, sy);
  if (lx < 1e-14 || ly < 1e-14) return n;
  sx *= inversesqrt(lx); sy *= inversesqrt(ly);
  float ndv = abs(dot(n, normalize(-pos)));
  vec2 dh = vec2(dFdx(h), dFdy(h)) * force * smoothstep(0.12, 0.5, ndv);
  dh = clamp(dh, vec2(-0.5), vec2(0.5));
  vec3 r1 = cross(sy, n); vec3 r2 = cross(n, sx);
  float det = dot(sx, r1) * face;
  vec3 g = sign(det) * (dh.x * r1 + dh.y * r2);
  vec3 r = abs(det) * n - g;
  float lr = dot(r, r);
  return lr > 1e-14 ? r * inversesqrt(lr) : n;
}
`;

/* Garde : un pixel NaN ou infini serait étalé en rectangle noir par le halo lumineux. */
export const GLSL_SAIN = /* glsl */ `
  // min et max écartent un NaN sous D3D comme sous GL (isnan() fait avertir le compilateur D3D)
  outgoingLight = max(min(outgoingLight, vec3(60.0)), vec3(0.0));
`;

/* Greffe sur un matériau physique de three : uniformes partagés, déclarations, remplacements de morceaux.
   Un remplacement introuvable lève une erreur claire plutôt qu'un rendu faux. */
export function greffer(materiau, { uniforms = {}, declVert = '', declFrag = '', vert = [], frag = [], cle }) {
  materiau.userData.uniforms = uniforms;
  if (!frag.some(([a]) => a === '#include <opaque_fragment>')) frag = [...frag, ['#include <opaque_fragment>', GLSL_SAIN + '\n#include <opaque_fragment>']];
  materiau.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, uniforms);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\n' + declVert);
    for (const [a, b] of vert) {
      if (!sh.vertexShader.includes(a)) throw new Error('greffe sommet introuvable : ' + a);
      sh.vertexShader = sh.vertexShader.replace(a, b);
    }
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\n' + declFrag);
    for (const [a, b] of frag) {
      if (!sh.fragmentShader.includes(a)) throw new Error('greffe fragment introuvable : ' + a);
      sh.fragmentShader = sh.fragmentShader.replace(a, b);
    }
  };
  materiau.customProgramCacheKey = () => cle;
  return materiau;
}
