// Pop vitaminé : démarrage et mouvements de la page.
// 1. Praticien (?p=) et palette (?palette=), rendu depuis le JSON.
// 2. Chargement : les initiales qui sautent sur le duo de couleurs, jusqu'à ce que les objets soient prêts (2,5 s au plus).
// 3. Les objets (scene.js) : on les attrape, on les lance. Rien ne suit la souris.
// 4. La page : l'étiquette qui se colle, la boîte qui se déplie au défilement, le ticket qui s'imprime,
//    les autocollants (photographiés par le moteur 3D) qui se collent et sautent quand on les touche.
// Mouvement réduit : tout reste, en plus court et sans rebond ; ce que le visiteur pilote marche pareil.
import { rendre, variables } from './rendu.js';
import { OBJETS_PAR_FAMILLE, NOMS_OBJETS } from './objets-liste.js';
import { SPRITES } from './sprites.js';

const html = document.documentElement;
const racine = document.getElementById('racine');
const reduit = matchMedia('(prefers-reduced-motion: reduce)').matches;
const petit = matchMedia('(max-width: 760px)').matches || matchMedia('(pointer: coarse)').matches;
const pause = (ms) => new Promise((r) => setTimeout(r, Math.max(0, ms)));
const lisse = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

async function donnees() {
  let d = JSON.parse(document.getElementById('donnees').textContent);
  const q = new URLSearchParams(location.search);
  const p = q.get('p'), pal = q.get('palette');
  let changer = false;
  if (p && /^[a-z0-9-]+$/.test(p) && p !== d.dossier) {
    try { const r = await fetch(`../donnees/${p}.json`); if (r.ok) { d = await r.json(); changer = true; } } catch { /* page écrite */ }
  }
  if (pal && pal !== html.dataset.palette) changer = true;
  const out = rendre(d, { palette: pal });
  if (changer) {
    racine.innerHTML = out.html;
    html.setAttribute('style', variables(out.palette));
    html.dataset.palette = out.palette.id;
    document.title = out.titre;
    document.querySelector('meta[name="description"]')?.setAttribute('content', out.description);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', out.couleur);
  }
  html.classList.remove('attente');
  return { d, out, change: changer };
}

function menu() {
  const bouton = document.querySelector('.bouton-menu'), panneau = document.getElementById('menu');
  if (!bouton || !panneau) return;
  const libelle = bouton.querySelector('.vh');
  const ouvrir = (oui) => {
    bouton.setAttribute('aria-expanded', String(oui));
    libelle.textContent = oui ? 'Fermer le menu' : 'Ouvrir le menu';
    html.classList.toggle('menu-ouvert', oui);
    if (oui) { panneau.hidden = false; requestAnimationFrame(() => panneau.classList.add('ouvert')); panneau.querySelector('a')?.focus(); }
    else { panneau.classList.remove('ouvert'); setTimeout(() => { if (!panneau.classList.contains('ouvert')) panneau.hidden = true; }, reduit ? 260 : 600); }
  };
  bouton.addEventListener('click', () => ouvrir(bouton.getAttribute('aria-expanded') !== 'true'));
  panneau.addEventListener('click', (e) => { if (e.target.closest('a')) ouvrir(false); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && bouton.getAttribute('aria-expanded') === 'true') { ouvrir(false); bouton.focus(); } });
  // le menu prend les couleurs de la section en cours
  const io = new IntersectionObserver((es) => {
    for (const e of es) if (e.isIntersecting) {
      const cs = getComputedStyle(e.target);
      for (const v of ['--a', '--b', '--encre']) panneau.style.setProperty(v, cs.getPropertyValue(v));
      html.style.setProperty('--tete-encre', cs.getPropertyValue('--encre'));
    }
  }, { rootMargin: '-45% 0px -54% 0px' });
  document.querySelectorAll('[data-scene]').forEach((s) => io.observe(s));
}

