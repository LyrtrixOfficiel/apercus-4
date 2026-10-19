// Kazura v12, Expériences : « Le sable qui chante ».
// La plaque de Chladni (nuanceurs, grains en transform feedback) et le son viennent de l'univers Résonance des
// maquettes v3 (maquettes-v3/resonance/js/plaque.js et son.js), repris tels quels ; la scène autonome est en bas.

// Resonance : la plaque de Chladni. Des dizaines de milliers de grains de sable sur une plaque de metal :
// la ou la plaque vibre fort, ils sautent ; sur les lignes immobiles (les noeuds), ils se posent. Le dessin
// change avec la frequence, et la derniere figure ecrit le prenom : chaque grain recoit sa place dans les lettres.
// WebGL2 sans bibliotheque : les grains vivent sur le processeur graphique (transform feedback).
// La main ou le doigt agitent le sable la ou ils passent ; un toucher lance une onde circulaire.

const VS_PLEIN = `#version 300 es
in vec2 aPos; out vec2 vUv;
void main(){ vUv = aPos * .5 + .5; gl_Position = vec4(aPos, 0., 1.); }`;

const BRUIT = `
float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vbruit(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y); }
`;

// La plaque : metal brosse (ou papier, pour les palettes claires), lumiere douce.
const FS_FOND = `#version 300 es
precision highp float;
uniform vec3 uPlaque; uniform vec2 uRes; uniform float uClair, uT;
in vec2 vUv; out vec4 o;
${BRUIT}
void main(){
  vec2 px = vUv * uRes;
  float brosse = vbruit(vec2(px.x * .004, px.y * .9)) * .6 + vbruit(vec2(px.x * .02, px.y * 2.3)) * .4;
  float grain = hash(floor(px));
  vec3 c = uPlaque;
  float lum = smoothstep(1.25, 0., length((vUv - vec2(.28, .82)) * vec2(1., 1.3)));
  if (uClair > .5) {
    c *= .955 + .05 * grain + .03 * vbruit(px * .02);
    c *= .93 + .1 * lum;
  } else {
    c *= .78 + .38 * brosse;
    c += uPlaque * .9 * lum + vec3(.018) * lum;
    float reflet = exp(-pow((vUv.y - .62 + .25 * vUv.x) * 5.5, 2.)) * .06;
    c += vec3(reflet) * (.6 + .4 * brosse);
  }
  c *= 1. - .28 * pow(length(vUv - .5) * 1.25, 2.4);
  o = vec4(c, 1.);
}`;

