// Guides en pages web : pilotes.html (FR et EN), liens depuis Aide.
const { chromium, BASE } = require('../lib');
(async () => { const b = await chromium.launch(); const errs = [];
  for (const lang of ['fr', 'en']) {
    const g = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 }); g.on('pageerror', e => errs.push(e.message));
    await g.goto(BASE + 'pilotes.html?lang=' + lang); await g.waitForTimeout(400);
    const t = await g.$eval('main', e => e.innerText.replace(/\n+/g, ' | '));
    console.log(lang, ':', t.slice(0, 220)); console.log('largeur', await g.evaluate(() => document.documentElement.scrollWidth));
    if (lang === 'fr' && !/Ce que tu y gagnes/i.test(t)) process.exitCode = 1;
    if (lang === 'en' && !/What you get/i.test(t)) process.exitCode = 1;
    await g.screenshot({ path: __dirname + '/../traces/guide-pilotes-' + lang + '.png', fullPage: true });
  }
  const p = await b.newPage({ viewport: { width: 390, height: 900 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + 'index.html#lang=fr'); await p.waitForTimeout(1400);
  console.log('errs', JSON.stringify(errs)); if (errs.length) process.exitCode = 1; await b.close(); })();
