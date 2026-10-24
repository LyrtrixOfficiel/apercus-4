/* Kazura v12, le Monde : les ambiances au fil de la page.
   Quatre lumières de base (nuit violette, aube dorée, jade du matin, crépuscule), placées sur les
   neuf sections. Le curseur d'ambiance glisse lentement vers l'indice de la section visible ; entre
   deux repères, le mélange est lissé (pas de cassure). Les fonds restent sombres partout : le texte
   de la page passe par-dessus. */

const NUIT = {
  zen: 0x030207, hor: 0x0e0820, halo: 0x6d3fd1, haloForce: 0.32,
  brume: 0x0c071b, densite: 0.05,
  lum: 0xb9a6ff, lumInt: 1.5, lumDir: [0.35, 0.5, -1],
  hemiCiel: 0x2a1d5c, hemiSol: 0x03140e, hemiInt: 0.19,
  seve: 0xa855f7, seveInt: 2.6, lucioles: 0xc084fc, luciolesInt: 1.0,
  etoiles: 1, expo: 1.0, bloom: 0.75, trans: 0x6fd88a, envInt: 0.41, jadeLueur: 0.05,
};
const AUBE = {
  zen: 0x07050d, hor: 0x2a1910, halo: 0xe9c987, haloForce: 0.85,
  brume: 0x150e0c, densite: 0.045,
  lum: 0xffd29a, lumInt: 2.6, lumDir: [0.45, 0.22, -1],
  hemiCiel: 0x4a3320, hemiSol: 0x0a1a12, hemiInt: 0.22,
  seve: 0xb46cff, seveInt: 2.2, lucioles: 0xffd58a, luciolesInt: 0.9,
  etoiles: 0.12, expo: 1.03, bloom: 0.7, trans: 0xb4e070, envInt: 0.45, jadeLueur: 0.05,
};
const JADE = {
  zen: 0x020c09, hor: 0x0a221b, halo: 0x7fe0b8, haloForce: 0.6,
  brume: 0x061813, densite: 0.046,
  lum: 0xd8fff0, lumInt: 2.3, lumDir: [0.3, 0.62, -1],
  hemiCiel: 0x1c4a3c, hemiSol: 0x03120c, hemiInt: 0.25,
  seve: 0xa78bfa, seveInt: 2.1, lucioles: 0xb9f5d8, luciolesInt: 0.75,
  etoiles: 0, expo: 1.03, bloom: 0.66, trans: 0x8ee890, envInt: 0.52, jadeLueur: 0.06,
};
const AMBRE = {
  zen: 0x070409, hor: 0x2b160c, halo: 0xf2a65a, haloForce: 0.7,
  brume: 0x170d09, densite: 0.047,
  lum: 0xffc58a, lumInt: 2.3, lumDir: [0.45, 0.2, -1],
  hemiCiel: 0x4a2a1c, hemiSol: 0x0a140f, hemiInt: 0.21,
  seve: 0xb46cff, seveInt: 2.4, lucioles: 0xffcf8f, luciolesInt: 0.9,
  etoiles: 0.1, expo: 1.02, bloom: 0.72, trans: 0xb8d870, envInt: 0.45, jadeLueur: 0.05,
};
const CREPUSCULE = {
  zen: 0x06030c, hor: 0x2e1026, halo: 0xe77a8f, haloForce: 0.75,
  brume: 0x150917, densite: 0.05,
  lum: 0xffad8a, lumInt: 2.0, lumDir: [0.5, 0.18, -1],
  hemiCiel: 0x3a1a3a, hemiSol: 0x0a0f12, hemiInt: 0.19,
  seve: 0xc084fc, seveInt: 2.8, lucioles: 0xf0abfc, luciolesInt: 1.0,
  etoiles: 0.55, expo: 1.0, bloom: 0.8, trans: 0x86dc98, envInt: 0.41, jadeLueur: 0.05,
};

export const SECTIONS = ['ouverture', 'promesse', 'realisations', 'experiences', 'rever', 'deroule', 'matheo', 'questions', 'contact'];   // v18

/* Les neuf repères : [ambiance A, ambiance B, part de B]. */
const REPERES = [
  // v18 : ouverture, promesse, realisations, experiences, rever, deroule, matheo, questions, contact
  [NUIT, NUIT, 0], [NUIT, NUIT, 0], [AUBE, AUBE, 0], [NUIT, AUBE, 0.4], [AUBE, AUBE, 0],
  [JADE, JADE, 0], [JADE, JADE, 0], [AMBRE, AMBRE, 0], [CREPUSCULE, CREPUSCULE, 0],
];

const CLES_COULEUR = ['zen', 'hor', 'halo', 'brume', 'lum', 'hemiCiel', 'hemiSol', 'seve', 'lucioles', 'trans'];
const CLES_NOMBRE = ['haloForce', 'densite', 'lumInt', 'hemiInt', 'seveInt', 'luciolesInt', 'etoiles', 'expo', 'bloom', 'envInt', 'jadeLueur'];

export function creerAmbiances(THREE) {
  const conv = (a) => {
    const o = {};
    for (const k of CLES_COULEUR) o[k] = new THREE.Color(a[k]);
    for (const k of CLES_NOMBRE) o[k] = a[k];
    o.lumDir = new THREE.Vector3(...a.lumDir).normalize();
    return o;
  };
  const cache = new Map();
  const c = (a) => { if (!cache.has(a)) cache.set(a, conv(a)); return cache.get(a); };
  const reperes = REPERES.map(([a, b, t]) => melanger(THREE, c(a), c(b), t, nouvelle(THREE)));
  const sortie = nouvelle(THREE);
  return {
    sortie,
    /* curseur entre 0 et 8 */
    evaluer(curseur) {
      const x = Math.min(8, Math.max(0, curseur));
      const i = Math.min(7, Math.floor(x));
      let t = x - i; t = t * t * (3 - 2 * t);
      return melanger(THREE, reperes[i], reperes[i + 1], t, sortie);
    },
  };
}

function nouvelle(THREE) {
  const o = {};
  for (const k of CLES_COULEUR) o[k] = new THREE.Color();
  for (const k of CLES_NOMBRE) o[k] = 0;
  o.lumDir = new THREE.Vector3();
  return o;
}
function melanger(THREE, a, b, t, o) {
  for (const k of CLES_COULEUR) o[k].copy(a[k]).lerp(b[k], t);
  for (const k of CLES_NOMBRE) o[k] = a[k] + (b[k] - a[k]) * t;
  o.lumDir.copy(a.lumDir).lerp(b.lumDir, t).normalize();
  return o;
}
