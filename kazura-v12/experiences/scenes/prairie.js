// Kazura v12, Expériences : « La prairie ».
// Le moteur de la prairie (nuanceurs, semis, caméra) vient de l'univers Nature des maquettes v3
// (maquettes-v3/nature/js/prairie.js), repris tel quel ; la scène autonome est en bas du fichier.

// La prairie : des milliers de brins d'herbe et des fleurs des champs, en WebGL2.
// Chaque brin est un ruban courbe instancie ; le vent, les rafales qui balaient le
// champ, la main qui ecarte les herbes (et le sillage qu'elle laisse, qui se referme
// en douceur) et l'onde d'un toucher sont calcules dans le shader.
// Les couleurs et les especes de fleurs viennent de la palette (js/univers.js).

const COMMUN = `
uniform mat4 uVP;
uniform float uT, uVent, uPousse, uAsp, uDoux;
uniform vec4 uTrace[8];  // main et sillage : x, y (ndc), force, rayon
uniform vec4 uOnde;      // toucher : x, y (ndc), age (s), force
uniform vec3 uCam;

vec2 souffle(vec3 b, float ph){
  float r = sin(b.x * .23 + b.z * .31 - uT * 1.05) * .5 + .5; r = r * r * r;
  float w = sin(uT * 1.9 + b.x * 1.7 + b.z * 1.1 + ph) * .06 + sin(uT * .8 + b.x * .5 + ph * .3) * .1;
  float s = (w + r * .42 * uVent) * uDoux + .08 * uVent;
  return vec2(s, -s * .35);
}
vec2 poussee(vec3 b, float h){
  vec4 c = uVP * vec4(b + vec3(0., h * .6, 0.), 1.);
  vec2 n = c.xy / c.w;
  vec2 r = vec2(0.);
  for (int k = 0; k < 8; k++) {
    vec4 m = uTrace[k];
    if (m.z < .003) continue;
    vec2 d = (n - m.xy) * vec2(uAsp, 1.);
    float f = exp(-dot(d, d) / (m.w * m.w)) * m.z;
    r += vec2(sign(d.x) * f * 1.25, -f * .3);
  }
  vec2 e = (n - uOnde.xy) * vec2(uAsp, 1.);
  float age = uOnde.z, dist = length(e);
  float anneau = exp(-pow((dist - age * 1.15) * 6., 2.)) * exp(-age * 1.1) * uOnde.w;
  r += vec2(sign(e.x) * anneau * 1.5, -anneau * .4);
  return r;
}
vec3 courbe(vec3 b, float h, float t, vec2 i){
  float tt = t * t;
  return b + vec3(i.x * h * tt, h * t * (1. - .22 * min(dot(i, i), 2.) * tt), i.y * h * tt);
}
`;

const V_HERBE = `#version 300 es
precision highp float;
layout(location=0) in vec2 aV;
layout(location=1) in vec4 aBase;   // x, z, hauteur, largeur
layout(location=2) in vec4 aParam;  // rotation, inclinaison x, inclinaison z, phase
layout(location=3) in vec4 aTeinte; // jaune, clarte, retard, genre (0 herbe, 1 tige de fleur)
${COMMUN}
uniform vec3 uJaune;
out float vT, vCote, vDist, vReflet, vGenre; out vec3 vTeinte;
void main(){
  float pousse = smoothstep(aTeinte.z, aTeinte.z + .38, uPousse);
  float h = aBase.z * pousse;
  vec3 b = vec3(aBase.x, 0., aBase.y);
  vec2 s = souffle(b, aParam.w);
  vec2 i = aParam.yz + s + poussee(b, h);
  float t = aV.x;
  vec3 p = courbe(b, h, t, i);
  float w = aBase.w * (1. - pow(t, 1.35)) * (.35 + .65 * pousse);
  p += vec3(cos(aParam.x), 0., sin(aParam.x)) * w * aV.y;
  gl_Position = uVP * vec4(p, 1.);
  vT = t; vCote = aV.y; vDist = length(p - uCam); vReflet = clamp(s.x * 2.2, 0., 1.); vGenre = aTeinte.w;
  vTeinte = mix(vec3(1.), uJaune, aTeinte.x) * aTeinte.y;
}`;

const F_HERBE = `#version 300 es
precision mediump float;
in float vT, vCote, vDist, vReflet, vGenre; in vec3 vTeinte;
uniform vec3 uBrume, uReflet;
uniform vec3 uHerbe[3], uTige[2];
out vec4 o;
void main(){
  vec3 bas = uHerbe[0], milieu = uHerbe[1], pointe = uHerbe[2];
  if (vGenre > .5) { milieu = uTige[0]; pointe = uTige[1]; }
  vec3 c = mix(bas, milieu, smoothstep(0., .45, vT));
  c = mix(c, pointe, smoothstep(.4, 1., vT));
  c *= vTeinte;
  c *= .84 + .16 * vCote;
  c += uReflet * pow(vT, 2.6) * .2;
  c += vReflet * uReflet * vec3(.16, .2, .14) * vT;
  float brume = smoothstep(3.5, 26., vDist);
  c = mix(c, uBrume, brume * .9);
  float a = 1. - smoothstep(20., 33., vDist);
  o = vec4(c * a, a);
}`;

