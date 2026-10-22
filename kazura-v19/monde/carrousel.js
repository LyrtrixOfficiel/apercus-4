/* Kazura v14, la Scène : la salle des réalisations.
   Comme chez ALCHE, on est DANS un anneau de panneaux courbes : le panneau actif fait face, concave,
   ses voisins attendent de part et d'autre, tournés vers nous, coupés par les bords de l'écran (trois
   panneaux entiers en ultra-large). Chaque panneau porte la capture du site (ou plusieurs, qui se
   fondent l'une dans l'autre), un léger verre, des reflets irisés sur ses bords, et son reflet sur le
   sol poli.
   v14 :
   - les DEUX sens, sans couture : l'anneau compte toujours au moins six places (avec 4 sites, chacun
     y figure deux fois, avec 2 sites trois fois), si bien que le raccord de la boucle se fait toujours
     hors de l'écran ;
   - 4 comme 30 sites : la salle montre une SÉLECTION de 6 au plus. Si la page en donne plus, elle garde
     ceux marqués `selection: true` (ou ceux dont l'id est dans `opts.selection`, sinon les 6 premiers),
     et les indices d'aller(i) et de surChangement se rapportent à cette liste gardée (`realisations.ids`) ;
   - aller(i) prend le chemin le plus court ; glisser(dx) suit le doigt dans les deux sens ;
     relacher() pose le panneau le plus proche et prévient la page.
   v16 : L'ANNEAU REVIENT, évident (« le rond d'avant » des v13 et v14, avec le panneau net de la v15) :
   - le panneau actif, net, dans ses vraies couleurs, à sa place (cadrer) ;
   - les voisins de part et d'autre, VISIBLES (lumineux, à peine adoucis), tournés vers nous, coupés par les bords ;
     du côté des textes de la page (à gauche en paysage), ils s'assombrissent pour laisser lire ;
   - un voisin survolé s'allume et avance un peu (le curseur devient une main) ; un CLIC sur un voisin l'amène de
     face (lancer de rayon), prévient la page (surChangement) et les écouteurs de surClicPanneau ;
   - au premier passage, une petite rotation d'invitation montre qu'on peut tourner (plus douce en mouvement réduit). */
import { GLSL_IRIS } from './glsl.js';

