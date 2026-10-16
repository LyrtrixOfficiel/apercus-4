/* IMMERSION : la page. Choisit le praticien (?p=<dossier>) et la palette
   (?palette=<id>), rend son contenu, joue le chargement (le cristal se dessine
   dans la brume autour de ses initiales), puis allume le monde 3D, les
   apparitions, l'indice de section, le menu, le son et la vitre embuee.
   Sans JavaScript, la page ecrite par batir.mjs se lit telle quelle.

   Mouvement reduit : tout existe, adouci. Le chargement est plus court, les
   apparitions sont des fondus sans deplacement, le monde 3D tourne plus
   lentement et change de scene par un fondu en brume. Ce que le visiteur
   pilote (defilement, eau, cristal, vitre) marche exactement pareil. */
import { rendre } from './contenu.js';
import { trouverPalette, PALETTES } from './palettes.js';
import { APERCU, apercuPret, filet } from '../../commun/apercu.js';

const html = document.documentElement;
const reduit = matchMedia('(prefers-reduced-motion: reduce)').matches;
const telephone = matchMedia('(pointer: coarse)').matches || innerWidth < 760;
const params = new URLSearchParams(location.search);
if (reduit) html.classList.add('reduit');

async function chargerPraticien() {
  const p = params.get('p');
  const palDemandee = trouverPalette(params.get('palette')) ? params.get('palette') : '';
  if (!p || !/^[a-z0-9-]+$/.test(p) || p === document.body.dataset.p) {
    if (palDemandee) html.dataset.palette = palDemandee;
    html.classList.remove('attend');
    return null;
  }
  try {
    const r = await fetch(`../donnees/${p}.json`, { cache: 'no-store' });
    if (!r.ok) throw new Error(r.status);
    const d = await r.json();
    const v = rendre(d, { dossier: p, palette: palDemandee });
    document.getElementById('contenu').innerHTML = v.html;
    document.querySelector('.pied').outerHTML = v.pied;
    document.title = v.titre;
    document.querySelector('meta[name="description"]')?.setAttribute('content', v.description);
    document.querySelector('.hud-t').innerHTML = v.hud.nom;
    document.querySelector('.hud-mono').innerHTML = v.hud.initiales;
    const appel = document.querySelector('.hud-appel');
    if (v.hud.tel) appel.setAttribute('href', d.telLien); else appel.remove();
    document.querySelector('.ch-ini').textContent = v.initiales;
    document.querySelector('.ch-nom').innerHTML = v.hud.nom;
    document.body.dataset.p = p;
    document.body.dataset.prenom = v.prenom;
    document.body.dataset.etapes = v.etapes;
    document.body.dataset.vide = d.etapesEmplacement ? '1' : '';
    html.dataset.palette = v.palette;
    html.dataset.famille = v.famille;
    return d;
  } catch { return null; } finally { html.classList.remove('attend'); }
}

/* Le chargement : le cristal se dessine trait apres trait, la lumiere monte en
   lui, les initiales se condensent dans la brume. Jamais moins que le temps de
   le voir, jamais plus de 2,5 s ; un toucher le passe. */
function chargeur() {
  const el = document.querySelector('.chargeur');
  const debut = performance.now();
  const MIN = APERCU ? 600 : reduit ? 700 : 1300, MAX = APERCU ? 800 : 2500;
  let reel = 0, affiche = 0, ferme = false, quand = [];
  const fermer = () => {
    if (ferme) return;
    ferme = true;
    el?.style.setProperty('--prog', 1);
    el?.classList.add('parti');
    requestAnimationFrame(() => apercuPret('immersion'));
    /* Le nom ne monte qu'une fois le voile presque parti : pas de superposition. */
    setTimeout(() => html.classList.add('pret'), reduit ? 320 : 480);
    quand.forEach((f) => f());
    setTimeout(() => el?.remove(), 1200);
  };
  const tic = () => {
    if (ferme) return;
    const t = performance.now() - debut;
    /* Le dessin suit le temps (il ne reste jamais fige) et s'arrete un peu
       avant la fin tant que le monde n'est pas pret. */
    const tempo = 1 - Math.pow(1 - Math.min(1, t / MIN), 2.2);
    affiche = Math.min(tempo, reel >= 1 ? 1 : 0.86 + 0.1 * Math.min(1, reel));
    el?.style.setProperty('--prog', affiche.toFixed(3));
    if (reel >= 1 && t >= MIN) { fermer(); return; }
    requestAnimationFrame(tic);
  };
  requestAnimationFrame(tic);
  setTimeout(fermer, MAX);
  el?.addEventListener('pointerdown', fermer);
  return {
    progres: (x) => { reel = Math.max(reel, x); },
    fermer,
    apres: (f) => { if (ferme) f(); else quand.push(f); },
    get ferme() { return ferme; }
  };
}

