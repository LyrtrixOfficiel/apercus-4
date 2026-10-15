// Pop vitamine : du JSON du praticien au HTML de la page.
// Module partagé : node l'utilise pour écrire index.html (page lisible sans JavaScript),
// le navigateur le réutilise quand l'adresse demande un autre praticien (?p=<dossier>).
// Aucune API du DOM ici.

// Chaque famille de métier : un duo de couleurs vives par section (a vers b), une encre
// qui tient 4,5:1 sur tout le dégradé (vérifié par outils/contraste.mjs), et les objets 3D.
export const FAMILLES = {
  plantes: {
    nom: 'Menthe et violette',
    re: /naturo|phyto|herbor|aroma|fleurs? de bach|nutri|diet|ayurv|plante|gemmo|iridolog/i,
    accent: '#6B48D6', etiquette: '#F4EFFF', etiquetteEncre: '#2A1A6E',
    scenes: {
      accueil: ['#0F7A58', '#6644CF', '#FFFFFF'],
      approche: ['#B9F2D6', '#DCD0FF', '#1B1446'],
      seance: ['#4E34B8', '#7440C4', '#FFFFFF'],
      tarifs: ['#C9F5DE', '#E4DAFF', '#13362A'],
      apropos: ['#0D6B50', '#4B38B0', '#FFFFFF'],
      contact: ['#6644CF', '#0F7A58', '#FFFFFF'],
    },
    objets: { 'heros-g': 'flacon', 'heros-d': 'tasse', p1: 'feuille', p2: 'galet', p3: 'feuille', approche: 'feuille', seance: 'pile', tarifs: 'flacon', apropos: 'tasse', contact: 'feuille' },
    verre: '#D9822B', verreTeinte: '#FFC27A', ceramique: '#F6F1FF', liquide: '#B5651D', galet: '#E9E4F2', feuille: '#2FA36B',
  },
  esprit: {
    nom: 'Indigo et pêche',
    re: /hypno|sophro|m[ée]dit|mindful|relaxa|pnl|eft|emdr|psycho|th[ée]rap|gestalt|constellation|art-?th/i,
    accent: '#3A2FC0', etiquette: '#FFE7D6', etiquetteEncre: '#2A1240',
    scenes: {
      accueil: ['#3A2FC0', '#B03E7B', '#FFFFFF'],
      approche: ['#FFD6BA', '#F8C9E2', '#2A1240'],
      seance: ['#2C2499', '#5A35C8', '#FFFFFF'],
      tarifs: ['#FFE3C8', '#FFD0E0', '#2A1240'],
      apropos: ['#4A2BB0', '#9E3A8A', '#FFFFFF'],
      contact: ['#B03E7B', '#3A2FC0', '#FFFFFF'],
    },
    objets: { 'heros-g': 'bougie', 'heros-d': 'sphere', p1: 'galet', p2: 'sphere', p3: 'galet', approche: 'galet', seance: 'pile', tarifs: 'bougie', apropos: 'sphere', contact: 'galet' },
    verre: '#C9B8FF', ceramique: '#FFF3EA', liquide: '#C27A3A', galet: '#F3E9F7', feuille: '#7A5BE0',
  },
  toucher: {
    nom: 'Terracotta et rose',
    re: /massage|shiatsu|r[ée]flexo|kin[ée]si|ost[ée]o|reiki|magn[ée]t|[ée]nerg|soin|esth[ée]t|drainage|amma|tuina/i,
    accent: '#B5462C', etiquette: '#FFEBDC', etiquetteEncre: '#3B160C',
    scenes: {
      accueil: ['#B0442B', '#A3345C', '#FFFFFF'],
      approche: ['#FFDDC2', '#FBCBC2', '#3B160C'],
      seance: ['#8E3424', '#A8452F', '#FFFFFF'],
      tarifs: ['#FFE8D0', '#FFD7C4', '#3B160C'],
      apropos: ['#962E4A', '#AE442B', '#FFFFFF'],
      contact: ['#A3345C', '#B0442B', '#FFFFFF'],
    },
    objets: { 'heros-g': 'huile', 'heros-d': 'pile', p1: 'feuille', p2: 'galet', p3: 'galet', approche: 'bougie', seance: 'pile', tarifs: 'huile', apropos: 'bougie', contact: 'feuille' },
    verre: '#D08A2A', verreTeinte: '#FFD08A', ceramique: '#FFF1E6', liquide: '#C98A2E', galet: '#3A3633', feuille: '#5C8F4A',
  },
  mouvement: {
    nom: 'Mandarine et fuchsia',
    re: /yoga|pilates|qi ?gong|ta[iï] ?chi|danse|gym|sport|stretch|respir/i,
    accent: '#B42A78', etiquette: '#FFF0DE', etiquetteEncre: '#3A0F2A',
    scenes: {
      accueil: ['#C2441A', '#AE2974', '#FFFFFF'],
      approche: ['#FFD9B8', '#FFC7E6', '#3A0F2A'],
      seance: ['#A3307A', '#B9461C', '#FFFFFF'],
      tarifs: ['#FFE5C8', '#FFD3EC', '#3A0F2A'],
      apropos: ['#8C2969', '#B0481F', '#FFFFFF'],
      contact: ['#AE2974', '#C2441A', '#FFFFFF'],
    },
    objets: { 'heros-g': 'pile', 'heros-d': 'bougie', p1: 'sphere', p2: 'feuille', p3: 'galet', approche: 'feuille', seance: 'pile', tarifs: 'bougie', apropos: 'sphere', contact: 'galet' },
    verre: '#FFB38A', ceramique: '#FFF4EA', liquide: '#C98A2E', galet: '#F2E6DC', feuille: '#E0457F',
  },
  elan: {
    nom: 'Corail et soleil',
    re: /coach|accompagn|orientation|bilan|d[ée]veloppement|mentor|conseil/i,
    accent: '#E8553F', etiquette: '#FFF6D6', etiquetteEncre: '#2B0E08',
    scenes: {
      accueil: ['#FFD23F', '#FF7A5C', '#2B0E08'],
      approche: ['#C93C2A', '#B8305A', '#FFFFFF'],
      seance: ['#FFE27A', '#FFB39B', '#2B0E08'],
      tarifs: ['#B33227', '#C8432C', '#FFFFFF'],
      apropos: ['#FFC94A', '#FF8F6E', '#2B0E08'],
      contact: ['#FF7A5C', '#FFD23F', '#2B0E08'],
    },
    objets: { 'heros-g': 'mug', 'heros-d': 'carnet', p1: 'sphere', p2: 'galet', p3: 'feuille', approche: 'carnet', seance: 'pile', tarifs: 'mug', apropos: 'sphere', contact: 'galet' },
    verre: '#FFD9A0', ceramique: '#FFFFFF', liquide: '#6B3B1E', galet: '#FFF3E0', feuille: '#2E9D6A',
  },
};
export const ORDRE_FAMILLES = ['plantes', 'esprit', 'toucher', 'mouvement', 'elan'];

