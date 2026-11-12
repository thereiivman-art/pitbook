// Ma page en tuiles vivantes (option B), et la fiche d'un autre.
const { chromium, BASE } = require('../lib');
(async () => {
  const lang = process.argv[2] || 'fr';
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 380, height: 900 }, deviceScaleFactor: 2 }); p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + 'index.html#lang=' + lang + '&look=1'); await p.waitForTimeout(2000);
  await p.click('#header-me'); await p.waitForTimeout(600);
  console.log('tuiles:', await p.$$eval('.mp-tile', e => e.map(x => x.innerText.replace(/\n+/g, ' / ')).join(' || ')));
  await p.evaluate(() => document.querySelector('.mp-bento').scrollIntoView({ block: 'start' })); await p.evaluate(() => window.scrollBy(0, -80));
  await p.screenshot({ path: 'tuiles-' + lang + '.png' });
  await p.click('.mp-tile[data-mp-scroll="trophees"]'); await p.waitForTimeout(500);
  console.log('Trophées ouvre:', await p.evaluate(() => [...document.querySelectorAll('[data-mp-sec]:not([hidden])')].map(x => x.getAttribute('data-mp-part')).join(',')));
  await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(300); await p.click('.bottom-nav-btn:nth-child(3)'); await p.waitForTimeout(600); await p.click('[data-person-link="Sam"]').catch(() => {}); await p.waitForTimeout(700);
  console.log('Sam:', await p.$$eval('.mp-tile', e => e.map(x => x.innerText.replace(/\n+/g, ' / ')).join(' || ')));
  console.log('errs', JSON.stringify(errs)); await b.close(); if (errs.length) process.exit(1);
})();
