// Kazura v19, page des expériences : la scène WebGL du « couloir des portails ».
// Chaque expérience est un portail rond, au bord irisé, posé dans un couloir qui s'enfonce en spirale. À travers chaque
// portail, son monde bouge déjà : les vignes au couchant (domaine), la page de 2007 qui se fissure (casser), un site qui
// contient un site, sans fin (infini), une affiche animée (toute nouvelle expérience), et au bout le sceau (« Et le vôtre ? »).
// Une liane de lumière relie les portails ; des poussières flottent dans le couloir.
//
// WebGL 1 ou 2, sans bibliothèque. Tous les nuanceurs : precision highp float (puces Adreno).
// La page (galerie.js) donne l'état à chaque image : s (la position dans le voyage), la fenêtre où poser le portail
// courant, le regard (souris ou doigt), le survol, la plongée. La scène projette tout elle-même (sténopé simple).
// Qualité adaptative : si la cadence chute, la résolution du canevas baisse (jusqu'à la moitié), puis les poussières.

import { dessinerPage2007 } from './page2007.js';

const D = 6;          // distance entre deux portails, en profondeur
const D0 = 4;         // distance de vue du portail courant
const PAS = 1.95;     // angle de la spirale entre deux portails (radians)

// --------------------------------------------------------------------------------------------- les nuanceurs

const VS_CARRE = `precision highp float;
attribute vec2 aPos;
uniform vec2 uCentre; uniform float uTaille; uniform vec2 uRes;
void main() { vec2 px = uCentre + aPos * uTaille; gl_Position = vec4(px / uRes * 2.0 - 1.0, 0.0, 1.0); }`;

const COMMUN = `precision highp float;
uniform vec2 uCentre; uniform float uRayon; uniform float uT; uniform vec2 uRegard;
uniform float uProx; uniform float uSurvol; uniform float uAlpha; uniform float uZoom; uniform float uBientot; uniform float uTrace;
uniform vec3 uTeinte; uniform sampler2D uTex0; uniform sampler2D uTex1; uniform float uAspect;
float h21(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
vec2 h22(vec2 p) { float n = h21(p); return vec2(n, h21(p + n + 17.0)); }
// une image lue en miroir hors de ses bords (pendant la plongée, on voit plus loin que l'affiche : pas de traînées)
vec2 miroir(vec2 uv) { return 1.0 - abs(1.0 - mod(abs(uv), 2.0)); }
float bruit(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }
// des étincelles qui dérivent (lucioles, pollen) : une par case, qui scintille
vec3 etincelles(vec2 uv, float t, vec2 grille, vec3 coul, float vitesse) {
  vec2 g = uv * grille + vec2(0.0, t * vitesse);
  vec2 id = floor(g), f = fract(g) - 0.5;
  vec2 h = h22(id);
  vec2 o = (h - 0.5) * 0.7 + 0.12 * vec2(sin(t * 0.7 + h.x * 9.0), cos(t * 0.6 + h.y * 7.0));
  float d = length(f - o);
  float s = smoothstep(0.16, 0.0, d) * step(0.55, h.x) * (0.5 + 0.5 * sin(t * (1.0 + h.y * 2.0) + h.x * 30.0));
  return coul * s;
}
`;

const PORTAIL = `
void main() {
  vec2 p = (gl_FragCoord.xy - uCentre) / uRayon;
  float d = length(p);
  float px = 1.0 / uRayon;
  vec3 col = vec3(0.0); float a = 0.0;
  float ang = atan(p.y, p.x);
  if (d < 1.0 + 2.0 * px) {
    vec2 q = p * (1.0 - 0.07 * pow(min(d, 1.0), 4.0)) * uZoom;
    vec3 m = monde(q);
    if (uBientot > 0.5) { float l = dot(m, vec3(0.3, 0.59, 0.11)); m = mix(m, vec3(l) * vec3(0.8, 0.78, 1.0), 0.7) * 0.5; }
    float bord = smoothstep(0.6, 1.0, d);
    m *= 1.0 - 0.42 * bord;
    m += uTeinte * pow(bord, 7.0) * 0.4;
    // un reflet de verre, en croissant, en haut à gauche
    float refl = smoothstep(0.05, 0.0, abs(length(p - vec2(0.1, -0.12)) - 0.98)) * smoothstep(0.2, 0.8, -p.x * 0.6 + p.y * 0.8);
    m += vec3(1.0) * refl * 0.12;
    float dedans = 1.0 - smoothstep(1.0 - px, 1.0 + px, d);
    col = m * dedans; a = dedans;
  }
  // l'anneau irisé (couche mince), plus vif au survol
  vec3 iri = 0.55 + 0.45 * cos(6.2831 * (vec3(0.0, 0.33, 0.67) + ang / 6.2831 + uT * 0.05 + d * 0.5));
  iri = mix(iri, uTeinte, 0.28);
  float w = max(0.011 + 0.008 * uSurvol, 1.15 * px);
  float anneau = 1.0 - smoothstep(w * 0.25, w, abs(d - 1.0));
  float halo = exp(-max(d - 1.0, 0.0) * (7.5 - 2.5 * uSurvol)) * step(1.0, d) * (0.26 + 0.36 * uSurvol + 0.14 * uProx);
  // la graduation, fine, qui tourne lentement (l'interface technique du site)
  float g = 0.0;
  if (d > 1.055 && d < 1.13 && uRayon > 70.0) {
    float n = (ang / 6.2831 + 0.5) * 72.0 + uT * 0.12;
    float pas = 6.2831 * 1.09 / 72.0;
    float lw = 1.1 * px / pas;
    float f = abs(fract(n + 0.5) - 0.5);
    float longue = step(0.5, fract((floor(n + 0.5)) / 6.0 + 0.04)) ;
    float rmax = mix(1.09, 1.12, 1.0 - longue);
    g = (1.0 - smoothstep(lw * 0.5, lw, f)) * step(1.065, d) * (1.0 - smoothstep(rmax - px, rmax + px, d));
    g *= (0.18 + 0.32 * uProx) * smoothstep(70.0, 140.0, uRayon);
  }
  col += iri * (anneau * 1.35 + halo * 0.85) + vec3(0.93, 0.94, 0.92) * g;
  a = max(a, clamp(anneau + halo * 0.85 + g, 0.0, 1.0));
  gl_FragColor = vec4(col, a) * uAlpha;
}`;

