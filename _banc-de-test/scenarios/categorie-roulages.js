// Roulages moto / voiture : tri Moto / Voiture dans Carnet › Tous (par défaut
// mon mode), catégorie du team (Moto, Voiture, Moto et voiture) dans son
// éditeur, mention Moto / Voiture sur la fiche d'un team qui fait les deux.
const { chromium, BASE } = require('../lib');
(async () => {
  const lang = process.argv[2] || 'fr';
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 390, height: 900 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + 'index.html#lang=' + lang + '&role=orga'); await p.waitForTimeout(1600);
  await p.evaluate(() => { const db = firebase.firestore();
    db.collection('teams').doc('t1').update({ teamPro: true, discipline: 'both' });
    db.collection('events').doc('cM').set({ id: 'cM', teamId: 't1', circuit: 'Jerez', dateStart: '2027-03-10', dateEnd: '2027-03-10', riders: [], eventVisibility: 'public' });
    db.collection('events').doc('cA').set({ id: 'cA', teamId: 't1', circuit: 'Magny Cours', dateStart: '2027-03-20', dateEnd: '2027-03-20', riders: [], eventVisibility: 'public', discipline: 'auto' });
  });
  await p.waitForTimeout(600);
  await p.click('.bottom-nav-btn:nth-child(1)'); await p.waitForTimeout(400);
  await p.click('.pill-btn[data-pill="tous"]'); await p.waitForTimeout(400);
  const listed = () => p.$$eval('.outings-card .event-row-circuit', e => e.map(x => x.innerText.trim()).join(', '));
  const chips = await p.$$eval('[data-td-cat]', e => e.map(x => (x.classList.contains('on') ? '*' : '') + x.innerText).join(' / '));
  const moto = await listed(); console.log('tri:', chips, '| moto:', moto);
  if (!/^\*Moto \/ Voiture$/i.test(chips) || !/Jerez/.test(moto) || /Magny/.test(moto)) process.exitCode = 1;
  await p.click('[data-td-cat="auto"]'); await p.waitForTimeout(300);
  const auto = await listed(); console.log('voiture:', auto);
  if (!/Magny/.test(auto) || /Jerez/.test(auto)) process.exitCode = 1;
  await p.screenshot({ path: __dirname + '/../traces/categorie-roulages.png' });
  // Fiche du team (moto et voiture) : chaque roulage dit sa catégorie.
  await p.click('.subnav-btn[data-view="team"]'); await p.waitForTimeout(400);
  await p.getByText('Team Piste').first().click(); await p.waitForTimeout(800);
  const rows = await p.$eval('[data-team-sec="bientot"]', e => e.innerText.replace(/\n+/g, ' '));
  console.log('fiche:', rows.slice(0, 160));
  if (!/Jerez[^›]*Moto/.test(rows) || !/Magny Cours[^›]*Voiture/.test(rows)) process.exitCode = 1;
  // Éditeur du team : champ Catégorie.
  await p.click('[data-action="team-settings-open"][data-team="t1"]'); await p.waitForTimeout(500);
  const opts = await p.$$eval('#look-team-disc option', e => e.map(x => (x.selected ? '*' : '') + x.innerText).join(' / '));
  console.log('éditeur catégorie:', opts);
  if (opts !== 'Moto / Voiture / *Moto et voiture') process.exitCode = 1;
  console.log('errs', JSON.stringify(errs)); await b.close(); if (errs.length) process.exit(1);
})();
