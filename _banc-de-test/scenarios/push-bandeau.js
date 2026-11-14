// Bandeau « Être prévenu quand on t'écrit ? » (Social, Messages), « Plus tard »
// (revient au plus toutes les 2 semaines, 3 fois), feuille après le premier
// message, guide d'installation (iPhone sans l'appli), page installer.html.
const { chromium, BASE } = require('../lib');
(async () => {
  const lang = process.argv[2] || 'fr';
  const b = await chromium.launch(); const errs = [];
  const stub = (supported) => ((sup) => {
    window.PUSH_VAPID_KEY = 'TEST';
    if (sup) { const m = () => ({ getToken: () => Promise.resolve('tok_X'), deleteToken: () => Promise.resolve(true) }); m.isSupported = () => true; firebase.messaging = m; }
    try { Object.defineProperty(navigator.serviceWorker, 'ready', { value: Promise.resolve({}) }); } catch (e) {}
    let perm = 'default'; Object.defineProperty(Notification, 'permission', { get: () => perm });
    Notification.requestPermission = () => { perm = 'granted'; return Promise.resolve('granted'); };
  })(supported);
  // Android / ordinateur : le push marche.
  const p = await b.newPage({ viewport: { width: 390, height: 900 }, deviceScaleFactor: 2 }); p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + 'index.html#lang=' + lang); await p.waitForTimeout(1600);
  await p.evaluate(stub, true);
  await p.waitForTimeout(1500); console.log('ordinateur, guide automatique:', !!(await p.$('.mini-sheet')) ? 'affiché (problème)' : 'non'); if (await p.$('.mini-sheet')) process.exitCode = 1;
  await p.click('.bottom-nav-btn:nth-child(3)'); await p.waitForTimeout(500);
  const nudge = await p.$eval('.push-nudge', e => e.innerText.replace(/\n+/g, ' | ')).catch(() => 'absent');
  console.log('Social, bandeau:', nudge); if (nudge === 'absent') process.exitCode = 1;
  await p.evaluate(() => document.querySelector('.push-nudge').scrollIntoView({ block: 'center' })); await p.screenshot({ path: 'push-bandeau-' + lang + '.png' });
  await p.click('.push-nudge [data-action="push-later"]'); await p.waitForTimeout(400);
  console.log('après Plus tard:', !(await p.$('.push-nudge')) ? 'masqué' : 'encore là', '|', await p.evaluate(() => localStorage.getItem('pb_pushNudge')));
  // Deux semaines plus tard : il revient ; 3 « Plus tard » : plus jamais.
  await p.evaluate(() => localStorage.setItem('pb_pushNudge', JSON.stringify({ n: 1, at: Date.now() - 15 * 86400000 })));
  await p.click('#messages-toggle'); await p.waitForTimeout(500);
  console.log('Messages, 15 jours après:', !!(await p.$('.push-nudge')));
  await p.evaluate(() => localStorage.setItem('pb_pushNudge', JSON.stringify({ n: 3, at: Date.now() - 60 * 86400000 })));
  await p.click('#messages-toggle'); await p.waitForTimeout(300); await p.click('#messages-toggle').catch(() => {}); await p.waitForTimeout(400);
  const after3 = !!(await p.$('.push-nudge')); console.log('après 3 « Plus tard »:', after3 ? 'encore là' : 'plus jamais'); if (after3) process.exitCode = 1;
  // Premier message envoyé : feuille « Être prévenu de la réponse ? »
  await p.evaluate(() => localStorage.removeItem('pb_pushNudge'));
  await p.click('[data-action="dm-new"]'); await p.waitForTimeout(300); await p.click('[data-dm-pick="Sam"]'); await p.click('#dm-pick-go'); await p.waitForTimeout(400);
  await p.fill('#dm-text', 'Salut !'); await p.click('#dm-form button[type="submit"]'); await p.waitForTimeout(1800);
  const sheet = await p.$eval('.mini-sheet', e => e.innerText.replace(/\n+/g, ' | ')).catch(() => 'aucune');
  console.log('après le 1er message:', sheet); if (!/prévenu|notified/.test(sheet)) process.exitCode = 1;
  await p.click('[data-push-sheet="on"]'); await p.waitForTimeout(700);
  const tok = await p.evaluate(() => JSON.stringify(((window.__MOCK_DATA.userPrivate.u1 || {}).push || {}).tokens || {}));
  console.log('activé depuis la feuille:', /tok_X/.test(tok)); if (!/tok_X/.test(tok)) process.exitCode = 1;
  // iPhone sans l'appli installée : bandeau « Comment ? » puis guide.
  const ctx = await b.newContext({ ...require('playwright').devices ? {} : {}, viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1', isMobile: true, hasTouch: true });
  // À la première ouverture sur iPhone : le guide d'installation s'ouvre tout seul, une seule fois.
  const f = await ctx.newPage(); f.on('pageerror', e => errs.push(e.message));
  await f.goto(BASE + 'index.html#lang=' + lang); await f.waitForTimeout(4500);
  const first = await f.$eval('.mini-sheet', e => e.innerText.split('\n').filter(Boolean).slice(1, 2).join('')).catch(() => 'rien');
  console.log('1re ouverture iPhone:', first); if (!/Installer|Install/.test(first)) process.exitCode = 1;
  await f.goto('about:blank'); await f.goto(BASE + 'index.html#lang=' + lang); await f.waitForTimeout(4500);
  const second = !!(await f.$('.mini-sheet'));
  console.log('2e ouverture iPhone:', second ? 'encore affiché' : 'rien'); if (second) process.exitCode = 1;
  await f.close();
  const i = await ctx.newPage(); i.on('pageerror', e => errs.push(e.message));
  await i.goto(BASE + 'index.html#lang=' + lang); await i.waitForTimeout(1600);
  await i.evaluate(stub, false);
  await i.click('.bottom-nav-btn:nth-child(3)'); await i.waitForTimeout(500);
  console.log('iPhone, bandeau:', await i.$eval('.push-nudge', e => e.innerText.replace(/\n+/g, ' | ')).catch(() => 'absent'));
  await i.click('.push-nudge [data-action="install-guide"]'); await i.waitForTimeout(400);
  const guide = await i.$eval('.mini-sheet', e => e.innerText.replace(/\n+/g, ' | ')).catch(() => 'absent');
  console.log('guide iPhone:', guide); if (!/Safari/.test(guide)) process.exitCode = 1;
  await i.screenshot({ path: 'install-guide-ios-' + lang + '.png' });
  // Page publique installer.html (iPhone puis Android).
  await i.goto(BASE + 'installer.html' + (lang === 'en' ? '?lang=en' : '')); await i.waitForTimeout(800);
  console.log('installer.html (iPhone):', await i.$eval('section:not([hidden])', e => e.id + ' : ' + e.innerText.replace(/\n+/g, ' | ')));
  await i.screenshot({ path: 'installer-ios-' + lang + '.png', fullPage: true });
  const a = await (await b.newContext({ viewport: { width: 390, height: 844 }, userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36' })).newPage();
  a.on('pageerror', e => errs.push(e.message));
  await a.goto(BASE + 'installer.html' + (lang === 'en' ? '?lang=en' : '')); await a.waitForTimeout(800);
  const andro = await a.$eval('section:not([hidden])', e => e.id); console.log('installer.html (Android):', andro); if (andro !== 'android') process.exitCode = 1;
  const over = await a.evaluate(() => document.documentElement.scrollWidth > innerWidth); console.log('débordement horizontal:', over); if (over) process.exitCode = 1;
  console.log('errs', JSON.stringify(errs)); if (errs.length) process.exitCode = 1;
  await b.close();
})();
