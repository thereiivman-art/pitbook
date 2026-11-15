// Orga : supprimer des roulages (en lot dans Orga, ou depuis Gérer) ; les
// inscrits sont prévenus de l'annulation. Fiche du team : tous les roulages.
const { chromium, BASE } = require('../lib');
(async () => {
  const lang = process.argv[2] || 'fr';
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 390, height: 900 }, deviceScaleFactor: 1 }); p.on('pageerror', e => errs.push(e.message));
  p.on('dialog', d => { console.log('confirm:', d.message()); d.accept(); });
  await p.goto(BASE + 'index.html#lang=' + lang + '&role=orga'); await p.waitForTimeout(1600);
  await p.evaluate(() => { const db = firebase.firestore();
    const cs = ['Le Mans', 'Carole', 'Navarra', 'Assen', 'Misano', 'Brno', 'Mas du Clos', 'Clastres', 'Magny Cours', 'Aragón', 'Le Vigeant'];
    cs.forEach((c, i) => { const m = String(1 + i).padStart(2, '0'); db.collection('events').doc('u' + i).set({ id: 'u' + i, teamId: 't1', circuit: c, dateStart: '2027-' + m + '-10', dateEnd: '2027-' + m + '-11', riders: i === 5 ? ['Sam'] : [], eventVisibility: 'public' }); });
    ['2024-05-10', '2025-06-11', '2026-03-12'].forEach((d, i) => db.collection('events').doc('p' + i).set({ id: 'p' + i, teamId: 't1', circuit: 'Carole', dateStart: d, dateEnd: d, riders: ['Alex'], eventVisibility: 'public' }));
  });
  await p.waitForTimeout(500);
  await p.click('.bottom-nav-btn:nth-child(1)'); await p.waitForTimeout(300);
  await p.click('.subnav-btn[data-view="orgaev"]'); await p.waitForTimeout(500);
  await p.click('[data-action="orga-pick-toggle"]'); await p.waitForTimeout(300);
  for (const id of ['u4', 'u5', 'u7']) { await p.click('[data-orga-pick="' + id + '"]'); await p.waitForTimeout(150); }
  const bar = await p.$eval('[data-action="orga-pick-delete"]', e => e.innerText); console.log('barre:', bar);
  if (!/Supprimer \(3\)/.test(bar)) process.exitCode = 1;
  await p.evaluate(() => window.scrollTo(0, 0)); await p.screenshot({ path: __dirname + '/../traces/orga-suppression.png' });
  await p.click('[data-action="orga-pick-delete"]'); await p.waitForTimeout(800);
  const left = await p.evaluate(() => Object.keys(window.__MOCK_DATA.events).sort().join(','));
  const dec = await p.evaluate(() => Object.values(window.__MOCK_DATA.eventDecisions || {}).map(d => d.to + ':' + d.decision + ':' + d.circuit).join(','));
  console.log('restants:', left, '| prévenus:', dec);
  if (/u4|u5|u7/.test(left) || !/u3/.test(left) || dec !== 'Sam:cancelled:Brno') process.exitCode = 1;
  // Depuis Gérer : bouton Supprimer en tête.
  await p.click('[data-action="orga-manage"][data-id="u0"]'); await p.waitForTimeout(600);
  await p.click('[data-action="evm-delete"]'); await p.waitForTimeout(700);
  const left2 = await p.evaluate(() => Object.keys(window.__MOCK_DATA.events).join(','));
  console.log('après Gérer:', /u0/.test(left2) ? 'encore là' : 'supprimé');
  if (/u0\b/.test(left2)) process.exitCode = 1;
  // Fiche du team : visiteur (Mototeam95 = t2 ; on teste Team Piste en visiteur via un autre compte n'est pas simple) -> responsable : liste complète.
  await p.click('.bottom-nav-btn:nth-child(1)'); await p.waitForTimeout(300);
  await p.click('.subnav-btn[data-view="team"]'); await p.waitForTimeout(400);
  await p.getByText('Team Piste').first().click(); await p.waitForTimeout(800);
  await p.click('[data-team-tab="bientot"]'); await p.waitForTimeout(400);
  const sec = await p.$eval('[data-team-sec="bientot"]', e => e.innerText);
  console.log('fiche:', (sec.match(/À venir \(\d+\)|Passés \(\d+\)|Prochaines dates/g) || []).join(' | '));
  if (/Prochaines dates/.test(sec) || !/À venir \(7\)/.test(sec) || !/Passés \(3\)/.test(sec)) process.exitCode = 1;
  console.log('largeur', await p.evaluate(() => document.documentElement.scrollWidth));
  console.log('errs', JSON.stringify(errs)); if (errs.length) process.exitCode = 1;
  await b.close();
})();
