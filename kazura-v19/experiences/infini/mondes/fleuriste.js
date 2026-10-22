// Niveau 4 : Pétale Sauvage, une fleuriste d'Annecy, le matin, dans sa serre.
// La verrière et ses rayons, les seaux de fleurs, les plantes suspendues, le pollen et les pétales qui flottent,
// et sur l'établi une grosse rose où perle une goutte de rosée. Porte : LA GOUTTE (ronde, bombée, qui s'aplatit quand on entre).
import { THREE, U, BRUIT, halo, particules, proc, environnement, porteRonde, rayon, ombre, toile, fleur } from './outils.js';

export function construire(ctx) {
  const { a, renderer, mobile } = ctx;
  const racine = new THREE.Group();
  const SOL = -1.4, ETABLI = -0.36, FOND = -8;
  const env = environnement(renderer, { bas: '#6a5a48', horizon: '#e8efe0', haut: '#cfe6f2', soleil: [0.6, 0.6, -0.4], soleilCouleur: '#fff2d0', panneaux: [[[2, 3, -2], '#ffffff', [3, 2]]] });

  // la verrière du fond : ciel laiteux, croisillons, silhouettes de feuillage flou
  const verre = new THREE.Mesh(new THREE.PlaneGeometry(24, 12), new THREE.ShaderMaterial({
    fog: false, uniforms: { uT: U.temps },
    vertexShader: `precision highp float; varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `precision highp float; varying vec2 vP; uniform float uT; ${BRUIT}
      void main(){ vec2 p = vP;
        vec3 c = mix(vec3(0.86, 0.93, 0.86), vec3(0.98, 0.99, 0.95), smoothstep(-3.0, 5.0, p.y));
        c += vec3(1.0, 0.95, 0.8)*smoothstep(6.0, 0.0, length(p - vec2(5.0, 4.0)))*0.35;
        float f = fbm(p*0.45 + vec2(uT*0.01, 0.0)); float feuil = smoothstep(0.5, 0.7, f) * smoothstep(1.0, -4.0, p.y);
        c = mix(c, vec3(0.42, 0.6, 0.38), feuil*0.55);
        vec2 g = abs(fract(p/vec2(1.5, 1.2)) - 0.5); float cr = smoothstep(0.485, 0.5, max(g.x*1.0, g.y*1.0));
        c = mix(c, vec3(0.2, 0.26, 0.22), cr*0.75);
        gl_FragColor = vec4(c*1.25, 1.0); }`,
  }));
  verre.position.set(0, SOL + 5, FOND); racine.add(verre);
  const tomettes = proc(new THREE.MeshStandardMaterial({ color: '#b86a48', roughness: 0.75, envMap: env, envMapIntensity: 0.5 }), `
    vec3 albedo(vec3 p, vec3 base){ vec2 q = p.xy*2.6; vec2 f = fract(q); float j = smoothstep(0.0, 0.05, f.x)*smoothstep(1.0, 0.95, f.x)*smoothstep(0.0, 0.05, f.y)*smoothstep(1.0, 0.95, f.y);
      return base*(0.75 + 0.4*h21(floor(q)))*(0.85 + 0.25*fbm(p.xy*4.0))*mix(0.55, 1.0, j); }`, 'tomettes');
  const sol = new THREE.Mesh(new THREE.PlaneGeometry(30, 20), tomettes); sol.rotation.x = -Math.PI / 2; sol.position.set(0, SOL, -4); racine.add(sol);

  // l'établi
  const bois = proc(new THREE.MeshStandardMaterial({ color: '#a7825c', roughness: 0.7 }), `
    vec3 albedo(vec3 p, vec3 base){ float g = fbm(vec2(p.x*2.0, p.z*22.0 + fbm(p.xz*2.0)*2.0)); return base*(0.7 + 0.45*g); }`, 'etabli');
  const etabli = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.08, 1.2), bois); etabli.position.set(0, ETABLI - 0.04, -2.9); racine.add(etabli);
  for (const x of [-1.5, 1.5]) for (const z of [-2.4, -3.4]) { const pi = new THREE.Mesh(new THREE.BoxGeometry(0.08, ETABLI - SOL, 0.08), bois); pi.position.set(x, (ETABLI + SOL) / 2 - 0.04, z); racine.add(pi); }

  // les fleurs : tiges et corolles en instances
  const couleurs = ['#f25c86', '#ffb3c6', '#ffffff', '#ff8a5c', '#f6d04d', '#b58cf0', '#e83e5c', '#ffd9e2'];
  const tigeG = new THREE.CylinderGeometry(0.006, 0.008, 1, 5); tigeG.translate(0, 0.5, 0);
  const fleurG = fleur({ couches: [[3, 0.55, 0.2], [5, 0.8, 0.7], [7, 1.0, 1.2]], base: '#b0b0b0', bout: '#ffffff', retour: 0.5 });
  const tigeM = new THREE.MeshStandardMaterial({ color: '#4f7a3a', roughness: 0.7 });
  const fleurM = new THREE.MeshStandardMaterial({ roughness: 0.6, vertexColors: true, side: THREE.DoubleSide, emissive: '#2a0c14', emissiveIntensity: 0.3 });
  const bouquets = [];
  const seau = (x, y, z, n, h, s) => bouquets.push({ x, y, z, n, h, s });
  seau(-2.4, SOL, -4.4, 26, 1.0, 1); seau(-1.3, SOL, -5.4, 30, 1.2, 1); seau(1.6, SOL, -4.8, 26, 1.1, 1); seau(2.7, SOL, -3.8, 22, 0.9, 1);
  seau(-3.6, SOL, -6.2, 30, 1.3, 1.2); seau(3.6, SOL, -6.6, 30, 1.3, 1.2); seau(0.2, SOL, -6.9, 34, 1.4, 1.2);
  seau(-1.2, ETABLI, -3.25, 18, 0.55, 0.8); seau(1.15, ETABLI, -3.3, 16, 0.5, 0.8);
  const total = bouquets.reduce((s, b) => s + b.n, 0);
  const tiges = new THREE.InstancedMesh(tigeG, tigeM, total), tetes = new THREE.InstancedMesh(fleurG, fleurM, total);
  const zinc = new THREE.MeshStandardMaterial({ color: '#9aa3a8', roughness: 0.35, metalness: 0.9, envMap: env });
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), c = new THREE.Color(); let k = 0;
  for (const b of bouquets) {
    const sz = new THREE.Mesh(new THREE.CylinderGeometry(0.16 * b.s, 0.12 * b.s, 0.32 * b.s, 24, 1, true), zinc); sz.position.set(b.x, b.y + 0.16 * b.s, b.z); racine.add(sz);
    const teinte = couleurs[Math.floor(Math.random() * couleurs.length)];
    for (let i = 0; i < b.n; i++) {
      const ang = Math.random() * Math.PI * 2, r = Math.random() * 0.1 * b.s, inc = 0.08 + Math.random() * 0.25, L = b.h * (0.75 + Math.random() * 0.4);
      e.set(Math.cos(ang) * inc, 0, Math.sin(ang) * inc); q.setFromEuler(e);
      m4.compose(new THREE.Vector3(b.x + Math.cos(ang) * r, b.y + 0.1, b.z + Math.sin(ang) * r), q, new THREE.Vector3(1, L, 1)); tiges.setMatrixAt(k, m4);
      const tip = new THREE.Vector3(0, L, 0).applyQuaternion(q).add(new THREE.Vector3(b.x + Math.cos(ang) * r, b.y + 0.1, b.z + Math.sin(ang) * r));
      const rs = (0.05 + Math.random() * 0.035) * b.s;
      m4.compose(tip, q, new THREE.Vector3(rs, rs, rs)); tetes.setMatrixAt(k, m4);
      tetes.setColorAt(k, c.set(Math.random() < 0.75 ? teinte : couleurs[Math.floor(Math.random() * couleurs.length)]).multiplyScalar(0.85 + Math.random() * 0.3)); k++;
    }
  }
  racine.add(tiges, tetes);
  const feuillage = new THREE.MeshStandardMaterial({ color: '#5c8c4a', roughness: 0.7 });
  // des feuilles floues au premier plan, sur les côtés (profondeur de champ peinte)
  const feuilleFloue = toile(256, 512, (x, w, h) => {
    x.filter = 'blur(10px)'; x.fillStyle = '#2f5a2a';
    x.beginPath(); x.moveTo(w / 2, h * 0.04); x.bezierCurveTo(w * 1.02, h * 0.3, w * 0.9, h * 0.75, w / 2, h * 0.97); x.bezierCurveTo(w * 0.1, h * 0.75, -w * 0.02, h * 0.3, w / 2, h * 0.04); x.fill();
    x.filter = 'blur(6px)'; x.strokeStyle = 'rgba(160,210,140,0.5)'; x.lineWidth = 6; x.beginPath(); x.moveTo(w / 2, h * 0.08); x.lineTo(w / 2, h * 0.92); x.stroke();
  });
  const ff = new THREE.MeshBasicMaterial({ map: feuilleFloue, transparent: true, depthWrite: false, color: new THREE.Color(0.75, 0.85, 0.7) });
  for (const [x, y, z, r, s2] of [[-0.75, -0.25, -1.55, 0.5, 0.55], [0.85, 0.15, -1.7, -0.6, 0.5], [-0.6, 0.45, -1.9, 2.4, 0.45], [0.7, -0.55, -1.6, -2.3, 0.5]]) {
    const f = new THREE.Mesh(new THREE.PlaneGeometry(s2 * 0.5, s2), ff); f.position.set(x, y, z); f.rotation.z = r; racine.add(f);
  }

  // LA ROSE, en couches de pétales
  const roseC = new THREE.Vector3(0.15, ETABLI + 0.34, -2.75);
  const rose = new THREE.Group(); rose.position.copy(roseC); rose.rotation.x = 0.35; racine.add(rose);
  const petM = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, side: THREE.DoubleSide, emissive: '#4a0616', emissiveIntensity: 0.35, envMap: env, envMapIntensity: 0.2 });
  const tete = new THREE.Mesh(fleur({ L: 0.12, W: 0.11, couches: [[3, 0.4, 0.0], [4, 0.52, 0.12], [5, 0.66, 0.3], [6, 0.8, 0.52], [7, 0.92, 0.78]], base: '#7a0c24', bout: '#ff8aa4', creux: 0.7, retour: 0.55 }), petM);
  tete.position.y = -0.06; rose.add(tete);
  const sepales = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.08, 10), tigeM); sepales.position.y = -0.1; sepales.rotation.x = Math.PI; rose.add(sepales);
  const tigeR = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.01, 0.5, 8), tigeM); tigeR.position.y = -0.36; rose.add(tigeR);
  const feuilleR = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 6), feuillage); feuilleR.scale.set(1, 0.15, 0.45); feuilleR.position.set(0.06, -0.25, 0); feuilleR.rotation.z = -0.5; rose.add(feuilleR);
  const vase = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.26, 32, 1, true), new THREE.MeshPhysicalMaterial({ color: '#d8f0f0', roughness: 0.05, transmission: 0, transparent: true, opacity: 0.35, envMap: env, envMapIntensity: 1.5, side: THREE.DoubleSide }));
  vase.position.set(roseC.x, ETABLI + 0.13, roseC.z + 0.05); racine.add(vase);
  const ov = ombre(0.5, 0.4, 0.35); ov.position.set(roseC.x, ETABLI + 0.002, roseC.z + 0.05); racine.add(ov);

  // LA GOUTTE : dôme bombé, posé sur le pétale de devant, tourné vers nous
  const R = 0.034;
  const N = new THREE.Vector3(0, 0.62, 1).normalize();
  const dome = new THREE.SphereGeometry(R, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2); dome.rotateX(Math.PI / 2);
  { const pos = dome.attributes.position, uv = dome.attributes.uv; for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / (2 * R) + 0.5, pos.getY(i) / (2 * R) + 0.5); }
  const { mesh, porte } = porteRonde(R, a, { fond: ctx.fondSuivant, geometrie: dome });
  const gPos = roseC.clone().add(new THREE.Vector3(0.0, 0.035, 0.1));
  mesh.position.copy(gPos); mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), N);
  // l'axe « haut » de la goutte : vers le haut du monde, projeté
  { const haut = new THREE.Vector3(0, 1, 0).projectOnPlane(N).normalize(); const y0 = new THREE.Vector3(0, 1, 0).applyQuaternion(mesh.quaternion); const ang = Math.atan2(new THREE.Vector3().crossVectors(y0, haut).dot(N), y0.dot(haut)); mesh.rotateZ(ang); }
  racine.add(mesh);
  porte.mat.uniforms.uTeinte.value.set(0.92, 1.0, 0.96);
  const eclat = new THREE.Mesh(dome.clone(), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, uniforms: { uOp: { value: 1 } },
    vertexShader: `precision highp float; varying vec3 vN; varying vec3 vV; varying vec2 vUv; void main(){ vUv = uv; vec4 w = modelMatrix*vec4(position,1.0); vN = normalize(mat3(modelMatrix)*normal); vV = normalize(cameraPosition - w.xyz); gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: `precision highp float; varying vec3 vN; varying vec3 vV; varying vec2 vUv; uniform float uOp;
      void main(){ float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 3.0);
        vec2 p = vUv*2.0 - 1.0; float s1 = smoothstep(0.22, 0.0, length((p - vec2(-0.35, 0.42))*vec2(1.0, 1.4)));
        float s2 = smoothstep(0.08, 0.0, length(p - vec2(0.3, -0.38)));
        vec3 c = vec3(0.9, 1.0, 0.95)*f*0.9 + vec3(1.0)*(s1*0.95 + s2*0.6);
        gl_FragColor = vec4(c*uOp, 1.0); }`,
  }));
  eclat.position.copy(mesh.position); eclat.quaternion.copy(mesh.quaternion); eclat.scale.setScalar(1.004); racine.add(eclat);
  const caust = halo('#fff6dd', R * 4, 0.5); caust.position.copy(gPos).addScaledVector(N, -0.004).add(new THREE.Vector3(0, -0.01, 0)); racine.add(caust);

  // la lumière du matin : soleil, rayons dans la poussière, pétales qui volent
  racine.add(new THREE.HemisphereLight('#eef6e8', '#8a6a50', 1.5));
  const sol2 = new THREE.DirectionalLight('#fff0d6', 2.6); sol2.position.set(3, 5, 1); racine.add(sol2);
  const fill = new THREE.PointLight('#ffd0dc', 3, 3, 1.5); fill.position.set(roseC.x - 0.4, roseC.y + 0.3, roseC.z + 0.8); racine.add(fill);
  for (const [x, z, op] of [[2.5, -3.5, 0.09], [0.8, -5.0, 0.07], [-1.6, -4.0, 0.06]]) {
    const r = rayon({ longueur: 8, r0: 0.25, r1: 1.1, couleur: '#fff1cf', opacite: op }); r.position.set(x + 2.4, SOL + 7, z); r.rotation.z = 0.32; r.rotation.x = 0.1; racine.add(r);
  }
  racine.add(particules({ n: mobile ? 220 : 380, min: [-3, SOL, -7], max: [3, SOL + 3.5, -1.2], couleur: '#fff4d2', taille: 0.012, vitesse: [0.03, 0.02, 0.01], tremble: 0.1, scintille: 0.6 }));
  racine.add(particules({ n: mobile ? 40 : 70, min: [-3, SOL + 0.5, -6], max: [3, SOL + 3.5, -1.0], couleur: '#ff9fb6', couleur2: '#fff0f4', taille: 0.05, forme: 'petale', normal: true, opacite: 0.9, vitesse: [0.12, -0.12, 0.03], tremble: 0.35 }));
  racine.add(particules({ n: 40, min: [-5, SOL, FOND + 0.5], max: [5, SOL + 4, -4], couleur: '#fff8e8', couleur2: '#ffd6e0', taille: 0.3, forme: 'bokeh', opacite: 0.12, vitesse: [0.02, 0.01, 0], tremble: 0.2 }));

  const cible = gPos.toArray();
  const chemin = [
    { p: [-0.25, -0.1, -0.9], c: [0.1, ETABLI + 0.2, -3.2] },
    { p: [0.05, ETABLI + 0.55, -2.05], c: cible },
  ];
  return {
    racine, porte, chemin, foyer: 3.6, fondScene: new THREE.Color('#dfe9d8'), brouillard: [new THREE.Color('#e4ecdc'), 4, 18], approche: 4,
    depli: (sg) => THREE.MathUtils.smoothstep(sg, 0.25, 0.92),
    maj(t, e2) {
      const s = e2.sigma;
      mesh.scale.z = Math.max(0.001, 1 - THREE.MathUtils.smoothstep(s, 0.2, 0.9));
      eclat.scale.z = mesh.scale.z * 1.004;
      eclat.material.uniforms.uOp.value = 1 - THREE.MathUtils.smoothstep(s, 0.35, 0.85);
      caust.material.opacity = 1 - THREE.MathUtils.smoothstep(s, 0.2, 0.6);
      rose.rotation.y = Math.sin(t * 0.3) * 0.02 * (1 - s);
    },
  };
}
