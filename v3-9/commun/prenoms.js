// Prénoms : retrouver le prénom d'un praticien dans le champ `nom` des fiches, sans rien inventer.
// Module ES sans dépendance, utilisable dans le navigateur (import) et dans node (import depuis un .mjs).
//
//   analyserNom('Meyer Sandrine')
//     -> { prenom: 'Sandrine', genre: 'f', personne: 'Sandrine Meyer', enseigne: '', nomAffiche: 'Sandrine Meyer' }
//   analyserNom('La Bulle d’Adeline')
//     -> { prenom: 'Adeline', genre: 'f', personne: '', enseigne: 'La Bulle d’Adeline', nomAffiche: 'La Bulle d’Adeline' }
//   analyserNom('Cornouaille Massage Quimper')
//     -> { prenom: '', genre: '', personne: '', enseigne: 'Cornouaille Massage Quimper', ... }
//
// Les règles, dans l'ordre :
// 1. On retire les civilités (Mme, M., Dr...) et on découpe en mots (les apostrophes sont gardées).
// 2. Un mot qui suit « d’ », « de » ou « chez » est un prénom possible (« La Bulle d’Adeline »).
// 3. Un mot est un prénom s'il est dans la liste (comparaison sans accents ni majuscules) ; la liste rend
//    sa forme correcte (« celine » donne « Céline »). Les prénoms composés sont reconnus (« Marie-Claire »,
//    « Anne Sophie Martin » donne « Anne-Sophie »).
// 4. Un nom écrit EN CAPITALES à côté d'un mot en minuscules est un nom de famille (« MEYER Sandrine »).
// 5. Un prénom qui est aussi un nom de famille courant (Martin, Thomas, Laurent...) passe après un prénom
//    sans ambiguïté : « Martin Sophie » donne Sophie, « Thomas Bernard » donne Thomas.
// 6. Un prénom qui est aussi un mot (Rose, Aurore, Jade, Harmonie, Mélodie...) n'est retenu que s'il ouvre un
//    nom de personne (« Aurore Nussbaum ») ou suit « d’ » / « de » ; jamais au milieu d'une enseigne
//    (« L’Aurore du Bien-être », « Harmonie Massage »).
// 7. Les mots d'enseigne (Cabinet, Institut, Massage, Bien-être...) marquent le début de l'enseigne :
//    « Nathalie Renouard Cabinet l’Art des Sens » donne la personne « Nathalie Renouard » et l'enseigne
//    « Cabinet l’Art des Sens ».
// 8. Sans prénom reconnu, on renvoie l'enseigne entière et un prénom vide : la page salue alors l'enseigne.

