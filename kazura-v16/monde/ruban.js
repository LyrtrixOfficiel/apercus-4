/* Kazura v13, la Scène : le ruban holographique (la liane du monde clair).
   Il naît sur l'anneau du sceau, dont il devient une branche (l'arc gauche de l'anneau, à plat sur sa
   face), puis s'en échappe par le bas droit, là où partait la liane, et descend en serpentant :
   c'est le chemin des six moments du déroulé, marqués par des bourgeons de feuilles.
   Matière : irisation qui coule (rose, cyan, vert, violet, un peu de jaune), paillettes, grain. */
import { GLSL_MASQUE, GLSL_IRIS } from './glsl.js';
import { RAYON_SCEAU, ANGLE_SORTIE } from './liane.js';
import { construireFeuilles } from './feuilles.js';

const RM = RAYON_SCEAU * 45 / 48;   // ligne médiane de l'anneau
const LARG = RAYON_SCEAU * 6 / 48;  // largeur de l'anneau

export function creerRuban(THREE, { mobile, U, lumiere, portrait }) {
  const borne = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lisse = (a, b, x) => { const t = borne((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  const V3 = THREE.Vector3;
  const groupe = new THREE.Group();
  const u = { uDebut: { value: 0 }, uFin: { value: 0 }, uTemps: { value: 0 }, uVis: { value: 1 }, uSAnneau: { value: 0 }, uOndule: { value: 1 }, ...U };
  const m = new THREE.ShaderMaterial({
    uniforms: u, side: THREE.DoubleSide,
    vertexShader: /* glsl */ `precision highp float;
      
      attribute vec2 aR; varying vec2 vR; varying vec3 vN; varying vec3 vV;
      uniform float uTemps; uniform float uSAnneau; uniform float uOndule;
      void main() {
        vR = aR;
        // v14 : hors de l'anneau, la liane danse (une onde qui court le long du ruban)
        float k = smoothstep(uSAnneau, uSAnneau + 1.5, aR.x) * uOndule;
        vec3 p = position + vec3(sin(aR.x * 0.9 - uTemps * 1.1) * 0.16, 0.0, sin(aR.x * 1.3 - uTemps * 1.5 + 1.0) * 0.22) * k;
        vec4 mv = modelViewMatrix * vec4(p, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `precision highp float;
      
      ${GLSL_MASQUE}
      ${GLSL_IRIS}
      uniform float uDebut; uniform float uFin; uniform float uTemps; uniform float uVis;
      varying vec2 vR; varying vec3 vN; varying vec3 vV;
      void main() {
        if (vR.x < uDebut || vR.x > uFin || uVis < 0.01) discard;
        if (kzClair(gl_FragCoord.xy) < 0.5) discard;
        vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n;
        float fr = 1.0 - abs(dot(n, normalize(vV)));
        float onde = kzNm(vec2(vR.x * 1.3 - uTemps * 0.35, vR.y * 2.0)) * 0.7 + kzNm(vec2(vR.x * 4.0 + uTemps * 0.2, vR.y * 5.0)) * 0.3;
        float ph = vR.x * 0.16 - uTemps * 0.09 + vR.y * 0.22 + onde * 0.55 + fr * 0.6;
        // v16 : le ruban holographique d'ALCHE (VISION) : des couleurs d'écran franches (kzEcran), un filet sombre qui
        // coule dans l'irisation, des paillettes ; il se détache net sur le blanc
        // LISIBLE sous les textes de la page : sur le blanc, des couleurs claires (l'encre foncée y garde 4,5:1 et plus) ;
        // dans le violet, des couleurs profondes (l'encre claire y garde son contraste), un liseré lumineux sur la tranche
        float bl = kzBlancEn(gl_FragCoord.xy / kzRes);
        vec3 c = kzHolo(ph);
        float filet = fract(ph * 1.7 + onde * 0.4);
        c = mix(c, mix(vec3(0.25, 0.1, 0.5), vec3(0.62, 0.55, 1.0), bl), smoothstep(0.44, 0.5, filet) * smoothstep(0.6, 0.5, filet) * 0.4);
        float l = 0.72 + 0.32 * clamp(dot(n, normalize(vec3(-0.3, 0.6, 0.8))), 0.0, 1.0) + pow(fr, 3.0) * 0.3;
        float bordR = smoothstep(0.0, 0.12, 0.5 - abs(vR.y - 0.5));
        c = clamp(c * l * (0.8 + 0.2 * bordR), 0.0, 1.0);
        float pa = kzHm(floor(gl_FragCoord.xy * 0.5) + floor(uTemps * 8.0));
        c = mix(c, vec3(1.0), step(0.985, pa) * 0.6);
        c *= 0.92 + 0.1 * kzHm(gl_FragCoord.xy + fract(uTemps) * 13.0);
        // la tête qui pousse s'amincit et luit
        float tete = smoothstep(uFin - 0.25, uFin, vR.x);
        c = mix(c, vec3(1.0), tete * 0.3);
        c = mix(c * 0.5 + vec3(0.03, 0.0, 0.08), mix(c, vec3(1.0), 0.3), bl);
        c += vec3(0.85, 0.75, 1.0) * pow(fr, 4.0) * 0.5 * (1.0 - bl);
        c = kzEcran(c);
        if (abs(vR.y - 0.5) > (0.5 - tete * 0.45) * smoothstep(0.0, 0.5, vR.x)) discard;
        gl_FragColor = vec4(c, 1.0);
      }`,
  });

  /* le tracé : l'arc de l'anneau, puis la descente */
  const pts = [], ws = [];
  const a0 = 2.35, a1 = ANGLE_SORTIE;      // de haut gauche, sens horaire, jusqu'au bas droit
  const nArc = mobile ? 70 : 120;
  for (let i = 0; i <= nArc; i++) {
    const a = a0 + (a1 - a0) * (i / nArc);
    pts.push(new V3(Math.cos(a) * RM, Math.sin(a) * RM, 0.135));
    ws.push(0);
  }
  const sortie = pts[pts.length - 1].clone();
  const amp = portrait ? 0.62 : 1.25;
  const ctrl = [sortie.clone(), sortie.clone().add(new V3(-0.42, -0.35, 0.12))];
  const NOEUDS_Y = [];
  for (let k = 1; k <= 7; k++) {
    const y = -1.4 - k * 3.7;
    ctrl.push(new V3((k % 2 ? -1 : 1) * amp * (0.75 + 0.25 * Math.sin(k * 1.7)), y, 0.25 * Math.sin(k)));
  }
  const courbe = new THREE.CatmullRomCurve3(ctrl, false, 'centripetal');
  const nDesc = mobile ? 420 : 700;
  const desc = courbe.getSpacedPoints(nDesc);
  for (let i = 1; i < desc.length; i++) { pts.push(desc[i]); ws.push(Math.min(1, i / 40)); }

  // abscisse curviligne, repères, bande
  const s = [0];
  for (let i = 1; i < pts.length; i++) s.push(s[i - 1] + pts[i].distanceTo(pts[i - 1]));
  const sAnneau = s[nArc];
  const pos = [], nor = [], aR = [], idx = [];
  const Z = new V3(0, 0, 1);
  for (let i = 0; i < pts.length; i++) {
    const T = new V3().subVectors(pts[Math.min(pts.length - 1, i + 1)], pts[Math.max(0, i - 1)]).normalize();
    const N0 = new V3().crossVectors(Z, T).normalize();
    const tw = ws[i] * Math.sin((s[i] - sAnneau) * 0.42) * 1.15;
    const W = N0.clone().multiplyScalar(Math.cos(tw)).addScaledVector(Z, Math.sin(tw));
    const Nn = new V3().crossVectors(T, W).normalize();
    // v16 : la descente est un large ruban plat (réf. ALCHE), l'arc sur l'anneau garde la largeur de l'anneau
    const w = LARG * (0.82 + (portrait ? 0.2 : 0.55) * ws[i]);
    for (const c of [-1, 1]) {
      const p = pts[i].clone().addScaledVector(W, c * w);
      pos.push(p.x, p.y, p.z); nor.push(Nn.x, Nn.y, Nn.z); aR.push(s[i], c < 0 ? 0 : 1);
    }
    if (i < pts.length - 1) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('aR', new THREE.Float32BufferAttribute(aR, 2));
  g.setIndex(idx);
  const mesh = new THREE.Mesh(g, m);
  mesh.frustumCulled = false;
  mesh.renderOrder = 3;
  groupe.add(mesh);

  // les six moments : un nœud tous les 3,7 en descendant, chacun avec un bourgeon de feuilles
  const sTotal = s[s.length - 1];
  const yDeS = (x) => { let i = 1; while (i < s.length - 1 && s[i] < x) i++; return pts[i].y; };
  const posDeS = (x, out) => { let i = 1; while (i < s.length - 1 && s[i] < x) i++; return out.copy(pts[i]); };
  const sDeY = (y) => { let i = nArc; while (i < s.length - 1 && pts[i].y > y) i++; return s[i]; };
  const noeuds = [];
  for (let k = 1; k <= 6; k++) {
    const y = -1.4 - k * 3.7 + 1.2;
    const sk = sDeY(y);
    let i = 0; while (i < s.length - 1 && s[i] < sk) i++;
    noeuds.push({ s: sk, p: pts[i].clone(), y: pts[i].y });
  }
  const attaches = [];
  noeuds.forEach((n, k) => {
    for (let j = 0; j < 2; j++) {
      const cote = (k + j) % 2 ? 1 : -1;
      attaches.push({ p: n.p.clone(), dir: new V3(cote, 0.45, 0.6).normalize(), naiss: n.s + 0.2 + j * 0.25, taille: 0.55 + 0.12 * j });
    }
  });
  const feuilles = construireFeuilles(THREE, attaches, { mobile, lumiere });
  groupe.add(feuilles.mesh);

  // chaque moment est marqué d'un cercle fin et d'un point, comme un repère sur un plan
  const matMarque = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.1, 0.12, 0.15), side: THREE.DoubleSide });
  const gAnneau = new THREE.RingGeometry(0.2, 0.214, 64), gPoint = new THREE.CircleGeometry(0.036, 24);
  const marques = noeuds.map((n) => {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(gAnneau, matMarque), new THREE.Mesh(gPoint, matMarque));
    g.position.copy(n.p).add(new V3(0, 0, 0.03));
    g.scale.setScalar(0.0001);
    groupe.add(g);
    return { g, s: n.s };
  });
  const majMarques = (fin) => {
    for (const mq of marques) {
      const k = Math.min(1, Math.max(0, (fin - mq.s) / 0.5));
      const e = k * k * (3 - 2 * k);
      mq.g.scale.setScalar(Math.max(0.0001, e * (1 + 0.25 * (1 - e))));
      mq.g.visible = e > 0.001;
    }
  };

  u.uSAnneau.value = sAnneau;
  feuilles.mesh.visible = false;
  const tmpV = new V3();
  /* une image : le ruban se forme sur l'anneau quand le clair arrive, puis descend avec le déroulé */
  function maj(s, dt, temps, pivot, out) {
    const sDesc = borne((s - 5.02) / 0.86);
    const fin = sAnneau * lisse(4.02, 4.5, s) + (sTotal - sAnneau) * sDesc * (s < 6.3 ? 1 : 0);
    u.uFin.value = Math.max(0.0001, fin);
    u.uDebut.value = 0;
    let teteY = 0;
    pivot.updateMatrixWorld(true);
    pivot.localToWorld(posDeS(Math.max(fin, 0.001), out));
    teteY = out.y;
    majMarques(s > 4.8 && s < 6.05 ? fin : 0);
    return { teteY, fin };
  }
  /* position d'un des six moments, dans le monde */
  function noeudMonde(k, pivot, out) { return pivot.localToWorld(out.copy(noeuds[k].p)); }
  return {
    groupe, u, feuilles, sAnneau, sTotal, noeuds, yDeS, sDeY, posDeS, majMarques, maj, noeudMonde, verreVisible: false,
  };
}
