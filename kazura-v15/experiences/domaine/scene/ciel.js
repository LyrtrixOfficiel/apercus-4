// Le domaine Kazura : le ciel vivant.
// Dégradé, soleil, nuages dessinés au bruit (éclairés du côté du soleil, liserés d'argent),
// la nuit : étoiles qui scintillent, grandes étoiles à halos peints, lune, et les volutes de lumière
// façon « Nuit étoilée » (lignes de courant de tourbillons qui dérivent lentement).

import { GLSL_BRUIT } from './commun.js';

export function creerCiel(THREE, U, { mobile }) {
  const u = {
    uTemps: U.uTemps, uSoleil: U.uSoleil, uLune: { value: new THREE.Vector3(0, 0.5, -0.8) },
    uHaut: { value: new THREE.Color() }, uBas: { value: new THREE.Color() }, uHalo: { value: new THREE.Color() },
    uNuages: { value: 0.5 }, uNuageClair: { value: new THREE.Color() }, uNuageOmbre: { value: new THREE.Color() },
    uEtoiles: { value: 0 }, uVolutes: { value: 0 }, uNuitC: { value: 0 },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms: u,
    depthWrite: false,
    side: THREE.BackSide,
    defines: { OCT: mobile ? 3 : 5 },
    vertexShader: /* glsl */`
      varying vec3 vDir;
      void main() {
        vDir = position;
        vec4 p = projectionMatrix * mat4(mat3(viewMatrix)) * vec4(position, 1.0);
        gl_Position = p.xyww;
      }`,
    fragmentShader: /* glsl */`
      uniform float uTemps; uniform vec3 uSoleil; uniform vec3 uLune;
      uniform vec3 uHaut; uniform vec3 uBas; uniform vec3 uHalo;
      uniform float uNuages; uniform vec3 uNuageClair; uniform vec3 uNuageOmbre;
      uniform float uEtoiles; uniform float uVolutes; uniform float uNuitC;
      varying vec3 vDir;
      ${GLSL_BRUIT}
      float fbmN(vec2 p) { float a = 0.5, s = 0.0; for (int i = 0; i < OCT; i++) { s += a * bruit(p); p = p * 2.07 + vec2(17.1, 9.2); a *= 0.5; } return s; }
      vec3 teinteVolute(float i) {
        float r = h11(i);
        if (r < 0.3) return vec3(1.0, 0.78, 0.36);
        if (r < 0.55) return vec3(0.55, 0.75, 1.0);
        if (r < 0.75) return vec3(0.42, 0.95, 0.95);
        if (r < 0.88) return vec3(0.78, 0.62, 1.0);
        return vec3(0.95, 0.95, 1.0);
      }
      void main() {
        vec3 d = normalize(vDir);
        float el = d.y;
        float elc = max(el, 0.0);
        vec3 c = mix(uBas, uHaut, pow(smoothstep(-0.03, 0.8, el), 0.6));
        c = mix(c, uBas * 0.8, smoothstep(0.0, -0.12, el));
        float s = max(dot(d, uSoleil), 0.0);
        float jour = smoothstep(-0.08, 0.04, uSoleil.y);
        c += uHalo * (pow(s, 9.0) * 0.4 + pow(s, 48.0) * 0.8 + pow(s, 400.0) * 2.0);
        c += vec3(1.0, 0.9, 0.72) * smoothstep(0.99962, 0.99978, s) * 28.0 * jour;

        // la lune et son halo peint
        float l = max(dot(d, uLune), 0.0);
        float lune = smoothstep(0.99955, 0.99968, l);
        vec2 lp = (d - uLune * l).xy * 60.0;
        float cratere = 0.8 + 0.2 * fbm3(lp * 3.0);
        float halo = pow(l, 900.0) * 0.6 + pow(l, 90.0) * 0.18;
        float anneauxLune = (0.5 + 0.5 * sin(acos(min(l, 1.0)) * 260.0 - uTemps * 0.8)) * pow(l, 160.0) * 0.25 * smoothstep(0.9996, 0.999, l);
        c += (vec3(1.0, 0.96, 0.82) * lune * 6.0 * cratere + vec3(0.75, 0.82, 1.0) * halo + vec3(1.0, 0.85, 0.5) * anneauxLune * uVolutes) * uNuitC;

        // les étoiles
        float nuageA = 0.0;
        vec2 sp = vec2(atan(d.x, -d.z), asin(clamp(d.y, -1.0, 1.0)));

        // les nuages
        if (el > -0.03) {
          vec2 p = d.xz / (elc + 0.09) * 0.75 + vec2(uTemps * 0.0045, uTemps * 0.0015);
          vec2 q = p + vec2(fbmN(p * 0.55 + 3.1), fbmN(p * 0.55 + 7.7)) * 1.3;
          float dens = fbmN(q * 0.85);
          float seuil = 1.0 - uNuages;
          float couv = smoothstep(seuil - 0.06, seuil + 0.22, dens);
          vec2 sd = normalize(uSoleil.xz + 1e-4) * 0.22;
          float dens2 = fbmN((q + sd) * 0.85);
          float clair = clamp(0.55 + (dens - dens2) * 3.2, 0.0, 1.0);
          vec3 nc = mix(uNuageOmbre, uNuageClair, clair);
          float bord = 1.0 - smoothstep(seuil, seuil + 0.16, dens);
          nc += uHalo * (pow(s, 3.0) * 1.2 + bord * pow(s, 12.0) * 3.0);
          nc += vec3(0.6, 0.68, 1.0) * pow(l, 40.0) * bord * 0.8 * uNuitC;
          nuageA = couv * smoothstep(-0.01, 0.14, el) * 0.96;
          c = mix(c, nc, nuageA);
        }

        if (uEtoiles > 0.01 && el > -0.02) {
          vec2 g = sp * vec2(160.0, 160.0);
          vec2 id = floor(g); vec2 f = fract(g) - 0.5;
          float r = h21(id);
          vec2 off = vec2(h21(id + 3.1), h21(id + 7.3)) - 0.5;
          float dd = length(f - off * 0.7);
          float tw = 0.55 + 0.45 * sin(uTemps * (1.3 + r * 3.0) + r * 40.0);
          float st = smoothstep(0.16, 0.0, dd) * step(0.86, r) * tw * (r - 0.84) * 14.0;
          float vis = uEtoiles * (1.0 - nuageA) * smoothstep(0.0, 0.1, el);
          c += vec3(0.88, 0.92, 1.0) * st * vis;
          // grandes étoiles à halos et anneaux, peintes
          vec2 g2 = sp * 7.0; vec2 id2 = floor(g2); vec2 f2 = fract(g2) - 0.5; float r2 = h21(id2 + 11.0);
          if (r2 > 0.88 && sp.y > 0.12) {
            vec2 o2 = (vec2(h21(id2 + 1.7), h21(id2 + 5.3)) - 0.5) * 0.5;
            float d2 = length(f2 - o2);
            float coeur = exp(-d2 * 55.0) * 1.3;
            float hal = exp(-d2 * 30.0) * 0.32;
            float an = (0.5 + 0.5 * sin(d2 * 90.0 - uTemps * 1.4 + r2 * 20.0)) * exp(-d2 * 26.0) * smoothstep(0.015, 0.05, d2) * 0.16;
            vec3 tc = mix(vec3(1.0, 0.82, 0.42), vec3(0.8, 0.9, 1.0), step(0.92, r2));
            c += tc * (coeur + hal + an * uVolutes) * vis * smoothstep(0.24, 0.16, d2);
          }
        }

        // les volutes de lumière : lignes de courant de trois tourbillons, peintes en traits qui tournent
        if (uVolutes > 0.01 && el > 0.0) {
          vec2 q = sp;
          vec2 c1 = vec2(-0.16 + 0.03 * sin(uTemps * 0.05), 0.55);
          vec2 c2 = vec2(0.62, 0.46 + 0.02 * sin(uTemps * 0.04));
          vec2 c3 = vec2(-1.0, 0.38);
          float g1 = exp(-dot(q - c1, q - c1) / 0.035);
          float g2 = exp(-dot(q - c2, q - c2) / 0.022);
          float g3 = exp(-dot(q - c3, q - c3) / 0.026);
          float psi = q.y * 1.7 + 0.95 * g1 + 0.7 * g2 + 0.6 * g3;
          psi += (fbm3(q * 3.5 + vec2(uTemps * 0.01, 0.0)) - 0.5) * 0.16;
          vec2 cn = c1; float wn = g1;
          if (g2 > wn) { wn = g2; cn = c2; }
          if (g3 > wn) { wn = g3; cn = c3; }
          float k = psi * 15.0;
          float idx = floor(k);
          float fw = fwidth(k);
          float larg = mix(0.05, 0.15, h11(idx * 1.7));
          float ligne = 1.0 - smoothstep(larg - fw, larg + fw * 1.5, abs(fract(k) - 0.5));
          float ang = atan(q.y - cn.y, q.x - cn.x) / 6.2832;
          float le = mix(q.x * 1.3, ang, smoothstep(0.05, 0.35, wn));
          float nd = 2.0 + floor(h11(idx * 3.1) * 4.0);
          float ph = fract(le * nd + h11(idx) - uTemps * 0.025 * (0.5 + h11(idx * 5.3)));
          float trait = smoothstep(0.0, 0.06, ph) * (1.0 - smoothstep(0.5, 0.72, ph));
          float tete = mix(1.0, 0.25, smoothstep(0.0, 0.7, ph));
          vec2 dc = q - cn;
          float oeil = 1.0 - exp(-dot(dc, dc) / 0.0035);
          float fx = oeil * uVolutes * ligne * trait * tete * (0.04 + 1.1 * wn) * smoothstep(0.06, 0.3, el) * (1.0 - nuageA * 0.7);
          c += teinteVolute(idx) * fx * 0.75;
          c += vec3(0.08, 0.2, 0.55) * uVolutes * wn * 0.14 * (0.6 + 0.4 * sin(k * 0.7));
          c += vec3(0.75, 0.82, 1.0) * uVolutes * (1.0 - oeil) * wn * 0.35;
        }
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  const geo = new THREE.SphereGeometry(1, mobile ? 32 : 48, mobile ? 16 : 24);
  const ciel = new THREE.Mesh(geo, mat);
  ciel.frustumCulled = false;
  ciel.renderOrder = -10;

  function regler(P, U) {
    u.uHaut.value.copy(P.cielHaut);
    u.uBas.value.copy(P.cielBas);
    u.uHalo.value.copy(P.cielSoleil);
    u.uNuages.value = P.nuages;
    u.uNuageClair.value.copy(P.nuageClair);
    u.uNuageOmbre.value.copy(P.nuageOmbre);
    u.uEtoiles.value = P.etoiles;
    u.uVolutes.value = P.volutes;
    u.uNuitC.value = U.uNuit.value;
  }
  return { objet: ciel, regler, uniformes: u };
}
