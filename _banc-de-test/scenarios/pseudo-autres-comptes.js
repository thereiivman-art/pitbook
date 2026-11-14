// Changement de pseudo : l'admin fusionne l'ancien pseudo « Patrick » (compte
// supprimé) dans le compte qui reste ; les fiches des autres pilotes et des
// teams qui citaient « Patrick » passent au nouveau pseudo.
const { chromium, BASE, openAdmin } = require('../lib');
(async () => {
  const lang = process.argv[2] || 'fr';
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 390, height: 1000 } }); p.on('pageerror', e => errs.push(e.message));
  p.on('dialog', d => d.accept());
  await p.goto(BASE + 'index.html#lang=' + lang + '&admin=1'); await p.waitForTimeout(1600);
  await p.evaluate(() => { const db = firebase.firestore();
    db.collection('users').doc('u4').set({ followedRiders: ['Patrick', 'Sam'] }, { merge: true });
    db.collection('users').doc('u5').set({ followedRiders: ['Patrick', 'Tom'], look: { favFriends: ['Patrick'] } }, { merge: true });
    db.collection('users').doc('u6').set({ referredBy: 'Patrick' }, { merge: true });
    db.collection('teams').doc('t2').set({ look: { favRiders: ['Patrick'] } }, { merge: true }); });
  await p.waitForTimeout(500);
  await openAdmin(p);
  await p.fill('#merge-from-text', 'Patrick').catch(() => {});
  await p.selectOption('#merge-into', 'Tom');
  await p.click('[data-action="admin-merge"]'); await p.waitForTimeout(1500);
  const r = await p.evaluate(() => { const U = window.__MOCK_DATA.users, T = window.__MOCK_DATA.teams;
    return { u4: U.u4.followedRiders, u5: U.u5.followedRiders, fav: U.u5.look.favFriends, ref: U.u6.referredBy, team: T.t2.look.favRiders }; });
  console.log(JSON.stringify(r));
  const ok = r.u4.join() === 'Tom,Sam' && r.u5.join() === 'Tom' && r.fav.join() === 'Tom' && r.ref === 'Tom' && r.team.join() === 'Tom';
  if (!ok) process.exitCode = 1;
  console.log('errs', JSON.stringify(errs)); if (errs.length) process.exitCode = 1;
  await b.close();
})();
