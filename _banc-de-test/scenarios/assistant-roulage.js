// Option C : assistant « Nouveau roulage », teams amateurs gérés par leur leader, découverte PRO d'abord.
const { chromium, BASE } = require('../lib');
(async () => {
  const lang = process.argv[2] || 'fr';
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 380, height: 1000 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + 'index.html#lang=' + lang); await p.waitForTimeout(2000);
  await p.click('.bottom-nav-btn:nth-child(1)'); await p.waitForTimeout(300);
  await p.click('.subnav-btn[data-view="team"]'); await p.waitForTimeout(400);
  await p.getByText('Team Piste').first().click(); await p.waitForTimeout(600);
  console.log('pilote leader d\'un team amateur: onglet Roulages', !!(await p.$('.pill-btn[data-pill="roulages"]')));
  await p.click('.pill-btn[data-pill="roulages"]').catch(() => {}); await p.waitForTimeout(400);
  await p.click('[data-action="team-event-add"]'); await p.waitForTimeout(400);
  console.log('assistant, étape 0:', await p.$eval('.mini-sheet', e => e.innerText.replace(/\n+/g, ' | ').slice(0, 120)));
  await p.click('[data-wz-go="1"]'); await p.waitForTimeout(200);
  await p.selectOption('#wz-circuit', { index: 3 }); await p.fill('#wz-start', '2027-06-05'); await p.fill('#wz-end', '2027-06-06');
  await p.click('[data-wz-go="2"]'); await p.waitForTimeout(200);
  await p.fill('#wz-price', '640'); await p.fill('#wz-url', 'https://example.com/resa');
  console.log('visibilité proposée (team amateur):', !!(await p.$('#wz-vis')));
  await p.click('[data-wz-create]'); await p.waitForTimeout(800);
  console.log('créé:', await p.evaluate(() => JSON.stringify(Object.values(window.__MOCK_DATA.events).filter(e => e.dateStart === '2027-06-05').map(e => [e.circuit, e.dateEnd, e.note, e.bookingUrl, e.teamId]))), '| onglet actif:', await p.$eval('.pill-btn.active', e => e.innerText));
  // Découverte des teams : PRO d'abord
  await p.goto(BASE + 'index.html#lang=' + lang); await p.waitForTimeout(1500);
  await p.evaluate(() => { const T = window.__MOCK_DATA.teams; T.tPro = { id: 'tPro', name: 'Zeta Pro', teamPro: true, visibility: 'all', createdBy: 'X', memberCount: 1 }; T.tAma = { id: 'tAma', name: 'Alpha Amateur', teamPro: false, visibility: 'all', createdBy: 'X', memberCount: 1 }; T.tClosed = { id: 'tClosed', name: 'Prive', teamPro: false, visibility: 'members', createdBy: 'X', memberCount: 1 }; firebase.firestore().collection('settings').doc('zz').set({ a: 3 }); });
  await p.waitForTimeout(1500);
  await p.click('.bottom-nav-btn:nth-child(1)'); await p.waitForTimeout(300); await p.click('.subnav-btn[data-view="team"]'); await p.waitForTimeout(500);
  await p.evaluate(() => { const b = document.querySelector('.pill-btn[data-pill="decouvrir"], .pill-btn[data-pill="discover"]'); if (b) b.click(); }); await p.waitForTimeout(500);
  console.log('découverte:', await p.$$eval('.team-section-title, .team-tile-grid .team-tile-name, .team-tile-grid strong', e => e.map(x => x.innerText.trim()).join(' / ')));
  console.log('errs', JSON.stringify(errs)); await b.close(); if (errs.length) process.exit(1);
})();
