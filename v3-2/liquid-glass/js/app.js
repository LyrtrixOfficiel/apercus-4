// Liquid glass : démarrage et comportements.
// 1. Praticien (?p=) et palette (?palette=), rendu depuis le JSON.
// 2. Chargement : la pastille de verre aux initiales, qui s'ouvre quand le vrai rendu est prêt (2,5 s au plus, un toucher la passe).
// 3. Scènes WebGL (verre.js), créées à l'approche et libérées au loin ; repli en verre CSS.
// 4. Ce qui « morphe » comme chez Apple : barre d'onglets qui sort du trait de l'écran verrouillé, se rétracte en
//    descendant et se redéploie en remontant ; pastille liquide ; bouton qui s'étire en menu ; capsule qui s'étire
//    en feuille ; contrôle segmenté dont la pastille s'étire d'une étape à l'autre ; verre qui gonfle sous le doigt.
// Rien ne suit la souris. Mouvement réduit : mêmes gestes, ressorts amortis, plus courts, jamais coupés.
import { rendre, variables } from './rendu.js';
import { Scene, adapter, lumZone } from './verre.js';
import { papiers } from './papier.js';
import { lentilles } from './lentille.js';

const html = document.documentElement;
const racine = document.getElementById('racine');
const reduit = matchMedia('(prefers-reduced-motion: reduce)').matches;
const petit = matchMedia('(max-width: 760px)').matches || matchMedia('(pointer: coarse)').matches;
const pause = (ms) => new Promise((r) => setTimeout(r, Math.max(0, ms)));
const lisse = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// ---------------------------------------------------------------- ressort (amortissement réel, pas de saccade)
class Ressort {
  constructor(v = 0, raideur = 170, amorti = 0.72) { this.v = v; this.cible = v; this.vit = 0; this.k = raideur; this.z = amorti; }
  pas(dt) {
    const k = reduit ? this.k * 1.5 : this.k, z = reduit ? 1 : this.z, c = 2 * Math.sqrt(k) * z;
    let t = dt;
    while (t > 1e-6) { const h = Math.min(t, 1 / 120); this.vit += (k * (this.cible - this.v) - c * this.vit) * h; this.v += this.vit * h; t -= h; }
    if (Math.abs(this.cible - this.v) < 1e-4 && Math.abs(this.vit) < 1e-3) { this.v = this.cible; this.vit = 0; return false; }
    return true;
  }
}

// ---------------------------------------------------------------- données
async function donnees() {
  let d = JSON.parse(document.getElementById('donnees').textContent);
  const q = new URLSearchParams(location.search);
  const p = q.get('p'), pal = q.get('palette');
  let changer = false;
  if (p && /^[a-z0-9-]+$/.test(p) && p !== d.dossier) {
    try { const r = await fetch(`../donnees/${p}.json`); if (r.ok) { d = await r.json(); changer = true; } } catch { /* on garde la page écrite */ }
  }
  if (pal && pal !== html.dataset.palette) changer = true;
  const out = rendre(d, { palette: pal });
  if (changer) {
    racine.innerHTML = out.html;
    html.setAttribute('style', variables(out.palette));
    html.dataset.palette = out.palette.id; html.dataset.ton = out.palette.ton;
    document.title = out.titre;
    document.querySelector('meta[name="description"]')?.setAttribute('content', out.description);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', out.couleur);
  }
  html.classList.remove('attente');
  return { d, out, change: changer };
}

// ---------------------------------------------------------------- boucle d'images à la demande
const modules = [];
const scenes = new Set();
const etat = { reduit, lumiere: [-0.55, -0.83] };
let inclinaison = 0;
let enCours = false, calme = 0, tPrec = 0, dernierY = -1;
function reveil() { calme = 0; if (!enCours) { enCours = true; tPrec = performance.now(); requestAnimationFrame(image); } }
function image(now) {
  const dt = Math.min(0.05, Math.max(0.001, (now - tPrec) / 1000)); tPrec = now;
  const sy = scrollY;
  let actif = sy !== dernierY;
  for (const m of modules) if (m.pas(dt, sy)) actif = true;
  // lumière : dérive lente avec la lecture (et l'inclinaison du téléphone sur Android), jamais la souris
  const th = Math.atan2(-0.83, -0.55) + 0.45 * Math.sin(sy / 850) + inclinaison;
  etat.lumiere = [Math.cos(th), Math.sin(th)];
  for (const s of scenes) s.dessiner(etat);
  dernierY = sy;
  calme = actif ? 0 : calme + 1;
  if (calme < 24) requestAnimationFrame(image); else enCours = false;
}

