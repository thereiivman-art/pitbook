// Compte supprimé (pilote provisoire fusionné) : absent des abonnés / abonnements ; Saisons montre 2027 et les roulages prévus.
const { chromium, BASE } = require('../lib');
(async () => {
  const lang = process.argv[2] || 'fr';
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 380, height: 950 }, deviceScaleFactor: 2 }); p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + 'index.html#lang=' + lang); await p.waitForTimeout(1800);
  const me = await p.evaluate(() => { const d = window.__MOCK_DATA; return Object.values(d.users).find(u => u && u.uid === firebase.auth().currentUser.uid || false) ? null : null; });
  await p.evaluate(() => {
    const db = firebase.firestore(), name = document.querySelector('#header-me') ? null : null;
    db.collection('follows').doc('ghost1').set({ follower: 'Marc ancien', followee: 'Alex', createdAt: 1 });
    db.collection('follows').doc('ghost2').set({ follower: 'Alex', followee: 'Marc ancien', createdAt: 1 });
    db.collection('events').doc('ev2027').set({ id: 'ev2027', circuit: 'Mugello', dateStart: '2027-04-10', dateEnd: '2027-04-11', riders: ['Sam'], public: true });
  });
  await p.waitForTimeout(800);
  await p.click('#header-me'); await p.waitForTimeout(600);
  console.log('compteurs:', await p.$eval('.social-counts', e => e.innerText.replace(/\n/g, ' ')));
  await p.click('[data-action="open-social"][data-list="abonnes"]'); await p.waitForTimeout(600);
  console.log('Marc ancien dans les abonnés:', (await p.content()).includes('Marc ancien'));
  await p.evaluate(() => window.scrollTo(0, 0)); await p.click('.bottom-nav-btn:nth-child(3)'); await p.waitForTimeout(600);
  await p.click('[data-person-link="Sam"]').catch(() => {}); await p.waitForTimeout(800);
  await p.click('.mp-tile[data-mp-tab="saisons"]'); await p.waitForTimeout(500);
  console.log('années Sam:', await p.$$eval('[data-mp-sec="saisons"]:not([hidden]) .season-years button', e => e.map(x => x.innerText).join(' / ')));
  const y27 = await p.$('[data-mp-sec="saisons"] [data-season-year="2027"]');
  if (y27) { await y27.click(); await p.waitForTimeout(500); console.log('2027:', await p.$eval('[data-mp-sec="saisons"]:not([hidden])', e => e.innerText.replace(/\n+/g, ' ').slice(0, 160))); await p.screenshot({ path: 'saison-2027-' + lang + '.png' }); }
  console.log('errs', JSON.stringify(errs)); await b.close(); if (errs.length) process.exit(1);
})();
