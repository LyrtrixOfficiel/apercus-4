// Kazura v14 : la page « Le domaine Kazura ». Le défilement mène le récit (7 chapitres) ; le moteur 3D (domaine.js)
// déplace la caméra, et cette page pose par-dessus les textes, les étiquettes ancrées, la consigne du moment
// et le curseur de l'heure. Sans WebGL : la même histoire, illustrée par des images du domaine.

import { monter } from './domaine.js';

const q = new URLSearchParams(location.search);
const opt = (n, d) => (q.has(n) ? q.get(n) !== '0' : d);
const reduit = opt('reduit', matchMedia('(prefers-reduced-motion: reduce)').matches);
const mobile = opt('mobile', matchMedia('(pointer: coarse)').matches || innerWidth < 760);
const NB = 7;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const borne = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const doux = (t) => t * t * (3 - 2 * t);
const corps = document.body;
if (reduit) corps.classList.add('reduit');
if (q.has('propre')) document.head.insertAdjacentHTML('beforeend', '<style>.dk-tete,.dk-sommaire,.dk-recit,.dk-bas,.dk-hud,.dk-traits,.dk-etiquettes,.dk-voile{display:none!important}</style>');

/* ---------- la piste de défilement ---------- */
const piste = $('.dk-piste-defilement');
let hCh = 1, margeG = 8;
function dimensionner() {
  hCh = Math.round(innerHeight * (mobile ? 1.3 : 1.5));
  piste.style.height = `${NB * hCh + innerHeight}px`;
  mesurerPanneaux();
  const so = document.querySelector('.dk-sommaire ol');
  margeG = mobile || !so ? 8 : so.getBoundingClientRect().right + 14;
}
const sDuDefilement = () => borne(scrollY / hCh, 0, NB);

/* ---------- les chapitres ---------- */
const chapitres = $$('.dk-ch');
const fin = $('.dk-fin');
function visibilite(i, s) {
  const a = i - 0.16, b = i + 0.02;
  const c = i === NB - 1 ? 6.64 : i + 0.6, d = i === NB - 1 ? 6.74 : i + 0.72;
  const entree = i === 0 ? 1 : borne((s - a) / (b - a));
  return doux(entree) * (1 - doux(borne((s - c) / (d - c))));
}
const rects = new Map();
function mesurerPanneaux() {
  for (const el of chapitres) {
    const st = el.style.visibility; el.style.visibility = 'hidden'; el.style.display = 'block';
    rects.set(el.dataset.ch, el.getBoundingClientRect());
    el.style.visibility = st;
  }
}

/* ---------- les étiquettes ancrées ---------- */
const SVGNS = 'http://www.w3.org/2000/svg';
const traits = $('.dk-traits');
const etiquettes = $$('.dk-et').map((el) => {
  const g = document.createElementNS(SVGNS, 'g');
  const ligne = document.createElementNS(SVGNS, 'polyline');
  const point = document.createElementNS(SVGNS, 'circle'); point.setAttribute('r', '2.6');
  const halo = document.createElementNS(SVGNS, 'circle'); halo.setAttribute('r', '7'); halo.setAttribute('class', 'dk-halo');
  g.append(ligne, halo, point); traits.appendChild(g); g.style.opacity = '0';
  return { el, g, ligne, point, halo, id: el.dataset.ancre, ch: Number(el.dataset.ch), dx: Number(el.dataset.dx), dy: Number(el.dataset.dy), gauche: el.hasAttribute('data-g'), l: 0, h: 0, rang: 0 };
});
{ const parCh = {}; for (const e of etiquettes) { e.rang = parCh[e.ch] = (parCh[e.ch] ?? -1) + 1; } }
function mesurerEtiquettes() { for (const e of etiquettes) { e.l = e.el.offsetWidth; e.h = e.el.offsetHeight; } }

