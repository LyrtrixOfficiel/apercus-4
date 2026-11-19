!function(t,i){"object"==typeof exports&&"undefined"!=typeof module?module.exports=i():"function"==typeof define&&define.amd?define(i):(t="undefined"!=typeof globalThis?globalThis:t||self).Lenis=i()}(this,(function(){"use strict";function clamp(t,i,e){return Math.max(t,Math.min(i,e))}class Animate{constructor(){this.isRunning=!1,this.value=0,this.from=0,this.to=0,this.currentTime=0}advance(t){var i;if(!this.isRunning)return;let e=!1;if(this.duration&&this.easing){this.currentTime+=t;const i=clamp(0,this.currentTime/this.duration,1);e=i>=1;const s=e?1:this.easing(i);this.value=this.from+(this.to-this.from)*s}else this.lerp?(this.value=function damp(t,i,e,s){return function lerp(t,i,e){return(1-e)*t+e*i}(t,i,1-Math.exp(-e*s))}(this.value,this.to,60*this.lerp,t),Math.round(this.value)===this.to&&(this.value=this.to,e=!0)):(this.value=this.to,e=!0);e&&this.stop(),null===(i=this.onUpdate)||void 0===i||i.call(this,this.value,e)}stop(){this.isRunning=!1}fromTo(t,i,{lerp:e,duration:s,easing:o,onStart:n,onUpdate:l}){this.from=this.value=t,this.to=i,this.lerp=e,this.duration=s,this.easing=o,this.currentTime=0,this.isRunning=!0,null==n||n(),this.onUpdate=l}}class Dimensions{constructor(t,i,{autoResize:e=!0,debounce:s=250}={}){this.wrapper=t,this.content=i,this.width=0,this.height=0,this.scrollHeight=0,this.scrollWidth=0,this.resize=()=>{this.onWrapperResize(),this.onContentResize()},this.onWrapperResize=()=>{this.wrapper instanceof Window?(this.width=window.innerWidth,this.height=window.innerHeight):(this.width=this.wrapper.clientWidth,this.height=this.wrapper.clientHeight)},this.onContentResize=()=>{this.wrapper instanceof Window?(this.scrollHeight=this.content.scrollHeight,this.scrollWidth=this.content.scrollWidth):(this.scrollHeight=this.wrapper.scrollHeight,this.scrollWidth=this.wrapper.scrollWidth)},e&&(this.debouncedResize=function debounce(t,i){let e;return function(...s){let o=this;clearTimeout(e),e=setTimeout((()=>{e=void 0,t.apply(o,s)}),i)}}(this.resize,s),this.wrapper instanceof Window?window.addEventListener("resize",this.debouncedResize,!1):(this.wrapperResizeObserver=new ResizeObserver(this.debouncedResize),this.wrapperResizeObserver.observe(this.wrapper)),this.contentResizeObserver=new ResizeObserver(this.debouncedResize),this.contentResizeObserver.observe(this.content)),this.resize()}destroy(){var t,i;null===(t=this.wrapperResizeObserver)||void 0===t||t.disconnect(),null===(i=this.contentResizeObserver)||void 0===i||i.disconnect(),this.wrapper===window&&this.debouncedResize&&window.removeEventListener("resize",this.debouncedResize,!1)}get limit(){return{x:this.scrollWidth-this.width,y:this.scrollHeight-this.height}}}class Emitter{constructor(){this.events={}}emit(t,...i){var e;let s=this.events[t]||[];for(let t=0,o=s.length;t<o;t++)null===(e=s[t])||void 0===e||e.call(s,...i)}on(t,i){var e;return(null===(e=this.events[t])||void 0===e?void 0:e.push(i))||(this.events[t]=[i]),()=>{var e;this.events[t]=null===(e=this.events[t])||void 0===e?void 0:e.filter((t=>i!==t))}}off(t,i){var e;this.events[t]=null===(e=this.events[t])||void 0===e?void 0:e.filter((t=>i!==t))}destroy(){this.events={}}}const t=100/6,i={passive:!1};class VirtualScroll{constructor(e,s={wheelMultiplier:1,touchMultiplier:1}){this.element=e,this.options=s,this.touchStart={x:0,y:0},this.lastDelta={x:0,y:0},this.window={width:0,height:0},this.emitter=new Emitter,this.onTouchStart=t=>{const{clientX:i,clientY:e}=t.targetTouches?t.targetTouches[0]:t;this.touchStart.x=i,this.touchStart.y=e,this.lastDelta={x:0,y:0},this.emitter.emit("scroll",{deltaX:0,deltaY:0,event:t})},this.onTouchMove=t=>{const{clientX:i,clientY:e}=t.targetTouches?t.targetTouches[0]:t,s=-(i-this.touchStart.x)*this.options.touchMultiplier,o=-(e-this.touchStart.y)*this.options.touchMultiplier;this.touchStart.x=i,this.touchStart.y=e,this.lastDelta={x:s,y:o},this.emitter.emit("scroll",{deltaX:s,deltaY:o,event:t})},this.onTouchEnd=t=>{this.emitter.emit("scroll",{deltaX:this.lastDelta.x,deltaY:this.lastDelta.y,event:t})},this.onWheel=i=>{let{deltaX:e,deltaY:s,deltaMode:o}=i;e*=1===o?t:2===o?this.window.width:1,s*=1===o?t:2===o?this.window.height:1,e*=this.options.wheelMultiplier,s*=this.options.wheelMultiplier,this.emitter.emit("scroll",{deltaX:e,deltaY:s,event:i})},this.onWindowResize=()=>{this.window={width:window.innerWidth,height:window.innerHeight}},window.addEventListener("resize",this.onWindowResize,!1),this.onWindowResize(),this.element.addEventListener("wheel",this.onWheel,i),this.element.addEventListener("touchstart",this.onTouchStart,i),this.element.addEventListener("touchmove",this.onTouchMove,i),this.element.addEventListener("touchend",this.onTouchEnd,i)}on(t,i){return this.emitter.on(t,i)}destroy(){this.emitter.destroy(),window.removeEventListener("resize",this.onWindowResize,!1),this.element.removeEventListener("wheel",this.onWheel,i),this.element.removeEventListener("touchstart",this.onTouchStart,i),this.element.removeEventListener("touchmove",this.onTouchMove,i),this.element.removeEventListener("touchend",this.onTouchEnd,i)}}return class Lenis{constructor({wrapper:t=window,content:i=document.documentElement,eventsTarget:e=t,smoothWheel:s=!0,syncTouch:o=!1,syncTouchLerp:n=.075,touchInertiaMultiplier:l=35,duration:r,easing:h=(t=>Math.min(1,1.001-Math.pow(2,-10*t))),lerp:a=.1,infinite:c=!1,orientation:u="vertical",gestureOrientation:d="vertical",touchMultiplier:p=1,wheelMultiplier:m=1,autoResize:v=!0,prevent:g,virtualScroll:S,__experimental__naiveDimensions:w=!1}={}){this._isScrolling=!1,this._isStopped=!1,this._isLocked=!1,this._preventNextNativeScrollEvent=!1,this._resetVelocityTimeout=null,this.time=0,this.userData={},this.lastVelocity=0,this.velocity=0,this.direction=0,this.animate=new Animate,this.emitter=new Emitter,this.onPointerDown=t=>{1===t.button&&this.reset()},this.onVirtualScroll=t=>{if("function"==typeof this.options.virtualScroll&&!1===this.options.virtualScroll(t))return;const{deltaX:i,deltaY:e,event:s}=t;if(this.emitter.emit("virtual-scroll",{deltaX:i,deltaY:e,event:s}),s.ctrlKey)return;const o=s.type.includes("touch"),n=s.type.includes("wheel");this.isTouching="touchstart"===s.type||"touchmove"===s.type;if(this.options.syncTouch&&o&&"touchstart"===s.type&&!this.isStopped&&!this.isLocked)return void this.reset();const l=0===i&&0===e,r="vertical"===this.options.gestureOrientation&&0===e||"horizontal"===this.options.gestureOrientation&&0===i;if(l||r)return;let h=s.composedPath();h=h.slice(0,h.indexOf(this.rootElement));const a=this.options.prevent;if(h.find((t=>{var i,e,s,l,r;return t instanceof HTMLElement&&("function"==typeof a&&(null==a?void 0:a(t))||(null===(i=t.hasAttribute)||void 0===i?void 0:i.call(t,"data-lenis-prevent"))||o&&(null===(e=t.hasAttribute)||void 0===e?void 0:e.call(t,"data-lenis-prevent-touch"))||n&&(null===(s=t.hasAttribute)||void 0===s?void 0:s.call(t,"data-lenis-prevent-wheel"))||(null===(l=t.classList)||void 0===l?void 0:l.contains("lenis"))&&!(null===(r=t.classList)||void 0===r?void 0:r.contains("lenis-stopped")))})))return;if(this.isStopped||this.isLocked)return void s.preventDefault();if(!(this.options.syncTouch&&o||this.options.smoothWheel&&n))return this.isScrolling="native",void this.animate.stop();s.preventDefault();let c=e;"both"===this.options.gestureOrientation?c=Math.abs(e)>Math.abs(i)?e:i:"horizontal"===this.options.gestureOrientation&&(c=i);const u=o&&this.options.syncTouch,d=o&&"touchend"===s.type&&Math.abs(c)>5;d&&(c=this.velocity*this.options.touchInertiaMultiplier),this.scrollTo(this.targetScroll+c,Object.assign({programmatic:!1},u?{lerp:d?this.options.syncTouchLerp:1}:{lerp:this.options.lerp,duration:this.options.duration,easing:this.options.easing}))},this.onNativeScroll=()=>{if(null!==this._resetVelocityTimeout&&(clearTimeout(this._resetVelocityTimeout),this._resetVelocityTimeout=null),this._preventNextNativeScrollEvent)this._preventNextNativeScrollEvent=!1;else if(!1===this.isScrolling||"native"===this.isScrolling){const t=this.animatedScroll;this.animatedScroll=this.targetScroll=this.actualScroll,this.lastVelocity=this.velocity,this.velocity=this.animatedScroll-t,this.direction=Math.sign(this.animatedScroll-t),this.isScrolling="native",this.emit(),0!==this.velocity&&(this._resetVelocityTimeout=setTimeout((()=>{this.lastVelocity=this.velocity,this.velocity=0,this.isScrolling=!1,this.emit()}),400))}},window.lenisVersion="1.1.13",t&&t!==document.documentElement&&t!==document.body||(t=window),this.options={wrapper:t,content:i,eventsTarget:e,smoothWheel:s,syncTouch:o,syncTouchLerp:n,touchInertiaMultiplier:l,duration:r,easing:h,lerp:a,infinite:c,gestureOrientation:d,orientation:u,touchMultiplier:p,wheelMultiplier:m,autoResize:v,prevent:g,virtualScroll:S,__experimental__naiveDimensions:w},this.dimensions=new Dimensions(t,i,{autoResize:v}),this.updateClassName(),this.targetScroll=this.animatedScroll=this.actualScroll,this.options.wrapper.addEventListener("scroll",this.onNativeScroll,!1),this.options.wrapper.addEventListener("pointerdown",this.onPointerDown,!1),this.virtualScroll=new VirtualScroll(e,{touchMultiplier:p,wheelMultiplier:m}),this.virtualScroll.on("scroll",this.onVirtualScroll)}destroy(){this.emitter.destroy(),this.options.wrapper.removeEventListener("scroll",this.onNativeScroll,!1),this.options.wrapper.removeEventListener("pointerdown",this.onPointerDown,!1),this.virtualScroll.destroy(),this.dimensions.destroy(),this.cleanUpClassName()}on(t,i){return this.emitter.on(t,i)}off(t,i){return this.emitter.off(t,i)}setScroll(t){this.isHorizontal?this.rootElement.scrollLeft=t:this.rootElement.scrollTop=t}resize(){this.dimensions.resize(),this.animatedScroll=this.targetScroll=this.actualScroll,this.emit()}emit(){this.emitter.emit("scroll",this)}reset(){this.isLocked=!1,this.isScrolling=!1,this.animatedScroll=this.targetScroll=this.actualScroll,this.lastVelocity=this.velocity=0,this.animate.stop()}start(){this.isStopped&&(this.isStopped=!1,this.reset())}stop(){this.isStopped||(this.isStopped=!0,this.animate.stop(),this.reset())}raf(t){const i=t-(this.time||t);this.time=t,this.animate.advance(.001*i)}scrollTo(t,{offset:i=0,immediate:e=!1,lock:s=!1,duration:o=this.options.duration,easing:n=this.options.easing,lerp:l=this.options.lerp,onStart:r,onComplete:h,force:a=!1,programmatic:c=!0,userData:u}={}){if(!this.isStopped&&!this.isLocked||a){if("string"==typeof t&&["top","left","start"].includes(t))t=0;else if("string"==typeof t&&["bottom","right","end"].includes(t))t=this.limit;else{let e;if("string"==typeof t?e=document.querySelector(t):t instanceof HTMLElement&&(null==t?void 0:t.nodeType)&&(e=t),e){if(this.options.wrapper!==window){const t=this.rootElement.getBoundingClientRect();i-=this.isHorizontal?t.left:t.top}const s=e.getBoundingClientRect();t=(this.isHorizontal?s.left:s.top)+this.animatedScroll}}if("number"==typeof t){if(t+=i,t=Math.round(t),this.options.infinite?c&&(this.targetScroll=this.animatedScroll=this.scroll):t=clamp(0,t,this.limit),t===this.targetScroll)return null==r||r(this),void(null==h||h(this));if(this.userData=null!=u?u:{},e)return this.animatedScroll=this.targetScroll=t,this.setScroll(this.scroll),this.reset(),this.preventNextNativeScrollEvent(),this.emit(),null==h||h(this),void(this.userData={});c||(this.targetScroll=t),this.animate.fromTo(this.animatedScroll,t,{duration:o,easing:n,lerp:l,onStart:()=>{s&&(this.isLocked=!0),this.isScrolling="smooth",null==r||r(this)},onUpdate:(t,i)=>{this.isScrolling="smooth",this.lastVelocity=this.velocity,this.velocity=t-this.animatedScroll,this.direction=Math.sign(this.velocity),this.animatedScroll=t,this.setScroll(this.scroll),c&&(this.targetScroll=t),i||this.emit(),i&&(this.reset(),this.emit(),null==h||h(this),this.userData={},this.preventNextNativeScrollEvent())}})}}}preventNextNativeScrollEvent(){this._preventNextNativeScrollEvent=!0,requestAnimationFrame((()=>{this._preventNextNativeScrollEvent=!1}))}get rootElement(){return this.options.wrapper===window?document.documentElement:this.options.wrapper}get limit(){return this.options.__experimental__naiveDimensions?this.isHorizontal?this.rootElement.scrollWidth-this.rootElement.clientWidth:this.rootElement.scrollHeight-this.rootElement.clientHeight:this.dimensions.limit[this.isHorizontal?"x":"y"]}get isHorizontal(){return"horizontal"===this.options.orientation}get actualScroll(){return this.isHorizontal?this.rootElement.scrollLeft:this.rootElement.scrollTop}get scroll(){return this.options.infinite?function modulo(t,i){return(t%i+i)%i}(this.animatedScroll,this.limit):this.animatedScroll}get progress(){return 0===this.limit?1:this.scroll/this.limit}get isScrolling(){return this._isScrolling}set isScrolling(t){this._isScrolling!==t&&(this._isScrolling=t,this.updateClassName())}get isStopped(){return this._isStopped}set isStopped(t){this._isStopped!==t&&(this._isStopped=t,this.updateClassName())}get isLocked(){return this._isLocked}set isLocked(t){this._isLocked!==t&&(this._isLocked=t,this.updateClassName())}get isSmooth(){return"smooth"===this.isScrolling}get className(){let t="lenis";return this.isStopped&&(t+=" lenis-stopped"),this.isLocked&&(t+=" lenis-locked"),this.isScrolling&&(t+=" lenis-scrolling"),"smooth"===this.isScrolling&&(t+=" lenis-smooth"),t}updateClassName(){this.cleanUpClassName(),this.rootElement.className=`${this.rootElement.className} ${this.className}`.trim()}cleanUpClassName(){this.rootElement.className=this.rootElement.className.replace(/lenis(-\w+)?/g,"").trim()}}}));
//# sourceMappingURL=lenis.min.js.map

