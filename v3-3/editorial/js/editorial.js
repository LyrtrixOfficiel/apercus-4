// Univers Éditorial : rendu du praticien demandé (?p=<dossier>), impression de la couverture
// (le chargement), puis mise en page vivante. Aucune bibliothèque : un moteur de défilement
// (une image d'animation pour tout), des transitions CSS, des ressorts. Rien ne suit la souris :
// l'objet de couverture, on l'attrape et on le lance. Sous « réduire les animations », tout
// reste, en plus doux.
import { rendre, PALETTES, dateNumero } from './rendu.js';
import { APERCU, apercuPret, filet } from '../../commun/apercu.js';

const H = document.documentElement;
const site = document.getElementById('site');
const q = new URLSearchParams(location.search);
const mqDoux = matchMedia('(prefers-reduced-motion: reduce)');
let doux = mqDoux.matches;
mqDoux.addEventListener?.('change', (e) => { doux = e.matches; H.classList.toggle('doux', doux); });
const fin = matchMedia('(hover: hover) and (pointer: fine)').matches;
const borne = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));

// --- 1. le bon praticien, la bonne palette, la date du numéro --------------------------------
async function praticien() {
  const p = (q.get('p') || '').toLowerCase();
  const palette = q.get('palette');
  if (/^[a-z0-9-]{2,120}$/.test(p) && p !== site.dataset.dossier) {
    try {
      const [d, images] = await Promise.all([
        fetch(`../donnees/${p}.json`).then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); }),
        fetch('images/index.json').then((r) => r.json()),
      ]);
      const r = rendre(d, images, { palette });
      site.innerHTML = r.html;
      site.dataset.dossier = p;
      H.dataset.famille = r.famille;
      H.dataset.palette = r.palette;
      document.title = r.titre;
      document.querySelector('meta[name="description"]')?.setAttribute('content', r.description);
      document.querySelectorAll('[data-epreuve-initiales] .plaque').forEach((el) => { el.textContent = r.initiales; });
      const nom = document.querySelector('[data-epreuve-nom]');
      if (nom) nom.textContent = r.nomCourt;
    } catch (e) {
      console.warn('Praticien introuvable, page par défaut affichée :', p, e.message);
    }
  } else if (PALETTES.includes(palette)) H.dataset.palette = palette;
  const date = dateNumero();
  document.querySelectorAll('.date-numero').forEach((el) => { el.textContent = date; });
}

// --- 2. titres ajustés à la largeur ; l'objet se pose dans la marge du titre ---------------------
const nbLignes = () => document.querySelectorAll('.titre-ligne').length;
function ajuster() {
  document.querySelectorAll('.titre-ligne, .pleine-ligne, [data-ajuste]').forEach((el) => {
    const texte = el.querySelector('.titre-texte, span');
    if (!texte) return;
    el.style.fontSize = '';
    const cs = getComputedStyle(el);
    const dispo = el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const fs = parseFloat(cs.fontSize), w = texte.offsetWidth;
    if (!w || !dispo) return;
    let cible = fs * (dispo / w) * .99;
    if (el.classList.contains('titre-ligne')) {
      const n = nbLignes();
      cible = Math.min(cible, innerHeight * (n > 2 ? (innerWidth < 900 ? .155 : .19) : n === 2 ? .23 : .3));
    }
    if (el.classList.contains('pleine-ligne')) cible = Math.min(cible, innerHeight * .2);
    el.style.fontSize = cible + 'px';
  });
  objet?.placer();
}

