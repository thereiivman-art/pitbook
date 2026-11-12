// Option admin « Masquer Pitbook+ » ; Mon garage ; dupliquer un roulage et exporter les inscrits.
const { chromium, BASE } = require('../lib');
(async () => {
  const lang = process.argv[2] || 'fr';
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 380, height: 1000 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + 'index.html#lang=' + lang + '&admin=1&bcn=1'); await p.waitForTimeout(2000);
  await p.click('#header-me'); await p.waitForTimeout(500);
  console.log('onglets Profil:', await p.$$eval('.subnav-btn', e => e.map(x => x.innerText).join(' / ')));
  await p.click('#settings-side'); await p.waitForTimeout(500);
  console.log('avant: ligne Pitbook+', !!(await p.$('[data-settings-go="@plus"]')));
  await p.click('[data-settings-go="@admin"]'); await p.waitForTimeout(500);
  const cb = await p.$('[data-feature-toggle="hidePlus"]'); console.log('case Masquer Pitbook+:', !!cb);
  await cb.check(); await p.waitForTimeout(800);
  console.log('mock:', await p.evaluate(() => JSON.stringify((window.__MOCK_DATA.settings || {}).featureVisibility || null)));
  await p.click('.settings-back, .back-chevron').catch(() => {}); await p.waitForTimeout(500);
  console.log('après: ligne Pitbook+', !!(await p.$('[data-settings-go="@plus"]')));
  // Dupliquer + CSV
  await p.goto(BASE + 'index.html#lang=' + lang + '&admin=1&bcn=1'); await p.waitForTimeout(2000);
  await p.click('.bottom-nav-btn:nth-child(1)'); await p.waitForTimeout(400);
  await p.click('[data-outing-event="eBcn"]'); await p.waitForTimeout(500);
  await p.click('[data-action="manage-from-outing"]'); await p.waitForTimeout(500);
  console.log('CSV:', !!(await p.$('[data-action="event-riders-csv"]')));
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('[data-action="event-riders-csv"]')]);
  console.log('fichier:', dl.suggestedFilename());
  await p.evaluate(() => document.querySelector('[data-pill-group="evmanage"][data-pill="infos"]').scrollIntoView({ inline: 'center' })); await p.click('[data-pill-group="evmanage"][data-pill="infos"]'); await p.waitForTimeout(400);
  await p.click('[data-action="event-duplicate"]'); await p.waitForTimeout(700);
  console.log('copies:', await p.evaluate(() => Object.values(window.__MOCK_DATA.events).filter(e => e.circuit === 'Barcelone' || /Barcelon/i.test(e.circuit)).map(e => e.dateStart).join(', ')));
  console.log('errs', JSON.stringify(errs)); await b.close(); if (errs.length) process.exit(1);
})();
