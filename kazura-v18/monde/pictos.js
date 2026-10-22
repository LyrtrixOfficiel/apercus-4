/* Kazura v15, la Scène : les PICTOGRAMMES DE LUMIÈRE du déroulé (« Tout commence par un message »).
   La page écrit les six moments et montre, à droite, une vignette de verre pour chacun. La scène les accompagne
   sans les doubler : sous le grand mot de la page (« Vous », « Ensemble », « Moi »...), la liane DESSINE au fil du
   défilement un grand pictogramme en trait de lumière holographique, qui se lit au premier regard :
     1. une bulle de message, ses trois points qui sautillent et sa pastille « nouveau » : un message arrive ;
     2. deux bulles qui se répondent : l'échange ;
     3. une fenêtre de site dont le croquis se trace (barre, arche, titre, bouton) : le site se dessine ;
     4. trois curseurs de réglage qui glissent : les retouches ;
     5. un globe qui tourne et sa coche : le site est en ligne ;
     6. un cœur qui bat traversé d'un tracé de pouls : le suivi, je reste là.
   Chaque trait se dessine quand son moment arrive au milieu de l'écran, puis s'efface quand le suivant commence :
   tout suit le défilement (aucune minuterie), seules les petites animations internes vivent dans le temps.
   Placement : sous le grand mot de la page (#dr-mot) s'il existe, sinon dans la colonne de gauche ; au téléphone,
   à droite du grand mot. Les moments sont lus dans la page (#chemin > .moment) ; sans eux, la position dans la partie. */
import { GLSL_MASQUE, GLSL_IRIS } from './glsl.js';

/* ------------------------------------------------------------ les dessins (unités : l'icône tient dans [-1, 1]) */
const arc = (cx, cy, rx, ry, a0, a1, n = 40) => { const p = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * (i / n); p.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); } return p; };
const cercle = (cx, cy, r, n = 36, depart = Math.PI / 2) => arc(cx, cy, r, r, depart, depart - Math.PI * 2, n);
/* rectangle arrondi, parcouru depuis le milieu du bord gauche, dans le sens horaire */
function rectArrondi(x0, y0, x1, y1, r, n = 8) {
  const p = [[x0, (y0 + y1) / 2]];
  const coin = (cx, cy, a0) => { for (let i = 0; i <= n; i++) { const a = a0 - (i / n) * Math.PI / 2; p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } };
  coin(x0 + r, y1 - r, Math.PI); coin(x1 - r, y1 - r, Math.PI / 2); coin(x1 - r, y0 + r, 0); coin(x0 + r, y0 + r, -Math.PI / 2);
  p.push([x0, (y0 + y1) / 2]);
  return p;
}
/* une bulle : rectangle arrondi dont le bas porte une queue (cote : -1 à gauche, 1 à droite), tracée d'un seul trait */
function bulleTrait(x0, y0, x1, y1, r, cote, n = 8) {
  const p = [];
  const coin = (cx, cy, a0, a1) => { for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * (i / n); p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } };
  const H = Math.PI / 2;
  if (cote < 0) {
    p.push([x0 + r + 0.26, y0]);
    coin(x1 - r, y0 + r, -H, 0); coin(x1 - r, y1 - r, 0, H); coin(x0 + r, y1 - r, H, 2 * H); coin(x0 + r, y0 + r, 2 * H, 3 * H);
    p.push([x0 + r - 0.1, y0 - 0.3]); p.push([x0 + r + 0.26, y0]);
  } else {
    p.push([x1 - r - 0.26, y0]);
    coin(x0 + r, y0 + r, 3 * H, 2 * H); coin(x0 + r, y1 - r, 2 * H, H); coin(x1 - r, y1 - r, H, 0); coin(x1 - r, y0 + r, 0, -H);
    p.push([x1 - r + 0.1, y0 - 0.3]); p.push([x1 - r - 0.26, y0]);
  }
  return p;
}
function coeur(cx, cy, s) {
  const p = [];
  for (let i = 0; i <= 80; i++) {
    const t = Math.PI + (i / 80) * Math.PI * 2;
    const x = 16 * Math.sin(t) ** 3, y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    p.push([cx + x * s, cy + y * s]);
  }
  return p;
}
/* animations : 0 aucune ; 1 saut (points qui écrivent) ; 2 souffle (bulle) ; 3 glisse (curseur) ; 4 rotation (méridien) ;
   5 battement (cœur) ; 6 apparition en ressort (pastille, coche) */
