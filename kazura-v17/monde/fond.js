/* Kazura v16, la Scène : le fond, peint par deux triangles plein écran (chacun ne peint que ses pixels).
   - la salle de dalles (sombre) : un cylindre de grands carreaux noirs légèrement brillants, à joints
     fins, une grille fine, et la typographie géante projetée dessus, tramée de points de lumière
     comme un mur d'écrans ; certains carreaux sont de vrais écrans qui s'allument ; un arc de lumière
     (réf. ZYNO) passe derrière le mot géant ; des rayons tombent d'en haut ; un sol de pierre sombre et
     polie reflète la paroi, l'arc et la lueur du sceau. La salle revient, apaisée, dans « Qui fait votre site » ;
   - le monde de l'autre côté, dans son propre nuanceur : v16, d'abord le MONDE VIOLET de « Osez rêver » (matière
     liquide irisée qui coule, dans la gamme du passage), puis v17 : LA FEUILLE de porcelaine qui se lève du bas,
     inclinée, se redresse et remplit l'écran ; elle devient la feuille de dessin du déroulé (blanc froid, croix
     fines, traits de construction du sceau qui se dessinent au fil des moments).
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
    uLent: { value: 1 },
    uSceauBlanc: { value: 0 },    // v16 (retiré en v17, gardé pour le contrat des uniformes)
    uDessin: { value: 0 },        // v17 : le dessin du sceau sur la feuille, de 0 à 6 (un cran par moment du déroulé)
    uDefile: { value: 0 },        // position dans la page (s) : la matière violette monte avec la page
    uTexteG: { value: 1 },        // 1 en paysage (les textes sont à gauche : la matière y reste dans l'indigo)
  };
  const TETE = /* glsl */ `
      precision highp float;
      ${GLSL_TEXBRUIT}
      ${GLSL_RAMPE}
      ${GLSL_MASQUE}
      ${GLSL_SALLE}
      ${GLSL_IRIS}
      uniform mat4 uInvProj; uniform mat4 uCamMonde; uniform vec3 uCamPos;
      uniform float uNuit; uniform vec2 uLueur; uniform float uLueurForce; uniform vec3 uEtoile; uniform float uClairTon; uniform float uHaloOuv;
      uniform float uArc; uniform vec3 uArcCouleur; uniform float uRayons; uniform float uEcrans; uniform float uSol; uniform float uSolY;
      uniform float uClairRiche; uniform float uMotClair; uniform float uMotClairL; uniform float uMotClairW;
      uniform float uLent; uniform float uDefile; uniform float uTexteG; uniform float uSceauBlanc; uniform float uDessin;
      varying vec2 vNdc;
`;
  const SOMMET = /* glsl */ `varying vec2 vNdc; void main() { vNdc = position.xy; gl_Position = vec4(position.xy, 1.0, 1.0); }`;
  const DIRECTION = /* glsl */ `
        vec4 vv = uInvProj * vec4(vNdc, 1.0, 1.0);
        vec3 d = normalize((uCamMonde * vec4(vv.xyz / vv.w, 0.0)).xyz);`;
  const defines = mobile ? { KZ_MOBILE: 1 } : {};
  /* deux nuanceurs. Le sombre (salle) ; l'autre côté (violet, coulée, blanc) à part, compilé avec le lot
     du monde clair : le grand nuanceur de la salle reste court à compiler. Chacun ne peint que ses pixels. */
  const m = new THREE.ShaderMaterial({
    uniforms: u, depthWrite: false, depthTest: false, fog: false, defines,
    vertexShader: SOMMET,
    fragmentShader: TETE + /* glsl */ `
      /* l'arc de lumière, posé sur la paroi : un U lumineux dont le bas passe derrière le mot */
      vec3 arcLumiere(vec2 q, float aa) {
        vec2 c = vec2(0.0, 3.0);
        float r = 4.45;
        float dd = length(q - c) - r;
        float bas = smoothstep(c.y + 0.6, c.y - 2.2, q.y);
        float coeur = exp(-kzC2(dd / (0.028 + aa * 1.5)));
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
          float bande = exp(-kzC2((fract(f.y - t * 0.13 + g) - 0.5) / 0.08));
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
          float hgt = 0.15 + 0.7 * kzC2(0.5 + 0.5 * sin(t * (1.3 + fract(b * 0.37) * 2.0) + b));
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
        float bande = exp(-kzC2((q.y - 2.8) / 1.2)) * (0.4 + 0.6 * hs2);
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
          cp += vec3(1.0, 0.92, 0.78) * exp(-kzC2((td - onde) / 0.03)) * 0.12 * joint;
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

      void main() {
        vec2 fc = gl_FragCoord.xy;
        vec2 uv = fc / kzRes;
        if (kzClair(fc) > 0.5) { gl_FragColor = vec4(1.0); return; }
        ${DIRECTION}
        vec3 col = vec3(0.0);
        if (kzSalleForce > 0.001) col = salle(uCamPos, d, uv) * kzSalleForce;
        vec2 dh = (uv - vec2(0.86, 1.02)) * vec2(kzRes.x / kzRes.y, 1.0);
        col += vec3(0.07, 0.03, 0.2) * exp(-dot(dh, dh) * 2.2) * uHaloOuv;
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  const mc = new THREE.ShaderMaterial({
    uniforms: u, depthWrite: false, depthTest: false, fog: false, defines,
    vertexShader: SOMMET,
    fragmentShader: TETE + /* glsl */ `
      /* v16 : LE MONDE VIOLET (« Osez rêver »). La profondeur du passage (indigo au loin, violet, magenta, rose
         tout près) devient une MATIÈRE LIQUIDE qui coule : un champ de hauteur lisse, deux fois déformé (bruit lu
         dans la texture, petites octaves effacées), peint avec la gamme violette du passage ; ses pentes vernies
         d'un film mince (l'irisation), ses crêtes qui accrochent la lumière, quelques filets irisés. Elle coule
         lentement et monte avec la page. Les couleurs sont pensées À L'ÉCRAN (kzEcran les ramène avant le rendu
         filmique) : exactement la gamme des tranches. Côté textes (à gauche en paysage), la matière reste dans
         l'indigo et le violet : le texte clair de la page y garde un contraste solide. */
      /* bruit de gradient lisse (raccords quintiques) : la matière garde des pentes continues, donc un vernis net */
      vec2 kzGrad(vec2 p) { p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3))); return -1.0 + 2.0 * fract(sin(p) * 43758.5453); }
      float kzBG(vec2 p) {
        vec2 i = floor(p), f = fract(p);
        vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
        return mix(mix(dot(kzGrad(i), f), dot(kzGrad(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
                   mix(dot(kzGrad(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)), dot(kzGrad(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x), u.y);
      }
      float kzBG2(vec2 p) { return kzBG(p) + 0.45 * kzBG(p * 2.03 + 17.1); }
      /* le champ de hauteur de la matière (0 à 1) : deux déformations successives, lentes */
      float champ(vec2 q, float t) {
        vec2 w1 = vec2(kzBG2(q * 1.1 + vec2(t * 0.05, -t * 0.07)), kzBG2(q * 1.1 + vec2(5.2 - t * 0.06, 1.3 + t * 0.04)));
        vec2 q2 = q + w1 * 0.75;
        vec2 w2 = vec2(kzBG(q2 * 1.7 + vec2(-t * 0.08, t * 0.05) + 9.0), kzBG(q2 * 1.7 + vec2(t * 0.06, -t * 0.09) + 3.7));
        float h = kzBG2(q2 * 1.2 + w2 * 0.6 + vec2(0.0, t * 0.04));
        return clamp(h * 1.25 + 0.5, 0.0, 1.0);
      }
      vec3 violet(vec2 fc, vec2 uv) {
        float asp = kzRes.x / kzRes.y;
        vec2 p = vec2((uv.x - 0.5) * asp, uv.y - 0.5);
        float t = kzTps * uLent;
        // la matière : des coulées étirées le long d'une diagonale (comme la vague d'ALCHE), qui montent avec la page
        vec2 ax = asp < 1.0 ? vec2(0.34, 0.94) : vec2(0.5, 0.866);
        vec2 r2 = vec2(dot(p, ax), dot(p, vec2(ax.y, -ax.x)));
        vec2 q = r2 * vec2(0.75, 1.9) + vec2(-(uDefile - 4.0) * 0.5, -(uDefile - 4.0) * 0.4);
        vec2 wq = q + vec2(kzBG2(q * 0.7 + vec2(t * 0.045, 0.0)), kzBG2(q * 0.7 + vec2(4.1, -t * 0.04))) * 0.85;
        float h = kzBG2(wq * vec2(0.6, 1.0) + vec2(0.0, t * 0.035)) * 1.3 + 0.5;
        // où la matière s'allume : à droite et en bas en paysage (les textes sont à gauche) ; au téléphone, en haut et en bas
        float zone = uTexteG > 0.5
          ? smoothstep(0.22, 0.92, uv.x) * (0.7 + 0.3 * smoothstep(0.9, 0.2, uv.y))
          : 0.25 + 0.4 * smoothstep(0.22, 0.48, abs(uv.y - 0.5));
        // des bandes : indigo, violet, magenta, rose, puis retour, qui glissent dans la coulée
        float tri = abs(fract(h * 0.85 + 0.1) * 2.0 - 1.0);
        float dv = clamp(0.05 + tri * mix(0.45, 1.0, zone), 0.0, 1.0);
        vec3 c = kzViolet(dv) * (0.52 + 0.5 * dv) + vec3(0.1, 0.02, 0.26) * (1.0 - dv) * 0.3;
        // le vernis : un film mince irisé sur les pentes, des reflets sur les crêtes
        vec2 g = vec2(dFdx(h), dFdy(h)) * kzRes.y * 0.12;
        vec3 n = normalize(vec3(-g, 1.0));
        float pente = clamp(length(g), 0.0, 1.0);
        vec3 film = kzHolo(h * 0.9 + p.x * 0.15 - t * 0.015 + n.x * 0.6 + n.y * 0.3);
        c = mix(c, film * (0.32 + 0.55 * dv), smoothstep(0.12, 0.85, pente) * 0.6 * (0.2 + 0.8 * zone));
        vec3 rf = reflect(vec3(0.0, 0.0, -1.0), n);
        c += vec3(1.0, 0.82, 0.98) * pow(max(dot(rf, normalize(vec3(-0.3, 0.5, 0.8))), 0.0), 14.0) * 0.55 * zone;
        // un remous sombre qui s'enroule dans la coulée
        float rr = fract(h * 0.85 + 0.62);
        c = mix(c, vec3(0.05, 0.02, 0.16), smoothstep(0.4, 0.5, rr) * smoothstep(0.6, 0.5, rr) * 0.55);
        // la profondeur : une lueur rose au loin, en bas à droite (en bas au téléphone), qui respire
        vec2 lc = uTexteG > 0.5 ? vec2(0.36 * asp, -0.38) : vec2(0.1, -0.44);
        vec2 dl = p - lc - vec2(0.04 * sin(t * 0.13), 0.03 * cos(t * 0.11));
        c += vec3(0.85, 0.22, 0.72) * exp(-dot(dl, dl) * 3.0) * (0.34 + 0.07 * sin(t * 0.4));
        // le balayage lumineux du passage, très doux
        float bal = fract(t * 0.04);
        c += vec3(0.75, 0.55, 1.0) * exp(-kzC2((p.y + p.x * 0.35 - (0.9 - bal * 2.2)) / 0.06)) * 0.07;
        // côté textes : l'indigo profond
        c *= uTexteG > 0.5 ? mix(1.0, 0.62, smoothstep(0.62, 0.1, uv.x)) : 0.82;
        // la trame des tranches
        c *= 0.96 + 0.04 * sin(fc.y * 1.5708);
        // les croix d'ALCHE, en lavande
        float px = max(kzRes.y / 900.0, 0.75);
        float grand = 26.0 * px * 7.0;
        vec2 hh = abs(fract((fc - kzRes * 0.5) / grand + 0.5) - 0.5) * grand;
        float croix = (1.0 - smoothstep(0.5 * px, 1.3 * px + 0.5, min(hh.x, hh.y))) * step(max(hh.x, hh.y), 8.0 * px);
        c = mix(c, vec3(0.78, 0.68, 1.0), croix * 0.35);
        return c;
      }

      /* v17 : LA FEUILLE DE DESSIN de Mathéo (le blanc du déroulé). Couleurs d'écran (sRGB) : kzEcran les ramène
         avant le rendu filmique. q : coordonnées sur la feuille (hauteurs d'écran, centre 0) ; pq : un pixel de l'écran
         en unités de feuille (plus grand quand la feuille est inclinée : l'anticrénelage suit). */
      float trait(float d, float w, float pq) { return 1.0 - smoothstep(max(w - 0.5 * pq, 0.0), w + 0.75 * pq, d); }
      float vesique(vec2 p, float r, float dd) {
        p = abs(p);
        float b = sqrt(max(r * r - dd * dd, 0.0));
        return ((p.y - b) * dd > p.x * b) ? length(p - vec2(0.0, b)) : length(p - vec2(-dd, 0.0)) - r;
      }
      /* le sceau de Kazura (l'anneau et les trois folioles) en distance au trait */
      float sceauDS(vec2 p, float S) {
        float dmin = abs(length(p) - S);
        float h = 0.41 * S, w = 0.15 * S;
        float r = (h * h + w * w) / (2.0 * w), dd = r - w;
        for (int k = 0; k < 3; k++) {
          float a = float(k) * 2.0943951;
          vec2 q = mat2(cos(a), -sin(a), sin(a), cos(a)) * p;
          dmin = min(dmin, abs(vesique(q - vec2(0.0, 0.5 * S), r, dd)));
        }
        return dmin;
      }
      /* les traits de construction du sceau, puis le sceau, au fil des moments du déroulé (uDessin de 0 à 6) :
         1 les axes, 2 l'anneau et son cercle intérieur, 3 les axes à 120 degrés et les cercles des folioles,
         4 le carré et la grille de l'ouverture, 5 le sceau au trait blanc avec son ombre douce (en ligne),
         6 un reflet irisé fin qui parcourt l'anneau (le suivi) */
      vec3 dessin(vec3 c, vec2 q, float pq, float dp, float asp) {
        bool tel = asp < 1.0;
        vec2 C = tel ? vec2(0.0, 0.1) : vec2(-0.06 * asp, 0.0);
        float S = tel ? 0.42 * asp : 0.36;
        vec2 p = q - C;
        float r = length(p);
        float ang = fract(atan(p.x, p.y) / 6.2831853 + 1.0);
        float k0 = kzLs(0.0, 0.9, uDessin), k1 = kzLs(1.0, 1.9, uDessin), k2 = kzLs(2.0, 2.9, uDessin), k3 = kzLs(3.0, 3.9, uDessin);
        float k4 = kzLs(4.0, 4.9, uDessin), k5 = kzLs(5.0, 5.8, uDessin);
        float w = 0.68 * dp;   // v17 : des traits un peu plus présents
        float a = 0.0;
        // 1. les axes, qui partent du centre
        a = max(a, trait(abs(p.y), w, pq) * smoothstep(0.0, 0.02, k0 * (0.5 * asp + 0.3) - abs(p.x)));
        a = max(a, trait(abs(p.x), w, pq) * smoothstep(0.0, 0.02, k0 * 0.8 - abs(p.y)));
        a = max(a, trait(abs(r - 0.035 * S), w, pq) * step(0.001, k0));
        // 2. l'anneau et son cercle intérieur, tracés depuis le haut
        float arc1 = smoothstep(k1 + 0.004, k1 - 0.004, ang) * step(0.001, k1);
        a = max(a, trait(abs(r - S), w, pq) * arc1);
        a = max(a, trait(abs(r - 0.86 * S), w, pq) * arc1 * 0.75);
        // 3. les axes à 120 degrés et les trois cercles des folioles
        for (int i = 0; i < 3; i++) {
          float an = 1.5707963 + float(i) * 2.0943951;
          vec2 dir = vec2(cos(an), sin(an));
          float le = dot(p, dir);
          a = max(a, trait(abs(dot(p, vec2(-dir.y, dir.x))), w, pq) * smoothstep(-0.01, 0.0, le) * smoothstep(0.0, 0.02, k2 * 1.25 * S - le));
          vec2 cc = p - dir * 0.5 * S;
          float angc = fract(atan(cc.x, cc.y) / 6.2831853 + 1.0 - float(i) / 3.0);
          a = max(a, trait(abs(length(cc) - 0.5 * S), w, pq) * smoothstep(k2 + 0.004, k2 - 0.004, angc) * step(0.001, k2) * 0.8);
        }
        // 4. le carré et la grille de l'ouverture, rangée par rangée depuis le haut
        vec2 bq = abs(p);
        float rev = smoothstep(0.0, 0.03, k3 * 2.1 * S - (S - p.y)) * step(0.001, k3);
        float carre = trait(abs(max(bq.x, bq.y) - S), w, pq);
        vec2 gg = abs(fract(p / (S * 0.25) + 0.5) - 0.5) * S * 0.25;
        float grille = trait(min(gg.x, gg.y), 0.4 * dp, pq) * step(max(bq.x, bq.y), S);
        a = max(a, max(carre * 0.85, grille * 0.42) * rev);
        // les traits de construction : gris perle, fins ; ils s'effacent un peu quand le sceau est tracé
        c = mix(c, vec3(0.6, 0.65, 0.71), a * 0.78 * (1.0 - 0.35 * k4));
        // 5. le sceau, au trait blanc et son ombre douce (réf. le grand A d'ALCHE), tracé en tournant depuis le haut
        if (k4 > 0.001) {
          float tr = smoothstep(k4 * 1.02 + 0.006, k4 * 1.02 - 0.006, ang);
          float ds = sceauDS(p, S);
          float dO = sceauDS(p - vec2(1.6, -2.2) * dp, S);
          float om = 1.0 - smoothstep(0.0, 5.0 * dp + pq, dO);
          c = mix(c, c * vec3(0.74, 0.77, 0.82), om * 0.8 * tr);
          float bl = trait(ds, 1.45 * dp, pq);
          c = mix(c, vec3(0.997, 0.998, 1.0), bl * tr);
          // la tête du tracé luit, irisée
          float tete = exp(-kzC2((ang - k4) / 0.012)) * step(k4, 0.995);
          c = mix(c, mix(kzHolo(ang * 2.0 + kzTps * 0.1), vec3(1.0), 0.3), tete * trait(ds, 2.2 * dp, pq) * 0.85);
          // 6. le suivi : un reflet irisé fin parcourt l'anneau, lentement
          float gl = fract(kzTps * 0.045 * uLent);
          float reflet = exp(-kzC2((fract(ang - gl + 0.5) - 0.5) / 0.035)) * k5;
          c = mix(c, mix(kzHolo(ang * 3.0 + kzTps * 0.05), vec3(1.0), 0.3), reflet * bl * 0.75);
        }
        return c;
      }
      vec3 papier(vec2 q, float pq) {
        float asp = kzRes.x / kzRes.y;
        float dp = max(kzRes.y / 900.0, 0.75) / kzRes.y;   // un « pixel de dessin » en unités de feuille
        // blanc froid lumineux (#eef2f4), une vignette légère, la lumière qui vient d'en haut à gauche
        vec2 vq = q / vec2(0.5 * asp + 0.12, 0.62);
        vec3 c = vec3(0.935, 0.951, 0.958);
        c = mix(c, vec3(0.872, 0.895, 0.915), smoothstep(0.7, 1.7, length(vq)) * 0.6);
        c += vec3(0.010, 0.010, 0.008) * clamp(q.y * 0.9 - q.x / max(asp, 0.5) * 0.45, -1.0, 1.0);
        // la trame : de fines croix grises sur une grille (réf. ALCHE) ; trop loin (feuille très inclinée), elle
        // s'efface au lieu de scintiller
        float G = 0.2;
        vec2 h = abs(fract(q / G + 0.5) - 0.5) * G;
        float loin = 1.0 - smoothstep(0.035 * G, 0.12 * G, pq);
        float croix = trait(min(h.x, h.y), 0.5 * dp, pq) * (1.0 - smoothstep(7.0 * dp, 7.0 * dp + pq, max(h.x, h.y))) * loin;
        c = mix(c, vec3(0.70, 0.74, 0.78), croix * 0.6);
        if (uDessin > 0.001) c = dessin(c, q, pq, dp, asp);
        return c;
      }
      /* v17 : la feuille est une plaque de porcelaine (une boîte très fine) : lancer de rayon dans son repère.
         Renvoie la face touchée (0 rien, 1 la face avant, 2 la tranche) ; o, d : le rayon dans le repère de la feuille */
      float plaque(vec3 o, vec3 d, vec3 T) {
        vec3 inv = 1.0 / vec3(abs(d.x) < 1e-6 ? 1e-6 : d.x, abs(d.y) < 1e-6 ? 1e-6 : d.y, abs(d.z) < 1e-6 ? 1e-6 : d.z);
        vec3 c = vec3(0.0, 0.0, -T.z * 0.5);
        vec3 t1 = (c - T * 0.5 * vec3(2.0, 2.0, 1.0) - o) * inv, t2 = (c + T * 0.5 * vec3(2.0, 2.0, 1.0) - o) * inv;
        vec3 tn = min(t1, t2), tf = max(t1, t2);
        float tN = max(max(tn.x, tn.y), tn.z), tF = min(min(tf.x, tf.y), tf.z);
        if (tN > tF || tF < 0.0) return 0.0;
        return tn.z >= max(tn.x, tn.y) ? 1.0 : 2.0;
      }
      /* le passage : la feuille qui bascule et se lève dans le monde violet (kzBlanc de 0 à 1) */
      vec3 passage(vec2 fc, vec2 uv) {
        float asp = kzRes.x / kzRes.y;
        vec4 F = kzFeuille(uv);
        float unit = max(kzRes.y / 900.0, 0.75);
        vec3 C, R, V, N; float a;
        kzFeuillePose(kzBlanc, C, R, V, N, a);
        float inc = a / 1.42;   // 1 presque à plat, 0 posée
        vec2 T2 = kzFeuilleTaille();
        vec3 T = vec3(T2, 0.014);   // l'épaisseur de la plaque (en hauteurs d'écran, une fois posée)
        // la distance au bord de la face avant, en pixels de l'écran (bornée loin de la feuille : vers l'horizon du
        // plan, les dérivées entre un pixel qui touche et un qui manque n'ont plus de sens)
        float zc = F.w > 0.5 ? max(F.z, -0.3) : -0.3;
        float gz = length(vec2(dFdx(zc), dFdy(zc)));
        vec2 fxy = clamp(F.xy, vec2(-8.0), vec2(8.0));
        float pq = max(length(fwidth(fxy)), 1.0 / kzRes.y);
        float e = zc > -0.29 ? zc / max(gz, 1e-6) : -1e4;
        // la plaque, vue par quatre rayons dans le pixel (bords nets) : la face avant ou la tranche
        vec2 p = vec2((uv.x - 0.5) * asp, uv.y - 0.5);
        vec3 o = vec3(dot(-C, R), dot(-C, V), dot(-C, N));
        float px = 1.0 / kzRes.y;
        float face = 0.0, tranche = 0.0;
        for (int k = 0; k < 4; k++) {
          vec2 j = (vec2(float(k / 2), float(k - (k / 2) * 2)) - 0.5) * 0.5 * px;
          vec3 dw = vec3(p + j, -1.0);
          float h = plaque(o, vec3(dot(dw, R), dot(dw, V), dot(dw, N)), T);
          face += step(0.5, h) * step(h, 1.5); tranche += step(1.5, h);
        }
        face *= 0.25; tranche *= 0.25;
        float cov = face + tranche;
        vec3 col = vec3(0.0);
        if (cov < 1.0) {
          col = violet(fc, uv);
          // l'ombre douce de la feuille sur le violet, derrière elle (vers le bas : la lumière vient d'en haut)
          vec3 d0 = vec3(p - vec2(0.03, -0.085) * (0.3 + inc), -1.0);
          float dn = dot(d0, N);
          float ts = dot(C, N) / (abs(dn) < 1e-5 ? -1e-5 : dn);
          vec3 Xs = d0 * ts - C;
          vec2 qs = vec2(dot(Xs, R), dot(Xs, V));
          float sd = max(abs(qs.x) - T.x, abs(qs.y) - T.y);
          float flou = 0.08 + 0.14 * inc;
          col *= 1.0 - 0.62 * (1.0 - smoothstep(-flou * 0.4, flou, sd)) * step(0.0, ts) * smoothstep(0.0, 0.15, inc + 0.05);
          // la feuille éclaire un peu le violet tout près de son arête
          float eo = max(-e, 0.0) / unit;
          col += vec3(0.80, 0.74, 1.0) * 0.12 * exp(-eo / 22.0) * step(-5e3, e) * smoothstep(-0.12, -0.02, F.z);
        }
        if (face > 0.0) {
          vec3 c = papier(F.xy, pq);
          vec3 vd = normalize(vec3(-p, 1.0));
          // la lumière : elle vient d'en haut, un peu de face ; la porcelaine s'éclaire vers l'arête du haut et reste
          // plus douce vers le bas ; en lumière rasante, elle reflète le monde violet
          float fres = pow(1.0 - clamp(dot(N, vd), 0.0, 1.0), 3.0);
          c = mix(c, vec3(0.80, 0.75, 0.95), fres * 0.55 * inc);
          float hv = clamp(F.y / T.y * 0.5 + 0.5, 0.0, 1.0);
          c *= mix(1.0, 0.86 + 0.16 * hv, inc);
          c = mix(c, vec3(0.99, 0.993, 1.0), inc * 0.4 * smoothstep(0.8, 1.0, hv));
          // le lustre : un reflet large et doux qui glisse sur la surface pendant qu'elle tourne
          vec3 rf = reflect(-vd, N);
          float lu = max(dot(rf, normalize(vec3(-0.25, 0.85, 0.45))), 0.0);
          float lustre = pow(lu, 10.0) * 0.12 + pow(lu, 70.0) * 0.22;
          c = mix(c, vec3(1.0, 0.995, 1.0), clamp(lustre, 0.0, 1.0) * smoothstep(0.0, 0.25, inc));
          // l'arête de la face : un fil de lumière net, une frange irisée fine juste dessous
          float ep = e / unit;
          vec3 ir = mix(kzHolo(F.x * 0.35 + F.y * 0.2 + kzTps * 0.04 * uLent), vec3(1.0), 0.35);
          c = mix(c, ir, exp(-kzC2((ep - 2.6) / 1.1)) * (0.3 + 0.4 * inc));
          c = mix(c, vec3(1.0), exp(-kzC2(ep / 1.15)) * 0.9);
          col = mix(col, clamp(c, 0.0, 1.0), face);
        }
        if (tranche > 0.0) {
          // la tranche (l'épaisseur de la porcelaine) : un gris perle lavé de lumière, avec un fil irisé
          vec3 tc = mix(vec3(0.74, 0.74, 0.84), vec3(0.97, 0.97, 1.0), 0.35 + 0.4 * inc);
          tc = mix(tc, kzHolo(p.x * 0.8 + kzTps * 0.05 * uLent), 0.18);
          col = mix(col, tc, tranche);
        }
        return col;
      }

      void main() {
        vec2 fc = gl_FragCoord.xy;
        if (kzClair(fc) < 0.5) discard;
        vec2 uv = fc / kzRes;
        vec3 col;
        if (kzBlanc <= 0.0) col = violet(fc, uv);
        else if (kzBlanc >= 1.0) col = papier(vec2((uv.x - 0.5) * kzRes.x / kzRes.y, uv.y - 0.5), 1.0 / kzRes.y);
        else col = passage(fc, uv);
        gl_FragColor = vec4(kzEcran(col), 1.0);
      }`,
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
  const mesh = new THREE.Mesh(g, m);
  mesh.frustumCulled = false;
  mesh.renderOrder = -100;
  const meshClair = new THREE.Mesh(g, mc);
  meshClair.frustumCulled = false;
  meshClair.renderOrder = -99;
  return {
    mesh, meshClair, u,
    /* decalY : la descente de la caméra (déroulé) ; la salle est vue depuis sa propre hauteur */
    maj(camera, decalY = 0) {
      u.uInvProj.value.copy(camera.projectionMatrixInverse);
      u.uCamMonde.value.copy(camera.matrixWorld);
      u.uCamPos.value.setFromMatrixPosition(camera.matrixWorld);
      u.uCamPos.value.y -= decalY;
    },
  };
}
