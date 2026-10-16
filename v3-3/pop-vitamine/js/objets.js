// Pop vitaminé : les objets, construits en code (Three.js), rendus comme de vrais produits photographiés.
// Céramique émaillée mouchetée avec son pied d'argile brute, cire et sa flaque fondue, liège, tissu tissé, éponge,
// papier kraft, bronze martelé, bois : chaque matière a son grain (textures dessinées sur canevas) et reflète un studio
// photo calculé (voir scene.js). Aucun flacon, aucune gélule, aucun galet : des objets du quotidien du bien-être.
// Chaque fabrique renvoie un groupe ramené à une taille 1 (plus grande dimension), centré.

export function fabrique(THREE, P, d, { leger = false, nomme = '' } = {}) {
  const V2 = (x, y) => new THREE.Vector2(x, y);
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const seg = leger ? 64 : 112;
  const O = P.objets;
  const col = (c) => new THREE.Color(c);
  const melange = (a, b, t) => '#' + col(a).lerp(col(b), t).getHexString();
  const initiales = String(d.initiales || '').toUpperCase();
  const metier = String(d.metier || '').toUpperCase();
  const ville = String(d.ville || '').toUpperCase();

  // ------------------------------------------------------------ textures dessinées
  const toile = (l, h, dessin) => {
    const c = document.createElement('canvas'); c.width = l; c.height = h;
    dessin(c.getContext('2d'), l, h);
    const t = new THREE.CanvasTexture(c); t.anisotropy = 8; return t;
  };
  // les grains (bruit, émail, tissage, éponge, liège, bois, kraft) sont dessinés une seule fois et partagés :
  // chaque objet existe en deux exemplaires (affiche, boîte à jouets), et le dessin coûtait plusieurs secondes
  const memo = new Map();
  const toileM = (cle, l, h, dessin) => {
    let c = memo.get(cle);
    if (!c) { c = document.createElement('canvas'); c.width = l; c.height = h; dessin(c.getContext('2d'), l, h); memo.set(cle, c); }
    const t = new THREE.CanvasTexture(c); t.anisotropy = 8; return t;
  };
  const enCouleur = (t) => { t.colorSpace = THREE.SRGBColorSpace; return t; };
  const repete = (t, x, y = x) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(x, y); return t; };
  let graine = 11;
  const hasard = () => ((graine = (graine * 16807) % 2147483647) / 2147483647);
  // bruit en niveaux de gris (relief, rugosité), éventuellement adouci
  const bruit = (taille, flou = 0, fort = 1, moyen = 128) => toileM(`bruit${taille}-${flou}-${fort}-${moyen}`, taille, taille, (g, l, h) => {
    const img = g.createImageData(l, h);
    for (let i = 0; i < l * h; i++) { const v = moyen + (hasard() - 0.5) * 255 * fort; img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v; img.data[i * 4 + 3] = 255; }
    g.putImageData(img, 0, 0);
    if (flou) { g.filter = `blur(${flou}px)`; g.drawImage(g.canvas, 0, 0); g.filter = 'none'; }
  });
  // émail moucheté : la couleur de base, de minuscules points plus sombres et plus clairs (grès émaillé)
  const mouchete = (base, densite = 1) => enCouleur(toileM(`mouchete${base}-${densite}`, 512, 512, (g, l) => {
    g.fillStyle = base; g.fillRect(0, 0, l, l);
    const fonce = melange(base, '#1a1008', 0.55), clair = melange(base, '#fff6e8', 0.45);
    for (let i = 0; i < 1400 * densite; i++) {
      const x = hasard() * l, y = hasard() * l, r = 0.4 + hasard() * hasard() * 2.2;
      g.globalAlpha = 0.25 + hasard() * 0.55; g.fillStyle = hasard() < 0.7 ? fonce : clair;
      g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
    }
    g.globalAlpha = 1;
    // très légères variations d'épaisseur de l'émail
    for (let i = 0; i < 60; i++) { g.globalAlpha = 0.04; g.fillStyle = hasard() < 0.5 ? fonce : clair; g.beginPath(); g.arc(hasard() * l, hasard() * l, 20 + hasard() * 60, 0, 7); g.fill(); }
    g.globalAlpha = 1;
  }));
  // tissage (toile, lin) : relief de fils croisés
  const tissage = (fin = 4) => toileM(`tissage${fin}`, 256, 256, (g, l) => {
    g.fillStyle = '#808080'; g.fillRect(0, 0, l, l);
    for (let y = 0; y < l; y += fin) for (let x = 0; x < l; x += fin) {
      const sens = ((x / fin) + (y / fin)) % 2;
      const grad = sens ? g.createLinearGradient(x, y, x + fin, y) : g.createLinearGradient(x, y, x, y + fin);
      grad.addColorStop(0, '#5c5c5c'); grad.addColorStop(0.5, '#bdbdbd'); grad.addColorStop(1, '#5c5c5c');
      g.fillStyle = grad; g.fillRect(x, y, fin, fin);
    }
    const img = g.getImageData(0, 0, l, l);
    for (let i = 0; i < img.data.length; i += 4) { const n = (hasard() - 0.5) * 36; img.data[i] += n; img.data[i + 1] += n; img.data[i + 2] += n; }
    g.putImageData(img, 0, 0);
  });
  // bouclettes d'éponge
  const bouclettes = () => toileM('bouclettes', 256, 256, (g, l) => {
    g.fillStyle = '#6a6a6a'; g.fillRect(0, 0, l, l);
    for (let i = 0; i < 5200; i++) {
      const x = hasard() * l, y = hasard() * l, r = 1.2 + hasard() * 1.8;
      const gr = g.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
      gr.addColorStop(0, '#e6e6e6'); gr.addColorStop(1, 'rgba(90,90,90,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
    }
  });
  // liège : grains de différentes tailles, pores sombres
  const liegeCouleur = () => enCouleur(toileM('liege', 512, 512, (g, l) => {
    g.fillStyle = '#C79A63'; g.fillRect(0, 0, l, l);
    for (let i = 0; i < 16000; i++) {
      const x = hasard() * l, y = hasard() * l, r = 0.5 + hasard() * hasard() * 3.4, s = hasard();
      g.fillStyle = s < 0.5 ? `rgba(128,82,40,${0.25 + hasard() * 0.4})` : s < 0.88 ? `rgba(228,190,134,${0.25 + hasard() * 0.45})` : `rgba(70,40,18,${0.55 + hasard() * 0.3})`;
      g.beginPath(); g.ellipse(x, y, r, r * (0.5 + hasard() * 0.7), hasard() * 3, 0, 7); g.fill();
    }
  }));
  const boisCouleur = (base = '#B98552', l = 256, h = 512) => enCouleur(toileM(`bois${base}-${l}-${h}`, l, h, (g) => {
    g.fillStyle = base; g.fillRect(0, 0, l, h);
    for (let x = 0; x < l; x += 1.5) {
      const v = Math.sin(x * 0.09 + Math.sin(x * 0.013) * 4) * 0.6 + Math.sin(x * 0.41 + 2) * 0.25 + (hasard() - 0.5) * 0.35;
      g.fillStyle = v > 0.25 ? `rgba(92,54,24,${0.12 + v * 0.12})` : 'rgba(255,232,196,0.06)'; g.fillRect(x, 0, 1.5, h);
    }
  }));
  const kraftCouleur = (base = '#B88D5C', l = 512, h = 512) => toileM(`kraft${base}-${l}-${h}`, l, h, (g) => {
    g.fillStyle = base; g.fillRect(0, 0, l, h);
    for (let i = 0; i < 4200; i++) {
      g.strokeStyle = `rgba(${hasard() < 0.55 ? '96,62,30' : '236,206,164'},${0.06 + hasard() * 0.14})`; g.lineWidth = 0.5 + hasard();
      const x = hasard() * l, y = hasard() * h, a = hasard() * 3.14, n = 4 + hasard() * 10;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * n, y + Math.sin(a) * n); g.stroke();
    }
  });

  // l'étiquette à son nom : initiales, métier, ville (une vraie étiquette imprimée de petite marque)
  const ecrireEtiquette = (g, x0, y0, L, H, opt = {}) => {
    const fond = opt.fond || O.etiquette, encre = opt.encre || O.etiquetteEncre, r = Math.min(L, H) * 0.08;
    g.save();
    g.fillStyle = fond; g.beginPath(); g.roundRect(x0, y0, L, H, r); g.fill();
    g.strokeStyle = encre; g.lineWidth = Math.max(2, H * 0.012); g.globalAlpha = 0.85;
    g.beginPath(); g.roundRect(x0 + H * 0.04, y0 + H * 0.04, L - H * 0.08, H * 0.7 - H * 0.04, r * 0.6); g.stroke();
    g.globalAlpha = 1;
    // bande colorée du bas, avec la ville
    g.fillStyle = O.bande; g.beginPath(); g.roundRect(x0, y0 + H * 0.76, L, H * 0.24, [0, 0, r, r]); g.fill();
    // petit soleil au-dessus des initiales
    g.fillStyle = O.bande; g.strokeStyle = O.bande; g.lineWidth = H * 0.012;
    const sx = x0 + L / 2, sy = y0 + H * 0.12;
    g.beginPath(); g.arc(sx, sy, H * 0.028, 0, 7); g.fill();
    for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2; g.beginPath(); g.moveTo(sx + Math.cos(a) * H * 0.045, sy + Math.sin(a) * H * 0.045); g.lineTo(sx + Math.cos(a) * H * 0.065, sy + Math.sin(a) * H * 0.065); g.stroke(); }
    g.fillStyle = encre; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    let t = H * 0.4; g.font = `800 ${t}px Bricolage, "Arial Black", sans-serif`;
    while (g.measureText(initiales).width > L * 0.8 && t > 10) { t -= 2; g.font = `800 ${t}px Bricolage, "Arial Black", sans-serif`; }
    g.fillText(initiales, sx, y0 + H * 0.5);
    t = H * 0.085; g.font = `750 ${t}px Bricolage, Arial, sans-serif`;
    while (g.measureText(metier).width > L * 0.84 && t > 8) { t -= 1; g.font = `750 ${t}px Bricolage, Arial, sans-serif`; }
    g.fillText(metier, sx, y0 + H * 0.64);
    if (ville || opt.bas) {
      const bas = ville || opt.bas;
      g.fillStyle = '#FFFFFF'; t = H * 0.075; g.font = `750 ${t}px Bricolage, Arial, sans-serif`;
      while (g.measureText(bas).width > L * 0.84 && t > 8) { t -= 1; g.font = `750 ${t}px Bricolage, Arial, sans-serif`; }
      g.fillText(bas, sx, y0 + H * 0.905);
    }
    g.restore();
  };
  const etiquette = (l = 1024, h = 512, opt = {}) => enCouleur(toile(l, h, (g) => {
    if (opt.autour) { g.fillStyle = opt.autour; g.fillRect(0, 0, l, h); }
    const m = opt.marge ?? 0;
    ecrireEtiquette(g, m, m, l - 2 * m, h - 2 * m, opt);
  }));

  // ------------------------------------------------------------ matières
  const M = {
    email: (c, r = 0.42, densite = 1) => new THREE.MeshPhysicalMaterial({ map: mouchete(c, densite), roughness: r, roughnessMap: bruit(128, 2, 0.35), clearcoat: 1, clearcoatRoughness: 0.06, envMapIntensity: 1 }),
    argile: () => new THREE.MeshPhysicalMaterial({ color: '#D9C2A3', roughness: 0.95, bumpMap: repete(bruit(256, 0.6, 1), 3, 1), bumpScale: 1.2, envMapIntensity: 0.6 }),
    bronze: () => new THREE.MeshPhysicalMaterial({ color: '#D3A04A', metalness: 1, roughness: 0.36, roughnessMap: repete(bruit(256, 3, 0.9), 2, 2), bumpMap: repete(toile(256, 256, (g, l) => {
      g.fillStyle = '#808080'; g.fillRect(0, 0, l, l);
      for (let i = 0; i < 260; i++) { const x = hasard() * l, y = hasard() * l, r = 4 + hasard() * 9; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, '#4a4a4a'); gr.addColorStop(1, 'rgba(128,128,128,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
    }), 3, 2), bumpScale: 0.9, envMapIntensity: 1.55 }),
    cire: (c = '#FFF4E6') => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.32, roughnessMap: toile(256, 256, (g, l) => {
      // la flaque fondue autour de la mèche est plus brillante
      const gr = g.createRadialGradient(l / 2, l / 2, 0, l / 2, l / 2, l / 2); gr.addColorStop(0, '#303030'); gr.addColorStop(0.45, '#4a4a4a'); gr.addColorStop(0.62, '#d0d0d0'); gr.addColorStop(1, '#e8e8e8');
      g.fillStyle = gr; g.fillRect(0, 0, l, l);
    }), sheen: 0.5, sheenColor: col('#FFE8C8'), sheenRoughness: 0.4, emissive: col('#FFB36A'), emissiveIntensity: 0.1, envMapIntensity: 0.85 }),
    tissu: (c, fin = 4, rep = 4, relief = 1.3) => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.9, sheen: 1, sheenColor: col(melange(c, '#ffffff', 0.5)), sheenRoughness: 0.5, bumpMap: repete(tissage(fin), rep), bumpScale: relief, envMapIntensity: 0.8 }),
    eponge: (c, rep = 3) => new THREE.MeshPhysicalMaterial({ color: c, roughness: 1, sheen: 1, sheenColor: col(melange(c, '#ffffff', 0.6)), sheenRoughness: 0.75, bumpMap: repete(bouclettes(), rep), bumpScale: 2.6, envMapIntensity: 0.65 }),
    mousse: (c) => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.62, bumpMap: repete(bruit(256, 0.7, 0.8), 6), bumpScale: 0.7, sheen: 0.35, sheenColor: col('#ffffff'), clearcoat: 0.15, clearcoatRoughness: 0.5, envMapIntensity: 0.9 }),
    liege: () => { const t = liegeCouleur(); return new THREE.MeshPhysicalMaterial({ map: t, roughness: 0.9, bumpMap: t, bumpScale: 2.2, envMapIntensity: 0.7 }); },
    bois: (base, l, h) => { const t = boisCouleur(base, l, h); return new THREE.MeshPhysicalMaterial({ map: t, roughness: 0.5, clearcoat: 0.35, clearcoatRoughness: 0.35, bumpMap: t, bumpScale: 0.3, envMapIntensity: 0.95 }); },
    papier: (t, r = 0.62) => new THREE.MeshPhysicalMaterial({ map: t, roughness: r, sheen: 0.2, sheenColor: col('#ffffff'), envMapIntensity: 0.85 }),
    imprime: (t, r = 0.35) => new THREE.MeshPhysicalMaterial({ map: t, transparent: true, alphaTest: 0.04, roughness: r, clearcoat: 1, clearcoatRoughness: 0.08, polygonOffset: true, polygonOffsetFactor: -2, depthWrite: false, envMapIntensity: 1 }),
    decal: (t, r = 0.8) => new THREE.MeshPhysicalMaterial({ map: t, transparent: true, roughness: r, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, envMapIntensity: 0.8 }),
    feuille: (c) => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.42, sheen: 0.6, sheenColor: col('#d8ffd0'), sheenRoughness: 0.5, side: THREE.DoubleSide, clearcoat: 0.3, envMapIntensity: 1 }),
    liquide: (c) => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.16, clearcoat: 0.45, clearcoatRoughness: 0.05, emissive: col(c), emissiveIntensity: 0.22, envMapIntensity: 0.4 }),
    terreau: () => new THREE.MeshPhysicalMaterial({ color: '#3A291C', roughness: 1, bumpMap: repete(bruit(256, 0.5, 1.2), 2), bumpScale: 3, envMapIntensity: 0.4 }),
  };

  // ------------------------------------------------------------ outils de forme
  const tourner = (pts, n = seg) => new THREE.LatheGeometry(pts.map(([x, y]) => V2(Math.max(0.0005, x), y)), n);
  const lisser = (pts, n) => new THREE.SplineCurve(pts.map(([x, y]) => V2(x, y))).getPoints(n).map((p) => [p.x, p.y]);
  const maille = (g, m) => new THREE.Mesh(g, m);
  const bande = (r, h, y, arc, mat, debut) => { const m = maille(new THREE.CylinderGeometry(r, r, h, seg, 1, true, debut ?? -arc / 2, arc), mat); m.position.y = y; return m; };
  // une étiquette collée (ou imprimée) sur un cylindre, face à nous, sans déformation du texte
  const etiquetteCylindre = (r, h, y, largeur, imprimee = false, opt = {}) => {
    const arc = Math.PI, lpx = 1536, hpx = Math.round(lpx * h / (arc * r)), Lpx = Math.round(lpx * largeur / (arc * r));
    const t = enCouleur(toile(lpx, hpx, (c) => ecrireEtiquette(c, (lpx - Lpx) / 2, hpx * 0.04, Lpx, hpx * 0.92, opt)));
    const mat = new THREE.MeshPhysicalMaterial({ map: t, alphaTest: 0.5, roughness: imprimee ? 0.3 : 0.62, clearcoat: imprimee ? 1 : 0, clearcoatRoughness: 0.08, sheen: imprimee ? 0 : 0.2, polygonOffset: true, polygonOffsetFactor: -2, envMapIntensity: 0.9 });
    return bande(r, h, y, arc, mat);
  };
  // tube dont le rayon varie le long du chemin (bec de théière, anse)
  const tubeVariable = (points, rayon, n = 48, rad = 18) => {
    const courbe = new THREE.CatmullRomCurve3(points.map(([x, y, z]) => V3(x, y, z)));
    const g = new THREE.TubeGeometry(courbe, n, 1, rad, false);
    const p = g.attributes.position, c = V3(0, 0, 0), v = V3(0, 0, 0);
    for (let i = 0; i <= n; i++) {
      const t = i / n; courbe.getPointAt(t, c); const r = rayon(t);
      for (let j = 0; j <= rad; j++) { const k = i * (rad + 1) + j; v.fromBufferAttribute(p, k).sub(c).multiplyScalar(r).add(c); p.setXYZ(k, v.x, v.y, v.z); }
    }
    g.computeVertexNormals();
    return g;
  };
  const normaliser = (g) => {
    g.updateMatrixWorld(true);
    const b = new THREE.Box3().setFromObject(g);
    const t = V3(0, 0, 0); b.getSize(t);
    const c = V3(0, 0, 0); b.getCenter(c);
    g.position.sub(c);
    const pivot = new THREE.Group(); pivot.add(g); pivot.scale.setScalar(1 / Math.max(t.x, t.y, t.z));
    const conteneur = new THREE.Group(); conteneur.add(pivot);
    conteneur.userData.proportions = [t.x, t.y, t.z].map((v) => v / Math.max(t.x, t.y, t.z));
    // ombres : tout ce qui est opaque porte et reçoit
    conteneur.traverse((o) => { if (o.isMesh) { o.castShadow = !o.material.transparent && !o.userData.sansOmbre; o.receiveShadow = !o.userData.sansOmbre; } });
    return conteneur;
  };
  const rectArrondi = (l, h, r) => {
    const s = new THREE.Shape();
    s.moveTo(-l / 2 + r, -h / 2); s.lineTo(l / 2 - r, -h / 2); s.quadraticCurveTo(l / 2, -h / 2, l / 2, -h / 2 + r);
    s.lineTo(l / 2, h / 2 - r); s.quadraticCurveTo(l / 2, h / 2, l / 2 - r, h / 2); s.lineTo(-l / 2 + r, h / 2);
    s.quadraticCurveTo(-l / 2, h / 2, -l / 2, h / 2 - r); s.lineTo(-l / 2, -h / 2 + r); s.quadraticCurveTo(-l / 2, -h / 2, -l / 2 + r, -h / 2);
    return s;
  };
  const pave = (l, h, p, r, biseau = 0.012, seg2 = 4) => {
    const g = new THREE.ExtrudeGeometry(rectArrondi(l - 2 * biseau, h - 2 * biseau, Math.max(0.001, r - biseau)), { depth: p - 2 * biseau, bevelEnabled: true, bevelThickness: biseau, bevelSize: biseau, bevelSegments: seg2, curveSegments: 10 });
    g.translate(0, 0, -(p - 2 * biseau) / 2);
    return g;
  };
  // pavé aux arêtes vraiment arrondies, avec une texture posée face par face (pas étirée sur les bords comme
  // celle d'un ExtrudeGeometry) : boîte unité subdivisée, sommets resserrés près des arêtes puis arrondis
  const paveDoux = (l, h, p, r, n = leger ? 16 : 24) => {
    const g = new THREE.BoxGeometry(2, 2, 2, n, n, n);
    const pos = g.attributes.position, nor = g.attributes.normal;
    const demi = [l / 2, h / 2, p / 2], a = 0.55;
    const plie = (t, k) => { const s = Math.sign(t), u = Math.abs(t), int = demi[k] - r; return s * (u < a ? (u / a) * int : int + ((u - a) / (1 - a)) * r); };
    const v = V3(0, 0, 0), c = V3(0, 0, 0), dd = V3(0, 0, 0);
    for (let i = 0; i < pos.count; i++) {
      v.set(plie(pos.getX(i), 0), plie(pos.getY(i), 1), plie(pos.getZ(i), 2));
      c.set(Math.max(-demi[0] + r, Math.min(demi[0] - r, v.x)), Math.max(-demi[1] + r, Math.min(demi[1] - r, v.y)), Math.max(-demi[2] + r, Math.min(demi[2] - r, v.z)));
      dd.copy(v).sub(c);
      if (dd.lengthSq() > 1e-12) { dd.normalize(); v.copy(c).addScaledVector(dd, r); nor.setXYZ(i, dd.x, dd.y, dd.z); }
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    return g;
  };
  // rouleau en vraie spirale (tapis, serviette) : on voit les couches au bout
  const spirale = (rExt, ep, tours, longueur, ecart = 1.12) => {
    const s = new THREE.Shape(), n = Math.round(tours * (leger ? 48 : 72)), pas = ep * ecart;
    const r = (a) => rExt - (pas * a) / (Math.PI * 2);
    const amax = tours * Math.PI * 2;
    const ext = [], int = [];
    for (let i = 0; i <= n; i++) { const a = (i / n) * amax; ext.push([Math.cos(-a) * r(a), Math.sin(-a) * r(a)]); int.push([Math.cos(-a) * (r(a) - ep), Math.sin(-a) * (r(a) - ep)]); }
    s.moveTo(...ext[0]); ext.forEach((p) => s.lineTo(...p)); int.reverse().forEach((p) => s.lineTo(...p)); s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: longueur, bevelEnabled: true, bevelThickness: ep * 0.3, bevelSize: ep * 0.28, bevelSegments: 3, curveSegments: 4 });
    g.translate(0, 0, -longueur / 2);
    return g;
  };
  const vapeur = () => {
    const mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, uniforms: { uTemps: { value: 0 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: `uniform float uTemps; varying vec2 vUv;
        float h(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1)))*43758.5); }
        float b(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y); }
        void main(){ vec2 p = vUv; float t = uTemps*0.3;
          float x = p.x - 0.5 + sin(p.y*6.0 - t*3.0)*0.12*p.y + (b(vec2(p.y*3.0 - t*1.2, 1.0))-0.5)*0.3*p.y;
          float filet = smoothstep(0.16 + 0.14*p.y, 0.0, abs(x)) * smoothstep(0.0, 0.25, p.y) * smoothstep(1.0, 0.35, p.y);
          float a = filet * smoothstep(0.25, 0.85, b(vec2(p.x*5.0, p.y*4.0 - t*2.0))) * 0.3;
          gl_FragColor = vec4(vec3(1.0), a); }`,
    });
    const g = new THREE.Group();
    for (let i = 0; i < 2; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.7), mat); m.position.set((i - 0.5) * 0.1, 0.35, 0); m.scale.x = i ? -1 : 1; m.userData.sansOmbre = true; g.add(m); }
    g.userData.mat = mat; g.userData.face = true; g.userData.vapeur = true;
    return g;
  };
  const flamme = () => {
    const g = new THREE.Group();
    const mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, uniforms: { uTemps: { value: 0 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: `uniform float uTemps; varying vec2 vUv;
        void main(){ vec2 p = vUv - vec2(0.5, 0.26); p.x += sin(uTemps*5.0 + p.y*8.0)*0.018*p.y*3.0;
          float r = length(vec2(p.x*2.4, p.y < 0.0 ? p.y*2.3 : p.y*0.82));
          float a = smoothstep(0.42, 0.02, r);
          vec3 c = mix(vec3(1.0,0.5,0.12), vec3(1.0,0.97,0.86), smoothstep(0.26, 0.0, r));
          c = mix(c, vec3(0.3,0.5,1.0), smoothstep(-0.04,-0.2,p.y)*0.5);
          gl_FragColor = vec4(min(c*1.1, vec3(1.0)), a); }`,
    });
    const coeur = new THREE.Mesh(new THREE.PlaneGeometry(0.11, 0.26), mat); coeur.userData.sansOmbre = true; g.add(coeur);
    const halo = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uTemps: mat.uniforms.uTemps },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: 'uniform float uTemps; varying vec2 vUv; void main(){ float d = length(vUv-0.5); float a = exp(-d*d*24.0)*(0.26+0.03*sin(uTemps*7.0)); gl_FragColor = vec4(vec3(1.0,0.72,0.36)*a, a); }',
    }));
    halo.userData.sansOmbre = true; g.add(halo);
    g.userData.mat = mat; g.userData.face = true;
    return g;
  };
  // une anse en oreille (tasse, mug, théière)
  const anse = (pts, r, mat, aplati = 0.75) => { const m = maille(tubeVariable(pts, (t) => r * (0.82 + 0.18 * Math.sin(Math.PI * t)), 40, 16), mat); m.scale.z = aplati; return m; };

  // ------------------------------------------------------------ les objets
  const B = {
    // sachet de tisane en papier kraft, à soufflet, haut soudé et cranté, étiquette à son nom
    sachet() {
      const g = new THREE.Group();
      const geo = new THREE.BoxGeometry(0.7, 1, 0.24, 36, 56, 4);
      const p = geo.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
        const t = 0.5 - y; // 0 en haut, 1 en bas
        // plat et soudé en haut, gonflé au milieu, soufflet ouvert en bas
        const gonfle = Math.pow(Math.min(1, Math.max(0, (t - 0.07) / 0.5)), 0.6) * (1 - 0.18 * Math.max(0, (t - 0.82) / 0.18));
        const bord = Math.max(0, 1 - Math.pow(Math.abs(x) / 0.35, 8));
        const pli = Math.sin(x * 23 + y * 9) * 0.0025 + Math.sin(x * 7 - y * 13) * 0.003;
        p.setZ(i, Math.sign(z) * (0.004 + 0.115 * gonfle * Math.sqrt(bord)) + pli * t);
        p.setX(i, x * (1 + 0.05 * Math.max(0, t - 0.6)) + Math.sin(y * 17) * 0.002);
      }
      geo.computeVertexNormals();
      const fibres = (etiq) => {
        const t = enCouleur(toile(512, 732, (c, l, h) => {
          c.drawImage(kraftCouleur('#B48A5A', l, h).image, 0, 0);
          // bande soudée et crantée du haut, déchirure
          c.fillStyle = 'rgba(70,44,20,0.16)'; c.fillRect(0, 0, l, h * 0.085);
          for (let x = 0; x < l; x += 5) { c.fillStyle = 'rgba(60,35,15,0.2)'; c.fillRect(x, h * 0.005, 2, h * 0.07); }
          c.fillStyle = 'rgba(50,30,12,0.35)'; c.fillRect(0, h * 0.13, l, 3);
          c.fillStyle = 'rgba(255,240,220,0.25)'; c.fillRect(0, h * 0.135, l, 2);
          if (etiq) ecrireEtiquette(c, l * 0.13, h * 0.3, l * 0.74, h * 0.44);
          else { c.fillStyle = O.bande; c.globalAlpha = 0.9; c.beginPath(); c.arc(l / 2, h * 0.5, l * 0.14, 0, 7); c.fill(); c.globalAlpha = 1; }
        }));
        return new THREE.MeshPhysicalMaterial({ map: t, roughness: 0.84, sheen: 0.4, sheenColor: col('#fff1dc'), sheenRoughness: 0.7, bumpMap: kraftCouleur('#808080', 256, 256), bumpScale: 0.6, envMapIntensity: 0.85 });
      };
      const dos = fibres(false);
      g.add(maille(geo, [dos, dos, dos, dos, fibres(nomme === 'sachet'), dos]));
      g.rotation.set(0.04, -0.22, 0.02);
      return normaliser(g);
    },

    // théière en grès émaillé : panse ronde, bec effilé, anse, couvercle à bouton
    theiere() {
      const g = new THREE.Group();
      const email = M.email(O.glacure, 0.38);
      const corps = [[0.001, 0.012], [0.15, 0.012], [0.16, 0], [0.18, 0.0], [0.19, 0.014], [0.24, 0.05], [0.29, 0.11], [0.318, 0.18], [0.322, 0.25], [0.305, 0.32], [0.26, 0.385], [0.2, 0.425], [0.168, 0.435], [0.164, 0.45], [0.152, 0.452], [0.148, 0.43]];
      g.add(maille(tourner(corps.slice(2)), email));
      g.add(maille(tourner(corps.slice(0, 4)), M.argile()));
      const couvercle = [[0.001, 0.505], [0.07, 0.5], [0.13, 0.482], [0.162, 0.462], [0.165, 0.452], [0.14, 0.446], [0.136, 0.42], [0.125, 0.418], [0.12, 0.44], [0.001, 0.45]];
      g.add(maille(tourner(couvercle), email));
      g.add(maille(tourner([[0.001, 0.498], [0.03, 0.5], [0.042, 0.52], [0.04, 0.545], [0.026, 0.56], [0.001, 0.563]]), M.email(O.vif, 0.3)));
      g.add(maille(tubeVariable([[0.24, 0.13, 0], [0.33, 0.18, 0], [0.4, 0.28, 0], [0.44, 0.38, 0], [0.47, 0.44, 0]], (t) => 0.06 - 0.038 * Math.pow(t, 0.8), 48, 20), email));
      g.add(anse([[-0.29, 0.34, 0], [-0.4, 0.36, 0], [-0.47, 0.27, 0], [-0.43, 0.15, 0], [-0.3, 0.1, 0]], 0.026, email));
      g.rotation.set(0.16, -0.32, 0);
      return normaliser(g);
    },

    // tasse de tisane sur sa soucoupe, pied d'argile brute, quelques fleurs séchées qui flottent
    tasse() {
      const g = new THREE.Group();
      const email = M.email(O.vif, 0.36);
      const pied = [[0.001, 0.04], [0.1, 0.04], [0.105, 0.028], [0.112, 0.028], [0.12, 0.034]];
      const corps = [[0.12, 0.034], [0.128, 0.046], [0.16, 0.075], [0.205, 0.12], [0.238, 0.18], [0.257, 0.25], [0.265, 0.31], [0.267, 0.352], [0.263, 0.362], [0.255, 0.363], [0.25, 0.352], [0.247, 0.31], [0.238, 0.25], [0.218, 0.18], [0.182, 0.125], [0.13, 0.09], [0.001, 0.08]];
      g.add(maille(tourner(pied), M.argile()));
      g.add(maille(tourner(corps), email));
      const the = maille(new THREE.CircleGeometry(0.243, seg), M.liquide('#9A5216')); the.rotation.x = -Math.PI / 2; the.position.y = 0.305; g.add(the);
      for (const [x, z, r, c] of [[0.07, 0.05, 0.4, '#E9C46A'], [-0.08, -0.04, 2.2, '#7FA552'], [0.0, -0.1, 1.1, '#D96B8A']]) {
        const f = maille(new THREE.SphereGeometry(0.034, 16, 10), M.feuille(c)); f.scale.set(1, 0.25, 0.6); f.rotation.y = r; f.position.set(x, 0.307, z); g.add(f);
      }
      g.add(anse([[0.257, 0.3, 0], [0.33, 0.31, 0], [0.37, 0.24, 0], [0.335, 0.165, 0], [0.24, 0.155, 0]], 0.019, email));
      const soucoupe = [[0.001, 0.012], [0.13, 0.012], [0.135, 0.0], [0.15, 0.0], [0.158, 0.012], [0.25, 0.026], [0.34, 0.046], [0.385, 0.062], [0.392, 0.07], [0.386, 0.075], [0.37, 0.07], [0.3, 0.052], [0.17, 0.04], [0.001, 0.038]];
      const sc = maille(tourner(soucoupe), M.email(O.glacure2, 0.3, 0.6)); sc.position.y = -0.0; g.add(sc);
      const n = normaliser(g);
      const v = vapeur(); v.position.y = 0.37; g.add(v); n.userData.anime = [v];
      return n;
    },

    // mug émaillé, l'impression à son nom directement sur l'émail
    mug() {
      const g = new THREE.Group();
      const email = M.email(O.glacure, 0.36);
      const pied = [[0.001, 0.02], [0.17, 0.02], [0.176, 0.004], [0.19, 0.0], [0.2, 0.008]];
      const corps = [[0.2, 0.008], [0.207, 0.03], [0.212, 0.3], [0.214, 0.52], [0.212, 0.548], [0.204, 0.556], [0.196, 0.552], [0.192, 0.53], [0.19, 0.08], [0.17, 0.06], [0.001, 0.055]];
      g.add(maille(tourner(pied), M.argile()));
      g.add(maille(tourner(corps), email));
      const cafe = maille(new THREE.CircleGeometry(0.191, seg), M.liquide('#8A4B22')); cafe.rotation.x = -Math.PI / 2; cafe.position.y = 0.47; g.add(cafe);
      g.add(anse([[0.21, 0.45, 0], [0.3, 0.46, 0], [0.34, 0.33, 0], [0.3, 0.17, 0], [0.21, 0.15, 0]], 0.03, email));
      if (nomme === 'mug') {
        g.add(etiquetteCylindre(0.2155, 0.34, 0.29, 0.42, true));
      } else {
        const t = enCouleur(toile(1024, 128, (c, l, h) => { c.fillStyle = O.vif; c.fillRect(0, h * 0.3, l, h * 0.4); }));
        g.add(bande(0.2152, 0.08, 0.42, Math.PI * 2, M.imprime(t), 0));
      }
      g.rotation.set(0.12, nomme === 'mug' ? 0.25 : -0.5, 0);
      return normaliser(g);
    },

    // bougie coulée dans un pot de grès, cire avec sa flaque fondue, mèche, flamme, étiquette à son nom
    bougie() {
      const g = new THREE.Group();
      const email = M.email(O.glacure, 0.5, 1.3);
      const pied = [[0.001, 0.025], [0.36, 0.025], [0.37, 0.004], [0.4, 0.0], [0.42, 0.012]];
      const pot = [[0.42, 0.012], [0.437, 0.04], [0.447, 0.1], [0.452, 0.5], [0.452, 0.6], [0.449, 0.63], [0.44, 0.642], [0.428, 0.64], [0.42, 0.62], [0.418, 0.1], [0.4, 0.07], [0.001, 0.06]];
      g.add(maille(tourner(pied), M.argile()));
      g.add(maille(tourner(pot), email));
      g.add(maille(tourner(lisser([[0.001, 0.556], [0.12, 0.552], [0.28, 0.555], [0.38, 0.562], [0.412, 0.575], [0.42, 0.586]], 24)), M.cire(O.cire || '#FFF2E0')));
      const meche = maille(tubeVariable([[0, 0.55, 0], [0.004, 0.58, 0], [0.012, 0.61, 0.002], [0.022, 0.625, 0.004]], (t) => 0.0065 - 0.002 * t, 12, 8), new THREE.MeshStandardMaterial({ color: '#1d1714', roughness: 0.9 }));
      g.add(meche);
      if (nomme === 'bougie') {
        g.add(etiquetteCylindre(0.4535, 0.34, 0.33, 0.58));
      } else {
        const t = enCouleur(toile(512, 64, (c, l, h) => { c.fillStyle = O.vif; c.fillRect(0, 0, l, h); }));
        g.add(bande(0.4532, 0.05, 0.4, Math.PI * 2, M.papier(t, 0.5), 0));
      }
      g.rotation.set(0.42, nomme === 'bougie' ? 0.3 : -0.25, 0);
      const n = normaliser(g);
      const f = flamme(); f.position.set(0.024, 0.69, 0.004); f.scale.setScalar(1.25); g.add(f); n.userData.anime = [f];
      return n;
    },

    // coussin moelleux : deux faces gonflées cousues ensemble, coins en « oreilles », bouton capitonné au centre,
    // passepoil tout autour. Lisible au premier coup d'œil (le zafu rond ressemblait à un couvercle).
    coussin() {
      const g = new THREE.Group();
      const n = leger ? 44 : 72;
      const geo = new THREE.BoxGeometry(1, 1, 0.2, n, n, 4);
      const p = geo.attributes.position;
      const forme = (x, y) => {
        const u = 2 * x, v = 2 * y;
        const gonfle = Math.pow(Math.max(0, 1 - u * u), 0.5) * Math.pow(Math.max(0, 1 - v * v), 0.5);
        // bords rentrés au milieu des côtés, coins qui pointent
        const rx = 1 - 0.075 * (1 - v * v), ry = 1 - 0.075 * (1 - u * u);
        const creux = 0.045 * Math.exp(-(u * u + v * v) / 0.025);
        return { x: x * rx, y: y * ry, e: 0.012 + 0.2 * Math.pow(gonfle, 0.8) - creux * gonfle, gonfle, u, v };
      };
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
        const f = forme(x, y);
        const pli = (Math.sin(f.u * 7 + f.v * 3) * 0.004 + Math.sin(f.u * 3 - f.v * 11) * 0.003) * f.gonfle;
        p.setXYZ(i, f.x, f.y, (z / 0.1) * f.e + Math.sign(z) * pli);
      }
      geo.computeVertexNormals();
      const tissu = M.tissu(O.glacure, 3, 7, 1.3);
      g.add(maille(geo, tissu));
      // passepoil : un cordon qui suit la couture
      const tour = [];
      for (let k = 0; k < 160; k++) {
        const t = (k / 160) * Math.PI * 2 - Math.PI / 4, c = Math.cos(t), s = Math.sin(t);
        const m = Math.max(Math.abs(c), Math.abs(s));
        const f = forme((0.5 * c) / m * 0.999, (0.5 * s) / m * 0.999);
        tour.push(V3(f.x, f.y, 0));
      }
      const corde = new THREE.CatmullRomCurve3(tour.slice(0, 160), true);
      g.add(maille(new THREE.TubeGeometry(corde, 320, 0.014, 10, true), M.tissu(O.vif, 2, 12, 0.6)));
      for (const z of [1, -1]) {
        const b = maille(new THREE.SphereGeometry(0.03, 24, 14), M.tissu(O.vif, 2, 1, 0.5));
        b.scale.z = 0.45; b.position.z = z * (0.012 + 0.2 - 0.045 + 0.004); g.add(b);
      }
      g.rotation.set(-0.42, 0.22, 0.2);
      return normaliser(g);
    },
    zafu() { return this.coussin(); },

    // carnet relié toile : couvertures, dos arrondi, tranche de pages, élastique, signet, étiquette à son nom
    carnet() {
      const g = new THREE.Group();
      const toileC = M.tissu(O.glacure, 3, 5, 0.9);
      const L = 0.62, H = 0.86;
      for (const z of [-0.052, 0.052]) { const c = maille(pave(L, H, 0.018, 0.04, 0.006, 3), toileC); c.position.set(0, 0, z); g.add(c); }
      const dos = maille(new THREE.CylinderGeometry(0.06, 0.06, H, 32, 1, true, Math.PI, Math.PI), toileC); dos.position.set(-L / 2 + 0.02, 0, 0); dos.scale.set(0.5, 1, 1); g.add(dos);
      const tranche = enCouleur(toile(64, 512, (c, l, h) => { c.fillStyle = '#F7F0E2'; c.fillRect(0, 0, l, h); for (let x = 0; x < l; x += 2) { c.fillStyle = `rgba(150,130,100,${0.12 + hasard() * 0.15})`; c.fillRect(x, 0, 1, h); } }));
      const papier = new THREE.MeshPhysicalMaterial({ color: '#FBF5E8', roughness: 0.85, envMapIntensity: 0.8 });
      const bord = new THREE.MeshPhysicalMaterial({ map: tranche, roughness: 0.9, envMapIntensity: 0.8 });
      const pages = maille(new THREE.BoxGeometry(L - 0.03, H - 0.026, 0.087), [bord, papier, bord, bord, papier, papier]);
      pages.position.x = 0.012; g.add(pages);
      const elastique = maille(pave(0.026, H + 0.012, 0.128, 0.008, 0.004, 2), M.tissu(O.vif, 2, 1, 0.5)); elastique.position.x = L / 2 - 0.07; g.add(elastique);
      const signet = maille(new THREE.PlaneGeometry(0.022, 0.16, 1, 8), new THREE.MeshPhysicalMaterial({ color: O.bande, roughness: 0.5, sheen: 1, sheenColor: col('#ffffff'), side: THREE.DoubleSide }));
      const sp = signet.geometry.attributes.position; for (let i = 0; i < sp.count; i++) { const y = sp.getY(i); sp.setZ(i, Math.pow((0.08 - y) / 0.16, 2) * 0.05); }
      signet.geometry.computeVertexNormals(); signet.position.set(-0.05, -H / 2 - 0.07, 0.02); g.add(signet);
      if (nomme === 'carnet') {
        const t = etiquette(1024, 600, { marge: 0 });
        const et = maille(new THREE.PlaneGeometry(0.42, 0.246), M.papier(t, 0.55)); et.position.set(-0.03, 0.12, 0.0615 + 0.0005); g.add(et);
      } else {
        const t = enCouleur(toile(256, 256, (c, l) => { c.strokeStyle = O.vif; c.lineWidth = 10; c.beginPath(); c.arc(l / 2, l / 2, l * 0.36, 0, 7); c.stroke(); }));
        const et = maille(new THREE.PlaneGeometry(0.22, 0.22), M.decal(t, 0.6)); et.position.set(-0.04, 0.16, 0.0615 + 0.0005); g.add(et);
      }
      g.rotation.set(-0.08, -0.28, -0.05);
      return normaliser(g);
    },

    // savon artisanal teinté, initiales en relief, bande de papier à son nom, porte-savon en bois à lattes
    savon() {
      const g = new THREE.Group();
      const geo = new THREE.SphereGeometry(1, leger ? 56 : 88, leger ? 36 : 60);
      const p = geo.attributes.position;
      const f = (v) => Math.sign(v) * Math.pow(Math.abs(v), 0.26);
      for (let i = 0; i < p.count; i++) p.setXYZ(i, f(p.getX(i)) * 0.33, f(p.getY(i)) * 0.105, f(p.getZ(i)) * 0.215);
      geo.computeVertexNormals();
      const teinte = melange(O.glacure, '#ffffff', 0.38);
      const grains = enCouleur(toile(512, 256, (c, l, h) => {
        c.fillStyle = teinte; c.fillRect(0, 0, l, h);
        for (let i = 0; i < 700; i++) { c.fillStyle = hasard() < 0.6 ? `rgba(70,90,40,${0.25 + hasard() * 0.4})` : `rgba(120,60,90,${0.2 + hasard() * 0.3})`; c.beginPath(); c.ellipse(hasard() * l, hasard() * h, 0.6 + hasard() * 1.6, 0.4 + hasard(), hasard() * 3, 0, 7); c.fill(); }
      }));
      g.add(maille(geo, new THREE.MeshPhysicalMaterial({ map: grains, roughness: 0.5, sheen: 0.7, sheenColor: col('#ffffff'), sheenRoughness: 0.55, clearcoat: 0.3, clearcoatRoughness: 0.4, envMapIntensity: 0.9 })));
      const avecBande = nomme === 'savon';
      const gravure = enCouleur(toile(512, 256, (c, l, h) => {
        c.fillStyle = melange(teinte, '#000000', 0.32); c.textAlign = 'center'; c.textBaseline = 'middle';
        c.font = `800 ${h * 0.5}px Bricolage, "Arial Black", sans-serif`; c.fillText(initiales, l / 2, h * 0.5);
      }));
      const grave = maille(new THREE.PlaneGeometry(0.26, 0.13), M.decal(gravure, 0.6)); grave.rotation.x = -Math.PI / 2; grave.position.set(avecBande ? -0.18 : 0, 0.1065, 0); g.add(grave);
      if (avecBande) {
        // bande de papier qui fait le tour du savon (vue de dessus : l'étiquette)
        const anneau = rectArrondi(0.452, 0.234, 0.08);
        anneau.holes.push(new THREE.Path(rectArrondi(0.438, 0.22, 0.074).getPoints(24)));
        const tour = new THREE.ExtrudeGeometry(anneau, { depth: 0.28, bevelEnabled: false, curveSegments: 16 });
        tour.translate(0, 0, -0.14);
        const kraft = new THREE.MeshPhysicalMaterial({ map: enCouleur(kraftCouleur('#C9A574', 256, 256)), roughness: 0.85, envMapIntensity: 0.8 });
        const tb = maille(tour, kraft); tb.rotation.y = Math.PI / 2; tb.position.x = 0.12; g.add(tb);
        const et = maille(new THREE.PlaneGeometry(0.28, 0.43), M.papier(enCouleur(toile(560, 860, (c, l, h) => {
          c.drawImage(kraftCouleur('#C9A574', l, h).image, 0, 0);
          ecrireEtiquette(c, l * 0.06, h * 0.08, l * 0.88, h * 0.84);
        })), 0.75));
        et.rotation.x = -Math.PI / 2; et.position.set(0.12, 0.1175, 0); g.add(et);
      }
      const bois = M.bois('#B5804A', 512, 128);
      for (let k = -2; k <= 2; k++) { const l = maille(pave(0.84, 0.036, 0.07, 0.012, 0.006, 2), bois); l.rotation.x = Math.PI / 2; l.position.set(0, -0.128, k * 0.104); g.add(l); }
      for (const x of [-0.31, 0.31]) { const p2 = maille(pave(0.07, 0.05, 0.58, 0.014, 0.006, 2), bois); p2.position.set(x, -0.168, 0); g.add(p2); }
      g.rotation.set(0.66, -0.34, 0);
      return normaliser(g);
    },

    // serviette en éponge roulée, liteaux tissés aux bouts, bande de papier à son nom
    serviette() {
      const g = new THREE.Group();
      // serviette de spa : éponge blanc cassé, deux liteaux tissés de la couleur des objets près des bouts
      const teinte = O.glacure2;
      const eponge = M.eponge(teinte, 2.5);
      const liteau = enCouleur(toile(64, 512, (c, l, h) => {
        c.fillStyle = teinte; c.fillRect(0, 0, l, h);
        c.fillStyle = O.glacure; for (const v of [0.31, 0.95]) c.fillRect(0, h * (1 - v), l, h * 0.04);
      }));
      liteau.wrapS = liteau.wrapT = THREE.RepeatWrapping;
      const cote = new THREE.MeshPhysicalMaterial({ map: liteau, color: '#ffffff', roughness: 1, sheen: 1, sheenColor: col(melange(teinte, '#ffffff', 0.6)), sheenRoughness: 0.75, bumpMap: repete(bouclettes(), 3), bumpScale: 2.6, envMapIntensity: 0.65 });
      const rouleau = maille(spirale(0.2, 0.032, 3.6, 0.74, 1.32), [eponge, cote]);
      rouleau.rotation.y = Math.PI / 2; g.add(rouleau);
      if (nomme === 'serviette') {
        const t = enCouleur(toile(2048, 610, (c, l, h) => {
          c.drawImage(kraftCouleur('#CBA97A', l, h).image, 0, 0);
          c.save(); c.translate(l / 2, h / 2); c.rotate(Math.PI / 2); ecrireEtiquette(c, -h * 0.45, -230, h * 0.9, 460); c.restore();
        }));
        const bandeP = maille(new THREE.CylinderGeometry(0.214, 0.214, 0.4, seg, 1, true, -Math.PI, Math.PI * 2), M.papier(t, 0.7));
        bandeP.rotation.z = Math.PI / 2; g.add(bandeP);
      } else {
        const ruban = maille(new THREE.TorusGeometry(0.212, 0.012, 10, 96), M.tissu(O.glacure, 2, 6, 0.4)); ruban.rotation.y = Math.PI / 2; g.add(ruban);
      }
      g.rotation.set(0.28, 0.5, 0.06);
      return normaliser(g);
    },

    // sac en toile de coton, plis, ourlet piqué, impression à son nom
    sac() {
      const g = new THREE.Group();
      const geo = new THREE.BoxGeometry(0.82, 0.9, 0.12, 40, 40, 2);
      const p = geo.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
        const gonfle = Math.max(0, 1 - Math.pow(Math.abs(x) / 0.41, 4)) * Math.max(0, 1 - Math.pow(Math.abs(y) / 0.45, 6));
        const plis = Math.sin(x * 9 + y * 4) * 0.006 + Math.sin(x * 21 - y * 13) * 0.003 + Math.sin(y * 30 + x * 3) * 0.0025 * (0.45 - y);
        p.setZ(i, Math.sign(z) * (0.012 + 0.07 * Math.sqrt(gonfle)) + plis);
        p.setX(i, x * (1 - 0.03 * (y + 0.45)));
      }
      geo.computeVertexNormals();
      const ecru = O.tissu;
      const toileM = M.tissu(ecru, 3, 6, 1.2);
      const avecNom = nomme === 'sac';
      const imprime = new THREE.MeshPhysicalMaterial({ map: enCouleur(toile(512, 576, (c, l, h) => {
        c.fillStyle = ecru; c.fillRect(0, 0, l, h);
        for (let i = 0; i < 5000; i++) { c.fillStyle = `rgba(120,100,70,${hasard() * 0.1})`; c.fillRect(hasard() * l, hasard() * h, 2, 1); }
        // ourlet piqué
        c.strokeStyle = 'rgba(90,70,40,0.5)'; c.setLineDash([8, 6]); c.lineWidth = 2; c.beginPath(); c.moveTo(0, h * 0.075); c.lineTo(l, h * 0.075); c.stroke(); c.setLineDash([]);
        c.fillStyle = 'rgba(0,0,0,0.05)'; c.fillRect(0, 0, l, h * 0.09);
        // impression sérigraphiée : un grand rond et les initiales, le métier, la ville
        c.fillStyle = O.bande; c.beginPath(); c.arc(l / 2, h * 0.43, l * 0.29, 0, 7); c.fill();
        if (!avecNom) {
          // sans nom : un soleil sérigraphié, rayons et arc-en-ciel aux couleurs de la palette
          c.strokeStyle = O.bande; c.lineWidth = l * 0.03; c.lineCap = 'round';
          for (let k = 0; k < 14; k++) { const a = (k / 14) * Math.PI * 2; c.beginPath(); c.moveTo(l / 2 + Math.cos(a) * l * 0.34, h * 0.43 + Math.sin(a) * l * 0.34); c.lineTo(l / 2 + Math.cos(a) * l * 0.42, h * 0.43 + Math.sin(a) * l * 0.42); c.stroke(); }
          for (const [r, cc] of [[0.2, O.vif], [0.13, O.glacure]]) { c.strokeStyle = cc; c.lineWidth = l * 0.05; c.beginPath(); c.arc(l / 2, h * 0.5, l * r, Math.PI, 0); c.stroke(); }
          return;
        }
        c.fillStyle = ecru; c.textAlign = 'center'; c.textBaseline = 'middle';
        let t = l * 0.25; c.font = `800 ${t}px Bricolage, "Arial Black", sans-serif`;
        while (c.measureText(initiales).width > l * 0.46 && t > 10) { t -= 2; c.font = `800 ${t}px Bricolage, "Arial Black", sans-serif`; }
        c.fillText(initiales, l / 2, h * 0.44);
        c.fillStyle = O.bande; c.textBaseline = 'alphabetic';
        t = l * 0.072; c.font = `800 ${t}px Bricolage, Arial, sans-serif`;
        while (c.measureText(metier).width > l * 0.82 && t > 10) { t -= 2; c.font = `800 ${t}px Bricolage, Arial, sans-serif`; }
        c.fillText(metier, l / 2, h * 0.82);
        if (ville) { t = l * 0.05; c.font = `750 ${t}px Bricolage, Arial, sans-serif`; while (c.measureText(ville).width > l * 0.8 && t > 8) { t -= 1; c.font = `750 ${t}px Bricolage, Arial, sans-serif`; } c.fillText(ville, l / 2, h * 0.9); }
      })), roughness: 0.92, sheen: 1, sheenColor: col('#ffffff'), sheenRoughness: 0.6, bumpMap: repete(tissage(3), 6), bumpScale: 1.1, envMapIntensity: 0.8 });
      g.add(maille(geo, [toileM, toileM, toileM, toileM, imprime, toileM]));
      for (const z of [-0.055, 0.055]) {
        const anses = maille(tubeVariable([[-0.21, 0.42, z], [-0.23, 0.6, z], [-0.17, 0.82, z * 0.6], [0, 0.88, 0], [0.17, 0.82, z * 0.6], [0.23, 0.6, z], [0.21, 0.42, z]], () => 0.022, 64, 10), toileM);
        anses.scale.z = 1; g.add(anses);
      }
      g.rotation.set(0.02, -0.24, 0.03);
      return normaliser(g);
    },

    // bol chantant en bronze martelé, sur son coussin, avec son maillet
    bol() {
      const g = new THREE.Group();
      const bol = [[0.001, 0.06], [0.14, 0.058], [0.28, 0.08], [0.39, 0.14], [0.46, 0.23], [0.495, 0.33], [0.502, 0.375], [0.494, 0.384], [0.48, 0.37], [0.466, 0.3], [0.425, 0.21], [0.35, 0.135], [0.24, 0.09], [0.12, 0.075], [0.001, 0.072]];
      const b = maille(tourner(lisser(bol, 80)), M.bronze()); b.position.y = 0.1; g.add(b);
      const coussin = maille(new THREE.TorusGeometry(0.27, 0.12, 24, 96), M.tissu(O.glacure, 3, 8, 1.2)); coussin.rotation.x = Math.PI / 2; coussin.scale.z = 0.62; coussin.position.y = 0.075; g.add(coussin);
      const maillet = new THREE.Group();
      maillet.add(maille(new THREE.CylinderGeometry(0.026, 0.03, 0.78, 24), M.bois('#7A4A2A', 128, 512)));
      const tete = maille(tourner([[0.001, -0.11], [0.03, -0.108], [0.042, -0.09], [0.044, 0.09], [0.03, 0.108], [0.001, 0.11]], 32), M.tissu('#5A3B28', 2, 1, 0.6)); tete.position.y = 0.3; maillet.add(tete);
      maillet.rotation.set(0.15, -0.55, Math.PI / 2 - 0.12); maillet.position.set(0.06, 0.05, 0.47);
      g.add(maillet);
      g.rotation.set(0.42, -0.2, 0);
      return normaliser(g);
    },

    // pot à pinceaux (art-thérapie) : un pot de grès émaillé, cinq pinceaux de bois laqué, viroles de métal,
    // poils trempés de couleur ; l'étiquette à son nom sur le pot. Aucun flacon, aucun tube.
    pinceaux() {
      const g = new THREE.Group();
      const email = M.email(O.glacure, 0.38);
      const pied = [[0.001, 0.02], [0.2, 0.02], [0.206, 0.004], [0.22, 0.0], [0.23, 0.008]];
      const pot = [[0.23, 0.008], [0.238, 0.03], [0.246, 0.2], [0.25, 0.4], [0.249, 0.43], [0.242, 0.438], [0.234, 0.432], [0.23, 0.4], [0.226, 0.2], [0.22, 0.06], [0.2, 0.05], [0.001, 0.046]];
      g.add(maille(tourner(pied), M.argile()));
      g.add(maille(tourner(pot), email));
      if (nomme === 'pinceaux') g.add(etiquetteCylindre(0.2505, 0.24, 0.22, 0.5, true));
      else { const t = enCouleur(toile(1024, 128, (c, l, h) => { c.fillStyle = O.vif; c.fillRect(0, h * 0.3, l, h * 0.4); })); g.add(bande(0.2502, 0.06, 0.34, Math.PI * 2, M.imprime(t), 0)); }
      const metal = new THREE.MeshPhysicalMaterial({ color: '#C9CED6', metalness: 1, roughness: 0.28, envMapIntensity: 1.1 });
      const couleurs = [O.vif, O.glacure2 || '#E9C46A', '#2F6FD6', '#F2E8D5', '#E4572E'];
      const manches = ['#C0392B', '#F1C40F', '#1F3A5F', '#2E8B57', '#8E44AD'];
      [[-0.08, 0.02, 0.14, 1.02], [0.06, -0.05, -0.1, 0.92], [0.0, 0.07, 0.04, 1.12], [0.09, 0.05, -0.2, 0.84], [-0.05, -0.08, 0.22, 0.96]].forEach(([x, z, inc, L], i) => {
        const p = new THREE.Group();
        const manche = maille(tubeVariable([[0, 0, 0], [0, L * 0.35, 0], [0, L * 0.62, 0]], (t) => 0.016 + 0.008 * Math.sin(Math.PI * Math.min(1, t * 1.3)), 24, 12), new THREE.MeshPhysicalMaterial({ color: manches[i], roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.1, envMapIntensity: 1 }));
        p.add(manche);
        const virole = maille(new THREE.CylinderGeometry(0.017, 0.02, 0.09, 20), metal); virole.position.y = L * 0.62 + 0.04; p.add(virole);
        const poils = maille(tourner([[0.001, 0], [0.018, 0], [0.02, 0.03], [0.016, 0.07], [0.008, 0.1], [0.001, 0.115]], 20), new THREE.MeshPhysicalMaterial({ color: couleurs[i], roughness: 0.55, sheen: 0.4, envMapIntensity: 0.8 }));
        poils.position.y = L * 0.62 + 0.085; p.add(poils);
        p.position.set(x, 0.06, z); p.rotation.set(inc * 0.6, 0, inc);
        g.add(p);
      });
      g.rotation.set(0.32, nomme === 'pinceaux' ? 0.2 : -0.4, 0);
      return normaliser(g);
    },

    // brique de yoga en liège, initiales et métier gravés
    brique() {
      const g = new THREE.Group();
      const liege = M.liege();
      liege.map.wrapS = liege.map.wrapT = THREE.RepeatWrapping; liege.map.repeat.set(1.2, 1.2);
      g.add(maille(paveDoux(0.92, 0.58, 0.3, 0.05), liege));
      const t = enCouleur(toile(1024, 512, (c, l, h) => {
        c.fillStyle = 'rgba(64,32,12,0.82)'; c.textAlign = 'center'; c.textBaseline = 'middle';
        let s = h * 0.52; c.font = `800 ${s}px Bricolage, "Arial Black", sans-serif`; c.fillText(initiales, l / 2, h * 0.4);
        if (nomme === 'brique') {
          s = h * 0.1; c.font = `750 ${s}px Bricolage, Arial, sans-serif`; while (c.measureText(metier).width > l * 0.86 && s > 8) { s -= 1; c.font = `750 ${s}px Bricolage, Arial, sans-serif`; }
          c.fillText(metier, l / 2, h * 0.76);
          if (ville) { s = h * 0.075; c.font = `700 ${s}px Bricolage, Arial, sans-serif`; c.fillText(ville, l / 2, h * 0.9); }
        }
      }));
      const grave = maille(new THREE.PlaneGeometry(0.72, 0.36), M.decal(t, 0.95)); grave.position.z = 0.1505; g.add(grave);
      g.rotation.set(-0.42, 0.34, 0.04);
      return normaliser(g);
    },

    // tapis de yoga roulé : on voit la spirale des couches au bout, sangle de coton
    tapis() {
      const g = new THREE.Group();
      const mousse = M.mousse(O.glacure);
      const bout = new THREE.MeshPhysicalMaterial({ color: melange(O.glacure, '#ffffff', 0.08), roughness: 0.7, envMapIntensity: 0.8 });
      const r = maille(spirale(0.17, 0.022, 6, 1.02, 1.18), [bout, mousse]);
      r.rotation.y = Math.PI / 2; g.add(r);
      const sangle = M.tissu(O.tissu, 2, 6, 0.8);
      for (const x of [-0.3, 0.3]) { const s2 = maille(new THREE.CylinderGeometry(0.176, 0.176, 0.05, seg, 1, true), sangle); s2.rotation.z = Math.PI / 2; s2.position.x = x; g.add(s2); }
      g.add(maille(tubeVariable([[-0.3, 0.17, 0], [-0.24, 0.32, 0], [0, 0.4, 0], [0.24, 0.32, 0], [0.3, 0.17, 0]], () => 0.012, 40, 8), sangle));
      g.rotation.set(0.32, 0.52, 0.06);
      return normaliser(g);
    },

    // pot de baume : petit pot de grès crème, couvercle de métal laqué, pastille ronde imprimée sur le dessus
    baume() {
      const g = new THREE.Group();
      const corps = [[0.001, 0.012], [0.33, 0.012], [0.345, 0.0], [0.365, 0.004], [0.378, 0.02], [0.382, 0.06], [0.38, 0.15], [0.372, 0.162], [0.001, 0.162]];
      g.add(maille(tourner(corps), M.email(O.glacure2, 0.32, 0.5)));
      const couvercle = [[0.001, 0.165], [0.384, 0.165], [0.392, 0.172], [0.396, 0.19], [0.396, 0.272], [0.39, 0.286], [0.375, 0.293], [0.34, 0.296], [0.001, 0.296]];
      const laque = new THREE.MeshPhysicalMaterial({ color: O.glacure, metalness: 0.55, roughness: 0.26, clearcoat: 1, clearcoatRoughness: 0.08, envMapIntensity: 1.15 });
      g.add(maille(tourner(couvercle), laque));
      // stries du bord du couvercle
      const stries = maille(new THREE.CylinderGeometry(0.3975, 0.3975, 0.07, seg, 1, true), new THREE.MeshPhysicalMaterial({ color: O.glacure, metalness: 0.6, roughness: 0.35, bumpMap: repete(toileM('stries', 256, 16, (c, l, h) => { for (let x = 0; x < l; x += 4) { c.fillStyle = '#5a5a5a'; c.fillRect(x, 0, 2, h); c.fillStyle = '#c8c8c8'; c.fillRect(x + 2, 0, 2, h); } }), 6, 1), bumpScale: 0.8, envMapIntensity: 1.1 }));
      stries.position.y = 0.232; g.add(stries);
      const rond = enCouleur(toile(1024, 1024, (c, l) => {
        const r = l / 2;
        c.fillStyle = O.etiquette; c.beginPath(); c.arc(r, r, r * 0.98, 0, 7); c.fill();
        c.strokeStyle = O.etiquetteEncre; c.lineWidth = l * 0.012; c.beginPath(); c.arc(r, r, r * 0.86, 0, 7); c.stroke();
        c.fillStyle = O.bande; c.beginPath(); c.arc(r, r, r * 0.98, Math.PI * 0.18, Math.PI * 0.82); c.closePath(); c.fill();
        c.fillStyle = O.etiquetteEncre; c.textAlign = 'center';
        if (nomme === 'baume') {
          let t = l * 0.3; c.font = `800 ${t}px Bricolage, "Arial Black", sans-serif`;
          while (c.measureText(initiales).width > l * 0.6 && t > 10) { t -= 4; c.font = `800 ${t}px Bricolage, "Arial Black", sans-serif`; }
          c.textBaseline = 'alphabetic'; c.fillText(initiales, r, r * 0.98);
          t = l * 0.055; c.font = `750 ${t}px Bricolage, Arial, sans-serif`;
          while (c.measureText(metier).width > l * 0.62 && t > 8) { t -= 1; c.font = `750 ${t}px Bricolage, Arial, sans-serif`; }
          c.fillText(metier, r, r * 1.16);
          if (ville) { c.fillStyle = '#fff'; t = l * 0.05; c.font = `750 ${t}px Bricolage, Arial, sans-serif`; while (c.measureText(ville).width > l * 0.5 && t > 8) { t -= 1; c.font = `750 ${t}px Bricolage, Arial, sans-serif`; } c.fillText(ville, r, r * 1.62); }
        } else {
          // sans nom : une fleur stylisée
          c.fillStyle = O.vif; for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; c.beginPath(); c.ellipse(r + Math.cos(a) * r * 0.2, r * 0.82 + Math.sin(a) * r * 0.2, r * 0.17, r * 0.1, a, 0, 7); c.fill(); }
          c.fillStyle = O.etiquetteEncre; c.beginPath(); c.arc(r, r * 0.82, r * 0.08, 0, 7); c.fill();
        }
      }));
      const pastille = maille(new THREE.CircleGeometry(0.31, seg), M.imprime(rond, 0.4)); pastille.rotation.x = -Math.PI / 2; pastille.position.y = 0.2965; g.add(pastille);
      g.rotation.set(0.82, 0, 0.12);
      return normaliser(g);
    },

    // pilea dans un pot de grès émaillé sur sa soucoupe
    plante() {
      const g = new THREE.Group();
      const pied = [[0.001, 0.012], [0.17, 0.012], [0.18, 0.0], [0.2, 0.0], [0.21, 0.01]];
      const pot = [[0.21, 0.01], [0.235, 0.04], [0.262, 0.15], [0.282, 0.3], [0.29, 0.36], [0.296, 0.385], [0.29, 0.395], [0.278, 0.39], [0.27, 0.36], [0.001, 0.34]];
      g.add(maille(tourner(pied), M.argile()));
      g.add(maille(tourner(pot), M.email(O.vif, 0.4)));
      const terre = maille(new THREE.CircleGeometry(0.272, 40), M.terreau()); terre.rotation.x = -Math.PI / 2; terre.position.y = 0.355; g.add(terre);
      const texFeuille = enCouleur(toile(128, 128, (c, l) => {
        const r = c.createRadialGradient(l / 2, l / 2, 0, l / 2, l / 2, l / 2);
        r.addColorStop(0, '#A6D172'); r.addColorStop(0.16, '#64AA46'); r.addColorStop(1, '#2C7333');
        c.fillStyle = r; c.fillRect(0, 0, l, l);
        c.strokeStyle = 'rgba(214,242,176,0.4)'; c.lineWidth = 2;
        for (let k = 0; k < 9; k++) { const a = (k / 9) * Math.PI * 2; c.beginPath(); c.moveTo(l / 2, l / 2); c.lineTo(l / 2 + Math.cos(a) * l * 0.48, l / 2 + Math.sin(a) * l * 0.48); c.stroke(); }
      }));
      const matF = new THREE.MeshPhysicalMaterial({ map: texFeuille, roughness: 0.38, clearcoat: 0.6, clearcoatRoughness: 0.2, sheen: 0.4, sheenColor: col('#e8ffd8'), side: THREE.DoubleSide, envMapIntensity: 1.05 });
      const matT = new THREE.MeshStandardMaterial({ color: '#7FA552', roughness: 0.6 });
      const disque = new THREE.CircleGeometry(1, 28);
      const dp = disque.attributes.position;
      for (let k = 0; k < dp.count; k++) { const x = dp.getX(k), y = dp.getY(k); dp.setZ(k, 0.22 * (x * x + y * y) - 0.05 * Math.sin(Math.atan2(y, x) * 5) * (x * x + y * y)); }
      disque.computeVertexNormals();
      const n = leger ? 14 : 19;
      for (let i = 0; i < n; i++) {
        const a = i * 2.39996, couronne = i / n;
        const h = 0.2 + (1 - couronne) * 0.36 + (i % 3) * 0.03, ouv = 0.06 + couronne * 0.32;
        const bout = V3(Math.cos(a) * ouv, 0.36 + h, Math.sin(a) * ouv);
        const tige = new THREE.CatmullRomCurve3([V3(Math.cos(a) * 0.02, 0.36, Math.sin(a) * 0.02), V3(Math.cos(a) * ouv * 0.4, 0.36 + h * 0.7, Math.sin(a) * ouv * 0.4), bout]);
        g.add(maille(new THREE.TubeGeometry(tige, 10, 0.006, 5, false), matT));
        const f = maille(disque, matF);
        f.scale.setScalar(0.075 + (1 - couronne) * 0.035 + (i % 2) * 0.012);
        f.position.copy(bout);
        f.lookAt(bout.clone().add(V3(Math.cos(a) * 0.6, 0.9 - couronne * 0.5, Math.sin(a) * 0.6)));
        g.add(f);
      }
      g.rotation.set(0.12, 0, 0);
      return normaliser(g);
    },

    // bouquet de lavande noué d'un ruban
    lavande() {
      const g = new THREE.Group();
      const nb = leger ? 13 : 19, bourgeons = leger ? 18 : 26;
      const tigeM = new THREE.MeshStandardMaterial({ color: '#7D8F57', roughness: 0.7 });
      const inst = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 10, 8), new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.62, sheen: 0.8, sheenColor: col('#E9DAFF'), envMapIntensity: 0.9 }), nb * bourgeons);
      const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), cc = new THREE.Color();
      let k = 0;
      for (let i = 0; i < nb; i++) {
        const a = (i / nb) * Math.PI * 2 * 1.618, ouv = 0.05 + (i % 4) * 0.035, h = 0.8 + (i % 3) * 0.06 + (i % 5) * 0.012;
        const bas = V3(0, 0, 0), haut = V3(Math.cos(a) * ouv * 2.2, h, Math.sin(a) * ouv * 2.2);
        const dir = haut.clone().sub(bas).normalize();
        const t = maille(new THREE.CylinderGeometry(0.0055, 0.0075, h, 6), tigeM);
        t.position.copy(bas.clone().add(haut).multiplyScalar(0.5)); t.quaternion.setFromUnitVectors(V3(0, 1, 0), dir); g.add(t);
        for (let b = 0; b < bourgeons; b++) {
          const u = 0.66 + (b / bourgeons) * 0.34, p = bas.clone().lerp(haut, u);
          const ang = b * 2.4; p.x += Math.cos(ang) * 0.016; p.z += Math.sin(ang) * 0.016;
          e.set(Math.cos(ang) * 0.5, 0, Math.sin(ang) * 0.5); q.setFromEuler(e);
          const s = 0.012 + 0.008 * Math.sin(Math.PI * (b / bourgeons));
          m4.compose(p, q, V3(s * 0.8, s * 1.4, s * 0.8));
          inst.setMatrixAt(k, m4);
          inst.setColorAt(k, cc.set(['#7E5BC4', '#9A78D8', '#6A47B0', '#B396E6', '#8C67CF'][(b + i) % 5]));
          k++;
        }
      }
      g.add(inst);
      const ruban = M.tissu(O.vif, 2, 2, 0.4);
      const noeud = maille(new THREE.TorusGeometry(0.05, 0.016, 10, 40), ruban); noeud.rotation.x = Math.PI / 2; noeud.position.y = 0.3; noeud.scale.set(1, 1, 1.6); g.add(noeud);
      for (const s of [-1, 1]) {
        const boucle = maille(new THREE.TorusGeometry(0.05, 0.012, 8, 32), ruban); boucle.position.set(s * 0.06, 0.31, 0.06); boucle.rotation.set(0, s * 0.5, s * 0.6); boucle.scale.set(1, 0.6, 1); g.add(boucle);
        const pan = maille(tubeVariable([[s * 0.01, 0.3, 0.06], [s * 0.04, 0.24, 0.07], [s * 0.05, 0.17, 0.08]], () => 0.01, 12, 6), ruban); pan.scale.z = 0.4; g.add(pan);
      }
      g.rotation.set(0.1, 0, -0.12);
      return normaliser(g);
    },
  };
  return B;
}

// Taille relative à l'écran de chaque objet (le plus grand côté), pour qu'ils semblent à la même échelle.
export const ECHELLE = { pinceaux: 1.02, sachet: 1.05, theiere: 0.98, tasse: 0.86, plante: 1, lavande: 1.18, bougie: 0.84, coussin: 0.98, zafu: 0.98, carnet: 0.96, savon: 0.86, serviette: 0.94, sac: 1.05, mug: 0.8, baume: 0.8, bol: 0.98, brique: 0.95, tapis: 1.05 };
