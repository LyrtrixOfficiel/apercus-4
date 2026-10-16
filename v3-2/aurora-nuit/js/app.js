// Aurora Nuit : fiche (?p=<dossier>), palette (?palette=<id>), chargement (une carte du ciel
// qui se trace autour des initiales), puis le ciel, la constellation du nom, les constellations
// de l'approche, la nuit de la seance, la carte du ciel des tarifs.
// Rien ne suit le pointeur. Toucher (ou cliquer) le ciel fait naitre une etoile filante et une onde.
// Mouvement reduit : tout reste vivant mais plus lent et plus court ; ce que pilote le visiteur
// (clic, doigt, defilement, carte qu'on tourne) marche exactement pareil.
import { rendre, titre, description, aLEndroit } from './rendu.js';
import { demarrerCiel } from './ciel.js';
import { demarrerChamp, demarrerConstellation } from './etoiles.js';
import { PALETTES, parId, choisirPalette } from './univers.js';

const html = document.documentElement;
const reduit = html.classList.contains('reduit');
const tactile = matchMedia('(hover: none), (pointer: coarse)').matches;
const petit = tactile || Math.min(innerWidth, innerHeight) < 640;
const site = document.getElementById('site');
const q = new URLSearchParams(location.search);
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const borne = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lisse = (x) => { x = borne(x); return x * x * (3 - 2 * x); };

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
      const ini = $('#voile-initiales'); if (ini) ini.textContent = fiche.initiales || '';
    }
  } catch (e) { console.warn('fiche introuvable, page par defaut', e); }
}
html.classList.remove('attente-fiche');
const palette = parId(q.get('palette')) || (fiche ? choisirPalette(fiche) : parId(html.dataset.paletteFiche)) || PALETTES[0];
html.dataset.palette = palette.id;
$('meta[name="theme-color"]')?.setAttribute('content', palette.css['theme-color']);
window.__aurora = { palette: palette.id };

const nom = $('#nom'), accueil = $('#accueil');
// apres le balayage de lumiere, on retire le masque (sinon il recoupe l'ombre du texte en rectangle)
nom?.addEventListener('animationend', () => nom.classList.add('leve'));

