// Messages : une conversation avec un team porte la pastille « Team » ;
// la barre de recherche filtre les conversations.
const { chromium, BASE } = require('../lib');
(async () => {
  const lang = process.argv[2] || 'fr';
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 390, height: 900 }, deviceScaleFactor: 2 }); p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + 'index.html#lang=' + lang); await p.waitForTimeout(1800);
  await p.evaluate(() => { const db = firebase.firestore(), now = Date.now(), uid = firebase.auth().currentUser.uid;
    db.collection('teamMessages').doc('tm1').set({ convId: 't2__' + uid, teamId: 't2', teamName: 'Mototeam95', userUid: uid, userName: 'Alex', from: 'lead', fromName: 'Xav', asTeam: true, text: 'Bienvenue au club !', createdAt: now - 60000 });
    const m = [uid, 'u2'].sort(); db.collection('directMessages').doc('dm1').set({ convId: m.join('__'), members: m, from: 'u2', fromName: 'Sam', toName: 'Alex', text: 'On roule samedi ?', createdAt: now - 30000 });
  });
  await p.waitForTimeout(600);
  await p.click('#header-dm, [data-action="open-dms"], .header-dm-btn').catch(async () => { await p.evaluate(() => { const x = [...document.querySelectorAll('button')].find(e => /Messages/.test(e.getAttribute('aria-label') || '')); if (x) x.click(); }); });
  await p.waitForTimeout(700);
  const rows = await p.$$eval('.dm-convs .dm-conv strong', e => e.map(x => x.innerText.replace(/\n/g, ' ')));
  console.log('conversations:', rows.join(' | '));
  const tag = await p.$eval('.dm-swipe.is-team .dm-team-tag', e => e.innerText).catch(() => 'absente');
  console.log('pastille team:', tag); if (!/team/i.test(tag)) process.exitCode = 1;
  const hasSearch = !!(await p.$('#dm-search')); console.log('recherche:', hasSearch); if (!hasSearch) process.exitCode = 1;
  if (hasSearch) {
    await p.fill('#dm-search', 'samedi'); await p.waitForTimeout(200);
    const vis = await p.$$eval('.dm-convs [data-dm-q]', e => e.filter(x => !x.hidden).map(x => (x.querySelector('.dm-conv strong') || x).innerText));
    console.log('« samedi » ->', vis.join(' | ')); if (vis.length !== 1 || !/Sam/.test(vis[0])) process.exitCode = 1;
    await p.fill('#dm-search', ''); await p.waitForTimeout(150);
  }
  await p.screenshot({ path: __dirname + '/../traces/messages-team.png' });
  console.log('errs', JSON.stringify(errs)); if (errs.length) process.exitCode = 1;
  await b.close();
})();
