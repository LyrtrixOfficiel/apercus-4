/* Ingrid Marie : le moteur d'eau du site.
   Deux programmes WebGL, aucune bibliothèque :
   - « fond »  : le rivage, derrière tout le site. Deux matières (photos) à la fois : celle de la section
                 qu'on quitte et celle de la section qui arrive. Une vague monte et dépose la suivante.
                 À l'accueil, la première matière est le sable où le nom est écrit, sous une eau qui se retire.
   - « voile » : la nappe laiteuse qui couvre l'écran pour passer d'une page à l'autre.
   Si WebGL manque, rien ne casse : chaque section garde sa photo, posée en simple image. */
(function () {
  'use strict';

  var VERT = 'attribute vec2 a;varying vec2 v;void main(){v=a*0.5+0.5;v.y=1.0-v.y;gl_Position=vec4(a,0.0,1.0);}';

  var COMMUN = [
    'precision highp float;',
    'varying vec2 v;',
    'uniform vec2 uRes;',
    'uniform float uTime;',
    'float h1(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}',
    'float bruit(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);',
    '  return mix(mix(h1(i),h1(i+vec2(1.0,0.0)),f.x),mix(h1(i+vec2(0.0,1.0)),h1(i+vec2(1.0,1.0)),f.x),f.y);}',
    'float fbm(vec2 p){float s=0.0,a=0.5;for(int i=0;i<4;i++){s+=a*bruit(p);p=p*2.03+7.1;a*=0.5;}return s;}',
    // filet de lumière au fond de l'eau
    'float filet(vec2 uv,float t){vec2 p=mod(uv*6.28318,6.28318)-250.0;vec2 i=p;float c=1.0;',
    '  for(int n=0;n<4;n++){float tt=t*(1.0-(3.5/float(n+1)));',
    '    i=p+vec2(cos(tt-i.x)+sin(tt+i.y),sin(tt-i.y)+cos(tt+i.x));',
    '    c+=1.0/length(vec2(p.x/(sin(i.x+tt)/0.005),p.y/(cos(i.y+tt)/0.005)));}',
    '  c/=4.0;c=1.17-pow(c,1.4);return pow(abs(c),8.0);}',
    // la dentelle de l'écume : des filaments, jamais des points
    'float dentelle(vec2 p,float t){',
    '  vec2 pe=p+0.05*vec2(fbm(p*3.1+vec2(t*0.04,0.0)),fbm(p*3.1+vec2(7.3,-t*0.035)));',
    '  float r1=abs(fbm(pe*7.0+vec2(0.0,t*0.03))-0.5);',
    '  float r2=abs(fbm(pe*15.0-vec2(t*0.025,3.1))-0.5);',
    '  float amas=smoothstep(0.34,0.70,fbm(p*3.4+vec2(t*0.03,-t*0.02)));',
    '  return (1.0-smoothstep(0.0,0.045,r1))*0.85+(1.0-smoothstep(0.0,0.05,r2))*0.55*amas;}'
  ].join('\n');

  var FOND = COMMUN + '\n' + [
    'uniform sampler2D uA;',     // la matière de la section qu'on quitte
    'uniform sampler2D uB;',     // celle de la section qui arrive
    'uniform vec4 uCadreA;',     // échelle xy et décalage xy pour couvrir l'écran
    'uniform vec4 uCadreB;',
    'uniform float uMaree;',     // bord de la marée de l'accueil (0 en haut, 1 en bas ; 9 : aucune)
    'uniform float uFront;',     // bord de la vague qui apporte la matière suivante (9 : aucune)
    'uniform float uBande;',     // épaisseur de l'eau derrière ce bord
    'uniform vec2 uLave;',       // voile crème sur chaque matière, pour que le texte se lise
    'uniform vec2 uBain;',       // part d'eau permanente sur chaque matière
    'uniform vec3 uOnde[6];',    // x, y, naissance : les ondes laissées par le doigt

    // hauteur de la surface : houle lente + ondes du doigt
    'float surface(vec2 p,float t){',
    '  float s=sin(p.x*5.1+t*0.9)*0.5+sin(p.y*6.3-t*0.7+p.x*2.0)*0.5;',
    '  s+=sin((p.x+p.y)*9.7+t*1.3)*0.25+(bruit(p*4.0+vec2(t*0.15,-t*0.1))-0.5)*1.4;',
    '  for(int k=0;k<6;k++){vec3 o=uOnde[k];float age=t-o.z;',
    '    if(age>0.0&&age<4.0){float r=distance(p,o.xy);',
    '      s+=sin(r*38.0-age*8.0)*exp(-r*6.5)*exp(-age*1.25)*smoothstep(0.0,0.15,age)*smoothstep(age*0.40+0.05,age*0.40-0.06,r)*1.25;}}',
    '  return s;}',

    'void main(){',
    '  float asp=uRes.x/uRes.y;',
    '  vec2 p=vec2(v.x*asp,v.y);',
    '  float t=uTime;',
    '  vec3 CREME=vec3(0.961,0.937,0.890);',
    // un bord festonné qui respire
    '  float feston=0.030*sin(p.x*2.6+t*0.50)+0.018*sin(p.x*6.1-t*0.36)+0.050*(fbm(vec2(p.x*1.7,t*0.07))-0.5)+0.010*sin(t*0.9);',
    '  float front=uFront+feston;',
    '  float haut=min(uMaree,uFront)+feston;',                 // le haut de la masse d'eau
    '  float fin=uFront+uBande+feston*0.5+0.06*(fbm(vec2(p.x*2.1+9.0,t*0.06))-0.5);',   // là où l'eau s'arrête, derrière la vague
    '  float d=v.y-haut;',
    '  float mB=smoothstep(-0.012,0.05,v.y-front);',          // 0 : matière A, 1 : matière B
    '  float reste=1.0-smoothstep(fin-0.11,fin,v.y);',
    '  float corps=smoothstep(0.0,0.012,d)*reste;',
    '  float prof=clamp(d*2.6,0.0,1.0)*reste;',
    '  float bain=mix(uBain.x,uBain.y,mB);',
    '  float eau=max(corps,bain);',
    '  float creux=max(prof,bain*0.7);',
    '  float enMaree=step(uMaree,uFront);',
    '  float vague=step(uFront,5.0);',
    // sable encore mouillé : au-dessus de la marée qui se retire, et derrière la vague qui vient de passer
    '  float mouille=smoothstep(0.22,0.0,-d)*step(d,0.0)*enMaree;',
    '  mouille=max(mouille,smoothstep(0.34,0.0,v.y-fin)*smoothstep(fin-0.07,fin+0.03,v.y)*vague);',
    // écume : un liseré plein au bord, une dentelle qui s'effiloche, une trace derrière la vague
    '  float ecume=0.0;',
    '  if((d>-0.03&&d<0.16)||abs(v.y-fin)<0.05){',
    '    float dent=dentelle(p,t);',
    '    float amas=smoothstep(0.34,0.70,fbm(p*3.4+vec2(t*0.03,-t*0.02)));',
    '    float lisere=smoothstep(0.026,0.0,abs(d-0.006));',
    '    float traine=smoothstep(0.13,0.0,d)*step(0.0,d);',
    '    ecume=clamp(lisere*(0.72+0.28*dent)+traine*traine*dent*(0.35+0.65*amas),0.0,1.0);',
    '    ecume*=smoothstep(-0.012,0.004,d);',
    '    ecume=max(ecume,(1.0-smoothstep(0.0,0.035,abs(v.y-fin+0.02)))*dent*0.5*vague);',
    '  }',
    // la surface ne se calcule que là où il y a de l'eau
    '  vec2 g=vec2(0.0);',
    '  if(eau>0.003){',
    '    float e=0.004;',
    '    float s0=surface(p,t);',
    '    g=vec2(surface(p+vec2(e,0.0),t)-s0,surface(p+vec2(0.0,e),t)-s0)/e;',
    '  }',
    '  vec2 dec=g*0.00115*(0.25+creux)*eau;',
    '  vec2 w=v+vec2(dec.x/asp,dec.y)-0.5;',
    '  vec3 a=mix(texture2D(uA,w*uCadreA.xy+0.5+uCadreA.zw).rgb,CREME,uLave.x);',
    '  vec3 b=mix(texture2D(uB,w*uCadreB.xy+0.5+uCadreB.zw).rgb,CREME,uLave.y);',
    '  vec3 fond=mix(a,b,mB);',
    // à sec : la lumière passe lentement sur la matière
    '  float lum=fbm(p*1.15+vec2(t*0.022,-t*0.016));',
    '  vec3 col=fond*(0.965+0.075*lum)*mix(1.0,0.86,mouille);',
    '  col+=vec3(0.035,0.04,0.045)*mouille*(0.5+0.5*bruit(p*30.0));',
    '  if(eau>0.003){',
    '    vec3 dansleau=fond*mix(vec3(1.0),vec3(0.80,0.97,0.93),creux*0.75);',
    '    float f=filet(p*1.55+dec*14.0,t*0.42);',
    '    dansleau+=vec3(1.0,0.93,0.74)*f*(0.16+0.30*creux);',
    '    dansleau+=vec3(1.0)*pow(max(0.0,dot(normalize(vec3(-g*0.05,1.0)),normalize(vec3(0.35,-0.45,0.82)))),90.0)*0.35*creux;',
    '    col=mix(col,dansleau,eau);',
    '  }',
    '  col=mix(col,vec3(1.0,0.995,0.985),ecume*0.92);',
    '  gl_FragColor=vec4(col,1.0);',
    '}'
  ].join('\n');

  var VOILE = COMMUN + '\n' + [
    'uniform float uMaree;',
    'uniform float uCouvre;',   // 0 à 1 : la nappe laiteuse du changement de page
    'void main(){',
    '  float asp=uRes.x/uRes.y;',
    '  vec2 p=vec2(v.x*asp,v.y);',
    '  float t=uTime;',
    '  float bord=uMaree+0.030*sin(p.x*2.6+t*0.50)+0.018*sin(p.x*6.1-t*0.36)+0.050*(fbm(vec2(p.x*1.7,t*0.07))-0.5)+0.010*sin(t*0.9);',
    '  float d=v.y-bord;',
    '  float prof=clamp(d*2.6,0.0,1.0);',
    '  float eau=smoothstep(0.0,0.012,d);',
    '  float ecume=0.0;',
    '  if(d>-0.03&&d<0.16){',
    '    float dent=dentelle(p,t);',
    '    float amas=smoothstep(0.34,0.70,fbm(p*3.4+vec2(t*0.03,-t*0.02)));',
    '    float lisere=smoothstep(0.026,0.0,abs(d-0.006));',
    '    float traine=smoothstep(0.13,0.0,d)*step(0.0,d);',
    '    ecume=clamp(lisere*(0.72+0.28*dent)+traine*traine*dent*(0.35+0.65*amas),0.0,1.0)*smoothstep(-0.012,0.004,d);',
    '  }',
    '  float f=filet(p*1.55,t*0.42);',
    '  float a=eau*(0.07+0.13*prof);',
    '  vec3 col=vec3(0.46,0.74,0.67)*a;',
    '  float lum=f*(0.10+0.22*prof)*eau;',
    '  col+=vec3(1.0,0.95,0.80)*lum;a+=lum*0.6;',
    '  col=col*(1.0-ecume)+vec3(1.0,0.995,0.985)*ecume;a=a*(1.0-ecume)+ecume;',
    '  float lait=clamp(smoothstep(0.0,0.10,d)*uCouvre+ecume*uCouvre,0.0,1.0);',
    '  vec3 nappe=mix(vec3(0.975,0.958,0.918),vec3(0.925,0.960,0.940),0.18+0.22*f);',
    '  col=col*(1.0-lait)+nappe*lait;a=a*(1.0-lait)+lait;',
    '  gl_FragColor=vec4(col,a);',
    '}'
  ].join('\n');

  function Eau(canvas, options) {
    options = options || {};
    this.canvas = canvas;
    this.voile = options.mode === 'voile';
    this.echelle = options.echelle || 1;
    this.maree = 9;
    this.couvre = 0;
    this.ondes = [];
    for (var i = 0; i < 6; i++) this.ondes.push([0, 0, -99]);
    this.iOnde = 0;
    this.ok = false;
    var gl = null;
    try {
      gl = canvas.getContext('webgl', { alpha: this.voile, premultipliedAlpha: true, antialias: false, powerPreference: 'high-performance' });
    } catch (e) { gl = null; }
    if (!gl) return;
    this.gl = gl;
    var prog = this._programme(VERT, this.voile ? VOILE : FOND);
    if (!prog) return;
    this.prog = prog;
    gl.useProgram(prog);
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, 'a');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    this.u = {};
    var noms = ['uRes', 'uTime', 'uMaree', 'uCouvre', 'uA', 'uB', 'uCadreA', 'uCadreB', 'uFront', 'uBande', 'uLave', 'uBain'];
    for (var n = 0; n < noms.length; n++) this.u[noms[n]] = gl.getUniformLocation(prog, noms[n]);
    this.uOnde = gl.getUniformLocation(prog, 'uOnde[0]');
    if (this.voile) {
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    } else {
      // tant qu'une photo n'est pas arrivée : un aplat crème
      this.vide = { tex: gl.createTexture(), l: 1, h: 1, vide: true };
      gl.bindTexture(gl.TEXTURE_2D, this.vide.tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([238, 229, 210, 255]));
    }
    this.ok = true;
    var moi = this;
    canvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); moi.ok = false; });
  }

  Eau.prototype._programme = function (vs, fs) {
    var gl = this.gl;
    function sh(type, src) {
      var s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        if (window.console) console.warn('eau : ' + gl.getShaderInfoLog(s));
        return null;
      }
      return s;
    }
    var a = sh(gl.VERTEX_SHADER, vs), b = sh(gl.FRAGMENT_SHADER, fs);
    if (!a || !b) return null;
    var p = gl.createProgram();
    gl.attachShader(p, a); gl.attachShader(p, b); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) return null;
    return p;
  };

  /* Ajuste la taille du dessin à celle de l'élément. Retourne true si elle a changé. */
  Eau.prototype.taille = function () {
    var c = this.canvas;
    var l = Math.max(2, Math.round(c.clientWidth * this.echelle));
    var h = Math.max(2, Math.round(c.clientHeight * this.echelle));
    if (c.width !== l || c.height !== h) { c.width = l; c.height = h; return true; }
    return false;
  };

  /* Charge une image ou un canvas 2D comme matière. Retourne de quoi la dessiner. */
  Eau.prototype.texture = function (source, ancienne) {
    if (!this.ok) return null;
    var gl = this.gl, t = ancienne && ancienne.tex && !ancienne.vide ? ancienne.tex : gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return { tex: t, l: source.naturalWidth || source.width, h: source.naturalHeight || source.height };
  };
  Eau.prototype.liberer = function (m) { if (this.ok && m && m.tex && !m.vide) this.gl.deleteTexture(m.tex); };

  /* Une onde à l'endroit touché (coordonnées en pixels dans l'élément). */
  Eau.prototype.onde = function (x, y, t) {
    var c = this.canvas, l = c.clientWidth || 1, h = c.clientHeight || 1;
    this.ondes[this.iOnde] = [(x / l) * (l / h), y / h, t];
    this.iOnde = (this.iOnde + 1) % 6;
  };

  /* Fond : e = { a, b, cadreA, cadreB, maree, front, bande, lave: [a, b], bain: [a, b] }. Voile : rien à passer. */
  Eau.prototype.dessine = function (t, e) {
    if (!this.ok) return;
    var gl = this.gl, c = this.canvas, u = this.u;
    gl.viewport(0, 0, c.width, c.height);
    gl.uniform2f(u.uRes, c.width, c.height);
    gl.uniform1f(u.uTime, t);
    if (this.voile) {
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(u.uMaree, this.maree);
      gl.uniform1f(u.uCouvre, this.couvre);
    } else {
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, (e.a || this.vide).tex);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, (e.b || this.vide).tex);
      gl.uniform1i(u.uA, 0); gl.uniform1i(u.uB, 1);
      gl.uniform4fv(u.uCadreA, e.cadreA); gl.uniform4fv(u.uCadreB, e.cadreB);
      gl.uniform1f(u.uMaree, e.maree);
      gl.uniform1f(u.uFront, e.front);
      gl.uniform1f(u.uBande, e.bande);
      gl.uniform2f(u.uLave, e.lave[0], e.lave[1]);
      gl.uniform2f(u.uBain, e.bain[0], e.bain[1]);
      var plat = [];
      for (var i = 0; i < 6; i++) plat.push(this.ondes[i][0], this.ondes[i][1], this.ondes[i][2]);
      gl.uniform3fv(this.uOnde, new Float32Array(plat));
    }
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  };

  Eau.prototype.efface = function () {
    if (!this.ok || !this.voile) return;
    var gl = this.gl;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
  };

  window.Eau = Eau;
})();
