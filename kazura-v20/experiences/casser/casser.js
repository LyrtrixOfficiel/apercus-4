/* Cassez votre vieux site : une expérience Kazura.
   Une vieille page de 2007 dessinée dans un canevas, cassée à coups de graines, avec une vraie physique
   (Matter.js 0.19.0 ; repli maison sans collisions si le CDN manque). Puis la liane pousse dans les fissures
   et le nouveau site de Lila (exemple imaginaire, fixe) éclot à la place.
   Réglages d'URL pour les essais : ?direct (sans la fenêtre d'accueil), ?pas (pas à pas, piloté par window.__casser),
   ?site (directement le site de Lila). */
(() => {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const Q = new URLSearchParams(location.search);
  const MANUEL = Q.has('pas');
  const DIRECT = Q.has('direct');
  const SITE = Q.has('site'); // essais : directement le site de Lila
  const mqReduit = matchMedia('(prefers-reduced-motion: reduce)');
  let REDUIT = mqReduit.matches;
  if (mqReduit.addEventListener) mqReduit.addEventListener('change', (e) => { REDUIT = e.matches; });
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const easeBack = (t) => { const c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
  let germe = 20070214;
  const rnd = () => { germe = (germe + 0x6D2B79F5) | 0; let t = Math.imul(germe ^ (germe >>> 15), 1 | germe); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const entre = (a, b) => a + rnd() * (b - a);
  const choix = (l) => l[(rnd() * l.length) | 0];

  const cv = $('#scene');
  const ctx = cv.getContext('2d');
  const hud = $('#hud'), outils = $('#outils'), bulle = $('#bulle');
  const ruineVal = $('#ruineVal'), ruineBarre = $('#ruineBarre'), btnPousser = $('#pousser');
  const neuf = $('#neuf');
  const annonceEl = $('#annonce');
  const LILA = window.__lila || null;

  let W = 0, H = 0, DPR = 1, MOBILE = false, E = 1, solY = 0, LENT = 1;
  let phase = 'intro', T = 0, actif = true;
  let outil = 'graine';

  /* ------------------------------------------------------------------ géométrie */
  function aire(p) { let a = 0; for (let i = 0, n = p.length; i < n; i++) { const q = p[i], r = p[(i + 1) % n]; a += q.x * r.y - r.x * q.y; } return a / 2; }
  function centreDe(p) {
    let a = 0, cx = 0, cy = 0;
    for (let i = 0, n = p.length; i < n; i++) { const q = p[i], r = p[(i + 1) % n]; const f = q.x * r.y - r.x * q.y; a += f; cx += (q.x + r.x) * f; cy += (q.y + r.y) * f; }
    a *= 0.5; if (Math.abs(a) < 1e-6) return { x: p[0].x, y: p[0].y };
    return { x: cx / (6 * a), y: cy / (6 * a) };
  }
  function couper(p, px, py, nx, ny) {
    const A = [], B = [];
    for (let i = 0, n = p.length; i < n; i++) {
      const c = p[i], s = p[(i + 1) % n];
      const dc = (c.x - px) * nx + (c.y - py) * ny, ds = (s.x - px) * nx + (s.y - py) * ny;
      if (dc >= 0) A.push(c); if (dc <= 0) B.push(c);
      if (dc * ds < 0) { const t = dc / (dc - ds); const I = { x: c.x + (s.x - c.x) * t, y: c.y + (s.y - c.y) * t }; A.push(I); B.push(I); }
    }
    return [nettoyer(A), nettoyer(B)];
  }
  function nettoyer(p) {
    const r = [];
    for (const q of p) { const d = r[r.length - 1]; if (!d || Math.hypot(d.x - q.x, d.y - q.y) > 0.6) r.push(q); }
    if (r.length > 2 && Math.hypot(r[0].x - r[r.length - 1].x, r[0].y - r[r.length - 1].y) < 0.6) r.pop();
    return r;
  }
  /** Découpe un polygone convexe en n morceaux convexes, plus fins près du point d'impact. */
  function decouper(poly, n, ix, iy) {
    const morceaux = [poly]; let essais = 0;
    while (morceaux.length < n && essais < n * 10) {
      essais++;
      morceaux.sort((a, b) => Math.abs(aire(b)) - Math.abs(aire(a)));
      const P = morceaux[0]; const c = centreDe(P);
      const vers = rnd() < 0.5 ? 0.45 : 0;
      const px = c.x + (ix - c.x) * vers + entre(-0.15, 0.15) * Math.sqrt(Math.abs(aire(P)));
      const py = c.y + (iy - c.y) * vers + entre(-0.15, 0.15) * Math.sqrt(Math.abs(aire(P)));
      const a = rnd() * Math.PI;
      const [A, B] = couper(P, px, py, Math.cos(a), Math.sin(a));
      if (A.length < 3 || B.length < 3) continue;
      const aP = Math.abs(aire(P)), aA = Math.abs(aire(A)), aB = Math.abs(aire(B));
      if (Math.min(aA, aB) < aP * 0.14) continue;
      morceaux.splice(0, 1, A, B);
    }
    return morceaux;
  }
  function contient(v, x, y) {
    let signe = 0;
    for (let i = 0, n = v.length; i < n; i++) {
      const a = v[i], b = v[(i + 1) % n];
      const c = (b.x - a.x) * (y - a.y) - (b.y - a.y) * (x - a.x);
      if (c !== 0) { const s = c > 0 ? 1 : -1; if (signe && s !== signe) return false; signe = s; }
    }
    return true;
  }

  /* ------------------------------------------------------------------ physique */
  function physMatter(M) {
    const moteur = M.Engine.create({ enableSleeping: true, positionIterations: 5, velocityIterations: 3 });
    moteur.gravity.y = 1.2;
    const monde = moteur.world; let bords = [];
    const opts = { friction: 0.5, frictionAir: 0.012, restitution: 0.12, density: 0.0012, sleepThreshold: 45 };
    return {
      vrai: true,
      fixe(cx, cy, w, h) { const b = M.Bodies.rectangle(cx, cy, w, h, { isStatic: true, friction: 0.6 }); M.Composite.add(monde, b); return b; },
      boite(cx, cy, w, h, a) { const b = M.Bodies.rectangle(cx, cy, w, h, Object.assign({}, opts, { angle: a || 0 })); M.Composite.add(monde, b); return b; },
      poly(v, fantome) {
        const verts = M.Vertices.clockwiseSort(v.map((p) => ({ x: p.x, y: p.y })));
        const b = M.Body.create(Object.assign({}, opts, {
          frictionAir: fantome ? 0.002 : 0.012, position: M.Vertices.centre(verts), vertices: verts,
          collisionFilter: fantome ? { category: 2, mask: 0, group: 0 } : { category: 1, mask: 0xFFFFFFFF, group: 0 },
        }));
        M.Composite.add(monde, b); return b;
      },
      retirer(b) { M.Composite.remove(monde, b); },
      sol(y, g, d) {
        for (const b of bords) M.Composite.remove(monde, b);
        bords = [M.Bodies.rectangle((g + d) / 2, y + 100, d - g + 600, 200, { isStatic: true, friction: 0.8 }),
          M.Bodies.rectangle(g - 100, y - 2000, 200, 4400, { isStatic: true }),
          M.Bodies.rectangle(d + 100, y - 2000, 200, 4400, { isStatic: true })];
        M.Composite.add(monde, bords);
      },
      sansSol() { for (const b of bords) M.Composite.remove(monde, b); bords = []; for (const b of M.Composite.allBodies(monde)) if (!b.isStatic) M.Sleeping.set(b, false); },
      pas() { M.Engine.update(moteur, 1000 / 60); },
      vitesse(b) { return { x: b.velocity.x, y: b.velocity.y }; },
      pousser(b, x, y) { M.Sleeping.set(b, false); M.Body.setVelocity(b, { x, y }); },
      tourner(b, w) { M.Body.setAngularVelocity(b, w); },
      vider() { M.Composite.clear(monde, false); M.Engine.clear(moteur); },
    };
  }
  function physSimple() {
    const corps = new Set(); let sol = Infinity, murG = -Infinity, murD = Infinity;
    const maj = (b) => { const c = Math.cos(b.angle), s = Math.sin(b.angle); for (let i = 0; i < b.local.length; i++) { const p = b.local[i]; b.vertices[i].x = b.position.x + p.x * c - p.y * s; b.vertices[i].y = b.position.y + p.x * s + p.y * c; } };
    const cree = (verts, statique, fantome) => {
      const c = centreDe(verts);
      const b = { position: { x: c.x, y: c.y }, angle: 0, velocity: { x: 0, y: 0 }, angularVelocity: 0, isStatic: statique, fantome,
        local: verts.map((p) => ({ x: p.x - c.x, y: p.y - c.y })), vertices: verts.map((p) => ({ x: p.x, y: p.y })) };
      corps.add(b); return b;
    };
    const rectV = (cx, cy, w, h) => [{ x: cx - w / 2, y: cy - h / 2 }, { x: cx + w / 2, y: cy - h / 2 }, { x: cx + w / 2, y: cy + h / 2 }, { x: cx - w / 2, y: cy + h / 2 }];
    return {
      vrai: false,
      fixe: (cx, cy, w, h) => cree(rectV(cx, cy, w, h), true),
      boite: (cx, cy, w, h, a) => { const b = cree(rectV(cx, cy, w, h), false); b.angle = a || 0; maj(b); return b; },
      poly: (v, f) => cree(v, false, f),
      retirer: (b) => corps.delete(b),
      sol: (y, g, d) => { sol = y; murG = g; murD = d; },
      sansSol: () => { sol = Infinity; murG = -Infinity; murD = Infinity; },
      pas() {
        for (const b of corps) {
          if (b.isStatic) continue;
          b.velocity.y += 0.34; b.velocity.x *= 0.995;
          b.position.x += b.velocity.x; b.position.y += b.velocity.y; b.angle += b.angularVelocity; b.angularVelocity *= 0.99; maj(b);
          if (b.fantome) continue;
          let maxY = -Infinity, minX = Infinity, maxX = -Infinity;
          for (const p of b.vertices) { if (p.y > maxY) maxY = p.y; if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x; }
          if (maxY > sol) { b.position.y -= maxY - sol; b.velocity.y *= -0.25; if (Math.abs(b.velocity.y) < 0.9) b.velocity.y = 0; b.velocity.x *= 0.8; b.angularVelocity *= 0.7; maj(b); }
          if (minX < murG) { b.position.x += murG - minX; b.velocity.x = Math.abs(b.velocity.x) * 0.4; maj(b); }
          if (maxX > murD) { b.position.x -= maxX - murD; b.velocity.x = -Math.abs(b.velocity.x) * 0.4; maj(b); }
        }
      },
      vitesse: (b) => ({ x: b.velocity.x, y: b.velocity.y }),
      pousser: (b, x, y) => { b.velocity.x = x; b.velocity.y = y; },
      tourner: (b, w) => { b.angularVelocity = w; },
      vider: () => corps.clear(),
    };
  }
  let Phys = null;
  const nouvellePhys = () => (window.Matter && window.Matter.Engine ? physMatter(window.Matter) : physSimple());

  /* ------------------------------------------------------------------ outils de dessin */
  const F_COMIC = "'Comic Sans MS', 'Comic Neue', 'Chalkboard SE', 'Chalkboard', cursive";
  const F_TIMES = "'Times New Roman', Times, 'Liberation Serif', serif";
  const F_ARIAL = "Arial, Helvetica, 'Liberation Sans', sans-serif";
  const F_COURIER = "'Courier New', Courier, 'Liberation Mono', monospace";
  const F_KAZ = "'Bricolage Grotesque', 'Segoe UI', system-ui, sans-serif";
  const mes = document.createElement('canvas').getContext('2d');
  function toile(w, h) { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w * DPR)); c.height = Math.max(1, Math.ceil(h * DPR)); return c; }
  function lignes(g, texte, maxW) {
    const out = []; let l = '';
    for (const m of texte.split(' ')) { const e = l ? l + ' ' + m : m; if (g.measureText(e).width > maxW && l) { out.push(l); l = m; } else l = e; }
    if (l) out.push(l); return out;
  }
  function biseau(g, x, y, w, h, creux, ep) {
    ep = ep || 2;
    g.fillStyle = creux ? '#404040' : '#ffffff'; g.fillRect(x, y, w, ep); g.fillRect(x, y, ep, h);
    g.fillStyle = creux ? '#ffffff' : '#404040'; g.fillRect(x, y + h - ep, w, ep); g.fillRect(x + w - ep, y, ep, h);
  }
  function etoile(g, x, y, r) { g.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, rr = i % 2 ? r * 0.35 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); g.fill(); }
  function texteAjuste(g, texte, poids, taille, famille, maxW) {
    let t = taille; g.font = `${poids} ${t}px ${famille}`;
    const w = g.measureText(texte).width; if (w > maxW) { t = taille * maxW / w; g.font = `${poids} ${t}px ${famille}`; }
    return t;
  }

  /* Les textes de la vieille page (Lila Fougère est imaginaire) */
  const TEXTES = {
    p1: { taille: 15, lh: 1.25, police: (t) => `bold ${t}px ${F_COMIC}`, couleur: '#c00000', fond: '#ffffff', pad: 8, texte: 'Bonjour et bienvenue sur mon site internet !!' },
    p2: { taille: 15, lh: 1.3, police: (t) => `${t}px ${F_TIMES}`, couleur: '#000000', fond: '#ffffff', pad: 8, texte: 'La sophrologie est une méthode douce de relaxation. Elle aide à mieux dormir, à gérer le stress et les émotions. Je vous reçois dans mon cabinet, sur rendez-vous.' },
    p3: { taille: 14, lh: 1.3, police: (t) => `${t}px ${F_TIMES}`, couleur: '#000080', fond: '#ffffcc', pad: 8, texte: 'Pour prendre rendez-vous, appelez-moi aux heures de bureau ou laissez un message sur le répondeur. Je vous rappelle dès que possible !' },
    pied: { taille: 12, lh: 1.3, police: (t) => `italic ${t}px ${F_TIMES}`, couleur: '#1a1a1a', fond: '#c0c0c0', pad: 6, texte: 'Dernière mise à jour : le 14/02/2007  |  Écrivez-moi  |  © 2007 Lila Fougère' },
  };
  function hauteurPara(cle, w, s) {
    const T0 = TEXTES[cle]; const t = T0.taille * s; mes.font = T0.police(t);
    return Math.round(lignes(mes, T0.texte, w - 2 * T0.pad * s).length * t * T0.lh + 2 * T0.pad * s);
  }

  let PHOTO = null;
  function photoPixels() {
    const w = 36, h = 24; const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
    const ciel = g.createLinearGradient(0, 0, 0, h * 0.56); ciel.addColorStop(0, '#5b8fd6'); ciel.addColorStop(1, '#f7b267');
    g.fillStyle = ciel; g.fillRect(0, 0, w, h * 0.56);
    g.fillStyle = '#fff3b0'; g.beginPath(); g.arc(w * 0.62, h * 0.44, 3.6, 0, TAU); g.fill();
    g.fillStyle = '#2f6f8f'; g.fillRect(0, h * 0.56, w, h * 0.22);
    g.fillStyle = '#7fb3c8'; g.fillRect(4, h * 0.62, 9, 1); g.fillRect(19, h * 0.7, 11, 1);
    g.fillStyle = '#e9d39a'; g.fillRect(0, h * 0.78, w, h * 0.22);
    g.fillStyle = '#d62828'; g.beginPath(); g.moveTo(5, 15); g.lineTo(14, 15); g.lineTo(9.5, 11); g.fill();
    g.fillStyle = '#333'; g.fillRect(9, 15, 1, 6);
    g.fillStyle = '#ffffff'; g.fillRect(27, 7, 3, 11); g.fillStyle = '#c00000'; g.fillRect(27, 9, 3, 2); g.fillRect(27, 13, 3, 2);
    const d = g.getImageData(0, 0, w, h);
    for (let i = 0; i < d.data.length; i += 4) for (let k = 0; k < 3; k++) d.data[i + k] = clamp(Math.round((d.data[i + k] + (rnd() - 0.5) * 30) / 36) * 36, 0, 255);
    g.putImageData(d, 0, 0); return c;
  }

  /* Le dessin de chaque bloc de la vieille page */
  const DESSINS = {
    titre(g, w, h, t, b) {
      const s = b.s;
      g.fillStyle = '#000080'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 16; i++) { g.fillStyle = i % 3 ? 'rgba(255,255,190,.75)' : 'rgba(255,255,255,.95)'; etoile(g, (i * 97.3 + 13) % w, (i * 41.7 + 7) % (h - 8 * s), (2 + (i % 3)) * s); }
      const l = b.large ? ['Bienvenue chez Lila Fougère !!!'] : ['Bienvenue chez', 'Lila Fougère !!!'];
      let taille = (b.large ? 34 : 25) * s;
      g.font = `bold ${taille}px ${F_COMIC}`;
      const plus = Math.max(...l.map((x) => g.measureText(x).width));
      if (plus > w - 20 * s) { taille *= (w - 20 * s) / plus; g.font = `bold ${taille}px ${F_COMIC}`; }
      g.textAlign = 'center'; g.textBaseline = 'middle';
      const y0 = b.large ? h * 0.42 : h * 0.3;
      l.forEach((x, i) => {
        const y = y0 + i * taille * 1.06;
        for (let k = 4; k > 0; k--) { g.fillStyle = k > 2 ? '#2a0040' : '#5a1070'; g.fillText(x, w / 2 + k * 0.8 * s, y + k * 0.8 * s); }
        const gr = g.createLinearGradient(0, y - taille / 2, 0, y + taille / 2);
        gr.addColorStop(0, '#fff200'); gr.addColorStop(0.5, '#ff8a00'); gr.addColorStop(1, '#ff2a8a');
        g.fillStyle = gr; g.fillText(x, w / 2, y);
      });
      texteAjuste(g, '~ Sophrologue à Saint-Glinglin-sur-Mer ~', 'italic', 13 * s, F_TIMES, w - 16 * s);
      g.fillStyle = '#ffff66'; g.fillText('~ Sophrologue à Saint-Glinglin-sur-Mer ~', w / 2, h - 11 * s);
    },
    defile(g, w, h, t, b) {
      const s = b.s; g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
      g.font = `bold ${13 * s}px ${F_COURIER}`; g.textBaseline = 'middle'; g.textAlign = 'left'; g.fillStyle = '#3cff5a';
      const msg = '*** NOUVEAU : les séances du jeudi soir ***  Joyeux Noël et bonne année 2008 !!!  ***  Pensez à signer mon livre d\'or  ***';
      const tw = g.measureText(msg).width; const x = w - ((t * 70 * s) % (tw + w));
      g.fillText(msg, x, h / 2 + 1);
    },
    bouton(g, w, h, t, b) {
      const s = b.s; g.fillStyle = '#c0c0c0'; g.fillRect(0, 0, w, h); biseau(g, 0, 0, w, h, false, 2);
      const r = 5 * s, bx = 9 * s + r, by = h / 2;
      const gr = g.createRadialGradient(bx - r * 0.4, by - r * 0.4, 1, bx, by, r); gr.addColorStop(0, '#9ff'); gr.addColorStop(1, '#0057b8');
      g.fillStyle = gr; g.beginPath(); g.arc(bx, by, r, 0, TAU); g.fill();
      const taille = texteAjuste(g, b.texte, 'bold', 13 * s, F_ARIAL, w - bx - r - 12 * s);
      g.fillStyle = '#000080'; g.textBaseline = 'middle'; g.textAlign = 'left';
      const x = bx + r + 6 * s; g.fillText(b.texte, x, by + 1);
      g.fillRect(x, by + taille * 0.55, g.measureText(b.texte).width, Math.max(1, s));
    },
    compteur(g, w, h, t, b) {
      const s = b.s; g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h); g.strokeStyle = '#808080'; g.lineWidth = 1; g.strokeRect(0.5, 0.5, w - 1, h - 1);
      g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#000';
      texteAjuste(g, 'Vous êtes le visiteur n°', '', 11.5 * s, F_ARIAL, w - 10 * s); g.fillText('Vous êtes le visiteur n°', w / 2, 11 * s);
      const chiffres = '000127'; const cw = Math.min(17 * s, (w - 16 * s) / 6), ch = 24 * s, x0 = (w - cw * 6) / 2, y0 = 21 * s;
      for (let i = 0; i < 6; i++) {
        g.fillStyle = '#111'; g.fillRect(x0 + i * cw, y0, cw - 2 * s, ch);
        g.fillStyle = '#39ff14'; g.font = `bold ${17 * s}px ${F_COURIER}`; g.fillText(chiffres[i], x0 + i * cw + (cw - 2 * s) / 2, y0 + ch / 2 + 1);
      }
      g.fillStyle = '#444'; texteAjuste(g, 'depuis le 01/01/2007', '', 9.5 * s, F_ARIAL, w - 10 * s); g.fillText('depuis le 01/01/2007', w / 2, h - 7 * s);
    },
    badge(g, w, h, t, b) {
      const s = b.s; const [c1, a, bb, c] = b.n === 0 ? ['#003399', '800 x 600', 'Meilleur', 'affichage'] : ['#990000', '100 %', 'Fait', 'à la main'];
      g.fillStyle = '#e8e8e8'; g.fillRect(0, 0, w, h); g.fillStyle = c1; g.fillRect(0, 0, w * 0.46, h);
      g.strokeStyle = '#000'; g.lineWidth = 1; g.strokeRect(0.5, 0.5, w - 1, h - 1);
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillStyle = '#fff'; texteAjuste(g, a, 'bold', 9.5 * s, F_ARIAL, w * 0.42); g.fillText(a, w * 0.23, h / 2);
      g.fillStyle = '#000'; texteAjuste(g, c, '', 9 * s, F_ARIAL, w * 0.5); g.fillText(bb, w * 0.73, h * 0.33); g.fillText(c, w * 0.73, h * 0.68);
    },
    photo(g, w, h, t, b) {
      const s = b.s; const cap = 18 * s;
      g.fillStyle = '#d4d0c8'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#0000ee'; g.fillRect(0, 0, w, h - cap);
      g.imageSmoothingEnabled = false; g.drawImage(PHOTO, 2, 2, w - 4, h - cap - 4); g.imageSmoothingEnabled = true;
      g.fillStyle = '#000'; g.textAlign = 'center'; g.textBaseline = 'middle';
      texteAjuste(g, 'cabinet.jpg (12 Ko)', 'italic', 11.5 * s, F_TIMES, w - 6); g.fillText('cabinet.jpg (12 Ko)', w / 2, h - cap / 2);
    },
    para(g, w, h, t, b) {
      const T0 = TEXTES[b.p], s = b.s, taille = T0.taille * s;
      g.fillStyle = T0.fond; g.fillRect(0, 0, w, h); g.strokeStyle = '#808080'; g.lineWidth = 1; g.strokeRect(0.5, 0.5, w - 1, h - 1);
      g.font = T0.police(taille); g.fillStyle = T0.couleur; g.textAlign = 'center'; g.textBaseline = 'middle';
      const ls = lignes(g, T0.texte, w - 2 * T0.pad * s); const y0 = (h - ls.length * taille * T0.lh) / 2 + taille * T0.lh / 2;
      ls.forEach((l, i) => g.fillText(l, w / 2, y0 + i * taille * T0.lh));
    },
    livre(g, w, h, t, b) {
      const s = b.s; g.fillStyle = '#c0c0c0'; g.fillRect(0, 0, w, h); biseau(g, 0, 0, w, h, false, 2);
      g.fillStyle = '#7a3e00'; g.save(); g.translate(14 * s, h / 2); g.rotate(-0.7); g.fillRect(-2 * s, -9 * s, 4 * s, 16 * s); g.fillStyle = '#222'; g.beginPath(); g.moveTo(-2 * s, 7 * s); g.lineTo(2 * s, 7 * s); g.lineTo(0, 11 * s); g.fill(); g.restore();
      g.fillStyle = '#000080'; g.textAlign = 'left'; g.textBaseline = 'middle';
      texteAjuste(g, 'Signez mon livre d\'or !', 'bold', 13 * s, F_ARIAL, w - 34 * s); g.fillText('Signez mon livre d\'or !', 26 * s, h / 2 + 1);
    },
    nouveau(g, w, h, t, b) {
      const s = b.s; g.fillStyle = '#e00000'; g.fillRect(0, 0, w, h); g.strokeStyle = '#ffee00'; g.lineWidth = 2 * s; g.strokeRect(2 * s, 2 * s, w - 4 * s, h - 4 * s);
      const p = (Math.sin(t * 2.4) + 1) / 2;
      g.fillStyle = p > 0.5 ? '#ffee00' : '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'middle';
      texteAjuste(g, 'NOUVEAU !', 'bold', 13 * s, F_ARIAL, w - 8 * s); g.fillText('NOUVEAU !', w / 2, h / 2 + 1);
    },
    chantier(g, w, h, t, b) {
      const s = b.s; g.fillStyle = '#ffcc00'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#111'; const pas = 22 * s, dec = (t * (REDUIT ? 6 : 18) * s) % (pas * 2);
      for (let x = -h - pas * 2 + dec; x < w + h; x += pas * 2) { g.beginPath(); g.moveTo(x, h); g.lineTo(x + pas, h); g.lineTo(x + pas + h, 0); g.lineTo(x + h, 0); g.fill(); }
      const pw = Math.min(w - 30 * s, 420 * s), px = (w - pw) / 2;
      g.fillStyle = '#fff'; g.fillRect(px, 5 * s, pw, h - 10 * s); g.strokeStyle = '#000'; g.lineWidth = 1.5; g.strokeRect(px, 5 * s, pw, h - 10 * s);
      g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#d00000';
      texteAjuste(g, 'SITE EN CONSTRUCTION', 'bold', 16 * s, F_ARIAL, pw - 12 * s); g.fillText('SITE EN CONSTRUCTION', w / 2, h / 2 - 5 * s);
      g.fillStyle = '#000'; texteAjuste(g, '(depuis 2007)', 'italic', 10.5 * s, F_TIMES, pw - 12 * s); g.fillText('(depuis 2007)', w / 2, h / 2 + 9 * s);
    },
    pied(g, w, h, t, b) { DESSINS.para(g, w, h, t, b); },
  };

  /* ------------------------------------------------------------------ la vieille page */
  let blocs = [], panneau = null, colonne = null;
  let eclats = [], eclatsFond = [], particules = [], anneaux = [], stickers = [], graines = [], impacts = [], taches = [];
  let lianes = [], secousse = 0, flash = 0, tLiane = 0, gel = 0, secDir = 0.6, eclairs = [], pollen = [], eclotFait = false, boumFait = false;
  const kazu = { x: 0, y: 0, s: 1, lance: 0, cible: null, dy: 0, vy: 0, alpha: 1, saute: false };
  let doigt = false, souris = null, appui = null, dernierTir = -9, dernierGros = -9;
  let ruine = 0, prochainCalcul = 0, lianeDemandee = -1;
  const dits = new Set();

  function plan(s, colW, compact) {
    const L = []; const pad = Math.round(10 * s); const inner = colW - 2 * pad; let y = pad;
    const large = colW >= 600;
    const ajoute = (type, x, yy, w, h, data) => L.push(Object.assign({ type, x, y: yy, w: Math.round(w), h: Math.round(h), s, large }, data || {}));
    const hT = Math.round((large ? 96 : 84) * s); ajoute('titre', pad, y, inner, hT); y += hT + Math.round(8 * s);
    const hM = Math.round(24 * s); ajoute('defile', pad, y, inner, hM); y += hM + Math.round(10 * s);
    const gap = Math.round((large ? 14 : 8) * s);
    if (large) {
      const sw = Math.round(176 * s); const mx = pad + sw + gap, mw = inner - sw - gap;
      let ys = y;
      for (const n of ['Accueil', 'Qui suis-je ?', 'Mes tarifs', 'Livre d\'or', 'Liens amis', 'Contact']) { ajoute('bouton', pad, ys, sw, 30 * s, { texte: n }); ys += Math.round(35 * s); }
      ys += Math.round(6 * s);
      ajoute('compteur', pad, ys, sw, 62 * s); ys += Math.round(70 * s);
      const bw = Math.round((sw - 6 * s) / 2);
      ajoute('badge', pad, ys, bw, 31 * s, { n: 0 }); ajoute('badge', pad + sw - bw, ys, bw, 31 * s, { n: 1 }); ys += Math.round(31 * s);
      let ym = y;
      const pw = Math.round(Math.min(mw * 0.46, 300 * s)), ph = Math.round(pw * 0.7 + 18 * s);
      ajoute('photo', mx, ym, pw, ph);
      const tx = mx + pw + gap, tw = mw - pw - gap; let yt = ym;
      const h1 = hauteurPara('p1', tw, s); ajoute('para', tx, yt, tw, h1, { p: 'p1' }); yt += h1 + Math.round(8 * s);
      const h2 = hauteurPara('p2', tw, s); ajoute('para', tx, yt, tw, h2, { p: 'p2' }); yt += h2;
      ym = Math.max(ym + ph, yt) + Math.round(10 * s);
      const h3 = hauteurPara('p3', mw, s); ajoute('para', mx, ym, mw, h3, { p: 'p3' }); ym += h3 + Math.round(10 * s);
      const lw = Math.round(Math.min(230 * s, mw * 0.6)); ajoute('livre', mx, ym, lw, 32 * s);
      ajoute('nouveau', mx + lw + gap, ym, 92 * s, 32 * s); ym += Math.round(32 * s);
      y = Math.max(ys, ym) + Math.round(12 * s);
    } else {
      const bw = (inner - 2 * gap) / 3, bh = Math.round(30 * s);
      ['Accueil', 'Qui suis-je', 'Tarifs', 'Livre d\'or', 'Liens', 'Contact'].forEach((n, i) => ajoute('bouton', pad + (i % 3) * (bw + gap), y + Math.floor(i / 3) * (bh + gap), bw, bh, { texte: n }));
      y += 2 * bh + gap + Math.round(10 * s);
      const pw = Math.round(inner * 0.5), ph = Math.round(pw * 0.7 + 18 * s);
      ajoute('photo', pad, y, pw, ph);
      const tx = pad + pw + gap, tw = inner - pw - gap;
      const h1 = hauteurPara('p1', tw, s); ajoute('para', tx, y, tw, h1, { p: 'p1' });
      ajoute('nouveau', tx + (tw - Math.min(tw, 96 * s)) / 2, y + h1 + Math.round(10 * s), Math.min(tw, 96 * s), 30 * s);
      y += Math.max(ph, h1 + 40 * s) + Math.round(10 * s);
      const h2 = hauteurPara('p2', inner, s); ajoute('para', pad, y, inner, h2, { p: 'p2' }); y += h2 + Math.round(10 * s);
      if (!compact) { const h3 = hauteurPara('p3', inner, s); ajoute('para', pad, y, inner, h3, { p: 'p3' }); y += h3 + Math.round(10 * s); }
      const cw = Math.round(inner * 0.56), rw = inner - cw - gap;
      ajoute('compteur', pad, y, cw, 62 * s);
      ajoute('badge', pad + cw + gap, y, rw, 28 * s, { n: 0 }); ajoute('badge', pad + cw + gap, y + Math.round(34 * s), rw, 28 * s, { n: 1 });
      y += Math.round(62 * s) + Math.round(10 * s);
    }
    const hC = Math.round((large ? 50 : 46) * s); ajoute('chantier', pad, y, inner, hC); y += hC + Math.round(8 * s);
    const hP = hauteurPara('pied', inner, s); ajoute('pied', pad, y, inner, hP, { p: 'pied' }); y += hP + pad;
    return { L, h: y };
  }

  function mettreEnPage() {
    const r = cv.getBoundingClientRect();
    W = Math.round(r.width); H = Math.round(r.height);
    MOBILE = matchMedia('(pointer: coarse)').matches || W < 760;
    DPR = Math.min(window.devicePixelRatio || 1, W * H > 2.2e6 ? 1.25 : 2);
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    E = clamp(Math.min(W, H * 1.3) / 900, 0.62, 1.6);
    LENT = REDUIT ? 1.4 : 1;
    const barre = outils.getBoundingClientRect().height || 80, haut = hud.getBoundingClientRect().height || 56;
    solY = H - barre;
    const top = haut + 6, bas = solY - (MOBILE ? 58 : 74) * clamp(E, 0.8, 1.4), A = bas - top;
    const large = W >= 700;
    const sMax = large ? Math.min(1.6, (W - 40) / 800, A / 520) : Math.min(1.15, (W - 16) / 360);
    let choisi = null;
    for (const compact of [false, true]) {
      for (let s = sMax; s >= 0.55; s -= 0.025) {
        const colW = large ? Math.min(W - 40, Math.round(800 * s)) : W - 16;
        const p = plan(s, colW, compact);
        choisi = { p, s, colW };
        if (p.h <= A) break;
      }
      if (choisi.p.h <= A) break;
    }
    const colX = Math.round((W - choisi.colW) / 2), colY = Math.round(top + Math.max(0, (A - choisi.p.h) / 2));
    colonne = { x: colX, y: colY, w: choisi.colW, h: choisi.p.h };

    if (!PHOTO) PHOTO = photoPixels();
    if (Phys) Phys.vider();
    Phys = nouvellePhys();
    Phys.sol(solY, 0, W);
    blocs = []; eclats = []; eclatsFond = []; particules = []; anneaux = []; stickers = []; graines = []; impacts = []; lianes = [];
    for (const d of choisi.p.L) {
      const b = Object.assign({}, d, { x: colX + d.x, y: colY + d.y, etat: 'fixe', fissures: 0, fentes: [], vivant: ['defile', 'chantier', 'nouveau'].includes(d.type) });
      b.cv = toile(b.w, b.h); b.g = b.cv.getContext('2d');
      rafraichir(b);
      b.corps = Phys.fixe(b.x + b.w / 2, b.y + b.h / 2, b.w, b.h);
      blocs.push(b);
    }
    dessinerPanneau();
    photographier();
    kazu.s = clamp(E * 1.05, 0.82, 1.55);
    kazu.x = large ? clamp(colX - 46 * kazu.s, 40 * kazu.s, W - 60) : 34 * kazu.s;
    kazu.y = solY; kazu.cible = { x: W / 2, y: H / 2 };
  }

  // Une photo de la vieille page intacte, pour l'avant et après de la fin (une seule fois).
  let photoFaite = false;
  function photographier() {
    if (photoFaite || !colonne) return; photoFaite = true;
    try {
      const k = Math.min(1, 560 / colonne.w), hc = Math.min(colonne.h, colonne.w * 0.75);
      const c = document.createElement('canvas'); c.width = Math.round(colonne.w * k); c.height = Math.round(hc * k);
      const g = c.getContext('2d'); g.scale(k, k); g.translate(-colonne.x, -colonne.y);
      g.drawImage(panneau.cv, 0, 0, W, H);
      for (const b of blocs) g.drawImage(b.cv, b.x, b.y, b.w, b.h);
      $('#finAvant').src = c.toDataURL('image/jpeg', 0.86);
    } catch (e) { /* rien */ }
  }
  function dessinerPanneau() {
    const c = toile(W, H), g = c.getContext('2d'); g.setTransform(DPR, 0, 0, DPR, 0, 0);
    // fond carrelé façon « background.gif »
    const t = 18;
    g.fillStyle = '#8fa9c4'; g.fillRect(0, 0, W, H);
    for (let y = 0; y < H; y += t) for (let x = ((y / t) % 2) * t; x < W; x += t * 2) { g.fillStyle = '#86a0bc'; g.fillRect(x, y, t, t); }
    g.fillStyle = 'rgba(255,255,255,.55)';
    for (let y = t / 2; y < H; y += t * 2) for (let x = t / 2 + ((y / (t * 2)) % 2) * t; x < W; x += t * 2) g.fillRect(x - 1, y - 1, 2, 2);
    const { x, y, w, h } = colonne;
    g.fillStyle = '#d4d0c8'; g.fillRect(x, y, w, h); biseau(g, x, y, w, h, false, 3);
    panneau = { cv: c, g, trous: 0, eclate: false };
  }

  function rafraichir(b) {
    const g = b.g; g.setTransform(DPR, 0, 0, DPR, 0, 0); g.clearRect(0, 0, b.w, b.h);
    DESSINS[b.type](g, b.w, b.h, T, b);
    tracerFentes(g, b.fentes);
  }
  function tracerFentes(g, traits) {
    if (!traits.length) return;
    g.lineJoin = 'round'; g.lineCap = 'round';
    g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 1.4;
    for (const p of traits) { g.beginPath(); p.forEach((q, i) => (i ? g.lineTo(q.x + 1.2, q.y + 1.2) : g.moveTo(q.x + 1.2, q.y + 1.2))); g.stroke(); }
    g.strokeStyle = 'rgba(15,12,10,.88)'; g.lineWidth = 2.1;
    for (const p of traits) { g.beginPath(); p.forEach((q, i) => (i ? g.lineTo(q.x, q.y) : g.moveTo(q.x, q.y))); g.stroke(); }
  }

  /* ------------------------------------------------------------------ casser */
  function versLocal(b, wx, wy) {
    if (b.etat === 'fixe') return { x: wx - b.x, y: wy - b.y };
    const p = b.corps.position, a = -b.corps.angle, c = Math.cos(a), s = Math.sin(a);
    return { x: (wx - p.x) * c - (wy - p.y) * s + b.w / 2, y: (wx - p.x) * s + (wy - p.y) * c + b.h / 2 };
  }
  function fendre(b, wx, wy) {
    b.fissures++;
    const l = versLocal(b, wx, wy); const lx = clamp(l.x, 2, b.w - 2), ly = clamp(l.y, 2, b.h - 2);
    const traits = []; const nb = 3 + ((rnd() * 3) | 0);
    for (let k = 0; k < nb; k++) {
      let a = (k / nb) * TAU + entre(-0.4, 0.4), x = lx, y = ly; const pts = [{ x, y }];
      const seg = 4 + ((rnd() * 5) | 0);
      for (let j = 0; j < seg; j++) { a += entre(-0.5, 0.5); const L = entre(5, 13) * E; x += Math.cos(a) * L; y += Math.sin(a) * L; pts.push({ x, y }); }
      traits.push(pts);
    }
    b.fentes.push(...traits);
    if (b.vivant) rafraichir(b); else { b.g.setTransform(DPR, 0, 0, DPR, 0, 0); tracerFentes(b.g, traits); }
  }
  function lacher(b, x, y, f) {
    if (b.etat !== 'fixe') return;
    Phys.retirer(b.corps);
    b.etat = 'chute';
    b.corps = Phys.boite(b.x + b.w / 2, b.y + b.h / 2, b.w, b.h, 0);
    const dx = b.x + b.w / 2 - x, dy = b.y + b.h / 2 - y, d = Math.hypot(dx, dy) || 1;
    Phys.pousser(b.corps, (dx / d) * 3.2 * f + entre(-1, 1), (dy / d) * 2.5 * f - 1.5 * f);
    Phys.tourner(b.corps, entre(-0.06, 0.06) * f);
  }
  function eclater(b, x, y, f) {
    if (b.etat === 'eclate' || b.etat === 'parti') return;
    let cx, cy, ang = 0, vb = { x: 0, y: 0 };
    if (b.etat === 'fixe') { cx = b.x + b.w / 2; cy = b.y + b.h / 2; }
    else { cx = b.corps.position.x; cy = b.corps.position.y; ang = b.corps.angle; vb = Phys.vitesse(b.corps); }
    const l = versLocal(b, x, y);
    Phys.retirer(b.corps); b.corps = null; b.etat = 'eclate';
    if (b.vivant) rafraichir(b);
    const n = clamp(Math.round((b.w * b.h) / (MOBILE ? 4200 : 6500)), 3, MOBILE ? 6 : 9);
    const morceaux = decouper([{ x: 0, y: 0 }, { x: b.w, y: 0 }, { x: b.w, y: b.h }, { x: 0, y: b.h }], n, clamp(l.x, 0, b.w), clamp(l.y, 0, b.h));
    for (const p of morceaux) creerEclat(b.cv, p, cx, cy, ang, b.w, b.h, x, y, f, vb, false);
  }
  function decouperImage(src, poly, sw, sh) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const p of poly) { x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x); y1 = Math.max(y1, p.y); }
    x0 = Math.floor(x0) - 1; y0 = Math.floor(y0) - 1; x1 = Math.ceil(x1) + 1; y1 = Math.ceil(y1) + 1;
    const w = x1 - x0, h = y1 - y0;
    // les morceaux bougent : une définition un peu plus basse que l'écran suffit, et coûte bien moins cher à découper
    const k = Math.min(DPR, MOBILE ? 1.3 : 1.6);
    const toileK = (w2, h2) => { const t = document.createElement('canvas'); t.width = Math.max(1, Math.ceil(w2 * k)); t.height = Math.max(1, Math.ceil(h2 * k)); return t; };
    const trace = (g) => { g.setTransform(k, 0, 0, k, -x0 * k, -y0 * k); g.beginPath(); poly.forEach((p, i) => (i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y))); g.closePath(); };
    const c = toileK(w, h), g = c.getContext('2d');
    trace(g); g.save(); g.clip(); g.drawImage(src, 0, 0, sw, sh);
    // la cassure : un liseré clair à l'intérieur du bord, puis un trait sombre très fin (le morceau a une épaisseur)
    g.lineJoin = 'round'; g.lineWidth = 3.4; g.strokeStyle = 'rgba(255,255,255,.62)'; g.stroke();
    g.lineWidth = 1.2; g.strokeStyle = 'rgba(12,10,8,.55)'; g.stroke(); g.restore();
    // l'ombre portée : la même forme, toute sombre, dessinée décalée sous le morceau
    const o = toileK(w, h), go = o.getContext('2d'); trace(go); go.fillStyle = '#0b0a14'; go.fill();
    return { c, o, ox: x0, oy: y0, w, h };
  }
  function creerEclat(src, poly, cx, cy, ang, w, h, ix, iy, f, vb, fantome) {
    const img = decouperImage(src, poly, w, h);
    const ca = Math.cos(ang), sa = Math.sin(ang);
    const monde = poly.map((p) => { const lx = p.x - w / 2, ly = p.y - h / 2; return { x: cx + lx * ca - ly * sa, y: cy + lx * sa + ly * ca }; });
    const corps = Phys.poly(monde, fantome);
    const cl = centreDe(poly);
    const e = { corps, img: img.c, ombre: img.o, dx: img.ox - cl.x, dy: img.oy - cl.y, iw: img.w, ih: img.h, base: ang, ne: T, aire: Math.abs(aire(poly)) };
    const px = corps.position.x - ix, py = corps.position.y - iy, d = Math.hypot(px, py) || 1;
    const k = f * (fantome ? 1.6 : 7.5) * entre(0.5, 1.15) * clamp(1.4 - d / (170 * E), 0.35, 1.3);
    Phys.pousser(corps, vb.x + (px / d) * k, vb.y + (py / d) * k - (fantome ? 0 : 2.6 * f));
    Phys.tourner(corps, entre(-0.13, 0.13) * f);
    (fantome ? eclatsFond : eclats).push(e);
    const MAX = MOBILE ? 80 : 150;
    while (eclats.length > MAX) { const v = eclats.shift(); Phys.retirer(v.corps); poussiere(v.corps.position.x, v.corps.position.y, 3, 1); }
  }
  function trouer(x, y, r) {
    if (!panneau || panneau.eclate) return;
    const g = panneau.g; g.setTransform(DPR, 0, 0, DPR, 0, 0);
    const cercle = []; for (let i = 0; i < 9; i++) { const a = (i / 9) * TAU; cercle.push({ x: x + Math.cos(a) * r * 0.85, y: y + Math.sin(a) * r * 0.85 }); }
    for (const p of decouper(cercle, 3, x, y)) creerEclat(panneau.cv, p, W / 2, H / 2, 0, W, H, x, y, 0.55, { x: 0, y: 0 }, false);
    const trou = []; for (let i = 0; i < 13; i++) { const a = (i / 13) * TAU, rr = r * entre(0.82, 1.22); trou.push({ x: x + Math.cos(a) * rr, y: y + Math.sin(a) * rr }); }
    g.beginPath(); trou.forEach((p, i) => (i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y))); g.closePath();
    g.lineWidth = 7; g.strokeStyle = 'rgba(30,24,20,.4)'; g.stroke();
    g.lineWidth = 3; g.strokeStyle = 'rgba(110,231,183,.85)'; g.stroke();
    g.save(); g.globalCompositeOperation = 'destination-out'; g.fill(); g.restore();
    panneau.trous++;
  }
  function souffle(x, y, R, force) {
    const viser = (corps) => {
      const dx = corps.position.x - x, dy = corps.position.y - y, d = Math.hypot(dx, dy);
      if (d > R || d < 0.01) return;
      const k = force * (1 - d / R); const v = Phys.vitesse(corps);
      Phys.pousser(corps, v.x + (dx / d) * k, v.y + (dy / d) * k - k * 0.4);
    };
    for (const e of eclats) viser(e.corps);
    for (const b of blocs) if (b.etat === 'chute') viser(b.corps);
  }
  function impact(x, y, gros) {
    const R = (gros ? 125 : 48) * E;
    impacts.push({ x, y });
    let touche = false, cible = null;
    for (const b of blocs) {
      if (b.etat === 'fixe' && x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) cible = b;
      else if (b.etat === 'chute' && contient(b.corps.vertices, x, y)) cible = b;
    }
    for (const b of blocs) if (b.etat === 'chute' && contient(b.corps.vertices, x, y)) { eclater(b, x, y, gros ? 1.5 : 1); touche = true; }
    for (const b of blocs) {
      if (b.etat !== 'fixe') continue;
      const nx = clamp(x, b.x, b.x + b.w), ny = clamp(y, b.y, b.y + b.h), d = Math.hypot(nx - x, ny - y);
      if (d === 0) { eclater(b, x, y, gros ? 1.5 : 1); touche = true; }
      else if (gros) { if (d < R * 0.55) eclater(b, nx, ny, 1.1); else if (d < R) { fendre(b, nx, ny); lacher(b, x, y, 1); } else if (d < R * 1.5) fendre(b, nx, ny); }
      else if (d < R * 0.7) { fendre(b, nx, ny); if (b.fissures >= 3) lacher(b, x, y, 0.7); }
    }
    for (const e of eclats) if (!touche && contient(e.corps.vertices, x, y)) touche = true;
    souffle(x, y, R * 1.9, gros ? 15 : 8);
    if (!touche) trouer(x, y, (gros ? 44 : 21) * E);
    // arrêt sur image : le monde se fige une fraction de seconde au moment du choc
    gel = Math.max(gel, (gros ? 0.085 : touche ? 0.03 : 0) * (REDUIT ? 0.5 : 1));
    secDir = rnd() * TAU;
    effets(x, y, gros, PAL[cible ? cible.type : 'fond'] || PAL.fond);
    if (!dits.has('premier')) { dits.add('premier'); prechargerNeuf(); dire(MOBILE ? 'Ha ! Encore !' : 'Ha ! Encore ! Restez appuyé pour une rafale.'); }
    else if (impacts.length >= 4 && !dits.has('fouet') && !dits.has('fouet-ok')) { dits.add('fouet'); dire(MOBILE ? "Glissez le doigt d'un coup : la liane tranche !" : "Cliquez et glissez d'un coup : la liane tranche !", 3.8); }
    compter(touche ? 1 : 0);
  }

  /* ------------------------------------------------------------------ effets */
  const PAL = {
    titre: ['#000080', '#ff8a00', '#fff200', '#ff2a8a'], defile: ['#000000', '#3cff5a'], bouton: ['#c0c0c0', '#0057b8', '#ffffff'],
    compteur: ['#111111', '#39ff14', '#ffffff'], badge: ['#003399', '#990000', '#e8e8e8'], photo: ['#5b8fd6', '#f7b267', '#2f6f8f', '#e9d39a'],
    para: ['#ffffff', '#ffffcc', '#c00000'], livre: ['#c0c0c0', '#7a3e00'], nouveau: ['#e00000', '#ffee00'], chantier: ['#ffcc00', '#111111', '#ffffff'],
    pied: ['#c0c0c0', '#ffffff'], fond: ['#d4d0c8', '#8fa9c4', '#ffffff'],
  };
  const COUL = ['#6ee7b7', '#10b981', '#c9b8ff', '#e9c987', '#a7f3d0'];
  const MOTS = ['CRAC !', 'POUF !', 'PAF !', 'BOUM !', 'SCRONCH !', 'TCHAC !'];
  const MOTS_GROS = ['BADABOUM !', 'PATATRAS !', 'KABOUM !'];
  function poussiere(x, y, n, f) {
    for (let i = 0; i < n; i++) particules.push({ k: 'p', x: x + entre(-10, 10) * E, y: y + entre(-10, 10) * E, vx: entre(-40, 40), vy: entre(-60, 0), vie: 0, duree: entre(0.7, 1.3), taille: entre(9, 20) * E * f });
  }
  function effets(x, y, gros, pal) {
    pal = pal || PAL.fond;
    const n = Math.round((gros ? 16 : 6) * (MOBILE ? 0.7 : 1));
    for (let i = 0; i < n; i++) {
      const a = rnd() * TAU, v = entre(140, gros ? 480 : 320) * E;
      particules.push({ k: 'f', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 160 * E, rot: rnd() * TAU, vr: entre(-9, 9), vie: 0, duree: entre(0.8, 1.4), taille: entre(5, 9) * E, c: choix(COUL) });
    }
    // copeaux : de petits éclats aux couleurs du bloc touché, qui rebondissent sur le sol
    const nc = Math.round((gros ? 24 : 10) * (MOBILE ? 0.7 : 1));
    for (let i = 0; i < nc; i++) {
      const a = -Math.PI / 2 + entre(-1.6, 1.6), v = entre(180, gros ? 700 : 440) * E;
      particules.push({ k: 'c', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, rot: rnd() * TAU, vr: entre(-16, 16), vie: 0, duree: entre(1.3, 2.3), taille: entre(2.6, gros ? 7.5 : 5.5) * E, c: choix(pal), forme: rnd() });
    }
    poussiere(x, y, gros ? 7 : 3, gros ? 1.5 : 1);
    const ne = gros ? 3 : rnd() < 0.25 ? 1 : 0;
    for (let i = 0; i < ne; i++) { const a = rnd() * TAU, v = entre(160, 380) * E; particules.push({ k: 'e', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 220 * E, rot: rnd() * TAU, vr: entre(-3, 3), vie: 0, duree: entre(0.9, 1.4), taille: entre(9, 16) * E }); }
    eclairs.push({ x, y, vie: 0, duree: gros ? 0.26 : 0.16, r: (gros ? 130 : 54) * E, n: gros ? 16 : 10, rot: rnd() * TAU, gros });
    anneaux.push({ x, y, r: (gros ? 150 : 62) * E, vie: 0, duree: gros ? 0.55 : 0.4 });
    secousse = Math.max(secousse, gros ? 15 : 5);
    if (gros && !REDUIT) flash = 0.22;
    if (gros || rnd() < 0.2) sticker(x, y - (gros ? 70 : 34) * E, gros);
    if (!REDUIT && doigt && navigator.vibrate && gros) { try { navigator.vibrate(18); } catch (e) { /* rien */ } }
  }
  function etoile4(g, r) {
    g.beginPath();
    for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4 - Math.PI / 2, rr = i % 2 ? r * 0.3 : r; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
    g.closePath(); g.lineJoin = 'round'; g.lineWidth = Math.max(2, r * 0.22); g.strokeStyle = '#05070b'; g.stroke(); g.fillStyle = '#fbfaf5'; g.fill();
  }
  let TRAME = null;
  function trame(g) {
    if (TRAME) return TRAME;
    const c = document.createElement('canvas'); c.width = c.height = 10; const t = c.getContext('2d');
    t.fillStyle = '#0a5a3e'; t.fillRect(0, 0, 10, 10); t.fillStyle = '#5ff0a8';
    t.beginPath(); t.arc(2.5, 2.5, 2.1, 0, TAU); t.arc(7.5, 7.5, 2.1, 0, TAU); t.fill();
    TRAME = g.createPattern(c, 'repeat'); return TRAME;
  }
  function sticker(x, y, gros, mot) {
    stickers.push({ gros, mot: mot || choix(gros ? MOTS_GROS : MOTS), x, y, rot: entre(-0.2, 0.2), vie: 0, duree: gros ? 1.15 : 0.85, taille: (gros ? (MOBILE ? 40 : 56) : (MOBILE ? 28 : 36)) * clamp(E, 0.75, 1.5), c: choix(['#e9f99a', '#6ee7b7', '#f2d98f', '#c9b8ff']) });
    while (stickers.length > 2) stickers.shift();
  }

  /* ------------------------------------------------------------------ Kazu et ses graines */
  function lancer(tx, ty, gros) {
    const k = kazu; const dir = tx >= k.x ? 1 : -1;
    const x0 = k.x + 14 * k.s * dir, y0 = k.y - 38 * k.s;
    const d = Math.hypot(tx - x0, ty - y0);
    const dur = clamp(0.16 + d / 2600, 0.18, 0.46) * (gros ? 1.25 : 1);
    graines.push({ x0, y0, x1: tx, y1: ty, cx: (x0 + tx) / 2, cy: Math.min(y0, ty) - (50 + d * 0.16) * E, t: 0, dur, gros, x: x0, y: y0, px: x0, py: y0 });
    k.lance = 0.22; k.cible = { x: tx, y: ty };
  }
  function tir(x, y) {
    if (phase !== 'jeu') return;
    if (outil === 'bourgeon') { if (T - dernierGros < 0.65) return; dernierGros = T; lancer(x, y, true); }
    else lancer(x, y, false);
    dernierTir = T;
  }

  /* ------------------------------------------------------------------ le coup de liane : on glisse, ça tranche */
  let traine = [], coupes = [], dernierFouet = -9;
  const combo = { n: 0, t: -9, dit: 0 };
  function compter(n) {
    if (T - combo.t > 1.5) { combo.n = 0; combo.dit = 0; }
    combo.n += n; combo.t = T;
    const palier = Math.floor(combo.n / 6) * 6;
    if (palier >= 6 && palier > combo.dit) { combo.dit = palier; sticker(clamp(kazu.x + 90 * E, 120, W - 120), kazu.y - 120 * E, false, 'COMBO ×' + combo.n + ' !'); }
  }
  function croiseSeg(ax, ay, bx, by, cx, cy, dx, dy) {
    const d = (bx - ax) * (dy - cy) - (by - ay) * (dx - cx); if (!d) return false;
    const u = ((cx - ax) * (dy - cy) - (cy - ay) * (dx - cx)) / d, v = ((cx - ax) * (by - ay) - (cy - ay) * (bx - ax)) / d;
    return u >= 0 && u <= 1 && v >= 0 && v <= 1;
  }
  function touchePoly(x0, y0, x1, y1, V) {
    if (contient(V, x1, y1)) return true;
    for (let i = 0, n = V.length; i < n; i++) { const a = V[i], b = V[(i + 1) % n]; if (croiseSeg(x0, y0, x1, y1, a.x, a.y, b.x, b.y)) return true; }
    return false;
  }
  // Les morceaux nés d'une coupe s'écartent de part et d'autre de la ligne et filent dans le sens du geste.
  function ecarter(n0, x, y, ux, uy, f) {
    for (let i = n0; i < eclats.length; i++) {
      const e = eclats[i], p = e.corps.position, v = Phys.vitesse(e.corps);
      const cote = Math.sign((p.x - x) * -uy + (p.y - y) * ux) || 1;
      Phys.pousser(e.corps, v.x + ux * 4.2 * f - uy * cote * 2.6, v.y + uy * 4.2 * f + ux * cote * 2.6 - 1.2);
      Phys.tourner(e.corps, cote * entre(0.04, 0.12));
    }
  }
  function trancher(b, x, y, ux, uy) {
    let cx, cy, ang = 0, vb = { x: 0, y: 0 };
    if (b.etat === 'fixe') { cx = b.x + b.w / 2; cy = b.y + b.h / 2; }
    else if (b.etat === 'chute') { cx = b.corps.position.x; cy = b.corps.position.y; ang = b.corps.angle; vb = Phys.vitesse(b.corps); }
    else return null;
    const l = versLocal(b, x, y);
    const c = Math.cos(-ang), s = Math.sin(-ang), lx = ux * c - uy * s, ly = ux * s + uy * c;
    const [A, B] = couper([{ x: 0, y: 0 }, { x: b.w, y: 0 }, { x: b.w, y: b.h }, { x: 0, y: b.h }], l.x, l.y, -ly, lx);
    if (A.length < 3 || B.length < 3 || Math.min(Math.abs(aire(A)), Math.abs(aire(B))) < 50) return null;
    Phys.retirer(b.corps); b.corps = null; b.etat = 'eclate';
    if (b.vivant) rafraichir(b);
    const n0 = eclats.length;
    for (const p of [A, B]) {
      const grand = Math.abs(aire(p)) > (MOBILE ? 9000 : 15000);
      for (const m of (grand ? decouper(p, 2, l.x, l.y) : [p])) creerEclat(b.cv, m, cx, cy, ang, b.w, b.h, x, y, 0.35, vb, false);
    }
    ecarter(n0, x, y, ux, uy, 1);
    // le milieu de la coupe, pour l'éclair et les copeaux
    const t = (cx - x) * ux + (cy - y) * uy;
    return { x: x + ux * t, y: y + uy * t, L: Math.hypot(b.w, b.h) * 0.6, pal: PAL[b.type] || PAL.fond };
  }
  function trancherEclat(e, x, y, ux, uy) {
    if (e.aire < (MOBILE ? 650 : 1000) * E * E || T - e.ne < 0.14) return null;
    const p = e.corps.position, a = e.corps.angle + e.base, c = Math.cos(a), s = Math.sin(a);
    const versImg = (v) => { const dx = v.x - p.x, dy = v.y - p.y; return { x: dx * c + dy * s - e.dx, y: -dx * s + dy * c - e.dy }; };
    const poly = e.corps.vertices.map(versImg), l = versImg({ x, y });
    const lx = ux * c + uy * s, ly = -ux * s + uy * c;
    const [A, B] = couper(poly, l.x, l.y, -ly, lx);
    if (A.length < 3 || B.length < 3 || Math.min(Math.abs(aire(A)), Math.abs(aire(B))) < 36) return null;
    const icx = e.dx + e.iw / 2, icy = e.dy + e.ih / 2;
    const wx = p.x + icx * c - icy * s, wy = p.y + icx * s + icy * c, vb = Phys.vitesse(e.corps);
    Phys.retirer(e.corps); eclats.splice(eclats.indexOf(e), 1);
    const n0 = eclats.length;
    for (const m of [A, B]) creerEclat(e.img, m, wx, wy, a, e.iw, e.ih, x, y, 0.2, vb, false);
    ecarter(n0, x, y, ux, uy, 0.8);
    const t = (p.x - x) * ux + (p.y - y) * uy;
    return { x: x + ux * t, y: y + uy * t, L: Math.sqrt(e.aire) * 0.8, pal: null };
  }
  // La page elle-même garde la cicatrice du coup : une déchirure fine, bordée de jade, où passe la lumière.
  function balafrer(x0, y0, x1, y1) {
    if (!panneau || panneau.eclate) return;
    const g = panneau.g; g.setTransform(DPR, 0, 0, DPR, 0, 0); g.lineCap = 'round';
    g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1);
    g.lineWidth = 7 * E; g.strokeStyle = 'rgba(30,24,20,.35)'; g.stroke();
    g.lineWidth = 4 * E; g.strokeStyle = 'rgba(110,231,183,.9)'; g.stroke();
    g.save(); g.globalCompositeOperation = 'destination-out'; g.lineWidth = 2.2 * E; g.stroke(); g.restore();
  }
  function effetsCoupe(r, ux, uy) {
    const pal = r.pal || PAL.fond;
    coupes.push({ x0: r.x - ux * r.L, y0: r.y - uy * r.L, x1: r.x + ux * r.L, y1: r.y + uy * r.L, vie: 0, duree: REDUIT ? 0.3 : 0.2 });
    const nc = MOBILE ? 7 : 11;
    for (let i = 0; i < nc; i++) {
      const cote = i % 2 ? 1 : -1, v = entre(160, 520) * E, a = Math.atan2(uy, ux) + cote * entre(0.5, 1.4);
      particules.push({ k: 'c', x: r.x, y: r.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 120 * E, rot: rnd() * TAU, vr: entre(-16, 16), vie: 0, duree: entre(1.1, 2), taille: entre(2.4, 5.5) * E, c: choix(pal), forme: rnd() });
    }
    for (let i = 0; i < 3; i++) { const a = rnd() * TAU, v = entre(120, 300) * E; particules.push({ k: 'f', x: r.x, y: r.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 140 * E, rot: rnd() * TAU, vr: entre(-9, 9), vie: 0, duree: entre(0.8, 1.3), taille: entre(5, 8) * E, c: choix(COUL) }); }
  }
  function fouetter(x0, y0, x1, y1, auto) {
    if (phase !== 'jeu') return;
    const dx = x1 - x0, dy = y1 - y0, d = Math.hypot(dx, dy); if (d < 1.5) return;
    const ux = dx / d, uy = dy / d; const touches = [];
    // plafonds par image : un geste très rapide ne doit jamais coûter plus d'une image ou deux
    const maxBlocs = auto ? 2 : 4, maxEclats = auto ? 0 : 3;
    for (const b of blocs) {
      if (touches.length >= maxBlocs) break;
      let V = null;
      if (b.etat === 'fixe') V = [{ x: b.x, y: b.y }, { x: b.x + b.w, y: b.y }, { x: b.x + b.w, y: b.y + b.h }, { x: b.x, y: b.y + b.h }];
      else if (b.etat === 'chute') V = b.corps.vertices;
      if (V && touchePoly(x0, y0, x1, y1, V)) { const r = trancher(b, x0, y0, ux, uy); if (r) touches.push(r); }
    }
    let nE = 0;
    for (const e of eclats.slice()) {
      if (!touchePoly(x0, y0, x1, y1, e.corps.vertices)) continue;
      const r = nE < maxEclats ? trancherEclat(e, x0, y0, ux, uy) : null;
      if (r) nE++;
      if (r) touches.push(r);
      else if (eclats.includes(e)) { const v = Phys.vitesse(e.corps); Phys.pousser(e.corps, v.x + ux * 6, v.y + uy * 6 - 2); Phys.tourner(e.corps, entre(-0.2, 0.2)); }
    }
    balafrer(x0, y0, x1, y1);
    if (!touches.length) return;
    prechargerNeuf();
    for (const r of touches) { effetsCoupe(r, ux, uy); impacts.push({ x: r.x, y: r.y }); }
    if (impacts.length > 12) impacts.splice(0, impacts.length - 12);
    secousse = Math.max(secousse, 4 + touches.length * 2.4); secDir = Math.atan2(uy, ux);
    gel = Math.max(gel, Math.min(0.06, 0.02 * touches.length) * (REDUIT ? 0.5 : 1));
    compter(touches.length);
    if (touches.length >= 2 && rnd() < 0.5) sticker(touches[0].x, touches[0].y - 40 * E, false, choix(['TCHAC !', 'ZIOUF !', 'SCHLAK !', 'FLAP !']));
    if (!dits.has('fouet-ok')) { dits.add('fouet-ok'); dire('Coup de liane ! Ça tranche net.'); }
  }
  function ajouterTraine(x, y) {
    traine.push({ x, y, t: T });
    if (traine.length > 40) traine.splice(0, traine.length - 40);
  }
  // Un coup de liane joué tout seul (clavier, « Tout casser ») : une courbe tracée en quelques images.
  function fouetAuto(x0, y0, x1, y1, delai) {
    const n = 9, mx = (x0 + x1) / 2 + (y1 - y0) * 0.12, my = (y0 + y1) / 2 - (x1 - x0) * 0.12;
    let px = x0, py = y0;
    for (let i = 1; i <= n; i++) {
      const t = i / n, u = 1 - t;
      const x = u * u * x0 + 2 * u * t * mx + t * t * x1, y = u * u * y0 + 2 * u * t * my + t * t * y1;
      const a = px, b = py; px = x; py = y;
      planifier(delai + i * 0.018, () => { if (i === 1) ajouterTraine(a, b); ajouterTraine(x, y); fouetter(a, b, x, y, true); kazu.cible = { x, y }; kazu.lance = 0.22; });
    }
  }
  function dessinerTraine(g) {
    const vie = REDUIT ? 0.42 : 0.3;
    while (traine.length && T - traine[0].t > vie) traine.shift();
    if (traine.length >= 2) {
      g.lineCap = 'round'; g.lineJoin = 'round'; g.globalCompositeOperation = 'lighter';
      for (const [k, coul, al] of [[3.2, '#6ee7b7', 0.22], [1.2, '#6ee7b7', 0.7], [0.4, '#ffffff', 1]]) {
        g.strokeStyle = coul;
        for (let i = 1; i < traine.length; i++) {
          const a = traine[i - 1], b = traine[i], q = 1 - (T - b.t) / vie, w = 7 * E * q * (0.35 + 0.65 * (i / traine.length));
          if (q <= 0) continue;
          g.globalAlpha = al * q; g.lineWidth = Math.max(0.6, w * k);
          g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke();
        }
      }
      g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    }
    for (let i = coupes.length - 1; i >= 0; i--) {
      const c = coupes[i], q = c.vie / c.duree;
      g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
      g.globalAlpha = (1 - q) * 0.5; g.strokeStyle = '#6ee7b7'; g.lineWidth = 9 * E * (1 - q * 0.5);
      g.beginPath(); g.moveTo(c.x0, c.y0); g.lineTo(c.x1, c.y1); g.stroke();
      g.globalAlpha = 1 - q; g.strokeStyle = '#ffffff'; g.lineWidth = 2.2 * E; g.stroke();
      g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    }
  }

  /* ------------------------------------------------------------------ la liane */
  let FOLIOLE = null, SPR_F = null, SPR_T = null;
  function sprites() {
    FOLIOLE = new Path2D('M50 46C39.5 37 34.5 23.5 50 7c15.5 16.5 10.5 30 0 39z');
    const fab = (trefle) => {
      const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
      const gr = g.createLinearGradient(0, 128, 0, 0); gr.addColorStop(0, '#047857'); gr.addColorStop(0.55, '#10b981'); gr.addColorStop(1, '#a7f3d0');
      g.fillStyle = gr; g.strokeStyle = 'rgba(4,38,26,.55)'; g.lineWidth = 2.2;
      if (trefle) { g.translate(64, 64); g.scale(1.25, 1.25); g.translate(-50, -50); for (let i = 0; i < 3; i++) { g.save(); g.translate(50, 50); g.rotate((i * TAU) / 3); g.translate(-50, -50); g.fill(FOLIOLE); g.stroke(FOLIOLE); g.restore(); } }
      else { g.translate(64, 124); g.scale(3, 3); g.translate(-50, -46); g.fill(FOLIOLE); g.stroke(FOLIOLE); g.strokeStyle = 'rgba(4,38,26,.35)'; g.beginPath(); g.moveTo(50, 44); g.lineTo(50, 14); g.stroke(); }
      return c;
    };
    SPR_F = fab(false); SPR_T = fab(true);
  }
  // Le centre et le rayon du sceau qui se forme pendant la transition (le même que celui du portail).
  const centreFleur = () => ({ x: W / 2, y: H * 0.46 });
  const rayonSceau = () => Math.min(W, H) * (W < 700 ? 0.27 : 0.21);
  const TEINTES = ['110,231,183', '167,243,208', '110,231,183', '196,181,253', '249,190,220'];
  // Les lianes de lumière : elles partent des fissures et du sol, et rejoignent l'anneau du sceau par le chemin le plus doux.
  function pousserLiane(d, delai, principale, prof, teinte) {
    const C = centreFleur(), RS = rayonSceau(); const pas = 7 * E;
    const pts = [{ x: d.x, y: d.y }]; let a = d.a, x = d.x, y = d.y;
    const th = Math.atan2(d.y - C.y, d.x - C.x) + entre(-0.45, 0.45);
    const cibleP = { x: C.x + Math.cos(th) * RS, y: C.y + Math.sin(th) * RS };
    const dist = Math.hypot(cibleP.x - x, cibleP.y - y);
    const N = principale ? Math.round((dist / pas) * 1.3 + 14) : Math.round(entre(9, 20));
    const feuilles = []; const ph = rnd() * 10; const enfants = [];
    teinte = teinte || choix(TEINTES);
    for (let i = 0; i < N; i++) {
      const k = i / N;
      if (principale) {
        const vise = Math.atan2(cibleP.y - y, cibleP.x - x); let da = vise - a; da = Math.atan2(Math.sin(da), Math.cos(da));
        const reste = Math.hypot(cibleP.x - x, cibleP.y - y);
        a += da * (0.05 + 0.3 * k * k + (reste < 60 * E ? 0.35 : 0)) + Math.sin(i * 0.16 + ph) * 0.05 * (1 - k);
        if (reste < pas * 1.2) { pts.push({ x: cibleP.x, y: cibleP.y }); break; }
      } else a += Math.sin(i * 0.35 + ph) * 0.14 + d.boucle;
      x += Math.cos(a) * pas; y += Math.sin(a) * pas; pts.push({ x, y });
      if (i % 14 === 8 && rnd() < 0.5) feuilles.push({ i: i + 1, cote: ((i / 11) | 0) % 2 ? 1 : -1, taille: entre(8, 12) * E * (principale ? 1 : 0.8), a, trefle: rnd() < 0.45 });
      if (principale && prof < 1 && i > 6 && k < 0.5 && rnd() < 0.008) enfants.push({ x, y, a: a + (rnd() < 0.5 ? 1 : -1) * entre(0.7, 1.2), i });
    }
    const L = { pts, feuilles, ep: d.ep, delai, duree: principale ? entre(1.4, 1.75) : 0.6, teinte };
    lianes.push(L);
    for (const en of enfants) pousserLiane({ x: en.x, y: en.y, a: en.a, ep: d.ep * 0.5, boucle: entre(-0.04, 0.04) }, delai + (en.i / pts.length) * L.duree, false, prof + 1, teinte);
  }
  function construireLianes() {
    if (!SPR_F) sprites();
    lianes = [];
    const departs = [];
    for (const p of impacts.slice(MOBILE ? -2 : -3)) departs.push({ x: p.x, y: p.y, a: Math.atan2(centreFleur().y - p.y, centreFleur().x - p.x) + entre(-0.9, 0.9), ep: 4.4 * E });
    const nb = Math.round(clamp(W / 320, 3, 8));
    for (let i = 0; i < nb; i++) departs.push({ x: (W * (i + 0.5)) / nb + entre(-30, 30), y: solY + 2, a: -Math.PI / 2 + entre(-0.35, 0.35), ep: 6 * E });
    departs.push({ x: -4, y: H * 0.74, a: -0.35, ep: 5.4 * E }, { x: W + 4, y: H * 0.66, a: Math.PI + 0.35, ep: 5.4 * E });
    for (const d of departs) pousserLiane(d, entre(0, 0.28), true, 0);
  }
  let LUEUR = null;
  function lueurSprite() {
    const c = document.createElement('canvas'); c.width = c.height = 96; const g = c.getContext('2d');
    const r = g.createRadialGradient(48, 48, 0, 48, 48, 48);
    r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.16, 'rgba(220,252,236,.9)'); r.addColorStop(0.42, 'rgba(110,231,183,.32)'); r.addColorStop(1, 'rgba(110,231,183,0)');
    g.fillStyle = r; g.fillRect(0, 0, 96, 96); return c;
  }
  // Les temps de la transition (en secondes, multipliés par 1,4 en mouvement réduit) :
  // la nuit tombe et la liane de lumière pousse ; le sol cède ; la liane trace l'anneau du sceau ; les trois folioles naissent ;
  // le sceau bat deux fois ; l'éclat ; puis l'anneau s'ouvre comme un portail sur le monde de Lila, qui gagne tout l'écran.
  const TL = { chute: 1.5, anneau: 1.6, anneauFin: 2.45, folioles: 2.3, bat1: 3.0, bat2: 3.3, eclat: 3.62, portail: 3.66, plein: 5.0, fin: 5.9 };
  function dessinerLianes(g, tl, alpha) {
    if (!LUEUR) LUEUR = lueurSprite();
    if (alpha <= 0.01) return;
    const pointes = [];
    // bouts plats entre les tronçons : en lumière additive, des bouts ronds se recouvriraient en perles
    g.lineCap = 'butt'; g.lineJoin = 'round';
    g.globalCompositeOperation = 'lighter';
    for (const L of lianes) {
      const f = clamp((tl - L.delai) / L.duree, 0, 1); if (f <= 0) continue;
      const ff = 1 - Math.pow(1 - f, 1.5);
      const P = L.pts, nMax = (P.length - 1) * ff, n = Math.floor(nMax); if (n < 1) continue;
      const fr = nMax - n, tip = n < P.length - 1 ? { x: P[n].x + (P[n + 1].x - P[n].x) * fr, y: P[n].y + (P[n + 1].y - P[n].y) * fr } : P[n];
      // trois passes : un halo large et coloré, le corps lumineux, un fil blanc ; la liane s'affine vers sa pointe
      for (const [larg, al, coul] of [[4.4, 0.1, `rgb(${L.teinte})`], [1.6, 0.42, `rgb(${L.teinte})`], [0.7, 0.75, `rgb(${L.teinte})`], [0.3, 1, '#f6fffb']]) {
        g.strokeStyle = coul; g.globalAlpha = alpha * al;
        for (let i = 0; i < n; i += 6) {
          const j = Math.min(n, i + 6), amin = 1 - (i / P.length) * 0.55;
          g.lineWidth = Math.max(0.8, L.ep * larg * amin);
          g.beginPath(); g.moveTo(P[i].x, P[i].y); for (let k = i + 1; k <= j; k++) g.lineTo(P[k].x, P[k].y); if (j === n) g.lineTo(tip.x, tip.y); g.stroke();
        }
      }
      if (f < 1) pointes.push(tip);
    }
    for (const p of pointes) { const r = 17 * E; g.globalAlpha = alpha * 0.9; g.drawImage(LUEUR, p.x - r, p.y - r, r * 2, r * 2); }
    g.globalCompositeOperation = 'source-over';
    // quelques feuilles de kudzu, de lumière elles aussi
    g.globalAlpha = alpha * 0.85;
    for (const L of lianes) {
      const f = clamp((tl - L.delai) / L.duree, 0, 1); if (f <= 0) continue;
      const nMax = (L.pts.length - 1) * (1 - Math.pow(1 - f, 1.5));
      for (const F of L.feuilles) {
        if (F.i > nMax) break;
        const q = clamp((nMax - F.i) / 6, 0, 1), sc = REDUIT ? q : easeBack(q); if (sc <= 0.01) continue;
        const p = L.pts[Math.min(F.i, L.pts.length - 1)], sz = F.taille * sc * (F.trefle ? 1.6 : 1.3);
        const ang = F.a + F.cote * 1.05 + Math.PI / 2, c = Math.cos(ang), s2 = Math.sin(ang);
        g.setTransform(DPR * c, DPR * s2, -DPR * s2, DPR * c, (p.x + ofs.x) * DPR, (p.y + ofs.y) * DPR);
        if (F.trefle) g.drawImage(SPR_T, -sz / 2, -sz * 0.9, sz, sz); else g.drawImage(SPR_F, -sz / 2, -sz, sz, sz);
      }
    }
    g.setTransform(DPR, 0, 0, DPR, ofs.x * DPR, ofs.y * DPR);
    g.globalAlpha = 1;
  }
  // Le sceau Kazura : la liane trace l'anneau, les trois folioles naissent, il bat deux fois.
  function dessinerSceau(g, tl) {
    const pa = clamp((tl - TL.anneau) / (TL.anneauFin - TL.anneau), 0, 1); if (pa <= 0) return;
    if (!LUEUR) LUEUR = lueurSprite();
    const C = centreFleur(), RS = rayonSceau();
    const bat = (u) => Math.exp(-Math.pow((tl - u) / 0.08, 2));
    const pouls = (bat(TL.bat1) + bat(TL.bat2)) * (REDUIT ? 0.025 : 0.06);
    const R = RS * (1 + pouls);
    const a0 = -Math.PI / 2, a1 = a0 + TAU * easeInOut(pa);
    g.globalCompositeOperation = 'lighter';
    // halo du sceau
    const hal = 0.1 + pa * 0.12 + pouls * 3;
    const hg = g.createRadialGradient(C.x, C.y, R * 0.2, C.x, C.y, R * 2.1);
    hg.addColorStop(0, `rgba(110,231,183,${hal * 0.9})`); hg.addColorStop(0.45, `rgba(139,92,246,${hal * 0.45})`); hg.addColorStop(1, 'rgba(139,92,246,0)');
    g.fillStyle = hg; g.fillRect(C.x - R * 2.2, C.y - R * 2.2, R * 4.4, R * 4.4);
    // l'anneau, en trois passes
    for (const [w, al, coul] of [[24, 0.12, '#6ee7b7'], [7, 0.55, '#6ee7b7'], [2.2, 1, '#ffffff']]) {
      g.globalAlpha = al; g.strokeStyle = coul; g.lineWidth = w * E * (1 + pouls * 3); g.lineCap = 'round';
      g.beginPath(); g.arc(C.x, C.y, R, a0, a1); g.stroke();
    }
    // la pointe qui trace
    if (pa < 1) { const r = 46 * E; g.globalAlpha = 1; g.drawImage(LUEUR, C.x + Math.cos(a1) * R - r, C.y + Math.sin(a1) * R - r, r * 2, r * 2); }
    // les folioles
    const pf = clamp((tl - TL.folioles) / 0.65, 0, 1);
    if (pf > 0) {
      const sc = (REDUIT ? easeOut(pf) : easeBack(pf)) * (R / 47);
      for (let i = 0; i < 3; i++) {
        g.save(); g.translate(C.x, C.y); g.rotate((i * TAU) / 3 + (1 - easeOut(pf)) * 0.9); g.scale(sc, sc); g.translate(-50, -50);
        const gr = g.createLinearGradient(50, 46, 50, 7);
        gr.addColorStop(0, `rgba(16,185,129,${0.5 + pouls * 4})`); gr.addColorStop(0.6, `rgba(110,231,183,${0.42 + pouls * 4})`); gr.addColorStop(1, 'rgba(236,253,245,.75)');
        g.globalAlpha = 0.85; g.fillStyle = gr; g.fill(FOLIOLE);
        g.globalAlpha = 1; g.lineWidth = 1.6 / Math.max(0.2, sc); g.strokeStyle = 'rgba(240,255,250,.9)'; g.stroke(FOLIOLE);
        g.restore();
      }
      const r = R * 0.34 * easeOut(pf) * (1 + pouls * 5); g.globalAlpha = pf; g.drawImage(LUEUR, C.x - r, C.y - r, r * 2, r * 2);
    }
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
  }
  function eclosion() {
    const C = centreFleur(), n = MOBILE ? 46 : 84, RS = rayonSceau();
    for (let i = 0; i < n; i++) {
      const a = rnd() * TAU, v = entre(120, 620) * E;
      pollen.push({ x: C.x + Math.cos(a) * RS, y: C.y + Math.sin(a) * RS, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vie: 0, duree: entre(0.9, 1.8), r: entre(1.4, 3.6) * E, c: choix(['#fff6d8', '#a7f3d0', '#ffd0bf', '#c9b8ff']) });
    }
    anneaux.push({ x: C.x, y: C.y, r: Math.hypot(W, H) * 0.55, vie: 0, duree: 0.9 });
    if (!REDUIT) flash = 0.22;
    annonce('Le sceau s\'ouvre : un nouveau site éclot.');
  }
  function dessinerTransition(tl) {
    // la nuit tombe sur les ruines, plus fort sur les bords
    const nuit = Math.min(1, easeInOut(clamp(tl / 1.7, 0, 1)) * 0.86 + easeInOut(clamp((tl - TL.chute) / 1.1, 0, 1)) * 0.14);
    const C = centreFleur(), R = Math.hypot(W, H) * 0.62;
    const v = ctx.createRadialGradient(C.x, C.y, R * 0.06, C.x, C.y, R);
    v.addColorStop(0, `rgba(4,6,16,${nuit * 0.7})`); v.addColorStop(1, `rgba(4,6,16,${nuit})`);
    ctx.fillStyle = v; ctx.fillRect(-40, -40, W + 80, H + 80);
    const eteint = clamp((tl - TL.eclat) / 0.7, 0, 1);
    dessinerLianes(ctx, tl, 1 - eteint);
    dessinerSceau(ctx, tl);
    if (pollen.length) {
      ctx.globalCompositeOperation = 'lighter';
      for (const p of pollen) { const q = p.vie / p.duree; ctx.globalAlpha = (1 - q) * (q < 0.1 ? q * 10 : 1); ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (1 - q * 0.4), 0, TAU); ctx.fill(); }
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    }
  }
  // Sans WebGL : la lumière du sceau grandit jusqu'à couvrir l'écran, couleur de la nuit bleue du site, puis le site se pose.
  function dessinerLumiere(tl) {
    if (LILA && LILA.gl) return;
    const p = clamp((tl - TL.portail) / (TL.plein - TL.portail), 0, 1); if (p <= 0) return;
    const C = centreFleur(), D = Math.hypot(Math.max(C.x, W - C.x), Math.max(C.y, H - C.y));
    const R = Math.max(1, rayonSceau() + easeInOut(p) * (D * 1.1 - rayonSceau()));
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    const g = ctx.createRadialGradient(C.x, C.y, 0, C.x, C.y, R);
    g.addColorStop(0, '#fff3e4'); g.addColorStop(0.25, '#f7b08d'); g.addColorStop(0.6, '#3a2350'); g.addColorStop(0.98, '#0b0a22'); g.addColorStop(1, 'rgba(11,10,34,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
  // Le portail : l'anneau s'ouvre sur le monde de Lila (WebGL), la perle naît au cœur du sceau puis gagne sa place.
  let portailLance = false;
  function piloterPortail(tl) {
    if (!LILA || !LILA.gl) return;
    const C = centreFleur(), RS = rayonSceau();
    const p = clamp((tl - TL.portail) / (TL.plein - TL.portail), 0, 1);
    const D = Math.hypot(Math.max(C.x, W - C.x), Math.max(C.y, H - C.y)) * 1.12;
    const e = REDUIT ? easeInOut(p) : (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
    const R = RS + (D - RS) * e;
    const lum = Math.pow(1 - clamp(p / 0.55, 0, 1), 2);
    const k = clamp((tl - TL.portail - 0.45) / 1.45, 0, 1);
    LILA.portail(p >= 1 ? -1 : R, C.x, C.y, lum, k);
    if (!portailLance) { portailLance = true; LILA.demarrer(); }
  }

  /* ------------------------------------------------------------------ les phases */
  function dire(texte, duree) {
    bulle.textContent = texte; bulle.hidden = false;
    bulle.style.animation = 'none'; void bulle.offsetWidth; bulle.style.animation = '';
    positionnerBulle();
    clearTimeout(dire.t); dire.t = setTimeout(() => { bulle.hidden = true; }, (duree || 3.4) * 1000);
  }
  function positionnerBulle() {
    bulle.style.left = Math.round(kazu.x + 16 * kazu.s) + 'px';
    bulle.style.bottom = Math.round(H - kazu.y + (66 + kazu.dy * -1) * kazu.s) + 'px';
  }
  // Le site de Lila n'est mis en page qu'au premier coup : ses polices ne gênent pas le chargement du jeu.
  function prechargerNeuf() {
    document.body.classList.add('neuf-pret');
    if (document.fonts && document.fonts.load) for (const f of ["400 40px Newsreader", "italic 400 40px Newsreader"]) document.fonts.load(f).catch(() => {});
  }
  function annonce(t) { annonceEl.textContent = t; }
  // Le site se pose : on retire l'état « avant » à l'image suivante, les transitions font le reste.
  function eclore() {
    neuf.classList.add('l-eclot');
    if (LILA) LILA.intro();
    else requestAnimationFrame(() => requestAnimationFrame(() => neuf.classList.remove('l-avant')));
  }
  function changerPhase(p) {
    phase = p; const b = document.body.classList;
    for (const k of [...b]) if (k.startsWith('phase-')) b.remove(k);
    b.add('phase-' + p); if (p !== 'intro' && p !== 'jeu') b.add('neuf-pret');
  }

  function commencer() {
    if (phase !== 'intro') return;
    const d = $('#dialogue'); d.classList.add('parti'); setTimeout(() => { d.hidden = true; }, 480);
    changerPhase('jeu');
    setTimeout(() => dire(MOBILE ? 'Touchez la page : je lance des graines !' : 'Cliquez sur la page : je lance des graines !'), 350);
    try { cv.focus({ preventScroll: true }); } catch (e) { /* rien */ }
  }
  function seisme() {
    if (phase !== 'jeu') return;
    prechargerNeuf(); secousse = 24; sticker(W / 2, H * 0.36, true, 'TREMBLEMENT DE SITE !');
    if (!REDUIT) flash = 0.2;
    const fixes = blocs.filter((b) => b.etat === 'fixe').sort((a, b) => b.y - a.y);
    fixes.forEach((b, i) => planifier(0.07 * i, () => {
      if (b.etat !== 'fixe') return;
      const x = b.x + b.w * entre(0.2, 0.8), y = b.y + b.h * entre(0.2, 0.8);
      if (rnd() < 0.5) { eclater(b, x, y, 1.1); effets(x, y, false); } else { fendre(b, x, y); lacher(b, x, b.y + b.h + 30, 1); }
      secousse = Math.max(secousse, 8);
    }));
    for (let i = 0; i < 4; i++) planifier(0.12 * i, () => trouer(entre(0.08, 0.92) * W, entre(0.2, 0.8) * H, 30 * E));
    // trois grands coups de liane en X, pendant que tout tremble
    const c = colonne || { x: 0, y: 0, w: W, h: H };
    fouetAuto(c.x - 30, c.y + c.h * 0.15, c.x + c.w + 30, c.y + c.h * 0.85, 0.05);
    fouetAuto(c.x + c.w + 30, c.y + c.h * 0.2, c.x - 30, c.y + c.h * 0.7, 0.45);
    planifier(0.07 * fixes.length + 1.1, declencherLiane);
  }
  function planifier(dt, f) { taches.push({ t: T + dt, f }); }

  function declencherLiane() {
    if (phase !== 'jeu') return;
    appui = null;
    changerPhase('liane'); tLiane = T;
    construireLianes();
    traine = [];
    if (LILA) setTimeout(() => { try { LILA.preparer(); } catch (e) { /* rien */ } }, 60);
    dire('Et maintenant… on laisse pousser.', 1.9);
    annonce('La liane Kazura pousse dans les fissures.');
  }
  function chuteFinale() {
    Phys.sansSol();
    for (const b of blocs) if (b.etat === 'fixe') lacher(b, W / 2, H * 0.46, 0.6);
    if (panneau && !panneau.eclate) {
      const morceaux = decouper([{ x: 0, y: 0 }, { x: W, y: 0 }, { x: W, y: H }, { x: 0, y: H }], MOBILE ? 7 : 11, W / 2, H * 0.46);
      for (const p of morceaux) creerEclat(panneau.cv, p, W / 2, H / 2, 0, W, H, W / 2, H * 0.46, 0.7, { x: 0, y: -1 }, true);
      panneau.eclate = true;
    }
    secousse = Math.max(secousse, 8); secDir = Math.PI / 2;
    kazu.saute = true; kazu.vy = -620 * kazu.s;
  }
  function finir() {
    changerPhase('neuf');
    neuf.removeAttribute('aria-hidden');
    actif = false; bulle.hidden = true;
    if (Phys) Phys.vider();
    blocs = []; eclats = []; eclatsFond = []; panneau = null; lianes = []; pollen = []; particules = [];
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height);
    annonce('Le nouveau site de Lila a éclos. Lila est un exemple imaginaire.');
    const h1 = $('#l-titre'); try { h1.focus({ preventScroll: true }); } catch (e) { /* rien */ }
    if (LILA) {
      LILA.demarrer(); LILA.portail(-1, W / 2, H / 2, 0, 1); LILA.ouvert();
    }
  }

  /* ------------------------------------------------------------------ la boucle */
  let acc = 0;
  const ofs = { x: 0, y: 0 };
  function avancer(dt) {
    T += dt;
    for (let i = taches.length - 1; i >= 0; i--) if (taches[i].t <= T) { const f = taches[i].f; taches.splice(i, 1); f(); }
    if (gel > 0) { gel -= dt; secousse = Math.max(0, secousse - dt * 6); return; }
    if (phase !== 'intro') {
      acc += dt; let n = 0;
      while (acc >= 1 / 60 && n < 4) { Phys.pas(); acc -= 1 / 60; n++; }
      if (n === 4) acc = 0;
    }
    if (appui && !appui.fouet && phase === 'jeu' && outil === 'graine' && T - dernierTir > 0.13) tir(appui.x, appui.y);
    for (let i = graines.length - 1; i >= 0; i--) {
      const s = graines[i]; s.t += dt / s.dur; const t = Math.min(1, s.t), u = 1 - t;
      s.px = s.x; s.py = s.y;
      s.x = u * u * s.x0 + 2 * u * t * s.cx + t * t * s.x1; s.y = u * u * s.y0 + 2 * u * t * s.cy + t * t * s.y1;
      if (s.t >= 1) { graines.splice(i, 1); if (phase === 'jeu') impact(s.x1, s.y1, s.gros); }
    }
    for (let i = particules.length - 1; i >= 0; i--) {
      const p = particules[i]; p.vie += dt;
      if (p.vie >= p.duree) { particules.splice(i, 1); continue; }
      if (p.k === 'c') {
        p.vy += 1700 * E * dt; p.vx *= 1 - dt * 0.5; p.rot += p.vr * dt; p.x += p.vx * dt; p.y += p.vy * dt;
        if (phase === 'jeu' && p.y > solY - 2 && p.vy > 0) { p.y = solY - 2; p.vy *= -0.34; p.vx *= 0.72; p.vr *= 0.5; if (p.vy > -50 * E) { p.vy = 0; p.vr = 0; } }
        continue;
      }
      if (p.k === 'e') { p.vy += 700 * E * dt; p.vx *= 1 - dt * 1.5; p.rot += p.vr * dt; } else if (p.k === 'f') { p.vy += 900 * E * dt; p.vx *= 1 - dt * 0.8; p.rot += p.vr * dt; } else { p.vx *= 1 - dt * 2; p.vy *= 1 - dt * 2; }
      p.x += p.vx * dt; p.y += p.vy * dt;
    }
    const CAP = MOBILE ? 220 : 420; if (particules.length > CAP) particules.splice(0, particules.length - CAP);
    for (let i = anneaux.length - 1; i >= 0; i--) { anneaux[i].vie += dt; if (anneaux[i].vie > anneaux[i].duree) anneaux.splice(i, 1); }
    for (let i = eclairs.length - 1; i >= 0; i--) { eclairs[i].vie += dt; if (eclairs[i].vie > eclairs[i].duree) eclairs.splice(i, 1); }
    for (let i = coupes.length - 1; i >= 0; i--) { coupes[i].vie += dt; if (coupes[i].vie > coupes[i].duree) coupes.splice(i, 1); }
    for (let i = stickers.length - 1; i >= 0; i--) { stickers[i].vie += dt; if (stickers[i].vie > stickers[i].duree) stickers.splice(i, 1); }
    secousse = Math.max(0, secousse - dt * (secousse * 7 + 2));
    flash = Math.max(0, flash - dt * 2.2);
    kazu.lance = Math.max(0, kazu.lance - dt);
    if (kazu.saute) { kazu.vy += 1500 * kazu.s * dt; kazu.dy += kazu.vy * dt; if (kazu.dy > 0 && phase === 'jeu') { kazu.dy = 0; kazu.saute = false; } }

    if (phase === 'jeu' && T >= prochainCalcul) {
      prochainCalcul = T + 0.2;
      let s = 0; for (const b of blocs) s += b.etat === 'eclate' ? 1 : b.etat === 'chute' ? 0.75 : b.fissures ? 0.12 : 0;
      ruine = clamp((s / blocs.length) * 0.92 + Math.min(0.12, (panneau ? panneau.trous : 0) * 0.025), 0, 1);
      const pc = Math.round(ruine * 100);
      ruineVal.textContent = pc + ' %'; ruineBarre.style.width = pc + '%';
      if (ruine >= 0.45 && btnPousser.hidden) { btnPousser.hidden = false; }
      if (ruine >= 0.25 && !dits.has('25')) { dits.add('25'); dire('Visez le compteur de visites !'); }
      if (ruine >= 0.5 && !dits.has('50')) { dits.add('50'); dire('Ça craque de partout. Encore un peu !'); }
      if (ruine >= 0.8 && lianeDemandee < 0) { lianeDemandee = T; dire('Parfait. Regardez bien les fissures…', 2); planifier(1.1, declencherLiane); }
    }
    if (phase === 'liane' || phase === 'eclosion') {
      const tl = (T - tLiane) / LENT;
      if (tl >= TL.chute && !chuteFinale.faite) { chuteFinale.faite = true; chuteFinale(); }
      if (tl >= TL.eclat && !boumFait) { boumFait = true; eclosion(); }
      if (tl >= TL.portail) piloterPortail(tl);
      if (tl >= TL.plein - 0.05 && !eclotFait) {
        eclotFait = true; neuf.scrollTop = 0; changerPhase('eclosion');
        eclore();
      }
      if (tl >= TL.fin) { finir(); return; }
      for (let i = pollen.length - 1; i >= 0; i--) {
        const p = pollen[i]; p.vie += dt; if (p.vie >= p.duree) { pollen.splice(i, 1); continue; }
        p.vx *= 1 - dt * 1.9; p.vy = p.vy * (1 - dt * 1.9) - 26 * E * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      }
      kazu.alpha = 1 - clamp((tl - TL.chute) / 0.7, 0, 1);
      for (let i = eclats.length - 1; i >= 0; i--) if (eclats[i].corps.position.y > H + 700) { Phys.retirer(eclats[i].corps); eclats.splice(i, 1); }
      for (let i = eclatsFond.length - 1; i >= 0; i--) if (eclatsFond[i].corps.position.y > H * 2 + 400) { Phys.retirer(eclatsFond[i].corps); eclatsFond.splice(i, 1); }
      for (const b of blocs) if (b.etat === 'chute' && b.corps.position.y > H + 900) { Phys.retirer(b.corps); b.etat = 'parti'; }
    }
  }

  const OMB = { x: 0, y: 0 };
  function dessinerEclat(e, ombre) {
    const p = e.corps.position, a = e.corps.angle + e.base, c = Math.cos(a), s = Math.sin(a);
    const ox = ombre ? OMB.x : 0, oy = ombre ? OMB.y : 0;
    ctx.setTransform(DPR * c, DPR * s, -DPR * s, DPR * c, (p.x + ofs.x + ox) * DPR, (p.y + ofs.y + oy) * DPR);
    ctx.drawImage(ombre ? e.ombre : e.img, e.dx, e.dy, e.iw, e.ih);
  }
  function dessinerKazu(g) {
    const k = kazu, s = k.s; if (k.alpha <= 0.01) return;
    const bob = Math.sin(T * 3.2) * (REDUIT ? 0.5 : 1.5) * s;
    const l = k.lance > 0 ? k.lance / 0.22 : 0;
    const cib = k.cible || { x: k.x + 100, y: k.y - 100 };
    const aim = Math.atan2(cib.y - (k.y - 30 * s), cib.x - k.x), dir = cib.x >= k.x ? 1 : -1;
    g.save(); g.globalAlpha = k.alpha; g.translate(k.x, k.y + k.dy);
    g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(0, -1, 17 * s, 4 * s, 0, 0, TAU); g.fill();
    g.fillStyle = '#05301f'; g.beginPath(); g.ellipse(-7 * s, -4 * s, 5.5 * s, 3.4 * s, 0, 0, TAU); g.ellipse(7 * s, -4 * s, 5.5 * s, 3.4 * s, 0, 0, TAU); g.fill();
    g.translate(0, -27 * s + bob);
    g.scale(1 + l * 0.08, 1 - l * 0.1);
    // feuilles sur la tête
    g.save(); g.translate(0, -19 * s); g.rotate(Math.sin(T * 2.1) * (REDUIT ? 0.05 : 0.14) - l * 0.2 * dir);
    for (let i = -1; i <= 1; i++) { g.save(); g.rotate(i * 0.75); g.scale(0.36 * s, 0.36 * s); g.translate(-50, -46); g.fillStyle = i ? '#10b981' : '#34d399'; g.fill(FOLIOLE || (FOLIOLE = new Path2D('M50 46C39.5 37 34.5 23.5 50 7c15.5 16.5 10.5 30 0 39z'))); g.strokeStyle = '#04261a'; g.lineWidth = 4; g.stroke(FOLIOLE); g.restore(); }
    g.restore();
    // bras qui lance
    g.strokeStyle = '#04261a'; g.lineWidth = 4.2 * s; g.lineCap = 'round';
    const ab = l > 0 ? aim : (dir > 0 ? 0.6 : Math.PI - 0.6);
    g.beginPath(); g.moveTo(12 * s * dir, 2 * s); g.lineTo(12 * s * dir + Math.cos(ab) * 12 * s, 2 * s + Math.sin(ab) * 12 * s); g.stroke();
    g.strokeStyle = '#10b981'; g.lineWidth = 2.4 * s; g.stroke();
    // corps
    const gr = g.createRadialGradient(-6 * s, -9 * s, 2 * s, 0, 0, 24 * s); gr.addColorStop(0, '#a7f3d0'); gr.addColorStop(0.45, '#34d399'); gr.addColorStop(1, '#047857');
    g.fillStyle = gr; g.strokeStyle = '#04261a'; g.lineWidth = 2.4 * s;
    g.beginPath(); g.ellipse(0, 0, 17 * s, 20 * s, 0, 0, TAU); g.fill(); g.stroke();
    // yeux
    const ox = Math.cos(aim) * 1.8 * s, oy = Math.sin(aim) * 1.8 * s;
    for (const ex of [-6.5, 6.5]) {
      g.fillStyle = '#fff'; g.beginPath(); g.ellipse(ex * s, -4 * s, 4.6 * s, 5.4 * s, 0, 0, TAU); g.fill(); g.lineWidth = 1.4 * s; g.stroke();
      g.fillStyle = '#0b0f14'; g.beginPath(); g.arc(ex * s + ox, -4 * s + oy, 2.3 * s, 0, TAU); g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(ex * s + ox - 0.8 * s, -5 * s + oy, 0.8 * s, 0, TAU); g.fill();
    }
    g.fillStyle = 'rgba(201,184,255,.75)'; g.beginPath(); g.ellipse(-11 * s, 4 * s, 3.4 * s, 2 * s, 0, 0, TAU); g.ellipse(11 * s, 4 * s, 3.4 * s, 2 * s, 0, 0, TAU); g.fill();
    g.strokeStyle = '#04261a'; g.lineWidth = 1.8 * s; g.beginPath();
    if (l > 0.2) { g.fillStyle = '#04261a'; g.ellipse(0, 7 * s, 2.6 * s, 3 * s, 0, 0, TAU); g.fill(); } else { g.arc(0, 5 * s, 4 * s, 0.2, Math.PI - 0.2); g.stroke(); }
    g.restore();
  }
  function dessiner() {
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height);
    // une fois la lumière pleine, il ne reste qu'elle : elle se retire sur le site de Lila
    if (phase === 'eclosion') { if (!(LILA && LILA.gl)) dessinerLumiere((T - tLiane) / LENT); return; }
    // secousse amortie, comme un ressort, dans la direction du dernier choc
    const a = secousse * (REDUIT ? 0.15 : 1);
    ofs.x = a ? Math.cos(secDir) * Math.sin(T * 48) * a + Math.sin(T * 31) * a * 0.22 : 0;
    ofs.y = a ? Math.sin(secDir) * Math.sin(T * 48) * a + Math.cos(T * 37) * a * 0.22 : 0;
    OMB.x = 5 * E; OMB.y = 9 * E;
    const base = () => ctx.setTransform(DPR, 0, 0, DPR, ofs.x * DPR, ofs.y * DPR);
    base();
    for (const e of eclatsFond) dessinerEclat(e);
    base();
    if (panneau && !panneau.eclate) ctx.drawImage(panneau.cv, 0, 0, W, H);
    for (const b of blocs) if (b.etat === 'fixe') { if (b.vivant) rafraichir(b); ctx.drawImage(b.cv, b.x, b.y, b.w, b.h); }
    ctx.globalAlpha = 0.24; ctx.fillStyle = '#0b0a14';
    for (const b of blocs) if (b.etat === 'chute') {
      const p = b.corps.position, an = b.corps.angle, c = Math.cos(an), s = Math.sin(an);
      ctx.setTransform(DPR * c, DPR * s, -DPR * s, DPR * c, (p.x + ofs.x + OMB.x) * DPR, (p.y + ofs.y + OMB.y) * DPR); ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
    }
    for (const e of eclats) if (e.ombre) dessinerEclat(e, true);
    ctx.globalAlpha = 1;
    for (const b of blocs) if (b.etat === 'chute') {
      if (b.vivant) rafraichir(b);
      const p = b.corps.position, an = b.corps.angle, c = Math.cos(an), s = Math.sin(an);
      ctx.setTransform(DPR * c, DPR * s, -DPR * s, DPR * c, (p.x + ofs.x) * DPR, (p.y + ofs.y) * DPR);
      ctx.drawImage(b.cv, -b.w / 2, -b.h / 2, b.w, b.h);
    }
    for (const e of eclats) dessinerEclat(e);
    base();
    // poussière et feuilles
    for (const p of particules) {
      const q = p.vie / p.duree;
      if (p.k === 'c') {
        ctx.globalAlpha = 1 - clamp((q - 0.72) / 0.28, 0, 1); ctx.fillStyle = p.c; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.beginPath();
        const t = p.taille; if (p.forme < 0.5) { ctx.moveTo(-t, -t * 0.6); ctx.lineTo(t, -t * 0.2); ctx.lineTo(-t * 0.2, t * 0.8); } else { ctx.moveTo(-t, -t * 0.4); ctx.lineTo(t * 0.6, -t * 0.7); ctx.lineTo(t, t * 0.4); ctx.lineTo(-t * 0.5, t * 0.6); }
        ctx.closePath(); ctx.fill(); ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(5,7,11,.6)'; ctx.stroke(); ctx.restore();
      }
      else if (p.k === 'p') { ctx.globalAlpha = 0.38 * (1 - q); ctx.fillStyle = '#b8b2a7'; ctx.beginPath(); ctx.arc(p.x, p.y, p.taille * (0.6 + q * 0.9), 0, TAU); ctx.fill(); }
      else if (p.k === 'e') {
        const sc = REDUIT ? 1 : easeBack(clamp(p.vie / 0.2, 0, 1)); ctx.globalAlpha = 1 - clamp((q - 0.6) / 0.4, 0, 1);
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.scale(sc, sc); etoile4(ctx, p.taille); ctx.restore();
      }
      else { ctx.globalAlpha = 1 - q * q; ctx.fillStyle = p.c; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.beginPath(); ctx.ellipse(0, 0, p.taille, p.taille * 0.45, 0, 0, TAU); ctx.fill(); ctx.restore(); }
    }
    ctx.globalAlpha = 1;
    for (const r of anneaux) {
      const q = r.vie / r.duree; ctx.globalAlpha = (1 - q) * 0.9; ctx.strokeStyle = '#6ee7b7'; ctx.lineWidth = 4 * (1 - q) + 1;
      ctx.beginPath(); ctx.arc(r.x, r.y, r.r * easeOut(q), 0, TAU); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    // l'éclair du choc : des rayons nets, façon planche de manga
    for (const z of eclairs) {
      const q = z.vie / z.duree, r = z.r * (0.78 + easeOut(q) * 0.42), r0 = r * 0.15;
      ctx.save(); ctx.translate(z.x, z.y); ctx.rotate(z.rot); ctx.globalAlpha = (1 - q) * (REDUIT ? 0.55 : 1);
      ctx.beginPath();
      for (let i = 0; i < z.n; i++) { const a0 = (i / z.n) * TAU, l = r * (i % 2 ? 0.58 : 1), w = z.gros ? 0.085 : 0.11; ctx.moveTo(Math.cos(a0 - w) * r0, Math.sin(a0 - w) * r0); ctx.lineTo(Math.cos(a0) * l, Math.sin(a0) * l); ctx.lineTo(Math.cos(a0 + w) * r0, Math.sin(a0 + w) * r0); ctx.closePath(); }
      ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 1.3; ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(5,7,11,.7)'; ctx.stroke();
      ctx.fillStyle = '#ecfdf5'; ctx.beginPath(); ctx.arc(0, 0, r0 * 1.25 * (1 - q * 0.5), 0, TAU); ctx.fill(); ctx.strokeStyle = '#10b981'; ctx.lineWidth = 2; ctx.stroke();
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    if (phase === 'liane' || phase === 'eclosion') { dessinerTransition((T - tLiane) / LENT); base(); }
    // graines
    for (const s of graines) {
      const an = Math.atan2(s.y - s.py, s.x - s.px);
      ctx.globalAlpha = 0.35; ctx.fillStyle = '#e9c987'; ctx.beginPath(); ctx.arc(s.px, s.py, 2.6 * E, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
      ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(an);
      const r = (s.gros ? 9 : 5) * E;
      ctx.fillStyle = s.gros ? '#34d399' : '#e9c987'; ctx.strokeStyle = '#2a1a05'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.68, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore();
    }
    dessinerTraine(ctx);
    dessinerKazu(ctx);
    // viseur (souris)
    if (souris && phase === 'jeu' && !MOBILE) {
      ctx.strokeStyle = 'rgba(5,7,11,.85)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(souris.x, souris.y, 11, 0, TAU); ctx.stroke();
      ctx.strokeStyle = '#6ee7b7'; ctx.lineWidth = 2; ctx.stroke();
    }
    // autocollants
    for (const st of stickers) {
      const q = st.vie / st.duree, pop = REDUIT ? 1 : easeBack(clamp(st.vie / 0.18, 0, 1));
      ctx.globalAlpha = 1 - clamp((q - 0.6) / 0.4, 0, 1);
      ctx.font = `800 ${st.taille}px ${F_KAZ}`;
      const tw = ctx.measureText(st.mot).width;
      const x = clamp(st.x, tw / 2 + 10, W - tw / 2 - 10), y = clamp(st.y - (REDUIT ? 0 : q * 18 * E), st.taille, H - st.taille);
      ctx.save(); ctx.translate(x, y); ctx.rotate(st.rot); ctx.scale(pop, pop);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
      if (st.gros) {
        const R = Math.max(tw * 0.56, st.taille * 1.05); ctx.beginPath();
        for (let i = 0; i < 28; i++) { const a = (i / 28) * TAU, rr = (i % 2 ? 0.66 : 1) * R * (i % 4 === 0 ? 1.12 : 1); ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr * 0.62); }
        ctx.closePath(); ctx.fillStyle = trame(ctx); ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#05070b'; ctx.stroke();
      }
      ctx.lineWidth = st.taille * 0.2; ctx.strokeStyle = '#05070b'; ctx.strokeText(st.mot, 0, 0);
      ctx.fillStyle = st.c; ctx.fillText(st.mot, 0, 0); ctx.restore();
    }
    ctx.globalAlpha = 1;
    if (flash > 0) { ctx.fillStyle = `rgba(236,253,245,${flash})`; ctx.fillRect(-20, -20, W + 40, H + 40); }
    if (phase === 'liane' || phase === 'eclosion') dessinerLumiere((T - tLiane) / LENT);
  }
  let dernier = 0;
  function boucle(now) {
    if (!actif) return;
    const dt = Math.min(0.05, dernier ? (now - dernier) / 1000 : 1 / 60); dernier = now;
    avancer(dt); dessiner();
    requestAnimationFrame(boucle);
  }

  /* ------------------------------------------------------------------ entrées */
  function point(e) { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
  cv.addEventListener('pointerdown', (e) => {
    if (phase !== 'jeu') return;
    e.preventDefault();
    try { cv.setPointerCapture(e.pointerId); } catch (er) { /* rien */ }
    const p = point(e); doigt = e.pointerType === 'touch';
    appui = { x: p.x, y: p.y, id: e.pointerId, x0: p.x, y0: p.y, px: p.x, py: p.y, t0: performance.now(), fouet: false };
    traine = [{ x: p.x, y: p.y, t: T }];
    tir(p.x, p.y);
  });
  cv.addEventListener('pointermove', (e) => {
    const p = point(e);
    if (e.pointerType === 'mouse') { souris = p; if (phase === 'jeu') kazu.cible = p; }
    if (appui && e.pointerId === appui.id) {
      appui.x = p.x; appui.y = p.y;
      if (phase !== 'jeu') return;
      // un geste rapide qui s'éloigne du point de départ devient un coup de liane
      const loin = Math.hypot(p.x - appui.x0, p.y - appui.y0), duree = Math.max(16, performance.now() - appui.t0);
      if (!appui.fouet && loin > 24 * clamp(E, 0.8, 1.4) && loin / duree > 0.28) appui.fouet = true;
      ajouterTraine(p.x, p.y);
      if (appui.fouet) {
        fouetter(appui.px, appui.py, p.x, p.y);
        kazu.cible = p; kazu.lance = 0.22;
      }
      appui.px = p.x; appui.py = p.y;
    }
  });
  const lever = (e) => { if (appui && e.pointerId === appui.id) appui = null; };
  cv.addEventListener('pointerup', lever); cv.addEventListener('pointercancel', lever);
  cv.addEventListener('pointerleave', () => { souris = null; });
  cv.addEventListener('contextmenu', (e) => e.preventDefault());
  cv.addEventListener('keydown', (e) => {
    if (phase === 'jeu' && (e.key === 'f' || e.key === 'F')) {
      e.preventDefault(); if (T - dernierFouet < 0.4) return; dernierFouet = T;
      const c = colonne, h = rnd() < 0.5;
      if (h) fouetAuto(c.x - 20, c.y + c.h * entre(0.15, 0.85), c.x + c.w + 20, c.y + c.h * entre(0.15, 0.85), 0);
      else fouetAuto(c.x + c.w * entre(0.1, 0.9), c.y - 20, c.x + c.w * entre(0.1, 0.9), c.y + c.h + 20, 0);
      return;
    }
    if (phase !== 'jeu' || (e.key !== 'Enter' && e.key !== ' ')) return;
    e.preventDefault();
    const restants = blocs.filter((b) => b.etat === 'fixe' || b.etat === 'chute');
    if (restants.length) { const b = choix(restants); const p = b.etat === 'fixe' ? { x: b.x + b.w / 2, y: b.y + b.h / 2 } : b.corps.position; tir(p.x, p.y); }
    else tir(entre(0.2, 0.8) * W, entre(0.25, 0.7) * H);
  });
  document.querySelectorAll('.outil[data-outil]').forEach((b) => b.addEventListener('click', () => {
    outil = b.dataset.outil;
    document.querySelectorAll('.outil[data-outil]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    if (outil === 'bourgeon' && !dits.has('gros')) { dits.add('gros'); dire('Le gros bourgeon ! Touchez où ça doit faire BOUM.'); }
  }));
  $('#seisme').addEventListener('click', seisme);
  btnPousser.addEventListener('click', declencherLiane);

  // la fenêtre d'accueil
  let refus = 0;
  $('#dlgOui').addEventListener('click', commencer);
  $('#dlgX').addEventListener('click', commencer);
  $('#dlgNon').addEventListener('click', () => {
    refus++;
    if (refus === 1) {
      $('#dlgTexte').textContent = 'Vraiment ? Il a un compteur de visites, un texte qui défile, et un bandeau « en construction » depuis 2007.';
      $('#dlgQuestion').textContent = 'On le casse quand même ?';
      $('#dlgNon').textContent = 'Bon… d\'accord';
    } else commencer();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && phase === 'intro') commencer(); });

  // redimensionnement
  let largeurPrec = 0, rtimer = 0;
  addEventListener('resize', () => {
    clearTimeout(rtimer);
    rtimer = setTimeout(() => {
      if (phase === 'neuf') return;
      const r = cv.getBoundingClientRect();
      if (phase === 'intro' || Math.abs(r.width - largeurPrec) > 40) { if (phase === 'jeu' || phase === 'intro') { mettreEnPage(); largeurPrec = W; } return; }
      if (phase === 'jeu') {
        H = Math.round(r.height); cv.height = Math.round(H * DPR);
        solY = H - (outils.getBoundingClientRect().height || 80); Phys.sol(solY, 0, W); kazu.y = solY;
      }
    }, 180);
  });

  $('#recasser').addEventListener('click', () => { location.reload(); });

  /* ------------------------------------------------------------------ départ */
  function demarrer() {
    mettreEnPage(); largeurPrec = W;
    if (!SPR_F) sprites();
    if (DIRECT || SITE) { $('#dialogue').hidden = true; changerPhase('jeu'); }
    if (SITE) { prechargerNeuf(); eclore(); finir(); return; }
    else { try { $('#dlgOui').focus({ preventScroll: true }); } catch (e) { /* rien */ } }
    if (MANUEL) dessiner(); else requestAnimationFrame(boucle);
  }
  const polices = document.fonts && document.fonts.load ? document.fonts.load(`800 40px ${F_KAZ}`).catch(() => {}) : Promise.resolve();
  Promise.race([polices, new Promise((r) => setTimeout(r, 900))]).then(demarrer);

  // pour les essais automatiques (captures, affiche, vidéo)
  window.__casser = {
    lancer: (x, y, gros) => lancer(x, y, !!gros),
    impact: (x, y, gros) => impact(x, y, !!gros),
    seisme, liane: declencherLiane, commencer, fouet: (x0, y0, x1, y1) => fouetAuto(x0, y0, x1, y1, 0),
    avancer(dt, n) { for (let i = 0; i < (n || 1); i++) avancer(dt); dessiner(); },
    etat: () => ({ lila: !!LILA, phase, ruine, W, H, solY, blocs: blocs.length, eclats: eclats.length, matter: !!(Phys && Phys.vrai), colonne,
      cibles: blocs.filter((b) => b.etat === 'fixe').map((b) => ({ type: b.type, x: Math.round(b.x + b.w / 2), y: Math.round(b.y + b.h / 2) })) }),
  };
})();
