/* IMMERSION : le monde 3D que la camera traverse au defilement.

   Quatre mondes, un seul film :
     cristal : un quartz de verre qui refracte des rideaux de lumiere (accueil,
               puis le meme a l'aube pour le contact) ;
     eau     : une surface d'eau calme sous la lune, des ondes au doigt ;
     galets  : des pierres de verre posees sur l'eau, une par etape de seance ;
     brume   : des milliers de particules qui se condensent en un prenom.

   Chaque monde se rend dans sa propre image ; une passe de composition passe
   de l'un a l'autre par une COUPE diagonale (lisiere dechiquetee, lumineuse,
   aberration chromatique) ou par une DISPERSION (pour la brume). La technique
   de la coupe vient de notre site Kazura et d'igloo.inc ; tout est reecrit ici.

   Aucune texture, aucun modele : le ciel, l'eau, le verre et la brume sont
   calcules dans les nuanceurs. Une seule dependance : three.js (cdnjs). */
import * as THREE from 'three';

/* ── Bruit et ciel, partages par tous les nuanceurs ─────────────────────── */
const BRUIT = /* glsl */`
  float h1(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
  float bruit(vec3 x) {
    vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(h1(i), h1(i + vec3(1,0,0)), f.x), mix(h1(i + vec3(0,1,0)), h1(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(h1(i + vec3(0,0,1)), h1(i + vec3(1,0,1)), f.x), mix(h1(i + vec3(0,1,1)), h1(i + vec3(1,1,1)), f.x), f.y), f.z);
  }
  float fbm(vec3 p) { float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++) { s += a * bruit(p); p = p * 2.02 + vec3(3.1, 1.7, 5.3); a *= 0.5; } return s; }
`;

/* Le ciel : un degrade de nuit, une bande d'horizon, trois rideaux de lumiere
   verticaux (comme des boites a lumiere de studio) et une lune. uAube le
   rechauffe. rug elargit tout : c'est le flou d'un verre depoli. */
const CIEL = /* glsl */`
  uniform float uAube, uLune, uBarres, uTemps, uHalo; uniform vec3 uHaloDir;
  vec3 ciel(vec3 d, float rug) {
    d = normalize(d);
    float y = d.y;
    vec3 zen = mix(vec3(0.010, 0.014, 0.030), vec3(0.045, 0.028, 0.050), uAube);
    vec3 hor = mix(vec3(0.040, 0.070, 0.095), vec3(0.36, 0.20, 0.14), uAube);
    vec3 sol = vec3(0.005, 0.007, 0.012);
    vec3 c = y > 0.0 ? mix(hor, zen, pow(clamp(y, 0.0, 1.0), 0.45)) : mix(hor * 0.5, sol, pow(clamp(-y, 0.0, 1.0), 0.3));
    c += exp(-abs(y) * (24.0 / (1.0 + rug * 5.0))) * mix(vec3(0.07, 0.13, 0.16), vec3(0.62, 0.36, 0.20), uAube) * 0.7;
    float az = atan(d.x, -d.z);
    float w = 0.028 + rug * 0.2;
    float vert = smoothstep(-0.3, 0.12, y) * (1.0 - smoothstep(0.3, 1.0, y));
    vec3 lum = mix(vec3(0.72, 0.92, 1.0), vec3(1.0, 0.80, 0.58), uAube);
    for (int i = 0; i < 3; i++) {
      float a0 = i == 0 ? 0.50 : (i == 1 ? 0.68 : -0.45);
      float ond = 0.7 + 0.3 * sin(y * 8.0 + uTemps * 0.35 + float(i) * 2.1);
      c += exp(-pow((az - a0) / w, 2.0)) * vert * ond * lum * uBarres * 2.0 / (1.0 + rug * 2.5);
    }
    /* Le halo : une lueur large derriere le sujet, qu'il refracte. */
    float ch = max(dot(d, normalize(uHaloDir)), 0.0);
    c += uHalo * (pow(ch, 60.0) * 0.55 + pow(ch, 8.0) * 0.16 + pow(ch, 2.0) * 0.03) * mix(vec3(0.30, 0.62, 0.72), vec3(1.0, 0.6, 0.34), uAube);
    vec3 ld = normalize(vec3(0.19, 0.2, -1.0));
    float ca = dot(d, ld);
    float disque = smoothstep(0.99968 - rug * 0.02, 0.99975, ca);
    float mers = 0.82 + 0.18 * bruit(d * 900.0) - 0.12 * smoothstep(0.45, 0.7, bruit(d * 260.0 + 4.0));
    float halo = pow(max(ca, 0.0), 1400.0) * 0.35 + pow(max(ca, 0.0), 60.0) * 0.06 + pow(max(ca, 0.0), 8.0) * 0.03;
    c += uLune * (disque * mers * vec3(1.45, 1.42, 1.32) + halo * vec3(0.5, 0.66, 0.78));
    return c;
  }
`;

const uCiel = (o = {}) => ({
  uAube: { value: o.aube ?? 0 }, uLune: { value: o.lune ?? 0 }, uBarres: { value: o.barres ?? 1 }, uTemps: { value: 0 },
  uHalo: { value: o.halo ?? 0 }, uHaloDir: { value: new THREE.Vector3(0.33, 0.06, -1) }
});

const VS_MONDE = /* glsl */`
  varying vec3 vN; varying vec3 vP; varying vec3 vO;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vP = wp.xyz; vO = position;
    vN = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }`;

/* Le fond : une grande sphere vue de l'interieur, qui montre le meme ciel
   que celui que le verre refracte (c'est ce qui le rend credible). */
