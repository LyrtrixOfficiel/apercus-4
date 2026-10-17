// Institut : la creme. Une surface de creme cosmetique en gros plan, calculee sur le processeur graphique
// (WebGL2, sans bibliotheque) : une grille de hauteurs sculptee a la spatule, que le doigt ou la souris
// creuse et etire (advection + compression : la matiere poussee s'entasse en bourrelets, le sillon se creuse),
// puis qui se repose lentement. L'huile doree (les initiales) flotte dessus et se laisse etaler pareil.
// Rendu : normales lissees (bicubique), lumiere de studio (deux boites a lumiere et un bandeau), diffusion
// sous la surface, reflets nets de l'huile, grain de pellicule.

const VS = `#version 300 es
in vec2 aPos; out vec2 vUv;
void main(){ vUv = aPos * .5 + .5; gl_Position = vec4(aPos, 0., 1.); }`;

const COMMUN = `#version 300 es
precision highp float;
precision highp int;
float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vbruit(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y); }
float fbm(vec2 p){ float s = 0., a = .5; for (int i = 0; i < 4; i++){ s += a * vbruit(p); p = p * 2.03 + vec2(1.7, 9.2); a *= .5; } return s; }
vec4 empaque(float h, float o, float w){ h = clamp(h, 0., 1.); float a = floor(h * 255.) / 255.; return vec4(a, fract(h * 255.), clamp(o, 0., 1.), w); }
float hauteur(vec4 c){ return c.r + c.g / 255.; }
`;

// Etat initial : un lit de creme epais, puis des traits de spatule (bande aplatie striee, bourrelets sur
// les bords, levre de matiere au bout du geste).
const FS_INIT = COMMUN + `
uniform vec2 uTaille; uniform float uGraine;
uniform vec2 uP[144]; uniform vec4 uS[6]; uniform int uNb;
out vec4 sortie;
void main(){
  vec2 x = gl_FragCoord.xy;
  float m = min(uTaille.x, uTaille.y);
  vec2 c = (x - .5 * uTaille) / m;
  float g = uGraine;
  float h = .52 + .12 * (fbm(c * 2.1 + g) - .5) + .04 * (fbm(c * 7. - g) - .5);
  for (int k = 0; k < 6; k++){
    if (k >= uNb) break;
    vec4 S = uS[k]; int n = int(S.w);
    float best = 1e9, bs = 0., bb = 0., acc = 0.;
    for (int i = 0; i < 23; i++){
      if (i >= n - 1) break;
      vec2 a = uP[k * 24 + i], b = uP[k * 24 + i + 1];
      vec2 ba = b - a, pa = c - a; float l = max(length(ba), 1e-5);
      float t = clamp(dot(pa, ba) / (l * l), 0., 1.);
      float dist = length(pa - ba * t);
      if (dist < best){ best = dist; bs = acc + t * l; bb = sign(ba.x * pa.y - ba.y * pa.x + 1e-6) * dist; }
      acc += l;
    }
    float L = acc, fk = float(k);
    float W = S.x * (.80 + .40 * vbruit(vec2(bs * 2.4, fk * 7.1)));
    float e = abs(bb) / W;
    float debut = smoothstep(0., .14, bs);
    float masque = (1. - smoothstep(.78, 1., e)) * debut;
    float stries = sin(bb / W * S.z + 2.4 * vbruit(vec2(bs * 2.6, bb * 18.))) * (.6 + .4 * vbruit(vec2(bs * 9., fk)));
    float appui = .5 + .5 * sin(bs * 2.1 + fk * 1.7);
    float dedans = .27 + .07 * vbruit(vec2(bs * 3.2, fk)) + .03 * stries * vbruit(vec2(bs * 1.7, fk + 9.)) + .06 * appui * (1. - e * e);
    h = mix(h, dedans, masque);
    float cote = 1.;
    float bourrelet = S.y * cote * (.65 + .7 * vbruit(vec2(bs * 4.5, fk + 3.))) * pow(max(0., 1. - abs(abs(bb) - W * .97) / (.26 * W)), 1.6);
    h += bourrelet * debut;
    h += S.y * 1.3 * exp(-pow((bs - L) / (.38 * W), 2.)) * (1. - smoothstep(.45, 1.05, e));
  }
  sortie = empaque(h, 0., 1.);
}`;