// transformation composée d'un élément de verre (intro, pression) : écrite une fois par image
function poser(el) {
  const t = el.__tr; if (!t) return;
  el.style.transform = (t.x || t.y || t.s !== 1) ? `translate(${(t.x || 0).toFixed(2)}px, ${(t.y || 0).toFixed(2)}px) scale(${(t.s ?? 1).toFixed(4)})` : '';
  el.style.opacity = t.a == null || t.a >= 0.999 ? '' : t.a.toFixed(3);
  (el.__verre ||= {}).alpha = t.a ?? 1;
}

// ---------------------------------------------------------------- scènes WebGL : créées à l'approche, libérées au loin
function scenesGL(palette) {
  let ok = false;
  try { const c = document.createElement('canvas'); const g = c.getContext('webgl2'); ok = !!g; g?.getExtension('WEBGL_lose_context')?.loseContext(); } catch { ok = false; }
  if (!ok) { html.classList.add('sans-gl'); return { premiere: async () => false }; }
  html.classList.add('gl');
  const animer = async (section) => {
    if (section.__scene !== undefined && section.__scene !== null) return section.__scene;
    const sc = new Scene(section, { palette, petit });
    section.__scene = sc;
    let bon = false;
    try { bon = await sc.demarrer(); } catch (e) { console.warn('verre indisponible', e); bon = false; }
    if (!bon || section.__scene !== sc) { if (section.__scene === sc) section.__scene = null; return null; }
    adapter(section);
    scenes.add(sc); sc.sale = true; reveil();
    return sc;
  };
  const liberer = (section) => { const sc = section.__scene; if (!sc) return; sc.liberer(); scenes.delete(sc); section.__scene = null; };
  const proche = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && animer(e.target)), { rootMargin: '110% 0px 110% 0px' });
  const loin = new IntersectionObserver((es) => es.forEach((e) => !e.isIntersecting && liberer(e.target)), { rootMargin: '320% 0px 320% 0px' });
  const sections = [...document.querySelectorAll('.scene')];
  return {
    premiere: (s) => animer(s),
    observer: () => sections.forEach((s) => { proche.observe(s); loin.observe(s); }),
    remesurer: () => { for (const s of scenes) { s.mesurer(); adapter(s.section); } reveil(); },
  };
}

// ---------------------------------------------------------------- intro de l'écran verrouillé
function creerIntro() {
  const hero = document.getElementById('accueil');
  const q = (s) => hero.querySelector(s);
  const prenom = q('[data-verre="texte"]');
  const v = (prenom.__verre ||= {});
  v.condense = 0;
  const elements = [
    { el: q('.ligne-date'), retard: 0.05, y: 14 },
    { el: q('.notif-fantome'), retard: 0.3, y: 36, s: 0.9 },
    { el: q('.notif'), retard: 0.24, y: 40, s: 0.92 },
    { el: q('.verrou-actions .capsule:first-child'), retard: 0.42, centre: 1 },
    { el: q('.verrou-actions .capsule:last-child'), retard: 0.42, centre: -1 },
    { el: q('.indicateur'), retard: 0.7, y: 10 },
  ].filter((x) => x.el);
  const douceur = reduit ? 0.35 : 1;
  for (const x of elements) {
    x.r = new Ressort(0, 120, 0.62);
    x.el.__tr = { x: 0, y: 0, s: 1, a: 0 };
    poser(x.el);
  }
  const cond = new Ressort(0, 26, 0.9);
  let t = -1;
  return {
    lancer() { t = 0; cond.cible = 1; reveil(); },
    pas(dt) {
      if (t < 0) return false;
      t += dt * (reduit ? 1.6 : 1);
      let bouge = cond.pas(dt);
      v.condense = Math.max(0, cond.v);
      for (const x of elements) {
        if (t >= x.retard * (reduit ? 0.6 : 1)) x.r.cible = 1;
        if (x.r.pas(dt)) bouge = true;
        const p = x.r.v, tr = x.el.__tr;
        tr.a = Math.max(0, Math.min(1, p * 1.4));
        tr.y = (1 - p) * (x.y || 0) * douceur;
        tr.s = 1 - (1 - p) * (1 - (x.s ?? 1)) * douceur;
        if (x.centre) {
          // les deux capsules naissent d'une seule, au centre, puis se séparent
          const parent = x.el.parentElement.getBoundingClientRect(), r = x.el.getBoundingClientRect();
          const ecart = (parent.left + parent.width / 2) - (r.left - (tr.x || 0) + r.width / 2);
          tr.x = (1 - p) * ecart * (reduit ? 0.5 : 1);
          tr.s = 0.86 + 0.14 * p;
        }
        poser(x.el);
      }
      return bouge || t < 1.2;
    },
  };
}

