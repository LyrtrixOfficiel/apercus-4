// Direction Cinéma : rendu du praticien demandé (?p=<dossier>) puis mise en scène.
// GSAP + ScrollTrigger (cdnjs, version exacte). Sans eux, ou avec « réduire les
// animations », la page reste entière et lisible.
import { rendre } from './rendu.js';

const H = document.documentElement;
const site = document.getElementById('site');
const reduit = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fin = matchMedia('(hover: hover) and (pointer: fine)').matches;
let gsap, ST;
const charger = (src) => new Promise((ok, ko) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = ko; document.head.append(s); });
const CDN = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/';

// --- 1. le bon praticien -------------------------------------------------------
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
    document.title = r.titre;
    document.querySelector('meta[name="description"]')?.setAttribute('content', r.description);
  } catch (e) {
    console.warn('Praticien introuvable, page par défaut affichée :', p, e.message);
  }
}

// --- 3. défilement doux et inertiel (molette, ordinateur seulement) -------------
function defilementDoux() {
  let cible = scrollY, actuel = scrollY, actif = false;
  const max = () => H.scrollHeight - innerHeight;
  addEventListener('wheel', (e) => {
    if (e.ctrlKey || H.classList.contains('menu-ouvert')) return;
    e.preventDefault();
    const d = e.deltaMode === 1 ? e.deltaY * 34 : e.deltaMode === 2 ? e.deltaY * innerHeight : e.deltaY;
    if (!actif) cible = actuel = scrollY;
    cible = Math.max(0, Math.min(max(), cible + d));
    actif = true;
  }, { passive: false });
  addEventListener('scroll', () => { if (!actif) cible = actuel = scrollY; }, { passive: true });
  gsap.ticker.add((t, dt) => {
    if (!actif) return;
    const k = 1 - Math.pow(1 - 0.088, dt / 16.67);
    actuel += (cible - actuel) * k;
    if (Math.abs(cible - actuel) < 0.5) { actuel = cible; actif = false; }
    window.scrollTo(0, actuel);
  });
  return { aller(y) { cible = Math.max(0, Math.min(max(), y)); actuel = scrollY; actif = true; } };
}

// --- 4. barre, menu, ancres -----------------------------------------------------
function navigation(doux) {
  const barre = document.querySelector('[data-barre]');
  const menu = document.querySelector('[data-menu]');
  const bouton = document.querySelector('[data-menu-bouton]');
  const accueil = document.getElementById('accueil');
  let dernier = scrollY;
  const majBarre = () => {
    const y = scrollY;
    barre.classList.toggle('claire', y > accueil.offsetHeight - 80);
    barre.classList.toggle('cachee', y > 200 && y > dernier + 2 && !H.classList.contains('menu-ouvert'));
    if (y < dernier - 2 || y < 200) barre.classList.remove('cachee');
    dernier = y;
  };
  addEventListener('scroll', majBarre, { passive: true }); majBarre();

  const ouvrir = (oui) => {
    menu.hidden = !oui;
    bouton.setAttribute('aria-expanded', String(oui));
    bouton.querySelector('span').textContent = oui ? 'Fermer' : 'Menu';
    H.classList.toggle('menu-ouvert', oui);
    document.body.style.overflow = oui ? 'hidden' : '';
    barre.classList.toggle('claire', oui ? false : scrollY > accueil.offsetHeight - 80);
    if (oui) {
      menu.querySelector('a')?.focus({ preventScroll: true });
      if (gsap && !reduit) gsap.fromTo(menu.querySelectorAll('nav a, .menu-tel'), { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 1, stagger: .06, ease: 'expo.out' });
    }
  };
  bouton?.addEventListener('click', () => ouvrir(menu.hidden));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) { ouvrir(false); bouton.focus(); } });

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href').slice(1);
    const cible = id ? document.getElementById(id) : null;
    if (!cible) return;
    e.preventDefault();
    if (!menu.hidden) ouvrir(false);
    const y = id === 'accueil' ? 0 : cible.getBoundingClientRect().top + scrollY;
    if (doux) doux.aller(y); else scrollTo({ top: y, behavior: reduit ? 'auto' : 'smooth' });
    history.replaceState(null, '', '#' + id);
    if (id !== 'accueil') cible.setAttribute('tabindex', '-1'), cible.focus({ preventScroll: true });
  });
}