const V_FLEUR = `#version 300 es
precision highp float;
layout(location=0) in vec2 aQ;
layout(location=1) in vec4 aBase;
layout(location=2) in vec4 aParam;
layout(location=3) in vec4 aFleur;  // genre, taille, retard de la tige, variante
${COMMUN}
uniform vec3 uDroite, uHaut;
out vec2 vUv; out float vGenre, vVar, vDist, vRot;
void main(){
  float tige = smoothstep(aFleur.z, aFleur.z + .38, uPousse);
  float eclot = smoothstep(aFleur.z + .3, aFleur.z + .62, uPousse);
  vec3 b = vec3(aBase.x, 0., aBase.y);
  float h = aBase.z * tige;
  vec2 i = aParam.yz + souffle(b, aParam.w) + poussee(b, h);
  vec3 p = courbe(b, h, 1., i);
  float s = aFleur.y * eclot;
  if (aFleur.x > 3.5) p += uDroite * aQ.x * s * .34 + uHaut * (aQ.y + 1.) * s * 1.55; // epis : en hauteur, poses sur la tige
  else p += uDroite * aQ.x * s + uHaut * (aQ.y * .62 + .1) * s;
  gl_Position = uVP * vec4(p, 1.);
  vUv = aQ; vGenre = aFleur.x; vVar = aFleur.w; vDist = length(p - uCam); vRot = aParam.x;
}`;

const F_FLEUR = `#version 300 es
precision mediump float;
in vec2 vUv; in float vGenre, vVar, vDist, vRot;
uniform vec3 uBrume;
uniform vec3 uFc[6], uFc2[6], uFk[6];
out vec4 o;
void main(){
  int g = int(vGenre + .5);
  vec3 c1 = uFc[g], c2 = uFc2[g], ck = uFk[g];
  float alpha; vec3 c;
  if (g >= 4) {
    float y = vUv.y * .5 + .5, aa = fwidth(vUv.x) * 1.5 + .02;
    if (g == 4) { // epi de lavande : de petites fleurs serrees qui s'affinent vers le haut
      float bouts = .5 + .5 * sin(y * 30. + vVar * 6.);
      float w = (.55 + .35 * bouts) * (1. - .45 * y) * smoothstep(0., .1, y) * smoothstep(1., .82, y);
      alpha = 1. - smoothstep(w - aa, w + aa, abs(vUv.x));
      c = mix(c2, c1, bouts) * (.72 + .38 * y);
    } else { // epi de ble : grains en chevrons, barbes fines
      float w = .5 * pow(max(0., sin(3.1416 * min(1., y / .84))), .6);
      float corps = 1. - smoothstep(w - aa, w + aa, abs(vUv.x));
      float barbes = 0.;
      for (int k = -1; k <= 1; k++) barbes = max(barbes, (1. - smoothstep(0., .07, abs(vUv.x - float(k) * .5 * max(0., y - .55)))) * step(.55, y));
      alpha = max(corps, barbes * .75);
      float chevron = fract(y * 8. + abs(vUv.x) * 1.6);
      c = mix(c2, c1, smoothstep(.15, .85, chevron)) * (.78 + .3 * y);
      c = mix(c, ck, (1. - corps) * .6);
    }
    if (alpha < .01) discard;
  } else {
    float r = length(vUv), a = atan(vUv.y, vUv.x) + vRot;
    float bord, rc;
    if (g == 0) { bord = .5 + .45 * pow(abs(cos(a * 6.5)), .45); c = mix(c1, c2, vVar); rc = .24; }        // marguerite
    else if (g == 1) { bord = .72 + .26 * cos(a * 5.); c = c1; rc = .2; }                                   // bouton d'or
    else if (g == 2) { bord = .74 + .24 * cos(a * 4. + .6); c = mix(c1, c2, vVar); rc = .17; }              // coquelicot
    else { bord = (.58 + .4 * pow(abs(cos(a * 4.)), .3)) * (.88 + .12 * cos(a * 26.)); c = mix(c1, c2, vVar); rc = .18; } // bleuet
    float aa = fwidth(r) * 1.3 + .01;
    alpha = 1. - smoothstep(bord - aa, bord + aa, r);
    if (alpha < .01) discard;
    c *= .74 + .3 * smoothstep(0., .8, r) - .1 * smoothstep(.6, 1., r);
    c *= .92 + .08 * cos(a * 26.);
    c = mix(ck, c, smoothstep(rc - aa, rc + aa, r));
  }
  float brume = smoothstep(3.5, 26., vDist);
  c = mix(c, uBrume, brume * .85);
  alpha *= 1. - smoothstep(20., 33., vDist);
  o = vec4(c * alpha, alpha);
}`;