(function () {
'use strict';
// Le verre du site de Franck Blandin, en WebGL2 sans bibliothèque.
// Repris de sa maquette (univers Liquid Glass de Kazura), en bleu marine.
// Version du 17/11/2026 : un canevas par section, qui défile avec elle (le verre ne décroche jamais du texte), et
// qui n'est redessiné que quand quelque chose bouge. Le fond : la photo du lac pour l'accueil (qui s'assombrit en
// bleu nuit en bas), puis un bleu nuit continu, calculé en coordonnées de la page, avec des lumières douces que le
// verre courbe. Plus aucune photo ne se fond dans une autre.
// Sur ce fond, le verre de chaque élément [data-verre] visible : forme en champ de distance, bord bombé qui courbe
// la lumière, dispersion légère, voile bleu nuit, reflet sur l'arête, ombre douce. Le slogan de l'accueil est un
// verre en forme de lettres. Rendu à la demande : seulement quand quelque chose a bougé.

const MAX = 16;
const TYPES = { panneau: 0, capsule: 1, lentille: 2, notif: 3, texte: 4, voile: 5 };

const SOMMETS = `#version 300 es
in vec2 a; void main(){ gl_Position = vec4(a, 0.0, 1.0); }`;

const FRAG = `#version 300 es
precision highp float;
#define MAX ${MAX}
uniform vec2 uTaille; uniform float uDpr;
uniform sampler2D uImg; uniform float uPhoto; uniform vec4 uCouv; uniform vec2 uHero;
uniform float uDefil; uniform vec3 uAmb; uniform float uAube;
uniform vec3 uTeinte; uniform float uTeinteForce;
uniform int uN;
uniform vec4 uR[MAX]; uniform vec4 uP[MAX]; uniform vec4 uG[MAX];
uniform sampler2D uTexte; uniform vec4 uTR; uniform float uPortee;
uniform vec2 uL;
out vec4 o;

// le bleu nuit continu : un dégradé lent et trois lumières qui reviennent le long de la page, à des places différentes
vec3 nuit(vec2 p){
  float y = (p.y + uDefil) / 1000.0;
  float ax = uTaille.x / 1000.0;
  vec3 c = mix(vec3(0.016, 0.039, 0.098), vec3(0.035, 0.086, 0.204), 0.5 + 0.5 * sin(y * 1.1 + 0.6));
  for (int k = 0; k < 3; k++) {
    float fk = float(k);
    float per = 1.55 + fk * 0.55;
    float u = (y + fk * 0.83) / per;
    float yy = (fract(u) - 0.5) * per;
    float cx = 0.12 + 0.76 * fract(0.37 * fk + floor(u) * 0.618);
    float xx = (p.x / uTaille.x - cx) * max(ax, 0.6);
    float d = xx * xx * 1.1 + yy * yy * 1.5;
    vec3 col = k == 0 ? vec3(0.13, 0.31, 0.72) : (k == 1 ? vec3(0.22, 0.42, 0.88) : vec3(0.09, 0.21, 0.52));
    c += col * exp(-d * 3.6) * 0.62;
  }
  c *= uAmb;
  c += vec3(0.85, 0.48, 0.28) * uAube * pow(clamp(p.y / uTaille.y, 0.0, 1.0), 1.7) * 0.42;   // l'aube, en bas de l'écran
  return c;
}
vec3 photo(vec2 p, float lod){
  vec2 uv = (p - uCouv.xy) / uCouv.zw;
  if (lod < 3.0) return textureLod(uImg, uv, lod).rgb;
  vec2 t = exp2(lod) * 0.7 / vec2(textureSize(uImg, 0));
  vec3 c = textureLod(uImg, uv, lod).rgb * 0.2;
  c += textureLod(uImg, uv + vec2( t.x,  t.y), lod).rgb * 0.2;
  c += textureLod(uImg, uv + vec2(-t.x,  t.y), lod).rgb * 0.2;
  c += textureLod(uImg, uv + vec2( t.x, -t.y), lod).rgb * 0.2;
  c += textureLod(uImg, uv + vec2(-t.x, -t.y), lod).rgb * 0.2;
  return c;
}
// ce qui est derrière le verre : la photo de l'accueil tant qu'on y est, le bleu nuit ensuite
vec3 fond(vec2 p, float lod){
  vec3 c = nuit(p);
  if (uPhoto > 0.5 && p.y < uHero.x) c = mix(photo(p, lod), c, smoothstep(uHero.x - uHero.y, uHero.x, p.y));
  return c;
}
float hasard(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
float boite(vec2 p, vec2 b, float r){ vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
float texteD(vec2 p){
  vec2 uv = (p - uTR.xy) / uTR.zw; vec2 c = clamp(uv, 0.0, 1.0);
  float d = (texture(uTexte, c).r - 0.5) * 2.0 * uPortee;
  return d + length((uv - c) * uTR.zw);
}
float forme(int i, vec2 p){
  vec4 R = uR[i]; vec4 P = uP[i];
  if (P.y > 3.5 && P.y < 4.5) return texteD(p) + (1.0 - P.w) * uPortee * 0.8;
  vec2 h = R.zw * 0.5;
  return boite(p - (R.xy + h), h, min(P.x, min(h.x, h.y)));
}

void main(){
  vec2 p = vec2(gl_FragCoord.x, uTaille.y * uDpr - gl_FragCoord.y) / uDpr;
  vec3 f = fond(p, 0.0);
  float ombre = 0.0; vec3 halo = vec3(0.0); float haloA = 0.0;
  int ici = -1; float dIci = 1e5;
  for (int i = 0; i < MAX; i++) {
    if (i >= uN) break;
    vec4 P = uP[i];
    float d = forme(i, p);
    if (P.y > 4.5) {            // voile de lisibilité derrière un texte posé sur la photo : une ellipse très douce
      vec2 q = (p - (uR[i].xy + uR[i].zw * 0.5)) / (uR[i].zw * 0.5 + vec2(90.0, 60.0));
      float a = (1.0 - smoothstep(0.2, 1.0, length(q))) * 0.4 * P.w * P.x;
      f = mix(f, vec3(0.02, 0.03, 0.06), a);
      continue;
    }
    if (P.y > 3.5) {            // lettres : ombre douce, un peu décalée
      float ds = (texteD(p - vec2(-18.0, 9.0)) + texteD(p - vec2(-9.0, 9.0)) + texteD(p - vec2(0.0, 9.0)) + texteD(p - vec2(9.0, 9.0)) + texteD(p - vec2(18.0, 9.0))) * 0.2 + (1.0 - P.w) * uPortee * 0.8;
      float a = (1.0 - smoothstep(-8.0, uPortee * 0.9, ds)) * (0.12 + 0.42 * smoothstep(0.35, 0.85, P.z)) * P.w;
      if (a > haloA) { haloA = a; halo = vec3(0.01, 0.02, 0.06); }
    } else {
      float ds = forme(i, p - vec2(0.0, 12.0));
      float fo = (P.y > 1.5 && P.y < 2.5) ? 0.24 : 0.2;
      ombre = max(ombre, (1.0 - smoothstep(-8.0, 34.0, ds)) * fo * P.w);
    }
    if (d < 1.0) { ici = i; dIci = d; }
  }
  vec3 col = mix(f * (1.0 - ombre), halo, haloA);
  float grain = (hasard(gl_FragCoord.xy) - 0.5) / 255.0;    // contre les bandes du dégradé sombre
  if (ici < 0) { o = vec4(col + grain, 1.0); return; }

  vec4 R = uR[ici]; vec4 P = uP[ici]; vec4 G = uG[ici];
  float type = P.y; bool lettres = type > 3.5 && type < 4.5;
  float mode = lettres ? 0.0 : 1.0;                 // le verre est sombre (bleu nuit) ; les lettres, un verre clair
  float lumT = lettres ? P.z : 0.5;
  vec2 e = vec2(0.8, 0.0);
  vec2 g = vec2(forme(ici, p + e.xy) - forme(ici, p - e.xy), forme(ici, p + e.yx) - forme(ici, p - e.yx));
  vec2 n = g / max(length(g), 1e-4);
  float hmin = min(R.z, R.w) * 0.5;
  float biseau = type < 0.5 ? 24.0 : type < 1.5 ? min(17.0, hmin * 0.85) : type < 2.5 ? hmin * 0.5 : type < 3.5 ? 18.0 : 8.0;
  float force  = type < 0.5 ? 26.0 : type < 1.5 ? 14.0 : type < 2.5 ? 40.0 : type < 3.5 ? 18.0 : 16.0;
  float lod    = type < 0.5 ? 3.7  : type < 1.5 ? 2.7  : type < 2.5 ? 0.4  : type < 3.5 ? 3.4  : 2.0;
  float mag    = type < 0.5 ? 0.0  : type < 1.5 ? 0.06 : type < 2.5 ? 0.26 : 0.0;
  float x = clamp(1.0 + dIci / biseau, 0.0, 1.0);
  float pente = x / sqrt(max(1.0 - x * x, 0.03));
  vec2 dec = n * pente * force * 0.55;
  if (type < 3.5) dec += (R.xy + R.zw * 0.5 - p) * mag;
  float pr = G.z;
  if (pr > 0.001) { vec2 dp = p - G.xy; dec -= dp * exp(-dot(dp, dp) / 1800.0) * 0.3 * pr; }
  vec3 c;
  c.r = fond(p + dec * 1.07, lod).r;
  c.g = fond(p + dec, lod).g;
  c.b = fond(p + dec * 0.93, lod).b;
  c = mix(c, c * uTeinte * 1.3, uTeinteForce);
  float vc = type < 0.5 ? 0.66 : type < 1.5 ? 0.58 : type < 2.5 ? 0.1 : type < 3.5 ? 0.62 : mix(0.32, 0.26, smoothstep(0.5, 0.9, lumT));
  float vs = type < 0.5 ? 0.5 : type < 1.5 ? 0.44 : type < 2.5 ? 0.14 : type < 3.5 ? 0.46 : 0.34;
  c = mix(c, mix(vec3(1.0), vec3(0.016, 0.04, 0.105), mode), mix(vc, vs, mode));
  c += vec3(0.05) * (1.0 - smoothstep(0.0, R.w * 0.5, p.y - R.y)) * (1.0 - mode * 0.6) * step(type, 3.5);
  vec2 L = normalize(uL);
  float bord = pow(x, 3.0);
  float spec = pow(max(dot(n, L), 0.0), 2.0) * bord * 0.9 + pow(max(dot(n, -L), 0.0), 2.0) * bord * 0.35;
  c += vec3(spec) * mix(1.0, 0.75, mode);
  float trait = 1.0 - smoothstep(0.0, 1.5, abs(dIci + 0.7));
  c = mix(c, vec3(1.0), trait * mix(0.55, 0.36, mode));
  if (pr > 0.001) { vec2 dp = p - G.xy; c += vec3(1.0) * pr * 0.2 * exp(-dot(dp, dp) / 5000.0); }
  float cov = clamp(0.5 - dIci * uDpr, 0.0, 1.0) * P.w;
  o = vec4(mix(col, clamp(c, 0.0, 1.0), cov) + grain, 1.0);
}`;

function compiler(gl, type, src) {
  const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || 'shader');
  return s;
}

// ---------------------------------------------------------------- champ de distance d'un texte (transformée exacte)
const INF = 1e20;
function edt1d(grille, depart, pas, n, f, v, z) {
  v[0] = 0; z[0] = -INF; z[1] = INF; f[0] = grille[depart];
  for (let q = 1, k = 0, s = 0; q < n; q++) {
    f[q] = grille[depart + q * pas];
    const q2 = q * q;
    do { const r = v[k]; s = (f[q] - f[r] + q2 - r * r) / (q - r) / 2; } while (s <= z[k] && --k > -1);
    k++; v[k] = q; z[k] = s; z[k + 1] = INF;
  }
  for (let q = 0, k = 0; q < n; q++) {
    while (z[k + 1] < q) k++;
    const r = v[k], d = q - r;
    grille[depart + q * pas] = f[r] + d * d;
  }
}
function edt(grille, l, h) {
  const n = Math.max(l, h), f = new Float64Array(n), v = new Uint16Array(n), z = new Float64Array(n + 1);
  for (let x = 0; x < l; x++) edt1d(grille, x, l, h, f, v, z);
  for (let y = 0; y < h; y++) edt1d(grille, y * l, 1, l, f, v, z);
}

function champTexte(span, origine) {
  const r = span.getBoundingClientRect(), cs = getComputedStyle(span);
  const texte = span.textContent.trim();
  const taille = parseFloat(cs.fontSize);
  const portee = Math.max(30, taille * 0.24);
  // marge plus large que la portée : les bords du champ sont saturés (uniformes), l'ombre décalée n'y fait plus de traînées
  const marge = Math.ceil(portee * 1.7);
  const k = Math.min(1.6, 2400 / (r.width + 2 * marge), 900 / (r.height + 2 * marge));
  const L = Math.ceil((r.width + 2 * marge) * k), H = Math.ceil((r.height + 2 * marge) * k);
  const c = document.createElement('canvas'); c.width = L; c.height = H;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.font = `${cs.fontWeight} ${taille * k}px ${cs.fontFamily}`;
  const esp = parseFloat(cs.letterSpacing);
  if ('letterSpacing' in g && esp) g.letterSpacing = `${esp * k}px`;
  g.textBaseline = 'alphabetic'; g.fillStyle = '#fff';
  const m = g.measureText(texte);
  const asc = m.fontBoundingBoxAscent ?? m.actualBoundingBoxAscent, desc = m.fontBoundingBoxDescent ?? m.actualBoundingBoxDescent;
  // une ligne, ou plusieurs (<span class="ligne"> dans le texte) : chacune dessinée à sa place
  const lignes = span.querySelectorAll('.ligne').length ? [...span.querySelectorAll('.ligne')] : [span];
  for (const el of lignes) {
    const re = el.getBoundingClientRect();
    const base = (re.top - r.top + marge) * k + (re.height * k - (asc + desc)) / 2 + asc;
    g.fillText(el.textContent.trim(), (re.left - r.left + marge + parseFloat(getComputedStyle(el).paddingLeft)) * k, base);
  }
  const a = g.getImageData(0, 0, L, H).data;
  const n = L * H, dehors = new Float64Array(n), dedans = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const al = a[i * 4 + 3] / 255;
    dehors[i] = al >= 1 ? 0 : al <= 0 ? INF : Math.max(0, 0.5 - al) ** 2;
    dedans[i] = al >= 1 ? INF : al <= 0 ? 0 : Math.max(0, al - 0.5) ** 2;
  }
  edt(dehors, L, H); edt(dedans, L, H);
  const out = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const d = (Math.sqrt(dehors[i]) - Math.sqrt(dedans[i])) / k;      // px CSS, positif dehors
    out[i] = Math.max(0, Math.min(255, Math.round((0.5 + d / (2 * portee)) * 255)));
  }
  return { donnees: out, L, H, portee, rect: [r.left - origine.left - marge, r.top - origine.top - marge, r.width + 2 * marge, r.height + 2 * marge] };
}

