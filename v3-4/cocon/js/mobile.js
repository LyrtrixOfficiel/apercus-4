// Cocon : le mobile suspendu, en three.js. Un anneau de bois clair, une lune et des nuages de feutre, des étoiles
// de papier plié, des boules de feutre. Chaque pendant est un pendule amorti accroché à l'anneau ; l'anneau tourne
// doucement, on le lance d'un glissé (souris ou doigt), un pendant touché ou effleuré se balance et pivote.
// Les ombres tombent sur le mur (la page), donc sur le nom. Rien ne suit le pointeur : seule la matière réagit au geste.
import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.170.0/three.module.min.js';

function texFeutre(taille = 256, graine = 7) {
  const c = document.createElement('canvas'); c.width = c.height = taille;
  const g = c.getContext('2d');
  let s = graine; const r = () => ((s = Math.imul(s ^ (s >>> 15), 2246822507) ^ Math.imul(s ^ (s >>> 13), 3266489909)) >>> 0) / 4294967296;
  g.fillStyle = '#808080'; g.fillRect(0, 0, taille, taille);
  g.lineCap = 'round';
  for (let i = 0; i < 2600; i++) {
    const x = r() * taille, y = r() * taille, a = r() * Math.PI * 2, l = 2 + r() * 9, v = Math.floor(70 + r() * 120);
    g.strokeStyle = `rgba(${v},${v},${v},${.18 + r() * .25})`; g.lineWidth = .5 + r() * .9;
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a + 1) * l * .4, y + Math.sin(a + 1) * l * .4, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2.5, 2.5); t.colorSpace = THREE.NoColorSpace;
  return t;
}
function texPapier(taille = 128) {
  const c = document.createElement('canvas'); c.width = c.height = taille;
  const g = c.getContext('2d'), img = g.createImageData(taille, taille);
  for (let i = 0; i < img.data.length; i += 4) { const v = 118 + Math.random() * 20; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 3); t.colorSpace = THREE.NoColorSpace;
  return t;
}
function texBois() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 16;
  const g = c.getContext('2d');
  for (let x = 0; x < 512; x++) { const v = Math.sin(x * .09) * .5 + Math.sin(x * .023 + 1) * .5; const k = 200 + v * 18; g.fillStyle = `rgb(${k + 12},${k - 14},${k - 52})`; g.fillRect(x, 0, 1, 16); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(6, 1); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// contours : croissant de lune et nuage (union de cercles, vue depuis son centre)
function formeCroissant() {
  const R = .26, ci = [.115, .055], ri = .215, pts = [];
  const dans = (x, y) => (x - ci[0]) ** 2 + (y - ci[1]) ** 2 < ri * ri;
  const ext = [], int = [];
  for (let i = 0; i < 220; i++) { const a = i / 220 * Math.PI * 2; const x = Math.cos(a) * R, y = Math.sin(a) * R; if (!dans(x, y)) ext.push([x, y, a]); }
  // remettre l'arc extérieur dans l'ordre (il peut chevaucher l'angle 0)
  let coupe = 0; for (let i = 1; i < ext.length; i++) if (ext[i][2] - ext[i - 1][2] > .2) coupe = i;
  const arcE = [...ext.slice(coupe), ...ext.slice(0, coupe)];
  for (let i = 0; i < 220; i++) { const a = i / 220 * Math.PI * 2; const x = ci[0] + Math.cos(a) * ri, y = ci[1] + Math.sin(a) * ri; if (x * x + y * y < R * R) int.push([x, y, a]); }
  let coupe2 = 0; for (let i = 1; i < int.length; i++) if (int[i][2] - int[i - 1][2] > .2) coupe2 = i;
  const arcI = [...int.slice(coupe2), ...int.slice(0, coupe2)].reverse();
  for (const [x, y] of [...arcE, ...arcI]) pts.push(new THREE.Vector2(x, y));
  return new THREE.Shape(pts);
}
function formeNuage(echelle = 1) {
  const C = [[-.17, -.02, .1], [-.05, .05, .14], [.1, .04, .12], [.21, -.025, .085], [.02, -.04, .11], [-.24, -.05, .065]];
  const pts = [];
  for (let i = 0; i < 180; i++) {
    const a = i / 180 * Math.PI * 2, ux = Math.cos(a), uy = Math.sin(a);
    let t = 0;
    for (const [cx, cy, r] of C) { const b = ux * cx + uy * cy, disc = b * b - (cx * cx + cy * cy) + r * r; if (disc >= 0) t = Math.max(t, b + Math.sqrt(disc)); }
    let x = ux * t, y = uy * t; if (y < -.1) y = -.1 + (y + .1) * .15;
    pts.push(new THREE.Vector2(x * echelle, y * echelle));
  }
  return new THREE.Shape(pts);
}
function bombe(forme, prof = .05, bord = .034) {
  const g = new THREE.ExtrudeGeometry(forme, { depth: prof, bevelEnabled: true, bevelThickness: bord, bevelSize: bord * .9, bevelSegments: 6, curveSegments: 24, steps: 1 });
  g.center(); g.computeVertexNormals();
  return g;
}
// étoile de papier plié : chaque branche a une arête saillante, faces planes
function geoEtoile(R = .17, r = .072, h = .05) {
  const pos = [];
  const P = (i) => { const a = Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r : R; return [Math.cos(a) * rr, Math.sin(a) * rr, 0]; };
  for (let i = 0; i < 10; i++) {
    const a = P(i), b = P(i + 1);
    pos.push(0, 0, h, ...a, ...b); // face avant
    pos.push(0, 0, -h, ...b, ...a); // face arrière
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals();
  return g;
}

export async function creerMobile(boite, { ample = true, petit = false, initiales = '', police = 'Young Serif' } = {}) {
  const toile = document.createElement('canvas');
  toile.setAttribute('aria-hidden', 'true');
  let rendu;
  try { rendu = new THREE.WebGLRenderer({ canvas: toile, antialias: true, alpha: true, powerPreference: 'low-power' }); }
  catch (e) { return null; }
  if (!rendu.getContext()) return null;
  boite.appendChild(toile);
  rendu.setPixelRatio(Math.min(window.devicePixelRatio || 1, petit ? 1.6 : 2));
  rendu.toneMapping = THREE.ACESFilmicToneMapping; rendu.toneMappingExposure = 1.08;
  rendu.shadowMap.enabled = true; rendu.shadowMap.type = THREE.VSMShadowMap;
  rendu.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(27, 1, .1, 60);
  const ciel = new THREE.HemisphereLight(0xfff4e6, 0xd8cfc0, 1.25); scene.add(ciel);
  const soleil = new THREE.DirectionalLight(0xfff0dc, 2.4);
  soleil.position.set(2.6, 3.6, 3.4); soleil.target.position.set(-.2, .2, 0);
  soleil.castShadow = true; soleil.shadow.mapSize.set(petit ? 1024 : 2048, petit ? 1024 : 2048);
  Object.assign(soleil.shadow.camera, { left: -3, right: 3, top: 3, bottom: -3, near: .5, far: 14 });
  soleil.shadow.radius = 9; soleil.shadow.blurSamples = 18; soleil.shadow.bias = -.0006;
  scene.add(soleil, soleil.target);
  const doux = new THREE.DirectionalLight(0xe8eefc, .55); doux.position.set(-3, 1.2, 2); scene.add(doux);
  const mur = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.ShadowMaterial({ color: 0x2f2b25, opacity: .2 }));
  mur.position.z = -1.05; mur.receiveShadow = true; scene.add(mur);

  // matières
  const feutre = texFeutre(256, 11), papier = texPapier();
  const matFeutre = (c) => new THREE.MeshPhysicalMaterial({ color: c, roughness: .96, sheen: 1, sheenRoughness: .75, sheenColor: new THREE.Color(c).lerp(new THREE.Color(0xffffff), .5), bumpMap: feutre, bumpScale: 1.6 });
  const matPapier = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: .82, flatShading: true, side: THREE.DoubleSide, bumpMap: papier, bumpScale: .35 });
  const matBois = new THREE.MeshStandardMaterial({ color: 0xffffff, map: texBois(), roughness: .52 });
  const matFil = new THREE.MeshStandardMaterial({ color: 0xece3d3, roughness: 1 });

  const mobile = new THREE.Group(); scene.add(mobile);
  const Y = 1.12, R = .8;
  const anneau = new THREE.Group(); anneau.position.y = Y; mobile.add(anneau);
  const tore = new THREE.Mesh(new THREE.TorusGeometry(R, .024, 16, 140), matBois); tore.rotation.x = Math.PI / 2; tore.castShadow = true; anneau.add(tore);
  // suspension : quatre fils de l'anneau vers une perle, puis un fil vers le plafond
  const hautY = .62;
  const perle = new THREE.Mesh(new THREE.SphereGeometry(.035, 20, 14), matBois); perle.position.y = hautY; perle.castShadow = true; anneau.add(perle);
  const geoFil = new THREE.CylinderGeometry(.0032, .0032, 1, 6, 1); geoFil.translate(0, .5, 0);
  const filEntre = (parent, a, b) => { const m = new THREE.Mesh(geoFil, matFil); const d = new THREE.Vector3().subVectors(b, a); m.position.copy(a); m.scale.set(1, d.length(), 1); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize()); m.castShadow = true; parent.add(m); return m; };
  for (let k = 0; k < 4; k++) { const a = k / 4 * Math.PI * 2 + Math.PI / 4; filEntre(anneau, new THREE.Vector3(Math.cos(a) * R, 0, Math.sin(a) * R), new THREE.Vector3(0, hautY, 0)); }
  // le fil vers le plafond ne porte pas d'ombre : flouté, il dessinait une bande grise verticale sur le mur
  filEntre(anneau, new THREE.Vector3(0, hautY, 0), new THREE.Vector3(0, hautY + 4, 0)).castShadow = false;

  // les pendants
  const cs = getComputedStyle(document.documentElement);
  const coul = () => ({ fond: cs.getPropertyValue('--fond').trim(), encre: cs.getPropertyValue('--encre').trim(), accent: cs.getPropertyValue('--accent').trim(), accent2: cs.getPropertyValue('--accent2').trim() });
  let C = coul();
  const blanc = () => new THREE.Color(C.fond).lerp(new THREE.Color(0xffffff), .72);
  const defs = [
    { type: 'lune', phi: 0, centre: true, L: 1.02, ton: () => new THREE.Color(document.documentElement.dataset.ton === 'sombre' ? C.accent : C.accent2) },
    { type: 'nuage', phi: .1, L: .58, ton: blanc, initiales: true },
    { type: 'nuage', phi: 3.3, L: .76, echelle: .78, ton: blanc },
    { type: 'etoile', phi: 1.62, L: 1.02, ton: () => new THREE.Color(C.accent2).lerp(new THREE.Color(0xffffff), .25) },
    { type: 'etoile', phi: 4.75, L: 1.08, ton: blanc, taille: .9 },
    { type: 'etoile', phi: 2.45, L: .66, ton: () => new THREE.Color(C.accent).lerp(new THREE.Color(C.fond), .35), taille: .72 },
    { type: 'boule', phi: .85, L: .84, ton: () => new THREE.Color(C.accent) },
    { type: 'boule', phi: 3.95, L: .6, ton: () => new THREE.Color(C.accent2).lerp(new THREE.Color(C.encre), .25) },
    { type: 'boule', phi: 5.55, L: .92, ton: () => new THREE.Color(C.fond).lerp(new THREE.Color(C.accent), .25) },
  ];
  const geoLune = bombe(formeCroissant(), .05, .038), geoNuage = bombe(formeNuage(), .05, .036), geoNuagePetit = bombe(formeNuage(.78), .04, .03);
  const geoEt = geoEtoile(), geoBoule = new THREE.SphereGeometry(.058, 36, 24);
  let decor = null;
  if (initiales) {
    const c = document.createElement('canvas'); c.width = 512; c.height = 256;
    const g = c.getContext('2d');
    g.font = `400 150px "${police}", Georgia, serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineWidth = 10; g.lineCap = 'round'; g.setLineDash([15, 9]); g.strokeStyle = '#ffffff';
    g.strokeText(initiales, 256, 140);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    decor = { t, mat: new THREE.MeshStandardMaterial({ map: t, color: new THREE.Color(C.accent), transparent: true, roughness: 1, depthWrite: false }) };
  }
  const pendants = defs.map((d, i) => {
    let geo, mat;
    if (d.type === 'lune') { geo = geoLune; mat = matFeutre(d.ton()); }
    else if (d.type === 'nuage') { geo = d.echelle ? geoNuagePetit : geoNuage; mat = matFeutre(d.ton()); }
    else if (d.type === 'etoile') { geo = geoEt; mat = matPapier(d.ton()); }
    else { geo = geoBoule; mat = matFeutre(d.ton()); }
    const corps = new THREE.Mesh(geo, mat); corps.castShadow = true;
    if (d.taille) corps.scale.setScalar(d.taille);
    const pivot = new THREE.Group(); pivot.add(corps); mobile.add(pivot);
    geo.computeBoundingBox();
    const haut = geo.boundingBox.max.y * (d.taille || 1);
    corps.position.y = -haut; // le fil s'attache au sommet de la pièce
    if (d.type === 'lune') corps.rotation.z = -.5;
    if (d.initiales && decor) {
      const avant = new THREE.Mesh(new THREE.PlaneGeometry(.3, .15), decor.mat); avant.position.set(0, -.005, .062); corps.add(avant);
      const arriere = avant.clone(); arriere.rotation.y = Math.PI; arriere.position.z = -.062; corps.add(arriere);
    }
    const fil = new THREE.Mesh(geoFil, matFil); fil.castShadow = true; mobile.add(fil);
    return { ...d, i, corps, pivot, fil, mat, ax: (Math.random() - .5) * .04, az: (Math.random() - .5) * .04, vx: 0, vz: 0, psi: (Math.random() - .5) * 2, vpsi: 0, psi0: d.type === 'boule' || d.type === 'lune' ? 0 : d.type === 'etoile' ? (i % 2 ? .35 : -.35) : (i * .9) % 1.2 - .6, rayon: d.type === 'boule' ? .07 : d.type === 'etoile' ? .14 * (d.taille || 1) : .26, attache: new THREE.Vector3(), avant: new THREE.Vector3(), avant2: new THREE.Vector3(), pret: 0, repos: 0 };
  });

  // état de l'anneau
  let phi = .4, omega = ample ? .07 : .04;
  const derive = () => (ample ? .07 : .04);
  const G = 3.4;
  let t = 0, visible = true, premiere = null;
  const pret = new Promise((r) => { premiere = r; });

  // cadrage : le mobile occupe le haut de la scène, un peu plus grand sur ordinateur
  let W = 1, H = 1;
  function taille() {
    const r = boite.getBoundingClientRect(); W = Math.max(1, r.width); H = Math.max(1, r.height);
    rendu.setSize(W, H, false);
    camera.aspect = W / H;
    const large = W / H > 1.15;
    const largeurVue = large ? 1.9 : 2.1, hauteurVue = large ? 2.75 : 3.2;
    const dist = Math.max(hauteurVue / 2 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)), largeurVue / 2 / (Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect));
    camera.position.set(0, large ? .4 : .12, dist + .2); camera.lookAt(0, large ? .34 : .06, 0);
    camera.updateProjectionMatrix();
    // sur un écran large, le mobile se pose à droite : le nom reste lisible à gauche, sous ses ombres
    const demiLargeur = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect * (dist + .2);
    mobile.position.x = camera.aspect > 1.15 ? demiLargeur * .37 : 0;
  }

  const tmp = new THREE.Vector3(), haut = new THREE.Vector3(0, 1, 0);
  function pas(dt) {
    t += dt;
    omega += (derive() - omega) * Math.min(1, dt * .35);
    phi += omega * dt;
    anneau.rotation.y = -phi;
    const air = ample ? 1 : .5;
    for (const p of pendants) {
      // point d'attache (sur l'anneau, ou au centre pour la lune)
      if (p.centre) p.attache.set(0, Y, 0);
      else p.attache.set(Math.cos(p.phi + phi) * R * .96, Y, Math.sin(p.phi + phi) * R * .96);
      // accélération du point d'attache : elle met le pendule en mouvement (l'anneau qu'on lance)
      let axA = 0, azA = 0;
      if (p.pret > 1) { axA = (p.attache.x - 2 * p.avant.x + p.avant2.x) / (dt * dt); azA = (p.attache.z - 2 * p.avant.z + p.avant2.z) / (dt * dt); }
      p.avant2.copy(p.avant); p.avant.copy(p.attache); p.pret++;
      axA = Math.max(-6, Math.min(6, axA)); azA = Math.max(-6, Math.min(6, azA));
      const brise = Math.sin(t * .31 + p.i * 1.9) * .5 + Math.sin(t * .17 + p.i * .7) * .5;
      const fz = -axA / p.L + brise * .05 * air, fx = -azA / p.L + Math.cos(t * .23 + p.i) * .03 * air;
      p.vz += (-G / p.L * p.az - .42 * p.vz + fz) * dt; p.az += p.vz * dt;
      p.vx += (-G / p.L * p.ax - .42 * p.vx + fx) * dt; p.ax += p.vx * dt;
      p.az = Math.max(-.9, Math.min(.9, p.az)); p.ax = Math.max(-.9, Math.min(.9, p.ax));
      // torsion du fil : la pièce pivote lentement et revient
      p.vpsi += (-(p.type === 'lune' ? 1.4 : .9) * p.psi - .16 * p.vpsi + Math.sin(t * .13 + p.i * 2.3) * .035 * air) * dt; p.psi += p.vpsi * dt;
      const x = p.attache.x + Math.sin(p.az) * p.L, z = p.attache.z + Math.sin(p.ax) * p.L, y = p.attache.y - Math.cos(p.az) * Math.cos(p.ax) * p.L;
      p.pivot.position.set(x, y, z);
      p.pivot.rotation.set(p.ax * .6, p.psi0 + p.psi - (p.centre ? 0 : phi * .15), -p.az * .6);
      // le fil, du point d'attache au sommet de la pièce
      tmp.set(x, y, z).sub(p.attache);
      const L = tmp.length();
      p.fil.position.copy(p.attache); p.fil.scale.set(1, L, 1); p.fil.quaternion.setFromUnitVectors(haut, tmp.multiplyScalar(-1 / L).negate());
    }
  }

  // les gestes : un glissé lance l'anneau ; une pièce effleurée ou touchée se balance
  const ecran = (v) => { const q = v.clone().project(camera); return [(q.x + 1) / 2 * W, (1 - q.y) / 2 * H]; };
  let appui = null, dernier = null;
  function pieceSous(x, y) {
    let best = null, dist = 1e9;
    for (const p of pendants) {
      const [px, py] = ecran(p.corps.getWorldPosition(tmp));
      const r = p.rayon * H / 3.2 * 1.25, d = Math.hypot(px - x, py - y);
      if (d < r && d < dist) { dist = d; best = p; }
    }
    return best;
  }
  function pousser(p, vx, vy, fort = 1) {
    p.vz += Math.max(-2.2, Math.min(2.2, vx * .0016 * fort));
    p.vx += Math.max(-1.6, Math.min(1.6, vy * .0011 * fort));
    p.vpsi += Math.max(-4, Math.min(4, vx * .004 * fort));
  }
  toile.addEventListener('pointerdown', (e) => {
    const r = toile.getBoundingClientRect(); appui = { x: e.clientX - r.left, y: e.clientY - r.top, t: performance.now(), dx: 0, id: e.pointerId }; dernier = { x: appui.x, y: appui.y, t: appui.t };
  }, { passive: true });
  toile.addEventListener('pointermove', (e) => {
    const r = toile.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, now = performance.now();
    if (dernier) {
      const dts = Math.max(8, now - dernier.t) / 1000, vx = (x - dernier.x) / dts, vy = (y - dernier.y) / dts;
      if (appui && (e.buttons || e.pointerType !== 'mouse')) { omega += (x - dernier.x) * .0055; omega = Math.max(-4, Math.min(4, omega)); appui.dx += Math.abs(x - dernier.x); }
      else { const p = pieceSous(x, y); if (p && Math.hypot(vx, vy) > 60 && now - p.repos > 160) { pousser(p, vx, vy, .9); p.repos = now; } }
    }
    dernier = { x, y, t: now };
  }, { passive: true });
  const relacher = (e) => {
    if (appui && appui.dx < 8 && performance.now() - appui.t < 400) {
      const p = pieceSous(appui.x, appui.y);
      if (p) { p.vpsi += 3.2 * (Math.random() < .5 ? -1 : 1); p.vz += (Math.random() - .5) * 1.4; p.vx += (Math.random() - .5) * .9; }
      else omega += .6;
    }
    appui = null; if (e?.pointerType !== 'mouse') dernier = null;
  };
  toile.addEventListener('pointerup', relacher, { passive: true });
  toile.addEventListener('pointercancel', () => { appui = null; dernier = null; }, { passive: true });
  toile.addEventListener('pointerleave', () => { if (!appui) dernier = null; }, { passive: true });

  function couleurs() {
    C = coul();
    mur.material.color.set(C.encre);
    mur.material.opacity = document.documentElement.dataset.ton === 'sombre' ? .38 : .17;
    for (const p of pendants) p.mat.color.copy(p.ton());
    for (const p of pendants) if (p.mat.sheenColor) p.mat.sheenColor.copy(p.mat.color).lerp(new THREE.Color(0xffffff), .5);
    if (decor) decor.mat.color.set(document.documentElement.dataset.ton === 'sombre' ? C.fond : C.accent);
    ciel.groundColor.set(C.fond);
  }
  couleurs();
  taille();

  let precedent = 0;
  function image(m) {
    const dt = precedent ? Math.min(.034, (m - precedent) / 1000) : .016; precedent = m;
    if (!visible) return;
    pas(dt);
    rendu.render(scene, camera);
    if (premiere) { premiere(); premiere = null; }
  }
  // quelques pas pour que tout soit en place avant la première image
  for (let k = 0; k < 90; k++) pas(1 / 60);
  return {
    image, taille, couleurs, pret, toile,
    vent(v) { for (const p of pendants) p.vz += v * .00025 * (p.i % 2 ? 1 : -.7); },
    lancer(v) { omega += v; },
    set visible(v) { visible = v; if (!v) precedent = 0; },
  };
}
