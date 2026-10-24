/* Kazura v12, le Monde : la liane.
   - le tracé : un axe A(u) qui file vers -Z depuis le bas droit de l'anneau du sceau, une tige qui
     s'enroule autour, une tige compagne qui s'enroule autour d'elle, des rameaux qui bifurquent et
     finissent en vrille, des pétioles et des hampes florales ;
   - la vrille d'ouverture : du centre du sceau à l'anneau, puis un tour complet de l'anneau ;
   - le matériau : jade poli, velours fin, sève de lumière violette qui avance par pulsations.
   Chaque sommet porte sa « naissance » (en unités de pousse) : le nuanceur fait pousser la liane
   en resserrant les sommets qui ne sont pas encore nés, sans jamais reconstruire la géométrie. */
import { hasard, greffer, GLSL_BRUIT, GLSL_VENT, GLSL_RELIEF } from './commun.js';

export const RAYON_SCEAU = 1.25;                 // rayon extérieur de l'anneau (48 sur 100 dans le SVG)
export const RAYON_ANNEAU = RAYON_SCEAU * 45 / 48; // ligne médiane de l'anneau
export const ANGLE_SORTIE = -Math.PI / 3;          // la liane quitte l'anneau en bas à droite

/* ---------------------------------------------------------------- tracés */

