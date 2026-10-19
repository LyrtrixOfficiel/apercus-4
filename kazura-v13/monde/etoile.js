/* Kazura v13, la Scène : l'étoile dorée peinte (la partie « qui fait votre site »).
   Une carte tournée vers la caméra, peinte par le nuanceur : une étoile à cinq branches charnues,
   un peu irrégulières comme à la main, un or chaud du cœur vers les pointes, des spirales tracées au
   pinceau à l'intérieur, un halo. On peut l'attraper : elle se penche vers le doigt ou la souris,
   et un toucher la fait tourner et lâcher une gerbe de petites étoiles. */
import { GLSL_MASQUE } from './glsl.js';

export function creerEtoile(THREE, { U }) {
  const u = { uTemps: { value: 0 }, uInt: { value: 0 }, uTourne: { value: 0 }, uPulse: { value: 0 }, ...U };
  const m = new THREE.ShaderMaterial({
    uniforms: u, transparent: true, premultipliedAlpha: true, depthWrite: false, depthTest: false,
    vertexShader: /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      ${GLSL_MASQUE}
      uniform float uTemps; uniform float uInt; uniform float uTourne; uniform float uPulse;
      varying vec2 vUv;
      float etoile(vec2 p, float r, float creux) {
        float a = atan(p.y, p.x) + uTourne;
        float l = length(p);
        // cinq branches, bombées, chacune un peu différente
        float k = cos(5.0 * a);
        float irr = 1.0 + 0.06 * sin(a * 2.0 + 1.3) + 0.04 * sin(a * 3.0 + uTemps * 0.6);
        float rayon = r * irr * mix(creux, 1.0, pow(0.5 + 0.5 * k, 2.4));
        return l - rayon;
      }
      void main() {
        if (kzClair(gl_FragCoord.xy) > 0.5) discard;
        vec2 p = (vUv - 0.5) * 2.0;
        float d = etoile(p, 0.52 * (1.0 + 0.04 * sin(uTemps * 1.4) + uPulse * 0.12), 0.5);
        float l = length(p);
        float a = atan(p.y, p.x) + uTourne;
        // pinceau : bord frémissant
        float frange = kzNm(vec2(a * 9.0, l * 14.0) + uTemps * 0.3) - 0.5;
        float dd = d + frange * 0.025;
        float dans = 1.0 - smoothstep(-0.006, 0.012, dd);
        // or : clair au cœur, plus chaud vers les pointes
        vec3 or1 = vec3(1.0, 0.86, 0.42), or2 = vec3(1.0, 0.62, 0.1), or3 = vec3(0.85, 0.36, 0.04);
        vec3 c = mix(or1, or2, smoothstep(0.0, 0.32, l));
        c = mix(c, or3, smoothstep(-0.12, 0.0, d) * 0.6);
        // spirales intérieures au pinceau
        float sp = sin(a * 3.0 + log(l + 0.02) * 9.0 - uTemps * 0.5 + kzNm(p * 6.0) * 2.0);
        float trait = smoothstep(0.82, 0.98, sp) * smoothstep(0.03, 0.12, l);
        c = mix(c, vec3(1.0, 1.0, 0.86), trait * 0.55);
        float sp2 = sin(-a * 2.0 + log(l + 0.02) * 13.0 + uTemps * 0.3);
        c = mix(c, vec3(0.92, 0.6, 0.18), smoothstep(0.9, 0.99, sp2) * 0.35 * smoothstep(0.1, 0.3, l));
        // contour sombre doré, très fin, comme un trait d'encre
        float bord = (1.0 - smoothstep(0.0, 0.016, abs(dd + 0.006))) * 0.55;
        c = mix(c, vec3(0.78, 0.42, 0.08), bord);
        // halo
        float halo = exp(-max(d, 0.0) * 9.0) * 0.45 + exp(-max(d, 0.0) * 30.0) * 0.5;
        vec3 col = c * dans * 0.72 + vec3(1.0, 0.6, 0.15) * halo * 0.32 * (1.0 - dans) * (1.0 + uPulse);
        float alpha = clamp(dans + halo * 0.9, 0.0, 1.0);
        gl_FragColor = vec4(col * uInt, alpha * uInt);
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), m);
  mesh.renderOrder = 18;
  mesh.frustumCulled = false;
  return { mesh, u };
}
