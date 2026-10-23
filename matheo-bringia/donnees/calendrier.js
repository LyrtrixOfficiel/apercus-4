// Mathéo Bringia : LE CALENDRIER. L'accueil (« Prochaines courses ») et la page Calendrier lisent ce fichier.
//
// MODE D'EMPLOI
//   AJOUTER UNE COURSE
//     1. copier un bloc { ... } ci-dessous et le coller dans la liste COURSES (l'ordre n'a pas d'importance :
//        le site range tout seul les courses par date) ;
//     2. remplir :
//          id        un nom court sans espace ni accent, unique (exemple : 'frkc-outdoor-2027')
//          nom       le nom de la course, tel qu'il s'affiche
//          debut     la date du premier jour, écrite AAAA-MM-JJ (exemple : '2027-02-05').
//                    Date pas encore connue : écrire seulement l'année, '2027', et la course s'affiche « date à venir ».
//          fin       (facultatif) le dernier jour, AAAA-MM-JJ, pour une course sur plusieurs jours
//          lieu      le circuit ; ville : la ville
//          type      'frkc', 'crki', 'mondial' ou 'autre' (la petite étiquette de couleur)
//          statut    'inscrit' (inscription confirmée), 'prevu' (il compte y aller), 'objectif' (un rêve à viser)
//          resultat  (après la course) le classement, par exemple '25e sur 100'
//          detail    (facultatif) une phrase : demi-finale, manches, ambiance
//          lien      (facultatif) la page officielle de la course
//          exemple   true si c'est un EXEMPLE de maquette (badge « exemple » à l'écran)
//   APRÈS LA COURSE : ajouter « resultat » (et « detail »). Elle passe d'elle-même dans les résultats.
//   Puis lancer « node outils/generer.mjs » (version sans JavaScript). Avec JavaScript, tout se met à jour seul.
//
// SOURCES : classements et listes d'inscrits officiels de Silverlane Events, pages FRKC Indoor et Outdoor, site du KWC
// (relevés le 23/10/2026, voir RECHERCHE.md).

export const COURSES = [
  {
    id: 'frkc-outdoor-2025', nom: 'FRKC Outdoor 2025', debut: '2025', lieu: 'Circuit International Anthoine Hubert', ville: 'Angerville (Essonne)',
    type: 'frkc', resultat: '39e sur 55', detail: 'Catégorie Junior : 8e Junior sur 13. Demi-finale : 12e.',
    lien: 'https://www.silverlane-events.com/frkcoutdoor',
  },
  {
    id: 'crki-saison-1', nom: 'CRKI Saison 1, Junior', debut: '2025', lieu: 'Circuits indoor de l’Est', ville: 'Grand Est',
    type: 'crki', resultat: 'Champion', detail: '1er sur 28 pilotes classés, jamais hors du top 5.',
    lien: 'https://www.silverlane-events.com/crki',
  },
  {
    id: 'crki-saison-2', nom: 'CRKI Saison 2, 90 kg', debut: '2026', lieu: 'Circuits indoor de l’Est', ville: 'Grand Est',
    type: 'crki', resultat: 'Vice-champion', detail: '2e sur 47 pilotes classés (saison 2025-2026).',
    lien: 'https://www.silverlane-events.com/crki',
  },
  {
    id: 'frkc-indoor-2026', nom: 'FRKC Indoor 2026', debut: '2026', lieu: 'Metz Kart Indoor', ville: 'Augny (Moselle)',
    type: 'frkc', resultat: '19e sur 100', detail: 'Meilleur Junior français, 3e Français. Podiums de manche : 3e et 2e.',
    lien: 'https://www.silverlane-events.com/frkcindoor',
  },
  {
    id: 'frkc-outdoor-2026', nom: 'FRKC Outdoor 2026', debut: '2026-08-23', lieu: 'Circuit International Anthoine Hubert', ville: 'Angerville (Essonne)',
    type: 'frkc', resultat: '25e sur 100', detail: '5e en demi-finale, premier non qualifié pour la finale. Podium en manche 4 (3e).',
    lien: 'https://www.silverlane-events.com/frkcoutdoor',
  },
  {
    id: 'frkc-indoor-2027', nom: 'FRKC Indoor 2027', debut: '2027-02-05', fin: '2027-02-07', lieu: 'Metz Kart Indoor', ville: 'Augny (Moselle)',
    type: 'frkc', statut: 'inscrit', detail: 'Vendredi : entraînements officiels. Samedi : entraînements et manche 1. Dimanche : manches 2 à 5, demi-finale, finale.',
    lien: 'https://www.silverlane-events.com/frkcindoor',
  },
  {
    id: 'frkc-outdoor-2027', nom: 'FRKC Outdoor 2027', debut: '2027', lieu: 'Circuit International Anthoine Hubert', ville: 'Angerville (Essonne)',
    type: 'frkc', statut: 'prevu', detail: 'Date pas encore annoncée par l’organisateur. Objectif : la finale du TOP 24.',
    lien: 'https://www.silverlane-events.com/frkcoutdoor', exemple: true,
  },
  {
    id: 'kwc-2027', nom: 'KWC 2027, le mondial', debut: '2027-07-26', fin: '2027-07-31', lieu: 'Kart Center Campillos', ville: 'Campillos (Espagne)',
    type: 'mondial', statut: 'objectif', detail: 'Le championnat du monde du kart de location. Le vainqueur du FRKC Outdoor y gagne sa place.',
    lien: 'https://kartworldchampionship.com', exemple: true,
  },
];

