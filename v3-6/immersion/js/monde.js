/* IMMERSION : le monde 3D que la camera traverse au defilement.

   Quatre mondes, un seul film :
     cristal : un quartz de verre au-dessus d'une eau noire, ou il se reflete
               (accueil, puis le meme a l'aube pour le contact) ;
     eau     : une eau calme sous la lune ; ondes au doigt et a la souris ;
     galets  : des pierres de verre posees sur l'eau, une par etape de seance ;
     brume   : des milliers de particules qui se condensent en un prenom.

   Le verre est LANCE EN RAYONS dans son nuanceur : le rayon entre, se refracte
   (trois longueurs d'onde : la dispersion), rebondit sur les faces internes
   (reflexion totale), ressort, et lit le ciel la ou il sort. Le cristal est un
   polyedre convexe dont on connait les plans ; le galet, un ellipsoide. L'eau
   reflete la scene par un miroir plan (une seconde camera sous la surface).

   L'image est calculee en HDR, puis : halo lumineux (les hautes lumieres
   bavent comme dans un objectif), rendu filmique, vignettage, grain. Une
   passe de composition passe d'un monde a l'autre par une COUPE diagonale ou
   une DISPERSION ; sous mouvement reduit, par un fondu en brume, sans secousse.

   Rien ne suit la souris. Ce qui reagit au geste : l'eau (une onde la ou passe
   la main, plus forte la ou l'on touche), le cristal (on l'attrape et on le
   lance), les galets (on les touche, ils plongent et l'eau repond).

   Aucune texture, aucun modele : ciel, verre, eau et brume sont calcules.
   Une seule dependance : three.js (cdnjs). */
import * as THREE from 'three';

const lin = (c) => Math.pow(Math.max(c, 0), 2.2);

/* ── Bruit, partage par tous les nuanceurs ─────────────────────────────── */
const BRUIT = /* glsl */`
  float h1(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
  float bruit(vec3 x) {
    vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(h1(i), h1(i + vec3(1,0,0)), f.x), mix(h1(i + vec3(0,1,0)), h1(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(h1(i + vec3(0,0,1)), h1(i + vec3(1,0,1)), f.x), mix(h1(i + vec3(0,1,1)), h1(i + vec3(1,1,1)), f.x), f.y), f.z);
  }
  float fbm(vec3 p) { float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++) { s += a * bruit(p); p = p * 2.02 + vec3(3.1, 1.7, 5.3); a *= 0.5; } return s; }
`;

/* Le ciel, en lumiere lineaire (HDR) : degrade de nuit, bande d'horizon, trois
   rideaux de lumiere verticaux (des boites a lumiere de studio, c'est ce que le
   verre refracte et demultiplie), un halo derriere le sujet et une lune. Les
   couleurs viennent de la palette ; uAube rechauffe tout. rug elargit tout :
   c'est le flou d'un verre depoli. */
const CIEL = /* glsl */`
  uniform vec3 uZen, uHor, uLueur, uSol, uLum, uHaloC, uLuneC, uZenA, uHorA, uLueurA, uLumA, uHaloCA;
  uniform float uAube, uLune, uBarres, uTemps, uHalo, uCielImg; uniform vec3 uHaloDir;
  /* uUn vaut 1 : les boucles bornees par lui ne sont pas deroulees par le compilateur de Windows
     (D3D), ce qui divise le temps de compilation des nuanceurs sans rien changer a l'image. */
  uniform int uUn;
  uniform sampler2D tCiel;
  const vec3 LUNE_DIR = vec3(0.1851, 0.1949, -0.9632);
  vec3 cielFond(vec3 d, float rug) {
    float y = d.y;
    vec3 zen = mix(uZen, uZenA, uAube), hor = mix(uHor, uHorA, uAube);
    vec3 c = y > 0.0 ? mix(hor, zen, pow(clamp(y, 0.0, 1.0), 0.45)) : mix(hor * 0.45, uSol, pow(clamp(-y, 0.0, 1.0), 0.3));
    c += exp(-abs(y) * (22.0 / (1.0 + rug * 5.0))) * mix(uLueur, uLueurA, uAube) * 0.9;
    if (uCielImg > 0.0) {
      vec2 uv = vec2(atan(d.x, -d.z) * 0.1591549 + 0.5, asin(clamp(y, -1.0, 1.0)) * 0.3183099 + 0.5);
      c = mix(c, textureLod(tCiel, uv, 0.0).rgb * (1.0 - uAube * 0.3) + mix(vec3(0.0), uHorA, uAube) * 0.3, uCielImg * smoothstep(-0.02, 0.04, y));
    }
    return c;
  }
  /* Le studio : des boites a lumiere fines, verticales, tout autour (celles de
     derriere ne se voient qu'a travers le verre), et un plafonnier quand il y a
     un cristal a eclairer. C'est ce que le verre demultiplie en eclats. */
  float studio(vec3 d, float rug) {
    float y = d.y, az = atan(d.x, -d.z);
    float w = 0.024 + rug * 0.22;
    float s = exp(-pow((az - 0.55) / w, 2.0)) * smoothstep(-0.30, 0.05, y) * (1.0 - smoothstep(0.25, 0.85, y));
    s += exp(-pow((az - 0.80) / (w * 0.6), 2.0)) * smoothstep(-0.10, 0.15, y) * (1.0 - smoothstep(0.40, 0.95, y)) * 0.8;
    s += exp(-pow((az + 0.50) / w, 2.0)) * smoothstep(-0.35, 0.0, y) * (1.0 - smoothstep(0.2, 0.7, y)) * 0.9;
    s += exp(-pow((az - 2.2) / (w * 1.4), 2.0)) * smoothstep(-0.2, 0.2, y) * (1.0 - smoothstep(0.5, 1.0, y)) * 1.2;
    s += exp(-pow((az + 2.5) / (w * 1.2), 2.0)) * smoothstep(-0.25, 0.1, y) * (1.0 - smoothstep(0.3, 0.9, y)) * 1.1;
    s += smoothstep(0.84 - rug * 0.2, 0.9, y) * 0.55 * step(0.001, uHalo);
    return s / (1.0 + rug * 3.0);
  }
  vec3 ciel(vec3 d, float rug) {
    d = normalize(d);
    vec3 c = cielFond(d, rug);
    if (uBarres > 0.0) c += studio(d, rug) * mix(uLum, uLumA, uAube) * uBarres * 2.8 * (0.85 + 0.15 * sin(d.y * 7.0 + uTemps * 0.3));
    if (uHalo > 0.0) {
      float ch = max(dot(d, uHaloDir), 0.0);
      c += uHalo * (pow(ch, 90.0) * 0.9 + pow(ch, 14.0) * 0.12) * mix(uHaloC, uHaloCA, uAube);
    }
    if (uLune > 0.0) {
      float ca = dot(d, LUNE_DIR);
      float rayon = 0.9996;
      float bord = 0.00006 + rug * 0.004;
      float disque = smoothstep(rayon - bord, rayon + bord, ca);
      if (disque > 0.0) {
        vec3 u = d - LUNE_DIR * ca;
        float r2 = clamp((1.0 - ca) / (1.0 - rayon), 0.0, 1.0);
        float mers = 0.86 - 0.20 * smoothstep(0.45, 0.75, bruit(u * 95.0 + 4.0)) + 0.06 * bruit(u * 400.0);
        c += uLune * disque * mers * (0.75 + 0.25 * sqrt(1.0 - r2)) * uLuneC * 9.0;
      }
      float halo = pow(max(ca, 0.0), 3000.0) * 0.9 + pow(max(ca, 0.0), 260.0) * 0.1;
      c += uLune * (halo * uLuneC + pow(max(ca, 0.0), 16.0) * 0.012 * mix(uLum, uLumA, uAube));
    }
    return c;
  }
  /* Le meme ciel, allege pour l'interieur du verre (appele dans des boucles) :
     pas de texture ni de bruit, une lune lisse. Les compilateurs de nuanceurs
     de Windows deroulent les boucles ; chaque appel compte. */
  vec3 cielVerre(vec3 d, float rug) {
    d = normalize(d);
    float y = d.y;
    vec3 zen = mix(uZen, uZenA, uAube), hor = mix(uHor, uHorA, uAube);
    vec3 c = mix(hor, zen, pow(abs(y), 0.45));
    if (y < 0.0) c = mix(hor * 0.45, uSol, pow(-y, 0.3));
    /* Dans le verre, la bande d'horizon est plus fine et moins forte : sinon elle remplit le cristal
       d'un aplat clair (effet « vitre »), surtout sur telephone ; les eclats des boites a lumiere dominent. */
    c += exp(-abs(y) * (34.0 / (1.0 + rug * 5.0))) * mix(uLueur, uLueurA, uAube) * 0.5;
    c += studio(d, rug) * mix(uLum, uLumA, uAube) * uBarres * 4.6;
    float ch = max(dot(d, uHaloDir), 0.0);
    c += uHalo * (pow(ch, 90.0) * 0.9 + pow(ch, 14.0) * 0.12) * mix(uHaloC, uHaloCA, uAube);
    float ca = max(dot(d, LUNE_DIR), 0.0);
    c += uLune * (smoothstep(0.9994 - rug * 0.004, 0.9997, ca) * 7.0 + pow(ca, 260.0) * 0.12) * uLuneC;
    return c;
  }
`;