// ---------------------------------------------------------------- barre d'onglets, capsule du haut, apparence
function creerBarre() {
  const nav = document.querySelector('.barre-onglets');
  if (!nav) return { pas: () => false };
  const onglets = nav.querySelector('.onglets'), pastille = nav.querySelector('.onglets-pastille');
  const liens = [...nav.querySelectorAll('.onglet')], bouton = nav.querySelector('.bouton-rdv');
  const capNom = document.querySelector('.capsule-nom'), capRdv = document.querySelector('.capsule-rdv'), cn = document.querySelector('.cn-section');
  const hero = document.getElementById('accueil');
  const secs = ['accueil', 'approche', 'seance', 'tarifs', 'apropos', 'contact'].map((id) => document.getElementById(id)).filter(Boolean);
  const NOMS = { approche: 'Approche', seance: 'La séance', tarifs: 'Tarifs', apropos: 'À propos', contact: 'Rendez-vous' };
  const px = new Ressort(4, 300, 0.78), pw = new Ressort(68, 300, 0.78);
  let actif = null, cumul = 0, avant = scrollY, compact = false, visible = false, n = 0, premier = true;
  const verres = [onglets, bouton, capNom, capRdv, document.getElementById('menu-rdv')].filter(Boolean);
  const apparence = (el) => {
    const r = el.getBoundingClientRect();
    if (!r.width) return;
    let mode = null;
    for (const e of document.elementsFromPoint(r.left + r.width / 2, r.top + r.height / 2)) {
      if (e.closest('.barre-onglets, .haut-page, .menu-rdv, .chargement')) continue;
      const v = e.closest('[data-verre]:not([data-verre="voile"]):not([data-verre="texte"])');
      if (v && (v.classList.contains('sombre') || v.classList.contains('clair'))) { mode = v.classList.contains('sombre') ? 'sombre' : 'clair'; break; }
      const s = e.closest('.scene');
      if (s) { mode = lumZone(s, r) < 0.5 ? 'sombre' : 'clair'; break; }
    }
    if (!mode) return;
    el.classList.toggle('sombre', mode === 'sombre'); el.classList.toggle('clair', mode === 'clair');
  };
  return {
    pas(dt, sy) {
      const vh = innerHeight, hh = hero?.offsetHeight || vh;
      const vis = sy > hh * 0.42;
      if (vis !== visible) { visible = vis; html.classList.toggle('barre-visible', vis); if (!vis) { compact = false; html.classList.remove('barre-compacte'); } }
      const dy = sy - avant; avant = sy;
      if (dy && Math.sign(dy) !== Math.sign(cumul)) cumul = 0;
      cumul += dy;
      const sansOnglet = actif === 'contact';
      if (visible && !compact && !sansOnglet && cumul > 48 && sy > hh * 1.05) { compact = true; html.classList.add('barre-compacte'); }
      if (compact && sansOnglet) { compact = false; html.classList.remove('barre-compacte'); }
      if (compact && cumul < -24) { compact = false; html.classList.remove('barre-compacte'); }
      let id = 'accueil';
      for (const s of secs) if (s.getBoundingClientRect().top <= vh * 0.45) id = s.id;
      if (id !== actif) {
        actif = id;
        liens.forEach((a) => a.setAttribute('aria-current', String(a.dataset.cible === id)));
        if (cn) cn.textContent = NOMS[id] || '';
      }
      const lien = liens.find((a) => a.dataset.cible === id);
      pastille.style.opacity = lien ? '1' : '0';
      if (lien) { px.cible = lien.offsetLeft; pw.cible = lien.offsetWidth; if (premier) { px.v = px.cible; pw.v = pw.cible; premier = false; } }
      const b1 = px.pas(dt), b2 = pw.pas(dt);
      const etire = reduit ? Math.min(6, Math.abs(px.vit) * 0.008) : Math.min(30, Math.abs(px.vit) * 0.04);
      pastille.style.transform = `translateX(${(px.v - 4 - etire / 2).toFixed(2)}px)`;
      pastille.style.width = `${(pw.v + etire).toFixed(2)}px`;
      if (++n % 4 === 0 || dy) for (const el of verres) apparence(el);
      return b1 || b2;
    },
  };
}