// rayon d'arrondi en px (« 50% » se résout sur la largeur)
function rayonDe(el) {
  const brut = getComputedStyle(el).borderTopLeftRadius;
  const v = parseFloat(brut);
  if (!Number.isFinite(v)) return 24;
  return /%/.test(brut) ? (v / 100) * el.offsetWidth : v;
}

// la page est toujours bleu nuit : le verre est sombre partout (texte blanc)
function adapter() {
  for (const el of document.querySelectorAll('[data-verre]')) { el.classList.add('sombre'); el.classList.remove('clair'); }
}

// ---------------------------------------------------------------- une scène : le canevas d'UNE section
// Le canevas est posé dans sa section : il défile AVEC le texte (c'est le navigateur qui les déplace ensemble), donc
// le verre ne décroche jamais du contenu, ni à la molette ni au doigt. Le fond bleu nuit est calculé en coordonnées
// de la page : d'une section à l'autre il continue sans raccord, et rien n'est à redessiner pendant le défilement.
// On ne redessine que quand quelque chose bouge vraiment (une entrée, un menu, la séquence des cinq mots).
class Scene {
  constructor(section, { petit }) {
    this.section = section;
    this.canvas = section.querySelector('canvas.scene-verre');
    const fond = section.querySelector(':scope > .scene-fond');
    this.source = fond ? fond.querySelector('img') : null;              // seule l'accueil a une photo de fond
    this.petit = petit;
    this.vivant = false;
    this.sale = true;
    this.R = new Float32Array(MAX * 4); this.P = new Float32Array(MAX * 4); this.G = new Float32Array(MAX * 4);
    this.signature = '';
  }

