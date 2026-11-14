// Page des liens envoyés par mail (pitbook.fr/action.html) : confirmer son
// adresse, choisir un nouveau mot de passe, annuler un changement d'adresse.
// Remplace la page de Firebase (carnetpiste.firebaseapp.com).
(function () {
  var q = new URLSearchParams(location.search);
  var mode = q.get('mode'), code = q.get('oobCode') || '';
  var lang = (q.get('lang') || navigator.language || 'fr').toLowerCase().indexOf('en') === 0 ? 'en' : 'fr';
  var L = function (fr, en) { return lang === 'en' ? en : fr; };
  document.documentElement.lang = lang;
  var $ = function (id) { return document.getElementById(id); };
  var show = function (title, lead, openLabel, openHref) {
    $('title').textContent = title; $('lead').textContent = lead || '';
    if (openLabel) { $('open').textContent = openLabel; $('open').href = openHref || './'; $('open').hidden = false; } else $('open').hidden = true;
  };
  // Le code ne doit pas rester dans l'historique ni être renvoyé ailleurs.
  try { history.replaceState(null, '', location.pathname + '?mode=' + encodeURIComponent(mode || '') + '&lang=' + lang); } catch (e) {}
  var auth;
  try { auth = firebase.auth(); auth.languageCode = lang; } catch (e) { auth = null; }
  var badLink = function () {
    show(L('Lien expiré', 'Link expired'), L('Ce lien a déjà servi ou a expiré. Ouvre Pitbook pour en demander un nouveau.', 'This link was already used or has expired. Open Pitbook to ask for a new one.'), L('Ouvrir Pitbook', 'Open Pitbook'));
  };
  if (!auth || !code) { if (!code) { location.replace('./'); return; } badLink(); return; }
  show(L('Un instant…', 'One moment…'), '');
  if (mode === 'verifyEmail') {
    auth.applyActionCode(code).then(function () {
      show(L('Adresse confirmée', 'Email confirmed'), L('Bienvenue sur Pitbook ! Ton compte est prêt : tes chronos, tes roulages et tes potes t\'attendent.', 'Welcome to Pitbook! Your account is ready: your lap times, trackdays and mates are waiting.'), L('Ouvrir Pitbook', 'Open Pitbook'), './?verifie=1');
    }).catch(badLink);
  } else if (mode === 'resetPassword') {
    auth.verifyPasswordResetCode(code).then(function (email) {
      show(L('Nouveau mot de passe', 'New password'), L('Pour le compte ', 'For the account ') + email + '.');
      $('pw-label').textContent = L('Nouveau mot de passe (6 caractères ou plus)', 'New password (6 characters or more)');
      $('pw-show-label').textContent = L('Afficher', 'Show');
      $('pw-go').textContent = L('Enregistrer', 'Save');
      $('pw-form').hidden = false; $('pw').focus();
      $('pw-show').addEventListener('change', function () { $('pw').type = this.checked ? 'text' : 'password'; });
      $('pw-form').addEventListener('submit', function (e) {
        e.preventDefault();
        var pw = $('pw').value;
        if (pw.length < 6) { $('err').textContent = L('6 caractères minimum.', 'At least 6 characters.'); return; }
        $('pw-go').disabled = true; $('err').textContent = '';
        auth.confirmPasswordReset(code, pw).then(function () {
          $('pw-form').hidden = true;
          show(L('Mot de passe changé', 'Password changed'), L('Connecte-toi avec ton nouveau mot de passe.', 'Sign in with your new password.'), L('Ouvrir Pitbook', 'Open Pitbook'));
        }).catch(function (err) {
          $('pw-go').disabled = false;
          var c = (err && err.code) || '';
          if (/weak-password/.test(c)) $('err').textContent = L('Mot de passe trop simple : allonge-le.', 'Password too weak: make it longer.');
          else if (/expired|invalid-action-code/.test(c)) { $('pw-form').hidden = true; badLink(); }
          else $('err').textContent = L('Ça n\'a pas marché, réessaie.', 'That didn\'t work, try again.');
        });
      });
    }).catch(badLink);
  } else if (mode === 'recoverEmail') {
    auth.checkActionCode(code).then(function (info) {
      return auth.applyActionCode(code).then(function () {
        show(L('Adresse rétablie', 'Email restored'), L('Ton compte utilise de nouveau ', 'Your account uses ') + ((info.data && info.data.email) || '') + L('. Si tu n\'as pas demandé ce changement, change aussi ton mot de passe.', ' again. If you didn\'t ask for this change, change your password too.'), L('Ouvrir Pitbook', 'Open Pitbook'));
      });
    }).catch(badLink);
  } else {
    location.replace('./');
  }
})();
