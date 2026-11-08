// Fiche simplifiée : chiffres dans l'en-tête, bio au toucher, éditeur replié, cosmétiques dans Pneus, photos protégées.
const { chromium, BASE } = require('../lib');
(async () => {
  const lang = process.argv[2] || 'fr';
  const b = await chromium.launch();
  const errs = [];
  const mk = async (hash) => { const p = await b.newPage({ viewport: { width: 380, height: 900 } }); p.on('pageerror', e => errs.push(e.message)); await p.goto(BASE + 'index.html#lang=' + lang + hash); await p.waitForTimeout(1600); return p; };
  for (const role of ['', '&role=acc', '&role=orga']) {
    const p = await mk(role);
    await p.click('#header-me'); await p.waitForTimeout(500);
    console.log((role || 'pilote') + ' chiffres en-tête:', await p.$$eval('.ph-kpis span', e => e.map(x => x.innerText).join(' / ')), '| hors en-tête:', await p.$$eval('.person-page > .person-kpis:not(.budget-kpis)', e => e.length));
    if (!role) {
      await p.screenshot({ path: 'fiche-simple-' + lang + '.png', fullPage: false });
      console.log('composer sous compteurs:', await p.$eval('.mypage-composer', e => !!e.previousElementSibling && e.previousElementSibling.className).catch(() => 'absent'));
      await p.click('[data-action="edit-bio"]'); await p.waitForTimeout(300);
      await p.fill('#bio-quick', 'Pistard du dimanche'); await p.click('#bio-quick-save'); await p.waitForTimeout(400);
      console.log('bio:', await p.$eval('.ph-bio-edit', e => e.innerText));
      const menu = await p.$eval('.person-avatar img, .ph-avatar img', im => { const ev = new MouseEvent('contextmenu', { bubbles: true, cancelable: true }); im.dispatchEvent(ev); return ev.defaultPrevented; }).catch(() => 'pas de photo');
      console.log('menu image bloqué:', menu);
      await p.click('[data-action="look-edit"]'); await p.waitForTimeout(400);
      console.log('interrupteurs:', await p.$$eval('[data-look-show]', e => e.length), '| plus d\'options replié:', await p.$eval('.look-more', e => !e.open), '| liens visibles:', !!(await p.$('#look-ln-url')), '| champ bio:', !!(await p.$('#look-bio')));
      await p.screenshot({ path: 'fiche-editeur-' + lang + '.png' });
      await p.click('[data-action="look-cancel"]'); await p.waitForTimeout(300);
      await p.click('.pneus-chip.profile-pneus'); await p.waitForTimeout(400);
      console.log('pneus perso:', await p.$$eval('[data-pneus-set]', e => e.length), '| aperçu:', !!(await p.$('.pneus-preview')));
      const pick = await p.$('[data-pneus-set="bubble"]:not([data-val=""])');
      if (pick) { await pick.click(); await p.waitForTimeout(300); console.log('bulle choisie:', await p.$eval('[data-pneus-set="bubble"][aria-pressed="true"]', e => e.getAttribute('data-val'))); }
      await p.screenshot({ path: 'fiche-pneus-' + lang + '.png' });
    }
    await p.close();
  }
  console.log('errs', JSON.stringify(errs)); await b.close();
  if (errs.length) process.exit(1);
})();
