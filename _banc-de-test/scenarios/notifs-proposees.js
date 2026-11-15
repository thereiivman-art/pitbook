// Notifications proposées au bon moment : étape « Être prévenu » du premier
// lancement (Activer en un geste).
const { chromium, BASE } = require('../lib');
const fakePush = () => {
  window.PUSH_VAPID_KEY = 'TEST';
  const m = () => ({ getToken: () => Promise.resolve('tok_ONB'), deleteToken: () => Promise.resolve(true) });
  m.isSupported = () => true; firebase.messaging = m;
  try { Object.defineProperty(navigator.serviceWorker, 'ready', { value: Promise.resolve({}) }); } catch (e) {}
  let perm = 'default';
  Object.defineProperty(Notification, 'permission', { get: () => perm, configurable: true });
  Notification.requestPermission = () => { perm = 'granted'; return Promise.resolve('granted'); };
};
(async () => { const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 }); p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + 'index.html#lang=fr&premier=1'); await p.waitForTimeout(1500);
  await p.evaluate(fakePush);
  await p.click('[data-onb-go="1"]'); await p.waitForTimeout(300);
  const t = await p.$eval('.onb-modal', e => e.innerText.replace(/\n+/g, ' | ')).catch(() => 'absente');
  console.log('étape 2:', t.slice(0, 220)); if (!/Être prévenu/.test(t)) process.exitCode = 1;
  await p.screenshot({ path: __dirname + '/../traces/onb-notifs.png' });
  await p.click('[data-onb-push]'); await p.waitForTimeout(700);
  const tok = await p.evaluate(() => JSON.stringify((window.__MOCK_DATA.userPrivate.u1 || {}).push || null));
  console.log('jeton:', tok, '| écran:', (await p.$eval('.onb-modal', e => e.innerText).catch(() => '')).includes('activé'));
  if (!/tok_ONB/.test(tok)) process.exitCode = 1;
  console.log('errs', JSON.stringify(errs)); if (errs.length) process.exitCode = 1; await b.close(); })();
