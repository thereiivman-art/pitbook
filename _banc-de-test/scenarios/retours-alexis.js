// Retours d'Alexis (accompagnant) : Dessin fermé en changeant d'onglet,
// lecteur vidéo dans un post, Lien/Lieu repliés, message d'accueil,
// discussion d'un roulage (groupe dans la messagerie), trophées de l'accompagnant,
// Visités dans Circuits, albums photo touchables.
const { chromium, BASE } = require('../lib');
(async () => { const b = await chromium.launch(); const lang = process.argv[2] || 'fr'; const errs = [];
  const page = async (hash) => { const p = await b.newPage({ viewport: { width: 390, height: 860 } }); p.on('pageerror', e => errs.push(e.message)); await p.goto(BASE + 'index.html#lang=' + lang + hash); await p.waitForTimeout(1600); return p; };
  // 1. Dessin ouvert dans la page, puis Communauté : le dessin se ferme.
  let p = await page('');
  await p.click('.bottom-nav-btn:nth-child(1)'); await p.waitForTimeout(300);
  await p.click('.subnav-btn[data-view="circuit"]'); await p.waitForTimeout(400);
  await p.click('[data-action="map-open"][data-mode="draw"]'); await p.waitForTimeout(600);
  const opened = !!(await p.$('#annot-overlay.open.map-docked'));
  await p.click('.bottom-nav-btn[data-nav-tab="communaute"]'); await p.waitForTimeout(500);
  console.log('dessin ouvert:', opened, '| fermé après Communauté:', !(await p.$('#annot-overlay.open')));
  // 2. Post avec un lien YouTube : Lien/Lieu repliés, lecteur intégré.
  await p.click('#wall-composer-toggle'); await p.waitForTimeout(300);
  console.log('lien replié:', await p.$eval('.post-extra[data-extra="link"]', e => e.hidden), '| lieu replié:', await p.$eval('.post-extra[data-extra="place"]', e => e.hidden));
  await p.fill('#wall-post-text', 'Mon tour'); await p.click('[data-post-extra="link"]'); await p.fill('#wall-post-link', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  await p.click('#wall-post-form button[type="submit"]'); await p.waitForTimeout(600);
  await p.click('[data-mini-close]').catch(() => {}); await p.waitForTimeout(300);
  const face = p.locator('.link-player-face').first();
  console.log('lecteur dans le post:', await face.count() > 0);
  await face.click().catch(() => {}); await p.waitForTimeout(300);
  console.log('lecteur dans le post:', await p.$eval('.inline-player iframe', e => e.src.slice(0, 45)).catch(() => 'non')); await p.click('.inline-player-x').catch(() => {}); await p.waitForTimeout(200);
  // 3. Discussion du roulage (Barcelone, à venir).
  await p.click('.bottom-nav-btn:nth-child(1)'); await p.waitForTimeout(300);
  await p.click('.subnav-btn[data-view="carnet"]'); await p.waitForTimeout(400);
  await p.locator('#root [data-open-outing="Barcelone"]:visible').first().click(); await p.waitForTimeout(600);
  // Discussion du roulage = un groupe dans la messagerie (inscrits + organisateur).
  await p.locator('[data-action="event-group"]:visible').first().click(); await p.waitForTimeout(800);
  await p.fill('#dm-text', 'Qui vient en camion ?'); await p.click('#dm-form button[type="submit"]'); await p.waitForTimeout(500);
  const grp = await p.evaluate(() => JSON.stringify(((window.__MOCK_DATA.groupChats || {}).ev_e1 || {}).lastText || null));
  console.log('message de discussion:', await p.$$eval('#dm-list .dm-bubble', e => e.map(x => x.innerText).join(' | ')), '| stocké:', grp);
  if (!/camion/.test(grp)) process.exitCode = 1;
  await p.screenshot({ path: 'retours-alexis-discussion.png' });
  await p.close();
  // 4. Compte tout neuf : message d'accueil dans la messagerie.
  p = await page('&bienvenue=1');
  await p.click('#messages-toggle'); await p.waitForTimeout(400);
  console.log('conversation d\'accueil:', await p.$$eval('.dm-conv strong', e => e.map(x => x.innerText).join(', ')));
  await p.click('.dm-conv[data-name="cp:welcome"]'); await p.waitForTimeout(300);
  console.log('accueil:', (await p.$eval('.dm-welcome', e => e.innerText).catch(() => 'non')).slice(0, 40), '| formulaire de réponse:', !!(await p.$('#dm-form')));
  await p.close();
  // 5. Accompagnant : podium Tous par défaut, Visités dans Circuits, albums.
  p = await page('&role=acc');
  await p.click('.bottom-nav-btn:nth-child(1)'); await p.waitForTimeout(300);
  console.log('Visités dans le Carnet:', !!(await p.$('.subnav-btn[data-view="visites"]')));
  await p.click('.subnav-btn[data-view="circuit"]'); await p.waitForTimeout(400);
  console.log('pastille Visités dans Circuits:', !!(await p.$('[data-pill-group="circuit"][data-pill="visites"]')));
  await p.click('#header-me'); await p.waitForTimeout(400);
  await p.locator('.mp-tile[data-mp-tab="perfs"]').first().click(); await p.waitForTimeout(400);
  // Accompagnant : la tuile Trophées montre ses trophées ; le podium des chronos reste aux pilotes.
  console.log('tuile Trophées (accompagnant):', await p.$$eval('.mp-tile.active, .mp-tile[data-mp-tab="perfs"]', e => e[0] && e[0].innerText.replace(/\s+/g, ' ').slice(0, 40)), '| podium:', !!(await p.$('.podium-scope')));
  await p.evaluate(() => window.scrollTo(0, 0)); await p.click('.bottom-nav-btn:nth-child(1)'); await p.waitForTimeout(300);
  await p.click('.subnav-btn[data-view="carnet"]'); await p.waitForTimeout(300);
  console.log('titre carnet:', await p.$eval('.comp-carnet-title', e => e.innerText).catch(() => 'non'));
  await p.click('[data-pill-group="compcarnet"][data-pill="passes"]').catch(() => {}); await p.waitForTimeout(300);
  console.log('albums touchables:', await p.$$eval('.album-chip', e => e.map(x => x.tagName + ' ' + x.innerText.trim()).join(', ')));
  console.log('errs', JSON.stringify(errs)); if (errs.length) process.exitCode = 1; await b.close(); })();