function poserEtiquettes(s, ancres, temps) {
  const k = mobile ? 0.62 : Math.min(1.6, Math.max(1, innerHeight / 900));
  for (const e of etiquettes) {
    const a = ancres?.[e.id];
    let o = 0;
    if (a && a.v && !(mobile && e.rang > 1)) {
      const t0 = e.ch + 0.08 + e.rang * 0.05, t1 = e.ch + 0.58;
      o = doux(borne((s - t0) / 0.1)) * (1 - doux(borne((s - t1) / 0.1)));
    }
    if (o < 0.01) { if (e.vu) { e.el.style.opacity = '0'; e.g.style.opacity = '0'; e.vu = false; } continue; }
    let dx = e.dx * k, dy = e.dy * k;
    // l'étiquette reste dans l'écran : on la retourne de l'autre côté du point si besoin
    if (dx < 0 && a.x + dx - e.l < margeG) dx = -dx;
    else if (dx > 0 && a.x + dx + e.l > innerWidth - 8) dx = -dx;
    if (a.y + dy - e.h / 2 < 70) dy = Math.abs(dy);
    const gauche = dx < 0;
    const coude = [a.x + dx * 0.55, a.y + dy], bout = [a.x + dx, a.y + dy];
    const x = gauche ? bout[0] - e.l - 2 : bout[0] + 2, y = bout[1] - e.h / 2;
    // pas d'étiquette sous le texte du chapitre
    const r = rects.get(String(e.ch));
    let cache = false;
    if (r && x < r.right && x + e.l > r.left && y < r.bottom && y + e.h > r.top) cache = true;
    if (cache) o *= 0;
    e.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
    e.el.style.opacity = o.toFixed(3);
    e.g.style.opacity = o.toFixed(3);
    e.ligne.setAttribute('points', `${a.x.toFixed(1)},${a.y.toFixed(1)} ${coude[0].toFixed(1)},${coude[1].toFixed(1)} ${bout[0].toFixed(1)},${bout[1].toFixed(1)}`);
    e.point.setAttribute('cx', a.x.toFixed(1)); e.point.setAttribute('cy', a.y.toFixed(1));
    e.halo.setAttribute('cx', a.x.toFixed(1)); e.halo.setAttribute('cy', a.y.toFixed(1));
    e.halo.setAttribute('r', (reduit ? 7 : 6 + 2.5 * (0.5 + 0.5 * Math.sin(temps * 2.4 + e.rang))).toFixed(2));
    e.vu = true;
  }
}

/* ---------- la consigne du moment ---------- */
const ICONES = {
  defiler: '<svg viewBox="0 0 24 24"><rect x="7" y="3" width="10" height="16" rx="5"/><path d="M12 7v3M9 21.5l3 1.5 3-1.5"/></svg>',
  main: '<svg viewBox="0 0 24 24"><path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V10m0-.5V4a1.5 1.5 0 0 1 3 0v6m0-1.5a1.5 1.5 0 0 1 3 0V14a7 7 0 0 1-7 7h-.6a6 6 0 0 1-4.6-2.2L3.4 15a1.6 1.6 0 0 1 2.4-2.1L9 15.5"/></svg>',
  heure: '<svg viewBox="0 0 24 24"><circle cx="8" cy="12" r="3.2"/><path d="M8 4.5v1.6M8 17.9v1.6M2 12h1.6M3.8 7.8l1.1 1.1M3.8 16.2l1.1-1.1"/><path d="M20.5 15.2A5.4 5.4 0 0 1 14.8 8a5.4 5.4 0 1 0 5.7 7.2z"/></svg>',
  souris: '<svg viewBox="0 0 24 24"><path d="M5 3l6 16 2.4-6.6L20 10z"/></svg>',
  tourner: '<svg viewBox="0 0 24 24"><path d="M4 12a8 8 0 0 1 13.7-5.6L20 8.5M20 4v4.5h-4.5M20 12a8 8 0 0 1-13.7 5.6L4 15.5M4 20v-4.5h4.5"/></svg>',
};
const consigne = $('.dk-consigne'), consigneIcone = $('.dk-consigne-icone'), consigneTexte = $('.dk-consigne-texte');
let consigneCh = -1;
function poserConsigne(ch, vis) {
  const visible = vis > 0.55 && ch >= 0;
  if (visible && ch !== consigneCh) {
    const g = chapitres[ch].querySelector('.dk-geste');
    consigneTexte.textContent = (mobile && g.dataset.tel) || g.textContent;
    consigneIcone.innerHTML = ICONES[g.dataset.icone] || '';
    consigneIcone.dataset.icone = g.dataset.icone;
    consigneCh = ch;
  }
  consigne.classList.toggle('dk-visible', visible);
}

