// Niveau 7 : La Clé des Champs, une école de musique à Rennes, un soir d'hiver.
// La grande fenêtre en arc sur la neige bleue, le piano à queue laqué, la guitare sur son pied, la guirlande d'ampoules,
// la lampe sur pied, des notes d'or qui montent. Porte : LA TABLETTE posée sur le pupitre (rectangle).
import { THREE, U, BRUIT, halo, particules, toile, proc, environnement, porteRect, reflet, ombre, rayon, boiteRonde } from './outils.js';

export function construire(ctx) {
  const { a, renderer, mobile } = ctx;
  const racine = new THREE.Group();
  const SOL = -1.35, FOND = -7.5;
  const env = environnement(renderer, { bas: '#1a1210', horizon: '#33456e', haut: '#0d1630', soleil: [0.5, 0.4, 1], soleilCouleur: '#ffcf8a', panneaux: [[[0, 1.5, -5], '#5f7fc0', [4, 3]], [[3, 1, 1], '#ffc070', [1, 1]], [[-2, 2, 2], '#ffd9a0', [0.6, 0.6]]] });

  const parquet = proc(new THREE.MeshStandardMaterial({ color: '#7a4a2a', roughness: 0.35, envMap: env, envMapIntensity: 0.6 }), `
    vec3 albedo(vec3 p, vec3 base){ vec2 q = vec2(p.x*7.0, p.y*1.3); q.y += floor(q.x)*0.41; float l = h21(floor(q));
      float j = smoothstep(0.0, 0.05, fract(q.x))*smoothstep(0.0, 0.01, fract(q.y)); return base*(0.65 + 0.5*l)*(0.85 + 0.3*fbm(p.xy*vec2(30.0, 2.0)))*mix(0.55, 1.0, j); }`, 'parquet-m');
  const sol = new THREE.Mesh(new THREE.PlaneGeometry(20, 16), parquet); sol.rotation.x = -Math.PI / 2; sol.position.set(0, SOL, -4); racine.add(sol);
  const murM = proc(new THREE.MeshStandardMaterial({ color: '#2a3a5e', roughness: 0.9 }), `vec3 albedo(vec3 p, vec3 base){ float l = smoothstep(0.0, 0.02, abs(fract(p.x/0.9) - 0.5) - 0.47); return base*(0.85 + 0.2*fbm(p.xy*1.5))*(1.0 - 0.25*l); }`, 'mur-m');
  const mur = new THREE.Mesh(new THREE.PlaneGeometry(20, 8), murM); mur.position.set(0, SOL + 4, FOND - 0.02); racine.add(mur);

  // la fenêtre en arc : la neige du soir, les lumières de la rue
  const fw = 3.2, fh = 3.6, fy = SOL + 2.5;
  const forme = new THREE.Shape(); forme.moveTo(-fw / 2, -fh / 2); forme.lineTo(fw / 2, -fh / 2); forme.lineTo(fw / 2, fh / 2 - fw / 2); forme.absarc(0, fh / 2 - fw / 2, fw / 2, 0, Math.PI, false); forme.lineTo(-fw / 2, -fh / 2);
  const fen = new THREE.Mesh(new THREE.ShapeGeometry(forme, 32), new THREE.ShaderMaterial({
    fog: false, uniforms: { uT: U.temps },
    vertexShader: `precision highp float; varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `precision highp float; varying vec2 vP; uniform float uT; ${BRUIT}
      void main(){ vec2 p = vP; float y = p.y/1.8 + 0.5;
        vec3 c = mix(vec3(0.10, 0.16, 0.36), vec3(0.32, 0.44, 0.72), smoothstep(1.0, 0.25, y));
        float toits = step(p.y, -0.6 + 0.35*step(0.5, bruit(vec2(floor(p.x*2.5), 3.0))) + 0.15*bruit(vec2(p.x*1.4, 1.0)));
        c = mix(c, vec3(0.05, 0.07, 0.14), toits*0.9);
        vec2 g = p*vec2(9.0, 7.0); vec2 i = floor(g); float h = h21(i);
        c += vec3(1.0, 0.72, 0.38) * step(0.8, h) * toits * smoothstep(0.35, 0.2, abs(fract(g.x) - 0.5)) * smoothstep(0.35, 0.2, abs(fract(g.y) - 0.5)) * 0.9;
        c += vec3(0.85, 0.9, 1.0) * smoothstep(-1.75, -1.5, -p.y - 0.1) * 0.0;
        float neige = 0.0; for (int k = 0; k < 3; k++){ float s = 10.0 + float(k)*9.0; vec2 q = p*s + vec2(sin(uT*0.4 + float(k))*0.6, uT*(0.8 + float(k)*0.4)); vec2 f = fract(q) - 0.5; float hh = h21(floor(q) + float(k)*7.0); neige += step(0.75, hh)*smoothstep(0.12, 0.0, length(f)); }
        c += vec3(0.9, 0.95, 1.0)*neige*0.7;
        gl_FragColor = vec4(c*1.2, 1.0); }`,
  }));
  fen.position.set(0, fy, FOND); racine.add(fen);
  const bois = new THREE.MeshStandardMaterial({ color: '#efe8dc', roughness: 0.55 });
  const croisee = (w, h, x, y) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.08), bois); b.position.set(x, y, FOND + 0.03); racine.add(b); };
  croisee(0.06, fh, 0, fy); croisee(fw, 0.06, 0, fy - 0.3); croisee(fw, 0.06, 0, fy + 0.7);
  const arc = new THREE.Mesh(new THREE.TorusGeometry(fw / 2, 0.06, 8, 48, Math.PI), bois); arc.position.set(0, fy + fh / 2 - fw / 2, FOND + 0.03); racine.add(arc);
  const appui = new THREE.Mesh(new THREE.BoxGeometry(fw + 0.4, 0.08, 0.3), bois); appui.position.set(0, fy - fh / 2 - 0.04, FOND + 0.12); racine.add(appui);
  const lf = new THREE.PointLight('#7f9fe0', 5, 9, 1.4); lf.position.set(0, fy, FOND + 1.4); racine.add(lf);

  // la guirlande d'ampoules, en festons sur le mur
  const ampM = new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffcf8a').multiplyScalar(2.6) });
  const ampG = new THREE.SphereGeometry(0.03, 8, 6);
  const pts = []; for (let k = 0; k <= 60; k++) { const t = k / 60; const x = -5 + 10 * t; pts.push(new THREE.Vector3(x, SOL + 3.9 - 0.35 * Math.abs(Math.sin(t * Math.PI * 4)), FOND + 0.15)); }
  const cg = new THREE.CatmullRomCurve3(pts);
  racine.add(new THREE.Mesh(new THREE.TubeGeometry(cg, 120, 0.005, 4), new THREE.MeshBasicMaterial({ color: '#111' })));
  for (let k = 1; k < 30; k++) { const p = cg.getPoint(k / 30); const b = new THREE.Mesh(ampG, ampM); b.position.copy(p).y -= 0.04; racine.add(b); const h = halo('#ffb860', 0.42, 0.55); h.position.copy(b.position); racine.add(h); }

  // le piano à queue, laqué noir
  const laque = new THREE.MeshPhysicalMaterial({ color: '#08080a', roughness: 0.12, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.04, envMap: env, envMapIntensity: 1.4 });
  const piano = new THREE.Group(); piano.position.set(2.1, SOL, -4.3); piano.rotation.y = -0.55; racine.add(piano);
  const pf = new THREE.Shape(); pf.moveTo(-0.75, 0); pf.lineTo(0.75, 0); pf.lineTo(0.75, -0.9); pf.bezierCurveTo(0.75, -1.5, 0.2, -1.4, 0.05, -1.9); pf.bezierCurveTo(-0.1, -2.3, -0.75, -2.3, -0.75, -1.9); pf.lineTo(-0.75, 0);
  const corps = new THREE.Mesh(new THREE.ExtrudeGeometry(pf, { depth: 0.32, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 3, curveSegments: 24 }), laque);
  corps.rotation.x = Math.PI / 2; corps.position.y = 0.98; piano.add(corps);
  const couvercle = new THREE.Mesh(new THREE.ShapeGeometry(pf, 24), laque); couvercle.rotation.set(Math.PI / 2 - 0.75, 0, 0); couvercle.position.set(0, 1.0, 0); piano.add(couvercle);
  const bequille = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 1.0, 6), laque); bequille.position.set(0.3, 1.35, -1.0); bequille.rotation.x = 0.3; piano.add(bequille);
  for (const [x, z] of [[-0.62, -0.1], [0.62, -0.1], [-0.2, -1.8]]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.66, 12), laque); p.position.set(x, 0.33, z); piano.add(p); }
  const blanc = new THREE.MeshStandardMaterial({ color: '#f4f0e6', roughness: 0.3 });
  const noire = new THREE.MeshStandardMaterial({ color: '#0a0a0c', roughness: 0.3 });
  const touches = new THREE.InstancedMesh(new THREE.BoxGeometry(0.021, 0.02, 0.14), blanc, 52), noires = new THREE.InstancedMesh(new THREE.BoxGeometry(0.012, 0.025, 0.09), noire, 36);
  const m4 = new THREE.Matrix4(); let nb = 0;
  for (let k = 0; k < 52; k++) { m4.makeTranslation(-0.56 + k * 0.022, 0.86, 0.07); touches.setMatrixAt(k, m4); if ([0, 1, 3, 4, 5].includes(k % 7) && nb < 36) { m4.makeTranslation(-0.56 + k * 0.022 + 0.011, 0.875, 0.045); noires.setMatrixAt(nb++, m4); } }
  noires.count = nb; piano.add(touches, noires);
  const clavierC = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.06, 0.2), laque); clavierC.position.set(0, 0.82, 0.08); piano.add(clavierC);
  const op = ombre(2.2, 2.6, 0.55); op.position.set(0, 0.01, -1.0); piano.add(op);

  // la guitare sur son pied, à gauche
  const gui = new THREE.Group(); gui.position.set(-1.9, SOL, -3.6); gui.rotation.set(-0.18, 0.4, 0); racine.add(gui);
  const gf = new THREE.Shape(); gf.absellipse(0, 0.32, 0.19, 0.22, 0, Math.PI * 2, false); const gf2 = new THREE.Shape(); gf2.absellipse(0, 0.66, 0.15, 0.17, 0, Math.PI * 2, false);
  const epi = new THREE.MeshStandardMaterial({ color: '#c98a4a', roughness: 0.35, envMap: env, envMapIntensity: 0.6 });
  for (const f of [gf, gf2]) { const m = new THREE.Mesh(new THREE.ExtrudeGeometry(f, { depth: 0.09, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, curveSegments: 24 }), epi); gui.add(m); }
  const rosace = new THREE.Mesh(new THREE.CircleGeometry(0.055, 24), noire); rosace.position.set(0, 0.55, 0.101); gui.add(rosace);
  const manche = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.62, 0.03), new THREE.MeshStandardMaterial({ color: '#3a2214', roughness: 0.5 })); manche.position.set(0, 1.1, 0.07); gui.add(manche);

  // la lampe sur pied, chaude
  const lampe = new THREE.Group(); lampe.position.set(-2.6, SOL, -5.4); racine.add(lampe);
  const laiton = new THREE.MeshStandardMaterial({ color: '#c9a25a', roughness: 0.25, metalness: 1, envMap: env });
  const tige = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.6, 8), laiton); tige.position.y = 0.8; lampe.add(tige);
  const abat = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.26, 0.3, 32, 1, true), new THREE.MeshStandardMaterial({ color: '#f3dcb2', roughness: 0.8, side: THREE.DoubleSide, emissive: '#ffb35a', emissiveIntensity: 0.9 })); abat.position.y = 1.7; lampe.add(abat);
  const hl = halo('#ffb860', 2.2, 0.5); hl.position.y = 1.65; lampe.add(hl);
  const ll = new THREE.PointLight('#ffb35a', 10, 7, 1.5); ll.position.set(-2.6, SOL + 1.6, -5.2); racine.add(ll);

  // LE PUPITRE et sa tablette (porte)
  let hh, sw;
  if (a < 1) { hh = 0.14; sw = 2 * hh * a; } else { sw = Math.min(0.42, 0.24 * a); hh = sw / a / 2; }
  const pup = new THREE.Group(); pup.position.set(-0.15, SOL, -2.9); pup.rotation.y = 0.12; racine.add(pup);
  const noirMat = new THREE.MeshStandardMaterial({ color: '#141418', roughness: 0.45, metalness: 0.6, envMap: env });
  const mat = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.1, 8), noirMat); mat.position.y = 0.55; pup.add(mat);
  for (let k = 0; k < 3; k++) { const pied = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.45, 6), noirMat); const an = k * Math.PI * 2 / 3; pied.position.set(Math.cos(an) * 0.18, 0.12, Math.sin(an) * 0.18); pied.rotation.set(Math.sin(an) * 0.9, 0, -Math.cos(an) * 0.9); pup.add(pied); }
  const tete = new THREE.Group(); tete.position.y = 1.12 + hh; tete.rotation.x = -0.32; pup.add(tete);
  const plateau = new THREE.Mesh(new THREE.BoxGeometry(Math.max(0.5, sw + 0.16), 2 * hh + 0.12, 0.012), noirMat); plateau.position.z = -0.012; tete.add(plateau);
  const rebord = new THREE.Mesh(new THREE.BoxGeometry(Math.max(0.5, sw + 0.16), 0.02, 0.05), noirMat); rebord.position.set(0, -hh - 0.05, 0.0); tete.add(rebord);
  const b = Math.min(sw, 2 * hh) * 0.05;
  const coque = new THREE.Mesh(boiteRonde(sw + 2 * b, 2 * hh + 2 * b, 0.008, Math.min(sw, 2 * hh) * 0.06), new THREE.MeshStandardMaterial({ color: '#b9bcc4', roughness: 0.3, metalness: 0.8, envMap: env })); const rb2 = Math.min(sw, 2 * hh) * 0.06; coque.position.z = -(0.004 + Math.min(rb2, 0.008) * 0.4) - 0.0002; tete.add(coque);
  plateau.position.z = coque.position.z - 0.006;
  const { mesh, porte } = porteRect(hh, a, { fond: ctx.fondSuivant }); mesh.position.z = 0.0002; tete.add(mesh);
  const refl = reflet(sw, 2 * hh, { couleur: '#8aa6e6', couleur2: '#ffc890', opacite: 0.16 }); refl.position.z = 0.0004; tete.add(refl);
  const ht = halo('#fff0d8', Math.max(sw, 2 * hh) * 2.6, 0.08); ht.position.z = -0.01; tete.add(ht);

  racine.add(new THREE.HemisphereLight('#6d82c0', '#3a2414', 0.9));
  const chaud = new THREE.PointLight('#ffc070', 6, 6, 1.5); chaud.position.set(0.8, SOL + 2.2, -1.8); racine.add(chaud);
  // les notes d'or qui montent, la poussière dans la lumière
  racine.add(particules({ n: mobile ? 70 : 120, min: [-3, SOL + 0.5, -6], max: [3, SOL + 3.5, -1.5], couleur: '#ffd27a', couleur2: '#fff1c8', taille: 0.05, forme: 'bokeh', opacite: 0.5, vitesse: [0.02, 0.12, 0], tremble: 0.25, scintille: 0.6 }));
  racine.add(particules({ n: mobile ? 120 : 200, min: [-3, SOL, -6], max: [3, SOL + 3, -1.5], couleur: '#ffe2b0', taille: 0.01, vitesse: [0.02, 0.02, 0.01], tremble: 0.1, scintille: 0.5 }));
  const notes = toile(256, 256, (x) => {
    x.fillStyle = '#ffd27a'; x.shadowColor = '#ffb040'; x.shadowBlur = 18;
    x.beginPath(); x.ellipse(90, 190, 34, 24, -0.4, 0, 7); x.fill(); x.fillRect(118, 50, 10, 140);
    x.beginPath(); x.moveTo(128, 50); x.quadraticCurveTo(190, 70, 175, 140); x.quadraticCurveTo(170, 95, 128, 92); x.fill();
  });
  const noteM = new THREE.SpriteMaterial({ map: notes, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.85 });
  const notesG = [];
  for (let k = 0; k < 9; k++) { const s = new THREE.Sprite(noteM); s.scale.setScalar(0.12 + Math.random() * 0.1); s.userData = { x: 1.4 + (Math.random() - 0.5) * 1.6, z: -4 + (Math.random() - 0.5) * 1.2, v: 0.15 + Math.random() * 0.15, o: Math.random() * 10 }; racine.add(s); notesG.push(s); }

  const tw = new THREE.Vector3(); racine.updateMatrixWorld(true); mesh.getWorldPosition(tw);
  const chemin = [
    { p: [0.3, -0.05, -1.0], c: [0.3, SOL + 1.2, -4.5] },
    { p: [0.15, tw.y + 0.15, -1.75], c: tw.toArray() },
  ];
  return {
    racine, porte, chemin, foyer: 4, fondScene: new THREE.Color('#121a30'), brouillard: [new THREE.Color('#1a2340'), 5, 22],
    maj(t, e) {
      const s = e.sigma;
      refl.material.uniforms.uOp.value = 0.16 * (1 - THREE.MathUtils.smoothstep(s, 0.35, 0.85));
      ht.material.opacity = 1 - THREE.MathUtils.smoothstep(s, 0.2, 0.6);
      for (const n of notesG) { const u = n.userData, y = ((t * u.v + u.o) % 3); n.position.set(u.x + Math.sin(t * 0.7 + u.o) * 0.2, SOL + 1.1 + y, u.z); n.material.opacity = 0.85; }
      noteM.opacity = 0.85 * (1 - THREE.MathUtils.smoothstep(s, 0.3, 0.7));
    },
  };
}
