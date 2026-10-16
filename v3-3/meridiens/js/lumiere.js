// Méridiens : la lumière qui circule dans la carte.
// Une toile 2D posée exactement sur le dessin, DANS la même boîte (elle suit le défilement à l'image près).
// Les lignes sont souples comme des herbes : la main qui les traverse les écarte, elles reviennent sur un
// ressort critique (aucune oscillation, aucune vibration) ; un toucher fait naître des impulsions de lumière
// qui partent du point touché ; la zone touchée s'éclaire et se gonfle doucement, une seule fois.
// Ressort critique intégré exactement : x(t + h) et v(t + h) en forme close, stable à toute cadence.
function critique(x, v, w, h) {
  const e = Math.exp(-w * h), c = v + w * x;
  return [(x + c * h) * e, (v - w * c * h) * e];
}

const lerp = (a, b, k) => a + (b - a) * k;
function rgb(hex) { const n = parseInt(String(hex).trim().replace('#', ''), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
function lueur(couleur, dur = false) {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d'), [r, v, b] = rgb(couleur);
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  if (dur) { gr.addColorStop(0, 'rgba(255,252,240,1)'); gr.addColorStop(.18, `rgba(${r},${v},${b},.9)`); gr.addColorStop(.45, `rgba(${r},${v},${b},.22)`); gr.addColorStop(1, `rgba(${r},${v},${b},0)`); }
  else { gr.addColorStop(0, `rgba(${r},${v},${b},.85)`); gr.addColorStop(.3, `rgba(${r},${v},${b},.32)`); gr.addColorStop(1, `rgba(${r},${v},${b},0)`); }
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  return c;
}
function dansPoly(poly, x, y) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c;
  }
  return c;
}

