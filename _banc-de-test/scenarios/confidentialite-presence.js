// Statut en ligne masqué : la fiche ne garde que le record de jours
// d'affilée (pas le jour de dernière ouverture). Textes de confidentialité.
const { chromium, BASE } = require('../lib');
(async () => { const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 390, height: 900 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + 'index.html#lang=fr'); await p.waitForTimeout(1500);
  const before = await p.evaluate(() => JSON.stringify(window.__MOCK_DATA.users.u1.loginStreak));
  await p.click('#header-me').then(() => p.waitForTimeout(300)).then(() => p.click('#settings-side')); await p.waitForTimeout(400);
  await p.evaluate(() => { const d = document.querySelector('details.set-more'); if (d) d.open = true; }).then(() => p.click('[data-settings-go="confidentialite"]')).catch(() => {}); await p.waitForTimeout(300);
  const help = await p.$eval('#profile-visibility + .help-text', e => e.innerText).catch(() => 'absent');
  console.log('texte Ma page:', help); if (!/podiums/.test(help)) process.exitCode = 1;
  await p.selectOption('#presence-visibility', 'hide'); await p.waitForTimeout(600);
  const after = await p.evaluate(() => JSON.stringify(window.__MOCK_DATA.users.u1.loginStreak));
  console.log('fiche avant:', before, '| après masquage:', after);
  if (/"last"/.test(after)) process.exitCode = 1;
  console.log('errs', JSON.stringify(errs)); if (errs.length) process.exitCode = 1; await b.close(); })();
