// Avis rapide : proposé après 3 jours d'utilisation, note + mot, enregistré
// dans feedback ; toujours accessible depuis Réglages › Donner mon avis.
const { chromium, BASE } = require('../lib');
(async () => { const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 390, height: 900 }, deviceScaleFactor: 1 }); p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(() => { try { localStorage.setItem('pb_days_u1', JSON.stringify(['2026-11-01', '2026-11-05'])); } catch (e) {} });
  await p.goto(BASE + 'index.html#lang=fr'); await p.waitForTimeout(1500);
  const uid = await p.evaluate(() => firebase.auth().currentUser.uid); console.log('uid', uid);
  await p.waitForSelector('[data-avis-send]', { timeout: 25000 }).catch(() => {});
  const t = await p.$eval('#mini-sheet', e => e.innerText.replace(/\n+/g, ' | ')).catch(() => 'absente');
  console.log('question:', t.slice(0, 160)); if (!/Pitbook te plaît/.test(t)) process.exitCode = 1;
  await (await p.$('#mini-sheet .mini-sheet')).screenshot({ path: __dirname + '/../traces/avis-rapide.png' }).catch(() => {});
  await p.click('[data-avis-note="4"]'); await p.fill('#avis-text', 'Il manque les pressions… non, je rigole.'); await p.click('[data-avis-send]'); await p.waitForTimeout(500);
  const fb = await p.evaluate(() => Object.values(window.__MOCK_DATA.feedback || {}).filter(f => f.kind === 'avis').map(f => f.rating + ':' + f.text));
  console.log('enregistré:', JSON.stringify(fb)); if (!fb.length || !/^4:/.test(fb[0])) process.exitCode = 1;
  // Plus redemandé ; accessible depuis Réglages.
  await p.click('#header-me').then(() => p.waitForTimeout(300)).then(() => p.click('#settings-side')); await p.waitForTimeout(500);
  await p.click('#avis-row'); await p.waitForTimeout(400);
  console.log('depuis Réglages:', await p.$eval('#mini-sheet h2', e => e.innerText).catch(() => 'absente'));
  if (!(await p.$('#mini-sheet [data-avis-note]'))) process.exitCode = 1;
  console.log('errs', JSON.stringify(errs)); if (errs.length) process.exitCode = 1; await b.close(); })();
