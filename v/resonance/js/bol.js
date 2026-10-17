// Resonance : le bol qu'on touche. La vraie photo du bol, rendue en WebGL : un toucher le fait sonner (si le son
// est actif) et l'air autour se met a onduler, en anneaux qui partent du bol tant qu'il resonne.
// Pour l'art-therapie, c'est de l'eau : les anneaux partent la ou l'on touche.

const VS = `#version 300 es
in vec2 aPos; out vec2 vUv;
void main(){ vUv = aPos * .5 + .5; gl_Position = vec4(aPos, 0., 1.); }`;
const FS = `#version 300 es
precision highp float;
uniform sampler2D uImg; uniform vec2 uRes, uImgTaille, uFoyerImg; uniform float uT; uniform vec3 uLueur;
uniform vec4 uAnneaux[16];  // x, y (pixels toile), t0, force
in vec2 vUv; out vec4 o;
void main(){
  vec2 px = vUv * uRes;
  vec2 dec = vec2(0.); float lum = 0., halo = 0.;
  for (int i = 0; i < 16; i++) {
    vec4 a = uAnneaux[i]; if (a.w <= 0.) continue;
    float age = uT - a.z; if (age < 0. || age > 4.) continue;
    vec2 d = px - a.xy; float r = length(d);
    float R = age * 300. * (uRes.y / 900.) + 6.;
    float bande = (r - R) / (34. * (uRes.y / 900.) + 10.);
    float w = exp(-bande * bande) * a.w * exp(-age * .95);
    dec += (r > .5 ? d / r : vec2(0.)) * w * sin(bande * 2.4) * 15. * (uRes.y / 900.);
    lum += w * cos(bande * 2.4) * .16;
    halo += w * exp(-bande * bande * 3.) * .8;
  }
  // couverture (object-fit: cover) centree sur le foyer
  float sE = uRes.x / uRes.y, sI = uImgTaille.x / uImgTaille.y;
  vec2 uv = (px + dec) / uRes;
  vec2 k = sE > sI ? vec2(1., sI / sE) : vec2(sE / sI, 1.);
  vec2 f = clamp(vec2(uFoyerImg.x, 1. - uFoyerImg.y), k * .5, 1. - k * .5);
  vec2 iuv = clamp(f + (uv - .5) * k, vec2(.001), vec2(.999));
  vec3 c = texture(uImg, vec2(iuv.x, 1. - iuv.y)).rgb;
  c *= 1. + lum;
  c += uLueur * halo * (.35 + .65 * dot(c, vec3(.3, .59, .11)));
  o = vec4(c, 1.);
}`;

export function demarrerBol(figure, img, { foyer = [.43, .5], source = [.43, .37], mode = 'son', surFrappe, lueur: teinte = '#e8c27a' } = {}) {
  const lueur = [1, 3, 5].map((i) => parseInt(teinte.slice(i, i + 2), 16) / 255);
  const toile = document.createElement('canvas'); toile.setAttribute('aria-hidden', 'true');
  const gl = toile.getContext('webgl2', { antialias: false, alpha: false, premultipliedAlpha: false });
  if (!gl) return null;
  const p = gl.createProgram();
  for (const [t, src] of [[gl.VERTEX_SHADER, VS], [gl.FRAGMENT_SHADER, FS]]) {
    const s = gl.createShader(t); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(s)); return null; }
    gl.attachShader(p, s);
  }
  gl.bindAttribLocation(p, 0, 'aPos'); gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) return null;
  const U = (n) => gl.getUniformLocation(p, n);
  const u = { img: U('uImg'), res: U('uRes'), taille: U('uImgTaille'), foyer: U('uFoyerImg'), t: U('uT'), anneaux: U('uAnneaux'), lueur: U('uLueur') };
  const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
  const vb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vb);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  figure.appendChild(toile);
  figure.classList.add('gl-bol');

  let W = 1, H = 1, dpr = 1, vivant = false;
  const anneaux = [];
  const t0 = performance.now();
  const temps = () => (performance.now() - t0) / 1000;
  function taille() {
    const r = figure.getBoundingClientRect(); W = r.width; H = r.height;
    dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    toile.width = Math.round(W * dpr); toile.height = Math.round(H * dpr);
    dessiner();
  }
  // position de la source du son (le bord du bol) dans la toile, selon le cadrage
  function sourceToile() {
    const sE = W / H, sI = img.naturalWidth / img.naturalHeight;
    const k = sE > sI ? [1, sI / sE] : [sE / sI, 1];
    const fx = Math.min(1 - k[0] / 2, Math.max(k[0] / 2, foyer[0])), fy = Math.min(1 - k[1] / 2, Math.max(k[1] / 2, 1 - foyer[1]));
    const ux = (source[0] - fx) / k[0] + .5, uy = ((1 - source[1]) - fy) / k[1] + .5;
    return [ux * W * dpr, uy * H * dpr];
  }
  function frapper(x, y, force = 1) {
    const t = temps();
    if (mode === 'son') {
      const [sx, sy] = sourceToile();
      // le bol resonne : un anneau tout de suite, puis d'autres, de plus en plus faibles
      for (let i = 0; i < 7; i++) anneaux.push([sx, sy, t + i * .42, force * Math.pow(.72, i)]);
    } else {
      anneaux.push([x * dpr, (H - y) * dpr, t, force]);
      anneaux.push([x * dpr, (H - y) * dpr, t + .18, force * .5]);
    }
    while (anneaux.length > 16) anneaux.shift();
    surFrappe?.(force);
    reveiller();
  }
  figure.addEventListener('pointerdown', (e) => {
    const r = figure.getBoundingClientRect();
    frapper(e.clientX - r.left, e.clientY - r.top, 1);
    figure.classList.add('touche');
  });
  figure.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); frapper(W / 2, H / 2, 1); } });
  function dessiner() {
    gl.viewport(0, 0, toile.width, toile.height);
    gl.useProgram(p);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex); gl.uniform1i(u.img, 0);
    gl.uniform2f(u.res, toile.width, toile.height); gl.uniform2f(u.taille, img.naturalWidth, img.naturalHeight);
    gl.uniform2f(u.foyer, foyer[0], foyer[1]); gl.uniform1f(u.t, temps()); gl.uniform3fv(u.lueur, lueur);
    const a = new Float32Array(64); anneaux.forEach((v, i) => a.set(v, i * 4)); gl.uniform4fv(u.anneaux, a);
    gl.bindVertexArray(vao); gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  function boucle() {
    dessiner();
    const t = temps();
    for (let i = anneaux.length - 1; i >= 0; i--) if (t - anneaux[i][2] > 4) anneaux.splice(i, 1);
    if (anneaux.length) requestAnimationFrame(boucle); else { vivant = false; dessiner(); }
  }
  function reveiller() { if (!vivant) { vivant = true; requestAnimationFrame(boucle); } }
  taille();
  return { taille, frapper, diag() { dessiner(); const px = new Uint8Array(4); gl.readPixels(Math.round(toile.width * .43), Math.round(toile.height * .6), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); return { n: anneaux.length, t: temps(), a: anneaux.slice(0, 2), px: [...px], src: sourceToile(), err: gl.getError() }; } };
}
