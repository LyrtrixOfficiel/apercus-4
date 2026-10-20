/* Kazura v13, la Scène : la vie sans interaction, reprise du labo v12 (option sansVrilles : la scène v13
   a déjà ses vrilles accrochées à l'anneau ; on garde ici les feuilles qui tombent, les volutes, les essaims).
   Texte d'origine :
   Quand personne ne touche à rien, le monde continue de vivre, en boucle, lentement mais visiblement :
   - des vrilles neuves jaillissent (de l'anneau du sceau au début, de la liane ensuite), s'enroulent
     en spirale, brillent à leur pointe, puis s'effacent pour renaître ailleurs ;
   - à leur départ, une grappe de fleurs violettes éclot du bas vers le haut, puis se referme ;
   - des feuilles trifoliées se détachent de la liane (ou entrent par le haut) et tournoient en tombant ;
   - des volutes de lumière se dessinent en spirales qui se referment, comme les tourbillons du ciel peint ;
   - des essaims de lucioles se rassemblent, respirent, traversent le champ et se dispersent.
   Le sceau qui respire et la caméra qui dérive sont réglés dans monde-labo.js.
   Tout est en coordonnées du monde, réancré devant la caméra à chaque cycle : la vie suit le visiteur
   partout dans la page, sans jamais coller à l'écran. */
import { hasard, borne, lisse, sortieCubique } from './commun.js';
import { Tubes, materiauLiane, RAYON_ANNEAU } from './liane.js';
import { materiauFeuille } from './feuilles.js';
import { greffer, GLSL_VENT } from './commun.js';

const NB_VOLUTES_MAX = 10, NB_ESSAIMS_MAX = 4, NB_GRAPPES_MAX = 8;