const V_SOL = `#version 300 es
precision highp float;
layout(location=0) in vec2 aP;
uniform mat4 uVP; uniform vec3 uCam;
out vec3 vP;
void main(){ vec3 p = vec3(aP.x * 60., 0., -aP.y * 40. + 1.5); vP = p; gl_Position = uVP * vec4(p, 1.); }`;

const F_SOL = `#version 300 es
precision mediump float;
in vec3 vP; uniform vec3 uBrume, uCam; uniform vec3 uSol[2];
out vec4 o;
float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
void main(){
  float d = length(vP - uCam);
  vec3 c = mix(uSol[0], uSol[1], n(vP.xz * .7));
  c = mix(c, uBrume, smoothstep(3., 26., d) * .92);
  float a = 1. - smoothstep(22., 34., d);
  o = vec4(c * a, a);
}`;

// Compilation sans bloquer la page : les nuanceurs partent, et on ne lit leur etat qu'une fois prets
// (KHR_parallel_shader_compile). Lire l'etat tout de suite obligeait la page a attendre la compilation
// (pendant le chargement, et au milieu du defilement pour la seconde prairie, au pied du contact).
function lancer(gl, vs, fs) {
  const p = gl.createProgram(), sh = [];
  for (const [type, src] of [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]]) { const x = gl.createShader(type); gl.shaderSource(x, src); gl.compileShader(x); gl.attachShader(p, x); sh.push(x); }
  gl.linkProgram(p);
  return { p, sh };
}
function finir(gl, { p, sh }) {
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(sh.map((x) => gl.getShaderInfoLog(x)).join(' ') + gl.getProgramInfoLog(p));
  const u = {}; const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < n; i++) { const nom = gl.getActiveUniform(p, i).name.replace(/\[0\]$/, ''); u[nom] = gl.getUniformLocation(p, nom); }
  return { p, u };
}

function hasard(s) { return () => { s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// Matrices (colonnes, a la maniere de WebGL)
function perspective(fovy, asp, near, far) {
  const f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
  return [f / asp, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0];
}
function multiplier(a, b) {
  const o = new Array(16);
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) { let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k]; o[c * 4 + r] = s; }
  return o;
}
const TAILLE_FLEUR = { 0: .044, 1: .03, 2: .052, 3: .036, 4: .05, 5: .05 };

