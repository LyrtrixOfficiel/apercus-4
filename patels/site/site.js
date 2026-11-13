// Patel's Indienne Esthétique : tout ce qui bouge.
// Un seul moteur (requestAnimationFrame) qui s'arrête dès que rien ne bouge ; presque tout passe par transform et opacity.
// Le site ne lit JAMAIS le réglage « moins de mouvement » du système. Mode calme sur demande : ?calme=1 (classe calme sur html).
(() => {
'use strict';
const H = document.documentElement, C = window.CONTENU || { prestations: [], vernis: [], holi: ['#d4145f'] };
const calme = H.classList.contains('calme');
const $ = (s, c = document) => c.querySelector(s), $$ = (s, c = document) => [...c.querySelectorAll(s)];
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const NS = 'http://www.w3.org/2000/svg';
const sv = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };
const borne = (v, a, b) => Math.min(b, Math.max(a, v));
const motif = (id, cls) => `<svg viewBox="0 0 100 100"${cls ? ` class="${cls}"` : ''} aria-hidden="true"><use href="#m-${id}"/></svg>`;
const sombre = (hex) => { const n = parseInt(hex.slice(1), 16); return (.299 * (n >> 16) + .587 * (n >> 8 & 255) + .114 * (n & 255)) < 150; };
const rejoue = (e, cls) => { e.classList.remove(cls); e.getBoundingClientRect(); e.classList.add(cls); };

// ---------- le moteur ----------
const ticks = new Set(); let raf = 0, dernier = 0;
function boucle(t) { const dt = Math.min(.05, (t - dernier) / 1000 || .016); dernier = t; for (const f of [...ticks]) if (f(dt, t) === false) ticks.delete(f); raf = ticks.size ? requestAnimationFrame(boucle) : 0; }
function anime(f) { ticks.add(f); if (!raf) { dernier = performance.now(); raf = requestAnimationFrame(boucle); } }

let vw = innerWidth, vh = innerHeight, sy = scrollY;
const surDefile = [], surTaille = [];
let demande = false;
function defile() { demande = false; const y = scrollY, v = y - sy; sy = y; for (const f of surDefile) f(y, v); }
addEventListener('scroll', () => { if (!demande) { demande = true; requestAnimationFrame(defile); } }, { passive: true });
let tt = 0;
addEventListener('resize', () => { clearTimeout(tt); tt = setTimeout(() => { const l = innerWidth !== vw; vw = innerWidth; vh = innerHeight; for (const f of surTaille) f(l); defile(); }, 180); });

// Positions gardées en mémoire : le défilement ne relit jamais la mise en page, il calcule avec scrollY.
// Remesurées au chargement, au redimensionnement, après les polices et dès que la hauteur de la page change.
const pos = new Map();
const haut = (e) => { let t = 0; for (let x = e; x; x = x.offsetParent) t += x.offsetTop; return t; };
const suivre = (e) => { if (e) pos.set(e, { t: haut(e), h: e.offsetHeight }); };
const remesure = () => { for (const e of pos.keys()) suivre(e); };
const rect = (e) => { const p = pos.get(e) || { t: 0, h: 0 }, top = p.t - sy; return { top, bottom: top + p.h, height: p.h }; };
const redemande = () => { if (!demande) { demande = true; requestAnimationFrame(defile); } };
surTaille.push(remesure);
if ('ResizeObserver' in window) new ResizeObserver(() => { remesure(); redemande(); }).observe(document.body);
addEventListener('load', () => { remesure(); redemande(); });
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { remesure(); redemande(); });

// Vigie : les rubriques loin de l'écran mettent leurs animations sans fin en pause (classe hors), elles repartent avant d'être revues.
const vigie = new IntersectionObserver((es) => { for (const e of es) e.target.classList.toggle('hors', !e.isIntersecting); }, { rootMargin: '30% 0px' });

// La page Bonjour change la couleur d'ambiance
addEventListener('message', (e) => { const d = e.data; if (d && d.type === 'kazura-couleur' && /^[a-z]+$/.test(d.palette || '')) H.setAttribute('data-palette', d.palette); });

// Entrées de section
const io = new IntersectionObserver((es) => { for (const e of es) if (e.isIntersecting) { e.target.classList.add('vu'); io.unobserve(e.target); } }, { threshold: .16, rootMargin: '0px 0px -5% 0px' });
const voir = (sel, f, seuil = .35) => { const e = typeof sel === 'string' ? $(sel) : sel; if (!e) return; const o = new IntersectionObserver((es) => { for (const x of es) f(x.isIntersecting, o); }, { threshold: seuil }); o.observe(e); };

// Poignée de couleur (Holi) : de grosses taches pleines qui s'ouvrent et s'effacent
function holi(x, y, n, portee, couleurs) {
  if (calme) return;
  for (let i = 0; i < n; i++) {
    const b = el('i', 'holi'), t = 44 + Math.random() * portee * .7, a = Math.random() * 6.283, d = portee * (.35 + Math.random() * .9);
    const q = () => 38 + Math.round(Math.random() * 24);
    b.style.cssText = `width:${t}px;height:${t * (.7 + Math.random() * .5)}px;margin:${-t / 2}px 0 0 ${-t / 2}px;background:${couleurs[i % couleurs.length]};border-radius:${q()}% ${100 - q()}% ${q()}% ${100 - q()}%/${q()}% ${q()}% ${100 - q()}% ${100 - q()}%;rotate:${Math.round(Math.random() * 360)}deg`;
    document.body.appendChild(b);
    b.animate([{ transform: `translate(${x}px,${y}px) scale(.1)`, opacity: 1 }, { transform: `translate(${x + Math.cos(a) * d}px,${y + Math.sin(a) * d}px) scale(1)`, opacity: .96, offset: .5 }, { transform: `translate(${x + Math.cos(a) * d * 1.12}px,${y + Math.sin(a) * d * 1.12 + 26}px) scale(1.12)`, opacity: 0 }], { duration: 900 + Math.random() * 600, easing: 'cubic-bezier(.15,.8,.3,1)' }).onfinish = () => b.remove();
  }
}

