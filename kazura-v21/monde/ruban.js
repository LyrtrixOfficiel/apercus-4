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
  const u = { uDebut: { value: 0 }, uFin: { value: 0 }, uTemps: { value: 0 }, uVis: { value: 1 }, uSAnneau: { value: 0 }, uOndule: { value: 1 }, uNaissance: { value: 0 },
    // v20 : la torsion qui court le long du ruban avec le défilement (0 dans le violet : la v19 exacte), son ampleur sur
    // le blanc, le reflet qui glisse, l'éclat quand la coulée s'y est rangée, la lenteur (mouvement réduit), l'ombre
    uTord: { value: 0 }, uTordA: { value: 1.15 }, uRetourne: { value: 0 }, uGlisse: { value: 0 }, uEclat: { value: 0 }, uEclatX: { value: 0 }, uLent: { value: 1 }, uOmbre: { value: 0 },
    ...U };
  /* v20 : la torsion est calculée ici (et non plus figée dans la géométrie) : elle court le long du ruban quand on
     défile, les reflets glissent et l'envers se montre dans les torsions. Avec uTord = 0 et uTordA = 1,15 : la v19. */
  const SOMMET_TORSION = /* glsl */ `
      attribute vec2 aR; attribute vec3 aN0; attribute vec3 aT; attribute vec2 aW;
      uniform float uTemps; uniform float uSAnneau; uniform float uOndule; uniform float uTord; uniform float uTordA; uniform float uRetourne;
      vec3 kzTorsion(float elargir, out vec3 nrm, out vec3 trv, out float env) {
        float tw = aW.y * sin((aR.x - uSAnneau) * 0.42 - uTord) * uTordA;
        // v20 : sur le blanc, une vague de roulis qui glisse le long du ruban avec le défilement : la lame se couche et
        // laisse voir son envers, en douceur. La torsion est bornée en douceur (A th(t / A), A = 1,2 rad) : la lame garde
        // toujours au moins 35 % de sa largeur visible (jamais de profil, jamais de nœud pincé). Dans le violet
        // (uRetourne = 0) : la torsion de la v19, sans borne.
        float u9 = fract((aR.x - uSAnneau) / 9.0 + uTord * 0.045);
        float roulis = sin(3.14159265 * smoothstep(0.18, 0.76, u9));
        roulis *= roulis;
        tw += 1.7 * roulis * aW.y * uRetourne;
        float tb = clamp(tw / 1.2, -8.0, 8.0);
        float e2 = exp(2.0 * tb);
        tw = mix(tw, 1.2 * (e2 - 1.0) / (e2 + 1.0), uRetourne);
        env = smoothstep(0.45, 0.95, roulis) * aW.y * uRetourne;
        vec3 W = aN0 * cos(tw) + vec3(0.0, 0.0, 1.0) * sin(tw);
        nrm = normalize(cross(aT, W)); trv = W;
        vec3 p = position + W * aW.x * elargir;
        // v14 : hors de l'anneau, la liane danse (une onde qui court le long du ruban)
        float k = smoothstep(uSAnneau, uSAnneau + 1.5, aR.x) * uOndule;
        return p + vec3(sin(aR.x * 0.9 - uTemps * 1.1) * 0.16, 0.0, sin(aR.x * 1.3 - uTemps * 1.5 + 1.0) * 0.22) * k;
      }`;
  const m = new THREE.ShaderMaterial({
    uniforms: u, side: THREE.DoubleSide, transparent: true,   // v17 : bords lissés (net à toute densité de pixels)
    vertexShader: /* glsl */ `precision highp float;
      ${SOMMET_TORSION}
      varying vec2 vR; varying vec3 vN; varying vec3 vV; varying vec3 vW; varying float vEnv;
      void main() {
        vR = aR;
        vec3 nrm, trv;
        vec3 p = kzTorsion(1.0, nrm, trv, vEnv);
        vec4 mv = modelViewMatrix * vec4(p, 1.0); vN = normalize(normalMatrix * nrm); vW = normalize(normalMatrix * trv); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `precision highp float;

      ${GLSL_MASQUE}
      ${GLSL_IRIS}
      uniform float uDebut; uniform float uFin; uniform float uTemps; uniform float uVis; uniform float uSAnneau; uniform float uNaissance;
      uniform float uTord; uniform float uGlisse; uniform float uEclat; uniform float uEclatX; uniform float uLent;
      varying vec2 vR; varying vec3 vN; varying vec3 vV; varying vec3 vW; varying float vEnv;
      /* v20 : LE RUBAN SUR LE BLANC (réf. VISION d'ALCHE) : une lame de métal irisé. Des bandes de couleur nettes et
         franches qui coulent le long du ruban, un film mince (la couleur tourne avec l'angle de vue), le reflet d'un
         studio (une grande boîte à lumière et deux reflets nets) qui glisse quand la torsion court avec le défilement,
         l'envers plus profond (il se montre dans les torsions), des plis sombres quand la lame se présente de profil,
         un liseré de lumière sur les arêtes. Luminance tenue au-dessus d'un plancher : l'encre foncée de la page reste
         lisible par-dessus. */
      vec3 lame(vec3 n, vec3 v, float dos, float onde, float tete, out vec3 vive) {
        float y = vR.y - 0.5;
        // la lame est légèrement bombée en travers : la lumière court le long d'elle en un reflet allongé
        n = normalize(n + normalize(vW) * y * 1.5);
        float ndv = abs(dot(n, v));
        // les bandes : une phase qui coule, des transitions nettes (cinq paliers adoucis) ; l'envers montre les teintes
        // complémentaires
        float ph = vR.x * 0.13 - uTemps * 0.035 * uLent + y * 0.42 + onde * 0.1 + (1.0 - ndv) * 0.32 + dos * 0.43 + uTord * 0.035;
        float b5 = ph * 5.0;
        float bande = mix(ph, (floor(b5) + smoothstep(0.3, 0.7, fract(b5))) / 5.0, 0.65);
        vec3 base = kzHolo(bande);
        // le film mince : un reflet coloré qui tourne avec l'angle de vue (trois longueurs d'onde), sur la lumière
        float epf = 1.15 + 0.35 * sin(vR.x * 0.37 - uTemps * 0.12 * uLent + onde * 2.2);
        vec3 film = 0.5 + 0.5 * cos(6.2831853 * (vec3(0.0, 0.31, 0.62) + 2.0 * epf * (0.55 + 0.45 * ndv)));
        vive = base;
        // le métal : le reflet d'un studio (ciel clair en haut, une boîte à lumière, sol plus sombre) ; la couleur garde
        // sa saturation (on module sa luminosité, on ne la grise jamais)
        vec3 r = reflect(-v, n);
        float ciel = smoothstep(-0.7, 0.8, r.y);
        float boite = exp(-kzC2((r.y - 0.45) / 0.14)) * smoothstep(-0.3, 0.4, r.z);
        vec3 c = base * (0.78 + 0.32 * ciel);
        c = mix(c, film, boite * 0.35);
        c += mix(base, vec3(1.0), 0.7) * boite * 0.3;
        // l'envers : plus profond
        c *= 1.0 - 0.18 * dos;
        // les plis : de profil, la lame s'assombrit dans sa propre teinte (le relief d'ALCHE)
        float pli = smoothstep(0.4, 0.05, ndv);
        c *= 1.0 - 0.5 * pli;
        // les reflets nets : deux lumières (haut gauche, droite), qui glissent quand la torsion court
        // (la lame bombée : le reflet net court le long d'elle comme sur un métal brossé)
        vec3 h1 = normalize(normalize(vec3(-0.55, 0.4, 0.75)) + v), h2 = normalize(normalize(vec3(0.75, 0.2, 0.65)) + v);
        float sp1 = pow(max(dot(n, h1), 0.0), 110.0), sh1 = pow(max(dot(n, h1), 0.0), 9.0);
        float sp2 = pow(max(dot(n, h2), 0.0), 40.0);
        c += vec3(1.0) * sp1 * 1.15 + mix(base, vec3(1.0), 0.45) * (sh1 * 0.22 + sp2 * 0.4);
        // le reflet qui glisse le long du ruban avec le défilement : une traînée de lumière fine, en biais
        float gx = fract(vR.x * 0.06 - uGlisse + y * 0.035) - 0.5;
        float glisse = exp(-kzC2(gx / 0.012)) + 0.35 * exp(-kzC2((gx - 0.03) / 0.008));
        c = mix(c, vec3(1.0), clamp(glisse, 0.0, 1.0) * (0.55 + 0.45 * ndv) * 0.8);
        // les arêtes : un liseré clair, et juste dedans un filet plus sombre (l'épaisseur de la lame)
        float e = abs(y) * 2.0;
        float lisere = smoothstep(0.8, 0.97, e);
        float filet = smoothstep(0.6, 0.76, e) * (1.0 - smoothstep(0.8, 0.9, e));
        c *= 1.0 - 0.28 * filet;
        c = mix(c, vec3(1.0), lisere * 0.5);
        // l'éclat : quand la coulée s'est rangée dedans, une onde de lumière parcourt le ruban de la queue à la tête
        // (sans grossir la tête ni les endroits où la lame se couche)
        float ec = uEclat * exp(-kzC2((vR.x - uEclatX) / 0.9)) * (1.0 - 0.75 * tete) * (0.35 + 0.65 * ndv);
        c = mix(c, mix(base * 1.25, vec3(1.0), 0.55), clamp(ec, 0.0, 1.0) * 0.85);
        // la tête qui pousse luit
        c = mix(c, vec3(1.0), tete * 0.3);
        return c;
      }
      void main() {
        if (vR.x < uDebut || vR.x > uFin || uVis < 0.01) discard;
        if (kzClair(gl_FragCoord.xy) < 0.5) discard;
        // v18 : au téléphone, la queue du ruban se retire de l'anneau jusqu'au bord droit pendant que la vague se range
        // (uNaissance de 0 à sa valeur) : le ruban ne passe jamais sur les textes ; sa queue reste une pointe de pinceau
        if (vR.x < uNaissance - 1.1) discard;
        vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n;
        float fr = 1.0 - abs(dot(n, normalize(vV)));
        float onde = kzNm(vec2(vR.x * 1.3 - uTemps * 0.35, vR.y * 2.0)) * 0.7 + kzNm(vec2(vR.x * 4.0 + uTemps * 0.2, vR.y * 5.0)) * 0.3;
        float bl = kzBlancEn(gl_FragCoord.xy / kzRes);
        float tete = smoothstep(uFin - 0.25, uFin, vR.x);
        vec3 c;
        if (bl < 0.5) {
          // le violet : le ruban de la v19, inchangé (couleurs profondes : l'encre claire de la page reste lisible)
          float ph = vR.x * 0.16 - uTemps * 0.09 + vR.y * 0.22 + onde * 0.55 + fr * 0.6;
          c = kzHolo(ph);
          float filet = fract(ph * 1.7 + onde * 0.4);
          c = mix(c, vec3(0.25, 0.1, 0.5), smoothstep(0.44, 0.5, filet) * smoothstep(0.6, 0.5, filet) * 0.4);
          float l = 0.72 + 0.32 * clamp(dot(n, normalize(vec3(-0.3, 0.6, 0.8))), 0.0, 1.0) + pow(fr, 3.0) * 0.3;
          float bordR = smoothstep(0.0, 0.12, 0.5 - abs(vR.y - 0.5));
          c = clamp(c * l * (0.8 + 0.2 * bordR), 0.0, 1.0);
          float pa = kzHm(floor(gl_FragCoord.xy * 0.5) + floor(uTemps * 8.0));
          c = mix(c, vec3(1.0), step(0.985, pa) * 0.6);
          c *= 1.0 - (0.08 - 0.1 * kzHm(gl_FragCoord.xy + fract(uTemps) * 13.0));
          c = mix(c, vec3(1.0), tete * 0.3);
          c = c * 0.5 + vec3(0.03, 0.0, 0.08);
          c += vec3(0.85, 0.75, 1.0) * pow(fr, 4.0) * 0.5;
        } else {
          vec3 vive;
          c = clamp(lame(n, normalize(vV), max(gl_FrontFacing ? 0.0 : 1.0, vEnv), onde, tete, vive), 0.0, 1.0);
          // le plancher de luminance (l'encre foncée de la page garde 4,5:1 par-dessus) : une teinte trop sombre remonte
          // vers sa propre couleur vive éclaircie (elle reste saturée), puis vers le blanc s'il le faut
          vec3 cl = pow(c, vec3(2.2));
          float Lc = dot(cl, vec3(0.2126, 0.7152, 0.0722));
          vec3 cv = pow(mix(vive, vec3(1.0), 0.3), vec3(2.2));
          float Lv = dot(cv, vec3(0.2126, 0.7152, 0.0722));
          cl = mix(cl, cv, clamp((PLANCHER - Lc) / max(Lv - Lc, 1e-3), 0.0, 1.0) * step(Lc, PLANCHER));
          Lc = dot(cl, vec3(0.2126, 0.7152, 0.0722));
          cl = mix(cl, vec3(1.0), clamp((PLANCHER - Lc) / (1.0 - Lc), 0.0, 1.0));
          c = pow(cl, vec3(1.0 / 2.2));
        }
        c = kzEcran(c);
        // les bords : anticrénelés (la largeur d'un pixel en unités du ruban)
        float lim = (0.5 - tete * 0.45) * smoothstep(0.0, 0.5, vR.x) * smoothstep(uNaissance - 1.1, uNaissance, vR.x);
        float al = clamp((lim - abs(vR.y - 0.5)) / max(fwidth(vR.y), 1e-4) + 0.5, 0.0, 1.0);
        if (al < 0.01) discard;
        gl_FragColor = vec4(c, al);
      }`.replace(/PLANCHER/g, portrait ? '0.34' : '0.3'),
  });
  /* v20 : l'ombre douce du ruban sur la feuille blanche (la même lame, plus large, décalée vers le bas et la droite,
     floue) : la profondeur. Seulement sur le blanc, jamais dans le violet ni sur la coulée. */
  const mOmbre = new THREE.ShaderMaterial({
    uniforms: u, side: THREE.DoubleSide, transparent: true, depthWrite: false,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.ZeroFactor, blendDst: THREE.SrcColorFactor,
    vertexShader: /* glsl */ `precision highp float;
      ${SOMMET_TORSION}
      varying vec2 vR;
      void main() {
        vR = aR;
        vec3 nrm, trv; float env;
        vec3 p = kzTorsion(1.9, nrm, trv, env) + vec3(0.2, -0.32, -0.5);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: /* glsl */ `precision highp float;
      ${GLSL_MASQUE}
      uniform float uDebut; uniform float uFin; uniform float uNaissance; uniform float uOmbre; uniform float uSAnneau;
      varying vec2 vR;
      void main() {
        if (uOmbre < 0.001 || vR.x < uDebut || vR.x > uFin) discard;
        if (kzClair(gl_FragCoord.xy) < 0.5) discard;
        vec2 uv = gl_FragCoord.xy / kzRes;
        if (kzBlanc < 1.0) { vec2 vg = kzVague(uv); if (abs(vg.x) < vg.y || kzBlanc < 0.5) discard; }
        float y = (vR.y - 0.5) * 2.0;
        float a = exp(-y * y * 2.6) * smoothstep(0.0, 1.2, vR.x - max(uDebut, uNaissance - 1.1)) * smoothstep(0.0, 0.9, uFin - vR.x);
        a *= smoothstep(uSAnneau, uSAnneau + 1.0, vR.x);
        // une ombre qui multiplie le blanc (fond * couleur) : bleutée, douce
        gl_FragColor = vec4(mix(vec3(1.0), vec3(0.36, 0.42, 0.6), clamp(a * 0.7 * uOmbre, 0.0, 1.0)), 1.0);
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
  // v17 : au téléphone, les textes prennent toute la largeur : le ruban file le long du bord droit (à moitié hors
  // de l'écran), à l'écart des textes ; à l'ordinateur, il serpente comme en v16
  const ctrl = [sortie.clone(), sortie.clone().add(portrait ? new V3(0.6, -0.75, 0) : new V3(-0.42, -0.35, 0.12))];
  const NOEUDS_Y = [];
  for (let k = 1; k <= 7; k++) {
    const y = -1.4 - k * 3.7;
    // v18 : à l'ordinateur, il serpente dans la colonne de gauche (sous le grand mot en italique), jamais sur les
    // textes des moments (au centre) ni sur les cartes (à droite)
    ctrl.push(portrait ? new V3(1.98 + 0.04 * Math.sin(k * 1.7), y, 0) : new V3(-2.05 + (k % 2 ? -1 : 1) * 0.62 * (0.75 + 0.25 * Math.sin(k * 1.7)), y, 0.25 * Math.sin(k)));
  }
  const courbe = new THREE.CatmullRomCurve3(ctrl, false, 'centripetal');
  const nDesc = mobile ? 420 : 700;
  const desc = courbe.getSpacedPoints(nDesc);
  for (let i = 1; i < desc.length; i++) { pts.push(desc[i]); ws.push(Math.min(1, i / 40)); }

  // abscisse curviligne, repères, bande
  const s = [0];
  for (let i = 1; i < pts.length; i++) s.push(s[i - 1] + pts[i].distanceTo(pts[i - 1]));
  const sAnneau = s[nArc];
  // v20 : la torsion se calcule dans le nuanceur (kzTorsion) : la géométrie garde la ligne médiane, le repère sans
  // torsion (N0), la tangente, la demi-largeur signée et le poids de la torsion
  const pos = [], aN0 = [], aT = [], aW = [], aR = [], idx = [];
  const Z = new V3(0, 0, 1);
  for (let i = 0; i < pts.length; i++) {
    const T = new V3().subVectors(pts[Math.min(pts.length - 1, i + 1)], pts[Math.max(0, i - 1)]).normalize();
    const N0 = new V3().crossVectors(Z, T).normalize();
    // v16 : la descente est un large ruban plat (réf. ALCHE), l'arc sur l'anneau garde la largeur de l'anneau
    const w = LARG * (0.82 + (portrait ? 0.2 : 0.55) * ws[i]);
    for (const c of [-1, 1]) {
      pos.push(pts[i].x, pts[i].y, pts[i].z); aN0.push(N0.x, N0.y, N0.z); aT.push(T.x, T.y, T.z); aW.push(c * w, ws[i]); aR.push(s[i], c < 0 ? 0 : 1);
    }
    if (i < pts.length - 1) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aN0', new THREE.Float32BufferAttribute(aN0, 3));
  g.setAttribute('aT', new THREE.Float32BufferAttribute(aT, 3));
  g.setAttribute('aW', new THREE.Float32BufferAttribute(aW, 2));
  g.setAttribute('aR', new THREE.Float32BufferAttribute(aR, 2));
  g.setIndex(idx);
  const mesh = new THREE.Mesh(g, m);
  mesh.frustumCulled = false;
  mesh.renderOrder = 3;
  groupe.add(mesh);
  const ombre = new THREE.Mesh(g, mOmbre);
  ombre.frustumCulled = false;
  ombre.renderOrder = 2;
  groupe.add(ombre);

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
  u.uOndule.value = portrait ? 0.3 : 1;   // v17 : au téléphone, le ruban ondule à peine (il reste au bord)
  // v18 : au téléphone, la queue du ruban se retire jusqu'au bord droit (ici) pendant le retrait de la vague
  const naissanceTel = sAnneau + 2.4;
  u.uNaissance.value = 0;
  feuilles.mesh.visible = false;
  const tmpV = new V3();
  let tordT = 0;
  /* une image : le ruban se forme sur l'anneau quand le clair arrive, puis descend avec le déroulé */
  function maj(s, dt, temps, pivot, out) {
    const sDesc = borne((s - 5.02) / 0.86);   // v18 : le déroulé est la partie 5 (v16)
    const fin = sAnneau * lisse(4.02, 4.5, s) + (sTotal - sAnneau) * sDesc * (s < 6.3 ? 1 : 0);
    u.uNaissance.value = portrait ? (naissanceTel + 1.1) * lisse(5.08, 5.32, s) : 0;
    u.uFin.value = Math.max(0.0001, fin);
    u.uDebut.value = 0;
    // v20 : sur le blanc (et sous la coulée), la torsion court avec le défilement (les reflets glissent, l'envers se
    // montre), plus ample ; dans le violet, rien ne change (uTord 0, ampleur 1,15 : la v19)
    const doux = u.kzDoux.value > 0.5;
    const blancR = lisse(4.86, 5.12, s);
    tordT += dt * 0.12 * blancR * (doux ? 0.5 : 1);
    u.uTord.value = Math.max(0, s - 4.84) * (doux ? 3.2 : 5.2) + tordT;
    u.uTordA.value = 1.15 + 0.15 * blancR;
    u.uRetourne.value = blancR;
    u.uGlisse.value = s * 1.6 + tordT * 0.25;
    u.uLent.value = doux ? 0.5 : 1;
    u.uOmbre.value = lisse(4.86, 5.05, s);
    // v20 : l'éclat, quand le dernier filet de la coulée est entré dans le ruban (s = 5,32) : une onde de lumière
    // parcourt le ruban visible, de la queue à la tête (adoucie en mouvement réduit)
    const debutVu = Math.min(fin, Math.max(0, u.uNaissance.value - 0.6, fin - 9));
    u.uEclat.value = lisse(5.295, 5.335, s) * (1 - lisse(5.36, 5.46, s)) * (doux ? 0.6 : 1);
    u.uEclatX.value = debutVu - 1 + (fin - debutVu + 2) * lisse(5.29, 5.44, s);
    let teteY = 0;
    pivot.updateMatrixWorld(true);
    pivot.localToWorld(posDeS(Math.max(fin, 0.001), out));
    teteY = out.y;
    majMarques(s > 4.8 && s < 6.05 ? fin : 0);
    return { teteY, fin };
  }
  /* v18 : n points de la ligne médiane visible (de la queue à la tête, ondulation du nuanceur comprise), dans le
     repère du ruban : la vague s'y resserre et s'y range (fond.js, uRubanP). out : n vecteurs. */
  const DEMI = LARG * (0.82 + (portrait ? 0.2 : 0.55));
  function ligne(n, temps, out) {
    // la partie qui peut se voir à l'écran (les 9 dernières unités : la caméra suit la tête)
    const fin = u.uFin.value, debut = Math.min(fin, Math.max(0, u.uNaissance.value - 0.6, fin - 9));
    for (let k = 0; k < n; k++) {
      const x = debut + (fin - debut) * k / (n - 1);
      posDeS(x, out[k]);
      const kk = lisse(sAnneau, sAnneau + 1.5, x) * u.uOndule.value;
      out[k].x += Math.sin(x * 0.9 - temps * 1.1) * 0.16 * kk;
      out[k].z += Math.sin(x * 1.3 - temps * 1.5 + 1.0) * 0.22 * kk;
    }
    return out;
  }
  /* position d'un des six moments, dans le monde */
  function noeudMonde(k, pivot, out) { return pivot.localToWorld(out.copy(noeuds[k].p)); }
  return {
    groupe, u, feuilles, sAnneau, sTotal, noeuds, yDeS, sDeY, posDeS, majMarques, maj, noeudMonde, ligne, demiLargeur: DEMI, verreVisible: false,
  };
}
