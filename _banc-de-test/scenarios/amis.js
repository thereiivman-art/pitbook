// Amis = abonnés l'un à l'autre. Ma liste d'amis : Ma page › abonnés › Amis.
// Sur la page d'un ami, pas de liste d'amis (liste privée).
const { chromium, BASE } = require('../lib');
(async () => {
  const lang = process.argv[2] || 'fr';
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 380, height: 900 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + 'index.html#lang=' + lang); await p.waitForTimeout(1600);
  await p.click('#header-me'); await p.waitForTimeout(500);
  await p.click('.social-count[data-list="abonnes"]'); await p.waitForTimeout(400);
  await p.click('[data-cpill-group="suivislist"][data-cpill="liste"]'); await p.waitForTimeout(300);
  const amis = await p.$$eval('[data-cpill-section="suivislist:liste"] [data-open-person]', e => e.map(x => x.getAttribute('data-open-person')));
  console.log('mes amis :', amis.join(', '));
  await p.screenshot({ path: 'amis-alex-' + lang + '.png' });
  await p.click('[data-cpill-section="suivislist:liste"] [data-open-person="Sam"]'); await p.waitForTimeout(1200);
  const row = await p.$('.ph-friends-row');
  console.log('page de Sam : liste d\'amis', row ? 'visible (problème)' : 'absente', '| compteurs:', await p.$eval('.social-counts', e => e.innerText.replace(/\n/g, ' ')).catch(() => '?'));
  await p.screenshot({ path: 'amis-sam-' + lang + '.png' });
  if (!amis.includes('Sam') || row) process.exitCode = 1;
  console.log('errs', JSON.stringify(errs)); if (errs.length) process.exitCode = 1; await b.close();
})();
