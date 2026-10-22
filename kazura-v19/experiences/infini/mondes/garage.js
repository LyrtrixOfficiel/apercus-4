// Niveau 6 : le Garage des Platanes, à Avignon, le soir.
// Une voiture ancienne rouge cerise sous une lampe d'atelier, le panneau d'outils, les pneus empilés, la meuleuse qui crache
// ses étincelles, la porte roulante ouverte sur la nuit bleue. Porte : LE PHARE (rond), et son verre strié qui s'efface.
import { THREE, U, BRUIT, halo, particules, toile, proc, environnement, porteRonde, rayon, ombre, boiteRonde } from './outils.js';

export function construire(ctx) {
  const { a, renderer, mobile } = ctx;
  const racine = new THREE.Group();
  const SOL = -1.3, FOND = -9;
  const env = environnement(renderer, { bas: '#120d0a', horizon: '#5a3a24', haut: '#141a26', soleil: [0, 1, 0], soleilCouleur: '#ffcf8a', panneaux: [[[0, 3, -1], '#ffd59a', [2.5, 0.6]], [[-4, 1, -2], '#4a6aa8', [2, 3]], [[3, 1, 1], '#ff9a4a', [1, 1]]] });

  const beton = proc(new THREE.MeshStandardMaterial({ color: '#6b665f', roughness: 0.6, envMap: env, envMapIntensity: 0.5 }), `
    vec3 albedo(vec3 p, vec3 base){ float n = fbm(p.xy*0.9); float tache = smoothstep(0.62, 0.75, fbm(p.xy*0.5 + 3.0));
      return base*(0.7 + 0.4*n)*(1.0 - 0.6*tache) + vec3(0.02)*h21(floor(p.xy*80.0)); }`, 'beton-g');
  const mur = proc(new THREE.MeshStandardMaterial({ color: '#8a8478', roughness: 0.9 }), `
    vec3 albedo(vec3 p, vec3 base){ vec2 q = vec2(p.x/0.4, p.y/0.2); q.x += 0.5*step(1.0, mod(floor(q.y), 2.0)); vec2 f = fract(q);
      float j = smoothstep(0.0, 0.04, f.x)*smoothstep(0.0, 0.08, f.y); return base*(0.8 + 0.25*fbm(p.xy*2.0))*mix(0.7, 1.0, j)*mix(0.75, 1.0, smoothstep(0.0, 2.5, p.y)); }`, 'parpaing');
  const s = new THREE.Mesh(new THREE.PlaneGeometry(24, 20), beton); s.rotation.x = -Math.PI / 2; s.position.set(0, SOL, -5); racine.add(s);
  const fond = new THREE.Mesh(new THREE.PlaneGeometry(16, 7), mur); fond.position.set(1.5, SOL + 3.5, FOND); racine.add(fond);
  const md = new THREE.Mesh(new THREE.PlaneGeometry(14, 7), mur); md.rotation.y = -Math.PI / 2; md.position.set(5, SOL + 3.5, -4); racine.add(md);
  // la porte roulante ouverte, à gauche : la nuit bleue, un réverbère au loin
  const nuit = new THREE.Mesh(new THREE.PlaneGeometry(5, 4), new THREE.ShaderMaterial({
    fog: false, uniforms: { uT: U.temps },
    vertexShader: `precision highp float; varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `precision highp float; varying vec2 vUv; uniform float uT; ${BRUIT}
      void main(){ vec3 c = mix(vec3(0.03, 0.05, 0.12), vec3(0.12, 0.2, 0.42), vUv.y);
        float platane = smoothstep(0.55, 0.65, fbm(vUv*vec2(5.0, 3.0) + 2.0)) * smoothstep(0.35, 0.7, vUv.y);
        c = mix(c, vec3(0.02, 0.03, 0.05), platane*0.85);
        c += vec3(1.0, 0.7, 0.35) * smoothstep(0.05, 0.0, length((vUv - vec2(0.7, 0.42))*vec2(1.0, 1.3))) * 1.8;
        c += vec3(1.0, 0.6, 0.3) * smoothstep(0.3, 0.0, length((vUv - vec2(0.7, 0.42))*vec2(1.0, 1.3))) * 0.25;
        c = mix(c, vec3(0.05, 0.05, 0.06), step(vUv.y, 0.12));
        gl_FragColor = vec4(c, 1.0); }`,
  }));
  nuit.rotation.y = Math.PI / 2; nuit.position.set(-4.5, SOL + 2, -4.5); racine.add(nuit);
  const mg = new THREE.Mesh(new THREE.PlaneGeometry(14, 7), mur); mg.rotation.y = Math.PI / 2; mg.position.set(-4.6, SOL + 3.5, -11); racine.add(mg);
  const rideau = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.7, 5.2), new THREE.MeshStandardMaterial({ color: '#7d8188', roughness: 0.5, metalness: 0.6, envMap: env })); rideau.position.set(-4.55, SOL + 4.3, -4.5); racine.add(rideau);
  const lb = new THREE.PointLight('#6f8fd8', 6, 8, 1.4); lb.position.set(-3.5, SOL + 2.2, -4.5); racine.add(lb);

  // le panneau d'outils au fond
  const outils = toile(1024, 512, (x, w, h) => {
    x.fillStyle = '#c9a77a'; x.fillRect(0, 0, w, h);
    x.fillStyle = 'rgba(60,40,20,0.55)'; for (let i = 0; i < w; i += 16) for (let j = 0; j < h; j += 16) { x.beginPath(); x.arc(i + 8, j + 8, 2.2, 0, 7); x.fill(); }
    x.fillStyle = '#26282d'; x.strokeStyle = '#26282d'; x.lineCap = 'round';
    for (let k = 0; k < 7; k++) { const cx = 70 + k * 60; x.lineWidth = 12; x.beginPath(); x.moveTo(cx, 80); x.lineTo(cx, 230 + k * 8); x.stroke(); x.beginPath(); x.arc(cx, 70, 18, 0, 7); x.lineWidth = 9; x.stroke(); }
    for (let k = 0; k < 4; k++) { const cx = 540 + k * 90; x.fillRect(cx, 60, 22, 120); x.fillRect(cx - 18, 180, 58, 26); }
    x.beginPath(); x.arc(850, 330, 70, 0, 7); x.lineWidth = 16; x.stroke(); x.fillRect(120, 340, 330, 34); x.fillRect(380, 310, 70, 90);
    x.fillStyle = '#b52a24'; x.fillRect(560, 300, 200, 120); x.fillStyle = '#efe6d2'; x.font = '800 44px "Bricolage Grotesque", sans-serif'; x.fillText('GP', 620, 375);
  });
  const pegs = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 1.8), new THREE.MeshStandardMaterial({ map: outils, roughness: 0.8 })); pegs.position.set(2.2, SOL + 2.1, FOND + 0.02); racine.add(pegs);
  // l'établi et la meuleuse qui crache des étincelles
  const etabli = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.9, 0.7), new THREE.MeshStandardMaterial({ color: '#3a3f47', roughness: 0.5, metalness: 0.5, envMap: env })); etabli.position.set(2.2, SOL + 0.45, FOND + 0.4); racine.add(etabli);
  const etinc = new THREE.Vector3(1.4, SOL + 1.05, FOND + 0.6);
  racine.add(particules({ n: mobile ? 120 : 220, min: [etinc.x - 0.05, SOL, etinc.z - 0.1], max: [etinc.x + 1.6, etinc.y, etinc.z + 0.9], couleur: '#ffb347', couleur2: '#fff1a8', taille: 0.035, forme: 'strie', vitesse: [1.6, -1.2, 0.5], tremble: 0.02, opacite: 0.9 }));
  const he = halo('#ff9a3a', 0.9, 0.9); he.position.copy(etinc); racine.add(he);
  const le = new THREE.PointLight('#ff9a3a', 4, 3, 1.6); le.position.copy(etinc); racine.add(le);
  // des pneus empilés
  const pneuM = new THREE.MeshStandardMaterial({ color: '#141416', roughness: 0.85 });
  for (let k = 0; k < 4; k++) { const p = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.13, 12, 32), pneuM); p.rotation.x = Math.PI / 2; p.position.set(4.1, SOL + 0.13 + k * 0.25, -6.4 + (k % 2) * 0.04); racine.add(p); }

  // LA VOITURE : une petite citadine ronde des années soixante, rouge cerise, vue de face
  const auto = new THREE.Group(); auto.position.set(0, SOL, -4.6); racine.add(auto);
  const peinture = new THREE.MeshPhysicalMaterial({ color: '#b3141f', roughness: 0.28, metalness: 0.25, clearcoat: 1, clearcoatRoughness: 0.06, envMap: env, envMapIntensity: 1.4 });
  const chrome = new THREE.MeshStandardMaterial({ color: '#eeeeef', roughness: 0.06, metalness: 1, envMap: env, envMapIntensity: 1.7 });
  const noir = new THREE.MeshStandardMaterial({ color: '#0b0b0d', roughness: 0.4 });
  const vitreA = new THREE.MeshStandardMaterial({ color: '#0e1622', roughness: 0.04, metalness: 0.9, envMap: env, envMapIntensity: 1.8 });
  // la caisse : un ellipsoïde ; le pavillon : une bulle vitrée et un toit
  const EA = 0.78, EB = 0.55, EC = 1.55, Y0 = 0.72;
  const caisse = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 40), peinture); caisse.scale.set(EA, EB, EC); caisse.position.set(0, Y0, -1.2); auto.add(caisse);
  const pavillon = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32, 0, Math.PI * 2, 0, Math.PI / 2), vitreA); pavillon.scale.set(0.66, 0.52, 0.95); pavillon.position.set(0, Y0 + 0.28, -1.45); auto.add(pavillon);
  const toitR = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), peinture); toitR.scale.set(0.6, 0.5, 0.8); toitR.position.set(0, Y0 + 0.33, -1.55); auto.add(toitR);
  const bas = new THREE.Mesh(new THREE.CylinderGeometry(EA * 0.98, EA * 0.98, 0.18, 48), noir); bas.scale.set(1, 1, EC / EA * 0.96); bas.position.set(0, Y0 - EB * 0.72, -1.2); auto.add(bas);
  for (const sx of [-1, 1]) for (const z of [-0.25, -2.15]) {
    const roue = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.075, 14, 32), pneuM); roue.rotation.y = Math.PI / 2; roue.position.set(sx * 0.6, 0.3, z); auto.add(roue);
    const jante = new THREE.Mesh(new THREE.CircleGeometry(0.17, 28), chrome); jante.rotation.y = sx * Math.PI / 2; jante.position.set(sx * 0.66, 0.3, z); auto.add(jante);
  }
  // la moustache chromée, le pare-chocs, la plaque
  const pare = new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 1.2, 6, 16), chrome); pare.rotation.z = Math.PI / 2; pare.position.set(0, Y0 - 0.36, 0.22); auto.add(pare);
  const mous = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.012, 8, 40, Math.PI * 0.7), chrome); mous.rotation.z = Math.PI * 1.15; mous.position.set(0, Y0 + 0.02, 0.33); auto.add(mous);
  const plaque = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.1), new THREE.MeshStandardMaterial({ map: toile(512, 128, (x, w, h) => { x.fillStyle = '#f2f0ea'; x.fillRect(0, 0, w, h); x.fillStyle = '#1a3a8a'; x.fillRect(0, 0, 40, h); x.fillStyle = '#111'; x.font = '700 78px "JetBrains Mono", monospace'; x.textAlign = 'center'; x.fillText('GP-84', w / 2 + 16, 96); }), roughness: 0.4 }));
  plaque.position.set(0, Y0 - 0.25, 0.3); plaque.rotation.x = -0.15; auto.add(plaque);
  const ov = ombre(2.4, 4.2, 0.75); ov.position.set(0, 0.01, -1.2); auto.add(ov);

  // LES PHARES, posés sur la face avant ; celui de gauche est la porte
  const R = 0.11;
  const phares = [];
  for (const sx of [-1, 1]) {
    const x = sx * 0.43, y = Y0 + 0.05;
    const zs = EC * Math.sqrt(Math.max(0, 1 - (x / EA) ** 2 - ((y - Y0) / EB) ** 2));
    const pc = new THREE.Vector3(x, y, -1.2 + zs);
    const n = new THREE.Vector3(x / (EA * EA), (y - Y0) / (EB * EB), zs / (EC * EC)).normalize();
    n.lerp(new THREE.Vector3(0, 0, 1), 0.45).normalize();
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), n);
    const devant = pc.clone().addScaledVector(n, 0.02);
    const anneau = new THREE.Mesh(new THREE.TorusGeometry(R * 1.1, R * 0.13, 16, 64), chrome); anneau.position.copy(devant); anneau.quaternion.copy(q); auto.add(anneau);
    const cuve = new THREE.Mesh(new THREE.CylinderGeometry(R * 1.12, R * 1.25, 0.1, 48, 1, true), chrome); cuve.rotation.x = Math.PI / 2; const gq = new THREE.Group(); gq.position.copy(pc).addScaledVector(n, -0.02); gq.quaternion.copy(q); gq.add(cuve); auto.add(gq);
    phares.push({ pc: devant, q });
  }
  const { mesh, porte } = porteRonde(R, a, { fond: ctx.fondSuivant });
  mesh.position.copy(phares[0].pc); mesh.quaternion.copy(phares[0].q);
  { const n0 = new THREE.Vector3(0, 0, 1).applyQuaternion(mesh.quaternion); const h0 = new THREE.Vector3(0, 1, 0).projectOnPlane(n0).normalize(); const y0 = new THREE.Vector3(0, 1, 0).applyQuaternion(mesh.quaternion); mesh.rotateZ(Math.atan2(new THREE.Vector3().crossVectors(y0, h0).dot(n0), y0.dot(h0))); }
  auto.add(mesh);
  porte.mat.uniforms.uTeinte.value.set(1.0, 0.9, 0.72);
  const autre = new THREE.Mesh(new THREE.CircleGeometry(R, 48), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffe2b0').multiplyScalar(1.5) })); autre.position.copy(phares[1].pc); autre.quaternion.copy(phares[1].q); auto.add(autre);
  // le verre strié (anneaux de Fresnel) devant chaque phare
  const strieU = { uOp: { value: 1 }, uT: U.temps };
  const strieM = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, uniforms: strieU,
    vertexShader: `precision highp float; varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `precision highp float; varying vec2 vP; uniform float uOp, uT;
      void main(){ float r = length(vP) / ${R.toFixed(4)};
        float anneaux = pow(abs(sin(r*3.14159*7.0)), 18.0) * smoothstep(1.0, 0.2, r);
        float grille = pow(abs(sin((vP.x + vP.y)*180.0)), 30.0)*0.3*smoothstep(0.3, 1.0, r);
        float eclat = smoothstep(0.35, 0.0, length(vP/${R.toFixed(4)} - vec2(-0.35, 0.4)));
        vec3 c = vec3(1.0, 0.9, 0.75)*(anneaux*0.35 + grille) + vec3(1.0)*eclat*0.8 + vec3(1.0, 0.8, 0.55)*pow(r, 3.0)*0.25;
        gl_FragColor = vec4(c*uOp, 1.0); }`,
  });
  for (const [k, ph] of phares.entries()) { const st = new THREE.Mesh(new THREE.CircleGeometry(R, 48), strieM); st.position.copy(ph.pc).addScaledVector(new THREE.Vector3(0, 0, 1).applyQuaternion(ph.q), 0.003); st.quaternion.copy(k ? ph.q : mesh.quaternion); auto.add(st); }
  const nP0 = new THREE.Vector3(0, 0, 1).applyQuaternion(phares[0].q);
  const hp = halo('#ffd59a', 1.2, 0.4); hp.position.copy(phares[0].pc).addScaledVector(nP0, 0.1); auto.add(hp);
  const hp2 = halo('#ffd59a', 1.2, 0.4); hp2.position.copy(phares[1].pc).add(new THREE.Vector3(0, 0, 0.1)); auto.add(hp2);
  const faisceau = rayon({ longueur: 3, r0: 0.1, r1: 0.9, couleur: '#ffdcaa', opacite: 0.05 }); faisceau.rotation.x = -Math.PI / 2; faisceau.position.copy(phares[1].pc).add(auto.position); racine.add(faisceau);
  const phares0 = phares.map((p) => p.pc);

  // la lampe d'atelier au-dessus du capot
  const lampe = new THREE.Group(); lampe.position.set(0, SOL + 3.0, -5.6); racine.add(lampe);
  const abat = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.26, 32, 1, true), new THREE.MeshStandardMaterial({ color: '#2d5a4a', roughness: 0.4, metalness: 0.5, side: THREE.DoubleSide, envMap: env })); lampe.add(abat);
  const amp = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffe0aa').multiplyScalar(3) })); amp.position.y = -0.08; lampe.add(amp);
  const fil = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 3, 4), noir); fil.position.y = 1.6; lampe.add(fil);
  const hl = halo('#ffd28a', 1.6, 0.7); hl.position.y = -0.1; lampe.add(hl);
  const spot = new THREE.SpotLight('#ffd08a', 40, 7, 0.75, 0.6, 1.3); spot.position.set(0, SOL + 2.9, -5.6); spot.target.position.set(0, SOL, -5.6); racine.add(spot, spot.target);
  const cone = rayon({ longueur: 3, r0: 0.3, r1: 1.6, couleur: '#ffcf8a', opacite: 0.07 }); cone.position.set(0, SOL + 2.88, -5.6); racine.add(cone);

  racine.add(new THREE.HemisphereLight('#53607a', '#2a1d14', 0.8));
  const front = new THREE.PointLight('#ffb070', 5, 6, 1.5); front.position.set(1.2, SOL + 1.6, -2.4); racine.add(front);
  racine.add(particules({ n: mobile ? 120 : 200, min: [-2, SOL, -6.5], max: [2, SOL + 3, -2.5], couleur: '#ffe2b0', taille: 0.012, vitesse: [0.02, 0.03, 0.01], tremble: 0.1, scintille: 0.5 }));

  const pw = phares0[0].clone().add(auto.position);
  const chemin = [
    { p: [0.35, -0.1, -1.2], c: [0, SOL + 0.7, -5.2] },
    { p: [-0.45, pw.y + 0.35, -2.2], c: pw.toArray() },
  ];
  return {
    racine, porte, chemin, foyer: 4.6, fondScene: new THREE.Color('#15110e'), brouillard: [new THREE.Color('#231a14'), 4, 20],
    maj(t, e) {
      const sg = e.sigma;
      strieU.uOp.value = 1 - THREE.MathUtils.smoothstep(sg, 0.3, 0.8);
      hp.material.opacity = 1 - THREE.MathUtils.smoothstep(sg, 0.08, 0.4);
      const k = THREE.MathUtils.smoothstep(sg, 0.4, 0.92);
      porte.mat.uniforms.uTeinte.value.set(1.0, 0.9 + 0.1 * k, 0.72 + 0.28 * k);
      porte.mat.uniforms.uLum.value = 1.15 - 0.15 * k;
      he.material.opacity = 0.5 + 0.5 * Math.abs(Math.sin(t * 23) * Math.sin(t * 7));
    },
  };
}
