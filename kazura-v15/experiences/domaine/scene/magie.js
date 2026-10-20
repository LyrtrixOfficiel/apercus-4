// Le domaine Kazura : la magie.
// - la liane de Kazura, jade et violet, qui pousse et s'enroule sur le piquet de tête de rang quand le soir tombe,
//   avec sa sève violette qui pulse, ses feuilles trifoliées de kudzu et ses grappes de fleurs violettes ;
// - les lucioles du soir ;
// - les gerbes : pétales qui s'envolent quand on touche les fleurs, poussières de lumière la nuit.

import { alea, GLSL_BRUIT, GLSL_LUMIERE } from './commun.js';
import { LIEU, hauteur } from './terrain.js';

/* Des particules en petits carrés instanciés tournés vers la caméra (plus sûr que les points GL sur téléphone). */
function geoParticules(THREE, n) {
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  g.instanceCount = n;
  return g;
}
const VS_TAILLE = /* glsl */`
  vec4 poser(vec3 centre, float px, out vec2 q) {
    vec4 mv = viewMatrix * vec4(centre, 1.0);
    q = position.xy;
    mv.xy += position.xy * 0.5 * px * (-mv.z) / uPx;
    return projectionMatrix * mv;
  }`;

export function creerLiane(THREE, U, { mobile }) {
  const groupe = new THREE.Group();
  const P = LIEU.piquetMagique;
  const y0 = hauteur(P.x, P.z) - 0.05;
  const h = alea(41);
  // l'hélice autour du piquet (rayon du piquet : 5 cm)
  const pts = [];
  const tours = 4.6, N = 90;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const a = t * tours * Math.PI * 2 + 0.8;
    const r = 0.078 + Math.sin(t * 23.0) * 0.008;
    pts.push(new THREE.Vector3(P.x + Math.cos(a) * r, y0 + 0.03 + t * 2.0, P.z + Math.sin(a) * r));
  }
  // au sommet, la liane se détache et part en vrille vers le fil
  for (let i = 1; i <= 26; i++) {
    const t = i / 26;
    const a = tours * Math.PI * 2 + 0.8 + t * 5.5;
    const r = 0.08 + t * 0.16;
    pts.push(new THREE.Vector3(P.x + Math.cos(a) * r - t * 0.22, y0 + 2.03 + Math.sin(t * 3.1) * 0.12 + t * 0.06, P.z + Math.sin(a) * r - t * 0.35));
  }
  const courbe = new THREE.CatmullRomCurve3(pts);
  const tube = new THREE.TubeGeometry(courbe, mobile ? 260 : 520, 0.0125, mobile ? 5 : 7, false);
  // épaisseur qui s'affine vers la pointe
  {
    const p = tube.attributes.position, uv = tube.attributes.uv;
    const c = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      const t = uv.getX(i);
      courbe.getPointAt(Math.min(1, t), c);
      const k = 1.15 - t * 0.75;
      p.setXYZ(i, c.x + (p.getX(i) - c.x) * k, c.y + (p.getY(i) - c.y) * k, c.z + (p.getZ(i) - c.z) * k);
    }
  }
  const matTige = new THREE.ShaderMaterial({
    uniforms: U,
    vertexShader: 'varying vec3 vPos; varying vec3 vN; varying vec2 vUv; void main() { vUv = uv; vN = normal; vPos = position; gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.0); }',
    fragmentShader: /* glsl */`
      uniform float uCroissance; uniform float uMagie; uniform float uTemps;
      ${GLSL_LUMIERE}
      varying vec3 vPos; varying vec3 vN; varying vec2 vUv;
      void main() {
        float pousse = mix(0.34, 1.0, uCroissance);
        if (vUv.x > pousse) discard;
        vec3 v = normalize(vPos - cameraPosition);
        vec3 n = normalize(vN);
        vec3 jade = vec3(0.02, 0.36, 0.18);
        vec3 c = eclairer(jade, n, v, 0.9, 1.6, 0.4);
        float fres = pow(1.0 - abs(dot(n, -v)), 3.0);
        c += vec3(0.35, 0.22, 0.9) * fres * (0.12 + uMagie * 0.5);
        c += vec3(0.02, 0.25, 0.12) * uMagie * 0.35;
        float seve = pow(0.5 + 0.5 * sin(vUv.x * 40.0 - uTemps * 2.2), 10.0);
        c += vec3(0.55, 0.3, 1.0) * seve * (0.05 + uMagie * 0.7);
        float front = smoothstep(pousse - 0.02, pousse, vUv.x);
        c += vec3(0.6, 1.0, 0.85) * front * (0.3 + uMagie * 1.2);
        gl_FragColor = vec4(brumer(c, vPos), 1.0);
      }`,
  });
  groupe.add(new THREE.Mesh(tube, matTige));

  // les feuilles trifoliées (kudzu) : trois folioles en vraies petites surfaces (pliées le long de la nervure)
  const posF = [], uvF = [], idxF = [];
  const foliole = (lx, ly, ang, sz) => {
    const nu = 5, nv = 9, base = posF.length / 3;
    for (let j = 0; j <= nv; j++) {
      const v = j / nv;
      const w = sz * 0.42 * Math.pow(Math.sin(Math.PI * Math.pow(v, 0.85)), 0.8);
      for (let i = 0; i <= nu; i++) {
        const u = (i / nu) * 2 - 1;
        const x = u * w, y = v * sz * 1.15;
        const c = Math.cos(ang), sn = Math.sin(ang);
        posF.push(lx + x * c - y * sn, ly + x * sn + y * c, Math.abs(u) * w * 0.55);
        uvF.push(u, v);
      }
    }
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
      const a0 = base + j * (nu + 1) + i, b0 = a0 + 1, c0 = a0 + nu + 1, d0 = c0 + 1;
      idxF.push(a0, b0, c0, b0, d0, c0);
    }
  };
  foliole(0, 0.03, 0, 0.06); foliole(-0.012, 0.02, 1.15, 0.05); foliole(0.012, 0.02, -1.15, 0.05);
  const nFeuilles = mobile ? 14 : 22;
  const inst = [];
  for (let i = 0; i < nFeuilles; i++) {
    const t = 0.06 + (i / nFeuilles) * 0.9;
    const p = courbe.getPointAt(t);
    const dx = p.x - P.x, dz = p.z - P.z;
    const a = Math.atan2(dz, dx);
    inst.push(p.x + Math.cos(a) * 0.03, p.y, p.z + Math.sin(a) * 0.03, t, -a + Math.PI / 2 + (h() - 0.5) * 0.6, 0.5 + h() * 0.5, 0.75 + h() * 0.45, h());
  }
  const gF = new THREE.InstancedBufferGeometry();
  gF.setAttribute('position', new THREE.Float32BufferAttribute(posF, 3));
  gF.setAttribute('uv', new THREE.Float32BufferAttribute(uvF, 2));
  gF.setIndex(idxF);
  const a1 = new Float32Array(nFeuilles * 4), a2 = new Float32Array(nFeuilles * 4);
  for (let i = 0; i < nFeuilles; i++) { a1.set(inst.slice(i * 8, i * 8 + 4), i * 4); a2.set(inst.slice(i * 8 + 4, i * 8 + 8), i * 4); }
  gF.setAttribute('aA', new THREE.InstancedBufferAttribute(a1, 4));
  gF.setAttribute('aB', new THREE.InstancedBufferAttribute(a2, 4));
  gF.instanceCount = nFeuilles;
  const matF = new THREE.ShaderMaterial({
    uniforms: U,
    side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      attribute vec4 aA; attribute vec4 aB;
      uniform float uCroissance; uniform float uTemps; uniform float uVent;
      varying vec3 vPos; varying vec3 vN; varying vec2 vUv; varying float vR;
      void main() {
        float pousse = mix(0.34, 1.0, uCroissance);
        float s = smoothstep(aA.w, aA.w + 0.06, pousse) * aB.z;
        vec3 p = position * s * 2.2;
        p.z -= p.y * p.y * 1.2;
        float inc = aB.y + sin(uTemps * 2.2 + aB.w * 20.0) * 0.08 * uVent;
        p = vec3(p.x, p.y * cos(inc), p.y * sin(inc));
        float c = cos(aB.x), sn = sin(aB.x);
        p = vec3(p.x * c + p.z * sn, p.y, -p.x * sn + p.z * c);
        vec3 nn = vec3(sn * cos(inc), -sin(inc), c * cos(inc));
        vN = normalize(vec3(nn.x, abs(nn.y) + 0.3, nn.z));
        vPos = aA.xyz + p; vUv = uv; vR = aB.w;
        gl_Position = projectionMatrix * viewMatrix * vec4(vPos, 1.0);
      }`,
    fragmentShader: /* glsl */`
      uniform float uMagie; uniform float uTemps;
      ${GLSL_LUMIERE}
      varying vec3 vPos; varying vec3 vN; varying vec2 vUv; varying float vR;
      void main() {
        vec3 v = normalize(vPos - cameraPosition);
        vec3 n = normalize(vN);
        if (dot(n, v) > 0.0) n = -n;
        float u = abs(vUv.x), w = vUv.y;
        float nerv = 1.0 - smoothstep(0.0, 0.07, u);
        float lat = (1.0 - smoothstep(0.0, 0.06, abs(fract((w - u * 0.38) * 8.0) - 0.5) - 0.38)) * (1.0 - smoothstep(0.6, 0.85, u)) * smoothstep(0.08, 0.2, u);
        float bord = smoothstep(0.7, 1.0, u) + smoothstep(0.9, 1.0, w);
        vec3 alb = mix(vec3(0.015, 0.16, 0.07), vec3(0.05, 0.36, 0.15), vR) * mix(0.75, 1.1, w);
        alb = mix(alb, vec3(0.12, 0.42, 0.2), nerv * 0.6 + lat * 0.25);
        vec3 c = eclairer(alb, n, v, 0.9, 1.8, 0.4);
        vec3 hh = normalize(uLumDir - v);
        c += uLumCouleur * pow(max(dot(n, hh), 0.0), 50.0) * 0.18;
        float pulse = 0.8 + 0.2 * sin(uTemps * 1.8 + vR * 10.0 + w * 3.0);
        c += vec3(0.08, 0.75, 0.48) * uMagie * (0.06 + 0.5 * nerv + 0.18 * lat) * pulse;
        c += vec3(0.55, 0.32, 1.0) * uMagie * bord * 1.1 * pulse;
        gl_FragColor = vec4(brumer(c, vPos), 1.0);
      }`,
  });
  groupe.add(new THREE.Mesh(gF, matF));

  // les grappes de fleurs violettes (des points lumineux en épi)
  const fleurs = [];
  for (const t of [0.42, 0.63, 0.8, 0.93, 0.99]) {
    const p = courbe.getPointAt(t);
    const dx = p.x - P.x, dz = p.z - P.z, L = Math.hypot(dx, dz) || 1;
    for (let i = 0; i < 26; i++) {
      const k = i / 26;
      fleurs.push(p.x + (dx / L) * (0.04 + k * 0.02) + (h() - 0.5) * 0.03 * (1 - k), p.y - k * 0.13, p.z + (dz / L) * (0.04 + k * 0.02) + (h() - 0.5) * 0.03 * (1 - k), t, 1 - k * 0.6, h());
    }
  }
  const nP = fleurs.length / 6;
  const gP = geoParticules(THREE, nP);
  const pp = new Float32Array(nP * 3), pa = new Float32Array(nP * 3);
  for (let i = 0; i < nP; i++) { pp.set(fleurs.slice(i * 6, i * 6 + 3), i * 3); pa.set(fleurs.slice(i * 6 + 3, i * 6 + 6), i * 3); }
  gP.setAttribute('aPos', new THREE.InstancedBufferAttribute(pp, 3));
  gP.setAttribute('aA', new THREE.InstancedBufferAttribute(pa, 3));
  const matP = new THREE.ShaderMaterial({
    uniforms: { ...U, uPx: { value: 600 } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */`
      attribute vec3 aA; attribute vec3 aPos; uniform float uCroissance; uniform float uMagie; uniform float uPx; uniform float uTemps;
      varying float vA; varying float vR; varying vec2 vQ;
      ${VS_TAILLE}
      void main() {
        float pousse = mix(0.34, 1.0, uCroissance);
        float s = smoothstep(aA.x + 0.02, aA.x + 0.1, pousse);
        float z = -(viewMatrix * vec4(aPos, 1.0)).z;
        float px = clamp(0.014 * aA.y * s * uPx / z, 0.0, 48.0);
        vA = s * (0.35 + uMagie * 0.9) * (0.75 + 0.25 * sin(uTemps * 3.0 + aA.z * 20.0)); vR = aA.z;
        gl_Position = poser(aPos, px, vQ);
      }`,
    fragmentShader: /* glsl */`
      varying float vA; varying float vR; varying vec2 vQ;
      void main() {
        vec2 q = vQ; float r = dot(q, q);
        if (r > 1.0) discard;
        vec3 c = mix(vec3(0.62, 0.32, 1.0), vec3(0.95, 0.75, 1.0), vR * 0.5) * (exp(-r * 3.0) * 1.6);
        gl_FragColor = vec4(c * vA, 1.0);
      }`,
  });
  const pts2 = new THREE.Mesh(gP, matP);
  groupe.add(pts2);
  groupe.traverse((o) => { o.frustumCulled = false; });
  return { objet: groupe, points: matP };
}

export function creerLucioles(THREE, U, { mobile, reduit }) {
  const h = alea(77);
  const n = Math.round((mobile ? 220 : 560) * (reduit ? 0.6 : 1));
  const pos = new Float32Array(n * 3), rnd = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) {
    const r = h();
    let x, z, y;
    if (r < 0.45) { x = -12 + h() * 26; z = 14 + h() * 22; y = 0.15 + h() * 1.9; }
    else if (r < 0.75) { x = -8 + h() * 18; z = -30 + h() * 44; y = 0.3 + h() * 2.2; }
    else { x = -45 + h() * 90; z = -80 + h() * 120; y = 0.5 + h() * 5; }
    pos.set([x, hauteur(x, z) + y, z], i * 3);
    rnd.set([h(), h(), h(), h()], i * 4);
  }
  const g = geoParticules(THREE, n);
  g.setAttribute('aPos', new THREE.InstancedBufferAttribute(pos, 3));
  g.setAttribute('aR', new THREE.InstancedBufferAttribute(rnd, 4));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTemps: U.uTemps, uLucioles: { value: 0 }, uPx: { value: 600 } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */`
      attribute vec4 aR; attribute vec3 aPos; uniform float uTemps; uniform float uLucioles; uniform float uPx;
      varying float vA; varying vec3 vC; varying vec2 vQ;
      ${VS_TAILLE}
      void main() {
        float t = uTemps * (0.25 + aR.x * 0.3);
        vec3 p = aPos + vec3(sin(t + aR.y * 40.0) * 0.9 + sin(t * 2.3 + aR.z * 9.0) * 0.25,
                                 sin(t * 0.8 + aR.z * 30.0) * 0.35,
                                 cos(t * 0.9 + aR.w * 50.0) * 0.9);
        float z = -(viewMatrix * vec4(p, 1.0)).z;
        float cligne = smoothstep(0.2, 1.0, sin(uTemps * (0.7 + aR.w) + aR.x * 60.0) * 0.5 + 0.5);
        float apparait = smoothstep(aR.y * 0.6, aR.y * 0.6 + 0.4, uLucioles);
        vA = cligne * apparait;
        vC = aR.z < 0.72 ? vec3(1.0, 0.92, 0.42) : aR.z < 0.86 ? vec3(0.4, 1.0, 0.72) : vec3(0.72, 0.52, 1.0);
        float px = clamp(0.07 * uPx / max(z, 0.05), 2.0, 34.0) * (0.6 + 0.4 * cligne);
        gl_Position = poser(p, px, vQ);
      }`,
    fragmentShader: /* glsl */`
      varying float vA; varying vec3 vC; varying vec2 vQ;
      void main() {
        vec2 q = vQ; float r = dot(q, q);
        if (r > 1.0 || vA < 0.01) discard;
        float i = exp(-r * 9.0) * 3.0 + exp(-r * 2.5) * 0.35;
        gl_FragColor = vec4(vC * i * vA, 1.0);
      }`,
  });
  const p = new THREE.Mesh(g, mat);
  p.frustumCulled = false;
  return { objet: p, uniformes: mat.uniforms };
}

/** Les gerbes : une réserve de particules simulées sur le processeur (pétales, poussières de lumière). */
export function creerGerbes(THREE, U, { mobile, reduit }) {
  const N = Math.round((mobile ? 140 : 320) * (reduit ? 0.6 : 1));
  const pos = new Float32Array(N * 3), col = new Float32Array(N * 4), prm = new Float32Array(N * 3);
  const vit = new Float32Array(N * 3), vie = new Float32Array(N), duree = new Float32Array(N), genre = new Uint8Array(N);
  let prochain = 0;
  const g = geoParticules(THREE, N);
  const aPos = new THREE.InstancedBufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage);
  const aCol = new THREE.InstancedBufferAttribute(col, 4).setUsage(THREE.DynamicDrawUsage);
  const aPrm = new THREE.InstancedBufferAttribute(prm, 3).setUsage(THREE.DynamicDrawUsage);
  g.setAttribute('aPos', aPos); g.setAttribute('aCol', aCol); g.setAttribute('aPrm', aPrm);
  const mat = new THREE.ShaderMaterial({
    uniforms: { uPx: { value: 600 }, uTemps: U.uTemps },
    transparent: true, depthWrite: false,
    vertexShader: /* glsl */`
      attribute vec4 aCol; attribute vec3 aPrm; attribute vec3 aPos; uniform float uPx;
      varying vec4 vCol; varying vec3 vPrm; varying vec2 vQ;
      ${VS_TAILLE}
      void main() {
        float z = -(viewMatrix * vec4(aPos, 1.0)).z;
        float px = aCol.a <= 0.0 ? 0.0 : clamp(aPrm.y * uPx / max(z, 0.05), 1.5, 60.0);
        vCol = aCol; vPrm = aPrm;
        gl_Position = poser(aPos, px, vQ);
      }`,
    fragmentShader: /* glsl */`
      varying vec4 vCol; varying vec3 vPrm; varying vec2 vQ;
      void main() {
        vec2 q = vQ;
        float c = cos(vPrm.x), s = sin(vPrm.x);
        q = vec2(q.x * c - q.y * s, q.x * s + q.y * c);
        float d;
        if (vPrm.z < 0.5) {
          // pétale : une ellipse qui tourne sur elle-même (vue de profil elle s'amincit)
          q.x /= max(0.2, abs(cos(vPrm.x * 1.7)));
          d = dot(q * vec2(1.0, 1.7), q * vec2(1.0, 1.7));
          if (d > 1.0) discard;
          gl_FragColor = vec4(vCol.rgb * (0.85 + 0.15 * (1.0 - d)), vCol.a);
        } else {
          d = dot(q, q);
          if (d > 1.0) discard;
          float i = exp(-d * 8.0) * 2.5 + exp(-d * 2.0) * 0.3;
          gl_FragColor = vec4(vCol.rgb * i, vCol.a * min(1.0, i));
        }
      }`,
  });
  const points = new THREE.Mesh(g, mat);
  points.frustumCulled = false;
  points.renderOrder = 5;

  const COUL = [[0.85, 0.06, 0.04], [0.25, 0.35, 0.95], [0.95, 0.95, 0.9], [0.55, 0.85, 0.3]];
  const LUM = [[2.4, 0.9, 0.5], [0.9, 0.7, 2.6], [2.2, 2.0, 1.2], [1.2, 2.4, 1.6], [2.2, 1.9, 0.8]];

  /** type : 0 coquelicot, 1 bleuet, 2 marguerite, 3 herbe ; nuit : particules de lumière. */
  function emettre(x, y, z, type, nombre, nuit) {
    for (let k = 0; k < nombre; k++) {
      const i = prochain; prochain = (prochain + 1) % N;
      const lumiere = nuit > 0.5 || type === 4;
      pos[i * 3] = x + (Math.random() - 0.5) * 0.12; pos[i * 3 + 1] = y + (Math.random() - 0.3) * 0.1; pos[i * 3 + 2] = z + (Math.random() - 0.5) * 0.12;
      const a = Math.random() * Math.PI * 2, f = 0.4 + Math.random() * 0.9;
      vit[i * 3] = Math.cos(a) * f; vit[i * 3 + 1] = (lumiere ? 0.6 : 0.9) + Math.random() * 1.1; vit[i * 3 + 2] = Math.sin(a) * f;
      duree[i] = vie[i] = (lumiere ? 2.6 : 3.2) + Math.random() * 1.8;
      genre[i] = lumiere ? 1 : 0;
      const c = lumiere ? LUM[type === 3 ? (Math.random() < 0.5 ? 3 : 4) : type] : COUL[type];
      col[i * 4] = c[0]; col[i * 4 + 1] = c[1]; col[i * 4 + 2] = c[2]; col[i * 4 + 3] = 1;
      prm[i * 3] = Math.random() * 6.28; prm[i * 3 + 1] = lumiere ? 0.05 + Math.random() * 0.04 : 0.035 + Math.random() * 0.025; prm[i * 3 + 2] = lumiere ? 1 : 0;
    }
  }
  let actives = false;
  function animer(dt, vent, t) {
    let n = 0;
    for (let i = 0; i < N; i++) {
      if (vie[i] <= 0) { if (col[i * 4 + 3] !== 0) { col[i * 4 + 3] = 0; n++; } continue; }
      n++;
      vie[i] -= dt;
      const lumiere = genre[i] === 1;
      const tr = lumiere ? 1.4 : 1.9;
      vit[i * 3] += (vent * 0.9 - vit[i * 3] * tr) * dt + Math.sin(t * 3 + i) * 0.6 * dt;
      vit[i * 3 + 2] += (vent * 0.3 - vit[i * 3 + 2] * tr) * dt + Math.cos(t * 2.7 + i) * 0.6 * dt;
      vit[i * 3 + 1] += (lumiere ? 0.25 - vit[i * 3 + 1] * 0.8 : -0.9 - vit[i * 3 + 1] * 1.2) * dt;
      pos[i * 3] += vit[i * 3] * dt; pos[i * 3 + 1] += vit[i * 3 + 1] * dt; pos[i * 3 + 2] += vit[i * 3 + 2] * dt;
      prm[i * 3] += dt * (lumiere ? 0.5 : 4.0);
      const v = vie[i] / duree[i];
      col[i * 4 + 3] = Math.min(1, v * 3) * Math.min(1, (1 - v) * 12);
    }
    if (n || actives) { aPos.needsUpdate = true; aCol.needsUpdate = true; aPrm.needsUpdate = true; }
    actives = n > 0;
  }
  return { objet: points, emettre, animer, uniformes: mat.uniforms };
}
