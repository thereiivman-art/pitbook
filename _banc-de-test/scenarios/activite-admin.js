// Carte admin « Activité » : actifs 1/7/30 jours, objectifs avant Pitbook+,
// parcours d'inscription, inscriptions par semaine.
const { chromium, BASE, openAdmin } = require('../lib');
(async () => {
  const lang = process.argv[2] || 'fr';
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 390, height: 1000 }, deviceScaleFactor: 1 }); p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + 'index.html#lang=' + lang + '&admin=1'); await p.waitForTimeout(1600);
  await p.evaluate(() => { const db = firebase.firestore(), dk = d => { const x = new Date(Date.now() - d * 864e5); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); };
    db.collection('users').doc('u2').set({ loginStreak: { last: dk(0) }, createdAt: Date.now() - 2 * 864e5 }, { merge: true });
    db.collection('users').doc('u3').set({ loginStreak: { last: dk(3) }, createdAt: Date.now() - 10 * 864e5 }, { merge: true });
    db.collection('users').doc('u4').set({ loginStreak: { last: dk(20) }, createdAt: Date.now() - 40 * 864e5 }, { merge: true });
    db.collection('users').doc('u5').set({ loginStreak: { last: dk(60) } }, { merge: true });
    db.collection('usageStats').doc('signup').set({ count: 12 }); db.collection('usageStats').doc('verified').set({ count: 9 });
    db.collection('usageStats').doc('first_chrono').set({ count: 6 }); db.collection('usageStats').doc('second_roulage').set({ count: 2 }); db.collection('usageStats').doc('installed').set({ count: 7 }); db.collection('usageStats').doc('push_on').set({ count: 5 }); db.collection('usageStats').doc('first_ride').set({ count: 8 }); });
  await p.waitForTimeout(500);
  await openAdmin(p); await p.waitForTimeout(800);
  const t = await p.$eval('.act-card', e => Array.from(e.querySelectorAll('strong,span,h3,b')).map(x => x.textContent).join(' | ')).catch(() => 'absente');
  console.log(t);
  if (!/actifs sur 7 jours/.test(t) || !/Inscriptions par semaine/.test(t) || !/9 \| Adresse confirmée/.test(t) || !/7 \| Appli installée/.test(t) || !/5 \| Notifs activées/.test(t) || !/8 \| 1er roulage/.test(t)) process.exitCode = 1;
  await (await p.$('.act-card')).screenshot({ path: __dirname + '/../traces/activite-admin.png' });
  const w = await p.evaluate(() => document.documentElement.scrollWidth); console.log('largeur', w); if (w > 390) process.exitCode = 1;
  // Compte réservé : plus compté.
  p.on('dialog', d => d.accept());
  const nb = () => p.$eval('.act-accounts summary', e => e.innerText);
  console.log('avant:', await nb());
  await p.click('.act-accounts summary'); await p.click('[data-ignore-uid="u4"]'); await p.waitForTimeout(400);
  const n2 = await nb(); console.log('après:', n2, '| réglage:', await p.evaluate(() => JSON.stringify((window.__MOCK_DATA.settings || {}).adminStats)));
  if (!/8 \/ 9/.test(n2)) process.exitCode = 1;
  // Remise à zéro des compteurs.
  await p.click('[data-usage-reset]'); await p.waitForTimeout(600);
  const left = await p.evaluate(() => Object.keys(window.__MOCK_DATA.usageStats || {}).length);
  console.log('compteurs restants:', left, '|', await p.$eval('.act-card', e => (e.innerText.match(/Depuis le [^.]*/) || [''])[0]));
  if (left !== 0) process.exitCode = 1;
  console.log('errs', JSON.stringify(errs)); if (errs.length) process.exitCode = 1;
  await b.close();
})();
