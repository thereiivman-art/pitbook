// Carnet › Roulages › Tous : roulages publics des teams ; Teams dans Carnet.
const { chromium, BASE } = require('../lib');
(async () => {
  const lang = process.argv[2] || 'fr';
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 380, height: 1000 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + 'index.html#lang=' + lang + '&bcn=1'); await p.waitForTimeout(1800);
  await p.evaluate(() => { const M = window.__MOCK_DATA; const t = Object.keys(M.teams)[0]; M.teams[t].teamPro = true;
    const mk = (id, vis, date, circuit) => { M.events[id] = { id, circuit, dateStart: date, dateEnd: date, teamId: t, eventVisibility: vis, riders: [], note: '300 €' }; };
    mk('ePub', 'public', '2027-03-10', 'Jerez'); mk('ePriv', 'membre', '2027-03-12', 'Mugello'); mk('eOuv', 'ouvert', '2027-04-02', 'Magny Cours'); mk('eAdh', 'adherent', '2027-04-05', 'Assen'); });
  await p.waitForTimeout(1200);
  await p.click('.bottom-nav-btn:nth-child(1)'); await p.waitForTimeout(500);
  console.log('sous-onglets Carnet:', await p.$$eval('.subnav-btn', e => e.map(x => x.innerText).join(' / ')));
  await p.click('.pill-btn[data-cards-mode="tous"]'); await p.waitForTimeout(500);
  console.log('pastille:', await p.$eval('.pill-btn.active', e => e.innerText), '| circuits listés:', await p.$$eval('.outings-card .event-row-circuit', e => e.map(x => x.innerText.trim()).join(', ')));
  await p.fill('#outing-search', 'jerez'); await p.waitForTimeout(500);
  console.log('recherche jerez:', await p.$$eval('.outings-card .event-row-circuit', e => e.length));
  await p.screenshot({ path: 'tous-' + lang + '.png' });
  await p.click('.subnav-btn[data-view="team"]'); await p.waitForTimeout(500);
  console.log('Teams ouvert, onglet actif:', await p.$eval('.subnav-btn.active', e => e.innerText), '| barre du bas active:', await p.$eval('.bottom-nav-btn.active', e => e.innerText.trim()));
  // Accompagnant et organisateur : la pastille Tous aussi ; pas d'engrenage sur la bannière de Ma page.
  for (const role of ['acc', 'orga']) {
    const q = await b.newPage({ viewport: { width: 380, height: 1000 } }); q.on('pageerror', e => errs.push(e.message));
    await q.goto(BASE + 'index.html#lang=' + lang + '&role=' + role); await q.waitForTimeout(1800);
    await q.evaluate(() => { const M = window.__MOCK_DATA; const t = Object.keys(M.teams)[0]; M.teams[t].teamPro = true; M.events.ePub = { id: 'ePub', circuit: 'Jerez', dateStart: '2027-03-10', dateEnd: '2027-03-10', teamId: t, eventVisibility: 'public', riders: [] }; });
    await q.waitForTimeout(2500);
    await q.click('.bottom-nav-btn:nth-child(1)'); await q.waitForTimeout(500);
    await q.click('.pill-btn[data-pill="tous"]'); await q.waitForTimeout(500);
    console.log(role, '| pastilles:', await q.$$eval('.pill-btn', e => e.map(x => x.innerText).join(' / ')), '| actif:', await q.$eval('.pill-btn.active', e => e.innerText), '| listés:', await q.$$eval('.outings-card .event-row-circuit', e => e.length));
    await q.click('#header-me'); await q.waitForTimeout(500);
    console.log(role, '| engrenage sur Ma page:', !!(await q.$('#settings-toggle')), '| Réglages en-tête:', !!(await q.$('#settings-side')));
    await q.close();
  }
  console.log('errs', JSON.stringify(errs)); await b.close(); if (errs.length) process.exit(1);
})();
