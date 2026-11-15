// Tests des règles Firestore (firestore.rules) sur l'émulateur Firebase.
// Lancés par GitHub Actions avant chaque publication (voir publier.yml) :
//   npx firebase-tools emulators:exec --only firestore --project demo-pitbook \
//     "node --test _banc-de-test/regles/"
// Chaque test vérifie qu'une personne lit ou écrit seulement ce qu'elle doit.
import { test, before, after, beforeEach } from 'node:test';
import fs from 'node:fs';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, addDoc, collection, query, where, getDocs, deleteField } from 'firebase/firestore';

const ADMIN = 'PHBkRpkSSGeDFFb3uSxmeP7XvPc2';
let env;
const ctx = (uid, verified = true) => env.authenticatedContext(uid, { email_verified: verified, firebase: { sign_in_provider: 'password' } }).firestore();
const anon = () => env.unauthenticatedContext().firestore();

before(async () => {
  env = await initializeTestEnvironment({ projectId: 'demo-pitbook', firestore: { rules: fs.readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 } });
});
after(async () => { if (env) await env.cleanup(); });
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (c) => {
    const db = c.firestore(), s = (p, d) => setDoc(doc(db, p), d);
    await s('users/' + ADMIN, { name: 'Xav', role: 'pilote' });
    await s('users/lead', { name: 'Lea', role: 'organisateur' });
    await s('users/memb', { name: 'Mo', role: 'pilote' });
    await s('users/rider', { name: 'Rik', role: 'pilote' });
    await s('users/other', { name: 'Oto', role: 'pilote' });
    await s('userPrivate/rider', { email: 'rik@example.com' });
    await s('teams/t1', { id: 't1', name: 'Team Un', createdBy: 'Lea', memberCount: 2 });
    await s('teamMembers/t1_Lea', { teamId: 't1', name: 'Lea', role: 'leader', uid: 'lead' });
    await s('teamMembers/t1_Mo', { teamId: 't1', name: 'Mo', role: 'member', uid: 'memb' });
    await s('events/e1', { id: 'e1', circuit: 'Mugello', dateStart: '2026-12-01', dateEnd: '2026-12-01', teamId: 't1', riders: ['Mo'], eventVisibility: 'membre' });
    await s('eventJoinRequests/e1_Rik', { eventId: 'e1', teamId: 't1', circuit: 'Mugello', from: 'Rik', fromUid: 'rider', status: 'pending' });
    await s('teamJoinRequests/t1_Rik', { teamId: 't1', teamName: 'Team Un', from: 'Rik', kind: 'member', status: 'pending', uid: 'rider' });
    await s('teamInvites/t1_Rik', { teamId: 't1', teamName: 'Team Un', from: 'Lea', fromUid: 'lead', to: 'Rik', toUid: 'rider', status: 'pending' });
    await s('coachRequests/c1', { from: 'Rik', fromUid: 'rider', to: 'Lea', toUid: 'lead', status: 'pending', type: 'coaching' });
    await s('eventDecisions/d1', { eventId: 'e1', teamId: 't1', circuit: 'Mugello', dateStart: '2026-12-01', to: 'Rik', toUid: 'rider', from: 'Lea', fromUid: 'lead', decision: 'refused', createdAt: 1 });
    await s('wallPosts/p1', { author: 'Rik', authorUid: 'rider', audience: 'friends', visibleTo: ['memb'], text: 'entre amis', createdAt: 1 });
    await s('directMessages/m1', { convId: 'rider_memb', members: ['rider', 'memb'], from: 'rider', fromName: 'Rik', toName: 'Mo', text: 'salut', createdAt: 1 });
    await s('teamFeed/f1', { id: 'f1', teamId: 't1', author: 'Lea', authorUid: 'lead', photoURL: 'data:image/jpeg;base64,xx', createdAt: 1 });
    await s('serviceStatus/mail', { okToday: 1 });
    await s('usageStats/chrono', { count: 3 });
  });
});

// ---- Accès de base ----
test('sans compte : rien de lisible', async () => {
  await assertFails(getDoc(doc(anon(), 'users/rider')));
  await assertFails(getDoc(doc(anon(), 'events/e1')));
});
test('adresse non confirmée : seulement sa propre fiche', async () => {
  await assertSucceeds(getDoc(doc(ctx('rider', false), 'users/rider')));
  await assertFails(getDoc(doc(ctx('rider', false), 'users/other')));
});
test('compte confirmé : lit les profils', async () => {
  await assertSucceeds(getDoc(doc(ctx('other'), 'users/rider')));
});

