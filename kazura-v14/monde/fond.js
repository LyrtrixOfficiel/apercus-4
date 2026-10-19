/* Kazura v14, la Scène : le fond, peint par un seul triangle plein écran.
   Trois mondes, choisis par pixel :
   - la salle de dalles (sombre) : un cylindre de grands carreaux noirs légèrement brillants, à joints
     fins, une grille fine, et la typographie géante projetée dessus, tramée de points de lumière
     comme un mur d'écrans. v14 : certains carreaux sont de vrais écrans qui s'allument (lignes de
     trame, tranches de profondeur façon AFTERDEPTH, glyphes, sceau tracé, égaliseur) ; un arc de
     lumière (réf. ZYNO) passe derrière le mot géant ; des rayons tombent d'en haut ; un sol de pierre
     sombre et polie reflète la paroi, l'arc et la lueur du sceau ;
   - le monde clair (v14) : un studio de porcelaine (paroi et sol qui se raccordent en courbe douce),
     des caustiques irisées qui glissent, de grandes taches de lumière colorée, la grille fine et les
     croix d'ALCHE ;
   - la nuit indigo peinte (la partie « qui fait votre site ») : des courants de pinceau qui tournent en
     volutes autour de l'empreinte du hanko, à la Van Gogh, et de petites étoiles.
   Les valeurs sont pensées avant le rendu filmique (ACES) : 1,0 donne un gris très clair. */
import { GLSL_MASQUE, GLSL_SALLE, GLSL_TEXBRUIT, GLSL_RAMPE, GLSL_IRIS } from './glsl.js';

