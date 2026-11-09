// Retour arrière après l'icône (i) d'un roulage : on revient au roulage, puis à la liste, pas à l'accueil.
const { chromium, BASE } = require('../lib');
(async () => {
  const lang = process.argv[2] || 'fr';
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 380, height: 900 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + 'index.html#lang=' + lang + '&bcn=1'); await p.waitForTimeout(1800);
  const where = () => p.evaluate(() => (document.querySelector('.outing-title') ? 'roulage ' + document.querySelector('.outing-title').innerText.split('\n')[0] : '') || (document.querySelector('.bottom-nav-btn.active') || {}).innerText + ' / ' + ((document.querySelector('.subnav-btn.active') || {}).innerText || ''));
  await p.click('.bottom-nav-btn:nth-child(1)'); await p.waitForTimeout(400);
  console.log('départ:', await where());
  await p.click('[data-outing-event="eBcn"]'); await p.waitForTimeout(500);
  console.log('roulage:', await where());
  await p.click('.outing-tabs [data-open-circuit]'); await p.waitForTimeout(500);
  console.log('après (i):', await where(), '| pile:', await p.evaluate(() => history.length));
  for (let i = 1; i <= 3; i++) { await p.goBack().catch(() => {}); await p.waitForTimeout(500); console.log('retour ' + i + ':', await where()); }
  console.log('errs', JSON.stringify(errs)); await b.close();
  if (errs.length) process.exit(1);
})();
