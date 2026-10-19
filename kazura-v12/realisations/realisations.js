// Kazura v12, module « Réalisations » (agent Vitrine).
// La galerie des vrais sites de clients, capturés en vrai (ordinateur 1440 et téléphone 390, dans img/).
// Un rail horizontal : chaque site dans un écran d'ordinateur sobre, son téléphone posé devant ;
// on parcourt quelques écrans du site, puis « Voir le site » ouvre le vrai site dans un nouvel onglet.
//
// API : monter(el, { reduit, mobile }) remplace le contenu de el (le repli statique, une simple liste de liens,
// écrit par la Page) et renvoie { detruire() }.

export const SITES = [
  {
    id: 'shiatsu-jiyu', nom: 'Shiatsu Jiyū', url: 'https://shiatsu-jiyu.fr', domaine: 'shiatsu-jiyu.fr',
    metier: 'Praticienne de shiatsu, dans le Haut-Rhin',
    fait: 'Un site doux et lumineux : la séance expliquée simplement, ses tarifs, les avis de ses clients et la prise de rendez-vous.',
    ecrans: ['L’accueil', 'La séance', 'Le rendez-vous'],
  },
  {
    id: 'ecrin-des-possibles', nom: 'L’écrin des possibles', url: 'https://lecrindespossibles.fr', domaine: 'lecrindespossibles.fr',
    metier: 'Médiation animale, sophrologie et ateliers, dans la Manche',
    fait: 'Un site chaleureux qui présente chacun de ses accompagnements, en ligne sur son propre nom de domaine.',
    ecrans: ['L’accueil', 'Sa façon d’accompagner', 'Ses accompagnements'],
  },
  {
    id: 'ds-therapie', nom: 'DS Thérapie', url: 'https://ds-therapie.netlify.app', domaine: 'ds-therapie.netlify.app',
    metier: 'Thérapie et coaching, seul, en couple ou en famille',
    fait: 'Un site posé et rassurant, écrit à partir de ses mots : les situations qu’il accompagne, ses formules, la prise de rendez-vous.',
    ecrans: ['L’accueil', 'Ce qui vous amène', 'Les formules'], enCours: true,
  },
  {
    id: 'estelle-formation', nom: 'Estelle Formation IA', url: 'https://estelle-formation.fr', domaine: 'estelle-formation.fr',
    metier: 'Cours d’intelligence artificielle en visio, pour les débutants',
    fait: 'Un site joyeux qu’on essaie avant de réserver : on choisit une question et on voit l’IA répondre. Son décor suit les saisons.',
    ecrans: ['L’accueil', 'La démonstration', 'La visio'],
  },
  {
    id: 'alyriaz', nom: 'Alyriaz', url: 'https://alyriaz.com', domaine: 'alyriaz.com',
    metier: 'Un média qui explique l’intelligence artificielle',
    fait: 'Un média complet : des articles illustrés, une bibliothèque où chercher par sujet, le bilan de chaque semaine.',
    ecrans: ['L’accueil', 'La bibliothèque', 'La semaine'],
  },
  {
    id: 'lyrtrix', nom: 'LYRTRIX', url: 'https://lyrtrix.com', domaine: 'lyrtrix.com',
    metier: 'Un univers musical',
    fait: 'La page d’un single, comme une pochette de disque : l’écoute sur les plateformes et la bande-annonce.',
    ecrans: ['L’accueil', 'Le bandeau', 'La bande-annonce'],
  },
];

const FLECHE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
const SORTIE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17L17 7M9 7h8v8"/></svg>';