// ------------------------------------------------------------------- les mondes, vus à travers les portails

const MONDES = {
  // les vignes du domaine au couchant : l'affiche, en parallaxe (le bas est plus proche), le vent dans les feuilles,
  // le soleil qui respire, ses rayons, les lucioles
  domaine: `
vec3 monde(vec2 q) {
  vec2 uv = vec2(0.53, 0.47) + vec2(q.x / uAspect, -q.y) * 0.47;
  float pres = smoothstep(0.35, 1.0, uv.y);
  uv += uRegard * vec2(0.012 + 0.03 * pres, -0.008 - 0.02 * pres);
  uv.x += sin(uv.y * 70.0 + uT * 1.6 + sin(uv.x * 23.0 + uT)) * 0.0011 * pres;
  vec3 c = texture2D(uTex0, miroir(uv)).rgb;
  vec2 dv = (uv - vec2(0.17, 0.30)) * vec2(uAspect, 1.0);
  float r = length(dv);
  float souffle = 0.82 + 0.18 * sin(uT * 0.6);
  c += vec3(1.0, 0.6, 0.26) * (0.22 / (1.0 + r * r * 40.0)) * souffle;
  float an = atan(dv.y, dv.x);
  float rayons = pow(max(0.0, sin(an * 13.0 + uT * 0.22) * sin(an * 7.0 - uT * 0.15)), 3.0);
  c += vec3(1.0, 0.72, 0.42) * rayons * 0.16 * smoothstep(1.1, 0.1, r) * (1.0 - pres * 0.8);
  c += etincelles(uv, uT, vec2(26.0, 16.0), vec3(1.0, 0.86, 0.5), -0.05) * (0.4 + pres);
  return c * vec3(1.03, 0.99, 0.94);
}`,

  // la page grise de 2007 qui se fissure, éclate en morceaux qui s'envolent, et laisse voir le nouveau site ;
  // puis elle se reconstruit, et ça recommence (11 s)
  casser: `
vec3 voronoi(vec2 x) {
  vec2 n = floor(x), f = fract(x);
  vec2 mg, mr; float md = 8.0;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 g = vec2(float(i), float(j)); vec2 o = h22(n + g); vec2 r = g + o - f; float d = dot(r, r);
    if (d < md) { md = d; mr = r; mg = g; }
  }
  md = 8.0;
  for (int j = -2; j <= 2; j++) for (int i = -2; i <= 2; i++) {
    vec2 g = mg + vec2(float(i), float(j)); vec2 o = h22(n + g); vec2 r = g + o - f;
    if (dot(mr - r, mr - r) > 0.00001) md = min(md, dot(0.5 * (mr + r), normalize(r - mr)));
  }
  return vec3(md, n + mg + h22(n + mg));
}
vec3 monde(vec2 q) {
  float T = 11.0;
  float c = mod(uT, T);
  float cycle = floor(uT / T);
  vec2 impact = (h22(vec2(cycle, 3.0)) - 0.5) * 0.7;
  vec2 uvN = vec2(0.5, 0.45) + vec2(q.x / uAspect, -q.y) * 0.27;
  vec3 neuf = texture2D(uTex1, clamp(uvN + uRegard * 0.01, 0.0, 1.0)).rgb;
  float E = 4.2;
  vec3 v = voronoi(q * E);
  vec2 centre = v.yz / E;
  float dI = length(centre - impact);
  float fissure = smoothstep(1.7, 4.2, c) * 2.4;
  float envol = smoothstep(4.4, 7.4, c) * 2.6;
  float g = clamp((envol - dI) * 1.6, 0.0, 1.0);
  float k = 1.0 - g;
  vec2 loc = q - centre;
  vec2 chute = vec2(0.0, -1.0) * g * g * 0.35 + normalize(centre - impact + 0.001) * g * 0.25;
  vec2 qs = centre + loc / max(k, 0.05) + chute * 0.0;
  float dedans = step(g * 0.55 / E, v.x) * step(g, 0.98);
  vec2 uvP = vec2(0.5) + vec2(qs.x, -qs.y) * 0.5 * 0.97;
  vec3 page = texture2D(uTex0, clamp(uvP, 0.0, 1.0)).rgb;
  page *= 0.92 + 0.16 * h21(v.yz) * smoothstep(0.0, 0.3, g + step(dI, fissure) * 0.3);
  page *= 1.0 - 0.6 * g;
  // les fissures, d'où sort la lumière (jade et violet)
  float ouvert = step(dI, fissure);
  float trait = (1.0 - smoothstep(0.0, 0.035, v.x)) * ouvert;
  vec3 lumiere = mix(vec3(0.43, 0.91, 0.72), vec3(0.7, 0.55, 1.0), 0.5 + 0.5 * sin(dI * 9.0 - uT * 2.0));
  // le choc
  float choc = exp(-pow((c - 1.75) * 5.0, 2.0)) * smoothstep(0.5, 0.0, length(q - impact));
  vec3 vieux = page + lumiere * trait * 1.4 + vec3(1.0) * choc;
  // un peu de balayage cathodique sur la page intacte
  vieux *= 0.96 + 0.04 * sin(gl_FragCoord.y * 1.4);
  vec3 col = mix(neuf, vieux, dedans);
  col += lumiere * (1.0 - dedans) * smoothstep(0.08, 0.0, v.x) * g * (1.0 - g) * 2.4;
  // la reconstruction : un balayage qui repose la page
  float rebatir = smoothstep(9.3, 10.6, c);
  vec2 uv0 = vec2(0.5) + vec2(q.x, -q.y) * 0.5 * 0.97;
  vec3 intacte = texture2D(uTex0, clamp(uv0, 0.0, 1.0)).rgb;
  float balai = smoothstep(rebatir * 2.4 - 1.2, rebatir * 2.4 - 1.1, -q.y);
  col = mix(col, intacte, balai * step(0.001, rebatir));
  col += lumiere * exp(-pow((-q.y - (rebatir * 2.4 - 1.15)) * 30.0, 2.0)) * step(0.001, rebatir) * step(rebatir, 0.999) * 0.8;
  return col;
}`,

  // un site qui contient un site, qui contient un site… : un zoom sans fin dans des pages dessinées (l'esprit de
  // l'expérience « Le site infini »)
  infini: `
float boite(vec2 p, vec2 b, float r) { vec2 d = abs(p) - b + r; return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - r; }
vec3 teinteNiveau(float n) {
  float k = mod(n, 4.0);
  if (k < 1.0) return vec3(0.55, 0.42, 1.0);
  if (k < 2.0) return vec3(0.25, 0.85, 0.62);
  if (k < 3.0) return vec3(0.95, 0.78, 0.48);
  return vec3(0.95, 0.5, 0.72);
}
vec3 page(vec2 p, float n, float px) {
  vec3 t = teinteNiveau(n);
  vec3 fond = mix(vec3(0.03, 0.03, 0.07), t * 0.22, 0.35 + 0.25 * (p.y + 0.8));
  vec3 c = fond;
  // la barre du haut : trois points, des liens
  float barre = step(0.62, p.y);
  c = mix(c, fond * 1.6 + 0.03, barre);
  for (int i = 0; i < 3; i++) { float dd = length(p - vec2(-0.9 + float(i) * 0.07, 0.71)); c = mix(c, t, smoothstep(0.03, 0.03 - px * 2.0, dd)); }
  for (int i = 0; i < 3; i++) { float b = boite(p - vec2(0.35 + float(i) * 0.2, 0.71), vec2(0.07, 0.014), 0.01); c = mix(c, vec3(0.9), (1.0 - smoothstep(0.0, px * 2.0, b)) * 0.55); }
  // le titre
  float t1 = boite(p - vec2(-0.48, 0.5), vec2(0.42, 0.045), 0.02);
  c = mix(c, vec3(0.95), 1.0 - smoothstep(0.0, px * 2.0, t1));
  float t2 = boite(p - vec2(-0.6, 0.4), vec2(0.3, 0.02), 0.01);
  c = mix(c, vec3(0.7), (1.0 - smoothstep(0.0, px * 2.0, t2)) * 0.8);
  float bt = boite(p - vec2(0.7, 0.45), vec2(0.14, 0.05), 0.05);
  c = mix(c, t, 1.0 - smoothstep(0.0, px * 2.0, bt));
  // trois cartes en bas
  for (int i = 0; i < 3; i++) {
    float b = boite(p - vec2(-0.62 + float(i) * 0.62, -0.58), vec2(0.27, 0.15), 0.04);
    c = mix(c, mix(fond * 2.2, t * 0.5, 0.35), 1.0 - smoothstep(0.0, px * 2.0, b));
    float l = boite(p - vec2(-0.66 + float(i) * 0.62, -0.53), vec2(0.18, 0.015), 0.01);
    c = mix(c, vec3(0.85), (1.0 - smoothstep(0.0, px * 2.0, l)) * 0.7);
  }
  return c;
}
vec3 monde(vec2 q) {
  float S = 2.6;
  float vitesse = 0.11;
  float tt = uT * vitesse;
  float f = fract(tt), n0 = floor(tt);
  float z = pow(S, f);
  vec2 p = q * 0.98 / z + uRegard * 0.02;
  float n = n0;
  float px = 1.5 / (uRayon * 0.98) / z;
  vec2 fen = vec2(1.0, 0.8) / S;
  for (int i = 0; i < 7; i++) {
    if (abs(p.x) < fen.x && abs(p.y) < fen.y) { p *= S; n += 1.0; px *= S; } else { break; }
  }
  vec3 c = page(p, n, px);
  // le cadre lumineux de la fenêtre (le site suivant), et la lueur qui en sort
  float cadre = boite(p, fen, 0.02);
  vec3 t = teinteNiveau(n + 1.0);
  c += t * (1.0 - smoothstep(0.0, px * 3.0, abs(cadre))) * 1.2;
  c += t * exp(-max(cadre, 0.0) * 9.0) * 0.25;
  // hors de la page (le bord du premier niveau visible)
  float horsPage = step(0.0, boite(p, vec2(1.0, 0.8), 0.04));
  c = mix(c, vec3(0.02, 0.02, 0.05), horsPage);
  return c;
}`,

  // toute nouvelle expérience : son affiche, qui respire, en parallaxe, avec une lumière irisée qui passe
  affiche: `
vec3 monde(vec2 q) {
  float z = 1.0 - 0.04 * (0.5 + 0.5 * sin(uT * 0.25));
  vec2 uv = vec2(0.5) + vec2(q.x / uAspect, -q.y) * 0.48 * z;
  uv += uRegard * vec2(0.02, -0.015);
  vec3 c = texture2D(uTex0, miroir(uv)).rgb;
  float b = fract(uT * 0.08);
  float bande = exp(-pow((q.x * 0.7 + q.y * 0.7 - (b * 4.0 - 2.0)) * 3.0, 2.0));
  c += (0.55 + 0.45 * cos(6.2831 * (vec3(0.0, 0.33, 0.67) + q.y * 0.5 + uT * 0.05))) * bande * 0.18;
  c += etincelles(uv, uT, vec2(20.0, 12.0), uTeinte, -0.04) * 0.6;
  return c;
}`,

  // au bout du couloir, « Et le vôtre ? » : une nébuleuse irisée, et le sceau Kazura qui se trace
  votre: `
float vesica(vec2 p, float h, float w) {
  float rho = (h * h + w * w) / (2.0 * w);
  float d1 = length(p - vec2(rho - w, 0.0)) - rho;
  float d2 = length(p + vec2(rho - w, 0.0)) - rho;
  return max(d1, d2);
}
vec2 tourne(vec2 p, float a) { float c = cos(a), s = sin(a); return vec2(c * p.x - s * p.y, s * p.x + c * p.y); }
vec3 monde(vec2 q) {
  float r = length(q); float a = atan(q.y, q.x);
  // (le bruit tourne avec l'angle par cos et sin : pas de couture à gauche)
  vec2 cs = vec2(cos(a + uT * 0.03), sin(a + uT * 0.03)) * (1.2 + r * 1.5);
  float n = bruit(cs + vec2(r * 2.0 - uT * 0.1, 0.0)) * 0.6 + bruit(q * 3.5 + uT * 0.05) * 0.4;
  vec3 neb = mix(vec3(0.42, 0.28, 0.9), vec3(0.16, 0.72, 0.55), smoothstep(0.3, 0.75, n));
  neb = mix(neb, vec3(0.95, 0.75, 0.45), smoothstep(0.72, 0.95, n) * 0.6);
  vec3 c = vec3(0.025, 0.02, 0.06) + neb * smoothstep(0.25, 0.85, n) * 0.55 * smoothstep(1.1, 0.2, r);
  c += etincelles(q * 0.5 + 0.5, uT, vec2(18.0, 18.0), vec3(0.9, 0.95, 1.0), -0.02) * 0.6;
  // le sceau, en traits de lumière
  vec2 s = tourne(q * 1.32, uT * 0.03);
  float px = 1.6 / uRayon * 1.32;
  float tr = clamp(uTrace, 0.0, 1.0);
  float angle = fract(atan(s.x, s.y) / 6.2831 + 1.0);
  float anneaux = min(abs(length(s) - 0.96), abs(length(s) - 0.84));
  float ligneA = (1.0 - smoothstep(px * 0.6, px * 1.6, anneaux)) * step(angle, tr * 1.25);
  float feuilles = 1e3;
  for (int i = 0; i < 3; i++) {
    vec2 sp = tourne(s, float(i) * 2.0944);
    vec2 lp = vec2(sp.x, sp.y - 0.52);
    feuilles = min(feuilles, abs(vesica(lp, 0.4, 0.17)));
    feuilles = min(feuilles, abs(vesica(lp - vec2(0.0, 0.02), 0.24, 0.085)));
  }
  float ligneF = (1.0 - smoothstep(px * 0.6, px * 1.6, feuilles)) * smoothstep(0.45, 0.85, tr);
  float coeur = (1.0 - smoothstep(px * 0.6, px * 1.6, abs(length(s) - 0.096))) * smoothstep(0.7, 1.0, tr);
  vec3 encre = vec3(0.93, 0.95, 0.92);
  c += encre * ligneA * 0.95 + vec3(0.43, 0.91, 0.72) * ligneF * 1.1 + vec3(0.91, 0.79, 0.53) * coeur;
  c += vec3(0.43, 0.91, 0.72) * exp(-feuilles * 18.0) * smoothstep(0.45, 0.85, tr) * 0.25;
  return c;
}`,
};

