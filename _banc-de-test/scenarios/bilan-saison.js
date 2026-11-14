// Bilan de saison : feuille « Ta saison » (décembre et janvier, une fois ;
// ?bilan=1 pour l'aperçu), progression par circuit, bouton Partager.
const { chromium, BASE } = require('../lib');
(async () => { const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 390, height: 900 }, deviceScaleFactor: 1 }); p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + 'index.html?bilan=1#lang=' + (process.argv[2] || 'fr')); await p.waitForTimeout(1200);
  await p.evaluate(() => { const db = firebase.firestore(), y = new Date().getFullYear();
    db.collection('sessions').doc('bs1').set({ id: 'bs1', rider: 'Alex', circuit: 'Mugello', date: y + '-04-10', laps: [112.4, 111.9], createdAt: 1 });
    db.collection('sessions').doc('bs2').set({ id: 'bs2', rider: 'Alex', circuit: 'Mugello', date: y + '-09-02', laps: [109.6, 110.2], createdAt: 2 }); });
  await p.waitForSelector('#mini-sheet', { timeout: 20000 }).catch(() => {});
  const t = await p.$eval('#mini-sheet', e => e.innerText.replace(/\n+/g, ' | ')).catch(() => 'absente');
  console.log('bilan:', t);
  if (!/Ta saison/.test(t) || !/Mugello/.test(t) || !/−2,3 s/.test(t)) process.exitCode = 1;
  await (await p.$('#mini-sheet .mini-sheet')).screenshot({ path: __dirname + '/../traces/bilan-saison.png' }).catch(() => {});
  // Une seule fois par saison hors aperçu.
  const again = await p.evaluate(() => { try { return Object.keys(localStorage).filter(k => /^pb_bilan_/.test(k)).length; } catch (e) { return -1; } });
  console.log('mémorisé:', again); if (again !== 1) process.exitCode = 1;
  console.log('errs', JSON.stringify(errs)); if (errs.length) process.exitCode = 1; await b.close(); })();
