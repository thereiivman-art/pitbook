// Mon compte : connexion, e-mail, mot de passe et suppression seulement
// dans Identité ; Rôle n'a que le rôle et la discipline.
// Bannière : aperçu en direct (style, cadre, couleur, plaque), rien
// n'est enregistré avant Enregistrer ; le cadre (ex. Paul Ricard) s'y choisit.
const { chromium, BASE } = require('../lib');
(async () => {
  const lang = process.argv[2] || 'fr';
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }); p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + 'index.html#lang=' + lang); await p.waitForTimeout(1800);
  const fail = (m) => { console.log('ÉCHEC', m); process.exitCode = 1; };
  // Mon compte
  await p.click('#header-me'); await p.waitForTimeout(300); await p.click('#settings-side'); await p.waitForTimeout(400);
  await p.click('[data-settings-go="@compte"]').catch(() => {}); await p.waitForTimeout(400);
  const visible = (txt) => p.evaluate((t) => [...document.querySelectorAll('#root *')].some(e => e.offsetParent && e.children.length === 0 && (e.innerText || '').indexOf(t) !== -1), txt);
  await p.click('[data-cpill-group="profil"][data-cpill="identite"]').catch(() => {}); await p.waitForTimeout(200);
  const idLogout = await visible(lang === 'en' ? 'Log out' : 'Se déconnecter'), idPwd = await p.evaluate(() => !!document.querySelector('#logout-btn') && !!document.querySelector('#logout-btn').offsetParent);
  console.log('Identité : compte visible', idPwd);
  await p.screenshot({ path: __dirname + '/../.sortie/banniere-compte-identite-' + lang + '.png', fullPage: true });
  await p.click('[data-cpill-group="profil"][data-cpill="role"]'); await p.waitForTimeout(200);
  const roleAcc = await p.evaluate(() => !!document.querySelector('#logout-btn') && !!document.querySelector('#logout-btn').offsetParent);
  const roleSave = await p.evaluate(() => [...document.querySelectorAll('#profile-form [type="submit"]')].some(x => x.offsetParent));
  console.log('Rôle : compte visible', roleAcc, '| Enregistrer', roleSave);
  if (!idPwd || roleAcc || !roleSave) fail('onglets de Mon compte');
  await p.screenshot({ path: __dirname + '/../.sortie/banniere-compte-role-' + lang + '.png', fullPage: true });
  // Bannière 
  // Cadres débloqués (offerts par l'admin) pour ce compte.
  await p.goto(BASE + 'index.html#lang=' + lang + '&tout=1'); await p.reload(); await p.waitForTimeout(2000);
  await p.click('#header-me'); await p.waitForTimeout(700);
  await p.click('.ph-cover[data-own-cover]'); await p.waitForTimeout(500);
  const fields = await p.$$eval('.banner-sheet .look-label', e => e.map(x => x.innerText).join(' / ')); console.log('champs:', fields);
  console.log('cadres:', await p.$$eval('[data-banner-set="bannerFrame"]', e => e.map(x => x.getAttribute('data-val') + '=' + x.innerText).join(', ')), '| admin:', await p.evaluate(() => firebase.auth().currentUser.uid));
  if (!/cadre/i.test(fields) || !(await p.$('#banner-preview .person-hero'))) fail('aperçu ou Cadre absent');
  const before = await p.evaluate(() => JSON.stringify(firebase.firestore && window.__MOCK_DATA.users[firebase.auth().currentUser.uid].look || {}));
  await p.click('[data-banner-set="bannerFrame"][data-val="k-ricard"]'); await p.waitForTimeout(200);
  await p.click('[data-banner-set="color"][data-val="#1f4fb8"]'); await p.waitForTimeout(200);
  const prev = await p.$eval('#banner-preview .person-hero', e => (e.getAttribute('data-bframe') || '') + ' | ' + e.getAttribute('style'));
  console.log('aperçu:', prev.slice(0, 120));
  if (!/^k-ricard/.test(prev) || !/1f4fb8/i.test(prev)) fail('aperçu non mis à jour');
  const notYet = await p.evaluate(() => JSON.stringify(window.__MOCK_DATA.users[firebase.auth().currentUser.uid].look || {}));
  console.log('pas encore enregistré:', notYet === before); if (notYet !== before) fail('enregistré trop tôt');
  await p.evaluate(() => { const m = document.querySelector('.banner-sheet .mini-sheet'); if (m) m.scrollTop = m.scrollHeight; }); await p.waitForTimeout(200);
  const stuck = await p.evaluate(() => { const pv = document.getElementById('banner-preview').getBoundingClientRect(), m = document.querySelector('.banner-sheet .mini-sheet').getBoundingClientRect(); return pv.top >= m.top - 2 && pv.top < m.top + 40; });
  console.log('aperçu reste visible en bas du menu:', stuck); if (!stuck) fail('aperçu pas collé');
  await p.screenshot({ path: __dirname + '/../.sortie/banniere-apercu-' + lang + '.png' });
  await p.click('#banner-save'); await p.waitForTimeout(600);
  const saved = await p.evaluate(() => { const l = window.__MOCK_DATA.users[firebase.auth().currentUser.uid].look || {}; return l.bannerFrame + ' ' + l.color; });
  console.log('enregistré:', saved); if (saved !== 'k-ricard #1f4fb8') fail('enregistrement');
  const page = await p.$eval('.person-hero', e => e.getAttribute('data-bframe')); console.log('ma page:', page); if (page !== 'k-ricard') fail('page');
  await p.screenshot({ path: __dirname + '/../.sortie/banniere-page-' + lang + '.png' });
  console.log('errs', JSON.stringify(errs)); await b.close(); if (errs.length) process.exit(1);
})();