// le nom géant remplit sa largeur, quelle que soit sa longueur
function ajusterNom() {
  const h1 = document.querySelector('.geant');
  if (!h1) return;
  const regler = () => {
    h1.style.fontSize = '';
    const css = parseFloat(getComputedStyle(h1).fontSize);
    const dispo = h1.parentElement.clientWidth;
    const large = Math.max(...[...h1.querySelectorAll('.ligne')].map((l) => { const r = document.createRange(); r.selectNodeContents(l); return r.getBoundingClientRect().width; }));
    if (!large || !dispo) return;
    const max = innerWidth <= 760 ? innerWidth * 0.25 : Math.min(170, innerHeight * 0.2);
    h1.style.fontSize = Math.min(max, css * 1.5, css * (dispo * 0.98) / large).toFixed(1) + 'px';
  };
  regler();
  let t; addEventListener('resize', () => { clearTimeout(t); t = setTimeout(regler, 120); });
}

// lettres du nom qui sautent à l'arrivée (une fois)
function lettres() {
  const h1 = document.querySelector('.geant');
  if (!h1) return;
  h1.querySelectorAll('.ligne').forEach((ligne, li) => {
    const texte = ligne.textContent; ligne.textContent = '';
    [...texte].forEach((c, i) => { const s = document.createElement('span'); s.className = 'lettre'; s.textContent = c === ' ' ? ' ' : c; s.style.setProperty('--d', `${(li * 5 + i) * (reduit ? 18 : 34)}ms`); ligne.appendChild(s); });
  });
}

// apparitions : l'étiquette se colle, l'affiche se scotche, les titres sautent
function apparitions() {
  const els = document.querySelectorAll('[data-pop]');
  const io = new IntersectionObserver((es) => {
    for (const e of es) if (e.isIntersecting) { e.target.classList.add('vu'); io.unobserve(e.target); }
  }, { rootMargin: '0px 0px -12% 0px' });
  els.forEach((e) => io.observe(e));
  const ticket = document.querySelector('.imprimante');
  if (ticket) new IntersectionObserver(([e], o) => { if (e.isIntersecting) { ticket.classList.add('imprime'); o.disconnect(); } }, { rootMargin: '0px 0px -18% 0px' }).observe(ticket);
}

// les autocollants : l'image de l'objet (photographiée par le moteur 3D, ou la photo déposée), bord blanc découpé ;
// ils se collent en arrivant à l'écran et sautent quand on les touche (souris ou doigt)
function autocollants(images) {
  const els = [...document.querySelectorAll('.autocollant[data-objet]')];
  if (!els.length || !images) return;
  const io = new IntersectionObserver((es) => {
    for (const e of es) if (e.isIntersecting) { e.target.classList.add('colle'); io.unobserve(e.target); }
  }, { rootMargin: '0px 0px -10% 0px' });
  images.then((im) => {
    for (const el of els) {
      const s = im?.[el.dataset.objet];
      if (!s?.autocollant) continue;
      const img = new Image(); img.alt = ''; img.draggable = false; img.decoding = 'async'; img.src = s.autocollant;
      el.style.setProperty('--ratio', (s.la / s.ha).toFixed(4));
      el.appendChild(img); el.hidden = false;
      io.observe(el);
      el.addEventListener('pointerdown', () => { el.classList.remove('saute'); void el.offsetWidth; el.classList.add('saute'); });
    }
  }).catch(() => {});
}

