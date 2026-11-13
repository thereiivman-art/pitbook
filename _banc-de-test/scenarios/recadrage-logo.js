// Logo d'un team : bouton Logo sur la fiche du team, cadre rond comme la photo de profil, PNG détouré sur fond blanc.
const { chromium, BASE } = require('../lib');
(async () => {
  const lang = process.argv[2] || 'fr';
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 380, height: 1000 }, deviceScaleFactor: 2 }); p.on('pageerror', e => errs.push(e.message));
  // PNG 64x64 : disque rouge sur fond transparent.
  const png = await p.evaluate(() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); x.fillStyle = '#c8261f'; x.beginPath(); x.arc(32, 32, 20, 0, 7); x.fill(); return c.toDataURL('image/png').split(',')[1]; });
  await p.goto(BASE + 'index.html#lang=' + lang + '&role=orga'); await p.waitForTimeout(1600);
  await p.click('.bottom-nav-btn:nth-child(1)'); await p.waitForTimeout(300); await p.click('.subnav-btn[data-view="team"]'); await p.waitForTimeout(400);
  await p.getByText('Team Piste').first().click(); await p.waitForTimeout(700);
  const [fc] = await Promise.all([p.waitForEvent('filechooser'), p.click('.person-avatar[data-team-avatar]')]);
  await fc.setFiles({ name: 'logo.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') }); await p.waitForTimeout(900);
  console.log('recadrage:', await p.$eval('.crop-modal h2', e => e.innerText), '| cadre rond:', await p.$eval('#crop-modal-viewport', e => getComputedStyle(e).borderRadius));
  await p.screenshot({ path: 'recadrage-logo-' + lang + '.png' });
  await p.click('#crop-save-btn'); await p.waitForTimeout(900);
  const px = await p.evaluate(() => new Promise(r => { const t = Object.values(window.__MOCK_DATA.teams).find(t => t.logoURL); if (!t) return r('pas de logo'); const im = new Image(); im.onload = () => { const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const x = c.getContext('2d'); x.drawImage(im, 0, 0); const d = x.getImageData(2, 2, 1, 1).data; r(im.width + 'x' + im.height + ' coin rgb(' + d[0] + ',' + d[1] + ',' + d[2] + ')'); }; im.src = t.logoURL; }));
  console.log('logo enregistré:', px, '| logo touché → Recadrer / Changer:', await (async () => { await p.click('.person-avatar[data-team-avatar]'); await p.waitForTimeout(400); return p.$$eval('.photo-zoom-actions button', e => e.map(x => x.innerText).join(' / ')); })());
  console.log('errs', JSON.stringify(errs)); await b.close(); if (errs.length) process.exit(1);
})();
