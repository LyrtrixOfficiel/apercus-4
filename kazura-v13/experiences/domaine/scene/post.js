// Le domaine Kazura : la chaîne d'image.
// scène (HDR, multi-échantillonnée sur ordinateur, avec profondeur) -> profondeur de champ (disque de Vogel,
// le flou d'avant-plan déborde, l'arrière-plan ne bave pas sur le net) -> halo (chaîne de mips maison, ronde et stable) ->
// rayons de lumière (flou radial vers le soleil, au quart de la taille) -> finition (ACES, étalonnage,
// vignettage, aberration discrète, grain, fondu enchaîné entre les plans).

const QUAD_VS = 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';

export function creerChaine(THREE, renderer, { mobile }) {
  const Q = { dof: !mobile, rayons: true, profondeur: !mobile, msaa: mobile ? 0 : 4 };
  const camOrtho = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
  quad.frustumCulled = false;
  const sceneQuad = new THREE.Scene();
  sceneQuad.add(quad);
  const passe = (mat, cible) => { quad.material = mat; renderer.setRenderTarget(cible); renderer.render(sceneQuad, camOrtho); };

  // cibles en demi-flottants si le GPU sait y dessiner (presque partout) ; sinon 8 bits, l'image reste juste
  const gl = renderer.getContext();
  const hdr = !!(gl.getExtension('EXT_color_buffer_float') || gl.getExtension('EXT_color_buffer_half_float'));
  const TYPE = hdr ? THREE.HalfFloatType : THREE.UnsignedByteType;
  const opt = { type: TYPE, depthBuffer: false };
  const prof = Q.profondeur ? new THREE.DepthTexture(4, 4) : null;
  const rtScene = new THREE.WebGLRenderTarget(4, 4, { type: TYPE, samples: Q.msaa, depthBuffer: true, depthTexture: prof });
  const rtDof = new THREE.WebGLRenderTarget(4, 4, opt);
  const rtRayons = new THREE.WebGLRenderTarget(4, 4, opt);
  const rtPrec = new THREE.WebGLRenderTarget(4, 4, { depthBuffer: false });
  rtDof.texture.minFilter = rtRayons.texture.minFilter = THREE.LinearFilter;

  const matDof = new THREE.ShaderMaterial({
    uniforms: { tCouleur: { value: rtScene.texture }, tProf: { value: prof }, uTexel: { value: new THREE.Vector2() }, uFocus: { value: 20 }, uOuv: { value: 1 }, uMax: { value: 8 }, uNear: { value: 0.08 }, uFar: { value: 6000 } },
    vertexShader: QUAD_VS,
    defines: { N: 28 },
    depthTest: false, depthWrite: false,
    fragmentShader: /* glsl */`
      uniform sampler2D tCouleur; uniform sampler2D tProf; uniform vec2 uTexel;
      uniform float uFocus; uniform float uOuv; uniform float uMax; uniform float uNear; uniform float uFar;
      varying vec2 vUv;
      float lin(float d) { float z = d * 2.0 - 1.0; return 2.0 * uNear * uFar / (uFar + uNear - z * (uFar - uNear)); }
      float coc(float z) { return min(uOuv * abs(1.0 - uFocus / z), uMax); }
      void main() {
        vec3 c0 = texture2D(tCouleur, vUv).rgb;
        float z0 = lin(texture2D(tProf, vUv).r);
        float r0 = coc(z0);
        vec3 acc = c0; float ws = 1.0;
        for (int i = 0; i < N; i++) {
          float fi = float(i) + 0.5;
          float rr = sqrt(fi / float(N)) * uMax;
          float a = fi * 2.39996;
          vec2 uv = vUv + vec2(cos(a), sin(a)) * rr * uTexel;
          vec3 c = texture2D(tCouleur, uv).rgb;
          float z = lin(texture2D(tProf, uv).r);
          float r = coc(z);
          float porte = z < z0 ? r : min(r, r0);
          float w = smoothstep(rr - 1.2, rr + 0.6, porte);
          acc += c * w; ws += w;
        }
        gl_FragColor = vec4(acc / ws, 1.0);
      }`,
  });

  const matRayons = new THREE.ShaderMaterial({
    uniforms: { tCouleur: { value: rtScene.texture }, tProf: { value: prof }, uSource: { value: new THREE.Vector2(0.5, 0.8) }, uSeuil: { value: 1.2 } },
    vertexShader: QUAD_VS,
    defines: { N: mobile ? 16 : 36, PROF: Q.profondeur ? 1 : 0 },
    depthTest: false, depthWrite: false,
    fragmentShader: /* glsl */`
      uniform sampler2D tCouleur; uniform sampler2D tProf; uniform vec2 uSource; uniform float uSeuil;
      varying vec2 vUv;
      float h(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
      vec3 lumineux(vec2 uv) {
        vec3 c = texture2D(tCouleur, uv).rgb;
        #if PROF
          float ciel = step(0.99999, texture2D(tProf, uv).r);
        #else
          float ciel = 1.0;
        #endif
        float l = dot(c, vec3(0.3, 0.55, 0.15));
        return c * ciel * smoothstep(uSeuil * 0.5, uSeuil * 1.5, l);
      }
      void main() {
        vec2 d = (uSource - vUv) / float(N) * 0.85;
        vec2 uv = vUv + d * (0.5 + 0.35 * (h(gl_FragCoord.xy) - 0.5));
        vec3 acc = vec3(0.0); float poids = 1.0;
        for (int i = 0; i < N; i++) { acc += lumineux(uv) * poids; poids *= 0.955; uv += d; }
        gl_FragColor = vec4(acc / float(N), 1.0);
      }`,
  });

  const matFin = new THREE.ShaderMaterial({
    uniforms: {
      tImage: { value: null }, tHalo: { value: null }, uHalo: { value: 0 }, tRayons: { value: rtRayons.texture }, tPrec: { value: rtPrec.texture },
      uExpo: { value: 1 }, uSat: { value: 1 }, uContraste: { value: 1 }, uLift: { value: new THREE.Color(0, 0, 0) }, uGain: { value: new THREE.Color(1, 1, 1) },
      uRayons: { value: 0 }, uRayCoul: { value: new THREE.Color(1, 0.8, 0.5) }, uFondu: { value: 1 }, uTemps: { value: 0 },
      uRes: { value: new THREE.Vector2(1, 1) }, uTexR: { value: new THREE.Vector2(0.01, 0.01) }, uGrain: { value: mobile ? 0.025 : 0.032 }, uVignette: { value: 0.32 }, uCA: { value: mobile ? 0 : 1 },
    },
    vertexShader: QUAD_VS,
    depthTest: false, depthWrite: false,
    fragmentShader: /* glsl */`
      uniform sampler2D tImage; uniform sampler2D tRayons; uniform sampler2D tPrec; uniform sampler2D tHalo; uniform float uHalo;
      uniform float uExpo; uniform float uSat; uniform float uContraste; uniform vec3 uLift; uniform vec3 uGain;
      uniform float uRayons; uniform vec3 uRayCoul; uniform float uFondu; uniform float uTemps; uniform vec2 uRes;
      uniform float uGrain; uniform float uVignette; uniform float uCA; uniform vec2 uTexR;
      varying vec2 vUv;
      vec3 aces(vec3 x) { return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
      vec3 srgb(vec3 c) { return mix(c * 12.92, 1.055 * pow(max(c, vec3(0.0)), vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
      float h(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
      void main() {
        vec2 q = vUv - 0.5;
        vec2 ca = q * dot(q, q) * 0.012 * uCA;
        vec3 c = vec3(texture2D(tImage, vUv + ca).r, texture2D(tImage, vUv).g, texture2D(tImage, vUv - ca).b);
        c += texture2D(tHalo, vUv).rgb * uHalo;
        if (uRayons > 0.001) {
          vec3 r = texture2D(tRayons, vUv + uTexR * vec2(1.2, 0.4)).rgb + texture2D(tRayons, vUv - uTexR * vec2(1.2, 0.4)).rgb
                 + texture2D(tRayons, vUv + uTexR * vec2(-0.4, 1.2)).rgb + texture2D(tRayons, vUv - uTexR * vec2(-0.4, 1.2)).rgb;
          c += r * 0.25 * uRayCoul * uRayons;
        }
        c *= uExpo;
        c = srgb(aces(c));
        c = c * uGain + uLift * (1.0 - c);
        float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
        c = mix(vec3(l), c, uSat);
        c = clamp((c - 0.45) * uContraste + 0.45, 0.0, 1.0);
        vec2 qa = q * vec2(uRes.x / uRes.y, 1.0);
        c *= 1.0 - uVignette * smoothstep(0.35, 1.05, length(qa));
        vec2 px = floor(vUv * uRes);
        float g = h(px + fract(uTemps * 7.13) * vec2(91.7, 37.3)) + h(px * 1.3 + fract(uTemps * 3.7) * vec2(13.1, 71.9)) - 1.0;
        c += g * uGrain * (0.5 + 0.5 * (1.0 - l));
        if (uFondu < 0.999) c = mix(texture2D(tPrec, vUv).rgb, c, uFondu);
        gl_FragColor = vec4(c, 1.0);
      }`,
  });

  /* le halo : 13 points en descendant (le premier avec seuil doux et moyenne de Karis), tente en remontant */
  const NM = mobile ? 5 : 6;
  const mips = Array.from({ length: NM }, () => { const t = new THREE.WebGLRenderTarget(4, 4, opt); t.texture.minFilter = THREE.LinearFilter; return t; });
  const FS13 = /* glsl */`
    uniform sampler2D tSrc; uniform vec2 uTexel; uniform float uSeuil; uniform float uPremier;
    varying vec2 vUv;
    vec3 s(vec2 o) { return texture2D(tSrc, vUv + o * uTexel).rgb; }
    vec3 karis(vec3 a, vec3 b, vec3 c, vec3 d) {
      if (uPremier < 0.5) return (a + b + c + d) * 0.25;
      float wa = 1.0 / (1.0 + dot(a, vec3(0.3, 0.55, 0.15))), wb = 1.0 / (1.0 + dot(b, vec3(0.3, 0.55, 0.15)));
      float wc = 1.0 / (1.0 + dot(c, vec3(0.3, 0.55, 0.15))), wd = 1.0 / (1.0 + dot(d, vec3(0.3, 0.55, 0.15)));
      return (a * wa + b * wb + c * wc + d * wd) / (wa + wb + wc + wd);
    }
    void main() {
      vec3 A = s(vec2(-2.0, -2.0)), B = s(vec2(0.0, -2.0)), C = s(vec2(2.0, -2.0));
      vec3 D = s(vec2(-1.0, -1.0)), E = s(vec2(1.0, -1.0));
      vec3 F = s(vec2(-2.0, 0.0)), G = s(vec2(0.0)), H = s(vec2(2.0, 0.0));
      vec3 I = s(vec2(-1.0, 1.0)), J = s(vec2(1.0, 1.0));
      vec3 K = s(vec2(-2.0, 2.0)), L = s(vec2(0.0, 2.0)), M = s(vec2(2.0, 2.0));
      vec3 c = karis(D, E, I, J) * 0.5 + (karis(A, B, G, F) + karis(B, C, H, G) + karis(F, G, L, K) + karis(G, H, M, L)) * 0.125;
      if (uPremier > 0.5) {
        float l = max(c.r, max(c.g, c.b));
        float genou = uSeuil * 0.5;
        float doux = clamp(l - uSeuil + genou, 0.0, 2.0 * genou);
        doux = doux * doux / (4.0 * genou + 1e-4);
        c *= max(doux, l - uSeuil) / max(l, 1e-4);
      }
      gl_FragColor = vec4(c, 1.0);
    }`;
  const matDescend = new THREE.ShaderMaterial({ uniforms: { tSrc: { value: null }, uTexel: { value: new THREE.Vector2() }, uSeuil: { value: 1 }, uPremier: { value: 0 } }, vertexShader: QUAD_VS, fragmentShader: FS13, depthTest: false, depthWrite: false });
  const matMonte = new THREE.ShaderMaterial({
    uniforms: { tSrc: { value: null }, uTexel: { value: new THREE.Vector2() }, uPoids: { value: 1 } },
    vertexShader: QUAD_VS, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending, transparent: true,
    fragmentShader: /* glsl */`
      uniform sampler2D tSrc; uniform vec2 uTexel; uniform float uPoids; varying vec2 vUv;
      vec3 s(vec2 o) { return texture2D(tSrc, vUv + o * uTexel).rgb; }
      void main() {
        vec3 c = s(vec2(-1.0, -1.0)) + 2.0 * s(vec2(0.0, -1.0)) + s(vec2(1.0, -1.0))
               + 2.0 * s(vec2(-1.0, 0.0)) + 4.0 * s(vec2(0.0)) + 2.0 * s(vec2(1.0, 0.0))
               + s(vec2(-1.0, 1.0)) + 2.0 * s(vec2(0.0, 1.0)) + s(vec2(1.0, 1.0));
        gl_FragColor = vec4(c / 16.0 * uPoids, 1.0);
      }`,
  });
  function halo(source, seuil) {
    let src = source.texture, w = source.width, h = source.height;
    for (let i = 0; i < NM; i++) {
      const u = matDescend.uniforms;
      u.tSrc.value = src; u.uTexel.value.set(1 / w, 1 / h); u.uPremier.value = i === 0 ? 1 : 0; u.uSeuil.value = seuil;
      passe(matDescend, mips[i]);
      src = mips[i].texture; w = mips[i].width; h = mips[i].height;
    }
    const auto = renderer.autoClear;
    renderer.autoClear = false;
    for (let i = NM - 1; i > 0; i--) {
      const u = matMonte.uniforms;
      u.tSrc.value = mips[i].texture; u.uTexel.value.set(1 / mips[i].width, 1 / mips[i].height); u.uPoids.value = 0.85;
      passe(matMonte, mips[i - 1]);
    }
    renderer.autoClear = auto;
    return mips[0].texture;
  }

  let W = 4, H = 4;
  function taille(w, h) {
    W = Math.max(4, Math.round(w)); H = Math.max(4, Math.round(h));
    rtScene.setSize(W, H);
    rtDof.setSize(W, H);
    rtPrec.setSize(W, H);
    const dr = mobile ? 4 : 2;
    rtRayons.setSize(Math.max(4, Math.round(W / dr)), Math.max(4, Math.round(H / dr)));
    let mw = W, mh = H;
    for (const m of mips) { mw = Math.max(2, Math.round(mw / 2)); mh = Math.max(2, Math.round(mh / 2)); m.setSize(mw, mh); }
    matDof.uniforms.uTexel.value.set(1 / W, 1 / H);
    matFin.uniforms.uRes.value.set(W, H);
    matFin.uniforms.uTexR.value.set(1 / rtRayons.width, 1 / rtRayons.height);
  }

  const v = new THREE.Vector3();
  /**
   * Rend une image.
   * r : { scene, camera, P (palette), focus, ouv, fondu, temps, copierPrecedent, soleilDir }
   */
  function rendre(r) {
    const { scene, camera, P } = r;
    renderer.setRenderTarget(rtScene);
    renderer.render(scene, camera);
    let image = rtScene;
    const k = H / 900;
    if (Q.dof && prof) {
      const u = matDof.uniforms;
      u.uFocus.value = r.focus; u.uOuv.value = r.ouv * k; u.uMax.value = Math.max(1.5, Math.min(10, r.ouv * 2.4) * k);
      u.uNear.value = camera.near; u.uFar.value = camera.far;
      passe(matDof, rtDof);
      image = rtDof;
    }
    matFin.uniforms.tHalo.value = halo(image, P.seuil);
    matFin.uniforms.uHalo.value = P.bloom * 0.55;
    // rayons : vers le soleil, ou la lune la nuit
    let force = 0;
    if (Q.rayons && P.rayons > 0.01) {
      const src = r.soleilDir;
      v.copy(camera.position).addScaledVector(src, 1000).project(camera);
      const devant = v.z < 1;
      const sx = v.x * 0.5 + 0.5, sy = v.y * 0.5 + 0.5;
      const hors = Math.max(0, Math.abs(sx - 0.5) - 0.5, Math.abs(sy - 0.5) - 0.5);
      force = devant ? P.rayons * Math.max(0, 1 - hors * 2.2) : 0;
      if (force > 0.01) {
        matRayons.uniforms.uSource.value.set(sx, sy);
        matRayons.uniforms.uSeuil.value = P.h > 0.7 ? 0.6 : 0.9;
        matRayons.uniforms.tCouleur.value = rtScene.texture;
        passe(matRayons, rtRayons);
      }
    }
    const f = matFin.uniforms;
    f.tImage.value = image.texture;
    f.uExpo.value = P.expo; f.uSat.value = P.sat; f.uContraste.value = P.contraste;
    f.uLift.value.copy(P.lift); f.uGain.value.copy(P.gain);
    f.uRayons.value = force * 0.9; f.uRayCoul.value.copy(P.cielSoleil).multiplyScalar(1.2).addScalar(0.15);
    f.uTemps.value = r.temps;
    if (r.copierPrecedent) { f.uFondu.value = 1; passe(matFin, rtPrec); }
    f.uFondu.value = r.fondu;
    passe(matFin, null);
  }

  function regler(q) { Object.assign(Q, q); if (!prof) { Q.dof = false; } }
  function detruire() {
    for (const o of [rtScene, rtDof, rtRayons, rtPrec, matDof, matRayons, matFin, matDescend, matMonte, quad.geometry, ...mips]) o.dispose?.();
    prof?.dispose();
  }
  return { rendre, taille, regler, detruire, Q };
}
