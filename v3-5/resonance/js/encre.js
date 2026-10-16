// Resonance, art-therapie : les pigments qui fleurissent. Un fluide (Navier-Stokes simplifie, sur le processeur
// graphique) porte trois pigments d'aquarelle sur un papier : ils se melangent par absorption (comme de vraies
// couleurs), s'assombrissent sur leurs bords en sechant, et le grain du papier les retient.
// Le doigt ou la souris poussent l'eau et deposent de la couleur ; le defilement fait fleurir les taches,
// et la derniere floraison ecrit les initiales. Demande les textures flottantes (sinon : repli photo).

const VS = `#version 300 es
in vec2 aPos; out vec2 vUv;
void main(){ vUv = aPos * .5 + .5; gl_Position = vec4(aPos, 0., 1.); }`;
const T = (corps) => `#version 300 es
precision highp float; precision highp sampler2D;
in vec2 vUv; out vec4 o;
${corps}`;
const FS = {
  advect: T(`uniform sampler2D uVel, uSrc; uniform vec2 uTexel; uniform float uDt, uDiss;
void main(){ vec2 p = vUv - uDt * texture(uVel, vUv).xy * uTexel; o = uDiss * texture(uSrc, p); }`),
  splat: T(`uniform sampler2D uSrc; uniform vec2 uPt; uniform vec4 uVal; uniform float uR, uAspect;
void main(){ vec2 d = vUv - uPt; d.x *= uAspect; float g = exp(-dot(d, d) / uR); o = texture(uSrc, vUv) + uVal * g; }`),
  masque: T(`uniform sampler2D uSrc, uMasque; uniform vec4 uVal; uniform float uTaux;
float h(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
void main(){ float m = texture(uMasque, vUv).r; vec4 s = texture(uSrc, vUv);
  vec4 cible = uVal * m * (.82 + .3 * h(floor(vUv * 900.)));
  // hors des lettres : l'encre ne fait que monter ; dans les lettres, les autres pigments se retirent peu a peu,
  // pour que le prenom reste une encre nette (et non un vert boueux, bleu sur jaune)
  vec4 monte = s + max(cible - s, vec4(0.)) * uTaux, net = s + (cible - s) * uTaux;
  o = mix(monte, net, smoothstep(.35, .85, m)); }`),
  curl: T(`uniform sampler2D uVel; uniform vec2 uTexel;
void main(){ float L = texture(uVel, vUv - vec2(uTexel.x, 0)).y, R = texture(uVel, vUv + vec2(uTexel.x, 0)).y;
  float B = texture(uVel, vUv - vec2(0, uTexel.y)).x, Tt = texture(uVel, vUv + vec2(0, uTexel.y)).x; o = vec4(.5 * (R - L - Tt + B), 0, 0, 1); }`),
  vort: T(`uniform sampler2D uVel, uCurl; uniform vec2 uTexel; uniform float uForce, uDt;
void main(){ float L = texture(uCurl, vUv - vec2(uTexel.x, 0)).x, R = texture(uCurl, vUv + vec2(uTexel.x, 0)).x;
  float B = texture(uCurl, vUv - vec2(0, uTexel.y)).x, Tt = texture(uCurl, vUv + vec2(0, uTexel.y)).x, C = texture(uCurl, vUv).x;
  vec2 f = .5 * vec2(abs(Tt) - abs(B), abs(R) - abs(L)); f /= length(f) + 1e-4; f *= uForce * C; f.y *= -1.;
  o = vec4(texture(uVel, vUv).xy + f * uDt, 0, 1); }`),
  div: T(`uniform sampler2D uVel; uniform vec2 uTexel;
void main(){ float L = texture(uVel, vUv - vec2(uTexel.x, 0)).x, R = texture(uVel, vUv + vec2(uTexel.x, 0)).x;
  float B = texture(uVel, vUv - vec2(0, uTexel.y)).y, Tt = texture(uVel, vUv + vec2(0, uTexel.y)).y; o = vec4(.5 * (R - L + Tt - B), 0, 0, 1); }`),
  press: T(`uniform sampler2D uP, uDiv; uniform vec2 uTexel;
void main(){ float L = texture(uP, vUv - vec2(uTexel.x, 0)).x, R = texture(uP, vUv + vec2(uTexel.x, 0)).x;
  float B = texture(uP, vUv - vec2(0, uTexel.y)).x, Tt = texture(uP, vUv + vec2(0, uTexel.y)).x;
  o = vec4((L + R + B + Tt - texture(uDiv, vUv).x) * .25, 0, 0, 1); }`),
  grad: T(`uniform sampler2D uP, uVel; uniform vec2 uTexel;
void main(){ float L = texture(uP, vUv - vec2(uTexel.x, 0)).x, R = texture(uP, vUv + vec2(uTexel.x, 0)).x;
  float B = texture(uP, vUv - vec2(0, uTexel.y)).x, Tt = texture(uP, vUv + vec2(0, uTexel.y)).x;
  o = vec4(texture(uVel, vUv).xy - .5 * vec2(R - L, Tt - B), 0, 1); }`),
  // Rendu : papier * absorption des trois pigments, bords plus sombres, grain du papier
  rendu: T(`uniform sampler2D uDye; uniform vec2 uTexel, uRes; uniform vec3 uPapier, uP1, uP2, uP3;
float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vb(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y); }
vec3 abs3(vec3 c){ return -log(clamp(c, vec3(.02), vec3(1.))); }
void main(){
  vec3 d = max(texture(uDye, vUv).rgb, 0.);
  vec3 dl = max(texture(uDye, vUv + vec2(uTexel.x * 1.5, 0)).rgb, 0.), dr = max(texture(uDye, vUv - vec2(uTexel.x * 1.5, 0)).rgb, 0.);
  vec3 du = max(texture(uDye, vUv + vec2(0, uTexel.y * 1.5)).rgb, 0.), dd = max(texture(uDye, vUv - vec2(0, uTexel.y * 1.5)).rgb, 0.);
  vec3 bord = clamp(abs(dl - dr) + abs(du - dd), 0., 1.);
  vec2 px = vUv * uRes;
  float papier = vb(px * .35) * .55 + vb(px * .09) * .45;
  vec3 dens = d * (.85 + .3 * papier) + bord * .9;
  dens = 1. - exp(-dens * 1.25);
  vec3 a = abs3(uP1) * dens.r + abs3(uP2) * dens.g + abs3(uP3) * dens.b;
  vec3 c = uPapier * exp(-a * 1.05);
  c *= .975 + .035 * papier;
  o = vec4(c, 1.);
}`),
};

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);