// Un pas de simulation : le doigt (position, vitesse) pousse la matiere.
const FS_PAS = COMMUN + `
uniform sampler2D uEtat; uniform sampler2D uRepos;
uniform vec2 uTaille; uniform vec4 uB; uniform vec4 uF; uniform float uRelax;
out vec4 sortie;
vec2 vitesse(vec2 x){
  if (uF.z < .5) return vec2(0.);
  vec2 d = x - uB.xy; float r2 = dot(d, d) / (uF.x * uF.x);
  if (r2 > 9.) return vec2(0.);
  float g = exp(-r2);
  vec2 v = uB.zw; float sp = length(v);
  vec2 n = sp > 1e-4 ? vec2(-v.y, v.x) / sp : vec2(0.);
  float lat = dot(d, n) / uF.x;
  return v * g * (1. + uF.w * sin(lat * 8.5)) + d / uF.x * uF.y * g;
}
vec4 lire(ivec2 p){ return texelFetch(uEtat, clamp(p, ivec2(0), ivec2(uTaille) - 1), 0); }
vec2 bilin(vec2 x){
  vec2 q = x - .5; vec2 f = fract(q); ivec2 i = ivec2(floor(q));
  vec4 a = lire(i), b = lire(i + ivec2(1, 0)), c = lire(i + ivec2(0, 1)), d = lire(i + ivec2(1, 1));
  vec2 A = vec2(hauteur(a), a.b), B = vec2(hauteur(b), b.b), C = vec2(hauteur(c), c.b), D = vec2(hauteur(d), d.b);
  return mix(mix(A, B, f.x), mix(C, D, f.x), f.y);
}
void main(){
  vec2 x = gl_FragCoord.xy; ivec2 p = ivec2(x);
  vec2 u = vitesse(x);
  float pres = 0.;
  vec2 ho;
  if (dot(u, u) > 1e-8){
    float dv = .5 * ((vitesse(x + vec2(1, 0)).x - vitesse(x - vec2(1, 0)).x) + (vitesse(x + vec2(0, 1)).y - vitesse(x - vec2(0, 1)).y));
    ho = bilin(x - u);
    ho.x *= 1. - clamp(dv, -.5, .5);
    ho.y *= 1. - clamp(dv * .7, -.5, .5);
    pres = clamp(length(u) * 2., 0., 1.);
  } else {
    vec4 c = lire(p); ho = vec2(hauteur(c), c.b);
  }
  // lissage local (la ou le doigt passe) et repos tres lent vers la creme d'origine
  vec4 n0 = lire(p + ivec2(1, 0)), n1 = lire(p - ivec2(1, 0)), n2 = lire(p + ivec2(0, 1)), n3 = lire(p - ivec2(0, 1));
  float lap = hauteur(n0) + hauteur(n1) + hauteur(n2) + hauteur(n3) - 4. * hauteur(lire(p));
  ho.x += lap * .06 * pres;
  vec4 r = texelFetch(uRepos, p, 0);
  ho.x += (hauteur(r) - ho.x) * uRelax;
  ho.y += (r.b - ho.y) * uRelax;
  sortie = empaque(clamp(ho.x, .03, .99), ho.y, 1.);
}`;

// Copie (pour garder la creme d'origine) et pose de l'huile (masque des initiales).
const FS_HUILE = COMMUN + `
uniform sampler2D uEtat; uniform sampler2D uMasque; uniform vec2 uTaille; uniform float uForce;
out vec4 sortie;
void main(){
  vec4 s = texelFetch(uEtat, ivec2(gl_FragCoord.xy), 0);
  float m = texture(uMasque, gl_FragCoord.xy / uTaille).a;
  s.b = max(s.b, m * uForce);
  sortie = s;
}`;

