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
     relacher() pose le panneau le plus proche et prévient la page. */
import { GLSL_IRIS } from './glsl.js';

export function creerCarrousel(THREE, { mobile, renderer }) {
  const groupe = new THREE.Group();
  const panneaux = [];
  const ecouteurs = [];
  const chargeur = new THREE.TextureLoader();
  let R = 5.2, larg = 3.0, haut = 1.88, pas = 0.66, yPanneau = 0;
  let actif = 0, angle = 0, angleCible = 0, glisse = 0, largeurEcran = 1000;
  let sites = [], nV = 0;
  const textures = new Map();
  const vide = new THREE.DataTexture(new Uint8Array([24, 20, 32, 255]), 1, 1);
  vide.needsUpdate = true;
  const couleurs = [];

  const vert = /* glsl */ `
    uniform float uMiroir;
    varying vec2 vUv; varying vec3 vN; varying vec3 vV;
    void main() { vUv = vec2(1.0 - uv.x, uv.y); vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`;
  const frag = /* glsl */ `
    ${GLSL_IRIS}
    uniform sampler2D uImg; uniform sampler2D uImg2; uniform float uMel; uniform float uActif; uniform float uTemps; uniform float uVis; uniform vec3 uTeinte; uniform float uPret; uniform float uMiroir;
    varying vec2 vUv; varying vec3 vN; varying vec3 vV;
    void main() {
      vec2 uv = vUv;
      vec2 c = uv - 0.5;
      vec2 dec = c * 0.006 * (0.4 + length(c));
      vec3 img = vec3(texture2D(uImg, uv + dec).r, texture2D(uImg, uv).g, texture2D(uImg, uv - dec).b);
      if (uMel > 0.001) { vec3 a2 = vec3(texture2D(uImg2, uv + dec).r, texture2D(uImg2, uv).g, texture2D(uImg2, uv - dec).b); img = mix(img, a2, uMel); }
      img = mix(vec3(0.05, 0.045, 0.07), img, uPret);
      float fr = pow(1.0 - clamp(abs(dot(normalize(vN), normalize(vV))), 0.0, 1.0), 2.5);
      vec2 e = min(uv, 1.0 - uv);
      float bord = min(e.x * 1.6, e.y);
      float rive = exp(-bord * 55.0);
      vec3 ir = kzIris(uv.x * 0.8 + uv.y * 0.6 - uTemps * 0.12 + fr);
      float bal = exp(-pow((uv.x + uv.y * 0.5) - fract(uTemps * 0.05) * 2.6 + 0.5, 2.0) * 60.0) * 0.18;
      vec3 col = img * (0.28 + 0.72 * uActif) + ir * rive * (0.35 + 0.65 * uActif) * 0.9 + vec3(1.0) * bal * uActif + uTeinte * fr * 0.25;
      float a = smoothstep(0.0, 0.004, bord) * uVis;
      // vraies couleurs : on précompense le rendu filmique (ACES) qui viendra après
      vec3 y = clamp(col, 0.0, 0.93);
      vec3 A = 2.43 * y - 2.51, B = 0.59 * y - 0.03, C = 0.14 * y;
      vec3 x = (-B - sqrt(max(B * B - 4.0 * A * C, 0.0))) / (2.0 * A);
      col = x * 0.6;
      // le reflet au sol (la copie retournée) : plus sombre, il s'efface en s'éloignant du panneau
      if (uMiroir > 0.5) { float f = 1.0 - smoothstep(0.0, 0.55, uv.y); col *= 0.22 * f; a *= f * 0.9; }
      gl_FragColor = vec4(col * a, a);
    }`;

  function texture(url) {
    if (!url) return null;
    if (textures.has(url)) return textures.get(url);
    const ent = { tex: null };
    textures.set(url, ent);
    chargeur.load(url, (t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
      t.generateMipmaps = true;
      ent.tex = t;
    }, undefined, () => {});
    return ent;
  }

  const materiau = (miroir) => new THREE.ShaderMaterial({
    uniforms: { uImg: { value: vide }, uImg2: { value: vide }, uMel: { value: 0 }, uActif: { value: 0 }, uTemps: { value: 0 }, uVis: { value: 0 }, uTeinte: { value: new THREE.Color(0x8b5cf6) }, uPret: { value: 0 }, uMiroir: { value: miroir ? 1 : 0 } },
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
      panneaux.push({ mesh, miroir, ents: s.images.map(texture), img: 0, t: (k * 1.7) % 4 });
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
  const prevenir = (j) => { if (j !== actif) { actif = j; for (const f of ecouteurs) { try { f(j, sites[j]); } catch {} } } };

  return {
    groupe,
    cadrer({ portrait, camera }) {
      const avant = [R, larg, haut, pas, yPanneau].join();
      if (portrait) {
        // un panneau large au téléphone (environ 86 % de l'écran), dans la moitié haute, voisins juste au bord
        const t = Math.tan(camera.fov * Math.PI / 360), demiL = t * camera.aspect;
        R = 3.4; larg = Math.min(2 * demiL * R * 0.8, 2.4); haut = larg / 1.6; pas = larg / R + 0.1;
        yPanneau = t * R * 0.3;
      } else {
        R = 5.2; larg = 2.75; haut = 1.72; pas = 0.62; yPanneau = 0.08;
      }
      if (avant !== [R, larg, haut, pas, yPanneau].join() && sites.length) construire();
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
    couleurActive(out) {
      const n = couleurs.length;
      if (!n) return out;
      const x = angle - Math.floor(angle / n) * n;
      const i = Math.floor(x), t = x - i;
      return out.copy(couleurs[i % n]).lerp(couleurs[(i + 1) % n], t * t * (3 - 2 * t));
    },
    /* l'anneau est centré sur la caméra (on est dedans) */
    placer(camera) { groupe.position.set(camera.position.x * 0.3, camera.position.y + yPanneau, camera.position.z + 0.2); },
    maj(dt, temps, vis, lisse) {
      angle = lisse(angle, angleCible + glisse, 6, dt);
      groupe.visible = vis > 0.002 && nV > 0;
      if (!groupe.visible) return;
      panneaux.forEach((p, k) => {
        let d = k - angle;
        d -= Math.round(d / nV) * nV;
        const a = d * pas;
        const ad = Math.abs(d);
        const kR = 1 + 0.05 * Math.min(1, ad);
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
          m.visible = v > 0.003;
        }
      });
    },
    detruire() { for (const e of textures.values()) if (e.tex) e.tex.dispose(); vide.dispose(); },
  };
}
