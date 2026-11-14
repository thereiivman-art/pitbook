// Notifications push de Pitbook.
// Chaque fonction se déclenche quand un document arrive dans Firestore
// (message, commentaire, abonnement, annonce de roulage) et envoie une
// notification aux appareils du destinataire via Firebase Cloud Messaging.
// Les jetons des appareils et les choix de chacun sont dans
// userPrivate/{uid}.push : { tokens: { <clé>: { token, at, ua } }, types: { messages, comments, follows, roulages }, lang }.
// Fonctions 1re génération : pas besoin que leur région corresponde à celle de Firestore.
const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();
const fn = functions.region('europe-west1').runWith({ memory: '256MB', timeoutSeconds: 30, maxInstances: 10 });

const cut = (s, n) => { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1) + '…' : s; };
const T = (lang, fr, en) => (lang === 'en' ? en : fr);

async function uidByName(name) {
  if (!name) return null;
  const s = await db.collection('users').where('name', '==', name).limit(1).get();
  return s.empty ? null : s.docs[0].id;
}

// État du service, lu par la carte admin « État de Pitbook » :
// serviceStatus/{mail|push} = { day, okToday, errToday, lastOkAt, lastErrAt, lastErr }.
async function serviceLog(kind, okN, errN, errText) {
  if (!okN && !errN) return;
  const ref = db.collection('serviceStatus').doc(kind), day = new Date().toISOString().slice(0, 10);
  try {
    await db.runTransaction(async (tx) => {
      const d = await tx.get(ref), v = d.exists ? d.data() : {}, same = v.day === day;
      const upd = { day, okToday: (same ? v.okToday || 0 : 0) + okN, errToday: (same ? v.errToday || 0 : 0) + errN };
      if (okN) upd.lastOkAt = Date.now();
      if (errN) { upd.lastErrAt = Date.now(); upd.lastErr = String(errText || '').slice(0, 300); }
      tx.set(ref, upd, { merge: true });
    });
  } catch (e) { console.error('serviceLog', e); }
}

// Envoie à tous les appareils d'un compte, si ce type de notification est activé.
// build(lang) renvoie { title, body, go, tag }.
async function sendTo(uid, type, build) {
  if (!uid) return;
  const snap = await db.collection('userPrivate').doc(uid).get();
  const push = snap.exists ? snap.data().push : null;
  if (!push || !push.tokens) return;
  if (push.types && push.types[type] === false) return;
  const entries = Object.entries(push.tokens).filter(([, v]) => v && typeof v.token === 'string');
  if (!entries.length) return;
  const m = build(push.lang || 'fr');
  const res = await admin.messaging().sendEachForMulticast({
    tokens: entries.map(([, v]) => v.token),
    // Message « data » seulement : c'est sw.js qui affiche la notification
    // (et ne l'affiche pas si Pitbook est déjà ouvert devant les yeux).
    data: { title: cut(m.title, 80), body: cut(m.body, 180), go: m.go || '', tag: m.tag || type },
    webpush: { headers: { Urgency: 'high', TTL: '86400' } }
  });
  // Appareils désinscrits (appli supprimée, autorisation retirée) : on les oublie.
  const dead = {};
  res.responses.forEach((r, i) => {
    const code = (r.error && r.error.code) || '';
    if (!r.success && /registration-token-not-registered|invalid-registration-token|invalid-argument/.test(code)) {
      dead['push.tokens.' + entries[i][0]] = admin.firestore.FieldValue.delete();
    }
  });
  if (Object.keys(dead).length) await db.collection('userPrivate').doc(uid).update(dead).catch(() => {});
  const firstErr = res.responses.find((r) => !r.success);
  // Un appareil désinscrit n'est pas une panne : seules les vraies erreurs comptent.
  const realErr = res.responses.filter((r) => !r.success && !/registration-token-not-registered|invalid-registration-token/.test((r.error && r.error.code) || '')).length;
  await serviceLog('push', res.successCount, realErr, firstErr && firstErr.error ? firstErr.error.code + ' ' + firstErr.error.message : '');
}

