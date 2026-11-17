// Teams voiture près de Paris (UTAC, LFG, Extrem Cars) posés une fois depuis
// l'admin : catégorie, Team PRO, roulage d'Extrem Cars dans Tous › Voiture.
const { chromium, BASE } = require('../lib');
(async () => {
  const lang = process.argv[2] || 'fr';
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 390, height: 900 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + 'index.html#lang=' + lang + '&admin=1'); await p.waitForTimeout(2500);
  const M = await p.evaluate(() => { const M = window.__MOCK_DATA; return { teams: ['utac-trackdays', 'circuits-lfg', 'extrem-cars'].map(id => M.teams[id] ? [M.teams[id].name, M.teams[id].discipline, !!M.teams[id].teamPro, M.teams[id].visibility].join('|') : 'absent'), ev: M.events['extrem-cars-clastres-2026-11-21'] }; });
  console.log('teams:', M.teams.join(' ; '));
  console.log('roulage:', M.ev && [M.ev.circuit, M.ev.dateStart, M.ev.discipline, M.ev.note].join(' | '));
  if (M.teams.some(t => t === 'absent' || !/\|true\|all$/.test(t)) || !M.ev || M.ev.discipline !== 'auto') process.exitCode = 1;
  // Deuxième passage : rien n'est recréé ni écrasé.
  await p.evaluate(() => { window.__MOCK_DATA.teams['extrem-cars'].description = 'modifié par l\'orga';
    firebase.firestore().collection('events').doc('x').set({ id: 'x', circuit: 'Carole', dateStart: '2027-01-01', dateEnd: '2027-01-01', riders: [] }); });
  await p.waitForTimeout(1500);
  const d = await p.evaluate(() => window.__MOCK_DATA.teams['extrem-cars'].description); console.log('après nouveau passage:', d);
  if (d !== 'modifié par l\'orga') process.exitCode = 1;
  // Échec d'écriture : l'étape et le code s'affichent à l'écran.
  const q = await b.newPage({ viewport: { width: 390, height: 900 } }); q.on('pageerror', e => errs.push(e.message));
  await q.goto(BASE + 'index.html#lang=' + lang + '&admin=1'); await q.waitForTimeout(3000);
  await q.evaluate(() => { const db = firebase.firestore(), col = db.collection.bind(db); db.collection = n => { const c = col(n); if (n !== 'teams') return c; const doc = c.doc.bind(c); c.doc = id => { const d = doc(id); if (/utac/.test(id)) d.set = () => Promise.reject({ code: 'permission-denied' }); return d; }; return c; };
    window.__toasts = []; new MutationObserver(() => document.querySelectorAll('.toast').forEach(t => { if (window.__toasts.indexOf(t.innerText) === -1) window.__toasts.push(t.innerText); })).observe(document.body, { childList: true, subtree: true });
    delete window.__MOCK_DATA.teams['utac-trackdays']; db.collection('events').doc('y').set({ id: 'y', circuit: 'Carole', dateStart: '2027-02-01', dateEnd: '2027-02-01', riders: [] }); });
  await q.waitForTimeout(2000);
  const toast = await q.evaluate(() => window.__toasts.join(' | ')); console.log('message d\'échec:', toast);
  if (!/UTAC Trackdays \(création\).*permission-denied/.test(toast)) process.exitCode = 1;
  console.log('errs', JSON.stringify(errs)); await b.close(); if (errs.length) process.exit(1);
})();
