// Ma page en grille de boutons ; « Ajouter des amis » réapparaît après avoir masqué les suggestions.
const { chromium, BASE } = require('../lib');
(async () => {
  const lang = process.argv[2] || 'fr';
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 380, height: 1000 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + 'index.html#lang=' + lang); await p.waitForTimeout(2000);
  await p.click('#header-me'); await p.waitForTimeout(600);
  console.log('boutons:', await p.$$eval('.mp-tab', e => e.map(x => x.innerText).join(' / ')));
  const vis = () => p.$$eval('[data-mp-sec]', e => e.filter(x => !x.hidden).map(x => x.getAttribute('data-mp-sec')).join(','));
  console.log('visible au départ:', await vis(), '| sections:', await p.$$eval('[data-mp-sec]', e => e.map(x => x.getAttribute('data-mp-sec')).join(',')));
  for (const k of ['perfs', 'saisons', 'circuits', 'reseau', 'bientot']) { await p.click('[data-mp-tab="' + k + '"]'); console.log(k, '->', await vis(), '|', (await p.$eval('[data-mp-sec="' + k + '"]', e => e.innerText.replace(/\n+/g, ' ').slice(0, 60)))); }
  await p.screenshot({ path: 'ma-page-grille-' + lang + '.png' });
  // Suggestions masquées puis rouvertes
  await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(400); await p.click('.bottom-nav-btn:nth-child(3)'); await p.waitForTimeout(600);
  await p.evaluate(() => { localStorage.setItem('cdp-friend-sug-never', '1'); }); await p.click('.bottom-nav-btn:nth-child(1)'); await p.waitForTimeout(300); await p.click('.bottom-nav-btn:nth-child(3)'); await p.waitForTimeout(600);
  console.log('masqué -> bouton:', !!(await p.$('[data-action="fsug-reopen"]')));
  await p.click('[data-action="fsug-reopen"]'); await p.waitForTimeout(500);
  console.log('rouvert:', !!(await p.$('.card.fsug')));
  console.log('errs', JSON.stringify(errs)); await b.close(); if (errs.length) process.exit(1);
})();
