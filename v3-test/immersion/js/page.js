/* IMMERSION : la page. Choisit le praticien (?p=<dossier>), rend son contenu,
   puis allume le monde 3D, les apparitions, l'indice de section, le menu et
   le son. Sans JavaScript, la page ecrite par batir.mjs se lit telle quelle. */
import { rendre } from './contenu.js';

const html = document.documentElement;
const reduit = matchMedia('(prefers-reduced-motion: reduce)').matches;
const telephone = matchMedia('(pointer: coarse)').matches || innerWidth < 760;
if (reduit) html.classList.add('reduit');

async function chargerPraticien() {
  const p = new URLSearchParams(location.search).get('p');
  if (!p || !/^[a-z0-9-]+$/.test(p) || p === document.body.dataset.p) return null;
  try {
    const r = await fetch(`../donnees/${p}.json`, { cache: 'no-store' });
    if (!r.ok) return null;
    const d = await r.json();
    const v = rendre(d);
    document.getElementById('contenu').innerHTML = v.html;
    document.querySelector('.pied').outerHTML = v.pied;
    document.title = v.titre;
    document.querySelector('meta[name="description"]')?.setAttribute('content', v.description);
    document.querySelector('.hud-t').innerHTML = v.hud.nom;
    document.querySelector('.hud-mono').innerHTML = v.hud.initiales;
    document.querySelector('.hud-appel').setAttribute('href', d.telLien);
    document.body.dataset.p = p;
    document.body.dataset.prenom = v.prenom;
    document.body.dataset.etapes = v.etapes;
    return d;
  } catch { return null; }
}

/* Le chargeur : un compteur, le temps que le monde se compile. */
function chargeur() {
  const el = document.createElement('div');
  el.className = 'chargeur';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = '<div class="chargeur-in"><span class="chargeur-anneau"></span><span class="chargeur-n mono">000</span><span class="chargeur-t mono">Le monde se compose</span></div>';
  document.body.appendChild(el);
  let cible = 0, vu = 0, fini = false;
  const n = el.querySelector('.chargeur-n');
  const tic = () => {
    vu += (cible - vu) * 0.12 + 0.2;
    vu = Math.min(vu, cible);
    n.textContent = String(Math.round(vu * 100)).padStart(3, '0');
    if (fini && vu >= 0.995) { el.classList.add('parti'); html.classList.add('pret'); setTimeout(() => el.remove(), 1400); return; }
    requestAnimationFrame(tic);
  };
  requestAnimationFrame(tic);
  return { progres: (x) => { cible = Math.max(cible, x); if (x >= 1) fini = true; }, fermer: () => { cible = 1; fini = true; } };
}

/* Les apparitions : les mots du titre montent de leur masque, le reste se
   pose en douceur quand il entre dans l'ecran. */
function apparitions() {
  const cibles = document.querySelectorAll('.sc-in > *, .citation, .apport, .etape, .tarif, .portrait, .pied-in > *');
  cibles.forEach((el) => el.classList.add('rev'));
  document.querySelectorAll('.nom .mot').forEach((m, i) => m.style.setProperty('--i', i));
  const io = new IntersectionObserver((es) => {
    for (const e of es) if (e.isIntersecting) { e.target.classList.add('vu'); io.unobserve(e.target); }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
  cibles.forEach((el) => io.observe(el));
}

/* L'indice : numero et nom de la section, et une barre de progression. */
function indice(sections) {
  const el = document.querySelector('.indice');
  const n = el.querySelector('.indice-n'), nom = el.querySelector('.indice-nom'), barre = el.querySelector('.indice-barre i');
  const liste = sections.filter((s) => s.el.dataset.nom);
  liste.forEach((s, i) => { const num = s.el.querySelector('.num'); if (num) num.textContent = String(i + 1).padStart(2, '0'); });
  let courant = -1, minuterie = 0;
  const maj = () => {
    const c = scrollY + innerHeight * 0.5;
    let i = 0;
    liste.forEach((s, k) => { if (s.el.getBoundingClientRect().top + scrollY <= c) i = k; });
    if (i !== courant) {
      courant = i;
      n.textContent = String(i + 1).padStart(2, '0') + ' / ' + String(liste.length).padStart(2, '0');
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
  nav.innerHTML = `<ol>${liste.map((s, i) => `<li><a href="#${s.el.id}"><span class="mono">${String(i + 1).padStart(2, '0')}</span>${s.el.dataset.nom}</a></li>`).join('')}</ol>`;
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
   changement de monde. Tout est synthetise, rien n'est telecharge. Coupe
   par defaut ; ne demarre qu'au clic. */
function son() {
  const b = document.querySelector('.son');
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

function webglPossible() {
  try {
    const c = document.createElement('canvas');
    return !!c.getContext('webgl2');
  } catch { return false; }
}

async function demarrer() {
  await chargerPraticien();
  const sections = [...document.querySelectorAll('[data-monde]')].map((el) => ({ el, monde: el.dataset.monde, variante: el.dataset.variante || '' }));
  const liste = indice(sections);
  menu(liste);
  if (!reduit) apparitions();
  const tinter = son();

  const sansDonnees = navigator.connection && navigator.connection.saveData;
  if (!webglPossible() || sansDonnees || new URLSearchParams(location.search).has('sans3d')) {
    html.classList.add('sans-3d');
    html.classList.add('pret');
    return;
  }
  const ch = chargeur();
  const garde = setTimeout(() => { html.classList.add('sans-3d'); ch.fermer(); }, 15000);
  try {
    const { demarrer: monde } = await import('./monde.js');
    ch.progres(0.1);
    const prenom = document.body.dataset.prenom || document.querySelector('.scene-nom-t')?.textContent || '';
    const etapes = Number(document.body.dataset.etapes || document.querySelectorAll('.etape').length);
    const m = await monde({
      toile: document.querySelector('.toile'),
      ctx: { telephone, prenom, etapes },
      sections, reduit,
      surChangement: tinter,
      surProgres: (x) => ch.progres(x)
    });
    clearTimeout(garde);
    html.classList.add('avec-3d');
    window.__monde = m;
    document.fonts?.ready.then(() => m.mesurer());
  } catch (err) {
    console.warn('Monde 3D indisponible :', err);
    clearTimeout(garde);
    html.classList.add('sans-3d');
    ch.fermer();
  }
}
demarrer();
