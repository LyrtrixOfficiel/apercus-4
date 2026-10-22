// Le site infini : la boîte à outils des mondes (three.js 0.170.0).
// Ciel, halos, particules, rayons de lumière, ruban irisé, textures dessinées, matières procédurales,
// environnement pour les reflets, et les PORTES (rectangle ou rond) qui montrent le niveau suivant.
// Tous les nuanceurs écrits à la main commencent par « precision highp float; » (puces Adreno : même précision partout).
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/+esm';
export { THREE };

/** Uniformes partagés par tous les mondes : temps, et pixels par unité à 1 m (pour la taille des particules). */
export const U = { temps: { value: 0 }, px: { value: 800 }, lent: { value: 1 } };

export const BRUIT = /* glsl */`
float h11(float n){ return fract(sin(n*127.1)*43758.5453123); }
float h21(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
float bruit(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f*f*(3.0-2.0*f);
  return mix(mix(h21(i), h21(i+vec2(1,0)), u.x), mix(h21(i+vec2(0,1)), h21(i+vec2(1,1)), u.x), u.y); }
float fbm(vec2 p){ float s = 0.0, a = 0.5; for (int k = 0; k < 5; k++){ s += a*bruit(p); p = p*2.03 + 7.1; a *= 0.5; } return s; }
`;

const C = (c) => (c instanceof THREE.Color ? c : new THREE.Color(c));

// ---------------------------------------------------------------------------------------------------------------
/** Ciel : sphère à dégradé (bas, horizon, haut), soleil et halo, étoiles, nuages en bandes. */
export function ciel(o = {}) {
  const m = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: {
      uBas: { value: C(o.bas ?? '#202030') }, uHorizon: { value: C(o.horizon ?? '#d08070') }, uHaut: { value: C(o.haut ?? '#102040') },
      uSol: { value: new THREE.Vector3(...(o.soleil ?? [0.6, 0.05, -1])).normalize() }, uSolC: { value: C(o.soleilCouleur ?? '#ffc890') },
      uSolT: { value: o.soleilTaille ?? 0.02 }, uHalo: { value: o.halo ?? 1 }, uEtoiles: { value: o.etoiles ?? 0 },
      uNuages: { value: o.nuages ?? 0 }, uNuageC: { value: C(o.nuageCouleur ?? '#ffb090') }, uExpo: { value: o.expo ?? 1 }, uT: U.temps,
    },
    vertexShader: `precision highp float; varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = projectionMatrix*modelViewMatrix*vec4(position,1.0); gl_Position = p.xyww; }`,
    fragmentShader: `precision highp float; varying vec3 vDir;
      uniform vec3 uBas, uHorizon, uHaut, uSol, uSolC, uNuageC; uniform float uSolT, uHalo, uEtoiles, uNuages, uExpo, uT;
      ${BRUIT}
      void main(){
        vec3 d = normalize(vDir); float y = d.y;
        vec3 c = y > 0.0 ? mix(uHorizon, uHaut, pow(clamp(y*1.6, 0.0, 1.0), 0.55)) : mix(uHorizon, uBas, pow(clamp(-y*3.0, 0.0, 1.0), 0.6));
        float s = max(dot(d, uSol), 0.0);
        c += uSolC * (pow(s, 6.0)*0.35 + pow(s, 60.0)*0.6) * uHalo;
        c += uSolC * smoothstep(1.0 - uSolT, 1.0 - uSolT*0.6, s) * 6.0;
        if (uNuages > 0.0 && y > -0.05) {
          vec2 q = d.xz / (y + 0.18) * 1.2; float n = fbm(q*vec2(0.6, 1.6) + vec2(uT*0.006, 0.0));
          float k = smoothstep(0.45, 0.85, n) * smoothstep(0.75, 0.05, y) * uNuages;
          vec3 nc = mix(uNuageC, uSolC*1.4, pow(s, 3.0));
          c = mix(c, nc, k*0.75);
        }
        if (uEtoiles > 0.0 && y > 0.0) {
          vec2 g = d.xz/(y+0.6)*90.0; vec2 i = floor(g); float h = h21(i);
          float e = step(0.985, h) * smoothstep(0.5, 0.0, length(fract(g) - 0.5)) * (0.5 + 0.5*sin(uT*2.0 + h*80.0));
          c += vec3(e) * uEtoiles * smoothstep(0.0, 0.4, y);
        }
        gl_FragColor = vec4(c*uExpo, 1.0);
      }`,
  });
  const s = new THREE.Mesh(new THREE.SphereGeometry(400, 48, 24), m);
  s.renderOrder = -10; s.frustumCulled = false;
  return s;
}