// Derivees : pente (Sobel), creux (occlusion), huile. Stockees en demi-flottants si possible.
const FS_DERIVE = COMMUN + `
uniform sampler2D uEtat; uniform vec2 uTaille; uniform float uZ; uniform int uCode;
out vec4 sortie;
float H(ivec2 p){ return hauteur(texelFetch(uEtat, clamp(p, ivec2(0), ivec2(uTaille) - 1), 0)); }
void main(){
  ivec2 p = ivec2(gl_FragCoord.xy);
  float tl = H(p + ivec2(-1, 1)), t = H(p + ivec2(0, 1)), tr = H(p + ivec2(1, 1));
  float l = H(p + ivec2(-1, 0)), c = H(p), r = H(p + ivec2(1, 0));
  float bl = H(p + ivec2(-1, -1)), b = H(p + ivec2(0, -1)), br = H(p + ivec2(1, -1));
  float gx = ((tr + 2. * r + br) - (tl + 2. * l + bl)) / 8. * uZ;
  float gy = ((tl + 2. * t + tr) - (bl + 2. * b + br)) / 8. * uZ;
  float moy = (H(p + ivec2(4, 0)) + H(p + ivec2(-4, 0)) + H(p + ivec2(0, 4)) + H(p + ivec2(0, -4))
    + H(p + ivec2(3, 3)) + H(p + ivec2(-3, 3)) + H(p + ivec2(3, -3)) + H(p + ivec2(-3, -3))) / 8.;
  float creux = clamp((moy - c) * uZ * .09 + .5, 0., 1.);
  float o = texelFetch(uEtat, p, 0).b;
  if (uCode == 1) sortie = vec4(atan(gx) / 3.14159265 + .5, atan(gy) / 3.14159265 + .5, creux, o);
  else sortie = vec4(gx, gy, creux, o);
}`;