export function construireTraces(THREE, { mobile }) {
  const V3 = THREE.Vector3;
  const alea = hasard(1912);
  const e = new V3(Math.cos(ANGLE_SORTIE) * RAYON_ANNEAU, Math.sin(ANGLE_SORTIE) * RAYON_ANNEAU, 0);

  // L'axe : il sort de l'anneau vers l'arrière et serpente doucement dans la nuit.
  const ctrl = [e.clone(), new V3(e.x + 0.04, e.y - 0.06, -1.1), new V3(e.x + 0.18, e.y - 0.14, -2.5)];
  for (let k = 1; k <= 36; k++) {
    const z = -2.5 - k * 3.1;
    const x = 0.55 + 0.75 * Math.sin(k * 0.45 + 0.75) + 0.26 * Math.sin(k * 1.17 + 2.2) - 0.2;
    const y = -1.08 + 0.8 * Math.sin(k * 0.34 + 0.15) + 0.28 * Math.sin(k * 0.91 + 0.4) - 0.03 * k;
    ctrl.push(new V3(x, y, z));
  }
  const axe = new THREE.CatmullRomCurve3(ctrl, false, 'centripetal');
  axe.arcLengthDivisions = 4000;
  const L = axe.getLength();
  const Y = new V3(0, 1, 0);
  const cadre = (u) => {
    const t = Math.min(Math.max(u / L, 0), 1);
    const p = axe.getPointAt(t);
    const tg = axe.getTangentAt(t);
    const cote = new V3().crossVectors(tg, Y).normalize();
    const haut = new V3().crossVectors(cote, tg).normalize();
    return { p, tg, cote, haut };
  };

  // La tige principale s'enroule autour de l'axe (hélice large et lente).
  const pas = mobile ? 0.1 : 0.065;
  const tige = [];
  for (let u = 0; u <= L - 1; u += pas) {
    const c = cadre(u);
    const rh = 0.21 * smoothstep(0, 3.2, u) * (1 + 0.25 * Math.sin(u * 0.21));
    const phi = u * 0.78 + 1.4;
    const q = c.p.clone().addScaledVector(c.cote, Math.cos(phi) * rh).addScaledVector(c.haut, Math.sin(phi) * rh);
    tige.push({ p: q, u });
  }
  const repTige = reperes(THREE, tige.map((s) => s.p));

  const noeuds = [];      // départs de feuilles sur la tige principale
  const rameaux = [];     // tracés secondaires
  const fleurs = [];      // hampes florales

  // Feuilles : alternées autour de la tige, jamais du côté gauche (la zone calme du texte sur ordinateur).
  const ecart = mobile ? 1.25 : 0.82;
  let psi = 0.6;
  for (let u = 1.3; u < L - 3; u += ecart * (0.85 + alea() * 0.3)) {
    psi += 2.3 + alea() * 0.5;
    const c = cadre(u);
    let dir = c.cote.clone().multiplyScalar(Math.cos(psi)).addScaledVector(c.haut, Math.sin(psi));
    if (dir.dot(c.cote) < -0.3) { psi += Math.PI * 0.62; dir = c.cote.clone().multiplyScalar(Math.cos(psi)).addScaledVector(c.haut, Math.sin(psi)); }
    const i = Math.min(tige.length - 1, Math.round(u / pas));
    noeuds.push({ u, i, p: tige[i].p.clone(), dir: dir.addScaledVector(c.tg, (alea() - 0.4) * 0.7).normalize(), haut: c.haut.clone(), tg: c.tg.clone() });
  }

  // Rameaux : ils partent de la tige, s'écartent, montent vers la lumière et s'achèvent en vrille.
  const nbRameaux = mobile ? 9 : 20;
  for (let k = 0; k < nbRameaux; k++) {
    const u0 = 4.5 + (k + alea() * 0.6) * (L - 10) / nbRameaux;
    const i0 = Math.min(tige.length - 1, Math.round(u0 / pas));
    const c = cadre(u0);
    let a = (alea() < 0.5 ? 0.15 : 1.25) + (alea() - 0.5) * 0.9; // à droite ou en haut, parfois en bas
    if (alea() < 0.25) a = -1.1 + alea() * 0.5;
    const dir = c.cote.clone().multiplyScalar(Math.cos(a)).addScaledVector(c.haut, Math.sin(a)).addScaledVector(c.tg, 0.35 + alea() * 0.4).normalize();
    const longueur = 2.6 + alea() * 2.8;
    const axeRot = new V3().crossVectors(dir, c.haut).normalize();
    if (axeRot.lengthSq() < 0.01) axeRot.copy(c.cote);
    const pts = [];
    const p = tige[i0].p.clone();
    const ds = 0.05;
    const sens = alea() < 0.5 ? 1 : -1;
    for (let s = 0; s <= longueur; s += ds) {
      pts.push(p.clone());
      const f = s / longueur;
      const courbure = (0.22 + (f > 0.62 ? Math.pow((f - 0.62) / 0.38, 2) * 10.5 : 0)) * sens;
      dir.applyAxisAngle(axeRot, courbure * ds);
      axeRot.applyAxisAngle(dir, 0.22 * ds);
      if (f < 0.4) dir.lerp(Y, 0.0045).normalize();
      axeRot.applyAxisAngle(dir, Math.sin(s * 2.3 + k) * 0.05);
      p.addScaledVector(dir, ds);
    }
    rameaux.push({ u0, pts, longueur, base: 0.03 + alea() * 0.008 });
  }

  // Hampes florales : à certains nœuds, de plus en plus nombreuses au fil de la page.
  noeuds.forEach((n, k) => {
    if (n.u < 14) return;
    const chance = 0.1 + 0.22 * (n.u / L);
    if (alea() < chance * (mobile ? 0.6 : 1)) fleurs.push({ noeud: k, u: n.u, p: n.p.clone(), dir: n.dir.clone().lerp(Y, 0.55).normalize(), longueur: 0.38 + alea() * 0.22, graine: alea() });
  });

  return { axe, L, cadre, tige, repTige, pas, noeuds, rameaux, fleurs, sortie: e };
}

function smoothstep(a, b, x) { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }

/* Repères par transport parallèle le long d'une ligne de points (pas de torsion brusque). */
export function reperes(THREE, pts) {
  const n = pts.length;
  const T = [], N = [], B = [];
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    T.push(new THREE.Vector3().subVectors(b, a).normalize());
  }
  let ref = Math.abs(T[0].y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
  N.push(new THREE.Vector3().crossVectors(T[0], ref).normalize());
  B.push(new THREE.Vector3().crossVectors(T[0], N[0]).normalize());
  for (let i = 1; i < n; i++) {
    const v = N[i - 1].clone().addScaledVector(T[i], -N[i - 1].dot(T[i])).normalize();
    N.push(v);
    B.push(new THREE.Vector3().crossVectors(T[i], v).normalize());
  }
  return { T, N, B };
}

/* ---------------------------------------------------------------- géométrie */