function demarrerPrairie(canvas, { petit, seed = 1, palette }) {
  let gl = null;
  try { gl = canvas.getContext('webgl2', { antialias: true, alpha: true, premultipliedAlpha: true, powerPreference: 'high-performance' }); } catch {}
  if (!gl) return null;
  let progH, progF, progS, compile = false, echec = false;
  const ext = gl.getExtension('KHR_parallel_shader_compile');
  const bruts = [lancer(gl, V_HERBE, F_HERBE), lancer(gl, V_FLEUR, F_FLEUR), lancer(gl, V_SOL, F_SOL)];
  function verifier() {
    if (compile || echec) return compile;
    if (ext && !bruts.every((b) => gl.getProgramParameter(b.p, ext.COMPLETION_STATUS_KHR))) return false;
    try { [progH, progF, progS] = bruts.map((b) => finir(gl, b)); compile = true; }
    catch (e) { console.warn(e); echec = true; canvas.dispatchEvent(new Event('prairie-echec')); }
    return compile;
  }
  const G = palette.gl;
  const plat = (l) => new Float32Array(l.flat());
  const couleursFleurs = [0, 1, 2].map((k) => plat([0, 1, 2, 3, 4, 5].map((g) => G.couleurs[g][k])));

  // Geometrie d'un brin : 7 niveaux, deux sommets par niveau.
  const NIV = 7, brin = [];
  for (let i = 0; i < NIV; i++) { const t = i / (NIV - 1); brin.push(t, -1, t, 1); }
  const vaoH = gl.createVertexArray(), vaoF = gl.createVertexArray(), vaoS = gl.createVertexArray();
  const tampon = (data) => { const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW); return b; };
  const bBrin = tampon(new Float32Array(brin));
  const bQuad = tampon(new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]));
  const bSol = tampon(new Float32Array([-1, 0, 1, 0, -1, 1, 1, 1]));
  gl.bindVertexArray(vaoS); gl.bindBuffer(gl.ARRAY_BUFFER, bSol); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const bInstH = gl.createBuffer(), bInstF = gl.createBuffer(); let nH = 0, nF = 0;

  function lier(vao, geo, inst) {
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, geo); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, inst);
    for (let k = 1; k <= 3; k++) { gl.enableVertexAttribArray(k); gl.vertexAttribPointer(k, 4, gl.FLOAT, false, 48, (k - 1) * 16); gl.vertexAttribDivisor(k, 1); }
    gl.bindVertexArray(null);
  }

  // Camera et semis, recalcules quand la forme du cadre change.
  const FOV = 32 * Math.PI / 180, CAMY = .62;
  let horizon = .6, asp = 1, VP = null, droite = [1, 0, 0], haut = [0, 1, 0], cam = [0, CAMY, 0], dollyZ = 0;
  function camera() {
    const ndc = 1 - 2 * horizon;
    const tilt = Math.atan(-ndc * Math.tan(FOV / 2)); // positif : on regarde un peu vers le haut
    cam = [0, CAMY, -dollyZ];
    const fw = [0, Math.sin(tilt), -Math.cos(tilt)]; droite = [1, 0, 0]; haut = [0, Math.cos(tilt), Math.sin(tilt)];
    const V = [droite[0], haut[0], -fw[0], 0, droite[1], haut[1], -fw[1], 0, droite[2], haut[2], -fw[2], 0,
      -(droite[0] * cam[0] + droite[1] * cam[1] + droite[2] * cam[2]), -(haut[0] * cam[0] + haut[1] * cam[1] + haut[2] * cam[2]), (fw[0] * cam[0] + fw[1] * cam[1] + fw[2] * cam[2]), 1];
    VP = multiplier(perspective(FOV, asp, .05, 60), V);
  }

  // Tirage d'un genre de fleur selon les parts de la palette.
  const genres = G.fleurs, total = genres.reduce((s, [, p]) => s + p, 0);
  const tirer = (u) => { let a = u * total; for (const [g, p] of genres) { if ((a -= p) <= 0) return g; } return genres[0][0]; };

  function semer() {
    const r = hasard(seed), tanH = Math.tan(FOV / 2) * asp;
    // distance du sol visible en bas du cadre : on seme un peu avant, sinon une bande de terre nue apparait
    const tilt = Math.atan(-(1 - 2 * horizon) * Math.tan(FOV / 2)), bas = FOV / 2 - tilt;
    const D0 = Math.max(.9, Math.min(2, CAMY / Math.tan(Math.max(.05, bas)) - .5));
    const N = Math.round((petit ? 5200 : 14000) * Math.min(1.25, Math.max(.7, asp / 1.6)));
    const herbes = [], fleurs = [];
    const portrait = asp < 1;
    for (let i = 0; i < N; i++) {
      const D = D0 + (36 - D0) * Math.pow(r(), 1.9);
      const lim = D * tanH + .4, x = (r() * 2 - 1) * lim, ex = Math.abs(x) / lim;
      let h = (.2 + .3 * r()) * (D < 3.5 ? .85 : 1);
      if (!portrait && ex > .72 && D < 6 && r() < .4) h *= 1.3 + r() * .65; // grandes herbes qui cadrent l'image sur les bords
      if (portrait && ex > .78 && D < 4 && r() < .4) h *= 1.3 + r() * .5;
      const w = (.012 + r() * .016) * (D < 3 ? .8 : 1) * (1 + D * .02);
      const retard = .05 + .45 * ex + .25 * (D / 36) + r() * .15;
      herbes.push([x, -D, h, w, r() * Math.PI, (r() - .5) * .5, (r() - .5) * .3, r() * 6.28, r() < .3 ? r() : r() * .25, .86 + r() * .3, retard, 0]);
    }
    // Fleurs des champs, en touffes (les epis de lavande en rangs plus denses)
    const NF = Math.round((petit ? 140 : 320) * (genres[0][0] === 4 ? 1.6 : 1)), touffes = [];
    for (let k = 0; k < (petit ? 14 : 26); k++) {
      const D = 2.8 + 14 * Math.pow(r(), 1.25), lim = D * tanH;
      touffes.push({ D, x: (r() * 2 - 1) * lim, genre: tirer(r()), R: .5 + D * .12 });
    }
    for (let i = 0; i < NF; i++) {
      const tf = touffes[i % touffes.length];
      const D = Math.max(2.4, tf.D + (r() - .5) * tf.R * 1.4);
      const lim = D * tanH, x = tf.x + (r() - .5) * tf.R * 2.4, ex = Math.min(1, Math.abs(x) / (lim + .01));
      const genre = r() < .8 ? tf.genre : tirer(r());
      const epi = genre >= 4;
      const h = Math.min(CAMY - .04, (epi ? .3 : .34) + r() * .22);
      const incl = [(r() - .5) * .3, (r() - .5) * .2], ph = r() * 6.28;
      const retard = .25 + .35 * ex + r() * .2;
      herbes.push([x, -D, h, .007, r() * Math.PI, incl[0], incl[1], ph, .1, .9, retard, 1]);
      fleurs.push([x, -D, h, 0, r() * 6.28, incl[0], incl[1], ph, genre, TAILLE_FLEUR[genre] * (.75 + r() * .55), retard, r()]);
    }
    // Du plus loin au plus proche : la transparence de la brume se compose dans le bon ordre.
    herbes.sort((a, b) => a[1] - b[1]); fleurs.sort((a, b) => a[1] - b[1]);
    const H = new Float32Array(herbes.length * 12); herbes.forEach((v, i) => H.set(v, i * 12));
    const F = new Float32Array(fleurs.length * 12); fleurs.forEach((v, i) => F.set(v, i * 12));
    gl.bindBuffer(gl.ARRAY_BUFFER, bInstH); gl.bufferData(gl.ARRAY_BUFFER, H, gl.STATIC_DRAW); nH = herbes.length;
    gl.bindBuffer(gl.ARRAY_BUFFER, bInstF); gl.bufferData(gl.ARRAY_BUFFER, F, gl.STATIC_DRAW); nF = fleurs.length;
    lier(vaoH, bBrin, bInstH); lier(vaoF, bQuad, bInstF);
  }

  let aspSeme = 0, horizonSeme = 0, qualite = 1;
  function taille(h) {
    if (h != null) horizon = h;
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width)), ht = Math.max(1, Math.round(rect.height));
    const dpr = Math.min(devicePixelRatio || 1, petit ? 1.5 : 1.75) * qualite;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(ht * dpr);
    asp = w / ht;
    gl.viewport(0, 0, canvas.width, canvas.height);
    if (!aspSeme || Math.abs(Math.log(asp / aspSeme)) > .25 || h != null && Math.abs(h - horizonSeme) > .05) { aspSeme = asp; horizonSeme = horizon; semer(); }
    camera();
  }

  let cumul = 0, nb = 0, dernier = 0;
  const vec3s = (l) => new Float32Array(l.flat());
  const U = { herbe: vec3s(G.herbe), tige: vec3s(G.tige), sol: vec3s(G.sol) };
  function dessiner(t, etat) {
    if (!verifier()) return;
    dollyZ = etat.dolly || 0; camera();
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST); gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    const communs = (P) => {
      gl.useProgram(P.p);
      const u = P.u;
      gl.uniformMatrix4fv(u.uVP, false, VP);
      if (u.uT) gl.uniform1f(u.uT, t);
      if (u.uVent) gl.uniform1f(u.uVent, etat.vent);
      if (u.uDoux) gl.uniform1f(u.uDoux, etat.doux);
      if (u.uPousse) gl.uniform1f(u.uPousse, etat.pousse);
      if (u.uAsp) gl.uniform1f(u.uAsp, asp);
      if (u.uTrace) gl.uniform4fv(u.uTrace, etat.trace);
      if (u.uOnde) gl.uniform4f(u.uOnde, etat.onde[0], etat.onde[1], etat.onde[2], etat.onde[3]);
      if (u.uCam) gl.uniform3f(u.uCam, cam[0], cam[1], cam[2]);
      if (u.uBrume) gl.uniform3fv(u.uBrume, G.brume);
      if (u.uJaune) gl.uniform3fv(u.uJaune, G.jaune);
      if (u.uReflet) gl.uniform3fv(u.uReflet, G.reflet);
      if (u.uHerbe) gl.uniform3fv(u.uHerbe, U.herbe);
      if (u.uTige) gl.uniform3fv(u.uTige, U.tige);
      if (u.uSol) gl.uniform3fv(u.uSol, U.sol);
      if (u.uFc) { gl.uniform3fv(u.uFc, couleursFleurs[0]); gl.uniform3fv(u.uFc2, couleursFleurs[1]); gl.uniform3fv(u.uFk, couleursFleurs[2]); }
    };
    communs(progS); gl.bindVertexArray(vaoS); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    communs(progH); gl.bindVertexArray(vaoH); gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, NIV * 2, nH);
    communs(progF); gl.uniform3f(progF.u.uDroite, droite[0], droite[1], droite[2]); gl.uniform3f(progF.u.uHaut, haut[0], haut[1], haut[2]);
    gl.bindVertexArray(vaoF); gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, nF);
    gl.bindVertexArray(null);
    // si les images ralentissent, on baisse la definition
    const m = performance.now();
    if (dernier && m - dernier < 100) { cumul += m - dernier; nb++; }
    dernier = m;
    if (nb === 90) { if (cumul / nb > 22 && qualite > .55 && !window.__bride) { qualite *= .8; taille(); } cumul = 0; nb = 0; }
  }
  // Pret quand les shaders sont compiles (sans bloquer : on regarde a chaque image) et qu'une premiere image est rendue.
  let attente = null;
  const pret = () => attente || (attente = new Promise((ok) => {
    const t0 = performance.now();
    const voir = () => { if (verifier() || echec || performance.now() - t0 > 8000) { try { gl.finish(); } catch {} requestAnimationFrame(() => ok()); } else requestAnimationFrame(voir); };
    voir();
  }));
  return { dessiner, taille, pret, get horizon() { return horizon; } };
}

