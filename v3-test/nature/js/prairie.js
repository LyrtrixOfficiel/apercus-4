// La prairie : des milliers de brins d'herbe et des fleurs des champs, en WebGL2.
// Chaque brin est un ruban courbe instancie ; le vent, les rafales qui balaient le
// champ, la main qui ecarte les herbes et l'onde d'un toucher sont calcules dans le
// shader. Rien n'est une image : tout pousse a l'ouverture de la page.

const COMMUN = `
uniform mat4 uVP;
uniform float uT, uVent, uPousse, uAsp;
uniform vec3 uPtr;      // main : x, y (ndc), force
uniform vec4 uOnde;     // toucher : x, y (ndc), age (s), force
uniform vec3 uCam;

vec2 souffle(vec3 b, float ph){
  float r = sin(b.x * .23 + b.z * .31 - uT * 1.05) * .5 + .5; r = r * r * r;
  float w = sin(uT * 1.9 + b.x * 1.7 + b.z * 1.1 + ph) * .06 + sin(uT * .8 + b.x * .5 + ph * .3) * .1;
  float s = w + r * .42 * uVent + .08 * uVent;
  return vec2(s, -s * .35);
}
vec2 poussee(vec3 b, float h){
  vec4 c = uVP * vec4(b + vec3(0., h * .6, 0.), 1.);
  vec2 n = c.xy / c.w;
  vec2 d = (n - uPtr.xy) * vec2(uAsp, 1.);
  float k = exp(-dot(d, d) * 16.) * uPtr.z;
  vec2 r = vec2(sign(d.x) * k * 1.15, 0.);
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
vec3 teinte(float jaune, float clarte){ return mix(vec3(1.), vec3(1.22, 1.06, .62), jaune) * clarte; }
`;

const V_HERBE = `#version 300 es
precision highp float;
layout(location=0) in vec2 aV;
layout(location=1) in vec4 aBase;   // x, z, hauteur, largeur
layout(location=2) in vec4 aParam;  // rotation, inclinaison x, inclinaison z, phase
layout(location=3) in vec4 aTeinte; // jaune, clarte, retard, genre (0 herbe, 1 tige de fleur)
${COMMUN}
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
  vTeinte = teinte(aTeinte.x, aTeinte.y);
}`;

const F_HERBE = `#version 300 es
precision mediump float;
in float vT, vCote, vDist, vReflet, vGenre; in vec3 vTeinte;
uniform vec3 uBrume;
out vec4 o;
void main(){
  vec3 bas = vec3(.09, .2, .1), milieu = vec3(.25, .47, .19), pointe = vec3(.6, .77, .38);
  if (vGenre > .5) { milieu = vec3(.24, .42, .18); pointe = vec3(.36, .56, .24); }
  vec3 c = mix(bas, milieu, smoothstep(0., .45, vT));
  c = mix(c, pointe, smoothstep(.4, 1., vT));
  c *= vTeinte;
  c *= .84 + .16 * vCote;
  c += vec3(1., .9, .55) * pow(vT, 2.6) * .2;
  c += vReflet * vec3(.16, .18, .08) * vT;
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
  p += uDroite * aQ.x * s + uHaut * (aQ.y * .62 + .1) * s;
  gl_Position = uVP * vec4(p, 1.);
  vUv = aQ; vGenre = aFleur.x; vVar = aFleur.w; vDist = length(p - uCam); vRot = aParam.x;
}`;