// Mise a jour des grains (transform feedback).
const VS_MAJ = `#version 300 es
precision highp float;
precision highp int;
in vec2 aPos; in vec2 aInfo;
out vec2 vPos; out vec2 vInfo;
uniform float uT, uDt, uMix, uFin, uSaut, uDerive, uVie, uVite, uPart;
uniform vec3 uA, uB;
uniform vec4 uVue;   // xmin, ymin, xmax, ymax (coordonnees plaque visibles)
uniform vec2 uEchelle; // pixels par unite de plaque (x, y)
uniform highp sampler2D uCibles; uniform int uCote; // la place de chaque grain dans le prenom
uniform vec4 uMain;  // x, y (plaque), force, rayon (px)
uniform vec4 uOndes[4]; // x, y, t0, force
${BRUIT}
const float PI = 3.14159265;
float chl(vec3 m, vec2 p){ return cos(m.x * PI * p.x) * cos(m.y * PI * p.y) + m.z * cos(m.y * PI * p.x) * cos(m.x * PI * p.y); }
float agitation(vec2 p){ float f = mix(chl(uA, p), chl(uB, p), uMix); return clamp(abs(f) * .55, 0., 1.); }
float exterieur(vec2 p){
  vec2 dp = (p - uMain.xy) * uEchelle; float d = length(dp);
  float a = uMain.z * smoothstep(uMain.w, uMain.w * .2, d);
  for (int i = 0; i < 4; i++) {
    vec4 w = uOndes[i]; if (w.w <= 0.) continue;
    float age = uT - w.z; if (age < 0. || age > 3.5) continue;
    float R = age * 520., dd = length((p - w.xy) * uEchelle);
    a += w.w * exp(-pow((dd - R) / 46., 2.)) * exp(-age * .9);
  }
  return a;
}
void main(){
  vec2 p = aPos; float graine = aInfo.x;
  float ex = exterieur(p);
  vec2 r = vec2(hash(vec2(graine, uT * 1.37)), hash(vec2(uT * .71, graine * 3.1))) - .5;
  vec2 r2 = vec2(hash(vec2(graine * 7.7, uT)), hash(vec2(uT, graine * 5.3))) - .5;
  float energie;
  // la derniere figure : une part des grains court ecrire le prenom, les autres restent sur la figure, en fond
  if (uFin > 0. && hash(vec2(graine * 1.31, 4.7)) < uPart) {
    vec2 c = texelFetch(uCibles, ivec2(gl_VertexID % uCote, gl_VertexID / uCote), 0).xy;
    vec2 d = c - p; float L = length(d);
    float pas = uVite * uFin * uDt * (.7 + .6 * hash(vec2(graine, 9.9)));
    p += L > pas ? d / L * pas : d;
    // en route, le grain tremble un peu ; pose, il ne bouge plus (sauf si la main ou une onde le soulevent)
    p += r * (.0022 * smoothstep(0., .04, L) + ex * .05) * uDt * 60.;
    energie = clamp(smoothstep(0., .12, L) + ex, 0., 1.);
  } else {
    // les figures : le sable saute la ou la plaque vibre, glisse vers les noeuds et s'y pose
    float e = .0018;
    float a = agitation(p);
    vec2 g = vec2(agitation(p + vec2(e, 0.)) - agitation(p - vec2(e, 0.)), agitation(p + vec2(0., e)) - agitation(p - vec2(0., e))) / (2. * e);
    float bouge = smoothstep(.05, .14, a);
    float calme = 1. - .6 * uFin;
    p += -g / (length(g) + 1.6) * uDerive * a * (.015 + .985 * bouge) * uDt;
    p += r * (a * bouge * uSaut * calme + ex * .05) * uDt * 60.;
    p += r2 * uVie * .00035 * calme;
    energie = clamp(a * 1.5 + ex, 0., 1.);
  }
  // hors de la vue : le grain retombe ailleurs
  if (p.x < uVue.x - .02 || p.x > uVue.z + .02 || p.y < uVue.y - .02 || p.y > uVue.w + .02) {
    p = uVue.xy + (uVue.zw - uVue.xy) * vec2(hash(vec2(graine, uT)), hash(vec2(uT + 3.3, graine)));
  }
  vPos = p; vInfo = vec2(graine, mix(aInfo.y, energie, .2));
}`;
const FS_VIDE = `#version 300 es
precision highp float; out vec4 o; void main(){ o = vec4(0.); }`;

// Les grains a l'ecran : une ombre portee, puis le grain (chaque grain a sa taille et sa teinte).
const VS_GRAIN = `#version 300 es
precision highp float;
in vec2 aPos; in vec2 aInfo;
uniform vec4 uVue; uniform float uTaille, uOmbre; uniform vec2 uDecal;
out float vTeinte; out float vEnergie;
${BRUIT}
void main(){
  vec2 e = (aPos - uVue.xy) / (uVue.zw - uVue.xy);
  gl_Position = vec4(e * 2. - 1. + uDecal, 0., 1.);
  float h = hash(vec2(aInfo.x, 1.7));
  gl_PointSize = uTaille * (.55 + .9 * h * h) * (1. + aInfo.y * .25);
  vTeinte = hash(vec2(aInfo.x * 3.3, 9.1));
  vEnergie = aInfo.y;
}`;
const FS_GRAIN = `#version 300 es
precision highp float;
uniform vec3 uSable; uniform float uOmbre, uClair;
in float vTeinte; in float vEnergie; out vec4 o;
void main(){
  vec2 q = gl_PointCoord - .5; float r = length(q);
  float a = smoothstep(.5, .18, r);
  if (a < .01) discard;
  if (uOmbre > .5) { o = vec4(0., 0., 0., a * (uClair > .5 ? .12 : .5)); return; }
  float relief = uClair > .5 ? 1. : .78 + .45 * smoothstep(.35, -.2, q.x + q.y);
  vec3 c = uSable * (.72 + .5 * vTeinte) * relief;
  o = vec4(c, a * (.88 - .25 * vEnergie));
}`;

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);

