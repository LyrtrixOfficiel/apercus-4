/* Kazura v15, la Scène : le fond, peint par deux triangles plein écran (chacun ne peint que ses pixels).
   - la salle de dalles (sombre) : un cylindre de grands carreaux noirs légèrement brillants, à joints
     fins, une grille fine, et la typographie géante projetée dessus, tramée de points de lumière
     comme un mur d'écrans ; certains carreaux sont de vrais écrans qui s'allument ; un arc de lumière
     (réf. ZYNO) passe derrière le mot géant ; des rayons tombent d'en haut ; un sol de pierre sombre et
     polie reflète la paroi, l'arc et la lueur du sceau. La salle revient, apaisée, dans « Qui fait votre site » ;
   - le monde clair, dans son propre nuanceur (v15) : un studio de porcelaine, caustiques irisées, taches de
     lumière colorée, grille fine et croix d'ALCHE, et LES FAILLES : la porcelaine se fend, des cassures
     s'ouvrent depuis deux impacts lumineux et laissent passer la lumière d'un prisme.
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
    uFaille: { value: 0 },        // v15 : force des failles irisées dans la porcelaine (0 à 1)
    uDefile: { value: 0 },        // v15 : position dans la page (s) : les failles s'ouvrent et suivent le défilement
    uTexteG: { value: 1 },        // v15 : 1 en paysage (les textes sont à gauche : les failles y restent fines)
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
      uniform float uFaille; uniform float uDefile; uniform float uTexteG;
      varying vec2 vNdc;
`;
  const SOMMET = /* glsl */ `varying vec2 vNdc; void main() { vNdc = position.xy; gl_Position = vec4(position.xy, 1.0, 1.0); }`;
  const DIRECTION = /* glsl */ `
        vec4 vv = uInvProj * vec4(vNdc, 1.0, 1.0);
        vec3 d = normalize((uCamMonde * vec4(vv.xyz / vv.w, 0.0)).xyz);`;
  const defines = mobile ? { KZ_MOBILE: 1 } : {};
  /* v15 : deux nuanceurs. Le sombre (salle) ; le CLAIR (porcelaine, failles) à part, compilé avec le lot
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
      /* v15 : LES FAILLES. La porcelaine se fend : de longues fissures sinueuses et dentelées (lignes de niveau
         d'un bruit déformé, distance exacte au pixel par les dérivées) s'ouvrent depuis quelques points d'impact à
         mesure qu'on descend. Chaque fissure laisse passer une lumière irisée (cœur presque blanc, bords saturés),
         a deux lèvres (l'une éclairée, l'autre dans l'ombre : la cassure a du relief), et répand sa couleur dans le
         blanc. Des fissures secondaires en partent, un craquelé très fin couvre la glaçure. Elles respirent (leur
         largeur bat doucement) et montent avec la page. */
      vec2 kzGrad(vec2 p) { p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3))); return -1.0 + 2.0 * fract(sin(p) * 43758.5453); }
      /* bruit de gradient lisse (raccords quintiques) : ses lignes de niveau sont nettes, sans facettes */
      float kzBruitG(vec2 p) {
        vec2 i = floor(p), f = fract(p);
        vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
        return mix(mix(dot(kzGrad(i), f), dot(kzGrad(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
                   mix(dot(kzGrad(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)), dot(kzGrad(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x), u.y);
      }
      vec2 kzH22(vec2 p) { p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3))); return fract(sin(p) * 43758.5453); }
      vec2 cellule(vec2 c) { vec2 h = kzH22(c); return 0.5 + 0.44 * sin(h * 6.2831853 + vec2(0.0, 1.7)); }
      /* le réseau des cassures (cellules de Voronoï) : distance au bord le plus proche (x), identité de ce bord (y),
         côté de la cassure (z : +1 ou -1, pour éclairer une lèvre et ombrer l'autre) */
      vec3 bordVoronoi(vec2 x) {
        vec2 n = floor(x), f = fract(x);
        vec2 mg = vec2(0.0), mr = vec2(0.0); float md = 8.0;
        for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
          vec2 g = vec2(float(i), float(j)); vec2 r = g + cellule(n + g) - f; float d = dot(r, r);
          if (d < md) { md = d; mr = r; mg = g; }
        }
        md = 8.0; vec2 voisin = vec2(0.0);
        #ifdef KZ_MOBILE
        for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
        #else
        for (int j = -2; j <= 2; j++) for (int i = -2; i <= 2; i++) {
        #endif
          vec2 g = mg + vec2(float(i), float(j)); vec2 r = g + cellule(n + g) - f;
          if (dot(mr - r, mr - r) > 0.00001) { float d = dot(0.5 * (mr + r), normalize(r - mr)); if (d < md) { md = d; voisin = g; } }
        }
        vec2 a = n + mg, b = n + voisin;
        float id = fract(sin(dot(a + b, vec2(12.9898, 78.233)) + dot(a * b, vec2(3.1, 1.7))) * 43758.5453);
        return vec3(md, id, kzH22(a).x > kzH22(b).x ? 1.0 : -1.0);
      }
      /* une fissure : d (px) distance, cote (+1 ou -1 : de quel côté de la cassure), w (px) ouverture, teinte (0 à 1)
         Dedans, la lumière d'un PRISME : le spectre s'étale d'une lèvre à l'autre (rouge d'un côté, violet de l'autre),
         un fil blanc éclatant au milieu (assez fort pour le halo de lumière), et, dans les grandes brèches, la couleur
         coule comme un liquide. Autour : un halo serré, la lumière colorée qui baigne la porcelaine, et deux lèvres
         (l'une éclairée, l'autre dans l'ombre). */
      vec3 fissure(vec3 c, float d, float cote, float w, float teinte, float t, vec2 uv, float px, float force) {
        float bord = max(d - w, 0.0);
        float ouvert = smoothstep(0.4 * px, 2.0 * px, w);
        vec3 lumi = clamp(pow(kzIris(teinte), vec3(1.5)) * 1.3, 0.0, 1.4);
        float large = exp(-bord / (150.0 * px)) * smoothstep(0.0, 12.0 * px, w);
        c = mix(c, c * (0.5 + 0.62 * lumi), large * 0.75 * force);
        float halo = exp(-bord / (2.0 * px + w * 0.3)) * ouvert;
        c = mix(c, lumi * 1.15 + 0.2, halo * 0.55 * (0.45 + 0.55 * force));
        float levre = exp(-kzC2((d - w - 0.9 * px) / (0.8 * px))) * ouvert;
        c *= 1.0 - (cote > 0.0 ? 0.45 : 0.1) * levre;
        c += vec3(0.7) * levre * (cote > 0.0 ? 0.0 : 0.5);
        float dedans = (1.0 - smoothstep(w - 0.6, w + 0.6, d)) * ouvert;
        float r = clamp(d / max(w, 0.001), 0.0, 1.0);          // 0 au milieu, 1 sur la lèvre
        float travers = r * cote;                                // -1 à 1, d'une lèvre à l'autre
        vec2 qq = uv * kzRes / (kzRes.y * 0.08);
        float coule = kzBruitG(qq * 0.5 + vec2(t * 0.12, -t * 0.2)) * smoothstep(8.0 * px, 26.0 * px, w);
        vec3 spectre = clamp(pow(kzIris(teinte + travers * 0.32 + coule * 0.45), vec3(1.6)) * 1.7, 0.0, 2.0);
        vec3 coeur = spectre * (0.75 + 0.25 * (1.0 - r));
        coeur += vec3(2.6, 2.5, 2.7) * exp(-r * r * mix(9.0, 30.0, smoothstep(6.0 * px, 30.0 * px, w)));
        coeur += vec3(2.0) * step(0.992, kzHm(floor(uv * kzRes / 2.0) + floor(t * 6.0))) * (1.0 - r);
        return mix(c, coeur, dedans);
      }
      /* un IMPACT : la porcelaine a reçu un choc ; des rayons de cassure partent d'un cratère lumineux (l'éclat le plus
         fort de la page), s'effilent en s'éloignant ; o (0 à 1) : ouverture ; R : longueur des rayons (en hauteurs
         d'écran) ; graine : forme. */
      vec3 impact(vec3 c, vec2 p, float R, float o, float graine, float t, vec2 uv, float px, float force) {
        if (o < 0.002) return c;
        float r = length(p);
        float a = atan(p.y, p.x);
        float N = 9.0;
        float secteur = 6.2831853 / N;
        float k0 = floor(a / secteur);
        float dmin = 1e5, lmin = 1.0, idr = 0.0, cote = 1.0;
        for (int i = -1; i <= 1; i++) {
          float k = k0 + float(i);
          float h = fract(sin(k * 91.7 + graine * 13.1) * 43758.5453);
          float th = (k + 0.5 + (h - 0.5) * 0.7) * secteur + 0.035 * kzBruitG(vec2(r * 9.0, k + graine)) + 0.012 * kzBruitG(vec2(r * 40.0, k));
          float L = R * (0.45 + 0.75 * fract(h * 7.31)) * o;
          float da = a - th; da = mod(da + 3.14159265, 6.2831853) - 3.14159265;
          float dr = abs(sin(da)) * r * kzRes.y;
          if (cos(da) < 0.0) dr = 1e5;
          if (dr < dmin) { dmin = dr; lmin = L; idr = h; cote = sin(da) > 0.0 ? 1.0 : -1.0; }
        }
        float le = clamp(1.0 - r / max(lmin, 1e-3), 0.0, 1.0);
        float w = (0.8 + 19.0 * pow(le, 2.2)) * px * smoothstep(0.0, 0.08, le) * force * (0.85 + 0.15 * sin(t * 1.1 + idr * 20.0));
        dmin += (kzBruitG(p * 40.0 + graine) * (1.4 + w * 0.15 / px) + kzBruitG(p * 95.0) * 0.8) * px;
        float teinte = idr * 0.8 + r * 0.6 + t * 0.03 + graine;
        c = fissure(c, dmin, cote, w, teinte, t, uv, px, force);
        // le cratère : un trou irrégulier où la lumière jaillit, et son éclat qui inonde la porcelaine
        float rc = 0.024 * o * (1.0 + 0.35 * kzBruitG(vec2(a * 1.6, graine)) + 0.15 * kzBruitG(vec2(a * 5.0, graine + 3.0)));
        float dc = (r - rc) * kzRes.y;
        vec3 lumi = clamp(pow(kzIris(t * 0.04 + graine + a * 0.16), vec3(1.5)) * 1.3, 0.0, 1.4);
        c = mix(c, c * (0.45 + 0.7 * lumi), exp(-max(dc, 0.0) / (260.0 * px)) * 0.8 * o * force);
        c += lumi * exp(-max(dc, 0.0) / (26.0 * px)) * 0.5 * o;
        float dedans = 1.0 - smoothstep(-0.8, 0.8, dc);
        vec2 qq = p * 22.0;
        vec3 liquide = clamp(pow(kzIris(kzBruitG(qq + vec2(t * 0.2, -t * 0.3)) * 0.8 + a * 0.16 + t * 0.05 + graine), vec3(1.5)) * 1.8, 0.0, 2.0);
        liquide += vec3(3.0) * exp(-r * r / max(rc * rc * 0.12, 1e-6));
        return mix(c, liquide, dedans * o);
      }
      vec3 failles(vec3 c, vec2 uv, float sol) {
        float asp = kzRes.x / kzRes.y;
        float px = kzRes.y / 900.0;
        float t = kzTps;
        // les fissures sont posées sur la paroi : elles montent avec la page
        vec2 q = vec2((uv.x - 0.5) * asp, uv.y) * 1.6 + vec2(0.0, (uDefile - 4.0) * 1.15);
        // les points d'impact : chaque fissure s'ouvre quand le front parti de l'un d'eux l'atteint
        float ouvre = 0.0;
        for (int i = 0; i < 4; i++) {
          float fi = float(i);
          vec2 P = vec2((fi == 1.0 ? -0.6 : fi == 3.0 ? -0.1 : 0.45 + 0.08 * fi) * asp * (asp < 1.0 ? 0.6 : 1.0), 0.7 - fi * 0.95) * 1.6;
          float R = clamp((uDefile - (3.98 + fi * 0.38)) / 0.5, 0.0, 1.8) * 2.2;
          ouvre = max(ouvre, smoothstep(R, R - 1.3, length(q - P)));
        }
        ouvre *= uFaille;
        if (ouvre < 0.002) return c;
        // côté des textes (à gauche en paysage) : des fissures plus fines, une lueur plus sage ; au téléphone, partout
        float force = uTexteG > 0.5 ? mix(0.4, 1.0, smoothstep(0.36, 0.66, uv.x)) : 0.6;
        // le réseau : cellules déformées (des cassures droites mais pas régulières), bords en dents de scie
        vec2 qv = q * 1.5;
        qv += vec2(kzBruitG(qv * 0.45 + 3.0), kzBruitG(qv * 0.45 + 9.0)) * 0.5 + vec2(kzBruitG(qv * 1.7), kzBruitG(qv * 1.7 + 4.0)) * 0.1;
        vec3 v = bordVoronoi(qv);
        float d = v.x / (1.6 * 1.5) * kzRes.y;
        float e = v.y;
        // une cassure sur trois reste une fêlure fermée ; les autres s'ouvrent, plus ou moins, en s'effilant
        float classe = smoothstep(0.18, 1.0, e);
        float effile = smoothstep(-0.35, 0.45, kzBruitG(q * 2.2 + e * 7.0));
        float respire = 0.78 + 0.22 * sin(t * (0.6 + e * 0.5) + e * 30.0);
        float w = (0.4 + 5.0 * classe + 30.0 * pow(classe, 5.0)) * effile * px * ouvre * respire * force;
        // les bords en dents de scie, d'autant plus marqués que la cassure est large
        d += (kzBruitG(q * 24.0 + e * 5.0) * (1.6 + w * 0.18 / px) + kzBruitG(q * 61.0) * 0.9) * px;
        // la fêlure fermée : un trait gris très fin (le craquelé de la glaçure)
        c = mix(c, vec3(0.42, 0.44, 0.52), (1.0 - smoothstep(0.3 * px, 1.1 * px, d)) * 0.6 * ouvre * (1.0 - smoothstep(0.6 * px, 2.0 * px, w)) * (0.4 + 0.6 * force));
        // la lumière d'un prisme : sa teinte glisse le long des cassures
        float teinte = e * 0.9 + q.x * 0.1 - q.y * 0.16 + t * 0.025 + uDefile * 0.12;
        vec3 lumi = clamp(pow(kzIris(teinte), vec3(1.5)) * 1.3, 0.0, 1.4);
        // chaque éclat de porcelaine a sa nuance : la surface semble cassée en plaques
        c *= 1.0 + (fract(e * 17.3 + v.z * 0.3) - 0.5) * 0.035 * ouvre;
        c = fissure(c, d, v.z, w, teinte, t, uv, px, force);
        // les impacts : le premier à droite dès « Osez rêver », le second plus bas ; ils montent avec la page
        vec2 ec = vec2((uv.x - 0.5) * asp, uv.y);
        float xi = uTexteG > 0.5 ? 0.3 * asp : 0.18;
        c = impact(c, ec - vec2(xi, 0.6 + (uDefile - 4.25) * 0.72), uTexteG > 0.5 ? 0.85 : 0.55, smoothstep(4.05, 4.4, uDefile) * uFaille, 0.37, t, uv, px, mix(0.7, 1.0, uTexteG));
        c = impact(c, ec - vec2(uTexteG > 0.5 ? 0.12 * asp : -0.12, 0.45 + (uDefile - 4.75) * 0.72), uTexteG > 0.5 ? 0.6 : 0.45, smoothstep(4.55, 4.85, uDefile) * uFaille, 0.81, t, uv, px, force);
        // au sol, la lumière des fissures se reflète en traînées douces
        c = mix(c, c * (0.72 + 0.42 * lumi), sol * exp(-max(d - w, 0.0) / (36.0 * px)) * 0.45 * smoothstep(0.0, 4.0 * px, w));
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
        c *= 1.0 - 0.05 * exp(-kzC2((d.y + 0.05) / 0.05));
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
        if (uFaille > 0.001) c = failles(c, uv, sol);
        return c * uClairTon;
      }

      void main() {
        vec2 fc = gl_FragCoord.xy;
        if (kzClair(fc) < 0.5) discard;
        ${DIRECTION}
        gl_FragColor = vec4(clair(fc, fc / kzRes, d), 1.0);
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