// ---------------------------------------------------------------------------------------------------------------
let texRonde = null;
/** Texture d'un disque doux (dégradé radial). */
export function rondDoux() {
  if (texRonde) return texRonde;
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.18, 'rgba(255,255,255,0.55)'); g.addColorStop(0.45, 'rgba(255,255,255,0.14)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  texRonde = new THREE.CanvasTexture(c); texRonde.colorSpace = THREE.SRGBColorSpace;
  return texRonde;
}
/** Halo lumineux, toujours face à la caméra (additif). */
export function halo(couleur, taille, intensite = 1) {
  const m = new THREE.SpriteMaterial({ map: rondDoux(), color: C(couleur).clone().multiplyScalar(intensite), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false });
  const s = new THREE.Sprite(m); s.scale.setScalar(taille);
  return s;
}

// ---------------------------------------------------------------------------------------------------------------
/** Particules : poussière, farine, pluie, pétales, étincelles, bokeh. Animées dans le nuanceur, en boucle dans une boîte. */
export function particules(o) {
  const n = o.n ?? 300, min = new THREE.Vector3(...o.min), max = new THREE.Vector3(...o.max);
  const g = new THREE.BufferGeometry(), p = new Float32Array(n * 3), a = new Float32Array(n * 4);
  for (let k = 0; k < n; k++) {
    p.set([Math.random(), Math.random(), Math.random()], k * 3);
    a.set([Math.random(), Math.random(), 0.5 + Math.random() * 0.5, Math.random()], k * 4);
  }
  g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  g.setAttribute('aAlea', new THREE.BufferAttribute(a, 4));
  const formes = { rond: 0, strie: 1, petale: 2, bokeh: 3 };
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: o.normal ? THREE.NormalBlending : THREE.AdditiveBlending, fog: false,
    uniforms: {
      uMin: { value: min }, uTaille3: { value: max.clone().sub(min) }, uVit: { value: new THREE.Vector3(...(o.vitesse ?? [0, 0.05, 0])) },
      uTremble: { value: o.tremble ?? 0.05 }, uTaille: { value: o.taille ?? 0.02 }, uC: { value: C(o.couleur ?? '#ffffff') }, uC2: { value: C(o.couleur2 ?? o.couleur ?? '#ffffff') },
      uOp: { value: o.opacite ?? 1 }, uForme: { value: formes[o.forme ?? 'rond'] }, uScint: { value: o.scintille ?? 0 },
      uT: U.temps, uPx: U.px, uLent: U.lent,
    },
    vertexShader: `precision highp float;
      attribute vec4 aAlea; uniform vec3 uMin, uTaille3, uVit; uniform float uTremble, uTaille, uT, uPx, uLent, uForme;
      varying vec4 vA; varying float vF; varying float vAng;
      void main(){
        float t = uT * uLent;
        vec3 q = position * uTaille3 + uVit * t * (0.6 + 0.8*aAlea.z);
        q += vec3(sin(t*0.7 + aAlea.x*40.0), sin(t*0.5 + aAlea.y*30.0), cos(t*0.6 + aAlea.w*20.0)) * uTremble;
        vec3 qn = mod(q, uTaille3) / uTaille3;
        q = uMin + qn * uTaille3;
        vec4 mv = modelViewMatrix * vec4(q, 1.0);
        gl_Position = projectionMatrix * mv;
        float d = -mv.z;
        float s = uTaille * (0.5 + aAlea.z) * uPx / max(d, 0.001);
        // très près de la caméra : on efface (pas de grosse tache)
        vF = smoothstep(0.03, 0.25, d) * smoothstep(0.0, 0.08, qn.y) * smoothstep(1.0, 0.92, qn.y) * smoothstep(0.0, 0.05, qn.x) * smoothstep(1.0, 0.95, qn.x) * smoothstep(0.0, 0.05, qn.z) * smoothstep(1.0, 0.95, qn.z);
        gl_PointSize = clamp(s, 0.0, 160.0);
        if (s < 0.6) vF *= s / 0.6;
        vA = aAlea; vAng = aAlea.w*6.283 + t*(aAlea.x - 0.5)*2.0;
      }`,
    fragmentShader: `precision highp float;
      uniform vec3 uC, uC2; uniform float uOp, uForme, uScint, uT; varying vec4 vA; varying float vF; varying float vAng;
      void main(){
        vec2 q = gl_PointCoord - 0.5; float a;
        if (uForme < 0.5) { a = smoothstep(0.5, 0.0, length(q)); a *= a; }
        else if (uForme < 1.5) { a = smoothstep(0.08, 0.0, abs(q.x)) * smoothstep(0.5, 0.2, abs(q.y)); }
        else if (uForme < 2.5) { float c = cos(vAng), s = sin(vAng); vec2 r = vec2(c*q.x - s*q.y, s*q.x + c*q.y); a = smoothstep(0.5, 0.42, length(r*vec2(1.0, 2.2))); }
        else { float l = length(q); a = smoothstep(0.5, 0.44, l) * (0.55 + 0.45*smoothstep(0.3, 0.48, l)); }
        float sc = 1.0 + uScint * sin(uT*3.0 + vA.x*60.0);
        vec3 c = mix(uC, uC2, vA.y);
        gl_FragColor = vec4(c, a * uOp * vF * sc);
        if (gl_FragColor.a < 0.003) discard;
      }`,
  });
  const pts = new THREE.Points(g, m); pts.frustumCulled = false; pts.renderOrder = 5;
  return pts;
}