/* ---------- l'heure ---------- */
const temps = $('.dk-temps'), pisteH = $('.dk-piste'), curseur = $('.dk-curseur'), rempli = $('.dk-rempli');
const heureTexte = $('.dk-heure'), momentTexte = $('.dk-moment'), rendre = $('.dk-rendre');
const HORAIRE = [[0, 15], [0.42, 19.5], [0.64, 21.2], [0.82, 22.6], [1, 24.5]];
function horloge(h) {
  let i = 0; while (i < HORAIRE.length - 2 && h > HORAIRE[i + 1][0]) i++;
  const [a, x] = HORAIRE[i], [b, y] = HORAIRE[i + 1];
  const v = (x + ((h - a) / (b - a)) * (y - x)) % 24;
  const m = Math.floor(v * 60);
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}
const NOM = (h) => (h < 0.24 ? 'Jour' : h < 0.54 ? 'Heure dorée' : h < 0.74 ? 'Crépuscule' : 'Nuit');
let hAffichee = -1;
function poserHeure(h, main) {
  if (Math.abs(h - hAffichee) > 0.0005) {
    hAffichee = h;
    curseur.style.left = `${(h * 100).toFixed(2)}%`;
    rempli.style.transform = `scaleX(${h.toFixed(4)})`;
    const nom = NOM(h), hh = horloge(h);
    if (momentTexte.textContent !== nom) momentTexte.textContent = nom;
    if (heureTexte.textContent !== hh) heureTexte.textContent = hh;
    temps.setAttribute('aria-valuenow', String(Math.round(h * 100)));
    temps.setAttribute('aria-valuetext', `${nom}, ${hh}`);
  }
  if (rendre.hidden === !!main) rendre.hidden = !main;
}

/* ---------- le décor : sommaire, jauge, coordonnées ---------- */
const liensSommaire = $$('.dk-sommaire a');
const jauge = $('.dk-jauge i');
const lat = $('.dk-lat'), lon = $('.dk-lon'), alt = $('.dk-alt');
let chActif = -1, image = 0;
function poserDecor(s, cam) {
  const ch = Math.min(NB - 1, Math.floor(s + 0.15));
  if (ch !== chActif) { chActif = ch; liensSommaire.forEach((a, i) => { a.classList.toggle('dk-actif', i === ch); if (i === ch) a.setAttribute('aria-current', 'step'); else a.removeAttribute('aria-current'); }); }
  jauge.style.transform = `scaleY(${(s / NB).toFixed(4)})`;
  if (cam && image % 6 === 0) {
    lat.textContent = `${(48.2494 + (cam[2] + 560) / 111200).toFixed(4)}° N`;
    lon.textContent = `${(7.3444 + (cam[0] - 30) / 74100).toFixed(4)}° E`;
    alt.textContent = `ALT ${String(Math.round(180 + cam[1])).padStart(3, '0')} M`;
  }
}

/* ---------- appliquer un état (à chaque image du moteur, ou de la boucle du repli) ---------- */
let derniereVis = [], vfAvant = -1;
function appliquer(info) {
  const s = info.s;
  image++;
  let chVis = -1, maxVis = 0;
  chapitres.forEach((el, i) => {
    const v = visibilite(i, s);
    if (Math.abs(v - (derniereVis[i] ?? -1)) > 0.002) {
      el.style.opacity = v.toFixed(3);
      el.style.visibility = v > 0.01 ? 'visible' : 'hidden';
      el.style.transform = reduit ? '' : `translateY(${((1 - v) * 16).toFixed(1)}px)`;
      derniereVis[i] = v;
    }
    if (v > maxVis) { maxVis = v; chVis = i; }
  });
  const vf = doux(borne((s - 6.78) / 0.12));
  if (Math.abs(vf - vfAvant) > 0.002 || (vf === 0) !== (vfAvant === 0)) {
    vfAvant = vf;
    fin.style.opacity = vf.toFixed(3); fin.style.visibility = vf > 0.01 ? 'visible' : 'hidden';
    fin.inert = vf < 0.5;
    fin.style.transform = reduit ? '' : `translateY(${((1 - vf) * 16).toFixed(1)}px)`;
  }
  poserConsigne(chVis, vf > 0.3 ? 0 : maxVis);
  poserEtiquettes(s, info.ancres, performance.now() / 1000);
  if (info.h !== undefined) poserHeure(info.h, info.main);
  poserDecor(s, info.cam);
  if (repli) poserRepli(s);
}

