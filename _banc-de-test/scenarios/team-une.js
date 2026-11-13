// Team : « à la une » (dernier post, ou épinglé), tuiles juste dessous, le reste des posts en bas.
const { chromium, BASE } = require('../lib');
(async () => {
  const lang = process.argv[2] || 'fr';
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 380, height: 900 }, deviceScaleFactor: 2 }); p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + 'index.html#lang=' + lang + '&role=orga'); await p.waitForTimeout(1600);
  await p.click('.bottom-nav-btn:nth-child(1)'); await p.waitForTimeout(300); await p.click('.subnav-btn[data-view="team"]'); await p.waitForTimeout(400);
  await p.getByText('Team Piste').first().click(); await p.waitForTimeout(800);
  console.log('team sans post:', await p.$eval('.team-une', e => e.innerText.replace(/\n+/g, ' ').slice(0, 140)));
  await p.evaluate(() => {
    const t = Object.entries(window.__MOCK_DATA.teams).find(([k, v]) => v.name === 'Team Piste'), db = firebase.firestore(), now = Date.now();
    for (let i = 1; i <= 6; i++) db.collection('teamFeed').doc('tp' + i).set({ id: 'tp' + i, teamId: t[0], author: i % 2 ? 'Sam' : 'Alex', text: 'Post numéro ' + i + (i === 1 ? ' : inscriptions ouvertes pour Jerez' : ''), createdAt: now - (7 - i) * 3600000 });
  });
  await p.waitForTimeout(900);
  console.log('à la une:', await p.$eval('.team-une-card', e => e.innerText.replace(/\n+/g, ' ').slice(0, 60)));
  const pos = await p.evaluate(() => ['.team-une', '.mp-bento', '#team-feed-all'].map(s => { const el = document.querySelector(s); return el ? Math.round(el.getBoundingClientRect().top + scrollY) : -1; }));
  console.log('positions une < tuiles < tous les posts:', pos.join(' < '), '| tuiles à moins d\'un écran:', pos[1] < 1300);
  // Épingler le post 1 depuis « Tous les posts »
  await p.click('#team-feed-all [data-team-pin="tp1"]'); await p.waitForTimeout(500);
  console.log('épinglé:', await p.$eval('.team-une-card', e => e.innerText.replace(/\n+/g, ' ').slice(0, 70)), '| stocké:', await p.evaluate(() => Object.values(window.__MOCK_DATA.teams).find(v => v.name === 'Team Piste').pinnedPostId));
  await p.evaluate(() => window.scrollTo(0, 0)); await p.screenshot({ path: 'team-une-' + lang + '.png', fullPage: true });
  console.log('errs', JSON.stringify(errs)); await b.close(); if (errs.length) process.exit(1);
})();
