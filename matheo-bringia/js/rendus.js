// Mathéo Bringia : ce que chaque zone de page affiche, à partir des fichiers de données (donnees/*.js).
// Une zone de page s'écrit  <ul data-rendu="nom"><!-- debut:nom --> ... <!-- fin:nom --></ul>.
// Avec JavaScript, commun.js la remplit au chargement ; sans JavaScript, outils/generer.mjs l'a déjà écrite.
import * as G from './gabarits.js';
import { PILOTE, PALMARES, ACADEMIE, AMBASSADEUR, PARRAIN, CONTACT } from '../donnees/pilote.js';
import * as PH from '../donnees/photos.js';
import * as CAL from '../donnees/calendrier.js';
import * as ACT from '../donnees/actus.js';
import * as PAR from '../donnees/partenaires.js';

const esc = G.esc;

export const RENDUS = {
  chiffres: () => PILOTE.chiffres.map(G.chiffreHTML).join('\n'),
  'courses-accueil': () => CAL.aVenir().slice(0, 3).map((c, i) => G.courseHTML(c, CAL, i)).join('\n'),
  'courses-a-venir': () => CAL.aVenir().map((c, i) => G.courseHTML(c, CAL, i)).join('\n'),
  resultats: () => CAL.resultats().map((c, i) => G.resultatHTML(c, CAL, i)).join('\n'),
  rebours: () => {
    const c = CAL.prochaine();
    if (!c) return '<p class="rebours-quoi">Calendrier en préparation</p>';
    return `<p class="hud">Prochaine course</p>
<p class="rebours-j" data-compte="${esc(c.debut)}" aria-hidden="true"><small>J-</small><span>--</span></p>
<p class="rebours-quoi">${esc(c.nom)}</p>
<p class="hud">${esc(CAL.dateTexte(c))} · ${esc(c.lieu)}</p>`;
  },
  'actus-recentes': () => ACT.visibles().slice(0, 3).map((a) => G.carteActuHTML(a, ACT.dateActu)).join('\n'),
  'actus-toutes': () => ACT.visibles().map((a, i) => G.carteActuHTML(a, ACT.dateActu, { niveau: 'h2', grande: i === 0 })).join('\n'),
  articles: () => ACT.visibles().map((a, i) => G.articleHTML(a, ACT.dateActu, { premier: i === 0 })).join('\n'),
  partenaires: () => G.partenairesParRangHTML(PAR),
  'partenaires-court': () => G.partenairesCourtHTML(PAR),
  'defile-noms': () => {
    const noms = PAR.visibles().map((p) => `<span>${esc(p.nom)}</span><b aria-hidden="true">/</b>`).join('');
    return noms + noms;
  },
  emplacements: () => PAR.EMPLACEMENTS.map(G.emplacementHTML).join('\n'),
  'emplacements-court': () => PAR.EMPLACEMENTS.map((e, i) => `<li><span class="hud">${String(i + 1).padStart(2, '0')}</span>${esc(e.titre)}</li>`).join('\n'),
  palmares: () => PALMARES.map(G.palmaresHTML).join('\n'),
  equipement: () => PILOTE.equipement.map(G.equipementHTML).join('\n'),
  bio: () => PILOTE.bio.map((p) => `<p>${esc(p)}</p>`).join('\n'),
  'circuit-svg': () => {
    const d = G.cheminCircuit(1000, 476, 18);
    const [x0, y0] = [18 + G.CIRCUIT[0][0] * 964, 18 + G.CIRCUIT[0][1] * 440];
    return `<svg viewBox="0 0 1000 476" role="img" aria-labelledby="circuit-svg-titre"><title id="circuit-svg-titre">Tracé stylisé du Circuit International Anthoine Hubert, à Angerville, d’après le plan officiel</title>
  <path class="trace-fond" d="${d}"/>
  <path class="trace-halo" d="${d}"/>
  <path class="trace-lueur" d="${d}"/>
  <path class="trace-coeur" d="${d}"/>
  <path class="trace-sillage" d="${d}"/>
  <line class="ligne-depart" x1="${x0.toFixed(1)}" y1="${(y0 - 13).toFixed(1)}" x2="${x0.toFixed(1)}" y2="${(y0 + 13).toFixed(1)}"/>
  <text class="circuit-legende" x="${(x0 - 300).toFixed(1)}" y="${(y0 + 40).toFixed(1)}">Ligne droite des stands</text>
  <g class="point-15" transform="translate(${x0.toFixed(1)} ${y0.toFixed(1)})"><circle class="onde" r="24"/><circle class="disque" r="15"/><text>15</text></g>
</svg>`;
  },
  'mini-circuit': () => {
    const d = G.cheminCircuit(1000, 476, 18);
    return `<svg viewBox="-20 -20 1040 516"><path d="${d}" fill="none" stroke="rgba(255,255,255,.16)" stroke-width="22" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="#ff5a14" stroke-width="5" stroke-linejoin="round" opacity=".8"/><circle data-hud="mini" r="22" fill="#fff" stroke="#ff5a14" stroke-width="8" cx="567" cy="449"/></svg><span class="hud">Angerville · tracé stylisé</span>`;
  },
  academie: () => G.academieHTML(ACADEMIE),
  parrain: () => G.parrainHTML(PARRAIN),
  ambassadeur: () => G.ambassadeurHTML(AMBASSADEUR),
  evenements: () => PH.ALBUMS.map((a, i) => G.evenementHTML(a, PH.photosDe(a.id).length, PH.VIDEOS.filter((v) => v.album === a.id).length, i)).join('\n'),
  albums: () => PH.ALBUMS.filter((a) => PH.photosDe(a.id).length).map((a) => `<h3 class="album-titre" id="album-${G.esc(a.id)}">${G.esc(a.titre)}, ${G.esc(a.lieu)} <span class="hud">${G.esc(a.credit)}</span></h3>
<div class="mosaique">
${G.mosaiqueHTML(PH.photosDe(a.id))}
</div>`).join('\n'),
  'photos-pilote': () => PH.photosPilote().map((p, i) => `<img class="apparait" style="--i:${i}" src="${G.esc(p.fichier)}-480.webp" alt="${G.esc(p.legende)}" width="480" height="640" loading="lazy">`).join('\n'),
  coordonnees: () => {
    const ligne = (nom, v, lien) => `<li class="coord"><span class="hud">${nom}</span>${v ? `<a href="${lien}">${esc(v)}</a>` : '<span class="a-completer">À compléter <span class="badge-exemple">exemple</span></span>'}</li>`;
    return ligne('Téléphone', CONTACT.telephone, `tel:${String(CONTACT.telephone).replace(/[^+0-9]/g, '')}`) + '\n' + ligne('E-mail', CONTACT.email, `mailto:${CONTACT.email}`);
  },
  bandeau: () => G.bandeauHTML(PAR.visibles()),
  reseaux: () => PILOTE.reseaux.map((r) => `<li><a href="${esc(r.lien)}" target="_blank" rel="noopener">${esc(r.nom)} <span class="hud">${esc(r.compte)}</span><span class="sr"> (nouvel onglet)</span></a></li>`).join('\n'),
};

export { PILOTE, PALMARES, CAL, ACT, PAR, PH };
