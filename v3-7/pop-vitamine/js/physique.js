// Pop vitaminé : la physique des objets, en 2D écran, commune aux objets 3D et aux images (mode « sprites »).
// On attrape un objet, on le lance : il file, rebondit sur les bords et sur les autres, tourne, puis revient
// flotter à sa place (affiche) ou retombe au sol (boîte à jouets). Un toucher le fait sauter.
// Souris et doigt font exactement la même chose. Rien ne suit le pointeur tant qu'on n'a rien attrapé.

// Chaque objet est une ellipse (demi-largeur wx, demi-hauteur wy), inclinée comme l'objet dessiné : un bouquet de
// lavande haut et fin ne repousse plus ses voisins à un rayon de distance (ce que faisaient des cercles).
const angle = (c) => (c.poseZ || 0) + c.a * 0.55;
export function rayonVers(c, nx, ny) {
  const wx = c.wx || c.r, wy = c.wy || c.r, th = angle(c), co = Math.cos(th), si = Math.sin(th);
  const lx = nx * co + ny * si, ly = -nx * si + ny * co;
  return (wx * wy) / Math.max(1e-6, Math.hypot(wy * lx, wx * ly));
}
// demi-étendue horizontale et verticale de l'ellipse inclinée (bords et sol)
const etendue = (c) => { const wx = c.wx || c.r, wy = c.wy || c.r, th = angle(c), co = Math.cos(th), si = Math.sin(th); return [Math.hypot(wx * co, wy * si), Math.hypot(wx * si, wy * co)]; };

export class Monde {
  constructor({ gravite = 0, reduit = false } = {}) {
    this.corps = []; this.g = gravite; this.reduit = reduit;
    this.L = 1; this.H = 1; this.sol = null; this.t = 0;
  }
  ajouter(c) {
    const corps = { x: c.hx, y: c.hy, vx: 0, vy: 0, a: 0, va: 0, spin: 0, vspin: 0, r: 40, k: 11, phase: Math.random() * 6, libre: 0, dort: false, tenu: false, presse: 1, ...c };
    this.corps.push(corps);
    return corps;
  }
  bornes(L, H, sol = null) { this.L = L; this.H = H; this.sol = sol; }

  trouver(x, y) {
    let meilleur = null, dmin = Infinity;
    for (const c of this.corps) {
      if (c.cache) continue;
      const dx = x - c.x, dy = y - c.y, d = Math.hypot(dx, dy);
      // dans l'ellipse (un peu agrandie pour le doigt), la plus proche gagne
      const lim = d < 1e-3 ? 1 : rayonVers(c, dx / d, dy / d) * 1.12 + 10;
      if (d < lim && d / lim < dmin) { dmin = d / lim; meilleur = c; }
    }
    return meilleur;
  }

  pas(dt) {
    const n = Math.max(1, Math.ceil(dt / (1 / 120)));
    const h = dt / n;
    let bouge = false;
    for (let s = 0; s < n; s++) bouge = this.sousPas(h) || bouge;
    return bouge;
  }