  async demarrer() {
    if (!this.canvas) return false;
    if (this.source) {
      if (!this.source.complete || !this.source.naturalWidth) await new Promise((ok) => { this.source.addEventListener('load', ok, { once: true }); this.source.addEventListener('error', ok, { once: true }); });
      if (!this.source.naturalWidth) this.source = null;
      else { try { await this.source.decode(); } catch { /* déjà décodée */ } }
    }
    const gl = this.canvas.getContext('webgl2', { antialias: false, alpha: false, premultipliedAlpha: false, preserveDrawingBuffer: false, powerPreference: 'high-performance' });
    if (!gl) return false;
    this.gl = gl;
    const prog = gl.createProgram();
    gl.attachShader(prog, compiler(gl, gl.VERTEX_SHADER, SOMMETS));
    gl.attachShader(prog, compiler(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.bindAttribLocation(prog, 0, 'a'); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) || 'programme');
    this.prog = prog;
    this.u = {};
    const nb = gl.getProgramParameter(prog, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < nb; i++) { const nom = gl.getActiveUniform(prog, i).name.replace(/\[0\]$/, ''); this.u[nom] = gl.getUniformLocation(prog, nom); }
    const vbo = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    const texture = () => {
      const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      return t;
    };
    this.texImg = texture();
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 4);
    if (this.source) {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.source);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      this.iw = this.source.naturalWidth; this.ih = this.source.naturalHeight;
    } else {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([5, 12, 28, 255]));
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
    this.texTexte = texture();
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, 1, 1, 0, gl.RED, gl.UNSIGNED_BYTE, new Uint8Array([255]));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    this.champ = null;
    this.canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); this.vivant = false; this.section.classList.remove('gl-pret'); }, { once: true });
    this.vivant = true;
    this.mesurer();
    return true;
  }

  // le slogan en verre : son champ de distance, en coordonnées du canevas (ils défilent ensemble)
  preparerTexte() {
    if (!this.vivant) return;
    const span = this.section.querySelector('[data-verre="texte"] .verre-lettres');
    if (!span) { this.champ = null; return; }
    const gl = this.gl;
    const ch = champTexte(span, this.canvas.getBoundingClientRect());
    gl.bindTexture(gl.TEXTURE_2D, this.texTexte);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, ch.L, ch.H, 0, gl.RED, gl.UNSIGNED_BYTE, ch.donnees);
    this.champ = ch;
    this.sale = true;
  }

  mesurer() {
    if (!this.vivant) return;
    const r = this.canvas.getBoundingClientRect();
    this.W = r.width; this.H = r.height;
    // netteté plafonnée : au-delà, le verre coûte cher sans se voir ; une très haute section passe un peu sous 1
    let dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const max = this.petit ? 2.4e6 : 4.2e6;
    if (this.W * this.H * dpr * dpr > max) dpr = Math.sqrt(max / (this.W * this.H));
    this.dpr = dpr;
    const l = Math.max(2, Math.round(this.W * dpr)), h = Math.max(2, Math.round(this.H * dpr));
    if (this.canvas.width !== l || this.canvas.height !== h) { this.canvas.width = l; this.canvas.height = h; }
    this.elements = [...this.section.querySelectorAll('[data-verre]')].filter((el) => !el.closest('.menu-verre, [hidden]'));
    this.rayons = this.elements.map((el) => rayonDe(el));
    this.forces = this.elements.map((el) => { const t = parseFloat(getComputedStyle(el).fontSize) || 16; return t >= 48 ? 0.35 : t >= 30 ? 0.6 : 1.35; });
    this.preparerTexte();
    this.sale = true;
  }

  dessiner(etat) {
    if (!this.vivant) return false;
    const gl = this.gl;
    const rc = this.canvas.getBoundingClientRect();
    if (Math.abs(rc.width - this.W) > 0.5 || Math.abs(rc.height - this.H) > 0.5) this.mesurer();
    const vh = innerHeight, W = this.W, H = this.H;
    if (rc.bottom < -50 || rc.top > vh + 50) return false;
    // où commence ce canevas dans la page : fixe pour une section ordinaire, il bouge pour la séquence épinglée
    const origine = Math.round((rc.top + scrollY) * 2) / 2;
    let couv = [0, 0, 1, 1], bas = [-1, 1], photo = 0;
    if (this.source) {
      const s = Math.max(W / this.iw, H / this.ih) * 1.04;
      const dw = this.iw * s, dh = this.ih * s;
      couv = [(W - dw) / 2, (H - dh) / 2, dw, dh];
      bas = [H, H * 0.24];                                                  // la photo s'assombrit en bleu nuit en bas
      photo = 1;
    }
    let n = 0;
    const amb = etat.ambiance || [1, 1, 1];
    const sig = [origine, W.toFixed(0), H.toFixed(0), etat.lumiere[0].toFixed(3), amb.map((a) => a.toFixed(3)).join(','), (etat.aube || 0).toFixed(3)];
    for (let i = 0; i < this.elements.length && n < MAX; i++) {
      const el = this.elements[i];
      const v = el.__verre || {};
      if (v.cache) continue;
      const type = TYPES[el.dataset.verre] ?? 0;
      let x, y, l, h;
      if (type === 4) { if (!this.champ) continue; [x, y, l, h] = this.champ.rect; }
      else {
        const r = el.getBoundingClientRect();
        x = r.left - rc.left; y = r.top - rc.top; l = r.width; h = r.height;
        if (v.forme) { x += v.forme.x; y += v.forme.y; l = v.forme.l; h = v.forme.h; }
      }
      if (y > H + 60 || y + h < -60 || l < 1 || h < 1) continue;
      const alpha = v.alpha ?? 1;
      if (alpha < 0.005) continue;
      const rayon = type === 5 ? this.forces[i] : (v.forme?.r ?? this.rayons[i]);
      this.R.set([x, y, l, h], n * 4);
      this.P.set([rayon, type, type === 4 ? 0.6 : 1, type === 4 ? (v.condense ?? 1) * alpha : alpha], n * 4);
      this.G.set([v.px ?? 0, v.py ?? 0, v.pression ?? 0, 0], n * 4);
      sig.push(x.toFixed(1), y.toFixed(1), l.toFixed(1), h.toFixed(1), rayon.toFixed(1), alpha.toFixed(3), (v.pression ?? 0).toFixed(3), (v.condense ?? 1).toFixed(3));
      n++;
    }
    const signature = sig.join('|');
    if (!this.sale && signature === this.signature) return false;
    this.signature = signature; this.sale = false;
    const u = this.u;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.useProgram(this.prog);
    gl.uniform2f(u.uTaille, W, H); gl.uniform1f(u.uDpr, this.canvas.width / W);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.texImg); gl.uniform1i(u.uImg, 0);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, this.texTexte); gl.uniform1i(u.uTexte, 1);
    gl.uniform1f(u.uPhoto, photo); gl.uniform4f(u.uCouv, ...couv); gl.uniform2f(u.uHero, ...bas);
    gl.uniform1f(u.uDefil, origine); gl.uniform3f(u.uAmb, ...amb); gl.uniform1f(u.uAube, etat.aube || 0);
    gl.uniform3f(u.uTeinte, 0.61, 0.75, 1.0); gl.uniform1f(u.uTeinteForce, 0.06);
    if (this.champ) { gl.uniform4f(u.uTR, ...this.champ.rect); gl.uniform1f(u.uPortee, this.champ.portee); }
    else { gl.uniform4f(u.uTR, -10, -10, 1, 1); gl.uniform1f(u.uPortee, 24); }
    gl.uniform2f(u.uL, etat.lumiere[0], etat.lumiere[1]);
    gl.uniform1i(u.uN, n);
    gl.uniform4fv(u.uR, this.R); gl.uniform4fv(u.uP, this.P); gl.uniform4fv(u.uG, this.G);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (!this.section.classList.contains('gl-pret')) this.section.classList.add('gl-pret');
    return true;
  }

  liberer() {
    if (!this.gl) return;
    this.section.classList.remove('gl-pret');
    try { this.gl.getExtension('WEBGL_lose_context')?.loseContext(); } catch { /* rien */ }
    this.vivant = false; this.gl = null;
    // un canevas dont le contexte est perdu ne peut pas en recréer un : on le remplace
    const neuf = this.canvas.cloneNode(false);
    this.canvas.replaceWith(neuf);
    this.canvas = neuf;
  }
}