export function creerVie(THREE, { scene, camera, traces = null, feuillesPick = null, mobile, reduit, partages, sansVrilles = false }) {
  const V3 = THREE.Vector3;
  const alea = hasard(2610);
  const lent = reduit ? 0.62 : 1;        // mouvement réduit : tout ralentit, rien ne s'arrête
  const groupe = new THREE.Group();
  scene.add(groupe);

  /* ---------------------------------------------------------------- outils de cadrage */
  const tmpA = new V3(), tmpB = new V3(), tmpC = new V3();
  const droite = new V3(), hautCam = new V3(), avant = new V3();
  function axesCamera() {
    camera.matrixWorld.extractBasis(droite, hautCam, avant); avant.negate();
  }
  /* un point devant la caméra : x, y en fraction du demi-champ (-1..1), à la distance d */
  function devant(x, y, d, out) {
    axesCamera();
    const th = Math.tan(camera.fov * Math.PI / 360) / (camera.zoom || 1);
    return out.copy(camera.position).addScaledVector(avant, d).addScaledVector(droite, x * th * camera.aspect * d).addScaledVector(hautCam, y * th * d);
  }
  const portrait = () => camera.aspect < 1;
  /* côté de l'écran où vit la vie : à droite sur ordinateur (la colonne de texte est à gauche) */
  const xVie = () => portrait() ? -0.6 + alea() * 1.5 : 0.05 + alea() * 0.95;

  /* ---------------------------------------------------------------- 1. vrilles neuves */
  const nbVrilles = sansVrilles ? 0 : (mobile ? 4 : 7);
  const vrilles = [];
  for (let k = 0; k < nbVrilles; k++) {
    const L = 1.1 + alea() * 0.9;
    const pts = [], s = [];
    const p = new V3(), dir = new V3(1, 0, 0), axe = new V3(0, 0, 1);
    const sens = k % 2 ? 1 : -1, ds = 0.02;
    for (let x = 0; x <= L; x += ds) {
      pts.push(p.clone()); s.push(x);
      const f = x / L;
      const courbure = (0.9 + (f > 0.45 ? Math.pow((f - 0.45) / 0.55, 2) * 19 : 0)) * sens;
      dir.applyAxisAngle(axe, courbure * ds);
      axe.applyAxisAngle(dir, (0.55 + 0.4 * alea()) * ds);
      if (f < 0.4) dir.lerp(new V3(0.2, 0.9, 0.3), 0.01).normalize();
      p.addScaledVector(dir, ds);
    }
    const t = new Tubes(mobile ? 6 : 8);
    t.ajouter(THREE, pts, { rayon: (i) => 0.026 * (1 - 0.8 * (i / (pts.length - 1))) + 0.004, naiss: (i) => s[i], coord: (i) => s[i] * 1.7 + k * 3 });
    const mat = materiauLiane(THREE, { mobile });
    for (const n of ['uTemps', 'uVent', 'uSeve', 'uLumDir', 'uLumCouleur']) mat.userData.uniforms[n] = partages[n];
    mat.userData.uniforms.uTeteInt.value = 4;
    const mesh = new THREE.Mesh(t.geometrie(THREE), mat);
    mesh.frustumCulled = false; mesh.visible = false;
    groupe.add(mesh);
    vrilles.push({ mesh, mat, L, etat: 'attend', t: -alea() * 4 - k * 1.3, duree: 7, base: new V3(), dirBase: new V3() });
  }

  /* ---------------------------------------------------------------- 2. grappes qui éclosent */
  const parGrappe = mobile ? 10 : 16;
  const nbGrappes = Math.min(NB_GRAPPES_MAX, nbVrilles);
  const geoF = new THREE.IcosahedronGeometry(1, mobile ? 1 : 2);
  {
    const pp = geoF.attributes.position;
    for (let i = 0; i < pp.count; i++) {
      const x = pp.getX(i), y = pp.getY(i), z = pp.getZ(i);
      const tt = (y + 1) / 2, r = Math.pow(Math.sin(Math.PI * Math.pow(tt, 0.55)), 0.9);
      pp.setXYZ(i, x * r * (0.55 + 0.45 * tt), y * 1.7, z * r * (0.35 + 0.35 * tt));
    }
    geoF.computeVertexNormals();
  }
  const aGr = new Float32Array(nbGrappes * parGrappe * 4);
  const matF = new THREE.MeshPhysicalMaterial({ color: 0x7c3aed, roughness: 0.42, sheen: 1, sheenColor: new THREE.Color(0xf5d0fe).multiplyScalar(0.6), sheenRoughness: 0.35, envMapIntensity: 0.45 });
  const uF = { uOuv: { value: new Array(NB_GRAPPES_MAX).fill(0) }, uSeve: partages.uSeve, uTemps: partages.uTemps, uVent: partages.uVent };
  greffer(matF, {
    cle: 'fleur-vie', uniforms: uF,
    declVert: GLSL_VENT + `attribute vec4 aGr; uniform float uOuv[${NB_GRAPPES_MAX}]; varying float vO; varying float vH;`,
    vert: [
      ['#include <begin_vertex>', `
        float kzOv = 0.0;
        int kzK = int(aGr.x + 0.5);
        for (int i = 0; i < ${NB_GRAPPES_MAX}; i++) if (i == kzK) kzOv = uOuv[i];
        float kzO = smoothstep(aGr.y * 0.55, aGr.y * 0.55 + 0.45, kzOv);
        vec3 transformed = position * kzO * (1.0 + 0.25 * sin(kzO * 3.14159));
        vO = kzO; vH = position.y;`],
      ['#include <project_vertex>', `
        vec4 mvPosition = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
          mvPosition = instanceMatrix * mvPosition;
          mvPosition.xyz += kzBalance(instanceMatrix[3].xyz);
        #endif
        mvPosition = modelViewMatrix * mvPosition;
        gl_Position = projectionMatrix * mvPosition;`],
    ],
    declFrag: 'uniform vec3 uSeve; uniform float uTemps; varying float vO; varying float vH;',
    frag: [['#include <emissivemap_fragment>', `#include <emissivemap_fragment>
      float kzC = pow(clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0), 2.0);
      totalEmissiveRadiance += mix(uSeve, vec3(0.98, 0.8, 1.0), smoothstep(0.3, 1.2, vH) * 0.5) * (0.25 + 0.9 * kzC) * smoothstep(0.2, 1.0, vO) * (0.85 + 0.15 * sin(uTemps * 1.7 + vH));`]],
  });
  const fleurs = new THREE.InstancedMesh(geoF, matF, nbGrappes * parGrappe);
  fleurs.frustumCulled = false;
  for (let k = 0; k < nbGrappes; k++) for (let j = 0; j < parGrappe; j++) {
    const f = j / (parGrappe - 1);
    aGr.set([k, f, alea(), 0], (k * parGrappe + j) * 4);
  }
  geoF.setAttribute('aGr', new THREE.InstancedBufferAttribute(aGr, 4));
  groupe.add(fleurs);
  const Mf = new THREE.Matrix4(), Qf = new THREE.Quaternion(), Sf = new V3(), upY = new V3(0, 1, 0);
  function placerGrappe(k, base, dir) {
    // une grappe dressée : les fleurs le long d'un petit axe, spiralées, les plus grosses en bas
    const axe = tmpA.copy(dir).lerp(upY, 0.6).normalize();
    for (let j = 0; j < parGrappe; j++) {
      const f = j / (parGrappe - 1);
      const a = j * 2.4 + k;
      const c = tmpB.copy(base).addScaledVector(axe, 0.05 + f * 0.36);
      const sortie = tmpC.set(Math.cos(a), -0.3, Math.sin(a)).normalize();
      const taille = 0.03 * (1.25 - 0.7 * f) * (mobile ? 1.2 : 1);
      Qf.setFromUnitVectors(upY, sortie.clone().multiplyScalar(-1).add(new V3(0, 0.7, 0)).normalize());
      Sf.set(taille, taille, taille);
      Mf.compose(c.addScaledVector(sortie, taille * 1.2), Qf, Sf);
      fleurs.setMatrixAt(k * parGrappe + j, Mf);
    }
    fleurs.instanceMatrix.needsUpdate = true;
  }

  function placerVrille(v, k, enAnneau) {
    const base = v.base, d = v.dirBase;
    if (enAnneau) {
      // sur le bord de l'anneau, côté droit et haut (le bas gauche est la naissance de la liane)
      const a = (alea() * 1.7 - 0.35) * Math.PI;
      base.set(Math.cos(a) * RAYON_ANNEAU * 1.04, Math.sin(a) * RAYON_ANNEAU * 1.04, 0.05);
      d.set(Math.cos(a), Math.sin(a), 0).multiplyScalar(0.8).add(tmpA.set(-Math.sin(a), Math.cos(a), 0).multiplyScalar(alea() < 0.5 ? 0.5 : -0.5)).add(tmpB.set(0, 0, 0.25)).normalize();
    } else {
      // sur la tige, juste devant la caméra, du côté de la lumière
      axesCamera();
      let meilleur = null;
      for (let essai = 0; essai < 14 && !meilleur && traces; essai++) {
        const i = Math.floor(alea() * traces.tige.length);
        const pnt = traces.tige[i].p;
        tmpA.copy(pnt).project(camera);
        const dist = tmpB.copy(pnt).sub(camera.position).dot(avant);
        if (dist > 1.0 && dist < 5.5 && Math.abs(tmpA.x) < 0.95 && Math.abs(tmpA.y) < 0.9 && (portrait() || tmpA.x > -0.15)) meilleur = pnt;
      }
      if (!meilleur) devant(xVie() * 0.8, -0.2 + alea() * 0.5, 2.6 + alea() * 1.5, tmpC), meilleur = tmpC;
      base.copy(meilleur);
      d.copy(droite).multiplyScalar(0.4 + alea() * 0.5).addScaledVector(hautCam, 0.5 + alea() * 0.6).addScaledVector(avant, -0.2 + alea() * 0.3).normalize();
    }
    // repère : x local = la direction de départ ; z local face à la caméra (la spirale se voit de face)
    const x = d.clone();
    const z = tmpA.copy(camera.position).sub(base).normalize();
    z.addScaledVector(x, -z.dot(x)).normalize();
    const y = new V3().crossVectors(z, x).normalize();
    const m = new THREE.Matrix4().makeBasis(x, y, z);
    v.mesh.quaternion.setFromRotationMatrix(m);
    v.mesh.rotateX((alea() - 0.5) * 0.9);
    v.mesh.position.copy(base);
    const ech = enAnneau ? 1.0 + alea() * 0.4 : 0.8 + alea() * 0.4;
    v.mesh.scale.setScalar(ech);
    v.duree = (6.5 + alea() * 3) / lent;
    if (k < nbGrappes) placerGrappe(k, base, d);
  }

  /* ---------------------------------------------------------------- 3. feuilles qui tombent */
  const nbChutes = mobile ? 6 : 12;
  const matC = materiauFeuille(THREE, { mobile, cle: 'feuille-chute' });
  for (const n of ['uTemps', 'uVent', 'uLumDir', 'uLumCouleur', 'uSeve', 'uFTrans']) matC.userData.uniforms[n] = partages[n];
  matC.userData.uniforms.uCroiss.value = 1e5;
  const geoC = (() => {
    const nu = mobile ? 12 : 18, nv = mobile ? 6 : 8;
    const pos = [], nor = [], idx = [];
    for (let i = 0; i <= nu; i++) { const uu = Math.pow(i / nu, 0.92); for (let j = 0; j <= nv; j++) { pos.push(uu, (j / nv) * 2 - 1, 0); nor.push(0, 0, 1); } }
    for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) { const a = i * (nv + 1) + j, b = a + nv + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    g.setIndex(idx);
    return g;
  })();
  const aFA = new Float32Array(nbChutes * 3 * 4), aFB = new Float32Array(nbChutes * 3 * 4);
  const chutesMesh = new THREE.InstancedMesh(geoC, matC, nbChutes * 3);
  chutesMesh.frustumCulled = false;
  const locales = [];
  for (const [ang, cote, s] of [[0, 0, 1], [1.2, 1, 0.86], [-1.2, -1, 0.86]]) {
    const m = new THREE.Matrix4().makeRotationZ(ang);
    m.multiply(new THREE.Matrix4().makeRotationX(cote * 0.12));
    m.multiply(new THREE.Matrix4().makeScale(s, s, s));
    m.setPosition(cote === 0 ? 0.05 : 0, 0, 0);
    locales.push(m);
  }
  const chutes = [];
  for (let k = 0; k < nbChutes; k++) {
    const teinte = 0.35 + alea() * 0.65, lobe = 0.4 + alea() * 0.9, g = alea();
    for (let c = 0; c < 3; c++) {
      const i = k * 3 + c;
      aFA.set([-10, [0, 1, -1][c], lobe * (c === 0 ? 0.8 : 1), (g + i * 0.137) % 1], i * 4);
      aFB.set([-100, 0.8 + alea() * 0.3, teinte, 0.5 + alea() * 0.5], i * 4);
    }
    chutes.push({ pos: new V3(), vit: new V3(), q: new THREE.Quaternion(), axe: new V3(1, 0, 0), w: 0, age: 0, vie: 0, attente: alea() * 5 + k * 0.8, taille: 0, phase: alea() * 6.28, actif: false });
  }
  geoC.setAttribute('aFA', new THREE.InstancedBufferAttribute(aFA, 4));
  geoC.setAttribute('aFB', new THREE.InstancedBufferAttribute(aFB, 4));
  groupe.add(chutesMesh);
  const Mc = new THREE.Matrix4(), Mt = new THREE.Matrix4(), Qr = new THREE.Quaternion(), Vz = new V3();
  const zero = new THREE.Matrix4().makeScale(0, 0, 0);
  for (let i = 0; i < nbChutes * 3; i++) chutesMesh.setMatrixAt(i, zero);

  let enAnneauChute = true;
  function lancerChute(ch) {
    axesCamera();
    let depart = null;
    // la moitié se détache d'une vraie feuille visible de la liane
    if (feuillesPick && feuillesPick.length && alea() < 0.55) {
      for (let essai = 0; essai < 20 && !depart; essai++) {
        const f = feuillesPick[Math.floor(alea() * feuillesPick.length)];
        tmpA.copy(f.centre).project(camera);
        const dist = tmpB.copy(f.centre).sub(camera.position).dot(avant);
        if (dist > 1.2 && dist < 6 && Math.abs(tmpA.x) < 0.9 && tmpA.y > -0.3 && tmpA.y < 0.95 && (portrait() || tmpA.x > -0.1)) depart = f.centre;
      }
    }
    if (depart) ch.pos.copy(depart);
    else devant(xVie(), 1.15 + alea() * 0.15, enAnneauChute ? 4.5 + alea() * 4 : 2.2 + alea() * 3.8, ch.pos);
    ch.vit.copy(droite).multiplyScalar((alea() - 0.3) * 0.12).addScaledVector(avant, -0.05 + alea() * 0.1);
    ch.vit.y -= 0.02;
    ch.q.setFromEuler(new THREE.Euler(alea() * 6.28, alea() * 6.28, alea() * 6.28));
    ch.axe.set(alea() - 0.5, 0.6 + alea() * 0.4, alea() - 0.5).normalize();
    ch.w = (0.6 + alea() * 0.9) * (alea() < 0.5 ? 1 : -1);
    ch.age = 0; ch.vie = (9 + alea() * 6) / lent; ch.taille = (mobile ? 0.36 : 0.3) * (0.75 + alea() * 0.5); ch.actif = true;
  }

  /* ---------------------------------------------------------------- 4. volutes de lumière */
  const nbVol = Math.min(NB_VOLUTES_MAX, mobile ? 5 : 9);
  const SEG = mobile ? 90 : 140;
  const posV = [], attV = [], idxV = [];
  for (let k = 0; k < nbVol; k++) {
    for (let i = 0; i <= SEG; i++) for (const c of [-1, 1]) { posV.push(0, 0, 0); attV.push(i / SEG, c, k, 0); }
    const b = k * (SEG + 1) * 2;
    for (let i = 0; i < SEG; i++) { const a = b + i * 2; idxV.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const geoV = new THREE.BufferGeometry();
  geoV.setAttribute('position', new THREE.Float32BufferAttribute(posV, 3));
  geoV.setAttribute('aV', new THREE.Float32BufferAttribute(attV, 4));
  geoV.setIndex(idxV);
  const uV = {
    uTemps: partages.uTemps, uRes: { value: new THREE.Vector2(1, 1) }, uInt: { value: 0 },
    uC: { value: Array.from({ length: NB_VOLUTES_MAX }, () => new V3()) },
    uE1: { value: Array.from({ length: NB_VOLUTES_MAX }, () => new V3(1, 0, 0)) },
    uE2: { value: Array.from({ length: NB_VOLUTES_MAX }, () => new V3(0, 1, 0)) },
    uP: { value: Array.from({ length: NB_VOLUTES_MAX }, () => new THREE.Vector4(1, 1.5, 0, 0)) },   // rayon, tours, angle de départ, tête (0..1+longueur)
    uCol: { value: Array.from({ length: NB_VOLUTES_MAX }, () => new THREE.Color(0xc084fc)) },
    uLarg: { value: mobile ? 2.2 : 2.6 },
  };
  const matV = new THREE.ShaderMaterial({
    uniforms: uV, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: /* glsl */ `
      #define NV ${NB_VOLUTES_MAX}
      attribute vec4 aV;
      uniform vec3 uC[NV]; uniform vec3 uE1[NV]; uniform vec3 uE2[NV]; uniform vec4 uP[NV]; uniform vec3 uCol[NV];
      uniform vec2 uRes; uniform float uLarg; uniform float uTemps;
      varying float vA; varying float vCote; varying vec3 vCol;
      vec3 courbe(int k, float s) {
        vec4 P = uP[k];
        float th = P.z + s * P.y * 6.2831853;
        float R = P.x * pow(1.0 - 0.82 * s, 1.25);
        vec3 e3 = cross(uE1[k], uE2[k]);
        return uC[k] + R * (cos(th) * uE1[k] + sin(th) * uE2[k]) + e3 * (s - 0.5) * P.x * 0.35;
      }
      void main() {
        int k = int(aV.z + 0.5);
        float s = aV.x;
        float tete = uP[k].w, longueur = 0.42;
        float fen = smoothstep(tete - longueur, tete, s) * step(s, tete);
        vec4 c0 = projectionMatrix * viewMatrix * vec4(courbe(k, s), 1.0);
        vec4 c1 = projectionMatrix * viewMatrix * vec4(courbe(k, min(s + 0.004, 1.0)), 1.0);
        vec2 n0 = c0.xy / c0.w, n1 = c1.xy / c1.w;
        vec2 d = (n1 - n0) * uRes; d = length(d) > 1e-5 ? normalize(d) : vec2(1.0, 0.0);
        vec2 perp = vec2(-d.y, d.x);
        float larg = uLarg * (0.35 + 0.65 * fen) * (1.0 + 1.6 * exp(-pow((s - tete) / 0.012, 2.0)));
        c0.xy += perp * aV.y * larg / uRes * 2.0 * c0.w;
        gl_Position = c0;
        vA = fen * (0.55 + 0.45 * sin(s * 40.0 - uTemps * 3.0 + float(k))) ;
        vA += exp(-pow((s - tete) / 0.015, 2.0)) * 2.5 * step(s, tete + 0.01);
        vCote = aV.y; vCol = mix(uCol[k], vec3(1.0, 0.9, 0.7), exp(-pow((s - tete) / 0.03, 2.0)) * 0.7);
      }`,
    fragmentShader: /* glsl */ `
      uniform float uInt; varying float vA; varying float vCote; varying vec3 vCol;
      void main() { float a = exp(-vCote * vCote * 2.5); gl_FragColor = vec4(vCol * a * vA * uInt, 1.0); }`,
  });
  const volutes = new THREE.Mesh(geoV, matV);
  volutes.frustumCulled = false; volutes.renderOrder = 18;
  groupe.add(volutes);
  const etatVol = Array.from({ length: nbVol }, (_, k) => ({ t: -k * 1.1 - alea() * 2, duree: 6, pause: 0 }));
  const PALETTE_VOL = [0xc084fc, 0xa78bfa, 0xe9c987, 0x7dd3fc, 0xc084fc, 0x6ee7b7, 0xf0abfc, 0xe9c987, 0xa78bfa, 0xc4b5fd];
  function placerVolute(k, enAnneau) {
    const P = uV.uP.value[k], C = uV.uC.value[k], e1 = uV.uE1.value[k], e2 = uV.uE2.value[k];
    axesCamera();
    if (enAnneau) {
      // autour du sceau, comme les tourbillons autour de l'étoile
      const a = alea() * 6.28;
      C.set(Math.cos(a) * 0.5, Math.sin(a) * 0.5, -0.3 - alea() * 0.6);
      P.x = 1.5 + alea() * 1.3;
    } else {
      devant(xVie(), -0.5 + alea() * 1.2, 3.5 + alea() * 5, C);
      P.x = 0.45 + alea() * 0.9;
    }
    // plan de la spirale : face à la caméra, légèrement incliné
    e1.copy(droite).applyAxisAngle(avant, alea() * 6.28);
    e2.crossVectors(tmpA.copy(avant).negate(), e1).normalize();
    e1.applyAxisAngle(e2, (alea() - 0.5) * 0.8); e2.crossVectors(tmpA.copy(avant).negate(), e1).normalize();
    if (alea() < 0.5) e2.negate();
    P.y = 1.1 + alea() * 1.1; P.z = alea() * 6.28; P.w = 0;
    uV.uCol.value[k].set(PALETTE_VOL[(k + Math.floor(alea() * 3)) % PALETTE_VOL.length]);
    etatVol[k].duree = (5.5 + alea() * 3.5) / lent;
  }

  /* ---------------------------------------------------------------- 5. essaims de lucioles */
  const nbEss = Math.min(NB_ESSAIMS_MAX, mobile ? 3 : 4), parEss = mobile ? 70 : 140;
  const nE = nbEss * parEss;
  const posE = new Float32Array(nE * 3), grE = new Float32Array(nE * 4), axE = new Float32Array(nE * 3);
  for (let i = 0; i < nE; i++) {
    const v = new V3(alea() - 0.5, alea() - 0.5, alea() - 0.5).normalize().multiplyScalar(Math.pow(alea(), 0.5));
    posE.set([v.x, v.y, v.z], i * 3);
    const a = new V3(alea() - 0.5, alea() - 0.5, alea() - 0.5).normalize();
    axE.set([a.x, a.y, a.z], i * 3);
    grE.set([Math.floor(i / parEss), alea(), alea(), alea()], i * 4);
  }
  const geoE = new THREE.BufferGeometry();
  geoE.setAttribute('position', new THREE.BufferAttribute(posE, 3));
  geoE.setAttribute('aGr', new THREE.BufferAttribute(grE, 4));
  geoE.setAttribute('aAxe', new THREE.BufferAttribute(axE, 3));
  const uE = {
    uTemps: partages.uTemps, uInt: { value: 0 }, uTaille: { value: 1 },
    uSC: { value: Array.from({ length: NB_ESSAIMS_MAX }, () => new V3()) },
    uSV: { value: Array.from({ length: NB_ESSAIMS_MAX }, () => new V3()) },
    uSR: { value: new Array(NB_ESSAIMS_MAX).fill(0.6) },
    uSCol: { value: Array.from({ length: NB_ESSAIMS_MAX }, () => new THREE.Color(0xc084fc)) },
    uLent: { value: lent },
  };
  const matE = new THREE.ShaderMaterial({
    uniforms: uE, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      #define NS ${NB_ESSAIMS_MAX}
      attribute vec4 aGr; attribute vec3 aAxe;
      uniform float uTemps; uniform float uTaille; uniform vec3 uSC[NS]; uniform vec3 uSV[NS]; uniform float uSR[NS]; uniform vec3 uSCol[NS]; uniform float uLent;
      varying float vA; varying vec3 vCol;
      vec3 tourner(vec3 v, vec3 k, float a) { return v * cos(a) + cross(k, v) * sin(a) + k * dot(k, v) * (1.0 - cos(a)); }
      void main() {
        int k = int(aGr.x + 0.5);
        float t = uTemps * uLent;
        vec3 o = tourner(position, aAxe, t * (0.5 + 1.1 * aGr.y) + aGr.z * 6.28);
        float resp = 0.62 + 0.38 * sin(t * 0.45 + float(k) * 1.7 + aGr.w * 0.6);
        vec3 p = uSC[k] + o * uSR[k] * resp;
        // l'essaim s'étire dans le sens de son vol, comme une nuée
        float sp = length(uSV[k]);
        if (sp > 1e-4) { vec3 dv = uSV[k] / sp; p += dv * dot(o, dv) * uSR[k] * min(sp * 2.0, 1.5) - dv * aGr.w * sp * 0.6; }
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        float d = -mv.z;
        float sc = pow(0.5 + 0.5 * sin(uTemps * (2.0 + aGr.w * 3.0) + aGr.y * 40.0), 2.0);
        vA = (0.35 + 0.65 * sc) * smoothstep(0.6, 1.6, d) * exp(-d * 0.035);
        vCol = mix(uSCol[k], vec3(1.0), 0.2 + 0.3 * aGr.w);
        gl_PointSize = min(uTaille * (2.2 + 3.0 * aGr.z) * (6.0 / max(d, 0.5)), uTaille * 10.0);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uInt; varying float vA; varying vec3 vCol;
      void main() { vec2 q = gl_PointCoord - 0.5; float r = length(q) * 2.0; float a = exp(-r * r * 5.0) + 0.7 * exp(-r * r * 40.0);
        gl_FragColor = vec4(vCol * a * vA * uInt * 1.3, 1.0); }`,
  });
  const essaims = new THREE.Points(geoE, matE);
  essaims.frustumCulled = false; essaims.renderOrder = 16;
  groupe.add(essaims);
  const etatEss = Array.from({ length: nbEss }, (_, k) => ({ c: new V3(), v: new V3(), cible: new V3(), t: 0, prochain: 1 + k * 2.5, pret: false }));
  function cibleEssaim(e, enAnneau) {
    if (enAnneau) { const a = alea() * 6.28, r = 1.6 + alea() * 1.6; e.cible.set(Math.cos(a) * r, Math.sin(a) * r * 0.7, -0.5 - alea() * 1.5); }
    else devant(xVie(), -0.6 + alea() * 1.3, 2.4 + alea() * 4.5, e.cible);
    e.prochain = (7 + alea() * 6) / lent;
  }

  /* ---------------------------------------------------------------- mise à jour */
  let force = 0, actif = false;
  const COULEURS = { seve: new THREE.Color(), luc: new THREE.Color(), or: new THREE.Color(0xe9c987), jade: new THREE.Color(0x6ee7b7) };

  return {
    groupe,
    regler(on) { actif = !!on; },
    get actif() { return actif; },
    dimensionner(l, h, dpr) {
      uV.uRes.value.set(l * dpr, h * dpr);
      uV.uLarg.value = (mobile ? 2.4 : 3.0) * dpr;
      uE.uTaille.value = dpr * (l < 700 ? 1.15 : 1) * Math.min(1.4, h / 800);
    },
    /* ctx : { dt, temps, ouv (0..1 : l'ouverture est finie), p (défilement lissé), A (ambiance) } */
    maj({ dt, ouv, p, A, croissPret }) {
      const cible = actif ? ouv : 0;
      force += (cible - force) * (1 - Math.exp(-dt * (cible > force ? 0.7 : 2.5)));
      groupe.visible = force > 0.003;
      if (!groupe.visible) return;
      const enAnneau = p < 0.035;
      enAnneauChute = enAnneau;
      camera.updateMatrixWorld();
      COULEURS.seve.copy(A.seve); COULEURS.luc.copy(A.lucioles);

      // vrilles et grappes
      vrilles.forEach((v, k) => {
        v.t += dt;
        const u = v.mat.userData.uniforms;
        u.uSeveInt.value = A.seveInt * 1.1; u.uLueurJade.value = A.jadeLueur * 2.5;
        if (v.etat === 'attend') {
          v.mesh.visible = false;
          if (k < nbGrappes) uF.uOuv.value[k] = 0;
          if (v.t > 0 && croissPret) { placerVrille(v, k, enAnneau); v.etat = 'pousse'; v.t = 0; v.mesh.visible = true; }
          return;
        }
        const x = v.t / v.duree;
        if (x < 0.55) { u.uCroiss.value = sortieCubique(x / 0.55) * (v.L + 0.8); u.uEpais.value = 1; }
        else if (x < 0.82) { u.uCroiss.value = v.L + 0.8; u.uEpais.value = 1; }
        else { u.uEpais.value = 1 - lisse(0.82, 1, x); }
        u.uTeteInt.value = 4 * (1 - lisse(0.5, 0.7, x)) + 1.2 * Math.exp(-Math.pow((x - 0.86) / 0.05, 2));
        u.uEpais.value *= force;
        if (k < nbGrappes) uF.uOuv.value[k] = lisse(0.25, 0.7, x) * (1 - lisse(0.8, 0.98, x)) * force;
        if (x >= 1) { v.etat = 'attend'; v.t = -(0.6 + alea() * 2.2) / lent; v.mesh.visible = false; }
      });

      // feuilles qui tombent
      axesCamera();
      chutes.forEach((ch, k) => {
        if (!ch.actif) {
          ch.attente -= dt;
          if (ch.attente <= 0 && croissPret) lancerChute(ch); else { for (let c = 0; c < 3; c++) chutesMesh.setMatrixAt(k * 3 + c, zero); return; }
        }
        ch.age += dt;
        const t = ch.age;
        const chute = 0.16 + 0.05 * Math.sin(ch.phase);
        ch.vit.y += (-chute - ch.vit.y) * (1 - Math.exp(-dt * 0.8));
        const flotte = Math.sin(t * 1.25 * lent + ch.phase);
        ch.pos.addScaledVector(ch.vit, dt * lent);
        ch.pos.addScaledVector(droite, flotte * 0.11 * dt * lent);
        Qr.setFromAxisAngle(ch.axe, ch.w * dt * lent);
        ch.q.premultiply(Qr);
        const balance = Math.sin(t * 1.25 * lent + ch.phase + 0.8) * 0.5;
        const s = ch.taille * lisse(0, 0.8, t) * (1 - lisse(ch.vie - 1.2, ch.vie, t)) * force;
        Mc.compose(ch.pos, ch.q, Sf.set(s, s, s));
        Mc.multiply(Mt.makeRotationX(balance));
        for (let c = 0; c < 3; c++) chutesMesh.setMatrixAt(k * 3 + c, Mt.copy(Mc).multiply(locales[c]));
        tmpA.copy(ch.pos).project(camera);
        if (t > ch.vie || tmpA.y < -1.3) { ch.actif = false; ch.attente = (1 + alea() * 4) / lent; }
      });
      chutesMesh.instanceMatrix.needsUpdate = true;

      // volutes
      uV.uInt.value = force * (reduit ? 0.8 : 1) * (0.7 + 0.3 * A.luciolesInt) * 1.35;
      etatVol.forEach((e, k) => {
        e.t += dt;
        const P = uV.uP.value[k];
        if (e.t < 0) { P.w = -1; return; }
        if (P.w < 0 || e.t > e.duree) { if (!croissPret) return; placerVolute(k, enAnneau); e.t = 0; }
        const x = e.t / e.duree;
        P.w = sortieCubique(Math.min(1, x / 0.8)) * 1.45;                // la tête parcourt la spirale, la traîne la suit et s'éteint
        P.z += dt * 0.12 * lent;
      });

      // essaims
      uE.uInt.value = force * A.luciolesInt * (reduit ? 0.8 : 1);
      etatEss.forEach((e, k) => {
        if (!e.pret) { cibleEssaim(e, enAnneau); e.c.copy(e.cible); e.pret = true; }
        e.t += dt; e.prochain -= dt;
        tmpA.copy(e.c).project(camera);
        const hors = Math.abs(tmpA.x) > 1.3 || Math.abs(tmpA.y) > 1.3 || tmpA.z > 1;
        if (e.prochain <= 0 || (hors && e.prochain > 2)) cibleEssaim(e, enAnneau);
        // vol amorti vers la cible, avec une boucle de Lissajous
        const ax = tmpB.subVectors(e.cible, e.c).multiplyScalar(0.55 * lent);
        ax.addScaledVector(droite, Math.sin(e.t * 0.7 + k) * 0.18 * lent).addScaledVector(hautCam, Math.cos(e.t * 0.53 + k * 2) * 0.14 * lent);
        e.v.lerp(ax, 1 - Math.exp(-dt * 1.2));
        e.c.addScaledVector(e.v, dt);
        uE.uSC.value[k].copy(e.c); uE.uSV.value[k].copy(e.v);
        uE.uSR.value[k] = (enAnneau ? 0.7 : 0.45) * (0.85 + 0.3 * Math.sin(e.t * 0.3 + k));
        const col = uE.uSCol.value[k];
        col.copy(k % 3 === 0 ? COULEURS.luc : k % 3 === 1 ? COULEURS.seve : COULEURS.or).lerp(COULEURS.luc, 0.3);
      });
    },
    detruire() {
      groupe.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
      scene.remove(groupe);
    },
  };
}
