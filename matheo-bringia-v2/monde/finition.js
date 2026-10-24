/* La passe de finition (sur l'image linéaire, avant le rendu filmique) :
   - la VISIÈRE : une visière de casque fumée et iridium traverse l'écran de bas en haut ; la piste s'y reflète
     (image retournée et bombée), joint de caoutchouc noir aux bords, reflet net qui glisse ;
   - le flash du podium, la teinte du tunnel orange ;
   - le flou de vitesse (zoom radial) et l'aberration aux bords quand on défile vite ;
   - le vignettage et un grain de film fin. */
import { HP } from './commun.js';

export function creerFinition(THREE) {
  return {
    uniforms: {
      tDiffuse: { value: null }, uRes: { value: new THREE.Vector2(1, 1) }, uTemps: { value: 0 },
      uVisiere: { value: -1 }, uFlash: { value: 0 }, uTunnel: { value: 0 }, uVitesse: { value: 0 }, uDoux: { value: 0 },
      uVignette: { value: 1 }, uFondu: { value: 0 },
    },
    vertexShader: HP + 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: HP + `
      uniform sampler2D tDiffuse; uniform vec2 uRes; uniform float uTemps, uVisiere, uFlash, uTunnel, uVitesse, uDoux, uVignette, uFondu;
      varying vec2 vUv;
      float h(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
      void main() {
        vec2 uv = vUv;
        float asp = uRes.x / uRes.y;
        vec2 c = uv - 0.5;
        // flou de vitesse : quelques échantillons vers le centre, plus forts aux bords
        float v = uVitesse * (1.0 - 0.6 * uDoux);
        vec3 col = texture2D(tDiffuse, uv).rgb;
        if (v > 0.01) {
          float r = length(c * vec2(asp, 1.0));
          float k = v * 0.045 * smoothstep(0.15, 0.75, r);
          vec3 s = col;
          for (int i = 1; i < 6; i++) s += texture2D(tDiffuse, uv - c * k * float(i) / 5.0).rgb;
          col = s / 6.0;
          // aberration chromatique aux bords
          float ab = v * 0.004 * r;
          col.r = mix(col.r, texture2D(tDiffuse, uv + c * ab).r, 0.6);
          col.b = mix(col.b, texture2D(tDiffuse, uv - c * ab).b, 0.6);
        }
        // la visière : une bande bombée qui monte ; uVisiere de 0 (sous l'écran) à 1 (au-dessus)
        if (uVisiere > 0.0 && uVisiere < 1.0) {
          float x = (uv.x - 0.5) * asp;
          float bombe = 0.16 * x * x / max(asp * asp * 0.25, 0.25);
          float centre = mix(-0.45, 1.45, uVisiere);
          float haut = centre + 0.3 - bombe, bas = centre - 0.3 - bombe * 0.6;
          float dedans = smoothstep(bas - 0.002, bas + 0.002, uv.y) * smoothstep(haut + 0.002, haut - 0.002, uv.y);
          if (dedans > 0.0) {
            // le reflet : l'image retournée autour du milieu de la visière, comprimée et bombée
            float t = (uv.y - bas) / max(haut - bas, 1e-3);
            vec2 ru = vec2(0.5 + (uv.x - 0.5) * (0.78 + 0.22 * t * t) , clamp(0.62 - (t - 0.5) * 0.85 - x * x * 0.05, 0.0, 1.0));
            vec3 ref = texture2D(tDiffuse, ru).rgb;
            // iridium : orange, or, violet selon la hauteur et l'angle
            vec3 iri = mix(vec3(1.0, 0.42, 0.08), vec3(1.0, 0.75, 0.25), smoothstep(0.2, 0.8, t + x * 0.15));
            iri = mix(iri, vec3(0.55, 0.25, 0.9), smoothstep(0.75, 1.0, t) * 0.6);
            vec3 vis = col * 0.18 + ref * iri * 0.9;
            // le reflet net qui glisse en diagonale
            float rf = exp(-(((uv.x + (uv.y - bas) * 0.9 - 0.15 - uVisiere * 0.9) * 26.0) * ((uv.x + (uv.y - bas) * 0.9 - 0.15 - uVisiere * 0.9) * 26.0))) + 0.35 * exp(-(((uv.x + (uv.y - bas) * 0.9 - 0.26 - uVisiere * 0.9) * 60.0) * ((uv.x + (uv.y - bas) * 0.9 - 0.26 - uVisiere * 0.9) * 60.0)));
            vis += vec3(1.0, 0.92, 0.85) * rf * 0.16 * (1.0 - 0.5 * uDoux);
            col = mix(col, vis, dedans);
          }
          // les joints de caoutchouc en haut et en bas
          float jh = exp(-(((uv.y - haut) * uRes.y / 7.0) * ((uv.y - haut) * uRes.y / 7.0))), jb = exp(-(((uv.y - bas) * uRes.y / 9.0) * ((uv.y - bas) * uRes.y / 9.0)));
          col = mix(col, vec3(0.004), max(jh, jb) * 0.92);
          col += vec3(1.0, 0.5, 0.2) * exp(-(((uv.y - haut - 5.0 / uRes.y) * uRes.y / 1.6) * ((uv.y - haut - 5.0 / uRes.y) * uRes.y / 1.6))) * 0.35;
        }
        // le tunnel orange
        col = mix(col, col * vec3(1.15, 0.72, 0.5) + vec3(0.03, 0.008, 0.0), uTunnel * 0.5);
        // vignettage
        float vg = 1.0 - smoothstep(0.35, 0.95, length(c * vec2(asp > 1.0 ? 1.0 : 1.25, 1.0)) * 1.05);
        col *= mix(1.0, 0.55 + 0.45 * vg, uVignette);
        // le bas de l'écran (le bitume tout proche) un peu plus sombre, surtout en portrait : la nuit et les textes
        col *= 1.0 - (0.18 + 0.2 * step(asp, 1.0)) * smoothstep(0.42, 0.0, uv.y);
        // le flash du podium (chaud, puis blanc)
        col = mix(col, vec3(2.6, 2.3, 1.9), uFlash);
        // grain de film fin
        float g = h(uv * uRes + fract(uTemps * 37.0) * 91.0) - 0.5;
        col += g * 0.012 * (0.4 + col);
        col = max(col, 0.0) * (1.0 - uFondu);
        gl_FragColor = vec4(col, 1.0);
      }`,
  };
}

