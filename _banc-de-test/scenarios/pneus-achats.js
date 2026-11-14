// Les pneus se dépensent : cadre, bulles, couleur de bannière achetés
// (solde qui baisse, achat gardé), solde insuffisant expliqué. Sauvegarde
// de la fiche immédiate. Records pros dans Circuits › Infos.
const { chromium, BASE } = require('../lib');
(async () => { const b = await chromium.launch(); const lang = process.argv[2] || 'fr'; const errs = [];
  const page = async (hash) => { const p = await b.newPage({ viewport: { width: 390, height: 860 } }); p.on('pageerror', e => errs.push(e.message)); await p.goto(BASE + 'index.html#lang=' + lang + hash); await p.waitForTimeout(1600); return p; };
  let p = await page('');
  const bal0 = await p.$eval('.pneus-chip b', e => +e.innerText);
  await p.click('#header-me'); await p.waitForTimeout(500);
  await p.click('.pneus-chip.profile-pneus'); await p.waitForTimeout(400);
  await p.evaluate(() => { const d = document.querySelector('.mini-sheet [data-pneus-buy="frame:or"]').closest('details'); if (d) d.open = true; });
  await p.locator('.mini-sheet [data-pneus-buy="frame:or"]').last().click(); await p.waitForTimeout(300);
  console.log('solde', bal0, '| achat trop cher:', await p.$eval('.mini-sheet .help-text', e => e.innerText), '| bouton:', await p.$eval('.mini-sheet-actions button', e => e.innerText));
  await p.close();
  p = await page('&riche=1');
  const before = await p.$eval('.pneus-chip b', e => +e.innerText);
  await p.click('#header-me'); await p.waitForTimeout(500);
  await p.click('.pneus-chip.profile-pneus'); await p.waitForTimeout(400);
  await p.evaluate(() => { const d = document.querySelector('.mini-sheet [data-pneus-buy="frame:or"]').closest('details'); if (d) d.open = true; });
  await p.locator('.mini-sheet [data-pneus-buy="frame:or"]').last().click(); await p.waitForTimeout(300);
  await p.click('#pneus-buy-ok'); await p.waitForTimeout(500);
  const after = await p.$eval('.pneus-chip b', e => +e.innerText);
  await p.evaluate(() => { const x = document.querySelector('.mini-sheet [data-pneus-set="frame"][data-val="or"]'); const d = x && x.closest('details'); if (d) d.open = true; });
  const owned = !!(await p.$('.mini-sheet [data-pneus-set="frame"][data-val="or"]'));
  console.log('solde', before, '→', after, '| feuille Pneus rouverte, cadre Or disponible:', owned);
  if (!(after < before) || !owned) process.exitCode = 1;
  await p.click('[data-pneus-set="frame"][data-val="or"]'); await p.waitForTimeout(600);
  await p.click('.mini-sheet [data-mini-close]').catch(() => {}); await p.waitForTimeout(300);
  console.log('cadre sur l\'avatar:', await p.$$eval('[class*="frame-or"]', e => e.length) > 0);
  console.log('stocké:', await p.evaluate(() => { const u = window.__MOCK_DATA.users.u1; return JSON.stringify([u.pneus.spent, u.pneus.owned, (u.look || {}).frame]); }));
  // Records pros à la fin d'Infos (Barcelone).
  await p.click('.bottom-nav-btn:nth-child(1)'); await p.waitForTimeout(300);
  await p.click('.subnav-btn[data-view="circuit"]'); await p.waitForTimeout(400);
  await p.click('[data-pill-group="circuit"][data-pill="infos"]'); await p.waitForTimeout(400);
  console.log('records Barcelone:', await p.$$eval('.track-records .tr-pro', e => e.length + ' records pros'), '|', await p.$eval('.track-records .tr-pro .carnet-time', e => e.innerText).catch(() => '?'));
  console.log('errs', JSON.stringify(errs)); if (errs.length) process.exitCode = 1; await b.close(); })();
