// Pneus et comptes : la fusion transfère la réserve, les pneus dépensés et
// les cosmétiques achetés ; l'admin peut ajouter des pneus à un compte ; le
// pilote voit son nouveau solde sans que son appli l'écrase.
const { chromium, BASE, openAdmin } = require('../lib');
(async () => {
  const lang = process.argv[2] || 'fr';
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 390, height: 1000 } }); p.on('pageerror', e => errs.push(e.message));
  p.on('dialog', d => d.accept());
  await p.goto(BASE + 'index.html#lang=' + lang + '&admin=1'); await p.waitForTimeout(1600);
  await p.evaluate(() => { const db = firebase.firestore();
    db.collection('users').doc('u2').set({ pneus: { bank: 300, spent: 100, owned: ['frame:or'] } }, { merge: true });
    db.collection('users').doc('u3').set({ pneus: { bank: 50, spent: 0, owned: [] } }, { merge: true }); });
  await p.waitForTimeout(500);
  await openAdmin(p);
  await p.selectOption('#merge-from', 'Sam').catch(async () => { await p.fill('#merge-from-text', 'Sam'); });
  await p.selectOption('#merge-into', 'Tom');
  await p.click('[data-action="admin-merge"]'); await p.waitForTimeout(1200);
  const tom = await p.evaluate(() => JSON.stringify((window.__MOCK_DATA.users.u3 || {}).pneus));
  console.log('Tom après fusion:', tom);
  if (!/"bank":350/.test(tom) || !/"spent":100/.test(tom) || !/frame:or/.test(tom)) process.exitCode = 1;
  // Bouton Pneus de la gestion des comptes : +500 à Luca.
  await p.click('#account-manager-toggle'); await p.waitForTimeout(800);
  await p.click('[data-action="admin-pneus"][data-uid="u9"]'); await p.waitForTimeout(600);
  console.log('feuille:', await p.$eval('.mini-sheet', e => e.innerText.replace(/\n+/g, ' | ')).catch(() => 'absente'));
  await p.fill('#adm-pneus-n', '500'); await p.click('#adm-pneus-go'); await p.waitForTimeout(600);
  const luca = await p.evaluate(() => JSON.stringify((window.__MOCK_DATA.users.u9 || {}).pneus));
  console.log('Luca:', luca); if (!/"bank":500/.test(luca)) process.exitCode = 1;
  // Côté pilote : l'admin lui donne 1000 pneus, son compteur suit.
  const q = await b.newPage({ viewport: { width: 390, height: 900 } }); q.on('pageerror', e => errs.push(e.message));
  await q.goto(BASE + 'index.html#lang=' + lang); await q.waitForTimeout(1600);
  const before = await q.$eval('.pneus-chip b', e => +e.innerText);
  await q.evaluate(() => { const db = firebase.firestore(), u = window.__MOCK_DATA.users.u1, pn = Object.assign({}, u.pneus || {});
    pn.bank = (pn.bank || 0) + 1000; pn.adminAt = Date.now(); db.collection('users').doc('u1').update({ pneus: pn }); });
  await q.waitForTimeout(800);
  await q.click('.bottom-nav-btn:nth-child(3)'); await q.waitForTimeout(600);
  const after = await q.$eval('.pneus-chip b', e => +e.innerText).catch(() => -1);
  console.log('compteur pilote:', before, '→', after); if (after !== before + 1000) process.exitCode = 1;
  await q.waitForTimeout(1600);
  const kept = await q.evaluate(() => (window.__MOCK_DATA.users.u1.pneus || {}).bank);
  console.log('réserve gardée sur le serveur après synchro:', kept);
  console.log('errs', JSON.stringify(errs)); if (errs.length) process.exitCode = 1;
  await b.close();
})();