// Site de Franck Blandin : démarrage et gestes. Repris de sa maquette (univers Liquid Glass de Kazura).
// Version du 17/11/2026 (retours de Mathéo : « pas fluide », « aucune animation au défilement », « pas de menu »,
// « glisser pour entrer marche mal ») :
// 1. Défilement doux, même à la molette (Lenis, copie locale) ; au doigt, le défilement natif du téléphone.
// 2. Le verre (verre.js) : un canevas par section, qui défile avec elle (il ne décroche jamais du texte), créé à
//    l'approche, libéré au loin, et redessiné seulement quand quelque chose bouge (jamais pour le seul défilement).
// 3. L'ouverture : à la première page de la visite, deux battants bleu nuit au signe de Franck s'écartent.
// 4. Au défilement : les titres montent mot à mot, les verres et les photos entrent, les photos glissent dans leur
//    cadre, la séquence des cinq mots (Joie, Douleur, Colère, Masque, Soi) avance avec la molette ou le doigt et la
//    lumière du fond change avec elle.
// 5. Un vrai menu en haut (et un bouton « Menu » au téléphone), des menus de verre qui s'étirent depuis leur bouton.
// Le réglage « mouvements réduits » du système n'est jamais lu (il fige le site sur les PC où Windows a coupé ses
// animations). Version calme sur demande : ajouter ?calme=1 à l'adresse.
// Les fichiers de src/js sont réunis par construire.mjs dans public/js/site.js (un seul script classique).


const html = document.documentElement;
const reduit = /[?&]calme=1/.test(location.search);
const edition = (() => { try { return !!localStorage.getItem('espace-session'); } catch { return false; } })();
const petit = matchMedia('(max-width: 760px)').matches || matchMedia('(pointer: coarse)').matches;
const pause = (ms) => new Promise((r) => setTimeout(r, Math.max(0, ms)));
const lisse = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const borne = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const nul = { pas: () => false };
window.FB = { version: 3 };

// ---------------------------------------------------------------- ressort (amortissement réel, pas de saccade)
class Ressort {
  constructor(v = 0, raideur = 170, amorti = 0.72) { this.v = v; this.cible = v; this.vit = 0; this.k = raideur; this.z = amorti; }
  pas(dt) {
    const k = reduit ? this.k * 1.5 : this.k, z = reduit ? 1 : this.z, c = 2 * Math.sqrt(k) * z;
    let t = dt;
    while (t > 1e-6) { const h = Math.min(t, 1 / 120); this.vit += (k * (this.cible - this.v) - c * this.vit) * h; this.v += this.vit * h; t -= h; }
    if (Math.abs(this.cible - this.v) < 1e-4 && Math.abs(this.vit) < 1e-3) { this.v = this.cible; this.vit = 0; return false; }
    return true;
  }
}

// ---------------------------------------------------------------- boucle d'images à la demande
const modules = [];
const scenes = new Set();
let lenis = null;
// ?fixe=1 : photos sans glissement au défilement, pour photographier une page entière écran par écran (banc d'essai)
const etat = { reduit, fixe: /[?&]fixe=1/.test(location.search), lumiere: [-0.55, -0.83], ambiance: [1, 1, 1], aube: 0 };
let inclinaison = 0;
let enCours = false, repos = 0, tPrec = 0, dernierY = -1;
function reveil() { repos = 0; if (!enCours) { enCours = true; tPrec = performance.now(); requestAnimationFrame(image); } }
function image(now) {
  const dt = Math.min(0.05, Math.max(0.001, (now - tPrec) / 1000)); tPrec = now;
  let actif = false;
  if (lenis) { lenis.raf(now); if (lenis.isScrolling) actif = true; }
  const sy = scrollY;
  if (sy !== dernierY) actif = true;
  for (const m of modules) if (m.pas(dt, sy)) actif = true;
  // lumière : fixe (l'inclinaison du téléphone sur Android la fait tourner), jamais le défilement ni la souris
  const th = Math.atan2(-0.83, -0.55) + inclinaison;
  etat.lumiere = [Math.cos(th), Math.sin(th)];
  for (const s of scenes) s.dessiner(etat);
  dernierY = sy;
  repos = actif ? 0 : repos + 1;
  if (repos < 30) requestAnimationFrame(image); else enCours = false;
}

// transformation composée d'un élément : x, y, s, a (le geste principal) et y2, s2, a2 (entrée, défilement)
function poser(el) {
  const t = el.__tr; if (!t) return;
  const x = t.x || 0, y = (t.y || 0) + (t.y2 || 0), s = (t.s ?? 1) * (t.s2 ?? 1), a = (t.a ?? 1) * (t.a2 ?? 1);
  el.style.transform = (x || y || s !== 1) ? `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) scale(${s.toFixed(4)})` : '';
  el.style.opacity = a >= 0.999 ? '' : a.toFixed(3);
  (el.__verre ||= {}).alpha = a;
}
const tr = (el) => (el.__tr ||= { x: 0, y: 0, s: 1, a: 1 });

// ---------------------------------------------------------------- les scènes de verre : créées à l'approche, libérées au loin
function scenesGL() {
  let ok = false;
  try { const c = document.createElement('canvas'); const g = c.getContext('webgl2'); ok = !!g; g?.getExtension('WEBGL_lose_context')?.loseContext(); } catch { ok = false; }
  if (!ok) { html.classList.add('sans-gl'); return { premiere: async () => null }; }
  html.classList.add('gl');
  const animer = async (section) => {
    if (section.__scene !== undefined && section.__scene !== null) return section.__scene;
    const sc = new Scene(section, { petit });
    section.__scene = sc;
    let bon = false;
    try { bon = await sc.demarrer(); } catch (e) { console.warn('verre indisponible', e); bon = false; }
    if (!bon || section.__scene !== sc) { if (section.__scene === sc) section.__scene = null; return null; }
    scenes.add(sc); sc.sale = true; reveil();
    return sc;
  };
  // Créer un verre (contexte, programme, textures) coûte quelques images : on les prépare d'avance, un par un, quand
  // personne ne fait défiler la page, pour qu'aucun ne naisse en plein geste. On n'en libère que s'il y en a trop.
  const plafond = petit ? 6 : 9;
  const liberer = (section) => { const sc = section.__scene; if (!sc || scenes.size <= plafond) return; sc.liberer(); scenes.delete(sc); section.__scene = null; };
  const proche = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && animer(e.target)), { rootMargin: '160% 0px 160% 0px' });
  const loin = new IntersectionObserver((es) => es.forEach((e) => !e.isIntersecting && liberer(e.target)), { rootMargin: '320% 0px 320% 0px' });
  const sections = [...document.querySelectorAll('.scene')].filter((s) => s.querySelector('canvas.scene-verre'));
  let geste = 0;
  addEventListener('scroll', () => { geste = performance.now(); }, { passive: true });
  addEventListener('touchmove', () => { geste = performance.now(); }, { passive: true });
  const prechauffer = () => {
    if (scenes.size >= plafond) return;
    if (performance.now() - geste < 450) { setTimeout(prechauffer, 350); return; }
    const centre = scrollY + innerHeight / 2;
    const reste = sections.filter((s) => s.__scene == null).sort((a, b) => Math.abs(a.offsetTop - centre) - Math.abs(b.offsetTop - centre));
    if (!reste.length) return;
    animer(reste[0]).finally(() => setTimeout(prechauffer, 120));
  };
  return {
    premiere: (s) => (s && s.querySelector('canvas.scene-verre') ? animer(s) : Promise.resolve(null)),
    observer: () => { sections.forEach((s) => { proche.observe(s); loin.observe(s); }); setTimeout(prechauffer, 900); },
    remesurer: () => { for (const s of scenes) s.mesurer(); reveil(); },
  };
}

