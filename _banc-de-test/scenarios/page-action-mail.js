// Page des liens de mail (action.html) : adresse confirmée, lien expiré,
// nouveau mot de passe. Firebase remplacé par un faux (pas de réseau).
const { chromium, BASE } = require('../lib');
(async () => { const b = await chromium.launch(); const errs = [];
  const FAKE = `window.firebase = { initializeApp() {}, auth() { return {
    applyActionCode: (c) => c === 'bon' ? Promise.resolve() : Promise.reject({ code: 'auth/invalid-action-code' }),
    verifyPasswordResetCode: (c) => c === 'bon' ? Promise.resolve('pilote@example.com') : Promise.reject({ code: 'auth/expired-action-code' }),
    confirmPasswordReset: (c, p) => { window.__pw = p; return Promise.resolve(); },
    checkActionCode: () => Promise.resolve({ data: { email: 'a@b.c' } }) }; } };`;
  const page = async (qs) => {
    const p = await b.newPage({ viewport: { width: 390, height: 800 }, deviceScaleFactor: 1 }); p.on('pageerror', e => errs.push(e.message));
    await p.route(/gstatic\.com/, r => r.request().url().includes('app-compat') ? r.fulfill({ contentType: 'text/javascript', body: FAKE }) : r.fulfill({ contentType: 'text/javascript', body: '' }));
    await p.goto(BASE + 'action.html?' + qs); await p.waitForTimeout(400); return p;
  };
  const txt = (p) => p.$eval('#box', e => e.innerText.replace(/\n+/g, ' | '));
  let p = await page('mode=verifyEmail&oobCode=bon&lang=fr');
  let t = await txt(p); console.log('confirmée:', t, '| lien:', await p.$eval('#open', e => e.getAttribute('href')), '| url:', p.url().replace(/.*action/, 'action'));
  if (!/Adresse confirmée/i.test(t) || /oobCode/.test(p.url())) process.exitCode = 1;
  await p.screenshot({ path: __dirname + '/../traces/action-confirmee.png' });
  p = await page('mode=verifyEmail&oobCode=vieux&lang=fr');
  t = await txt(p); console.log('expiré:', t); if (!/Lien expiré/i.test(t)) process.exitCode = 1;
  p = await page('mode=resetPassword&oobCode=bon&lang=en');
  t = await txt(p); console.log('reset:', t); if (!/pilote@example.com/.test(t)) process.exitCode = 1;
  await p.fill('#pw', '123'); await p.click('#pw-go'); await p.waitForTimeout(200);
  console.log('trop court:', await p.$eval('#err', e => e.innerText));
  await p.fill('#pw', 'nouveau-mdp'); await p.click('#pw-go'); await p.waitForTimeout(300);
  t = await txt(p); console.log('après:', t, '| envoyé:', await p.evaluate(() => window.__pw));
  if (!/Password changed/i.test(t)) process.exitCode = 1;
  await p.screenshot({ path: __dirname + '/../traces/action-mdp.png' });
  console.log('errs', JSON.stringify(errs)); if (errs.length) process.exitCode = 1; await b.close(); })();
