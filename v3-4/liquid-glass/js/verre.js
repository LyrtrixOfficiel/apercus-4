// Liquid glass : le verre, en WebGL2 sans bibliothèque.
// Une scène = une section de la page, avec SON canevas (posé dans la section, pas fixe : il défile avec le texte,
// rien ne décroche au doigt). Le canevas dessine la photo de la section (avec un léger glissement au défilement)
// puis le verre de chaque élément [data-verre] : forme en champ de distance, bord bombé qui courbe la lumière
// (lentille), dispersion légère, givre (flou par mipmap), voile clair ou sombre selon ce qui passe dessous,
// reflet spéculaire fin sur l'arête et ombre douce. Le prénom géant est un verre en forme de lettres (champ de
// distance calculé depuis le texte). Rendu à la demande : seulement quand quelque chose a bougé.

const MAX = 16;
const TYPES = { panneau: 0, capsule: 1, lentille: 2, notif: 3, texte: 4, voile: 5 };

const SOMMETS = `#version 300 es
in vec2 a; void main(){ gl_Position = vec4(a, 0.0, 1.0); }`;

const FRAG = `#version 300 es
precision highp float;
#define MAX ${MAX}
uniform vec2 uTaille; uniform float uDpr;
uniform sampler2D uImg; uniform vec4 uCouv; uniform float uFlou, uLumi, uSatur;
uniform vec3 uTeinte; uniform float uTeinteForce;
uniform int uN;
uniform vec4 uR[MAX]; uniform vec4 uP[MAX]; uniform vec4 uG[MAX];
uniform sampler2D uTexte; uniform vec4 uTR; uniform float uPortee;
uniform vec2 uL;
out vec4 o;

vec3 grade(vec3 c){ float l = dot(c, vec3(0.2126, 0.7152, 0.0722)); return mix(vec3(l), c, uSatur) * uLumi; }
vec3 photo(vec2 p, float lod){
  vec2 uv = (p - uCouv.xy) / uCouv.zw;
  if (lod < 3.0) return grade(textureLod(uImg, uv, lod).rgb);
  // flou fort : les niveaux de mipmap feraient des carrés ; cinq prises en croix diagonale les fondent
  vec2 t = exp2(lod) * 0.7 / vec2(textureSize(uImg, 0));
  vec3 c = textureLod(uImg, uv, lod).rgb * 0.2;
  c += textureLod(uImg, uv + vec2( t.x,  t.y), lod).rgb * 0.2;
  c += textureLod(uImg, uv + vec2(-t.x,  t.y), lod).rgb * 0.2;
  c += textureLod(uImg, uv + vec2( t.x, -t.y), lod).rgb * 0.2;
  c += textureLod(uImg, uv + vec2(-t.x, -t.y), lod).rgb * 0.2;
  return grade(c);
}
float boite(vec2 p, vec2 b, float r){ vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
float texteD(vec2 p){
  vec2 uv = (p - uTR.xy) / uTR.zw; vec2 c = clamp(uv, 0.0, 1.0);
  float d = (texture(uTexte, c).r - 0.5) * 2.0 * uPortee;
  return d + length((uv - c) * uTR.zw);
}
float forme(int i, vec2 p){
  vec4 R = uR[i]; vec4 P = uP[i];
  if (P.y > 3.5 && P.y < 4.5) return texteD(p) + (1.0 - P.w) * uPortee * 0.8;
  vec2 h = R.zw * 0.5;
  return boite(p - (R.xy + h), h, min(P.x, min(h.x, h.y)));
}

void main(){
  vec2 p = vec2(gl_FragCoord.x, uTaille.y * uDpr - gl_FragCoord.y) / uDpr;
  vec3 fond = photo(p, uFlou);
  float ombre = 0.0; vec3 halo = vec3(0.0); float haloA = 0.0;
  int ici = -1; float dIci = 1e5;
  for (int i = 0; i < MAX; i++) {
    if (i >= uN) break;
    vec4 P = uP[i];
    float d = forme(i, p);
    if (P.y > 4.5) {            // voile de lisibilité derrière un texte posé sur la photo : une ellipse très douce
      vec2 q = (p - (uR[i].xy + uR[i].zw * 0.5)) / (uR[i].zw * 0.5 + vec2(90.0, 60.0));
      float a = (1.0 - smoothstep(0.2, 1.0, length(q))) * 0.4 * P.w * P.x;   // P.x : force (plus faible derrière un grand titre)
      fond = mix(fond, P.z > 0.5 ? vec3(0.02, 0.03, 0.06) : vec3(1.0), a);
      continue;
    }
    if (P.y > 3.5) {            // lettres : ombre douce, un peu décalée, plus marquée sur une photo claire (P.z = luminance dessous)
      // ombre adoucie en largeur (5 prises) : pas de rigoles claires entre les lettres
      float ds = (texteD(p - vec2(-18.0, 9.0)) + texteD(p - vec2(-9.0, 9.0)) + texteD(p - vec2(0.0, 9.0)) + texteD(p - vec2(9.0, 9.0)) + texteD(p - vec2(18.0, 9.0))) * 0.2 + (1.0 - P.w) * uPortee * 0.8;
      float a = (1.0 - smoothstep(-8.0, uPortee * 0.9, ds)) * (0.12 + 0.42 * smoothstep(0.35, 0.85, P.z)) * P.w;
      if (a > haloA) { haloA = a; halo = vec3(0.01, 0.02, 0.06); }
    } else {
      float ds = forme(i, p - vec2(0.0, 12.0));
      float fo = (P.y > 1.5 && P.y < 2.5) ? 0.22 : 0.17;
      ombre = max(ombre, (1.0 - smoothstep(-8.0, 34.0, ds)) * fo * P.w);
    }
    if (d < 1.0) { ici = i; dIci = d; }
  }
  vec3 col = mix(fond * (1.0 - ombre), halo, haloA);
  if (ici < 0) { o = vec4(col, 1.0); return; }

  vec4 R = uR[ici]; vec4 P = uP[ici]; vec4 G = uG[ici];
  float type = P.y; bool lettres = type > 3.5 && type < 4.5;
  float mode = lettres ? 0.0 : P.z;               // les lettres restent un verre clair, quelle que soit la photo
  float lumT = lettres ? P.z : 0.5;
  vec2 e = vec2(0.8, 0.0);
  vec2 g = vec2(forme(ici, p + e.xy) - forme(ici, p - e.xy), forme(ici, p + e.yx) - forme(ici, p - e.yx));
  vec2 n = g / max(length(g), 1e-4);
  float hmin = min(R.z, R.w) * 0.5;
  float biseau = type < 0.5 ? 24.0 : type < 1.5 ? min(17.0, hmin * 0.85) : type < 2.5 ? hmin * 0.5 : type < 3.5 ? 18.0 : 8.0;
  float force  = type < 0.5 ? 22.0 : type < 1.5 ? 13.0 : type < 2.5 ? 38.0 : type < 3.5 ? 16.0 : 16.0;
  float lod    = type < 0.5 ? 3.7  : type < 1.5 ? 2.7  : type < 2.5 ? 0.4  : type < 3.5 ? 3.4  : 2.0;
  float mag    = type < 0.5 ? 0.0  : type < 1.5 ? 0.06 : type < 2.5 ? 0.26 : 0.0;
  float x = clamp(1.0 + dIci / biseau, 0.0, 1.0);          // 1 sur l'arête, 0 au-delà du biseau
  float pente = x / sqrt(max(1.0 - x * x, 0.03));          // profil bombé : pente forte au bord
  vec2 dec = n * pente * force * 0.55;                      // le bord montre ce qui est juste à côté, courbé
  if (type < 3.5) dec += (R.xy + R.zw * 0.5 - p) * mag;     // grossissement (capsules, lentille)
  float pr = G.z;
  if (pr > 0.001) { vec2 dp = p - G.xy; dec -= dp * exp(-dot(dp, dp) / 1800.0) * 0.3 * pr; }
  float l2 = lod + uFlou * 0.35;
  vec3 c;
  c.r = photo(p + dec * 1.07, l2).r;
  c.g = photo(p + dec, l2).g;
  c.b = photo(p + dec * 0.93, l2).b;
  c = mix(c, c * uTeinte * 1.3, uTeinteForce);
  float vc = type < 0.5 ? 0.66 : type < 1.5 ? 0.58 : type < 2.5 ? 0.1 : type < 3.5 ? 0.62 : mix(0.32, 0.26, smoothstep(0.5, 0.9, lumT));
  float vs = type < 0.5 ? 0.58 : type < 1.5 ? 0.5 : type < 2.5 ? 0.18 : type < 3.5 ? 0.52 : 0.34;
  c = mix(c, mix(vec3(1.0), vec3(0.04, 0.05, 0.08), mode), mix(vc, vs, mode));
  // lumière qui entre par le haut du verre
  c += vec3(0.05) * (1.0 - smoothstep(0.0, R.w * 0.5, p.y - R.y)) * (1.0 - mode * 0.6) * step(type, 3.5);
  // reflet spéculaire sur l'arête tournée vers la lumière, plus faible à l'opposé
  vec2 L = normalize(uL);
  float bord = pow(x, 3.0);
  float spec = pow(max(dot(n, L), 0.0), 2.0) * bord * 0.9 + pow(max(dot(n, -L), 0.0), 2.0) * bord * 0.35;
  c += vec3(spec) * mix(1.0, 0.75, mode);
  float trait = 1.0 - smoothstep(0.0, 1.5, abs(dIci + 0.7));
  c = mix(c, vec3(1.0), trait * mix(0.55, 0.36, mode));
  if (pr > 0.001) { vec2 dp = p - G.xy; c += vec3(1.0) * pr * 0.2 * exp(-dot(dp, dp) / 5000.0); }
  float cov = clamp(0.5 - dIci * uDpr, 0.0, 1.0) * P.w;
  o = vec4(mix(col, clamp(c, 0.0, 1.0), cov), 1.0);
}`;

