// Les données de la maquette : pour un autre taxi, on change ce fichier (et les textes de index.html).
// Chaque fait vient de SOURCES.md. Ce qui est inconnu reste en pointillés dans la page.
// Téléphone : le numéro de LISTE-29-VERIFIEE.csv n'est que « probable » (une seule source). Il n'est donc PAS affiché.
// Pour l'afficher un jour : mettre ici le numéro confirmé, entre guillemets, à la place de null.
window.CONTENU = {
  telephone: null,

  // Couleurs proposées par le bouton « Couleur » de la page Bonjour (?palette=vert, bleu ou brun).
  palettes: ['vert', 'bleu', 'brun'],

  // Calcul de l'heure de départ. Temps de route depuis Mouzeil : OSRM (OpenStreetMap), sans circulation (SOURCES.md).
  depart: 'Mouzeil',
  marge: 10,          // minutes de marge avant le rendez-vous
  rendezVous: 540,    // 9 h 00, en minutes
  destinations: [
    { id: 'hd', nom: 'CHU de Nantes, Hôtel-Dieu', court: 'l’Hôtel-Dieu', minutes: 48, km: '40,3' },
    { id: 'la', nom: 'CHU de Nantes, Laënnec', court: 'Laënnec', minutes: 43, km: '42,1' },
    { id: 'an', nom: 'Centre hospitalier d’Ancenis', court: 'l’hôpital d’Ancenis', minutes: 22, km: '17,6' }
  ],

  // Les communes citées par les sources, et ce qu'on en sait (rien d'autre).
  communes: {
    mouzeil: 'Mouzeil : le siège de Valérie Taxi, depuis juillet 2026.',
    trans: 'Trans-sur-Erdre : l’autorisation de stationnement du taxi.',
    touches: 'Les Touches : une des communes desservies, selon Ouest-France.',
    ligne: 'Ligné : une des communes desservies, selon Ouest-France.',
    ancenis: 'Ancenis : le centre hospitalier, à 22 minutes de Mouzeil sans circulation (exemple calculé).',
    nantes: 'Nantes : le CHU, Hôtel-Dieu et Laënnec, à 48 et 43 minutes de Mouzeil sans circulation (exemples calculés).'
  }
};