// ---------- navigation : menu, pile de bracelets ----------
const sections = $$('main section[data-nom]');
const nav = $('#nav'), pile = $('#pile'), menu = $('#menu'), menuBt = $('#menu-bt');
sections.forEach((s, i) => {
  const nom = s.dataset.nom, a = () => { const l = el('a'); l.href = '#' + s.id; l.dataset.vers = s.id; return l; };
  if (i > 0 && s.id !== 'avis') { const l = a(); l.textContent = nom; nav.appendChild(l); }
  const p = a(); p.style.setProperty('--c', s.dataset.c); p.style.setProperty('--i', i); p.innerHTML = `<span>${nom}</span>`; p.setAttribute('aria-label', nom); pile.appendChild(p);
  const m = a(); m.textContent = nom; m.style.setProperty('--i', i); menu.appendChild(m);
});
const fermeMenu = () => { menu.classList.remove('ouvert'); menuBt.setAttribute('aria-expanded', 'false'); $('b', menuBt).textContent = 'Menu'; };
menuBt.addEventListener('click', () => { const o = !menu.classList.contains('ouvert'); menu.classList.toggle('ouvert', o); menuBt.setAttribute('aria-expanded', o); $('b', menuBt).textContent = o ? 'Fermer' : 'Menu'; });
menu.addEventListener('click', (e) => { if (e.target.closest('a')) fermeMenu(); });
addEventListener('keydown', (e) => { if (e.key === 'Escape') fermeMenu(); });
let ici = '';
sections.forEach(suivre);
const liens = $$('[data-vers]'), roule = $('.brac', menuBt);
function ouSuisJe(y) {
  let id = sections[0].id;
  for (const s of sections) if (rect(s).top <= vh * .42) id = s.id;
  if (id !== ici) { ici = id; liens.forEach((l) => l.classList.toggle('ici', l.dataset.vers === id)); if (!calme && vw >= 1180) { rejoue(pile, 'tinte'); } }
  roule.style.transform = `rotate(${(y * .3).toFixed(1)}deg)`;
}
surDefile.push(ouSuisJe);

// ---------- bordures de sari : un rang de motifs tiré par le défilement ----------
const rangs = $$('.bordure').map((b) => { const r = el('div', 'b-rang'), f = el('div', 'b-file'); r.appendChild(f); b.appendChild(r); suivre(b); return { b, f, r, m: b.dataset.motif, sens: +(b.dataset.sens || 1), pas: 1, o: NaN }; });
const dpr = Math.min(3, devicePixelRatio || 1);
function garnir() {
  for (const g of rangs) {
    const h = g.r.clientHeight, cote = h - 26, cell = cote + 2 * h * .06, n = (Math.ceil(vw / cell) + 5) & ~1;
    const alt = g.m === 'mangue' ? 'r' : g.m === 'feuille' ? 'h' : '';
    let s = ''; for (let i = 0; i < n; i++) s += motif(g.m, i % 2 ? alt : '');
    g.f.innerHTML = s; g.pas = cell * 2; g.o = NaN;
  }
}
// Seules les bordures proches de l'écran bougent ; le décalage est arrondi au pixel d'écran.
surDefile.push((y) => {
  for (const g of rangs) {
    const r = rect(g.b); if (r.bottom < -80 || r.top > vh + 80) continue;
    const o = Math.round(((((y * .32 * g.sens) % g.pas) + g.pas) % g.pas) * dpr) / dpr;
    if (o !== g.o) { g.o = o; g.f.style.transform = `translate3d(${-o}px,0,0)`; }
  }
});
surTaille.push((l) => { if (l) garnir(); });

// ---------- accueil : l'enseigne peinte, la guirlande, la bande ----------
const acc = $('#acc'), ens = $('#ens-nom'), accueil = $('#accueil');
[...'Patel’s'].forEach((c, i) => {
  const s = el('span', i >= 5 ? 's' : '', c); s.style.setProperty('--i', i); s.style.setProperty('--r', (i % 2 ? -7 : 7) + 'deg'); ens.appendChild(s);
  const saute = () => { if (!calme) rejoue(s, 'saute'); };
  s.addEventListener('pointerenter', saute); s.addEventListener('pointerdown', saute);
});
{
  const mots = ['Coiffure', 'Ongles', 'Épilation', 'Cils', 'Soins du visage', 'Massages', 'Produits cosmétiques'];
  const un = mots.map((m, i) => `<span>${m}</span>${motif(i % 2 ? 'lotus' : 'souci')}`).join('');
  $('#bande-file').innerHTML = un + un + un + un;
}
requestAnimationFrame(() => requestAnimationFrame(() => acc.classList.add('pret')));

