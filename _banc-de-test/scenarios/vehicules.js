// Mon garage › Véhicules : ma moto, ajouter ma voiture, l'utiliser, la retirer.
const { chromium, BASE } = require('../lib');
(async () => {
  const lang = process.argv[2] || 'fr';
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 380, height: 1000 } }); p.on('pageerror', e => errs.push(e.message));
  p.on('dialog', d => d.accept());
  await p.goto(BASE + 'index.html#lang=' + lang); await p.waitForTimeout(2000);
  await p.click('#header-me'); await p.waitForTimeout(400); await p.click('.subnav-btn:nth-child(2)'); await p.waitForTimeout(500);
  const cards = () => p.$$eval('.vehicle-card', e => e.map(x => x.innerText.replace(/\n+/g, ' ')).join(' || '));
  console.log('avant:', await cards());
  await p.click('[data-action="vehicle-add"]'); await p.waitForTimeout(300);
  await p.click('[data-vtype="auto"]'); await p.fill('#veh-name', 'Porsche Cayman GT4'); await p.fill('#veh-num', '7'); await p.click('[data-veh-save]'); await p.waitForTimeout(800);
  console.log('après ajout:', await cards());
  await p.click('.vehicle-card [data-discipline="auto"]'); await p.waitForTimeout(800);
  console.log('voiture utilisée:', await cards());
  await p.click('.vehicle-card [data-vehicle-del]'); await p.waitForTimeout(800);
  console.log('après retrait:', await cards());
  await p.screenshot({ path: 'vehicules-' + lang + '.png' });
  console.log('errs', JSON.stringify(errs)); await b.close(); if (errs.length) process.exit(1);
})();