/* Les couleurs de palette, partagees par tous les mondes (memes objets). */
function creerPalette() {
  const v = () => ({ value: new THREE.Vector3() });
  return {
    uZen: v(), uHor: v(), uLueur: v(), uSol: v(), uLum: v(), uHaloC: v(), uLuneC: v(),
    uZenA: v(), uHorA: v(), uLueurA: v(), uLumA: v(), uHaloCA: v(), tCiel: { value: null }, uCielImg: { value: 0 }, uUn: { value: 1 }
  };
}
function remplirPalette(P, X, m) {
  const s = (u, a) => u.value.set(lin(a[0]), lin(a[1]), lin(a[2]));
  s(P.uZen, m.zen); s(P.uHor, m.hor); s(P.uLueur, m.lueur); s(P.uSol, m.sol); s(P.uLum, m.lum); s(P.uHaloC, m.halo); s(P.uLuneC, m.lune);
  s(P.uZenA, m.zenA); s(P.uHorA, m.horA); s(P.uLueurA, m.lueurA); s(P.uLumA, m.lumA); s(P.uHaloCA, m.haloA);
  /* Les couleurs propres aux matieres. */
  const absorbe = (t, k) => new THREE.Vector3(...t.map((x) => -Math.log(Math.max(lin(x), 0.04)) * k));
  X.verreAbs.copy(absorbe(m.verre, 0.9));
  X.galetAbs.copy(absorbe(m.galet, 0.5));
  X.lait.set(lin(m.halo[0]), lin(m.halo[1]), lin(m.halo[2]));
  X.brume.set(lin(m.brume[0]), lin(m.brume[1]), lin(m.brume[2]));
  X.nom.set(lin(m.nom[0]), lin(m.nom[1]), lin(m.nom[2]));
  X.eau.set(lin(m.eau[0] * 1.6), lin(m.eau[1] * 1.6), lin(m.eau[2] * 1.6));
  X.lum.set(lin(m.lum[0]), lin(m.lum[1]), lin(m.lum[2]));
}

const VS_MONDE = /* glsl */`
  varying vec3 vN; varying vec3 vP; varying vec3 vO;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vP = wp.xyz; vO = position;
    vN = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }`;

/* Le fond : une grande sphere centree sur la camera, qui montre le meme ciel que
   celui que le verre refracte et que l'eau reflete (c'est ce qui rend le tout
   credible), plus des etoiles et, pour la brume, des bancs de brouillard. */
function fond(u, { attenue = 0.55, etoiles = 0, brouillard = 0, brumeC, barres = 0, lune = true }) {
  const m = new THREE.ShaderMaterial({
    uniforms: { ...u, uBarres: { value: u.uBarres.value * barres }, ...(lune ? {} : { uLune: { value: 0 } }), uAtt: { value: attenue }, uEt: { value: etoiles }, uBrou: { value: brouillard }, uBrumeC: { value: brumeC } },
    vertexShader: VS_MONDE,
    fragmentShader: BRUIT + CIEL + /* glsl */`
      uniform float uAtt, uEt, uBrou; uniform vec3 uBrumeC; varying vec3 vP;
      void main() {
        vec3 d = normalize(vP - cameraPosition);
        vec3 c = ciel(d, 0.0) * uAtt;
        vec3 g = floor(d * 300.0);
        float e = step(0.9972, h1(g)) * smoothstep(0.02, 0.3, d.y) * uEt;
        c += e * (0.55 + 0.45 * sin(uTemps * 1.1 + h1(g + 3.0) * 40.0)) * 0.22 * (0.4 + h1(g + 7.0));
        if (uBrou > 0.0) {
          vec2 q = d.xy / (1.2 - d.z * 0.2);
          float f = fbm(vec3(q * 2.2 + vec2(uTemps * 0.012, 0.0), uTemps * 0.02));
          float f2 = fbm(vec3(q * 5.0 - vec2(uTemps * 0.02, 0.0), 3.0 + uTemps * 0.03));
          c += uBrumeC * (pow(f, 2.2) * 0.07 + pow(f2, 3.0) * 0.03) * uBrou * smoothstep(-0.5, 0.2, d.y);
        }
        gl_FragColor = vec4(c, 1.0);
      }`,
    side: THREE.BackSide, depthWrite: false
  });
  const s = new THREE.Mesh(new THREE.SphereGeometry(60, 48, 24), m);
  s.renderOrder = -1;
  s.frustumCulled = false;
  return s;
}

/* ── Le verre lance en rayons ───────────────────────────────────────────── */
const VS_VERRE = /* glsl */`
  varying vec3 vPO; varying vec3 vNO; varying vec3 vCO; varying vec3 vPW;
  void main() {
    vPO = position; vNO = normal;
    vCO = (inverse(modelMatrix) * vec4(cameraPosition, 1.0)).xyz;
    vec4 wp = modelMatrix * vec4(position, 1.0); vPW = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }`;

const SORTIE_POLY = /* glsl */`
  uniform vec4 uPl[18];
  float sortie(vec3 p, vec3 d, out vec3 n) {
    float tm = 1e4; n = vec3(0.0, 1.0, 0.0);
    for (int k = 0; k < 18 * uUn; k++) {
      vec4 pl = uPl[k];
      float dn = dot(d, pl.xyz);
      if (dn > 1e-4) { float t = (pl.w - dot(p, pl.xyz)) / dn; if (t < tm) { tm = t; n = pl.xyz; } }
    }
    return max(tm, 0.0);
  }`;

const SORTIE_ELL = /* glsl */`
  uniform vec3 uE;
  float sortie(vec3 p, vec3 d, out vec3 n) {
    vec3 q = p / uE, e = d / uE;
    float a = dot(e, e), b = dot(q, e), c = dot(q, q) - 1.0;
    float t = max((-b + sqrt(max(b * b - a * c, 0.0))) / a, 0.0);
    vec3 x = p + d * t;
    n = normalize(x / (uE * uE));
    return t;
  }`;

function materiauVerre(u, X, { forme = 'poly', plans = null, ell = null, abs, ior = 1.52, disp = 0.03, rug = 0, lait = 0.4, eclat = 1, reb = 3, canaux = 3 }) {
  const uniforms = {
    ...u, uAbsC: { value: abs }, uLaitC: { value: X.lait }, uLumC: { value: X.lum },
    uLait: { value: lait }, uRug: { value: rug }, uIor: { value: ior }, uDisp: { value: disp }, uEclat: { value: eclat },
    uForme: { value: 1 }, uClipY: { value: -1e4 }, uPulse: { value: 0 }
  };
  if (plans) uniforms.uPl = { value: plans };
  if (ell) uniforms.uE = { value: ell };
  return new THREE.ShaderMaterial({
    uniforms,
    defines: { REB: reb, CANAUX: canaux, ...(forme === 'poly' ? { ARETES: 1, FORME: 1 } : {}) },
    vertexShader: VS_VERRE,
    fragmentShader: BRUIT + CIEL + (forme === 'poly' ? SORTIE_POLY : SORTIE_ELL) + /* glsl */`
      uniform mat4 modelMatrix;
      uniform vec3 uAbsC, uLaitC, uLumC;
      uniform float uLait, uRug, uIor, uDisp, uEclat, uForme, uClipY, uPulse;
      varying vec3 vPO; varying vec3 vNO; varying vec3 vCO; varying vec3 vPW;
      vec3 W(vec3 v) { return normalize(mat3(modelMatrix) * v); }
      float schlick(float c, float r0) { return r0 + (1.0 - r0) * pow(1.0 - clamp(c, 0.0, 1.0), 5.0); }
      /* Le rayon a l'interieur : il sort (refraction) ou rebondit (reflexion
         totale ou partielle), REB fois ; chaque sortie lit le ciel. */
      /* La dispersion se fait a chaque sortie : trois indices, trois directions,
         chacune ne garde que sa couleur. */
      vec3 sortir(vec3 d, vec3 n, vec3 o, float rug) {
        #if CANAUX == 3
          vec3 oR = refract(d, -n, uIor - uDisp), oB = refract(d, -n, uIor + uDisp);
          if (dot(oB, oB) < 1e-5) oB = o;
          vec3 cG = cielVerre(W(o), rug);
          return mix(cG, vec3(cielVerre(W(oR), rug).r, cG.g, cielVerre(W(oB), rug).b), 0.7);
        #else
          return cielVerre(W(o), rug);
        #endif
      }
      vec3 traverser(vec3 p, vec3 d, float rug) {
        vec3 acc = vec3(0.0); float T = 1.0; float L = 0.0; vec3 n;
        float r0 = pow((uIor - 1.0) / (uIor + 1.0), 2.0);
        for (int b = 0; b < REB * uUn; b++) {
          float t = sortie(p, d, n);
          p += d * t; L += t;
          vec3 o = refract(d, -n, uIor);
          if (dot(o, o) > 1e-5) {
            float Fi = schlick(dot(o, n), r0);
            acc += T * (1.0 - Fi) * exp(-uAbsC * L) * sortir(d, n, o, rug + float(b) * 0.08);
            T *= Fi;
          }
          d = reflect(d, -n);
        }
        acc += T * exp(-uAbsC * L) * cielVerre(W(d), rug + 0.3) * 0.8;
        return acc;
      }
      void main() {
        if (vPW.y < uClipY) discard;
        float lisiere = 0.0;
        #ifdef FORME
        if (uForme < 0.999) {
          /* Le cristal se forme : la matiere gagne de bas en haut selon un bruit,
             avec une lisiere de lumiere. */
          float m = fbm(vPO * 2.4 + 3.0) * 0.6 + (vPO.y * 0.3 + 0.5) * 0.4;
          float s = uForme * 1.25 - 0.08;
          if (m > s) discard;
          lisiere = 1.0 - smoothstep(0.0, 0.07, s - m);
        }
        #endif
        vec3 rd = normalize(vPO - vCO);
        vec3 n = normalize(vNO);
        if (dot(n, rd) > 0.0) n = -n;
        float r0 = pow((uIor - 1.0) / (uIor + 1.0), 2.0);
        float F = schlick(dot(-rd, n), r0);
        vec3 refl = ciel(W(reflect(rd, n)), uRug * 0.5);
        vec3 dIn = refract(rd, n, 1.0 / uIor);
        vec3 tr = traverser(vPO, dIn, uRug);
        vec3 nn; float ep = sortie(vPO, dIn, nn);
        vec3 col = tr * (1.0 - F) + refl * F;
        /* Le corps laiteux du quartz : plus il est epais, plus il retient de lumiere. */
        col += uLaitC * uLait * (1.0 - exp(-ep * 1.4)) * (0.6 + 0.4 * bruit(vPO * 3.0 + uTemps * 0.03));
        /* Des voiles laiteux a l'interieur, etires le long de l'axe, comme dans le
           quartz : on les lit en trois points du trajet, ils bougent avec le regard. */
        float voile = 0.0;
        for (int i = 1; i <= 3 * uUn; i++) voile += smoothstep(0.58, 0.9, bruit((vPO + dIn * ep * float(i) * 0.25) * vec3(3.2, 1.1, 3.2) + 7.0));
        col += uLaitC * voile * uLait * 0.5;
        #ifdef ARETES
          /* Les aretes : une ligne de lumiere la ou deux faces se rencontrent. */
          float best = 1e3; int kf = 0;
          for (int k = 0; k < 18 * uUn; k++) { float s = abs(dot(vPO, uPl[k].xyz) - uPl[k].w); if (s < best) { best = s; kf = k; } }
          vec3 nf = uPl[kf].xyz;
          float dmin = 1e3;
          for (int k = 0; k < 18 * uUn; k++) {
            if (k == kf) continue;
            float cs = dot(nf, uPl[k].xyz);
            float s = (uPl[k].w - dot(vPO, uPl[k].xyz)) / sqrt(max(1.0 - cs * cs, 0.02));
            dmin = min(dmin, s);
          }
          float arete = exp(-max(dmin, 0.0) / (0.006 + fwidth(dmin) * 1.2));
          col += arete * (uEclat + uPulse * 2.0) * (0.03 + refl * 1.1 + uLumC * 0.06);
        #endif
        col += uLumC * uPulse * 0.25 * (1.0 - exp(-ep));
        col += uLumC * lisiere * 3.0;
        gl_FragColor = vec4(col, 1.0);
      }`
  });
}

