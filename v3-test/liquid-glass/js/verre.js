// Liquid glass : le verre, en WebGL2 sans bibliothèque.
// Passe 1 : le fond lumineux (lumières qui dérivent, bulles nettes, initiales géantes) dans une texture
//           à mipmaps. Passe 2 : l'écran. Pour chaque panneau [data-verre] de la page, on calcule la forme
//           (rectangle arrondi en champ de distance), sa pente près du bord, et on lit le fond DÉCALÉ selon
//           cette pente : c'est une vraie réfraction, avec dispersion (rouge, vert, bleu décalés), reflet
//           spéculaire tourné vers la lumière (souris, inclinaison du téléphone) et ombre portée.
//           La goutte de l'accueil fusionne avec la carte (union douce des deux formes).

const FOND = `#version 300 es
precision highp float;
uniform vec2 uTaille;      // taille de l'écran en px CSS
uniform vec2 uRes;         // taille de la texture
uniform float uT, uDefil, uHautDoc;
uniform vec3 uBase, uL0, uL1, uL2, uL3, uIniCouleur;
uniform sampler2D uIni; uniform vec4 uIniRect;
uniform vec4 uBulles[14];
out vec4 o;
vec3 lumiere(vec3 c, vec3 l, vec2 p, vec2 ctr, float r, float f){ vec2 d = p - ctr; return mix(c, l, f*exp(-dot(d,d)/(r*r))); }
void main(){
  vec2 p = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uRes * uTaille;
  float m = max(uTaille.x, uTaille.y);
  float k = uDefil / max(uHautDoc, 1.0);           // la lumière tourne doucement avec la lecture
  vec3 c = uBase;
  c = lumiere(c, uL0, p, uTaille*vec2(0.18 + 0.12*sin(uT*0.11), 0.22 + 0.1*cos(uT*0.09) + 0.3*sin(k*6.0)), m*0.42, 0.95);
  c = lumiere(c, uL1, p, uTaille*vec2(0.86 + 0.08*cos(uT*0.08 + 1.0), 0.3 + 0.14*sin(uT*0.1 + 2.0) + 0.25*cos(k*5.0)), m*0.4, 0.9);
  c = lumiere(c, uL2, p, uTaille*vec2(0.55 + 0.2*sin(uT*0.06 + 4.0), 0.92 + 0.08*cos(uT*0.12)), m*0.38, 0.9);
  c = lumiere(c, uL3, p, uTaille*vec2(0.42 + 0.25*cos(uT*0.05 + k*4.0), 0.55 + 0.2*sin(uT*0.07 + 3.0)), m*0.3, 0.6);
  // initiales géantes, accrochées à la page (elles défilent avec l'accueil)
  vec2 q = (p + vec2(0.0, uDefil) - uIniRect.xy) / uIniRect.zw;
  if (q.x > 0.0 && q.x < 1.0 && q.y > 0.0 && q.y < 1.0) {
    float a = texture(uIni, vec2(q.x, q.y)).a;
    c = mix(c, uIniCouleur, a*0.9);
  }
  // bulles de lumière nettes : ce sont elles que le verre déforme le plus visiblement
  for (int i = 0; i < 14; i++) {
    vec4 b = uBulles[i];
    vec2 ctr = vec2(b.x*uTaille.x + sin(uT*0.2 + float(i))*14.0, b.y - uDefil*0.85 + cos(uT*0.17 + float(i)*1.3)*12.0);
    float dist = length(p - ctr), d = dist - b.z;
    float disque = smoothstep(1.4, -1.4, d);
    float coeur = 1.0 - smoothstep(0.0, b.z, dist);              // lumière plus forte au centre, façon bokeh
    float anneau = smoothstep(1.8, 0.0, abs(d + 1.5));
    c = mix(c, vec3(1.0), disque*(0.18 + 0.32*coeur*coeur + 0.1*b.w));
    c = mix(c, vec3(1.0), anneau*0.55);
  }
  o = vec4(c, 1.0);
}`;

