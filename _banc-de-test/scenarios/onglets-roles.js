// Ma page en onglets selon le rôle : pilote (Perfs), accompagnant et orga
// (Saisons, Photos, Trophées) ; Posts ouvert d'abord.
const { chromium, BASE } = require('../lib');
(async () => {
  const lang = process.argv[2] || 'fr';
  const b = await chromium.launch(); const errs = [];
  for (const role of ['', '&role=acc', '&role=orga']) {
    const p = await b.newPage({ viewport: { width: 380, height: 900 }, deviceScaleFactor: 2 }); p.on('pageerror', e => errs.push(e.message));
    await p.goto(BASE + 'index.html#lang=' + lang + role); await p.waitForTimeout(1800);
    await p.click('#header-me'); await p.waitForTimeout(600);
    const tabs = await p.$$eval('.mp-tabs .team-tab', e => e.map(x => (x.classList.contains('on') ? '*' : '') + x.innerText));
    console.log((role || 'pilote') + ' onglets:', tabs.join(' / '));
    if (tabs[0] !== '*Posts') process.exitCode = 1;
    if (!role && tabs.indexOf('Perfs') === -1) process.exitCode = 1;
    if (role === '&role=acc') {
      if (tabs.indexOf('Saisons') === -1 || tabs.indexOf('Photos') === -1) process.exitCode = 1;
      await p.screenshot({ path: 'onglets-acc-' + lang + '.png' });
      await p.click('.mp-tabs [data-mp-tab="photos"]'); await p.waitForTimeout(400);
      const open = await p.$$eval('[data-mp-sec]:not([hidden])', e => [...new Set(e.map(x => x.getAttribute('data-mp-sec')))].join(','));
      console.log('Photos ouvre:', open); if (open !== 'photos') process.exitCode = 1;
    }
    await p.close();
  }
  console.log('errs', JSON.stringify(errs)); if (errs.length) process.exitCode = 1; await b.close();
})();