function demarrerPlaque(toile, { petit = false, reduit = false } = {}) {
  const gl = toile.getContext('webgl2', { antialias: false, alpha: false, depth: false, stencil: false, premultipliedAlpha: false, powerPreference: 'high-performance' });
  if (!gl) return null;
  const compiler = (vs, fs, varyings) => {
    const p = gl.createProgram();
    for (const [t, src] of [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]]) {
      const s = gl.createShader(t); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(s)); return null; }
      gl.attachShader(p, s);
    }
    gl.bindAttribLocation(p, 0, 'aPos'); gl.bindAttribLocation(p, 1, 'aInfo');
    if (varyings) gl.transformFeedbackVaryings(p, varyings, gl.INTERLEAVED_ATTRIBS);
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) { console.warn(gl.getProgramInfoLog(p)); return null; }
    const u = {}; const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) { const a = gl.getActiveUniform(p, i); u[a.name.replace(/\[0\]$/, '')] = gl.getUniformLocation(p, a.name); }
    return { p, u };
  };
  const P = { fond: compiler(VS_PLEIN, FS_FOND), maj: compiler(VS_MAJ, FS_VIDE, ['vPos', 'vInfo']), grain: compiler(VS_GRAIN, FS_GRAIN) };
  if (Object.values(P).some((x) => !x)) return null;

  // triangle plein ecran
  const vaoPlein = gl.createVertexArray(); gl.bindVertexArray(vaoPlein);
  const vbPlein = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vbPlein);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const N = petit ? 38000 : 82000;
  const bufs = [gl.createBuffer(), gl.createBuffer()];
  const vaos = bufs.map((b) => {
    const v = gl.createVertexArray(); gl.bindVertexArray(v); gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 16, 0);
    gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 16, 8);
    return v;
  });
  gl.bindVertexArray(null);
  const tf = gl.createTransformFeedback();
  let lecture = 0;

  // les places des grains dans le prenom : une texture RG32F, un texel par grain (lue par gl_VertexID)
  const COTE = Math.ceil(Math.sqrt(N));
  const cibles = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, cibles);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RG32F, COTE, COTE, 0, gl.RG, gl.FLOAT, new Float32Array(COTE * COTE * 2));
  for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.NEAREST], [gl.TEXTURE_MAG_FILTER, gl.NEAREST], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
  let part = 0;

  let W = 1, H = 1, dpr = 1, vue = [0, 0, 1, 1], echelle = [1, 1];
  function semer() {
    const d = new Float32Array(N * 4);
    for (let i = 0; i < N; i++) {
      d[i * 4] = vue[0] + (vue[2] - vue[0]) * Math.random();
      d[i * 4 + 1] = vue[1] + (vue[3] - vue[1]) * Math.random();
      d[i * 4 + 2] = Math.random() * 1000; d[i * 4 + 3] = 1;
    }
    for (const b of bufs) { gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, d, gl.DYNAMIC_COPY); }
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }
  let seme = false;
  function taille(w, h) {
    W = Math.max(1, w); H = Math.max(1, h);
    dpr = Math.min(window.devicePixelRatio || 1, petit ? 2 : 1.75);
    toile.width = Math.round(W * dpr); toile.height = Math.round(H * dpr);
    const a = W / H, m = Math.min(a, 1);
    const ax = a / m, ay = 1 / m;
    vue = [.5 - ax / 2, .5 - ay / 2, .5 + ax / 2, .5 + ay / 2];
    echelle = [W / ax, H / ay];
    if (!seme) { semer(); seme = true; }
  }

  // Le texte final (prenom ou initiales) : on le dessine en traits etroits, puis chaque grain recoit un point
  // tire au hasard dans les lettres. Les lettres se remplissent de sable uniformement, comme une ligne nodale.
  function texte(mot, police) {
    const L = Math.min(640, Math.round(W * .8)), Hc = Math.max(2, Math.round(L * H / W));
    const cv = document.createElement('canvas'); cv.width = L; cv.height = Hc;
    const ctx = cv.getContext('2d', { willReadFrequently: true });
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, L, Hc);
    let fs = Hc * .4;
    const poser = () => { ctx.font = `400 ${fs}px ${police}`; if ('fontStretch' in ctx) ctx.fontStretch = 'condensed'; };
    poser();
    const larg = ctx.measureText(mot).width;
    if (larg > L * .84) { fs *= L * .84 / larg; poser(); }
    const m = ctx.measureText(mot);
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
    ctx.fillText(mot, L / 2, Hc * .46 + (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2);
    const px = ctx.getImageData(0, 0, L, Hc).data, pts = [];
    for (let y = 0; y < Hc; y++) for (let x = 0; x < L; x++) if (px[(y * L + x) * 4] > 140) pts.push(x, y);
    const n = pts.length / 2, d = new Float32Array(COTE * COTE * 2);
    for (let i = 0; i < N; i++) {
      const k = Math.floor(Math.random() * n) * 2;
      const ex = n ? (pts[k] + Math.random()) / L : Math.random(), ey = n ? 1 - (pts[k + 1] + Math.random()) / Hc : Math.random();
      d[i * 2] = vue[0] + ex * (vue[2] - vue[0]); d[i * 2 + 1] = vue[1] + ey * (vue[3] - vue[1]);
    }
    gl.bindTexture(gl.TEXTURE_2D, cibles);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RG32F, COTE, COTE, 0, gl.RG, gl.FLOAT, d);
    // autant de grains qu'il faut pour des lettres pleines, le reste dessine la figure en fond
    part = n ? Math.min(.8, Math.max(.45, n * 3.2 / N)) : 0;
  }

  let couleurs = null;
  function palette(c) {
    const plaque = hex(c.plaque), sable = hex(c.sable);
    couleurs = { plaque, sable, clair: (plaque[0] * .3 + plaque[1] * .59 + plaque[2] * .11) > .5 };
  }

  // La main, les ondes
  const main = { x: -9, y: -9, force: 0, cible: 0 };
  const ondes = [];
  const versPlaque = (x, y) => [vue[0] + (x / W) * (vue[2] - vue[0]), vue[1] + (1 - y / H) * (vue[3] - vue[1])];
  function toucher(x, y, appuye) { const [px, py] = versPlaque(x, y); main.x = px; main.y = py; main.cible = appuye ? 1 : .45; main.vu = performance.now(); }
  function onde(x, y, t, force = 1) { const [px, py] = versPlaque(x, y); ondes.push([px, py, t, force]); if (ondes.length > 4) ondes.shift(); }

  let tPrec = 0;
  function dessiner(t, etat) {
    if (!couleurs) return;
    const dt = Math.min(.05, tPrec ? t - tPrec : .016); tPrec = t;
    if (performance.now() - (main.vu || 0) > 260) main.cible = 0;
    main.force += (main.cible - main.force) * Math.min(1, dt * (main.cible > main.force ? 14 : 3));
    // 1. mise a jour
    gl.useProgram(P.maj.p);
    const u = P.maj.u;
    gl.uniform1f(u.uT, t); gl.uniform1f(u.uDt, dt);
    gl.uniform3fv(u.uA, etat.a); gl.uniform3fv(u.uB, etat.b); gl.uniform1f(u.uMix, etat.mix); gl.uniform1f(u.uFin, etat.fin);
    gl.uniform1f(u.uSaut, (reduit ? .0075 : .011) * (etat.saut ?? 1)); gl.uniform1f(u.uDerive, reduit ? .32 : .42); gl.uniform1f(u.uVie, reduit ? .4 : 1); gl.uniform1f(u.uVite, reduit ? .75 : 1.05);
    gl.uniform4f(u.uVue, ...vue); gl.uniform2f(u.uEchelle, ...echelle);
    gl.uniform4f(u.uMain, main.x, main.y, main.force * .55, petit ? 70 : 90);
    const o = new Float32Array(16);
    ondes.forEach((w, i) => o.set(w, i * 4));
    gl.uniform4fv(u.uOndes, o);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, cibles); gl.uniform1i(u.uCibles, 0); gl.uniform1i(u.uCote, COTE); gl.uniform1f(u.uPart, part);
    gl.bindVertexArray(vaos[lecture]);
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, tf);
    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, bufs[1 - lecture]);
    gl.enable(gl.RASTERIZER_DISCARD);
    gl.beginTransformFeedback(gl.POINTS); gl.drawArrays(gl.POINTS, 0, N); gl.endTransformFeedback();
    gl.disable(gl.RASTERIZER_DISCARD);
    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, null);
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
    lecture = 1 - lecture;
    // 2. la plaque
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, toile.width, toile.height);
    gl.useProgram(P.fond.p);
    gl.uniform3fv(P.fond.u.uPlaque, couleurs.plaque); gl.uniform2f(P.fond.u.uRes, toile.width, toile.height); gl.uniform1f(P.fond.u.uClair, couleurs.clair ? 1 : 0); gl.uniform1f(P.fond.u.uT, t);
    gl.bindVertexArray(vaoPlein); gl.drawArrays(gl.TRIANGLES, 0, 3);
    // 3. les grains : ombre puis grain
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(P.grain.p);
    const g = P.grain.u;
    gl.uniform4f(g.uVue, ...vue); gl.uniform3fv(g.uSable, couleurs.sable); gl.uniform1f(g.uClair, couleurs.clair ? 1 : 0);
    gl.uniform1f(g.uTaille, (petit ? 1.55 : 2.0) * dpr);
    gl.bindVertexArray(vaos[lecture]);
    gl.uniform1f(g.uOmbre, 1); gl.uniform2f(g.uDecal, 1.1 * dpr / toile.width * 2, -1.1 * dpr / toile.height * 2); gl.drawArrays(gl.POINTS, 0, N);
    gl.uniform1f(g.uOmbre, 0); gl.uniform2f(g.uDecal, 0, 0); gl.drawArrays(gl.POINTS, 0, N);
    gl.disable(gl.BLEND);
    gl.bindVertexArray(null);
  }

  return { taille, texte, palette, toucher, onde, dessiner, semer, perdu: (f) => toile.addEventListener('webglcontextlost', (e) => { e.preventDefault(); f(); }) };
}

