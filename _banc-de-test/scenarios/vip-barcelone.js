// Roulage VIP : badge, horaires jour par jour de Barcelone (Rehm via Mototeam95), bons plans voyage, Jerez de janvier VIP.
const { chromium, BASE } = require('../lib');
(async () => {
  const lang = process.argv[2] || 'fr';
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 380, height: 900 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + 'index.html#lang=' + lang + '&admin=1&bcn=1'); await p.waitForTimeout(2200);
  console.log('écrit en base:', await p.evaluate(() => { const e = window.__MOCK_DATA.events; return [e.eBcn.vip, !!e.eBcn.travelUrl, Object.keys(e.eBcn.horairesByDate || {}).join('+'), e.eJer.vip, e.e1.vip || false].join(' | '); }));
  await p.click('.bottom-nav-btn:nth-child(1)'); await p.waitForTimeout(400);
  console.log('badges dans Roulages:', await p.$$eval('.vip-badge', e => e.length));
  await p.click('[data-outing-event="eBcn"]'); await p.waitForTimeout(500);
  console.log('titre:', await p.$eval('.outing-title', e => e.innerText.replace(/\n/g, ' ')));
  await p.click('[data-pill-group="outing"][data-pill="horaires"]'); await p.waitForTimeout(300);
  const h1 = await p.$eval('#root', e => e.innerText.includes('11h40 – 12h00') || e.innerText.includes('11h40'));
  console.log('horaires J1 (11h40):', h1, '| note:', await p.$eval('.schedule-note', e => e.innerText.slice(0, 60)).catch(() => 'absente'));
  await p.screenshot({ path: 'vip-horaires-' + lang + '.png', fullPage: true });
  await p.click('[data-pill-group="outing"][data-pill="voyage"]'); await p.waitForTimeout(300);
  console.log('bons plans:', await p.$eval('.travel-tips-btn', e => e.innerText).catch(() => 'absent'));
  console.log('errs', JSON.stringify(errs)); await b.close();
  if (errs.length) process.exit(1);
})();
