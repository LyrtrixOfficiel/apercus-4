/* Kazura v12, le Monde : l'atmosphère.
   - le ciel : un dôme velouté (dégradé, halo vers la lumière, nuées très douces, étoiles la nuit) ;
   - les lucioles : points de lumière qui dérivent, violets la nuit, pollen doré à l'aube, spores de
     jade au matin, roses au crépuscule ;
   - l'étincelle de l'ouverture, l'onde de lumière du sceau, les gerbes (le toucher d'une feuille) ;
   - l'environnement calculé (PMREM) : une salle de nuit avec des boîtes à lumière violette, dorée et
     jade, pour que le jade ait de vrais reflets colorés. */
import { hasard, GLSL_BRUIT } from './commun.js';

export function creerCiel(THREE) {
  const u = {
    uZen: { value: new THREE.Color() }, uHor: { value: new THREE.Color() }, uHalo: { value: new THREE.Color() },
    uHaloForce: { value: 0.5 }, uLumDir: { value: new THREE.Vector3(0.3, 0.5, -1).normalize() },
    uEtoiles: { value: 1 }, uTemps: { value: 0 }, uLumiere: { value: 1 },
  };
  const m = new THREE.ShaderMaterial({
    uniforms: u, side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false,
    vertexShader: /* glsl */ `varying vec3 vDir; void main() { vDir = position; vec4 p = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * p; gl_Position.z = gl_Position.w; }`,
    fragmentShader: /* glsl */ `
      ${GLSL_BRUIT}
      uniform vec3 uZen; uniform vec3 uHor; uniform vec3 uHalo; uniform float uHaloForce; uniform vec3 uLumDir;
      uniform float uEtoiles; uniform float uTemps; uniform float uLumiere;
      varying vec3 vDir;
      void main() {
        vec3 d = normalize(vDir);
        float h = d.y;
        vec3 c = h > 0.0 ? mix(uHor, uZen, smoothstep(0.0, 0.75, h)) : mix(uHor, uZen * 0.6, smoothstep(0.0, -0.7, h));
        float mu = clamp(dot(d, uLumDir), 0.0, 1.0);
        c += uHalo * uHaloForce * (pow(mu, 12.0) * 0.45 + pow(mu, 80.0) * 0.9 + pow(mu, 2.5) * 0.05);
        float n = kzFbm(d * 2.6 + vec3(0.0, 0.0, uTemps * 0.008));
        float n2 = kzFbm(d * 7.0 - vec3(uTemps * 0.004, 0.0, 0.0));
        c *= 0.62 + 0.55 * n * n + 0.14 * n2;
        vec3 g = d * 260.0; vec3 id = floor(g); float hs = kzHash(id);
        float e = step(0.9972, hs) * (1.0 - smoothstep(0.08, 0.32, length(fract(g) - 0.5)));
        c += vec3(0.85, 0.8, 1.0) * e * uEtoiles * (0.35 + 0.35 * sin(uTemps * (1.0 + hs * 3.0) + hs * 90.0)) * smoothstep(-0.05, 0.25, h);
        gl_FragColor = vec4(c * uLumiere, 1.0);
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(200, 48, 24), m);
  mesh.renderOrder = -10;
  mesh.frustumCulled = false;
  return { mesh, u };
}

/* Lucioles réparties dans un tube autour de l'axe de la liane (et autour du sceau). */
export function creerLucioles(THREE, traces, { mobile }) {
  const alea = hasard(404);
  const n = mobile ? 380 : 1100;
  const pos = new Float32Array(n * 3), gr = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) {
    const u = -6 + alea() * (traces.L + 4);
    let p;
    if (u < 0) p = new THREE.Vector3((alea() - 0.5) * 7, (alea() - 0.5) * 5, -u * 0.8 - 1);
    else {
      const c = traces.cadre(u);
      const a = alea() * Math.PI * 2, r = 0.6 + Math.pow(alea(), 0.7) * 4.2;
      p = c.p.clone().addScaledVector(c.cote, Math.cos(a) * r * 1.2 + 0.4).addScaledVector(c.haut, Math.sin(a) * r * 0.8 + 0.4);
    }
    pos.set([p.x, p.y, p.z], i * 3);
    gr.set([alea(), alea(), alea(), alea()], i * 4);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aGr', new THREE.BufferAttribute(gr, 4));
  const u = {
    uTemps: { value: 0 }, uCouleur: { value: new THREE.Color(0xc084fc) }, uInt: { value: 0 },
    uTaille: { value: 1 }, uDens: { value: 0.04 }, uVent: { value: 0.4 },
  };
  const m = new THREE.ShaderMaterial({
    uniforms: u, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
    vertexShader: /* glsl */ `
      attribute vec4 aGr; uniform float uTemps; uniform float uTaille; uniform float uDens; uniform float uVent;
      varying float vA; varying float vT;
      void main() {
        vec3 p = position;
        float t = uTemps * (0.15 + 0.2 * aGr.x) + aGr.y * 60.0;
        p += vec3(sin(t * 1.1) + 0.5 * sin(t * 2.3), cos(t * 0.9) * 0.7 + 0.3 * sin(t * 1.7), sin(t * 0.7 + 1.0)) * (0.25 + 0.25 * aGr.z);
        p.x += uVent * 0.15 * sin(uTemps * 0.6 + p.z * 0.2);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        float d = -mv.z;
        float scint = pow(0.5 + 0.5 * sin(uTemps * (1.5 + aGr.w * 2.5) + aGr.x * 40.0), 3.0);
        vA = (0.25 + 0.75 * scint) * exp(-d * uDens * 0.9) * smoothstep(1.0, 2.6, d);
        vT = aGr.w;
        gl_PointSize = min(uTaille * (2.0 + 4.0 * aGr.z) * (6.0 / max(d, 0.5)), uTaille * 9.0);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uCouleur; uniform float uInt; varying float vA; varying float vT;
      void main() {
        vec2 q = gl_PointCoord - 0.5; float r = length(q) * 2.0;
        float a = exp(-r * r * 5.0) + 0.6 * exp(-r * r * 40.0);
        vec3 c = mix(uCouleur, vec3(1.0), 0.25 + 0.2 * vT);
        gl_FragColor = vec4(c * a * vA * uInt, 1.0);
      }`,
  });
  const pts = new THREE.Points(g, m);
  pts.frustumCulled = false;
  return { mesh: pts, u };
}

/* Une carte toujours tournée vers la caméra, dessinée par un nuanceur additif (étincelle, éclat). */
export function creerEtincelle(THREE) {
  const u = { uCouleur: { value: new THREE.Color(0xb57bff) }, uInt: { value: 0 }, uTemps: { value: 0 }, uRayons: { value: 1 } };
  const m = new THREE.ShaderMaterial({
    uniforms: u, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uCouleur; uniform float uInt; uniform float uTemps; uniform float uRayons; varying vec2 vUv;
      void main() {
        vec2 q = (vUv - 0.5) * 2.0; float r = length(q);
        float coeur = exp(-r * r * 260.0) * 6.0;
        float halo = exp(-r * r * 18.0) * 0.45 + exp(-r * 6.0) * 0.18;
        float a = atan(q.y, q.x);
        float ray = pow(abs(cos(a * 2.0 + 0.4)), 60.0) * exp(-r * 5.5) * 0.9 + pow(abs(cos(a * 3.0 + uTemps * 0.3)), 90.0) * exp(-r * 8.0) * 0.5;
        float fl = 0.9 + 0.1 * sin(uTemps * 31.0) * sin(uTemps * 17.0);
        vec3 c = uCouleur * (halo + ray * uRayons) + mix(uCouleur, vec3(1.0), 0.65) * coeur;
        gl_FragColor = vec4(c * uInt * fl * smoothstep(1.0, 0.7, r), 1.0);
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), m);
  mesh.renderOrder = 20; mesh.frustumCulled = false;
  return { mesh, u };
}

/* L'onde de lumière qui part de l'anneau quand le sceau rayonne. */
export function creerOnde(THREE) {
  const u = { uR: { value: 1.2 }, uA: { value: 0 }, uLarg: { value: 0.12 }, uCouleur: { value: new THREE.Color(0xa855f7) } };
  const m = new THREE.ShaderMaterial({
    uniforms: u, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: /* glsl */ `varying vec2 vP; void main() { vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform float uR; uniform float uA; uniform float uLarg; uniform vec3 uCouleur; varying vec2 vP;
      void main() {
        float r = length(vP);
        float b = exp(-pow((r - uR) / uLarg, 2.0)) + 0.35 * exp(-pow((r - uR * 0.92) / (uLarg * 2.5), 2.0));
        gl_FragColor = vec4(uCouleur * b * uA, 1.0);
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), m);
  mesh.renderOrder = 15; mesh.frustumCulled = false; mesh.position.z = -0.01;
  return { mesh, u };
}

/* Gerbes : quatre bouffées de particules réutilisées (toucher d'une feuille, rayonnement du sceau). */
export function creerGerbes(THREE, { mobile }) {
  const parGerbe = mobile ? 28 : 48, nb = 4, n = parGerbe * nb;
  const alea = hasard(9);
  const dir = new Float32Array(n * 3), gr = new Float32Array(n * 4), pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const v = new THREE.Vector3(alea() - 0.5, alea() - 0.5, alea() - 0.5).normalize();
    dir.set([v.x, v.y, v.z], i * 3);
    gr.set([Math.floor(i / parGerbe), 0.4 + alea() * 0.8, alea(), alea()], i * 4);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aDir', new THREE.BufferAttribute(dir, 3));
  g.setAttribute('aGr', new THREE.BufferAttribute(gr, 4));
  const u = {
    uTemps: { value: 0 }, uTaille: { value: 1 },
    uOrig: { value: [0, 1, 2, 3].map(() => new THREE.Vector3()) }, uT0: { value: [-100, -100, -100, -100] },
    uEch: { value: [1, 1, 1, 1] }, uPlan: { value: [0, 0, 0, 0] },
    uCouleur: { value: new THREE.Color(0xc084fc) },
  };
  const m = new THREE.ShaderMaterial({
    uniforms: u, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      attribute vec3 aDir; attribute vec4 aGr;
      uniform float uTemps; uniform float uTaille; uniform vec3 uOrig[4]; uniform float uT0[4]; uniform float uEch[4]; uniform float uPlan[4];
      varying float vA;
      void main() {
        int k = int(aGr.x + 0.5);
        float dt = uTemps - uT0[k];
        float vie = dt / (1.4 + aGr.w);
        vec3 d = aDir;
        if (uPlan[k] > 0.5) { d = normalize(vec3(aDir.xy, aDir.z * 0.15)); }
        vec3 p = uOrig[k] + d * aGr.y * uEch[k] * (1.0 - exp(-dt * 2.6)) + vec3(0.0, dt * 0.1 * uEch[k], 0.0);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        vA = (dt > 0.0 && vie < 1.0) ? pow(1.0 - vie, 2.0) * smoothstep(0.0, 0.06, dt) : 0.0;
        gl_PointSize = vA > 0.0 ? uTaille * (2.5 + 3.0 * aGr.z) * (5.0 / max(-mv.z, 0.4)) : 0.0;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uCouleur; varying float vA;
      void main() { vec2 q = gl_PointCoord - 0.5; float r = length(q) * 2.0; float a = exp(-r * r * 6.0) + 0.8 * exp(-r * r * 50.0);
        gl_FragColor = vec4(mix(uCouleur, vec3(1.0), 0.3) * a * vA * 2.2, 1.0); }`,
  });
  const pts = new THREE.Points(g, m);
  pts.frustumCulled = false; pts.renderOrder = 12;
  let prochaine = 0;
  return {
    mesh: pts, u,
    lancer(origine, temps, { ech = 1, plan = false } = {}) {
      const k = prochaine; prochaine = (prochaine + 1) % nb;
      u.uOrig.value[k].copy(origine); u.uT0.value[k] = temps; u.uEch.value[k] = ech; u.uPlan.value[k] = plan ? 1 : 0;
    },
  };
}

/* Environnement calculé : une salle de nuit, ses boîtes à lumière, passée au PMREM une seule fois. */
export function creerEnvironnement(THREE, renderer) {
  const sc = new THREE.Scene();
  const fond = new THREE.Mesh(new THREE.SphereGeometry(50, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide,
    vertexShader: 'varying vec3 vD; void main(){ vD = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'varying vec3 vD; void main(){ vec3 d = normalize(vD); vec3 c = mix(vec3(0.010,0.018,0.016), vec3(0.03,0.02,0.06), smoothstep(-0.3,0.8,d.y)); gl_FragColor = vec4(c,1.0); }',
  }));
  sc.add(fond);
  const boite = (couleur, intensite, l, h, pos, cible) => {
    const mm = new THREE.MeshBasicMaterial({ color: new THREE.Color(couleur).multiplyScalar(intensite), side: THREE.DoubleSide });
    const b = new THREE.Mesh(new THREE.PlaneGeometry(l, h), mm);
    b.position.copy(pos); b.lookAt(cible); sc.add(b);
  };
  const o = new THREE.Vector3();
  boite(0x9b6cff, 7, 18, 8, new THREE.Vector3(-14, 16, -10), o);   // grande boîte violette, haut gauche
  boite(0xffd59a, 9, 4, 22, new THREE.Vector3(18, 4, -12), o);     // bande dorée à droite
  boite(0xd9fff0, 14, 6, 4, new THREE.Vector3(6, 20, -24), o);     // clé froide devant, en haut
  boite(0x2bd59b, 3, 30, 8, new THREE.Vector3(0, -16, 4), o);      // rebond de jade au sol
  boite(0xc9a5ff, 5, 12, 3, new THREE.Vector3(2, 15, 17), o);       // liseré derrière la caméra
  boite(0xfff1dc, 10, 14, 4, new THREE.Vector3(-6, 19, 9), o);    // grand plafond doux derrière la caméra : reflets sur les arrondis
  boite(0xb7f5dc, 4, 5, 14, new THREE.Vector3(-18, 2, 12), o);     // bande froide à gauche
  boite(0xe2c8ff, 4, 5, 12, new THREE.Vector3(17, -3, 14), o);     // bande lilas à droite
  const pm = new THREE.PMREMGenerator(renderer);
  const rt = pm.fromScene(sc, 0.02, 0.1, 100);
  pm.dispose();
  sc.traverse((ob) => { if (ob.geometry) ob.geometry.dispose(); if (ob.material) ob.material.dispose(); });
  return rt;
}

/* Bokeh : de grands disques très doux tout près de la trajectoire de la caméra, comme des lucioles
   hors de mise au point. Ils donnent la profondeur d'un objectif ouvert sans coûter un flou réel. */
export function creerBokeh(THREE, traces, { mobile }) {
  const alea = hasard(808);
  const n = mobile ? 70 : 160;
  const pos = new Float32Array(n * 3), gr = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) {
    const u = 2 + alea() * (traces.L - 4);
    const c = traces.cadre(u);
    const a = alea() * Math.PI * 2, r = 0.5 + alea() * 2.4;
    const p = c.p.clone().addScaledVector(c.cote, -1.2 + Math.cos(a) * r * 1.3).addScaledVector(c.haut, 0.3 + Math.sin(a) * r);
    pos.set([p.x, p.y, p.z], i * 3);
    gr.set([alea(), alea(), alea(), alea()], i * 4);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aGr', new THREE.BufferAttribute(gr, 4));
  const u = { uTemps: { value: 0 }, uCouleur: { value: new THREE.Color(0xc084fc) }, uInt: { value: 0 }, uTaille: { value: 1 } };
  const m = new THREE.ShaderMaterial({
    uniforms: u, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, fog: false,
    vertexShader: /* glsl */ `
      attribute vec4 aGr; uniform float uTemps; uniform float uTaille; varying float vA; varying float vG;
      void main() {
        vec3 p = position + vec3(sin(uTemps * 0.21 + aGr.x * 30.0), cos(uTemps * 0.17 + aGr.y * 30.0), 0.0) * 0.12;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        float d = -mv.z;
        vA = smoothstep(0.3, 0.9, d) * (1.0 - smoothstep(3.5, 6.5, d)) * (0.5 + 0.5 * sin(uTemps * (0.4 + aGr.z) + aGr.w * 20.0));
        vG = aGr.w;
        gl_PointSize = d > 0.0 ? uTaille * (34.0 + 50.0 * aGr.z) / max(d, 0.3) : 0.0;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uCouleur; uniform float uInt; varying float vA; varying float vG;
      void main() {
        float r = length(gl_PointCoord - 0.5) * 2.0;
        float disque = smoothstep(1.0, 0.82, r) * (0.55 + 0.45 * smoothstep(0.35, 0.95, r));
        vec3 c = mix(uCouleur, vec3(1.0, 0.95, 0.85), 0.15 + 0.2 * vG);
        gl_FragColor = vec4(c * disque * vA * uInt * 0.1, 1.0);
      }`,
  });
  const pts = new THREE.Points(g, m);
  pts.frustumCulled = false; pts.renderOrder = 30;
  return { mesh: pts, u };
}

/* Matériau des lianes lointaines : perspective aérienne. Plus elles sont loin, plus elles se fondent
   dans la brume ; elles restent un peu plus sombres que le ciel, avec un liseré de la lumière. */
export function materiauSilhouette(THREE) {
  const u = {
    uTemps: { value: 0 }, uVent: { value: 0.4 }, uBrume: { value: new THREE.Color() }, uHalo: { value: new THREE.Color() },
    uLumDir: { value: new THREE.Vector3(0, 0, -1) }, uZen: { value: new THREE.Color() }, uHor: { value: new THREE.Color() },
    uHaloForce: { value: 0.5 }, uLumMonde: { value: new THREE.Vector3(0, 0, -1) }, uLumiere: { value: 1 },
  };
  const m = new THREE.ShaderMaterial({
    uniforms: u, fog: false,
    vertexShader: /* glsl */ `
      attribute vec3 aAxe; uniform float uTemps; uniform float uVent;
      varying float vD; varying vec3 vN; varying vec3 vV; varying vec3 vDir;
      void main() {
        vDir = (modelMatrix * vec4(position, 1.0)).xyz - cameraPosition;
        float a = uTemps * 0.3 + aAxe.y * 0.2 + aAxe.z * 0.05;
        vec3 p = position + vec3(sin(a), 0.0, cos(a * 0.7)) * 0.08 * uVent * clamp(4.0 - aAxe.y * 0.2, 0.0, 4.0) * 0.25;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        vD = -mv.z; vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uBrume; uniform vec3 uHalo; uniform vec3 uLumDir; uniform vec3 uZen; uniform vec3 uHor; uniform float uHaloForce;
      uniform vec3 uLumMonde; uniform float uLumiere;
      varying float vD; varying vec3 vN; varying vec3 vV; varying vec3 vDir;
      void main() {
        vec3 d = normalize(vDir);
        vec3 ciel = d.y > 0.0 ? mix(uHor, uZen, smoothstep(0.0, 0.75, d.y)) : mix(uHor, uZen * 0.6, smoothstep(0.0, -0.7, d.y));
        float mu = clamp(dot(d, uLumMonde), 0.0, 1.0);
        ciel += uHalo * uHaloForce * (pow(mu, 12.0) * 0.45 + pow(mu, 2.5) * 0.05);
        float f = smoothstep(4.0, 26.0, vD);
        float rim = pow(1.0 - abs(dot(vN, vV)), 3.0) * max(dot(vN, uLumDir), 0.0);
        vec3 c = ciel * mix(0.42, 0.9, f) * uLumiere + uHalo * rim * 0.12 * (1.0 - f);
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  return { materiau: m, u };
}

/* L'aura : un halo violet très doux derrière le sceau, qui respire lentement. */
export function creerAura(THREE) {
  const u = { uInt: { value: 0 }, uCouleur: { value: new THREE.Color(0xa855f7) }, uTemps: { value: 0 } };
  const m = new THREE.ShaderMaterial({
    uniforms: u, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
    vertexShader: /* glsl */ `varying vec2 vP; void main() { vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform float uInt; uniform vec3 uCouleur; uniform float uTemps; varying vec2 vP;
      void main() {
        float r = length(vP);
        float a = atan(vP.y, vP.x);
        float voile = 0.75 + 0.25 * sin(a * 3.0 + uTemps * 0.2) * sin(a * 5.0 - uTemps * 0.13);
        float b = exp(-r * r / 3.4) * 0.038 + exp(-pow((r - 1.35) / 0.4, 2.0)) * 0.03 * voile;
        gl_FragColor = vec4(uCouleur * b * uInt * (0.9 + 0.1 * sin(uTemps * 0.9)), 1.0);
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(9, 9), m);
  mesh.position.z = -0.45; mesh.renderOrder = 5; mesh.frustumCulled = false;
  return { mesh, u };
}
