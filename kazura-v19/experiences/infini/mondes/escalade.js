// Niveau 5 : Bloc Altitude, une salle d'escalade à Grenoble, en fin d'après-midi.
// Un grand mur de prises multicolores avec ses dévers, les tapis bleus, les cordes, la magnésie qui flotte dans le soleil
// qui entre par les hautes fenêtres. On remonte le mur jusqu'à la grande baie : porte = LA VITRE (rectangle).
import { THREE, U, BRUIT, halo, particules, proc, environnement, porteRect, reflet, rayon } from './outils.js';

export function construire(ctx) {
  const { a, renderer, mobile } = ctx;
  const racine = new THREE.Group();
  const SOL = -1.6, MUR = -10, HM = 5.2;
  const env = environnement(renderer, { bas: '#3a4048', horizon: '#ffd8a8', haut: '#b9d3ea', soleil: [0.7, 0.35, -0.4], soleilCouleur: '#ffd29a', panneaux: [[[3, 3, -2], '#fff3dc', [3, 2]]] });

  const beton = proc(new THREE.MeshStandardMaterial({ color: '#c9c2b8', roughness: 0.9 }), `
    vec3 albedo(vec3 p, vec3 base){ float n = fbm(p.xy*1.5); vec2 q = p.xy/vec2(2.4, 1.2); vec2 f = fract(q); float j = smoothstep(0.0, 0.006, f.x)*smoothstep(0.0, 0.012, f.y);
      return base*(0.8 + 0.25*n)*mix(0.75, 1.0, j); }`, 'beton');
  // les panneaux du mur : contreplaqué peint, grille d'inserts
  const panneau = (c, k) => proc(new THREE.MeshStandardMaterial({ color: c, roughness: 0.75 }), `
    vec3 albedo(vec3 p, vec3 base){ vec2 g = fract(p.xy*5.0) - 0.5; float t = smoothstep(0.05, 0.03, length(g));
      vec2 q = p.xy/vec2(1.22, 2.44); vec2 f = fract(q); float j = smoothstep(0.0, 0.01, f.x)*smoothstep(0.0, 0.006, f.y);
      return base*(0.88 + 0.18*fbm(p.xy*3.0 + ${k}.0))*mix(0.6, 1.0, j)*(1.0 - 0.55*t); }`, 'panneau' + k);
  const couleursP = ['#3b4a5c', '#e9e4da', '#2d6f73', '#d9705a', '#4a3f63', '#e9e4da'];

  // sol, tapis, mur haut en béton
  const sol = new THREE.Mesh(new THREE.PlaneGeometry(40, 30), new THREE.MeshStandardMaterial({ color: '#50555c', roughness: 0.8 })); sol.rotation.x = -Math.PI / 2; sol.position.set(0, SOL, -5); racine.add(sol);
  const tapisM = proc(new THREE.MeshStandardMaterial({ color: '#2b4f8f', roughness: 0.65 }), `vec3 albedo(vec3 p, vec3 base){ float j = smoothstep(0.0, 0.02, abs(fract(p.x/2.0) - 0.5) - 0.48); return base*(0.85 + 0.2*fbm(p.xz*2.0))*(1.0 - 0.4*j); }`, 'tapis');
  const tapis = new THREE.Mesh(new THREE.BoxGeometry(16, 0.35, 4), tapisM); tapis.position.set(0, SOL + 0.175, MUR + 2.2); racine.add(tapis);
  const haut = new THREE.Mesh(new THREE.PlaneGeometry(30, 16), beton); haut.position.set(0, SOL + 8, MUR - 0.8); racine.add(haut);

  // le mur d'escalade : des pans verticaux et en dévers
  const pans = [];
  const largeurs = [2.4, 2.6, 2.4, 2.8, 2.4, 2.6, 2.4];
  let x = -largeurs.reduce((s, v) => s + v, 0) / 2;
  const angles = [0.18, -0.12, 0.32, 0.0, 0.26, -0.1, 0.15];
  largeurs.forEach((w, i) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, HM), panneau(couleursP[i % couleursP.length], i));
    const g = new THREE.Group(); g.position.set(x + w / 2, SOL, MUR - 0.4); racine.add(g);
    m.position.y = HM / 2; g.add(m); g.rotation.x = angles[i];
    pans.push({ g, w }); x += w;
  });
  // les prises
  const prisesG = new THREE.IcosahedronGeometry(1, 1);
  const prisesM = new THREE.MeshStandardMaterial({ roughness: 0.55, envMap: env, envMapIntensity: 0.3 });
  const nP = mobile ? 380 : 620;
  const inst = new THREE.InstancedMesh(prisesG, prisesM, nP);
  const coul = ['#ff5a36', '#2f6bff', '#11a36a', '#ffd23f', '#ff4fb0', '#1a1a1a', '#ffffff', '#8e5cff', '#ff9a1f'];
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), c = new THREE.Color();
  racine.updateMatrixWorld(true);
  for (let k = 0; k < nP; k++) {
    const p = pans[k % pans.length];
    const lx = (Math.random() - 0.5) * p.w * 0.94, ly = 0.4 + Math.random() * (HM - 0.6);
    const s = Math.random() < 0.12 ? 0.18 + Math.random() * 0.18 : 0.045 + Math.random() * 0.07;
    v.set(lx, ly, 0.0).applyMatrix4(p.g.matrixWorld).sub(racine.position);
    e.set(p.g.rotation.x + Math.random() * 0.6, Math.random() * 6, Math.random() * 6); q.setFromEuler(e);
    m4.compose(v, q, new THREE.Vector3(s, s * (0.6 + Math.random() * 0.5), s * 0.45)); inst.setMatrixAt(k, m4);
    inst.setColorAt(k, c.set(coul[Math.floor(Math.random() * coul.length)]));
  }
  racine.add(inst);
  // les cordes qui pendent du haut
  const cordeM = new THREE.MeshStandardMaterial({ color: '#e04a3a', roughness: 0.8 });
  for (const [x2, c2] of [[-5.5, '#e04a3a'], [-1.6, '#2f6bff'], [2.3, '#ffd23f'], [6.1, '#11a36a']]) {
    const cd = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, HM + 0.6, 6), cordeM.clone()); cd.material.color.set(c2); cd.position.set(x2, SOL + (HM + 0.6) / 2 + 0.3, MUR + 0.35); racine.add(cd);
  }
  // les poutres du plafond
  const acier = new THREE.MeshStandardMaterial({ color: '#2a2e35', roughness: 0.5, metalness: 0.7, envMap: env });
  for (let z = MUR + 1; z < 1; z += 3) { const p2 = new THREE.Mesh(new THREE.BoxGeometry(30, 0.3, 0.18), acier); p2.position.set(0, SOL + HM + 6.8, z); racine.add(p2); }

  // LA BAIE en haut du mur (porte)
  let hh, w;
  if (a < 1) { hh = 1.25; w = 2 * hh * a; } else { w = Math.min(4.6, 2.2 * a); hh = w / a / 2; }
  const yB = SOL + HM + 0.65 + hh;
  const { mesh, porte } = porteRect(hh, a, { fond: ctx.fondSuivant }); mesh.position.set(0, yB, MUR - 0.78); racine.add(mesh);
  const cadre = (cw, ch, cx, cy) => { const b = new THREE.Mesh(new THREE.BoxGeometry(cw, ch, 0.14), acier); b.position.set(cx, cy, MUR - 0.72); racine.add(b); };
  cadre(w + 0.24, 0.12, 0, yB + hh + 0.06); cadre(w + 0.24, 0.12, 0, yB - hh - 0.06); cadre(0.12, 2 * hh, -w / 2 - 0.06, yB); cadre(0.12, 2 * hh, w / 2 + 0.06, yB);
  const refl = reflet(w, 2 * hh, { couleur: '#cfe2ff', couleur2: '#ffd9a8', opacite: 0.32 }); refl.position.set(0, yB, MUR - 0.76); racine.add(refl);
  const hB = halo('#ffe2b8', Math.max(w, 2 * hh) * 1.8, 0.25); hB.position.set(0, yB, MUR - 0.4); racine.add(hB);
  // de petites fenêtres hautes de part et d'autre, d'où vient le soleil
  for (const sx of [-1, 1]) {
    const f = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.0), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffe6c0').multiplyScalar(1.8) }));
    f.position.set(sx * (w / 2 + 2.6), yB + hh * 0.3, MUR - 0.79); racine.add(f);
  }

  // le soleil de fin d'après-midi, les rayons dans la magnésie
  racine.add(new THREE.HemisphereLight('#dfe8f5', '#6a5a4a', 1.3));
  const sol2 = new THREE.DirectionalLight('#ffcf94', 2.4); sol2.position.set(-4, 6, 3); racine.add(sol2);
  const fill = new THREE.PointLight('#ffe0b0', 12, 14, 1.4); fill.position.set(0, yB, MUR + 2); racine.add(fill);
  for (const [x3, op] of [[-3.2, 0.08], [3.4, 0.07], [0, 0.09]]) {
    const r = rayon({ longueur: 11, r0: 0.5, r1: 1.8, couleur: '#ffd9a0', opacite: op }); r.position.set(x3 + (x3 ? Math.sign(x3) * 2 : 0), yB + 0.5, MUR - 0.5); r.rotation.x = -0.75; r.rotation.z = -x3 * 0.06; racine.add(r);
  }
  racine.add(particules({ n: mobile ? 260 : 460, min: [-6, SOL, MUR], max: [6, yB + hh, -1], couleur: '#fff6e6', taille: 0.013, vitesse: [0.02, 0.03, 0.02], tremble: 0.15, scintille: 0.6 }));
  racine.add(particules({ n: 40, min: [-7, SOL + 1, MUR + 1], max: [7, yB, -2], couleur: '#fff1d6', taille: 0.35, forme: 'bokeh', opacite: 0.08, vitesse: [0.03, 0.01, 0], tremble: 0.3 }));

  const chemin = [
    { p: [0.3, -0.2, -2.4], c: [0, SOL + 2.4, MUR] },
    { p: [-0.6, SOL + 2.2, MUR + 6.4], c: [0, SOL + HM * 0.75, MUR] },
    { p: [0.4, yB - hh * 0.5, MUR + 4.2], c: [0, yB, MUR] },
  ];
  return {
    racine, porte, chemin, foyer: 9, fondScene: new THREE.Color('#d9c9b4'), brouillard: [new THREE.Color('#e6d4bc'), 7, 34],
    maj(t, e2) {
      const s = e2.sigma;
      refl.material.uniforms.uOp.value = 0.32 * (1 - THREE.MathUtils.smoothstep(s, 0.35, 0.85));
      hB.material.opacity = 1 - THREE.MathUtils.smoothstep(s, 0.2, 0.6);
    },
  };
}