const F = `Adèle Adeline Adélaïde Agathe Agnès Aïcha Albane Alexandra Alexia Alice Alicia Aline Alix Alizée Allison Amandine Amélie Amel
Ana Anaëlle Anaïs Anastasia Andrée Angèle Angélique Anita Anna Annabelle Anne Annick Annie Anouk Antoinette Apolline Ariane Armelle
Astrid Aude Audrey Aurélia Aurélie Aurore Ava Axelle Barbara Béatrice Bénédicte Bérangère Bernadette Blandine Brigitte Camille Capucine
Carine Carla Carole Caroline Cassandra Catherine Cécile Céline Chantal Charlène Charline Charlotte Chloé Christelle Christiane Christine
Cindy Claire Clara Clarisse Claudia Claudine Clélia Clémence Clémentine Cloé Colette Coline Constance Coralie Corinne Cyrielle Dalila
Danielle Daniela Daphné Delphine Denise Diane Dorothée Édith Edwige Éléonore Elena Éliane Élisa Élisabeth Élise Ella Elodie Éloïse Elsa
Émeline Émilie Emma Emmanuelle Enora Estelle Ève Eva Évelyne Fabienne Fabiola Fanny Fatima Fatou Faustine Félicie Flavie Flora Flore
Florence Floriane Francine Françoise Frédérique Gabrielle Gaëlle Gaëtane Garance Geneviève Georgette Géraldine Ghislaine Gisèle
Gwenaëlle Gwendoline Gwenola Hanna Hannah Hélène Helena Héloïse Hortense Huguette Ilona Inès Ingrid Irène Iris Isabelle Jacqueline
Jade Jeanne Jeannine Jennifer Jessica Joëlle Josée Joséphine Josette Josiane Judith Julia Julie Juliette Justine Karine Katia Laetitia
Laëtitia Lætitia Laura Laure Laurence Lauriane Laurie Léa Leïla Léna Léonie Léonore Lila Liliane Lina Lisa Lise Lison Lola Lorène
Lorraine Louise Lucie Lucienne Lucile Lucille Ludivine Ludmilla Luna Lydia Lydie Maëlle Maëva Magali Maïwenn Manon Margaux Margot
Marguerite Maria Marianne Marie Marielle Marilou Marina Marine Marion Marjorie Marlène Martine Maryline Maryse Mathilde Maud Maude
Mélanie Mélissa Mélodie Michèle Michelle Mireille Monique Morgane Muriel Mylène Myriam Nadège Nadia Nadine Naïma Natacha Nathalie
Nelly Nicole Nina Noémie Noëlle Nolwenn Nora Océane Odette Odile Olivia Ophélie Paola Pascale Pascaline Patricia Paule Paulette
Pauline Pénélope Perrine Prisca Priscilla Rachel Raphaëlle Rebecca Régine Renée Romane Rosalie Rose Roseline Rosine Roxane Rozenn
Sabine Sabrina Salomé Samia Sandra Sandrine Sandy Sara Sarah Servane Séverine Sidonie Simone Sixtine Soazig Solange Solène Sonia
Sophia Sophie Stéphanie Suzanne Suzy Sylvaine Sylviane Sylvie Tania Tatiana Thérèse Tifenn Tiphaine Typhaine Valentine Valérie
Vanessa Véronique Victoire Victoria Vinciane Violaine Violette Virginie Viviane Wendy Yaëlle Yasmina Yolaine Yolande Yvette Yvonne
Zoé Ambre Céleste Harmonie Prune Perle Lys Myrtille Olive Fleur Blanche Agnès Edith Elisabeth Elise Eloise Emilie Helene Heloise`;

const M = `Adrien Alain Alban Alexandre Alexis Alfred Ali Amaury Anthony Antoine Armand Arnaud Arthur Aurélien Axel Baptiste Bastien Benjamin
Benoît Bernard Bertrand Brice Bruno Cédric Charles Christian Christophe Clément Corentin Cyril Cyrille Damien Daniel David Denis
Didier Dimitri Dylan Édouard Emmanuel Enzo Éric Erwan Erwann Étienne Fabien Fabrice Félix Fernand Florent Florian Francis Franck
François Frédéric Gabriel Gaël Gaëtan Gaspard Gauthier Georges Gérard Gilbert Gilles Grégoire Grégory Guillaume Guy Henri Henry
Hervé Hubert Hugo Hugues Jacques Jean Jérémie Jérémy Jérôme Joël Johan Jonathan Jordan Joseph Jules Julien Kévin Killian Laurent
Léo Léon Lionel Loïc Louis Luc Lucas Ludovic Marc Marcel Marius Martin Mathéo Mathias Mathieu Matthias Matthieu Maxime Mehdi Michaël
Michel Mickaël Nathan Nicolas Noah Noël Olivier Pascal Patrice Patrick Paul Philippe Pierre Quentin Raphaël Raymond Régis Rémi
Rémy René Richard Robert Roger Romain Ronan Samuel Sébastien Serge Simon Stéphane Steve Sylvain Tanguy Théo Thibault Thibaut Thierry
Thomas Timothée Tristan Valentin Victor Vincent Xavier Yann Yannick Yohann Yves Zacharie Eric Etienne Edouard Benoit`;

const X = `Camille Claude Dominique Morgan Sacha Charlie Andréa Lou Alix Yaël Ange Maxence Gwen`;

// Prénoms qui sont aussi des noms de famille courants : ils passent après un prénom sans ambiguïté.
const AMBIGUS_NOM = `Martin Bernard Thomas Robert Richard Laurent Simon Michel David Bertrand Vincent François Henry Henri Nicolas Mathieu
Clément Gauthier Robin Denis Roger Noël Lucas Jean Gilbert Colin Pierre Arnaud Renaud Philippe Olivier Hubert Louis Charles Guillaume
Adam Julien Benoît Paul Rémy Germain Gérard Raymond Joseph Antoine Marin Blanche Rose`;