/* Accumulateur de tubes dans une seule géométrie (un seul appel de dessin pour toute la liane). */
export class Tubes {
  constructor(radial) { this.radial = radial; this.pos = []; this.nor = []; this.axe = []; this.li = []; this.idx = []; this.n = 0; }
  /* pts : points de la ligne médiane ; rayon(i), naiss(i) : fonctions ; coord(i) : abscisse pour le relief */
  ajouter(THREE, pts, { rayon, naiss, coord, rep }) {
    const R = this.radial;
    const { N, B } = rep || reperes(THREE, pts);
    const debut = this.n;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i], r = rayon(i), nz = naiss(i), cz = coord(i);
      for (let j = 0; j <= R; j++) {
        const a = (j / R) * Math.PI * 2;
        const ca = Math.cos(a), sa = Math.sin(a);
        const nx = N[i].x * ca + B[i].x * sa, ny = N[i].y * ca + B[i].y * sa, nzv = N[i].z * ca + B[i].z * sa;
        this.pos.push(p.x + nx * r, p.y + ny * r, p.z + nzv * r);
        this.nor.push(nx, ny, nzv);
        this.axe.push(p.x, p.y, p.z);
        this.li.push(nz, r, cz, j / R);
      }
      this.n += R + 1;
    }
    for (let i = 0; i < pts.length - 1; i++) {
      for (let j = 0; j < R; j++) {
        const a = debut + i * (R + 1) + j, b = a + R + 1;
        this.idx.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
  }
  geometrie(THREE) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3));
    g.setAttribute('aAxe', new THREE.Float32BufferAttribute(this.axe, 3));
    g.setAttribute('aLiane', new THREE.Float32BufferAttribute(this.li, 4));
    g.setIndex(this.n > 65535 ? new THREE.Uint32BufferAttribute(this.idx, 1) : new THREE.Uint16BufferAttribute(this.idx, 1));
    g.computeBoundingSphere();
    return g;
  }
}

/* Courbe de Bézier quadratique échantillonnée. */
function bezier2(THREE, a, b, c, n) {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, m = 1 - t;
    out.push(new THREE.Vector3(m * m * a.x + 2 * m * t * b.x + t * t * c.x, m * m * a.y + 2 * m * t * b.y + t * t * c.y, m * m * a.z + 2 * m * t * b.z + t * t * c.z));
  }
  return out;
}

/* La liane du voyage : tige, compagne, rameaux, pétioles, hampes. Renvoie la géométrie et la liste
   des attaches de feuilles (calculées ici pour que pétiole et feuille se rejoignent exactement). */
