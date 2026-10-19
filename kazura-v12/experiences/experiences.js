// Kazura v12, module « Expériences » (agent Vitrine).
// Ce qu'un site peut faire pour vous, à essayer soi-même. Six démonstrations : trois pour émerveiller
// (la prairie, le sable qui chante, le ciel de nuit), trois pour simplifier la vie (prendre rendez-vous,
// modifier soi-même, sur tous les écrans). Aucune ne fabrique de site : ce sont des démonstrations.
//
// API : monter(el, { reduit, mobile }) remplace le contenu de el (le repli statique écrit par la Page)
// par une scène unique qui change selon l'expérience choisie. Une seule expérience vit à la fois, chargée
// à la demande (import dynamique), mise en pause hors de l'écran, plein écran possible avec une sortie
// évidente (bouton « Fermer » et touche Échap). Renvoie { detruire() }.
//
// Chaque scène (scenes/*.js) exporte demarrer(conteneur, { reduit, mobile }) et renvoie
// { arreter(), pause(oui) } ; elle s'adapte seule à la taille de son conteneur.

const XP = [
  {
    id: 'prairie', groupe: 'Pour émerveiller', nom: 'La prairie', geste: 'Passez la main dans l’herbe', lourd: true,
    texte: 'Des milliers de brins d’herbe dessinés en direct par votre navigateur. Ils ondulent au vent et s’écartent sous la main ; un toucher fait courir une onde. Le jour ou le soir, aux couleurs que vous choisissez.',
    pour: 'naturopathes, masseurs, sophrologues, paysagistes, tous ceux dont le métier respire la nature.',
  },
  {
    id: 'sable', groupe: 'Pour émerveiller', nom: 'Le sable qui chante', geste: 'Touchez une note, puis la plaque', lourd: true,
    texte: 'Du sable sur une plaque de métal qui vibre : à chaque note, les grains sautent et dessinent une autre figure. Le son reste coupé tant que vous ne l’activez pas.',
    pour: 'sonothérapeutes, musiciens, professeurs de chant ou de yoga, tous ceux qui travaillent avec le son et le souffle.',
  },
  {
    id: 'ciel', groupe: 'Pour émerveiller', nom: 'Le ciel de nuit', geste: 'Touchez le ciel', lourd: true,
    texte: 'Des aurores aux couleurs de votre marque et un ciel étoilé. Là où vous touchez, la lumière ondule et une étoile file.',
    pour: 'hypnothérapeutes, énergéticiens, astrologues, lieux qui se vivent le soir.',
  },
  {
    id: 'rdv', groupe: 'Pour simplifier la vie', nom: 'Prendre rendez-vous', geste: 'Réservez pour de faux', lourd: false,
    texte: 'Vos clients choisissent une prestation, un jour, une heure, et c’est noté. Fini les dix messages pour caler un créneau. Ici, c’est une démonstration : rien n’est envoyé.',
    pour: 'tous ceux qui reçoivent sur rendez-vous : thérapeutes, esthéticiennes, coiffeurs, artisans. La prise de rendez-vous en ligne est comprise dans chaque site.',
  },
  {
    id: 'editeur', groupe: 'Pour simplifier la vie', nom: 'Modifier soi-même', geste: 'Changez le tarif ou le texte', lourd: false,
    texte: 'Un nouveau tarif, des congés, une phrase à reprendre : vous le changez vous-même, et le site suit. Pas besoin de savoir coder, ni d’attendre quelqu’un.',
    pour: 'ceux qui veulent garder la main. Et si vous préférez ne rien toucher, l’abonnement comprend toutes les modifications que vous demandez.',
  },
  {
    id: 'ecrans', groupe: 'Pour simplifier la vie', nom: 'Sur tous les écrans', geste: 'Faites glisser le bord de l’écran', lourd: false,
    texte: 'Le même site sur un téléphone, une tablette, un ordinateur : tout se réorganise pour rester lisible et facile à toucher. Faites glisser la poignée pour le voir changer.',
    pour: 'tout le monde : beaucoup de vos visiteurs vous découvriront sur leur téléphone, souvent entre deux choses.',
  },
];

const ICONES = {
  plein: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
  fermer: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  jouer: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>',
};