// ---------------------------------------------------------------- défilement doux (molette), ancres comprises
function demarrerDefilement() {
  if (edition || reduit || typeof Lenis === 'undefined') return;
  lenis = new Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 0.95, syncTouch: false });
  addEventListener('wheel', reveil, { passive: true });
  lenis.on('scroll', reveil);
}
function ancres() {
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href*="#"]');
    if (!a || e.defaultPrevented) return;
    const url = new URL(a.href, location.href);
    if (url.pathname !== location.pathname || !url.hash || url.hash === '#') return;
    const cible = document.getElementById(decodeURIComponent(url.hash.slice(1)));
    if (!cible) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(cible, { offset: -72, duration: 1.3 });
    else cible.scrollIntoView({ behavior: 'smooth' });
    history.replaceState(null, '', url.hash);
    reveil();
  });
}

// ---------------------------------------------------------------- l'ouverture : deux battants qui s'écartent
function creerOuverture() {
  const el = document.querySelector('.ouverture');
  return {
    ouvrir() {
      if (!el) return;
      if (!html.classList.contains('charge')) { el.remove(); return; }
      el.classList.add('ouvre');
      setTimeout(() => el.remove(), 1700);
    },
  };
}

// ---------------------------------------------------------------- entrée de la première scène de la page
// Sur l'accueil : le slogan de verre se condense, la notification monte, les deux capsules naissent d'une seule.
// Sur les autres pages : les éléments marqués data-entree montent l'un après l'autre.
function creerIntro(scene0) {
  if (!scene0 || edition) return { lancer() {}, pas: () => false };
  const lettres = scene0.querySelector('[data-verre="texte"]');
  const v = lettres ? (lettres.__verre ||= {}) : null;
  if (v) v.condense = 0;
  let rang = 0;
  const elements = [...scene0.querySelectorAll('[data-entree]')].map((el) => {
    const centre = el.matches('.verrou-actions .capsule') ? (el.matches(':first-child') ? 1 : -1) : 0;
    if (centre !== -1) rang++;
    return { el, retard: 0.05 + (rang - 1) * 0.11, y: el.dataset.entree === 'haut' ? -16 : 46, s: 0.93, centre };
  });
  const douceur = reduit ? 0.35 : 1;
  for (const x of elements) { x.r = new Ressort(0, 110, 0.66); Object.assign(tr(x.el), { x: 0, y: 0, s: 1, a: 0 }); poser(x.el); }
  const cond = new Ressort(0, 24, 0.9);
  let t = -1;
  return {
    lancer() { t = 0; cond.cible = 1; reveil(); },
    pas(dt) {
      if (t < 0) return false;
      t += dt * (reduit ? 1.6 : 1);
      let bouge = cond.pas(dt);
      if (v) v.condense = Math.max(0, cond.v);
      for (const x of elements) {
        if (t >= x.retard * (reduit ? 0.6 : 1)) x.r.cible = 1;
        if (x.r.pas(dt)) bouge = true;
        const p = x.r.v, m = x.el.__tr;
        m.a = borne(p * 1.4);
        m.y = (1 - p) * x.y * douceur;
        m.s = 1 - (1 - p) * (1 - x.s) * douceur;
        if (x.centre) {
          const parent = x.el.parentElement.getBoundingClientRect(), r = x.el.getBoundingClientRect();
          const ecart = (parent.left + parent.width / 2) - (r.left - (m.x || 0) + r.width / 2);
          m.x = (1 - p) * ecart * (reduit ? 0.5 : 1);
          m.s = 0.86 + 0.14 * p;
        }
        poser(x.el);
      }
      return bouge || t < 1.4;
    },
  };
}

// ---------------------------------------------------------------- l'accueil s'efface en profondeur au défilement
function creerDeverrou() {
  const hero = document.querySelector('.scene.accueil');
  if (!hero || edition) return nul;
  const items = [...hero.querySelectorAll('[data-entree], [data-verre="texte"]')];
  let avant = -1;
  return {
    pas(dt, sy) {
      if (sy === avant) return false;
      avant = sy;
      const h = innerHeight, p = lisse(h * 0.05, h * 0.8, sy);
      for (const el of items) {
        const m = tr(el);
        m.a2 = 1 - p;
        if (el.dataset.verre !== 'texte') { m.y2 = -sy * 0.22; m.s2 = 1 - p * 0.06; }
        poser(el);
      }
      return false;
    },
  };
}

// ---------------------------------------------------------------- les titres montent mot à mot
function decouperMots() {
  if (edition) return [];
  const titres = [...document.querySelectorAll('[data-mots]')];
  for (const t of titres) {
    const cible = t.querySelector(':scope > span') || t;
    if (cible.querySelector('.mot-r')) continue;
    const morceaux = cible.innerHTML.split(/( +)/);
    let i = 0;
    cible.innerHTML = morceaux.map((m) => (/^ +$/.test(m) || !m ? m : `<span class="mot-r"><span style="--i:${i++}">${m}</span></span>`)).join('');
  }
  if (!('IntersectionObserver' in window)) { titres.forEach((t) => t.classList.add('vu')); return titres; }
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('vu'); io.unobserve(e.target); reveil(); } }), { rootMargin: '0px 0px -8% 0px' });
  titres.forEach((t) => io.observe(t));
  return titres;
}

// ---------------------------------------------------------------- les verres et les photos entrent dans l'écran
function creerApparitions(tete) {
  if (edition) return nul;
  const tous = [...document.querySelectorAll('.scene [data-verre], [data-monte], .photo-carte')].filter((el) =>
    !tete?.contains(el) && !el.closest('.sequence, .menu-verre') && !el.matches('[data-verre="texte"], [data-verre="voile"]')
    && !el.closest('.feuille[data-morph]') && !el.matches('.feuille[data-morph]'));
  const actifs = new Set();
  for (const el of tous) { el.__app = new Ressort(0, 70, 0.8); el.__appT = -1; Object.assign(tr(el), { a2: 0, y2: 80, s2: 0.94 }); poser(el); }
  const io = new IntersectionObserver((es) => {
    let k = 0;
    for (const e of es) {
      if (!e.isIntersecting && e.boundingClientRect.top > 0) continue;       // encore sous l'écran
      const el = e.target; io.unobserve(el);
      el.__appT = (k++) * 0.09; actifs.add(el);
    }
    if (k) reveil();
  }, { rootMargin: '0px 0px -6% 0px', threshold: 0.01 });
  tous.forEach((el) => io.observe(el));
  return {
    pas(dt) {
      let bouge = false;
      for (const el of actifs) {
        if (el.__appT > 0) { el.__appT -= dt; bouge = true; continue; }
        el.__app.cible = 1;
        const b = el.__app.pas(dt), p = el.__app.v, m = el.__tr;
        m.a2 = borne(p * 1.6); m.y2 = (1 - p) * 80 * (reduit ? 0.3 : 1); m.s2 = 0.94 + 0.06 * Math.min(1.02, p);
        if (!b) { m.a2 = 1; m.y2 = 0; m.s2 = 1; actifs.delete(el); } else bouge = true;
        poser(el);
      }
      return bouge;
    },
  };
}

// ---------------------------------------------------------------- les photos glissent dans leur cadre, et s'ouvrent
function creerParallaxe() {
  if (edition) return nul;
  // une affiche se lit en entier : elle s'ouvre comme les autres cadres, mais son image ne glisse pas (ni agrandie, ni coupée)
  const cartes = [...document.querySelectorAll('.photo-carte')].map((c) => ({ c, img: c.classList.contains('affiche') ? null : c.querySelector('img') }));
  const couches = [...document.querySelectorAll('[data-glisse]')].map((el) => ({ el, f: parseFloat(el.dataset.glisse) || 0.1 }));
  if (!cartes.length && !couches.length) return nul;
  let avant = null;
  return {
    pas(dt, sy) {
      const vh = innerHeight;
      if (sy === avant) return false;
      avant = sy;
      for (const { c, img } of cartes) {
        const r = c.getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh + 100) continue;
        const centre = (r.top + r.height / 2 - vh / 2) / vh;                  // -1 en haut, 0 au milieu, 1 en bas
        if (img) img.style.transform = `translate3d(0, ${(centre * -9).toFixed(2)}%, 0) scale(1.2)`;
        const q = etat.fixe ? 1 : lisse(0, 0.75, (vh - r.top) / vh);
        c.style.clipPath = `inset(${((1 - q) * 9).toFixed(2)}% ${((1 - q) * 6).toFixed(2)}% 0% ${((1 - q) * 6).toFixed(2)}% round var(--rayon-photo))`;
      }
      for (const { el, f } of couches) {
        const r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) continue;
        const centre = r.top + r.height / 2 - (el.__glisse || 0) - vh / 2;
        el.__glisse = etat.fixe ? 0 : -centre * f;
        tr(el).y = el.__glisse; poser(el);
      }
      return false;
    },
  };
}

