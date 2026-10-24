// Le domaine Kazura : la palette de l'heure.
// h va de 0 (plein jour) à 1 (nuit profonde) en passant par l'heure dorée (0,42) et le crépuscule rose (0,64).
// Chaque clé décrit la lumière, le ciel, la brume, la magie et l'étalonnage ; on interpole entre deux clés.

import { lisse } from './commun.js';

const CLES = [
  { h: 0, nom: 'Jour',
    solAz: -112, solEl: 44, lumAz: -112, lumEl: 44, lum: ['#fff2de', 3.1],
    cielHaut: '#2c6ed4', cielBas: '#bcd8f0', cielSoleil: ['#fff1d6', 0.55],
    ambHaut: ['#a4c4ec', 0.95], ambSol: ['#66803a', 0.38],
    brume: '#a9c3dc', brumeProche: '#c3d4e2', brumeSoleil: '#fff0d4', densite: 0.0009,
    nuages: 0.52, nuageClair: '#ffffff', nuageOmbre: '#8796b6',
    etoiles: 0, volutes: 0, chateau: 0, lucioles: 0, lueur: 0, vent: 0.7,
    expo: 0.88, bloom: 0.32, seuil: 0.92, rayons: 0.32,
    lift: '#020509', gain: '#fffaf2', sat: 1.12, contraste: 1.12 },
  { h: 0.42, nom: 'Heure dorée',
    solAz: -27, solEl: 10, lumAz: -31, lumEl: 11, lum: ['#ffb066', 3.0],
    cielHaut: '#2f5cb4', cielBas: '#ffc58a', cielSoleil: ['#ffa850', 1.0],
    ambHaut: ['#8ea6d8', 0.85], ambSol: ['#7a5a2a', 0.3],
    brume: '#c9a48c', brumeProche: '#d8b494', brumeSoleil: '#ffcf8c', densite: 0.0009,
    nuages: 0.38, nuageClair: '#ffd6a6', nuageOmbre: '#7a6c96',
    etoiles: 0, volutes: 0, chateau: 0.05, lucioles: 0.25, lueur: 0.08, vent: 0.55,
    expo: 0.95, bloom: 0.5, seuil: 0.88, rayons: 0.9,
    lift: '#06081a', gain: '#fff0dc', sat: 1.12, contraste: 1.1 },
  { h: 0.64, nom: 'Crépuscule',
    solAz: -34, solEl: -5, lumAz: -38, lumEl: 14, lum: ['#ff9aa8', 0.7],
    cielHaut: '#16246e', cielBas: '#ff9a6a', cielSoleil: ['#ff7a50', 0.9],
    ambHaut: ['#6a6ac0', 0.55], ambSol: ['#2a2240', 0.2],
    brume: '#3c4088', brumeProche: '#8a6aa8', brumeSoleil: '#ff9a6a', densite: 0.0008,
    nuages: 0.3, nuageClair: '#ffb08a', nuageOmbre: '#34306e',
    etoiles: 0.3, volutes: 0.15, chateau: 0.7, lucioles: 0.65, lueur: 0.45, vent: 0.42,
    expo: 1.2, bloom: 0.75, seuil: 0.8, rayons: 0.35,
    lift: '#08061c', gain: '#f4ecff', sat: 1.06, contraste: 1.08 },
  { h: 0.82, nom: 'Nuit',
    solAz: -30, solEl: -18, lumAz: -32, lumEl: 36, lum: ['#9fb6ff', 0.5],
    cielHaut: '#050a2a', cielBas: '#1a2b6c', cielSoleil: ['#7088e0', 0.3],
    ambHaut: ['#4a56a0', 0.36], ambSol: ['#10142c', 0.15],
    brume: '#16225a', brumeProche: '#1f2766', brumeSoleil: '#22306e', densite: 0.001,
    nuages: 0.36, nuageClair: '#8296dc', nuageOmbre: '#0c1032',
    etoiles: 1, volutes: 0.85, chateau: 1, lucioles: 1, lueur: 1, vent: 0.32,
    expo: 1.4, bloom: 0.95, seuil: 0.72, rayons: 0.18,
    lift: '#04061c', gain: '#e0e6ff', sat: 1.1, contraste: 1.06 },
  { h: 1, nom: 'Nuit',
    solAz: -30, solEl: -24, lumAz: -32, lumEl: 38, lum: ['#a2b8ff', 0.48],
    cielHaut: '#040824', cielBas: '#18286a', cielSoleil: ['#7088e0', 0.3],
    ambHaut: ['#4a56a0', 0.34], ambSol: ['#10142c', 0.14],
    brume: '#141f56', brumeProche: '#1c2462', brumeSoleil: '#202c6a', densite: 0.001,
    nuages: 0.34, nuageClair: '#8296dc', nuageOmbre: '#0b0f30',
    etoiles: 1, volutes: 1, chateau: 1, lucioles: 1, lueur: 1, vent: 0.3,
    expo: 1.4, bloom: 1.0, seuil: 0.72, rayons: 0.15,
    lift: '#04061c', gain: '#e0e6ff', sat: 1.1, contraste: 1.06 },
];

