// Le domaine Kazura : les rangs de vigne.
// Une haie de cartes de feuillage (vraies feuilles détourées, avec vrilles et grappes), un cœur sombre
// pour que la haie paraisse pleine, des ceps, des piquets de bois, des fils, et des grappes en volume
// (blanches dorées et noires violettes) qui accrochent la lumière.

import { alea, melangerBlocs, GLSL_BRUIT, GLSL_VENT, GLSL_LUMIERE, GLSL_MAIN, GLSL_ALPHA } from './commun.js';
import { LIEU, hauteur } from './terrain.js';
import { ZONE_GRAPPE as ZG } from './grappe.js';

/** La grappe du gros plan a sa propre place : pas de cartes ni de petites grappes devant elle. */
const dansZoneGrappe = (x, z) => x > ZG.x0 && x < ZG.x1 && z > ZG.z0 && z < ZG.z1;

const R = LIEU.rangs;
const Z_PLANTS = R.zDebut - 0.9;

function loinDesArbres(x, z) {
  return LIEU.arbres.every((a) => Math.hypot(x - a.x, z - a.z) > 3.6);
}
/** Proximité de la zone que la caméra parcourt (densité plus forte là où on regarde de près). */
function proche(x, z) { return Math.abs(x - 1.25) < 13 && z > -48; }

