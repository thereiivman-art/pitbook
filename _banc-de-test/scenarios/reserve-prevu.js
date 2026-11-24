// Carnet › Roulages › À venir : Réservé / Prévu visible d'un coup d'œil.
// Un toucher sur la pastille bascule ; sur la fiche, Prévu / Réservé et les
// jours réservés d'un roulage de plusieurs jours (ex. 27–28 sur 27–29).
const { chromium, BASE } = require('../lib');
(async () => {
  const lang = process.argv[2] || 'fr';
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }); p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + 'index.html#lang=' + lang); await p.waitForTimeout(1600);
  const fail = (m) => { console.log('ÉCHEC', m); process.exitCode = 1; };
  const goList = async () => { await p.evaluate(() => window.scrollTo(0, 0)); await p.click('.bottom-nav-btn:nth-child(1)'); await p.waitForTimeout(300); await p.click('[data-cards-mode="avenir"]:visible').catch(() => {}); await p.waitForTimeout(300); };
  await p.evaluate(() => firebase.firestore().collection('events').doc('e6').set({ note: '~240 €' }, { merge: true })); await p.waitForTimeout(300);
  await goList();
  const rows = () => p.$$eval('.outing-row[data-outing-event]', e => e.map(x => x.querySelector('strong').innerText + ' [' + ((x.querySelector('.book-chip') || {}).innerText || '-') + '] ' + x.querySelector('.help-text').innerText));
  const sum = () => p.$eval('.book-summary', e => e.innerText.replace(/\n+/g, ' · ')).catch(() => 'absent');
  console.log('avant:', await sum(), '|', (await rows()).join(' ; '));
  // Bouton de Barcelone : ouvre Ma réservation (pas de bascule d'un toucher), sans ouvrir la fiche.
  await p.click('.outing-row[data-outing-event="e1"] .book-chip'); await p.waitForTimeout(400);
  const stay = !(await p.$('.outing-title')); console.log('reste sur la liste:', stay); if (!stay) fail('le bouton a ouvert la fiche');
  const s0 = await sum(); if (!/^0\sréservé/i.test(s0)) fail('un toucher a changé le statut');
  if (!(await p.$('#mini-sheet [data-book-set="booked"]'))) fail('pop-up absente depuis la liste');
  await p.click('#mini-sheet [data-book-set="booked"]'); await p.waitForTimeout(300); await p.click('#mini-sheet [data-mini-close]'); await p.waitForTimeout(200);
  const s1 = await sum(); console.log('après:', s1); if (!/^1\sréservé · \d+\sprévus?$/i.test(s1)) fail('résumé');
  const st = await p.evaluate(() => JSON.stringify(window.__MOCK_DATA.users.u1.booked || {})); console.log('enregistré:', st); if (!/"e1":true/.test(st)) fail('enregistrement');
  // Fiche de Misano (2 jours) : Réservé, puis seulement le 1er jour.
  await p.evaluate(() => { const r = document.querySelector('[data-outing-event="e6"]'); if (r) r.click(); }); await p.waitForTimeout(800);
  // Un seul bouton sur la fiche ; Ma réservation s'ouvre en pop-up.
  const ob = await p.$eval('[data-book-open]', e => e.innerText).catch(() => 'absent'); console.log('bouton fiche:', ob); if (!/PRÉVU/i.test(ob)) fail('bouton Prévu sur la fiche');
  // Les boutons de la fiche ne se chevauchent pas.
  const chev = await p.evaluate(() => { const bs = [...document.querySelectorAll('.outing-actions-icons > *')].map(x => x.getBoundingClientRect()); for (let i = 0; i < bs.length; i++) for (let j = i + 1; j < bs.length; j++) { const a = bs[i], b = bs[j]; if (a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1) return 'chevauche'; } return 'ok'; });
  console.log('boutons:', chev); if (chev !== 'ok') fail('boutons qui se chevauchent');
  if (await p.$('.outing-actions ~ .book-card, .book-card:not(.book-sheet .book-card)')) fail('cadre encore dans la fiche');
  await p.click('[data-book-open]'); await p.waitForTimeout(300);
  await p.click('[data-book-set="booked"]'); await p.waitForTimeout(300);
  const days = await p.$$eval('.book-day', e => e.map(x => (x.classList.contains('on') ? '*' : '') + x.innerText)); console.log('jours:', days.join(' / '));
  if (days.length !== 2 || days.some(d => d[0] !== '*')) fail('jours');
  await p.click('.book-day:nth-of-type(2)'); await p.waitForTimeout(300);
  const st2 = await p.evaluate(() => JSON.stringify((window.__MOCK_DATA.users.u1.booked || {}).e6)); console.log('Misano:', st2); if (!/^\["\d{4}-\d\d-\d\d"\]$/.test(st2)) fail('un seul jour');
  await p.screenshot({ path: __dirname + '/../.sortie/reserve-prevu-fiche-' + lang + '.png' });
  await p.click('#mini-sheet [data-mini-close]'); await p.waitForTimeout(200);
  const ob2 = await p.$eval('[data-book-open]', e => e.innerText).catch(() => 'absent'); console.log('bouton après:', ob2); if (!/RÉSERVÉ/i.test(ob2)) fail('bouton Réservé sur la fiche');
  await goList();
  const r2 = await rows(); console.log('liste:', r2.join(' ; '));
  if (!r2.some(x => /^Misano.*\[RÉSERVÉ\s23\]/i.test(x.replace(/\n/g, ' ')))) fail('jours réservés dans le bouton');
  if (r2.some(x => /·\sréservé/i.test(x))) fail('jours réservés encore dans la ligne');
  console.log('résumé:', await sum());
  await p.screenshot({ path: __dirname + '/../.sortie/reserve-prevu-liste-' + lang + '.png' });
  // Ma page › Roulages : les mêmes pastilles.
  await p.evaluate(() => window.scrollTo(0, 0)); await p.click('#header-me'); await p.waitForTimeout(700);
  await p.click('.mp-tabs [data-mp-tab="bientot"]').catch(() => {}); await p.waitForTimeout(400);
  const mp = await p.evaluate(() => { const s = [...document.querySelectorAll('[data-mp-sec="bientot"]')].find(x => !x.hidden) || document; return [...s.querySelectorAll('.feed-upcoming-row')].map(r => r.querySelector('strong').innerText.split(' ')[0] + ' [' + ((r.querySelector('.book-chip') || {}).innerText || '-') + ']').join(' ; ') + ' | ' + ((s.querySelector('.book-summary') || {}).innerText || '').replace(/\n+/g, ' · '); });
  // Le bouton est entre le nom et le tracé, sur la même ligne.
  const al = await p.evaluate(() => { const r = [...document.querySelectorAll('.feed-upcoming-row')].find(x => x.offsetParent); const c = r.querySelector('.book-chip').getBoundingClientRect(), m = r.querySelector('.feed-upcoming-main').getBoundingClientRect(), t = r.querySelector('.outing-thumb').getBoundingClientRect(); return c.left >= m.right - 1 && c.right <= t.left + 1 && c.top < t.bottom && c.bottom > t.top ? 'ok' : JSON.stringify([m.right, c.left, c.right, t.left]); });
  console.log('alignement Ma page:', al); if (al !== 'ok') fail('bouton entre le nom et le tracé');
  console.log('Ma page:', mp); if (!/Barcelone \[RÉSERVÉ\]/i.test(mp) || !/Misano \[RÉSERVÉ\s23\]/i.test(mp) || !/Jerez \[PRÉVU\]/i.test(mp) || !/2\sréservés/i.test(mp)) fail('Ma page');
  await p.screenshot({ path: __dirname + '/../.sortie/reserve-prevu-mapage-' + lang + '.png' });
  // Page d'un team : mon statut sur ses roulages où je suis inscrit, modifiable d'un toucher.
  await p.evaluate(() => firebase.firestore().collection('events').doc('e1').set({ teamId: 't1' }, { merge: true })); await p.waitForTimeout(300);
  await p.evaluate(() => window.scrollTo(0, 0)); await p.click('.bottom-nav-btn:nth-child(1)'); await p.waitForTimeout(300);
  await p.click('.subnav-btn[data-view="team"]'); await p.waitForTimeout(400);
  await p.getByText('Team Piste').first().click(); await p.waitForTimeout(800);
  await p.click('[data-team-tab="roulages"], [data-team-sec-tab="bientot"], .team-tab:has-text("Roulages")').catch(() => {}); await p.waitForTimeout(300);
  const teamRow = async () => p.evaluate(() => { const r = [...document.querySelectorAll('.ph-date[data-id="e1"], .event-row[data-event-id="e1"]')].find(x => x.offsetParent); return r ? r.innerText.replace(/\n+/g, ' | ') : 'absent'; });
  const t1 = await teamRow(); console.log('team, Barcelone:', t1); if (!/RÉSERVÉ/i.test(t1)) fail('statut sur la page du team');
  await p.evaluate(() => { const c = [...document.querySelectorAll('.ph-date[data-id="e1"] [data-book-open], .event-row[data-event-id="e1"] [data-book-open]')].find(x => x.offsetParent); if (c) c.click(); }); await p.waitForTimeout(400);
  await p.click('#mini-sheet [data-book-set="planned"]'); await p.waitForTimeout(300); await p.click('#mini-sheet [data-mini-close]'); await p.waitForTimeout(200);
  // Le nom du circuit n'est pas écrasé par la colonne de droite.
  const squeeze = await p.evaluate(() => { const r = [...document.querySelectorAll('.event-row[data-event-id="e1"]')].find(x => x.offsetParent); if (!r) return 'ok'; const c = r.querySelector('.event-row-circuit'); return c.getBoundingClientRect().height < 40 ? 'ok' : 'nom coupé'; });
  console.log('nom du circuit:', squeeze); if (squeeze !== 'ok') fail('nom du circuit écrasé');
  const t2 = await teamRow(); console.log('après un toucher:', t2); if (!/PRÉVU/i.test(t2) || await p.$('.outing-title')) fail('bascule depuis la page du team');
  await p.screenshot({ path: __dirname + '/../.sortie/reserve-prevu-team-' + lang + '.png' });
  console.log('errs', JSON.stringify(errs)); await b.close(); if (errs.length) process.exit(1);
})();
