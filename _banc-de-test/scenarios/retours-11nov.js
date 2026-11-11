// Retours d'Alexis du 11 nov : Mon compte dans l'en-tête (mobile), QR dans Mon compte, site officiel sous le prochain roulage, bulles d'infos ouvertes,
// Quoi de neuf entre Ma fiche et Mes publications, Horaires seulement si je participe, liens cliquables en message, plus de texte « Tape au moins 2 lettres ».
const { chromium, BASE } = require('../lib');
(async () => {
  const lang = process.argv[2] || 'fr';
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 380, height: 900 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + 'index.html#lang=' + lang); await p.waitForTimeout(1800);
  const vis = id => p.$eval('#' + id, e => !!e.offsetParent).catch(() => false);
  console.log('en-tête mobile: compte', await vis('settings-side'), '| invitation QR cachée', !(await vis('invite-qr-btn')), '| messages', await vis('messages-toggle'));
  await p.click('#settings-side'); await p.waitForTimeout(500);
  console.log('Mon compte: ligne Inviter', !!(await p.$('#invite-qr-row')), '| petit QR en haut à droite', !!(await p.$('.heading-qr')));
  await p.click('.heading-qr'); await p.waitForTimeout(500); console.log('QR ouvert:', !!(await p.$('.invite-qr-modal')));
  await p.evaluate(() => document.querySelectorAll('.crop-modal-overlay').forEach(o => o.remove()));
  // Ma page : ordre
  await p.click('#header-me'); await p.waitForTimeout(500);
  const order = await p.evaluate(() => { const q = s => { const e = document.querySelector(s); return e ? e.getBoundingClientRect().top + scrollY : -1; }; return { fiche: q('.mypage-fiche'), composer: q('.mypage-composer'), posts: q('.mypage-composer ~ *') }; });
  console.log('Quoi de neuf entre fiche et publications:', order.fiche < order.composer && order.composer < order.posts);
  // Circuit Infos
  await p.click('.bottom-nav-btn:nth-child(1)'); await p.waitForTimeout(300); await p.click('.subnav-btn[data-view="circuit"]'); await p.waitForTimeout(500);
  await p.click('[data-pill-group="circuit"][data-pill="infos"]').catch(() => {}); await p.waitForTimeout(600);
  const rows = await p.$$eval('.circuit-info-list .info-row, .circuit-info-list > div', e => e.map(x => x.innerText.replace(/\n+/g, ' ').slice(0, 40)));
  const iNext = rows.findIndex(r => /Prochain/i.test(r)), iSite = rows.findIndex(r => /Site officiel|Chercher le site/i.test(r));
  console.log('site officiel juste sous le prochain roulage:', iNext >= 0 && iSite === iNext + 1, '| bulles ouvertes:', await p.$$eval('.info-bubble-body', e => e.length), '/', await p.$$eval('.info-bubble', e => e.length));
  await p.click('.info-bubble:last-child').catch(() => {}); await p.waitForTimeout(500);
  // Roulage où je ne suis pas : pas d'Horaires
  await p.click('.subnav-btn[data-view="carnet"]'); await p.waitForTimeout(400);
  const other = await p.$('.event-row[data-event-id="e9"], [data-event-id="e9"]');
  if (other) { await other.click(); await p.waitForTimeout(600); console.log('roulage sans moi, onglets:', await p.$$eval('.outing-tabs .pill-btn', e => e.map(x => x.innerText || x.getAttribute('aria-label')).join(' / '))); } else console.log('roulage e9 introuvable');
  // Message avec lien
  await p.click('#messages-toggle'); await p.waitForTimeout(400);
  await p.evaluate(() => { document.querySelectorAll('.crop-modal-overlay').forEach(o => o.remove()); });
  let conv = await p.$('.dm-conv:not(.dm-notif-row)'); if (!conv) { await p.click('[data-action="dm-new"]'); await p.waitForTimeout(300); await p.click('[data-dm-pick]:not([data-dm-pick^="team:"])'); await p.click('#dm-pick-go'); await p.waitForTimeout(500); conv = true; } else await conv.click(); if (conv) { await p.waitForTimeout(400); await p.fill('#dm-text', 'Regarde https://www.rehmracedays.com/ ok ?'); await p.press('#dm-text', 'Enter').catch(() => {}); await p.click('#dm-form button[type="submit"]').catch(() => {}); await p.waitForTimeout(700);
    console.log('lien cliquable en message:', await p.$$eval('.dm-bubble a.dm-link', e => e.map(x => x.getAttribute('href') + ' ' + x.target).join(' | '))); } else console.log('aucune conversation dans le banc');
  // recherche sans texte d'aide
  await p.click('#search-toggle'); await p.waitForTimeout(400);
  console.log('recherche vide sans « Tape au moins » :', !(await p.$('.gsearch-hint')));
  console.log('errs', JSON.stringify(errs)); await b.close();
  if (errs.length) process.exit(1);
})();
