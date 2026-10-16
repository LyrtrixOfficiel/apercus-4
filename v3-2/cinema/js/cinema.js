// Univers Cinéma : rendu du praticien demandé (?p=<dossier>), chargement en carton,
// ouverture, puis mise en scène au défilement. Aucune bibliothèque : un seul moteur de
// défilement (une image d'animation pour tout), des transitions CSS, des ressorts.
// Rien ne suit la souris. Sous « réduire les animations », tout reste, en plus doux.
import { rendre, PALETTES } from './rendu.js';

const H = document.documentElement;
const site = document.getElementById('site');
const q = new URLSearchParams(location.search);
const mqDoux = matchMedia('(prefers-reduced-motion: reduce)');
let doux = mqDoux.matches;
mqDoux.addEventListener?.('change', (e) => { doux = e.matches; H.classList.toggle('doux', doux); });
const fin = matchMedia('(hover: hover) and (pointer: fine)').matches;
const borne = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));

// --- 1. le bon praticien, la bonne palette ---------------------------------------------------
async function praticien() {
  const p = (q.get('p') || '').toLowerCase();
  const palette = q.get('palette');
  if (!/^[a-z0-9-]{2,120}$/.test(p) || p === site.dataset.dossier) {
    if (PALETTES.includes(palette)) H.dataset.palette = palette;
    return;
  }
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
    const ini = document.querySelector('[data-chargement-initiales]'), pre = document.querySelector('[data-chargement-presente]');
    if (ini) ini.textContent = r.initiales;
    if (pre) pre.textContent = r.presente;
  } catch (e) {
    console.warn('Praticien introuvable, page par défaut affichée :', p, e.message);
  }
}

// --- 2. chargement : le carton attend les polices et les premières images (2,5 s au plus) --------
async function chargement() {
  const barre = document.querySelector('[data-chargement-progres]');
  let part = .04;
  const avance = (x) => { part = Math.max(part, x); if (barre) barre.style.transform = `scaleX(${part})`; };
  const polices = (document.fonts ? Promise.all([
    document.fonts.load('italic 300 1em "Cormorant Garamond"'), document.fonts.load('300 1em "Cormorant Garamond"'), document.fonts.load('500 1em Manrope'),
  ]).catch(() => 0) : Promise.resolve()).then(() => { H.classList.add('polices'); avance(.5); });
  const attendait = H.classList.contains('attente');
  await praticien();
  H.classList.remove('attente');
  // les initiales d'un praticien lu à l'instant ont le temps d'apparaître
  const apresRendu = performance.now() + (attendait ? 950 : 0);
  if (H.classList.contains('saute')) { H.classList.add('charge-fini', 'fini'); return; }
  const images = [...document.querySelectorAll('.ouverture-photo img, .plan-photo img')].slice(0, 2);
  let faites = 0;
  const attendues = images.map((i) => (i.decode ? i.decode() : Promise.resolve()).catch(() => 0).then(() => { faites++; avance(.5 + .5 * faites / images.length); }));
  const tout = Promise.all([polices, ...attendues]);
  const maxi = new Promise((ok) => setTimeout(ok, Math.max(300, 2500 - performance.now())));
  const mini = new Promise((ok) => setTimeout(ok, Math.max(0, Math.max(doux ? 900 : 1300, apresRendu) - performance.now())));
  const passer = new Promise((ok) => { const c = document.querySelector('[data-chargement]'); c?.addEventListener('pointerdown', ok, { once: true }); addEventListener('keydown', ok, { once: true }); });
  await Promise.race([Promise.all([tout, mini]), maxi, passer]);
  avance(1);
  H.classList.add('charge-fini', 'ouvre');
  // l'ouverture se joue en CSS ; on peut l'écourter d'un geste
  const sauter = () => H.classList.add('saute');
  const gestes = ['wheel', 'touchstart', 'keydown'];
  setTimeout(() => gestes.forEach((g) => addEventListener(g, sauter, { once: true, passive: true })), 250);
  setTimeout(() => { H.classList.add('fini'); gestes.forEach((g) => removeEventListener(g, sauter)); }, doux ? 1900 : 3200);
}

// --- 3. défilement doux à la molette (léger ; naturel sous mouvement réduit) ------------------------
function defilementDoux() {
  let cible = scrollY, actuel = scrollY, actif = false;
  const max = () => H.scrollHeight - innerHeight;
  addEventListener('wheel', (e) => {
    if (doux || e.ctrlKey || H.classList.contains('menu-ouvert') || e.target.closest?.('[data-talon]')) return;
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
      actuel += (cible - actuel) * (1 - Math.pow(1 - .14, dt / 16.67));
      if (Math.abs(cible - actuel) < .5) { actuel = cible; actif = false; }
      scrollTo(0, actuel);
    },
    aller(y) { cible = borne(y, 0, max()); actuel = scrollY; actif = true; },
    arreter() { actif = false; },
  };
}

