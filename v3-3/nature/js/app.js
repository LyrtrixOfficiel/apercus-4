// Nature : fiche (?p=<dossier>), palette (?palette=<id>), chargement (une graine qui germe),
// puis la prairie, les pollens, l'herbier qu'on feuillette, le sentier de la seance.
// Mouvement reduit : tout reste vivant mais plus lent et plus court ; ce que pilote le
// visiteur (souris, doigt, defilement) marche exactement pareil dans les deux modes.
import { rendre, titre, description, aLEndroit, dessinsDifferes } from './rendu.js';
import { demarrerPrairie, prairieFixe } from './prairie.js';
import { demarrerPollens } from './pollens.js';
import { graine, hasard } from './botanique.js';
import { PALETTES, parId, choisirPalette } from './univers.js';
import { APERCU, apercuPret, duree, filet } from '../../commun/apercu.js';

const html = document.documentElement;
const reduit = html.classList.contains('reduit');
const tactile = matchMedia('(hover: none), (pointer: coarse)').matches;
const petit = tactile || Math.min(innerWidth, innerHeight) < 640;
const site = document.getElementById('site');
const q = new URLSearchParams(location.search);
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const borne = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

// 1. La fiche et la palette
let fiche = null;
const demande = q.get('p');
if (demande && /^[a-z0-9-]{2,120}$/.test(demande) && demande !== site.dataset.p) {
  try {
    const brut = await (window.__ficheTot || fetch(`../donnees/${demande}.json`).then((r) => (r.ok ? r.json() : null)));
    if (brut) {
      fiche = aLEndroit(brut);
      site.innerHTML = rendre(fiche); site.dataset.p = fiche.dossier || demande;
      document.title = titre(fiche);
      $('meta[name="description"]')?.setAttribute('content', description(fiche));
      const ini = $('#graine-initiales'); if (ini) ini.textContent = fiche.initiales || '';
    }
  } catch (e) { console.warn('fiche introuvable, page par defaut', e); }
}
html.classList.remove('attente-fiche');
const palette = parId(q.get('palette')) || (fiche ? choisirPalette(fiche) : parId(html.dataset.paletteFiche)) || PALETTES[0];
html.dataset.palette = palette.id;
$('meta[name="theme-color"]')?.setAttribute('content', palette.css['theme-color']);
window.__nature = { palette: palette.id };

const accueil = $('#accueil'), nom = $('#nom');
const sel = graine(site.dataset.p || 'prairie');

// 2. Le nom pousse lettre a lettre ; les titres apparaissent mot a mot, comme une respiration
if (nom) {
  nom.setAttribute('aria-label', nom.textContent.replace(/\s+/g, ' ').trim());
  let i = 0;
  for (const mot of $$('.mot', nom)) { mot.setAttribute('aria-hidden', 'true'); mot.innerHTML = [...mot.textContent].map((c) => `<span class="l" style="--i:${i++}">${c}</span>`).join(''); }
}
for (const h of $$('[data-respire]')) {
  const texte = h.textContent.replace(/\s+/g, ' ').trim(); h.setAttribute('aria-label', texte);
  h.innerHTML = '<span aria-hidden="true">' + texte.split(' ').map((m, k) => `<span class="mot" style="--m:${k}">${m.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</span>`).join(' ') + '</span>';
}
for (const p of $$('[data-mots]')) p.innerHTML = p.innerHTML.split(/(\s+)/).map((m) => /^\s+$/.test(m) || !m ? m : `<span class="w">${m}</span>`).join('');
for (const s of ['.corps-texte p', '.herbier', '.sachets-place', '.arche', '.apropos-texte > p', '.citation', '.contact-rdv', '.tel-geant', '.contact-liens', '.carnet > div', '.note']) {
  $$(s).forEach((e, i) => { e.classList.add('revele'); e.style.setProperty('--d', (i % 4) * 80 + 'ms'); });
}
const vigie = new IntersectionObserver((es) => {
  for (const e of es) if (e.isIntersecting) { e.target.classList.add('vu'); vigie.unobserve(e.target); }
}, { rootMargin: '0px 0px -10% 0px', threshold: .12 });
$$('[data-respire], .revele, .dessin').forEach((e) => vigie.observe(e));