export function construireLiane(THREE, traces, { mobile }) {
  const alea = hasard(77);
  const tubes = new Tubes(mobile ? 7 : 10);
  const { tige, repTige, pas, noeuds, rameaux, fleurs } = traces;
  const naissTige = (u) => u;

  // 1. La tige principale, renflée aux nœuds.
  const noeudsU = noeuds.map((n) => n.u);
  tubes.ajouter(THREE, tige.map((s) => s.p), {
    rep: repTige,
    rayon: (i) => {
      const u = tige[i].u;
      let r = 0.062 - 0.012 * Math.min(1, u / 90);
      for (const nu of noeudsU) { const d = (u - nu) / 0.07; if (Math.abs(d) < 3) r *= 1 + 0.32 * Math.exp(-d * d); }
      return r;
    },
    naiss: (i) => naissTige(tige[i].u),
    coord: (i) => tige[i].u,
  });

  // 2. La compagne : une tige fine qui s'enroule serrée autour de la principale.
  const comp = [];
  const debutC = Math.round(5 / pas);
  for (let i = debutC; i < tige.length; i++) {
    const u = tige[i].u, psi = u * 2.3;
    const r = 0.062 + 0.03 + 0.004;
    comp.push(tige[i].p.clone().addScaledVector(repTige.N[i], Math.cos(psi) * r).addScaledVector(repTige.B[i], Math.sin(psi) * r));
  }
  tubes.ajouter(THREE, comp, {
    rayon: (i) => 0.026 * Math.min(1, i / 30),
    naiss: (i) => naissTige(tige[debutC + i].u) + 0.6,
    coord: (i) => tige[debutC + i].u * 1.3,
  });

  // 3. Les rameaux, plus fins vers leur vrille.
  const attaches = []; // feuilles : { p, dir, haut, naiss, taille }
  for (const r of rameaux) {
    const n0 = naissTige(r.u0) + 0.5;
    const m = r.pts.length;
    tubes.ajouter(THREE, r.pts, {
      rayon: (i) => r.base * (1 - 0.78 * (i / (m - 1))) + 0.004,
      naiss: (i) => n0 + i * 0.05 * 1.25,
      coord: (i) => i * 0.05 + r.u0,
    });
    // feuilles sur le rameau, hors de la vrille
    const repR = reperes(THREE, r.pts);
    for (let s = 0.55; s < r.longueur * 0.6; s += mobile ? 1.1 : 0.72) {
      const i = Math.round(s / 0.05);
      const dir = repR.N[i].clone().multiplyScalar(Math.cos(s * 3.1)).addScaledVector(repR.B[i], Math.sin(s * 3.1)).addScaledVector(repR.T[i], 0.4).normalize();
      attaches.push({ p: r.pts[i].clone(), dir, naiss: n0 + s * 1.25, taille: 0.78 + alea() * 0.25 });
    }
  }

  // 4. Pétioles de la tige principale (courbes, du nœud vers la feuille).
  for (const n of noeuds) {
    const len = 0.3 + alea() * 0.2;
    attaches.push({ p: n.p.clone(), dir: n.dir.clone(), naiss: naissTige(n.u) + 0.15, taille: 0.92 + alea() * 0.3 });
  }
  const feuilles = [];
  for (const a of attaches) {
    const len = (0.26 + alea() * 0.18) * a.taille;
    const fin = a.p.clone().addScaledVector(a.dir, len).add(new THREE.Vector3(0, 0.06 * a.taille, 0));
    const mil = a.p.clone().addScaledVector(a.dir, len * 0.55).add(new THREE.Vector3(0, 0.08 * a.taille, 0));
    const pts = bezier2(THREE, a.p, mil, fin, mobile ? 5 : 8);
    tubes.ajouter(THREE, pts, {
      rayon: (i) => 0.013 * a.taille * (1 - 0.35 * i / (pts.length - 1)),
      naiss: (i) => a.naiss + (i / (pts.length - 1)) * len * 1.4,
      coord: (i) => i * 0.04,
    });
    const dirFin = new THREE.Vector3().subVectors(fin, pts[pts.length - 2]).normalize();
    feuilles.push({ p: fin, dir: dirFin, naiss: a.naiss + len * 1.4, taille: a.taille });
  }

  // 5. Hampes florales (l'axe ; les fleurs elles-mêmes sont dans feuilles.js).
  const hampes = [];
  for (const f of fleurs) {
    const n0 = naissTige(f.u) + 1.2;
    const fin = f.p.clone().addScaledVector(f.dir, f.longueur);
    const mil = f.p.clone().addScaledVector(f.dir, f.longueur * 0.5).add(new THREE.Vector3(0.03, 0.02, 0));
    const pts = bezier2(THREE, f.p, mil, fin, 8);
    tubes.ajouter(THREE, pts, { rayon: (i) => 0.011 * (1 - 0.6 * i / 8), naiss: (i) => n0 + i * 0.03, coord: (i) => i * 0.03 });
    hampes.push({ pts, naiss: n0, graine: f.graine });
  }

  return { geometrie: tubes.geometrie(THREE), feuilles, hampes };
}

/* La vrille d'ouverture : du cœur du sceau jusqu'à l'anneau, puis un tour complet de l'anneau,
   qui finit là où part la liane du voyage. */