// ---------------------------------------------------------------------------------------------
// La scène « La prairie » pour le module Expériences : un champ dans un cadre, le jour ou le soir.

const PALETTES = {
  soir: {
    ciel: 'linear-gradient(180deg, #05061a 0%, #0f0b2e 26%, #241a55 50%, #3d2c7a 70%, #5a4196 88%, #5c4299 100%)',
    astre: 'radial-gradient(circle at 50% 50%, rgba(255, 246, 222, 1) 0 7%, rgba(233, 201, 135, .55) 9%, rgba(168, 140, 255, .22) 24%, rgba(110, 231, 183, .06) 42%, transparent 62%)',
    gl: {
      herbe: [[.008, .03, .035], [.03, .15, .13], [.2, .5, .4]], tige: [[.03, .1, .09], [.1, .26, .22]],
      sol: [[.01, .02, .04], [.03, .05, .08]], brume: [.36, .26, .6], jaune: [1.25, 1.12, .9], reflet: [.62, .55, 1],
      fleurs: [[0, .42], [3, .3], [4, .28]],
      couleurs: { 0: [[.98, .9, .72], [.92, .86, .8], [.9, .66, .28]], 1: [[.95, .78, .4], [.95, .8, .45], [.8, .55, .2]], 2: [[.7, .16, .3], [.8, .24, .36], [.1, .05, .08]], 3: [[.55, .42, 1], [.66, .48, .98], [.3, .2, .6]], 4: [[.6, .46, .98], [.72, .58, 1], [.4, .3, .72]], 5: [[.92, .78, .5], [.85, .7, .4], [.6, .45, .25]] },
      pollen: ['rgba(255,246,214,1)', 'rgba(233,201,135,.85)', 'rgba(233,201,135,.18)'], lucioles: true,
    },
  },
  jour: {
    ciel: 'linear-gradient(180deg, #fbf5e1 0%, #f8f2e0 38%, #eef1dc 56%, #e5edd5 72%, #e2ead2 100%)',
    astre: 'radial-gradient(circle at 50% 50%, rgba(255, 252, 236, 1) 0 6%, rgba(255, 236, 170, .7) 12%, rgba(255, 232, 160, .3) 30%, transparent 62%)',
    gl: {
      herbe: [[.09, .2, .1], [.25, .47, .19], [.6, .77, .38]], tige: [[.24, .42, .18], [.36, .56, .24]],
      sol: [[.16, .3, .12], [.27, .44, .17]], brume: [.9, .925, .84], jaune: [1.22, 1.06, .62], reflet: [1, .9, .55],
      fleurs: [[0, .42], [1, .2], [3, .16], [2, .22]],
      couleurs: { 0: [[1, .99, .95], [1, .9, .93], [.98, .76, .18]], 1: [[.99, .82, .2], [.99, .86, .3], [.9, .62, .1]], 2: [[.86, .22, .16], [.93, .36, .22], [.14, .09, .09]], 3: [[.35, .45, .92], [.55, .42, .9], [.3, .22, .55]], 4: [[.55, .45, .85], [.62, .5, .9], [.4, .3, .65]], 5: [[.92, .78, .45], [.85, .7, .38], [.7, .55, .25]] },
      pollen: ['rgba(255,244,200,1)', 'rgba(232,178,64,.9)', 'rgba(236,184,80,.22)'], lucioles: false,
    },
  },
};