function icones() {
  const I = [];
  // 1. un message arrive
  I.push([
    { p: bulleTrait(-0.92, -0.42, 0.78, 0.62, 0.32, -1) },
    ...[-0.42, -0.07, 0.28].map((x, k) => ({ p: cercle(x, 0.1, 0.075, 18), anim: 1, centre: [x, 0.1], phase: k * 0.9 })),
    { p: cercle(0.8, 0.62, 0.17, 24), anim: 6, centre: [0.8, 0.62], phase: 0 },
    { p: [[0.8, 0.53], [0.8, 0.72]], anim: 6, centre: [0.8, 0.62], phase: 0 },
  ]);
  // 2. l'échange
  I.push([
    { p: bulleTrait(-0.98, 0.08, 0.32, 0.86, 0.24, -1), anim: 2, centre: [-0.33, 0.47], phase: 0 },
    { p: [[-0.74, 0.58], [0.06, 0.58]], anim: 2, centre: [-0.33, 0.47], phase: 0 },
    { p: [[-0.74, 0.36], [-0.2, 0.36]], anim: 2, centre: [-0.33, 0.47], phase: 0 },
    { p: bulleTrait(-0.3, -0.8, 0.98, -0.04, 0.24, 1), anim: 2, centre: [0.34, -0.42], phase: 3.14 },
    { p: [[-0.06, -0.3], [0.72, -0.3]], anim: 2, centre: [0.34, -0.42], phase: 3.14 },
    { p: [[-0.06, -0.52], [0.4, -0.52]], anim: 2, centre: [0.34, -0.42], phase: 3.14 },
  ]);
  // 3. le site se dessine
  I.push([
    { p: rectArrondi(-1, -0.74, 1, 0.74, 0.1) },
    { p: [[-1, 0.5], [1, 0.5]] },
    ...[-0.86, -0.74, -0.62].map((x) => ({ p: cercle(x, 0.62, 0.035, 10) })),
    { p: arc(0, -0.74, 0.62, 0.78, Math.PI, 0, 40) },
    { p: [[-0.36, 0.26], [0.36, 0.26]] },
    { p: [[-0.24, 0.1], [0.24, 0.1]] },
    { p: rectArrondi(-0.2, -0.24, 0.2, -0.08, 0.08, 5) },
    { p: rectArrondi(-0.88, 0.0, -0.58, 0.32, 0.04, 3) },
    { p: rectArrondi(0.58, 0.0, 0.88, 0.32, 0.04, 3) },
  ]);
  // 4. les retouches
  I.push([0.55, 0, -0.55].flatMap((y, k) => [
    { p: [[-0.95, y], [0.95, y]] },
    { p: cercle(0, y, 0.15, 22), anim: 3, centre: [0, y], phase: k * 2.1 + 0.4 },
  ]));
  // 5. en ligne
  I.push([
    { p: cercle(-0.12, 0.08, 0.8, 60) },
    { p: arc(-0.12, 0.08, 0.8, 0.26, Math.PI, Math.PI * 3, 50) },
    { p: arc(-0.12, 0.08, 0.36, 0.8, Math.PI / 2, Math.PI / 2 + Math.PI * 2, 50), anim: 4, centre: [-0.12, 0.08], phase: 0 },
    { p: [[-0.12, 0.88], [-0.12, -0.72]] },
    { p: cercle(0.66, -0.62, 0.28, 30), anim: 6, centre: [0.66, -0.62], phase: 0 },
    { p: [[0.54, -0.62], [0.63, -0.72], [0.8, -0.52]], anim: 6, centre: [0.66, -0.62], phase: 0 },
  ]);
  // 6. le suivi
  I.push([
    { p: coeur(0, 0.12, 0.052), anim: 5, centre: [0, 0.0], phase: 0 },
    { p: [[-1, -0.08], [-0.42, -0.08], [-0.3, 0.12], [-0.16, -0.46], [0.0, 0.5], [0.14, -0.3], [0.24, -0.08], [1, -0.08]], pouls: 1 },
  ]);
  return I;
}

