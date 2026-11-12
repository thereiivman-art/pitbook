// Ma page : éditer sur place (circuits préférés, teams recommandés, sponsors, chrono vedette, vitrine) ; « Modifier ma fiche » allégé ; logos véhicules.
const { chromium, BASE } = require('../lib');
(async () => {
  const lang = process.argv[2] || 'fr';
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 380, height: 900 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + 'index.html#lang=' + lang + '&look=1'); await p.waitForTimeout(2000);
  await p.click('#header-me'); await p.waitForTimeout(500);
  const look = () => p.evaluate(() => JSON.stringify((window.__MOCK_DATA.users.u1.look || {})));
  // Circuits préférés
  await p.click('[data-mp-tab="circuits"]'); await p.click('[data-mp-sec="circuits"] [data-mp-edit="circuits"]'); await p.waitForTimeout(300);
  await p.fill('#pick-q', 'jer'); await p.waitForTimeout(200); await p.click('[data-pick="Jerez"]'); await p.click('[data-pick-save]'); await p.waitForTimeout(700);
  console.log('circuits préférés:', JSON.parse(await look()).favCircuits);
  // Perfs : ordre et chrono vedette
  await p.click('[data-mp-tab="perfs"]'); await p.waitForTimeout(200);
  console.log('ordre Perfs:', await p.$$eval('[data-mp-sec="perfs"]:not([hidden]) .mp-vis span, [data-mp-sec="perfs"]:not([hidden]) .moi-sec-title, [data-mp-sec="perfs"]:not([hidden]) .trophy-summary-label', e => e.map(x => x.innerText.trim().slice(0, 20)).join(' > ')));
  await p.click('[data-mp-sec="perfs"] [data-mp-edit="featured"]'); await p.waitForTimeout(300);
  await p.click('.pick-pins [data-pick]'); await p.click('[data-pick-save]'); await p.waitForTimeout(700);
  console.log('chrono vedette:', JSON.parse(await look()).featured);
  await p.click('[data-mp-tab="perfs"]'); await p.click('[data-mp-sec="perfs"] [data-mp-edit="showcase"]'); await p.waitForTimeout(300);
  await p.click('.pick-pins [data-pick]'); await p.click('[data-pick-save]'); await p.waitForTimeout(700);
  console.log('vitrine:', JSON.parse(await look()).pinned);
  // Réseau : sponsors et teams
  await p.click('[data-mp-tab="reseau"]'); await p.click('[data-mp-sec="reseau"] [data-mp-edit="sponsors"]'); await p.waitForTimeout(300);
  await p.fill('#sp-name', 'Garage Dupont'); await p.fill('#sp-url', 'garagedupont.fr'); await p.click('#sp-add'); await p.fill('#sp-name', 'Doublefil'); await p.fill('#sp-url', 'https://doublefil.fr'); await p.click('#sp-add'); await p.screenshot({ path: 'sponsors-sheet-' + lang + '.png' }); await p.click('[data-sp-save]'); await p.waitForTimeout(700);
  console.log('sponsors:', JSON.stringify(JSON.parse(await look()).sponsors));
  await p.click('[data-mp-tab="reseau"]'); await p.click('[data-mp-sec="reseau"] [data-mp-edit="teams"]'); await p.waitForTimeout(300);
  await p.click('.pick-pins [data-pick]').catch(() => {}); await p.click('[data-pick-save]'); await p.waitForTimeout(700);
  console.log('teams recommandés:', JSON.parse(await look()).favTeams);
  // Éditeur allégé
  await p.click('[data-action="look-edit"]'); await p.waitForTimeout(500);
  console.log('champs de « Modifier » :', await p.$$eval('.look-editor .look-label', e => e.map(x => x.innerText.replace(/\n/g, ' ').slice(0, 25)).join(' | ')));
  console.log('images prêtes:', await p.$$eval('.avatar-preset', e => e.length));
  await p.click('[data-action="look-cancel"]').catch(() => {}); p.on('dialog', d => d.accept());
  console.log('errs', JSON.stringify(errs)); await b.close(); if (errs.length) process.exit(1);
})();
