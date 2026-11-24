// Page d'un ami › À venir : ses roulages, même organisés par un team dont je
// ne suis pas (réservé aux membres) ; ceux d'un non-ami restent cachés.
const { chromium, BASE } = require('../lib');
(async () => {
  const lang = process.argv[2] || 'fr';
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 390, height: 900 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + 'index.html#lang=' + lang); await p.waitForTimeout(1600);
  await p.evaluate(() => { const db = firebase.firestore();
    db.collection('teams').doc('tx').set({ id: 'tx', name: 'Club Ailleurs', visibility: 'all' });
    db.collection('events').doc('ex1').set({ id: 'ex1', teamId: 'tx', circuit: 'Lédenon', dateStart: '2027-05-10', dateEnd: '2027-05-10', riders: ['Sam'] });
    db.collection('users').doc('u2').set({ booked: { ex1: true } }, { merge: true });
    db.collection('events').doc('ex2').set({ id: 'ex2', teamId: 'tx', circuit: 'Albi', dateStart: '2027-06-10', dateEnd: '2027-06-10', riders: ['Luca'] });
  });
  await p.waitForTimeout(500);
  const upcomingOf = async (name) => {
    await p.evaluate(() => window.scrollTo(0, 0)); await p.click('.bottom-nav-btn:nth-child(3)'); await p.waitForTimeout(500);
    const sel = '.feed-card .wall-post-head .mini-avatar[data-person="' + name + '"]';
    if (await p.$(sel)) await p.click(sel);
    else await p.evaluate((n) => { const b = [...document.querySelectorAll('[data-person-link="' + n + '"], [data-name="' + n + '"], [data-open-person="' + n + '"], [data-person="' + n + '"]')]; const v = b.find(x => x.offsetParent) || b[0]; if (v) v.click(); }, name);
    await p.waitForTimeout(700);
    console.log('  onglets:', await p.$$eval('.mp-tabs .team-tab, .mp-tabs [data-mp-tab]', e => e.map(x => x.getAttribute('data-mp-tab')).join(',')).catch(() => '?'), '| titre:', await p.$eval('.person-name', e => e.innerText).catch(() => '?'));
    await p.click('.mp-tabs [data-mp-tab="bientot"]').catch(() => {}); await p.waitForTimeout(300);
    return p.evaluate(() => { const s = [...document.querySelectorAll('[data-mp-sec="bientot"]')].find(x => !x.hidden); return s ? s.innerText.replace(/\n+/g, ' | ') : (document.querySelector('.feed-upcoming') || {}).innerText || 'pas d\'onglet'; });
  };
  const sam = await upcomingOf('Sam'); console.log('À venir de Sam (ami):', sam.slice(0, 200));
  if (!/Lédenon/.test(sam)) process.exitCode = 1;
  // Statut de Sam visible (lecture seule) : Lédenon réservé, le reste prévu.
  const chips = await p.evaluate(() => { const s = [...document.querySelectorAll('[data-mp-sec="bientot"]')].find(x => !x.hidden) || document; return [...s.querySelectorAll('.feed-upcoming-row')].map(r => r.querySelector('strong').innerText.split(' ')[0] + '=' + ((r.querySelector('.book-chip') || {}).innerText || '-') + (r.querySelector('[data-booked-toggle]') ? '(modifiable)' : '')).join(' ; ') + ' | ' + ((s.querySelector('.book-summary') || {}).innerText || '').replace(/\n+/g, ' · '); });
  console.log('statut de Sam:', chips);
  if (!/Lédenon=.*RÉSERVÉ/i.test(chips) || /modifiable/.test(chips) || !/1\sréservé/i.test(chips)) process.exitCode = 1;
  // Le roulage s'ouvre.
  await p.evaluate(() => { const r = document.querySelector('[data-outing-event="ex1"]'); if (r) r.click(); }); await p.waitForTimeout(700);
  const t = await p.$eval('.outing-title', e => e.innerText).catch(() => 'non'); console.log('ouvert:', t); if (!/LÉDENON|Lédenon/i.test(t)) process.exitCode = 1;
  const luca = await upcomingOf('Luca'); console.log('À venir de Luca (pas ami):', luca.slice(0, 160));
  // Par défaut « mes amis » : un non-ami ne voit pas l'onglet À venir (ni Albi).
  if (/Albi/.test(luca) || luca !== 'pas d\'onglet') process.exitCode = 1;
  console.log('errs', JSON.stringify(errs)); await b.close(); if (errs.length) process.exit(1);
})();
