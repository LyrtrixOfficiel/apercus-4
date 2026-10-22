// Kazura : le défilement lissé, sans dépendance.
// - Molette et pavé tactile (souris) : plus de crans, une inertie douce (amortissement exponentiel).
// - Clavier (flèches, Page suivante, Espace, Début, Fin) : le même glissé.
// - Ancres (#partie) : la page glisse jusqu'à la partie, sur une courbe douce, puis l'adresse et le focus suivent.
// - Au doigt (téléphone, tablette) : le défilement natif est gardé, il est déjà fluide ; seules les ancres glissent.
// - Mouvement réduit : le lissage reste, plus court (adoucir, jamais couper).
// La page lit window.scrollY comme d'habitude : chaque image du lissage déclenche un événement « scroll ».

const borne = (x, a, b) => Math.min(b, Math.max(a, x));
const doux = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export function lisser({ reduit = false } = {}) {
  const html = document.documentElement;
  const souris = matchMedia('(hover: hover) and (pointer: fine)').matches;
  html.classList.add('lisse');
  // la constante de temps de l'inertie (s) : 0,2 s ; 0,16 s en mouvement réduit. Mathéo est en mouvement réduit :
  // à 0,075 s, chaque cran de molette se sentait (retour du 20/10). Adoucir, jamais couper.
  const TAU = reduit ? 0.16 : 0.2;
  // v15 : deux amortis en cascade (chacun TAU / 2), au lieu d'un seul. Le retard moyen reste TAU, mais la VITESSE
  // devient continue : un cran de molette ajoute de l'élan au lieu de donner un coup. Avec un seul amorti, la vitesse
  // sautait à chaque cran (mesuré : saut de vitesse égal à la vitesse maximale), c'est ce « cran » qu'on sentait.
  const T1 = TAU / 2, T2 = TAU / 2;
  let cible = scrollY, milieu = scrollY, courant = scrollY, pose = scrollY;
  let enCours = false, dernier = 0, trajet = null;
  const ecouteurs = new Set();

  const max = () => Math.max(0, html.scrollHeight - innerHeight);
  // la position garde ses décimales : le navigateur l'aligne lui-même sur les pixels de l'écran, et la scène suit
  // la position exacte (surImage), sans marches d'un pixel dans la fin de l'élan
  const poser = (y) => { pose = y; window.scrollTo({ top: y, left: 0, behavior: 'instant' }); };

  function image(t) {
    if (!enCours) return;
    const dt = Math.min(0.05, dernier ? (t - dernier) / 1000 : 1 / 60);
    dernier = t;
    if (trajet) {
      const k = borne((t - trajet.t0) / trajet.d, 0, 1);
      courant = milieu = cible = trajet.de + (trajet.a - trajet.de) * doux(k);
      if (k >= 1) { const fin = trajet.fin; trajet = null; courant = milieu = cible; poser(courant); arreter(); fin?.(); return; }
    } else {
      milieu += (cible - milieu) * (1 - Math.exp(-dt / T1));
      courant += (milieu - courant) * (1 - Math.exp(-dt / T2));
      if (Math.abs(cible - courant) < 0.3 && Math.abs(milieu - courant) < 0.3) courant = milieu = cible;
    }
    poser(courant);
    for (const f of ecouteurs) f(courant);
    if (!trajet && courant === cible) { arreter(); return; }
    requestAnimationFrame(image);
  }
  function demarrer() { if (enCours) return; enCours = true; dernier = 0; requestAnimationFrame(image); }
  function arreter() { enCours = false; }
  function synchroniser() { cible = milieu = courant = pose = scrollY; }

  /** Glisse de dy pixels (inertie). */
  function pousser(dy) {
    if (trajet) { trajet = null; synchroniser(); }
    if (!enCours) synchroniser();
    // un retour en arrière pendant l'élan : l'élan contraire est gardé, la cascade le retourne en douceur
    cible = borne(cible + dy, 0, max());
    demarrer();
  }

  /** Va à une position (nombre) ou à un élément, sur une courbe douce. */
  function aller(dest, { fin, duree } = {}) {
    let y = dest;
    if (dest && typeof dest === 'object') {
      const mt = parseFloat(getComputedStyle(dest).scrollMarginTop) || 0;
      y = dest.getBoundingClientRect().top + scrollY - mt;
    }
    y = borne(Math.round(y), 0, max());
    synchroniser();
    const dist = Math.abs(y - scrollY);
    if (dist < 2) { fin?.(); return; }
    const d = duree ?? (reduit ? borne(380 + dist / 9, 420, 900) : borne(650 + dist / 5, 800, 1700));
    trajet = { de: scrollY, a: y, t0: performance.now(), d, fin };
    demarrer();
  }

  // un défilement venu d'ailleurs (barre de défilement, doigt, recherche dans la page, retour arrière) : on suit
  addEventListener('scroll', () => { if (Math.abs(scrollY - pose) > 3) { trajet = null; arreter(); synchroniser(); } }, { passive: true });
  addEventListener('resize', () => { cible = borne(cible, 0, max()); });

  /** Un élément qui défile lui-même (menu, champ de texte, accordéon…) garde sa molette. */
  function defileSeul(el, dy) {
    for (let e = el; e && e !== document.body && e !== html; e = e.parentElement) {
      if (e.nodeType !== 1) continue;
      const s = getComputedStyle(e);
      if (/(auto|scroll)/.test(s.overflowY) && e.scrollHeight > e.clientHeight + 1) {
        if ((dy < 0 && e.scrollTop > 0) || (dy > 0 && e.scrollTop + e.clientHeight < e.scrollHeight - 1)) return true;
      }
    }
    return false;
  }
  const bloque = () => html.classList.contains('xp-plein-ouvert') || getComputedStyle(document.body).overflowY === 'hidden';

  if (souris) {
    addEventListener('wheel', (e) => {
      if (e.ctrlKey || e.defaultPrevented || bloque()) return;
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      let dy = e.deltaY;
      if (e.deltaMode === 1) dy *= 40; else if (e.deltaMode === 2) dy *= innerHeight;
      if (defileSeul(e.target, dy)) return;
      e.preventDefault();
      pousser(dy);
    }, { passive: false });

    addEventListener('keydown', (e) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || bloque()) return;
      const t = e.target;
      if (t && t.closest && t.closest('input, textarea, select, [contenteditable], video, audio')) return;
      const H = innerHeight * 0.86;
      let dy = 0;
      switch (e.key) {
        case 'ArrowDown': dy = 110; break;
        case 'ArrowUp': dy = -110; break;
        case 'PageDown': dy = H; break;
        case 'PageUp': dy = -H; break;
        case ' ': if (t && t.closest && t.closest('button, a, summary, [role=button]')) return; dy = e.shiftKey ? -H : H; break;
        case 'Home': if (t && t.closest && t.closest('[role=slider]')) return; e.preventDefault(); aller(0); return;
        case 'End': if (t && t.closest && t.closest('[role=slider]')) return; e.preventDefault(); aller(max()); return;
        default: return;
      }
      e.preventDefault();
      pousser(dy);
    });
  }

  // les ancres de cette page glissent jusqu'à leur partie (au doigt aussi)
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || url.pathname !== location.pathname || !url.hash || a.target === '_blank') return;
    const id = decodeURIComponent(url.hash.slice(1));
    const dest = id ? document.getElementById(id) : null;
    if (!dest) return;
    e.preventDefault();
    aller(dest, {
      fin: () => {
        if (location.hash !== url.hash) history.pushState(null, '', url.hash);
        if (!dest.hasAttribute('tabindex') && !/^(A|BUTTON|INPUT|TEXTAREA|SELECT|SUMMARY)$/.test(dest.tagName)) dest.setAttribute('tabindex', '-1');
        try { dest.focus({ preventScroll: true }); } catch {}
      },
    });
  });

  // un doigt qui se pose arrête un glissé d'ancre en cours
  addEventListener('touchstart', () => { if (trajet) { trajet = null; arreter(); synchroniser(); } }, { passive: true });

  return {
    aller,
    pousser,
    position: () => (enCours ? courant : scrollY),
    surImage: (f) => { ecouteurs.add(f); return () => ecouteurs.delete(f); },
  };
}
