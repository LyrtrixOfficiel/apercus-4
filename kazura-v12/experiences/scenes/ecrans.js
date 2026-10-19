// Kazura v12, Expériences : « Sur tous les écrans ».
// Le même petit site dans un écran dont on fait glisser le bord : téléphone, tablette, ordinateur.
// Le site se réorganise de lui-même (requêtes de conteneur) ; l'écran prend la forme de l'appareil.

const APPAREILS = [
  { id: 'tel', nom: 'Téléphone', l: 375 },
  { id: 'tab', nom: 'Tablette', l: 768 },
  { id: 'ordi', nom: 'Ordinateur', l: 1280 },
];
const MIN = 320, MAX = 1440;

export function demarrer(el, { reduit = false } = {}) {
  el.classList.add('ec');
  el.innerHTML = `
    <div class="ec-fond" aria-hidden="true"></div>
    <div class="ec-choix" role="group" aria-label="Taille d’écran">
      ${APPAREILS.map((a) => `<button type="button" data-l="${a.l}" aria-pressed="false">${a.nom}</button>`).join('')}
    </div>
    <div class="ec-table">
      <div class="ec-ecran" data-forme="tel">
        <div class="ec-chrome" aria-hidden="true"><span></span><span></span><span></span><em>votre-site.fr</em></div>
        <div class="ec-encoche" aria-hidden="true"></div>
        <div class="ec-vue">
          <div class="ec-site">
            <header class="ec-tete">
              <span class="ec-logo"><i></i>Votre cabinet</span>
              <nav class="ec-nav" aria-hidden="true"><span>Séances</span><span>Tarifs</span><span>À propos</span><span>Contact</span></nav>
              <span class="ec-menu" aria-hidden="true"><i></i><i></i><i></i></span>
            </header>
            <section class="ec-heros">
              <div class="ec-heros-texte">
                <p class="ec-sur">Sophrologie, à deux pas de chez vous</p>
                <p class="ec-titre">Retrouver du calme, séance après séance.</p>
                <p class="ec-chapo">Un accompagnement doux pour mieux dormir, souffler et reprendre confiance.</p>
                <span class="ec-cta">Prendre rendez-vous</span>
              </div>
              <div class="ec-visuel" aria-hidden="true"><i></i><i></i><i></i></div>
            </section>
            <section class="ec-offres">
              <div><b>Première séance</b><span>1 h 15</span><p>Faire connaissance et poser les bases.</p></div>
              <div><b>Séance de suivi</b><span>1 h</span><p>Continuer, à votre rythme.</p></div>
              <div><b>En visio</b><span>45 min</span><p>De chez vous, sans trajet.</p></div>
            </section>
            <footer class="ec-pied"><span>Votre cabinet</span><span>Sur rendez-vous, du lundi au samedi</span></footer>
          </div>
        </div>
      </div>
      <div class="ec-poignee" role="slider" tabindex="0" aria-label="Largeur de l’écran" aria-valuemin="${MIN}" aria-valuemax="${MAX}" aria-valuenow="375" aria-valuetext="375 pixels, téléphone"><i></i></div>
    </div>
    <p class="ec-mesure" aria-hidden="true"><b>375</b> px <span>téléphone</span></p>
    <p class="ec-aide" aria-hidden="true">Faites glisser la poignée</p>`;
  const $ = (s) => el.querySelector(s);
  const table = $('.ec-table'), ecran = $('.ec-ecran'), poignee = $('.ec-poignee'), mesure = $('.ec-mesure');
  const boutons = [...el.querySelectorAll('.ec-choix button')];
  let largeur = 375, anime = false;

  const forme = (l) => (l < 600 ? 'tel' : l < 1000 ? 'tab' : 'ordi');
  const NOMS = { tel: 'téléphone', tab: 'tablette', ordi: 'ordinateur' };
  function poser(l, { doux = false } = {}) {
    largeur = Math.max(MIN, Math.min(MAX, Math.round(l)));
    const r = table.getBoundingClientRect();
    const f = forme(largeur), bord = f === 'tel' ? 24 : f === 'tab' ? 30 : 16;
    const k = Math.min(1, (r.width - 8) / (largeur + bord), 1);
    const h = Math.max(200, r.height / k);
    ecran.classList.toggle('ec-anime', doux && !reduit);
    ecran.classList.toggle('ec-anime-court', doux && reduit);
    ecran.style.width = `${largeur + bord}px`;
    // la hauteur suit la forme de l'appareil : un téléphone en long, une tablette debout, un ordinateur en largeur
    const propre = f === 'tel' ? Math.max(560, largeur * 2.05) : f === 'tab' ? largeur * 1.3 : Math.max(560, largeur * .62);
    ecran.style.height = `${Math.min(h, propre)}px`;
    ecran.style.transform = `translate(-50%, -50%) scale(${k})`;
    ecran.dataset.forme = f;
    poignee.style.left = `calc(50% + ${((largeur + bord) * k) / 2 + 4}px)`;
    mesure.querySelector('b').textContent = largeur;
    mesure.querySelector('span').textContent = NOMS[f];
    poignee.setAttribute('aria-valuenow', String(largeur));
    poignee.setAttribute('aria-valuetext', `${largeur} pixels, ${NOMS[f]}`);
    boutons.forEach((b) => b.setAttribute('aria-pressed', String(forme(+b.dataset.l) === f)));
  }

  // les boutons : l'écran prend la taille de l'appareil, en douceur
  const surChoix = (e) => { const b = e.target.closest('button'); if (b) { poser(+b.dataset.l, { doux: true }); el.classList.add('ec-touche'); } };
  $('.ec-choix').addEventListener('click', surChoix);

  // la poignée : on fait glisser le bord (l'écran est centré : il grandit des deux côtés)
  let tire = null;
  const surAppui = (e) => {
    tire = { x: e.clientX, l: largeur, k: ecran.getBoundingClientRect().width / ecran.offsetWidth || 1 };
    poignee.setPointerCapture?.(e.pointerId); el.classList.add('ec-touche', 'ec-tire'); e.preventDefault();
  };
  const surMouvement = (e) => { if (tire) poser(tire.l + (e.clientX - tire.x) * 2 / tire.k); };
  const surFin = () => { tire = null; el.classList.remove('ec-tire'); };
  poignee.addEventListener('pointerdown', surAppui);
  poignee.addEventListener('pointermove', surMouvement);
  poignee.addEventListener('pointerup', surFin);
  poignee.addEventListener('pointercancel', surFin);
  poignee.addEventListener('keydown', (e) => {
    const pas = { ArrowRight: 20, ArrowUp: 20, ArrowLeft: -20, ArrowDown: -20, PageUp: 100, PageDown: -100 }[e.key];
    if (pas) { e.preventDefault(); poser(largeur + pas); el.classList.add('ec-touche'); }
    if (e.key === 'Home') { e.preventDefault(); poser(MIN); } if (e.key === 'End') { e.preventDefault(); poser(MAX); }
  });

  const ro = new ResizeObserver(() => poser(largeur));
  ro.observe(table);
  poser(375);

  // une petite démonstration au premier affichage : l'écran s'élargit puis revient (plus courte en mouvement réduit)
  let minuteurs = [];
  if (!anime) {
    anime = true;
    minuteurs.push(setTimeout(() => { if (!el.classList.contains('ec-touche')) poser(768, { doux: true }); }, reduit ? 900 : 1200));
    minuteurs.push(setTimeout(() => { if (!el.classList.contains('ec-touche')) poser(1280, { doux: true }); }, reduit ? 2400 : 2700));
    minuteurs.push(setTimeout(() => { if (!el.classList.contains('ec-touche')) poser(375, { doux: true }); }, reduit ? 4200 : 4500));
  }

  return {
    pause() {},
    arreter() { minuteurs.forEach(clearTimeout); ro.disconnect(); el.classList.remove('ec', 'ec-touche', 'ec-tire'); el.replaceChildren(); },
  };
}