function compiler(gl, type, src) {
  const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || 'shader');
  return s;
}

// ---------------------------------------------------------------- champ de distance d'un texte (transformée exacte)
const INF = 1e20;
function edt1d(grille, depart, pas, n, f, v, z) {
  v[0] = 0; z[0] = -INF; z[1] = INF; f[0] = grille[depart];
  for (let q = 1, k = 0, s = 0; q < n; q++) {
    f[q] = grille[depart + q * pas];
    const q2 = q * q;
    do { const r = v[k]; s = (f[q] - f[r] + q2 - r * r) / (q - r) / 2; } while (s <= z[k] && --k > -1);
    k++; v[k] = q; z[k] = s; z[k + 1] = INF;
  }
  for (let q = 0, k = 0; q < n; q++) {
    while (z[k + 1] < q) k++;
    const r = v[k], d = q - r;
    grille[depart + q * pas] = f[r] + d * d;
  }
}
function edt(grille, l, h) {
  const n = Math.max(l, h), f = new Float64Array(n), v = new Uint16Array(n), z = new Float64Array(n + 1);
  for (let x = 0; x < l; x++) edt1d(grille, x, l, h, f, v, z);
  for (let y = 0; y < h; y++) edt1d(grille, y * l, 1, l, f, v, z);
}

