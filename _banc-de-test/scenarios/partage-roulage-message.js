// Partager un roulage en message : Inviter › Message › un ami ; dans la
// conversation, le roulage s'affiche en carte (circuit, dates,
// organisateurs, inscrits, Voir) qui ouvre la fiche du roulage.
const { chromium, BASE } = require('../lib');
(async () => {
  const lang = process.argv[2] || 'fr';
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }); p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + 'index.html#lang=' + lang); await p.waitForTimeout(1600);
  await p.evaluate(() => { const db = firebase.firestore();
    db.collection('teams').doc('rehm-t').set({ id: 'rehm-t', name: 'Rehm Race Days', visibility: 'all' });
    db.collection('events').doc('e1').set({ teamId: 't1', coTeamIds: ['rehm-t'] }, { merge: true }); });
  await p.waitForTimeout(500);
  await p.click('.bottom-nav-btn:nth-child(1)'); await p.waitForTimeout(400);
  await p.evaluate(() => { const r = document.querySelector('[data-outing-event="e1"]'); if (r) r.click(); }); await p.waitForTimeout(800);
  await p.click('[data-action="share-roulage"][data-id="e1"]'); await p.waitForTimeout(400);
  const opts = await p.$$eval('.share-sheet [data-share-to]', e => e.map(x => x.innerText.trim()).join(' / ')); console.log('options:', opts);
  if (!/^Message \/ WhatsApp \/ Lien/.test(opts)) process.exitCode = 1;
  await p.screenshot({ path: __dirname + '/../.sortie/partage-roulage-1-' + lang + '.png' });
  await p.click('[data-share-to="dm"]'); await p.waitForTimeout(400);
  await p.screenshot({ path: __dirname + '/../.sortie/partage-roulage-2-' + lang + '.png' });
  await p.click('[data-dmshare="Sam"]'); await p.waitForTimeout(500);
  const stored = await p.evaluate(() => firebase.firestore().collection('directMessages').get().then(s => s.docs.map(d => d.data()).filter(m => /roulage=e1/.test(m.text || '')).map(m => m.toName + ' | ' + m.text.split('\n')[0])[0] || 'absent'));
  console.log('message:', stored); if (!/^Sam \| Roulage à Barcelone · /.test(stored)) process.exitCode = 1;
  await p.click('[data-mini-close]').catch(() => {}); await p.waitForTimeout(200);
  await p.evaluate(() => window.scrollTo(0, 0));
  await p.click('button[aria-label="Messages"]'); await p.waitForTimeout(500);
  await p.click('[data-action="dm-open"][data-name="Sam"]'); await p.waitForTimeout(600);
  await p.evaluate(() => { const l = document.getElementById('dm-list'); if (l) l.scrollTop = l.scrollHeight; });
  const card = await p.$eval('#dm-list .dm-roulage', e => e.innerText.replace(/\n+/g, ' | ')).catch(() => 'absente'); console.log('carte:', card);
  if (!/Barcelone/i.test(card) || !/Team Piste/.test(card) || !/Rehm Race Days/.test(card) || !/2 inscrits/.test(card)) process.exitCode = 1;
  const rawLink = await p.$eval('#dm-list', e => /roulage=e1/.test(e.innerText)); console.log('lien brut visible:', rawLink); if (rawLink) process.exitCode = 1;
  await p.screenshot({ path: __dirname + '/../.sortie/partage-roulage-3-' + lang + '.png' });
  await p.click('#dm-list .dm-roulage'); await p.waitForTimeout(700);
  const opened = await p.evaluate(() => !!document.querySelector('[data-action="share-roulage"][data-id="e1"]')); console.log('fiche ouverte:', opened);
  if (!opened) process.exitCode = 1;
  console.log('errs', JSON.stringify(errs)); await b.close(); if (errs.length) process.exit(1);
})();
