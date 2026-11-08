// Lot du 9 nov : republications groupées, partage unique (message + autres réseaux), nouveau message multi, roulage simplifié, barre qui disparaît, Mon compte PC.
const { chromium, BASE } = require('../lib');
(async () => {
  const lang = process.argv[2] || 'fr';
  const b = await chromium.launch(); const errs = [];
  let p = await b.newPage({ viewport: { width: 380, height: 800 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + 'index.html#lang=' + lang + '&reposts=1'); await p.waitForTimeout(1800);
  await p.click('.bottom-nav-btn[data-nav-tab="communaute"]'); await p.waitForTimeout(500);
  console.log('republications:', await p.$$eval('.repost-label', e => e.map(x => x.innerText).join(' | ')), '| entrées:', await p.$$eval('.repost-box', e => e.length));
  console.log('envoyer séparé:', await p.$$eval('[data-action="dm-share-post"]', e => e.length));
  await p.screenshot({ path: 'lot9-fil-' + lang + '.png' });
  await p.click('[data-action="share-post"]'); await p.waitForTimeout(300);
  console.log('partage:', await p.$$eval('.share-opt span', e => e.map(x => x.innerText).join(' / ')));
  await p.click('[data-share-to="dm"]'); await p.waitForTimeout(300);
  console.log('message depuis partage:', !!(await p.$('#mini-sheet')));
  await p.click('#mini-sheet [data-mini-close]').catch(() => {}); await p.waitForTimeout(200);
  await p.mouse.wheel(0, 600); await p.waitForTimeout(500);
  console.log('barre cachée en descendant:', await p.evaluate(() => document.documentElement.classList.contains('nav-mini')));
  await p.mouse.wheel(0, -300); await p.waitForTimeout(500);
  console.log('barre revenue en remontant:', !(await p.evaluate(() => document.documentElement.classList.contains('nav-mini'))));
  await p.click('#messages-toggle'); await p.waitForTimeout(400);
  console.log('boutons messagerie:', await p.$$eval('.dm-top button', e => e.map(x => x.innerText).join(' / ')));
  await p.click('[data-action="dm-new"]'); await p.waitForTimeout(300);
  const picks = await p.$$('[data-dm-pick]:not([data-dm-pick^="team:"])');
  if (picks.length > 1) {
    await picks[0].click(); await picks[1].click(); await p.waitForTimeout(200);
    console.log('bouton:', await p.$eval('#dm-pick-go', e => e.innerText));
    await p.click('#dm-pick-go'); await p.waitForTimeout(300);
    console.log('éditeur de groupe:', await p.$eval('.mini-sheet .section-title', e => e.innerText), '| cochés:', await p.$$eval('[data-grp-pick]:checked', e => e.length));
  }
  await p.click('#mini-sheet [data-mini-close]').catch(() => {}); await p.waitForTimeout(200);
  await p.click('.bottom-nav-btn:nth-child(1)'); await p.waitForTimeout(400);
  await p.click('[data-open-outing]').catch(() => {}); await p.waitForTimeout(500);
  console.log('onglets du roulage:', await p.$$eval('[data-pill-group="outing"]', e => e.map(x => x.innerText).join(' / ')), '| titre cliquable:', !!(await p.$('.outing-title-link')));
  await p.screenshot({ path: 'lot9-roulage-' + lang + '.png' });
  await p.close();
  p = await b.newPage({ viewport: { width: 1300, height: 860 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + 'index.html#lang=' + lang); await p.waitForTimeout(1600);
  console.log('PC Mon compte visible:', await p.$eval('#settings-side', e => !!e.offsetParent));
  await p.click('#settings-side'); await p.waitForTimeout(400);
  console.log('réglages sans Plus:', !!(await p.$('.settings-ig')), !(await p.$('details.set-more')));
  console.log('errs', JSON.stringify(errs)); await b.close();
  if (errs.length) process.exit(1);
})();
