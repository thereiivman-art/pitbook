// Allègement de ce que tout le monde télécharge à l'ouverture : plans de
// circuit importés inutilisés supprimés (admin), anciennes photos PNG
// allégées (admin), photo d'un post de team rangée à part (postMedia).
const { chromium, BASE } = require('../lib');
(async () => { const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 390, height: 900 } }); p.on('pageerror', e => errs.push(e.message));
  // Données posées avant le chargement de l'appli.
  await p.addInitScript(() => {
    const big = (w, h, type) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
      const im = x.createImageData(w, h); for (let i = 0; i < im.data.length; i += 4) { const v = Math.floor(Math.random() * 256); im.data[i] = v; im.data[i + 1] = (v * 7) & 255; im.data[i + 2] = (v * 13) & 255; im.data[i + 3] = 255; }
      x.putImageData(im, 0, 0); return c.toDataURL(type, 0.95); };
    window.__bigImg = big;
  });
  await p.goto(BASE + 'index.html#lang=fr&admin=1'); await p.waitForTimeout(1500);
  const before = await p.evaluate(() => { const db = firebase.firestore(), M = window.__MOCK_DATA;
    const png = window.__bigImg(300, 300, 'image/png'), jpg = window.__bigImg(1400, 1000, 'image/jpeg');
    db.collection('circuits').doc('Mugello').set({ name: 'Mugello', mapImage: jpg }, { merge: true });
    db.collection('users').doc('u3').set({ photoURL: png }, { merge: true });
    return { png: png.length, jpg: jpg.length }; });
  console.log('avant:', JSON.stringify(before));
  await p.waitForTimeout(12000);
  const after = await p.evaluate(() => { const M = window.__MOCK_DATA; return { map: !!(M.circuits.Mugello || {}).mapImage, avatar: (M.users.u3.photoURL || '').slice(0, 16) + ' ' + (M.users.u3.photoURL || '').length }; });
  console.log('après:', JSON.stringify(after));
  if (after.map || !/webp|png/.test(after.avatar) || +after.avatar.split(' ')[1] >= before.png) process.exitCode = 1;
  // Post de team avec photo : rangé à part, affiché quand même.
  await p.evaluate(() => { window.__teamPhoto = window.__bigImg(1000, 700, 'image/jpeg'); });
  const ok = await p.evaluate(() => new Promise(res => {
    const db = firebase.firestore(), id = 'tp1', ph = window.__teamPhoto;
    db.collection('postMedia').doc(id).set({ data: ph, createdAt: 1, authorUid: 'u1', audience: 'all', visibleTo: [] })
      .then(() => db.collection('teamFeed').doc(id).set({ id, teamId: 't1', author: 'Alex', authorUid: 'u1', text: 'Photo team', photoMedia: id, createdAt: Date.now() }))
      .then(() => setTimeout(() => res(!!(window.__MOCK_DATA.teamFeed.tp1 && !window.__MOCK_DATA.teamFeed.tp1.photoURL)), 300));
  }));
  console.log('post de team sans photo dedans:', ok); if (!ok) process.exitCode = 1;
  console.log('errs', JSON.stringify(errs)); if (errs.length) process.exitCode = 1; await b.close(); })();
