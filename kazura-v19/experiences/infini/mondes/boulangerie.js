// Niveau 1 : le Fournil des Aurores, une boulangerie lyonnaise à l'aube.
// Une rue pavée encore mouillée, une devanture vert bouteille et or, la vitrine chaude, la farine qui danse dans la lumière,
// un vélo chargé de baguettes, un réverbère. Porte : LA VITRINE (rectangle, aux proportions de l'écran).
import { THREE, U, ciel, halo, particules, toile, proc, environnement, porteRect, reflet, ombre, rayon } from './outils.js';

export function construire(ctx) {
  const { a, renderer } = ctx;
  const racine = new THREE.Group();
  const SOL = -1.55, TROTTOIR = -1.4, FACADE = -9;
  const env = environnement(renderer, { bas: '#2a2030', horizon: '#e7a38a', haut: '#3b4f86', soleil: [0.8, 0.12, 0.5], soleilCouleur: '#ffc89a', panneaux: [[[0, 1, -3], '#ffcf8a', [2, 1]]] });

  racine.add(ciel({ bas: '#3a2c3c', horizon: '#f2a988', haut: '#28376b', soleil: [-0.7, 0.02, -1], soleilCouleur: '#ff9f7a', soleilTaille: 0.0, halo: 0.6, nuages: 0.9, nuageCouleur: '#f6a4a0' }));

  // la vitrine : ses dimensions suivent l'écran
  let wv, hv;
  if (a < 1) { hv = 2.2; wv = hv * a; } else { wv = Math.min(3.3, 1.65 * a); hv = wv / a; }
  const yb = TROTTOIR + 0.55, yv = yb + hv / 2;
  const marge = 0.42, porteL = 1.0;
  const devL = wv + marge * 2 + porteL + 0.25, devX = porteL / 2 + 0.12;  // la porte d'entrée est à droite de la vitrine
  const devH = hv + 0.55 + 0.75;

  // matières
  const vert = new THREE.MeshStandardMaterial({ color: '#173b2f', roughness: 0.45, metalness: 0.05, envMap: env, envMapIntensity: 0.8 });
  const orM = new THREE.MeshStandardMaterial({ color: '#d4a94e', roughness: 0.25, metalness: 1, envMap: env, envMapIntensity: 1.4 });
  const pierre = proc(new THREE.MeshStandardMaterial({ color: '#e8d9c2', roughness: 0.9 }), `
    vec3 albedo(vec3 p, vec3 base){ vec2 q = vec2(p.x/0.62, p.y/0.31); q.x += 0.5*step(1.0, mod(floor(q.y), 2.0));
      vec2 f = fract(q); float j = smoothstep(0.0, 0.03, f.x)*smoothstep(1.0, 0.97, f.x)*smoothstep(0.0, 0.06, f.y)*smoothstep(1.0, 0.94, f.y);
      float n = fbm(p.xy*2.5); vec3 c = base*(0.8 + 0.28*n)*(0.92 + 0.12*h21(floor(q)))*mix(0.72, 1.0, j);
      c *= mix(1.0, 1.18, smoothstep(1.5, 6.0, p.y));
      return c; }`, 'pierre');
  const paves = proc(new THREE.MeshStandardMaterial({ color: '#7c7480', roughness: 0.32, metalness: 0.0, envMap: env, envMapIntensity: 1.1 }), `
    vec3 albedo(vec3 p, vec3 base){ vec2 q = p.xy*vec2(5.5, 7.5); q.x += 0.5*step(1.0, mod(floor(q.y), 2.0));
      vec2 f = fract(q) - 0.5; float d = length(max(abs(f) - 0.3, 0.0)); float pave = smoothstep(0.17, 0.06, d);
      float n = h21(floor(q)); return base*mix(0.28, 0.75 + 0.45*n, pave)*(0.85 + 0.3*fbm(p.xy*0.8)); }`, 'paves');
  const trottoirM = proc(new THREE.MeshStandardMaterial({ color: '#a69a92', roughness: 0.55, envMap: env, envMapIntensity: 0.6 }), `
    vec3 albedo(vec3 p, vec3 base){ vec2 q = p.xy*vec2(2.2, 2.2); vec2 f = fract(q); float j = smoothstep(0.0, 0.02, f.x)*smoothstep(0.0, 0.02, f.y);
      return base*(0.8 + 0.25*fbm(p.xy*3.0))*mix(0.7, 1.0, j); }`, 'trottoir');

  // la rue et le trottoir
  const rue = new THREE.Mesh(new THREE.PlaneGeometry(60, 30), paves); rue.rotation.x = -Math.PI / 2; rue.position.set(0, SOL, -2); racine.add(rue);
  const trot = new THREE.Mesh(new THREE.BoxGeometry(60, 0.15, 1.8), trottoirM); trot.position.set(0, TROTTOIR - 0.075, FACADE + 0.9); racine.add(trot);

  // la façade de pierre (trois immeubles : le nôtre au centre, deux voisins)
  const facade = new THREE.Mesh(new THREE.PlaneGeometry(devL + 4, 9), pierre); facade.position.set(devX, TROTTOIR + 4.5, FACADE - 0.01); racine.add(facade);
  const voisinM = (c, k) => proc(new THREE.MeshStandardMaterial({ color: c, roughness: 0.92 }), `vec3 albedo(vec3 p, vec3 base){ return base*(0.82 + 0.25*fbm(p.xy*1.7 + ${k}.0))*(0.95 + 0.1*step(0.5, fract(p.y/0.5))); }`, 'voisin' + k);
  const vg = new THREE.Mesh(new THREE.PlaneGeometry(14, 10), voisinM('#d7a35f', 1)); vg.position.set(devX - (devL + 4) / 2 - 7, TROTTOIR + 5, FACADE - 0.3); racine.add(vg);
  const vd = new THREE.Mesh(new THREE.PlaneGeometry(14, 10), voisinM('#d99a8e', 2)); vd.position.set(devX + (devL + 4) / 2 + 7, TROTTOIR + 5, FACADE - 0.2); racine.add(vd);
  // fenêtres des étages (certaines déjà allumées)
  const vitreNuit = new THREE.MeshStandardMaterial({ color: '#1d2433', roughness: 0.15, metalness: 0.6, envMap: env, envMapIntensity: 1.2 });
  const vitreChaude = new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffb466').multiplyScalar(1.6) });
  const volet = new THREE.MeshStandardMaterial({ color: '#7d93a8', roughness: 0.7 });
  const fenetre = (x, y, allume, z = FACADE) => {
    const g = new THREE.Group(); g.position.set(x, y, z);
    const v = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.75), allume ? vitreChaude : vitreNuit); v.position.z = 0.01; g.add(v);
    const cadre = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.12, 0.25), pierre); cadre.position.set(0, -0.93, 0.1); g.add(cadre);
    const lin = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.14, 0.12), pierre); lin.position.set(0, 0.95, 0.06); g.add(lin);
    const croix = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.75, 0.04), new THREE.MeshStandardMaterial({ color: '#efe7da' })); croix.position.z = 0.03; g.add(croix);
    const tr = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.04, 0.04), croix.material); tr.position.set(0, 0.3, 0.03); g.add(tr);
    for (const s of [-1, 1]) { const vo = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.8, 0.05), volet); vo.position.set(s * 0.86, 0, 0.12); vo.rotation.y = s * 0.25; g.add(vo); }
    if (allume) { const hl = halo('#ffae5c', 2.4, 0.35); hl.position.z = 0.2; g.add(hl); }
    racine.add(g);
  };
  const yEt = TROTTOIR + devH + 1.7;
  [[-1.6, true], [devX + 1.9, false], [devX + 0.1, false]].forEach(([x, al]) => fenetre(x + (a > 1.5 ? (x < 0 ? -0.8 : 0.8) : 0), yEt, al));
  [[-1.6, false], [devX + 1.9, true]].forEach(([x, al]) => fenetre(x, yEt + 2.6, al));
  for (const [x, al] of [[-1, true], [1.6, false], [-1, false], [1.6, true]].map(([x, al], k) => [x, al, k])) {
    fenetre(vg.position.x + x * 2.2, TROTTOIR + 2.2 + (al ? 2.7 : 0), al, FACADE - 0.29);
    fenetre(vd.position.x + x * 2.4 - 1.2, TROTTOIR + 2.4 + (al ? 0 : 2.6), !al, FACADE - 0.19);
  }
  // balcon en fer forgé au premier étage
  const fer = new THREE.MeshStandardMaterial({ color: '#1b1d22', roughness: 0.5, metalness: 0.6 });
  const balc = new THREE.Group(); balc.position.set(devX, yEt - 0.95, FACADE + 0.35); racine.add(balc);
  const balL = Math.min(devL + 1, 7);
  balc.add(new THREE.Mesh(new THREE.BoxGeometry(balL, 0.08, 0.7), pierre));
  const rampe = new THREE.Mesh(new THREE.BoxGeometry(balL, 0.04, 0.04), fer); rampe.position.set(0, 0.95, 0.33); balc.add(rampe);
  const barreau = new THREE.CylinderGeometry(0.012, 0.012, 0.9, 6);
  for (let x = -balL / 2; x <= balL / 2; x += 0.12) { const b = new THREE.Mesh(barreau, fer); b.position.set(x, 0.5, 0.33); balc.add(b); }

  // la devanture vert bouteille
  const dev = new THREE.Group(); dev.position.set(devX, 0, FACADE); racine.add(dev);
  const plaque = (w, h, x, y, z = 0.06, m = vert) => { const p = new THREE.Mesh(new THREE.BoxGeometry(w, h, z * 2), m); p.position.set(x, y, z); dev.add(p); return p; };
  const xv = -devX;  // la vitrine est centrée sur x = 0 du monde
  plaque(devL, 0.55, 0, TROTTOIR + 0.275);                                   // soubassement
  plaque(devL + 0.2, 0.75, 0, TROTTOIR + devH - 0.375, 0.1);                 // bandeau de l'enseigne
  plaque(marge, hv + 0.01, xv - wv / 2 - marge / 2, yv);                     // montant gauche
  plaque(0.25, hv + 0.01, xv + wv / 2 + 0.125, yv);                          // montant entre vitrine et porte
  plaque(marge * 0.6, devH, devL / 2 - marge * 0.3, TROTTOIR + devH / 2, 0.08); // pilastre droit
  plaque(marge * 0.6, devH, -devL / 2 + marge * 0.3, TROTTOIR + devH / 2, 0.08);
  plaque(devL, 0.2, 0, yb + hv + 0.1);                                       // linteau
  // filets dorés
  const filet = (w, h, x, y) => { const f = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.02), orM); f.position.set(x, y, 0.13); dev.add(f); };
  filet(wv + 0.12, 0.025, xv, yb - 0.04); filet(wv + 0.12, 0.025, xv, yb + hv + 0.04);
  filet(0.025, hv + 0.1, xv - wv / 2 - 0.05, yv); filet(0.025, hv + 0.1, xv + wv / 2 + 0.05, yv);
  // l'enseigne
  const ens = toile(2048, 300, (x, w, h) => {
    x.fillStyle = '#173b2f'; x.fillRect(0, 0, w, h);
    const g = x.createLinearGradient(0, 40, 0, 240); g.addColorStop(0, '#f6dc8f'); g.addColorStop(0.5, '#c8963f'); g.addColorStop(1, '#f1d084');
    x.strokeStyle = g; x.lineWidth = 6; x.strokeRect(22, 22, w - 44, h - 44);
    x.fillStyle = g; x.textAlign = 'center'; x.font = '500 150px Newsreader, Georgia, serif'; try { x.letterSpacing = '18px'; } catch {}
    x.shadowColor = 'rgba(0,0,0,0.5)'; x.shadowBlur = 6; x.shadowOffsetY = 4;
    x.fillText('FOURNIL DES AURORES', w / 2, 200);
  });
  const enseigne = new THREE.Mesh(new THREE.PlaneGeometry(Math.min(devL, 6.2), Math.min(devL, 6.2) * 300 / 2048), new THREE.MeshStandardMaterial({ map: ens, roughness: 0.4, metalness: 0.2, envMap: env, envMapIntensity: 0.7, emissive: '#ffffff', emissiveMap: ens, emissiveIntensity: 0.18 }));
  enseigne.position.set(0, TROTTOIR + devH - 0.375, 0.205); dev.add(enseigne);
  // la porte d'entrée vitrée, chaude
  const porteX = xv + wv / 2 + 0.25 + porteL / 2;
  const pv = new THREE.Mesh(new THREE.PlaneGeometry(porteL - 0.18, devH - 1.05), vitreChaude); pv.position.set(porteX, TROTTOIR + (devH - 0.75) / 2, 0.01); dev.add(pv);
  const pcadre = new THREE.Mesh(new THREE.BoxGeometry(0.08, devH - 0.9, 0.12), vert); pcadre.position.set(porteX + porteL / 2 - 0.04, TROTTOIR + (devH - 0.75) / 2, 0.06); dev.add(pcadre);
  const poignee = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.5, 8), orM); poignee.position.set(porteX - porteL / 2 + 0.2, TROTTOIR + 1.1, 0.06); dev.add(poignee);
  const ph = halo('#ffb15e', 2.2, 0.4); ph.position.set(porteX, TROTTOIR + 1.3, 0.3); dev.add(ph);

  // LA VITRINE (porte vers le niveau suivant)
  const { mesh, porte } = porteRect(hv / 2, a, { fond: ctx.fondSuivant });
  mesh.position.set(0, yv, FACADE + 0.02); racine.add(mesh);
  porte.mat.uniforms.uTeinte.value.set(1.0, 0.93, 0.82);
  // le lettrage doré sur le verre, et le reflet du ciel
  const lettrage = toile(1024, 1024 / a > 2048 ? 2048 : Math.round(1024 / a), (x, w, h) => {
    const g = x.createLinearGradient(0, 0, 0, h * 0.25); g.addColorStop(0, '#fbe6a6'); g.addColorStop(1, '#c9953e');
    x.fillStyle = g; x.textAlign = 'center'; x.shadowColor = 'rgba(40,20,0,0.6)'; x.shadowBlur = 8;
    const t = Math.min(w * 0.16, h * 0.12);
    x.font = `italic 400 ${t}px Newsreader, Georgia, serif`;
    x.fillText('Boulangerie', w / 2, h * 0.08 + t);
    x.font = `500 ${t * 0.28}px "Bricolage Grotesque", sans-serif`; try { x.letterSpacing = `${t * 0.04}px`; } catch {}
    x.fillText('PAIN AU LEVAIN · VIENNOISERIES · DEPUIS 1932', w / 2, h * 0.08 + t * 1.5);
  });
  const lettres = new THREE.Mesh(new THREE.PlaneGeometry(wv, hv), new THREE.MeshBasicMaterial({ map: lettrage, transparent: true, depthWrite: false }));
  lettres.position.set(0, yv, FACADE + 0.03); racine.add(lettres);
  const refl = reflet(wv, hv, { couleur: '#9db0e0', couleur2: '#ffc79a', opacite: 0.3 }); refl.position.set(0, yv, FACADE + 0.035); racine.add(refl);

  // la lumière de la vitrine qui coule sur le trottoir et sur les pavés mouillés
  const coulee = new THREE.Mesh(new THREE.PlaneGeometry(wv * 1.4, 3.2), new THREE.MeshBasicMaterial({ map: toile(64, 256, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(255,190,120,0.55)'); g.addColorStop(1, 'rgba(255,170,100,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); }), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  coulee.rotation.x = -Math.PI / 2; coulee.position.set(0, TROTTOIR + 0.005, FACADE + 1.6); racine.add(coulee);
  const refletRue = new THREE.Mesh(new THREE.PlaneGeometry(wv * 0.9, 6), coulee.material.clone()); refletRue.material.opacity = 0.6;
  refletRue.rotation.x = -Math.PI / 2; refletRue.position.set(0, SOL + 0.005, FACADE + 4.9); racine.add(refletRue);

  // le réverbère
  const lampX = -wv / 2 - 2.4;
  const mat = new THREE.MeshStandardMaterial({ color: '#1f3a30', roughness: 0.5, metalness: 0.4, envMap: env });
  const mat2 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 3.9, 12), mat); mat2.position.set(lampX, TROTTOIR + 1.95, FACADE + 1.45); racine.add(mat2);
  const lant = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.11, 0.42, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffd08a').multiplyScalar(2.2) })); lant.position.set(lampX, TROTTOIR + 4.05, FACADE + 1.45); racine.add(lant);
  const toit = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.22, 6), mat); toit.position.set(lampX, TROTTOIR + 4.37, FACADE + 1.45); racine.add(toit);
  const lh = halo('#ffc27a', 2.6, 0.8); lh.position.copy(lant.position); racine.add(lh);
  const lh2 = halo('#ff9f5a', 7, 0.18); lh2.position.copy(lant.position); racine.add(lh2);
  const lampe = new THREE.PointLight('#ffb36b', 9, 9, 1.6); lampe.position.copy(lant.position).add(new THREE.Vector3(0, -0.3, 0.2)); racine.add(lampe);
  const cone = rayon({ longueur: 4, r0: 0.12, r1: 1.4, couleur: '#ffb46b', opacite: 0.07 }); cone.position.copy(lant.position); racine.add(cone);

  // le vélo du livreur, chargé de baguettes
  const velo = new THREE.Group(); velo.position.set(lampX + 1.15, TROTTOIR, FACADE + 0.42); velo.rotation.y = 0.12; racine.add(velo);
  const cadreV = new THREE.MeshStandardMaterial({ color: '#c8452e', roughness: 0.35, metalness: 0.3, envMap: env });
  const pneu = new THREE.MeshStandardMaterial({ color: '#16161a', roughness: 0.8 });
  for (const x of [-0.52, 0.52]) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.022, 8, 40), pneu); r.position.set(x, 0.35, 0); velo.add(r); const j = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.006, 6, 40), orM); j.position.set(x, 0.35, 0); velo.add(j); }
  const tube = (p1, p2, r = 0.02, m = cadreV) => { const v1 = new THREE.Vector3(...p1), v2 = new THREE.Vector3(...p2); const l = v1.distanceTo(v2); const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r, l, 8), m); c.position.copy(v1).add(v2).multiplyScalar(0.5); c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v2.clone().sub(v1).normalize()); velo.add(c); };
  tube([-0.52, 0.35, 0], [-0.05, 0.35, 0]); tube([-0.05, 0.35, 0], [-0.18, 0.85, 0]); tube([-0.18, 0.85, 0], [0.38, 0.82, 0]); tube([0.38, 0.82, 0], [0.52, 0.35, 0]);
  tube([-0.05, 0.35, 0], [0.38, 0.82, 0]); tube([-0.52, 0.35, 0], [-0.18, 0.85, 0]); tube([0.38, 0.82, 0], [0.42, 1.0, 0]); tube([0.3, 1.0, -0.22], [0.5, 1.02, 0.22], 0.015, fer);
  const panier = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.16, 0.22, 16, 1, true), new THREE.MeshStandardMaterial({ color: '#9a6a3a', roughness: 0.9, side: THREE.DoubleSide })); panier.position.set(0.66, 0.92, 0); velo.add(panier);
  const croute = new THREE.MeshStandardMaterial({ color: '#c88a42', roughness: 0.6, emissive: '#3a1a00', emissiveIntensity: 0.3 });
  for (let k = 0; k < 4; k++) { const b = new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.62, 4, 10), croute); b.position.set(0.66 + (k - 1.5) * 0.04, 1.12, (k % 2 - 0.5) * 0.06); b.rotation.z = 0.25 + k * 0.08; b.rotation.x = (k - 1.5) * 0.12; velo.add(b); }
  const ov = ombre(1.8, 0.6, 0.45); ov.position.set(0, 0.01, 0); velo.add(ov);

  // l'ardoise sur le trottoir
  const ard = toile(512, 640, (x, w, h) => {
    x.fillStyle = '#23262a'; x.fillRect(0, 0, w, h); x.strokeStyle = '#8a6a3c'; x.lineWidth = 26; x.strokeRect(13, 13, w - 26, h - 26);
    x.fillStyle = '#f4efe6'; x.textAlign = 'center'; x.font = 'italic 400 78px Newsreader, Georgia, serif'; x.fillText('Pain chaud', w / 2, 160);
    x.font = '500 46px "Bricolage Grotesque", sans-serif'; x.fillText('dès 6 h 30', w / 2, 240);
    x.fillStyle = '#f2c66b'; x.font = '400 40px "Bricolage Grotesque", sans-serif'; x.fillText('Croissant 1,30 €', w / 2, 360); x.fillText('Campagne 4,20 €', w / 2, 420); x.fillText('Chausson 2,10 €', w / 2, 480);
  });
  const ardoise = new THREE.Group(); ardoise.position.set(wv / 2 + porteL + 1.6, TROTTOIR, FACADE + 1.1); ardoise.rotation.y = -0.35; racine.add(ardoise);
  const pan = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.8, 0.03), [vert, vert, vert, vert, new THREE.MeshStandardMaterial({ map: ard, roughness: 0.9 }), vert]);
  pan.position.set(0, 0.42, 0.12); pan.rotation.x = -0.28; ardoise.add(pan);
  const pan2 = pan.clone(); pan2.position.z = -0.12; pan2.rotation.x = 0.28; ardoise.add(pan2);

  // pots de fleurs devant la porte
  const pot = new THREE.MeshStandardMaterial({ color: '#b5653d', roughness: 0.8 });
  const feuille = new THREE.MeshStandardMaterial({ color: '#3f6b3a', roughness: 0.7 });
  for (const s of [-1, 1]) {
    const g = new THREE.Group(); g.position.set(porteX + devX + s * 0.62, TROTTOIR, FACADE + 0.35); racine.add(g);
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.15, 0.4, 16), pot); p.position.y = 0.2; g.add(p);
    const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.3, 1), feuille); b.position.y = 0.6; b.scale.set(1, 1.2, 1); g.add(b);
  }

  // les lumières
  racine.add(new THREE.HemisphereLight('#a9b8e6', '#4a3640', 1.1));
  const soleil = new THREE.DirectionalLight('#ffb78a', 2.0); soleil.position.set(6, 3, 4); racine.add(soleil);
  const vitL = new THREE.PointLight('#ffb766', 10, 7, 1.5); vitL.position.set(0, yv - 0.3, FACADE + 1.1); racine.add(vitL);
  const vh = halo('#ffb870', Math.max(wv, hv) * 1.6, 0.22); vh.position.set(0, yv, FACADE + 0.25); racine.add(vh);

  // la farine et la poussière dorée dans la lumière, la brume du matin
  racine.add(particules({ n: ctx.mobile ? 160 : 280, min: [-wv, TROTTOIR, FACADE + 0.1], max: [wv, TROTTOIR + hv + 1, FACADE + 2.4], couleur: '#ffe2b0', taille: 0.012, vitesse: [0.02, 0.025, 0.01], tremble: 0.08, scintille: 0.5 }));
  racine.add(particules({ n: 60, min: [-8, SOL, FACADE + 0.5], max: [8, SOL + 4, -1], couleur: '#ffcfa8', couleur2: '#a9b8ff', taille: 0.12, forme: 'bokeh', opacite: 0.08, vitesse: [0.05, 0.0, 0], tremble: 0.2 }));
  const brume = new THREE.Mesh(new THREE.PlaneGeometry(40, 2.2), new THREE.MeshBasicMaterial({ map: toile(32, 128, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(255,214,190,0)'); g.addColorStop(0.7, 'rgba(240,190,180,0.22)'); g.addColorStop(1, 'rgba(240,190,180,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); }), transparent: true, depthWrite: false }));
  brume.position.set(0, SOL + 0.8, FACADE + 2.8); racine.add(brume);

  const chemin = [
    { p: [-0.7, -0.15, -3.0], c: [0, yv, FACADE] },
    { p: [-0.25, yv * 0.5 - 0.05, -5.6], c: [0, yv, FACADE] },
  ];
  return {
    racine, porte, chemin, foyer: -FACADE, fondScene: new THREE.Color('#2a2236'), brouillard: [new THREE.Color('#c99a98'), 8, 40],
    maj(t, e) {
      const s = e.sigma;
      lettres.material.opacity = 1 - THREE.MathUtils.smoothstep(s, 0.45, 0.85);
      refl.material.uniforms.uOp.value = 0.3 * (1 - THREE.MathUtils.smoothstep(s, 0.4, 0.9));
      const k = THREE.MathUtils.smoothstep(s, 0.5, 0.95);
      porte.mat.uniforms.uTeinte.value.set(1 - 0.0 * k, 0.93 + 0.07 * k, 0.82 + 0.18 * k);
      lampe.intensity = 9 * (0.92 + 0.08 * Math.sin(t * 7.0) * Math.sin(t * 2.3));
    },
  };
}