  sousPas(dt) {
    this.t += dt;
    const t = this.t, amp = this.reduit ? 3 : 8;
    let bouge = false;
    for (const c of this.corps) {
      if (c.cache) continue;
      if (c.tenu) {
        // tenu : il suit le doigt avec un ressort raide (pas de saccade), et s'incline dans le sens du geste
        const k = 900, z = 2 * Math.sqrt(k);
        c.vx += (k * (c.cx - c.x) - z * c.vx) * dt; c.vy += (k * (c.cy - c.y) - z * c.vy) * dt;
        c.x += c.vx * dt; c.y += c.vy * dt;
        bouge = true;
      } else if (this.g) {
        if (c.dort) continue;
        c.vy += this.g * dt;
        const air = Math.exp(-0.35 * dt); c.vx *= air; c.vy *= air;
        c.x += c.vx * dt; c.y += c.vy * dt;
        bouge = true;
      } else {
        // flottant : ressort vers sa place (sauf juste après un lancer), petite houle autour
        const cx = c.hx + Math.cos(t * 0.6 + c.phase) * amp * 0.6, cy = c.hy + Math.sin(t * 0.8 + c.phase) * amp;
        const libre = Math.max(0, Math.min(1, (t - c.libre) / 0.7));
        const k = c.k * libre, z = 2 * Math.sqrt(Math.max(k, 0.0001)) * 0.62;
        c.vx += (k * (cx - c.x) - z * c.vx) * dt; c.vy += (k * (cy - c.y) - z * c.vy) * dt;
        const air = Math.exp(-(libre < 1 ? 0.6 : 0) * dt); c.vx *= air; c.vy *= air;
        c.x += c.vx * dt; c.y += c.vy * dt;
        bouge = bouge || Math.abs(c.vx) + Math.abs(c.vy) > 2 || libre < 1;
      }
    }
    // chocs entre objets
    for (let i = 0; i < this.corps.length; i++) for (let j = i + 1; j < this.corps.length; j++) {
      const a = this.corps[i], b = this.corps[j];
      if (a.cache || b.cache) continue;
      const dx = b.x - a.x, dy = b.y - a.y, dist = Math.hypot(dx, dy) || 0.01;
      if (dist >= a.r + b.r) continue;
      const min = (rayonVers(a, dx / dist, dy / dist) + rayonVers(b, -dx / dist, -dy / dist)) * 0.94;
      if (dist >= min) continue;
      const nx = dx / dist, ny = dy / dist, chevauche = min - dist;
      const wa = a.tenu ? 0 : b.tenu ? 1 : 0.5, wb = 1 - wa;
      if (!a.tenu) { a.x -= nx * chevauche * wa; a.y -= ny * chevauche * wa; }
      if (!b.tenu) { b.x += nx * chevauche * wb; b.y += ny * chevauche * wb; }
      const vn = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
      if (vn < 0) {
        const e = 0.72, j = -(1 + e) * vn / 2;
        if (!a.tenu) { a.vx -= j * nx; a.vy -= j * ny; }
        if (!b.tenu) { b.vx += j * nx; b.vy += j * ny; }
        const vt = (b.vx - a.vx) * -ny + (b.vy - a.vy) * nx;
        a.va -= vt * 0.004; b.va += vt * 0.004; a.vspin += vt * 0.01; b.vspin -= vt * 0.01;
        if (Math.abs(vn) > 30) { a.dort = false; b.dort = false; }
      }
    }
    // bords et sol
    for (const c of this.corps) {
      if (c.cache || c.tenu) continue;
      const e = this.g ? 0.42 : 0.68;
      const [ex, ey] = etendue(c);
      const bas = (this.sol ?? this.H) - ey;
      if (c.x < ex) { c.x = ex; if (c.vx < 0) { c.vx = -c.vx * e; c.va += c.vy * 0.002; } }
      if (c.x > this.L - ex) { c.x = this.L - ex; if (c.vx > 0) { c.vx = -c.vx * e; c.va -= c.vy * 0.002; } }
      if (!this.g && c.y < ey) { c.y = ey; if (c.vy < 0) c.vy = -c.vy * e; }
      if (c.y > bas) {
        c.y = bas;
        if (c.vy > 0) { c.vy = -c.vy * e; if (Math.abs(c.vy) < 40) c.vy = 0; }
        if (this.g) { c.vx *= Math.exp(-6 * (1 / 120)); c.va += (c.vx / Math.max(c.r, 1) - c.va) * 0.08; }
      }
      // sommeil (boîte à jouets) : immobile au sol depuis un moment
      if (this.g) {
        const auSol = c.y >= bas - 0.5;
        c.auSol = auSol;
        if (auSol && Math.hypot(c.vx, c.vy) < 14 && Math.abs(c.va) < 0.3) { c.calme = (c.calme || 0) + 1 / 120; if (c.calme > 0.45) { c.dort = true; c.vx = c.vy = 0; } }
        else c.calme = 0;
      }
    }
    // rotations : l'objet tourne quand on le lance, puis revient montrer sa face (et son étiquette)
    for (const c of this.corps) {
      if (c.cache) continue;
      c.va *= Math.exp(-1.6 * dt); c.a += c.va * dt;
      if (!this.g) c.va += (-c.a * 3.2 - c.va * 1.2) * dt;               // revient presque droit
      else if (c.auSol && !c.tenu) c.va += (-Math.sin(c.a * 0.55) * 26 - c.va * 3.4) * dt; // au sol : se redresse comme un culbuto
      c.vspin *= Math.exp(-1.1 * dt);
      const face = Math.round(c.spin / (Math.PI * 2)) * Math.PI * 2 + Math.sin(this.t * 0.45 + c.phase) * (this.reduit ? 0.18 : 0.32);
      if (Math.abs(c.vspin) < 2.5) c.vspin += ((face - c.spin) * 4 - c.vspin * 1.6) * dt;
      c.spin += c.vspin * dt;
      c.presse += ((c.tenu ? 1.07 : 1) - c.presse) * Math.min(1, dt * 14);
      if (Math.abs(c.va) > 0.02 || Math.abs(c.vspin) > 0.05) bouge = true;
    }
    return bouge;
  }
}