// ---------------------------------------------------------------------------------------------------------------
/** Rayon de lumière : cône ouvert additif, doux sur les bords, qui s'éteint au bout. */
export function rayon(o) {
  const lg = o.longueur ?? 4, r0 = o.r0 ?? 0.2, r1 = o.r1 ?? 1.2;
  const geo = new THREE.CylinderGeometry(r0, r1, lg, 32, 1, true); geo.translate(0, -lg / 2, 0);
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
    uniforms: { uC: { value: C(o.couleur ?? '#ffd9a0') }, uOp: { value: o.opacite ?? 0.25 }, uL: { value: lg }, uT: U.temps },
    vertexShader: `precision highp float; varying vec3 vN; varying vec3 vV; varying float vY; varying vec2 vUv;
      void main(){ vec4 w = modelMatrix*vec4(position,1.0); vN = normalize(mat3(modelMatrix)*normal); vV = normalize(cameraPosition - w.xyz); vY = position.y; vUv = uv; gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: `precision highp float; uniform vec3 uC; uniform float uOp, uL, uT; varying vec3 vN; varying vec3 vV; varying float vY; varying vec2 vUv;
      ${BRUIT}
      void main(){ float f = abs(dot(normalize(vN), normalize(vV))); float k = pow(f, 2.2);
        float bout = smoothstep(-uL, -uL*0.55, vY) * smoothstep(0.0, -uL*0.08, vY);
        float st = 0.65 + 0.35*bruit(vec2(vUv.x*14.0, vY*0.6 - uT*0.15));
        gl_FragColor = vec4(uC, uOp * k * bout * st); }`,
  });
  return new THREE.Mesh(geo, m);
}

// ---------------------------------------------------------------------------------------------------------------
/** Ruban irisé (la vague multicolore de Kazura) : une bande qui ondule, couleurs qui glissent le long. */
export function ruban(o = {}) {
  const L = o.longueur ?? 14, Lg = o.largeur ?? 1.4;
  const geo = new THREE.PlaneGeometry(L, Lg, 220, 12);
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
    uniforms: { uT: U.temps, uLent: U.lent, uOp: { value: o.opacite ?? 0.6 }, uAmp: { value: o.amplitude ?? 0.8 }, uDec: { value: o.decalage ?? 0 } },
    vertexShader: `precision highp float; uniform float uT, uLent, uAmp, uDec; varying vec2 vUv; varying float vPli;
      void main(){ vUv = uv; vec3 p = position; float t = uT*uLent*0.25 + uDec;
        float w = sin(p.x*0.45 + t) * uAmp + sin(p.x*0.9 - t*1.3)*uAmp*0.35;
        float tw = sin(p.x*0.3 + t*0.7)*1.2;
        p.z += w + p.y*sin(tw)*0.9; p.y = p.y*cos(tw) + w*0.4;
        vPli = cos(tw);
        gl_Position = projectionMatrix*modelViewMatrix*vec4(p,1.0); }`,
    fragmentShader: `precision highp float; uniform float uT, uLent, uOp, uDec; varying vec2 vUv; varying float vPli;
      vec3 teinte(float h){ return 0.5 + 0.5*cos(6.2831*(h + vec3(0.0, 0.33, 0.67))); }
      void main(){ float h = vUv.x*1.4 - uT*uLent*0.03 + uDec; vec3 c = teinte(h);
        c = mix(c, vec3(0.75, 0.62, 1.0), 0.25);
        float bord = smoothstep(0.0, 0.25, vUv.y) * smoothstep(1.0, 0.75, vUv.y);
        float fil = 0.55 + 0.45*pow(abs(sin(vUv.y*3.1416*7.0 + vUv.x*6.0)), 6.0);
        float bout = smoothstep(0.0, 0.12, vUv.x)*smoothstep(1.0, 0.88, vUv.x);
        gl_FragColor = vec4(c*(0.6 + 0.6*abs(vPli)), uOp*bord*bout*fil); }`,
  });
  const r = new THREE.Mesh(geo, m); r.frustumCulled = false;
  return r;
}

// ---------------------------------------------------------------------------------------------------------------
/** Texture dessinée en canvas 2D (enseignes, étiquettes, motifs). */
export function toile(w, h, dessin, o = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
  dessin(x, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = o.aniso ?? 8;
  if (o.repete) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...o.repete); }
  return t;
}

/** Matière procédurale : la couleur de base vient d'une fonction GLSL vec3 albedo(vec3 p, vec3 base) (p : position locale). */
export function proc(mat, glsl, cle) {
  mat.onBeforeCompile = (s) => {
    s.vertexShader = s.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vPosL;\nvarying vec3 vPosW;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvPosL = position;\nvPosW = (modelMatrix * vec4(position, 1.0)).xyz;');
    s.fragmentShader = s.fragmentShader.replace('#include <common>', `#include <common>\nvarying vec3 vPosL;\nvarying vec3 vPosW;\nuniform float uTproc;\n${BRUIT}\n${glsl}`)
      .replace('vec4 diffuseColor = vec4( diffuse, opacity );', 'vec4 diffuseColor = vec4( albedo(vPosL, diffuse), opacity );');
    s.uniforms.uTproc = U.temps;
  };
  mat.customProgramCacheKey = () => 'proc-' + cle;
  return mat;
}

