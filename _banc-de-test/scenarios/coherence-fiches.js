// Cohérence des fiches : sponsors = liens seulement, circuits et teams à leur place, « qui voit » sur Ma page ; Partager toujours à droite dans Social.
const { chromium, BASE } = require('../lib');
(async () => {
  const lang = process.argv[2] || 'fr';
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 380, height: 1000 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + 'index.html#lang=' + lang + '&look=1'); await p.waitForTimeout(2000);
  await p.evaluate(() => { const W = window.__MOCK_DATA.wallPosts = window.__MOCK_DATA.wallPosts || {}; W.zA = { id: 'zA', author: 'Alex', text: 'Mon post', audience: 'all', createdAt: Date.now() - 1000 }; W.zB = { id: 'zB', author: 'Sam', text: 'Post de Sam', audience: 'all', createdAt: Date.now() - 2000 }; firebase.firestore().collection('settings').doc('zz').set({ a: 5 }); });
  await p.waitForTimeout(1200);
  // Partager : même position (bord droit) sur tous les posts
  await p.click('.bottom-nav-btn:nth-child(3)').catch(() => {}); await p.waitForTimeout(800);
  const pos = await p.$$eval('.social-row', rows => rows.slice(0, 8).map(r => { const s = r.querySelector('[data-action="share-post"]'); if (!s) return null; const a = r.getBoundingClientRect(), x = s.getBoundingClientRect(); return Math.round(a.right - x.right) + (r.querySelector('.post-trash') ? '(corbeille)' : ''); }).filter(Boolean));
  console.log('posts:', await p.$$eval('[data-action="share-post"]', e => e.length), await p.$$eval('.social-row', e => e.length));
  console.log('écart Partager / bord droit:', pos.join(' '));
  // Ma page : qui voit
  await p.click('#header-me'); await p.waitForTimeout(600);
  for (const k of ['records', 'sponsors', 'amis', 'perfs']) { await p.click('[data-mp-tab="' + k + '"]'); console.log(k, ':', await p.$eval('[data-mp-sec="' + k + '"] .mp-vis', e => e.innerText).catch(() => '-')); }
  await p.click('[data-mp-tab="sponsors"]'); await p.click('[data-mp-sec="sponsors"] .mp-vis .link-btn'); await p.waitForTimeout(500);
  console.log('Régler ouvre:', await p.evaluate(() => (document.querySelector('.settings-page-head, .profile-panel h1') || {}).innerText || '?'));
  console.log('errs', JSON.stringify(errs)); await b.close(); if (errs.length) process.exit(1);
})();
