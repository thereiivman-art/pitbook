// Lot du 8 nov : ex aequo au podium, fenêtre Pneus qui tient dans l'écran, étape Affichage, vidéo collée dans le texte, « ? » centré sur PC.
const { chromium, BASE } = require('../lib');
(async () => {
  const lang = process.argv[2] || 'fr';
  const b = await chromium.launch(); const errs = [];
  let p = await b.newPage({ viewport: { width: 380, height: 640 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + 'index.html#lang=' + lang + '&egalite=1'); await p.waitForTimeout(1600);
  await p.click('.bottom-nav-btn[data-nav-tab="profil"]'); await p.waitForTimeout(300);
  await p.click('.subnav-btn[data-view="stats"]'); await p.waitForTimeout(500);
  console.log('podiums:', await p.$$eval('.podium-card .podium-circuit', e => e.map(x => x.innerText).join(' / ')), await p.$$eval('[data-pill-group]', e => e.map(x => x.getAttribute('data-pill-group') + ':' + x.getAttribute('data-pill')).join(' ')));
  console.log('podium Mugello:', await p.$$eval('.podium-card', cs => { const c = cs.find(x => /mugello/i.test(x.innerText)); return c ? c.innerText.replace(/\n+/g, ' ').slice(0, 300) : '?'; }));
  // Pneus sur petit écran
  await p.click('.pneus-chip').catch(async () => { await p.click('.bottom-nav-btn[data-nav-tab="profil"]'); await p.click('.pneus-chip'); }); await p.waitForTimeout(400);
  console.log('pneus : croix visible', await p.$eval('.pneus-sheet .mini-sheet-x', e => { const r = e.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight; }), '| pied visible', await p.$eval('.pneus-foot', e => { const r = e.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight + 1; }));
  await p.screenshot({ path: 'lot8-pneus-' + lang + '.png' });
  await p.click('.pneus-foot [data-mini-close]'); await p.waitForTimeout(200);
  // Vidéo collée dans le texte
  await p.click('.bottom-nav-btn[data-nav-tab="communaute"]'); await p.waitForTimeout(400);
  await p.click('#wall-composer-toggle').catch(() => {}); await p.waitForTimeout(300);
  await p.fill('#wall-post-text', 'Regardez ça https://youtu.be/dQw4w9WgXcQ?si=abc'); await p.click('#wall-post-form button[type="submit"]'); await p.waitForTimeout(800);
  await p.click('.after-publish [data-mini-close], [data-mini-close]').catch(() => {}); await p.waitForTimeout(300);
  console.log('lecteur intégré:', await p.$$eval('.link-player', e => e.length), '| stocké:', await p.evaluate(() => Object.values(window.__MOCK_DATA.wallPosts).filter(x => x.linkUrl).map(x => x.linkUrl).join(',')));
  await p.close();
  // Premier lancement : étape Affichage
  p = await b.newPage({ viewport: { width: 380, height: 800 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + 'index.html#lang=' + lang + '&premier=1'); await p.waitForTimeout(1600);
  let seen = false;
  for (let i = 0; i < 8 && !seen; i++) { seen = !!(await p.$('[data-onb-mode]')); if (!seen) { await p.click('.onb-modal .primary, .onb-modal [data-onb-next]').catch(() => {}); await p.waitForTimeout(300); } }
  console.log('étape Affichage:', seen);
  if (seen) { await p.click('[data-onb-mode="simple"]'); await p.waitForTimeout(200); console.log('mode simple activé:', await p.evaluate(() => document.documentElement.classList.contains('simple-mode'))); }
  await p.close();
  // PC : « ? » centré
  p = await b.newPage({ viewport: { width: 1300, height: 860 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + 'index.html#lang=' + lang); await p.waitForTimeout(1600);
  await p.click('.bottom-nav-btn[data-view="circuit"]'); await p.waitForTimeout(500);
  console.log('« ? » centré:', await p.$eval('.map-open-choice .help-tip-btn', e => getComputedStyle(e).justifyContent));
  console.log('errs', JSON.stringify(errs)); await b.close();
  if (errs.length) process.exit(1);
})();
