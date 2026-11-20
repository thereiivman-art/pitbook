// Roulage organisé par deux teams (Barcelone : Rehm et Mototeam95) :
// le cadre du jour dans Chrono affiche les deux organisateurs, le team par
// lequel je suis inscrit en premier ; la fiche du roulage aussi.
const { chromium, BASE } = require('../lib');
(async () => {
  const lang = process.argv[2] || 'fr';
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 390, height: 900 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + 'index.html#lang=' + lang + '&jourj=1'); await p.waitForTimeout(2200);
  const orgs = () => p.$$eval('.chrono-orgs .chrono-org strong', l => l.map(e => e.innerText.trim())).catch(() => []);
  const before = await orgs(); console.log('avant:', before.join(' · '));
  // Un second team publie le même roulage (même circuit, même jour), Alex y est inscrit.
  await p.evaluate(() => {
    const db = firebase.firestore(), ev = window.__MOCK_DATA.events.e9;
    db.collection('teams').doc('rehm-t').set({ id: 'rehm-t', name: 'Rehm Race Days', visibility: 'all' });
    db.collection('teams').doc('co-team').set({ id: 'co-team', name: 'Co Team Racing', visibility: 'all' });
    db.collection('events').doc('e9').set({ teamId: 'rehm-t' }, { merge: true });
    db.collection('events').doc('co-ev').set({ id: 'co-ev', teamId: 'co-team', circuit: ev.circuit, dateStart: ev.dateStart, dateEnd: ev.dateEnd, riders: ['Alex'] });
  });
  await p.waitForTimeout(1500);
  const after = await orgs(); console.log('après:', after.join(' · '));
  if (after.join('|') !== 'Co Team Racing|Rehm Race Days') process.exitCode = 1;
  console.log('libellé:', await p.$eval('.chrono-orgs-label', e => e.innerText).catch(() => 'absent'));
  await p.screenshot({ path: 'co-organisateurs-' + lang + '.png' });
  console.log('errs', JSON.stringify(errs)); await b.close(); if (errs.length) process.exit(1);
})();
