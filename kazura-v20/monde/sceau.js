/* Kazura v13, la Scène (reprise de la v12) : le sceau (kamon de Kazura) en jade, fidèle à assets/logo/sceau-jade.svg.
   Le SVG (viewBox 100) : un anneau r 48 / 42, trois folioles évidées (une goutte de feuille avec
   sa goutte intérieure, tournée de 0, 120 et 240 degrés) et un cœur r 4,6. Ici chaque forme est
   reprise point pour point (mêmes courbes de Bézier), extrudée avec un biseau poli.
   Les faces sont en jade, les flancs et biseaux portent le liseré de lumière violette. Chaque partie apparaît par un front de matière (anneau : en tournant dans le
   sens de la vrille ; folioles : de la base vers la pointe ; cœur : du centre vers le bord). */
import { greffer, GLSL_BRUIT } from './commun.js';
import { GLSL_MASQUE, GLSL_SALLE, GLSL_IRIS, GLSL_TEXBRUIT } from './glsl.js';
import { RAYON_SCEAU } from './liane.js';

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

function extruder(THREE, forme, mobile) {
  const g = new THREE.ExtrudeGeometry(forme, {
    depth: 0.02, curveSegments: mobile ? 44 : 80,
    bevelEnabled: true, bevelThickness: 0.036, bevelSize: 0.04, bevelOffset: -0.04, bevelSegments: mobile ? 5 : 9,
  });
  g.translate(0, 0, -0.01);
  normalesAdoucies(THREE, g, Math.PI / 2.2);
  return g;
}

/* ExtrudeGeometry donne des normales de facettes : on les adoucit là où l'angle est faible (le biseau
   devient poli) et on garde les arêtes vives au-delà. */
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

/* mode : 0 anneau (angle), 1 foliole (le long de l'axe local y), 2 cœur (rayon).
   La même matière porte toutes les peaux du sceau, réglées par uniformes (aucune recompilation) :
   jade nuageux à liseré violet (l'ouverture, intacte), verre irisé qui réfracte la salle de dalles
   en trois longueurs d'onde (uVerre), givre (uGivre), or (uOr). Dans le monde clair, le sceau
   s'efface net sous l'horizon : son contour fin prend le relais. */
