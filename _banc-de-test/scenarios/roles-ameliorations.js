// Idées par rôle : prochain roulage (pilote), records des amis (accompagnant), pointage et message aux inscrits (organisateur), « À traiter » (admin).
const { chromium, BASE } = require('../lib');
(async () => {
  const lang = process.argv[2] || 'fr';
  const b = await chromium.launch(); const errs = [];
  const open = async (hash) => { const p = await b.newPage({ viewport: { width: 380, height: 1000 } }); p.on('pageerror', e => errs.push(e.message)); await p.goto(BASE + 'index.html#lang=' + lang + hash); await p.waitForTimeout(2000); return p; };
  // Pilote
  let p = await open('');
  await p.evaluate(() => { const d = new Date(Date.now() + 3 * 86400000), k = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); window.__MOCK_DATA.events.eSoon = { id: 'eSoon', circuit: 'Magny Cours', dateStart: k, dateEnd: k, riders: ['Alex'], note: '' }; firebase.firestore().collection('settings').doc('zz').set({ a: 1 }); });
  await p.waitForTimeout(2500);
  await p.click('.bottom-nav-btn:nth-child(1)'); await p.waitForTimeout(500);
  console.log('pilote carte prochain roulage:', await p.$eval('.carnet-today-card', e => e.innerText.replace(/\n+/g, ' | ')).catch(() => 'absente'));
  await p.close();
  // Accompagnant
  p = await open('&role=acc');
  await p.evaluate(() => { const ds = n => { const d = new Date(Date.now() + n * 86400000); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }; const S = window.__MOCK_DATA.sessions; S.zOld = { id: 'zOld', rider: 'Sam', date: ds(-90), circuit: 'Jerez', laps: [101.5, 101.0] }; S.zNew = { id: 'zNew', rider: 'Sam', date: ds(-3), circuit: 'Jerez', laps: [100.2, 99.9] }; firebase.firestore().collection('settings').doc('zz').set({ a: 2 }); });
  await p.waitForTimeout(2500);
  await p.click('.bottom-nav-btn:nth-child(1)'); await p.waitForTimeout(500);
  console.log('accompagnant carte records amis:', await p.$$eval('.card', e => e.filter(c => /Records battus/.test(c.innerText)).map(c => c.innerText.replace(/\n+/g, ' ')).join(' ; ') || 'absente'));
  await p.close();
  // Organisateur (admin) : pointage
  p = await open('&admin=1&bcn=1');
  await p.click('.bottom-nav-btn:nth-child(1)'); await p.waitForTimeout(400);
  await p.click('[data-outing-event="eBcn"]'); await p.waitForTimeout(500);
  await p.click('[data-action="manage-from-outing"]'); await p.waitForTimeout(500);
  await p.check('[data-checkin-name="Alex"]'); await p.waitForTimeout(600);
  console.log('pointage:', await p.$eval('.participants-list ~ .help-text, .help-text:has-text("Pointage")', e => e.innerText).catch(() => '?'), '| enregistré:', await p.evaluate(() => JSON.stringify(window.__MOCK_DATA.events.eBcn.checkedIn)), '| Écrire aux inscrits:', !!(await p.$('[data-action="event-group"]')));
  // Admin : À traiter
  await p.goto(BASE + 'index.html#lang=' + lang + '&admin=1'); await p.waitForTimeout(1800);
  await p.click('#settings-side'); await p.waitForTimeout(400); await p.click('[data-settings-go="@admin"]'); await p.waitForTimeout(500);
  console.log('admin À traiter:', await p.$$eval('.card .section-title', e => e.map(x => x.innerText).filter(t => /À traiter/.test(t)).length), '|', await p.$$eval('.card .friend-row', e => e.slice(0, 4).map(x => x.innerText.replace(/\n+/g, ' ')).join(' ; ')));
  console.log('errs', JSON.stringify(errs)); await b.close(); if (errs.length) process.exit(1);
})();
