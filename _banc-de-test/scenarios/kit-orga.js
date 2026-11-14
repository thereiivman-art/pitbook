// Kit orga : carte en 3 étapes dans Carnet › Orga, QR paddock, affiche A4
// (PNG), page organisateurs.html et inscription « Organisateur » pré-cochée.
const { chromium, BASE } = require('../lib');
(async () => { const b = await chromium.launch(); const errs = [];
  const lang = process.argv[2] || 'fr';
  const o = await b.newPage({ viewport: { width: 390, height: 900 }, deviceScaleFactor: 1, acceptDownloads: true }); o.on('pageerror', e => errs.push(e.message));
  // Pas de réseau dans le banc : fausse bibliothèque QR (damier 25×25).
  await o.addInitScript(() => { window.qrcode = () => ({ addData() {}, make() {}, getModuleCount: () => 25, isDark: (i, j) => (i + j) % 3 === 0, createSvgTag: () => '<svg width="10" height="10"></svg>' }); });
  await o.goto(BASE + 'index.html#lang=' + lang + '&role=orga'); await o.waitForTimeout(1600);
  await o.evaluate(() => { const d = new Date(Date.now() + 5 * 864e5), k = d.toISOString().slice(0, 10);
    firebase.firestore().collection('events').doc('evk').set({ id: 'evk', circuit: 'Mugello', dateStart: k, dateEnd: k, teamId: 't1', riders: ['Sam'] }); });
  await o.waitForTimeout(400);
  await o.click('.bottom-nav-btn:nth-child(1)'); await o.waitForTimeout(300);
  await o.click('.subnav-btn[data-view="orgaev"]').catch(() => {}); await o.waitForTimeout(500);
  const kit = await o.$eval('.orga-kit', e => e.innerText.replace(/\n+/g, ' | ')).catch(() => 'absent');
  console.log('kit:', kit); if (!/Affiche le QR/.test(kit) || !/Mugello/.test(kit)) process.exitCode = 1;
  await (await o.$('.orga-kit')).screenshot({ path: __dirname + '/../traces/kit-orga.png' }).catch(() => {});
  await o.click('.orga-kit [data-action="outing-paddock-qr"]'); await o.waitForTimeout(500);
  const dl = o.waitForEvent('download', { timeout: 8000 }).catch(() => null);
  await o.click('[data-q="poster"]');
  const d = await dl; console.log('affiche:', d ? d.suggestedFilename() : 'aucune');
  if (d) await d.saveAs(__dirname + '/../traces/affiche-paddock.png'); else process.exitCode = 1;
  // Page organisateurs et inscription pré-cochée.
  const g = await b.newPage({ viewport: { width: 390, height: 900 } }); g.on('pageerror', e => errs.push(e.message));
  await g.goto(BASE + 'organisateurs.html?lang=' + lang); await g.waitForTimeout(400);
  const h1 = await g.$eval('h1', e => e.innerText); console.log('page:', h1, '| bouton:', await g.$eval('a.go', e => e.getAttribute('href')));
  if (!/organis/i.test(h1)) process.exitCode = 1;
  console.log('largeur page:', await g.evaluate(() => document.documentElement.scrollWidth));
  console.log('errs', JSON.stringify(errs)); if (errs.length) process.exitCode = 1; await b.close(); })();
