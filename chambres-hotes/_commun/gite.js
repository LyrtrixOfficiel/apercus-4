/* Famille « chambres d'hôtes et gîtes » (24/11/2026). Un seul script pour toutes les maquettes : il écrit la page à partir de
   window.MAISON (les données de l'hébergement, écrites par le générateur dans index.html), puis l'anime. Script classique
   (pas de module) pour que la page s'ouvre aussi depuis le disque. Le réglage « mouvements réduits » n'est jamais lu ;
   ?calme=1 coupe le mouvement automatique, ?sansbonjour saute les volets. Rien n'est inventé : ce qu'on ne sait pas reste
   en pointillés. */
(function () {
  'use strict';
  var H = document.documentElement, M = window.MAISON || {};
  var calme = H.classList.contains('calme');
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function e(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var EX = '<span class="ex" title="à remplir avec vos mots">&nbsp;</span>';
  var CH = M.cat === 'chambres';
  var P = M.ph || {};
  function img(k, alt, taille, charge) {
    if (!k) return '';
    return '<img src="../_commun/photos/' + k + '.webp" srcset="../_commun/photos/' + k + '-800.webp 800w, ../_commun/photos/' + k + '.webp 1400w" sizes="' +
      (taille || '(max-width: 820px) 100vw, 50vw') + '" alt="' + e(alt || '') + '" loading="' + (charge || 'lazy') + '" decoding="async">';
  }
  function cadre(k, cls, alt) { return '<figure class="cadre ' + (cls || '') + '">' + img(k, alt) + '</figure>'; }
  var SCEAU = '<svg viewBox="0 0 100 100" aria-hidden="true"><g fill="currentColor" fill-rule="evenodd"><path d="M50 2a48 48 0 1 0 0 96 48 48 0 1 0 0-96zm0 6a42 42 0 1 1 0 84 42 42 0 1 1 0-84z"/>' +
    '<path d="M50 46C39.5 37 34.5 23.5 50 7c15.5 16.5 10.5 30 0 39zm0-7.4c6.2-6 8.6-14.4 0-23.6-8.6 9.2-6.2 17.6 0 23.6z"/>' +
    '<path d="M50 46C39.5 37 34.5 23.5 50 7c15.5 16.5 10.5 30 0 39zm0-7.4c6.2-6 8.6-14.4 0-23.6-8.6 9.2-6.2 17.6 0 23.6z" transform="rotate(120 50 50)"/>' +
    '<path d="M50 46C39.5 37 34.5 23.5 50 7c15.5 16.5 10.5 30 0 39zm0-7.4c6.2-6 8.6-14.4 0-23.6-8.6 9.2-6.2 17.6 0 23.6z" transform="rotate(240 50 50)"/><circle cx="50" cy="50" r="4.6"/></g></svg>';

  /* ---------------- les mots de la maison ---------------- */
  var nom = M.nom, ville = M.ville, qui = M.prenom || '';
  function deNom(n) { return /^Le /.test(n) ? 'du ' + n.slice(3) : /^Les /.test(n) ? 'des ' + n.slice(4) : 'de ' + n; }
  var genre = CH ? 'Chambres d’hôtes' : (M.logements && M.logements.length > 1 ? 'Gîtes' : 'Gîte');
  var lesCh = CH ? 'Les chambres' : (M.logements && M.logements.length > 1 ? 'Les gîtes' : 'Le gîte');
  var telLien = M.tel ? 'href="tel:+33' + M.tel.replace(/\D/g, '').slice(1) + '"' : 'href="#venir"';
  var telTxt = M.tel ? M.tel.replace(/\D/g, '').replace(/(\d\d)(?=\d)/g, '$1 ') : 'Votre numéro';
  var aVille = (/^(Le|Les) /.test(ville) ? (/^Les /.test(ville) ? 'aux ' + ville.slice(4) : 'au ' + ville.slice(3)) : 'à ' + ville);
  var dep = M.dep ? (M.dep + (M.region ? ', ' + M.region : '')) : (M.region || '');
  var carte = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent((M.adr ? M.adr + ' ' : '') + M.cp + ' ' + ville);
  var lg = nom.length, clsH1 = lg > 24 ? 'tres-long' : lg > 13 ? 'long' : '';
  function lettres(t) {
    var i = 0;
    return t.split(' ').map(function (mot) {
      var s = mot.split('').map(function (c, j) { return '<span class="l" style="transition-delay:' + (0.35 + (i + j) * 0.04).toFixed(2) + 's">' + e(c) + '</span>'; }).join('');
      i += mot.length;
      return '<span style="white-space:nowrap">' + s + '</span>';
    }).join(' ');
  }
  var logements = (M.logements && M.logements.length > 1) ? M.logements : (CH ? Array.apply(null, Array(M.nbch || 3)).map(function (x, i) { return 'Chambre ' + (i + 1); }) : [nom]);
  var connus = M.logements && M.logements.length > 1;
  var proches = (M.autour || []).slice(0, 6);
  var villeP = (M.villes || [])[0];

  /* ---------------- accueil ---------------- */
  var badge = M.classement ? '<p class="badge"><b>' + (/(\d)/.test(M.classement) ? new Array(+M.classement.match(/\d/)[0] + 1).join('★') : '★') + '</b>' + e(M.classement) + '</p>' : '';
  var desc = (M.desc || []).map(function (p) { return '<p>' + e(p) + '</p>'; }).join('');
  var faits = [];
  faits.push(CH ? '<p class="monte"><b>' + (connus ? logements.length : M.nbch || '...') + '</b><span>' + (connus ? 'chambres et logements' : M.nbch ? 'chambres, chacune la sienne' : 'chambres, à compléter') + '</span></p>' : '<p class="monte"><b>' + (M.capa ? M.capa : connus ? logements.length : '1') + '</b><span>' + (M.capa ? 'personnes, au plus' : connus ? 'gîtes à louer' : 'gîte rien que pour vous') + '</span></p>');
  faits.push('<p class="monte"><b>' + (villeP ? villeP[1] + ' km' : '...') + '</b><span>' + (villeP ? 'de ' + e(villeP[0]) + ', à vol d’oiseau' : 'de la ville la plus proche') + '</span></p>');
  faits.push('<p class="monte"><b>0 %</b><span>de commission quand on réserve ici, en direct</span></p>');
  var ruban = [genre, ville, M.dep, CH ? 'Petit-déjeuner compris' : 'Location en direct', 'Sans commission', 'Réservation en direct'].filter(Boolean);
  var m1 = CH ? ['Le matin', '8 h', 'Le petit-déjeuner', 'Il est compris dans la nuit, servi à la maison. Ce que vous y mettez, en quelques mots : ' + EX] :
    ['Le matin', '8 h', 'Le premier café', 'La maison est à vous, à votre rythme. Ce qui attend vos hôtes à leur arrivée : ' + EX];
  var m2 = ['L’après-midi', '15 h', 'Autour de la maison', proches.length ? 'À ' + proches[0][2] + ' km : ' + e(proches[0][0]) + (proches[1] ? '. Puis ' + e(proches[1][0]) + ', à ' + proches[1][2] + ' km.' : '.') + ' Toute la région est sur sa page.' : 'Vos balades, vos adresses, ce qu’il ne faut pas manquer : ' + EX];
  var m3 = ['Le soir', '21 h', 'Le calme ' + (aVille.indexOf('à ') === 0 ? 'de ' + ville : aVille.replace(/^à /, '')), 'Vos conseils pour dîner, une table d’hôtes peut-être : ' + EX];
  var moments = [m1, m2, m3].map(function (m, i) {
    return '<div class="moment"><p class="heure monte">' + m[1] + '<small>' + m[0] + '</small></p><div><h3 class="mots">' + e(m[2]) + '</h3><p class="chapo monte" style="font-size:18px">' + m[3] + '</p></div>' + cadre((P.moments || [])[i]) + '</div>';
  }).join('');
  var accueil =
    '<section class="heros" aria-label="' + e(nom) + '">' +
    '<div class="h-txt"><p class="lieu">' + e(genre) + ' ' + e(aVille) + '</p><h1 class="' + clsH1 + '" aria-label="' + e(nom) + '">' + lettres(nom) + '</h1>' +
    '<p class="sous">' + (function () { var t = (qui && !/^chez /i.test(nom) ? 'Chez ' + qui + ', ' : '') + (M.dans ? M.dans + '. ' : ''); return e(t.charAt(0).toUpperCase() + t.slice(1)); })() + '<strong>Réservez en direct, sans commission.</strong></p>' + badge +
    '<div class="actions"><a class="bt plein" href="#reserver">Demander mes dates</a><a class="bt" ' + telLien + '>' + e(telTxt) + '</a></div></div>' +
    '<figure class="cadre h-photo">' + img(P.heros, 'La maison', '100vw', 'eager') + '</figure><div class="carte-p">' + e(ville) + '</div></section>' +
    '<div class="ruban" aria-hidden="true"><div class="piste">' + ruban.concat(ruban).map(function (s) { return '<span>' + e(s) + '</span>'; }).join('') + '</div></div>' +
    '<section class="bloc"><div class="large maison-g"><div><p class="kicker">La maison</p><h2 class="mots">' + (qui ? 'Bienvenue <em>chez ' + e(qui) + '.</em>' : 'Bienvenue, <em>entrez.</em>') + '</h2>' +
    (desc ? '<div class="desc monte">' + desc + '</div><p class="source">Votre présentation, reprise de votre fiche à l’office de tourisme. On la réécrit ensemble si vous voulez.</p>' :
      '<p class="chapo monte">Votre maison en quelques lignes : son histoire, ce qu’on y ressent en arrivant. ' + EX + '</p>') +
    '</div>' + cadre(P.maison, 'arche') + '</div><div class="large faits">' + faits.join('') + '</div></section>' +
    '<section class="bloc doux"><div class="large"><p class="kicker">Une journée ici</p><h2 class="mots">Du matin <em>au soir.</em></h2><div class="journee">' + moments + '</div></div></section>' +
    '<section class="bloc profond"><div class="large"><p class="kicker">' + e(lesCh) + '</p><h2 class="mots">Prenez <em>une clé.</em></h2>' +
    '<p class="chapo monte">' + (connus ? 'Chaque logement a sa page. ' : '') + 'Choisissez au tableau de l’entrée : sa fiche s’ouvre sur la page « ' + e(lesCh) + ' ».</p>' +
    tableau('lien') + '</div></section>' +
    '<section class="bloc accent"><div class="large"><p class="kicker">Réserver en direct</p><h2 class="mots">Pas de commission, <em>pas d’intermédiaire.</em></h2>' +
    '<div class="direct"><div class="monte"><b>Vos hôtes choisissent</b>leurs dates, le nombre de personnes, ' + (CH ? 'la chambre' : 'le logement') + '.</div>' +
    '<div class="monte"><b>La demande vous arrive</b>par SMS ou par mail, depuis leur téléphone.</div><div class="monte"><b>Vous confirmez</b>vous-même. Rien ne part sans vous, rien n’est prélevé.</div></div>' +
    '<div class="actions"><a class="bt plein" href="#reserver">Essayer le registre</a></div></div></section>' +
    '<section class="bloc"><div class="large"><p class="kicker">Le livre d’or</p><h2 class="mots">Ils en <em>parlent.</em></h2><p class="chapo monte">Vos avis s’afficheront ici, avec votre note. Aucun avis n’est inventé.</p>' +
    '<div class="avis-vide"><div class="monte"><b>« ' + EX + ' »</b>Prénom, en ' + EX + '</div><div class="monte"><b>« ' + EX + ' »</b>Prénom, en ' + EX + '</div><div class="monte"><b>« ' + EX + ' »</b>Prénom, en ' + EX + '</div></div></div></section>';

  function tableau(mode) {
    return '<div class="tableau monte"><p class="t">Le tableau des clés</p><div class="cles">' + logements.map(function (l, i) {
      return '<button type="button" class="cle" data-cle="' + i + '"' + (mode === 'lien' ? ' data-lien-cle="1"' : '') + '><span class="bascule"><span class="anneau"></span><span class="tige"></span><span class="etiq">' + e(l) + '</span></span></button>';
    }).join('') + '</div></div>';
  }

  /* ---------------- les chambres / le gîte ---------------- */
  var eq = (M.eq || []);
  var fiches = logements.map(function (l, i) {
    return '<div class="fiche-ch" data-fiche="' + i + '"' + (i ? ' hidden' : '') + '>' + cadre((P.chambres || [])[i % Math.max(1, (P.chambres || []).length)]) +
      '<div><p class="kicker">' + (CH ? 'Chambre' : 'Logement') + '</p><h3 style="font-size:clamp(32px,4vw,54px)">' + e(l) + '</h3><ul class="liste">' +
      (CH ? '<li>Le lit<small>' + EX + '</small></li><li>Salle d’eau<small>' + EX + '</small></li><li>Pour combien<small>' + EX + ' personnes</small></li><li>La vue<small>' + EX + '</small></li>' :
        '<li>Pour combien<small>' + (M.capa && !connus ? 'jusqu’à ' + M.capa : EX) + ' personnes</small></li><li>Chambres et lits<small>' + EX + '</small></li><li>Cuisine et pièce de vie<small>' + EX + '</small></li><li>Dehors<small>' + EX + '</small></li>') +
      '</ul><div class="actions"><a class="bt plein" href="#reserver" data-pour="' + e(l) + '">Demander ' + (CH ? 'cette chambre' : 'ce logement') + '</a></div></div></div>';
  }).join('');
  var chambres =
    '<section class="bloc p-heros doux"><div><p class="num">' + e(lesCh) + '</p><h1 class="mots">' + (CH ? 'Une clé, <em>une chambre.</em>' : 'Une maison <em>pour vous.</em>') + '</h1>' +
    '<p class="chapo monte">' + (CH ? 'Chaque chambre a sa fiche : le lit, la salle d’eau, la vue. Les noms, les photos et les détails sont les vôtres.' : 'Le logement en détail : les chambres, la cuisine, le dehors. Les photos et les détails sont les vôtres.') + '</p></div>' + cadre((P.chambres || [])[0]) + '</section>' +
    '<section class="bloc profond"><div class="large">' + tableau('fiche') + fiches + '</div></section>' +
    '<section class="bloc"><div class="large tarifs-g"><div><p class="kicker">Ce qui vous attend</p><h2 class="mots">Le confort, <em>en détail.</em></h2>' +
    (eq.length ? '<p class="chapo monte">Ce que dit votre fiche :</p><div class="puces-eq monte">' + eq.map(function (x) { return '<span>' + e(x) + '</span>'; }).join('') + '</div><p class="monte" style="margin-top:18px">Et le reste : ' + EX + '</p>' :
      '<p class="chapo monte">Wifi, parking, jardin, linge de maison, animaux : ce que vous proposez, ' + EX + '</p>') +
    '</div><div class="galerie" style="margin-top:0;grid-template-columns:1fr 1fr">' + (P.gal || []).slice(0, 2).map(function (k) { return cadre(k); }).join('') + '</div></div></section>';

  /* ---------------- tarifs ---------------- */
  function ligne(q, s) { return '<li class="monte"><span class="q">' + q + (s ? '<small>' + s + '</small>' : '') + '</span><span class="pt"></span><span class="p">' + EX + ' €</span></li>'; }
  var tarifs =
    '<section class="bloc p-heros"><div><p class="num">Tarifs</p><h1 class="mots">Les prix, <em>sans surprise.</em></h1><p class="chapo monte">Vos prix à vous, tels que vous les fixez. En réservant ici, vos hôtes ne paient pas de frais de plateforme.</p>' +
    '<div class="actions"><a class="bt plein" href="#reserver">Demander mes dates</a></div></div>' + cadre(P.tarifs, 'arche') + '</section>' +
    '<section class="bloc doux"><div class="large tarifs-g"><div><p class="kicker">' + (CH ? 'La nuit, petit-déjeuner compris' : 'La location') + '</p><h2 class="mots">Selon <em>la saison.</em></h2><ul class="tarifs">' +
    (CH ? ligne('Une personne', 'la nuit') + ligne('Deux personnes', 'la nuit') + ligne('Personne en plus', 'la nuit') + ligne('Haute saison', 'de ' + '<span class="ex" style="min-width:3em">&nbsp;</span> à <span class="ex" style="min-width:3em">&nbsp;</span>') + ligne('Table d’hôtes', 'le repas, sur réservation')
      : ligne('La nuit', 'hors saison, selon disponibilité') + ligne('Le week-end', 'deux nuits') + ligne('La semaine', 'basse saison') + ligne('La semaine', 'haute saison') + ligne('Ménage de fin de séjour', 'en option')) +
    '</ul></div><div><p class="kicker">Bon à savoir</p><ul class="liste">' +
    (CH ? '<li>Petit-déjeuner<small>compris, servi à la maison</small></li>' : '<li>Linge de maison<small>' + EX + '</small></li>') +
    '<li>Taxe de séjour<small>' + EX + ' € par personne et par nuit</small></li><li>Arrivée et départ<small>' + EX + '</small></li><li>Acompte et annulation<small>' + EX + '</small></li><li>Paiement<small>' + EX + '</small></li></ul></div></div></section>';

  /* ---------------- réserver ---------------- */
  var reserver =
    '<section class="bloc p-heros"><div><p class="num">Réserver</p><h1 class="mots">Le registre <em>de la maison.</em></h1><p class="chapo monte">Choisissez vos dates : le message s’écrit tout seul et part depuis votre téléphone. Rien n’est envoyé sans vous, rien n’est payé ici.</p></div>' + cadre(P.reserver) + '</section>' +
    '<section class="bloc doux" id="reg"><div class="large"><div class="registre"><form onsubmit="return false"><p class="main" style="margin:0">Le registre</p>' +
    '<div class="deux"><div><label for="r-a">Arrivée</label><input id="r-a" type="date"></div><div><label for="r-d">Départ</label><input id="r-d" type="date"></div></div>' +
    '<div class="deux"><div><label>Adultes</label><div class="pas" data-pas="ad"><button type="button" data-d="-1">−</button><output>2</output><button type="button" data-d="1">+</button></div></div>' +
    '<div><label>Enfants</label><div class="pas" data-pas="en"><button type="button" data-d="-1">−</button><output>0</output><button type="button" data-d="1">+</button></div></div></div>' +
    '<label for="r-c">' + (CH ? 'La chambre' : 'Le logement') + '</label><select id="r-c"><option value="">Peu importe</option>' + logements.map(function (l) { return '<option>' + e(l) + '</option>'; }).join('') + '</select>' +
    '<label for="r-m">Un mot</label><textarea id="r-m" maxlength="300" placeholder="Nous arrivons vers 18 h, avec un chien..."></textarea></form>' +
    '<div class="recap"><p class="kicker" style="color:inherit;opacity:.8">Votre demande</p><p class="nuits" id="r-n">Vos dates</p><p id="msg"></p>' +
    '<div class="actions">' + (M.mobile ? '<a class="bt plein" id="r-sms" href="sms:' + M.mobile + '">Envoyer par SMS</a>' : '') +
    (M.mail ? '<a class="bt' + (M.mobile ? '' : ' plein') + '" id="r-mail" href="mailto:' + e(M.mail) + '">Envoyer par mail</a>' : '') + '<a class="bt" ' + telLien + '>Appeler</a></div>' +
    '<div class="cal-t"><b id="cal-m"></b><span><button type="button" data-cal="-1">‹</button> <button type="button" data-cal="1">›</button></span></div><div class="cal" id="cal"></div>' +
    '<p class="legende" style="color:inherit">Vos disponibilités s’afficheront ici, synchronisées avec vos autres calendriers (Airbnb, Booking, Gîtes de France).</p></div></div></div></section>';

  /* ---------------- la région ---------------- */
  var region =
    '<section class="bloc p-heros"><div><p class="num">La région</p><h1 class="mots">' + e(ville) + ', <em>et autour.</em></h1><p class="chapo monte">' + (M.dans ? e(ville) + ', ' + e(M.dans) + '. ' : '') + 'Ce qu’il y a à voir, à faire, à goûter, à quelques minutes de la maison.</p></div>' + cadre((P.region || [])[0]) + '</section>' +
    '<section class="bloc doux"><div class="large"><p class="kicker">À voir autour</p><h2 class="mots">À deux pas, <em>ou presque.</em></h2>' +
    (proches.length ? '<div class="autour">' + proches.map(function (p) { return '<div class="lieu-c monte"><small>' + e(p[1]) + '</small><b>' + e(p[0]) + '</b><span>' + p[2] + ' km à vol d’oiseau</span></div>'; }).join('') +
      '</div><p class="legende">Les lieux viennent des fiches des offices de tourisme (DATAtourisme). Vos coups de cœur en plus : ' + EX + '</p>' :
      '<p class="chapo monte">Vos coups de cœur autour de la maison : ' + EX + '</p>') + '</div></section>' +
    '<section class="bloc"><div class="large"><p class="kicker">Vos adresses</p><h2 class="mots">Ce que <em>vous conseillez.</em></h2><ul class="liste" style="max-width:760px">' +
    '<li>Pour dîner<small>' + EX + '</small></li><li>Le marché<small>' + EX + '</small></li><li>La balade préférée<small>' + EX + '</small></li><li>Quand il pleut<small>' + EX + '</small></li></ul>' +
    '<div class="galerie">' + (P.region || []).slice(1, 4).map(function (k) { return cadre(k); }).join('') + '</div><p class="legende">Photos d’illustration, en attendant les vôtres.</p></div></section>';

  /* ---------------- venir ---------------- */
  var plan = (M.lat && M.lon) ? '<iframe class="carte-plan" loading="lazy" title="Plan" src="https://www.openstreetmap.org/export/embed.html?bbox=' + (M.lon - .03).toFixed(4) + '%2C' + (M.lat - .018).toFixed(4) + '%2C' + (M.lon + .03).toFixed(4) + '%2C' + (M.lat + .018).toFixed(4) + '&amp;layer=mapnik&amp;marker=' + M.lat + '%2C' + M.lon + '"></iframe>' : '<div class="carte-plan" style="display:grid;place-items:center">Le plan, ici.</div>';
  var waze = (M.lat && M.lon) ? 'https://www.waze.com/ul?ll=' + M.lat + '%2C' + M.lon + '&navigate=yes' : carte;
  var venir =
    '<section class="bloc p-heros doux"><div><p class="num">Venir</p><h1 class="mots">La route <em>jusqu’ici.</em></h1><p class="chapo monte">' + (M.adr ? e(M.adr) + ', ' : '') + e(M.cp) + ' ' + e(ville) + '.</p>' +
    '<div class="actions"><a class="bt plein" href="' + carte + '" target="_blank" rel="noopener">Itinéraire</a><a class="bt" href="' + waze + '" target="_blank" rel="noopener">Waze</a></div></div>' + cadre(P.venir) + '</section>' +
    '<section class="bloc"><div class="large venir-g"><div><p class="kicker">L’accès</p><h2 class="mots">Par la route, <em>par le train.</em></h2><ul class="liste">' +
    (M.villes || []).map(function (v) { return '<li>' + e(v[0]) + '<small>' + v[1] + ' km à vol d’oiseau</small></li>'; }).join('') +
    '<li>La gare la plus proche<small>' + EX + '</small></li><li>L’aéroport<small>' + EX + '</small></li>' +
    (M.lat ? '<li>Coordonnées GPS<small>' + M.lat + ', ' + M.lon + '</small></li>' : '') + '</ul></div><div>' + plan + '<p class="legende">Plan : © les contributeurs d’OpenStreetMap.</p></div></div></section>' +
    '<section class="bloc profond"><div class="large venir-g"><div><p class="kicker">Nous joindre</p><h2 class="mots">Une question <em>avant de venir ?</em></h2></div><ul class="liste">' +
    '<li>Téléphone<small>' + (M.tel ? '<a ' + telLien + '>' + e(telTxt) + '</a>' : EX) + '</small></li><li>Adresse mail<small>' + (M.mail ? '<a href="mailto:' + e(M.mail) + '">' + e(M.mail) + '</a>' : EX) + '</small></li>' +
    '<li>Adresse<small>' + (M.adr ? e(M.adr) + ', ' : EX + ', ') + e(M.cp) + ' ' + e(ville) + '</small></li><li>Arrivée<small>à partir de ' + EX + '</small></li></ul></div></section>';

  /* ---------------- la page ---------------- */
  var pages = [['accueil', 'Accueil', accueil], ['chambres', lesCh, chambres], ['tarifs', 'Tarifs', tarifs], ['reserver', 'Réserver', reserver], ['region', 'La région', region], ['venir', 'Venir', venir]];
  var nav = pages.map(function (p) { return '<a href="#' + p[0] + '" data-lien="' + p[0] + '">' + e(p[1]) + '</a>'; }).join('');
  var bonjour = '<div class="bonjour" id="bonjour" aria-hidden="true"><div class="vt vg"></div><div class="vt vd"></div><div class="mot"><p><span class="b1">Bonjour' + (qui ? ' ' + e(qui) : '') + ',</span><span class="b2">voici le site ' + (M.generique ? 'de vos ' + (CH ? 'chambres d’hôtes' : 'gîtes') + ' <b>' + e(aVille) + '</b>.' : e(deNom(nom)).replace(/^(du|des|de) /, '$1 <b>') + '</b>, ' + e(aVille) + '.') + '</span></p></div></div>';
  document.body.innerHTML = '<a class="evitement" href="#contenu">Aller au contenu</a>' + bonjour +
    '<header class="tete" id="tete"><a class="nom-tete" href="#accueil">' + e(nom) + '</a><nav class="nav" aria-label="Pages">' + nav + '</nav>' +
    '<div class="tete-d"><a class="kz" href="https://kazura.fr" target="_blank" rel="noopener" aria-label="Kazura, créateur de sites">' + SCEAU + '<span>Kazura</span></a>' +
    '<a class="bt-app" href="#reserver">Réserver</a><button class="bt-menu" id="bt-menu" type="button" aria-controls="menu">Menu</button></div></header>' +
    '<nav class="menu" id="menu" aria-hidden="true" aria-label="Menu"><button class="fermer" id="fermer-menu" type="button">Fermer</button>' + nav +
    '<div class="menu-bas"><a class="bt plein" ' + telLien + '>' + e(telTxt) + '</a><a class="kz" href="https://kazura.fr" target="_blank" rel="noopener">' + SCEAU + '<span>Kazura</span></a></div></nav>' +
    '<div class="voile" id="voile" aria-hidden="true"></div><div class="cadran" id="cadran" aria-hidden="true"><b></b><i></i></div>' +
    '<main id="contenu">' + pages.map(function (p) { return '<div class="page' + (p[0] === 'accueil' ? ' active' : '') + '" data-page="' + p[0] + '">' + p[2] + '</div>'; }).join('') + '</main>' +
    '<footer class="pied"><p class="grand">Votre site peut avoir <em>autant de pages</em> que vous voulez.</p><ul class="pages-liste">' +
    pages.map(function (p) { return '<li><a href="#' + p[0] + '">' + e(p[1]) + '</a></li>'; }).join('') +
    ['+ une page par ' + (CH ? 'chambre' : 'logement'), '+ la table d’hôtes', '+ la galerie photos', '+ le livre d’or', '+ les bons cadeaux', '+ en anglais'].map(function (t) { return '<li><a class="plus" href="#venir">' + e(t) + '</a></li>'; }).join('') + '</ul>' +
    '<p class="note">Maquette privée préparée pour ' + e(nom) + ', ' + e(aVille) + '. Rien n’est en ligne, rien n’est figé : textes, photos et couleurs se modifient. En pointillés : ce qui reste à remplir avec vos mots.</p>' +
    '<p class="credits">Photos d’illustration, en attendant les vôtres : Pexels (' + e((M.credits || []).join(', ')) + '). Lieux autour : DATAtourisme, Licence Ouverte. Plan : © les contributeurs d’OpenStreetMap.</p>' +
    '<div class="pied-bas"><a class="kzp" href="https://kazura.fr" target="_blank" rel="noopener">' + SCEAU + '<span>Kazura<small>Site imaginé par Kazura, créateur de sites pour les indépendants</small></span></a><a class="bt" href="#reserver">Réserver</a></div></footer>';

  /* ================= les mouvements ================= */
  var lenis = null;
  if (!calme && window.Lenis) lenis = new window.Lenis({ duration: 1.15, smoothWheel: true, wheelMultiplier: 0.95, touchMultiplier: 1.15 });
  function enHaut() { if (lenis) lenis.scrollTo(0, { immediate: true }); else window.scrollTo(0, 0); }
  var bj = $('#bonjour');
  function ouvrir() {
    if (H.classList.contains('ouvert')) return;
    H.classList.add('ouvert');
    if (bj && H.classList.contains('bonjour-actif')) {
      bj.classList.add('leve');
      setTimeout(function () { bj.classList.add('fini'); if (lenis) lenis.start(); }, 1600);
    }
    observer();
  }
  if (H.classList.contains('bonjour-actif') && !calme) {
    if (lenis) lenis.stop();
    var pret = document.fonts ? document.fonts.ready : Promise.resolve(), t0 = performance.now();
    pret.then(function () { setTimeout(ouvrir, Math.max(0, 2500 - (performance.now() - t0))); });
    setTimeout(ouvrir, 3800);
    if (bj) bj.addEventListener('pointerdown', ouvrir);
  } else requestAnimationFrame(function () { requestAnimationFrame(ouvrir); });

  function mot(n) { var m = document.createElement('span'); m.className = 'm'; var s = document.createElement('span'); s.appendChild(n); m.appendChild(s); return m; }
  $$('.mots').forEach(function (el) {
    var parts = [];
    Array.prototype.slice.call(el.childNodes).forEach(function (n) {
      if (n.nodeType === 3) n.textContent.split(/(\s+)/).forEach(function (w) { parts.push(/^\s+$/.test(w) || !w ? document.createTextNode(w) : mot(document.createTextNode(w))); });
      else if (n.nodeType === 1) n.textContent.split(/(\s+)/).forEach(function (w) {
        if (/^\s+$/.test(w) || !w) { parts.push(document.createTextNode(w)); return; }
        var c = n.cloneNode(false); c.textContent = w; parts.push(mot(c));
      });
    });
    el.textContent = '';
    parts.forEach(function (p) { el.appendChild(p); });
    $$('.m > span', el).forEach(function (s, i) { s.style.transitionDelay = (i * 0.06) + 's'; });
  });
  var aVoir = [];
  function observer() {
    aVoir = $$('.page.active .monte:not(.vu), .page.active .cadre:not(.vu), .page.active .mots:not(.vu), .pied .monte:not(.vu)');
    if (calme) { aVoir.forEach(function (el) { el.classList.add('vu'); }); aVoir = []; }
  }
  function reveler(vh) {
    if (!aVoir.length || !H.classList.contains('ouvert')) return;
    var garde = [];
    for (var i = 0; i < aVoir.length; i++) { var r = aVoir[i].getBoundingClientRect(); if (r.top < vh * 0.92) aVoir[i].classList.add('vu'); else garde.push(aVoir[i]); }
    aVoir = garde;
  }
  var voile = $('#voile'), ids = pages.map(function (p) { return p[0]; });
  function montrer(id, anime) {
    if (ids.indexOf(id) < 0) id = 'accueil';
    var faire = function () {
      $$('.page').forEach(function (p) { p.classList.toggle('active', p.dataset.page === id); });
      $$('a[data-lien]').forEach(function (a) { if (a.dataset.lien === id) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
      document.title = (id === 'accueil' ? '' : (pages[ids.indexOf(id)][1] + ' · ')) + M.titre;
      enHaut(); if (lenis) lenis.resize(); observer(); tete();
    };
    if (!anime || calme || !voile) { faire(); return; }
    voile.className = 'voile monte';
    setTimeout(function () { faire(); voile.className = 'voile part'; setTimeout(function () { voile.className = 'voile'; }, 650); }, 560);
  }
  function lirePage() { return (location.hash || '#accueil').slice(1).split('?')[0] || 'accueil'; }
  window.addEventListener('hashchange', function () { var id = lirePage(); if (ids.indexOf(id) >= 0) { fermerMenu(); montrer(id, true); } });
  var menu = $('#menu'), bMenu = $('#bt-menu');
  function fermerMenu() { menu.classList.remove('ouvert'); menu.setAttribute('aria-hidden', 'true'); if (lenis && H.classList.contains('ouvert')) lenis.start(); }
  bMenu.addEventListener('click', function () { menu.classList.add('ouvert'); menu.setAttribute('aria-hidden', 'false'); if (lenis) lenis.stop(); });
  $('#fermer-menu').addEventListener('click', fermerMenu);
  var eTete = $('#tete');
  function tete() {
    var surPhoto = lirePage() === 'accueil' && H.classList.contains('disp-a');
    eTete.classList.toggle('sur-photo', surPhoto);
    eTete.classList.toggle('pleine', window.scrollY > 40 || !surPhoto);
  }
  montrer(lirePage(), false);

  /* le cadran : le soleil avance avec la visite, la nuit tombe en bas de page */
  var cadranEl = $('#cadran');
  function boucle(t) {
    if (lenis) lenis.raf(t);
    var vh = window.innerHeight;
    reveler(vh);
    if (!calme) $$('.page.active .cadre img').forEach(function (im) {
      var r = im.parentNode.getBoundingClientRect();
      if (r.bottom < -50 || r.top > vh + 50) return;
      var p = (r.top + r.height / 2 - vh / 2) / (vh + r.height);
      im.style.transform = 'translate3d(0,' + (p * -12).toFixed(2) + '%,0)';
    });
    var max = document.documentElement.scrollHeight - vh, k = max > 0 ? Math.min(1, window.scrollY / max) : 0;
    cadranEl.style.setProperty('--a', (-80 + k * 160).toFixed(1) + 'deg');
    cadranEl.classList.toggle('nuit', k > 0.86);
    tete();
    requestAnimationFrame(boucle);
  }
  requestAnimationFrame(boucle);

  /* les clés */
  $$('.cle').forEach(function (b) {
    b.addEventListener('click', function () {
      var i = b.dataset.cle;
      if (b.dataset.lienCle) { location.hash = '#chambres'; setTimeout(function () { choisir(i); }, 700); return; }
      choisir(i);
    });
  });
  function choisir(i) {
    $$('.page[data-page=chambres] .cle').forEach(function (c) { c.classList.toggle('on', c.dataset.cle === String(i)); });
    $$('.fiche-ch').forEach(function (f) { f.hidden = f.dataset.fiche !== String(i); });
    $$('.fiche-ch:not([hidden]) .cadre, .fiche-ch:not([hidden]) .mots').forEach(function (c) { c.classList.add('vu'); });
  }
  choisir(0);
  $$('[data-pour]').forEach(function (a) { a.addEventListener('click', function () { var s = $('#r-c'); if (s) { s.value = a.dataset.pour; ecrire(); } }); });

  /* le registre : les nuits se comptent, le message s'écrit */
  var nb = { ad: 2, en: 0 };
  $$('[data-pas]').forEach(function (g) {
    $$('button', g).forEach(function (b) {
      b.addEventListener('click', function () { var k = g.dataset.pas; nb[k] = Math.max(k === 'ad' ? 1 : 0, Math.min(12, nb[k] + (+b.dataset.d))); $('output', g).textContent = nb[k]; ecrire(); });
    });
  });
  var iA = $('#r-a'), iD = $('#r-d');
  function iso(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  var auj = new Date(); auj.setHours(12, 0, 0, 0);
  iA.min = iso(auj); iD.min = iso(new Date(auj.getTime() + 864e5));
  function jolie(s) { var d = new Date(s + 'T12:00:00'); return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }); }
  function ecrire() {
    var a = iA.value, d = iD.value, n = 0;
    if (a && d) n = Math.round((new Date(d + 'T12:00:00') - new Date(a + 'T12:00:00')) / 864e5);
    $('#r-n').textContent = n > 0 ? n + (n > 1 ? ' nuits' : ' nuit') : 'Vos dates';
    var t = 'Bonjour' + (qui ? ' ' + qui : '') + ', je voudrais réserver ' + (CH ? 'une chambre' : 'le logement') + (($('#r-c') || {}).value ? ' (' + $('#r-c').value + ')' : '');
    if (n > 0) t += ' du ' + jolie(a) + ' au ' + jolie(d) + ' (' + n + (n > 1 ? ' nuits' : ' nuit') + ')';
    t += ', pour ' + nb.ad + (nb.ad > 1 ? ' adultes' : ' adulte') + (nb.en ? ' et ' + nb.en + (nb.en > 1 ? ' enfants' : ' enfant') : '') + '.';
    var mm = ($('#r-m') || {}).value; if (mm && mm.trim()) t += ' ' + mm.trim();
    t += ' Est-ce possible ? Merci !';
    $('#msg').textContent = t;
    var s = $('#r-sms'), ml = $('#r-mail');
    if (s) s.href = 'sms:' + M.mobile + '?&body=' + encodeURIComponent(t);
    if (ml) ml.href = 'mailto:' + M.mail + '?subject=' + encodeURIComponent('Demande de réservation') + '&body=' + encodeURIComponent(t);
    peindre();
  }
  [iA, iD, $('#r-c'), $('#r-m')].forEach(function (x) { if (x) x.addEventListener('input', ecrire); });
  iA.addEventListener('change', function () { if (iA.value && (!iD.value || iD.value <= iA.value)) { var d = new Date(iA.value + 'T12:00:00'); d.setDate(d.getDate() + 2); iD.value = iso(d); } ecrire(); });
  var mois = new Date(auj.getFullYear(), auj.getMonth(), 1);
  function peindre() {
    var c = $('#cal'); if (!c) return;
    $('#cal-m').textContent = mois.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    var h = ['lu', 'ma', 'me', 'je', 've', 'sa', 'di'].map(function (j) { return '<b>' + j + '</b>'; }).join('');
    var dec = (mois.getDay() + 6) % 7, nbj = new Date(mois.getFullYear(), mois.getMonth() + 1, 0).getDate();
    for (var i = 0; i < dec; i++) h += '<span class="vide"></span>';
    for (var j = 1; j <= nbj; j++) {
      var s = iso(new Date(mois.getFullYear(), mois.getMonth(), j));
      var on = iA.value && iD.value && s >= iA.value && s < iD.value;
      h += '<span class="' + (on ? 'choisi' : '') + '">' + j + '</span>';
    }
    c.innerHTML = h;
  }
  $$('[data-cal]').forEach(function (b) { b.addEventListener('click', function () { mois = new Date(mois.getFullYear(), mois.getMonth() + (+b.dataset.cal), 1); peindre(); }); });
  ecrire();
})();
