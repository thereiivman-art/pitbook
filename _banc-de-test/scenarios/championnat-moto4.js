// Championnat de France Moto4 2027 (6 manches FSBK) posé depuis l'admin,
// visible dans Carnet › Courses › Championnats ; teams à découvrir filtrés
// par Moto / Voiture.
const { chromium, BASE } = require('../lib');
(async () => {
  const lang = process.argv[2] || 'fr';
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 390, height: 900 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + 'index.html#lang=' + lang + '&admin=1'); await p.waitForTimeout(2500);
  const races = await p.evaluate(() => Object.values(window.__MOCK_DATA.events).filter(e => /^fsbk27-moto4-/.test(e.id)).map(e => e.circuit + ' ' + e.dateStart));
  console.log('manches :', races.join(' | '));
  if (races.length !== 6) process.exitCode = 1;
  await p.click('.bottom-nav-btn:nth-child(1)'); await p.waitForTimeout(400);
  await p.click('.subnav-btn[data-view="courses"]'); await p.waitForTimeout(400);
  await p.click('.pill-btn[data-pill="championnats"]'); await p.waitForTimeout(400);
  const champs = await p.$$eval('.champ-card', e => e.map(x => x.innerText.replace(/\n+/g, ' ')).join(' || '));
  console.log('championnats :', champs);
  if (!/Championnat de France · Moto4 2027/i.test(champs) || !/6 courses/i.test(champs)) process.exitCode = 1;
  await p.click('.champ-card'); await p.waitForTimeout(400);
  const detail = await p.$$eval('.race-card', e => e.length); console.log('courses dans le championnat :', detail);
  if (detail < 6) process.exitCode = 1;
  // Teams à découvrir : un team voiture n'apparaît qu'en mode Voiture.
  await p.evaluate(() => { const M = window.__MOCK_DATA; M.teams.tv = { id: 'tv', name: 'Team Voiture Test', createdBy: 'Zoé', memberCount: 3, visibility: 'all', discipline: 'auto' };
    firebase.firestore().collection('teams').doc('tv').set(M.teams.tv); });
  await p.waitForTimeout(400);
  await p.click('.subnav-btn[data-view="team"]'); await p.waitForTimeout(500);
  const disc = await p.$('.pill-btn[data-pill="discover"]'); if (disc) { await disc.click(); await p.waitForTimeout(500); }
  const txt = async () => p.evaluate(() => document.querySelector('main') ? document.querySelector('main').innerText : document.body.innerText);
  const moto = await txt(); const chips = await p.$$eval('[data-td-cat]', e => e.map(x => (x.classList.contains('on') ? '*' : '') + x.innerText).join(' / '));
  console.log('tri :', chips, '| team voiture en mode moto :', /Team Voiture Test/.test(moto));
  if (!chips || /Team Voiture Test/.test(moto)) process.exitCode = 1;
  await p.click('[data-td-cat="auto"]'); await p.waitForTimeout(500);
  const auto = await txt(); console.log('team voiture en mode voiture :', /Team Voiture Test/.test(auto));
  if (!/Team Voiture Test/.test(auto)) process.exitCode = 1;
  console.log('errs', JSON.stringify(errs)); await b.close(); if (errs.length) process.exit(1);
})();
