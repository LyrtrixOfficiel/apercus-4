// Le ciel : aurores boreales en shader WebGL, plein ecran, rendu a basse
// resolution (une aurore est floue par nature) puis agrandi par le navigateur.
// Rien ne suit le pointeur : un toucher (ou un clic) fait seulement courir une onde
// dans l'aurore, la ou il a eu lieu. Couleurs : palette de js/univers.js.

const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0., 1.); }`;

const FRAG = `
precision mediump float;
uniform vec2 uR;      // taille du tampon
uniform float uT;     // temps (s)
uniform vec4 uOnde;   // toucher : x, y en 0..1 (y vers le haut), age (s), force
uniform float uS;     // avancement dans la page, 0 en haut, 1 en bas
uniform float uI;     // intensite generale des aurores
uniform vec3 uNuitH, uNuitB, uHorizon, uFrange;
uniform vec3 uR1a, uR1b, uR2a, uR2b, uR3a, uR3b;

float h21(vec2 p){ p = fract(p * vec2(233.34, 851.73)); p += dot(p, p + 23.45); return fract(p.x * p.y); }
float n2(vec2 p){
  vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y);
}
float fbm(vec2 p){
  float v = 0., a = .5;
  for (int i = 0; i < 4; i++) { v += a * n2(p); p = mat2(1.6, 1.2, -1.2, 1.6) * p + 3.1; a *= .5; }
  return v;
}

// Un rideau d'aurore : un pied qui ondule, des rayons legerement inclines,
// un corps qui s'efface vers le haut a une hauteur variable, une frange vive en bas.
vec3 rideau(vec2 p, float t, float k, float seed, vec3 cBas, vec3 cHaut, float haut, float ampl){
  float x = p.x * k + seed;
  float w = fbm(vec2(x * .45 + t * .02, seed + t * .012));
  float base = haut + (w - .5) * ampl * 1.5 + sin(x * 1.1 + t * .07 + seed) * ampl * .22;
  float d = p.y - base;
  float incline = (n2(vec2(x * .7, seed)) - .5) * .9;
  float u = x + d * incline + w * 1.2;
  float r1 = n2(vec2(u * 17., t * .06 + seed));
  float r2 = n2(vec2(u * 5.5, t * .03 - seed));
  float r3 = n2(vec2(u * 46., t * .05 + seed * 2.));
  // des rayons fins et nets dans le rideau, comme sur les photographies d'aurores
  float rayons = .2 + 1.15 * r1 * r1 * (.45 + .9 * r2) + .55 * r3 * r3 * r3 * (.3 + r2);
  float H = .1 + .32 * n2(vec2(x * 1.3 + seed, t * .025));
  float corps = exp(-max(d, 0.) / H) * smoothstep(-.03, .035, d);
  float frange = exp(-d * d * 1400.) * .55;
  float dessous = exp(-max(-d, 0.) * 22.) * .16;
  float pli = .6 + .4 * sin(x * 5. + w * 14. + t * .3);
  vec3 c = mix(cBas, cHaut, smoothstep(.02, .3, d));
  return c * ((corps * rayons + frange) * pli + dessous * pli) + uFrange * exp(-(d + .03) * (d + .03) * 900.) * .07 * pli;
}

