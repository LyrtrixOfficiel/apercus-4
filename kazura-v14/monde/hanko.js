/* Kazura v14, la Scène : le hanko (la partie « Qui fait votre site »).
   Il remplace l'étoile dorée. Au Japon, le hanko est le sceau de signature : on le presse dans l'encre
   vermillon puis sur le papier, et l'empreinte vaut signature. Ici, le sceau de Kazura est gravé dans
   une pierre de jade cerclée d'or ; il descend sur une feuille de washi, presse, l'encre s'étale dans les
   fibres, et il se relève en montrant sa face gravée et encrée : « celui qui fait, signe ».
   Le ciel d'estampe indigo et ses volutes (fond.js) tournent autour de l'empreinte.
   La signature se joue d'elle-même quand on arrive dans la partie ; un toucher sur le papier ou sur la
   pierre la fait rejouer. Mouvement réduit : même geste, plus lent et plus doux. */
import { GLSL_MASQUE, GLSL_TEXBRUIT } from './glsl.js';

const ANNEAU = 'M50 2a48 48 0 1 0 0 96 48 48 0 1 0 0-96zm0 6a42 42 0 1 1 0 84 42 42 0 1 1 0-84z';
const FOLIOLE = 'M50 46C39.5 37 34.5 23.5 50 7c15.5 16.5 10.5 30 0 39zm0-7.4c6.2-6 8.6-14.4 0-23.6-8.6 9.2-6.2 17.6 0 23.6z';

/* le dessin du sceau, en blanc sur noir, pour l'empreinte et la face gravée */
function textureSceau(THREE) {
  const N = 512, cv = document.createElement('canvas');
  cv.width = cv.height = N;
  const cx = cv.getContext('2d');
  cx.fillStyle = '#000'; cx.fillRect(0, 0, N, N);
  cx.save();
  cx.translate(N * 0.06, N * 0.06);
  cx.scale(N * 0.88 / 100, N * 0.88 / 100);
  cx.fillStyle = '#fff';
  cx.fill(new Path2D(ANNEAU), 'evenodd');
  for (let k = 0; k < 3; k++) { cx.save(); cx.translate(50, 50); cx.rotate(k * Math.PI * 2 / 3); cx.translate(-50, -50); cx.fill(new Path2D(FOLIOLE), 'evenodd'); cx.restore(); }
  cx.beginPath(); cx.arc(50, 50, 4.6, 0, Math.PI * 2); cx.fill();
  cx.restore();
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.NoColorSpace;
  t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter;
  return t;
}

