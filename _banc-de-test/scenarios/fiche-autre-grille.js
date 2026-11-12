// La fiche d'un autre pilote reprend la grille de Ma page.
const { chromium, BASE } = require('../lib');
(async () => {
  const lang = process.argv[2] || 'fr';
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 380, height: 1000 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + 'index.html#lang=' + lang); await p.waitForTimeout(2000);
  await p.evaluate(() => { const b = document.querySelector('[data-person-link="Sam"], [data-open-person="Sam"], [data-name="Sam"]'); if (b) b.click(); }); await p.waitForTimeout(700);
  if (!(await p.$('.person-page'))) { await p.click('.bottom-nav-btn:nth-child(3)'); await p.waitForTimeout(600); await p.click('[data-person-link="Sam"]').catch(() => {}); await p.waitForTimeout(700); }
  console.log('page de:', await p.$eval('.person-name', e => e.innerText).catch(() => '?'), '| boutons:', await p.$$eval('.mp-tab', e => e.map(x => x.innerText).join(' / ')));
  for (const k of await p.$$eval('.mp-tab', e => e.map(x => x.getAttribute('data-mp-tab')))) {
    await p.click('[data-mp-tab="' + k + '"]');
    console.log(k, '->', await p.$eval('[data-mp-sec="' + k + '"]', e => e.innerText.replace(/\n+/g, ' | ').slice(0, 90)).catch(() => 'section absente'));
  }
  await p.screenshot({ path: 'fiche-autre-' + lang + '.png' });
  console.log('errs', JSON.stringify(errs)); await b.close(); if (errs.length) process.exit(1);
})();
