// Prénom et nom d'affichage, même quand la fiche est bancale.
// « Meyer Sandrine » devient « Sandrine Meyer » (le prénom est reconnu), « La Bulle d'Adeline » garde son nom
// d'enseigne mais le prénom affiché en grand est « Adeline », « Cornouaille Massage Quimper » garde « Cornouaille ».
// Module sans DOM : node (batir.mjs) et navigateur.

const PRENOMS = new Set((
  // femmes
  'marie nathalie isabelle sylvie catherine christine sandrine veronique valerie stephanie celine sophie caroline aurelie laetitia ' +
  'emilie julie audrey elodie virginie karine patricia corinne laurence anne helene heléna helena sabrina melanie claire emmanuelle ' +
  'delphine severine florence agnes martine francoise brigitte nadine pascale chantal monique annie beatrice cecile mathilde ' +
  'charlotte camille lea manon chloe ines emma sarah laura pauline marion lucie anais elise alice juliette louise jeanne clemence ' +
  'margaux oceane morgane amandine justine marine aurore adeline alexandra angelique anne-sophie annabelle anne-laure axelle ' +
  'barbara berenice carole cindy coralie cyrielle diane dorothee estelle eve fabienne fanny gaelle geraldine ghislaine gisele ' +
  'isabel jacqueline jessica josiane jocelyne joelle karen katia lydie lysiane magali maryse maud maeva marianne marilou mireille ' +
  'muriel myriam nadia natacha noemie odile ophelie pascaline peggy perrine rachel regine rose roseline sabine samia sara solene ' +
  'sonia stella suzanne tiphaine vanessa vera victoire violaine yasmine yvette yvonne zoe ingrid nina lina lola jade ambre romane ' +
  'elsa eva clara louna sylviane danielle denise evelyne colette jeannine odette paule rosalie florine flore coline capucine ' +
  'gwenaelle gwendoline nolwenn maelle soazig armelle anouk anna annick ariane arielle carine christelle claudine edith elisabeth ' +
  'elizabeth frederique genevieve guylaine laurie leila lise lisa liliane lucile madeleine magalie marina marjorie marlene ' +
  'marylene michele mylene nelly nicole noelle pierrette priscilla raphaelle sandra servane sidonie simone solange sylvaine ' +
  'therese valentine yolande alexia alicia aline amelie andrea angela angele apolline astrid aude aurelia bernadette blandine ' +
  'cassandra celia charline clementine constance daphne deborah dominique elena eleonore eliane elisa eloise emeline enora ' +
  'eugenie faustine gabrielle hortense ilona irene isaure jennifer johanna judith julia julienne laure laurene leonie lilou lou ' +
  'louisa ludivine lynda maelys margot marguerite marie-claire marie-pierre marie-laure marie-christine marie-france melissa ' +
  'melody mona nadege naima nora oriane paola penelope prune rebecca roxane salome sasha selma shirley sofia tatiana tess ' +
  'vanina victoria agathe albane alix anaelle annaelle aurely chrystelle cristina emilia fatima francine gaby gwladys ' +
  'heloise jessie karima kelly laeticia lauriane leslie line lorraine malika mallory manuela marilyne marjolaine mathilda ' +
  'maylis megane nathalia noella ornella pamela rosine sylvia thais vaiana valentina wendy yaelle ' +
  // hommes
  'jean pierre michel philippe alain patrick nicolas christophe christian daniel david eric frederic laurent stephane olivier ' +
  'thierry sebastien julien pascal francois thomas vincent jerome bruno gilles didier marc guillaume benoit fabrice emmanuel ' +
  'franck yves gerard bernard jacques herve cedric arnaud romain alexandre antoine mathieu matthieu maxime anthony damien ' +
  'jonathan kevin ludovic loic yannick xavier sylvain paul louis hugo lucas leo gabriel arthur jules raphael adam nathan enzo ' +
  'theo tom samuel simon benjamin florian quentin remi rene roger serge jean-pierre jean-marc jean-luc jean-michel ' +
  'jean-francois fabien gregory jeremy joel lionel mickael michael thibault tristan valentin victor william yann alexis ' +
  'aurelien bastien baptiste cyril dimitri etienne gael gaetan guy hadrien henri jacky jose karim lucien marcel mehdi noel ' +
  'rodolphe sacha stanislas steve teddy timothee ugo yoann sebastian frank charles edouard emile felix georges hubert ' +
  'joachim lilian luc mathias morgan nael noah olivia pablo sami soren thibaud tony'
).split(/\s+/).filter(Boolean));

const MOTS_ENSEIGNE = /^(la|le|les|l|au|aux|du|de|des|d|et|cabinet|espace|institut|centre|atelier|maison|studio|chez|bulle|massage|massages|yoga|sophrologie|hypnose|naturopathie|reflexologie|coach|coaching|therapie|bien|etre|bien-etre|soins?|art|sens)$/;

const sansAccent = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const nettoyer = (s) => String(s || '').replace(/[\u2013\u2014]/g, ',').replace(/\s+/g, ' ').trim();
const capitaliser = (m) => m.replace(/(^|[-\s])(\p{L})/gu, (x, a, b) => a + b.toUpperCase());

// Découpe le nom en mots en gardant l'apostrophe : « La Bulle d’Adeline » -> La, Bulle, d’, Adeline
function mots(nom) {
  return nettoyer(nom).split(/\s+/).flatMap((m) => {
    const x = m.match(/^([dlDL])[’'](.+)$/);
    return x ? [x[1] + '’', x[2]] : [m];
  }).filter(Boolean);
}

export function identite(d) {
  const brut = nettoyer(d?.nom);
  const liste = mots(brut);
  const cles = liste.map((m) => sansAccent(m).replace(/[’']/g, ''));
  let i = cles.findIndex((c) => PRENOMS.has(c));
  let nom = brut;
  // « Meyer Sandrine » : deux mots, le second seul est un prénom -> on remet dans l'ordre
  if (liste.length === 2 && i === 1 && !PRENOMS.has(cles[0])) nom = `${liste[1]} ${liste[0]}`;
  let prenom;
  if (i >= 0) prenom = liste[i];
  else {
    // enseigne sans prénom reconnu : le premier mot qui n'est pas un article ni un mot de métier
    prenom = liste.find((m, k) => !MOTS_ENSEIGNE.test(cles[k]) && m.length > 2) || liste[0] || '';
  }
  prenom = capitaliser(prenom.replace(/[’']$/, ''));
  // « enseigne » : un nom qui contient autre chose que prénom + nom de famille
  const enseigne = liste.length > 3 || cles.some((c) => MOTS_ENSEIGNE.test(c) && c.length > 3) || (i < 0 && liste.length > 1);
  const initiales = (d?.initiales || (prenom[0] || '') + (liste.find((m, k) => k !== i && !MOTS_ENSEIGNE.test(cles[k]))?.[0] || '')).toUpperCase().slice(0, 2);
  return { nom, prenom, enseigne, initiales };
}