function fond(u, { attenue = 0.55, etoiles = 0 } = {}) {
  const m = new THREE.ShaderMaterial({
    uniforms: { ...u, uAtt: { value: attenue }, uEt: { value: etoiles } },
    vertexShader: VS_MONDE,
    fragmentShader: BRUIT + CIEL + /* glsl */`
      uniform float uAtt, uEt; varying vec3 vP;
      void main() {
        vec3 d = normalize(vP - cameraPosition);
        vec3 c = ciel(d, 0.12) * uAtt;
        vec3 g = floor(d * 260.0);
        float e = step(0.9975, h1(g)) * smoothstep(0.0, 0.3, d.y) * uEt;
        c += e * (0.5 + 0.5 * sin(uTemps * 1.3 + h1(g + 3.0) * 40.0)) * 0.35;
        gl_FragColor = vec4(c, 1.0);
      }`,
    side: THREE.BackSide, depthWrite: false
  });
  const s = new THREE.Mesh(new THREE.SphereGeometry(60, 32, 16), m);
  s.renderOrder = -1;
  s.frustumCulled = false;
  return s;
}

/* Le verre : refraction en trois longueurs d'onde (dispersion), reflet de
   Fresnel, et des fantomes laiteux a l'interieur, comme dans le quartz. */
function materiauVerre(u, { teinte = [0.86, 0.96, 1.0], rug = 0.0, disp = 0.03, interieur = 1, courbe = 2.4, bord = [0.5, 0.8, 0.9], coeur = 0.05 } = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { ...u, uTeinte: { value: new THREE.Vector3(...teinte) }, uRug: { value: rug }, uDisp: { value: disp },
      uInt: { value: interieur }, uCourbe: { value: courbe }, uBord: { value: new THREE.Vector3(...bord) }, uCoeur: { value: coeur } },
    vertexShader: VS_MONDE,
    fragmentShader: BRUIT + CIEL + /* glsl */`
      uniform vec3 uTeinte, uBord; uniform float uRug, uDisp, uInt, uCourbe, uCoeur;
      varying vec3 vN; varying vec3 vP; varying vec3 vO;
      void main() {
        vec3 N = normalize(vN);
        vec3 V = normalize(cameraPosition - vP);
        float ndv = clamp(dot(N, V), 0.0, 1.0);
        float F = 0.035 + 0.965 * pow(1.0 - ndv, 5.0);
        vec3 refl = ciel(reflect(-V, N), uRug * 0.6);
        vec3 I = -V;
        vec3 tR = refract(I, N, 1.0 / 1.45);
        vec3 tG = refract(I, N, 1.0 / (1.45 + uDisp));
        vec3 tB = refract(I, N, 1.0 / (1.45 + 2.0 * uDisp));
        vec3 col;
        col.r = ciel(I + (tR - I) * uCourbe, uRug).r;
        col.g = ciel(I + (tG - I) * uCourbe, uRug).g;
        col.b = ciel(I + (tB - I) * uCourbe, uRug).b;
        float inc = fbm(vO * 2.3 + vec3(0.0, uTemps * 0.04, 0.0));
        float fantome = smoothstep(0.93, 1.0, sin(vO.y * 5.0 + inc * 3.0) * 0.5 + 0.5);
        col = col * uTeinte + uTeinte * (fantome * 0.05 + inc * 0.05) * uInt;
        col += uTeinte * pow(ndv, 1.6) * uCoeur * (0.7 + 0.6 * inc);
        vec3 c = mix(col, refl, F);
        c += pow(1.0 - ndv, 2.5) * uBord * 0.22;
        gl_FragColor = vec4(c, 1.0);
      }`
  });
}

/* L'eau : un plan, dont la hauteur (ondes ambiantes et ondes circulaires
   qui partent d'un point et s'amortissent) donne la normale pixel par pixel. */
function creerEau(u) {
  const src = Array.from({ length: 6 }, () => new THREE.Vector4(0, 0, -99, 0));
  const m = new THREE.ShaderMaterial({
    uniforms: { ...u, uSrc: { value: src } },
    vertexShader: VS_MONDE,
    fragmentShader: BRUIT + CIEL + /* glsl */`
      uniform vec4 uSrc[6]; varying vec3 vP;
      float haut(vec2 p) {
        float h = (bruit(vec3(p * 0.7, uTemps * 0.12)) - 0.5) * 0.05 + (bruit(vec3(p * 2.7 + 7.0, uTemps * 0.22)) - 0.5) * 0.014;
        for (int i = 0; i < 6; i++) {
          vec4 s = uSrc[i];
          float age = uTemps - s.z;
          if (age < 0.0 || age > 10.0) continue;
          float r = length(p - s.xy);
          float d = r - age * 1.05;
          float env = exp(-d * d * 0.8) * exp(-age * 0.34) / (1.0 + r * 0.3);
          h += sin(d * 6.5) * env * 0.075 * s.w;
        }
        return h;
      }
      void main() {
        vec2 p = vP.xz;
        float e = 0.035;
        float h0 = haut(p);
        vec3 N = normalize(vec3(-(haut(p + vec2(e, 0.0)) - h0) / e, 1.0, -(haut(p + vec2(0.0, e)) - h0) / e));
        float dist = length(vP - cameraPosition);
        N = normalize(mix(N, vec3(0.0, 1.0, 0.0), smoothstep(14.0, 50.0, dist)));
        vec3 V = normalize(cameraPosition - vP);
        float F = 0.02 + 0.98 * pow(1.0 - max(dot(N, V), 0.0), 5.0);
        vec3 refl = ciel(reflect(-V, N), 0.0);
        vec3 c = mix(vec3(0.004, 0.009, 0.015), refl, F);
        vec3 h = ciel(normalize(vec3(vP.x - cameraPosition.x, 0.0, vP.z - cameraPosition.z)), 0.3) * 0.55;
        c = mix(c, h, smoothstep(18.0, 58.0, dist));
        gl_FragColor = vec4(c, 1.0);
      }`
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(140, 140, 1, 1), m);
  mesh.rotation.x = -Math.PI / 2;
  let k = 0;
  const onde = (x, z, t, amp = 1) => { src[k].set(x, z, t, amp); k = (k + 1) % src.length; };
  return { mesh, onde };
}

/* ── Les formes ─────────────────────────────────────────────────────────── */
function hashJS(x, y, z) { const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return s - Math.floor(s); }
function bruitJS(x, y, z) {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
  const fx = x - ix, fy = y - iy, fz = z - iz;
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy), sz = fz * fz * (3 - 2 * fz);
  const L = (a, b, t) => a + (b - a) * t;
  const h = (a, b, c) => hashJS(ix + a, iy + b, iz + c);
  return L(L(L(h(0, 0, 0), h(1, 0, 0), sx), L(h(0, 1, 0), h(1, 1, 0), sx), sy), L(L(h(0, 0, 1), h(1, 0, 1), sx), L(h(0, 1, 1), h(1, 1, 1), sx), sy), sz);
}