// 2. Titres qui s'allument lettre a lettre (le titre garde son texte pour les lecteurs d'ecran)
for (const h of $$('[data-allume]')) {
  const texte = h.textContent.replace(/\s+/g, ' ').trim(); h.setAttribute('aria-label', texte);
  let i = 0;
  h.innerHTML = '<span aria-hidden="true">' + texte.split(/(\s+)/).map((m) => /^\s+$/.test(m) ? m
    : `<span class="mot-a">${[...m].map((c) => `<span class="car" style="--i:${i++}">${c.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</span>`).join('')}</span>`).join('') + '</span>';
}
for (const p of $$('[data-illumine]')) p.innerHTML = p.innerHTML.split(/(\s+)/).map((m) => /^\s+$/.test(m) || !m ? m : `<span class="w">${m}</span>`).join('');
for (const sel of ['.colonnes p', '.lune', '.apropos-texte > p', '.citation', '.contact-rdv', '.tel-geant', '.actions-contact', '.reperes', '.note', '.planisphere', '.pied-cadre > *']) {
  $$(sel).forEach((e, i) => { e.classList.add('revele'); e.style.setProperty('--i', i % 4); });
}
const vigie = new IntersectionObserver((entrees) => {
  for (const e of entrees) if (e.isIntersecting) { e.target.classList.add(e.target.matches('[data-allume]') ? 'on' : 'vu'); vigie.unobserve(e.target); }
}, { rootMargin: '0px 0px -12% 0px', threshold: .15 });
$$('[data-allume], .revele').forEach((e) => vigie.observe(e));

// L'atlas de l'approche : la legende qu'on lit allume sa constellation sur la carte (qui reste a l'ecran).
// Toucher une constellation ou une ligne de la legende l'allume aussi ; rien ne suit le pointeur.
const atlas = $('[data-atlas]'), figures = atlas ? $$('.figure', atlas) : [], entrees = atlas ? $$('.atlas-entree', atlas) : [];
let atlasActif = -1, atlasVu = -1, atlasForce = -1, atlasForceY = 0;
function allumerAtlas(i) {
  if (i === atlasActif) return;
  atlasActif = i; atlasVu = Math.max(atlasVu, i);
  figures.forEach((g, j) => { g.classList.toggle('active', j === i); g.classList.toggle('vu', j <= atlasVu && j !== i); });
  entrees.forEach((e, j) => e.classList.toggle('active', j === i));
}
const raviver = (g) => { if (!g) return; g.classList.remove('brille'); void g.getBBox(); g.classList.add('brille'); };
figures.forEach((g, i) => g.addEventListener('pointerdown', () => { atlasForce = i; atlasForceY = scrollY; allumerAtlas(i); raviver(g); }));
entrees.forEach((e, i) => e.addEventListener('pointerdown', () => { atlasForce = i; atlasForceY = scrollY; allumerAtlas(i); raviver(figures[i]); }));

// 3. Le ciel, le champ d'etoiles, la constellation du nom
const ciel = demarrerCiel($('#ciel'), { petit, palette });
if (ciel) html.classList.add('gl');
const champ = demarrerChamp($('#etoiles'), { petit, reduit, palette, parallaxe: !tactile });
const constellation = demarrerConstellation($('#constellation'), nom, accueil, { petit, reduit, palette });
window.__aurora.constellation = constellation;

// 4. Le chargement : la carte du ciel se trace autour des initiales, puis s'ouvre quand le vrai
// rendu est pret (polices, shader compile, premiere image, constellation calculee). Au plus 2,5 s.
const voile = $('#voile');
const k = reduit ? .45 : 1;
let ouvert = false;
// L'ouverture, en trois temps : l'aurore se leve sur la nuit ; les etoiles du nom s'allument de gauche
// a droite ; chaque lettre nait de ses etoiles. La constellation attend la vraie police du nom (au plus
// 3,2 s de plus) : jamais de nom dessine dans une police de secours qui changerait de forme en route.
let leverAurore = 0;
function ouvrir() {
  if (ouvert) return; ouvert = true;
  voile?.classList.add('partie');
  leverAurore = performance.now();
  accueil.classList.add('debut');
  Promise.race([feuillePolices, new Promise((r) => setTimeout(r, 3200))]).then(() => {
    constellation.construire(); formeNom = mesureNom();
    constellation.commencer();
    setTimeout(() => nom.classList.add('allume'), 1150 * k);
    setTimeout(() => accueil.classList.add('lever'), 2300 * k);
  });
}
const feuillePolices = new Promise((ok) => {
  const l = $('link[href*="fonts.googleapis.com/css2"]');
  if (!l || l.sheet) return ok();
  l.addEventListener('load', ok); l.addEventListener('error', ok);
}).then(() => Promise.all([document.fonts?.load('400 64px "Bodoni Moda"'), document.fonts?.load('italic 400 64px "Bodoni Moda"'), document.fonts?.load('400 16px Jost')]).catch(() => {}));
const polices = Promise.race([feuillePolices, new Promise((r) => setTimeout(r, 1900))]);
const minimum = reduit ? 1100 : 1900; // le temps de voir les initiales dans la carte du ciel achevee
Promise.all([polices, ciel?.pret?.()]).then(() => setTimeout(ouvrir, Math.max(0, minimum - performance.now())));
setTimeout(ouvrir, Math.max(0, 2500 - performance.now()));
voile?.addEventListener('pointerdown', ouvrir);
addEventListener('keydown', ouvrir, { once: true });

// 5. Toucher le ciel : une etoile filante nait la ou l'on touche, une onde parcourt l'aurore.
const onde = [.5, .5, 99, 0];
addEventListener('pointerdown', (e) => {
  if (!ouvert || e.target.closest('a, button, input, .planisphere, .figure, .atlas-entree, .barre, #voile')) return;
  onde[0] = e.clientX / innerWidth; onde[1] = 1 - e.clientY / innerHeight; onde[2] = 0; onde[3] = 1;
  champ.filante(e.clientX, e.clientY);
}, { passive: true });

// 6. La seance : le trajet d'une nuit. La scene reste a l'ecran pendant qu'on fait defiler ;
// la lune suit son arc, le ciel passe du crepuscule a l'aube, une etape a la fois.
const piste = $('.nuit-piste'), scene = $('.nuit-scene'), etapesN = $$('.nuit-etape'), n = etapesN.length;
const decor = $('.nuit-decor'), luneN = $('.nuit-lune'), moment = $('.nuit-moment');
if (piste && n) html.classList.add('nuit-active');
let pNuit = 0, pNuitLisse = 0, etapeActive = -1, arc = null, reperes = [];
const pointArc = (t) => { const [a0, a1, a2] = arc; const u = 1 - t; return [u * u * a0[0] + 2 * u * t * a1[0] + t * t * a2[0], u * u * a0[1] + 2 * u * t * a1[1] + t * t * a2[1]]; };
const tDe = (p) => .1 + .8 * p;
function geometrieNuit() { // l'arc de la lune et l'horizon, dessines a la vraie taille de la scene
  if (!scene || !n) return;
  const W = scene.clientWidth, H = scene.clientHeight, etroit = W < 760;
  const y0 = H * (etroit ? .56 : .7), yc = H * (etroit ? .06 : -.12);
  arc = [[W * .04, y0], [W * .5, yc], [W * .96, y0]];
  decor.setAttribute('viewBox', `0 0 ${W} ${H}`); decor.setAttribute('width', W); decor.setAttribute('height', H);
  $('.nuit-arc', decor).setAttribute('d', `M${arc[0].join(' ')}Q${arc[1].join(' ')} ${arc[2].join(' ')}`);
  $('.nuit-reperes', decor).innerHTML = etapesN.map((_, i) => { const [x, y] = pointArc(tDe((i + .5) / n)); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.5"/>`; }).join('');
  reperes = $$('.nuit-reperes circle', decor);
  // l'horizon : une colline et des sapins, toujours les memes pour une meme page
  let s = 7; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const yh = H * (etroit ? .95 : .93), colline = (x) => yh + Math.sin(x / (W * .21) + 1) * H * .025 + Math.sin(x / 61) * 3;
  let d = `M0 ${H}L0 ${colline(0).toFixed(1)}`;
  for (let x = 0; x <= W; ) {
    const pas = 6 + r() * (etroit ? 22 : 30), yb = colline(x);
    if (r() < .55) { const h = 10 + r() * (etroit ? 22 : 34), l = h * (.22 + r() * .1); d += `L${(x - l).toFixed(1)} ${yb.toFixed(1)}L${x.toFixed(1)} ${(yb - h).toFixed(1)}L${(x + l).toFixed(1)} ${yb.toFixed(1)}`; }
    else d += `L${x.toFixed(1)} ${yb.toFixed(1)}`;
    x += pas;
  }
  d += `L${W} ${colline(W).toFixed(1)}L${W} ${H}Z`;
  $('.nuit-horizon', decor).setAttribute('d', d);
  etapeActive = -1;
}
geometrieNuit();
function poserNuit(p) {
  if (!arc) return;
  const [x, y] = pointArc(tDe(p));
  luneN.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
  // le moment de la nuit reste dans l'ecran : ancre a gauche au debut de l'arc, a droite a la fin
  if (moment) moment.style.transform = `translateX(${(-100 * borne(x / Math.max(1, scene.clientWidth))).toFixed(1)}%)`;
  piste.style.setProperty('--crepuscule', (1 - lisse(p / .42)).toFixed(3));
  piste.style.setProperty('--aube', lisse((p - .58) / .42).toFixed(3));
  piste.style.setProperty('--etoiles', (.25 + .75 * Math.sin(Math.PI * borne(p))).toFixed(3));
  const i = Math.min(n - 1, Math.floor(p * n * .9999));
  if (i !== etapeActive) {
    etapeActive = i;
    etapesN.forEach((e, j) => { e.classList.toggle('active', j === i); e.classList.toggle('passee', j < i); });
    if (moment) moment.textContent = etapesN[i].dataset.moment || '';
    reperes.forEach((c, j) => c.classList.toggle('passe', j <= i));
  }
}

// 7. Les tarifs : la carte du ciel tourne au doigt ou a la souris (avec de l'elan), et doucement au defilement.
const plan = $('[data-planisphere]'), disque = plan && $('.pl-disque', plan);
let angle = 0, vitesse = 0, tenu = null, angleAffiche = 99;
if (plan) {
  const centre = () => { const r = $('.pl-svg', plan).getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };
  const angleDe = (e) => { const [cx, cy] = centre(); return Math.atan2(e.clientY - cy, e.clientX - cx) * 180 / Math.PI; };
  plan.addEventListener('pointerdown', (e) => { tenu = { id: e.pointerId, a: angleDe(e), t: performance.now() }; vitesse = 0; plan.classList.add('tenue'); try { plan.setPointerCapture(e.pointerId); } catch {} });
  plan.addEventListener('pointermove', (e) => {
    if (!tenu || e.pointerId !== tenu.id) return;
    let a = angleDe(e), d = a - tenu.a; if (d > 180) d -= 360; if (d < -180) d += 360;
    const m = performance.now(); angle += d; vitesse = d / Math.max(8, m - tenu.t) * 16.67; tenu.a = a; tenu.t = m;
  });
  const lacher = (e) => { if (tenu && e.pointerId === tenu.id) { tenu = null; plan.classList.remove('tenue'); } };
  plan.addEventListener('pointerup', lacher); plan.addEventListener('pointercancel', lacher);
}

// 8. Ce qui depend du defilement (lectures d'abord, ecritures ensuite)
const phares = $$('[data-illumine]').map((p) => ({ p, mots: $$('.w', p) }));
let aDefiler = 3, maxDefil = 1, dernierY = scrollY;
addEventListener('scroll', () => { aDefiler = 2; }, { passive: true });
function defilement() {
  const H = innerHeight;
  maxDefil = Math.max(1, document.documentElement.scrollHeight - H);
  const lus = phares.map(({ p }) => p.getBoundingClientRect());
  const rp = piste && piste.getBoundingClientRect();
  phares.forEach(({ mots }, j) => {
    const r = lus[j], kk = borne((H * .95 - r.top) / (r.height * .8 + H * .15));
    const nb = Math.round(kk * mots.length * 1.05);
    mots.forEach((m, i) => { const on = i < nb; if (m._on !== on) { m._on = on; m.classList.toggle('lit', on); } });
  });
  if (rp && n) pNuit = borne(-rp.top / Math.max(1, rp.height - H));
  if (entrees.length) {
    // la ligne de la legende la plus proche de la ligne de lecture (plus bas sur telephone : la carte est en haut)
    const lecture = H * (innerWidth < 860 ? .7 : .52);
    let meilleur = -1, ecart = Infinity;
    entrees.forEach((e, j) => { const r = (e.firstElementChild || e).getBoundingClientRect(); if (r.bottom < -200 || r.top > H + 200) return; const dd = Math.abs(r.top + 30 - lecture); if (dd < ecart) { ecart = dd; meilleur = j; } });
    if (atlasForce >= 0 && Math.abs(scrollY - atlasForceY) < 60) meilleur = atlasForce; else atlasForce = -1;
    if (meilleur >= 0) allumerAtlas(meilleur);
  }
}

// 9. La boucle : elle tourne dans les deux modes
let avanceLisse = 0, precedent = 0, temps = 0, accueilVisible = true;
new IntersectionObserver((es) => { accueilVisible = es[0].isIntersecting; }).observe(accueil);
function intensite(s) { return 1 - .62 * Math.min(1, s / .14) + .3 * Math.max(0, (s - .86) / .14); }
function boucle(m) {
  const dt = precedent ? Math.min(.05, (m - precedent) / 1000) : .016; precedent = m;
  temps += dt * (reduit ? .5 : 1);
  if (aDefiler > 0) { defilement(); aDefiler--; }
  const s = Math.min(1, scrollY / maxDefil);
  avanceLisse += (s - avanceLisse) * (1 - Math.exp(-dt * 5));
  onde[2] += dt;
  const leve = leverAurore ? lisse((m - leverAurore) / (reduit ? 1400 : 2800)) : 0;
  if (ciel) ciel.dessiner(temps, onde, avanceLisse, intensite(avanceLisse) * (.18 + .82 * leve));
  champ.image(m);
  if (accueilVisible) constellation.image(m, nom.classList.contains('allume'));
  if (piste && n) { pNuitLisse += (pNuit - pNuitLisse) * (1 - Math.exp(-dt * (reduit ? 10 : 6))); poserNuit(pNuitLisse); }
  if (disque) {
    const dy = scrollY - dernierY;
    if (!tenu) { vitesse += dy * (reduit ? .006 : .012); vitesse *= Math.exp(-dt * 2.4); angle += vitesse + dt * (reduit ? .6 : 1.5); }
    if (Math.abs(angle - angleAffiche) > .01) { angleAffiche = angle; disque.setAttribute('transform', `rotate(${angle.toFixed(2)} 300 300)`); }
  }
  dernierY = scrollY;
  requestAnimationFrame(boucle);
}
requestAnimationFrame(boucle);

let attenteTaille, largeurVue = innerWidth;
addEventListener('resize', () => {
  clearTimeout(attenteTaille);
  attenteTaille = setTimeout(() => {
    aDefiler = 2;
    if (innerWidth === largeurVue) { ciel?.taille(); geometrieNuit(); return; } // barre d'adresse du telephone : rien a reconstruire
    largeurVue = innerWidth; champ.taille(); if (ouvert) constellation.construire(); ciel?.taille(); geometrieNuit();
  }, 220);
});
// si les polices arrivent apres l'ouverture, le nom change de forme ou de place : on recalcule la figure
let formeNom = '';
const mesureNom = () => { const r = nom.getBoundingClientRect(), ra = accueil.getBoundingClientRect(); return [r.left - ra.left, r.top - ra.top, r.width, r.height].map(Math.round).join(','); };
new ResizeObserver(() => { if (ouvert && mesureNom() !== formeNom) { formeNom = mesureNom(); constellation.construire(); } }).observe($('.accueil-centre'));
document.fonts?.addEventListener?.('loadingdone', () => { if (ouvert && mesureNom() !== formeNom) { formeNom = mesureNom(); constellation.construire(); } });
