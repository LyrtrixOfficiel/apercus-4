// Le domaine Kazura v14 : le tonneau, la bouteille de riesling et son verre (chapitre 6, et la nuit).
//
// La bouteille est une flûte d'Alsace de 34 cm, en verre vert pâle. Elle est rendue en trois passes, après le paysage
// (voir post.js, « passes ») :
//   1. le vin : pour chaque point, on suit le rayon dans le liquide (réfraction d'entrée, sortie calculée sur le
//      cylindre du liquide, seconde réfraction) et on va chercher le paysage derrière, absorbé selon la longueur
//      traversée (loi de Beer-Lambert) : or pâle sur les bords, or profond au cœur, image renversée comme dans une
//      vraie bouteille. Le soleil derrière l'allume par l'intérieur. La surface, avec son ménisque, brille d'argent
//      vue d'en dessous (réflexion totale).
//   2. le verre : la scène (vin compris) vue à travers deux parois, réfraction et légère dispersion, teinte qui
//      fonce sur les bords, reflets de Fresnel du ciel et de deux bandes de lumière « studio », éclat du soleil.
//   3. l'étiquette : papier de coton, filets et sceau à la dorure, en relief.
// La capsule (jade métallisé, sceau doré sur le dessus, jupe striée) et le tonneau sont des matières ordinaires.
// À côté, un verre à pied avec un fond de vin : même technique, parois plus fines, ménisque bien visible.

import { GLSL_BRUIT, GLSL_LUMIERE, alea } from './commun.js';
import { hauteur } from './terrain.js';

const HB = 0.34;                                  // hauteur de la bouteille
const HT = 0.95;                                  // hauteur du tonneau
export const TONNEAU = { x: -1.6, z: 15.6, y: hauteur(-1.6, 15.6) - 0.03 };
const DESSUS = TONNEAU.y + HT - 0.022;            // le fond supérieur, un peu en retrait du jable
export const BOUTEILLE = { x: TONNEAU.x + 0.04, z: TONNEAU.z - 0.04, y: DESSUS };
export const VERRE = { x: TONNEAU.x + 0.175, z: TONNEAU.z + 0.07, y: DESSUS };
const NIVEAU = 0.655;
export const LANTERNE = { x: TONNEAU.x - 0.15, z: TONNEAU.z - 0.15, y: DESSUS };                             // le vin dans la bouteille (fraction de la hauteur)

/* Le profil de la flûte (rayon, hauteur relative), en mètres une fois multiplié. */
const PROFIL = [[0, 0], [0.0300, 0], [0.0352, 0.012], [0.0362, 0.035], [0.0364, 0.12], [0.0364, 0.33], [0.0360, 0.4], [0.0348, 0.452],
  [0.0322, 0.51], [0.0286, 0.566], [0.0244, 0.622], [0.0203, 0.678], [0.0169, 0.732], [0.0144, 0.784], [0.0129, 0.834], [0.0122, 0.88],
  [0.0120, 0.94], [0.0121, 0.964], [0.0137, 0.972], [0.0140, 0.988], [0.0128, 1.0], [0.0104, 1.0]];

/* Le verre à riesling : pied, jambe, calice en tulipe. */
const PROFIL_VERRE = [[0, 0], [0.036, 0], [0.038, 0.0015], [0.036, 0.0035], [0.012, 0.007], [0.005, 0.014], [0.0036, 0.03], [0.0034, 0.07],
  [0.0045, 0.082], [0.012, 0.09], [0.026, 0.1], [0.036, 0.115], [0.0405, 0.135], [0.0405, 0.155], [0.0378, 0.18], [0.034, 0.2], [0.0332, 0.205]];
const NIVEAU_VERRE = 0.126;

function profilLisse(THREE, pts, n, echelleY = 1) {
  return new THREE.SplineCurve(pts.map(([r, y]) => new THREE.Vector2(r, y * echelleY))).getPoints(n).map((p) => new THREE.Vector2(Math.max(0, p.x), p.y));
}
function rayonA(profil, y) {
  for (let i = 0; i < profil.length - 1; i++) {
    const a = profil[i], b = profil[i + 1];
    if (y >= a.y && y <= b.y && b.y > a.y) return a.x + (b.x - a.x) * ((y - a.y) / (b.y - a.y));
  }
  return profil[profil.length - 1].x;
}

/* ---------- la lanterne posée sur le tonneau, allumée la nuit ---------- */
const GLSL_LANTERNE = /* glsl */`
uniform vec4 uLanterne;
vec3 lanterne(vec3 p, vec3 n) {
  vec3 d = uLanterne.xyz - p; float l = length(d);
  return vec3(1.0, 0.6, 0.26) * uLanterne.w * (0.25 + 0.75 * max(dot(n, d / max(l, 1e-4)), 0.0)) / (l * l * 60.0 + 0.35);
}`;

