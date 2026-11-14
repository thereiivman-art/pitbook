// Page « Installer Pitbook » : langue (?lang=en ou celle du téléphone) et
// onglet de l'appareil ouvert d'office.
(function () {
  var q = new URLSearchParams(location.search);
  var lang = q.get('lang') || ((navigator.language || 'fr').toLowerCase().indexOf('fr') === 0 ? 'fr' : 'en');
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-fr]').forEach(function (el) { el.innerHTML = el.getAttribute('data-' + lang) || el.getAttribute('data-fr'); });
  if (lang === 'en') document.title = 'Install Pitbook';
  var ua = navigator.userAgent;
  var ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var show = function (id) {
    document.querySelectorAll('section').forEach(function (s) { s.hidden = s.id !== id; });
    document.querySelectorAll('[data-tab]').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-tab') === id); });
  };
  document.querySelectorAll('[data-tab]').forEach(function (b) { b.addEventListener('click', function () { show(b.getAttribute('data-tab')); }); });
  show(ios ? 'ios' : /Android/.test(ua) ? 'android' : 'pc');
})();
