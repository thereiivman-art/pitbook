// Aide › À propos : « Nos partenaires » dans sa carte, séparée des
// remerciements ; l'admin les modifie ici (plus dans Réglages › Admin).
const { chromium, BASE } = require('../lib');
(async () => { const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 390, height: 900 }, deviceScaleFactor: 1 }); p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + 'index.html#lang=fr&admin=1'); await p.waitForTimeout(1500);
  await p.click('#header-me').then(() => p.waitForTimeout(300)).then(() => p.click('#settings-side')); await p.waitForTimeout(400);
  await p.evaluate(() => { const d = document.querySelector('details.set-more'); if (d) d.open = true; });
  await p.click('[data-settings-go="@aide"]').catch(() => {}); await p.waitForTimeout(500);
  const card = await p.$('.partners-card'); console.log('carte partenaires:', !!card, '| formulaire admin:', !!(await p.$('.partners-card #partners-form')));
  if (!card || !(await p.$('.partners-card #partners-form'))) process.exitCode = 1;
  const gap = await p.evaluate(() => { const a = document.querySelector('.partners-card'), c = document.querySelector('.credits-card'); if (!a || !c) return -1; return Math.round(c.getBoundingClientRect().top - a.getBoundingClientRect().bottom); });
  console.log('écart avec Remerciements (px):', gap); if (gap < 8) process.exitCode = 1;
  await p.fill('#partners-input', 'Mototeam95 | https://example.com\nAccimoto'); await p.click('#partners-form button[type="submit"]'); await p.waitForTimeout(500);
  console.log('enregistré:', await p.evaluate(() => JSON.stringify((window.__MOCK_DATA.settings || {}).partners)));
  await (await p.$('.partners-card')).screenshot({ path: __dirname + '/../traces/aide-partenaires.png' }).catch(() => {});
  // Réglages › Admin n'a plus le bloc partenaires.
  console.log('errs', JSON.stringify(errs)); if (errs.length) process.exitCode = 1; await b.close(); })();