function materiauJade(THREE, { mobile, mode, U }) {
  const m = new THREE.MeshPhysicalMaterial({
    color: 0x1a9e70,
    roughness: 0.07, metalness: 0,
    clearcoat: 1, clearcoatRoughness: 0.05, specularIntensity: 1,
    envMapIntensity: 2.6,
  });
  const u = {
    uApp: { value: 0 }, uMode: { value: mode }, uAngle0: { value: -Math.PI / 3 },
    uSeve: { value: new THREE.Color(0xa855f7) }, uLisere: { value: 1.5 }, uEclat: { value: 0 },
    uJade: { value: new THREE.Color(0x10b981) }, uLueur: { value: 0.12 }, uTemps: { value: 0 },
    uLumDir: { value: new THREE.Vector3(0, 0, 1) }, uLumCouleur: { value: new THREE.Color(1, 1, 1) },
    uVerre: { value: 0 }, uGivre: { value: 0 }, uOr: { value: 0 },
    ...U,
  };
  return greffer(m, {
    cle: 'jade-v13' + (mobile ? 'm' : ''), uniforms: u,
    declVert: 'varying vec3 vLoc; varying vec3 vMonde;',
    vert: [['#include <begin_vertex>', '#include <begin_vertex>\n vLoc = position;'],
      ['#include <worldpos_vertex>', '#include <worldpos_vertex>\n vMonde = (modelMatrix * vec4(transformed, 1.0)).xyz;']],
    declFrag: (mobile ? '#define KZ_MOBILE\n' : '') + GLSL_TEXBRUIT + GLSL_MASQUE + GLSL_SALLE + GLSL_IRIS + `
      uniform float uApp; uniform float uMode; uniform float uAngle0; uniform vec3 uSeve; uniform float uLisere;
      uniform float uEclat; uniform vec3 uJade; uniform float uLueur; uniform float uTemps; uniform vec3 uLumDir; uniform vec3 uLumCouleur;
      uniform float uVerre; uniform float uGivre; uniform float uOr;
      varying vec3 vLoc; varying vec3 vMonde;`,
    frag: [
      ['#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
        if (kzClair(gl_FragCoord.xy) > 0.5) discard;`],
      ['#include <color_fragment>', `#include <color_fragment>
        float kzProg;
        if (uMode < 0.5) { float a = atan(vLoc.y, vLoc.x); kzProg = fract((a - uAngle0) / 6.2831853); }
        else if (uMode < 1.5) { kzProg = clamp((vLoc.y - 0.1) / 1.02, 0.0, 1.0); }
        else { kzProg = length(vLoc.xy) / 0.13; }
        float kzNb = kzTB(vLoc.xy * 1.625).b;
        float kzM = kzProg * 0.9 + kzNb * 0.1;
        float kzSeuil = uApp * 1.1;
        if (kzM > kzSeuil) discard;
        float kzFront = 1.0 - smoothstep(0.0, 0.08, kzSeuil - kzM);
        float kzVeine = kzTB(vLoc.xy * 1.375 + vec2(uMode * 0.37, vLoc.z * 0.5)).r;
        float kzNuage = smoothstep(0.25, 0.85, kzVeine);
        float kzFil = 1.0 - smoothstep(0.0, 0.03, abs(kzTB(vLoc.xy * 2.25 + 0.7).g - 0.5));
        vec3 kzJ = mix(vec3(0.02, 0.24, 0.15), vec3(0.07, 0.46, 0.30), kzNuage) + vec3(0.30, 0.50, 0.40) * kzFil * 0.12;
        vec3 kzO = vec3(1.0, 0.74, 0.36) * (0.72 + 0.4 * kzVeine) + vec3(0.25, 0.2, 0.1) * kzFil;
        diffuseColor.rgb = mix(kzJ, kzO, uOr) * (1.0 - 0.94 * uVerre);`],
      ['#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        vec3 kzVv = normalize(vViewPosition);
        float kzRespire = 0.85 + 0.15 * sin(uTemps * 1.3);
        float kzRim = pow(1.0 - clamp(abs(dot(normal, kzVv)), 0.0, 1.0), 3.0);
        float kzRim2 = pow(1.0 - clamp(abs(dot(normal, kzVv)), 0.0, 1.0), 2.2);
        float kzPeau = 1.0 - 0.75 * uVerre;
        totalEmissiveRadiance += uSeve * kzPeau * (uLisere * kzRespire * (kzRim * 2.6 + kzRim2 * 0.6) * (1.0 + 2.0 * uEclat) + uEclat * 0.12);
        totalEmissiveRadiance += uSeve * kzFront * 6.0 * (1.0 - step(0.999, uApp));
        totalEmissiveRadiance += vec3(1.0, 0.68, 0.28) * uOr * (0.05 + 0.9 * kzRim2 + 0.1 * kzVeine);
        float kzCoeurJ = pow(clamp(dot(normal, kzVv), 0.0, 1.0), 0.8);
        totalEmissiveRadiance += uJade * uLueur * (1.0 - uOr) * (1.0 - uVerre) * (0.45 + 0.6 * kzNuage) * (0.2 + 0.8 * kzCoeurJ) * (1.0 + 1.2 * uEclat);
        totalEmissiveRadiance += mix(uJade, vec3(1.0, 0.75, 0.4), uOr) * uLumCouleur * clamp(-dot(normal, uLumDir) * 0.6 + 0.4, 0.0, 1.0) * 0.18 * (0.6 + 0.6 * kzVeine) * (1.0 - uVerre);
        if (uVerre > 0.001) {
          vec3 kzN = inverseTransformDirection(normal, viewMatrix);
          vec3 kzD = normalize(vMonde - cameraPosition);
          if (uGivre > 0.001) {
            vec3 kzG = kzTB((vMonde.xy + vMonde.z * 0.7) * 2.1).bar - 0.5;
            kzN = normalize(kzN + kzG * 0.55 * uGivre);
          }
          float kzF = pow(1.0 - clamp(abs(dot(kzN, -kzD)), 0.0, 1.0), 2.0);
          #ifdef KZ_MOBILE
            vec3 kzT = kzSalleVue(vMonde, refract(kzD, kzN, 0.78));
            vec3 kzT2 = kzSalleVue(vMonde, refract(kzD, kzN, 0.70));
            vec3 kzVerre = vec3(kzT.r, mix(kzT.g, kzT2.g, 0.5), kzT2.b);
          #else
            vec3 kzVerre = vec3(kzSalleVue(vMonde, refract(kzD, kzN, 0.80)).r,
                                kzSalleVue(vMonde, refract(kzD, kzN, 0.75)).g,
                                kzSalleVue(vMonde, refract(kzD, kzN, 0.70)).b);
          #endif
          vec3 kzRefl = kzSalleVue(vMonde, reflect(kzD, kzN));
          vec3 kzIr = kzIris(kzF * 1.6 + dot(kzN, vec3(0.4, 0.7, 0.2)) * 0.8 + uTemps * 0.04);
          vec3 kzVc = kzVerre * (1.35 + 0.6 * kzF) * mix(vec3(1.0), kzTeinte * 1.2 + 0.55, 0.35)
                    + kzRefl * kzF * 1.4
                    + kzIr * (0.08 + 0.9 * kzF) * 0.5
                    + vec3(0.85, 0.9, 1.0) * uGivre * (0.08 + 0.25 * kzTB(vMonde.xy * 1.9).a) * (0.4 + kzF);
          totalEmissiveRadiance += kzVc * uVerre;
        }`],
    ],
  });
}

