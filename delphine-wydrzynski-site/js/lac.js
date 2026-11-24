/* Le lac d'Espace ONE : une seule toile WebGL, fixe, derrière le site.
   Deux photos du même lac, prises du même endroit : la nuit dans le vent (lac-nuit) et le lever du soleil
   sur l'eau lisse (lac-lever). Tout le reste est calculé ici, en direct :
   - jour (0 à 1) : la nuit, l'heure bleue, l'aube, le lever ; l'heure bleue est un étalonnage, pas une photo
   - vent (0 à 1) : l'eau se brise ou redevient un miroir ; les nuages de nuit passent plus ou moins vite
   - les gouttes : des ronds dans l'eau (la pluie des questions, l'infini de LemniWave, le doigt qui touche l'eau)
   - la brume qui naît sur l'horizon à l'aube
   - le cadrage : panoramique (pan), zoom, hauteur du regard (y)
   window.Lac.regler({ jour, vent, pan, zoom, y, brume }) ; window.Lac.goutte(x, y, force) en coordonnées photo. */
(function () {
  'use strict';
  var HORIZON = 0.596; // hauteur de la ligne d'eau dans les deux photos (0 en haut, 1 en bas)
  var RAPPORT = 2688 / 1520;
  var NGOUTTES = 12;

  var VS = 'attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;v.y=1.-v.y;gl_Position=vec4(p,0.,1.);}';
  var FS = [
    'precision highp float;',
    'varying vec2 v;',
    'uniform sampler2D uNuit, uLever;',
    'uniform vec2 uEcran;',
    'uniform float uT, uJour, uVent, uPan, uZoom, uY, uBrume, uPret;',
    'uniform vec4 uG[' + NGOUTTES + '];',
    'float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
    'float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);',
    ' return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}',
    'float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<4;i++){s+=a*n(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return s;}',
    'void main(){',
    // cadrage « cover » : la photo remplit l'écran, on choisit ce qu'on garde
    ' float re=uEcran.x/uEcran.y, ri=' + RAPPORT.toFixed(4) + ';',
    ' vec2 ech=re>ri?vec2(1.,ri/re):vec2(re/ri,1.);',
    ' ech/=uZoom;',
    ' vec2 libre=1.-ech;',
    ' vec2 uv=vec2(libre.x*(.5+.5*uPan),libre.y*uY)+v*ech;',
    ' float H=' + HORIZON.toFixed(3) + ';',
    ' float eau=smoothstep(H-.004,H+.006,uv.y);',
    ' float d=clamp((uv.y-H)/(1.-H),0.,1.);',
    ' float per=.12+d*1.25;', // perspective : les vagues grossissent en approchant
    ' vec2 off=vec2(0.);',
    ' float reflet=0.;',
    // les vagues : un écoulement de bruit écrasé par la perspective
    ' vec2 q=vec2(uv.x*ri*7./per,uv.y*38./per);',
    ' float w1=fbm(q+vec2(uT*.35,uT*.9));',
    ' float w2=fbm(q*1.7-vec2(uT*.6,uT*1.3));',
    ' float amp=mix(.0007,.016,uVent*uVent)*per;',
    ' off+=vec2((w1-.5)*.6,(w2-.5))*amp;',
    // les gouttes : des anneaux qui s'élargissent, aplatis par la perspective
    ' for(int i=0;i<' + NGOUTTES + ';i++){',
    '  vec4 g=uG[i];',
    '  float age=uT-g.z;',
    '  if(g.w<=0.||age<0.||age>4.5) continue;',
    '  float dg=clamp((g.y-H)/(1.-H),0.,1.);',
    '  vec2 dv=vec2((uv.x-g.x)*ri,(uv.y-g.y)*(3.4/(.25+dg*1.2)));',
    '  float r=length(dv);',
    '  float front=age*.11*(.25+dg);',
    '  float onde=sin((r-front)*(170./(.25+dg)))*exp(-abs(r-front)*(60./(.25+dg)))*exp(-age*.9);',
    '  off+=normalize(dv+1e-5)*onde*.009*g.w*(.3+dg);',
    '  reflet+=max(onde,0.)*g.w*exp(-age*.7);',
    ' }',
    ' off*=eau;',
    ' vec2 s=uv+off;',
    ' vec3 cN=texture2D(uNuit,s).rgb;',
    ' vec3 cL=texture2D(uLever,s).rgb;',
    // les nuages de nuit qui passent (seulement dans le ciel, au-dessus des sommets)
    ' float ciel=1.-smoothstep(.36,.43,uv.y);',
    ' float nu=fbm(vec2(uv.x*ri*2.2-uT*.035*(.3+uVent),uv.y*5.));',
    ' cN*=mix(1.,.72+.55*nu,ciel*.8);',
    // reflets froids sur l'eau agitée de la nuit
    ' float scint=smoothstep(.78,.95,fbm(q*2.3+uT*1.6))*eau*uVent*(1.-d*.4);',
    ' cN+=vec3(.55,.62,.75)*scint*.22;',
    ' float j=smoothstep(0.,1.,uJour);',
    ' vec3 c=mix(cN,cL,j);',
    // l'heure bleue : entre la nuit et le lever, la lumière passe par le bleu froid
    ' float bleu=exp(-pow((uJour-.42)/.22,2.));',
    ' vec3 cb=mix(cL,cN,.35)*vec3(.62,.72,.98)+vec3(.015,.03,.07);',
    ' c=mix(c,cb,bleu*.75);',
    // la brume sur l'horizon
    ' float bande=exp(-pow((uv.y-H+.012)/.035,2.));',
    ' float br=fbm(vec2(uv.x*ri*3.-uT*.04,uv.y*22.+uT*.05));',
    ' vec3 cbr=mix(vec3(.55,.6,.72),vec3(1.,.9,.78),j);',
    ' c=mix(c,cbr,bande*br*uBrume*.55);',
    // les gouttes accrochent la lumière
    ' c+=mix(vec3(.6,.7,.9),vec3(1.,.82,.5),j)*reflet*.6*eau;',
    // grain de film, très léger
    ' c+=(h(v*uEcran+fract(uT*7.))-.5)*.035;',
    ' gl_FragColor=vec4(c*uPret,1.);',
    '}'
  ].join('\n');

  var toile, gl, prog, loc = {}, tex = [], pret = 0, charge = 0, actif = true;
  var etat = { jour: 0, vent: 1, pan: 0, zoom: 1.06, y: 0.5, brume: 0 };
  var cible = { jour: 0, vent: 1, pan: 0, zoom: 1.06, y: 0.5, brume: 0 };
  var gouttes = [], ig = 0, t0 = performance.now(), ech = 1;
  for (var i = 0; i < NGOUTTES; i++) gouttes.push([0, 0, -99, 0]);

  function shader(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }

  function image(url, unite, fini) {
    var t = gl.createTexture();
    tex[unite] = t;
    gl.activeTexture(gl.TEXTURE0 + unite);
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([10, 14, 24, 255]));
    var im = new Image();
    im.decoding = 'async';
    im.onload = function () {
      gl.activeTexture(gl.TEXTURE0 + unite);
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      fini();
    };
    im.onerror = fini;
    im.src = url;
  }

  function taille() {
    var l = innerWidth, hh = innerHeight;
    // Moins de pixels sur les grands écrans : l'eau reste douce, le défilement reste fluide.
    ech = Math.min(window.devicePixelRatio || 1, 1.5) * (l > 1600 ? 0.7 : l > 900 ? 0.8 : 1);
    toile.width = Math.round(l * ech); toile.height = Math.round(hh * ech);
    gl.viewport(0, 0, toile.width, toile.height);
  }

  function init(el, opts) {
    toile = el;
    try { gl = el.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'high-performance' }); } catch (e) {}
    if (!gl) return false;
    try {
      prog = gl.createProgram();
      gl.attachShader(prog, shader(gl.VERTEX_SHADER, VS));
      gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, FS));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    } catch (e) { console.warn('Lac :', e.message); return false; }
    gl.useProgram(prog);
    var b = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    var a = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(a);
    gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
    ['uNuit', 'uLever', 'uEcran', 'uT', 'uJour', 'uVent', 'uPan', 'uZoom', 'uY', 'uBrume', 'uPret', 'uG'].forEach(function (k) { loc[k] = gl.getUniformLocation(prog, k); });
    gl.uniform1i(loc.uNuit, 0); gl.uniform1i(loc.uLever, 1);
    var grand = innerWidth > 1100 || (window.devicePixelRatio || 1) * innerWidth > 1500;
    var suffixe = grand ? '-2400.webp' : '-1280.webp';
    var fin = function () { charge++; if (charge === 2 && opts && opts.pret) opts.pret(); };
    image(opts.dossier + 'lac-nuit' + suffixe, 0, fin);
    image(opts.dossier + 'lac-lever' + suffixe, 1, fin);
    taille();
    addEventListener('resize', taille);
    return true;
  }

  function regler(o) { for (var k in o) if (k in cible && typeof o[k] === 'number' && !isNaN(o[k])) cible[k] = o[k]; }
  function imposer(o) { regler(o); for (var k in o) if (k in etat) etat[k] = cible[k]; }

  function goutte(x, y, force) {
    gouttes[ig] = [x, y, (performance.now() - t0) / 1000, force == null ? 1 : force];
    ig = (ig + 1) % NGOUTTES;
  }

  // Un point de l'écran (en pixels) vers la photo : pour poser une goutte là où l'on a touché.
  function versPhoto(px, py) {
    var re = innerWidth / innerHeight, ri = RAPPORT;
    var ex = re > ri ? 1 : re / ri, ey = re > ri ? ri / re : 1;
    ex /= etat.zoom; ey /= etat.zoom;
    return [(1 - ex) * (0.5 + 0.5 * etat.pan) + px / innerWidth * ex, (1 - ey) * etat.y + py / innerHeight * ey];
  }

  function dessiner(maintenant) {
    if (!gl || !actif) return;
    var t = (maintenant - t0) / 1000;
    for (var k in etat) etat[k] += (cible[k] - etat[k]) * (k === 'jour' ? 0.05 : 0.07);
    pret += ((charge === 2 ? 1 : 0) - pret) * 0.04;
    gl.uniform2f(loc.uEcran, toile.width, toile.height);
    gl.uniform1f(loc.uT, t);
    gl.uniform1f(loc.uJour, etat.jour);
    gl.uniform1f(loc.uVent, etat.vent);
    gl.uniform1f(loc.uPan, etat.pan);
    gl.uniform1f(loc.uZoom, etat.zoom);
    gl.uniform1f(loc.uY, etat.y);
    gl.uniform1f(loc.uBrume, etat.brume);
    gl.uniform1f(loc.uPret, pret);
    var flat = [];
    for (var i = 0; i < NGOUTTES; i++) flat.push.apply(flat, gouttes[i]);
    gl.uniform4fv(loc.uG, flat);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  window.Lac = {
    init: init, regler: regler, imposer: imposer, goutte: goutte, dessiner: dessiner, versPhoto: versPhoto,
    HORIZON: HORIZON, etat: etat,
    actif: function (oui) { actif = oui; },
    temps: function () { return (performance.now() - t0) / 1000; }
  };
})();
