// Passés : une ligne par roulage (les jours d'un même événement regroupés),
// icône album photo ; recherche (circuit, date, mois, « album »).
const { chromium, BASE } = require('../lib');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 900 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + 'index.html#lang=' + (process.argv[2] || 'fr')); await p.waitForTimeout(1500);
  await p.evaluate(() => { const db = firebase.firestore(); const d = k => { const x = new Date(); x.setDate(x.getDate() - k); return x.toISOString().slice(0, 10); };
    const list = [['Lédenon', 20], ['Lédenon', 60], ['Aragon', 90], ['Magny-Cours', 120], ['Lédenon', 200]];
    return Promise.all(list.map((x, i) => db.collection('sessions').doc('ps' + i).set({ id: 'ps' + i, rider: 'Alex', circuit: x[0], date: d(x[1]), laps: [95 + i, 94 + i], createdAt: Date.now() - x[1] * 86400e3 }))
      .concat([db.collection('events').doc('pev').set({ id: 'pev', circuit: 'Aragon', dateStart: d(90), dateEnd: d(90), riders: ['Alex'], mediaLink: 'https://drive.google.com/drive/folders/abc' }), db.collection('sessions').doc('ps2').update({ eventId: 'pev' })])); });
  await p.waitForTimeout(500);
  await p.click('.bottom-nav-btn:nth-child(1)'); await p.waitForTimeout(300);
  await p.click('[data-cards-mode="passees"]'); await p.waitForTimeout(400);
  const rows = () => p.$$eval('#root .outing-row[data-open-outing]:not(.feed-ride)', e => e.filter(x => x.offsetParent).map(x => x.getAttribute('data-open-outing')).join(', '));
  console.log('passés:', await rows());
  const albums = await p.$$eval('.outing-album', e => e.map(x => x.href.slice(0, 30)).join());
  console.log('icônes album:', albums); if (!/drive\.google/.test(albums)) process.exitCode = 1;
  await p.fill('#outing-search', 'aragon'); await p.waitForTimeout(300);
  const ar = await rows(); console.log('recherche « aragon »:', ar); if (!/^Aragon(, Aragon)*$/.test(ar)) process.exitCode = 1;
  await p.fill('#outing-search', ''); await p.waitForTimeout(200); await p.click('[data-action="outing-album-filter"]'); await p.waitForTimeout(300);
  console.log('albums seulement:', await rows());
  await p.screenshot({ path: 'passes-circuits.png' });
  console.log('errs', JSON.stringify(errs)); if (errs.length) process.exitCode = 1; await b.close(); })();