// ---------------------------------------------------------------- bouton rond qui s'étire en menu
function creerMenu() {
  const bouton = document.querySelector('.bouton-rdv'), menu = document.getElementById('menu-rdv');
  if (!bouton || !menu) return { pas: () => false };
  const m = new Ressort(0, 150, 0.7);
  let ouvert = false;
  const enfants = [...menu.children];
  const basculer = (oui) => {
    ouvert = oui;
    bouton.setAttribute('aria-expanded', String(oui));
    if (oui) {
      // le menu naît du bouton : son coin bas droit EST le bouton, il s'étire vers le haut et la gauche
      const b = bouton.getBoundingClientRect();
      const L = Math.min(320, innerWidth - 24);
      const gauche = Math.max(12, Math.min(b.right - L, innerWidth - 12 - L));
      menu.style.left = `${gauche}px`; menu.style.right = 'auto';
      menu.style.width = `${Math.max(L, b.right - gauche)}px`;
      menu.style.bottom = `${Math.max(8, innerHeight - b.bottom)}px`;
      menu.style.paddingBottom = `${b.height + 12}px`;
      menu.hidden = false; m.cible = 1; menu.querySelector('a')?.focus({ preventScroll: true });
    } else m.cible = 0;
    html.classList.toggle('menu-ouvert', oui);
    reveil();
  };
  bouton.addEventListener('click', () => basculer(!ouvert));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) basculer(false); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && ouvert) { basculer(false); bouton.focus(); } });
  addEventListener('pointerdown', (e) => { if (ouvert && !e.target.closest('.menu-rdv, .bouton-rdv')) basculer(false); });
  return {
    pas(dt) {
      if (menu.hidden) return false;
      const bouge = m.pas(dt);
      const W = menu.offsetWidth, H = menu.offsetHeight;
      const b = bouton.getBoundingClientRect(), r = menu.getBoundingClientRect();
      // départ : exactement le bouton ; arrivée : tout le menu. La largeur part d'abord, la hauteur suit (étirement liquide).
      const p = Math.max(0, m.v);
      const pl = Math.min(1, p * 1.2), ph = lisse(0.08, 1, p) * (p > 1 ? p : 1);
      const haut = (b.top - r.top) * (1 - ph), gauche = (b.left - r.left) * (1 - pl);
      const droite = Math.max(0, (r.right - b.right) * (1 - pl)), bas = Math.max(0, (r.bottom - b.bottom) * (1 - ph));
      const rayon = b.height / 2 + (30 - b.height / 2) * Math.min(1, p);
      menu.style.clipPath = `inset(${Math.max(0, haut)}px ${droite}px ${bas}px ${Math.max(0, gauche)}px round ${rayon}px)`;
      const op = lisse(0.45, 0.95, p);
      enfants.forEach((c) => { c.style.opacity = op.toFixed(3); });
      if (!bouge && m.cible === 0) { menu.hidden = true; menu.style.clipPath = ''; }
      return bouge;
    },
  };
}

