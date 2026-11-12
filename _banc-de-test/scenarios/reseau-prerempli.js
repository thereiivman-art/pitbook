// Fiche : ajouter Instagram avec le pseudo seul, et « Enregistrer » garde le lien tapé.
const { chromium, BASE } = require('../lib');
(async () => {
  const lang = process.argv[2] || 'fr';
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 380, height: 900 }, deviceScaleFactor: 2 }); p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + 'index.html#lang=' + lang); await p.waitForTimeout(1800);
  await p.click('#header-me'); await p.waitForTimeout(500);
  await p.click('[data-action="look-edit"]'); await p.waitForTimeout(400);
  await p.fill('#look-ln-url', '@xavggmn');
  await p.click('[data-link-net="tiktok"]'); await p.waitForTimeout(200);
  console.log('pseudo gardé en changeant de réseau:', await p.$eval('#look-ln-url', e => e.value), '| préfixe:', await p.$eval('.link-prefix', e => e.innerText));
  await p.click('[data-link-net="instagram"]'); await p.waitForTimeout(200);
  await p.evaluate(() => document.querySelector('.look-add-link').scrollIntoView({ block: 'center' }));
  await p.screenshot({ path: 'reseau-prerempli-' + lang + '.png' });
  await p.click('[data-action="look-save"]'); await p.waitForTimeout(700);
  console.log('lien enregistré:', await p.evaluate(() => { const d = window.__MOCK_DATA; const u = Object.values((d && d.users) || {}).find(x => x && x.look && x.look.links && x.look.links.length); return u ? u.look.links.map(l => l.url).join(',') : 'aucun'; }));
  console.log('errs', JSON.stringify(errs)); await b.close(); if (errs.length) process.exit(1);
})();