/* Un quartz : un prisme hexagonal pointu, un peu irregulier, a facettes nettes. */
function geoCristal(graine = 1) {
  const pts = [[0.001, -1.2], [0.40, -0.74], [0.5, -0.46], [0.5, 0.52], [0.45, 0.78], [0.001, 1.42]].map(([x, y]) => new THREE.Vector2(x, y));
  const g = new THREE.LatheGeometry(pts, 6);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const k = hashJS(Math.round(x * 100) + graine, Math.round(y * 100), Math.round(z * 100));
    const r = 0.9 + 0.22 * k;
    p.setXYZ(i, x * r, y + (Math.abs(y) > 1.3 ? (k - 0.5) * 0.25 : 0), z * r);
  }
  const f = g.toNonIndexed();
  f.computeVertexNormals();
  g.dispose();
  return f;
}

/* Un galet de verre : une sphere ecrasee et bosselee, lisse. */
function geoGalet(graine) {
  const g = new THREE.SphereGeometry(1, 72, 40);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const n = bruitJS(x * 1.3 + graine, y * 1.3, z * 1.3) * 0.22 + bruitJS(x * 3 + graine, y * 3, z * 3) * 0.05;
    const r = 0.9 + n;
    p.setXYZ(i, x * r * 1.05, y * r * 0.52, z * r * 0.86);
  }
  g.computeVertexNormals();
  return g;
}

