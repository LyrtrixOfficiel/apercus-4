// Le domaine Kazura : le château de grès rose au sommet de la colline, inspiré du Haut-Koenigsbourg.
// Long et étroit sur son éperon rocheux : grand bastion à l'ouest (tour ronde coiffée d'un cône),
// le logis aux toits pentus, le haut donjon carré (parapet crénelé, échauguettes, toit pointu et flèche),
// la partie est plus basse avec sa tour-porte et sa tour ronde, et l'enceinte crénelée devant.
// Une seule géométrie fusionnée, une seule matière : grès, tuiles, ardoise, roche, fenêtres.
// La nuit, il est éclairé par en dessous et ses fenêtres s'allument.

import { alea, fbm2, GLSL_BRUIT, GLSL_LUMIERE } from './commun.js';
import { SOMMET } from './terrain.js';

const GRES = 0, TUILE = 1, ARDOISE = 2, ROCHE = 3;

export function creerChateau(THREE, U, { mobile }) {
  const pos = [], nor = [], mat = [], fen = [];
  const h = alea(3);

  function ajoute(g, m, fenetres = 0) {
    const gg = g.index ? g.toNonIndexed() : g;
    gg.computeVertexNormals();
    const p = gg.attributes.position.array, n = gg.attributes.normal.array;
    for (let i = 0; i < p.length; i++) { pos.push(p[i]); nor.push(n[i]); }
    for (let i = 0; i < p.length / 3; i++) { mat.push(m); fen.push(fenetres); }
  }
  const boite = (x0, x1, y0, y1, z0, z1, m = GRES, f = 0) =>
    ajoute(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0).translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), m, f);
  const tour = (x, z, r, y0, y1, m = GRES, f = 0) =>
    ajoute(new THREE.CylinderGeometry(r, r * 1.04, y1 - y0, mobile ? 12 : 18, 1).translate(x, (y0 + y1) / 2, z), m, f);
  const cone = (x, z, r, y0, hc, m = ARDOISE, cotes = 14) =>
    ajoute(new THREE.ConeGeometry(r, hc, cotes, 1).translate(x, y0 + hc / 2, z), m);
  const pyramide = (x, z, cote, y0, hc, m = TUILE) =>
    ajoute(new THREE.ConeGeometry(cote * 0.7071, hc, 4, 1).rotateY(Math.PI / 4).translate(x, y0 + hc / 2, z), m);
  function toit(x0, x1, z0, z1, y0, hr, m = TUILE, deb = 0.6) {
    // toit à deux pans, faîtage selon x, avec débord
    const a = x0 - deb, b = x1 + deb, c = z0 - deb, d = z1 + deb, zm = (z0 + z1) / 2, y = y0 - 0.3;
    const v = [
      a, y, d, b, y, d, b, y0 + hr, zm, a, y, d, b, y0 + hr, zm, a, y0 + hr, zm,
      b, y, c, a, y, c, a, y0 + hr, zm, b, y, c, a, y0 + hr, zm, b, y0 + hr, zm,
      a + deb, y0, c + deb, a + deb, y0, d - deb, a + deb, y0 + hr - 0.2, zm,
      b - deb, y0, d - deb, b - deb, y0, c + deb, b - deb, y0 + hr - 0.2, zm,
    ];
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
    ajoute(g, m);
    // les pignons en grès
    const pg = new THREE.BufferGeometry();
    pg.setAttribute('position', new THREE.Float32BufferAttribute([
      x0, y0, z0, x0, y0, z1, x0, y0 + hr - 0.3, zm, x1, y0, z1, x1, y0, z0, x1, y0 + hr - 0.3, zm], 3));
    ajoute(pg, GRES);
  }
  function creneauxLigne(x0, z0, x1, z1, y, ep = 1.2) {
    const L = Math.hypot(x1 - x0, z1 - z0), n = Math.floor(L / 1.8);
    const ang = Math.atan2(z1 - z0, x1 - x0);
    ajoute(new THREE.BoxGeometry(L, 0.5, ep).rotateY(-ang).translate((x0 + x1) / 2, y + 0.25, (z0 + z1) / 2), GRES);
    for (let i = 0; i <= n; i++) {
      const t = (i + 0.25) / (n + 0.5);
      ajoute(new THREE.BoxGeometry(1.0, 1.25, ep).rotateY(-ang).translate(x0 + (x1 - x0) * t, y + 0.5 + 0.62, z0 + (z1 - z0) * t), GRES);
    }
  }
  function creneauxBoite(x0, x1, z0, z1, y) {
    creneauxLigne(x0, z1, x1, z1, y); creneauxLigne(x0, z0, x1, z0, y);
    creneauxLigne(x0, z0, x0, z1, y); creneauxLigne(x1, z0, x1, z1, y);
  }
  function creneauxRond(x, z, r, y) {
    const n = Math.max(10, Math.round((Math.PI * 2 * r) / 1.8));
    ajoute(new THREE.CylinderGeometry(r * 1.06, r * 1.06, 0.6, 16, 1, true).translate(x, y + 0.3, z), GRES);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      ajoute(new THREE.BoxGeometry(0.95, 1.2, 0.9).rotateY(-a).translate(x + Math.cos(a) * r, y + 1.1, z + Math.sin(a) * r), GRES);
    }
  }

  /* l'éperon rocheux */
  {
    const g = new THREE.CylinderGeometry(1, 1.2, 1, 40, 6, false);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const a = Math.atan2(z, x);
      const n = fbm2(Math.cos(a) * 3 + y * 2, Math.sin(a) * 3 + y, 3);
      const s = 1 + (n - 0.5) * 0.35;
      p.setXYZ(i, x * 58 * s, y * 16 - 7, z * 17 * s);
    }
    ajoute(g, ROCHE);
  }

  /* l'enceinte basse, devant (face à la caméra) */
  boite(-34, 42, -5, 4.5, 10.2, 12, GRES);
  creneauxLigne(-34, 11.1, 42, 11.1, 4.5);
  for (const x of [-12, 21]) { tour(x, 12, 2.4, -5, 6.5); cone(x, 12, 2.9, 6.5, 4.2); }
  boite(-48, -34, -6, 3, 9.5, 11.5, GRES); creneauxLigne(-48, 10.5, -34, 10.5, 3);

  /* le grand bastion, à l'ouest */
  boite(-52, -35, 0, 13, -9.5, 9.5, GRES, 11);
  creneauxBoite(-52, -35, -9.5, 9.5, 13);
  tour(-47.5, 8.5, 5.4, 0, 19, GRES, 16); cone(-47.5, 8.5, 6.2, 19, 10.5);
  tour(-47.5, -8.5, 5.0, 0, 15.5); creneauxRond(-47.5, -8.5, 5.0, 15.5);

  /* le logis et son aile arrière */
  boite(-35, 4, 0, 19, -6, 6, GRES, 17.5);
  toit(-35, 4, -6, 6, 19, 11.5, TUILE);
  boite(-31, -3, 0, 15, -12.5, -6, GRES, 13.5);
  toit(-31, -3, -12.5, -6, 15, 7.5, TUILE);
  boite(-16.5, -11.5, 0, 25, 5.5, 9.5, GRES, 23); pyramide(-14, 7.5, 5.6, 25, 8, ARDOISE);
  // lucarnes
  for (const x of [-28, -20, -6, 0]) { boite(x - 1, x + 1, 19, 22, 4.6, 6.4, GRES); pyramide(x, 5.5, 2.4, 22, 2.2, TUILE); }

  /* le donjon */
  boite(4, 13, 0, 42, -4.5, 4.5, GRES, 40);
  boite(3.2, 13.8, 41.5, 43.6, -5.3, 5.3, GRES);
  creneauxBoite(3.4, 13.6, -5.1, 5.1, 43.6);
  pyramide(8.5, 0, 9.2, 44.2, 11.5, ARDOISE);
  ajoute(new THREE.ConeGeometry(0.42, 6, 8, 1).translate(8.5, 44.2 + 11.5 + 2.4, 0), ARDOISE);
  for (const [x, z] of [[3.4, 5.1], [13.6, 5.1], [3.4, -5.1], [13.6, -5.1]]) { tour(x, z, 1.0, 40.5, 45.5); cone(x, z, 1.25, 45.5, 3.2, ARDOISE, 10); }

  /* le corps central et l'est */
  boite(13, 31, 0, 14, -5.5, 5.5, GRES, 12.5);
  toit(13, 31, -5.5, 5.5, 14, 8, TUILE);
  boite(31, 54, -4, 8, -3.8, 3.8, GRES);
  creneauxBoite(31, 54, -3.8, 3.8, 8);
  boite(35, 41.5, 0, 19.5, -3.4, 3.4, GRES, 17.5); pyramide(38.25, 0, 7.6, 19.5, 8.5, TUILE);
  tour(52, 0.5, 3.6, 0, 14, GRES, 12); cone(52, 0.5, 4.2, 14, 6.5);
  boite(42, 50, 0, 10, -9, -3.8, GRES, 8.5); toit(42, 50, -9, -3.8, 10, 4.5, TUILE);

  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('aMat', new THREE.Float32BufferAttribute(mat, 1));
  g.setAttribute('aFen', new THREE.Float32BufferAttribute(fen, 1));

  const m = new THREE.ShaderMaterial({
    uniforms: U,
    side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      attribute float aMat; attribute float aFen;
      varying vec3 vPos; varying vec3 vLoc; varying vec3 vN; varying float vMat; varying float vFen;
      void main() {
        vLoc = position; vN = normalize(mat3(modelMatrix) * normal); vMat = aMat; vFen = aFen;
        vec4 w = modelMatrix * vec4(position, 1.0); vPos = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */`
      uniform float uChateauLum; uniform float uTemps;
      ${GLSL_BRUIT}
      ${GLSL_LUMIERE}
      varying vec3 vPos; varying vec3 vLoc; varying vec3 vN; varying float vMat; varying float vFen;
      void main() {
        vec3 v = normalize(vPos - cameraPosition);
        vec3 n = normalize(vN);
        if (dot(n, v) > 0.0) n = -n;
        vec3 nl = normalize(vec3(vN.x, vN.y, vN.z));
        float horiz = abs(nl.z) > abs(nl.x) ? vLoc.x : vLoc.z;
        vec3 alb; float rugueux = 1.0;
        if (vMat < 0.5) {
          // grès rose : assises de pierres décalées, coulures sombres, pied plus gris
          float rang = floor(vLoc.y / 0.62);
          float bloc = floor((horiz + rang * 0.55) / 1.25);
          float var = h21(vec2(rang, bloc));
          alb = vec3(0.47, 0.17, 0.12) * mix(0.82, 1.12, var);
          float joint = smoothstep(0.04, 0.0, abs(fract(vLoc.y / 0.62) - 0.5) - 0.44);
          alb *= 1.0 - joint * 0.25;
          alb *= mix(0.72, 1.0, smoothstep(0.2, 0.8, bruit(vec2(horiz * 0.35, vLoc.y * 0.05))));
          alb = mix(alb, vec3(0.3, 0.24, 0.22), smoothstep(4.0, -4.0, vLoc.y) * 0.5);
        } else if (vMat < 1.5) {
          alb = vec3(0.2, 0.065, 0.045) * (0.85 + 0.15 * step(0.5, fract(vLoc.y * 2.6))) * mix(0.8, 1.15, bruit(vLoc.xz * 0.6));
        } else if (vMat < 2.5) {
          alb = vec3(0.07, 0.065, 0.075) * (0.9 + 0.1 * step(0.5, fract(vLoc.y * 3.2)));
        } else {
          alb = vec3(0.2, 0.15, 0.13) * mix(0.6, 1.1, fbm3(vLoc.xz * 0.15 + vLoc.y * 0.1));
        }
        float ao = mix(0.55, 1.0, smoothstep(-6.0, 10.0, vLoc.y));
        vec3 c = eclairer(alb, n, v, ao, 0.0, 0.15);
        if (vMat > 0.5 && vMat < 2.5) { vec3 hh = normalize(uLumDir - v); c += uLumCouleur * pow(max(dot(n, hh), 0.0), 30.0) * 0.12; }
        // fenêtres
        float fenetre = 0.0; float allume = 0.0;
        if (vFen > 0.5 && abs(n.y) < 0.3 && vLoc.y > 3.0 && vLoc.y < vFen) {
          vec2 cel = vec2(horiz / 3.2, (vLoc.y - 3.0) / 4.3);
          vec2 f = fract(cel) - 0.5;
          fenetre = step(abs(f.x), 0.1) * step(abs(f.y), 0.17);
          allume = step(0.38, h21(floor(cel) + floor(vLoc.z * 0.1) * 7.0 + floor(vLoc.x * 0.05)));
          c = mix(c, vec3(0.02, 0.025, 0.04) + uCielHaut * 0.05, fenetre * 0.85);
        }
        // l'éclairage de nuit : projecteurs au pied des murs, chaleur dorée
        float lum = uChateauLum;
        if (lum > 0.001) {
          float face = 0.55 + 0.45 * max(n.z, 0.0);
          float pied = 0.45 + 0.75 * (1.0 - smoothstep(-2.0, 46.0, vLoc.y));
          vec3 chaud = vec3(1.0, 0.62, 0.32);
          if (vMat < 0.5) c += alb * chaud * lum * face * pied * 2.6;
          else if (vMat < 2.5) c += alb * chaud * lum * 0.7 * (1.0 - smoothstep(0.0, 12.0, vLoc.y - 15.0));
          else c += alb * chaud * lum * 0.6 * smoothstep(-8.0, 2.0, vLoc.y);
          c += vec3(1.0, 0.66, 0.3) * fenetre * allume * lum * (2.2 + 0.4 * sin(uTemps * 2.0 + vLoc.x));
        }
        gl_FragColor = vec4(brumer(c, vPos), 1.0);
      }`,
  });
  const chateau = new THREE.Mesh(g, m);
  const echelle = 1.0;
  chateau.scale.setScalar(echelle);
  chateau.position.set(SOMMET.x, SOMMET.y - 1.5, SOMMET.z);
  chateau.rotation.y = -0.06;
  chateau.frustumCulled = false;
  return chateau;
}
