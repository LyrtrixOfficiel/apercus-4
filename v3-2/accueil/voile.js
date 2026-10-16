// Le voile de l'ouverture : une soie d'encre qui coule lentement, aux couleurs du premier univers du praticien,
// puis qui s'ouvre depuis le centre, bord déchiré et lisière de lumière, sur la page. WebGL 1, sans bibliothèque.
// Rendu à demi-définition (la soie est floue par nature) : quelques dixièmes de milliseconde par image sur téléphone.
// Renvoie null si WebGL manque : la page passe alors par l'ouverture en CSS (masque radial).

const SOMMETS = 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0., 1.); }';
const SOIE = `precision mediump float;
uniform vec2 r; uniform float t; uniform float o; uniform vec3 c0; uniform vec3 c1; uniform vec3 c2; uniform vec2 cc; uniform float rm;
float h(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float n(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3. - 2. * f);
  return mix(mix(h(i), h(i + vec2(1., 0.)), u.x), mix(h(i + vec2(0., 1.)), h(i + vec2(1., 1.)), u.x), u.y); }
float fbm(vec2 p){ float s = 0., a = .5; for (int k = 0; k < 4; k++) { s += a * n(p); p = p * 2.02 + vec2(1.7, 9.2); a *= .5; } return s; }
void main(){
  vec2 uv = gl_FragCoord.xy / r;
  float asp = r.x / r.y;
  vec2 p = (uv - .5) * vec2(asp, 1.);
  float tt = t * .05;
  vec2 q = vec2(fbm(p * 1.4 + vec2(tt, -tt)), fbm(p * 1.4 + vec2(5.2, 1.3) - tt));
  vec2 w = vec2(fbm(p * 1.2 + 2.4 * q + vec2(1.7, 9.2) + .6 * tt), fbm(p * 1.2 + 2.4 * q + vec2(8.3, 2.8) - .4 * tt));
  float f = fbm(p * 1.1 + 2.6 * w);
  float flux = smoothstep(.18, .85, f);
  // plis de satin : une étoffe en biais, déformée par le flux, éclairée de côté
  float s = sin(7.5 * (p.x * .55 + p.y * .95) + 6.5 * w.x + 3.5 * q.y - t * .2);
  float pli = .5 + .5 * s;
  float reflet = pow(pli, 16.) * (.35 + .65 * flux);
  float brillance = pow(pli, 4.) * flux;
  float ombre = pow(1. - pli, 3.);
  float clair = step(.5, dot(c0, vec3(.299, .587, .114)));
  vec3 corps = mix(c0, mix(c0, c1, mix(.78, .62, clair)), flux);
  corps = mix(corps, mix(c0, c2, .7), smoothstep(.45, .9, w.y) * flux * .55);
  vec3 col = corps + (pli - .5) * mix(.22, .12, clair);
  col -= ombre * mix(.16, .1, clair) * (.4 + .6 * flux);
  col += brillance * mix(c1, vec3(1.), .25) * mix(.34, .1, clair);
  col += reflet * mix(mix(c1, c2, .4), vec3(1.), .45) * mix(.85, .35, clair);
  // bande calme derrière la salutation (le texte garde son contraste), la matière vit tout autour
  float bande = 1. - smoothstep(.06, .3, abs(p.y + .02) - .02 * sin(p.x * 6. + t * .3));
  col = mix(col, c0, bande * .78);
  col += (h(gl_FragCoord.xy + fract(t) * 100.) - .5) * .022;
  // le voile s'ouvre depuis la place du titre (cc) : la salutation arrive sur la page qui apparaît sous elle
  float d = length((p - cc) * vec2(.9, 1.)) + (fbm(p * 3.2 + 7.) - .5) * .42;
  float R = o * (rm + .55) - .35;
  float a = smoothstep(R - .015, R + .05, d);
  float lis = (1. - smoothstep(0., .06, abs(d - R - .02))) * step(.0005, o) * (1. - smoothstep(.82, 1., o));
  col = mix(col, c1 + .22, lis * .85);
  a = max(a, lis * .9);
  gl_FragColor = vec4(col * a, a);
}`;

const versRVB = (h) => { const m = String(h).replace('#', ''); return [0, 2, 4].map((i) => parseInt(m.slice(i, i + 2), 16) / 255); };
const doux = (x) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);

