// Fiche d'un team en onglets collants (maquette A) : Roulages (À venir / Passés)
// ouvert d'abord, Posts, Saisons… ; un seul bouton Suivre (plus de cœur).
const { chromium, BASE } = require('../lib');
(async () => {
  const lang = process.argv[2] || 'fr';
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 390, height: 900 }, deviceScaleFactor: 2 }); p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + 'index.html#lang=' + lang + '&role=orga'); await p.waitForTimeout(1600);
  await p.evaluate(() => { const db = firebase.firestore(), cs = ['Le Mans', 'Carole', 'Navarra', 'Assen', 'Mas du Clos', 'Le Vigeant', 'Misano', 'Brno', 'Mugello'];
    ['t1', 't2'].forEach(t => cs.forEach((c, i) => { const m = String(1 + i).padStart(2, '0'), id = t + 'e' + i;
      db.collection('events').doc(id).set({ id: id, teamId: t, circuit: c, dateStart: '2027-' + m + '-15', dateEnd: '2027-' + m + '-16', riders: i === 0 ? ['Sam'] : [], eventVisibility: 'public', bookingUrl: i < 2 ? 'https://www.billetweb.fr/x' : null, note: i < 3 ? '~' + (400 + i * 10) + ' €' : '' }); }));
    db.collection('teamFeed').add({ teamId: 't1', author: 'Sam', text: 'Super journée au Mans !', createdAt: Date.now() - 3600e3 });
  });
  await p.waitForTimeout(500);
  const tabsOf = () => p.$$eval('.team-tab', e => e.map(x => (x.classList.contains('on') ? '*' : '') + x.innerText).join(' / '));
  // Responsable
  await p.click('.bottom-nav-btn:nth-child(1)'); await p.waitForTimeout(300);
  await p.click('.subnav-btn[data-view="team"]'); await p.waitForTimeout(400);
  await p.getByText('Team Piste').first().click(); await p.waitForTimeout(800);
  const t1 = await tabsOf(); console.log('orga onglets:', t1);
  if (!/^\*Roulages \/ Posts \/ Saisons \/ Palmarès \/ Membres \/ Infos \/ Audience$/i.test(t1)) process.exitCode = 1;
  const grey = await p.$$eval('.person-hero button[disabled]', e => e.map(x => x.innerText).join(' / ')); console.log('grisés (responsable):', grey);
  if (grey !== "S'abonner / Rejoindre") process.exitCode = 1;
  if (await p.$('.mp-tile, .team-next-band, .team-like')) { console.log('restes de tuiles/bande/cœur'); process.exitCode = 1; }
  await p.click('[data-team-tab="infos"]'); await p.waitForTimeout(200);
  const infos = await p.$eval('[data-team-sec="infos"]', e => e.innerText.replace(/\n+/g, ' ')); console.log('Infos:', infos.slice(0, 80));
  if (!/Réseaux/.test(infos) || !/Sponsors/i.test(infos)) process.exitCode = 1;
  await p.click('[data-team-tab="bientot"]'); await p.waitForTimeout(200);
  await p.screenshot({ path: __dirname + '/../traces/team-onglets-orga.png' });
  await p.click('[data-team-tab="membres"]'); await p.waitForTimeout(300);
  const subs = await p.$$eval('[data-team-sec="membres"] [data-tsub]', e => e.map(x => x.innerText).join(' / ')); console.log('membres:', subs);
  if (!/^Membres \/ Orga \/ Pilotes \/ Coachs \/ Abonnés$/.test(subs)) process.exitCode = 1;
  const membTxt = await p.$eval('[data-tsub-sec$=":membres"]', e => e.innerText);
  if (/Abonnés \(/.test(membTxt)) { console.log('Abonnés encore sous Membres'); process.exitCode = 1; }
  // Ordinateur : les onglets collent tout en haut (pas de barre au-dessus).
  await p.setViewportSize({ width: 1280, height: 800 }); await p.waitForTimeout(400);
  await p.click('[data-team-tab="bientot"]'); await p.waitForTimeout(300);
  await p.evaluate(() => window.scrollTo(0, 1500)); await p.waitForTimeout(400);
  const deskTop = await p.$eval('.team-tabs', e => Math.round(e.getBoundingClientRect().top)); console.log('ordinateur : barre à', deskTop, 'px');
  if (deskTop > 4) process.exitCode = 1;
  await p.screenshot({ path: __dirname + '/../traces/team-onglets-ordi.png' });
  await p.setViewportSize({ width: 390, height: 900 }); await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(400);
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
  if (!/^\*Roulages \/ Posts \/ Saisons \/ Infos$/i.test(t2) || /J'aime|Aimé/.test(acts) || !/Suivre/.test(acts) || !/À venir · 9/.test(sec) || !/Le Mans/.test(sec) || /Réserver/.test(sec)) process.exitCode = 1;
  // Passés en un geste, sans défiler.
  await p.click('[data-team-sec="bientot"] [data-tsub-k="passes"]'); await p.waitForTimeout(200);
  console.log('passés visibles:', await p.$eval('[data-team-sec="bientot"] [data-tsub-sec$=":passes"]', e => !e.hidden));
  // Se désabonner : confirmation, puis libellé clair.
  p.once('dialog', d => { console.log('confirm:', d.message().slice(0, 40)); d.accept(); });
  await p.click('[data-action="follow-team"]'); await p.waitForTimeout(500);
  const un = await p.$eval('[data-action="unfollow-team"]', e => e.innerText).catch(() => 'absent'); console.log('après Suivre:', un);
  if (un !== 'Se désabonner') process.exitCode = 1;
  if (!/\d\s*€/.test(sec)) { console.log('prix absents des lignes'); process.exitCode = 1; }
  await p.click('[data-action="unfollow-team"]'); await p.waitForTimeout(500);
  if (!(await p.$('[data-action="follow-team"]'))) process.exitCode = 1;

  await p.screenshot({ path: __dirname + '/../traces/team-onglets-visiteur.png' });
  console.log('largeur', await p.evaluate(() => document.documentElement.scrollWidth));
  console.log('errs', JSON.stringify(errs)); if (errs.length) process.exitCode = 1;
  await b.close();
})();
