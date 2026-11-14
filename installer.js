// Page « Installer Pitbook » : langue (?lang=en ou celle du téléphone) et
// onglet de l'appareil ouvert d'office.
(function () {
  var q = new URLSearchParams(location.search);
  var lang = q.get('lang') || ((navigator.language || 'fr').toLowerCase().indexOf('fr') === 0 ? 'fr' : 'en');
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-fr]').forEach(function (el) { el.innerHTML = el.getAttribute('data-' + lang) || el.getAttribute('data-fr'); });
  var t = document.querySelector('title');
  if (lang === 'en' && t && t.getAttribute('data-en')) document.title = t.getAttribute('data-en');
  // Guides : choix FR / EN en haut, retour au menu des guides, et la
  // langue choisie suit d'une page à l'autre.
  var withLang = function (href, lg) { var u = new URL(href, location.href); u.searchParams.set('lang', lg); return u.pathname.split('/').pop() + u.search + u.hash; };
  var st = document.createElement('style');
  st.textContent = '.langs{margin-left:auto;display:flex;gap:4px}.langs a{font:700 .95rem "Barlow Condensed",sans-serif;padding:6px 10px;border-radius:8px;border:1px solid var(--line);color:var(--ink);text-decoration:none}.langs a.on{background:var(--ink);color:var(--bg);border-color:var(--ink)}.hub-back{display:inline-block;margin:0 0 10px;color:var(--ink);text-decoration:none;font-weight:600}';
  document.head.appendChild(st);
  var brand = document.querySelector('.brand');
  if (brand) {
    var box = document.createElement('span'); box.className = 'langs';
    ['fr', 'en'].forEach(function (lg) { var a = document.createElement('a'); a.href = withLang(location.href, lg); a.textContent = lg.toUpperCase(); if (lg === lang) a.className = 'on'; a.setAttribute('aria-current', lg === lang ? 'true' : 'false'); box.appendChild(a); });
    brand.appendChild(box);
    if (!document.body.hasAttribute('data-hub')) {
      var back = document.createElement('a'); back.className = 'hub-back'; back.href = 'guide.html?lang=' + lang;
      back.textContent = lang === 'en' ? '‹ All guides' : '‹ Tous les guides';
      brand.parentNode.insertBefore(back, brand);
    }
  }
  document.querySelectorAll('a[href]').forEach(function (a) {
    var h = a.getAttribute('href');
    if (/^[\w-]+\.html/.test(h) && !a.closest('.langs')) a.setAttribute('href', withLang(h, lang));
  });
  var ua = navigator.userAgent;
  var ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var show = function (id) {
    document.querySelectorAll('section').forEach(function (s) { s.hidden = s.id !== id; });
    document.querySelectorAll('[data-tab]').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-tab') === id); });
  };
  document.querySelectorAll('[data-tab]').forEach(function (b) { b.addEventListener('click', function () { show(b.getAttribute('data-tab')); }); });
  if (document.querySelector('[data-tab]')) show(ios ? 'ios' : /Android/.test(ua) ? 'android' : 'pc');
})();