// ---- outils (ne pas modifier) ----
const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const MOIS_COURT = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

/** { a, m, j } depuis 'AAAA', 'AAAA-MM' ou 'AAAA-MM-JJ' */
export function lireDate(t) {
  const [a, m, j] = String(t || '').split('-').map(Number);
  return { a, m: m || 0, j: j || 0 };
}
/** Valeur de tri : une date incomplète passe après les dates connues de la même année (avant, pour les résultats). */
export function cle(t, inconnu = 13) { const d = lireDate(t); return d.a * 10000 + (d.m || inconnu) * 100 + (d.j || 0); }

/** « 5 au 7 février 2027 », « 23 août 2026 », « 2026 » */
export function dateTexte(c) {
  const d = lireDate(c.debut), f = c.fin ? lireDate(c.fin) : null;
  if (!d.m) return String(d.a);
  if (!d.j) return `${MOIS[d.m - 1]} ${d.a}`;
  if (f && f.j && (f.j !== d.j || f.m !== d.m)) {
    if (f.m === d.m) return `${d.j} au ${f.j} ${MOIS[d.m - 1]} ${d.a}`;
    return `${d.j} ${MOIS[d.m - 1]} au ${f.j} ${MOIS[f.m - 1]} ${d.a}`;
  }
  return `${d.j} ${MOIS[d.m - 1]} ${d.a}`;
}
/** Pour la pastille de date : { j: '05-07', m: 'févr.', a: '2027' } */
export function pastille(c) {
  const d = lireDate(c.debut), f = c.fin ? lireDate(c.fin) : null;
  return {
    j: d.j ? String(d.j).padStart(2, '0') + (f && f.j && f.j !== d.j ? '-' + String(f.j).padStart(2, '0') : '') : '--',
    m: d.m ? MOIS_COURT[d.m - 1] : 'date à venir',
    a: String(d.a),
  };
}
export const MOIS_LONGS = MOIS;

/** Course passée = elle a un résultat. */
export const passee = (c) => !!c.resultat;
export function aVenir() { return COURSES.filter((c) => !passee(c)).sort((x, y) => cle(x.debut) - cle(y.debut)); }
export function resultats() { return COURSES.filter(passee).sort((x, y) => cle(y.debut, 0) - cle(x.debut, 0)); }
/** La prochaine course à date connue (pour le compte à rebours). */
export function prochaine() { return aVenir().find((c) => lireDate(c.debut).j) || aVenir()[0] || null; }