/** Environnement pour les reflets : un dégradé et quelques panneaux lumineux, passé au PMREM. */
export function environnement(renderer, o = {}) {
  const sc = new THREE.Scene();
  const sph = ciel({ bas: o.bas ?? '#1a1410', horizon: o.horizon ?? '#806050', haut: o.haut ?? '#30405a', soleil: o.soleil ?? [0.5, 0.3, -1], soleilCouleur: o.soleilCouleur ?? '#ffd0a0', soleilTaille: 0.06, halo: 2 });
  sph.scale.setScalar(0.05); sc.add(sph);
  for (const [pos, coul, taille] of o.panneaux ?? []) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(taille[0], taille[1]), new THREE.MeshBasicMaterial({ color: C(coul), side: THREE.DoubleSide }));
    p.position.set(...pos); p.lookAt(0, 0, 0); sc.add(p);
  }
  const pm = new THREE.PMREMGenerator(renderer);
  const rt = pm.fromScene(sc, 0.02, 0.1, 30);
  pm.dispose();
  sph.geometry.dispose(); sph.material.dispose();
  return rt.texture;
}

// ---------------------------------------------------------------------------------------------------------------
// LES PORTES
// Une porte affiche la texture du niveau suivant. Rectangle : uv 0..1 sur le rectangle de l'écran.
// Rond : disque (rayon R) qui contient le rectangle de l'écran ; au loin, l'image est ramassée dans le disque
// (projection disque vers carré), puis elle se déplie jusqu'à l'identité quand on y entre.
const PORTE_FRAG = /* glsl */`precision highp float;
  uniform sampler2D tEcran; uniform vec2 uEch; uniform float uMode, uLum, uRond, uA, uW, uBord, uVoile;
  uniform vec3 uFond, uTeinte, uVoileC;
  varying vec2 vUv;
  vec2 disqueCarre(vec2 q){
    float u = q.x, v = q.y, u2 = u*u, v2 = v*v, t = 2.8284271;
    float sx = 0.5*sqrt(max(0.0, 2.0 + t*u + u2 - v2)) - 0.5*sqrt(max(0.0, 2.0 - t*u + u2 - v2));
    float sy = 0.5*sqrt(max(0.0, 2.0 + t*v - u2 + v2)) - 0.5*sqrt(max(0.0, 2.0 - t*v - u2 + v2));
    return vec2(sx, sy);
  }
  void main(){
    vec2 uv = vUv;
    if (uRond > 0.5) {
      vec2 q = vUv*2.0 - 1.0;
      float hh = 1.0/sqrt(1.0 + uA*uA);
      vec2 id = vec2(q.x/(uA*hh), q.y/hh);
      vec2 sq = disqueCarre(q*0.999);
      uv = mix(sq, id, uW)*0.5 + 0.5;
    }
    vec2 uc = clamp(uv, vec2(0.0), vec2(1.0));
    float hors = smoothstep(0.0, 0.004, length(uv - uc));
    vec4 tx = texture2D(tEcran, uc*uEch);
    vec3 c = uMode > 0.5 ? mix(uFond, tx.rgb, tx.a) : tx.rgb;
    c = mix(c, uFond, hors);
    c *= uTeinte * uLum;
    c = mix(c, uVoileC, uVoile);
    gl_FragColor = vec4(c, 1.0);
  }`;