export function creerLumiere(boite, geo, { ample = true, petit = false, svgZones = true, etiquette = true } = {}) {
  const toile = document.createElement('canvas');
  toile.setAttribute('aria-hidden', 'true');
  boite.appendChild(toile);
  boite.classList.add('vivant');
  const g = toile.getContext('2d');
  const nomZone = etiquette ? Object.assign(document.createElement('p'), { className: 'zone-nom' }) : null;
  if (nomZone) { nomZone.setAttribute('aria-live', 'polite'); boite.appendChild(nomZone); }
  const [vx, vy, vw, vh] = geo.vb;
  let W = 0, H = 0, dpr = 1, s = 1, ox = 0, oy = 0;
  let sombre = true, sprite, spriteDur, couleurLigne = [134, 194, 178], couleurOr = [220, 180, 108];

  // lignes : polylignes avec longueurs cumulées, normales, et une corde (déplacement, vitesse) par point
  const lignes = geo.lignes.map((l) => {
    const p = l.pts, n = p.length, cum = [0], nor = [];
    for (let i = 1; i < n; i++) cum.push(cum[i - 1] + Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]));
    for (let i = 0; i < n; i++) { const a = p[Math.max(0, i - 1)], b = p[Math.min(n - 1, i + 1)], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; nor.push([-(b[1] - a[1]) / L, (b[0] - a[0]) / L]); }
    return { ...l, n, cum, len: cum[n - 1], nor, dep: new Float32Array(n), vit: new Float32Array(n), agite: 0, eclat: 0 };
  });
  const parId = Object.fromEntries(lignes.map((l) => [l.id, l]));
  const zones = geo.zones.map((z) => ({ ...z, I: 0, cible: 0, flash: 0, x: 0, v: 0, els: svgZones ? [...boite.querySelectorAll(`.zone[data-zone="${z.cle}"]`)] : [], fixe: 0 }));
  const impulsions = [], ondes = [];
  let survolee = null, montree = null, prochaine = .4, visible = true, energie = 1;

  function couleurs() {
    const cs = getComputedStyle(document.documentElement);
    const or = cs.getPropertyValue('--accent').trim() || '#dcb46c', jade = cs.getPropertyValue('--accent2').trim() || '#86c2b2';
    sombre = document.documentElement.dataset.ton !== 'clair';
    couleurOr = rgb(or); couleurLigne = rgb(sombre ? jade : or);
    sprite = lueur(or); spriteDur = lueur(or, sombre);
  }
  function taille() {
    const r = boite.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, petit ? 2 : 2);
    W = r.width; H = r.height;
    toile.width = Math.max(1, Math.round(W * dpr)); toile.height = Math.max(1, Math.round(H * dpr));
    // même règle que preserveAspectRatio="xMidYMid meet" du SVG
    const svg = boite.querySelector('svg'); const rs = svg ? svg.getBoundingClientRect() : r;
    s = Math.min(rs.width / vw, rs.height / vh);
    ox = (rs.left - r.left) + (rs.width - vw * s) / 2 - vx * s; oy = (rs.top - r.top) + (rs.height - vh * s) / 2 - vy * s;
  }
  const versPx = ([x, y]) => [ox + x * s, oy + y * s];
  const versVb = (px, py) => [(px - ox) / s, (py - oy) / s];

  // point le plus proche d'une ligne
  function proche(l, x, y) {
    let best = 1e9, k = 0;
    for (let i = 0; i < l.n; i += 1) { const p = l.pts[i], d = (p[0] - x) ** 2 + (p[1] - y) ** 2; if (d < best) { best = d; k = i; } }
    return { k, d: Math.sqrt(best) };
  }
  function zoneEn(x, y) {
    let meilleure = null, dist = 1e9;
    for (const z of zones) {
      if (z.polys.length) { for (const p of z.polys) if (dansPoly(p, x, y)) { const dd = Math.hypot(z.ancre[0] - x, z.ancre[1] - y) * .5; if (dd < dist) { dist = dd; meilleure = z; } } }
      else if (z.lignes) for (const id of z.lignes) { const l = parId[id]; if (!l) continue; const { d } = proche(l, x, y); if (d < 16 && d < dist) { dist = d; meilleure = z; } }
    }
    return meilleure;
  }
  function lancer(l, k, sens, force = 1, vitesse = 150) {
    impulsions.push({ l, s: l.cum[k], sens, v: vitesse * (ample ? 1 : .8) * (.85 + Math.random() * .3), vie: 0, force, queue: 26 + 30 * force });
    if (impulsions.length > 90) impulsions.shift();
  }
  // écarter une ligne : une bosse en cloche qui atteint environ « amp » (unités du dessin) puis revient
  const W_LIGNE = 11;
  function pincer(l, k, amp, largeur = 4) {
    const v0 = amp * W_LIGNE * Math.E;
    for (let i = Math.max(1, k - largeur * 3); i < Math.min(l.n - 1, k + largeur * 3); i++) {
      const g = Math.exp(-((i - k) ** 2) / (2 * largeur * largeur));
      // sans cumuler à l'infini : la vitesse reste bornée, la bosse ne dépasse jamais ~1,5 fois amp
      l.vit[i] = Math.max(-Math.abs(v0) * 1.5, Math.min(Math.abs(v0) * 1.5, l.vit[i] + v0 * g));
    }
    l.agite = 1; energie = 1;
  }
  function eveillerZone(z, fort = 1) {
    z.flash = Math.max(z.flash, fort); z.v = Math.min(z.v + 13 * fort, 16); energie = 1;
  }
  function montrer(z) {
    if (!nomZone) return;
    if (z === montree) return;
    montree = z;
    if (!z) { nomZone.classList.remove('vu'); return; }
    nomZone.textContent = z.nom;
    const [px, py] = versPx(z.ancre);
    nomZone.style.left = px + 'px'; nomZone.style.top = py + 'px';
    nomZone.classList.add('vu');
  }

  // le toucher (doigt ou clic) : la zone s'éveille, la lumière part du point touché
  function toucher(px, py) {
    const [x, y] = versVb(px, py);
    const z = zoneEn(x, y);
    if (z) { eveillerZone(z, 1); montrer(z); }
    ondes.push({ x, y, r: 0, vie: 0 });
    for (const l of lignes) {
      const { k, d } = proche(l, x, y);
      const portee = z ? 90 : 60;
      if (d < portee) {
        const f = 1 - d / portee;
        lancer(l, k, 1, .4 + f, 140 + 80 * f); lancer(l, k, -1, .4 + f, 140 + 80 * f);
        // la ligne s'écarte du doigt (du côté opposé au point touché)
        if (d < 26) { const p = l.pts[k], sens = Math.sign((p[0] - x) * l.nor[k][0] + (p[1] - y) * l.nor[k][1]) || 1; pincer(l, k, sens * (3 + 5 * (1 - d / 26)), 3); }
      }
    }
    energie = 1;
  }
  // le geste qui passe (souris ou doigt qui glisse) : les lignes traversées s'écartent puis reviennent, la zone survolée s'allume
  let dernier = null;
  function survol(px, py) {
    const [x, y] = versVb(px, py);
    const z = zoneEn(x, y);
    if (z !== survolee) { if (survolee) survolee.cible = survolee.fixe; survolee = z; if (z) { z.cible = Math.max(.55, z.fixe); eveillerZone(z, .35); } montrer(z || zones.find((zz) => zz.fixe > .5) || null); }
    if (dernier) {
      const dx = x - dernier[0], dy = y - dernier[1], vit = Math.hypot(dx, dy);
      if (vit > .8) for (const l of lignes) {
        const { k, d } = proche(l, x, y);
        if (d < 7) { const nx = l.nor[k][0], ny = l.nor[k][1]; const sens = Math.sign(dx * nx + dy * ny) || 1; pincer(l, k, sens * Math.min(6, 1.5 + vit * .45), 3.2); if (Math.random() < .35) lancer(l, k, Math.random() < .5 ? 1 : -1, .45, 120); }
      }
    }
    dernier = [x, y];
  }
  function quitter() { dernier = null; if (survolee) survolee.cible = survolee.fixe; survolee = null; montrer(zones.find((z) => z.fixe > .5) || null); }

  // zone mise en avant de l'extérieur (les annotations de la séance)
  function activer(cle) {
    for (const z of zones) { const on = z.cle === cle; z.fixe = on ? .8 : 0; z.cible = Math.max(z.fixe, z === survolee ? .55 : 0); if (on) { eveillerZone(z, .8); for (const l of lignes) { const { k, d } = proche(l, ...z.ancre); if (d < 50) { lancer(l, k, 1, .9, 150); lancer(l, k, -1, .9, 150); } } } }
    montrer(zones.find((z) => z.cle === cle) || null);
  }
  // premier souffle : une vague de lumière du haut vers le bas de la carte
  function souffle() {
    for (const l of lignes) if (!l.trans) { lancer(l, 0, 1, 1.1, ample ? 170 : 130); }
    const ys = zones.map((z) => z.ancre[1]), y0 = Math.min(...ys), y1 = Math.max(...ys);
    zones.forEach((z) => setTimeout(() => eveillerZone(z, .55), (z.ancre[1] - y0) / Math.max(1, y1 - y0) * (ample ? 1500 : 1900)));
  }

  function pas(dt, t) {
    // ambiance : une impulsion de temps en temps sur une ligne au hasard
    prochaine -= dt;
    if (prochaine <= 0) {
      const longues = lignes.filter((l) => !l.trans);
      const l = (longues.length ? longues : lignes)[Math.floor(Math.random() * (longues.length || lignes.length))];
      if (l) { const sens = l.ferme ? 1 : Math.random() < .7 ? 1 : -1; lancer(l, sens > 0 ? 0 : l.n - 1, sens, .7, ample ? 120 : 85); }
      prochaine = ample ? .55 + Math.random() * .7 : 1.1 + Math.random() * 1.1;
    }
    for (let i = impulsions.length - 1; i >= 0; i--) {
      const p = impulsions[i]; p.s += p.sens * p.v * dt; p.vie += dt;
      if (p.l.ferme) p.s = ((p.s % p.l.len) + p.l.len) % p.l.len;
      if (p.vie > 9 || (!p.l.ferme && (p.s > p.l.len + p.queue || p.s < -p.queue))) impulsions.splice(i, 1);
    }
    for (const o of ondes) { o.vie += dt; o.r += dt * (ample ? 120 : 95); }
    while (ondes.length && ondes[0].vie > 1.6) ondes.shift();
    // zones : intensité (ressort vers la cible) et gonflement (ressort critique : une seule respiration, sans rebond)
    for (const z of zones) {
      z.flash *= Math.exp(-dt * 1.5);
      const cible = Math.max(z.cible, z.flash);
      z.I += (cible - z.I) * Math.min(1, dt * 7);
      [z.x, z.v] = critique(z.x, z.v, 9, dt);
    }
    // lignes : chaque point revient à sa place sur un ressort critique, les extrémités restent tenues
    for (const l of lignes) {
      if (!l.agite) continue;
      let e = 0;
      for (let i = 1; i < l.n - 1; i++) {
        const [x, v] = critique(l.dep[i], l.vit[i], W_LIGNE, dt);
        l.dep[i] = x; l.vit[i] = v; e += Math.abs(x) + Math.abs(v) * .02;
      }
      if (e < .02) { l.agite = 0; l.dep.fill(0); l.vit.fill(0); }
    }
  }

  function chemin(l) {
    g.beginPath();
    for (let i = 0; i < l.n; i++) {
      const p = l.pts[i], d = l.dep[i];
      const x = ox + (p[0] + l.nor[i][0] * d) * s, y = oy + (p[1] + l.nor[i][1] * d) * s;
      i ? g.lineTo(x, y) : g.moveTo(x, y);
    }
    if (l.ferme) g.closePath();
  }
  function position(l, sd) {
    if (sd <= 0) return [l.pts[0], 0]; if (sd >= l.len) return [l.pts[l.n - 1], l.n - 1];
    let a = 0, b = l.n - 1;
    while (b - a > 1) { const m = (a + b) >> 1; if (l.cum[m] < sd) a = m; else b = m; }
    const k = (sd - l.cum[a]) / ((l.cum[b] - l.cum[a]) || 1), d = lerp(l.dep[a], l.dep[b], k);
    const p = [lerp(l.pts[a][0], l.pts[b][0], k) + l.nor[a][0] * d, lerp(l.pts[a][1], l.pts[b][1], k) + l.nor[a][1] * d];
    return [p, a];
  }

  function dessiner() {
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, W, H);
    // zones : halo à l'ancre ; dans le SVG, remplissage et gonflement
    for (const z of zones) {
      const sc = 1 + .055 * z.x;
      for (const el of z.els) { el.style.fillOpacity = (z.I * (sombre ? .26 : .2)).toFixed(3); el.style.strokeOpacity = (.16 + z.I * .6).toFixed(3); el.style.transform = Math.abs(z.x) > .002 ? `scale(${sc.toFixed(4)})` : ''; }
      if (z.I > .01) {
        const [px, py] = versPx(z.ancre), r = (z.polys.length ? 70 : 46) * s * (1 + .08 * z.x);
        g.globalCompositeOperation = sombre ? 'lighter' : 'source-over';
        g.globalAlpha = Math.min(1, z.I * (sombre ? .55 : .35));
        g.drawImage(sprite, px - r, py - r, r * 2, r * 2);
        if (!z.els.length && z.polys.length) {
          g.globalAlpha = z.I * (sombre ? .22 : .16); g.fillStyle = `rgb(${couleurOr})`;
          for (const poly of z.polys) { g.beginPath(); poly.forEach((p, i) => { const q = versPx(p); i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]); }); g.closePath(); g.fill(); }
        }
        if (z.lignes) for (const id of z.lignes) { const l = parId[id]; if (!l) continue; g.globalAlpha = z.I * .8; g.strokeStyle = `rgb(${couleurOr})`; g.lineWidth = 2.2; chemin(l); g.stroke(); }
      }
    }
    // les lignes elles-mêmes, très fines
    g.globalCompositeOperation = 'source-over';
    g.lineWidth = petit ? .9 : 1; g.lineJoin = 'round'; g.lineCap = 'round';
    for (const l of lignes) {
      g.globalAlpha = (l.trans ? .2 : .36) + Math.min(.4, l.agite ? .25 : 0);
      g.strokeStyle = `rgb(${couleurLigne})`;
      if (l.trans) g.setLineDash([2, 4]); else g.setLineDash([]);
      chemin(l); g.stroke();
    }
    g.setLineDash([]);
    // ondes là où l'on a touché
    for (const o of ondes) {
      const [px, py] = versPx([o.x, o.y]);
      g.globalAlpha = Math.max(0, .6 * (1 - o.vie / 1.6)); g.strokeStyle = `rgb(${couleurOr})`; g.lineWidth = 1;
      g.beginPath(); g.arc(px, py, o.r * s, 0, Math.PI * 2); g.stroke();
      if (o.r > 18) { g.globalAlpha *= .5; g.beginPath(); g.arc(px, py, (o.r - 18) * s, 0, Math.PI * 2); g.stroke(); }
    }
    // impulsions : une tête brillante et sa traîne
    g.globalCompositeOperation = sombre ? 'lighter' : 'source-over';
    for (const p of impulsions) {
      const fondu = Math.min(1, p.vie * 3) * (p.vie > 7 ? Math.max(0, (9 - p.vie) / 2) : 1);
      for (let k = 9; k >= 0; k--) {
        const sd = p.s - p.sens * k * p.queue / 9;
        if (!p.l.ferme && (sd < 0 || sd > p.l.len)) continue;
        const [q] = position(p.l, p.l.ferme ? ((sd % p.l.len) + p.l.len) % p.l.len : sd);
        const [px, py] = versPx(q);
        const f = 1 - k / 10, r = (k ? 7 : 11) * Math.max(.7, s) * (.55 + .45 * p.force) * (k ? f : 1);
        g.globalAlpha = fondu * (k ? .5 * f * f : 1) * Math.min(1, p.force) * (sombre ? 1 : .8);
        g.drawImage(k ? sprite : spriteDur, px - r, py - r, r * 2, r * 2);
      }
    }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  }

  let precedent = 0;
  function image(m) {
    const dt = precedent ? Math.min(.05, (m - precedent) / 1000) : .016; precedent = m;
    if (!visible) return;
    pas(dt, m / 1000);
    dessiner();
  }

  // les gestes, à la souris comme au doigt
  toile.addEventListener('pointermove', (e) => { const r = boite.getBoundingClientRect(); survol(e.clientX - r.left, e.clientY - r.top); }, { passive: true });
  toile.addEventListener('pointerdown', (e) => { const r = boite.getBoundingClientRect(); dernier = null; toucher(e.clientX - r.left, e.clientY - r.top); }, { passive: true });
  toile.addEventListener('pointerleave', quitter, { passive: true });
  toile.addEventListener('pointercancel', quitter, { passive: true });

  couleurs(); taille();
  return {
    image, taille, couleurs, toucher, souffle, activer, toile,
    set visible(v) { visible = v; if (!v) precedent = 0; },
    get visible() { return visible; },
    versPx, zones,
    pointsLigne: (id) => parId[id]?.pts || [],
  };
}
