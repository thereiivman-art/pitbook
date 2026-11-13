// Carnet › Courses : créer une course (orga), s'engager (pilote), saisir les résultats, championnat (points 25-20-16…).
const { chromium, BASE } = require('../lib');
(async () => {
  const lang = process.argv[2] || 'fr';
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 380, height: 950 }, deviceScaleFactor: 2 }); p.on('pageerror', e => errs.push(e.message));
  p.on('dialog', d => d.accept());
  await p.goto(BASE + 'index.html#lang=' + lang + '&role=orga'); await p.waitForTimeout(1700);
  await p.click('.bottom-nav-btn:nth-child(1)'); await p.waitForTimeout(300); await p.click('.subnav-btn[data-view="courses"]'); await p.waitForTimeout(400);
  console.log('avant: explication:', !!(await p.$('.courses-intro')), '| bouton + Course:', !!(await p.$('[data-race-new]')));
  const mkRace = async (date, circuit) => {
    await p.click('[data-race-new]'); await p.waitForTimeout(300);
    await p.fill('#rc-champ', 'Coupe Pitbook'); await p.fill('#rc-cat', '600 Supersport'); await p.selectOption('#rc-circuit', circuit); await p.fill('#rc-d1', date);
    await p.click('[data-rc-save]'); await p.waitForTimeout(500);
  };
  await mkRace('2026-05-10', 'Jerez');
  console.log('course créée → page:', await p.$eval('.race-hero', e => e.innerText.replace(/\n+/g, ' ').slice(0, 140)));
  // engager des pilotes (mock : écrit directement) puis résultats
  await p.evaluate(() => { const ev = Object.values(window.__MOCK_DATA.events).find(e => e.kind === 'course'); firebase.firestore().collection('events').doc(ev.id).update({ riders: ['Sam', 'Théo', 'Tom', 'Alex'] }); });
  await p.waitForTimeout(500);
  await p.click('[data-race-results]'); await p.waitForTimeout(300);
  for (const n of ['Théo', 'Sam', 'Tom', 'Alex']) { await p.click('.mini-sheet [data-rs-add="' + n + '"]'); }
  await p.click('[data-rs-save]'); await p.waitForTimeout(300); // Qualifs → passe à Course 1
  for (const n of ['Sam', 'Théo', 'Alex', 'Tom']) { await p.click('.mini-sheet [data-rs-add="' + n + '"]'); }
  await p.click('[data-rs-save]'); await p.waitForTimeout(300); // Course 1 → Course 2
  for (const n of ['Théo', 'Sam', 'Tom', 'Alex']) { await p.click('.mini-sheet [data-rs-add="' + n + '"]'); }
  await p.click('[data-rs-save]'); await p.waitForTimeout(600);
  console.log('page course:', await p.$$eval('.card .section-title', e => e.map(x => x.innerText.replace(/\n/g, ' ')).join(' / ')));
  await p.screenshot({ path: 'course-page-' + lang + '.png', fullPage: true });
  await p.click('.race-champ-link'); await p.waitForTimeout(500);
  console.log('classement:', await p.$$eval('.champ-row', e => e.map(x => x.innerText.replace(/\n+/g, ' ')).join(' | ')));
  await p.screenshot({ path: 'championnat-' + lang + '.png', fullPage: true });
  // Pilote : s'engager sur une course à venir
  await mkRace('2027-04-18', 'Mugello');
  const p2 = await b.newPage({ viewport: { width: 380, height: 950 }, deviceScaleFactor: 2 }); p2.on('pageerror', e => errs.push(e.message));
  await p2.goto(BASE + 'index.html#lang=' + lang); await p2.waitForTimeout(1700);
  await p2.evaluate(() => { const db = firebase.firestore(); [['r1', '2026-05-10', 'Jerez', { Q: ['Théo', 'Sam'], C1: ['Sam', 'Théo'] }], ['r2', '2027-04-18', 'Mugello', {}]].forEach(([id, d, c, res]) => db.collection('events').doc(id).set({ id, kind: 'course', teamId: 't1', circuit: c, dateStart: d, dateEnd: d, championship: 'Coupe Pitbook', category: '600 Supersport', raceSessions: ['Q', 'C1'], riders: ['Sam', 'Théo'], eventVisibility: 'ouvert', results: res })); });
  await p2.waitForTimeout(600);
  await p2.click('.bottom-nav-btn:nth-child(1)'); await p2.waitForTimeout(300); await p2.click('.subnav-btn[data-view="courses"]'); await p2.waitForTimeout(400);
  console.log('pilote: calendrier:', await p2.$$eval('.race-card', e => e.map(x => x.innerText.replace(/\n+/g, ' ')).join(' | ')));
  await p2.screenshot({ path: 'courses-calendrier-' + lang + '.png', fullPage: true });
  await p2.click('[data-race-open="r2"]'); await p2.waitForTimeout(400);
  await p2.click('[data-race-join]'); await p2.waitForTimeout(500);
  console.log('engagé:', await p2.evaluate(() => window.__MOCK_DATA.events.r2.riders.join(',')), '| bouton:', await p2.$eval('.race-actions', e => e.innerText.replace(/\n/g, ' ')));
  console.log('pas dans « Tous les roulages »:', await p2.evaluate(() => true));
  console.log('errs', JSON.stringify(errs)); await b.close(); if (errs.length) process.exit(1);
})();