// Message privé.
exports.pushDirectMessage = fn.firestore.document('directMessages/{id}').onCreate(async (snap) => {
  const d = snap.data();
  const to = (d.members || []).filter((u) => u !== d.from);
  await Promise.all(to.map((uid) => sendTo(uid, 'messages', () => ({
    title: d.fromName, body: d.text, go: 'dm:' + d.fromName, tag: 'dm:' + d.convId
  }))));
});

// Message dans un groupe (amis, team, discussion d'un roulage).
exports.pushGroupMessage = fn.firestore.document('groupChats/{gid}/messages/{mid}').onCreate(async (snap, ctx) => {
  const d = snap.data();
  const g = await db.collection('groupChats').doc(ctx.params.gid).get();
  if (!g.exists) return;
  const grp = g.data();
  const to = (grp.members || []).filter((u) => u !== d.from);
  await Promise.all(to.map((uid) => sendTo(uid, 'messages', () => ({
    title: grp.name || 'Groupe', body: d.fromName + ' : ' + d.text, go: 'dm:grp:' + ctx.params.gid, tag: 'grp:' + ctx.params.gid
  }))));
});

// Message à un team : au pilote quand le team répond, aux Team Leaders sinon.
exports.pushTeamMessage = fn.firestore.document('teamMessages/{id}').onCreate(async (snap) => {
  const d = snap.data();
  if (d.asTeam) {
    if (d.userUid === d.from) return;
    await sendTo(d.userUid, 'messages', () => ({ title: d.teamName, body: d.text, go: 'dm:team:' + d.teamId, tag: 'tm:' + d.convId }));
    return;
  }
  const leaders = await db.collection('teamMembers').where('teamId', '==', d.teamId).where('role', '==', 'leader').get();
  const uids = await Promise.all(leaders.docs.map((x) => uidByName(x.data().name)));
  await Promise.all([...new Set(uids)].filter((u) => u && u !== d.from).map((uid) => sendTo(uid, 'messages', (lang) => ({
    title: d.userName + T(lang, ' à ', ' to ') + d.teamName, body: d.text, go: 'dm:tu:' + d.convId, tag: 'tm:' + d.convId
  }))));
});

// Commentaire sur mon post, ou réponse à mon commentaire.
exports.pushComment = fn.firestore.document('postComments/{id}').onCreate(async (snap) => {
  const c = snap.data();
  const post = await db.collection('wallPosts').doc(String(c.postId || '')).get();
  const ownerUid = post.exists ? post.data().authorUid : null;
  const sent = new Set([c.authorUid]);
  if (ownerUid && !sent.has(ownerUid)) {
    sent.add(ownerUid);
    await sendTo(ownerUid, 'comments', (lang) => ({
      title: c.author + T(lang, ' a commenté ton post', ' commented on your post'), body: c.text, go: 'post:' + c.postId, tag: 'post:' + c.postId
    }));
  }
  if (c.replyTo) {
    const r = await uidByName(c.replyTo);
    if (r && !sent.has(r)) await sendTo(r, 'comments', (lang) => ({
      title: c.author + T(lang, ' t\'a répondu', ' replied to you'), body: c.text, go: 'post:' + c.postId, tag: 'post:' + c.postId
    }));
  }
});

// Nouvel abonné (ou nouvel ami, s'il me suivait déjà).
exports.pushFollow = fn.firestore.document('follows/{id}').onCreate(async (snap) => {
  const f = snap.data();
  if ((f.followeeType || 'user') !== 'user' || !f.followee || f.followee === f.follower) return;
  const uid = f.followeeUid || await uidByName(f.followee);
  if (!uid) return;
  const back = await db.collection('follows').where('follower', '==', f.followee).where('followee', '==', f.follower).limit(1).get();
  await sendTo(uid, 'follows', (lang) => ({
    title: back.empty ? T(lang, 'Nouvel abonné', 'New follower') : T(lang, 'Nouvel ami', 'New friend'),
    body: f.follower + (back.empty ? T(lang, ' s\'est abonné à toi', ' followed you') : T(lang, ' te suit aussi : vous êtes amis', ' follows you back: you\'re friends')),
    go: 'person:' + f.follower, tag: 'follow'
  }));
});

