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
if (mosaiques.length) {
  let boite = null, retour = null;
  const fermer = () => { boite?.remove(); boite = null; document.body.style.overflowY = ''; retour?.focus(); };
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.mosaique')) return;
    const b = e.target.closest('button[data-grand]');
    if (!b) return;
    retour = b;
    const legende = b.closest('figure').querySelector('figcaption')?.textContent || '';
    boite = document.createElement('div');
    boite.className = 'lumiere';
    boite.setAttribute('role', 'dialog');
    boite.setAttribute('aria-modal', 'true');
    boite.setAttribute('aria-label', legende);
    boite.innerHTML = `<button type="button" class="bouton bouton-orange lumiere-fermer"><span>Fermer</span></button><figure style="margin:0"><img src="${b.dataset.grand}" alt="${legende.replace(/"/g, '&quot;')}"><figcaption><p class="hud">${legende}</p></figcaption></figure>`;
    document.body.appendChild(boite);
    document.body.style.overflowY = 'hidden';
    boite.querySelector('.lumiere-fermer').focus();
    boite.addEventListener('click', (ev) => { if (ev.target === boite || ev.target.closest('.lumiere-fermer')) fermer(); });
  });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && boite) fermer(); });
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
