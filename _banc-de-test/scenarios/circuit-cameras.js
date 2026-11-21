// Fiche d'un circuit › Infos : la règle sur la caméra embarquée (Barcelone,
// Misano, Mugello, Jerez), avec ses sources.
const { chromium, BASE } = require('../lib');
(async () => {
  const lang = process.argv[2] || 'fr';
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 390, height: 900 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + 'index.html#lang=' + lang); await p.waitForTimeout(1600);
  await p.click('.bottom-nav-btn:nth-child(1)'); await p.waitForTimeout(400);
  await p.click('.subnav-btn[data-view="circuit"]'); await p.waitForTimeout(400);
  for (const c of ['Barcelone', 'Misano', 'Mugello', 'Jerez']) {
    await p.fill('#circuit-find', c); await p.press('#circuit-find', 'Enter'); await p.waitForTimeout(500);
    await p.click('[data-pill-group="circuit"][data-pill="infos"]'); await p.waitForTimeout(400);
    const t = await p.$eval('.circuit-rules', e => e.innerText.replace(/\n+/g, ' | ')).catch(() => 'absent');
    console.log(c + ':', t.slice(0, 220));
    if (!/Caméra embarquée|On-board camera/.test(t)) process.exitCode = 1;
  }
  console.log('errs', JSON.stringify(errs)); await b.close(); if (errs.length) process.exit(1);
})();