// la séance : le patron d'une boîte. Fermée en arrivant, elle se déplie à plat pendant qu'on fait défiler.
// Grand écran : vraie boîte (côtés, dos, rabats et languette pliés autour de la face avant, charnière par charnière).
// Écran étroit : bande pliée en accordéon qui se déplie vers le bas.
function patron() {
  const zone = document.querySelector('.patron-zone'), el = zone?.querySelector('.patron');
  if (!el) return () => false;
  const nom = ['avant', 'gauche', 'languette', 'droite', 'dos', 'haut', 'bas'];
  const pans = Object.fromEntries(nom.map((k) => [k, el.querySelector('.pa-' + k)]).filter(([, v]) => v));
  el.classList.add('pliable');
  let geo = null, dernier = -1;
  const mesurer = () => {
    for (const p of Object.values(pans)) p.style.transform = '';
    el.style.transform = '';
    geo = { large: getComputedStyle(el).getPropertyValue('--mode').trim() !== 'colonne', L: el.offsetWidth, H: el.offsetHeight };
    for (const [k, p] of Object.entries(pans)) geo[k] = { x: p.offsetLeft, y: p.offsetTop, l: p.offsetWidth, h: p.offsetHeight, vis: p.offsetParent !== null && getComputedStyle(p).display !== 'none' };
    dernier = -1;
  };
  const V = (x, a) => `translate3d(${x.toFixed(1)}px,0,0) rotateY(${a.toFixed(3)}deg) translate3d(${(-x).toFixed(1)}px,0,0)`;
  const Hz = (y, a) => `translate3d(0,${y.toFixed(1)}px,0) rotateX(${a.toFixed(3)}deg) translate3d(0,${(-y).toFixed(1)}px,0)`;
  const poser = (k, chaine) => { const g = geo[k]; if (!g) return; pans[k].style.transform = `translate3d(${-g.x}px,${-g.y}px,0) ${chaine} translate3d(${g.x}px,${g.y}px,0)`; };
  const regler = () => {
    if (!geo) mesurer();
    const r = zone.getBoundingClientRect(), vh = innerHeight;
    const p = lisse(0, 1, (vh * 0.95 - r.top) / (vh * (reduit ? 0.5 : 0.7)));
    if (Math.abs(p - dernier) < 0.0005) return false;
    dernier = p;
    if (p > 0.999) { for (const q of Object.values(pans)) q.style.transform = ''; el.classList.add('a-plat'); return true; }
    el.classList.remove('a-plat');
    const th = (1 - p) * (reduit ? 42 : 90);
    if (geo.large) {
      const A = geo.avant, D = geo.gauche?.l || A.l * 0.6, cx = A.x + A.l / 2, cy = A.y + A.h / 2;
      const dx = (geo.L / 2 - cx) * (1 - p);
      const ry = -24 * (1 - p) * (reduit ? 0.5 : 1), rx = -12 * (1 - p) * (reduit ? 0.5 : 1);
      const G = `translate3d(${(cx + dx).toFixed(1)}px,${cy.toFixed(1)}px,${(-D / 2 * (th / 90)).toFixed(1)}px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translate3d(${(-cx).toFixed(1)}px,${(-cy).toFixed(1)}px,${(D / 2 * (th / 90)).toFixed(1)}px)`;
      const gA = V(A.x, -th), dA = V(A.x + A.l, th);
      poser('avant', G);
      poser('gauche', `${G} ${gA}`);
      if (geo.languette && geo.gauche) poser('languette', `${G} ${gA} ${V(geo.gauche.x, -th)}`);
      poser('droite', `${G} ${dA}`);
      if (geo.dos && geo.droite) poser('dos', `${G} ${dA} ${V(geo.droite.x + geo.droite.l, th)}`);
      poser('haut', `${G} ${Hz(A.y, th)}`);
      poser('bas', `${G} ${Hz(A.y + A.h, -th)}`);
    } else {
      // accordéon : chaque panneau pend au bas du précédent, un sur deux vers l'arrière
      const ordre = Object.keys(pans).filter((k) => geo[k].vis).sort((a, b) => geo[a].y - geo[b].y);
      const t = (th * Math.PI) / 180;
      const total = ordre.reduce((s, k) => s + geo[k].h, 0), plie = ordre.reduce((s, k) => s + geo[k].h * Math.cos(t), 0);
      let y = 0, somme = 0;
      ordre.forEach((k, i) => {
        const g = geo[k], z = i % 2 ? -geo[ordre[i - 1]].h * Math.sin(t) : 0;
        const dy = (total - plie) / 2 + y - somme;
        pans[k].style.transform = `translate3d(0,${dy.toFixed(1)}px,${z.toFixed(1)}px) rotateX(${(i % 2 ? th : -th).toFixed(3)}deg)`;
        y += g.h * Math.cos(t); somme += g.h;
      });
    }
    return true;
  };
  addEventListener('resize', () => { geo = null; requestAnimationFrame(regler); });
  new ResizeObserver(() => { geo = null; requestAnimationFrame(regler); }).observe(el);
  return regler;
}