export function champTexte(span, origine) {
  const r = span.getBoundingClientRect(), cs = getComputedStyle(span);
  const texte = span.textContent.trim();
  const taille = parseFloat(cs.fontSize);
  const portee = Math.max(30, taille * 0.24);
  // marge plus large que la portée : les bords du champ sont saturés (uniformes), l'ombre décalée n'y fait plus de traînées
  const marge = Math.ceil(portee * 1.7);
  const k = Math.min(1.6, 2400 / (r.width + 2 * marge), 900 / (r.height + 2 * marge));
  const L = Math.ceil((r.width + 2 * marge) * k), H = Math.ceil((r.height + 2 * marge) * k);
  const c = document.createElement('canvas'); c.width = L; c.height = H;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.font = `${cs.fontWeight} ${taille * k}px ${cs.fontFamily}`;
  const esp = parseFloat(cs.letterSpacing);
  if ('letterSpacing' in g && esp) g.letterSpacing = `${esp * k}px`;
  g.textBaseline = 'alphabetic'; g.fillStyle = '#fff';
  const m = g.measureText(texte);
  const asc = m.fontBoundingBoxAscent ?? m.actualBoundingBoxAscent, desc = m.fontBoundingBoxDescent ?? m.actualBoundingBoxDescent;
  const ligne = r.height * k;
  const base = marge * k + (ligne - (asc + desc)) / 2 + asc;
  g.fillText(texte, marge * k + parseFloat(cs.paddingLeft) * k, base);
  const a = g.getImageData(0, 0, L, H).data;
  const n = L * H, dehors = new Float64Array(n), dedans = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const al = a[i * 4 + 3] / 255;
    dehors[i] = al >= 1 ? 0 : al <= 0 ? INF : Math.max(0, 0.5 - al) ** 2;
    dedans[i] = al >= 1 ? INF : al <= 0 ? 0 : Math.max(0, al - 0.5) ** 2;
  }
  edt(dehors, L, H); edt(dedans, L, H);
  const out = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const d = (Math.sqrt(dehors[i]) - Math.sqrt(dedans[i])) / k;      // px CSS, positif dehors
    out[i] = Math.max(0, Math.min(255, Math.round((0.5 + d / (2 * portee)) * 255)));
  }
  return { donnees: out, L, H, portee, rect: [r.left - origine.left - marge, r.top - origine.top - marge, r.width + 2 * marge, r.height + 2 * marge] };
}