let brins = [];
function toran() {
  const t = $('#toran'); t.textContent = ''; brins = [];
  const tel = vw < 700, s = tel ? 18 : borne(vw * .0155, 22, 28), pasB = s * .8, n = Math.max(9, Math.round(vw / (tel ? 30 : 44)));
  // Au-dessus du contenu, la guirlande reste courte ; dans les marges de la page, elle descend comme un rideau.
  const tx = $('.acc-texte').getBoundingClientRect(), im = $('.acc-image').getBoundingClientRect();
  const gauche = Math.min(tx.left, im.left) - 14, droite = Math.max(tx.right, im.right) + 14;
  const libre = parseFloat(getComputedStyle(acc).paddingTop) - 16, dedans = borne(Math.floor((libre - s * 1.35) / pasB), 1, 3), maxi = borne(Math.min(vw * .1, vh * .26), 58, 210);
  for (let i = 0; i < n; i++) {
    const x = (i + .5) / n * vw; let nb;
    if (x > gauche && x < droite) nb = Math.max(1, dedans - (i % 2));
    else { const marge = Math.max(70, x <= gauche ? gauche : vw - droite), dist = x <= gauche ? gauche - x : x - droite; nb = dedans + Math.floor(Math.pow(Math.min(1, dist / marge), 1.2) * maxi / pasB) + (i % 2 ? 0 : 1); }
    const b = el('div', 'brin'); b.style.left = ((i + .5) / n * 100) + '%'; b.style.setProperty('--s', s + 'px');
    let h = `<b style="height:${Math.round(nb * pasB + 8)}px"></b>`;
    for (let k = 0; k < nb; k++) { const j = (k + i) % 3; h += `<i style="top:${Math.round(4 + k * pasB)}px;--b1:var(--t${j === 1 ? 2 : 1});--b2:var(--t${j === 0 ? 2 : j === 1 ? 1 : 3})"></i>`; }
    h += `<u style="top:${Math.round(4 + nb * pasB - s * .12)}px"></u>`;
    b.innerHTML = h; t.appendChild(b); brins.push({ b, a: 0, v: 0, x: (i + .5) / n, l: nb * pasB + s * 1.3 });
  }
}
function tickToran(dt) {
  // L'accueil est sorti de l'écran : la guirlande s'immobilise sans qu'on la voie, plus rien n'est écrit.
  if (sy > accH()) { for (const o of brins) { o.a = o.v = 0; o.b.style.transform = ''; } return false; }
  let vif = false;
  for (const o of brins) {
    o.v += (-42 * o.a - 2.6 * o.v) * dt; o.a = borne(o.a + o.v * dt, -40, 40);
    if (Math.abs(o.a) > .05 || Math.abs(o.v) > .4) vif = true;
    o.b.style.transform = `rotate(${o.a.toFixed(2)}deg)`;
  }
  return vif;
}
function secoue(f) { if (calme) return; brins.forEach((o, i) => { o.v += f(o, i); }); anime(tickToran); }
suivre(accueil);
const accH = () => rect(accueil).height;
surDefile.push((y, v) => { if (y < accH() && v) secoue(() => borne(v, -40, 40) * (1.1 + Math.random() * .8)); });
accueil.addEventListener('pointermove', (e) => { const r = accueil.getBoundingClientRect(), x = e.clientX / vw, y = e.clientY - r.top - 62; if (y > 240) return; secoue((o) => (Math.abs(o.x - x) * vw < 70 && y < o.l + 26) ? borne(e.movementX || 0, -30, 30) * 4 : 0); });
setInterval(() => { if (sy < vh * .8 && !document.hidden) { const ph = Math.random() * 6; secoue((o, i) => 30 * Math.sin(i * .45 + ph)); } }, 3800);
surTaille.push((l) => { if (l) toran(); });

// Photos qui glissent dans leur arche
const photoAcc = $('#acc-photo'), photoMas = $('#mas-img');
suivre(photoMas.parentNode);
surDefile.push((y) => {
  if (y < vh * 1.3) photoAcc.style.transform = `translate3d(0,${(-13 + borne(y / vh, 0, 1) * 12).toFixed(2)}%,0)`;
  const r = rect(photoMas.parentNode);
  if (r.bottom > 0 && r.top < vh) photoMas.style.transform = `translate3d(0,${(-12 + borne((vh - r.top) / (vh + r.height), 0, 1) * 11).toFixed(2)}%,0)`;
});

// ---------- le rangoli : il se dessine au défilement, on repeint ses pétales ----------
function rangoli() {
  // Un svg par anneau, empilés dans le même ordre qu'avant : chacun tourne en calque à part (compositeur), rien n'est repeint.
  const svg = $('#rangoli'), boite = svg.parentNode, col = C.holi;
  const couche = (cls) => { const d = el('div', 'an'), s = sv('svg', { viewBox: '-205 -205 410 410', 'aria-hidden': 'true' }); if (cls) s.setAttribute('class', cls); d.appendChild(s); svg.appendChild(d); return { d, s }; };
  const anneaux = [
    { n: 16, d: 'M0-150C17-162 20-188 0-203C-20-188-17-162 0-150Z', c: ['#04676a', '#19a59c'], dur: 160, o: 3 },
    { n: 12, d: 'M0-90C24-106 28-136 0-158C-28-136-24-106 0-90Z', c: ['#f7a806', '#d9390f'], dur: 115, o: 2 },
    { n: 8, d: 'M0-30C26-46 30-78 0-100C-30-78-26-46 0-30Z', c: ['#d4145f', '#ff8fb5'], dur: 80, o: 1 },
  ];
  const groupes = [];
  for (const a of anneaux) {
    const { d: g, s: t } = couche('tr' + (a.o % 2 ? '' : ' inv')); t.style.setProperty('--dur', a.dur + 's');
    for (let k = 0; k < a.n; k++) { const r = sv('g', { transform: `rotate(${k * 360 / a.n})` }, t), c = a.c[k % 2]; const p = sv('path', { class: 'pet', d: a.d, fill: c }, r); p.dataset.k = Math.max(0, col.indexOf(c)); }
    groupes.push({ g, o: a.o, e: -1 });
  }
  const { d: dc, s: centre } = couche(''); sv('circle', { r: 34, fill: '#1b1560' }, centre);
  const u = sv('use', { href: '#m-lotus', x: -27, y: -27, width: 54, height: 54 }, centre); u.style.cssText = '--m1:#fff4e0;--m2:#f7a806;--m3:#d4145f';
  groupes.push({ g: dc, o: 0, e: -1 });
  suivre(boite);
  function pose() {
    const r = rect(boite); if (r.bottom < -200 || r.top > vh + 200) return;
    const p = calme ? 1 : borne((vh - r.top) / (vh * .8), 0, 1);
    for (const x of groupes) {
      const q = borne(p * 1.7 - x.o * .22, 0, 1), e = +(1 - Math.pow(1 - q, 3)).toFixed(3);
      if (e === x.e) continue; x.e = e;
      // calque réservé seulement pendant que l'anneau se dessine : posé, il est retracé à sa vraie taille, net
      x.g.classList.toggle('bouge', e > 0 && e < 1);
      x.g.style.transform = e >= 1 ? '' : `rotate(${((1 - e) * (x.o % 2 ? -110 : 110)).toFixed(1)}deg) scale(${e})`;
    }
  }
  surDefile.push(pose); pose();
  svg.addEventListener('click', (e) => {
    const p = e.target.closest('.pet'); if (!p) return;
    const i = (+p.dataset.k + 1 + Math.floor(Math.random() * (col.length - 1))) % col.length; p.dataset.k = i; p.style.fill = col[i];
    if (!calme) p.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.4)' }, { transform: 'scale(1)' }], { duration: 520, easing: 'cubic-bezier(.3,1.6,.5,1)' });
    holi(e.clientX, e.clientY, 5, 110, [col[i]]);
  });
}

