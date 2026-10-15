/* FLUIDE : le fond vivant. Un seul nuanceur plein ecran, sans bibliotheque.

   1. Un degrade maille : cinq points de couleur qui derivent lentement,
      melanges par distance inverse, dans un espace tordu par du bruit
      (deformation de domaine). Les couleurs suivent la section lue.
   2. Des gouttes molles (metaballes) : un champ de potentiel dont la surface
      est une goutte de verre. Elle refracte le degrade derriere elle, porte
      un reflet et une ombre douce. Les gouttes s'accrochent aux ancres de la
      page ([data-goutte]) avec des ressorts : quand on defile, elles se
      detachent, voyagent, fusionnent et se separent.

   Aucune image, aucune dependance : environ 9 Ko. */

const VS = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;

const FS = (octaves) => `
precision highp float;
uniform vec2 uRes; uniform float uT, uDpr;
uniform vec3 uC0, uC1, uC2, uC3, uC4;
uniform vec4 uB[8];
float h(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float n2(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h(i), h(i + vec2(1.0, 0.0)), f.x), mix(h(i + vec2(0.0, 1.0)), h(i + vec2(1.0, 1.0)), f.x), f.y);
}
float fbm(vec2 p) { float a = 0.5, s = 0.0; for (int i = 0; i < ${octaves}; i++) { s += a * n2(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; } return s; }
vec3 fond(vec2 uv) {
  float asp = uRes.x / uRes.y;
  vec2 p = vec2(uv.x * asp, uv.y);
  float t = uT * 0.03;
  vec2 w = vec2(fbm(p * 1.15 + vec2(t, -t)), fbm(p * 1.15 + vec2(4.3 - t, 1.7 + t * 0.7)));
  p += (w - 0.5) * 0.95;
  vec3 col = vec3(0.0); float ws = 0.0;
  for (int i = 0; i < 5; i++) {
    float fi = float(i);
    vec2 c = vec2((0.5 + 0.46 * sin(t * 1.3 + fi * 1.9)) * asp, 0.5 + 0.46 * cos(t * 1.05 + fi * 2.4));
    vec3 ci = i == 0 ? uC0 : (i == 1 ? uC1 : (i == 2 ? uC2 : (i == 3 ? uC3 : uC4)));
    float d = length(p - c);
    float wi = 1.0 / (d * d * 4.0 + 0.035);
    col += ci * wi; ws += wi;
  }
  col /= ws;
  col += 0.025 * sin(p.y * 3.2 + w.x * 5.0 + uT * 0.08);
  return col;
}
float champ(vec2 px, out vec2 g, out float reff) {
  float f = 0.0; g = vec2(0.0); float rs = 0.0;
  for (int i = 0; i < 8; i++) {
    vec4 b = uB[i];
    if (b.z < 0.5) continue;
    vec2 d = px - b.xy;
    float d2 = dot(d, d) + 1.0;
    float r2 = b.z * b.z;
    float k = r2 / d2;
    f += k; g += -2.0 * k * d / d2; rs += k * b.z;
  }
  reff = rs / max(f, 1e-4);
  return f;
}
void main() {
  vec2 px = gl_FragCoord.xy;
  vec2 uv = px / uRes;
  vec3 bg = fond(uv);
  vec2 g, gs; float reff, rs;
  float F = champ(px, g, reff);
  float Fs = champ(px + vec2(-6.0, 22.0) * uDpr, gs, rs);
  bg *= 1.0 - smoothstep(0.2, 1.1, Fs) * 0.13;
  vec3 col = bg;
  if (F > 0.6) {
    float gl = max(length(g), 1e-4);
    float a = clamp((F - 1.0) / gl + 0.5, 0.0, 1.0);
    float hh = sqrt(clamp(1.0 - 1.0 / max(F, 1e-3), 0.0, 1.0));
    vec2 gh = g / (F * F) / max(2.0 * hh, 0.06);
    vec3 n = normalize(vec3(-gh * reff, 1.0));
    /* La lentille : le degrade vu a travers la goutte, decale et un peu
       disperse (le rouge et le bleu ne se refractent pas au meme endroit). */
    vec2 o = n.xy * reff;
    vec3 refr = vec3(fond((px - o * 0.80) / uRes).r, fond((px - o * 0.92) / uRes).g, fond((px - o * 1.04) / uRes).b);
    float lum = dot(refr, vec3(0.299, 0.587, 0.114));
    refr = clamp(mix(vec3(lum), refr, 1.55) * 0.98, 0.0, 1.0);
    float fres = pow(1.0 - n.z, 2.0);
    vec3 L = normalize(vec3(-0.45, 0.62, 0.65));
    vec3 Hd = normalize(L + vec3(0.0, 0.0, 1.0));
    float nh = max(dot(n, Hd), 0.0);
    float spec = pow(nh, 260.0) * 1.2 + pow(nh, 22.0) * 0.06;
    vec2 dl = normalize(vec2(0.45, -0.62));
    float ln = length(n.xy);
    float caus = smoothstep(-0.2, 0.9, dot(n.xy / max(ln, 1e-3), dl)) * smoothstep(0.08, 0.55, ln) * smoothstep(0.05, 0.5, hh) * 0.1;
    vec3 irid = 0.5 + 0.5 * cos(6.2831 * (fres * 1.1 + vec3(0.0, 0.33, 0.67)));
    vec3 goutte = refr;
    goutte *= mix(0.78, 1.0, smoothstep(0.0, 0.32, hh));
    goutte = mix(goutte, goutte * vec3(0.78, 0.74, 1.0) + irid * 0.22, fres * 0.75);
    goutte += vec3(1.0, 0.97, 1.0) * (spec + caus);
    col = mix(bg, goutte, a);
  }
  col += (h(px + fract(uT)) - 0.5) / 160.0;
  gl_FragColor = vec4(col, 1.0);
}`;

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
export const PALETTES = {
  peche: ['#ffd8c6', '#e8dcff', '#c8e4ff', '#fff0d8', '#ffcadb'],
  menthe: ['#cdf4e2', '#d2eaff', '#e7e0ff', '#f3fad6', '#bdeeee'],
  lilas: ['#e1d8ff', '#cad5ff', '#ffdcef', '#d8f2ff', '#ece2ff'],
  beurre: ['#fff0c0', '#ffd8c8', '#f3e2ff', '#d6f4e6', '#ffe6b6'],
  rose: ['#ffd5e4', '#e9dcff', '#ffe8d4', '#d4e8ff', '#f6d8ff'],
  ciel: ['#cce8ff', '#d7f9ee', '#ffe0d2', '#e1daff', '#bce4ff']
};