const ECRAN = `#version 300 es
precision highp float;
#define MAX 14
uniform vec2 uTaille; uniform float uDpr, uT;
uniform sampler2D uFond;
uniform int uN;
uniform vec4 uP[MAX];      // x, y, largeur, hauteur (px CSS, origine en haut à gauche)
uniform vec4 uQ[MAX];      // rayon, type (0 panneau, 1 carte de l'accueil, 2 lentille, 3 bouton), voile, apparition
uniform vec4 uGoutte;      // x, y, rayon, présence
uniform vec2 uGv;          // vitesse de la goutte (étirement)
uniform vec2 uLum;         // position de la lumière (px CSS)
out vec4 o;

float boite(vec2 p, vec2 b, float r){ vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
float smin(float a, float b, float k){ float h = clamp(0.5 + 0.5*(b - a)/k, 0.0, 1.0); return mix(b, a, h) - k*h*(1.0 - h); }
float goutte(vec2 p){
  vec2 d = p - uGoutte.xy;
  float v = length(uGv);
  if (v > 0.001) { vec2 u = uGv / v; float s = 1.0 + min(v*0.0016, 0.45); d = u*dot(d, u)/s + (d - u*dot(d, u))*sqrt(s); }
  return length(d) - uGoutte.z;
}
float formeSeule(int i, vec2 p){
  vec4 r = uP[i]; vec4 q = uQ[i];
  vec2 h = r.zw*0.5*q.w;
  return boite(p - (r.xy + r.zw*0.5), h, min(q.x, min(h.x, h.y)));
}
float forme(int i, vec2 p){
  float d = formeSeule(i, p);
  if (uQ[i].y > 0.5 && uQ[i].y < 1.5 && uGoutte.w > 0.5) d = smin(d, goutte(p), 46.0);
  return d;
}
vec3 fond(vec2 p, float lod){ return textureLod(uFond, vec2(p.x/uTaille.x, 1.0 - p.y/uTaille.y), lod).rgb; }

void main(){
  vec2 p = vec2(gl_FragCoord.x, uTaille.y*uDpr - gl_FragCoord.y) / uDpr;
  int ici = -1; float dIci = 1e5;
  float ombre = 0.0;
  for (int i = 0; i < MAX; i++) {
    if (i >= uN) break;
    float d = forme(i, p);
    if (d < 0.0) { ici = i; dIci = d; }
    if (uQ[i].y < 2.5) { float ds = forme(i, p - vec2(0.0, 16.0)); ombre = max(ombre, exp(-max(ds, 0.0)/26.0) * 0.13 * uQ[i].w); }
  }
  // goutte seule (hors de la carte)
  bool seule = false;
  if (ici < 0 && uGoutte.w > 0.5) { float d = goutte(p); if (d < 0.0) { dIci = d; seule = true; } }

  if (ici < 0 && !seule) {
    o = vec4(fond(p, 0.0) * (1.0 - ombre), 1.0);
    return;
  }
  float type = seule ? 1.0 : uQ[ici].y;
  float voile = seule ? 0.06 : uQ[ici].z;
  // dans la carte de l'accueil, la part « goutte » reste claire : on passe d'un verre à l'autre en douceur
  float g = seule ? 1.0 : 0.0;
  if (!seule && type > 0.5 && type < 1.5 && uGoutte.w > 0.5) g = smoothstep(-24.0, 24.0, formeSeule(ici, p) - goutte(p));
  voile = mix(voile, 0.06, g);
  // normale : pente du champ de distance
  vec2 e = vec2(1.0, 0.0);
  vec2 n;
  if (seule) n = vec2(goutte(p + e.xy) - goutte(p - e.xy), goutte(p + e.yx) - goutte(p - e.yx));
  else n = vec2(forme(ici, p + e.xy) - forme(ici, p - e.xy), forme(ici, p + e.yx) - forme(ici, p - e.yx));
  n = normalize(n + 1e-5);
  // profil d'une lentille bombée : pente forte au bord, nulle au centre
  float biseau = mix(type > 2.5 ? 12.0 : (type > 1.5 ? 60.0 : 30.0), uGoutte.z*0.85, g);
  float x = clamp(1.0 + dIci / biseau, 0.0, 1.0);          // 1 au bord, 0 à l'intérieur
  float pente = x / sqrt(max(1.0 - x*x*0.985, 0.02));
  float force = mix(type > 2.5 ? 7.0 : (type > 1.5 ? 26.0 : 16.0), 24.0, g);
  vec2 dec = -n * pente * force;
  if (!seule) {
    vec4 r = uP[ici];
    vec2 ctr = r.xy + r.zw*0.5;
    dec += (ctr - p) * (type > 1.5 && type < 2.5 ? 0.28 : 0.035) * (1.0 - g);   // grossissement (fort dans la lentille)
  }
  dec += (uGoutte.xy - p) * 0.3 * g;                                           // la goutte grossit ce qu'elle couvre
  float flou = mix(type < 0.5 ? 2.2 : (type > 2.5 ? 1.5 : (type > 1.5 ? 0.0 : 1.9)), 0.0, g);
  vec3 c;
  c.r = fond(p + dec*1.07, flou).r;
  c.g = fond(p + dec, flou).g;
  c.b = fond(p + dec*0.93, flou).b;
  c = mix(c, vec3(1.0), voile);
  // reflet spéculaire sur le bord tourné vers la lumière, et un second, plus faible, à l'opposé
  vec2 L = normalize(uLum - p + 1e-4);
  float bord = pow(x, 5.0);
  float spec = pow(max(dot(n, L), 0.0), 2.5) * bord * 0.85 + pow(max(dot(n, -L), 0.0), 3.0) * bord * 0.25;
  c += vec3(spec);
  // filet clair qui dessine le contour, ombre intérieure en bas
  c = mix(c, vec3(1.0), smoothstep(1.4, 0.0, abs(dIci + 0.8)) * 0.6);
  c *= 1.0 - 0.07 * pow(x, 2.0) * max(n.y, 0.0);
  o = vec4(clamp(c, 0.0, 1.0), 1.0);
}`;

