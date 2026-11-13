// Tableau de bord des roulages d'un team : puces « à compléter », filtre, import par le leader ; seul le rôle organisateur (ou l'admin) gère.
const { chromium, BASE } = require('../lib');
(async () => {
  const lang = process.argv[2] || 'fr';
  const b = await chromium.launch(); const errs = [];
  const run = async (hash) => {
    const p = await b.newPage({ viewport: { width: 380, height: 1000 } }); p.on('pageerror', e => errs.push(e.message));
    await p.goto(BASE + 'index.html#lang=' + lang + hash); await p.waitForTimeout(1800);
    await p.click('.bottom-nav-btn[data-nav-tab="communaute"]'); await p.waitForTimeout(400);
    await p.click('.bottom-nav-btn:nth-child(1)').then(() => p.waitForTimeout(300)).then(() => p.click('.subnav-btn[data-view="team"]')); await p.waitForTimeout(400);
    await p.getByText('Team Piste').first().click(); await p.waitForTimeout(700);
    return p;
  };
  for (const [label, hash] of [['pilote leader', ''], ['organisateur leader', '&role=orga'], ['admin', '&admin=1']]) {
    const p = await run(hash);
    console.log(label, 'pastilles:', await p.$$eval('.pill-btn', e => e.map(x => x.innerText).join('/')));
    const tl = p.locator('.mp-tile[data-mp-tab="bientot"]'); if (await tl.count() && !(await p.$('[data-mp-sec="bientot"]:not([hidden])'))) { await tl.click(); await p.waitForTimeout(400); }
    console.log(label, '| Importer:', !!(await p.$('[data-action="team-import-toggle"]')), '| + Ajouter:', !!(await p.$('[data-action="team-event-add"]')), '| À compléter:', !!(await p.$('[data-pill-group="teamev"][data-pill="completer"]')), '| puces:', await p.$$eval('.todo-chip', e => e.length));
    if (label === 'organisateur leader') {
      await p.click('[data-action="team-import-toggle"]'); await p.waitForTimeout(400);
      console.log(' carte import: preset', await p.$$eval('#evimp-preset option', e => e.map(x => x.innerText).join('/')), '| select team:', !!(await p.$('#evimp-team')));
      await p.fill('#evimp-text', '2027-05-01 | 2027-05-02 | Magny Cours | 200 € | https://example.com'); await p.click('[data-action="evimp-check"]'); await p.waitForTimeout(400);
      await p.click('[data-action="evimp-go"]'); await p.waitForTimeout(700);
      console.log(' importé:', await p.evaluate(() => Object.values(window.__MOCK_DATA.events || {}).filter(e => e.dateStart === '2027-05-01').map(e => e.teamId).join()));
      await p.click('[data-pill-group="teamev"][data-pill="completer"]').catch(() => {}); await p.waitForTimeout(400);
      console.log(' à compléter:', await p.$$eval('.todo-chip', e => e.map(x => x.innerText).join(' / ')));
      await p.screenshot({ path: 'dashboard-' + lang + '.png' });
    }
    await p.close();
  }
  console.log('errs', JSON.stringify(errs)); await b.close(); if (errs.length) process.exit(1);
})();