/* Les apparitions : les mots du nom montent de leur masque ; le reste sort de
   la brume (flou qui se dissipe) quand il entre dans l'ecran. Sous mouvement
   reduit : un simple fondu (voir le CSS). */
function apparitions() {
  const cibles = document.querySelectorAll('.horizon, .phrase, .conviction, .ondes-intro, .onde-mot, .gue-tete > *, .pas, .gravure > *, .brume-in > *, .recit > *, .aube-in > *, .pied-in > *');
  cibles.forEach((el) => el.classList.add('rev'));
  document.querySelectorAll('.nom .mot').forEach((m, i) => m.style.setProperty('--i', i));
  const io = new IntersectionObserver((es) => {
    for (const e of es) if (e.isIntersecting) { e.target.classList.add('vu'); io.unobserve(e.target); }
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });
  cibles.forEach((el) => io.observe(el));
}

/* L'indice : le nom de la section et une barre de progression, sans numero. */
function indice(sections) {
  const el = document.querySelector('.indice');
  const nom = el.querySelector('.indice-nom'), barre = el.querySelector('.indice-barre i');
  const liste = sections.filter((s) => s.el.dataset.nom);
  let courant = -1, minuterie = 0;
  const maj = () => {
    const c = scrollY + innerHeight * 0.5;
    let i = 0;
    liste.forEach((s, k) => { if (s.el.getBoundingClientRect().top + scrollY <= c) i = k; });
    if (i !== courant) {
      courant = i;
      nom.textContent = liste[i].el.dataset.nom;
      el.classList.add('montre');
      clearTimeout(minuterie);
      minuterie = setTimeout(() => el.classList.remove('montre'), 1800);
    }
    const h = document.documentElement.scrollHeight - innerHeight;
    barre.style.transform = `scaleX(${h > 0 ? scrollY / h : 0})`;
  };
  addEventListener('scroll', maj, { passive: true });
  maj();
  return liste;
}

/* Le menu plein ecran. */
function menu(liste) {
  const bouton = document.querySelector('.hud-menu');
  const nav = document.createElement('nav');
  nav.className = 'menu';
  nav.setAttribute('aria-label', 'Sections');
  nav.innerHTML = `<ol>${liste.map((s) => `<li><a href="#${s.el.id}">${s.el.dataset.nom}</a></li>`).join('')}</ol>`;
  document.body.appendChild(nav);
  bouton.hidden = false;
  const basculer = (ouvrir) => {
    html.classList.toggle('menu-ouvert', ouvrir);
    bouton.setAttribute('aria-expanded', String(ouvrir));
    bouton.textContent = ouvrir ? 'Fermer' : 'Menu';
  };
  bouton.addEventListener('click', () => basculer(!html.classList.contains('menu-ouvert')));
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) basculer(false); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') basculer(false); });
}

/* Le son : une nappe grave, un souffle d'eau, et une note claire a chaque
   changement de monde. Tout est synthetise. Coupe par defaut. */
function son() {
  const b = document.querySelector('.son');
  // dans l'aperçu de la page d'arrivée : aucun son, et pas de bouton pour en mettre
  if (APERCU || !b) { if (b) { b.hidden = true; b.style.display = 'none'; } return () => {}; }
  b.hidden = false;
  let ac = null, maitre = null, actif = false;
  function monter() {
    ac = new (window.AudioContext || window.webkitAudioContext)();
    maitre = ac.createGain(); maitre.gain.value = 0;
    const filtre = ac.createBiquadFilter(); filtre.type = 'lowpass'; filtre.frequency.value = 900;
    filtre.connect(maitre); maitre.connect(ac.destination);
    for (const [f, g] of [[110, 0.05], [164.8, 0.035], [220.4, 0.022], [329.6, 0.012]]) {
      const o = ac.createOscillator(); o.type = 'sine'; o.frequency.value = f;
      const v = ac.createGain(); v.gain.value = g;
      const lfo = ac.createOscillator(); lfo.frequency.value = 0.05 + Math.random() * 0.07;
      const lg = ac.createGain(); lg.gain.value = g * 0.6;
      lfo.connect(lg); lg.connect(v.gain);
      o.connect(v); v.connect(filtre); o.start(); lfo.start();
    }
    const tampon = ac.createBuffer(1, ac.sampleRate * 3, ac.sampleRate);
    const d = tampon.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const bruit = ac.createBufferSource(); bruit.buffer = tampon; bruit.loop = true;
    const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 520; bp.Q.value = 0.6;
    const bg = ac.createGain(); bg.gain.value = 0.018;
    bruit.connect(bp); bp.connect(bg); bg.connect(maitre); bruit.start();
  }
  b.addEventListener('click', () => {
    if (!ac) monter();
    actif = !actif;
    ac.resume();
    maitre.gain.cancelScheduledValues(ac.currentTime);
    maitre.gain.setTargetAtTime(actif ? 0.9 : 0, ac.currentTime, 0.6);
    b.setAttribute('aria-pressed', String(actif));
    b.querySelector('.son-t').textContent = actif ? 'Son activé' : 'Son coupé';
  });
  return (monde) => {
    if (!actif || !ac) return;
    const notes = { cristal: 659.3, eau: 493.9, galets: 587.3, brume: 440 };
    const t = ac.currentTime;
    for (const [m, g] of [[1, 0.05], [2.01, 0.015]]) {
      const o = ac.createOscillator(); o.type = 'sine'; o.frequency.value = (notes[monde] || 523.3) * m;
      const v = ac.createGain(); v.gain.setValueAtTime(0, t); v.gain.linearRampToValueAtTime(g, t + 0.02); v.gain.exponentialRampToValueAtTime(0.0001, t + 3.2);
      o.connect(v); v.connect(maitre); o.start(t); o.stop(t + 3.3);
    }
  };
}

