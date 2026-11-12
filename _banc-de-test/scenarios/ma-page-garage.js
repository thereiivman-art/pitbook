// Ma page (onglets partagés) et Mon garage (Véhicules, Pneus, Budget).
const { chromium, BASE } = require('../lib');
(async () => {
  const lang = process.argv[2] || 'fr';
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 380, height: 1000 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + 'index.html#lang=' + lang + '&look=1'); await p.waitForTimeout(2000);
  await p.click('#header-me'); await p.waitForTimeout(600);
  console.log('sous-onglets Profil:', await p.$$eval('.subnav-btn', e => e.map(x => x.innerText).join(' / ')));
  console.log('boutons Ma page:', await p.$$eval('.mp-tab', e => e.map(x => x.innerText).join(' / ')));
  for (const k of ['perfs', 'saisons', 'circuits', 'reseau']) {
    await p.click('[data-mp-tab="' + k + '"]');
    console.log(k, '->', await p.$eval('[data-mp-sec="' + k + '"]', e => e.innerText.replace(/\n+/g, ' | ').slice(0, 110)));
  }
  console.log('trophées dépliés:', await p.$$eval('[data-mp-sec="trophees"] details', e => e.length) === 0);
  await p.click('.subnav-btn:nth-child(2)'); await p.waitForTimeout(600);
  console.log('Mon garage pastilles:', await p.$$eval('.pill-btn', e => e.map(x => x.innerText).join(' / ')));
  await p.click('.pill-btn[data-pill="pneus"]'); await p.waitForTimeout(600);
  console.log('Pneus:', await p.evaluate(() => document.querySelector('#root').innerText.split('Budget')[1].replace(/\n+/g, ' | ').slice(0, 160)));
  await p.screenshot({ path: 'ma-page-garage-' + lang + '.png' });
  console.log('errs', JSON.stringify(errs)); await b.close(); if (errs.length) process.exit(1);
})();