// ---------- les bracelets : un par prestation ----------
function bracelets() {
  const tr = $('#tringle'), P = C.prestations, fiche = $('#fiche'), voile = $('#fiche-voile'), fb = $('#fiche-brac');
  const nom = $('#fiche-nom'), phrase = $('#fiche-phrase'), lignes = $('#fiche-lignes'), vers = $('#fiche-vers'), photo = $('#fiche-photo'), img = $('#fiche-img');
  let actif = -1, minuterie = 0;
  P.forEach((p, i) => {
    const b = el('button', 'anneau', `<span class="brac" aria-hidden="true"></span><span class="an-nom">${p.court || p.nom}</span>`); b.type = 'button'; b.setAttribute('role', 'tab');
    b.style.setProperty('--c', p.c); b.style.setProperty('--o', p.o); b.style.setProperty('--i', i); if (sombre(p.c)) b.style.setProperty('--ct', '#fff4e0');
    b.addEventListener('click', () => choisir(i, true)); tr.appendChild(b);
  });
  const anneaux = $$('.anneau', tr);
  function remplir(p) {
    nom.textContent = p.nom; phrase.textContent = p.phrase;
    lignes.innerHTML = p.lignes.map((l) => `<div class="ligne"><span>${l}</span><i></i></div>`).join('');
    vers.textContent = p.versTexte; vers.setAttribute('href', p.vers);
    fiche.style.setProperty('--c', p.c); fb.style.setProperty('--c', p.c); fb.style.setProperty('--o', p.o);
    if (p.photo) { img.src = 'photos/' + p.photo + '.webp'; img.alt = p.alt || ''; photo.classList.remove('vide'); } else photo.classList.add('vide');
  }
  function tinte(i) { if (calme) return; anneaux.forEach((b, k) => { b.style.setProperty('--i', Math.abs(k - i)); rejoue(b, 'tinte'); }); }
  function choisir(i, joue) {
    if (i === actif) { tinte(i); return; }
    actif = i; const p = P[i];
    anneaux.forEach((b, k) => { b.classList.toggle('on', k === i); b.setAttribute('aria-selected', k === i ? 'true' : 'false'); });
    if (!joue || calme) { remplir(p); return; }
    tinte(i); voile.style.background = p.c;
    voile.animate([{ transform: 'translateX(-103%)' }, { transform: 'translateX(0)', offset: .4 }, { transform: 'translateX(0)', offset: .56 }, { transform: 'translateX(103%)' }], { duration: 950, easing: 'cubic-bezier(.6,0,.3,1)' });
    clearTimeout(minuterie);
    minuterie = setTimeout(() => { remplir(p); fb.animate([{ transform: 'translateX(-330%) rotate(-500deg)' }, { transform: 'translateX(0) rotate(0deg)' }], { duration: 900, easing: 'cubic-bezier(.2,.9,.3,1.12)' }); }, 430);
  }
  if (P.length) choisir(0, false);
}

