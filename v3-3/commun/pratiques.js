// La pratique exacte du praticien, plus fine que sa famille (commun/familles.js) : c'est elle qui décide de ce
// que chaque univers montre (la carte du corps de Méridiens, les objets de Pop, les photos de Cinéma et
// d'Éditorial, le mode de Résonance, le ton de Cocon). Une seule règle pour tous les univers.
// Module ES sans dépendance autre que familles.js, dans le navigateur et dans node.
//
// pratique(d) -> { id, nom, famille, enfants, socio }
//   id : une des clés de PRATIQUES (ou 'autre') ; lue d'abord dans le métier, puis, seulement avec des mots
//        sans ambiguïté, dans ses textes (« Bien-être », « Thérapeute », « Médecines douces » ne disent rien).
//   enfants : il ou elle parle d'enfants ou de bébés (ton de Cocon) ; socio : socio-esthétique.
// Vérifié sur les 19 113 fiches de .sites-v2 : node commun/outils/couverture.mjs.
import { famille } from './familles.js';

const D = '(?<![a-zà-öø-ÿ])', F = '(?![a-zà-öø-ÿ])';
const re = (s) => new RegExp(s.split('<D>').join(D).split('<F>').join(F), 'i');

// Ordre = priorité. m : lu dans le métier ; t : lu dans les textes (plus strict), absent = jamais dans les textes.
export const PRATIQUES = [
  { id: 'bebe', nom: 'massage et réflexologie du bébé', m: re('b[ée]b[ée]|nourrisson|<D>portage|langage des signes'), t: re('massages? (du |de )?b[ée]b[ée]|r[ée]flexologie (du |de )?b[ée]b[ée]|massage des tout-petits') },
  { id: 'animal', nom: 'soin des animaux', m: re('^(?!.*humain).*(animal|animaux|[ée]quin|canin|f[ée]lin|chevaux|<D>chiens?<F>)') },
  { id: 'auriculo', nom: 'auriculothérapie', m: re('^(?!.*plantaire).*(auriculo|auriculaire|<D>oreilles?<F>)'), t: re('auriculoth[ée]rap|r[ée]flexologie auriculaire') },
  { id: 'palmaire', nom: 'réflexologie palmaire', m: re('^(?!.*plantaire).*(palmaire|r[ée]flexologie des mains)'), t: null },
  { id: 'faciale', nom: 'réflexologie faciale', m: re('^(?!.*plantaire).*(r[ée]flexologie (faciale|du visage)|dien.?chan|kobido)'), t: re('r[ée]flexologie faciale|dien.?chan') },
  { id: 'plantaire', nom: 'réflexologie plantaire', m: re('r[ée]flexo|plantaire'), t: re('r[ée]flexologie plantaire|r[ée]flexologue') },
  { id: 'meridiens', nom: 'shiatsu, acupression et médecine chinoise', m: re('shiatsu|acupress|acupunct|digitopunct|<D>do.?in<F>|<D>amma<F>|tuina|m[ée]decine (traditionnelle )?chinoise|<D>mtc<F>|m[ée]ridien|[ée]nerg[ée]tique chinoise|jin shin|watsu'), t: re('shiatsu|acupression|<D>amma assis|tuina|m[ée]ridiens') },
  { id: 'kinesio', nom: 'kinésiologie', m: re('kin[ée]siolog'), t: re('kin[ée]siolog') },
  { id: 'energie', nom: 'reiki, magnétisme et soins énergétiques', m: re('reiki|magn[ée]ti|[ée]nerg[ée]ti|soins? [ée]nerg|lithoth|chamani|harmonisation|access bars|radiesth|<D>[ée]nergie|aurath|biorésonance|bior[ée]sonance'), t: re('reiki|magn[ée]tiseu|magn[ée]tisme|soins? [ée]nerg[ée]tiques?|lithoth[ée]rap') },
  { id: 'perinat', nom: 'périnatalité', m: re('doula|p[ée]rinat|naissance|grossesse|accouchement|allaitement|maternit|pr[ée]natal|post.?partum'), t: re('doula|accompagnante? p[ée]rinatal') },
  { id: 'esthetique', nom: 'esthétique et soins de beauté', m: re('esth[ée]ti|<D>beaut[ée]|soins? du visage|maquill|onglerie|<D>ongles?<F>|cosm[ée]t|<D>spa<F>|<D>cils<F>|[ée]pilation|institut') },
  { id: 'massage', nom: 'massage et toucher', m: re('massage|massoth|drainage|modelage|ayurv|abhyanga|californien|<D>lomi|<D>toucher|fascia|th[ée]rapeute corporel|relaxation corporelle'), t: re('massages? (bien-[êe]tre|californien|su[ée]dois|ayurv[ée]dique|aux huiles)|massoth[ée]rap') },
  { id: 'son', nom: 'sonothérapie', m: re('sonoth|<D>sonores?<F>|<D>bols?<F>|<D>gongs<F>|bain sonore|<D>vibration'), t: re('sonoth[ée]rap|bols? (tib[ée]tains?|chantants?|de cristal)|bain sonore|massage sonore') },
  { id: 'musique', nom: 'musicothérapie, chant et voix', m: re('musicoth|musique|<D>chants?<F>|<D>chanteu|<D>voix<F>'), t: re('musicoth[ée]rap') },
  { id: 'danse', nom: 'danse-thérapie', m: re('<D>danse'), t: re('danse.?th[ée]rap') },
  { id: 'theatre', nom: 'dramathérapie et théâtre', m: re('dramath|th[ée][âa]tre|clown'), t: null },
  { id: 'art', nom: 'art-thérapie', m: re('<D>arts?<F>(?! martiaux)|art.?th[ée]rap|peint|dessin|aquarel|plastique|argile|collage|sculpt|atelier cr[ée]atif|cr[ée]ation artistique|expression cr[ée]atrice'), t: re('art.?th[ée]rap') },
  { id: 'yoga', nom: 'yoga et pilates', m: re('yoga|pilates|stretch|feldenkrais|gym|<D>sport'), t: null },
  { id: 'qigong', nom: 'qi gong et tai chi', m: re('qi ?gong|ta[iï] ?chi|taiji'), t: null },
  { id: 'hypnose', nom: 'hypnose', m: re('hypno|<D>pnl<F>|emdr|<D>eft<F>|<D>dnr<F>'), t: re('hypnoth[ée]rap|hypnose') },
  { id: 'sophro', nom: 'sophrologie et relaxation', m: re('sophro|relax'), t: re('sophrolog') },
  { id: 'meditation', nom: 'méditation', m: re('m[ée]dit|mindful|pleine conscience'), t: null },
  { id: 'psy', nom: 'psychothérapie et écoute', m: re('psych|gestalt|analyse transac|relation d.aide|th[ée]rapeute|th[ée]rapie|sexo|<D>couple|<D>cep<F>|ff2p|constellation|graphoth'), t: re('psychoth[ée]rap|psychopraticien|gestalt') },
  { id: 'parent', nom: 'parentalité et éducation', m: re('parental|<D>parents?<F>|<D>[ée]ducat(?![a-zà-ÿ]* de sant)|petite enfance|<D>enfants?<F>|<D>ado(lescen[a-z]*)?<F>') },
  { id: 'fleurs', nom: 'fleurs de Bach', m: re('fleurs? de bach|<D>[ée]lixirs? floraux'), t: re('fleurs de bach') },
  { id: 'naturo', nom: 'naturopathie', m: re('naturo|iridolog|<D>nutri|di[ée]t[ée]ti|micronutri'), t: re('naturopath') },
  { id: 'plantes', nom: 'plantes et aromathérapie', m: re('phyto|herbor|aroma|gemmo|<D>plantes?<F>'), t: null },
  { id: 'coach', nom: 'coaching', m: re('coach|bilan|orientation|d[ée]veloppement|mentor|pr[ée]parat\\w* mental|accompagn|conseil'), t: null },
];
export const NOMS = Object.fromEntries(PRATIQUES.map((p) => [p.id, p.nom]));

const textes = (d) => [d?.accroche, ...(d?.approche || []), ...(d?.apropos || [])].filter(Boolean).join(' ');

export function pratique(d) {
  const metier = String(d?.metier || '');
  let p = PRATIQUES.find((x) => x.m.test(metier));
  if (!p) { const t = textes(d); p = PRATIQUES.find((x) => x.t && x.t.test(t)); }
  const tout = metier + ' ' + textes(d);
  return {
    id: p ? p.id : 'autre',
    nom: p ? p.nom : '',
    famille: famille(d),
    enfants: /(?<![a-zà-ÿ])(b[ée]b[ée]s?|enfants?|tout-petits|nourrissons?|ados?|adolescents?)(?![a-zà-ÿ])/i.test(tout),
    socio: /socio.?esth/i.test(metier),
  };
}
