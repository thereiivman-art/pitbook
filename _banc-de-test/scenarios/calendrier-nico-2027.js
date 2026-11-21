// Calendrier 2027 de Nico posé depuis le compte admin : inscrit aux roulages
// Mototeam95 existants (Le Mans 15 mars), roulages perso pour le reste,
// rien de doublé au passage suivant.
const { chromium, BASE } = require('../lib');
(async () => {
  const lang = process.argv[2] || 'fr';
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 390, height: 900 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + 'index.html#lang=' + lang + '&admin=1'); await p.waitForTimeout(1200);
  await p.evaluate(() => { const db = firebase.firestore();
    db.collection('users').doc('u-nico').set({ name: 'Nico', role: 'pilote' });
    db.collection('events').doc('mt95-lemans-27').set({ id: 'mt95-lemans-27', teamId: 'mtis6p71tnm01w', circuit: 'Le Mans', dateStart: '2027-03-15', dateEnd: '2027-03-16', riders: ['Sam'] });
  });
  await p.waitForTimeout(4500);
  const res = await p.evaluate(() => Object.values(window.__MOCK_DATA.events).filter(e => (e.riders || []).indexOf('Nico') !== -1).map(e => e.circuit + ' ' + e.dateStart + (e.dateEnd !== e.dateStart ? '→' + e.dateEnd : '') + (e.teamId ? ' [team]' : '')).sort());
  console.log('roulages de Nico:', res.join(' | '));
  if (res.length !== 8 || !res.some(x => /^Le Mans 2027-03-15.*\[team\]/.test(x)) || !res.some(x => /^Portimão 2027-09-20→2027-09-21$/.test(x))) process.exitCode = 1;
  const lm = await p.evaluate(() => window.__MOCK_DATA.events['mt95-lemans-27'].riders.join(',')); console.log('Le Mans MT95:', lm); if (lm !== 'Sam,Nico') process.exitCode = 1;
  // Deuxième passage : rien de doublé.
  await p.evaluate(() => localStorage.removeItem('cdp-seed-nico-2027-2026-11-21')); await p.waitForTimeout(9000);
  const n2 = await p.evaluate(() => Object.values(window.__MOCK_DATA.events).filter(e => (e.riders || []).indexOf('Nico') !== -1).length); console.log('après un 2e passage:', n2); if (n2 !== 8) process.exitCode = 1;
  console.log('errs', JSON.stringify(errs)); await b.close(); if (errs.length) process.exit(1);
})();