// ---------------------------------------------------------------- capsule « Mon approche » qui s'étire en feuille
function creerFeuille() {
  const el = document.querySelector('.feuille[data-morph]');
  if (!el) return { pas: () => false };
  const cap = el.querySelector('.feuille-capsule'), dedans = el.querySelector('.feuille-interieur');
  const m = new Ressort(0, 62, 0.66);
  const v = (el.__verre ||= {});
  let W = 0, H = 0, cw = 220;
  const ch = 56;
  const mesurer = () => { W = el.offsetWidth; H = el.offsetHeight; cw = Math.min(W, (cap?.offsetWidth || 200)); reveil(); };
  mesurer();
  new ResizeObserver(mesurer).observe(el);
  // on observe la section (le découpage de la feuille fausserait la mesure de sa propre visibilité)
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting) m.cible = 1;
    else if (e.boundingClientRect.top > 0) m.cible = 0;
    reveil();
  }, { threshold: 0, rootMargin: '0px 0px -22% 0px' }).observe(el.closest('.scene'));
  let dejaPose = false;
  return {
    pas(dt) {
      const bouge = m.pas(dt);
      const p = Math.max(0, m.v);
      const ew = Math.min(1.035, p * 1.3), eh = Math.max(0, (p - 0.14) / 0.86);
      const l = cw + (W - cw) * ew, h = ch + (H - ch) * Math.min(1.03, eh);
      const r = 28 + 8 * Math.min(1, p);
      if (!bouge && p >= 0.999) {
        if (!dejaPose) { el.style.clipPath = ''; v.forme = null; cap.style.opacity = '0'; dedans.style.opacity = ''; dejaPose = true; }
        return false;
      }
      dejaPose = false;
      el.style.clipPath = `inset(0 ${Math.max(0, W - l).toFixed(1)}px ${Math.max(0, H - h).toFixed(1)}px 0 round ${r.toFixed(1)}px)`;
      v.forme = { x: 0, y: 0, l, h, r };
      cap.style.opacity = (1 - lisse(0.04, 0.3, p)).toFixed(3);
      dedans.style.opacity = lisse(0.5, 0.92, p).toFixed(3);
      return bouge;
    },
  };
}

