// Direction Éditorial : rendu du praticien demandé (?p=<dossier>) puis mise en page vivante.
// La couverture s'imprime en CSS (aucune attente) ; GSAP + ScrollTrigger (cdnjs,
// version exacte) arrivent ensuite pour la typographie cinétique. Sans eux, ou avec
// « réduire les animations », la page reste entière et lisible.
import { rendre } from './rendu.js';

const H = document.documentElement;
const site = document.getElementById('site');
const reduit = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fin = matchMedia('(hover: hover) and (pointer: fine)').matches;
const CDN = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/';
const charger = (src) => new Promise((ok, ko) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = ko; document.head.append(s); });
let gsap, ST;

// --- 1. le bon praticien ----------------------------------------------------------
async function praticien() {
  const p = (new URLSearchParams(location.search).get('p') || '').toLowerCase();
  if (!/^[a-z0-9-]{2,120}$/.test(p) || p === site.dataset.dossier) return;
  try {
    const [d, images] = await Promise.all([
      fetch(`../donnees/${p}.json`).then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); }),
      fetch('images/index.json').then((r) => r.json()),
    ]);
    const r = rendre(d, images);
    site.innerHTML = r.html;
    site.dataset.dossier = p;
    H.dataset.famille = r.famille;
    H.style.setProperty('--accent', r.accent);
    document.title = r.titre;
    document.querySelector('meta[name="description"]')?.setAttribute('content', r.description);
  } catch (e) {
    console.warn('Praticien introuvable, page par défaut affichée :', p, e.message);
  }
}

// --- 2. titres ajustés à la largeur (la couverture, le numéro de téléphone) -----------
function ajuster() {
  document.querySelectorAll('.titre-ligne, [data-ajuste]').forEach((el) => {
    const texte = el.querySelector('.titre-texte, span');
    if (!texte) return;
    el.style.fontSize = '';
    const dispo = el.clientWidth - parseFloat(getComputedStyle(el).paddingLeft) - parseFloat(getComputedStyle(el).paddingRight);
    const fs = parseFloat(getComputedStyle(el).fontSize);
    const w = texte.offsetWidth;
    if (!w) return;
    let cible = fs * (dispo / w) * .995;
    if (el.classList.contains('titre-ligne')) cible = Math.min(cible, innerHeight * (lignes() > 2 ? .2 : .3));
    el.style.fontSize = cible + 'px';
  });
  placerObjet();
  // la mise en page a bougé : les déclencheurs de défilement se recalent
  clearTimeout(ajuster.t);
  ajuster.t = setTimeout(() => window.ScrollTrigger?.refresh(), 250);
}
// sur grand écran, l'objet détouré se pose dans la marge que laisse la ligne la plus courte
function placerObjet() {
  const h1 = document.querySelector('.couverture-titre'), obj = h1?.querySelector('.couverture-objet');
  if (!obj) return;
  if (innerWidth < 900) { obj.style.removeProperty('left'); obj.style.removeProperty('top'); obj.style.removeProperty('height'); obj.style.removeProperty('right'); return; }
  const pad = parseFloat(getComputedStyle(h1).paddingLeft), large = h1.clientWidth - 2 * pad;
  let mieux = null;
  h1.querySelectorAll('.titre-ligne').forEach((l) => {
    const libre = large - l.querySelector('.titre-texte').offsetWidth;
    if (!mieux || libre > mieux.libre + 4) mieux = { l, libre, aDroite: !l.classList.contains('titre-ligne-b') };
  });
  if (!mieux) return;
  const ratio = (+obj.getAttribute('width') || 1) / (+obj.getAttribute('height') || 1);
  const h = Math.min(mieux.l.offsetHeight * 1.2, (mieux.libre * .9) / ratio);
  const w = h * ratio, texte = mieux.l.querySelector('.titre-texte').offsetWidth;
  obj.style.height = h + 'px';
  obj.style.top = (mieux.l.offsetTop + mieux.l.offsetHeight * .5 - h * .5) + 'px';
  obj.style.left = (mieux.aDroite ? pad + texte + (mieux.libre - w) / 2 : pad + (mieux.libre - w) / 2) + 'px';
  obj.style.right = 'auto';
}
const lignes = () => document.querySelectorAll('.titre-ligne').length;

// --- 3. mots qui changent ------------------------------------------------------------
function motsTournants() {
  const t = document.querySelector('[data-mots-tournants]');
  if (!t || reduit) return;
  const liste = JSON.parse(t.dataset.motsTournants);
  let i = 0;
  setInterval(() => {
    if (document.hidden) return;
    const ancien = t.querySelector('.tournant-mot');
    i = (i + 1) % liste.length;
    const neuf = document.createElement('span');
    neuf.className = 'tournant-mot entre';
    neuf.textContent = liste[i];
    t.append(neuf);
    neuf.getBoundingClientRect();
    ancien.classList.add('sort');
    neuf.classList.remove('entre');
    setTimeout(() => ancien.remove(), 800);
  }, 2600);
}

