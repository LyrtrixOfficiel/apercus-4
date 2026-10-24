/* Les textes posés SUR les objets du monde (canevas 2D -> texture) : les chiffres des panneaux géants, les noms des
   partenaires sur les panneaux de bord de piste, « BRINGIA #15 » sur le portique. Police de la page : Archivo
   (étroite, très grasse), sinon une linéale système. */
const FAMILLE = '"Archivo", "Arial Narrow", "Helvetica Neue", Arial, sans-serif';
export const ORANGE = '#ff5a14';

export async function chargerPolices() {
  if (!document.fonts || !document.fonts.load) return false;
  try {
    await Promise.race([
      Promise.all([document.fonts.load('900 120px "Archivo"'), document.fonts.load('italic 900 120px "Archivo"'), document.fonts.load('600 40px "Archivo"')]),
      new Promise((r) => setTimeout(r, 1800)),
    ]);
    return document.fonts.check('900 120px "Archivo"');
  } catch { return false; }
}

function police(ctx, poids, taille, italique = false, etroit = true) {
  ctx.font = `${italique ? 'italic ' : ''}${poids} ${taille}px ${FAMILLE}`;
  try { ctx.fontStretch = etroit ? 'condensed' : 'normal'; } catch {}
}
/* une ligne qui tient dans la largeur l (réduit la taille si besoin) */
function ajuster(ctx, texte, poids, taille, l, italique = false, etroit = true) {
  let t = taille;
  police(ctx, poids, t, italique, etroit);
  while (ctx.measureText(texte).width > l && t > 10) { t *= 0.94; police(ctx, poids, t, italique, etroit); }
  return t;
}

/* un panneau géant du palmarès : 1024 x 512 */
export function dessinerChiffre(c) {
  const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 512;
  const x = cv.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, '#0b0b0d'); g.addColorStop(1, '#151517');
  x.fillStyle = g; x.fillRect(0, 0, 1024, 512);
  // la bande orange de gauche et le filet
  x.fillStyle = ORANGE; x.fillRect(0, 0, 22, 512);
  x.fillStyle = 'rgba(255,90,20,0.35)'; x.fillRect(60, 470, 904, 3);
  // le chiffre
  const valeur = String(c.valeur || ''), unite = String(c.unite || '');
  const tv = ajuster(x, valeur, 900, 300, 640, true);
  x.fillStyle = ORANGE; x.textBaseline = 'alphabetic';
  x.fillText(valeur, 62, 300);
  const lv = x.measureText(valeur).width;
  if (unite) { police(x, 800, tv * 0.32, true); x.fillStyle = '#f4f0ea'; x.fillText(unite, 62 + lv + 14, 300); }
  // la légende et le détail
  x.fillStyle = '#f4f0ea';
  ajuster(x, String(c.legende || '').toUpperCase(), 800, 70, 900);
  x.fillText(String(c.legende || '').toUpperCase(), 62, 392);
  x.fillStyle = 'rgba(244,240,234,0.62)';
  ajuster(x, String(c.detail || ''), 500, 40, 900, false, false);
  x.fillText(String(c.detail || ''), 62, 448);
  // télémétrie fine (coin haut droit)
  police(x, 600, 24, false, false); x.fillStyle = 'rgba(255,90,20,0.8)';
  x.textAlign = 'right'; x.fillText('MB · #15', 990, 46); x.textAlign = 'left';
  return cv;
}

/* l'atlas des panneaux de bord de piste : une bande de 1024 x 128 par partenaire (16 au plus) */
export function dessinerPartenaires(liste) {
  const n = Math.max(1, Math.min(16, liste.length));
  const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 128 * 16;
  const x = cv.getContext('2d');
  const styles = [
    { f: '#0a0a0b', t: '#f4f0ea', a: ORANGE },
    { f: ORANGE, t: '#0a0a0b', a: '#0a0a0b' },
    { f: '#f1ece6', t: '#0a0a0b', a: ORANGE },
  ];
  for (let i = 0; i < 16; i++) {
    const p = liste[i % n] || { nom: 'Mathéo Bringia' };
    const s = styles[(p.rang === 'vip' ? 1 : 0) + (i % 3 === 2 ? 1 : 0)] || styles[0];
    const y = i * 128;
    x.fillStyle = s.f; x.fillRect(0, y, 1024, 128);
    x.fillStyle = s.a; x.fillRect(0, y, 10, 128); x.fillRect(1014, y, 10, 128);
    const nom = String(p.nom || '').toUpperCase();
    x.fillStyle = s.t; x.textBaseline = 'middle'; x.textAlign = 'center';
    ajuster(x, nom, 900, 92, 900, true);
    x.fillText(nom, 512, y + 68);
  }
  return { canvas: cv, n };
}

/* la bande LED du portique : « MATHÉO BRINGIA #15 » */
export function dessinerPortique() {
  const cv = document.createElement('canvas'); cv.width = 2048; cv.height = 256;
  const x = cv.getContext('2d');
  x.fillStyle = '#060607'; x.fillRect(0, 0, 2048, 256);
  x.textBaseline = 'middle';
  // « BRINGIA #15 » au centre (lisible même quand le téléphone ne montre que le milieu du portique), des chevrons
  // orange de part et d'autre
  police(x, 900, 168, true);
  const a = 'BRINGIA', b = '#15';
  const la = x.measureText(a).width, lb = x.measureText(b).width;
  const x0 = (2048 - la - lb - 44) / 2;
  x.fillStyle = '#f4f0ea'; x.fillText(a, x0, 136);
  x.fillStyle = ORANGE; x.fillText(b, x0 + la + 44, 136);
  for (const cote of [-1, 1]) {
    for (let i = 0; i < 6; i++) {
      const cx = cote < 0 ? x0 - 90 - i * 70 : x0 + la + lb + 44 + 90 + i * 70;
      x.fillStyle = `rgba(255,90,20,${0.9 - i * 0.13})`;
      x.beginPath(); const s = cote < 0 ? -1 : 1;
      x.moveTo(cx - s * 20, 70); x.lineTo(cx + s * 20, 128); x.lineTo(cx - s * 20, 186); x.lineTo(cx - s * 2, 186); x.lineTo(cx + s * 38, 128); x.lineTo(cx - s * 2, 70); x.closePath(); x.fill();
    }
  }
  police(x, 600, 34, false, false); x.fillStyle = 'rgba(244,240,234,0.55)';
  x.textAlign = 'left'; x.fillText('ANGERVILLE · 1198 M', 40, 222); x.textAlign = 'right'; x.fillText('DÉPART · ARRIVÉE', 2008, 222); x.textAlign = 'left';
  return cv;
}

/* le damier du drapeau */
export function dessinerDamier() {
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 340;
  const x = cv.getContext('2d');
  const n = 9, m = 6, l = 512 / n, h = 340 / m;
  for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) { x.fillStyle = (i + j) % 2 ? '#0b0b0b' : '#f1efe9'; x.fillRect(i * l, j * h, l + 1, h + 1); }
  return cv;
}