function compiler(gl, src, type) {
  const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
  return s;
}
function programme(gl, frag) {
  const p = gl.createProgram();
  gl.attachShader(p, compiler(gl, `#version 300 es\nin vec2 a; void main(){ gl_Position = vec4(a, 0.0, 1.0); }`, gl.VERTEX_SHADER));
  gl.attachShader(p, compiler(gl, frag, gl.FRAGMENT_SHADER));
  gl.bindAttribLocation(p, 0, 'a'); gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  const u = {}; const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < n; i++) { const nom = gl.getActiveUniform(p, i).name.replace(/\[0\]$/, ''); u[nom] = gl.getUniformLocation(p, nom); }
  return { p, u };
}
const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);

function texInitiales(gl, texte) {
  const c = document.createElement('canvas'); c.width = 2048; c.height = 1024;
  const g = c.getContext('2d');
  g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
  let t = 900;
  const police = (x) => `700 ${x}px -apple-system, "SF Pro Display", "Segoe UI Variable Display", "Segoe UI", system-ui, sans-serif`;
  g.font = police(t);
  while (g.measureText(texte).width > 1900 && t > 100) { t -= 20; g.font = police(t); }
  g.fillText(texte, 1024, 560);
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return tex;
}

export function lancer({ canvas, F, d, reduit, etat }) {
  const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, premultipliedAlpha: false, powerPreference: 'high-performance' });
  if (!gl) throw new Error('webgl2 indisponible');
  const petit = matchMedia('(max-width: 760px)').matches || matchMedia('(pointer: coarse)').matches;
  let dpr = Math.min(window.devicePixelRatio || 1, petit ? 1.5 : 2);
  const echelleFond = 0.5;

  const pF = programme(gl, FOND), pE = programme(gl, ECRAN);
  const vbo = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const texIni = texInitiales(gl, (d.initiales || '').toUpperCase());
  let fbo = null, texFond = null, fl = 0, fh = 0;
  const preparerFbo = () => {
    if (fbo) { gl.deleteFramebuffer(fbo); gl.deleteTexture(texFond); }
    texFond = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, texFond);
    gl.texStorage2D(gl.TEXTURE_2D, 1 + Math.floor(Math.log2(Math.max(fl, fh))), gl.RGBA8, fl, fh);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    fbo = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texFond, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  };

  let L = 1, H = 1, hautDoc = 1;
  let redessiner = null; // mouvement réduit : un rendu à la demande (un canevas redimensionné est effacé)
  const accueil = document.getElementById('accueil');
  const carte = document.querySelector('.carte-heros');
  let iniRect = [0, 0, 1, 1];
  const bulles = new Float32Array(14 * 4);
  const mesurer = () => {
    L = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = Math.round(L * dpr); canvas.height = Math.round(H * dpr);
    const nl = Math.max(2, Math.round(L * echelleFond * Math.min(dpr, 1.5))), nh = Math.max(2, Math.round(H * echelleFond * Math.min(dpr, 1.5)));
    if (nl !== fl || nh !== fh) { fl = nl; fh = nh; preparerFbo(); }
    hautDoc = document.documentElement.scrollHeight;
    const r = accueil.getBoundingClientRect();
    // initiales : débordent de la carte sur ordinateur (le bord du verre les tord) ; au-dessus de la carte sur téléphone
    const rc = carte.getBoundingClientRect();
    if (L > 760) { const larg = Math.min(L * 1.15, 1900); iniRect = [L / 2 - larg / 2, r.top + scrollY + r.height * 0.5 - larg * 0.27, larg, larg * 0.5]; }
    else { const larg = L * 1.3; const haut = rc.top + scrollY - (r.top + scrollY); iniRect = [L / 2 - larg / 2, r.top + scrollY + Math.max(60, haut * 0.5 + 10) - larg * 0.25, larg, larg * 0.5]; }
    // bulles réparties sur toute la hauteur de la page, au hasard mais toujours au même endroit
    let s = 7;
    const hasard = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 14; i++) {
      bulles[i * 4] = 0.06 + hasard() * 0.88;
      bulles[i * 4 + 1] = (i + 0.3 + hasard() * 0.6) / 14 * hautDoc;
      bulles[i * 4 + 2] = (petit ? 16 : 24) + hasard() * (petit ? 46 : 80);
      bulles[i * 4 + 3] = hasard();
    }
    redessiner?.();
  };
  mesurer();
  addEventListener('resize', mesurer);
  new ResizeObserver(mesurer).observe(document.getElementById('contenu'));

  // panneaux de verre : leur rayon et leur type, lus une fois ; l'apparition suit un ressort
  const panneaux = [...document.querySelectorAll('[data-verre]')].map((el) => ({
    el, type: { heros: 1, lentille: 2, bouton: 3 }[el.dataset.verre] ?? 0,
    rayon: parseFloat(getComputedStyle(el).borderTopLeftRadius) || 24,
    voile: { heros: 0.44, lentille: 0.05, bouton: 0.5 }[el.dataset.verre] ?? 0.5,
    a: reduit ? 1 : 0, v: 0, vu: false,
  }));
  const io = new IntersectionObserver((es) => { for (const e of es) if (e.isIntersecting) { const p = panneaux.find((x) => x.el === e.target); if (p) p.vu = true; } }, { rootMargin: '0px 0px -6% 0px' });
  panneaux.forEach((p) => io.observe(p.el));

  // la goutte
  const G = { x: 0, y: 0, vx: 0, vy: 0, r: petit ? 46 : 72, pret: false };
  const P = new Float32Array(14 * 4), Q = new Float32Array(14 * 4);
  let t = 0, prec = performance.now(), lumX = L * 0.3, lumY = -200;
  const sonde = (window.__verre = { images: 0 });

  function image(now) {
    const dt = Math.min(0.05, (now - prec) / 1000); prec = now;
    if (!reduit) t += dt;
    const sy = scrollY;
    // goutte : repos près du coin de la carte, suit le geste dans l'accueil
    const rc = carte.getBoundingClientRect();
    const repos = [rc.right - G.r * 0.35 + Math.sin(t * 0.7) * 10, rc.top + G.r * 0.25 + Math.cos(t * 0.9) * 8];
    let cible = repos;
    const ra = accueil.getBoundingClientRect();
    if (etat.pointeur && etat.pointeur[1] > ra.top && etat.pointeur[1] < ra.bottom && !reduit) cible = etat.pointeur;
    // téléphone : la goutte flotte au-dessus de la carte, dans les initiales, et vient s'y fondre de temps en temps
    else if (petit && !reduit) cible = [L / 2 + L * 0.3 * Math.sin(t * 0.31), rc.top - G.r * 1.6 + Math.max(0, Math.sin(t * 0.47)) * G.r * 1.9 - Math.cos(t * 0.23) * 40];
    if (!G.pret) { G.x = repos[0]; G.y = repos[1]; G.pret = true; }
    if (reduit) { G.x = repos[0]; G.y = repos[1]; G.vx = G.vy = 0; }
    else {
      G.vx += ((cible[0] - G.x) * 60 - G.vx * 9) * dt; G.vy += ((cible[1] - G.y) * 60 - G.vy * 9) * dt;
      G.x += G.vx * dt; G.y += G.vy * dt;
    }
    // lumière : souris, ou inclinaison, ou lente course
    let lx, ly;
    if (etat.inclinaison) { lx = L * (0.5 + etat.inclinaison[0] * 0.9); ly = H * (0.5 + etat.inclinaison[1] * 0.9); }
    else if (etat.pointeur && !petit) { lx = etat.pointeur[0]; ly = etat.pointeur[1]; }
    else { lx = L * (0.5 + 0.45 * Math.sin(t * 0.4 + sy * 0.002)); ly = H * (0.2 + 0.3 * Math.cos(t * 0.3)); }
    lumX += (lx - lumX) * 0.12; lumY += (ly - lumY) * 0.12;

    // panneaux visibles
    let n = 0;
    for (const p of panneaux) {
      if (p.vu && !reduit) { p.v += ((1 - p.a) * 140 - p.v * 13) * dt; p.a = Math.max(0, p.a + p.v * dt); }
      else if (p.vu) p.a = 1;
      const r = p.el.getBoundingClientRect();
      if (n >= 14 || r.bottom < -40 || r.top > H + 40 || r.width < 2 || p.a < 0.01) continue;
      P.set([r.left, r.top, r.width, r.height], n * 4);
      Q.set([p.type === 2 ? Math.min(r.width, r.height) / 2 : p.rayon, p.type, p.voile, Math.min(p.a, 1.06)], n * 4);
      n++;
    }
    const gVis = ra.bottom > 0 && ra.top < H;

    // passe 1 : le fond
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo); gl.viewport(0, 0, fl, fh);
    gl.useProgram(pF.p); const u = pF.u;
    gl.uniform2f(u.uTaille, L, H); gl.uniform2f(u.uRes, fl, fh);
    gl.uniform1f(u.uT, t); gl.uniform1f(u.uDefil, sy); gl.uniform1f(u.uHautDoc, hautDoc);
    gl.uniform3fv(u.uBase, rgb(F.fond)); gl.uniform3fv(u.uL0, rgb(F.lumieres[0])); gl.uniform3fv(u.uL1, rgb(F.lumieres[1]));
    gl.uniform3fv(u.uL2, rgb(F.lumieres[2])); gl.uniform3fv(u.uL3, rgb(F.lumieres[3])); gl.uniform3fv(u.uIniCouleur, rgb(F.initiales));
    gl.uniform4f(u.uIniRect, ...iniRect); gl.uniform4fv(u.uBulles, bulles);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, texIni); gl.uniform1i(u.uIni, 1);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindTexture(gl.TEXTURE_2D, texFond); gl.generateMipmap(gl.TEXTURE_2D);

    // passe 2 : l'écran
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(pE.p); const v = pE.u;
    gl.uniform2f(v.uTaille, L, H); gl.uniform1f(v.uDpr, canvas.width / L); gl.uniform1f(v.uT, t);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texFond); gl.uniform1i(v.uFond, 0);
    gl.uniform1i(v.uN, n); gl.uniform4fv(v.uP, P); gl.uniform4fv(v.uQ, Q);
    gl.uniform4f(v.uGoutte, G.x, G.y, G.r, gVis ? 1 : 0); gl.uniform2f(v.uGv, G.vx, G.vy); gl.uniform2f(v.uLum, lumX, lumY);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    sonde.images++;
  }

  let actif = true;
  document.addEventListener('visibilitychange', () => { actif = !document.hidden; prec = performance.now(); });
  if (reduit) {
    let attente = false;
    redessiner = () => { if (attente) return; attente = true; requestAnimationFrame((n) => { attente = false; image(n); }); };
    addEventListener('scroll', redessiner, { passive: true }); addEventListener('resize', redessiner);
    for (const p of panneaux) p.a = 1;
    // les panneaux arrivent aussi par le défilement : un rendu par image suffit tant que ça bouge
    image(performance.now());
  } else {
    const boucle = (now) => { if (actif) image(now); requestAnimationFrame(boucle); };
    requestAnimationFrame(boucle);
  }
  document.documentElement.classList.add('gl');
}