// --- 3. le chargement : l'épreuve « bon à tirer », puis la couverture s'imprime (2,5 s au plus) ----------
const pause = (ms) => new Promise((ok) => setTimeout(ok, ms));
async function impression() {
  const ep = document.querySelector('[data-epreuve]');
  const cases = [...document.querySelectorAll('[data-epreuve-gamme] i')];
  let part = 0;
  // la progression cale les quatre plaques et remplit la gamme
  const avance = (x) => {
    part = Math.max(part, x);
    ep?.style.setProperty('--calage', (1 - part).toFixed(3));
    const n = Math.round(part * cases.length);
    cases.forEach((c, i) => c.classList.toggle('encree', i < n));
  };
  avance(.1);
  const polices = (document.fonts ? Promise.all([
    document.fonts.load('500 1em "Bodoni Moda"'), document.fonts.load('italic 500 1em "Bodoni Moda"'), document.fonts.load('400 1em Newsreader'), document.fonts.load('600 1em Archivo'),
  ]).catch(() => 0) : Promise.resolve()).then(() => { H.classList.add('polices'); avance(.4); });
  const attendait = H.classList.contains('attente');
  await praticien();
  H.classList.remove('attente');
  avance(.5);
  // les initiales d'un praticien lu à l'instant ont le temps d'apparaître
  const apresRendu = performance.now() + (attendait && !APERCU ? 900 : 0);
  filet('editorial');
  if (H.classList.contains('saute')) { H.classList.add('polices'); H.classList.remove('presse'); H.classList.add('imprime', 'fini'); apercuPret('editorial'); return; }
  const img = document.querySelector('[data-objet]');
  const objetPret = (img?.decode ? img.decode() : Promise.resolve()).catch(() => 0).then(() => avance(.8));
  let passe = false;
  const passer = new Promise((ok) => {
    const f = () => { passe = true; ok(); };
    ep?.addEventListener('pointerdown', f, { once: true });
    addEventListener('keydown', f, { once: true });
  });
  const maxi = pause(Math.max(APERCU ? 100 : 300, (APERCU ? 620 : 2150) - performance.now()));
  const mini = pause(Math.max(0, Math.max(APERCU ? 450 : doux ? 900 : 1250, apresRendu) - performance.now()));
  await Promise.race([Promise.all([polices, objetPret, mini]), maxi, passer]);
  avance(1);
  objet = objetCouverture();
  ajuster();
  // un temps pour voir les plaques calées, puis la feuille d'épreuve se retire
  if (!passe) await Promise.race([pause(APERCU ? 120 : doux ? 260 : 340), passer]);
  H.classList.remove('presse');
  H.classList.add('imprime');
  requestAnimationFrame(() => apercuPret('editorial'));
  setTimeout(() => { H.classList.add('fini'); ajuster(); }, doux ? 1400 : 2400);
}

