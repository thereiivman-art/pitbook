// Social : recherche de posts (« Marquez ») et #hashtags cliquables.
const { chromium, BASE } = require('../lib');
(async () => {
  const lang = process.argv[2] || 'fr';
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 380, height: 900 }, deviceScaleFactor: 2 }); p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + 'index.html#lang=' + lang); await p.waitForTimeout(2000);
  const me = await p.evaluate(() => (document.querySelector('#header-me') || {}).getAttribute && document.querySelector('#header-me').getAttribute('aria-label'));
  await p.evaluate(() => {
    const db = firebase.firestore(), now = Date.now();
    db.collection('wallPosts').doc('h1').set({ id: 'h1', author: 'Sam', audience: 'all', text: 'Quelle remontée de Marquez ce week-end #marquez #motogp', createdAt: now - 1000 });
    db.collection('wallPosts').doc('h2').set({ id: 'h2', author: 'Sam', audience: 'all', text: 'Pneus neufs pour Barcelone #motogp', createdAt: now - 2000 });
    db.collection('wallPosts').doc('h3').set({ id: 'h3', author: 'Sam', audience: 'all', text: 'Rien à voir', createdAt: now - 3000 });
  });
  await p.waitForTimeout(800);
  await p.click('.bottom-nav-btn:nth-child(3)'); await p.waitForTimeout(800);
  await p.fill('#wall-search-input', 'marquez'); await p.press('#wall-search-input', 'Enter'); await p.waitForTimeout(600);
  console.log('Recherche marquez:', await p.$eval('.wall-search-head', e => e.innerText), '|', await p.$$eval('.feed-card', e => e.length));
  await p.screenshot({ path: 'recherche-social-' + lang + '.png' });
  await p.click('.mention-link.hashtag[data-hashtag="motogp"]'); await p.waitForTimeout(600);
  console.log('#motogp:', await p.$eval('.wall-search-head', e => e.innerText), '|', await p.$$eval('.feed-card', e => e.length));
  await p.click('[data-wall-search-clear]'); await p.waitForTimeout(600);
  console.log('effacé:', await p.$$eval('.wall-search-head', e => e.length));
  console.log('errs', JSON.stringify(errs)); await b.close(); if (errs.length) process.exit(1);
})();