export function construireVrille(THREE, { mobile }) {
  const V3 = THREE.Vector3;
  const rc = RAYON_ANNEAU;
  const e = new V3(Math.cos(ANGLE_SORTIE) * rc, Math.sin(ANGLE_SORTIE) * rc, 0);
  const tgE = new V3(-Math.sin(ANGLE_SORTIE), Math.cos(ANGLE_SORTIE), 0);
  // la tige qui jaillit : Bézier cubique, du centre vers le bas puis tangente à l'anneau
  const P0 = new V3(0, 0, 0.02), P1 = new V3(-0.05, -0.62, 0.22), P2 = e.clone().addScaledVector(tgE, -0.5).add(new V3(0, 0, 0.12)), P3 = e.clone();
  const pts = [];
  const nJet = 40;
  for (let i = 0; i <= nJet; i++) {
    const t = i / nJet, m = 1 - t;
    pts.push(new V3(
      m * m * m * P0.x + 3 * m * m * t * P1.x + 3 * m * t * t * P2.x + t * t * t * P3.x,
      m * m * m * P0.y + 3 * m * m * t * P1.y + 3 * m * t * t * P2.y + t * t * t * P3.y,
      m * m * m * P0.z + 3 * m * m * t * P1.z + 3 * m * t * t * P2.z + t * t * t * P3.z));
  }
  // le tour de l'anneau (un peu plus d'un tour pour refermer sans couture)
  const nTour = mobile ? 120 : 200;
  const tour = Math.PI * 2 + 0.25;
  for (let i = 1; i <= nTour; i++) {
    const a = ANGLE_SORTIE + (i / nTour) * tour;
    pts.push(new V3(Math.cos(a) * rc, Math.sin(a) * rc, 0.0));
  }
  // abscisse curviligne
  const s = [0];
  for (let i = 1; i < pts.length; i++) s.push(s[i - 1] + pts[i].distanceTo(pts[i - 1]));
  const longJet = s[nJet], longueur = s[s.length - 1];
  const tubes = new Tubes(mobile ? 8 : 12);
  tubes.ajouter(THREE, pts, { rayon: () => 0.07, naiss: (i) => s[i], coord: (i) => s[i] });
  /* position de la tête pour une longueur poussée donnée */
  const tete = (l, out) => {
    let i = 1; while (i < s.length - 1 && s[i] < l) i++;
    const t = Math.min(1, Math.max(0, (l - s[i - 1]) / Math.max(1e-6, s[i] - s[i - 1])));
    return out.copy(pts[i - 1]).lerp(pts[i], t);
  };
  return { geometrie: tubes.geometrie(THREE), longJet, longueur, tete };
}

/* Lianes lointaines : de grandes lianes qui pendent dans la brume, loin du chemin. Elles donnent
   l'échelle d'une forêt de nuit sans coûter de feuilles. */
export function construireLointaines(THREE, traces, { mobile }) {
  const alea = hasard(2024);
  const tubes = new Tubes(mobile ? 5 : 7);
  const n = mobile ? 6 : 10;
  for (let k = 0; k < n; k++) {
    const u = 6 + (k + alea() * 0.8) * (traces.L - 10) / n;
    const c = traces.cadre(u);
    const cote = alea() < 0.72 ? 1 : -1;
    const lat = cote > 0 ? 7 + alea() * 10 : 11 + alea() * 9;
    const base = c.p.clone().addScaledVector(c.cote, cote * lat).addScaledVector(c.tg, (alea() - 0.5) * 4);
    const h = 9 + alea() * 6, creux = 2 + alea() * 3, ecart = (alea() - 0.5) * 6;
    const ctrl = [];
    for (let i = 0; i <= 6; i++) {
      const t = i / 6;
      ctrl.push(base.clone()
        .addScaledVector(c.haut, h * (0.5 - t) - creux * Math.sin(Math.PI * t) * 0.6 + 2)
        .addScaledVector(c.tg, ecart * (t - 0.5) * 2)
        .addScaledVector(c.cote, Math.sin(t * 5 + k) * 0.5));
    }
    const courbe = new THREE.CatmullRomCurve3(ctrl);
    const pts = courbe.getSpacedPoints(mobile ? 40 : 70);
    const r0 = 0.12 + alea() * 0.16;
    tubes.ajouter(THREE, pts, { rayon: (i) => r0 * (0.9 + 0.1 * Math.sin(i * 0.15)), naiss: (i) => -50 + i * 0.3, coord: (i) => i * 0.3 + k * 7 });
  }
  return tubes.geometrie(THREE);
}

/* ---------------------------------------------------------------- matériau */

