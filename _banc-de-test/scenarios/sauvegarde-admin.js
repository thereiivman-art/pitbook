// Admin : la carte Sauvegarde exporte toutes les collections dans un JSON.
const { chromium, BASE } = require('../lib');
(async () => {
  const lang = process.argv[2] || 'fr';
  const b = await chromium.launch(); const errs = [];
  const ctx = await b.newContext({ acceptDownloads: true, viewport: { width: 380, height: 1000 } });
  const a = await ctx.newPage(); a.on('pageerror', e => errs.push(e.message));
  await a.goto(BASE + 'index.html#lang=' + lang + '&admin=1'); await a.waitForTimeout(1700);
  await a.click('#settings-side').catch(() => {}); await a.waitForTimeout(400); await a.click('[data-settings-go="@admin"]'); await a.waitForTimeout(800);
  console.log('carte:', await a.$eval('.admin-backup', e => e.innerText.replace(/\n+/g, ' ').slice(0, 160)));
  const [dl] = await Promise.all([a.waitForEvent('download', { timeout: 20000 }), a.click('[data-admin-backup]')]);
  const f = await dl.path(); const j = JSON.parse(require('fs').readFileSync(f, 'utf8'));
  console.log('fichier:', dl.suggestedFilename(), '| collections:', Object.keys(j.collections).length, '| users:', j.counts.users, '| refusées:', j.skipped.length);
  await a.waitForTimeout(500);
  console.log('après:', await a.$eval('.admin-backup', e => e.innerText.replace(/\n+/g, ' ').slice(-90)).catch(() => 'absente'), '|', await a.evaluate(() => [...document.querySelectorAll('h2.section-title')].slice(0,4).map(h => h.innerText).join(' / ')));
  if (errs.length) { console.log('ERREURS', errs); process.exitCode = 1; }
  if (!j.counts.users) process.exitCode = 1;
  await b.close();
})();