// --- 4. l'objet de couverture : on l'attrape, on le lance, il revient se poser ------------------------
function objetCouverture() {
  const o = document.querySelector('[data-objet]');
  const zone = document.querySelector('[data-zone]');
  const couv = document.querySelector('.couverture');
  if (!o || !zone) return null;
  let x = 0, y = 0, a = 0, vx = 0, vy = 0, va = 0, tenu = false, libre = false, repos = 0, vol = 0, sx = 0, sy = 0, ox = 0, oy = 0, lx = 0, ly = 0, lt = 0;
  const appliquer = () => { o.style.translate = `${x.toFixed(1)}px ${y.toFixed(1)}px`; o.style.rotate = `${(-6 + a).toFixed(2)}deg`; };
  const placer = () => {
    const h1 = document.querySelector('.couverture-titre');
    if (!h1) return;
    const zr = zone.getBoundingClientRect();
    const ratio = (+o.getAttribute('width') || 1) / (+o.getAttribute('height') || 1);
    if (innerWidth < 900) {
      // téléphone : l'objet se pose au-dessus du titre, contre la ligne la plus courte
      const l0 = h1.querySelector('.titre-ligne');
      const r0 = l0?.getBoundingClientRect();
      // la place libre entre le haut de la couverture et le titre borne sa taille : il ne chevauche pas le nom
      const dispo = (r0 ? r0.top - zr.top : 200) - 78;
      const hh = Math.max(70, Math.min(innerHeight * .2, 190, (innerWidth * .62) / ratio, dispo / .94));
      o.style.height = hh + 'px';
      o.style.left = (innerWidth - hh * ratio) / 2 + 'px';
      o.style.top = Math.max(70, (r0 ? r0.top - zr.top : 160) - hh * .94) + 'px';
      return;
    }
    let mieux = null;
    h1.querySelectorAll('.titre-ligne').forEach((l) => {
      const t = l.querySelector('.titre-texte'), lr = l.getBoundingClientRect(), tr = t.getBoundingClientRect();
      // l'objet se pose dans le plus grand blanc laissé à côté d'une ligne, à gauche ou à droite
      const libreG = tr.left - zr.left - 40, libreD = zr.right - tr.right - 40;
      const droite = libreD >= libreG, libreL = Math.max(libreG, libreD);
      if (!mieux || libreL > mieux.libre) mieux = { lr, tr, libre: libreL, droite };
    });
    if (!mieux) return;
    const hh = Math.min(mieux.lr.height * 1.02, (mieux.libre * .9) / ratio, innerHeight * .36);
    const w = hh * ratio;
    o.style.height = hh + 'px';
    o.style.top = (mieux.lr.top - zr.top + mieux.lr.height * .5 - hh * .5) + 'px';
    o.style.left = (mieux.droite ? mieux.tr.right - zr.left + (mieux.libre + 40 - w) / 2 : mieux.tr.left - zr.left - 40 - (mieux.libre + 40 + w) / 2 + 20) + 'px';
  };
  o.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    tenu = true; libre = false; o.setPointerCapture(e.pointerId); o.classList.add('tenu');
    ox = e.clientX - x; oy = e.clientY - y; sx = e.clientX; sy = e.clientY; lx = e.clientX; ly = e.clientY; lt = performance.now(); vx = vy = va = 0;
  });
  o.addEventListener('pointermove', (e) => {
    if (!tenu) return;
    const t = performance.now(), dt = Math.max(8, t - lt);
    vx = vx * .4 + ((e.clientX - lx) / dt * 16) * .6; vy = vy * .4 + ((e.clientY - ly) / dt * 16) * .6;
    lx = e.clientX; ly = e.clientY; lt = t;
    x = e.clientX - ox; y = e.clientY - oy; a = borne(a + vx * .25, -40, 40);
    appliquer();
  });
  const lacher = (e) => {
    if (!tenu) return;
    const bouge = Math.hypot((e?.clientX ?? sx) - sx, (e?.clientY ?? sy) - sy);
    tenu = false; o.classList.remove('tenu');
    // un simple toucher (le doigt n'a presque pas bougé) : un petit saut, le ressort le repose à sa place
    if (bouge < 6) { vy = -14; va = (Math.random() - .5) * 10; libre = false; return; }
    va += vx * .35; libre = true; repos = 0; vol = 0;
  };
  o.addEventListener('pointerup', lacher);
  o.addEventListener('pointercancel', lacher);
  o.addEventListener('dragstart', (e) => e.preventDefault());
  const pas = (dt) => {
    if (tenu) return;
    const k = dt / 16.67;
    if (libre) {
      // vol libre : frottement de l'air, rebond doux sur les bords de la couverture
      x += vx * k; y += vy * k; a += va * k;
      vx *= Math.pow(.965, k); vy *= Math.pow(.965, k); va *= Math.pow(.94, k);
      vy += .35 * k;
      const zr = zone.getBoundingClientRect(), r = o.getBoundingClientRect();
      if (r.left < zr.left && vx < 0) { x += zr.left - r.left; vx = -vx * .55; }
      if (r.right > zr.right && vx > 0) { x -= r.right - zr.right; vx = -vx * .55; }
      if (r.top < zr.top + 60 && vy < 0) { y += zr.top + 60 - r.top; vy = -vy * .55; }
      let sol = false;
      if (r.bottom > zr.bottom - 10 && vy > 0) { y -= r.bottom - zr.bottom + 10; vy = -vy * .5; vx *= .8; sol = true; }
      // posé : au sol (les petits rebonds de la gravité ne comptent pas, quelle que soit la cadence) ou presque immobile
      if (Math.abs(vx) < .6 && (sol || Math.hypot(vx, vy) < .6)) repos += dt; else if (!sol) repos = 0;
      vol += dt;
      if (repos > 1100 || vol > 4500) libre = false; // posé un instant : il revient à sa place
      appliquer();
      return;
    }
    if (Math.abs(x) + Math.abs(y) + Math.abs(a) < .08) return;
    // ressort amorti vers sa place sur la couverture
    vx = (vx - x * .045 * k) * Math.pow(.86, k); vy = (vy - y * .045 * k) * Math.pow(.86, k); va = (va - a * .05 * k) * Math.pow(.84, k);
    x += vx * k; y += vy * k; a += va * k;
    appliquer();
  };
  if (couv) couv.addEventListener('dblclick', (e) => { if (e.target === o) e.preventDefault(); });
  return { placer, pas };
}
let objet = null;

// --- 5. défilement doux à la molette (léger ; naturel sous mouvement réduit) ---------------------------
function defilementDoux() {
  let cible = scrollY, actuel = scrollY, actif = false;
  const max = () => H.scrollHeight - innerHeight;
  addEventListener('wheel', (e) => {
    // dans le cadre de la page d'arrivée, la molette reste native
    if (APERCU || doux || e.ctrlKey || H.classList.contains('sommaire-ouvert')) return;
    e.preventDefault();
    const dy = e.deltaMode === 1 ? e.deltaY * 34 : e.deltaMode === 2 ? e.deltaY * innerHeight : e.deltaY;
    if (!actif) cible = actuel = scrollY;
    cible = borne(cible + dy, 0, max());
    actif = true;
  }, { passive: false });
  addEventListener('scroll', () => { if (!actif) cible = actuel = scrollY; }, { passive: true });
  return {
    pas(dt) {
      if (!actif) return;
      actuel += (cible - actuel) * (1 - Math.pow(1 - .15, dt / 16.67));
      if (Math.abs(cible - actuel) < .5) { actuel = cible; actif = false; }
      scrollTo(0, actuel);
    },
    aller(y) { cible = borne(y, 0, max()); actuel = scrollY; actif = true; },
  };
}