export function demarrer({ toile, telephone, reduit }) {
  const gl = toile.getContext('webgl', { antialias: false, alpha: false, premultipliedAlpha: false, powerPreference: 'high-performance' });
  if (!gl) return null;
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS(telephone ? 3 : 4)));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = {};
  for (const n of ['uRes', 'uT', 'uDpr', 'uC0', 'uC1', 'uC2', 'uC3', 'uC4', 'uB']) U[n] = gl.getUniformLocation(prog, n);

  let dpr = Math.min(window.devicePixelRatio || 1, telephone ? 1.5 : 1.75);
  let W = 1, H = 1;
  function dimensionner() {
    W = innerWidth; H = toile.clientHeight || innerHeight;
    toile.width = Math.round(W * dpr); toile.height = Math.round(H * dpr);
    gl.viewport(0, 0, toile.width, toile.height);
  }
  dimensionner();
  addEventListener('resize', dimensionner);

  /* Les gouttes : huit ressorts (position et rayon). */
  const M = 8;
  const gouttes = Array.from({ length: M }, (_, i) => ({ x: W * 0.75, y: H * 0.4, r: 0, vx: 0, vy: 0, vr: 0, tx: W * 0.75, ty: H * 0.4, tr: 0 }));
  const ancres = () => [...document.querySelectorAll('[data-goutte]')];
  let liste = ancres();
  const mo = new MutationObserver(() => { liste = ancres(); secs = [...document.querySelectorAll('[data-teinte]')]; });
  mo.observe(document.getElementById('contenu'), { childList: true, subtree: true });

  /* Les couleurs : celles de la section lue, fondues avec la suivante. */
  let secs = [...document.querySelectorAll('[data-teinte]')];
  const RGB = Object.fromEntries(Object.entries(PALETTES).map(([k, v]) => [k, v.map(hex)]));
  const couleurs = Array.from({ length: 5 }, () => [1, 1, 1]);
  let premiere = true;
  function teintes(dt) {
    const s = secs;
    if (!s.length) return;
    const c = H * 0.5;
    let i = 0;
    s.forEach((el, k) => { if (el.getBoundingClientRect().top <= c) i = k; });
    const a = s[i], b = s[Math.min(i + 1, s.length - 1)];
    const ra = a.getBoundingClientRect();
    const f = Math.min(1, Math.max(0, (c - ra.top) / Math.max(1, ra.height)));
    const m = Math.max(0, (f - 0.6) / 0.4);
    const pa = RGB[a.dataset.teinte] || RGB.peche, pb = RGB[b.dataset.teinte] || pa;
    for (let k = 0; k < 5; k++) {
      const x = pa[k], y = pb[k];
      for (let j = 0; j < 3; j++) {
        const cible = x[j] + (y[j] - x[j]) * m * m * (3 - 2 * m);
        couleurs[k][j] = premiere ? cible : couleurs[k][j] + (cible - couleurs[k][j]) * (1 - Math.exp(-dt * 3));
      }
    }
    premiere = false;
  }

  function cibles() {
    const vis = [];
    liste.forEach((el, j) => {
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.bottom < -H * 0.15 || r.top > H * 1.15) return;
      const k = j % M;
      if (vis.some((v) => v.k === k)) return;
      vis.push({ k, x: r.left + r.width / 2, y: r.top + r.height / 2, r: (r.width / 2) * parseFloat(el.dataset.goutte || '1') });
    });
    for (let k = 0; k < M; k++) {
      const g = gouttes[k];
      const v = vis.find((a) => a.k === k);
      if (v) { g.tx = v.x; g.ty = v.y; g.tr = v.r; continue; }
      /* Sans ancre : la goutte rejoint la plus proche et s'y fond. */
      let best = null, bd = Infinity;
      for (const a of vis) { const d = (a.x - g.x) ** 2 + (a.y - g.y) ** 2; if (d < bd) { bd = d; best = a; } }
      if (best) { g.tx = best.x; g.ty = best.y; g.tr = 0; }
      else { g.tr = 0; }
    }
  }

  const tab = new Float32Array(M * 4);
  let t = 0, avant = performance.now(), visible = true;
  const frames = [];
  document.addEventListener('visibilitychange', () => { visible = !document.hidden; if (visible) { avant = performance.now(); requestAnimationFrame(boucle); } });

  function boucle(now) {
    if (!visible) return;
    const dt = Math.min(0.05, (now - avant) / 1000);
    avant = now;
    if (!reduit) t += dt;
    teintes(dt);
    cibles();
    for (const g of gouttes) {
      if (reduit) { g.x = g.tx; g.y = g.ty; g.r = g.tr; continue; }
      /* Un ressort un peu mou : la goutte depasse sa cible et revient. */
      const k = 120, c = 15, kr = 90, cr = 12;
      g.vx += (k * (g.tx - g.x) - c * g.vx) * dt; g.x += g.vx * dt;
      g.vy += (k * (g.ty - g.y) - c * g.vy) * dt; g.y += g.vy * dt;
      g.vr += (kr * (g.tr - g.r) - cr * g.vr) * dt; g.r = Math.max(0, g.r + g.vr * dt);
    }
    for (let k = 0; k < M; k++) {
      const g = gouttes[k];
      tab[k * 4] = g.x * dpr; tab[k * 4 + 1] = (H - g.y) * dpr; tab[k * 4 + 2] = g.r * dpr; tab[k * 4 + 3] = 0;
    }
    gl.uniform2f(U.uRes, toile.width, toile.height);
    gl.uniform1f(U.uT, t);
    gl.uniform1f(U.uDpr, dpr);
    couleurs.forEach((c, k) => gl.uniform3f(U['uC' + k], c[0], c[1], c[2]));
    gl.uniform4fv(U.uB, tab);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    /* Un appareil qui peine : on baisse la definition (mediane sur 90 images). */
    if (!reduit) {
      frames.push(dt);
      if (frames.length >= 90) {
        const med = frames.sort((a, b) => a - b)[45];
        frames.length = 0;
        if (med > 1 / 45 && dpr > 0.6) { dpr = Math.max(0.6, dpr - 0.25); dimensionner(); }
      }
    }
    requestAnimationFrame(boucle);
  }
  requestAnimationFrame((n) => { avant = n; boucle(n); });
  toile.addEventListener('webglcontextlost', (e) => { e.preventDefault(); document.documentElement.classList.add('sans-webgl'); });
  return { diagnostic: () => ({ dpr, W, H, gouttes: gouttes.map((g) => [Math.round(g.x), Math.round(g.y), Math.round(g.r)]) }) };
}
