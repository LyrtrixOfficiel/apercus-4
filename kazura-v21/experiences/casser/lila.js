/* Le nouveau site de Lila Fougère (sophrologue imaginaire) : direction « L'heure bleue ».
   Un monde en WebGL derrière le site, qui suit le défilement : le ciel du soir au-dessus de la mer, une perle de souffle
   (verre liquide irisé) qui respire, la plongée sous la surface, le calme des profondeurs, puis la remontée vers l'aube.
   Pendant l'éclosion, le même monde s'ouvre comme un portail au cœur du sceau Kazura (piloté par casser.js).
   Sans WebGL : des fonds CSS qui suivent les mêmes parties (classe « sans-gl »). Rien n'est envoyé nulle part. */
(() => {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const neuf = $('#neuf'), cv = $('#monde');
  const mqReduit = matchMedia('(prefers-reduced-motion: reduce)');
  let REDUIT = mqReduit.matches;
  if (mqReduit.addEventListener) mqReduit.addEventListener('change', (e) => { REDUIT = e.matches; });
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lisse = (t) => t * t * (3 - 2 * t);
  const mix = (a, b, t) => a + (b - a) * t;

  /* ------------------------------------------------------------------ le nuanceur */
  const VS = `precision highp float;
attribute vec2 aP;
void main() { gl_Position = vec4(aP, 0.0, 1.0); }`;

  const FS = `precision highp float;
uniform vec2 uRes;
uniform float uT, uSens, uLigne, uProf, uAube, uHoriz, uSouffle, uPortail, uLum, uMobile;
uniform vec3 uOrbe;
uniform vec2 uCentre, uSouris;

float h12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
vec2 h22(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973)); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.xx + p3.yz) * p3.zy); }
float bruit(vec2 p) {
  vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(h12(i), h12(i + vec2(1.0, 0.0)), u.x), mix(h12(i + vec2(0.0, 1.0)), h12(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { s += a * bruit(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; } return s; }
float fbm2(vec2 p) { return bruit(p) * 0.62 + bruit(p * 2.07 + vec2(3.1, 7.7)) * 0.38; }

// Le ciel : nuit bleue en haut, mauve puis braise près de l'horizon autour de la perle ; l'aube le rend lilas et pêche.
vec3 ciel(vec2 q, vec2 o, float r) {
  float h = clamp((q.y - uHoriz) / (1.0 - uHoriz), 0.0, 1.0);
  vec3 z = mix(vec3(0.03, 0.045, 0.13), vec3(0.66, 0.71, 0.90), uAube);
  vec3 m = mix(vec3(0.12, 0.10, 0.30), vec3(0.80, 0.79, 0.93), uAube);
  vec3 l = mix(vec3(0.36, 0.17, 0.38), vec3(0.97, 0.86, 0.84), uAube);
  vec3 hz = mix(vec3(0.99, 0.56, 0.42), vec3(1.0, 0.89, 0.74), uAube);
  vec3 c = mix(l, m, smoothstep(0.0, 0.42, h));
  c = mix(c, z, smoothstep(0.3, 1.0, h));
  float d = length((q - o) * vec2(0.62, 1.0));
  float g = exp(-d / (r * 0.85 + 0.03));
  float bas = exp(-max(q.y - uHoriz, 0.0) * 14.0) * exp(-abs(q.x - o.x) * 2.0);
  c = mix(c, hz, clamp(g * 0.75 + bas * 0.6, 0.0, 1.0));
  // de longs nuages fins, éclairés par la perle
  vec2 nq = vec2(q.x * 0.55 + uT * 0.004, (q.y - uHoriz) * 7.5);
  float n = fbm(nq * vec2(2.6, 1.0));
  float nuage = smoothstep(0.56, 0.86, n) * smoothstep(0.02, 0.1, h) * (1.0 - smoothstep(0.5, 0.85, h));
  vec3 cn = mix(c * 0.78 + vec3(0.02, 0.0, 0.04), hz * 1.05, clamp(g * 1.4 + bas * 0.6, 0.0, 1.0));
  c = mix(c, cn, nuage * 0.55);
  // étoiles
  vec2 sq = q * 120.0; vec2 sg = floor(sq); vec2 sf = fract(sq) - 0.5; float sh = h12(sg);
  float e = step(0.986, sh) * smoothstep(0.16, 0.0, length(sf - (h22(sg) - 0.5) * 0.5)) * (0.55 + 0.45 * sin(uT * 1.7 + sh * 70.0));
  c += e * smoothstep(0.3, 0.85, h) * (1.0 - uAube) * 0.9;
  return c;
}

// La mer vue d'au-dessus : vagues en perspective, reflet de la perle en paillettes.
vec3 mer(vec2 q, vec2 o, float r) {
  float dy = max(uHoriz - q.y, 0.0);
  float z = 1.0 / (dy * 5.5 + 0.05);
  vec2 w = vec2(q.x * z * 0.8, z * 1.4);
  float vag = bruit(w * vec2(1.0, 2.2) + vec2(0.0, uT * 0.22)) * 0.6 + bruit(w * vec2(2.4, 5.1) - vec2(uT * 0.17, uT * 0.33)) * 0.4;
  vec3 fonce = mix(vec3(0.025, 0.03, 0.09), vec3(0.66, 0.72, 0.84), uAube);
  vec3 hz = mix(vec3(0.34, 0.17, 0.34), vec3(0.96, 0.89, 0.88), uAube);
  vec3 c = mix(hz, fonce, smoothstep(0.0, 0.3, dy));
  c *= 0.9 + vag * 0.22;
  vec3 chaud = mix(vec3(1.0, 0.66, 0.5), vec3(1.0, 0.88, 0.7), uAube);
  float bx = abs(q.x - o.x);
  float large = r * (0.45 + dy * 2.4);
  float chemin = exp(-pow(bx / large, 2.0));
  float pa = bruit(vec2(q.x * z * 7.0, z * 26.0) + vec2(0.0, uT * 0.9));
  float paillette = smoothstep(0.74, 0.97, pa) * chemin;
  c += chaud * paillette * 1.15;
  c += chaud * chemin * exp(-dy * 4.0) * 0.22;
  // la ligne d'horizon, très fine
  c += hz * exp(-dy * 260.0) * 0.35;
  return c;
}

// Sous la surface : eau qui fonce avec la profondeur, rayons, caustiques, neige marine qui s'allume au fond.
vec3 dessous(vec2 q, float A) {
  float p = uProf;
  vec3 haut = mix(vec3(0.10, 0.36, 0.44), vec3(0.035, 0.12, 0.23), p);
  vec3 bas = mix(vec3(0.03, 0.15, 0.24), vec3(0.01, 0.025, 0.07), p);
  vec3 c = mix(bas, haut, smoothstep(-0.15, 1.2, q.y));
  vec2 s = vec2(A * 0.5 + sin(uT * 0.05) * 0.25, 1.7);
  vec2 v = q - s; float a = atan(v.x, -v.y);
  float rai = smoothstep(0.42, 0.88, fbm2(vec2(a * 10.0, uT * 0.06)));
  float vers = smoothstep(-0.3, 1.1, q.y);
  c += vec3(0.5, 0.85, 0.82) * rai * vers * (1.0 - p * 0.8) * 0.2;
  vec2 cq = q * 6.0 + vec2(uT * 0.07, -uT * 0.05);
  float ca = abs(bruit(cq) - bruit(cq * 1.6 + 3.1));
  c += vec3(0.45, 0.9, 0.85) * smoothstep(0.07, 0.0, ca) * 0.06 * (1.0 - p) * vers;
  for (int i = 0; i < 2; i++) {
    float fi = float(i);
    float sc = mix(16.0, 31.0, fi);
    vec2 g = q * sc + vec2(sin(uT * 0.1 + fi) * 0.6, -uT * mix(0.32, 0.18, fi));
    vec2 id = floor(g), f = fract(g) - 0.5;
    vec2 rp = h22(id) - 0.5;
    float d = length(f - rp * 0.7);
    float on = step(0.52, h12(id + 7.0));
    float pt = smoothstep(mix(0.085, 0.06, fi), 0.0, d) * on;
    vec3 bio = mix(vec3(0.7, 0.88, 0.92), mix(vec3(0.4, 1.0, 0.82), vec3(0.78, 0.62, 1.0), h12(id + 3.0)), p);
    c += bio * pt * (0.14 + p * 0.62) * (0.55 + 0.45 * sin(uT * 1.4 + h12(id) * 40.0));
  }
  return c;
}

vec3 monde(vec2 q, vec2 o, float r, float A, out float sous) {
  float vague = 0.011 * sin(q.x * 5.0 + uT * 1.05) + 0.005 * sin(q.x * 12.0 - uT * 1.6);
  float lig = uLigne + vague;
  // uSens = 1 : l'eau est sous la ligne (on plonge) ; -1 : au-dessus (on en sort)
  float dl = (q.y - lig) * uSens;
  sous = smoothstep(0.003, -0.003, dl);
  vec3 c;
  if (dl > 0.006) c = q.y > uHoriz ? ciel(q, o, r) : mer(q, o, r);
  else if (dl < -0.006) c = dessous(q, A);
  else {
    vec3 a = q.y > uHoriz ? ciel(q, o, r) : mer(q, o, r);
    c = mix(a, dessous(q, A), sous);
  }
  // le ménisque : la surface vue de profil
  float m = exp(-pow((q.y - lig) / 0.0045, 2.0));
  c = mix(c, vec3(0.92, 0.97, 1.0), m * 0.55);
  c *= 1.0 - exp(-pow((dl + 0.012) / 0.01, 2.0)) * 0.25;
  return c;
}

void main() {
  float A = uRes.x / uRes.y;
  vec2 q = vec2(gl_FragCoord.x / uRes.x * A, gl_FragCoord.y / uRes.y);
  vec2 C = vec2(uCentre.x * A, uCentre.y);
  float dp = length(q - C);
  float portail = step(0.0, uPortail);
  // le bord du portail se comporte comme une lentille de verre liquide
  if (portail > 0.5) {
    float bord = exp(-pow((dp - uPortail) / (0.03 + uPortail * 0.05), 2.0));
    q -= normalize(q - C + 1e-5) * bord * 0.035;
  }
  vec2 o = vec2(uOrbe.x * A, uOrbe.y) + uSouris * 0.012;
  float r = uOrbe.z * (1.0 + uSouffle * 0.07);
  float sous;
  vec3 c = monde(q, o, r, A, sous);
  vec3 chaud = mix(vec3(1.0, 0.7, 0.55), vec3(1.0, 0.88, 0.72), uAube);
  vec3 tinte = mix(chaud, vec3(0.55, 0.92, 0.92), sous);
  float dd = length(q - o);
  c += tinte * exp(-max(dd - r, 0.0) / (r * 0.3 + 0.01)) * (0.16 + uSouffle * 0.12) * (1.0 - uProf * 0.5) * step(r, dd);
  // la perle de souffle : une bille de verre liquide. Elle renverse le monde (l'horizon y passe la tête en bas),
  // un film irisé fin court sur son bord, sa lumière intérieure respire.
  if (dd < r * 1.01) {
    vec2 nd = (q - o) / r; float l = min(length(nd), 1.0);
    vec3 n = vec3(nd, sqrt(max(1.0 - l * l, 0.0)));
    float fres = pow(1.0 - n.z, 3.0);
    float s2;
    float bombe = 1.0 + (1.0 - n.z) * 0.35;
    vec2 qa = o - (q - o) * 2.05 * bombe;
    vec2 qb = o - (q - o) * 2.2 * bombe;
    vec3 ra = monde(qa, o, r, A, s2);
    vec3 rb = monde(qb, o, r, A, s2);
    vec3 refr = vec3(ra.r, mix(ra.g, rb.g, 0.5), rb.b);
    refr = mix(refr, refr * refr * 1.6, 0.25);
    float th = fbm2(n.xy * 1.6 + vec2(uT * 0.03, -uT * 0.02) + uSouffle * 0.35) + n.z * 0.4 + uT * 0.015;
    vec3 film = 0.5 + 0.5 * cos(6.2832 * (th * 1.2 + vec3(0.0, 0.33, 0.67)));
    film = mix(vec3(1.0), film, 0.55);
    vec3 col = refr * (0.92 + 0.18 * uSouffle) * (1.0 - uProf * 0.25);
    col += film * fres * 0.42 * (1.0 - uProf * 0.5);
    col += tinte * pow(n.z, 3.0) * (0.04 + uSouffle * 0.14);
    vec3 L1 = normalize(vec3(-0.45 + uSouris.x * 0.4, 0.55 + uSouris.y * 0.3, 0.7));
    vec3 L2 = normalize(vec3(0.55, -0.5, 0.65));
    vec3 Rv = reflect(vec3(0.0, 0.0, -1.0), n);
    float sp1 = pow(max(dot(Rv, L1), 0.0), 140.0);
    col += vec3(1.0, 0.98, 0.95) * (sp1 * 1.6 + smoothstep(0.93, 0.995, dot(Rv, L1)) * 0.35) * (1.0 - uProf * 0.82);
    col += tinte * pow(max(dot(Rv, L2), 0.0), 18.0) * 0.35;
    col += vec3(1.0) * smoothstep(0.955, 1.0, l) * 0.22 * (1.0 - uProf * 0.6);
    // la lumière concentrée par la bille : un croissant chaud, à l'opposé de la lumière principale
    float cr = smoothstep(0.25, 0.95, dot(nd, -normalize(L1.xy))) * smoothstep(1.0, 0.72, l);
    col += tinte * cr * (0.28 + uSouffle * 0.2) * (1.0 - uProf * 0.65);
    float bordAA = 1.6 / (r * uRes.y);
    c = mix(c, col, smoothstep(1.0, 1.0 - bordAA, l));
  }
  float alpha = 1.0;
  if (portail > 0.5) {
    float R = uPortail;
    float px = 1.4 / uRes.y;
    float dedans = smoothstep(R + px, R - px, dp);
    float ang = atan(q.y - C.y, q.x - C.x);
    vec3 iri = 0.55 + 0.45 * cos(6.2832 * (ang / 6.2832 * 2.0 + uT * 0.2 + vec3(0.0, 0.33, 0.67)));
    float fil = exp(-pow((dp - R) / 0.005, 2.0));
    float halo = exp(-abs(dp - R) / 0.045) * (1.0 - dedans * 0.6);
    vec3 lum = mix(vec3(0.6, 1.0, 0.85), vec3(1.0, 0.97, 0.9), 0.4);
    c = c * dedans + c * dedans * uLum * 1.2 + vec3(1.0, 0.97, 0.9) * uLum * dedans * 0.6;
    c += iri * fil * 1.3 + lum * halo * 0.5;
    alpha = clamp(dedans + fil + halo * 0.7, 0.0, 1.0);
  }
  // grain de pellicule et vignette douce
  float gr = h12(gl_FragCoord.xy + fract(uT * 7.13) * 97.0) - 0.5;
  c += gr * 0.035;
  vec2 vq = gl_FragCoord.xy / uRes - 0.5;
  c *= 1.0 - dot(vq, vq) * 0.35;
  c = clamp(c, 0.0, 1.0);
  gl_FragColor = vec4(min(c, vec3(alpha)), alpha);
}`;

  /* ------------------------------------------------------------------ WebGL */
  let gl = null, prog = null, U = {}, glOk = false, W = 0, H = 0, MOBILE = false, ECH = 1;
  function initGL() {
    if (gl || !cv) return glOk;
    if (/[?&]sansgl/.test(location.search)) { neuf.classList.add('sans-gl'); return (glOk = false); }
    try {
      gl = cv.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, powerPreference: 'high-performance', preserveDrawingBuffer: false });
    } catch (e) { gl = null; }
    if (!gl) { neuf.classList.add('sans-gl'); return (glOk = false); }
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const vs = sh(gl.VERTEX_SHADER, VS), fs = sh(gl.FRAGMENT_SHADER, FS);
    prog = gl.createProgram(); gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      if (window.__kzDebug) console.warn(gl.getShaderInfoLog(fs));
      gl = null; neuf.classList.add('sans-gl'); return (glOk = false);
    }
    gl.useProgram(prog);
    const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'aP'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    for (const n of ['uRes', 'uT', 'uSens', 'uLigne', 'uProf', 'uAube', 'uHoriz', 'uSouffle', 'uPortail', 'uLum', 'uMobile', 'uOrbe', 'uCentre', 'uSouris']) U[n] = gl.getUniformLocation(prog, n);
    cv.addEventListener('webglcontextlost', (e) => { e.preventDefault(); glOk = false; neuf.classList.add('sans-gl'); });
    dimensionner();
    return (glOk = true);
  }
  const lent = { t: 0, n: 0 };
  function redim() { if (gl) { cv.width = Math.max(2, Math.round(W * ECH)); cv.height = Math.max(2, Math.round(H * ECH)); gl.viewport(0, 0, cv.width, cv.height); } }
  function dimensionner() {
    W = innerWidth; H = innerHeight;
    MOBILE = matchMedia('(pointer: coarse)').matches || W < 760;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const maxPix = MOBILE ? 0.62e6 : 1.15e6;
    ECH = Math.min(dpr, Math.sqrt(maxPix / (W * H)));
    const fe = /[?&]echelle=([\d.]+)/.exec(location.search); if (fe) ECH = Math.min(ECH, Number(fe[1]));
    if (gl) { cv.width = Math.max(2, Math.round(W * ECH)); cv.height = Math.max(2, Math.round(H * ECH)); gl.viewport(0, 0, cv.width, cv.height); }
  }

  /* ------------------------------------------------------------------ les parties du monde */
  // Pour chaque partie : ligne d'eau (0 bas, 1 haut ; < 0 : tout au-dessus, > 1 : tout dessous), profondeur, aube,
  // horizon, perle (x, y depuis le bas gauche, rayon en hauteur d'écran), encre du texte au-dessus.
  const PARTIES = {
    haut:     { o: { ligne: -0.25, prof: 0, aube: 0, horiz: 0.36, ox: 0.7, oy: 0.57, or: 0.235 }, t: { ligne: -0.25, prof: 0, aube: 0, horiz: 0.56, ox: 0.5, oy: 0.805, or: 0.115 }, encre: 'clair' },
    plongee:  { o: { ligne: 1.25, prof: 0.38, aube: 0, horiz: 0.36, ox: 0.83, oy: 0.62, or: 0.13 }, t: { ligne: 1.25, prof: 0.38, aube: 0, horiz: 0.56, ox: 0.78, oy: 0.86, or: 0.085 }, encre: 'clair' },
    seances:  { o: { ligne: 1.25, prof: 0.5, aube: 0.2, horiz: 0.36, ox: 0.5, oy: 0.95, or: 0.075 }, t: { ligne: 1.25, prof: 0.5, aube: 0.2, horiz: 0.56, ox: 0.84, oy: 0.95, or: 0.05 }, encre: 'clair' },
    profond:  { o: { ligne: 1.25, prof: 1, aube: 1, horiz: 0.3, ox: 0.5, oy: 0.3, or: 0.24 }, t: { ligne: 1.25, prof: 1, aube: 1, horiz: 0.3, ox: 0.5, oy: 0.72, or: 0.13 }, encre: 'clair' },
    aube:     { o: { ligne: -0.25, prof: 0.4, aube: 1, horiz: 0.3, ox: 0.87, oy: 0.42, or: 0.1 }, t: { ligne: -0.25, prof: 0.4, aube: 1, horiz: 0.24, ox: 0.86, oy: 0.31, or: 0.06 }, encre: 'sombre' },
    cabinet:  { o: { ligne: -0.25, prof: 0.4, aube: 1, horiz: 0.3, ox: 0.9, oy: 0.2, or: 0.06 }, t: { ligne: -0.25, prof: 0.4, aube: 1, horiz: 0.2, ox: 0.86, oy: 0.25, or: 0.05 }, encre: 'sombre' },
    pied:     { o: { ligne: -0.25, prof: 0.4, aube: 1, horiz: 0.42, ox: 0.5, oy: 0.47, or: 0.17 }, t: { ligne: -0.25, prof: 0.4, aube: 1, horiz: 0.42, ox: 0.5, oy: 0.5, or: 0.12 }, encre: 'sombre' },
  };
  const CHAMPS = ['ligne', 'prof', 'aube', 'horiz', 'ox', 'oy', 'or'];
  const surfP = document.getElementById('surfPlonge'), surfR = document.getElementById('surfRemonte');
  let cles = [];
  function mesurer() {
    const els = [...neuf.querySelectorAll('[data-monde]')];
    const st = neuf.scrollTop;
    cles = els.map((el) => {
      const r = el.getBoundingClientRect();
      const top = r.top + st;
      const ancre = el.id === 'l-haut' ? 0 : top + Math.min(r.height, H) * 0.5 - H * 0.5;
      return { ancre, p: PARTIES[el.dataset.monde], el };
    }).sort((a, b) => a.ancre - b.ancre);
  }
  const cur = { ligne: -0.25, prof: 0, aube: 0, horiz: 0.36, ox: 0.7, oy: 0.57, or: 0.235 };
  let encre = 'clair';
  function cible() {
    const s = neuf.scrollTop, out = {};
    if (!cles.length) return Object.assign(out, PARTIES.haut[MOBILE ? 't' : 'o']);
    let i = 0; while (i < cles.length - 1 && cles[i + 1].ancre <= s) i++;
    const a = cles[i], b = cles[Math.min(i + 1, cles.length - 1)];
    const k = b === a ? 0 : lisse(clamp((s - a.ancre) / Math.max(1, b.ancre - a.ancre), 0, 1));
    const pa = a.p[MOBILE ? 't' : 'o'], pb = b.p[MOBILE ? 't' : 'o'];
    for (const c of CHAMPS) out[c] = mix(pa[c], pb[c], k);
    // la ligne d'eau traverse l'écran au milieu du passage, nette (pas d'eau qui « flotte » à mi-hauteur trop longtemps)
    // la ligne d'eau suit deux repères de la page (#surfPlonge, #surfRemonte), placés dans des zones sans texte
    if (surfP && surfR) {
      const sP = surfP.getBoundingClientRect().top / H, sR = surfR.getBoundingClientRect().top / H;
      // la mer est une bande de la page, entre les deux repères : la ligne d'eau est collée au repère visible
      if (sR < 1.05) { out.sens = -1; out.ligne = clamp(1 - sR, -0.25, 1.25); }
      else { out.sens = 1; out.ligne = clamp(1 - sP, -0.25, 1.25); }
    }
    // en chemin, la perle s'éloigne (plus petite) : elle ne passe jamais en grand derrière un texte
    if (pa.ox !== pb.ox || pa.oy !== pb.oy) out.or *= 1 - 0.62 * Math.sin(Math.PI * k);
    encre = (k < 0.5 ? a.p : b.p).encre;
    // téléphones courts : une perle un peu plus petite et plus haute, le titre garde sa place
    if (MOBILE && H < 720) { out.or *= 0.8; if (out.oy > 0.7) out.oy = Math.min(0.885, out.oy + 0.04); }
    return out;
  }

  /* ------------------------------------------------------------------ le souffle */
  // Un cycle de 12 s (14 s en mouvement réduit) : 4 s pour inspirer, 2 s pour retenir, 6 s pour expirer.
  const souffle = { t0: performance.now(), guide: false, tours: 0, val: 0, mot: '' };
  function phaseSouffle(now) {
    const k = REDUIT ? 14 / 12 : 1;
    const t = ((now - souffle.t0) / 1000) / k;
    const c = ((t % 12) + 12) % 12;
    if (c < 4) return { v: lisse(c / 4), mot: 'Inspirez', q: c / 12 };
    if (c < 6) return { v: 1, mot: 'Retenez', q: c / 12 };
    return { v: 1 - lisse((c - 6) / 6), mot: 'Expirez', q: c / 12, n: Math.floor(t / 12) };
  }

  /* ------------------------------------------------------------------ l'arrivée du site (pilotée image par image) */
  const INTRO = [['.l-lieu', 0, 'monte'], ['.l-ligne:nth-child(1) > span', 0.1, 'ligne'], ['.l-ligne:nth-child(2) > span', 0.26, 'ligne'],
    ['.l-chapo', 0.5, 'monte'], ['.l-actions', 0.64, 'monte'], ['.l-dispo', 0.9, 'monte'], ['.l-descendre', 1.1, 'monte'], ['#lTete', 0.6, 'tete'], ['.l-crosse path', 0.7, 'trait']];
  let intro = null, photoA = 0;
  function jouerIntro(now) {
    if (!intro.t0) intro.t0 = now;
    const t = (now - intro.t0) / 1000;
    let fini = true;
    for (const [el, d, k] of intro.els) {
      const dur = k === 'ligne' ? 1.5 : k === 'trait' ? 2.2 : 1.3;
      const p = clamp((t - d) / (dur * (REDUIT ? 1.3 : 1)), 0, 1); if (p < 1) fini = false;
      const e = 1 - Math.pow(1 - p, 3.2);
      if (k === 'trait') { el.style.strokeDashoffset = (120 * (1 - e)).toFixed(1); continue; }
      if (k === 'ligne') { el.style.transform = REDUIT ? 'none' : `translateY(${(108 * (1 - e)).toFixed(2)}%) rotate(${(3 * (1 - e)).toFixed(2)}deg)`; if (REDUIT) el.style.opacity = e.toFixed(3); continue; }
      el.style.opacity = e.toFixed(3);
      el.style.transform = REDUIT ? 'none' : `translateY(${((k === 'tete' ? -18 : 30) * (1 - e)).toFixed(2)}px)`;
    }
    if (fini) {
      neuf.classList.remove('l-avant');
      for (const [el] of intro.els) { el.style.transform = ''; el.style.opacity = ''; el.style.strokeDashoffset = ''; requestAnimationFrame(() => { el.style.transition = ''; }); }
      intro = null;
    }
  }

  /* ------------------------------------------------------------------ la boucle */
  let actif = false, raf = 0, t0 = performance.now(), dernier = 0;
  const port = { r: -1, cx: 0.5, cy: 0.5, lum: 0, orbe: null, k: 0 };
  const souris = { x: 0, y: 0, cx: 0, cy: 0 };
  const guide = $('#guide'), titreMot = $('.l-respire-mot'), arc = $('.l-respire-arc');
  const tete = $('#lTete');
  const respirants = [...document.querySelectorAll('.l-respire-mot, .l-respire-rond')];
  let vuFin = false;
  function frame(now) {
    raf = 0;
    if (!actif) return;
    const brut = dernier ? (now - dernier) / 1000 : 1 / 60;
    const dt = Math.min(0.05, brut); dernier = now;
    // un téléphone qui peine (moins de 22 images par seconde pendant 1,5 s) : le monde passe en plus basse définition
    if (!document.hidden && brut < 0.5) { lent.t += brut; lent.n++; if (lent.t > 1.5) { if (lent.t / lent.n > 1 / 22 && ECH > 0.42) { ECH *= 0.82; redim(); } lent.t = 0; lent.n = 0; } }
    const cib = cible();
    const amorti = 1 - Math.pow(0.0015, dt);
    for (const c of CHAMPS) cur[c] = mix(cur[c], cib[c], amorti);
    cur.ligne = cib.ligne; cur.sens = cib.sens || 1;
    if (intro) jouerIntro(now);
    if (photoA && now > photoA && !vuFin) { photoA = 0; const v = vignette(now); const im = $('#finApres'); if (v && im) im.src = v; }
    const ph = phaseSouffle(now);
    const amp = REDUIT ? 0.6 : 1;
    // lissé (constante de temps d'un quart de seconde) : le départ du guide ne fait jamais sauter la perle
    souffle.val = mix(souffle.val, ph.v * amp, 1 - Math.exp(-dt / 0.25));
    const sv = souffle.val.toFixed(3);
    for (const el of respirants) el.style.setProperty('--souffle', sv);
    if (arc) arc.style.strokeDashoffset = String(100 - ph.q * 100);
    if (souffle.guide) {
      if (ph.mot !== souffle.mot) {
        if (ph.mot === 'Inspirez' && souffle.mot === 'Expirez' && ++souffle.tours >= 3) arreterGuide('Merci. Encore ?');
        else { souffle.mot = ph.mot; guide.textContent = ph.mot; }
      }
    }
    if (tete && tete.dataset.encre !== encre) { tete.dataset.encre = encre; neuf.dataset.encre = encre; }
    souris.cx = mix(souris.cx, souris.x, 1 - Math.pow(0.02, dt)); souris.cy = mix(souris.cy, souris.y, 1 - Math.pow(0.02, dt));
    // la perle pendant l'éclosion : elle naît au cœur du sceau, puis gagne sa place
    let ox = cur.ox, oy = cur.oy, or = cur.or;
    if (port.orbe) { const k = lisse(port.k); ox = mix(port.orbe.x, ox, k); oy = mix(port.orbe.y, oy, k); or = mix(port.orbe.r, or, k); }
    if (guide && souffle.guide) { guide.style.transform = `translate(${(ox * W).toFixed(1)}px, ${((1 - oy) * H).toFixed(1)}px) translate(-50%, -50%)`; }
    if (!vuFin) dessinerGL(now, ox, oy, or);
    if (!document.hidden) raf = requestAnimationFrame(frame);
  }
  let dernierO = [0.7, 0.57, 0.235];
  function dessinerGL(now, ox, oy, or, P) {
    P = P || cur;
    if (P === cur) dernierO = [ox, oy, or];
    if (glOk) {
      gl.uniform2f(U.uRes, cv.width, cv.height);
      gl.uniform1f(U.uT, ((now - t0) / 1000) * (REDUIT ? 0.6 : 1));
      gl.uniform1f(U.uSens, P.sens || 1); gl.uniform1f(U.uLigne, P.ligne); gl.uniform1f(U.uProf, P.prof); gl.uniform1f(U.uAube, P.aube); gl.uniform1f(U.uHoriz, P.horiz);
      gl.uniform1f(U.uSouffle, souffle.val);
      gl.uniform1f(U.uPortail, port.r); gl.uniform1f(U.uLum, port.lum); gl.uniform1f(U.uMobile, MOBILE ? 1 : 0);
      gl.uniform3f(U.uOrbe, ox, oy, or);
      gl.uniform2f(U.uCentre, port.cx, port.cy);
      gl.uniform2f(U.uSouris, souris.cx, souris.cy);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
  }
  function relancer() { if (actif && !raf && !document.hidden) { dernier = 0; raf = requestAnimationFrame(frame); } }
  document.addEventListener('visibilitychange', relancer);

  /* ------------------------------------------------------------------ défilement : mots qui s'allument, bulles, en-tête */
  function decouperMots(el) {
    const mots = [];
    const marcher = (n) => {
      for (const c of [...n.childNodes]) {
        if (c.nodeType === 3) {
          const parts = c.textContent.split(/(\s+)/);
          const frag = document.createDocumentFragment();
          for (const p of parts) {
            if (!p) continue;
            if (/^\s+$/.test(p)) { frag.append(document.createTextNode(p)); continue; }
            const s = document.createElement('span'); s.className = 'l-mot'; s.textContent = p; frag.append(s); mots.push(s);
          }
          c.replaceWith(frag);
        } else if (c.nodeType === 1) marcher(c);
      }
    };
    marcher(el); return mots;
  }
  const lus = [];
  for (const id of ['grand', 'citation']) { const el = document.getElementById(id); if (el) lus.push({ el, mots: decouperMots(el), n: -1 }); }
  const bulles = [...document.querySelectorAll('.l-bulle')];
  function surDefilement() {
    if (!actif) return;
    for (const L of lus) {
      const r = L.el.getBoundingClientRect();
      const p = clamp((H * 0.86 - r.top) / (r.height + H * 0.32), 0, 1);
      const n = Math.round(p * L.mots.length * 1.08);
      if (n !== L.n) { L.n = n; L.mots.forEach((m, i) => m.classList.toggle('allume', i < n)); }
    }
    if (!REDUIT) for (let i = 0; i < bulles.length; i++) {
      const r = bulles[i].getBoundingClientRect();
      const c = (r.top + r.height / 2 - H / 2) / H;
      bulles[i].style.setProperty('--monte', (c * (MOBILE ? 18 : 60 + i * 40)).toFixed(1) + 'px');
    }
    tete.classList.toggle('defile', neuf.scrollTop > 40);
    if (souffle.guide && neuf.scrollTop > H * 0.3) arreterGuide();
    tete.classList.toggle('cache', $('#fin').getBoundingClientRect().top < tete.offsetHeight);
    const f = $('#fin').getBoundingClientRect();
    vuFin = f.top <= 0;
  }
  neuf.addEventListener('scroll', surDefilement, { passive: true });
  addEventListener('resize', () => { if (!actif) return; dimensionner(); mesurer(); surDefilement(); });

  // la souris (ordinateur) : la perle suit un peu, sa lumière tourne
  neuf.addEventListener('pointermove', (e) => { if (e.pointerType !== 'mouse') return; souris.x = (e.clientX / W - 0.5) * 2; souris.y = -(e.clientY / H - 0.5) * 2; }, { passive: true });

  // boutons aimantés (souris seulement)
  document.querySelectorAll('#neuf .l-aimant').forEach((b) => {
    b.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse' || REDUIT) return;
      const r = b.getBoundingClientRect();
      b.style.setProperty('--ax', ((e.clientX - r.left - r.width / 2) * 0.22).toFixed(1) + 'px');
      b.style.setProperty('--ay', ((e.clientY - r.top - r.height / 2) * 0.3).toFixed(1) + 'px');
    });
    b.addEventListener('pointerleave', () => { b.style.setProperty('--ax', '0px'); b.style.setProperty('--ay', '0px'); });
  });

  /* ------------------------------------------------------------------ apparitions */
  function observerVues() {
    document.querySelectorAll('#neuf .l-vue').forEach((v) => {
      const freres = [...v.parentElement.children].filter((x) => x.classList.contains('l-vue'));
      v.style.setProperty('--i', String(Math.min(4, freres.indexOf(v))));
    });
    const vues = document.querySelectorAll('#neuf .l-vue, #fin');
    const bandeau = $('#bandeau');
    if (!('IntersectionObserver' in window)) { vues.forEach((v) => v.classList.add('vu')); return; }
    const io = new IntersectionObserver((ents) => ents.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('vu'); io.unobserve(en.target); } }),
      { root: neuf, threshold: 0.12, rootMargin: '0px 0px -5% 0px' });
    vues.forEach((v) => io.observe(v));
    const io2 = new IntersectionObserver((ents) => ents.forEach((en) => bandeau.classList.toggle('cache', en.isIntersecting)), { root: neuf, threshold: 0.04 });
    io2.observe($('#fin'));
  }

  /* ------------------------------------------------------------------ respirer avec moi */
  const btnR = $('#respirer'), txtR = $('#respirerTxt');
  function arreterGuide(msg) {
    souffle.guide = false; souffle.mot = '';
    btnR.setAttribute('aria-pressed', 'false'); txtR.textContent = msg || 'Respirer avec moi';
    neuf.classList.remove('guide-on'); guide.textContent = '';
  }
  btnR.addEventListener('click', () => {
    if (souffle.guide) { arreterGuide(); return; }
    souffle.guide = true; souffle.tours = 0; souffle.mot = '';
    souffle.t0 = performance.now();
    btnR.setAttribute('aria-pressed', 'true'); txtR.textContent = 'Trois respirations…';
    neuf.classList.add('guide-on');
    if (neuf.scrollTop > H * 0.4) neuf.scrollTo({ top: 0, behavior: REDUIT ? 'auto' : 'smooth' });
  });

  /* ------------------------------------------------------------------ la réservation */
  const resa = (function reservation() {
    const JOURS = [
      { court: 'Mar.', n: 3, nom: 'mardi 3 novembre', h: [['9 h 30', 1], ['11 h', 1], ['14 h', 0], ['15 h 30', 1], ['17 h 30', 1]] },
      { court: 'Mer.', n: 4, nom: 'mercredi 4 novembre', h: [['10 h', 1], ['11 h 30', 0], ['16 h', 1], ['18 h', 1]] },
      { court: 'Jeu.', n: 5, nom: 'jeudi 5 novembre', h: [['9 h', 0], ['10 h 30', 1], ['14 h', 1]], groupe: true },
      { court: 'Ven.', n: 6, nom: 'vendredi 6 novembre', h: [['9 h 30', 0], ['11 h', 0], ['15 h', 0]] },
      { court: 'Sam.', n: 7, nom: 'samedi 7 novembre', h: [['9 h 30', 1], ['10 h 30', 0], ['11 h 30', 1]] },
    ];
    const types = [...document.querySelectorAll('.l-type')];
    const curseur = $('.l-types-curseur'), boite = $('#types');
    const elJours = $('#jours'), elCreneaux = $('#creneaux'), resume = $('#resume'), confirmer = $('#confirmer'), lieu = $('#l-lieu');
    const ok = $('#ok'), okTexte = $('#okTexte'), okTitre = $('#okTitre');
    let type = 'decouverte', jour = 0, heure = null;
    const btnType = () => types.find((b) => b.dataset.type === type);
    const heuresDe = (j) => (type === 'groupe' ? (j.groupe ? [['18 h 30', 1]] : []) : j.h);
    const libres = (j) => heuresDe(j).filter((h) => h[1]).length;
    function placerCurseur() {
      const b = btnType(); if (!b || !curseur) return;
      const rb = boite.getBoundingClientRect(), r = b.getBoundingClientRect();
      if (!r.width) return;
      curseur.style.transform = `translate(${(r.left - rb.left).toFixed(1)}px, ${(r.top - rb.top).toFixed(1)}px)`;
      curseur.style.width = r.width.toFixed(1) + 'px'; curseur.style.height = r.height.toFixed(1) + 'px';
    }
    function jours() {
      elJours.textContent = '';
      if (!libres(JOURS[jour])) jour = JOURS.findIndex((j) => libres(j));
      JOURS.forEach((j, i) => {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'l-jour';
        const n = libres(j);
        b.disabled = !n; b.setAttribute('aria-pressed', String(i === jour));
        b.innerHTML = `<span>${j.court}</span><b>${j.n}</b><i>${n ? (type === 'groupe' ? '4 places' : n + (n > 1 ? ' libres' : ' libre')) : 'complet'}</i>`;
        b.setAttribute('aria-label', `${j.nom}, ${n ? n + ' créneau' + (n > 1 ? 'x' : '') + ' libre' + (n > 1 ? 's' : '') : 'complet'}`);
        b.addEventListener('click', () => { jour = i; heure = null; jours(); });
        elJours.append(b);
      });
      creneaux();
    }
    function creneaux() {
      elCreneaux.textContent = '';
      heuresDe(JOURS[jour]).forEach(([h, libre], i) => {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'l-creneau'; b.textContent = h;
        b.style.setProperty('--i', String(i));
        b.disabled = !libre; b.setAttribute('aria-pressed', String(h === heure));
        if (!libre) b.setAttribute('aria-label', h + ', déjà pris');
        b.addEventListener('click', () => {
          heure = h;
          elCreneaux.querySelectorAll('.l-creneau').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
          majResume();
        });
        elCreneaux.append(b);
      });
      majResume();
    }
    function majResume() {
      const t = btnType();
      lieu.textContent = type === 'groupe' ? 'au cabinet, six personnes au plus' : 'au cabinet ou en visio';
      if (!heure) { resume.innerHTML = `<b>${t.dataset.nom}</b>, ${JOURS[jour].nom}. Choisissez une heure.`; confirmer.disabled = true; return; }
      resume.innerHTML = `<b>${t.dataset.nom}</b>, ${JOURS[jour].nom} à ${heure} · ${t.dataset.detail}`;
      confirmer.disabled = false;
    }
    function choisirType(v) {
      type = v; heure = null;
      types.forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.type === v)));
      placerCurseur(); jours();
    }
    types.forEach((b) => b.addEventListener('click', () => choisirType(b.dataset.type)));
    document.querySelectorAll('.l-lien[data-choix]').forEach((a) => a.addEventListener('click', () => { ok.hidden = true; choisirType(a.dataset.choix); }));
    confirmer.addEventListener('click', () => {
      if (!heure) return;
      const t = btnType(), j = JOURS[jour];
      okTexte.innerHTML = `<b>${j.nom.charAt(0).toUpperCase() + j.nom.slice(1)} à ${heure}</b>, ${t.dataset.nom.toLowerCase()} au cabinet du Phare. Un rappel vous sera envoyé la veille.`;
      ok.hidden = false;
      try { okTitre.focus({ preventScroll: true }); } catch (e) { /* rien */ }
    });
    $('#autre').addEventListener('click', () => { ok.hidden = true; heure = null; creneaux(); try { confirmer.focus({ preventScroll: true }); } catch (e) { /* rien */ } });
    addEventListener('resize', placerCurseur);
    jours();
    return { placer: placerCurseur };
  })();

  /* ------------------------------------------------------------------ l'interface pour casser.js */
  window.__lila = {
    /** Prépare le monde (compile le nuanceur) sans l'afficher. Renvoie true si WebGL est là. */
    preparer() {
      const r = initGL();
      // une première image, portail fermé, pour que le pilote compile vraiment le nuanceur maintenant (et pas à l'éclosion)
      if (r) { try { dimensionner(); mesurer(); const pr = port.r; port.r = 0.0001; dessinerGL(performance.now(), 0.5, 0.5, 0.01); port.r = pr; gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); } catch (e) { /* rien */ } }
      return r;
    },
    get gl() { return glOk; },
    /** Montre le monde (pendant l'éclosion ou tout de suite). */
    demarrer() {
      initGL();
      document.body.classList.add('monde-on');
      if (!actif) { actif = true; dimensionner(); mesurer(); relancer(); }
    },
    /** Le portail : rayon r (en pixels ; < 0 : plein écran), centre (pixels), lumière 0 à 1, k (0 à 1) : la perle gagne sa place. */
    portail(r, x, y, lum, k) {
      port.r = r < 0 ? -1 : r / H; port.cx = x / W; port.cy = 1 - y / H; port.lum = lum || 0;
      if (!port.orbe) port.orbe = { x: x / W, y: 1 - y / H, r: Math.max(0.02, (r / H) * 0.55) };
      port.k = clamp(k || 0, 0, 1);
      if (port.k >= 1) port.orbe = null;
    },
    /** L'arrivée du titre et des boutons, image par image (indépendante des animations CSS). */
    intro() {
      const els = [];
      for (const [sel, d, k] of INTRO) { const el = neuf.querySelector(sel); if (el) { el.style.transition = 'none'; els.push([el, d, k]); } }
      intro = { t0: 0, els };
      jouerIntro(performance.now());
    },
    /** Le site est là : apparitions, mesures. */
    ouvert() {
      port.r = -1; port.orbe = null; port.lum = 0;
      dimensionner(); mesurer(); observerVues(); surDefilement();
      resa.placer();
      requestAnimationFrame(() => { const p = document.querySelector('.l-types-curseur'); if (p) p.classList.add('pret'); });
      photoA = performance.now() + 1800;
    },
    /** Une image du site pour la vignette « après » de la fin (lue juste après un rendu). */
    vignette: () => vignette(performance.now()),
    get souffle() { return souffle.val; },
    stats: () => ({ photoA, vuFin, actif, raf, now: performance.now(), intro: !!intro, W, H, ECH, pix: cv.width * cv.height, glOk, cur: Object.assign({}, cur), encre }),
  };
  function vignette(now) {
      if (!glOk) return null;
      try {
        // toujours l'ouverture du site (le soir sur la mer), quel que soit l'endroit où l'on se trouve
        const P = PARTIES.haut.o, pr = port.r;
        port.r = -1;
        dessinerGL(now, 0.62, P.oy, P.or * 1.1, P);
        port.r = pr;
        const c = document.createElement('canvas'); c.width = 400; c.height = 300; const g = c.getContext('2d');
        const k = Math.max(400 / cv.width, 300 / cv.height);
        g.drawImage(cv, (400 - cv.width * k) / 2, (300 - cv.height * k) / 2, cv.width * k, cv.height * k);
        return c.toDataURL('image/jpeg', 0.84);
      } catch (e) { return null; }
  }
})();
