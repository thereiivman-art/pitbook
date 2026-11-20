// Teams › Découvrir, tri Moto / Voiture : par défaut ce que je roule
// (moto, voiture ou les deux), un appui allume ou éteint une catégorie.
// Voiture ne montre que les teams voiture, Moto ne les montre pas ; le
// mode du profil ne change pas, les présentations ne sont pas réécrites.
const { chromium, BASE } = require('../lib');
(async () => {
  const lang = process.argv[2] || 'fr';
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 390, height: 900 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + 'index.html#lang=' + lang); await p.waitForTimeout(1600);
  await p.evaluate(() => { const db = firebase.firestore();
    db.collection('teams').doc('tm').set({ id: 'tm', name: 'Moto Club Test', visibility: 'all', teamPro: true, description: 'Roulages moto à Carole' });
    db.collection('teams').doc('ta').set({ id: 'ta', name: 'Auto Club Test', visibility: 'all', teamPro: true, discipline: 'auto', description: 'Roulages voiture' });
  });
  await p.waitForTimeout(500);
  await p.click('.bottom-nav-btn:nth-child(1)'); await p.waitForTimeout(300);
  await p.click('.subnav-btn[data-view="team"]'); await p.waitForTimeout(400);
  await p.click('[data-pill-group="teams"][data-pill="discover"]').catch(() => {}); await p.waitForTimeout(400);
  const tiles = () => p.evaluate(() => [...document.querySelectorAll('.team-tile-grid > *')].map(x => x.innerText.replace(/\n+/g, ' ')).join(' ; '));
  const chips = () => p.$$eval('[data-td-cat]', e => e.map(x => (x.classList.contains('on') ? '*' : '') + x.innerText).join(' / '));
  const has = (t, m, a) => /Moto Club Test/.test(t) === m && /Auto Club Test/.test(t) === a;
  // Réglages › Compte › « Je roule en », puis retour à Teams › Découvrir.
  const openDiscover = async () => {
    await p.evaluate(() => window.scrollTo(0, 0)); await p.click('.bottom-nav-btn:nth-child(1)'); await p.waitForTimeout(300);
    await p.click('.subnav-btn[data-view="team"]'); await p.waitForTimeout(400);
    await p.click('[data-pill-group="teams"][data-pill="discover"]').catch(() => {}); await p.waitForTimeout(400);
  };
  const setProfile = async (o) => {
    await p.click('#header-me'); await p.waitForTimeout(300); await p.click('#settings-side'); await p.waitForTimeout(400);
    await p.click('[data-settings-go="@compte"]').catch(() => {}); await p.waitForTimeout(300);
    await p.click('[data-cpill-group="profil"][data-cpill="role"]').catch(() => {}); await p.waitForTimeout(300);
    if (o.discipline) { await p.click('[data-action="set-discipline"][data-discipline="' + o.discipline + '"]'); await p.waitForTimeout(500); }
    if (o.rideBoth) { await p.check('#ride-both'); await p.waitForTimeout(500); }
    await openDiscover();
  };
  let t = await tiles(), c = await chips(); console.log('je roule en moto:', c, '|', t);
  if (c !== '*Moto / Voiture' || !has(t, true, false)) process.exitCode = 1;
  await setProfile({ discipline: 'auto' });
  t = await tiles(); c = await chips(); console.log('je roule en voiture:', c, '|', t);
  if (c !== 'Moto / *Voiture' || !has(t, false, true)) process.exitCode = 1;
  await setProfile({ rideBoth: true });
  t = await tiles(); c = await chips(); console.log('les deux:', c, '|', t);
  if (c !== '*Moto / *Voiture' || !has(t, true, true)) process.exitCode = 1;
  if (!/Roulages moto à Carole/.test(t)) { console.log('présentation réécrite'); process.exitCode = 1; }
  await p.click('[data-td-cat="moto"]'); await p.waitForTimeout(300);
  t = await tiles(); c = await chips(); console.log('Moto éteint:', c, '|', t);
  if (c !== 'Moto / *Voiture' || !has(t, false, true)) process.exitCode = 1;
  await p.click('[data-td-cat="auto"]'); await p.waitForTimeout(300);
  c = await chips(); console.log('dernière catégorie gardée:', c); if (c !== 'Moto / *Voiture') process.exitCode = 1;
  const mode = await p.evaluate(() => window.__MOCK_DATA.users.u1.discipline); console.log('mode du profil:', mode);
  if (mode !== 'auto') process.exitCode = 1;
  console.log('errs', JSON.stringify(errs)); await b.close(); if (errs.length) process.exit(1);
})();
