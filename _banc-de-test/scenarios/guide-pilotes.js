// Guides en pages web : pilotes.html et accompagnants.html (FR et EN).
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
  for (const lang of ['fr', 'en']) {
    const g = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 }); g.on('pageerror', e => errs.push(e.message));
    await g.goto(BASE + 'accompagnants.html?lang=' + lang); await g.waitForTimeout(400);
    const t = await g.$eval('main', e => e.innerText.replace(/\n+/g, ' | '));
    console.log('accompagnants', lang, ':', t.slice(0, 160), '| largeur', await g.evaluate(() => document.documentElement.scrollWidth));
    if (!(lang === 'fr' ? /Ta journée au paddock/i : /Your day at the paddock/i).test(t)) process.exitCode = 1;
    await g.screenshot({ path: __dirname + '/../traces/guide-accompagnants-' + lang + '.png', fullPage: true });
  }
  console.log('errs', JSON.stringify(errs)); if (errs.length) process.exitCode = 1; await b.close(); })();