/* ---------- GLSL partagé : l'environnement qui se reflète ---------- */
const GLSL_ENV = /* glsl */`
${GLSL_LANTERNE}
uniform mat4 projectionMatrix; uniform vec3 uCamDroite; uniform vec3 uCamAvant;
uniform vec3 uEnvHaut; uniform vec3 uEnvBas; uniform vec3 uEnvSoleil; uniform vec3 uStudio; uniform float uNuitB;
vec3 environnement(vec3 d) {
  float el = d.y;
  vec3 c = mix(uEnvBas, uEnvHaut, smoothstep(-0.02, 0.7, el));
  vec3 solE = uSolCouleur * 0.9 + uBrumeProche * 0.12;
  c = mix(c, solE, smoothstep(0.02, -0.16, el));
  float s = max(dot(d, uSoleil), 0.0);
  c += uEnvSoleil * (pow(s, 10.0) * 0.5 + pow(s, 260.0) * 7.0) * (1.0 - uNuitB);
  // deux bandes de lumière, fixées par rapport à la caméra (le reflet « publicité » sur la flûte)
  float az = atan(dot(d, uCamDroite), -dot(d, uCamAvant));
  float v1 = smoothstep(-0.5, -0.12, el) * smoothstep(0.95, 0.45, el);
  float b1 = smoothstep(0.14, 0.05, abs(az - 0.58));
  float b2 = smoothstep(0.1, 0.03, abs(az + 2.0));
  float b3 = smoothstep(0.08, 0.02, abs(az - 2.3)) * 0.5;
  c += uStudio * v1 * (b1 * 16.0 + b2 * 9.0 + b3 * 6.0);
  // la flamme de la lanterne, qui se reflète (côté gauche, un peu en arrière)
  float fl = smoothstep(0.12, 0.04, abs(az + 1.15)) * smoothstep(-0.35, -0.05, el) * smoothstep(0.25, 0.05, el);
  c += vec3(1.0, 0.6, 0.25) * uLanterne.w * fl * 5.0;
  return c;
}
vec2 versEcran(vec3 w) { vec4 c = projectionMatrix * viewMatrix * vec4(w, 1.0); return clamp(c.xy / c.w * 0.5 + 0.5, vec2(0.001), vec2(0.999)); }
`;

/* ---------- l'étiquette : deux toiles (couleur, et masque or + relief) ---------- */
const TREFLE = 'M50 46C39.5 37 34.5 23.5 50 7c15.5 16.5 10.5 30 0 39zm0-7.4c6.2-6 8.6-14.4 0-23.6-8.6 9.2-6.2 17.6 0 23.6z';
function dessinerEtiquette(L, H) {
  const coul = document.createElement('canvas'), masque = document.createElement('canvas');
  coul.width = masque.width = L; coul.height = masque.height = H;
  const g = coul.getContext('2d'), m = masque.getContext('2d');
  const k = L / 1536;
  // papier de coton : crème, fibres, bords à peine plus sombres
  g.fillStyle = '#efe6d2'; g.fillRect(0, 0, L, H);
  const h = alea(5);
  for (let i = 0; i < 2600 * k * k; i++) {
    g.strokeStyle = `rgba(${120 + h() * 60},${100 + h() * 50},${70 + h() * 40},${0.035 + h() * 0.05})`;
    g.lineWidth = 0.6 + h() * 1.2;
    const x = h() * L, y = h() * H, a = h() * Math.PI, l = (4 + h() * 14) * k;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
  const bord = g.createLinearGradient(0, 0, L, 0);
  bord.addColorStop(0, 'rgba(110,80,40,.16)'); bord.addColorStop(0.06, 'rgba(110,80,40,0)'); bord.addColorStop(0.94, 'rgba(110,80,40,0)'); bord.addColorStop(1, 'rgba(110,80,40,.16)');
  g.fillStyle = bord; g.fillRect(0, 0, L, H);
  m.fillStyle = '#000'; m.fillRect(0, 0, L, H);

  // tout ce qui est doré est peint deux fois : en or sur la couleur, en blanc (R) + relief (G) sur le masque
  const OR = '#b48a3c', ENCRE = '#2a2318';
  const deux = (f, relief = 0.55) => {
    g.save(); g.fillStyle = OR; g.strokeStyle = OR; f(g); g.restore();
    m.save(); const v = Math.round(relief * 255); m.fillStyle = `rgb(255,${v},0)`; m.strokeStyle = `rgb(255,${v},0)`; f(m); m.restore();
  };
  // double filet
  deux((c) => { c.lineWidth = 5 * k; c.strokeRect(46 * k, 46 * k, L - 92 * k, H - 92 * k); c.lineWidth = 1.8 * k; c.strokeRect(66 * k, 66 * k, L - 132 * k, H - 132 * k); }, 0.35);
  // le sceau : cercle, trois folioles, perlé
  const cx = L / 2, cy = 300 * k, R = 128 * k;
  deux((c) => {
    c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2); c.fill();
  }, 0.9);
  // le cœur du sceau : creusé, puis le trèfle en relief
  g.save(); g.fillStyle = '#efe6d2'; g.beginPath(); g.arc(cx, cy, R * 0.86, 0, Math.PI * 2); g.fill(); g.restore();
  m.save(); m.fillStyle = 'rgb(0,90,0)'; m.beginPath(); m.arc(cx, cy, R * 0.86, 0, Math.PI * 2); m.fill(); m.restore();
  deux((c) => {
    c.lineWidth = 2.4 * k; c.beginPath(); c.arc(cx, cy, R * 0.78, 0, Math.PI * 2); c.stroke();
    const p = new Path2D(TREFLE);
    for (const a of [0, 120, 240]) {
      c.save(); c.translate(cx, cy); c.rotate((a * Math.PI) / 180); c.scale(R * 0.0165, R * 0.0165); c.translate(-50, -50);
      c.fill(p, 'evenodd'); c.restore();
    }
    c.beginPath(); c.arc(cx, cy, R * 0.07, 0, Math.PI * 2); c.fill();
    for (let i = 0; i < 48; i++) { const a = (i / 48) * Math.PI * 2; c.beginPath(); c.arc(cx + Math.cos(a) * R * 0.93, cy + Math.sin(a) * R * 0.93, 2.6 * k, 0, Math.PI * 2); c.fill(); }
  }, 1);
  // les textes
  const texte = (c, t, police, x, y, esp = 0) => { c.font = police; c.letterSpacing = `${esp}px`; c.textAlign = 'center'; c.fillText(t, x + esp / 2, y); };
  g.fillStyle = ENCRE;
  texte(g, 'DOMAINE KAZURA', `500 ${40 * k}px Bricolage Grotesque, Segoe UI, sans-serif`, cx, 512 * k, 22 * k);
  deux((c) => { texte(c, 'Trois Folioles', `italic 400 ${150 * k}px Newsreader, Georgia, serif`, cx, 690 * k); }, 0.6);
  g.fillStyle = ENCRE;
  texte(g, 'RIESLING', `500 ${54 * k}px Bricolage Grotesque, Segoe UI, sans-serif`, cx, 800 * k, 30 * k);
  deux((c) => { c.fillRect(cx - 170 * k, 838 * k, 340 * k, 2.2 * k); }, 0.3);
  g.fillStyle = ENCRE;
  texte(g, 'ALSACE  ·  2024', `400 ${40 * k}px Bricolage Grotesque, Segoe UI, sans-serif`, cx, 908 * k, 14 * k);
  g.fillStyle = '#5c5240';
  texte(g, 'VIN D’ALSACE  ·  MIS EN BOUTEILLE AU DOMAINE', `400 ${25 * k}px Bricolage Grotesque, Segoe UI, sans-serif`, cx, 1080 * k, 7 * k);
  texte(g, 'VITRINE IMAGINAIRE  ·  75 CL', `400 ${25 * k}px Bricolage Grotesque, Segoe UI, sans-serif`, cx, 1124 * k, 7 * k);
  return { coul, masque };
}