export function materiauLiane(THREE, { mobile, cle = 'liane' }) {
  const m = new THREE.MeshPhysicalMaterial({
    color: 0x087048, roughness: 0.32, metalness: 0, specularIntensity: 0.55,
    sheen: 0.5, sheenRoughness: 0.45, sheenColor: new THREE.Color(0x6fe0b0).multiplyScalar(0.25),
    envMapIntensity: 0.16,
  });
  const u = {
    uCroiss: { value: 0 }, uQueue: { value: -100 }, uEpais: { value: 1 },
    uSeve: { value: new THREE.Color(0xa855f7) }, uSeveInt: { value: 2.5 }, uTeteInt: { value: 2.5 },
    uJade: { value: new THREE.Color(0x10b981) }, uLueurJade: { value: 0.05 },
    uLumDir: { value: new THREE.Vector3(0, 0, 1) }, uLumCouleur: { value: new THREE.Color(1, 1, 1) },
  };
  return greffer(m, {
    cle, uniforms: u,
    declVert: GLSL_VENT + `
      attribute vec4 aLiane; attribute vec3 aAxe;
      uniform float uCroiss; uniform float uQueue; uniform float uEpais;
      varying vec4 vLi; varying float vFront;`,
    vert: [['#include <begin_vertex>', `
      float kzFront = uCroiss - aLiane.x;
      float kzK = smoothstep(0.0, 0.8, kzFront) * smoothstep(uQueue, uQueue + 0.4, aLiane.x) * uEpais;
      vec3 transformed = aAxe + (position - aAxe) * kzK + kzBalance(aAxe);
      vLi = aLiane; vFront = kzFront;`]],
    declFrag: GLSL_BRUIT + GLSL_RELIEF + `
      uniform float uTemps;
      uniform vec3 uSeve; uniform float uSeveInt; uniform float uTeteInt;
      uniform vec3 uJade; uniform float uLueurJade; uniform vec3 uLumDir; uniform vec3 uLumCouleur;
      varying vec4 vLi; varying float vFront;`,
    frag: [
      ['#include <color_fragment>', `#include <color_fragment>
        float kzGr = kzBruit(vec3(vLi.z * 6.0, vLi.w * 9.0, 0.0));
        float kzStrie = 0.5 + 0.5 * sin(vLi.w * 6.2831853 * 8.0 + kzGr * 2.0);
        diffuseColor.rgb *= 0.78 + 0.32 * kzGr - 0.12 * kzStrie;`],
      ['#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        float kzH = kzStrie * 0.6 + kzBruit(vec3(vLi.z * 70.0, vLi.w * 40.0, 3.0)) * 0.25;
        normal = kzRelief(-vViewPosition, normal, kzH, 0.35, faceDirection);`],
      ['#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        vec3 kzVv = normalize(vViewPosition);
        float kzCoeur = pow(clamp(dot(normal, kzVv), 0.0, 1.0), 1.5);
        float kzPu = pow(0.5 + 0.5 * sin((vLi.x * 0.30 - uTemps * 0.42) * 6.2831853), 7.0);
        float kzPu2 = pow(0.5 + 0.5 * sin((vLi.x * 0.11 - uTemps * 0.17) * 6.2831853 + 1.3), 6.0);
        float kzTete = vFront > 0.0 ? exp(-vFront * 2.0) : 0.0;
        float kzAme = pow(kzCoeur, 2.2);
        totalEmissiveRadiance += uSeve * (uSeveInt * (0.3 + 2.2 * kzPu + 0.4 * kzPu2) * (0.05 + 0.95 * kzAme) + uTeteInt * kzTete * (0.4 + 0.6 * kzCoeur));
        totalEmissiveRadiance += uJade * uLueurJade * (0.3 + 0.7 * kzCoeur) * (0.8 + 0.4 * kzGr);
        float kzContre = pow(clamp(dot(-kzVv, uLumDir), 0.0, 1.0), 3.0);
        totalEmissiveRadiance += vec3(0.25, 0.85, 0.55) * uJade * uLumCouleur * (kzContre * (0.15 + 0.85 * (1.0 - kzCoeur)) * 0.45 + 0.05 * (0.5 + 0.5 * dot(normal, uLumDir))) * (0.75 + 0.5 * kzGr);`],
    ],
  });
}
