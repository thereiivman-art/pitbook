// Team leader : heure du briefing par roulage et par jour (Gérer › Horaires), affichée sur la fiche.
// Barcelone : jeudi 26 novembre à 8h15 (posé une fois depuis le compte admin).
const { chromium, BASE } = require('../lib');
(async () => {
  const b = await chromium.launch(); const errs = [];
  const fail = (m) => { console.log('ÉCHEC', m); process.exitCode = 1; };
  const p = await b.newPage({ viewport: { width: 390, height: 900 }, deviceScaleFactor: 2 }); p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + 'index.html#lang=fr&admin=1&bcn=1'); await p.waitForTimeout(5000);
  const st = await p.evaluate(() => { const e = window.__MOCK_DATA.events.eBcn; return JSON.stringify(e.briefingByDate || null) + ' | ' + /8h15/.test(e.scheduleNote || '') + ' | 8h30: ' + /8h30/.test(e.scheduleNote || ''); });
  console.log('Barcelone:', st); if (!/"2026-11-26":"8h15"/.test(st) || /8h30: true/.test(st)) fail('briefing Barcelone 8h15');
  await p.click('.bottom-nav-btn:nth-child(1)'); await p.waitForTimeout(400);
  await p.click('[data-outing-event="eBcn"]'); await p.waitForTimeout(600);
  await p.click('[data-hor-day="2026-11-26"]').catch(() => {}); await p.waitForTimeout(300);
  const brf = await p.$eval('.today-schedule-briefing', e => e.innerText.replace(/\n+/g, ' ')).catch(() => 'absent'); console.log('fiche jeudi:', brf);
  if (!/8\s*h\s*15|8:15/i.test(brf)) fail('briefing affiché sur la fiche');
  await p.evaluate(() => { const x = document.querySelector('.today-schedule-briefing'); if (x) x.scrollIntoView({ block: 'center' }); });
  await p.screenshot({ path: __dirname + '/../.sortie/briefing-fiche.png' });
  // Gérer › Horaires › vendredi : 8h00.
  await p.evaluate(() => window.scrollTo(0, 0));
  await p.click('[data-action="manage-from-outing"]'); await p.waitForTimeout(500);
  await p.click('[data-pill-group="evmanage"][data-pill="horaires"]'); await p.waitForTimeout(400);
  await p.click('[data-evm-day="2026-11-27"]'); await p.waitForTimeout(300);
  await p.fill('#evm-briefing', '8h00');
  await p.screenshot({ path: __dirname + '/../.sortie/briefing-gerer.png' });
  await p.click('[data-action="evm-horaires-save"]'); await p.waitForTimeout(600);
  const st2 = await p.evaluate(() => JSON.stringify(window.__MOCK_DATA.events.eBcn.briefingByDate || null)); console.log('après:', st2);
  if (!/"2026-11-26":"8h15"/.test(st2) || !/"2026-11-27":"8h00"/.test(st2)) fail('briefing du vendredi');
  await p.click('[data-evm-day="2026-11-26"]'); await p.waitForTimeout(300);
  const v = await p.$eval('#evm-briefing', e => e.value); console.log('champ jeudi:', v); if (v !== '8h15') fail('champ du jeudi');
  console.log('errs', JSON.stringify(errs)); if (errs.length) process.exitCode = 1;
  await b.close();
})();