// --- 4. barre, menu, ancres ------------------------------------------------------------------------------
function navigation(lisse) {
  const barre = document.querySelector('[data-barre]');
  const menu = document.querySelector('[data-menu]');
  const bouton = document.querySelector('[data-menu-bouton]');
  const ouvrir = (oui) => {
    menu.hidden = !oui;
    bouton.setAttribute('aria-expanded', String(oui));
    bouton.querySelector('span').textContent = oui ? 'Fermer' : 'Chapitres';
    H.classList.toggle('menu-ouvert', oui);
    document.body.style.overflow = oui ? 'hidden' : '';
    if (oui) menu.querySelector('a')?.focus({ preventScroll: true });
  };
  bouton?.addEventListener('click', () => ouvrir(menu.hidden));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && menu && !menu.hidden) { ouvrir(false); bouton.focus(); } });
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href').slice(1);
    const cible = id ? document.getElementById(id) : null;
    if (!cible) return;
    e.preventDefault();
    if (menu && !menu.hidden) ouvrir(false);
    const y = id === 'accueil' ? 0 : cible.getBoundingClientRect().top + scrollY;
    if (lisse && !doux) lisse.aller(y); else scrollTo({ top: y, behavior: doux ? 'auto' : 'smooth' });
    history.replaceState(null, '', '#' + id);
    if (id !== 'accueil') { cible.setAttribute('tabindex', '-1'); cible.focus({ preventScroll: true }); }
  });
  // la barre prend la couleur de ce qu'elle survole
  const sombres = [...document.querySelectorAll('.carton, .sequence, .bande, .generique')];
  let dernier = scrollY;
  return () => {
    const y = scrollY;
    const ouverture = document.getElementById('accueil');
    const surOuverture = y < (ouverture?.offsetHeight || innerHeight) - 70;
    const surSombre = !surOuverture && sombres.some((s) => { const r = s.getBoundingClientRect(); return r.top <= 40 && r.bottom > 40; });
    barre.classList.toggle('sombre', surSombre);
    barre.classList.toggle('claire', !surOuverture && !surSombre);
    if (y > 220 && y > dernier + 3 && !H.classList.contains('menu-ouvert')) barre.classList.add('cachee');
    else if (y < dernier - 3 || y < 220) barre.classList.remove('cachee');
    dernier = y;
  };
}

// --- 5. les scènes : tout se calcule dans la même image d'animation -----------------------------------
function scenes() {
  const vh = () => innerHeight;
  const maj = [];

  // ouverture : la photo s'enfonce doucement
  const ouverture = document.querySelector('.ouverture');
  if (ouverture) maj.push(() => ouverture.style.setProperty('--defile', borne(scrollY / vh()).toFixed(4) * (doux ? .35 : 1)));

  // carton : les mots de sa phrase s'allument pendant qu'on la lit
  const phrase = document.querySelector('.carton-phrase');
  if (phrase) {
    const motsP = [...phrase.querySelectorAll('p .mot')];
    let avant = -1;
    maj.push(() => {
      const r = phrase.getBoundingClientRect();
      const p = borne((vh() * .88 - r.top) / (r.height + vh() * .32));
      const k = p * motsP.length;
      if (Math.abs(k - avant) < .02) return;
      avant = k;
      motsP.forEach((m, i) => { m.style.opacity = (.2 + .8 * borne(k - i)).toFixed(3); });
    });
  }

  // plans : chaque image glisse dans son cadre
  document.querySelectorAll('.plan-photo').forEach((ph) => {
    maj.push(() => {
      const r = ph.parentElement.getBoundingClientRect();
      if (r.bottom < -50 || r.top > vh() + 50) return;
      const p = borne((vh() - r.top) / (vh() + r.height));
      ph.style.setProperty('--glisse', ((p - .5) * (doux ? -5 : -14)).toFixed(2) + '%');
    });
  });

  // séquence : le défilement fait avancer le plan-séquence, les sous-titres changent
  const seq = document.querySelector('[data-sequence]');
  if (seq) {
    const photos = [...seq.querySelectorAll('.sequence-photo')];
    const blocs = [...seq.querySelectorAll('[data-etape]')];
    const crans = [...seq.querySelectorAll('[data-cran]')];
    const n = blocs.length;
    let courant = 0;
    maj.push(() => {
      const r = seq.getBoundingClientRect();
      const course = Math.max(1, r.height - vh());
      const p = borne(-r.top / course);
      const k = Math.min(n - 1, Math.floor(p * n * .999));
      const local = borne(p * n - k);
      seq.style.setProperty('--q', local.toFixed(3));
      if (k === courant) return;
      courant = k;
      photos.forEach((ph, i) => ph.classList.toggle('actif', i === k));
      blocs.forEach((b, i) => b.classList.toggle('actif', i === k));
      crans.forEach((c, i) => { c.classList.toggle('actif', i === k); c.classList.toggle('passe', i < k); });
    });
  }

  // bande-annonce : chaque plan recouvert s'assombrit et s'approche
  const panneaux = [...document.querySelectorAll('.bande-panneau')];
  panneaux.forEach((pn, i) => {
    const suivant = panneaux[i + 1];
    if (!suivant) return;
    maj.push(() => {
      const r = suivant.getBoundingClientRect();
      if (r.top > vh() * 1.05 || r.top < -vh()) return;
      pn.style.setProperty('--couvert', borne(1 - r.top / vh()).toFixed(3));
    });
  });

  // fermeture à l'iris
  const iris = document.querySelector('[data-iris]');
  if (iris) maj.push(() => {
    const r = iris.getBoundingClientRect();
    if (r.top > vh()) return;
    // l'iris se referme tout à fait un peu avant le bas de la page : il ne reste que « Fin »
    const p = borne((1 - r.top / vh()) * 1.12);
    iris.style.setProperty('--r', (72 * (1 - p * p)).toFixed(2) + '%');
  });
  return maj;
}

