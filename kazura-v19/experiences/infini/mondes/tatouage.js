// Niveau 2 : Encre Néon, un atelier de tatouage dans une ruelle de Nantes, la nuit, sous la pluie.
// Briques mouillées, néons magenta et cyan qui se reflètent dans les flaques, guirlande au-dessus de la ruelle,
// et au fond, un œil immense peint sur le mur, cerné d'un néon. Porte : LA PUPILLE (ronde), qui s'ouvre quand on approche.
import { THREE, U, BRUIT, ciel, halo, particules, toile, proc, environnement, porteRonde, rayon } from './outils.js';

export function construire(ctx) {
  const { a, renderer, mobile } = ctx;
  const racine = new THREE.Group();
  const SOL = -1.6, FOND = -15, XG = -2.8, XD = 3.0;
  const ROSE = new THREE.Color('#ff3fa8'), CYAN = new THREE.Color('#3ff0ff'), MAUVE = new THREE.Color('#9a5cff');
  const env = environnement(renderer, { bas: '#05030a', horizon: '#2a0f3a', haut: '#07060f', soleil: [0, 0.3, -1], soleilCouleur: '#ff4fb0', panneaux: [[[-2, 1, -3], '#ff3fa8', [1.5, 0.4]], [[2, 0.5, -3], '#3ff0ff', [1, 0.6]], [[0, 2, 2], '#9a5cff', [3, 0.5]]] });

  racine.add(ciel({ bas: '#07050c', horizon: '#2b1238', haut: '#04040a', soleil: [0, 0.1, -1], soleilCouleur: '#ff4fb0', soleilTaille: 0, halo: 0.25, nuages: 0.5, nuageCouleur: '#3a1840' }));

  // matières
  const brique = (c, k) => proc(new THREE.MeshStandardMaterial({ color: c, roughness: 0.55, metalness: 0.05, envMap: env, envMapIntensity: 0.9 }), `
    vec3 albedo(vec3 p, vec3 base){ vec2 q = vec2(p.x/0.23, p.y/0.075); q.x += 0.5*step(1.0, mod(floor(q.y), 2.0));
      vec2 f = fract(q); float j = smoothstep(0.0, 0.05, f.x)*smoothstep(1.0, 0.95, f.x)*smoothstep(0.0, 0.12, f.y)*smoothstep(1.0, 0.88, f.y);
      float n = h21(floor(q) + ${k}.0); vec3 c = base*(0.6 + 0.6*n)*(0.75 + 0.4*fbm(p.xy*3.0));
      float mouille = smoothstep(0.55, 0.8, fbm(p.xy*vec2(1.0, 0.25) + ${k}.0)) * smoothstep(1.5, -1.0, p.y);
      return mix(base*0.18, c, j) * (1.0 - 0.35*mouille); }`, 'brique' + k);
  const sol = proc(new THREE.MeshStandardMaterial({ color: '#0c0b10', roughness: 0.32, metalness: 0.1, envMap: env, envMapIntensity: 0.55 }), `
    vec3 albedo(vec3 p, vec3 base){ float n = fbm(p.xy*1.2); float f = smoothstep(0.5, 0.62, n);
      return base*(0.7 + 0.6*fbm(p.xy*9.0))*(1.0 - 0.6*f) + vec3(0.01)*h21(floor(p.xy*90.0)); }`, 'asphalte');

  // la ruelle : sol, murs, fond
  const s = new THREE.Mesh(new THREE.PlaneGeometry(14, 40), sol); s.rotation.x = -Math.PI / 2; s.position.set(0, SOL, -8); racine.add(s);
  const mg = new THREE.Mesh(new THREE.PlaneGeometry(40, 16), brique('#6a2c22', 1)); mg.rotation.y = Math.PI / 2; mg.position.set(XG, SOL + 8, -8); racine.add(mg);
  const md = new THREE.Mesh(new THREE.PlaneGeometry(40, 16), brique('#5a2a2a', 2)); md.rotation.y = -Math.PI / 2; md.position.set(XD, SOL + 8, -8); racine.add(md);
  const mf = new THREE.Mesh(new THREE.PlaneGeometry(14, 16), brique('#3e2430', 3)); mf.position.set(0, SOL + 8, FOND); racine.add(mf);

  // l'œil peint au fond, cerné de néon ; la pupille est la porte
  const R = 0.62;                                  // rayon final de la pupille (porte)
  const Ri = R * 1.75, ew = Ri * 2.55, eh = Ri * 1.25;
  const yo = SOL + 2.35;
  const { mesh, porte } = porteRonde(R, a, { fond: ctx.fondSuivant });
  mesh.position.set(0, yo, FOND + 0.015); racine.add(mesh);
  const oeilU = { uT: U.temps, uRp: { value: R * 0.5 }, uRi: { value: Ri }, uW: { value: ew }, uH: { value: eh }, uOuv: { value: 0 } };
  const oeil = new THREE.Mesh(new THREE.PlaneGeometry(ew * 2.3, eh * 2.6), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: false, uniforms: oeilU,
    vertexShader: `precision highp float; varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `precision highp float; varying vec2 vP; uniform float uT, uRp, uRi, uW, uH, uOuv; ${BRUIT}
      void main(){
        vec2 p = vP; float r = length(p), ang = atan(p.y, p.x);
        // l'amande : deux arcs
        float xn = p.x / uW; float lid = uH * (1.0 - xn*xn) * (1.0 + 0.08*xn);
        float haut = lid, bas = -uH * 0.82 * (1.0 - xn*xn);
        float dedans = step(abs(xn), 1.0) * smoothstep(-0.01, 0.01, haut - p.y) * smoothstep(-0.01, 0.01, p.y - bas);
        // le blanc, ombré sous la paupière
        vec3 c = vec3(0.86, 0.84, 0.92) * (0.75 + 0.25*smoothstep(haut, haut - uH*0.8, p.y));
        c *= 0.85 + 0.15*fbm(p*6.0);
        // l'iris : fibres rayonnantes, du cyan au magenta, anneau sombre au bord
        float ir = smoothstep(uRi + 0.01, uRi - 0.01, r);
        float fib = fbm(vec2(ang*9.0, r*3.0)) * 0.6 + 0.4*fbm(vec2(ang*30.0, r*1.5));
        vec3 ic = mix(vec3(0.15, 0.95, 1.0), vec3(1.0, 0.22, 0.65), smoothstep(uRp, uRi, r) * 0.9 + 0.2*sin(ang*3.0 + uT*0.2));
        ic *= 0.35 + 1.1*fib;
        ic *= mix(0.25, 1.0, smoothstep(uRi, uRi*0.82, r));
        ic += vec3(1.0, 0.85, 0.5) * smoothstep(uRp*1.35, uRp*1.02, r) * 0.6;
        c = mix(c, ic, ir);
        // l'ombre de la paupière haute sur l'œil
        c *= 0.55 + 0.45*smoothstep(haut, haut - uH*0.35, p.y);
        // les traits peints : paupières épaisses, cils
        float trait = smoothstep(0.035, 0.0, abs(p.y - haut)) * step(abs(xn), 1.05) + smoothstep(0.022, 0.0, abs(p.y - bas)) * step(abs(xn), 1.0);
        float cils = 0.0;
        for (int k = 0; k < 9; k++){ float x0 = -0.8 + float(k)*0.2; vec2 b = vec2(x0*uW, uH*(1.0 - x0*x0)); vec2 d = p - b; vec2 dir = normalize(vec2(x0*0.8, 1.0)); float t = clamp(dot(d, dir), 0.0, uH*0.35); cils += smoothstep(0.02, 0.0, length(d - dir*t)) * step(0.0, dot(d, dir)); }
        float alpha = dedans;
        c = mix(c, vec3(0.03, 0.02, 0.05), clamp(trait + cils, 0.0, 1.0)); alpha = max(alpha, clamp(trait + cils, 0.0, 1.0));
        // un halo de peinture en bombe autour
        float spray = smoothstep(1.6, 0.9, length(p/vec2(uW, uH))) * 0.35 * (0.6 + 0.4*fbm(p*3.0));
        vec3 sc = mix(vec3(0.5, 0.1, 0.6), vec3(0.1, 0.5, 0.7), smoothstep(-uW, uW, p.x));
        c = mix(sc, c, alpha); alpha = max(alpha, spray);
        // la pupille : un trou, qui s'ouvre
        float pup = smoothstep(uRp - 0.004, uRp + 0.004, r);
        alpha *= pup;
        // liseré lumineux au bord de la pupille
        c += vec3(1.0, 0.4, 0.8) * smoothstep(0.03, 0.0, abs(r - uRp)) * 0.8 * dedans;
        gl_FragColor = vec4(c, alpha);
      }`,
  }));
  oeil.position.set(0, yo, FOND + 0.03); racine.add(oeil);
  // le néon qui cerne l'œil (deux arcs en tube) et sa lueur
  const arcs = [];
  for (const sgn of [1, -1]) {
    const pts = [];
    for (let k = 0; k <= 40; k++) { const xn = -1.05 + 2.1 * k / 40; pts.push(new THREE.Vector3(xn * ew, sgn > 0 ? eh * 1.12 * (1 - xn * xn) + 0.04 : -eh * 0.95 * (1 - xn * xn) - 0.04, 0)); }
    arcs.push(new THREE.CatmullRomCurve3(pts));
  }
  const neonM = (c, k = 4) => new THREE.MeshBasicMaterial({ color: c.clone().multiplyScalar(k), fog: false });
  const glowM = (c, op) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
  for (const [k, cv] of arcs.entries()) {
    const col = k ? CYAN : ROSE;
    const t1 = new THREE.Mesh(new THREE.TubeGeometry(cv, 80, 0.022, 8), neonM(col)); t1.position.set(0, yo, FOND + 0.08); racine.add(t1);
    const t2 = new THREE.Mesh(new THREE.TubeGeometry(cv, 80, 0.09, 8), glowM(col, 0.18)); t2.position.copy(t1.position); racine.add(t2);
  }
  const ho = halo('#c04dff', ew * 3.2, 0.3); ho.position.set(0, yo, FOND + 0.6); racine.add(ho);
  // reflets sur la cornée
  const reflU = { uOp: { value: 1 } };
  const cornee = new THREE.Mesh(new THREE.CircleGeometry(Ri * 1.02, 64), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, uniforms: { ...reflU, uT: U.temps },
    vertexShader: `precision highp float; varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `precision highp float; varying vec2 vP; uniform float uOp, uT;
      void main(){ vec2 p = vP; float f1 = smoothstep(0.16, 0.0, length((p - vec2(-0.42, 0.38))*vec2(1.0, 1.6)));
        float f2 = smoothstep(0.07, 0.0, length(p - vec2(0.35, -0.3)));
        float f3 = smoothstep(0.03, 0.0, abs(length(p - vec2(-0.1, 0.1)) - 0.62)) * smoothstep(0.2, 0.8, p.y + p.x*0.3);
        vec3 c = vec3(1.0, 0.75, 0.95)*f1*0.9 + vec3(0.6, 1.0, 1.0)*f2*0.8 + vec3(0.9, 0.6, 1.0)*f3*0.25;
        gl_FragColor = vec4(c*uOp, 1.0); }`,
  }));
  cornee.position.set(0, yo, FOND + 0.05); racine.add(cornee);

  // l'atelier : vitrine sombre à gauche, enseignes au néon
  const vitreM = new THREE.MeshStandardMaterial({ color: '#08070c', roughness: 0.05, metalness: 0.9, envMap: env, envMapIntensity: 1.4 });
  const vit = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 2.2), vitreM); vit.rotation.y = Math.PI / 2; vit.position.set(XG + 0.01, SOL + 1.75, -7.2); racine.add(vit);
  const cadreM = new THREE.MeshStandardMaterial({ color: '#111014', roughness: 0.4, metalness: 0.6, envMap: env });
  const cad = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.5, 4.5), cadreM); cad.position.set(XG + 0.02, SOL + 1.75, -7.2); racine.add(cad);
  cad.material = cadreM; cad.scale.set(1, 1, 1);
  const enseigne = (texte, taille, couleur, w, h, police) => toile(1024, Math.round(1024 * h / w), (x, W, H) => {
    x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = police(H);
    try { x.fontStretch = 'condensed'; } catch {}
    x.shadowColor = couleur; x.shadowBlur = H * 0.12; x.fillStyle = couleur;
    for (let k = 0; k < 3; k++) x.fillText(texte, W / 2, H / 2);
    x.shadowBlur = H * 0.03; x.fillStyle = '#fff2fb'; x.fillText(texte, W / 2, H / 2);
  });
  const planNeon = (tex, w, h, intensite = 2.2) => new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: new THREE.Color(intensite, intensite, intensite), fog: false }));
  const n1 = planNeon(enseigne('ENCRE NÉON', 1, '#ff3fa8', 3.4, 0.7, (H) => `800 ${H * 0.62}px "Bricolage Grotesque", sans-serif`), 3.4, 0.7);
  n1.rotation.y = Math.PI / 2; n1.position.set(XG + 0.06, SOL + 3.25, -7.2); racine.add(n1);
  const n2 = planNeon(enseigne('tattoo', 1, '#3ff0ff', 1.8, 0.7, (H) => `italic 400 ${H * 0.7}px Newsreader, serif`), 1.8, 0.7);
  n2.rotation.y = Math.PI / 2; n2.position.set(XG + 0.05, SOL + 1.9, -6.2); racine.add(n2);
  const n3 = planNeon(enseigne('OUVERT', 1, '#3ff0ff', 1.0, 0.32, (H) => `700 ${H * 0.6}px "JetBrains Mono", monospace`), 1.0, 0.32, 2.6);
  n3.rotation.y = Math.PI / 2; n3.position.set(XG + 0.05, SOL + 2.3, -10.2); racine.add(n3);
  // une enseigne en drapeau, verticale, côté droit
  const dr = new THREE.Group(); dr.position.set(XD - 0.6, SOL + 4.1, -9.5); racine.add(dr);
  const bras = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.05, 0.05), cadreM); bras.position.set(0.3, 1.05, 0); dr.add(bras);
  const panneau = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.9, 0.08), new THREE.MeshStandardMaterial({ color: '#0b0a10', roughness: 0.3, metalness: 0.5, envMap: env })); dr.add(panneau);
  const n4 = planNeon(enseigne('ENCRE', 1, '#ff3fa8', 0.45, 1.7, (H) => `800 ${H * 0.2}px "Bricolage Grotesque", sans-serif`), 0.45, 1.7, 2.4);
  n4.position.z = 0.05; dr.add(n4);
  // un néon en forme de rose, à droite de l'œil
  const rose = new THREE.Group(); rose.position.set(ew * 1.25, yo + eh * 0.6, FOND + 0.08); racine.add(rose);
  const roseC = new THREE.CatmullRomCurve3(Array.from({ length: 60 }, (_, k) => { const t = k / 59 * Math.PI * 5; const r = 0.05 + t * 0.022; return new THREE.Vector3(Math.cos(t) * r, Math.sin(t) * r * 0.85, 0); }));
  rose.add(new THREE.Mesh(new THREE.TubeGeometry(roseC, 120, 0.014, 6), neonM(ROSE, 3.5)));
  rose.add(new THREE.Mesh(new THREE.TubeGeometry(roseC, 120, 0.06, 6), glowM(ROSE, 0.15)));
  const tige = new THREE.CatmullRomCurve3([new THREE.Vector3(0, -0.4, 0), new THREE.Vector3(0.05, -0.8, 0), new THREE.Vector3(-0.05, -1.2, 0)]);
  rose.add(new THREE.Mesh(new THREE.TubeGeometry(tige, 20, 0.014, 6), neonM(CYAN, 3)));

  // les reflets des néons dans les flaques : traînées verticales qui frissonnent
  const traineeM = (c, op) => new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, uniforms: { uC: { value: c }, uOp: { value: op }, uT: U.temps },
    vertexShader: `precision highp float; varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `precision highp float; varying vec2 vUv; uniform vec3 uC; uniform float uOp, uT; ${BRUIT}
      void main(){ float x = vUv.x - 0.5 + (bruit(vec2(vUv.y*30.0, uT*2.0)) - 0.5)*0.12;
        float a = smoothstep(0.5, 0.0, abs(x)*2.0) * pow(vUv.y, 1.6) * (0.5 + 0.5*bruit(vec2(vUv.y*14.0 - uT*0.8, x*6.0)));
        gl_FragColor = vec4(uC*a*uOp, 1.0); }`,
  });
  const trainee = (x, z, w, l, c, op) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, l), traineeM(c, op)); m.rotation.x = -Math.PI / 2; m.position.set(x, SOL + 0.01, z + l / 2); racine.add(m); };
  trainee(0, FOND + 0.2, ew * 1.4, 7, new THREE.Color('#d050ff'), 0.55);
  trainee(XG + 0.9, -7.2 - 1.6, 1.6, 5, ROSE, 0.5);
  trainee(XG + 0.6, -10.2 - 0.3, 0.6, 3, CYAN, 0.5);
  trainee(XD - 0.6, -9.5 - 1.2, 0.5, 4, ROSE, 0.4);

  // la guirlande au-dessus de la ruelle
  const ampM = new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffc27a').multiplyScalar(2.5) });
  const ampG = new THREE.SphereGeometry(0.035, 8, 6);
  for (const [z0, y0] of [[-4.5, SOL + 4.6], [-8.5, SOL + 5.1], [-12.5, SOL + 4.8]]) {
    const pts = []; for (let k = 0; k <= 20; k++) { const t = k / 20; pts.push(new THREE.Vector3(XG + (XD - XG) * t, y0 - Math.sin(t * Math.PI) * 0.55, z0 + Math.sin(t * 3) * 0.2)); }
    const c = new THREE.CatmullRomCurve3(pts);
    racine.add(new THREE.Mesh(new THREE.TubeGeometry(c, 30, 0.006, 4), cadreM));
    for (let k = 1; k < 12; k++) { const p = c.getPoint(k / 12); const b = new THREE.Mesh(ampG, ampM); b.position.copy(p).y -= 0.05; racine.add(b); const h = halo('#ffb060', 0.45, 0.6); h.position.copy(b.position); racine.add(h); }
  }
  // des tuyaux et une bouche d'aération qui fume
  const tuyau = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 12, 10), cadreM); tuyau.position.set(XD - 0.1, SOL + 6, -5.5); racine.add(tuyau);
  const clim = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.6, 0.9), new THREE.MeshStandardMaterial({ color: '#4b4d55', roughness: 0.6, metalness: 0.5, envMap: env })); clim.position.set(XD - 0.2, SOL + 3.2, -6.8); racine.add(clim);

  // les lumières
  racine.add(new THREE.HemisphereLight('#3a2a6a', '#120a14', 0.6));
  const l1 = new THREE.PointLight(ROSE, 14, 10, 1.6); l1.position.set(XG + 0.8, SOL + 3, -7.2); racine.add(l1);
  const l2 = new THREE.PointLight(CYAN, 8, 7, 1.6); l2.position.set(XG + 0.8, SOL + 2, -10.2); racine.add(l2);
  const l3 = new THREE.PointLight(MAUVE, 16, 9, 1.4); l3.position.set(0, yo, FOND + 2.5); racine.add(l3);
  const l4 = new THREE.PointLight('#ffb060', 5, 8, 1.6); l4.position.set(0, SOL + 4.5, -8.5); racine.add(l4);

  // la pluie, les éclaboussures de lumière, la vapeur
  racine.add(particules({ n: mobile ? 700 : 1400, min: [XG, SOL, FOND + 0.5], max: [XD, SOL + 7, -1], couleur: '#b9c8ff', couleur2: '#ffb3e6', taille: 0.05, forme: 'strie', vitesse: [0.3, -7.5, 0], tremble: 0.02, opacite: 0.32 }));
  racine.add(particules({ n: 50, min: [XG, SOL, FOND + 1], max: [XD, SOL + 5, -2], couleur: '#ff6fc0', couleur2: '#6ff6ff', taille: 0.16, forme: 'bokeh', opacite: 0.12, vitesse: [0.03, 0.02, 0], tremble: 0.2 }));
  racine.add(particules({ n: 40, min: [0.6, SOL, -6.5], max: [2.4, SOL + 3.5, -4.5], couleur: '#b9a8d8', taille: 0.9, opacite: 0.05, normal: true, vitesse: [0.05, 0.35, 0], tremble: 0.25 }));
  const fum = rayon({ longueur: 6, r0: 0.3, r1: 1.6, couleur: '#c04dff', opacite: 0.06 }); fum.position.set(0, SOL + 6.5, FOND + 1.2); racine.add(fum);

  const chemin = [
    { p: [0.25, -0.35, -3.2], c: [0, yo, FOND] },
    { p: [-0.2, yo * 0.6 - 0.1, -8.4], c: [0, yo, FOND] },
  ];
  return {
    racine, porte, chemin, foyer: -FOND, fondScene: new THREE.Color('#0a0710'), brouillard: [new THREE.Color('#1c0f26'), 6, 32],
    depli: (sg) => THREE.MathUtils.smoothstep(sg, 0.3, 0.95),
    maj(t, e) {
      const sg = e.sigma;
      // la pupille s'ouvre en approchant ; la porte suit son ouverture
      const ouv = THREE.MathUtils.smoothstep(sg, 0.08, 0.7);
      const rp = R * (0.5 + 0.54 * ouv) * (1 + 0.02 * Math.sin(t * 1.3) * (1 - ouv));
      oeilU.uRp.value = rp;
      mesh.scale.setScalar(Math.min(1, rp / R));
      porte.mat.uniforms.uLum.value = 0.55 + 0.45 * THREE.MathUtils.smoothstep(sg, 0.2, 0.8);
      reflU.uOp.value = 1 - THREE.MathUtils.smoothstep(sg, 0.3, 0.75);
      ho.material.opacity = 1 - THREE.MathUtils.smoothstep(sg, 0.08, 0.45);
      const clign = Math.pow(Math.max(0, Math.sin(t * 1.7)), 30);
      n3.material.color.setScalar(2.6 * (1 - 0.8 * clign));
    },
  };
}