// Annonce de l'orga sur un roulage : à tous ses inscrits.
exports.pushEventAnnouncement = fn.firestore.document('eventAnnouncements/{id}').onCreate(async (snap) => {
  const a = snap.data();
  const ev = await db.collection('events').doc(String(a.eventId || '')).get();
  if (!ev.exists) return;
  const e = ev.data();
  const uids = await Promise.all((e.riders || []).filter((n) => n !== a.from).slice(0, 200).map(uidByName));
  await Promise.all([...new Set(uids)].filter((u) => u && u !== a.fromUid).map((uid) => sendTo(uid, 'roulages', (lang) => ({
    title: T(lang, 'Roulage ', 'Trackday ') + (e.circuit || ''), body: a.text, go: 'ev:' + a.eventId, tag: 'ev:' + a.eventId
  }))));
});

// ---- Mails Pitbook (confirmation d'adresse, mot de passe oublié) ----
// Envoyés depuis l'adresse @pitbook.fr, par le serveur d'envoi d'OVH, à la
// place des mails de Firebase (dont le texte n'est pas modifiable).
// Secrets (jamais dans le code) : SMTP_USER (l'adresse) et SMTP_PASS (son
// mot de passe), posés avec « firebase functions:secrets:set ».
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const mailFn = functions.region('europe-west1').runWith({ memory: '256MB', timeoutSeconds: 30, maxInstances: 5, secrets: ['SMTP_USER', 'SMTP_PASS'] });
const CONTINUE_URL = 'https://pitbook.fr/?verifie=1';

