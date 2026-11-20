// Tous les partages passent par « Message » : saison, mes prochains
// roulages, post. On choisit un ami ou un groupe ; la conversation affiche
// une carte (titre, lignes, Voir) au lieu du lien.
const { chromium, BASE } = require('../lib');
(async () => {
  const lang = process.argv[2] || 'fr';
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }); p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + 'index.html#lang=' + lang); await p.waitForTimeout(1800);
  await p.evaluate(() => { const u = firebase.auth().currentUser.uid; return firebase.firestore().collection('groupChats').doc('g1').set({ name: 'La bande', members: [u, 'u-sam'], memberNames: ['Alex', 'Sam'], createdBy: 'u-sam', createdByName: 'Sam', createdAt: Date.now() - 3600e3, lastAt: Date.now() - 3600e3 }); });
  await p.waitForTimeout(500);
  const stored = (re) => p.evaluate((src) => { const re = new RegExp(src); const out = []; const M = window.__MOCK_DATA;
    Object.values(M.directMessages || {}).forEach(m => { if (re.test(m.text || '')) out.push(m.toName + ' | ' + m.text.split('\n')[0]); });
    Object.keys(M).filter(k => /groupChats\/g1\/messages|^groupMessages/.test(k)).forEach(k => Object.values(M[k] || {}).forEach(m => { if (re.test(m.text || '')) out.push('La bande | ' + m.text.split('\n')[0]); }));
    const g = (M.groupChats || {}).g1; if (g && re.test(g.lastText || '')) out.push('La bande(aperçu) | ' + g.lastText.split('\n')[0]);
    return out.join(' ; '); }, re.source);
  // 0. Un post public du fil (accueil) › Partager › Message › Sam
  await p.evaluate(() => firebase.firestore().collection('wallPosts').doc('w2').update({ audience: 'all', authorUid: 'u2' })); await p.waitForTimeout(500);
  console.log('posts partageables:', await p.evaluate(() => { const l = [...document.querySelectorAll('[data-action="share-post"]')]; const b = l.find(x => x.offsetParent); if (b) b.click(); return l.length + '/' + !!b + ' ' + location.hash + ' ' + (document.querySelector('.bottom-nav-btn.active') || {}).innerText; })); await p.waitForTimeout(400);
  await p.click('[data-share-to="dm"]'); await p.waitForTimeout(300); await p.click('[data-dmshare="Sam"]'); await p.waitForTimeout(400);
  await p.click('[data-mini-close]').catch(() => {}); await p.waitForTimeout(200);
  // 1. Ma page › Saisons › Partager ma saison › Message › La bande + Sam
  await p.click('#header-me'); await p.waitForTimeout(700);
  await p.click('.mp-tabs [data-mp-tab="saisons"]').catch(() => {}); await p.waitForTimeout(300);
  await p.evaluate(() => { const b = [...document.querySelectorAll('[data-action="share-season"]')].find(x => x.offsetParent); if (b) b.click(); }); await p.waitForTimeout(400);
  const opts = await p.$$eval('.share-sheet [data-share-to]', e => e.map(x => x.innerText.trim()).join(' / ')); console.log('saison, options:', opts);
  if (opts !== 'Message / Image') process.exitCode = 1;
  await p.click('[data-share-to="dm"]'); await p.waitForTimeout(400);
  const dests = await p.$$eval('[data-dmshare]', e => e.map(x => x.innerText.split('\n').filter(Boolean).slice(-2, -1)[0] || x.innerText).slice(0, 4).join(', ')); console.log('destinataires:', dests);
  if (!/La bande/.test(dests)) process.exitCode = 1;
  await p.screenshot({ path: __dirname + '/../.sortie/partage-tout-dest-' + lang + '.png' });
  await p.click('[data-dmshare="grp:g1"]'); await p.waitForTimeout(300);
  await p.click('[data-dmshare="Sam"]'); await p.waitForTimeout(400);
  console.log('saison envoyée:', await stored(/pb=saison/)); 
  await p.click('[data-mini-close]').catch(() => {}); await p.waitForTimeout(200);
  // 2. Mes prochains roulages › Message › Sam
  await p.click('.mp-tabs [data-mp-tab="bientot"]').catch(() => {}); await p.waitForTimeout(300);
  await p.evaluate(() => { const b = [...document.querySelectorAll('[data-action="share-my-upcoming"]')].find(x => x.offsetParent); if (b) b.click(); }); await p.waitForTimeout(400);
  await p.click('[data-share-to="dm"]'); await p.waitForTimeout(300); await p.click('[data-dmshare="Sam"]'); await p.waitForTimeout(400);
  await p.click('[data-mini-close]').catch(() => {}); await p.waitForTimeout(200);
  // 3. Conversation avec Sam : deux cartes, pas de lien brut
  await p.evaluate(() => window.scrollTo(0, 0));
  await p.click('button[aria-label="Messages"]'); await p.waitForTimeout(500);
  const preview = await p.$eval('[data-action="dm-open"][data-name="Sam"]', e => e.innerText.replace(/\n+/g, ' | ')).catch(() => '?'); console.log('aperçu:', preview);
  if (/https?:/.test(preview)) process.exitCode = 1;
  await p.click('[data-action="dm-open"][data-name="Sam"]'); await p.waitForTimeout(600);
  await p.evaluate(() => { const l = document.getElementById('dm-list'); if (l) l.scrollTop = l.scrollHeight; });
  const cards = await p.$$eval('#dm-list .dm-card', e => e.map(x => x.innerText.replace(/\n+/g, ' | ')).join(' ## ')); console.log('cartes:', cards);
  if (!/SAISON 20\d\d/i.test(cards) || !/PROCHAINS ROULAGES/i.test(cards) || !/POST · /i.test(cards) || /0 record/.test(cards)) process.exitCode = 1;
  if (await p.$eval('#dm-list', e => /pb=/.test(e.innerText))) { console.log('lien brut visible'); process.exitCode = 1; }
  await p.screenshot({ path: __dirname + '/../.sortie/partage-tout-conv-' + lang + '.png' });
  // Voir sur la carte saison : ouvre ma page
  await p.click('#dm-list .dm-card-saison'); await p.waitForTimeout(600);
  console.log('Voir saison -> page:', await p.evaluate(() => !!document.querySelector('.mp-tabs')));
  // 4. Le groupe : la carte saison y est aussi
  await p.evaluate(() => window.scrollTo(0, 0)); await p.click('button[aria-label="Messages"]'); await p.waitForTimeout(500);
  if (await p.$('.dm-back-btn')) { await p.click('.dm-back-btn'); await p.waitForTimeout(400); }
  console.log('conversations:', await p.$$eval('[data-action="dm-open"]', e => e.map(x => x.getAttribute('data-name')).join(', ')));
  await p.click('[data-action="dm-open"][data-name="grp:g1"]'); await p.waitForTimeout(700);
  console.log('ouverte:', await p.$eval('.dm-head', e => e.innerText.replace(/\n+/g, ' ')).catch(() => '?'));
  const gcards = await p.$$eval('#dm-list .dm-card', e => e.map(x => x.innerText.replace(/\n+/g, ' | ')).join(' ## ')).catch(() => ''); console.log('groupe:', gcards);
  if (!/SAISON/i.test(gcards)) process.exitCode = 1;
  console.log('errs', JSON.stringify(errs)); await b.close(); if (errs.length) process.exit(1);
})();