export function creerVigne(THREE, U, tex, { mobile }) {
  const groupe = new THREE.Group();
  const hasard = alea(7);
  const objets = [];

  /* 1. Les cartes de feuillage */
  const cartes = [];
  for (let k = R.k0; k <= R.k1; k++) {
    const xr = k * R.ecart;
    for (let z = Z_PLANTS; z > R.zFin; z -= 1.15) {
      if (!loinDesArbres(xr, z)) continue;
      const pres = proche(xr, z);
      const n = mobile ? (pres ? 4 : 2) : (pres ? 7 : 3);
      const taille = pres ? 0.78 : 1.5;
      for (let i = 0; i < n; i++) {
        const x = xr + (hasard() - 0.5) * (pres ? 0.36 : 0.5);
        const zz = z + (hasard() - 0.5) * 1.15;
        if (dansZoneGrappe(x, zz)) { hasard(); hasard(); hasard(); hasard(); hasard(); hasard(); hasard(); continue; }
        const y0 = hauteur(x, zz);
        const yc = 0.72 + hasard() * (pres ? 0.85 : 0.6) + (pres ? 0 : 0.15);
        const t = taille * (0.75 + hasard() * 0.5);
        cartes.push(x, y0 + yc, zz, t, hasard() * Math.PI, (hasard() - 0.5) * 0.9, hasard() < 0.5 ? -1 : 1, hasard(), xr, y0);
      }
    }
  }
  const nC = cartes.length / 10;
  const geoC = new THREE.InstancedBufferGeometry();
  const quad = new THREE.PlaneGeometry(1, 1, 1, 2);
  geoC.index = quad.index; geoC.attributes.position = quad.attributes.position; geoC.attributes.uv = quad.attributes.uv;
  const aC = new Float32Array(nC * 4), aR = new Float32Array(nC * 4), aS = new Float32Array(nC * 2);
  for (let i = 0; i < nC; i++) {
    const o = i * 10;
    aC.set([cartes[o], cartes[o + 1], cartes[o + 2], cartes[o + 3]], i * 4);
    aR.set([cartes[o + 4], cartes[o + 5], cartes[o + 6], cartes[o + 7]], i * 4);
    aS.set([cartes[o + 8], cartes[o + 9]], i * 2);
  }
  melangerBlocs([[aC, 4], [aR, 4], [aS, 2]], nC, hasard);
  geoC.setAttribute('aCentre', new THREE.InstancedBufferAttribute(aC, 4));
  geoC.setAttribute('aRot', new THREE.InstancedBufferAttribute(aR, 4));
  geoC.setAttribute('aRang', new THREE.InstancedBufferAttribute(aS, 2));
  geoC.instanceCount = nC;
  const matC = new THREE.ShaderMaterial({
    uniforms: { ...U, tVigne: { value: tex.vigne } },
    side: THREE.DoubleSide,
    alphaToCoverage: !mobile,
    vertexShader: /* glsl */`
      attribute vec4 aCentre; attribute vec4 aRot; attribute vec2 aRang;
      ${GLSL_BRUIT}
      ${GLSL_VENT}
      ${GLSL_MAIN}
      varying vec2 vUv; varying vec3 vPos; varying vec3 vN; varying float vAo; varying float vHasard;
      void main() {
        float t = aCentre.w;
        vec3 p = vec3(position.x * t * aRot.z, position.y * t, 0.0);
        float cy = cos(aRot.x), sy = sin(aRot.x), cx = cos(aRot.y), sx = sin(aRot.y);
        p = vec3(p.x, p.y * cx, p.y * sx);
        p = vec3(p.x * cy + p.z * sy, p.y, -p.x * sy + p.z * cy);
        vec3 w = aCentre.xyz + p;
        float haut = clamp((w.y - aRang.y - 0.4) / 1.4, 0.0, 1.0);
        vec2 v = vent(w.xz, 1.4) * 0.07 * haut;
        v += ecarter(w, 9.0) * 0.35 * haut;
        w.xz += v;
        w.y += sin(uTemps * 2.6 + aRot.w * 30.0 + w.x) * 0.012 * uVent;
        vUv = uv; vPos = w; vHasard = aRot.w;
        vec3 nCarte = vec3(sy * cx, -sx, cy * cx);
        float cote = sign(aCentre.x - aRang.x + 0.001);
        vec3 nHaie = normalize(vec3(cote, 0.55 + haut * 0.6, 0.0));
        vN = normalize(mix(nCarte, nHaie, 0.65));
        vAo = mix(0.4, 1.0, haut) * mix(0.7, 1.0, clamp(abs(aCentre.x - aRang.x) / 0.3, 0.0, 1.0));
        gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.0);
      }`,
    fragmentShader: /* glsl */`
      uniform sampler2D tVigne; uniform float uA2C;
      ${GLSL_LUMIERE}
      ${GLSL_ALPHA}
      varying vec2 vUv; varying vec3 vPos; varying vec3 vN; varying float vAo; varying float vHasard;
      void main() {
        vec4 t = texture2D(tVigne, vUv);
        float a = uA2C > 0.5 ? alphaNet(t.a, vUv, 0.45) : t.a;
        if (a < (uA2C > 0.5 ? 0.02 : 0.5)) discard;
        vec3 v = normalize(vPos - cameraPosition);
        vec3 n = normalize(vN);
        if (dot(n, v) > 0.0) n = -n * 0.6 + vN * 0.4;
        vec3 alb = t.rgb * mix(vec3(0.95, 1.0, 0.85), vec3(1.05, 1.0, 0.8), vHasard);
        alb *= 0.9;
        vec3 c = eclairer(alb, normalize(n), v, vAo, 1.25, 0.35);
        float bord = 1.0 - smoothstep(0.5, 0.95, t.a);
        c += uLumCouleur * bord * pow(max(dot(-v, uLumDir), 0.0), 3.0) * 0.4 * (1.0 - uNuit);
        gl_FragColor = vec4(brumer(c, vPos), a);
      }`,
  });
  const feuillage = new THREE.Mesh(geoC, matC);
  feuillage.frustumCulled = false;
  groupe.add(feuillage);
  objets.push(feuillage);

  /* 2. Le cœur de la haie : un rideau sombre, au bord haut déchiqueté */
  {
    const pos = [], uv = [], rang = [];
    for (let k = R.k0; k <= R.k1; k++) {
      const xr = k * R.ecart;
      let premier = true;
      for (let z = Z_PLANTS + 0.3; z > R.zFin - 0.5; z -= 1.5) {
        const z2 = z - 1.5;
        if (!loinDesArbres(xr, z) || !loinDesArbres(xr, z2) || (proche(xr, z) && z > -30)) { premier = true; continue; }
        const y1 = hauteur(xr, z), y2 = hauteur(xr, z2);
        for (const dx of [-0.1, 0.1]) {
          const x = xr + dx;
          pos.push(x, y1 + 0.5, z, x, y2 + 0.5, z2, x, y1 + 1.62, z, x, y1 + 1.62, z, x, y2 + 0.5, z2, x, y2 + 1.62, z2);
          uv.push(z, 0, z2, 0, z, 1, z, 1, z2, 0, z2, 1);
          for (let i = 0; i < 6; i++) rang.push(xr);
        }
        premier = false;
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setAttribute('aRang', new THREE.Float32BufferAttribute(rang, 1));
    const m = new THREE.ShaderMaterial({
      uniforms: { ...U, tVigne: { value: tex.vigne } },
      side: THREE.DoubleSide,
      vertexShader: 'attribute float aRang; varying vec2 vUv; varying vec3 vPos; varying float vX; void main() { vUv = uv; vPos = position; vX = position.x - aRang; gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.0); }',
      fragmentShader: /* glsl */`
        uniform sampler2D tVigne;
        ${GLSL_BRUIT}
        ${GLSL_LUMIERE}
        varying vec2 vUv; varying vec3 vPos; varying float vX;
        void main() {
          float bordH = 0.78 + 0.2 * bruit(vec2(vUv.x * 2.3, 1.0)) + 0.06 * bruit(vec2(vUv.x * 9.0, 3.0));
          float bordB = 0.06 + 0.12 * bruit(vec2(vUv.x * 3.1, 7.0));
          if (vUv.y > bordH || vUv.y < bordB) discard;
          vec3 t = texture2D(tVigne, fract(vec2(vUv.x * 0.6, vUv.y * 0.9) + 0.2)).rgb;
          vec3 alb = mix(vec3(0.05, 0.09, 0.03), t * 0.45, 0.5);
          vec3 v = normalize(vPos - cameraPosition);
          vec3 n = normalize(vec3(sign(vX + 0.0001), 0.5, 0.0));
          vec3 c = eclairer(alb, n, v, mix(0.35, 0.8, vUv.y), 0.4, 0.3);
          gl_FragColor = vec4(brumer(c, vPos), 1.0);
        }`,
    });
    const coeur = new THREE.Mesh(g, m);
    coeur.frustumCulled = false;
    groupe.add(coeur);
    objets.push(coeur);
  }

  /* 3. Les piquets (bois gris, un peu penchés) et les ceps */
  const piquets = [];
  for (let k = R.k0; k <= R.k1; k++) {
    const xr = k * R.ecart;
    for (let z = R.zDebut; z > R.zFin; z -= 5.6) {
      if (!loinDesArbres(xr, z)) continue;
      const tete = z === R.zDebut;
      const magique = tete && xr === LIEU.piquetMagique.x;
      piquets.push(xr + (hasard() - 0.5) * 0.06, hauteur(xr, z) - 0.05, z, tete ? 0.1 : 0.075, magique ? 2.05 : tete ? 1.95 : 1.85, (hasard() - 0.5) * 0.08, (hasard() - 0.5) * 0.06, hasard());
    }
  }
  {
    const n = piquets.length / 8;
    const g = new THREE.InstancedBufferGeometry();
    const base = new THREE.CylinderGeometry(0.5, 0.5, 1, 6, 1).translate(0, 0.5, 0);
    g.index = base.index; g.attributes.position = base.attributes.position; g.attributes.normal = base.attributes.normal; g.attributes.uv = base.attributes.uv;
    const a1 = new Float32Array(n * 4), a2 = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) { a1.set(piquets.slice(i * 8, i * 8 + 4), i * 4); a2.set(piquets.slice(i * 8 + 4, i * 8 + 8), i * 4); }
    g.setAttribute('aA', new THREE.InstancedBufferAttribute(a1, 4));
    g.setAttribute('aB', new THREE.InstancedBufferAttribute(a2, 4));
    g.instanceCount = n;
    const m = new THREE.ShaderMaterial({
      uniforms: { ...U, tEcorce: { value: tex.ecorce } },
      vertexShader: /* glsl */`
        attribute vec4 aA; attribute vec4 aB;
        varying vec3 vPos; varying vec3 vN; varying vec2 vUv; varying float vH;
        void main() {
          vec3 p = position * vec3(aA.w, aB.x, aA.w);
          p.x += p.y * aB.y; p.z += p.y * aB.z;
          vPos = aA.xyz + p; vN = normal; vUv = vec2(uv.x * 0.5 + aB.w, uv.y * aB.x * 0.6); vH = position.y;
          gl_Position = projectionMatrix * viewMatrix * vec4(vPos, 1.0);
        }`,
      fragmentShader: /* glsl */`
        uniform sampler2D tEcorce; uniform float uMagie; uniform float uTemps;
        ${GLSL_LUMIERE}
        varying vec3 vPos; varying vec3 vN; varying vec2 vUv; varying float vH;
        void main() {
          vec3 t = texture2D(tEcorce, vUv).rgb;
          float l = dot(t, vec3(0.33));
          vec3 alb = mix(vec3(l) * vec3(0.95, 0.88, 0.78), t, 0.35) * 0.85;
          vec3 v = normalize(vPos - cameraPosition);
          vec3 c = eclairer(alb, normalize(vN), v, mix(0.5, 1.0, vH), 0.0, 0.1);
          // le piquet de la liane reçoit sa lumière la nuit
          float dm = length(vPos.xz - vec2(${LIEU.piquetMagique.x.toFixed(2)}, ${LIEU.piquetMagique.z.toFixed(2)}));
          c += vec3(0.45, 0.28, 0.95) * uMagie * 0.2 * exp(-dm * 25.0) * smoothstep(0.0, 0.4, vH) * (0.7 + 0.3 * sin(vPos.y * 9.0 - uTemps * 2.0));
          gl_FragColor = vec4(brumer(c, vPos), 1.0);
        }`,
    });
    const p = new THREE.Mesh(g, m);
    p.frustumCulled = false;
    groupe.add(p);
    objets.push(p);
  }

  // les ceps : seulement là où l'on passe près
  {
    const ceps = [];
    for (let k = R.k0; k <= R.k1; k++) {
      const xr = k * R.ecart;
      for (let z = Z_PLANTS; z > R.zFin; z -= 1.15) {
        if (!proche(xr, z) || !loinDesArbres(xr, z)) continue;
        ceps.push(xr + (hasard() - 0.5) * 0.08, hauteur(xr, z), z, hasard());
      }
    }
    const n = ceps.length / 4;
    const g = new THREE.InstancedBufferGeometry();
    const base = new THREE.CylinderGeometry(0.018, 0.034, 1, 6, 6, true).translate(0, 0.5, 0);
    g.index = base.index; g.attributes.position = base.attributes.position; g.attributes.normal = base.attributes.normal;
    g.setAttribute('aA', new THREE.InstancedBufferAttribute(new Float32Array(ceps), 4));
    g.instanceCount = n;
    const m = new THREE.ShaderMaterial({
      uniforms: U,
      vertexShader: /* glsl */`
        attribute vec4 aA; varying vec3 vPos; varying vec3 vN; varying float vH;
        void main() {
          vec3 p = position; float h = p.y;
          p.y *= 0.85;
          p.y *= 0.82;
          p.x += sin(h * 7.0 + aA.w * 20.0) * 0.035 * h + sin(h * 17.0 + aA.w * 9.0) * 0.008; p.z += cos(h * 5.0 + aA.w * 13.0) * 0.04 * h;
          p.xz *= 1.0 + (1.0 - h) * 0.5 + 0.25 * sin(h * 23.0 + aA.w * 7.0);
          vPos = aA.xyz + p; vN = normal; vH = h;
          gl_Position = projectionMatrix * viewMatrix * vec4(vPos, 1.0);
        }`,
      fragmentShader: /* glsl */`
        ${GLSL_LUMIERE}
        varying vec3 vPos; varying vec3 vN; varying float vH;
        void main() {
          float stries = 0.75 + 0.25 * sin(vPos.y * 60.0 + sin(atan(vN.z, vN.x) * 5.0) * 3.0);
          vec3 alb = vec3(0.09, 0.07, 0.055) * stries;
          vec3 c = eclairer(alb, normalize(vN), normalize(vPos - cameraPosition), mix(0.45, 0.9, vH), 0.0, 0.2);
          gl_FragColor = vec4(brumer(c, vPos), 1.0);
        }`,
    });
    const c = new THREE.Mesh(g, m);
    c.frustumCulled = false;
    groupe.add(c);
    objets.push(c);
  }

  /* 4. Les fils de palissage (pas sur téléphone : un trait d'un pixel n'apporte rien) */
  if (!mobile) {
    const pos = [];
    for (let k = R.k0; k <= R.k1; k++) {
      const xr = k * R.ecart;
      for (const fy of [0.95, 1.4, 1.8]) {
        let zp = R.zDebut;
        for (let z = R.zDebut - 5.6; z > R.zFin; z -= 5.6) {
          if (loinDesArbres(xr, z) && loinDesArbres(xr, zp)) pos.push(xr, hauteur(xr, zp) + fy, zp, xr, hauteur(xr, z) + fy - 0.03, z);
          zp = z;
        }
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    const m = new THREE.ShaderMaterial({
      uniforms: U, transparent: true, depthWrite: false,
      vertexShader: 'varying vec3 vPos; void main() { vPos = position; gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.0); }',
      fragmentShader: `${GLSL_LUMIERE}
        varying vec3 vPos;
        void main() {
          float d = length(vPos - cameraPosition);
          vec3 c = vec3(0.35, 0.35, 0.36) * (uLumCouleur * 0.4 + uCielHaut * 0.6);
          gl_FragColor = vec4(brumer(c, vPos), 0.55 * (1.0 - smoothstep(8.0, 40.0, d)));
        }`,
    });
    const f = new THREE.LineSegments(g, m);
    f.frustumCulled = false;
    groupe.add(f);
    objets.push(f);
  }

  /* 5. Les grappes : baies en volume (normales sphériques calculées dans le nuanceur) */
  {
    const baies = [];
    const hb = alea(31);
    const nb = 24;
    for (let i = 0; i < nb; i++) {
      const t = i / nb;
      const yy = -t * 0.17;
      const r = 0.045 * (1 - t * 0.75) * Math.sqrt(hb());
      const a = hb() * Math.PI * 2;
      baies.push(Math.cos(a) * r, yy, Math.sin(a) * r);
    }
    const oct = new THREE.OctahedronGeometry(1, 0);
    const op = oct.attributes.position.array;
    const pos = [], centre = [];
    const rb = 0.0125;
    for (let b = 0; b < nb; b++) {
      for (let v = 0; v < op.length; v += 3) {
        pos.push(baies[b * 3] + op[v] * rb, baies[b * 3 + 1] + op[v + 1] * rb, baies[b * 3 + 2] + op[v + 2] * rb);
        centre.push(baies[b * 3], baies[b * 3 + 1], baies[b * 3 + 2]);
      }
    }
    const inst = [];
    for (let k = R.k0; k <= R.k1; k++) {
      const xr = k * R.ecart;
      if (Math.abs(xr - 1.25) > (mobile ? 6 : 11)) continue;
      for (let z = Z_PLANTS; z > (mobile ? -22 : -40); z -= 1.15) {
        if (!loinDesArbres(xr, z)) continue;
        const nG = hasard() < 0.6 ? 2 : 1;
        for (let i = 0; i < nG; i++) {
          const cote = hasard() < 0.5 ? -1 : 1;
          const x = xr + cote * (0.12 + hasard() * 0.14), zz = z + (hasard() - 0.5) * 0.9;
          if (dansZoneGrappe(x, zz)) { hasard(); hasard(); hasard(); hasard(); hasard(); continue; }
          inst.push(x, hauteur(x, zz) + 0.68 + hasard() * 0.22, zz, hasard() < 0.45 ? 1 : 0, 0.8 + hasard() * 0.5, hasard() * 6.28, hasard(), 0);
        }
      }
    }
    const n = inst.length / 8;
    const a1 = new Float32Array(n * 4), a2 = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) { a1.set(inst.slice(i * 8, i * 8 + 4), i * 4); a2.set(inst.slice(i * 8 + 4, i * 8 + 8), i * 4); }
    const g = new THREE.InstancedBufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('aCentreBaie', new THREE.Float32BufferAttribute(centre, 3));
    g.setAttribute('aA', new THREE.InstancedBufferAttribute(a1, 4));
    g.setAttribute('aB', new THREE.InstancedBufferAttribute(a2, 4));
    g.instanceCount = n;
    const m = new THREE.ShaderMaterial({
      uniforms: U,
      vertexShader: /* glsl */`
        attribute vec3 aCentreBaie; attribute vec4 aA; attribute vec4 aB;
        ${GLSL_BRUIT}
        ${GLSL_VENT}
        varying vec3 vPos; varying vec3 vN; varying float vType; varying float vH;
        void main() {
          float s = aB.x; float ca = cos(aB.y), sa = sin(aB.y);
          vec3 p = position * s; vec3 c = aCentreBaie * s;
          p = vec3(p.x * ca - p.z * sa, p.y, p.x * sa + p.z * ca);
          vec3 nn = normalize(position - aCentreBaie);
          nn = vec3(nn.x * ca - nn.z * sa, nn.y, nn.x * sa + nn.z * ca);
          vec2 v = vent(aA.xz, 1.0) * 0.03;
          p.xz += v * (-p.y) * 6.0;
          vPos = aA.xyz + p; vN = nn; vType = aA.w; vH = aB.z;
          gl_Position = projectionMatrix * viewMatrix * vec4(vPos, 1.0);
        }`,
      fragmentShader: /* glsl */`
        ${GLSL_LUMIERE}
        varying vec3 vPos; varying vec3 vN; varying float vType; varying float vH;
        void main() {
          vec3 blanc = mix(vec3(0.28, 0.36, 0.07), vec3(0.42, 0.4, 0.1), vH);
          vec3 noir = mix(vec3(0.12, 0.05, 0.2), vec3(0.2, 0.08, 0.28), vH);
          vec3 alb = mix(blanc, noir, vType);
          vec3 v = normalize(vPos - cameraPosition);
          vec3 n = normalize(vN);
          vec3 c = eclairer(alb, n, v, 0.75, mix(1.4, 0.7, vType), 0.2);
          vec3 h = normalize(uLumDir - v);
          c += uLumCouleur * pow(max(dot(n, h), 0.0), 60.0) * 0.35;
          c += vec3(0.5, 0.45, 0.9) * pow(1.0 - max(dot(n, -v), 0.0), 3.0) * 0.08 * vType;
          gl_FragColor = vec4(brumer(c, vPos), 1.0);
        }`,
    });
    const gr = new THREE.Mesh(g, m);
    gr.frustumCulled = false;
    groupe.add(gr);
    objets.push(gr);
  }

  return { objet: groupe, feuillage, nCartes: nC };
}
