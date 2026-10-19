// Kazura v12, Expériences : « Le ciel de nuit ».
// Le nuanceur des aurores vient de l'univers Aurora Nuit des maquettes v3 (maquettes-v3/aurora-nuit/js/ciel.js),
// repris tel quel ; les étoiles, les étoiles filantes et la scène autonome sont réécrites pour un cadre.
// Rien ne suit le pointeur : un toucher (ou un clic) fait courir une onde dans l'aurore et filer une étoile.

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

// Les couleurs : jade vers violet, celles de Kazura.
const G = {
  nuit: [[.012, .018, .05], [.016, .02, .062]], horizon: [.02, .035, .075],
  rideaux: [[[.18, 1, .6], [.5, .3, 1]], [[.12, .82, .66], [.45, .27, .9]], [[.55, .7, .62], [.85, .4, 1]]], frange: [.6, .45, 1],
};
const TAU = Math.PI * 2;
function lutin(rayon, couleur) {
  const c = document.createElement('canvas'); c.width = c.height = rayon * 2;
  const g = c.getContext('2d'), d = g.createRadialGradient(rayon, rayon, 0, rayon, rayon, rayon);
  d.addColorStop(0, couleur(1)); d.addColorStop(.16, couleur(.9)); d.addColorStop(.42, couleur(.16)); d.addColorStop(1, couleur(0));
  g.fillStyle = d; g.fillRect(0, 0, rayon * 2, rayon * 2); return c;
}

function demarrerAurore(canvas, petit) {
  let gl;
  try { gl = canvas.getContext('webgl', { antialias: false, alpha: false, depth: false, stencil: false, powerPreference: 'low-power' }); } catch { gl = null; }
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
  gl.uniform3fv(U.uNuitH, G.nuit[0]); gl.uniform3fv(U.uNuitB, G.nuit[1]); gl.uniform3fv(U.uHorizon, G.horizon); gl.uniform3fv(U.uFrange, G.frange);
  [['uR1a', 'uR1b'], ['uR2a', 'uR2b'], ['uR3a', 'uR3b']].forEach(([a, b], i) => { gl.uniform3fv(U[a], G.rideaux[i][0]); gl.uniform3fv(U[b], G.rideaux[i][1]); });
  // une aurore est floue par nature : rendu à basse résolution, agrandi par le navigateur
  let echelle = petit ? .5 : .6, cumul = 0, nb = 0, dernier = 0, perdu = false, L = 1, H = 1;
  function taille(w, h) {
    const k = Math.min(echelle, 1000 / Math.max(1, w));
    canvas.width = Math.max(64, Math.round(w * k)); canvas.height = Math.max(64, Math.round(h * k));
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); perdu = true; });
  return {
    taille(w, h) { L = w; H = h; taille(w, h); },
    dessiner(t, onde) {
      if (perdu) return;
      // les rideaux descendent vers le milieu du cadre (le nuanceur les montait avec le défilement de la page)
      const decale = L < H ? -.9 : -1.25;
      gl.uniform2f(U.uR, canvas.width, canvas.height); gl.uniform1f(U.uT, t);
      gl.uniform4f(U.uOnde, onde[0], onde[1], onde[2], onde[3]); gl.uniform1f(U.uS, decale); gl.uniform1f(U.uI, 1.05);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      const m = performance.now();
      if (dernier && m - dernier < 100) { cumul += m - dernier; nb++; }
      dernier = m;
      if (nb === 90) { if (cumul / nb > 22 && echelle > (petit ? .3 : .44) && !window.__bride) { echelle *= .85; taille(L, H); } cumul = 0; nb = 0; }
    },
    perdre() { try { gl.getExtension('WEBGL_lose_context')?.loseContext(); } catch {} },
  };
}

