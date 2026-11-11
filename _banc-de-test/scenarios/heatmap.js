// Carte de chaleur des repères : positions partagées sans texte (grille 24 × 24),
// visible à partir de 3 pilotes, une case allumée si 2 pilotes y ont un repère ;
// on peut arrêter de partager.
const { chromium, BASE } = require('../lib');
(async () => { const b = await chromium.launch(); const lang = process.argv[2] || 'fr'; const errs = [];
  const p = await b.newPage({ viewport: { width: 390, height: 900 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + 'index.html#lang=' + lang + '&heat=1'); await p.waitForTimeout(1600);
  await p.click('.bottom-nav-btn:nth-child(1)'); await p.waitForTimeout(300);
  await p.click('.subnav-btn[data-view="circuit"]'); await p.waitForTimeout(500);
  console.log('bouton visible avec 3 pilotes:', !!(await p.$('[data-heat-toggle]')), '| échelle:', !!(await p.$('[data-scale-toggle]')));
  await p.click('[data-heat-toggle]'); await p.waitForTimeout(600);
  console.log('carte:', await p.$eval('.heat-ctl .help-text', e => e.innerText), '| cases allumées:', await p.$$eval('.heat-layer i', e => e.length));
  await p.screenshot({ path: 'heatmap-' + lang + '.png' });
  // Un repère noté : publié sans texte.
  await p.evaluate(() => { const me = firebase.auth().currentUser; return firebase.firestore().collection('userPrivate').doc(me.uid).get(); });
  await p.click('[data-heat-share]'); await p.waitForTimeout(300);
  console.log('partage coupé:', await p.$eval('[data-heat-share]', e => e.innerText));
  const q = await b.newPage({ viewport: { width: 390, height: 900 } });
  await q.goto(BASE + 'index.html#lang=' + lang); await q.waitForTimeout(1600);
  await q.click('.bottom-nav-btn:nth-child(1)'); await q.waitForTimeout(300); await q.click('.subnav-btn[data-view="circuit"]'); await q.waitForTimeout(800);
  console.log('sans assez de pilotes : bouton carte de chaleur caché:', !(await q.$('[data-heat-toggle]')), '| échelle toujours proposée:', !!(await q.$('[data-scale-toggle]')));
  console.log('errs', JSON.stringify(errs)); await b.close(); })();