const PORTE_VERT = `precision highp float; varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`;

export function materiauPorte(o = {}) {
  return new THREE.ShaderMaterial({
    fog: false,
    uniforms: {
      tEcran: { value: null }, uEch: { value: new THREE.Vector2(1, 1) }, uMode: { value: 0 }, uLum: { value: 1 }, uRond: { value: o.rond ? 1 : 0 },
      uA: { value: o.a ?? 1 }, uW: { value: 0 }, uBord: { value: 0 }, uFond: { value: C(o.fond ?? '#000') }, uTeinte: { value: new THREE.Color(1, 1, 1) },
      uVoile: { value: 0 }, uVoileC: { value: C(o.voile ?? '#000') },
    },
    vertexShader: PORTE_VERT, fragmentShader: PORTE_FRAG,
  });
}

/**
 * Une porte rectangulaire de demi-hauteur hh et de proportion a (celle de l'écran), centrée sur l'origine locale, face à +z.
 * Renvoie { mesh, porte } ; porte : description pour le moteur (en coordonnées locales du mesh).
 */
export function porteRect(hh, a, o = {}) {
  const mat = materiauPorte({ a, fond: o.fond });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2 * hh * a, 2 * hh), mat);
  return { mesh, porte: { mesh, mat, hh, a, rond: false } };
}
/** Une porte ronde de rayon R ; le rectangle de l'écran y est inscrit. */
export function porteRonde(R, a, o = {}) {
  const mat = materiauPorte({ a, fond: o.fond, rond: true });
  const geo = o.geometrie ?? new THREE.CircleGeometry(R, 96);
  const mesh = new THREE.Mesh(geo, mat);
  return { mesh, porte: { mesh, mat, hh: R / Math.sqrt(1 + a * a), a, rond: true, R } };
}

/** Reflet sur une vitre (ciel et traits de lumière), additif, qui s'efface quand on entre. */
export function reflet(w, h, o = {}) {
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
    uniforms: { uC: { value: C(o.couleur ?? '#9fb4d8') }, uC2: { value: C(o.couleur2 ?? '#ffd9b0') }, uOp: { value: o.opacite ?? 0.35 }, uT: U.temps },
    vertexShader: PORTE_VERT,
    fragmentShader: `precision highp float; uniform vec3 uC, uC2; uniform float uOp, uT; varying vec2 vUv;
      void main(){ float d = vUv.x*0.8 + vUv.y;
        float b1 = smoothstep(0.08, 0.0, abs(fract(d*0.9 + 0.15) - 0.5) - 0.02);
        float b2 = smoothstep(0.03, 0.0, abs(fract(d*0.9 + 0.32) - 0.5) - 0.005);
        vec3 c = mix(uC2, uC, vUv.y) * (0.25 + 0.75*vUv.y);
        c += vec3(1.0)*(b1*0.35 + b2*0.6);
        gl_FragColor = vec4(c*uOp, 1.0); }`,
  });
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
}