const COULEURS = ['cielHaut', 'cielBas', 'brume', 'brumeProche', 'brumeSoleil', 'nuageClair', 'nuageOmbre', 'lift', 'gain'];
const COULEURS_FORCE = ['lum', 'cielSoleil', 'ambHaut', 'ambSol'];
const NOMBRES = ['solAz', 'solEl', 'lumAz', 'lumEl', 'densite', 'nuages', 'etoiles', 'volutes', 'chateau', 'lucioles', 'lueur', 'vent', 'expo', 'bloom', 'seuil', 'rayons', 'sat', 'contraste'];

export function direction(THREE, az, el, cible = new THREE.Vector3()) {
  const a = (az * Math.PI) / 180, e = (el * Math.PI) / 180;
  return cible.set(Math.sin(a) * Math.cos(e), Math.sin(e), -Math.cos(a) * Math.cos(e)).normalize();
}

export function creerHeure(THREE) {
  // Les clés en objets three (couleurs converties en linéaire une fois pour toutes).
  const K = CLES.map((k) => {
    const o = { h: k.h, nom: k.nom };
    for (const n of COULEURS) o[n] = new THREE.Color(k[n]);
    for (const n of COULEURS_FORCE) o[n] = new THREE.Color(k[n][0]).multiplyScalar(k[n][1]);
    for (const n of NOMBRES) o[n] = k[n];
    return o;
  });
  const P = { h: 0, nom: 'Jour', soleil: new THREE.Vector3(), lumDir: new THREE.Vector3(), magie: 0 };
  for (const n of [...COULEURS, ...COULEURS_FORCE]) P[n] = new THREE.Color();

  /** Calcule la palette pour h et met à jour les uniformes partagés. */
  function appliquer(h, U) {
    h = Math.min(1, Math.max(0, h));
    let i = 0;
    while (i < K.length - 2 && h > K[i + 1].h) i++;
    const a = K[i], b = K[i + 1];
    const t = lisse(0, 1, (h - a.h) / (b.h - a.h));
    for (const n of COULEURS) P[n].copy(a[n]).lerp(b[n], t);
    for (const n of COULEURS_FORCE) P[n].copy(a[n]).lerp(b[n], t);
    for (const n of NOMBRES) P[n] = a[n] + (b[n] - a[n]) * t;
    P.h = h;
    P.nom = h < 0.24 ? 'Jour' : h < 0.54 ? 'Heure dorée' : h < 0.74 ? 'Crépuscule' : 'Nuit';
    direction(THREE, P.solAz, P.solEl, P.soleil);
    direction(THREE, P.lumAz, P.lumEl, P.lumDir);
    P.magie = lisse(0.42, 0.9, h);
    if (U) {
      U.uLumDir.value.copy(P.lumDir);
      U.uLumCouleur.value.copy(P.lum);
      U.uSoleil.value.copy(P.soleil);
      U.uCielHaut.value.copy(P.ambHaut);
      U.uSolCouleur.value.copy(P.ambSol);
      U.uBrume.value.copy(P.brume);
      U.uBrumeProche.value.copy(P.brumeProche);
      U.uBrumeSoleil.value.copy(P.brumeSoleil);
      U.uBrumeDensite.value = P.densite;
      U.uNuit.value = lisse(0.55, 0.85, h);
      U.uVent.value = P.vent;
      U.uMagie.value = P.magie;
      U.uLueur.value = P.lueur;
      U.uChateauLum.value = P.chateau;
      U.uCroissance.value = lisse(0.3, 0.86, h);
    }
    return P;
  }
  return { appliquer, P };
}
