/* Kazura v14, la Scène : le monde clair (« Osez rêver » et « Comment ça se passe »).
   Un studio de porcelaine (peint par fond.js) où flottent :
   - de GRANDES FEUILLES DE KUDZU EN VERRE DÉPOLI (trois folioles, ou une foliole seule), épaisses,
     bombées, qui tournent lentement ; elles réfractent le studio en le floutant (verre dépoli),
     leurs arêtes s'irisent ;
   - leurs OMBRES DOUCES sur la paroi du fond, avec le cœur de lumière colorée que le verre concentre ;
   - un RUBAN HOLOGRAPHIQUE qui DANSE autour du sceau de cristal (sa courbe est calculée par le nuanceur :
     aucun coût pour le processeur) ;
   - dans le déroulé, à chacun des six moments, un OBJET DE VERRE qui éclot quand la liane l'atteint :
     une bulle de message (vous m'écrivez), deux anneaux enlacés (on en parle), un crayon (je dessine),
     un nuancier en éventail (vous ajustez), une fenêtre de navigateur (en ligne), une feuille trifoliée
     (et je reste là).
   Tout ce verre ne se montre que dans le monde clair (masque par pixel : il apparaît tranche par tranche). */
import { hasard } from './commun.js';
import { GLSL_MASQUE, GLSL_IRIS } from './glsl.js';

/* ------------------------------------------------------------ formes */
function demi(u) {
  const uu = Math.min(1, Math.max(0, u));
  return 0.42 * Math.pow(Math.max(Math.sin(Math.PI * Math.pow(uu, 0.62)), 0), 0.78) * (1 - 0.3 * Math.min(1, Math.max(0, (uu - 0.5) / 0.5)) ** 2 * (3 - 2 * Math.min(1, Math.max(0, (uu - 0.5) / 0.5)))) ;
}
function formeFoliole(THREE, ang, L, base = [0, 0]) {
  const s = new THREE.Shape();
  const n = 36, pts = [];
  for (let i = 0; i <= n; i++) { const u = i / n; pts.push([u * L, demi(u) * L]); }
  for (let i = n - 1; i >= 1; i--) { const u = i / n; pts.push([u * L, -demi(u) * L]); }
  const c = Math.cos(ang), si = Math.sin(ang);
  pts.forEach(([x, y], i) => { const X = base[0] + x * c - y * si, Y = base[1] + x * si + y * c; if (i) s.lineTo(X, Y); else s.moveTo(X, Y); });
  return s;
}
function formesKudzu(THREE, L = 1) {
  return [formeFoliole(THREE, Math.PI / 2, L, [0, 0.1 * L]), formeFoliole(THREE, Math.PI / 2 + 1.2, 0.8 * L), formeFoliole(THREE, Math.PI / 2 - 1.2, 0.8 * L)];
}
function arrondi(THREE, w, h, r, trou = null) {
  const s = new THREE.Shape();
  const rect = (p, x, y, W, H, R) => {
    p.moveTo(x + R, y); p.lineTo(x + W - R, y); p.quadraticCurveTo(x + W, y, x + W, y + R); p.lineTo(x + W, y + H - R);
    p.quadraticCurveTo(x + W, y + H, x + W - R, y + H); p.lineTo(x + R, y + H); p.quadraticCurveTo(x, y + H, x, y + H - R);
    p.lineTo(x, y + R); p.quadraticCurveTo(x, y, x + R, y);
  };
  rect(s, -w / 2, -h / 2, w, h, r);
  if (trou) { const hp = new THREE.Path(); rect(hp, trou[0], trou[1], trou[2], trou[3], trou[4]); s.holes.push(hp); }
  return s;
}
function bulle(THREE) {
  const s = new THREE.Shape();
  const n = 48;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    let x = Math.cos(a) * 0.62, y = Math.sin(a) * 0.46;
    if (a > 3.85 && a < 4.35) { const k = 1 - Math.abs(a - 4.1) / 0.25; x -= 0.12 * k; y -= 0.32 * k; }
    if (i) s.lineTo(x, y); else s.moveTo(x, y);
  }
  return s;
}
/* normales adoucies (le verre a des arrondis polis, des arêtes vives seulement au-delà de l'angle) */
function adoucir(THREE, g, angle = Math.PI / 2.6) {
  const pos = g.attributes.position, n = pos.count, seuil = Math.cos(angle);
  const fn = new Float32Array(n * 3);
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), ab = new THREE.Vector3(), cb = new THREE.Vector3();
  const idx = g.index ? g.index.array : null;
  const tri = (i) => (idx ? idx[i] : i);
  const nt = idx ? idx.length : n;
  const fnv = new Float32Array(n * 3);
  for (let i = 0; i + 2 < nt; i += 3) {
    const i0 = tri(i), i1 = tri(i + 1), i2 = tri(i + 2);
    a.fromBufferAttribute(pos, i0); b.fromBufferAttribute(pos, i1); c.fromBufferAttribute(pos, i2);
    cb.subVectors(c, b); ab.subVectors(a, b); cb.cross(ab);
    for (const k of [i0, i1, i2]) { fnv[k * 3] = cb.x; fnv[k * 3 + 1] = cb.y; fnv[k * 3 + 2] = cb.z; }
  }
  fn.set(fnv);
  const cle = (i) => Math.round(pos.getX(i) * 1e4) + ',' + Math.round(pos.getY(i) * 1e4) + ',' + Math.round(pos.getZ(i) * 1e4);
  const groupes = new Map();
  for (let i = 0; i < n; i++) { const k = cle(i); if (!groupes.has(k)) groupes.set(k, []); groupes.get(k).push(i); }
  const out = new Float32Array(n * 3), u = new THREE.Vector3(), v = new THREE.Vector3(), s = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    u.fromArray(fn, i * 3).normalize(); s.set(0, 0, 0);
    for (const j of groupes.get(cle(i))) { v.fromArray(fn, j * 3); const l = v.length(); if (l > 0 && v.dot(u) / l > seuil) s.add(v); }
    if (s.lengthSq() === 0) s.copy(u);
    s.normalize(); out[i * 3] = s.x; out[i * 3 + 1] = s.y; out[i * 3 + 2] = s.z;
  }
  g.setAttribute('normal', new THREE.BufferAttribute(out, 3));
  return g;
}
function extruder(THREE, formes, { prof = 0.05, biseau = 0.05, courbe = 0, seg = 4, pas = 24 } = {}) {
  const g = new THREE.ExtrudeGeometry(formes, { depth: prof, curveSegments: pas, bevelEnabled: true, bevelThickness: biseau, bevelSize: biseau * 0.9, bevelOffset: -biseau * 0.9, bevelSegments: seg });
  g.translate(0, 0, -prof / 2);
  if (courbe) {
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); p.setZ(i, p.getZ(i) + courbe * (x * x * 0.8 - (y - 0.4) * (y - 0.4) * 0.25)); }
  }
  return adoucir(THREE, g.index ? g.toNonIndexed() : g);
}