export function monter(el, opts = {}) {
  const reduit = opts.reduit ?? matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile = opts.mobile ?? matchMedia('(max-width: 760px), (pointer: coarse)').matches;
  const base = new URL('.', import.meta.url).href;

  // 1. Le gabarit
  let groupe = '';
  const onglets = XP.map((x, i) => {
    const tete = x.groupe !== groupe ? `<p class="xp-groupe" aria-hidden="true">${(groupe = x.groupe)}</p>` : '';
    return `${tete}<button class="xp-onglet" type="button" role="tab" id="xp-onglet-${x.id}" data-id="${x.id}" aria-controls="xp-panneau" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">
      <span class="xp-nom">${x.nom}</span><span class="xp-geste">${x.geste}</span></button>`;
  }).join('');
  el.innerHTML = `
  <div class="xp${reduit ? ' xp-reduit' : ''}${mobile ? ' xp-mobile' : ''}">
    <div class="xp-sommaire" role="tablist" aria-label="Choisir une expérience" aria-orientation="${mobile ? 'horizontal' : 'vertical'}">${onglets}</div>
    <div class="xp-panneau" id="xp-panneau" role="tabpanel" aria-labelledby="xp-onglet-${XP[0].id}">
      <div class="xp-cadre" data-id="${XP[0].id}">
        <div class="xp-toile"></div>
        <div class="xp-affiche" hidden>
          <img alt="" decoding="async">
          <button class="xp-lancer" type="button">${ICONES.jouer}<span>Essayer</span></button>
        </div>
        <div class="xp-attente" hidden><span class="xp-attente-point"></span><span>Un instant, la scène se prépare</span></div>
        <p class="xp-consigne" aria-hidden="true"></p>
        <div class="xp-commandes">
          <button class="xp-plein-btn" type="button" aria-label="Voir en plein écran">${ICONES.plein}<span>Plein écran</span></button>
          <button class="xp-fermer" type="button" hidden>${ICONES.fermer}<span>Fermer</span></button>
        </div>
      </div>
    </div>
    <div class="xp-legende" aria-live="polite">
      <h3 class="xp-l-nom"></h3>
      <p class="xp-l-texte"></p>
      <p class="xp-l-pour"><span class="xp-l-pour-titre">Pour qui&nbsp;?</span> <span class="xp-l-pour-texte"></span></p>
    </div>
  </div>`;

  const $ = (s) => el.querySelector(s);
  const racine = $('.xp'), sommaire = $('.xp-sommaire'), panneau = $('.xp-panneau'), cadre = $('.xp-cadre'), toile = $('.xp-toile');
  const affiche = $('.xp-affiche'), afficheImg = $('.xp-affiche img'), attente = $('.xp-attente'), consigne = $('.xp-consigne');
  const btnPlein = $('.xp-plein-btn'), btnFermer = $('.xp-fermer'), legende = $('.xp-legende');
  const onglets$ = [...el.querySelectorAll('.xp-onglet')];

  let actuel = null, instance = null, jeton = 0, visible = false, dejaVu = false, detruit = false;

  // 2. La légende, qui suit l'expérience choisie
  function ecrireLegende(x) {
    legende.classList.remove('xp-l-entre');
    $('.xp-l-nom').textContent = x.nom;
    $('.xp-l-texte').textContent = x.texte;
    $('.xp-l-pour-texte').textContent = x.pour;
    void legende.offsetWidth; legende.classList.add('xp-l-entre');
  }

  // 3. Lancer une scène (import à la demande) ; une seule vit à la fois
  async function lancer(x) {
    const moi = ++jeton;
    affiche.hidden = true;
    attente.hidden = false;
    let mod;
    try { mod = await import(`${base}scenes/${x.id}.js`); } catch (e) { console.warn('Expérience indisponible', e); }
    if (moi !== jeton || detruit) return;
    attente.hidden = true;
    if (!mod) { toile.innerHTML = '<p class="xp-panne">Cette expérience ne peut pas s’afficher ici. Elle fonctionne dans un navigateur récent.</p>'; return; }
    toile.replaceChildren();
    try { instance = mod.demarrer(toile, { reduit, mobile }) || null; } catch (e) { console.warn(e); instance = null; }
    if (!instance) { toile.innerHTML = '<p class="xp-panne">Votre navigateur ne permet pas d’afficher cette scène (WebGL). Elle s’affiche sur la plupart des téléphones et ordinateurs récents.</p>'; return; }
    cadre.classList.add('xp-vivant');
    if (!visible) instance.pause?.(true);
  }

  function arreter() {
    jeton++;
    try { instance?.arreter?.(); } catch (e) { console.warn(e); }
    instance = null;
    toile.replaceChildren();
    cadre.classList.remove('xp-vivant');
  }

  function montrerAffiche(x) {
    afficheImg.src = `${base}img/${x.id}.webp`;
    afficheImg.onerror = () => { afficheImg.removeAttribute('src'); };
    $('.xp-lancer span').textContent = x.id === 'prairie' ? 'Toucher la prairie' : x.id === 'sable' ? 'Faire chanter le sable' : 'Toucher le ciel';
    affiche.hidden = false;
  }

  function choisir(id, { demande = false, focus = false } = {}) {
    const x = XP.find((e) => e.id === id) || XP[0];
    if (actuel === x && (instance || !demande)) return;
    actuel = x;
    onglets$.forEach((b) => { const oui = b.dataset.id === x.id; b.setAttribute('aria-selected', String(oui)); b.tabIndex = oui ? 0 : -1; if (oui && focus) b.focus(); });
    panneau.setAttribute('aria-labelledby', `xp-onglet-${x.id}`);
    // l'onglet choisi reste visible dans le sélecteur défilant du téléphone
    const b = onglets$.find((o) => o.dataset.id === x.id);
    if (b && sommaire.scrollWidth > sommaire.clientWidth) sommaire.scrollTo({ left: b.offsetLeft - (sommaire.clientWidth - b.offsetWidth) / 2, behavior: reduit ? 'auto' : 'smooth' });
    arreter();
    cadre.dataset.id = x.id;
    racine.dataset.id = x.id;
    consigne.textContent = x.geste;
    consigne.classList.remove('xp-vu');
    ecrireLegende(x);
    // une scène lourde ne démarre que sur demande : un choix dans le sommaire, le bouton « Essayer »,
    // ou, sur ordinateur, la première arrivée de la scène à l'écran
    if (!x.lourd || demande) lancer(x); else { attente.hidden = true; montrerAffiche(x); }
  }

  // 4. Le sommaire : clic, flèches du clavier
  sommaire.addEventListener('click', (e) => { const b = e.target.closest('.xp-onglet'); if (b) choisir(b.dataset.id, { demande: true }); });
  sommaire.addEventListener('keydown', (e) => {
    const i = onglets$.indexOf(document.activeElement); if (i < 0) return;
    const pas = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
    if (pas) { e.preventDefault(); const n = onglets$[(i + pas + onglets$.length) % onglets$.length]; choisir(n.dataset.id, { demande: true, focus: true }); }
    if (e.key === 'Home' || e.key === 'End') { e.preventDefault(); const n = onglets$[e.key === 'Home' ? 0 : onglets$.length - 1]; choisir(n.dataset.id, { demande: true, focus: true }); }
  });
  $('.xp-lancer').addEventListener('click', () => { if (actuel) lancer(actuel); });

  // la consigne s'efface au premier geste dans la scène
  const vu = () => consigne.classList.add('xp-vu');
  toile.addEventListener('pointerdown', vu);
  toile.addEventListener('keydown', vu);

  // 5. Plein écran, avec une sortie évidente
  let plein = false;
  function entrer() {
    if (plein) return; plein = true;
    cadre.classList.add('xp-plein'); document.documentElement.classList.add('xp-plein-ouvert');
    btnFermer.hidden = false; btnPlein.hidden = true;
    const fs = cadre.requestFullscreen?.bind(cadre);
    if (fs && !mobileIOS()) fs({ navigationUI: 'hide' }).catch(() => {});
    btnFermer.focus();
  }
  function sortir() {
    if (!plein) return; plein = false;
    cadre.classList.remove('xp-plein'); document.documentElement.classList.remove('xp-plein-ouvert');
    btnFermer.hidden = true; btnPlein.hidden = false;
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    btnPlein.focus({ preventScroll: true });
    cadre.scrollIntoView({ block: 'nearest', behavior: 'auto' });
  }
  const mobileIOS = () => /iP(hone|od)/.test(navigator.userAgent);
  btnPlein.addEventListener('click', () => { if (actuel?.lourd && !instance) lancer(actuel); entrer(); });
  btnFermer.addEventListener('click', sortir);
  const surTouche = (e) => { if (e.key === 'Escape' && plein) sortir(); };
  const surFS = () => { if (!document.fullscreenElement && plein) sortir(); };
  document.addEventListener('keydown', surTouche);
  document.addEventListener('fullscreenchange', surFS);

  // 6. Hors de l'écran, la scène se met en pause ; sur ordinateur, la première arrivée lance la scène choisie
  const vigie = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting || plein;
    instance?.pause?.(!visible);
    if (visible && !dejaVu && e.intersectionRatio >= .35) {
      dejaVu = true;
      if (!mobile && actuel?.lourd && !instance) lancer(actuel);
    }
  }, { threshold: [0, .35] });
  vigie.observe(cadre);
  const surVisibilite = () => instance?.pause?.(document.hidden || !visible);
  document.addEventListener('visibilitychange', surVisibilite);

  choisir(XP[0].id);

  return {
    detruire() {
      detruit = true; sortir(); arreter(); vigie.disconnect();
      document.removeEventListener('keydown', surTouche);
      document.removeEventListener('fullscreenchange', surFS);
      document.removeEventListener('visibilitychange', surVisibilite);
      el.replaceChildren();
    },
  };
}

export default monter;
