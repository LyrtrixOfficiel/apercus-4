// Page Bonjour statique : ouverture, salutation, aperçu en direct, un seul bouton de couleur.
(function () {
  var H = document.documentElement; H.classList.add('vivant');
  var reduit = false, /* copie locale : le réglage du système n'est jamais lu, tout bouge toujours */ etroit = matchMedia('(max-width: 699px)');
  var APP = { ordi: { l: 1280, h: 800 }, tel: { l: 390, h: 844 } };
  var mode = etroit.matches ? 'tel' : 'ordi', actif = 0, jeton = 0;
  var D = JSON.parse(document.getElementById('donnees').textContent);
  var $ = function (s) { return document.querySelector(s); };
  var pause = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };

  var ouverture = H.classList.contains('ouverture'), V = null, presse = false, reveil = null;
  if (ouverture) {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    scrollTo(0, 0);
    try { V = voile(document.getElementById('voile-toile'), { reduit: reduit, depart: D.voile, premiere: function () { $('#voile').classList.add('gl'); } }); } catch (e) {}
    var passer = function () { presse = true; if (reveil) reveil(); };
    ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(function (ev) { addEventListener(ev, passer, { once: true, passive: true }); });
  }
  var attendre = function (ms) { return presse ? Promise.resolve() : new Promise(function (r) { var t = setTimeout(r, ms); reveil = function () { clearTimeout(t); r(); }; }); };

  function ajuster() {
    var v = $('#ecran-vue'), f = $('#apercu'); if (!v || !f) return;
    var k = v.clientWidth / APP[mode].l; if (k > 0) v.style.setProperty('--k', k.toFixed(5));
    if (k > 0 && etroit.matches) f.style.height = Math.round(v.clientHeight / k) + 'px'; else f.style.height = '';
  }
  function lien(apercu) { return 'site/index.html?palette=' + D.ambiances[actif][0] + (apercu ? '&apercu=1' : ''); }
  var finPret = null;
  addEventListener('message', function (e) {
    var f = $('#apercu'); if (!f || e.source !== f.contentWindow || !e.data) return;
    if (e.data.type === 'kazura-pret' && finPret) finPret();
    if (e.data.type === 'kazura-defile') $('#ecran').classList.add('defile');
  });
  function montrer() {
    var f = $('#apercu'), ecran = $('#ecran'), j = ++jeton, url = lien(true);
    ecran.classList.remove('pret'); $('#ecran-voile').href = lien(); $('#ouvrir').href = lien();
    pause(f.dataset.url ? (reduit ? 520 : 380) : 0).then(function () {
      if (j !== jeton) return;
      f.dataset.url = url; f.src = url;
      var fait = false, fin = function () { if (fait || j !== jeton) return; fait = true; finPret = null; ecran.classList.add('pret'); };
      finPret = fin; setTimeout(fin, 6000);
    });
  }
  function teinte() {
    var a = D.ambiances[actif], b = $('#couleur'); if (!b) return;
    b.style.setProperty('--c', a[2]); b.title = 'Changer la couleur (' + a[1] + ')';
  }
  function couleurSuivante() {
    actif = (actif + 1) % D.ambiances.length; teinte();
    $('#ecran-voile').href = lien(); $('#ouvrir').href = lien();
    var f = $('#apercu'); f.dataset.url = lien(true);
    if (f.contentWindow) f.contentWindow.postMessage({ type: 'kazura-couleur', palette: D.ambiances[actif][0] }, '*');
  }
  function changerMode(m) {
    if (m === mode || (etroit.matches && m !== 'tel')) return;
    mode = m; var a = $('#appareil'); a.dataset.mode = m; a.style.setProperty('--vl', APP[m].l); a.style.setProperty('--vh', APP[m].h);
    document.querySelectorAll('.mode').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.mode === m)); });
    ajuster(); montrer();
  }
  document.addEventListener('click', function (e) {
    if (e.target.closest('#couleur')) { couleurSuivante(); return; }
    var m = e.target.closest('.mode'); if (m) changerMode(m.dataset.mode);
  });
  etroit.addEventListener && etroit.addEventListener('change', function () { if (etroit.matches && mode !== 'tel') changerMode('tel'); });

  function finir() { H.classList.remove('ouverture', 'voile-actif'); H.classList.add('pret'); }
  async function demarrer() {
    var a = $('#appareil'); a.dataset.mode = mode; a.style.setProperty('--vl', APP[mode].l); a.style.setProperty('--vh', APP[mode].h);
    document.querySelectorAll('.mode').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.mode === mode)); });
    new ResizeObserver(ajuster).observe($('#ecran-vue')); ajuster(); teinte(); montrer();
    if (!ouverture) { finir(); return; }
    if (document.fonts && document.fonts.load) await Promise.race([Promise.all([document.fonts.load('300 80px Newsreader', 'Bonjour'), document.fonts.load('italic 400 80px Newsreader', D.nom)]).catch(function () {}), pause(2000)]);
    var h1 = $('#salut'), place = h1.getBoundingClientRect();
    var echelle = Math.max(1, Math.min(2.2, (innerWidth * (innerWidth < 700 ? 0.9 : 0.78)) / place.width, (innerHeight * 0.5) / place.height));
    h1.style.transform = 'translate(' + Math.round(innerWidth / 2 - (place.left + place.width / 2)) + 'px, ' + Math.round(innerHeight / 2 - (place.top + place.height / 2)) + 'px) scale(' + echelle.toFixed(3) + ')';
    void h1.offsetWidth; H.classList.add('ecrit');
    var lettres = h1.querySelectorAll('.l').length;
    await attendre((reduit ? 300 + lettres * 12 + 700 : 200 + lettres * 28 + 620) + 280);
    if (!presse) { H.classList.add('invite'); await attendre(30000); }
    var vite = presse; h1.classList.add('vole'); void h1.offsetWidth; h1.style.transform = '';
    H.classList.remove('ouverture'); var vo = $('#voile'); vo.style.pointerEvents = 'none';
    var duree = vite ? 700 : reduit ? 1000 : 1100, cx = place.left + place.width * 0.45, cy = place.top + place.height / 2;
    if (V) await V.ouvrir(duree, cx, cy);
    else { vo.style.setProperty('--cx', Math.round(cx) + 'px'); vo.style.setProperty('--cy', Math.round(cy) + 'px'); vo.classList.add('css-ouvre'); await pause(duree); }
    H.classList.remove('voile-actif'); if (V) V.detruire();
    setTimeout(function () { h1.classList.remove('vole'); }, 1400);
    finir();
  }
  demarrer().catch(function (e) { console.error(e); finir(); });
})();