/* ------------------------------------------------------------ le verre (une seule matière, un seul programme) */
function materiauVerre(THREE, PM, U, { depoli, teinte, corps = 0.55 }) {
  const u = {
    tFond: PM.tFond, kzRes: U.kzRes, kzBal: U.kzBal, kzLiq: U.kzLiq, kzTps: U.kzTps,
    uTemps: PM.uTemps, uDepoli: { value: depoli }, uCorps: { value: corps }, uTeinte: { value: new THREE.Color(teinte) }, uVis: { value: 1 }, uEclat: { value: 0 },
  };
  return new THREE.ShaderMaterial({
    uniforms: u, fog: false,
    vertexShader: /* glsl */ `
      varying vec3 vN; varying vec3 vV; varying vec3 vLoc; varying vec3 vMonde;
      void main() {
        vLoc = position;
        vec4 mw = modelMatrix * vec4(position, 1.0); vMonde = mw.xyz;
        vec4 mv = viewMatrix * mw; vV = -mv.xyz; vN = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      ${GLSL_MASQUE}
      ${GLSL_IRIS}
      uniform sampler2D tFond; uniform float uTemps; uniform float uDepoli; uniform float uCorps; uniform vec3 uTeinte; uniform float uVis; uniform float uEclat;
      varying vec3 vN; varying vec3 vV; varying vec3 vLoc; varying vec3 vMonde;
      vec3 fond(vec2 uv) { return textureLod(tFond, clamp(uv, 0.002, 0.998), 0.0).rgb; }
      vec3 film(float cosT, float d) { vec3 ph = 2.0 * 1.38 * d * cosT / vec3(650.0, 532.0, 450.0); return 0.5 + 0.5 * cos(6.2831853 * ph); }
      void main() {
        if (uVis < 0.01 || kzClair(gl_FragCoord.xy) < 0.5) discard;
        vec3 N = normalize(vN); vec3 V = normalize(vV);
        if (!gl_FrontFacing) N = -N;
        float nv = clamp(dot(N, V), 0.0, 1.0);
        float F = 0.04 + 0.96 * pow(1.0 - nv, 4.0);
        vec2 uv = gl_FragCoord.xy / kzRes;
        float ep = 0.6 + 1.5 * (1.0 - nv);
        vec2 o = refract(-V, N, 1.0 / 1.45).xy * ep * 0.11;
        // dépoli : plusieurs prises autour du point réfracté (un disque tourné au hasard par pixel)
        float a0 = kzHm(gl_FragCoord.xy) * 6.2831;
        vec3 r = vec3(0.0);
        for (int i = 0; i < 6; i++) {
          float a = a0 + float(i) * 1.0472;
          float rr = uDepoli * (0.35 + 0.65 * fract(float(i) * 0.618 + kzHm(gl_FragCoord.yx)));
          vec2 d = vec2(cos(a), sin(a)) * rr;
          r += vec3(fond(uv + o * 1.04 + d).r, fond(uv + o + d).g, fond(uv + o * 0.96 + d).b);
        }
        r /= 6.0;
        // le corps du verre : il absorbe un peu, teinté
        vec3 c = r * mix(vec3(1.0), uTeinte, uCorps) * (1.0 - 0.18 * uCorps);
        c *= 0.97 + 0.06 * kzHm(floor(gl_FragCoord.xy * 0.7));
        // une lumière qui passe dedans (le bord opposé à la lumière s'éclaire)
        c += uTeinte * 0.08 * smoothstep(0.2, 0.9, dot(N, normalize(vec3(-0.4, -0.6, 0.6))));
        // arêtes : un trait sombre fin (le dessin du verre sur le clair), puis l'irisation et le reflet du studio
        float bord = pow(1.0 - nv, 1.25);
        c = mix(c, c * 0.5 + uTeinte * 0.05, bord * 0.62);
        c = mix(c, vec3(0.28, 0.31, 0.38), smoothstep(0.32, 0.12, nv) * 0.55);
        vec3 ir = kzHolo(nv * 1.3 + vLoc.x * 0.4 + vLoc.y * 0.25 - uTemps * 0.03) * film(nv, 380.0);
        c += ir * pow(1.0 - nv, 2.0) * 0.75;
        vec3 R = reflect(-V, N);
        float studio = smoothstep(0.55, 0.9, R.y) * 0.9 + smoothstep(0.1, 0.0, abs(R.x - 0.5)) * smoothstep(-0.2, 0.4, R.y) * 0.9;
        c += vec3(1.0) * F * (0.3 + studio * 1.5) + vec3(1.0) * pow(max(dot(R, normalize(vec3(-0.3, 0.7, 0.6))), 0.0), 60.0) * 1.2;
        c += uTeinte * uEclat * 0.25;
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
}

/* ------------------------------------------------------------ l'ombre (silhouette floue + cœur de lumière) */
function textureOmbre(THREE) {
  const W = 256, cv = document.createElement('canvas');
  cv.width = W * 2; cv.height = W;
  const cx = cv.getContext('2d');
  cx.fillStyle = '#000'; cx.fillRect(0, 0, W * 2, W);
  const dessin = (ox, flou) => {
    cx.save();
    cx.filter = flou ? `blur(${flou}px)` : 'none';
    cx.translate(ox + W / 2, W * 0.72);
    cx.scale(W * 0.42, -W * 0.42);
    cx.fillStyle = '#fff';
    const fol = (ang, L, bx, by) => {
      cx.beginPath();
      const n = 30;
      for (let i = 0; i <= n; i++) { const u = i / n; const x = u * L, y = demi(u) * L; const X = bx + x * Math.cos(ang) - y * Math.sin(ang), Y = by + x * Math.sin(ang) + y * Math.cos(ang); if (i) cx.lineTo(X, Y); else cx.moveTo(X, Y); }
      for (let i = n; i >= 0; i--) { const u = i / n; const x = u * L, y = -demi(u) * L; cx.lineTo(bx + x * Math.cos(ang) - y * Math.sin(ang), by + x * Math.sin(ang) + y * Math.cos(ang)); }
      cx.closePath(); cx.fill();
    };
    fol(Math.PI / 2, 1, 0, 0.1); fol(Math.PI / 2 + 1.2, 0.8, 0, 0); fol(Math.PI / 2 - 1.2, 0.8, 0, 0);
    cx.restore();
  };
  dessin(0, 14);
  dessin(W, 3);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.NoColorSpace;
  return t;
}

export function creerClair(THREE, { mobile, U, PM }) {
  const alea = hasard(4242);
  const V3 = THREE.Vector3;
  const groupe = new THREE.Group();
  const verresDepolis = [0xbfe6ff, 0xb8f0d6, 0xdccbff].map((t) => materiauVerre(THREE, PM, U, { depoli: mobile ? 0.014 : 0.02, teinte: t }));
  const verreSymbole = materiauVerre(THREE, PM, U, { depoli: 0.006, teinte: 0xb9a2ff, corps: 0.95 });

  /* les grandes feuilles */
  const gKudzu = extruder(THREE, formesKudzu(THREE, 1), { prof: 0.05, biseau: 0.06, courbe: 0.12, seg: mobile ? 3 : 5, pas: mobile ? 14 : 22 });
  const gFoliole = extruder(THREE, [formeFoliole(THREE, Math.PI / 2, 1)], { prof: 0.04, biseau: 0.05, courbe: 0.16, seg: mobile ? 3 : 5, pas: mobile ? 14 : 22 });
  const texOmbre = textureOmbre(THREE);
  const uOmbre = { tOmbre: { value: texOmbre }, uVis: { value: 1 }, kzRes: U.kzRes, kzBal: U.kzBal, kzLiq: U.kzLiq, kzTps: U.kzTps, uTemps: PM.uTemps };
  const matOmbre = new THREE.ShaderMaterial({
    uniforms: uOmbre, transparent: false, depthWrite: false, depthTest: false,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.DstColorFactor, blendDst: THREE.ZeroFactor,
    vertexShader: /* glsl */ `attribute float aNet; varying vec2 vUv; varying float vNet; void main() { vUv = uv; vNet = aNet; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      ${GLSL_MASQUE}
      ${GLSL_IRIS}
      uniform sampler2D tOmbre; uniform float uVis; uniform float uTemps;
      varying vec2 vUv; varying float vNet;
      void main() {
        if (kzClair(gl_FragCoord.xy) < 0.5) { gl_FragColor = vec4(1.0); return; }
        float flou = texture2D(tOmbre, vec2(vUv.x * 0.5, vUv.y)).r;
        float net = texture2D(tOmbre, vec2(0.5 + vUv.x * 0.5, vUv.y)).r;
        float a = mix(flou, net, vNet * 0.6);
        // l'ombre, et le cœur de lumière colorée concentrée par le verre (décalé vers le centre de la forme)
        float coeur = texture2D(tOmbre, vec2(0.5 + (0.5 + (vUv.x - 0.5) * 1.25) * 0.5, 0.5 + (vUv.y - 0.5) * 1.25)).r;
        vec3 iris = kzHolo(vUv.x * 0.8 + vUv.y * 0.6 + uTemps * 0.02);
        vec3 c = mix(vec3(1.0), vec3(0.6, 0.63, 0.72), a * 0.8 * uVis);
        c += iris * coeur * a * 0.38 * uVis;
        gl_FragColor = vec4(c, 1.0);
      }`,
  });

  const nb = mobile ? 9 : 15;
  const feuilles = [];
  for (let i = 0; i < nb; i++) {
    const kudzu = i % 3 !== 2;
    const m = new THREE.Mesh(kudzu ? gKudzu : gFoliole, verresDepolis[i % 3]);
    m.frustumCulled = false;
    m.renderOrder = 4;
    const cote = i % 4 === 3 ? -1 : 1;
    const f = {
      mesh: m, kudzu, cote,
      x: cote * (1.8 + alea() * 2.6), y: 3.2 - (i / nb) * 30 + (alea() - 0.5) * 2.0, z: -2.6 + alea() * 3.4,
      taille: (kudzu ? 1.5 : 1.25) * (0.75 + alea() * 0.6),
      rx: (alea() - 0.5) * 1.2, ry: (alea() - 0.5) * 1.6, rz: (alea() - 0.5) * 2.4,
      vr: (alea() - 0.5) * 0.12, ph: alea() * 6.28,
    };
    if (cote < 0) { f.z -= 1.4; f.x -= 1.2; }
    // l'ombre
    const go = new THREE.PlaneGeometry(1, 1);
    go.setAttribute('aNet', new THREE.Float32BufferAttribute([0, 0, 0, 0], 1));
    const om = new THREE.Mesh(go, matOmbre);
    om.frustumCulled = false; om.renderOrder = -50;
    f.ombre = om;
    groupe.add(om, m);
    feuilles.push(f);
  }

  /* le ruban qui danse : une bande dont la courbe est calculée dans le nuanceur */
  const nS = mobile ? 220 : 360;
  const pos = [], idx = [];
  for (let i = 0; i <= nS; i++) { for (const c of [0, 1]) pos.push(i / nS, c, 0); if (i < nS) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
  const gD = new THREE.BufferGeometry();
  gD.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  gD.setIndex(idx);
  const uD = { uTemps: PM.uTemps, uVis: { value: 0 }, uCentre: { value: new V3() }, uEch: { value: 1 }, kzRes: U.kzRes, kzBal: U.kzBal, kzLiq: U.kzLiq, kzTps: U.kzTps };
  const matD = new THREE.ShaderMaterial({
    uniforms: uD, side: THREE.DoubleSide,
    vertexShader: /* glsl */ `
      uniform float uTemps; uniform vec3 uCentre; uniform float uEch; uniform float uVis;
      varying vec2 vR; varying vec3 vN; varying vec3 vV;
      vec3 courbe(float s) {
        float t = uTemps;
        float th = s * 8.4 + t * 0.32;
        float r = 2.05 + 0.45 * sin(s * 3.1 + t * 0.41) + 0.2 * sin(s * 11.0 - t * 0.6);
        return vec3(cos(th) * r * 1.15, sin(th * 0.5 + t * 0.21) * 1.25 + (s - 0.5) * 1.4 + 0.15 * sin(s * 9.0 + t), sin(th) * r * 0.55 + 0.3 * cos(s * 5.0 + t * 0.5));
      }
      void main() {
        float s = position.x;
        vec3 c = courbe(s), c2 = courbe(s + 0.002);
        vec3 T = normalize(c2 - c);
        float tw = s * 11.0 + uTemps * 0.9;
        vec3 ref = normalize(vec3(0.0, 0.3, 1.0));
        vec3 B = normalize(cross(T, ref)); vec3 Nn = normalize(cross(B, T));
        vec3 W = B * cos(tw) + Nn * sin(tw);
        float larg = 0.13 * smoothstep(0.0, 0.08, s) * smoothstep(1.0, 0.85, s) * smoothstep(0.0, 1.0, uVis);
        vec3 p = uCentre + (c + W * (position.y - 0.5) * 2.0 * larg) * uEch;
        vR = vec2(s, position.y);
        vec4 mv = viewMatrix * vec4(p, 1.0);
        vN = normalize(mat3(viewMatrix) * cross(T, W)); vV = -mv.xyz;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      ${GLSL_MASQUE}
      ${GLSL_IRIS}
      uniform float uTemps; uniform float uVis;
      varying vec2 vR; varying vec3 vN; varying vec3 vV;
      void main() {
        if (uVis < 0.01 || kzClair(gl_FragCoord.xy) < 0.5) discard;
        if (vR.x > uVis * 1.05) discard;
        vec3 n = normalize(vN); vec3 v = normalize(vV);
        float fr = 1.0 - abs(dot(n, v));
        float onde = kzNm(vec2(vR.x * 14.0 - uTemps * 0.5, vR.y * 2.0));
        vec3 c = kzHolo(vR.x * 2.2 - uTemps * 0.08 + onde * 0.5 + fr * 0.5);
        c = pow(c, vec3(1.3)) * 1.55;
        float pa = kzHm(floor(gl_FragCoord.xy * 0.5) + floor(uTemps * 8.0));
        c = mix(c, vec3(1.0), step(0.985, pa) * 0.7);
        float l = 0.62 + 0.45 * abs(n.y * 0.6 + n.z * 0.8) + pow(fr, 3.0) * 0.6;
        c *= l * (0.8 + 0.2 * smoothstep(0.0, 0.15, 0.5 - abs(vR.y - 0.5)));
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  const danseur = new THREE.Mesh(gD, matD);
  danseur.frustumCulled = false; danseur.renderOrder = 5;
  groupe.add(danseur);

  /* les six objets du déroulé */
  const symboles = [];
  const ajouterSymbole = (meshes) => {
    const g = new THREE.Group();
    for (const m of meshes) { m.material = verreSymbole; m.frustumCulled = false; m.renderOrder = 4; g.add(m); }
    g.scale.setScalar(0.0001);
    groupe.add(g);
    symboles.push({ g, e: 0, ph: alea() * 6.28 });
  };
  const ex = (f, o) => extruder(THREE, f, { prof: 0.08, biseau: 0.05, seg: mobile ? 3 : 4, pas: 18, ...(o || {}) });
  // 1. la bulle de message
  ajouterSymbole([new THREE.Mesh(ex([bulle(THREE)]))]);
  // 2. deux anneaux enlacés
  {
    const t = new THREE.TorusGeometry(0.42, 0.075, mobile ? 14 : 20, mobile ? 40 : 64);
    const a = new THREE.Mesh(t), b = new THREE.Mesh(t);
    a.position.x = -0.24; b.position.x = 0.24; b.rotation.x = Math.PI / 2;
    ajouterSymbole([a, b]);
  }
  // 3. le crayon
  {
    const corps = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.0, 6, 1));
    const pointe = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.3, 6, 1));
    pointe.position.y = -0.65; pointe.rotation.x = Math.PI;
    const g = [corps, pointe];
    for (const m of g) { m.position.applyAxisAngle(new V3(0, 0, 1), 0.7); m.rotation.z += 0.7; }
    ajouterSymbole(g);
  }
  // 4. le nuancier en éventail
  {
    const lame = ex([arrondi(THREE, 0.24, 1.0, 0.1)], { prof: 0.03, biseau: 0.025 });
    lame.translate(0, 0.42, 0);
    const g = [];
    for (let k = 0; k < 4; k++) { const m = new THREE.Mesh(lame); m.rotation.z = (k - 1.5) * 0.32; m.position.z = k * 0.07; m.position.y = -0.4; g.push(m); }
    ajouterSymbole(g);
  }
  // 5. la fenêtre de navigateur
  {
    const cadre = new THREE.Mesh(ex([arrondi(THREE, 1.3, 0.92, 0.1, [-0.56, -0.38, 1.12, 0.62, 0.05])], { prof: 0.05, biseau: 0.035 }));
    const g = [cadre];
    for (let k = 0; k < 3; k++) { const p = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 8)); p.position.set(-0.5 + k * 0.1, 0.34, 0.05); g.push(p); }
    const page = new THREE.Mesh(ex([arrondi(THREE, 0.6, 0.12, 0.05)], { prof: 0.02, biseau: 0.02 }));
    page.position.set(-0.15, 0.05, 0); g.push(page);
    ajouterSymbole(g);
  }
  // 6. la feuille trifoliée
  {
    const m = new THREE.Mesh(gKudzu);
    m.scale.setScalar(0.62); m.position.y = -0.25;
    ajouterSymbole([m]);
  }

  const verres = [...feuilles.map((f) => f.mesh), ...symboles.map((s) => s.g)];
  const lumDir = new V3(0.35, -0.5, -1).normalize();
  const tmp = new V3(), tmp2 = new V3();
  let portrait = false;

  return {
    groupe,
    cadrer({ portrait: p }) { portrait = p; },
    /* cache le verre pendant le rendu de la cible « fond » (il n'a pas à se réfracter lui-même) */
    masquerVerre() { const v = verres.map((m) => m.visible); verres.forEach((m) => { m.visible = false; }); return v; },
    retablirVerre(v) { verres.forEach((m, i) => { m.visible = v[i]; }); },
    maj({ s, dt, temps, clairPart, ruban, reduit, camera }) {
      groupe.visible = clairPart > 0.001;
      if (!groupe.visible) return;
      const lent = reduit ? 0.5 : 1;
      const xEch = portrait ? 0.55 : 1;
      // les feuilles : elles montent doucement en tournant ; un peu plus serrées au téléphone
      for (const f of feuilles) {
        const y = f.y + Math.sin(temps * 0.21 * lent + f.ph) * 0.18;
        f.mesh.position.set(portrait ? f.cote * (1.0 + (Math.abs(f.x) - 1.8) * 0.45) : f.x, y, f.z);
        f.mesh.rotation.set(f.rx + Math.sin(temps * 0.17 * lent + f.ph) * 0.12, f.ry + temps * f.vr * lent, f.rz + Math.sin(temps * 0.13 * lent + f.ph * 2.0) * 0.1);
        f.mesh.scale.setScalar(f.taille * (portrait ? 0.75 : 1));
        f.mesh.visible = Math.abs(y - camera.position.y) < 9;
        // l'ombre sur la paroi du fond (z = -7), le long de la lumière
        const t = (-7 - f.mesh.position.z) / lumDir.z;
        tmp.copy(f.mesh.position).addScaledVector(lumDir, t);
        const recul = -7 - f.mesh.position.z;
        f.ombre.position.copy(tmp);
        f.ombre.rotation.set(0, 0, f.rz + f.ry * 0.3);
        const ta = f.mesh.scale.x * (1 + Math.abs(recul) * 0.06) * 2.5;
        f.ombre.scale.set(ta * Math.max(0.35, Math.cos(f.ry)), ta, 1);
        f.ombre.geometry.attributes.aNet.array.fill(Math.max(0, 1 - Math.abs(recul) / 9));
        f.ombre.geometry.attributes.aNet.needsUpdate = true;
        f.ombre.visible = f.mesh.visible;
      }
      // le ruban qui danse autour du sceau de cristal (rêver), il s'efface quand la liane descend
      const vD = Math.min(1, Math.max(0, (s - 3.95) / 0.45)) * (1 - Math.min(1, Math.max(0, (s - 4.95) / 0.3)));
      uD.uVis.value = vD;
      uD.uCentre.value.set(0, 0, 0);
      uD.uEch.value = portrait ? 0.62 : 1;
      danseur.visible = vD > 0.005;
      // les objets du déroulé : chacun éclot quand la liane l'atteint
      if (ruban) {
        const fin = ruban.u.uFin.value;
        symboles.forEach((sy, k) => {
          const n = ruban.noeuds[k];
          const cible = s > 4.8 && s < 6.15 ? Math.min(1, Math.max(0, (fin - n.s) / 0.9)) : 0;
          sy.e += (cible - sy.e) * (1 - Math.exp(-dt * (cible > sy.e ? 3.0 : 4.0)));
          const e = sy.e;
          const rebond = e < 1 ? 1 + 2.2 * Math.pow(e - 1, 3) + 1.2 * Math.pow(e - 1, 2) : 1;   // sortie avec léger dépassement
          ruban.noeudMonde(k, ruban.groupe.parent, tmp2);
          const cote = tmp2.x >= 0 ? 1 : -1;
          sy.g.position.set(tmp2.x + cote * (portrait ? 0.75 : 1.35), tmp2.y + 0.15, tmp2.z + 0.4);
          sy.g.scale.setScalar(Math.max(0.0001, e * rebond * (portrait ? 0.7 : 1)));
          sy.g.rotation.set(0.15 * Math.sin(temps * 0.4 * lent + sy.ph), (1 - e) * 2.5 + Math.sin(temps * 0.3 * lent + sy.ph) * 0.5, 0);
          sy.g.visible = e > 0.002;
        });
      }
      verreSymbole.uniforms.uEclat.value = 0;
    },
  };
}
