// Familles de métiers, partagées par tous les univers et par la page d'arrivée.
// famille(d) lit d'abord le métier, puis les textes du praticien. Ordre = priorité en cas d'égalité.
// Utilisable dans le navigateur (import) et dans node (import depuis un .mjs).

export const FAMILLES = {
  famille: { nom: 'la périnatalité et la famille', re: /p[ée]rinat|doula|b[ée]b[ée]|parental|parent|naissance|grossesse|maternit|portage|allaitement|\bcep\b|[ée]ducation/i },
  beaute: { nom: 'la beauté et le soin du visage', re: /esth[ée]ti|beaut[ée]|soins? du visage|maquill|onglerie|cosm[ée]t|spa\b|institut/i },
  creation: { nom: 'la création, le son et la voix', re: /musicoth|sonoth|\bsons?\b|bols?\b|chant|voix|vibration|art.?th[ée]rap|danse.?th[ée]rap|dramath|cr[ée]ati/i },
  energie: { nom: 'le corps et ses énergies', re: /r[ée]flexo|shiatsu|acupress|kin[ée]siolog|reiki|magn[ée]ti|[ée]nerg[ée]ti|[ée]nergie|m[ée]ridien|chi\b|amma|tuina|do.?in/i },
  esprit: { nom: "l'accompagnement intérieur", re: /hypno|sophro|m[ée]dit|mindful|pleine conscience|relaxa|pnl|eft|emdr|sommeil/i },
  psy: { nom: "l'écoute et la parole", re: /psycho|psychanal|gestalt|analyse transac|relation d.aide|th[ée]rapeute|sexoth|conseill.* conjug|systémi/i },
  toucher: { nom: 'le soin par le toucher', re: /massage|massoth|drainage|toucher|modelage|lomi|ayurv[ée]dique|abhyanga/i },
  plantes: { nom: 'la naturopathie et les plantes', re: /naturo|phyto|herbor|aroma|fleurs? de bach|nutri|di[ée]t|gemmo|iridolog|plante/i },
  mouvement: { nom: 'le mouvement et la respiration', re: /yoga|pilates|qi ?gong|ta[iï] ?chi|danse|gym|sport|stretch|respir|feldenkrais/i },
  elan: { nom: "l'élan et le coaching", re: /coach|accompagn|orientation|bilan|d[ée]veloppement|mentor|conseil|transition/i },
};

export const ORDRE = Object.keys(FAMILLES);

export function famille(d) {
  const metier = String(d?.metier || '');
  for (const k of ORDRE) if (FAMILLES[k].re.test(metier)) return k;
  const texte = [d?.accroche, ...(d?.approche || []), ...(d?.apropos || [])].join(' ');
  for (const k of ORDRE) if (FAMILLES[k].re.test(texte)) return k;
  return 'elan';
}
