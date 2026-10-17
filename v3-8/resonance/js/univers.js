// Resonance : la fiche de l'univers. Source unique : batir.mjs en tire univers.json (contrat BRIEF-2).
// Couleurs du contrat : fond, encre, accent, accent2 ; couleurs de travail : fond2, encre2, papier, plaque (la plaque
// qui vibre), sable (les grains), pigments (trois couleurs d'aquarelle), nuit, surNuit, surBouton.
import { pratique } from '../../commun/pratiques.js';
export const UNIVERS = {
  id: 'resonance',
  nom: 'Résonance',
  promesse: 'Le son rendu visible : du sable qui dessine des figures sur une plaque qui vibre, un bol qui chante quand on le touche, des cordes qu’on effleure. Pour l’art-thérapie, des pigments qui fleurissent.',
  // imagine : la fin de la phrase de la page d'arrivée (« ... : on vous a imaginé <imagine>. »)
  imagine: 'le son et la couleur rendus visibles : un sable qui dessine votre prénom, un bol qui chante, des pigments qui fleurissent',
  pourVous: '{prenom}, votre pratique racontée comme une partition : on voit le son, on l’entend si on le souhaite, et la dernière figure dessine votre prénom.',
  familles: { creation: 5, energie: 3, esprit: 3, mouvement: 2, psy: 1, elan: 1 },
  // racines cherchées dans ses textes (début de mot ; « = » : le mot entier). Ni « rythme » ni « souffle » : tout le
  // monde les emploie (« à votre rythme »). Ni « =son » : le possessif le trouverait partout.
  motsCles: ['sonoth', 'sonor', '=sons', '=bol', '=bols', 'vibra', '=voix', 'chant', 'musi', '=gong', 'diapason', 'cristal', 'tibet', 'resonan', 'harmonis', 'frequence', '=onde', '=ondes', 'art-thera', 'art thera', 'peint', 'dessin', 'aquarel', 'pigment', 'couleur', 'creati', 'expression', 'danse'],
  ambiances: ['mystere', 'sombre', 'chic', 'vif'],
  polices: {
    titre: 'Bricolage Grotesque',
    texte: 'Spectral',
    css: 'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wdth,wght@12..96,75..100,200..700&family=Spectral:ital,wght@0,300;0,400;1,300;1,400&display=swap',
  },
  palettes: [
    {
      id: 'laiton', nom: 'Laiton', teinte: 'or', ton: 'sombre', vivacite: 'douce',
      couleurs: { fond: '#0f0d0b', encre: '#f1e8da', accent: '#d8a95c', accent2: '#8a6531', fond2: '#17130f', encre2: '#c8baa4', papier: '#1c1814', plaque: '#1b1713', sable: '#ecd9b2', pigments: ['#d8a95c', '#b5643a', '#ecd9b2'], nuit: '#080706', surNuit: '#efe6d8', surBouton: '#0f0d0b' },
      defautPour: ['creation', 'energie'],
    },
    {
      id: 'indigo', nom: 'Indigo', teinte: 'bleu', ton: 'sombre', vivacite: 'douce',
      couleurs: { fond: '#0c1022', encre: '#e9ecf8', accent: '#a4b4ff', accent2: '#4b5aa8', fond2: '#121733', encre2: '#b6bddb', papier: '#151a38', plaque: '#11162d', sable: '#dde2fb', pigments: ['#7f93ff', '#c98bd9', '#e9ecf8'], nuit: '#070914', surNuit: '#e6e9f6', surBouton: '#0c1022' },
      defautPour: ['esprit'],
    },
    {
      id: 'amethyste', nom: 'Améthyste', teinte: 'violet', ton: 'sombre', vivacite: 'vive',
      couleurs: { fond: '#150f1e', encre: '#f1ebf9', accent: '#c7a3ff', accent2: '#6a4ab0', fond2: '#1d1629', encre2: '#c6badb', papier: '#211931', plaque: '#1a1326', sable: '#ebe1ff', pigments: ['#b78cff', '#ff8fb8', '#f1ebf9'], nuit: '#0a0710', surNuit: '#efe8f7', surBouton: '#150f1e' },
      defautPour: ['beaute'],
    },
    {
      id: 'cristal', nom: 'Cristal', teinte: 'neutre-clair', ton: 'clair', vivacite: 'douce',
      couleurs: { fond: '#eef0f0', encre: '#14191d', accent: '#2c5a75', accent2: '#9fb8c6', fond2: '#e2e6e7', encre2: '#44515a', papier: '#f7f9f9', plaque: '#e3e8ea', sable: '#1f2529', pigments: ['#2c5a75', '#7a9cb0', '#14191d'], nuit: '#121a1f', surNuit: '#e9eef0', surBouton: '#eef0f0' },
      defautPour: ['psy', 'mouvement'],
    },
    {
      id: 'ocre', nom: 'Ocre', teinte: 'terre', ton: 'clair', vivacite: 'douce',
      couleurs: { fond: '#ede3d4', encre: '#2a1c12', accent: '#94461f', accent2: '#c98b52', fond2: '#e4d6c2', encre2: '#5b4332', papier: '#f6efe4', plaque: '#e0d0b8', sable: '#4a2e1a', pigments: ['#b4532a', '#c98b52', '#5b7a3a'], nuit: '#24170f', surNuit: '#efe3d3', surBouton: '#ede3d4' },
      defautPour: ['toucher', 'plantes', 'famille'],
    },
    {
      id: 'aquarelle', nom: 'Aquarelle', teinte: 'neutre-clair', ton: 'clair', vivacite: 'vive',
      couleurs: { fond: '#f8f4ed', encre: '#1d1a24', accent: '#b3304f', accent2: '#2b62b0', fond2: '#f0e9dd', encre2: '#4d4757', papier: '#fdfbf6', plaque: '#f6f1e7', sable: '#2a2731', pigments: ['#c8375c', '#2a64b8', '#e3a22a'], nuit: '#1d1a24', surNuit: '#f4efe6', surBouton: '#f8f4ed' },
      defautPour: ['elan'],
    },
  ],
  affiche: 'Plaque sombre couverte de sable clair qui dessine une figure de Chladni (lignes nodales en croix et en anneaux), nom en Bricolage Grotesque étroit, une fine onde dorée.',
};

// La matiere de la page : le sable sur une plaque (son, voix, musique) ou les pigments (art-therapie).
// Le mode suit la pratique exacte (commun/pratiques.js, la même règle pour tous les univers) : pigments pour
// l'art-thérapie (peinture, dessin, argile, collage), son pour tout le reste (sonothérapie, musicothérapie, chant,
// danse-thérapie). « Modelage » seul est un massage, plus jamais un atelier d'argile.
export function modeDe(d) {
  return pratique(d).id === 'art' ? 'pigment' : 'son';
}
// Bol tibetain (metal, partiels inharmoniques) ou bol de cristal (son pur et long).
export function timbreDe(d) {
  const t = [d?.metier, d?.accroche, ...(d?.approche || []), ...(d?.apropos || [])].join(' ');
  return /cristal|quartz/i.test(t) ? 'cristal' : 'tibetain';
}

export function paletteDe(id, fam, mode) {
  const P = UNIVERS.palettes;
  if (P.find((p) => p.id === id)) return P.find((p) => p.id === id);
  if (mode === 'pigment') return P.find((p) => p.id === 'aquarelle');
  return P.find((p) => p.defautPour.includes(fam)) || P[0];
}
export function variables(p) {
  return Object.entries(p.couleurs).filter(([, v]) => typeof v === 'string').map(([k, v]) => `--${k}:${v}`).join(';');
}