export function demarrerEncre(toile, { petit = false, reduit = false } = {}) {
  const gl = toile.getContext('webgl2', { antialias: false, alpha: false, depth: false, stencil: false, premultipliedAlpha: false });
  if (!gl) return null;
  if (!gl.getExtension('EXT_color_buffer_float') && !gl.getExtension('EXT_color_buffer_half_float')) return null;
  gl.getExtension('OES_texture_float_linear');
  const progs = {};
  for (const [k, fs] of Object.entries(FS)) {
    const p = gl.createProgram();
    for (const [t, src] of [[gl.VERTEX_SHADER, VS], [gl.FRAGMENT_SHADER, fs]]) {
      const s = gl.createShader(t); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn(k, gl.getShaderInfoLog(s)); return null; }
      gl.attachShader(p, s);
    }
    gl.bindAttribLocation(p, 0, 'aPos'); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) return null;
    const u = {}; const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) { const a = gl.getActiveUniform(p, i); u[a.name] = gl.getUniformLocation(p, a.name); }
    progs[k] = { p, u };
  }
  const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
  const vb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vb);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const cible = (w, h) => {
    const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
    for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
    const f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
    gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT);
    return { t, f, w, h };
  };
  const double = (w, h) => { const a = cible(w, h), b = cible(w, h); return { lire: a, ecrire: b, w, h, echanger() { const x = this.lire; this.lire = this.ecrire; this.ecrire = x; } }; };
  let vel, dye, div, curl, pres, W = 1, H = 1, masque = null;
  function taille(w, h) {
    W = w; H = h;
    const dpr = Math.min(window.devicePixelRatio || 1, petit ? 1.5 : 1.5);
    toile.width = Math.round(w * dpr); toile.height = Math.round(h * dpr);
    const a = w / h, sim = petit ? 96 : 128, dres = petit ? 384 : 640;
    const sw = a >= 1 ? Math.round(sim * a) : sim, sh = a >= 1 ? sim : Math.round(sim / a);
    const dw = a >= 1 ? Math.round(dres * a) : dres, dh = a >= 1 ? dres : Math.round(dres / a);
    vel = double(sw, sh); pres = double(sw, sh); div = cible(sw, sh); curl = cible(sw, sh);
    dye = double(Math.min(dw, 1400), Math.min(dh, 1400));
  }
  const passe = (pr, sortie) => { gl.useProgram(pr.p); gl.bindFramebuffer(gl.FRAMEBUFFER, sortie ? sortie.f : null); gl.viewport(0, 0, sortie ? sortie.w : toile.width, sortie ? sortie.h : toile.height); };
  const tex = (pr, nom, t, u) => { gl.activeTexture(gl.TEXTURE0 + u); gl.bindTexture(gl.TEXTURE_2D, t); gl.uniform1i(pr.u[nom], u); };
  const tri = () => gl.drawArrays(gl.TRIANGLES, 0, 3);

  function splat(x, y, dx, dy, couleur, rayon = .0016) {
    // x, y : 0..1 (bas-gauche) ; couleur : [p1, p2, p3]
    const pr = progs.splat;
    passe(pr, vel.ecrire); tex(pr, 'uSrc', vel.lire.t, 0);
    gl.uniform2f(pr.u.uPt, x, y); gl.uniform4f(pr.u.uVal, dx, dy, 0, 0); gl.uniform1f(pr.u.uR, rayon); gl.uniform1f(pr.u.uAspect, W / H);
    tri(); vel.echanger();
    passe(pr, dye.ecrire); tex(pr, 'uSrc', dye.lire.t, 0);
    gl.uniform4f(pr.u.uVal, ...couleur, 0); gl.uniform1f(pr.u.uR, rayon * .9);
    tri(); dye.echanger();
  }
  function texte(mot, police) {
    const L = dye.w, Hc = dye.h, cv = document.createElement('canvas'); cv.width = L; cv.height = Hc;
    const ctx = cv.getContext('2d');
    let fs = Hc * .4;
    const poser = () => { ctx.font = `440 ${fs}px ${police}`; if ('fontStretch' in ctx) ctx.fontStretch = 'condensed'; };
    poser();
    const lw = ctx.measureText(mot).width; if (lw > L * .82) { fs *= L * .82 / lw; poser(); }
    const m = ctx.measureText(mot);
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, L, Hc);
    if ('filter' in ctx) ctx.filter = `blur(${Math.max(1, L / 420).toFixed(1)}px)`;
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
    ctx.fillText(mot, L / 2, Hc * .47 + (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2);
    if (!masque) masque = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, masque);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cv);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }
  // Le prenom : l'encre monte dans la forme des lettres jusqu'a sa densite (couleur), a la vitesse taux.
  function ecrire(taux, couleur) {
    if (!masque || taux <= 0) return;
    const pr = progs.masque;
    passe(pr, dye.ecrire); tex(pr, 'uSrc', dye.lire.t, 0); tex(pr, 'uMasque', masque, 1);
    gl.uniform4f(pr.u.uVal, ...couleur, 0); gl.uniform1f(pr.u.uTaux, Math.min(1, taux));
    tri(); dye.echanger();
  }

  let couleurs = null;
  function palette(c) { couleurs = { papier: hex(c.papier || c.fond), p: c.pigments.map(hex) }; }

  let tPrec = 0;
  // calme (0 a 1) : quand le prenom s'ecrit, l'eau se calme (tourbillons et courants s'eteignent) et les
  // anciennes floraisons palissent un peu, pour que l'encre des lettres reste nette.
  function dessiner(t, calme = 0) {
    if (!couleurs) return;
    const dt = Math.min(.033, tPrec ? t - tPrec : .016); tPrec = t;
    const texV = [1 / vel.w, 1 / vel.h];
    // tourbillons
    let pr = progs.curl; passe(pr, curl); tex(pr, 'uVel', vel.lire.t, 0); gl.uniform2f(pr.u.uTexel, ...texV); tri();
    pr = progs.vort; passe(pr, vel.ecrire); tex(pr, 'uVel', vel.lire.t, 0); tex(pr, 'uCurl', curl.t, 1); gl.uniform2f(pr.u.uTexel, ...texV); gl.uniform1f(pr.u.uForce, (reduit ? 12 : 22) * (petit ? .45 : 1) * (1 - calme)); gl.uniform1f(pr.u.uDt, dt); tri(); vel.echanger();
    // advection de la vitesse
    pr = progs.advect; passe(pr, vel.ecrire); tex(pr, 'uVel', vel.lire.t, 0); tex(pr, 'uSrc', vel.lire.t, 1); gl.uniform2f(pr.u.uTexel, ...texV); gl.uniform1f(pr.u.uDt, dt * 60); gl.uniform1f(pr.u.uDiss, .985 - .11 * calme); tri(); vel.echanger();
    // incompressibilite
    pr = progs.div; passe(pr, div); tex(pr, 'uVel', vel.lire.t, 0); gl.uniform2f(pr.u.uTexel, ...texV); tri();
    // la pression de l'image precedente sert de depart, mais affaiblie (x .8) : gardee telle quelle, son gradient
    // poussait l'eau sans fin dans le meme sens (des coulures sous les lettres du prenom) ; remise a zero, l'eau
    // devenait grumeleuse. (advect avec uDt = 0 : une simple multiplication)
    pr = progs.advect; passe(pr, pres.ecrire); tex(pr, 'uVel', vel.lire.t, 0); tex(pr, 'uSrc', pres.lire.t, 1); gl.uniform2f(pr.u.uTexel, ...texV); gl.uniform1f(pr.u.uDt, 0); gl.uniform1f(pr.u.uDiss, .8 - .8 * calme); tri(); pres.echanger();
    pr = progs.press;
    for (let i = 0; i < 16; i++) { passe(pr, pres.ecrire); tex(pr, 'uP', pres.lire.t, 0); tex(pr, 'uDiv', div.t, 1); gl.uniform2f(pr.u.uTexel, ...texV); tri(); pres.echanger(); }
    pr = progs.grad; passe(pr, vel.ecrire); tex(pr, 'uP', pres.lire.t, 0); tex(pr, 'uVel', vel.lire.t, 1); gl.uniform2f(pr.u.uTexel, ...texV); tri(); vel.echanger();
    // advection des pigments (ils restent sur le papier : presque pas d'effacement)
    pr = progs.advect; passe(pr, dye.ecrire); tex(pr, 'uVel', vel.lire.t, 0); tex(pr, 'uSrc', dye.lire.t, 1); gl.uniform2f(pr.u.uTexel, ...texV); gl.uniform1f(pr.u.uDt, dt * 60); gl.uniform1f(pr.u.uDiss, .9993 - .006 * calme); tri(); dye.echanger();
    // rendu
    pr = progs.rendu; passe(pr, null); tex(pr, 'uDye', dye.lire.t, 0);
    gl.uniform2f(pr.u.uTexel, 1 / dye.w, 1 / dye.h); gl.uniform2f(pr.u.uRes, toile.width, toile.height);
    gl.uniform3fv(pr.u.uPapier, couleurs.papier); gl.uniform3fv(pr.u.uP1, couleurs.p[0]); gl.uniform3fv(pr.u.uP2, couleurs.p[1]); gl.uniform3fv(pr.u.uP3, couleurs.p[2]);
    tri();
  }
  // Une floraison : quelques gouttes et une poussee en etoile.
  function fleurir(x, y, k, force = 1) {
    const coul = [0, 0, 0]; coul[k % 3] = .9 * force;
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * Math.PI * 2 + Math.random() * .6, r = .012 + Math.random() * .02;
      splat(x + Math.cos(a) * r * H / W, y + Math.sin(a) * r, Math.cos(a) * 3.5 * force, Math.sin(a) * 3.5 * force, coul, .0009 + Math.random() * .0012);
    }
  }
  return { taille, texte, ecrire, palette, splat, fleurir, dessiner, perdu: (f) => toile.addEventListener('webglcontextlost', (e) => { e.preventDefault(); f(); }) };
}