void main(){
  vec2 uv = gl_FragCoord.xy / uR;
  float asp = uR.x / uR.y;
  float portrait = step(asp, 1.);
  vec2 p = vec2((uv.x - .5) * mix(asp, asp * 1.45, portrait), uv.y);
  float t = uT, s = uS;

  // L'onde d'un toucher : un anneau qui s'elargit, plie un peu les rideaux et les avive a son passage.
  vec2 e = (uv - uOnde.xy) * vec2(asp, 1.);
  float de = length(e), age = uOnde.z;
  float anneau = exp(-pow((de - age * .42) * 9., 2.)) * exp(-age * 1.3) * uOnde.w;
  p += normalize(e + 1e-4) * anneau * .035;

  // Ciel de nuit, un peu plus clair a l'horizon.
  vec3 col = mix(uNuitB, uNuitH, uv.y);
  col += uHorizon * exp(-uv.y * 4.);

  // Les aurores montent un peu en descendant dans la page.
  float monte = s * .22;
  vec3 A = rideau(p - vec2(0., monte), t, 1., 0., uR1a, uR1b, mix(.76, .74, portrait), .4) * .95;
  A += rideau(p - vec2(0., monte), t * 1.12, 1.55, 7.3, uR2a, uR2b, mix(.85, .84, portrait), .36) * .55;
  A += rideau(p - vec2(0., monte), t * .86, .72, 13.1, uR3a, uR3b, mix(.68, .66, portrait), .45) * .42;
  A *= 1. + anneau * 1.6;
  // Dans les sections, les aurores se retirent vers le haut de l'ecran : le texte reste lisible.
  float retrait = smoothstep(.015, .1, s) * (1. - smoothstep(.88, .99, s));
  A *= mix(1., smoothstep(.5, 1., uv.y), retrait);

  col += A * uI;
  col += uFrange * anneau * .05;

  // Vignettage doux, compression des hautes lumieres, grain contre les bandes.
  vec2 v = (uv - .5) * vec2(1.05, 1.25);
  col *= 1. - .38 * dot(v, v) * 1.6;
  col = 1. - exp(-col * 1.3);
  col += (h21(gl_FragCoord.xy + fract(t * 7.)) - .5) / 200.;
  gl_FragColor = vec4(col, 1.);
}`;

export function demarrerCiel(canvas, { petit, palette }) {
  let gl;
  try { gl = canvas.getContext('webgl', { antialias: false, alpha: false, depth: false, stencil: false, powerPreference: 'low-power', preserveDrawingBuffer: false }); } catch { gl = null; }
  if (!gl) return null;

  const shader = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(s)); return null; } return s; };
  const vs = shader(gl.VERTEX_SHADER, VERT), fs = shader(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return null;
  const prog = gl.createProgram(); gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = {}; for (const n of ['uR', 'uT', 'uOnde', 'uS', 'uI', 'uNuitH', 'uNuitB', 'uHorizon', 'uFrange', 'uR1a', 'uR1b', 'uR2a', 'uR2b', 'uR3a', 'uR3b']) U[n] = gl.getUniformLocation(prog, n);
  const G = palette.gl;
  gl.uniform3fv(U.uNuitH, G.nuit[0]); gl.uniform3fv(U.uNuitB, G.nuit[1]); gl.uniform3fv(U.uHorizon, G.horizon); gl.uniform3fv(U.uFrange, G.frange);
  [['uR1a', 'uR1b'], ['uR2a', 'uR2b'], ['uR3a', 'uR3b']].forEach(([a, b], i) => { gl.uniform3fv(U[a], G.rideaux[i][0]); gl.uniform3fv(U[b], G.rideaux[i][1]); });

  // Echelle de rendu : 0.6 du pixel CSS sur ordinateur, 0.5 sur telephone ; baisse si les images ralentissent.
  let echelle = petit ? 0.5 : 0.6, largeur = 0, hauteur = 0;
  function taille(force) {
    const w = innerWidth, h = innerHeight;
    if (!force && w === largeur && Math.abs(h - hauteur) < 140) return;
    largeur = w; hauteur = h;
    const k = Math.min(echelle, 1000 / w);
    canvas.width = Math.max(64, Math.round(w * k)); canvas.height = Math.max(64, Math.round(h * k));
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  taille(true);

  let perdu = false;
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); perdu = true; });

  // Mesure des images : si la moyenne depasse ~22 ms, on reduit la resolution (jamais sous 0.44 sur ordinateur, 0.3 sur telephone : les rayons restent nets).
  let cumul = 0, nb = 0, dernier = 0;
  function dessiner(t, onde, avance, intensite) {
    if (perdu) return;
    taille(false);
    gl.uniform2f(U.uR, canvas.width, canvas.height);
    gl.uniform1f(U.uT, t);
    gl.uniform4f(U.uOnde, onde[0], onde[1], onde[2], onde[3]);
    gl.uniform1f(U.uS, avance);
    gl.uniform1f(U.uI, intensite);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    const maintenant = performance.now();
    if (dernier && maintenant - dernier < 100) { cumul += maintenant - dernier; nb++; }
    dernier = maintenant;
    if (nb === 90) { if (cumul / nb > 22 && echelle > (petit ? 0.3 : 0.44) && !window.__bride) { echelle *= 0.85; taille(true); } cumul = 0; nb = 0; }
  }
  const pret = () => new Promise((ok) => { try { gl.finish(); } catch {} requestAnimationFrame(() => ok()); });
  return { dessiner, pret, taille: () => taille(true) };
}
