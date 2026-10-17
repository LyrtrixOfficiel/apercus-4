// Affiches vivantes des univers : construites en direct en HTML, CSS et SVG, sans aucune capture par prospect.
// Chaque affiche porte SON nom dans la police de l'univers, la palette choisie et le motif signature décrit par
// le champ `affiche` de l'univers. Trois univers posent en plus une de LEURS photos (la même pour tous les
// praticiens d'une famille, servie depuis le dossier de l'univers) : Cinéma, Liquid Glass, Institut. Les photos
// de Cinéma et d'Institut sont étalonnées par la palette en CSS (jamais une couleur contraire), celles de
// Liquid Glass sont choisies dans la palette même. Si une photo manque, le motif dessiné reste dessous.
// Les couleurs et la photo passent par des variables CSS (variablesAffiche) : changer de palette re-teinte
// l'affiche en direct.
// Module pur (node et navigateur) ; le tirage au sort des brins, étoiles et grains est fixé par le nom.

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function graine(texte) {
  let h = 2166136261;
  for (const c of String(texte)) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619); }
  return () => { h += 0x6d2b79f5; let t = h; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const r1 = (x) => Math.round(x * 10) / 10;

// couleurs : luminance et contraste (WCAG), mélange
const hex = (h) => { const m = String(h).replace('#', ''); return [0, 2, 4].map((i) => parseInt(m.slice(i, i + 2), 16)); };
const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const lum = (h) => { const [r, g, b] = hex(h); return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b); };
const contraste = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const melange = (a, b, t) => '#' + hex(a).map((v, i) => Math.round(v + (hex(b)[i] - v) * t).toString(16).padStart(2, '0')).join('');

function polices(u) {
  const sys = `-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI Variable Display', 'Segoe UI', Roboto, sans-serif`;
  const f = (n, repli) => (!n || /syst/i.test(n) ? sys : `'${String(n).replace(/'/g, '')}', ${repli}`);
  return { titre: f(u.polices?.titre, 'Georgia, serif'), texte: f(u.polices?.texte, 'system-ui, sans-serif') };
}

// ------------------------------------------------------------------------------------------------- photos
// Cinéma : la photo d'ouverture du site, par famille (comme cinema/js/rendu.js), en 1000 px.
const CINEMA = { esprit: 'soleil-rideaux', psy: 'fauteuil-bois', toucher: 'spa-salle', plantes: 'aromatiques', energie: 'tatami-porte', famille: 'chambre', beaute: 'salle-soin', mouvement: 'salle-doree', elan: 'escalier-clair', son: 'gong-salle', art: 'palette-papier' };
// Liquid Glass : une photo par palette, celle de la famille quand il y en a une (liquid-glass/js/photos.js).
const VERRE = {
  lagon: { _: 'lagon-lac', mouvement: 'lagon-vagues', toucher: 'lagon-vagues', elan: 'lagon-ciel', famille: 'lagon-hortensias', beaute: 'lagon-hortensias', esprit: 'lagon-lac', psy: 'lagon-lac' },
  prairie: { _: 'prairie-fougere', plantes: 'prairie-fougere', energie: 'prairie-fougere', esprit: 'prairie-the', elan: 'prairie-monstera', creation: 'prairie-monstera', psy: 'prairie-lac', mouvement: 'prairie-lac' },
  lavande: { _: 'lavande-ciel', plantes: 'lavande-champ', toucher: 'lavande-champ', esprit: 'lavande-ciel', psy: 'lavande-ciel', famille: 'lavande-glycine', beaute: 'lavande-glycine', creation: 'lavande-hortensia' },
  corail: { _: 'corail-aube', creation: 'corail-nuages', elan: 'corail-nuages', beaute: 'corail-pivoines', famille: 'corail-pivoines', toucher: 'corail-cerisier', esprit: 'corail-aube', energie: 'corail-aube' },
  soleil: { _: 'soleil-dunes', mouvement: 'soleil-dunes', toucher: 'soleil-dunes', elan: 'soleil-tournesols', famille: 'soleil-tournesols', energie: 'soleil-montagnes', plantes: 'soleil-feuilles' },
  minuit: { _: 'minuit-heure-bleue', esprit: 'minuit-voie-lactee', energie: 'minuit-voie-lactee', psy: 'minuit-heure-bleue', creation: 'minuit-lune', elan: 'minuit-etoiles' },
};
const famillePhoto = (vue) => {
  const f = vue.reco?.famille || 'esprit';
  if (f !== 'creation') return f;
  return /art|peint|dessin|argile|modelage|collage|sculpt/i.test([vue.d?.metier, vue.d?.accroche].join(' ')) ? 'art' : 'son';
};
// Chemins relatifs à accueil/accueil.css : une url() portée par une variable CSS se résout par rapport à la
// feuille qui l'utilise, quelle que soit la page.
function photoDe(u, palette, vue) {
  const r = '../';
  if (u.id === 'cinema') return `${r}cinema/images/${CINEMA[famillePhoto(vue)] || CINEMA.esprit}-1000.webp`;
  if (u.id === 'institut') return `${r}institut/images/creme-tourbillon-900.webp`;
  if (u.id === 'liquid-glass') { const t = VERRE[palette.id]; if (!t) return null; const f = vue.reco?.famille; return `${r}liquid-glass/images/${t[f] || t._}-m.webp`; }
  return null;
}

