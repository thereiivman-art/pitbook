// Ma page : 6 tuiles, plus de tuile Posts (posts toujours affichés), accompagnant avec Saisons et Photos.
const { chromium, BASE } = require('../lib');
(async () => {
  const lang = process.argv[2] || 'fr';
  const b = await chromium.launch(); const errs = [];
  for (const role of ['', '&role=acc', '&role=orga']) {
    const p = await b.newPage({ viewport: { width: 380, height: 900 }, deviceScaleFactor: 2 }); p.on('pageerror', e => errs.push(e.message));
    await p.goto(BASE + 'index.html#lang=' + lang + role); await p.waitForTimeout(1800);
    await p.click('#header-me'); await p.waitForTimeout(600);
    const tiles = await p.$$eval('.mp-tile .mp-k', e => e.map(x => x.innerText.replace('›', '').trim()));
    console.log((role || 'pilote') + ' tuiles (' + tiles.length + '):', tiles.join(' / '), '| section ouverte:', await p.$$eval('[data-mp-sec]:not([hidden])', e => e.length), '| posts visibles:', !!(await p.$('.mp-posts-all')));
    if (role === '&role=acc') {
      await p.evaluate(() => document.querySelector('.mp-bento').scrollIntoView({ block: 'start' })); await p.evaluate(() => window.scrollBy(0, -80));
      await p.screenshot({ path: 'six-tuiles-acc-' + lang + '.png' });
      await p.click('.mp-tile[data-mp-tab="photos"]'); await p.waitForTimeout(400);
      console.log('Photos ouvre:', await p.$$eval('[data-mp-sec]:not([hidden])', e => e.map(x => x.getAttribute('data-mp-part')).join(',')));
      await p.click('.mp-tile[data-mp-tab="photos"]'); await p.waitForTimeout(400);
      console.log('2e appui ferme:', await p.$$eval('[data-mp-sec]:not([hidden])', e => e.length) === 0);
    }
    await p.close();
  }
  console.log('errs', JSON.stringify(errs)); await b.close(); if (errs.length) process.exit(1);
})();