export function famille(d) {
  const texte = [d.metier, ...(d.approche || [])].join(' ');
  for (const k of ORDRE_FAMILLES) if (FAMILLES[k].re.test(d.metier || '')) return k;
  for (const k of ORDRE_FAMILLES) if (FAMILLES[k].re.test(texte)) return k;
  return 'plantes';
}

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);
// Texte affiché : échappé, et « rendez-vous » ou « bien-être » jamais coupés au trait d'union.
const txt = (s) => esc(s).replace(/(\S*-\S*)/g, (m) => (m.length <= 14 ? `<span class="insecable">${m}</span>` : m));
const propre = (s) => String(s ?? '').replace(/[–—]/g, ',').trim();
const plein = (s) => propre(s).length > 0;

const ICONES = {
  tel: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 3.5h2.6l1.4 4-2 1.3a12 12 0 0 0 6.6 6.6l1.3-2 4 1.4v2.6a2 2 0 0 1-2.2 2A17.6 17.6 0 0 1 4.6 5.7a2 2 0 0 1 2-2.2Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
  menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14M5 12h14M5 16h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  fermer: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  maison: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11.5 12 5l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5h-5v5H5a1 1 0 0 1-1-1Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
  fleche: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  bas: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M6 13l6 6 6-6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  calendrier: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5.5" width="16" height="14.5" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8 3.5v4M16 3.5v4M4 10h16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
};