// rayon d'arrondi en px (« 50% » se résout sur la largeur)
export function rayonDe(el) {
  const brut = getComputedStyle(el).borderTopLeftRadius;
  const v = parseFloat(brut);
  if (!Number.isFinite(v)) return 24;
  return /%/.test(brut) ? (v / 100) * el.offsetWidth : v;
}

// ---------------------------------------------------------------- une scène
export class Scene {
  constructor(section, { palette, petit }) {
    this.section = section;
    this.canvas = section.querySelector('canvas.scene-verre');
    this.palette = palette;
    this.petit = petit;
    const fond = section.querySelector('.scene-fond');
    this.flou = fond?.hasAttribute('data-flou');
    this.source = fond?.querySelector('img') || fond?.querySelector('canvas.papier-toile') || null;
    this.elements = [...section.querySelectorAll('[data-verre]')];
    this.texte = section.querySelector('[data-verre="texte"] span');
    this.vivant = false;
    this.sale = true;
    this.R = new Float32Array(MAX * 4); this.P = new Float32Array(MAX * 4); this.G = new Float32Array(MAX * 4);
    this.signature = '';
  }

  async demarrer() {
    if (!this.canvas || !this.source) return false;
    if (this.source.tagName === 'IMG') {
      if (!this.source.complete || !this.source.naturalWidth) await new Promise((ok) => { this.source.addEventListener('load', ok, { once: true }); this.source.addEventListener('error', ok, { once: true }); });
      if (!this.source.naturalWidth) return false;
      try { await this.source.decode(); } catch { /* déjà décodée */ }
    }
    const gl = this.canvas.getContext('webgl2', { antialias: false, alpha: false, premultipliedAlpha: false, preserveDrawingBuffer: false, powerPreference: 'high-performance' });
    if (!gl) return false;
    this.gl = gl;
    const prog = gl.createProgram();
    gl.attachShader(prog, compiler(gl, gl.VERTEX_SHADER, SOMMETS));
    gl.attachShader(prog, compiler(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.bindAttribLocation(prog, 0, 'a'); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) || 'programme');
    this.prog = prog;
    this.u = {};
    const nb = gl.getProgramParameter(prog, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < nb; i++) { const nom = gl.getActiveUniform(prog, i).name.replace(/\[0\]$/, ''); this.u[nom] = gl.getUniformLocation(prog, nom); }
    const vbo = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    // photo
    this.texImg = gl.createTexture();
    this.chargerSource();
    // texte
    this.texTexte = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.texTexte);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, 1, 1, 0, gl.RED, gl.UNSIGNED_BYTE, new Uint8Array([255]));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    this.champ = null;
    this.canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); this.vivant = false; this.section.classList.remove('gl-pret'); }, { once: true });
    this.vivant = true;
    this.mesurer();
    return true;
  }

  chargerSource() {
    const gl = this.gl, s = this.source;
    gl.bindTexture(gl.TEXTURE_2D, this.texImg);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 4);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, s);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    this.iw = s.naturalWidth || s.width; this.ih = s.naturalHeight || s.height;
    this.sale = true;
  }

  // le prénom géant devient un verre en forme de lettres
  preparerTexte() {
    if (!this.vivant || !this.texte) return;
    const gl = this.gl;
    const ch = champTexte(this.texte, this.canvas.getBoundingClientRect());
    gl.bindTexture(gl.TEXTURE_2D, this.texTexte);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, ch.L, ch.H, 0, gl.RED, gl.UNSIGNED_BYTE, ch.donnees);
    this.champ = ch;
    this.sale = true;
  }

  mesurer() {
    if (!this.vivant) return;
    const r = this.canvas.getBoundingClientRect();
    this.W = r.width; this.H = r.height;
    const plafond = this.petit ? 1.6 : 2;
    let dpr = Math.min(window.devicePixelRatio || 1, plafond);
    const max = this.petit ? 2.2e6 : 4.2e6;
    if (this.W * this.H * dpr * dpr > max) dpr = Math.sqrt(max / (this.W * this.H));
    this.dpr = dpr;
    const l = Math.max(2, Math.round(this.W * dpr)), h = Math.max(2, Math.round(this.H * dpr));
    if (this.canvas.width !== l || this.canvas.height !== h) { this.canvas.width = l; this.canvas.height = h; }
    // rayons des arrondis, relus une fois par mise en page
    this.rayons = this.elements.map((el) => rayonDe(el));
    // voile de lisibilité : discret derrière un très grand titre (sinon il fait une tache), plein derrière une ligne de texte
    this.forces = this.elements.map((el) => { const t = parseFloat(getComputedStyle(el).fontSize) || 16; return t >= 48 ? 0.35 : t >= 30 ? 0.6 : 1.35; });
    if (this.texte) this.preparerTexte();
    this.sale = true;
  }

  // dessine si quelque chose a changé ; renvoie true si dessiné
  dessiner(etat) {
    if (!this.vivant) return false;
    const gl = this.gl;
    const rc = this.canvas.getBoundingClientRect();
    if (Math.abs(rc.width - this.W) > 0.5 || Math.abs(rc.height - this.H) > 0.5) this.mesurer();
    const vh = innerHeight;
    if (rc.bottom < -50 || rc.top > vh + 50) return false;
    // photo : couverture comme object-fit: cover + agrandissement, et léger glissement au défilement
    const zoom = this.flou ? 1.25 : 1.1;
    const s = Math.max(this.W / this.iw, this.H / this.ih) * zoom;
    const dw = this.iw * s, dh = this.ih * s;
    const marge = (dh - this.H) / 2;
    const glisse = this.flou ? 0 : Math.max(-marge, Math.min(marge, -(rc.top + this.H / 2 - vh / 2) * (etat.reduit ? 0.035 : 0.07)));
    const couv = [(this.W - dw) / 2, (this.H - dh) / 2 + glisse, dw, dh];
    // formes
    let n = 0;
    const sig = [couv[1].toFixed(1), etat.lumiere[0].toFixed(3)];
    for (let i = 0; i < this.elements.length && n < MAX; i++) {
      const el = this.elements[i];
      const v = el.__verre || {};
      if (v.cache) continue;
      const type = TYPES[el.dataset.verre] ?? 0;
      let x, y, l, h;
      if (type === 4) { if (!this.champ) continue; [x, y, l, h] = this.champ.rect; }
      else {
        const r = el.getBoundingClientRect();
        x = r.left - rc.left; y = r.top - rc.top; l = r.width; h = r.height;
        if (v.forme) { x += v.forme.x; y += v.forme.y; l = v.forme.l; h = v.forme.h; }
      }
      if (y > this.H + 60 || y + h < -60 || l < 1 || h < 1) continue;
      const alpha = v.alpha ?? 1;
      if (alpha < 0.005) continue;
      const rayon = type === 5 ? this.forces[i] : (v.forme?.r ?? this.rayons[i]);
      const mode = el.classList.contains('sombre') ? 1 : el.classList.contains('clair') ? 0 : (this.section.dataset.ton === 'sombre' ? 1 : 0);
      this.R.set([x, y, l, h], n * 4);
      this.P.set([rayon, type, type === 4 ? +(el.dataset.lum || 0.5) : mode, type === 4 ? (v.condense ?? 1) * alpha : alpha], n * 4);
      this.G.set([v.px ?? 0, v.py ?? 0, v.pression ?? 0, 0], n * 4);
      sig.push(x.toFixed(1), y.toFixed(1), l.toFixed(1), h.toFixed(1), rayon.toFixed(1), mode, el.dataset.lum || '', alpha.toFixed(3), (v.pression ?? 0).toFixed(3), (v.condense ?? 1).toFixed(3));
      n++;
    }
    const signature = sig.join('|');
    if (!this.sale && signature === this.signature) return false;
    this.signature = signature; this.sale = false;
    const u = this.u;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.useProgram(this.prog);
    gl.uniform2f(u.uTaille, this.W, this.H); gl.uniform1f(u.uDpr, this.canvas.width / this.W);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.texImg); gl.uniform1i(u.uImg, 0);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, this.texTexte); gl.uniform1i(u.uTexte, 1);
    gl.uniform4f(u.uCouv, ...couv);
    gl.uniform1f(u.uFlou, this.flou ? 5.2 : 0);
    gl.uniform1f(u.uLumi, this.flou ? 0.5 : 1);
    gl.uniform1f(u.uSatur, this.flou ? 1.3 : 1.04);
    const t = this.palette.couleurs.accent2;
    gl.uniform3f(u.uTeinte, ...[1, 3, 5].map((i) => parseInt(t.slice(i, i + 2), 16) / 255));
    gl.uniform1f(u.uTeinteForce, 0.06);
    if (this.champ) { gl.uniform4f(u.uTR, ...this.champ.rect); gl.uniform1f(u.uPortee, this.champ.portee); }
    else { gl.uniform4f(u.uTR, -10, -10, 1, 1); gl.uniform1f(u.uPortee, 24); }
    gl.uniform2f(u.uL, etat.lumiere[0], etat.lumiere[1]);
    gl.uniform1i(u.uN, n);
    gl.uniform4fv(u.uR, this.R); gl.uniform4fv(u.uP, this.P); gl.uniform4fv(u.uG, this.G);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (!this.section.classList.contains('gl-pret')) this.section.classList.add('gl-pret');
    return true;
  }

  liberer() {
    if (!this.gl) return;
    this.section.classList.remove('gl-pret');
    try { this.gl.getExtension('WEBGL_lose_context')?.loseContext(); } catch { /* rien */ }
    this.vivant = false; this.gl = null;
    // un canevas dont le contexte est perdu ne peut pas en recréer un : on le remplace
    const neuf = this.canvas.cloneNode(false);
    this.canvas.replaceWith(neuf);
    this.canvas = neuf;
  }
}