// 3. Les prairies : une a l'accueil, une seconde (creee quand on y arrive) au pied du contact.
const places = { accueil: $('.prairie-place[data-place="accueil"]'), contact: $('.prairie-place[data-place="contact"]') };
const horizonAccueil = () => { const a = accueil.getBoundingClientRect(), p = places.accueil.getBoundingClientRect(); return borne((p.top - a.top) / a.height + .015, .45, .8); };
const brume = $('.brume');
const poserHorizon = (h) => brume && brume.style.setProperty('--horizon', (h * 100).toFixed(2) + '%');
function creerChamp(parent, devant, horizon, graineChamp) {
  const toile = document.createElement('canvas');
  toile.className = 'prairie'; toile.setAttribute('aria-hidden', 'true');
  devant ? parent.prepend(toile) : parent.appendChild(toile);
  const prairie = demarrerPrairie(toile, { petit, seed: graineChamp, palette });
  const champ = { toile, prairie, horizon, onde: [0, 0, 99, 0], debut: 0, r: null, trace: new Float32Array(32) };
  if (prairie) {
    html.classList.add('gl'); prairie.taille(horizon());
    // si les nuanceurs echouent (rare), une prairie fixe dessinee en 2D prend la place
    toile.addEventListener('prairie-echec', () => { const t2 = toile.cloneNode(); toile.replaceWith(t2); champ.toile = t2; champ.prairie = null; prairieFixe(t2, horizon(), graineChamp, palette); }, { once: true });
  } else prairieFixe(toile, horizon(), graineChamp, palette);
  return champ;
}
const champs = { accueil: creerChamp(accueil, true, horizonAccueil, sel) };
poserHorizon(horizonAccueil());
const visibles = new Set(['accueil']);
const vigieChamps = new IntersectionObserver((es) => {
  for (const e of es) {
    const k = e.target === accueil ? 'accueil' : 'contact';
    if (e.isIntersecting) { visibles.add(k); if (k === 'contact' && !champs.contact) { const c = champs.contact = creerChamp(places.contact, false, () => .3, sel + 1); c.debut = performance.now(); c.prairie?.pret?.().then(() => { c.debut = performance.now(); }); } }
    else visibles.delete(k);
  }
}, { rootMargin: '200px 0px' });
vigieChamps.observe(accueil);
if (places.contact) vigieChamps.observe(places.contact);

// 4. Le chargement : la graine germe, puis s'efface quand le vrai rendu est pret
// (polices, shaders compiles, premiere image). Au plus 2,5 s ; un toucher le passe.
const voile = $('#graine');
let eveille = false;
function eveil() {
  if (eveille) return; eveille = true;
  voile?.classList.add('partie');
  champs.accueil.debut = performance.now();
  requestAnimationFrame(() => { accueil.classList.add('eveil'); apercuPret('nature'); dispatchEvent(new Event('kazura-ouvert')); });
}
filet('nature');
// les planches suivantes, la fleur des sachets et la liane se dessinent une fois la page ouverte
let dessins = false;
const dessiner = () => { if (dessins) return; dessins = true; setTimeout(() => dessinsDifferes(document), 300); };
addEventListener('kazura-ouvert', dessiner, { once: true });
setTimeout(dessiner, 3200);
const minimum = APERCU ? 650 : reduit ? 1150 : 2050; // le temps de voir les initiales et la pousse en entier (racines, tige, feuilles, rosee)
// La feuille des polices se charge sans bloquer la page : on attend qu'elle arrive, puis les fontes du nom.
const feuillePolices = new Promise((ok) => {
  const l = $('link[href*="fonts.googleapis.com/css2"]');
  if (!l || l.sheet) return ok();
  l.addEventListener('load', ok); l.addEventListener('error', ok);
}).then(() => Promise.all([document.fonts?.load('italic 330 64px Fraunces'), document.fonts?.load('330 64px Fraunces'), document.fonts?.load('400 16px Figtree')]).catch(() => {}));
const polices = Promise.race([feuillePolices, new Promise((r) => setTimeout(r, duree(1900, 0.75)))]);
Promise.all([polices, champs.accueil.prairie?.pret?.()]).then(() => setTimeout(eveil, Math.max(0, minimum - performance.now())));
setTimeout(eveil, Math.max(0, (APERCU ? 720 : 2500) - performance.now()));
voile?.addEventListener('pointerdown', eveil);
addEventListener('keydown', eveil, { once: true });