// Pollens (ou lucioles, le soir), dans le cadre seulement. Ils s'écartent au passage de la main et s'envolent au toucher.
function demarrerPollens(canvas, { petit, reduit, palette }) {
  const g = canvas.getContext('2d');
  const G = palette.gl, lucioles = !!G.lucioles;
  let W = 0, H = 0;
  const grain = document.createElement('canvas'); grain.width = grain.height = 32;
  { const c = grain.getContext('2d'), d = c.createRadialGradient(16, 16, 0, 16, 16, 16);
    d.addColorStop(0, G.pollen[0]); d.addColorStop(.22, G.pollen[1]); d.addColorStop(.55, G.pollen[2]); d.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = d; c.fillRect(0, 0, 32, 32); }
  const p = [], lent = reduit ? .45 : 1;
  const nouveau = (partout) => ({ x: Math.random() * W, y: partout ? Math.random() * H : H + 10, vx: 0, vy: 0, r: (lucioles ? 5 : 3) + Math.pow(Math.random(), 2.5) * 9, ph: Math.random() * 6.28, v: .15 + Math.random() * .35, z: .4 + Math.random() * .6 });
  function taille() {
    const r = canvas.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.round((petit ? 26 : 46) * (lucioles ? .9 : 1) * Math.min(1.4, W * H / (900 * 560)));
    while (p.length < n) p.push(nouveau(true));
    p.length = n;
  }
  taille();
  let precedent = 0;
  function image(m, main, souffles) {
    const dt = precedent ? Math.min(3, (m - precedent) / 16.67) : 1; precedent = m;
    const t = m / 1000;
    g.clearRect(0, 0, W, H);
    for (const q of souffles) {
      for (const a of p) { const dx = a.x - q.x, dy = a.y - q.y, d2 = dx * dx + dy * dy; if (d2 < 200 * 200) { const d = Math.sqrt(d2) || 1, k = (1 - d / 200) * 7; a.vx += dx / d * k; a.vy += dy / d * k - 1.5; } }
    }
    for (const a of p) {
      a.vx += (Math.sin(t * .6 * lent + a.ph) * .012 + .004) * dt * lent;
      a.vy += (-.006 + Math.cos(t * .5 * lent + a.ph * 1.3) * .006) * dt * lent;
      if (main.actif && main.force > .05) { const dx = a.x - main.x, dy = a.y - main.y, d2 = dx * dx + dy * dy; if (d2 < 120 * 120) { const d = Math.sqrt(d2) || 1, k = (1 - d / 120) * .5 * main.force; a.vx += dx / d * k * dt; a.vy += dy / d * k * dt; } }
      a.vx *= Math.pow(.96, dt); a.vy *= Math.pow(.96, dt);
      a.x += (a.vx + Math.sin(t * a.v * lent + a.ph) * .25 * lent) * dt; a.y += a.vy * dt;
      if (a.y < -20) Object.assign(a, nouveau(false));
      if (a.y > H + 30) a.y = -10;
      if (a.x < -20) a.x = W + 10; if (a.x > W + 20) a.x = -10;
      const scint = lucioles ? Math.pow(.5 + .5 * Math.sin(t * (.8 + a.v) * lent + a.ph * 3), 3) : .55 + .45 * Math.sin(t * 1.3 * lent + a.ph * 3);
      g.globalAlpha = (lucioles ? .1 + .9 * scint : .35 + .5 * scint) * a.z;
      const k = a.r * (.8 + .3 * scint);
      g.drawImage(grain, a.x - k / 2, a.y - k / 2, k, k);
    }
    g.globalAlpha = 1;
  }
  return { image, taille };
}