// --- 6. apparitions ---------------------------------------------------------------------------------------
function apparitions() {
  const io = new IntersectionObserver((entrees) => entrees.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('vu'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -12% 0px', threshold: .08 });
  document.querySelectorAll('[data-revele], .bande-panneau, .generique-appel').forEach((el) => io.observe(el));
}

// --- 7. le billet : on attrape le talon et on le détache (souris et doigt, même geste) ---------------------
function billet() {
  const talon = document.querySelector('[data-talon]');
  const b = document.querySelector('[data-billet]');
  if (!talon || !b) return;
  const majTalon = () => b.style.setProperty('--talon-h', talon.offsetHeight + 'px');
  majTalon(); addEventListener('resize', majTalon);
  let x = 0, y = 0, a = 0, vx = 0, vy = 0, va = 0, tenu = false, parti = false, ox = 0, oy = 0, dernier = 0, lx = 0, ly = 0;
  const appliquer = () => { talon.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${a.toFixed(2)}deg)`; talon.style.opacity = parti ? String(borne(1 - Math.hypot(x, y) / 700)) : ''; };
  talon.addEventListener('pointerdown', (e) => {
    if (parti) return;
    tenu = true; talon.setPointerCapture(e.pointerId);
    ox = e.clientX - x; oy = e.clientY - y; lx = e.clientX; ly = e.clientY; dernier = performance.now();
  });
  talon.addEventListener('pointermove', (e) => {
    if (!tenu) return;
    const t = performance.now(), dt = Math.max(8, t - dernier);
    vx = (e.clientX - lx) / dt * 16; vy = (e.clientY - ly) / dt * 16;
    lx = e.clientX; ly = e.clientY; dernier = t;
    // le papier résiste : on tire, il suit à moitié, en pivotant autour de la perforation
    const dx = e.clientX - ox, dy = e.clientY - oy;
    x = dx * .55; y = dy * .55; a = borne(dx * .06 + dy * .03, -24, 24);
    appliquer();
  });
  const lacher = () => {
    if (!tenu) return;
    tenu = false;
    if (Math.hypot(x, y) > 70 || Math.hypot(vx, vy) > 18) {
      parti = true; va = (vx >= 0 ? 1 : -1) * 4;
      if (Math.abs(vy) < 4) vy = 4;
      setTimeout(() => { parti = false; x = 0; y = 0; a = 0; vx = vy = va = 0; talon.style.transition = 'opacity .6s ease'; appliquer(); talon.style.opacity = '0'; requestAnimationFrame(() => { talon.style.opacity = '1'; }); setTimeout(() => { talon.style.transition = ''; }, 700); }, 1600);
    } else { vx = vy = 0; }
  };
  talon.addEventListener('pointerup', lacher);
  talon.addEventListener('pointercancel', lacher);
  return (dt) => {
    if (tenu) return;
    const k = dt / 16.67;
    if (parti) { vy += .9 * k; x += vx * k; y += vy * k; a += va * k; appliquer(); return; }
    if (Math.abs(x) + Math.abs(y) + Math.abs(a) < .05) return;
    // ressort amorti : le talon revient se recoller
    vx = (vx + (-x * .12) * k) * Math.pow(.78, k); vy = (vy + (-y * .12) * k) * Math.pow(.78, k); va = (va + (-a * .12) * k) * Math.pow(.78, k);
    x += vx * k; y += vy * k; a += va * k;
    appliquer();
  };
}

// --- démarrage -----------------------------------------------------------------------------------------------
H.classList.add('pret');
await chargement();
const lisse = fin ? defilementDoux() : null;
const barre = navigation(lisse);
apparitions();
const maj = scenes();
const ressort = billet();
let avant = performance.now(), yAvant = -1, lAvant = innerWidth;
const boucle = (t) => {
  const dt = Math.min(64, t - avant); avant = t;
  lisse?.pas(dt);
  ressort?.(dt);
  if (scrollY !== yAvant || innerWidth !== lAvant) {
    yAvant = scrollY; lAvant = innerWidth;
    barre();
    for (const f of maj) f();
  }
  requestAnimationFrame(boucle);
};
requestAnimationFrame(boucle);
addEventListener('resize', () => { yAvant = -1; });
