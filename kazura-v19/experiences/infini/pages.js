// Le site infini : les sites imaginaires de chaque niveau, dessinés en canvas 2D (vectoriel).
// Chaque page se dessine dans l'espace de l'écran (W x H en pixels CSS), à n'importe quelle échelle :
// le moteur WebGL en fait une texture (page posée devant la caméra), le repli sans WebGL la redessine à chaque image.
// L'image d'ouverture de chaque site est un TROU (transparent) : derrière, le monde du niveau.
//
// API : NIVEAUX (les métiers, dans l'ordre de la boucle), trou(id, W, H), cheminTrou(ctx, t),
//       dessinerPage(ctx, id, W, H, { sansTrou }) dessine la page (le trou reste transparent sauf sansTrou).

export const NIVEAUX = [
  { id: 'kazura', metier: 'Kazura', site: 'Kazura', porte: 'un écran', rond: false, fond: '#07060f', monde: '#1a1036' },
  { id: 'boulangerie', metier: 'Boulangerie', site: 'Fournil des Aurores', porte: 'la vitrine', rond: false, fond: '#f6efe4', monde: '#e9a37a' },
  { id: 'tatouage', metier: 'Atelier de tatouage', site: 'Encre Néon', porte: 'la pupille', rond: true, fond: '#0b0a10', monde: '#2a0f3a' },
  { id: 'avocat', metier: 'Cabinet d’avocate', site: 'Maître Inès Varenne', porte: 'l’écran du téléphone', rond: false, fond: '#f3f0ea', monde: '#2b3a4a' },
  { id: 'fleuriste', metier: 'Fleuriste', site: 'Pétale Sauvage', porte: 'la goutte de rosée', rond: true, fond: '#fbeff0', monde: '#9cc48a' },
  { id: 'escalade', metier: 'Salle d’escalade', site: 'Bloc Altitude', porte: 'la vitre', rond: false, fond: '#ffd23f', monde: '#e8a35a' },
  { id: 'garage', metier: 'Garage', site: 'Garage des Platanes', porte: 'le phare', rond: true, fond: '#efe6d2', monde: '#3a2a1e' },
  { id: 'musique', metier: 'École de musique', site: 'La Clé des Champs', porte: 'la tablette du pupitre', rond: false, fond: '#0f1b3d', monde: '#1d2a55' },
  { id: 'vigneron', metier: 'Vigneron', site: 'Clos des Brumes', porte: 'le verre de vin', rond: true, fond: '#f4ede1', monde: '#c98a5a' },
];

// ---------------------------------------------------------------------------------------------------------------
// Outils de dessin
const FAM = { b: '"Bricolage Grotesque", "Segoe UI", system-ui, sans-serif', s: 'Newsreader, Georgia, "Times New Roman", serif', m: '"JetBrains Mono", Consolas, monospace' };
function police(ctx, st) {
  const { f = 'b', t = 16, g = 400, i = false, e = 'normal', ls = 0 } = st;
  ctx.font = `${i ? 'italic ' : ''}${g} ${t}px ${FAM[f]}`;
  try { ctx.fontStretch = e; } catch {}
  try { ctx.letterSpacing = `${ls}px`; } catch {}
}
function T(ctx, s, x, y, st, c, al = 'left') {
  police(ctx, st); ctx.fillStyle = c; ctx.textAlign = al; ctx.textBaseline = 'alphabetic'; ctx.fillText(s, x, y);
  return ctx.measureText(s).width;
}
function mesure(ctx, s, st) { police(ctx, st); return ctx.measureText(s).width; }
function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
/** Paragraphe : coupe aux mots, renvoie le y sous le bloc. */
function P(ctx, s, x, y, w, lh, st, c, max = 99, al = 'left') {
  police(ctx, st); ctx.fillStyle = c; ctx.textAlign = al; ctx.textBaseline = 'alphabetic';
  const mots = s.split(' '); let l = '', n = 0;
  for (const m of mots) {
    const essai = l ? l + ' ' + m : m;
    if (ctx.measureText(essai).width > w && l) { ctx.fillText(l, x, y); y += lh; l = m; if (++n >= max) return y; } else l = essai;
  }
  if (l) { ctx.fillText(l, x, y); y += lh; }
  return y;
}
/** Titre riche : segments [texte, style, couleur], coupés aux mots, alignés à gauche ou au centre. Renvoie le y sous le titre. */
function titre(ctx, segs, x, y, w, lh, al = 'left') {
  const mots = [];
  for (const [s, st, c] of segs) s.split(' ').forEach((m, k, a) => { if (m) mots.push({ m, st, c, esp: k < a.length - 1 || /\s$/.test(s) }); });
  const lignes = []; let cur = [], lw = 0;
  for (const o of mots) {
    const mw = mesure(ctx, o.m, o.st), ew = mesure(ctx, ' ', o.st);
    if (cur.length && lw + mw > w) { lignes.push([cur, lw]); cur = []; lw = 0; }
    cur.push({ ...o, mw, ew }); lw += mw + (o.esp ? ew : 0);
  }
  if (cur.length) lignes.push([cur, lw]);
  for (const [l, lwid] of lignes) {
    let xx = al === 'center' ? x - (lwid - (l.at(-1).esp ? l.at(-1).ew : 0)) / 2 : x;
    for (const o of l) { T(ctx, o.m, xx, y, o.st, o.c); xx += o.mw + (o.esp ? o.ew : 0); }
    y += lh;
  }
  return y;
}
function bouton(ctx, s, x, y, h, { fond, encre, bord, st, r = h / 2, pad = h * 0.6, fleche = false, al = 'left' }) {
  const w = mesure(ctx, s, st) + pad * 2 + (fleche ? h * 0.55 : 0);
  if (al === 'right') x -= w; else if (al === 'center') x -= w / 2;
  rr(ctx, x, y, w, h, r);
  if (fond) { ctx.fillStyle = fond; ctx.fill(); }
  if (bord) { ctx.strokeStyle = bord; ctx.lineWidth = Math.max(1, h / 30); ctx.stroke(); }
  T(ctx, s, x + pad, y + h * 0.5 + st.t * 0.35, st, encre);
  if (fleche) {
    const fx = x + w - pad - h * 0.32, fy = y + h / 2, k = h * 0.14;
    ctx.strokeStyle = encre; ctx.lineWidth = Math.max(1.2, h / 22); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(fx - k * 1.6, fy); ctx.lineTo(fx + k, fy); ctx.moveTo(fx, fy - k); ctx.lineTo(fx + k, fy); ctx.lineTo(fx, fy + k); ctx.stroke();
  }
  return w;
}
function burger(ctx, x, y, s, c) {
  ctx.strokeStyle = c; ctx.lineWidth = Math.max(1.5, s / 11); ctx.lineCap = 'round'; ctx.beginPath();
  for (let k = 0; k < 3; k++) { ctx.moveTo(x, y + k * s * 0.32); ctx.lineTo(x + s, y + k * s * 0.32); }
  ctx.stroke();
}
/** Hasard reproductible. */
function hasard(graine) { let s = graine >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
/** Une « photo » floue : dégradé et taches de lumière (procédural, sans image). */
function photo(ctx, x, y, w, h, r, [haut, bas, ...taches], graine = 1) {
  ctx.save(); rr(ctx, x, y, w, h, r); ctx.clip();
  const g = ctx.createLinearGradient(x, y, x, y + h); g.addColorStop(0, haut); g.addColorStop(1, bas);
  ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  const H = hasard(graine);
  for (let k = 0; k < 7; k++) {
    const c = taches[k % taches.length], cx = x + H() * w, cy = y + (0.35 + H() * 0.65) * h, rad = (0.2 + H() * 0.45) * Math.max(w, h);
    const rg = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad); rg.addColorStop(0, c); rg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = 0.55 + H() * 0.4; ctx.fillStyle = rg; ctx.fillRect(x, y, w, h);
  }
  ctx.restore(); ctx.globalAlpha = 1;
}
function etoile(ctx, cx, cy, r, c) {
  ctx.fillStyle = c; ctx.beginPath();
  for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4, rr2 = k % 2 ? r * 0.28 : r; ctx.lineTo(cx + Math.cos(a) * rr2, cy + Math.sin(a) * rr2); }
  ctx.closePath(); ctx.fill();
}

