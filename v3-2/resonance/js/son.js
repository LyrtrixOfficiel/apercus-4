// Resonance : le son, synthetise en direct (Web Audio), coupe par defaut. Aucun fichier audio.
// Bol tibetain : partiels inharmoniques qui battent doucement, longue extinction, petit choc du maillet.
// Bol de cristal : son presque pur, tres long. Cordes : un pince doux. Eau : une goutte.
let ctx = null, sortie = null, actif = false;

function reverberation(c) {
  const duree = 3.2, n = Math.round(c.sampleRate * duree), b = c.createBuffer(2, n, c.sampleRate);
  for (let k = 0; k < 2; k++) { const d = b.getChannelData(k); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3.2); }
  const conv = c.createConvolver(); conv.buffer = b; return conv;
}

export function sonActif() { return actif; }
export async function activerSon(oui) {
  actif = oui;
  if (!oui) { if (ctx) sortie.gain.setTargetAtTime(0, ctx.currentTime, .15); return; }
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) { actif = false; return false; }
    ctx = new AC();
    sortie = ctx.createGain(); sortie.gain.value = 0;
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 3;
    const rev = reverberation(ctx), sec = ctx.createGain(), mouille = ctx.createGain();
    sec.gain.value = .8; mouille.gain.value = .32;
    sortie.connect(sec).connect(comp); sortie.connect(rev).connect(mouille).connect(comp);
    comp.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') await ctx.resume();
  sortie.gain.setTargetAtTime(.85, ctx.currentTime, .05);
  return true;
}

function partiel(f, amp, duree, t, battement = .6, attaque = .004) {
  for (const d of [-battement / 2, battement / 2]) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.value = f + d;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(amp / 2, t + attaque);
    g.gain.exponentialRampToValueAtTime(.0001, t + duree);
    o.connect(g).connect(sortie); o.start(t); o.stop(t + duree + .05);
  }
}

// Un bol frappe. force : 0 a 1.
export function bol(frequence = 196, timbre = 'tibetain', force = .8) {
  if (!actif || !ctx) return;
  const t = ctx.currentTime + .01, a = .22 * force;
  if (timbre === 'cristal') {
    partiel(frequence, a * 1.1, 11, t, .35, .05);
    partiel(frequence * 2.001, a * .18, 7, t, .5, .05);
    partiel(frequence * 3.003, a * .06, 4, t, .7, .05);
  } else {
    [[1, 1, 9.5], [2.71, .55, 6.5], [5.15, .3, 4.2], [8.17, .16, 2.6], [11.9, .07, 1.4]].forEach(([r, k, d]) => partiel(frequence * r, a * k, d, t, .45 + r * .12));
    // le choc du maillet : un souffle bref, filtre
    const n = Math.round(ctx.sampleRate * .04), b = ctx.createBuffer(1, n, ctx.sampleRate), x = b.getChannelData(0);
    for (let i = 0; i < n; i++) x[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2);
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = b; f.type = 'bandpass'; f.frequency.value = frequence * 6; f.Q.value = 1.4; g.gain.value = a * .5;
    s.connect(f).connect(g).connect(sortie); s.start(t);
  }
}

// Une corde pincee (harpe douce).
export function corde(frequence = 220, force = .6) {
  if (!actif || !ctx) return;
  const t = ctx.currentTime + .005, a = .12 * Math.min(1, force);
  [[1, 1, 2.6], [2, .4, 1.6], [3, .18, 1.1], [4, .08, .7]].forEach(([r, k, d]) => partiel(frequence * r, a * k, d, t, .3, .006));
}

// Une goutte d'eau (art-therapie).
export function goutte(force = .7) {
  if (!actif || !ctx) return;
  const t = ctx.currentTime + .005, o = ctx.createOscillator(), g = ctx.createGain();
  o.type = 'sine'; o.frequency.setValueAtTime(420, t); o.frequency.exponentialRampToValueAtTime(1350, t + .07);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.14 * force, t + .006); g.gain.exponentialRampToValueAtTime(.0001, t + .22);
  o.connect(g).connect(sortie); o.start(t); o.stop(t + .25);
}

// Gamme pentatonique (re mineur) pour les cordes et les figures.
export const GAMME = [146.83, 174.61, 196, 220, 261.63, 293.66, 349.23, 392];
