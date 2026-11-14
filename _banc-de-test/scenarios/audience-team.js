// Audience d'un motoclub : onglet Audience de la page du team (leader) ; « Bientôt en
// piste » sur la fiche d'un pilote : ami (par défaut), non ami seulement
// s'il a choisi « Tout le monde » ; réglage dans Mon compte › Vie privée.
const { chromium, BASE } = require('../lib');
(async () => {
  const lang = process.argv[2] || 'fr';
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 380, height: 1000 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + 'index.html#lang=' + lang); await p.waitForTimeout(1600);
  await p.evaluate(async () => {
    const db = firebase.firestore(), day = new Date().toISOString().slice(0, 10);
    await db.collection('postViews').doc('t1').set({ postId: 'tp1', owner: 'Sam', viewer: 'Luca', day, teamId: 't1' });
    await db.collection('postViews').doc('t2').set({ postId: 'tp1', owner: 'Sam', viewer: 'Tom', day, teamId: 't1' });
    await db.collection('profileViews').doc('t3').set({ postId: 'team:t1', owner: 'team:t1', viewer: 'Luca', day, teamId: 't1' });
  });
  await p.click('.bottom-nav-btn:nth-child(1)'); await p.waitForTimeout(400);
  await p.click('.subnav-btn[data-view="team"]'); await p.waitForTimeout(400);
  await p.click('[data-action="team-tile-open"][data-team="t1"]'); await p.waitForTimeout(700);
  console.log('tuiles du team:', await p.$$eval('.mp-tile .mp-k', e => e.map(x => x.innerText.replace('›', '').trim()).join(' / ')));
  await p.click('.mp-tile[data-mp-tab="audience"]'); await p.waitForTimeout(800);
  console.log('audience du team:', await p.$$eval('.aud-card .aud-tile', e => e.map(x => x.innerText.replace(/\n/g, ' ')).join(' | ')).catch(() => 'absente'));
  await p.screenshot({ path: 'audience-team-' + lang + '.png', fullPage: true });
  // Fiche de Sam (ami) : sous-onglet Bientôt en piste
  await p.evaluate(() => window.scrollTo(0, 0)); await p.click('.bottom-nav-btn:nth-child(3)'); await p.waitForTimeout(500);
  await p.evaluate(() => { const b = [...document.querySelectorAll('[data-person-link="Sam"], [data-name="Sam"]')][0]; if (b) b.click(); });
  await p.waitForTimeout(600);
  console.log('page de Sam, tuiles:', await p.$$eval('.mp-tile', e => e.map(x => x.getAttribute('data-mp-tab')).join(' / ')));
  await p.click('.mp-tile[data-mp-tab="bientot"]'); await p.waitForTimeout(300);
  const bientot = await p.$$eval('.feed-upcoming-open', e => e.map(x => x.getAttribute('data-open-outing')).join(', '));
  console.log('Sam à venir:', bientot); if (!bientot) process.exitCode = 1;
  // Réglage Vie privée
  await p.evaluate(() => window.scrollTo(0, 0)); await p.click('#settings-side'); await p.waitForTimeout(400);
  await p.locator('[data-settings-go="confidentialite"]').first().click(); await p.waitForTimeout(400);
  await p.selectOption('#profile-share-upcoming', 'public'); await p.waitForTimeout(500);
  console.log('réglage stocké:', await p.evaluate(() => window.__MOCK_DATA.users.u1.shareUpcoming));
  console.log('errs', JSON.stringify(errs)); await b.close();
})();