// ---------------------------------------------------------------------------------------------------------------
// Le trou de chaque site (l'image d'ouverture), en pixels CSS de l'écran
export function trou(id, W, H) {
  const por = W / H < 0.8, ultra = W / H > 2.1;
  const u = por ? W / 100 : H / 100;
  const C = conteneur(W, H);
  switch (id) {
    case 'boulangerie': return por
      ? { forme: 'arche', x: 5 * u, y: 17 * u, w: 90 * u, h: H * 0.5 - 17 * u, r: 45 * u }
      : { forme: 'arche', x: C.x + C.w * 0.5, y: 13 * u, w: C.w * 0.46, h: 81 * u, r: C.w * 0.23 };
    case 'tatouage': return por
      ? { forme: 'rect', x: 0, y: 15 * u, w: W, h: H * 0.6 - 15 * u, r: 0 }
      : { forme: 'rect', x: C.x + C.w * 0.36, y: 10 * u, w: W - (C.x + C.w * 0.36) - (ultra ? C.x : 3 * u), h: 80 * u, r: 1.2 * u };
    case 'avocat': return por
      ? { forme: 'rect', x: 6 * u, y: 20 * u, w: 88 * u, h: H * 0.44 - 20 * u, r: 0 }
      : { forme: 'rect', x: C.x + C.w * 0.52, y: 14 * u, w: C.w * 0.43, h: 74 * u, r: 0 };
    case 'fleuriste': return por
      ? { forme: 'rond', x: 7 * u, y: 19 * u, w: 86 * u, h: 86 * u, r: 43 * u }
      : { forme: 'rond', x: C.x + C.w * 0.52, y: 12 * u, w: 76 * u, h: 76 * u, r: 38 * u };
    case 'escalade': return por
      ? { forme: 'biais', x: 0, y: 14 * u, w: W, h: H * 0.56 - 14 * u, r: 0, biais: 14 * u }
      : { forme: 'biais', x: C.x + C.w * 0.42, y: 0, w: W - (C.x + C.w * 0.42) - (ultra ? C.x * 0.6 : 0), h: H * 0.86, r: 0, biais: 16 * u };
    case 'garage': return por
      ? { forme: 'rect', x: 5 * u, y: 21 * u, w: 90 * u, h: H * 0.5 - 21 * u, r: 5 * u }
      : { forme: 'rect', x: C.x + C.w * 0.47, y: 15 * u, w: C.w * 0.5, h: 70 * u, r: 2.4 * u };
    case 'musique': return por
      ? { forme: 'ellipse', x: 9 * u, y: 20 * u, w: 82 * u, h: H * 0.5 - 20 * u, r: 0 }
      : { forme: 'ellipse', x: C.x + C.w * 0.54, y: 11 * u, w: C.w * 0.38, h: 80 * u, r: 0 };
    case 'vigneron': return por
      ? { forme: 'rect', x: 0, y: 0, w: W, h: H * 0.56, r: 0 }
      : { forme: 'arche', x: C.x + C.w * 0.08, y: 12 * u, w: C.w * 0.84, h: 56 * u, r: 6 * u, plate: true };
  }
  return null;
}
/** Le conteneur centré des mises en page larges (au plus 1,9 fois la hauteur). */
function conteneur(W, H) { const w = Math.min(W, H * 1.9); return { x: (W - w) / 2, w }; }

export function cheminTrou(ctx, t) {
  ctx.beginPath();
  const { x, y, w, h, r } = t;
  if (t.forme === 'rond') { ctx.arc(x + w / 2, y + h / 2, w / 2, 0, Math.PI * 2); }
  else if (t.forme === 'ellipse') { ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2); }
  else if (t.forme === 'arche') {
    if (t.plate) { ctx.roundRect(x, y, w, h, [r * 5, r * 5, r, r]); }
    else { const rad = Math.min(r, w / 2); ctx.moveTo(x, y + h); ctx.lineTo(x, y + rad); ctx.arc(x + w / 2, y + rad, w / 2, Math.PI, 0); ctx.lineTo(x + w, y + h); ctx.closePath(); }
  } else if (t.forme === 'biais') { ctx.moveTo(x + t.biais, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w - t.biais * 0.0, y + h - t.biais); ctx.lineTo(x + w - t.biais, y + h); ctx.lineTo(x, y + h); ctx.lineTo(x, y + t.biais); ctx.closePath(); }
  else ctx.roundRect(x, y, w, h, r || 0);
}

/** Perce le trou, puis une ombre douce à l'intérieur du bord (l'image paraît posée dans la page). */
function percer(ctx, t, ombre = 0.32) {
  ctx.save(); ctx.globalCompositeOperation = 'destination-out'; cheminTrou(ctx, t); ctx.fill(); ctx.restore();
  if (ombre > 0) {
    ctx.save(); cheminTrou(ctx, t); ctx.clip();
    const e = Math.min(t.w, t.h) * 0.12;
    ctx.shadowColor = `rgba(0,0,0,${ombre})`; ctx.shadowBlur = e; ctx.lineWidth = e; ctx.strokeStyle = 'rgba(0,0,0,0.0001)';
    cheminTrou(ctx, t); ctx.stroke();
    ctx.restore();
  }
}

// ---------------------------------------------------------------------------------------------------------------
export function dessinerPage(ctx, id, W, H, opts = {}) {
  const t = trou(id, W, H);
  const f = DESSINS[id];
  if (!f) return t;
  ctx.save();
  f(ctx, W, H, t, opts);
  ctx.restore();
  return t;
}