/* ── L'eau : un plan miroir ─────────────────────────────────────────────── */
function creerEau(u, X, { niveau = 0, amp = 1, taille = 160, miroir = 0.02, scint = 1 }) {
  const src = Array.from({ length: 12 }, () => new THREE.Vector4(0, 0, -99, 0));
  const m = new THREE.ShaderMaterial({
    uniforms: { ...u, uSrc: { value: src }, tRefl: { value: null }, uReflMat: { value: new THREE.Matrix4() }, uReflOK: { value: 0 }, uEauC: { value: X.eau }, uAmp: { value: amp }, uMiroir: { value: miroir }, uScint: { value: scint } },
    vertexShader: VS_MONDE,
    fragmentShader: BRUIT + CIEL + /* glsl */`
      uniform vec4 uSrc[12]; uniform sampler2D tRefl; uniform mat4 uReflMat; uniform float uReflOK, uAmp, uMiroir, uScint; uniform vec3 uEauC;
      varying vec3 vP;
      float haut(vec2 p, float lod) {
        float t = uTemps;
        float h = sin(dot(p, vec2(0.80, 0.60)) * 1.3 + t * 0.8) * 0.020
                + sin(dot(p, vec2(-0.55, 0.83)) * 2.1 + t * 1.05) * 0.012
                + (bruit(vec3(p * 1.3, t * 0.12)) - 0.5) * 0.030;
        h += lod * (sin(dot(p, vec2(0.97, -0.24)) * 3.9 + t * 1.5) * 0.006 + sin(dot(p, vec2(0.21, 0.98)) * 6.3 + t * 1.9) * 0.0035
                  + (bruit(vec3(p * 4.1 + 3.0, t * 0.35)) - 0.5) * 0.010);
        h *= uAmp;
        for (int i = 0; i < 12 * uUn; i++) {
          vec4 s = uSrc[i];
          float age = t - s.z;
          if (age < 0.0 || age > 11.0) continue;
          float r = length(p - s.xy);
          float d = r - age * 1.0;
          float env = exp(-d * d * 0.9) * exp(-age * 0.32) / (1.0 + r * 0.35);
          env *= smoothstep(0.0, 0.35, age) * (1.0 - smoothstep(8.0, 11.0, age));
          h += sin(d * 6.0) * env * 0.07 * s.w;
        }
        return h;
      }
      void main() {
        vec2 p = vP.xz;
        float dist = length(vP - cameraPosition);
        float lod = 1.0 - smoothstep(4.0, 20.0, dist);
        float e = 0.025 + dist * 0.004;
        float h0 = haut(p, lod);
        vec3 N = normalize(vec3(-(haut(p + vec2(e, 0.0), lod) - h0) / e, 1.0, -(haut(p + vec2(0.0, e), lod) - h0) / e));
        N = normalize(mix(N, vec3(0.0, 1.0, 0.0), smoothstep(16.0, 55.0, dist)));
        vec3 V = normalize(cameraPosition - vP);
        float F = uMiroir + (1.0 - uMiroir) * pow(1.0 - max(dot(N, V), 0.0), 5.0);
        vec3 r = reflect(-V, N);
        vec3 R;
        if (uReflOK > 0.5) {
          vec4 pr = uReflMat * vec4(vP + vec3(N.x, 0.0, N.z) * (0.5 + dist * 0.02), 1.0);
          vec2 ruv = pr.xy / pr.w;
          vec2 bord = smoothstep(vec2(0.0), vec2(0.04), ruv) * smoothstep(vec2(0.0), vec2(0.04), 1.0 - ruv);
          R = mix(cielFond(r, 0.0), texture2D(tRefl, clamp(ruv, vec2(0.002), vec2(0.998))).rgb, bord.x * bord.y);
        } else R = ciel(r, 0.0);
        float ca = max(dot(r, LUNE_DIR), 0.0);
        float scint = pow(ca, 2400.0) * 10.0 + pow(ca, 300.0) * 0.35;
        vec3 c = mix(uEauC, R, F) + scint * uScint * uLune * uLuneC * (0.3 + F);
        vec3 hz = cielFond(normalize(vec3(vP.x - cameraPosition.x, 0.0, vP.z - cameraPosition.z)), 0.3);
        c = mix(c, hz, smoothstep(22.0, 60.0, dist));
        gl_FragColor = vec4(c, 1.0);
      }`
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(taille, taille, 1, 1), m);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = niveau;
  let k = 0;
  const onde = (x, z, t, a = 1) => {
    /* On remplace la plus ancienne : elle est deja eteinte, rien ne saute. */
    let vieille = 0, ageMax = -1;
    for (let i = 0; i < src.length; i++) { const age = t - src[i].z; if (age > ageMax) { ageMax = age; vieille = i; } }
    k = vieille; src[k].set(x, z, t, a);
  };
  return { mesh, onde, mat: m, niveau };
}

/* ── Les formes ─────────────────────────────────────────────────────────── */
function alea(graine) {
  let a = graine >>> 0 || 1;
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function hashJS(x, y, z) { const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return s - Math.floor(s); }
function bruitJS(x, y, z) {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
  const fx = x - ix, fy = y - iy, fz = z - iz;
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy), sz = fz * fz * (3 - 2 * fz);
  const L = (a, b, t) => a + (b - a) * t;
  const h = (a, b, c) => hashJS(ix + a, iy + b, iz + c);
  return L(L(L(h(0, 0, 0), h(1, 0, 0), sx), L(h(0, 1, 0), h(1, 1, 0), sx), sy), L(L(h(0, 0, 1), h(1, 0, 1), sx), L(h(0, 1, 1), h(1, 1, 1), sx), sy), sz);
}

/* Un quartz : un prisme hexagonal un peu irregulier, termine en pointe des deux
   cotes. Toutes ses faces sont planes et il est convexe : on garde ses 18 plans
   pour lancer les rayons a l'interieur. */
function quartz(graine, { r = 0.5, y0 = -0.5, y1 = 0.55, haut = 1.38, bas = -1.18, effile = 0.86 } = {}) {
  const rnd = alea(graine * 7919 + 13);
  let ring = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + (rnd() - 0.5) * 0.16;
    const rr = r * (0.88 + rnd() * 0.24);
    ring.push([Math.cos(a) * rr, Math.sin(a) * rr]);
  }
  const convexe = ring.every((p, i) => {
    const q = ring[(i + 1) % 6], s = ring[(i + 2) % 6];
    return (q[0] - p[0]) * (s[1] - q[1]) - (q[1] - p[1]) * (s[0] - q[0]) > 0;
  });
  if (!convexe) ring = ring.map((_, i) => [Math.cos(i / 6 * Math.PI * 2) * r, Math.sin(i / 6 * Math.PI * 2) * r]);
  const V = THREE.Vector3;
  const B = ring.map(([x, z]) => new V(x, y0, z)), T = ring.map(([x, z]) => new V(x * effile, y1, z * effile));
  const AT = new V((rnd() - 0.5) * r * 0.2 * effile, haut, (rnd() - 0.5) * r * 0.2 * effile);
  const AB = new V((rnd() - 0.5) * r * 0.18, bas, (rnd() - 0.5) * r * 0.18);
  const faces = [];
  for (let i = 0; i < 6; i++) {
    const j = (i + 1) % 6;
    faces.push([B[i], B[j], T[j], T[i]], [T[i], T[j], AT], [B[j], B[i], AB]);
  }
  const centre = new V(0, (y0 + y1) / 2, 0);
  const pos = [], nor = [], plans = [];
  for (let f of faces) {
    let n = new V().subVectors(f[1], f[0]).cross(new V().subVectors(f[2], f[0])).normalize();
    const cf = f.reduce((s, p) => s.add(p), new V()).divideScalar(f.length);
    if (n.dot(new V().subVectors(cf, centre)) < 0) { n.negate(); f = f.slice().reverse(); }
    plans.push(new THREE.Vector4(n.x, n.y, n.z, n.dot(f[0])));
    for (let k = 1; k < f.length - 1; k++) for (const p of [f[0], f[k], f[k + 1]]) { pos.push(p.x, p.y, p.z); nor.push(n.x, n.y, n.z); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.computeBoundingSphere();
  return { geo: g, plans };
}

/* Un galet de verre : une sphere ecrasee et bosselee, lisse. Pour les rayons
   internes, on l'approche par un ellipsoide. */
const GALET_E = new THREE.Vector3(1.05 * 1.02, 0.52 * 1.02, 0.86 * 1.02);
function geoGalet(graine, segs = 72) {
  const g = new THREE.SphereGeometry(1, segs, Math.round(segs * 0.55));
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const n = bruitJS(x * 1.3 + graine, y * 1.3, z * 1.3) * 0.16 + bruitJS(x * 3 + graine, y * 3, z * 3) * 0.04;
    const r = 0.92 + n;
    p.setXYZ(i, x * r * 1.05, y * r * 0.52, z * r * 0.86);
  }
  g.computeVertexNormals();
  return g;
}

function poussiere(n, etendue, couleur) {
  const pos = new Float32Array(n * 3), al = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    pos[i * 3] = (Math.random() - 0.5) * etendue[0];
    pos[i * 3 + 1] = (Math.random() - 0.5) * etendue[1];
    pos[i * 3 + 2] = (Math.random() - 0.5) * etendue[2];
    al[i] = Math.random();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aAl', new THREE.BufferAttribute(al, 1));
  const m = new THREE.ShaderMaterial({
    uniforms: { uTemps: { value: 0 }, uPix: { value: 1 }, uH: { value: etendue[1] }, uCoul: { value: couleur }, uClipY: { value: -1e4 } },
    vertexShader: /* glsl */`
      uniform float uTemps, uPix, uH; attribute float aAl; varying float vA; varying float vY;
      void main() {
        vec3 p = position;
        p.y = mod(p.y + uTemps * (0.03 + aAl * 0.04) + uH * 0.5, uH) - uH * 0.5;
        p.x += sin(uTemps * 0.2 + aAl * 30.0) * 0.15;
        vec4 wp = modelMatrix * vec4(p, 1.0); vY = wp.y;
        vec4 mv = viewMatrix * wp;
        gl_Position = projectionMatrix * mv;
        gl_PointSize = min((1.2 + aAl * 2.2) * uPix * 0.25 / max(-mv.z, 0.8), 12.0);
        vA = (0.25 + 0.6 * aAl) * (0.6 + 0.4 * sin(uTemps * 0.7 + aAl * 50.0));
        vA *= smoothstep(0.4, 1.6, -mv.z);
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uCoul; uniform float uClipY; varying float vA; varying float vY;
      void main() { if (vY < uClipY) discard; float d = length(gl_PointCoord - 0.5); float a = 1.0 - smoothstep(0.0, 0.5, d); gl_FragColor = vec4(uCoul * a * a * vA * 0.5, 1.0); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
  });
  const pts = new THREE.Points(g, m);
  pts.frustumCulled = false;
  return pts;
}

/* Decale le centre optique (objectif a decentrement) : le sujet glisse vers
   la droite sur ordinateur, vers le haut sur telephone, et le texte garde
   une zone calme. */
function decentrer(cam, W, H, dx, dy) {
  cam.aspect = W / H;
  cam.setViewOffset(W, H, -dx * W, dy * H, W, H);
  cam.updateProjectionMatrix();
}

const lisser = (a, b, dt, k) => a + (b - a) * (1 - Math.exp(-dt * k));
const sat = (x) => Math.min(1, Math.max(0, x));
const sstep = (a, b, x) => { const t = sat((x - a) / (b - a)); return t * t * (3 - 2 * t); };

/* ── Monde 1 : le cristal, au-dessus de l'eau noire ────────────────────── */
function mondeCristal(ctx, P, X) {
  const u = { ...P, uAube: { value: 0 }, uLune: { value: 0 }, uBarres: { value: 1 }, uTemps: { value: 0 }, uHalo: { value: 1 }, uHaloDir: { value: new THREE.Vector3(0.33, 0.06, -1) } };
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 200);
  const ciel = fond(u, { attenue: 0.5, etoiles: 0.7, brumeC: X.brume, barres: 0.1 });
  scene.add(ciel);
  const tel = ctx.telephone;
  const groupe = new THREE.Group();
  groupe.position.y = 0.12;
  scene.add(groupe);
  const Q = quartz(3);
  const verre = materiauVerre(u, X, { plans: Q.plans, abs: X.verreAbs, ior: 1.54, disp: tel ? 0.026 : 0.032, lait: 0.22, reb: tel ? 2 : 3, canaux: 3, eclat: 1 });
  const cristal = new THREE.Mesh(Q.geo, verre);
  cristal.rotation.z = 0.14;
  groupe.add(cristal);
  const verres = [verre];
  const sat3 = [
    { s: 0.34, r: 1.6, v: 0.10, y: 0.55, a: 0.4, g: 11 },
    { s: 0.24, r: 2.0, v: -0.07, y: -0.62, a: 2.6, g: 17 },
    { s: 0.17, r: 1.35, v: 0.14, y: -1.0, a: 4.4, g: 23 }
  ].map((o) => {
    const q = quartz(o.g, { y0: -0.4, y1: 0.42, haut: 1.05, bas: -0.95 });
    const mat = materiauVerre(u, X, { plans: q.plans, abs: X.verreAbs, ior: 1.54, disp: tel ? 0.026 : 0.032, lait: 0.2, reb: tel ? 2 : 3, canaux: 3, eclat: 0.8 });
    verres.push(mat);
    const m = new THREE.Mesh(q.geo, mat); m.scale.setScalar(o.s); groupe.add(m); return { m, ...o };
  });
  const eau = creerEau(u, X, { niveau: -1.05, amp: 0.5, miroir: 0.3 });
  scene.add(eau.mesh);
  const pous = poussiere(tel ? 200 : 480, [12, 8, 10], X.lum);
  scene.add(pous);
  let aube = 0, rot = 0, w = 0, pulse = 0;
  const centre = new THREE.Vector3();
  const sphere = new THREE.Sphere(new THREE.Vector3(), 1.5);
  return {
    nom: 'cristal', scene, camera, eau, ciel, verres, poussieres: [pous],
    dimensionner(W, H) {
      const t = W < H;
      /* Sur telephone : le cristal au-dessus du nom, sous le bandeau (meme quand l'accroche est longue). */
      decentrer(camera, W, H, t ? 0 : 0.2, t ? 0.245 : 0.03);
      camera.fov = t ? 44 : 34; camera.updateProjectionMatrix();
      groupe.scale.setScalar(t ? 0.64 : 0.86);
      pous.material.uniforms.uPix.value = ctx.dpr() * H / 900 * 40;
    },
    /* Attraper et lancer : la vitesse du geste devient une rotation qui s'amortit. */
    saisir(ray) { groupe.getWorldPosition(centre); sphere.center.copy(centre); sphere.radius = 1.45 * groupe.scale.x; return ray.intersectsSphere(sphere); },
    tourner(dx, dt) { rot += dx; w = lisser(w, dx / Math.max(dt, 0.008), dt, 18); },
    lacher() { w = Math.max(-6, Math.min(6, w)); },
    frapper() { pulse = 1; },
    maj(t, dt, e) {
      const variante = e.variante === 'aube' ? 1 : 0;
      aube = lisser(aube, variante, dt, 2.2);
      u.uAube.value = aube; u.uTemps.value = t;
      pous.material.uniforms.uTemps.value = t;
      const p = e.p;
      if (!e.saisi) { w *= Math.exp(-dt * 1.4); rot += w * dt; }
      rot += dt * (e.reduit ? 0.05 : 0.11);
      pulse *= Math.exp(-dt * 2.2);
      for (const v of verres) { v.uniforms.uForme.value = e.forme; v.uniforms.uPulse.value = pulse; }
      cristal.rotation.y = rot + p * 1.4;
      cristal.position.y = Math.sin(t * 0.5) * 0.06;
      for (const s of sat3) {
        const a = s.a + t * s.v + p * 0.8 + rot * 0.15;
        s.m.position.set(Math.cos(a) * s.r, s.y + Math.sin(t * 0.45 + s.a) * 0.08, Math.sin(a) * s.r);
        s.m.rotation.set(t * 0.17 + s.a, t * 0.23 + s.a + rot * 0.3, 0.3);
      }
      const ang = -0.35 + p * 0.9 + aube * 0.6;
      const dist = 6.4 - p * 1.6 - aube * 0.4;
      camera.position.set(Math.sin(ang) * dist, 0.28 - p * 0.3 + aube * 0.35 + Math.sin(t * 0.13) * 0.04, Math.cos(ang) * dist);
      camera.lookAt(0, -0.05, 0);
      u.uHaloDir.value.set(-camera.position.x, 0.25 - camera.position.y, -camera.position.z).normalize();
    }
  };
}

/* ── Monde 2 : l'eau sous la lune ──────────────────────────────────────── */
function mondeEau(ctx, P, X) {
  const u = { ...P, uAube: { value: 0 }, uLune: { value: 1 }, uBarres: { value: 0 }, uTemps: { value: 0 }, uHalo: { value: 0 }, uHaloDir: { value: new THREE.Vector3(0, 0, -1) } };
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 200);
  const ciel = fond(u, { attenue: 1, etoiles: 1, brumeC: X.brume });
  scene.add(ciel);
  const eau = creerEau(u, X, { niveau: 0, amp: 1 });
  scene.add(eau.mesh);
  let prochaine = 0.8;
  return {
    nom: 'eau', scene, camera, eau, ciel, verres: [], poussieres: [],
    dimensionner(W, H) {
      const t = W < H;
      decentrer(camera, W, H, t ? 0 : 0.12, t ? 0.06 : 0);
      camera.fov = t ? 55 : 40; camera.updateProjectionMatrix();
    },
    maj(t, dt, e) {
      u.uTemps.value = t;
      const p = e.p;
      camera.position.set(Math.sin(p * Math.PI) * 0.5, 1.35 - p * 0.55, 6 - p * 3.4);
      camera.lookAt(Math.sin(p * Math.PI) * 0.3, 0.78 - p * 0.25, -12);
      if (t > prochaine) {
        /* Une goutte, de temps en temps, loin devant. */
        eau.onde(camera.position.x + 0.8 + (Math.random() - 0.5) * 3, camera.position.z - 5 - Math.random() * 4, t, (e.reduit ? 0.5 : 0.8) + Math.random() * 0.5);
        prochaine = t + (e.reduit ? 4.5 : 2.6) + Math.random() * 2.4;
      }
    }
  };
}

/* ── Monde 3 : les galets, une pierre par etape ────────────────────────── */
function mondeGalets(ctx, P, X) {
  const u = { ...P, uAube: { value: 0 }, uLune: { value: 1 }, uBarres: { value: 0.42 }, uTemps: { value: 0 }, uHalo: { value: 0 }, uHaloDir: { value: new THREE.Vector3(0, 0, -1) } };
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 200);
  const ciel = fond(u, { attenue: 0.9, etoiles: 0.8, brumeC: X.brume, lune: false });
  scene.add(ciel);
  const eau = creerEau(u, X, { niveau: 0, amp: 0.9, miroir: 0.1, scint: 0.45 });
  scene.add(eau.mesh);
  const n = Math.max(1, ctx.etapes);
  const pas = 3.4;
  const tel = ctx.telephone;
  const verre = materiauVerre(u, X, { forme: 'ell', ell: GALET_E, abs: X.galetAbs, ior: 1.5, disp: 0.02, rug: ctx.vide ? 0.45 : 0.04, lait: ctx.vide ? 0.45 : 0.12, reb: tel ? 2 : 3, canaux: 1, eclat: 0 });
  const galets = [];
  for (let i = 0; i < n + 3; i++) {
    const m = new THREE.Mesh(geoGalet(i * 3.7 + 1, tel ? 48 : 72), verre);
    const reel = i < n;
    /* Pair : la pierre a droite, le texte a gauche ; impair : l'inverse. */
    const x = reel ? (i % 2 ? -0.8 : 0.8) : [2.9, -2.6, 3.4][i - n];
    const z = reel ? -i * pas : -(n - 1) * pas * [0.3, 0.7, 1.1][i - n] - 2.5;
    const s = reel ? 0.62 : 0.34;
    m.position.set(x, s * 0.4, z);
    m.scale.setScalar(s);
    m.rotation.y = i * 1.3;
    scene.add(m);
    galets.push({ m, x, z, s, reel, touche: false, dy: 0, vy: 0 });
  }
  const pous = poussiere(tel ? 150 : 360, [10, 5, 16], X.lum);
  pous.position.z = -(n - 1) * pas * 0.5;
  scene.add(pous);
  const ray = new THREE.Raycaster();
  return {
    nom: 'galets', scene, camera, eau, ciel, verres: [verre], poussieres: [pous],
    dimensionner(W, H) {
      const t = W < H;
      decentrer(camera, W, H, 0, t ? 0.28 : 0);
      camera.fov = t ? 50 : 38; camera.updateProjectionMatrix();
      pous.material.uniforms.uPix.value = ctx.dpr() * H / 900 * 40;
    },
    /* Toucher une pierre : elle plonge un peu, remonte (ressort), l'eau repond. */
    toucherPierre(r, t) {
      const hit = r.intersectObjects(galets.map((g) => g.m), false)[0];
      if (!hit) return false;
      const g = galets.find((x) => x.m === hit.object);
      g.vy -= 0.9; eau.onde(g.x, g.z, t, 1.3);
      return true;
    },
    maj(t, dt, e) {
      u.uTemps.value = t;
      pous.material.uniforms.uTemps.value = t;
      const c = Math.min(n - 1, Math.max(-0.6, e.etape));
      const monte = e.monte;
      const cz = -c * pas;
      for (const g of galets) {
        g.vy += (-g.dy * 30 - g.vy * 4.2) * dt; g.dy += g.vy * dt;
        g.m.position.y = g.s * 0.4 + Math.sin(t * 0.7 + g.z) * 0.025 + g.dy;
        g.m.rotation.y += dt * 0.04;
        const proche = g.reel && Math.abs(g.z - cz) < 0.6;
        if (proche && !g.touche) { eau.onde(g.x, g.z, t, e.reduit ? 0.8 : 1.2); g.touche = true; }
        if (!proche && Math.abs(g.z - cz) > 1.6) g.touche = false;
      }
      const c0 = Math.max(0, Math.floor(c)), c1 = Math.min(n - 1, c0 + 1), fr = Math.max(0, c) - c0;
      const gx = galets[c0].x + (galets[c1].x - galets[c0].x) * sstep(0, 1, fr);
      if (ctx.telephone) {
        camera.position.set(gx * 0.85, 1.25 + monte * 3.6, cz + 4.2 + monte * 3.2);
        camera.lookAt(gx * 0.95, 0.2 - monte * 0.2, cz - 1.2 - monte * 2.6);
      } else {
        /* La pierre lue glisse de son cote ; le texte, de l'autre. */
        camera.position.set(gx * 0.15 + monte * 0.3, 1.05 + monte * 3.4, cz + 4.4 + monte * 3.5);
        camera.lookAt(gx * 0.05 - gx * 0.75 * (1 - monte), 0.3 - monte * 0.25, cz - 1.0 - monte * 2.6);
      }
      if (Math.random() < dt * (e.reduit ? 0.12 : 0.22)) eau.onde((Math.random() - 0.5) * 7, cz - 3 - Math.random() * 6, t, 0.5);
    }
  };
}

/* ── Monde 4 : la brume qui devient un prenom ──────────────────────────── */
async function mondeBrume(ctx, P, X) {
  const u = { ...P, uAube: { value: 0 }, uLune: { value: 0 }, uBarres: { value: 0.1 }, uTemps: { value: 0 }, uHalo: { value: 0 }, uHaloDir: { value: new THREE.Vector3(0, 0, -1) } };
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 200);
  const ciel = fond(u, { attenue: 0.8, etoiles: 0.35, brouillard: 1, brumeC: X.brume });
  scene.add(ciel);

  /* Les lettres : le prenom dessine dans une toile, dont on garde les pixels pleins. */
  const LW = 1400, LH = 420;
  const toile = document.createElement('canvas');
  toile.width = LW; toile.height = LH;
  const g2 = toile.getContext('2d', { willReadFrequently: true });
  const police = '"Cormorant Garamond", Georgia, serif';
  try { await Promise.race([document.fonts.load(`italic 500 200px ${police}`), new Promise((r) => setTimeout(r, 800))]); } catch {}
  let taille = 330;
  g2.font = `italic 500 ${taille}px ${police}`;
  const largeur = g2.measureText(ctx.prenom).width;
  taille = Math.min(taille, taille * (LW * 0.92) / Math.max(1, largeur));
  g2.font = `italic 500 ${taille}px ${police}`;
  g2.fillStyle = '#fff'; g2.textAlign = 'center'; g2.textBaseline = 'middle';
  g2.fillText(ctx.prenom, LW / 2, LH / 2 + taille * 0.04);
  const img = g2.getImageData(0, 0, LW, LH).data;
  const pleins = [];
  for (let y = 0; y < LH; y += 2) for (let x = 0; x < LW; x += 2) if (img[(y * LW + x) * 4 + 3] > 140) pleins.push(x, y);
  let minX = LW, maxX = 0;
  for (let i = 0; i < pleins.length; i += 2) { minX = Math.min(minX, pleins[i]); maxX = Math.max(maxX, pleins[i]); }
  const motL = Math.max(1, maxX - minX) / LW;

  const N = ctx.telephone ? 9000 : 22000;
  const pos = new Float32Array(N * 3), cible = new Float32Array(N * 3), al = new Float32Array(N * 4);
  const BW = 10, BH = BW * LH / LW;
  for (let i = 0; i < N; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 16;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 8;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 8 - 1;
    const libre = Math.random() < 0.18 || pleins.length === 0;
    if (!libre) {
      const k = Math.floor(Math.random() * (pleins.length / 2)) * 2;
      cible[i * 3] = ((pleins[k] + Math.random() * 2) / LW - 0.5) * BW;
      cible[i * 3 + 1] = -((pleins[k + 1] + Math.random() * 2) / LH - 0.5) * BH;
      cible[i * 3 + 2] = (Math.random() - 0.5) * 0.12;
    }
    al[i * 4] = Math.random(); al[i * 4 + 1] = Math.random(); al[i * 4 + 2] = Math.random();
    al[i * 4 + 3] = libre ? 3 : Math.random();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aCible', new THREE.BufferAttribute(cible, 3));
  geo.setAttribute('aAlea', new THREE.BufferAttribute(al, 4));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTemps: { value: 0 }, uCond: { value: 0 }, uPix: { value: 1 }, uEch: { value: 1 }, uBrumeC: { value: X.brume }, uNomC: { value: X.nom } },
    vertexShader: BRUIT + /* glsl */`
      uniform float uTemps, uCond, uPix, uEch;
      attribute vec3 aCible; attribute vec4 aAlea;
      varying float vA; varying float vC;
      void main() {
        float t = uTemps * 0.05;
        vec3 b = position;
        b += vec3(fbm(b * 0.25 + vec3(t, 0.0, 0.0)) - 0.5, fbm(b * 0.25 + vec3(0.0, t + 3.0, 0.0)) - 0.5, fbm(b * 0.25 + vec3(0.0, 0.0, t + 7.0)) - 0.5) * 3.2;
        b.x += sin(uTemps * 0.07 + aAlea.x * 6.28) * 0.5;
        float c = smoothstep(aAlea.w * 0.5, aAlea.w * 0.5 + 0.5, uCond);
        vec3 cb = aCible / uEch + vec3(sin(uTemps * 0.9 + aAlea.x * 40.0), cos(uTemps * 0.8 + aAlea.y * 40.0), 0.0) * 0.006;
        vec3 p = mix(b, cb, c);
        p += sin(c * 3.14159) * vec3((aAlea.x - 0.5) * 0.8, (aAlea.y - 0.5) * 0.9, (aAlea.z - 0.5) * 1.6);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        /* Un peu de profondeur de champ : plus gros et plus pales hors du plan net. */
        float flou = abs(-mv.z - 7.0) * 0.12;
        gl_PointSize = min(uPix * (0.55 + aAlea.z * 0.9) * mix(1.0, 1.3, c) * (1.0 + flou * (1.0 - c)) / max(-mv.z, 0.8), 18.0);
        vA = mix(0.14 + aAlea.x * 0.2, 0.62 + aAlea.x * 0.2, c) / (1.0 + flou * 1.5 * (1.0 - c));
        vC = c;
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uBrumeC, uNomC; varying float vA; varying float vC;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = 1.0 - smoothstep(0.0, 0.5, d); a *= a;
        vec3 col = mix(uBrumeC * 0.9, uNomC * 1.25, vC);
        gl_FragColor = vec4(col * a * vA, 1.0);
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  scene.add(points);
  let cond = 0;
  return {
    nom: 'brume', scene, camera, ciel, verres: [], poussieres: [],
    dimensionner(W, H) {
      const t = W < H;
      decentrer(camera, W, H, 0, 0);
      camera.fov = t ? 50 : 40; camera.updateProjectionMatrix();
      const visL = 2 * 7 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect;
      const voulu = Math.min(visL * (t ? 0.86 : 0.62), 9.5);
      mat.uniforms.uEch.value = (motL * BW) / voulu;
      mat.uniforms.uPix.value = ctx.dpr() * H / 900 * (t ? 30 : 26);
    },
    maj(t, dt, e) {
      u.uTemps.value = t;
      mat.uniforms.uTemps.value = t;
      cond = lisser(cond, e.cond, dt, e.reduit ? 2.2 : 3);
      mat.uniforms.uCond.value = cond;
      camera.position.set(Math.sin(t * 0.07) * 0.2, Math.sin(t * 0.05) * 0.08, 7 - cond * 0.4);
      camera.lookAt(0, 0, 0);
    }
  };
}

/* ── Les passes d'image ─────────────────────────────────────────────────── */
const VS_PLEIN = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';

/* La composition de deux mondes : coupe, dispersion, ou fondu en brume. */
const FS_COMPO = BRUIT + /* glsl */`
  uniform sampler2D tA, tB; uniform float uCoupe, uMode, uAspect, uTemps; uniform vec3 uLisC;
  varying vec2 vUv;
  /* Tour 4 : le passage d'un monde a l'autre n'a plus de bord. Plus de dechirure en diagonale ni de
     poussiere en taches : un fondu a tres grande echelle, module par une brume lente, qui monte du bas de
     l'ecran (la ou arrive la page suivante). Les deux mondes glissent ensemble vers le haut, au rythme
     de la page, et une brume legere les voile au milieu du passage : on traverse une meme matiere. */
  void main() {
    vec2 uv = vUv;
    vec2 q = vec2((uv.x - 0.5) * uAspect, uv.y);
    float e = uCoupe * uCoupe * (3.0 - 2.0 * uCoupe);
    float n = fbm(vec3(q * 1.1, uTemps * 0.05)) * 0.75 + fbm(vec3(q * 3.2, uTemps * 0.03 + 5.0)) * 0.25;
    float large = uMode > 1.5 ? 0.32 : 0.42;
    float front = n * 0.55 + uv.y * 0.45;
    float k = smoothstep(front - large, front + large, mix(-large, 1.0 + large, e));
    vec3 a, b;
    if (uMode > 1.5) {
      a = texture2D(tA, uv).rgb; b = texture2D(tB, uv).rgb;
    } else {
      a = texture2D(tA, uv + vec2(0.0, -0.04 * e)).rgb;
      b = texture2D(tB, uv + vec2(0.0, 0.04 * (1.0 - e))).rgb;
    }
    vec3 c = mix(a, b, k);
    float voile = sin(3.14159 * e) * (uMode > 0.5 && uMode < 1.5 ? 0.24 : 0.14);
    vec3 brume = vec3(dot(c, vec3(0.3333))) * 0.85 + uLisC * 0.05;
    c = mix(c, brume, voile);
    gl_FragColor = vec4(c, 1.0);
  }`;

/* Le halo : extraction des hautes lumieres, puis flou en deux passes. */
const FS_CLAIR = /* glsl */`
  uniform sampler2D tSrc; uniform vec2 uTexel; uniform float uSeuil, uBrut; varying vec2 vUv;
  void main() {
    vec3 c = texture2D(tSrc, vUv + uTexel * vec2(-1.0, -1.0)).rgb + texture2D(tSrc, vUv + uTexel * vec2(1.0, -1.0)).rgb
           + texture2D(tSrc, vUv + uTexel * vec2(-1.0, 1.0)).rgb + texture2D(tSrc, vUv + uTexel * vec2(1.0, 1.0)).rgb;
    c *= 0.25;
    float l = max(c.r, max(c.g, c.b));
    float k = uBrut > 0.5 ? 1.0 : smoothstep(uSeuil, uSeuil * 2.5, l);
    gl_FragColor = vec4(min(c * k, vec3(24.0)), 1.0);
  }`;
const FS_FLOU = /* glsl */`
  uniform sampler2D tSrc; uniform vec2 uDir; varying vec2 vUv;
  void main() {
    vec3 c = texture2D(tSrc, vUv).rgb * 0.227027;
    c += (texture2D(tSrc, vUv + uDir * 1.3846).rgb + texture2D(tSrc, vUv - uDir * 1.3846).rgb) * 0.3162162;
    c += (texture2D(tSrc, vUv + uDir * 3.2308).rgb + texture2D(tSrc, vUv - uDir * 3.2308).rgb) * 0.0702703;
    gl_FragColor = vec4(c, 1.0);
  }`;

/* L'image finale : halo, exposition, vignettage, rendu filmique, encodage,
   ouverture en brume (l'intro), grain. */
const FS_FINAL = BRUIT + /* glsl */`
  uniform sampler2D tSrc, tHalo, tHalo2; uniform float uHaloF, uExpo, uTemps, uGrain, uFr, uIntro, uAspect; uniform vec3 uFondC, uBrumeC; uniform vec2 uRes;
  varying vec2 vUv;
  void main() {
    vec2 uv = vUv;
    vec2 dv = uv - 0.5;
    vec3 c;
    if (uFr > 0.0) { vec2 d = dv * uFr; c = vec3(texture2D(tSrc, uv - d).r, texture2D(tSrc, uv).g, texture2D(tSrc, uv + d).b); }
    else c = texture2D(tSrc, uv).rgb;
    c += (texture2D(tHalo, uv).rgb * 0.7 + texture2D(tHalo2, uv).rgb * 0.32) * uHaloF;
    c *= uExpo;
    c *= 1.0 - 0.38 * smoothstep(0.18, 0.95, dot(dv, dv) * 2.0);
    c = c * (1.0 + c / 9.0) / (1.0 + c);
    c = pow(max(c, 0.0), vec3(1.0 / 2.2));
    if (uIntro < 1.0) {
      vec2 q = dv * vec2(uAspect, 1.0);
      float n = fbm(vec3(q * 2.0, uTemps * 0.08)) * 0.7 + fbm(vec3(q * 8.0, 2.0)) * 0.3;
      float m = n * 0.55 + length(q) * 0.55;
      float s = uIntro * 1.5 - 0.15;
      float k = smoothstep(s - 0.1, s + 0.04, m);
      vec3 brume = uFondC + uBrumeC * (0.12 + 0.55 * pow(fbm(vec3(q * 1.5, uTemps * 0.05 + 1.0)), 2.0)) * (1.0 - length(q) * 0.5);
      c = mix(c, brume, k);
      c += uBrumeC * exp(-pow((m - s) * 14.0, 2.0)) * 0.22 * (1.0 - uIntro);
    }
    float g = h1(vec3(uv * uRes, fract(uTemps * 7.1) * 91.0)) - 0.5;
    c += g * uGrain + (h1(vec3(uv * uRes + 17.0, 3.0)) - 0.5) / 255.0;
    gl_FragColor = vec4(c, 1.0);
  }`;

/* ── Le moteur ──────────────────────────────────────────────────────────── */
export async function demarrer({ toile, ctx, sections, reduit, palette, surChangement, surProgres }) {
  const telephone = ctx.telephone;
  const renderer = new THREE.WebGLRenderer({ canvas: toile, antialias: false, alpha: false, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 1);
  renderer.autoClear = true;
  let dpr = Math.min(window.devicePixelRatio || 1, telephone ? 1.5 : 1.6);
  ctx.dpr = () => dpr;
  const flottant = renderer.extensions.has('EXT_color_buffer_float') || renderer.extensions.has('EXT_color_buffer_half_float');
  const type = flottant ? THREE.HalfFloatType : THREE.UnsignedByteType;
  const echant = telephone ? 2 : 4;
  const RT = (s = 0) => new THREE.WebGLRenderTarget(2, 2, { type, samples: s, depthBuffer: s > 0 || true });
  const rtA = RT(echant), rtB = RT(echant), rtC = RT(0), rtR = RT(telephone ? 2 : 4);
  const halo = [RT(0), RT(0), RT(0), RT(0)];
  for (const r of [rtC, ...halo]) r.depthBuffer = false;

  /* Les couleurs : palette partagee + couleurs propres aux matieres. */
  const P = creerPalette();
  const X = { verreAbs: new THREE.Vector3(), galetAbs: new THREE.Vector3(), lait: new THREE.Vector3(), brume: new THREE.Vector3(), nom: new THREE.Vector3(), eau: new THREE.Vector3(), lum: new THREE.Vector3() };
  remplirPalette(P, X, palette.monde);
  const fondC = new THREE.Color(palette.couleurs.fond);
  const brumeC = new THREE.Vector3(...palette.monde.brume).multiplyScalar(0.3);

  const plein = new THREE.BufferGeometry();
  plein.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
  plein.setAttribute('uv', new THREE.BufferAttribute(new Float32Array([0, 0, 2, 0, 0, 2]), 2));
  const passe = (fs, uniforms) => new THREE.ShaderMaterial({ uniforms, vertexShader: VS_PLEIN, fragmentShader: fs, depthTest: false, depthWrite: false });
  const compo = passe(FS_COMPO, { tA: { value: rtA.texture }, tB: { value: rtB.texture }, uCoupe: { value: 0 }, uMode: { value: 0 }, uAspect: { value: 1 }, uTemps: { value: 0 }, uLisC: { value: X.lum } });
  const clair = passe(FS_CLAIR, { tSrc: { value: null }, uTexel: { value: new THREE.Vector2() }, uSeuil: { value: 0.9 }, uBrut: { value: 0 } });
  const flou = passe(FS_FLOU, { tSrc: { value: null }, uDir: { value: new THREE.Vector2() } });
  const final = passe(FS_FINAL, {
    tSrc: { value: null }, tHalo: { value: halo[0].texture }, tHalo2: { value: halo[2].texture }, uHaloF: { value: 1 }, uExpo: { value: 1 }, uTemps: { value: 0 },
    uGrain: { value: reduit ? 0.018 : 0.03 }, uFr: { value: reduit ? 0 : (telephone ? 0.0012 : 0.0024) }, uIntro: { value: 0 }, uAspect: { value: 1 },
    uFondC: { value: new THREE.Vector3(fondC.r, fondC.g, fondC.b) }, uBrumeC: { value: brumeC }, uRes: { value: new THREE.Vector2(1, 1) }
  });
  const sceneQ = new THREE.Scene();
  const quad = new THREE.Mesh(plein, compo); quad.frustumCulled = false;
  sceneQ.add(quad);
  const camQ = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const dessiner = (mat, cible) => { quad.material = mat; renderer.setRenderTarget(cible); renderer.render(sceneQ, camQ); };

  surProgres?.(0.2);
  const mondes = {
    cristal: mondeCristal(ctx, P, X),
    eau: mondeEau(ctx, P, X),
    galets: mondeGalets(ctx, P, X),
    brume: await mondeBrume(ctx, P, X)
  };
  surProgres?.(0.45);

  /* Le miroir : une camera sous la surface, symetrique de la vraie. */
  const vcam = new THREE.PerspectiveCamera();
  const texMat = new THREE.Matrix4();
  const biais = new THREE.Matrix4().set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1);
  const vAvant = new THREE.Vector3(), vHaut = new THREE.Vector3(), vCible = new THREE.Vector3();
  for (const m of Object.values(mondes)) if (m.eau) { m.eau.mat.uniforms.tRefl.value = rtR.texture; m.eau.mat.uniforms.uReflOK.value = 1; }

  function rendreMonde(M, cible) {
    const cam = M.camera;
    cam.updateMatrixWorld();
    if (M.eau) {
      const h = M.eau.niveau;
      vcam.position.copy(cam.position); vcam.position.y = 2 * h - cam.position.y;
      vAvant.set(0, 0, -1).applyQuaternion(cam.quaternion);
      vCible.copy(cam.position).add(vAvant); vCible.y = 2 * h - vCible.y;
      vHaut.set(0, 1, 0).applyQuaternion(cam.quaternion); vHaut.y = -vHaut.y;
      vcam.up.copy(vHaut); vcam.lookAt(vCible);
      vcam.projectionMatrix.copy(cam.projectionMatrix); vcam.projectionMatrixInverse.copy(cam.projectionMatrixInverse);
      vcam.updateMatrixWorld();
      texMat.copy(biais).multiply(vcam.projectionMatrix).multiply(vcam.matrixWorldInverse);
      M.eau.mesh.visible = false;
      M.ciel.position.copy(vcam.position);
      for (const v of M.verres) v.uniforms.uClipY.value = h;
      for (const p of M.poussieres) p.material.uniforms.uClipY.value = h;
      renderer.setRenderTarget(rtR); renderer.render(M.scene, vcam);
      M.eau.mesh.visible = true;
      for (const v of M.verres) v.uniforms.uClipY.value = -1e4;
      for (const p of M.poussieres) p.material.uniforms.uClipY.value = -1e4;
      M.eau.mat.uniforms.uReflMat.value.copy(texMat);
    }
    M.ciel.position.copy(cam.position);
    renderer.setRenderTarget(cible); renderer.render(M.scene, cam);
  }

  let W = 1, H = 1;
  function dimensionner() {
    W = toile.clientWidth || innerWidth; H = toile.clientHeight || innerHeight;
    renderer.setPixelRatio(dpr);
    renderer.setSize(W, H, false);
    const w = Math.round(W * dpr), h = Math.round(H * dpr);
    rtA.setSize(w, h); rtB.setSize(w, h); rtC.setSize(w, h);
    const kr = telephone ? 0.45 : 0.6;
    rtR.setSize(Math.round(w * kr), Math.round(h * kr));
    halo[0].setSize(Math.round(w / 4), Math.round(h / 4)); halo[1].setSize(Math.round(w / 4), Math.round(h / 4));
    halo[2].setSize(Math.round(w / 12), Math.round(h / 12)); halo[3].setSize(Math.round(w / 12), Math.round(h / 12));
    compo.uniforms.uAspect.value = W / H;
    final.uniforms.uAspect.value = W / H;
    final.uniforms.uRes.value.set(w, h);
    for (const m of Object.values(mondes)) m.dimensionner(W, H);
  }
  dimensionner();
  addEventListener('resize', dimensionner);

  /* Le halo : hautes lumieres au quart, floues ; puis un second etage plus
     large au douzieme. */
  function reduire(de, vers, brut) {
    clair.uniforms.tSrc.value = de.texture;
    clair.uniforms.uTexel.value.set(1 / de.width, 1 / de.height);
    clair.uniforms.uBrut.value = brut ? 1 : 0;
    dessiner(clair, vers);
  }
  function flouter(R, tmp) {
    flou.uniforms.tSrc.value = R.texture; flou.uniforms.uDir.value.set(1 / R.width, 0); dessiner(flou, tmp);
    flou.uniforms.tSrc.value = tmp.texture; flou.uniforms.uDir.value.set(0, 1 / R.height); dessiner(flou, R);
  }
  function halos(src) {
    reduire(src, halo[0], false);
    flouter(halo[0], halo[1]);
    reduire(halo[0], halo[2], true);
    flouter(halo[2], halo[3]);
  }

  /* Tout compiler et tout dessiner une fois, cache sous le chargeur : sinon
     chaque monde compile ses nuanceurs a son premier passage et l'image se
     fige, surtout sur telephone. */
  const e0 = { reduit, p: 0.5, etape: 0, monte: 0, cond: 0.5, variante: '', forme: 1, saisi: false };
  const liste = Object.values(mondes);
  renderer.setRenderTarget(rtA);
  /* Tous les nuanceurs partent ensemble (le pilote les compile en parallele
     quand il sait le faire), puis chaque monde est dessine une fois. */
  const t0 = performance.now();
  let faits = 0;
  if (renderer.compileAsync) {
    /* Les passes de composition (fondu entre mondes, halo, rendu final) partent aussi : compilees au
       premier dessin, elles bloquaient la page plusieurs secondes sous Windows. */
    const sceneP = new THREE.Scene();
    for (const mat of [compo, clair, flou, final]) { const q = new THREE.Mesh(plein, mat); q.frustumCulled = false; sceneP.add(q); }
    await Promise.all([...liste.map((m) => renderer.compileAsync(m.scene, m.camera)), renderer.compileAsync(sceneP, camQ)]
      .map((pr) => pr.catch(() => {}).then(() => { faits++; surProgres?.(0.45 + 0.35 * faits / (liste.length + 1)); })));
  }
  const t1 = performance.now();
  for (let i = 0; i < liste.length; i++) {
    const m = liste[i];
    m.maj(0, 0.016, e0);
    rendreMonde(m, i % 2 ? rtB : rtA);
    await new Promise((r) => setTimeout(r, 0));
  }
  window.__compil = [Math.round(t1 - t0), Math.round(performance.now() - t1)];
  surProgres?.(0.85);
  for (const mode of [0, 1, 2]) { compo.uniforms.uCoupe.value = 0.5; compo.uniforms.uMode.value = mode; dessiner(compo, rtC); }
  halos(rtC);
  final.uniforms.tSrc.value = rtC.texture;
  dessiner(final, null);
  /* Laisse au pilote le temps de finir (sinon la premiere vraie image attend). */
  await new Promise((r) => requestAnimationFrame(() => r()));
  surProgres?.(0.95);

  /* ── Les gestes : rien ne suit la souris ; la matiere repond au geste. ── */
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const planEau = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const v3 = new THREE.Vector3();
  const gestes = [];
  let saisie = null, dernierSurvol = { x: 0, z: 0, t: -9 };
  const versNdc = (ev) => ndc.set((ev.clientX / innerWidth) * 2 - 1, -(ev.clientY / innerHeight) * 2 + 1);
  const interactif = (ev) => ev.target?.closest?.('a, button, input, textarea, select, .hud, .menu, .vitre');
  addEventListener('pointermove', (ev) => {
    if (saisie && ev.pointerId === saisie.id) {
      const now = performance.now();
      const dx = (ev.clientX - saisie.x) * 0.009;
      saisie.monde.tourner(dx, (now - saisie.t) / 1000);
      saisie.x = ev.clientX; saisie.t = now; saisie.bouge += Math.abs(dx);
      return;
    }
    if (ev.pointerType === 'mouse') gestes.push({ type: 'survol', x: ev.clientX, y: ev.clientY });
  }, { passive: true });
  addEventListener('pointerdown', (ev) => {
    if (interactif(ev) || (ev.pointerType === 'mouse' && ev.button !== 0)) return;
    const v = vue;
    if (v && v.A.nom === 'cristal' && !v.B) {
      versNdc(ev); ray.setFromCamera(ndc, v.A.camera);
      if (v.A.saisir(ray.ray)) {
        saisie = { id: ev.pointerId, x: ev.clientX, t: performance.now(), monde: v.A, bouge: 0 };
        if (ev.pointerType === 'mouse') ev.preventDefault();
        return;
      }
    }
    gestes.push({ type: 'appui', x: ev.clientX, y: ev.clientY });
  });
  const relacher = (ev) => {
    if (!saisie || ev.pointerId !== saisie.id) return;
    if (saisie.bouge < 0.02) saisie.monde.frapper(); else saisie.monde.lacher();
    saisie = null;
  };
  addEventListener('pointerup', relacher);
  addEventListener('pointercancel', relacher);

  function traiterGestes(M, t) {
    if (!M.eau || !gestes.length) return;
    for (const g of gestes) {
      ndc.set((g.x / innerWidth) * 2 - 1, -(g.y / innerHeight) * 2 + 1);
      ray.setFromCamera(ndc, M.camera);
      if (g.type === 'appui' && M.toucherPierre?.(ray, t)) continue;
      planEau.constant = -M.eau.niveau;
      if (!ray.ray.intersectPlane(planEau, v3) || v3.distanceTo(M.camera.position) > 34) continue;
      if (g.type === 'appui') { M.eau.onde(v3.x, v3.z, t, 1.25); continue; }
      const d = Math.hypot(v3.x - dernierSurvol.x, v3.z - dernierSurvol.z);
      if (d > 0.55 || (t - dernierSurvol.t > 0.35 && d > 0.12)) { M.eau.onde(v3.x, v3.z, t, 0.5); dernierSurvol = { x: v3.x, z: v3.z, t }; }
    }
  }

  /* Une onde demandee par la page (un theme de l'approche qui arrive au centre). */
  function onde(el) {
    const v = vue; if (!v) return;
    const M = v.B && v.coupe > 0.5 ? v.B : v.A;
    if (!M.eau) return;
    const r = el.getBoundingClientRect();
    ndc.set(((r.left + r.width * 0.5) / innerWidth) * 2 - 1, -0.45);
    ray.setFromCamera(ndc, M.camera);
    planEau.constant = -M.eau.niveau;
    if (ray.ray.intersectPlane(planEau, v3)) M.eau.onde(v3.x, v3.z, temps, reduit ? 1.0 : 1.5);
  }

  /* Geometrie des sections (positions absolues), recalculee au besoin. */
  let geo = [];
  function mesurer() {
    const y0 = scrollY;
    geo = sections.map((s) => { const r = s.el.getBoundingClientRect(); return { ...s, haut: r.top + y0, bas: r.bottom + y0 }; });
  }
  mesurer();
  addEventListener('resize', mesurer);
  new ResizeObserver(mesurer).observe(document.body);

  let vue = null, temps = 0;
  let yL = scrollY, dernier = performance.now(), actuel = '';
  const frames = []; let abaisse = 0;
  const etapesEl = [...document.querySelectorAll('.pas')];
  const tarifsEl = document.getElementById('tarifs');
  const sceneNom = document.querySelector('.scene-nom');
  let intro = 0, introLancee = false;
  const dureeIntro = reduit ? 1.1 : 2.0;

  function etat(nomMonde) {
    const vh = innerHeight;
    const centre = yL + vh * 0.5;
    const e = { reduit, forme: sstep(0.05, 0.9, intro), saisi: !!saisie };
    const des = geo.filter((s) => s.monde === nomMonde);
    if (!des.length) return { ...e, p: 0 };
    const haut = des[0].haut, bas = des[des.length - 1].bas;
    e.p = sat((centre - haut) / Math.max(1, bas - haut));
    let proche = des[0], bd = Infinity;
    for (const s of des) { const dd = centre < s.haut ? s.haut - centre : centre > s.bas ? centre - s.bas : 0; if (dd < bd) { bd = dd; proche = s; } }
    e.variante = proche.variante;
    if (nomMonde === 'cristal') e.p = e.variante === 'aube' ? sat((centre - (des[1]?.haut ?? haut)) / vh) * 0.3 : sat((centre - haut) / Math.max(1, des[0].bas - haut));
    if (nomMonde === 'galets') {
      const cs = etapesEl.map((el) => { const r = el.getBoundingClientRect(); return r.top + r.height * 0.5 + scrollY - yL; });
      let c = -0.6;
      if (cs.length) {
        const m = vh * (telephone ? 0.62 : 0.5);
        if (m <= cs[0]) c = -sat((cs[0] - m) / vh) * 0.6;
        else if (m >= cs[cs.length - 1]) c = cs.length - 1;
        else for (let i = 0; i < cs.length - 1; i++) if (m >= cs[i] && m < cs[i + 1]) c = i + (m - cs[i]) / (cs[i + 1] - cs[i]);
      }
      e.etape = c;
      const rt = tarifsEl.getBoundingClientRect();
      e.monte = sstep(0, 1, (vh * 0.95 - (rt.top + scrollY - yL)) / (rt.height * 0.6 + vh * 0.2));
    }
    if (nomMonde === 'brume') {
      const r = sceneNom.getBoundingClientRect();
      const d = (r.top + r.height * 0.5 + scrollY - yL - vh * 0.5) / vh;
      e.cond = 1 - sstep(0.12, 0.55, Math.abs(d));
    }
    return e;
  }

  function boucle(now) {
    const dt = Math.min(0.05, (now - dernier) / 1000);
    dernier = now;
    /* Sous mouvement reduit, le temps coule plus lentement : rien ne s'arrete. */
    temps += dt * (reduit ? 0.6 : 1);
    const t = temps;
    if (introLancee && intro < 1) intro = Math.min(1, intro + dt / dureeIntro);
    yL = lisser(yL, scrollY, dt, reduit ? 6 : 7);

    const vh = innerHeight, centre = yL + vh * 0.5;
    let a = geo[0], b = null, coupe = 0;
    for (let i = 0; i < geo.length; i++) if (centre >= geo[i].haut - vh * 0.3) a = geo[i];
    for (let i = 1; i < geo.length; i++) {
      if (geo[i].monde === geo[i - 1].monde) continue;
      /* Tour 4 : le passage dure un ecran entier de defilement (il en durait un demi). */
      const pr = (centre - (geo[i].haut - vh * 0.45)) / (vh * 1.0);
      if (pr > 0 && pr < 1) { a = geo[i - 1]; b = geo[i]; coupe = pr; break; }
    }
    const A = mondes[a.monde], B = b ? mondes[b.monde] : null;
    vue = { A, B, a, b, coupe, centre };
    const principal = B && coupe > 0.5 ? B.nom : A.nom;
    if (principal !== actuel) { actuel = principal; surChangement?.(principal); }

    traiterGestes(A, t);
    if (B) traiterGestes(B, t);
    gestes.length = 0;
    A.maj(t, dt, etat(A.nom));
    rendreMonde(A, rtA);
    let src = rtA;
    if (B) {
      B.maj(t, dt, etat(B.nom));
      rendreMonde(B, rtB);
      compo.uniforms.uCoupe.value = coupe;
      compo.uniforms.uMode.value = reduit ? 2 : (A.nom === 'brume' || B.nom === 'brume' ? 1 : 0);
      compo.uniforms.uTemps.value = t;
      dessiner(compo, rtC);
      src = rtC;
    }
    halos(src);
    final.uniforms.tSrc.value = src.texture;
    final.uniforms.uTemps.value = reduit ? 3.7 : t;
    final.uniforms.uIntro.value = sstep(0, 1, intro);
    dessiner(final, null);

    /* Un appareil qui peine (moins de 45 images par seconde en mediane) :
       on baisse la definition, par paliers, jamais sous 0,75. */
    frames.push(dt);
    if (frames.length >= 90) {
      const med = frames.sort((x, y) => x - y)[Math.floor(frames.length / 2)];
      frames.length = 0;
      if (med > 1 / 45 && dpr > 0.75 && abaisse < 4 && !window.__bride) { dpr = Math.max(0.75, dpr - 0.25); abaisse++; dimensionner(); }
    }
    requestAnimationFrame(boucle);
  }
  requestAnimationFrame((n) => { dernier = n; boucle(n); surProgres?.(1); });

  /* Une image de ciel deposee dans images/ (voir IMAGES-A-GENERER.md) remplace le
     degrade calcule ; sinon, rien ne change. */
  if (ctx.cielImage) {
    new THREE.TextureLoader().load(ctx.cielImage, (tx) => {
      tx.colorSpace = THREE.SRGBColorSpace; tx.generateMipmaps = false; tx.minFilter = THREE.LinearFilter; tx.wrapS = THREE.RepeatWrapping;
      P.tCiel.value = tx; P.uCielImg.value = 1;
    }, undefined, () => {});
  }

  toile.addEventListener('webglcontextlost', (ev) => { ev.preventDefault(); document.documentElement.classList.add('sans-3d'); });
  return {
    mesurer, onde,
    lancerIntro: () => { introLancee = true; },
    vue: () => vue && { a: vue.a.el.id || 'pied', b: vue.b ? vue.b.el.id : '', coupe: Math.round(vue.coupe * 100) / 100, centre: Math.round(vue.centre) },
    diagnostic: () => ({ dpr, abaisse, W, H, flottant, intro, webgl2: renderer.capabilities.isWebGL2, programmes: renderer.info.programs?.length })
  };
}
