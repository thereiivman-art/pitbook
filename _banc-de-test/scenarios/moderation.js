// Posts : Signaler (tout le monde), Supprimer avec confirmation + message privé prérempli (admin), réaction 👎.
// Réseaux et sponsors : modifier un élément déjà ajouté.
const { chromium, BASE } = require('../lib');
(async () => {
  const lang = process.argv[2] || 'fr';
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 380, height: 950 }, deviceScaleFactor: 2 }); p.on('pageerror', e => errs.push(e.message));
  const seed = async () => { await p.evaluate(() => { firebase.firestore().collection('wallPosts').doc('mod1').set({ id: 'mod1', author: 'Sam', audience: 'all', text: 'Achetez mes pneus pas chers sur monsite', createdAt: Date.now() - 600000 }); }); await p.waitForTimeout(700); };
  // 1. Utilisateur : signaler, 👍
  await p.goto(BASE + 'index.html#lang=' + lang); await p.waitForTimeout(1700); await seed();
  await p.click('.bottom-nav-btn:nth-child(3)'); await p.waitForTimeout(700);
  const post = p.locator('.wall-post', { hasText: 'Achetez mes pneus' }).first();
  console.log('bouton signaler:', await post.locator('[data-report-post]').count(), '| corbeille admin:', await post.locator('[data-mod-delete]').count());
  await post.locator('.reaction-open').click(); await p.waitForTimeout(300); await post.locator('.reaction-pick[data-emoji="👎"]').click(); await p.waitForTimeout(400);
  console.log('👎:', await p.evaluate(() => JSON.stringify((window.__MOCK_DATA.wallPosts.mod1 || {}).reactions || {})));
  await p.locator('.wall-post', { hasText: 'Achetez mes pneus' }).first().locator('[data-report-post]').click(); await p.waitForTimeout(300);
  await p.click('.mini-sheet [data-reason="spam"]'); await p.fill('.mini-sheet #report-note', 'pub'); await p.click('.mini-sheet [data-report-send]'); await p.waitForTimeout(500);
  console.log('signalement:', await p.evaluate(() => JSON.stringify(Object.values(window.__MOCK_DATA.reports || {}).map(r => [r.postAuthor, r.reason, r.note]))));
  // 2. Ma page : modifier un sponsor et un réseau déjà ajoutés
  await p.evaluate(() => window.scrollTo(0, 0)); await p.click('#header-me'); await p.waitForTimeout(500);
  await p.click('.net-tile.add[data-mp-edit="sponsors"]'); await p.waitForTimeout(300);
  await p.fill('#sp-name', 'Garage Dupnt'); await p.click('#sp-add'); await p.click('[data-sp-save]'); await p.waitForTimeout(400);
  await p.click('.net-tile.add[data-mp-edit="sponsors"]'); await p.waitForTimeout(300);
  await p.click('.mini-sheet [data-sp-edit="0"]'); await p.waitForTimeout(200);
  console.log('sponsor remonté:', await p.$eval('#sp-name', e => e.value), '| bouton:', await p.$eval('#sp-add', e => e.innerText));
  await p.fill('#sp-name', 'Garage Dupont'); await p.click('#sp-add'); await p.click('[data-sp-save]'); await p.waitForTimeout(400);
  await p.click('.net-tile.add[data-look-at="links"]'); await p.waitForTimeout(300);
  await p.fill('.mini-sheet #look-ln-url', 'xavgmn'); await p.click('.mini-sheet [data-ln-save]'); await p.waitForTimeout(400);
  await p.click('.net-tile.add[data-look-at="links"]'); await p.waitForTimeout(300);
  await p.click('.mini-sheet [data-ln-edit="0"]'); await p.waitForTimeout(200);
  console.log('réseau remonté:', await p.$eval('.mini-sheet #look-ln-url', e => e.value), '| préfixe:', await p.$eval('.mini-sheet .link-prefix', e => e.innerText));
  await p.fill('.mini-sheet #look-ln-url', 'xavggmn'); await p.click('.mini-sheet [data-ln-save]'); await p.waitForTimeout(400);
  console.log('tuiles:', await p.$$eval('.net-tile:not(.add)', e => e.map(x => x.innerText.replace(/\n/g, ' ')).join(' | ')));
  // 3. Admin : supprimer avec message
  const p2 = await b.newPage({ viewport: { width: 380, height: 950 }, deviceScaleFactor: 2 }); p2.on('pageerror', e => errs.push(e.message));
  await p2.goto(BASE + 'index.html#lang=' + lang + '&admin=1'); await p2.waitForTimeout(1700);
  await p2.evaluate(() => { firebase.firestore().collection('wallPosts').doc('mod1').set({ id: 'mod1', author: 'Sam', audience: 'all', text: 'Achetez mes pneus pas chers sur monsite', createdAt: Date.now() - 600000 }); firebase.firestore().collection('reports').doc('r1').set({ postId: 'mod1', postAuthor: 'Sam', postText: 'Achetez mes pneus', reason: 'spam', note: 'pub', reporter: 'Alex', createdAt: Date.now() }); });
  await p2.waitForTimeout(700);
  await p2.click('.bottom-nav-btn:nth-child(3)'); await p2.waitForTimeout(700);
  const ap = p2.locator('.wall-post', { hasText: 'Achetez mes pneus' }).first();
  console.log('admin: corbeille:', await ap.locator('[data-mod-delete]').count(), '| signaler:', await ap.locator('[data-report-post]').count());
  await ap.locator('[data-mod-delete]').click(); await p2.waitForTimeout(400);
  console.log('message prérempli:', (await p2.$eval('#mod-msg', e => e.value)).slice(0, 110));
  await p2.screenshot({ path: 'moderation-' + lang + '.png' });
  await p2.click('[data-mod-confirm]'); await p2.waitForTimeout(800);
  console.log('post supprimé:', await p2.evaluate(() => !window.__MOCK_DATA.wallPosts.mod1), '| message à Sam:', await p2.evaluate(() => Object.values(window.__MOCK_DATA.directMessages || {}).some(m => m.toName === 'Sam' && /supprimé/.test(m.text))), '| signalement traité:', await p2.evaluate(() => !(window.__MOCK_DATA.reports || {}).r1));
  console.log('errs', JSON.stringify(errs)); await b.close(); if (errs.length) process.exit(1);
})();