// Rendu a l'ecran : camera au-dessus (legere perspective : chaque point voit le studio sous un angle
// different, comme un vrai macro), un diffuseur au plafond, une boite a lumiere, un bandeau.
const FS_RENDU = COMMUN + `
uniform sampler2D uD; uniform vec2 uTailleD; uniform int uCode;
uniform vec3 uCreme, uHuile, uSss, uCle, uAmb;
uniform float uTemps, uZoom, uExpo, uSombre, uDerive, uGrain, uAspect, uBrillance;
in vec2 vUv; out vec4 sortie;
vec4 brut(vec2 uv){ return texture(uD, uv); }
vec4 bicub(vec2 uv){
  vec2 st = uv * uTailleD - .5; vec2 i = floor(st), f = fract(st);
  vec2 w0 = (1. - f) * (1. - f) * (1. - f) / 6., w1 = (4. - 6. * f * f + 3. * f * f * f) / 6.;
  vec2 w2 = (1. + 3. * f + 3. * f * f - 3. * f * f * f) / 6., w3 = f * f * f / 6.;
  vec2 g0 = w0 + w1, g1 = w2 + w3, h0 = (w1 / g0) - .5 + i, h1 = (w3 / g1) + 1.5 + i;
  vec4 a = brut(vec2(h0.x, h0.y) / uTailleD), b = brut(vec2(h1.x, h0.y) / uTailleD);
  vec4 c = brut(vec2(h0.x, h1.y) / uTailleD), d = brut(vec2(h1.x, h1.y) / uTailleD);
  return g0.y * (g0.x * a + g1.x * b) + g1.y * (g0.x * c + g1.x * d);
}
vec2 pente(vec4 s){ return uCode == 1 ? tan((s.xy - .5) * 3.14159265 * .998) : s.xy; }
float boite(vec3 R, vec3 dir, vec2 demi, float flou){
  vec3 up = abs(dir.z) < .99 ? vec3(0, 0, 1) : vec3(0, 1, 0);
  vec3 bx = normalize(cross(up, dir)), by = cross(dir, bx);
  float c = dot(R, dir); if (c <= .05) return 0.;
  vec2 q = vec2(dot(R, bx), dot(R, by)) / c;
  vec2 e = smoothstep(demi + flou, demi - flou, abs(q));
  return e.x * e.y;
}
vec3 KEY; vec3 TOP; vec3 BANDE;
vec3 studio(vec3 R, float rugo){
  float f = .02 + rugo * .8;
  vec3 e = uAmb * (.12 + .5 * smoothstep(-.3, 1., R.z)) * mix(1., .45, uSombre);
  e += uCle * boite(R, TOP, vec2(.42, .30), f * 1.2) * 1.25;
  e += uCle * boite(R, KEY, vec2(.50, .28), f) * 2.6;
  e += uCle * boite(R, BANDE, vec2(.07, .80), f * .7) * 1.6;
  return e;
}
vec3 lin(vec3 c){ return pow(c, vec3(2.2)); }
void main(){
  float az = uDerive * (.20 * sin(uTemps * .19) + .07 * sin(uTemps * .47 + 1.3));
  float ca = cos(az), sa = sin(az);
  KEY = normalize(vec3(-.72 * ca + .45 * sa, .5 * ca + .72 * sa, .55));
  TOP = normalize(vec3(-.32 + .1 * sa, .38, 1.));
  BANDE = normalize(vec3(.86, -.12 + .1 * sa, .42));
  vec2 uv = .5 + (vUv - .5) / uZoom;
  vec4 s = bicub(uv);
  vec2 gr = pente(s);
  vec2 px = 1.3 / uTailleD;
  float o = s.a;
  float oc = smoothstep(.05, .42, o);
  vec2 og = vec2(brut(uv + vec2(px.x, 0)).a - brut(uv - vec2(px.x, 0)).a, brut(uv + vec2(0, px.y)).a - brut(uv - vec2(0, px.y)).a);
  // camera au-dessus du centre
  vec3 V = normalize(vec3(-(vUv.x - .5) * uAspect, -(vUv.y - .5), 1.55));
  vec3 alb = lin(uCreme), sss = lin(uSss), hu = lin(uHuile);
  float creux = clamp((s.b - .5) * 2.4, -1., 1.);
  float ao = 1. - .5 * clamp(creux, 0., 1.);
  // la creme : diffusion douce, ombres teintees (la lumiere passe un peu dans la matiere), vernis
  vec3 N = normalize(vec3(-gr, 1.));
  float ndl = dot(N, KEY);
  float dif = clamp((ndl + .62) / 1.62, 0., 1.);
  vec3 teinte = mix(sss, vec3(1.), smoothstep(.05, .9, dif));
  vec3 col = alb * teinte * (lin(uAmb) * (.40 + .22 * N.z) + lin(uCle) * dif * .9) * ao;
  float F = .045 + .955 * pow(1. - max(dot(N, V), 0.), 5.);
  vec3 R = reflect(-V, N);
  col += studio(R, mix(.24, .15, uSombre)) * F * uBrillance * (.45 + .55 * ao) * (1. - .85 * oc);
  // l'huile : film dore transparent, plus lisse, avec un menisque qui accroche la lumiere
  vec3 huN = hu / max(max(hu.r, hu.g), max(hu.b, 1e-3));
  vec3 T = pow(max(huN, vec3(.002)), vec3(.34 + .62 * o));
  vec3 No = normalize(vec3(-(gr * (1. - .55 * oc) + og * 2.6), 1.));
  vec3 Ro = reflect(-V, No);
  float Fo = .04 + .96 * pow(1. - max(dot(No, V), 0.), 5.);
  vec3 sous = col * T * 1.04 + hu * o * mix(.015, .32, uSombre);
  vec3 eclat = studio(Ro, .035) * (Fo * 2.4) + uCle * hu * .02;
  col = mix(col, sous + eclat, oc);
  col *= 1. - .14 * pow(length((vUv - .5) * vec2(1., .9)) * 1.35, 2.6);
  col = 1. - exp(-col * uExpo);
  col = pow(max(col, 0.), vec3(1. / 2.2));
  col += (hash(gl_FragCoord.xy + fract(uTemps * 7.3) * 91.7) - .5) * uGrain;
  sortie = vec4(col, 1.);
}`;

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
const melange = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);

