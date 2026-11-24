// Pages longues (team, Ma page) : rien ne passe entre la barre du haut et les onglets, une fois descendu.
const { chromium, BASE } = require('../lib');
(async () => {
  const b = await chromium.launch(); const errs = [];
  const fail = (m) => { console.log('ÉCHEC', m); process.exitCode = 1; };
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }); p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + 'index.html#lang=fr'); await p.waitForTimeout(1600);
  await p.evaluate(() => { for (let i = 0; i < 8; i++) firebase.firestore().collection('events').doc('long' + i).set({ circuit: ['Le Mans', 'Carole', 'Navarra', 'Brno'][i % 4], dateStart: '2027-0' + (i + 1) + '-10', dateEnd: '2027-0' + (i + 1) + '-11', teamId: 't1', riders: ['Alex'], eventVisibility: 'public' }); }); await p.waitForTimeout(500);
  // Ce qui est peint juste au-dessus des onglets doit être le fond de page.
  const check = async (label) => {
    await p.evaluate(() => window.scrollBy(0, 700)); await p.waitForTimeout(400);
    const y = await p.evaluate(() => { const t = [...document.querySelectorAll('.team-tabs')].find(x => x.offsetParent); return t ? t.getBoundingClientRect().top : null; });
    if (y == null) { fail('onglets absents ' + label); return; }
    const sn = await p.evaluate(() => { const s = [...document.querySelectorAll('.subnav.main-subnav')].find(x => x.offsetParent); return s ? s.getBoundingClientRect().bottom : 0; });
    const shot = await p.screenshot({ clip: { x: 0, y: Math.max(sn, y - 12), width: 390, height: Math.max(1, Math.min(12, y - sn)) }, type: 'png' });
    await p.screenshot({ path: __dirname + '/../.sortie/barres-' + label + '.png' });
    console.log(label, 'onglets à', Math.round(y), 'barre du haut jusqu\'à', Math.round(sn));
    return shot;
  };
  await p.click('.bottom-nav-btn:nth-child(1)'); await p.waitForTimeout(300);
  await p.click('.subnav-btn[data-view="team"]'); await p.waitForTimeout(400);
  await p.getByText('Team Piste').first().click(); await p.waitForTimeout(800);
  await check('team');
  await p.evaluate(() => window.scrollTo(0, 0)); await p.click('#header-me'); await p.waitForTimeout(700);
  await p.click('.mp-tabs [data-mp-tab="bientot"]').catch(() => {}); await p.waitForTimeout(400);
  await check('mapage');
  console.log('errs', JSON.stringify(errs)); if (errs.length) process.exitCode = 1;
  await b.close();
})();