export function demarrer(el, { reduit = false, mobile = false } = {}) {
  const petit = mobile || Math.min(innerWidth, innerHeight) < 600;
  el.classList.add('pr');
  el.innerHTML = `
    <div class="pr-ciel pr-ciel-jour"></div><div class="pr-ciel pr-ciel-soir"></div>
    <div class="pr-astre"></div>
    <div class="pr-champs"></div>
    <canvas class="pr-pollens" aria-hidden="true"></canvas>
    <div class="pr-heure" role="group" aria-label="L’heure dans la prairie">
      <button type="button" data-heure="soir" aria-pressed="true">Le soir</button><button type="button" data-heure="jour" aria-pressed="false">Le jour</button>
    </div>`;
  const champsBoite = el.querySelector('.pr-champs'), toilePollens = el.querySelector('.pr-pollens'), astre = el.querySelector('.pr-astre');
  el.querySelector('.pr-ciel-jour').style.background = PALETTES.jour.ciel;
  el.querySelector('.pr-ciel-soir').style.background = PALETTES.soir.ciel;
  el.setAttribute('role', 'img');
  el.setAttribute('aria-label', 'Une prairie animée : les herbes ondulent au vent et s’écartent sous la main.');

  const horizon = () => { const r = el.getBoundingClientRect(); return r.width < r.height ? .36 : .4; };
  let heure = 'soir', champ = null, ancien = null, pollens = null, arrete = false, enPause = false, debut = 0;

  function creerChamp(nom, pousse) {
    const toile = document.createElement('canvas');
    toile.className = 'pr-champ'; toile.setAttribute('aria-hidden', 'true');
    champsBoite.appendChild(toile);
    const prairie = demarrerPrairie(toile, { petit, seed: 7, palette: PALETTES[nom] });
    if (!prairie) { toile.remove(); return null; }
    prairie.taille(horizon());
    toile.addEventListener('prairie-echec', () => { el.dispatchEvent(new Event('scene-echec')); }, { once: true });
    return { toile, prairie, pousse, nom, onde: [0, 0, 99, 0], trace: new Float32Array(32) };
  }

  champ = creerChamp(heure, true);
  if (!champ) { el.classList.remove('pr'); el.innerHTML = ''; return null; }
  pollens = demarrerPollens(toilePollens, { petit, reduit, palette: PALETTES[heure] });
  el.dataset.heure = heure;
  champ.prairie.pret().then(() => { debut = performance.now(); el.classList.add('pr-pret'); });

  // Le jour, le soir : un second champ se dessine par-dessus en fondu, puis l'ancien s'efface
  function changer(nom) {
    if (nom === heure || arrete) return;
    heure = nom; el.dataset.heure = nom;
    el.querySelectorAll('.pr-heure button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.heure === nom)));
    if (ancien) { ancien.toile.remove(); perdre(ancien); }
    ancien = champ;
    const neuf = creerChamp(nom, false);
    if (!neuf) return;
    neuf.toile.classList.add('pr-arrive');
    champ = neuf;
    pollens = demarrerPollens(toilePollens, { petit, reduit, palette: PALETTES[nom] });
    neuf.prairie.pret().then(() => {
      requestAnimationFrame(() => neuf.toile.classList.remove('pr-arrive'));
      setTimeout(() => { if (ancien) { ancien.toile.remove(); perdre(ancien); ancien = null; } }, reduit ? 500 : 1100);
    });
  }
  const perdre = (c) => { try { c.toile.getContext('webgl2')?.getExtension('WEBGL_lose_context')?.loseContext(); } catch {} };
  el.querySelector('.pr-heure').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) changer(b.dataset.heure); });

  // La main dans les herbes : la souris au survol, le doigt quand il glisse ; un toucher fait courir une onde
  const main = { x: -999, y: -999, actif: false, force: 0, vu: 0 };
  const sillage = [], souffles = [];
  const local = (e) => { const r = el.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top, r]; };
  const viser = (e) => { const [x, y] = local(e); main.x = x; main.y = y; main.actif = true; main.vu = performance.now(); };
  const surMouvement = (e) => { if (e.pointerType === 'mouse' || e.buttons || e.pointerType === 'touch') viser(e); };
  const surAppui = (e) => {
    if (e.target.closest('button')) return;
    viser(e);
    const [x, y, r] = local(e);
    for (const c of [champ]) {
      const nx = (x / r.width) * 2 - 1, ny = 1 - (y / r.height) * 2;
      if (ny < (1 - 2 * c.prairie.horizon) + .1) { c.onde[0] = nx; c.onde[1] = ny; c.onde[2] = 0; c.onde[3] = 1; }
    }
    souffles.push({ x, y });
  };
  const surSortie = () => { main.actif = false; };
  el.addEventListener('pointermove', surMouvement, { passive: true });
  el.addEventListener('pointerdown', surAppui, { passive: true });
  el.addEventListener('pointerleave', surSortie);
  el.addEventListener('pointercancel', surSortie);

  // La boucle : vivante dans les deux modes (en mouvement réduit, le vent est plus lent et plus doux)
  const tempo = reduit ? .55 : 1, doux = reduit ? .5 : 1;
  const etat = { vent: 1, doux, pousse: 0, trace: null, onde: [0, 0, 99, 0], dolly: 0 };
  let precedent = 0, temps = 0, id = 0;
  function remplirTrace(c, r) {
    const T = c.trace, R = petit ? .3 : .22; T.fill(0);
    const ndc = (x, y) => [(x / r.width) * 2 - 1, 1 - (y / r.height) * 2];
    const [hx, hy] = ndc(main.x, main.y); T[0] = hx; T[1] = hy; T[2] = main.force; T[3] = R;
    for (let k = 0; k < Math.min(7, sillage.length); k++) { const s = sillage[sillage.length - 1 - k], [x, y] = ndc(s.x, s.y); T.set([x, y, s.f * .9, R * .9], 4 + k * 4); }
  }
  function boucle(m) {
    id = 0;
    if (arrete || enPause) return;
    const dt = precedent ? Math.min(.05, (m - precedent) / 1000) : .016; precedent = m;
    temps += dt * tempo;
    const cible = main.actif && m - main.vu < 700 ? 1 : 0;
    main.force += (cible - main.force) * Math.min(1, dt * (cible ? 6 : 1.6));
    if (main.actif && m - main.vu < 140) {
      const der = sillage[sillage.length - 1];
      if (!der || Math.hypot(main.x - der.x, main.y - der.y) > (petit ? 24 : 34)) { sillage.push({ x: main.x, y: main.y, f: 1 }); if (sillage.length > 7) sillage.shift(); }
    }
    for (const s of sillage) s.f *= Math.exp(-dt * 1.35);
    while (sillage.length && sillage[0].f < .01) sillage.shift();
    const r = el.getBoundingClientRect();
    const duree = reduit ? 1.4 : 2.6;
    for (const c of [ancien, champ]) {
      if (!c) continue;
      etat.vent = 1;
      etat.pousse = c.pousse ? (debut ? Math.min(2, (m - debut) / 1000 / duree * 1.6) : 0) : 2;
      remplirTrace(c, r); etat.trace = c.trace;
      c.onde[2] += dt; etat.onde = c.onde;
      c.prairie.dessiner(temps, etat);
    }
    pollens.image(m, main, souffles.splice(0));
    id = requestAnimationFrame(boucle);
  }
  id = requestAnimationFrame(boucle);

  const ro = new ResizeObserver(() => {
    for (const c of [ancien, champ]) c?.prairie.taille(horizon());
    pollens.taille();
  });
  ro.observe(el);

  return {
    pause(oui) {
      if (arrete) return;
      enPause = !!oui;
      if (!enPause && !id) { precedent = 0; id = requestAnimationFrame(boucle); }
    },
    arreter() {
      arrete = true; cancelAnimationFrame(id); ro.disconnect();
      el.removeEventListener('pointermove', surMouvement); el.removeEventListener('pointerdown', surAppui);
      el.removeEventListener('pointerleave', surSortie); el.removeEventListener('pointercancel', surSortie);
      for (const c of [ancien, champ]) if (c) perdre(c);
      el.classList.remove('pr', 'pr-pret'); el.removeAttribute('role'); el.removeAttribute('aria-label'); delete el.dataset.heure;
      el.replaceChildren();
    },
  };
}
