// Circuit créé par un pilote : son créateur peut le supprimer, les autres le signaler, l'admin le supprimer (avec message).
const { chromium, BASE } = require('../lib');
(async () => {
  const lang = process.argv[2] || 'fr';
  const b = await chromium.launch(); const errs = [];
  const open = async (p, name) => {
    await p.click('.bottom-nav-btn:nth-child(1)'); await p.waitForTimeout(300); await p.click('.subnav-btn[data-view="circuit"]'); await p.waitForTimeout(400);
    await p.fill('#circuit-find', name); await p.press('#circuit-find', 'Enter'); await p.waitForTimeout(500);
    await p.click('[data-pill-group="circuit"][data-pill="infos"]'); await p.waitForTimeout(400);
  };
  // 1. Mon circuit : bouton Supprimer
  const p = await b.newPage({ viewport: { width: 380, height: 950 }, deviceScaleFactor: 2 }); p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept());
  await p.goto(BASE + 'index.html#lang=' + lang); await p.waitForTimeout(1700);
  await p.evaluate(() => { const uid = firebase.auth().currentUser.uid, db = firebase.firestore();
    db.collection('circuits').doc(encodeURIComponent('Circuit du Pré')).set({ name: 'Circuit du Pré', createdBy: 'Alex', createdByUid: uid });
    db.collection('circuits').doc(encodeURIComponent('Piste de Sam')).set({ name: 'Piste de Sam', createdBy: 'Sam', createdByUid: 'uidSam' }); });
  await p.waitForTimeout(600);
  await open(p, 'Circuit du Pré');
  console.log('mon circuit:', await p.$eval('.circuit-mod', e => e.innerText.replace(/\n+/g, ' ')).catch(() => 'absent'));
  await p.screenshot({ path: 'circuit-mod-' + lang + '.png' });
  await p.click('[data-circuit-del]'); await p.waitForTimeout(600);
  console.log('supprimé:', await p.evaluate(() => !window.__MOCK_DATA.circuits[encodeURIComponent('Circuit du Pré')]));
  // 2. Circuit d'un autre : Signaler
  await p.evaluate(() => window.scrollTo(0, 0)); await open(p, 'Piste de Sam');
  console.log('circuit de Sam:', await p.$eval('.circuit-mod', e => e.innerText.replace(/\n+/g, ' ')).catch(() => 'absent'));
  await p.click('[data-circuit-report]'); await p.waitForTimeout(300); await p.click('.mini-sheet [data-reason="doublon"]'); await p.click('.mini-sheet [data-report-send]'); await p.waitForTimeout(500);
  console.log('signalement:', await p.evaluate(() => JSON.stringify(Object.values(window.__MOCK_DATA.reports || {}).map(r => [r.kind, r.postId, r.reason]))));
  // 3. Admin : supprimer avec message
  const a = await b.newPage({ viewport: { width: 380, height: 950 }, deviceScaleFactor: 2 }); a.on('pageerror', e => errs.push(e.message));
  await a.goto(BASE + 'index.html#lang=' + lang + '&admin=1'); await a.waitForTimeout(1700);
  await a.evaluate(() => { const db = firebase.firestore(); db.collection('users').doc('uidSam').set({ name: 'Sam', uid: 'uidSam', role: 'pilote' }, { merge: true });
    db.collection('circuits').doc(encodeURIComponent('Piste de Sam')).set({ name: 'Piste de Sam', createdBy: 'Sam', createdByUid: 'uidSam' });
    db.collection('reports').doc('rc1').set({ kind: 'circuit', postId: 'Piste de Sam', postAuthor: 'Sam', postText: 'Piste de Sam', reason: 'doublon', note: '', reporter: 'Alex', createdAt: Date.now() }); });
  await a.waitForTimeout(600);
  await open(a, 'Piste de Sam');
  console.log('admin:', await a.$eval('.circuit-mod', e => e.innerText.replace(/\n+/g, ' ')).catch(() => 'absent'));
  await a.click('[data-circuit-mod]'); await a.waitForTimeout(300);
  console.log('message:', (await a.$eval('#mod-msg', e => e.value).catch(() => 'pas de message')).slice(0, 100));
  await a.click('[data-mod-confirm]'); await a.waitForTimeout(700);
  console.log('circuit supprimé:', await a.evaluate(() => !window.__MOCK_DATA.circuits[encodeURIComponent('Piste de Sam')]), '| signalement traité:', await a.evaluate(() => !(window.__MOCK_DATA.reports || {}).rc1));
  console.log('errs', JSON.stringify(errs)); await b.close(); if (errs.length) process.exit(1);
})();