const F_FLEUR = `#version 300 es
precision mediump float;
in vec2 vUv; in float vGenre, vVar, vDist, vRot;
uniform vec3 uBrume;
out vec4 o;
void main(){
  float r = length(vUv), a = atan(vUv.y, vUv.x) + vRot;
  float bord; vec3 c, coeur; float rc;
  if (vGenre < .5) {        // marguerite
    bord = .5 + .45 * pow(abs(cos(a * 6.5)), .45); c = mix(vec3(1., .99, .95), vec3(1., .9, .93), vVar); coeur = vec3(.98, .76, .18); rc = .24;
  } else if (vGenre < 1.5) { // bouton d'or
    bord = .72 + .26 * cos(a * 5.); c = vec3(.99, .82, .2); coeur = vec3(.9, .62, .1); rc = .2;
  } else if (vGenre < 2.5) { // coquelicot
    bord = .74 + .24 * cos(a * 4. + .6); c = mix(vec3(.86, .22, .16), vec3(.93, .36, .22), vVar); coeur = vec3(.14, .09, .09); rc = .17;
  } else {                   // bleuet
    bord = (.58 + .4 * pow(abs(cos(a * 4.)), .3)) * (.88 + .12 * cos(a * 26.)); c = mix(vec3(.35, .45, .92), vec3(.55, .42, .9), vVar); coeur = vec3(.3, .22, .55); rc = .18;
  }
  float aa = fwidth(r) * 1.3 + .01;
  float alpha = 1. - smoothstep(bord - aa, bord + aa, r);
  if (alpha < .01) discard;
  c *= .74 + .3 * smoothstep(0., .8, r) - .1 * smoothstep(.6, 1., r);
  c *= .92 + .08 * cos(a * 26.);
  c = mix(coeur, c, smoothstep(rc - aa, rc + aa, r));
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
in vec3 vP; uniform vec3 uBrume, uCam;
out vec4 o;
float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
void main(){
  float d = length(vP - uCam);
  vec3 c = mix(vec3(.16, .3, .12), vec3(.27, .44, .17), n(vP.xz * .7));
  c = mix(c, uBrume, smoothstep(3., 26., d) * .92);
  float a = 1. - smoothstep(22., 34., d);
  o = vec4(c * a, a);
}`;