export function construireSceau(THREE, { mobile, U }) {
  const groupe = new THREE.Group();
  const parties = [];
  const ajouter = (forme, mode, rot = 0) => {
    const g = extruder(THREE, forme, mobile);
    const face = materiauJade(THREE, { mobile, mode, U });
    const bord = face;
    g.clearGroups();
    const mesh = new THREE.Mesh(g, face);
    mesh.rotation.z = rot;
    groupe.add(mesh);
    const p = { mesh, face, bord, mode };
    parties.push(p);
    return p;
  };
  const anneau = ajouter(formeAnneau(THREE), 0);
  const folioles = [0, 1, 2].map((i) => ajouter(formeFoliole(THREE), 1, i * Math.PI * 2 / 3));
  const coeur = ajouter(formeCoeur(THREE), 2);
  const regler = (partie, nom, v) => { partie.face.userData.uniforms[nom].value = v; };
  const OR = new THREE.Color(0xf2c87a), JADE = new THREE.Color(0x1a9e70);
  return {
    groupe, parties, anneau, folioles, coeur,
    apparition(partie, v) { regler(partie, 'uApp', v); partie.mesh.visible = v > 0.001; },
    tout(nom, v) { for (const p of parties) regler(p, nom, v); },
    lisere(v) { for (const p of parties) p.face.userData.uniforms.uLisere.value = v; },
    couleurSeve(c) { for (const p of parties) p.face.userData.uniforms.uSeve.value.copy(c); },
    /* les peaux : verre, givre, or (l'or prend l'anneau et le cœur ; les folioles restent jade, bordées d'or) */
    peau({ verre = 0, givre = 0, or = 0 }) {
      for (const p of parties) {
        const o = p.mode === 1 ? or * 0.22 : or;
        const uu = p.face.userData.uniforms;
        uu.uVerre.value = verre; uu.uGivre.value = givre; uu.uOr.value = o;
        p.face.metalness = o * 0.9;
        p.face.roughness = 0.07 + 0.2 * o + 0.25 * givre * verre;
        p.face.color.copy(JADE).lerp(OR, o);
        p.face.clearcoat = 1 - 0.94 * o;
      }
    },
  };
}

/* Le contour fin du sceau (monde clair) : chaque bord du dessin, devant et derrière, en tubes très fins.
   aLiane.x porte la part du tracé (0 à 1) : le contour se dessine comme un trait de construction. */