// ---------------------------------------------------------------- la séquence des cinq mots, épinglée
// La section est haute (cinq écrans) ; sa scène reste à l'écran et avance avec le défilement : un mot, sa phrase sur
// un verre, et la lumière du fond qui change (claire à Joie, sombre à Masque, l'aube à Soi).
function creerSequence() {
  const sec = document.querySelector('.sequence');
  if (!sec || edition) return nul;
  const mots = [...sec.querySelectorAll('.seq-mot')], panneaux = [...sec.querySelectorAll('.seq-panneau')], segs = [...sec.querySelectorAll('.seq-seg')];
  const n = panneaux.length;
  const AMB = [[1.14, 1.12, 1.1], [0.92, 0.9, 0.98], [1.15, 0.84, 0.88], [0.52, 0.54, 0.64], [1.22, 1.08, 1.02]];
  const AUBE = [0, 0, 0.05, 0, 0.9];
  const lissage = new Ressort(0, 60, 1);
  return {
    pas(dt, sy) {
      const r = sec.getBoundingClientRect(), vh = innerHeight;
      const course = Math.max(1, r.height - vh);
      lissage.cible = 0.5 + borne(-r.top / course) * (n - 1);
      const bouge = lissage.pas(dt);
      const f = lissage.v;
      mots.forEach((m, k) => {
        const d = f - (k + 0.5);
        const a = 1 - lisse(0.2, 0.44, Math.abs(d));
        m.style.opacity = a.toFixed(3);
        m.style.transform = `translate3d(0, ${(-d * 70).toFixed(1)}px, 0) scale(${(1 - Math.min(1, Math.abs(d)) * 0.08).toFixed(4)})`;
      });
      panneaux.forEach((p, k) => {
        const d = f - (k + 0.5);
        const m = tr(p);
        m.a = 1 - lisse(0.2, 0.44, Math.abs(d));
        m.y = -d * 110;
        m.s = 1 - Math.min(1, Math.abs(d)) * 0.05;
        p.setAttribute('aria-hidden', String(m.a < 0.5));
        poser(p);
        p.style.opacity = m.a.toFixed(3);                  // la feuille de style part de 0 : l'opacité est toujours écrite
      });
      segs.forEach((s, k) => s.style.setProperty('--p', borne(f + 0.5 - k).toFixed(3)));
      // la lumière du fond suit, et revient au bleu nuit hors de la séquence
      const k0 = Math.min(n - 1, Math.max(0, Math.floor(f - 0.5))), k1 = Math.min(n - 1, k0 + 1), t = borne(f - 0.5 - k0);
      const poids = r.top > 0 ? 1 - borne(r.top / vh) : r.bottom < vh ? borne(r.bottom / vh) : 1;
      etat.ambiance = [0, 1, 2].map((c) => 1 + ((AMB[k0][c] + (AMB[k1][c] - AMB[k0][c]) * t) - 1) * poids);
      etat.aube = (AUBE[k0] + (AUBE[k1] - AUBE[k0]) * t) * poids;
      return bouge;
    },
  };
}

// ---------------------------------------------------------------- le menu du haut : pastille liquide et rubrique
function creerNav() {
  const nav = document.querySelector('.nav-haut');
  const cn = document.querySelector('.cn-section');
  const secs = [...document.querySelectorAll('.scene[data-nom]')];
  const rubrique = cn?.textContent || '';
  const groupe = document.body.dataset.groupe;
  const liens = nav ? [...nav.querySelectorAll('.nav-lien')] : [];
  const lien = liens.find((a) => a.dataset.groupe === groupe);
  liens.forEach((a) => a.toggleAttribute('aria-current', a === lien && a.tagName === 'A'));
  const pastille = nav?.querySelector('.nav-pastille');
  const px = new Ressort(0, 280, 0.8), pw = new Ressort(0, 280, 0.8);
  let survol = null, premier = true, actif = null, fond = null;
  liens.forEach((a) => { a.addEventListener('pointerenter', () => { survol = a; reveil(); }); a.addEventListener('pointerleave', () => { survol = null; reveil(); }); });
  const hero = document.querySelector('.scene.accueil');
  const finCible = document.querySelector('.fiche') || document.getElementById('pied');
  let finVue = null;
  return {
    pas(dt, sy) {
      const vh = innerHeight;
      // la capsule du haut dit où l'on est dans la page
      let nom = rubrique;
      for (const s of secs) if (s.getBoundingClientRect().top <= vh * 0.45) nom = s.dataset.nom || rubrique;
      if (nom !== actif) { actif = nom; if (cn) cn.textContent = nom; }
      const loin = hero ? sy > hero.offsetHeight * 0.5 : sy > 40;
      if (loin !== fond) { fond = loin; html.classList.toggle('barre-visible', loin); }
      // arrivé à la fiche ou au pied, le bouton flottant s'efface : la fin de la page reste nette
      const fin = !!finCible && finCible.getBoundingClientRect().top < vh * 0.9;
      if (fin !== finVue) { finVue = fin; html.classList.toggle('fin-visible', fin); }
      if (!pastille) return false;
      const cible = survol || lien;
      pastille.style.opacity = cible && cible.offsetWidth ? '1' : '0';
      if (cible && cible.offsetWidth) { px.cible = cible.offsetLeft; pw.cible = cible.offsetWidth; if (premier) { px.v = px.cible; pw.v = pw.cible; premier = false; } }
      const b1 = px.pas(dt), b2 = pw.pas(dt);
      const etire = Math.min(26, Math.abs(px.vit) * 0.035);
      pastille.style.transform = `translateX(${(px.v - etire / 2).toFixed(2)}px)`;
      pastille.style.width = `${(pw.v + etire).toFixed(2)}px`;
      return b1 || b2;
    },
  };
}

// ---------------------------------------------------------------- un bouton qui s'étire en menu, vers le bas
const menus = [];
function creerMenu(bouton, menu) {
  if (!bouton || !menu) return nul;
  const m = new Ressort(0, 160, 0.72);
  let ouvert = false;
  const enfants = [...menu.children];
  const plein = menu.hasAttribute('data-plein');
  const moi = {
    get ouvert() { return ouvert; },
    basculer(oui) {
      if (oui === ouvert) return;
      if (oui) menus.forEach((x) => x !== moi && x.basculer(false));
      ouvert = oui;
      bouton.setAttribute('aria-expanded', String(oui));
      if (oui) {
        const b = bouton.getBoundingClientRect();
        if (plein) {
          // le menu complet prend l'écran : il part de la capsule du nom jusqu'au bouton Menu, et ses deux coins du
          // haut épousent exactement leurs bords (même hauteur, même rayon) ; il descend jusqu'en bas de l'écran
          const c = (document.querySelector('.capsule-nom') || bouton).getBoundingClientRect();
          menu.style.left = `${c.left}px`; menu.style.right = 'auto'; menu.style.width = `${b.right - c.left}px`;
          menu.style.top = `${b.top}px`; menu.style.paddingTop = `${b.height + 14}px`;
          menu.style.height = `${innerHeight - b.top - Math.max(12, innerWidth - b.right)}px`;
        } else {
          const L = Math.min(parseFloat(menu.dataset.largeur || '340'), innerWidth - 24);
          const gauche = menu.dataset.cote === 'droite' ? Math.max(12, b.right - L) : Math.max(12, Math.min(b.left, innerWidth - 12 - L));
          menu.style.left = `${gauche}px`; menu.style.right = 'auto'; menu.style.width = `${L}px`;
          menu.style.top = `${b.top}px`; menu.style.paddingTop = `${b.height + 10}px`;
        }
        menu.hidden = false; m.cible = 1;
      } else m.cible = 0;
      html.classList.toggle('menu-ouvert', menus.some((x) => x.ouvert));
      if (lenis) (menus.some((x) => x.ouvert) ? lenis.stop() : lenis.start());
      reveil();
    },
    pas(dt) {
      if (menu.hidden) return false;
      const bouge = m.pas(dt);
      const b = bouton.getBoundingClientRect(), r = menu.getBoundingClientRect();
      const p = Math.max(0, m.v);
      const pl = Math.min(1, p * 1.25), ph = lisse(0.06, 1, p) * (p > 1 ? p : 1);
      const haut = Math.max(0, (b.top - r.top) * (1 - ph)), bas = Math.max(0, (r.bottom - b.bottom) * (1 - ph));
      const gauche = Math.max(0, (b.left - r.left) * (1 - pl)), droite = Math.max(0, (r.right - b.right) * (1 - pl));
      const rayon = plein ? b.height / 2 : b.height / 2 + (28 - b.height / 2) * Math.min(1, p);
      menu.style.clipPath = `inset(${haut}px ${droite}px ${bas}px ${gauche}px round ${rayon}px)`;
      const op = lisse(0.45, 0.95, p);
      enfants.forEach((c) => { c.style.opacity = op.toFixed(3); });
      if (!bouge && m.cible === 0) { menu.hidden = true; menu.style.clipPath = ''; }
      return bouge;
    },
  };
  bouton.addEventListener('click', () => moi.basculer(!ouvert));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) moi.basculer(false); });
  menus.push(moi);
  return moi;
}
function brancherMenus() {
  const liste = [creerMenu(document.querySelector('.nav-lien[aria-controls="menu-acc"]'), document.getElementById('menu-acc')),
    creerMenu(document.querySelector('.bouton-menu'), document.getElementById('menu-tout'))];
  addEventListener('keydown', (e) => { if (e.key === 'Escape') menus.forEach((x) => x.basculer(false)); });
  addEventListener('pointerdown', (e) => { if (!e.target.closest('.menu-verre, .nav-lien[aria-controls], .bouton-menu')) menus.forEach((x) => x.basculer(false)); });
  return liste;
}

