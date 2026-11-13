// Fiche d'un team (responsable) : toucher la bannière (style, couleur, photo, recadrer) ou le logo (agrandir, recadrer, changer),
// comme pour ma fiche. Pilotes du team : pros, coachs, personnalités. Ma fiche : réseaux seulement via la tuile.
const { chromium, BASE } = require('../lib');
(async () => {
  const lang = process.argv[2] || 'fr';
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 380, height: 1000 }, deviceScaleFactor: 2 }); p.on('pageerror', e => errs.push(e.message));
  const png = await p.evaluate(() => { const c = document.createElement('canvas'); c.width = 300; c.height = 100; const x = c.getContext('2d'); x.fillStyle = '#2a6'; x.fillRect(0, 0, 300, 100); return c.toDataURL('image/png').split(',')[1]; });
  await p.goto(BASE + 'index.html#lang=' + lang + '&role=orga'); await p.waitForTimeout(1600);
  await p.click('.bottom-nav-btn:nth-child(1)'); await p.waitForTimeout(300); await p.click('.subnav-btn[data-view="team"]'); await p.waitForTimeout(400);
  await p.getByText('Team Piste').first().click(); await p.waitForTimeout(700);
  await p.click('.ph-cover[data-team-cover]'); await p.waitForTimeout(400);
  console.log('bannière team:', await p.$eval('.mini-sheet', e => e.innerText.replace(/\n+/g, ' ').slice(0, 120)));
  await p.click('.mini-sheet [data-tb-set="color"]:nth-child(3)'); await p.waitForTimeout(400);
  const [fc] = await Promise.all([p.waitForEvent('filechooser'), p.click('.mini-sheet [data-tb-act="change"]')]);
  await fc.setFiles({ name: 'b.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') }); await p.waitForTimeout(900);
  await p.click('#crop-save-btn'); await p.waitForTimeout(900);
  console.log('enregistré:', await p.evaluate(() => { const t = Object.values(window.__MOCK_DATA.teams).find(t => t.name === 'Team Piste'); return t && t.look ? (t.look.cover + ' · couleur ' + t.look.color + ' · photo ' + !!t.look.coverPhoto) : 'rien'; }));
  await p.screenshot({ path: 'team-media-' + lang + '.png' });
  const [fc2] = await Promise.all([p.waitForEvent('filechooser'), p.click('.person-avatar[data-team-avatar]')]);
  await fc2.setFiles({ name: 'l.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') }); await p.waitForTimeout(900);
  console.log('sans logo → choix du fichier puis recadrage rond:', await p.$eval('#crop-modal-viewport', e => getComputedStyle(e).borderRadius)); await p.click('#crop-save-btn'); await p.waitForTimeout(900);
  await p.click('.person-avatar[data-team-avatar]'); await p.waitForTimeout(500);
  console.log('logo touché:', await p.evaluate(() => { const z = document.querySelector('.photo-zoom'); if (z) return 'zoom: ' + [...z.querySelectorAll('.photo-zoom-actions button')].map(x => x.innerText).join(' / '); return 'pas de zoom'; }));
  await p.keyboard.press('Escape'); await p.evaluate(() => document.querySelectorAll('.photo-zoom').forEach(x => x.remove()));
  await p.evaluate(() => { const d = window.__MOCK_DATA, e = Object.entries(d.users).find(([k, v]) => v && v.name === 'Sam'); return firebase.firestore().collection('users').doc(e[0]).set(Object.assign({}, e[1], { pro: true })); }); await p.waitForTimeout(400);
  await p.click('[data-action="team-settings-open"]'); await p.waitForTimeout(400);
  console.log('éditeur team: plus de boutons logo/bannière:', !(await p.$('[data-action="team-logo-pick"], [data-action="team-cover-pick"]')), '| aide:', await p.$eval('.look-tap-hint', e => e.innerText).catch(() => 'absente'));
  console.log('pilotes proposés:', await p.$$eval('[data-look-fav="favRiders"]', e => e.map(x => x.innerText).join(', ') || 'aucun'));
  // Ma fiche : plus de réseaux dans Modifier, feuille dédiée depuis la tuile.
  await p.goto(BASE + 'index.html#lang=' + lang); await p.waitForTimeout(1600);
  await p.click('#header-me'); await p.waitForTimeout(500);
  await p.click('[data-action="look-edit"]'); await p.waitForTimeout(400);
  console.log('réseaux dans Modifier:', !!(await p.$('.look-editor #look-ln-url')));
  await p.click('[data-action="look-cancel"]').catch(() => {}); await p.waitForTimeout(300);
  await p.click('.net-tile.add[data-look-at="links"]'); await p.waitForTimeout(400);
  await p.click('.mini-sheet [data-link-net="tiktok"]'); await p.fill('.mini-sheet #look-ln-url', 'xavggmn');
  await p.click('.mini-sheet [data-ln-save]'); await p.waitForTimeout(600);
  console.log('tuiles réseaux:', await p.$$eval('.net-tile:not(.add):not(.sp)', e => e.map(x => x.innerText.replace(/\n/g, ' ')).join(' | ')));
  console.log('errs', JSON.stringify(errs)); await b.close(); if (errs.length) process.exit(1);
})();
