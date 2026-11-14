// Erreurs de l'appli remontées dans « État de Pitbook » ; aperçus de liens
// (Open Graph) ; politique de confidentialité et conditions à jour.
const { chromium, BASE, openAdmin } = require('../lib');
(async () => { const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 390, height: 900 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + 'index.html#lang=fr&admin=1'); await p.waitForTimeout(1500);
  // Une erreur dans le code de l'appli (même origine) et une promesse rejetée.
  await p.evaluate(() => { setTimeout(function () { throw new Error('Test de remontée'); }, 10); });
  await p.evaluate(() => { Promise.reject(new Error('Promesse ratée')); });
  await p.waitForTimeout(600);
  const docs = await p.evaluate(() => Object.values(window.__MOCK_DATA.clientErrors || {}).map(e => e.msg + ' | ' + e.device + ' | v' + e.ver));
  console.log('remontées:', JSON.stringify(docs));
  if (!docs.some(d => /Test de remontée/.test(d)) || !docs.some(d => /Promesse ratée/.test(d))) process.exitCode = 1;
  await openAdmin(p); await p.waitForTimeout(800);
  const card = await p.$eval('.admin-status', e => e.innerText.replace(/\n+/g, ' | ')).catch(() => 'absente');
  console.log('carte:', card.slice(0, 400)); if (!/Erreurs de l'appli/.test(card) || !/Test de remontée/.test(card)) process.exitCode = 1;
  // Textes légaux.
  const og = await p.evaluate(() => ['og:title', 'og:image', 'og:description'].map(k => (document.querySelector('meta[property="' + k + '"]') || {}).content || '—'));
  console.log('aperçu:', JSON.stringify(og)); if (og.some(x => x === '—')) process.exitCode = 1;
  for (const f of ['guide', 'pilotes', 'accompagnants', 'organisateurs', 'installer']) {
    const g = await b.newPage(); await g.goto(BASE + f + '.html');
    const img = await g.$eval('meta[property="og:image"]', e => e.content).catch(() => '');
    if (!/og-pitbook\.png$/.test(img)) { console.log('sans aperçu:', f); process.exitCode = 1; } await g.close();
  }
  console.log('errs (attendues : les 2 de test)', JSON.stringify(errs));
  if (errs.filter(e => !/Test de remontée|Promesse ratée/.test(e)).length) process.exitCode = 1; await b.close(); })();
