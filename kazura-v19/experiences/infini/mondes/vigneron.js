// Niveau 8 : le Clos des Brumes, un vigneron du Beaujolais, au coucher du soleil.
// Les rangs de vigne qui filent vers les collines bleutées, la brume dans les creux, le soleil rasant, la terrasse en bois,
// la bouteille et le verre de gamay qui s'allume à contre-jour. Porte : LE VIN DANS LE VERRE (rond, vu d'au-dessus).
import { THREE, U, BRUIT, ciel, halo, particules, toile, proc, environnement, porteRonde, ombre } from './outils.js';

export function construire(ctx) {
  const { a, renderer, mobile } = ctx;
  const racine = new THREE.Group();
  const SOL = -1.5, TABLE = -0.5;
  const env = environnement(renderer, { bas: '#3a2418', horizon: '#ff9a5a', haut: '#3a4a7a', soleil: [0, 0.05, -1], soleilCouleur: '#ffb070', panneaux: [[[0, 2, 2], '#ffd6a0', [2, 1]]] });

  racine.add(ciel({ bas: '#5a3a3a', horizon: '#ffb070', haut: '#2e3d72', soleil: [0.05, 0.035, -1], soleilCouleur: '#ffcf8a', soleilTaille: 0.012, halo: 1.6, nuages: 0.8, nuageCouleur: '#ff9f8a' }));

  // les collines en couches, de plus en plus bleues dans la brume
  const colline = (z, y, amp, coul, graine, brume) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(400, 60), new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, fog: false, uniforms: { uC: { value: new THREE.Color(coul) }, uB: { value: new THREE.Color('#ffb98a') }, uA: { value: amp }, uG: { value: graine }, uBr: { value: brume } },
      vertexShader: `precision highp float; varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: `precision highp float; varying vec2 vP; uniform vec3 uC, uB; uniform float uA, uG, uBr; ${BRUIT}
        void main(){ float crete = uA*(fbm(vec2(vP.x*0.012 + uG, uG)) - 0.3) + uA*0.25*bruit(vec2(vP.x*0.06, uG));
          float a = smoothstep(crete + 0.3, crete - 0.3, vP.y);
          vec3 c = mix(uC, uB, uBr*smoothstep(crete - 18.0, crete, vP.y));
          gl_FragColor = vec4(c, a); }`,
    }));
    m.position.set(0, y, z); racine.add(m); m.renderOrder = -5 + z * 0.001;
  };
  colline(-260, SOL + 2, 40, '#6a6a9a', 1.3, 0.75);
  colline(-170, SOL - 4, 30, '#5a4f7a', 4.1, 0.6);
  colline(-100, SOL - 8, 22, '#4a3a52', 7.2, 0.45);
  // la brume dans les creux
  const brumeT = toile(32, 128, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(255,200,170,0)'); g.addColorStop(0.6, 'rgba(255,190,160,0.5)'); g.addColorStop(1, 'rgba(255,190,160,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); });
  for (const [z, y, h] of [[-90, SOL - 6, 14], [-150, SOL - 2, 16]]) { const b = new THREE.Mesh(new THREE.PlaneGeometry(400, h), new THREE.MeshBasicMaterial({ map: brumeT, transparent: true, depthWrite: false, fog: false })); b.position.set(0, y, z); racine.add(b); }

  // le coteau et ses rangs de vigne
  const terre = proc(new THREE.MeshStandardMaterial({ color: '#9a6a44', roughness: 0.95 }), `vec3 albedo(vec3 p, vec3 base){ return base*(0.7 + 0.4*fbm(p.xy*0.6)); }`, 'terre');
  const coteau = new THREE.Mesh(new THREE.PlaneGeometry(200, 120, 40, 20), terre); coteau.rotation.x = -Math.PI / 2; coteau.position.set(0, SOL - 0.3, -60);
  { const p = coteau.geometry.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i); p.setZ(i, -Math.max(0, (y + 60)) * 0.1 + Math.sin(p.getX(i) * 0.05) * 1.5); } coteau.geometry.computeVertexNormals(); }
  racine.add(coteau);
  const ceps = new THREE.IcosahedronGeometry(1, 1);
  const vigneM = new THREE.MeshStandardMaterial({ color: '#6a8a34', roughness: 0.75, emissive: '#7a3a08', emissiveIntensity: 0.35 });
  const nR = 22, parR = mobile ? 34 : 54;
  const vignes = new THREE.InstancedMesh(ceps, vigneM, nR * parR);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), c = new THREE.Color(); let k = 0;
  for (let r = 0; r < nR; r++) for (let i = 0; i < parR; i++) {
    const x = (r - nR / 2) * 2.2 + 1.1, z = -10 - i * 1.6 * (1 + i * 0.03);
    const y = SOL - 0.3 + Math.max(0, -z - 6) * 0.1 * 0.98 + Math.sin(x * 0.05) * 1.5 + 0.42;
    const s = 0.4 + Math.random() * 0.18;
    m4.compose(new THREE.Vector3(x + (Math.random() - 0.5) * 0.3, y, z), q.setFromEuler(new THREE.Euler(0, Math.random() * 6, 0)), new THREE.Vector3(s, s * 0.9, s * 0.8));
    vignes.setMatrixAt(k, m4); vignes.setColorAt(k++, c.setHSL(0.17 + Math.random() * 0.07, 0.5, 0.42 + Math.random() * 0.14));
  }
  racine.add(vignes);

  // la terrasse : planches, table, bouteille, verre
  const bois = proc(new THREE.MeshStandardMaterial({ color: '#8a5a3a', roughness: 0.6, envMap: env, envMapIntensity: 0.4 }), `
    vec3 albedo(vec3 p, vec3 base){ float pl = fract(p.x*3.0); float j = smoothstep(0.0, 0.04, pl)*smoothstep(1.0, 0.96, pl); float g = fbm(vec2(p.x*20.0, p.y*1.2));
      return base*(0.7 + 0.4*g)*(0.85 + 0.2*h21(vec2(floor(p.x*3.0))))*mix(0.4, 1.0, j); }`, 'table');
  const table = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.06, 1.3), bois); table.position.set(0, TABLE - 0.03, -2.6); racine.add(table);
  const pied = new THREE.Mesh(new THREE.BoxGeometry(0.1, TABLE - SOL, 0.1), bois); for (const [x, z] of [[-1.15, -2.05], [1.15, -2.05], [-1.15, -3.15], [1.15, -3.15]]) { const p = pied.clone(); p.position.set(x, (TABLE + SOL) / 2 - 0.03, z); racine.add(p); }
  const soleil = new THREE.DirectionalLight('#ffb070', 3.0); soleil.position.set(0.3, 0.6, -6); racine.add(soleil);
  racine.add(new THREE.HemisphereLight('#c9b0d8', '#8a5a34', 1.6));
  const contre = new THREE.DirectionalLight('#ffd0a0', 1.4); contre.position.set(-2, 3, 4); racine.add(contre);
  const avant = new THREE.PointLight('#ffcf9a', 2, 4, 1.5); avant.position.set(0.4, TABLE + 0.6, -1.6); racine.add(avant);

  // la bouteille
  const verreB = new THREE.MeshPhysicalMaterial({ color: '#1e3a1a', roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0.85, envMap: env, envMapIntensity: 1.6, clearcoat: 1 });
  const prof = [[0, 0], [0.038, 0], [0.04, 0.005], [0.04, 0.2], [0.036, 0.235], [0.016, 0.27], [0.014, 0.32], [0.016, 0.325], [0, 0.325]].map(([x, y]) => new THREE.Vector2(x, y));
  const bout = new THREE.Mesh(new THREE.LatheGeometry(prof, 40), verreB); bout.position.set(-0.32, TABLE, -2.8); racine.add(bout);
  const etiq = toile(512, 256, (x, w, h) => { x.fillStyle = '#f4ede1'; x.fillRect(0, 0, w, h); x.fillStyle = '#5b1a2b'; x.textAlign = 'center'; x.font = '500 46px Newsreader, serif'; x.fillText('CLOS DES BRUMES', w / 2, 110); x.fillStyle = '#8f6a2c'; x.font = 'italic 400 40px Newsreader, serif'; x.fillText('Gamay 2024', w / 2, 170); });
  const et = new THREE.Mesh(new THREE.CylinderGeometry(0.0405, 0.0405, 0.08, 40, 1, true, -1.2, 2.4), new THREE.MeshStandardMaterial({ map: etiq, roughness: 0.8 })); et.position.set(-0.32, TABLE + 0.11, -2.8); et.rotation.y = 0.3; racine.add(et);
  const ob = ombre(0.2, 0.2, 0.5); ob.position.set(-0.3, TABLE + 0.002, -2.75); racine.add(ob);
  // une grappe dans une coupelle
  const grain = new THREE.MeshStandardMaterial({ color: '#3a1a3a', roughness: 0.3, envMap: env, envMapIntensity: 0.8 });
  for (let i = 0; i < 18; i++) { const g = new THREE.Mesh(new THREE.SphereGeometry(0.011, 10, 8), grain); const ly = Math.floor(i / 5); g.position.set(0.32 + (Math.random() - 0.5) * 0.06 * (1 - ly * 0.2), TABLE + 0.012 + ly * 0.016, -2.75 + (Math.random() - 0.5) * 0.06); racine.add(g); }

  // LE VERRE et le vin (porte : la surface du vin, ronde)
  const R = 0.034;
  const verre = new THREE.Group(); verre.position.set(0.08, TABLE, -2.55); racine.add(verre);
  const profV = [[0.032, 0], [0.033, 0.003], [0.004, 0.006], [0.004, 0.09], [0.012, 0.1], [0.038, 0.12], [0.046, 0.15], [0.043, 0.19], [0.036, 0.22]].map(([x, y]) => new THREE.Vector2(x, y));
  const cristal = new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.02, metalness: 0, transparent: true, opacity: 0.22, envMap: env, envMapIntensity: 2.2, side: THREE.DoubleSide, depthWrite: false });
  const coupe = new THREE.Mesh(new THREE.LatheGeometry(profV, 48), cristal); coupe.renderOrder = 8; verre.add(coupe);
  // le corps du vin sous la surface
  const yV = 0.148;
  const profW = [[0.0, 0.103], [0.012, 0.103], [0.036, 0.122], [0.0455, 0.148], [0, 0.148]].map(([x, y]) => new THREE.Vector2(x, y));
  const vin = new THREE.Mesh(new THREE.LatheGeometry(profW, 48), new THREE.MeshStandardMaterial({ color: '#5a0a1a', roughness: 0.2, emissive: '#c4203a', emissiveIntensity: 0.55, transparent: true, opacity: 0.92, envMap: env })); verre.add(vin);
  // la surface du vin : la porte ; son rayon remplit presque le verre à ce niveau
  const { mesh, porte } = porteRonde(R, a, { fond: ctx.fondSuivant });
  mesh.rotation.x = -Math.PI / 2; mesh.position.y = yV + 0.0005; verre.add(mesh);
  porte.mat.uniforms.uTeinte.value.set(1.0, 0.45, 0.5);
  const lisere = new THREE.Mesh(new THREE.RingGeometry(R, 0.0456, 64), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ff5a6a').multiplyScalar(0.9) })); lisere.rotation.x = -Math.PI / 2; lisere.position.y = yV + 0.0004; verre.add(lisere);
  const hv = halo('#ff8a6a', 0.35, 0.5); hv.position.set(0, 0.13, 0); verre.add(hv);
  const ov = ombre(0.16, 0.16, 0.45); ov.position.y = 0.002; verre.add(ov);
  // la caustique rouge sur la table, côté ombre
  const caus = halo('#ff4060', 0.18, 0.6); caus.position.set(0.08, TABLE + 0.004, -2.42); racine.add(caus);

  // l'air doré : poussières, moucherons dans le soleil, quelques lucioles
  racine.add(particules({ n: mobile ? 160 : 260, min: [-3, SOL, -10], max: [3, SOL + 3, -1.2], couleur: '#ffd59a', taille: 0.012, vitesse: [0.03, 0.02, 0.0], tremble: 0.2, scintille: 0.8 }));
  racine.add(particules({ n: 50, min: [-6, SOL, -14], max: [6, SOL + 4, -3], couleur: '#ffcf8a', couleur2: '#ff9a7a', taille: 0.3, forme: 'bokeh', opacite: 0.08, vitesse: [0.02, 0.0, 0], tremble: 0.3 }));
  const hs = halo('#ffb070', 30, 0.25); hs.position.set(4, SOL + 3, -150); racine.add(hs);

  const vw = new THREE.Vector3(); racine.updateMatrixWorld(true); mesh.getWorldPosition(vw);
  const chemin = [
    { p: [0.2, -0.1, -0.8], c: [0, SOL + 1.4, -30] },
    { p: [0.1, TABLE + 0.32, -1.85], c: vw.toArray() },
  ];
  return {
    racine, porte, chemin, foyer: 3.5, fondScene: new THREE.Color('#d4906a'), brouillard: [new THREE.Color('#e6a07a'), 14, 140], approche: 3,
    depli: (sg) => THREE.MathUtils.smoothstep(sg, 0.22, 0.92),
    maj(t, e) {
      const s = e.sigma;
      const k = THREE.MathUtils.smoothstep(s, 0.3, 0.9);
      porte.mat.uniforms.uTeinte.value.set(1.0, 0.45 + 0.55 * k, 0.5 + 0.5 * k);
      porte.mat.uniforms.uLum.value = 0.85 + 0.15 * k;
      hv.material.opacity = 1 - THREE.MathUtils.smoothstep(s, 0.1, 0.45);
      coupe.material.opacity = 0.22 * (1 - THREE.MathUtils.smoothstep(s, 0.4, 0.8));
    },
  };
}