// Prénoms qui sont aussi des mots : retenus seulement en tête d'un nom de personne ou après « d’ » / « de ».
const AMBIGUS_MOT = `Aurore Rose Ambre Jade Flore Marine Violette Capucine Prune Perle Lys Lila Iris Ève Céleste Fleur Clémentine Olive Myrtille
Garance Mélodie Harmonie Victoire Constance Blanche Luna Océane Lou Ange Marin Noël Désiré Laurence`;

// Mots qui ouvrent ou signalent une enseigne.
const ENSEIGNE = `cabinet institut espace atelier studio centre maison salon spa massage massages bien-etre bienetre soin soins beaute therapie
therapies naturopathie hypnose sophrologie yoga coaching coach harmonie zen bulle cocon jardin chemin chemins source sources essence
energie energies sens art arts nature reflexologie shiatsu reiki magnetisme relaxation detente cabinets association asso sarl sas eurl
equilibre souffle lumiere instant parenthese pause oasis univers academie ecole`;

// Débuts habituels des prénoms composés écrits sans trait d'union (« Anne Sophie »).
const COMPOSANTS = ['marie', 'anne', 'jean', 'pierre', 'paul', 'louis', 'lou', 'rose', 'eve', 'marie'];

const CIVILITES = /^(m(?:me|lle|r)?\.?|madame|mademoiselle|monsieur|dr\.?|docteur|pr\.?)$/i;

