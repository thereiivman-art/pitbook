// Carnet › Courses : onglet à part avec l'explication (pas un roulage).
const { chromium, BASE } = require('../lib');
(async () => {
  const lang = process.argv[2] || 'fr';
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 380, height: 900 }, deviceScaleFactor: 2 }); p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + 'index.html#lang=' + lang); await p.waitForTimeout(1800);
  await p.click('.bottom-nav-btn:nth-child(1)'); await p.waitForTimeout(500);
  console.log('sous-onglets Carnet:', await p.$$eval('.main-subnav .subnav-btn', e => e.map(x => x.innerText).join(' / ')));
  await p.click('.subnav-btn[data-view="courses"]'); await p.waitForTimeout(500);
  console.log('explication:', await p.$eval('.courses-intro', e => e.innerText.replace(/\n+/g, ' ').slice(0, 120)));
  await p.screenshot({ path: 'courses-' + lang + '.png' });
  await p.click('[data-courses-interest="1"]'); await p.waitForTimeout(500);
  console.log('intéressé:', await p.$eval('.courses-cta', e => e.innerText.replace(/\n+/g, ' ')));
  console.log('errs', JSON.stringify(errs)); await b.close(); if (errs.length) process.exit(1);
})();
