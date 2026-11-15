// Fiche d'un team en onglets collants (maquette A) : Prochains roulages
// ouvert d'abord, Posts, Saisons… ; un seul bouton Suivre (plus de cœur).
const { chromium, BASE } = require('../lib');
(async () => {
  const lang = process.argv[2] || 'fr';
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 390, height: 900 }, deviceScaleFactor: 2 }); p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + 'index.html#lang=' + lang + '&role=orga'); await p.waitForTimeout(1600);
  await p.evaluate(() => { const db = firebase.firestore(), cs = ['Le Mans', 'Carole', 'Navarra', 'Assen', 'Mas du Clos', 'Le Vigeant', 'Misano', 'Brno', 'Mugello'];
    ['t1', 't2'].forEach(t => cs.forEach((c, i) => { const m = String(1 + i).padStart(2, '0'), id = t + 'e' + i;
      db.collection('events').doc(id).set({ id: id, teamId: t, circuit: c, dateStart: '2027-' + m + '-15', dateEnd: '2027-' + m + '-16', riders: i === 0 ? ['Sam'] : [], eventVisibility: 'public', bookingUrl: i < 2 ? 'https://www.billetweb.fr/x' : null }); }));
    db.collection('teamFeed').add({ teamId: 't1', author: 'Sam', text: 'Super journée au Mans !', createdAt: Date.now() - 3600e3 });
  });
  await p.waitForTimeout(500);
  const tabsOf = () => p.$$eval('.team-tab', e => e.map(x => (x.classList.contains('on') ? '*' : '') + x.innerText).join(' / '));
  // Responsable
  await p.click('.bottom-nav-btn:nth-child(1)'); await p.waitForTimeout(300);
  await p.click('.subnav-btn[data-view="team"]'); await p.waitForTimeout(400);
  await p.getByText('Team Piste').first().click(); await p.waitForTimeout(800);
  const t1 = await tabsOf(); console.log('orga onglets:', t1);
  if (!/^\*Prochains roulages · 9/i.test(t1) || !/Posts · 1/i.test(t1) || !/Saisons/i.test(t1) || !/Audience/i.test(t1)) process.exitCode = 1;
  if (await p.$('.mp-tile, .team-next-band, .team-like')) { console.log('restes de tuiles/bande/cœur'); process.exitCode = 1; }
  await p.screenshot({ path: __dirname + '/../traces/team-onglets-orga.png' });
  // Onglet Posts, puis la barre reste collée en défilant.
  await p.click('[data-team-tab="posts"]'); await p.waitForTimeout(300);
  const posts = await p.$eval('[data-team-sec="posts"]', e => !e.hidden && /Super journée/.test(e.innerText));
  console.log('posts visibles:', posts); if (!posts) process.exitCode = 1;
  await p.click('[data-team-tab="bientot"]'); await p.waitForTimeout(300);
  await p.evaluate(() => window.scrollTo(0, 1400)); await p.waitForTimeout(400);
  const stuck = await p.$eval('.team-tabs', e => Math.round(e.getBoundingClientRect().top)); console.log('barre à', stuck, 'px du haut');
  if (stuck < 40 || stuck > 160) process.exitCode = 1;
  await p.screenshot({ path: __dirname + '/../traces/team-onglets-colles.png' });
  // Visiteur : Mototeam95 (non membre), un seul bouton Suivre.
  await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(300);
  await p.evaluate(() => { const x = document.createElement('button'); x.setAttribute('data-team-link', 't2'); document.getElementById('root').appendChild(x); x.click(); }); await p.waitForTimeout(900);
  const t2 = await tabsOf(); const acts = (await p.$('[data-action="follow-team"]') ? 'Suivre' : '') + (await p.$('[data-action="team-like-toggle"]') ? " J'aime" : '');
  const sec = await p.$eval('[data-team-sec="bientot"]', e => e.innerText.replace(/\n+/g, ' | ').slice(0, 160));
  console.log('visiteur onglets:', t2, '| actions:', acts, '| roulages:', sec);
  if (!/^\*Prochains roulages · 9/i.test(t2) || /J'aime|Aimé/.test(acts) || !/Suivre/.test(acts) || !/Le Mans/.test(sec) || !/Réserver/.test(sec)) process.exitCode = 1;
  await p.screenshot({ path: __dirname + '/../traces/team-onglets-visiteur.png' });
  console.log('largeur', await p.evaluate(() => document.documentElement.scrollWidth));
  console.log('errs', JSON.stringify(errs)); if (errs.length) process.exitCode = 1;
  await b.close();
})();
