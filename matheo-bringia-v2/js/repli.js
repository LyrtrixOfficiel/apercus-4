// Mathéo Bringia : le repli SANS WebGL de la scène (canvas 2D). Même ambiance que la 3D, en plus simple :
// la nuit, la lueur orange de l'horizon, la piste en perspective (lignes, vibreurs, quadrillage de télémétrie),
// les lignes de vitesse et la gomme. Mêmes ambiances par partie de page (scene.js, AMBIANCES).

export function lancerRepli({ canvas, reduit = false, etat }) {
  const ctx = canvas.getContext('2d');
  let L = 0, H = 0, k = 1;
  function taille() {
    L = innerWidth; H = innerHeight;
    k = Math.min(1, 1600 / Math.max(L, 1)) * Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(L * k); canvas.height = Math.round(H * k);
  }
  taille();
  addEventListener('resize', taille);
  const alea = (() => { let s = 7; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
  const traits = Array.from({ length: 70 }, () => ({ a: alea() * Math.PI * 2, r: 0.15 + alea() * 0.85, z: alea(), l: 0.05 + alea() * 0.12, o: alea() < 0.35 }));
  const grains = Array.from({ length: 120 }, () => ({ x: alea() - 0.5, y: alea(), z: alea(), s: alea() }));
  let t = 0, dernier = performance.now(), defile = 0, arret = false, vit = 0;
  const lent = reduit ? 0.35 : 1;

  function image(now) {
    if (arret) return;
    requestAnimationFrame(image);
    if (document.hidden) { dernier = now; return; }
    const dt = Math.min(0.05, (now - dernier) / 1000); dernier = now;
    t += dt * lent;
    const e = etat(), a = e.amb;
    vit += ((e.vitesse || 0) - vit) * Math.min(1, dt * 4);
    const elan = Math.min(3, Math.abs(vit) / 900);
    defile += dt * (a.vitLignes * 0.5 + elan * 1.2) * lent;
    const W = canvas.width, Hh = canvas.height;
    // l'horizon monte quand la caméra regarde vers le bas (vue du ciel : plus d'horizon)
    const hz = Hh * (0.42 + Math.max(-0.5, a.tangage) * -0.9);
    const g = ctx.createLinearGradient(0, 0, 0, Hh);
    g.addColorStop(0, '#060708'); g.addColorStop(Math.max(0, Math.min(1, hz / Hh - 0.12)), '#07080a');
    g.addColorStop(Math.max(0, Math.min(1, hz / Hh)), `rgba(${Math.round(60 * a.horizon + 8)},${Math.round(22 * a.horizon + 8)},${Math.round(10 * a.horizon + 9)},1)`);
    g.addColorStop(Math.max(0, Math.min(1, hz / Hh + 0.02)), '#0b0c0e');
    g.addColorStop(1, '#050506');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, Hh);
    // la nappe orange
    const ng = ctx.createRadialGradient(W / 2, Math.min(Hh, hz + Hh * 0.35), 0, W / 2, Math.min(Hh, hz + Hh * 0.35), Math.max(W, Hh) * 0.6);
    ng.addColorStop(0, `rgba(255,90,20,${0.22 * a.lumiere})`); ng.addColorStop(1, 'rgba(255,90,20,0)');
    ctx.fillStyle = ng; ctx.fillRect(0, 0, W, Hh);
    // la piste en perspective
    if (hz < Hh) {
      const cx = W / 2 + Math.sin(t * 0.13) * W * 0.01;
      const proj = (x, d) => [cx + (x / d) * W * 0.45, hz + (a.camY / d) * Hh * 0.9];
      ctx.lineCap = 'round';
      for (const cote of [-1, 1]) {
        // bord blanc
        ctx.strokeStyle = 'rgba(210,205,198,.55)'; ctx.lineWidth = 2 * k;
        ctx.beginPath(); let p = proj(cote * 5, 0.6); ctx.moveTo(p[0], p[1]); p = proj(cote * 5, 120); ctx.lineTo(p[0], p[1]); ctx.stroke();
        // vibreurs
        for (let i = 0; i < 26; i++) {
          const z0 = 1 + i * 2.2 - ((defile * 22) % 4.4), z1 = z0 + 1.1;
          if (z0 < 0.7) continue;
          const p0 = proj(cote * 5.1, z0), p1 = proj(cote * 5.8, z0), p2 = proj(cote * 5.8, z1), p3 = proj(cote * 5.1, z1);
          ctx.fillStyle = i % 2 ? `rgba(255,90,20,${0.55 * a.bordures})` : `rgba(220,215,208,${0.4 * a.bordures})`;
          ctx.beginPath(); ctx.moveTo(...p0); ctx.lineTo(...p1); ctx.lineTo(...p2); ctx.lineTo(...p3); ctx.fill();
        }
      }
      // quadrillage de télémétrie
      ctx.strokeStyle = `rgba(255,110,40,${0.18 * a.quad})`; ctx.lineWidth = 1 * k;
      for (let x = -24; x <= 24; x += 4) { ctx.beginPath(); let p = proj(x, 0.8); ctx.moveTo(...p); p = proj(x, 80); ctx.lineTo(...p); ctx.stroke(); }
      for (let i = 0; i < 20; i++) { const d = 1 + i * 4 - ((defile * 22) % 4); if (d < 0.8) continue; ctx.beginPath(); let p = proj(-30, d); ctx.moveTo(...p); p = proj(30, d); ctx.lineTo(...p); ctx.stroke(); }
    }
    // les lignes de vitesse : elles partent du point de fuite vers les bords
    ctx.globalCompositeOperation = 'lighter';
    const fx = W / 2, fy = hz;
    for (const s of traits) {
      const z = (s.z + defile * (0.6 + s.r)) % 1;
      const d0 = Math.pow(z, 2.2), d1 = Math.pow(Math.min(1, z + s.l), 2.2);
      const R = Math.hypot(W, Hh) * 0.75 * s.r;
      const x0 = fx + Math.cos(s.a) * R * d0, y0 = fy + Math.sin(s.a) * R * d0 * 0.7;
      const x1 = fx + Math.cos(s.a) * R * d1, y1 = fy + Math.sin(s.a) * R * d1 * 0.7;
      const al = a.lignes * (0.25 + elan * 0.3) * Math.sin(Math.PI * z) * (reduit ? 0.7 : 1);
      ctx.strokeStyle = s.o ? `rgba(255,110,40,${al})` : `rgba(255,245,235,${al * 0.8})`;
      ctx.lineWidth = (0.6 + 2 * d1) * k;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    }
    ctx.globalCompositeOperation = 'source-over';
    // la gomme
    for (const p of grains) {
      const z = (p.z + t * 0.08 * (0.5 + p.s) + defile * 0.2) % 1;
      const d = 0.3 + (1 - z) * 12;
      const x = fx + (p.x * 22 / d) * W * 0.45, y = hz + ((a.camY - p.y * 4) / d) * Hh * 0.9;
      const r = Math.max(0.6, (5 / d) * k * (0.5 + p.s));
      ctx.fillStyle = `rgba(${p.s > 0.8 ? '255,110,40' : '20,20,22'},${a.gomme * 0.7 * Math.sin(Math.PI * z)})`;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
  }
  requestAnimationFrame((n) => { dernier = n; image(n); canvas.classList.add('prete'); });
  return { arreter() { arret = true; } };
}