export function voile(canvas, { reduit = false, depart: initiales = null, premiere = null } = {}) {
  let gl;
  try { gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, powerPreference: 'low-power' }); } catch { gl = null; }
  if (!gl) return null;
  const shader = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null; };
  const vs = shader(gl.VERTEX_SHADER, SOMMETS), fs = shader(gl.FRAGMENT_SHADER, SOIE);
  if (!vs || !fs) return null;
  const prog = gl.createProgram();
  gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = Object.fromEntries(['r', 't', 'o', 'c0', 'c1', 'c2', 'cc', 'rm'].map((k) => [k, gl.getUniformLocation(prog, k)]));
  gl.clearColor(0, 0, 0, 0);

  const mobile = Math.min(innerWidth, innerHeight) < 700;
  const echelle = mobile ? 0.5 : 0.6;
  const taille = () => {
    const l = Math.max(1, Math.round(canvas.clientWidth * echelle)), h = Math.max(1, Math.round(canvas.clientHeight * echelle));
    if (canvas.width !== l || canvas.height !== h) { canvas.width = l; canvas.height = h; gl.viewport(0, 0, l, h); }
  };
  let couleurs = initiales ? initiales.map(versRVB) : [[0.08, 0.07, 0.06], [0.23, 0.19, 0.16], [0.35, 0.29, 0.23]], depart = couleurs, cible = couleurs, tc0 = 0, tcDuree = 1;
  let ouvert = 0, to0 = 0, toDuree = 1, ouvrant = false, finOuverture = null;
  let vivant = true, raf = 0, centre = [0, 0], rayonMax = 1.6, dessinee = false;
  const debut = performance.now();
  const vitesse = reduit ? 0.5 : 1;

  function image(now) {
    if (!vivant) return;
    taille();
    const k = Math.min(1, (now - tc0) / tcDuree);
    couleurs = cible.map((c, i) => c.map((v, j) => depart[i][j] + (v - depart[i][j]) * doux(k)));
    if (ouvrant) {
      const x = Math.min(1, (now - to0) / toDuree);
      ouvert = doux(x);
      if (x >= 1) { ouvrant = false; const f = finOuverture; finOuverture = null; f && f(); }
    }
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(U.r, canvas.width, canvas.height);
    gl.uniform1f(U.t, ((now - debut) / 1000) * vitesse + 12.0);
    gl.uniform1f(U.o, ouvert);
    gl.uniform3fv(U.c0, couleurs[0]); gl.uniform3fv(U.c1, couleurs[1]); gl.uniform3fv(U.c2, couleurs[2]);
    gl.uniform2f(U.cc, centre[0], centre[1]); gl.uniform1f(U.rm, rayonMax);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (!dessinee) { dessinee = true; premiere && premiere(); }
    raf = requestAnimationFrame(image);
  }
  raf = requestAnimationFrame(image);

  return {
    /** Prend les couleurs [fond, accent, accent2] en `ms` millisecondes. */
    teinter(hex, ms = 600) { depart = couleurs; cible = hex.map(versRVB); tc0 = performance.now(); tcDuree = Math.max(1, ms); },
    /** Ouvre le voile depuis le point (x, y) en pixels de la fenêtre ; la promesse se résout une fois ouvert. */
    ouvrir(ms = 1200, x = innerWidth / 2, y = innerHeight / 2) {
      const asp = innerWidth / innerHeight;
      centre = [(x / innerWidth - 0.5) * asp, 0.5 - y / innerHeight];
      rayonMax = Math.max(...[[0, 0], [innerWidth, 0], [0, innerHeight], [innerWidth, innerHeight]].map(([cx, cy]) => Math.hypot(((cx - x) / innerWidth) * asp * 0.9, (cy - y) / innerHeight)));
      return new Promise((resoudre) => {
        if (ouvrant) { toDuree = Math.min(toDuree, (performance.now() - to0) + ms); finOuverture = resoudre; return; }
        ouvrant = true; to0 = performance.now(); toDuree = ms; finOuverture = resoudre;
      });
    },
    detruire() {
      vivant = false; cancelAnimationFrame(raf);
      try { gl.getExtension('WEBGL_lose_context')?.loseContext(); } catch {}
    },
  };
}