export function creerCarrousel(THREE, { mobile, renderer, reduit = false, U }) {
  const groupe = new THREE.Group();
  const panneaux = [];
  const ecouteurs = [];
  const chargeur = new THREE.TextureLoader();
  let R = 5.2, larg = 3.0, haut = 1.88, pas = 0.66, yPanneau = 0, lacet = 0, cam = null, estPortrait = false;
  /* par défaut : au-dessus de la légende et de la rangée de vignettes de la page (le bas de l'écran) */
  const reglage = { o: { cx: 0.67, cy: 0.37, l: 0.38, hMax: 0.46 }, p: { cx: 0.5, cy: 0.41, l: 0.84, hMax: 0.26 } };
  const qL = new THREE.Quaternion(), axeY = new THREE.Vector3(0, 1, 0);
  let actif = 0, angle = 0, angleCible = 0, glisse = 0, largeurEcran = 1000;
  // v16 : l'invitation (une fois), le survol, les clics
  let invitation = -1, decalInv = 0, survol = -1, survolK = -1, curseurPose = false, zoneTexte = 0;
  const ecoutesClic = [];
  const rayon = new THREE.Raycaster(), ndc = new THREE.Vector2();
  let sites = [], nV = 0;
  const textures = new Map();
  const vide = new THREE.DataTexture(new Uint8Array([24, 20, 32, 255]), 1, 1);
  vide.needsUpdate = true;
  const couleurs = [];

  const vert = /* glsl */ `
    precision highp float;
    uniform float uMiroir;
    varying vec2 vUv; varying vec3 vN; varying vec3 vV;
    void main() { vUv = vec2(1.0 - uv.x, uv.y); vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`;
  const frag = /* glsl */ `
    precision highp float;
    ${GLSL_IRIS}
    uniform sampler2D uImg; uniform sampler2D uImg2; uniform float uMel; uniform float uActif; uniform float uTemps; uniform float uVis; uniform vec3 uTeinte; uniform float uPret; uniform float uMiroir;
    uniform float uSurvol; uniform float uZone; uniform vec2 uRes;
    varying vec2 vUv; varying vec3 vN; varying vec3 vV;
    /* v15 : les VRAIES couleurs du site. On inverse exactement le rendu filmique de three (ACES ajusté, exposition / 0,6)
       que la passe de sortie appliquera : la capture ressort telle qu'elle est, nette, sans voile. */
    vec3 versAces(vec3 y) {
      vec3 z = max(mat3(vec3(0.643038, 0.059269, 0.005962), vec3(0.311187, 0.931436, 0.063929), vec3(0.045775, 0.009295, 0.930118)) * clamp(y, 0.0, 0.96), 0.0);
      vec3 A = 1.0 - 0.983729 * z, B = 0.0245786 - 0.432951 * z, C = -(0.000090537 + 0.238081 * z);
      vec3 v = (-B + sqrt(max(B * B - 4.0 * A * C, 0.0))) / (2.0 * A);
      return max(mat3(vec3(1.764741, -0.147028, -0.036337), vec3(-0.675778, 1.160252, -0.162436), vec3(-0.088963, -0.013224, 1.198773)) * v, 0.0) * 0.6;
    }
    void main() {
      vec2 uv = vUv;
      // v16 : les voisins restent VISIBLES (un peu adoucis, un peu moins saturés) ; survolés, ils s'allument ;
      // du côté des textes de la page (uZone : la limite, en fraction de l'écran), ils s'assombrissent
      float flou = (1.0 - uActif) * (1.1 - 0.8 * uSurvol);
      vec3 img = texture2D(uImg, uv, flou).rgb;
      if (uMel > 0.001) img = mix(img, texture2D(uImg2, uv, flou).rgb, uMel);
      img = mix(vec3(0.05, 0.045, 0.07), img, uPret);
      float gris = dot(img, vec3(0.2126, 0.7152, 0.0722));
      float xs = gl_FragCoord.x / uRes.x;
      float texte = uZone > 0.0 ? 1.0 - smoothstep(uZone - 0.1, uZone + 0.02, xs) : 0.0;
      float lum = mix(mix(0.5, 0.86, uSurvol) * (1.0 - 0.72 * texte), 1.0, uActif);
      img = mix(vec3(gris) * vec3(0.94, 0.9, 1.06), img, mix(0.72 + 0.28 * uSurvol, 1.0, uActif)) * lum;
      float fr = pow(1.0 - clamp(abs(dot(normalize(vN), normalize(vV))), 0.0, 1.0), 2.5);
      vec2 e = min(uv, 1.0 - uv);
      float bord = min(e.x * 1.6, e.y);
      // un liseré irisé très fin sur le bord, un reflet qui passe lentement, sans voiler l'image
      float rive = exp(-bord * 160.0);
      vec3 ir = kzIris(uv.x * 0.8 + uv.y * 0.6 - uTemps * 0.12 + fr);
      float bx = (uv.x + uv.y * 0.5) - fract(uTemps * 0.05) * 2.6 + 0.5;
      float bal = exp(-bx * bx * 80.0) * 0.06;
      // le liseré irisé des voisins est un peu plus franc : il dessine l'anneau et appelle le clic
      vec3 col = img + ir * rive * (0.45 + 0.35 * uSurvol + 0.3 * uActif) + vec3(1.0) * bal * max(uActif, uSurvol * 0.6) + uTeinte * fr * 0.12 * (1.0 - uActif);
      float a = smoothstep(0.0, 0.003, bord) * uVis * (0.9 + 0.1 * uActif);
      col = versAces(col);
      // le reflet au sol (la copie retournée) : plus sombre, il s'efface en s'éloignant du panneau
      if (uMiroir > 0.5) { float f = 1.0 - smoothstep(0.0, 0.5, uv.y); col *= 0.16 * f; a *= f * 0.9; }
      gl_FragColor = vec4(col * a, a);
    }`;

  /* v19 : les captures ne se chargent qu'à l'approche de la salle (precharger, appelé par la scène), jamais quand
     l'anneau est effacé au profit du carrousel DOM du téléphone : elles ne disputent plus le réseau à three et aux
     modules pendant le chargement (environ 330 Ko de moins au téléphone) */
  let charger = false, nbCharges = 0;
  function lancerChargement(url, ent) {
    if (ent.lance) return;
    ent.lance = true;
    chargeur.load(url, (t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
      t.generateMipmaps = true;
      ent.tex = t;
      nbCharges++;
    }, undefined, () => {});
  }
  function texture(url) {
    if (!url) return null;
    if (textures.has(url)) return textures.get(url);
    const ent = { tex: null, lance: false };
    textures.set(url, ent);
    if (charger) lancerChargement(url, ent);
    return ent;
  }

  const materiau = (miroir) => new THREE.ShaderMaterial({
    uniforms: { uImg: { value: vide }, uImg2: { value: vide }, uMel: { value: 0 }, uActif: { value: 0 }, uTemps: { value: 0 }, uVis: { value: 0 }, uTeinte: { value: new THREE.Color(0x8b5cf6) }, uPret: { value: 0 }, uMiroir: { value: miroir ? 1 : 0 },
      uSurvol: { value: 0 }, uZone: { value: 0 }, uRes: U ? U.kzRes : { value: new THREE.Vector2(1, 1) } },
    vertexShader: vert, fragmentShader: frag, side: THREE.DoubleSide, transparent: true, depthWrite: !miroir, premultipliedAlpha: true,
  });
  // un panneau témoin, pour que le programme soit compilé avant que la page donne ses sites
  const temoin = new THREE.Mesh(new THREE.PlaneGeometry(0.01, 0.01), materiau(false));
  temoin.frustumCulled = false; temoin.visible = false;
  groupe.add(temoin);

  function construire() {
    for (const p of panneaux) { groupe.remove(p.mesh, p.miroir); p.mesh.material.dispose(); p.miroir.material.dispose(); }
    if (panneaux.length) panneaux[0].mesh.geometry.dispose();
    panneaux.length = 0;
    const n = sites.length;
    if (!n) { nV = 0; return; }
    nV = n === 1 ? 1 : n * Math.ceil(6 / n);
    const theta = larg / R;
    const g = new THREE.CylinderGeometry(R, R, haut, mobile ? 24 : 40, 1, true, Math.PI - theta / 2, theta);
    for (let k = 0; k < nV; k++) {
      const s = sites[k % n];
      const mesh = new THREE.Mesh(g, materiau(false));
      const miroir = new THREE.Mesh(g, materiau(true));
      for (const m of [mesh, miroir]) { m.frustumCulled = false; m.renderOrder = 6; m.material.uniforms.uTeinte.value.set(s.couleur); groupe.add(m); }
      miroir.renderOrder = 5;
      mesh.userData.k = k;
      panneaux.push({ mesh, miroir, ents: s.images.map(texture), img: 0, t: (k * 1.7) % 4, sv: 0 });
    }
  }

  /* l'emplacement de l'anneau le plus proche de `ref` qui montre le site i */
  const emplacement = (i, ref) => {
    const n = sites.length;
    const base = Math.round((ref - i) / n) * n + i;
    let best = base;
    for (const c of [base - n, base + n]) if (Math.abs(c - ref) < Math.abs(best - ref)) best = c;
    return best;
  };
  /* le lancer de rayon : l'emplacement (0 à nV - 1) du panneau visible sous le point, ou -1 */
  function toucher(x, y) {
    if (!cam || !groupe.visible || !panneaux.length) return -1;
    ndc.set(x * 2 - 1, 1 - y * 2);
    groupe.updateMatrixWorld(true);
    rayon.setFromCamera(ndc, cam);
    const vus = panneaux.filter((p) => p.mesh.visible && p.mesh.material.uniforms.uVis.value > 0.15).map((p) => p.mesh);
    const h = rayon.intersectObjects(vus, false);
    return h.length ? h[0].object.userData.k : -1;
  }
  const prevenir = (j) => { if (j !== actif) { actif = j; for (const f of ecouteurs) { try { f(j, sites[j]); } catch {} } } };

  return {
    groupe,
    get charges() { return nbCharges; },   // v19 : une capture arrivée (son envoi au GPU coûte une image ou deux)
    precharger() { if (charger) return; charger = true; for (const [url, ent] of textures) lancerChargement(url, ent); },
    /* v15 : le cadre du panneau actif, en fractions de l'écran (cx, cy : son centre depuis le haut gauche ;
       l : sa largeur ; hMax : sa hauteur au plus). La page peut le régler (realisations.cadrer). */
    cadrer({ portrait, camera, cadre }) {
      if (camera) cam = camera;
      if (portrait != null) estPortrait = portrait;
      if (cadre) {
        // { cx, cy, l, hMax } pour le format courant, ou { ordi: {...}, tel: {...} }
        const poser = (src, cle) => { if (src) for (const k of ['cx', 'cy', 'l', 'hMax']) if (typeof src[k] === 'number' && Number.isFinite(src[k])) reglage[cle][k] = Math.min(1, Math.max(0, src[k])); };
        if (cadre.ordi || cadre.tel) { poser(cadre.ordi, 'o'); poser(cadre.tel, 'p'); } else poser(cadre, estPortrait ? 'p' : 'o');
      }
      if (!cam) return;
      const avant = [R, larg, haut, pas, yPanneau, lacet].join();
      const c = reglage[estPortrait ? 'p' : 'o'];
      const tH = Math.tan(cam.fov * Math.PI / 360), tW = tH * cam.aspect;
      R = estPortrait ? 3.4 : 5.2;
      const lf = Math.min(c.l * 2 * tW, c.hMax * 2 * tH * 1.6);
      larg = lf * R; haut = larg / 1.6;
      pas = larg / R + (estPortrait ? 0.05 : 0.035);
      // v16 : en paysage, la limite des textes de la page : à gauche du panneau actif
      zoneTexte = estPortrait ? 0 : Math.max(0, c.cx - c.l / 2 - 0.015);
      yPanneau = (1 - 2 * c.cy) * tH * R;
      lacet = -Math.atan((2 * c.cx - 1) * tW);
      if (avant !== [R, larg, haut, pas, yPanneau, lacet].join() && sites.length) construire();
    },
    definir(liste, opts = {}) {
      let l = (liste || []).filter((s) => s && (s.image || (s.images && s.images.length)));
      if (l.length > 6) {
        const choisis = Array.isArray(opts && opts.selection) ? l.filter((s) => opts.selection.includes(s.id)) : l.filter((s) => s.selection === true);
        l = (choisis.length ? choisis : l).slice(0, 6);
      }
      sites = l.map((s) => ({ id: s.id, images: (s.images && s.images.length ? s.images : [s.image]).slice(0, 4), couleur: s.couleur || '#8b5cf6' }));
      couleurs.length = 0;
      for (const s of sites) couleurs.push(new THREE.Color(s.couleur));
      actif = Math.min(actif, Math.max(0, sites.length - 1));
      angle = angleCible = actif;
      glisse = 0;
      construire();
    },
    get ids() { return sites.map((s) => s.id); },
    get cadre() { return { ...reglage[estPortrait ? 'p' : 'o'] }; },
    aller(i) {
      if (!sites.length) return;
      const n = sites.length;
      const j = ((Math.round(i) % n) + n) % n;
      angleCible = emplacement(j, angleCible + glisse);
      glisse = 0;
      prevenir(j);
    },
    glisser(dx, largeur) {
      largeurEcran = largeur || largeurEcran;
      glisse = -dx / Math.max(200, largeurEcran * (largeurEcran < 700 ? 0.8 : 0.55));
    },
    relacher() {
      const n = sites.length;
      if (!n) return;
      const k = Math.round(angleCible + glisse);
      glisse = 0; angleCible = k;
      prevenir(((k % n) + n) % n);
    },
    surChangement(fn) { if (typeof fn === 'function') ecouteurs.push(fn); return () => { const k = ecouteurs.indexOf(fn); if (k >= 0) ecouteurs.splice(k, 1); }; },
    get actif() { return actif; },
    get nombre() { return sites.length; },
    /* v16 : fn(indice, site) quand un panneau voisin est cliqué (la scène l'amène déjà de face) */
    surClicPanneau(fn) { if (typeof fn === 'function') ecoutesClic.push(fn); return () => { const k = ecoutesClic.indexOf(fn); if (k >= 0) ecoutesClic.splice(k, 1); }; },
    /* v16 : le panneau sous un point de l'écran (x, y : 0 à 1 depuis le haut gauche) : son indice, ou -1 */
    panneauEn(x, y) { const k = toucher(x, y); return k < 0 ? -1 : k % Math.max(1, sites.length); },
    /* v16 : le pointeur bouge (x, y en fractions de l'écran) ; null : il est parti */
    pointer(x, y) { survolK = x == null || !groupe.visible ? -1 : toucher(x, y); },
    /* v16 : un clic (x, y en fractions de l'écran) : un voisin vient de face ; renvoie true si un panneau a été touché */
    cliquer(x, y) {
      const k = toucher(x, y);
      if (k < 0) return false;
      const n = sites.length, j = k % n;
      const cur = Math.round(angleCible + glisse);
      if (((cur % nV) + nV) % nV === k) return true;
      // l'emplacement exact qui a été cliqué, au plus près de la position courante (l'anneau est une boucle)
      let cible = k + Math.round((cur - k) / nV) * nV;
      for (const c of [cible - nV, cible + nV]) if (Math.abs(c - cur) < Math.abs(cible - cur)) cible = c;
      angleCible = cible; glisse = 0; invitation = 2;
      prevenir(j);
      for (const f of ecoutesClic) { try { f(j, sites[j]); } catch {} }
      return true;
    },
    couleurActive(out) {
      const n = couleurs.length;
      if (!n) return out;
      const x = angle - Math.floor(angle / n) * n;
      const i = Math.floor(x), t = x - i;
      return out.copy(couleurs[i % n]).lerp(couleurs[(i + 1) % n], t * t * (3 - 2 * t));
    },
    /* l'anneau est centré sur la caméra (on est dedans) */
    placer(camera, portrait, monte = 0) {
      // l'anneau suit l'orientation de la caméra (le panneau reste à sa place à l'écran ; la salle bouge derrière)
      // v18 : monte (part de l'écran) : quand la partie remonte, l'anneau remonte avec elle, collé à sa légende
      groupe.position.copy(camera.position);
      groupe.quaternion.copy(camera.quaternion).multiply(qL.setFromAxisAngle(axeY, lacet));
      groupe.translateY(yPanneau + monte * 2 * Math.tan(camera.fov * Math.PI / 360) * R);
    },
    maj(dt, temps, vis, lisse) {
      // v16 : au premier passage (la salle bien là, les captures chargées), une petite rotation d'invitation :
      // l'anneau tourne vers le site suivant, puis revient (plus douce et plus lente en mouvement réduit)
      if (invitation < 0 && vis > 0.85 && nV > 1 && panneaux.some((p) => p.ents.some((e) => e && e.tex))) invitation = 0;
      if (invitation >= 0 && invitation < 1) {
        invitation = Math.min(1, invitation + dt / (reduit ? 3.4 : 2.4));
        const x = invitation;
        decalInv = Math.pow(Math.sin(Math.PI * x), 1.5) * (reduit ? 0.14 : 0.3);
        if (vis < 0.5) { invitation = -1; decalInv = 0; }
      } else decalInv = lisse(decalInv, 0, 4, dt);
      angle = lisse(angle, angleCible + glisse + decalInv, 6, dt);
      groupe.visible = vis > 0.002 && nV > 0;
      survol = vis > 0.6 ? survolK : -1;
      const actifSlot = ((Math.round(angleCible + glisse) % Math.max(1, nV)) + nV) % Math.max(1, nV);
      const main = survol >= 0 && survol !== actifSlot;
      if (main !== curseurPose && typeof document !== 'undefined') { curseurPose = main; document.body.style.cursor = main ? 'pointer' : ''; }
      if (!groupe.visible) return;
      panneaux.forEach((p, k) => {
        let d = k - angle;
        d -= Math.round(d / nV) * nV;
        const a = d * pas;
        const ad = Math.abs(d);
        // le voisin survolé s'allume et avance un peu vers nous
        p.sv = lisse(p.sv, survol === k && ad > 0.5 ? 1 : 0, 8, dt);
        const kR = (1 + 0.05 * Math.min(1, ad)) * (1 - 0.035 * p.sv);
        const flotte = Math.sin(temps * 0.6 + k) * 0.025;
        p.mesh.rotation.y = -a; p.miroir.rotation.y = -a;
        p.mesh.scale.set(kR, 1, kR); p.miroir.scale.set(kR, -1, kR);
        p.mesh.position.y = flotte;
        p.miroir.position.y = flotte - haut - 0.1;
        const actifK = Math.max(0, 1 - ad * 1.2);
        const e = Math.min(1, ad / 2.4);
        const fondu = 1 - Math.min(1, Math.max(0, (Math.abs(a) - 1.2) / 0.4));
        const v = vis * (1 - e * e * 0.5) * fondu;
        // plusieurs captures : elles se fondent l'une dans l'autre sur le panneau actif
        const ents = p.ents.filter((x) => x && x.tex);
        let tA = ents.length ? ents[p.img % ents.length] : null, tB = null, mel = 0;
        if (ents.length > 1 && actifK > 0.6) {
          p.t += dt;
          const per = 4.5;
          if (p.t > per) { p.t -= per; p.img = (p.img + 1) % ents.length; }
          tA = ents[p.img % ents.length]; tB = ents[(p.img + 1) % ents.length];
          mel = Math.min(1, Math.max(0, (p.t - (per - 1.0)) / 1.0));
        }
        for (const m of [p.mesh, p.miroir]) {
          const u = m.material.uniforms;
          u.uImg.value = tA ? tA.tex : vide;
          u.uImg2.value = tB ? tB.tex : u.uImg.value;
          u.uMel.value = tB ? mel : 0;
          u.uActif.value = actifK;
          u.uTemps.value = temps;
          u.uPret.value = Math.min(1, u.uPret.value + (tA ? dt * 2 : 0));
          u.uVis.value = v;
          u.uSurvol.value = p.sv;
          u.uZone.value = zoneTexte;
          m.visible = v > 0.003;
        }
      });
    },
    detruire() { for (const e of textures.values()) if (e.tex) e.tex.dispose(); vide.dispose(); },
  };
}
