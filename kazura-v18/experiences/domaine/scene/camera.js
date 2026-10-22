// Le domaine Kazura : le réalisateur.
// Six plans pensés comme au cinéma, enchaînés par des fondus : la caméra vit toute seule.
//  1. Entre les rangs : travelling lent dans l'allée, les rangs mènent l'œil au château.
//  2. Dans les herbes : contre-plongée au ras du pré, mise au point qui glisse des coquelicots au château.
//  3. Vers le château : grue qui s'élève au-dessus des vignes et du rideau d'arbres jusqu'au donjon.
//  4. Le grand paysage : le coteau, les deux petits arbres, la colline et le château, comme sur la photo.
//  5. La liane : lent arc de cercle autour du piquet où s'enroule la liane de Kazura, fond flou.
//  6. Sous les étoiles : au ras du pré, le regard levé vers le ciel et le château.
// Chaque plan donne la position, la cible, le champ horizontal (pour un écran 16/9), la distance de mise au
// point et l'ouverture (rayon de flou maximal en pixels pour 900 px de haut).

import { LIEU, hauteur, SOMMET } from './terrain.js';
import { douce, melange } from './commun.js';

const sol = (x, z) => hauteur(x, z);
const P = LIEU.piquetMagique;
const CH = { x: SOMMET.x, y: SOMMET.y + 16, z: SOMMET.z };

function lerp3(a, b, t) { return [melange(a[0], b[0], t), melange(a[1], b[1], t), melange(a[2], b[2], t)]; }
/** Vise à partir d'un point, selon un cap (degrés, + à droite) et une inclinaison (degrés, + vers le haut). */
function viser(p, cap, incl, d = 600) {
  const a = (cap * Math.PI) / 180, e = (incl * Math.PI) / 180;
  return [p[0] + Math.sin(a) * d, p[1] + Math.tan(e) * d, p[2] - Math.cos(a) * d];
}

export const PLANS = [
  {
    nom: 'Entre les rangs',
    pose(u) {
      const a = [1.25, sol(1.25, 10.5) + 1.12, 10.5], b = [1.25, sol(1.25, -5) + 1.26, -5];
      const p = lerp3(a, b, u);
      return { p, c: viser(p, 2.4, 6.4 + u * 0.6), fov: 60, focus: 26, ouv: 0.9 };
    },
  },
  {
    nom: 'Dans les herbes',
    pose(u) {
      const a = [-4.1, sol(-4.1, 27.3) + 0.56, 27.3], b = [-0.8, sol(-0.8, 26.3) + 0.62, 26.3];
      const p = lerp3(a, b, u);
      const m = douce(Math.min(1, Math.max(0, (u - 0.35) / 0.45)));
      return { p, c: viser(p, -7 + u * 3, 3.2 + u * 1.2), fov: 58, focus: melange(2.0, 260, m * m), ouv: melange(3.4, 1.2, m) };
    },
  },
  {
    nom: 'Vers le château',
    pose(u) {
      const e = douce(u);
      const p = lerp3([2.5, sol(2.5, 6) + 3.2, 6], [17, 46, -170], e);
      const c = lerp3([24, 60, -560], [CH.x, CH.y + 6, CH.z], douce(Math.min(1, u * 1.15)));
      return { p, c, fov: melange(60, 36, e), focus: 400, ouv: 0.5 };
    },
  },
  {
    nom: 'Le grand paysage',
    pose(u) {
      const p = lerp3([-7.5, sol(-7.5, 34) + 2.7, 34], [-5.2, sol(-5.2, 27) + 3.0, 27], u);
      return { p, c: viser(p, 2.6 + u * 0.4, 6.6), fov: 62, focus: 80, ouv: 0.8 };
    },
  },
  {
    nom: 'La liane',
    pose(u) {
      const a = melange(-0.5, 0.28, u);
      const yb = sol(P.x, P.z);
      const r = melange(3.3, 2.9, u);
      const p = [P.x + Math.sin(a) * r, yb + melange(0.85, 1.05, u), P.z + Math.cos(a) * r];
      const c = [P.x - 0.25, yb + melange(1.45, 1.6, u), P.z];
      return { p, c, fov: 50, focus: r, ouv: 6.5 };
    },
  },
  {
    nom: 'Sous les étoiles',
    pose(u) {
      const p = lerp3([9.1, sol(9.1, 30.6) + 0.55, 30.6], [5.7, sol(5.7, 29.4) + 0.62, 29.4], u);
      return { p, c: viser(p, 2.0 - u * 1.5, 13 + u * 1.5), fov: 64, focus: 30, ouv: 2.0 };
    },
  },
];

export function creerRealisateur(THREE, { reduit }) {
  const duree = reduit ? 15 : 11.5;
  const fondu = reduit ? 2.4 : 1.5;
  const amplitude = reduit ? 0.65 : 1;
  const v = new THREE.Vector3(), cible = new THREE.Vector3();
  const droite = new THREE.Vector3(), haut = new THREE.Vector3(0, 1, 0);
  let decalX = 0, decalY = 0;

  /** t : temps du film en secondes. Renvoie l'indice du plan, sa progression et l'avancement du fondu d'entrée. */
  function etat(t) {
    const i = Math.floor(t / duree);
    const local = t - i * duree;
    return { plan: ((i % PLANS.length) + PLANS.length) % PLANS.length, u: local / duree, entree: Math.min(1, local / fondu), numero: i };
  }

  /** Pose la caméra pour un plan ; renvoie la mise au point. souris : [-1..1] pour un léger décalage de parallaxe. */
  function poser(camera, plan, u, aspect, temps, souris = [0, 0]) {
    const uu = 0.5 + (u - 0.5) * amplitude;
    const s = PLANS[plan].pose(uu);
    v.set(s.p[0], s.p[1], s.p[2]);
    cible.set(s.c[0], s.c[1], s.c[2]);
    // la caméra à l'épaule : un souffle à peine perceptible (pas en mouvement réduit)
    if (!reduit) {
      const d = v.distanceTo(cible);
      droite.subVectors(cible, v).cross(haut).normalize();
      const k = d * 0.0016;
      cible.addScaledVector(droite, (Math.sin(temps * 0.53) * 0.6 + Math.sin(temps * 1.27) * 0.25 + decalX) * k);
      cible.y += (Math.sin(temps * 0.71 + 1.3) * 0.45 + Math.sin(temps * 1.61) * 0.15 + decalY) * k;
      v.y += Math.sin(temps * 0.9) * 0.012;
      decalX += (souris[0] * 1.6 - decalX) * 0.03;
      decalY += (souris[1] * 1.0 - decalY) * 0.03;
    }
    camera.position.copy(v);
    camera.lookAt(cible);
    // champ : horizontal pour 16/9, plus serré en portrait (le cadrage reste lisible sur téléphone)
    const hfov = s.fov * (aspect < 1.2 ? 0.8 : 1);
    let vfov = 2 * Math.atan(Math.tan((hfov * Math.PI) / 360) / aspect) * (180 / Math.PI);
    vfov = Math.min(60, Math.max(28, vfov));
    if (Math.abs(camera.fov - vfov) > 0.01) { camera.fov = vfov; camera.updateProjectionMatrix(); }
    return { focus: s.focus, ouv: s.ouv, nom: PLANS[plan].nom };
  }
  return { etat, poser, duree, fondu, nombre: PLANS.length };
}