// --- 6. sommaire, ancres ---------------------------------------------------------------------------------
function navigation(lisse) {
  const bouton = document.querySelector('[data-sommaire-bouton]');
  const panneau = document.querySelector('[data-sommaire]');
  const ouvrir = (oui) => {
    panneau.hidden = !oui;
    bouton.setAttribute('aria-expanded', String(oui));
    bouton.textContent = oui ? 'Fermer' : 'Sommaire';
    H.classList.toggle('sommaire-ouvert', oui);
    document.body.style.overflow = oui ? 'hidden' : '';
    if (oui) panneau.querySelector('a')?.focus({ preventScroll: true });
  };
  bouton?.addEventListener('click', () => ouvrir(panneau.hidden));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && panneau && !panneau.hidden) { ouvrir(false); bouton.focus(); } });
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href').slice(1);
    const cible = id ? document.getElementById(id) : null;
    if (!cible) return;
    e.preventDefault();
    if (panneau && !panneau.hidden) ouvrir(false);
    const y = id === 'couverture' ? 0 : cible.getBoundingClientRect().top + scrollY - 40;
    if (lisse && !doux) lisse.aller(y); else scrollTo({ top: y, behavior: doux ? 'auto' : 'smooth' });
    history.replaceState(null, '', '#' + id);
  });
}

// --- 7. les scènes au défilement ----------------------------------------------------------------------------
function scenes() {
  const vh = () => innerHeight;
  const maj = [];
  const barre = document.querySelector('[data-progression]');
  maj.push(() => { if (barre) barre.style.transform = `scaleX(${borne(scrollY / Math.max(1, H.scrollHeight - vh()))})`; });
  // les photos glissent dans leur cadre
  document.querySelectorAll('[data-figure] .figure-photo').forEach((f) => maj.push(() => {
    const r = f.getBoundingClientRect();
    if (r.bottom < -50 || r.top > vh() + 50) return;
    f.style.setProperty('--glisse', ((borne((vh() - r.top) / (vh() + r.height)) - .5) * (doux ? -4 : -12)).toFixed(2) + '%');
  }));
  // l'objet d'article flotte dans la marge
  document.querySelectorAll('[data-flotte]').forEach((o) => maj.push(() => {
    const r = o.parentElement.getBoundingClientRect();
    if (r.bottom < -100 || r.top > vh() + 100) return;
    const p = borne((vh() - r.top) / (vh() + r.height)) - .5;
    o.style.setProperty('--flotte', (p * (doux ? -40 : -110)).toFixed(1) + 'px');
    o.style.setProperty('--tourne', (p * (doux ? 6 : 22)).toFixed(2) + 'deg');
  }));
  // pleine page : les mots glissent, une ligne sur deux en sens contraire
  document.querySelectorAll('[data-glisse]').forEach((l) => {
    const s = +l.dataset.glisse || 1, span = l.querySelector('span');
    maj.push(() => {
      const r = l.getBoundingClientRect();
      if (r.bottom < -50 || r.top > vh() + 50) return;
      const p = borne((vh() - r.top) / (vh() + r.height)) - .5;
      span.style.setProperty('--x', (p * s * (doux ? 6 : 16)).toFixed(2) + 'vw');
    });
  });
  return maj;
}

function apparitions() {
  const io = new IntersectionObserver((entrees) => entrees.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('vu'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -10% 0px', threshold: .06 });
  document.querySelectorAll('[data-figure], [data-revele], .breve, .avec-lettrine, .portrait').forEach((el) => io.observe(el));
}

// --- démarrage ---------------------------------------------------------------------------------------------
H.classList.add('pret');
await impression();
if (!objet) objet = objetCouverture();
ajuster();
document.fonts?.ready.then(ajuster);
addEventListener('load', ajuster);
let minuteur;
addEventListener('resize', () => { clearTimeout(minuteur); minuteur = setTimeout(ajuster, 120); });
const lisse = fin ? defilementDoux() : null;
navigation(lisse);
apparitions();
const maj = scenes();
let avant = performance.now(), yAvant = -1;
const boucle = (t) => {
  const dt = Math.min(64, t - avant); avant = t;
  lisse?.pas(dt);
  objet?.pas(dt);
  if (scrollY !== yAvant) { yAvant = scrollY; for (const f of maj) f(); }
  requestAnimationFrame(boucle);
};
requestAnimationFrame(boucle);
addEventListener('resize', () => { yAvant = -1; });
