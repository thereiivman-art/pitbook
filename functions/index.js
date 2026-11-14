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