// --- 4. bandeaux défilants, plus rapides quand on défile ----------------------------
function bandeaux() {
  const pistes = [...document.querySelectorAll('[data-bandeau]')];
  if (!pistes.length || reduit) return;
  let x = pistes.map(() => 0), dernier = scrollY, vitesse = 0, sens = 1;
  const boucle = () => {
    const dy = scrollY - dernier; dernier = scrollY;
    if (dy) sens = dy > 0 ? 1 : -1;
    vitesse += (Math.min(40, Math.abs(dy)) - vitesse) * .1;
    pistes.forEach((p, i) => {
      const s = (+p.dataset.sens || 1) * sens;
      const moitie = p.scrollWidth / 2;
      x[i] -= s * (0.55 + vitesse * .35);
      if (x[i] <= -moitie) x[i] += moitie; if (x[i] > 0) x[i] -= moitie;
      p.style.transform = `translate3d(${x[i]}px, 0, 0)`;
    });
    requestAnimationFrame(boucle);
  };
  requestAnimationFrame(boucle);
}

// --- 5. tête, sommaire, ancres, défilement doux --------------------------------------
function defilementDoux() {
  let cible = scrollY, actuel = scrollY, actif = false, avant = performance.now();
  const max = () => H.scrollHeight - innerHeight;
  addEventListener('wheel', (e) => {
    if (e.ctrlKey || H.classList.contains('sommaire-ouvert')) return;
    e.preventDefault();
    const d = e.deltaMode === 1 ? e.deltaY * 34 : e.deltaMode === 2 ? e.deltaY * innerHeight : e.deltaY;
    if (!actif) cible = actuel = scrollY;
    cible = Math.max(0, Math.min(max(), cible + d));
    actif = true;
  }, { passive: false });
  addEventListener('scroll', () => { if (!actif) cible = actuel = scrollY; }, { passive: true });
  const boucle = (t) => {
    const dt = Math.min(64, t - avant); avant = t;
    if (actif) {
      actuel += (cible - actuel) * (1 - Math.pow(1 - .1, dt / 16.67));
      if (Math.abs(cible - actuel) < .5) { actuel = cible; actif = false; }
      window.scrollTo(0, actuel);
    }
    requestAnimationFrame(boucle);
  };
  requestAnimationFrame(boucle);
  return { aller(y) { cible = Math.max(0, Math.min(max(), y)); actuel = scrollY; actif = true; } };
}

function navigation(doux) {
  const bouton = document.querySelector('[data-sommaire-bouton]');
  const panneau = document.querySelector('[data-sommaire]');
  const barre = document.querySelector('[data-progression]');
  const maj = () => { if (barre) barre.style.transform = `scaleX(${Math.min(1, scrollY / Math.max(1, H.scrollHeight - innerHeight))})`; };
  addEventListener('scroll', maj, { passive: true }); maj();
  const ouvrir = (oui) => {
    panneau.hidden = !oui;
    bouton.setAttribute('aria-expanded', String(oui));
    bouton.textContent = oui ? 'Fermer' : 'Sommaire';
    H.classList.toggle('sommaire-ouvert', oui);
    document.body.style.overflow = oui ? 'hidden' : '';
    if (oui) {
      panneau.querySelector('a')?.focus({ preventScroll: true });
      if (gsap && !reduit) gsap.fromTo(panneau.querySelectorAll('li'), { x: -40, opacity: 0 }, { x: 0, opacity: 1, duration: .9, stagger: .05, ease: 'expo.out' });
    }
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
    if (doux) doux.aller(y); else scrollTo({ top: y, behavior: reduit ? 'auto' : 'smooth' });
    history.replaceState(null, '', '#' + id);
  });
}