// ---- Profils ----
test('on ne modifie pas la fiche d\'un autre ; l\'admin oui', async () => {
  await assertFails(updateDoc(doc(ctx('other'), 'users/rider'), { bike: 'R1' }));
  await assertSucceeds(updateDoc(doc(ctx(ADMIN), 'users/rider'), { bike: 'R1' }));
});
test('on ne se donne pas soi-même un badge ou Pitbook+', async () => {
  for (const k of ['certified', 'pro', 'plus', 'organizer', 'coach']) await assertFails(updateDoc(doc(ctx('rider'), 'users/rider'), { [k]: true }));
});
test('fiche privée (adresse) : le titulaire et l\'admin seulement', async () => {
  await assertSucceeds(getDoc(doc(ctx('rider'), 'userPrivate/rider')));
  await assertFails(getDoc(doc(ctx('other'), 'userPrivate/rider')));
  await assertSucceeds(getDoc(doc(ctx(ADMIN), 'userPrivate/rider')));
});

// ---- Demandes et invitations (privées depuis le 14/11) ----
test('demande pour un roulage : le demandeur et le Team Leader, pas les autres', async () => {
  await assertSucceeds(getDoc(doc(ctx('rider'), 'eventJoinRequests/e1_Rik')));
  await assertSucceeds(getDoc(doc(ctx('lead'), 'eventJoinRequests/e1_Rik')));
  await assertFails(getDoc(doc(ctx('memb'), 'eventJoinRequests/e1_Rik')));
  await assertFails(getDoc(doc(ctx('other'), 'eventJoinRequests/e1_Rik')));
});
test('lectures de l\'appli : mes demandes, et celles de mon team pour le Team Leader', async () => {
  await assertSucceeds(getDocs(query(collection(ctx('rider'), 'eventJoinRequests'), where('from', '==', 'Rik'))));
  await assertSucceeds(getDocs(query(collection(ctx('lead'), 'eventJoinRequests'), where('teamId', '==', 't1'))));
  await assertSucceeds(getDocs(query(collection(ctx('lead'), 'teamJoinRequests'), where('teamId', '==', 't1'))));
  await assertFails(getDocs(query(collection(ctx('memb'), 'eventJoinRequests'), where('teamId', '==', 't1'))));
});
test('mise en attente : par le Team Leader, pas par le demandeur', async () => {
  await assertFails(updateDoc(doc(ctx('rider'), 'eventJoinRequests/e1_Rik'), { status: 'waiting' }));
  await assertSucceeds(updateDoc(doc(ctx('lead'), 'eventJoinRequests/e1_Rik'), { status: 'waiting' }));
  await assertFails(updateDoc(doc(ctx('lead'), 'eventJoinRequests/e1_Rik'), { status: 'waiting', from: 'Oto' }));
});
test('demande pour un team, invitation, coaching : seulement les concernés', async () => {
  await assertSucceeds(getDoc(doc(ctx('rider'), 'teamJoinRequests/t1_Rik')));
  await assertFails(getDoc(doc(ctx('other'), 'teamJoinRequests/t1_Rik')));
  await assertSucceeds(getDoc(doc(ctx('rider'), 'teamInvites/t1_Rik')));
  await assertSucceeds(getDoc(doc(ctx('lead'), 'teamInvites/t1_Rik')));
  await assertFails(getDoc(doc(ctx('other'), 'teamInvites/t1_Rik')));
  await assertSucceeds(getDoc(doc(ctx('lead'), 'coachRequests/c1')));
  await assertFails(getDoc(doc(ctx('other'), 'coachRequests/c1')));
  await assertSucceeds(getDocs(query(collection(ctx('rider'), 'teamInvites'), where('to', '==', 'Rik'))));
  await assertSucceeds(getDocs(query(collection(ctx('rider'), 'coachRequests'), where('from', '==', 'Rik'))));
});

// ---- Décisions de l'orga ----
test('décision : envoyée par le Team Leader, lue et effacée par l\'inscrit', async () => {
  const d = { eventId: 'e1', teamId: 't1', circuit: 'Mugello', dateStart: '2026-12-01', to: 'Rik', toUid: 'rider', decision: 'accepted', createdAt: 2 };
  await assertSucceeds(addDoc(collection(ctx('lead'), 'eventDecisions'), Object.assign({ from: 'Lea', fromUid: 'lead' }, d)));
  await assertFails(addDoc(collection(ctx('other'), 'eventDecisions'), Object.assign({ from: 'Oto', fromUid: 'other' }, d)));
  await assertSucceeds(getDoc(doc(ctx('rider'), 'eventDecisions/d1')));
  await assertFails(getDoc(doc(ctx('other'), 'eventDecisions/d1')));
  await assertSucceeds(getDocs(query(collection(ctx('rider'), 'eventDecisions'), where('toUid', '==', 'rider'))));
  await assertSucceeds(deleteDoc(doc(ctx('rider'), 'eventDecisions/d1')));
});

