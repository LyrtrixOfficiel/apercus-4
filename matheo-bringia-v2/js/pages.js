// Mathéo Bringia : ce qui est propre aux sous-pages (le reste est dans commun.js).
//  - Calendrier : les filtres des résultats (Tout, FRKC, CRKI).
//  - Article : n'affiche que l'actu demandée (article.html?id=...). Sans JavaScript, la page les montre toutes.
//  - Galerie : la photo en grand (visionneuse).
//  - Contact : l'objet prérempli (contact.html?objet=partenariat) ; en maquette, rien n'est envoyé.
import { lissage } from './commun.js';
import { ACT } from './rendus.js';

const params = new URLSearchParams(location.search);

// ---------- calendrier ----------
const filtres = document.querySelector('.filtres');
if (filtres) {
  filtres.hidden = false;
  const lignes = () => [...document.querySelectorAll('.resultats .resultat')];
  filtres.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-filtre]');
    if (!b) return;
    for (const x of filtres.querySelectorAll('button')) x.setAttribute('aria-pressed', String(x === b));
    const f = b.dataset.filtre;
    for (const l of lignes()) l.hidden = !(f === 'tout' || l.dataset.type === f);
  });
}

// ---------- article ----------
const articles = document.querySelector('.articles');
if (articles) {
  const id = params.get('id') || decodeURIComponent(location.hash.slice(1));
  const choisi = id && document.getElementById(id);
  if (choisi && choisi.classList.contains('article')) {
    articles.classList.add('un');
    choisi.classList.add('choisi');
    const a = ACT.ACTUS.find((x) => x.id === id);
    if (a) document.title = `${a.titre} · Mathéo Bringia, pilote de karting`;
    // l'ancre (#id) sert à la version sans JavaScript : ici, l'article est seul, on part du haut
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    // l'image de l'article choisi se charge tout de suite
    const img = choisi.querySelector('img'); if (img) img.loading = 'eager';
  }
}

// ---------- galerie : la visionneuse (toutes les mosaïques de la page) ----------
const mosaiques = document.querySelectorAll('.mosaique');
// v2 : plein écran, la photo en HD (srcset jusqu'à 3840 px), son propre flou en fond, précédente et suivante
// (flèches, clavier, glisser au doigt), numéro, légende et crédit de l'album. Échap ou « Fermer » rend le focus.
if (mosaiques.length) {
  const tous = () => [...document.querySelectorAll('.mosaique button[data-grand]')];
  const ICO = {
    g: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    d: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
  };
  let boite = null, retour = null, n = 0;
  const echap = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  function credit(b) {
    let e = b.closest('.mosaique')?.previousElementSibling;
    while (e && !e.classList.contains('album-titre')) e = e.previousElementSibling;
    if (!e) return '';
    const c = e.querySelector('.hud')?.textContent.trim() || '';
    const t = e.childNodes[0]?.textContent.trim() || '';
    return [t, c].filter(Boolean).join(' · ');
  }
  function montrer(i) {
    const l = tous();
    n = (i + l.length) % l.length;
    const b = l[n];
    const legende = b.closest('figure').querySelector('figcaption')?.textContent || '';
    boite.setAttribute('aria-label', legende);
    boite.querySelector('.lv-flou').style.backgroundImage = `url("${b.querySelector('img').currentSrc || b.querySelector('img').src}")`;
    const sc = boite.querySelector('.lv-scene');
    sc.querySelector('img')?.remove();
    const img = document.createElement('img');
    img.alt = legende;
    img.sizes = '100vw';
    if (b.dataset.jeu) img.srcset = b.dataset.jeu;
    img.src = b.dataset.grand;
    img.decoding = 'async';
    sc.appendChild(img);
    boite.querySelector('.lv-n').textContent = `${String(n + 1).padStart(2, '0')} / ${String(l.length).padStart(2, '0')}`;
    boite.querySelector('.lv-legende').innerHTML = `${echap(legende)}<small>${echap(credit(b))}</small>`;
  }
  const fermer = () => { boite?.remove(); boite = null; document.body.style.overflowY = ''; retour?.focus(); };
  function ouvrir(b) {
    retour = b;
    boite = document.createElement('div');
    boite.className = 'lumiere-v2';
    boite.setAttribute('role', 'dialog');
    boite.setAttribute('aria-modal', 'true');
    boite.innerHTML = `<div class="lv-scene"><div class="lv-flou" aria-hidden="true"></div>
      <button type="button" class="lv-btn lv-fermer" aria-label="Fermer">${ICO.x}</button>
      <button type="button" class="lv-btn lv-prec" aria-label="Photo précédente">${ICO.g}</button>
      <button type="button" class="lv-btn lv-suiv" aria-label="Photo suivante">${ICO.d}</button></div>
      <div class="lv-barre"><span class="lv-n"></span><p class="lv-legende"></p></div>`;
    document.body.appendChild(boite);
    document.body.style.overflowY = 'hidden';
    montrer(tous().indexOf(b));
    boite.querySelector('.lv-fermer').focus();
    boite.addEventListener('click', (ev) => {
      if (ev.target.closest('.lv-fermer')) fermer();
      else if (ev.target.closest('.lv-prec')) montrer(n - 1);
      else if (ev.target.closest('.lv-suiv')) montrer(n + 1);
    });
    let x0 = null;
    boite.addEventListener('touchstart', (ev) => { x0 = ev.touches[0].clientX; }, { passive: true });
    boite.addEventListener('touchend', (ev) => {
      if (x0 == null) return;
      const dx = ev.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 50) montrer(n + (dx < 0 ? 1 : -1));
    });
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('.mosaique button[data-grand]');
    if (b) ouvrir(b);
  });
  addEventListener('keydown', (e) => {
    if (!boite) return;
    if (e.key === 'Escape') fermer();
    else if (e.key === 'ArrowLeft') montrer(n - 1);
    else if (e.key === 'ArrowRight') montrer(n + 1);
    else if (e.key === 'Tab') {
      // le focus reste dans la visionneuse
      const f = [...boite.querySelectorAll('button')];
      const i = f.indexOf(document.activeElement);
      e.preventDefault();
      f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
    }
  });
}

// ---------- contact ----------
const form = document.querySelector('.formulaire');
if (form) {
  const objet = params.get('objet');
  if (objet && form.objet.querySelector(`option[value="${CSS.escape(objet)}"]`)) form.objet.value = objet;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const merci = form.querySelector('#envoye');
    merci.hidden = false;
    lissage.aller(merci, { fin: () => merci.focus?.() });
  });
}
