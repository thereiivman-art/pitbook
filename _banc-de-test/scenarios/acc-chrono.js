// Accompagnant, onglet Chrono : prochain roulage d'abord, de l'espace, puis
// « Saisir le chrono d'un ami » ; la fenêtre permet d'importer une photo ou un PDF.
const { chromium, BASE } = require('../lib');
(async () => {
  const lang = process.argv[2] || 'fr';
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 390, height: 900 }, deviceScaleFactor: 2 }); p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + 'index.html#lang=' + lang + '&role=acc'); await p.waitForTimeout(1800);
  await p.evaluate(() => { const d = new Date(Date.now() + 9 * 864e5).toISOString().slice(0, 10);
    firebase.firestore().collection('events').doc('accnext').set({ id: 'accnext', circuit: 'Carole', dateStart: d, dateEnd: d, riders: ['Alex', 'Sam'], riderRoles: { Alex: 'accompagnant' } }); });
  await p.waitForTimeout(500);
  await p.click('.bottom-nav-btn:nth-child(2)'); await p.waitForTimeout(600);
  const order = await p.evaluate(() => { const n = document.querySelector('.chrono-next, .chrono-hero'), btn = document.querySelector('.chrono-big-btn[data-action="chrono-proposal"]'); if (!btn) return 'bouton absent'; if (!n) return 'pas de prochain roulage'; return (n.compareDocumentPosition(btn) & Node.DOCUMENT_POSITION_FOLLOWING) ? 'prochain roulage puis bouton' : 'bouton avant'; });
  console.log('ordre:', order); if (order !== 'prochain roulage puis bouton') process.exitCode = 1;
  await p.screenshot({ path: __dirname + '/../traces/acc-chrono.png' });
  await p.click('.chrono-big-btn[data-action="chrono-proposal"]'); await p.waitForTimeout(400);
  const imp = await p.$('.proposal-sheet [data-cp="import"]'), inp = await p.$('.proposal-sheet #cp-import-input');
  console.log('import photo/PDF:', !!imp, '| accepte:', inp ? await inp.getAttribute('accept') : '-');
  if (!imp || !inp) process.exitCode = 1;
  console.log('errs', JSON.stringify(errs)); if (errs.length) process.exitCode = 1;
  await b.close();
})();