// 5. La main dans les herbes : la ou elle passe, les brins s'ecartent ; derriere elle, un sillage
// qui se referme en douceur. Souris (simple survol) et doigt, dans les deux modes de mouvement.
const main = { x: -999, y: -999, actif: false, force: 0, vu: 0 };
const sillage = [];
const souffles = [];
const viser = (e) => { main.x = e.clientX; main.y = e.clientY; main.actif = true; main.vu = performance.now(); };
addEventListener('pointermove', viser, { passive: true });
addEventListener('pointerdown', (e) => {
  viser(e);
  if (e.target.closest('a, button, .planche, .graine')) return;
  for (const c of Object.values(champs)) {
    if (!c || !c.prairie) continue;
    const r = c.toile.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 2 - 1, y = 1 - ((e.clientY - r.top) / r.height) * 2;
    if (e.clientY > r.top && e.clientY < r.bottom && y < (1 - 2 * c.prairie.horizon) + .1) { c.onde[0] = x; c.onde[1] = y; c.onde[2] = 0; c.onde[3] = 1; souffles.push({ x: e.clientX, y: e.clientY }); }
  }
}, { passive: true });
addEventListener('pointerout', (e) => { if (!e.relatedTarget) main.actif = false; });
addEventListener('blur', () => { main.actif = false; });
window.__nature.main = main;

// 6. Pollens (ou lucioles)
const pollens = demarrerPollens($('#pollens'), { petit, reduit, palette });

// 7. Ombres de feuillage, dessinees une fois en code
(function feuillage() {
  if (+palette.css['ombre-force'] === 0) return;
  const S = 720, c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d'), r = hasard(sel + 7), flou = 'filter' in g;
  if (flou) g.filter = 'blur(4px)';
  g.fillStyle = palette.css.ombre;
  for (let b = 0; b < 11; b++) {
    let x = r() * S, y = -20, a = Math.PI / 2 + (r() - .5) * 1.2;
    for (let k = 0; k < 30; k++) {
      x += Math.cos(a) * 14; y += Math.sin(a) * 14; a += (r() - .5) * .4;
      for (const s of [-1, 1]) {
        if (r() < .25) continue;
        const la = a + s * (.6 + r() * .6), L = 14 + r() * 20;
        g.save(); g.translate(x, y); g.rotate(la); g.beginPath(); g.moveTo(0, 0);
        g.quadraticCurveTo(L * .5, -L * .3, L, 0); g.quadraticCurveTo(L * .5, L * .3, 0, 0); g.fill(); g.restore();
      }
      if (y > S * .75) break;
    }
  }
  c.toBlob((blob) => {
    if (!blob) return;
    const boite = $('#feuillage');
    boite.style.setProperty('--ombre-img', `url(${URL.createObjectURL(blob)})`);
    if (!flou) boite.classList.add('flou-css');
    boite.classList.add('pret');
  }, 'image/png');
})();

