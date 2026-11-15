// Fiche d'un team : grande bande « À venir » en tête des tuiles (3 prochains
// roulages, Réserver, Tout voir), pour le responsable comme pour un visiteur.
const { chromium, BASE } = require('../lib');
(async () => {
  const lang = process.argv[2] || 'fr';
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 390, height: 900 }, deviceScaleFactor: 2 }); p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + 'index.html#lang=' + lang + '&role=orga'); await p.waitForTimeout(1600);
  await p.evaluate(() => { const db = firebase.firestore(), cs = ['Le Mans', 'Carole', 'Navarra', 'Assen', 'Mas du Clos'];
    ['t1', 't2'].forEach(t => cs.forEach((c, i) => { const m = String(3 + i).padStart(2, '0'), id = t + 'e' + i;
      db.collection('events').doc(id).set({ id: id, teamId: t, circuit: c, dateStart: '2027-' + m + '-15', dateEnd: '2027-' + m + '-16', riders: i === 0 ? ['Sam'] : [], eventVisibility: 'public', bookingUrl: i < 2 ? 'https://www.billetweb.fr/x' : null }); }));
    db.collection('events').doc('t1p').set({ id: 't1p', teamId: 't1', circuit: 'Carole', dateStart: '2025-05-10', dateEnd: '2025-05-10', riders: ['Alex'], eventVisibility: 'public' });
  });
  await p.waitForTimeout(500);
  const check = async (name, shot) => {
    await p.evaluate(() => window.scrollTo(0, 0)); await p.mouse.wheel(0, -400); await p.waitForTimeout(400);
    if (name === 'Team Piste') {
      await p.click('.bottom-nav-btn:nth-child(1)'); await p.waitForTimeout(300);
      await p.click('.subnav-btn[data-view="team"]'); await p.waitForTimeout(400);
      await p.getByText(name).first().click(); await p.waitForTimeout(800);
    } else { // visiteur : comme depuis « Organisé par » sur un roulage
      await p.evaluate(() => { const x = document.createElement('button'); x.setAttribute('data-team-link', 't2'); x.id = 'go-t2'; document.getElementById('root').appendChild(x); x.click(); }); await p.waitForTimeout(900);
    }
    const band = await p.$eval('.team-next-band', e => e.innerText.replace(/\n+/g, ' | ')).catch(() => 'absente');
    const tiles = await p.$$eval('.mp-bento .mp-tile .mp-k', e => e.map(x => x.innerText.replace('›', '').trim()).join(' / '));
    const order = await p.evaluate(() => { const bd = document.querySelector(".team-next-band"), bt = document.querySelector(".team-une") || document.querySelector(".mp-bento"); return !!(bd && bt && (bd.compareDocumentPosition(bt) & Node.DOCUMENT_POSITION_FOLLOWING)); });
    console.log(name, '| bande:', band, '| tuiles:', tiles, '| avant les tuiles:', order);
    if (!/À venir · 5/i.test(band) || !/Tout voir/.test(band) || (band.match(/Réserver/g) || []).length !== 2 || /Mas du Clos/.test(band) || /À venir/i.test(tiles) || !order) process.exitCode = 1;
    await p.evaluate(() => document.querySelector('.team-next-band').scrollIntoView({ block: 'center' }));
    await p.screenshot({ path: __dirname + '/../traces/' + shot + '.png' });
    await p.click('.tnb-all'); await p.waitForTimeout(400);
    const open = await p.$eval('[data-mp-sec="bientot"]', e => !e.hidden && e.innerText.length > 50).catch(() => false);
    console.log('  Tout voir ouvre la liste:', open); if (!open) process.exitCode = 1;
  };
  await check('Team Piste', 'team-bande-orga');
  await check('Mototeam95', 'team-bande-visiteur');
  console.log('largeur', await p.evaluate(() => document.documentElement.scrollWidth));
  console.log('errs', JSON.stringify(errs)); if (errs.length) process.exitCode = 1;
  await b.close();
})();