// ---------------------------------------------------------------------------------------------
// Le son, synthétisé en direct (Web Audio), coupé par défaut. Aucun fichier audio. Bol tibétain : partiels
// inharmoniques qui battent doucement, longue extinction, petit choc du maillet (repris de resonance/js/son.js).
let ctx = null, sortie = null, sonOn = false;
function reverberation(c) {
  const duree = 3.2, n = Math.round(c.sampleRate * duree), b = c.createBuffer(2, n, c.sampleRate);
  for (let k = 0; k < 2; k++) { const d = b.getChannelData(k); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3.2); }
  const conv = c.createConvolver(); conv.buffer = b; return conv;
}
async function activerSon(oui) {
  sonOn = oui;
  if (!oui) { if (ctx) sortie.gain.setTargetAtTime(0, ctx.currentTime, .15); return true; }
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) { sonOn = false; return false; }
    ctx = new AC();
    sortie = ctx.createGain(); sortie.gain.value = 0;
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 3;
    const rev = reverberation(ctx), sec = ctx.createGain(), mouille = ctx.createGain();
    sec.gain.value = .8; mouille.gain.value = .32;
    sortie.connect(sec).connect(comp); sortie.connect(rev).connect(mouille).connect(comp);
    comp.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') await ctx.resume();
  sortie.gain.setTargetAtTime(.85, ctx.currentTime, .05);
  return true;
}
function partiel(f, amp, duree, t, battement = .6, attaque = .004) {
  for (const d of [-battement / 2, battement / 2]) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.value = f + d;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(amp / 2, t + attaque);
    g.gain.exponentialRampToValueAtTime(.0001, t + duree);
    o.connect(g).connect(sortie); o.start(t); o.stop(t + duree + .05);
  }
}
function bol(frequence = 196, force = .8) {
  if (!sonOn || !ctx) return;
  const t = ctx.currentTime + .01, a = .22 * force;
  [[1, 1, 9.5], [2.71, .55, 6.5], [5.15, .3, 4.2], [8.17, .16, 2.6], [11.9, .07, 1.4]].forEach(([r, k, d]) => partiel(frequence * r, a * k, d, t, .45 + r * .12));
  const n = Math.round(ctx.sampleRate * .04), b = ctx.createBuffer(1, n, ctx.sampleRate), x = b.getChannelData(0);
  for (let i = 0; i < n; i++) x[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2);
  const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  s.buffer = b; f.type = 'bandpass'; f.frequency.value = frequence * 6; f.Q.value = 1.4; g.gain.value = a * .5;
  s.connect(f).connect(g).connect(sortie); s.start(t);
}

