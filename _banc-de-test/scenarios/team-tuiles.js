// Fiche d'un team en tuiles, comme la page d'un pilote : responsable, puis visiteur.
const { chromium, BASE } = require('../lib');
(async () => {
  const lang = process.argv[2] || 'fr';
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 380, height: 900 }, deviceScaleFactor: 2 }); p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + 'index.html#lang=' + lang + '&role=orga'); await p.waitForTimeout(1600);
  await p.click('.bottom-nav-btn:nth-child(1)'); await p.waitForTimeout(300);
  console.log('Carnet orga:', await p.$$eval('.main-subnav .subnav-btn', e => e.map(x => x.innerText).join(' / ')));
  await p.click('.subnav-btn[data-view="team"]'); await p.waitForTimeout(400);
  await p.getByText('Team Piste').first().click(); await p.waitForTimeout(800);
  console.log('tuiles responsable:', await p.$$eval('.mp-tile .mp-k', e => e.map(x => x.innerText.replace('›', '').trim()).join(' / ')), '| pastilles:', await p.$$eval('[data-pill-group="team"]', e => e.length), '| Social dessous:', !!(await p.$('.mp-posts-all')));
  await p.evaluate(() => document.querySelector('.mp-bento').scrollIntoView({ block: 'start' })); await p.evaluate(() => window.scrollBy(0, -90));
  await p.screenshot({ path: 'team-tuiles-' + lang + '.png' });
  for (const t of ['bientot', 'membres', 'audience', 'saisons']) {
    const el = await p.$('.mp-tile[data-mp-tab="' + t + '"]'); if (!el) { console.log(t, 'absente'); continue; }
    await el.click(); await p.waitForTimeout(350);
    console.log(t + ' ouvre:', await p.$$eval('[data-mp-sec]:not([hidden])', e => e.map(x => x.getAttribute('data-mp-sec') + '(' + x.innerText.length + ')').join(',')));
  }
  console.log('errs', JSON.stringify(errs)); await b.close(); if (errs.length) process.exit(1);
})();
