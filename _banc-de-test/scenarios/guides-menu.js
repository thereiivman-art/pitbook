// Menu des guides (guide.html) : FR/EN, 4 entrées, la langue suit vers
// chaque guide, et chaque guide renvoie au menu.
const { chromium, BASE } = require('../lib');
(async () => { const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 }); p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + 'guide.html?lang=fr'); await p.waitForTimeout(400);
  console.log('menu fr:', (await p.$eval('main', e => e.innerText)).replace(/\n+/g, ' | ').slice(0, 260));
  await p.screenshot({ path: __dirname + '/../traces/guides-menu-fr.png' });
  await p.click('.langs a:nth-child(2)'); await p.waitForTimeout(400);
  const en = await p.$eval('h1', e => e.innerText); console.log('après EN:', en, p.url().replace(/.*\//, ''));
  if (!/guides/i.test(en) || !/lang=en/.test(p.url())) process.exitCode = 1;
  await p.click('.hub a[href^="accompagnants.html"]'); await p.waitForTimeout(400);
  const h = await p.$eval('h1', e => e.innerText); console.log('guide ouvert:', h, p.url().replace(/.*\//, ''));
  if (!/companions/i.test(h)) process.exitCode = 1;
  await p.click('.hub-back'); await p.waitForTimeout(400);
  console.log('retour:', p.url().replace(/.*\//, '')); if (!/guide\.html\?lang=en/.test(p.url())) process.exitCode = 1;
  console.log('largeur', await p.evaluate(() => document.documentElement.scrollWidth));
  console.log('errs', JSON.stringify(errs)); if (errs.length) process.exitCode = 1; await b.close(); })();
