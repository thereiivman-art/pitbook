// Circuits : un pilote propose (suggestions de circuits existants), l'admin crée ou refuse ; l'orga crée directement.
const { chromium, BASE } = require('../lib');
(async () => {
  const lang = process.argv[2] || 'fr';
  const b = await chromium.launch(); const errs = [];
  const openCombo = async (p, q) => { await p.click('.bottom-nav-btn:nth-child(1)'); await p.waitForTimeout(300); await p.click('.subnav-btn[data-view="circuit"]'); await p.waitForTimeout(400); await p.fill('#circuit-find', q); await p.waitForTimeout(400); };
  // Pilote
  const p = await b.newPage({ viewport: { width: 380, height: 950 }, deviceScaleFactor: 2 }); p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + 'index.html#lang=' + lang); await p.waitForTimeout(1700);
  await openCombo(p, 'Mugello GP');
  console.log('pilote, option:', await p.$eval('[data-combo-create]', e => e.innerText));
  await p.dispatchEvent('[data-combo-create]', 'mousedown'); await p.waitForTimeout(400);
  console.log('feuille:', await p.$eval('.mini-sheet h2', e => e.innerText));
  await p.fill('#cs-name', 'Circuit de Mugello'); await p.waitForTimeout(200);
  console.log('existe peut-être:', await p.$$eval('#cs-similar [data-cs-use]', e => e.map(x => x.innerText).join(', ')));
  await p.fill('#cs-name', 'Circuit du Grand Sambuc'); await p.fill('#cs-where', 'Vauvenargues, France'); await p.click('[data-cs-send]'); await p.waitForTimeout(500);
  console.log('proposition:', await p.evaluate(() => JSON.stringify(Object.values(window.__MOCK_DATA.reports || {}).filter(r => r.kind === 'suggestion').map(r => [r.postId, r.postText]))));
  // Admin
  const a = await b.newPage({ viewport: { width: 380, height: 1100 }, deviceScaleFactor: 2 }); a.on('pageerror', e => errs.push(e.message));
  await a.goto(BASE + 'index.html#lang=' + lang + '&admin=1'); await a.waitForTimeout(1700);
  await a.evaluate(() => { const db = firebase.firestore(); db.collection('users').doc('uidSam').set({ name: 'Sam', uid: 'uidSam', role: 'pilote' }, { merge: true }); db.collection('reports').doc('s1').set({ kind: 'suggestion', postId: 'Circuit du Grand Sambuc', postAuthor: 'Sam', postText: 'Vauvenargues, France', reason: 'nouveau', note: '', reporter: 'Sam', reporterUid: 'uidSam', createdAt: Date.now() }); });
  await a.waitForTimeout(500);
  await a.click('#settings-side').catch(() => {}); await a.waitForTimeout(400); await a.click('[data-settings-go="@admin"]'); await a.waitForTimeout(1000);
  console.log('carte admin:', await a.$eval('.admin-reports', e => e.innerText.replace(/\n+/g, ' ').slice(0, 140)).catch(() => 'absente'));
  await a.click('[data-cs-accept="s1"]'); await a.waitForTimeout(300); await a.click('[data-csa-ok]'); await a.waitForTimeout(700);
  console.log('créé:', await a.evaluate(() => JSON.stringify(window.__MOCK_DATA.circuits[encodeURIComponent('Circuit du Grand Sambuc')] || null)), '| message à Sam:', await a.evaluate(() => Object.values(window.__MOCK_DATA.directMessages || {}).some(m => m.toName === 'Sam' && /ajouté/.test(m.text))));
  // Orga
  const o = await b.newPage({ viewport: { width: 380, height: 950 } }); o.on('pageerror', e => errs.push(e.message));
  await o.goto(BASE + 'index.html#lang=' + lang + '&role=orga'); await o.waitForTimeout(1700);
  await openCombo(o, 'Nouveau tracé');
  console.log('orga, option:', await o.$eval('[data-combo-create]', e => e.innerText));
  console.log('errs', JSON.stringify(errs)); await b.close(); if (errs.length) process.exit(1);
})();