// ---------------------------------------------------------------- contrôle segmenté et panneaux qu'on fait glisser
function creerSegments() {
  const piste = document.querySelector('.etapes-piste'), cadre = document.querySelector('.etapes-cadre');
  const track = document.querySelector('.segments[role="tablist"]'), pouce = track?.querySelector('.segments-pouce');
  if (!piste || !track) return { pas: () => false };
  const boutons = [...track.querySelectorAll('.segment')], panneaux = [...piste.querySelectorAll('.etape')];
  const n = panneaux.length;
  if (!n) return { pas: () => false };
  const pos = new Ressort(0, 160, 0.8);
  let index = 0, pas_ = 1, glisse = null;
  const largeur = () => (panneaux[0].offsetWidth + parseFloat(getComputedStyle(piste).columnGap || getComputedStyle(piste).gap || 18));
  const choisir = (i, focus) => {
    index = Math.max(0, Math.min(n - 1, i)); pos.cible = index;
    boutons.forEach((b, k) => { b.setAttribute('aria-selected', String(k === index)); b.tabIndex = k === index ? 0 : -1; });
    if (focus) boutons[index]?.focus();
    reveil();
  };
  boutons.forEach((b, k) => b.addEventListener('click', () => choisir(k)));
  track.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { choisir(index + 1, true); e.preventDefault(); }
    if (e.key === 'ArrowLeft') { choisir(index - 1, true); e.preventDefault(); }
  });
  // glisser au doigt ou à la souris : la piste suit, puis se pose sur l'étape la plus proche
  cadre.addEventListener('pointerdown', (e) => {
    if (e.button > 0 || e.target.closest('a, button')) return;
    pas_ = largeur();
    glisse = { x: e.clientX, y: e.clientY, p0: pos.v, t: performance.now(), vx: 0, px: e.clientX, actif: false, id: e.pointerId };
  });
  addEventListener('pointermove', (e) => {
    if (!glisse || e.pointerId !== glisse.id) return;
    const dx = e.clientX - glisse.x, dy = e.clientY - glisse.y;
    if (!glisse.actif) {
      if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy) * 1.2) { glisse.actif = true; try { cadre.setPointerCapture(e.pointerId); } catch { /* rien */ } }
      else if (Math.abs(dy) > 10) { glisse = null; return; }
      else return;
    }
    const now = performance.now(), d = Math.max(1, now - glisse.t);
    glisse.vx = glisse.vx * 0.6 + ((e.clientX - glisse.px) / d) * 0.4; glisse.t = now; glisse.px = e.clientX;
    let p = glisse.p0 - dx / pas_;
    if (p < 0) p *= 0.35; if (p > n - 1) p = n - 1 + (p - (n - 1)) * 0.35;      // résistance élastique aux bouts
    pos.v = p; pos.vit = 0; pos.cible = p;
    reveil();
  });
  const lacher = (e) => {
    if (!glisse || (e && e.pointerId !== glisse.id)) return;
    if (glisse.actif) {
      const lance = -glisse.vx * 1000 / pas_;                                   // étapes par seconde
      pos.vit = lance;
      choisir(Math.round(pos.v + lance * 0.18));
    }
    glisse = null;
  };
  addEventListener('pointerup', lacher); addEventListener('pointercancel', lacher);
  return {
    pas(dt) {
      const bouge = pos.pas(dt);
      const p = pos.v;
      pas_ = largeur();
      piste.style.transform = `translate3d(${(-p * pas_).toFixed(2)}px,0,0)`;
      panneaux.forEach((el, k) => {
        const e = Math.min(1, Math.abs(k - p));
        const tr = (el.__tr ||= { x: 0, y: 0, s: 1, a: 1 });
        tr.s = 1 - 0.07 * e; tr.a = 1 - 0.5 * e;
        poser(el);
        el.setAttribute('aria-hidden', String(k !== index));
      });
      // la pastille glisse d'un segment à l'autre, s'étire avec la vitesse, et prend la largeur du segment
      if (pouce && boutons.length) {
        const i0 = Math.max(0, Math.min(n - 1, Math.floor(p))), i1 = Math.min(n - 1, i0 + 1), f = Math.max(0, Math.min(1, p - i0));
        const a = boutons[i0], b = boutons[i1];
        const x = a.offsetLeft + (b.offsetLeft - a.offsetLeft) * f, w = a.offsetWidth + (b.offsetWidth - a.offsetWidth) * f;
        const etire = reduit ? Math.min(6, Math.abs(pos.vit) * 6) : Math.min(46, Math.abs(pos.vit) * 30);
        pouce.style.transform = `translateX(${(x - 4 - etire / 2).toFixed(2)}px)`;
        pouce.style.width = `${(w + etire).toFixed(2)}px`;
        pouce.classList.toggle('sombre', track.classList.contains('sombre')); pouce.classList.toggle('clair', !track.classList.contains('sombre'));
      }
      return bouge || !!glisse;
    },
  };
}

// ---------------------------------------------------------------- le verre gonfle et s'allume sous le doigt (souris ou toucher)
function creerPressions() {
  const actifs = new Set();
  addEventListener('pointerdown', (e) => {
    const el = e.target.closest('.scene [data-verre]:not([data-verre="voile"]):not([data-verre="texte"])');
    if (!el) return;
    const canvas = el.closest('.scene')?.querySelector('canvas.scene-verre');
    const rc = canvas?.getBoundingClientRect();
    const v = (el.__verre ||= {});
    if (rc) { v.px = e.clientX - rc.left; v.py = e.clientY - rc.top; }
    v.pression = 1; v.appui = true;
    const gonfle = ['capsule', 'notif', 'lentille'].includes(el.dataset.verre) || el.classList.contains('action');
    if (gonfle) { el.__ech ||= new Ressort(1, 320, 0.5); el.__ech.cible = 1.06; }
    actifs.add(el); reveil();
  });
  const relache = () => { for (const el of actifs) { if (el.__verre) el.__verre.appui = false; if (el.__ech) el.__ech.cible = 1; } reveil(); };
  addEventListener('pointerup', relache); addEventListener('pointercancel', relache);
  return {
    pas(dt) {
      let bouge = false;
      for (const el of actifs) {
        const v = el.__verre;
        if (!v.appui) v.pression = Math.max(0, v.pression - dt * 2.2);
        let b = v.pression > 0;
        if (el.__ech) { if (el.__ech.pas(dt)) b = true; const tr = (el.__tr ||= { x: 0, y: 0, s: 1, a: 1 }); tr.s = el.__ech.v; poser(el); }
        if (!b && !v.appui) actifs.delete(el); else bouge = true;
      }
      return bouge;
    },
  };
}