// la lueur au bout du couloir
const FS_LUEUR = `precision highp float;
uniform vec2 uCentre; uniform float uRayon; uniform float uAlpha; uniform float uT;
void main() {
  vec2 p = (gl_FragCoord.xy - uCentre) / uRayon;
  float d = length(p);
  float a = exp(-d * d * 2.2) * (0.85 + 0.15 * sin(uT * 0.4));
  vec3 c = mix(vec3(0.24, 0.62, 0.5), vec3(0.42, 0.3, 0.85), smoothstep(0.0, 1.0, d + 0.2 * sin(atan(p.y, p.x) * 3.0 + uT * 0.1)));
  gl_FragColor = vec4(c * a, a * 0.6) * uAlpha;
}`;

// la liane : un ruban de lumière en coordonnées d'écran (bâti à chaque image), une sève qui court vers l'avant
const VS_LIANE = `precision highp float;
attribute vec4 aV; attribute float aA;
uniform vec2 uRes;
varying vec2 vU; varying float vA;
void main() { vU = aV.zw; vA = aA; gl_Position = vec4(aV.xy / uRes * 2.0 - 1.0, 0.0, 1.0); }`;
// (uTexte : le rectangle du texte courant, en px du canevas ; la liane s'y fait discrète, le texte reste lisible)
const TEXTE = `uniform vec4 uTexte;
float horsTexte() {
  vec2 p = gl_FragCoord.xy;
  vec2 d = max(uTexte.xy - p, p - uTexte.zw);
  float dd = max(d.x, d.y);
  return mix(0.18, 1.0, smoothstep(-10.0, 60.0, dd));
}
`;
const FS_LIANE = `precision highp float;
uniform float uT;
varying vec2 vU; varying float vA;
` + TEXTE + `
void main() {
  float x = vU.x;
  float halo = exp(-x * x * 5.0);
  float coeur = exp(-x * x * 70.0);
  float seve = pow(0.5 + 0.5 * sin(vU.y * 0.55 - uT * 1.5), 8.0);
  vec3 c = mix(vec3(0.55, 0.42, 1.0), vec3(0.3, 0.85, 0.65), 0.5 + 0.5 * sin(vU.y * 0.07 + uT * 0.15));
  vec3 col = c * halo * 0.45 + vec3(0.85, 1.0, 0.93) * coeur * (0.45 + 0.9 * seve);
  float a = clamp(halo * 0.35 + coeur * 0.7, 0.0, 1.0);
  gl_FragColor = vec4(col, a) * vA * horsTexte();
}`;

