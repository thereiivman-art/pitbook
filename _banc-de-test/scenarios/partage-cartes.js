// Récap du roulage : l'icône Partager en bas (comme les autres posts) et un
// bouton Voir ; plus de « Partager la story » ni « Voir le roulage ».
// Puis chaque partage en message donne sa carte : entre potes (récap),
// podium, chrono, team ; Voir ouvre le bon écran.
const { chromium, BASE } = require('../lib');
(async () => {
  const lang = process.argv[2] || 'fr';
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }); p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + 'index.html#lang=' + lang); await p.waitForTimeout(1800);
  const fail = (m) => { console.log('ÉCHEC', m); process.exitCode = 1; };
  const sendToSam = async (label) => {
    const opts = await p.$$eval('.share-sheet [data-share-to]', e => e.map(x => x.innerText.trim()).join(' / ')).catch(() => '');
    console.log(label, 'options:', opts); if (!/^Message \/ /.test(opts)) fail(label + ' sans Message');
    await p.click('[data-share-to="dm"]'); await p.waitForTimeout(300); await p.click('[data-dmshare="Sam"]'); await p.waitForTimeout(400);
    await p.click('[data-mini-close]').catch(() => {}); await p.waitForTimeout(200);
  };
  const clickVisible = (sel) => p.evaluate((sel) => { const b = [...document.querySelectorAll(sel)].find(x => x.offsetParent); if (b) { b.scrollIntoView({ block: 'center' }); b.click(); } return !!b; }, sel);
  // 1. Récap du roulage sur l'accueil
  for (let i = 0; i < 4 && !(await p.$('.feed-recap-head')); i++) { await p.evaluate(() => window.scrollBy(0, 2500)); await p.waitForTimeout(400); }
  const recap = await p.evaluate(() => { const h = document.querySelector('.feed-recap-head'); const card = h && h.closest('.feed-card, .feed-entry, article, .card'); if (!card) return null;
    return { txt: card.innerText, acts: [...card.querySelectorAll('.feed-recap-actions button')].map(x => x.innerText.trim()), footShare: !!card.querySelector('.social-row [data-action="share-battle"]'), footSvg: !!card.querySelector('.social-row [data-action="share-battle"] svg') }; });
  console.log('récap:', JSON.stringify(recap && { acts: recap.acts, footShare: recap.footShare }));
  if (!recap || /Partager la story|Voir le roulage/.test(recap.txt) || recap.acts.join() !== 'Voir' || !recap.footShare || !recap.footSvg) fail('récap');
  await p.evaluate(() => document.querySelector('.feed-recap-head').scrollIntoView({ block: 'start' })); await p.waitForTimeout(200);
  await p.screenshot({ path: __dirname + '/../.sortie/partage-cartes-recap-' + lang + '.png' });
  await clickVisible('.social-row [data-action="share-battle"]'); await p.waitForTimeout(400);
  await sendToSam('récap');
  // Voir du récap : ouvre le roulage
  await clickVisible('.feed-recap-actions [data-open-outing]'); await p.waitForTimeout(800);
  console.log('Voir récap -> roulage:', await p.evaluate(() => (document.querySelector('.outing-title') || {}).innerText || 'non'));
  // 2. Chrono : un chrono du roulage
  await clickVisible('[data-pill-group="outing"][data-pill="chronos"]'); await p.waitForTimeout(400);
  if (await clickVisible('[data-action="share-session"]')) { await p.waitForTimeout(400); await sendToSam('chrono'); } else fail('pas de bouton partager chrono');
  // 3. Podium des potes : Ma page › Perfs
  await p.evaluate(() => window.scrollTo(0, 0)); await p.click('.bottom-nav-btn:nth-child(1)'); await p.waitForTimeout(400);
  await p.click('#header-me'); await p.waitForTimeout(700);
  await p.click('.mp-tabs [data-mp-tab="perfs"]').catch(() => {}); await p.waitForTimeout(500);
  await p.click('[data-podium-scope="potes"]', { timeout: 1500 }).catch(() => {}); await p.waitForTimeout(400);
  console.log('podium vu:', await p.evaluate(() => [document.querySelectorAll('[data-action="share-podium"]').length, document.querySelectorAll('.podium-scope').length, (document.querySelector('.subnav-btn.active, .subnav-btn[aria-current]') || {}).innerText, document.body.innerText.indexOf('Podium')].join(' | ')));
  if (await clickVisible('[data-action="share-podium"]')) { await p.waitForTimeout(400); await sendToSam('podium'); } else fail('pas de bouton partager podium');
  // 4. Team : page du team
  await p.evaluate(() => window.scrollTo(0, 0)); await p.click('.bottom-nav-btn:nth-child(1)'); await p.waitForTimeout(300);
  await p.click('.subnav-btn[data-view="team"]'); await p.waitForTimeout(400);
  await p.getByText('Team Piste').first().click(); await p.waitForTimeout(700);
  if (await clickVisible('[data-action="share-team"]')) { await p.waitForTimeout(400); await sendToSam('team'); } else fail('pas de bouton partager team');
  // 5. Conversation avec Sam : quatre cartes
  await p.evaluate(() => window.scrollTo(0, 0)); await p.click('button[aria-label="Messages"]'); await p.waitForTimeout(500);
  if (await p.$('.dm-back-btn')) { await p.click('.dm-back-btn'); await p.waitForTimeout(300); }
  await p.click('[data-action="dm-open"][data-name="Sam"]'); await p.waitForTimeout(600);
  const kinds = await p.$$eval('#dm-list .dm-card', e => e.map(x => [...x.classList].find(c => /^dm-card-/.test(c)).slice(8) + ': ' + x.innerText.replace(/\n+/g, ' | ')));
  kinds.forEach(k => console.log('  carte', k));
  const has = (k) => kinds.some(x => x.indexOf(k + ':') === 0);
  ['duel', 'chrono', 'podium', 'team'].forEach(k => { if (!has(k)) fail('carte ' + k + ' absente'); });
  if (await p.$eval('#dm-list', e => /pb=/.test(e.innerText))) fail('lien brut visible');
  await p.evaluate(() => { const l = document.getElementById('dm-list'); if (l) l.scrollTop = 0; });
  await p.screenshot({ path: __dirname + '/../.sortie/partage-cartes-conv-' + lang + '.png' });
  await p.evaluate(() => { const l = document.getElementById('dm-list'); if (l) l.scrollTop = l.scrollHeight; });
  await p.screenshot({ path: __dirname + '/../.sortie/partage-cartes-conv2-' + lang + '.png' });
  // Voir sur chaque carte
  const voir = async (k, check) => {
    await p.evaluate(() => window.scrollTo(0, 0)); await p.click('button[aria-label="Messages"]'); await p.waitForTimeout(400);
    if (await p.$('.dm-back-btn')) { await p.click('.dm-back-btn'); await p.waitForTimeout(300); }
    await p.click('[data-action="dm-open"][data-name="Sam"]'); await p.waitForTimeout(500);
    await p.click('#dm-list .dm-card-' + k); await p.waitForTimeout(700);
    const r = await p.evaluate(check); console.log('Voir', k, '->', r); if (!r) fail('Voir ' + k);
  };
  await voir('team', () => /Team Piste/.test((document.querySelector('.team-hero, .team-page, #root') || {}).innerText || '') && !document.getElementById('dm-list'));
  const onCircuit = () => !document.getElementById('dm-list') && !!document.querySelector('[data-pill-group="circuit"]') && /Mugello/i.test(document.getElementById('root').innerText);
  await voir('podium', onCircuit);
  await voir('duel', onCircuit);
  await voir('chrono', () => !document.getElementById('dm-list'));
  console.log('errs', JSON.stringify(errs)); await b.close(); if (errs.length) process.exit(1);
})();
