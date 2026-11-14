// Notifications push : Réglages › Notifications › « Sur cet appareil ».
// Le service de Google est simulé (jeton factice) : on vérifie le jeton
// rangé dans userPrivate, les types, la coupure, et l'ouverture du bon
// écran quand on touche une notification (?go=…).
const { chromium, BASE } = require('../lib');
(async () => {
  const lang = process.argv[2] || 'fr';
  const b = await chromium.launch(); const errs = [];
  const ctx = await b.newContext({ viewport: { width: 390, height: 900 } });
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + 'index.html#lang=' + lang); await p.waitForTimeout(1600);
  await p.evaluate(() => {
    window.PUSH_VAPID_KEY = 'TEST';
    const m = () => ({ getToken: () => Promise.resolve('tok_ABC123'), deleteToken: () => Promise.resolve(true) });
    m.isSupported = () => true; firebase.messaging = m;
    Object.defineProperty(navigator.serviceWorker, 'ready', { value: Promise.resolve({}) });
    let perm = 'default';
    Object.defineProperty(Notification, 'permission', { get: () => perm });
    Notification.requestPermission = () => { perm = 'granted'; return Promise.resolve('granted'); };
  });
  const priv = () => p.evaluate(() => JSON.stringify((window.__MOCK_DATA.userPrivate.u1 || {}).push || null));
  await p.click('#settings-side'); await p.waitForTimeout(400);
  await p.click('[data-settings-go="notifications"]'); await p.waitForTimeout(500);
  console.log('carte:', await p.$eval('.push-card', e => e.innerText.replace(/\n+/g, ' | ')).catch(() => 'absente'));
  await p.click('[data-action="push-on"]'); await p.waitForTimeout(800);
  const after = await priv(); console.log('après Activer:', after);
  if (!/tok_ABC123/.test(after)) process.exitCode = 1;
  console.log('carte:', await p.$eval('.push-card', e => e.innerText.replace(/\n+/g, ' | ')).catch(() => 'absente'));
  await p.click('[data-push-type="comments"]'); await p.waitForTimeout(400);
  const t = await priv(); console.log('commentaires coupés:', t); if (!/"comments":false/.test(t)) process.exitCode = 1;
  await p.click('[data-action="push-off"]'); await p.waitForTimeout(600);
  const off = await priv(); console.log('après Couper:', off); if (/tok_ABC123/.test(off)) process.exitCode = 1;
  // Notification touchée : le bon écran.
  const q = await ctx.newPage(); q.on('pageerror', e => errs.push(e.message));
  await q.goto(BASE + 'index.html?go=' + encodeURIComponent('dm:Sam') + '#lang=' + lang); await q.waitForTimeout(2200);
  const dm = await q.$eval('.dm-thread', e => e.innerText.split('\n').slice(0, 3).join(' | ')).catch(() => 'pas ouverte');
  console.log('?go=dm:Sam →', dm); if (!/Sam/.test(dm)) process.exitCode = 1;
  await q.goto('about:blank'); await q.goto(BASE + 'index.html?go=' + encodeURIComponent('ev:e1') + '#lang=' + lang); await q.waitForTimeout(2200);
  const ev = await q.$eval('#root', e => /Barcelon/i.test(e.innerText) && !!document.querySelector('[data-pill-group="outing"]')).catch(() => false);
  console.log('?go=ev:e1 → page du roulage:', ev); if (!ev) process.exitCode = 1;
  console.log('errs', JSON.stringify(errs)); if (errs.length) process.exitCode = 1;
  await b.close();
})();