// 8. L'herbier : on tourne les planches (bouton, clic, glisser a la souris ou au doigt)
(function herbier() {
  const boite = $('[data-herbier]'), liste = boite && $('.planches', boite);
  const planches = liste ? [...liste.children] : [];
  if (planches.length < 2) return;
  boite.classList.add('pret');
  const ordre = planches.map((_, i) => i);
  const poser = () => ordre.forEach((idx, pos) => { planches[idx].style.setProperty('--pos', pos); planches[idx].dataset.pos = pos; });
  poser();
  boite.insertAdjacentHTML('beforeend', `<div class="herbier-gestes"><button class="tourner" type="button"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 13c1.6-5 7.4-7.4 12-4.6"/><path d="M15.4 4.6 17 8.6l-4 1.4"/><path d="M20 11c-.4 4.6-4.4 8-9 7.4"/></svg>Tourner la planche</button><p class="herbier-aide" aria-hidden="true">ou faites-la glisser</p></div>`);
  let occupe = false;
  function tourner(sens = -1) {
    if (occupe) return; occupe = true;
    const dessus = planches[ordre[0]];
    dessus.classList.remove('tenue'); dessus.classList.add('envol');
    dessus.style.transform = `translate3d(${sens * 112}%, 3%, 0) rotate(${sens * 12}deg)`;
    setTimeout(() => {
      ordre.push(ordre.shift());
      dessus.classList.remove('envol'); dessus.style.transform = '';
      poser();
      setTimeout(() => { occupe = false; }, reduit ? 120 : 260);
    }, reduit ? 330 : 520);
  }
  $('.tourner', boite).addEventListener('click', () => tourner(-1));
  let tenu = null;
  liste.addEventListener('pointerdown', (e) => {
    const p = e.target.closest('.planche'); if (!p || p.dataset.pos !== '0' || occupe) return;
    tenu = { p, x0: e.clientX, y0: e.clientY, dx: 0, t0: performance.now(), id: e.pointerId, bouge: false, rot: parseFloat(p.style.getPropertyValue('--rot')) || 0 };
  });
  addEventListener('pointermove', (e) => {
    if (!tenu || e.pointerId !== tenu.id) return;
    tenu.dx = e.clientX - tenu.x0; const dy = e.clientY - tenu.y0;
    if (!tenu.bouge && Math.abs(tenu.dx) > 8 && Math.abs(tenu.dx) > Math.abs(dy)) { tenu.bouge = true; tenu.p.classList.add('tenue'); try { tenu.p.setPointerCapture(e.pointerId); } catch {} }
    if (tenu.bouge) tenu.p.style.transform = `translate3d(${tenu.dx}px, ${Math.abs(tenu.dx) * .05}px, 0) rotate(${tenu.rot + tenu.dx * .025}deg)`;
  }, { passive: true });
  const lacher = (e, annule) => {
    if (!tenu || e.pointerId !== tenu.id) return;
    const { p, dx, t0, bouge } = tenu; tenu = null;
    if (!bouge) { if (!annule) tourner(-1); return; }
    const v = dx / Math.max(1, performance.now() - t0);
    if (!annule && (Math.abs(dx) > p.offsetWidth * .26 || Math.abs(v) > .55)) tourner(Math.sign(dx) || -1);
    else { p.classList.remove('tenue'); p.style.transform = ''; } // retour en ressort (transition CSS)
  };
  addEventListener('pointerup', (e) => lacher(e, false));
  addEventListener('pointercancel', (e) => lacher(e, true));
})();

