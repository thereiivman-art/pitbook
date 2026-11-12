// Admin : fusionner un ancien nom sans compte (« Marc ») dans un compte (« Marc #417 »).
const { chromium, BASE } = require('../lib');
(async () => {
  const lang = process.argv[2] || 'fr';
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 380, height: 1000 } }); p.on('pageerror', e => errs.push(e.message));
  p.on('dialog', d => { console.log('confirmation:', d.message().slice(0, 110)); d.accept(); });
  await p.goto(BASE + 'index.html#lang=' + lang + '&admin=1'); await p.waitForTimeout(1800);
  await p.evaluate(() => { const M = window.__MOCK_DATA;
    M.users.u417 = { name: 'Marc #417', uid: 'u417', role: 'pilote', email: 'x@y.z', bikeNumber: '417' };
    M.sessions.m1 = { id: 'm1', rider: 'Marc', date: '2026-05-02', circuit: 'Jerez', laps: [104.2, 103.1] };
    M.sessions.m2 = { id: 'm2', rider: 'Marc', date: '2026-06-10', circuit: 'Mugello', laps: [120.4] };
    M.events.eM = { id: 'eM', circuit: 'Jerez', dateStart: '2026-05-02', dateEnd: '2026-05-02', riders: ['Marc', 'Alex'], riderGroups: { Marc: { '2026-05-02': { am: 'B', pm: 'B' } } } };
    firebase.firestore().collection('settings').doc('zz').set({ a: 9 }); });
  await p.waitForTimeout(1500);
  await p.click('#settings-side'); await p.waitForTimeout(400); await p.click('[data-settings-go="@admin"]'); await p.waitForTimeout(1200);
  console.log('carte fusion:', !!(await p.$('#merge-from')), '| comptes proposés:', await p.$$eval('#merge-into option', e => e.map(x => x.textContent).filter(Boolean).slice(0, 6).join(' ; ')));
  await p.selectOption('#merge-from', 'Marc'); await p.selectOption('#merge-into', 'Marc #417');
  await p.click('[data-action="admin-merge"]'); await p.waitForTimeout(400);
  if (!(await p.evaluate(() => Object.values(window.__MOCK_DATA.sessions).some(s => s.rider === 'Marc #417')))) { await p.waitForTimeout(1500); await p.click('[data-action="admin-merge"]'); }
  await p.waitForTimeout(900);
  console.log('après:', await p.evaluate(() => { const M = window.__MOCK_DATA; return JSON.stringify({ chronosMarc: Object.values(M.sessions).filter(s => s.rider === 'Marc').length, chronos417: Object.values(M.sessions).filter(s => s.rider === 'Marc #417').length, roulage: M.events.eM.riders, groupes: Object.keys(M.events.eM.riderGroups) }); }));
  console.log('errs', JSON.stringify(errs)); await b.close(); if (errs.length) process.exit(1);
})();