/** Variables CSS d'une affiche pour sa palette : posées au rendu, et reposées en direct quand la palette change. */
export function variablesAffiche(ligne, vue) {
  const c = ligne.palette.couleurs;
  const b = c.accent2 || c.accent;
  const clairFond = lum(c.fond) >= lum(c.encre);
  const v = {
    '--f': c.fond, '--e': c.encre, '--a': c.accent, '--b': b,
    '--cl': clairFond ? c.fond : c.encre, '--so': clairFond ? c.encre : c.fond,
    // Pop : la deuxième couleur du dégradé, assez franche, mais où le nom (encre) reste lisible
    '--p2': contraste(c.encre, c.accent) >= 3 ? c.accent : melange(c.accent, c.fond, contraste(c.encre, melange(c.accent, c.fond, 0.4)) >= 3 ? 0.4 : 0.65),
    // Pop : la vague du bas, une troisième nuance (accent 2 s'il diffère du fond, sinon l'accent éclairci)
    '--p3': b.toLowerCase() !== c.fond.toLowerCase() ? b : melange(c.accent, '#ffffff', 0.35),
  };
  const photo = photoDe(ligne.univers, ligne.palette, vue);
  if (photo) v['--photo'] = `url("${photo}")`;
  return v;
}

// Le nom en mots, avec la mise en forme propre à l'univers.
const motsDe = (nom) => String(nom).split(/\s+/).filter(Boolean);
const enMots = (mots, f = (m) => esc(m)) => mots.map((m, i) => `<span class="w w${i + 1}">${f(m, i)}</span>`).join(' ');
const photo = (classe = '') => `<span class="a-photo ${classe}"></span>`;

let VAGUE = 'M0 30';
for (let x = 0; x <= 1600; x += 20) VAGUE += 'L' + x + ' ' + r1(30 - Math.sin((x / 400) * Math.PI * 2) * 14);
VAGUE += 'V60H0Z';
const TEL = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 3.5l2.6 3.2-1.6 2.4a12 12 0 0 0 7.3 7.3l2.4-1.6 3.2 2.6-1.4 3a3 3 0 0 1-3.1 1.6C9.7 21 3 14.3 2 7.9a3 3 0 0 1 1.6-3.1z"/></svg>';
const AGENDA = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>';

// ------------------------------------------------------------------------------------------------- motifs

