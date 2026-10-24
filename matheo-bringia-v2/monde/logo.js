/* Le protagoniste : le logo MB en 3D, extrudé depuis le vrai logo (logo-mb.json, vectorisé par
   outils/monde/vectoriser.py avec OpenCV).
   Trois couches :
     le CORPS   : la silhouette (le contour noir épais), la plus profonde, arêtes arrondies ; c'est elle qui change
                  de matière avec la partie de la page (carbone tissé, orange nacré du casque, alu brossé, gomme, or) ;
     les LETTRES: M et B en laque blanche, en relief devant le corps, arêtes arrondies ;
     le LISERÉ  : le coup de pinceau orange, posé à fleur sur le corps, qui luit un peu.
   L'extrusion est écrite ici (et non ExtrudeGeometry) pour des normales LISSES sur les courbes et nettes aux coins :
   les reflets de studio glissent sans facettes. */
import { HP } from './commun.js';

/* ------------------------------------------------------------ l'extrusion */
function orienter(boucle, ccw) {
  let a = 0;
  for (let i = 0; i < boucle.length; i++) { const p = boucle[i], q = boucle[(i + 1) % boucle.length]; a += p[0] * q[1] - q[0] * p[1]; }
  return (a > 0) === ccw ? boucle : boucle.slice().reverse();
}

/* sommets d'une boucle, dédoublés aux coins (angle > seuil) : chaque copie porte sa normale 2D */
function sommetsLisses(b, seuil = 0.6) {
  const n = b.length, out = [];
  for (let i = 0; i < n; i++) {
    const p = b[(i - 1 + n) % n], c = b[i], q = b[(i + 1) % n];
    let ax = c[0] - p[0], ay = c[1] - p[1], bx = q[0] - c[0], by = q[1] - c[1];
    const la = Math.hypot(ax, ay) || 1, lb = Math.hypot(bx, by) || 1;
    ax /= la; ay /= la; bx /= lb; by /= lb;
    // normales extérieures (boucle extérieure dans le sens trigonométrique) : (dy, -dx)
    const na = [ay, -ax], nb = [by, -bx];
    let mx = na[0] + nb[0], my = na[1] + nb[1];
    const lm = Math.hypot(mx, my) || 1; mx /= lm; my /= lm;
    // le décalage vers l'intérieur suit la bissectrice (onglet borné)
    const cosDemi = Math.max(0.35, mx * na[0] + my * na[1]);
    const onglet = [mx / cosDemi, my / cosDemi];
    const angle = Math.acos(Math.max(-1, Math.min(1, ax * bx + ay * by)));
    if (angle > seuil) {
      out.push({ p: c, n: na, o: onglet, coin: 1 });
      out.push({ p: c, n: nb, o: onglet, coin: 2 });
    } else out.push({ p: c, n: [mx, my], o: onglet, coin: 0 });
  }
  return out;
}