// ---------- les ongles : le nuancier en éventail ----------
function ongles() {
  const nu = $('#nuancier'), pots = $('#pots'), etat = $('#ong-etat');
  const liste = [...C.vernis, ['Dissolvant', '']]; let teinte = liste[0];
  const angles = [-50, -25, 0, 25, 50], hauteurs = [.86, .96, 1, .94, .8];
  const tiges = angles.map((a, i) => {
    const t = el('button', 'tige', '<span class="ongle"><i></i></span>'); t.type = 'button'; t.style.setProperty('--a', a + 'deg'); t.style.setProperty('--i', i); t.style.height = `calc(var(--tl)*${hauteurs[i]})`; t.setAttribute('aria-label', 'Ongle ' + (i + 1) + ' du nuancier');
    nu.appendChild(t); return t;
  });
  nu.appendChild(el('span', 'rivet'));
  liste.forEach((v, i) => {
    const b = el('button', 'pot' + (i ? '' : ' on'), `<i></i><span>${v[0]}</span>`); b.type = 'button'; b.style.setProperty('--v', v[1] || '#fff4e0'); b.setAttribute('aria-pressed', i ? 'false' : 'true');
    b.addEventListener('click', () => { teinte = v; $$('.pot', pots).forEach((x) => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); }); if (!v[1]) { tiges.forEach(efface); dire(); } });
    pots.appendChild(b);
  });
  function efface(t) { const o = $('.ongle', t); o.classList.remove('verni'); o.style.background = ''; o.dataset.v = ''; o.dataset.n = ''; }
  function vernir(t) {
    const o = $('.ongle', t), f = $('i', o);
    if (!teinte[1]) { efface(t); dire(); return; }
    if (o.dataset.v === teinte[1]) return;
    if (o.dataset.v) o.style.background = o.dataset.v;
    f.style.transition = 'none'; o.classList.remove('verni'); f.getBoundingClientRect(); f.style.transition = '';
    o.style.setProperty('--v', teinte[1]); o.dataset.v = teinte[1]; o.dataset.n = teinte[0];
    requestAnimationFrame(() => o.classList.add('verni')); dire();
  }
  const MOTS = ['Aucun', 'Un', 'Deux', 'Trois', 'Quatre', 'Cinq'];
  function dire() {
    const faits = tiges.map((t) => $('.ongle', t).dataset.n).filter(Boolean), n = faits.length;
    if (!n) etat.textContent = 'Cinq ongles nus : à vous.';
    else if (n < 5) etat.textContent = `${MOTS[n]} sur cinq : continuez.`;
    else {
      etat.textContent = 'Cinq sur cinq. Les vrais se posent à l’institut.';
      if (!calme) { rejoue(nu, 'bravo'); const r = nu.getBoundingClientRect(); holi(r.left + r.width / 2, r.top + r.height * .3, 12, Math.min(vw, 620) * .4, tiges.map((t) => $('.ongle', t).dataset.v)); }
    }
  }
  // Deux ongles déjà vernis : on comprend tout de suite que c'est un nuancier.
  teinte = liste[0]; vernir(tiges[0]); teinte = liste[1]; vernir(tiges[1]); teinte = liste[0];
  let appui = false;
  tiges.forEach((t) => { t.addEventListener('click', () => vernir(t)); t.addEventListener('pointerenter', () => { if (appui) vernir(t); }); });
  nu.addEventListener('pointerdown', () => { appui = true; }); addEventListener('pointerup', () => { appui = false; });
}

