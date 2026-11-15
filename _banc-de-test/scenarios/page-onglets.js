// Page d'un pilote (Ma page, page d'un ami) en onglets collants comme un
// team : Posts ouvert d'abord, un onglet reste ouvert, Infos pour réseaux et sponsors.
const { chromium, BASE } = require('../lib');
(async () => {
  const lang = process.argv[2] || 'fr';
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 390, height: 900 }, deviceScaleFactor: 2 }); p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + 'index.html#lang=' + lang); await p.waitForTimeout(2000);
  await p.click('#header-me'); await p.waitForTimeout(700);
  const tabs = () => p.$$eval('.mp-tabs .team-tab', e => e.map(x => (x.classList.contains('on') ? '*' : '') + x.innerText).join(' / '));
  const vis = () => p.$$eval('[data-mp-sec]', e => [...new Set(e.filter(x => !x.hidden).map(x => x.getAttribute('data-mp-sec')))].join(','));
  const t0 = await tabs(); console.log('Ma page:', t0, '| ouvert:', await vis());
  if (!/^\*Posts \/ /.test(t0) || /mp-tile/.test(await p.content()) && await p.$('.mp-tile') || (await vis()) !== 'posts') process.exitCode = 1;
  await p.screenshot({ path: __dirname + '/../traces/page-onglets-moi.png' });
  // En-tête compact : pas de bouton Modifier, réseaux à droite de la photo, chiffres et abonnés dans Infos.
  const head = await p.evaluate(() => ({ modifier: !!document.querySelector('button[data-action="look-edit"]'), reseaux: !!document.querySelector('.person-hero .ph-socials'), kpisEnTete: !!document.querySelector('.person-hero .person-kpis'), countsHorsInfos: [...document.querySelectorAll('.social-counts')].some(x => !x.closest('[data-mp-sec="infos"]')) }));
  console.log('en-tête:', JSON.stringify(head));
  if (head.modifier || !head.reseaux || head.kpisEnTete || head.countsHorsInfos) process.exitCode = 1;
  await p.click('.mp-tabs [data-mp-tab="infos"]'); await p.waitForTimeout(250);
  const inf = await p.$eval('[data-mp-sec="infos"]', e => e.innerText.replace(/\n+/g, ' ')); console.log('Infos:', inf.slice(0, 120));
  if (!/abonnés/.test(inf) || !/jours de piste/.test(inf)) process.exitCode = 1;
  await p.click('.mp-tabs [data-mp-tab="posts"]'); await p.waitForTimeout(150);
  await p.click('.ph-avatar[data-action="look-edit"]'); await p.waitForTimeout(400);
  const ed = !!(await p.$('#fiche-firstname')); console.log('photo -> personnaliser:', ed); if (!ed) process.exitCode = 1;
  await p.click('[data-action="look-cancel"]').catch(() => {}); await p.waitForTimeout(300);
  for (const k of ['perfs', 'saisons', 'bientot', 'infos']) {
    const sel = '.mp-tabs [data-mp-tab="' + k + '"]'; if (!(await p.$(sel))) { console.log(k, 'absent'); continue; }
    await p.click(sel); await p.waitForTimeout(250);
    const v = await vis(); console.log(k, '->', v); if (v !== k) process.exitCode = 1;
    await p.click(sel); await p.waitForTimeout(200); if ((await vis()) !== k) { console.log(k, 'se referme : non voulu'); process.exitCode = 1; }
  }
  // Page d'un ami : mêmes onglets.
  await p.click('.mp-tabs [data-mp-tab="posts"]'); await p.waitForTimeout(200);
  await p.evaluate(() => window.scrollTo(0, 0)); await p.click('.bottom-nav-btn:nth-child(3)'); await p.waitForTimeout(500);
  await p.evaluate(() => { const b = [...document.querySelectorAll('[data-person-link="Sam"], [data-name="Sam"], [data-open-person="Sam"]')][0]; if (b) b.click(); }); await p.waitForTimeout(700);
  const t1 = await tabs(); console.log('page de Sam:', t1);
  if (!/^\*Posts/.test(t1)) process.exitCode = 1;
  await p.screenshot({ path: __dirname + '/../traces/page-onglets-ami.png' });
  console.log('largeur', await p.evaluate(() => document.documentElement.scrollWidth));
  console.log('errs', JSON.stringify(errs)); if (errs.length) process.exitCode = 1;
  await b.close();
})();
