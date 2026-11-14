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
    db.collection('usageStats').doc('first_chrono').set({ count: 6 }); db.collection('usageStats').doc('second_roulage').set({ count: 2 }); });
  await p.waitForTimeout(500);
  await openAdmin(p); await p.waitForTimeout(800);
  const t = await p.$eval('.act-card', e => Array.from(e.querySelectorAll('strong,span,h3,b')).map(x => x.textContent).join(' | ')).catch(() => 'absente');
  console.log(t);
  if (!/actifs sur 7 jours/.test(t) || !/Inscriptions par semaine/.test(t) || !/9 \| Adresse confirmée/.test(t)) process.exitCode = 1;
  await (await p.$('.act-card')).screenshot({ path: __dirname + '/../traces/activite-admin.png' });
  const w = await p.evaluate(() => document.documentElement.scrollWidth); console.log('largeur', w); if (w > 390) process.exitCode = 1;
  console.log('errs', JSON.stringify(errs)); if (errs.length) process.exitCode = 1;
  await b.close();
})();
