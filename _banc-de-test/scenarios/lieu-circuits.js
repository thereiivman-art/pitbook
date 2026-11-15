// Lieu sur une publication (lien vers Maps), circuits préférés en saisie
// avec liste (une ligne par circuit, 3 max), et pas de pneus gagnés juste
// en ouvrant / rechargeant l'appli.
const { chromium, BASE } = require('../lib');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 900 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + 'index.html#lang=' + (process.argv[2] || 'fr')); await p.waitForTimeout(11000);
  const bank0 = await p.evaluate(() => firebase.firestore().collection('users').doc(firebase.auth().currentUser.uid).get().then(d => (d.data().pneus || {}).bank || 0));
  console.log('pneus gagnés à l\'ouverture:', bank0);
  await p.click('#wall-composer-toggle'); await p.waitForTimeout(300);
  await p.fill('#wall-post-text', 'Paddock !'); await p.click('[data-post-extra="place"]'); await p.fill('#wall-post-place', 'Barcelone');
  await p.click('#wall-post-form button[type="submit"]'); await p.waitForTimeout(600);
  await p.click('[data-mini-close]').catch(() => {}); await p.waitForTimeout(300);
  console.log('lieu stocké:', await p.evaluate(() => Object.values(window.__MOCK_DATA.wallPosts).filter(w => w.text === 'Paddock !').map(w => w.place).join()), '| affiché:', await p.$eval('.post-place', e => e.innerText + ' → ' + e.href.slice(0, 40)).catch(() => 'non'));
  // Pilote : plus de bloc circuits préférés sur Ma page (retiré à la demande).
  await p.click('#header-me'); await p.waitForTimeout(400);
  const favEdit = await p.$('[data-mp-edit="circuits"]'); console.log('crayon circuits préférés (pilote):', !!favEdit); if (favEdit) process.exitCode = 1;
  await p.screenshot({ path: 'lieu-circuits.png' });
  console.log('errs', JSON.stringify(errs)); if (errs.length) process.exitCode = 1; await b.close(); })();