function compiler(gl, vs, fs) {
  const s = (type, src) => { const x = gl.createShader(type); gl.shaderSource(x, src); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; };
  const p = gl.createProgram(); gl.attachShader(p, s(gl.VERTEX_SHADER, vs)); gl.attachShader(p, s(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  const u = {}; const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < n; i++) { const nom = gl.getActiveUniform(p, i).name; u[nom] = gl.getUniformLocation(p, nom); }
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

export function demarrerPrairie(canvas, { petit, reduit, seed = 1 }) {
  let gl = null;
  try { gl = canvas.getContext('webgl2', { antialias: true, alpha: true, premultipliedAlpha: true, powerPreference: 'high-performance' }); } catch {}
  if (!gl) return null;
  let progH, progF, progS;
  try { progH = compiler(gl, V_HERBE, F_HERBE); progF = compiler(gl, V_FLEUR, F_FLEUR); progS = compiler(gl, V_SOL, F_SOL); } catch (e) { console.warn(e); return null; }

  // Geometrie d'un brin : 7 niveaux, deux sommets par niveau.
  const NIV = 7, brin = [];
  for (let i = 0; i < NIV; i++) { const t = i / (NIV - 1); brin.push(t, -1, t, 1); }
  const vaoH = gl.createVertexArray(), vaoF = gl.createVertexArray(), vaoS = gl.createVertexArray();
  const tampon = (data, usage = gl.STATIC_DRAW) => { const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, data, usage); return b; };
  const bBrin = tampon(new Float32Array(brin));
  const bQuad = tampon(new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]));
  const bSol = tampon(new Float32Array([-1, 0, 1, 0, -1, 1, 1, 1]));
  gl.bindVertexArray(vaoS); gl.bindBuffer(gl.ARRAY_BUFFER, bSol); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  let bInstH = gl.createBuffer(), bInstF = gl.createBuffer(), nH = 0, nF = 0;

  function lier(vao, geo, inst) {
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, geo); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, inst);
    for (let k = 1; k <= 3; k++) { gl.enableVertexAttribArray(k); gl.vertexAttribPointer(k, 4, gl.FLOAT, false, 48, (k - 1) * 16); gl.vertexAttribDivisor(k, 1); }
    gl.bindVertexArray(null);
  }

  // Camera et semis, recalcules quand la forme du cadre change.
  const FOV = 32 * Math.PI / 180, CAMY = .62;
  let largeur = 0, hauteur = 0, dpr = 1, horizon = .6, asp = 1, VP = null, droite = [1, 0, 0], haut = [0, 1, 0], cam = [0, CAMY, 0], dollyZ = 0;
  function camera() {
    const ndc = 1 - 2 * horizon;
    const tilt = Math.atan(-ndc * Math.tan(FOV / 2)); // positif : on regarde un peu vers le haut
    const cz = -dollyZ;
    cam = [0, CAMY, cz];
    const fw = [0, Math.sin(tilt), -Math.cos(tilt)]; droite = [1, 0, 0]; haut = [0, Math.cos(tilt), Math.sin(tilt)];
    const V = [droite[0], haut[0], -fw[0], 0, droite[1], haut[1], -fw[1], 0, droite[2], haut[2], -fw[2], 0,
      -(droite[0] * cam[0] + droite[1] * cam[1] + droite[2] * cam[2]), -(haut[0] * cam[0] + haut[1] * cam[1] + haut[2] * cam[2]), (fw[0] * cam[0] + fw[1] * cam[1] + fw[2] * cam[2]), 1];
    VP = multiplier(perspective(FOV, asp, .05, 60), V);
  }

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
    // Fleurs des champs, en touffes
    const NF = petit ? 140 : 320, touffes = [];
    for (let k = 0; k < (petit ? 14 : 26); k++) {
      const D = 2.8 + 14 * Math.pow(r(), 1.25), lim = D * tanH;
      const u = r();
      touffes.push({ D, x: (r() * 2 - 1) * lim, genre: u < .42 ? 0 : u < .62 ? 1 : u < .78 ? 3 : 2, R: .5 + D * .12 });
    }
    for (let i = 0; i < NF; i++) {
      const tf = touffes[i % touffes.length];
      const D = Math.max(2.4, tf.D + (r() - .5) * tf.R * 1.4);
      const lim = D * tanH, x = tf.x + (r() - .5) * tf.R * 2.4, ex = Math.min(1, Math.abs(x) / (lim + .01));
      const genre = r() < .8 ? tf.genre : Math.floor(r() * 4);
      const h = Math.min(CAMY - .04, .34 + r() * .22);
      const incl = [(r() - .5) * .3, (r() - .5) * .2], ph = r() * 6.28;
      const retard = .25 + .35 * ex + r() * .2;
      herbes.push([x, -D, h, .007, r() * Math.PI, incl[0], incl[1], ph, .1, .9, retard, 1]);
      fleurs.push([x, -D, h, 0, r() * 6.28, incl[0], incl[1], ph, genre, (genre === 2 ? .052 : genre === 1 ? .03 : genre === 3 ? .036 : .044) * (.75 + r() * .55), retard, r()]);
    }
    // Du plus loin au plus proche : la transparence de la brume se compose dans le bon ordre.
    herbes.sort((a, b) => a[1] - b[1]); fleurs.sort((a, b) => a[1] - b[1]);
    const H = new Float32Array(herbes.length * 12); herbes.forEach((v, i) => H.set(v, i * 12));
    const F = new Float32Array(fleurs.length * 12); fleurs.forEach((v, i) => F.set(v, i * 12));
    gl.bindBuffer(gl.ARRAY_BUFFER, bInstH); gl.bufferData(gl.ARRAY_BUFFER, H, gl.STATIC_DRAW); nH = herbes.length;
    gl.bindBuffer(gl.ARRAY_BUFFER, bInstF); gl.bufferData(gl.ARRAY_BUFFER, F, gl.STATIC_DRAW); nF = fleurs.length;
    lier(vaoH, bBrin, bInstH); lier(vaoF, bQuad, bInstF);
  }

  let aspSeme = 0, horizonSeme = 0;
  function taille(h) {
    if (h != null) horizon = h;
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width)), ht = Math.max(1, Math.round(rect.height));
    dpr = Math.min(devicePixelRatio || 1, petit ? 1.5 : 1.75) * qualite;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(ht * dpr);
    largeur = w; hauteur = ht; asp = w / ht;
    gl.viewport(0, 0, canvas.width, canvas.height);
    if (!aspSeme || Math.abs(Math.log(asp / aspSeme)) > .25 || h != null && Math.abs(h - horizonSeme) > .05) { aspSeme = asp; horizonSeme = horizon; semer(); }
    camera();
  }

  let qualite = 1, cumul = 0, nb = 0, dernier = 0;
  const brume = [.9, .925, .84];
  function dessiner(t, etat) {
    dollyZ = etat.dolly || 0; camera();
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST); gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    const communs = (P) => {
      gl.useProgram(P.p);
      gl.uniformMatrix4fv(P.u.uVP, false, VP);
      if (P.u.uT) gl.uniform1f(P.u.uT, t);
      if (P.u.uVent) gl.uniform1f(P.u.uVent, etat.vent);
      if (P.u.uPousse) gl.uniform1f(P.u.uPousse, etat.pousse);
      if (P.u.uAsp) gl.uniform1f(P.u.uAsp, asp);
      if (P.u.uPtr) gl.uniform3f(P.u.uPtr, etat.ptr[0], etat.ptr[1], etat.ptr[2]);
      if (P.u.uOnde) gl.uniform4f(P.u.uOnde, etat.onde[0], etat.onde[1], etat.onde[2], etat.onde[3]);
      if (P.u.uCam) gl.uniform3f(P.u.uCam, cam[0], cam[1], cam[2]);
      if (P.u.uBrume) gl.uniform3f(P.u.uBrume, brume[0], brume[1], brume[2]);
    };
    communs(progS); gl.bindVertexArray(vaoS); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    communs(progH); gl.bindVertexArray(vaoH); gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, NIV * 2, nH);
    communs(progF); gl.uniform3f(progF.u.uDroite, droite[0], droite[1], droite[2]); gl.uniform3f(progF.u.uHaut, haut[0], haut[1], haut[2]);
    gl.bindVertexArray(vaoF); gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, nF);
    gl.bindVertexArray(null);
    if (!reduit) { // si les images ralentissent, on baisse la definition
      const m = performance.now();
      if (dernier && m - dernier < 100) { cumul += m - dernier; nb++; }
      dernier = m;
      if (nb === 90) { if (cumul / nb > 22 && qualite > .55) { qualite *= .8; taille(); } cumul = 0; nb = 0; }
    }
  }
  return { dessiner, taille, get horizon() { return horizon; }, rect: () => canvas.getBoundingClientRect() };
}

