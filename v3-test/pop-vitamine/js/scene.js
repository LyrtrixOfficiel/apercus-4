// Pop vitamine : la scène Three.js.
// Un seul canevas fixe derrière la page. Il peint le fond (duo de couleurs qui se mélangent, une vague
// liquide à chaque frontière de section) et les objets, construits en code, qui suivent des « ancres »
// placées dans le HTML : la mise en page reste en CSS, la 3D s'y accroche.
import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.170.0/three.module.min.js';

const V2 = (x, y) => new THREE.Vector2(x, y);
const hexRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);

// ---------------------------------------------------------------- fond
const FOND_VERT = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.9999, 1.0); }`;
const FOND_FRAG = `
precision highp float;
uniform vec2 uRes; uniform float uDpr; uniform float uTime; uniform float uVague; uniform vec2 uSouris;
uniform vec3 uA[4]; uniform vec3 uB[4]; uniform float uClair[4]; uniform float uLim[3];
varying vec2 vUv;
float h21(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
float bruit(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(h21(i), h21(i+vec2(1,0)), f.x), mix(h21(i+vec2(0,1)), h21(i+vec2(1,1)), f.x), f.y); }
float fbm(vec2 p){ float s = 0.0, a = 0.5; for(int i=0;i<OCTAVES;i++){ s += a*bruit(p); p = p*2.03 + 7.1; a *= 0.5; } return s; }
vec3 versLin(vec3 c){ return mix(c/12.92, pow((c+0.055)/1.055, vec3(2.4)), step(0.04045, c)); }
void main(){
  vec2 px = gl_FragCoord.xy / uDpr;            // pixels CSS, origine en bas
  float y = uRes.y / uDpr - px.y;              // depuis le haut, comme la page
  int k = 0;
  for(int i=0;i<3;i++){
    float fi = float(i);
    float w = sin(px.x*0.0062 + uTime*1.1 + fi*2.1)*uVague + sin(px.x*0.017 - uTime*1.7 + fi)*uVague*0.35;
    if(y > uLim[i] + w) k = i + 1;
  }
  vec3 a = uA[0], b = uB[0]; float clair = uClair[0];
  for(int i=1;i<4;i++){ if(i==k){ a = uA[i]; b = uB[i]; clair = uClair[i]; } }
  vec2 uv = px / max(uRes.y/uDpr, 1.0);
  float n = fbm(uv*1.35 + vec2(uTime*0.035, -uTime*0.025));
  float n2 = fbm(uv*0.8 - vec2(uTime*0.02, uTime*0.03) + n);
  float t = clamp(uv.x*0.42 + (1.0 - y/(uRes.y/uDpr))*0.18 + (n2 - 0.5)*1.25 + 0.2, 0.0, 1.0);
  t = smoothstep(0.0, 1.0, t);
  vec3 c = mix(a, b, t);
  // Lumière douce : éclaircit les sections à encre sombre, assombrit le bord des sections à encre claire.
  float d = length((px - uSouris)/uRes.y*uDpr);
  float halo = exp(-d*d*3.0);
  float bord = smoothstep(0.35, 1.25, length(vUv - 0.5)*1.6);
  c = mix(c, c + vec3(0.05), halo*clair);
  c = mix(c, c*0.9, bord*(1.0 - clair));
  c += (h21(px + fract(uTime)*91.0) - 0.5) / 255.0 * 2.0;  // grain contre les bandes
  gl_FragColor = vec4(versLin(clamp(c, 0.0, 1.0)), 1.0);
  #include <colorspace_fragment>
}`;

// ---------------------------------------------------------------- environnement studio
function studio(renderer, teinteA, teinteB) {
  const s = new THREE.Scene();
  const boite = new THREE.BoxGeometry(1, 1, 1);
  const salle = new THREE.Mesh(boite, new THREE.MeshBasicMaterial({ color: 0x5a5560, side: THREE.BackSide }));
  salle.scale.setScalar(14); s.add(salle);
  const panneau = (x, y, z, sx, sy, sz, couleur, force) => {
    const m = new THREE.Mesh(boite, new THREE.MeshBasicMaterial({ color: new THREE.Color(couleur).multiplyScalar(force) }));
    m.position.set(x, y, z); m.scale.set(sx, sy, sz); s.add(m);
  };
  panneau(-6.5, 1.5, 1, 0.2, 5, 4, '#ffffff', 5.5);   // boîte à lumière gauche
  panneau(6.5, 2.5, -1, 0.2, 3, 5, '#ffffff', 3.2);   // droite
  panneau(0, 6.8, 0, 5, 0.2, 3, '#ffffff', 3.5);      // zénith
  panneau(1.5, 0.5, 6.8, 3, 2, 0.2, '#ffffff', 2.2);  // face
  panneau(-2, -2, -6.8, 7, 4, 0.2, teinteA, 1.4);     // reflets colorés du décor
  panneau(3, -6.8, 1, 6, 0.2, 6, teinteB, 1.2);
  const pm = new THREE.PMREMGenerator(renderer);
  const env = pm.fromScene(s, 0.035).texture;
  pm.dispose();
  return env;
}

// ---------------------------------------------------------------- matières
function matieres(F, leger) {
  const verre = (teinte, o = {}) => leger
    ? new THREE.MeshPhysicalMaterial({ color: teinte, roughness: 0.06, transparent: true, opacity: o.opacite ?? 0.82, clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: 1.8, specularIntensity: 1, ior: 1.5, iridescence: o.iris ?? 0 })
    : new THREE.MeshPhysicalMaterial({ color: o.couleur ?? '#ffffff', transmission: 1, thickness: o.epaisseur ?? 0.5, roughness: o.rugosite ?? 0.05, ior: o.ior ?? 1.5, attenuationColor: teinte, attenuationDistance: o.attenuation ?? 0.32, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 1.8, specularIntensity: 1, dispersion: o.dispersion ?? 0, iridescence: o.iris ?? 0, iridescenceIOR: 1.3 });
  return {
    verre,
    plastique: (c) => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.32, clearcoat: 0.6, clearcoatRoughness: 0.2, envMapIntensity: 1.1 }),
    caoutchouc: (c) => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.55, sheen: 0.6, sheenColor: new THREE.Color('#ffffff'), sheenRoughness: 0.5, envMapIntensity: 0.9 }),
    ceramique: (c) => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.08, envMapIntensity: 1.2 }),
    liquide: (c) => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.04, clearcoat: 1, envMapIntensity: 1.6 }),
    pierre: (c) => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.62, clearcoat: 0.25, clearcoatRoughness: 0.5, envMapIntensity: 1 }),
    cire: (c) => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.55, sheen: 1, sheenColor: new THREE.Color('#ffd9a8'), sheenRoughness: 0.35, envMapIntensity: 0.9 }),
    papier: (tex) => new THREE.MeshPhysicalMaterial({ map: tex, roughness: 0.55, clearcoat: 0.35, clearcoatRoughness: 0.3, envMapIntensity: 1, transparent: !!tex.userData?.transparent, side: THREE.FrontSide }),
  };
}

// ---------------------------------------------------------------- étiquettes à son nom
function etiquette(F, d, l = 1024, h = 520, opt = {}) {
  const c = document.createElement('canvas'); c.width = l; c.height = h;
  const g = c.getContext('2d');
  if (!opt.transparent) {
    g.fillStyle = F.etiquette; g.fillRect(0, 0, l, h);
    g.fillStyle = F.accent; g.fillRect(0, h * 0.82, l, h * 0.18);
  }
  g.fillStyle = opt.encre || F.etiquetteEncre;
  g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  const ini = (d.initiales || '').toUpperCase();
  g.font = `800 ${h * 0.46}px Bricolage, "Arial Black", sans-serif`;
  g.fillText(ini, l / 2, h * 0.56);
  const met = (d.metier || '').toUpperCase();
  let taille = h * 0.085;
  g.font = `700 ${taille}px Bricolage, Arial, sans-serif`;
  while (g.measureText(met).width > l * 0.8 && taille > 16) { taille -= 2; g.font = `700 ${taille}px Bricolage, Arial, sans-serif`; }
  g.fillText(met, l / 2, h * 0.7);
  if (!opt.transparent) {
    g.fillStyle = '#ffffff';
    g.font = `700 ${h * 0.07}px Bricolage, Arial, sans-serif`;
    const v = (d.ville || d.rdv || '').toUpperCase();
    g.fillText(v, l / 2, h * 0.935);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  t.userData = { transparent: !!opt.transparent };
  return t;
}

function textureFeuille(couleur) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 512;
  const g = c.getContext('2d');
  g.fillStyle = couleur; g.fillRect(0, 0, 256, 512);
  const grd = g.createLinearGradient(0, 0, 256, 0);
  grd.addColorStop(0, 'rgba(0,0,0,.18)'); grd.addColorStop(0.5, 'rgba(255,255,255,.08)'); grd.addColorStop(1, 'rgba(0,0,0,.18)');
  g.fillStyle = grd; g.fillRect(0, 0, 256, 512);
  g.strokeStyle = 'rgba(255,255,255,.45)'; g.lineWidth = 5;
  g.beginPath(); g.moveTo(128, 512); g.lineTo(128, 20); g.stroke();
  g.lineWidth = 2.5; g.strokeStyle = 'rgba(255,255,255,.28)';
  for (let y = 470; y > 60; y -= 46) for (const s of [-1, 1]) { g.beginPath(); g.moveTo(128, y); g.quadraticCurveTo(128 + s * 60, y - 30, 128 + s * 118, y - 78); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

// ---------------------------------------------------------------- les objets
const lathe = (pts, seg, lisse) => {
  let p = pts.map(([x, y]) => V2(x, y));
  if (lisse) p = new THREE.SplineCurve(p).getPoints(lisse);
  return new THREE.LatheGeometry(p, seg);
};
function normaliser(g, hauteur) {
  // centre l'objet et le ramène à une hauteur de 1
  const b = new THREE.Box3().setFromObject(g);
  // taille de référence : la plus grande dimension, pour qu'un objet large (tasse) ne déborde pas de son ancre
  const h = hauteur || Math.max(b.max.y - b.min.y, b.max.x - b.min.x, b.max.z - b.min.z);
  const pivot = new THREE.Group();
  g.position.y -= (b.max.y + b.min.y) / 2; g.position.x -= (b.max.x + b.min.x) / 2;
  pivot.add(g); pivot.scale.setScalar(1 / h);
  const conteneur = new THREE.Group(); conteneur.add(pivot);
  return conteneur;
}

function fabrique(F, d, leger) {
  const M = matieres(F, leger);
  const seg = leger ? 48 : 96;
  let etiq = null;
  const tex = () => (etiq ||= etiquette(F, d));

  const bande = (r, h, y, arc, tx) => {
    const geo = new THREE.CylinderGeometry(r, r, h, seg, 1, true, -arc / 2, arc);
    const m = new THREE.Mesh(geo, M.papier(tx)); m.position.y = y; return m;
  };
  const strier = (geo, n, force) => {
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i), a = Math.atan2(x, z), r = Math.hypot(x, z);
      if (r < 1e-4) continue;
      const k = 1 + force * Math.max(0, Math.cos(a * n)) ** 3;
      p.setX(i, x * k); p.setZ(i, z * k);
    }
    geo.computeVertexNormals(); return geo;
  };

  const B = {
    flacon() {
      const g = new THREE.Group();
      g.add(new THREE.Mesh(lathe([[0, 0], [0.19, 0], [0.212, 0.012], [0.22, 0.04], [0.22, 0.5], [0.214, 0.545], [0.19, 0.585], [0.13, 0.62], [0.088, 0.64], [0.088, 0.69], [0, 0.69]], seg), M.verre(F.verre, { epaisseur: 0.3, attenuation: 2.4, couleur: F.verreTeinte, opacite: 0.55 })));
      // l'huile à l'intérieur : opaque, donc vue À TRAVERS le verre (réfractée) ; niveau aux trois quarts
      const huile = new THREE.Mesh(lathe([[0, 0.025], [0.185, 0.025], [0.198, 0.045], [0.198, 0.4], [0, 0.4]], seg), M.liquide(F.verre)); huile.material.emissive = new THREE.Color(F.verre); huile.material.emissiveIntensity = 0.35; g.add(huile);
      const bouchon = new THREE.Mesh(strier(new THREE.CylinderGeometry(0.104, 0.104, 0.12, seg * 2, 1), 30, 0.035), M.plastique('#17131c'));
      bouchon.position.y = 0.69; g.add(bouchon);
      const bague = new THREE.Mesh(new THREE.CylinderGeometry(0.108, 0.108, 0.018, seg), M.plastique('#17131c')); bague.position.y = 0.632; g.add(bague);
      g.add(new THREE.Mesh(lathe([[0.001, 0.748], [0.07, 0.748], [0.075, 0.78], [0.072, 0.84], [0.062, 0.895], [0.045, 0.938], [0.022, 0.958], [0.001, 0.962]], seg, 40), M.caoutchouc('#1d1822')));
      g.add(bande(0.2235, 0.3, 0.27, 2.7, tex()));
      return normaliser(g);
    },
    huile() {
      const g = new THREE.Group();
      g.add(new THREE.Mesh(lathe([[0, 0], [0.17, 0], [0.19, 0.015], [0.196, 0.05], [0.196, 0.56], [0.186, 0.6], [0.14, 0.65], [0.074, 0.69], [0.068, 0.72], [0, 0.72]], seg), M.verre(F.verre, { epaisseur: 0.3, attenuation: 2.4, couleur: F.verreTeinte, opacite: 0.55 })));
      const huileM = new THREE.Mesh(lathe([[0, 0.03], [0.165, 0.03], [0.176, 0.05], [0.176, 0.46], [0, 0.46]], seg), M.liquide(F.verre)); huileM.material.emissive = new THREE.Color(F.verre); huileM.material.emissiveIntensity = 0.35; g.add(huileM);
      const col = new THREE.Mesh(strier(new THREE.CylinderGeometry(0.078, 0.078, 0.07, seg * 2), 26, 0.03), M.plastique('#f3eee8')); col.position.y = 0.72; g.add(col);
      const tige = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.09, 24), M.plastique('#f3eee8')); tige.position.y = 0.79; g.add(tige);
      const tete = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.055, 0.06, seg), M.plastique('#f3eee8')); tete.position.y = 0.85; g.add(tete);
      const bec = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.14, 20), M.plastique('#f3eee8')); bec.rotation.z = Math.PI / 2; bec.position.set(0.09, 0.865, 0); g.add(bec);
      g.add(bande(0.1985, 0.3, 0.3, 2.6, tex()));
      return normaliser(g);
    },
    tasse(mug = false) {
      const g = new THREE.Group();
      const ext = mug
        ? [[0, 0], [0.19, 0], [0.208, 0.012], [0.215, 0.045], [0.215, 0.52], [0.212, 0.545], [0.2, 0.552], [0.19, 0.54], [0.19, 0.07], [0, 0.06]]
        : [[0, 0], [0.13, 0], [0.142, 0.008], [0.148, 0.03], [0.19, 0.075], [0.238, 0.16], [0.265, 0.26], [0.274, 0.335], [0.272, 0.36], [0.26, 0.364], [0.255, 0.345], [0.247, 0.265], [0.222, 0.17], [0.178, 0.098], [0.1, 0.07], [0, 0.066]];
      g.add(new THREE.Mesh(lathe(ext, seg), M.ceramique(F.ceramique)));
      const liq = new THREE.Mesh(new THREE.CircleGeometry(mug ? 0.19 : 0.246, seg), M.liquide(F.liquide));
      liq.rotation.x = -Math.PI / 2; liq.position.y = mug ? 0.47 : 0.3; g.add(liq);
      const anse = new THREE.Mesh(new THREE.TorusGeometry(mug ? 0.12 : 0.085, mug ? 0.03 : 0.024, 18, 48, Math.PI * 1.15), M.ceramique(F.ceramique));
      anse.rotation.z = -Math.PI * 0.575; anse.position.set(mug ? 0.205 : 0.262, mug ? 0.29 : 0.21, 0); g.add(anse);
      if (!mug) {
        g.add(new THREE.Mesh(lathe([[0.001, -0.036], [0.25, -0.036], [0.35, -0.014], [0.39, 0.008], [0.382, 0.02], [0.33, 0.004], [0.17, -0.006], [0.001, -0.006]], seg), M.ceramique(F.ceramique)));
      } else {
        g.add(bande(0.2165, 0.24, 0.29, 2.3, tex()));
      }
      const n = normaliser(g);
      if (!mug) { // vapeur de tisane, ajoutée après la mise à l'échelle pour ne pas compter dans la taille
        const vap = vapeur(); vap.position.y = 0.36; g.add(vap); n.userData.vapeur = vap;
      }
      return n;
    },
    mug() { return B.tasse(true); },
    galet(seed = Math.random() * 10) {
      const geo = new THREE.SphereGeometry(1, leger ? 40 : 72, leger ? 28 : 48);
      const p = geo.attributes.position, v = new THREE.Vector3();
      for (let i = 0; i < p.count; i++) {
        v.fromBufferAttribute(p, i);
        const n = Math.sin(v.x * 2.1 + seed) * Math.cos(v.z * 1.7 + seed * 0.7) * 0.05 + Math.sin(v.y * 3.1 + seed * 1.3) * 0.025;
        v.multiplyScalar(1 + n); p.setXYZ(i, v.x, v.y, v.z);
      }
      geo.computeVertexNormals();
      const m = new THREE.Mesh(geo, M.pierre(F.galet));
      m.scale.set(0.5, 0.27, 0.4);
      const g = new THREE.Group(); g.add(m);
      return normaliser(g);
    },
    pile() {
      const g = new THREE.Group();
      let y = 0;
      const tons = [F.galet, new THREE.Color(F.galet).offsetHSL(0, -0.05, -0.12).getStyle(), new THREE.Color(F.galet).offsetHSL(0, 0, 0.05).getStyle()];
      [[0.62, 0], [0.5, 0.2], [0.36, -0.15]].forEach(([s, rz], i) => {
        const gal = B.galet(i * 3.3 + 1); gal.scale.setScalar(s / 0.55);
        gal.children[0].children[0].children[0].material = M.pierre(tons[i]);
        const h = s * 0.48;
        gal.position.y = y + h / 2; gal.rotation.z = rz * 0.2; gal.rotation.y = i;
        y += h * 0.82; g.add(gal);
      });
      return normaliser(g);
    },
    bougie() {
      const g = new THREE.Group();
      const verreBocal = M.verre(F.verre, { epaisseur: 0.12, attenuation: 2.5, rugosite: 0.08 });
      g.add(new THREE.Mesh(lathe([[0, 0], [0.22, 0], [0.235, 0.012], [0.242, 0.05], [0.242, 0.55], [0.238, 0.562], [0.228, 0.562], [0.226, 0.55], [0.226, 0.06], [0, 0.055]], seg), verreBocal));
      const cire = new THREE.Mesh(lathe([[0, 0.06], [0.222, 0.06], [0.222, 0.47], [0.2, 0.475], [0.08, 0.455], [0, 0.45]], seg), M.cire('#fff3e2')); cire.material.emissive = new THREE.Color('#ff9a4a'); cire.material.emissiveIntensity = 0.22;
      g.add(cire);
      const meche = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.07, 10), M.plastique('#2a2220'));
      meche.position.y = 0.48; meche.rotation.z = 0.12; g.add(meche);
      g.add(bande(0.2445, 0.2, 0.27, 2.2, tex()));
      const n = normaliser(g);
      const fl = flamme(); fl.position.y = 0.6; fl.scale.setScalar(1.35); g.add(fl);
      n.userData.flamme = fl; return n;
    },
    sphere() {
      const g = new THREE.Group();
      g.add(new THREE.Mesh(new THREE.SphereGeometry(0.5, leger ? 48 : 96, leger ? 32 : 64), M.verre(F.verre, { epaisseur: 1.2, attenuation: 5, dispersion: 5, iris: 0.8, ior: 1.42, opacite: 0.5 })));
      return normaliser(g);
    },
    feuille() {
      const geo = new THREE.PlaneGeometry(1, 1, 8, 24);
      const p = geo.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), y = p.getY(i), t = y + 0.5;
        const w = Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.02)), 0.85) * 0.42 * (1 - 0.2 * t);
        const nx = x * 2 * w;
        p.setXYZ(i, nx, y, 0.35 * nx * nx + 0.14 * Math.sin(t * Math.PI * 0.9));
      }
      geo.computeVertexNormals();
      const m = new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({ map: textureFeuille(F.feuille), roughness: 0.42, side: THREE.DoubleSide, sheen: 0.5, sheenColor: new THREE.Color('#ffffff'), clearcoat: 0.4, clearcoatRoughness: 0.3, envMapIntensity: 1.1 }));
      const tige = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.016, 0.16, 10), new THREE.MeshPhysicalMaterial({ color: F.feuille, roughness: 0.5 }));
      tige.position.y = -0.56; tige.rotation.z = 0.15;
      const g = new THREE.Group(); g.add(m, tige);
      return normaliser(g);
    },
    carnet() {
      const g = new THREE.Group();
      const forme = new THREE.Shape(); const L = 0.62, H = 0.82, r = 0.05;
      forme.moveTo(-L / 2 + r, -H / 2); forme.lineTo(L / 2 - r, -H / 2); forme.quadraticCurveTo(L / 2, -H / 2, L / 2, -H / 2 + r);
      forme.lineTo(L / 2, H / 2 - r); forme.quadraticCurveTo(L / 2, H / 2, L / 2 - r, H / 2); forme.lineTo(-L / 2 + r, H / 2);
      forme.quadraticCurveTo(-L / 2, H / 2, -L / 2, H / 2 - r); forme.lineTo(-L / 2, -H / 2 + r); forme.quadraticCurveTo(-L / 2, -H / 2, -L / 2 + r, -H / 2);
      const couv = new THREE.Mesh(new THREE.ExtrudeGeometry(forme, { depth: 0.09, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 4, curveSegments: 10 }), M.caoutchouc(F.accent));
      couv.position.z = -0.045; g.add(couv);
      const pages = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 0.075), M.ceramique('#fffaf0')); pages.position.set(0.02, 0, 0); pages.scale.set(1, 0.985, 1); g.add(pages);
      const elastique = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.86, 0.12), M.caoutchouc('#1d1822')); elastique.position.x = 0.21; g.add(elastique);
      const ini = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.235), M.papier(etiquette(F, d, 1024, 520, { transparent: true, encre: '#ffffff' })));
      ini.position.set(-0.04, 0.12, 0.0585); g.add(ini);
      return normaliser(g);
    },
  };
  return B;
}

// Flamme et vapeur : deux petits shaders, toujours tournés vers la caméra.
function flamme() {
  const g = new THREE.Group();
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { uTime: { value: 0 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `uniform float uTime; varying vec2 vUv;
      void main(){ vec2 p = vUv - vec2(0.5, 0.28); p.x += sin(uTime*7.0 + p.y*9.0)*0.025*p.y*3.0;
        float r = length(vec2(p.x*2.3, p.y < 0.0 ? p.y*2.2 : p.y*0.85));
        float a = smoothstep(0.42, 0.0, r);
        vec3 c = mix(vec3(1.0,0.42,0.08), vec3(1.0,0.95,0.75), smoothstep(0.25, 0.0, r));
        c = mix(c, vec3(0.35,0.55,1.0), smoothstep(-0.05,-0.2,p.y)*0.6);
        gl_FragColor = vec4(min(c*1.15, vec3(1.0)), a); }`,
  });
  const f = new THREE.Mesh(new THREE.PlaneGeometry(0.11, 0.24), mat); g.add(f);
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.7), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uTime: mat.uniforms.uTime },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `uniform float uTime; varying vec2 vUv; void main(){ float d = length(vUv-0.5); float a = exp(-d*d*28.0)*(0.32+0.05*sin(uTime*11.0)); gl_FragColor = vec4(vec3(1.0,0.72,0.35)*a, a); }`,
  }));
  g.add(halo);
  g.userData.mat = mat; g.userData.billboard = true;
  return g;
}
function vapeur() {
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { uTime: { value: 0 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `uniform float uTime; varying vec2 vUv;
      float h(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1)))*43758.5); }
      float b(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y); }
      void main(){ vec2 p = vUv; float t = uTime*0.35;
        float x = p.x - 0.5 + sin(p.y*7.0 - t*4.0)*0.16*p.y + (b(vec2(p.y*4.0 - t*1.5, 1.0))-0.5)*0.4*p.y;
        float filet = smoothstep(0.1 + 0.12*p.y, 0.0, abs(x)) * smoothstep(0.0, 0.2, p.y) * smoothstep(1.0, 0.35, p.y);
        float n = b(vec2(p.x*6.0, p.y*5.0 - t*2.5));
        float a = filet * smoothstep(0.2, 0.9, n) * 0.36;
        gl_FragColor = vec4(vec3(1.0), a); }`,
  });
  const g = new THREE.Group();
  for (let i = 0; i < 2; i++) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.6), mat);
    m.position.set((i - 0.5) * 0.09, 0.3, 0); m.scale.x = i ? -1 : 1; g.add(m);
  }
  g.userData.mat = mat; g.userData.billboard = true;
  return g;
}

// ---------------------------------------------------------------- réglages par rôle
// pose : rotation de départ ; par : parallaxe (fraction du défilement) ; tourne : vitesse de rotation.
const ROLES = {
  'heros-g': { pose: [0.08, -0.35, 0.26], par: 0.18, tourne: 0.16 },
  'heros-d': { pose: [0.25, -0.6, -0.16], par: 0.1, tourne: -0.18 },
  p1: { pose: [0.6, 0.2, 0.8], par: 0.32, tourne: 0.4 },
  p2: { pose: [0.4, 1, -0.5], par: 0.26, tourne: -0.35 },
  p3: { pose: [-0.5, 0.4, -0.9], par: 0.38, tourne: 0.45 },
  approche: { pose: [0.3, 0.3, 0.5], par: 0.1, tourne: 0.3 },
  seance: { pose: [0.2, 0.4, 0.12], par: 0.08, tourne: 0.2 },
  tarifs: { pose: [0.05, -0.5, -0.2], par: 0.06, tourne: 0.25 },
  apropos: { pose: [0.2, 0.6, 0.18], par: 0.1, tourne: -0.2 },
  contact: { pose: [0.4, -0.3, -0.6], par: 0.12, tourne: 0.35 },
};

const TAILLE = { flacon: 1, huile: 1, tasse: 0.82, mug: 0.72, bougie: 0.6, sphere: 0.56, pile: 0.72, carnet: 0.78, galet: 1, feuille: 1 };

// ---------------------------------------------------------------- lancement
export async function lancer({ canvas, F, d, reduit, etat }) {
  const petit = matchMedia('(max-width: 760px)').matches;
  const leger = petit || matchMedia('(pointer: coarse)').matches || (navigator.hardwareConcurrency || 8) <= 4;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  let dprMax = Math.min(window.devicePixelRatio || 1, leger ? 1.5 : 2);
  let dpr = dprMax;
  renderer.setPixelRatio(dpr);
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 0, 12);
  const hautVue = 2 * 12 * Math.tan(THREE.MathUtils.degToRad(15));
  scene.environment = studio(renderer, F.scenes.accueil[0], F.scenes.accueil[1]);
  const lum = new THREE.DirectionalLight('#ffffff', 1.4); lum.position.set(-4, 6, 8); scene.add(lum);

  // fond
  const uni = {
    uRes: { value: new THREE.Vector2(1, 1) }, uDpr: { value: dpr }, uTime: { value: 0 }, uVague: { value: 10 },
    uSouris: { value: new THREE.Vector2(-9999, -9999) },
    uA: { value: [0, 1, 2, 3].map(() => new THREE.Vector3()) }, uB: { value: [0, 1, 2, 3].map(() => new THREE.Vector3()) },
    uClair: { value: [0, 0, 0, 0] }, uLim: { value: [1e5, 1e5, 1e5] },
  };
  const fond = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    uniforms: uni, vertexShader: FOND_VERT, fragmentShader: FOND_FRAG, defines: { OCTAVES: leger ? 3 : 4 },
    depthWrite: false, depthTest: false,
  }));
  fond.frustumCulled = false; fond.renderOrder = -1000; scene.add(fond);

  // sections et ancres (positions de page mises en cache, relues au redimensionnement)
  const sections = [...document.querySelectorAll('[data-scene]')].map((el) => {
    const [a, b, e] = F.scenes[el.dataset.scene];
    return { el, a: hexRgb(a), b: hexRgb(b), clair: e.toUpperCase() === '#FFFFFF' ? 0 : 1, haut: 0, bas: 0 };
  });
  await document.fonts?.ready;
  const B = fabrique(F, d, leger);
  const ancres = [...document.querySelectorAll('.ancre')].filter((el) => !(leger && el.dataset.role === 'p3'));
  const objets = ancres.map((el, i) => {
    const role = ROLES[el.dataset.role] || ROLES.p1;
    const fab = B[el.dataset.objet] || B.galet;
    const g = fab.call(B);
    g.scale.multiplyScalar(TAILLE[el.dataset.objet] ?? 1);
    const pivot = new THREE.Group(); pivot.add(g);
    pivot.visible = false; scene.add(pivot);
    g.rotation.set(...role.pose);
    return { el, g, pivot, role, rect: { x: 0, y: 0, l: 0, h: 0 }, phase: i * 1.7, entree: 0, v: 0, impulsion: 0, rx: role.pose[0], rz: role.pose[2], vu: false, flamme: g.userData.flamme, vapeur: g.userData.vapeur };
  });

  let L = 1, H = 1, k = 1;
  let redessiner = null; // mouvement réduit : rendu à la demande (un canevas redimensionné est effacé)
  const mesurer = () => {
    L = canvas.clientWidth; H = canvas.clientHeight;
    renderer.setSize(L, H, false);
    camera.aspect = L / H; camera.updateProjectionMatrix();
    k = hautVue / H;
    uni.uRes.value.set(L * dpr, H * dpr); uni.uDpr.value = dpr;
    const sy = scrollY;
    for (const s of sections) { const r = s.el.getBoundingClientRect(); s.haut = r.top + sy; s.bas = r.bottom + sy; }
    for (const o of objets) { const r = o.el.getBoundingClientRect(); o.rect = { x: r.left, y: r.top + sy, l: r.width, h: r.height }; }
    redessiner?.();
  };
  mesurer();
  addEventListener('resize', mesurer);
  new ResizeObserver(mesurer).observe(document.getElementById('contenu'));

  // clic sur un objet : il bondit
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  addEventListener('pointerdown', (e) => {
    if (e.target.closest('a,button,input,textarea,select,.menu')) return;
    ndc.set((e.clientX / L) * 2 - 1, -(e.clientY / H) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    for (const o of objets) if (o.pivot.visible && ray.intersectObject(o.pivot, true).length) { o.impulsion = 9; o.v -= 3.5; }
  });

  const horloge = new THREE.Clock();
  let t = 0, moy = 16, n = 0, actif = true;
  document.addEventListener('visibilitychange', () => { actif = !document.hidden; if (actif) horloge.getDelta(); });
  const camQ = camera.quaternion;

  function image() {
    const dt = Math.min(horloge.getDelta(), 0.05);
    if (!reduit) t += dt;
    uni.uTime.value = t;
    const sy = scrollY;
    // sections visibles, de haut en bas
    const vis = sections.filter((s) => s.bas > sy && s.haut < sy + H).slice(0, 4);
    if (!vis.length) vis.push(sections[0]);
    for (let i = 0; i < 4; i++) {
      const s = vis[Math.min(i, vis.length - 1)];
      uni.uA.value[i].set(...s.a); uni.uB.value[i].set(...s.b); uni.uClair.value[i] = s.clair;
    }
    for (let i = 0; i < 3; i++) uni.uLim.value[i] = vis[i + 1] ? vis[i + 1].haut - sy : 1e5;
    const cibleVague = reduit ? 0 : 9 + Math.min(70, Math.abs(etat.vitesse) * 2.2);
    uni.uVague.value += (cibleVague - uni.uVague.value) * 0.08;
    if (etat.sourisPx) uni.uSouris.value.set(etat.sourisPx[0], H - etat.sourisPx[1]);

    for (const o of objets) {
      const r = o.rect, haut = r.y - sy;
      const cy = haut + r.h / 2, cx = r.x + r.l / 2;
      if (cy < -H * 0.9 || cy > H * 1.9 || r.h === 0) { o.pivot.visible = false; continue; }
      o.pivot.visible = true;
      if (!o.vu) { o.vu = true; if (reduit) o.entree = 1; }
      // entrée à ressort
      if (!reduit) { o.v += ((1 - o.entree) * 90 - o.v * 11) * dt; o.entree += o.v * dt; }
      const par = reduit ? 0 : (cy - H / 2) * o.role.par;
      const flotte = reduit ? 0 : Math.sin(t * 0.9 + o.phase) * 0.035 * r.h;
      let x = cx, y = cy - par + flotte;
      // la souris repousse un peu
      if (!reduit && etat.sourisPx) {
        const dx = x - etat.sourisPx[0], dy = y - etat.sourisPx[1], dist = Math.hypot(dx, dy), rayon = r.h * 0.9;
        if (dist < rayon && dist > 1) { const f = (1 - dist / rayon) ** 2 * r.h * 0.12; x += (dx / dist) * f; y += (dy / dist) * f; }
      }
      o.pivot.position.set((x - L / 2) * k, -(y - H / 2) * k, 0);
      o.pivot.scale.setScalar(Math.max(0.0001, r.h * k * o.entree));
      if (!reduit) {
        o.impulsion *= Math.exp(-dt * 2.2);
        o.g.rotation.y += dt * (o.role.tourne + Math.sign(o.role.tourne) * (Math.min(Math.abs(etat.vitesse), 40) * 0.05 + o.impulsion));
        const mx = etat.souris[0], my = etat.souris[1];
        o.rx += (o.role.pose[0] + my * 0.28 + etat.vitesse * 0.004 - o.rx) * 0.06;
        o.rz += (o.role.pose[2] - mx * 0.22 - o.rz) * 0.06;
        o.g.rotation.x = o.rx; o.g.rotation.z = o.rz;
      }
      if (o.flamme) { o.flamme.userData.mat.uniforms.uTime.value = t; o.flamme.quaternion.copy(o.g.quaternion).invert().multiply(camQ); }
      if (o.vapeur) { o.vapeur.userData.mat.uniforms.uTime.value = t; o.vapeur.quaternion.copy(o.g.quaternion).invert(); }
    }
    renderer.render(scene, camera);
    // allègement automatique si les images sont trop lentes
    if (!reduit && n < 400) {
      n++; moy = moy * 0.95 + dt * 1000 * 0.05;
      if (n % 90 === 0 && moy > 23 && dpr > 1) { dpr = Math.max(1, dpr - 0.25); renderer.setPixelRatio(dpr); mesurer(); }
    }
  }

  const sonde = (window.__scene = { images: 0, ms: 0, gpu: '' });
  try { const gl = renderer.getContext(); const ext = gl.getExtension('WEBGL_debug_renderer_info'); sonde.gpu = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : ''; } catch {}
  function boucle() { if (actif) { const t0 = performance.now(); image(); sonde.images++; sonde.ms = sonde.ms * 0.9 + (performance.now() - t0) * 0.1; } requestAnimationFrame(boucle); }
  if (reduit) {
    image();
    let attente = false;
    redessiner = () => { if (attente) return; attente = true; requestAnimationFrame(() => { attente = false; image(); }); };
    addEventListener('scroll', redessiner, { passive: true }); addEventListener('resize', redessiner);
    for (const o of objets) o.entree = 1;
    image();
  } else boucle();
  document.documentElement.classList.add('gl');
  return { renderer };
}