// Nom géant : un mot par ligne, les mots courts (de, la, du) collés au suivant.
function lignesNom(nom) {
  const mots = propre(nom).split(/\s+/).filter(Boolean);
  const lignes = [];
  for (let i = 0; i < mots.length; i++) {
    if (mots[i].length <= 3 && i < mots.length - 1) { mots[i + 1] = mots[i] + ' ' + mots[i + 1]; continue; }
    lignes.push(mots[i]);
  }
  return lignes;
}

function lienFiche(url) {
  if (!url) return null;
  if (/resalib\./i.test(url)) return 'Réserver sur Resalib';
  if (/doctolib\./i.test(url)) return 'Réserver sur Doctolib';
  return 'Voir ma fiche en ligne';
}

function sceneStyle(f, cle) {
  const [a, b, encre] = FAMILLES[f].scenes[cle];
  return `--a:${a};--b:${b};--encre:${encre}`;
}

function ancre(role, f) {
  return `<div class="ancre ancre-${role}" data-role="${role}" data-objet="${FAMILLES[f].objets[role]}" aria-hidden="true"></div>`;
}

const emplacement = (titre, texte) =>
  `<div class="emplacement" data-pop><p class="emplacement-titre">${esc(titre)}</p><p>${esc(texte)}</p></div>`;

