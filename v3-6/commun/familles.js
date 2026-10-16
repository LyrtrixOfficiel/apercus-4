// Familles de métiers, partagées par tous les univers et par la page d'arrivée.
// famille(d) lit d'abord le métier, puis les textes du praticien. Ordre = priorité en cas d'égalité.
// Utilisable dans le navigateur (import) et dans node (import depuis un .mjs).
//
// 16/10 (tour 3), vérifié sur les 19 113 fiches de .sites-v2 :
// - « Titulaire du CEP » (410 fiches) et « Membre individuel FF2P » sont des psychothérapeutes (Certificat
//   Européen de Psychothérapie de la FF2P) : psy, et non plus famille (Cocon leur était proposé).
// - Dans les textes, des faux amis faisaient changer de famille : « connaissance » (naissance), « transparent »
//   (parent), « rééducation » (éducation), « son corps » (son), « enchanté » (chant), « créativité » (création),
//   « Institut de formation » (institut). Les racines sont maintenant prises en début de mot.
// - Massothérapeute, fasciathérapeute, thérapeute corporel, californien, ayurveda : le toucher, plus psy.
// - Acupuncteur, médecine chinoise, auriculothérapie : énergie ; tai chi : mouvement ; sexologue, thérapie de
//   couple, constellations familiales, somatothérapeute : psy.

const D = '(?<![a-zà-öø-ÿ])'; // début de mot (\b ignore les lettres accentuées)
const F = '(?![a-zà-öø-ÿ])'; // fin de mot
const re = (s) => new RegExp(s.split('<D>').join(D).split('<F>').join(F), 'i');

export const FAMILLES = {
  famille: { nom: 'la périnatalité et la famille', re: re('p[ée]rinat|doula|<D>b[ée]b[ée]|<D>parental|<D>parents?<F>|<D>naissance|grossesse|maternit|<D>portage|allaitement|<D>[ée]ducation (positive|bienveillante|parentale)|conseill\\w* en [ée]ducation|<D>[ée]ducat\\w* de jeunes enfants|petite enfance') },
  beaute: { nom: 'la beauté et le soin du visage', re: re('esth[ée]ti|<D>beaut[ée]|soins? du visage|maquill|onglerie|<D>ongles?<F>|cosm[ée]t|<D>spa<F>|institut de beaut') },
  creation: { nom: 'la création, le son et la voix', re: re('musicoth|sonoth|<D>sonores?<F>|<D>bols? (chantants?|tib[ée]tains?|de cristal)|<D>gongs<F>|bains? de gongs?|<D>gong(-| )(th[ée]rap|symphon|plan[ée]t)|<D>chants?<F>|<D>chanteu|<D>voix<F>|art.?th[ée]rap|danse.?th[ée]rap|dramath|th[ée][âa]tre.?th[ée]rap|atelier cr[ée]atif|cr[ée]ation artistique') },
  energie: { nom: 'le corps et ses énergies', re: re('r[ée]flexo|shiatsu|acupress|acupunct|kin[ée]siolog|reiki|magn[ée]ti|[ée]nerg[ée]ti|[ée]nergie|m[ée]ridien|(?<!ta[iï] )<D>chi<F>|<D>amma<F>|tuina|<D>do.?in<F>|m[ée]decine (traditionnelle )?chinoise|<D>mtc<F>|auriculo') },
  esprit: { nom: "l'accompagnement intérieur", re: re('hypno|sophro|m[ée]dit|mindful|pleine conscience|relax|<D>pnl<F>|<D>eft<F>|emdr|<D>sommeil') },
  psy: { nom: "l'écoute et la parole", re: re('psycho|psychanal|gestalt|analyse transac|relation d.aide|<D>th[ée]rapeute(?! corporel)|somatoth|graphoth|sexoth|sexolog|th[ée]rapie de couple|conseill.* conjug|syst[ée]mi|<D>cep<F>|certificat europ[ée]en de psychoth|ff2p|constellations? familiales?') },
  toucher: { nom: 'le soin par le toucher', re: re('massage|massoth|drainage|<D>toucher|modelage|lomi|^(?!.*(yoga|nutri)).*ayurv|abhyanga|californien|fascia|th[ée]rapeute corporel') },
  plantes: { nom: 'la naturopathie et les plantes', re: re('naturo|phyto|herbor|aroma|fleurs? de bach|<D>nutri|di[ée]t[ée]ti|gemmo|iridolog|<D>plantes?<F>') },
  mouvement: { nom: 'le mouvement et la respiration', re: re('yoga|pilates|qi ?gong|ta[iï] ?chi|<D>danse|<D>gym|<D>sport|stretch|respir|feldenkrais') },
  elan: { nom: "l'élan et le coaching", re: re('coach|accompagn|orientation|<D>bilan|d[ée]veloppement|mentor|<D>conseil|transition') },
};

export const ORDRE = Object.keys(FAMILLES);

export function famille(d) {
  const metier = String(d?.metier || '');
  for (const k of ORDRE) if (FAMILLES[k].re.test(metier)) return k;
  const texte = [d?.accroche, ...(d?.approche || []), ...(d?.apropos || [])].join(' ');
  for (const k of ORDRE) if (FAMILLES[k].re.test(texte)) return k;
  return 'elan';
}
