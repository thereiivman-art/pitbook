// « Tu roules aujourd'hui à … » : seulement si je suis inscrit au roulage.
// L'admin (et un Team Leader) voit tous les roulages des teams sans y rouler.
const { chromium, BASE } = require('../lib');
(async () => {
  const lang = process.argv[2] || 'fr';
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 390, height: 900 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + 'index.html#lang=' + lang + '&admin=1'); await p.waitForTimeout(1800);
  const me = await p.evaluate(() => { const d = new Date(), k = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    const M = window.__MOCK_DATA; Object.values(M.events).forEach(e => { if (e.dateStart <= k && (e.dateEnd || e.dateStart) >= k) delete M.events[e.id]; });
    firebase.firestore().collection('events').doc('jzToday').set({ id: 'jzToday', teamId: Object.keys(M.teams)[0], circuit: 'Jerez', dateStart: k, dateEnd: k, riders: ['Quelqu\'un'], eventVisibility: 'public' });
    return { k }; });
  await p.waitForTimeout(600);
  await p.click('.bottom-nav-btn:nth-child(1)'); await p.waitForTimeout(500);
  const card = () => p.$$eval('.carnet-today-card strong', e => e.map(x => x.innerText).join(' | '));
  const a = await card(); console.log('pas inscrit:', a || '(rien)');
  if (/aujourd'hui/i.test(a)) process.exitCode = 1;
  // Inscrit (tous les comptes du jeu de test dans les pilotes) : la carte revient.
  await p.evaluate(() => { const M = window.__MOCK_DATA, names = [M.users.u1.name];
    firebase.firestore().collection('events').doc('jzToday').set({ riders: names }, { merge: true }); });
  await p.waitForTimeout(600);
  const onChrono = await p.$eval('.bottom-nav-btn.active', e => e.innerText.trim()); console.log('onglet ouvert:', onChrono);
  await p.click('.bottom-nav-btn:nth-child(1)'); await p.waitForTimeout(500);
  const c = await card(); console.log('inscrit:', c);
  if (!/aujourd'hui à Jerez/i.test(c)) process.exitCode = 1;
  console.log('errs', JSON.stringify(errs)); await b.close(); if (errs.length) process.exit(1);
})();