const MOTIFS = {
  nature(ctx) {
    const { rnd, mots, sous, mini } = ctx;
    const brins = [];
    const n = mini ? 46 : 120;
    for (let k = 0; k < n; k++) {
      const x = rnd() * 420 - 10, h = 40 + rnd() * 95 * (0.6 + 0.4 * Math.sin((x / 420) * Math.PI)), b = (rnd() - 0.5) * 34, w = 1.6 + rnd() * 2.6;
      const couche = k % 3;
      brins.push([couche, `<path class="c${couche}" d="M${r1(x - w / 2)} 142Q${r1(x + b * 0.35)} ${r1(142 - h * 0.55)} ${r1(x + b)} ${r1(142 - h)}Q${r1(x + b * 0.35 + w * 0.3)} ${r1(142 - h * 0.55)} ${r1(x + w / 2)} 142Z"/>`]);
    }
    const fleurs = [];
    const nf = mini ? 4 : 11;
    for (let k = 0; k < nf; k++) {
      const x = 20 + rnd() * 380, y = 62 + rnd() * 50, s = 0.7 + rnd() * 0.6, marguerite = rnd() > 0.35;
      const petales = marguerite ? Array.from({ length: 9 }, (_, j) => `<ellipse rx="1.6" ry="4.4" transform="rotate(${j * 40}) translate(0 -4.2)"/>`).join('') : '';
      fleurs.push(`<g class="${marguerite ? 'marguerite' : 'bouton'}" transform="translate(${r1(x)} ${r1(y)}) scale(${r1(s)})"><path class="tige" d="M0 0q${r1((rnd() - 0.5) * 6)} 30 0 ${r1(150 - y)}"/>${petales}<circle r="${marguerite ? 2.4 : 3.6}"/></g>`);
    }
    const couche = (c) => brins.filter(([k]) => k === c).map(([, p]) => p).join('');
    return `<div class="n-ciel"></div>
      <p class="a-nom n-nom">${enMots(mots, (m, i) => (i === mots.length - 1 && mots.length > 1 ? `<em>${esc(m)}</em>` : esc(m)))}</p>
      ${sous}
      <svg class="n-herbe" viewBox="0 0 400 142" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><g class="g0">${couche(0)}</g><g class="fleurs">${fleurs.join('')}</g><g class="g1">${couche(1)}</g><g class="g2">${couche(2)}</g></svg>`;
  },

  'aurora-nuit'(ctx) {
    const { rnd, mots, sous, mini } = ctx;
    const etoiles = Array.from({ length: mini ? 24 : 60 }, () => {
      const t = rnd() < 0.15 ? 1.6 : rnd() < 0.5 ? 1.1 : 0.7;
      return `radial-gradient(${t}px ${t}px at ${r1(rnd() * 100)}% ${r1(rnd() * 72)}%, rgba(255,255,255,${r1(0.5 + rnd() * 0.5)}) 50%, transparent 100%)`;
    }).join(',');
    const pts = Array.from({ length: 6 }, (_, k) => [r1(12 + k * 15 + rnd() * 8), r1(14 + rnd() * 22)]);
    return `<div class="au-etoiles" style="background-image:${etoiles}"></div>
      <div class="au-rideau r1"></div><div class="au-rideau r2"></div><div class="au-rideau r3"></div>
      <svg class="au-constellation" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><polyline points="${pts.map((p) => p.join(',')).join(' ')}"/>${pts.map(([x, y], k) => `<circle cx="${x}" cy="${y}" r="${k % 2 ? 0.7 : 1}" style="--k:${k}"/>`).join('')}</svg>
      <p class="a-nom au-nom">${enMots(mots, (m, i) => (i % 2 ? `<em>${esc(m)}</em>` : esc(m)))}</p>
      ${sous}`;
  },

  editorial(ctx) {
    const { mots, vue, mini, ligne } = ctx;
    const mot = ligne.raison?.type === 'mots' ? `« ${ligne.raison.mot} »` : '';
    return `${mini ? '' : `<p class="ed-haut"><span>${esc(vue.saison)}</span><span>${esc(vue.ville || '')}</span></p>`}
      <p class="a-nom ed-nom">${enMots(mots)}</p>
      <span class="ed-pierre"></span>
      ${mini ? '' : `<p class="ed-lignes"><span>${esc(vue.metier)}</span>${mot ? `<span class="ed-mot">${esc(mot)}</span>` : ''}</p><span class="ed-code"></span>`}`;
  },

  cinema(ctx) {
    // sa photo d'ouverture étalonnée dans la palette, entre deux bandes noires 2,39:1 qui s'écartent, un carton de
    // générique : initiales dans un double filet, nom en italique centré
    const { mots, vue, mini, init } = ctx;
    return `<div class="ci-image">${photo('ci-photo')}<div class="ci-teinte"></div><div class="ci-lumiere"></div><div class="ci-grain"></div></div>
      <div class="ci-carton">${mini ? '' : `<span class="ci-mono"><span>${init}</span></span>`}<p class="a-nom ci-nom">${enMots(mots)}</p></div>
      <div class="ci-bande haut"></div><div class="ci-bande bas"></div>
      ${mini ? '' : `<p class="ci-credits"><span>${esc(vue.metier)}</span><span>${esc(vue.ville || 'Sur rendez-vous')}</span></p>`}`;
  },

  'liquid-glass'(ctx) {
    // un écran verrouillé : grande photo de la palette, le prénom en lettres de verre, une notification, deux capsules
    const { vue, mini, init, prenomOuNom, mots } = ctx;
    // le prénom ; sans prénom, le premier mot de l'enseigne (« Cornouaille »), comme sur le site
    const verre = vue.salut?.avecPrenom ? prenomOuNom : mots[0];
    const ligne2 = [vue.nomPoster !== prenomOuNom ? vue.nomPoster : '', vue.ville].filter(Boolean).join(', ') || 'Sur rendez-vous';
    return `<div class="lg-fond"><i></i><i></i></div>${photo('lg-photo')}<span class="lg-voile"></span>
      ${mini ? '' : `<p class="lg-date">${esc(vue.metier || '')}</p>`}
      <p class="a-nom lg-verre" style="--lv:${Math.max(4, verre.length)}">${esc(verre)}</p>
      ${mini ? '' : `<div class="lg-notif"><span class="lg-app">${init}</span><span class="lg-texte"><b>Prendre rendez-vous</b><span>${esc(ligne2)}</span></span><span class="lg-quand">maintenant</span></div>
      <div class="lg-capsules"><span>${TEL}Appeler</span><span>${AGENDA}Rendez-vous</span></div>`}`;
  },

  'pop-vitamine'(ctx) {
    // dégradé franc de gauche à droite, nom en capitales géantes et serrées au centre, pilule blanche, un pot à ses
    // initiales (le « produit » du site), vague de couleur en bas
    const { mots, mini, init, vue } = ctx;
    const pot = mini ? '' : `<div class="po-pot" aria-hidden="true"><span class="po-couvercle"></span><span class="po-corps"><b>${init}</b><small>${esc(vue.metier || '')}</small><i></i></span></div>`;
    return `<div class="po-fond"></div>
      <div class="po-centre"><p class="a-nom po-nom">${enMots(mots)}</p>${mini ? '' : '<span class="po-bouton">Réserver</span>'}</div>
      <svg class="po-vague" viewBox="0 0 1600 60" preserveAspectRatio="none" aria-hidden="true"><path d="${VAGUE}"/></svg>${pot}`;
  },

  immersion(ctx) {
    // nuit profonde, cristal en filets clairs à droite, reflet inversé sous une ligne d'horizon lumineuse, prénom à gauche
    const { sous, prenomOuNom, rnd, mini } = ctx;
    const cristal = `<path class="eclat" d="M50 6L74 30V108L50 150L26 108V30Z"/><path class="face" d="M50 6L62 34V106L50 150Z"/><path class="arete" d="M50 6L74 30V108L50 150L26 108V30ZM50 6L38 34V106L50 150L62 106V34ZM26 30L38 34M74 30L62 34M38 106L26 108M62 106L74 108M38 34H62M38 106H62"/>`;
    const poussieres = mini ? '' : `<svg class="im-poussiere" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${Array.from({ length: 26 }, (_, k) => `<circle style="--k:${k}" cx="${r1(rnd() * 100)}" cy="${r1(rnd() * 60)}" r="${r1(0.15 + rnd() * 0.35)}"/>`).join('')}</svg>`;
    return `<div class="im-halo"></div>${poussieres}
      <svg class="im-cristal" viewBox="0 0 100 160" aria-hidden="true">${cristal}</svg>
      <svg class="im-reflet" viewBox="0 0 100 160" aria-hidden="true">${cristal}</svg>
      <span class="im-horizon"></span>
      <div class="im-eau"><i></i><i></i></div>
      <p class="a-nom im-nom" style="--li:${Math.max(4, ...motsDe(prenomOuNom).map((m) => m.length))}"><em>${esc(prenomOuNom)}</em></p>
      ${sous}`;
  },

  meridiens(ctx) {
    // une paire de pieds vus par la plante, tracés d'un fil d'or, des lignes de lumière du talon aux orteils
    const { mots, sous } = ctx;
    const plante = 'M52 250C36 250 26 238 26 218C26 196 30 178 30 160C30 138 24 118 24 96C24 70 38 52 58 50C78 48 88 60 86 82C84 102 72 116 70 136C68 156 76 176 76 202C76 232 68 250 52 250Z';
    const orteils = [[72, 34, 9, 12], [56, 28, 6, 8], [44, 30, 5.5, 7], [34, 36, 5, 6.5], [26, 45, 4.5, 5.5]];
    const lignes = orteils.map(([x, y], k) => `<path class="lumiere" style="--k:${k}" d="M52 236C${50 + (x - 52) * 0.2} 180 ${48 + (x - 50) * 0.7} 120 ${x} ${y + 14}"/>`).join('');
    const points = orteils.map(([x, y], k) => `<circle class="point" style="--k:${k}" cx="${x}" cy="${y + 14}" r="1.5"/>`).join('');
    const pied = `<path class="contour" d="${plante}"/>${orteils.map(([x, y, rx, ry]) => `<ellipse class="contour" cx="${x}" cy="${y}" rx="${rx}" ry="${ry}"/>`).join('')}${lignes}${points}<circle class="point talon" cx="52" cy="236" r="2"/>`;
    return `<svg class="me-pieds" viewBox="0 0 220 260" aria-hidden="true"><g>${pied}</g><g transform="translate(220 0) scale(-1 1)">${pied}</g></svg>
      <p class="a-nom me-nom">${enMots(mots, (m, i) => (i === 0 && mots.length > 1 ? esc(m) : `<em>${esc(m)}</em>`))}</p>
      ${sous}`;
  },

  cocon(ctx) {
    // un mobile de berceau : anneau de bois, lune de feutre miel, nuages, étoiles de papier plié, ombres sur le mur
    const { mots, sous, mini } = ctx;
    const etoile = (cx, cy, r) => {
      const pts = Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r; return [r1(cx + rr * Math.cos(a)), r1(cy + rr * Math.sin(a))]; });
      return pts.map((p, i) => { const q = pts[(i + 1) % 10]; return `<path class="${i % 2 ? 'pli-a' : 'pli-b'}" d="M${cx} ${cy}L${p[0]} ${p[1]}L${q[0]} ${q[1]}Z"/>`; }).join('');
    };
    const nuage = (x, y, s) => `<path class="nuage" d="M${r1(x - 9 * s)} ${r1(y + 3 * s)}a${r1(5 * s)} ${r1(5 * s)} 0 0 1 ${r1(2 * s)} ${r1(-8 * s)}a${r1(6.5 * s)} ${r1(6.5 * s)} 0 0 1 ${r1(12 * s)} ${r1(-2 * s)}a${r1(5 * s)} ${r1(5 * s)} 0 0 1 ${r1(7 * s)} ${r1(7 * s)}a${r1(3.5 * s)} ${r1(3.5 * s)} 0 0 1 ${r1(-1 * s)} ${r1(3 * s)}Z"/>`;
    const objets = [
      { x: 30, y: 46, fil: 14, dessin: `<path class="lune" d="M30 38a9 9 0 1 0 8 13a7.5 7.5 0 1 1 -8 -13Z"/>` },
      { x: 50, y: 38, fil: 18, dessin: nuage(50, 38, 0.9) },
      { x: 70, y: 48, fil: 16, dessin: etoile(70, 48, 6.5) },
      ...(mini ? [] : [{ x: 41, y: 60, fil: 20, dessin: etoile(41, 60, 4.5) }, { x: 61, y: 62, fil: 22, dessin: nuage(61, 62, 0.6) }]),
    ];
    const pendus = objets.map((o, k) => `<g class="pendu" style="--k:${k};transform-origin:${o.x}px ${o.y - o.fil - 6}px"><line class="ficelle" x1="${o.x}" y1="${o.y - o.fil - 6}" x2="${o.x}" y2="${o.y - 7}"/>${o.dessin}</g>`).join('');
    return `<div class="co-mur"></div>
      <svg class="co-mobile" viewBox="0 0 100 80" aria-hidden="true">
        <g class="ombre">${pendus}<ellipse cx="50" cy="18" rx="24" ry="4.6"/></g>
        <line class="ficelle" x1="50" y1="0" x2="50" y2="14"/>
        <ellipse class="anneau" cx="50" cy="18" rx="24" ry="4.6"/>
        ${pendus}
      </svg>
      <p class="a-nom co-nom">${enMots(mots, (m, i) => (i === mots.length - 1 && mots.length > 1 ? `<span class="co-main">${esc(m)}</span>` : esc(m)))}</p>
      ${sous}`;
  },

  institut(ctx) {
    // gros plan d'une crème ivoire (sa photo, étalonnée dans la palette ; des stries dessinées dessous si elle
    // manque), initiales d'or posées comme une goutte d'huile, nom très fin
    const { rnd, mots, sous, init, mini } = ctx;
    const stries = Array.from({ length: mini ? 5 : 9 }, (_, k) => {
      const y = -10 + k * 16 + rnd() * 6, c1 = y + 20 + rnd() * 30, c2 = y - 15 + rnd() * 30;
      return `<path class="strie-o" d="M-20 ${r1(y + 3)}C30 ${r1(c1 + 3)} 70 ${r1(c2 + 3)} 120 ${r1(y + 12 + 3)}"/><path class="strie-l" d="M-20 ${r1(y)}C30 ${r1(c1)} 70 ${r1(c2)} 120 ${r1(y + 12)}"/>`;
    }).join('');
    return `<svg class="in-creme" viewBox="0 0 100 140" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${stries}</svg>
      ${photo('in-photo')}<span class="in-teinte"></span>
      <p class="in-or">${init}</p>
      <p class="a-nom in-nom">${enMots(mots)}</p>
      ${sous}`;
  },

  resonance(ctx) {
    // une plaque couverte de sable qui dessine une figure de Chladni : les lignes nodales sont trouvées par carrés
    // marchants, puis peintes en bandes d'un motif de grains (serré au cœur, épars au bord) ; nom étroit, onde d'or
    const { rnd, mots, sous, mini, taille } = ctx;
    const modes = [[1, 3], [2, 3], [1, 4], [2, 5], [3, 4], [1, 5]];
    const [n, m] = modes[Math.floor(rnd() * modes.length)];
    const f = (x, y) => Math.cos(n * Math.PI * x) * Math.cos(m * Math.PI * y) - Math.cos(m * Math.PI * x) * Math.cos(n * Math.PI * y);
    const G = mini ? 28 : 44, v = [];
    for (let j = 0; j <= G; j++) for (let i = 0; i <= G; i++) v.push(f(i / G, j / G));
    const val = (i, j) => v[j * (G + 1) + i];
    const zero = (i, j, a, b) => { const p = val(i, j), q = val(i + a, j + b), t = p / (p - q); return [r1(((i + a * t) / G) * 100), r1(((j + b * t) / G) * 100)]; };
    let d = '';
    for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) {
      const pts = [];
      if ((val(i, j) > 0) !== (val(i + 1, j) > 0)) pts.push(zero(i, j, 1, 0));
      if ((val(i + 1, j) > 0) !== (val(i + 1, j + 1) > 0)) pts.push(zero(i + 1, j, 0, 1));
      if ((val(i, j + 1) > 0) !== (val(i + 1, j + 1) > 0)) pts.push(zero(i, j + 1, 1, 0));
      if ((val(i, j) > 0) !== (val(i, j + 1) > 0)) pts.push(zero(i, j, 0, 1));
      for (let k = 0; k + 1 < pts.length; k += 2) d += `M${pts[k][0]} ${pts[k][1]}L${pts[k + 1][0]} ${pts[k + 1][1]}`;
    }
    // deux tuiles de grains, en unités de la plaque : serrée pour le cœur des bandes, clairsemée pour leurs bords
    const tuile = (nb) => Array.from({ length: nb }, () => `M${r1(rnd() * 8)} ${r1(rnd() * 8)}h.01`).join('');
    const id = `re${taille[0]}${Math.floor(rnd() * 1e8).toString(36)}`;
    return `<div class="re-plaque"><svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><pattern id="${id}d" width="8" height="8" patternUnits="userSpaceOnUse"><path class="grains" d="${tuile(mini ? 70 : 120)}"/></pattern><pattern id="${id}c" width="8" height="8" patternUnits="userSpaceOnUse"><path class="grains" d="${tuile(mini ? 16 : 22)}"/></pattern><path id="${id}" d="${d}"/></defs><use class="bande-large" href="#${id}" stroke="url(#${id}c)"/><use class="bande" href="#${id}" stroke="url(#${id}d)"/></svg></div>
      ${sous}
      <p class="a-nom re-nom">${enMots(mots)}</p>`;
  },
};

