// Kazura v12, Expériences : « Modifier soi-même ».
// Un petit espace de modification à côté du site : on change un tarif, une phrase, on affiche un message
// de fermeture, et le site suit aussitôt. C'est une démonstration : rien n'est enregistré ailleurs que dans la page.

const DEPART = { phrase: 'Un temps pour vous, à votre rythme.', tarif: 60, message: false };

export function demarrer(el, { reduit = false } = {}) {
  el.classList.add('ed');
  const v = { ...DEPART };
  el.innerHTML = `
    <div class="ed-fond" aria-hidden="true"></div>
    <div class="ed-scene">
      <div class="ed-site" aria-label="Aperçu du site">
        <div class="ed-barre" aria-hidden="true"><span></span><span></span><span></span><em>votre-site.fr</em></div>
        <div class="ed-page">
          <p class="ed-bandeau" hidden>Le cabinet est fermé du 24 au 31 décembre. Bonnes fêtes&nbsp;!</p>
          <p class="ed-marque">Votre cabinet</p>
          <p class="ed-phrase"></p>
          <div class="ed-tarif"><span class="ed-tarif-nom">Séance individuelle<small>1 h</small></span><span class="ed-prix"><b></b>&nbsp;€</span></div>
          <span class="ed-bouton" aria-hidden="true">Prendre rendez-vous</span>
        </div>
      </div>
      <form class="ed-espace" aria-label="Votre espace de modification" novalidate>
        <p class="ed-espace-titre"><span class="ed-pastille" aria-hidden="true"></span>Votre espace</p>
        <label class="ed-champ"><span>Tarif de la séance</span>
          <span class="ed-prix-saisie">
            <button type="button" class="ed-moins" aria-label="Baisser le tarif de 5 euros">−</button>
            <input class="ed-tarif-saisie" type="number" inputmode="numeric" min="0" max="999" step="5" value="${v.tarif}" aria-label="Tarif en euros">
            <span aria-hidden="true">€</span>
            <button type="button" class="ed-plus" aria-label="Monter le tarif de 5 euros">+</button>
          </span>
        </label>
        <label class="ed-champ"><span>Phrase d’accueil</span>
          <input class="ed-phrase-saisie" type="text" maxlength="70" value="${v.phrase}">
        </label>
        <label class="ed-interrupteur"><input class="ed-message-saisie" type="checkbox"><span class="ed-glissiere" aria-hidden="true"></span><span>Afficher « fermé pour les fêtes »</span></label>
        <div class="ed-pied">
          <button type="submit" class="ed-enregistrer">Enregistrer</button>
          <p class="ed-etat" aria-live="polite"></p>
        </div>
      </form>
    </div>`;
  const $ = (s) => el.querySelector(s);
  const phrase = $('.ed-phrase'), prix = $('.ed-prix b'), bandeau = $('.ed-bandeau'), etat = $('.ed-etat');
  const saisieTarif = $('.ed-tarif-saisie'), saisiePhrase = $('.ed-phrase-saisie'), saisieMessage = $('.ed-message-saisie');

  // le site suit chaque modification, et la partie changée s'éclaire un instant
  const eclairer = (n) => { n.classList.remove('ed-eclat'); void n.offsetWidth; n.classList.add('ed-eclat'); };
  function rendre(quoi) {
    phrase.textContent = v.phrase.trim() || ' ';
    prix.textContent = String(v.tarif);
    bandeau.hidden = !v.message;
    if (quoi === 'tarif') eclairer($('.ed-tarif'));
    if (quoi === 'phrase') eclairer(phrase);
    if (quoi === 'message' && v.message) eclairer(bandeau);
    if (quoi) { etat.textContent = 'Modifié, pas encore enregistré'; etat.className = 'ed-etat ed-attente'; }
  }
  const borner = (n) => Math.max(0, Math.min(999, Math.round(n)));
  const surSaisie = (e) => {
    if (e.target === saisieTarif) { const n = parseInt(saisieTarif.value, 10); if (!Number.isNaN(n)) { v.tarif = borner(n); rendre('tarif'); } }
    if (e.target === saisiePhrase) { v.phrase = saisiePhrase.value; rendre('phrase'); }
    if (e.target === saisieMessage) { v.message = saisieMessage.checked; rendre('message'); }
  };
  const surClic = (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.classList.contains('ed-moins') || b.classList.contains('ed-plus')) {
      v.tarif = borner(v.tarif + (b.classList.contains('ed-plus') ? 5 : -5)); saisieTarif.value = v.tarif; rendre('tarif');
    }
  };
  let minuteur = 0;
  const surEnvoi = (e) => {
    e.preventDefault();
    etat.textContent = 'Enregistrement…'; etat.className = 'ed-etat';
    clearTimeout(minuteur);
    minuteur = setTimeout(() => { etat.textContent = 'Enregistré. Votre site est à jour.'; etat.className = 'ed-etat ed-ok'; eclairer($('.ed-site')); }, reduit ? 350 : 650);
  };
  el.addEventListener('input', surSaisie);
  el.addEventListener('change', surSaisie);
  el.addEventListener('click', surClic);
  $('.ed-espace').addEventListener('submit', surEnvoi);
  rendre();

  return {
    pause() {},
    arreter() { clearTimeout(minuteur); el.removeEventListener('input', surSaisie); el.removeEventListener('change', surSaisie); el.removeEventListener('click', surClic); el.classList.remove('ed'); el.replaceChildren(); },
  };
}