/* ---------- le bump mapping (dérivées écran), pour l'étiquette et la capsule ---------- */
const GLSL_RELIEF = /* glsl */`
vec3 relief(vec3 p, vec3 n, float hc, float hx, float hy) {
  vec3 sx = dFdx(p), sy = dFdy(p);
  vec3 r1 = cross(sy, n), r2 = cross(n, sx);
  float det = dot(sx, r1);
  vec3 grad = sign(det) * ((hx - hc) * r1 + (hy - hc) * r2);
  return normalize(abs(det) * n - grad);
}`;

export function creerBouteille(THREE, U, ciel, partage, { mobile }) {
  const { tFond } = partage;
  const ENV = {
    uEnvHaut: ciel.uniformes.uHaut, uEnvBas: ciel.uniformes.uBas, uEnvSoleil: ciel.uniformes.uHalo,
    uStudio: { value: new THREE.Color(1, 0.94, 0.84) }, uNuitB: { value: 0 }, uLanterne: { value: new THREE.Vector4(LANTERNE.x, LANTERNE.y + 0.05, LANTERNE.z, 0) },
  };
  const commun = { ...U, ...ENV, tFond };
  const segs = mobile ? 72 : 128;

  /* ---------- la bouteille ---------- */
  const profil = profilLisse(THREE, PROFIL, 220, HB);
  const interieur = profil.map((p) => new THREE.Vector2(Math.max(0, p.x - 0.0028), p.y));
  const bouteille = new THREE.Group();
  bouteille.position.set(BOUTEILLE.x, BOUTEILLE.y, BOUTEILLE.z);
  const verreGeo = new THREE.LatheGeometry(profil.filter((p) => p.y <= 0.885 * HB + 1e-4), segs);

  const VS = /* glsl */`varying vec3 vPos; varying vec3 vN; varying vec3 vLoc; varying vec2 vUv;
    void main() { vLoc = position; vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vPos = w.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }`;

  // la matière du verre (bouteille et verre à pied), paramétrée par l'épaisseur des parois et la teinte
  function matiereVerre(paroi, absorption, refr) {
    return new THREE.ShaderMaterial({
      uniforms: { ...commun, uParoi: { value: paroi }, uAbs: { value: new THREE.Vector3(...absorption) }, uRefr: { value: refr } },
      vertexShader: VS,
      fragmentShader: /* glsl */`
        uniform sampler2D tFond; uniform float uParoi; uniform vec3 uAbs; uniform float uRefr;
        ${GLSL_LUMIERE}
        ${GLSL_ENV}
        varying vec3 vPos; varying vec3 vN; varying vec3 vLoc; varying vec2 vUv;
        void main() {
          vec3 v = normalize(vPos - cameraPosition);
          vec3 n = normalize(vN);
          if (dot(n, v) > 0.0) n = -n;
          float ndv = clamp(dot(n, -v), 0.0, 1.0);
          float F = 0.04 + 0.96 * pow(1.0 - ndv, 5.0);
          // réfraction : le point vu à travers le verre glisse un peu, un peu plus pour le bleu
          vec3 rf = refract(v, n, 0.67) - v;
          vec2 u0 = versEcran(vPos);
          vec2 o = versEcran(vPos + rf * uRefr) - u0;
          vec3 fond = vec3(texture2D(tFond, u0 + o).r, texture2D(tFond, u0 + o * 1.05).g, texture2D(tFond, u0 + o * 1.11).b);
          float chemin = uParoi * 2.0 / max(ndv, 0.06);
          vec3 teinte = exp(-uAbs * chemin);
          vec3 c = fond * teinte * (1.0 - F);
          c += environnement(reflect(v, n)) * F * 1.15;
          vec3 hh = normalize(uLumDir - v);
          float nh = max(dot(n, hh), 0.0);
          c += uLumCouleur * (pow(nh, 2200.0) * 30.0 + pow(nh, 160.0) * 0.35) * (1.0 - uNuitB * 0.5);
          gl_FragColor = vec4(c, 1.0);
        }`,
    });
  }
  const matVerreB = matiereVerre(0.0028, [24, 7, 27], 0.035);
  const mVerre = new THREE.Mesh(verreGeo, matVerreB);
  bouteille.add(mVerre);

  // le vin
  function matiereVin(axe, niveau) {
    return new THREE.ShaderMaterial({
      uniforms: { ...commun, uAxe: { value: new THREE.Vector2(axe.x, axe.z) }, uNiveau: { value: niveau } },
      vertexShader: VS,
      fragmentShader: /* glsl */`
        uniform sampler2D tFond; uniform vec2 uAxe; uniform float uNiveau;
        ${GLSL_LUMIERE}
        ${GLSL_ENV}
        varying vec3 vPos; varying vec3 vN; varying vec3 vLoc; varying vec2 vUv;
        const vec3 SIGMA = vec3(1.7, 5.4, 25.0);
        void main() {
          vec3 d = normalize(vPos - cameraPosition);
          vec3 n = normalize(vN);
          vec2 q = vPos.xz - uAxe;
          float R = max(length(q), 0.002);
          vec3 d1 = refract(d, n, 0.75);
          // la sortie : l'autre côté du cylindre de vin
          vec2 dd = d1.xz;
          float a = max(dot(dd, dd), 1e-5), b = 2.0 * dot(q, dd), cc = dot(q, q) - R * R;
          float t = max((-b + sqrt(max(b * b - 4.0 * a * cc, 0.0))) / (2.0 * a), 0.0);
          vec3 E = vPos + d1 * t;
          float corde = t;
          vec3 fondCoul;
          if (E.y > uNiveau && d1.y > 0.0) {
            // le rayon remonte et touche la surface par en dessous : réflexion totale, argentée
            float tt = (uNiveau - vPos.y) / d1.y;
            corde = max(tt, 0.0) * 1.6;
            fondCoul = environnement(reflect(d1, vec3(0.0, -1.0, 0.0))) * 0.85;
          } else {
            vec3 n2 = normalize(vec3(E.x - uAxe.x, 0.0, E.z - uAxe.y));
            vec3 d2 = refract(d1, -n2, 1.33);
            if (dot(d2, d2) < 0.01) d2 = reflect(d1, -n2);
            fondCoul = texture2D(tFond, versEcran(E + d2 * 2.2)).rgb;
          }
          vec3 absorbe = exp(-SIGMA * corde);
          vec3 c = fondCoul * absorbe * vec3(1.0, 0.97, 0.86);
          // le soleil derrière : le vin s'allume
          float avant = pow(max(dot(d1, uLumDir), 0.0), 24.0);
          c += uLumCouleur * vec3(1.0, 0.78, 0.3) * avant * (1.0 - absorbe.b) * 0.32;
          // un peu de lumière diffusée dans le liquide
          c += ambiant(n) * vec3(0.85, 0.62, 0.2) * 0.08 * (1.0 - absorbe.b);
          c += lanterne(vPos, -d) * vec3(1.0, 0.8, 0.4) * (1.0 - absorbe.b) * 0.6;
          gl_FragColor = vec4(c, 1.0);
        }`,
    });
  }
  function matiereSurface(niveau) {
    return new THREE.ShaderMaterial({
      uniforms: { ...commun, uNiveau: { value: niveau } },
      side: THREE.DoubleSide,
      vertexShader: VS,
      fragmentShader: /* glsl */`
        uniform sampler2D tFond; uniform float uNiveau;
        ${GLSL_LUMIERE}
        ${GLSL_ENV}
        varying vec3 vPos; varying vec3 vN; varying vec3 vLoc; varying vec2 vUv;
        void main() {
          vec3 d = normalize(vPos - cameraPosition);
          vec3 n = normalize(vN);
          vec3 c;
          if (cameraPosition.y < vPos.y) {
            // vue d'en dessous, à travers le vin : un miroir d'argent doré
            if (dot(n, d) > 0.0) n = -n;
            c = environnement(reflect(d, n)) * vec3(1.0, 0.85, 0.5) * 0.9;
            c += uLumCouleur * vec3(1.0, 0.8, 0.4) * pow(max(dot(reflect(d, n), uLumDir), 0.0), 30.0) * 0.6;
          } else {
            if (dot(n, d) > 0.0) n = -n;
            float F = 0.02 + 0.98 * pow(1.0 - clamp(dot(n, -d), 0.0, 1.0), 5.0);
            vec3 fond = texture2D(tFond, versEcran(vPos + refract(d, n, 0.75) * 0.05)).rgb * vec3(0.85, 0.62, 0.2);
            c = mix(fond, environnement(reflect(d, n)), F);
          }
          // le ménisque : un liseré clair contre la paroi
          float men = smoothstep(0.6, 1.0, vUv.x);
          c += uEnvBas * men * 0.5 + uLumCouleur * men * 0.08;
          gl_FragColor = vec4(c, 1.0);
        }`,
    });
  }
  const yVin = NIVEAU * HB;
  const profilVin = interieur.filter((p) => p.y <= yVin && p.y >= 0.004).map((p) => new THREE.Vector2(p.x, p.y));
  profilVin.unshift(new THREE.Vector2(0.0001, 0.004));
  const rVin = rayonA(interieur, yVin);
  profilVin.push(new THREE.Vector2(rVin, yVin));
  const vinB = new THREE.Mesh(new THREE.LatheGeometry(profilVin, segs), matiereVin(BOUTEILLE, BOUTEILLE.y + yVin));
  const menisque = (r, y0, hm) => new THREE.LatheGeometry([new THREE.Vector2(0.0001, y0), new THREE.Vector2(r * 0.8, y0), new THREE.Vector2(r * 0.94, y0 + hm * 0.25), new THREE.Vector2(r * 0.985, y0 + hm * 0.7), new THREE.Vector2(r, y0 + hm)], segs);
  const surfB = new THREE.Mesh(menisque(rVin, yVin, 0.0022), matiereSurface(BOUTEILLE.y + yVin));
  const groupeVinB = new THREE.Group(); groupeVinB.position.copy(bouteille.position); groupeVinB.add(vinB, surfB);

  /* ---------- la capsule ---------- */
  const yCap = 0.885 * HB;
  const profilCap = profil.filter((p) => p.y >= yCap - 1e-4).map((p) => new THREE.Vector2(p.x + 0.0007 + 0.0006 * Math.max(0, 1 - (p.y - yCap) / 0.012), p.y));
  profilCap.unshift(new THREE.Vector2(rayonA(profil, yCap) + 0.0014, yCap - 0.0004));
  profilCap.push(new THREE.Vector2(0.0001, HB + 0.0004));
  const capsule = new THREE.Mesh(new THREE.LatheGeometry(profilCap, segs), new THREE.ShaderMaterial({
    uniforms: { ...commun, uBas: { value: yCap }, uHaut: { value: HB } },
    vertexShader: VS,
    fragmentShader: /* glsl */`
      uniform float uBas; uniform float uHaut;
      ${GLSL_BRUIT}
      ${GLSL_LUMIERE}
      ${GLSL_ENV}
      ${GLSL_RELIEF}
      varying vec3 vPos; varying vec3 vN; varying vec3 vLoc; varying vec2 vUv;
      float sceau(vec2 p) {
        float r = length(p), a = atan(p.y, p.x);
        float anneau = smoothstep(0.0012, 0.0006, abs(r - 0.0088));
        float f = 0.0;
        for (int i = 0; i < 3; i++) {
          float ai = float(i) * 2.0944 + 1.5708;
          vec2 dirv = vec2(cos(ai), sin(ai));
          vec2 q = vec2(dot(p, dirv), dot(p, vec2(-dirv.y, dirv.x)));
          float lg = 0.0068, lr = 0.0026 * sin(clamp(q.x / lg, 0.0, 1.0) * 3.1416);
          f = max(f, smoothstep(0.0004, 0.0, abs(q.y) - lr) * step(0.0005, q.x) * step(q.x, lg));
        }
        return max(anneau, f);
      }
      void main() {
        vec3 v = normalize(vPos - cameraPosition);
        vec3 n = normalize(vN);
        float y = vLoc.y;
        float dessus = step(uHaut - 0.0006, y);
        float h = 0.0, hx = 0.0, hy = 0.0;
        float doree = 0.0;
        if (dessus > 0.5) {
          vec2 p = vLoc.xz;
          h = sceau(p); doree = h;
          vec2 px = dFdx(p), py = dFdy(p);
          hx = sceau(p + px); hy = sceau(p + py);
          n = relief(vPos, n, h * 0.0004, hx * 0.0004, hy * 0.0004);
        } else {
          // la jupe sertie : de fines stries verticales en bas, un jonc doré
          float a = atan(vLoc.z, vLoc.x);
          float jupe = 1.0 - smoothstep(uBas + 0.008, uBas + 0.014, y);
          float st = sin(a * 160.0) * 0.5 + 0.5;
          vec3 t = normalize(vec3(-sin(a), 0.0, cos(a)));
          n = normalize(n + t * (st - 0.5) * 0.35 * jupe);
          doree = smoothstep(0.0006, 0.0, abs(y - (uBas + 0.017)) - 0.0011);
        }
        vec3 r = reflect(v, n);
        vec3 env = environnement(r);
        vec3 jade = vec3(0.02, 0.2, 0.13);
        vec3 or = vec3(0.95, 0.72, 0.36);
        vec3 metal = mix(jade, or, doree);
        float F = mix(0.5, 0.85, doree);
        vec3 c = env * metal * (F + (1.0 - F) * pow(1.0 - max(dot(n, -v), 0.0), 5.0)) * 1.6;
        c += eclairer(metal * 0.35, n, v, 1.0, 0.0, 0.2) + metal * lanterne(vPos, n) * 0.8;
        vec3 hh = normalize(uLumDir - v);
        c += uLumCouleur * metal * (pow(max(dot(n, hh), 0.0), 90.0) * 2.0 + pow(max(dot(n, hh), 0.0), 12.0) * 0.12);
        gl_FragColor = vec4(c, 1.0);
      }`,
  }));
  bouteille.add(capsule);

  /* ---------- l'étiquette ---------- */
  const yE0 = 0.07 * HB, yE1 = 0.315 * HB, arc = Math.PI * 0.84;
  const profilE = profil.filter((p) => p.y >= yE0 && p.y <= yE1).map((p) => new THREE.Vector2(p.x + 0.0005, p.y));
  const geoE = new THREE.LatheGeometry(profilE, mobile ? 64 : 120, -arc / 2, arc);
  // LatheGeometry : u suit l'angle (de gauche à droite vu de +z), v la hauteur ; l'étiquette est centrée sur +z
  const { coul, masque } = dessinerEtiquette(mobile ? 1024 : 1536, Math.round((mobile ? 1024 : 1536) * 0.81));
  const tC = new THREE.CanvasTexture(coul); tC.colorSpace = THREE.SRGBColorSpace; tC.anisotropy = 8;
  const tM = new THREE.CanvasTexture(masque); tM.anisotropy = 8;
  const matE = new THREE.ShaderMaterial({
    uniforms: { ...commun, tCoul: { value: tC }, tMasque: { value: tM } },
    vertexShader: VS,
    fragmentShader: /* glsl */`
      uniform sampler2D tCoul; uniform sampler2D tMasque;
      ${GLSL_BRUIT}
      ${GLSL_LUMIERE}
      ${GLSL_ENV}
      ${GLSL_RELIEF}
      varying vec3 vPos; varying vec3 vN; varying vec3 vLoc; varying vec2 vUv;
      void main() {
        vec2 uv = vUv;
        vec3 alb = texture2D(tCoul, uv).rgb;
        vec4 m = texture2D(tMasque, uv);
        vec2 px = dFdx(uv), py = dFdy(uv);
        float k = 0.00035;
        vec3 n = normalize(vN);
        vec3 v = normalize(vPos - cameraPosition);
        n = relief(vPos, n, m.g * k, texture2D(tMasque, uv + px).g * k, texture2D(tMasque, uv + py).g * k);
        float or = smoothstep(0.3, 0.7, m.r);
        // le papier, avec une lumière d'appoint venue de la caméra (comme en studio)
        vec3 c = eclairer(alb, n, v, 1.0, 0.15, 0.45);
        c += ambiant(n) * alb * 0.12;
        c += alb * uStudio * 0.42 * pow(max(dot(n, -v), 0.0), 1.5);
        c += alb * lanterne(vPos, n);
        // la dorure à chaud : métal qui reflète le ciel, éclat du soleil
        vec3 orC = vec3(1.0, 0.76, 0.38);
        vec3 r = reflect(v, n);
        vec3 met = environnement(r) * orC * 1.25 + eclairer(orC * 0.25, n, v, 1.0, 0.0, 0.2);
        vec3 hh = normalize(uLumDir - v);
        met += uLumCouleur * orC * (pow(max(dot(n, hh), 0.0), 70.0) * 2.5 + pow(max(dot(n, hh), 0.0), 10.0) * 0.2);
        c = mix(c, met, or);
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  const etiquette = new THREE.Mesh(geoE, matE);
  const groupeDessus = new THREE.Group(); groupeDessus.position.copy(bouteille.position);
  const etiquettePivot = new THREE.Group(); etiquettePivot.add(etiquette); groupeDessus.add(etiquettePivot);

  /* ---------- le verre à pied ---------- */
  const profilV = profilLisse(THREE, PROFIL_VERRE, 200, 1);
  const matVerreP = matiereVerre(0.0011, [4, 1.6, 4.5], 0.02); matVerreP.side = THREE.DoubleSide;
  const verrePied = new THREE.Mesh(new THREE.LatheGeometry(profilV, segs), matVerreP);
  verrePied.position.set(VERRE.x, VERRE.y, VERRE.z);
  const interieurV = profilV.filter((p) => p.y >= 0.09).map((p) => new THREE.Vector2(Math.max(0, p.x - 0.0012), p.y));
  const profilVinV = interieurV.filter((p) => p.y <= NIVEAU_VERRE);
  profilVinV.unshift(new THREE.Vector2(0.0001, 0.0915));
  const rVinV = rayonA(interieurV, NIVEAU_VERRE);
  profilVinV.push(new THREE.Vector2(rVinV, NIVEAU_VERRE));
  const vinV = new THREE.Mesh(new THREE.LatheGeometry(profilVinV, segs), matiereVin(VERRE, VERRE.y + NIVEAU_VERRE));
  const surfV = new THREE.Mesh(menisque(rVinV, NIVEAU_VERRE, 0.0028), matiereSurface(VERRE.y + NIVEAU_VERRE));
  const groupeVinV = new THREE.Group(); groupeVinV.position.set(VERRE.x, VERRE.y, VERRE.z); groupeVinV.add(vinV, surfV);

  /* ---------- le tonneau ---------- */
  const tonneau = new THREE.Group();
  tonneau.position.set(TONNEAU.x, TONNEAU.y, TONNEAU.z);
  const RE = 0.29, RB = 0.345;
  const cercles = [[0.06, 0.11], [0.25, 0.29], [0.71, 0.75], [0.89, 0.94]];
  const profilT = [];
  for (let i = 0; i <= 80; i++) {
    const t = i / 80, y = t * HT;
    let r = RE + (RB - RE) * (1 - Math.pow(2 * t - 1, 2));
    for (const [a, b] of cercles) if (t >= a && t <= b) r += 0.0045 * Math.min(1, Math.min(t - a, b - t) / 0.004);
    profilT.push(new THREE.Vector2(r, y));
  }
  profilT.push(new THREE.Vector2(RE - 0.02, HT), new THREE.Vector2(RE - 0.02, HT - 0.022));
  const matT = new THREE.ShaderMaterial({
    uniforms: { ...commun, uObjets: { value: [new THREE.Vector4(BOUTEILLE.x, BOUTEILLE.z, 0.0364, HB), new THREE.Vector4(VERRE.x, VERRE.z, 0.038, 0.205)] } },
    vertexShader: VS,
    fragmentShader: /* glsl */`
      uniform vec4 uObjets[2];
      ${GLSL_BRUIT}
      ${GLSL_LUMIERE}
      ${GLSL_LANTERNE}
      varying vec3 vPos; varying vec3 vN; varying vec3 vLoc; varying vec2 vUv;
      void main() {
        vec3 v = normalize(vPos - cameraPosition);
        vec3 n = normalize(vN);
        float y = vLoc.y / ${HT.toFixed(3)};
        float a = atan(vLoc.z, vLoc.x);
        float s = (a / 6.2832 + 0.5) * 30.0;
        float id = floor(s), f = fract(s);
        // les douelles : bois de chêne, joints sombres, fil du bois
        float joint = 1.0 - smoothstep(0.0, 0.03, f) * smoothstep(1.0, 0.97, f);
        float fil = fbm(vec2(f * 3.0 + id * 7.3, y * 2.2)) * 0.6 + bruit(vec2(f * 40.0 + id * 3.0, y * 9.0)) * 0.4;
        vec3 bois = vec3(0.46, 0.28, 0.15) * mix(0.72, 1.12, h21(vec2(id, 1.0))) * mix(0.78, 1.15, fil);
        bois = mix(bois, vec3(0.3, 0.17, 0.09), smoothstep(0.55, 0.85, bruit(vec2(f * 2.0 + id, y * 30.0))) * 0.35);
        // le bois brûlé et taché du bas
        bois *= mix(0.75, 1.0, smoothstep(0.0, 0.15, y));
        vec3 t = normalize(vec3(-sin(a), 0.0, cos(a)));
        n = normalize(n + t * (f - 0.5) * 0.18);
        // les cercles de fer
        float fer = 0.0;
        ${cercles.map(([x0, x1]) => `fer = max(fer, smoothstep(${(x0 - 0.002).toFixed(3)}, ${(x0 + 0.002).toFixed(3)}, y) * (1.0 - smoothstep(${(x1 - 0.002).toFixed(3)}, ${(x1 + 0.002).toFixed(3)}, y)));`).join('\n        ')}
        vec3 rouille = mix(vec3(0.05, 0.045, 0.042), vec3(0.2, 0.09, 0.04), smoothstep(0.5, 0.8, fbm(vec2(a * 6.0, y * 40.0))) * 0.6);
        vec3 alb = mix(bois * (1.0 - joint * 0.75), rouille, fer);
        // le dessus du jable, vu de haut
        if (vLoc.y > ${(HT - 0.0005).toFixed(4)}) alb = vec3(0.3, 0.18, 0.1) * mix(0.8, 1.1, fil);
        vec3 c = eclairer(alb, n, v, 1.0, 0.0, 0.25) + alb * lanterne(vPos, n);
        vec3 hh = normalize(uLumDir - v);
        c += uLumCouleur * pow(max(dot(n, hh), 0.0), mix(18.0, 60.0, fer)) * mix(0.03, 0.35, fer);
        gl_FragColor = vec4(brumer(c, vPos), 1.0);
      }`,
  });
  tonneau.add(new THREE.Mesh(new THREE.LatheGeometry(profilT, mobile ? 64 : 96), matT));
  // le fond du dessus : planches, fil du bois, une auréole de vin, l'ombre de la bouteille et sa lumière dorée
  const fondDessus = new THREE.Mesh(new THREE.CircleGeometry(RE - 0.019, 64).rotateX(-Math.PI / 2).translate(0, HT - 0.022, 0), new THREE.ShaderMaterial({
    uniforms: matT.uniforms,
    vertexShader: VS,
    fragmentShader: /* glsl */`
      uniform vec4 uObjets[2];
      ${GLSL_BRUIT}
      ${GLSL_LUMIERE}
      ${GLSL_LANTERNE}
      varying vec3 vPos; varying vec3 vN; varying vec3 vLoc; varying vec2 vUv;
      void main() {
        vec3 v = normalize(vPos - cameraPosition);
        vec2 p = vLoc.xz;
        float pl = p.x / 0.105 + 0.5;
        float id = floor(pl), f = fract(pl);
        float joint = 1.0 - smoothstep(0.0, 0.02, f) * smoothstep(1.0, 0.98, f);
        float fil = fbm(vec2(p.x * 9.0 + id * 5.0, p.y * 1.4)) * 0.55 + bruit(vec2(p.x * 160.0 + id * 9.0, p.y * 6.0)) * 0.45;
        vec3 alb = vec3(0.5, 0.33, 0.19) * mix(0.75, 1.1, h21(vec2(id, 4.0))) * mix(0.8, 1.15, fil) * (1.0 - joint * 0.7);
        // une auréole laissée par un verre, il y a longtemps
        float au = smoothstep(0.004, 0.0, abs(length(p - vec2(-0.12, 0.09)) - 0.034)) * 0.5;
        alb = mix(alb, vec3(0.32, 0.12, 0.08), au * 0.6);
        vec3 c = eclairer(alb, vec3(0.0, 1.0, 0.0), v, 1.0, 0.0, 0.3);
        // ombres portées des objets, et la lumière que le vin laisse passer (caustique dorée)
        vec2 sd = -normalize(uLumDir.xz + 1e-4);
        float tanEl = max(uLumDir.y, 0.08) / max(length(uLumDir.xz), 0.05);
        float ombre = 0.0, caus = 0.0;
        for (int i = 0; i < 2; i++) {
          vec4 o = uObjets[i];
          vec2 w = vPos.xz - o.xy;
          float along = dot(w, sd), perp = abs(w.x * sd.y - w.y * sd.x);
          float Lg = min(o.w / tanEl, 0.9);
          float larg = o.z * mix(1.0, 0.45, clamp(along / Lg, 0.0, 1.0)) * (i == 1 ? mix(1.0, 0.25, smoothstep(0.1, 0.5, along / Lg)) : 1.0);
          float dedans = smoothstep(larg + 0.006, larg - 0.004, perp) * smoothstep(-0.01, 0.01, along) * (1.0 - smoothstep(Lg * 0.95, Lg, along));
          dedans = max(dedans, smoothstep(o.z + 0.012, o.z - 0.002, length(w)) * 0.6);
          ombre = max(ombre, dedans * mix(0.85, 0.35, clamp(along / Lg, 0.0, 1.0)));
          float zone = smoothstep(0.1, 0.25, along / Lg) * (1.0 - smoothstep(0.45, 0.75, along / Lg));
          caus += zone * smoothstep(larg * 0.55, larg * 0.1, perp) * (0.6 + 0.4 * bruit(w * 300.0));
        }
        float jour = 1.0 - uNuit;
        c *= 1.0 - ombre * 0.8 * jour;
        c += uLumCouleur * vec3(1.0, 0.7, 0.2) * caus * 0.55 * jour * alb * 2.0;
        c += alb * lanterne(vPos, vec3(0.0, 1.0, 0.0)) * 1.4;
        gl_FragColor = vec4(brumer(c, vPos), 1.0);
      }`,
  }));
  tonneau.add(fondDessus);

  /* ---------- la lanterne : un photophore de verre et sa bougie ---------- */
  const lant = new THREE.Group(); lant.position.set(LANTERNE.x, LANTERNE.y, LANTERNE.z);
  const matPhoto = new THREE.ShaderMaterial({
    uniforms: commun,
    vertexShader: VS,
    fragmentShader: /* glsl */`
      ${GLSL_LUMIERE}
      ${GLSL_ENV}
      varying vec3 vPos; varying vec3 vN; varying vec3 vLoc; varying vec2 vUv;
      void main() {
        vec3 v = normalize(vPos - cameraPosition); vec3 n = normalize(vN);
        float ndv = abs(dot(n, v));
        // verre dépoli ambré : le jour, un petit photophore ; la nuit, une bougie qui l'allume de l'intérieur
        float h = vLoc.y / 0.085;
        vec3 c = eclairer(vec3(0.62, 0.48, 0.3), n, v, 1.0, 0.6, 0.5) * (1.0 - 0.6 * uNuitB);
        c += environnement(reflect(v, n)) * 0.04 * (1.0 + 6.0 * pow(1.0 - ndv, 4.0));
        c += vec3(1.0, 0.55, 0.2) * uLanterne.w * (0.35 + 1.4 * exp(-pow((h - 0.35) * 3.0, 2.0))) * (0.5 + 0.5 * ndv);
        c *= mix(0.75, 1.0, smoothstep(0.0, 0.25, h));
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  lant.add(new THREE.Mesh(new THREE.CylinderGeometry(0.029, 0.026, 0.085, 32, 1, false).translate(0, 0.0425, 0), matPhoto));
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShaderMaterial({
    uniforms: commun, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */`varying vec2 vQ; void main() { vQ = position.xy * 2.0; vec4 mv = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0); mv.xy += position.xy * 0.2; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: /* glsl */`
      uniform vec4 uLanterne; varying vec2 vQ;
      void main() { float r = dot(vQ, vQ); float i = exp(-r * 6.0) * 0.45 + exp(-r * 40.0) * 1.6; gl_FragColor = vec4(vec3(1.0, 0.58, 0.24) * i * uLanterne.w, 1.0); }`,
  }));
  halo.position.y = 0.045; halo.renderOrder = 6;
  lant.add(halo);

  /* ---------- l'organisation en passes ---------- */
  const sceneVin = new THREE.Scene(); sceneVin.add(groupeVinB, groupeVinV);
  const sceneVerre = new THREE.Scene(); sceneVerre.add(bouteille, verrePied);
  const sceneDessus = new THREE.Scene(); sceneDessus.add(groupeDessus);
  // la capsule va avec le paysage (opaque, au-dessus du vin) : on la sort du groupe du verre
  bouteille.remove(capsule);
  const capsulePivot = new THREE.Group(); capsulePivot.position.copy(bouteille.position); capsulePivot.add(capsule);
  const opaque = new THREE.Group(); opaque.add(tonneau, capsulePivot, lant);
  for (const s of [sceneVin, sceneVerre, sceneDessus, opaque]) s.traverse((o) => { o.frustumCulled = false; });

  /** Tourne la bouteille (l'étiquette) ; le verre et le vin sont de révolution, seuls l'étiquette et la capsule tournent. */
  function tourner(angle) { etiquettePivot.rotation.y = angle; capsulePivot.rotation.y = angle; }
  function regler(P, nuit, t = 0) {
    ENV.uNuitB.value = nuit;
    const lueur = Math.min(1, Math.max(0, (P.h - 0.5) / 0.25));
    ENV.uLanterne.value.w = lueur * lueur * (3 - 2 * lueur) * (0.9 + 0.06 * Math.sin(t * 7.3) + 0.04 * Math.sin(t * 13.1 + 1.7));
    ENV.uStudio.value.setRGB(1, 0.93, 0.82).multiplyScalar(0.85 * (1 - nuit) + 0.12 * nuit);
    void P;
  }
  const centre = [BOUTEILLE.x, BOUTEILLE.y + 0.17, BOUTEILLE.z];
  const ancres = {
    capsule: [BOUTEILLE.x, BOUTEILLE.y + HB * 0.95, BOUTEILLE.z],
    etiquette: [BOUTEILLE.x, BOUTEILLE.y + HB * 0.3, BOUTEILLE.z],
    vin: [VERRE.x, VERRE.y + 0.115, VERRE.z],
    bouteille: centre,
  };
  return {
    opaque, passes: [{ copie: true, scene: sceneVin }, { copie: true, scene: sceneVerre }, { copie: false, scene: sceneDessus }],
    tourner, regler, centre, ancres,
    detruire() { tC.dispose(); tM.dispose(); for (const s of [sceneVin, sceneVerre, sceneDessus]) s.traverse((o) => { o.geometry?.dispose?.(); o.material?.dispose?.(); }); },
  };
}