// --- 6. typographie cinétique (GSAP) ----------------------------------------------------
function scenes() {
  gsap.registerPlugin(ST);
  ST.config({ ignoreMobileResize: true });
  const mm = gsap.matchMedia();

  // couverture : les lignes du titre s'écartent, l'objet monte en tournant
  document.querySelectorAll('.titre-ligne').forEach((l, i) => {
    gsap.to(l, { xPercent: i % 2 ? 22 : -22, ease: 'none', scrollTrigger: { trigger: '.couverture', start: 'top top', end: 'bottom top', scrub: true } });
  });
  gsap.to('[data-objet-couverture]', { yPercent: -28, rotate: 8, ease: 'none', scrollTrigger: { trigger: '.couverture', start: 'top top', end: 'bottom top', scrub: true } });
  // sur ordinateur, l'objet suit doucement la souris, comme posé sur la page
  if (fin) {
    const o = document.querySelector('[data-objet-couverture]');
    const vx = gsap.quickTo(o, 'x', { duration: 1.4, ease: 'power3.out' }), vy = gsap.quickTo(o, 'y', { duration: 1.4, ease: 'power3.out' });
    addEventListener('pointermove', (e) => { if (scrollY < innerHeight) { vx((e.clientX / innerWidth - .5) * 46); vy((e.clientY / innerHeight - .5) * 30); } }, { passive: true });
  }

  // badges qui tournent avec la lecture
  document.querySelectorAll('[data-badge]').forEach((b) => gsap.fromTo(b, { rotate: -40 }, { rotate: 320, ease: 'none', scrollTrigger: { trigger: b, start: 'top bottom', end: 'bottom top', scrub: true } }));

  // grands titres qui glissent
  document.querySelectorAll('[data-glisse]').forEach((t) => {
    const g = t.dataset.glisse === 'droite' ? 1 : -1;
    const amp = (t.classList.contains('glisse') ? 12 : 6) * (innerWidth < 900 ? .3 : 1);
    // toujours vers la droite de sa place : le titre ne mord jamais sur le numéro
    gsap.fromTo(t, { xPercent: g > 0 ? 0 : amp }, { xPercent: g > 0 ? amp : 0, ease: 'none', scrollTrigger: { trigger: t, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
  document.querySelectorAll('.rubrique-num').forEach((n) => gsap.fromTo(n, { yPercent: 25 }, { yPercent: -10, ease: 'none', scrollTrigger: { trigger: n, start: 'top bottom', end: 'bottom top', scrub: true } }));

  // lettrines
  document.querySelectorAll('.lettrine').forEach((l) => gsap.to(l, { scale: 1, rotate: 0, opacity: 1, duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: l, start: 'top 88%', once: true } }));

  // figures : la photo se découvre de gauche à droite, puis glisse dans son cadre
  document.querySelectorAll('[data-figure]').forEach((f) => {
    const cadre = f.querySelector('.figure-photo, .portrait-vide');
    gsap.to(cadre, { clipPath: 'inset(0 0% 0 0)', duration: 1.5, ease: 'expo.inOut', scrollTrigger: { trigger: f, start: 'top 82%', once: true } });
    const img = f.querySelector('img');
    if (img) gsap.fromTo(img, { yPercent: -8, scale: 1.16 }, { yPercent: 8, scale: 1.16, ease: 'none', scrollTrigger: { trigger: f, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  // objets détourés qui flottent
  const ampF = innerWidth < 900 ? .35 : 1;
  document.querySelectorAll('[data-flotte]').forEach((o) => gsap.fromTo(o, { yPercent: 30 * ampF, rotate: -14 }, { yPercent: -30 * ampF, rotate: 10, ease: 'none', scrollTrigger: { trigger: o.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } }));

  // la citation monte mot à mot pendant qu'on lit
  const m = document.querySelectorAll('.citation .mot > span');
  gsap.fromTo(m, { y: 0, yPercent: 105 }, { y: 0, yPercent: 0, ease: 'none', stagger: .08, scrollTrigger: { trigger: '.citation', start: 'top 75%', end: 'center 45%', scrub: .5 } });
  gsap.fromTo('.guillemet', { yPercent: 30, rotate: -8 }, { yPercent: -20, rotate: 4, ease: 'none', scrollTrigger: { trigger: '.citation', start: 'top bottom', end: 'bottom top', scrub: true } });

  // le numéro de téléphone s'étire à l'arrivée
  mm.add('(min-width: 900px)', () => {
    gsap.fromTo('.rdv-tel span', { xPercent: 35 }, { xPercent: 0, ease: 'none', scrollTrigger: { trigger: '.rdv-tel', start: 'top bottom', end: 'center 60%', scrub: .6 } });
  });

  addEventListener('load', () => ST.refresh());
  document.fonts?.ready.then(() => { ajuster(); ST.refresh(); });
}

// --- démarrage ------------------------------------------------------------------------------
H.classList.add('pret');
await praticien();
ajuster();
H.classList.remove('attente');
document.fonts?.ready.then(ajuster);
document.fonts?.addEventListener?.('loadingdone', () => ajuster());
addEventListener('load', ajuster);
let minuteur;
addEventListener('resize', () => { clearTimeout(minuteur); minuteur = setTimeout(ajuster, 120); });
motsTournants();
bandeaux();

try {
  if (reduit) throw new Error('mouvement réduit');
  await charger(CDN + 'gsap.min.js');
  await charger(CDN + 'ScrollTrigger.min.js');
  gsap = window.gsap; ST = window.ScrollTrigger;
  if (!gsap || !ST) throw new Error('GSAP absent');
} catch {
  gsap = null;
  H.classList.remove('js');
}
navigation(fin && gsap ? defilementDoux() : null);
if (gsap) scenes();
