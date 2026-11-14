// Carte admin « État de Pitbook » : mails et notifications (serviceStatus),
// un échec récent en rouge, bouton Actualiser.
const { chromium, BASE, openAdmin } = require('../lib');
(async () => {
  const lang = process.argv[2] || 'fr';
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 390, height: 900 }, deviceScaleFactor: 2 }); p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + 'index.html#lang=' + lang + '&admin=1'); await p.waitForTimeout(1600);
  await p.evaluate(() => { const db = firebase.firestore(), day = new Date().toISOString().slice(0, 10), now = Date.now();
    db.collection('serviceStatus').doc('mail').set({ day, okToday: 4, errToday: 1, lastOkAt: now - 3600e3, lastErrAt: now - 600e3, lastErr: 'envoi par le serveur OVH : EAUTH Invalid login' });
    db.collection('serviceStatus').doc('push').set({ day, okToday: 12, errToday: 0, lastOkAt: now - 120e3 }); });
  await openAdmin(p);
  await p.click('[data-action="status-refresh"]'); await p.waitForTimeout(600);
  const txt = await p.$eval('.admin-status', e => e.innerText.replace(/\n+/g, ' | ')).catch(() => 'absente');
  console.log('carte:', txt);
  const bad = await p.$$eval('.admin-status .status-row.is-bad', e => e.length);
  console.log('lignes en rouge:', bad); if (bad !== 1 || !/EAUTH/.test(txt) || !/12/.test(txt)) process.exitCode = 1;
  await p.screenshot({ path: 'etat-pitbook-' + lang + '.png' });
  console.log('errs', JSON.stringify(errs)); if (errs.length) process.exitCode = 1;
  await b.close();
})();