// --- 5. curseur ------------------------------------------------------------------
function curseur() {
  const c = document.querySelector('.curseur');
  if (!c) return;
  H.classList.add('curseur-actif');
  const point = c.querySelector('.curseur-point'), anneau = c.querySelector('.curseur-anneau'), texte = c.querySelector('.curseur-texte');
  let x = -100, y = -100, ax = -100, ay = -100;
  addEventListener('pointermove', (e) => { x = e.clientX; y = e.clientY; c.style.opacity = 1; }, { passive: true });
  document.addEventListener('pointerleave', () => { c.style.opacity = 0; });
  document.addEventListener('pointerover', (e) => {
    const lab = e.target.closest('[data-curseur]');
    const lien = e.target.closest('a, button, [tabindex="0"]');
    c.classList.toggle('etiquette', !!lab);
    c.classList.toggle('lien', !lab && !!lien);
    if (lab) texte.textContent = lab.dataset.curseur;
  });
  gsap.ticker.add((t, dt) => {
    const k = 1 - Math.pow(1 - 0.2, dt / 16.67);
    ax += (x - ax) * k; ay += (y - ay) * k;
    point.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    anneau.style.transform = `translate3d(${ax}px, ${ay}px, 0)`;
  });
}

// --- 6. mise en scène --------------------------------------------------------------
function scenes() {
  gsap.registerPlugin(ST);
  ST.config({ ignoreMobileResize: true });
  const mm = gsap.matchMedia();
  const grand = '(min-width: 900px)';

  // accueil : l'image s'enfonce, le texte remonte
  gsap.to('.accueil-photo img', { yPercent: 14, ease: 'none', scrollTrigger: { trigger: '.accueil', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.accueil-contenu', { yPercent: -30, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.accueil', start: '30% top', end: 'bottom top', scrub: true } });

  // titres qui se composent lettre à lettre
  document.querySelectorAll('[data-lettres]:not(.accueil-titre)').forEach((el) => {
    gsap.fromTo(el.querySelectorAll('.lettre'), { opacity: 0, y: '.38em' }, {
      opacity: 1, y: 0, duration: 1.3, ease: 'expo.out', stagger: .032,
      scrollTrigger: { trigger: el, start: 'top 86%', once: true },
    });
  });

  // apparitions
  ST.batch('[data-reveal]', { start: 'top 90%', once: true, onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 1.2, ease: 'expo.out', stagger: .09 }) });
  gsap.utils.toArray('.chapitre-trait').forEach((t) => gsap.from(t, { scaleX: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: t, start: 'top 92%', once: true } }));

  // phrase d'approche : les mots s'allument pendant la lecture
  const mots = document.querySelectorAll('.approche-phrase .mot');
  gsap.to(mots, { opacity: 1, ease: 'none', stagger: .12, scrollTrigger: { trigger: '.approche-phrase', start: 'top 82%', end: 'bottom 42%', scrub: .6 } });

  // images qui s'ouvrent comme des volets
  document.querySelectorAll('[data-masque].photo').forEach((p) => {
    const tl = gsap.timeline({ scrollTrigger: { trigger: p, start: 'top 88%', once: true } });
    tl.to(p, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.6, ease: 'expo.inOut' })
      .to(p.querySelector('img'), { scale: 1, duration: 2.2, ease: 'expo.out' }, .1);
  });

  // parallaxe en plusieurs plans
  mm.add({ grand, petit: '(max-width: 899px)' }, (ctx) => {
    const amp = ctx.conditions.grand ? 360 : 160;
    gsap.utils.toArray('[data-parallax]').forEach((el) => {
      const v = parseFloat(el.dataset.parallax);
      gsap.fromTo(el, { y: v * amp * .5 }, { y: -v * amp * .5, ease: 'none', scrollTrigger: { trigger: el.closest('section'), start: 'top bottom', end: 'bottom top', scrub: true } });
    });
  });

  // la séance : le cadre s'ouvre en lisant, les images se succèdent
  const cadre = document.querySelector('[data-seance-cadre]');
  if (cadre) {
    const photos = [...cadre.querySelectorAll('.seance-photo')];
    const num = cadre.querySelector('[data-seance-num]');
    const etapes = [...document.querySelectorAll('[data-etape]')];
    photos.forEach((p, i) => { p.style.zIndex = i + 1; p.classList.remove('actif'); gsap.set(p, { clipPath: i === 0 ? 'inset(0% 0% 0% 0%)' : 'inset(100% 0% 0% 0%)' }); });
    let courant = -1;
    const montrer = (i) => {
      if (i === courant) return;
      const k = i % photos.length;
      photos.forEach((p, j) => {
        const voir = j <= k;
        gsap.to(p, { clipPath: voir ? 'inset(0% 0% 0% 0%)' : 'inset(100% 0% 0% 0%)', duration: 1.25, ease: 'expo.inOut', overwrite: true });
      });
      gsap.fromTo(photos[k].querySelector('img'), { scale: 1.22 }, { scale: 1.06, duration: 2.4, ease: 'expo.out', overwrite: true });
      etapes.forEach((e, j) => e.classList.toggle('actif', j === i));
      if (num) num.textContent = String(i + 1).padStart(2, '0');
      courant = i;
    };
    montrer(0);
    etapes.forEach((e, i) => ST.create({ trigger: e, start: 'top 62%', end: 'bottom 62%', onToggle: (s) => s.isActive && montrer(i) }));
    gsap.fromTo(cadre, { '--p': 0 }, { '--p': 1, ease: 'none', scrollTrigger: { trigger: '.seance-corps', start: 'top 75%', end: () => `+=${innerHeight * 1.1}`, scrub: .8 } });
  }

  // galerie : déroulé horizontal sur grand écran, glisser au doigt sur téléphone
  const galerie = document.querySelector('.galerie');
  const piste = document.querySelector('[data-piste]');
  const barre = document.querySelector('[data-galerie-barre]');
  ST.create({ trigger: galerie, start: 'top bottom+=1200', once: true, onEnter: () => galerie.querySelectorAll('img').forEach((i) => { i.loading = 'eager'; }) });
  mm.add(grand, () => {
    galerie.classList.add('deroule');
    const distance = () => Math.max(0, piste.scrollWidth - innerWidth);
    const hauteur = () => { galerie.style.height = `${innerHeight + distance()}px`; };
    hauteur();
    ST.addEventListener('refreshInit', hauteur);
    const tween = gsap.to(piste, {
      x: () => -distance(), ease: 'none',
      scrollTrigger: { trigger: galerie, start: 'top top', end: () => `+=${distance()}`, scrub: .9, invalidateOnRefresh: true, onUpdate: (s) => gsap.set(barre, { scaleX: .12 + s.progress * .88 }) },
    });
    piste.querySelectorAll('.carte').forEach((c) => {
      const img = c.querySelector('.carte-photo img');
      if (img) gsap.fromTo(img, { xPercent: -7 }, { xPercent: 7, ease: 'none', scrollTrigger: { trigger: c, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true } });
    });
    return () => { ST.removeEventListener('refreshInit', hauteur); galerie.classList.remove('deroule'); galerie.style.height = ''; gsap.set(piste, { x: 0 }); };
  });
  mm.add('(max-width: 899px)', () => {
    const maj = () => { const m = piste.scrollWidth - piste.clientWidth; gsap.set(barre, { scaleX: .12 + (m > 0 ? piste.scrollLeft / m : 0) * .88 }); };
    piste.addEventListener('scroll', maj, { passive: true });
    return () => piste.removeEventListener('scroll', maj);
  });

  // tarifs : les filets se tracent
  document.querySelectorAll('[data-ligne]').forEach((l, i) => ST.create({ trigger: l, start: 'top 90%', once: true, onEnter: () => setTimeout(() => l.style.setProperty('--trait', 1), i * 120) }));

  // portrait : l'arche s'ouvre
  const arche = document.querySelector('.portrait-arche');
  if (arche) {
    gsap.to(arche, { clipPath: 'inset(0% 0% 0% 0% round 999px 999px 0px 0px)', duration: 1.8, ease: 'expo.inOut', scrollTrigger: { trigger: arche, start: 'top 85%', once: true } });
    gsap.fromTo('.portrait-initiales', { yPercent: 18 }, { yPercent: -18, ease: 'none', scrollTrigger: { trigger: '.apropos', start: 'top bottom', end: 'bottom top', scrub: true } });
  }

  // contact : un cercle de lumière s'ouvre
  const cc = document.querySelector('[data-contact-cadre]');
  if (cc) {
    gsap.fromTo(cc, { '--r': '9%' }, { '--r': '75%', ease: 'none', scrollTrigger: { trigger: '.contact', start: 'top 95%', end: 'top 5%', scrub: .6 } });
    gsap.fromTo('.contact-photo img', { scale: 1.3 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.contact', start: 'top bottom', end: 'bottom bottom', scrub: true } });
  }

  addEventListener('load', () => ST.refresh());
  document.fonts?.ready.then(() => ST.refresh());
}

// --- démarrage --------------------------------------------------------------------
H.classList.add('pret');
await praticien();
H.classList.remove('attente');

// l'ouverture est en CSS (elle n'attend aucune bibliothèque) ; on peut l'écourter
if (H.classList.contains('js')) {
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  if (!location.hash && scrollY > 0) scrollTo(0, 0);
  const sauter = () => H.classList.add('saute');
  ['wheel', 'touchstart', 'keydown'].forEach((ev) => addEventListener(ev, sauter, { once: true, passive: true }));
  setTimeout(() => { document.querySelector('[data-rideau]')?.remove(); ['wheel', 'touchstart', 'keydown'].forEach((ev) => removeEventListener(ev, sauter)); }, 3600);
}

try {
  if (reduit) throw new Error('mouvement réduit');
  await charger(CDN + 'gsap.min.js');
  await charger(CDN + 'ScrollTrigger.min.js');
  gsap = window.gsap; ST = window.ScrollTrigger;
  if (!gsap || !ST) throw new Error('GSAP absent');
} catch (e) {
  H.classList.remove('js');
  document.querySelector('[data-rideau]')?.remove();
  navigation(null);
  gsap = null;
}
if (gsap) {
  const doux = fin ? defilementDoux() : null;
  navigation(doux);
  if (fin) curseur();
  scenes();
}
