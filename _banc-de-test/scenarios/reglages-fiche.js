// Réglages façon Instagram (liste, pages), fiche modifiée
// entièrement dans Social (identité + cosmétiques débloqués).
const { chromium, BASE } = require('../lib');
(async () => { const b = await chromium.launch(); const lang = process.argv[2] || 'fr'; const errs = [];
  const p = await b.newPage({ viewport: { width: 390, height: 860 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + 'index.html#lang=' + lang); await p.waitForTimeout(1600);
  await p.click('#header-me').then(() => p.waitForTimeout(300)).then(() => p.click('#settings-side')); await p.waitForTimeout(400);
  console.log('groupes:', await p.$$eval('.set-group-title', e => e.map(x => x.innerText).join(' / ')));
  // Plus de champ de recherche ici : la loupe trouve les réglages (décision D10).
  console.log('pas de recherche dans Réglages:', !(await p.$('#settings-search')), '| lignes:', await p.$$eval('.set-row .set-label', e => e.map(x => x.innerText).join(', ')));
  await p.click('[data-settings-go="notifications"]'); await p.waitForTimeout(300);
  console.log('page:', await p.$eval('.settings-page-head .section-title', e => e.innerText), '| retour:', !!(await p.$('.settings-back')));
  await p.click('.settings-back'); await p.waitForTimeout(300);
  console.log('liste revenue:', !!(await p.$('.settings-ig')));
  await p.evaluate(() => { const d = document.querySelector('details.set-more'); if (d) d.open = true; }).then(() => p.click('[data-settings-go="@aide"]')); await p.waitForTimeout(300);
  console.log('page Aide:', await p.$eval('.settings-page-head .section-title', e => e.innerText));
  // Fiche : Modifier dans Social.
  await p.click('#header-me'); await p.waitForTimeout(500);
  await p.click('[data-action="look-edit"]'); await p.waitForTimeout(400);
  await p.fill('#fiche-firstname', 'Alexandre'); await p.selectOption('#fiche-nationality', 'IT');
  console.log('titre / icône retirés:', !(await p.$('[data-look-set="title"], [data-look-set="nameIcon"]')));
  // Éditeur simplifié : identité seulement (réseaux, sponsors, circuits sur leurs tuiles).
  console.log('éditeur simplifié (pas de « Plus d\'options »):', !(await p.$('.look-more')));
  console.log('prénom gardé après re-rendu:', await p.$eval('#fiche-firstname', e => e.value));
  await p.click('[data-action="look-save"]'); await p.waitForTimeout(800);
  await p.waitForTimeout(600);
  const st = await p.evaluate(() => { const u = window.__MOCK_DATA.users.u1; return [u.firstName, u.nationality].join(' | '); });
  console.log('stocké:', st); if (st !== 'Alexandre | IT') process.exitCode = 1;
  await p.screenshot({ path: 'reglages-fiche.png' });
  console.log('errs', JSON.stringify(errs)); if (errs.length) process.exitCode = 1; await b.close(); })();
