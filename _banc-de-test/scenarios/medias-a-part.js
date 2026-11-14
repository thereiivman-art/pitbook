// Photos d'horaires et bannières de profil rangées à part : migration
// (admin), chargement à l'affichage, et une écriture de la fiche ne
// recopie pas la photo dans le profil.
const { chromium, BASE } = require('../lib');
(async () => { const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 390, height: 900 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + 'index.html#lang=fr&admin=1&role=orga'); await p.waitForTimeout(1300);
  await p.evaluate(() => { const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
      const im = x.createImageData(w, h); for (let i = 0; i < im.data.length; i += 4) { im.data[i] = Math.random() * 255; im.data[i + 1] = 80; im.data[i + 2] = 30; im.data[i + 3] = 255; } x.putImageData(im, 0, 0); return c.toDataURL('image/jpeg', 0.6); };
    window.__h = mk(800, 600); window.__c = mk(1200, 400);
    const db = firebase.firestore(), d = new Date(Date.now() + 3 * 864e5).toISOString().slice(0, 10);
    db.collection('events').doc('evh').set({ id: 'evh', circuit: 'Mugello', dateStart: d, dateEnd: d, teamId: 't1', riders: ['Alex'], horairesPhotoURL: window.__h, horairesPhotoAddedBy: 'Alex' });
    db.collection('users').doc('u2').set({ look: { cover: 'photo', coverPhoto: window.__c, color: '#c8261f' } }, { merge: true }); });
  await p.waitForTimeout(12000);
  const st = await p.evaluate(() => { const M = window.__MOCK_DATA; return {
    evInline: !!M.events.evh.horairesPhotoURL, evFlag: !!M.events.evh.horairesPhotoMedia, evMedia: !!(M.eventMedia && M.eventMedia.evh && M.eventMedia.evh.photo === window.__h),
    uInline: !!(M.users.u2.look || {}).coverPhoto, uFlag: !!(M.users.u2.look || {}).coverMedia, uMedia: !!(M.userMedia && M.userMedia.u2 && M.userMedia.u2.cover === window.__c) }; });
  console.log('après migration:', JSON.stringify(st));
  if (st.evInline || !st.evFlag || !st.evMedia || st.uInline || !st.uFlag || !st.uMedia) process.exitCode = 1;
  // Page de Sam : sa bannière s'affiche.
  await p.evaluate(() => { const s = document.createElement('span'); s.className = 'mini-avatar'; s.setAttribute('data-person', 'Sam'); document.getElementById('root').appendChild(s); s.click(); });
  await p.waitForTimeout(1200);
  const shown = await p.$eval('.person-hero .ph-photo', e => e.getAttribute('src').length).catch(() => 0);
  console.log('bannière de Sam affichée (taille):', shown); if (shown < 1000) process.exitCode = 1;
  console.log('errs', JSON.stringify(errs)); if (errs.length) process.exitCode = 1; await b.close(); })();
