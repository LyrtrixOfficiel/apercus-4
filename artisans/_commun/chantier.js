/* Famille « artisans RGE » (24/11/2026). Un seul script pour toutes les maquettes : il écrit la page à partir de
   window.ARTISAN (les données de l'entreprise, écrites par le générateur dans index.html), puis l'anime. Script classique
   (pas de module) pour que la page s'ouvre aussi depuis le disque. Le réglage « mouvements réduits » n'est jamais lu ;
   ?calme=1 coupe le mouvement automatique, ?sansbonjour saute le volet. Rien n'est inventé : les métiers et les
   qualifications viennent de la liste RGE de l'ADEME, l'entreprise du registre SIRENE ; le reste est en pointillés. */
(function () {
  'use strict';
  var H = document.documentElement, A = window.ARTISAN || {};
  var calme = H.classList.contains('calme');
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function e(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var EX = '<span class="ex" title="à remplir avec vos mots">&nbsp;</span>';
  var P = A.ph || {};
  function img(k, alt, taille, charge) {
    if (!k) return '';
    return '<img src="../_commun/photos/' + k + '.webp" srcset="../_commun/photos/' + k + '-720.webp 720w, ../_commun/photos/' + k + '.webp 1200w" sizes="' +
      (taille || '(max-width: 820px) 100vw, 50vw') + '" alt="' + e(alt || '') + '" loading="' + (charge || 'lazy') + '" decoding="async">';
  }
  function cadre(k, cls, alt) { return '<figure class="cadre ' + (cls || '') + '">' + img(k, alt) + '</figure>'; }
  var SCEAU = '<svg viewBox="0 0 100 100" aria-hidden="true"><g fill="currentColor" fill-rule="evenodd"><path d="M50 2a48 48 0 1 0 0 96 48 48 0 1 0 0-96zm0 6a42 42 0 1 1 0 84 42 42 0 1 1 0-84z"/>' +
    '<path d="M50 46C39.5 37 34.5 23.5 50 7c15.5 16.5 10.5 30 0 39zm0-7.4c6.2-6 8.6-14.4 0-23.6-8.6 9.2-6.2 17.6 0 23.6z"/>' +
    '<path d="M50 46C39.5 37 34.5 23.5 50 7c15.5 16.5 10.5 30 0 39zm0-7.4c6.2-6 8.6-14.4 0-23.6-8.6 9.2-6.2 17.6 0 23.6z" transform="rotate(120 50 50)"/>' +
    '<path d="M50 46C39.5 37 34.5 23.5 50 7c15.5 16.5 10.5 30 0 39zm0-7.4c6.2-6 8.6-14.4 0-23.6-8.6 9.2-6.2 17.6 0 23.6z" transform="rotate(240 50 50)"/><circle cx="50" cy="50" r="4.6"/></g></svg>';
  var NIVEAU = '<div class="niveau" aria-hidden="true"><span class="vis g"></span><div class="fiole"><span class="bulle"></span></div><span class="vis d"></span></div>';

  /* ---------------- les mots de l'entreprise ---------------- */
  var nom = A.nom, ville = A.ville, qui = A.prenom || '', elle = A.sexe === 'F';
  var travaux = A.travaux || [];
  var aVille = (/^(Le|Les) /.test(ville) ? (/^Les /.test(ville) ? 'aux ' + ville.slice(4) : 'au ' + ville.slice(3)) : 'à ' + ville);
  function deNom(n) { return /^Le /.test(n) ? 'du ' + n.slice(3) : /^Les /.test(n) ? 'des ' + n.slice(4) : (/^[AEIOUYÉÈÊHaeiouyéèêh]/.test(n) ? 'd’' + n : 'de ' + n); }
  var telLien = A.tel ? 'href="tel:+33' + A.tel.replace(/\D/g, '').slice(1) + '"' : 'href="#contact"';
  var telTxt = A.tel ? A.tel.replace(/\D/g, '').replace(/(\d\d)(?=\d)/g, '$1 ') : 'Votre numéro';
  var lg = nom.length, clsH1 = lg > 26 ? 'tres-long' : lg > 14 ? 'long' : '';
  function lettres(t) {
    var i = 0;
    return t.split(' ').map(function (mot) {
      var s = mot.split('').map(function (c, j) { return '<span class="l" style="transition-delay:' + (0.3 + (i + j) * 0.035).toFixed(2) + 's">' + e(c) + '</span>'; }).join('');
      i += mot.length;
      return '<span style="white-space:nowrap">' + s + '</span>';
    }).join(' ');
  }
  var metier = A.metier || 'Rénovation énergétique';
  var certs = A.certifs || [];
  var depuis = A.rgeDepuis || '';
  var fin = certs.reduce(function (m, c) { return c.jusqu > m ? c.jusqu : m; }, '');
  function date(s) { if (!s) return ''; var p = s.split('-'); return p.length === 3 ? (+p[2]) + ' ' + ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'][+p[1] - 1] + ' ' + p[0] : s; }
  function annee(s) { return (s || '').slice(0, 4); }
  var cert1 = certs[0] || {};
  var natures = travaux.map(function (t) { return t.lib; });

  /* ---------------- le panneau de chantier ---------------- */
  function panneau() {
    return '<div class="panneau monte"><div class="p-tete"><b>Panneau de chantier</b><span>' + e(A.cp) + ' ' + e(ville) + '</span></div><dl>' +
      '<dt>Entreprise</dt><dd><big>' + e(nom) + '</big>' + (A.forme ? e(A.forme) + (A.creation ? ', depuis ' + e(A.creation) : '') : '') + '</dd>' +
      (A.dirigeant ? '<dt>' + (A.ei ? (elle ? 'L’artisane' : 'L’artisan') : (A.sexeDir === 'F' ? 'Dirigeante' : 'Dirigeant')) + '</dt><dd>' + e(A.dirigeant) + '</dd>' : '') +
      '<dt>Nature des travaux</dt><dd>' + e(natures.slice(0, 5).join(', ')) + (natures.length > 5 ? '…' : '') + '</dd>' +
      '<dt>Lieu</dt><dd>' + e(ville) + (A.dans ? ', ' + e(A.dans) : '') + ' et alentours</dd>' +
      '<dt>Qualification</dt><dd>' + e(cert1.nom || 'RGE') + (depuis ? ', depuis ' + e(date(depuis)) : '') + '</dd>' +
      '<dt>Contact</dt><dd>' + (A.tel ? '<a ' + telLien + '>' + e(telTxt) + '</a>' : EX) + '</dd></dl>' +
      '<div class="p-bas"><span class="rge"><i>RGE</i> Reconnu garant de l’environnement</span><span>Devis sur demande</span></div></div>';
  }

  /* ---------------- accueil ---------------- */
  var tampon = '<div class="tampon" aria-hidden="true"><span>Qualifié<b>RGE</b>' + (depuis ? 'depuis ' + annee(depuis) : 'ADEME') + '</span></div>';
  var disp = H.className.match(/disp-(\w)/); disp = disp ? disp[1] : 'a';
  var hTxt = '<div class="h-txt"><p class="lieu"><b>RGE</b><span>' + e(metier) + '</span><span>' + e(ville) + '</span></p><h1 class="' + clsH1 + '" aria-label="' + e(nom) + '">' + lettres(nom) + '</h1>' +
    '<p class="sous">' + e(metier) + ' ' + e(aVille) + (A.dans ? ', ' + e(A.dans) : '') + '. ' + (qui && A.ei ? e(qui) + (elle ? ', artisane qualifiée RGE : ' : ', artisan qualifié RGE : ') : 'Entreprise qualifiée RGE : ') +
    '<strong>vos travaux peuvent ouvrir droit aux aides de l’État.</strong></p>' +
    (disp === 'c' ? panneau() : '') +
    '<div class="actions"><a class="bt plein" href="#devis">Demander un devis <span class="fl">→</span></a><a class="bt" ' + telLien + '>' + e(telTxt) + '</a></div></div>';
  var heros = '<section class="heros" aria-label="' + e(nom) + '">' + hTxt +
    '<figure class="h-photo">' + img(P.heros, metier, disp === 'b' ? '(max-width: 900px) 100vw, 50vw' : '100vw', 'eager') +
    (disp === 'b' ? '<span class="cote h">' + e(ville) + '</span><span class="cote v">' + e(metier) + '</span>' : '') + (disp === 'b' ? tampon : '') + '</figure>' + (disp !== 'b' ? tampon : '') + '</section>';
  var ruban = ['RGE', metier].concat(natures.slice(0, 4), [ville, 'Devis sur demande']).filter(Boolean);
  var cartes = travaux.map(function (t, i) {
    return '<a class="metier monte" href="#travaux" data-vers="t' + i + '"><span class="num">' + ('0' + (i + 1)).slice(-2) + '</span>' + cadre(t.ph, '', t.lib) +
      '<div><h3>' + e(t.lib) + '</h3><p>' + e(t.court) + '</p></div></a>';
  }).join('');
  var etapes = [['01', 'On se parle', 'Vous décrivez le projet par téléphone ou avec le formulaire de devis. ' + (qui && A.ei ? qui + ' vous' : 'On vous') + ' rappelle.'],
    ['02', 'La visite', 'Sur place ' + (A.dans ? A.dans : 'chez vous') + ' : les mesures, l’état de l’existant, vos envies. Délai pour passer : ' + EX],
    ['03', 'Le devis', 'Détaillé, poste par poste, avec les aides possibles quand les travaux y ouvrent droit.'],
    ['04', 'Le chantier', 'Propre, dans les temps annoncés, et la réception des travaux ensemble à la fin.']];
  var regle = '<div class="regle">' + etapes.map(function (s) { return '<div class="pas monte" data-n="' + s[0] + '"><h3>' + e(s[1]) + '</h3><p>' + (s[2].indexOf('<span') >= 0 ? s[2] : e(s[2])) + '</p></div>'; }).join('') + '</div>';
  var communes = (A.communes || []).slice(0, 10);
  var accueil = heros +
    '<div class="defile" aria-hidden="true"><div class="piste">' + ruban.concat(ruban).map(function (s) { return '<span>' + e(s) + '</span>'; }).join('') + '</div></div>' +
    (disp !== 'c' ? '<section class="bloc grille papier"><div class="large deux-col"><div><p class="kicker">Le panneau</p><h2 class="mots">Qui fait <em>quoi, où.</em></h2>' +
      '<p class="chapo monte">Comme devant chaque chantier : l’entreprise, la nature des travaux, le lieu et la qualification. Tout est vrai : registre des entreprises et liste officielle RGE.</p></div>' + panneau() + '</div></section>' : '') +
    '<section class="bloc"><div class="large"><p class="kicker">Les travaux</p><h2 class="mots">' + (travaux.length > 1 ? travaux.length + ' métiers, <em>une seule équipe.</em>' : 'Un métier, <em>bien fait.</em>') + '</h2>' +
    '<p class="chapo monte">Les travaux pour lesquels ' + e(nom) + ' est qualifiée RGE, d’après la liste officielle de l’ADEME. Chacun a sa page.</p><div class="metiers">' + cartes + '</div></div></section>' +
    '<section class="bloc profond grille"><div class="large rge-g"><div><p class="kicker">Le label RGE</p><h2 class="mots">Bien posé, <em>et de niveau.</em></h2>' +
    '<p class="chapo monte">RGE veut dire « Reconnu garant de l’environnement ». Pour la plupart des aides à la rénovation énergétique, les travaux doivent être faits par une entreprise RGE.</p>' + NIVEAU + '</div>' +
    '<div class="aides"><div class="monte"><i>1</i><span><b>MaPrimeRénov’</b><small>L’aide de l’État pour isoler, changer de chauffage, rénover.</small></span></div>' +
    '<div class="monte"><i>2</i><span><b>Primes CEE</b><small>Les primes des fournisseurs d’énergie, les « certificats d’économies d’énergie ».</small></span></div>' +
    '<div class="monte"><i>3</i><span><b>Éco-prêt à taux zéro</b><small>Un prêt sans intérêts pour financer les travaux.</small></span></div>' +
    '<div class="monte"><i>✓</i><span><b>' + e(cert1.nom || 'Qualification RGE') + '</b><small>' + (depuis ? 'Depuis le ' + e(date(depuis)) : '') + (fin ? ', valable jusqu’au ' + e(date(fin)) : '') + '. Selon votre situation, à vérifier sur France Rénov’.</small></span></div></div></div></section>' +
    '<section class="bloc doux"><div class="large"><p class="kicker">Comment ça se passe</p><h2 class="mots">Du premier appel <em>à la réception.</em></h2>' + regle + '</div></section>' +
    '<section class="bloc"><div class="large"><p class="kicker">Avant, après</p><h2 class="mots">Vos chantiers, <em>en photos.</em></h2>' +
    '<p class="chapo monte">Ici, vos photos d’avant et d’après, chantier par chantier. Il suffit de nous les envoyer.</p>' + avantApres('a0') +
    '<div class="actions"><a class="bt" href="#realisations">Toutes les réalisations <span class="fl">→</span></a></div></div></section>' +
    '<section class="bloc profond"><div class="large zone-g"><div><p class="kicker">Zone d’intervention</p><h2 class="mots">' + e(ville) + ', <em>et autour.</em></h2>' +
    '<p class="chapo monte">Basée ' + e(aVille) + '. Jusqu’où vous déplacez-vous ? ' + EX + ' km. Les communes voisines, à vol d’oiseau :</p>' +
    '<ul class="communes monte">' + communes.slice(0, 8).map(function (c) { return '<li>' + e(c[0]) + '<small>' + c[1] + ' km</small></li>'; }).join('') + '</ul></div>' + radar() + '</div></section>' +
    '<section class="bloc"><div class="large"><p class="kicker">Avis clients</p><h2 class="mots">Ce qu’ils <em>en disent.</em></h2><p class="chapo monte">Vos avis s’afficheront ici, avec leur note. Aucun avis n’est inventé.</p>' +
    '<div class="avis-vide">' + [0, 1, 2].map(function () { return '<div class="monte"><span class="etoiles">★★★★★</span><b>« ' + EX + ' »</b>Prénom, ' + EX + '</div>'; }).join('') + '</div></div></section>' +
    '<section class="bloc marque grille"><div class="large deux-col"><div><p class="kicker">Un projet ?</p><h2 class="mots">Parlons de <em>votre chantier.</em></h2>' +
    '<p class="chapo monte">Décrivez vos travaux en une minute : le message part depuis votre téléphone, ' + (A.mobile ? 'par SMS ou par mail' : 'par mail') + '.</p>' +
    '<div class="actions"><a class="bt plein" href="#devis">Demander un devis <span class="fl">→</span></a><a class="bt" ' + telLien + '>Appeler</a></div></div>' + cadre(P.devis, '', 'Un chantier') + '</div></section>';

  function avantApres(id) {
    return '<div class="aa monte" id="' + id + '"><div class="vue avant"><div><b>Avant</b><span>Votre photo du chantier avant travaux</span></div></div>' +
      '<div class="vue apres"><div><b>Après</b><span>La même vue, une fois le chantier fini</span></div></div></div>' +
      '<div class="aa-bt" data-aa="' + id + '"><button type="button" class="on" data-v="avant"><span>Avant</span></button><button type="button" data-v="apres"><span>Après</span></button></div>';
  }
  function radar() {
    var max = communes.reduce(function (m, c) { return Math.max(m, c[1]); }, 10);
    var R = Math.ceil(max / 5) * 5;
    var an = [R / 2, R].map(function (r) { var p = (r / R) * 92; return '<span class="anneau" style="left:' + (50 - p / 2) + '%;top:' + (50 - p / 2) + '%;width:' + p + '%;height:' + p + '%"><small>' + String(r).replace('.', ',') + ' km</small></span>'; }).join('');
    var fc = 0.62 * 560 / Math.max(240, Math.min(560, window.innerWidth - 36)), places = [[50, 50, ville.length * 1.5]];
    var pts = communes.slice(0, 10).map(function (c) {
      var x = 50 + (c[2] / R) * 46, y = 50 - (c[3] / R) * 46;
      // pas deux noms l'un sur l'autre : on saute une commune trop proche d'une autre deja placee
      if (places.some(function (p) { return Math.abs(p[1] - y) < 7 && Math.abs(p[0] - x) < (p[2] + c[0].length) * fc + 2; })) return '';
      if (places.length > 7 || x - c[0].length * fc < 1 || x + c[0].length * fc > 99 || y < 4 || y > 96) return '';
      places.push([x, y, c[0].length]);
      return '<span class="point" style="left:' + x.toFixed(1) + '%;top:' + y.toFixed(1) + '%">' + e(c[0]) + '</span>';
    }).join('');
    return '<div class="radar" aria-hidden="true">' + an + '<span class="balai"></span>' + pts + '<span class="point base" style="left:50%;top:50%">' + e(ville) + '</span></div>';
  }

  /* ---------------- les travaux ---------------- */
  var details = travaux.map(function (t, i) {
    return '<div class="detail" id="t' + i + '">' + cadre(t.ph2 || t.ph, '', t.lib) + '<div><p class="kicker">' + ('0' + (i + 1)).slice(-2) + ' · ' + e(t.famille) + '</p><h3 class="mots">' + e(t.lib) + '</h3>' +
      '<p class="chapo monte">' + e(t.long) + '</p>' + (t.qualifs && t.qualifs.length ? '<div class="qualifs monte">' + t.qualifs.map(function (q) { return '<span>' + e(q) + '</span>'; }).join('') + '</div>' : '') +
      '<ul class="liste monte"><li>Ce que vous posez<small>' + EX + '</small></li><li>Les marques<small>' + EX + '</small></li><li>Délai moyen<small>' + EX + '</small></li></ul>' +
      '<div class="actions"><a class="bt plein" href="#devis" data-pour="' + e(t.lib) + '">Un devis pour ça <span class="fl">→</span></a></div></div></div>';
  }).join('');
  var pTravaux = '<section class="p-heros papier grille"><div><p class="num">Les travaux</p><h1 class="mots">Ce que <em>nous faisons.</em></h1>' +
    '<p class="chapo monte">' + e(natures.join(', ')) + '. Les qualifications RGE de chaque métier sont indiquées, telles qu’elles figurent sur la liste officielle.</p></div>' + cadre(P.travaux) + '</section>' +
    '<section class="bloc" style="padding-top:20px"><div class="large">' + details + '</div></section>' +
    '<section class="bloc doux"><div class="large"><p class="kicker">Et aussi</p><h2 class="mots">Les autres <em>travaux.</em></h2><p class="chapo monte">Ce que vous faites en plus, hors RGE : ' + EX + '</p></div></section>';

  /* ---------------- réalisations ---------------- */
  var pReal = '<section class="p-heros"><div><p class="num">Réalisations</p><h1 class="mots">Avant, <em>après.</em></h1><p class="chapo monte">Chaque chantier avec ses photos, la commune et ce qui a été fait. Vos clients voient le résultat avant de vous appeler.</p></div>' + cadre(P.realis) + '</section>' +
    '<section class="bloc doux"><div class="large">' + avantApres('a1') + '<div class="chantiers">' + [0, 1, 2].map(function (i) {
      var t = travaux[i % Math.max(1, travaux.length)] || {};
      return '<div class="chantier-v monte"><small>Chantier ' + (i + 1) + '</small><b>' + e(t.lib || 'Votre chantier') + '</b><span>À ' + EX + ', en ' + EX + '</span></div>';
    }).join('') + '</div><p class="legende">En pointillés : vos chantiers, vos photos. Rien n’est inventé.</p></div></section>';

  /* ---------------- aides et RGE ---------------- */
  var pAides = '<section class="p-heros profond grille"><div><p class="num" style="color:var(--accent)">Le label RGE</p><h1 class="mots">Les aides, <em>avec un pro qualifié.</em></h1>' +
    '<p class="chapo monte">Pour toucher la plupart des aides à la rénovation énergétique, le client doit passer par une entreprise RGE. ' + e(nom) + ' l’est' + (depuis ? ' depuis le ' + e(date(depuis)) : '') + '.</p>' + NIVEAU + '</div>' + cadre(P.aides) + '</section>' +
    '<section class="bloc"><div class="large rge-g"><div><p class="kicker">Les qualifications</p><h2 class="mots">Sur la liste <em>officielle.</em></h2>' +
    '<p class="chapo monte">Telles qu’elles figurent sur la liste des entreprises RGE publiée par l’ADEME (France Rénov’).</p></div><div class="certifs">' +
    certs.map(function (c) {
      return '<div class="certif monte"><b>' + e(c.nom) + '</b><span>En cours</span><small>' + e(c.qualifs.join(' · ')) + '<br>' + (c.depuis ? 'Depuis le ' + e(date(c.depuis)) : '') + (c.jusqu ? ', jusqu’au ' + e(date(c.jusqu)) : '') + '</small></div>';
    }).join('') + '</div></div></section>' +
    '<section class="bloc doux"><div class="large"><p class="kicker">Les aides possibles</p><h2 class="mots">Ce qui peut <em>alléger la facture.</em></h2><div class="aides" style="max-width:860px">' +
    '<div class="monte"><i>1</i><span><b>MaPrimeRénov’</b><small>Selon les revenus du foyer et les travaux. Demande à faire avant de signer le devis.</small></span></div>' +
    '<div class="monte"><i>2</i><span><b>Primes CEE</b><small>Versées par les fournisseurs d’énergie, cumulables dans bien des cas.</small></span></div>' +
    '<div class="monte"><i>3</i><span><b>Éco-prêt à taux zéro</b><small>Jusqu’à plusieurs dizaines de milliers d’euros, sans intérêts, selon les travaux.</small></span></div>' +
    '<div class="monte"><i>4</i><span><b>TVA réduite</b><small>Sur les travaux d’amélioration énergétique des logements de plus de deux ans.</small></span></div></div>' +
    '<p class="legende">Les montants et conditions changent chaque année : France Rénov’ (france-renov.gouv.fr) fait foi. Votre accompagnement sur les aides : ' + EX + '</p></div></section>';

  /* ---------------- devis : le bon de travaux ---------------- */
  var choixT = natures.concat(['Autre']);
  function puces(nomC, liste, multi) { return '<div class="puces" data-champ="' + nomC + '"' + (multi ? ' data-multi="1"' : '') + '>' + liste.map(function (x) { return '<button type="button" aria-pressed="false">' + e(x) + '</button>'; }).join('') + '</div>'; }
  var pDevis = '<section class="p-heros papier grille"><div><p class="num">Devis</p><h1 class="mots">Votre chantier <em>en une minute.</em></h1>' +
    '<p class="chapo monte">Cochez, écrivez deux mots : le bon de travaux se remplit tout seul, et part depuis votre téléphone. Rien n’est envoyé sans vous.</p></div>' + cadre(P.devis2 || P.devis) + '</section>' +
    '<section class="bloc doux" id="bon"><div class="large devis-g"><form class="bon" onsubmit="return false">' +
    '<fieldset><legend>Les travaux</legend>' + puces('travaux', choixT, true) + '</fieldset>' +
    '<fieldset><legend>Le logement</legend>' + puces('logement', ['Maison', 'Appartement', 'Local professionnel']) + '</fieldset>' +
    '<fieldset><legend>Construit</legend>' + puces('age', ['Avant 1975', '1975 à 2000', 'Après 2000', 'Je ne sais pas']) + '</fieldset>' +
    '<fieldset><legend>Quand</legend>' + puces('quand', ['Dès que possible', 'Dans les 3 mois', 'Dans l’année']) + '</fieldset>' +
    '<div class="ligne2"><div><label class="t" for="d-s">Surface (m²)</label><input id="d-s" type="number" min="1" inputmode="numeric" placeholder="90"></div>' +
    '<div><label class="t" for="d-c">Votre commune</label><input id="d-c" type="text" placeholder="' + e(ville) + '"></div></div>' +
    '<fieldset style="margin-top:20px"><label class="case"><input type="checkbox" id="d-a"> Je veux savoir à quelles aides j’ai droit</label></fieldset>' +
    '<div class="ligne2"><div><label class="t" for="d-n">Votre nom</label><input id="d-n" type="text" placeholder="Nom"></div><div><label class="t" for="d-t">Votre téléphone</label><input id="d-t" type="text" inputmode="tel" placeholder="06 ..."></div></div>' +
    '<label class="t" for="d-m" style="margin-top:20px">Un mot sur le projet</label><textarea id="d-m" maxlength="400" placeholder="Combles à isoler, la maison est froide l’hiver..."></textarea></form>' +
    '<div class="fiche" id="fiche"><p class="n"><span>Bon de travaux</span><span>N° ' + ('000' + (1 + (nom.length * 37) % 900)).slice(-4) + '</span></p><span class="tamp">Prêt à partir</span><h3>' + e(nom) + '</h3>' +
    '<dl><dt>Travaux</dt><dd id="f-t">...</dd><dt>Logement</dt><dd id="f-l">...</dd><dt>Surface</dt><dd id="f-s">...</dd><dt>Commune</dt><dd id="f-c">...</dd><dt>Quand</dt><dd id="f-q">...</dd></dl>' +
    '<p class="msg" id="msg"></p><div class="actions" style="margin-top:18px">' + (A.mobile ? '<a class="bt plein" id="d-sms" href="sms:' + A.mobile + '">Envoyer par SMS</a>' : '') +
    (A.mail ? '<a class="bt' + (A.mobile ? '' : ' plein') + '" id="d-mail" href="mailto:' + e(A.mail) + '">Envoyer par mail</a>' : '') + '<a class="bt" ' + telLien + '>Appeler</a></div></div></div></section>';

  /* ---------------- contact ---------------- */
  var plan = (A.lat && A.lon) ? '<iframe class="carte-plan" loading="lazy" title="Plan" src="https://www.openstreetmap.org/export/embed.html?bbox=' + (A.lon - .06).toFixed(4) + '%2C' + (A.lat - .035).toFixed(4) + '%2C' + (A.lon + .06).toFixed(4) + '%2C' + (A.lat + .035).toFixed(4) + '&amp;layer=mapnik&amp;marker=' + A.lat + '%2C' + A.lon + '"></iframe>' : '<div class="carte-plan" style="display:grid;place-items:center">Le plan, ici.</div>';
  var pContact = '<section class="p-heros"><div><p class="num">Contact</p><h1 class="mots">' + (qui && A.ei ? 'Appelez <em>' + e(qui) + '.</em>' : 'On vous <em>rappelle.</em>') + '</h1>' +
    '<p class="chapo monte">' + e(metier) + ' ' + e(aVille) + (A.dans ? ', ' + e(A.dans) : '') + '. Un appel, un SMS ou le formulaire de devis.</p>' +
    '<div class="actions"><a class="bt plein" ' + telLien + '>' + e(telTxt) + '</a><a class="bt" href="#devis">Demander un devis</a></div></div>' + cadre(P.contact) + '</section>' +
    '<section class="bloc doux"><div class="large deux-col"><div><p class="kicker">Les coordonnées</p><h2 class="mots">Où nous <em>trouver.</em></h2><ul class="liste">' +
    '<li>Téléphone<small>' + (A.tel ? '<a ' + telLien + '>' + e(telTxt) + '</a>' : EX) + '</small></li>' +
    '<li>Adresse mail<small>' + (A.mail ? '<a href="mailto:' + e(A.mail) + '">' + e(A.mail) + '</a>' : EX) + '</small></li>' +
    '<li>Adresse<small>' + (A.adr ? e(A.adr) + ', ' : '') + e(A.cp) + ' ' + e(ville) + '</small></li>' +
    '<li>Horaires<small>' + EX + '</small></li><li>Zone<small>' + e(ville) + ' et ' + EX + ' km autour</small></li>' +
    (A.siret ? '<li>SIRET<small>' + e(A.siret.replace(/(\d{3})(\d{3})(\d{3})(\d{5})/, '$1 $2 $3 $4')) + '</small></li>' : '') + '</ul></div><div>' + plan + '<p class="legende">Plan : © les contributeurs d’OpenStreetMap.</p></div></div></section>';

  /* ---------------- la page ---------------- */
  var pages = [['accueil', 'Accueil', accueil], ['travaux', 'Les travaux', pTravaux], ['realisations', 'Réalisations', pReal], ['aides', 'RGE et aides', pAides], ['devis', 'Devis', pDevis], ['contact', 'Contact', pContact]];
  var nav = pages.map(function (p) { return '<a href="#' + p[0] + '" data-lien="' + p[0] + '">' + e(p[1]) + '</a>'; }).join('');
  var bonjour = '<div class="bonjour" id="bonjour" aria-hidden="true"><div class="lames"></div><div class="caisson"></div><div class="mot"><p><span class="b0">' + e(metier) + ' · RGE</span>' +
    '<span class="b1">Bonjour' + (qui ? ' ' + e(qui) : '') + ',</span><span class="b2">voici le site ' + (function () { var dn = deNom(nom), pre = (dn.match(/^(du |des |de |d’)/) || [''])[0]; return e(pre) + '<b>' + e(dn.slice(pre.length)) + '</b>'; })() + ', ' + e(aVille) + '.</span>' + NIVEAU + '</p></div></div>';
  document.body.innerHTML = '<a class="evitement" href="#contenu">Aller au contenu</a>' + bonjour +
    '<div class="metre" aria-hidden="true"><div class="ruban" id="ruban"></div><div class="boitier" id="boitier">0 cm</div></div>' +
    '<header class="tete" id="tete"><a class="nom-tete" href="#accueil">' + e(nom) + '<small>' + e(metier) + ' · ' + e(ville) + '</small></a><nav class="nav" aria-label="Pages">' + nav + '</nav>' +
    '<div class="tete-d"><a class="kz" href="https://kazura.fr" target="_blank" rel="noopener" aria-label="Kazura, créateur de sites">' + SCEAU + '<span>Kazura</span></a>' +
    '<a class="bt-app" href="#devis">Devis</a><button class="bt-menu" id="bt-menu" type="button" aria-controls="menu">Menu</button></div></header>' +
    '<nav class="menu" id="menu" aria-hidden="true" aria-label="Menu"><button class="fermer" id="fermer-menu" type="button">Fermer</button>' + nav +
    '<div class="menu-bas"><a class="bt plein" ' + telLien + '>' + e(telTxt) + '</a><a class="kz" href="https://kazura.fr" target="_blank" rel="noopener">' + SCEAU + '<span>Kazura</span></a></div></nav>' +
    '<div class="voile" id="voile" aria-hidden="true"></div>' +
    '<main id="contenu">' + pages.map(function (p) { return '<div class="page' + (p[0] === 'accueil' ? ' active' : '') + '" data-page="' + p[0] + '">' + p[2] + '</div>'; }).join('') + '</main>' +
    '<div class="bandes" aria-hidden="true"></div>' +
    '<footer class="pied"><p class="grand">Votre site peut avoir <em>autant de pages</em> que vous voulez.</p><ul class="pages-liste">' +
    pages.map(function (p) { return '<li><a href="#' + p[0] + '">' + e(p[1]) + '</a></li>'; }).join('') +
    ['+ une page par métier', '+ une page par commune', '+ vos chantiers en photos', '+ vos avis Google', '+ les questions fréquentes', '+ les marques que vous posez'].map(function (t) { return '<li><a class="plus" href="#contact">' + e(t) + '</a></li>'; }).join('') + '</ul>' +
    '<p class="note">Maquette privée préparée pour ' + e(nom) + ', ' + e(aVille) + '. Rien n’est en ligne, rien n’est figé : textes, photos et couleurs se modifient. En pointillés : ce qui reste à remplir avec vos mots.</p>' +
    '<p class="credits">Photos d’illustration, en attendant les vôtres : Pexels (' + e((A.credits || []).join(', ')) + '). Qualifications : liste des entreprises RGE, ADEME, Licence Ouverte. Entreprise : registre SIRENE (INSEE). Communes : geo.api.gouv.fr. Plan : © les contributeurs d’OpenStreetMap.</p>' +
    '<div class="pied-bas"><a class="kzp" href="https://kazura.fr" target="_blank" rel="noopener">' + SCEAU + '<span>Kazura<small>Site imaginé par Kazura, créateur de sites pour les artisans et les indépendants</small></span></a><a class="bt plein" href="#devis">Demander un devis</a></div></footer>';

  /* ================= les mouvements ================= */
  var lenis = null;
  if (!calme && window.Lenis) lenis = new window.Lenis({ duration: 1.1, smoothWheel: true, wheelMultiplier: 0.95, touchMultiplier: 1.15 });
  function enHaut() { if (lenis) lenis.scrollTo(0, { immediate: true }); else window.scrollTo(0, 0); }
  var bj = $('#bonjour');
  function ouvrir() {
    if (H.classList.contains('ouvert')) return;
    H.classList.add('ouvert');
    if (bj && H.classList.contains('bonjour-actif')) {
      bj.classList.add('leve');
      setTimeout(function () { bj.classList.add('fini'); if (lenis) lenis.start(); }, 1450);
    }
    observer();
  }
  if (H.classList.contains('bonjour-actif') && !calme) {
    if (lenis) lenis.stop();
    var pret = document.fonts ? document.fonts.ready : Promise.resolve(), t0 = performance.now();
    pret.then(function () { setTimeout(ouvrir, Math.max(0, 3000 - (performance.now() - t0))); });
    setTimeout(ouvrir, 4300);
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
    aVoir = $$('.page.active .monte:not(.vu), .page.active .cadre:not(.vu), .page.active .mots:not(.vu), .page.active .niveau:not(.cale), .page.active .radar:not(.vu), .pied .monte:not(.vu)');
    if (calme) { aVoir.forEach(function (el) { el.classList.add(el.classList.contains('niveau') ? 'cale' : 'vu'); }); aVoir = []; }
  }
  function reveler(vh) {
    if (!aVoir.length || !H.classList.contains('ouvert')) return;
    var garde = [];
    for (var i = 0; i < aVoir.length; i++) {
      var r = aVoir[i].getBoundingClientRect();
      if (r.top < vh * 0.9 && r.bottom > -40) aVoir[i].classList.add(aVoir[i].classList.contains('niveau') ? 'cale' : 'vu'); else garde.push(aVoir[i]);
    }
    aVoir = garde;
  }
  var voile = $('#voile'), ids = pages.map(function (p) { return p[0]; });
  function montrer(id, anime, ancre) {
    if (ids.indexOf(id) < 0) id = 'accueil';
    var faire = function () {
      $$('.page').forEach(function (p) { p.classList.toggle('active', p.dataset.page === id); });
      $$('a[data-lien]').forEach(function (a) { if (a.dataset.lien === id) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
      document.title = (id === 'accueil' ? '' : (pages[ids.indexOf(id)][1] + ' · ')) + A.titre;
      enHaut(); if (lenis) lenis.resize(); observer(); tete();
      if (ancre) setTimeout(function () { var el = document.getElementById(ancre); if (el) { var y = el.getBoundingClientRect().top + window.scrollY - 90; if (lenis) lenis.scrollTo(y); else window.scrollTo(0, y); } }, 120);
    };
    if (!anime || calme || !voile) { faire(); return; }
    voile.className = 'voile monte';
    setTimeout(function () { faire(); voile.className = 'voile part'; setTimeout(function () { voile.className = 'voile'; }, 650); }, 560);
  }
  function lirePage() { return (location.hash || '#accueil').slice(1).split('?')[0] || 'accueil'; }
  var ancreVoulue = null;
  window.addEventListener('hashchange', function () { var id = lirePage(); if (ids.indexOf(id) >= 0) { fermerMenu(); montrer(id, true, ancreVoulue); ancreVoulue = null; } });
  $$('[data-vers]').forEach(function (a) { a.addEventListener('click', function () { ancreVoulue = a.dataset.vers; }); });
  var menu = $('#menu'), bMenu = $('#bt-menu');
  function fermerMenu() { menu.classList.remove('ouvert'); menu.setAttribute('aria-hidden', 'true'); if (lenis && H.classList.contains('ouvert')) lenis.start(); }
  bMenu.addEventListener('click', function () { menu.classList.add('ouvert'); menu.setAttribute('aria-hidden', 'false'); if (lenis) lenis.stop(); });
  $('#fermer-menu').addEventListener('click', fermerMenu);
  var eTete = $('#tete');
  function tete() {
    var surPhoto = lirePage() === 'accueil' && (H.classList.contains('disp-a') || H.classList.contains('disp-c'));
    eTete.classList.toggle('sur-photo', surPhoto);
    eTete.classList.toggle('pleine', window.scrollY > 40 || !surPhoto);
  }
  montrer(lirePage(), false);

  /* le mètre ruban : il se déroule avec la visite */
  var ruban = $('#ruban'), boitier = $('#boitier');
  function boucle(t) {
    if (lenis) lenis.raf(t);
    var vh = window.innerHeight;
    reveler(vh);
    if (!calme) $$('.page.active .cadre img').forEach(function (im) {
      var r = im.parentNode.getBoundingClientRect();
      if (r.bottom < -50 || r.top > vh + 50) return;
      var p = (r.top + r.height / 2 - vh / 2) / (vh + r.height);
      im.style.transform = 'translate3d(0,' + (p * -8).toFixed(2) + '%,0) scale(1.06)';
    });
    var max = document.documentElement.scrollHeight - vh, k = max > 0 ? Math.min(1, window.scrollY / max) : 0;
    if (window.innerWidth > 900) { var h = Math.round(k * (vh - 150)); ruban.style.height = h + 'px'; boitier.style.top = (h + 76) + 'px'; boitier.textContent = Math.round(window.scrollY / 10) + ' cm'; }
    else { ruban.style.width = (k * 100).toFixed(1) + '%'; }
    tete();
    requestAnimationFrame(boucle);
  }
  requestAnimationFrame(boucle);

  /* avant / après */
  $$('.aa-bt').forEach(function (g) {
    $$('button', g).forEach(function (b) {
      b.addEventListener('click', function () {
        $$('button', g).forEach(function (x) { x.classList.toggle('on', x === b); });
        var cible = document.getElementById(g.dataset.aa); if (cible) cible.classList.toggle('montre-apres', b.dataset.v === 'apres');
      });
    });
  });
  if (!calme) setTimeout(function () { var b = $('.aa-bt[data-aa=a0] button[data-v=apres]'); if (b) { var aa = $('#a0'); var vu = false; var tick = setInterval(function () { if (aa && aa.classList.contains('vu')) { clearInterval(tick); setTimeout(function () { b.click(); }, 900); } }, 300); } }, 500);

  /* le bon de travaux */
  var choix = { travaux: [], logement: '', age: '', quand: '' };
  $$('.puces').forEach(function (g) {
    var k = g.dataset.champ, multi = !!g.dataset.multi;
    $$('button', g).forEach(function (b) {
      b.addEventListener('click', function () {
        var v = b.textContent, on = b.getAttribute('aria-pressed') === 'true';
        if (multi) { b.setAttribute('aria-pressed', on ? 'false' : 'true'); choix[k] = $$('button[aria-pressed=true]', g).map(function (x) { return x.textContent; }); }
        else { $$('button', g).forEach(function (x) { x.setAttribute('aria-pressed', x === b && !on ? 'true' : 'false'); }); choix[k] = on ? '' : v; }
        ecrire();
      });
    });
  });
  $$('[data-pour]').forEach(function (a) {
    a.addEventListener('click', function () {
      $$('.puces[data-champ=travaux] button').forEach(function (b) { if (b.textContent === a.dataset.pour) b.setAttribute('aria-pressed', 'true'); });
      choix.travaux = $$('.puces[data-champ=travaux] button[aria-pressed=true]').map(function (x) { return x.textContent; }); ecrire();
    });
  });
  function val(id) { var x = document.getElementById(id); return x ? x.value.trim() : ''; }
  function ecrire() {
    var tr = choix.travaux.join(', '), s = val('d-s'), c = val('d-c'), n = val('d-n'), tl = val('d-t'), m = val('d-m'), aides = ($('#d-a') || {}).checked;
    $('#f-t').textContent = tr || '...'; $('#f-l').textContent = [choix.logement, choix.age && choix.age !== 'Je ne sais pas' ? 'construit ' + choix.age.toLowerCase() : ''].filter(Boolean).join(', ') || '...';
    $('#f-s').textContent = s ? s + ' m²' : '...'; $('#f-c').textContent = c || '...'; $('#f-q').textContent = choix.quand || '...';
    var t = 'Bonjour' + (qui ? ' ' + qui : '') + ', je souhaite un devis' + (tr ? ' pour : ' + tr.toLowerCase() : '') + '.';
    if (choix.logement) t += ' ' + choix.logement + (choix.age && choix.age !== 'Je ne sais pas' ? ' construit' + (choix.logement === 'Maison' ? 'e' : '') + ' ' + choix.age.toLowerCase() : '') + (s ? ', ' + s + ' m²' : '') + '.';
    else if (s) t += ' Surface : ' + s + ' m².';
    if (c) t += ' À ' + c + '.';
    if (choix.quand) t += ' ' + choix.quand + '.';
    if (aides) t += ' J’aimerais savoir à quelles aides j’ai droit.';
    if (m) t += ' ' + m;
    if (n || tl) t += ' ' + [n, tl].filter(Boolean).join(', ') + '.';
    $('#msg').textContent = t;
    $('#fiche').classList.toggle('prete', !!(tr && (c || s || choix.logement)));
    var sm = $('#d-sms'), ml = $('#d-mail');
    if (sm) sm.href = 'sms:' + A.mobile + '?&body=' + encodeURIComponent(t);
    if (ml) ml.href = 'mailto:' + A.mail + '?subject=' + encodeURIComponent('Demande de devis') + '&body=' + encodeURIComponent(t);
  }
  ['d-s', 'd-c', 'd-n', 'd-t', 'd-m', 'd-a'].forEach(function (id) { var x = document.getElementById(id); if (x) x.addEventListener('input', ecrire); if (x) x.addEventListener('change', ecrire); });
  ecrire();
})();