function poussiere(n, etendue, couleur = [0.7, 0.85, 0.95]) {
  const pos = new Float32Array(n * 3), al = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    pos[i * 3] = (Math.random() - 0.5) * etendue[0];
    pos[i * 3 + 1] = (Math.random() - 0.5) * etendue[1];
    pos[i * 3 + 2] = (Math.random() - 0.5) * etendue[2];
    al[i] = Math.random();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aAl', new THREE.BufferAttribute(al, 1));
  const m = new THREE.ShaderMaterial({
    uniforms: { uTemps: { value: 0 }, uPix: { value: 1 }, uH: { value: etendue[1] }, uCoul: { value: new THREE.Vector3(...couleur) } },
    vertexShader: /* glsl */`
      uniform float uTemps, uPix, uH; attribute float aAl; varying float vA;
      void main() {
        vec3 p = position;
        p.y = mod(p.y + uTemps * (0.04 + aAl * 0.05) + uH * 0.5, uH) - uH * 0.5;
        p.x += sin(uTemps * 0.2 + aAl * 30.0) * 0.15;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = min((1.2 + aAl * 2.2) * uPix * 0.25 / max(-mv.z, 0.8), 14.0);
        vA = (0.25 + 0.6 * aAl) * (0.6 + 0.4 * sin(uTemps * 0.7 + aAl * 50.0));
        vA *= smoothstep(0.4, 1.6, -mv.z);
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uCoul; varying float vA;
      void main() { float d = length(gl_PointCoord - 0.5); float a = 1.0 - smoothstep(0.0, 0.5, d); gl_FragColor = vec4(uCoul * a * a * vA, 1.0); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
  });
  const pts = new THREE.Points(g, m);
  pts.frustumCulled = false;
  return pts;
}

/* Decale le centre optique (objectif a decentrement) : le sujet glisse vers
   la droite sur ordinateur, vers le haut sur telephone, et le texte garde
   une zone calme. */
function decentrer(cam, W, H, dx, dy) {
  cam.aspect = W / H;
  cam.setViewOffset(W, H, -dx * W, dy * H, W, H);
  cam.updateProjectionMatrix();
}

const lisser = (a, b, dt, k) => a + (b - a) * (1 - Math.exp(-dt * k));
const sat = (x) => Math.min(1, Math.max(0, x));
const sstep = (a, b, x) => { const t = sat((x - a) / (b - a)); return t * t * (3 - 2 * t); };

/* ── Monde 1 : le cristal ──────────────────────────────────────────────── */
function mondeCristal(ctx) {
  const u = uCiel({ barres: 1, lune: 0, halo: 1 });
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 200);
  scene.add(fond(u, { attenue: 0.5, etoiles: 0.6 }));
  const verre = materiauVerre(u, { teinte: [0.84, 0.95, 1.0], disp: 0.012, courbe: 1.7, coeur: 0.08 });
  const groupe = new THREE.Group();
  scene.add(groupe);
  const cristal = new THREE.Mesh(geoCristal(1), verre);
  cristal.rotation.z = 0.16;
  groupe.add(cristal);
  const sat3 = [
    { s: 0.34, r: 1.55, v: 0.11, y: 0.55, a: 0.4 },
    { s: 0.24, r: 1.95, v: -0.08, y: -0.65, a: 2.6 },
    { s: 0.18, r: 1.3, v: 0.15, y: -1.05, a: 4.4 }
  ].map((o, i) => { const m = new THREE.Mesh(geoCristal(10 + i), verre); m.scale.setScalar(o.s); groupe.add(m); return { m, ...o }; });
  const pous = poussiere(ctx.telephone ? 220 : 520, [12, 8, 10]);
  scene.add(pous);
  let aube = 0, rot = 0;

  return {
    nom: 'cristal', scene, camera,
    dimensionner(W, H) {
      const tel = W < H;
      decentrer(camera, W, H, tel ? 0 : 0.2, tel ? 0.25 : 0.02);
      camera.fov = tel ? 44 : 34; camera.updateProjectionMatrix();
      groupe.scale.setScalar(tel ? 0.6 : 1);
      pous.material.uniforms.uPix.value = ctx.dpr() * H / 900 * 40;
    },
    maj(t, dt, e) {
      const variante = e.variante === 'aube' ? 1 : 0;
      aube = lisser(aube, variante, dt, 2.2);
      u.uAube.value = aube; u.uTemps.value = t;
      pous.material.uniforms.uTemps.value = t;
      pous.material.uniforms.uCoul.value.set(0.7 + aube * 0.3, 0.85 - aube * 0.05, 0.95 - aube * 0.35);
      const p = e.p;
      rot += dt * (e.reduit ? 0 : 0.12);
      cristal.rotation.y = rot + p * 1.4 + e.px * 0.25;
      cristal.rotation.x = e.py * 0.1;
      cristal.position.y = Math.sin(t * 0.6) * 0.06;
      for (const s of sat3) {
        const a = s.a + t * s.v + p * 0.8;
        s.m.position.set(Math.cos(a) * s.r, s.y + Math.sin(t * 0.5 + s.a) * 0.08, Math.sin(a) * s.r);
        s.m.rotation.set(t * 0.2 + s.a, t * 0.3 + s.a, 0.3);
      }
      const ang = -0.35 + p * 0.9 + e.px * 0.12 + aube * 0.6;
      const dist = 6.4 - p * 1.6 - aube * 0.4;
      camera.position.set(Math.sin(ang) * dist, 0.35 + e.py * 0.25 - p * 0.3 + aube * 0.3, Math.cos(ang) * dist);
      camera.lookAt(0, 0.05, 0);
      u.uHaloDir.value.set(-camera.position.x, 0.25 - camera.position.y, -camera.position.z).normalize();
    }
  };
}

/* ── Monde 2 : l'eau ───────────────────────────────────────────────────── */
function mondeEau(ctx) {
  const u = uCiel({ barres: 0.22, lune: 1 });
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 200);
  scene.add(fond(u, { attenue: 1, etoiles: 1 }));
  const eau = creerEau(u);
  scene.add(eau.mesh);
  const ray = new THREE.Raycaster();
  const plan = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const v = new THREE.Vector3();
  let prochaine = 0.6, dernier = 0;
  return {
    nom: 'eau', scene, camera, eau,
    dimensionner(W, H) {
      const tel = W < H;
      decentrer(camera, W, H, tel ? 0 : 0.14, tel ? 0.05 : 0);
      camera.fov = tel ? 55 : 40; camera.updateProjectionMatrix();
    },
    maj(t, dt, e) {
      u.uTemps.value = t;
      const p = e.p;
      camera.position.set(e.px * 0.3, 1.35 - p * 0.55 + e.py * 0.08, 6 - p * 3.2);
      camera.lookAt(e.px * 0.5, 0.75 - p * 0.25, -12);
      if (!e.reduit && t > prochaine) {
        eau.onde(camera.position.x + 0.8 + (Math.random() - 0.5) * 3, camera.position.z - 5 - Math.random() * 4, t, 0.8 + Math.random() * 0.6);
        prochaine = t + 2.6 + Math.random() * 2.4;
      }
      if (e.pointeurBouge && t - dernier > 0.32) {
        ray.setFromCamera({ x: e.pxBrut, y: e.pyBrut }, camera);
        if (ray.ray.intersectPlane(plan, v) && v.distanceTo(camera.position) < 30) { eau.onde(v.x, v.z, t, 0.9); dernier = t; }
      }
    }
  };
}

/* ── Monde 3 : les galets, une pierre par etape ────────────────────────── */
function mondeGalets(ctx) {
  const u = uCiel({ barres: 0.5, lune: 1 });
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 200);
  scene.add(fond(u, { attenue: 0.9, etoiles: 0.8 }));
  const eau = creerEau(u);
  scene.add(eau.mesh);
  const n = Math.max(1, ctx.etapes);
  const pas = 3.4;
  const verre = materiauVerre(u, { teinte: [0.6, 0.93, 0.86], rug: 0.32, disp: 0.015, interieur: 1.4, courbe: 1.6, bord: [0.45, 0.95, 0.85], coeur: 0.22 });
  const galets = [];
  for (let i = 0; i < n + 2; i++) {
    const m = new THREE.Mesh(geoGalet(i * 3.7 + 1), verre);
    const reel = i < n;
    const x = reel ? (i % 2 ? 0.75 : -0.55) : (i % 2 ? 2.6 : -2.4);
    const z = reel ? -i * pas : -(n - 1) * pas * 0.5 - 3 - i;
    const s = reel ? 0.62 : 0.38;
    m.position.set(x, s * 0.42, z);
    m.scale.setScalar(s);
    m.rotation.y = i * 1.3;
    scene.add(m);
    galets.push({ m, x, z, s, reel, touche: false });
  }
  const pous = poussiere(ctx.telephone ? 160 : 380, [10, 5, 16], [0.6, 0.95, 0.85]);
  pous.position.z = -(n - 1) * pas * 0.5;
  scene.add(pous);
  return {
    nom: 'galets', scene, camera, eau,
    dimensionner(W, H) {
      const tel = W < H;
      decentrer(camera, W, H, tel ? 0 : 0.2, tel ? 0.3 : 0);
      camera.fov = tel ? 50 : 38; camera.updateProjectionMatrix();
      pous.material.uniforms.uPix.value = ctx.dpr() * H / 900 * 40;
    },
    maj(t, dt, e) {
      u.uTemps.value = t;
      pous.material.uniforms.uTemps.value = t;
      /* c : l'etape que l'on lit (continue). monte : la montee des tarifs. */
      const c = Math.min(n - 1, Math.max(-0.6, e.etape));
      const monte = e.monte;
      const cz = -c * pas;
      for (const g of galets) {
        g.m.position.y = g.s * 0.42 + Math.sin(t * 0.8 + g.z) * 0.03;
        g.m.rotation.y += dt * 0.05;
        const proche = g.reel && Math.abs(g.z - cz) < 0.6;
        if (proche && !g.touche && !e.reduit) { eau.onde(g.x, g.z, t, 1.2); g.touche = true; }
        if (!proche && Math.abs(g.z - cz) > 1.6) g.touche = false;
      }
      const c0 = Math.max(0, Math.floor(c)), c1 = Math.min(n - 1, c0 + 1), fr = Math.max(0, c) - c0;
      const fx = (galets[c0].x + (galets[c1].x - galets[c0].x) * sstep(0, 1, fr)) * 0.6;
      camera.position.set(fx + e.px * 0.25 + monte * 0.5, 1.05 + monte * 3.4 + e.py * 0.1, cz + 4.4 + monte * 3.5);
      camera.lookAt(fx * 0.8, 0.25 - monte * 0.2, cz - 1.5 - monte * 2.5);
      if (!e.reduit && Math.random() < dt * 0.25) eau.onde((Math.random() - 0.5) * 6, cz - 3 - Math.random() * 6, t, 0.5);
    }
  };
}

/* ── Monde 4 : la brume qui devient un prenom ──────────────────────────── */
async function mondeBrume(ctx) {
  const u = uCiel({ barres: 0.12, lune: 0 });
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 200);
  scene.add(fond(u, { attenue: 0.75, etoiles: 0.4 }));

  /* Les lettres : le prenom dessine dans une toile, dont on garde les pixels pleins. */
  const LW = 1400, LH = 420;
  const toile = document.createElement('canvas');
  toile.width = LW; toile.height = LH;
  const g2 = toile.getContext('2d', { willReadFrequently: true });
  const police = '"Cormorant Garamond", Georgia, serif';
  try { await document.fonts.load(`italic 500 200px ${police}`); } catch {}
  let taille = 330;
  g2.font = `italic 500 ${taille}px ${police}`;
  const largeur = g2.measureText(ctx.prenom).width;
  taille = Math.min(taille, taille * (LW * 0.92) / Math.max(1, largeur));
  g2.font = `italic 500 ${taille}px ${police}`;
  g2.fillStyle = '#fff'; g2.textAlign = 'center'; g2.textBaseline = 'middle';
  g2.fillText(ctx.prenom, LW / 2, LH / 2 + taille * 0.04);
  const img = g2.getImageData(0, 0, LW, LH).data;
  const pleins = [];
  for (let y = 0; y < LH; y += 2) for (let x = 0; x < LW; x += 2) if (img[(y * LW + x) * 4 + 3] > 140) pleins.push(x, y);
  /* La largeur reelle du mot, pour le cadrer ensuite. */
  let minX = LW, maxX = 0;
  for (let i = 0; i < pleins.length; i += 2) { minX = Math.min(minX, pleins[i]); maxX = Math.max(maxX, pleins[i]); }
  const motL = Math.max(1, maxX - minX) / LW;

  const N = ctx.telephone ? 9000 : 22000;
  const pos = new Float32Array(N * 3), cible = new Float32Array(N * 3), alea = new Float32Array(N * 4);
  const BW = 10, BH = BW * LH / LW;
  for (let i = 0; i < N; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 16;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 8;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 8 - 1;
    const libre = Math.random() < 0.18 || pleins.length === 0;
    if (!libre) {
      const k = Math.floor(Math.random() * (pleins.length / 2)) * 2;
      cible[i * 3] = ((pleins[k] + Math.random() * 2) / LW - 0.5) * BW;
      cible[i * 3 + 1] = -((pleins[k + 1] + Math.random() * 2) / LH - 0.5) * BH;
      cible[i * 3 + 2] = (Math.random() - 0.5) * 0.12;
    }
    alea[i * 4] = Math.random(); alea[i * 4 + 1] = Math.random(); alea[i * 4 + 2] = Math.random();
    alea[i * 4 + 3] = libre ? 3 : Math.random();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aCible', new THREE.BufferAttribute(cible, 3));
  geo.setAttribute('aAlea', new THREE.BufferAttribute(alea, 4));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTemps: { value: 0 }, uCond: { value: 0 }, uPix: { value: 1 }, uEch: { value: 1 } },
    vertexShader: BRUIT + /* glsl */`
      uniform float uTemps, uCond, uPix, uEch;
      attribute vec3 aCible; attribute vec4 aAlea;
      varying float vA; varying float vC;
      void main() {
        float t = uTemps * 0.05;
        vec3 b = position;
        b += vec3(fbm(b * 0.25 + vec3(t, 0.0, 0.0)) - 0.5, fbm(b * 0.25 + vec3(0.0, t + 3.0, 0.0)) - 0.5, fbm(b * 0.25 + vec3(0.0, 0.0, t + 7.0)) - 0.5) * 3.2;
        b.x += sin(uTemps * 0.07 + aAlea.x * 6.28) * 0.5;
        float c = smoothstep(aAlea.w * 0.5, aAlea.w * 0.5 + 0.5, uCond);
        vec3 cb = aCible / uEch + vec3(sin(uTemps * 0.9 + aAlea.x * 40.0), cos(uTemps * 0.8 + aAlea.y * 40.0), 0.0) * 0.008;
        vec3 p = mix(b, cb, c);
        p += sin(c * 3.14159) * vec3((aAlea.x - 0.5) * 0.8, (aAlea.y - 0.5) * 0.9, (aAlea.z - 0.5) * 1.6);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = min(uPix * (0.55 + aAlea.z * 0.9) * mix(1.0, 1.35, c) / max(-mv.z, 0.8), 14.0);
        vA = mix(0.16 + aAlea.x * 0.22, 0.62 + aAlea.x * 0.18, c);
        vC = c;
      }`,
    fragmentShader: /* glsl */`
      varying float vA; varying float vC;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = 1.0 - smoothstep(0.0, 0.5, d); a *= a;
        vec3 col = mix(vec3(0.42, 0.62, 0.72), vec3(1.0, 0.96, 0.9), vC);
        gl_FragColor = vec4(col * a * vA, 1.0);
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  scene.add(points);
  let cond = 0;
  return {
    nom: 'brume', scene, camera,
    dimensionner(W, H) {
      const tel = W < H;
      decentrer(camera, W, H, 0, tel ? 0.0 : 0);
      camera.fov = tel ? 50 : 40; camera.updateProjectionMatrix();
      /* Le mot occupe 82 % de la largeur visible (60 % sur grand ecran). */
      const visL = 2 * 7 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect;
      const voulu = Math.min(visL * (tel ? 0.86 : 0.62), 9.5);
      mat.uniforms.uEch.value = (motL * BW) / voulu;
      mat.uniforms.uPix.value = ctx.dpr() * H / 900 * (tel ? 30 : 26);
    },
    maj(t, dt, e) {
      u.uTemps.value = t;
      mat.uniforms.uTemps.value = e.reduit ? 40 : t;
      cond = e.reduit ? e.cond : lisser(cond, e.cond, dt, 3);
      mat.uniforms.uCond.value = cond;
      camera.position.set(e.px * 0.35, e.py * 0.2, 7 - cond * 0.4);
      camera.lookAt(0, 0, 0);
    }
  };
}

/* ── La composition : la coupe, la dispersion, la pellicule ─────────────── */
const COMPO = {
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
  fragmentShader: BRUIT + /* glsl */`
    uniform sampler2D tA, tB; uniform float uCoupe, uMode, uAspect, uTemps, uGrain, uFr; uniform vec2 uRes;
    varying vec2 vUv;
    vec3 franges(sampler2D t, vec2 uv, float f) {
      vec2 d = (uv - 0.5) * f;
      return vec3(texture2D(t, uv - d).r, texture2D(t, uv).g, texture2D(t, uv + d).b);
    }
    void main() {
      vec2 uv = vUv;
      vec3 c;
      vec2 q = vec2((uv.x - 0.5) * uAspect, uv.y);
      if (uCoupe <= 0.0) c = franges(tA, uv, uFr);
      else if (uCoupe >= 1.0) c = franges(tB, uv, uFr);
      else if (uMode < 0.5) {
        /* La coupe : une diagonale qui monte en penchant, dechiquetee par le
           bruit ; l'ancienne image s'envole, la nouvelle arrive d'en bas. */
        float front = q.y - q.x * 0.28;
        float n = (fbm(vec3(q * 3.5, uTemps * 0.12)) - 0.5) * 0.2 + (fbm(vec3(q * 24.0, 2.0)) - 0.5) * 0.035;
        float d = front + n - mix(-0.42, 1.42, uCoupe);
        float k = 1.0 - smoothstep(-0.01, 0.01, d);
        float lis = exp(-d * d * 300.0);
        float e = uCoupe * uCoupe * (3.0 - 2.0 * uCoupe);
        vec2 ua = uv + vec2(0.0, -0.16 * e * e);
        vec2 ub = uv + vec2(0.0, 0.16 * (1.0 - e) * (1.0 - e));
        float f = 0.012 + lis * 0.07;
        c = mix(franges(tA, ua, f), franges(tB, ub, f), k);
        c += vec3(0.75, 0.95, 1.0) * lis * 0.32;
      } else if (uMode < 1.5) {
        /* La dispersion : l'image se defait en poussiere selon le bruit, les
           grains s'ecartent le long de son relief. */
        float n = fbm(vec3(q * 2.2, uTemps * 0.08)) * 0.6 + fbm(vec3(q * 34.0, 4.0)) * 0.4;
        float s = mix(-0.15, 1.15, uCoupe);
        float d = n - s;
        float k = 1.0 - smoothstep(-0.05, 0.05, d);
        float lis = exp(-d * d * 600.0);
        vec2 g = vec2(fbm(vec3(q * 6.0, 1.0)) - 0.5, fbm(vec3(q * 6.0, 9.0)) - 0.5);
        vec2 ua = uv + g * 0.09 * uCoupe;
        vec2 ub = uv - g * 0.09 * (1.0 - uCoupe);
        c = mix(franges(tA, ua, 0.01 + lis * 0.05), franges(tB, ub, 0.01 + lis * 0.05), k);
        c += vec3(0.85, 0.92, 1.0) * lis * 0.12;
      } else {
        c = mix(texture2D(tA, uv).rgb, texture2D(tB, uv).rgb, uCoupe);
      }
      vec2 dv = uv - 0.5;
      c *= 1.0 - 0.42 * smoothstep(0.15, 0.85, dot(dv, dv) * 2.0);
      c = c / (1.0 + c * 0.18);
      c += (h1(vec3(uv * uRes, fract(uTemps * 7.1) * 91.0)) - 0.5) * uGrain;
      gl_FragColor = vec4(c, 1.0);
    }`
};

/* ── Le moteur ──────────────────────────────────────────────────────────── */
export async function demarrer({ toile, ctx, sections, reduit, surChangement, surProgres }) {
  const telephone = ctx.telephone;
  const renderer = new THREE.WebGLRenderer({ canvas: toile, antialias: false, alpha: false, powerPreference: 'high-performance' });
  renderer.setClearColor(0x04060b, 1);
  let dpr = Math.min(window.devicePixelRatio || 1, telephone ? 1.25 : 1.6);
  ctx.dpr = () => dpr;
  const echant = telephone ? 2 : 4;
  const rtA = new THREE.WebGLRenderTarget(2, 2, { samples: echant });
  const rtB = new THREE.WebGLRenderTarget(2, 2, { samples: echant });
  const compo = new THREE.ShaderMaterial({
    uniforms: { tA: { value: rtA.texture }, tB: { value: rtB.texture }, uCoupe: { value: 0 }, uMode: { value: 0 },
      uAspect: { value: 1 }, uTemps: { value: 0 }, uGrain: { value: 0.035 }, uFr: { value: telephone ? 0.0015 : 0.003 }, uRes: { value: new THREE.Vector2(1, 1) } },
    vertexShader: COMPO.vertexShader, fragmentShader: COMPO.fragmentShader, depthTest: false, depthWrite: false
  });
  const tri = new THREE.BufferGeometry();
  tri.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
  tri.setAttribute('uv', new THREE.BufferAttribute(new Float32Array([0, 0, 2, 0, 0, 2]), 2));
  const sceneCompo = new THREE.Scene();
  const quad = new THREE.Mesh(tri, compo); quad.frustumCulled = false;
  sceneCompo.add(quad);
  const camCompo = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  surProgres?.(0.2);
  const mondes = {
    cristal: mondeCristal(ctx),
    eau: mondeEau(ctx),
    galets: mondeGalets(ctx),
    brume: await mondeBrume(ctx)
  };
  surProgres?.(0.6);

  let W = 1, H = 1;
  function dimensionner() {
    W = toile.clientWidth || innerWidth; H = toile.clientHeight || innerHeight;
    renderer.setPixelRatio(dpr);
    renderer.setSize(W, H, false);
    rtA.setSize(Math.round(W * dpr), Math.round(H * dpr));
    rtB.setSize(Math.round(W * dpr), Math.round(H * dpr));
    compo.uniforms.uAspect.value = W / H;
    compo.uniforms.uRes.value.set(W * dpr, H * dpr);
    for (const m of Object.values(mondes)) m.dimensionner(W, H);
  }
  dimensionner();
  addEventListener('resize', dimensionner);

  /* Tout compiler et tout dessiner une fois, cache sous le chargeur : sinon
     chaque monde compile ses nuanceurs a son premier passage (dans l'image
     intermediaire, ce sont d'autres programmes que pour l'ecran) et l'image
     se fige une ou deux secondes, surtout sur telephone. */
  const e0 = { reduit, px: 0, py: 0, pxBrut: 0, pyBrut: 0, pointeurBouge: false, p: 0.5, etape: 0, monte: 0, cond: 0.5, variante: '' };
  renderer.setRenderTarget(rtA);
  const liste = Object.values(mondes);
  for (let i = 0; i < liste.length; i++) {
    const m = liste[i];
    if (renderer.compileAsync) { try { await renderer.compileAsync(m.scene, m.camera); } catch {} }
    m.maj(0, 0.016, e0);
    renderer.setRenderTarget(i % 2 ? rtB : rtA);
    renderer.render(m.scene, m.camera);
    surProgres?.(0.6 + 0.3 * (i + 1) / liste.length);
    await new Promise((r) => setTimeout(r, 0));
  }
  renderer.setRenderTarget(null);
  for (const mode of [0, 1]) { compo.uniforms.uCoupe.value = 0.5; compo.uniforms.uMode.value = mode; renderer.render(sceneCompo, camCompo); }
  compo.uniforms.uCoupe.value = 0;

  /* Le pointeur, lisse. */
  const ptr = { x: 0, y: 0, lx: 0, ly: 0, bouge: false, t: 0 };
  addEventListener('pointermove', (ev) => {
    ptr.x = (ev.clientX / innerWidth) * 2 - 1; ptr.y = -(ev.clientY / innerHeight) * 2 + 1;
    ptr.bouge = true; ptr.t = performance.now();
  }, { passive: true });

  /* Geometrie des sections (positions absolues), recalculee au besoin. */
  let geo = [];
  function mesurer() {
    const y0 = scrollY;
    geo = sections.map((s) => {
      const r = s.el.getBoundingClientRect();
      return { ...s, haut: r.top + y0, bas: r.bottom + y0 };
    });
  }
  mesurer();
  addEventListener('resize', mesurer);
  const ro = new ResizeObserver(mesurer);
  ro.observe(document.body);

  let vue = null;
  let yL = scrollY, t = 0, dernier = performance.now(), actuel = '';
  const frames = []; let abaisse = 0;
  const etapesEl = [...document.querySelectorAll('.etape')];
  const tarifsEl = document.getElementById('tarifs');
  const sceneNom = document.querySelector('.scene-nom');

  function etat(nomMonde) {
    const vh = innerHeight;
    const centre = yL + vh * 0.5;
    const e = { reduit, px: ptr.lx, py: ptr.ly, pxBrut: ptr.x, pyBrut: ptr.y, pointeurBouge: ptr.bouge && performance.now() - ptr.t < 120 };
    const des = geo.filter((s) => s.monde === nomMonde);
    if (!des.length) return { ...e, p: 0 };
    const haut = des[0].haut, bas = des[des.length - 1].bas;
    e.p = sat((centre - haut) / Math.max(1, bas - haut));
    let proche = des[0], bd = Infinity;
    for (const s of des) { const dd = centre < s.haut ? s.haut - centre : centre > s.bas ? centre - s.bas : 0; if (dd < bd) { bd = dd; proche = s; } }
    e.variante = proche.variante;
    if (nomMonde === 'cristal') e.p = e.variante === 'aube' ? sat((centre - des[1]?.haut) / vh) * 0.3 : sat((centre - haut) / Math.max(1, des[0].bas - haut));
    if (nomMonde === 'galets') {
      /* L'etape lue : celle dont le centre passe au milieu de l'ecran. */
      const cs = etapesEl.map((el) => { const r = el.getBoundingClientRect(); return r.top + r.height * 0.5 + scrollY - yL; });
      let c = -0.6;
      if (cs.length) {
        const m = vh * (ctx.telephone ? 0.62 : 0.5);
        if (m <= cs[0]) c = -sat((cs[0] - m) / vh) * 0.6;
        else if (m >= cs[cs.length - 1]) c = cs.length - 1;
        else for (let i = 0; i < cs.length - 1; i++) if (m >= cs[i] && m < cs[i + 1]) c = i + (m - cs[i]) / (cs[i + 1] - cs[i]);
      }
      e.etape = c;
      const rt = tarifsEl.getBoundingClientRect();
      e.monte = sstep(0, 1, (vh * 0.9 - (rt.top + scrollY - yL)) / (rt.height + vh * 0.2));
    }
    if (nomMonde === 'brume') {
      const r = sceneNom.getBoundingClientRect();
      const d = (r.top + r.height * 0.5 + scrollY - yL - vh * 0.5) / vh;
      e.cond = 1 - sstep(0.12, 0.55, Math.abs(d));
    }
    return e;
  }

  function boucle(now) {
    const dt = Math.min(0.05, (now - dernier) / 1000);
    dernier = now;
    if (!reduit) t += dt;
    yL = reduit ? scrollY : lisser(yL, scrollY, dt, 7);
    ptr.lx = lisser(ptr.lx, reduit ? 0 : ptr.x, dt, 2.5);
    ptr.ly = lisser(ptr.ly, reduit ? 0 : ptr.y, dt, 2.5);

    /* Quel monde, et faut-il couper ? */
    const vh = innerHeight, centre = yL + vh * 0.5;
    let a = geo[0], b = null, coupe = 0;
    for (let i = 0; i < geo.length; i++) if (centre >= geo[i].haut - vh * 0.3) a = geo[i];
    for (let i = 1; i < geo.length; i++) {
      if (geo[i].monde === geo[i - 1].monde) continue;
      const pr = (centre - (geo[i].haut - vh * 0.32)) / (vh * 0.5);
      if (pr > 0 && pr < 1) { a = geo[i - 1]; b = geo[i]; coupe = pr; break; }
    }
    const A = mondes[a.monde], B = b ? mondes[b.monde] : null;
    vue = { a, b, coupe, centre };
    const principal = B && coupe > 0.5 ? B.nom : A.nom;
    if (principal !== actuel) { actuel = principal; surChangement?.(principal); }

    A.maj(t, dt, etat(A.nom));
    renderer.setRenderTarget(rtA);
    renderer.render(A.scene, A.camera);
    if (B) {
      B.maj(t, dt, etat(B.nom));
      renderer.setRenderTarget(rtB);
      renderer.render(B.scene, B.camera);
    }
    renderer.setRenderTarget(null);
    compo.uniforms.uCoupe.value = B ? coupe : 0;
    compo.uniforms.uMode.value = reduit ? 2 : (B && (A.nom === 'brume' || B.nom === 'brume') ? 1 : 0);
    compo.uniforms.uTemps.value = t;
    renderer.render(sceneCompo, camCompo);
    ptr.bouge = false;

    /* Un appareil qui peine (moins de 45 images par seconde en moyenne) :
       on baisse la definition, par paliers, jamais sous 0,75. */
    if (!reduit) {
      frames.push(dt);
      if (frames.length >= 90) {
        const moy = frames.sort((x, y) => x - y)[Math.floor(frames.length / 2)];
        frames.length = 0;
        if (moy > 1 / 45 && dpr > 0.75 && abaisse < 4) { dpr = Math.max(0.75, dpr - 0.25); abaisse++; dimensionner(); }
      }
    }
    requestAnimationFrame(boucle);
  }
  requestAnimationFrame((n) => { dernier = n; boucle(n); surProgres?.(1); });

  toile.addEventListener('webglcontextlost', (ev) => { ev.preventDefault(); document.documentElement.classList.add('sans-3d'); });
  return { mesurer, vue: () => vue && { a: vue.a.el.id || 'pied', b: vue.b ? vue.b.el.id : '', coupe: Math.round(vue.coupe * 100) / 100, centre: Math.round(vue.centre) }, diagnostic: () => ({ dpr, abaisse, W, H, webgl2: renderer.capabilities.isWebGL2, programmes: renderer.info.programs?.length }) };
}
