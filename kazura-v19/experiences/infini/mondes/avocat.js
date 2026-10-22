// Niveau 3 : le cabinet de Maître Inès Varenne, avocate à Bordeaux, à l'heure bleue.
// Un bureau de noyer, la lampe de banquier au verre vert, les codes rouges et les dossiers, la pluie sur la grande fenêtre
// et la ville qui s'allume derrière. Porte : L'ÉCRAN DU TÉLÉPHONE posé sur le bureau (on finit à la verticale).
import { THREE, U, BRUIT, halo, particules, toile, proc, environnement, porteRect, reflet, ombre, rayon, boiteRonde } from './outils.js';

export function construire(ctx) {
  const { a, renderer, mobile } = ctx;
  const racine = new THREE.Group();
  const SOL = -1.25, PLATEAU = -0.42, FENETRE = -6.2;
  const env = environnement(renderer, { bas: '#0d1016', horizon: '#2c4a6a', haut: '#0b1424', soleil: [-0.3, 0.4, -1], soleilCouleur: '#ffd29a', panneaux: [[[0, 0.5, -4], '#6f92c4', [4, 2.4]], [[-1.5, 1, 0], '#ffb766', [0.6, 0.4]]] });

  // matières
  const noyer = proc(new THREE.MeshStandardMaterial({ color: '#6a3c22', roughness: 0.42, metalness: 0.0, envMap: env, envMapIntensity: 0.35 }), `
    vec3 albedo(vec3 p, vec3 base){ float g = fbm(vec2(p.x*1.4, p.z*16.0 + fbm(p.xz*3.0)*3.0)); float v = fbm(p.xz*vec2(0.6, 40.0));
      return base*(0.45 + 0.85*g*g)*(0.85 + 0.3*v); }`, 'noyer');
  const parquet = proc(new THREE.MeshStandardMaterial({ color: '#3b2516', roughness: 0.5, envMap: env, envMapIntensity: 0.5 }), `
    vec3 albedo(vec3 p, vec3 base){ vec2 q = vec2(p.x*1.6, p.y*7.0); q.x += floor(q.y)*0.37; float l = h21(vec2(floor(q.x), floor(q.y)));
      float j = smoothstep(0.0, 0.04, fract(q.y))*smoothstep(0.0, 0.01, fract(q.x));
      return base*(0.6 + 0.5*l)*(0.85 + 0.3*fbm(p.xy*vec2(2.0, 30.0)))*mix(0.5, 1.0, j); }`, 'parquet');
  const mur = new THREE.MeshStandardMaterial({ color: '#1d2a3a', roughness: 0.85 });
  const laiton = new THREE.MeshStandardMaterial({ color: '#c9a25a', roughness: 0.22, metalness: 1, envMap: env, envMapIntensity: 1.3 });

  // la pièce
  const sol = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), parquet); sol.rotation.x = -Math.PI / 2; sol.position.set(0, SOL, -4); racine.add(sol);
  const fond = new THREE.Mesh(new THREE.PlaneGeometry(20, 8), mur); fond.position.set(0, SOL + 4, FENETRE - 0.05); racine.add(fond);

  // la grande fenêtre : l'heure bleue, la ville floue, la pluie qui coule
  const fw = 3.6, fh = 3.0, fy = SOL + 2.35;
  const vitre = new THREE.Mesh(new THREE.PlaneGeometry(fw, fh), new THREE.ShaderMaterial({
    fog: false, uniforms: { uT: U.temps, uR: { value: new THREE.Vector2(fw, fh) } },
    vertexShader: `precision highp float; varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `precision highp float; varying vec2 vUv; uniform float uT; uniform vec2 uR; ${BRUIT}
      vec3 bokeh(vec2 p, float echelle, float graine){ vec2 g = p*echelle; vec2 i = floor(g); vec3 c = vec3(0.0);
        for (int dx = -1; dx <= 1; dx++) for (int dy = -1; dy <= 1; dy++){ vec2 j = i + vec2(dx, dy); float h = h21(j + graine);
          vec2 o = vec2(h21(j*1.7 + graine), h21(j*2.3 + graine)); float d = length(g - j - o); float r = 0.12 + 0.18*h;
          vec3 col = h > 0.6 ? vec3(1.0, 0.7, 0.35) : (h > 0.3 ? vec3(1.0, 0.85, 0.6) : vec3(0.5, 0.75, 1.0));
          c += col * smoothstep(r, r*0.8, d) * step(0.72, h21(j + graine*3.0)) * (0.5 + 0.5*smoothstep(0.0, r, d)); }
        return c; }
      void main(){ vec2 p = vUv*uR;
        // la goutte qui coule déforme ce qu'on voit
        float n = fbm(vec2(p.x*6.0, p.y*1.5 + uT*0.6)); vec2 dp = vec2(n - 0.5, 0.0)*0.06;
        float gouttes = smoothstep(0.82, 0.9, bruit(vec2(p.x*22.0, p.y*9.0 + uT*0.9 + h21(vec2(floor(p.x*22.0)))*20.0)));
        vec2 q = p + dp + gouttes*0.03;
        vec3 ciel = mix(vec3(0.05, 0.10, 0.22), vec3(0.20, 0.38, 0.58), smoothstep(0.0, 1.0, vUv.y)) ;
        ciel = mix(ciel, vec3(0.65, 0.45, 0.45), smoothstep(0.45, 0.2, vUv.y)*0.35);
        // les toits et les immeubles en ombre
        float toits = step(q.y, 0.55*uR.y*(0.55 + 0.25*bruit(vec2(floor(q.x*3.0), 1.0))) );
        vec3 c = mix(ciel, vec3(0.04, 0.05, 0.09), toits*0.85);
        c += bokeh(q, 3.2, 1.0)*0.32*toits + bokeh(q, 6.0, 7.0)*0.12*toits;
        c += vec3(0.8, 0.9, 1.0) * gouttes * 0.12;
        gl_FragColor = vec4(c*1.15, 1.0); }`,
  }));
  vitre.position.set(0, fy, FENETRE); racine.add(vitre);
  const menuis = new THREE.MeshStandardMaterial({ color: '#e9e3d8', roughness: 0.6 });
  const barre = (w, h, x, y) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.12), menuis); b.position.set(x, y, FENETRE + 0.04); racine.add(b); };
  barre(fw + 0.24, 0.12, 0, fy + fh / 2 + 0.06); barre(fw + 0.24, 0.16, 0, fy - fh / 2 - 0.08); barre(0.12, fh, -fw / 2 - 0.06, fy); barre(0.12, fh, fw / 2 + 0.06, fy);
  barre(0.06, fh, 0, fy); barre(fw, 0.05, 0, fy + fh * 0.18);
  const lv = new THREE.PointLight('#6f9ad8', 6, 9, 1.4); lv.position.set(0, fy, FENETRE + 1.2); racine.add(lv);

  // les bibliothèques de part et d'autre : rayonnages de livres reliés
  const livres = (x0, larg, z) => {
    const g = new THREE.Group(); g.position.set(x0, SOL, z); racine.add(g);
    const bois = new THREE.MeshStandardMaterial({ color: '#2a1a10', roughness: 0.6 });
    const caisse = new THREE.Mesh(new THREE.BoxGeometry(larg, 4.2, 0.45), bois); caisse.position.y = 2.1; caisse.position.z = -0.25; g.add(caisse);
    const coul = ['#7a1f1f', '#1f3d2a', '#24324f', '#6b4a1e', '#8c6b3a', '#3d1f2e', '#a33a2a', '#2d4a5a'];
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const mat = new THREE.MeshStandardMaterial({ roughness: 0.55, envMap: env, envMapIntensity: 0.4 });
    const n = Math.round(larg * 30) * 5; const inst = new THREE.InstancedMesh(geo, mat, n); let k = 0;
    const m4 = new THREE.Matrix4(), c = new THREE.Color();
    for (let et = 0; et < 5; et++) {
      let x = -larg / 2 + 0.06; const y = 0.25 + et * 0.8;
      const tab = new THREE.Mesh(new THREE.BoxGeometry(larg, 0.035, 0.42), bois); tab.position.set(0, y, 0); g.add(tab);
      while (x < larg / 2 - 0.08 && k < n) {
        const w = 0.025 + Math.random() * 0.035, h = 0.42 + Math.random() * 0.24;
        m4.makeScale(w, h, 0.26 + Math.random() * 0.06); m4.setPosition(x + w / 2, y + h / 2 + 0.018, 0.02);
        inst.setMatrixAt(k, m4); inst.setColorAt(k, c.set(coul[Math.floor(Math.random() * coul.length)]).multiplyScalar(0.7 + Math.random() * 0.5)); k++;
        x += w + 0.004; if (Math.random() < 0.04) x += 0.12;
      }
    }
    inst.count = k; g.add(inst);
  };
  livres(-fw / 2 - 1.6, 2.8, FENETRE + 0.25); livres(fw / 2 + 1.6, 2.8, FENETRE + 0.25);

  // le bureau
  const bureau = new THREE.Group(); bureau.position.set(0, 0, -2.6); racine.add(bureau);
  const plateau = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.07, 1.25), noyer); plateau.position.y = PLATEAU - 0.035; bureau.add(plateau);
  const cuir = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.55), new THREE.MeshStandardMaterial({ color: '#1c1410', roughness: 0.55, envMap: env, envMapIntensity: 0.4 })); cuir.rotation.x = -Math.PI / 2; cuir.position.set(0.1, PLATEAU + 0.001, 0.0); bureau.add(cuir);
  const caisson = new THREE.Mesh(new THREE.BoxGeometry(3.1, PLATEAU - SOL - 0.07, 1.15), noyer); caisson.position.y = (PLATEAU + SOL) / 2 - 0.035; caisson.position.z = -0.05; bureau.add(caisson);

  // la lampe de banquier
  const lampe = new THREE.Group(); lampe.position.set(-0.5, PLATEAU, -0.25); bureau.add(lampe);
  const pied = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.03, 32), laiton); pied.position.y = 0.015; lampe.add(pied);
  const tige = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.36, 12), laiton); tige.position.y = 0.2; lampe.add(tige);
  const abat = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.42, 32, 1, true, Math.PI, Math.PI), new THREE.MeshStandardMaterial({ color: '#0e5a36', roughness: 0.15, metalness: 0.1, envMap: env, envMapIntensity: 1.2, emissive: '#0a3a20', side: THREE.DoubleSide }));
  abat.rotation.z = Math.PI / 2; abat.position.y = 0.42; lampe.add(abat);
  const ampoule = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffd9a0').multiplyScalar(3) })); ampoule.position.y = 0.38; lampe.add(ampoule);
  const hL = halo('#ffc477', 1.1, 0.5); hL.position.y = 0.33; lampe.add(hL);
  const spot = new THREE.SpotLight('#ffcf8f', 16, 4, 1.0, 0.8, 1.3); spot.position.set(-0.5, PLATEAU + 0.36, -2.85); spot.target.position.set(-0.1, PLATEAU, -2.55); racine.add(spot, spot.target);
  const cone = rayon({ longueur: 0.42, r0: 0.15, r1: 0.55, couleur: '#ffc477', opacite: 0.08 }); cone.position.set(-0.5, PLATEAU + 0.38, -2.85); racine.add(cone);

  // sur le bureau : codes rouges empilés, dossiers, stylo plume, tasse fumante, balance
  const code = (x, y, z, ry, c) => { const b = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.06, 0.2), new THREE.MeshStandardMaterial({ color: c, roughness: 0.5, envMap: env, envMapIntensity: 0.4 })); b.position.set(x, PLATEAU + y, z); b.rotation.y = ry; bureau.add(b); };
  code(0.68, 0.03, -0.28, 0.1, '#a3202a'); code(0.7, 0.09, -0.29, 0.05, '#2a3d6a'); code(0.66, 0.15, -0.27, -0.06, '#a3202a');
  const dossier = (x, z, ry, c) => { const d = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.012, 0.25), new THREE.MeshStandardMaterial({ color: c, roughness: 0.85 })); d.position.set(x, PLATEAU + 0.006, z); d.rotation.y = ry; bureau.add(d); return d; };
  dossier(-0.2, 0.1, 0.2, '#d8c49a'); dossier(-0.18, 0.09, 0.12, '#b3c4d8').position.y += 0.012;
  const stylo = new THREE.Group(); stylo.position.set(0.4, PLATEAU + 0.009, 0.1); stylo.rotation.y = 1.25; bureau.add(stylo);
  const corps = new THREE.Mesh(new THREE.CapsuleGeometry(0.008, 0.13, 4, 12), new THREE.MeshStandardMaterial({ color: '#0c0c10', roughness: 0.1, metalness: 0.3, envMap: env, envMapIntensity: 1.5 })); corps.rotation.z = Math.PI / 2; stylo.add(corps);
  const bague = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.012, 12), laiton); bague.rotation.z = Math.PI / 2; bague.position.x = 0.03; stylo.add(bague);
  const tasse = new THREE.Group(); tasse.position.set(0.47, PLATEAU, -0.12); bureau.add(tasse);
  const tm = new THREE.MeshStandardMaterial({ color: '#f1ece2', roughness: 0.3, envMap: env });
  const tc = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.038, 0.085, 24, 1, true), tm); tc.position.y = 0.043; tasse.add(tc);
  const caf = new THREE.Mesh(new THREE.CircleGeometry(0.042, 24), new THREE.MeshStandardMaterial({ color: '#2a160a', roughness: 0.1 })); caf.rotation.x = -Math.PI / 2; caf.position.y = 0.075; tasse.add(caf);
  const sous = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.07, 0.008, 32), tm); tasse.add(sous);
  racine.add(particules({ n: 30, min: [0.43, PLATEAU + 0.1, -2.76], max: [0.51, PLATEAU + 0.5, -2.68], couleur: '#d8d4e0', taille: 0.06, opacite: 0.07, normal: true, vitesse: [0.005, 0.06, 0], tremble: 0.03 }));
  // la balance de la justice, en laiton
  const bal = new THREE.Group(); bal.position.set(0.95, PLATEAU, -0.2); bureau.add(bal);
  const bt = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.3, 8), laiton); bt.position.y = 0.15; bal.add(bt);
  const bb = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.24, 8), laiton); bb.rotation.z = Math.PI / 2; bb.position.y = 0.29; bal.add(bb);
  for (const s of [-1, 1]) { const pl = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), laiton); pl.position.set(s * 0.12, 0.18, 0); bal.add(pl); }
  const bs = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.015, 24), laiton); bal.add(bs);

  // un carnet ouvert et des lunettes, tout près du téléphone
  const pageC = toile(512, 360, (x, w, h) => { x.fillStyle = '#f6f1e6'; x.fillRect(0, 0, w, h); x.strokeStyle = 'rgba(40,60,110,0.25)'; x.lineWidth = 2; for (let y = 40; y < h; y += 26) { x.beginPath(); x.moveTo(20, y); x.lineTo(w - 20, y); x.stroke(); }
    x.fillStyle = '#1d2f5a'; x.font = 'italic 400 24px Newsreader, serif'; ['Audience du 14,', 'appeler M. Morel', 'pièces 3 à 7', '« clairement »'].forEach((t, k) => x.fillText(t, 36 + (k % 2) * 8, 62 + k * 52)); x.fillStyle = 'rgba(0,0,0,0.12)'; x.fillRect(w / 2 - 2, 0, 4, h); });
  const carnet = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.008, 0.21), [new THREE.MeshStandardMaterial({ color: '#2a2018' }), new THREE.MeshStandardMaterial({ color: '#2a2018' }), new THREE.MeshStandardMaterial({ map: pageC, roughness: 0.9 }), new THREE.MeshStandardMaterial({ color: '#2a2018' }), new THREE.MeshStandardMaterial({ color: '#efe8da' }), new THREE.MeshStandardMaterial({ color: '#efe8da' })]);
  carnet.position.set(-0.1, PLATEAU + 0.004, 0.1); carnet.rotation.y = 0.28; bureau.add(carnet);
  const lun = new THREE.Group(); lun.position.set(0.05, PLATEAU + 0.012, -0.14); lun.rotation.set(-Math.PI / 2, 0, -0.4); bureau.add(lun);
  for (const sx of [-1, 1]) { const v = new THREE.Mesh(new THREE.TorusGeometry(0.024, 0.0025, 8, 32), laiton); v.position.x = sx * 0.032; lun.add(v); const verre = new THREE.Mesh(new THREE.CircleGeometry(0.023, 24), new THREE.MeshStandardMaterial({ color: '#cfe0ff', transparent: true, opacity: 0.25, roughness: 0, metalness: 0.5, envMap: env })); verre.position.x = sx * 0.032; lun.add(verre); }
  const pont = new THREE.Mesh(new THREE.TorusGeometry(0.009, 0.002, 6, 12, Math.PI), laiton); pont.position.y = 0.006; lun.add(pont);

  // LE TÉLÉPHONE, posé à plat, l'écran allumé (porte)
  let hh, sw;
  if (a < 1) { hh = 0.075; sw = 2 * hh * a; } else { sw = Math.min(0.17, 0.12 * a); hh = sw / a / 2; }
  const tel = new THREE.Group(); tel.position.set(0.22, PLATEAU + 0.011, 0.08); tel.rotation.set(-Math.PI / 2, 0, 0.18); bureau.add(tel);
  const b = Math.min(sw, 2 * hh) * 0.06;
  const coque = new THREE.Mesh(boiteRonde(sw + b * 2, 2 * hh + b * 2, 0.006, Math.min(sw, 2 * hh) * 0.12), new THREE.MeshStandardMaterial({ color: '#0d0e12', roughness: 0.25, metalness: 0.6, envMap: env, envMapIntensity: 1.2 }));
  const rb = Math.min(sw, 2 * hh) * 0.12, ep = 0.006 / 2 + Math.min(rb, 0.006) * 0.4;
  coque.position.z = -ep - 0.0002; tel.add(coque);
  const { mesh, porte } = porteRect(hh, a, { fond: ctx.fondSuivant }); mesh.position.z = 0.0002; tel.add(mesh);
  const refl = reflet(sw, 2 * hh, { couleur: '#7f9ccc', couleur2: '#ffcf96', opacite: 0.16 }); refl.position.z = 0.0004; tel.add(refl);
  const lueurTel = halo('#ffd6e6', Math.max(sw, 2 * hh) * 3, 0.07); lueurTel.position.z = -0.002; tel.add(lueurTel);
  const ot = ombre(sw * 2.2, 2 * hh * 2.2, 0.5); ot.rotation.x = 0; ot.position.z = -0.0118; tel.add(ot);
  const lt = new THREE.PointLight('#ffd6e6', 0.04, 0.4, 2); lt.position.set(0.22, PLATEAU + 0.08, -2.5); racine.add(lt);

  racine.add(new THREE.HemisphereLight('#6f8cc4', '#3a2414', 1.1));
  const cle = new THREE.DirectionalLight('#8fb0e8', 0.9); cle.position.set(0.5, 2, -3); racine.add(cle);
  racine.add(particules({ n: mobile ? 90 : 160, min: [-1.6, PLATEAU, -3.6], max: [1.2, PLATEAU + 1.4, -1.6], couleur: '#ffd9a8', taille: 0.008, vitesse: [0.01, 0.012, 0.004], tremble: 0.05, scintille: 0.5, opacite: 0.7 }));

  const telW = new THREE.Vector3(0.22, PLATEAU, -2.52);
  const chemin = [
    { p: [0.15, -0.05, -0.9], c: [0, PLATEAU + 0.2, -3.4] },
    { p: [0.3, PLATEAU + 0.45, -1.75], c: telW.toArray() },
  ];
  return {
    racine, porte, chemin, foyer: 3.0, fondScene: new THREE.Color('#0d1320'), brouillard: [new THREE.Color('#141c2c'), 5, 22], approche: 3.6,
    maj(t, e) {
      const s = e.sigma;
      refl.material.uniforms.uOp.value = 0.16 * (1 - THREE.MathUtils.smoothstep(s, 0.35, 0.85));
      lueurTel.material.opacity = 1 - THREE.MathUtils.smoothstep(s, 0.3, 0.7);
      spot.intensity = 16 * (0.97 + 0.03 * Math.sin(t * 13) * Math.sin(t * 3.1));
    },
  };
}