export function construireContour(THREE, Tubes, { mobile, U }) {
  const tubes = new Tubes(mobile ? 4 : 5);
  const boucles = [];
  const rot = (pts, a) => pts.map((p) => new THREE.Vector2(p.x * Math.cos(a) - p.y * Math.sin(a), p.x * Math.sin(a) + p.y * Math.cos(a)));
  const ajouterForme = (forme, a = 0) => {
    boucles.push(rot(forme.getPoints(mobile ? 48 : 90), a));
    for (const h of forme.holes) boucles.push(rot(h.getPoints(mobile ? 40 : 70), a));
  };
  ajouterForme(formeAnneau(THREE));
  for (let i = 0; i < 3; i++) ajouterForme(formeFoliole(THREE), i * Math.PI * 2 / 3);
  ajouterForme(formeCoeur(THREE));
  const r = 0.0068;
  for (const z of [0.03, -0.03]) {
    for (const b of boucles) {
      const pts = b.map((p) => new THREE.Vector3(p.x, p.y, z));
      if (pts.length > 2 && pts[0].distanceTo(pts[pts.length - 1]) > 1e-4) pts.push(pts[0].clone());
      const n = pts.length;
      tubes.ajouter(THREE, pts, { rayon: () => r, naiss: (i) => i / (n - 1), coord: (i) => i / (n - 1) });
    }
  }
  // quelques arêtes de profondeur, comme un dessin filaire
  for (const a of [0, Math.PI / 2, Math.PI, Math.PI * 1.5, Math.PI / 4, Math.PI * 1.25]) {
    for (const rr of [48 * K, 42 * K]) {
      const x = Math.cos(a) * rr, y = Math.sin(a) * rr;
      tubes.ajouter(THREE, [new THREE.Vector3(x, y, 0.03), new THREE.Vector3(x, y, -0.03)], { rayon: () => r * 0.8, naiss: (i) => 0.5 + i * 0.5, coord: (i) => i });
    }
  }
  const u = { uTrace: { value: 0 }, uEncre: { value: new THREE.Color(4, 4, 4.2) }, uOmbre: { value: new THREE.Color(0.32, 0.35, 0.4) }, uVisible: { value: 1 }, ...U };
  const m = new THREE.ShaderMaterial({
    uniforms: u,
    vertexShader: /* glsl */ `
      attribute vec4 aLiane; varying float vT; varying vec3 vN;
      void main() { vT = aLiane.x; vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      ${GLSL_MASQUE}
      uniform float uTrace; uniform vec3 uEncre; uniform vec3 uOmbre; uniform float uVisible;
      varying float vT; varying vec3 vN;
      void main() {
        if (kzClair(gl_FragCoord.xy) < 0.5 || vT > uTrace || uVisible < 0.01) discard;
        float l = clamp(dot(normalize(vN), normalize(vec3(-0.4, 0.8, 0.6))) * 0.5 + 0.5, 0.0, 1.0);
        vec3 c = mix(uOmbre, uEncre, smoothstep(0.25, 0.75, l));
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  const mesh = new THREE.Mesh(tubes.geometrie(THREE), m);
  mesh.frustumCulled = false;
  return { mesh, u };
}

/* Le sceau en SVG, pour le repli sans WebGL (même dessin que l'original). */
export const SVG_SCEAU = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" aria-hidden="true" focusable="false"><defs><radialGradient id="kzj" cx="40%" cy="35%" r="75%"><stop offset="0" stop-color="#5ee6b4"/><stop offset=".55" stop-color="#10B981"/><stop offset="1" stop-color="#0a6b4a"/></radialGradient><filter id="kzl" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><g fill="url(#kzj)" fill-rule="evenodd" stroke="#a855f7" stroke-width=".7" stroke-opacity=".85" filter="url(#kzl)"><path d="M50 2a48 48 0 1 0 0 96 48 48 0 1 0 0-96zm0 6a42 42 0 1 1 0 84 42 42 0 1 1 0-84z"/><path d="M50 46C39.5 37 34.5 23.5 50 7c15.5 16.5 10.5 30 0 39zm0-7.4c6.2-6 8.6-14.4 0-23.6-8.6 9.2-6.2 17.6 0 23.6z"/><path d="M50 46C39.5 37 34.5 23.5 50 7c15.5 16.5 10.5 30 0 39zm0-7.4c6.2-6 8.6-14.4 0-23.6-8.6 9.2-6.2 17.6 0 23.6z" transform="rotate(120 50 50)"/><path d="M50 46C39.5 37 34.5 23.5 50 7c15.5 16.5 10.5 30 0 39zm0-7.4c6.2-6 8.6-14.4 0-23.6-8.6 9.2-6.2 17.6 0 23.6z" transform="rotate(240 50 50)"/><circle cx="50" cy="50" r="4.6"/></g></svg>`;