// Luminance de la photo : une petite grille (64 px) par section, gardée en cache.
// Sert à passer chaque verre en apparence claire ou sombre, et la barre d'onglets selon ce qui passe dessous.
function grille(section) {
  const fond = section.querySelector('.scene-fond');
  const src = fond?.querySelector('img') || fond?.querySelector('canvas.papier-toile');
  const r = section.getBoundingClientRect();
  if (!src || !r.width || !r.height) return null;
  const iw = src.naturalWidth || src.width, ih = src.naturalHeight || src.height;
  if (!iw || !ih || (src.tagName === 'IMG' && !src.complete)) return null;
  const cle = `${src.currentSrc || src.width}|${Math.round(r.width)}x${Math.round(r.height)}`;
  if (section.__grille?.cle === cle) return section.__grille;
  const flou = fond.hasAttribute('data-flou');
  const k = 64 / Math.max(r.width, r.height);
  const L = Math.max(4, Math.round(r.width * k)), H = Math.max(4, Math.round(r.height * k));
  const c = document.createElement('canvas'); c.width = L; c.height = H;
  const g = c.getContext('2d', { willReadFrequently: true });
  const s = Math.max(L / iw, H / ih) * (flou ? 1.25 : 1.1);
  let px;
  try { g.drawImage(src, (L - iw * s) / 2, (H - ih * s) / 2, iw * s, ih * s); px = g.getImageData(0, 0, L, H).data; } catch { return null; }
  const lum = new Float32Array(L * H);
  for (let i = 0; i < L * H; i++) lum[i] = ((0.2126 * px[i * 4] + 0.7152 * px[i * 4 + 1] + 0.0722 * px[i * 4 + 2]) / 255) * (flou ? 0.46 : 1);
  return (section.__grille = { cle, L, H, k, lum });
}

