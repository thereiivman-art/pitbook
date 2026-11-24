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
  // Pastille de Barcelone : Prévu -> Réservé, sans ouvrir la fiche.
  await p.click('.outing-row[data-outing-event="e1"] .book-chip'); await p.waitForTimeout(400);
  const stay = !(await p.$('.outing-title')); console.log('reste sur la liste:', stay); if (!stay) fail('la pastille a ouvert la fiche');
  const s1 = await sum(); console.log('après:', s1); if (!/^1 réservé · \d+ prévus?$/i.test(s1)) fail('résumé');
  const st = await p.evaluate(() => JSON.stringify(window.__MOCK_DATA.users.u1.booked || {})); console.log('enregistré:', st); if (!/"e1":true/.test(st)) fail('enregistrement');
  // Fiche de Misano (2 jours) : Réservé, puis seulement le 1er jour.
  await p.evaluate(() => { const r = document.querySelector('[data-outing-event="e6"]'); if (r) r.click(); }); await p.waitForTimeout(800);
  await p.click('[data-book-set="booked"]'); await p.waitForTimeout(300);
  const days = await p.$$eval('.book-day', e => e.map(x => (x.classList.contains('on') ? '*' : '') + x.innerText)); console.log('jours:', days.join(' / '));
  if (days.length !== 2 || days.some(d => d[0] !== '*')) fail('jours');
  await p.click('.book-day:nth-of-type(2)'); await p.waitForTimeout(300);
  const st2 = await p.evaluate(() => JSON.stringify((window.__MOCK_DATA.users.u1.booked || {}).e6)); console.log('Misano:', st2); if (!/^\["\d{4}-\d\d-\d\d"\]$/.test(st2)) fail('un seul jour');
  // Le prix ne chevauche plus les jours réservés.
  const overlap = await p.evaluate(() => { const a = document.querySelector('.book-card'), b = document.querySelector('.event-price-line'); if (!a || !b) return 'pas de prix'; return b.getBoundingClientRect().top < a.getBoundingClientRect().bottom ? 'chevauche' : 'ok'; });
  console.log('prix sous les jours:', overlap); if (overlap === 'chevauche') fail('chevauchement');
  await p.screenshot({ path: __dirname + '/../.sortie/reserve-prevu-fiche-' + lang + '.png' });
  await goList();
  const r2 = await rows(); console.log('liste:', r2.join(' ; '));
  if (!r2.some(x => /^Misano.*\[✓?\s*RÉSERVÉ\].*réservé /i.test(x.replace(/\n/g, ' ')))) fail('jours réservés dans la liste');
  console.log('résumé:', await sum());
  await p.screenshot({ path: __dirname + '/../.sortie/reserve-prevu-liste-' + lang + '.png' });
  // Ma page › Roulages : les mêmes pastilles.
  await p.evaluate(() => window.scrollTo(0, 0)); await p.click('#header-me'); await p.waitForTimeout(700);
  await p.click('.mp-tabs [data-mp-tab="bientot"]').catch(() => {}); await p.waitForTimeout(400);
  const mp = await p.evaluate(() => { const s = [...document.querySelectorAll('[data-mp-sec="bientot"]')].find(x => !x.hidden) || document; return [...s.querySelectorAll('.feed-upcoming-row')].map(r => r.querySelector('strong').innerText.split(' ')[0] + ' [' + ((r.querySelector('.book-chip') || {}).innerText || '-') + ']').join(' ; ') + ' | ' + ((s.querySelector('.book-summary') || {}).innerText || '').replace(/\n+/g, ' · '); });
  console.log('Ma page:', mp); if (!/Barcelone \[✓?\s*RÉSERVÉ\]/i.test(mp) || !/Jerez \[PRÉVU\]/i.test(mp) || !/2 réservés/i.test(mp)) fail('Ma page');
  await p.screenshot({ path: __dirname + '/../.sortie/reserve-prevu-mapage-' + lang + '.png' });
  // Page d'un team : mon statut sur ses roulages où je suis inscrit, modifiable d'un toucher.
  await p.evaluate(() => firebase.firestore().collection('events').doc('e1').set({ teamId: 't1' }, { merge: true })); await p.waitForTimeout(300);
  await p.evaluate(() => window.scrollTo(0, 0)); await p.click('.bottom-nav-btn:nth-child(1)'); await p.waitForTimeout(300);
  await p.click('.subnav-btn[data-view="team"]'); await p.waitForTimeout(400);
  await p.getByText('Team Piste').first().click(); await p.waitForTimeout(800);
  await p.click('[data-team-tab="roulages"], [data-team-sec-tab="bientot"], .team-tab:has-text("Roulages")').catch(() => {}); await p.waitForTimeout(300);
  const teamRow = async () => p.evaluate(() => { const r = [...document.querySelectorAll('.ph-date[data-id="e1"], .event-row[data-event-id="e1"]')].find(x => x.offsetParent); return r ? r.innerText.replace(/\n+/g, ' | ') : 'absent'; });
  const t1 = await teamRow(); console.log('team, Barcelone:', t1); if (!/RÉSERVÉ/i.test(t1)) fail('statut sur la page du team');
  await p.evaluate(() => { const c = [...document.querySelectorAll('.ph-date[data-id="e1"] [data-booked-toggle], .event-row[data-event-id="e1"] [data-booked-toggle]')].find(x => x.offsetParent); if (c) c.click(); }); await p.waitForTimeout(400);
  const t2 = await teamRow(); console.log('après un toucher:', t2); if (!/PRÉVU/i.test(t2) || await p.$('.outing-title')) fail('bascule depuis la page du team');
  await p.screenshot({ path: __dirname + '/../.sortie/reserve-prevu-team-' + lang + '.png' });
  console.log('errs', JSON.stringify(errs)); await b.close(); if (errs.length) process.exit(1);
})();