// les poussières et les feuilles : des points
const VS_POUSSIERE = `precision highp float;
attribute vec4 aP;
uniform vec3 uCam; uniform float uF; uniform vec2 uSlot; uniform vec2 uRes; uniform float uT; uniform float uPortee; uniform float uEch; uniform float uAlpha;
varying float vA; varying vec3 vC;
void main() {
  float depth = mod(uCam.z - aP.z, uPortee) + 0.35;
  vec2 xy = aP.xy + 0.25 * vec2(sin(uT * 0.11 + aP.w * 40.0), cos(uT * 0.09 + aP.w * 31.0));
  vec2 ecran = uSlot + uF * xy / depth;
  gl_Position = vec4(ecran / uRes * 2.0 - 1.0, 0.0, 1.0);
  float taille = (0.022 + 0.03 * fract(aP.w * 7.0)) * uF / depth;
  gl_PointSize = clamp(taille, 1.0, 18.0 * uEch);
  float clign = 0.6 + 0.4 * sin(uT * (0.8 + fract(aP.w * 13.0)) + aP.w * 50.0);
  vA = smoothstep(0.35, 1.6, depth) * smoothstep(uPortee, uPortee * 0.55, depth) * clign * uAlpha * min(1.0, taille / 1.5 + 0.3);
  float k = fract(aP.w * 3.7);
  vC = k < 0.45 ? vec3(0.62, 0.5, 1.0) : (k < 0.85 ? vec3(0.45, 0.92, 0.74) : vec3(0.95, 0.8, 0.52));
}`;
const FS_POUSSIERE = `precision highp float;
varying float vA; varying vec3 vC;
` + TEXTE + `
void main() { float d = length(gl_PointCoord - 0.5); float a = pow(smoothstep(0.5, 0.0, d), 1.6) * vA * horsTexte(); gl_FragColor = vec4(vC * a, a * 0.7); }`;

