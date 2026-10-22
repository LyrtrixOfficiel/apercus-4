// Le domaine Kazura : outils partagés (JS et GLSL).
// Toutes les matières du domaine sont des ShaderMaterial écrits à la main : un seul éclairage,
// un seul vent, une seule brume, pilotés par les uniformes de l'heure (scene/heure.js).

export const borne = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lisse = (a, b, x) => { const t = borne((x - a) / (b - a)); return t * t * (3 - 2 * t); };
export const melange = (a, b, t) => a + (b - a) * t;
export const entreeSortie = (t) => t * t * (3 - 2 * t);
export const douce = (t) => t * t * t * (t * (t * 6 - 15) + 10);

/** Générateur pseudo-aléatoire reproductible (Park-Miller). */
export function alea(graine = 1) {
  let s = (graine >>> 0) % 2147483647 || 1;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

function h2(x, y) { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); }
export function bruit2(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
  const a = h2(ix, iy), b = h2(ix + 1, iy), c = h2(ix, iy + 1), d = h2(ix + 1, iy + 1);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}
export function fbm2(x, y, oct = 4) {
  let s = 0, a = 0.5;
  for (let i = 0; i < oct; i++) { s += a * bruit2(x, y); x = x * 2.03 + 17.1; y = y * 2.03 + 9.2; a *= 0.5; }
  return s;
}

/** Mélange de Fisher-Yates sur des blocs de `pas` flottants (pour que tout préfixe d'instances soit un tirage uniforme). */
export function melangerBlocs(tableaux, n, hasard) {
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(hasard() * (i + 1));
    for (const [t, pas] of tableaux) {
      for (let k = 0; k < pas; k++) { const a = t[i * pas + k]; t[i * pas + k] = t[j * pas + k]; t[j * pas + k] = a; }
    }
  }
}

/* ---------- GLSL ---------- */

export const GLSL_BRUIT = /* glsl */`
float h21(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float h11(float x) { return fract(sin(x * 91.3458) * 47453.5453); }
float bruit(vec2 p) {
  vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), u.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) { float a = 0.5, s = 0.0; for (int i = 0; i < 5; i++) { s += a * bruit(p); p = p * 2.03 + vec2(17.1, 9.2); a *= 0.5; } return s; }
float fbm3(vec2 p) { float a = 0.5, s = 0.0; for (int i = 0; i < 3; i++) { s += a * bruit(p); p = p * 2.03 + vec2(17.1, 9.2); a *= 0.5; } return s; }
`;

/* Le vent : des rafales qui traversent le coteau (on voit les vagues passer dans l'herbe), plus un frémissement. */
export const GLSL_VENT = /* glsl */`
uniform float uTemps;
uniform float uVent;
vec2 vent(vec2 xz, float souplesse) {
  vec2 dir = vec2(0.94, 0.34);
  float rafale = bruit(xz * 0.045 + vec2(-uTemps * 0.42, uTemps * 0.15));
  rafale = smoothstep(0.2, 0.9, rafale);
  float fr = sin(uTemps * (2.1 + souplesse) + xz.x * 0.9 + xz.y * 0.5) * 0.6 + sin(uTemps * 3.9 + xz.x * 1.7 - xz.y * 0.8) * 0.4;
  return uVent * (dir * (0.25 + 1.1 * rafale) + vec2(-dir.y, dir.x) * fr * 0.22 * souplesse);
}
`;

/* La main : l'endroit de l'écran que la souris ou le doigt touche (coordonnées normalisées), et sa force. */
export const GLSL_MAIN = /* glsl */`
uniform vec3 uMain;        // x, y : position écran normalisée (-1..1) ; z : force (0..1)
uniform float uAspect;
uniform vec3 uCamDroite;   // axe droit de la caméra, à plat
uniform vec3 uCamAvant;    // axe avant de la caméra, à plat
vec2 ecarter(vec3 p, float porteeProfondeur) {
  if (uMain.z < 0.001) return vec2(0.0);
  vec4 c = projectionMatrix * viewMatrix * vec4(p, 1.0);
  if (c.w <= 0.05) return vec2(0.0);
  vec2 d = (c.xy / c.w - uMain.xy) * vec2(uAspect, 1.0);
  float r = length(d);
  float rayon = 0.26;
  float f = uMain.z * (1.0 - smoothstep(0.0, rayon, r)) * (1.0 - smoothstep(porteeProfondeur * 0.4, porteeProfondeur, c.w));
  vec2 sens = d / max(r, 1e-4);
  vec3 w = uCamDroite * sens.x + uCamAvant * sens.y * 0.4;
  return normalize(w.xz + 1e-5) * f;
}
`;

