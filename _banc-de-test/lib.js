// Outils communs aux scénarios du banc de test.
// Playwright : celui du projet s'il est installé, sinon celui de la machine.
var pw;
try { pw = require('playwright'); } catch (e) { pw = require('/opt/node22/lib/node_modules/playwright'); }

var BASE = process.env.BANC_URL || 'http://localhost:8766/';
var exe = process.env.CHROMIUM;
var chromium = {
  launch: function (opts) { return pw.chromium.launch(Object.assign(exe ? { executablePath: exe } : {}, opts || {})); }
};

// Réglages › Admin (compte admin, #admin=1).
async function openAdmin(p) {
  await p.evaluate(() => window.scrollTo(0, 0));
  await p.click('#settings-side'); await p.waitForTimeout(400);
  await p.click('[data-settings-go="@admin"]'); await p.waitForTimeout(800);
}

module.exports = { chromium: chromium, BASE: BASE, openAdmin: openAdmin };