export function rendre(d) {
  const f = famille(d);
  const F = FAMILLES[f];
  const nom = propre(d.nom);
  const metier = propre(d.metier);
  const ville = propre(d.ville);
  const lignes = lignesNom(nom);
  const lw = Math.max(5, ...lignes.map((l) => l.length));
  const surtitre = d.accrocheSienne
    ? [metier, ville].filter(Boolean).join(' · ')
    : propre(d.accroche) || [metier, ville].filter(Boolean).join(' · ');
  const accroche = d.accrocheSienne && plein(d.accroche) ? propre(d.accroche) : '';
  const approche = (d.approche || []).filter(plein).map(propre);
  const apropos = (d.apropos || []).filter(plein).map(propre);
  const apports = (d.apports || []).filter((a) => plein(a.titre));
  const tarifs = (d.tarifs || []).filter((t) => plein(t.nom));
  const etapes = (d.etapes || []).filter((e) => plein(e.titre));
  const fiche = lienFiche(d.resalib);

  // Ruban qui défile : ses propres mots (apports), sinon métier, ville, rendez-vous.
  const motsRuban = apports.length ? apports.map((a) => propre(a.titre)) : [metier, ville, propre(d.rdv)].filter(Boolean);
  const ruban = Array.from({ length: 4 }, () => motsRuban.map((m) => `<span>${esc(m)}</span><i class="etoile"></i>`).join('')).join('');

  const tete = `
<a class="evitement" href="#contenu">Aller au contenu</a>
<header class="tete">
  <a class="logo" href="#accueil" aria-label="${esc(nom)}, haut de page"><span>${esc(d.initiales || nom.slice(0, 2))}</span></a>
  <div class="tete-actions">
    <a class="rond" href="${esc(d.telLien)}" aria-label="Appeler ${esc(nom)} au ${esc(d.tel)}">${ICONES.tel}</a>
    <button class="rond bouton-menu" type="button" aria-expanded="false" aria-controls="menu"><span class="vh">Ouvrir le menu</span><span class="i-ouvrir">${ICONES.menu}</span><span class="i-fermer">${ICONES.fermer}</span></button>
  </div>
</header>
<div class="menu" id="menu" hidden>
  <nav aria-label="Sections">
    <a href="#approche">Approche</a><a href="#seance">La séance</a><a href="#tarifs">Tarifs</a><a href="#apropos">À propos</a><a href="#contact">Rendez-vous</a>
  </nav>
  <a class="pilule" href="${esc(d.telLien)}">${ICONES.tel}<span>${esc(d.tel)}</span></a>
</div>`;

  const accueil = `
<section id="accueil" class="sc sc-accueil" data-scene="accueil" style="${sceneStyle(f, 'accueil')}">
  ${ancre('heros-g', f)}${ancre('heros-d', f)}${ancre('p1', f)}${ancre('p2', f)}${ancre('p3', f)}
  <div class="accueil-texte">
    <p class="surtitre" data-pop>${txt(surtitre)}</p>
    <h1 class="geant" style="--lw:${lw}" aria-label="${esc(nom)}">${lignes.map((l) => `<span class="ligne" aria-hidden="true">${esc(l)}</span>`).join('')}</h1>
    ${accroche ? `<p class="accroche" data-pop>${txt(accroche)}</p>` : ''}
    <div class="actions" data-pop>
      <a class="pilule" href="#contact">${ICONES.calendrier}<span>Prendre rendez-vous</span></a>
    </div>
  </div>
  <a class="defiler" href="#approche" aria-label="Découvrir la suite">${ICONES.bas}</a>
</section>`;

  const blocApproche = approche.length
    ? approche.map((p, i) => `<p class="${i === 0 ? 'grand' : ''}" data-pop>${txt(p)}</p>`).join('')
    : emplacement('Ici, votre approche', 'Votre chemin jusqu’à ce métier, ce que vous proposez, et pour qui. En quelques phrases, avec vos mots.');

  const approcheSec = `
<section id="approche" class="sc sc-approche" data-scene="approche" style="${sceneStyle(f, 'approche')}">
  <div class="ruban" aria-hidden="true"><div class="ruban-piste">${ruban}</div></div>
  ${ancre('approche', f)}
  <div class="cadre">
    <h2 class="titre" data-pop><span>Mon</span> <span>approche</span></h2>
    ${plein(d.conviction) ? `<blockquote class="conviction" data-pop>${esc(propre(d.conviction))}</blockquote>` : ''}
    <div class="texte-approche">${blocApproche}</div>
    ${apports.length ? `<ul class="apports">${apports.map((a, i) => `<li class="apport" data-pop style="--i:${i}"><span class="apport-num">${String(i + 1).padStart(2, '0')}</span><h3>${esc(propre(a.titre))}</h3>${plein(a.texte) ? `<p>${esc(propre(a.texte))}</p>` : ''}</li>`).join('')}</ul>` : ''}
  </div>
</section>`;

  const seanceSec = `
<section id="seance" class="sc sc-seance" data-scene="seance" style="${sceneStyle(f, 'seance')}">
  ${ancre('seance', f)}
  <div class="cadre">
    <h2 class="titre" data-pop><span>La</span> <span>séance</span></h2>
    ${d.etapesEmplacement ? `<p class="note-emplacement" data-pop>Ces étapes attendent vos mots : elles se remplissent ensemble.</p>` : ''}
    <ol class="etapes">
      ${etapes.map((e, i) => `<li class="etape${d.etapesEmplacement ? ' etape-vide' : ''}" style="--i:${i}">
        <span class="etape-num" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
        <div><h3>${esc(propre(e.titre))}</h3><p>${txt(propre(e.texte))}</p>${plein(e.duree) ? `<p class="badge">${esc(propre(e.duree))}</p>` : ''}</div>
      </li>`).join('')}
    </ol>
  </div>
</section>`;

  const blocTarifs = tarifs.length
    ? `<ul class="tarifs">${tarifs.map((t) => `<li class="tarif" data-pop><h3>${esc(propre(t.nom))}</h3><p class="prix">${esc(propre(t.prix) || 'Sur demande')}</p>${plein(d.dureePremiere) ? `<p class="detail">Première séance : ${esc(propre(d.dureePremiere))}</p>` : ''}${plein(d.dureeSuivi) ? `<p class="detail">Suivi : ${esc(propre(d.dureeSuivi))}</p>` : ''}<a class="pilule pilule-sombre" href="#contact">${ICONES.calendrier}<span>Réserver</span></a></li>`).join('')}</ul>${plein(d.paiement) ? `<p class="paiement" data-pop>${esc(propre(d.paiement))}</p>` : ''}`
    : `<ul class="tarifs"><li class="tarif tarif-vide" data-pop><h3>Ici, vos tarifs</h3><p class="prix">00 €</p><p class="detail">Vos séances, leur durée et leur prix, comme vous les présentez.</p></li></ul>`;

  const tarifsSec = `
<section id="tarifs" class="sc sc-tarifs" data-scene="tarifs" style="${sceneStyle(f, 'tarifs')}">
  ${ancre('tarifs', f)}
  <div class="cadre">
    <h2 class="titre" data-pop><span>Tarifs</span></h2>
    ${blocTarifs}
  </div>
</section>`;

  const aproposSec = `
<section id="apropos" class="sc sc-apropos" data-scene="apropos" style="${sceneStyle(f, 'apropos')}">
  ${ancre('apropos', f)}
  <div class="cadre apropos-grille">
    <figure class="portrait" data-pop><div class="portrait-forme"><span class="portrait-initiales" aria-hidden="true">${esc(d.initiales || '')}</span></div><figcaption>Ici, votre portrait</figcaption></figure>
    <div>
      <h2 class="titre" data-pop><span>À</span> <span>propos</span></h2>
      ${apropos.length ? apropos.map((p, i) => `<p class="${i === 0 ? 'grand' : ''}" data-pop>${txt(p)}</p>`).join('') : emplacement('Ici, votre histoire', 'Votre parcours, vos formations, ce qui vous anime. Une page qui vous ressemble.')}
      ${plein(d.cerf) ? `<p class="cerf" data-pop>${esc(propre(d.cerf))}</p>` : ''}
    </div>
  </div>
</section>`;

  const lieu = [propre(d.rdv), ville].filter(Boolean).join(' · ');
  const contactSec = `
<section id="contact" class="sc sc-contact" data-scene="contact" style="${sceneStyle(f, 'contact')}">
  ${ancre('contact', f)}
  <div class="cadre contact-cadre">
    <h2 class="titre titre-contact" data-pop><span>Prendre</span> <span>rendez-vous</span></h2>
    <a class="numero" href="${esc(d.telLien)}" data-pop aria-label="Appeler le ${esc(d.tel)}">${esc(d.tel)}</a>
    ${lieu ? `<p class="lieu" data-pop>${txt(lieu)}</p>` : ''}
    <div class="actions" data-pop>
      <a class="pilule" href="${esc(d.telLien)}">${ICONES.tel}<span>${esc(d.appeler || 'Appeler')}</span></a>
      ${fiche ? `<a class="pilule pilule-creuse" href="${esc(d.resalib)}" rel="noopener" target="_blank">${ICONES.fleche}<span>${esc(fiche)}</span></a>` : ''}
      ${plein(d.facebook) ? `<a class="pilule pilule-creuse" href="${esc(d.facebook)}" rel="noopener" target="_blank">${ICONES.fleche}<span>Facebook</span></a>` : ''}
    </div>
  </div>
  <footer class="pied">
    <div class="pied-haut">
      <p class="pied-nom">${esc(nom)}</p>
      <p>${esc([metier, ville].filter(Boolean).join(' · '))}${plein(d.siret) ? ` · SIRET ${esc(d.siret)}` : ''}</p>
    </div>
    <p class="avertissement">${txt(propre(d.avertissement))}</p>
    <p class="apercu">Aperçu préparé pour ${esc(nom)}. Textes, photos, couleurs : tout se modifie selon vos goûts.</p>
    <a class="haut" href="#accueil">Haut de page ${ICONES.fleche}</a>
  </footer>
</section>`;

  const html = `${tete}
<canvas class="scene" aria-hidden="true"></canvas>
<main id="contenu" data-famille="${f}">${accueil}${approcheSec}${seanceSec}${tarifsSec}${aproposSec}${contactSec}
</main>`;

  const titre = `${nom}${metier ? ', ' + metier : ''}${ville ? ' à ' + ville : ''}`;
  const description = accroche || propre(d.accroche) || `${metier}${ville ? ' à ' + ville : ''}, sur rendez-vous.`;
  return { html, titre, description, famille: f, couleur: F.scenes.accueil[0] };
}