// Traits de spatule, en coordonnees centrees sur l'ecran (petit cote = 1, y vers le haut).
const TRAITS = [
  { w: .19, b: .20, f: 13, p: [[-1.3, -.62], [-.8, -.36], [-.3, -.42], [.15, -.16], [.6, -.02], [1.0, -.12], [1.4, .06]] },
  { w: .16, b: .17, f: 11, p: [[1.35, .5], [.8, .34], [.3, .42], [-.2, .62], [-.7, .5], [-1.3, .64]] },
  { w: .13, b: .15, f: 10, p: [[-.55, 1.25], [-.25, .98], [.1, .9], [.38, 1.1], [.6, 1.0]] },
  { w: .15, b: .18, f: 12, p: [[.7, -1.25], [.3, -.98], [-.15, -1.02], [-.5, -.86], [-.75, -1.1]] },
  { w: .085, b: .13, f: 9, p: [[.62, -.52], [.86, -.36], [.82, -.12], [.6, -.16], [.55, -.33]] },
];
// Passages du doigt a l'ouverture (meme physique que le geste du visiteur) : sillons nets, bourrelets.
const GESTES = [
  { r: 30, a: .34, v: 1, p: [[-1.4, .2], [-.9, .12], [-.5, .24], [-.15, .1]] },
  { r: 26, a: .32, v: 1, p: [[1.4, -.3], [1.0, -.22], [.7, -.34], [.45, -.28], [.3, -.12], [.42, .02], [.58, -.06]] },
  { r: 22, a: .34, v: .9, p: [[-.3, -1.3], [-.36, -.9], [-.2, -.7], [-.32, -.55]] },
  { r: 34, a: .36, v: 1, p: [[.15, 1.35], [.3, .95], [.12, .74], [.32, .6]] },
];
function catmull(p, n) {
  const out = [];
  for (let k = 0; k < n; k++) {
    const t = (k / (n - 1)) * (p.length - 1), i = Math.min(p.length - 2, Math.floor(t)), u = t - i;
    const p0 = p[Math.max(0, i - 1)], p1 = p[i], p2 = p[i + 1], p3 = p[Math.min(p.length - 1, i + 2)];
    out.push([0, 1].map((j) => .5 * (2 * p1[j] + (-p0[j] + p2[j]) * u + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * u * u + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * u * u * u)));
  }
  return out;
}

