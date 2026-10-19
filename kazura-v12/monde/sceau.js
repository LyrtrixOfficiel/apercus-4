/* Kazura v12, le Monde : le sceau (kamon de Kazura) en jade, fidèle à assets/logo/sceau-jade.svg.
   Le SVG (viewBox 100) : un anneau r 48 / 42, trois folioles évidées (une goutte de feuille avec
   sa goutte intérieure, tournée de 0, 120 et 240 degrés) et un cœur r 4,6. Ici chaque forme est
   reprise point pour point (mêmes courbes de Bézier), extrudée avec un biseau poli.
   Les faces sont en jade (transmission sur ordinateur), les flancs et biseaux portent le liseré de
   lumière violette. Chaque partie apparaît par un front de matière (anneau : en tournant dans le
   sens de la vrille ; folioles : de la base vers la pointe ; cœur : du centre vers le bord). */
import { greffer, GLSL_BRUIT } from './commun.js';
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

/* mode : 0 anneau (angle), 1 foliole (le long de l'axe local y), 2 cœur (rayon) */
function materiauJade(THREE, { mobile, bord, mode }) {
  const m = new THREE.MeshPhysicalMaterial({
    color: 0x1a9e70,
    roughness: 0.07, metalness: 0,
    transmission: mobile ? 0 : 0.2, thickness: 0.3, ior: 1.62,
    attenuationColor: new THREE.Color(0x10b981), attenuationDistance: 0.6,
    clearcoat: 1, clearcoatRoughness: 0.05, specularIntensity: 1,
    envMapIntensity: 2.6,
  });
  const u = {
    uApp: { value: 0 }, uMode: { value: mode }, uAngle0: { value: -Math.PI / 3 },
    uSeve: { value: new THREE.Color(0xa855f7) }, uLisere: { value: 1.5 }, uEclat: { value: 0 },
    uJade: { value: new THREE.Color(0x10b981) }, uLueur: { value: 0.12 }, uTemps: { value: 0 },
    uLumDir: { value: new THREE.Vector3(0, 0, 1) }, uLumCouleur: { value: new THREE.Color(1, 1, 1) },
  };
  return greffer(m, {
    cle: 'jade-' + (bord ? 'b' : 'f') + (mobile ? 'm' : ''), uniforms: u,
    declVert: 'varying vec3 vLoc;',
    vert: [['#include <begin_vertex>', '#include <begin_vertex>\n vLoc = position;']],
    declFrag: GLSL_BRUIT + `
      uniform float uApp; uniform float uMode; uniform float uAngle0; uniform vec3 uSeve; uniform float uLisere;
      uniform float uEclat; uniform vec3 uJade; uniform float uLueur; uniform float uTemps; uniform vec3 uLumDir; uniform vec3 uLumCouleur;
      varying vec3 vLoc;`,
    frag: [
      ['#include <color_fragment>', `#include <color_fragment>
        float kzProg;
        if (uMode < 0.5) { float a = atan(vLoc.y, vLoc.x); kzProg = fract((a - uAngle0) / 6.2831853); }
        else if (uMode < 1.5) { kzProg = clamp((vLoc.y - 0.1) / 1.02, 0.0, 1.0); }
        else { kzProg = length(vLoc.xy) / 0.13; }
        float kzNb = kzBruit(vLoc * 26.0);
        float kzM = kzProg * 0.9 + kzNb * 0.1;
        float kzSeuil = uApp * 1.1;
        if (kzM > kzSeuil) discard;
        float kzFront = 1.0 - smoothstep(0.0, 0.08, kzSeuil - kzM);
        float kzVeine = kzFbm(vLoc * vec3(5.5, 5.5, 3.0) + vec3(uMode * 3.1));
        float kzNuage = smoothstep(0.25, 0.85, kzVeine);
        float kzFil = 1.0 - smoothstep(0.0, 0.03, abs(kzFbm(vLoc * 9.0 + 7.0) - 0.5));
        diffuseColor.rgb = mix(vec3(0.02, 0.24, 0.15), vec3(0.07, 0.46, 0.30), kzNuage) + vec3(0.30, 0.50, 0.40) * kzFil * 0.12;`],
      ['#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        vec3 kzVv = normalize(vViewPosition);
        float kzFr = pow(1.0 - clamp(abs(dot(normal, kzVv)), 0.0, 1.0), 2.0);
        float kzRespire = 0.85 + 0.15 * sin(uTemps * 1.3);
        float kzRim = pow(1.0 - clamp(abs(dot(normal, kzVv)), 0.0, 1.0), 3.0);
        float kzRim2 = pow(1.0 - clamp(abs(dot(normal, kzVv)), 0.0, 1.0), 2.2);
        totalEmissiveRadiance += uSeve * (uLisere * kzRespire * (kzRim * 2.6 + kzRim2 * 0.6) * (1.0 + 2.0 * uEclat) + uEclat * 0.12);
        totalEmissiveRadiance += uSeve * kzFront * 6.0 * (1.0 - step(0.999, uApp));
        float kzCoeurJ = pow(clamp(dot(normal, kzVv), 0.0, 1.0), 0.8);
        totalEmissiveRadiance += uJade * uLueur * (0.45 + 0.6 * kzNuage) * (0.2 + 0.8 * kzCoeurJ) * (1.0 + 1.2 * uEclat);
        totalEmissiveRadiance += uJade * uLumCouleur * clamp(-dot(normal, uLumDir) * 0.6 + 0.4, 0.0, 1.0) * 0.18 * (0.6 + 0.6 * kzVeine);`],
    ],
  });
}

export function construireSceau(THREE, { mobile }) {
  const groupe = new THREE.Group();
  const parties = [];
  const ajouter = (forme, mode, rot = 0) => {
    const g = extruder(THREE, forme, mobile);
    const face = materiauJade(THREE, { mobile, bord: false, mode });
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
  const regler = (partie, nom, v) => { partie.face.userData.uniforms[nom].value = v; partie.bord.userData.uniforms[nom].value = v; };
  return {
    groupe, parties, anneau, folioles, coeur,
    apparition(partie, v) { regler(partie, 'uApp', v); partie.mesh.visible = v > 0.001; },
    tout(nom, v) { for (const p of parties) regler(p, nom, v); },
    lisere(v) { for (const p of parties) p.face.userData.uniforms.uLisere.value = v; },
    couleurSeve(c) { for (const p of parties) { p.face.userData.uniforms.uSeve.value.copy(c); p.bord.userData.uniforms.uSeve.value.copy(c); } },
  };
}

/* Le sceau en SVG, pour le repli sans WebGL (même dessin que l'original). */
export const SVG_SCEAU = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" aria-hidden="true" focusable="false"><defs><radialGradient id="kzj" cx="40%" cy="35%" r="75%"><stop offset="0" stop-color="#5ee6b4"/><stop offset=".55" stop-color="#10B981"/><stop offset="1" stop-color="#0a6b4a"/></radialGradient><filter id="kzl" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><g fill="url(#kzj)" fill-rule="evenodd" stroke="#a855f7" stroke-width=".7" stroke-opacity=".85" filter="url(#kzl)"><path d="M50 2a48 48 0 1 0 0 96 48 48 0 1 0 0-96zm0 6a42 42 0 1 1 0 84 42 42 0 1 1 0-84z"/><path d="M50 46C39.5 37 34.5 23.5 50 7c15.5 16.5 10.5 30 0 39zm0-7.4c6.2-6 8.6-14.4 0-23.6-8.6 9.2-6.2 17.6 0 23.6z"/><path d="M50 46C39.5 37 34.5 23.5 50 7c15.5 16.5 10.5 30 0 39zm0-7.4c6.2-6 8.6-14.4 0-23.6-8.6 9.2-6.2 17.6 0 23.6z" transform="rotate(120 50 50)"/><path d="M50 46C39.5 37 34.5 23.5 50 7c15.5 16.5 10.5 30 0 39zm0-7.4c6.2-6 8.6-14.4 0-23.6-8.6 9.2-6.2 17.6 0 23.6z" transform="rotate(240 50 50)"/><circle cx="50" cy="50" r="4.6"/></g></svg>`;
