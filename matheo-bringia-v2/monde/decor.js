/* Le décor de la piste : le portique et ses 5 feux, les projecteurs (mâts, têtes, cônes de lumière), la poussière
   dans la lumière, les panneaux géants du palmarès, les écrans des photos, les panneaux publicitaires des
   partenaires, la tribune, le tunnel de lumière orange, le drapeau à damier, les lignes de vitesse.
   Aucun kart ni personnage : ce qui est vivant, ce sont les vraies photos sur les écrans. */
import { HP } from './commun.js';
import { piste, LONGUEUR, U_LIGNE, GLSL_LUMIERE, NB_LAMPES } from './piste.js';
import { dessinerChiffre, dessinerPartenaires, dessinerPortique, dessinerDamier } from './textes.js';

/* placer un objet au bord de la piste : u (0 à 1), lat (m, + à droite), h (m) ; renvoie [x, y, z] et la tangente */
export function auBord(u, lat, h = 0) {
  const p = piste.point(u), t = piste.tangente(u), r = piste.droite(t);
  return { x: p[0] + r[0] * lat, y: h, z: p[1] + r[1] * lat, t, r };
}

/* la matière des structures (métal sombre) : éclairée par les projecteurs proches, liseré de la lueur orange */
const GLSL_STRUCT = `
vec3 eclairerN(vec3 p, vec3 n, vec3 albedo) {
  vec3 V = normalize(uCam - p);
  vec3 c = albedo * (vec3(0.012, 0.013, 0.02) + vec3(0.05, 0.016, 0.004) * uNuit * (0.5 + 0.5 * n.y));
  for (int i = 0; i < ${NB_LAMPES}; i++) {
    if (float(i) >= uNbL) break;
    vec4 L = uLampes[i]; if (L.w <= 0.0) continue;
    vec3 d = L.xyz - p; float d2 = dot(d, d); vec3 l = d * inversesqrt(d2);
    float e = L.w * 225.0 / (225.0 + d2);
    c += albedo * uCouleurLampe * max(dot(n, l), 0.0) * e * 0.7;
    c += uCouleurLampe * pow(max(dot(n, normalize(l + V)), 0.0), 40.0) * e * 0.08;
  }
  float rim = pow(1.0 - max(dot(n, V), 0.0), 3.0);
  c += vec3(0.5, 0.16, 0.03) * rim * 0.05 * uNuit;
  return c;
}`;
function matStructure(THREE, U, couleur = 0x1a1b1f) {
  return new THREE.ShaderMaterial({
    uniforms: { ...U, uCouleur: { value: new THREE.Color(couleur) } },
    vertexShader: HP + `varying vec3 vMonde; varying vec3 vN;
      void main() {
        mat4 m = modelMatrix;
        #ifdef USE_INSTANCING
          m = modelMatrix * instanceMatrix;
        #endif
        vec4 w = m * vec4(position, 1.0); vMonde = w.xyz; vN = normalize(mat3(m) * normal);
        gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: HP + GLSL_LUMIERE + GLSL_STRUCT + `uniform vec3 uCouleur; varying vec3 vMonde; varying vec3 vN;
      void main() { vec3 c = eclairerN(vMonde, normalize(vN), uCouleur);
        float dist = length(vMonde - uCam); c = mix(c, vec3(0.005, 0.005, 0.009) + vec3(0.016, 0.006, 0.0015) * uNuit, 1.0 - exp(-dist * 0.0032));
        c *= 1.0 - uTrace * 0.97;
        gl_FragColor = vec4(c, 1.0); }`,
  });
}
/* une matière lumineuse (HDR) : couleur * force */
function matLumiere(THREE, U, couleur, force) {
  return new THREE.ShaderMaterial({
    uniforms: { ...U, uCouleur: { value: new THREE.Color(couleur) }, uForce: { value: force } },
    vertexShader: HP + `varying vec3 vMonde;
      void main() { mat4 m = modelMatrix;
        #ifdef USE_INSTANCING
          m = modelMatrix * instanceMatrix;
        #endif
        vec4 w = m * vec4(position, 1.0); vMonde = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: HP + `uniform vec3 uCouleur; uniform float uForce, uTrace; varying vec3 vMonde;
      void main() { gl_FragColor = vec4(uCouleur * uForce * (1.0 - uTrace * 0.96), 1.0); }`,
  });
}

/* ------------------------------------------------------------ l'écran / le panneau (une matière par panneau) */
export function matEcran(THREE, U, { photo = false } = {}) {
  return new THREE.ShaderMaterial({
    uniforms: {
      ...U, uCarte: { value: null }, uAspect: { value: new THREE.Vector2(1, 1) }, uAllume: { value: 1 }, uPhoto: { value: photo ? 1 : 0 },
      uPret: { value: 0 }, uGraine: { value: Math.random() * 10 },
    },
    vertexShader: HP + 'varying vec2 vUv; varying vec3 vMonde; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vMonde = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: HP + `uniform sampler2D uCarte; uniform vec2 uAspect; uniform float uAllume, uPhoto, uPret, uGraine, uTemps, uTrace, uNuit;
      uniform vec3 uCam;
      varying vec2 vUv; varying vec3 vMonde;
      float h(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
      void main() {
        // l'image en « couverture » : uAspect.x = rapport de l'écran, uAspect.y = rapport de l'image
        vec2 uv = vUv;
        float re = uAspect.x, ri = uAspect.y;
        if (ri > re) uv.x = 0.5 + (uv.x - 0.5) * re / ri; else uv.y = 0.5 + (uv.y - 0.5) * ri / re;
        // un très lent zoom (Ken Burns) sur les photos
        uv = 0.5 + (uv - 0.5) * (1.0 - 0.05 * uPhoto * (0.5 + 0.5 * sin(uTemps * 0.13 + uGraine)));
        vec3 img = texture2D(uCarte, uv).rgb;
        img = img * img;   // vers le linéaire (approximation de sRGB)
        // en attendant l'image : un signal orange qui balaie
        float att = 1.0 - uPret;
        vec3 sig = vec3(0.02, 0.02, 0.025) + vec3(1.0, 0.3, 0.05) * 0.25 * exp(-((fract(vUv.y - uTemps * 0.3) - 0.5) * (fract(vUv.y - uTemps * 0.3) - 0.5)) * 60.0) + vec3(0.03) * h(floor(vUv * vec2(160.0, 90.0)) + floor(uTemps * 12.0));
        vec3 c = mix(img, sig, att);
        // la trame LED, fondue au loin (pas de moiré)
        vec2 px = vUv * vec2(320.0, 180.0);
        vec2 fw = fwidth(px);
        float trame = mix(0.82 + 0.18 * (1.0 - pow(abs(fract(px.x) - 0.5) * 2.0, 4.0)) * (1.0 - pow(abs(fract(px.y) - 0.5) * 2.0, 4.0)), 1.0, clamp(max(fw.x, fw.y) * 1.5 - 0.3, 0.0, 1.0));
        c *= trame;
        // bord légèrement assombri, reflet du verre
        vec2 b = abs(vUv - 0.5) * 2.0;
        c *= 1.0 - 0.18 * pow(max(b.x, b.y), 6.0);
        vec3 V = normalize(uCam - vMonde);
        c += vec3(0.03, 0.03, 0.04) * smoothstep(0.3, 1.0, vUv.y) * 0.5;
        // allumage (scintille à l'approche) et force lumineuse (HDR : le halo les prend un peu)
        float fl = uAllume * (0.92 + 0.08 * step(0.5, h(vec2(floor(uTemps * 20.0), uGraine))) * (1.0 - uAllume));
        c *= fl * (uPhoto > 0.5 ? 1.35 : 1.55);
        float dist = length(vMonde - uCam);
        c = mix(c, vec3(0.005, 0.005, 0.009), 1.0 - exp(-dist * 0.0024));
        c *= 1.0 - uTrace * 0.85;
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
}

/* ------------------------------------------------------------ tout le décor */
export function creerDecor(THREE, U, { mobile, reduit, tunnel }) {
  const groupe = new THREE.Group();
  const struct = matStructure(THREE, U);
  const structClair = matStructure(THREE, U, 0x3a3b40);
  const structOrange = matLumiere(THREE, U, 0xff4d0d, 3.2);
  const structNoir = matStructure(THREE, U, 0x08080a);

  /* ---------------- le portique (départ et arrivée) */
  const portique = new THREE.Group();
  {
    const b = auBord(U_LIGNE, 0, 0);
    portique.position.set(b.x, 0, b.z);
    portique.rotation.y = Math.atan2(b.t[0], b.t[1]) + Math.PI;   // face (+z local) vers la caméra qui arrive
    const pyl = new THREE.BoxGeometry(0.9, 8.2, 0.9);
    for (const s of [-1, 1]) { const m = new THREE.Mesh(pyl, struct); m.position.set(s * 6.6, 4.1, 0); portique.add(m); const f = new THREE.Mesh(new THREE.BoxGeometry(0.12, 8.2, 0.94), structOrange); f.position.set(s * 6.6 + s * 0.45, 4.1, 0); portique.add(f); }
    const pou = new THREE.Mesh(new THREE.BoxGeometry(14.4, 1.7, 1.0), struct); pou.position.set(0, 7.7, 0); portique.add(pou);
    const texP = new THREE.CanvasTexture(dessinerPortique()); texP.colorSpace = THREE.SRGBColorSpace; texP.anisotropy = 8;
    const ban = matEcran(THREE, U); ban.uniforms.uCarte.value = texP; ban.uniforms.uAspect.value.set(8, 8); ban.uniforms.uPret.value = 1;
    for (const face of [1, -1]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(13.2, 1.32), ban); m.position.set(0, 7.7, face * 0.505); if (face < 0) m.rotation.y = Math.PI; portique.add(m); }
    // le boîtier des feux, suspendu sous la poutre
    const boite = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.95, 0.5), struct); boite.position.set(0, 6.05, 0.1); portique.add(boite);
    for (const s of [-1, 1]) { const t = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.8, 0.08), struct); t.position.set(s * 1.6, 6.85, 0.1); portique.add(t); }
  }
  // les 5 feux : un disque par feu (verre éteint, rouge allumé), et une visière au-dessus
  const feux = [];
  {
    const geo = new THREE.CircleGeometry(0.28, 32);
    for (let i = 0; i < 5; i++) {
      const mat = new THREE.ShaderMaterial({
        uniforms: { uOn: { value: 0 } },
        vertexShader: HP + 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader: HP + `uniform float uOn; varying vec2 vUv;
          void main(){ vec2 d = vUv - 0.5; float r = length(d) * 2.0;
            vec3 eteint = vec3(0.05, 0.012, 0.012) * (1.0 - r * 0.5) + vec3(0.08) * exp(-((length(d - vec2(-0.12, 0.14)) * 9.0) * (length(d - vec2(-0.12, 0.14)) * 9.0)));
            vec3 on = vec3(1.0, 0.04, 0.02) * (9.0 * (1.0 - r * r * 0.6)) + vec3(1.0, 0.6, 0.5) * exp(-r * r * 6.0) * 6.0;
            gl_FragColor = vec4(mix(eteint, on, uOn), 1.0); }`,
      });
      const m = new THREE.Mesh(geo, mat);
      m.position.set((i - 2) * 0.78, 6.05, 0.36);
      portique.add(m);
      const vis = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.05, 0.22), struct); vis.position.set((i - 2) * 0.78, 6.37, 0.45); portique.add(vis);
      feux.push(mat);
    }
  }
  groupe.add(portique);

  /* ---------------- les projecteurs : un mât tous les 32 m environ, en quinconce, jamais sur une autre portion */
  const mats = [];
  for (let d = 10; d < LONGUEUR; d += 32) {
    const u = d / LONGUEUR;
    const cote = (Math.floor(d / 32) % 2 ? 1 : -1) * (piste.courbure(u) > 0.012 ? -1 : 1);
    for (const c of [cote, -cote]) {
      const b = auBord(u, c * 12.5, 0);
      if (piste.distance(b.x, b.z) < 11.5) continue;
      mats.push({ x: b.x, z: b.z, h: 15, versX: -b.r[0] * c, versZ: -b.r[1] * c, u });
      break;
    }
  }
  const nbM = mats.length;
  const poteau = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.16, 0.26, 15, 8), struct, nbM);
  const tete = new THREE.InstancedMesh(new THREE.BoxGeometry(2.4, 1.0, 0.5), struct, nbM);
  const geoLampes = new THREE.PlaneGeometry(2.1, 0.75, 1, 1);
  const lampes = new THREE.InstancedMesh(geoLampes, matLumiere(THREE, U, 0xfff1dc, 14), nbM);
  // le cône de lumière (additif, bords doux, s'efface près du sol et de face)
  const geoCone = new THREE.CylinderGeometry(0.9, 7.5, 15, 24, 1, true);
  geoCone.translate(0, -7.5, 0);
  const matCone = new THREE.ShaderMaterial({
    uniforms: { ...U, uForceCones: { value: mobile ? 0.8 : 1 } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: HP + `varying vec3 vMonde; varying vec3 vN; varying float vH;
      void main() { mat4 m = modelMatrix * instanceMatrix; vec4 w = m * vec4(position, 1.0); vMonde = w.xyz; vN = normalize(mat3(m) * normal); vH = -position.y / 15.0; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: HP + GLSL_LUMIERE + `uniform float uForceCones; varying vec3 vMonde; varying vec3 vN; varying float vH;
      void main() {
        vec3 V = normalize(uCam - vMonde);
        float bord = pow(abs(dot(normalize(vN), V)), 1.6);
        float n = 0.65 + 0.35 * mbB(vec2(atan(vN.x, vN.z) * 3.0, vH * 4.0 - uTemps * 0.15));
        float a = bord * bord * pow(max(1.0 - vH, 0.0), 1.6) * smoothstep(0.0, 0.08, vH) * n;
        float dist = length(vMonde - uCam);
        a *= smoothstep(2.0, 9.0, dist) * exp(-dist * 0.004);
        gl_FragColor = vec4(uCouleurLampe * a * 0.11 * uForceCones * (1.0 - uTrace), 1.0);
      }`,
  });
  const cones = new THREE.InstancedMesh(geoCone, matCone, nbM);
  {
    const o = new THREE.Object3D();
    mats.forEach((m, i) => {
      const ang = Math.atan2(m.versX, m.versZ);
      o.position.set(m.x, 7.5, m.z); o.rotation.set(0, ang, 0); o.scale.set(1, 1, 1); o.updateMatrix(); poteau.setMatrixAt(i, o.matrix);
      o.position.set(m.x + m.versX * 0.6, 15.1, m.z + m.versZ * 0.6); o.rotation.set(0.5, ang, 0, 'YXZ'); o.updateMatrix(); tete.setMatrixAt(i, o.matrix);
      o.position.set(m.x + m.versX * 0.6, 15.1, m.z + m.versZ * 0.6); o.rotation.set(0.5, ang, 0, 'YXZ'); o.translateZ(0.27); o.updateMatrix(); lampes.setMatrixAt(i, o.matrix);
      // le cône part de la tête et vise le milieu de la piste
      o.position.set(m.x + m.versX * 0.9, 14.8, m.z + m.versZ * 0.9); o.rotation.set(0, ang, 0); o.rotateX(-0.62); o.updateMatrix(); cones.setMatrixAt(i, o.matrix);
    });
  }
  for (const im of [poteau, tete, lampes, cones]) { im.frustumCulled = false; groupe.add(im); }
  cones.renderOrder = 5;

  /* ---------------- la poussière dans la lumière : une boîte de grains autour de la caméra */
  const nbP = mobile ? 900 : 1800;
  const geoP = new THREE.BufferGeometry();
  { const a = new Float32Array(nbP * 4); for (let i = 0; i < nbP; i++) { a[i * 4] = Math.random(); a[i * 4 + 1] = Math.random(); a[i * 4 + 2] = Math.random(); a[i * 4 + 3] = Math.random(); } geoP.setAttribute('position', new THREE.BufferAttribute(new Float32Array(nbP * 3), 3)); geoP.setAttribute('aGraine', new THREE.BufferAttribute(a, 4)); }
  const matP = new THREE.ShaderMaterial({
    uniforms: { ...U, uPart: { value: 1 }, uTaille: { value: 1 } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: HP + GLSL_LUMIERE + `attribute vec4 aGraine; uniform float uPart, uTaille; varying float vA;
      void main() {
        vec3 boite = vec3(70.0, 16.0, 70.0);
        vec3 p = aGraine.xyz * boite + vec3(sin(uTemps * 0.2 + aGraine.w * 6.0) * 1.5, uTemps * (0.05 + aGraine.w * 0.12), cos(uTemps * 0.17 + aGraine.x * 6.0) * 1.5);
        p = mod(p - uCam - vec3(boite.x * 0.5, -1.0, boite.z * 0.5), boite) + uCam - vec3(boite.x * 0.5, 0.5, boite.z * 0.5);
        p.y = max(p.y, 0.1);
        float l = 0.0;
        for (int i = 0; i < ${NB_LAMPES}; i++) { vec4 L = uLampes[i]; if (L.w <= 0.0) continue; vec3 d = p - L.xyz; float r2 = dot(d.xz, d.xz); l += L.w * exp(-r2 / 60.0) * smoothstep(-16.0, -1.0, d.y); }
        vec4 mv = viewMatrix * vec4(p, 1.0);
        float dist = -mv.z;
        vA = l * 0.05 * step(aGraine.w, uPart) * smoothstep(0.6, 3.0, dist) * (1.0 - smoothstep(25.0, 40.0, dist)) * (1.0 - uTrace);
        gl_PointSize = uTaille * (5.0 + 8.0 * aGraine.x) / max(dist, 0.5);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: HP + `uniform vec3 uCouleurLampe; varying float vA;
      void main() { vec2 d = gl_PointCoord - 0.5; float a = exp(-dot(d, d) * 14.0); gl_FragColor = vec4(uCouleurLampe * vA * a, 1.0); }`,
  });
  const poussiere = new THREE.Points(geoP, matP);
  poussiere.frustumCulled = false; poussiere.renderOrder = 6;
  groupe.add(poussiere);

  /* ---------------- les panneaux géants du palmarès (ligne droite des stands) */
  const chiffres = new THREE.Group();
  groupe.add(chiffres);
  const fabriquer = (largeur, hauteur, hBas, mat, b) => {
    const g = new THREE.Group();
    const ecran = new THREE.Mesh(new THREE.PlaneGeometry(largeur, hauteur), mat);
    ecran.position.y = hBas + hauteur / 2; g.add(ecran);
    const cadre = new THREE.Mesh(new THREE.BoxGeometry(largeur + 0.4, hauteur + 0.4, 0.35), structNoir); cadre.position.set(0, hBas + hauteur / 2, -0.2); g.add(cadre);
    const filet = new THREE.Mesh(new THREE.BoxGeometry(largeur + 0.42, 0.08, 0.37), structOrange); filet.position.set(0, hBas - 0.02, -0.2); g.add(filet);
    for (const s of [-0.32, 0.32]) { const j = new THREE.Mesh(new THREE.BoxGeometry(0.3, hBas + 0.1, 0.3), struct); j.position.set(s * largeur, (hBas + 0.1) / 2, -0.25); g.add(j); }
    // au dos : un liseré de LED orange qui dessine le cadre (vu de derrière, le panneau reste dessiné dans la nuit)
    for (const [w, h, x, y] of [[largeur + 0.4, 0.07, 0, hBas + hauteur + 0.17], [largeur + 0.4, 0.07, 0, hBas - 0.17], [0.07, hauteur + 0.4, -(largeur / 2 + 0.17), hBas + hauteur / 2], [0.07, hauteur + 0.4, largeur / 2 + 0.17, hBas + hauteur / 2]]) {
      const l = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.04), structOrange); l.position.set(x, y, -0.39); g.add(l);
    }
    g.position.set(b.x, 0, b.z);
    return g;
  };
  const viser = (g, u, recul = 34, h = 2) => {
    const c = piste.point(u - recul / LONGUEUR);
    g.lookAt(c[0], g.position.y + h, c[1]);
    g.rotation.x = 0; g.rotation.z = 0;
    const dx = c[0] - g.position.x, dz = c[1] - g.position.z; g.rotation.y = Math.atan2(dx, dz);
  };
  function definirChiffres(liste) {
    for (const c of [...chiffres.children]) { chiffres.remove(c); c.traverse((o) => { if (o.material && o.material.uniforms && o.material.uniforms.uCarte && o.material.uniforms.uCarte.value) o.material.uniforms.uCarte.value.dispose(); if (o.geometry) o.geometry.dispose(); }); }
    const L = (liste || []).slice(0, 6), n = L.length;
    L.forEach((c, i) => {
      const u = 0.06 + (i + 0.5) * (0.052 / Math.max(n, 1));
      const cote = i % 2 ? 1 : -1;
      const b = auBord(u, cote * 8.2, 0);
      const tex = new THREE.CanvasTexture(dessinerChiffre(c)); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
      const mat = matEcran(THREE, U); mat.uniforms.uCarte.value = tex; mat.uniforms.uAspect.value.set(2, 2); mat.uniforms.uPret.value = 1;
      const g = fabriquer(7.6, 3.8, 2.4, mat, b);
      viser(g, u, 40, 0);
      g.userData = { u, mat };
      chiffres.add(g);
    });
  }

  /* ---------------- les écrans géants des photos (le S et la boucle derrière la tour) */
  const ecrans = new THREE.Group();
  groupe.add(ecrans);
  const chargeur = new THREE.TextureLoader();
  let photosDemandees = false, listePhotos = [];
  function definirPhotos(liste) {
    for (const c of [...ecrans.children]) { ecrans.remove(c); c.traverse((o) => { if (o.material && o.material.uniforms && o.material.uniforms.uCarte && o.material.uniforms.uCarte.value) o.material.uniforms.uCarte.value.dispose(); if (o.geometry) o.geometry.dispose(); }); }
    listePhotos = (liste || []).filter((p) => p && p.src).slice(0, 8);
    photosDemandees = false;
    const n = listePhotos.length;
    listePhotos.forEach((p, i) => {
      const u = 0.262 + (i + 0.5) * (0.13 / Math.max(n, 1));
      let cote = -Math.sign(piste.courbure(u) || 1) || 1;   // à l'extérieur du virage : il fait face
      let b = auBord(u, cote * 14.5, 0);
      if (piste.distance(b.x, b.z) < 13) { cote = -cote; b = auBord(u, cote * 14.5, 0); }
      const mat = matEcran(THREE, U, { photo: true });
      mat.uniforms.uCarte.value = vide;
      mat.uniforms.uAspect.value.set(1.6, 1.6);
      const g = fabriquer(11.2, 7, 2.4, mat, b);
      viser(g, u, 26, 0);
      g.userData = { u, mat, src: p.src };
      ecrans.add(g);
    });
  }
  const vide = new THREE.DataTexture(new Uint8Array([10, 10, 12, 255]), 1, 1); vide.needsUpdate = true;
  function chargerPhotos() {
    if (photosDemandees) return; photosDemandees = true;
    for (const g of ecrans.children) {
      const { mat, src } = g.userData;
      chargeur.load(src, (t) => {
        t.colorSpace = THREE.NoColorSpace; t.anisotropy = 8; t.generateMipmaps = true;
        mat.uniforms.uCarte.value = t;
        mat.uniforms.uAspect.value.set(11.2 / 7, t.image.width / t.image.height);
        decor.charges++;
        const t0 = performance.now();
        const monte = () => { const k = Math.min(1, (performance.now() - t0) / 700); mat.uniforms.uPret.value = k; if (k < 1) requestAnimationFrame(monte); };
        monte();
      }, undefined, () => {});
    }
  }

  /* ---------------- les panneaux de bord de piste des partenaires (ligne droite du fond, épingle, retour) */
  const pubs = new THREE.Group();
  groupe.add(pubs);
  let texPubs = null;
  function definirPartenaires(liste) {
    for (const c of [...pubs.children]) { pubs.remove(c); if (c.geometry) c.geometry.dispose(); }
    if (texPubs) texPubs.dispose();
    const L = (liste || []).filter((p) => p && p.nom);
    if (!L.length) return;
    const { canvas, n } = dessinerPartenaires(L);
    texPubs = new THREE.CanvasTexture(canvas); texPubs.colorSpace = THREE.SRGBColorSpace; texPubs.anisotropy = 8;
    // des panneaux bas de 6 m le long de la piste, des deux côtés, à la suite
    const pos = [], uv = [], idx = [];
    let k = 0;
    const quad = (A, B, C, D, rang) => {
      const v0 = 1 - (rang + 1) / 16, v1 = 1 - rang / 16, base = pos.length / 3;
      pos.push(...A, ...B, ...C, ...D); uv.push(0, v0 + 0.002, 1, v0 + 0.002, 1, v1 - 0.002, 0, v1 - 0.002);
      idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
    };
    for (let d = 0.583 * LONGUEUR; d < 0.8 * LONGUEUR; d += 6.4) {
      for (const cote of [-1, 1]) {
        const u0 = d / LONGUEUR, u1 = (d + 6) / LONGUEUR;
        const a = auBord(u0, cote * 6.2), b = auBord(u1, cote * 6.2);
        if (piste.distance(a.x, a.z) < 5.9 || piste.distance(b.x, b.z) < 5.9) continue;
        const rang = (k++) % n;
        // la face regarde la piste : de gauche à droite vu depuis la piste
        const [P, Q] = cote > 0 ? [b, a] : [a, b];
        quad([P.x, 0.05, P.z], [Q.x, 0.05, Q.z], [Q.x, 1.45, Q.z], [P.x, 1.45, P.z], rang);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx); g.computeBoundingSphere();
    const mat = matEcran(THREE, U); mat.uniforms.uCarte.value = texPubs; mat.uniforms.uAspect.value.set(8, 8); mat.uniforms.uPret.value = 1;
    mat.side = THREE.DoubleSide;
    const m = new THREE.Mesh(g, mat); m.frustumCulled = false; pubs.add(m);
    // trois grands panneaux surélevés (les premiers partenaires) dans l'épingle
    for (let i = 0; i < Math.min(3, L.length); i++) {
      const u = 0.648 + i * 0.026;
      let cote = -Math.sign(piste.courbure(u) || 1) || 1;
      let b = auBord(u, cote * 14, 0);
      if (piste.distance(b.x, b.z) < 12) { cote = -cote; b = auBord(u, cote * 14, 0); }
      const geo = new THREE.PlaneGeometry(11, 1.4);
      const r = i % n, v0 = 1 - (r + 1) / 16, v1 = 1 - r / 16;
      const at = geo.attributes.uv; for (let j = 0; j < at.count; j++) at.setY(j, at.getY(j) > 0.5 ? v1 - 0.002 : v0 + 0.002);
      const gr = fabriquer(11, 1.4, 4.2, mat, b);
      gr.children[0].geometry.dispose(); gr.children[0].geometry = geo;
      viser(gr, u, 30, 0);
      pubs.add(gr);
    }
  }

  /* ---------------- les rails de lumière orange le long de la piste (barrières à LED) et les murs de pneus
     Deux filets lumineux continus à 1 m du sol, de part et d'autre, coupés là où une autre portion passe trop près ;
     une lumière court le long d'eux dans le sens de la course. Aux virages, à l'extérieur : des murs de pneus peints
     en rouge et blanc. Ils donnent du rythme et de la couleur aux portions sans panneaux. */
  {
    const pos = [], att = [], idx = [];
    for (const cote of [-1, 1]) {
      let ouvert = false;
      for (let i = 0; i <= piste.N; i++) {
        const u = (i % piste.N) / piste.N;
        const b = auBord(u, cote * 10.4, 0);
        const libre = piste.distance(b.x, b.z) > 9.6 && Math.abs(u - U_LIGNE) > 14 / LONGUEUR;
        if (libre) {
          const base = pos.length / 3;
          pos.push(b.x, 0.86, b.z, b.x, 1.0, b.z);
          att.push(i * piste.PAS, 0, i * piste.PAS, 1);
          if (ouvert) idx.push(base - 2, base, base - 1, base - 1, base, base + 1);
          ouvert = true;
        } else ouvert = false;
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('aR', new THREE.Float32BufferAttribute(att, 2));
    g.setIndex(idx); g.computeBoundingSphere();
    const mat = new THREE.ShaderMaterial({
      uniforms: { ...U }, side: THREE.DoubleSide,
      vertexShader: HP + 'attribute vec2 aR; varying vec2 vR; varying vec3 vMonde; void main(){ vR = aR; vec4 w = modelMatrix * vec4(position, 1.0); vMonde = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
      fragmentShader: HP + `uniform float uTemps, uTrace, uOrangeTunnel; uniform vec3 uCam; varying vec2 vR; varying vec3 vMonde;
        void main(){
          float d = length(vMonde - uCam);
          float x = fract((vR.x - uTemps * 34.0) / 90.0) - 0.5;
          float onde = exp(-x * x * 900.0);
          float bord = 1.0 - abs(vR.y - 0.5) * 1.6;
          float k = (0.55 + 2.6 * onde) * bord * (1.0 - uTrace) * (1.0 + uOrangeTunnel);
          vec3 c = vec3(1.0, 0.3, 0.05) * k * 2.2;
          c = mix(c, vec3(0.005, 0.005, 0.009), 1.0 - exp(-d * 0.006));
          gl_FragColor = vec4(c, 1.0); }`,
    });
    const rails = new THREE.Mesh(g, mat); rails.frustumCulled = false; groupe.add(rails);
  }
  {
    const places = [];
    for (let i = 0; i < piste.N; i += 1) {
      const u = i / piste.N, k = piste.courbure(u);
      if (Math.abs(k) < 1 / 40) continue;
      const cote = k > 0 ? -1 : 1;   // à l'extérieur du virage
      const b = auBord(u, cote * 9.0, 0);
      if (piste.distance(b.x, b.z) < 8.2) continue;
      places.push([b.x, b.z, Math.atan2(b.t[0], b.t[1]), i]);
    }
    const geo = new THREE.BoxGeometry(0.85, 0.75, 2.05);
    const matP = new THREE.ShaderMaterial({
      uniforms: { ...U },
      vertexShader: HP + `attribute float aRouge; varying vec3 vMonde; varying vec3 vN; varying vec3 vL; varying float vRouge;
        void main(){ mat4 m = modelMatrix * instanceMatrix; vec4 w = m * vec4(position, 1.0); vMonde = w.xyz; vN = normalize(mat3(m) * normal); vL = position; vRouge = aRouge; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: HP + GLSL_LUMIERE + GLSL_STRUCT + `varying vec3 vMonde; varying vec3 vN; varying vec3 vL; varying float vRouge;
        void main(){
          // les pneus empilés, vus de côté : des anneaux noirs, la bande peinte au milieu
          vec2 q = vec2(vL.z / 0.62, (vL.y + 0.375) / 0.25);
          vec2 f = fract(q) - 0.5; float r = length(f * vec2(1.0, 1.2));
          float pneu = smoothstep(0.5, 0.42, r) * (1.0 - smoothstep(0.2, 0.14, r));
          vec3 peint = mix(vec3(0.6, 0.58, 0.55), vec3(0.55, 0.03, 0.02), vRouge);
          vec3 alb = mix(vec3(0.012), peint, pneu * step(abs(vN.y), 0.5) * smoothstep(0.9, 1.1, q.y) * (1.0 - smoothstep(1.9, 2.1, q.y)));
          vec3 c = eclairerN(vMonde, normalize(vN), alb);
          float dist = length(vMonde - uCam); c = mix(c, vec3(0.005, 0.005, 0.009), 1.0 - exp(-dist * 0.0026));
          c *= 1.0 - uTrace * 0.97;
          gl_FragColor = vec4(c, 1.0); }`,
    });
    const murs = new THREE.InstancedMesh(geo, matP, places.length);
    const rouge = new Float32Array(places.length);
    const o = new THREE.Object3D();
    places.forEach(([x, z, a, i], k) => { o.position.set(x, 0.375, z); o.rotation.set(0, a, 0); o.updateMatrix(); murs.setMatrixAt(k, o.matrix); rouge[k] = Math.floor(i / 2) % 2; });
    geo.setAttribute('aRouge', new THREE.InstancedBufferAttribute(rouge, 1));
    murs.frustumCulled = false; groupe.add(murs);
  }

  /* ---------------- la tribune (courbe des tribunes) */
  {
    const u = 0.538, b = auBord(u, 19, 0);
    const cote = piste.distance(b.x, b.z) < 15 ? -1 : 1;
    const bb = auBord(u, cote * 19, 0);
    const trib = new THREE.Group();
    for (let r = 0; r < 7; r++) { const m = new THREE.Mesh(new THREE.BoxGeometry(34, 0.55, 1.3), r % 2 ? struct : structClair); m.position.set(0, 0.6 + r * 0.6, -r * 1.25); trib.add(m); }
    const toit = new THREE.Mesh(new THREE.BoxGeometry(36, 0.3, 10), struct); toit.position.set(0, 7.8, -4); trib.add(toit);
    const filet = new THREE.Mesh(new THREE.BoxGeometry(36, 0.12, 0.2), matLumiere(THREE, U, 0xff5a14, 6)); filet.position.set(0, 7.6, 1); trib.add(filet);
    for (let i = 0; i < 6; i++) { const l = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.25), matLumiere(THREE, U, 0xfff1dc, 9)); l.rotation.x = Math.PI / 2; l.position.set(-14 + i * 5.6, 7.62, -2); trib.add(l); }
    for (const s of [-17, 17]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.4, 7.8, 0.4), struct); p.position.set(s, 3.9, 0.8); trib.add(p); }
    trib.position.set(bb.x, 0, bb.z);
    const c = piste.point(u);
    trib.rotation.y = Math.atan2(c[0] - bb.x, c[1] - bb.z);
    groupe.add(trib);
  }

  /* ---------------- le tunnel de lumière orange (freinage de l'épingle) */
  const [T0, T1] = tunnel || [0.36, 0.43], nbA = mobile ? 20 : 28;
  const geoArche = (() => {
    const g = new THREE.BufferGeometry(), p = [], ix = [];
    // un arc en U de 12 m de large, 7 m de haut, en ruban plat de 0,16 m
    const seg = 40, e = 0.09;
    for (let i = 0; i <= seg; i++) {
      const t = i / seg, a = Math.PI * t;
      const x = -Math.cos(a) * 7, y = Math.sin(a) * 6.5;
      const nx = -Math.cos(a), ny = Math.sin(a);
      p.push(x - nx * e, y - ny * e, 0, x + nx * e, y + ny * e, 0);
      if (i < seg) { const k = i * 2; ix.push(k, k + 1, k + 3, k, k + 3, k + 2); }
    }
    g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setIndex(ix); return g;
  })();
  const matArche = new THREE.ShaderMaterial({
    uniforms: { ...U },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: HP + `attribute float aI; varying float vI; varying vec3 vMonde;
      void main(){ vI = aI; vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.0); vMonde = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: HP + `uniform float uOrangeTunnel, uTemps; uniform vec3 uCam; varying float vI; varying vec3 vMonde;
      void main(){ float d = length(vMonde - uCam);
        float onde = 0.55 + 0.45 * sin(vI * 0.9 - uTemps * 9.0);
        float a = uOrangeTunnel * onde * smoothstep(1.0, 6.0, d) * exp(-d * 0.018);
        gl_FragColor = vec4(vec3(1.0, 0.33, 0.05) * a * 7.0, 1.0); }`,
  });
  const arches = new THREE.InstancedMesh(geoArche, matArche, nbA);
  {
    const o = new THREE.Object3D(), ai = new Float32Array(nbA);
    for (let i = 0; i < nbA; i++) {
      const u = T0 + (T1 - T0) * i / (nbA - 1), b = auBord(u, 0, 0);
      o.position.set(b.x, 0, b.z); o.rotation.set(0, Math.atan2(b.t[0], b.t[1]), 0); o.updateMatrix(); arches.setMatrixAt(i, o.matrix); ai[i] = i;
    }
    geoArche.setAttribute('aI', new THREE.InstancedBufferAttribute(ai, 1));
  }
  arches.frustumCulled = false; arches.renderOrder = 7;
  groupe.add(arches);

  /* ---------------- le drapeau à damier (hissé pour l'arrivée), sur un mât à gauche de la ligne */
  const texD = new THREE.CanvasTexture(dessinerDamier()); texD.colorSpace = THREE.SRGBColorSpace;
  const drapeau = new THREE.Group();
  const matDrapeau = new THREE.ShaderMaterial({
    uniforms: { ...U, uCarte: { value: texD }, uVent: { value: 1 } }, side: THREE.DoubleSide,
    vertexShader: HP + `uniform float uTemps, uVent; varying vec2 vUv; varying float vPli; varying vec3 vMonde;
      void main(){ vUv = uv; vec3 p = position; float x = uv.x;
        float w = sin(x * 7.0 - uTemps * 6.0 * uVent) * 0.35 + sin(x * 13.0 - uTemps * 9.0 * uVent + uv.y * 2.0) * 0.12;
        p.z += w * x; p.y -= x * x * 0.25; vPli = cos(x * 7.0 - uTemps * 6.0 * uVent);
        vec4 m = modelMatrix * vec4(p, 1.0); vMonde = m.xyz; gl_Position = projectionMatrix * viewMatrix * m; }`,
    fragmentShader: HP + `uniform sampler2D uCarte; uniform float uNuit, uTrace; varying vec2 vUv; varying float vPli; varying vec3 vMonde;
      void main(){ vec3 c = texture2D(uCarte, vUv).rgb; c = c * c; c *= 0.5 + 0.5 * (0.6 + 0.4 * vPli); c += vec3(0.08, 0.025, 0.005) * uNuit * (1.0 - vPli) * 0.5;
        gl_FragColor = vec4(c * 1.4 * (1.0 - uTrace * 0.8), 1.0); }`,
  });
  {
    const b = auBord(U_LIGNE + 6 / LONGUEUR, -8.2, 0);
    const mat = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 11, 8), structClair); mat.position.y = 5.5; drapeau.add(mat);
    const tissu = new THREE.Mesh(new THREE.PlaneGeometry(6, 4, 32, 12), matDrapeau);
    tissu.geometry.translate(3, 0, 0); tissu.position.set(0.05, 8.8, 0); drapeau.add(tissu);
    drapeau.userData.tissu = tissu;
    drapeau.position.set(b.x, 0, b.z);
    drapeau.rotation.y = Math.atan2(b.t[0], b.t[1]) + Math.PI / 2 + 0.4;
  }
  groupe.add(drapeau);

  /* ---------------- les lignes de vitesse (dans le repère de la caméra) */
  const nbL = mobile ? 70 : 120;
  const geoL = new THREE.InstancedBufferGeometry();
  geoL.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, 0, 0.5, 0, 0, 0.5, 1, 0, -0.5, 1, 0], 3));
  geoL.setIndex([0, 1, 2, 0, 2, 3]);
  { const a = new Float32Array(nbL * 4); for (let i = 0; i < nbL; i++) { const ang = Math.random() * Math.PI * 2, r = 1.6 + Math.random() * 3.8; a[i * 4] = Math.cos(ang) * r * 1.3; a[i * 4 + 1] = Math.sin(ang) * r * 0.8; a[i * 4 + 2] = Math.random(); a[i * 4 + 3] = Math.random(); } geoL.setAttribute('aL', new THREE.InstancedBufferAttribute(a, 4)); }
  geoL.instanceCount = nbL;
  const matL = new THREE.ShaderMaterial({
    uniforms: { ...U, uVitesse: { value: 0 }, uAvance: { value: 0 } },
    transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
    vertexShader: HP + `attribute vec4 aL; uniform float uVitesse, uAvance; varying float vA; varying float vY;
      void main(){ float z = -2.0 - fract(aL.z - uAvance * (0.6 + aL.w * 0.8)) * 46.0;
        float l = (1.5 + aL.w * 2.5) * (0.3 + uVitesse * 3.0);
        vec3 p = vec3(aL.x + position.x * 0.03, aL.y, z + position.y * l);
        vY = position.y;
        vA = smoothstep(46.0, 30.0, -z) * smoothstep(2.0, 6.0, -z) * (0.15 + 0.85 * aL.w);
        gl_Position = projectionMatrix * vec4(p, 1.0); }`,
    fragmentShader: HP + `uniform float uVitesse, uOrangeTunnel; varying float vA; varying float vY;
      void main(){ float a = vA * min(1.0, uVitesse) * smoothstep(0.06, 0.3, uVitesse) * sin(vY * 3.14159);
        vec3 c = mix(vec3(1.0, 0.9, 0.8), vec3(1.0, 0.4, 0.08), 0.35 + 0.65 * uOrangeTunnel);
        gl_FragColor = vec4(c * a * 1.4, 1.0); }`,
  });
  const lignes = new THREE.Mesh(geoL, matL);
  lignes.frustumCulled = false; lignes.renderOrder = 20;

  const decor = {
    groupe, portique, feux, mats, poussiere, matP, chiffres, ecrans, pubs, arches, drapeau, lignes, matL, matCone, cones,
    definirChiffres, definirPhotos, definirPartenaires, chargerPhotos, charges: 0,
    get photosDemandees() { return photosDemandees; },
    /* les 8 projecteurs les plus proches de (x, z), dans un tableau de Vector4 */
    lampesProches(x, z, sortie, force = 1) {
      const d = mats.map((m, i) => [(m.x - x) ** 2 + (m.z - z) ** 2, i]).sort((a, b) => a[0] - b[0]);
      for (let k = 0; k < NB_LAMPES; k++) {
        const e = d[k]; if (!e) { sortie[k].set(0, 0, 0, 0); continue; }
        const m = mats[e[1]];
        // fondu des plus lointains (pas de saut quand un projecteur entre ou sort de la liste)
        const f = k < NB_LAMPES - 2 ? 1 : Math.max(0, 1 - (Math.sqrt(e[0]) - Math.sqrt(d[NB_LAMPES - 3][0])) / 25);
        sortie[k].set(m.x + m.versX * 1.2, 14.6, m.z + m.versZ * 1.2, 3.5 * force * f);
      }
    },
  };
  return decor;
}
