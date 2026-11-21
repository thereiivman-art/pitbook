// Calendrier 2027 du Mototeam95 relevé sur billetweb : posé une fois depuis
// la session admin, sans écraser ce que l'orga a déjà rempli.
const { chromium, BASE } = require('../lib');
(async () => {
  const lang = process.argv[2] || 'fr';
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 390, height: 1000 }, deviceScaleFactor: 1 }); p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + 'index.html#lang=' + lang + '&admin=1'); await p.waitForTimeout(1600);
  await p.evaluate(() => {
    localStorage.removeItem('cdp-seed-mt95-billetweb-2026-11-21');
    const db = firebase.firestore(), T = 'mtis6p71tnm01w';
    db.collection('events').doc('nav').set({ id: 'nav', teamId: T, circuit: 'Navarra', dateStart: '2027-04-23', dateEnd: '2027-04-25', riders: ['Xav'], note: '~529 €', eventVisibility: 'public' });
    db.collection('events').doc('car').set({ id: 'car', teamId: T, circuit: 'Carole', dateStart: '2027-03-27', dateEnd: '2027-03-28', riders: [], note: '119 €/jour (1 ou 2 j) · sam 27 : fête du club', eventVisibility: 'public' });
    db.collection('events').doc('lmo').set({ id: 'lmo', teamId: T, circuit: 'Le Mans', dateStart: '2027-10-07', dateEnd: '2027-10-08', riders: [], note: '~419 € · circuit MotoGP', eventVisibility: 'public' });
    db.collection('events').doc('ass').set({ id: 'ass', teamId: T, circuit: 'Assen', dateStart: '2027-05-11', dateEnd: '2027-05-12', riders: [], note: 'note de l\'orga', practicalInfo: 'Texte de l\'orga', eventVisibility: 'public' });
    db.collection('events').doc('aut').set({ id: 'aut', teamId: 'autre', circuit: 'Le Mans', dateStart: '2027-03-15', dateEnd: '2027-03-16', riders: [] });
  });
  await p.waitForTimeout(1500);
  const ev = await p.evaluate(() => JSON.parse(JSON.stringify(window.__MOCK_DATA.events)));
  const g = id => ev[id] || {};
  console.log('nav', g('nav').dateStart, g('nav').dateEnd, g('nav').bookingUrl);
  console.log('car', g('car').dateEnd, g('car').note, '|', g('car').specialActivities);
  console.log('lmo', g('lmo').note, '|', (g('lmo').practicalInfo || '').slice(0, 60), '|', g('lmo').rentalMotos ? 'loc' : '');
  console.log('ass', g('ass').practicalInfo, '|', g('ass').note, '|', g('ass').travelUrl);
  console.log('aut', JSON.stringify(g('aut')));
  const ok = g('nav').dateStart === '2027-04-16' && g('nav').dateEnd === '2027-04-18' && /navarra-2027/.test(g('nav').bookingUrl) && (g('nav').riders || []).join() === 'Xav'
    && g('car').dateEnd === '2027-03-29' && /1 à 3 j/.test(g('car').note) && /Fête du club/.test(g('car').specialActivities || '')
    && g('lmo').note === '~399 € · circuit MotoGP' && /399 €/.test(g('lmo').practicalInfo || '') && g('lmo').rentalMotos
    && g('ass').practicalInfo === 'Texte de l\'orga' && g('ass').note === 'note de l\'orga' && /ttcircuit/.test(g('ass').travelUrl || '') && /assen3/.test(g('ass').bookingUrl || '')
    && !g('aut').bookingUrl && !g('aut').practicalInfo;
  if (!ok) process.exitCode = 1;
  // Une seule fois : l'orga modifie ensuite, rien n'est reposé.
  await p.evaluate(() => firebase.firestore().collection('events').doc('lmo').set({ practicalInfo: null, note: '~419 € · circuit MotoGP' }, { merge: true }));
  await p.waitForTimeout(800);
  const again = await p.evaluate(() => window.__MOCK_DATA.events.lmo);
  console.log('ensuite', again.note, again.practicalInfo);
  if (again.note !== '~419 € · circuit MotoGP' || again.practicalInfo) process.exitCode = 1;
  console.log('errs', JSON.stringify(errs)); if (errs.length) process.exitCode = 1;
  await b.close();
})();
