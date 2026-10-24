// Mathéo Bringia : les ambiances de la scène, une par partie de page (attribut data-ambiance).
// La 3D (scene.js) et le repli 2D (repli.js) les lisent ; commun.js les mélange selon la position dans la page.

export const AMBIANCES = {
  depart:      { camY: 1.05, tangage: -0.05, fov: 58, lignes: 1.0, vitLignes: 1.0, gomme: 1.0, lumiere: 1.0, horizon: 1.0, grille: 0.0, quad: 0.15, bordures: 1.0, avance: 9, brouillard: 0.03 },
  tableau:     { camY: 3.0, tangage: -0.32, fov: 55, lignes: 0.45, vitLignes: 0.5, gomme: 0.6, lumiere: 0.8, horizon: 0.7, grille: 0.0, quad: 0.8, bordures: 0.45, avance: 4, brouillard: 0.026 },
  circuit:     { camY: 26, tangage: -1.28, fov: 50, lignes: 0.08, vitLignes: 0.3, gomme: 0.25, lumiere: 0.4, horizon: 0.2, grille: 0.0, quad: 0.65, bordures: 0.25, avance: 2, brouillard: 0.012 },
  grille:      { camY: 1.7, tangage: -0.2, fov: 56, lignes: 0.3, vitLignes: 0.35, gomme: 0.5, lumiere: 0.9, horizon: 0.85, grille: 1.0, quad: 0.2, bordures: 1.0, avance: 3, brouillard: 0.03 },
  actus:       { camY: 2.6, tangage: -0.26, fov: 58, lignes: 0.55, vitLignes: 0.6, gomme: 0.7, lumiere: 0.7, horizon: 0.8, grille: 0.0, quad: 0.45, bordures: 0.5, avance: 6, brouillard: 0.03 },
  pilote:      { camY: 1.4, tangage: -0.1, fov: 58, lignes: 0.3, vitLignes: 0.4, gomme: 0.4, lumiere: 0.6, horizon: 0.7, grille: 0.0, quad: 0.2, bordures: 1.0, avance: 4, brouillard: 0.03 },
  partenaires: { camY: 1.25, tangage: -0.07, fov: 60, lignes: 0.85, vitLignes: 0.85, gomme: 0.9, lumiere: 1.1, horizon: 1.1, grille: 0.0, quad: 0.1, bordures: 1.0, avance: 8, brouillard: 0.032 },
  devenir:     { camY: 0.9, tangage: 0.0, fov: 60, lignes: 0.9, vitLignes: 1.1, gomme: 1.0, lumiere: 1.4, horizon: 1.3, grille: 0.0, quad: 0.0, bordures: 1.0, avance: 10, brouillard: 0.034 },
  calme:       { camY: 2.2, tangage: -0.2, fov: 56, lignes: 0.4, vitLignes: 0.45, gomme: 0.55, lumiere: 0.75, horizon: 0.8, grille: 0.0, quad: 0.35, bordures: 0.3, avance: 4, brouillard: 0.03 },
  pied:        { camY: 4.0, tangage: -0.42, fov: 56, lignes: 0.2, vitLignes: 0.3, gomme: 0.4, lumiere: 0.6, horizon: 0.6, grille: 0.0, quad: 0.6, bordures: 0.0, avance: 2, brouillard: 0.028 },
};
const CLES = Object.keys(AMBIANCES.depart);
export function melanger(a, b, t) {
  const o = {};
  for (const k of CLES) o[k] = a[k] + (b[k] - a[k]) * t;
  return o;
}

