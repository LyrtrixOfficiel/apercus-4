/* Kazura v13, la Scène : le fond, peint par un seul triangle plein écran.
   Trois mondes, choisis par pixel :
   - la salle de dalles (sombre) : un cylindre de grands carreaux noirs légèrement brillants, à joints
     fins, une grille fine, et la typographie géante projetée dessus, tramée de points de lumière
     comme un mur d'écrans ; la teinte d'ambiance (violet, couleur du site affiché, or) baigne les carreaux ;
   - le monde clair : gris très pâle, grille fine et croix, sous l'horizon courbe ;
   - la nuit indigo peinte (la partie « qui fait votre site ») : des courants de pinceau qui tournent en
     volutes autour de l'étoile et de quelques tourbillons, à la Van Gogh, et de petites étoiles.
   Les valeurs sont pensées avant le rendu filmique (ACES) : 1,0 donne un gris très clair. */
import { GLSL_BRUIT } from './commun.js';
import { GLSL_MASQUE, GLSL_SALLE, GLSL_TEXBRUIT, GLSL_RAMPE } from './glsl.js';

export function creerFond(THREE, U, { mobile }) {
  const u = {
    ...U,
    uInvProj: { value: new THREE.Matrix4() },
    uCamMonde: { value: new THREE.Matrix4() },
    uCamPos: { value: new THREE.Vector3() },
    uNuit: { value: 0 },          // part de la nuit peinte dans le monde sombre
    uLueur: { value: new THREE.Vector2(0.5, 0.55) }, // position écran de la lueur derrière le sceau
    uLueurForce: { value: 0.5 },
    uEtoile: { value: new THREE.Vector3(0.62, 0.55, 0.2) }, // position écran et rayon de l'étoile
    uClairTon: { value: 1 },
    uHaloOuv: { value: 0 },       // la lueur violette de la nuit d'ouverture (haut droit)
  };
  const m = new THREE.ShaderMaterial({
    uniforms: u, depthWrite: false, depthTest: false, fog: false,
    vertexShader: /* glsl */ `varying vec2 vNdc; void main() { vNdc = position.xy; gl_Position = vec4(position.xy, 1.0, 1.0); }`,
    fragmentShader: /* glsl */ `
      ${GLSL_TEXBRUIT}
      ${GLSL_RAMPE}
      ${GLSL_MASQUE}
      ${GLSL_SALLE}
      uniform mat4 uInvProj; uniform mat4 uCamMonde; uniform vec3 uCamPos;
      uniform float uNuit; uniform vec2 uLueur; uniform float uLueurForce; uniform vec3 uEtoile; uniform float uClairTon; uniform float uHaloOuv;
      varying vec2 vNdc;

      vec3 salle(vec3 o, vec3 d, vec2 uv) {
        float t = kzTouche(o, d);
        vec3 p = o + d * t;
        vec2 q = kzParoi(p);
        float aa = t * kzPixAng;
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

        // le carreau : presque noir, quelques-uns rallumés comme des écrans en veille
        vec3 c = vec3(0.004, 0.004, 0.006) + kzTeinte * (0.002 + 0.016 * hs * hs);
        c += kzTeinte * step(0.9, hs) * (0.03 + 0.02 * sin(kzTps * 0.7 + hs2 * 30.0));
        // le lustre : une bande de lumière réfléchie qui court sur la paroi, et le haut de chaque carreau
        float bande = exp(-pow((q.y - 2.8) / 1.2, 2.0)) * (0.4 + 0.6 * hs2);
        c += vec3(0.55, 0.55, 0.66) * (bande * 0.022 + pow(clamp(1.0 - f.y, 0.0, 1.0), 5.0) * 0.016);
        // la typographie projetée
        float m = kzMot(q, kzMotA.x, kzMotA.y, KZ_LETTRE, KZ_LIGNE_Y, kzMotDecal, 5.0);
        if (kzMotMix > 0.0) {
          float mb = kzMot(q, kzMotA.z, kzMotA.w, KZ_LETTRE, KZ_LIGNE_Y, kzMotDecal, 5.0);
          float yy = (q.y - KZ_LIGNE_Y) / KZ_LETTRE + 0.5;
          float wipe = smoothstep(-0.06, 0.06, kzMotMix * 1.25 - 0.12 - yy + (kzH21(vec2(floor(q.y * 3.0), 1.0)) - 0.5) * 0.12);
          m = mix(m, mb, wipe);
        }
        // deux rangées fantômes au-dessus et au-dessous, qui glissent en sens contraire
        float g1 = kzMot(q, 0.0, 4.3, 1.3, 2.9, -kzMotDecal * 0.6 + 3.0, 1.6);
        float g2 = 0.0;   // le tiers bas reste calme : la page y pose son titre
        // trame de points de lumière (mur d'écrans) : s'efface quand elle devient plus fine qu'un pixel
        vec2 gp = fract(q * 20.0) - 0.5;
        float pt = smoothstep(0.45, 0.15, length(gp));
        float vis = 1.0 - smoothstep(0.22, 0.4, aa * 20.0);
        float led = mix(0.9, 0.55 + 0.6 * pt, vis);
        vec3 encre = mix(vec3(0.62, 0.61, 0.7), kzTeinte * 1.1 + 0.2, 0.2);
        float lettre = m * kzMotForce + (g1 + g2) * kzMotForce * 0.1;
        c += encre * lettre * led * (0.85 + 0.3 * hs2);
        // grille fine posée sur la paroi
        vec2 gg = abs(fract(q / (W / 6.0)) - 0.5) * (W / 6.0);
        float grille = 1.0 - smoothstep(0.0, aa * 1.1 + 0.002, min(gg.x, gg.y));
        c += vec3(0.6, 0.62, 0.72) * grille * 0.022;
        c += vec3(0.55, 0.55, 0.65) * filet * 0.045;
        // lueur derrière le sceau
        vec2 dl = (uv - uLueur) * vec2(kzRes.x / kzRes.y, 1.0);
        c += kzTeinte * exp(-dot(dl, dl) * 4.0) * 0.1 * uLueurForce;
        c *= joint;
        // la salle s'enfonce dans le noir vers le haut et le bas
        c *= 0.08 + 0.92 * smoothstep(6.5, 1.6, abs(p.y - 0.3));
        // passage « profondeur » : la salle se teinte selon sa distance, une passe de lumière la traverse
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

      vec3 clair(vec2 fc, vec2 uv) {
        vec2 dv = (uv - vec2(0.5, 0.55)) * vec2(kzRes.x / kzRes.y, 1.0);
        vec3 c = mix(vec3(1.06, 1.11, 1.14), vec3(0.8, 0.85, 0.88), smoothstep(0.15, 1.05, length(dv)));
        float px = max(kzRes.y / 900.0, 0.75);
        float pas = 26.0 * px;
        vec2 g = abs(fract(fc / pas + 0.5) - 0.5) * pas;
        float fine = 1.0 - smoothstep(0.0, 1.0, min(g.x, g.y));
        c *= 1.0 - 0.05 * fine;
        float grand = pas * 7.0;
        vec2 h = abs(fract((fc - kzRes * 0.5) / grand + 0.5) - 0.5) * grand;
        float croix = (1.0 - smoothstep(0.5 * px, 1.3 * px + 0.5, min(h.x, h.y))) * step(max(h.x, h.y), 8.0 * px);
        c = mix(c, vec3(0.42, 0.45, 0.5), croix * 0.85);
        return c * uClairTon;
      }

      /* la nuit de « qui fait votre site » : l'estampe du labo (ciel bokashi au veinage de bois, brumes kasumi
         qui glissent, points d'encre dorée) et, par-dessus, les courants de pinceau à la Van Gogh qui tournent
         en volutes autour de l'étoile (réf. A) ; l'étoile elle-même est peinte par etoile.js */
      float capsule(vec2 p, vec2 a, float l, float r) { p -= a; p.x -= clamp(p.x, -l, l); return length(p) - r; }
      vec3 nuit(vec2 uv) {
        float asp = kzRes.x / kzRes.y;
        vec2 q = vec2(uv.x * asp, uv.y);
        float t = kzTps;
        // bokashi : le dégradé du graveur, indigo profond en haut, bleu de nuit en bas
        vec3 col = mix(vec3(0.075, 0.09, 0.24), vec3(0.016, 0.02, 0.07), smoothstep(0.05, 0.95, uv.y + 0.04 * sin(q.x * 3.0)));
        float bois = kzTB(vec2(q.x * 0.36 + kzTB(q * 0.5).r * 0.2, q.y * 9.5)).g;
        col *= 0.92 + 0.14 * bois;
        // les courants : lignes de niveau d'une fonction de courant (vent + tourbillons), en traits d'encre claire
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
        // brumes kasumi : des bandes aux bouts arrondis, en aplat, qui glissent
        for (int i = 0; i < 4; i++) {
          float fi = float(i);
          float y = 0.16 + fi * 0.22 + 0.01 * sin(t * 0.1 + fi);
          float x = fract(0.2 + fi * 0.37 + t * (0.004 + 0.002 * fi)) * (asp + 1.2) - 0.6;
          float l = 0.22 + 0.12 * fract(fi * 0.71);
          float dd = min(capsule(q, vec2(x, y), l, 0.022), capsule(q, vec2(x + l * 0.7, y - 0.035), l * 0.6, 0.018));
          vec3 cb = mix(vec3(0.18, 0.15, 0.40), vec3(0.32, 0.25, 0.55), 0.5 + 0.5 * sin(fi * 2.0));
          col = mix(col, cb * (0.85 + 0.15 * smoothstep(-0.02, 0.0, dd)), smoothstep(0.0015, -0.0015, dd) * 0.85);
        }
        // l'étoile dore ce qui l'entoure
        float de = length(p - ce);
        col = mix(col, col * vec3(1.5, 1.2, 0.6) + vec3(0.1, 0.06, 0.0) * trait, exp(-de / max(uEtoile.z * 1.6, 1e-3)) * 0.55);
        col += vec3(1.0, 0.62, 0.18) * exp(-de / max(uEtoile.z, 1e-3) * 1.8) * 0.06;
        // étoiles : points d'encre dorée, quelques cyan
        vec2 g = q * 26.0; vec2 ig = floor(g); float hp = kzHm(ig + 11.0);
        col = mix(col, mix(vec3(0.95, 0.84, 0.6), vec3(0.5, 0.92, 0.95), step(0.992, hp)), step(0.975, hp) * smoothstep(0.13, 0.06, length(fract(g) - 0.5)) * step(0.3, uv.y) * (0.75 + 0.25 * sin(t * (1.0 + hp * 3.0) + hp * 40.0)));
        // fibres du papier
        col *= 0.95 + 0.07 * kzTB(uv * vec2(9.0, 0.8)).a;
        return col;
      }

      void main() {
        vec2 fc = gl_FragCoord.xy;
        vec2 uv = fc / kzRes;
        float cl = kzClair(fc);
        vec3 col;
        if (cl > 0.5) {
          col = clair(fc, uv);
        } else {
          vec4 vv = uInvProj * vec4(vNdc, 1.0, 1.0);
          vec3 d = normalize((uCamMonde * vec4(vv.xyz / vv.w, 0.0)).xyz);
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
