// Team, onglet Posts : écrire au team, puis les posts du plus récent au plus
// ancien ; un post épinglé passe en premier.
const { chromium, BASE } = require('../lib');
(async () => {
  const lang = process.argv[2] || 'fr';
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 380, height: 900 }, deviceScaleFactor: 2 }); p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + 'index.html#lang=' + lang + '&role=orga'); await p.waitForTimeout(1600);
  await p.click('.bottom-nav-btn:nth-child(1)'); await p.waitForTimeout(300); await p.click('.subnav-btn[data-view="team"]'); await p.waitForTimeout(400);
  await p.getByText('Team Piste').first().click(); await p.waitForTimeout(800);
  await p.click('[data-team-tab="posts"]'); await p.waitForTimeout(300);
  console.log('team sans post:', await p.$eval('[data-team-sec="posts"] .team-une-empty', e => e.innerText.replace(/\n+/g, ' ').slice(0, 80)).catch(() => 'absent'));
  await p.evaluate(() => {
    const t = Object.entries(window.__MOCK_DATA.teams).find(([k, v]) => v.name === 'Team Piste'), db = firebase.firestore(), now = Date.now();
    for (let i = 1; i <= 6; i++) db.collection('teamFeed').doc('tp' + i).set({ id: 'tp' + i, teamId: t[0], author: i % 2 ? 'Sam' : 'Alex', text: 'Post numéro ' + i + (i === 1 ? ' : inscriptions ouvertes pour Jerez' : ''), createdAt: now - (7 - i) * 3600000 })
  });
  await p.waitForTimeout(900);
  const texts = () => p.$$eval('[data-team-sec="posts"] .card', e => e.map(x => (x.innerText.match(/Post numéro \d/) || [''])[0]).filter(Boolean));
  const t0 = await texts(); console.log('ordre:', t0.join(', '), '| onglet:', await p.$eval('[data-team-tab="posts"]', e => e.innerText));
  if (t0[0] !== 'Post numéro 6' || t0.length !== 6) process.exitCode = 1;
  await p.click('[data-team-sec="posts"] [data-team-pin="tp1"]'); await p.waitForTimeout(500);
  const t1 = await texts(); console.log('après épingle:', t1.join(', '), '| stocké:', await p.evaluate(() => Object.values(window.__MOCK_DATA.teams).find(v => v.name === 'Team Piste').pinnedPostId));
  if (t1[0] !== 'Post numéro 1' || !(await p.$('[data-team-sec="posts"] .team-une-card'))) process.exitCode = 1;
  console.log('onglet Posts toujours ouvert:', await p.$eval('[data-team-sec="posts"]', e => !e.hidden));
  await p.evaluate(() => window.scrollTo(0, 0)); await p.screenshot({ path: 'team-une-' + lang + '.png', fullPage: true });
  console.log('errs', JSON.stringify(errs)); if (errs.length) process.exitCode = 1; await b.close();
})();
