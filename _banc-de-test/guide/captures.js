// Captures de l'appli de démo pour le guide (appelé par faire-guide.js).
// Navigation actuelle : Carnet (Roulages, Courses, Circuits, Teams), Chrono, Social ; Ma page / Mon garage par l'avatar.
const path = require('path');
const { chromium } = require('../lib');

async function captures(base, dir, lang) {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 760 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  const out = {};
  const L = (fr, en) => (lang === 'fr' ? fr : en);
  async function go(hash) {
    await p.goto('about:blank'); await p.goto(base + 'index.html#lang=' + lang + (hash || '')); await p.waitForTimeout(1700);
    // Une démo plus vivante : réseaux et sponsors sur Ma page, une course avec ses résultats.
    await p.evaluate(([fr]) => {
      try { localStorage.setItem('pb_mpTileUsed', '1'); } catch (e) {}
      const db = firebase.firestore(), uid = firebase.auth().currentUser.uid, M = window.__MOCK_DATA, me = M.users[uid] || {};
      const look = Object.assign({ color: '#c8261f', cover: 'vibreur' }, me.look || {}, {
        links: [{ url: 'https://instagram.com/alex.r6' }, { url: 'https://youtube.com/@alexonboard', comment: fr ? 'Mes embarquées' : 'My onboards' }],
        sponsors: [{ name: 'Garage Dupont', url: 'https://garagedupont.fr' }, { name: 'Moto Pièces', url: '' }]
      });
      db.collection('users').doc(uid).set(Object.assign({}, me, { look }));
      const ev = (id, d, c, res) => db.collection('events').doc(id).set({ id, kind: 'course', teamId: 't1', circuit: c, dateStart: d, dateEnd: d, championship: 'Coupe Pitbook', category: '600 Supersport', raceSessions: ['Q', 'C1', 'C2'], riders: ['Alex', 'Sam', 'Théo', 'Tom'], eventVisibility: 'ouvert', results: res });
      ev('gr1', '2026-04-12', 'Jerez', { Q: ['Sam', 'Alex', 'Théo', 'Tom'], C1: ['Alex', 'Sam', 'Théo', 'Tom'], C2: ['Sam', 'Alex', 'Tom', 'Théo'] });
      ev('gr2', '2026-06-07', 'Mugello', { Q: ['Alex', 'Théo', 'Sam', 'Tom'], C1: ['Alex', 'Théo', 'Sam', 'Tom'], C2: ['Alex', 'Sam', 'Théo', 'Tom'] });
      ev('gr3', '2027-04-18', 'Barcelone', {});
    }, [lang === 'fr']);
    await p.waitForTimeout(700);
  }
  async function nav(n) { await p.evaluate(() => window.scrollTo(0, 0)); await p.click('.bottom-nav-btn:nth-child(' + n + ')'); await p.waitForTimeout(500); }
  async function shot(name, sel, offset) {
    if (sel) await p.evaluate(([s, o]) => { const e = document.querySelector(s); if (e) window.scrollTo(0, e.getBoundingClientRect().top + window.scrollY - (o || 0)); }, [sel, offset || 0]);
    await p.evaluate(() => document.querySelectorAll('.toast').forEach(t => t.remove()));
    await p.waitForTimeout(300);
    const f = path.join(dir, lang + '-' + name + '.png');
    await p.screenshot({ path: f });
    out[name] = f;
  }
  // 1. Ta journée, session par session (roulage passé)
  await go();
  await nav(1); await p.click('.subnav-btn[data-view="carnet"]').catch(() => {}); await p.waitForTimeout(400);
  await p.click('.pill-btn[data-cards-mode="passees"]').catch(() => {}); await p.waitForTimeout(400);
  await p.locator('[data-open-outing="Mugello"]').first().click(); await p.waitForTimeout(900);
  await shot('journee', '.day-prog-chart', 150);
  // 2. Le jour J : l'onglet Chrono
  await go('&jourj=1');
  await p.click('.bottom-nav-btn.bottom-nav-main'); await p.waitForTimeout(800);
  await shot('prochain');
  // 3. Ma page : tuiles, réseaux, sponsors
  await go();
  await p.click('#header-me'); await p.waitForTimeout(700);
  await shot('mapage', '.mp-bento', 330);
  // 4. Mon garage : pass paddock
  await p.click('.subnav-btn[data-view="stats"]'); await p.waitForTimeout(600);
  await shot('garage');
  // 5. Social : le fil, la recherche, les #tags
  await nav(3); await p.waitForTimeout(400);
  await p.click('[data-action="fsug-close"]').catch(() => {}); await p.waitForTimeout(400);
  await p.click('.mini-sheet .primary').catch(() => {}); await p.waitForTimeout(500);
  await shot('social', '.wall-search', 250);
  // 6. Courses et championnats : le classement
  await nav(1); await p.click('.subnav-btn[data-view="courses"]'); await p.waitForTimeout(500);
  await p.click('.pill-btn[data-pill-group="courses"][data-pill="championnats"]').catch(() => {}); await p.waitForTimeout(400);
  await p.click('[data-champ-open*="2026"]').catch(() => {}); await p.waitForTimeout(600);
  await shot('courses', '.champ-head', 120);
  // Version PC : Social en grand.
  const pc = await b.newContext({ viewport: { width: 1440, height: 860 }, deviceScaleFactor: 1.5 });
  const q = await pc.newPage();
  await q.goto(base + 'index.html#lang=' + lang); await q.waitForTimeout(1700);
  await q.click('.bottom-nav-btn[data-nav-tab="communaute"]').catch(() => {}); await q.waitForTimeout(800);
  await q.evaluate(() => document.querySelectorAll('.toast').forEach(t => t.remove()));
  out.pc = path.join(dir, lang + '-pc.png');
  await q.screenshot({ path: out.pc });
  await b.close();
  return out;
}
module.exports = { captures };
