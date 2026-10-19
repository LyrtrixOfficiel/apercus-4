// Kazura v12, Expériences : « Prendre rendez-vous ».
// Une prise de rendez-vous qu'on essaie vraiment : une prestation, un jour, une heure, la confirmation.
// C'est une démonstration : rien n'est enregistré, rien n'est envoyé, aucune donnée n'est demandée.

const PRESTATIONS = [
  { id: 'premiere', nom: 'Première séance', duree: '1 h 15', note: 'Pour faire connaissance et poser les bases.' },
  { id: 'suivi', nom: 'Séance de suivi', duree: '1 h', note: 'Pour continuer le travail commencé.' },
  { id: 'visio', nom: 'Séance en visio', duree: '45 min', note: 'De chez vous, sur ordinateur ou téléphone.' },
];
const HEURES = [[9, 0], [10, 30], [14, 0], [15, 30], [17, 0], [18, 30]];
const JOURS = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
const JOURS_LONGS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const heure = ([h, m]) => `${h} h${m ? ' ' + String(m).padStart(2, '0') : ''}`;

export function demarrer(el, { reduit = false } = {}) {
  el.classList.add('rv');
  // les douze prochains jours ouvrés (le cabinet est fermé le dimanche)
  const jours = [];
  for (let d = new Date(), k = 0; jours.length < 12 && k < 30; k++) {
    d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
    if (d.getDay() !== 0) jours.push(d);
  }
  // quelques créneaux déjà pris, toujours les mêmes pour un même jour
  const pris = (d, i) => ((d.getDate() * 7 + d.getMonth() * 3 + i * 5) % 9) < 3;
  const choix = { p: null, j: 0, h: null };

  el.innerHTML = `
    <div class="rv-fond" aria-hidden="true"></div>
    <div class="rv-carte">
      <div class="rv-tete">
        <p class="rv-site">Votre cabinet</p>
        <p class="rv-titre">Prendre rendez-vous</p>
        <ol class="rv-fil" aria-label="Étapes">
          <li data-e="1" aria-current="step">Prestation</li><li data-e="2">Jour et heure</li><li data-e="3">Confirmation</li>
        </ol>
      </div>
      <div class="rv-corps" aria-live="polite"></div>
    </div>`;
  const corps = el.querySelector('.rv-corps'), fil = [...el.querySelectorAll('.rv-fil li')];

  function etape(n, rendu) {
    fil.forEach((li) => { const e = +li.dataset.e; li.toggleAttribute('aria-current', e === n); if (e === n) li.setAttribute('aria-current', 'step'); li.classList.toggle('rv-fait', e < n); });
    corps.classList.remove('rv-entre'); void corps.offsetWidth;
    corps.innerHTML = rendu; corps.classList.add('rv-entre');
    corps.scrollTop = 0;
    const premier = corps.querySelector('[data-focus]'); if (premier && el.contains(document.activeElement)) premier.focus({ preventScroll: true });
  }

  function un() {
    etape(1, `
      <p class="rv-q">Quelle séance souhaitez-vous&nbsp;?</p>
      <div class="rv-liste">
        ${PRESTATIONS.map((p, i) => `<button type="button" class="rv-presta" data-p="${p.id}" ${i === 0 ? 'data-focus' : ''} aria-pressed="${choix.p === p.id}">
          <span class="rv-presta-nom">${p.nom}</span><span class="rv-presta-duree">${p.duree}</span><span class="rv-presta-note">${p.note}</span></button>`).join('')}
      </div>`);
  }

  function deux() {
    const j = jours[choix.j];
    etape(2, `
      <button type="button" class="rv-retour" data-aller="1">Retour</button>
      <p class="rv-q">Quel jour vous convient&nbsp;?</p>
      <div class="rv-jours" role="group" aria-label="Jours disponibles">
        ${jours.map((d, i) => `<button type="button" class="rv-jour" data-j="${i}" aria-pressed="${i === choix.j}" ${i === choix.j ? 'data-focus' : ''}><span>${JOURS[d.getDay()]}</span><strong>${d.getDate()}</strong><span>${MOIS[d.getMonth()].slice(0, 4)}${MOIS[d.getMonth()].length > 4 ? '.' : ''}</span></button>`).join('')}
      </div>
      <p class="rv-q rv-q2">Les horaires du ${JOURS_LONGS[j.getDay()]} ${j.getDate()} ${MOIS[j.getMonth()]}</p>
      <div class="rv-heures">
        ${HEURES.map((h, i) => pris(j, i)
          ? `<button type="button" class="rv-heure" disabled aria-label="${heure(h)}, déjà pris">${heure(h)}</button>`
          : `<button type="button" class="rv-heure" data-h="${i}">${heure(h)}</button>`).join('')}
      </div>`);
    const actif = corps.querySelector('.rv-jour[aria-pressed="true"]');
    const bande = corps.querySelector('.rv-jours');
    if (actif && bande) bande.scrollLeft = actif.offsetLeft - bande.clientWidth / 2 + actif.offsetWidth / 2;
  }

  function trois() {
    const p = PRESTATIONS.find((x) => x.id === choix.p), j = jours[choix.j], h = HEURES[choix.h];
    etape(3, `
      <button type="button" class="rv-retour" data-aller="2">Retour</button>
      <p class="rv-q">Vérifiez votre rendez-vous</p>
      <dl class="rv-resume">
        <div><dt>Séance</dt><dd>${p.nom} <span>(${p.duree})</span></dd></div>
        <div><dt>Quand</dt><dd>${JOURS_LONGS[j.getDay()]} ${j.getDate()} ${MOIS[j.getMonth()]}, à ${heure(h)}</dd></div>
        <div><dt>Où</dt><dd>${p.id === 'visio' ? 'En visio' : 'Au cabinet'}</dd></div>
      </dl>
      <button type="button" class="rv-confirmer" data-focus>Confirmer le rendez-vous</button>
      <p class="rv-demo">Démonstration : en cliquant, rien n’est envoyé.</p>`);
  }

  function fini() {
    const j = jours[choix.j], h = HEURES[choix.h];
    etape(4, `
      <div class="rv-ok">
        <svg class="rv-coche" viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="24"/><path d="M15 27l7 7 15-16"/></svg>
        <p class="rv-ok-titre">C’est noté&nbsp;!</p>
        <p class="rv-ok-texte">Rendez-vous le ${JOURS_LONGS[j.getDay()]} ${j.getDate()} ${MOIS[j.getMonth()]} à ${heure(h)}.</p>
        <p class="rv-demo">Ici, c’était pour de faux : aucun rendez-vous n’a été pris. Sur votre site, la demande vous arrive pour de vrai.</p>
        <button type="button" class="rv-recommencer" data-focus>Recommencer</button>
      </div>`);
    fil.forEach((li) => { li.classList.add('rv-fait'); li.removeAttribute('aria-current'); });
  }

  const surClic = (e) => {
    const b = e.target.closest('button'); if (!b || b.disabled) return;
    if (b.dataset.p) { choix.p = b.dataset.p; choix.h = null; deux(); }
    else if (b.dataset.j) { choix.j = +b.dataset.j; deux(); }
    else if (b.dataset.h) { choix.h = +b.dataset.h; trois(); }
    else if (b.dataset.aller === '1') un();
    else if (b.dataset.aller === '2') deux();
    else if (b.classList.contains('rv-confirmer')) fini();
    else if (b.classList.contains('rv-recommencer')) { choix.p = null; choix.j = 0; choix.h = null; un(); }
  };
  el.addEventListener('click', surClic);
  un();

  return {
    pause() {},
    arreter() { el.removeEventListener('click', surClic); el.classList.remove('rv'); el.replaceChildren(); },
  };
}