async function demarrer() {
  const t0 = performance.now();
  const { d, out, change } = await donnees();
  const chargement = document.querySelector('.chargement');
  const police = Promise.race([document.fonts?.load('800 100px Bricolage').then(() => document.fonts.ready), pause(1500)]);
  await police;
  ajusterNom();
  menu();
  lettres();
  apparitions();
  const plier = patron();
  let attenteImage = false;
  const tick = () => { attenteImage = false; plier(); };
  addEventListener('scroll', () => { if (!attenteImage) { attenteImage = true; requestAnimationFrame(tick); } }, { passive: true });
  plier();
  // les objets
  const q = new URLSearchParams(location.search);
  const liste = OBJETS_PAR_FAMILLE[out.famille] || OBJETS_PAR_FAMILLE.elan;
  if (q.has('atelier')) {
    // ?atelier : tous les objets côte à côte (contrôle de rendu), sans texte
    const h = document.querySelector('.scene3d-accueil');
    h.dataset.objets = q.get('atelier') || Object.keys(NOMS_OBJETS).join(',');
    document.querySelector('.accueil-texte').style.visibility = 'hidden';
    document.querySelector('.astuce')?.remove();
  }
  const besoinImages = [...new Set([...document.querySelectorAll('.autocollant[data-objet]')].map((e) => e.dataset.objet))];
  let objetsPrets = Promise.resolve();
  try {
    const { lancerObjets } = await import('./scene.js');
    const mode = ['3d', 'sprites'].includes(q.get('rendu')) ? q.get('rendu') : 'auto';
    // on n'abandonne jamais les objets s'ils tardent : le chargement s'ouvre au bout de 2,5 s au plus,
    // et les objets (puis les autocollants) arrivent dès qu'ils sont prêts
    const lance = lancerObjets({ P: out.palette, d, liste, reduit, petit, sprites: SPRITES, mode, besoinImages });
    lance.then((o) => autocollants(o?.images), (e) => { console.warn('objets indisponibles', e); html.classList.add('sans-gl'); });
    objetsPrets = lance.then((o) => o?.pret, () => null);
  } catch (e) { console.warn('objets indisponibles', e); html.classList.add('sans-gl'); }
  // la petite astuce disparaît au premier geste
  const astuce = document.querySelector('.astuce');
  document.querySelector('.scene3d-accueil')?.addEventListener('pointerdown', () => astuce?.classList.add('lue'), { once: true });

  let ouvert = false;
  const ouvrir = () => {
    if (ouvert) return;
    ouvert = true;
    html.classList.remove('charge'); html.classList.add('ouvert');
    if (chargement) { chargement.classList.add('part'); setTimeout(() => chargement.remove(), 900); }
    if (change && location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: 'instant' });
  };
  chargement?.addEventListener('pointerdown', ouvrir);
  await Promise.race([objetsPrets.then(() => pause((reduit ? 450 : 850) - (performance.now() - t0))), pause(2500 - (performance.now() - t0))]);
  ouvrir();
}

demarrer().catch((e) => { console.error(e); html.classList.remove('charge', 'attente'); document.querySelector('.chargement')?.remove(); });