export const sansAccent = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’`]/g, "'").toLowerCase();

const PRENOMS = new Map();
for (const [liste, genre] of [[F, 'f'], [M, 'm'], [X, 'x']]) {
  for (const p of liste.split(/\s+/).filter(Boolean)) {
    const cle = sansAccent(p);
    const deja = PRENOMS.get(cle);
    // la forme accentuée l'emporte sur la forme sans accent ; un prénom dans deux listes devient mixte
    if (!deja) PRENOMS.set(cle, { forme: p, genre });
    else {
      if (p !== sansAccent(p) && deja.forme === sansAccent(deja.forme).replace(/^./, (c) => c.toUpperCase())) deja.forme = p;
      if (deja.genre !== genre) deja.genre = 'x';
    }
  }
}
const ensemble = (s) => new Set(s.split(/\s+/).filter(Boolean).map(sansAccent));
const AMB_NOM = ensemble(AMBIGUS_NOM), AMB_MOT = ensemble(AMBIGUS_MOT), MOTS_ENSEIGNE = ensemble(ENSEIGNE);

/** Le prénom connu pour un mot (sans élision), ou null. */
export function prenomConnu(mot) {
  const cle = sansAccent(mot).replace(/^(?:d|l|j|qu|chez)'/, '');
  if (PRENOMS.has(cle)) return PRENOMS.get(cle);
  // prénom composé avec trait d'union : chaque partie doit être un prénom
  if (cle.includes('-')) {
    const parts = cle.split('-');
    if (parts.length <= 3 && parts.every((x) => PRENOMS.has(x))) {
      const genres = new Set(parts.map((x) => PRENOMS.get(x).genre).filter((g) => g !== 'x'));
      return { forme: parts.map((x) => PRENOMS.get(x).forme).join('-'), genre: genres.size === 1 ? [...genres][0] : 'x' };
    }
  }
  return null;
}

const estCapitales = (m) => m.length > 1 && m === m.toUpperCase() && m !== m.toLowerCase();
const majuscule = (m) => m.replace(/^\p{L}/u, (c) => c.toUpperCase());
const nomPropre = (m) => (estCapitales(m) || (m === m.toLowerCase() && m.length > 3) ? m.toLowerCase().replace(/(^|[-\s])\p{L}/gu, (c) => c.toUpperCase()) : m);

/**
 * Analyse le champ `nom` d'une fiche.
 * @returns {{prenom:string, genre:'f'|'m'|'x'|'', personne:string, enseigne:string, nomAffiche:string}}
 */
export function analyserNom(nom) {
  const brut = String(nom ?? '').replace(/\s+/g, ' ').trim();
  const vide = { prenom: '', genre: '', personne: '', enseigne: brut, nomAffiche: brut };
  if (!brut) return vide;
  // découpe en mots ; « d’Adeline » garde son élision pour la règle 2
  let mots = brut.split(' ').filter((m) => !CIVILITES.test(m));
  if (!mots.length) return vide;
  const cles = mots.map((m) => sansAccent(m));
  const avecCapitales = mots.some(estCapitales) && mots.some((m) => !estCapitales(m) && /\p{L}/u.test(m));

  // début de l'enseigne : premier mot d'enseigne après au moins un mot (ou en tête)
  const indexEnseigne = cles.findIndex((c) => MOTS_ENSEIGNE.has(c.replace(/^(?:d|l)'/, '')) && !['et', '&', 'de', 'la', 'le', 'les', 'du', 'des', 'l', 'd', 'au', 'aux'].includes(c));

  const candidats = [];
  mots.forEach((m, i) => {
    const c = cles[i];
    const elision = /^(?:d|l|qu)'/.test(c);
    const apresDe = elision ? c.startsWith("d'") : i > 0 && ['de', 'chez'].includes(cles[i - 1]);
    if (c.startsWith("l'")) return; // « L’Aurore », « l’Art » : un nom commun
    const p = prenomConnu(m);
    if (!p) return;
    if (avecCapitales && estCapitales(m)) return; // règle 4
    const ambMot = AMB_MOT.has(sansAccent(p.forme));
    const dansEnseigne = indexEnseigne >= 0 && i > indexEnseigne;
    if (ambMot && !apresDe) {
      // règle 6 : en tête d'un nom de personne seulement (pas d'enseigne juste après, pas plus de 3 mots)
      const suite = cles.slice(i + 1);
      if (i !== 0 || suite.length > 2 || suite.some((x) => MOTS_ENSEIGNE.has(x))) return;
    }
    if (dansEnseigne && !apresDe) return;
    candidats.push({ i, p, apresDe, ambNom: AMB_NOM.has(sansAccent(p.forme)) });
  });
  if (!candidats.length) {
    // Prénom absent de la liste (« De Baker Marivonne », « DE BAKER Marivonne », « Marivonne De Baker ») : on le
    // reconnaît à la forme d'un nom de personne (2 à 4 mots, que des lettres, une particule ou un nom en capitales).
    const PART = ['de', 'du', 'des', 'le', 'la', 'van', 'von', 'da', 'di', 'del', 'della', 'dos', 'ten', 'ter', 'mac', 'mc'];
    const lettres = mots.every((m) => /^\p{L}[\p{L}'’-]*$/u.test(m));
    const sansEnseigne = indexEnseigne < 0 && mots.length >= 2 && mots.length <= 4 && lettres;
    let iP = -1;
    if (sansEnseigne) {
      if (avecCapitales) { const nc = mots.map((m, i) => (!estCapitales(m) ? i : -1)).filter((i) => i >= 0); if (nc.length === 1) iP = nc[0]; }
      else if (PART.includes(cles[0]) && mots.length >= 3 && !PART.includes(cles[mots.length - 1])) iP = mots.length - 1;
      else if (mots.length >= 3 && PART.includes(cles[1])) iP = 0;
    }
    if (iP < 0) return { ...vide, enseigne: brut, nomAffiche: brut };
    const prenom = majuscule(nomPropre(mots[iP]));
    const reste = mots.filter((_, i) => i !== iP).map((m) => (estCapitales(m) ? nomPropre(m) : m)).join(' ');
    const personne = `${prenom} ${reste}`;
    return { prenom, genre: 'x', personne, enseigne: '', nomAffiche: personne };
  }

  // règle 5 : un prénom sans ambiguïté passe devant un prénom qui est aussi un nom de famille
  const net = candidats.filter((c) => !c.ambNom);
  let choix = (candidats.find((c) => c.apresDe) || net[0] || candidats[0]);

  // prénom composé écrit sans trait d'union : « Anne Sophie Martin »
  let fin = choix.i;
  const suivant = candidats.find((c) => c.i === choix.i + 1);
  if (suivant && COMPOSANTS.includes(sansAccent(choix.p.forme)) && mots.length >= 3) {
    choix = { ...choix, p: { forme: `${choix.p.forme}-${suivant.p.forme}`, genre: suivant.p.genre === 'x' ? choix.p.genre : suivant.p.genre } };
    fin = suivant.i;
  }

  // son orthographe à elle d'abord : « Laetitia » reste Laetitia (la liste ne sert qu'à remettre des capitales ou
  // des accents à un nom écrit TOUT EN CAPITALES ou tout en minuscules)
  const ecrit = mots[choix.i].replace(/^(?:[dDlL]|[qQ]u|[cC]hez)['’]/, '');
  const telQuel = fin === choix.i && /^\p{Lu}\p{Ll}/u.test(ecrit) && !estCapitales(ecrit) && sansAccent(ecrit) === sansAccent(choix.p.forme);
  const prenom = telQuel ? ecrit : choix.p.forme, genre = choix.p.genre;
  // personne et enseigne
  if (choix.apresDe || (indexEnseigne === 0)) {
    return { prenom, genre, personne: '', enseigne: brut, nomAffiche: brut };
  }
  const coupe = indexEnseigne > fin ? indexEnseigne : mots.length;
  const personneMots = mots.slice(0, coupe).map(nomPropre);
  const enseigne = coupe < mots.length ? mots.slice(coupe).join(' ') : '';
  // remettre le prénom en tête (« Meyer Sandrine » devient « Sandrine Meyer »)
  const avant = personneMots.slice(0, choix.i), apres = personneMots.slice(fin + 1);
  const personne = [prenom, ...apres, ...avant].join(' ');
  return { prenom, genre, personne, enseigne, nomAffiche: personne };
}

// Féminisation du métier quand le prénom est féminin : la fiche dit souvent « Accompagnant périnatal » ou
// « Psychopraticien » alors que la personne écrit elle-même « accompagnante périnatale ».
const FEMININS = {
  accompagnant: 'accompagnante', consultant: 'consultante', intervenant: 'intervenante', enseignant: 'enseignante',
  perinatal: 'périnatale', prenatal: 'prénatale', postnatal: 'postnatale', familial: 'familiale', conjugal: 'conjugale',
  corporel: 'corporelle', emotionnel: 'émotionnelle', professionnel: 'professionnelle', certifie: 'certifiée', diplome: 'diplômée',
  masseur: 'masseuse', magnetiseur: 'magnétiseuse', guerisseur: 'guérisseuse', animateur: 'animatrice', formateur: 'formatrice',
  educateur: 'éducatrice', conseiller: 'conseillère', praticien: 'praticienne', createur: 'créatrice', instructeur: 'instructrice',
};
const garderCasse = (modele, mot) => (/^\p{Lu}/u.test(modele) ? majuscule(mot) : mot);

/** « Psychopraticien » devient « Psychopraticienne » si genre === 'f' ; sinon le métier est rendu tel quel. */
export function feminiser(metier, genre) {
  const m = String(metier ?? '').trim();
  if (genre !== 'f' || !m) return m;
  return m.split(/(\s+)/).map((mot) => mot.split('-').map((part) => {
    const c = sansAccent(part);
    if (FEMININS[c]) return garderCasse(part, FEMININS[c]);
    if (/ien$/.test(c) && c.length > 5) return part + 'ne';
    return part;
  }).join('-')).join('');
}

/** « Aix-En-Provence » devient « Aix-en-Provence » ; le reste est rendu tel quel. */
export function villePropre(v) {
  return String(v ?? '').trim().replace(/-(En|Sur|Sous|Le|La|Les|De|Du|Des|Et|Lès|Lez|Aux|Au)-/g, (x) => x.toLowerCase());
}

/** Salutation de l'ouverture : { mot: 'Bonjour', nom: 'Aurore', avecPrenom: true } ou l'enseigne sans prénom. */
export function salutation(d) {
  const a = analyserNom(d?.nom);
  if (a.prenom) return { mot: 'Bonjour', nom: a.prenom, avecPrenom: true, analyse: a };
  return { mot: 'Bonjour', nom: a.enseigne || String(d?.nom || ''), avecPrenom: false, analyse: a };
}
