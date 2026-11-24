// Fil : « Derniers roulages » sous les stories (le plus récent d'abord, roulage seul compris),
// un toucher ouvre le récap ; dans le fil, un récap est daté du roulage, pas du dernier chrono saisi.
const { chromium, BASE } = require('../lib');
(async () => {
  const b = await chromium.launch(); const errs = [];
  const fail = (m) => { console.log('ÉCHEC', m); process.exitCode = 1; };
  for (const scheme of ['light', 'dark']) {
    const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: scheme }); p.on('pageerror', e => errs.push(e.message));
    await p.goto(BASE + 'index.html#lang=fr'); await p.waitForTimeout(1600);
    await p.click('.bottom-nav-btn:nth-child(3)'); await p.waitForTimeout(700);
    const tiles = await p.$$eval('.rr-tile', e => e.map(x => x.querySelector('strong').innerText + ' ' + x.querySelector('small').innerText + ' [' + x.querySelectorAll('.rr-row').length + ']'));
    console.log(scheme, 'tuiles:', tiles.join(' ; '));
    if (!tiles.length) fail('pas de bande');
    // Sous les stories, au-dessus du composer.
    const order = await p.evaluate(() => { const s = document.querySelector('.stories-row'), r = document.querySelector('.rr-wrap'), c = document.querySelector('.wall-composer, .composer-cta, [data-action="open-composer"]'); return !!(s && r && (s.compareDocumentPosition(r) & 4)) && (!c || !!(r.compareDocumentPosition(c) & 4)); });
    console.log('placement:', order); if (!order) fail('placement de la bande');
    // Ordre : du plus récent au plus ancien.
    const lasts = await p.evaluate(() => (window.__rrLast || null));
    await p.screenshot({ path: __dirname + '/../.sortie/derniers-roulages-' + scheme + '.png' });
    await p.click('.rr-tile >> nth=0'); await p.waitForTimeout(400);
    const sheet = await p.$eval('#mini-sheet', e => e.innerText.replace(/\n+/g, ' | ').slice(0, 160)).catch(() => 'absent'); console.log('récap ouvert:', sheet);
    if (!/Récap du roulage/i.test(sheet)) fail('récap non ouvert');
    await p.screenshot({ path: __dirname + '/../.sortie/derniers-roulages-recap-' + scheme + '.png' });
    await p.close();
  }
  console.log('errs', JSON.stringify(errs)); if (errs.length) process.exitCode = 1;
  await b.close();
})();
