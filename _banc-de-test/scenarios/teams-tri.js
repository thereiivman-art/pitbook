// Teams › Découvrir, tri Moto / Voiture : un simple filtre. Voiture ne
// montre que les teams voiture, Moto ne les montre pas ; les présentations
// des teams ne sont pas réécrites (« moto » reste « moto »).
const { chromium, BASE } = require('../lib');
(async () => {
  const lang = process.argv[2] || 'fr';
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 390, height: 900 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + 'index.html#lang=' + lang); await p.waitForTimeout(1600);
  await p.evaluate(() => { const db = firebase.firestore();
    db.collection('teams').doc('tm').set({ id: 'tm', name: 'Moto Club Test', visibility: 'all', teamPro: true, description: 'Roulages moto à Carole' });
    db.collection('teams').doc('ta').set({ id: 'ta', name: 'Auto Club Test', visibility: 'all', teamPro: true, discipline: 'auto', description: 'Roulages voiture' });
  });
  await p.waitForTimeout(500);
  await p.click('.bottom-nav-btn:nth-child(1)'); await p.waitForTimeout(300);
  await p.click('.subnav-btn[data-view="team"]'); await p.waitForTimeout(400);
  await p.click('[data-pill-group="teams"][data-pill="discover"]').catch(() => {}); await p.waitForTimeout(400);
  const tiles = () => p.evaluate(() => [...document.querySelectorAll('.team-tile-grid > *')].map(x => x.innerText.replace(/\n+/g, ' ')).join(' ; '));
  const moto = await tiles(); console.log('moto:', moto);
  if (!/Moto Club Test/.test(moto) || /Auto Club Test/.test(moto)) process.exitCode = 1;
  await p.click('[data-td-cat="auto"]'); await p.waitForTimeout(400);
  const auto = await tiles(); console.log('voiture:', auto);
  if (!/Auto Club Test/.test(auto) || /Moto Club Test/.test(auto)) process.exitCode = 1;
  const mode = await p.evaluate(() => window.__MOCK_DATA.users.u1.discipline); console.log('mode du profil:', mode || 'moto');
  if (mode === 'auto') process.exitCode = 1;
  // Pilote en mode voiture : la présentation d'un team moto reste telle quelle.
  await p.evaluate(() => firebase.firestore().collection('users').doc(firebase.auth().currentUser.uid).update({ discipline: 'auto' }));
  await p.waitForTimeout(400);
  await p.click('[data-td-cat="moto"]'); await p.waitForTimeout(400);
  const kept = await tiles(); console.log('mode voiture, tri moto:', kept);
  if (!/Roulages moto à Carole/.test(kept)) process.exitCode = 1;
  console.log('errs', JSON.stringify(errs)); await b.close(); if (errs.length) process.exit(1);
})();
