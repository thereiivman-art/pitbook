// Orga : retirer un inscrit demande une confirmation ; accepter, mettre en
// attente, refuser ou retirer prévient l'inscrit (eventDecisions).
const { chromium, BASE } = require('../lib');
(async () => { const b = await chromium.launch(); const errs = []; const dialogs = [];
  const o = await b.newPage({ viewport: { width: 390, height: 900 } }); o.on('pageerror', e => errs.push(e.message));
  let answer = false; o.on('dialog', d => { dialogs.push(d.message()); answer ? d.accept() : d.dismiss(); });
  await o.goto(BASE + 'index.html#lang=fr&role=orga'); await o.waitForTimeout(1500);
  await o.evaluate(() => { const d = new Date(Date.now() + 5 * 864e5), k = d.toISOString().slice(0, 10), db = firebase.firestore();
    db.collection('events').doc('evd').set({ id: 'evd', circuit: 'Mugello', dateStart: k, dateEnd: k, teamId: 't1', riders: ['Sam'], eventVisibility: 'membre' });
    db.collection('eventJoinRequests').doc('evd_Tom').set({ eventId: 'evd', teamId: 't1', circuit: 'Mugello', from: 'Tom', status: 'pending' }); });
  await o.waitForTimeout(500);
  await o.click('.bottom-nav-btn:nth-child(1)'); await o.waitForTimeout(300);
  await o.click('.subnav-btn[data-view="orgaev"]').catch(() => {}); await o.waitForTimeout(400);
  await o.click('.orga-ev-row [data-action="orga-manage"][data-id="evd"]'); await o.waitForTimeout(600);
  const rm = '[data-action="team-event-remove-rider"][data-rider="Sam"]';
  console.log('bouton retirer:', !!(await o.$(rm)), '| attente:', !!(await o.$('[data-action="event-join-request-wait"]')));
  // 1) Annuler : Sam reste.
  await o.click(rm); await o.waitForTimeout(300);
  let riders = await o.evaluate(() => window.__MOCK_DATA.events.evd.riders.join());
  console.log('confirmation:', dialogs[0], '| annulé ->', riders); if (!/Sam/.test(riders) || !dialogs.length) process.exitCode = 1;
  // 2) Confirmer : Sam retiré et prévenu.
  answer = true; await o.click(rm); await o.waitForTimeout(500);
  riders = await o.evaluate(() => window.__MOCK_DATA.events.evd.riders.join());
  // 3) Demande de Tom : attente, puis acceptée.
  await o.click('[data-action="event-join-request-wait"]'); await o.waitForTimeout(400);
  const st = await o.evaluate(() => window.__MOCK_DATA.eventJoinRequests.evd_Tom.status);
  await o.click('[data-action="event-join-request-accept"]'); await o.waitForTimeout(500);
  const dec = await o.evaluate(() => Object.values(window.__MOCK_DATA.eventDecisions || {}).map(d => d.to + ':' + d.decision).join(', '));
  console.log('après:', riders, '| statut Tom:', st, '| décisions:', dec);
  if (/Sam/.test(riders) || st !== 'waiting' || !/Sam:removed/.test(dec) || !/Tom:waiting/.test(dec) || !/Tom:accepted/.test(dec)) process.exitCode = 1;
  // Côté inscrit (Alex reçoit une décision) : visible dans Notifications.
  await o.evaluate(() => firebase.firestore().collection('eventDecisions').doc('dx').set({ eventId: 'evd', circuit: 'Mugello', dateStart: '2026-11-20', to: 'Alex', toUid: firebase.auth().currentUser.uid, from: 'Team', fromUid: 'zz', decision: 'refused', createdAt: Date.now() }));
  await o.waitForTimeout(500);
  await o.click('#notifications-toggle').catch(() => {}); await o.waitForTimeout(500);
  const panel = await o.$eval('.notifications-panel', e => e.innerText.replace(/\n+/g, ' | ')).catch(() => 'absent');
  console.log('notifications:', panel.slice(0, 200)); if (!/refusée/.test(panel)) process.exitCode = 1;
  console.log('errs', JSON.stringify(errs)); if (errs.length) process.exitCode = 1; await b.close(); })();