// Le geste : souris (événements de pointeur) et doigt (événements tactiles, pour ne bloquer le défilement
// QUE quand on touche un objet). Coordonnées locales à la scène.
export function brancherGestes(scene, monde, { reveil = () => {}, quandTouche = () => {} } = {}) {
  let tenu = null, echantillons = [], depart = null;
  const local = (x, y) => { const r = scene.getBoundingClientRect(); return [x - r.left, y - r.top]; };
  const commencer = (x, y) => {
    const [lx, ly] = local(x, y);
    const c = monde.trouver(lx, ly);
    if (!c) return false;
    tenu = c; c.tenu = true; c.dort = false; c.cx = lx; c.cy = ly; c.vx = 0; c.vy = 0;
    depart = { x: lx, y: ly, t: performance.now() };
    echantillons = [{ x: lx, y: ly, t: performance.now() }];
    quandTouche(c); reveil();
    return true;
  };
  const deplacer = (x, y) => {
    if (!tenu) return;
    const [lx, ly] = local(x, y);
    tenu.cx = lx; tenu.cy = ly;
    const now = performance.now();
    echantillons.push({ x: lx, y: ly, t: now });
    while (echantillons.length > 2 && now - echantillons[0].t > 90) echantillons.shift();
    reveil();
  };
  const lacher = () => {
    if (!tenu) return;
    const c = tenu; tenu = null; c.tenu = false;
    const e0 = echantillons[0], e1 = echantillons[echantillons.length - 1];
    const dt = Math.max(16, e1.t - e0.t) / 1000;
    let vx = (e1.x - e0.x) / dt, vy = (e1.y - e0.y) / dt;
    const v = Math.hypot(vx, vy), max = 2800;
    if (v > max) { vx *= max / v; vy *= max / v; }
    const court = performance.now() - depart.t < 260 && Math.hypot(e1.x - depart.x, e1.y - depart.y) < 10;
    if (court) {
      // un simple toucher : l'objet saute et tourne
      c.vy = -(monde.g ? 780 : 620) * Math.min(1.3, Math.max(0.7, c.r / 70)); c.vx = (Math.random() - 0.5) * 120;
      c.vspin += (Math.random() < 0.5 ? -1 : 1) * 11; c.va += (Math.random() - 0.5) * 3;
    } else {
      c.vx = vx; c.vy = vy;
      c.vspin += vx * 0.012; c.va += vx * 0.0016;
    }
    c.libre = monde.t + (court ? 0.25 : 1.15);
    reveil();
  };
  scene.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'touch') return;
    if (e.button > 0 || e.target.closest('a, button')) return;
    if (commencer(e.clientX, e.clientY)) { e.preventDefault(); try { scene.setPointerCapture(e.pointerId); } catch { /* rien */ } }
  });
  scene.addEventListener('pointermove', (e) => { if (e.pointerType !== 'touch' && tenu) deplacer(e.clientX, e.clientY); });
  scene.addEventListener('pointerup', (e) => { if (e.pointerType !== 'touch') lacher(); });
  scene.addEventListener('pointercancel', (e) => { if (e.pointerType !== 'touch') lacher(); });
  let doigt = null;
  scene.addEventListener('touchstart', (e) => {
    if (tenu || e.target.closest('a, button')) return;
    const t = e.changedTouches[0];
    if (commencer(t.clientX, t.clientY)) { doigt = t.identifier; e.preventDefault(); }
  }, { passive: false });
  scene.addEventListener('touchmove', (e) => {
    if (doigt == null) return;
    for (const t of e.changedTouches) if (t.identifier === doigt) { deplacer(t.clientX, t.clientY); e.preventDefault(); }
  }, { passive: false });
  const fin = (e) => { if (doigt == null) return; for (const t of e.changedTouches) if (t.identifier === doigt) { doigt = null; lacher(); } };
  scene.addEventListener('touchend', fin); scene.addEventListener('touchcancel', fin);
  // le curseur dit qu'on peut attraper (pas de curseur maison)
  scene.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || tenu) return;
    const [lx, ly] = local(e.clientX, e.clientY);
    scene.style.cursor = monde.trouver(lx, ly) ? 'grab' : '';
  });
}