// 9. Le sentier de la seance, trace a la vraie place des haltes
const sentier = $('[data-sentier]'), haltes = sentier ? $$('.halte', sentier) : [];
let yHaltes = [], hSentier = 1;
function tracerSentier() {
  if (!sentier || !haltes.length) return;
  const svg = $('.sentier-trace', sentier), B = sentier.getBoundingClientRect();
  const W = Math.round(B.width), H = Math.round(sentier.offsetHeight); hSentier = H;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('width', W); svg.setAttribute('height', H);
  const pts = haltes.map((h) => { const s = $('.halte-pierre', h).getBoundingClientRect(); return [s.left - B.left + s.width / 2, s.top - B.top + s.height / 2]; });
  yHaltes = pts.map((p) => p[1]);
  const etroit = W < 700, r = hasard(sel + 3);
  const tous = [[pts[0][0], -40], ...pts, [pts[pts.length - 1][0] + (etroit ? 0 : (pts[pts.length - 1][0] < W / 2 ? 120 : -120)), H + 30]];
  let d = `M${tous[0][0].toFixed(1)} ${tous[0][1].toFixed(1)}`;
  for (let i = 1; i < tous.length; i++) {
    const [x1, y1] = tous[i - 1], [x2, y2] = tous[i], dy = y2 - y1, w = etroit ? (i % 2 ? 20 : -20) : 0;
    d += `C${(x1 + w).toFixed(1)} ${(y1 + dy * .5).toFixed(1)} ${(x2 + w).toFixed(1)} ${(y2 - dy * .5).toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`;
  }
  // Le chemin n'est plus un ruban : c'est une ligne invisible le long de laquelle on pose des pierres plates,
  // un pas japonais, au trait et au lavis comme les planches ; de l'herbe et quelques pâquerettes entre les pierres.
  const chemin = $('.sentier-chemin', svg);
  chemin.setAttribute('d', d);
  const L = chemin.getTotalLength();
  const herbes = ['', ''];
  let pas = '', ombre = '', fleurs = '', coeurs = '', portees = '', reflets = '', grain = '';
  const f1 = (n) => n.toFixed(1);
  const pres = (x, y, m) => pts.some(([hx, hy]) => Math.hypot(hx - x, hy - y) < m);
  const touffe = (x, y, c, n, hmax) => {
    for (let k = 0; k < n; k++) {
      const h = hmax * (.45 + r() * .55), o = (k / Math.max(1, n - 1) - .5) * 1.2 + c * .25 + (r() - .5) * .3, x0 = x + (k - n / 2) * 1.4;
      herbes[r() < .6 ? 0 : 1] += `M${f1(x0)} ${f1(y)}Q${f1(x0 + Math.sin(o) * h * .25)} ${f1(y - h * .6)} ${f1(x0 + Math.sin(o) * h)} ${f1(y - Math.cos(o) * h)}`;
    }
  };
  const ecart = etroit ? 34 : 64, cote0 = r() < .5 ? 1 : -1;
  let k = 0;
  for (let s = 26; s < L - 10; s += ecart * (.82 + r() * .36), k++) {
    const a = chemin.getPointAtLength(s), b = chemin.getPointAtLength(Math.min(L, s + 1)), ang = Math.atan2(b.y - a.y, b.x - a.x), nx = -Math.sin(ang), ny = Math.cos(ang);
    const decal = (k % 2 ? 1 : -1) * cote0 * (etroit ? 3 : 12) + (r() - .5) * 4;
    const cx = a.x + nx * decal, cy = a.y + ny * decal;
    if (pres(cx, cy, etroit ? 30 : 62) || cy < 4 || cy > H - 4) continue;
    // une pierre plate : un contour irrégulier vu un peu de biais, posée en travers du chemin
    const w = (etroit ? 24 : 50) * (.8 + r() * .4), h = w * (.48 + r() * .14), rot = ang + Math.PI / 2 + (r() - .5) * .5;
    // une vraie pierre plate : des pans un peu anguleux, une ombre portée douce, un reflet sur le bord éclairé
    const n = 7 + Math.floor(r() * 3), P = [], t0 = r() * 6;
    for (let i = 0; i < n; i++) { const t = t0 + (i + (r() - .5) * .5) / n * Math.PI * 2, kk = .78 + r() * .3; P.push([cx + Math.cos(rot) * Math.cos(t) * w / 2 * kk - Math.sin(rot) * Math.sin(t) * h / 2 * kk, cy + Math.sin(rot) * Math.cos(t) * w / 2 * kk + Math.cos(rot) * Math.sin(t) * h / 2 * kk]); }
    const contour = (dx, dy, k2) => { const Q = P.map(([x, y]) => [cx + (x - cx) * k2 + dx, cy + (y - cy) * k2 + dy]); let p = `M${f1((Q[0][0] + Q[n - 1][0]) / 2)} ${f1((Q[0][1] + Q[n - 1][1]) / 2)}`; for (let i = 0; i < n; i++) { const [x, y] = Q[i], [x2, y2] = Q[(i + 1) % n], u = .62; p += `L${f1(x + ((Q[(i - 1 + n) % n][0] + x) / 2 - x) * (1 - u))} ${f1(y + ((Q[(i - 1 + n) % n][1] + y) / 2 - y) * (1 - u))}Q${f1(x)} ${f1(y)} ${f1(x + ((x + x2) / 2 - x) * (1 - u))} ${f1(y + ((y + y2) / 2 - y) * (1 - u))}`; } return p + 'Z'; };
    portees += contour(2.2, 3.4, 1.04);
    pas += contour(0, 0, 1);
    // le reflet : un trait clair le long du bord haut gauche
    const haut = P.map((q, i) => [q, i]).sort((a, b) => (a[0][1] + a[0][0] * .3) - (b[0][1] + b[0][0] * .3)).slice(0, 2).map(([q]) => q);
    reflets += `M${f1(haut[0][0] + (cx - haut[0][0]) * .18)} ${f1(haut[0][1] + (cy - haut[0][1]) * .18)}L${f1(haut[1][0] + (cx - haut[1][0]) * .18)} ${f1(haut[1][1] + (cy - haut[1][1]) * .18)}`;
    for (let i = 0; i < 3; i++) { const px = cx + (r() - .5) * w * .5, py = cy + (r() - .5) * h * .4; grain += `M${f1(px)} ${f1(py)}h.6`; }
    // tailles d'ombre sous la pierre, côté bas droit, et une fissure parfois
    for (let i = 0; i < 3; i++) { const t = .15 + i * .14, x = cx + Math.cos(rot) * Math.cos(t * Math.PI * 2) * w / 2 * .82 - Math.sin(rot) * Math.sin(t * Math.PI * 2) * h / 2 * .82, y = cy + Math.sin(rot) * Math.cos(t * Math.PI * 2) * w / 2 * .82 + Math.cos(rot) * Math.sin(t * Math.PI * 2) * h / 2 * .82; ombre += `M${f1(x)} ${f1(y)}l${f1(-3 - r() * 2)} ${f1(-1)}`; }
    if (r() < .35) ombre += `M${f1(cx - w * .15)} ${f1(cy - h * .1)}l${f1(w * .12)} ${f1(h * .08)}l${f1(w * .08)} ${f1(-h * .05)}`;
    // de l'herbe qui pousse entre les pierres, parfois une pâquerette
    for (const c of [-1, 1]) {
      if (r() < .35) continue;
      const bx = cx + nx * c * (w * .5 + 3 + r() * 6), by = cy + ny * c * (h * .4) + 3;
      touffe(bx, by, c, 4 + Math.floor(r() * 5), etroit ? 13 : 24);
      if (r() < .22) {
        const fx = bx + c * (5 + r() * 6), fy = by - 4 - r() * 6, R = etroit ? 2.4 : 3.2;
        for (let i = 0; i < 7; i++) { const t = i / 7 * Math.PI * 2; fleurs += `M${f1(fx + Math.cos(t) * R * .9 - R * .38)} ${f1(fy + Math.sin(t) * R * .9)}a${f1(R * .38)} ${f1(R * .3)} 0 1 0 ${f1(R * .76)} 0a${f1(R * .38)} ${f1(R * .3)} 0 1 0 ${f1(-R * .76)} 0`; }
        coeurs += `M${f1(fx - R * .4)} ${f1(fy)}a${f1(R * .4)} ${f1(R * .4)} 0 1 0 ${f1(R * .8)} 0a${f1(R * .4)} ${f1(R * .4)} 0 1 0 ${f1(-R * .8)} 0`;
      }
    }
  }
  // autour de chaque halte, une touffe plus fournie
  for (const [hx, hy] of pts) { touffe(hx - (etroit ? 22 : 38), hy + 8, -1, 5, etroit ? 13 : 19); touffe(hx + (etroit ? 22 : 38), hy + 10, 1, 4, etroit ? 12 : 17); }
  const [hClaires, hFoncees] = $$('.sentier-herbes', svg);
  hClaires.setAttribute('d', herbes[0]); hFoncees.setAttribute('d', herbes[1]);
  $('.sentier-pas', svg).setAttribute('d', pas);
  $('.sentier-portee', svg).setAttribute('d', portees);
  $('.sentier-reflet', svg).setAttribute('d', reflets + grain);
  $('.sentier-ombre', svg).setAttribute('d', ombre);
  $('.sentier-fleurs', svg).setAttribute('d', fleurs);
  $('.sentier-coeurs', svg).setAttribute('d', coeurs);
}
tracerSentier();