// ---- Posts et messages ----
test('post « amis » : visible des destinataires seulement', async () => {
  await assertSucceeds(getDoc(doc(ctx('memb'), 'wallPosts/p1')));
  await assertFails(getDoc(doc(ctx('other'), 'wallPosts/p1')));
});
test('message privé : ses deux participants seulement', async () => {
  await assertSucceeds(getDoc(doc(ctx('memb'), 'directMessages/m1')));
  await assertFails(getDoc(doc(ctx('other'), 'directMessages/m1')));
});
test('post de team : son auteur range la photo à part, personne d\'autre', async () => {
  await assertFails(updateDoc(doc(ctx('other'), 'teamFeed/f1'), { photoMedia: 'f1', photoURL: deleteField() }));
  await assertSucceeds(updateDoc(doc(ctx('lead'), 'teamFeed/f1'), { photoMedia: 'f1', photoURL: deleteField() }));
});

// ---- Images rangées à part ----
const img = 'data:image/jpeg;base64,AAAA';
test('bannière de team : le Team Leader, pas un membre', async () => {
  await assertSucceeds(setDoc(doc(ctx('lead'), 'teamMedia/t1'), { cover: img, updatedAt: 1 }));
  await assertFails(setDoc(doc(ctx('memb'), 'teamMedia/t1'), { cover: img, updatedAt: 1 }));
  await assertSucceeds(getDoc(doc(ctx('other'), 'teamMedia/t1')));
});
test('photo des horaires : le Team Leader du roulage, pas les autres', async () => {
  await assertSucceeds(setDoc(doc(ctx('lead'), 'eventMedia/e1'), { photo: img, updatedAt: 1 }));
  await assertFails(setDoc(doc(ctx('memb'), 'eventMedia/e1'), { photo: img, updatedAt: 1 }));
});
test('bannière de profil : son propriétaire et l\'admin', async () => {
  await assertSucceeds(setDoc(doc(ctx('rider'), 'userMedia/rider'), { cover: img, updatedAt: 1 }));
  await assertFails(setDoc(doc(ctx('other'), 'userMedia/rider'), { cover: img, updatedAt: 1 }));
  await assertSucceeds(setDoc(doc(ctx(ADMIN), 'userMedia/rider'), { cover: img, updatedAt: 1 }));
  await assertFails(setDoc(doc(ctx('rider'), 'userMedia/rider'), { cover: 'pas une image', updatedAt: 1 }));
});

// ---- Admin et technique ----
test('état de Pitbook, réglages des stats : admin seulement', async () => {
  await assertFails(getDoc(doc(ctx('other'), 'serviceStatus/mail')));
  await assertSucceeds(getDoc(doc(ctx(ADMIN), 'serviceStatus/mail')));
  await assertFails(setDoc(doc(ctx('other'), 'settings/adminStats'), { ignoredUids: [] }));
  await assertSucceeds(setDoc(doc(ctx(ADMIN), 'settings/adminStats'), { ignoredUids: [] }));
});
test('erreurs de l\'appli : tout compte connecté écrit, l\'admin seul lit', async () => {
  const e = { msg: 'oups', src: '/app.js', line: 1, col: 2, stack: '', ver: '2026110318', device: 'iPhone Safari/17', at: 1 };
  await assertSucceeds(addDoc(collection(ctx('other'), 'clientErrors'), e));
  await assertFails(addDoc(collection(ctx('other'), 'clientErrors'), Object.assign({ uid: 'other' }, e)));
  await assertFails(addDoc(collection(anon(), 'clientErrors'), e));
  await assertFails(getDocs(collection(ctx('other'), 'clientErrors')));
  await assertSucceeds(getDocs(collection(ctx(ADMIN), 'clientErrors')));
});
test('compteurs d\'usage : +1 seulement, lus par l\'admin', async () => {
  const n = new Date(), mk = 'm' + n.getUTCFullYear() + '_' + (n.getUTCMonth() + 1);
  await assertSucceeds(updateDoc(doc(ctx('other'), 'usageStats/chrono'), { count: 4, [mk]: 1 }));
  await assertFails(updateDoc(doc(ctx('other'), 'usageStats/chrono'), { count: 50, [mk]: 1 }));
  await assertFails(getDoc(doc(ctx('other'), 'usageStats/chrono')));
});
test('avis et suggestions : chacun les siens, l\'admin tout', async () => {
  await assertSucceeds(addDoc(collection(ctx('rider'), 'feedback'), { text: 'top', author: 'Rik', authorUid: 'rider', createdAt: 1, rating: 5, kind: 'avis' }));
  await assertFails(addDoc(collection(ctx('rider'), 'feedback'), { text: 'faux', author: 'Oto', authorUid: 'other', createdAt: 1 }));
  await assertFails(getDocs(collection(ctx('rider'), 'feedback')));
  await assertSucceeds(getDocs(collection(ctx(ADMIN), 'feedback')));
});

// ---- Compte confirmé (suggestions d'amis) ----
test('emailOk : posé seulement par un compte à l\'adresse confirmée', async () => {
  await assertFails(updateDoc(doc(ctx('rider', false), 'users/rider'), { emailOk: true }));
  await assertSucceeds(updateDoc(doc(ctx('rider'), 'users/rider'), { emailOk: true }));
});