function esc(s) { return String(s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function mailHtml(lang, kind, name, link, email) {
  const fr = lang !== 'en';
  const t = kind === 'verify'
    ? (fr ? { h: 'Bienvenue sur Pitbook !', a: 'Ton carnet de bord de la piste est prêt : tes chronos, tes roulages, tes records par circuit et le podium entre potes.', b: 'Il reste une étape : confirme ton adresse e-mail.', btn: 'Confirmer mon adresse', no: 'Tu n\'as pas créé de compte Pitbook ? Ignore ce message.' }
          : { h: 'Welcome to Pitbook!', a: 'Your track logbook is ready: your lap times, trackdays, records per circuit and the podium with your mates.', b: 'One last step: confirm your email address.', btn: 'Confirm my email', no: 'Didn\'t create a Pitbook account? Just ignore this email.' })
    : (fr ? { h: 'Nouveau mot de passe', a: 'Tu as demandé à changer le mot de passe de ton compte Pitbook (' + email + ').', b: '', btn: 'Choisir un mot de passe', no: 'Ce n\'est pas toi ? Ignore ce message : ton mot de passe ne change pas.' }
          : { h: 'New password', a: 'You asked to change the password of your Pitbook account (' + email + ').', b: '', btn: 'Choose a password', no: 'Not you? Just ignore this email: your password stays the same.' });
  const hi = fr ? 'Salut' : 'Hi', fallback = fr ? 'Le bouton ne marche pas ? Copie ce lien dans ton navigateur :' : 'Button not working? Paste this link into your browser:';
  const sign = fr ? 'À bientôt en piste,<br><strong>L\'équipe Pitbook</strong>' : 'See you on track,<br><strong>The Pitbook team</strong>';
  return '<div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;color:#14161a;line-height:1.5;">' +
    '<p style="font-size:22px;font-weight:bold;margin:0 0 16px;">' + esc(t.h) + '</p>' +
    '<p>' + hi + (name ? ' ' + esc(name) : '') + ',</p><p>' + esc(t.a) + '</p>' + (t.b ? '<p>' + esc(t.b) + '</p>' : '') +
    '<p style="margin:24px 0;"><a href="' + esc(link) + '" style="background:#c8261f;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:10px;display:inline-block;">' + esc(t.btn) + '</a></p>' +
    '<p style="font-size:13px;color:#6a6e76;">' + fallback + '<br>' + esc(link) + '</p>' +
    '<p style="font-size:13px;color:#6a6e76;">' + esc(t.no) + '</p>' +
    '<p style="margin-top:24px;">' + sign + '<br><a href="https://pitbook.fr" style="color:#c8261f;">pitbook.fr</a></p></div>';
}
function mailText(lang, kind, name, link) {
  const fr = lang !== 'en';
  return (fr ? 'Salut' : 'Hi') + (name ? ' ' + name : '') + ',\n\n' +
    (kind === 'verify' ? (fr ? 'Confirme ton adresse e-mail pour finir ton inscription sur Pitbook :' : 'Confirm your email address to finish signing up to Pitbook:')
      : (fr ? 'Choisis un nouveau mot de passe pour ton compte Pitbook :' : 'Choose a new password for your Pitbook account:')) +
    '\n' + link + '\n\n' + (fr ? 'L\'équipe Pitbook · pitbook.fr' : 'The Pitbook team · pitbook.fr');
}
async function sendMail(to, subject, html, text) {
  const user = process.env.SMTP_USER, pass = process.env.SMTP_PASS;
  const t = nodemailer.createTransport({ host: 'ssl0.ovh.net', port: 465, secure: true, auth: { user, pass } });
  await t.sendMail({ from: { name: 'Pitbook', address: user }, to, subject, html, text });
}
// Anti-abus, seuls les mails vraiment partis comptent (un échec ne bloque pas) :
// - par adresse : 1 toutes les 30 s, 10 par jour (3 pour « mot de passe oublié ») ;
// - par connexion (adresse IP) : 10 par heure ;
// - pour tout Pitbook : 300 par jour (garde la boîte contact@pitbook.fr hors des listes de spam).
const MAIL_GLOBAL_DAY = 300, MAIL_IP_HOUR = 10;
async function mailAllowed(key, ip, perDay) {
  const now = Date.now(), day = new Date().toISOString().slice(0, 10), hour = new Date().toISOString().slice(0, 13);
  const [a, b, g] = await Promise.all([db.collection('mailLimits').doc(key).get(), db.collection('mailLimits').doc('ip_' + hashKey(ip || '?')).get(), db.collection('mailLimits').doc('_global').get()]);
  const va = a.exists ? a.data() : {}, vb = b.exists ? b.data() : {}, vg = g.exists ? g.data() : {};
  if ((va.last && now - va.last < 30000) || (va.day === day ? va.n || 0 : 0) >= (perDay || 10)) return 'adresse';
  if ((vb.hour === hour ? vb.n || 0 : 0) >= MAIL_IP_HOUR) return 'connexion';
  if ((vg.day === day ? vg.n || 0 : 0) >= MAIL_GLOBAL_DAY) return 'plafond du jour';
  return '';
}
async function mailCounted(key, ip) {
  const day = new Date().toISOString().slice(0, 10), hour = new Date().toISOString().slice(0, 13), inc = admin.firestore.FieldValue.increment(1);
  await db.runTransaction(async (tx) => {
    const ra = db.collection('mailLimits').doc(key), rb = db.collection('mailLimits').doc('ip_' + hashKey(ip || '?')), rg = db.collection('mailLimits').doc('_global');
    const [a, b, g] = await Promise.all([tx.get(ra), tx.get(rb), tx.get(rg)]);
    const va = a.exists ? a.data() : {}, vb = b.exists ? b.data() : {}, vg = g.exists ? g.data() : {};
    tx.set(ra, { day, n: (va.day === day ? va.n || 0 : 0) + 1, last: Date.now() });
    tx.set(rb, { hour, n: (vb.hour === hour ? vb.n || 0 : 0) + 1 });
    tx.set(rg, { day, n: (vg.day === day ? vg.n || 0 : 0) + 1 });
  });
  await serviceLog('mail', 1, 0);
}
// Erreur d'envoi : écrite dans les journaux et dans la carte « État de Pitbook ».
async function mailFailed(step, e) {
  const why = ((e && (e.code || e.responseCode)) || '') + ' ' + ((e && e.message) || e);
  console.error('Mail Pitbook, échec à l\'étape « ' + step + ' » :', why);
  await serviceLog('mail', 0, 1, step + ' : ' + why);
  throw new functions.https.HttpsError('internal', 'Envoi impossible (' + step + ')');
}
const ipOf = (ctx) => { const r = ctx && ctx.rawRequest; return (r && ((r.headers && String(r.headers['x-forwarded-for'] || '').split(',')[0].trim()) || r.ip)) || ''; };
const hashKey = (s) => crypto.createHash('sha256').update(String(s).toLowerCase()).digest('hex').slice(0, 40);
async function pseudoOf(uid) { const u = await db.collection('users').doc(uid).get(); return u.exists ? u.data().name || '' : ''; }

// Confirmation d'adresse : pour le compte connecté qui l'appelle.
exports.sendVerificationMail = mailFn.https.onCall(async (data, ctx) => {
  if (!ctx.auth) throw new functions.https.HttpsError('unauthenticated', 'Connexion requise');
  const rec = await admin.auth().getUser(ctx.auth.uid);
  if (!rec.email) throw new functions.https.HttpsError('failed-precondition', 'Pas d\'adresse');
  if (rec.emailVerified) return { ok: true, already: true };
  const key = 'v_' + hashKey(rec.email), ip = ipOf(ctx);
  const blocked = await mailAllowed(key, ip, 10);
  if (blocked) throw new functions.https.HttpsError('resource-exhausted', 'Trop de mails (' + blocked + ')');
  const lang = data && data.lang === 'en' ? 'en' : 'fr';
  let link;
  try { link = await admin.auth().generateEmailVerificationLink(rec.email, { url: CONTINUE_URL }); } catch (e) { await mailFailed('lien de confirmation', e); }
  const name = await pseudoOf(ctx.auth.uid);
  try {
    await sendMail(rec.email, lang === 'en' ? 'Welcome to Pitbook: confirm your email' : 'Bienvenue sur Pitbook : confirme ton adresse',
      mailHtml(lang, 'verify', name, link), mailText(lang, 'verify', name, link));
  } catch (e) { await mailFailed('envoi par le serveur OVH', e); }
  await mailCounted(key, ip);
  console.log('Mail de bienvenue envoyé.');
  return { ok: true };
});

// Mot de passe oublié : on répond pareil que l'adresse ait un compte ou non
// (personne ne peut savoir qui est inscrit).
exports.sendResetMail = mailFn.https.onCall(async (data, ctx) => {
  const email = String((data && data.email) || '').trim().slice(0, 200);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new functions.https.HttpsError('invalid-argument', 'Adresse invalide');
  const key = 'r_' + hashKey(email), ip = ipOf(ctx);
  if (await mailAllowed(key, ip, 3)) return { ok: true };
  const lang = data && data.lang === 'en' ? 'en' : 'fr';
  let rec = null;
  try { rec = await admin.auth().getUserByEmail(email); } catch (e) { return { ok: true }; }
  let link;
  try { link = await admin.auth().generatePasswordResetLink(email, { url: 'https://pitbook.fr/' }); } catch (e) { await mailFailed('lien de mot de passe', e); }
  const name = await pseudoOf(rec.uid);
  try {
    await sendMail(email, lang === 'en' ? 'Pitbook: choose a new password' : 'Pitbook : choisis un nouveau mot de passe',
      mailHtml(lang, 'reset', name, link, email), mailText(lang, 'reset', name, link));
  } catch (e) { await mailFailed('envoi par le serveur OVH', e); }
  await mailCounted(key, ip);
  return { ok: true };
});

// ---- Sauvegarde automatique ----
// Chaque lundi à 4 h (heure de Paris) : export complet de Firestore dans le
// bucket gs://carnetpiste-sauvegardes (restaurable avec « gcloud firestore
// import »). Les anciens exports sont effacés par le bucket lui-même
// (règle de cycle de vie, 60 jours).
const BACKUP_BUCKET = 'gs://carnetpiste-sauvegardes';
exports.weeklyBackup = functions.region('europe-west1').runWith({ timeoutSeconds: 300, memory: '256MB' })
  .pubsub.schedule('every monday 04:00').timeZone('Europe/Paris').onRun(async () => {
    const client = new admin.firestore.v1.FirestoreAdminClient();
    const projectId = process.env.GCLOUD_PROJECT || JSON.parse(process.env.FIREBASE_CONFIG || '{}').projectId;
    const day = new Date().toISOString().slice(0, 10);
    try {
      const [op] = await client.exportDocuments({ name: client.databasePath(projectId, '(default)'), outputUriPrefix: BACKUP_BUCKET + '/' + day, collectionIds: [] });
      console.log('Sauvegarde lancée :', op.name);
      await serviceLog('backup', 1, 0);
    } catch (e) {
      console.error('Sauvegarde impossible :', e.message || e);
      await serviceLog('backup', 0, 1, (e && e.message) || String(e));
    }
  });

// ---- Comptes supprimés : copie de secours 30 jours ----
// Quand un compte est supprimé (par son pilote ou par l'admin), sa fiche
// publique et ses données privées sont copiées dans deletedAccounts/{uid}
// (lisible par l'admin seulement), puis effacées pour de bon au bout de
// 30 jours. Permet de rendre des pneus ou des réglages après une erreur.
exports.keepDeletedUser = fn.firestore.document('users/{uid}').onDelete(async (snap, ctx) => {
  const d = snap.data() || {};
  await db.collection('deletedAccounts').doc(ctx.params.uid).set({ name: d.name || '', user: d, deletedAt: Date.now() }, { merge: true });
});
exports.keepDeletedPrivate = fn.firestore.document('userPrivate/{uid}').onDelete(async (snap, ctx) => {
  const d = snap.data() || {};
  delete d.push; // les jetons d'appareils ne servent plus à rien
  await db.collection('deletedAccounts').doc(ctx.params.uid).set({ private: d, deletedAt: Date.now() }, { merge: true });
});
exports.purgeDeletedAccounts = functions.region('europe-west1').runWith({ timeoutSeconds: 120, memory: '256MB' })
  .pubsub.schedule('every day 03:30').timeZone('Europe/Paris').onRun(async () => {
    const old = await db.collection('deletedAccounts').where('deletedAt', '<', Date.now() - 30 * 86400000).limit(200).get();
    await Promise.all(old.docs.map((d) => d.ref.delete()));
    if (old.size) console.log('Comptes supprimés effacés pour de bon :', old.size);
  });

// ---- Changement de pseudo : les fiches des autres comptes suivent ----
// Les règles empêchent un compte de modifier la fiche d'un autre : quand
// « Patrick » devient « Patno777 », ses suiveurs gardaient « Patrick »
// dans leurs pilotes suivis. Cette fonction met à jour, côté serveur :
// pilotes suivis, amis mis en avant, parrain, et pilotes mis en avant
// d'un team.
async function renameRefs(oldName, newName) {
  if (!oldName || !newName || oldName === newName) return 0;
  const swap = (arr) => (arr || []).map((n) => (n === oldName ? newName : n)).filter((n, i, a) => a.indexOf(n) === i);
  const [fr, ff, fu, rb, tr] = await Promise.all([
    db.collection('users').where('followedRiders', 'array-contains', oldName).get(),
    db.collection('users').where('look.favFriends', 'array-contains', oldName).get(),
    db.collection('users').where('look.favRiders', 'array-contains', oldName).get(),
    db.collection('users').where('referredBy', '==', oldName).get(),
    db.collection('teams').where('look.favRiders', 'array-contains', oldName).get()
  ]);
  const updates = new Map();
  const add = (ref, k, v) => { const u = updates.get(ref.path) || { ref, data: {} }; u.data[k] = v; updates.set(ref.path, u); };
  fr.docs.forEach((d) => add(d.ref, 'followedRiders', swap(d.data().followedRiders)));
  ff.docs.forEach((d) => add(d.ref, 'look.favFriends', swap((d.data().look || {}).favFriends)));
  fu.docs.forEach((d) => add(d.ref, 'look.favRiders', swap((d.data().look || {}).favRiders)));
  rb.docs.forEach((d) => add(d.ref, 'referredBy', newName));
  tr.docs.forEach((d) => add(d.ref, 'look.favRiders', swap((d.data().look || {}).favRiders)));
  const list = [...updates.values()];
  for (let i = 0; i < list.length; i += 400) {
    const batch = db.batch();
    list.slice(i, i + 400).forEach((u) => batch.update(u.ref, u.data));
    await batch.commit();
  }
  return list.length;
}
exports.renameEverywhere = fn.firestore.document('users/{uid}').onUpdate(async (change) => {
  const before = change.before.data() || {}, after = change.after.data() || {};
  if (!before.name || !after.name || before.name === after.name) return;
  const n = await renameRefs(before.name, after.name);
  console.log('Pseudo « ' + before.name + ' » → « ' + after.name + ' » : ' + n + ' fiche(s) mise(s) à jour.');
});
exports._renameRefs = renameRefs;
