/* Kazura v13, la Scène : la typographie géante.
   Un atlas de mots dessinés une fois sur un canevas 2D (2048 x 256 par mot ; 1024 x 128 sur téléphone),
   dans la police du site (Bricolage Grotesque, chargée par FontFace), lu ensuite par la salle de
   dalles qui les projette sur sa paroi courbe. Plus léger et plus beau qu'une géométrie de lettres :
   les joints des dalles et les points de lumière les traversent comme une vraie projection. */

export const MOTS = ['KAZURA', 'RECOMMANDÉ', 'CHERCHÉ', 'TROUVÉ', 'EXPÉRIENCE', 'RÉALISATIONS', 'QUESTIONS', 'KAZURA', 'RÊVER'];

let promessePolice = null;
export function chargerPolice() {
  if (!promessePolice) promessePolice = chargerPolice0();
  return promessePolice;
}
async function chargerPolice0() {
  try {
    const url = new URL('../polices/bricolage-latin.woff2', import.meta.url).href;
    const f = new FontFace('KzGeante', `url(${url})`, { weight: '200 800', style: 'normal' });
    const charge = f.load().then((ff) => { document.fonts.add(ff); return true; });
    return await Promise.race([charge, new Promise((r) => setTimeout(() => r(false), 3500))]);
  } catch { return false; }
}

export async function creerTypo(THREE, { mobile, police }) {
  const ok = await (police || chargerPolice());
  const L = mobile ? 1024 : 2048, H = L / 8;
  const cv = document.createElement('canvas');
  cv.width = L; cv.height = H * MOTS.length;
  const cx = cv.getContext('2d');
  cx.fillStyle = '#000'; cx.fillRect(0, 0, cv.width, cv.height);
  cx.fillStyle = '#fff';
  cx.textBaseline = 'alphabetic';
  cx.textAlign = 'center';
  const largeurs = [];
  const famille = ok ? '"KzGeante", "Arial Black", sans-serif' : '"Arial Black", "Helvetica Neue", Arial, sans-serif';
  MOTS.forEach((mot, i) => {
    let taille = H * 1.02;
    cx.font = `800 ${taille}px ${famille}`;
    let w = cx.measureText(mot).width;
    if (w > L * 0.98) { taille *= (L * 0.98) / w; cx.font = `800 ${taille}px ${famille}`; w = cx.measureText(mot).width; }
    // capitales accentuées : la ligne de base laisse la place de l'accent au-dessus
    const base = i * H + H * 0.9;
    cx.fillText(mot, L / 2, base);
    largeurs.push(w / H);
  });
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.NoColorSpace;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return { texture: tex, largeurs, lignes: MOTS.length, police: ok };
}
