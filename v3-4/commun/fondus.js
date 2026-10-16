// Tour 4 (17/10/2026) : les fonds qui se fondent au défilement, partagé par les univers.
// Mathéo : « quand tu scrolles, tu passes d'une section à l'autre, il y a comme un bandeau, une jointure ». Ici, le
// fond n'appartient plus à chaque section : il est peint une seule fois, sur toute la page, et sa teinte glisse de
// celle d'une section à celle de la suivante AU RYTHME DU DÉFILEMENT (le doigt pilote, rien ne bascule d'un coup).
//
// Utilisation :
//   import { fondus } from '../../commun/fondus.js';
//   fondus({ sections: [...document.querySelectorAll('main > section, footer')] });
// Chaque section donne sa teinte par la propriété CSS --fond-section (une couleur, variables permises).
// Le module ajoute la classe .fondus sur <html> : la CSS de l'univers y rend les sections transparentes (sans
// JavaScript, chaque section garde son propre fond : la page reste lisible). Il écrit sur la cible (body par défaut)
// --fondu-a, --fondu-b (les deux teintes) et --fondu-k (0 % à 100 %) ; la CSS peint :
//   html.fondus body { background: color-mix(in oklab, var(--fondu-a), var(--fondu-b) var(--fondu-k)); }
// Une section peut aussi donner une seconde teinte, --fond-section-2 (un duo, pour un dégradé horizontal par exemple) :
// le module écrit alors aussi --fondu-a2 et --fondu-b2 (égales à la première teinte si la section n'en donne pas).
// zone : la part de la hauteur d'écran sur laquelle se fait le passage (0,7 par défaut), centrée sur le milieu
// de l'écran. Aucun minuteur, aucune boucle permanente : une lecture par image, seulement pendant le défilement.

export function fondus({ sections, cible = document.body, zone = 0.7, centre = 0.5, classe = 'fondus' } = {}) {
  const liste = (sections || []).filter(Boolean);
  if (!liste.length || typeof getComputedStyle === 'undefined') return { maj() {}, couleurs() {} };
  let teintes = [], teintes2 = [];
  const lire = () => {
    const cs = liste.map((s) => getComputedStyle(s));
    teintes = cs.map((c) => c.getPropertyValue('--fond-section').trim() || '');
    teintes2 = cs.map((c, i) => c.getPropertyValue('--fond-section-2').trim() || teintes[i]);
  };
  lire();
  document.documentElement.classList.add(classe);
  let prevu = false, derniere = '';
  const lisse = (k) => k * k * (3 - 2 * k);
  function maj() {
    prevu = false;
    const H = innerHeight, milieu = H * centre, Z = Math.max(1, H * zone);
    const hauts = liste.map((s) => s.getBoundingClientRect().top);
    let i0 = 0;
    for (let i = 0; i < liste.length; i++) if (hauts[i] <= milieu) i0 = i;
    let a = teintes[i0], b = teintes[i0], a2 = teintes2[i0], b2 = teintes2[i0], k = 0;
    // la limite la plus proche du milieu de l'écran décide du mélange
    for (let i = 1; i < liste.length; i++) {
      const t = (milieu + Z / 2 - hauts[i]) / Z;
      if (t > 0 && t < 1) { a = teintes[i - 1]; b = teintes[i]; a2 = teintes2[i - 1]; b2 = teintes2[i]; k = lisse(t); break; }
    }
    if (!a) a = b || teintes.find(Boolean) || 'transparent';
    if (!b) b = a;
    a2 = a2 || a; b2 = b2 || b;
    const cle = a + '|' + b + '|' + a2 + '|' + b2 + '|' + Math.round(k * 400);
    if (cle === derniere) return;
    derniere = cle;
    cible.style.setProperty('--fondu-a', a);
    cible.style.setProperty('--fondu-b', b);
    cible.style.setProperty('--fondu-a2', a2);
    cible.style.setProperty('--fondu-b2', b2);
    cible.style.setProperty('--fondu-k', (k * 100).toFixed(2) + '%');
  }
  const demander = () => { if (!prevu) { prevu = true; requestAnimationFrame(maj); } };
  addEventListener('scroll', demander, { passive: true });
  addEventListener('resize', demander);
  maj();
  return {
    maj: demander,
    /** À rappeler quand la palette change (les teintes sont relues). */
    couleurs() { lire(); derniere = ''; demander(); }
  };
}
