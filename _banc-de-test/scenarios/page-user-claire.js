// Page d'un user : réseaux en grand sous la bannière, tuiles qui se voient touchables (retour Maymay).
const { chromium, BASE } = require('../lib');
(async () => {
  const lang = process.argv[2] || 'fr';
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 380, height: 900 }, deviceScaleFactor: 2 }); p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + 'index.html#lang=' + lang); await p.waitForTimeout(1800);
  await p.evaluate(() => {
    const d = window.__MOCK_DATA, sam = Object.entries(d.users).find(([k, v]) => v && v.name === 'Sam');
    const look = Object.assign({}, sam[1].look || {}, { links: [{ url: 'https://instagram.com/sam.r6' }, { url: 'https://youtube.com/@samonboard', comment: 'Mes embarquées' }, { url: 'https://www.tiktok.com/@samtrack' }] });
    return firebase.firestore().collection('users').doc(sam[0]).set(Object.assign({}, sam[1], { look }));
  });
  await p.waitForTimeout(600);
  await p.click('.bottom-nav-btn:nth-child(3)'); await p.waitForTimeout(700);
  await p.click('[data-person-link="Sam"]').catch(() => {}); await p.waitForTimeout(800);
  console.log('Instagram affiché (fois):', await p.$$eval('.brand-instagram', e => e.length), '| Sam réseaux en grand:', await p.$$eval('.social-big', e => e.map(x => x.innerText.replace(/\n/g, ' ')).join(' | ')), '| aide tuiles:', await p.$$eval('.mp-hint', e => e.length), '| chevrons:', await p.$$eval('.mp-go', e => e.length));
  await p.evaluate(() => { const s = document.querySelector('.mp-bento'); if (s) s.scrollIntoView({ block: 'start' }); window.scrollBy(0, -70); });
  await p.screenshot({ path: 'page-user-claire-' + lang + '.png' });
  await p.click('.mp-tile[data-mp-tab="reseau"]'); await p.waitForTimeout(400);
  console.log('après un appui, aide masquée:', await p.$$eval('.mp-hint', e => e.length) === 0);
  await p.evaluate(() => window.scrollTo(0, 0)); await p.click('#header-me'); await p.waitForTimeout(600);
  console.log('moi :', await p.$$eval('.socials-bar .mp-add, .socials-bar .social-big', e => e.map(x => x.innerText).join(' | ')));
  console.log('errs', JSON.stringify(errs)); await b.close(); if (errs.length) process.exit(1);
})();
