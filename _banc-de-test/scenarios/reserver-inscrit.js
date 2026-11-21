// « Réserver » chez l'organisateur reste sur la fiche d'un roulage à venir
// même quand on y est inscrit dans Pitbook (dans « Ma réservation ») ; le lien Billetweb de Carole
// 2027 (Mototeam95) est mis à jour depuis le compte admin.
const { chromium, BASE } = require('../lib');
(async () => {
  const lang = process.argv[2] || 'fr';
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 390, height: 900 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + 'index.html#lang=' + lang); await p.waitForTimeout(1600);
  await p.evaluate(() => firebase.firestore().collection('events').doc('e1').set({ bookingUrl: 'https://www.billetweb.fr/barcelone-test' }, { merge: true }));
  await p.waitForTimeout(400);
  await p.click('.bottom-nav-btn:nth-child(1)'); await p.waitForTimeout(400);
  await p.evaluate(() => { const r = document.querySelector('[data-outing-event="e1"]'); if (r) r.click(); }); await p.waitForTimeout(800);
  // Inscrit, pas encore réservé : le lien est dans le cadre « Ma réservation ».
  const btn = await p.$eval('.book-card [data-action="open-external-url"]', e => e.innerText + ' | ' + e.getAttribute('data-url')).catch(() => 'absent');
  await p.screenshot({ path: __dirname + '/../.sortie/reserver-inscrit-' + lang + '.png' });
  console.log('inscrit, lien:', btn); if (!/^Réserver chez l'organisateur ↗ \| https:\/\/www\.billetweb\.fr\/barcelone-test$/.test(btn)) process.exitCode = 1;
  // Lien de Carole 2027 corrigé par le compte admin.
  const a = await b.newPage({ viewport: { width: 390, height: 900 } }); a.on('pageerror', e => errs.push(e.message));
  await a.goto(BASE + 'index.html#lang=' + lang + '&admin=1'); await a.waitForTimeout(800);
  await a.evaluate(() => firebase.firestore().collection('events').doc('mt95-carole-27').set({ id: 'mt95-carole-27', teamId: 'mtis6p71tnm01w', circuit: 'Carole', dateStart: '2027-03-27', dateEnd: '2027-03-29', riders: [], bookingUrl: 'https://www.billetweb.fr/carole-2027' }));
  await a.waitForTimeout(300);
  // Passage du compte admin avec ce roulage déjà en base (comme en vrai).
  await a.evaluate(() => { localStorage.removeItem('cdp-seed-mt95-billetweb-2026-11-21'); return firebase.firestore().collection('events').doc('zz').set({ id: 'zz', circuit: 'Carole', dateStart: '2027-12-01', dateEnd: '2027-12-01', riders: [] }); });
  await a.waitForTimeout(1500);
  const url = await a.evaluate(() => window.__MOCK_DATA.events['mt95-carole-27'].bookingUrl); console.log('Carole 2027:', url);
  if (url !== 'https://www.billetweb.fr/carole-2027?multi=918&margin=no_margin&ref=918&color=f00000&parent=moto-team-95') process.exitCode = 1;
  console.log('errs', JSON.stringify(errs)); await b.close(); if (errs.length) process.exit(1);
})();