const VS_FEUILLE = `precision highp float;
attribute vec4 aF; attribute float aAl;
uniform vec2 uRes;
varying float vAng; varying float vA;
void main() { gl_Position = vec4(aF.xy / uRes * 2.0 - 1.0, 0.0, 1.0); gl_PointSize = aF.z; vAng = aF.w; vA = aAl; }`;
const FS_FEUILLE = `precision highp float;
varying float vAng; varying float vA;
` + TEXTE + `
void main() {
  vec2 p = gl_PointCoord - 0.5; p.y = -p.y;
  float c = cos(vAng), s = sin(vAng);
  p = vec2(c * p.x + s * p.y, -s * p.x + c * p.y);
  // une feuille (deux arcs), la pointe vers +x
  float w = 0.17, h = 0.46, rho = (h * h + w * w) / (2.0 * w);
  float d = max(length(p - vec2(0.0, rho - w)) - rho, length(p + vec2(0.0, rho - w)) - rho);
  float a = smoothstep(0.02, -0.02, d);
  float nervure = smoothstep(0.02, 0.0, abs(p.y)) * step(abs(p.x), 0.4);
  vec3 col = mix(vec3(0.07, 0.55, 0.4), vec3(0.43, 0.91, 0.72), 0.5 + p.x) + nervure * 0.25;
  gl_FragColor = vec4(col * a, a) * vA * horsTexte();
}`;

// --------------------------------------------------------------------------------------------- outils WebGL