export function demarrer(el, { reduit = false, mobile = false } = {}) {
  const petit = mobile || Math.min(innerWidth, innerHeight) < 600;
  el.classList.add('cn');
  el.innerHTML = `
    <canvas class="cn-aurore" aria-hidden="true"></canvas>
    <canvas class="cn-etoiles" aria-hidden="true"></canvas>
    <svg class="cn-crete" viewBox="0 0 1200 200" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 150 L70 128 L130 140 L210 96 L270 118 L330 84 L400 122 L470 104 L540 136 L610 92 L690 70 L760 112 L830 98 L900 130 L980 88 L1050 118 L1120 100 L1200 126 V200 H0 Z" fill="#070a12"/>
      <path d="M0 176 L90 160 L170 172 L260 150 L360 168 L450 152 L560 172 L660 156 L770 174 L880 158 L990 172 L1100 154 L1200 166 V200 H0 Z" fill="#04060b"/>
    </svg>`;
  el.setAttribute('role', 'img');
  el.setAttribute('aria-label', 'Un ciel de nuit traversé d’aurores vertes et violettes, au-dessus d’une ligne de montagnes.');
  const toileA = el.querySelector('.cn-aurore'), toileE = el.querySelector('.cn-etoiles');
  const aurore = demarrerAurore(toileA, petit);
  if (!aurore) { el.classList.remove('cn'); el.innerHTML = ''; return null; }
  const g = toileE.getContext('2d');
  const sprites = { blanc: lutin(16, (a) => `rgba(236,242,255,${a})`), jade: lutin(16, (a) => `rgba(110,231,183,${a})`), violet: lutin(16, (a) => `rgba(201,184,255,${a})`), or: lutin(16, (a) => `rgba(233,201,135,${a})`) };
  let W = 1, H = 1;
  const champ = [], filantes = [];
  function taille() {
    const r = el.getBoundingClientRect(); W = Math.max(1, r.width); H = Math.max(1, r.height);
    aurore.taille(W, H);
    const dpr = Math.min(devicePixelRatio || 1, petit ? 2 : 1.75);
    toileE.width = Math.round(W * dpr); toileE.height = Math.round(H * dpr); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    champ.length = 0;
    const n = Math.round((petit ? 110 : 220) * Math.min(1.3, W * H / (900 * 600) + .3));
    for (let i = 0; i < n; i++) {
      const z = Math.random();
      champ.push({ x: Math.random() * W, y: Math.pow(Math.random(), 1.25) * H * .86, z, r: .35 + Math.pow(Math.random(), 4) * 1.6 + z * .3, ph: Math.random() * TAU, v: .4 + Math.random() * 1.6, c: Math.random() < .1 ? 'jade' : Math.random() < .1 ? 'violet' : Math.random() < .05 ? 'or' : 'blanc' });
    }
  }
  taille();
  const vite = reduit ? .6 : 1;
  function lancer(x, y, provoquee) {
    const sens = x < W * .5 ? 1 : -1, v = ((provoquee ? 9 : 6) + Math.random() * 4) * vite;
    filantes.push({ x, y, vx: sens * v * (.8 + Math.random() * .15), vy: v * (.3 + Math.random() * .15) + 1, vie: 0, duree: (provoquee ? 52 : 60) / vite });
  }
  let prochaine = performance.now() + 2500;
  function etoiles(m, dt) {
    const t = m / 1000 * (reduit ? .5 : 1);
    g.clearRect(0, 0, W, H);
    for (const s of champ) {
      const a = (.25 + .6 * s.z) * (.62 + .38 * Math.sin(t * s.v + s.ph));
      if (s.r > 1.1) { const k = s.r * 4.5 * (.8 + a * .4); g.globalAlpha = Math.min(1, a); g.drawImage(sprites[s.c], s.x - k / 2, s.y - k / 2, k, k); }
      else { g.globalAlpha = Math.min(1, a); g.fillStyle = '#ecf2ff'; g.fillRect(s.x, s.y, s.r * 1.4, s.r * 1.4); }
    }
    if (m > prochaine) { lancer(W * (.15 + Math.random() * .7), H * (.05 + Math.random() * .25), false); prochaine = m + (reduit ? 11000 : 7000) + Math.random() * 8000; }
    for (let i = filantes.length - 1; i >= 0; i--) {
      const f = filantes[i]; f.vie += dt; f.x += f.vx * dt; f.y += f.vy * dt;
      const a = Math.sin(Math.min(1, f.vie / f.duree) * Math.PI);
      const gr = g.createLinearGradient(f.x, f.y, f.x - f.vx * 14, f.y - f.vy * 14);
      gr.addColorStop(0, `rgba(236,242,255,${.95 * a})`); gr.addColorStop(1, 'rgba(236,242,255,0)');
      g.globalAlpha = 1; g.strokeStyle = gr; g.lineWidth = 1.4; g.beginPath(); g.moveTo(f.x, f.y); g.lineTo(f.x - f.vx * 14, f.y - f.vy * 14); g.stroke();
      g.globalAlpha = a; g.drawImage(sprites.blanc, f.x - 6, f.y - 6, 12, 12);
      if (f.vie > f.duree) filantes.splice(i, 1);
    }
    g.globalAlpha = 1;
  }

  // Un toucher : l'aurore ondule à cet endroit, une étoile file depuis ce point
  const onde = [0, 0, 99, 0];
  const surAppui = (e) => {
    if (e.target.closest('button')) return;
    const r = el.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    onde[0] = x / r.width; onde[1] = 1 - y / r.height; onde[2] = 0; onde[3] = 1;
    lancer(x, Math.min(y, H * .7), true);
  };
  el.addEventListener('pointerdown', surAppui, { passive: true });

  let id = 0, arrete = false, enPause = false, prec = 0, temps = 0;
  function boucle(m) {
    id = 0;
    if (arrete || enPause) return;
    const dt = prec ? Math.min(.05, (m - prec) / 1000) : .016; prec = m;
    temps += dt * (reduit ? .55 : 1);
    onde[2] += dt * (reduit ? .75 : 1);
    aurore.dessiner(temps + 40, onde);
    etoiles(m, dt * 60);
    id = requestAnimationFrame(boucle);
  }
  id = requestAnimationFrame(boucle);
  const ro = new ResizeObserver(() => taille());
  ro.observe(el);

  return {
    pause(oui) { if (arrete) return; enPause = !!oui; if (!enPause && !id) { prec = 0; id = requestAnimationFrame(boucle); } },
    arreter() {
      arrete = true; cancelAnimationFrame(id); ro.disconnect(); el.removeEventListener('pointerdown', surAppui);
      aurore.perdre(); el.classList.remove('cn'); el.removeAttribute('role'); el.removeAttribute('aria-label'); el.replaceChildren();
    },
  };
}