// ---------------------------------------------------------------- petites choses
function vcards() {
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-vcard]');
    if (!a) return;
    e.preventDefault();
    const texte = decodeURIComponent(a.getAttribute('href').split(',').slice(1).join(','));
    const url = URL.createObjectURL(new Blob([texte], { type: 'text/vcard' }));
    const lien = document.createElement('a'); lien.href = url; lien.download = a.getAttribute('download') || 'contact.vcf';
    document.body.appendChild(lien); lien.click(); lien.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  });
}
function inclinaisonAndroid() {
  if (!('DeviceOrientationEvent' in window) || typeof DeviceOrientationEvent.requestPermission === 'function') return;
  addEventListener('deviceorientation', (e) => { if (e.gamma == null) return; inclinaison = Math.max(-0.6, Math.min(0.6, e.gamma / 60)); reveil(); });
}

// ---------------------------------------------------------------- démarrage
async function demarrer() {
  const t0 = performance.now();
  const { out, change } = await donnees();
  const palette = out.palette;
  const chargement = document.querySelector('.chargement');
  papiers(palette, petit);
  for (const s of document.querySelectorAll('.scene')) {
    const img = s.querySelector('.scene-fond img');
    const faire = () => { adapter(s); reveil(); };
    if (!img || img.complete) faire(); else img.addEventListener('load', faire, { once: true });
  }
  const gl = scenesGL(palette);
  const intro = creerIntro();
  modules.push(intro, creerBarre(), creerMenu(), creerFeuille(), creerSegments(), creerPressions());
  lentilles([...document.querySelectorAll('.verre-dom')]);
  vcards(); inclinaisonAndroid();
  addEventListener('scroll', reveil, { passive: true });
  let attente;
  addEventListener('resize', () => { clearTimeout(attente); attente = setTimeout(() => { document.querySelectorAll('.scene').forEach((s) => adapter(s)); gl.remesurer?.(); }, 160); reveil(); });

  // ce qui doit être prêt avant d'ouvrir : la police, la photo de l'accueil, le verre compilé et dessiné une fois
  // la feuille de Google Fonts est chargée sans bloquer l'affichage : on attend qu'elle arrive, puis la police
  const attendrePolice = async () => {
    const lien = document.querySelector('link[data-police]');
    if (lien && lien.rel !== 'stylesheet') await new Promise((r) => { lien.addEventListener('load', r, { once: true }); lien.addEventListener('error', r, { once: true }); });
    await document.fonts?.load('800 120px Inter'); await document.fonts?.load('400 17px Inter'); await document.fonts?.ready;
  };
  const police = Promise.race([attendrePolice(), pause(1800)]);
  // si la police arrive après l'ouverture, le verre des lettres et les mesures sont refaits
  document.fonts?.addEventListener?.('loadingdone', () => { document.querySelectorAll('.scene').forEach((s) => adapter(s)); gl.remesurer?.(); });
  const pret = (async () => {
    await police;
    const sc = await gl.premiere(document.getElementById('accueil'));
    if (sc) { sc.preparerTexte(); adapter(sc.section); sc.sale = true; sc.dessiner(etat); }
  })();
  gl.observer?.();
  reveil();

  let ouvert = false;
  const ouvrir = () => {
    if (ouvert) return;
    ouvert = true;
    html.classList.remove('charge');
    if (chargement) { chargement.classList.add('ouvre'); setTimeout(() => chargement.remove(), 900); }
    intro.lancer();
    if (change && location.hash) { const cible = document.getElementById(location.hash.slice(1)); if (cible) cible.scrollIntoView({ behavior: 'instant', block: 'start' }); }
  };
  chargement?.addEventListener('pointerdown', ouvrir);
  addEventListener('keydown', ouvrir, { once: true });
  await Promise.race([pret.then(() => pause((reduit ? 500 : 900) - (performance.now() - t0))), pause(2500 - (performance.now() - t0))]);
  ouvrir();
}

demarrer().catch((e) => { console.error(e); html.classList.remove('charge', 'attente'); document.querySelector('.chargement')?.remove(); });