// ---------- le fil : on épile le sourcil ----------
function fil() {
  const boite = $('#fil-jeu'), svg = $('#fil-svg'), nEl = $('#fil-n'), tEl = $('#fil-t'), fin = $('#fil-fin');
  const POILS = [[.08, -.11], [.22, -.2], [.38, -.27], [.54, -.3], [.7, -.26], [.86, -.18], [1, -.08], [.16, .25], [.32, .15], [.48, .09], [.64, .06], [.8, .08], [.94, .14], [-.08, .03]];
  let W = 0, Hh = 0, cx = 0, cy = 0, poils = [], lignes = [], noeud = null, retires = 0, touche = false, demo = null, rayon = 30, vu = false;
  const k = { x: 0, y: 0, tx: 0, ty: 0 };
  function monte() {
    const r = boite.getBoundingClientRect(); W = Math.round(r.width); Hh = Math.round(r.height); if (!W) return;
    svg.setAttribute('viewBox', `0 0 ${W} ${Hh}`); svg.textContent = '';
    const bw = Math.min(W * .62, Hh * .86, 430), x0 = W / 2 - bw / 2, x1 = W / 2 + bw / 2, e = bw / 400, e2 = Math.max(e, .78);
    cx = W / 2; cy = Hh * .36; rayon = 26 + 10 * e;
    sv('path', { class: 'sourcil', fill: '#1b1560', d: `M${x0} ${cy + bw * .1}C${x0 + bw * .18} ${cy - bw * .16} ${x0 + bw * .6} ${cy - bw * .22} ${x1} ${cy + bw * .04}C${x0 + bw * .66} ${cy - bw * .08} ${x0 + bw * .3} ${cy - bw * .02} ${x0 + bw * .04} ${cy + bw * .21}Q${x0 - bw * .035} ${cy + bw * .16} ${x0} ${cy + bw * .1}Z` }, svg);
    const ey = cy + bw * .38, ex0 = cx - bw * .3, ex1 = cx + bw * .3, ec = ey + bw * .2;
    sv('path', { d: `M${ex0} ${ey}Q${cx} ${ec} ${ex1} ${ey}`, fill: 'none', stroke: '#1b1560', 'stroke-width': Math.max(9, 14 * e), 'stroke-linecap': 'round' }, svg);
    for (let i = 0; i < 7; i++) {
      const t = .1 + .8 * i / 6, u = 1 - t, px = u * u * ex0 + 2 * u * t * cx + t * t * ex1, py = u * u * ey + 2 * u * t * ec + t * t * ey;
      const ang = Math.atan2(2 * u * (ec - ey) + 2 * t * (ey - ec), 2 * u * (cx - ex0) + 2 * t * (ex1 - cx)) * 180 / Math.PI + (t - .5) * -50;
      const g = sv('g', { transform: `translate(${px.toFixed(1)} ${py.toFixed(1)}) rotate(${ang.toFixed(1)})` }, svg);
      const c = sv('path', { class: 'cil', fill: '#1b1560', d: `M${-7 * e2} 0Q${-8 * e2} ${30 * e2} 0 ${44 * e2}Q${8 * e2} ${30 * e2} ${7 * e2} 0Z` }, g); c.style.setProperty('--i', i);
    }
    poils = POILS.map(([u, v], i) => {
      const x = x0 + u * bw, y = cy + v * bw, g = sv('g', { transform: `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(i * 47) % 70 - 35})` }, svg);
      const p = sv('path', { class: 'poil', fill: '#1b1560', d: `M0 ${-16 * e2}Q${12 * e2} 0 0 ${16 * e2}Q${-12 * e2} 0 0 ${-16 * e2}Z` }, g);
      return { x, y, p, parti: false };
    });
    const trait = { stroke: '#d4145f', 'stroke-width': W < 500 ? 5 : 6.5, 'stroke-linecap': 'round' };
    lignes = [0, 1, 2, 3].map(() => sv('line', trait, svg));
    noeud = sv('g', {}, svg);
    sv('rect', { x: -30, y: -11, width: 60, height: 22, rx: 11, fill: '#d4145f' }, noeud);
    [-15, 0, 15].forEach((x) => sv('line', { x1: x - 5, y1: 10, x2: x + 5, y2: -10, stroke: '#fff4e0', 'stroke-width': 5, 'stroke-linecap': 'round' }, noeud));
    k.x = k.tx = W * .13; k.y = k.ty = Hh * .68; retires = 0; boite.classList.remove('fini'); maj(); trace();
  }
  function trace() {
    const a = [[-10, Hh * .08], [-10, Hh * .92], [W + 10, Hh * .08], [W + 10, Hh * .92]];
    lignes.forEach((l, i) => { l.setAttribute('x1', a[i][0]); l.setAttribute('y1', a[i][1]); l.setAttribute('x2', (k.x + (i < 2 ? -25 : 25)).toFixed(1)); l.setAttribute('y2', k.y.toFixed(1)); });
    noeud.setAttribute('transform', `translate(${k.x.toFixed(1)} ${k.y.toFixed(1)}) rotate(${borne((k.tx - k.x) * .25, -24, 24).toFixed(1)})`);
  }
  function maj() { nEl.textContent = retires; tEl.textContent = poils.length; }
  function arrache(p) {
    p.parti = true; p.p.style.setProperty('--dx', ((p.x - cx) * .5 + (Math.random() - .5) * 60).toFixed(0) + 'px'); p.p.style.setProperty('--dy', (-70 - Math.random() * 70).toFixed(0) + 'px');
    p.p.classList.remove('pousse'); p.p.classList.add('parti'); retires++; maj(); if (!calme) rejoue(nEl, 'bat');
    if (retires === poils.length) {
      boite.classList.add('fini'); fin.textContent = 'Net. Les cils s’allongent, le regard s’ouvre.';
      const r = boite.getBoundingClientRect(); holi(r.left + r.width / 2, r.top + r.height * .4, 10, Math.min(vw, 600) * .36, ['#d4145f', '#f7a806', '#04676a', '#ff8fb5']);
    }
  }
  function tick(dt) {
    if (demo) { demo.t += dt; let s = 0, fini = true; for (const [x, y, d] of demo.pts) { s += d; if (demo.t < s) { k.tx = x; k.ty = y; fini = false; break; } } if (fini) demo = null; }
    const f = Math.min(1, dt * (demo ? 5 : 15)); k.x += (k.tx - k.x) * f; k.y += (k.ty - k.y) * f; trace();
    for (const p of poils) if (!p.parti && Math.hypot(p.x - k.x, p.y - k.y) < rayon) arrache(p);
    return !!demo || Math.abs(k.tx - k.x) + Math.abs(k.ty - k.y) > .4;
  }
  function vers(e) {
    const r = boite.getBoundingClientRect(); k.tx = borne((e.clientX - r.left) * W / r.width, 12, W - 12); k.ty = borne((e.clientY - r.top) * Hh / r.height, 12, Hh - 12); demo = null;
    if (!touche) { touche = true; boite.classList.add('touche'); } anime(tick);
  }
  boite.addEventListener('pointermove', vers);
  boite.addEventListener('pointerdown', (e) => { vers(e); try { boite.setPointerCapture(e.pointerId); } catch (x) {} });
  $('#fil-re').addEventListener('click', () => {
    poils.forEach((p, i) => { p.parti = false; p.p.classList.remove('parti'); p.p.style.animationDelay = (i * 40) + 'ms'; if (!calme) rejoue(p.p, 'pousse'); });
    retires = 0; maj(); boite.classList.remove('fini'); fin.textContent = 'Quand le sourcil est net, les cils s’allongent.';
  });
  monte();
  surTaille.push((l) => { if (l) monte(); });
  voir(boite, (dedans, o) => { if (dedans && !vu) { vu = true; o.disconnect(); if (!touche && !calme && poils.length) { const a = poils[13], b = poils[0]; demo = { t: 0, pts: [[a.x, a.y, .9], [b.x, b.y - 4, .8], [W * .13, Hh * .68, .9]] }; anime(tick); } } }, .55);
}

