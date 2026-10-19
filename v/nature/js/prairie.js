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
precision highp float; // highp comme les sommets : les puces Adreno refusent un même uniform (uCam) en deux précisions
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
precision highp float; // highp comme les sommets : les puces Adreno refusent un même uniform (uCam) en deux précisions
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
precision highp float; // highp comme les sommets : les puces Adreno refusent un même uniform (uCam) en deux précisions
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

export function demarrerPrairie(canvas, { petit, seed = 1, palette }) {
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

// Repli sans WebGL2 (certains telephones Android, navigateurs integres) : une prairie dessinee une fois en 2D,
// aux couleurs de la palette, AVEC ses fleurs (memes genres et memes parts que la prairie 3D), du plus loin au plus proche.
export function prairieFixe(canvas, horizon = .6, seed = 1, palette) {
  const g = canvas.getContext('2d'); if (!g) return;
  const r = hasard(seed), rect = canvas.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = rect.width * dpr; canvas.height = rect.height * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0);
  const W = rect.width, H = rect.height, y0 = H * horizon, c = palette.css, G = palette.gl || {};
  const rgb = (v, a = 1) => `rgba(${v.map((x) => Math.round(Math.min(1, Math.max(0, x)) * 255)).join(',')},${a})`;
  const mel = (a, b, t) => a.map((x, k) => x + (b[k] - x) * t);
  const herbe = G.herbe || [[.09, .2, .1], [.25, .47, .19], [.6, .77, .38]], brume = G.brume || [.9, .92, .86];
  const fond = g.createLinearGradient(0, y0, 0, H);
  fond.addColorStop(0, rgb(mel(herbe[2], brume, .6))); fond.addColorStop(.3, rgb(mel(herbe[1], brume, .2))); fond.addColorStop(1, rgb(herbe[0]));
  g.fillStyle = fond; g.fillRect(0, y0, W, H - y0);
  const genres = G.fleurs || [[0, .5], [2, .3], [3, .2]], total = genres.reduce((s, [, q]) => s + q, 0);
  const tirer = (u) => { let a = u * total; for (const [k, q] of genres) { if ((a -= q) <= 0) return k; } return genres[0][0]; };
  const coul = G.couleurs || {};
  const elements = [];
  const echelle = Math.min(1.4, Math.max(.75, W / 700));
  // les herbes
  const NH = Math.round(3200 * Math.min(1.6, Math.max(.8, W / 900)));
  for (let i = 0; i < NH; i++) {
    const p = Math.pow(r(), .75);
    elements.push({ p, herbe: true, x: r() * W, h: (8 + r() * 26) * (.25 + Math.pow(p, 1.6) * 4.2) * echelle, cb: (r() - .35), t: r(), w: (1.2 + r() * 1.8) * (.4 + p * 1.8) });
  }
  // les fleurs, en touffes
  const lavande = genres[0][0] === 4;
  const touffes = [];
  for (let k = 0; k < 16; k++) touffes.push({ p: .15 + .8 * Math.pow(r(), .8), x: r() * W, genre: tirer(r()) });
  const NF = Math.round((lavande ? 150 : 110) * Math.min(1.6, Math.max(.7, W / 900)));
  for (let i = 0; i < NF; i++) {
    const tf = touffes[i % touffes.length];
    const p = Math.min(1, Math.max(.05, tf.p + (r() - .5) * .22));
    elements.push({ p, fleur: true, x: tf.x + (r() - .5) * W * .16, genre: r() < .8 ? tf.genre : tirer(r()), h: (16 + r() * 18) * (.3 + Math.pow(p, 1.4) * 3.4) * echelle, cb: (r() - .5) * .25, a: r() * 6.28 });
  }
  elements.sort((a, b) => a.p - b.p);
  const ellipse = (x, y, rx, ry, rot, coul2) => { g.fillStyle = coul2; g.beginPath(); g.ellipse(x, y, Math.max(.3, rx), Math.max(.3, ry), rot, 0, 6.2832); g.fill(); };
  for (const e of elements) {
    const y = y0 + e.p * (H - y0) + 4, voile = Math.max(0, .55 - e.p) * 1.1; // la brume au loin
    if (e.herbe) {
      const base = mel(herbe[0], herbe[1], .35 + e.t * .5), pointe = mel(herbe[1], herbe[2], .3 + e.t * .7);
      const gr = g.createLinearGradient(0, y, 0, y - e.h);
      gr.addColorStop(0, rgb(mel(base, brume, voile))); gr.addColorStop(1, rgb(mel(pointe, brume, voile)));
      g.fillStyle = gr; const dx = e.cb * e.h * .55;
      g.beginPath(); g.moveTo(e.x - e.w, y); g.quadraticCurveTo(e.x + dx * .35, y - e.h * .6, e.x + dx, y - e.h);
      g.quadraticCurveTo(e.x + dx * .35 + e.w * .6, y - e.h * .55, e.x + e.w, y); g.fill();
      continue;
    }
    const k = e.genre, [c0, c1, c2] = coul[k] || [[1, 1, 1], [.95, .95, .95], [.95, .75, .2]];
    const tx = e.x + e.cb * e.h, ty = y - e.h, s = e.h * .27;
    g.strokeStyle = rgb(mel(G.tige ? G.tige[0] : herbe[1], brume, voile)); g.lineWidth = Math.max(.6, s * .14);
    g.beginPath(); g.moveTo(e.x, y); g.quadraticCurveTo(e.x, y - e.h * .5, tx, ty); g.stroke();
    const P0 = rgb(mel(c0, brume, voile * .8)), P1 = rgb(mel(c1, brume, voile * .8)), C2 = rgb(mel(c2, brume, voile * .8));
    if (k === 0) { // marguerite
      for (let j = 0; j < 12; j++) { const a = e.a + j * .5236; ellipse(tx + Math.cos(a) * s * .55, ty + Math.sin(a) * s * .3, s * .5, s * .14, a, j % 2 ? P0 : P1); }
      ellipse(tx, ty, s * .26, s * .2, 0, C2);
    } else if (k === 1) { // bouton d'or
      for (let j = 0; j < 5; j++) { const a = e.a + j * 1.2566; ellipse(tx + Math.cos(a) * s * .3, ty + Math.sin(a) * s * .2, s * .32, s * .26, a, j % 2 ? P0 : P1); }
      ellipse(tx, ty, s * .14, s * .12, 0, C2);
    } else if (k === 2) { // coquelicot
      for (let j = 0; j < 4; j++) { const a = e.a + j * 1.5708; ellipse(tx + Math.cos(a) * s * .32, ty + Math.sin(a) * s * .22 - s * .05, s * .48, s * .4, a, j % 2 ? P0 : P1); }
      ellipse(tx, ty, s * .14, s * .12, 0, C2);
    } else if (k === 3) { // bleuet
      for (let j = 0; j < 9; j++) { const a = e.a + j * .698; ellipse(tx + Math.cos(a) * s * .38, ty + Math.sin(a) * s * .26, s * .36, s * .1, a, j % 2 ? P0 : P1); }
      ellipse(tx, ty, s * .14, s * .12, 0, C2);
    } else { // epis de lavande (4) ou de ble (5)
      const n = k === 4 ? 9 : 7;
      for (let j = 0; j < n; j++) {
        const f = j / (n - 1), yy = ty + s * 1.4 - f * s * 2.2, l = s * (k === 4 ? .2 : .26) * (1 - f * .45);
        ellipse(tx - l * .45, yy, l, l * .7, -.5, j % 2 ? P0 : P1); ellipse(tx + l * .45, yy - l * .3, l, l * .7, .5, j % 2 ? P1 : P0);
      }
    }
  }
}