// Repli sans WebGL2 : une prairie dessinee une fois en 2D.
export function prairieFixe(canvas, horizon = .6, seed = 1) {
  const g = canvas.getContext('2d'); if (!g) return;
  const r = hasard(seed), rect = canvas.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = rect.width * dpr; canvas.height = rect.height * dpr; g.scale(dpr, dpr);
  const W = rect.width, H = rect.height, y0 = H * horizon;
  const fond = g.createLinearGradient(0, y0, 0, H); fond.addColorStop(0, '#dfe8cc'); fond.addColorStop(.25, '#8fb46f'); fond.addColorStop(1, '#3f6b30');
  g.fillStyle = fond; g.fillRect(0, y0, W, H - y0);
  for (let i = 0; i < 1400; i++) {
    const p = Math.pow(r(), .7), y = y0 + p * (H - y0) + 6, x = r() * W, h = (8 + r() * 26) * (.3 + p * 1.6), c = (r() - .3) * h * .5;
    g.fillStyle = `hsl(${88 + r() * 30} ${40 + r() * 20}% ${22 + (1 - p) * 30 + r() * 12}%)`;
    g.beginPath(); g.moveTo(x - 2, y); g.quadraticCurveTo(x + c * .4, y - h * .6, x + c, y - h); g.quadraticCurveTo(x + c * .4 + 2, y - h * .55, x + 2, y); g.fill();
  }
}