/** Ombre de contact douce (décalcomanie au sol). */
export function ombre(w, h, op = 0.5) {
  const m = new THREE.MeshBasicMaterial({ map: rondDoux(), color: 0x000000, transparent: true, opacity: op, depthWrite: false });
  const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); p.rotation.x = -Math.PI / 2;
  return p;
}

/** Libère géométries, matières et textures d'un objet. */
export function liberer(obj) {
  obj.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    const ms = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
    for (const m of ms) { for (const v of Object.values(m)) if (v && v.isTexture && v !== texRonde) v.dispose(); if (m.uniforms) for (const u of Object.values(m.uniforms)) if (u.value && u.value.isTexture && u.value !== texRonde && !u.value.isRenderTargetTexture) u.value.dispose(); m.dispose(); }
  });
}

/** Petit outil : boîte arrondie (extrusion d'un rectangle arrondi), centrée, épaisseur selon z. */
export function boiteRonde(w, h, d, r, seg = 4) {
  const s = new THREE.Shape(); const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  const g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: true, bevelThickness: Math.min(r, d) * 0.4, bevelSize: Math.min(r, d) * 0.4, bevelSegments: seg, curveSegments: seg * 2 });
  g.translate(0, 0, -d / 2);
  return g;
}

/** Un pétale courbe : creusé en largeur, recourbé vers l'extérieur au bout, dégradé de la base au bout (couleurs de sommet). */
export function petale(L, W, creux = 0.35, retour = 0.3, cBase = '#7a1028', cBout = '#ff7f9c', seg = 9) {
  const g = new THREE.PlaneGeometry(1, 1, seg, seg + 2); const p = g.attributes.position;
  const col = new Float32Array(p.count * 3), a = new THREE.Color(cBase), b = new THREE.Color(cBout), c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const u = p.getX(i), v = p.getY(i) + 0.5;
    const w = W * (0.28 + 0.72 * Math.sin(Math.PI * (0.12 + 0.78 * v)));
    const x = u * w, y = v * L;
    const z = creux * L * Math.pow(2 * u, 2) * 0.5 * (0.4 + v) - retour * L * Math.pow(v, 2.6) - 0.08 * L * Math.sin(v * Math.PI);
    p.setXYZ(i, x, y, z);
    c.copy(a).lerp(b, Math.pow(v, 0.8)).lerp(b, Math.abs(u) * 0.5); col.set([c.r, c.g, c.b], i * 3);
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.computeVertexNormals();
  return g;
}
/** Fusionne des géométries (positions, normales, uv, couleurs) en une seule. */
export function fusion(liste) {
  const nis = liste.map((g) => (g.index ? g.toNonIndexed() : g));
  const n = nis.reduce((s, g) => s + g.attributes.position.count, 0);
  const out = new THREE.BufferGeometry();
  for (const [nom, k] of [['position', 3], ['normal', 3], ['uv', 2], ['color', 3]]) {
    if (!nis.every((g) => g.attributes[nom])) continue;
    const arr = new Float32Array(n * k); let o = 0;
    for (const g of nis) { arr.set(g.attributes[nom].array, o); o += g.attributes[nom].array.length; }
    out.setAttribute(nom, new THREE.BufferAttribute(arr, k));
  }
  return out;
}
/** Une fleur en couches de pétales (rose, pivoine, renoncule) ; centrée, tige vers -y. */
export function fleur(o = {}) {
  const couches = o.couches ?? [[3, 0.5, 0.15], [5, 0.65, 0.4], [6, 0.8, 0.72], [8, 0.95, 1.0], [9, 1.0, 1.25]];
  const geos = []; let ang = 0;
  for (const [nb, l, ouv] of couches) {
    for (let i = 0; i < nb; i++) {
      const g = petale(l * (o.L ?? 1), l * (o.W ?? 0.9), o.creux ?? 0.45, (o.retour ?? 0.35) * ouv, o.base ?? '#6e0f26', o.bout ?? '#ff86a2');
      g.rotateX(-ouv * (o.ouverture ?? 0.62)); g.translate(0, 0, -0.06 * l * (o.L ?? 1) * (1.2 - ouv * 0.3));
      g.rotateY((ang += 2.39996));
      geos.push(g);
    }
  }
  return fusion(geos);
}
