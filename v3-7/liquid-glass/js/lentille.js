// Liquid glass : la réfraction des commandes posées au-dessus du texte (barre d'onglets, menu, capsules du haut).
// backdrop-filter avec un filtre SVG de déplacement : sur Chrome, Edge et les navigateurs Chromium, ce qui défile
// sous la barre est vraiment courbé sur ses bords. Ailleurs (Safari, Firefox), verre dépoli classique (CSS).
// La carte de déplacement est calculée pour la forme exacte de l'élément (rectangle arrondi, biseau bombé).

let compteur = 0;
let svg = null;

function carte(l, h, rayon, biseau) {
  const c = document.createElement('canvas'); c.width = l; c.height = h;
  const g = c.getContext('2d'), img = g.createImageData(l, h), d = img.data;
  const r = Math.min(rayon, l / 2, h / 2);
  for (let y = 0; y < h; y++) for (let x = 0; x < l; x++) {
    // distance signée au bord d'un rectangle arrondi, et normale sortante
    const px = x + 0.5 - l / 2, py = y + 0.5 - h / 2;
    const qx = Math.abs(px) - (l / 2 - r), qy = Math.abs(py) - (h / 2 - r);
    let dist, nx, ny;
    if (qx > 0 && qy > 0) { const m = Math.hypot(qx, qy); dist = m - r; nx = Math.sign(px) * qx / m; ny = Math.sign(py) * qy / m; }
    else if (qx > qy) { dist = qx - r; nx = Math.sign(px); ny = 0; }
    else { dist = qy - r; nx = 0; ny = Math.sign(py); }
    const t = Math.max(0, Math.min(1, 1 + dist / biseau));      // 1 sur l'arête
    const pente = t / Math.sqrt(Math.max(1 - t * t, 0.05)) * 0.22;
    const i = (y * l + x) * 4;
    d[i] = 128 + Math.max(-127, Math.min(127, nx * pente * 127));
    d[i + 1] = 128 + Math.max(-127, Math.min(127, ny * pente * 127));
    d[i + 2] = 128; d[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return c.toDataURL();
}

export function lentilles(elements) {
  // seuls les navigateurs Chromium appliquent un filtre SVG au fond d'un élément
  if (!window.chrome || !CSS.supports('backdrop-filter', 'url(#a)')) return;
  if (!svg) {
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '0'); svg.setAttribute('height', '0'); svg.setAttribute('aria-hidden', 'true');
    svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    document.body.appendChild(svg);
  }
  for (const el of elements) {
    if (!el || el.dataset.lentille) continue;
    const id = 'lentille-' + ++compteur;
    const f = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
    f.setAttribute('id', id); f.setAttribute('x', '0'); f.setAttribute('y', '0');
    f.setAttribute('filterUnits', 'userSpaceOnUse'); f.setAttribute('color-interpolation-filters', 'sRGB');
    f.innerHTML = '<feImage result="carte" preserveAspectRatio="none" x="0" y="0"/><feDisplacementMap in="SourceGraphic" in2="carte" scale="56" xChannelSelector="R" yChannelSelector="G"/>';
    svg.appendChild(f);
    const image = f.querySelector('feImage');
    let attente = 0, derniere = '';
    const dessiner = () => {
      const l = Math.round(el.offsetWidth), h = Math.round(el.offsetHeight);
      if (!l || !h) return;
      const cle = l + 'x' + h;
      if (cle === derniere) return;
      derniere = cle;
      const brut = getComputedStyle(el).borderTopLeftRadius;
      const rayon = /%/.test(brut) ? parseFloat(brut) / 100 * l : (parseFloat(brut) || h / 2);
      image.setAttribute('href', carte(l, h, rayon, Math.min(20, h * 0.42)));
      image.setAttribute('width', l); image.setAttribute('height', h);
      f.setAttribute('width', l); f.setAttribute('height', h);
    };
    dessiner();
    el.style.setProperty('--lentille', `url(#${id})`);
    el.dataset.lentille = id;
    // pendant une transformation (barre qui se rétracte), la carte est étirée ; recalculée quand ça se pose
    new ResizeObserver(() => { clearTimeout(attente); attente = setTimeout(dessiner, 140); }).observe(el);
  }
  document.documentElement.classList.add('lentille-svg');
}