/* extrude une forme { contour, trous } entre z0 et z1, biseau arrondi de rayon b (anneaux k), devant et derrière */
function extruder(THREE, formes, { z0, z1, b = 0, anneaux = 4, dos = true }) {
  const pos = [], nor = [], idx = [];
  const ajout = (x, y, z, nx, ny, nz) => { pos.push(x, y, z); nor.push(nx, ny, nz); return pos.length / 3 - 1; };
  for (const f of formes) {
    const ext = orienter(f.contour, true), trous = f.trous.map((t) => orienter(t, false));
    // les parois (et les biseaux) de chaque boucle
    for (const boucle of [ext, ...trous]) {
      const S = sommetsLisses(boucle);
      // profil : de l'arrière (z0) à l'avant (z1) ; chaque anneau = (retrait, z, normale radiale, normale z)
      const profil = [];
      const K = b > 0 ? anneaux : 0;
      if (dos && K) for (let k = 0; k <= K; k++) { const t = (1 - k / K) * Math.PI / 2; profil.push([b * (1 - Math.cos(t)), z0 + b - b * Math.sin(t), Math.cos(t), -Math.sin(t)]); }
      else profil.push([0, z0, 1, 0]);
      if (K) for (let k = 0; k <= K; k++) { const t = (k / K) * Math.PI / 2; profil.push([b * (1 - Math.cos(t)), z1 - b + b * Math.sin(t), Math.cos(t), Math.sin(t)]); }
      else profil.push([0, z1, 1, 0]);
      const base = pos.length / 3, m = S.length;
      for (const [r, z, cr, cz] of profil) for (const s of S) ajout(s.p[0] - s.o[0] * r, s.p[1] - s.o[1] * r, z, s.n[0] * cr, s.n[1] * cr, cz);
      for (let a = 0; a < profil.length - 1; a++) for (let i = 0; i < m; i++) {
        const j = (i + 1) % m;
        // entre les deux copies d'un même coin : pas de face
        if (S[i].coin === 1 && S[j].coin === 2) continue;
        const A = base + a * m + i, B = base + a * m + j, C = base + (a + 1) * m + j, D = base + (a + 1) * m + i;
        idx.push(A, B, C, A, C, D);
      }
    }
    // les faces avant et arrière (retrait du biseau)
    const retrait = (boucle) => sommetsLisses(boucle).filter((s) => s.coin !== 2).map((s) => [s.p[0] - s.o[0] * b, s.p[1] - s.o[1] * b]);
    const cE = retrait(ext), cT = trous.map(retrait);
    const tri = THREE.ShapeUtils.triangulateShape(cE.map((p) => new THREE.Vector2(p[0], p[1])), cT.map((t) => t.map((p) => new THREE.Vector2(p[0], p[1]))));
    const tous = [...cE, ...cT.flat()];
    for (const [z, nz] of dos ? [[z1, 1], [z0, -1]] : [[z1, 1]]) {
      const base = pos.length / 3;
      for (const p of tous) ajout(p[0], p[1], z, 0, 0, nz);
      for (const t of tri) {
        const [a, bb, c] = t, pa = tous[a], pb = tous[bb], pc = tous[c];
        const cz = (pb[0] - pa[0]) * (pc[1] - pa[1]) - (pb[1] - pa[1]) * (pc[0] - pa[0]);
        if ((cz > 0) === (nz > 0)) idx.push(base + a, base + bb, base + c); else idx.push(base + a, base + c, base + bb);
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setIndex(idx);
  g.computeBoundingSphere();
  return g;
}

/* ------------------------------------------------------------ les matières du corps
   Une seule MeshPhysicalMaterial dont les réglages et le motif coulent entre cinq matières (poids continus) :
   carbone tissé (sergé 2x2, laqué), orange nacré du casque (paillettes, reflet qui vire à l'or), aluminium brossé
   (stries), gomme (mate, grain, traces), or du podium. Motif en coordonnées de l'objet : il colle au logo. */
const GLSL_MOTIFS = `
float mbH(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float mbB(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mbH(i), mbH(i + vec2(1.0, 0.0)), f.x), mix(mbH(i + vec2(0.0, 1.0)), mbH(i + vec2(1.0, 1.0)), f.x), f.y); }
`;
export function matiereCorps(THREE) {
  const m = new THREE.MeshPhysicalMaterial({ color: 0x111111, roughness: 0.3, metalness: 0.2, clearcoat: 1, clearcoatRoughness: 0.08, envMapIntensity: 1 });
  const U = { uP1: { value: new THREE.Vector4(1, 0, 0, 0) }, uOr: { value: 0 }, uTemps: { value: 0 }, uEclat: { value: 0 } };
  m.userData.U = U;
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vMbObj;\nvarying vec3 vMbNo;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvMbObj = position;\nvMbNo = normal;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vMbObj;\nvarying vec3 vMbNo;\nuniform vec4 uP1;\nuniform float uOr, uTemps, uEclat;\n' + GLSL_MOTIFS)
      .replace('#include <lights_physical_fragment>', `
      {
        float wC = uP1.x, wN = uP1.y, wA = uP1.z, wG = uP1.w, wO = uOr;
        float face = step(0.5, abs(vMbNo.z));
        vec2 q = mix(vec2(vMbObj.x + vMbObj.y, vMbObj.z * 3.0), vMbObj.xy, face);
        vec3 V = normalize(vViewPosition);
        float fres = pow(1.0 - clamp(dot(normal, V), 0.0, 1.0), 3.0);
        // carbone tissé : sergé 2x2, mèches de fibres qui accrochent la lumière selon leur sens
        vec2 pc = q * 115.0; vec2 ic = floor(pc), fc = fract(pc);
        float sens = step(2.0, mod(ic.x - ic.y, 4.0));
        float le = mix(fc.y, fc.x, sens);
        float fib = sin(le * 3.14159);
        vec3 cC = vec3(0.014, 0.015, 0.018) * (0.7 + 0.6 * fib) + vec3(0.004) * mbH(ic);
        vec3 nC = mix(vec3(0.0, cos(fc.y * 3.14159) * 0.22, 0.0), vec3(cos(fc.x * 3.14159) * 0.22, 0.0, 0.0), sens);
        // orange nacré : paillettes, et le reflet vire à l'or rasant
        vec2 pf = q * 520.0; float pail = step(0.93, mbH(floor(pf))) * (0.5 + 0.5 * sin(uTemps * 1.3 + mbH(floor(pf) + 3.1) * 40.0));
        vec3 cN = mix(vec3(0.95, 0.12, 0.006), vec3(1.0, 0.42, 0.08), fres) + vec3(1.0, 0.6, 0.3) * pail * 0.35;
        // aluminium brossé : stries fines dans un sens
        float st = mbB(vec2(q.x * 30.0, q.y * 1400.0)) * 0.6 + mbB(vec2(q.x * 90.0, q.y * 3200.0)) * 0.4;
        vec3 cA = vec3(0.8, 0.82, 0.85) * (0.92 + 0.12 * st);
        // gomme : noir mat, grain, traces plus lisses
        float gr = mbB(q * 260.0) * 0.6 + mbB(q * 40.0) * 0.4;
        float trace = smoothstep(0.55, 0.75, mbB(vec2(q.x * 3.0 + q.y * 1.5, q.y * 0.8) * 4.0));
        vec3 cG = vec3(0.022, 0.021, 0.02) * (0.7 + 0.5 * gr);
        // or du podium
        vec3 cO = vec3(1.0, 0.68, 0.24) * (0.92 + 0.12 * mbB(q * 30.0));
        float wT = max(1e-4, wC + wN + wA + wG + wO);
        diffuseColor.rgb = (cC * wC + cN * wN + cA * wA + cG * wG + cO * wO) / wT;
        roughnessFactor = (0.32 * wC + 0.34 * wN + (0.26 + 0.12 * st) * wA + mix(0.92, 0.6, trace) * wG + 0.2 * wO) / wT;
        metalnessFactor = (0.15 * wC + 0.45 * wN + 1.0 * wA + 0.0 * wG + 1.0 * wO) / wT;
        vec3 pert = nC * wC / wT + vec3(0.0, (st - 0.5) * 0.12, 0.0) * wA / wT + vec3(gr - 0.5, gr - 0.5, 0.0) * 0.18 * wG / wT;
        normal = normalize(normal + (viewMatrix * vec4(pert * face, 0.0)).xyz * 0.6);
        totalEmissiveRadiance += vec3(1.0, 0.45, 0.12) * uEclat * 0.6;
      }
      #include <lights_physical_fragment>
      {
        float wT = max(1e-4, uP1.x + uP1.y + uP1.z + uP1.w + uOr);
        material.clearcoat = (1.0 * uP1.x + 1.0 * uP1.y + 0.0 * uP1.z + 0.0 * uP1.w + 0.15 * uOr) / wT;
        material.clearcoatRoughness = 0.06;
      }`);
  };
  m.customProgramCacheKey = () => 'mb-corps-1';
  return m;
}

/* ------------------------------------------------------------ le logo entier */
export function creerLogo(THREE, donnees) {
  const groupe = new THREE.Group();
  const corps = new THREE.Mesh(extruder(THREE, donnees.silhouette, { z0: -0.13, z1: 0, b: 0.016, anneaux: 4 }), matiereCorps(THREE));
  const matLettres = new THREE.MeshPhysicalMaterial({ color: 0xf4f0ea, roughness: 0.22, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.1 });
  const lettres = new THREE.Mesh(extruder(THREE, donnees.lettres, { z0: -0.02, z1: 0.055, b: 0.013, anneaux: 4, dos: false }), matLettres);
  const matLisere = new THREE.MeshPhysicalMaterial({ color: 0xff5a14, emissive: 0xff4a0a, emissiveIntensity: 0.55, roughness: 0.35, metalness: 0.1, clearcoat: 0.6, envMapIntensity: 0.8 });
  const lisere = new THREE.Mesh(extruder(THREE, donnees.lisere, { z0: -0.004, z1: 0.009, b: 0, dos: false }), matLisere);
  for (const o of [corps, lettres, lisere]) { o.frustumCulled = false; groupe.add(o); }
  // le MB passe TOUJOURS devant le décor (il accompagne la caméra : jamais coupé par un panneau ou une barrière) :
  // dessiné après les autres objets opaques, la profondeur effacée juste avant lui (il garde la sienne)
  corps.renderOrder = 100; lettres.renderOrder = 101; lisere.renderOrder = 102;
  corps.onBeforeRender = (renderer) => { if (groupe.userData.devant !== false) renderer.clearDepth(); };
  // le pivot : centre de la silhouette ; hauteur 1
  return { groupe, corps, lettres, lisere, matCorps: corps.material, matLettres, matLisere, largeur: donnees.largeur };
}

/* la silhouette au sol (ombre douce sous le logo) : un disque flou */
export function creerOmbre(THREE) {
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { uForce: { value: 0.8 } },
    vertexShader: HP + 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: HP + 'uniform float uForce; varying vec2 vUv; void main(){ vec2 d = (vUv - 0.5) * vec2(2.0, 2.0); float r = dot(d, d); gl_FragColor = vec4(0.0, 0.0, 0.0, uForce * exp(-r * 3.5) * (1.0 - smoothstep(0.8, 1.0, r))); }',
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
  m.rotation.x = -Math.PI / 2;
  m.renderOrder = 2;
  return m;
}
