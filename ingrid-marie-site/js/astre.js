/* La Lune, dessinée avec sa vraie phase : une photo de la pleine lune posée sur une sphère, éclairée par le soleil
   selon la part du cycle (0 nouvelle lune, 0,25 premier quartier, 0,5 pleine lune). Un halo l'entoure, plus fort
   quand elle est pleine. new Astre(canvas) puis astre.dessine({ part, eclat, halo }). */
(function () {
  'use strict';
  var SOMMETS = 'attribute vec2 p; varying vec2 v; void main(){ v = p; gl_Position = vec4(p, 0.0, 1.0); }';
  var PIXELS = [
    'precision mediump float;',
    'varying vec2 v; uniform sampler2D tex; uniform vec3 soleil; uniform float eclat, halo, rayon, pret, jour;',
    'void main(){',
    '  vec2 q = v / rayon; float r = length(q);',
    '  float bord = fwidth(r) * 1.5 + 0.004;',
    '  float dedans = 1.0 - smoothstep(1.0 - bord, 1.0, r);',
    '  vec3 n = vec3(q, sqrt(max(0.0, 1.0 - min(r, 1.0) * min(r, 1.0))));',
    '  float l = dot(n, soleil);',
    '  float lumiere = smoothstep(-0.05, 0.16, l) * (0.82 + 0.18 * n.z);',
    '  vec3 photo = texture2D(tex, vec2(q.x * 0.5 + 0.5, 0.5 - q.y * 0.5)).rgb;',
    '  photo = mix(vec3(0.62), photo, 0.86) * mix(vec3(1.0), vec3(1.03, 1.0, 0.94), 0.6);',
    '  photo = mix(vec3(0.55), photo, pret);',
    '  vec3 c = photo * (lumiere * (1.0 + eclat * 0.5) + 0.035);',
    '  c = mix(c, vec3(1.0, 0.98, 0.93), eclat * eclat * 0.55 * dedans);',
    '  float plein = clamp(soleil.z * 0.5 + 0.5, 0.0, 1.0);',
    '  float h = exp(-max(r - 1.0, 0.0) * 5.5) * (1.0 - dedans) * halo * (0.3 + 0.55 * plein + eclat * 0.7);',
    '  float a = dedans + h;',
    '  vec4 nuit = vec4(c * dedans + vec3(0.92, 0.94, 1.0) * h, clamp(a, 0.0, 1.0));',
    '  vec3 pale = mix(photo * (0.8 + 0.3 * lumiere), vec3(0.95, 0.96, 1.0), 0.32);',
    '  vec4 clair = vec4(pale, dedans * (lumiere * 0.94 + 0.05));',
    '  gl_FragColor = mix(nuit, clair, jour);',
    '}'
  ].join('\n');

  function Astre(canvas, options) {
    options = options || {};
    this.canvas = canvas;
    this.rayon = options.rayon || 0.62;
    var gl = null;
    try { gl = canvas.getContext('webgl', { premultipliedAlpha: false, alpha: true, antialias: true }); } catch (e) {}
    this.ok = !!gl;
    if (!gl) return;
    gl.getExtension('OES_standard_derivatives');
    var source = PIXELS;
    if (gl.getSupportedExtensions().indexOf('OES_standard_derivatives') >= 0) source = '#extension GL_OES_standard_derivatives : enable\n' + source;
    else source = source.replace('fwidth(r) * 1.5 + 0.004', '0.012');
    var prog = gl.createProgram();
    [[gl.VERTEX_SHADER, SOMMETS], [gl.FRAGMENT_SHADER, source]].forEach(function (s) {
      var sh = gl.createShader(s[0]); gl.shaderSource(sh, s[1]); gl.compileShader(sh); gl.attachShader(prog, sh);
    });
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { this.ok = false; return; }
    gl.useProgram(prog);
    var b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    var a = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
    this.u = {};
    var self = this;
    ['tex', 'soleil', 'eclat', 'halo', 'rayon', 'pret', 'jour'].forEach(function (n) { self.u[n] = gl.getUniformLocation(prog, n); });
    this.gl = gl; this.pret = 0;
    var t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([140, 140, 140, 255]));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    var im = new Image();
    im.onload = function () {
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, im);
      self.pret = 1; self.charge = true; if (self.quandPret) self.quandPret();
    };
    im.onerror = function () { self.charge = true; if (self.quandPret) self.quandPret(); };
    im.src = options.texture || 'images/lune-texture.jpg';
  }

  Astre.prototype.taille = function () {
    if (!this.ok) return;
    var k = Math.min(window.devicePixelRatio || 1, 2), c = this.canvas;
    var l = Math.round(c.clientWidth * k), h = Math.round(c.clientHeight * k);
    if (l && h && (c.width !== l || c.height !== h)) { c.width = l; c.height = h; }
  };

  Astre.prototype.dessine = function (o) {
    if (!this.ok) return;
    this.taille();
    var gl = this.gl, c = this.canvas;
    gl.viewport(0, 0, c.width, c.height);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    var angle = (o.part || 0) * Math.PI * 2;
    // vue depuis l'hémisphère nord : le côté droit s'éclaire quand la Lune croît
    gl.uniform3f(this.u.soleil, Math.sin(angle), 0.0, -Math.cos(angle));
    gl.uniform1f(this.u.eclat, o.eclat || 0);
    gl.uniform1f(this.u.halo, o.halo == null ? 1 : o.halo);
    gl.uniform1f(this.u.rayon, this.rayon);
    gl.uniform1f(this.u.pret, this.pret);
    gl.uniform1f(this.u.jour, o.jour || 0);
    gl.uniform1i(this.u.tex, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };

  window.Astre = Astre;
})();
