/* Kazura v14, la Scène : le décor du héros (plus de matière autour du sceau, sans le noyer).
   - des COUCHES de feuilles de kudzu, à plusieurs profondeurs : un lointain flou derrière le sceau,
     un plan net à mi-distance, et des PREMIERS PLANS très flous tout près de l'objectif, aux bords.
     Elles sont posées en fractions du champ de la caméra (donc elles remplissent aussi bien un écran
     ultra-large qu'un téléphone : sur les côtés en paysage, en haut et en bas en portrait) et la
     caméra qui bouge un peu avec la souris leur donne une vraie parallaxe ;
   - des POUSSIÈRES lumineuses dans tout le volume : petites et nettes près du sceau, grands disques
     doux (bokeh) près de l'objectif ; elles s'allument quand elles passent dans les rayons.
   Feuilles et poussières sont dessinées par leurs nuanceurs (aucune texture), en un appel chacune. */
import { hasard } from './commun.js';
import { GLSL_KUDZU, GLSL_MASQUE, GLSL_TEXBRUIT } from './glsl.js';

export function creerDecor(THREE, { mobile, U }) {
  const alea = hasard(1409);
  const groupe = new THREE.Group();

  /* ------------------------------------------------------------ les feuilles */
  const def = [];
  // [profondeur z (monde), nombre ordi, nombre téléphone, bande min, bande max, taille, flou]
  const couches = [
    [-6.5, 34, 14, 0.38, 1.12, 1.15, 0.05],   // lointain, derrière le sceau, un peu flou
    [-3.2, 26, 12, 0.5, 1.1, 0.85, 0.012],    // mi-distance, net
    [1.8, 12, 6, 0.72, 1.15, 0.7, 0.03],      // devant le sceau, aux bords
    [5.6, 4, 2, 0.88, 1.25, 0.7, 0.14],      // premiers plans, tout près de l'objectif, très flous
  ];
  for (const [z, nO, nT, b0, b1, t, flou] of couches) {
    const n = mobile ? nT : nO;
    for (let i = 0; i < n; i++) {
      const cote = i % 2 ? 1 : -1;
      let a = (alea() * 2 - 1) * 1.05;                        // le long de la bande
      // à gauche (là où la page pose son titre), les plans proches ne descendent pas sous le milieu
      if (cote < 0 && z > -5) a = 0.1 + Math.abs(a) * 0.9;
      const b = cote * (b0 + Math.pow(alea(), 0.8) * (b1 - b0)); // en travers (le côté)
      def.push({
        a, b, z: z + (alea() - 0.5) * 1.2, taille: t * (0.7 + alea() * 0.6),
        rot: (cote > 0 ? -0.6 : 0.6) + (alea() - 0.5) * 2.2, incl: (alea() - 0.5) * 1.1, phase: alea(), flou: flou * (0.8 + alea() * 0.4),
      });
    }
  }
  def.sort((x, y) => x.z - y.z);  // du plus loin au plus près (transparence)
  const N = def.length;
  const aF = new Float32Array(N * 4), aG = new Float32Array(N * 4);
  def.forEach((d, i) => { aF.set([d.a, d.b, d.z, d.taille], i * 4); aG.set([d.rot, d.incl, d.phase, d.flou], i * 4); });
  const geo = new THREE.InstancedBufferGeometry();
  const pl = new THREE.PlaneGeometry(1, 1);
  geo.index = pl.index; geo.attributes.position = pl.attributes.position; geo.attributes.uv = pl.attributes.uv;
  geo.setAttribute('aF', new THREE.InstancedBufferAttribute(aF, 4));
  geo.setAttribute('aG', new THREE.InstancedBufferAttribute(aG, 4));
  geo.instanceCount = N;
  const u = {
    ...U,
    uRepere: { value: new THREE.Vector3(0, 0, 8) },   // position de repos de la caméra
    uDemi: { value: new THREE.Vector2(0.5, 0.33) },   // demi-champ : tan * aspect, tan
    uPortrait: { value: 0 }, uTemps: { value: 0 }, uVent: { value: 0.4 },
    uInt: { value: 0 }, uLueur: { value: new THREE.Color(0x8b5cf6) }, uJade: { value: new THREE.Color(0x10b981) },
    uOuvre: { value: 1 },   // 0 : les feuilles sont rangées hors champ (elles entrent en glissant)
  };
  const mat = new THREE.ShaderMaterial({
    uniforms: u, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false,
    vertexShader: /* glsl */ `
      attribute vec4 aF; attribute vec4 aG;
      uniform vec3 uRepere; uniform vec2 uDemi; uniform float uPortrait; uniform float uTemps; uniform float uVent; uniform float uOuvre;
      varying vec2 vUv; varying float vDd; varying vec4 vG;
      void main() {
        vec2 n = uPortrait > 0.5 ? vec2(aF.x * 0.9, aF.y * (1.0 + 0.25 * step(0.0, aF.y))) : vec2(aF.y, aF.x);
        n *= mix(1.6, 1.0, uOuvre);
        float dd = max(uRepere.z - aF.z, 0.6);
        vec3 c = vec3(n.x * uDemi.x * dd, n.y * uDemi.y * dd + uRepere.y, aF.z);
        float ph = aG.z * 6.2831;
        float ang = aG.x + sin(uTemps * (0.35 + aG.z * 0.3) + ph) * 0.07 * (0.6 + uVent);
        vec2 p = (position.xy + vec2(0.0, 0.3)) * aF.w;
        float incl = aG.y + sin(uTemps * 0.5 + ph * 1.3) * 0.08 * (0.6 + uVent);
        vec3 lp = vec3(p.x, p.y * cos(incl), p.y * sin(incl));
        float ca = cos(ang), sa = sin(ang);
        lp.xy = vec2(ca * lp.x - sa * lp.y, sa * lp.x + ca * lp.y);
        vec4 mv = viewMatrix * vec4(c + lp, 1.0);
        vUv = uv; vDd = -mv.z; vG = aG;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      ${GLSL_MASQUE}
      ${GLSL_KUDZU}
      uniform float uInt; uniform vec3 uLueur; uniform vec3 uJade; uniform float uTemps;
      varying vec2 vUv; varying float vDd; varying vec4 vG;
      void main() {
        if (uInt < 0.002 || kzClair(gl_FragCoord.xy) > 0.5) discard;
        vec2 p = (vUv - vec2(0.5, 0.2)) * vec2(1.05, 1.25);
        float nerv;
        float d = kzKudzu(p, nerv);
        float fl = vG.w + fwidth(d) * 0.8;
        float a = smoothstep(fl, -fl, d);
        if (a < 0.004) discard;
        // contre-jour : sombre au centre, le bord et les nervures s'allument (la lumière traverse)
        float bord = smoothstep(-0.09 - fl, 0.0, d);
        float loin = smoothstep(4.0, 16.0, vDd);
        float pres = 1.0 - smoothstep(1.5, 4.0, vDd);
        vec3 base = mix(vec3(0.006, 0.02, 0.014), uJade * 0.05, 0.4 + 0.3 * vG.z);
        vec3 c = base + uJade * nerv * 0.11 * (1.0 - pres) + mix(uJade, uLueur, 0.55) * bord * (0.12 + 0.2 * (1.0 - loin)) * (1.0 - pres * 0.6);
        c += uLueur * 0.03 * (1.0 - smoothstep(-0.2, 0.0, d));
        // le lointain se perd dans l'air coloré de la salle ; les premiers plans restent des silhouettes
        c = mix(c, uLueur * 0.025, loin * 0.65);
        // premiers plans : silhouettes au liseré de lumière
        c += mix(uLueur, vec3(1.0), 0.3) * pres * smoothstep(-0.25, 0.0, d) * 0.18;
        a *= mix(0.92, 0.7, loin) * mix(1.0, 0.72, pres);
        gl_FragColor = vec4(c * uInt, a * uInt);
      }`,
  });
  const feuilles = new THREE.Mesh(geo, mat);
  feuilles.frustumCulled = false;
  feuilles.renderOrder = 2;
  groupe.add(feuilles);

  /* ------------------------------------------------------------ les poussières */
  const nP = mobile ? 320 : 900;
  const pos = new Float32Array(nP * 3), aP = new Float32Array(nP * 4);
  for (let i = 0; i < nP; i++) {
    const z = 6.8 - Math.pow(alea(), 0.7) * 14;
    pos.set([(alea() * 2 - 1) * 1.15, (alea() * 2 - 1) * 1.1, z], i * 3);
    aP.set([alea(), alea(), alea(), alea()], i * 4);
  }
  const gP = new THREE.BufferGeometry();
  gP.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  gP.setAttribute('aP', new THREE.BufferAttribute(aP, 4));
  const uP = {
    ...U,
    uRepere: u.uRepere, uDemi: u.uDemi, uTemps: u.uTemps, uInt: { value: 0 }, uTaille: { value: 1 },
    uCouleur: { value: new THREE.Color(0xd9ccff) }, uFocale: { value: 8 },
    uPart: { value: 1 },   // v19 : la part des poussières gardées (qualité adaptative) ; 1 = toutes
  };
  const matP = new THREE.ShaderMaterial({
    uniforms: uP, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
    vertexShader: /* glsl */ `
      precision highp float;
      ${GLSL_TEXBRUIT}
      uniform vec2 kzRes; uniform float kzTps;
      attribute vec4 aP;
      uniform vec3 uRepere; uniform vec2 uDemi; uniform float uTemps; uniform float uTaille; uniform float uFocale; uniform float uPart;
      varying float vA; varying float vFlou; varying float vT;
      void main() {
        // v19 : sous la qualité adaptative, les poussières s'éteignent une à une (rang tiré au hasard), en fondu ; une
        // poussière éteinte ne dessine aucun pixel (taille nulle)
        float garde = uPart >= 1.0 ? 1.0 : 1.0 - smoothstep(uPart - 0.08, uPart, fract(aP.x * 7.31 + aP.w * 3.17));
        float z = position.z + sin(uTemps * 0.05 + aP.x * 20.0) * 0.4;
        float dd = max(uRepere.z - z, 0.4);
        vec2 n = position.xy + vec2(sin(uTemps * (0.03 + aP.y * 0.04) + aP.z * 30.0), cos(uTemps * (0.025 + aP.x * 0.03) + aP.w * 30.0)) * 0.06;
        n.y = mod(n.y - uTemps * (0.004 + 0.01 * aP.w) + 1.1, 2.2) - 1.1;   // elles montent doucement
        vec3 w = vec3(n.x * uDemi.x * dd, n.y * uDemi.y * dd + uRepere.y, z);
        vec4 mv = viewMatrix * vec4(w, 1.0);
        gl_Position = projectionMatrix * mv;
        // les rayons (même dessin que le fond) : la poussière s'y allume
        vec2 uv = gl_Position.xy / gl_Position.w * 0.5 + 0.5;
        float asp = kzRes.x / kzRes.y;
        vec2 dv = (uv - vec2(0.5 + 0.12 * sin(kzTps * 0.031), 1.3)) * vec2(asp, 1.0);
        float a = atan(dv.x, -dv.y);
        float nn = textureLod(kzBruitTex, vec2(a * 0.9 + kzTps * 0.004, kzTps * 0.003), 0.0).r * 0.6 + textureLod(kzBruitTex, vec2(a * 2.3 - kzTps * 0.007, 0.37), 0.0).g * 0.4;
        float ry = smoothstep(0.45, 0.8, nn) * smoothstep(1.1, 0.25, abs(a));
        float coc = abs(dd - uFocale) / dd;
        vFlou = clamp(coc * 1.4, 0.0, 1.0);
        float px = uTaille * (1.2 + 2.0 * aP.z) * (6.0 / dd) + uTaille * coc * 34.0;
        gl_PointSize = garde > 0.0 ? clamp(px, 1.0, 90.0) : 0.0;
        float sc = 0.4 + 0.6 * pow(0.5 + 0.5 * sin(uTemps * (0.6 + aP.w * 1.7) + aP.x * 50.0), 2.0);
        vA = (0.18 + 1.6 * ry) * sc / (1.0 + coc * coc * 18.0) * garde;
        vT = aP.y;
      }`,
    fragmentShader: /* glsl */ `
      precision highp float;
      uniform vec3 uCouleur; uniform float uInt; varying float vA; varying float vFlou; varying float vT;
      void main() {
        float r = length(gl_PointCoord - 0.5) * 2.0;
        float net = exp(-r * r * 7.0);
        float disque = smoothstep(1.0, 0.86, r) * (0.55 + 0.45 * smoothstep(0.3, 0.95, r));
        float a = mix(net, disque * 0.5, vFlou);
        vec3 c = mix(uCouleur, vec3(1.0, 0.9, 0.75), step(0.8, vT) * 0.6);
        gl_FragColor = vec4(c * a * vA * uInt, 1.0);
      }`,
  });
  const poussieres = new THREE.Points(gP, matP);
  poussieres.frustumCulled = false;
  poussieres.renderOrder = 28;
  groupe.add(poussieres);

  return {
    groupe, feuilles, poussieres, u, uP,
    /* repère de repos de la caméra et champ */
    cadrer(camera, repere, portrait) {
      const t = Math.tan(camera.fov * Math.PI / 360);
      u.uDemi.value.set(t * camera.aspect, t);
      u.uRepere.value.copy(repere);
      u.uPortrait.value = portrait ? 1 : 0;
      uP.uFocale.value = repere.z;
    },
    maj({ temps, vent, intF, intP, lueur, jade, couleurP, ouvre, taille, part = 1 }) {
      uP.uPart.value = part > 0.999 ? 1 : part;
      u.uTemps.value = temps; u.uVent.value = vent;
      u.uInt.value = intF; u.uOuvre.value = ouvre;
      u.uLueur.value.copy(lueur); u.uJade.value.copy(jade);
      uP.uInt.value = intP; uP.uCouleur.value.copy(couleurP); uP.uTaille.value = taille;
      feuilles.visible = intF > 0.002;
      poussieres.visible = intP > 0.002;
    },
  };
}
