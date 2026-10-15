// Liquid glass : du JSON du praticien au HTML de la page.
// Module partagé : node l'utilise pour écrire index.html (lisible sans JavaScript),
// le navigateur le réutilise pour ?p=<dossier>. Aucune API du DOM ici.

// Lumières du fond par famille de métier : trois teintes pastel qui dérivent, un accent
// (boutons, numéros) et l'encre. L'encre est toujours très foncée : le verre éclaircit le fond.
export const FAMILLES = {
  plantes: {
    nom: 'Menthe, ciel et citron',
    re: /naturo|phyto|herbor|aroma|fleurs? de bach|nutri|diet|ayurv|plante|gemmo|iridolog/i,
    lumieres: ['#9FEFCB', '#A9D8FF', '#FFF0A0', '#C9F7E4'], fond: '#F3FAF7', initiales: '#7FDDB6',
    accent: '#0F6B4F', encre: '#0B1A15', doux: '#3C5A50',
  },
  esprit: {
    nom: 'Lilas, pervenche et pêche',
    re: /hypno|sophro|m[ée]dit|mindful|relaxa|pnl|eft|emdr|psycho|th[ée]rap|gestalt|constellation|art-?th/i,
    lumieres: ['#CDBBFF', '#A9C2FF', '#FFD3BE', '#F2C9F0'], fond: '#F6F4FD', initiales: '#B9A6FF',
    accent: '#4B37C9', encre: '#15122B', doux: '#4A4566',
  },
  toucher: {
    nom: 'Pêche, rose et sable',
    re: /massage|shiatsu|r[ée]flexo|kin[ée]si|ost[ée]o|reiki|magn[ée]t|[ée]nerg|soin|esth[ée]t|drainage|amma|tuina/i,
    lumieres: ['#FFC9AE', '#FFBFD3', '#FFE6B8', '#F7D0C4'], fond: '#FDF6F2', initiales: '#FFB49A',
    accent: '#8C3520', encre: '#24130D', doux: '#5E4339',
  },
  mouvement: {
    nom: 'Abricot, fuchsia pâle et lavande',
    re: /yoga|pilates|qi ?gong|ta[iï] ?chi|danse|gym|sport|stretch|respir/i,
    lumieres: ['#FFCBA6', '#FFBDE3', '#DCCBFF', '#FFE0C4'], fond: '#FDF5F7', initiales: '#FFADD6',
    accent: '#931F55', encre: '#230C1A', doux: '#5C3B4D',
  },
  elan: {
    nom: 'Ciel, corail et beurre',
    re: /coach|accompagn|orientation|bilan|d[ée]veloppement|mentor|conseil/i,
    lumieres: ['#A9DBFF', '#FFB9A3', '#FFE79A', '#C7E8FF'], fond: '#F5F8FC', initiales: '#FFAE96',
    accent: '#962E1B', encre: '#1A1210', doux: '#4F413C',
  },
};
export const ORDRE_FAMILLES = ['plantes', 'esprit', 'toucher', 'mouvement', 'elan'];

export function famille(d) {
  for (const k of ORDRE_FAMILLES) if (FAMILLES[k].re.test(d.metier || '')) return k;
  const texte = [d.metier, ...(d.approche || [])].join(' ');
  for (const k of ORDRE_FAMILLES) if (FAMILLES[k].re.test(texte)) return k;
  return 'plantes';
}

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);
const propre = (s) => String(s ?? '').replace(/[–—]/g, ',').trim();
const plein = (s) => propre(s).length > 0;
// texte affiché : « rendez-vous », « bien-être » ne se coupent jamais au trait d'union
const txt = (s) => esc(s).replace(/(\S*-\S*)/g, (m) => (m.length <= 14 ? `<span class="insecable">${m}</span>` : m));

const I = {
  tel: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 3.5h2.6l1.4 4-2 1.3a12 12 0 0 0 6.6 6.6l1.3-2 4 1.4v2.6a2 2 0 0 1-2.2 2A17.6 17.6 0 0 1 4.6 5.7a2 2 0 0 1 2-2.2Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>',
  menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 9h14M5 15h14" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
  fleche: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  cal: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5.5" width="16" height="14.5" rx="3" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M8 3.5v4M16 3.5v4M4 10h16" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
  fermer: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7 7 17" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
  haut: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  lieu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11Z" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="12" cy="10" r="2.3" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>',
  horloge: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M12 7.5V12l3 2" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
};

function lienFiche(url) {
  if (!url) return null;
  if (/resalib\./i.test(url)) return 'Réserver sur Resalib';
  if (/doctolib\./i.test(url)) return 'Réserver sur Doctolib';
  return 'Voir ma fiche en ligne';
}

const emplacement = (titre, texte) => `<div class="emplacement"><p class="emplacement-titre">${esc(titre)}</p><p>${esc(texte)}</p></div>`;