// luminance moyenne d'un rectangle de l'écran (coordonnées de fenêtre) au-dessus d'une section
export function lumZone(section, e) {
  const G = grille(section);
  if (!G) return section.dataset.ton === 'clair' ? 0.7 : 0.3;
  const r = section.getBoundingClientRect();
  const x0 = Math.max(0, Math.floor((e.left - r.left) * G.k)), x1 = Math.min(G.L, Math.ceil((e.right - r.left) * G.k));
  const y0 = Math.max(0, Math.floor((e.top - r.top) * G.k)), y1 = Math.min(G.H, Math.ceil((e.bottom - r.top) * G.k));
  let t = 0, n = 0;
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { t += G.lum[y * G.L + x]; n++; }
  return n ? t / n : (section.dataset.ton === 'clair' ? 0.7 : 0.3);
}

export function adapter(section) {
  if (!grille(section)) return false;
  for (const el of section.querySelectorAll('[data-verre]')) {
    const groupe = el.closest('[data-groupe]');
    const l = lumZone(section, (groupe || el).getBoundingClientRect());
    el.dataset.lum = l.toFixed(2);
    // au-dessus du seuil, le verre se fait clair (encre foncée) ; en dessous, sombre (texte blanc)
    const sombre = l < 0.52;
    el.classList.toggle('sombre', sombre); el.classList.toggle('clair', !sombre);
  }
  return true;
}
