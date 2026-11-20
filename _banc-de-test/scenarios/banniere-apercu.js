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
  if (!/style \/ cadre \/ plaque et couleur/i.test(fields) || !(await p.$('#banner-preview .person-hero'))) fail('champs ou aperçu');
  if (!(await p.$('select[data-look-pick="cover"]')) || !(await p.$('select[data-look-pick="bannerFrame"]'))) fail('listes absentes');
  // Tout tient dans l'écran (iPhone 14 : 390 × 844), sans défiler.
  const fits = await p.evaluate(() => { const m = document.querySelector('.banner-sheet .mini-sheet'); return m.scrollHeight <= m.clientHeight + 2 && m.getBoundingClientRect().bottom <= innerHeight + 1; });
  console.log('tient dans l\'écran:', fits); if (!fits) fail('menu trop haut');
  const before = await p.evaluate(() => JSON.stringify(window.__MOCK_DATA.users[firebase.auth().currentUser.uid].look || {}));
  await p.selectOption('select[data-look-pick="bannerFrame"]', 'k-ricard'); await p.waitForTimeout(200);
  await p.click('[data-look-sw="#1f4fb8"]'); await p.waitForTimeout(200);
  let prev = await p.$eval('#banner-preview .person-hero', e => (e.getAttribute('data-bframe') || '') + ' | ' + e.getAttribute('data-plate') + ' | ' + e.getAttribute('style'));
  console.log('aperçu:', prev.slice(0, 120));
  if (!/^k-ricard \| signature/.test(prev) || !/1f4fb8/i.test(prev)) fail('aperçu non mis à jour');
  // La plaque entière dans l'aperçu (pas coupée).
  const plate = await p.evaluate(() => { const pl = document.querySelector('#banner-preview .ph-plate'), pv = document.getElementById('banner-preview'); if (!pl) return 'absente'; const a = pl.getBoundingClientRect(), b = pv.getBoundingClientRect(); return a.left >= b.left && a.right <= b.right && a.top >= b.top && a.bottom <= b.bottom ? 'entière' : 'coupée ' + JSON.stringify([a.top, a.bottom, b.top, b.bottom]); });
  console.log('plaque:', plate); if (plate !== 'entière') fail('plaque');
  await p.screenshot({ path: __dirname + '/../.sortie/banniere-apercu-' + lang + '.png' });
  await p.click('[data-look-sw=""]'); await p.waitForTimeout(200);
  prev = await p.$eval('#banner-preview .person-hero', e => e.getAttribute('data-plate')); console.log('cercle barré -> plaque:', JSON.stringify(prev));
  if (prev !== '' || await p.$('#banner-preview .ph-plate')) fail('cercle barré');
  await p.click('[data-look-sw="#1f4fb8"]'); await p.waitForTimeout(150);
  const notYet = await p.evaluate(() => JSON.stringify(window.__MOCK_DATA.users[firebase.auth().currentUser.uid].look || {}));
  console.log('pas encore enregistré:', notYet === before); if (notYet !== before) fail('enregistré trop tôt');
  await p.click('#banner-save'); await p.waitForTimeout(600);
  const saved = await p.evaluate(() => { const l = window.__MOCK_DATA.users[firebase.auth().currentUser.uid].look || {}; return [l.bannerFrame, l.color, l.plate].join(' '); });
  console.log('enregistré:', saved); if (saved !== 'k-ricard #1f4fb8 signature') fail('enregistrement');
  await p.screenshot({ path: __dirname + '/../.sortie/banniere-page-' + lang + '.png' });
  // Team : même menu (sans plaque), même aperçu, même enregistrement.
  await p.evaluate(() => window.scrollTo(0, 0)); await p.click('.bottom-nav-btn:nth-child(1)'); await p.waitForTimeout(300);
  await p.click('.subnav-btn[data-view="team"]'); await p.waitForTimeout(400);
  await p.getByText('Team Piste').first().click(); await p.waitForTimeout(700);
  await p.click('.ph-cover[data-team-cover]'); await p.waitForTimeout(500);
  const tf = await p.$$eval('.banner-sheet .look-label', e => e.map(x => x.innerText).join(' / ')); console.log('team, champs:', tf);
  if (!/style \/ cadre \/ couleur/i.test(tf) || !(await p.$('#banner-preview .person-hero'))) fail('menu team');
  await p.selectOption('select[data-look-pick="cover"]', 'damier'); await p.selectOption('select[data-look-pick="bannerFrame"]', 'k-misano'); await p.click('[data-look-sw="#2f8f3a"]'); await p.waitForTimeout(200);
  const tp = await p.$eval('#banner-preview .person-hero', e => e.getAttribute('data-cover') + ' ' + e.getAttribute('data-bframe') + ' ' + /2f8f3a/i.test(e.getAttribute('style'))); console.log('team, aperçu:', tp);
  if (tp !== 'damier k-misano true') fail('aperçu team');
  await p.screenshot({ path: __dirname + '/../.sortie/banniere-team-' + lang + '.png' });
  await p.click('#banner-save'); await p.waitForTimeout(600);
  const tl = await p.evaluate(() => { const l = (window.__MOCK_DATA.teams.t1 || {}).look || {}; return [l.cover, l.bannerFrame, l.color].join(' '); }); console.log('team, enregistré:', tl);
  if (tl !== 'damier k-misano #2f8f3a') fail('enregistrement team');
  console.log('errs', JSON.stringify(errs)); await b.close(); if (errs.length) process.exit(1);
})();