export function monter(el, opts = {}) {
  const reduit = opts.reduit ?? matchMedia('(prefers-reduced-motion: reduce)').matches;
  const img = (n) => new URL(`img/${n}.webp`, import.meta.url).href;

  el.innerHTML = `
  <div class="rl${reduit ? ' rl-reduit' : ''}">
    <div class="rl-rail" tabindex="-1" aria-label="Les sites réalisés">
      ${SITES.map((s, i) => `
      <article class="rl-site" aria-labelledby="rl-nom-${s.id}" data-i="${i}">
        <div class="rl-scene">
          <div class="rl-ordi">
            <div class="rl-barre" aria-hidden="true"><span></span><span></span><span></span><em>${s.domaine}</em></div>
            <div class="rl-ecran">
              ${s.ecrans.map((nom, k) => `<img class="rl-vue${k === 0 ? ' rl-active' : ''}" src="${img(`${s.id}-ordi-${k}-800`)}" srcset="${img(`${s.id}-ordi-${k}-800`)} 800w, ${img(`${s.id}-ordi-${k}`)} 1440w" sizes="(min-width: 900px) 52vw, 86vw" width="1440" height="900" alt="${k === 0 ? `${s.nom}, la page d’accueil sur ordinateur` : `${s.nom} : ${nom.toLowerCase()}`}" ${i > 0 || k > 0 ? 'loading="lazy"' : ''} decoding="async">`).join('')}
            </div>
          </div>
          <div class="rl-tel">
            <img class="rl-tel-vue rl-active" src="${img(`${s.id}-tel-0`)}" width="600" height="1298" alt="${s.nom} sur téléphone" ${i > 0 ? 'loading="lazy"' : ''} decoding="async">
            <img class="rl-tel-vue" src="${img(`${s.id}-tel-1`)}" width="600" height="1298" alt="" loading="lazy" decoding="async">
          </div>
        </div>
        <div class="rl-texte">
          <p class="rl-metier">${s.metier}</p>
          <h3 class="rl-nom" id="rl-nom-${s.id}">${s.nom}${s.enCours ? ' <span class="rl-encours">en cours</span>' : ''}</h3>
          <p class="rl-fait">${s.fait}</p>
          <div class="rl-ecrans" role="group" aria-label="Parcourir ${s.nom}">
            ${s.ecrans.map((nom, k) => `<button type="button" data-k="${k}" aria-pressed="${k === 0}">${nom}</button>`).join('')}
          </div>
          <a class="rl-voir" href="${s.url}" target="_blank" rel="noopener">Voir le site<span class="rl-hors"> ${s.nom} (nouvel onglet)</span>${SORTIE}</a>
        </div>
      </article>`).join('')}
    </div>
    <div class="rl-pilote">
      <button type="button" class="rl-prec" aria-label="Site précédent">${FLECHE}</button>
      <p class="rl-compte" aria-live="polite"><b>1</b> sur ${SITES.length}</p>
      <div class="rl-jauge" aria-hidden="true"><i></i></div>
      <button type="button" class="rl-suiv" aria-label="Site suivant">${FLECHE}</button>
    </div>
  </div>`;

  const $ = (s) => el.querySelector(s);
  const racine = $('.rl'), rail = $('.rl-rail'), compte = $('.rl-compte b'), jauge = $('.rl-jauge i');
  const sites = [...el.querySelectorAll('.rl-site')];
  const prec = $('.rl-prec'), suiv = $('.rl-suiv');

  // Parcourir les écrans d'un site : l'ordinateur change d'image ; le téléphone montre l'accueil, puis l'intérieur
  const surEcran = (e) => {
    const b = e.target.closest('.rl-ecrans button'); if (!b) return;
    const site = b.closest('.rl-site'), k = +b.dataset.k;
    site.querySelectorAll('.rl-ecrans button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    site.querySelectorAll('.rl-vue').forEach((im, j) => im.classList.toggle('rl-active', j === k));
    site.querySelectorAll('.rl-tel-vue').forEach((im, j) => im.classList.toggle('rl-active', j === (k === 0 ? 0 : 1)));
  };
  el.addEventListener('click', surEcran);

  // Le rail : boutons, compteur, jauge
  let courant = 0;
  const pas = () => (sites[1] ? sites[1].offsetLeft - sites[0].offsetLeft : rail.clientWidth);
  function aller(i) {
    i = Math.max(0, Math.min(sites.length - 1, i));
    rail.scrollTo({ left: sites[i].offsetLeft - sites[0].offsetLeft, behavior: reduit ? 'auto' : 'smooth' });
  }
  prec.addEventListener('click', () => aller(courant - 1));
  suiv.addEventListener('click', () => aller(courant + 1));
  let attente = 0;
  function lire() {
    attente = 0;
    const max = rail.scrollWidth - rail.clientWidth;
    const i = Math.round(rail.scrollLeft / Math.max(1, pas()));
    courant = Math.max(0, Math.min(sites.length - 1, rail.scrollLeft >= max - 4 ? sites.length - 1 : i));
    compte.textContent = String(courant + 1);
    jauge.style.transform = `scaleX(${(courant + 1) / sites.length})`;
    prec.disabled = rail.scrollLeft <= 4;
    suiv.disabled = rail.scrollLeft >= max - 4;
    sites.forEach((s, k) => s.classList.toggle('rl-courant', k === courant));
  }
  const surDefilement = () => { if (!attente) attente = requestAnimationFrame(lire); };
  rail.addEventListener('scroll', surDefilement, { passive: true });
  // au clavier, un lien ou un bouton qui prend le focus amène son site au centre du rail
  const surFocus = (e) => { const s = e.target.closest('.rl-site'); if (s && +s.dataset.i !== courant) aller(+s.dataset.i); };
  rail.addEventListener('focusin', surFocus);
  const ro = new ResizeObserver(() => lire());
  ro.observe(rail);
  lire();

  // Apparition douce des sites quand le rail arrive à l'écran (en mouvement réduit : un simple fondu)
  const vigie = new IntersectionObserver((es) => {
    for (const e of es) if (e.isIntersecting) { racine.classList.add('rl-vu'); vigie.disconnect(); }
  }, { threshold: .15 });
  vigie.observe(racine);

  return {
    detruire() {
      vigie.disconnect(); ro.disconnect(); cancelAnimationFrame(attente);
      el.removeEventListener('click', surEcran); rail.removeEventListener('scroll', surDefilement); rail.removeEventListener('focusin', surFocus);
      el.replaceChildren();
    },
  };
}

export default monter;