/* L'éclairage partagé : soleil (ou lune), ciel, rebond du sol, lumière qui traverse les feuilles, brume de hauteur. */
export const GLSL_LUMIERE = /* glsl */`
uniform vec3 uLumDir;       // direction vers la lumière principale (soleil, puis lune)
uniform vec3 uLumCouleur;   // couleur * intensité
uniform vec3 uSoleil;       // direction vers le soleil vrai (pour la diffusion dans la brume)
uniform vec3 uCielHaut;
uniform vec3 uSolCouleur;
uniform vec3 uBrume;
uniform vec3 uBrumeProche;
uniform vec3 uBrumeSoleil;
uniform float uBrumeDensite;
uniform float uNuit;
vec3 ambiant(vec3 n) { return mix(uSolCouleur, uCielHaut, clamp(n.y * 0.5 + 0.5, 0.0, 1.0)); }
vec3 eclairer(vec3 alb, vec3 n, vec3 v, float ao, float transl, float enveloppe) {
  float ndl = dot(n, uLumDir);
  float d = max((ndl + enveloppe) / (1.0 + enveloppe), 0.0);
  float contre = pow(max(dot(-v, uLumDir), 0.0), 4.0);
  vec3 c = alb * (uLumCouleur * d * mix(0.55, 1.0, ao) + ambiant(n) * ao);
  c += alb * uLumCouleur * contre * transl * (0.6 + 0.4 * ao);
  return c;
}
vec3 brumer(vec3 c, vec3 pw) {
  vec3 dv = pw - cameraPosition;
  float dist = length(dv);
  vec3 dir = dv / max(dist, 1e-3);
  float hmoy = max(0.0, (pw.y + cameraPosition.y) * 0.5);
  float dens = uBrumeDensite * exp(-hmoy * 0.0045);
  float f = 1.0 - exp(-dist * dens);
  float s = pow(max(dot(dir, uSoleil), 0.0), 6.0);
  vec3 col = mix(uBrumeProche, uBrume, smoothstep(20.0, 420.0, dist));
  col = mix(col, uBrumeSoleil, s * 0.85);
  return mix(c, col, clamp(f, 0.0, 1.0));
}
`;

/* Netteté de l'alpha des cartes de feuillage : bords francs de près, pas de feuillage qui fond au loin. */
export const GLSL_ALPHA = /* glsl */`
float alphaNet(float a, vec2 uv, float seuil) {
  float w = max(fwidth(a), 1e-4);
  return clamp((a - seuil) / w + 0.5, 0.0, 1.0);
}
`;

/** Les uniformes partagés par toutes les matières (mêmes objets, donc une seule mise à jour par image). */
export function creerUniformesCommuns(THREE) {
  const v3 = () => ({ value: new THREE.Vector3() });
  const c = () => ({ value: new THREE.Color() });
  return {
    uTemps: { value: 0 }, uVent: { value: 0.6 },
    uLumDir: v3(), uLumCouleur: c(), uSoleil: v3(), uCielHaut: c(), uSolCouleur: c(),
    uBrume: c(), uBrumeProche: c(), uBrumeSoleil: c(), uBrumeDensite: { value: 0.002 }, uNuit: { value: 0 },
    uMain: { value: new THREE.Vector3(0, 0, 0) }, uAspect: { value: 1 },
    uCamDroite: { value: new THREE.Vector3(1, 0, 0) }, uCamAvant: { value: new THREE.Vector3(0, 0, -1) },
    uMagie: { value: 0 }, uLueur: { value: 0 }, uChateauLum: { value: 0 }, uCroissance: { value: 0 },
    uA2C: { value: 0 },
  };
}
