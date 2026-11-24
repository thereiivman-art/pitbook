// « Ma réservation » façon vibreur, en clair et en sombre : fiche, liste, page du team.
const { chromium, BASE } = require('../lib');
(async () => {
  const b = await chromium.launch(); const errs = [];
  const fail = (m) => { console.log('ÉCHEC', m); process.exitCode = 1; };
  for (const scheme of ['light', 'dark']) {
    const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: scheme }); p.on('pageerror', e => errs.push(e.message));
    await p.goto(BASE + 'index.html#lang=fr'); await p.waitForTimeout(1600);
    await p.click('.bottom-nav-btn:nth-child(1)'); await p.waitForTimeout(300); await p.click('[data-cards-mode="avenir"]:visible').catch(() => {}); await p.waitForTimeout(400);
    await p.click('.outing-row[data-outing-event="e1"] .book-chip'); await p.waitForTimeout(400);
    await p.click('#mini-sheet [data-book-set="booked"]'); await p.waitForTimeout(300); await p.click('#mini-sheet [data-mini-close]'); await p.waitForTimeout(200);
    await p.screenshot({ path: __dirname + '/../.sortie/vibreur-liste-' + scheme + '.png' });
    await p.evaluate(() => { const r = document.querySelector('[data-outing-event="e1"]'); if (r) r.click(); }); await p.waitForTimeout(800);
    await p.screenshot({ path: __dirname + '/../.sortie/vibreur-bouton-' + scheme + '.png' });
    await p.click('[data-book-open]'); await p.waitForTimeout(400);
    const card = await p.$('.book-card'); if (!card) { fail('carte absente ' + scheme); continue; }
    const look = await p.evaluate(() => { const k = getComputedStyle(document.querySelector('.book-card-kerb')).backgroundImage; const big = getComputedStyle(document.querySelector('.book-card-big')).color; const bg = getComputedStyle(document.querySelector('.book-card')).backgroundColor; return { kerb: k.slice(0, 40), big, bg }; });
    console.log(scheme, JSON.stringify(look)); if (look.kerb === 'none') fail('vibreur absent ' + scheme);
    await p.screenshot({ path: __dirname + '/../.sortie/vibreur-fiche-' + scheme + '.png' });
    await p.close();
  }
  console.log('errs', JSON.stringify(errs)); if (errs.length) process.exitCode = 1;
  await b.close();
})();
