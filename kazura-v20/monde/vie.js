/* Kazura v13, la Scène : ce qui vit autour du sceau.
   - les traits de construction de l'ouverture : cercles, axes, triangle des folioles, tangentes et une
     grille fine, qui se dessinent pendant que la vrille fait le tour de l'anneau, puis s'effacent ;
   - les vrilles : de petites tiges de kudzu qui partent de l'anneau, s'enroulent en spirale et portent
     quelques feuilles ; elles poussent, se balancent, se retirent avant le monde clair et repoussent ;
   - l'essaim : des lucioles en orbite autour du sceau, à plusieurs vitesses. */
import { hasard } from './commun.js';
import { Tubes, materiauLiane, RAYON_SCEAU, ANGLE_SORTIE } from './liane.js';
import { construireFeuilles } from './feuilles.js';

const K = RAYON_SCEAU / 48;

/* ------------------------------------------------------------------ traits de construction */
export function creerConstruction(THREE) {
  const u = { uProg: { value: 0 }, uFondu: { value: 0 }, uPx: { value: 0.004 }, uCouleur: { value: new THREE.Color(0xd9ccff) }, uTemps: { value: 0 } };
  const m = new THREE.ShaderMaterial({
    uniforms: u, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: /* glsl */ `varying vec2 vP; void main() { vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform float uProg; uniform float uFondu; uniform float uPx; uniform vec3 uCouleur; uniform float uTemps;
      varying vec2 vP;
      const float K = ${K.toFixed(6)};
      float trait(float d, float w) { float aa = fwidth(d) + 1e-5; return 1.0 - smoothstep(w * aa, (w + 1.2) * aa, abs(d)); }
      /* cercle révélé par l'angle (dans le sens de la vrille, depuis le bas droit) */
      float cercle(vec2 p, float r, float prog, float a0) {
        float a = fract((atan(p.y, p.x) - a0) / 6.2831853);
        return trait(length(p) - r, 0.6) * step(a, prog);
      }
      /* segment révélé depuis son milieu */
      float seg(vec2 p, vec2 a, vec2 b, float prog) {
        vec2 ab = b - a; float l = length(ab); vec2 t = ab / l;
        float s = dot(p - a, t); vec2 n = vec2(-t.y, t.x);
        float m = abs(s / l - 0.5) * 2.0;
        return trait(dot(p - a, n), 0.6) * step(m, prog) * step(0.0, s) * step(s, l);
      }
      void main() {
        vec2 p = vP;
        float r = length(p);
        float P = uProg;
        float a0 = -1.0472;
        float c = 0.0;
        c += cercle(p, 48.0 * K, clamp(P * 1.15, 0.0, 1.0), a0) * 0.9;
        c += cercle(p, 42.0 * K, clamp(P * 1.15 - 0.08, 0.0, 1.0), a0) * 0.6;
        c += cercle(p, 45.0 * K, clamp(P * 1.2 - 0.25, 0.0, 1.0), a0 + 3.1) * 0.35;
        c += cercle(p, 64.0 * K, clamp(P * 1.3 - 0.35, 0.0, 1.0), 1.5708) * 0.4;
        c += cercle(p, 30.0 * K, clamp(P * 1.4 - 0.45, 0.0, 1.0), 0.0) * 0.3;
        c += cercle(p, 4.6 * K, clamp(P * 2.0 - 1.0, 0.0, 1.0), 0.0) * 0.6;
        // axes des folioles (90, 210, 330 degrés) et leurs perpendiculaires
        for (int i = 0; i < 3; i++) {
          float a = 1.5708 + float(i) * 2.0944;
          vec2 d = vec2(cos(a), sin(a));
          c += seg(p, -d * 80.0 * K, d * 80.0 * K, clamp(P * 1.4 - 0.1 - float(i) * 0.08, 0.0, 1.0)) * 0.45;
          vec2 q = vec2(cos(a + 1.0472), sin(a + 1.0472)) * 43.0 * K;
          vec2 q2 = vec2(cos(a + 3.1416), sin(a + 3.1416)) * 43.0 * K;
          // le triangle qui relie les pointes des folioles
          c += seg(p, d * 43.0 * K, vec2(cos(a + 2.0944), sin(a + 2.0944)) * 43.0 * K, clamp(P * 1.5 - 0.5, 0.0, 1.0)) * 0.4;
        }
        // tangentes horizontales et verticales, qui débordent largement
        c += seg(p, vec2(-120.0 * K, 48.0 * K), vec2(120.0 * K, 48.0 * K), clamp(P * 1.3 - 0.2, 0.0, 1.0)) * 0.3;
        c += seg(p, vec2(-120.0 * K, -48.0 * K), vec2(120.0 * K, -48.0 * K), clamp(P * 1.3 - 0.3, 0.0, 1.0)) * 0.3;
        c += seg(p, vec2(48.0 * K, -100.0 * K), vec2(48.0 * K, 100.0 * K), clamp(P * 1.3 - 0.25, 0.0, 1.0)) * 0.3;
        c += seg(p, vec2(-48.0 * K, -100.0 * K), vec2(-48.0 * K, 100.0 * K), clamp(P * 1.3 - 0.35, 0.0, 1.0)) * 0.3;
        // grille fine qui s'étend depuis le centre
        vec2 g = abs(fract(p / (12.0 * K) + 0.5) - 0.5) * 12.0 * K;
        float gr = 1.0 - smoothstep(0.0, fwidth(p.x) * 1.2 + 1e-5, min(g.x, g.y));
        gr *= smoothstep(P * 110.0 * K, P * 110.0 * K - 30.0 * K, r) * exp(-r * r * 0.35) * 0.22;
        // petites croix aux nœuds de la grande grille
        vec2 h = abs(fract(p / (24.0 * K) + 0.5) - 0.5) * 24.0 * K;
        float croix = (1.0 - smoothstep(0.0, fwidth(p.x) * 1.5 + 1e-5, min(h.x, h.y))) * step(max(h.x, h.y), 2.2 * K);
        croix *= smoothstep(P * 120.0 * K, P * 120.0 * K - 20.0 * K, r) * exp(-r * r * 0.2) * 0.6;
        float v = (c + gr + croix) * uFondu;
        gl_FragColor = vec4(uCouleur * v * 0.55, 1.0);
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(260 * K, 260 * K), m);
  mesh.position.z = -0.06;
  mesh.renderOrder = 4;
  mesh.frustumCulled = false;
  return { mesh, u };
}

/* ------------------------------------------------------------------ vrilles */
export function creerVrilles(THREE, { mobile, lumiere }) {
  const alea = hasard(613);
  const tubes = new Tubes(mobile ? 6 : 9);
  const V3 = THREE.Vector3;
  const attaches = [];
  // la première sort là où partait la liane de la v12 (bas droit), comme à la fin de l'ouverture
  const angles = [ANGLE_SORTIE, 0.55, 1.9, 2.75, 3.75, 4.6];
  const nb = mobile ? 5 : 6;
  let nais = 0;
  for (let k = 0; k < nb; k++) {
    const a0 = angles[k] + (k ? (alea() - 0.5) * 0.3 : 0);
    const rad = new V3(Math.cos(a0), Math.sin(a0), 0);
    const tan = new V3(-Math.sin(a0), Math.cos(a0), 0);
    const p = rad.clone().multiplyScalar(RAYON_SCEAU * 0.985).add(new V3(0, 0, (alea() - 0.5) * 0.06));
    const sens = alea() < 0.5 ? 1 : -1;
    let dir = rad.clone().multiplyScalar(0.75).addScaledVector(tan, sens * 0.55).add(new V3(0, 0, 0.25 + alea() * 0.25)).normalize();
    const axe = new V3(0, 0, 1).cross(dir).normalize().multiplyScalar(-1);
    const longueur = (k === 0 ? 1.5 : 0.9 + alea() * 0.8) * (mobile ? 0.9 : 1);
    const ds = 0.025;
    const pts = [];
    const q = p.clone();
    for (let s = 0; s <= longueur; s += ds) {
      pts.push(q.clone());
      const f = s / longueur;
      const courbe = (0.5 + (f > 0.55 ? Math.pow((f - 0.55) / 0.45, 2) * 16 : 0)) * sens;
      dir.applyAxisAngle(new V3(0, 0, 1), courbe * ds);
      dir.applyAxisAngle(axe, Math.sin(s * 3 + k) * 0.03);
      q.addScaledVector(dir, ds);
    }
    const m = pts.length;
    const base = k === 0 ? 0.034 : 0.022 + alea() * 0.006;
    const n0 = nais;
    tubes.ajouter(THREE, pts, {
      rayon: (i) => base * (1 - 0.8 * i / (m - 1)) + 0.003,
      naiss: (i) => n0 + i * ds,
      coord: (i) => i * ds + k,
    });
    // deux feuilles sur la partie droite de chaque vrille
    const nf = k === 0 ? 2 : 0;
    for (let j = 0; j < nf; j++) {
      const s = longueur * (0.18 + 0.2 * j);
      const i = Math.min(m - 2, Math.round(s / ds));
      const t = new V3().subVectors(pts[i + 1], pts[i]).normalize();
      const cote = new V3(0, 0, 1).cross(t).multiplyScalar(j % 2 ? 1 : -1);
      attaches.push({ p: pts[i].clone(), dir: cote.add(new V3(0, 0, 0.6)).addScaledVector(t, 0.3).normalize(), naiss: n0 + s + 0.15, taille: (k === 0 ? 0.55 : 0.42) * (0.85 + alea() * 0.3) });
    }
    nais += k === 0 ? 0.25 : 0.35;
  }
  const geo = tubes.geometrie(THREE);
  const mat = materiauLiane(THREE, { mobile, cle: 'vrilles' });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  const feuilles = construireFeuilles(THREE, attaches, { mobile, lumiere });
  return { mesh, materiau: mat, feuilles, longueur: nais + 2.2 };
}

/* ------------------------------------------------------------------ essaim de lucioles en orbite */
export function creerEssaim(THREE, { mobile }) {
  const alea = hasard(77);
  const n = mobile ? 260 : 620;
  const pos = new Float32Array(n * 3), gr = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) {
    const r = RAYON_SCEAU * (1.08 + Math.pow(alea(), 1.6) * 1.6);
    pos.set([r, (alea() - 0.5) * 0.9 * (r / RAYON_SCEAU - 0.6), (alea() - 0.5) * 1.6], i * 3);
    gr.set([alea() * Math.PI * 2, 0.6 + alea() * 0.8, alea(), alea()], i * 4);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aGr', new THREE.BufferAttribute(gr, 4));
  const u = { uTemps: { value: 0 }, uCouleur: { value: new THREE.Color(0xc084fc) }, uCouleur2: { value: new THREE.Color(0xffe2a0) }, uInt: { value: 0 }, uTaille: { value: 1 }, uVitesse: { value: 1 } };
  const m = new THREE.ShaderMaterial({
    uniforms: u, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
    vertexShader: /* glsl */ `
      attribute vec4 aGr; uniform float uTemps; uniform float uTaille; uniform float uVitesse;
      varying float vA; varying float vT;
      void main() {
        float r = position.x;
        float w = (0.18 / pow(r, 1.2)) * aGr.y * uVitesse;
        float a = aGr.x + uTemps * w;
        vec3 p = vec3(cos(a) * r, sin(a) * r * 0.92 + position.y, position.z + sin(uTemps * 0.5 + aGr.x * 3.0) * 0.12);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        float sc = pow(0.5 + 0.5 * sin(uTemps * (1.2 + aGr.w * 2.5) + aGr.z * 40.0), 3.0);
        vA = 0.2 + 0.8 * sc;
        vT = aGr.z;
        gl_PointSize = uTaille * (1.6 + 3.2 * aGr.z * aGr.z) * (7.0 / max(-mv.z, 0.5));
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uCouleur; uniform vec3 uCouleur2; uniform float uInt; varying float vA; varying float vT;
      void main() {
        float r = length(gl_PointCoord - 0.5) * 2.0;
        float a = exp(-r * r * 6.0) + 0.7 * exp(-r * r * 45.0);
        vec3 c = mix(uCouleur, uCouleur2, step(0.82, vT));
        gl_FragColor = vec4(mix(c, vec3(1.0), 0.25) * a * vA * uInt, 1.0);
      }`,
  });
  const pts = new THREE.Points(g, m);
  pts.frustumCulled = false;
  pts.renderOrder = 8;
  return { mesh: pts, u };
}

/* ------------------------------------------------------------------ v20 : la liane qui enlace le sceau
   « Qui fait votre site » : la liane de kudzu grimpe, s'accroche et va chercher la lumière. Une tige s'enroule
   autour de l'anneau (une hélice qui passe devant et derrière lui), du bas droit (là où partait la liane de
   l'ouverture) jusqu'en haut à gauche ; quelques feuilles y poussent l'une après l'autre ; au bout, une vrille
   quitte l'anneau et monte vers la lumière en spirale. La croissance (uCroiss) suit le défilement. */
export function creerEnlace(THREE, { mobile, lumiere }) {
  const V3 = THREE.Vector3;
  const tubes = new Tubes(mobile ? 6 : 8);
  const RM = RAYON_SCEAU * 45 / 48;
  const a0 = ANGLE_SORTIE - 0.15, a1 = Math.PI * 0.78;   // du bas droit, dans le sens direct, jusqu'en haut à gauche
  const tours = 5.5, ds = 0.02;
  const pts = [];
  const nArc = Math.round((a1 - a0) * RM / 0.012);
  for (let i = 0; i <= nArc; i++) {
    const f = i / nArc, a = a0 + (a1 - a0) * f, ph = f * tours * Math.PI * 2 - Math.PI / 2;
    const rr = RM + 0.125 * Math.cos(ph), z = 0.155 * Math.sin(ph);
    pts.push(new V3(Math.cos(a) * rr, Math.sin(a) * rr, z));
  }
  // la vrille du bout : elle quitte l'anneau vers le haut et s'enroule sur elle-même (elle va chercher la lumière)
  const fin = pts[pts.length - 1].clone();
  let dir = new V3(-Math.sin(a1), Math.cos(a1), 0).multiplyScalar(0.6).add(new V3(Math.cos(a1), Math.sin(a1), 0).multiplyScalar(0.5)).add(new V3(0.15, 0.6, 0.25)).normalize();
  const q = fin.clone();
  const lv = 1.05;
  for (let t = ds; t <= lv; t += ds) {
    const f = t / lv;
    dir.applyAxisAngle(new V3(0, 0, 1), -(0.6 + Math.pow(f, 2.2) * 9) * ds);
    q.addScaledVector(dir, ds);
    pts.push(q.clone());
  }
  const L = [0];
  for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + pts[i].distanceTo(pts[i - 1]));
  const total = L[L.length - 1];
  tubes.ajouter(THREE, pts, {
    rayon: (i) => 0.026 * (1 - 0.75 * Math.pow(L[i] / total, 1.4)) + 0.004,
    naiss: (i) => L[i],
    coord: (i) => L[i] * 1.3,
  });
  // les feuilles : là où la tige passe devant l'anneau, tournées vers l'extérieur et vers nous
  const attaches = [];
  const nf = mobile ? 5 : 7;
  for (let k = 0; k < nf; k++) {
    const f = (k + 0.7) / (nf + 0.4) * 0.92;
    const i = Math.min(nArc - 1, Math.round(f * nArc / (0.25 + 0.75)) );
    // le passage devant le plus proche
    let j = i, meilleur = -1e9;
    for (let d = -20; d <= 20; d++) { const jj = Math.min(nArc - 1, Math.max(0, i + d)); if (pts[jj].z > meilleur) { meilleur = pts[jj].z; j = jj; } }
    const a = Math.atan2(pts[j].y, pts[j].x);
    const rad = new V3(Math.cos(a), Math.sin(a), 0);
    const tan = new V3().subVectors(pts[j + 1], pts[j]).normalize();
    attaches.push({ p: pts[j].clone(), dir: rad.multiplyScalar(0.9).add(new V3(0, 0, 0.75)).addScaledVector(tan, k % 2 ? 0.35 : -0.35).normalize(), naiss: L[j] + 0.12, taille: 0.36 + 0.06 * ((k * 7) % 3) });
  }
  // une dernière feuille au bout de la vrille, vers la lumière
  const iv = pts.length - Math.round(0.45 / ds);
  attaches.push({ p: pts[iv].clone(), dir: new V3(0.1, 1, 0.5).normalize(), naiss: L[iv] + 0.1, taille: 0.42 });
  const geo = tubes.geometrie(THREE);
  const mat = materiauLiane(THREE, { mobile, cle: 'vrilles' });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  const feuilles = construireFeuilles(THREE, attaches, { mobile, lumiere });
  return { mesh, materiau: mat, feuilles, longueur: total + 0.6 };
}
