// Une seule fiche de gestion : l'onglet Infos remplace « Modifier » ; ajout d'un pilote par recherche.
const { chromium, BASE } = require('../lib');
(async () => {
  const lang = process.argv[2] || 'fr';
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 380, height: 1000 } }); p.on('pageerror', e => errs.push(e.message)); p.on('console', m => {  });
  await p.goto(BASE + 'index.html#lang=' + lang + '&admin=1&bcn=1'); await p.waitForTimeout(2000);
  await p.click('.bottom-nav-btn:nth-child(1)'); await p.waitForTimeout(400);
  await p.click('[data-outing-event="eBcn"]'); await p.waitForTimeout(500);
  await p.click('[data-action="manage-from-outing"]'); await p.waitForTimeout(500);
  console.log('onglets:', await p.$$eval('.pill-btn', e => e.map(x => x.innerText).join(' / ')), '| bouton Modifier:', !!(await p.$('[data-action="team-event-edit"]')));
  console.log('recherche pilote (input):', !!(await p.$('input[data-team-event-add-rider-select]')), '| select:', !!(await p.$('select[data-team-event-add-rider-select]')), '| suggestions:', await p.$$eval('.team-event-add-rider-form datalist option', e => e.length));
  console.log('pill infos présent:', await p.$$eval('[data-pill="infos"]', e => e.length));
  await p.click('[data-pill-group="evmanage"][data-pill="infos"]'); await p.waitForTimeout(400);
  console.log('actif:', await p.$eval('.pill-btn.active', e => e.innerText), '| cartes:', await p.$$eval('.card h2', e => e.map(x => x.innerText).join(' / ')));
  console.log('formulaire dans Infos:', !!(await p.$('#event-form')));
  await p.fill('#ev-note', 'Note modifiée'); await p.click('#event-form button[type="submit"]'); await p.waitForTimeout(600);
  console.log('après enregistrement: onglet', await p.$eval('.pill-btn.active', e => e.innerText), '| note:', await p.evaluate(() => window.__MOCK_DATA.events.eBcn.note));
  await p.click('[data-pill-group="evmanage"][data-pill="infos"]'); await p.waitForTimeout(300); await p.screenshot({ path: 'fiche-unique-' + lang + '.png' });
  const first = await p.$eval('.team-event-add-rider-form datalist option', e => e.value).catch(() => '');
  if (first) { await p.fill('[data-team-event-add-rider-select]', first.slice(0, 2)); await p.click('.team-event-add-rider-form button'); await p.waitForTimeout(1500); console.log('ajout par recherche partielle:', (await p.$$eval('.toast', e => e.map(x => x.innerText))).pop() || 'ok', '| riders:', await p.evaluate(() => window.__MOCK_DATA.events.eBcn.riders.join(','))); }
  console.log('errs', JSON.stringify(errs)); await b.close(); if (errs.length) process.exit(1);
})();