export function creerHanko(THREE, { mobile, U, reduit }) {
  const V3 = THREE.Vector3;
  const groupe = new THREE.Group();     // posé devant la caméra
  const papierG = new THREE.Group();    // le plan du papier (incliné vers l'arrière)
  groupe.add(papierG);
  const texS = textureSceau(THREE);
  const RS = 0.19;                       // rayon de l'empreinte (unités du papier, largeur 1)
  const CENTRE = new THREE.Vector2(0.0, 0.04);

  /* ------------------------------------------------------------ le washi */
  const uP = {
    ...U, tSceau: { value: texS }, uEncre: { value: 0 }, uEtale: { value: 0 }, uOmbre: { value: new THREE.Vector3(0, 0, 0) },
    uVis: { value: 0 }, uTemps: { value: 0 }, uRs: { value: RS }, uCentre: { value: CENTRE }, uPresse: { value: 0 },
  };
  const papier = new THREE.Mesh(new THREE.PlaneGeometry(1, 1.25, 1, 1), new THREE.ShaderMaterial({
    uniforms: uP, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: /* glsl */ `varying vec2 vUv; varying vec2 vP; void main() { vUv = uv; vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      ${GLSL_TEXBRUIT}
      ${GLSL_MASQUE}
      uniform sampler2D tSceau; uniform float uEncre; uniform float uEtale; uniform vec3 uOmbre; uniform float uVis; uniform float uTemps;
      uniform float uRs; uniform vec2 uCentre; uniform float uPresse;
      varying vec2 vUv; varying vec2 vP;
      void main() {
        if (uVis < 0.005 || kzClair(gl_FragCoord.xy) > 0.5) discard;
        // bords frangés du washi (le papier fait main n'a pas de bord droit)
        vec2 e = min(vUv, 1.0 - vUv) * vec2(1.0, 1.25);
        float fr = kzTB(vUv * vec2(3.0, 0.4) + 0.3).r * 0.035 + kzTB(vUv * vec2(0.4, 3.0)).g * 0.035;
        float a = smoothstep(0.0, 0.012, min(e.x, e.y) - fr);
        if (a < 0.01) discard;
        // fibres : longues, claires, dans tous les sens
        float f1 = pow(1.0 - abs(kzTB(vUv * vec2(1.3, 9.0)).g * 2.0 - 1.0), 14.0);
        float f2 = pow(1.0 - abs(kzTB(vUv.yx * vec2(1.1, 11.0) + 0.5).r * 2.0 - 1.0), 16.0);
        float nuage = kzTB(vUv * 2.2).r;
        vec3 c = vec3(0.93, 0.88, 0.78) * (0.9 + 0.12 * nuage) + vec3(0.06, 0.05, 0.03) * (f1 + f2);
        // lumière de lanterne : chaude en haut à gauche, plus froide vers le bas (la nuit)
        float lum = 0.55 + 0.5 * smoothstep(1.1, 0.0, length((vUv - vec2(0.2, 0.95)) * vec2(1.0, 0.8)));
        c *= lum;
        c = mix(c, c * vec3(0.55, 0.6, 0.95), 0.25 * smoothstep(0.3, 0.0, vUv.y));
        // l'ombre de la pierre quand elle approche
        vec2 dc = vP - uCentre;
        c *= 1.0 - uOmbre.z * exp(-dot(dc - uOmbre.xy, dc - uOmbre.xy) / max(uOmbre.z * 0.0 + 0.02 + 0.12 * (1.0 - uOmbre.z), 0.01));
        // l'empreinte (le hanko imprime le dessin à l'endroit)
        vec2 su = dc / (2.0 * uRs) + 0.5;
        if (uEncre > 0.001 && su.x > -0.2 && su.x < 1.2 && su.y > -0.2 && su.y < 1.2) {
          vec2 sv = vec2(su.x, su.y);
          float m0 = textureLod(tSceau, sv, 0.0).r;
          float m1 = textureLod(tSceau, sv, 2.2 + 1.8 * uEtale).r;
          float fib = kzTB(sv * 7.0).g;
          float champ = mix(m0, m1, 0.35 + 0.45 * uEtale) + (fib - 0.5) * 0.22 * (0.4 + uEtale);
          float encre = smoothstep(0.5 - 0.18 * uEtale, 0.58 - 0.12 * uEtale, champ);
          // la pierre n'imprime pas partout pareil : de petites réserves de papier
          float tache = smoothstep(0.25, 0.55, kzTB(sv * 5.0 + 0.7).b + 0.25 * uEtale);
          encre *= mix(0.7, 1.0, tache) * uEncre;
          vec3 verm = mix(vec3(0.72, 0.07, 0.035), vec3(0.5, 0.03, 0.02), (1.0 - m1) * 0.5 * m0);
          verm *= 0.9 + 0.2 * f1;
          c = mix(c, verm * (0.75 + 0.35 * lum), encre * 0.93);
          // un halo d'encre humide pendant qu'elle s'étale
          c = mix(c, c * vec3(0.95, 0.8, 0.75), smoothstep(0.08, 0.3, m1) * (1.0 - encre) * uEncre * 0.25 * (1.0 - uEtale));
        }
        gl_FragColor = vec4(c, a * uVis);
      }`,
  }));
  papier.renderOrder = 17;
  papier.frustumCulled = false;
  papierG.add(papier);

  /* ------------------------------------------------------------ la pierre : jade, bague d'or, dôme */
  // un hanko classique : un cylindre mince de pierre, chanfreiné, à tête plate marquée d'un point (l'« atari »)
  const profil = [[0, 0], [0.285, 0], [0.3, 0.014], [0.302, 0.035], [0.302, 1.3], [0.296, 1.345], [0.278, 1.375], [0.24, 1.392], [0, 1.395]]
    .map(([x, y]) => new THREE.Vector2(x, y));
  const gPierre = new THREE.LatheGeometry(profil, mobile ? 40 : 72);
  const matPierre = new THREE.MeshPhysicalMaterial({ color: 0x158a62, roughness: 0.38, metalness: 0, clearcoat: 0.35, clearcoatRoughness: 0.3, envMapIntensity: 1.6, sheen: 0.5, sheenRoughness: 0.6, sheenColor: new THREE.Color(0x9fe8c8) });
  matPierre.onBeforeCompile = (sh) => {
    sh.uniforms.kzBruitTex = U.kzBruitTex;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vKzP;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvKzP = position;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vKzP;\nuniform sampler2D kzBruitTex;')
      .replace('#include <color_fragment>', `#include <color_fragment>
        float kzA = atan(vKzP.z, vKzP.x);
        float kzV = texture2D(kzBruitTex, vec2(kzA * 0.3 + vKzP.y * 0.4, vKzP.y * 1.3)).g;
        float kzFil = 1.0 - smoothstep(0.0, 0.04, abs(texture2D(kzBruitTex, vec2(kzA * 0.5, vKzP.y * 0.8) + 0.3).r - 0.5));
        diffuseColor.rgb = mix(vec3(0.025, 0.2, 0.13), vec3(0.11, 0.44, 0.31), smoothstep(0.25, 0.8, kzV)) + vec3(0.5, 0.7, 0.55) * kzFil * 0.22;`);
  };
  const pierre = new THREE.Mesh(gPierre, matPierre);
  const bague = new THREE.Mesh(new THREE.TorusGeometry(0.312, 0.022, 12, mobile ? 48 : 80), new THREE.MeshStandardMaterial({ color: 0xe9c987, metalness: 1, roughness: 0.22, envMapIntensity: 2.2 }));
  bague.rotation.x = Math.PI / 2; bague.position.y = 1.18; bague.scale.set(0.985, 0.985, 0.55);
  const bague2 = bague.clone(); bague2.position.y = 0.11; bague2.scale.set(0.985, 0.985, 0.55);
  const atari = new THREE.Mesh(new THREE.CircleGeometry(0.035, 20), bague.material);
  atari.rotation.x = -Math.PI / 2; atari.position.set(0, 1.397, 0.19);
  // la face gravée : le sceau en relief, encré de vermillon, en miroir (c'est un tampon)
  const uF = { tSceau: { value: texS }, uEncre: { value: 0 }, uLum: { value: 1 } };
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.3, mobile ? 40 : 72), new THREE.ShaderMaterial({
    uniforms: uF,
    vertexShader: /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D tSceau; uniform float uEncre; uniform float uLum; varying vec2 vUv;
      void main() {
        vec2 uv = vec2(1.0 - vUv.x, vUv.y);
        float m = texture2D(tSceau, (uv - 0.5) * (0.27 / 0.3) / 0.88 * 0.88 + 0.5).r;
        float bord = texture2D(tSceau, (uv - 0.5) * (0.27 / 0.3) + 0.5 + vec2(0.004)).r;
        vec3 pierre = vec3(0.03, 0.2, 0.13);
        vec3 relief = mix(vec3(0.06, 0.32, 0.22), vec3(0.62, 0.05, 0.025), uEncre);
        vec3 c = mix(pierre * 0.6, relief, m) + vec3(0.25) * max(0.0, m - bord) * 0.6;
        gl_FragColor = vec4(c * uLum, 1.0);
      }`,
  }));
  face.rotation.x = Math.PI / 2;   // regarde vers le bas (-y de la pierre)
  face.position.y = -0.0005;
  const hanko = new THREE.Group();
  hanko.add(pierre, bague, bague2, atari, face);
  const ECH_PIERRE = 0.7;   // la face (rayon 0,3 x 0,7) couvre l'empreinte (rayon 0,19 : le dessin occupe 88 % du cercle)
  // l'axe de la pierre (y) suit la normale du papier (z local)
  const axe = new THREE.Group();
  axe.rotation.x = Math.PI / 2;
  axe.add(hanko);
  const porte = new THREE.Group();    // déplacement le long de la normale, et bascule pour montrer la face
  porte.add(axe);
  papierG.add(porte);
  groupe.traverse((o) => { o.frustumCulled = false; });
  groupe.visible = false;

  /* la lanterne : une lumière chaude toujours présente dans la scène (jamais ajoutée ni retirée :
     changer le nombre de lumières ferait recompiler toutes les matières) */
  const lanterne = new THREE.PointLight(0xffb070, 0, 7, 1.6);

  /* ------------------------------------------------------------ le geste */
  const D = reduit ? 1.4 : 1;
  let t0 = -1, signe = false, encre = 0, etale = 0, idle = 0, redresse = 0;
  const ecran = new THREE.Vector3();
  const res = { x: 0.62, y: 0.55, r: 0.2 };
  const tmp = new V3();
  let rayonEcran = 0.2;
  const es = (x) => { x = Math.min(1, Math.max(0, x)); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const sortie = (x) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
  const entree = (x) => Math.pow(Math.min(1, Math.max(0, x)), 2.2);

  function signer(temps) { t0 = temps; }

  return {
    groupe, lanterne, signer,
    toucher(x, y, asp, temps) {
      if (!groupe.visible || uP.uVis.value < 0.5) return false;
      if (Math.hypot((x - res.x) * asp, y - res.y) < rayonEcran * 1.7) { if (t0 < 0 || temps - t0 > 1.6 * D) signer(temps); return true; }
      return false;
    },
    maj({ dt, temps, vis, camera, portrait, inclX, inclY, reduit }) {
      groupe.visible = vis > 0.002;
      lanterne.intensity = 0;
      if (!groupe.visible) return null;
      // placement devant la caméra
      const dEt = 3.2;
      const hv = 2 * dEt * Math.tan(camera.fov * Math.PI / 360), wv = hv * camera.aspect;
      const taille = Math.min(hv * (portrait ? 0.3 : 0.46), wv * (portrait ? 0.62 : 0.34));
      const bx = portrait ? -0.1 * wv : 0.15 * wv, by = portrait ? 0.02 * hv : -0.15 * hv;
      tmp.set(bx, by + Math.sin(temps * 0.5) * 0.015, -dEt).applyQuaternion(camera.quaternion).add(camera.position);
      groupe.position.copy(tmp);
      groupe.quaternion.copy(camera.quaternion);
      groupe.scale.setScalar(taille * (0.94 + 0.06 * vis));
      
      // le geste : arrive dans la partie, la pierre signe d'elle-même une fois
      if (t0 < 0 && vis > 0.7) signer(temps);
      const k = t0 < 0 ? -1 : (temps - t0) / D;
      const HAUT = 0.4;
      let h = HAUT, bascule = 0, presse = 0;
      if (k < 0) { h = HAUT; }
      else if (k < 0.95) { h = HAUT * (1 - entree(k / 0.95)); }
      else if (k < 1.45) { h = 0; presse = Math.sin(Math.PI * (k - 0.95) / 0.5); if (!signe || encre < 1) { encre = Math.min(1, encre + dt * 4 / D); } signe = true; }
      else if (k < 2.5) { const q = sortie((k - 1.45) / 1.05); h = 0.42 * q; bascule = 0.85 * es((k - 1.6) / 0.9); }
      else { h = 0.42; bascule = 0.85; }
      const ecart = bascule / 0.85;   // relevée, la pierre s'écarte de l'empreinte
      // une fois signé, le papier se redresse vers nous pour montrer l'empreinte
      const cibleR = (k >= 1.9 || (k < 0 && signe)) ? 1 : 0;
      redresse += (cibleR - redresse) * (1 - Math.exp(-dt * (reduit ? 1.4 : 2.2)));
      papierG.rotation.set(-1.0 + 0.48 * redresse + inclX * 0.05, inclY * 0.08, portrait ? 0 : -0.05);
      if (k >= 1.0) etale = Math.min(1, etale + dt * 0.45 / D); else if (k >= 0 && k < 0.95 && signe) etale = Math.max(0.35, etale - dt * 0.5);
      idle += dt;
      const flotte = k > 2.5 || k < 0 ? Math.sin(idle * 0.9) * 0.025 : 0;
      porte.position.set(CENTRE.x + ecart * 0.7, CENTRE.y + ecart * 0.42, ecart * 0.62);
      axe.position.set(0, 0, 0);
      hanko.position.set(0, h + flotte, 0);
      hanko.scale.set(ECH_PIERRE, ECH_PIERRE * (1 - presse * 0.025), ECH_PIERRE);
      // la bascule : la pierre se relève et tourne sa face gravée vers nous
      // la face gravée se tourne vers nous (l'angle dépend de l'inclinaison du papier)
      porte.rotation.set(-ecart * (2.15 + 0.45 * redresse), 0, ecart * 0.25);
      hanko.rotation.y = (k < 0 ? idle * 0.25 : 0) + (k > 2.5 ? (idle - 2.5) * 0.12 : 0);
      uP.uVis.value = vis; uP.uTemps.value = temps;
      uP.uEncre.value = encre; uP.uEtale.value = etale; uP.uPresse.value = presse;
      uP.uOmbre.value.set(0, 0, (1 - Math.min(1, h / HAUT)) * 0.55 * (k >= 0 ? 1 : 0.4));
      uF.uEncre.value = signe ? 0.8 : 0.95;
      matPierre.opacity = 1;
      // la lanterne éclaire la pierre
      tmp.set(-0.6, 0.9, 0.9).multiplyScalar(taille).applyQuaternion(camera.quaternion).add(groupe.position);
      lanterne.position.copy(tmp);
      lanterne.intensity = 3.2 * vis;
      // position écran de l'empreinte : les volutes du ciel tournent autour
      papier.updateMatrixWorld(true);
      ecran.set(CENTRE.x, CENTRE.y, 0); papier.localToWorld(ecran); ecran.project(camera);
      res.x = ecran.x * 0.5 + 0.5; res.y = ecran.y * 0.5 + 0.5;
      rayonEcran = RS * taille / hv;
      res.r = rayonEcran * 1.3;
      return res;
    },
    detruire() { texS.dispose(); },
  };
}
