/* Kazura v12, le Monde : le repli sans WebGL.
   Un fond peint en CSS (nuit, violet, jade) posé juste derrière le contenu, et le sceau en SVG qui
   apparaît doucement puis se met en retrait. L'ambiance suit la page par fondu de quatre calques.
   Même interface que le Monde 3D. */
import { SVG_SCEAU } from './sceau.js';
import { SECTIONS } from './ambiances.js';

const STYLE = `
.kz-repli { position: fixed; inset: 0; pointer-events: none; overflow: hidden; background: #07050f; }
.kz-repli > i { position: absolute; inset: -10%; opacity: 0; transition: opacity 2.4s ease; }
.kz-repli .kz-nuit { opacity: 1; background:
  radial-gradient(60% 50% at 78% 22%, rgba(109, 63, 209, .38), transparent 70%),
  radial-gradient(70% 60% at 85% 85%, rgba(16, 185, 129, .16), transparent 70%),
  radial-gradient(120% 90% at 50% 0%, #170d30 0%, #08051a 55%, #040309 100%); }
.kz-repli .kz-aube { background:
  radial-gradient(60% 45% at 80% 30%, rgba(233, 201, 135, .30), transparent 70%),
  radial-gradient(70% 60% at 20% 90%, rgba(168, 85, 247, .14), transparent 70%),
  radial-gradient(120% 90% at 50% 0%, #241612 0%, #0d0809 60%, #050306 100%); }
.kz-repli .kz-jade { background:
  radial-gradient(60% 50% at 80% 25%, rgba(127, 224, 184, .22), transparent 70%),
  radial-gradient(60% 60% at 15% 85%, rgba(167, 139, 250, .12), transparent 70%),
  radial-gradient(120% 90% at 50% 0%, #0a221b 0%, #04120e 60%, #020806 100%); }
.kz-repli .kz-crepuscule { background:
  radial-gradient(60% 45% at 82% 35%, rgba(231, 122, 143, .28), transparent 70%),
  radial-gradient(70% 60% at 20% 80%, rgba(192, 132, 252, .18), transparent 70%),
  radial-gradient(120% 90% at 50% 0%, #2a0f24 0%, #0f0612 60%, #050208 100%); }
.kz-repli .kz-sceau { position: absolute; left: 50%; top: 44%; width: min(46vmin, 360px); aspect-ratio: 1; transform: translate(-50%, -50%) scale(.92);
  opacity: 0; filter: drop-shadow(0 0 22px rgba(168, 85, 247, .55)); transition: opacity 1.4s ease, transform 2.2s cubic-bezier(.2, .7, .2, 1); }
.kz-repli .kz-sceau svg { width: 100%; height: 100%; display: block; }
.kz-repli.kz-vu .kz-sceau { opacity: .9; transform: translate(-50%, -50%) scale(1); }
.kz-repli.kz-retrait .kz-sceau { opacity: .3; }
@media (prefers-reduced-motion: reduce) { .kz-repli .kz-sceau { transition-duration: 2.4s, 3.2s; } }
`;

export function repli(canvas) {
  if (!document.getElementById('kz-repli-style')) {
    const st = document.createElement('style');
    st.id = 'kz-repli-style'; st.textContent = STYLE;
    document.head.appendChild(st);
  }
  const div = document.createElement('div');
  div.className = 'kz-repli';
  div.setAttribute('aria-hidden', 'true');
  div.innerHTML = '<i class="kz-nuit"></i><i class="kz-aube"></i><i class="kz-jade"></i><i class="kz-crepuscule"></i><div class="kz-sceau">' + SVG_SCEAU + '</div>';
  const cs = canvas ? getComputedStyle(canvas) : null;
  if (cs && cs.zIndex && cs.zIndex !== 'auto') div.style.zIndex = cs.zIndex;
  if (canvas && canvas.parentNode) { canvas.style.display = 'none'; canvas.parentNode.insertBefore(div, canvas.nextSibling); }
  else document.body.prepend(div);
  const calques = div.querySelectorAll('i');
  const sceauEl = div.querySelector('.kz-sceau');
  let finir;
  const ouvertureFinie = new Promise((r) => { finir = r; });
  requestAnimationFrame(() => requestAnimationFrame(() => div.classList.add('kz-vu')));
  const minuteur = setTimeout(() => { div.classList.add('kz-retrait'); finir(); }, 1700);
  // ambiance : 0 nuit, 1 aube, 2 jade, 3 crépuscule
  const parSection = [0, 0, 0.4, 1, 1, 2, 2, 2.5, 3];
  return {
    pret: Promise.resolve(),
    ouvertureFinie,
    repli: true,
    progression(p, sectionId) {
      const i = SECTIONS.indexOf(sectionId);
      const a = i >= 0 ? parSection[i] : Math.min(3, Math.max(0, p * 3));
      calques.forEach((c, k) => { c.style.opacity = k === 0 ? '1' : String(Math.max(0, 1 - Math.abs(a - k))); });
      sceauEl.style.opacity = p > 0.06 ? '0.1' : '';
    },
    passer() { div.classList.add('kz-retrait'); finir(); },
    detruire() { clearTimeout(minuteur); div.remove(); if (canvas) canvas.style.display = ''; },
  };
}