export function creerFond(THREE, U, { mobile }) {
  const u = {
    ...U,
    uInvProj: { value: new THREE.Matrix4() },
    uCamMonde: { value: new THREE.Matrix4() },
    uCamPos: { value: new THREE.Vector3() },
    uNuit: { value: 0 },
    uLueur: { value: new THREE.Vector2(0.5, 0.55) },
    uLueurForce: { value: 0.5 },
    uEtoile: { value: new THREE.Vector3(0.62, 0.55, 0.2) },
    uClairTon: { value: 1 },
    uHaloOuv: { value: 0 },
    uArc: { value: 0 },
    uArcCouleur: { value: new THREE.Color(0x5b6cff) },
    uRayons: { value: 0 },
    uEcrans: { value: 0 },
    uSol: { value: 0 },
    uSolY: { value: -2.3 },
    uClairRiche: { value: 1 },
    uMotClair: { value: 0 },      // le grand mot en contour du monde clair (RÊVER, réf. VISION d'ALCHE)
    uMotClairL: { value: 8 },     // sa ligne dans l'atlas
    uMotClairW: { value: 4 },     // sa largeur (en hauteurs de lettre)
  };
  const m = new THREE.ShaderMaterial({
    uniforms: u, depthWrite: false, depthTest: false, fog: false,
    defines: mobile ? { KZ_MOBILE: 1 } : {},
    vertexShader: /* glsl */ `varying vec2 vNdc; void main() { vNdc = position.xy; gl_Position = vec4(position.xy, 1.0, 1.0); }`,
    fragmentShader: /* glsl */ `
      ${GLSL_TEXBRUIT}
      ${GLSL_RAMPE}
      ${GLSL_MASQUE}
      ${GLSL_SALLE}
      ${GLSL_IRIS}
      uniform mat4 uInvProj; uniform mat4 uCamMonde; uniform vec3 uCamPos;
      uniform float uNuit; uniform vec2 uLueur; uniform float uLueurForce; uniform vec3 uEtoile; uniform float uClairTon; uniform float uHaloOuv;
      uniform float uArc; uniform vec3 uArcCouleur; uniform float uRayons; uniform float uEcrans; uniform float uSol; uniform float uSolY;
      uniform float uClairRiche; uniform float uMotClair; uniform float uMotClairL; uniform float uMotClairW;
      varying vec2 vNdc;

      /* l'arc de lumière, posé sur la paroi : un U lumineux dont le bas passe derrière le mot */
      vec3 arcLumiere(vec2 q, float aa) {
        vec2 c = vec2(0.0, 3.0);
        float r = 4.45;
        float dd = length(q - c) - r;
        float bas = smoothstep(c.y + 0.6, c.y - 2.2, q.y);
        float coeur = exp(-pow(dd / (0.028 + aa * 1.5), 2.0));
        float halo = exp(-abs(dd) / 0.3) * 0.22 + exp(-abs(dd) / 1.4) * 0.035;
        float dedans = smoothstep(0.0, -2.6, dd) * 0.012;
        float vie = 0.85 + 0.15 * sin(kzTps * 0.7 + q.x * 0.3);
        vec3 col = uArcCouleur * (halo + dedans) * 1.2 + mix(uArcCouleur, vec3(0.9, 0.95, 1.0), 0.4) * coeur * 1.5;
        return col * bas * vie;
      }

      /* un carreau-écran : f dans le carreau (0..1), graines, finesse du pixel */
      vec3 ecran(vec2 f, float g, float g2, float aa) {
        float type = floor(g2 * 5.0);
        float t = kzTps;
        float cycle = fract(t / (9.0 + g * 7.0) + g * 3.7);
        float on = smoothstep(0.0, 0.06, cycle) * (1.0 - smoothstep(0.78, 0.86, cycle));
        float scint = step(0.5, fract(sin(floor(t * 14.0) + g * 91.0) * 437.5));
        on *= mix(0.6 + 0.4 * scint, 1.0, smoothstep(0.0, 0.12, cycle));
        vec2 m = f - 0.5;
        float cadre = smoothstep(0.5, 0.44, max(abs(m.x), abs(m.y)));
        vec3 c = vec3(0.0);
        vec3 tt = kzTeinte * 1.4 + 0.08;
        if (type < 1.0) {
          float lig = smoothstep(0.35, 0.0, abs(fract(f.y * 26.0 - t * 0.6) - 0.5) - 0.12);
          float bande = exp(-pow((fract(f.y - t * 0.13 + g) - 0.5) / 0.08, 2.0));
          float forme = smoothstep(0.32, 0.3, length(m * vec2(1.0, 1.25)) - 0.04 * sin(t + f.x * 9.0));
          c = tt * lig * (0.25 + 0.75 * forme) * (0.5 + bande);
        } else if (type < 2.0) {
          vec2 p = m * 2.2;
          float z = sqrt(max(0.0, 1.0 - dot(p, p) * 1.6));
          float an = 1.0 - smoothstep(0.0, 0.08, abs(length(p * vec2(1.0, 2.6)) - 0.95));
          float dep = max(z, an * 0.55);
          float tr = floor(f.x * 5.0);
          float phase = fract(t * 0.22 + g + tr * 0.17);
          vec3 gris = vec3(dep * 0.9);
          vec3 coul = kzRampe(1.0 - dep) * (0.15 + 0.9 * dep);
          c = mix(gris * 0.35, coul, step(0.5, phase)) * smoothstep(0.0, 0.02, dep);
          c += vec3(0.6) * (1.0 - smoothstep(0.0, aa * 2.0 + 0.01, fract(f.x * 5.0))) * 0.15;
        } else if (type < 3.0) {
          float a = t * 0.3 + g * 6.0;
          vec2 p = mat2(cos(a), -sin(a), sin(a), cos(a)) * m * 2.4;
          float l = abs(length(p) - 0.92);
          for (int i = 0; i < 3; i++) {
            float an = float(i) * 2.0944;
            vec2 d = vec2(cos(an), sin(an));
            vec2 pp = vec2(dot(p, d) - 0.45, dot(p, vec2(-d.y, d.x)));
            l = min(l, abs(length(pp * vec2(1.0, 2.1)) - 0.36) * 0.6);
          }
          c = tt * (1.0 - smoothstep(0.0, aa * 6.0 + 0.025, l)) * 1.2;
        } else if (type < 4.0) {
          float b = floor(f.x * 12.0);
          float hgt = 0.15 + 0.7 * pow(0.5 + 0.5 * sin(t * (1.3 + fract(b * 0.37) * 2.0) + b), 2.0);
          float barre = step(fract(f.x * 12.0), 0.7) * step(1.0 - f.y, hgt);
          c = mix(tt, vec3(1.0, 0.6, 0.9), f.y * 0.4) * barre * 0.8;
        } else {
          vec2 cel = floor(f * vec2(9.0, 7.0));
          vec2 sf = fract(f * vec2(9.0, 7.0));
          float gl = step(0.5, fract(sin(dot(cel, vec2(12.9, 78.2)) + floor(t * 2.0 + g * 9.0) * 3.1) * 4375.5));
          vec2 px = floor(sf * vec2(3.0, 5.0));
          float pix = step(0.45, fract(sin(dot(px + cel * 7.0, vec2(41.0, 17.0)) + floor(t * 2.0)) * 951.7));
          c = mix(vec3(0.5, 1.0, 0.7), tt, 0.5) * gl * pix * 0.6;
        }
        c *= 0.85 + 0.15 * sin(f.y * 160.0);
        return c * on * cadre;
      }

      /* la paroi vue par un rayon ; simple : pour le reflet du sol (sans écrans ni grille) */
      vec3 paroi(vec3 o, vec3 d, vec2 uv, bool simple) {
        float t = kzTouche(o, d);
        vec3 p = o + d * t;
        vec2 q = kzParoi(p);
        float aa = t * kzPixAng * (simple ? 3.0 : 1.0);
        float W = KZ_DALLE;
        float col = floor(q.x / W);
        float hc = kzH21(vec2(col, 7.0));
        float H = hc < 0.3 ? W * 0.5 : W;
        float off = hc * W;
        float row = floor((q.y + off) / H);
        vec2 f = vec2(fract(q.x / W), fract((q.y + off) / H));
        float hs = kzH21(vec2(col, row)), hs2 = kzH21(vec2(row, col) + 3.1);
        vec2 e = min(f, 1.0 - f) * vec2(W, H);
        float bord = min(e.x, e.y);
        float joint = smoothstep(0.03, 0.03 + aa * 1.5, bord);
        float filet = 1.0 - smoothstep(0.0, aa * 1.2 + 0.004, abs(bord - 0.06));

        vec3 c = vec3(0.004, 0.004, 0.006) + kzTeinte * (0.002 + 0.016 * hs * hs);
        float bande = exp(-pow((q.y - 2.8) / 1.2, 2.0)) * (0.4 + 0.6 * hs2);
        c += vec3(0.55, 0.55, 0.66) * (bande * 0.022 + pow(clamp(1.0 - f.y, 0.0, 1.0), 5.0) * 0.016);
        float mm = kzMot(q, kzMotA.x, kzMotA.y, KZ_LETTRE, KZ_LIGNE_Y, kzMotDecal, 5.0);
        if (kzMotMix > 0.0) {
          float mb = kzMot(q, kzMotA.z, kzMotA.w, KZ_LETTRE, KZ_LIGNE_Y, kzMotDecal, 5.0);
          float yy = (q.y - KZ_LIGNE_Y) / KZ_LETTRE + 0.5;
          float wipe = smoothstep(-0.06, 0.06, kzMotMix * 1.25 - 0.12 - yy + (kzH21(vec2(floor(q.y * 3.0), 1.0)) - 0.5) * 0.12);
          mm = mix(mm, mb, wipe);
        }
        if (uArc > 0.001) c += arcLumiere(q, aa) * uArc * (1.0 - 0.75 * mm * kzMotForce);
        if (!simple && uEcrans > 0.001 && hs > 0.84) c += ecran(f, hs, hs2, aa / W) * uEcrans * 0.09 * (1.0 - 0.8 * mm * kzMotForce);
        else c += kzTeinte * step(0.9, hs) * (0.03 + 0.02 * sin(kzTps * 0.7 + hs2 * 30.0));
        float g1 = simple ? 0.0 : kzMot(q, 0.0, 4.3, 1.3, 2.9, -kzMotDecal * 0.6 + 3.0, 1.6);
        vec2 gp = fract(q * 20.0) - 0.5;
        float pt = smoothstep(0.45, 0.15, length(gp));
        float vis = 1.0 - smoothstep(0.22, 0.4, aa * 20.0);
        float led = mix(0.9, 0.55 + 0.6 * pt, vis);
        vec3 encre = mix(vec3(0.62, 0.61, 0.7), kzTeinte * 1.1 + 0.2, 0.2);
        float lettre = mm * kzMotForce + g1 * kzMotForce * 0.1;
        c += encre * lettre * led * (0.85 + 0.3 * hs2);
        if (!simple) {
          vec2 gg = abs(fract(q / (W / 6.0)) - 0.5) * (W / 6.0);
          float grille = 1.0 - smoothstep(0.0, aa * 1.1 + 0.002, min(gg.x, gg.y));
          c += vec3(0.6, 0.62, 0.72) * grille * 0.022;
          c += vec3(0.55, 0.55, 0.65) * filet * 0.045;
        }
        vec2 dl = (uv - uLueur) * vec2(kzRes.x / kzRes.y, 1.0);
        c += kzTeinte * exp(-dot(dl, dl) * 4.0) * 0.1 * uLueurForce;
        c *= joint;
        c *= 0.08 + 0.92 * smoothstep(6.5, 1.6, abs(p.y - 0.3));
        if (kzProf > 0.001) {
          float td = clamp(log(t / 2.5) / log(30.0 / 2.5) + 0.04 * sin(kzTps * 0.23 + uv.y * 3.0), 0.0, 1.0);
          float onde = fract(kzTps / 9.0) * 1.4 - 0.2;
          float L = dot(c, vec3(0.2126, 0.7152, 0.0722));
          vec3 cp = kzRampe(td) * (0.03 + 2.6 * L) * mix(1.0, 0.5, smoothstep(0.72, 1.0, td));
          cp += vec3(1.0, 0.92, 0.78) * exp(-pow((td - onde) / 0.03, 2.0)) * 0.12 * joint;
          cp += vec3(0.55, 0.04, 0.22) * 0.12 * pow(1.0 - uv.y, 3.0);
          c = mix(c, cp, kzProf);
        }
        return c;
      }

      /* les rayons de lumière, en éventail depuis un point au-dessus de l'écran */
      float rayons(vec2 uv) {
        float asp = kzRes.x / kzRes.y;
        vec2 src = vec2(0.5 + 0.12 * sin(kzTps * 0.031), 1.3);
        vec2 d = (uv - src) * vec2(asp, 1.0);
        float a = atan(d.x, -d.y);
        float r = length(d);
        float n = kzTB(vec2(a * 0.9 + kzTps * 0.004, kzTps * 0.003)).r * 0.6 + kzTB(vec2(a * 2.3 - kzTps * 0.007, 0.37)).g * 0.4;
        float ry = smoothstep(0.5, 0.82, n);
        ry *= smoothstep(1.1, 0.25, abs(a));
        ry *= smoothstep(0.15, 0.6, r) * exp(-max(r - 0.6, 0.0) * 1.1);
        return ry;
      }

      vec3 salle(vec3 o, vec3 d, vec2 uv) {
        // un seul appel à paroi() (le nuanceur reste court) : soit la paroi vue en direct, soit son reflet dans le sol
        float tParoi = kzTouche(o, d);
        float tSol = d.y < -0.001 ? (uSolY - o.y) / d.y : 1e9;
        bool sol = uSol > 0.001 && tSol < tParoi;
        vec3 oo = o, dd = d;
        vec4 nb = vec4(0.5);
        float fres = 1.0, joint = 0.0;
        if (sol) {
          vec3 p = o + d * tSol;
          vec2 sf = abs(fract(p.xz / 2.4) - 0.5);
          float aa = tSol * kzPixAng / 2.4;
          joint = smoothstep(0.5 - aa * 1.5 - 0.004, 0.5 - 0.004, max(sf.x, sf.y));
          nb = kzTB(p.xz * 0.21 + vec2(0.0, kzTps * 0.01));
          dd = vec3(d.x, -d.y, d.z);
          dd.xz += (nb.rg - 0.5) * 0.035;
          dd = normalize(dd);
          oo = p;
          fres = 0.08 + 0.55 * pow(1.0 - clamp(-d.y, 0.0, 1.0), 5.0);
        }
        vec3 c = paroi(oo, dd, uv, sol);
        if (sol) {
          vec3 base = vec3(0.006, 0.006, 0.008) + kzTeinte * 0.004 * nb.b;
          c = base + c * fres * (1.6 - 0.6 * nb.a);
          vec2 dl = (uv - uLueur) * vec2(kzRes.x / kzRes.y * 1.8, 1.0);
          c += kzTeinte * exp(-dot(dl, dl) * 3.0) * 0.12 * uLueurForce;
          c *= 1.0 - 0.6 * joint;
          c *= smoothstep(26.0, 6.0, tSol) * uSol;
        }
        if (uRayons > 0.001) {
          float ry = rayons(uv);
          c += mix(vec3(0.75, 0.72, 1.0), kzTeinte * 1.5 + 0.2, 0.4) * ry * 0.075 * uRayons;
        }
        return c;
      }

      /* le monde clair : un studio de porcelaine, caustiques irisées, taches de couleur, grille et croix */
      vec3 clair(vec2 fc, vec2 uv, vec3 d) {
        float asp = kzRes.x / kzRes.y;
        vec2 dv = (uv - vec2(0.55, 0.6)) * vec2(asp, 1.0);
        float sol = smoothstep(0.02, -0.28, d.y);
        vec3 paroiC = mix(vec3(1.07, 1.10, 1.14), vec3(0.86, 0.88, 0.95), smoothstep(0.1, 1.2, length(dv)));
        vec3 solC = mix(vec3(1.12, 1.10, 1.06), vec3(0.94, 0.92, 0.9), smoothstep(-0.2, -0.9, d.y));
        vec3 c = mix(paroiC, solC, sol);
        c *= 1.0 - 0.05 * exp(-pow((d.y + 0.05) / 0.05, 2.0));
        if (uClairRiche > 0.001) {
          vec2 q = vec2(uv.x * asp, uv.y);
          float t = kzTps;
          vec2 c1 = vec2(asp * (0.78 + 0.05 * sin(t * 0.07)), 0.78), c2 = vec2(asp * (0.62 + 0.06 * cos(t * 0.05)), 0.25), c3 = vec2(asp * (0.3 + 0.04 * sin(t * 0.06 + 2.0)), 0.92);
          vec3 tache = vec3(1.0, 0.55, 0.8) * exp(-dot(q - c1, q - c1) * 5.0)
                     + vec3(0.45, 0.85, 1.0) * exp(-dot(q - c2, q - c2) * 4.0)
                     + vec3(0.75, 0.6, 1.0) * exp(-dot(q - c3, q - c3) * 6.0);
          c = mix(c, c * (0.88 + 0.32 * tache), 0.9 * uClairRiche);
          vec2 cp = q * (1.2 + sol * 0.8) + vec2(0.0, sol * 3.0);
          float n1 = kzTB(cp * 0.55 + vec2(t * 0.011, t * 0.006)).r;
          float n2 = kzTB(cp * 0.7 - vec2(t * 0.008, -t * 0.01) + 0.37).g;
          float fil = pow(max(1.0 - abs(n1 - n2) * 2.0, 0.0), 10.0);
          float masque = smoothstep(0.35, 0.75, kzTB(q * 0.18 + t * 0.002).b);
          vec3 iris = kzHolo(n1 * 1.5 + q.x * 0.2 + t * 0.02);
          c += iris * fil * masque * (0.09 + 0.1 * sol) * uClairRiche;
        }
        float px = max(kzRes.y / 900.0, 0.75);
        float pas = 26.0 * px;
        vec2 g = abs(fract(fc / pas + 0.5) - 0.5) * pas;
        float fine = 1.0 - smoothstep(0.0, 1.0, min(g.x, g.y));
        c *= 1.0 - 0.04 * fine * (1.0 - sol);
        float grand = pas * 7.0;
        vec2 h = abs(fract((fc - kzRes * 0.5) / grand + 0.5) - 0.5) * grand;
        float croix = (1.0 - smoothstep(0.5 * px, 1.3 * px + 0.5, min(h.x, h.y))) * step(max(h.x, h.y), 8.0 * px);
        c = mix(c, vec3(0.42, 0.45, 0.52), croix * 0.8 * (1.0 - sol * 0.7));
        // le grand mot en contour fin, posé sur la paroi (comme VISION chez ALCHE)
        if (uMotClair > 0.001) {
          float hw = min(0.25, 0.92 * asp / uMotClairW);
          vec2 q = vec2((uv.x - 0.5) * asp, uv.y - (asp < 1.0 ? 0.8 : 0.7));
          float xl = q.x / hw + uMotClairW * 0.5;
          float yl = q.y / hw + 0.5;
          if (xl > 0.0 && xl < uMotClairW && yl > 0.0 && yl < 1.0) {
            float u = 0.5 + (xl - uMotClairW * 0.5) / 8.0;
            float v = 1.0 - (uMotClairL + 1.0 - yl) / kzLignes;
            float m = texture2D(kzMots, vec2(u, v)).r;
            float ligne = 1.0 - smoothstep(0.0, 1.3, abs(m - 0.5) / max(fwidth(m), 1e-4));
            c = mix(c, vec3(0.5, 0.53, 0.6), ligne * 0.7 * uMotClair);
            c = mix(c, c * vec3(0.985, 0.99, 1.0), m * 0.5 * uMotClair);
          }
        }
        return c * uClairTon;
      }

      float capsule(vec2 p, vec2 a, float l, float r) { p -= a; p.x -= clamp(p.x, -l, l); return length(p) - r; }
      vec3 nuit(vec2 uv) {
        float asp = kzRes.x / kzRes.y;
        vec2 q = vec2(uv.x * asp, uv.y);
        float t = kzTps;
        vec3 col = mix(vec3(0.075, 0.09, 0.24), vec3(0.016, 0.02, 0.07), smoothstep(0.05, 0.95, uv.y + 0.04 * sin(q.x * 3.0)));
        float bois = kzTB(vec2(q.x * 0.36 + kzTB(q * 0.5).r * 0.2, q.y * 9.5)).g;
        col *= 0.92 + 0.14 * bois;
        vec2 p = (uv - 0.5) * vec2(asp, 1.0);
        vec2 ce = (uEtoile.xy - 0.5) * vec2(asp, 1.0);
        float psi = p.y * 0.85 + 0.05 * sin(p.x * 3.0 + t * 0.15);
        psi += 0.16 * log(length(p - ce) + 0.05);
        psi += 0.09 * log(length(p - vec2(-0.55 * asp, 0.22) - 0.03 * vec2(sin(t * 0.11), cos(t * 0.09))) + 0.04);
        psi -= 0.08 * log(length(p - vec2(-0.12 * asp, -0.36)) + 0.04);
        psi += 0.07 * log(length(p - vec2(0.42 * asp, -0.4)) + 0.04);
        psi += (kzTB(p * 0.55 + t * 0.004).r - 0.5) * 0.05;
        float f = psi * 52.0;
        float id = floor(f), b = fract(f);
        float trait = smoothstep(0.05, 0.18, b) * smoothstep(0.5, 0.34, b);
        trait *= smoothstep(0.38, 0.58, kzTB((p * 9.0 + id * 1.7) / 16.0).b) * (0.55 + 0.45 * kzTB(p * 1.9 + id * 0.137).a);
        float h = kzHm(vec2(id, 3.0));
        vec3 encre = mix(vec3(0.2, 0.24, 0.6), vec3(0.42, 0.4, 0.82), h);
        encre = mix(encre, vec3(0.32, 0.6, 0.72), step(0.88, h));
        col = mix(col, encre * 0.5, trait * 0.48);
        for (int i = 0; i < 4; i++) {
          float fi = float(i);
          float y = 0.16 + fi * 0.22 + 0.01 * sin(t * 0.1 + fi);
          float x = fract(0.2 + fi * 0.37 + t * (0.004 + 0.002 * fi)) * (asp + 1.2) - 0.6;
          float l = 0.22 + 0.12 * fract(fi * 0.71);
          float dd = min(capsule(q, vec2(x, y), l, 0.022), capsule(q, vec2(x + l * 0.7, y - 0.035), l * 0.6, 0.018));
          vec3 cb = mix(vec3(0.18, 0.15, 0.40), vec3(0.32, 0.25, 0.55), 0.5 + 0.5 * sin(fi * 2.0));
          col = mix(col, cb * (0.85 + 0.15 * smoothstep(-0.02, 0.0, dd)), smoothstep(0.0015, -0.0015, dd) * 0.85);
        }
        float de = length(p - ce);
        col = mix(col, col * vec3(1.35, 1.12, 0.75) + vec3(0.06, 0.03, 0.0) * trait, exp(-de / max(uEtoile.z * 1.8, 1e-3)) * 0.5);
        col += vec3(1.0, 0.55, 0.22) * exp(-de / max(uEtoile.z, 1e-3) * 1.6) * 0.05;
        vec2 g = q * 26.0; vec2 ig = floor(g); float hp = kzHm(ig + 11.0);
        col = mix(col, mix(vec3(0.95, 0.84, 0.6), vec3(0.5, 0.92, 0.95), step(0.992, hp)), step(0.975, hp) * smoothstep(0.13, 0.06, length(fract(g) - 0.5)) * step(0.3, uv.y) * (0.75 + 0.25 * sin(t * (1.0 + hp * 3.0) + hp * 40.0)));
        col *= 0.95 + 0.07 * kzTB(uv * vec2(9.0, 0.8)).a;
        return col;
      }

      void main() {
        vec2 fc = gl_FragCoord.xy;
        vec2 uv = fc / kzRes;
        float cl = kzClair(fc);
        vec4 vv = uInvProj * vec4(vNdc, 1.0, 1.0);
        vec3 d = normalize((uCamMonde * vec4(vv.xyz / vv.w, 0.0)).xyz);
        vec3 col;
        if (cl > 0.5) {
          col = clair(fc, uv, d);
        } else {
          col = vec3(0.0);
          if (uNuit < 0.999 && kzSalleForce > 0.001) col = salle(uCamPos, d, uv) * kzSalleForce;
          if (uNuit > 0.001) col = mix(col, nuit(uv), uNuit);
          vec2 dh = (uv - vec2(0.86, 1.02)) * vec2(kzRes.x / kzRes.y, 1.0);
          col += vec3(0.07, 0.03, 0.2) * exp(-dot(dh, dh) * 2.2) * uHaloOuv;
        }
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
  const mesh = new THREE.Mesh(g, m);
  mesh.frustumCulled = false;
  mesh.renderOrder = -100;
  return {
    mesh, u,
    maj(camera) {
      u.uInvProj.value.copy(camera.projectionMatrixInverse);
      u.uCamMonde.value.copy(camera.matrixWorld);
      u.uCamPos.value.setFromMatrixPosition(camera.matrixWorld);
    },
  };
}