/* La vitre embuee qui attend le portrait : la buee s'efface la ou passe la main
   (souris ou doigt), puis revient doucement. */
function vitre() {
  const zone = document.querySelector('.vitre-verre');
  if (!zone) return;
  const c = document.createElement('canvas');
  c.className = 'buee';
  zone.appendChild(c);
  const g = c.getContext('2d');
  const coul = getComputedStyle(html).getPropertyValue('--buee').trim() || 'rgba(200,215,225,1)';
  let L = 0, H = 0, k = 1, actif = false, dernier = null;
  /* La buee : un voile clair plus dense en bas, et des gouttelettes (un point
     sombre et un reflet) dessinees une fois dans un motif. */
  const tache = document.createElement('canvas'); tache.width = tache.height = 96;
  const gt = tache.getContext('2d');
  for (let i = 0; i < 1400; i++) { gt.fillStyle = `rgba(255,255,255,${Math.random() * 0.06})`; gt.fillRect(Math.random() * 96, Math.random() * 96, 1.2, 1.2); }
  for (let i = 0; i < 14; i++) {
    const x = Math.random() * 96, y = Math.random() * 96, r = 0.8 + Math.random() * 2.2;
    gt.fillStyle = 'rgba(0,0,0,0.12)'; gt.beginPath(); gt.arc(x, y, r, 0, Math.PI * 2); gt.fill();
    gt.fillStyle = 'rgba(255,255,255,0.22)'; gt.beginPath(); gt.arc(x - r * 0.3, y - r * 0.35, r * 0.35, 0, Math.PI * 2); gt.fill();
  }
  const motif = g.createPattern(tache, 'repeat');
  const embuer = (a) => {
    g.globalCompositeOperation = 'source-over';
    g.globalAlpha = a;
    const gr = g.createLinearGradient(0, 0, 0, H);
    const rgb = (coul.match(/[\d.]+/g) || [140, 165, 182]).slice(0, 3).join(',');
    gr.addColorStop(0, `rgba(${rgb},0.03)`); gr.addColorStop(0.55, `rgba(${rgb},0.09)`); gr.addColorStop(1, `rgba(${rgb},0.2)`);
    g.fillStyle = gr; g.fillRect(0, 0, L, H);
    g.fillStyle = motif; g.fillRect(0, 0, L, H);
    g.globalAlpha = 1;
  };
  const taille = () => {
    const r = zone.getBoundingClientRect();
    k = Math.min(2, devicePixelRatio || 1);
    L = c.width = Math.max(2, Math.round(r.width * k)); H = c.height = Math.max(2, Math.round(r.height * k));
    embuer(1);
  };
  taille();
  new ResizeObserver(taille).observe(zone);
  const essuyer = (x, y) => {
    g.globalCompositeOperation = 'destination-out';
    const R = 26 * k;
    const pts = dernier ? Math.max(1, Math.ceil(Math.hypot(x - dernier[0], y - dernier[1]) / (R * 0.35))) : 1;
    for (let i = 1; i <= pts; i++) {
      const px = dernier ? dernier[0] + (x - dernier[0]) * i / pts : x, py = dernier ? dernier[1] + (y - dernier[1]) * i / pts : y;
      const gr = g.createRadialGradient(px, py, 0, px, py, R);
      gr.addColorStop(0, 'rgba(0,0,0,0.9)'); gr.addColorStop(0.6, 'rgba(0,0,0,0.55)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(px, py, R, 0, Math.PI * 2); g.fill();
    }
    dernier = [x, y];
    if (!actif) { actif = true; requestAnimationFrame(revenir); }
  };
  let calme = 0;
  const revenir = () => {
    embuer(0.012);
    calme++;
    if (calme < 420) requestAnimationFrame(revenir); else { actif = false; calme = 0; }
  };
  const pos = (ev) => { const r = zone.getBoundingClientRect(); return [(ev.clientX - r.left) * k, (ev.clientY - r.top) * k]; };
  zone.addEventListener('pointermove', (ev) => { calme = 0; essuyer(...pos(ev)); }, { passive: true });
  zone.addEventListener('pointerdown', (ev) => { calme = 0; dernier = null; essuyer(...pos(ev)); }, { passive: true });
  zone.addEventListener('pointerleave', () => { dernier = null; });
}

/* Les polices arrivent sans bloquer la page ; le monde 3D les attend (au plus
   2,2 s) pour ecrire le prenom dans la brume avec la bonne lettre. */
function polices() {
  const l = document.querySelector('link[data-polices]');
  const feuille = new Promise((res) => {
    if (!l || (l.rel === 'stylesheet' && l.sheet)) return res();
    l.addEventListener('load', () => setTimeout(res, 30), { once: true });
    l.addEventListener('error', res, { once: true });
    setTimeout(res, 2200);
  });
  const lettres = feuille.then(() => Promise.all(['italic 500 200px', 'italic 300 100px', '300 100px'].map((f) => document.fonts?.load(`${f} "Cormorant Garamond"`))).catch(() => {}));
  return Promise.race([lettres, new Promise((res) => setTimeout(res, 2600))]);
}

function webglPossible() {
  try { return !!document.createElement('canvas').getContext('webgl2'); } catch { return false; }
}

/* Une image de ciel deposee dans images/ (voir IMAGES-A-GENERER.md). */
async function imageCiel(id) {
  const url = `images/ciel-${id}.webp`;
  try { const r = await fetch(url, { method: 'HEAD', cache: 'no-store' }); return r.ok ? url : ''; } catch { return ''; }
}

async function demarrer() {
  const ch = chargeur();
  filet('immersion');
  const pol = polices();
  await chargerPraticien();
  const sections = [...document.querySelectorAll('[data-monde]')].map((el) => ({ el, monde: el.dataset.monde, variante: el.dataset.variante || '' }));
  const liste = indice(sections);
  menu(liste);
  apparitions();
  vitre();
  const tinter = son();
  const palette = trouverPalette(html.dataset.palette) || PALETTES[0];

  const sansDonnees = navigator.connection && navigator.connection.saveData;
  if (!webglPossible() || sansDonnees || params.has('sans3d')) {
    html.classList.add('sans-3d');
    pol.then(() => ch.progres(1));
    return;
  }
  const garde = setTimeout(() => { html.classList.add('sans-3d'); ch.fermer(); }, 15000);
  try {
    const [{ demarrer: monde }, cielImage] = await Promise.all([import('./monde.js'), imageCiel(palette.id), pol]);
    ch.progres(0.1);
    const m = await monde({
      toile: document.querySelector('.toile'),
      ctx: {
        telephone,
        prenom: document.body.dataset.prenom || document.querySelector('.scene-nom-t')?.textContent || '',
        etapes: Number(document.body.dataset.etapes || document.querySelectorAll('.pas').length),
        vide: !!document.body.dataset.vide || !!document.querySelector('.seance-vide'),
        cielImage
      },
      sections, reduit, palette,
      surChangement: tinter,
      surProgres: (x) => { ch.progres(x); window.__progres = x; }
    });
    clearTimeout(garde);
    html.classList.remove('sans-3d');
    html.classList.add('avec-3d');
    window.__monde = m;
    ch.apres(() => m.lancerIntro());
    document.fonts?.ready.then(() => m.mesurer());
    /* Les themes de l'approche : chacun fait naitre une onde quand il passe au
       centre de l'ecran. */
    const io = new IntersectionObserver((es) => { for (const e of es) if (e.isIntersecting) m.onde(e.target); }, { rootMargin: '-42% 0px -42% 0px' });
    document.querySelectorAll('.onde-mot, .phrase').forEach((el) => io.observe(el));
  } catch (err) {
    console.warn('Monde 3D indisponible :', err);
    window.__erreur3d = String(err && (err.stack || err.message) || err);
    clearTimeout(garde);
    html.classList.add('sans-3d');
    ch.progres(1);
  }
}
demarrer();
