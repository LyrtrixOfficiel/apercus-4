// Niveau 0 : le seuil Kazura. Un champ de nuit violet, la vague multicolore, des poussières d'étoiles,
// et un écran de verre qui flotte : le premier site s'y allume. On ne passe ici qu'au début.
import { THREE, U, BRUIT, particules, ruban, halo, porteRect } from './outils.js';

export function construire(ctx) {
  const { a, F } = ctx;
  const racine = new THREE.Group();
  const tanF = Math.tan(F / 2);

  // le fond : nébuleuse violette et jade, très sombre
  const fond = new THREE.Mesh(new THREE.SphereGeometry(300, 48, 24), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false, uniforms: { uT: U.temps },
    vertexShader: `precision highp float; varying vec3 vD; void main(){ vD = normalize(position); vec4 p = projectionMatrix*modelViewMatrix*vec4(position,1.0); gl_Position = p.xyww; }`,
    fragmentShader: `precision highp float; varying vec3 vD; uniform float uT; ${BRUIT}
      void main(){ vec3 d = normalize(vD); vec2 q = vec2(atan(d.x, -d.z), d.y*1.6);
        float n = fbm(q*2.2 + vec2(uT*0.01, 0.0)); float n2 = fbm(q*4.0 - 3.0 + n);
        vec3 c = vec3(0.012, 0.010, 0.030);
        c += vec3(0.20, 0.09, 0.42) * pow(n, 2.6) * 0.9;
        c += vec3(0.02, 0.30, 0.22) * pow(n2, 4.0) * 0.6 * smoothstep(0.2, -0.4, d.y);
        c += vec3(0.55, 0.25, 0.65) * pow(max(0.0, 1.0 - length(q - vec2(0.0, -0.1))*0.8), 3.0) * 0.35;
        vec2 g = q*140.0; vec2 i = floor(g); float h = h21(i);
        c += vec3(0.9, 0.85, 1.0) * step(0.992, h) * smoothstep(0.45, 0.0, length(fract(g)-0.5)) * (0.6 + 0.4*sin(uT*1.5 + h*90.0));
        gl_FragColor = vec4(c, 1.0); }`,
  }));
  fond.renderOrder = -10; fond.frustumCulled = false;
  racine.add(fond);

  // l'écran : il occupe environ 38 % de la hauteur vue du départ
  const D = 7.5, hh = 0.36 * D * tanF;
  const cadre = new THREE.Group();
  cadre.position.set(0.25, 0.05, -D);
  cadre.rotation.set(-0.08, -0.32, 0.02);
  racine.add(cadre);
  const { mesh, porte } = porteRect(hh, a, { fond: ctx.fondSuivant });
  mesh.position.z = 0.001;
  cadre.add(mesh);
  // le verre : une plaque fine, un liseré irisé, une lueur derrière
  const w = 2 * hh * a, e = hh * 0.035;
  const bord = new THREE.Mesh(new THREE.PlaneGeometry(w + e * 2, 2 * hh + e * 2), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
    uniforms: { uT: U.temps, uW: { value: w + e * 2 }, uH: { value: 2 * hh + e * 2 }, uE: { value: e } },
    vertexShader: `precision highp float; varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `precision highp float; varying vec2 vUv; uniform float uT, uW, uH, uE;
      void main(){ vec2 p = (vUv - 0.5)*vec2(uW, uH); vec2 b = vec2(uW, uH)*0.5 - uE;
        vec2 dq = abs(p) - b; float d = length(max(dq, 0.0)) + min(max(dq.x, dq.y), 0.0);
        float ligne = smoothstep(uE*0.9, 0.0, abs(d)) ;
        float ang = atan(p.y, p.x)/6.2831 + uT*0.05;
        vec3 c = 0.5 + 0.5*cos(6.2831*(ang + vec3(0.0, 0.33, 0.67)));
        gl_FragColor = vec4(mix(c, vec3(0.8, 0.95, 0.9), 0.2) * ligne * 1.6, ligne); }`,
  }));
  bord.position.z = 0.002;
  cadre.add(bord);
  const lueur = halo('#8f6bff', hh * 6.5, 0.55); lueur.position.set(0, 0, -0.3); cadre.add(lueur);
  const lueur2 = halo('#2ee6a8', hh * 4, 0.25); lueur2.position.set(-hh * a * 0.8, -hh * 0.7, -0.2); cadre.add(lueur2);

  // la vague multicolore, qui passe derrière l'écran
  const r1 = ruban({ longueur: 26, largeur: 2.2, amplitude: 1.1, opacite: 0.55 });
  r1.position.set(0, -0.6, -D - 2.4); r1.rotation.set(-0.25, 0.15, -0.12);
  racine.add(r1);
  const r2 = ruban({ longueur: 22, largeur: 1.1, amplitude: 0.7, opacite: 0.35, decalage: 2.1 });
  r2.position.set(0.5, 1.4, -D - 5); r2.rotation.set(0.2, -0.3, 0.18);
  racine.add(r2);

  // poussières d'étoiles en profondeur
  racine.add(particules({ n: ctx.mobile ? 500 : 900, min: [-9, -6, -D - 9], max: [9, 6, -0.5], couleur: '#d9ccff', couleur2: '#9ff5d6', taille: 0.018, vitesse: [0, 0.03, 0.05], tremble: 0.12, scintille: 0.6 }));
  racine.add(particules({ n: 40, min: [-7, -4, -D - 8], max: [7, 4, -D + 3], couleur: '#a78bfa', couleur2: '#34d399', taille: 0.22, forme: 'bokeh', opacite: 0.22, vitesse: [0.02, 0.01, 0], tremble: 0.3 }));

  // le chemin : on s'approche en glissant un peu, l'écran se redresse devant nous
  const chemin = [
    { p: [0, 0, 0], c: [0, 0, -D] },
    { p: [-0.35, 0.1, -D * 0.45], c: cadre.position.toArray() },
  ];
  return {
    racine, porte, chemin, sansPage: true, fondScene: new THREE.Color('#05040c'),
    maj(t, e) { cadre.position.y = 0.05 + Math.sin(t * 0.6) * 0.03 * (1 - e.sigma); bord.material.opacity = 1; },
  };
}