const DESSINS = {
  // 1. Boulangerie : crème, terracotta, Newsreader italique
  boulangerie(ctx, W, H, t, o) {
    const por = W / H < 0.8, u = por ? W / 100 : H / 100, C = conteneur(W, H);
    const fond = '#f6efe4', encre = '#2b1d14', terre = '#b8572f', or = '#b98a3e', doux = '#5b4636';
    ctx.fillStyle = fond; ctx.fillRect(0, 0, W, H);
    // grain du papier
    const H2 = hasard(7); ctx.fillStyle = 'rgba(120,80,40,0.05)';
    for (let k = 0; k < 260; k++) ctx.fillRect(H2() * W, H2() * H, 1.2, 1.2);
    const epi = (x, y, s, c) => {
      ctx.strokeStyle = c; ctx.lineWidth = s * 0.08; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x, y + s); ctx.lineTo(x, y - s * 0.1); ctx.stroke(); ctx.fillStyle = c;
      for (let k = 0; k < 4; k++) for (const sg of [-1, 1]) { ctx.beginPath(); ctx.ellipse(x + sg * s * 0.17, y + s * (0.55 - k * 0.2), s * 0.09, s * 0.2, sg * 0.5, 0, Math.PI * 2); ctx.fill(); }
      ctx.beginPath(); ctx.ellipse(x, y - s * 0.22, s * 0.08, s * 0.2, 0, 0, Math.PI * 2); ctx.fill();
    };
    if (por) {
      epi(7 * u, 8.6 * u, 3.4 * u, terre);
      T(ctx, 'Fournil', 12 * u, 8 * u, { f: 's', t: 5.4 * u, g: 500 }, encre);
      T(ctx, 'DES AURORES', 12.2 * u, 11.6 * u, { f: 'b', t: 2.5 * u, g: 600, ls: 0.5 * u }, terre);
      bouton(ctx, 'Commander', 95 * u, 4.6 * u, 8.6 * u, { fond: encre, encre: fond, st: { f: 'b', t: 3.6 * u, g: 600 }, al: 'right' });
      percer(ctx, t, 0.25);
      let y = t.y + t.h + 11 * u;
      T(ctx, 'Boulangerie au levain · Lyon 4e', 5 * u, y - 4 * u, { f: 'm', t: 2.9 * u, g: 500 }, terre);
      y = titre(ctx, [['Le pain se lève ', { f: 's', t: 10.5 * u, g: 400 }, encre], ['avant vous.', { f: 's', t: 10.5 * u, g: 400, i: true }, terre]], 5 * u, y + 6 * u, 90 * u, 10.6 * u);
      y = P(ctx, 'Levain naturel, farines du Lyonnais, cuisson au feu de bois. Le premier pain sort du four à 5 h 40.', 5 * u, y + 1 * u, 88 * u, 6 * u, { f: 'b', t: 3.9 * u }, doux);
      const bw = bouton(ctx, 'Réserver pour demain', 5 * u, y + 2 * u, 12 * u, { fond: terre, encre: '#fff8ef', st: { f: 'b', t: 3.9 * u, g: 600 }, fleche: true });
      bouton(ctx, 'Horaires', 8 * u + bw, y + 2 * u, 12 * u, { bord: encre, encre, st: { f: 'b', t: 3.9 * u, g: 500 } });
      y += 22 * u;
      const cartes = [['Campagne', '4,20 €', ['#d7a76b', '#7a4a24', '#f2cf94', '#b5733c']], ['Croissant', '1,30 €', ['#f0c27b', '#a8652a', '#ffe0a3']], ['Tarte fine', '3,80 €', ['#e6b48c', '#8e3b2a', '#f7d3a2', '#c4552f']]];
      cartes.forEach(([n, p, pal], k) => {
        const x = 5 * u + k * 46 * u; photo(ctx, x, y, 42 * u, 30 * u, 3 * u, pal, k + 3);
        T(ctx, n, x, y + 36 * u, { f: 's', t: 4.4 * u, g: 500 }, encre); T(ctx, p, x + 42 * u, y + 36 * u, { f: 'm', t: 3.2 * u }, terre, 'right');
      });
    } else {
      const x0 = C.x + 5 * u;
      epi(x0 + 1.4 * u, 6.2 * u, 2.4 * u, terre);
      T(ctx, 'Fournil des Aurores', x0 + 4.4 * u, 7.4 * u, { f: 's', t: 3 * u, g: 500 }, encre);
      let xx = C.x + C.w * 0.5;
      for (const l of ['Nos pains', 'Viennoiseries', 'La maison', 'Nous trouver']) xx += T(ctx, l, xx, 7.2 * u, { f: 'b', t: 1.75 * u, g: 500 }, encre) + 3 * u;
      bouton(ctx, 'Commander', C.x + C.w - 5 * u, 3.8 * u, 5 * u, { fond: encre, encre: fond, st: { f: 'b', t: 1.75 * u, g: 600 }, al: 'right' });
      percer(ctx, t, 0.25);
      T(ctx, 'BOULANGERIE AU LEVAIN · LYON 4e', x0, 27 * u, { f: 'm', t: 1.5 * u, g: 500, ls: 0.15 * u }, terre);
      let y = titre(ctx, [['Le pain se lève ', { f: 's', t: 8.6 * u, g: 400 }, encre], ['avant vous.', { f: 's', t: 8.6 * u, g: 400, i: true }, terre]], x0, 38 * u, C.w * 0.42, 8.6 * u);
      y = P(ctx, 'Levain naturel, farines du Lyonnais, cuisson au feu de bois. Le premier pain sort du four à 5 h 40, la boutique ouvre à 6 h 30.', x0, y + 2 * u, C.w * 0.36, 3.1 * u, { f: 'b', t: 2 * u }, doux);
      const bw = bouton(ctx, 'Réserver pour demain', x0, y + 2.5 * u, 6.2 * u, { fond: terre, encre: '#fff8ef', st: { f: 'b', t: 1.9 * u, g: 600 }, fleche: true });
      bouton(ctx, 'Horaires', x0 + bw + 1.5 * u, y + 2.5 * u, 6.2 * u, { bord: encre, encre, st: { f: 'b', t: 1.9 * u, g: 500 } });
      y += 16 * u;
      ctx.fillStyle = 'rgba(43,29,20,0.15)'; ctx.fillRect(x0, y - 4 * u, C.w * 0.4, 1);
      [['6 h 30', 'ouverture'], ['48 h', 'de levain'], ['1932', 'le four']].forEach(([a, b], k) => {
        T(ctx, a, x0 + k * C.w * 0.14, y + 1.5 * u, { f: 's', t: 3.6 * u, g: 500 }, encre); T(ctx, b, x0 + k * C.w * 0.14, y + 4.5 * u, { f: 'b', t: 1.5 * u }, doux);
      });
      etoile(ctx, t.x + t.w - 3 * u, t.y + 7 * u, 2.2 * u, or);
    }
  },

  // 2. Tatouage : noir, néon magenta et cyan, Bricolage étroite
  tatouage(ctx, W, H, t) {
    const por = W / H < 0.8, u = por ? W / 100 : H / 100, C = conteneur(W, H);
    const fond = '#0b0a10', encre = '#f3eefc', rose = '#ff4fb0', cyan = '#52f2ff', doux = '#bdb4d0';
    ctx.fillStyle = fond; ctx.fillRect(0, 0, W, H);
    const neon = (s, x, y, st, c, al = 'left') => { ctx.save(); ctx.shadowColor = c; ctx.shadowBlur = st.t * 0.35; T(ctx, s, x, y, st, c, al); ctx.restore(); T(ctx, s, x, y, st, '#fff4fb', al); };
    if (por) {
      T(ctx, 'ENCRE', 5 * u, 9.6 * u, { f: 'b', t: 6 * u, g: 800, e: 'condensed', ls: 0.2 * u }, encre);
      T(ctx, 'NÉON', 5 * u + mesure(ctx, 'ENCRE ', { f: 'b', t: 6 * u, g: 800, e: 'condensed', ls: 0.2 * u }), 9.6 * u, { f: 'b', t: 6 * u, g: 800, e: 'condensed', ls: 0.2 * u }, rose);
      bouton(ctx, 'RDV', 95 * u, 4 * u, 8.6 * u, { bord: cyan, encre: cyan, st: { f: 'm', t: 3.4 * u, g: 600 }, al: 'right', r: 1 * u });
      percer(ctx, t, 0.5);
      // le titre déborde sur l'image : il flotte devant le monde
      const yb = t.y + t.h;
      ctx.save(); ctx.globalAlpha = 0.92; neon('TATOUAGE', 5 * u, yb - 4 * u, { f: 'b', t: 17 * u, g: 800, e: 'condensed' }, rose); ctx.restore();
      T(ctx, '[ FLASH DU MOIS · FINE LINE · RÉALISME ]', 5 * u, yb + 9 * u, { f: 'm', t: 2.8 * u, g: 500 }, cyan);
      let y = P(ctx, 'Un atelier de nuit au cœur de Nantes. Trois artistes, des dessins uniques, et le temps qu’il faut pour le vôtre.', 5 * u, yb + 17 * u, 88 * u, 6 * u, { f: 'b', t: 4 * u }, doux);
      const bw = bouton(ctx, 'Proposer mon projet', 5 * u, y + 2 * u, 12 * u, { fond: rose, encre: '#16001a', st: { f: 'b', t: 3.9 * u, g: 700 }, r: 1 * u, fleche: true });
      bouton(ctx, 'Le flash', 8 * u + bw, y + 2 * u, 12 * u, { bord: '#6d6585', encre, st: { f: 'b', t: 3.9 * u, g: 500 }, r: 1 * u });
      y += 20 * u;
      ['#ff4fb0', '#52f2ff', '#c9b8ff'].forEach((c, k) => { photo(ctx, 5 * u + k * 31 * u, y, 28 * u, 36 * u, 1 * u, ['#16121f', '#07060b', c, '#2a1840'], 11 + k); });
    } else {
      const x0 = C.x + 4 * u;
      T(ctx, 'ENCRE', x0, 7 * u, { f: 'b', t: 3 * u, g: 800, e: 'condensed', ls: 0.15 * u }, encre);
      T(ctx, 'NÉON', x0 + mesure(ctx, 'ENCRE ', { f: 'b', t: 3 * u, g: 800, e: 'condensed', ls: 0.15 * u }), 7 * u, { f: 'b', t: 3 * u, g: 800, e: 'condensed', ls: 0.15 * u }, rose);
      let xx = x0 + 16 * u;
      for (const l of ['FLASH', 'ARTISTES', 'SOINS', 'ATELIER']) xx += T(ctx, l, xx, 6.8 * u, { f: 'm', t: 1.4 * u, g: 500, ls: 0.1 * u }, doux) + 2.6 * u;
      bouton(ctx, 'PRENDRE RDV', W - (W / H > 2.1 ? C.x : 3 * u), 3.4 * u, 5 * u, { bord: cyan, encre: cyan, st: { f: 'm', t: 1.5 * u, g: 600 }, al: 'right', r: 0.5 * u });
      percer(ctx, t, 0.5);
      ctx.save(); ctx.globalAlpha = 0.95;
      neon('ENCRE', x0, 46 * u, { f: 'b', t: 24 * u, g: 800, e: 'condensed' }, rose);
      neon('DE NUIT', x0, 68 * u, { f: 'b', t: 21 * u, g: 800, e: 'condensed' }, cyan);
      ctx.restore();
      T(ctx, '[ FLASH DU MOIS · FINE LINE · RÉALISME ]', x0, 77 * u, { f: 'm', t: 1.4 * u, g: 500 }, cyan);
      P(ctx, 'Un atelier de nuit au cœur de Nantes. Trois artistes, des dessins uniques, et le temps qu’il faut pour le vôtre.', x0, 82 * u, C.w * 0.3, 2.8 * u, { f: 'b', t: 1.9 * u }, doux);
      bouton(ctx, 'Proposer mon projet', x0, 89 * u, 5.4 * u, { fond: rose, encre: '#16001a', st: { f: 'b', t: 1.8 * u, g: 700 }, r: 0.5 * u, fleche: true });
    }
  },

  // 3. Avocate : papier, marine, laiton, Newsreader
  avocat(ctx, W, H, t) {
    const por = W / H < 0.8, u = por ? W / 100 : H / 100, C = conteneur(W, H);
    const fond = '#f3f0ea', marine = '#13233f', laiton = '#8a6a32', doux = '#4a4f5c';
    ctx.fillStyle = fond; ctx.fillRect(0, 0, W, H);
    const mono = (x, y, s) => { ctx.strokeStyle = marine; ctx.lineWidth = s * 0.05; ctx.beginPath(); ctx.arc(x, y, s, 0, Math.PI * 2); ctx.stroke(); T(ctx, 'IV', x, y + s * 0.36, { f: 's', t: s * 1.05, g: 500, ls: s * 0.05 }, marine, 'center'); };
    const cadre = () => { ctx.strokeStyle = laiton; ctx.lineWidth = 1.2; const e = por ? 2.4 * u : 1.4 * u; ctx.strokeRect(t.x - e, t.y - e, t.w + 2 * e, t.h + 2 * e); };
    if (por) {
      mono(10 * u, 8 * u, 4.6 * u);
      T(ctx, 'Inès Varenne', 18 * u, 7.6 * u, { f: 's', t: 5 * u, g: 500 }, marine);
      T(ctx, 'AVOCATE AU BARREAU DE BORDEAUX', 18 * u, 11.4 * u, { f: 'b', t: 2.3 * u, g: 600, ls: 0.4 * u }, laiton);
      burger(ctx, 87 * u, 6.4 * u, 7 * u, marine);
      cadre(); percer(ctx, t, 0.2);
      let y = t.y + t.h + 13 * u;
      y = titre(ctx, [['Vous défendre, ', { f: 's', t: 10 * u, g: 400 }, marine], ['clairement.', { f: 's', t: 10 * u, g: 400, i: true }, laiton]], 6 * u, y, 88 * u, 10.4 * u);
      y = P(ctx, 'Droit de la famille, droit du travail. Un premier rendez-vous sous 48 h, au cabinet ou en visio, et des honoraires annoncés dès le début.', 6 * u, y + 1 * u, 88 * u, 6 * u, { f: 'b', t: 3.9 * u }, doux);
      bouton(ctx, 'Prendre rendez-vous', 6 * u, y + 2 * u, 12 * u, { fond: marine, encre: fond, st: { f: 'b', t: 3.9 * u, g: 600 }, r: 0, fleche: true });
      y += 24 * u;
      [['Famille', 'Divorce, garde, pension'], ['Travail', 'Licenciement, prud’hommes'], ['Logement', 'Bail, litiges']].forEach(([a, b], k) => {
        const yy = y + k * 11 * u; ctx.fillStyle = 'rgba(19,35,63,0.18)'; ctx.fillRect(6 * u, yy - 6.5 * u, 88 * u, 1);
        T(ctx, a, 6 * u, yy, { f: 's', t: 5 * u, g: 500 }, marine); T(ctx, b, 94 * u, yy, { f: 'b', t: 3.2 * u }, doux, 'right');
      });
    } else {
      const x0 = C.x + 5 * u;
      mono(x0 + 2.4 * u, 6.4 * u, 2.4 * u);
      T(ctx, 'Inès Varenne', x0 + 6.4 * u, 7.6 * u, { f: 's', t: 2.6 * u, g: 500 }, marine);
      let xx = C.x + C.w * 0.48;
      for (const l of ['Le cabinet', 'Domaines', 'Honoraires', 'Contact']) xx += T(ctx, l, xx, 7.4 * u, { f: 'b', t: 1.7 * u, g: 500 }, marine) + 3 * u;
      bouton(ctx, 'Rendez-vous', C.x + C.w - 5 * u, 4 * u, 5 * u, { fond: marine, encre: fond, st: { f: 'b', t: 1.7 * u, g: 600 }, r: 0, al: 'right' });
      cadre(); percer(ctx, t, 0.2);
      T(ctx, 'AVOCATE AU BARREAU DE BORDEAUX', x0, 27 * u, { f: 'b', t: 1.4 * u, g: 600, ls: 0.3 * u }, laiton);
      let y = titre(ctx, [['Vous défendre, ', { f: 's', t: 8 * u, g: 400 }, marine], ['clairement.', { f: 's', t: 8 * u, g: 400, i: true }, laiton]], x0, 38 * u, C.w * 0.42, 8.2 * u);
      y = P(ctx, 'Droit de la famille, droit du travail. Un premier rendez-vous sous 48 h, au cabinet ou en visio, et des honoraires annoncés dès le début.', x0, y + 2 * u, C.w * 0.38, 3.1 * u, { f: 'b', t: 1.95 * u }, doux);
      bouton(ctx, 'Prendre rendez-vous', x0, y + 2.5 * u, 6 * u, { fond: marine, encre: fond, st: { f: 'b', t: 1.9 * u, g: 600 }, r: 0, fleche: true });
      T(ctx, '« Une affaire bien expliquée est déjà à moitié réglée. »', x0, 90 * u, { f: 's', t: 2 * u, i: true }, doux);
    }
  },

  // 4. Fleuriste : rose pâle, vert, corail ; trou rond
  fleuriste(ctx, W, H, t) {
    const por = W / H < 0.8, u = por ? W / 100 : H / 100, C = conteneur(W, H);
    const fond = '#fbeff0', vert = '#24492e', corail = '#c8405a', doux = '#5a4a4e';
    ctx.fillStyle = fond; ctx.fillRect(0, 0, W, H);
    // taches de couleur douces
    for (const [x, y, r, c] of [[0.9, 0.12, 0.5, 'rgba(255,182,193,0.55)'], [0.05, 0.8, 0.6, 'rgba(190,225,190,0.5)']]) {
      const g = ctx.createRadialGradient(x * W, y * H, 0, x * W, y * H, r * Math.max(W, H)); g.addColorStop(0, c); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
    const fleur = (x, y, s, c) => { ctx.fillStyle = c; for (let k = 0; k < 5; k++) { const a = k * Math.PI * 0.4 - Math.PI / 2; ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * s * 0.5, y + Math.sin(a) * s * 0.5, s * 0.42, s * 0.3, a, 0, Math.PI * 2); ctx.fill(); } ctx.fillStyle = '#f4c04e'; ctx.beginPath(); ctx.arc(x, y, s * 0.26, 0, Math.PI * 2); ctx.fill(); };
    if (por) {
      fleur(8.5 * u, 8 * u, 4 * u, corail);
      T(ctx, 'Pétale', 14 * u, 8.2 * u, { f: 's', t: 6 * u, g: 500, i: true }, vert);
      T(ctx, 'Sauvage', 14 * u + mesure(ctx, 'Pétale ', { f: 's', t: 6 * u, g: 500, i: true }), 8.2 * u, { f: 's', t: 6 * u, g: 400 }, vert);
      bouton(ctx, 'Bouquets', 95 * u, 3.6 * u, 8.6 * u, { fond: vert, encre: fond, st: { f: 'b', t: 3.6 * u, g: 600 }, al: 'right' });
      percer(ctx, t, 0.2);
      // une étiquette posée sur le bord du rond
      ctx.save(); ctx.translate(76 * u, t.y + t.h * 0.86); ctx.rotate(-0.12); rr(ctx, -15 * u, -5 * u, 30 * u, 10 * u, 5 * u); ctx.fillStyle = corail; ctx.fill(); T(ctx, 'Cueilli ce matin', 0, 1.3 * u, { f: 'b', t: 3.4 * u, g: 700 }, '#fff', 'center'); ctx.restore();
      let y = t.y + t.h + 14 * u;
      y = titre(ctx, [['Des fleurs qui ', { f: 's', t: 9.6 * u, g: 400 }, vert], ['ont poussé ici.', { f: 's', t: 9.6 * u, g: 400, i: true }, corail]], 50 * u, y, 90 * u, 10 * u, 'center');
      y = P(ctx, 'Fleurs de saison, cultivées à vingt kilomètres d’Annecy. Bouquets livrés à vélo le jour même.', 50 * u, y + 1 * u, 84 * u, 6 * u, { f: 'b', t: 3.9 * u }, doux, 99, 'center');
      bouton(ctx, 'Composer mon bouquet', 50 * u, y + 2 * u, 12 * u, { fond: corail, encre: '#fff', st: { f: 'b', t: 3.9 * u, g: 600 }, al: 'center', fleche: true });
    } else {
      const x0 = C.x + 5 * u;
      fleur(x0 + 1.8 * u, 6.2 * u, 2.2 * u, corail);
      T(ctx, 'Pétale Sauvage', x0 + 5 * u, 7.4 * u, { f: 's', t: 3 * u, g: 500, i: true }, vert);
      let xx = C.x + C.w * 0.46;
      for (const l of ['Bouquets', 'Mariages', 'Abonnement', 'L’atelier']) xx += T(ctx, l, xx, 7.2 * u, { f: 'b', t: 1.7 * u, g: 500 }, vert) + 3 * u;
      percer(ctx, t, 0.2);
      ctx.save(); ctx.translate(t.x + t.w * 0.12, t.y + t.h * 0.84); ctx.rotate(-0.14); rr(ctx, -8 * u, -2.6 * u, 16 * u, 5.2 * u, 2.6 * u); ctx.fillStyle = corail; ctx.fill(); T(ctx, 'Cueilli ce matin', 0, 0.7 * u, { f: 'b', t: 1.8 * u, g: 700 }, '#fff', 'center'); ctx.restore();
      T(ctx, 'FLEURISTE · ANNECY', x0, 28 * u, { f: 'b', t: 1.5 * u, g: 700, ls: 0.3 * u }, corail);
      let y = titre(ctx, [['Des fleurs qui ', { f: 's', t: 8.4 * u, g: 400 }, vert], ['ont poussé ici.', { f: 's', t: 8.4 * u, g: 400, i: true }, corail]], x0, 39 * u, C.w * 0.42, 8.6 * u);
      y = P(ctx, 'Fleurs de saison, cultivées à vingt kilomètres d’Annecy. Bouquets livrés à vélo le jour même, abonnements à la semaine.', x0, y + 2 * u, C.w * 0.38, 3.1 * u, { f: 'b', t: 1.95 * u }, doux);
      bouton(ctx, 'Composer mon bouquet', x0, y + 2.5 * u, 6 * u, { fond: corail, encre: '#fff', st: { f: 'b', t: 1.9 * u, g: 600 }, fleche: true });
    }
  },

  // 5. Escalade : jaune vif, noir, Bricolage étroite en capitales ; trou en biais
  escalade(ctx, W, H, t) {
    const por = W / H < 0.8, u = por ? W / 100 : H / 100, C = conteneur(W, H);
    const fond = '#ffd23f', noir = '#111111', doux = '#2b2410';
    ctx.fillStyle = fond; ctx.fillRect(0, 0, W, H);
    const st = (k) => ({ f: 'b', t: k * u, g: 800, e: 'condensed' });
    const prises = (x, y, s) => { const cs = ['#ff5a36', '#2f6bff', '#11a36a', '#111']; const Hh = hasard(5); for (let k = 0; k < 9; k++) { ctx.fillStyle = cs[k % 4]; ctx.beginPath(); ctx.ellipse(x + Hh() * s * 3, y + Hh() * s, s * (0.12 + Hh() * 0.12), s * (0.09 + Hh() * 0.08), Hh() * 3, 0, Math.PI * 2); ctx.fill(); } };
    if (por) {
      T(ctx, 'BLOC', 5 * u, 9.6 * u, st(7), noir); T(ctx, 'ALTITUDE', 5 * u + mesure(ctx, 'BLOC ', st(7)), 9.6 * u, { ...st(7), g: 500 }, noir);
      burger(ctx, 87 * u, 5.6 * u, 7 * u, noir);
      percer(ctx, t, 0.3);
      const yb = t.y + t.h;
      ctx.save(); ctx.translate(5 * u, yb - 2 * u); ctx.transform(1, 0, -0.18, 1, 0, 0);
      T(ctx, 'GRIMPE', 0, -15 * u, st(16), '#fff'); T(ctx, 'PLUS HAUT', 0, 0, st(16), noir);
      ctx.restore();
      let y = P(ctx, '1 200 m² de blocs, 300 voies, des cours dès 6 ans. Ouvert tous les jours jusqu’à 23 h, à Grenoble.', 5 * u, yb + 10 * u, 88 * u, 6 * u, { f: 'b', t: 4 * u, g: 500 }, doux);
      bouton(ctx, 'RÉSERVER UNE SÉANCE', 5 * u, y + 2 * u, 12 * u, { fond: noir, encre: fond, st: { f: 'b', t: 4 * u, g: 800, e: 'condensed', ls: 0.2 * u }, r: 0, fleche: true });
      y += 20 * u;
      [['ENTRÉE', '14 €'], ['10 SÉANCES', '120 €'], ['COURS', 'DÈS 6 ANS']].forEach(([a, b], k) => { const x = 5 * u + k * 31 * u; ctx.fillStyle = noir; ctx.fillRect(x, y, 28 * u, 0.6 * u); T(ctx, a, x, y + 6 * u, { f: 'b', t: 3 * u, g: 700 }, doux); T(ctx, b, x, y + 13 * u, st(6.4), noir); });
      prises(60 * u, 3 * u, 9 * u);
    } else {
      const x0 = C.x + 4 * u;
      T(ctx, 'BLOC', x0, 7.4 * u, st(3.6), noir); T(ctx, 'ALTITUDE', x0 + mesure(ctx, 'BLOC ', st(3.6)), 7.4 * u, { ...st(3.6), g: 500 }, noir);
      let xx = x0 + 24 * u;
      for (const l of ['BLOCS', 'VOIES', 'COURS', 'TARIFS']) xx += T(ctx, l, xx, 7 * u, { f: 'b', t: 1.7 * u, g: 700, ls: 0.1 * u }, noir) + 2.6 * u;
      percer(ctx, t, 0.3);
      ctx.save(); ctx.translate(x0, 0); ctx.transform(1, 0, -0.18, 1, 0, 0);
      T(ctx, 'GRIMPE', 12 * u, 40 * u, st(18), noir); T(ctx, 'PLUS', 9 * u, 57 * u, st(18), '#fff'); T(ctx, 'HAUT', 6 * u, 74 * u, st(18), noir);
      ctx.restore();
      P(ctx, '1 200 m² de blocs, 300 voies, des cours dès 6 ans. Ouvert tous les jours jusqu’à 23 h.', x0, 88 * u, C.w * 0.34, 2.8 * u, { f: 'b', t: 1.9 * u, g: 500 }, doux);
      bouton(ctx, 'RÉSERVER UNE SÉANCE', W - (W / H > 2.1 ? C.x : 3 * u), 90.5 * u, 6 * u, { fond: noir, encre: fond, st: { f: 'b', t: 2 * u, g: 800, e: 'condensed', ls: 0.15 * u }, r: 0, al: 'right', fleche: true });
      prises(x0 + 2 * u, 14 * u, 5 * u);
    }
  },

  // 6. Garage : crème, rouge, Bricolage grasse ; trou arrondi
  garage(ctx, W, H, t) {
    const por = W / H < 0.8, u = por ? W / 100 : H / 100, C = conteneur(W, H);
    const fond = '#efe6d2', rouge = '#b52a24', noir = '#1f2328', doux = '#4e4a42';
    ctx.fillStyle = fond; ctx.fillRect(0, 0, W, H);
    // bandes rétro
    const bandes = (x, y, w, e) => { [rouge, '#e3a33a', noir].forEach((c, k) => { ctx.fillStyle = c; ctx.fillRect(x, y + k * e * 1.5, w, e); }); };
    const badge = (x, y, s) => { ctx.fillStyle = rouge; ctx.beginPath(); ctx.arc(x, y, s, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = fond; ctx.lineWidth = s * 0.07; ctx.beginPath(); ctx.arc(x, y, s * 0.8, 0, Math.PI * 2); ctx.stroke(); T(ctx, 'GP', x, y + s * 0.3, { f: 'b', t: s * 0.85, g: 800, e: 'condensed' }, fond, 'center'); };
    if (por) {
      badge(10 * u, 8 * u, 5 * u);
      T(ctx, 'GARAGE DES', 18 * u, 6.8 * u, { f: 'b', t: 2.8 * u, g: 700, ls: 0.4 * u }, doux);
      T(ctx, 'Platanes', 18 * u, 12 * u, { f: 'b', t: 6 * u, g: 800, e: 'condensed' }, noir);
      bouton(ctx, 'Devis', 95 * u, 4.4 * u, 8.6 * u, { fond: rouge, encre: '#fff', st: { f: 'b', t: 3.6 * u, g: 700 }, al: 'right', r: 1.5 * u });
      bandes(0, 16.2 * u, W, 0.8 * u);
      percer(ctx, t, 0.3);
      let y = t.y + t.h + 13 * u;
      y = titre(ctx, [['Votre voiture entre de ', { f: 'b', t: 8.6 * u, g: 800, e: 'condensed' }, noir], ['bonnes mains.', { f: 's', t: 9.4 * u, g: 400, i: true }, rouge]], 5 * u, y, 90 * u, 9.4 * u);
      y = P(ctx, 'Révision, freins, pneus, climatisation. Devis gratuit en 24 h et voiture de prêt, à deux pas du pont d’Avignon.', 5 * u, y + 1 * u, 88 * u, 6 * u, { f: 'b', t: 3.9 * u }, doux);
      const bw = bouton(ctx, 'Prendre rendez-vous', 5 * u, y + 2 * u, 12 * u, { fond: noir, encre: fond, st: { f: 'b', t: 3.9 * u, g: 700 }, r: 1.5 * u, fleche: true });
      bouton(ctx, 'Tarifs', 8 * u + bw, y + 2 * u, 12 * u, { bord: noir, encre: noir, st: { f: 'b', t: 3.9 * u, g: 600 }, r: 1.5 * u });
      y += 22 * u;
      [['Vidange', '89 €'], ['Plaquettes', '129 €'], ['Clim', '69 €']].forEach(([a, b], k) => { const x = 5 * u + k * 31 * u; rr(ctx, x, y, 28 * u, 16 * u, 2 * u); ctx.fillStyle = '#fffaf0'; ctx.fill(); T(ctx, a, x + 3 * u, y + 6.4 * u, { f: 'b', t: 3.3 * u, g: 600 }, doux); T(ctx, b, x + 3 * u, y + 13 * u, { f: 'm', t: 4.6 * u, g: 700 }, rouge); });
    } else {
      const x0 = C.x + 5 * u;
      badge(x0 + 2.6 * u, 6.4 * u, 2.6 * u);
      T(ctx, 'Garage des Platanes', x0 + 6.6 * u, 7.6 * u, { f: 'b', t: 2.8 * u, g: 800, e: 'condensed' }, noir);
      let xx = C.x + C.w * 0.47;
      for (const l of ['Entretien', 'Réparation', 'Pneus', 'Nous trouver']) xx += T(ctx, l, xx, 7.4 * u, { f: 'b', t: 1.7 * u, g: 600 }, noir) + 3 * u;
      bouton(ctx, 'Devis gratuit', C.x + C.w - 5 * u, 4 * u, 5 * u, { fond: rouge, encre: '#fff', st: { f: 'b', t: 1.7 * u, g: 700 }, al: 'right', r: 0.8 * u });
      bandes(0, 11.6 * u, W, 0.5 * u);
      percer(ctx, t, 0.3);
      T(ctx, 'MÉCANIQUE GÉNÉRALE · AVIGNON', x0, 28 * u, { f: 'b', t: 1.5 * u, g: 700, ls: 0.3 * u }, rouge);
      let y = titre(ctx, [['Votre voiture entre de ', { f: 'b', t: 7 * u, g: 800, e: 'condensed' }, noir], ['bonnes mains.', { f: 's', t: 7.6 * u, g: 400, i: true }, rouge]], x0, 38 * u, C.w * 0.38, 7.6 * u);
      y = P(ctx, 'Révision, freins, pneus, climatisation. Devis gratuit en 24 h et voiture de prêt, à deux pas du pont d’Avignon.', x0, y + 2 * u, C.w * 0.36, 3.1 * u, { f: 'b', t: 1.95 * u }, doux);
      bouton(ctx, 'Prendre rendez-vous', x0, y + 2.5 * u, 6 * u, { fond: noir, encre: fond, st: { f: 'b', t: 1.9 * u, g: 700 }, r: 0.8 * u, fleche: true });
    }
  },

  // 7. École de musique : bleu nuit, or, Newsreader ; trou ovale
  musique(ctx, W, H, t) {
    const por = W / H < 0.8, u = por ? W / 100 : H / 100, C = conteneur(W, H);
    const fond = '#0f1b3d', or = '#e8c46a', creme = '#f6f0e1', doux = '#c4c9dc';
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0f1b3d'); g.addColorStop(1, '#0a1230'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // portée en filigrane
    ctx.strokeStyle = 'rgba(232,196,106,0.12)'; ctx.lineWidth = 1;
    for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.moveTo(0, H * 0.93 + k * u * (por ? 1.6 : 1.2)); ctx.bezierCurveTo(W * 0.3, H * 0.86 + k * u, W * 0.7, H * 0.99 + k * u, W, H * 0.9 + k * u); ctx.stroke(); }
    const cle = (x, y, s) => { T(ctx, '𝄞', x, y, { f: 's', t: s, g: 400 }, or); };
    if (por) {
      T(ctx, 'La Clé des Champs', 6 * u, 8.6 * u, { f: 's', t: 6 * u, g: 500, i: true }, creme);
      T(ctx, 'ÉCOLE DE MUSIQUE · RENNES', 6 * u, 13 * u, { f: 'b', t: 2.4 * u, g: 600, ls: 0.5 * u }, or);
      burger(ctx, 87 * u, 6 * u, 7 * u, creme);
      ctx.strokeStyle = or; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(t.x + t.w / 2, t.y + t.h / 2, t.w / 2 + 2.4 * u, t.h / 2 + 2.4 * u, 0, 0, Math.PI * 2); ctx.stroke();
      percer(ctx, t, 0.35);
      let y = t.y + t.h + 14 * u;
      y = titre(ctx, [['Ici, on apprend ', { f: 's', t: 10 * u, g: 400 }, creme], ['en jouant.', { f: 's', t: 10 * u, g: 400, i: true }, or]], 50 * u, y, 90 * u, 10.4 * u, 'center');
      y = P(ctx, 'Piano, guitare, chant, violon et batterie, dès 4 ans. Premier cours offert, instruments prêtés.', 50 * u, y + 1 * u, 84 * u, 6 * u, { f: 'b', t: 3.9 * u }, doux, 99, 'center');
      bouton(ctx, 'Essayer un cours', 50 * u, y + 2 * u, 12 * u, { fond: or, encre: '#1b1503', st: { f: 'b', t: 3.9 * u, g: 700 }, al: 'center', fleche: true });
      y += 22 * u;
      ['Piano', 'Guitare', 'Chant', 'Violon'].forEach((n, k) => { const w = mesure(ctx, n, { f: 'b', t: 3.4 * u, g: 600 }) + 7 * u; const x = 6 * u + [0, 22, 46, 66][k] * u; rr(ctx, x, y, w, 9 * u, 4.5 * u); ctx.strokeStyle = 'rgba(232,196,106,0.6)'; ctx.stroke(); T(ctx, n, x + 3.5 * u, y + 5.8 * u, { f: 'b', t: 3.4 * u, g: 600 }, creme); });
    } else {
      const x0 = C.x + 5 * u;
      T(ctx, 'La Clé des Champs', x0, 7.6 * u, { f: 's', t: 3 * u, g: 500, i: true }, creme);
      let xx = C.x + C.w * 0.5;
      for (const l of ['Les cours', 'Les profs', 'Concerts', 'Inscription']) xx += T(ctx, l, xx, 7.4 * u, { f: 'b', t: 1.7 * u, g: 500 }, creme) + 3 * u;
      ctx.strokeStyle = or; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(t.x + t.w / 2, t.y + t.h / 2, t.w / 2 + 1.4 * u, t.h / 2 + 1.4 * u, 0, 0, Math.PI * 2); ctx.stroke();
      percer(ctx, t, 0.35);
      T(ctx, 'ÉCOLE DE MUSIQUE · RENNES', x0, 28 * u, { f: 'b', t: 1.5 * u, g: 600, ls: 0.35 * u }, or);
      let y = titre(ctx, [['Ici, on apprend ', { f: 's', t: 8.6 * u, g: 400 }, creme], ['en jouant.', { f: 's', t: 8.6 * u, g: 400, i: true }, or]], x0, 39 * u, C.w * 0.44, 8.8 * u);
      y = P(ctx, 'Piano, guitare, chant, violon et batterie, dès 4 ans. Premier cours offert, instruments prêtés le temps de choisir.', x0, y + 2 * u, C.w * 0.38, 3.1 * u, { f: 'b', t: 1.95 * u }, doux);
      bouton(ctx, 'Essayer un cours', x0, y + 2.5 * u, 6 * u, { fond: or, encre: '#1b1503', st: { f: 'b', t: 1.9 * u, g: 700 }, fleche: true });
    }
  },

  // 8. Vigneron : crème, bordeaux, or ; image pleine largeur
  vigneron(ctx, W, H, t) {
    const por = W / H < 0.8, u = por ? W / 100 : H / 100, C = conteneur(W, H);
    const fond = '#f4ede1', vin = '#5b1a2b', or = '#8f6a2c', doux = '#4d3f3a';
    ctx.fillStyle = fond; ctx.fillRect(0, 0, W, H);
    if (por) {
      percer(ctx, t, 0);
      // le haut de l'image porte la barre du site, en blanc sur le monde
      const gh = ctx.createLinearGradient(0, 0, 0, 22 * u); gh.addColorStop(0, 'rgba(20,8,12,0.55)'); gh.addColorStop(1, 'rgba(20,8,12,0)'); ctx.fillStyle = gh; ctx.fillRect(0, 0, W, 22 * u);
      T(ctx, 'CLOS DES BRUMES', 6 * u, 10 * u, { f: 's', t: 4.6 * u, g: 500, ls: 0.6 * u }, '#fff7ea');
      burger(ctx, 87 * u, 6.6 * u, 7 * u, '#fff7ea');
      // la courbe du bas de l'image
      ctx.fillStyle = fond; ctx.beginPath(); ctx.moveTo(0, t.h); ctx.quadraticCurveTo(W / 2, t.h - 14 * u, W, t.h); ctx.lineTo(W, t.h + 2); ctx.lineTo(0, t.h + 2); ctx.fill();
      let y = t.h + 10 * u;
      T(ctx, 'VIGNERON EN BEAUJOLAIS', 50 * u, y, { f: 'b', t: 2.6 * u, g: 600, ls: 0.6 * u }, or, 'center');
      y = titre(ctx, [['Le vin des ', { f: 's', t: 10 * u, g: 400 }, vin], ['matins de brume.', { f: 's', t: 10 * u, g: 400, i: true }, or]], 50 * u, y + 11 * u, 90 * u, 10.4 * u, 'center');
      y = P(ctx, 'Gamay de coteaux, vendangé à la main. Visites et dégustations le samedi, sur réservation.', 50 * u, y + 1 * u, 84 * u, 6 * u, { f: 'b', t: 3.9 * u }, doux, 99, 'center');
      bouton(ctx, 'Réserver une dégustation', 50 * u, y + 2 * u, 12 * u, { fond: vin, encre: '#fff7ea', st: { f: 'b', t: 3.9 * u, g: 600 }, al: 'center', r: 0, fleche: true });
    } else {
      const x0 = C.x + 5 * u;
      T(ctx, 'CLOS DES BRUMES', W / 2, 7.4 * u, { f: 's', t: 2.8 * u, g: 500, ls: 0.4 * u }, vin, 'center');
      T(ctx, 'Le domaine', x0, 7.2 * u, { f: 'b', t: 1.7 * u, g: 500 }, vin); T(ctx, 'Nos vins', x0 + 12 * u, 7.2 * u, { f: 'b', t: 1.7 * u, g: 500 }, vin);
      bouton(ctx, 'Dégustation', C.x + C.w - 5 * u, 4 * u, 5 * u, { fond: vin, encre: '#fff7ea', st: { f: 'b', t: 1.7 * u, g: 600 }, al: 'right', r: 0 });
      percer(ctx, t, 0.25);
      let y = t.y + t.h + 8 * u;
      titre(ctx, [['Le vin des ', { f: 's', t: 6.4 * u, g: 400 }, vin], ['matins de brume.', { f: 's', t: 6.4 * u, g: 400, i: true }, or]], x0, y + 1 * u, C.w * 0.5, 6.6 * u);
      P(ctx, 'Gamay de coteaux, vendangé à la main, élevé sans hâte. Visites et dégustations le samedi, sur réservation.', C.x + C.w * 0.56, y - 2 * u, C.w * 0.34, 3 * u, { f: 'b', t: 1.9 * u }, doux);
      bouton(ctx, 'Réserver une dégustation', C.x + C.w * 0.56, y + 6.5 * u, 5.6 * u, { fond: vin, encre: '#fff7ea', st: { f: 'b', t: 1.8 * u, g: 600 }, r: 0, fleche: true });
    }
  },
};