/* ------------------------------------------------------------ une icône : un ruban de traits, toujours face à nous */
function geometrieIcone(THREE, traits) {
  // longueur totale, pour que le tracé se dessine dans l'ordre des traits
  const longueur = (p) => { let l = 0; for (let i = 1; i < p.length; i++) l += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); return l; };
  const total = traits.reduce((a, t) => a + longueur(t.p) + 0.25, 0);
  const pos = [], nor = [], aL = [], aC = [], aA = [], idx = [];
  let cumul = 0;
  for (const t of traits) {
    const p = t.p, n = p.length;
    const base = pos.length / 3;
    let l = 0;
    for (let i = 0; i < n; i++) {
      if (i) l += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
      const a = p[Math.max(0, i - 1)], b = p[Math.min(n - 1, i + 1)];
      let tx = b[0] - a[0], ty = b[1] - a[1];
      const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
      for (const c of [-1, 1]) {
        pos.push(p[i][0], p[i][1], 0);
        nor.push(-ty, tx);
        aL.push((cumul + l) / total);
        aC.push(c);
        aA.push(t.anim || 0, t.phase || 0, t.centre ? t.centre[0] : 0, t.centre ? t.centre[1] : 0);
      }
      if (i < n - 1) { const k = base + i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
    }
    cumul += l + 0.25;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aN', new THREE.Float32BufferAttribute(nor, 2));
  g.setAttribute('aL', new THREE.Float32BufferAttribute(aL, 1));
  g.setAttribute('aC', new THREE.Float32BufferAttribute(aC, 1));
  g.setAttribute('aA', new THREE.Float32BufferAttribute(aA, 4));
  g.setIndex(idx);
  return g;
}

export function creerPictos(THREE, { mobile, U, reduit }) {
  const groupe = new THREE.Group();
  const liste = icones();
  const uC = { kzRes: U.kzRes, kzBal: U.kzBal, kzLiq: U.kzLiq, kzTps: U.kzTps, uLent: { value: reduit ? 0.5 : 1 } };
  const materiau = (halo) => new THREE.ShaderMaterial({
    uniforms: { ...uC, uTrace: { value: 0 }, uVis: { value: 0 }, uLarg: { value: 0.03 }, uPx: { value: 0.01 }, uTeinte: { value: 0 }, uHalo: { value: halo ? 1 : 0 } },
    transparent: true, depthTest: false, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: /* glsl */ `
      precision highp float;
      attribute vec2 aN; attribute float aL; attribute float aC; attribute vec4 aA;
      uniform float kzTps; uniform float uLent; uniform float uLarg; uniform float uPx;
      varying float vL; varying float vC; varying float vAnim;
      void main() {
        float t = kzTps * uLent;
        vec2 p = position.xy, c = aA.zw;
        float type = aA.x, ph = aA.y;
        float s = 1.0;
        if (type > 0.5 && type < 1.5) { float sa = max(0.0, sin(t * 4.5 - ph)); p.y += 0.14 * sa * sa; }
        else if (type < 2.5 && type > 1.5) s = 1.0 + 0.045 * sin(t * 1.6 + ph);
        else if (type < 3.5 && type > 2.5) p.x += 0.55 * sin(t * 0.8 + ph);
        else if (type < 4.5 && type > 3.5) p.x = c.x + (p.x - c.x) * cos(t * 0.7);
        else if (type < 5.5 && type > 4.5) s = 1.0 + 0.07 * pow(max(0.0, sin(t * 2.6)), 10.0);
        else if (type > 5.5) s = 1.0 + 0.12 * pow(max(0.0, sin(t * 1.3)), 16.0);
        p = c + (p - c) * s;
        // la largeur du trait : environ 2 pixels de part et d'autre, quel que soit l'écran
        p += aN * aC * (uLarg + uPx * 0.8);
        vL = aL; vC = aC; vAnim = type;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 0.0, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      precision highp float;
      ${GLSL_MASQUE}
      ${GLSL_IRIS}
      uniform float uTrace; uniform float uVis; uniform float uLarg; uniform float uPx; uniform float uTeinte; uniform float uLent; uniform float uHalo;
      varying float vL; varying float vC; varying float vAnim;
      void main() {
        if (uVis < 0.005 || vL > uTrace || kzClair(gl_FragCoord.xy) < 0.5) discard;
        float t = kzTps * uLent;
        // le bord du trait, net (une fraction de pixel de fondu)
        float bord = 1.0 - smoothstep((uLarg) / (uLarg + uPx * 0.8), 1.0, abs(vC));
        // le halo : une lueur colorée large et douce derrière le trait
        if (uHalo > 0.5) bord = pow(clamp(1.0 - abs(vC), 0.0, 1.0), 2.2) * 0.32;
        // la couleur de la liane : holographique, saturée, qui coule le long du trait ; plus foncée au bord
        vec3 c = kzHolo(vL * 1.6 - t * 0.06 + uTeinte);
        c = pow(c, vec3(1.25)) * 0.95;
        c = mix(c * 0.55, c, 1.0 - abs(vC) * 0.8);
        // la tête du tracé luit pendant qu'il se dessine ; une impulsion parcourt le tracé du pouls
        float tete = exp(-(uTrace - vL) * 60.0) * step(uTrace, 0.999);
        c = mix(c, vec3(1.0), tete * 0.7);
        gl_FragColor = vec4(c, bord * uVis);
      }`,
  });
  const icones3 = liste.map((traits, k) => {
    const g = geometrieIcone(THREE, traits);
    const m = new THREE.Mesh(g, materiau(false)), h = new THREE.Mesh(g, materiau(true));
    for (const x of [m, h]) { x.frustumCulled = false; x.visible = false; x.material.uniforms.uTeinte.value = k * 0.17; groupe.add(x); }
    m.renderOrder = 9; h.renderOrder = 8;
    return { m, h, trace: 0, vis: 0 };
  });

  const tmp = new THREE.Vector3(), q = new THREE.Quaternion();
  let moments = null, mot = null, chemin = null;
  const trouver = () => {
    if (!moments || !moments.length || !document.contains(moments[0])) {
      chemin = document.getElementById('chemin');
      moments = chemin ? [...chemin.querySelectorAll(':scope > .moment')] : [];
      mot = document.getElementById('dr-mot');
    }
  };
  const borne = (x) => Math.min(1, Math.max(0, x));
  const lisse = (a, b, x) => { const t = borne((x - a) / (b - a)); return t * t * (3 - 2 * t); };

  return {
    groupe,
    /* v17 : l'avancement du déroulé, de 0 à 6 (un cran par moment arrivé au milieu de l'écran), pour le dessin du
       sceau sur la feuille (fond.js). Lu dans la page (#chemin > .moment), sinon d'après s. */
    avancement(s, hauteur) {
      trouver();
      let D = 0;
      if (moments.length >= 6) {
        for (let k = 0; k < 6; k++) { const r = moments[k].getBoundingClientRect(); D += borne((hauteur * 0.86 - r.top) / (hauteur * 0.38)); }
      } else {
        const l = s - 5;   // v18 : le déroulé est la partie 5
        for (let k = 0; k < 6; k++) D += borne((l - (0.12 + k * 0.13)) / 0.08);
      }
      return D;
    },
    /* s : position dans la page ; vis : 0 à 1 (clair) ; largeur, hauteur : l'écran en pixels CSS */
    maj({ s, dt, vis, camera, largeur, hauteur, portrait }) {
      groupe.visible = vis > 0.002 && s > 4.85 && s < 6.2;   // v18 : le déroulé est la partie 5 (comme en v16)
      if (!groupe.visible) { for (const ic of icones3) { ic.m.visible = false; ic.h.visible = false; } return; }
      trouver();
      const H = hauteur, W = largeur;
      // l'avancement de chaque moment (0 : il arrive en bas ; 1 : il est au milieu de l'écran)
      const av = [];
      if (moments.length >= 6) {
        for (let k = 0; k < 6; k++) { const r = moments[k].getBoundingClientRect(); av.push(borne((H * 0.86 - r.top) / (H * 0.38))); }
        const r5 = moments[5].getBoundingClientRect();
        av.push(borne((H * 0.3 - r5.bottom) / (H * 0.3)));   // la sortie du dernier
      } else {
        const l = s - 5;
        for (let k = 0; k < 6; k++) av.push(borne((l - (0.12 + k * 0.13)) / 0.08));
        av.push(borne((l - 0.92) / 0.06));
      }
      // la place : sous le grand mot de la page, sinon dans la colonne de gauche
      let cx = portrait ? 0.78 : 0.13, cy = portrait ? 0.2 : 0.62, taille = portrait ? 0.075 : 0.13;
      if (mot) {
        const r = mot.getBoundingClientRect();
        if (r.width > 0 && r.bottom > 0 && r.top < H) {
          if (portrait) { cx = Math.min(0.8, (r.right + 16) / W + taille * H / W * 1.1); cy = (r.top + r.height * 0.5) / H; }
          else { cx = (r.left + r.width * 0.5) / W; cy = Math.min(0.76, (r.bottom + H * 0.2) / H); }
        }
      }
      // l'icône est posée devant la caméra, à sa place à l'écran, toujours face à nous
      const D = 5;
      const tH = Math.tan(camera.fov * Math.PI / 360);
      const demiH = tH * D, demiW = demiH * camera.aspect;
      groupe.position.copy(camera.position);
      groupe.quaternion.copy(camera.quaternion);
      groupe.translateZ(-D);
      groupe.translateX((cx * 2 - 1) * demiW);
      groupe.translateY((1 - cy * 2) * demiH);
      const echelle = taille * 2 * demiH;
      groupe.scale.setScalar(echelle);
      const px = (2 * demiH / H) / echelle;   // un pixel CSS, en unités de l'icône
      icones3.forEach((ic, k) => {
        const entree = av[k], sortie = av[k + 1];
        // l'icône précédente s'efface d'abord (premier tiers de l'arrivée du moment suivant), puis la nouvelle se dessine
        ic.trace = lisse(0.34, 1.0, entree);
        ic.vis = vis * lisse(0.3, 0.42, entree) * (1 - lisse(0.0, 0.32, sortie));
        for (const [x, larg] of [[ic.m, mobile ? 1.6 : 2.2], [ic.h, mobile ? 8 : 11]]) {
          const u = x.material.uniforms;
          u.uTrace.value = ic.trace * 1.02;
          u.uVis.value = ic.vis;
          u.uLarg.value = larg * px;
          u.uPx.value = px;
          x.visible = ic.vis > 0.004 && ic.trace > 0.001;
        }
      });
    },
  };
}