/* l'environnement de studio, procédural (aucun fichier) : nuit sombre, deux boîtes à lumière blanches au-dessus, un
   long néon sur le côté, la lueur orange de l'horizon. Il donne leurs reflets aux matières du MB. */
export function creerEnvironnement(THREE, renderer) {
  const sc = new THREE.Scene();
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    vertexShader: HP + 'varying vec3 vD; void main(){ vD = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: HP + `varying vec3 vD;
      float boite(vec3 d, vec3 axe, vec2 taille, float dur) {
        vec3 a = normalize(axe); float f = dot(d, a); if (f < 0.5) return 0.0;
        vec3 u = normalize(cross(a, abs(a.y) > 0.9 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0))), v = cross(a, u);
        vec2 q = vec2(dot(d, u), dot(d, v)) / f;
        vec2 e = smoothstep(taille + dur, taille - dur, abs(q));
        return e.x * e.y;
      }
      void main(){
        vec3 d = normalize(vD);
        vec3 c = mix(vec3(0.02, 0.018, 0.022), vec3(0.008, 0.01, 0.02), smoothstep(-0.2, 0.6, d.y));
        c += vec3(1.0, 0.35, 0.06) * exp(-abs(d.y - 0.02) * 14.0) * 0.45;
        c += vec3(0.25, 0.08, 0.02) * exp(-abs(d.y) * 4.0) * 0.4;
        c += vec3(1.0, 0.97, 0.93) * boite(d, vec3(-0.5, 0.9, 0.6), vec2(0.38, 0.22), 0.04) * 3.2;
        c += vec3(0.95, 0.97, 1.0) * boite(d, vec3(0.7, 0.7, 0.4), vec2(0.18, 0.4), 0.03) * 2.4;
        c += vec3(1.0, 0.98, 0.95) * boite(d, vec3(0.0, 0.25, -1.0), vec2(1.2, 0.025), 0.01) * 3.0;
        c += vec3(0.5, 0.6, 1.0) * boite(d, vec3(-1.0, 0.1, -0.2), vec2(0.06, 0.6), 0.02) * 2.0;
        c += vec3(1.0, 0.4, 0.1) * boite(d, vec3(0.9, -0.1, -0.5), vec2(0.5, 0.05), 0.02) * 1.6;
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  sc.add(new THREE.Mesh(new THREE.SphereGeometry(10, 48, 24), mat));
  const pm = new THREE.PMREMGenerator(renderer);
  const rt = pm.fromScene(sc, 0.0);
  pm.dispose();
  mat.dispose();
  return rt;
}