// 10. Ce qui suit le defilement
const phares = $$('[data-mots]').map((p) => ({ p, mots: $$('.w', p) }));
const sections = $$('#accueil, .section, .pied');
const FONDS = { accueil: 'var(--fond)', approche: 'var(--fond)', seance: 'var(--fond2)', tarifs: 'var(--fond)', apropos: 'var(--fond3)', contact: 'var(--fond2)', pied: 'var(--fond2)' };
let fondActuel = '', progSentier = 0, progLisse = 0;
let aDefiler = 3;
addEventListener('scroll', () => { aDefiler = 2; }, { passive: true });
function defilement() { // lectures d'abord, ecritures ensuite
  const H = innerHeight;
  const lus = phares.map(({ p }) => p.getBoundingClientRect());
  const rs = sentier && sentier.getBoundingClientRect();
  let courante = 'accueil';
  for (const s of sections) { if (s.getBoundingClientRect().top < H * .5) courante = s.id || 'pied'; }
  phares.forEach(({ mots }, j) => {
    const r = lus[j], k = borne((H * .95 - r.top) / (r.height * .8 + H * .15));
    const n = Math.round(k * mots.length * 1.05);
    mots.forEach((m, i) => { const on = i < n; if (m._on !== on) { m._on = on; m.classList.toggle('lit', on); } });
  });
  if (rs) progSentier = borne((H * .72 - rs.top) / rs.height);
  if (courante !== fondActuel) { fondActuel = courante; document.body.style.setProperty('--fond-courant', FONDS[courante] || FONDS.accueil); }
}