// ---------------------------------------------------------------- la capsule qui s'étire en feuille
let ouvertPage = false;
function creerFeuille(el) {
  const cap = el.querySelector('.feuille-capsule'), dedans = el.querySelector('.feuille-interieur');
  if (!cap || !dedans || edition) { if (cap) cap.style.display = 'none'; return nul; }
  const m = new Ressort(0, 62, 0.66);
  const v = (el.__verre ||= {});
  let W = 0, H = 0, cw = 220, vue = false;
  const ch = 56;
  const mesurer = () => { W = el.offsetWidth; H = el.offsetHeight; cw = Math.min(W, (cap.offsetWidth || 200)); reveil(); };
  mesurer();
  new ResizeObserver(mesurer).observe(el);
  // on observe l'emplacement de la feuille (son propre découpage fausserait la mesure de sa visibilité)
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting) vue = true;
    else if (e.boundingClientRect.top > 0) vue = false;
    reveil();
  }, { threshold: 0, rootMargin: '0px 0px -16% 0px' }).observe(el.parentElement);
  let dejaPose = false;
  return {
    pas(dt) {
      m.cible = vue && ouvertPage ? 1 : 0;
      const bouge = m.pas(dt);
      const p = Math.max(0, m.v);
      const ew = Math.min(1.035, p * 1.3), eh = Math.max(0, (p - 0.14) / 0.86);
      const l = cw + (W - cw) * ew, h = ch + (H - ch) * Math.min(1.03, eh);
      const r = 28 + 8 * Math.min(1, p);
      if (!bouge && p >= 0.999) {
        if (!dejaPose) { el.style.clipPath = ''; v.forme = null; cap.style.opacity = '0'; cap.style.visibility = 'hidden'; dedans.style.opacity = ''; dejaPose = true; }
        return false;
      }
      dejaPose = false;
      cap.style.visibility = '';
      el.style.clipPath = `inset(0 ${Math.max(0, W - l).toFixed(1)}px ${Math.max(0, H - h).toFixed(1)}px 0 round ${r.toFixed(1)}px)`;
      v.forme = { x: 0, y: 0, l, h, r };
      cap.style.opacity = (1 - lisse(0.04, 0.3, p)).toFixed(3);
      dedans.style.opacity = lisse(0.5, 0.92, p).toFixed(3);
      return bouge;
    },
  };
}

// ---------------------------------------------------------------- le verre gonfle et s'allume sous le doigt (souris ou toucher)
function creerPressions() {
  const actifs = new Set();
  addEventListener('pointerdown', (e) => {
    const el = e.target.closest('.scene [data-verre]:not([data-verre="voile"]):not([data-verre="texte"])');
    if (!el || edition) return;
    const canvas = el.closest('.scene')?.querySelector('canvas.scene-verre');
    const rc = canvas?.getBoundingClientRect();
    const v = (el.__verre ||= {});
    if (rc) { v.px = e.clientX - rc.left; v.py = e.clientY - rc.top; }
    v.pression = 1; v.appui = true;
    const gonfle = ['capsule', 'notif', 'lentille'].includes(el.dataset.verre) || el.matches('a.widget, .action-rond');
    if (gonfle) { el.__ech ||= new Ressort(1, 320, 0.5); el.__ech.cible = el.matches('a.widget') ? 1.025 : 1.06; }
    actifs.add(el); reveil();
  });
  const relache = () => { for (const el of actifs) { if (el.__verre) el.__verre.appui = false; if (el.__ech) el.__ech.cible = 1; } reveil(); };
  addEventListener('pointerup', relache); addEventListener('pointercancel', relache);
  return {
    pas(dt) {
      let bouge = false;
      for (const el of actifs) {
        const v = el.__verre;
        if (!v.appui) v.pression = Math.max(0, v.pression - dt * 2.2);
        let b = v.pression > 0;
        if (el.__ech) { if (el.__ech.pas(dt)) b = true; tr(el).s = el.__ech.v; poser(el); }
        if (!b && !v.appui) actifs.delete(el); else bouge = true;
      }
      return bouge;
    },
  };
}

// ---------------------------------------------------------------- petites choses
function vcards() {
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-vcard]');
    if (!a) return;
    e.preventDefault();
    const d = a.dataset;
    const texte = ['BEGIN:VCARD', 'VERSION:3.0', `FN:${d.nom}`, `N:${d.nom.split(' ').reverse().join(';')};;;`, `TITLE:${d.metier}`, `TEL;TYPE=CELL:${d.tel}`,
      `EMAIL:${d.mail}`, `ADR;TYPE=WORK:;;${d.rue};${d.ville};;${d.cp};France`, `URL:${location.origin}/`, 'END:VCARD'].join('\r\n');
    const url = URL.createObjectURL(new Blob([texte], { type: 'text/vcard' }));
    const lien = document.createElement('a'); lien.href = url; lien.download = 'Franck-Blandin.vcf';
    document.body.appendChild(lien); lien.click(); lien.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  });
}
function inclinaisonAndroid() {
  if (!('DeviceOrientationEvent' in window) || typeof DeviceOrientationEvent.requestPermission === 'function') return;
  addEventListener('deviceorientation', (e) => { if (e.gamma == null) return; inclinaison = Math.max(-0.6, Math.min(0.6, e.gamma / 60)); reveil(); });
}
// la demande de rendez-vous part sans quitter la page (formulaire Netlify) ; sans réponse du serveur, on le dit
function formulaires() {
  for (const f of document.querySelectorAll('form[data-envoi]')) {
    const etatF = f.parentElement.querySelector('.formulaire-etat');
    f.addEventListener('submit', async (e) => {
      e.preventDefault();
      // l'aperçu (votremaquette.fr, hébergement sans formulaires) : on le dit au lieu de faire semblant d'envoyer
      if (/votremaquette\.fr$|github\.io$/.test(location.hostname)) {
        const mot = 'Version d’aperçu du site : cette demande ne part pas encore. Le formulaire fonctionnera une fois le site en ligne.';
        if (etatF) { etatF.textContent = mot; etatF.classList.add('echec'); etatF.hidden = false; etatF.focus(); reveil(); } else alert(mot);
        return;
      }
      const bouton = f.querySelector('[type="submit"]'); if (bouton) bouton.disabled = true;
      let ok = false;
      try { const r = await fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(new FormData(f)).toString() }); ok = r.ok; } catch { ok = false; }
      if (bouton) bouton.disabled = false;
      if (!etatF) { if (ok) location.href = f.getAttribute('action'); return; }
      etatF.textContent = ok ? etatF.dataset.merci : etatF.dataset.echec;
      etatF.classList.toggle('echec', !ok);
      etatF.hidden = false; etatF.focus();
      if (ok) f.reset();
      reveil();
    });
  }
}


// ---------------------------------------------------------------- démarrage
async function demarrer() {
  const t0 = performance.now();
  const premiereVisite = html.classList.contains('charge');
  try { sessionStorage.setItem('fb-vu', '1'); } catch { /* rien */ }
  document.querySelectorAll('[data-annee]').forEach((e) => { e.textContent = new Date().getFullYear(); });
  if (edition) html.classList.add('edition');
  adapter();
  decouperMots();
  // le verre : un seul canevas fixe ; sans WebGL2, le verre dépoli en CSS prend le relais
  const gl = scenesGL();
  const tete = document.querySelector('main .scene');
  const ouverture = creerOuverture();
  const intro = creerIntro(tete);
  modules.push(intro, creerDeverrou(), creerApparitions(tete), creerParallaxe(), creerSequence(), creerNav(), ...brancherMenus(),
    ...[...document.querySelectorAll('.feuille[data-morph]')].map(creerFeuille), creerPressions());
  demarrerDefilement(); ancres();
  vcards(); inclinaisonAndroid(); formulaires();
  addEventListener('scroll', reveil, { passive: true });
  let attente;
  const remesurer = () => { clearTimeout(attente); attente = setTimeout(() => { gl.remesurer?.(); lenis?.resize(); reveil(); }, 220); };
  addEventListener('resize', remesurer);
  new ResizeObserver(remesurer).observe(document.querySelector('main') || document.body);
  document.fonts?.addEventListener?.('loadingdone', remesurer);
  if (edition) document.addEventListener('input', reveil);

  // prêt avant d'ouvrir : la police, la photo de l'accueil, le verre compilé et dessiné une fois
  const attendrePolice = async () => { await document.fonts?.load('800 120px Inter'); await document.fonts?.load('400 17px Inter'); await document.fonts?.ready; };
  const pret = (async () => {
    await Promise.race([attendrePolice(), pause(1800)]);
    const sc = await gl.premiere(tete);
    if (sc) sc.dessiner(etat);
  })();
  gl.observer?.();
  reveil();

  let ouvert = false;
  const ouvrir = () => {
    if (ouvert) return;
    ouvert = true; ouvertPage = true;
    ouverture.ouvrir();
    html.classList.remove('charge'); html.classList.add('pret');
    setTimeout(() => intro.lancer(), premiereVisite ? 380 : 0);
    reveil();
  };
  addEventListener('keydown', ouvrir, { once: true });
  const mini = premiereVisite ? 1100 : 40, maxi = premiereVisite ? 2600 : 650;
  await Promise.race([pret.then(() => pause(mini - (performance.now() - t0))), pause(maxi - (performance.now() - t0))]);
  ouvrir();
}

demarrer().catch((e) => { console.error(e); html.classList.remove('charge'); html.classList.add('pret'); document.querySelector('.ouverture')?.remove(); });

})();