// ---------------------------------------------------------------------------------------------
// La scène « Le sable qui chante » pour le module Expériences.
const NOTES = [
  { nom: 'Ré', f: 146.83, fig: [3, 5, 1] },
  { nom: 'Fa', f: 174.61, fig: [4, 7, -1] },
  { nom: 'Sol', f: 196, fig: [2, 6, 1] },
  { nom: 'La', f: 220, fig: [5, 3, -1] },
  { nom: 'Do', f: 261.63, fig: [6, 4, 1] },
];
const POLICE = '"Bricolage Grotesque", "Segoe UI", system-ui, sans-serif';
const COULEURS = { plaque: '#161c26', sable: '#e9c987' };
const lisse = (x) => x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);

export function demarrer(el, { reduit = false, mobile = false } = {}) {
  const petit = mobile || Math.min(innerWidth, innerHeight) < 600;
  el.classList.add('sb');
  el.innerHTML = `
    <canvas class="sb-plaque" aria-hidden="true"></canvas>
    <div class="sb-barre" role="group" aria-label="Les notes de la plaque">
      ${NOTES.map((n, i) => `<button type="button" class="sb-note" data-i="${i}" aria-pressed="${i === 0}">${n.nom}</button>`).join('')}
      <button type="button" class="sb-mot" aria-pressed="false">Bonjour</button>
      <button type="button" class="sb-son" aria-pressed="false"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z"/><path class="sb-onde" d="M15.5 9.2a4 4 0 0 1 0 5.6M18 6.8a7.5 7.5 0 0 1 0 10.4"/><path class="sb-barre-son" d="M16 9l5 6M21 9l-5 6"/></svg><span>Son coupé</span></button>
    </div>`;
  el.setAttribute('role', 'img');
  el.setAttribute('aria-label', 'Une plaque de métal couverte de sable doré : à chaque note, le sable dessine une figure de Chladni.');
  const toile = el.querySelector('.sb-plaque');
  const plaque = demarrerPlaque(toile, { petit, reduit });
  if (!plaque) { el.classList.remove('sb'); el.innerHTML = ''; return null; }
  plaque.palette(COULEURS);
  let L = 1, H = 1, motPret = false;
  const mesurer = () => { const r = el.getBoundingClientRect(); L = Math.max(1, r.width); H = Math.max(1, r.height); plaque.taille(L, H); if (motPret) plaque.texte('Bonjour', POLICE); };
  mesurer();
  (document.fonts?.load ? document.fonts.load(`400 120px ${POLICE}`).catch(() => {}) : Promise.resolve()).then(() => { motPret = true; plaque.texte('Bonjour', POLICE); });

  // La séquence : la plaque passe d'une figure à l'autre ; « Bonjour » fait écrire le sable
  let courant = NOTES[0].fig, depart = courant, cible = courant, tMix = 1, fin = 0, finCible = 0, note = 0, dernierGeste = performance.now();
  const boutons = [...el.querySelectorAll('.sb-note')], btnMot = el.querySelector('.sb-mot'), btnSon = el.querySelector('.sb-son');
  function jouer(i, { auto = false } = {}) {
    note = i;
    depart = tMix < 1 ? cible : courant; cible = NOTES[i].fig; tMix = 0; finCible = 0;
    boutons.forEach((b, k) => b.setAttribute('aria-pressed', String(k === i)));
    btnMot.setAttribute('aria-pressed', 'false');
    if (!auto) { dernierGeste = performance.now(); bol(NOTES[i].f, .7); }
  }
  function ecrire() {
    finCible = 1; dernierGeste = performance.now();
    boutons.forEach((b) => b.setAttribute('aria-pressed', 'false'));
    btnMot.setAttribute('aria-pressed', 'true');
    bol(NOTES[4].f, .55);
  }
  el.querySelector('.sb-barre').addEventListener('click', async (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.classList.contains('sb-note')) jouer(+b.dataset.i);
    else if (b === btnMot) ecrire();
    else if (b === btnSon) {
      const oui = !sonOn, ok = await activerSon(oui);
      const actif = oui && ok !== false;
      btnSon.setAttribute('aria-pressed', String(actif));
      btnSon.querySelector('span').textContent = actif ? 'Son activé' : 'Son coupé';
      if (actif) bol(NOTES[note].f, .5);
    }
  });

  // La main ou le doigt agitent le sable ; un toucher lance une onde
  let t0 = performance.now();
  const local = (e) => { const r = el.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  const surMouvement = (e) => { if (e.pointerType === 'mouse' || e.buttons) { const [x, y] = local(e); plaque.toucher(x, y, !!e.buttons); } };
  const surAppui = (e) => {
    if (e.target.closest('button')) return;
    const [x, y] = local(e);
    plaque.onde(x, y, (performance.now() - t0) / 1000, 1); plaque.toucher(x, y, true);
    dernierGeste = performance.now();
    bol(NOTES[note].f, .8);
  };
  el.addEventListener('pointermove', surMouvement, { passive: true });
  el.addEventListener('pointerdown', surAppui, { passive: true });

  // La boucle (en mouvement réduit : le sable saute moins haut, les figures changent plus lentement, rien n'est coupé)
  let id = 0, arrete = false, enPause = false, prec = 0, tAuto = 0;
  const dureeMix = reduit ? 2.6 : 1.8, pauseAuto = reduit ? 11000 : 8000;
  function boucle(m) {
    id = 0;
    if (arrete || enPause) return;
    const dt = prec ? Math.min(.05, (m - prec) / 1000) : .016; prec = m;
    if (tMix < 1) { tMix = Math.min(1, tMix + dt / dureeMix); if (tMix >= 1) courant = cible; }
    fin += (finCible - fin) * Math.min(1, dt * (finCible > fin ? .5 : 1.4));
    // sans geste depuis un moment, la plaque change d'elle-même de figure (sans son), sauf quand le mot est écrit
    if (finCible === 0 && m - dernierGeste > pauseAuto && m - tAuto > pauseAuto) { tAuto = m; jouer((note + 1) % NOTES.length, { auto: true }); }
    const souffle = reduit ? 0 : .03 * Math.sin(m / 1000 * .55) * (1 - fin);
    const mix = Math.max(0, Math.min(1, lisse(tMix) + (tMix >= 1 ? souffle : 0)));
    plaque.dessiner((m - t0) / 1000, { a: depart, b: cible, mix: tMix >= 1 ? 1 - Math.abs(souffle) : mix, fin: lisse(fin), saut: 1 });
    id = requestAnimationFrame(boucle);
  }
  id = requestAnimationFrame(boucle);

  const ro = new ResizeObserver(() => mesurer());
  ro.observe(el);
  plaque.perdu(() => { arrete = true; el.innerHTML = '<p class="xp-panne">La scène s’est interrompue. Choisissez-la de nouveau pour la relancer.</p>'; });

  return {
    pause(oui) { if (arrete) return; enPause = !!oui; if (!enPause && !id) { prec = 0; id = requestAnimationFrame(boucle); } },
    arreter() {
      arrete = true; cancelAnimationFrame(id); ro.disconnect();
      el.removeEventListener('pointermove', surMouvement); el.removeEventListener('pointerdown', surAppui);
      if (sonOn) activerSon(false);
      try { toile.getContext('webgl2')?.getExtension('WEBGL_lose_context')?.loseContext(); } catch {}
      el.classList.remove('sb'); el.removeAttribute('role'); el.removeAttribute('aria-label');
      el.replaceChildren();
    },
  };
}