// 11. La boucle : elle tourne dans les deux modes (en mouvement reduit, le vent est plus doux et plus lent)
// ?gel (essais seulement) : le vent s'arrete et les pollens se cachent, pour mesurer l'effet de la main seule.
const gel = q.has('gel');
if (gel) $('#pollens').style.display = 'none';
const tempo = gel ? 0 : reduit ? .55 : 1, doux = reduit ? .5 : 1;
let precedent = 0, vent = 1, dernierY = scrollY, temps = 0;
const etat = { vent: 1, doux, pousse: 0, trace: null, onde: [0, 0, 99, 0], dolly: 0 };
function remplirTrace(c, r) {
  const T = c.trace, R = petit ? .3 : .22; T.fill(0);
  const ndc = (x, y) => [((x - r.left) / r.width) * 2 - 1, 1 - ((y - r.top) / r.height) * 2];
  const [hx, hy] = ndc(main.x, main.y); T[0] = hx; T[1] = hy; T[2] = main.force; T[3] = R;
  for (let k = 0; k < Math.min(7, sillage.length); k++) { const s = sillage[sillage.length - 1 - k], [x, y] = ndc(s.x, s.y); T.set([x, y, s.f * .9, R * .9], 4 + k * 4); }
}
function boucle(m) {
  const dt = precedent ? Math.min(.05, (m - precedent) / 1000) : .016; precedent = m;
  temps += dt * tempo;
  const v = Math.abs(scrollY - dernierY) / Math.max(dt, .001); dernierY = scrollY;
  if (!gel) vent += (1 + Math.min(2.2, v / 900) * doux - vent) * Math.min(1, dt * 2.5);
  // la main : vive quand elle bouge, s'efface quand elle s'arrete ; le sillage se referme
  const cible = main.actif && m - main.vu < 700 ? 1 : 0;
  main.force += (cible - main.force) * Math.min(1, dt * (cible ? 6 : 1.6));
  if (main.actif && m - main.vu < 140) {
    const der = sillage[sillage.length - 1];
    if (!der || Math.hypot(main.x - der.x, main.y - der.y) > (petit ? 26 : 38)) { sillage.push({ x: main.x, y: main.y, f: 1 }); if (sillage.length > 7) sillage.shift(); }
  }
  for (const s of sillage) s.f *= Math.exp(-dt * 1.35);
  while (sillage.length && sillage[0].f < .01) sillage.shift();

  const hA = accueil.offsetHeight; // lectures avant toute ecriture
  const actifs = ['accueil', 'contact'].map((k) => champs[k]).filter((c, i) => c && c.prairie && visibles.has(i ? 'contact' : 'accueil'));
  for (const c of actifs) c.r = c.toile.getBoundingClientRect();
  if (aDefiler > 0) { defilement(); aDefiler--; }
  if (sentier) {
    progLisse += (progSentier - progLisse) * (1 - Math.exp(-dt * (reduit ? 9 : 5)));
    sentier.style.setProperty('--prog', progLisse.toFixed(4));
    const yp = progLisse * hSentier + 30;
    haltes.forEach((h, i) => { const on = yp > yHaltes[i]; if (h._on !== on && on) { h._on = on; h.classList.add('atteinte'); } });
  }
  for (const c of actifs) {
    const duree = reduit ? 1.4 : 2.6;
    etat.vent = vent; etat.pousse = c.debut ? Math.min(2, (m - c.debut) / 1000 / duree * 1.6) : 0;
    remplirTrace(c, c.r); etat.trace = c.trace;
    c.onde[2] += dt; etat.onde = c.onde;
    etat.dolly = c === champs.accueil ? Math.min(3, scrollY / Math.max(1, hA) * 3) : 0;
    c.prairie.dessiner(temps, etat);
  }
  pollens.image(m, main, souffles.splice(0));
  requestAnimationFrame(boucle);
}
requestAnimationFrame(boucle);

let attente, largeurVue = innerWidth;
addEventListener('resize', () => {
  clearTimeout(attente);
  attente = setTimeout(() => {
    pollens.taille(); tracerSentier(); aDefiler = 2;
    for (const c of Object.values(champs)) { if (c.prairie) c.prairie.taille(c.horizon()); else if (innerWidth !== largeurVue) prairieFixe(c.toile, c.horizon(), sel, palette); }
    poserHorizon(horizonAccueil());
    largeurVue = innerWidth;
  }, 200);
});
document.fonts?.ready.then(() => { tracerSentier(); aDefiler = 2; });
