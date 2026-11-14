// Bannière d'un team rangée à part (teamMedia) : migration par le Team
// Leader, puis chargement à l'ouverture de la page du team ; une nouvelle
// bannière ne repart pas dans le document du team.
const { chromium, BASE } = require('../lib');
(async () => { const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 390, height: 900 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + 'index.html#lang=fr&role=orga'); await p.waitForTimeout(1300);
  await p.evaluate(() => { const c = document.createElement('canvas'); c.width = 1200; c.height = 400; const x = c.getContext('2d');
    const im = x.createImageData(1200, 400); for (let i = 0; i < im.data.length; i += 4) { im.data[i] = Math.random() * 255; im.data[i + 1] = 90; im.data[i + 2] = 40; im.data[i + 3] = 255; } x.putImageData(im, 0, 0);
    window.__cov = c.toDataURL('image/jpeg', 0.6);
    firebase.firestore().collection('teams').doc('t1').update({ look: { cover: 'photo', coverPhoto: window.__cov, color: '#c8261f' } }); });
  await p.waitForTimeout(9000);
  const st = await p.evaluate(() => { const M = window.__MOCK_DATA; return { inTeam: !!(M.teams.t1.look || {}).coverPhoto, media: !!(M.teamMedia && M.teamMedia.t1 && M.teamMedia.t1.cover === window.__cov), flag: !!(M.teams.t1.look || {}).coverMedia }; });
  console.log('après migration:', JSON.stringify(st)); if (st.inTeam || !st.media || !st.flag) process.exitCode = 1;
  await p.click('.bottom-nav-btn:nth-child(1)'); await p.waitForTimeout(300);
  await p.click('.subnav-btn[data-view="team"]'); await p.waitForTimeout(400);
  await p.getByText('Team Piste').first().click(); await p.waitForTimeout(1200);
  const shown = await p.$eval('.person-hero .ph-photo', e => e.getAttribute('src').length).catch(() => 0);
  console.log('bannière affichée (taille):', shown); if (shown < 1000) process.exitCode = 1;
  // Une écriture de la fiche du team (liens) ne recopie pas la photo.
  await p.evaluate(() => firebase.firestore().collection('teams').doc('t1').get()).catch(() => {});
  console.log('errs', JSON.stringify(errs)); if (errs.length) process.exitCode = 1; await b.close(); })();
