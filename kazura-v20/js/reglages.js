// Kazura : LES RÉGLAGES DU SITE. Un seul fichier, une seule ligne à changer.
//
// ─── AFFICHER LES PRIX ───────────────────────────────────────────────────────────────────────────────────────────────
// AFFICHER_PRIX = false   le site ne montre AUCUN chiffre : il parle de « tout compris » et du paiement
//                         « en une fois, en 2 fois, ou jusqu'en 10 fois sans frais ».
// AFFICHER_PRIX = true    (aujourd'hui, décision de Mathéo du 23/10/2026) le bloc de prix apparaît dans « Osez rêver » (580 € la création, soit 2 × 290 € ou 10 × 58 € ; puis 20 € par
//                         mois, ou 220 € par an, un mois offert), et la question « Combien coûte un site ? » donne les chiffres.
//
// Pour l'appliquer :
//   1. changer la ligne ci-dessous (true ou false) ;
//   2. lancer   node realisations/generer.mjs   (la version sans JavaScript des pages suit le réglage) ;
//   3. publier. Avec JavaScript, la page lit ce fichier elle-même : même sans l'étape 2, elle respecte le réglage.
//
// Les montants sont juste en dessous : on les change ici, nulle part ailleurs.

export const AFFICHER_PRIX = true;

export const PRIX = {
  creation: 580,          // la création du site, tout compris
  fois: 10,               // payable jusqu'en 10 fois sans frais
  mois: 20,               // l'abonnement, par mois, sans engagement
  an: 220,                // ou par an (un mois offert)
};