function compiler(gl, type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS) && !gl.isContextLost()) {
    const log = gl.getShaderInfoLog(s);
    gl.deleteShader(s);
    throw new Error('nuanceur : ' + log);
  }
  return s;
}
function programme(gl, vs, fs, attributs) {
  const p = gl.createProgram();
  gl.attachShader(p, compiler(gl, gl.VERTEX_SHADER, vs));
  gl.attachShader(p, compiler(gl, gl.FRAGMENT_SHADER, fs));
  attributs.forEach((a, i) => gl.bindAttribLocation(p, i, a));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS) && !gl.isContextLost()) throw new Error('programme : ' + gl.getProgramInfoLog(p));
  const u = {};
  const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < n; i++) { const info = gl.getActiveUniform(p, i); u[info.name] = gl.getUniformLocation(p, info.name); }
  return { p, u };
}
const hex = (h) => { const n = parseInt(h.replace('#', ''), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; };
const borne = (x, a, b) => Math.min(b, Math.max(a, x));
const lisse = (a, b, x) => { const t = borne((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

// --------------------------------------------------------------------------------------------- la scène

/**
 * @param {HTMLCanvasElement} canvas
 * @param {{ portails: {monde: string, teinte: string, image?: string, image2?: string, bientot?: boolean}[],
 *           reduit: boolean, mobile: boolean, fixe?: boolean, etat: () => object, surQualite?: (q:number) => void }} o
 */
export function creerScene(canvas, o) {
  const attr = { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, powerPreference: 'high-performance', preserveDrawingBuffer: false };
  const gl = canvas.getContext('webgl2', attr) || canvas.getContext('webgl', attr) || canvas.getContext('experimental-webgl', attr);
  if (!gl) throw new Error('pas de WebGL');
  const gl2 = typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext;
  const { reduit, mobile } = o;

  // les programmes
  const progs = {};
  const mondesUtiles = new Set(o.portails.map((p) => p.monde));
  for (const m of mondesUtiles) progs[m] = programme(gl, VS_CARRE, COMMUN + MONDES[m] + PORTAIL, ['aPos']);
  const pLueur = programme(gl, VS_CARRE, FS_LUEUR, ['aPos']);
  const pLiane = programme(gl, VS_LIANE, FS_LIANE, ['aV', 'aA']);
  const pPous = programme(gl, VS_POUSSIERE, FS_POUSSIERE, ['aP']);
  const pFeuille = programme(gl, VS_FEUILLE, FS_FEUILLE, ['aF', 'aAl']);

  // le carré unité
  const bCarre = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, bCarre);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

  // les poussières (un tube autour de l'axe de la caméra)
  const NP = mobile ? 260 : 520;
  const PORTEE = 30;
  const pous = new Float32Array(NP * 4);
  for (let i = 0; i < NP; i++) {
    const a = Math.random() * Math.PI * 2, r = 0.7 + Math.pow(Math.random(), 0.6) * 5.5;
    pous.set([Math.cos(a) * r, Math.sin(a) * r * 0.8, Math.random() * PORTEE, Math.random()], i * 4);
  }
  const bPous = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, bPous);
  gl.bufferData(gl.ARRAY_BUFFER, pous, gl.STATIC_DRAW);
  let nPous = NP;

  const bLiane = gl.createBuffer();
  const bFeuille = gl.createBuffer();

  // les textures : 1 pixel de la teinte tout de suite, l'image dès qu'elle arrive (puissance de deux, mipmaps)
  const grande = !mobile && Math.max(screen.width, screen.height) > 1300;
  const LT = grande ? 2048 : 1024, HT = grande ? 1024 : 512;
  function texture(teinte) {
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    const [r, g, b] = hex(teinte || '#20202a');
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([r * 255 * 0.3, g * 255 * 0.3, b * 255 * 0.3, 255]));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    return t;
  }
  function poser(t, source, l = LT, h = HT) {
    const c = document.createElement('canvas');
    c.width = l; c.height = h;
    c.getContext('2d').drawImage(source, 0, 0, l, h);
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    const ext = gl.getExtension('EXT_texture_filter_anisotropic');
    if (ext) gl.texParameterf(gl.TEXTURE_2D, ext.TEXTURE_MAX_ANISOTROPY_EXT, 4);
  }
  const cache = new Map();
  function charger(url, teinte) {
    if (!url) return texture(teinte);
    if (cache.has(url)) return cache.get(url);
    const t = texture(teinte);
    cache.set(url, t);
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => { if (!gl.isContextLost()) { poser(t, img); demander(); } };
    img.src = url;
    return t;
  }
  let page2007 = null;
  const portails = o.portails.map((p) => {
    const t0 = p.monde === 'casser'
      ? (page2007 ||= (() => { const t = texture('#9fa6b2'); poser(t, dessinerPage2007(mobile ? 512 : 1024), mobile ? 512 : 1024, mobile ? 512 : 1024); return t; })())
      : charger(p.image, p.teinte);
    const t1 = p.monde === 'casser' ? charger(p.image, p.teinte) : t0;
    return { ...p, rgb: hex(p.teinte || '#c9b8ff'), t0, t1, aspect: p.monde === 'casser' ? 1.6 : 1.6, survol: 0, trace: 0 };
  });

  // ------------------------------------------------------------------------------------ taille et qualité
  let L = 1, H = 1, echelle = 1, qualite = 1;
  const plafond = Math.min(window.devicePixelRatio || 1, mobile ? 2 : 1.5);
  const budget = mobile ? 1.5e6 : 4.2e6;
  function redim() {
    L = Math.max(1, canvas.clientWidth); H = Math.max(1, canvas.clientHeight);
    let e = plafond;
    if (L * H * e * e > budget) e = Math.sqrt(budget / (L * H));
    echelle = Math.max(0.5, e * qualite);
    const lw = Math.round(L * echelle), lh = Math.round(H * echelle);
    if (canvas.width !== lw || canvas.height !== lh) { canvas.width = lw; canvas.height = lh; }
    demander();
  }

  // la cadence : moyenne glissante de l'intervalle entre deux images
  let moy = 16.7, lent = 0, rapide = 0, derniereBaisse = 0, hausses = 0;
  function adapter(dt, maintenant) {
    if (o.fixe || dt > 250) return;
    moy += (dt - moy) * 0.06;
    if (moy > 24) { lent += dt; rapide = 0; } else if (moy < 17.5) { rapide += dt; lent = 0; } else { lent = Math.max(0, lent - dt); rapide = 0; }
    if (lent > 1500 && (qualite > 0.55 || nPous > NP * 0.4)) {
      if (qualite > 0.55) qualite = Math.max(0.5, qualite * 0.8); else nPous = Math.round(NP * 0.4);
      lent = 0; derniereBaisse = maintenant; redim(); o.surQualite?.(qualite);
    } else if (rapide > 4000 && qualite < 1 && hausses < 3 && maintenant - derniereBaisse > 8000) {
      qualite = Math.min(1, qualite * 1.15); hausses++; rapide = 0; redim(); o.surQualite?.(qualite);
    }
  }

  // ------------------------------------------------------------------------------------ la géométrie du voyage
  const A = reduit ? 1.05 : 1.7;
  const posPortail = (i) => [A * Math.cos(PAS * i), A * Math.sin(PAS * i), -i * D];
  // avant la première expérience (l'accueil), la caméra recule dans l'axe du premier portail : un simple travelling
  const posCamera = (s) => { const a = PAS * Math.max(0, s); return [A * Math.cos(a), A * Math.sin(a), -s * D + D0]; };

  // la liane : des points de contrôle autour du bord de chaque portail, puis vers le suivant
  const ctrl = [];
  {
    const n = portails.length;
    const p0 = posPortail(-1.2);
    ctrl.push([p0[0] * 1.6, p0[1] * 1.6 - 2.0, D * 1.4]);
    for (let i = 0; i < n; i++) {
      const [x, y, z] = posPortail(i);
      const base = PAS * i + Math.PI * 0.9;
      for (let k = 0; k < 4; k++) {
        const a = base + k * 0.72;
        const r = 1.13 + 0.03 * Math.sin(k * 2.1);
        ctrl.push([x + Math.cos(a) * r, y + Math.sin(a) * r, z + 0.35 - k * 0.25]);
      }
    }
    const [x, y, z] = posPortail(n + 0.6);
    ctrl.push([x, y, z - D * 2]);
    ctrl.push([x * 0.3, y * 0.3, z - D * 6]);
  }
  // échantillonnage Catmull-Rom (une fois)
  const lianePts = [];
  for (let i = 0; i < ctrl.length - 1; i++) {
    const p0 = ctrl[Math.max(0, i - 1)], p1 = ctrl[i], p2 = ctrl[i + 1], p3 = ctrl[Math.min(ctrl.length - 1, i + 2)];
    const N = 14;
    for (let k = 0; k < N; k++) {
      const t = k / N, t2 = t * t, t3 = t2 * t;
      lianePts.push([0, 1, 2].map((c) => 0.5 * ((2 * p1[c]) + (-p0[c] + p2[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2 + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * t3)));
    }
  }
  lianePts.push(ctrl[ctrl.length - 1]);
  // la longueur cumulée (pour la sève)
  const lianeLong = [0];
  for (let i = 1; i < lianePts.length; i++) {
    const a = lianePts[i - 1], b = lianePts[i];
    lianeLong.push(lianeLong[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]));
  }
  const lianeBuf = new Float32Array(lianePts.length * 2 * 5);
  const feuilleBuf = new Float32Array(Math.ceil(lianePts.length / 5 + 2) * 5);

  // ------------------------------------------------------------------------------------ le dessin
  let raf = 0, tPrec = 0, temps = 0, vivant = true, demande = true;
  function demander() { demande = true; if (!raf && vivant) raf = requestAnimationFrame(image); }

  function attribCarre() {
    gl.bindBuffer(gl.ARRAY_BUFFER, bCarre);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.disableVertexAttribArray(1);
  }

  function image(maintenant) {
    raf = 0;
    if (!vivant) return;
    const dt = tPrec ? maintenant - tPrec : 16.7;
    tPrec = maintenant;
    const e = o.etat();
    if (e.cache) { tPrec = 0; return; } // hors de l'écran : on s'arrête, la page relance
    adapter(dt, maintenant);
    temps += Math.min(dt, 100) / 1000 * (reduit ? 0.45 : 1);
    dessiner(e);
    raf = requestAnimationFrame(image);
  }

  function dessiner(e) {
    const W = canvas.width, Hc = canvas.height, k = echelle;
    gl.viewport(0, 0, W, Hc);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    const s = e.s;
    const pl = e.plonge; // { i, k } ou null
    const kp = pl ? pl.k : 0;
    const ep = kp * kp * (3 - 2 * kp);
    const autres = 1 - lisse(0, 0.45, kp); // ce qui n'est pas le portail choisi s'efface pendant la plongée
    const slot = e.slot; // en px CSS : x, y, r
    const f = slot.r * D0;
    const cam = posCamera(s);
    const sx = slot.x * k, sy = (H - slot.y) * k; // le centre de projection, en px du canevas (y vers le haut)
    const proj = (P) => {
      const dx = P[0] - cam[0], dy = P[1] - cam[1], depth = cam[2] - P[2];
      return [sx + f * k * dx / depth, sy + f * k * dy / depth, depth];
    };
    const res = [W, Hc];
    const tx = e.texte ? [e.texte.l * k, (H - e.texte.b) * k, e.texte.r * k, (H - e.texte.t) * k] : [-9, -9, -9, -9];

    // la lueur au bout du couloir
    {
      const pr = pLueur; gl.useProgram(pr.p); attribCarre();
      gl.uniform2fv(pr.u.uRes, res);
      gl.uniform2f(pr.u.uCentre, sx, sy);
      gl.uniform1f(pr.u.uRayon, slot.r * k * 1.9);
      gl.uniform1f(pr.u.uTaille, slot.r * k * 3.2);
      gl.uniform1f(pr.u.uAlpha, 0.55 * autres * (e.alpha ?? 1));
      gl.uniform1f(pr.u.uT, temps);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    // les poussières
    if (nPous > 0) {
      const pr = pPous; gl.useProgram(pr.p);
      gl.bindBuffer(gl.ARRAY_BUFFER, bPous);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 0, 0);
      gl.disableVertexAttribArray(1);
      gl.uniform3f(pr.u.uCam, 0, 0, -(s + ep * 0.5) * D);
      gl.uniform1f(pr.u.uF, f * k);
      gl.uniform2f(pr.u.uSlot, sx, sy);
      gl.uniform2fv(pr.u.uRes, res);
      gl.uniform1f(pr.u.uT, temps);
      gl.uniform1f(pr.u.uPortee, PORTEE);
      gl.uniform1f(pr.u.uEch, k);
      gl.uniform1f(pr.u.uAlpha, (0.4 + 0.6 * autres) * (e.alpha ?? 1));
      gl.uniform4fv(pr.u.uTexte, tx);
      gl.drawArrays(gl.POINTS, 0, nPous);
    }

    // la liane (ruban bâti à l'écran) et ses feuilles
    {
      let n = 0, nf = 0;
      const largeur = 0.05;
      let prev = null;
      for (let i = 0; i < lianePts.length; i++) {
        const P = lianePts[i];
        const depth = cam[2] - P[2];
        if (depth < 0.4 || depth > 60) { prev = null; continue; }
        const [x, y] = proj(P);
        // la direction à l'écran
        const Q = lianePts[Math.min(lianePts.length - 1, i + 1)], R = lianePts[Math.max(0, i - 1)];
        const dq = cam[2] - Q[2], dr = cam[2] - R[2];
        if (dq < 0.4 || dr < 0.4) { prev = null; continue; }
        const [qx, qy] = proj(Q), [rx, ry] = proj(R);
        let tx = qx - rx, ty = qy - ry; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
        const w = Math.min(Math.max(largeur * f * k / depth, 1.4 * k), 5 * k) * 3.2;
        const al = lisse(1.1, 3.2, depth) * lisse(60, 30, depth) * autres * (e.alpha ?? 1);
        if (prev === null && n > 0) {
          // une coupure : on répète le dernier sommet et le premier du nouveau morceau (triangles dégénérés)
          lianeBuf.copyWithin(n * 5, (n - 1) * 5, n * 5); n++;
          lianeBuf.set([x - ty * w, y + tx * w, -1, lianeLong[i] * 3, al], n * 5); n++;
        }
        lianeBuf.set([x - ty * w, y + tx * w, -1, lianeLong[i] * 3, al], n * 5); n++;
        lianeBuf.set([x + ty * w, y - tx * w, 1, lianeLong[i] * 3, al], n * 5); n++;
        prev = i;
        if (i % 6 === 3 && nf * 5 + 5 <= feuilleBuf.length) {
          const cote = (i / 6) % 2 < 1 ? 1 : -1;
          const taille = Math.min(0.32 * f * k / depth, 46 * k);
          if (taille > 3 * k) {
            const ox = -ty * cote * taille * 0.42, oy = tx * cote * taille * 0.42;
            const ang = Math.atan2(ty, tx) + cote * 0.9;
            feuilleBuf.set([x + ox, y + oy, taille, ang, al * 0.9], nf * 5); nf++;
          }
        }
        if (n * 5 + 20 > lianeBuf.length) break;
      }
      if (n > 3) {
        const pr = pLiane; gl.useProgram(pr.p);
        gl.bindBuffer(gl.ARRAY_BUFFER, bLiane);
        gl.bufferData(gl.ARRAY_BUFFER, lianeBuf.subarray(0, n * 5), gl.DYNAMIC_DRAW);
        gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 20, 0);
        gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 1, gl.FLOAT, false, 20, 16);
        gl.uniform2fv(pr.u.uRes, res);
        gl.uniform1f(pr.u.uT, temps);
        gl.uniform4fv(pr.u.uTexte, tx);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, n);
      }
      if (nf > 0) {
        const pr = pFeuille; gl.useProgram(pr.p);
        gl.bindBuffer(gl.ARRAY_BUFFER, bFeuille);
        gl.bufferData(gl.ARRAY_BUFFER, feuilleBuf.subarray(0, nf * 5), gl.DYNAMIC_DRAW);
        gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 20, 0);
        gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 1, gl.FLOAT, false, 20, 16);
        gl.uniform2fv(pr.u.uRes, res);
        gl.uniform4fv(pr.u.uTexte, tx);
        gl.drawArrays(gl.POINTS, 0, nf);
      }
    }

    // les portails, du plus loin au plus proche
    const liste = [];
    portails.forEach((p, i) => {
      const P = posPortail(i);
      let [x, y, depth] = proj(P);
      if (depth < 0.3) return;
      let R = f * k / depth;
      // au loin, les portails naissent ; celui qu'on dépasse s'écarte et s'efface vite (il ne doit pas couvrir le texte)
      let alpha = lisse(D0 + D * 3.6, D0 + D * 2.4, depth) * lisse(1.7, 3.5, depth);
      let zoom = 1;
      if (pl && pl.i === i) {
        // la plongée : on avance dans l'axe du portail, il grandit jusqu'à dépasser l'écran ; le monde grandit moins vite
        const R0 = slot.r * k;
        R = R0 / Math.max(0.02, 1 - 0.965 * Math.pow(ep, 1.35));
        const c = lisse(0, 0.55, kp);
        x = sx + (W / 2 - sx) * c; y = sy + (Hc / 2 - sy) * c;
        zoom = Math.pow(R / R0, 0.42);
        alpha = 1;
      } else if (pl) alpha *= autres;
      alpha *= e.alpha ?? 1;
      if (alpha < 0.004) return;
      const T = R * 1.36;
      if (x + T < 0 || x - T > W || y + T < 0 || y - T > Hc) return;
      liste.push({ p, i, x, y, R, depth: pl && pl.i === i ? 0 : depth, alpha, zoom });
    });
    liste.sort((a, b) => b.depth - a.depth);
    const prox = (i) => Math.max(0, 1 - Math.abs(i - s));
    for (const v of liste) {
      const p = v.p, pr = progs[p.monde];
      p.survol += ((e.survol === v.i ? 1 : 0) - p.survol) * 0.12;
      // le sceau se trace en 1,6 s quand on arrive devant (2,4 s en mouvement réduit), et le reste
      if (Math.abs(v.i - s) < 0.35) p.trace = Math.min(1, p.trace + e.dt / (reduit ? 2.4 : 1.6));
      gl.useProgram(pr.p); attribCarre();
      gl.uniform2fv(pr.u.uRes, res);
      gl.uniform2f(pr.u.uCentre, v.x, v.y);
      gl.uniform1f(pr.u.uRayon, v.R);
      gl.uniform1f(pr.u.uTaille, Math.min(v.R * 1.36, Math.hypot(W, Hc)));
      gl.uniform1f(pr.u.uT, temps + v.i * 3.7);
      gl.uniform2f(pr.u.uRegard, e.regard.x, e.regard.y);
      gl.uniform1f(pr.u.uProx, prox(v.i));
      gl.uniform1f(pr.u.uSurvol, p.survol);
      gl.uniform1f(pr.u.uAlpha, v.alpha);
      gl.uniform1f(pr.u.uZoom, v.zoom);
      gl.uniform1f(pr.u.uBientot, p.bientot ? 1 : 0);
      gl.uniform1f(pr.u.uTrace, p.trace);
      gl.uniform1f(pr.u.uAspect, p.aspect);
      gl.uniform3fv(pr.u.uTeinte, p.rgb);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, p.t0); gl.uniform1i(pr.u.uTex0, 0);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, p.t1); gl.uniform1i(pr.u.uTex1, 1);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
  }

  // ------------------------------------------------------------------------------------ cycle de vie
  const ro = new ResizeObserver(redim);
  ro.observe(canvas);
  redim();
  const visi = () => { if (document.hidden) { cancelAnimationFrame(raf); raf = 0; tPrec = 0; } else demander(); };
  document.addEventListener('visibilitychange', visi);

  return {
    relancer: demander,
    qualite: () => ({ qualite, echelle, poussieres: nPous, cadence: Math.round(1000 / moy), traces: portails.map((p) => +p.trace.toFixed(2)) }),
    gl2,
    detruire() {
      vivant = false; cancelAnimationFrame(raf); ro.disconnect();
      document.removeEventListener('visibilitychange', visi);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}
