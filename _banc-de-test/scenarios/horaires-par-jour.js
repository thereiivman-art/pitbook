// Team leader : horaires d'un roulage jour par jour et pit lane ouverte (créneau + groupes), affichée à côté des horaires.
const { chromium, BASE } = require('../lib');
(async () => {
  const lang = process.argv[2] || 'fr';
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 380, height: 900 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + 'index.html#lang=' + lang + '&admin=1&bcn=1'); await p.waitForTimeout(2200);
  await p.click('.bottom-nav-btn:nth-child(1)'); await p.waitForTimeout(400);
  await p.click('[data-outing-event="eBcn"]'); await p.waitForTimeout(500);
  console.log('pit lane (seed) vendredi:', await p.evaluate(() => JSON.stringify((window.__MOCK_DATA.events.eBcn.pitlaneByDate || {})['2026-11-27'] || null)), '| plus dans les groupes:', await p.evaluate(() => !/17h10-17h30/.test(window.__MOCK_DATA.events.eBcn.horairesByDate['2026-11-27'].groupA)));
  await p.click('[data-hor-day="2026-11-27"]'); await p.waitForTimeout(300);
  console.log('affichée:', await p.$eval('.pitlane-row', e => e.innerText.replace(/\n/g, ' ')).catch(() => 'absente'));
  await p.click('[data-action="manage-from-outing"]'); await p.waitForTimeout(500);
  await p.click('[data-pill-group="evmanage"][data-pill="horaires"]'); await p.waitForTimeout(300);
  console.log('jours:', await p.$$eval('[data-evm-day]', e => e.map(x => x.innerText).join(' / ')));
  await p.click('[data-evm-day="2026-11-26"]'); await p.waitForTimeout(300);
  console.log('jeudi groupe A:', await p.$eval('#evm-horaires-groupA', e => e.value));
  await p.fill('#evm-horaires-groupA', '9h00-9h20'); await p.fill('#evm-pit-time', '17h30-17h45'); await p.check('[data-evm-pit-group="A"]'); await p.check('[data-evm-pit-group="B"]');
  await p.click('[data-action="evm-horaires-save"]'); await p.waitForTimeout(600);
  console.log('enregistré:', await p.evaluate(() => { const e = window.__MOCK_DATA.events.eBcn; return e.horairesByDate['2026-11-26'].groupA + ' | ' + JSON.stringify(e.pitlaneByDate['2026-11-26']) + ' | vendredi intact: ' + /13h10/.test(e.horairesByDate['2026-11-27'].groupA); }));
  await p.screenshot({ path: 'horaires-par-jour-' + lang + '.png' });
  console.log('errs', JSON.stringify(errs)); await b.close();
  if (errs.length) process.exit(1);
})();