// ---------- la coiffure : le sèche-cheveux fait voler les mèches, elles retombent lisses ----------
function coiffure() {
  const boite = $('#chev'), svg = $('#chev-svg'), etat = $('#pei-etat');
  const COUL = ['#1b1560', '#2a2386', '#130f47'], MOTS = { 7: 'Sept', 11: 'Onze' };
  let W = 0, Hh = 0, meches = [], sc = null, souffles = [], ech = 1, portee = 200, visible = false, touche = false, actif = false, demo = null, seches = -1, fete = false;
  const P = { x: 0, y: 0, tx: 0, ty: 0 };
  function monte() {
    const r = boite.getBoundingClientRect(); W = Math.round(r.width); Hh = Math.round(r.height); if (!W) return;
    svg.setAttribute('viewBox', `0 0 ${W} ${Hh}`); svg.textContent = '';
    const n = W < 480 ? 7 : 11, pas = W / n; meches = [];
    for (let i = 0; i < n; i++) meches.push({ el: sv('path', { fill: 'none', stroke: COUL[i % 3], 'stroke-width': (pas * .58).toFixed(1), 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, svg), x: pas * (i + .5), ph: i * 1.9, sec: 0, vol: 0, repos: 0, amp: pas * .36 });
    ech = borne(W / 640, .7, 1.1); portee = borne(W * .3, 120, 230);
    // le sèche-cheveux, en formes pleines : il souffle vers le bas, son bec est sous le doigt
    sc = sv('g', {}, svg); const g = sv('g', { transform: `scale(${ech})` }, sc);
    souffles = [-17, 0, 17].map((x) => sv('rect', { x: x - 5.5, y: 8, width: 11, height: 40, rx: 5.5, fill: '#fff4e0' }, g));
    sv('rect', { x: -15, y: -196, width: 30, height: 92, rx: 14, fill: '#b00f4d', transform: 'rotate(38 0 -96)' }, g);
    sv('path', { d: 'M-34-70L-24 0L24 0L34-70Z', fill: '#ff8fb5' }, g);
    sv('circle', { cx: 0, cy: -100, r: 46, fill: '#d4145f' }, g);
    sv('circle', { cx: 0, cy: -100, r: 19, fill: '#fff4e0' }, g);
    P.x = P.tx = W * .86; P.y = P.ty = 178 * ech; seches = -1; dessine(0); dire(0);
  }
  function dessine(t) {
    for (const m of meches) {
      let d = ''; const cote = m.x >= P.x ? 1 : -1;
      for (let y = -24; y <= Hh + 40; y += 24) {
        const b = borne((y + 24) / 110, 0, 1), sous = borne((y - P.y) / 70, 0, 1) * m.vol;
        const x = m.x + m.amp * (1 - m.sec * .93) * b * Math.sin(y * .025 + m.ph + t * 1.25) + sous * b * (cote * (16 + 12 * Math.sin(t * 8 + m.ph)) + m.amp * .8 * Math.sin(y * .05 + t * 15 + m.ph));
        d += (d ? 'L' : 'M') + x.toFixed(1) + ' ' + y;
      }
      m.el.setAttribute('d', d);
    }
    sc.setAttribute('transform', `translate(${P.x.toFixed(1)} ${P.y.toFixed(1)}) rotate(${borne((P.tx - P.x) * -.1, -14, 14).toFixed(1)})`);
    souffles.forEach((s, i) => { const k = ((t * 2.4 + i * .33) % 1 + 1) % 1; s.setAttribute('y', (8 + k * 70).toFixed(1)); s.setAttribute('opacity', actif ? (1 - k).toFixed(2) : 0); });
  }
  function dire(n) {
    const N = meches.length;
    if (n === seches) return; seches = n;
    if (!n) { etat.textContent = `${MOTS[N] || N} mèches à sécher.`; fete = false; }
    else if (n < N) etat.textContent = `${n} sur ${N} mèches séchées.`;
    else { etat.textContent = 'Sec et lisse. La vraie coiffure se fait à l’institut.'; if (!fete) { fete = true; const r = boite.getBoundingClientRect(); holi(r.left + r.width / 2, r.top + r.height / 2, 10, Math.min(vw, 600) * .36, ['#d4145f', '#fff4e0', '#1b1560', '#f7a806']); } }
  }
  function tick(dt, t) {
    if (!visible) return false;
    if (demo) { demo.t += dt; let s = 0, fini = true; for (const [x, y, d] of demo.pts) { s += d; if (demo.t < s) { P.tx = x; P.ty = y; fini = false; break; } } if (fini) { demo = null; actif = false; } }
    const f = Math.min(1, dt * (demo ? 2.2 : 14)); P.x += (P.tx - P.x) * f; P.y += (P.ty - P.y) * f;
    let n = 0;
    for (const m of meches) {
      const sous = actif && Math.abs(m.x - P.x) < portee / 2;
      m.vol += ((sous ? 1 : 0) - m.vol) * Math.min(1, dt * 7);
      if (sous) { m.sec = Math.min(1, m.sec + dt * .8); m.repos = 7; } else if (m.repos > 0) m.repos -= dt; else if (m.sec > 0) m.sec = Math.max(0, m.sec - dt * .14);
      if (m.sec > .95) n++;
    }
    dire(n); dessine(calme ? 0 : t / 1000);
    return true;
  }
  function vers(e) { const r = boite.getBoundingClientRect(); P.tx = borne((e.clientX - r.left) * W / r.width, 0, W); P.ty = borne((e.clientY - r.top) * Hh / r.height, 175 * ech, Hh * .9); demo = null; actif = true; if (!touche) { touche = true; boite.classList.add('touche'); } }
  const repos = () => { if (demo) return; actif = false; P.tx = W * .86; P.ty = 178 * ech; };
  boite.addEventListener('pointermove', vers);
  boite.addEventListener('pointerdown', (e) => { vers(e); try { boite.setPointerCapture(e.pointerId); } catch (x) {} });
  boite.addEventListener('pointerleave', repos); boite.addEventListener('pointerup', (e) => { if (e.pointerType !== 'mouse') repos(); }); boite.addEventListener('pointercancel', repos);
  monte();
  surTaille.push((l) => { if (l) monte(); });
  let premiere = true;
  voir(boite, (dedans) => {
    visible = dedans; if (!dedans) return; anime(tick);
    if (premiere && !touche && !calme) { premiere = false; actif = true; demo = { t: 0, pts: [[W * .14, Hh * .5, 1], [W * .46, Hh * .5, 2.6], [W * .86, 178 * ech, .9]] }; }
  }, .2);
}

// ---------- les massages : des lettres qu'on masse ----------
function massages() {
  const h = $('#petrir'), sec = $('#massages');
  const L = [...'Massages'].map((c) => { const s = el('span', '', c); s.setAttribute('aria-hidden', 'true'); h.appendChild(s); return { s, p: 0, v: 0, cx: 0, w: 1 }; });
  let px = -1e5, vague = null, visible = false, dernierGeste = 0;
  const mesure = () => L.forEach((l) => { l.cx = l.s.offsetLeft + l.s.offsetWidth / 2; l.w = l.s.offsetWidth; });
  function tick(dt) {
    if (vague) { vague.t += dt; px = -120 + (h.offsetWidth + 240) * (vague.t / 1.7); if (vague.t > 1.7) { vague = null; px = -1e5; } }
    let vif = !!vague;
    for (const l of L) {
      const cible = Math.max(0, 1 - Math.abs(px - l.cx) / (l.w * 1.3));
      l.v += ((cible - l.p) * 210 - l.v * 13) * dt; l.p += l.v * dt;
      if (Math.abs(l.v) > .004 || Math.abs(cible - l.p) > .004) vif = true;
      l.s.style.transform = `translateY(${(l.p * 6).toFixed(2)}%) scale(${(1 + l.p * .22).toFixed(3)},${(1 - l.p * .3).toFixed(3)})`;
    }
    return vif;
  }
  function onde(x, y, c) { if (calme) return; const o = el('i', 'onde'); o.style.left = x + 'px'; o.style.top = y + 'px'; if (c) o.style.setProperty('--oc', c); sec.appendChild(o); setTimeout(() => o.remove(), 1600); }
  function geste(e) { px = e.clientX - h.getBoundingClientRect().left; vague = null; dernierGeste = performance.now(); if (!calme) anime(tick); }
  h.addEventListener('pointermove', geste);
  h.addEventListener('pointerdown', (e) => { geste(e); const r = sec.getBoundingClientRect(); onde(e.clientX - r.left, e.clientY - r.top, '#3a2fa0'); });
  h.addEventListener('pointerleave', () => { px = -1e5; });
  h.addEventListener('pointercancel', () => { px = -1e5; });
  const lance = () => { if (calme || !visible || performance.now() - dernierGeste < 4000) return; mesure(); vague = { t: 0 }; const r = sec.getBoundingClientRect(), g = h.getBoundingClientRect(); onde(g.left - r.left + g.width * .5, g.top - r.top + g.height * .55); anime(tick); };
  mesure(); surTaille.push(mesure); if (document.fonts && document.fonts.ready) document.fonts.ready.then(mesure);
  voir(h, (dedans) => { const avant = visible; visible = dedans; if (dedans && !avant) setTimeout(lance, 350); }, .6);
  setInterval(lance, 6500);
}

// ---------- avis, rendez-vous, plan ----------
function avis() {
  const n = $('#note-n');
  voir('.note-g', (dedans, o) => { if (!dedans) return; o.disconnect(); if (calme) return; let v = 0; n.textContent = '0,0'; const iv = setInterval(() => { v = Math.min(50, v + 2); n.textContent = (v / 10).toFixed(1).replace('.', ','); if (v >= 50) clearInterval(iv); }, 38); }, .5);
}
function rendezVous() {
  const f = $('#demande'), sel = $('#d-presta'), msg = $('#demande-msg');
  C.prestations.forEach((p) => { const o = el('option'); o.textContent = p.nom; sel.appendChild(o); });
  f.addEventListener('submit', (e) => {
    e.preventDefault();
    const prenom = ($('#d-prenom').value || '').trim().slice(0, 30);
    msg.textContent = (prenom ? prenom + ', votre' : 'Votre') + ' demande pour « ' + sel.value + ' » est prête. Maquette : rien n’a été envoyé.';
    f.classList.add('note');
    const r = f.getBoundingClientRect(); holi(r.left + r.width / 2, r.top + r.height * .6, 18, Math.min(vw, vh, 760) * .55, C.holi);
  });
  $('#demande-re').addEventListener('click', () => f.classList.remove('note'));
}
function plan() {
  const p = $('#plan'), pion = $('#pion');
  suivre(p);
  const pose = () => { const r = rect(p); if (r.bottom < 0 || r.top > vh) return; const q = calme ? 1 : borne((vh * .92 - r.top) / (vh * .62), 0, 1), t = .2 + q * .42; pion.setAttribute('transform', `translate(${(136 + 480 * t).toFixed(1)} ${(356 - 198 * t).toFixed(1)}) rotate(${(q * 540).toFixed(0)})`); };
  surDefile.push(pose); pose();
  const j = new Date().getDay(), l = $(`#horaires .ligne[data-j="${j}"]`);
  if (l) { l.classList.add('jour'); const s = el('small', '', 'aujourd’hui'); l.appendChild(s); }
}

// ---------- grands motifs ton sur ton dans les marges ----------
function decors() {
  const M = ['mangue', 'lotus', 'souci', 'losange', 'feuille'], liste = [];
  $$('main .sec').forEach((s, i) => {
    [1, 2].forEach((k) => { const d = el('div', 'deco d' + k, motif(M[(i * 2 + k) % M.length])); d.setAttribute('aria-hidden', 'true'); s.insertBefore(d, s.firstChild); liste.push({ d, s, k }); });
  });
  if (calme) return;
  $$('main .sec').forEach(suivre);
  surDefile.push(() => { if (vw < 1000) return; for (const o of liste) { const r = rect(o.s); if (r.bottom < -100 || r.top > vh + 100) continue; o.d.style.translate = '0 ' + ((r.top + r.height / 2 - vh / 2) * (o.k === 1 ? -.14 : .1)).toFixed(1) + 'px'; } });
}

// ---------- lancement ----------
const lance = (f) => { try { f(); } catch (e) { console.error(e); } };
lance(decors); lance(garnir); lance(toran); lance(rangoli); lance(bracelets); lance(ongles); lance(fil); lance(coiffure); lance(massages); lance(avis); lance(rendezVous); lance(plan);
// Les titres se peignent : le voile est porté par un enfant, pour que l'observateur voie bien le titre entrer.
$$('.titre.entre').forEach((t) => { const s = el('span', 'peint'); while (t.firstChild) s.appendChild(t.firstChild); t.appendChild(s); });
$$('.entre,[data-vu]').forEach((e) => io.observe(e));
$$('main > section, .pied').forEach((s) => vigie.observe(s));
remesure();
defile();
})();