/* ---------- le repli sans WebGL : l'histoire en images ---------- */
let repli = false;
const imgs = $$('.dk-affiche img');
let imgVue = -1;
function poserRepli(s) {
  const ch = Math.min(NB - 1, Math.floor(s + 0.12));
  if (ch === imgVue) return;
  imgVue = ch;
  imgs.forEach((im, i) => {
    if (Math.abs(i - ch) <= 1 && !im.getAttribute('src') && im.dataset.src) im.src = im.dataset.src;
    im.classList.toggle('dk-vue', i === ch);
  });
}

/* ---------- le montage ---------- */
dimensionner();
mesurerEtiquettes();
addEventListener('resize', () => { dimensionner(); mesurerEtiquettes(); }, { passive: true });
if (document.fonts?.ready) document.fonts.ready.then(() => { mesurerEtiquettes(); mesurerPanneaux(); });

// arrivée sur un chapitre précis (#ch-4) : on s'y pose directement
const ancreInitiale = /^#ch-(\d)$/.exec(location.hash);
if (ancreInitiale) scrollTo(0, (Number(ancreInitiale[1]) - 1 + (ancreInitiale[1] === '1' ? 0 : 0.3)) * hCh);
const sInitial = sDuDefilement();

const moteur = monter($('#scene'), { reduit, mobile, fixe: q.has('fixe'), forcerRepli: q.has('repli'), surImage: appliquer });
moteur.aller(sInitial);
appliquer({ s: sInitial });

addEventListener('scroll', () => moteur.cible(sDuDefilement()), { passive: true });

// la boucle du repli (le moteur ne tourne pas)
let sRepli = sInitial, tRepli = 0;
function boucleRepli(t) {
  const dt = tRepli ? Math.min(0.05, (t - tRepli) / 1000) : 0.016; tRepli = t;
  sRepli += (sDuDefilement() - sRepli) * (1 - Math.exp(-dt * 5));
  appliquer({ s: sRepli });
  requestAnimationFrame(boucleRepli);
}

moteur.pret.then((r) => {
  corps.classList.remove('attente');
  if (r.etat === 'vivant') corps.classList.add('vivant');
  else { repli = true; corps.classList.add('repli'); imgVue = -1; requestAnimationFrame(boucleRepli); }
});

/* le sommaire : glisser jusqu'au chapitre */
for (const a of liensSommaire) {
  a.addEventListener('click', (e) => {
    e.preventDefault();
    const i = Number(a.dataset.aller);
    scrollTo({ top: (i === 0 ? 0 : i + 0.3) * hCh, behavior: reduit ? 'auto' : 'smooth' });
    history.replaceState(null, '', `#ch-${i + 1}`);
  });
}

/* le curseur de l'heure : souris, doigt, clavier */
let tire = null;
const posPiste = (e) => { const r = pisteH.getBoundingClientRect(); return borne((e.clientX - r.left) / r.width); };
temps.addEventListener('pointerdown', (e) => { e.preventDefault(); tire = e.pointerId; temps.setPointerCapture?.(e.pointerId); temps.classList.add('dk-tire'); moteur.heureMain(posPiste(e), true); });
temps.addEventListener('pointermove', (e) => { if (tire === e.pointerId) moteur.heureMain(posPiste(e), true); });
const finTire = (e) => { if (tire === e.pointerId) { tire = null; temps.classList.remove('dk-tire'); moteur.heureMain(posPiste(e), false); } };
temps.addEventListener('pointerup', finTire); temps.addEventListener('pointercancel', finTire);
temps.addEventListener('keydown', (e) => {
  const h = moteur.etat().h;
  const pas = { ArrowRight: 0.05, ArrowUp: 0.05, ArrowLeft: -0.05, ArrowDown: -0.05, PageUp: 0.2, PageDown: -0.2 }[e.key];
  if (pas !== undefined) { e.preventDefault(); moteur.heureMain(borne(h + pas)); }
  else if (e.key === 'Home') { e.preventDefault(); moteur.heureMain(0); }
  else if (e.key === 'End') { e.preventDefault(); moteur.heureMain(1); }
});
rendre.addEventListener('click', () => moteur.heureMain(null));

/* pour les essais et les captures */
window.__domaine = {
  moteur,
  aller(s) { scrollTo(0, s * hCh); moteur.aller(s); sRepli = s; appliquer({ s }); },
  heure(h) { moteur.heureMain(h); },
};