export function demarrerCreme(toile, { petit = false, reduit = false } = {}) {
  const gl = toile.getContext('webgl2', { antialias: false, alpha: false, depth: false, stencil: false, premultipliedAlpha: false, powerPreference: 'high-performance', preserveDrawingBuffer: false });
  if (!gl) return null;
  const demi = !!gl.getExtension('EXT_color_buffer_float') || !!gl.getExtension('EXT_color_buffer_half_float');
  const code = demi ? 0 : 1;

  const prog = (fs) => {
    const p = gl.createProgram();
    for (const [t, src] of [[gl.VERTEX_SHADER, VS], [gl.FRAGMENT_SHADER, fs]]) {
      const s = gl.createShader(t); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(s)); return null; }
      gl.attachShader(p, s);
    }
    gl.bindAttribLocation(p, 0, 'aPos'); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) { console.warn(gl.getProgramInfoLog(p)); return null; }
    const u = {}; const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) { const a = gl.getActiveUniform(p, i); u[a.name.replace(/\[0\]$/, '')] = gl.getUniformLocation(p, a.name); }
    return { p, u };
  };
  const P = { init: prog(FS_INIT), pas: prog(FS_PAS), huile: prog(FS_HUILE), derive: prog(FS_DERIVE), rendu: prog(FS_RENDU) };
  if (Object.values(P).some((x) => !x)) return null;

  const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
  const vb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vb);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const cible = (w, h, interne, format, type, filtre) => {
    const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, interne, w, h, 0, format, type, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filtre); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filtre);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
    const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    return { t, f, w, h, ok };
  };
  const huit = (w, h) => cible(w, h, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, gl.NEAREST);
  let A, B, R, D, S = [0, 0], masque = null, graine = Math.random() * 50;
  let codeD = code;

  const tracer = (pr, sortie, w, h) => { gl.useProgram(pr.p); gl.bindFramebuffer(gl.FRAMEBUFFER, sortie ? sortie.f : null); gl.viewport(0, 0, w, h); };
  const lier = (pr, nom, tex, unite) => { gl.activeTexture(gl.TEXTURE0 + unite); gl.bindTexture(gl.TEXTURE_2D, tex); gl.uniform1i(pr.u[nom], unite); };
  const dessinerTri = () => gl.drawArrays(gl.TRIANGLES, 0, 3);
  const echanger = () => { const t = A; A = B; B = t; };

  function sculpter() {
    const pts = new Float32Array(144 * 2), par = new Float32Array(24);
    TRAITS.slice(0, 6).forEach((tr, k) => {
      const c = catmull(tr.p, 22);
      c.forEach(([x, y], i) => { pts[(k * 24 + i) * 2] = x; pts[(k * 24 + i) * 2 + 1] = y; });
      par.set([tr.w, tr.b, tr.f, c.length], k * 4);
    });
    tracer(P.init, A, S[0], S[1]);
    gl.uniform2f(P.init.u.uTaille, S[0], S[1]); gl.uniform1f(P.init.u.uGraine, graine);
    gl.uniform2fv(P.init.u.uP, pts); gl.uniform4fv(P.init.u.uS, par); gl.uniform1i(P.init.u.uNb, Math.min(6, TRAITS.length));
    dessinerTri();
    for (const g of GESTES) trait(g.p, g.r, g.a, g.v);
    poserHuile(0);
  }
  // copie A -> R (repos), en ajoutant l'huile du masque si fourni
  function poserHuile(force) {
    tracer(P.huile, B, S[0], S[1]);
    lier(P.huile, 'uEtat', A.t, 0); lier(P.huile, 'uMasque', masque || A.t, 1);
    gl.uniform2f(P.huile.u.uTaille, S[0], S[1]); gl.uniform1f(P.huile.u.uForce, masque ? force : 0);
    dessinerTri(); echanger();
    tracer(P.huile, R, S[0], S[1]);
    lier(P.huile, 'uEtat', A.t, 0); gl.uniform1f(P.huile.u.uForce, 0);
    dessinerTri();
  }

  let cssW = 1, cssH = 1, dpr = 1, k = 2;
  function taille(w, h) {
    cssW = Math.max(1, w); cssH = Math.max(1, h);
    dpr = Math.min(window.devicePixelRatio || 1, petit ? 1.6 : 2) * qualite;
    toile.width = Math.round(cssW * dpr); toile.height = Math.round(cssH * dpr);
    k = petit ? 1.7 : 2.0;
    let sw = Math.round(cssW / k), sh = Math.round(cssH / k);
    const max = petit ? 560 : 820, e = Math.max(sw, sh) > max ? max / Math.max(sw, sh) : 1;
    sw = Math.round(sw * e); sh = Math.round(sh * e); k = cssW / sw;
    if (sw !== S[0] || sh !== S[1]) {
      for (const c of [A, B, R, D]) if (c) { gl.deleteTexture(c.t); gl.deleteFramebuffer(c.f); }
      S = [sw, sh];
      A = huit(sw, sh); B = huit(sw, sh); R = huit(sw, sh);
      D = demi ? cible(sw, sh, gl.RGBA16F, gl.RGBA, gl.HALF_FLOAT, gl.LINEAR) : null;
      if (!D || !D.ok) { D = cible(sw, sh, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, gl.LINEAR); codeD = 1; }
      sculpter(); sale = true;
    }
  }
  let qualite = 1;

  // L'huile des initiales : un canevas 2D de la taille de la toile (texte dessine par app.js).
  function initiales(canevas) {
    if (!masque) masque = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, masque);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canevas);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    sculpter(); poserHuile(.95); sale = true;
  }

  // Gestes en attente (en pixels CSS dans la toile)
  const file = [];
  let dernier = null, activite = 0, sale = true, zoom = 1;
  function geste(x, y, appuye, type) {
    const tx = ((x / cssW - .5) / zoom + .5) * S[0], ty = (1 - ((y / cssH - .5) / zoom + .5)) * S[1];
    file.push({ tx, ty, appuye, type, nouveau: !dernier });
  }
  function lever() { dernier = null; }
  // Un pas du doigt : on ne recalcule que le rectangle autour du doigt (ciseaux), puis on le recopie.
  function pas(bx, by, vx, vy, rayon, appui, stries) {
    const m = rayon * 3 + Math.hypot(vx, vy) + 3;
    const x0 = Math.max(0, Math.floor(bx - m)), y0 = Math.max(0, Math.floor(by - m));
    const x1 = Math.min(S[0], Math.ceil(bx + m)), y1 = Math.min(S[1], Math.ceil(by + m));
    if (x1 <= x0 || y1 <= y0) return;
    tracer(P.pas, B, S[0], S[1]);
    gl.enable(gl.SCISSOR_TEST); gl.scissor(x0, y0, x1 - x0, y1 - y0);
    lier(P.pas, 'uEtat', A.t, 0); lier(P.pas, 'uRepos', R.t, 1);
    gl.uniform2f(P.pas.u.uTaille, S[0], S[1]);
    gl.uniform4f(P.pas.u.uB, bx, by, vx, vy); gl.uniform4f(P.pas.u.uF, rayon, appui, 1, stries);
    gl.uniform1f(P.pas.u.uRelax, 0);
    dessinerTri();
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, B.f); gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, A.f);
    gl.blitFramebuffer(x0, y0, x1, y1, x0, y0, x1, y1, gl.COLOR_BUFFER_BIT, gl.NEAREST);
    gl.disable(gl.SCISSOR_TEST); gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    sale = true;
  }
  // Repos : toute la creme revient tres lentement vers son dessin d'origine.
  function reposer() {
    tracer(P.pas, B, S[0], S[1]);
    lier(P.pas, 'uEtat', A.t, 0); lier(P.pas, 'uRepos', R.t, 1);
    gl.uniform2f(P.pas.u.uTaille, S[0], S[1]);
    gl.uniform4f(P.pas.u.uB, 0, 0, 0, 0); gl.uniform4f(P.pas.u.uF, 1, 0, 0, 0);
    gl.uniform1f(P.pas.u.uRelax, .0032);
    dessinerTri(); echanger(); sale = true;
  }
  // Un trait automatique (pour sculpter la creme d'origine avec le meme geste que le visiteur).
  function trait(points, rayonPx, appui, vitesse = 1) {
    const r = rayonPx / k, m = Math.min(S[0], S[1]);
    const c = catmull(points, Math.max(8, points.length * 10)).map(([x, y]) => [S[0] * .5 + x * m, S[1] * .5 + y * m]);
    for (let i = 0; i < c.length - 1; i++) {
      const dx = c[i + 1][0] - c[i][0], dy = c[i + 1][1] - c[i][1], dist = Math.hypot(dx, dy);
      const n = Math.max(1, Math.ceil(dist / (r * .33)));
      for (let j = 1; j <= n; j++) pas(c[i][0] + dx * j / n, c[i][1] + dy * j / n, dx / n * vitesse, dy / n * vitesse, r, appui, .05);
    }
  }
  function vider() {
    let n = 0;
    while (file.length && n < 14) {
      const g = file.shift();
      const rayonPx = g.appuye ? (g.type === 'touch' ? 26 : 30) : 17;
      const rayon = rayonPx / k, appui = g.appuye ? .34 : .08, force = g.appuye ? 1 : .5;
      if (!dernier) {
        dernier = { x: g.tx, y: g.ty };
        if (g.appuye) { for (let i = 0; i < 3; i++) pas(g.tx, g.ty, 0, 0, rayon, .38, 0); n += 3; }
        continue;
      }
      const dx = g.tx - dernier.x, dy = g.ty - dernier.y, dist = Math.hypot(dx, dy);
      if (dist < .3) continue;
      const m = Math.min(8, Math.ceil(dist / (rayon * .33)));
      for (let i = 1; i <= m; i++) pas(dernier.x + dx * i / m, dernier.y + dy * i / m, dx / m * force, dy / m * force, rayon, appui, .05);
      dernier = { x: g.tx, y: g.ty }; n += m; activite = 1;
    }
    if (file.length > 40) file.splice(0, file.length - 40);
  }

  let pal = null;
  function palette(c) {
    const creme = hex(c.creme), huile = hex(c.huile), fond = hex(c.fond), sombre = (fond[0] * .3 + fond[1] * .59 + fond[2] * .11) < .3;
    pal = {
      creme, huile, sombre,
      sss: sombre ? melange(creme, huile, .55).map((v) => v * 1.1) : melange(creme, [creme[0] * .95, creme[1] * .82, creme[2] * .74], .75),
      cle: sombre ? [1, .96, .9] : [1, .975, .94],
      amb: sombre ? [.62, .58, .55] : melange([.9, .88, .86], creme, .4),
      expo: sombre ? 1.5 : 1.42,
    };
    sale = true;
  }

  let t0 = performance.now();
  function dessiner(t, etat = {}) {
    if (!pal) return;
    zoom = etat.zoom || 1;
    vider();
    // repos lent apres le dernier geste
    if (activite > 0) {
      activite -= 1 / (60 * 50);
      if (!file.length && (etat.image % 3) === 0) reposer();
    }
    if (sale) {
      tracer(P.derive, D, S[0], S[1]);
      lier(P.derive, 'uEtat', A.t, 0);
      gl.uniform2f(P.derive.u.uTaille, S[0], S[1]); gl.uniform1f(P.derive.u.uZ, petit ? 32 : 35); gl.uniform1i(P.derive.u.uCode, codeD);
      dessinerTri(); sale = false;
    }
    tracer(P.rendu, null, toile.width, toile.height);
    lier(P.rendu, 'uD', D.t, 0);
    const u = P.rendu.u;
    gl.uniform2f(u.uTailleD, S[0], S[1]); gl.uniform1i(u.uCode, codeD);
    gl.uniform3fv(u.uCreme, pal.creme); gl.uniform3fv(u.uHuile, pal.huile); gl.uniform3fv(u.uSss, pal.sss);
    gl.uniform3fv(u.uCle, pal.cle); gl.uniform3fv(u.uAmb, pal.amb);
    gl.uniform1f(u.uTemps, t); gl.uniform1f(u.uZoom, zoom); gl.uniform1f(u.uExpo, pal.expo);
    gl.uniform1f(u.uSombre, pal.sombre ? 1 : 0); gl.uniform1f(u.uAspect, cssW / cssH); gl.uniform1f(u.uBrillance, pal.sombre ? 1.7 : 1.45); gl.uniform1f(u.uDerive, reduit ? .45 : 1); gl.uniform1f(u.uGrain, .022);
    dessinerTri();
  }

  return {
    taille, initiales, geste, lever, palette, dessiner,
    get actif() { return activite > 0 || file.length > 0; },
    baisser() { if (qualite > .6) { qualite -= .15; taille(cssW, cssH); return true; } return false; },
    perdu: (f) => toile.addEventListener('webglcontextlost', (e) => { e.preventDefault(); f(); }),
  };
}
