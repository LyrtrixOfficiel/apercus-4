/* Kazura v13, la Scène : le carrousel des réalisations.
   Des panneaux courbes, découpés dans un même cylindre, tournent autour d'un axe vertical posé devant
   la caméra, comme un manège vu de face : le panneau actif fait face, les voisins fuient en biais sur
   les bords, plus petits. Chaque panneau porte
   la capture d'écran du site, un léger verre, et des reflets irisés qui courent sur ses bords.
   La page pilote : definir(sites), aller(i), glisser(dx), surChangement(fn). */
import { GLSL_IRIS } from './glsl.js';

export function creerCarrousel(THREE, { mobile, renderer }) {
  const groupe = new THREE.Group();
  const panneaux = [];
  const ecouteurs = [];
  const chargeur = new THREE.TextureLoader();
  let R = 3.6, larg = 3.0, haut = 1.88, pas = 1.0, dFace = 5.4;
  let actif = 0, angle = 0, angleCible = 0, glisse = 0;
  let sites = [];
  const blanc = new THREE.DataTexture(new Uint8Array([24, 20, 32, 255]), 1, 1);
  blanc.needsUpdate = true;
  const couleurs = [];

  const vert = /* glsl */ `
    varying vec2 vUv; varying vec3 vN; varying vec3 vV;
    void main() { vUv = uv; vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`;
  const frag = /* glsl */ `
    ${GLSL_IRIS}
    uniform sampler2D uImg; uniform float uActif; uniform float uTemps; uniform float uVis; uniform vec3 uTeinte; uniform float uPret;
    varying vec2 vUv; varying vec3 vN; varying vec3 vV;
    void main() {
      vec2 uv = vUv;
      vec2 c = uv - 0.5;
      // aberration chromatique douce vers les bords
      vec2 dec = c * 0.006 * (0.4 + length(c));
      vec3 img = vec3(texture2D(uImg, uv + dec).r, texture2D(uImg, uv).g, texture2D(uImg, uv - dec).b);
      img = mix(vec3(0.05, 0.045, 0.07), img, uPret);
      float fr = pow(1.0 - clamp(abs(dot(normalize(vN), normalize(vV))), 0.0, 1.0), 2.5);
      // bords : iridescence qui coule
      vec2 e = min(uv, 1.0 - uv);
      float bord = min(e.x * 1.6, e.y);
      float rive = exp(-bord * 55.0);
      vec3 ir = kzIris(uv.x * 0.8 + uv.y * 0.6 - uTemps * 0.12 + fr);
      // un reflet de verre qui balaie le panneau
      float bal = exp(-pow((uv.x + uv.y * 0.5) - fract(uTemps * 0.05) * 2.6 + 0.5, 2.0) * 60.0) * 0.18;
      vec3 col = img * (0.3 + 0.7 * uActif) + ir * rive * (0.35 + 0.65 * uActif) * 0.9 + vec3(1.0) * bal * uActif + uTeinte * fr * 0.25;
      float a = smoothstep(0.0, 0.004, bord) * uVis;
      // vraies couleurs : on précompense le rendu filmique (ACES) qui viendra après, sinon le blanc d'un site
      // sort délavé et le halo le fait baver
      vec3 y = clamp(col, 0.0, 0.93);
      vec3 A = 2.43 * y - 2.51, B = 0.59 * y - 0.03, C = 0.14 * y;
      vec3 x = (-B - sqrt(max(B * B - 4.0 * A * C, 0.0))) / (2.0 * A);
      col = x * 0.6;
      gl_FragColor = vec4(col * a, a);
    }`;

  function construire() {
    for (const p of panneaux) { groupe.remove(p.mesh); p.mesh.geometry.dispose(); p.mesh.material.dispose(); if (p.tex) p.tex.dispose(); }
    panneaux.length = 0;
    const theta = larg / R;
    sites.forEach((s, i) => {
      const g = new THREE.CylinderGeometry(R, R, haut, mobile ? 24 : 40, 1, true, -theta / 2, theta);
      const u = { uImg: { value: blanc }, uActif: { value: 0 }, uTemps: { value: 0 }, uVis: { value: 0 }, uTeinte: { value: new THREE.Color(s.couleur || '#8b5cf6') }, uPret: { value: 0 } };
      const m = new THREE.ShaderMaterial({ uniforms: u, vertexShader: vert, fragmentShader: frag, side: THREE.FrontSide, transparent: true, depthWrite: true });
      const mesh = new THREE.Mesh(g, m);
      mesh.frustumCulled = false;
      mesh.renderOrder = 6;
      groupe.add(mesh);
      const p = { mesh, u, tex: null };
      panneaux.push(p);
      if (s.image) {
        chargeur.load(s.image, (t) => {
          t.colorSpace = THREE.SRGBColorSpace;
          t.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
          t.generateMipmaps = true;
          p.tex = t; u.uImg.value = t;
        }, undefined, () => {});
      }
    });
  }

  return {
    groupe,
    /* dimensions et rayon selon le format d'écran */
    cadrer({ portrait }) {
      const avant = [R, larg, haut, pas].join();
      if (portrait) { R = 2.2; larg = 1.8; haut = 1.12; pas = 0.62; dFace = 5.0; }
      else { R = 3.6; larg = 3.0; haut = 1.88; pas = 1.0; dFace = 5.4; }
      if (avant !== [R, larg, haut, pas].join() && sites.length) construire();
    },
    definir(liste) {
      sites = (liste || []).map((s) => ({ id: s.id, image: s.image, couleur: s.couleur || '#8b5cf6' }));
      couleurs.length = 0;
      for (const s of sites) couleurs.push(new THREE.Color(s.couleur));
      actif = Math.min(actif, Math.max(0, sites.length - 1));
      angleCible = actif;
      construire();
    },
    aller(i) {
      if (!sites.length) return;
      const n = sites.length;
      const j = ((Math.round(i) % n) + n) % n;
      glisse = 0;
      // chemin le plus court sur la boucle
      let cible = j;
      while (cible - angleCible > n / 2) cible -= n;
      while (angleCible - cible > n / 2) cible += n;
      angleCible = cible;
      if (j !== actif) { actif = j; for (const f of ecouteurs) { try { f(j, sites[j]); } catch {} } }
    },
    glisser(dx, largeurEcran) {
      // un panneau entier = la largeur du panneau à l'écran (environ 60 % de l'écran)
      glisse = -dx / Math.max(200, largeurEcran * 0.62);
    },
    surChangement(fn) { if (typeof fn === 'function') ecouteurs.push(fn); return () => { const k = ecouteurs.indexOf(fn); if (k >= 0) ecouteurs.splice(k, 1); }; },
    get actif() { return actif; },
    get nombre() { return sites.length; },
    couleurActive(out) {
      if (!couleurs.length) return out;
      const n = couleurs.length;
      const x = angle - Math.floor(angle / n) * n;
      const i = Math.floor(x), t = x - i;
      return out.copy(couleurs[i % n]).lerp(couleurs[(i + 1) % n], t * t * (3 - 2 * t));
    },
    /* place le centre du manège : le panneau actif à dFace de la caméra */
    placer(camZ, y) { groupe.position.set(0, y, camZ - dFace - R); },
    /* une image : vis (0 à 1), temps, amortissement */
    maj(dt, temps, vis, lisse) {
      angle = lisse(angle, angleCible + glisse, 6, dt);
      const n = sites.length;
      groupe.visible = vis > 0.002 && n > 0;
      if (!groupe.visible) return;
      panneaux.forEach((p, i) => {
        let d = i - angle;
        d -= Math.round(d / n) * n;
        const a = d * pas;
        p.mesh.rotation.y = a;
        // les voisins reculent un peu vers l'axe : ils passent derrière le panneau actif sans se confondre avec lui
        const kR = 1 - 0.08 * Math.min(1, Math.abs(d));
        p.mesh.scale.set(kR, 1, kR);
        // les panneaux s'ouvrent depuis le centre à l'entrée
        const e = Math.min(1, Math.abs(d) / 2.6);
        p.u.uActif.value = Math.max(0, 1 - Math.abs(d) * 1.2);
        p.u.uTemps.value = temps;
        p.u.uPret.value = Math.min(1, p.u.uPret.value + (p.tex ? dt * 2 : 0));
        p.u.uVis.value = vis * (1 - e * e * 0.6) * (Math.abs(d) < 1.6 ? 1 : 0);
        p.mesh.visible = p.u.uVis.value > 0.003;
        p.mesh.position.y = Math.sin(temps * 0.6 + i) * 0.03;
      });
    },
  };
}