export function rendre(d) {
  const f = famille(d);
  const F = FAMILLES[f];
  const nom = propre(d.nom), metier = propre(d.metier), ville = propre(d.ville);
  const approche = (d.approche || []).filter(plein).map(propre);
  const apropos = (d.apropos || []).filter(plein).map(propre);
  const apports = (d.apports || []).filter((a) => plein(a.titre));
  const tarifs = (d.tarifs || []).filter((t) => plein(t.nom));
  const etapes = (d.etapes || []).filter((e) => plein(e.titre));
  const fiche = lienFiche(d.resalib);
  // accroche écrite par le praticien : sous le nom ; sinon (phrase générée), on ne la répète pas et la puce dit l'essentiel
  const sienne = d.accrocheSienne && plein(d.accroche);
  const morceaux = [metier, ville, sienne ? '' : propre(d.rdv)].filter(Boolean);
  const puce = morceaux.join(' · ');
  // chaque morceau reste entier, le point médian reste accroché à celui qui le précède
  const puceHtml = morceaux.map((m, i) => `<span class="insecable">${esc(m)}${i < morceaux.length - 1 ? ' ·' : ''}</span>`).join(' ');
  const accroche = sienne ? propre(d.accroche) : '';

  const nav = `
<a class="evitement" href="#contenu">Aller au contenu</a>
<header class="nav-flotte">
  <nav class="barre verre-css" aria-label="Navigation principale">
    <a class="marque" href="#accueil" aria-label="${esc(nom)}, haut de page"><span class="marque-pastille">${esc(d.initiales || '')}</span><span class="marque-nom">${esc(nom)}</span></a>
    <ul class="liens">
      <li><a href="#approche">Approche</a></li><li><a href="#seance">Séance</a></li><li><a href="#tarifs">Tarifs</a></li><li><a href="#apropos">À propos</a></li>
    </ul>
    <a class="bouton bouton-plein petit" href="#contact">${I.cal}<span>Rendez-vous</span></a>
    <button class="bouton-menu" type="button" aria-expanded="false" aria-controls="tiroir"><span class="vh">Ouvrir le menu</span><span class="i-ouvrir">${I.menu}</span><span class="i-fermer">${I.fermer}</span></button>
  </nav>
</header>
<div class="tiroir verre-css" id="tiroir" hidden>
  <nav aria-label="Sections"><a href="#approche">Approche</a><a href="#seance">La séance</a><a href="#tarifs">Tarifs</a><a href="#apropos">À propos</a><a href="#contact">Rendez-vous</a></nav>
  <a class="bouton bouton-plein" href="${esc(d.telLien)}">${I.tel}<span>${esc(d.tel)}</span></a>
</div>`;

  const accueil = `
<section id="accueil" class="sc accueil">
  <div class="carte-heros" data-verre="heros">
    ${puce ? `<p class="puce">${puceHtml}</p>` : ''}
    <h1 class="nom">${esc(nom)}</h1>
    ${accroche ? `<p class="accroche">${txt(accroche)}</p>` : ''}
    <div class="actions">
      <a class="bouton bouton-plein" href="#contact">${I.cal}<span>Prendre rendez-vous</span></a>
      <a class="bouton bouton-verre" data-verre="bouton" href="${esc(d.telLien)}">${I.tel}<span>${esc(d.tel)}</span></a>
    </div>
  </div>
  <p class="indice" aria-hidden="true">La goutte de verre suit votre geste</p>
</section>`;

  const approcheSec = `
<section id="approche" class="sc">
  <div class="cadre">
    <p class="sur-titre">Approche</p>
    <h2 class="titre">Mon approche</h2>
    <div class="grille-approche">
      ${plein(d.conviction) ? `<blockquote class="conviction" data-verre><p>${txt(propre(d.conviction))}</p></blockquote>` : ''}
      <div class="panneau texte-approche" data-verre>
        ${approche.length ? approche.map((p, i) => `<p class="${i === 0 ? 'chapo' : ''}">${txt(p)}</p>`).join('') : emplacement('Ici, votre approche', 'Votre chemin jusqu’à ce métier, ce que vous proposez, et pour qui. En quelques phrases, avec vos mots.')}
      </div>
    </div>
    ${apports.length ? `<ul class="apports">${apports.map((a, i) => `<li class="apport" data-verre><span class="pastille-num">${i + 1}</span><h3>${esc(propre(a.titre))}</h3>${plein(a.texte) ? `<p>${txt(propre(a.texte))}</p>` : ''}</li>`).join('')}</ul>` : ''}
  </div>
</section>`;

  const seanceSec = `
<section id="seance" class="sc">
  <div class="cadre">
    <p class="sur-titre">Déroulé</p>
    <h2 class="titre">La séance</h2>
    ${d.etapesEmplacement ? `<p class="note">Ces étapes attendent vos mots : elles se remplissent ensemble.</p>` : ''}
    <ol class="etapes" data-n="${etapes.length}">
      ${etapes.map((e, i) => `<li class="etape${d.etapesEmplacement ? ' vide' : ''}" data-verre>
        <span class="etape-num" aria-hidden="true">${i + 1}</span>
        <div><h3>${esc(propre(e.titre))}</h3><p>${txt(propre(e.texte))}</p>${plein(e.duree) ? `<p class="duree">${I.horloge}<span>${esc(propre(e.duree))}</span></p>` : ''}</div>
      </li>`).join('')}
    </ol>
  </div>
</section>`;

  const listeTarifs = tarifs.length
    ? tarifs.map((t, i) => `<li class="tarif${i === 0 ? ' vedette' : ''}" data-verre>
        <h3>${esc(propre(t.nom))}</h3>
        <p class="prix">${esc(propre(t.prix) || 'Sur demande')}</p>
        <ul class="details">
          ${plein(d.dureePremiere) ? `<li>${I.horloge}<span>Première séance : ${esc(propre(d.dureePremiere))}</span></li>` : ''}
          ${plein(d.dureeSuivi) ? `<li>${I.horloge}<span>Suivi : ${esc(propre(d.dureeSuivi))}</span></li>` : ''}
          <li>${I.cal}<span>${esc(propre(d.rdv) || 'Sur rendez-vous')}</span></li>
        </ul>
        <a class="bouton bouton-plein" href="#contact">${I.cal}<span>Réserver</span></a>
      </li>`).join('')
    : `<li class="tarif vide" data-verre><h3>Ici, vos tarifs</h3><p class="prix">00 €</p><p class="detail-vide">Vos séances, leur durée et leur prix, comme vous les présentez.</p></li>`;

  const tarifsSec = `
<section id="tarifs" class="sc">
  <div class="cadre">
    <p class="sur-titre">Tarifs</p>
    <h2 class="titre">Les séances</h2>
    <ul class="tarifs">${listeTarifs}</ul>
    ${plein(d.paiement) ? `<p class="paiement">${txt(propre(d.paiement))}</p>` : ''}
  </div>
</section>`;

  const aproposSec = `
<section id="apropos" class="sc">
  <div class="cadre grille-apropos">
    <figure class="portrait">
      <div class="portrait-lentille" data-verre="lentille"><span aria-hidden="true">${esc(d.initiales || '')}</span></div>
      <figcaption>Ici, votre portrait</figcaption>
    </figure>
    <div>
      <p class="sur-titre">À propos</p>
      <h2 class="titre">${esc(nom)}</h2>
      <div class="panneau" data-verre>
        ${apropos.length ? apropos.map((p, i) => `<p class="${i === 0 ? 'chapo' : ''}">${txt(p)}</p>`).join('') : emplacement('Ici, votre histoire', 'Votre parcours, vos formations, ce qui vous anime. Une page qui vous ressemble.')}
        ${plein(d.cerf) ? `<p class="signature">${txt(propre(d.cerf))}</p>` : ''}
      </div>
    </div>
  </div>
</section>`;

  const lieu = [propre(d.rdv), ville].filter(Boolean).join(' · ');
  const contactSec = `
<section id="contact" class="sc">
  <div class="cadre">
    <div class="carte-contact" data-verre="contact">
      <p class="sur-titre">Rendez-vous</p>
      <h2 class="titre">Prenons rendez-vous</h2>
      <a class="numero" href="${esc(d.telLien)}" aria-label="Appeler le ${esc(d.tel)}">${esc(d.tel)}</a>
      ${lieu ? `<p class="lieu">${I.lieu}<span>${txt(lieu)}</span></p>` : ''}
      <div class="actions">
        <a class="bouton bouton-plein" href="${esc(d.telLien)}">${I.tel}<span>${esc(d.appeler || 'Appeler')}</span></a>
        ${fiche ? `<a class="bouton bouton-verre" data-verre="bouton" href="${esc(d.resalib)}" rel="noopener" target="_blank">${I.fleche}<span>${esc(fiche)}</span></a>` : ''}
        ${plein(d.facebook) ? `<a class="bouton bouton-verre" data-verre="bouton" href="${esc(d.facebook)}" rel="noopener" target="_blank">${I.fleche}<span>Facebook</span></a>` : ''}
      </div>
    </div>
  </div>
  <footer class="pied">
    <div class="pied-verre" data-verre>
      <div class="pied-ligne"><p class="pied-nom">${esc(nom)}</p><p>${esc(puce)}${plein(d.siret) ? ` · SIRET ${esc(d.siret)}` : ''}</p></div>
      <p class="avertissement">${txt(propre(d.avertissement))}</p>
      <p class="apercu">Aperçu préparé pour ${esc(nom)}. Textes, photos, couleurs : tout se modifie selon vos goûts.</p>
      <a class="haut" href="#accueil">${I.haut}<span>Haut de page</span></a>
    </div>
  </footer>
</section>`;

  const html = `${nav}
<canvas class="lumiere" aria-hidden="true"></canvas>
<main id="contenu" data-famille="${f}">${accueil}${approcheSec}${seanceSec}${tarifsSec}${aproposSec}${contactSec}
</main>`;
  const titre = `${nom}${metier ? ', ' + metier : ''}${ville ? ' à ' + ville : ''}`;
  return { html, titre, description: accroche || propre(d.accroche) || `${metier}, sur rendez-vous.`, famille: f, couleur: F.fond };
}