function generique(ctx) {
  return `<span class="ge-disque"></span><p class="a-nom ge-nom">${enMots(ctx.mots)}</p>${ctx.sous}`;
}

/**
 * L'affiche d'un univers pour une ligne du classement.
 * @param {object} ligne  { univers, palette, accord }
 * @param {object} vue    sortie de preparer() (nom, métier, ville, saison, racine des fichiers...)
 * @param {{taille?: 'grande'|'moyenne'|'petite'|'mini'}} o
 */
export function affiche(ligne, vue, { taille = 'moyenne' } = {}) {
  const u = ligne.univers;
  const nom = vue.nomPoster;
  const mots = motsDe(nom);
  const L = Math.max(...mots.map((m) => m.length), 3);
  const mini = taille === 'mini';
  const P = polices(u);
  const sousTexte = [vue.metier, vue.ville].filter(Boolean).join(', ');
  const sous = mini || !sousTexte ? '' : `<p class="a-sous">${esc(sousTexte)}</p>`;
  const init = esc((vue.d.initiales || mots.map((m) => m[0]).join('')).slice(0, 2).toUpperCase());
  const prenomOuNom = vue.salut?.avecPrenom ? vue.salut.nom : nom;
  const ctx = { rnd: graine(nom + u.id + taille), mots, vue, sous, mini, ligne, init, prenomOuNom, taille };
  const motif = MOTIFS[u.motif || u.id] ? (u.motif || u.id) : null;
  const corps = motif ? MOTIFS[motif](ctx) : generique(ctx);
  const gris = vue.reco?.gouts?.teinte && ligne.accord === 'gris' ? ' affiche-grise' : '';
  const Lp = Math.max(3, prenomOuNom.length);
  const couleurs = Object.entries(variablesAffiche(ligne, vue)).map(([k, v]) => `${k}:${v}`).join(';');
  const style = `${couleurs};--pt:${P.titre};--px:${P.texte};--L:${L};--Lp:${Lp};--n:${mots.length};--T:${nom.length}`;
  return `<div class="affiche m-${esc(motif || 'generique')} t-${taille}${gris}" data-ton="${esc(ligne.palette.ton || 'clair')}" style="${esc(style)}" aria-hidden="true">${corps}</div>`;
}

/** Les mots fixes écrits dans les affiches, pour réduire les polices des univers aux seuls caractères utiles. */
export const MOTS_AFFICHES = 'Prendre rendez-vous Rendez-vous Appeler maintenant Réserver Sur rendez-vous';
