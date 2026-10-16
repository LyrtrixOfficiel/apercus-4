// Prenom, enseigne et metier accorde, devines depuis la fiche (le nom est parfois a l'envers,
// parfois une enseigne). Rien n'est invente : si on ne reconnait pas de prenom, on n'en met pas.
const F = `marie nathalie isabelle sylvie catherine francoise martine christine monique valerie sandrine stephanie veronique sophie celine chantal patricia anne brigitte julie aurelie caroline emilie laurence corinne helene nicole virginie elodie audrey melanie delphine karine laetitia claire camille laura sarah pauline marion manon emma lea chloe clara ines lucie anais justine charlotte mathilde marine alice jade louise lola juliette oceane elsa agathe margaux margot morgane amandine adeline aurore ingrid sabrina marilou jessica vanessa cecile florence agnes beatrice pascale danielle josiane annie jacqueline michele michelle christiane odile colette evelyne fabienne muriel murielle myriam nadia nadine pierrette rose solene gaelle fanny coralie gwenaelle maud maelle nolwenn laure laurie lise line lina melissa noemie ophelie perrine priscilla rachel rebecca sabine severine sonia tatiana valentine victoria yasmine zoe alexandra amelie angelique anna annabelle armelle aude axelle berenice carole cassandra cindy clemence clotilde cynthia diane eleonore eva estelle eugenie floriane geraldine ghislaine hortense irene jeanne jennifer joelle johanna josette julia karen katia lena leonie lorraine ludivine lydie lydia magali maeva marina marjorie marlene maryse mireille nina noelle paula romane roxane segolene sylviane tiphaine vera violaine viviane yvonne zelie alix apolline capucine heloise iris elise elisa emeline gwendoline lou maya mila naomi nora rosa salome thais adele albane anouk ariane blanche constance coline daphne edith flora gabrielle garance jocelyne liliane lucile lucienne madeleine melodie mylene nelly regine sandra simone stella suzanne therese yolande anaelle lilou leila samia fatima karima amel malika nadege prisca cathy sandy kelly peggy nancy jenny gwen tania ilona kim mia aline ange angele annick arlette bernadette chrystelle christelle claudine danielle denise elisabeth elizabeth emmanuelle francine genevieve gisele huguette jeannine josephine laurene lauriane louna maite marianne marielle maryline marylene nathaly noella oriane paule raphaelle rosine sylvaine valery yvette zohra sylvia cristina carla chiara ingrid helena`;
const M = `jean pierre michel philippe alain nicolas christophe patrick laurent frederic sebastien stephane david olivier eric thierry pascal daniel bernard julien vincent thomas francois didier bruno jerome guillaume antoine maxime alexandre romain hugo lucas louis paul arthur jules gabriel leo raphael adam mathieu matthieu benoit cedric fabrice franck gilles herve jacques joel lionel marc mathias mickael nathan patrice quentin remi remy samuel simon sylvain tristan yann yannick yves xavier arnaud benjamin bertrand clement damien denis emmanuel fabien florian gregory hugues jeremy jonathan kevin loic ludovic marius martin mehdi noel regis rene robert roger serge thibault timothee valentin victor willy christian claude gerard georges henri andre marcel lucien anthony aurelien baptiste bastien charles corentin dylan erwan gael gaetan jordan leon matheo matteo nolan robin sacha theo tom enzo ethan axel elliot gauthier loris sebastian dominique`;
const sansAccent = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const FEM = new Set(F.split(/\s+/)), MASC = new Set(M.split(/\s+/));

// Mots qui annoncent une enseigne apres le nom de la personne.
const ENSEIGNE = /\s+((?:cabinet|institut|espace|atelier|studio|maison|centre|salon|boutique|coach(?:ing)?|la bulle|l['’]atelier)\b.*)$/i;

export function lireNom(d) {
  const nom = String(d?.nom || '').trim();
  let personne = nom, enseigne = '';
  const m = nom.match(ENSEIGNE);
  if (m && m.index > 2) { personne = nom.slice(0, m.index).trim(); enseigne = m[1].trim(); }
  const mots = nom.split(/[\s'’-]+/).filter(Boolean);
  let prenom = '', genre = '';
  for (const w of mots) {
    const k = sansAccent(w);
    if (FEM.has(k)) { prenom = w; genre = 'f'; break; }
    if (MASC.has(k)) { prenom = w; genre = 'm'; break; }
  }
  // « Institut de Beauté Carole Duforêt » : l'enseigne vient devant la personne ; on les sépare.
  if (prenom && !enseigne && /^(institut|cabinet|espace|atelier|studio|maison|centre|salon|boutique)$/i.test(mots[0])) {
    const i = nom.indexOf(prenom);
    if (i > 0 && nom.slice(i).trim().split(/\s+/).length >= 2) { enseigne = nom.slice(0, i).trim(); personne = nom.slice(i).trim(); }
  }
  // « Meyer Sandrine » : le prenom vient en second ; on le remet devant pour l'affichage.
  if (prenom && !enseigne && mots.length === 2 && sansAccent(mots[1]) === sansAccent(prenom)) personne = `${mots[1]} ${mots[0]}`;
  // Une enseigne sans personne devant (« La Bulle d'Adeline », « Cornouaille Massage Quimper ») : on la garde entiere.
  if (/^(la|le|les|l['’])\s/i.test(nom) || !prenom) { if (!enseigne) { enseigne = ''; personne = nom; } }
  return { nom, personne, enseigne, prenom, genre };
}

// Metier accorde au feminin quand le prenom est feminin (« Socio-esthéticien » pour Marion).
export function metierAccorde(d, genre) {
  let m = String(d?.metier || '').trim();
  if (genre !== 'f' || !m) return m;
  return m.replace(/\b([\p{L}-]*?)(icien|éticien|praticien|ien)\b/giu, (t) => t + 'ne')
    .replace(/\b(Accompagnant|Intervenant|Consultant|Enseignant)\b/g, '$1e')
    .replace(/p([ée])rinatal\b/g, 'p$1rinatale').replace(/\b(Masseur)\b/g, 'Masseuse').replace(/\b([\p{L}]+)teur\b/gu, (t, r) => r + 'trice');
}

// Initiales propres : deux lettres au plus.
export function initiales(d, lu) {
  // une personne nommée dans l'enseigne : ses initiales à elle (« Carole Duforêt » : CD, pas « ID »)
  if (lu?.enseigne && lu.personne && lu.personne !== lu.nom && /\s/.test(lu.personne)) { const w = lu.personne.split(/\s+/); return (w[0][0] + w[w.length - 1][0]).toUpperCase(); }
  const i = String(d?.initiales || '').replace(/[^\p{L}]/gu, '').slice(0, 2).toUpperCase();
  if (i) return i;
  return (lu.personne || lu.nom).split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}
